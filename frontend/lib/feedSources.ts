/**
 * The three non-RSS sources: Hacker News, Reddit, and 4chan.
 *
 * ── Why these are a shared library and the RSS parser is not ───────────────
 *
 * lib/suggest/parse.ts deliberately duplicates the RSS reading that
 * app/api/feed does, because the two have genuinely different contracts — one
 * converts to markdown and caps at 30 for a preview pane, the other wants
 * plain text, no cap, and categories. Four differences out of four.
 *
 * These have NO such difference. "Fetch HN's top stories and return them as
 * posts" is one job with one right answer, and both the feed browser and the
 * suggested feed's ingest want exactly it. So this is extracted rather than
 * copied, and app/api/feed/route.ts now imports it.
 *
 * Moved here verbatim. The UA strings in particular are load-bearing and were
 * not touched: Reddit 403s a browser UA server-side and wants a descriptive
 * bot one, 4chan wants a browser UA and a Referer, and swapping them breaks
 * both in ways that look like rate limiting.
 *
 * ── Why the suggested feed needs it ───────────────────────────────────────
 *
 * The pinned-feed list is mostly `feed://` URLs — `feed://hn`,
 * `feed://reddit/programming`, `feed://4chan/g`. Three of the four defaults
 * are. A "use my existing feeds" integration that could only take http(s) RSS
 * would therefore import almost nothing and look broken, so the digest has to
 * be able to ingest these too.
 */


// Reddit requires a descriptive bot UA — browser UAs get 403'd server-side
export const REDDIT_UA = 'bza-reader/1.0 (read-along app; +https://aireadalong.com)'
// Generic UA for non-Reddit fetches
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export async function redditFetch(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': REDDIT_UA, 'Accept': 'application/json' },
    cache: 'no-store',
  })
  // Retry once on 429/5xx/403
  if (!res.ok && attempt === 0 && (res.status === 429 || res.status >= 500 || res.status === 403)) {
    await new Promise(r => setTimeout(r, 800))
    return redditFetch(url, 1)
  }
  return res
}

export interface FeedPost {
  id: string
  title: string
  url: string          // link to the actual article/thread
  commentsUrl?: string // link to discussion thread
  score?: number
  numComments?: number
  author?: string
  date?: string
  body?: string        // OP body text (for 4chan/reddit self-posts)
  source: string       // 'hn' | 'reddit' | '4chan' | 'rss'
  subreddit?: string
  board?: string
  thumbnail?: string
}

// ─── Hacker News ─────────────────────────────────────────────────────────────

export async function fetchHN(limit = 30): Promise<FeedPost[]> {
  const ids: number[] = await fetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  ).then(r => r.json())

  const top = ids.slice(0, limit)
  const stories = await Promise.all(
    top.map(id =>
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

// ─── Reddit ───────────────────────────────────────────────────────────────────

export async function fetchReddit(subreddit: string, sort: string, limit = 30): Promise<FeedPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`
  const res = await redditFetch(url)
  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`)
  const json = await res.json()
  const posts = json?.data?.children ?? []

  return posts
    .filter((c: any) => c.kind === 't3')
    .map((c: any) => {
      const p = c.data
      const isExternal = !p.is_self && p.url && !p.url.includes('reddit.com')
      return {
        id: p.id,
        title: p.title,
        url: isExternal ? p.url : `https://www.reddit.com${p.permalink}`,
        commentsUrl: `https://www.reddit.com${p.permalink}`,
        score: p.score,
        numComments: p.num_comments,
        author: p.author,
        date: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
        body: p.selftext || undefined,
        source: 'reddit',
        subreddit: p.subreddit,
        thumbnail: p.thumbnail && !['self', 'default', 'nsfw', 'spoiler', ''].includes(p.thumbnail) ? p.thumbnail : undefined,
      }
    })
}

// ─── 4chan ─────────────────────────────────────────────────────────────────────

export async function fetch4chan(board: string, limit = 30): Promise<FeedPost[]> {
  const res = await fetch(`https://a.4cdn.org/${board}/catalog.json`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json',
      'Referer': `https://boards.4chan.org/${board}/`,
    },
  })
  if (!res.ok) throw new Error(`4chan API error: ${res.status}`)
  const pages: any[] = await res.json()

  const threads: any[] = pages.flatMap(p => p.threads ?? [])
  return threads
    .filter(t => t.replies > 0)
    .sort((a, b) => b.replies - a.replies)
    .slice(0, limit)
    .map(t => ({
      id: String(t.no),
      title: t.sub
        ? t.sub.replace(/<[^>]+>/g, '').slice(0, 120)
        : (t.com ?? '').replace(/<[^>]+>/g, '').slice(0, 80) || `Thread #${t.no}`,
      url: `https://boards.4chan.org/${board}/thread/${t.no}`,
      commentsUrl: `https://boards.4chan.org/${board}/thread/${t.no}`,
      score: undefined,
      numComments: t.replies,
      author: t.name ?? 'Anonymous',
      date: t.time ? new Date(t.time * 1000).toISOString() : undefined,
      body: t.com ? t.com.replace(/<[^>]+>/g, '').slice(0, 300) : undefined,
      source: '4chan',
      board,
      thumbnail: t.tim && t.ext ? `https://i.4cdn.org/${board}/${t.tim}s.jpg` : undefined,
    }))
}

// ---------------------------------------------------------------------------
// The feed:// grammar
// ---------------------------------------------------------------------------

/**
 * What a `feed://` URL names.
 *
 * The grammar is `feed://<kind>[/<param>]`, and it is parsed in exactly one
 * place now. `feed://hn` and `feed://hn/top` are the same thing — the preset
 * list in FeedBrowser writes the second and lib/pinnedFeeds the first, and
 * `fetchHN` takes no sort, so the param is ignored for hn rather than being an
 * error. Returning null for anything else is what lets a caller tell a
 * pseudo-feed from a real URL without a second regex.
 */
export type FeedKind = 'hn' | 'reddit' | '4chan'

export function parseFeedUrl(url: string): { kind: FeedKind; param: string } | null {
  if (!url.startsWith('feed://')) return null
  const rest = url.slice('feed://'.length)
  const [kind, param = ''] = rest.split('/')
  if (kind === 'hn') return { kind: 'hn', param }
  // reddit and 4chan are meaningless without their subreddit or board, so a
  // bare `feed://reddit` is not a feed and says so by returning null.
  if (kind === 'reddit' && param) return { kind: 'reddit', param }
  if (kind === '4chan' && param) return { kind: '4chan', param }
  return null
}

/**
 * The canonical spelling of a `feed://` URL.
 *
 * `feed://hn` and `feed://hn/top` are the SAME source — `fetchHN` takes no
 * sort, so the param is decoration — but they are different strings, and
 * `suggest_feeds.url` is unique. Left alone, the two presets in the codebase
 * (lib/pinnedFeeds writes the first, FeedBrowser the second) would produce two
 * subscriptions to Hacker News, polled twice and shown twice in the sources
 * list. The items would still deduplicate, so the symptom would be a confusing
 * settings page rather than a duplicated digest — which is exactly the kind of
 * thing that never gets diagnosed.
 *
 * Reddit and 4chan keep their param, because there it IS the source. Case is
 * preserved on the param for display (`r/MachineLearning`), since both APIs
 * are case-insensitive about it.
 */
export function canonicalFeedUrl(url: string): string {
  const parsed = parseFeedUrl(url)
  if (!parsed) return url
  if (parsed.kind === 'hn') return 'feed://hn'
  return `feed://${parsed.kind}/${parsed.param}`
}

/** A human label for a pseudo-feed, when the user has not supplied one. */
export function labelForFeedUrl(url: string): string | null {
  const parsed = parseFeedUrl(url)
  if (!parsed) return null
  if (parsed.kind === 'hn') return 'Hacker News'
  if (parsed.kind === 'reddit') return `r/${parsed.param}`
  return `/${parsed.param}/ — 4chan`
}

/**
 * Fetch one pseudo-feed's posts.
 *
 * `limit` defaults higher than the browser's 30 because the digest scores over
 * a window rather than rendering a page, and throwing away candidates before
 * scoring is the one thing the selection logic cannot recover from.
 */
export async function fetchPseudoFeed(
  url: string, limit = 60,
): Promise<FeedPost[]> {
  const parsed = parseFeedUrl(url)
  if (!parsed) throw new Error(`not a feed:// url: ${url}`)
  if (parsed.kind === 'hn') return fetchHN(limit)
  if (parsed.kind === 'reddit') return fetchReddit(parsed.param, 'hot', limit)
  return fetch4chan(parsed.param, limit)
}
