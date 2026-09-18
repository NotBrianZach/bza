import { useState, MutableRefObject } from 'react'
import { Book } from '@/types'
import { booksQueries } from '@/lib/queries'

export interface WikiDiff {
  hasUpdate: boolean
  latestRevid: number
  diffRows: { type: number; content: string }[]
  diffUrl: string
  title: string
}

interface UseWikiUpdateOpts {
  book: Book
  contentCacheRef: MutableRefObject<string | null>
  pageBreaksRef: MutableRefObject<number[]>
  onTocReady?: (entries: never[]) => void
  setAuthTotalPages: (n: number) => void
  loadPage: (pageNum: number) => Promise<void>
}

// Wikipedia article update flow: check for newer revisions and pull them in.
// Extracted from BookReader — updateWikiToLatest touches parent refs
// (contentCacheRef, pageBreaksRef), a parent prop callback (onTocReady),
// a parent state setter (setAuthTotalPages), and parent-defined loadPage,
// so those are passed in explicitly.
export function useWikiUpdate({ book, contentCacheRef, pageBreaksRef, onTocReady, setAuthTotalPages, loadPage }: UseWikiUpdateOpts) {
  const isWiki = book.content_type === 'wikipedia_article'
  const [wikiChecking, setWikiChecking] = useState(false)
  const [wikiUpdating, setWikiUpdating] = useState(false)
  const [wikiDiff, setWikiDiff] = useState<WikiDiff | null>(null)
  const [wikiDiffOpen, setWikiDiffOpen] = useState(false)

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

  return {
    isWiki,
    wikiChecking,
    wikiUpdating,
    wikiDiff,
    wikiDiffOpen,
    setWikiDiffOpen,
    checkWikiUpdates,
    updateWikiToLatest,
  }
}
