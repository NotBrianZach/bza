'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { authedFetch } from '@/lib/authedFetch'
import { ensureSession } from '@/lib/anonAuth'
import { X, Play, Square, Camera, Loader2, Copy, Check, PanelRightOpen, PanelRightClose } from 'lucide-react'
import SitePanelSidebar from './SitePanelSidebar'

const FRAME_W = 1280
const FRAME_H = 720

interface Props {
  onClose: () => void
  initialUrl?: string
}

interface HbSession { id: string; embedUrl: string; adminToken: string; provider: 'hyperbeam' | 'neko' }
interface Extracted { title: string; text: string }

const LAST_URL_KEY = 'bza-site-last-url'

export default function SitePanel({ onClose, initialUrl }: Props) {
  const seededUrl = initialUrl || (typeof window !== 'undefined' ? (localStorage.getItem(LAST_URL_KEY) ?? '') : '')
  const [url, setUrl] = useState(seededUrl)
  const [session, setSession] = useState<HbSession | null>(null)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [copied, setCopied] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [overlaySize, setOverlaySize] = useState({ w: 0, h: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const hbRef = useRef<any>(null)
  const latestFrameRef = useRef<ImageBitmap | HTMLVideoElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  const startSession = useCallback(async () => {
    setStarting(true); setError(null)
    try {
      // Silently create an anonymous session if the user isn't signed in yet
      await ensureSession()
      const res = await authedFetch('/api/browser-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrl: url }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) throw new Error('You need to sign in to start a browsing session.')
        throw new Error(data.error ?? 'session start failed')
      }
      try { if (url) localStorage.setItem(LAST_URL_KEY, url) } catch {}
      setSession({ id: data.sessionRowId, embedUrl: data.embedUrl, adminToken: data.adminToken, provider: (data.provider === 'neko' ? 'neko' : 'hyperbeam') })
    } catch (e: any) {
      setError(e.message)
    } finally { setStarting(false) }
  }, [url])

  const endSession = useCallback(async () => {
    if (!session) return
    setEnding(true)
    try {
      await authedFetch('/api/browser-session?id=' + encodeURIComponent(session.id), { method: 'DELETE' })
    } catch {}
    hbRef.current?.destroy?.()
    hbRef.current = null
    setSession(null)
    setElapsed(0)
    setEnding(false)
  }, [session])

  // Mount Hyperbeam SDK when session is ready (Neko uses an iframe instead)
  useEffect(() => {
    if (!session || !containerRef.current) return
    if (session.provider === 'neko') return  // iframe renders below
    let cancelled = false
    ;(async () => {
      const mod = await import('@hyperbeam/web')
      const Hyperbeam = (mod as any).default ?? mod
      if (cancelled || !containerRef.current) return
      hbRef.current = await Hyperbeam(containerRef.current, session.embedUrl, {
        adminToken: session.adminToken,
      })
    })().catch(e => setError('Hyperbeam mount failed: ' + e.message))
    return () => {
      cancelled = true
      hbRef.current?.destroy?.()
      hbRef.current = null
    }
  }, [session])

  // Timer + idle heartbeat
  useEffect(() => {
    if (!session) return
    const tick = setInterval(() => setElapsed(e => e + 1), 1000)
    const heartbeat = setInterval(() => {
      authedFetch('/api/browser-session?id=' + encodeURIComponent(session.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => {})
    }, 30_000)
    return () => { clearInterval(tick); clearInterval(heartbeat) }
  }, [session])

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (hbRef.current) hbRef.current.destroy?.() }
  }, [])

  // Size overlay canvas to match the Hyperbeam container when capture mode toggles on
  useEffect(() => {
    if (!captureMode || !containerRef.current) return
    setOverlaySize({ w: containerRef.current.clientWidth, h: containerRef.current.clientHeight })
  }, [captureMode])

  const drawOverlay = useCallback(() => {
    const c = overlayRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, c.width, c.height)
    if (dragRef.current) {
      const { x1, y1, x2, y2 } = dragRef.current
      const x = Math.min(x1, x2), y = Math.min(y1, y2)
      const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
      ctx.clearRect(x, y, w, h)
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
    }
  }, [])

  useEffect(() => { if (captureMode) drawOverlay() }, [captureMode, overlaySize, drawOverlay])

  const onOverlayDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    dragRef.current = {
      x1: e.clientX - r.left, y1: e.clientY - r.top,
      x2: e.clientX - r.left, y2: e.clientY - r.top,
    }
    drawOverlay()
  }
  const onOverlayMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const r = e.currentTarget.getBoundingClientRect()
    dragRef.current = { ...dragRef.current, x2: e.clientX - r.left, y2: e.clientY - r.top }
    drawOverlay()
  }
  const onOverlayUp = async () => {
    const rect = dragRef.current
    dragRef.current = null
    const overlay = overlayRef.current
    if (!overlay || !session || !containerRef.current) { setCaptureMode(false); return }

    // Grab the SDK's <video> element from its shadow root
    const shadow = containerRef.current.shadowRoot
    const videoEl = (shadow?.querySelector('video') || containerRef.current.querySelector('video')) as HTMLVideoElement | null
    if (!videoEl || videoEl.readyState < 2) {
      setError('Video not ready — wait a moment and try again')
      setCaptureMode(false)
      return
    }

    const vw = videoEl.videoWidth || FRAME_W
    const vh = videoEl.videoHeight || FRAME_H
    const scaleX = vw / overlay.width
    const scaleY = vh / overlay.height
    let sx = 0, sy = 0, sw = vw, sh = vh
    const hasDrag = rect && Math.abs(rect.x2 - rect.x1) > 5 && Math.abs(rect.y2 - rect.y1) > 5
    if (hasDrag) {
      const rx = Math.min(rect!.x1, rect!.x2)
      const ry = Math.min(rect!.y1, rect!.y2)
      const rw = Math.abs(rect!.x2 - rect!.x1)
      const rh = Math.abs(rect!.y2 - rect!.y1)
      sx = Math.max(0, Math.round(rx * scaleX))
      sy = Math.max(0, Math.round(ry * scaleY))
      sw = Math.min(vw - sx, Math.round(rw * scaleX))
      sh = Math.min(vh - sy, Math.round(rh * scaleY))
    }

    const off = document.createElement('canvas')
    off.width = sw; off.height = sh
    const octx = off.getContext('2d')!
    try {
      octx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, sw, sh)
    } catch (e: any) {
      setError('Frame capture failed (likely CORS-tainted stream): ' + e.message)
      setCaptureMode(false)
      return
    }
    let b64: string
    try {
      b64 = off.toDataURL('image/png')
    } catch (e: any) {
      setError('Canvas readback failed (CORS-tainted): ' + e.message)
      setCaptureMode(false)
      return
    }

    setCaptureMode(false)
    setCapturing(true)
    try {
      const res = await authedFetch('/api/site-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          imageBase64: b64,
          mode: 'problem',
          region: hasDrag ? { x: sx, y: sy, w: sw, h: sh } : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'extract failed')
      const p = data.problems?.[0]
      if (p) setExtracted(p)
    } catch (e: any) { setError(e.message) }
    finally { setCapturing(false) }
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: '#0a0a12' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 bg-gray-950 text-gray-100">
        <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-800" aria-label="Close"><X size={16} /></button>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={!!session}
          placeholder="https://..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm disabled:opacity-60"
        />
        {!session ? (
          <button onClick={startSession} disabled={starting} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 text-white text-sm disabled:opacity-60">
            {starting ? <><Loader2 size={14} className="animate-spin" /> Starting…</> : <><Play size={14} /> Start</>}
          </button>
        ) : (
          <>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded hover:bg-gray-800 text-gray-300"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
            <span className="text-xs text-gray-400 font-mono">{mm}:{ss}</span>
            <button
              onClick={async () => {
                if (session?.provider === 'neko') {
                  // Neko: skip region-select (iframe is cross-origin), server-side full-frame screenshot
                  setCapturing(true)
                  try {
                    const r = await authedFetch('/api/browser-session/' + encodeURIComponent(session.id) + '/screenshot', { method: 'POST' })
                    const d = await r.json()
                    if (!r.ok) throw new Error(d.error || 'screenshot failed')
                    const er = await authedFetch('/api/site-extract', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sessionId: session.id, imageBase64: d.imageBase64, mode: 'problem' }),
                    })
                    const ed = await er.json()
                    if (!er.ok) throw new Error(ed.error || 'extract failed')
                    const p = ed.problems?.[0]
                    if (p) setExtracted(p)
                  } catch (e: any) { setError(e.message) }
                  finally { setCapturing(false) }
                  return
                }
                // Hyperbeam: toggle region-select overlay
                setCaptureMode(m => !m)
              }}
              className={'flex items-center gap-1.5 px-3 py-1.5 rounded text-white text-sm ' + (captureMode ? 'bg-amber-600' : 'bg-teal-700 hover:bg-teal-600')}>
              <Camera size={14} /> {captureMode ? 'Cancel' : 'Capture'}
            </button>
            <button onClick={endSession} disabled={ending} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-800 hover:bg-red-700 text-white text-sm disabled:opacity-60">
              {ending ? <><Loader2 size={14} className="animate-spin" /> Ending…</> : <><Square size={14} /> End</>}
            </button>
          </>
        )}
      </div>

      {error && <div className="px-3 py-2 bg-red-950 text-red-200 text-xs">{error}</div>}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
        {!session && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            {starting ? 'Starting browser session…' : 'Click Start to open a cloud browser session.'}
          </div>
        )}
        {session?.provider === 'neko' ? (
          <iframe
            src={session.embedUrl}
            allow="clipboard-read; clipboard-write; autoplay; camera; microphone; fullscreen"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', border: 0, background: '#0f2e1a' }}
          />
        ) : (
          <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: '#0f2e1a', pointerEvents: captureMode ? 'none' : 'auto' }} />
        )}
        {captureMode && overlaySize.w > 0 && (
          <canvas
            ref={overlayRef}
            width={overlaySize.w}
            height={overlaySize.h}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={onOverlayDown}
            onMouseMove={onOverlayMove}
            onMouseUp={onOverlayUp}
          />
        )}
        {capturing && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-gray-900/90 px-3 py-1.5 rounded text-sm text-gray-200">
            <Loader2 size={14} className="animate-spin" /> Extracting…
          </div>
        )}
        </div>
        {sidebarOpen && <SitePanelSidebar sessionId={session?.id ?? null} currentUrl={url} />}
      </div>

      {extracted && (
        <div className="border-t border-gray-800 bg-gray-950 p-3 max-h-[40vh] overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-200">Extracted problem</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(extracted.text).catch(() => {})
                  setCopied(true); setTimeout(() => setCopied(false), 1500)
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-100"
              >
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
              <button onClick={() => setExtracted(null)} className="p-1 rounded text-gray-400 hover:text-gray-200"><X size={14} /></button>
            </div>
          </div>
          <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">{extracted.text}</pre>
        </div>
      )}
    </div>
  )
}
