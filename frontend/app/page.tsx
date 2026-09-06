'use client'

import { useEffect, useRef, useState } from 'react'
import { timeAgo } from '@/lib/timeAgo'
import { useRouter } from 'next/navigation'
import { Book } from '@/types'
import { supabase } from '@/lib/supabase'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { booksQueries } from '@/lib/queries'
import { getLocalBooks, deleteLocalBook, getStorageUsage } from '@/lib/localStorage'
import BookCard from '@/components/BookCard'
import Link from 'next/link'
import { Plus, BookOpen, Image as ImageIcon, HardDrive, CreditCard, Search, PuzzleIcon, GraduationCap, Clock, SlidersHorizontal, Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Calculator, Download, Settings, Menu, LayoutGrid, List, Loader2 } from 'lucide-react'
import { billingQueries, quizQueries, settingsQueries, UserPrefs } from '@/lib/queries'
import { bookmarksQueries } from '@/lib/queries/bookmarks'
import type { PageBookmark } from '@/lib/queries/types'
import { ThemeToggle } from '@/components/ThemeProvider'
import ClassicLibrary from '@/components/ClassicLibrary'
import MetaDrawer from '@/components/MetaDrawer'
import ReadingStreaks from '@/components/ReadingStreaks'
import HomeFeedSection from '@/components/HomeFeedSection'
import { getPinnedFeeds, savePinnedFeeds, PinnedFeed } from '@/lib/pinnedFeeds'
import { AUTO_COVER_KEY } from '@/lib/queries/images'

type SectionId = 'streaks' | 'revisit' | 'books' | 'feeds' | 'classics'
interface SectionConfig { id: SectionId; label: string; visible: boolean }
const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'revisit', label: 'Due for Revisit (SR)', visible: true },
  { id: 'feeds', label: 'My Feeds', visible: true },
  { id: 'streaks', label: 'Reading Streaks', visible: true },
  { id: 'books', label: 'My Library', visible: true },
  { id: 'classics', label: 'Classic Library', visible: true },
]

// ── Spaced-repetition schedule (localStorage) ──────────────────────────────
const SR_KEY = 'bza-sr-schedule'
interface SREntry { interval: number; nextAt: number }
function getSRSchedule(): Record<number, SREntry> {
  try { return JSON.parse(localStorage.getItem(SR_KEY) ?? '{}') } catch { return {} }
}
function advanceSR(bookId: number): void {
  const s = getSRSchedule()
  const prev = s[bookId]?.interval ?? 1
  const interval = Math.min(90, Math.round(prev * 2))
  s[bookId] = { interval, nextAt: Date.now() + interval * 86_400_000 }
  localStorage.setItem(SR_KEY, JSON.stringify(s))
}
function isSRDue(bookId: number, lastReadAt: string | null, createdAt: string): boolean {
  const entry = getSRSchedule()[bookId]
  if (entry) return Date.now() >= entry.nextAt
  const lastMs = lastReadAt ? new Date(lastReadAt).getTime() : new Date(createdAt).getTime()
  return Date.now() >= lastMs + 86_400_000
}
function srInterval(bookId: number): number {
  return getSRSchedule()[bookId]?.interval ?? 1
}
// ── Card size preferences (localStorage) ─────────────────────────────────
const CARD_SIZES_KEY = 'bza-card-sizes'
export type CardSize = 'small' | 'medium' | 'large'
export interface CardSizes { books: CardSize; feeds: CardSize; flashcards: CardSize }
const DEFAULT_CARD_SIZES: CardSizes = { books: 'medium', feeds: 'medium', flashcards: 'medium' }
export function getCardSizes(): CardSizes {
  try { return { ...DEFAULT_CARD_SIZES, ...JSON.parse(localStorage.getItem(CARD_SIZES_KEY) ?? '{}') } } catch { return DEFAULT_CARD_SIZES }
}
export function saveCardSizes(sizes: CardSizes) { localStorage.setItem(CARD_SIZES_KEY, JSON.stringify(sizes)) }
// Grid classes per card size
const BOOK_GRID: Record<CardSize, string> = {
  small:  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3',
  medium: 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4',
  large:  'grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5',
}
const FEED_GRID: Record<CardSize, string> = {
  small:  'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3',
  medium: 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4',
  large:  'grid-cols-1 xl:grid-cols-1 2xl:grid-cols-2 gap-5',
}

const LAYOUT_KEY = 'bza-home-layout'
function getHomeLayout(): SectionConfig[] {
  try {
    const stored = localStorage.getItem(LAYOUT_KEY)
    if (!stored) return DEFAULT_SECTIONS
    const parsed = JSON.parse(stored) as SectionConfig[]
    return DEFAULT_SECTIONS.map(def => parsed.find(p => p.id === def.id) ?? def)
      .sort((a, b) => { const ia = parsed.findIndex(p => p.id === a.id); const ib = parsed.findIndex(p => p.id === b.id); return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) })
  } catch { return DEFAULT_SECTIONS }
}
export default function DashboardPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<Book['content_type'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0, percentage: 0 })
const [quota, setQuota] = useState<import('@/lib/queries').UserQuota | null>(null)
  const [extensionInstalled, setExtensionInstalled] = useState(true) // optimistic until checked
  const [dueCardCount, setDueCardCount] = useState(0)
  const [prefs, setPrefs] = useState<UserPrefs | null>(null)
  const [cardSizes, setCardSizes] = useState<CardSizes>(DEFAULT_CARD_SIZES)
  const [metaDrawerOpen, setMetaDrawerOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ bookId: number; bookTitle: string; page: number; snippet: string }>>([])
  const [searching, setSearching] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // wikiUpdates removed — Updates section deleted from Librarian
  const [pinnedFeeds, setPinnedFeeds] = useState<PinnedFeed[]>([])
  const [feedsSignal, setFeedsSignal] = useState<{ open: boolean; v: number }>({ open: false, v: 0 })
  const [globalCatalog, setGlobalCatalog] = useState(() => {
    try { return localStorage.getItem('bza-feed-catalog') === '1' } catch { return false }
  })
  const [globalImages, setGlobalImages] = useState(() => {
    try { return localStorage.getItem('bza-feed-images') === '1' } catch { return false }
  })
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS)
  const [customizing, setCustomizing] = useState(false)
  const [srVersion, setSrVersion] = useState(0) // bump to re-evaluate due books after SR advance
  const [autoCover, setAutoCover] = useState(true)
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({})
  const [typstNotes, setTypstNotes] = useState<(PageBookmark & { book_title?: string })[]>([])
  const [showTypstNotes, setShowTypstNotes] = useState(false)
  const [trashedBooks, setTrashedBooks] = useState<Book[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const loadingRef = useRef(false)

  useEffect(() => {
    checkAuthAndLoadData()

    // Subscribe to auth state changes to catch sign-in events (e.g. from another tab).
    // SIGNED_OUT is intentionally NOT handled here — the sign-out button calls
    // window.location.reload() directly, and handling SIGNED_OUT via the listener
    // causes spurious logouts from token-refresh races during the initial page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user?.email) {
          // Only re-load if we currently think the user is logged out
          setIsAuthenticated(prev => {
            if (prev === false || prev === null) {
              checkAuthAndLoadData()
            }
            return prev
          })
        }
      }
    })

    // Show localStorage feeds immediately (fast path); DB feeds will override once auth resolves
    setPinnedFeeds(getPinnedFeeds())

    setSections(getHomeLayout())
    setCardSizes(getCardSizes())
    setAutoCover(localStorage.getItem(AUTO_COVER_KEY) !== 'false')
    try {
      const stored = localStorage.getItem('bza-custom-prompts')
      if (stored) setCustomPrompts(JSON.parse(stored))
    } catch {}

    return () => subscription.unsubscribe()
  }, [])

  // Persist the current feed list to the user's profile (fire-and-forget)
  const syncFeedsToDB = (feeds: PinnedFeed[]) => {
    if (!isAuthenticated || prefs?.feeds_per_device) return
    settingsQueries.setPref('pinned_feeds', feeds.map(({ id, label, url }) => ({ id, label, url }))).catch(() => {})
  }

  const refreshFeeds = () => {
    const feeds = getPinnedFeeds()
    setPinnedFeeds(feeds)
    syncFeedsToDB(feeds)
  }

  // After auth + prefs load: pull feeds from DB (preferred) or bootstrap DB from localStorage
  useEffect(() => {
    if (isAuthenticated === null) return // still loading
    if (!isAuthenticated || prefs?.feeds_per_device) return // use localStorage only
    const dbFeeds = prefs?.pinned_feeds
    const local = getPinnedFeeds()
    if (dbFeeds?.length) {
      // DB is the source of truth; also pick up any feeds added locally since last sync
      const dbIds = new Set(dbFeeds.map(f => f.id))
      const localOnly = local.filter(f => !dbIds.has(f.id))
      const merged: PinnedFeed[] = [
        ...dbFeeds.map(f => ({ ...f, expanded: local.find(lf => lf.id === f.id)?.expanded })),
        ...localOnly,
      ]
      savePinnedFeeds(merged)
      setPinnedFeeds(merged)
      if (localOnly.length) {
        settingsQueries.setPref('pinned_feeds', merged.map(({ id, label, url }) => ({ id, label, url }))).catch(() => {})
      }
    } else {
      // First login or feeds not yet in DB — push current localStorage feeds up
      settingsQueries.setPref('pinned_feeds', local.map(({ id, label, url }) => ({ id, label, url }))).catch(() => {})
    }
  }, [isAuthenticated, prefs])

  const updateSections = (next: SectionConfig[]) => {
    setSections(next)
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(next))
  }

  const moveSectionDir = (id: SectionId, dir: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === id)
    if (idx < 0) return
    const next = [...sections]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    updateSections(next)
  }

  useEffect(() => {
    // Give the content script a moment to set the marker, then check
    const timer = setTimeout(() => {
      setExtensionInstalled(
        document.documentElement.dataset.aireadalongExt === '1'
      )
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const checkAuthAndLoadData = async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      setIsLoading(true)
      setError(null)

      // getSession() reads from cookie storage and refreshes the token if expired.
      // Do NOT add a short timeout here — token refresh is a network call that can
      // take a few seconds on slow connections, and timing out would return null,
      // causing the user to appear logged-out even though their session is valid.
      const { data: { session } } = await supabase.auth.getSession()

      // Detect stale anonymous sessions (created by old AuthProvider.signInAnonymously()).
      // Anonymous users have no email. Sign them out so the cookie is cleared and
      // they see the normal unauthenticated state rather than a broken "logged in but no books" state.
      if (session?.user && !session.user.email) {
        await supabase.auth.signOut().catch(() => {})
        setIsAuthenticated(false)
        setBooks(getLocalBooks())
        getStorageUsage().then(setStorageUsage)
        return
      }

      if (session?.user?.email) {
        setIsAuthenticated(true)
        setUserEmail(session.user.email)

        // Show cached books instantly — don't wait for network
        const cached = booksQueries.listCached()
        if (cached && cached.length > 0) { setBooks(cached); setIsLoading(false) }

        // Fetch fresh data progressively — each updates state as it arrives
        booksQueries.list().then(b => { setBooks(b); setIsLoading(false) }).catch(() => setIsLoading(false))
        booksQueries.listTrashed().then(setTrashedBooks).catch(() => {})

        try {
          const [quotaData, dueCount, prefsData, notesData] = await Promise.all([
            billingQueries.getQuota().catch(() => null),
            quizQueries.countDueCards().catch(() => 0),
            settingsQueries.getPrefs().catch(() => null),
            bookmarksQueries.listWithTypst().catch(() => []),
          ])
          if (quotaData) setQuota(quotaData)
          setDueCardCount(dueCount)
          if (prefsData) {
            setPrefs(prefsData)
            if (prefsData.feed_catalog_view !== undefined) setGlobalCatalog(prefsData.feed_catalog_view)
            if (prefsData.feed_show_images !== undefined) setGlobalImages(prefsData.feed_show_images)
          }
          setTypstNotes(notesData)
        } catch (err: any) {
          console.error('Error loading user data:', err)
          // Don't clear books — cached books are still valid
        }
      } else {
        setIsAuthenticated(false)
        setBooks(getLocalBooks())
        getStorageUsage().then(setStorageUsage)
      }
    } catch (err: any) {
      console.error('Error checking auth:', err)
      setBooks(getLocalBooks())
      setIsAuthenticated(false)
      getStorageUsage().then(setStorageUsage)
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }

  const handleDelete = async (bookId: number) => {
    try {
      if (isAuthenticated) {
        await booksQueries.trash(bookId)
        const book = books.find(b => b.id === bookId)
        if (book) setTrashedBooks(tb => [{ ...book, deleted_at: new Date().toISOString() }, ...tb])
      } else {
        deleteLocalBook(bookId)
      }
      setBooks(books.filter(b => b.id !== bookId))
      booksQueries.invalidateCache()
      if (!isAuthenticated) {
        getStorageUsage().then(setStorageUsage)
      }
    } catch (err: any) {
      console.error('Error deleting book:', err)
      alert('Failed to move book to trash')
    }
  }

  const handleRestore = async (bookId: number) => {
    try {
      await booksQueries.restore(bookId)
      booksQueries.invalidateCache()
      const book = trashedBooks.find(b => b.id === bookId)
      if (book) setBooks(bs => [{ ...book, deleted_at: null }, ...bs])
      setTrashedBooks(tb => tb.filter(b => b.id !== bookId))
    } catch (err: any) {
      console.error('Error restoring book:', err)
      alert('Failed to restore book')
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm(`Permanently delete ${trashedBooks.length} book${trashedBooks.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
    try {
      await booksQueries.emptyTrash()
      setTrashedBooks([])
    } catch (err: any) {
      console.error('Error emptying trash:', err)
      alert('Failed to empty trash')
    }
  }

  // Hold the skeleton for the entire auth check — never render the main page
  // with isAuthenticated === null, since `!isAuthenticated` guards below would
  // flash logged-out UI (Free Tier notice, Sign In/Up buttons) to real users.
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Library</h1>
              <div className="w-40 h-9 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading your library…</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Library</h1>

            {/* Global search */}
            {isAuthenticated && (
              <div className="relative flex-1 max-w-xs hidden sm:block">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={e => {
                    const q = e.target.value
                    setGlobalSearch(q)
                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                    if (q.trim().length < 2) { setSearchResults([]); return }
                    searchTimerRef.current = setTimeout(async () => {
                      setSearching(true)
                      try {
                        const res = await authedFetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
                        const data = await res.json()
                        setSearchResults(data.results ?? [])
                      } catch { setSearchResults([]) }
                      finally { setSearching(false) }
                    }, 500)
                  }}
                  placeholder="Search all books…"
                  className="input w-full pl-8 text-sm py-1.5"
                />
                {(searchResults.length > 0 || searching) && globalSearch.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-72 overflow-y-auto">
                    {searching && <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2"><div className="spinner" style={{ width: 12, height: 12 }} /> Searching…</div>}
                    {searchResults.map((r, i) => (
                      <a key={i} href={`/books/${r.bookId}?page=${r.page}`} className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{r.bookTitle}</p>
                        <p className="text-[10px] text-gray-400">p.{r.page}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">{r.snippet}</p>
                      </a>
                    ))}
                    {!searching && searchResults.length === 0 && <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop-only buttons */}
              <div className="hidden sm:flex items-center gap-3">
                {!extensionInstalled && (
                  <a
                    href="/extension"
                    className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-full px-3 py-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    title="Get the browser extension to save pages and YouTube videos"
                  >
                    <PuzzleIcon size={13} />
                    Get Capture Extension
                  </a>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => setMetaDrawerOpen(o => !o)}
                    title="Librarian"
                    className={`btn btn-secondary text-sm flex items-center gap-1.5 relative ${metaDrawerOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 text-indigo-700 dark:text-indigo-300' : ''}`}
                  >
                    <BookOpen size={16} />
                    Librarian
                  </button>
                )}
                {isAuthenticated === false && (
                  <button
                    onClick={() => { setCustomizing(c => !c); setTimeout(() => document.getElementById('customize-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
                    title="Customize layout"
                    className={`btn btn-secondary p-2 flex items-center gap-1.5 ${customizing ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 text-indigo-700 dark:text-indigo-300' : ''}`}
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                )}
                <ThemeToggle />
                {isAuthenticated === true ? (
                  <div className="flex items-center gap-2">
                    <Link href="/settings" title="Settings" className="btn btn-secondary p-2">
                      <Settings size={16} />
                    </Link>
                    <button onClick={() => router.push('/billing')} className="btn btn-secondary text-sm" title={userEmail ?? undefined}>
                      <CreditCard size={16} className="mr-2" />
                      {userEmail ? userEmail.split('@')[0] : 'Account'}
                    </button>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.reload() }} className="btn btn-secondary text-sm">
                      Sign Out
                    </button>
                  </div>
                ) : isAuthenticated === false ? (
                  <div className="flex items-center gap-2">
                    <Link href="/settings" title="Settings" className="btn btn-secondary p-2">
                      <Settings size={16} />
                    </Link>
                    <a href="/auth/login" className="btn btn-secondary text-sm">Sign In</a>
                    <a href="/auth/signup" className="btn btn-primary text-sm">Sign Up Free</a>
                  </div>
                ) : (
                  <div className="w-36 h-9 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                )}
              </div>

              {/* Add button — always visible */}
              <Link href="/upload" className="btn btn-primary text-sm sm:text-base whitespace-nowrap">
                <Plus size={18} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
                <span className="sm:hidden">Add</span>
              </Link>

              {/* Mobile hamburger menu */}
              <div className="relative sm:hidden">
                <button
                  onClick={() => setMobileMenuOpen(v => !v)}
                  className="btn btn-secondary p-2"
                >
                  <Menu size={18} />
                </button>
                {mobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 min-w-[200px]">
                      {isAuthenticated && (
                        <button
                          onClick={() => { setMetaDrawerOpen(o => !o); setMobileMenuOpen(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <BookOpen size={15} /> Librarian
                        </button>
                      )}
                      <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Settings size={15} /> Settings
                      </Link>
                      {isAuthenticated === true ? (
                        <>
                          <button onClick={() => { router.push('/billing'); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                            <CreditCard size={15} /> {userEmail ? userEmail.split('@')[0] : 'Account'}
                          </button>
                          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload() }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                            Sign Out
                          </button>
                        </>
                      ) : isAuthenticated === false ? (
                        <>
                          <a href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Sign In</a>
                          <a href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Sign Up Free</a>
                        </>
                      ) : null}
                      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                        <div className="px-4 py-2"><ThemeToggle /></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Compact stat strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-gray-400" />
              <strong className="text-gray-700 dark:text-gray-200">{books.length}</strong>
              {books.length === 1 ? 'text' : 'texts'}
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive size={14} className="text-gray-400" />
              {isAuthenticated
                ? (quota && quota.storage_limit_bytes > 0
                    ? <><strong className="text-gray-700 dark:text-gray-200">{(quota.storage_bytes_used / (1024**3)).toFixed(2)} GB</strong> / {(quota.storage_limit_bytes / (1024**3)).toFixed(1)} GB</>
                    : <strong className="text-gray-700 dark:text-gray-200">Unlimited</strong>)
                : <><strong className="text-gray-700 dark:text-gray-200">{(storageUsage.used / 1024 / 1024).toFixed(1)} MB</strong> used locally</>
              }
            </span>
            <span className="flex items-center gap-1.5">
              <ImageIcon size={14} className="text-gray-400" />
              <strong className="text-gray-700 dark:text-gray-200">{isAuthenticated ? 'AI enabled' : '$2/mo free'}</strong>
            </span>
            {isAuthenticated ? (
              <Link
                href="/billing"
                className={`flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${
                  quota?.tier === 'pro'
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {quota?.tier === 'pro' ? 'Pro' : 'Free'}
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:opacity-80 transition-opacity"
              >
                Free
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero section for non-authenticated users */}
      {isAuthenticated === false && books.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
          <div className="container mx-auto px-4 py-16 text-center max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Read smarter with AI</h1>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Upload any book, article, or PDF. Get AI-powered explanations, problem sets, character analysis, flashcards, and audiobook narration — all in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <a
                href="/auth/signup"
                onClick={() => track('upgrade_clicked', { source: 'hero-signup' })}
                className="px-6 py-3 bg-white text-indigo-700 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started Free
              </a>
              <a href="/auth/login" className="px-6 py-3 bg-white/10 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-colors border border-white/20">
                Sign In
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
              {[
                { icon: '📖', label: 'AI Chat for any book' },
                { icon: '📝', label: 'Problem sets + hints' },
                { icon: '🎭', label: 'Persona librarians' },
                { icon: '🔊', label: 'AI audiobook narration' },
                { icon: '🌐', label: 'Translate entire books' },
                { icon: '🧠', label: 'Flashcards + spaced repetition' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2 text-sm">
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-white/90">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Free Tier Notice */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <HardDrive className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  You're using the <strong>Free Tier</strong> - texts stored in your browser
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Storage: {(storageUsage.used / 1024 / 1024).toFixed(2)} MB used locally
                </p>
                {storageUsage.percentage > 80 && (
                  <p className="text-sm text-orange-700 mt-2 font-medium">
                    ⚠️ Storage almost full! <a href="/auth/signup" className="underline">Upgrade to Pro</a> for unlimited cloud storage.
                  </p>
                )}
              </div>
              <a
                href="/auth/signup"
                onClick={() => track('upgrade_clicked', { source: 'free-tier-banner' })}
                className="btn btn-sm btn-primary whitespace-nowrap"
              >
                Upgrade to Cloud
              </a>
            </div>
          </div>
        )}



        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Study / SRS badge */}
        {isAuthenticated && dueCardCount > 0 && (
          <Link
            href="/quiz"
            className="mb-6 flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <GraduationCap size={20} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                {dueCardCount} flashcard{dueCardCount !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">Start today's study session →</p>
            </div>
          </Link>
        )}


        {/* Search + type filter — always visible */}
        {(isAuthenticated || books.length > 0) && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search books…"
                className="input pl-9 w-full"
              />
            </div>
            {/* Type filter chips — shown when 2+ distinct types exist */}
            {(() => {
              const presentTypes = [...new Set(books.map(b => b.content_type).filter(Boolean))] as Book['content_type'][]
              const TYPE_LABELS: Record<string, string> = {
                fiction: 'Fiction', biography: 'Biography', textbook: 'Textbook', math_textbook: 'Math',
                academic_paper: 'Academic', wikipedia_article: 'Wikipedia', news_article: 'News',
                forum_thread: 'Forum', essay: 'Essay', reference: 'Reference',
              }
              const TYPE_CHIP: Record<string, string> = {
                fiction:           'border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300',
                biography:         'border-green-200 text-green-700 dark:border-green-700 dark:text-green-300',
                textbook:          'border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300',
                math_textbook:     'border-teal-200 text-teal-700 dark:border-teal-700 dark:text-teal-300',
                academic_paper:    'border-indigo-200 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300',
                wikipedia_article: 'border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300',
                news_article:      'border-sky-200 text-sky-700 dark:border-sky-700 dark:text-sky-300',
                forum_thread:      'border-yellow-200 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300',
                essay:             'border-rose-200 text-rose-700 dark:border-rose-700 dark:text-rose-300',
                reference:         'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300',
              }
              if (presentTypes.length < 2) return null
              return (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {presentTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(tf => tf === t ? null : t)}
                      className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                        typeFilter === t
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-transparent'
                          : `bg-white dark:bg-gray-800 ${TYPE_CHIP[t!]} hover:opacity-80`
                      }`}
                    >
                      {TYPE_LABELS[t!]}
                    </button>
                  ))}
                  {typeFilter && (
                    <button onClick={() => setTypeFilter(null)} className="text-xs px-2 py-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      ✕ clear
                    </button>
                  )}
                </div>
              )
            })()}
            {/* Inline search results — shown when search is active */}
            {search.trim() && (() => {
              const q = search.toLowerCase().trim()
              const fuzzy = (text: string, query: string) => {
                const t = text.toLowerCase()
                if (t.includes(query)) return true
                if (query.split(/\s+/).every(w => t.includes(w))) return true
                let qi = 0
                for (let i = 0; i < t.length && qi < query.length; i++) {
                  if (t[i] === query[qi]) qi++
                }
                return qi === query.length
              }
              const filtered = books.filter(b =>
                (fuzzy(b.title, q) || fuzzy(b.summary ?? '', q)) &&
                (!typeFilter || b.content_type === typeFilter)
              )
              return (
                <div className="mt-3">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 py-4">No results for "{search}"</p>
                  ) : (
                    <div className={`grid ${BOOK_GRID[cardSizes.books]} `}>
                      {filtered.map(book => (
                        <BookCard
                          key={book.id}
                          book={book}
                          size={cardSizes.books}
                          onDelete={handleDelete}
                          onPinToggled={(id, p) => setBooks(bs => bs.map(b => b.id === id ? { ...b, pinned: p } : b).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))}
                          onRenamed={(id, t) => setBooks(bs => bs.map(b => b.id === id ? { ...b, title: t } : b))}
                          onReclassified={isAuthenticated ? (id, type) => setBooks(bs => bs.map(b => b.id === id ? { ...b, content_type: type } : b)) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Layout customizer */}
        <div id="customize-panel" className="flex justify-end mb-2">
          <button
            onClick={() => setCustomizing(c => !c)}
            className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${customizing ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <SlidersHorizontal size={13} /> Customize
          </button>
        </div>

        {customizing && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Home layout</p>
            <div className="space-y-1">
              {sections.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveSectionDir(s.id, -1)} disabled={i === 0} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 touch-manipulation">
                      <ChevronUp size={20} />
                    </button>
                    <button onClick={() => moveSectionDir(s.id, 1)} disabled={i === sections.length - 1} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-20 touch-manipulation">
                      <ChevronDown size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => updateSections(sections.map(x => x.id === s.id ? { ...x, visible: !x.visible } : x))}
                    className={`flex items-center gap-2 text-sm py-1 ${s.visible ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}
                  >
                    {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    {s.label}
                  </button>
                </div>
              ))}
            </div>
            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    const next = !autoCover
                    setAutoCover(next)
                    localStorage.setItem(AUTO_COVER_KEY, String(next))
                  }}
                  className={`flex items-center gap-2 text-sm py-1 ${autoCover ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}
                >
                  <ImageIcon size={14} />
                  Auto-generate cover art when adding books
                </button>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <Link href="/settings" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Settings size={14} />
                AI prompts &amp; reader preferences
                {Object.values(customPrompts).some(v => v?.trim()) && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" title="Custom prompts active" />
                )}
              </Link>
            </div>
          </div>
        )}

        {/* Sections rendered in user-defined order */}
        {sections.map(section => {
          if (!section.visible) return null

          if (section.id === 'streaks') return isAuthenticated ? (
            <ReadingStreaks key="streaks" />
          ) : null

          if (section.id === 'revisit') {
            if (!isAuthenticated) return null
            // srVersion in dep list ensures re-render after advancing schedule
            void srVersion
            const dueBooks = books.filter(b => isSRDue(b.id, b.last_read_at ?? null, b.created_at))
            if (dueBooks.length === 0) return null
            return (
              <div key="revisit" className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-amber-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Due for revisit</h2>
                  <span className="text-xs text-gray-400">· spaced repetition</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {/* Jump to last read — most recently read book */}
                  {(() => {
                    const lastRead = [...books].filter(b => b.last_read_at).sort((a, b) => new Date(b.last_read_at!).getTime() - new Date(a.last_read_at!).getTime())[0]
                    if (!lastRead) return null
                    return (
                      <Link
                        key="jump-last-read"
                        href={`/books/${lastRead.id}`}
                        className="flex-shrink-0 flex flex-col justify-center items-start w-36 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 mb-1">Jump to last read</p>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">{lastRead.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(new Date(lastRead.last_read_at!))}</p>
                      </Link>
                    )
                  })()}
                  {dueBooks.slice(0, 8).map(book => (
                    <div key={book.id} className="flex-shrink-0 w-36 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 rounded-xl overflow-hidden group">
                      <Link
                        href={`/books/${book.id}`}
                        onClick={() => { advanceSR(book.id); setSrVersion(v => v + 1) }}
                        className="block p-3 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 leading-snug">{book.title}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {book.last_read_at ? timeAgo(new Date(book.last_read_at)) : 'Never opened'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{srInterval(book.id)}d cycle</p>
                      </Link>
                      <div className="flex border-t border-amber-100 dark:border-amber-900/30">
                        <button
                          onClick={() => { advanceSR(book.id); setSrVersion(v => v + 1) }}
                          title="Mark reviewed (advance schedule)"
                          className="flex-1 text-[10px] py-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        >
                          ✓ done
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          title="Delete from library"
                          className="px-2 py-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-amber-100 dark:border-amber-900/30"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          if (section.id === 'books') return (
            <div key="books">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                My Library
              </h2>
              {/* Books Grid */}
              {(() => {
                const q = search.toLowerCase().trim()
                const fuzzy = (text: string, query: string) => {
                  const t = text.toLowerCase()
                  if (t.includes(query)) return true
                  if (query.split(/\s+/).every(w => t.includes(w))) return true
                  // char-sequence fuzzy
                  let qi = 0
                  for (let i = 0; i < t.length && qi < query.length; i++) {
                    if (t[i] === query[qi]) qi++
                  }
                  return qi === query.length
                }
                const filtered = books.filter(b =>
                  (!q || fuzzy(b.title, q) || fuzzy(b.summary ?? '', q)) &&
                  (!typeFilter || b.content_type === typeFilter)
                )
                return filtered.length === 0 ? (
                  <div className="text-center py-12 px-4 max-w-lg mx-auto">
                    {q || typeFilter ? (
                      <>
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No results</h2>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome to your Library</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first book, article, or PDF to get started.</p>
                        <Link href="/upload" className="btn btn-primary inline-flex mb-8">
                          <Plus size={20} className="mr-2 flex-shrink-0" />Add Your First Text
                        </Link>
                        <div className="text-left space-y-4">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">What you can do</p>
                          {[
                            { icon: '📖', title: 'Read with AI', desc: 'Chat about any page, get explanations, create flashcards' },
                            { icon: '📝', title: 'Problem Sets', desc: 'Extract exercises from textbooks, work through them with hints' },
                            { icon: '🎭', title: 'AI Personas', desc: 'Choose a librarian personality — Sensei, Rival, Professor, and more' },
                            { icon: '🔊', title: 'Listen', desc: 'Convert any text to audiobook with AI narration' },
                            { icon: '🌐', title: 'Translate', desc: 'Translate entire books or read side-by-side with the original' },
                            { icon: '🧠', title: 'Flashcards', desc: 'Auto-generated flashcards with spaced-repetition review' },
                          ].map(f => (
                            <div key={f.title} className="flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">{f.icon}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {filtered.map(book => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onDelete={handleDelete}
                        onPinToggled={(id, p) => setBooks(bs => bs.map(b => b.id === id ? { ...b, pinned: p } : b).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)))}
                        onRenamed={(id, t) => setBooks(bs => bs.map(b => b.id === id ? { ...b, title: t } : b))}
                        onReclassified={isAuthenticated ? (id, type) => setBooks(bs => bs.map(b => b.id === id ? { ...b, content_type: type } : b)) : undefined}
                      />
                    ))}
                  </div>
                )
              })()}
              {/* Math Notes — bookmarks with attached Typst problem sets */}
              {isAuthenticated && typstNotes.length > 0 && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowTypstNotes(v => !v)}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    <Calculator size={16} className="text-teal-500" />
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      Math Notes
                    </h2>
                    <span className="text-xs text-gray-400">· {typstNotes.length} problem set{typstNotes.length !== 1 ? 's' : ''}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTypstNotes ? 'rotate-180' : ''}`} />
                  </button>
                  {showTypstNotes && (
                    <div className="space-y-2">
                      {typstNotes.map(note => {
                        const slug = (note.typst_title || `p${note.page_num}`).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50)
                        const handleDownloadNote = () => {
                          const blob = new Blob([note.typst_content!], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a'); a.href = url; a.download = `${slug}.typ`; a.click()
                          URL.revokeObjectURL(url)
                        }
                        return (
                          <div key={note.id} className="flex items-start justify-between gap-3 p-3 bg-white dark:bg-gray-800 border border-teal-100 dark:border-teal-900/40 rounded-xl">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                                {note.typst_title || `p.${note.page_num}`}
                              </p>
                              {note.book_title && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                  {note.book_title} · p.{note.page_num}
                                </p>
                              )}
                              <pre className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 font-mono whitespace-pre-wrap break-all">
                                {note.typst_content!.slice(0, 120)}{note.typst_content!.length > 120 ? '…' : ''}
                              </pre>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <a
                                href={`/books/${note.book_id}?page=${note.page_num}`}
                                className="text-xs text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
                              >
                                Open
                              </a>
                              <button onClick={handleDownloadNote} title="Download .typ" className="text-gray-300 hover:text-teal-500 transition-colors">
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Trash */}
              {isAuthenticated && trashedBooks.length > 0 && (
                <div className="mt-8">
                  <button
                    onClick={() => setShowTrash(v => !v)}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      Trash
                    </h2>
                    <span className="text-xs text-gray-400">· {trashedBooks.length} book{trashedBooks.length !== 1 ? 's' : ''}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTrash ? 'rotate-180' : ''}`} />
                  </button>
                  {showTrash && (
                    <div>
                      <div className="space-y-1 mb-3">
                        {trashedBooks.map(book => (
                          <div key={book.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <span className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">{book.title}</span>
                            <span className="text-xs text-gray-400 shrink-0">{book.deleted_at ? timeAgo(new Date(book.deleted_at)) : ''}</span>
                            <button
                              onClick={() => handleRestore(book.id)}
                              className="text-xs text-primary-600 hover:text-primary-700 shrink-0 font-medium"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={handleEmptyTrash}
                        className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />Empty Trash
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Storage gauge */}
              {isAuthenticated && quota && quota.storage_limit_bytes > 0 && (() => {
                const used = quota.storage_bytes_used
                const limit = quota.storage_limit_bytes
                const pct = Math.min(100, Math.round((used / limit) * 100))
                const usedGB = (used / (1024 ** 3)).toFixed(2)
                const limitGB = (limit / (1024 ** 3)).toFixed(1)
                const isWarning = pct >= 80
                return (
                  <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cloud Storage — {usedGB} GB of {limitGB} GB used ({pct}%)</span>
                      <a href="/billing" className="text-xs text-primary-600 hover:underline">{isWarning ? 'Buy more →' : 'Manage'}</a>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div className={'h-2 rounded-full transition-all duration-500 ' + (isWarning ? 'bg-amber-500' : 'bg-primary-500')} style={{ width: pct + '%' }} />
                    </div>
                    {isWarning && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Running low on storage.{' '}<a href="/billing" className="underline font-medium">Add 2 GB for $1/mo →</a></p>}
                  </div>
                )
              })()}
            </div>
          )

          if (section.id === 'feeds') {
            if (pinnedFeeds.length === 0) return null
            return (
              <div key="feeds" className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  My Feeds <span className="text-gray-400 dark:text-gray-500 font-normal text-base">· Recent Posts</span>
                  <button
                    onClick={() => setFeedsSignal(s => ({ open: !s.open, v: s.v + 1 }))}
                    className="ml-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 inline-flex items-center gap-0.5 font-normal transition-colors"
                  >
                    {feedsSignal.open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {feedsSignal.open ? 'close all' : 'open all'}
                  </button>
                  <button
                    onClick={() => setGlobalCatalog(v => {
                      const next = !v
                      localStorage.setItem('bza-feed-catalog', next ? '1' : '0')
                      if (isAuthenticated) settingsQueries.setPref('feed_catalog_view', next).catch(() => {})
                      return next
                    })}
                    title={globalCatalog ? 'List view all' : 'Catalog view all'}
                    className={`ml-2 inline-flex items-center gap-0.5 text-xs font-normal transition-colors ${globalCatalog ? 'text-blue-500 hover:text-blue-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    {globalCatalog ? <List size={13} /> : <LayoutGrid size={13} />}
                  </button>
                  <button
                    onClick={() => setGlobalImages(v => {
                      const next = !v
                      localStorage.setItem('bza-feed-images', next ? '1' : '0')
                      if (isAuthenticated) settingsQueries.setPref('feed_show_images', next).catch(() => {})
                      return next
                    })}
                    title={globalImages ? 'Hide images' : 'Show images'}
                    className={`ml-1 inline-flex items-center gap-0.5 text-xs font-normal transition-colors ${globalImages ? 'text-green-500 hover:text-green-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <ImageIcon size={13} />
                  </button>
                </h2>
                <div className={`grid ${FEED_GRID[cardSizes.feeds]}`}>
                  {pinnedFeeds.map(feed => (
                    <HomeFeedSection
                      key={feed.id}
                      feed={feed}
                      isAuthenticated={!!isAuthenticated}
                      onUnpinned={refreshFeeds}
                      onRenamed={() => {
                        const updated = getPinnedFeeds()
                        setPinnedFeeds(updated)
                        syncFeedsToDB(updated)
                      }}
                      onBookAdded={(book) => book ? setBooks(bs => [book, ...bs]) : checkAuthAndLoadData()}
                      expandSignal={feedsSignal}
                      globalCatalog={globalCatalog}
                      globalImages={globalImages}
                    />
                  ))}
                </div>
              </div>
            )
          }

          if (section.id === 'classics') return prefs?.show_classics_library !== false ? (
            <ClassicLibrary
              key="classics"
              books={books}
              isAuthenticated={!!isAuthenticated}
              onBookAdded={(book) => book ? setBooks(bs => [book, ...bs]) : checkAuthAndLoadData()}
            />
          ) : null

          return null
        })}
      </div>

      {isAuthenticated && (
        <MetaDrawer
          books={books}
          isOpen={metaDrawerOpen}
          onClose={() => setMetaDrawerOpen(false)}
          dueCardCount={dueCardCount}
        />
      )}
    </div>
  )
}

