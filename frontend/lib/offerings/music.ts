/**
 * Music offerings.
 *
 * Third provider for this section, and the reason is the same each time: a game
 * built on listening needs a 30-second preview, and preview audio is the first
 * thing a music API takes away.
 *
 *  - Spotify was abandoned because extended quota needs 250k monthly active users,
 *    and below that gate there is no `preview_url` at all.
 *  - iTunes replaced it and worked from a laptop, then answered **429 to every
 *    request from production**: `Rate limit has been exceeded for:
 *    itunes-apple-com|general|2a06:98c0:3600::103`. Apple keys its limit on the
 *    requesting IP; on Cloudflare that IP is a shared egress address pooled with
 *    every other Worker on the colo, so the budget is spent by strangers before we
 *    ask. Measured 6/6 failures via /api/offerings/diagnose. No header, no
 *    backoff and no cache fixes it, because our own call volume is not the cause.
 *  - Deezer answers 200 with 25 playable previews on every attempt from the same
 *    Worker, keyless, no OAuth.
 *
 * So Deezer is primary and iTunes is the fallback. iTunes is kept rather than
 * deleted because its rate limit is a shared pool rather than a permanent ban, and
 * a fallback that costs nothing while Deezer is healthy is worth having. In normal
 * operation it is never called.
 *
 * What Deezer does not give us: **genre**, and no release date in search results.
 * iTunes supplied a genre and the interpreter used it when judging whether two
 * records connect. Getting it from Deezer costs a second request per track
 * (`/album/{id}`), which is not worth it for one adjective — so genre is gone, and
 * `offeringLine` simply omits it. Year survives, because `/track/{id}` carries
 * `release_date` and the turn route already re-fetches every move by id.
 */

import type { Offering } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const DEEZER = 'https://api.deezer.com'
const ITUNES = 'https://itunes.apple.com'

const DEEZER_PROVIDER = 'Deezer'
const ITUNES_PROVIDER = 'The iTunes catalogue'

/** Deezer accepts far more; 25 is plenty to choose a move from. */
export const MUSIC_SEARCH_LIMIT = 25

const cache = makeCache<Offering[]>(10 * 60 * 1000)

/**
 * Offering ids carry their provider.
 *
 * Two catalogues both use bare integers, so an unprefixed id is ambiguous and
 * `lookupMusic` would not know which one to ask. A bare number is treated as
 * legacy iTunes, because that is what the rows written before this change contain.
 */
const DZ = 'dz:'
const IT = 'it:'

function splitId(id: string): { source: 'deezer' | 'itunes'; raw: string } | null {
  if (id.startsWith(DZ)) return { source: 'deezer', raw: id.slice(DZ.length) }
  if (id.startsWith(IT)) return { source: 'itunes', raw: id.slice(IT.length) }
  if (/^\d+$/.test(id)) return { source: 'itunes', raw: id }
  return null
}

// ---------------------------------------------------------------------------
// Deezer
// ---------------------------------------------------------------------------

function mapDeezer(r: any): Offering | null {
  // No preview means nothing to listen to, and a song you cannot hear is not an
  // offering in a game about hearing.
  if (!r?.id || !r.title || !r.preview) return null
  const year = typeof r.release_date === 'string' ? r.release_date.slice(0, 4) : null
  return {
    medium: 'music',
    id: `${DZ}${r.id}`,
    title: r.title,
    attribution: r.artist?.name ?? null,
    // A default framing, not an assertion: the player overwrites it, and the
    // composer makes the field visible so they know they can.
    framing: 'The whole track',
    perceptible: { kind: 'audio', url: r.preview },
    sourceUrl: r.link ?? null,
    origin: 'catalogue',
    meta: {
      album: r.album?.title ?? null,
      year,
      coverImage: r.album?.cover_medium ?? r.album?.cover ?? null,
      explicit: r.explicit_lyrics ? 'yes' : null,
    },
  }
}

async function searchDeezer(term: string, limit: number): Promise<Offering[]> {
  const url = `${DEEZER}/search?q=${encodeURIComponent(term)}&limit=${limit}`
  const data = await getJson(DEEZER_PROVIDER, url)
  // Deezer reports upstream problems in a 200 body rather than a status.
  if (data?.error && Object.keys(data.error).length > 0) {
    throw new OfferingError(
      `Deezer refused that search (${data.error.type ?? 'error'}).`, 502, DEEZER_PROVIDER, 200,
    )
  }
  return (data?.data ?? []).map(mapDeezer).filter((o: Offering | null): o is Offering => !!o)
}

// ---------------------------------------------------------------------------
// iTunes (fallback only)
// ---------------------------------------------------------------------------

/** Artwork comes back at 100px; the same URL serves any size. */
function itunesArtwork(url: string | undefined): string | null {
  if (!url) return null
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, '/600x600bb.$1')
}

function mapItunes(r: any): Offering | null {
  if (!r?.trackId || !r.trackName || !r.previewUrl) return null
  return {
    medium: 'music',
    id: `${IT}${r.trackId}`,
    title: r.trackName,
    attribution: r.artistName ?? null,
    framing: 'The whole track',
    perceptible: { kind: 'audio', url: r.previewUrl },
    sourceUrl: r.trackViewUrl ?? null,
    origin: 'catalogue',
    meta: {
      album: r.collectionName ?? null,
      year: typeof r.releaseDate === 'string' ? r.releaseDate.slice(0, 4) : null,
      genre: r.primaryGenreName ?? null,
      coverImage: itunesArtwork(r.artworkUrl100),
      explicit: r.trackExplicitness === 'explicit' ? 'yes' : null,
    },
  }
}

async function searchItunes(term: string, limit: number): Promise<Offering[]> {
  const url = `${ITUNES}/search?term=${encodeURIComponent(term)}&media=music&entity=song`
    + `&limit=${Math.max(1, Math.min(limit, 200))}`
  const data = await getJson(ITUNES_PROVIDER, url)
  return (data?.results ?? []).map(mapItunes).filter((o: Offering | null): o is Offering => !!o)
}

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export async function searchMusic(q: string, limit = MUSIC_SEARCH_LIMIT): Promise<Offering[]> {
  const term = q.trim()
  if (!term) return []

  const bounded = Math.max(1, Math.min(Math.trunc(limit) || MUSIC_SEARCH_LIMIT, 100))
  const key = `${term.toLowerCase()}|${bounded}`
  const hit = cache.get(key)
  if (hit) return hit

  let offerings: Offering[]
  try {
    offerings = await searchDeezer(term, bounded)
  } catch (primary) {
    // Fall back rather than fail. If iTunes is also refusing — which is its normal
    // state from here — surface the *primary* provider's error, because that is the
    // one worth acting on.
    try {
      offerings = await searchItunes(term, bounded)
    } catch {
      throw primary
    }
  }

  cache.set(key, offerings)
  return offerings
}

/**
 * One track by id.
 *
 * The turn route re-fetches the player's move server-side rather than trusting an
 * offering body from the client — a catalogued move has to be a real record, and
 * the server is what decides which one. It is also where the release year enters,
 * since Deezer omits it from search results but carries it here.
 */
export async function lookupMusic(id: string): Promise<Offering | null> {
  const parsed = splitId(id)
  if (!parsed) return null

  if (parsed.source === 'deezer') {
    const data = await getJson(DEEZER_PROVIDER, `${DEEZER}/track/${encodeURIComponent(parsed.raw)}`)
    if (data?.error && Object.keys(data.error).length > 0) return null
    return mapDeezer(data)
  }

  const data = await getJson(ITUNES_PROVIDER, `${ITUNES}/lookup?id=${encodeURIComponent(parsed.raw)}&entity=song`)
  const first = (data?.results ?? [])[0]
  return first ? mapItunes(first) : null
}

/**
 * Turn an interpreter's song *query* into a real track.
 *
 * Tries the query as given, then a swapped "Title Artist" reading when it parses as
 * "Artist — Title", then the bare title. Interpreters write it either way round and
 * neither catalogue has field filters, so both orderings are the same words; the
 * bare title goes last because it is loosest and most likely to match something
 * irrelevant.
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
      // A rate limit is worth propagating — the caller turns it into a visible
      // outage rather than a silent miss. Anything else: try the next reading.
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const found = results.find(o => !excluded.has(o.id))
    // Enrich with the release year, which search does not return. One extra call
    // per turn, on the one track that is about to be shown and described.
    if (found) {
      try {
        return (await lookupMusic(found.id)) ?? found
      } catch {
        return found
      }
    }
  }
  return null
}
