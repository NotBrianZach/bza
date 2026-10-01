/**
 * Artwork offerings — the Cleveland Museum of Art open-access collection.
 *
 * Third artwork provider in two days, and the reason is the same one that keeps
 * biting this section: an API being reachable is not the same as its *images*
 * being viewable.
 *
 *  - The Met was rejected first because its search returns bare objectIDs, so
 *    rendering one screen of results costs one request per row.
 *  - The Art Institute replaced it — one search call carrying image ids and
 *    metadata, which was the right trade on paper. But its IIIF image host sits
 *    behind Cloudflare Bot Management and challenges a hotlinked <img>: a player
 *    saw empty frames until they opened the URL directly and passed an
 *    "am I a robot" check, which set a clearance cookie. A proxy cannot fix it
 *    either — the Worker is refused by that host too, with or without a
 *    User-Agent (measured via /api/offerings/diagnose).
 *  - Cleveland has AIC's one-call shape *and* a CDN that answers 200 to a plain
 *    request with no User-Agent at all. Everything is CC0.
 *
 * The lesson encoded here: when adding an image-bearing provider, probe the image
 * host, not just the API. The API was never the problem.
 */

import type { Offering } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const API = 'https://openaccess-api.clevelandart.org/api/artworks'

const PROVIDER = 'The Cleveland Museum of Art'

export const ARTWORK_SEARCH_LIMIT = 24

/** Only the fields we render, so the response stays small. */
const FIELDS = [
  'id', 'title', 'creators', 'creation_date', 'images', 'url',
  'type', 'technique', 'culture', 'share_license_status',
].join(',')

const cache = makeCache<Offering[]>(30 * 60 * 1000)

/** "Frederic Edwin Church (American, 1826–1900)" → "Frederic Edwin Church". */
function artistName(creators: any[]): string | null {
  const raw = creators?.[0]?.description
  if (typeof raw !== 'string' || !raw.trim()) return null
  return raw.replace(/\s*\([^)]*\)\s*$/, '').trim() || null
}

function mapArtwork(r: any): Offering | null {
  const web = r?.images?.web?.url
  // No image means nothing to perceive, and an artwork you cannot look at is not
  // an offering in a game about looking.
  if (!r?.id || !r.title || !web) return null

  const artist = artistName(r.creators)
  const culture = Array.isArray(r.culture) ? r.culture[0] : r.culture

  return {
    medium: 'artwork',
    id: String(r.id),
    title: r.title,
    attribution: artist,
    framing: 'The whole picture',
    perceptible: {
      kind: 'image',
      url: web,
      alt: [r.title, artist, r.creation_date].filter(Boolean).join(', '),
    },
    sourceUrl: r.url ?? null,
    origin: 'catalogue',
    meta: {
      date: r.creation_date ?? null,
      medium: r.technique ?? r.type ?? null,
      origin: culture ?? null,
      type: r.type ?? null,
      // Same URL at a smaller size would be nicer, but this CDN serves fixed
      // renditions rather than parameterised ones, so the thumbnail is the
      // print rendition only when web is missing — which mapTrack already excludes.
      thumb: web,
      license: r.share_license_status ?? null,
    },
  }
}

export async function searchArtwork(q: string, limit = ARTWORK_SEARCH_LIMIT): Promise<Offering[]> {
  const term = q.trim()
  if (!term) return []

  const bounded = Math.max(1, Math.min(Math.trunc(limit) || ARTWORK_SEARCH_LIMIT, 100))
  const key = `${term.toLowerCase()}|${bounded}`
  const hit = cache.get(key)
  if (hit) return hit

  // has_image filters server-side, so unlike the previous provider there is no
  // need to over-fetch and discard imageless rows.
  const url = `${API}?q=${encodeURIComponent(term)}&limit=${bounded}&has_image=1&fields=${FIELDS}`
  const data = await getJson(PROVIDER, url)

  const offerings = (data?.data ?? [])
    .map(mapArtwork)
    .filter((o: Offering | null): o is Offering => !!o)

  cache.set(key, offerings)
  return offerings
}

export async function lookupArtwork(id: string): Promise<Offering | null> {
  if (!/^\d+$/.test(id)) return null
  const data = await getJson(PROVIDER, `${API}/${encodeURIComponent(id)}?fields=${FIELDS}`)
  return data?.data ? mapArtwork(data.data) : null
}

/**
 * Turn an interpreter's artwork query into a real work.
 *
 * Interpreters name art as "Artist — Title", the same convention they use for
 * songs, so the same three attempts apply: as given, swapped, and the bare title.
 * The bare title goes last because it is loosest.
 */
export async function resolveArtwork(query: string, exclude: string[] = []): Promise<Offering | null> {
  const raw = query.trim()
  if (!raw) return null

  const attempts: string[] = [raw]
  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length === 2) {
    const [left, right] = dashSplit
    attempts.push(`${right} ${left}`, right)
  }

  const excluded = new Set(exclude)
  for (const attempt of [...new Set(attempts)]) {
    let results: Offering[]
    try {
      results = await searchArtwork(attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const found = results.find(o => !excluded.has(o.id))
    if (found) return found
  }
  return null
}
