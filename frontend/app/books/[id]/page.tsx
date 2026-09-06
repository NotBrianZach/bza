'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Book } from '@/types'
import { booksQueries } from '@/lib/queries/books'
import { settingsQueries, UserPrefs } from '@/lib/queries'
import { getLocalBook } from '@/lib/localStorage'
import { supabase } from '@/lib/supabase'
import { ensureSession } from '@/lib/anonAuth'
import BookReader, { TocEntry, InlineImage } from '@/components/BookReader'
import PageSidebar from '@/components/PageSidebar'
import dynamic from 'next/dynamic'
const ProblemMapWidget = dynamic(() => import('@/components/ProblemMapWidget'), { ssr: false })
import { ArrowLeft, Layers, Loader2, MessageCircle, ClipboardList, Copy, Check, FileCode, X, Bookmark } from 'lucide-react'
import { flashcardQueries, Flashcard } from '@/lib/queries/flashcards'
import { bookmarksQueries } from '@/lib/queries/bookmarks'
import { track } from '@/lib/analytics'

export default function BookPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookId = parseInt(params.id as string)
  const urlPage = parseInt(searchParams.get('page') ?? '1') || 1

  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Desktop: 'hidden' | 'normal' | 'wide' — cycles on toggle button click
  // Mobile: boolean (open/closed via overlay)
  const [sidebarMode, setSidebarMode] = useState<'hidden' | 'normal' | 'wide'>('hidden')

  useEffect(() => {
    if (window.innerWidth >= 1024) setSidebarMode('normal')
  }, [])

  // Auto-open sidebar for wiki articles (TOC is the primary nav)
  useEffect(() => {
    if (book?.content_type === 'wikipedia_article') setSidebarMode('normal')
  }, [book?.content_type])

  // Analytics: fire once per book open
  useEffect(() => {
    if (book?.id) track('book_open', { book_id: book.id, content_type: book.content_type })
  }, [book?.id])

  const cycleSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarMode(m => m === 'hidden' ? 'normal' : 'hidden')
    } else {
      setSidebarMode(m => m === 'hidden' ? 'normal' : m === 'normal' ? 'wide' : 'hidden')
    }
  }
  const [currentPage, setCurrentPage] = useState(urlPage)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([])
  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(new Set())
  const navigateRef = useRef<(page: number) => void>(() => {})

  // Text selection → flashcard creation / explain / problem set
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null)
  const [newFlashcard, setNewFlashcard] = useState<Flashcard | null>(null)
  const [creatingCard, setCreatingCard] = useState(false)
  const [explainPrompt, setExplainPrompt] = useState<string | null>(null)
  const selectionToolbarRef = useRef<HTMLDivElement>(null)

  // Problem set panel
  const [problemSetOpen, setProblemSetOpen] = useState(false)
  const [problemSetInitialProblem, setProblemSetInitialProblem] = useState<string | null>(null)
  // copiedSelection removed — replaced by bookmark button

  // Page source viewer
  const getPageSourceRef = useRef<(page: number) => string | null>(() => null)
  const [currentPageSource, setCurrentPageSource] = useState<string | null>(null)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [sourceCopied, setSourceCopied] = useState(false)

  // Retry fetching page source until content is loaded (async)
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const tryGet = () => {
      if (cancelled) return
      const src = getPageSourceRef.current(currentPage)
      if (src) { setCurrentPageSource(src); return }
      timer = setTimeout(tryGet, 400)
    }
    setCurrentPageSource(null)
    tryGet()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [currentPage])

  const openProblemSet = useCallback((problem?: string) => {
    track('problem_workspace_opened', { book_id: bookId, from_selection: !!problem })
    setProblemSetInitialProblem(problem ?? null)
    setProblemSetOpen(true)
    if (sidebarMode === 'hidden') setSidebarMode(window.innerWidth >= 1024 ? 'normal' : 'hidden')
  }, [sidebarMode, bookId])

  const openTutor = useCallback((prompt?: string) => {
    setProblemSetOpen(false)
    setProblemSetInitialProblem(null)
    if (sidebarMode === 'hidden') setSidebarMode('normal')
    if (prompt) setExplainPrompt(prompt)
  }, [sidebarMode])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Ignore clicks inside the selection toolbar itself
    if (selectionToolbarRef.current?.contains(e.target as Node)) return
    const sel = window.getSelection()
    const text = sel?.toString().trim() ?? ''
    if (text.length < 10) { setSelection(null); return }
    const range = sel?.getRangeAt(0)
    const rect = range?.getBoundingClientRect()
    if (!rect) { setSelection(null); return }
    setSelection({ text, x: rect.left + rect.width / 2, y: rect.top - 8 })
  }, [])

  const handleCreateCard = useCallback(async () => {
    if (!selection || !book || creatingCard) return
    setCreatingCard(true)
    try {
      const card = await flashcardQueries.generate(book.id, currentPage, selection.text)
      setNewFlashcard(card)
      setSelection(null)
      // Open sidebar to flashcards tab
      if (sidebarMode === 'hidden') setSidebarMode('normal')
    } catch (e: any) {
      console.error('create card error', e)
    } finally {
      setCreatingCard(false)
      window.getSelection()?.removeAllRanges()
    }
  }, [selection, book, currentPage, creatingCard, sidebarMode])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  // Dismiss toolbar when clicking elsewhere
  useEffect(() => {
    const dismiss = (e: MouseEvent) => {
      if (selectionToolbarRef.current?.contains(e.target as Node)) return
      const sel = window.getSelection()?.toString().trim() ?? ''
      if (!sel) setSelection(null)
    }
    document.addEventListener('mousedown', dismiss)
    return () => document.removeEventListener('mousedown', dismiss)
  }, [])

  useEffect(() => {
    if (bookId) {
      loadBook()
    }
  }, [bookId])

  const loadBook = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try localStorage first (for free tier)
      const localBook = getLocalBook(bookId)

      if (localBook) {
        setBook(localBook)
        setIsAuthenticated(false)
      } else {
        // Ensure session is ready (create anon session if needed)
        await ensureSession()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setError('Could not initialize session. Try refreshing the page.')
          return
        }
        // Try API (for authenticated users)
        try {
          const [book, prefsData] = await Promise.all([
            booksQueries.get(bookId),
            settingsQueries.getPrefs().catch(() => null),
          ])
          if (!book) {
            setError('Book not found (no data returned)')
            return
          }
          setBook(book)
          setIsAuthenticated(true)
          if (prefsData) setPrefs(prefsData)
          booksQueries.markRead(bookId)
          bookmarksQueries.list(bookId).then(bms => {
            setBookmarkedPages(new Set(bms.map(b => b.page_num)))
          }).catch(() => {})
        } catch (apiErr: any) {
          console.error('Book load error:', apiErr)
          const msg = apiErr?.message || apiErr?.code || JSON.stringify(apiErr) || 'unknown error'
          setError(`Book not found (${msg})`)
        }
      }
    } catch (err: any) {
      console.error('Error loading book:', err)
      setError('Failed to load book')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading book...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Book not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', overflow: 'hidden' }}>
      {/* Text selection → create flashcard toolbar */}
      {selection && isAuthenticated && (
        <div
          ref={selectionToolbarRef}
          style={{
            position: 'fixed',
            left: `${selection.x}px`,
            top: `${selection.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="flex items-center gap-1 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg px-2 py-1.5"
        >
          <button
            onClick={handleCreateCard}
            disabled={creatingCard}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-violet-300 transition-colors disabled:opacity-60"
          >
            {creatingCard
              ? <><Loader2 size={12} className="animate-spin" /> Creating card…</>
              : <><Layers size={12} /> Create card</>
            }
          </button>
          <span className="text-gray-600 dark:text-gray-500 text-xs">|</span>
          <button
            onClick={() => {
              const text = selection.text
              setSelection(null)
              window.getSelection()?.removeAllRanges()
              if (sidebarMode === 'hidden') setSidebarMode('normal')
              setExplainPrompt(`Explain this: "${text}"`)
            }}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-blue-300 transition-colors"
          >
            <MessageCircle size={12} /> Explain
          </button>
          <span className="text-gray-600 dark:text-gray-500 text-xs">|</span>
          <button
            onClick={async () => {
              const text = selection.text
              setSelection(null)
              window.getSelection()?.removeAllRanges()
              try {
                await bookmarksQueries.add(bookId, currentPage, text.slice(0, 200))
                setBookmarkedPages(prev => new Set([...prev, currentPage]))
              } catch {}
            }}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-amber-300 transition-colors"
          >
            <Bookmark size={12} /> Bookmark
          </button>
          <span className="text-gray-600 dark:text-gray-500 text-xs">|</span>
          <button
            onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges(); setSourceOpen(true) }}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-teal-300 transition-colors"
          >
            <FileCode size={12} /> Page Source
          </button>
          {isAuthenticated && (
            <>
              <span className="text-gray-600 dark:text-gray-500 text-xs">|</span>
              <button
                onClick={() => {
                  const text = selection.text
                  setSelection(null)
                  window.getSelection()?.removeAllRanges()
                  openProblemSet(text)
                }}
                className="flex items-center gap-1.5 text-xs font-medium hover:text-violet-300 transition-colors"
              >
                <ClipboardList size={12} /> Problem Set
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <BookReader
          book={book}
          onBack={() => router.push('/')}
          onToggleSidebar={cycleSidebar}
          sidebarMode={sidebarMode}
          initialPage={urlPage > 1 ? urlPage : undefined}
          onPageChange={(page) => {
            setCurrentPage(page)
            const url = page > 1 ? `/books/${bookId}?page=${page}` : `/books/${bookId}`
            router.replace(url, { scroll: false })
          }}
          isAuthenticated={isAuthenticated || false}
          serendipityPrefs={prefs ? {
            enabled: prefs.serendipity_enabled ?? true,
            sources: prefs.serendipity_sources ?? ['dog', 'cat', 'fox', 'shibe', 'bugs', 'plants', 'fungi', 'rocks', 'smbc', 'dilbert', 'nasa_apod', 'mars', 'xkcd', 'art'],
            customUrls: prefs.serendipity_custom_urls ?? [],
            frequency: prefs.serendipity_frequency ?? 5,
          } : undefined}
          onTocReady={setTocEntries}
          onRegisterNavigate={fn => { navigateRef.current = fn }}
          onRegisterGetPageSource={(fn: (page: number) => string | null) => { getPageSourceRef.current = fn }}
          onInlineImagesReady={setInlineImages}
        />
      </div>

      {problemSetOpen && book && (
        <ProblemMapWidget
          book={book}
          getPageSource={(page: number) => getPageSourceRef.current(page)}
          onClose={() => setProblemSetOpen(false)}
          onNavigate={page => navigateRef.current(page)}
        />
      )}

      {/* Page source modal */}
      {sourceOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={() => setSourceOpen(false)}>
          <div
            className="bg-gray-950 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-sm font-semibold text-gray-200">Raw Markdown — p.{currentPage}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentPageSource ?? '').catch(() => {})
                    setSourceCopied(true)
                    setTimeout(() => setSourceCopied(false), 1500)
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white transition-colors"
                >
                  {sourceCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
                </button>
                <button onClick={() => setSourceOpen(false)} className="p-1 rounded text-gray-400 hover:text-gray-200">
                  <X size={16} />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap select-text">
              {currentPageSource || '(no source available — book may still be loading)'}
            </pre>
          </div>
        </div>
      )}

      <PageSidebar
        book={book}
        currentPage={currentPage}
        isOpen={sidebarMode !== 'hidden'}
        sidebarMode={sidebarMode}
        onClose={() => setSidebarMode('hidden')}
        prefs={prefs}
        tocEntries={tocEntries}
        onTocNavigate={page => navigateRef.current(page)}
        inlineImages={inlineImages}
        newFlashcard={newFlashcard}
        onFlashcardConsumed={() => setNewFlashcard(null)}
        externalChatPrompt={explainPrompt}
        onExternalChatPromptConsumed={() => setExplainPrompt(null)}
        bookmarkedPages={bookmarkedPages}
        onOpenProblemSet={openProblemSet}
        getPageSource={(page: number) => getPageSourceRef.current(page)}
      />
    </div>
  )
}
