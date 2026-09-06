'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { picturebookQueries, PICTUREBOOK_PRESETS, PicturebookPreset, PicturebookProvider, PicturebookRun } from '@/lib/supabase-queries'
import { supabase } from '@/lib/supabase'
import { authedFetch } from '@/lib/authedFetch'

export interface PbRunStatus {
  status: string
  done: number
  total: number
  error?: string
}

export interface UsePicturebookReturn {
  // State
  preset: PicturebookPreset
  contentFilter: string
  provider: PicturebookProvider
  imageModel: string
  analysisModel: string
  guidance: string
  showAdvanced: boolean
  runStatus: PbRunStatus | null
  isGenerating: boolean

  // Setters
  setPreset: (p: PicturebookPreset) => void
  setContentFilter: (f: string) => void
  setProvider: (p: PicturebookProvider) => void
  setImageModel: (m: string) => void
  setAnalysisModel: (m: string) => void
  setGuidance: (g: string) => void
  setShowAdvanced: (v: boolean) => void

  // Actions
  generate: () => Promise<{ result?: string; reload?: boolean }>
  retryFailed: () => Promise<void>
  cancel: () => Promise<void>

  // WebGPU
  generateWebGPU: () => Promise<{ result?: string; reload?: boolean }>
}

const MAX_RETRIES = 10

export function usePicturebook(bookId: number): UsePicturebookReturn {
  const [preset, setPreset] = useState<PicturebookPreset>('literary')
  const [contentFilter, setContentFilter] = useState('moderate')
  const [provider, setProvider] = useState<PicturebookProvider>('openrouter')
  const [imageModel, setImageModel] = useState('black-forest-labs/flux.2-pro')
  const [analysisModel, setAnalysisModel] = useState('deepseek/deepseek-chat-v3')
  const [guidance, setGuidance] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [runStatus, setRunStatus] = useState<PbRunStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Auto-switch analysis model and content filter when preset changes
  const handleSetPreset = useCallback((p: PicturebookPreset) => {
    setPreset(p)
    const presetInfo = PICTUREBOOK_PRESETS[p]
    if (presetInfo) setContentFilter(presetInfo.contentFilter)
    // Use uncensored model for permissive presets
    if (p === 'romantic' || p === 'horror') setAnalysisModel('nousresearch/hermes-3-llama-3.1-405b')
    else if (p === 'custom') { /* keep current model selection */ }
    else setAnalysisModel('deepseek/deepseek-chat-v3')
  }, [])

  // Refs for latest values — avoids stale closures in callbacks
  const latestRef = useRef({ preset, contentFilter, provider, imageModel, analysisModel, guidance })
  useEffect(() => {
    latestRef.current = { preset, contentFilter, provider, imageModel, analysisModel, guidance }
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check for active/unfinished run on mount
  useEffect(() => {
    picturebookQueries.getLatestRun(bookId).then(run => {
      if (!run) return
      const isActive = run.status === 'analyzing' || run.status === 'generating'
      const isStale = isActive && Date.now() - new Date(run.started_at).getTime() > 300_000
      if (isActive && !isStale) {
        setRunStatus({ status: run.status, done: run.completed_moments, total: run.total_moments })
        setIsGenerating(true)
        startPolling()
      } else if (isStale || run.status === 'failed' || (run.status === 'completed' && run.completed_moments < run.total_moments)) {
        setRunStatus({ status: 'failed', done: run.completed_moments, total: run.total_moments, error: isStale ? 'Timed out' : run.error || undefined })
      }
    }).catch(() => {})
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [bookId])

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const run = await picturebookQueries.getLatestRun(bookId)
        if (!run) return
        setRunStatus({ status: run.status, done: run.completed_moments, total: run.total_moments, error: run.error || undefined })
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
          clearInterval(pollRef.current!)
          pollRef.current = null
        }
      } catch {}
    }, 3000)
  }, [bookId])

  const generate = useCallback(async (): Promise<{ result?: string; reload?: boolean }> => {
    if (isGenerating) return { result: 'Already generating' }
    setIsGenerating(true)
    setRunStatus({ status: 'analyzing', done: 0, total: 0 })

    try {
      // Read latest values from ref to avoid stale closures
      const { preset: p, contentFilter: cf, provider: prov, imageModel: im, analysisModel: am, guidance: g } = latestRef.current

      // Route through Cloud Run worker via /api/convert — no timeout limits
      const res = await authedFetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          mode: 'picturebook',
          preset: p,
          content_filter: cf,
          image_model: prov === 'openrouter' ? im : undefined,
          translate_model: am, // reused field for analysis LLM
          images_per_1000_words: 3.0,
          prompt: g.trim() || undefined,
        }),
      })
      const { job_id, error } = await res.json()
      if (error || !job_id) {
        setIsGenerating(false)
        setRunStatus(null)
        return { result: `Failed to start: ${error || 'No job ID'}` }
      }

      // Poll the convert job for progress
      const poll = async (): Promise<{ result?: string; reload?: boolean }> => {
        for (let i = 0; i < 600; i++) { // up to 30 minutes
          await new Promise(r => setTimeout(r, 3000))
          try {
            const statusRes = await authedFetch(`/api/convert?jobId=${job_id}`)
            const status = await statusRes.json()
            if (status.progress || status.total) {
              setRunStatus({ status: 'generating', done: status.progress ?? 0, total: status.total ?? 0 })
            }
            if (status.status === 'done') {
              setIsGenerating(false)
              setRunStatus(null)
              return {
                result: `Picturebook created with ${status.result?.images ?? '?'} illustrations!`,
                reload: !!status.result?.book_id,
              }
            }
            if (status.status === 'error') {
              setIsGenerating(false)
              setRunStatus({ status: 'failed', done: status.progress ?? 0, total: status.total ?? 0, error: status.error })
              return { result: `Error: ${status.error || 'Unknown'}` }
            }
          } catch {}
        }
        setIsGenerating(false)
        setRunStatus({ status: 'failed', done: 0, total: 0, error: 'Timed out waiting' })
        return { result: 'Generation timed out' }
      }

      return await poll()
    } catch (err: any) {
      setIsGenerating(false)
      setRunStatus(null)
      return { result: err.message || 'Generation failed' }
    }
  }, [bookId, preset, contentFilter, provider, imageModel, analysisModel, guidance, isGenerating])

  const generateWebGPU = useCallback(async (): Promise<{ result?: string; reload?: boolean }> => {
    if (isGenerating) return { result: 'Already generating' }
    setIsGenerating(true)
    setRunStatus({ status: 'analyzing', done: 0, total: 0 })

    try {
      // Step 1: Analyze only (server-side LLM)
      const { preset: p, contentFilter: cf, analysisModel: am, guidance: g } = latestRef.current
      const result = await picturebookQueries.generate(bookId, {
        preset: p, contentFilter: cf, analysisModel: am,
        ...(g.trim() && { analysisGuidance: g.trim() }),
        analyzeOnly: true, regenerate: true,
      })
      const moments = result.moments || []
      if (!moments.length) {
        setIsGenerating(false)
        setRunStatus(null)
        return { result: 'No illustration moments found' }
      }

      // Step 2: Check WebGPU support
      setRunStatus({ status: 'generating', done: 0, total: moments.length })
      const { generateImageWebGPU, checkWebGPUSupport } = await import(
        /* webpackChunkName: "webgpu-imagegen" */ '@/lib/webgpuImageGen'
      )
      const { supported, error: gpuErr } = await checkWebGPUSupport()
      if (!supported) {
        setIsGenerating(false)
        setRunStatus(null)
        return { result: `WebGPU not available: ${gpuErr}` }
      }

      // Step 3: Generate images client-side
      let done = 0
      for (const m of moments) {
        try {
          setRunStatus({ status: 'generating', done, total: moments.length })
          const blob = await generateImageWebGPU(m.imagePrompt, {
            model: 'schirrmacher/sd-turbo-onnx',
            steps: 4, width: 512, height: 512,
          })
          // Upload to storage
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')
          const path = `${user.id}/picturebook_${bookId}_m${m.momentIndex}_${Date.now()}.png`
          await supabase.storage.from('page-images').upload(path, blob, { contentType: 'image/png' })
          await supabase.from('picturebook_moments').update({
            image_url: path, image_model: 'sd-turbo-webgpu',
            generation_status: 'completed',
          }).eq('book_id', bookId).eq('moment_index', m.momentIndex)
          done++
        } catch (err) {
          console.error(`WebGPU image ${m.momentIndex} failed:`, err)
        }
      }

      setIsGenerating(false)
      if (done > 0) {
        setRunStatus(null)
        return { result: `Picturebook created with ${done} illustrations (local WebGPU, free)!`, reload: true }
      } else {
        setRunStatus({ status: 'failed', done: 0, total: moments.length })
        return { result: 'All WebGPU image generations failed' }
      }
    } catch (err: any) {
      setIsGenerating(false)
      setRunStatus(null)
      return { result: err.message || 'WebGPU generation failed' }
    }
  }, [bookId, preset, contentFilter, analysisModel, guidance, isGenerating])

  const retryFailed = useCallback(async () => {
    setIsGenerating(true)
    setRunStatus(prev => prev ? { ...prev, status: 'generating' } : { status: 'generating', done: 0, total: 0 })
    try {
      await picturebookQueries.retryFailed(bookId, { imageModel: provider === 'openrouter' ? imageModel : undefined })
      const finalRun = await picturebookQueries.getLatestRun(bookId)
      setRunStatus(null)
      setIsGenerating(false)
    } catch {
      const finalRun = await picturebookQueries.getLatestRun(bookId)
      setIsGenerating(false)
      setRunStatus({ status: 'failed', done: finalRun?.completed_moments ?? 0, total: finalRun?.total_moments ?? 0 })
    }
  }, [bookId, provider, imageModel])

  const cancel = useCallback(async () => {
    await picturebookQueries.cancel(bookId)
    if (pollRef.current) clearInterval(pollRef.current)
    setRunStatus(null)
    setIsGenerating(false)
  }, [bookId])

  return {
    preset, contentFilter, provider, imageModel, analysisModel, guidance, showAdvanced, runStatus, isGenerating,
    setPreset: handleSetPreset, setContentFilter, setProvider, setImageModel, setAnalysisModel, setGuidance, setShowAdvanced,
    generate, generateWebGPU, retryFailed, cancel,
  }
}
