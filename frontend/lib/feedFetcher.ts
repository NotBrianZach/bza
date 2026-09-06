// Shared feed-fetching logic used by FeedBrowser and HomeFeedSection.
// All fetches that can be done client-side (4chan, Reddit, HN comments) are done
// directly from the browser to avoid Cloudflare Workers IP bans.

export interface FeedPost {
  id: string
  title: string
  url: string
  commentsUrl?: string
  score?: number
  numComments?: number
  author?: string
  date?: string
  body?: string
  source: string
  subreddit?: string
  board?: string
  thumbnail?: string
}

// ── HN ──────────────────────────────────────────────────────────────────────

async function fetchHN(limit = 30): Promise<FeedPost[]> {
  const ids: number[] = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json())
  const stories = await Promise.all(
    ids.slice(0, limit).map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
        .catch(() => null)
    )
  )
  return stories
    .filter(Boolean)
    .filter(s => s.type === 'story' && s.title)
    .map(s => ({
      id: String(s.id),
      title: s.title,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      commentsUrl: `https://news.ycombinator.com/item?id=${s.id}`,
      score: s.score,
      numComments: s.descendants,
      author: s.by,
      date: s.time ? new Date(s.time * 1000).toISOString() : undefined,
      body: s.text ?? undefined,
      source: 'hn',
    }))
}

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
    .replace(/<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export async function fetchHNDiscussion(storyId: string): Promise<string> {
  try {
    const item = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`).then(r => r.json())
    if (!item?.kids?.length) return ''
    const comments = await Promise.all(
      item.kids.slice(0, 30).map(async (id: number) => {
        const c = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json())
          .catch(() => null)
        if (!c || c.deleted || c.dead || !c.text) return null
        return `**${c.by ?? 'anon'}**\n\n${decodeHtmlEntities(c.text)}`
      })
    )
    const valid = comments.filter(Boolean)
    if (!valid.length) return ''
    return `\n\n---\n\n## Hacker News Discussion\n\n${valid.join('\n\n---\n\n')}`
  } catch {
    return ''
  }
}

// ── Reddit ───────────────────────────────────────────────────────────────────
// Proxied through server — Reddit blocks anonymous requests from browsers
// (CORS + auth restrictions), so we route via /api/feed which uses a proper UA.

async function fetchReddit(subreddit: string): Promise<FeedPost[]> {
  const res = await fetch(`/api/feed?type=reddit&sub=${encodeURIComponent(subreddit)}&sort=hot`)
  const d = await res.json()
  if (d.error) throw new Error(d.error)
  return d.posts ?? []
}

export async function fetchRedditDiscussion(subreddit: string, postId: string): Promise<string> {
  try {
    const res = await fetch(`/api/feed?type=reddit-comments&sub=${encodeURIComponent(subreddit)}&thread=${encodeURIComponent(postId)}`)
    const d = await res.json()
    return d.markdown ?? ''
  } catch {
    return ''
  }
}

// ── 4chan ────────────────────────────────────────────────────────────────────
// a.4cdn.org does NOT support CORS, so this must go through our server proxy.

async function fetch4chan(board: string): Promise<FeedPost[]> {
  const res = await fetch(`/api/feed?type=4chan&board=${encodeURIComponent(board)}`)
  const d = await res.json()
  if (d.error) throw new Error(d.error)
  return d.posts ?? []
}

// ── RSS (via server proxy) ───────────────────────────────────────────────────

export class FeedDiscoveryError extends Error {
  feedLinks: { url: string; title: string }[]
  constructor(message: string, feedLinks: { url: string; title: string }[]) {
    super(message)
    this.feedLinks = feedLinks
  }
}

async function fetchRss(url: string): Promise<FeedPost[]> {
  const res = await fetch('/api/fetch-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  const d = await res.json()
  if (d.error) throw new Error(d.error)
  if (d.type !== 'rss') {
    if (d.feedLinks?.length) {
      throw new FeedDiscoveryError(
        `Not an RSS feed, but found ${d.feedLinks.length} feed(s) on that page`,
        d.feedLinks
      )
    }
    throw new Error('URL did not return an RSS feed')
  }
  return (d.items ?? []).map((item: any, i: number) => ({
    id: String(i),
    title: item.title,
    url: item.url,
    date: item.date,
    body: item.content ?? '',
    source: 'rss',
  }))
}

// ── 4chan thread content ─────────────────────────────────────────────────────
// Fetches a full thread via our server proxy (a.4cdn.org has no CORS support).

export async function fetch4chanThreadMarkdown(board: string, threadId: string): Promise<{ title: string; markdown: string }> {
  const url = `/api/feed?type=4chan-thread&board=${encodeURIComponent(board)}&thread=${encodeURIComponent(threadId)}`

  async function attempt(): Promise<any> {
    const res = await fetch(url, { cache: 'no-store' })
    const body = await res.text()
    if (!res.ok) {
      // Try to surface a structured error message; otherwise use status text
      try { return JSON.parse(body) } catch { throw new Error(`Thread fetch failed (HTTP ${res.status})`) }
    }
    try {
      return JSON.parse(body)
    } catch {
      throw new Error(`truncated response (${body.length} bytes)`)
    }
  }

  let d: any
  try {
    d = await attempt()
  } catch (e: any) {
    // One retry — most failures we've seen are transient edge/network truncations
    if (/truncated response|HTTP 5\d\d/.test(e?.message ?? '')) {
      d = await attempt().catch(() => { throw new Error(`Failed to load thread — ${e.message}`) })
    } else {
      throw e
    }
  }
  if (d.error) throw new Error(d.error)
  const markdown: string = d.markdown ?? ''
  const title = markdown.match(/^#\s+(.+)/m)?.[1] ?? `Thread #${threadId}`
  return { title, markdown }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchFeed(url: string): Promise<FeedPost[]> {
  if (!url.startsWith('feed://')) return fetchRss(url)
  const [, rest] = url.split('feed://')
  const [type, param = ''] = rest.split('/')
  if (type === 'hn') return fetchHN()
  if (type === 'reddit') return fetchReddit(param)
  if (type === '4chan') return fetch4chan(param)
  throw new Error(`Unknown feed type: ${type}`)
}