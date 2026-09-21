import { MutableRefObject, ReactNode, RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Book, Page } from '@/types'
import { StorageImage } from './StorageImage'

interface AuthReaderProps {
  book: Book
  scrollMode: boolean
  isLoading: boolean
  pageContent: Page | null
  loadError: string | null
  currentPage: number
  totalPages: number
  pagesPerView: 1 | 2 | 3
  showInlineImages: boolean
  scrollContainerRef: RefObject<HTMLDivElement>
  contentCacheRef: MutableRefObject<string | null>
  pageBreaksRef: MutableRefObject<number[]>
  handleScrollProgress: () => void
  goToPage: (page: number) => void
  setHighlightedPostId: (id: string) => void
  setLoadError: (v: string | null) => void
  loadPage: (page: number) => void
  getSliceForPage: (pageNum: number) => string
  preprocessContent: (content: string) => string
  parseFootnotes: (content: string) => { text: string; footnotes: Record<number, string> }
  authScrollContent: ReactNode
  renderTranslationPanel?: (mdComponents: any) => ReactNode
}

export function AuthReader({
  book,
  scrollMode,
  isLoading,
  pageContent,
  loadError,
  currentPage,
  totalPages,
  pagesPerView,
  showInlineImages,
  scrollContainerRef,
  contentCacheRef,
  pageBreaksRef,
  handleScrollProgress,
  goToPage,
  setHighlightedPostId,
  setLoadError,
  loadPage,
  getSliceForPage,
  preprocessContent,
  parseFootnotes,
  authScrollContent,
  renderTranslationPanel,
}: AuthReaderProps) {
  if (scrollMode) {
    return (
      <div ref={scrollContainerRef} onScroll={handleScrollProgress} style={{ position: 'absolute', inset: 0, overflowY: 'scroll' }}>
        {!contentCacheRef.current ? (
          <div className="text-center py-16"><div className="spinner mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-300">Loading…</p></div>
        ) : (
          <div className={`max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`} lang="en">
            {authScrollContent}
          </div>
        )}
      </div>
    )
  }

  const sharedMdComponents: any = {
    img: ({ src, alt }: any) => !showInlineImages ? null : <StorageImage src={src} alt={alt ?? ''} />,
    a: ({ href, children }: any) => {
      if (href?.startsWith('fn:')) return <sup className="text-amber-600 dark:text-amber-400">{children}</sup>
      const postMatch = href?.match(/#p(\d+)$/)
      if (postMatch) {
        return (
          <a
            className="text-orange-500 hover:underline cursor-pointer font-mono text-sm"
            onClick={(e: any) => {
              e.preventDefault()
              const content = contentCacheRef.current
              if (!content) return
              const idx = content.indexOf(`No.${postMatch[1]}`)
              if (idx === -1) return
              const breaks = pageBreaksRef.current
              const page = breaks.length > 1
                ? breaks.findIndex((b: number, i: number) => b <= idx && (breaks[i + 1] ?? Infinity) > idx) + 1
                : Math.floor(idx / (book.char_page_length ?? 420)) + 1
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
  }
  const proseClass = `max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
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
              const content = i === 0
                ? pageContent.content
                : (() => {
                    if (!contentCacheRef.current || pageBreaksRef.current.length === 0) return ''
                    const { text } = parseFootnotes(getSliceForPage(pageNum))
                    return preprocessContent(text)
                  })()

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
      {renderTranslationPanel?.(sharedMdComponents)}
    </div>
  )
}
