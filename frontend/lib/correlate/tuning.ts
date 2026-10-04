/**
 * The third registry — how the partner is weighted.
 *
 * Media say what an offering can be made of. Relations say what a reply can do to
 * one. Neither says anything about *proportion*: a player who wants mostly music
 * with an occasional stretch or art piece was previously obliged to either play a
 * music-only game — a tier this section deliberately deleted — or hope the
 * interpreter happened to lean that way. Tuning is the missing axis, and it is a
 * registry rather than a settings blob for the same reason the other two are: the
 * values are declarative data, the prompt text is derived from them, and adding an
 * axis is an edit here plus nothing else.
 *
 * Two properties are load-bearing:
 *
 * 1. **A share is arithmetic, not a hint.** Every share is enforced by restricting
 *    the media the model may answer in, before it is asked. This replaced a
 *    four-stop weight (never/rarely/freely/mostly) where only *zero* was
 *    arithmetic and the rest was prompt text, and the replacement was not a
 *    refinement — the old version did not work. Measured on real games, a player
 *    who set music to "mostly" and movement/stretch to "rarely" got 29% music and
 *    57% stretch. Two reasons, both now fixed:
 *
 *      - **The old share maths drowned the setting.** Expected share was
 *        `weight / sum(weights)` across every non-muted medium, so music at 3
 *        against eleven media sitting at the default 2 expected 3/25 — twelve per
 *        cent. "Mostly" was arithmetically a minority and nothing said so.
 *      - **Nothing enforced it.** Weights 1–3 reached the model as a sentence,
 *        plus one advisory nudge whose own wording was "do not force it". A model
 *        answers each turn locally correctly and never notices a ratio, which is
 *        the exact failure the nudge was written to prevent and did not.
 *
 *    So proportion is now a filter rather than a request: a medium already over
 *    its share is not in the enum the model chooses from, and comes back only when
 *    the chain has caught up. See `owedMedia`.
 *
 * 2. **Tuning governs what the partner reaches for, never what makes a connection
 *    hold.** Nostalgia is the one axis where that distinction can be lost: "lean
 *    older" must not become "a shared decade is a connection", which is the
 *    metadata-derived reasoning this section removed on purpose. The guidance says
 *    so, and a test asserts it says so.
 *
 * Neutral is the empty object. A tuning nobody has touched stores no keys, says
 * nothing to the interpreter, spends no tokens, and — importantly — restricts
 * nothing: enforcement is something the player opts into by setting a share, so an
 * untouched game plays exactly as it did before any of this existed.
 */

import type { MediumId } from './types'
import { getMedium } from './media'
import {
  CONTINUATION_LABELS, CONTINUATION_OFF, MAX_SELF_REPLIES, type ContinuationDepth,
} from './continuation'
import {
  describeScopes, isUnscoped, normalizeScopes, scopeSummary, type Scopes,
} from './scope'

// ---------------------------------------------------------------------------
// Medium shares
// ---------------------------------------------------------------------------

/**
 * How much of the partner's answering a medium should get, 0–100.
 *
 * A raw weight, not a percentage: what the player cares about is the *ratio*
 * between media, and a control that forced the numbers to sum to 100 would mean
 * moving one slider silently moved all the others. The resulting percentage is
 * computed by `targetShares` and shown next to each slider — which is the part
 * the four-stop version could not do, and the reason it went wrong. "Mostly
 * music" sounds decisive; "music 12%" does not, and the player was only ever
 * shown the first.
 */
export const SHARE_MAX = 100

/** Where every medium sits until the player moves it. */
export const DEFAULT_SHARE = 50

/** Zero is mute, and mute is the one share that is a prohibition. */
export const MUTED_SHARE = 0

/**
 * The retired four-stop scale, and what each stop becomes.
 *
 * Read only when a stored tuning has no `shares` key — old session rows, old
 * presets, and the `tuning` snapshot on every turn played before today. The
 * values are not a guess at intent: they are what each label was *trying* to
 * mean, now that a share can actually express it. "Rarely" lands at 15 rather
 * than at 25 because "an occasional one" is not one turn in four.
 */
const LEGACY_WEIGHT_SHARES: Record<number, number> = { 0: 0, 1: 15, 2: 50, 3: 100 }

/**
 * A rough label for a share, for places that want a word rather than a number.
 *
 * Derived from the number instead of being the stored value, which is the whole
 * inversion: the number is the truth and the word is a summary of it. Previously
 * the word was the truth and the number was hidden.
 */
export function shareLabel(share: number): string {
  if (share <= MUTED_SHARE) return 'never'
  if (share < 30) return 'rarely'
  if (share < 70) return 'freely'
  return 'mostly'
}

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------

export type TuningAxisId = 'nostalgia' | 'obliquity' | 'friction'

export interface TuningAxis {
  id: TuningAxisId
  name: string
  /** One line on what the axis is for, shown above the control. */
  does: string
  /** The two ends, named. Not "low" and "high" — those are not readable. */
  low: string
  high: string
  /**
   * The resting stop. At this value the axis contributes nothing to the prompt,
   * which is what makes an untouched tuning free.
   */
  neutral: number
  /** Short label per stop, for the control. Five, including neutral. */
  labels: [string, string, string, string, string]
  /**
   * What the interpreter is told at each stop, verbatim. The neutral stop is empty
   * on purpose: a default must not bias anything, and the cheapest way to
   * guarantee that is for it to say nothing at all.
   */
  stops: [string, string, string, string, string]
}

export const TUNING_AXES: Record<TuningAxisId, TuningAxis> = {
  nostalgia: {
    id: 'nostalgia',
    name: 'Nostalgia',
    does: 'Whether your partner reaches for what you already carry, or for what you have never met.',
    low: 'the unencountered',
    high: 'the remembered',
    neutral: 2,
    labels: ['Nothing you know', 'Unfamiliar', 'Either', 'Familiar', 'Things you grew up with'],
    stops: [
      'Reach for what the player has almost certainly never encountered: the obscure, the ' +
      'recent, the unplaced, the thing with no cultural weight yet. If a reply feels like ' +
      'something they could have named themselves, find another.',

      'Lean toward the unfamiliar. Prefer the work nobody has told them about to the one ' +
      'everybody has, when both answer the move equally well.',

      '',

      'Lean toward the remembered: the widely loved, the long-circulated, the work a person ' +
      'is likely to have met before. Choose it for its familiarity, not instead of a better answer.',

      'Reach for what the player probably already carries — canonical, decades old, the kind of ' +
      'thing that arrives with a memory attached. Say in your reading what the recognition is ' +
      'doing to the connection, because at this setting it is part of the connection.',
    ],
  },

  obliquity: {
    id: 'obliquity',
    name: 'Obliquity',
    does: 'How far a reply may travel from the move before the connection stops being sayable.',
    low: 'plainly',
    high: 'obliquely',
    neutral: 2,
    labels: ['Say it plainly', 'Close', 'Either', 'Sideways', 'Make me work'],
    stops: [
      'Answer plainly. The connection should be the first thing a second person notices, and ' +
      'your reading should be able to state it in one clause without hedging.',

      'Stay close to the move. Prefer the connection that is easy to see over the one that is ' +
      'clever to explain.',

      '',

      'Go sideways. Prefer the connection that takes a sentence to say over the one that takes ' +
      'none, so long as you can still say it.',

      'Travel as far as you can still argue back from. The connection may be two steps removed, ' +
      'but your reading has to walk both steps — an unsayable connection is not oblique, it is absent.',
    ],
  },

  friction: {
    id: 'friction',
    name: 'Friction',
    does: 'Whether your partner builds on your reading or pushes back against it.',
    low: 'goes with you',
    high: 'argues',
    neutral: 2,
    labels: ['Agreeable', 'Warm', 'Either', 'Sceptical', 'Adversarial'],
    stops: [
      'Go with the player. Take the most generous available reading of the move, extend it, and ' +
      'prefer continuation and association over anything that contradicts them.',

      'Lean warm. Build on what the move established rather than questioning it.',

      '',

      'Push back. Say what the move overlooks as well as what it does, and prefer counterpoint ' +
      'and reinterpretation when either is available.',

      'Argue. Treat every move as a claim with something missing from it, name what is missing, ' +
      'and answer the gap rather than the claim. Never be rude and never refuse to play — ' +
      'friction is disagreement about the reading, not reluctance to take a turn.',
    ],
  },
}

export const AXIS_LIST: TuningAxis[] = [
  TUNING_AXES.nostalgia,
  TUNING_AXES.obliquity,
  TUNING_AXES.friction,
]

export const ALL_AXIS_IDS: TuningAxisId[] = AXIS_LIST.map(a => a.id)

/** Number of stops every axis has. */
export const AXIS_STOPS = 5

export function getAxis(id: string): TuningAxis | null {
  return (TUNING_AXES as Record<string, TuningAxis>)[id] ?? null
}

// ---------------------------------------------------------------------------
// The value
// ---------------------------------------------------------------------------

/**
 * A session's tuning, in canonical form: only what differs from the default is
 * stored. The empty object is neutral, and that is the shape a session is created
 * with.
 */
export interface Tuning {
  /**
   * Raw 0–100 weight per medium; absent means `DEFAULT_SHARE`.
   *
   * Stored under a new key rather than reusing `weights`, because a stored `2`
   * is ambiguous between the old scale's "freely" and the new scale's
   * all-but-muted — and silently reading one as the other would mute a medium
   * the player had set to its default. `normalizeTuning` upgrades a legacy
   * `weights` object only when `shares` is absent.
   */
  shares: Partial<Record<MediumId, number>>
  axes: Partial<Record<TuningAxisId, number>>
  /**
   * Which region of each medium the partner may reach into — see ./scope.ts.
   *
   * It lives inside Tuning rather than beside it because it is the same kind of
   * thing: something the player asks of their partner, adjustable between any two
   * turns, saved and loaded by the same plumbing. That also means it needed no
   * migration — `listen_sessions.tuning` is already jsonb and already
   * canonicalised on the way in.
   */
  scopes: Scopes
  /**
   * How many turns the partner takes by itself after each of yours — see
   * ./continuation.ts. 0 is off, and off is the default.
   *
   * It is stored in this object and excluded from `describeTuning` on purpose. The
   * other three fields govern what the partner reaches *for* and are therefore
   * instructions to it; this one governs *who takes the next turn*, which is not
   * the interpreter's business and actively harms the turn if it learns it. A model
   * told a run of three is coming writes toward a monologue instead of answering
   * the thing in front of it, so each self-reply is asked for as its own turn with
   * no knowledge of the next.
   *
   * Consequence worth stating: `isNeutral` ignores it, because `isNeutral` means
   * "says nothing to the interpreter". Use `isUntouched` for "the player has not
   * changed anything", which is what a UI wants.
   */
  continuation: ContinuationDepth
}

export const DEFAULT_TUNING: Tuning = {
  shares: {}, axes: {}, scopes: {}, continuation: CONTINUATION_OFF,
}

const clampInt = (v: unknown, lo: number, hi: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  if (!Number.isFinite(n)) return null
  return Math.min(hi, Math.max(lo, Math.round(n)))
}

/**
 * Coerce whatever is in the database or the request body into a Tuning.
 *
 * Canonicalising is the point: values equal to the default are dropped, so
 * `isNeutral` is a key count rather than a comparison against the registry, and a
 * player who drags a control back to where it started leaves no trace behind.
 * Media the session does not play are dropped too — a weight for a medium this
 * deployment cannot serve would silently mute nothing.
 */
export function normalizeTuning(raw: unknown, media: MediumId[]): Tuning {
  const out: Tuning = { shares: {}, axes: {}, scopes: {}, continuation: CONTINUATION_OFF }
  if (!raw || typeof raw !== 'object') return out

  const src = raw as {
    shares?: unknown; weights?: unknown; axes?: unknown; scopes?: unknown
    continuation?: unknown
  }

  out.scopes = normalizeScopes(src.scopes, media)

  // Clamped to the engine's own cap rather than to whatever the client sent: the
  // cap is also enforced from the log server-side, and a stored value above it
  // would promise a fourth turn the engine will always refuse.
  const carry = clampInt(src.continuation, 0, MAX_SELF_REPLIES)
  if (carry !== null) out.continuation = carry as ContinuationDepth

  // `shares` wins outright. A legacy `weights` object is upgraded only in its
  // absence, so a tuning saved today and one saved last week both come out on the
  // new scale and neither can be misread as the other.
  const legacy = src.shares === undefined || src.shares === null
  const sourceShares = legacy ? src.weights : src.shares

  if (sourceShares && typeof sourceShares === 'object') {
    for (const [key, value] of Object.entries(sourceShares as Record<string, unknown>)) {
      if (!media.includes(key as MediumId) || !getMedium(key)) continue
      const raw = legacy
        ? LEGACY_WEIGHT_SHARES[clampInt(value, 0, 3) ?? 2]
        : clampInt(value, 0, SHARE_MAX)
      if (raw === null || raw === undefined || raw === DEFAULT_SHARE) continue
      out.shares[key as MediumId] = raw
    }
  }

  if (src.axes && typeof src.axes === 'object') {
    for (const [key, value] of Object.entries(src.axes as Record<string, unknown>)) {
      const axis = getAxis(key)
      if (!axis) continue
      const v = clampInt(value, 0, AXIS_STOPS - 1)
      if (v === null || v === axis.neutral) continue
      out.axes[axis.id] = v
    }
  }

  return out
}

/**
 * True when the tuning says nothing *to the interpreter* — which is the state
 * every session starts in, and the thing the prompt builders branch on.
 *
 * `continuation` is excluded, and that is not an oversight. It never reaches the
 * prompt, so a game where the only change is "carry on twice" must produce
 * byte-for-byte the prompt an untouched game produces. A test asserts it.
 */
export function isNeutral(tuning: Tuning): boolean {
  return Object.keys(tuning.shares).length === 0
    && Object.keys(tuning.axes).length === 0
    && isUnscoped(tuning.scopes ?? {})
}

/**
 * True when the player has set at least one share.
 *
 * The gate on enforcement, and separate from `isNeutral` because an axis is not a
 * proportion: somebody who only turned up Friction has expressed nothing about
 * which media they want and must not have their reply media filtered.
 */
export function isProportioned(tuning: Tuning): boolean {
  return Object.keys(tuning.shares).length > 0
}

/**
 * True when the player has changed nothing at all.
 *
 * What a UI means by "unweighted": a reset button that stayed hidden while
 * continuation was set to three would be lying about there being nothing to reset.
 */
export function isUntouched(tuning: Tuning): boolean {
  return isNeutral(tuning) && (tuning.continuation ?? CONTINUATION_OFF) === CONTINUATION_OFF
}

/** Every share spelled out, for a control that needs all of them. */
export function allShares(
  tuning: Tuning,
  media: MediumId[],
): { medium: MediumId; share: number; target: number }[] {
  const targets = targetShares(tuning, media)
  return media.map(m => ({
    medium: m,
    share: shareOf(tuning, m),
    target: targets[m] ?? 0,
  }))
}

/** How many turns in a row the partner has been asked to take by itself. */
export function continuationOf(tuning: Tuning): ContinuationDepth {
  return tuning.continuation ?? CONTINUATION_OFF
}

export function shareOf(tuning: Tuning, medium: MediumId): number {
  return tuning.shares[medium] ?? DEFAULT_SHARE
}

export function axisValue(tuning: Tuning, id: TuningAxisId): number {
  return tuning.axes[id] ?? TUNING_AXES[id].neutral
}

/** Media the player has muted. They remain playable by the player. */
export function mutedMedia(tuning: Tuning, media: MediumId[]): MediumId[] {
  return media.filter(m => shareOf(tuning, m) === MUTED_SHARE)
}

/**
 * What proportion of the partner's answers each medium should get, summing to 1.
 *
 * The number the player is actually asking for, and the number they were never
 * shown. Muted media are excluded from the denominator rather than contributing
 * zero, so muting nine media really does hand their share to the three that are
 * left — under the old maths they stayed in the sum and the survivors' shares
 * stayed small.
 */
export function targetShares(
  tuning: Tuning,
  media: MediumId[],
): Partial<Record<MediumId, number>> {
  const live = media.filter(m => shareOf(tuning, m) > MUTED_SHARE)
  const total = live.reduce((sum, m) => sum + shareOf(tuning, m), 0)
  const out: Partial<Record<MediumId, number>> = {}
  if (total <= 0) return out
  for (const m of live) out[m] = shareOf(tuning, m) / total
  return out
}

/** One medium's target against what it has actually been given. */
export interface ShareStanding {
  medium: MediumId
  /** Fraction of replies this medium is asking for, 0–1. */
  target: number
  /** Replies it has actually had on this branch. */
  actual: number
  /** Fraction of replies it has actually had, 0–1. */
  actualShare: number
  /** True when taking this turn would still leave it at or under its target. */
  owed: boolean
}

/**
 * Where every medium stands against its share, given the replies so far.
 *
 * `owed` is the whole mechanism, and it is deliberately phrased about the turn
 * about to happen rather than the turns already played: a medium is owed when
 * `actual < target × (n + 1)` — if it answered now, would it still be within its
 * share? That makes a 15% medium reachable roughly every seventh turn and a 50%
 * one reachable every other, with no randomness and no instruction.
 */
export function shareStandings(
  tuning: Tuning,
  media: MediumId[],
  replyMediaSoFar: MediumId[],
): ShareStanding[] {
  const targets = targetShares(tuning, media)
  const n = replyMediaSoFar.length
  return media
    .filter(m => targets[m] !== undefined)
    .map(m => {
      const target = targets[m]!
      const actual = replyMediaSoFar.filter(x => x === m).length
      return {
        medium: m,
        target,
        actual,
        actualShare: n === 0 ? 0 : actual / n,
        owed: actual < target * (n + 1),
      }
    })
}

/**
 * The media a reply may land in this turn, enforcing the player's proportions.
 *
 * This is the fix. Proportion used to be a sentence in the prompt and an advisory
 * nudge, and a model cannot follow a ratio across turns it cannot see — every
 * individual choice is locally defensible and the aggregate drifts. So a medium
 * that has already had more than its share is simply **not in the enum**, and it
 * comes back as soon as the chain has caught up.
 *
 * Two deliberate escapes, both the same trade this file makes elsewhere:
 *
 *  - **Only when the player has set a share.** An untouched game is unrestricted
 *    and produces the prompt it always did.
 *  - **Never empty.** A perfectly balanced branch owes nothing to anybody; so does
 *    a branch whose owed media are all unusable. The guarantee that a legal turn
 *    carries a real reply outranks a proportion, exactly as it outranks a scope.
 */
export function owedMedia(
  tuning: Tuning,
  media: MediumId[],
  replyMediaSoFar: MediumId[],
): MediumId[] {
  if (!isProportioned(tuning)) return weightedReplyMedia(tuning, media)
  const standings = shareStandings(tuning, media, replyMediaSoFar)
  const owed = standings.filter(s => s.owed).map(s => s.medium)
  const usable = owed.length > 0 ? owed : standings.map(s => s.medium)
  return orderByShare(tuning, usable.length > 0 ? usable : media)
}

/** Heaviest share first. */
function orderByShare(tuning: Tuning, media: MediumId[]): MediumId[] {
  return [...media].sort((a, b) => shareOf(tuning, b) - shareOf(tuning, a))
}

/**
 * The media a reply may actually land in, most-weighted first.
 *
 * The ordering matters for the salvage stage, which tries media in turn: a player
 * who asked for mostly music should get music searched first when the interpreter
 * has already failed twice.
 *
 * Never empty. A player who mutes everything has expressed a contradiction — the
 * engine guarantees every legal turn carries a real reply — so the mute is ignored
 * rather than the guarantee being broken.
 */
export function weightedReplyMedia(tuning: Tuning, media: MediumId[]): MediumId[] {
  const audible = media.filter(m => shareOf(tuning, m) > MUTED_SHARE)
  return orderByShare(tuning, audible.length > 0 ? audible : media)
}

/**
 * The medium furthest behind its share, or null when nothing is owed a whole
 * reply.
 *
 * Kept as a *statement* for the prompt — "you are three replies short of music" —
 * now that the enum does the enforcing. It used to be the entire mechanism and it
 * was not enough: a nudge that ends "do not force it" is a nudge a model declines,
 * and the measured result was 29% music in a game set to mostly music.
 */
export function dueMedium(
  tuning: Tuning,
  replyMediaSoFar: MediumId[],
  media: MediumId[],
): MediumId | null {
  if (replyMediaSoFar.length === 0) return null

  let worst: MediumId | null = null
  let worstDeficit = 0

  for (const s of shareStandings(tuning, media, replyMediaSoFar)) {
    const deficit = s.target * replyMediaSoFar.length - s.actual
    // A whole reply has to be owed before anything is said. Below that the
    // "shortfall" is rounding, and reporting rounding would make every turn carry
    // a sentence that means nothing.
    if (deficit >= 1 && deficit > worstDeficit) {
      worst = s.medium
      worstDeficit = deficit
    }
  }

  return worst
}

// ---------------------------------------------------------------------------
// Prompt text
// ---------------------------------------------------------------------------

const groupLabel = (ids: MediumId[]) =>
  ids.map(id => getMedium(id)?.plural ?? id).join(', ')

/**
 * The tuning, as a block of prompt. Empty string when neutral.
 *
 * Derived entirely from the registry: every sentence here comes from a `stops`
 * entry or from `targetShares`, so changing what a setting means is an edit to the
 * data above rather than to a template.
 *
 * `continuation` is absent from this function by design and must stay absent — see
 * the field comment on `Tuning`. The gate is `isNeutral`, which excludes it, so a
 * game whose only setting is a continuation run produces no block at all.
 */
export function describeTuning(tuning: Tuning, media: MediumId[]): string {
  if (isNeutral(tuning)) return ''

  const lines: string[] = []

  // The proportions, as proportions. The old version translated them back into
  // "by preference" and "only occasionally", which is how a 12% share came to be
  // described to the model as the medium to answer in by default.
  const targets = targetShares(tuning, media)
  const asked = media
    .filter(m => targets[m] !== undefined)
    .sort((a, b) => targets[b]! - targets[a]!)
  const never = mutedMedia(tuning, media)

  if (asked.length > 0) {
    lines.push(
      `- The player has asked for these proportions of your answers: ` +
      `${asked.map(m => `${getMedium(m)?.plural ?? m} ${Math.round(targets[m]! * 100)}%`).join(', ')}.`,
    )
    lines.push(
      `- This is enforced, not requested: the media you may answer in this turn have ` +
      `already been filtered to the ones still within their share, so the list in your ` +
      `instructions is the whole of what is open to you. Choose the best connection ` +
      `available inside it rather than arguing for one that is not.`,
    )
  }
  if (never.length > 0) {
    lines.push(
      `- Do not answer in these at all: ${groupLabel(never)}. The player may still play them; ` +
      `read such a move normally and answer it in something else.`,
    )
  }

  for (const axis of AXIS_LIST) {
    const v = axisValue(tuning, axis.id)
    const text = axis.stops[v]
    if (text) lines.push(`- ${axis.name} (${v > axis.neutral ? axis.high : axis.low}): ${text}`)
  }

  // Two blocks, either of which can be absent: a player may weight the media
  // without narrowing any of them, or narrow one without touching a weight.
  const weighting = lines.length === 0 ? '' : `HOW THE PLAYER HAS WEIGHTED YOU
They set this during the game and may change it before the next turn, so treat it as
the current instruction rather than a standing rule. It governs what you reach *for*.
It does not change what makes a connection hold: a shared decade, a shared catalogue
or a shared running time is still a coincidence of filing and still not a connection.

${lines.join('\n')}`

  const scoping = describeScopes(tuning.scopes ?? {}, media)

  return [weighting, scoping].filter(Boolean).join('\n\n')
}

/**
 * One short line for the player's own display. Empty when nothing was changed.
 *
 * Gated on `isUntouched` rather than `isNeutral`: this line is for the player, and
 * continuation is a setting the player made even though the interpreter never
 * hears about it.
 */
export function tuningSummary(tuning: Tuning, media: MediumId[]): string {
  if (isUntouched(tuning)) return ''
  const bits: string[] = []

  // Named by the share they were actually given, biggest first, so the summary
  // cannot disagree with the percentages in the panel.
  const targets = targetShares(tuning, media)
  const asked = media
    .filter(m => tuning.shares[m] !== undefined && targets[m] !== undefined)
    .sort((a, b) => targets[b]! - targets[a]!)
  const never = mutedMedia(tuning, media)

  for (const m of asked.slice(0, 3)) {
    bits.push(`${Math.round(targets[m]! * 100)}% ${(getMedium(m)?.plural ?? m).toLowerCase()}`)
  }
  if (asked.length > 3) bits.push(`+${asked.length - 3} more`)
  if (never.length > 0) bits.push(`no ${groupLabel(never).toLowerCase()}`)

  for (const axis of AXIS_LIST) {
    const v = axisValue(tuning, axis.id)
    if (v !== axis.neutral) bits.push(axis.labels[v].toLowerCase())
  }

  const scoped = scopeSummary(tuning.scopes ?? {}, media)
  if (scoped) bits.push(scoped)

  const carry = continuationOf(tuning)
  if (carry > CONTINUATION_OFF) bits.push(`carries on ${CONTINUATION_LABELS[carry].toLowerCase()}`)

  return bits.join(' · ')
}
