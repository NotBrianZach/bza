import { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react'
import { Book } from '@/types'
import { translationQueries } from '@/lib/queries/translations'
import { track } from '@/lib/analytics'
import { useNarration } from './useNarration'
import { toPlainText } from './utils'

type TranslateView = 'translated' | 'original' | 'split'

interface UseReadingOpts {
  book: Book
  isAuthenticated: boolean
  currentPage: number
  totalPages: number
  pagesPerView: 1 | 2 | 3
  scrollMode: boolean
  fullContent: string
  totalLocalPages: number
  contentCacheRef: MutableRefObject<string | null>
  pageBreaksRef: MutableRefObject<number[]>
  getSliceForPage: (pageNum: number) => string
  goToPageRef: MutableRefObject<(page: number) => void>
}

// Owns the audio + translation reading experience: narration primitives (via
// useNarration), the full translation state block, and the composed
// narratePage / narrateTranslation orchestrators that weave the two together.
// Extracted from BookReader to consolidate the tangle of refs + closures that
// couples "which page are we on" with "am I speaking, and in which language."
export function useReading(opts: UseReadingOpts) {
  const {
    book, isAuthenticated, currentPage, totalPages, pagesPerView, scrollMode,
    fullContent, totalLocalPages,
    contentCacheRef, pageBreaksRef, getSliceForPage, goToPageRef,
  } = opts

  const narration = useNarration()
  const {
    setNarrating, setNarratingTranslation,
    narrateAutoAdvance, stopNarration, speakText,
  } = narration

  // --- translation state ---
  const [translationPrompt, setTranslationPrompt] = useState('translate to spanish')
  const [translatedPages, setTranslatedPages]     = useState<Record<number, string>>({})
  const [isTranslating, setIsTranslating]         = useState(false)
  const [showTranslatePanel, setShowTranslatePanel] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(false)
  const [translateView, setTranslateView] = useState<TranslateView>('translated')
  const [savingTranslatedBook, setSavingTranslatedBook] = useState(false)
  const [savedTranslatedBookId, setSavedTranslatedBookId] = useState<number | null>(null)

  // Refs so utterance callbacks (fired long after render) can read current values.
  const translationPromptRef = useRef('')
  const showTranslationRef   = useRef(false)
  const translatedPagesRef   = useRef<Record<number, string>>({})
  useEffect(() => { translationPromptRef.current = translationPrompt }, [translationPrompt])
  useEffect(() => { showTranslationRef.current = showTranslatePanel }, [showTranslatePanel])
  useEffect(() => { translatedPagesRef.current = translatedPages }, [translatedPages])

  // Fetch + cache + persist one page's translation. Returns the translated
  // text (or null on failure). Used by the auto-translate effect, the manual
  // handleTranslate, and the two narrate* pre-fetch paths.
  const fetchAndCachePage = useCallback(async (pageNum: number, prompt: string): Promise<string | null> => {
    if (!contentCacheRef.current || !pageBreaksRef.current.length) return null
    const rawSlice = getSliceForPage(pageNum)
    if (!rawSlice) return null
    try {
      const res = await fetch('/api/translate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: rawSlice, prompt }),
      })
      const translated = await res.text()
      const updated = { ...translatedPagesRef.current, [pageNum]: translated }
      setTranslatedPages(updated)
      translatedPagesRef.current = updated
      translationQueries.upsert(book.id, pageNum, prompt, translated).catch(() => {})
      return translated
    } catch {
      return null
    }
  }, [book.id, contentCacheRef, pageBreaksRef, getSliceForPage])

  // Auto-translate when navigating to a new page.
  useEffect(() => {
    if (!autoTranslate || !showTranslatePanel || !translationPrompt) return
    if (translatedPages[currentPage] || isTranslating) return
    if (!contentCacheRef.current || !pageBreaksRef.current.length) return
    setIsTranslating(true)
    fetchAndCachePage(currentPage, translationPrompt).finally(() => setIsTranslating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, autoTranslate, showTranslatePanel])

  const handleTranslate = useCallback(async (force = false) => {
    if (!translationPrompt || !isAuthenticated || !contentCacheRef.current) return
    if (translatedPages[currentPage] && !force) {
      return handleTranslate(true)
    }
    track('translate_page', { book_id: book?.id, page: currentPage })
    setIsTranslating(true)
    try {
      await fetchAndCachePage(currentPage, translationPrompt)
    } catch (err) {
      console.error('Translation error:', err)
    } finally {
      setIsTranslating(false)
    }
  }, [translationPrompt, isAuthenticated, contentCacheRef, translatedPages, currentPage, book?.id, fetchAndCachePage])

  const saveTranslatedBook = useCallback(async () => {
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
  }, [savingTranslatedBook, translatedPages, translationPrompt, book.title, book.id])

  // narratePage: read the current page aloud, optionally auto-advancing.
  // When auto-advancing under a translation panel, pre-fetches the next page's
  // translation before continuing narration so the pause is minimal.
  const narratePage = useCallback((pageNum: number, autoAdvance = false) => {
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
        if (!narrateAutoAdvance.current || nextPage > totalPages) {
          setNarrating(false)
          return
        }
        const needTranslation =
          showTranslationRef.current &&
          translationPromptRef.current &&
          isAuthenticated &&
          contentCacheRef.current &&
          !translatedPagesRef.current[nextPage]
        if (needTranslation) {
          fetchAndCachePage(nextPage, translationPromptRef.current).finally(() => {
            narratePage(nextPage, true)
            goToPageRef.current(nextPage)
          })
          return
        }
        narratePage(nextPage, true)
        goToPageRef.current(nextPage)
      },
    )
  }, [
    stopNarration, narrateAutoAdvance, speakText, setNarrating,
    scrollMode, pagesPerView, isAuthenticated, contentCacheRef, pageBreaksRef, totalPages,
    fullContent, totalLocalPages, getSliceForPage, goToPageRef, fetchAndCachePage,
  ])

  // narrateTranslation: read the translated version of a page aloud,
  // auto-advancing and fetching the next translation on demand.
  const narrateTranslation = useCallback((pageNum: number) => {
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
        goToPageRef.current(nextPage)
        if (translatedPagesRef.current[nextPage]) {
          narrateTranslation(nextPage)
          return
        }
        if (translationPromptRef.current && isAuthenticated && contentCacheRef.current && pageBreaksRef.current.length > 0) {
          fetchAndCachePage(nextPage, translationPromptRef.current).then(translated => {
            if (translated) {
              narrateTranslation(nextPage)
            } else {
              setNarratingTranslation(false)
              narrateAutoAdvance.current = false
            }
          })
          return
        }
        setNarratingTranslation(false)
        narrateAutoAdvance.current = false
      },
    )
  }, [
    stopNarration, narrateAutoAdvance, speakText, setNarratingTranslation,
    totalPages, isAuthenticated, contentCacheRef, pageBreaksRef, goToPageRef, fetchAndCachePage,
  ])

  return {
    // narration primitives
    ...narration,
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
  }
}
