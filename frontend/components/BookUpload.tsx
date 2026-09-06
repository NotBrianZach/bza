'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, AlertCircle, Link as LinkIcon, Youtube, Rss, Globe, Check, FileText, BookOpen, Mail, Copy, RefreshCw, MessageSquare, Send, Loader2, Save } from 'lucide-react'
import { booksQueries } from '@/lib/queries'
import { maybeAutoCover } from '@/lib/queries/images'
import { maybeAutoScore } from '@/lib/queries/scores'
import { supabase } from '@/lib/supabase'
import FeedBrowser from '@/components/FeedBrowser'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'
import { track } from '@/lib/analytics'
import UpgradeGate, { UpgradeReason } from './UpgradeGate'

type FetchResult =
  | { type: 'youtube'; title: string; channelName: string; markdown: string }
  | { type: 'webpage'; title: string; description: string; markdown: string }
  | { type: 'wikipedia'; title: string; summary: string; revid: number; lang: string; articleKey: string; markdown: string }
  | { type: 'rss'; feedTitle: string; items: { title: string; content: string; url: string; date: string }[] }
  | { type: 'pdf'; data: string; filename: string; title: string }

const STATUS_PROGRESS: Record<string, number> = {
  uploading:   3,
  queuing:     8,
  enqueued:   12,
  processing:  15,
  converted:   72,
  chunking:    85,
  retrying:    15,
  downloading: 95,
}

type ProcessingMethod = 'jina' | 'nougat' | 'mathpix'

function PdfMethodSelector({ method, onChange, isPro, fileSizeBytes }: {
  method: ProcessingMethod
  onChange: (m: ProcessingMethod) => void
  isPro: boolean
  fileSizeBytes: number
}) {
  // Rough estimate: ~85 KB per page average
  const estPages = Math.max(1, Math.round(fileSizeBytes / 85_000))
  const mathpixCost = (estPages * 0.004 * 2).toFixed(2) // $0.004/page × 2× markup

  const methods: { id: ProcessingMethod; label: string; quality: string; speed: string; cost: string; proOnly?: boolean }[] = [
    { id: 'jina',    label: 'Jina',    quality: 'Good',        speed: '~30s',       cost: 'Free' },
    { id: 'nougat',  label: 'Nougat',  quality: 'Great (math)',speed: '10–30 min',  cost: `~$${(estPages * 0.002 * 2).toFixed(2)}` },
    { id: 'mathpix', label: 'Mathpix', quality: 'Best (math)', speed: '~1–3 min',   cost: `~$${mathpixCost}` },
  ]

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Processing method
        <span className="ml-1.5 text-xs font-normal text-gray-400">(est. {estPages} pages)</span>
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
        {/* Header row */}
        <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium px-3 py-1.5 border-b border-gray-200 dark:border-gray-600">
          <span>Method</span><span>Quality</span><span>Speed</span><span>Cost</span>
        </div>
        {methods.map(m => {
          const locked = m.proOnly && !isPro
          const selected = method === m.id
          return (
            <button
              key={m.id}
              type="button"
              disabled={locked}
              onClick={() => onChange(m.id)}
              className={`w-full grid grid-cols-4 px-3 py-2 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                selected
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : locked
                  ? 'opacity-50 cursor-not-allowed bg-white dark:bg-gray-800'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40'
              }`}
            >
              <span className={`font-semibold flex items-center gap-1.5 ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-500'}`} />
                {m.label}
                {m.proOnly && <span className="text-[10px] font-bold px-1 py-0 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Pro</span>}
              </span>
              <span className="text-gray-600 dark:text-gray-300">{m.quality}</span>
              <span className="text-gray-500 dark:text-gray-400">{m.speed}</span>
              <span className={m.id === 'mathpix' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>{m.cost}</span>
            </button>
          )
        })}
      </div>
      {method === 'nougat' && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Nougat runs on a GPU worker — expect 10–30 min for large textbooks.</p>
      )}
      {method === 'mathpix' && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Estimated cost charged to your account. Final amount depends on actual page count.</p>
      )}
    </div>
  )
}

interface BookUploadProps {
  useLocalStorage?: boolean
  isPro?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

const CONTENT_TYPE_OPTIONS = [
  { value: 'fiction',           label: 'Fiction',    desc: 'Novels, stories' },
  { value: 'biography',         label: 'Biography',  desc: 'Life stories' },
  { value: 'textbook',          label: 'Textbook',   desc: 'Educational texts' },
  { value: 'math_textbook',     label: 'Math',       desc: 'Math / problem sets' },
  { value: 'academic_paper',    label: 'Paper',      desc: 'Arxiv, preprints' },
  { value: 'wikipedia_article', label: 'Wikipedia',  desc: 'Wiki articles' },
  { value: 'news_article',      label: 'News',       desc: 'News articles' },
  { value: 'forum_thread',      label: 'Forum',      desc: 'Online discussions' },
  { value: 'essay',             label: 'Essay',      desc: 'Opinion, long-form' },
  { value: 'reference',         label: 'Reference',  desc: 'Manuals, guides' },
  { value: 'manga',             label: 'Manga',      desc: 'Comics, manga, visual' },
] as const

export default function BookUpload({ useLocalStorage = false, isPro = false, onSuccess, onCancel }: BookUploadProps) {
  const router = useRouter()
  const [gateReason, setGateReason] = useState<UpgradeReason | null>(null)
  const [tab, setTab] = useState<'file' | 'url' | 'feed' | 'newsletter' | 'chat' | 'browse'>('file')
  const [newsletterEmail, setNewsletterEmail] = useState<string | null>(null)
  const [newsletterCopied, setNewsletterCopied] = useState(false)
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [contentType, setContentType] = useState<'fiction' | 'biography' | 'textbook' | 'math_textbook' | 'academic_paper' | 'wikipedia_article' | 'news_article' | 'forum_thread' | 'essay' | 'reference'>('fiction')
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('Uploading...')
  const [progress, setProgress] = useState(0)
  const [processingMethod, setProcessingMethod] = useState<ProcessingMethod>('jina')
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // URL tab state
  const [urlInput, setUrlInput] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null)
  const [selectedRssItems, setSelectedRssItems] = useState<Set<number>>(new Set())
  const [urlMethod, setUrlMethod] = useState<'jina' | 'mathpix' | 'supadata'>('jina')
  const [mathpixJob, setMathpixJob] = useState<{ pdfId: string; userId: string } | null>(null)
  const [mathpixProgress, setMathpixProgress] = useState(0)
  const [mathpixMarkdown, setMathpixMarkdown] = useState<string | null>(null)
  const mathpixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (mathpixTimerRef.current) clearInterval(mathpixTimerRef.current)
    }
  }, [])

  const advanceProgress = (status: string) => {
    const target = STATUS_PROGRESS[status] ?? 0
    // Never go backwards — each status moves the bar forward only
    setProgress(prev => Math.max(prev, target))

    if (status === 'processing') {
      // Keep the timer running across repeated 'processing' polls; only start it once
      if (!progressTimerRef.current) {
        progressTimerRef.current = setInterval(() => {
          setProgress(prev => prev >= 70 ? prev : prev + (70 - prev) * 0.015)
        }, 1000)
      }
    } else {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
    }
  }

  const startMathpixPoll = (pdfId: string, userId: string) => {
    if (mathpixTimerRef.current) clearInterval(mathpixTimerRef.current)
    mathpixTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mathpix-status?pdfId=${encodeURIComponent(pdfId)}&userId=${encodeURIComponent(userId)}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (typeof data.progressPct === 'number' && data.progressPct > 0) setMathpixProgress(data.progressPct)
        if (data.status === 'completed') {
          clearInterval(mathpixTimerRef.current!)
          mathpixTimerRef.current = null
          setMathpixMarkdown(data.markdown)
          setMathpixProgress(100)
        }
      } catch (err: any) {
        clearInterval(mathpixTimerRef.current!)
        mathpixTimerRef.current = null
        setError(err.message)
        setMathpixJob(null)
      }
    }, 5_000)
  }

  const handleMathpixUrl = async () => {
    setIsFetching(true)
    setError(null)
    setMathpixJob(null)
    setMathpixMarkdown(null)
    setMathpixProgress(0)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sign in required for Mathpix processing')
      const res = await fetch('/api/mathpix-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), authToken: session.access_token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Mathpix submission failed')
      setTitle(data.title ?? 'Document')
      setMathpixJob({ pdfId: data.mathpixPdfId, userId: data.userId })
      startMathpixPoll(data.mathpixPdfId, data.userId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsFetching(false)
    }
  }

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return
    if (urlMethod === 'mathpix') { handleMathpixUrl(); return }
    setIsFetching(true)
    setFetchResult(null)
    setError(null)
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), method: urlMethod === 'supadata' ? 'supadata' : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Fetch failed')
      setFetchResult(data)
      if (data.type === 'rss') setTitle(data.feedTitle ?? '')
      else setTitle(data.title ?? '')
      if (data.type === 'pdf') setContentType('academic_paper')
      if (data.type === 'wikipedia') setContentType('wikipedia_article')
      setSelectedRssItems(new Set())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsFetching(false)
    }
  }

  const handleImportMarkdown = async (
    markdown: string,
    importTitle: string,
    extra?: { wikiRevid?: string; sourceUrl?: string }
  ) => {
    if (!importTitle.trim()) { setError('Please enter a title'); return }
    setError(null)
    setIsUploading(true)
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const syntheticFile = new File([blob], `${importTitle.replace(/[^a-z0-9]/gi, '_')}.md`, { type: 'text/markdown' })
      if (useLocalStorage) {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const fileText = await fileToText(syntheticFile)
        const newBook = saveLocalBook({
          user_id: '',
          title: importTitle.trim(),
          file_path: 'local',
          total_pages: Math.ceil(fileText.length / 2000),
          summary: summary.trim() || undefined,
        })
        saveBookContent(newBook.id, fileText)
        track('book_upload', { source: 'import-local', content_type: contentType })
        onSuccess ? onSuccess() : router.push(`/books/${newBook.id}`)
      } else {
        const book = await booksQueries.upload(syntheticFile, {
          title: importTitle.trim(),
          articleType: contentType,
          wikiRevid: extra?.wikiRevid,
          sourceUrl: extra?.sourceUrl,
        })
        maybeAutoCover(book.id, importTitle.trim())
        booksQueries.getContent(book.file_path).then(c => maybeAutoScore(book.id, c)).catch(() => {})
        track('book_upload', { source: 'import-remote', content_type: contentType })
        onSuccess ? onSuccess() : (router.push(`/books/${book.id}`), router.refresh())
      }
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImportPdf = async () => {
    if (!fetchResult || fetchResult.type !== 'pdf') return
    if (!title.trim()) { setError('Please enter a title'); return }
    setError(null)
    setIsUploading(true)
    setProgress(0)
    try {
      // Decode base64 → Uint8Array → Blob → File
      const binary = atob(fetchResult.data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const pdfFile = new File([blob], fetchResult.filename, { type: 'application/pdf' })
      const statusLabels: Record<string, string> = {
        uploading: 'Uploading...', queuing: 'Queuing job...', enqueued: 'Queued...',
        processing: 'Extracting text...', converted: 'Converting...', chunking: 'Finalizing...',
        retrying: 'Retrying...', downloading: 'Downloading...',
      }
      const book = await booksQueries.upload(pdfFile, {
        title: title.trim(),
        articleType: contentType,
        processingMethod,
        onStatus: s => { setUploadLabel(statusLabels[s] ?? 'Processing...'); advanceProgress(s) },
        onProgress: pct => {
          if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
          setProgress(prev => Math.max(prev, 15 + Math.round(pct * 55 / 100)))
        },
      })
      maybeAutoCover(book.id, title.trim())
      booksQueries.getContent(book.file_path).then(c => maybeAutoScore(book.id, c)).catch(() => {})
      track('book_upload', { source: 'pdf', content_type: contentType })
      onSuccess ? onSuccess() : (router.push(`/books/${book.id}`), router.refresh())
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
      setIsUploading(false)
    }
  }

  const handleImportRss = async () => {
    if (!fetchResult || fetchResult.type !== 'rss') return
    const items = fetchResult.items.filter((_, i) => selectedRssItems.has(i))
    if (items.length === 0) { setError('Select at least one article'); return }
    const combined = items.map(item => `# ${item.title}\n\n${item.content}`).join('\n\n---\n\n')
    await handleImportMarkdown(combined, title.trim() || fetchResult.feedTitle, { sourceUrl: urlInput.trim() })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type
      const ext = selectedFile.name.split('.').pop()?.toLowerCase()

      if (contentType === 'manga') {
        if (!['pdf', 'png', 'jpg', 'jpeg', 'webp', 'zip'].includes(ext || '')) {
          setError('Manga: Supported file types: PDF, PNG, JPG, WEBP, ZIP')
          return
        }
      } else if (useLocalStorage) {
        if (!['pdf', 'txt', 'md'].includes(ext || '')) {
          setError('Supported file types: PDF, TXT, MD')
          return
        }
      } else {
        // Pro tier - all formats
        if (!['pdf', 'epub', 'txt', 'md'].includes(ext || '')) {
          setError('Invalid file type. Supported: PDF, EPUB, TXT, MD')
          return
        }
      }

      // Check file size (50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File too large. Maximum size: 50MB')
        return
      }

      setFile(selectedFile)
      setError(null)

      // Auto-fill title from filename
      if (!title) {
        const filename = selectedFile.name.replace(/\.[^/.]+$/, '')
        setTitle(filename)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    try {
      setError(null)
      setIsUploading(true)
      setProgress(0)

      if (useLocalStorage) {
        // Free tier - save to localStorage
        // Convert file to text/markdown
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const fileText = await fileToText(file)

        // Create book record
        const newBook = saveLocalBook({
          user_id: '', // Will be set by saveLocalBook
          title: title.trim(),
          file_path: 'local',
          total_pages: Math.ceil(fileText.length / 2000), // Rough estimate: 2000 chars per page
          summary: summary.trim() || undefined,
        })

        // Save content
        saveBookContent(newBook.id, fileText)
        track('book_upload', { source: 'file-local', content_type: contentType, ext: file.name.split('.').pop() })

        // Success
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/books/${newBook.id}`)
        }
      } else {
        // Pro tier - upload to server
        const statusLabels: Record<string, string> = {
          uploading: 'Uploading...',
          queuing: 'Queuing job...',
          enqueued: 'Queued — waiting for worker...',
          processing: 'Extracting text...',
          converted: 'Converting to markdown...',
          chunking: 'Generating readable format...',
          retrying: 'Retrying...',
          downloading: 'Finalizing...',
        }
        const book = await booksQueries.upload(file, {
          title: title.trim(),
          articleType: contentType,
          processingMethod: file.name.toLowerCase().endsWith('.pdf') ? processingMethod : undefined,
          onStatus: (s) => {
            setUploadLabel(statusLabels[s] ?? 'Processing...')
            advanceProgress(s)
          },
          onProgress: (workerPct) => {
            if (progressTimerRef.current) {
              clearInterval(progressTimerRef.current)
              progressTimerRef.current = null
            }
            const barPct = 15 + Math.round(workerPct * 55 / 100)
            setProgress(prev => Math.max(prev, barPct))
          },
        })
        maybeAutoCover(book.id, title.trim(), summary.trim() || undefined)
        booksQueries.getContent(book.file_path).then(c => maybeAutoScore(book.id, c)).catch(() => {})
        track('book_upload', { source: 'file-remote', content_type: contentType, ext: file.name.split('.').pop() })

        // Success
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/books/${book.id}`)
          router.refresh()
        }
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      const msg = err?.message ?? ''
      if (msg.includes('quota exceeded')) {
        setError('Book quota exceeded. Upgrade to Pro for unlimited books.')
        setGateReason('book_quota')
      } else if (msg.includes('too large') || err?.name === 'QuotaExceededError' || msg.includes('exceeded the quota')) {
        setError('Book too large for browser storage. Please upgrade to Pro for unlimited cloud storage.')
        setGateReason('storage_full')
      } else {
        setError(msg || 'Failed to upload book')
      }
    } finally {
      if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null }
      setIsUploading(false)
    }
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Add Text</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => { setTab('file'); setFetchResult(null); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'file' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Upload size={15} />
          File
        </button>
        <button
          onClick={() => { setTab('url'); setFile(null); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'url' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <LinkIcon size={15} />
          URL
        </button>
        <button
          onClick={() => { setTab('feed'); setFile(null); setFetchResult(null); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'feed' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Rss size={15} />
          Feeds
        </button>
        <button
          onClick={() => {
            setTab('newsletter'); setFile(null); setFetchResult(null); setError(null)
            if (!newsletterEmail) {
              setNewsletterLoading(true)
              fetch('/api/newsletter/token').then(r => r.json()).then(d => { setNewsletterEmail(d.email) }).finally(() => setNewsletterLoading(false))
            }
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'newsletter' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Mail size={15} />
          Email
        </button>
        <button
          onClick={() => { setTab('chat'); setFile(null); setFetchResult(null); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'chat' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <MessageSquare size={15} />
          Chat
        </button>
        <button
          onClick={() => { setTab('browse'); setFile(null); setFetchResult(null); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'browse' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Globe size={15} />
          Browse
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-600">
            {error}
            {(error.includes('quota') || error.includes('Upgrade') || error.includes('upgrade')) && (
              <> <a href="/billing" className="underline font-medium">Manage your plan →</a></>
            )}
          </p>
        </div>
      )}

      {/* ── URL tab ── */}
      {tab === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL <span className="font-normal text-gray-400 dark:text-gray-500">(PDF, Wikipedia, webpage, RSS feed, or YouTube)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => {
                  const v = e.target.value
                  setUrlInput(v); setFetchResult(null); setMathpixJob(null); setMathpixMarkdown(null)
                  // Auto-switch to Supadata for YouTube/social URLs
                  try {
                    const host = new URL(v).hostname.replace(/^www\./, '')
                    if (['youtube.com', 'youtu.be', 'tiktok.com', 'twitter.com', 'x.com', 'instagram.com'].some(d => host === d || host.endsWith('.' + d))) {
                      setUrlMethod('supadata')
                    }
                  } catch {}
                }}
                onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                placeholder="https://…"
                className="input flex-1"
                disabled={isFetching || isUploading}
              />
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={!urlInput.trim() || isFetching || isUploading}
                className="btn btn-primary px-4 disabled:opacity-50"
              >
                {isFetching ? <span className="spinner" /> : 'Fetch'}
              </button>
            </div>
            {(() => {
              // Check if current URL requires Supadata (YouTube, TikTok, Twitter, Instagram)
              let requiresSupadata = false
              try {
                const host = new URL(urlInput).hostname.replace(/^www\./, '')
                requiresSupadata = ['youtube.com', 'youtu.be', 'tiktok.com', 'twitter.com', 'x.com', 'instagram.com'].some(d => host === d || host.endsWith('.' + d))
              } catch {}
              return (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Parse with:</span>
              <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
                <button
                  type="button"
                  disabled={requiresSupadata}
                  onClick={() => setUrlMethod('jina')}
                  className={`px-2.5 py-1 transition-colors ${requiresSupadata ? 'opacity-40 cursor-not-allowed bg-white dark:bg-gray-700 text-gray-400' : urlMethod === 'jina' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  Jina
                </button>
                <button
                  type="button"
                  onClick={() => setUrlMethod('supadata')}
                  className={`px-2.5 py-1 border-l border-gray-200 dark:border-gray-600 transition-colors ${urlMethod === 'supadata' || requiresSupadata ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  Supadata {requiresSupadata && '(required)'}
                </button>
                <button
                  type="button"
                  disabled={requiresSupadata}
                  onClick={() => setUrlMethod('mathpix')}
                  className={`px-2.5 py-1 border-l border-gray-200 dark:border-gray-600 transition-colors ${requiresSupadata ? 'opacity-40 cursor-not-allowed bg-white dark:bg-gray-700 text-gray-400' : urlMethod === 'mathpix' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  Mathpix
                </button>
              </div>
              {(urlMethod === 'supadata' || requiresSupadata) && (
                <span className="text-xs text-amber-600 dark:text-amber-400">{requiresSupadata ? 'This URL requires Supadata' : 'For YouTube transcripts & paywalled content'}</span>
              )}
              {urlMethod === 'mathpix' && !requiresSupadata && (
                <span className="text-xs text-amber-600 dark:text-amber-400">Best for math-heavy PDF URLs (arxiv, textbooks)</span>
              )}
            </div>
              )
            })()}
          </div>

          {/* PDF result preview */}
          {fetchResult && fetchResult.type === 'pdf' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FileText size={15} className="text-red-500" />
                <span>PDF · {fetchResult.filename}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {CONTENT_TYPE_OPTIONS.map(({ value, label, desc }) => (
                    <button key={value} type="button" onClick={() => setContentType(value as typeof contentType)}
                      className={`p-2.5 rounded-lg border-2 text-left transition-colors text-sm ${contentType === value ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'}`}>
                      <div className="font-medium text-xs">{label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <PdfMethodSelector
                method={processingMethod}
                onChange={setProcessingMethod}
                isPro={isPro}
                fileSizeBytes={Math.round(fetchResult.data.length * 3 / 4)}
              />
              <button
                type="button"
                onClick={handleImportPdf}
                disabled={isUploading || !title.trim()}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {isUploading ? <><span className="spinner mr-2" />{uploadLabel}</> : 'Add to Library'}
              </button>
              {isUploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{uploadLabel}</span><span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wikipedia result preview */}
          {fetchResult && fetchResult.type === 'wikipedia' && (
            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">Wikipedia</span>
                <span className="text-gray-400 dark:text-gray-500">· {fetchResult.lang.toUpperCase()} · rev {fetchResult.revid}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" />
              </div>
              {fetchResult.summary && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-3">{fetchResult.summary}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">{fetchResult.markdown.length.toLocaleString()} characters · revision tracked for update alerts</p>
              <button
                type="button"
                onClick={() => handleImportMarkdown(
                  fetchResult.markdown, title,
                  { wikiRevid: String(fetchResult.revid), sourceUrl: `https://${fetchResult.lang}.wikipedia.org/wiki/${fetchResult.articleKey}` }
                )}
                disabled={isUploading}
                className="btn btn-primary w-full"
              >
                {isUploading ? <><span className="spinner mr-2" />Importing…</> : 'Add to Library'}
              </button>
            </div>
          )}

          {/* Webpage / YouTube result preview */}
          {fetchResult && (fetchResult.type === 'youtube' || fetchResult.type === 'webpage') && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {fetchResult.type === 'youtube' ? <Youtube size={15} className="text-red-500" /> : <Globe size={15} className="text-blue-500" />}
                {fetchResult.type === 'youtube' ? `YouTube · ${fetchResult.channelName}` : 'Webpage'}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" />
              </div>
              {fetchResult.type === 'webpage' && fetchResult.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2">{fetchResult.description}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">{fetchResult.markdown.length.toLocaleString()} characters extracted</p>
              <button
                type="button"
                onClick={() => handleImportMarkdown(fetchResult.markdown, title, { sourceUrl: urlInput.trim() })}
                disabled={isUploading}
                className="btn btn-primary w-full"
              >
                {isUploading ? <><span className="spinner mr-2" />Importing…</> : 'Add to Library'}
              </button>
            </div>
          )}

          {/* RSS feed results */}
          {fetchResult && fetchResult.type === 'rss' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <Rss size={15} className="text-orange-500" />
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{fetchResult.feedTitle}</span>
                <span className="ml-auto text-xs text-gray-400">{fetchResult.items.length} articles</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {fetchResult.items.map((item, i) => (
                  <label key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0"
                      checked={selectedRssItems.has(i)}
                      onChange={e => {
                        const next = new Set(selectedRssItems)
                        e.target.checked ? next.add(i) : next.delete(i)
                        setSelectedRssItems(next)
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                      {item.date && <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.date).toLocaleDateString()}</p>}
                    </div>
                    {selectedRssItems.has(i) && <Check size={14} className="text-primary-500 shrink-0 mt-0.5 ml-auto" />}
                  </label>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                <div className="flex gap-2 text-xs text-gray-400">
                  <button type="button" onClick={() => setSelectedRssItems(new Set(fetchResult.items.map((_, i) => i)))} className="hover:text-gray-600">Select all</button>
                  <span>·</span>
                  <button type="button" onClick={() => setSelectedRssItems(new Set())} className="hover:text-gray-600">Clear</button>
                  <span className="ml-auto">{selectedRssItems.size} selected</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Book title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input text-sm py-1.5" />
                </div>
                <button
                  type="button"
                  onClick={handleImportRss}
                  disabled={isUploading || selectedRssItems.size === 0}
                  className="btn btn-primary w-full disabled:opacity-50"
                >
                  {isUploading ? <><span className="spinner mr-2" />Importing…</> : `Import ${selectedRssItems.size || ''} Article${selectedRssItems.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
          {/* Mathpix URL — processing */}
          {mathpixJob && !mathpixMarkdown && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="spinner" />
                {mathpixProgress > 0
                  ? `Processing with Mathpix… ${mathpixProgress}%`
                  : 'Submitted to Mathpix — processing usually takes 1–3 min…'}
              </div>
              {mathpixProgress > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${mathpixProgress}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Mathpix URL — done */}
          {mathpixMarkdown && (
            <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <Check size={15} />
                Mathpix done · {mathpixMarkdown.length.toLocaleString()} characters extracted
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {CONTENT_TYPE_OPTIONS.map(({ value, label, desc }) => (
                    <button key={value} type="button" onClick={() => setContentType(value as typeof contentType)}
                      className={`p-2.5 rounded-lg border-2 text-left transition-colors text-sm ${contentType === value ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-700 dark:text-gray-300'}`}>
                      <div className="font-medium text-xs">{label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleImportMarkdown(mathpixMarkdown, title, { sourceUrl: urlInput.trim() })}
                disabled={isUploading || !title.trim()}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {isUploading ? <><span className="spinner mr-2" />Importing…</> : 'Add to Library'}
              </button>
            </div>
          )}
        </div>
      )}


      {/* ── Newsletter tab ── */}
      {tab === 'newsletter' && (
        <div className="space-y-4">
          {!useLocalStorage ? (
            <>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                  <Mail size={16} />
                  <span className="font-medium text-sm">Your newsletter address</span>
                </div>
                {newsletterLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500"><span className="spinner" /> Loading…</div>
                ) : newsletterEmail ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 truncate text-gray-900 dark:text-gray-100 font-mono">
                      {newsletterEmail}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newsletterEmail)
                        setNewsletterCopied(true)
                        setTimeout(() => setNewsletterCopied(false), 2000)
                      }}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                      title="Copy address"
                    >
                      {newsletterCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">Failed to load address. Try refreshing.</p>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium text-gray-800 dark:text-gray-200">How to use it</p>
                <ol className="space-y-1.5 list-none">
                  {[
                    'Copy your address above',
                    'Go to your favourite newsletter (Substack, Mailchimp, etc.)',
                    'Subscribe using this address instead of your regular email',
                    'Each new issue will appear automatically in your library',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p className="font-medium">Works with any newsletter that delivers via email</p>
                <p>Substack · Mailchimp · Beehiiv · Ghost · Buttondown · ConvertKit · and more</p>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                You can rotate this address in{' '}
                <a href="/settings" className="underline hover:text-gray-600 dark:hover:text-gray-300">Settings</a>
                {' '}if you start receiving spam.
              </p>
            </>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center space-y-3">
              <Mail size={32} className="mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">Sign in to get your newsletter email address</p>
              <a href="/auth/signup" className="btn btn-primary inline-flex items-center gap-2 mx-auto">Sign Up Free</a>
            </div>
          )}
        </div>
      )}

      {/* ── Feed tab ── */}
      {tab === 'feed' && (
        <FeedBrowser isAuthenticated={!useLocalStorage} onBookAdded={onSuccess} />
      )}

      {/* ── Browse tab ── */}
      {tab === 'browse' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Open a live browser session. Captures + bookmarks stay tied to the session in your library.
          </p>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const u = (urlInput || '').trim()
              const dest = u ? `/site?url=${encodeURIComponent(u)}` : '/site'
              router.push(dest)
            }}
            className="btn btn-primary w-full"
          >
            <Globe size={16} className="mr-2" />
            Start Browsing Session
          </button>
        </div>
      )}

      {/* ── Chat tab ── */}
      {tab === 'chat' && (
        <ChatBookCreator
          useLocalStorage={useLocalStorage}
          onSuccess={onSuccess}
        />
      )}

      {/* ── Manga upload ── */}
      {tab === 'file' && contentType === 'manga' && (
        <MangaUploader
          useLocalStorage={useLocalStorage}
          title={title}
          onTitleChange={setTitle}
          onSuccess={onSuccess}
        />
      )}

      {/* ── File tab (non-manga) ── */}
      {tab === 'file' && contentType !== 'manga' && <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Book File *
          </label>
          <div className="relative">
            <input
              type="file"
              accept={contentType === 'manga'
                ? ".pdf,.png,.jpg,.jpeg,.webp,.zip,image/*,application/pdf,application/zip"
                : useLocalStorage
                ? ".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                : ".pdf,.epub,.txt,.md,application/pdf,application/epub+zip,text/plain,text/markdown"}
              onChange={handleFileChange}
              disabled={isUploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="book-file"
            />
            <label
              htmlFor="book-file"
              className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
            >
              <div className="text-center">
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                {file ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {useLocalStorage ? 'PDF, TXT, or MD (max 50MB)' : 'PDF, EPUB, TXT, or MD (max 50MB)'}
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            className="input"
            placeholder="Enter book title"
            required
          />
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Summary (optional)
          </label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isUploading}
            className="input"
            rows={3}
            placeholder="Brief description of the book"
          />
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CONTENT_TYPE_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setContentType(value as typeof contentType)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  contentType === value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Processing method — PDF only */}
        {file && file.name.toLowerCase().endsWith('.pdf') && !useLocalStorage && (
          <PdfMethodSelector
            method={processingMethod}
            onChange={setProcessingMethod}
            isPro={isPro}
            fileSizeBytes={file.size}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading || !file}
            className="btn btn-primary flex-1"
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <span className="spinner mr-2"></span>
                {uploadLabel}
              </span>
            ) : (
              'Upload Book'
            )}
          </button>
        </div>

        {isUploading && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{uploadLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </form>}
      {gateReason && (
        <UpgradeGate
          open
          reason={gateReason}
          isAuthenticated={!useLocalStorage}
          onClose={() => setGateReason(null)}
        />
      )}
    </div>
  )
}


/* ── Chat Book Creator ─────────────────────────────────────────────── */

interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

function ChatBookCreator({ useLocalStorage, onSuccess }: { useLocalStorage: boolean; onSuccess?: () => void }) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatTitle, setChatTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const text = input.trim()
    setInput('')
    setIsSending(true)
    setError(null)

    const userMsgId = `user-${Date.now()}`
    const assistantMsgId = `stream-${Date.now()}`

    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: text }])
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', streaming: true }])

    // Auto-generate title from first message
    if (!chatTitle && messages.length === 0) {
      setChatTitle(text.length > 60 ? text.slice(0, 57) + '…' : text)
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const historyMsgs = messages.map(m => ({ role: m.role, content: m.content }))
      historyMsgs.push({ role: 'user', content: text })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: historyMsgs }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `Error ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: fullContent } : m
              ))
            }
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, streaming: false } : m
      ))
    } catch (err: any) {
      setError(err.message || 'Failed to send')
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId))
    } finally {
      setIsSending(false)
    }
  }

  const saveAsBook = async () => {
    if (messages.length < 2) return
    setIsSaving(true)
    setError(null)

    try {
      // Format chat as readable markdown
      const title = chatTitle || 'Chat conversation'
      let markdown = `# ${title}\n\n`
      markdown += `*Created ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n---\n\n`

      for (const msg of messages) {
        if (msg.role === 'user') {
          markdown += `## You\n\n${msg.content}\n\n`
        } else {
          markdown += `## Assistant\n\n${msg.content}\n\n---\n\n`
        }
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], 'chat.md', { type: 'text/markdown' })

      if (useLocalStorage) {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const nb = saveLocalBook({
          user_id: '', title, file_path: 'local',
          total_pages: Math.ceil(text.length / 2000), summary: '',
        })
        saveBookContent(nb.id, text)
        onSuccess?.()
        router.push(`/books/${nb.id}`)
      } else {
        const book = await booksQueries.upload(file, { title, contentType: 'reference' })
        onSuccess?.()
        router.push(`/books/${book.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 400 }}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Have a conversation with AI, then save it as a readable book in your library.
      </p>

      {/* Title */}
      <input
        type="text"
        value={chatTitle}
        onChange={e => setChatTitle(e.target.value)}
        placeholder="Conversation title (auto-generated from first message)"
        className="input text-sm mb-3"
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 space-y-3 mb-3" style={{ maxHeight: 360 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
            <MessageSquare size={32} className="mb-2 text-gray-300" />
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Ask anything — your chat will become a book</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.streaming && <span className="inline-block w-1.5 h-4 bg-purple-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={isSending}
          className="input flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="btn btn-primary px-3"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Save as book */}
      <button
        onClick={saveAsBook}
        disabled={messages.length < 2 || isSaving || isSending}
        className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-40"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {isSaving ? 'Saving…' : `Save as book (${messages.length} messages)`}
      </button>
    </div>
  )
}


/* ── Manga Uploader ────────────────────────────────────────────────── */

interface MangaPage {
  file: File
  preview: string
  pageNum: number
  status: 'pending' | 'processing' | 'done' | 'error'
  panels?: any[]
  pageDescription?: string
  error?: string
}

function MangaUploader({
  useLocalStorage, title, onTitleChange, onSuccess
}: {
  useLocalStorage: boolean
  title: string
  onTitleChange: (t: string) => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [pages, setPages] = useState<MangaPage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) {
      setError('Please select image files (PNG, JPG, WEBP)')
      return
    }

    const sorted = imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const newPages: MangaPage[] = sorted.map((f, i) => ({
      file: f,
      preview: URL.createObjectURL(f),
      pageNum: pages.length + i + 1,
      status: 'pending' as const,
    }))

    setPages(prev => [...prev, ...newPages])
    setError(null)

    if (!title && sorted.length > 0) {
      const name = sorted[0].name.replace(/[-_]\d+\.\w+$/, '').replace(/[_-]/g, ' ')
      onTitleChange(name || 'Manga')
    }
  }

  const removePage = (idx: number) => {
    setPages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next.map((p, i) => ({ ...p, pageNum: i + 1 }))
    })
  }

  const processPages = async () => {
    setIsProcessing(true)
    setProcessedCount(0)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      if (page.status === 'done') { setProcessedCount(i + 1); continue }

      setPages(prev => prev.map((p, j) => j === i ? { ...p, status: 'processing' } : p))

      try {
        // Convert image to base64
        const base64 = await fileToBase64(page.file)

        const res = await fetch('/api/manga-parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            imageBase64: base64,
            pageNum: page.pageNum,
            bookTitle: title,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Parse failed' }))
          throw new Error(err.error || `Error ${res.status}`)
        }

        const data = await res.json()
        setPages(prev => prev.map((p, j) => j === i ? {
          ...p, status: 'done', panels: data.panels || [], pageDescription: data.pageDescription,
        } : p))
      } catch (err: any) {
        setPages(prev => prev.map((p, j) => j === i ? {
          ...p, status: 'error', error: err.message,
        } : p))
      }

      setProcessedCount(i + 1)
    }

    setIsProcessing(false)
  }

  const saveAsBook = async () => {
    const processed = pages.filter(p => p.status === 'done')
    if (!processed.length) return

    setIsSaving(true)
    setError(null)

    try {
      const bookTitle = title || 'Manga'
      let markdown = `# ${bookTitle}\n\n`

      for (const page of pages) {
        markdown += `\n---\n\n## Page ${page.pageNum}\n\n`

        if (page.pageDescription) {
          markdown += `*${page.pageDescription}*\n\n`
        }

        if (page.panels?.length) {
          for (const panel of page.panels) {
            markdown += `### Panel ${panel.index}\n\n`
            markdown += `**Scene:** ${panel.description}\n\n`
            if (panel.dialogue) markdown += `**Dialogue:** ${panel.dialogue}\n\n`
            if (panel.sound_effects) markdown += `**SFX:** ${panel.sound_effects}\n\n`
            if (panel.mood) markdown += `**Mood:** ${panel.mood}`
            if (panel.characters?.length) markdown += ` · **Characters:** ${panel.characters.join(', ')}`
            markdown += '\n\n'
            // Panel prompt — ready for image generation
            markdown += `<details><summary>🎨 Remix prompt</summary>\n\n\`\`\`\n${panel.description}${panel.mood ? `. Mood: ${panel.mood}` : ''}\n\`\`\`\n\n</details>\n\n`
          }
        } else if (page.status === 'error') {
          markdown += `> ⚠️ Could not parse this page: ${page.error}\n\n`
        } else {
          markdown += `> Page not yet processed\n\n`
        }
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const file = new File([blob], 'manga.md', { type: 'text/markdown' })

      if (useLocalStorage) {
        const { fileToText } = await import('@/lib/pdfToMarkdown')
        const text = await fileToText(file)
        const nb = saveLocalBook({
          user_id: '', title: bookTitle, file_path: 'local',
          total_pages: Math.ceil(text.length / 2000), summary: '',
        })
        saveBookContent(nb.id, text)
        onSuccess?.()
        router.push(`/books/${nb.id}`)
      } else {
        // Upload original images to storage too
        const book = await booksQueries.upload(file, { title: bookTitle, contentType: 'manga' })

        // Upload page images for the Images tab
        for (const page of pages) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) break
            const imgPath = `${user.id}/manga_${book.id}_p${page.pageNum}_${Date.now()}.${page.file.name.split('.').pop()}`
            await supabase.storage.from('page-images').upload(imgPath, page.file, { contentType: page.file.type })
            await supabase.from('page_images').insert({
              book_id: book.id, user_id: user.id, page_num: page.pageNum,
              image_url: imgPath, image_model: 'original', prompt: page.pageDescription || `Page ${page.pageNum}`,
              generation_status: 'completed',
            })
          } catch { /* non-fatal */ }
        }

        onSuccess?.()
        router.push(`/books/${book.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const doneCount = pages.filter(p => p.status === 'done').length

  return (
    <div className="space-y-4 mb-4">
      <div className="p-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg text-xs text-pink-700 dark:text-pink-300">
        <p className="font-medium mb-1">Manga / Comic upload</p>
        <p>Select page images in order. AI will analyze each page panel-by-panel, extracting descriptions, dialogue, and scene details. Each panel gets a remix prompt you can use to regenerate it in any style.</p>
      </div>

      {/* Multi-file image picker */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-pink-400 dark:hover:border-pink-500 transition-colors disabled:opacity-40"
        >
          <Upload size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {pages.length ? 'Add more pages' : 'Select manga page images'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · Select multiple files · Sorted by filename</p>
        </button>
      </div>

      {/* Page thumbnails */}
      {pages.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {pages.map((page, i) => (
            <div key={i} className="relative group">
              <img
                src={page.preview}
                alt={`Page ${page.pageNum}`}
                className={`w-full aspect-[2/3] object-cover rounded border ${
                  page.status === 'done' ? 'border-green-400' :
                  page.status === 'processing' ? 'border-yellow-400 animate-pulse' :
                  page.status === 'error' ? 'border-red-400' :
                  'border-gray-200 dark:border-gray-600'
                }`}
              />
              <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                {page.pageNum}
              </span>
              {page.status === 'done' && (
                <span className="absolute top-0.5 right-0.5 text-[9px] bg-green-500 text-white px-1 rounded">
                  {page.panels?.length || 0}p
                </span>
              )}
              {page.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
              {!isProcessing && (
                <button
                  onClick={() => removePage(i)}
                  className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Progress */}
      {isProcessing && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Analyzing pages…</span>
            <span>{processedCount}/{pages.length}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pages.length ? (processedCount / pages.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {pages.length > 0 && (
        <div className="flex gap-2">
          {doneCount < pages.length && (
            <button
              onClick={processPages}
              disabled={isProcessing || pages.length === 0}
              className="btn btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {isProcessing ? `Analyzing ${processedCount}/${pages.length}…` : `Analyze ${pages.length} pages`}
            </button>
          )}
          <button
            onClick={saveAsBook}
            disabled={doneCount === 0 || isSaving || isProcessing}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving…' : `Save as book (${doneCount} pages)`}
          </button>
        </div>
      )}
    </div>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

