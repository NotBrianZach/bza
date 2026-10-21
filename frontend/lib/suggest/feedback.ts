/**
 * Learning from feedback without narrowing the feed to a point.
 *
 * Every rule here is a brake. The easy version of this file — move the weight
 * up when they like it, down when they don't — converges fast and converges
 * wrong: it ends at whatever the user clicked most in the first fortnight and
 * has no mechanism for ever leaving. The spec's §5 is a list of brakes, and this
 * is them:
 *
 *  1. **Explicit beats implicit, by a lot.** A click is `WEAK_STEP`; a stated
 *     preference is `EXPLICIT_STEP`, an order of magnitude larger. A click can
 *     mean curiosity, confusion, or a mis-tap, and dwell time measures article
 *     length as much as interest.
 *  2. **"Interesting, but not useful" never lowers a weight.** It is the control
 *     that exists so a busy week does not teach the system to stop finding good
 *     things, and treating it as mild dislike would destroy the only signal that
 *     distinguishes "wrong thing" from "wrong moment".
 *  3. **"Already saw this" moves nothing.** It is a statement about duplication,
 *     not about the topic. Scoring it as dislike would punish an interest for
 *     the clustering's failure to collapse a story.
 *  4. **Weights decay toward their prior, not toward zero.** Decay is there to
 *     let a weight that moved on weak evidence drift back, which is the opposite
 *     of forgetting everything slowly.
 *  5. **A weight the user typed is never decayed.** It is a statement, and
 *     quietly undoing it is the single most annoying thing a learning system
 *     can do.
 *  6. **The discovery buckets have a floor.** Unfamiliar items get fewer clicks
 *     than familiar ones *by construction* — that is what unfamiliar means — so
 *     a system that allocates slots by click-through eliminates discovery within
 *     a month. The floor is not a tuning parameter; removing it changes what the
 *     product is.
 */

import type { Bucket, BucketPlan, FeedbackKind, Interest } from './types'

/** How far one explicit judgement moves a matched interest's weight. */
export const EXPLICIT_STEP = 0.08
/** How far one click or dwell event moves it. Deliberately an order down. */
export const WEAK_STEP = 0.006
/** Fraction of the distance back to the prior that one week's decay covers. */
export const WEEKLY_DECAY = 0.15
/** A learned weight never leaves this band, so nothing becomes unreachable. */
export const WEIGHT_FLOOR = 0.05
export const WEIGHT_CEILING = 1.0
/** The prior a learned weight decays toward, absent anything the user stated. */
export const PRIOR_WEIGHT = 0.5

const clamp = (x: number) => Math.min(WEIGHT_CEILING, Math.max(WEIGHT_FLOOR, x))

/**
 * The direction each control pushes, as a multiple of one step.
 *
 * `interesting_not_useful` is `0` and not a small negative. `already_saw` is `0`
 * for a different reason — it is about the item's novelty, not its topic — and
 * the two zeros are deliberately not merged into one `if` so that changing one
 * does not silently change the other.
 */
const DIRECTION: Record<FeedbackKind, number> = {
  more_like_this: +1,
  worth_seeing: +0.5,
  less_like_this: -1,
  /** Good find, wrong moment. Never negative. See rule 2. */
  interesting_not_useful: 0,
  /** A duplicate complaint, not a topic complaint. See rule 3. */
  already_saw: 0,
}

export interface FeedbackEvent {
  /** Interest NAMES that the scored item matched. From `ScoredItem.matchedInterests`. */
  matchedInterests: string[]
  kind: FeedbackKind
  shownAsBucket: Bucket
}

/**
 * Apply one explicit judgement.
 *
 * Returns a new list; nothing is mutated, so a caller can diff before and after
 * and show the user what their click did — which is the only way a learning
 * system stays arguable.
 *
 * The move is divided across the matched interests rather than applied to each
 * in full. An item matching six interests is weak evidence about any one of
 * them, and applying a full step to all six would let a single click on a
 * broad article reshape half the interest list.
 *
 * `explicitFeedback` is set on anything this touches, which exempts it from
 * decay. That is the right reading of the flag: the weight now reflects
 * something the user said, even though they said it by pressing a button rather
 * than typing a number.
 */
export function applyFeedback(interests: Interest[], event: FeedbackEvent): Interest[] {
  const dir = DIRECTION[event.kind] ?? 0
  if (dir === 0) return interests.map(i => ({ ...i }))

  const matched = new Set(event.matchedInterests)
  const share = matched.size > 0 ? 1 / Math.sqrt(matched.size) : 0

  return interests.map(i => {
    if (!matched.has(i.name)) return { ...i }
    return {
      ...i,
      weight: clamp(i.weight + dir * EXPLICIT_STEP * share),
      explicitFeedback: true,
    }
  })
}

export interface WeakEvent {
  matchedInterests: string[]
  kind: 'opened' | 'dwell_ms'
  value: number
}

/**
 * Apply a click or a dwell reading.
 *
 * Always positive and always tiny. There is no negative weak signal here, and
 * that absence is the design: "did not click" is not evidence of dislike. It is
 * evidence that the item was below the fold, or that the week was busy, or that
 * the headline was poor. Inferring dislike from non-engagement is how a feed
 * narrows without anybody ever telling it to.
 *
 * Dwell is bucketed rather than used linearly — under 15 seconds counts for
 * nothing, and past two minutes counts no more than two minutes — because the
 * raw number is dominated by article length.
 */
export function applyWeakSignal(interests: Interest[], event: WeakEvent): Interest[] {
  let magnitude = 0
  if (event.kind === 'opened') magnitude = 1
  else if (event.kind === 'dwell_ms') {
    if (event.value < 15_000) magnitude = 0
    else magnitude = Math.min(1, event.value / 120_000)
  }
  if (magnitude === 0) return interests.map(i => ({ ...i }))

  const matched = new Set(event.matchedInterests)
  const share = matched.size > 0 ? 1 / Math.sqrt(matched.size) : 0

  return interests.map(i => {
    if (!matched.has(i.name)) return { ...i }
    return {
      // NOT setting explicitFeedback: a click is not a statement, so the nudge
      // it produced stays subject to decay. This is what keeps weak signals
      // from accumulating permanently.
      ...i,
      weight: clamp(i.weight + WEAK_STEP * magnitude * share),
    }
  })
}

/**
 * Shrink learned weights toward the prior.
 *
 * `fraction` is how much of the distance to close — `WEEKLY_DECAY` for a weekly
 * run, or a larger value in a test. Interests the user set by hand are returned
 * untouched.
 *
 * Toward `PRIOR_WEIGHT`, not toward zero, and from both directions: a weight
 * that drifted to 0.9 on thin evidence comes back down, and one that drifted to
 * 0.1 comes back up. Decay that only ever reduced would be a slow deletion of
 * the interest list.
 */
export function decayWeights(interests: Interest[], fraction = WEEKLY_DECAY): Interest[] {
  return interests.map(i => {
    if (i.explicitFeedback) return { ...i }
    return { ...i, weight: clamp(i.weight + (PRIOR_WEIGHT - i.weight) * fraction) }
  })
}

/**
 * The decay fraction for a given elapsed time.
 *
 * REQUIRED as soon as decay runs on a page visit rather than on a timer, which
 * is the only sane trigger for an app nobody schedules. A per-invocation
 * `WEEKLY_DECAY` makes the decay rate a function of how often somebody opens
 * the site: a daily visitor would decay seven times a week and a weekly
 * visitor once, so two people with identical feedback would end up with
 * different weights for no reason but their browsing habits.
 *
 * Compounding, not linear. One week at 0.15 closes 15% of the distance to the
 * prior; two weeks closes `1 - 0.85²` ≈ 28%, not 30%, because the second week
 * acts on what the first week left. Linear would overshoot and, past about
 * six weeks, would cross the prior and start pushing the weight out the other
 * side — which is not decay at all.
 *
 * Clamped to one year. A weight untouched for five years should land on the
 * prior, not be driven to a number that depends on floating-point behaviour at
 * extreme exponents.
 */
export function decayFractionForElapsed(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0
  const WEEK_MS = 7 * 86_400_000
  const weeks = Math.min(52, ms / WEEK_MS)
  return 1 - Math.pow(1 - WEEKLY_DECAY, weeks)
}

/**
 * How long must pass before a decay run is worth doing.
 *
 * Below this the movement is too small to be worth a write, and writing anyway
 * would touch `updated_at` on every page visit — which would destroy the one
 * cheap signal for "when did this weight last actually change".
 */
export const MIN_DECAY_INTERVAL_MS = 24 * 3_600_000

/**
 * Decay by elapsed time, returning what moved and whether it ran at all.
 *
 * `null` for `since` means never decayed: treated as one week, not as the
 * beginning of time. A user whose account is a year old but whose interests
 * were added yesterday should not have them yanked to the prior on first visit.
 */
export function decayByElapsed(
  interests: Interest[], since: string | null, now: string,
): { interests: Interest[]; ran: boolean; fraction: number; elapsedMs: number } {
  const nowMs = Date.parse(now)
  const sinceMs = since ? Date.parse(since) : NaN
  const elapsedMs = Number.isFinite(sinceMs) && Number.isFinite(nowMs)
    ? Math.max(0, nowMs - sinceMs)
    : 7 * 86_400_000

  if (elapsedMs < MIN_DECAY_INTERVAL_MS) {
    return { interests: interests.map(i => ({ ...i })), ran: false, fraction: 0, elapsedMs }
  }
  const fraction = decayFractionForElapsed(elapsedMs)
  return { interests: decayWeights(interests, fraction), ran: true, fraction, elapsedMs }
}

/** The minimum share of a digest reserved for the two discovery buckets. */
export const MIN_DISCOVERY_SHARE = 0.15

/**
 * Guarantee the discovery buckets a floor, taking the slots from core.
 *
 * Called on whatever plan the user's settings produce — including one the
 * feedback loop shrank — so that no sequence of preferences can reduce
 * discovery to nothing. The spec: "Keep a minimum discovery share even if
 * unfamiliar items initially get fewer clicks."
 *
 * Taken from `core` specifically, because core is the bucket that a
 * click-maximising adjustment would have grown. Taking it from `context` or
 * `local` would protect discovery by eating a different deliberate choice.
 *
 * A user who sets discovery to zero on purpose is overruled here, and that is a
 * real cost — it is accepted because the alternative is a product that silently
 * becomes a different product. The floor is a named constant and the override
 * is a one-line change, so the decision stays visible.
 */
export function planWithDiscoveryFloor(
  plan: BucketPlan[], minShare = MIN_DISCOVERY_SHARE,
): BucketPlan[] {
  const total = plan.reduce((n, b) => n + b.slots, 0)
  if (total === 0) return plan.map(b => ({ ...b }))

  const discoveryBuckets: Bucket[] = ['adjacent', 'outside']
  const current = plan
    .filter(b => discoveryBuckets.includes(b.bucket))
    .reduce((n, b) => n + b.slots, 0)
  const wanted = Math.max(2, Math.ceil(total * minShare))
  if (current >= wanted) return plan.map(b => ({ ...b }))

  let deficit = wanted - current
  const out = plan.map(b => ({ ...b }))

  const core = out.find(b => b.bucket === 'core')
  const takeFromCore = core ? Math.min(deficit, Math.max(0, core.slots - 1)) : 0
  if (core) core.slots -= takeFromCore
  deficit -= takeFromCore

  // Still short — the plan had almost no core either. Take from whatever is
  // largest, and never below one slot, so no bucket is deleted outright.
  while (deficit > 0) {
    const donor = out
      .filter(b => !discoveryBuckets.includes(b.bucket) && b.slots > 1)
      .sort((a, b) => b.slots - a.slots)[0]
    if (!donor) break
    donor.slots -= 1
    deficit -= 1
  }

  const given = wanted - current - deficit
  for (let i = 0; i < given; i++) {
    const target = discoveryBuckets[i % discoveryBuckets.length]
    const bucket = out.find(b => b.bucket === target)
    if (bucket) bucket.slots += 1
    else out.push({ bucket: target, slots: 1 })
  }

  return out
}

/**
 * The sentence shown with an unfamiliar item.
 *
 * Built from the bridge the scorer already computed, not written freshly, so it
 * cannot claim a connection the arithmetic did not find. Returns null when there
 * is nothing honest to say — an unexplained discovery item is better than an
 * invented explanation, and the spec's reason for showing the sentence at all is
 * that it "gives the user a way to correct the connection". A fabricated
 * connection cannot be corrected, only disbelieved.
 */
export function explainDiscovery(
  opts: { bucket: Bucket; bridgeFrom: string | null; bridgeTo: string | null; novelty: number },
): string | null {
  if (opts.bucket === 'adjacent' && opts.bridgeFrom) {
    return opts.bridgeTo
      ? `This connects to your interest in ${opts.bridgeFrom} through ${opts.bridgeTo}.`
      : `This sits next to your interest in ${opts.bridgeFrom}.`
  }
  if (opts.bucket === 'outside') {
    return opts.novelty >= 0.9
      ? 'Nothing you have been shown recently resembles this. It is here to widen the map, not because it matched an interest.'
      : 'This is outside your current interests — it is filling the discovery slot.'
  }
  return null
}
