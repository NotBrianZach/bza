/**
 * Knowledge offerings — a theorem, a phenomenon, a creature, a place.
 *
 * WHY THESE ARE CATALOGUED AND NOT COMPOSED, which is the whole design of this
 * file. A theorem is a *proposition*, and that makes it the first medium here whose
 * content can be confidently wrong rather than merely bad. The composed guard does
 * not transfer: performability catches vague mush, and a false claim about
 * mathematics is not mush — it is specific, fluent and incorrect. An interpreter
 * asked to author "the statement of Noether's theorem" would sometimes author
 * something that is not Noether's theorem, which is the invented-track failure in a
 * new costume.
 *
 * So the guard is the one `passage` already uses, and it is strict: **the
 * interpreter never writes the content, only names the search.** The server
 * fetches the record and quotes its text verbatim. A query that matches nothing is
 * a miss, exactly like a song that does not exist, and nothing is asserted into
 * being. No new class of honesty guard was needed — only the discipline of not
 * reaching for the wrong existing one.
 *
 * Four media, one resolver, because they differ by *scope* rather than by
 * mechanism. Each scope is a search hint plus a pattern that decides whether a page
 * belongs in it. The pattern is curation, not honesty: a page it rejects is still a
 * real page, it is just not a theorem, and saying "no theorem matched" is better
 * than handing a geometry game an article about a cat.
 *
 * Wikipedia is the provider because it is keyless, enormous, and returns extract,
 * thumbnail and categories in a single call — so one search costs one request, the
 * trade this section has already learned to care about (see artwork.ts).
 */

import type { MediumId, Offering, Perceptible } from '@/lib/correlate/types'
import { OfferingError, getJson, makeCache } from './shared'

const API = 'https://en.wikipedia.org/w/api.php'

const PROVIDER = 'Wikipedia'

/**
 * Wikimedia asks every client to identify itself and answers unidentified
 * datacenter traffic inconsistently.
 *
 * This is the exception shared.ts warns about rather than a contradiction of it:
 * the lesson there was that a *crawler-shaped* UA gets refused by an edge WAF
 * (Apple's), and Wikimedia's own policy asks for precisely this format. A provider
 * that wants a header asks for one per call, which is why that is possible.
 */
const HEADERS = {
  'User-Agent': 'AIReadAlong/1.0 (https://aireadalong.com) correlation-games',
}

export const KNOWLEDGE_SEARCH_LIMIT = 12

/**
 * Extracts are intros, and an intro can run for paragraphs. Long enough to carry a
 * statement, short enough that eight of them in a prompt is not the prompt.
 */
const MAX_EXTRACT = 600

interface Scope {
  /** Appended to a query that carries no signal of its own, to bias relevance. */
  hint: string
  /**
   * What makes a page part of this medium, matched against its categories, its
   * title and its extract. Generous on purpose: the cost of a strict pattern is a
   * medium that feels broken, and the cost of a loose one is a bad result the
   * player can see and search past.
   */
  pattern: RegExp
  /** The default framing. A player's own framing still overrides it. */
  framing: string
}

const SCOPES: Record<string, Scope> = {
  theorem: {
    hint: 'mathematics theorem',
    pattern: /theorem|lemma|corollar|conjectur|identit|inequalit|axiom|paradox|mathemat|algebra|geometr|topolog|number theory|calculus|probabilit|set theory|proof/i,
    framing: 'The statement itself',
  },
  phenomenon: {
    hint: 'science',
    pattern: /physic|chemistr|chemical|biolog|astronom|astrophys|cosmolog|geolog|meteorolog|thermodynam|quantum|optic|acoustic|electromagnet|evolution|neuroscien|scientific|phenomen|ecolog|particle|relativity|fluid|wave/i,
    framing: 'What happens, and under what conditions',
  },
  organism: {
    hint: 'species',
    pattern: /species|genus|taxa|taxonom|animals|plants|birds|insects|fish|fungi|mammals|reptiles|amphibians|molluscs|arthropod|flora|fauna|organism|bacteria|orchid|beetle|moth|spider/i,
    framing: 'The creature, or the one behaviour that matters',
  },
  place: {
    hint: 'geography',
    pattern: /geograph|cities|towns|villages|mountain|river|lake|island|desert|forest|valley|canyon|national park|landform|populated places|regions|coast|glacier|volcan|ruins|archaeolog/i,
    framing: 'The place as it is, or one feature of it',
  },
}

export const KNOWLEDGE_MEDIA = Object.keys(SCOPES) as MediumId[]

export function isKnowledge(medium: string): boolean {
  return medium in SCOPES
}

const cache = makeCache<Offering[]>(30 * 60 * 1000)

/** Exported for the tests: scope is the part worth asserting, and it is pure. */
export function inScope(
  medium: string,
  page: { title?: string; extract?: string; categories?: { title?: string }[] },
): boolean {
  const scope = SCOPES[medium]
  if (!scope) return false
  const haystack = [
    page.title ?? '',
    page.extract ?? '',
    ...(page.categories ?? []).map(c => c.title ?? ''),
  ].join(' \n ')
  return scope.pattern.test(haystack)
}

/** Cut at a sentence boundary when there is one nearby, so a quote does not stop mid-clause. */
export function trimExtract(raw: string, max = MAX_EXTRACT): string {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  const window = text.slice(0, max)
  const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '))
  // Only honour a sentence break in the last third; otherwise it throws away more
  // than it tidies.
  if (lastStop > max * 0.6) return window.slice(0, lastStop + 1)
  return `${window.replace(/\s+\S*$/, '')}…`
}

function mapPage(medium: MediumId, page: any): Offering | null {
  const extract = typeof page?.extract === 'string' ? trimExtract(page.extract) : ''
  // No text is nothing to read, and a proposition you cannot read is not an
  // offering in a game about connecting things you can perceive.
  if (!page?.pageid || !page.title || !extract) return null

  const thumb = typeof page?.thumbnail?.source === 'string' ? page.thumbnail.source : null

  // Text, not image, even when a thumbnail exists: for every one of these media the
  // words are the content and the picture is decoration. The thumbnail rides along
  // in meta, which is where OfferingCard already looks for one.
  const perceptible: Perceptible = { kind: 'text', body: extract }

  return {
    medium,
    id: `wiki:${medium}:${page.pageid}`,
    title: page.title,
    // Nobody is the author of a theorem in the sense a song has an artist, and
    // naming Wikipedia here would put the encyclopedia in the slot where the
    // interpreter looks for a maker.
    attribution: null,
    framing: SCOPES[medium].framing,
    perceptible,
    sourceUrl: `https://en.wikipedia.org/?curid=${page.pageid}`,
    origin: 'catalogue',
    meta: {
      kind: KIND_LABEL[medium] ?? null,
      thumb,
    },
  }
}

/** What `context` on the card and `offeringLine` in the prompt show for these. */
const KIND_LABEL: Record<string, string> = {
  theorem: 'mathematics',
  phenomenon: 'science',
  organism: 'living thing',
  place: 'place',
}

/**
 * Bias the query toward the scope, but only when it does not already say so.
 *
 * "Noether's theorem" needs no help; "symmetry" does, and without it a theorem
 * search for a bare noun returns the disambiguation page for the noun.
 */
function scopedQuery(medium: string, term: string): string {
  const scope = SCOPES[medium]
  if (!scope) return term
  return scope.pattern.test(term) ? term : `${term} ${scope.hint}`
}

export async function searchKnowledge(
  medium: MediumId,
  q: string,
  limit = KNOWLEDGE_SEARCH_LIMIT,
): Promise<Offering[]> {
  const term = q.trim()
  if (!term || !SCOPES[medium]) return []

  // `exlimit=max` caps extracts at 20 pages per call, so the search limit cannot
  // exceed that without silently dropping text from the tail.
  const bounded = Math.max(1, Math.min(Math.trunc(limit) || KNOWLEDGE_SEARCH_LIMIT, 20))
  const key = `${medium}|${term.toLowerCase()}|${bounded}`
  const hit = cache.get(key)
  if (hit) return hit

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: scopedQuery(medium, term),
    gsrlimit: String(bounded),
    gsrnamespace: '0',
    prop: 'extracts|pageimages|categories',
    exintro: '1',
    explaintext: '1',
    exlimit: 'max',
    piprop: 'thumbnail',
    pithumbsize: '320',
    cllimit: 'max',
    clshow: '!hidden',
    redirects: '1',
  })

  const data = await getJson(PROVIDER, `${API}?${params}`, HEADERS)

  // A generator returns pages keyed by id, not in relevance order; `index` is the
  // search rank and is the only thing that restores it.
  const pages: any[] = Array.isArray(data?.query?.pages) ? data.query.pages : []
  const offerings = pages
    .slice()
    .sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0))
    .filter(p => inScope(medium, p))
    .map(p => mapPage(medium, p))
    .filter((o: Offering | null): o is Offering => !!o)

  cache.set(key, offerings)
  return offerings
}

/**
 * Re-fetch one record by id.
 *
 * Scope is deliberately NOT re-applied here. The honesty property is that the
 * record is real, and it is; scope decided what to *offer*, and re-litigating it on
 * lookup would let a category edit on Wikipedia invalidate a move a player already
 * chose from a list this server gave them.
 */
export async function lookupKnowledge(medium: MediumId, id: string): Promise<Offering | null> {
  const match = /^wiki:([a-z]+):(\d+)$/.exec(id)
  if (!match || match[1] !== medium || !SCOPES[medium]) return null

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    pageids: match[2],
    prop: 'extracts|pageimages|categories',
    exintro: '1',
    explaintext: '1',
    piprop: 'thumbnail',
    pithumbsize: '320',
    cllimit: 'max',
    clshow: '!hidden',
  })

  const data = await getJson(PROVIDER, `${API}?${params}`, HEADERS)
  const page = Array.isArray(data?.query?.pages) ? data.query.pages[0] : null
  return page ? mapPage(medium, page) : null
}

/**
 * Turn an interpreter's query into a real record.
 *
 * Two attempts rather than artwork's three, because there is no "Artist — Title"
 * convention to unpick here: a theorem is named, not attributed. What the second
 * attempt handles is an interpreter that wrote a name plus a gloss — "Noether's
 * theorem — conservation from symmetry" — where the part before the dash is the
 * searchable half.
 */
export async function resolveKnowledge(
  medium: MediumId,
  query: string,
  exclude: string[] = [],
): Promise<Offering | null> {
  const raw = query.trim()
  if (!raw || !SCOPES[medium]) return null

  const attempts = [raw]
  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length >= 2 && dashSplit[0].trim()) attempts.push(dashSplit[0].trim())

  const excluded = new Set(exclude)
  for (const attempt of [...new Set(attempts)]) {
    let results: Offering[]
    try {
      results = await searchKnowledge(medium, attempt, 10)
    } catch (e) {
      if (e instanceof OfferingError && e.status === 429) throw e
      continue
    }
    const found = results.find(o => !excluded.has(o.id))
    if (found) return found
  }
  return null
}
