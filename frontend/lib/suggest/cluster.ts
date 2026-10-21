/**
 * Collapsing the same article, and grouping the same story.
 *
 * These are two different jobs and this file keeps them apart, because
 * conflating them is how a feed either shows you one piece four times or hides
 * three different reports behind one.
 *
 *  - **Exact duplicate**: the same document. Same canonical URL, or the same
 *    content hash. One row survives; the others are *recorded as duplicates*,
 *    not discarded, so "this came from four of your feeds" stays answerable.
 *  - **Story cluster**: different documents about the same event. They stay as
 *    separate items with a shared `storyClusterId`, because the selector's job
 *    is to pick at most one per cluster — and for a major contested story, to
 *    pick a second one when it adds something.
 *
 * The similarity used for clustering is a weighted sum of three weak signals
 * (headline tokens, publication time, entity overlap) with a fourth optional one
 * (embedding cosine). None of them is trustworthy alone, which is the entire
 * reason for combining them:
 *
 *   - Headline overlap alone merges "Fed holds rates" with "ECB holds rates".
 *   - Time proximity alone merges everything published on a Tuesday.
 *   - Entity overlap alone merges every article naming the same country.
 *
 * Clustering is single-link via union-find. That choice has a real cost and it
 * is taken knowingly: single-link chains, so A~B and B~C puts A and C in one
 * cluster even when A and C are unalike. For a one-week window of news that is
 * usually right — a developing story genuinely is a chain — and the alternatives
 * (complete-link, or centroid) need a distance matrix and a threshold that is
 * harder to explain than the one here. `clusterDiameter` is returned so a caller
 * can see when a chain has gone long, which is the symptom to watch for.
 */

import type { FeedItem } from './types'
import { containment, contentTokens, jaccard } from './tags'

// ---------------------------------------------------------------------------
// Exact duplicates
// ---------------------------------------------------------------------------

export interface DedupResult<T> {
  /** One survivor per distinct document, input order preserved. */
  unique: T[]
  /** Which items were folded into which survivor, and on what basis. */
  duplicates: { keptItemId: string; droppedItemId: string; basis: 'canonical_url' | 'content_hash' }[]
}

/**
 * Collapse items that are the same document.
 *
 * The survivor is the FIRST one seen, and the caller controls that order. Rows
 * are loaded oldest-published-first by the store, so the survivor is the
 * earliest publication of a piece — which is the one whose `publishedAt` is
 * right. Keeping the last would make every syndicated wire story look as fresh
 * as the most recent feed to pick it up.
 *
 * Content-hash matching is checked second, after URL. A URL match is a stronger
 * claim (it is the same address) and should be the recorded basis when both hold.
 */
export function dedupeExact<T extends { itemId: string; canonicalUrl: string; contentHash: string }>(
  items: T[],
): DedupResult<T> {
  const byUrl = new Map<string, T>()
  const byHash = new Map<string, T>()
  const unique: T[] = []
  const duplicates: DedupResult<T>['duplicates'] = []

  for (const item of items) {
    const urlKey = item.canonicalUrl
    const hit = (urlKey && byUrl.get(urlKey)) || byHash.get(item.contentHash)
    if (hit) {
      duplicates.push({
        keptItemId: hit.itemId,
        droppedItemId: item.itemId,
        basis: urlKey && byUrl.has(urlKey) ? 'canonical_url' : 'content_hash',
      })
      continue
    }
    if (urlKey) byUrl.set(urlKey, item)
    byHash.set(item.contentHash, item)
    unique.push(item)
  }

  return { unique, duplicates }
}

// ---------------------------------------------------------------------------
// Similarity
// ---------------------------------------------------------------------------

export interface SimilarityWeights {
  headline: number
  time: number
  entity: number
  /** Only consulted when BOTH items carry an embedding. */
  embedding: number
}

/**
 * Headline carries the most weight because it is the only field written to
 * describe the item. Time is a *gate* more than a signal — see `timeAffinity`.
 */
export const DEFAULT_SIMILARITY: SimilarityWeights = {
  headline: 0.5,
  time: 0.15,
  entity: 0.35,
  embedding: 0.0,
}

/** With embeddings available, they take over most of the headline's weight. */
export const EMBEDDING_SIMILARITY: SimilarityWeights = {
  headline: 0.2,
  time: 0.1,
  entity: 0.2,
  embedding: 0.5,
}

/**
 * 1 at simultaneous publication, decaying to 0 over 72 hours.
 *
 * Linear rather than exponential, and this is the honest shape for what it
 * measures: two reports of the same event are not "exponentially less likely" to
 * be the same story 30 hours apart — they are simply, steadily less likely as
 * the window widens, until past three days they are a follow-up rather than a
 * duplicate.
 *
 * An item with no date gets 0.5: unknown, not distant. Returning 0 would make
 * undated items uncluster-able, and feeds that omit dates are common enough
 * that this would quietly exempt whole publications from dedup.
 */
export function timeAffinity(a: string | null, b: string | null, windowHours = 72): number {
  if (!a || !b) return 0.5
  // Unsigned, so the order of the arguments cannot change the answer —
  // `hoursBetween` clamps negatives to 0 and would make this asymmetric.
  const hours = Math.abs(Date.parse(a) - Date.parse(b)) / 3_600_000
  if (!Number.isFinite(hours)) return 0.5
  return Math.max(0, 1 - hours / windowHours)
}

export function cosine(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  // Clamped: floating error can push an identical pair to 1.0000000000000002,
  // and a similarity above 1 silently breaks every "1 - similarity" penalty
  // downstream.
  return Math.min(1, Math.max(-1, dot / Math.sqrt(na * nb)))
}

export interface SimilarityDetail {
  score: number
  headline: number
  time: number
  entity: number
  embedding: number | null
  /** Human-readable, for the "why was this treated as the same story" answer. */
  reason: string
}

/**
 * How alike two items are, 0..1, with the components kept.
 *
 * Entity overlap uses containment rather than Jaccard. An item mentioning three
 * entities and one mentioning fifteen can be about the same event, and Jaccard
 * reads that asymmetry as dissimilarity — which systematically refuses to
 * cluster a wire brief with the long piece covering the same thing, the single
 * most common duplicate pair there is.
 */
export function similarity(
  a: FeedItem, b: FeedItem, weights: SimilarityWeights = DEFAULT_SIMILARITY,
): SimilarityDetail {
  const ta = new Set(contentTokens(a.title))
  const tb = new Set(contentTokens(b.title))
  const headline = jaccard(ta, tb)

  const time = timeAffinity(a.publishedAt, b.publishedAt)

  const ea = new Set(a.entities.map(e => e.value))
  const eb = new Set(b.entities.map(e => e.value))
  const [small, large] = ea.size <= eb.size ? [ea, eb] : [eb, ea]
  const entity = containment(small, large)

  const canEmbed = !!a.embedding && !!b.embedding && weights.embedding > 0
  const embedding = canEmbed ? cosine(a.embedding!, b.embedding!) : null

  // The embedding weight is redistributed to the other three when it cannot be
  // used, rather than left to drag the total down. A pair of items without
  // embeddings would otherwise max out at 1 - weights.embedding, so with
  // EMBEDDING_SIMILARITY every such pair would be capped at 0.5 and nothing
  // would ever cluster — a config change silently disabling dedup.
  const usable = canEmbed
    ? weights
    : (() => {
        const rest = weights.headline + weights.time + weights.entity
        const k = rest > 0 ? 1 / rest : 0
        return { headline: weights.headline * k, time: weights.time * k, entity: weights.entity * k, embedding: 0 }
      })()

  const score =
    usable.headline * headline +
    usable.time * time +
    usable.entity * entity +
    usable.embedding * (embedding ?? 0)

  const bits = [
    `headline ${headline.toFixed(2)}`,
    `time ${time.toFixed(2)}`,
    `entities ${entity.toFixed(2)}`,
  ]
  if (embedding !== null) bits.push(`embedding ${embedding.toFixed(2)}`)
  else bits.push('no embeddings — weight redistributed')

  return { score, headline, time, entity, embedding, reason: bits.join(', ') }
}

// ---------------------------------------------------------------------------
// Story clusters
// ---------------------------------------------------------------------------

export interface StoryCluster {
  clusterId: string
  itemIds: string[]
  /** The least similar pair inside the cluster. Low values mean a long chain. */
  diameter: number
  /** How the cluster formed, pair by pair. Truncated at 12 to stay loggable. */
  links: { a: string; b: string; score: number; reason: string }[]
}

export interface ClusterResult {
  clusters: StoryCluster[]
  /** itemId → clusterId, including singletons. */
  assignment: Map<string, string>
}

/**
 * Group items into story clusters by single-link agglomeration.
 *
 * O(n²) in the number of items, which is the right complexity to choose here: a
 * weekly poll of a personal feed list is hundreds of items, not millions, and
 * every approximation that beats n² (LSH, blocking by entity) trades recall for
 * speed in exactly the case that matters — the pair that shares no entity and no
 * headline token but is the same story.
 *
 * `threshold` defaults to 0.62. Not a tuned number; it is the value at which the
 * fixtures in tests/suggest-logic.mjs separate "same event, different outlet"
 * from "same topic, different event", and it is a parameter so it can be moved
 * when a real corpus says otherwise. Raising it splits stories; lowering it
 * merges a topic into one cluster and the feed then shows one item per topic.
 */
export function clusterStories(
  items: FeedItem[],
  opts: { threshold?: number; weights?: SimilarityWeights } = {},
): ClusterResult {
  const threshold = opts.threshold ?? 0.62
  const weights = opts.weights ?? DEFAULT_SIMILARITY

  const parent = new Map<string, string>()
  const find = (x: string): string => {
    let r = x
    while (parent.get(r) !== r) r = parent.get(r)!
    // Path compression, so a long developing-story chain does not make every
    // later lookup walk it.
    let cur = x
    while (parent.get(cur) !== r) {
      const next = parent.get(cur)!
      parent.set(cur, r)
      cur = next
    }
    return r
  }
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const it of items) parent.set(it.itemId, it.itemId)

  const links: { a: string; b: string; score: number; reason: string }[] = []
  const pairScore = new Map<string, number>()
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const detail = similarity(items[i], items[j], weights)
      pairScore.set(key(items[i].itemId, items[j].itemId), detail.score)
      if (detail.score >= threshold) {
        union(items[i].itemId, items[j].itemId)
        links.push({ a: items[i].itemId, b: items[j].itemId, score: detail.score, reason: detail.reason })
      }
    }
  }

  const groups = new Map<string, string[]>()
  for (const it of items) {
    const root = find(it.itemId)
    const list = groups.get(root) ?? []
    list.push(it.itemId)
    groups.set(root, list)
  }

  const clusters: StoryCluster[] = []
  const assignment = new Map<string, string>()
  for (const [root, itemIds] of groups) {
    // The id is the root item's id, not a counter: it is stable across runs for
    // the same inputs, so a cluster id stored on a row last week still means
    // something this week. A counter would renumber everything on every poll.
    const clusterId = `sc_${root}`
    let diameter = 1
    for (let i = 0; i < itemIds.length; i++) {
      for (let j = i + 1; j < itemIds.length; j++) {
        diameter = Math.min(diameter, pairScore.get(key(itemIds[i], itemIds[j])) ?? 0)
      }
    }
    clusters.push({
      clusterId,
      itemIds,
      diameter: itemIds.length > 1 ? diameter : 1,
      links: links.filter(l => itemIds.includes(l.a) && itemIds.includes(l.b)).slice(0, 12),
    })
    for (const id of itemIds) assignment.set(id, clusterId)
  }

  return { clusters, assignment }
}

/**
 * Whether a second item from an already-represented cluster earns a slot.
 *
 * The spec allows this "for major contested stories … when it adds distinct
 * evidence, reporting, or analysis", and the test implemented here is the
 * nearest honest proxy for that sentence without a model: the second item must
 * come from a different source, be a different article type, and not be a wire
 * copy. Each condition rules out one way of adding nothing — the same outlet
 * following up, a second news brief on the same facts, and syndication.
 *
 * `contested` is the caller's gate on cluster size: one report is a story, five
 * independent reports is a story people are arguing about. It is passed in
 * rather than computed here because only the selector knows the cluster.
 */
export function addsDistinctContribution(
  incumbent: FeedItem, candidate: FeedItem,
  opts: { incumbentSourceType: string; candidateSourceType: string; contested: boolean },
): { ok: boolean; reason: string } {
  if (!opts.contested) {
    return { ok: false, reason: 'only one item is taken per story unless the story is widely covered' }
  }
  if (incumbent.feedId === candidate.feedId) {
    return { ok: false, reason: 'same feed as the item already selected from this story' }
  }
  if (opts.candidateSourceType === 'wire') {
    return { ok: false, reason: 'wire copy — syndication, not a second account' }
  }
  if (candidate.articleType.value === incumbent.articleType.value) {
    return {
      ok: false,
      reason: `same article type (${candidate.articleType.value}) as the item already selected`,
    }
  }
  return {
    ok: true,
    reason: `adds a ${candidate.articleType.value} to a story already represented by a ${incumbent.articleType.value}, from a different source`,
  }
}
