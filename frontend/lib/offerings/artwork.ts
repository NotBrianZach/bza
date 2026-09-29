/**
 * Artwork offerings — the Art Institute of Chicago collection.
 *
 * Chosen over the Met for one concrete reason: AIC's search returns the image id,
 * the artist, the date and the public-domain flag **in the search response**,
 * so a result list costs one request. The Met's search returns bare objectIDs and
 * every row then needs its own fetch, which turns a picker into an N+1 and burns a
 * shared rate limit to render one screen. Both are keyless; only one is usable as
 * the primary.
 *
 * The trap worth knowing about: the IIIF image host answers **403 to a request
 * with no User-Agent** and 200 with one. It looks exactly like a broken
 * integration or a hotlink block. `getJson` and `iiif()` both identify
 * themselves; do not strip that.
 */

import type { Offering } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const API = 'https://api.artic.edu/api/v1/artworks'
const IIIF = 'https://www.artic.edu/iiif/2'

export const ARTWORK_SEARCH_LIMIT = 24

/** Only the fields we render, so the response stays small. */
const FIELDS = [
  'id', 'title', 'artist_title', 'date_display', 'image_id',
  'is_public_domain', 'medium_display', 'place_of_origin', 'artwork_type_title',
].join(',')

const cache = makeCache<Offering[]>(30 * 60 * 1000)

/** IIIF image URL at a given pixel width. 843 is AIC's own default full-view size. */
export function iiif(imageId: string, width = 843): string {
  return `${IIIF}/${imageId}/full/${width},/0/default.jpg`
}

function mapArtwork(r: any): Offering | null {
  // No image means nothing to perceive, and an artwork you cannot look at is not
  // an offering in a game about looking.
  if (!r?.id || !r.title || !r.image_id) return null
  return {
    medium: 'artwork',
    id: String(r.id),
    title: r.title,
    attribution: r.artist_title ?? null,
    framing: 'The whole picture',
    perceptible: {
      kind: 'image',
      url: iiif(r.image_id, 843),
      alt: [r.title, r.artist_title, r.date_display].filter(Boolean).join(', '),
    },
    sourceUrl: `https://www.artic.edu/artworks/${r.id}`,
    origin: 'catalogue',
    meta: {
      date: r.date_display ?? null,
      medium: r.medium_display ?? null,
      origin: r.place_of_origin ?? null,
      type: r.artwork_type_title ?? null,
      thumb: iiif(r.image_id, 200),
      publicDomain: r.is_public_domain ? 'yes' : null,
    },
  }
}

export async function searchArtwork(q: string, limit = ARTWORK_SEARCH_LIMIT): Promise<Offering[]> {
  const term = q.trim()
  if (!term) return []

  const key = `${term.toLowerCase()}|${limit}`
  const hit = cache.get(key)
  if (hit) return hit

  // Over-fetch, because the `image_id`-less rows are dropped and a screen of
  // results should not come back half empty.
  const url = `${API}/search?q=${encodeURIComponent(term)}`
    + `&limit=${Math.max(1, Math.min(Math.trunc(limit) * 2 || 48, 100))}`
    + `&fields=${FIELDS}`
  const data = await getJson(url)

  const offerings = (data?.data ?? [])
    .map(mapArtwork)
    .filter((o: Offering | null): o is Offering => !!o)
    .slice(0, limit)

  cache.set(key, offerings)
  return offerings
}

export async function lookupArtwork(id: string): Promise<Offering | null> {
  if (!/^\d+$/.test(id)) return null
  const data = await getJson(`${API}/${encodeURIComponent(id)}?fields=${FIELDS}`)
  return data?.data ? mapArtwork(data.data) : null
}

/**
 * Turn an interpreter's artwork query into a real work.
 *
 * Interpreters name art as "Artist — Title", the same convention they use for
 * songs, so the same three attempts apply: as given, swapped, and the bare title.
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
  for (const attempt of attempts) {
    let results: Offering[]
    try {
      results = await searchArtwork(attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const hit = results.find(o => !excluded.has(o.id))
    if (hit) return hit
  }
  return null
}
