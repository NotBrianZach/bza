/**
 * Music offerings — Apple's iTunes Search API.
 *
 * Replaced Spotify, which this app could not ship on: extended quota requires
 * 250k monthly active users, and until you have it you get a 25-account
 * allowlist, `limit` capped at 10 instead of the documented 50, no audio
 * features, and — fatally for a game built on listening — no preview audio at
 * all. iTunes returns 100 results where Spotify managed 10, every one with
 * playable audio, and no OAuth: no token rows, no scope grants, no cookie domain
 * for a session to disagree about, no premium tier gating playback.
 *
 * Two constraints to respect:
 *  - ~20 requests/minute per IP. Server-side that IP is ours and shared by every
 *    user, so searches are cached and the client debounces before it gets here.
 *  - Previews are 30 seconds. That is the whole audio story; full-length playback
 *    goes through lib/music/youtube.ts on demand.
 */

import type { Offering } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const SEARCH = 'https://itunes.apple.com/search'
const LOOKUP = 'https://itunes.apple.com/lookup'

/** iTunes accepts up to 200; 25 is plenty to choose a move from. */
export const MUSIC_SEARCH_LIMIT = 25

const cache = makeCache<Offering[]>(10 * 60 * 1000)

/** Artwork comes back at 100px; the same URL serves any size. */
function artwork(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1')
}

export function mapTrack(r: any): Offering | null {
  if (!r?.trackId || !r.trackName || !r.previewUrl) return null
  const year = typeof r.releaseDate === 'string' ? r.releaseDate.slice(0, 4) : null
  return {
    medium: 'music',
    id: String(r.trackId),
    title: r.trackName,
    attribution: r.artistName ?? null,
    // A default framing, not an assertion: the player overwrites it, and the
    // composer makes the field visible so they know they can.
    framing: 'The whole track',
    perceptible: { kind: 'audio', url: r.previewUrl },
    sourceUrl: r.trackViewUrl ?? null,
    origin: 'catalogue',
    meta: {
      album: r.collectionName ?? null,
      year,
      // Spotify's track object carried no genre. This one does, and it gives an
      // interpreter something real to reason about — unlike the popularity and
      // duration numbers that used to be fed in, which are facts about a release
      // rather than things you can hear.
      genre: r.primaryGenreName ?? null,
      coverImage: artwork(r.artworkUrl100),
      explicit: r.trackExplicitness === 'explicit' ? 'yes' : null,
    },
  }
}

export async function searchMusic(q: string, limit = MUSIC_SEARCH_LIMIT): Promise<Offering[]> {
  const term = q.trim()
  if (!term) return []

  const key = `${term.toLowerCase()}|${limit}`
  const hit = cache.get(key)
  if (hit) return hit

  const url = `${SEARCH}?term=${encodeURIComponent(term)}&media=music&entity=song`
    + `&limit=${Math.max(1, Math.min(Math.trunc(limit) || MUSIC_SEARCH_LIMIT, 200))}`
  const data = await getJson(url)

  const offerings = (data?.results ?? [])
    .map(mapTrack)
    .filter((o: Offering | null): o is Offering => !!o)

  cache.set(key, offerings)
  return offerings
}

/**
 * One track by id.
 *
 * The turn route re-fetches the player's move server-side rather than trusting an
 * offering body from the client — a catalogued move has to be a real record, and
 * the server is what decides which one.
 */
export async function lookupMusic(id: string): Promise<Offering | null> {
  if (!/^\d+$/.test(id)) return null
  const data = await getJson(`${LOOKUP}?id=${encodeURIComponent(id)}&entity=song`)
  const first = (data?.results ?? [])[0]
  return first ? mapTrack(first) : null
}

/**
 * Turn an interpreter's song *query* into a real track.
 *
 * Tries the query as given, then a swapped "Title Artist" reading when it parses
 * as "Artist — Title", then the bare title. Interpreters write it either way
 * round and iTunes has no field filters, so both orderings are the same words;
 * the bare title goes last because it is loosest and most likely to match
 * something irrelevant.
 */
export async function resolveMusic(query: string, exclude: string[] = []): Promise<Offering | null> {
  const raw = query.trim()
  if (!raw) return null

  const attempts: string[] = [raw]
  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length === 2) {
    const [left, right] = dashSplit
    attempts.push(`${right} ${left}`, right)
  }

  const excluded = new Set(exclude)
  for (const attempt of attempts) {
    let results: Offering[]
    try {
      results = await searchMusic(attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const hit = results.find(o => !excluded.has(o.id))
    if (hit) return hit
  }
  return null
}
