'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PageNavProps {
  currentPage: number
  totalPages: number
  /** Step size. Prev/next move by a whole spread, not a single page, in 2-up and 3-up. */
  pagesPerView: 1 | 2 | 3
  onGoToPage: (page: number) => void
}

/**
 * Two page steppers, one per breakpoint, both rendered and each hidden by a
 * Tailwind class rather than by measuring the viewport.
 *
 * They are not one component with a variant prop because they are in different
 * places in the layout and that is the whole reason both exist: the desktop bar
 * is a footer, and on mobile a footer can be covered by browser chrome or a
 * tab-close popup, so the mobile copy sits under the header where nothing can
 * occlude it. Same controls, different position, different chrome.
 */

/** Shared: a direct page-number entry that ignores out-of-range input. */
function PageInput({
  currentPage, totalPages, onGoToPage, className, ariaLabel,
}: Pick<PageNavProps, 'currentPage' | 'totalPages' | 'onGoToPage'> & { className: string; ariaLabel?: string }) {
  return (
    <input
      type="number"
      value={currentPage}
      onChange={(e) => {
        const page = parseInt(e.target.value)
        if (page >= 1 && page <= totalPages) onGoToPage(page)
      }}
      className={className}
      min={1}
      max={totalPages}
      aria-label={ariaLabel}
    />
  )
}

const NUMBER_INPUT_CHROME = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

/** Mobile-only page nav — the bottom bar can be hidden by browser chrome. */
export function MobilePageNav({ currentPage, totalPages, pagesPerView, onGoToPage }: PageNavProps) {
  return (
    <div className="md:hidden flex items-center justify-center gap-2 px-2 py-1.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => onGoToPage(currentPage - pagesPerView)}
        disabled={currentPage <= 1}
        className="btn btn-secondary flex items-center justify-center py-1.5 px-3 text-sm disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      <PageInput
        currentPage={currentPage}
        totalPages={totalPages}
        onGoToPage={onGoToPage}
        className={`input w-20 text-center py-1.5 text-sm ${NUMBER_INPUT_CHROME}`}
        ariaLabel="Current page"
      />
      <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">/ {totalPages}</span>
      <button
        onClick={() => onGoToPage(currentPage + pagesPerView)}
        disabled={currentPage + pagesPerView - 1 >= totalPages}
        className="btn btn-secondary flex items-center justify-center py-1.5 px-3 text-sm disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

/** Desktop footer nav. Shows the spread range (`4–6 / 300`) when multi-up. */
export function DesktopPageNav({ currentPage, totalPages, pagesPerView, onGoToPage }: PageNavProps) {
  return (
    <div
      className="hidden md:block bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between max-w-prose mx-auto px-2 py-2 gap-2">
        <button
          onClick={() => onGoToPage(currentPage - pagesPerView)}
          disabled={currentPage <= 1}
          className="btn btn-secondary flex items-center gap-1 flex-1 justify-center py-3 text-base disabled:opacity-40"
        >
          <ChevronLeft size={22} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <PageInput
            currentPage={currentPage}
            totalPages={totalPages}
            onGoToPage={onGoToPage}
            className={`input w-20 text-center py-2 text-sm ${NUMBER_INPUT_CHROME}`}
          />
          {pagesPerView > 1 && currentPage + pagesPerView - 1 <= totalPages && (
            <span className="text-gray-400 dark:text-gray-500 text-sm">–{currentPage + pagesPerView - 1}</span>
          )}
          <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-nowrap">/ {totalPages}</span>
        </div>

        <button
          onClick={() => onGoToPage(currentPage + pagesPerView)}
          disabled={currentPage + pagesPerView - 1 >= totalPages}
          className="btn btn-secondary flex items-center gap-1 flex-1 justify-center py-3 text-base disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  )
}
