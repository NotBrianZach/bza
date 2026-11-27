import { booksQueries } from '@/lib/queries'
import { maybeAutoCover } from '@/lib/queries/images'
import { maybeAutoScore } from '@/lib/queries/scores'
import { saveLocalBook, saveBookContent } from '@/lib/localStorage'
import { track } from '@/lib/analytics'
import type { ContentType } from './types'

/**
 * Markdown in, a book in the library out.
 *
 * Extracted from `UrlTab.handleImportMarkdown`, which is where it grew and
 * where it had to stop living the moment a second tab wanted it. It is not a
 * one-liner anybody would re-derive the same way: it carries the
 * anonymous-vs-signed-in split, the synthetic File the upload path expects,
 * and the two fire-and-forget enrichments. A copy would have drifted on the
 * first of those to change.
 *
 * ── THE SYNTHETIC FILE IS NOT CEREMONY ────────────────────────────────────
 *
 * `booksQueries.upload` takes a File because every other way into the library
 * is one. Wrapping a string in a Blob is how a pasted passage, a fetched
 * article and an uploaded .md end up as the same kind of row, read by the
 * same reader, rather than as three shapes that drift. The filename is
 * derived from the title because the storage path uses it and a user-supplied
 * one would need sanitising anyway.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ──────────────────────────────────────
 *
 * No navigation, no error UI, no busy state. Those were in the original and
 * are the reason it could not move: a function that routes and sets component
 * state belongs to one component. It returns the new book's id and throws on
 * failure, so each caller keeps its own idea of what to do next — UrlTab
 * pushes to the reader, a tab with a list might stay put.
 *
 * `maybeAutoCover` and `maybeAutoScore` are fired without awaiting on the
 * signed-in path, exactly as before. Both are enrichments: a book with no
 * cover is a book, and making the import wait on them would make a fast paste
 * feel like a slow upload for no gain the reader can see.
 */
export async function importMarkdownAsBook(opts: {
  markdown: string
  title: string
  contentType: ContentType
  useLocalStorage: boolean
  /** Analytics only — which surface the text came from. */
  source: string
  sourceUrl?: string
  wikiRevid?: string
  // `Book.id` is a number on both paths — a row id when signed in, a
  // `Date.now()` when not. Returned as the type it is rather than stringified,
  // so a caller that wants to do anything but interpolate it still can.
}): Promise<{ id: number }> {
  const title = opts.title.trim()
  if (!title) throw new Error('Please enter a title')

  const blob = new Blob([opts.markdown], { type: 'text/markdown' })
  const syntheticFile = new File(
    [blob], `${title.replace(/[^a-z0-9]/gi, '_')}.md`, { type: 'text/markdown' })

  if (opts.useLocalStorage) {
    /*
     * Through `fileToText` rather than using the string directly, so the
     * anonymous path and the signed-in path agree about what the content of a
     * book is. Skipping it here would be invisible until a reader opened the
     * same text saved two ways and found the pagination different.
     */
    const { fileToText } = await import('@/lib/pdfToMarkdown')
    const fileText = await fileToText(syntheticFile)
    const newBook = saveLocalBook({
      user_id: '',
      title,
      file_path: 'local',
      total_pages: Math.ceil(fileText.length / 2000),
    })
    saveBookContent(newBook.id, fileText)
    track('book_upload', { source: `${opts.source}-local`, content_type: opts.contentType })
    return { id: newBook.id }
  }

  const book = await booksQueries.upload(syntheticFile, {
    title,
    articleType: opts.contentType,
    wikiRevid: opts.wikiRevid,
    sourceUrl: opts.sourceUrl,
  })
  maybeAutoCover(book.id, title)
  booksQueries.getContent(book.file_path).then(c => maybeAutoScore(book.id, c)).catch(() => {})
  track('book_upload', { source: `${opts.source}-remote`, content_type: opts.contentType })
  return { id: book.id }
}
