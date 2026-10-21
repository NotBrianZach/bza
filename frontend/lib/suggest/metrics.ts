/**
 * Is the feed working? Six separate answers, and deliberately no seventh.
 *
 * The spec's §6 closes with the warning this module is built around: "A single
 * 'engagement' number can make a feed more clickable while making it less
 * useful." So `Measurements` has no total, no composite, and no score. It is a
 * record with six independent fields, and a caller who wants one number has to
 * write the weighting down themselves — at which point they own it.
 *
 * Two smaller honesty rules, both of which have a test:
 *
 *  - **A rate with no ratings is `null`, not 0.** Zero reads as "nothing was
 *    worth seeing"; null reads as "nobody said". The difference matters most in
 *    exactly the case it arises — the first fortnight, when a 0% relevance rate
 *    would look like a broken feed.
 *  - **Back-filled items do not count as discovery.** A slot that was filled
 *    from the leftover pool because no discovery candidate existed was never
 *    discovery, and counting it would let a digest containing no discovery
 *    content report a discovery hit rate. `discoveryItemsCounted` is returned
 *    alongside the rate so the denominator is visible.
 */

import type { Bucket, Feedback } from './types'

/** One item as it was actually shown. The record a measurement reads. */
export interface ShownItem {
  itemId: string
  bucket: Bucket
  feedId: string
  topicTags: string[]
  clusterId: string
  /**
   * Whether this item arrived by back-fill rather than by qualifying.
   *
   * Written at selection time by `selectDigest`. Without it, §6's
   * discovery-hit-rate is computed over whatever happened to land in the
   * discovery slots, which on a thin week is ordinary core material.
   */
  backfilled: boolean
}

export interface MeasureInput {
  shown: ShownItem[]
  feedback: Feedback[]
  /** Cluster ids shown in the preceding window, for the duplicate rate. */
  previousClusterIds: string[]
  /** Topics the user said they want covered, for the coverage-gap list. */
  desiredTopics: string[]
}

export interface Measurements {
  /** Share of rated items marked 'worth seeing' or 'more like this'. */
  relevanceRate: number | null
  /** How many items had any explicit rating. The denominator, stated. */
  ratedCount: number

  /** Share of *qualified* discovery items rated positively. */
  discoveryHitRate: number | null
  /** Qualified (non-back-filled) discovery items shown. The honest denominator. */
  discoveryItemsCounted: number

  /** Items per topic tag, descending. Diversity is read off this, not summarised. */
  topicDistribution: { topic: string; count: number }[]
  /** Share held by the single largest source. */
  sourceConcentration: number
  /** Share of items whose story cluster was already shown in the prior window. */
  duplicateRate: number

  /** Items per bucket, so a drifting mix is visible. */
  bucketDistribution: { bucket: Bucket; count: number; backfilled: number }[]

  /** Desired topics with no item in this digest. */
  coverageGaps: string[]

  /**
   * Items flagged 'interesting_not_useful'.
   *
   * Reported separately and NOT folded into the relevance rate, because it is
   * neither a hit nor a miss. A rising count here means the finding is good and
   * the timing or the format is wrong — which is a different fix from a falling
   * relevance rate, and averaging the two together hides both.
   */
  interestingNotUsefulCount: number
}

const POSITIVE = new Set(['worth_seeing', 'more_like_this'])
const DISCOVERY: Bucket[] = ['adjacent', 'outside']

/**
 * Compute the six measurements over one window.
 *
 * Pure, and takes the window's contents rather than a date range, so the
 * same function serves the two-weekly review, an ad-hoc "how did last week go",
 * and the tests. Deciding what falls inside a window is the store's job.
 */
export function measure(input: MeasureInput): Measurements {
  const { shown, feedback, previousClusterIds, desiredTopics } = input

  const byItem = new Map<string, Feedback[]>()
  for (const f of feedback) {
    const list = byItem.get(f.itemId) ?? []
    list.push(f)
    byItem.set(f.itemId, list)
  }

  // ── relevance rate ──────────────────────────────────────────────────────
  // 'already_saw' is excluded from the denominator: it is a complaint about
  // duplication, so counting it as a miss would blame the topic for the
  // clustering's failure.
  const ratable = shown.filter(s => {
    const fs = byItem.get(s.itemId) ?? []
    return fs.some(f => f.kind !== 'already_saw')
  })
  const positive = ratable.filter(s =>
    (byItem.get(s.itemId) ?? []).some(f => POSITIVE.has(f.kind)))
  const relevanceRate = ratable.length > 0 ? positive.length / ratable.length : null

  // ── discovery hit rate ──────────────────────────────────────────────────
  const discoveryShown = shown.filter(s => DISCOVERY.includes(s.bucket) && !s.backfilled)
  const discoveryRated = discoveryShown.filter(s => (byItem.get(s.itemId) ?? []).length > 0)
  const discoveryHits = discoveryRated.filter(s =>
    (byItem.get(s.itemId) ?? []).some(f => POSITIVE.has(f.kind) || f.kind === 'interesting_not_useful'))
  const discoveryHitRate = discoveryRated.length > 0
    ? discoveryHits.length / discoveryRated.length
    : null

  // ── topic distribution ──────────────────────────────────────────────────
  const topicCount = new Map<string, number>()
  for (const s of shown) {
    for (const t of new Set(s.topicTags)) topicCount.set(t, (topicCount.get(t) ?? 0) + 1)
  }
  const topicDistribution = [...topicCount.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => (b.count === a.count ? a.topic.localeCompare(b.topic) : b.count - a.count))

  // ── source concentration ────────────────────────────────────────────────
  const sourceCount = new Map<string, number>()
  for (const s of shown) sourceCount.set(s.feedId, (sourceCount.get(s.feedId) ?? 0) + 1)
  const largest = Math.max(0, ...sourceCount.values())
  const sourceConcentration = shown.length > 0 ? largest / shown.length : 0

  // ── duplicate rate ──────────────────────────────────────────────────────
  const prior = new Set(previousClusterIds)
  const repeats = shown.filter(s => prior.has(s.clusterId)).length
  const duplicateRate = shown.length > 0 ? repeats / shown.length : 0

  // ── bucket distribution ─────────────────────────────────────────────────
  const buckets: Bucket[] = ['core', 'adjacent', 'outside', 'context', 'local']
  const bucketDistribution = buckets.map(bucket => ({
    bucket,
    count: shown.filter(s => s.bucket === bucket).length,
    backfilled: shown.filter(s => s.bucket === bucket && s.backfilled).length,
  }))

  // ── coverage gaps ───────────────────────────────────────────────────────
  // Substring matching in both directions, because a desired topic of "energy"
  // is served by a tag of "energy storage" and vice versa. Crude, and crude in
  // the forgiving direction: a false "covered" is quieter than a false gap that
  // sends the user hunting for feeds they already have.
  const allTags = new Set(shown.flatMap(s => s.topicTags.map(t => t.toLowerCase())));
  const coverageGaps = desiredTopics.filter(want => {
    const w = want.toLowerCase().trim()
    if (!w) return false
    for (const tag of allTags) if (tag.includes(w) || w.includes(tag)) return false
    return true
  })

  const interestingNotUsefulCount = feedback.filter(f => f.kind === 'interesting_not_useful').length

  return {
    relevanceRate,
    ratedCount: ratable.length,
    discoveryHitRate,
    discoveryItemsCounted: discoveryShown.length,
    topicDistribution,
    sourceConcentration,
    duplicateRate,
    bucketDistribution,
    coverageGaps,
    interestingNotUsefulCount,
  }
}

/**
 * The measurements as prose, for the dashboard and for the librarian.
 *
 * Returns one line per measurement, each stating its denominator. A rate without
 * its denominator is the standard way a dashboard misleads: "100% relevance"
 * over two rated items and over two hundred are different claims, and only one
 * of them is a claim at all.
 *
 * A null rate becomes "nobody rated anything yet" rather than being skipped,
 * because an absent line reads as a missing feature and this is a missing
 * *observation*.
 */
export function describe(m: Measurements): string[] {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`
  const lines: string[] = []

  lines.push(m.relevanceRate === null
    ? `Relevance rate: nobody has rated an item yet.`
    : `Relevance rate: ${pct(m.relevanceRate)} of ${m.ratedCount} rated item${m.ratedCount === 1 ? '' : 's'} were worth seeing.`)

  lines.push(m.discoveryHitRate === null
    ? `Discovery hit rate: none of the ${m.discoveryItemsCounted} discovery item${m.discoveryItemsCounted === 1 ? '' : 's'} has been rated.`
    : `Discovery hit rate: ${pct(m.discoveryHitRate)}, over ${m.discoveryItemsCounted} genuine discovery item${m.discoveryItemsCounted === 1 ? '' : 's'} (back-filled slots excluded).`)

  const topTopics = m.topicDistribution.slice(0, 5)
  lines.push(topTopics.length === 0
    ? 'Topic diversity: no tags on any item.'
    : `Topic diversity: ${m.topicDistribution.length} distinct topics; commonest ${topTopics.map(t => `${t.topic} (${t.count})`).join(', ')}.`)

  lines.push(`Source concentration: the largest source holds ${pct(m.sourceConcentration)} of the feed.`)
  lines.push(`Duplicate rate: ${pct(m.duplicateRate)} of items were from a story already shown in the previous window.`)

  const backfilled = m.bucketDistribution.reduce((n, b) => n + b.backfilled, 0)
  lines.push(`Mix: ${m.bucketDistribution.map(b => `${b.bucket} ${b.count}`).join(', ')}` +
    (backfilled > 0 ? ` — ${backfilled} slot${backfilled === 1 ? '' : 's'} back-filled because no candidate qualified.` : '.'))

  if (m.coverageGaps.length > 0) {
    lines.push(`Coverage gaps: nothing for ${m.coverageGaps.join(', ')} — no enabled feed reached ${m.coverageGaps.length === 1 ? 'it' : 'them'}.`)
  }
  if (m.interestingNotUsefulCount > 0) {
    lines.push(`${m.interestingNotUsefulCount} item${m.interestingNotUsefulCount === 1 ? ' was' : 's were'} marked interesting but not useful — good finds, wrong moment or wrong format.`)
  }

  return lines
}
