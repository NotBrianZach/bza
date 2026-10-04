/**
 * Full-length playback, via YouTube.
 *
 * The music provider (lib/offerings/music.ts) gives 30-second previews, which is the
 * whole audio story for free — but it is 30 seconds. This resolves a track to a
 * YouTube video id so the real thing can play in an iframe.
 *
 * The constraint that shapes everything here: a video id can only be obtained
 * from Data API search, at 100 quota units per call against 10,000/day. That is
 * 100 lookups a day. So:
 *
 *  - every result is cached in youtube_tracks, forever, shared by all users;
 *  - misses are cached too, or an unmatched song re-spends 100 units every time;
 *  - resolution is lazy — callers ask for one track, when a person actually wants
 *    to hear it, not for a whole chain up front;
 *  - running out of quota is not an error. It returns null and the caller falls
 *    back to the preview, because the preview always works.
 *
 * Unlike Spotify's 250k-MAU wall, the quota here is liftable: the extension form
 * is free and judged on terms compliance rather than scale.
 */

import { createClient } from '@supabase/supabase-js'

const SEARCH = 'https://www.googleapis.com/youtube/v3/search'
const OEMBED = 'https://www.youtube.com/oembed'

export interface YouTubeMatch {
  videoId: string
  embeddable: boolean
}

// Built in its own function so the client's type carries the schema. The
// schema name is a type parameter on SupabaseClient, so the old
// `ReturnType<typeof createClient>` annotation meant "a public-schema client"
// and would not accept this one.
function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // youtube_tracks lives in `bza_public`, not `public` — see
    // supabase/setup/51_youtube_cache.sql. The schema must also be listed
    // under Settings -> API -> Exposed schemas, which is a project setting no
    // migration can set; without it every query here returns PGRST106 and
    // resolution falls back to the 30s preview.
    { db: { schema: 'bza_public' } },
  )
}

let _db: ReturnType<typeof makeDb> | null = null
function db() {
  if (!_db) _db = makeDb()
  return _db
}

/**
 * Cache lookup. Returns:
 *   YouTubeMatch — resolved to a video
 *   null         — resolved to nothing (a cached miss; do not spend quota again)
 *   undefined    — never asked
 *
 * The three-way return is the point. Collapsing "known miss" into "unknown" is
 * what would burn the daily budget on songs YouTube does not have.
 */
export async function cached(trackId: string): Promise<YouTubeMatch | null | undefined> {
  const { data } = await (db().from('youtube_tracks') as any)
    .select('video_id, embeddable')
    .eq('track_id', trackId)
    .maybeSingle()

  if (!data) return undefined
  if (!data.video_id) return null
  return { videoId: data.video_id, embeddable: !!data.embeddable }
}

async function remember(trackId: string, query: string, match: YouTubeMatch | null) {
  await (db().from('youtube_tracks') as any).upsert({
    track_id: trackId,
    video_id: match?.videoId ?? null,
    embeddable: match?.embeddable ?? false,
    query,
    resolved_at: new Date().toISOString(),
  }, { onConflict: 'track_id' })
}

/**
 * Can this video actually be embedded off-site?
 *
 * oEmbed is keyless and costs no quota, which is why it is worth asking even
 * though search was already filtered to videoEmbeddable=true — that filter does
 * not account for region or rights restrictions that make an embed fail at play
 * time. A non-200 here means "do not offer this".
 */
export async function isEmbeddable(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${OEMBED}?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    )
    return res.ok
  } catch {
    return false
  }
}

/** True when YouTube refused for quota reasons rather than anything about the query. */
function isQuotaError(body: any): boolean {
  const reasons = (body?.error?.errors ?? []).map((e: any) => e.reason)
  return reasons.includes('quotaExceeded') || reasons.includes('dailyLimitExceeded')
}

export class QuotaExhausted extends Error {
  constructor() { super('YouTube lookups are used up for today') }
}

/**
 * Resolve a track to a playable video, spending quota only when the cache misses.
 *
 * Throws QuotaExhausted so the caller can say something true about *why* full
 * playback is unavailable; every other failure resolves to a cached miss, because
 * "YouTube has nothing for this" and "the query was bad" are indistinguishable
 * from here and both mean fall back to the preview.
 */
export async function resolveVideo(
  trackId: string,
  artist: string,
  title: string,
): Promise<YouTubeMatch | null> {
  const hit = await cached(trackId)
  if (hit !== undefined) return hit

  const key = process.env.YOUTUBE_API_KEY
  if (!key) return null

  const query = `${artist} ${title}`.trim()
  const url = `${SEARCH}?part=snippet&type=video&maxResults=3`
    + `&videoEmbeddable=true&videoSyndicated=true`
    + `&q=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`

  const res = await fetch(url)
  const body = await res.json().catch(() => null)

  if (!res.ok) {
    // Do not cache a quota refusal as a miss — it says nothing about the track,
    // and caching it would make the song permanently unresolvable.
    if (res.status === 403 && isQuotaError(body)) throw new QuotaExhausted()
    await remember(trackId, query, null)
    return null
  }

  const videoId: string | undefined = (body?.items ?? [])
    .map((i: any) => i?.id?.videoId)
    .find((v: any) => typeof v === 'string' && v.length > 0)

  if (!videoId) {
    await remember(trackId, query, null)
    return null
  }

  const match: YouTubeMatch = { videoId, embeddable: await isEmbeddable(videoId) }
  await remember(trackId, query, match)
  return match
}
