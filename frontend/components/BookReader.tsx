'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Book, Page } from '@/types'
import { booksQueries, imageQueries } from '@/lib/queries'
import { getBookContent, getLocalProgress, saveLocalProgress } from '@/lib/localStorage'
import { track } from '@/lib/analytics'
import { ChevronLeft, ChevronRight, ArrowLeft, Image as ImageIcon, ImageOff, PanelRight, Maximize2, X as XIcon, ExternalLink, Columns2, Search, RefreshCw, BookOpen, Volume2, VolumeX, AlignJustify, Languages, BookDown, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'

export interface TocEntry { title: string; level: number; page: number }
export interface InlineImage { url: string; alt: string; page: number }

interface BookReaderProps {
  book: Book
  onBack: () => void
  onToggleSidebar: () => void
  sidebarMode: 'hidden' | 'normal' | 'wide'
  onPageChange?: (page: number) => void
  isAuthenticated?: boolean
  initialPage?: number
  serendipityPrefs?: { enabled: boolean; sources: string[]; customUrls: string[]; frequency: number }
  onTocReady?: (entries: TocEntry[]) => void
  onRegisterNavigate?: (fn: (page: number) => void) => void
  onRegisterGetPageSource?: (fn: (page: number) => string | null) => void
  onInlineImagesReady?: (images: InlineImage[]) => void
}

import SerendipityOverlay, { SerendipityCard } from './SerendipityOverlay'
import { supabase } from '@/lib/supabase'

// Resolves storage:// URLs and old public URLs to signed Supabase storage URLs
function StorageImage({ src, alt }: { src?: string; alt?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState('')
  useEffect(() => {
    if (!src) return
    // storage://bucket/path scheme
    const storageMatch = src.match(/^storage:\/\/([^/]+)\/(.+)$/)
    if (storageMatch) {
      const [, bucket, path] = storageMatch
      supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Old public URLs: .../storage/v1/object/public/BUCKET/PATH
    const publicMatch = src.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (publicMatch) {
      const [, bucket, path] = publicMatch
      supabase.storage.from(bucket).createSignedUrl(path, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Raw path (no scheme, no URL) — assume page-images bucket
    if (!src.startsWith('http') && !src.startsWith('data:') && src.includes('/')) {
      supabase.storage.from('page-images').createSignedUrl(src, 3600).then(({ data }) => {
        if (data?.signedUrl) setResolvedSrc(data.signedUrl)
      })
      return
    }
    // Regular URL — pass through
    setResolvedSrc(src)
  }, [src])
  if (!resolvedSrc) return null
  return <img src={resolvedSrc} alt={alt ?? ''} referrerPolicy="no-referrer" style={{ maxWidth: '100%' }} loading="lazy" />
}
import { translationQueries } from '@/lib/queries/translations'
import { personaSpeak, getTtsEngine, getPersonaInfo } from '@/lib/persona'

function TranslatedPaneHeader({ label, narrating, onNarrate, saving, savedId, onSave }: {
  label: string; narrating: boolean; onNarrate: () => void
  saving: boolean; savedId: number | null; onSave: () => void
}) {
  return (
    <div className="flex items-center gap-2 mb-4 not-prose">
      <span className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide flex-1 truncate">{label || 'Translated'}</span>
      <button onClick={onNarrate} title={narrating ? 'Stop reading' : 'Read aloud'} className={`btn btn-secondary p-1 ${narrating ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-600' : ''}`}>
        {narrating ? <VolumeX size={13} /> : <Volume2 size={13} />}
      </button>
      {savedId ? (
        <a href={`/books/${savedId}`} className="btn btn-secondary text-xs px-2 py-1 whitespace-nowrap text-blue-600 dark:text-blue-400 border-blue-300">Open book →</a>
      ) : (
        <button onClick={onSave} disabled={saving} className="btn btn-secondary text-xs px-2 py-1 whitespace-nowrap flex items-center gap-1 disabled:opacity-40">
          {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : <><BookDown size={11} /> Save</>}
        </button>
      )}
    </div>
  )
}

export default function BookReader({ book, onBack, onToggleSidebar, sidebarMode, onPageChange, isAuthenticated = false, initialPage, serendipityPrefs, onTocReady, onRegisterNavigate, onRegisterGetPageSource, onInlineImagesReady }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage ?? 1)
  const [pageContent, setPageContent] = useState<Page | null>(null)  // auth path only
  const [progressPercent, setProgressPercent] = useState(0)
  const [isLoading, setIsLoading] = useState(isAuthenticated)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fullContent, setFullContent] = useState('')                  // local path
  const [containerWidth, setContainerWidth] = useState(0)            // local path — CSS columns
  const [totalLocalPages, setTotalLocalPages] = useState(1)          // local path — from scrollWidth
  const [bookImages, setBookImages] = useState<any[]>([])
  const [inlineImages, setInlineImages] = useState<Array<{ url: string; alt: string; page: number }>>([])
  const [imagesDrawerOpen, setImagesDrawerOpen] = useState(false)
  const [pagesPerView, setPagesPerView] = useState<1 | 2 | 3>(() => {
    try {
      const stored = parseInt(localStorage.getItem('bza-pages-per-view') ?? '1') || 1
      // On mobile, always use 1-up — multi-page views don't make sense on small screens
      if (typeof window !== 'undefined' && window.innerWidth < 768) return 1
      return stored as 1 | 2 | 3
    } catch { return 1 }
  })
  const [authTotalPages, setAuthTotalPages] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ pageNum: number; snippet: string }>>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Wikipedia update checking
  const [wikiChecking, setWikiChecking] = useState(false)
  const [wikiUpdating, setWikiUpdating] = useState(false)
  const [wikiDiff, setWikiDiff] = useState<{ hasUpdate: boolean; latestRevid: number; diffRows: { type: number; content: string }[]; diffUrl: string; title: string } | null>(null)
  const [wikiDiffOpen, setWikiDiffOpen] = useState(false)
  const goToPageRef = useRef<(page: number) => void>(() => {})
  const isWiki = book.content_type === 'wikipedia_article'
  const isChatBook = book.content_type === 'chat_book'
  const isManga = book.content_type === 'manga'
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatBookContent, setChatBookContent] = useState('')
  const [mangaPageUrls, setMangaPageUrls] = useState<Record<number, string>>({})
  const [mangaOcrLoading, setMangaOcrLoading] = useState(false)

  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)

  // Translation state
  const [translationPrompt, setTranslationPrompt] = useState('translate to spanish')
  const [translatedPages, setTranslatedPages]     = useState<Record<number, string>>({})
  const [isTranslating, setIsTranslating]         = useState(false)
  const [showTranslatePanel, setShowTranslatePanel] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [translateView, setTranslateView] = useState<'translated' | 'original' | 'split'>('translated')
  const [narratingTranslation, setNarratingTranslation] = useState(false)
  const [savingTranslatedBook, setSavingTranslatedBook] = useState(false)
  const [savedTranslatedBookId, setSavedTranslatedBookId] = useState<number | null>(null)

  // Refs so utterance callbacks can read current values without stale closures
  const translationPromptRef = useRef('')
  const showTranslationRef   = useRef(false)
  const translatedPagesRef   = useRef<Record<number, string>>({})
  useEffect(() => { translationPromptRef.current = translationPrompt }, [translationPrompt])
  useEffect(() => { showTranslationRef.current = showTranslatePanel }, [showTranslatePanel])
  useEffect(() => { translatedPagesRef.current = translatedPages }, [translatedPages])

  // Auto-translate when navigating to a new page
  useEffect(() => {
    if (!autoTranslate || !showTranslatePanel || !translationPrompt) return
    if (translatedPages[currentPage] || isTranslating) return
    if (!contentCacheRef.current || !pageBreaksRef.current.length) return
    const rawSlice = getSliceForPage(currentPage)
    if (!rawSlice) return
    setIsTranslating(true)
    fetch('/api/translate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: rawSlice, prompt: translationPrompt }),
    })
      .then(r => r.text())
      .then(translated => {
        const updated = { ...translatedPagesRef.current, [currentPage]: translated }
        setTranslatedPages(updated)
        translatedPagesRef.current = updated
        translationQueries.upsert(book.id, currentPage, translationPrompt, translated).catch(() => {})
      })
      .catch(() => {})
      .finally(() => setIsTranslating(false))
  }, [currentPage, autoTranslate, showTranslatePanel])

  const [narrating, setNarrating] = useState(false)
  const [narrateLoading, setNarrateLoading] = useState(false)
  const narrateAutoAdvance = useRef(false)

  const [scrollMode, setScrollMode] = useState(() => {
    try { const v = localStorage.getItem('bza-scroll-mode'); return v === null ? true : v === 'true' } catch { return true }
  })

  // imageMode: 0=both, 1=side only, 2=inline only, 3=none
  const [imageMode, setImageMode] = useState(() => {
    try { return parseInt(localStorage.getItem('bza-image-mode') ?? '0') || 0 } catch { return 0 }
  })
  const showSideImages = imageMode === 0 || imageMode === 1
  const showInlineImages = imageMode === 0 || imageMode === 2
  const hideImages = !showSideImages && !showInlineImages  // legacy compat for bza-hide-images class
  const cycleImageMode = () => {
    const next = (imageMode + 1) % 4
    try { localStorage.setItem('bza-image-mode', String(next)) } catch {}
    setImageMode(next)
  }

  const toggleScrollMode = () => {
    const next = !scrollMode
    const prevPage = currentPage
    setScrollMode(next)
    try { localStorage.setItem('bza-scroll-mode', String(next)) } catch {}
    // Ensure content is loaded when entering scroll mode
    if (next && isAuthenticated && !contentCacheRef.current) loadPage(1)
    // Restore position after mode switch
    if (next) {
      // Entering scroll mode — scroll to current page position
      scrollRestoredRef.current = false
      const tp = totalPages
      if (tp > 1 && prevPage > 1) {
        scrollRestoreFractionRef.current = (prevPage - 1) / (tp - 1)
      } else {
        // At page 1 — nothing to restore
        scrollRestoredRef.current = true
      }
      setScrollRestoreTrigger(t => t + 1)
    } else {
      // Entering paginated mode — ensure correct page is shown
      setCurrentPage(prevPage)
    }
  }


  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Store scroll fraction (0-1) for precise restore — avoids lossy page↔scroll conversion
  const scrollRestoreFractionRef = useRef<number | null>(null)
  const scrollRestoredRef = useRef(false) // true once initial restore is done (or skipped)
  const [scrollRestoreTrigger, setScrollRestoreTrigger] = useState(0) // bump to re-run restore useEffect

  // In scroll mode: derive current page from scroll position
  const scrollRafRef = useRef<number | null>(null)
  const lastScrollPageRef = useRef(currentPage)
  const totalPages = isManga ? book.total_pages : (isAuthenticated ? (authTotalPages || book.total_pages) : (authTotalPages || totalLocalPages))
  const pageDisplayRef = useRef<HTMLSpanElement>(null) // direct DOM update to avoid re-renders
  const scrollPageSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll handler: updates page display via DOM ref — NO React state updates in the hot path.
  // In scroll mode, one "page" = one viewport height of content (screen-relative).
  // We still save completion fraction for position restore, and map to the DB page count
  // for progress tracking, but the displayed page number is screen-relative.
  const handleScrollProgress = () => {
    if (scrollRafRef.current) return
    if (!scrollRestoredRef.current) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      if (!scrollRestoredRef.current) return
      const el = scrollContainerRef.current
      if (!el) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 10) return
      const completionPct = Math.min(1, Math.max(0, el.scrollTop / maxScroll))
      // Screen-relative page: how many viewports worth of content have been scrolled
      const screenPages = Math.max(1, Math.round(el.scrollHeight / el.clientHeight))
      const screenPage = Math.max(1, Math.min(screenPages, Math.round(completionPct * (screenPages - 1)) + 1))

      if (screenPage !== lastScrollPageRef.current) {
        lastScrollPageRef.current = screenPage
        // Update DOM directly — no re-render
        if (pageDisplayRef.current) {
          pageDisplayRef.current.textContent = `p.${screenPage}/${screenPages} · ${(completionPct * 100).toFixed(0)}%`
        }
        onPageChange?.(screenPage)
        saveProgressDebounced(screenPage, completionPct)
        // Lazily sync React state so features like translate/narrate work
        if (scrollPageSyncTimer.current) clearTimeout(scrollPageSyncTimer.current)
        scrollPageSyncTimer.current = setTimeout(() => {
          setCurrentPage(screenPage)
          setProgressPercent(completionPct * 100)
        }, 2000)
      }
    })
  }

  const toPlainText = (md: string) =>
    md
      .replace(/!\[.*?\]\(.*?\)/g, '')              // images
      .replace(/\[>>(\d+)\]\([^)]+\)/g, '')         // 4chan reply links [>>12345](#p12345)
      .replace(/>>?\d+/g, '')                        // bare >>12345 or >12345 reply refs
      .replace(/\bNo\.\d+\b/g, '')                  // post numbers "No.12345678"
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // other links → text only
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/`[^`]+`/g, '')
      .replace(/^>+\s*/gm, '')                      // blockquotes / greentext (single or double >)
      .replace(/^[-*+]\s+/gm, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()

  const cancelNarrationRef = useRef<(() => void) | null>(null)
  const stoppingRef = useRef(false) // prevent re-entrant stopNarration

  const stopNarration = () => {
    if (stoppingRef.current) return
    stoppingRef.current = true
    const cancel = cancelNarrationRef.current
    cancelNarrationRef.current = null
    if (cancel) cancel()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setNarrating(false)
    setNarrateLoading(false)
    setNarratingTranslation(false)
    narrateAutoAdvance.current = false
    stoppingRef.current = false
  }

  /** Speak text using persona voice (AI or browser based on settings) */
  const speakText = (text: string, onStart: () => void, onEnd: () => void) => {
    setNarrateLoading(true)
    cancelNarrationRef.current = personaSpeak(text, () => { setNarrateLoading(false); onStart() }, () => { setNarrateLoading(false); onEnd() })
  }

  const narrateTranslation = (pageNum: number) => {
    const text = translatedPagesRef.current[pageNum]
    if (!text) return
    stopNarration()
    narrateAutoAdvance.current = true
    speakText(
      toPlainText(text),
      () => setNarratingTranslation(true),
      () => {
        const nextPage = pageNum + 1
        if (!narrateAutoAdvance.current || nextPage > totalPages) {
          setNarratingTranslation(false)
          narrateAutoAdvance.current = false
          return
        }
        goToPage(nextPage)
        if (translatedPagesRef.current[nextPage]) {
          narrateTranslation(nextPage)
          return
        }
        if (translationPromptRef.current && isAuthenticated && contentCacheRef.current && pageBreaksRef.current.length > 0) {
          const rawSlice = getSliceForPage(nextPage)
          if (rawSlice) {
            fetch('/api/translate-page', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: rawSlice, prompt: translationPromptRef.current }),
            })
              .then(r => r.text())
              .then(translated => {
                const updated = { ...translatedPagesRef.current, [nextPage]: translated }
                setTranslatedPages(updated)
                translatedPagesRef.current = updated
                translationQueries.upsert(book.id, nextPage, translationPromptRef.current, translated).catch(() => {})
                narrateTranslation(nextPage)
              })
              .catch(() => { setNarratingTranslation(false); narrateAutoAdvance.current = false })
            return
          }
        }
        setNarratingTranslation(false)
        narrateAutoAdvance.current = false
      },
    )
  }

  const saveTranslatedBook = async () => {
    if (savingTranslatedBook) return
    const pageNums = Object.keys(translatedPages).map(Number).sort((a, b) => a - b)
    if (pageNums.length === 0) return
    setSavingTranslatedBook(true)
    try {
      const combined = pageNums.map(p => translatedPages[p]).join('\n\n')
      const title = `${book.title} (${translationPrompt})`
      const res = await fetch('/api/create-translated-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: combined, sourceBookId: book.id, prompt: translationPrompt }),
      })
      const data = await res.json()
      if (data.bookId) setSavedTranslatedBookId(data.bookId)
    } catch (err) {
      console.error('Save translated book failed:', err)
    } finally {
      setSavingTranslatedBook(false)
    }
  }

  const narratePage = (pageNum: number, autoAdvance = false) => {
    stopNarration()
    narrateAutoAdvance.current = autoAdvance

    const chunk = scrollMode ? 1 : pagesPerView

    let text = ''
    if (isAuthenticated && contentCacheRef.current && pageBreaksRef.current.length > 0) {
      for (let i = 0; i < chunk; i++) {
        const p = pageNum + i
        if (p <= totalPages) {
          const raw = getSliceForPage(p)
          const source = showTranslationRef.current && translatedPagesRef.current[p]
            ? translatedPagesRef.current[p]
            : raw
          text += toPlainText(source) + ' '
        }
      }
    } else if (!isAuthenticated && fullContent) {
      const len = fullContent.length
      const start = Math.floor(((pageNum - 1) / totalLocalPages) * len)
      const end = Math.floor(((pageNum - 1 + chunk) / totalLocalPages) * len)
      text = toPlainText(fullContent.slice(start, Math.min(end, len)))
    }
    if (!text) return

    speakText(
      text,
      () => setNarrating(true),
      () => {
        const nextPage = pageNum + chunk
        if (narrateAutoAdvance.current && nextPage <= totalPages) {
          if (
            showTranslationRef.current &&
            translationPromptRef.current &&
            isAuthenticated &&
            contentCacheRef.current &&
            !translatedPagesRef.current[nextPage]
          ) {
            const rawSlice = pageBreaksRef.current.length > 0 ? getSliceForPage(nextPage) : ''
            if (rawSlice) {
              fetch('/api/translate-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: rawSlice, prompt: translationPromptRef.current }),
              })
                .then(r => r.text())
                .then(translated => {
                  const updated = { ...translatedPagesRef.current, [nextPage]: translated }
                  setTranslatedPages(updated)
                  translatedPagesRef.current = updated
                  translationQueries.upsert(book.id, nextPage, translationPromptRef.current, translated).catch(() => {})
                  narratePage(nextPage, true)
                  goToPage(nextPage)
                })
                .catch(() => {
                  narratePage(nextPage, true)
                  goToPage(nextPage)
                })
              return
            }
          }
          narratePage(nextPage, true)
          goToPage(nextPage)
        } else {
          setNarrating(false)
        }
      },
    )
  }

  const [serendipityCard, setSerendipityCard] = useState<SerendipityCard | null>(null)
  const flipCountRef = useRef(0)
  const prefetchedCardRef = useRef<SerendipityCard | null>(null)
  const serendipityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)   // content area / scroll container
  const columnsRef  = useRef<HTMLDivElement>(null)    // CSS-columns div (local path)
  const totalLocalPagesRef = useRef(1)               // track previous total for proportional remap
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const contentCacheRef = useRef<string | null>(null) // full book text, downloaded once
  const pageBreaksRef = useRef<number[]>([])           // char offsets of each page start
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevents the initial loadPage(1) from racing restoreProgress and clobbering
  // the stored page. If ?page= was provided, that's the source of truth so we
  // start unblocked.
  const progressRestoredRef = useRef<boolean>(!!initialPage)

  const saveProgressDebounced = (pageNum: number, scrollFraction?: number) => {
    if (!progressRestoredRef.current) return
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current)
    progressTimerRef.current = setTimeout(() => {
      if (isAuthenticated) {
        booksQueries.updateProgress(book.id, pageNum).catch(() => {})
      } else {
        saveLocalProgress(book.id, pageNum)
      }
      // Always persist scroll fraction for precise scroll-mode restore
      if (scrollFraction !== undefined) {
        try { localStorage.setItem(`bza-scroll-frac-${book.id}`, String(scrollFraction)) } catch {}
      }
    }, 1500)
  }
  const refsMapRef = useRef<Record<number, string>>({}) // parsed bibliography: num → full text


  function extractInlineImages(text: string, breaks: number[]): Array<{ url: string; alt: string; page: number }> {
    const results: Array<{ url: string; alt: string; page: number }> = []
    const re = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const idx = m.index
      let page = 1
      if (breaks.length > 1) {
        const i = breaks.findIndex((b, j) => b <= idx && (breaks[j + 1] ?? Infinity) > idx)
        page = Math.max(1, i + 1)
      }
      results.push({ url: m[2], alt: m[1], page })
    }
    return results
  }

  function computePageBreaks(text: string, len: number): number[] {
    // Heading pattern — prefer breaking before headings
    const headingRe = /^(?:#{1,6}\s|\\(?:section|chapter)|(?:CHAPTER|Chapter|PART|Part)\s+[IVXLCDM\d])/gm
    const headingOffsets = new Set<number>()
    let hm: RegExpExecArray | null
    while ((hm = headingRe.exec(text)) !== null) headingOffsets.add(hm.index)

    const breaks = [0]
    let pos = 0
    while (pos < text.length) {
      const target = pos + len
      if (target >= text.length) break

      // First: check if there's a heading in the ±20% window around target
      const minPos = pos + Math.floor(len * 0.8)
      const maxPos = Math.min(pos + Math.ceil(len * 1.2), text.length)
      let end = -1

      for (const ho of headingOffsets) {
        if (ho > minPos && ho <= maxPos) { end = ho; break }
      }

      // Second: look for paragraph break (\n\n) near target
      if (end === -1) {
        const look = Math.min(target + 300, text.length)
        for (let i = target; i < look; i++) {
          if (text[i] === '\n' && text[i + 1] === '\n') { end = i + 2; break }
        }
      }

      // Third: sentence boundary
      if (end === -1) {
        const look = Math.min(target + 200, text.length)
        for (let i = target; i < look; i++) {
          if (('.!?'.includes(text[i])) && /[\s"']/.test(text[i + 1] ?? '')) { end = i + 1; break }
        }
      }

      // Last resort: hard break at target
      if (end === -1) end = target

      breaks.push(end)
      pos = end
    }
    return breaks
  }

  function parseToc(text: string, breaks: number[]): { title: string; level: number; page: number }[] {
    const entries: { title: string; level: number; page: number }[] = []

    const patterns: Array<{ re: RegExp; level: (m: RegExpExecArray) => number; title: (m: RegExpExecArray) => string }> = [
      { re: /^(#{1,4})\s+(.+)$/gm, level: m => m[1].length, title: m => m[2].trim() },
      { re: /^\\chapter\*?\{(.+?)\}/gm, level: () => 1, title: m => m[1] },
      { re: /^\\section\*?\{(.+?)\}/gm, level: () => 2, title: m => m[1] },
      { re: /^\\subsection\*?\{(.+?)\}/gm, level: () => 3, title: m => m[1] },
      { re: /^(?:CHAPTER|Chapter)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Chapter ${m[1]}${m[2]?.trim() ? ': ' + m[2].trim() : ''}` },
      { re: /^(?:PART|Part)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Part ${m[1]}${m[2]?.trim() ? ': ' + m[2].trim() : ''}` },
    ]

    const findPage = (offset: number) => {
      let lo = 0, hi = breaks.length - 1
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (breaks[mid] <= offset) lo = mid; else hi = mid - 1 }
      return lo + 1
    }

    for (const pat of patterns) {
      pat.re.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = pat.re.exec(text)) !== null) {
        const title = pat.title(m)
        if (title.length < 2 || title.length > 100) continue
        entries.push({ title, level: pat.level(m), page: findPage(m.index) })
      }
    }

    // Sort by page, deduplicate same-page same-title
    entries.sort((a, b) => a.page - b.page || a.level - b.level)
    const seen = new Set<string>()
    return entries.filter(e => { const k = `${e.page}-${e.title}`; if (seen.has(k)) return false; seen.add(k); return true })
  }

  function parseReferences(text: string): Record<number, string> {
    // Find a references/bibliography section near the end of the book
    const sectionMatch = text.match(/\n#{1,3}\s*(?:References|Bibliography|Works Cited|Further Reading|Notes)\s*\n([\s\S]{0,20000})$/i)
    if (!sectionMatch) return {}
    const section = sectionMatch[1]
    const refs: Record<number, string> = {}
    // Match [N] entry lines, possibly spanning multiple lines until the next [N] or blank line
    const entryRe = /\[(\d+)\]\s+([\s\S]+?)(?=\n\s*\[\d+\]|\n{2,}|$)/g
    for (const m of section.matchAll(entryRe)) {
      const num = parseInt(m[1])
      if (!isNaN(num)) refs[num] = m[2].replace(/\n\s*/g, ' ').trim()
    }
    return refs
  }

  function getSliceForPage(pageNum: number): string {
    const charPageLength = book.char_page_length ?? 420
    const breaks = pageBreaksRef.current
    const start = breaks[pageNum - 1] ?? (pageNum - 1) * charPageLength
    const end = breaks[pageNum] ?? contentCacheRef.current!.length
    return contentCacheRef.current!.substring(start, end)
  }

  function searchPages(query: string): Array<{ pageNum: number; snippet: string }> {
    if (!contentCacheRef.current || !query.trim()) return []
    const text = contentCacheRef.current
    const q = query.toLowerCase()
    const charPageLength = book.char_page_length ?? 420
    const breaks = pageBreaksRef.current.length > 0
      ? pageBreaksRef.current
      : Array.from({ length: Math.ceil(text.length / charPageLength) }, (_, i) => i * charPageLength)
    const results: Array<{ pageNum: number; snippet: string }> = []
    for (let i = 0; i < breaks.length; i++) {
      const start = breaks[i]
      const end = breaks[i + 1] ?? text.length
      const pageText = text.substring(start, end)
      const idx = pageText.toLowerCase().indexOf(q)
      if (idx !== -1) {
        const snipStart = Math.max(0, idx - 40)
        const snipEnd = Math.min(pageText.length, idx + q.length + 80)
        const raw = pageText.substring(snipStart, snipEnd).replace(/\n+/g, ' ')
        const snippet = (snipStart > 0 ? '…' : '') + raw + (snipEnd < pageText.length ? '…' : '')
        results.push({ pageNum: i + 1, snippet })
        if (results.length >= 20) break
      }
    }
    return results
  }

  // Debounced search
  useEffect(() => {
    if (!searchOpen) return
    const t = setTimeout(() => setSearchResults(searchPages(searchQuery)), 200)
    return () => clearTimeout(t)
  }, [searchQuery, searchOpen])

  // Parse %%fn%%\nN|text\n%%/fn%% blocks out of page content.
  // Returns cleaned text and a map of footnote number → text.
  function parseFootnotes(content: string): { text: string; footnotes: Record<number, string> } {
    const match = content.match(/%%fn%%\n?([\s\S]*?)\n?%%\/fn%%/)
    if (!match) return { text: content, footnotes: {} }
    const text = content.replace(/\n*%%fn%%[\s\S]*?%%\/fn%%/, '').trim()
    const footnotes: Record<number, string> = {}
    for (const line of match[1].trim().split('\n')) {
      const pipe = line.indexOf('|')
      if (pipe > 0) {
        const num = parseInt(line.slice(0, pipe))
        const fnText = line.slice(pipe + 1).trim()
        if (!isNaN(num) && fnText) footnotes[num] = fnText
      }
    }
    return { text, footnotes }
  }

  // Convert [[N]] inline markers → markdown link [ⁿ](fn:N) for custom rendering.
  // Also normalize LaTeX delimiters: \(...\) → $...$, \[...\] → $$...$$
  const SUPERSCRIPT_CHARS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
  function preprocessContent(content: string): string {
    const refs = refsMapRef.current
    return content
      .replace(/\\\[([^]*?)\\\]/g, (_, m) => `$$${m}$$`)
      .replace(/\\\(([^]*?)\\\)/g, (_, m) => `$${m}$`)
      .replace(/\[\[(\d+)\]\]/g, (_, n: string) => {
        const sup = n.split('').map((d: string) => SUPERSCRIPT_CHARS[parseInt(d)] ?? d).join('')
        return `[${sup}](fn:${n})`
      })
      // Convert bare [N] reference citations to clickable superscripts
      .replace(/(?<!\[)\[(\d+)\](?!\])/g, (match, n: string) => {
        if (!refs[parseInt(n)]) return match
        const sup = n.split('').map((d: string) => SUPERSCRIPT_CHARS[parseInt(d)] ?? d).join('')
        return `[${sup}](fn:${n})`
      })
      // Inject anchor spans for 4chan post numbers so reply links can scroll+highlight
      .replace(/\bNo\.(\d+)\b/g, '<span id="post-$1">No.$1</span>')
  }

  function addPostAnchors(content: string): string {
    return content.replace(/\bNo\.(\d+)\b/g, '<span id="post-$1">No.$1</span>')
  }

  // Track container width for CSS columns column-width and page stride
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // After content renders (or container resizes), measure total pages from scrollWidth.
  // When the total changes (e.g. sidebar open/close changes containerWidth), remap
  // currentPage proportionally so the user stays at roughly the same position in the text.
  useEffect(() => {
    if (isAuthenticated || !columnsRef.current || containerWidth <= 0) return
    const id = requestAnimationFrame(() => {
      const scrollW = columnsRef.current?.scrollWidth ?? 0
      const pages = Math.max(1, Math.ceil(scrollW / containerWidth))
      const prevPages = totalLocalPagesRef.current
      totalLocalPagesRef.current = pages
      setTotalLocalPages(pages)
      setCurrentPage(prev => {
        const remapped = prevPages > 1
          ? Math.round((prev / prevPages) * pages)
          : prev
        return Math.max(1, Math.min(pages, remapped))
      })
    })
    return () => cancelAnimationFrame(id)
  }, [fullContent, containerWidth, isAuthenticated])

  // Keyboard navigation — disabled in scroll mode (browser handles scrolling natively)
  useEffect(() => {
    if (scrollMode) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight') goToPage(currentPage + 1)
      else if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
      else if (e.key === 'ArrowDown') goToPage(currentPage + pagesPerView)
      else if (e.key === 'ArrowUp') goToPage(currentPage - pagesPerView)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, totalPages, pagesPerView, scrollMode])

  // Pre-fetch first serendipity card on mount
  useEffect(() => {
    if (serendipityPrefs?.enabled) {
      prefetchSerendipity(serendipityPrefs.sources, serendipityPrefs.customUrls ?? [])
    }
  }, [serendipityPrefs?.enabled])

  // Register goToPage so parent/siblings can navigate imperatively
  useEffect(() => {
    goToPageRef.current = goToPage
  })
  useEffect(() => {
    onRegisterNavigate?.((page) => goToPageRef.current(page))
  }, [])
  useEffect(() => {
    onRegisterGetPageSource?.((page) => {
      if (!contentCacheRef.current) return null
      if (!pageBreaksRef.current.length) return null
      return getSliceForPage(page)
    })
  }, [])

  // Chat books: force scroll mode and load content directly
  useEffect(() => {
    if (!isChatBook) return
    setScrollMode(true)
    // Load content independently of the main loadPage flow
    if (isAuthenticated && !chatBookContent) {
      booksQueries.getContent(book.file_path)
        .then(content => {
          contentCacheRef.current = content
          setChatBookContent(content)
        })
        .catch(() => {})
    }
  }, [isChatBook, isAuthenticated])

  // Initialise: load local content and restore progress
  useEffect(() => {
    if (!isAuthenticated) {
      getBookContent(book.id).then(content => {
        if (content) {
          setFullContent(content)
          contentCacheRef.current = content
          const charPageLength = book.char_page_length ?? 420
          pageBreaksRef.current = computePageBreaks(content, charPageLength)
          setAuthTotalPages(pageBreaksRef.current.length)
          refsMapRef.current = parseReferences(content)
          setInlineImages(extractInlineImages(content, pageBreaksRef.current))
          const entries = parseToc(content, pageBreaksRef.current)
          if (entries.length > 0) onTocReady?.(entries)
        }
      })
    }
    restoreProgress()
  }, [book.id])

  // Auth path: fetch server page on page change + reset scroll to top
  useEffect(() => {
    if (isAuthenticated && !isManga && !isChatBook) {
      loadPage(currentPage)
      if (containerRef.current) containerRef.current.scrollTop = 0
    }
    // Stop narration on manual page change (narrateAutoAdvance handles auto-advance)
    if (!narrateAutoAdvance.current) stopNarration()
  }, [currentPage, isAuthenticated, scrollMode])

  // Manga: load page image URL (from Supabase for auth, IndexedDB for local)
  useEffect(() => {
    if (!isManga) return
    if (mangaPageUrls[currentPage]) return
    if (isAuthenticated) {
      supabase
        .from('page_images')
        .select('image_url')
        .eq('book_id', book.id)
        .eq('page_num', currentPage)
        .limit(1)
        .maybeSingle()
        .then(async ({ data }) => {
          if (!data?.image_url) return
          const { data: signed } = await supabase.storage
            .from('page-images')
            .createSignedUrl(data.image_url, 3600)
          if (signed?.signedUrl) {
            setMangaPageUrls(prev => ({ ...prev, [currentPage]: signed.signedUrl }))
          }
        })
    } else {
      import('@/lib/localStorage').then(({ getMangaPageUrl }) => {
        getMangaPageUrl(book.id, currentPage).then(url => {
          if (url) setMangaPageUrls(prev => ({ ...prev, [currentPage]: url }))
        })
      })
    }
  }, [currentPage, isManga, isAuthenticated])

  // Local path: record progress on page change
  useEffect(() => {
    if (isAuthenticated || totalLocalPages <= 1) return
    saveProgressDebounced(currentPage)
    if (!scrollMode) setProgressPercent((currentPage / totalLocalPages) * 100)
  }, [currentPage, totalLocalPages, isAuthenticated])


  // Restore scroll position after content loads (scroll mode only)
  useEffect(() => {
    const frac = scrollRestoreFractionRef.current
    if (frac === null || !scrollMode) return // wait for restoreProgress to set fraction
    const el = scrollContainerRef.current
    if (!el) return
    if (isAuthenticated && isLoading) return
    if (!isAuthenticated && !fullContent) return

    // Wait for content to render (scrollHeight needs to be meaningful)
    let attempts = 0
    const tryRestore = () => {
      if (!el || el.scrollHeight <= el.clientHeight + 100) {
        if (attempts++ < 25) { setTimeout(tryRestore, 200); return }
        // Give up after 5s — let scroll tracking proceed
        scrollRestoredRef.current = true
        return
      }
      const maxScroll = el.scrollHeight - el.clientHeight
      el.scrollTop = frac * maxScroll
      scrollRestoreFractionRef.current = null
      // Derive screen-relative page from scroll position for display
      const screenPages = Math.max(1, Math.round(el.scrollHeight / el.clientHeight))
      const page = Math.max(1, Math.min(screenPages, Math.round(frac * (screenPages - 1)) + 1))
      lastScrollPageRef.current = page
      setCurrentPage(page)
      setProgressPercent(frac * 100)
      if (pageDisplayRef.current) {
        pageDisplayRef.current.textContent = `p.${page}/${screenPages} · ${(frac * 100).toFixed(0)}%`
      }
      // Enable scroll tracking after the browser settles from programmatic scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { scrollRestoredRef.current = true })
      })
    }
    requestAnimationFrame(tryRestore)
  }, [scrollMode, isLoading, fullContent, totalPages, scrollRestoreTrigger])

  // Load user notes from localStorage
  // User notes removed — bookmarks serve this purpose now

  // Scroll to and flash-highlight a 4chan post after navigation
  useEffect(() => {
    if (!highlightedPostId) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`post-${highlightedPostId}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedPostId(null) // consume — prevents re-running on subsequent dep changes
      el.style.backgroundColor = 'rgba(251, 146, 60, 0.45)'
      el.style.borderRadius = '3px'
      el.style.padding = '0 2px'
      el.style.transition = 'background-color 0.1s'
      setTimeout(() => {
        el.style.transition = 'background-color 1.8s ease-out'
        el.style.backgroundColor = ''
      }, 700)
    }, 120)
    return () => clearTimeout(timer)
  }, [highlightedPostId, currentPage, pageContent, isLoading, fullContent])

  // Notify parent whenever inline images change (send empty array when hidden)
  useEffect(() => {
    onInlineImagesReady?.(!showInlineImages ? [] : inlineImages)
  }, [inlineImages, hideImages])

  // Extract inline images whenever local content loads
  useEffect(() => {
    if (fullContent) {
      setInlineImages(extractInlineImages(fullContent, []))
    }
  }, [fullContent])

  // Extract inline images whenever auth content is first cached (pageContent changes only after loadPage)
  useEffect(() => {
    if (isAuthenticated && contentCacheRef.current && pageBreaksRef.current.length > 0) {
      setInlineImages(extractInlineImages(contentCacheRef.current, pageBreaksRef.current))
    }
  }, [pageContent])

  // Load DB images when drawer is first opened
  useEffect(() => {
    if (imagesDrawerOpen && bookImages.length === 0) {
      imageQueries.list(book.id).then(setBookImages).catch(() => {})
    }
  }, [imagesDrawerOpen])

  const restoreProgress = async () => {
    try {
      let page = 0
      if (isAuthenticated) {
        const data = await booksQueries.getProgress(book.id)
        if (!scrollMode) setProgressPercent(data.progressPercent)
        page = data.currentPage
      } else {
        const local = getLocalProgress(book.id)
        if (local) {
          if (!scrollMode) setProgressPercent(local.progress_percentage ?? 0)
          page = local.current_page
        }
      }
      if (page > 1) {
        if (!initialPage) {
          setCurrentPage(page)
          onPageChange?.(page)
        }
        if (scrollMode) {
          scrollRestoredRef.current = false
          // URL initialPage wins over the saved scroll fraction — the saved
          // fraction corresponds to `page` (last read), not initialPage, so
          // applying it here would silently jump away from the URL target.
          if (initialPage && initialPage > 1) {
            const tp = totalPages
            if (tp > 1) {
              scrollRestoreFractionRef.current = (initialPage - 1) / (tp - 1)
            }
            setScrollRestoreTrigger(t => t + 1)
            return
          }
          // Try to load saved scroll fraction for precise restore
          try {
            const saved = localStorage.getItem(`bza-scroll-frac-${book.id}`)
            if (saved) {
              const frac = parseFloat(saved)
              if (frac > 0 && frac <= 1) {
                scrollRestoreFractionRef.current = frac
                setScrollRestoreTrigger(t => t + 1)
                return
              }
            }
          } catch {}
          // Fallback: derive fraction from page number (lossy but better than nothing)
          const tp = totalPages
          if (tp > 1) {
            scrollRestoreFractionRef.current = (page - 1) / (tp - 1)
          }
          setScrollRestoreTrigger(t => t + 1)
        }
      } else if (scrollMode) {
        // No saved progress — use initialPage from URL if present
        if (initialPage && initialPage > 1 && totalPages > 1) {
          scrollRestoreFractionRef.current = (initialPage - 1) / (totalPages - 1)
          setScrollRestoreTrigger(t => t + 1)
        } else {
          scrollRestoredRef.current = true
        }
      }
    } catch (err) {
      console.error('Error loading progress:', err)
      if (scrollMode) scrollRestoredRef.current = true
    } finally {
      // Unblock progress writes; before this the initial loadPage(1)'s save is
      // suppressed to prevent clobbering a slower-returning restored page.
      progressRestoredRef.current = true
    }
  }

  const loadPage = async (pageNum: number) => {
    try {
      setIsLoading(true)
      setLoadError(null)
      // Download the full book once and cache it; subsequent page turns are instant string slices
      if (!contentCacheRef.current) {
        contentCacheRef.current = await booksQueries.getContent(book.file_path)
        if (isChatBook) setChatBookContent(contentCacheRef.current)
        const charPageLength = book.char_page_length ?? 420
        pageBreaksRef.current = computePageBreaks(contentCacheRef.current, charPageLength)
        setAuthTotalPages(pageBreaksRef.current.length)
        refsMapRef.current = parseReferences(contentCacheRef.current)
        setInlineImages(extractInlineImages(contentCacheRef.current, pageBreaksRef.current))
        // Always generate TOC from detected headings
        const entries = parseToc(contentCacheRef.current, pageBreaksRef.current)
        if (entries.length > 0) onTocReady?.(entries)
      }
      const rawSlice = getSliceForPage(pageNum)
      const { text, footnotes } = parseFootnotes(rawSlice)
      // Inject bibliography references cited on this page into the footnotes map
      const refs = refsMapRef.current
      if (Object.keys(refs).length > 0) {
        const cited = new Set<number>()
        // Match bare [N] citations (not already [[N]] footnote markers)
        for (const m of text.matchAll(/(?<!\[)\[(\d+)\](?!\])/g)) {
          const n = parseInt(m[1])
          if (refs[n]) cited.add(n)
        }
        for (const n of cited) {
          if (!footnotes[n]) footnotes[n] = refs[n]
        }
      }
      // footnotes injected inline
      
      // Append footnotes inline at bottom of page content
      let finalContent = preprocessContent(text)
      const fnEntries = Object.entries(footnotes).sort(([a], [b]) => Number(a) - Number(b))
      if (fnEntries.length > 0) {
        const fnBlock = fnEntries
          .map(([num, fnText]) => `**${num}.** ${fnText}`)
          .join('\n\n')
        finalContent += `\n\n---\n\n${fnBlock}`
      }
      setPageContent({ page_num: pageNum, content: finalContent, book_id: book.id, word_count: 0, has_images: false })
      saveProgressDebounced(pageNum)
      if (!scrollMode) setProgressPercent((pageNum / book.total_pages) * 100)
    } catch (err: any) {
      console.error('Error loading page:', err)
      setLoadError(err?.message || 'Failed to load book content. Check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Chat book: send message, get AI reply, append both to book content
  const sendChatBookMessage = async () => {
    if (!chatInput.trim() || chatSending) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatSending(true)
    try {
      const charPageLength = book.char_page_length ?? 2000
      const existing = chatBookContent || contentCacheRef.current || fullContent || ''

      // Use the simple API route — works for all users, no conversation setup needed
      const res = await fetch('/api/problem-set-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: msg,
          mode: 'solution',
          instruction: `You are a helpful, conversational AI assistant. The conversation so far:\n\n${existing.slice(-4000)}\n\nRespond naturally and helpfully to the user's latest message. Use markdown for formatting.`,
          bookTitle: book.title,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const aiReply = data.content || 'Sorry, I could not generate a response.'

      const userBlock = `\n\n**You:** ${msg}\n\n`
      const aiBlock = `**Assistant:** ${aiReply}\n\n---\n`
      const newContent = userBlock + aiBlock
      const updated = existing + newContent

      // Update display immediately (don't block on persistence)
      contentCacheRef.current = updated
      setChatBookContent(updated)

      // Persist in background (non-blocking)
      if (isAuthenticated) {
        booksQueries.appendContent(book.id, book.file_path, newContent, charPageLength).catch(() => {})
      } else {
        import('@/lib/localStorage').then(({ saveBookContent: save }) => save(book.id, updated)).catch(() => {})
        setFullContent(updated)
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        const el = scrollContainerRef.current
        if (el) el.scrollTop = el.scrollHeight
      }, 100)
    } catch (err: any) {
      console.error('Chat book send failed:', err)
      setChatInput(msg) // restore the input so user can retry
      setLoadError(err?.message || 'Failed to send message')
    } finally {
      setChatSending(false)
    }
  }

  const pickRandomSource = (sources: string[], customUrls: string[]) => {
    const pool = [...sources, ...customUrls]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const prefetchSerendipity = (sources: string[], customUrls: string[]) => {
    const pool = [...sources, ...customUrls]
    if (!pool.length) return
    const source = pool[Math.floor(Math.random() * pool.length)]
    fetch(`/api/serendipity?source=${encodeURIComponent(source)}`)
      .then(r => r.ok ? r.json() : null)
      .then(card => { if (card && !card.error) prefetchedCardRef.current = card })
      .catch(() => {})
  }

  const dismissSerendipity = () => {
    setSerendipityCard(null)
    if (serendipityTimerRef.current) clearTimeout(serendipityTimerRef.current)
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      lastScrollPageRef.current = pageNum
      onPageChange?.(pageNum)

      // In scroll mode, physically scroll to the corresponding position
      if (scrollMode && scrollContainerRef.current) {
        const el = scrollContainerRef.current
        const tp = totalPages
        const pct = tp <= 1 ? 0 : (pageNum - 1) / (tp - 1)
        requestAnimationFrame(() => {
          el.scrollTop = pct * (el.scrollHeight - el.clientHeight)
        })
      }

      if (serendipityPrefs?.enabled && !scrollMode) {
        const { sources, customUrls = [], frequency } = serendipityPrefs
        const pool = [...sources, ...customUrls]
        if (pool.length > 0) {
          flipCountRef.current += 1
          if (flipCountRef.current % frequency === 0) {
            const show = (card: SerendipityCard) => {
              setSerendipityCard(card)
              if (serendipityTimerRef.current) clearTimeout(serendipityTimerRef.current)
              serendipityTimerRef.current = setTimeout(() => setSerendipityCard(null), 10000)
              prefetchSerendipity(sources, customUrls)
            }
            if (prefetchedCardRef.current) {
              show(prefetchedCardRef.current)
              prefetchedCardRef.current = null
            } else {
              const source = pickRandomSource(sources, customUrls)
              fetch(`/api/serendipity?source=${encodeURIComponent(source)}`)
                .then(r => r.ok ? r.json() : null)
                .then(card => { if (card && !card.error) show(card) })
                .catch(() => {})
            }
          }
        }
      }
    }
  }

  const checkWikiUpdates = async () => {
    if (!isWiki || !book.source_url) return
    setWikiChecking(true)
    try {
      const match = book.source_url.match(/([a-z]+)\.wikipedia\.org\/wiki\/(.+)/)
      if (!match) return
      const [, lang, articleKey] = match
      const params = new URLSearchParams({ title: articleKey, lang, from_revid: book.wiki_revid ?? '' })
      const res = await fetch(`/api/wikipedia?${params}`)
      const data = await res.json()
      setWikiDiff(data)
      setWikiDiffOpen(true)
    } catch (e) {
      console.error('Wiki update check failed', e)
    } finally {
      setWikiChecking(false)
    }
  }

  const updateWikiToLatest = async () => {
    if (!isWiki || !book.source_url || !wikiDiff?.hasUpdate) return
    setWikiUpdating(true)
    try {
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(book.source_url)}`)
      const data = await res.json()
      if (data.type !== 'wikipedia' || !data.markdown) throw new Error('Unexpected response from fetch-url')
      await booksQueries.updateWikiContent(book.id, book.file_path, data.markdown, String(data.revid), book.char_page_length ?? 420)
      // Clear cache so next page load re-fetches updated content
      contentCacheRef.current = null
      pageBreaksRef.current = []
      book.wiki_revid = String(data.revid)
      book.total_pages = Math.ceil(data.markdown.length / (book.char_page_length ?? 420))
      setWikiDiff(null)
      setWikiDiffOpen(false)
      onTocReady?.([])
      setAuthTotalPages(0)
      await loadPage(1)
    } catch (e) {
      console.error('Wiki update failed', e)
      alert('Failed to update article. Please try again.')
    } finally {
      setWikiUpdating(false)
    }
  }

  const handleTranslate = async (force = false) => {
    if (!translationPrompt || !isAuthenticated || !contentCacheRef.current) return
    if (translatedPages[currentPage] && !force) {
      return handleTranslate(true) // re-translate
    }
    const rawSlice = pageBreaksRef.current.length > 0 ? getSliceForPage(currentPage) : ''
    if (!rawSlice) return
    track('translate_page', { book_id: book?.id, page: currentPage })
    setIsTranslating(true)
    try {
      const res = await fetch('/api/translate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawSlice, prompt: translationPrompt }),
      })
      const translated = await res.text()
      const updated = { ...translatedPages, [currentPage]: translated }
      setTranslatedPages(updated)
      translatedPagesRef.current = updated
      translationQueries.upsert(book.id, currentPage, translationPrompt, translated).catch(() => {})
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setIsTranslating(false)
    }
  }

  // Memoize scroll-mode ReactMarkdown so page/progress state changes don't re-render the entire book
  const localScrollContent = useMemo(() => {
    if (!fullContent || !scrollMode || isAuthenticated) return null
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]}
        components={{
          img: ({ src, alt }) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
          a: ({ href, children }) => {
            const postMatch = href?.match(/#p(\d+)$/)
            if (postMatch) {
              return <a className="text-orange-500 hover:underline cursor-pointer font-mono text-sm" onClick={e => { e.preventDefault(); const content = contentCacheRef.current; if (!content) return; const idx = content.indexOf(`No.${postMatch[1]}`); if (idx === -1) return; const page = Math.max(1, Math.round((idx / content.length) * totalLocalPages)); goToPage(page); setHighlightedPostId(postMatch[1]) }}>{children}</a>
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          },
        }}
      >{addPostAnchors(fullContent)}</ReactMarkdown>
    )
  }, [fullContent, showInlineImages])

  const authScrollContent = useMemo(() => {
    const cached = contentCacheRef.current
    if (!cached || !scrollMode || !isAuthenticated) return null
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]}
        components={{
          img: ({ src, alt }: any) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
          a: ({ href, children }: any) => {
            if (href?.startsWith('fn:')) return <sup className="text-amber-600 dark:text-amber-400">{children}</sup>
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          },
        }}
      >{preprocessContent(cached)}</ReactMarkdown>
    )
  // contentCacheRef is a ref — use isLoading as proxy for when content changes
  }, [isLoading, scrollMode, isAuthenticated, showInlineImages])


  return (
    <>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
      {/* Single merged header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1 px-2 py-2" style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        {/* Back */}
        <button onClick={onBack} className="btn btn-secondary p-2 flex-shrink-0" title="Library">
          <ArrowLeft size={18} />
        </button>

        {/* Title + progress OR search input */}
        {searchOpen ? (
          <input
            ref={searchInputRef}
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) } }}
            placeholder="Search pages…"
            className="flex-1 min-w-0 input text-sm py-1.5"
          />
        ) : (
          <div className="flex-1 min-w-0 px-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{book.title}</p>
            {scrollMode ? (
              <span ref={pageDisplayRef} className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                p.{currentPage}/{totalPages}{progressPercent > 0 ? ` · ${progressPercent.toFixed(0)}%` : ''}
              </span>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                p.{currentPage}/{totalPages}{progressPercent > 0 ? ` · ${progressPercent.toFixed(0)}%` : ''}
              </p>
            )}
          </div>
        )}

        {/* Search */}
        <button
          onClick={() => {
            if (searchOpen) { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }
            else { setSearchOpen(true) }
          }}
          title="Search book"
          className={`btn btn-secondary p-2 flex-shrink-0 ${searchOpen ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-600 dark:text-blue-400' : ''}`}
        >
          {searchOpen ? <XIcon size={18} /> : <Search size={18} />}
        </button>

        {/* View mode: mobile = scroll ↔ paginated; desktop = scroll → 1-up → 2-up → 3-up → scroll */}
        <button
          onClick={() => {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
            if (isMobile) {
              // Mobile: just toggle scroll ↔ paginated (1-up only)
              toggleScrollMode()
              setPagesPerView(1)
              try { localStorage.setItem('bza-pages-per-view', '1') } catch {}
            } else if (scrollMode) {
              toggleScrollMode()
              setPagesPerView(1)
              try { localStorage.setItem('bza-pages-per-view', '1') } catch {}
            } else if (pagesPerView < 3) {
              const next = (pagesPerView + 1) as 2 | 3
              setPagesPerView(next)
              try { localStorage.setItem('bza-pages-per-view', String(next)) } catch {}
            } else {
              toggleScrollMode()
              setPagesPerView(1)
              try { localStorage.setItem('bza-pages-per-view', '1') } catch {}
            }
          }}
          title={scrollMode ? 'Scroll mode — click for paginated' : `${pagesPerView}-up — click to cycle`}
          className={`btn btn-secondary p-2 flex-shrink-0 flex items-center gap-0.5 ${!scrollMode ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 text-indigo-600 dark:text-indigo-400' : ''}`}
        >
          {scrollMode ? <AlignJustify size={18} /> : <Columns2 size={18} />}
          {!scrollMode && pagesPerView > 1 && <span className="text-xs leading-none">{pagesPerView}</span>}
        </button>

        {/* Image mode cycle: 0=both, 1=side only, 2=inline only, 3=none */}
        <button
          onClick={() => { cycleImageMode(); if (imageMode === 3) setImagesDrawerOpen(true) }}
          title={['All images — click to cycle', 'Side images only', 'Inline images only', 'No images — click to show'][imageMode]}
          className={`btn btn-secondary p-2 flex-shrink-0 relative flex items-center gap-0.5 ${imageMode === 3 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 text-orange-600 dark:text-orange-400' : imagesDrawerOpen ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400' : ''}`}
        >
          {imageMode === 3 ? <ImageOff size={18} /> : <ImageIcon size={18} />}
          {imageMode > 0 && imageMode < 3 && (
            <span className="text-[9px] leading-none font-bold">{imageMode === 1 ? 'S' : 'I'}</span>
          )}
          {imageMode < 3 && (bookImages.filter(img => (img.page_num ?? img.page_number ?? 1) > 0).length + inlineImages.length) > 0 && (
            <span className="absolute -top-1 -right-1 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold bg-green-600 text-white">
              {bookImages.filter(img => (img.page_num ?? img.page_number ?? 1) > 0).length + inlineImages.length}
            </span>
          )}
        </button>

        {/* Translation toggle (auth only) — switches to paginated 1-up + shows translation pane */}
        {isAuthenticated && (
          <button
            onClick={() => {
              const next = !showTranslatePanel
              setShowTranslatePanel(next)
              if (next) {
                // Switch to paginated 1-up mode so we get a true side-by-side layout
                setScrollMode(false)
                setPagesPerView(1)
                try {
                  localStorage.setItem('bza-scroll-mode', 'false')
                  localStorage.setItem('bza-pages-per-view', '1')
                } catch {}
              }
            }}
            title="Translation"
            className={`btn btn-secondary p-2 flex-shrink-0 ${showTranslatePanel ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 text-violet-600 dark:text-violet-400' : ''}`}
          >
            <Languages size={18} />
          </button>
        )}

        {/* Narration */}
        <button
          onClick={() => narrating || narrateLoading ? stopNarration() : narratePage(currentPage, true)}
          title={narrating ? 'Stop narration' : narrateLoading ? 'Loading voice…' : 'Start narration (auto-advance)'}
          className={`btn btn-secondary p-2 flex-shrink-0 ${narrating ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 text-purple-600 dark:text-purple-400' : narrateLoading ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 text-amber-600' : ''}`}
        >
          {narrateLoading ? <Loader2 size={18} className="animate-spin" /> : narrating ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Wikipedia: check for updates */}
        {isWiki && (
          <button
            onClick={checkWikiUpdates}
            disabled={wikiChecking}
            title="Check for Wikipedia updates"
            className="btn btn-secondary p-2 flex-shrink-0 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50"
          >
            <RefreshCw size={18} className={wikiChecking ? 'animate-spin' : ''} />
          </button>
        )}

        {/* Sidebar toggle — cycles hidden → normal → wide on desktop */}
        <button
          onClick={onToggleSidebar}
          title={sidebarMode === 'hidden' ? 'Open sidebar' : sidebarMode === 'normal' ? 'Expand sidebar' : 'Close sidebar'}
          className={`btn btn-secondary p-2 flex-shrink-0 ${
            sidebarMode === 'wide'
              ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-400 text-blue-700 dark:text-blue-300'
              : sidebarMode === 'normal'
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-600'
              : ''
          }`}
        >
          {sidebarMode === 'wide' ? <Maximize2 size={18} /> : <PanelRight size={18} />}
        </button>
      </div>

      {/* Mobile-only page nav — bottom bar can be hidden by browser chrome / tab-close popups */}
      {!scrollMode && (
        <div className="md:hidden flex items-center justify-center gap-2 px-2 py-1.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => goToPage(currentPage - pagesPerView)}
            disabled={currentPage <= 1}
            className="btn btn-secondary flex items-center justify-center py-1.5 px-3 text-sm disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="number"
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value)
              if (page >= 1 && page <= totalPages) goToPage(page)
            }}
            className="input w-20 text-center py-1.5 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={1}
            max={totalPages}
            aria-label="Current page"
          />
          <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">/ {totalPages}</span>
          <button
            onClick={() => goToPage(currentPage + pagesPerView)}
            disabled={currentPage + pagesPerView - 1 >= totalPages}
            className="btn btn-secondary flex items-center justify-center py-1.5 px-3 text-sm disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {progressPercent > 0 && (
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* Search results dropdown */}
      {searchOpen && (searchResults.length > 0 || searchQuery.trim().length > 0) && (
        <div className="absolute left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-xl max-h-72 overflow-y-auto">
          {searchResults.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 italic">No matches found.</p>
          ) : searchResults.map(r => (
            <button
              key={r.pageNum}
              onClick={() => { goToPage(r.pageNum); setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-baseline gap-3"
            >
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 w-10">p.{r.pageNum}</span>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{r.snippet}</span>
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Serendipity card — replaces page content, tap to dismiss */}
      {serendipityCard && (
        <SerendipityOverlay card={serendipityCard} onDismiss={dismissSerendipity} />
      )}

      {/* content area — flex-1 fills remaining height */}
      <div
        ref={containerRef}
        style={{ flex: serendipityCard ? '0 0 0' : '1 1 0', minHeight: 0, overflow: 'hidden', position: 'relative', display: serendipityCard ? 'none' : undefined }}
        onTouchStart={!isAuthenticated ? (e) => {
          touchStartX.current = e.touches[0].clientX
          touchStartY.current = e.touches[0].clientY
        } : undefined}
        onTouchEnd={!isAuthenticated ? (e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          const dy = e.changedTouches[0].clientY - (touchStartY.current ?? 0)
          touchStartX.current = null
          touchStartY.current = null
          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical swipe — advance by pagesPerView
            if (Math.abs(dy) < 40) return
            if (dy < 0) goToPage(currentPage + pagesPerView)
            else goToPage(currentPage - pagesPerView)
          } else {
            // Horizontal swipe — advance by 1
            if (Math.abs(dx) < 40) return
            if (dx < 0) goToPage(currentPage + 1)
            else goToPage(currentPage - 1)
          }
        } : undefined}
      >

        {/* ── Local path: CSS columns (paginated) or vertical scroll ── */}
        {!isAuthenticated && !isManga && !isChatBook && (
          fullContent ? (
            scrollMode ? (
              <div ref={scrollContainerRef} onScroll={handleScrollProgress} style={{ position: 'absolute', inset: 0, overflowY: 'scroll', paddingBottom: isChatBook ? 64 : 0 }}>
                <div className={`max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`} lang="en">
                  {localScrollContent}
                </div>
              </div>
            ) : pageBreaksRef.current.length > 0 && contentCacheRef.current ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {Array.from({ length: pagesPerView }, (_, i) => {
                const pageNum = Math.min(currentPage + i, totalPages || 1)
                if (currentPage + i > (totalPages || 1)) return null
                return (
                  <div
                    key={pageNum}
                    style={{ flex: 1, overflowY: 'scroll', borderLeft: i > 0 ? '1px solid var(--border-color, #e5e7eb)' : undefined }}
                  >
                    <div
                      className={`max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}
                      lang="en"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]}
                        components={{
                          img: ({ src, alt }) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
                          a: ({ href, children }) => {
                            if (href?.startsWith('fn:')) return <sup className="text-amber-600 dark:text-amber-400">{children}</sup>
                            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                          },
                        }}
                      >
                        {preprocessContent(getSliceForPage(pageNum))}
                      </ReactMarkdown>
                    </div>
                  </div>
                )
              })}
            </div>
            ) : (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div
                ref={columnsRef}
                style={{
                  columnWidth: containerWidth > 0 ? `${containerWidth}px` : '100vw',
                  columnGap: 0,
                  height: '100%',
                  overflow: 'hidden',
                  transform: containerWidth > 0
                    ? `translateX(${-(currentPage - 1) * containerWidth}px)`
                    : undefined,
                  transition: 'transform 0.3s ease',
                  willChange: 'transform',
                }}
              >
                <div
                  className={`max-w-prose mx-auto px-6 pt-8 pb-8 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}
                  lang="en"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]}
                    components={{
                      img: ({ src, alt }) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
                      a: ({ href, children }) => {
                        const postMatch = href?.match(/#p(\d+)$/)
                        if (postMatch) {
                          return (
                            <a
                              className="text-orange-500 hover:underline cursor-pointer font-mono text-sm"
                              onClick={e => {
                                e.preventDefault()
                                const content = contentCacheRef.current
                                if (!content) return
                                const idx = content.indexOf(`No.${postMatch[1]}`)
                                if (idx === -1) return
                                // Local path: no pageBreaks computed; use proportional estimate
                                const page = pageBreaksRef.current.length > 1
                                  ? pageBreaksRef.current.findIndex((b, i) => b <= idx && (pageBreaksRef.current[i + 1] ?? Infinity) > idx) + 1
                                  : Math.max(1, Math.round((idx / content.length) * totalLocalPages))
                                goToPage(Math.max(1, page))
                                setHighlightedPostId(postMatch[1])
                              }}
                            >
                              {children}
                            </a>
                          )
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                      },
                    }}
                  >
                    {addPostAnchors(fullContent)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 px-6">
              {book.file_path === 'local' ? (
                <>
                  <p className="text-sm font-medium mb-2">No content available</p>
                  <p className="text-xs text-center max-w-xs">Content couldn't be loaded. Try refreshing, or create a free account to read from the cloud.</p>
                </>
              ) : (
                <div className="spinner" />
              )}
            </div>
          )
        )}

        {/* ── Chat book: dedicated content + input ── */}
        {isChatBook && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 5 }} className="bg-gray-50 dark:bg-gray-900">
            <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
              <div className="max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 dark:prose-invert">
                {chatBookContent ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false }]]}>
                    {chatBookContent}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic">Send a message to start the conversation…</p>
                )}
                {chatSending && <p className="text-gray-400 animate-pulse">Thinking…</p>}
                {loadError && <p className="text-red-500 text-sm">{loadError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Chat book input bar */}
        {isChatBook && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 z-10">
            <form
              onSubmit={e => { e.preventDefault(); sendChatBookMessage() }}
              className="flex gap-2 max-w-prose mx-auto"
            >
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message…"
                disabled={chatSending}
                className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 text-sm flex items-center gap-1"
              >
                {chatSending ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
              </button>
            </form>
          </div>
        )}

        {/* Images drawer */}
        {imagesDrawerOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-72 max-w-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto z-20 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <ImageIcon size={15} />
                Images
              </h3>
              <button onClick={() => setImagesDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XIcon size={18} />
              </button>
            </div>
            {!showSideImages ? (
              <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">Images are hidden. Toggle the image button in the toolbar to show them.</p>
            ) : bookImages.length === 0 && inlineImages.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No images for this book.</p>
            ) : (
              <div className="px-4 py-3 space-y-5">
                {[...bookImages].filter(img => (img.page_num ?? img.page_number ?? 1) > 0).sort((a, b) => (a.page_num ?? a.page_number ?? 0) - (b.page_num ?? b.page_number ?? 0)).map((img, i) => {
                  const pageNum = img.page_num ?? img.page_number
                  return (
                    <figure key={img.id}>
                      <img src={img.image_url} alt={img.prompt} className="w-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" />
                      <figcaption className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-snug flex items-start gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Fig. {i + 1}.</span>
                        <span className="flex-1">{img.prompt}</span>
                        {pageNum && (
                          <button
                            onClick={() => { goToPage(pageNum); setImagesDrawerOpen(false) }}
                            className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            p.{pageNum}
                          </button>
                        )}
                      </figcaption>
                    </figure>
                  )
                })}
                {inlineImages.map((img, i) => (
                  <figure key={`inline-${i}`}>
                    <img
                      src={img.url}
                      alt={img.alt}
                      referrerPolicy="no-referrer"
                      className="w-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    />
                    {img.page > 0 && (
                      <figcaption className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex justify-end">
                        <button
                          onClick={() => { goToPage(img.page); setImagesDrawerOpen(false) }}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          p.{img.page}
                        </button>
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footnotes drawer removed — footnotes now render inline at bottom of page content */}

        {/* ── Manga reader — full-page images ── */}
        {isManga && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
            {mangaPageUrls[currentPage] ? (
              <img
                src={mangaPageUrls[currentPage]}
                alt={`Page ${currentPage}`}
                className="max-h-full max-w-full object-contain"
                style={{ userSelect: 'none' }}
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="spinner mx-auto mb-4" />
                <p className="text-sm">Loading page {currentPage}…</p>
              </div>
            )}
            {/* OCR button */}
            <button
              onClick={async () => {
                if (mangaOcrLoading) return
                setMangaOcrLoading(true)
                try {
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) return
                  const FUNCTIONS_BASE = (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) + '/functions/v1'
                  const res = await fetch(`${FUNCTIONS_BASE}/manga-ocr`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                    body: JSON.stringify({ bookId: book.id, pageNum: currentPage }),
                  })
                  if (!res.ok) throw new Error('OCR failed')
                  const { text } = await res.json()
                  if (text) {
                    setPageContent({ page_num: currentPage, content: text, book_id: book.id, word_count: text.split(/\s+/).length, has_images: true })
                  }
                } catch (err: any) {
                  console.error('Manga OCR error:', err)
                } finally {
                  setMangaOcrLoading(false)
                }
              }}
              disabled={mangaOcrLoading}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs rounded-lg backdrop-blur flex items-center gap-1.5"
              title="Extract text from this page (for narration, search, accessibility)"
            >
              {mangaOcrLoading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
              {mangaOcrLoading ? 'Reading…' : 'Read page'}
            </button>
          </div>
        )}

        {/* ── Auth path: scroll mode — render full content vertically ── */}
        {isAuthenticated && !isManga && !isChatBook && scrollMode && (
          <div ref={scrollContainerRef} onScroll={handleScrollProgress} style={{ position: 'absolute', inset: 0, overflowY: 'scroll' }}>
            {!contentCacheRef.current ? (
              <div className="text-center py-16"><div className="spinner mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-300">Loading…</p></div>
            ) : (
              <div className={`max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`} lang="en">
                {authScrollContent}
              </div>
            )}
          </div>
        )}

        {/* ── Auth path: server-paginated (containerRef scrolls) ── */}
        {isAuthenticated && !isManga && !isChatBook && !scrollMode && (() => {
          const sharedMdComponents: any = {
            img: ({ src, alt }: any) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
            a: ({ href, children }: any) => {
              if (href?.startsWith('fn:')) return <sup className="text-amber-600 dark:text-amber-400">{children}</sup>
              const postMatch = href?.match(/#p(\d+)$/)
              if (postMatch) {
                return <a className="text-orange-500 hover:underline cursor-pointer font-mono text-sm" onClick={(e: any) => { e.preventDefault(); const content = contentCacheRef.current; if (!content) return; const idx = content.indexOf(`No.${postMatch[1]}`); if (idx === -1) return; const breaks = pageBreaksRef.current; const page = breaks.length > 1 ? breaks.findIndex((b: number, i: number) => b <= idx && (breaks[i + 1] ?? Infinity) > idx) + 1 : Math.floor(idx / (book.char_page_length ?? 420)) + 1; goToPage(Math.max(1, page)); setHighlightedPostId(postMatch[1]) }}>{children}</a>
              }
              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            },
          }
          const proseClass = `max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`
          return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            {/* Original content column(s) */}
            <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            {isLoading ? (
              <div className="flex-1 text-center py-16">
                <div className="spinner mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading page...</p>
              </div>
            ) : pageContent ? (
              <>
                {Array.from({ length: pagesPerView }, (_, i) => {
                  const pageNum = currentPage + i
                  if (pageNum > totalPages) return null
                  const rawContent = i === 0
                    ? pageContent.content
                    : (() => {
                        if (!contentCacheRef.current || pageBreaksRef.current.length === 0) return ''
                        const { text } = parseFootnotes(getSliceForPage(pageNum))
                        return preprocessContent(text)
                      })()
                  const content = rawContent

                  return (
                    <div
                      key={pageNum}
                      style={{ flex: 1, overflowY: 'scroll', borderLeft: i > 0 ? '1px solid var(--border-color, #e5e7eb)' : undefined }}
                    >
                      <div className={proseClass} lang="en">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]}
                          components={sharedMdComponents}
                        >
                          {content}
                        </ReactMarkdown>
                        {i === 0 && pageContent.word_count > 0 && (
                          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                            {pageContent.word_count} words
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 px-6">
                <p className="text-sm font-medium mb-2">{loadError || 'No content available'}</p>
                <button onClick={() => { setLoadError(null); loadPage(currentPage) }} className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 mt-2">
                  Retry
                </button>
              </div>
            )}
            </div>
            {/* Translation pane — full overlay on mobile, side panel on desktop */}
            {showTranslatePanel && (() => {
              const hasTranslation = !!translatedPages[currentPage]
              const origContent = contentCacheRef.current && pageBreaksRef.current.length > 0 ? preprocessContent(getSliceForPage(currentPage)) : ''
              const translatedContent = translatedPages[currentPage] ?? ''
              const showOriginal = translateView === 'original' || translateView === 'split'
              const showTranslated = translateView === 'translated' || translateView === 'split'

              return (
                <div className="fixed inset-0 z-30 flex flex-col bg-white dark:bg-gray-800 lg:relative lg:inset-auto lg:z-auto" style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border-color, #e5e7eb)' }}>
                  {/* Header bar */}
                  <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex-shrink-0 space-y-2">
                    {/* Prompt row */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowTranslatePanel(false)} className="lg:hidden btn btn-secondary p-1.5 flex-shrink-0">
                        <XIcon size={16} />
                      </button>
                      <input
                        type="text"
                        value={translationPrompt}
                        onChange={e => setTranslationPrompt(e.target.value)}
                        placeholder="e.g. translate to Spanish, summarize, explain simply…"
                        className="input flex-1 min-w-0 text-sm py-2"
                        onKeyDown={e => { if (e.key === 'Enter') handleTranslate() }}
                      />
                      <button
                        onClick={() => handleTranslate()}
                        disabled={!translationPrompt || isTranslating}
                        className="btn btn-primary text-sm px-3 py-2 disabled:opacity-40 whitespace-nowrap flex-shrink-0"
                      >
                        {isTranslating ? '…' : 'Go'}
                      </button>
                    </div>
                    {/* Controls row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Page nav */}
                      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} className="btn btn-secondary p-1 disabled:opacity-30" title="Previous page">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-mono text-gray-500 min-w-[3ch] text-center">{currentPage}</span>
                      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="btn btn-secondary p-1 disabled:opacity-30" title="Next page">
                        <ChevronRight size={14} />
                      </button>
                      {/* Auto-translate */}
                      <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none ml-1">
                        <input type="checkbox" checked={autoTranslate} onChange={e => setAutoTranslate(e.target.checked)} className="rounded" />
                        Auto
                      </label>
                      {/* View mode */}
                      <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-600 text-[10px] ml-auto">
                        {(['translated', 'split', 'original'] as const).map(v => (
                          <button
                            key={v}
                            onClick={() => setTranslateView(v)}
                            className={`px-2 py-1 transition-colors ${translateView === v ? 'bg-violet-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                          >
                            {v === 'translated' ? 'Result' : v === 'original' ? 'Original' : 'Split'}
                          </button>
                        ))}
                      </div>
                      {/* Extra actions */}
                      {hasTranslation && (
                        <>
                          <button
                            onClick={() => narratingTranslation ? stopNarration() : narrateTranslation(currentPage)}
                            className={`btn btn-secondary p-1 flex-shrink-0 ${narratingTranslation ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-600' : ''}`}
                          >
                            {narratingTranslation ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          </button>
                          {savedTranslatedBookId ? (
                            <a href={`/books/${savedTranslatedBookId}`} className="btn btn-secondary text-[10px] px-1.5 py-1 text-blue-600">Open →</a>
                          ) : (
                            <button onClick={saveTranslatedBook} disabled={savingTranslatedBook} className="btn btn-secondary p-1 disabled:opacity-40" title="Save as book">
                              {savingTranslatedBook ? <Loader2 size={12} className="animate-spin" /> : <BookDown size={12} />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Content area */}
                  <div className={`flex-1 overflow-hidden flex ${translateView === 'split' ? 'flex-col landscape:flex-row' : ''}`}>
                    {/* Original pane */}
                    {showOriginal && (
                      <div className={`overflow-y-auto ${translateView === 'split' ? 'flex-1 border-b landscape:border-b-0 landscape:border-r border-gray-200 dark:border-gray-700' : 'flex-1'}`}>
                        <div className={`max-w-prose mx-auto px-5 pt-6 pb-10 prose prose-base font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]} components={sharedMdComponents}>
                            {origContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {/* Translated pane */}
                    {showTranslated && (
                      <div className="overflow-y-auto flex-1">
                        {translatedContent ? (
                          <div className={`max-w-prose mx-auto px-5 pt-6 pb-10 prose prose-base font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeKatex, { throwOnError: false, output: 'htmlAndMathml' }]]} components={sharedMdComponents}>
                              {translatedContent}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500 p-8 text-center">
                            {isTranslating ? <><Loader2 size={16} className="animate-spin mr-2" /> Translating…</> : 'Click Go to translate this page'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
          )
        })()}
      </div>

      {/* Wikipedia diff modal */}
      {wikiDiffOpen && wikiDiff && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setWikiDiffOpen(false)}>
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {wikiDiff.hasUpdate ? 'Wikipedia article updated' : 'No updates found'}
                </span>
              </div>
              <button onClick={() => setWikiDiffOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <XIcon size={18} />
              </button>
            </div>

            {/* Revid info */}
            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              {wikiDiff.hasUpdate
                ? <>Revision {book.wiki_revid} → {wikiDiff.latestRevid}</>
                : <>Already at latest revision ({wikiDiff.latestRevid})</>
              }
              {wikiDiff.diffUrl && (
                <a href={wikiDiff.diffUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-blue-500 hover:underline inline-flex items-center gap-1">
                  Full diff <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Diff rows */}
            {wikiDiff.hasUpdate && wikiDiff.diffRows && wikiDiff.diffRows.length > 0 ? (
              <div className="overflow-y-auto flex-1 font-mono text-xs p-3 space-y-0.5">
                {wikiDiff.diffRows.map((row, i) => (
                  <div
                    key={i}
                    className={
                      row.type === 1 ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded' :
                      row.type === 2 ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-0.5 rounded' :
                      row.type === 3 ? 'font-bold text-gray-700 dark:text-gray-300 px-2 py-1' :
                      'text-gray-500 dark:text-gray-400 px-2 py-0.5'
                    }
                  >
                    {row.type === 1 ? '+ ' : row.type === 2 ? '− ' : ''}{row.content || ' '}
                  </div>
                ))}
              </div>
            ) : wikiDiff.hasUpdate ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Update detected but diff details unavailable.
                {wikiDiff.diffUrl && (
                  <a href={wikiDiff.diffUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">View on Wikipedia</a>
                )}
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                Your copy is up to date.
              </div>
            )}

            {/* Update to latest button */}
            {wikiDiff.hasUpdate && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  onClick={updateWikiToLatest}
                  disabled={wikiUpdating}
                  className="btn btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={wikiUpdating ? 'animate-spin' : ''} />
                  {wikiUpdating ? 'Updating…' : 'Update to latest'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!scrollMode && <div
        className="hidden md:block bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between max-w-prose mx-auto px-2 py-2 gap-2">
          <button
            onClick={() => goToPage(currentPage - pagesPerView)}
            disabled={currentPage <= 1}
            className="btn btn-secondary flex items-center gap-1 flex-1 justify-center py-3 text-base disabled:opacity-40"
          >
            <ChevronLeft size={22} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) goToPage(page)
              }}
              className="input w-20 text-center py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={1}
              max={totalPages}
            />
            {pagesPerView > 1 && currentPage + pagesPerView - 1 <= totalPages && (
              <span className="text-gray-400 dark:text-gray-500 text-sm">–{currentPage + pagesPerView - 1}</span>
            )}
            <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">/ {totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + pagesPerView)}
            disabled={currentPage + pagesPerView - 1 >= totalPages}
            className="btn btn-secondary flex items-center gap-1 flex-1 justify-center py-3 text-base disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={22} />
          </button>
        </div>
      </div>}
    </div>

    </>
  )
}