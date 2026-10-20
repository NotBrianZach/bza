'use client'

import type { RefObject } from 'react'
import {
  AlignJustify, ArrowLeft, Columns2, Image as ImageIcon, ImageOff, Languages,
  Loader2, Maximize2, PanelRight, RefreshCw, Search, Volume2, VolumeX, X as XIcon,
} from 'lucide-react'

interface ReaderToolbarProps {
  title: string
  onBack: () => void

  // position
  currentPage: number
  totalPages: number
  progressPercent: number
  /**
   * Written to directly by the scroll handler so moving the playhead costs no
   * re-render. The toolbar only hands React the initial text.
   */
  pageDisplayRef: RefObject<HTMLSpanElement>

  // search
  searchOpen: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchInputRef: RefObject<HTMLInputElement>
  onOpenSearch: () => void
  onCloseSearch: () => void

  // view mode
  scrollMode: boolean
  pagesPerView: 1 | 2 | 3
  setPagesPerView: (n: 1 | 2 | 3) => void
  /** Owned by the shell: it also restores reading position across the switch. */
  toggleScrollMode: () => void

  // images
  imageMode: number
  cycleImageMode: () => void
  imagesDrawerOpen: boolean
  onOpenImagesDrawer: () => void
  /** Side images + inline images, for the badge. */
  imageCount: number

  // translation (auth only)
  isAuthenticated: boolean
  showTranslatePanel: boolean
  onToggleTranslate: () => void

  // narration
  narrating: boolean
  narrateLoading: boolean
  onToggleNarration: () => void

  // wikipedia
  isWiki: boolean
  wikiChecking: boolean
  onCheckWikiUpdates: () => void

  // sidebar
  sidebarMode: 'hidden' | 'normal' | 'wide'
  onToggleSidebar: () => void
}

const PAGES_PER_VIEW_KEY = 'bza-pages-per-view'

const IMAGE_MODE_TITLES = [
  'All images — click to cycle',
  'Side images only',
  'Inline images only',
  'No images — click to show',
]

/**
 * The reader's single merged header: back, title/position, and every toggle.
 *
 * Presentational apart from one piece of real logic it owns outright — the
 * view-mode cycle. That belongs here because it is entirely about what the
 * button does next, and it is *not* symmetrical between breakpoints: on desktop
 * the button walks scroll → 1-up → 2-up → 3-up → scroll, while on mobile it
 * only toggles scroll ↔ paginated, because multi-page spreads on a phone are
 * unreadable. Breakpoint is read from `innerWidth` at click time rather than
 * from a media query, since it is a one-shot decision inside a handler.
 *
 * `pagesPerView` is persisted here next to where it is chosen; `scrollMode`
 * persistence stays with `toggleScrollMode` in the shell, which has to restore
 * the reading position across the switch and so cannot be a setter call.
 */
export function ReaderToolbar({
  title, onBack,
  currentPage, totalPages, progressPercent, pageDisplayRef,
  searchOpen, searchQuery, setSearchQuery, searchInputRef, onOpenSearch, onCloseSearch,
  scrollMode, pagesPerView, setPagesPerView, toggleScrollMode,
  imageMode, cycleImageMode, imagesDrawerOpen, onOpenImagesDrawer, imageCount,
  isAuthenticated, showTranslatePanel, onToggleTranslate,
  narrating, narrateLoading, onToggleNarration,
  isWiki, wikiChecking, onCheckWikiUpdates,
  sidebarMode, onToggleSidebar,
}: ReaderToolbarProps) {
  const setAndStorePagesPerView = (n: 1 | 2 | 3) => {
    setPagesPerView(n)
    try { localStorage.setItem(PAGES_PER_VIEW_KEY, String(n)) } catch {}
  }

  const cycleViewMode = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isMobile || scrollMode || pagesPerView >= 3) {
      // Mobile: scroll ↔ paginated only. Desktop: entering paginated, or
      // wrapping round from 3-up back to scroll. All three land on 1-up.
      toggleScrollMode()
      setAndStorePagesPerView(1)
    } else {
      setAndStorePagesPerView((pagesPerView + 1) as 2 | 3)
    }
  }

  const positionText = `p.${currentPage}/${totalPages}${progressPercent > 0 ? ` · ${progressPercent.toFixed(0)}%` : ''}`

  return (
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
          onKeyDown={e => { if (e.key === 'Escape') onCloseSearch() }}
          placeholder="Search pages…"
          className="flex-1 min-w-0 input text-sm py-1.5"
        />
      ) : (
        <div className="flex-1 min-w-0 px-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate leading-tight">{title}</p>
          {scrollMode ? (
            <span ref={pageDisplayRef} className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {positionText}
            </span>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {positionText}
            </p>
          )}
        </div>
      )}

      {/* Search */}
      <button
        onClick={() => searchOpen ? onCloseSearch() : onOpenSearch()}
        title="Search book"
        className={`btn btn-secondary p-2 flex-shrink-0 ${searchOpen ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 text-blue-600 dark:text-blue-400' : ''}`}
      >
        {searchOpen ? <XIcon size={18} /> : <Search size={18} />}
      </button>

      {/* View mode: mobile = scroll ↔ paginated; desktop = scroll → 1-up → 2-up → 3-up → scroll */}
      <button
        onClick={cycleViewMode}
        title={scrollMode ? 'Scroll mode — click for paginated' : `${pagesPerView}-up — click to cycle`}
        className={`btn btn-secondary p-2 flex-shrink-0 flex items-center gap-0.5 ${!scrollMode ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 text-indigo-600 dark:text-indigo-400' : ''}`}
      >
        {scrollMode ? <AlignJustify size={18} /> : <Columns2 size={18} />}
        {!scrollMode && pagesPerView > 1 && <span className="text-xs leading-none">{pagesPerView}</span>}
      </button>

      {/* Image mode cycle: 0=both, 1=side only, 2=inline only, 3=none */}
      <button
        onClick={() => { cycleImageMode(); if (imageMode === 3) onOpenImagesDrawer() }}
        title={IMAGE_MODE_TITLES[imageMode]}
        className={`btn btn-secondary p-2 flex-shrink-0 relative flex items-center gap-0.5 ${imageMode === 3 ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 text-orange-600 dark:text-orange-400' : imagesDrawerOpen ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-700 dark:text-green-400' : ''}`}
      >
        {imageMode === 3 ? <ImageOff size={18} /> : <ImageIcon size={18} />}
        {imageMode > 0 && imageMode < 3 && (
          <span className="text-[9px] leading-none font-bold">{imageMode === 1 ? 'S' : 'I'}</span>
        )}
        {imageMode < 3 && imageCount > 0 && (
          <span className="absolute -top-1 -right-1 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold bg-green-600 text-white">
            {imageCount}
          </span>
        )}
      </button>

      {/* Translation toggle (auth only) — switches to paginated 1-up + shows translation pane */}
      {isAuthenticated && (
        <button
          onClick={onToggleTranslate}
          title="Translation"
          className={`btn btn-secondary p-2 flex-shrink-0 ${showTranslatePanel ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 text-violet-600 dark:text-violet-400' : ''}`}
        >
          <Languages size={18} />
        </button>
      )}

      {/* Narration */}
      <button
        onClick={onToggleNarration}
        title={narrating ? 'Stop narration' : narrateLoading ? 'Loading voice…' : 'Start narration (auto-advance)'}
        className={`btn btn-secondary p-2 flex-shrink-0 ${narrating ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 text-purple-600 dark:text-purple-400' : narrateLoading ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 text-amber-600' : ''}`}
      >
        {narrateLoading ? <Loader2 size={18} className="animate-spin" /> : narrating ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Wikipedia: check for updates */}
      {isWiki && (
        <button
          onClick={onCheckWikiUpdates}
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
  )
}
