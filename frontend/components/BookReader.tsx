'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Book, Page } from '@/types'
import { booksQueries, imageQueries } from '@/lib/queries'
import { getBookContent, getLocalProgress, saveLocalProgress } from '@/lib/localStorage'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { useReading } from './reader/useReading'
import { useWikiUpdate } from './reader/useWikiUpdate'
import { useSerendipity } from './reader/useSerendipity'
import { StorageImage } from './reader/StorageImage'
import { TranslationPanel } from './reader/TranslationPanel'
import { MangaReader } from './reader/MangaReader'
import { ChatBookReader } from './reader/ChatBookReader'
import { UnauthReader } from './reader/UnauthReader'
import { AuthReader } from './reader/AuthReader'
import { ReaderToolbar } from './reader/ReaderToolbar'
import { ImagesDrawer } from './reader/ImagesDrawer'
import { WikiDiffModal } from './reader/WikiDiffModal'
import { MobilePageNav, DesktopPageNav } from './reader/PageNav'
import {
  DEFAULT_CHAR_PAGE_LENGTH,
  addPostAnchors,
  citedReferences,
  computePageBreaks,
  extractInlineImages,
  footnoteBlock,
  parseFootnotes,
  parseReferences,
  parseToc,
  preprocessContent as preprocessWithRefs,
  searchPages as searchText,
  sliceForPage,
  type InlineImage,
  type TocEntry,
} from './reader/textPipeline'

// Re-exported: PageSidebar, ImagePanel and the book page import these from here.
export type { TocEntry, InlineImage }

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

import SerendipityOverlay from './SerendipityOverlay'
import { supabase } from '@/lib/supabase'

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

  const goToPageRef = useRef<(page: number) => void>(() => {})
  const isChatBook = book.content_type === 'chat_book'
  const isManga = book.content_type === 'manga'
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatBookContent, setChatBookContent] = useState('')
  const [mangaPageUrls, setMangaPageUrls] = useState<Record<number, string>>({})
  const [mangaOcrLoading, setMangaOcrLoading] = useState(false)

  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)

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

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  /**
   * Opening the translation pane forces paginated 1-up, because side-by-side is
   * only side-by-side against a single fixed page — in scroll mode the two
   * panes have nothing to line up on. Closing it leaves the mode alone rather
   * than restoring what was there before: the reader has been looking at a
   * paginated page and snapping them back out of it on close is more
   * disorienting than leaving them where they are.
   */
  const toggleTranslatePanel = () => {
    const next = !showTranslatePanel
    setShowTranslatePanel(next)
    if (next) {
      setScrollMode(false)
      setPagesPerView(1)
      try {
        localStorage.setItem('bza-scroll-mode', 'false')
        localStorage.setItem('bza-pages-per-view', '1')
      } catch {}
    }
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


  const { serendipityCard, dismissSerendipity, maybeShowOnPageFlip } = useSerendipity({ prefs: serendipityPrefs })

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

  const {
    // narration primitives (from useNarration inside useReading)
    narrating, narrateLoading, narratingTranslation, narrateAutoAdvance, stopNarration,
    // translation state
    translationPrompt, setTranslationPrompt,
    translatedPages,
    isTranslating,
    showTranslatePanel, setShowTranslatePanel,
    autoTranslate, setAutoTranslate,
    translateView, setTranslateView,
    savingTranslatedBook,
    savedTranslatedBookId,
    // composed handlers
    handleTranslate,
    saveTranslatedBook,
    narratePage,
    narrateTranslation,
  } = useReading({
    book, isAuthenticated, currentPage, totalPages, pagesPerView, scrollMode,
    fullContent, totalLocalPages,
    contentCacheRef, pageBreaksRef, getSliceForPage, goToPageRef,
  })

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

  const charPageLength = book.char_page_length ?? DEFAULT_CHAR_PAGE_LENGTH

  // Bound forms of the text pipeline. Both are passed down to the reader
  // components as props, so they close over the refs the pipeline needs rather
  // than making every child reach for them.
  const preprocessContent = (content: string) => preprocessWithRefs(content, refsMapRef.current)

  function getSliceForPage(pageNum: number): string {
    return sliceForPage(contentCacheRef.current!, pageNum, pageBreaksRef.current, charPageLength)
  }

  /**
   * Everything derived from a freshly loaded book, in one place.
   *
   * Called from three paths that each used to repeat this sequence (local
   * init, the auth-path first page load, and the Wikipedia update) — and the
   * order is load-bearing: the breaks have to exist before the TOC and the
   * inline images, since both report which page a thing is on.
   */
  const ingestContent = (content: string) => {
    pageBreaksRef.current = computePageBreaks(content, charPageLength)
    setAuthTotalPages(pageBreaksRef.current.length)
    refsMapRef.current = parseReferences(content)
    setInlineImages(extractInlineImages(content, pageBreaksRef.current))
    const entries = parseToc(content, pageBreaksRef.current)
    if (entries.length > 0) onTocReady?.(entries)
  }

  // Debounced search
  useEffect(() => {
    if (!searchOpen) return
    const t = setTimeout(
      () => setSearchResults(searchText(contentCacheRef.current ?? '', searchQuery, pageBreaksRef.current, charPageLength)),
      200,
    )
    return () => clearTimeout(t)
  }, [searchQuery, searchOpen])

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
          ingestContent(content)
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
        ingestContent(contentCacheRef.current)
      }
      const rawSlice = getSliceForPage(pageNum)
      const { text, footnotes } = parseFootnotes(rawSlice)
      // Inject bibliography references cited on this page into the footnotes map.
      // An authored footnote wins — a [[N]] marker carries its own text.
      const refs = refsMapRef.current
      for (const n of citedReferences(text, refs)) {
        if (!footnotes[n]) footnotes[n] = refs[n]
      }
      // Append footnotes inline at bottom of page content
      let finalContent = preprocessContent(text)
      const fnBlock = footnoteBlock(footnotes)
      if (fnBlock) finalContent += `\n\n---\n\n${fnBlock}`
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
      // Chat books paginate far longer than prose — a turn is not a page.
      const chatCharPageLength = book.char_page_length ?? 2000
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
        booksQueries.appendContent(book.id, book.file_path, newContent, chatCharPageLength).catch(() => {})
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

      maybeShowOnPageFlip(scrollMode)
    }
  }

  const {
    isWiki,
    wikiChecking,
    wikiUpdating,
    wikiDiff,
    wikiDiffOpen,
    setWikiDiffOpen,
    checkWikiUpdates,
    updateWikiToLatest,
  } = useWikiUpdate({ book, contentCacheRef, pageBreaksRef, onTocReady, setAuthTotalPages, loadPage })


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

  // Page 0 is the cover slot and is not counted — it belongs to the library card.
  const sideImageCount = bookImages.filter(img => (img.page_num ?? img.page_number ?? 1) > 0).length

  return (
    <>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
      <ReaderToolbar
        title={book.title}
        onBack={onBack}
        currentPage={currentPage}
        totalPages={totalPages}
        progressPercent={progressPercent}
        pageDisplayRef={pageDisplayRef}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={closeSearch}
        scrollMode={scrollMode}
        pagesPerView={pagesPerView}
        setPagesPerView={setPagesPerView}
        toggleScrollMode={toggleScrollMode}
        imageMode={imageMode}
        cycleImageMode={cycleImageMode}
        imagesDrawerOpen={imagesDrawerOpen}
        onOpenImagesDrawer={() => setImagesDrawerOpen(true)}
        imageCount={sideImageCount + inlineImages.length}
        isAuthenticated={isAuthenticated}
        showTranslatePanel={showTranslatePanel}
        onToggleTranslate={toggleTranslatePanel}
        narrating={narrating}
        narrateLoading={narrateLoading}
        onToggleNarration={() => narrating || narrateLoading ? stopNarration() : narratePage(currentPage, true)}
        isWiki={isWiki}
        wikiChecking={wikiChecking}
        onCheckWikiUpdates={checkWikiUpdates}
        sidebarMode={sidebarMode}
        onToggleSidebar={onToggleSidebar}
      />

      {!scrollMode && (
        <MobilePageNav
          currentPage={currentPage}
          totalPages={totalPages}
          pagesPerView={pagesPerView}
          onGoToPage={goToPage}
        />
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
              onClick={() => { goToPage(r.pageNum); closeSearch() }}
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
          <UnauthReader
            book={book}
            fullContent={fullContent}
            scrollMode={scrollMode}
            currentPage={currentPage}
            totalPages={totalPages}
            totalLocalPages={totalLocalPages}
            pagesPerView={pagesPerView}
            containerWidth={containerWidth}
            showInlineImages={showInlineImages}
            scrollContainerRef={scrollContainerRef}
            columnsRef={columnsRef}
            contentCacheRef={contentCacheRef}
            pageBreaksRef={pageBreaksRef}
            handleScrollProgress={handleScrollProgress}
            goToPage={goToPage}
            setHighlightedPostId={setHighlightedPostId}
            getSliceForPage={getSliceForPage}
            preprocessContent={preprocessContent}
            localScrollContent={localScrollContent}
          />
        )}

        {/* ── Chat book: dedicated content + input ── */}
        {isChatBook && (
          <ChatBookReader
            scrollContainerRef={scrollContainerRef}
            chatBookContent={chatBookContent}
            chatSending={chatSending}
            loadError={loadError}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={sendChatBookMessage}
          />
        )}

        {imagesDrawerOpen && (
          <ImagesDrawer
            bookImages={bookImages}
            inlineImages={inlineImages}
            showSideImages={showSideImages}
            onGoToPage={goToPage}
            onClose={() => setImagesDrawerOpen(false)}
          />
        )}

        {/* Footnotes drawer removed — footnotes now render inline at bottom of page content */}

        {/* ── Manga reader — full-page images ── */}
        {isManga && (
          <MangaReader
            bookId={book.id}
            currentPage={currentPage}
            mangaPageUrls={mangaPageUrls}
            mangaOcrLoading={mangaOcrLoading}
            setMangaOcrLoading={setMangaOcrLoading}
            onOcrText={text => setPageContent({
              page_num: currentPage,
              content: text,
              book_id: book.id,
              word_count: text.split(/\s+/).length,
              has_images: true,
            })}
          />
        )}

        {/* ── Auth path: scroll or server-paginated (with optional translation pane) ── */}
        {isAuthenticated && !isManga && !isChatBook && (
          <AuthReader
            book={book}
            scrollMode={scrollMode}
            isLoading={isLoading}
            pageContent={pageContent}
            loadError={loadError}
            currentPage={currentPage}
            totalPages={totalPages}
            pagesPerView={pagesPerView}
            showInlineImages={showInlineImages}
            scrollContainerRef={scrollContainerRef}
            contentCacheRef={contentCacheRef}
            pageBreaksRef={pageBreaksRef}
            handleScrollProgress={handleScrollProgress}
            goToPage={goToPage}
            setHighlightedPostId={setHighlightedPostId}
            setLoadError={setLoadError}
            loadPage={loadPage}
            getSliceForPage={getSliceForPage}
            preprocessContent={preprocessContent}
            parseFootnotes={parseFootnotes}
            authScrollContent={authScrollContent}
            renderTranslationPanel={showTranslatePanel ? (mdComponents) => (
              <TranslationPanel
                translationPrompt={translationPrompt}
                setTranslationPrompt={setTranslationPrompt}
                translatedPages={translatedPages}
                isTranslating={isTranslating}
                translateView={translateView}
                setTranslateView={setTranslateView}
                autoTranslate={autoTranslate}
                setAutoTranslate={setAutoTranslate}
                handleTranslate={handleTranslate}
                saveTranslatedBook={saveTranslatedBook}
                savingTranslatedBook={savingTranslatedBook}
                savedTranslatedBookId={savedTranslatedBookId}
                narratingTranslation={narratingTranslation}
                narrateTranslation={narrateTranslation}
                stopNarration={stopNarration}
                onClose={() => setShowTranslatePanel(false)}
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
                contentCacheRef={contentCacheRef}
                pageBreaksRef={pageBreaksRef}
                getSliceForPage={getSliceForPage}
                preprocessContent={preprocessContent}
                showInlineImages={showInlineImages}
                mdComponents={mdComponents}
              />
            ) : undefined}
          />
        )}
      </div>

      {wikiDiffOpen && wikiDiff && (
        <WikiDiffModal
          diff={wikiDiff}
          currentRevid={book.wiki_revid}
          updating={wikiUpdating}
          onUpdate={updateWikiToLatest}
          onClose={() => setWikiDiffOpen(false)}
        />
      )}

      {!scrollMode && (
        <DesktopPageNav
          currentPage={currentPage}
          totalPages={totalPages}
          pagesPerView={pagesPerView}
          onGoToPage={goToPage}
        />
      )}
    </div>

    </>
  )
}