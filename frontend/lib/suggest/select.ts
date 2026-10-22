/**
 * Filling a digest: buckets, greedy choice, diversity penalties, honest gaps.
 *
 * The spec's first instruction about this step is a prohibition — "Don't simply
 * sort all items by `base`" — and the reason is worth restating because every
 * shortcut in this file would be a step back toward it. A pure sort by score
 * does not fail by picking bad items. It fails by picking *twenty variations of
 * the same good item*: the same three topics, the same two publishers, the same
 * story from four angles, because whatever made the top item score well made its
 * neighbours score well too. The buckets and the three penalties exist to make
 * the twenty-first-best item beat the second-best one when the second-best adds
 * nothing.
 *
 * ── Bucket assignment is the interesting part ──────────────────────────────
 *
 * An item usually qualifies for several buckets. Assigning it to the one with
 * the largest *shortfall* — rather than the first that fits, or its "best" one —
 * is what keeps the mix intact when the candidate pool is lopsided. A week where
 * everything is core-relevant would otherwise burn the adjacent and context
 * slots on items that were also core, and the digest would quietly become a
 * ranked list again while appearing to have buckets.
 *
 * ── Why the loop re-scores every round ────────────────────────────────────
 *
 * The three penalties depend on what has already been selected, so they change
 * after every pick. Computing them once and sorting is O(n log n) and wrong: it
 * would penalise the second item from a source before any item from that source
 * had been chosen. The O(slots × n) loop here is the price of penalties that
 * mean what they say, and with slots ≈ 20 it is nothing.
 */

import type {
  Bucket, BucketPlan, Digest, DigestGap, ScoreWeights, ScoredItem, SelectedItem,
} from './types'
import { DEFAULT_BUCKET_PLAN } from './types'
import { CONTEXT_TYPES, contentTokens, jaccard } from './tags'
import { addsDistinctContribution } from './cluster'
import { DEFAULT_WEIGHTS } from './score'

/** The penalty coefficients from the spec's §4 pseudocode. */
export interface SelectionPenalties {
  repeat: number
  source: number
  topic: number
}

export const DEFAULT_PENALTIES: SelectionPenalties = {
  repeat: 0.20,
  source: 0.10,
  topic: 0.10,
}

/**
 * Thresholds that decide which buckets an item qualifies for.
 *
 * These are the one place where the five buckets become operational, so they are
 * gathered here rather than scattered through the predicate. Every one of them
 * is a parameter: the right value depends on how many interests the user has
 * defined and how broadly, and a fixed constant would make the discovery buckets
 * unfillable for a user with two interests and unavoidable for one with forty.
 */
export interface BucketThresholds {
  /** Relevance at or above this is an established interest. */
  coreRelevance: number
  /** Bridge at or above this connects known to unfamiliar. */
  adjacentBridge: number
  /** Relevance at or BELOW this is outside the map… */
  outsideRelevance: number
  /** …and novelty must be at least this, or it is merely irrelevant. */
  outsideNovelty: number
  /** Local fit at or above this serves the regional slot. */
  localFit: number
}

export const DEFAULT_THRESHOLDS: BucketThresholds = {
  coreRelevance: 0.45,
  adjacentBridge: 0.30,
  outsideRelevance: 0.20,
  outsideNovelty: 0.60,
  localFit: 0.50,
}

/**
 * Every bucket this item could legitimately fill.
 *
 * 'outside' requires low relevance AND high novelty, and the conjunction is what
 * stops the bucket from becoming a dumping ground. Low relevance alone describes
 * most of the internet; what the bucket is for is material the user has not been
 * shown lately and that their interest list does not reach — which is a
 * different and much smaller set.
 *
 * 'context' is defined by article type, not by subject, so it can overlap 'core'
 * freely: an explainer on your main interest is both, and which slot it takes
 * depends on which is shorter when it is picked.
 */
export function qualifyingBuckets(
  s: ScoredItem, t: BucketThresholds = DEFAULT_THRESHOLDS,
): Bucket[] {
  const out: Bucket[] = []
  if (s.parts.relevance >= t.coreRelevance) out.push('core')
  if (s.parts.bridge >= t.adjacentBridge) out.push('adjacent')
  if (s.parts.relevance <= t.outsideRelevance && s.parts.novelty >= t.outsideNovelty) out.push('outside')
  if (CONTEXT_TYPES.has(s.item.articleType.value)) out.push('context')
  if (s.parts.localFit >= t.localFit) out.push('local')
  return out
}

/** Why an item qualified for nothing. Used to explain a thin digest. */
export function whyNoBucket(s: ScoredItem, t: BucketThresholds = DEFAULT_THRESHOLDS): string {
  return [
    `relevance ${s.parts.relevance.toFixed(2)} (core needs ${t.coreRelevance})`,
    `bridge ${s.parts.bridge.toFixed(2)} (adjacent needs ${t.adjacentBridge})`,
    `novelty ${s.parts.novelty.toFixed(2)} (outside needs ≤${t.outsideRelevance} relevance and ≥${t.outsideNovelty} novelty)`,
    `type ${s.item.articleType.value} (context needs an explainer, investigation, data piece, analysis or research)`,
    `local fit ${s.parts.localFit.toFixed(2)} (local needs ${t.localFit})`,
  ].join('; ')
}

// ---------------------------------------------------------------------------
// Penalties
// ---------------------------------------------------------------------------

interface SelectionState {
  chosen: SelectedItem[]
  /** Token set per chosen item, for the repeat penalty. Computed once each. */
  chosenTokens: Set<string>[]
  sourceCount: Map<string, number>
  topicCount: Map<string, number>
  /** clusterId → the item already taken from it. */
  clusterIncumbent: Map<string, ScoredItem>
  /** clusterId → how many distinct items the candidate pool has for it. */
  clusterSize: Map<string, number>
  remainingBySlot: Map<Bucket, number>
  totalSlots: number
}

/**
 * The maximum similarity between the candidate and anything already chosen.
 *
 * Max, not mean, and this is the same reasoning as novelty's: an item that is
 * 90% the same as one chosen item and unlike the other nineteen has a low mean
 * and is still a repeat. What the penalty is defending against is the specific
 * pair, not the average of the set.
 */
function repeatPenalty(mine: Set<string>, state: SelectionState): number {
  if (state.chosenTokens.length === 0) return 0
  let worst = 0
  for (const prev of state.chosenTokens) worst = Math.max(worst, jaccard(mine, prev))
  return worst
}

/**
 * Token set per candidate, built once for the whole selection.
 *
 * The greedy loop re-penalises every remaining candidate on every round, so
 * tokenizing inside `repeatPenalty` meant each candidate's title was tokenized
 * once per slot — twenty times over a twenty-item digest, and for a seven
 * hundred item window that is fourteen thousand tokenizations to do the work of
 * seven hundred.
 *
 * Smaller than the clustering version of the same mistake, which is what
 * actually exhausted the Worker, but the same mistake.
 */
function tokenSets(candidates: ScoredItem[]): Map<string, Set<string>> {
  return new Map(candidates.map(s => [
    s.item.itemId,
    new Set([...contentTokens(s.item.title), ...s.item.topicTags.map(t => t.value)]),
  ]))
}

/**
 * The share of the digest this item's source already holds.
 *
 * Measured against `totalSlots` — the size of the finished digest — rather than
 * against the count chosen so far. Against the running count the first pick
 * would always carry a 100% share and the second from any source would be
 * crushed; against the final size the penalty grows smoothly as a source
 * accumulates, which is the behaviour the cap is there to produce.
 */
function sourcePenalty(s: ScoredItem, state: SelectionState): number {
  const n = state.sourceCount.get(s.feed.feedId) ?? 0
  return state.totalSlots > 0 ? n / state.totalSlots : 0
}

function topicPenalty(s: ScoredItem, state: SelectionState): number {
  const tags = s.item.topicTags.map(t => t.value)
  if (tags.length === 0) return 0
  let worst = 0
  for (const tag of tags) {
    const n = state.topicCount.get(tag) ?? 0
    worst = Math.max(worst, state.totalSlots > 0 ? n / state.totalSlots : 0)
  }
  return worst
}

// ---------------------------------------------------------------------------
// Caps
// ---------------------------------------------------------------------------

/**
 * Roughly 10% of a full feed per source, as the spec asks, with its exception.
 *
 * The exception matters more than the rule in practice: a user with three
 * enabled feeds cannot have a 20-item digest at 2 items per source, and a cap
 * that produced a 6-item digest while reporting no gap would be lying about why.
 * So the cap is raised to whatever ceil(slots / feeds) demands, and the fact
 * that it was raised is returned so it can be said out loud.
 */
export function sourceCap(totalSlots: number, enabledFeeds: number): { cap: number; relaxed: boolean } {
  const tenth = Math.max(1, Math.ceil(totalSlots * 0.10))
  const needed = enabledFeeds > 0 ? Math.ceil(totalSlots / enabledFeeds) : totalSlots
  return needed > tenth ? { cap: needed, relaxed: true } : { cap: tenth, relaxed: false }
}

/** A story covered by this many distinct feeds counts as widely covered. */
export const CONTESTED_CLUSTER_SIZE = 3

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface SelectOptions {
  plan?: BucketPlan[]
  thresholds?: BucketThresholds
  penalties?: SelectionPenalties
  weights?: ScoreWeights
  /** How many distinct feeds are enabled, for the source cap's exception. */
  enabledFeeds?: number
}

interface Rejection {
  itemId: string
  reason: string
}

/**
 * The reason that blocked the most candidates, with a count.
 *
 * The most frequent rather than the first, because the first is whichever
 * candidate happened to be iterated first and says nothing about the shape of
 * the shortfall. "12 candidates: same story as …" tells you the clustering is
 * doing the work; "1 candidate: source capped" tells you it is not.
 */
function commonestReason(reasons: (string | undefined)[]): string | null {
  const counts = new Map<string, number>()
  for (const r of reasons) {
    if (!r) continue
    counts.set(r, (counts.get(r) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  const [reason, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return n === 1 ? `nothing left that qualified — ${reason}` : `nothing left that qualified — ${n} candidates blocked, commonest: ${reason}`
}

/**
 * Build a digest from scored candidates.
 *
 * The loop fills the shortest bucket first, which is what makes bucket
 * assignment responsive to scarcity rather than to arrival order. Within a
 * round, every eligible candidate is re-penalised against the current state and
 * the best one that fits *some* open bucket is taken.
 *
 * Returns gaps for every bucket it could not fill, with the reason distinguished
 * — "no candidate qualified" is a different problem from "candidates qualified
 * but all were capped out by their source", and the first is fixed by adding
 * feeds while the second is fixed by enabling more of them.
 */
export function selectDigest(
  scored: ScoredItem[],
  clusters: Map<string, string>,
  opts: SelectOptions = {},
): Digest {
  const plan = opts.plan ?? DEFAULT_BUCKET_PLAN
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS
  const penalties = opts.penalties ?? DEFAULT_PENALTIES
  const weights = opts.weights ?? DEFAULT_WEIGHTS
  const totalSlots = plan.reduce((n, b) => n + b.slots, 0)

  const feedIds = new Set(scored.map(s => s.feed.feedId))
  const { cap, relaxed } = sourceCap(totalSlots, opts.enabledFeeds ?? feedIds.size)

  const rejected: Rejection[] = []
  const eligible: ScoredItem[] = []
  for (const s of scored) {
    if (!s.eligible) {
      rejected.push({ itemId: s.item.itemId, reason: s.ineligibleReason ?? 'did not clear the quality floor' })
      continue
    }
    if (qualifyingBuckets(s, thresholds).length === 0) {
      rejected.push({ itemId: s.item.itemId, reason: `fits no bucket — ${whyNoBucket(s, thresholds)}` })
      continue
    }
    eligible.push(s)
  }

  const clusterSize = new Map<string, number>()
  for (const s of scored) {
    const cid = clusters.get(s.item.itemId) ?? s.item.storyClusterId ?? s.item.itemId
    clusterSize.set(cid, (clusterSize.get(cid) ?? 0) + 1)
  }

  const state: SelectionState = {
    chosen: [],
    chosenTokens: [],
    sourceCount: new Map(),
    topicCount: new Map(),
    clusterIncumbent: new Map(),
    clusterSize,
    remainingBySlot: new Map(plan.map(b => [b.bucket, b.slots])),
    totalSlots,
  }

  // Why a candidate was passed over on the LAST round it was considered. Only
  // the final reason is kept, because the earlier ones were about a state that
  // no longer exists and reporting them would be noise.
  const lastBlock = new Map<string, string>()
  // Built once, outside the greedy loop. See `tokenSets`.
  const tokens = tokenSets(eligible)
  const remaining = new Set(eligible.map(s => s.item.itemId))
  const byId = new Map(eligible.map(s => [s.item.itemId, s]))

  const openBuckets = () => plan
    .map(b => b.bucket)
    .filter(b => (state.remainingBySlot.get(b) ?? 0) > 0)

  /** The bucket with the largest shortfall among those this item qualifies for. */
  const assignTo = (quals: Bucket[]): Bucket | null => {
    const open = quals.filter(b => (state.remainingBySlot.get(b) ?? 0) > 0)
    if (open.length === 0) return null
    return open.reduce((best, b) =>
      (state.remainingBySlot.get(b) ?? 0) > (state.remainingBySlot.get(best) ?? 0) ? b : best)
  }

  while (openBuckets().length > 0 && remaining.size > 0) {
    let best: { s: ScoredItem; bucket: Bucket; score: number; p: SelectionPenalties } | null = null

    for (const id of remaining) {
      const s = byId.get(id)!
      const quals = qualifyingBuckets(s, thresholds)
      const bucket = assignTo(quals)
      if (!bucket) {
        lastBlock.set(id, `qualified for ${quals.join('/') || 'nothing'}, but those slots are full`)
        continue
      }

      if ((state.sourceCount.get(s.feed.feedId) ?? 0) >= cap) {
        lastBlock.set(id, `${s.feed.name} already holds its cap of ${cap} item${cap === 1 ? '' : 's'}`)
        continue
      }

      const cid = clusters.get(id) ?? s.item.storyClusterId ?? id
      const incumbent = state.clusterIncumbent.get(cid)
      if (incumbent) {
        const verdict = addsDistinctContribution(incumbent.item, s.item, {
          incumbentSourceType: incumbent.feed.sourceType,
          candidateSourceType: s.feed.sourceType,
          contested: (state.clusterSize.get(cid) ?? 1) >= CONTESTED_CLUSTER_SIZE,
        })
        if (!verdict.ok) {
          lastBlock.set(id, `same story as "${incumbent.item.title}" — ${verdict.reason}`)
          continue
        }
      }

      const p = {
        repeat: repeatPenalty(tokens.get(id) ?? new Set(), state),
        source: sourcePenalty(s, state),
        topic: topicPenalty(s, state),
      }
      const score =
        s.base -
        penalties.repeat * p.repeat -
        penalties.source * p.source -
        penalties.topic * p.topic

      if (!best || score > best.score) best = { s, bucket, score, p }
    }

    if (!best) break

    const { s, bucket, score, p } = best
    state.chosen.push({
      scored: s,
      bucket,
      selectionScore: score,
      penalties: p,
      alsoQualifiedFor: qualifyingBuckets(s, thresholds).filter(b => b !== bucket),
      backfilled: false,
    })
    // The same precomputed set, not a fresh one — identical contents, and
    // rebuilding it here would re-tokenize once per chosen item for no gain.
    state.chosenTokens.push(tokens.get(s.item.itemId) ?? new Set())
    state.sourceCount.set(s.feed.feedId, (state.sourceCount.get(s.feed.feedId) ?? 0) + 1)
    for (const tag of s.item.topicTags.map(t => t.value)) {
      state.topicCount.set(tag, (state.topicCount.get(tag) ?? 0) + 1)
    }
    const cid = clusters.get(s.item.itemId) ?? s.item.storyClusterId ?? s.item.itemId
    if (!state.clusterIncumbent.has(cid)) state.clusterIncumbent.set(cid, s)
    state.remainingBySlot.set(bucket, (state.remainingBySlot.get(bucket) ?? 1) - 1)
    remaining.delete(s.item.itemId)
    lastBlock.delete(s.item.itemId)
  }

  // ── Back-fill ────────────────────────────────────────────────────────────
  //
  // The spec: "If a bucket has too few eligible items, fill from the remaining
  // candidates and label the gap." Both halves are done, and the label is the
  // part that is easy to skip — a back-filled item is marked with the bucket it
  // was *standing in for*, and `gaps` records how many of the bucket's slots
  // were filled that way. Without that, a digest of twenty with four
  // back-filled items is indistinguishable from one that genuinely had four
  // discovery items, and the discovery-hit-rate measurement in §6 would be
  // computed over items that were never discovery at all.
  const gaps: DigestGap[] = []
  for (const b of plan) {
    const left = state.remainingBySlot.get(b.bucket) ?? 0
    if (left === 0) continue

    const pool = [...remaining]
      .map(id => byId.get(id)!)
      .filter(s => (state.sourceCount.get(s.feed.feedId) ?? 0) < cap)
      .filter(s => {
        const cid = clusters.get(s.item.itemId) ?? s.item.storyClusterId ?? s.item.itemId
        return !state.clusterIncumbent.has(cid)
      })
      .sort((a, z) => z.base - a.base)

    const take = pool.slice(0, left)
    for (const s of take) {
      state.chosen.push({
        scored: s,
        bucket: b.bucket,
        selectionScore: s.base,
        penalties: { repeat: 0, source: 0, topic: 0 },
        alsoQualifiedFor: qualifyingBuckets(s, thresholds),
        // The flag that keeps the discovery hit rate honest. An item standing
        // in for a bucket it did not qualify for is not an instance of that
        // bucket, and every measurement downstream has to be able to tell.
        backfilled: true,
      })
      state.sourceCount.set(s.feed.feedId, (state.sourceCount.get(s.feed.feedId) ?? 0) + 1)
      const cid = clusters.get(s.item.itemId) ?? s.item.storyClusterId ?? s.item.itemId
      state.clusterIncumbent.set(cid, s)
      remaining.delete(s.item.itemId)
    }

    gaps.push({
      bucket: b.bucket,
      wanted: b.slots,
      filled: b.slots - left + take.length,
      reason: take.length === left
        // `left`, not `b.slots`. The bucket may have been mostly filled by
        // qualifying candidates and short by two — and the old wording, "no
        // candidate qualified for core", was then flatly false on a bucket
        // reporting filled 8 of 8. Caught on a live run.
        ? `${left} of ${b.slots} ${b.bucket} slot${left === 1 ? '' : 's'} had no qualifying candidate and ${left === 1 ? 'was' : 'were'} back-filled from the highest-scoring remaining items`
        : eligible.length === 0
          ? 'no candidate cleared the quality floor and fitted a bucket'
          : commonestReason([...remaining].map(id => lastBlock.get(id)))
            ?? `only ${eligible.length} eligible candidate${eligible.length === 1 ? '' : 's'} in total, and none fitted ${b.bucket}`,
      backfilled: take.length,
    })
  }

  const notes: string[] = []
  if (relaxed) {
    const feeds = opts.enabledFeeds ?? feedIds.size
    notes.push(
      `the one-source-in-ten cap was raised to ${cap} because only ${feeds} feed${feeds === 1 ? ' is' : 's are'} enabled — enable more to restore it`,
    )
  }
  if (state.chosen.length < totalSlots) {
    notes.push(
      `${state.chosen.length} of ${totalSlots} slots filled from ${eligible.length} eligible candidate${eligible.length === 1 ? '' : 's'}`,
    )
  }

  return { items: state.chosen, gaps, rejected, notes, weights, plan }
}
