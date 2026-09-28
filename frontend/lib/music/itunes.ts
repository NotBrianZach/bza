/**
 * The music provider: Apple's iTunes Search API.
 *
 * Replaced Spotify, which this app could not actually ship on. Spotify's extended
 * quota requires 250k monthly active users, and until you have it you get: a
 * 25-account allowlist, `limit` capped at 10 instead of the documented 50, no
 * audio-features, and — fatally for a game built on listening — no `preview_url`
 * at all. Measured against the same query, iTunes returns 100 results where
 * Spotify managed 10, and every one of them carries playable preview audio.
 *
 * What it buys beyond catalogue: there is no OAuth here. No token rows, no scope
 * grants, no re-consent when a scope is added, no cookie domain for a session to
 * disagree about, no premium tier gating playback. Anyone can play immediately.
 *
 * Two constraints to respect:
 *  - ~20 requests/minute, per IP. Server-side, that IP is ours and shared by
 *    every user, so searches are cached (see CACHE_TTL_MS) and the client
 *    debounces before it ever gets here.
 *  - Previews are 30 seconds. That is the whole audio story now; full-length
 *    playback would need a YouTube layer on top.
 */

import type { TrackRef } from '@/lib/listen/types'

const SEARCH = 'https://itunes.apple.com/search'
const LOOKUP = 'https://itunes.apple.com/lookup'

/** iTunes accepts up to 200; 25 is plenty to choose a move from. */
export const SEARCH_LIMIT = 25

/**
 * Cached because the rate limit is per-IP and therefore shared across all users
 * of this deployment — without this, a handful of people typing at once would
 * exhaust it. Keyed on the normalised query.
 *
 * In-process only, so on Cloudflare it is per-isolate and partial. That is fine:
 * it is a rate-limit cushion, not a correctness mechanism, and a miss just costs
 * one upstream call. A shared cache would need a table and a migration.
 */
const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 500
const cache = new Map<string, { at: number; tracks: TrackRef[] }>()

function cacheGet(key: string): TrackRef[] | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) { cache.delete(key); return null }
  return hit.tracks
}

function cacheSet(key: string, tracks: TrackRef[]) {
  // Cheapest useful eviction: Map preserves insertion order, so the first key is
  // the oldest. No LRU bookkeeping for what is only a cushion.
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { at: Date.now(), tracks })
}

export class MusicError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Artwork comes back at 100px; the same URL serves any size. */
function artwork(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1')
}

export function mapTrack(r: any): TrackRef | null {
  if (!r?.trackId || !r.trackName) return null
  return {
    id: String(r.trackId),
    name: r.trackName,
    artist: r.artistName ?? '',
    artistId: r.artistId != null ? String(r.artistId) : null,
    album: r.collectionName ?? '',
    albumId: r.collectionId != null ? String(r.collectionId) : null,
    releaseDate: typeof r.releaseDate === 'string' ? r.releaseDate.slice(0, 10) : null,
    // Spotify's track object had no genre at all. This one does, and it gives the
    // interpreter something real to reason about when judging a connection.
    genre: r.primaryGenreName ?? null,
    url: r.trackViewUrl ?? null,
    image: artwork(r.artworkUrl100),
    previewUrl: r.previewUrl ?? null,
    durationMs: r.trackTimeMillis ?? 0,
    explicit: r.trackExplicitness === 'explicit',
  }
}

async function get(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 403 || res.status === 429) {
    throw new MusicError('Too many searches at once — try that again in a moment.', 429)
  }
  if (!res.ok) throw new MusicError(`Music search failed (HTTP ${res.status})`, res.status)
  // iTunes has been known to answer 200 with a JS content-type and a body that is
  // still JSON, so parse the text rather than trusting res.json().
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new MusicError('Music search returned something unreadable', 502)
  }
}

/** Tracks matching a free-text query, best match first. Playable ones only. */
export async function searchTracks(q: string, limit = SEARCH_LIMIT): Promise<TrackRef[]> {
  const term = q.trim()
  if (!term) return []

  const key = `${term.toLowerCase()}|${limit}`
  const cached = cacheGet(key)
  if (cached) return cached

  const url = `${SEARCH}?term=${encodeURIComponent(term)}&media=music&entity=song`
    + `&limit=${Math.max(1, Math.min(Math.trunc(limit) || SEARCH_LIMIT, 200))}`
  const data = await get(url)

  const tracks = (data?.results ?? [])
    .map(mapTrack)
    .filter((t: TrackRef | null): t is TrackRef => !!t && !!t.previewUrl)

  cacheSet(key, tracks)
  return tracks
}

/**
 * One track by id.
 *
 * The turn route re-fetches the player's move server-side rather than trusting a
 * track body from the client — a move has to be a real song, and the server is
 * the one that decides what that song is.
 */
export async function lookupTrack(id: string): Promise<TrackRef | null> {
  if (!/^\d+$/.test(id)) return null
  const data = await get(`${LOOKUP}?id=${encodeURIComponent(id)}&entity=song`)
  const first = (data?.results ?? [])[0]
  return first ? mapTrack(first) : null
}

/**
 * Turn an interpreter's song *query* ("Artist — Title", or a loose description)
 * into a real track. This is the constraint that makes a reply a consequence
 * rather than a claim: if nothing matches, the dial missed.
 *
 * Tries the query as given, then a swapped "Title Artist" reading when it parses
 * as "Artist - Title", then the bare title. `exclude` keeps the dial from
 * answering with a song already in play.
 */
export async function resolveTrack(
  query: string,
  exclude: string[] = [],
): Promise<TrackRef | null> {
  const raw = query.trim()
  if (!raw) return null

  const attempts: string[] = [raw]
  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length === 2) {
    const [left, right] = dashSplit
    // Interpreters write it either way round, and iTunes has no field filters, so
    // both orderings are just the same words — try the bare title last, which is
    // the loosest and most likely to match something irrelevant.
    attempts.push(`${right} ${left}`, right)
  }

  const excluded = new Set(exclude)
  for (const attempt of attempts) {
    let tracks: TrackRef[]
    try {
      tracks = await searchTracks(attempt, 10)
    } catch (e) {
      if (e instanceof MusicError && e.status === 429) throw e
      continue
    }
    const hit = tracks.find(t => !excluded.has(t.id))
    if (hit) return hit
  }
  return null
}
