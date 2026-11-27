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
 * not touched: 4chan wants a browser UA and a Referer, and swapping it breaks
 * in a way that looks like rate limiting.
 *
 * THE REDDIT HALF OF THAT SENTENCE IS NO LONGER TRUE and used to read "Reddit
 * 403s a browser UA server-side and wants a descriptive bot one". Measured
 * 2026-11-27, every unauthenticated route is closed and the UA makes no
 * difference to any of them:
 *
 *   www.reddit.com/r/X/hot.json   403 for BOTH UAs, with `retry-after: 0`
 *                                 and a 190KB HTML block page as the body
 *   www.reddit.com/r/X/.rss       404, or 429 with `x-ratelimit-remaining:
 *                                 0.0` — never 200, even spaced out
 *   old.reddit.com/...            302 to the new UI, which serves HTML
 *
 * So the descriptive-bot-UA advice now sends you after a variable that stopped
 * mattering, which is worse than no comment. Reddit needs an app token; see
 * `redditToken` below.
 *
 * ── Why the suggested feed needs it ───────────────────────────────────────
 *
 * The pinned-feed list is mostly `feed://` URLs — `feed://hn`,
 * `feed://reddit/programming`, `feed://4chan/g`. Three of the four defaults
 * are. A "use my existing feeds" integration that could only take http(s) RSS
 * would therefore import almost nothing and look broken, so the digest has to
 * be able to ingest these too.
 */


/**
 * Reddit wants a descriptive UA on the token request and on every API call.
 * It is no longer what decides whether you are let in — see the header — but
 * it is still what they ask for, and a generic one invites a throttle.
 */
export const REDDIT_UA = 'bza-reader/1.0 (read-along app; +https://aireadalong.com)'
// Generic UA for non-Reddit fetches
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Thrown when the only thing missing is credentials, so callers can say so. */
export class RedditNeedsCredentials extends Error {
  constructor() {
    super(
      'Reddit no longer serves feeds anonymously. Add an app: create a "script" ' +
      'app at reddit.com/prefs/apps, then set REDDIT_CLIENT_ID and ' +
      'REDDIT_CLIENT_SECRET.',
    )
    this.name = 'RedditNeedsCredentials'
  }
}

/**
 * An app token, cached until shortly before it expires.
 *
 * Client-credentials ("application only") rather than a user login, because
 * nothing here reads a private subreddit or acts as anybody — it lists public
 * posts, which is exactly what this grant is for. It also means no OAuth
 * redirect, no per-user token storage, and no refresh dance.
 *
 * Cached in module scope, which is the right lifetime and not merely the easy
 * one: the token is valid for hours, and minting one per request would turn
 * every feed load into two round trips and walk straight into the rate limit
 * this change exists to get out of. A module global is per-isolate, so the
 * worst case on a cold isolate is one extra fetch.
 *
 * Sixty seconds are shaved off the expiry. A token that is valid when checked
 * and expired when it arrives fails as a 401 on the real request, which is a
 * far more confusing error than a slightly early refresh.
 */
let redditToken: { value: string; expiresAt: number } | null = null

async function getRedditToken(): Promise<string> {
  const id = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) throw new RedditNeedsCredentials()

  if (redditToken && Date.now() < redditToken.expiresAt) return redditToken.value

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_UA,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!res.ok) {
    // 401 here means the id/secret are wrong, which is worth separating from
    // "Reddit is down" — the remedy is completely different.
    throw new Error(res.status === 401
      ? 'Reddit rejected the app credentials — check REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.'
      : `Could not get a Reddit token (${res.status}).`)
  }
  const data = await res.json() as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('Reddit returned a token response with no token.')
  redditToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(0, (data.expires_in ?? 3600) - 60) * 1000,
  }
  return redditToken.value
}

/**
 * One authenticated Reddit API call, taking the PUBLIC url its callers build.
 *
 * The host-and-suffix swap lives here rather than at the two call sites so
 * there is one place that knows the API moved, and it THROWS on a url it does
 * not recognise instead of passing it through. Passing an unrecognised url
 * through is the failure worth designing against: it would reach
 * www.reddit.com unauthenticated, 403, and be retried — exactly the behaviour
 * this function was changed to stop, arriving silently through a caller
 * nobody updated.
 */
export async function redditFetch(url: string, attempt = 0): Promise<Response> {
  const m = /^https:\/\/www\.reddit\.com(\/[^?]*?)(?:\.json)?(\?.*)?$/.exec(url)
  if (!m) throw new Error(`redditFetch was given a url it cannot route to the API: ${url}`)
  const apiUrl = `https://oauth.reddit.com${m[1]}${m[2] ?? ''}`

  const token = await getRedditToken()
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': REDDIT_UA,
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })
  /*
   * Retry once, and on 401 drop the cached token first. A 401 on a token that
   * was unexpired by our clock means Reddit revoked or rotated it, and
   * retrying with the same one just fails again.
   */
  if (!res.ok && attempt === 0 && (res.status === 401 || res.status === 429 || res.status >= 500)) {
    if (res.status === 401) redditToken = null
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

/**
 * HN's front page, in ONE request.
 *
 * ── It used to be 1 + limit requests, and that was a production outage ────
 *
 * The firebase API this was written against returns `topstories.json` as a bare
 * array of IDs, so getting anything renderable means a second fetch per story.
 * At the ingest default of 60 that is 61 outbound requests for one feed, and a
 * Cloudflare Worker gets 50 subrequests per invocation. It stayed invisible
 * while polling was gated by the 30-minute floor and only ever picked up a
 * feed or two; the moment a manual "Refresh" polled every feed in one
 * invocation it failed with `Too many subrequests by single Worker invocation`
 * — and failed on whatever unrelated query happened to be next, which in
 * practice was the duplicate check in `insertItems`.
 *
 * The Algolia HN API returns the front page as whole story objects, so the
 * N+1 goes away rather than being tuned down. A smaller `limit` would not have
 * fixed it: even 30 is 31 requests, and two users' worth of HN subscriptions
 * in one poll is 62.
 *
 * Field names differ from firebase and the mapping below is the whole
 * difference: `objectID` not `id`, `points` not `score`, `num_comments` not
 * `descendants`, `created_at` as an ISO string rather than `time` as unix
 * seconds. `story_text` carries an Ask HN body.
 *
 * `tags=front_page` is the same ranking `topstories.json` serves, and it holds
 * about 30 items — so a `limit` above that returns what exists rather than
 * padding with older stories, which is the honest answer for a front page.
 */
export async function fetchHN(limit = 30): Promise<FeedPost[]> {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${Math.min(limit, 50)}`,
    { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store' },
  )
  if (!res.ok) throw new Error(`Hacker News API error: ${res.status}`)
  const json = await res.json()

  return ((json?.hits ?? []) as any[])
    .filter(s => s.objectID && s.title)
    .map(s => ({
      id: String(s.objectID),
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.objectID}`,
      commentsUrl: `https://news.ycombinator.com/item?id=${s.objectID}`,
      title: s.title,
      score: s.points ?? undefined,
      numComments: s.num_comments ?? undefined,
      author: s.author,
      date: s.created_at ?? undefined,
      body: s.story_text ?? undefined,
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
