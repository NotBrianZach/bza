export interface PinnedFeed {
  id: string
  label: string
  url: string
  expanded?: boolean // start expanded on home page
}

const KEY = 'bza-pinned-feeds'

const DEFAULT_FEEDS: PinnedFeed[] = [
  { id: 'hn-default', label: 'Hacker News', url: 'feed://hn' },
  { id: 'gnews-default', label: 'Google News', url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en' },
  { id: 'reddit-programming', label: 'r/programming', url: 'feed://reddit/programming' },
  { id: '4chan-g', label: '/g/ — Technology', url: 'feed://4chan/g' },
]

export function getPinnedFeeds(): PinnedFeed[] {
  if (typeof window === 'undefined') return DEFAULT_FEEDS
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === null) return DEFAULT_FEEDS
    return JSON.parse(stored)
  } catch { return DEFAULT_FEEDS }
}

export function savePinnedFeeds(feeds: PinnedFeed[]): void {
  localStorage.setItem(KEY, JSON.stringify(feeds))
}

export function pinFeed(label: string, url: string): PinnedFeed {
  const feeds = getPinnedFeeds()
  const existing = feeds.find(f => f.url === url)
  if (existing) return existing
  const feed: PinnedFeed = { id: Date.now().toString(), label, url }
  savePinnedFeeds([...feeds, feed])
  return feed
}

export function unpinFeed(id: string): void {
  savePinnedFeeds(getPinnedFeeds().filter(f => f.id !== id))
}

export function isFeedPinned(url: string): boolean {
  return getPinnedFeeds().some(f => f.url === url)
}

export function setFeedExpanded(id: string, expanded: boolean): void {
  savePinnedFeeds(getPinnedFeeds().map(f => f.id === id ? { ...f, expanded } : f))
}

export function reorderFeeds(feeds: PinnedFeed[]): void {
  savePinnedFeeds(feeds)
}

export function renameFeed(id: string, label: string): void {
  savePinnedFeeds(getPinnedFeeds().map(f => f.id === id ? { ...f, label } : f))
}

