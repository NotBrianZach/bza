'use client'

import { Image as ImageIcon, X as XIcon } from 'lucide-react'
import type { InlineImage } from './textPipeline'

interface ImagesDrawerProps {
  /** Generated illustrations from the DB. Shape varies by vintage — see `pageOf`. */
  bookImages: any[]
  /** Images found in the book's own markdown. */
  inlineImages: InlineImage[]
  /** False when the image mode has side images switched off. */
  showSideImages: boolean
  onGoToPage: (page: number) => void
  onClose: () => void
}

/**
 * `page_num` is the current column; `page_number` is what older rows used.
 * Both are read because the drawer is the one place every vintage of generated
 * image surfaces, and a missing page just means no jump-to-page link.
 */
const pageOf = (img: any): number | undefined => img.page_num ?? img.page_number

export function ImagesDrawer({ bookImages, inlineImages, showSideImages, onGoToPage, onClose }: ImagesDrawerProps) {
  // Page 0 is the cover slot, which belongs to the library card rather than here.
  const illustrations = bookImages.filter(img => (pageOf(img) ?? 1) > 0)

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 max-w-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto z-20 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <ImageIcon size={15} />
          Images
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XIcon size={18} />
        </button>
      </div>
      {!showSideImages ? (
        <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">Images are hidden. Toggle the image button in the toolbar to show them.</p>
      ) : illustrations.length === 0 && inlineImages.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No images for this book.</p>
      ) : (
        <div className="px-4 py-3 space-y-5">
          {[...illustrations].sort((a, b) => (pageOf(a) ?? 0) - (pageOf(b) ?? 0)).map((img, i) => {
            const pageNum = pageOf(img)
            return (
              <figure key={img.id}>
                <img src={img.image_url} alt={img.prompt} className="w-full rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" />
                <figcaption className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-snug flex items-start gap-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Fig. {i + 1}.</span>
                  <span className="flex-1">{img.prompt}</span>
                  {pageNum && (
                    <button
                      onClick={() => { onGoToPage(pageNum); onClose() }}
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
                    onClick={() => { onGoToPage(img.page); onClose() }}
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
  )
}
