/**
 * Scene offerings — film and television, via TMDB.
 *
 * The awkward medium, and the awkwardness is conceptual rather than technical: a
 * *scene* is not a catalogue entry. TMDB knows about titles; the moment inside one
 * is not a record anywhere. So this resolves the title and leans on framing to do
 * the rest — the offering is "this film, and this moment in it, named in words".
 * That is why `framing` is a required field on every Offering rather than a nicety:
 * for this medium it carries most of the content.
 *
 * The only medium in the build that needs a credential. Absent TMDB_API_KEY the
 * medium is hidden by `availableMedia()` rather than offered and then failing at
 * the first search, so nothing here has to handle a missing key beyond refusing.
 */

import type { Offering } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const API = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

const PROVIDER = 'TMDB'

export const SCENE_SEARCH_LIMIT = 20

const cache = makeCache<Offering[]>(30 * 60 * 1000)

export function sceneMediumAvailable(): boolean {
  return !!process.env.TMDB_API_KEY
}

function key(): string {
  const k = process.env.TMDB_API_KEY
  if (!k) throw new OfferingError('Film and TV are not enabled on this deployment.', 501, PROVIDER)
  return k
}

function mapResult(r: any): Offering | null {
  // TMDB's multi-search mixes in people, who are not offerings.
  const kind = r?.media_type === 'tv' ? 'tv' : r?.media_type === 'movie' ? 'movie' : null
  const title = r?.title ?? r?.name
  if (!kind || !r?.id || !title) return null

  const date: string | null = r.release_date ?? r.first_air_date ?? null
  const year = date ? date.slice(0, 4) : null

  return {
    medium: 'scene',
    id: `${kind}:${r.id}`,
    title,
    attribution: null,
    // Unlike every other medium, the default framing is a prompt rather than a
    // description — because there is nothing here to describe until someone does.
    framing: '',
    perceptible: r.poster_path
      ? { kind: 'image', url: `${IMG}/w500${r.poster_path}`, alt: `${title}${year ? ` (${year})` : ''}` }
      : { kind: 'none' },
    sourceUrl: `https://www.themoviedb.org/${kind}/${r.id}`,
    origin: 'catalogue',
    meta: {
      kind: kind === 'tv' ? 'series' : 'film',
      year,
      overview: typeof r.overview === 'string' ? r.overview.slice(0, 400) : null,
      thumb: r.poster_path ? `${IMG}/w200${r.poster_path}` : null,
    },
  }
}

export async function searchScenes(q: string, limit = SCENE_SEARCH_LIMIT): Promise<Offering[]> {
  const term = q.trim()
  if (!term) return []

  const cacheKey = `${term.toLowerCase()}|${limit}`
  const hit = cache.get(cacheKey)
  if (hit) return hit

  const url = `${API}/search/multi?api_key=${encodeURIComponent(key())}`
    + `&query=${encodeURIComponent(term)}&include_adult=false`
  const data = await getJson(PROVIDER, url)

  const offerings = (data?.results ?? [])
    .map(mapResult)
    .filter((o: Offering | null): o is Offering => !!o)
    .slice(0, limit)

  cache.set(cacheKey, offerings)
  return offerings
}

export async function lookupScene(id: string): Promise<Offering | null> {
  const m = /^(movie|tv):(\d+)$/.exec(id)
  if (!m) return null
  const [, kind, tmdbId] = m
  const data = await getJson(PROVIDER, `${API}/${kind}/${tmdbId}?api_key=${encodeURIComponent(key())}`)
  return mapResult({ ...data, media_type: kind })
}

export async function resolveScene(query: string, exclude: string[] = []): Promise<Offering | null> {
  const raw = query.trim()
  if (!raw) return null
  // Strip a trailing year, which interpreters add and TMDB's title match dislikes.
  const attempts = [raw, raw.replace(/\s*\(?\b(19|20)\d{2}\b\)?\s*$/, '').trim()].filter(Boolean)

  const excluded = new Set(exclude)
  for (const attempt of [...new Set(attempts)]) {
    let results: Offering[]
    try {
      results = await searchScenes(attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const found = results.find(o => !excluded.has(o.id))
    if (found) return found
  }
  return null
}
