import { MutableRefObject, ReactNode, RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Book } from '@/types'
import { StorageImage } from './StorageImage'

interface UnauthReaderProps {
  book: Book
  fullContent: string
  scrollMode: boolean
  currentPage: number
  totalPages: number
  totalLocalPages: number
  pagesPerView: 1 | 2 | 3
  containerWidth: number
  showInlineImages: boolean
  scrollContainerRef: RefObject<HTMLDivElement>
  columnsRef: RefObject<HTMLDivElement>
  contentCacheRef: MutableRefObject<string | null>
  pageBreaksRef: MutableRefObject<number[]>
  handleScrollProgress: () => void
  goToPage: (page: number) => void
  setHighlightedPostId: (id: string) => void
  getSliceForPage: (pageNum: number) => string
  preprocessContent: (content: string) => string
  localScrollContent: ReactNode
}

export function UnauthReader({
  book,
  fullContent,
  scrollMode,
  currentPage,
  totalPages,
  totalLocalPages,
  pagesPerView,
  containerWidth,
  showInlineImages,
  scrollContainerRef,
  columnsRef,
  contentCacheRef,
  pageBreaksRef,
  handleScrollProgress,
  goToPage,
  setHighlightedPostId,
  getSliceForPage,
  preprocessContent,
  localScrollContent,
}: UnauthReaderProps) {
  const proseClass = `max-w-prose mx-auto px-6 pt-8 pb-12 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`
  const cssColumnsProseClass = `max-w-prose mx-auto px-6 pt-8 pb-8 prose prose-lg font-serif text-gray-900 dark:text-gray-100 text-justify hyphens-auto dark:prose-invert bza-reader-text${!showInlineImages ? ' bza-hide-images' : ''}`

  if (!fullContent) {
    return (
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
  }

  if (scrollMode) {
    return (
      <div ref={scrollContainerRef} onScroll={handleScrollProgress} style={{ position: 'absolute', inset: 0, overflowY: 'scroll' }}>
        <div className={proseClass} lang="en">
          {localScrollContent}
        </div>
      </div>
    )
  }

  if (pageBreaksRef.current.length > 0 && contentCacheRef.current) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        {Array.from({ length: pagesPerView }, (_, i) => {
          const pageNum = Math.min(currentPage + i, totalPages || 1)
          if (currentPage + i > (totalPages || 1)) return null
          return (
            <div
              key={pageNum}
              style={{ flex: 1, overflowY: 'scroll', borderLeft: i > 0 ? '1px solid var(--border-color, #e5e7eb)' : undefined }}
            >
              <div className={proseClass} lang="en">
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
    )
  }

  return (
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
        <div className={cssColumnsProseClass} lang="en">
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
            {fullContent.replace(/\bNo\.(\d+)\b/g, '<span id="post-$1">No.$1</span>')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
