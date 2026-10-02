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
 * 1. **A weight of zero is arithmetic, not a hint.** A muted medium is removed
 *    from the reply media before the model is asked, and a reply that lands in one
 *    anyway is rejected with its own reason. Everything between 1 and 3 is
 *    guidance, because proportion over a run of turns is not something a single
 *    completion can be made to obey.
 *
 * 2. **Tuning governs what the partner reaches for, never what makes a connection
 *    hold.** Nostalgia is the one axis where that distinction can be lost: "lean
 *    older" must not become "a shared decade is a connection", which is the
 *    metadata-derived reasoning this section removed on purpose. The guidance says
 *    so, and a test asserts it says so.
 *
 * Neutral is the empty object. A tuning nobody has touched stores no keys, says
 * nothing to the interpreter, and spends no tokens — so the default costs nothing
 * and "unset" never has to be told apart from "set to the default".
 */

import type { MediumId } from './types'
import { getMedium } from './media'

// ---------------------------------------------------------------------------
// Medium weights
// ---------------------------------------------------------------------------

/**
 * How often the partner should reach for a medium.
 *
 * Four stops, because a continuous slider here would be false precision: nobody
 * can tell 0.55 from 0.6 of a leaning, and the difference between never, rarely,
 * freely and mostly is the whole range anyone wants.
 */
export type MediumWeight = 0 | 1 | 2 | 3

export const DEFAULT_WEIGHT: MediumWeight = 2

export const WEIGHT_LABELS: Record<MediumWeight, string> = {
  0: 'never',
  1: 'rarely',
  2: 'freely',
  3: 'mostly',
}

/** Player-facing explanation of each stop, shown under the control. */
export const WEIGHT_HINTS: Record<MediumWeight, string> = {
  0: 'Never answers here. Still yours to play.',
  1: 'An occasional one, when it is clearly the better answer.',
  2: 'As often as the connection calls for it.',
  3: 'Where it goes by default.',
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
  weights: Partial<Record<MediumId, MediumWeight>>
  axes: Partial<Record<TuningAxisId, number>>
}

export const DEFAULT_TUNING: Tuning = { weights: {}, axes: {} }

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
  const out: Tuning = { weights: {}, axes: {} }
  if (!raw || typeof raw !== 'object') return out

  const src = raw as { weights?: unknown; axes?: unknown }

  if (src.weights && typeof src.weights === 'object') {
    for (const [key, value] of Object.entries(src.weights as Record<string, unknown>)) {
      if (!media.includes(key as MediumId) || !getMedium(key)) continue
      const w = clampInt(value, 0, 3)
      if (w === null || w === DEFAULT_WEIGHT) continue
      out.weights[key as MediumId] = w as MediumWeight
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

/** True when the tuning says nothing — the state every session starts in. */
export function isNeutral(tuning: Tuning): boolean {
  return Object.keys(tuning.weights).length === 0 && Object.keys(tuning.axes).length === 0
}

export function weightOf(tuning: Tuning, medium: MediumId): MediumWeight {
  return tuning.weights[medium] ?? DEFAULT_WEIGHT
}

export function axisValue(tuning: Tuning, id: TuningAxisId): number {
  return tuning.axes[id] ?? TUNING_AXES[id].neutral
}

/** Media the player has muted. They remain playable by the player. */
export function mutedMedia(tuning: Tuning, media: MediumId[]): MediumId[] {
  return media.filter(m => weightOf(tuning, m) === 0)
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
  const audible = media.filter(m => weightOf(tuning, m) > 0)
  const usable = audible.length > 0 ? audible : media
  return [...usable].sort((a, b) => weightOf(tuning, b) - weightOf(tuning, a))
}

/**
 * The medium the weights say is overdue, or null.
 *
 * Proportion is the one thing a single completion cannot be instructed into: a
 * model told "mostly music, occasionally art" will answer in music every turn and
 * never notice, because each turn looks locally correct. So the balance is computed
 * from the log — expected share from the weights, actual from the replies on this
 * branch — and the interpreter is told which medium is owed a turn.
 *
 * Advisory on purpose. A connection that genuinely wants music is better than a
 * stretch played to satisfy a ratio, and the prompt says so.
 */
export function dueMedium(
  tuning: Tuning,
  recentReplyMedia: MediumId[],
  media: MediumId[],
): MediumId | null {
  const eligible = media.filter(m => weightOf(tuning, m) > 0)
  if (eligible.length < 2 || recentReplyMedia.length === 0) return null

  const total = eligible.reduce((sum, m) => sum + weightOf(tuning, m), 0)
  if (total === 0) return null

  const n = recentReplyMedia.length
  let worst: MediumId | null = null
  let worstDeficit = 0

  for (const m of eligible) {
    const expected = (weightOf(tuning, m) / total) * n
    const actual = recentReplyMedia.filter(x => x === m).length
    const deficit = expected - actual
    // A whole reply has to be owed before anything is said. Below that the
    // "shortfall" is rounding, and nudging on rounding would make every turn
    // carry an instruction.
    if (deficit >= 1 && deficit > worstDeficit) {
      worst = m
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
 * entry or a `WEIGHT_LABELS` key, so changing what a setting means is an edit to
 * the data above rather than to a template.
 */
export function describeTuning(tuning: Tuning, media: MediumId[]): string {
  if (isNeutral(tuning)) return ''

  const lines: string[] = []

  const byWeight = (w: MediumWeight) => media.filter(m => weightOf(tuning, m) === w)
  const mostly = byWeight(3)
  const rarely = byWeight(1)
  const never = byWeight(0)

  if (mostly.length > 0) {
    lines.push(`- Answer in these by preference: ${groupLabel(mostly)}.`)
  }
  if (rarely.length > 0) {
    lines.push(
      `- Reach for these only occasionally, when one is clearly the better answer: ` +
      `${groupLabel(rarely)}.`,
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

  if (lines.length === 0) return ''

  return `HOW THE PLAYER HAS WEIGHTED YOU
They set this during the game and may change it before the next turn, so treat it as
the current instruction rather than a standing rule. It governs what you reach *for*.
It does not change what makes a connection hold: a shared decade, a shared catalogue
or a shared running time is still a coincidence of filing and still not a connection.

${lines.join('\n')}`
}

/** One short line for the player's own display. Empty when neutral. */
export function tuningSummary(tuning: Tuning, media: MediumId[]): string {
  if (isNeutral(tuning)) return ''
  const bits: string[] = []

  const mostly = media.filter(m => weightOf(tuning, m) === 3)
  const rarely = media.filter(m => weightOf(tuning, m) === 1)
  const never = media.filter(m => weightOf(tuning, m) === 0)

  if (mostly.length > 0) bits.push(`mostly ${groupLabel(mostly).toLowerCase()}`)
  if (rarely.length > 0) bits.push(`a little ${groupLabel(rarely).toLowerCase()}`)
  if (never.length > 0) bits.push(`no ${groupLabel(never).toLowerCase()}`)

  for (const axis of AXIS_LIST) {
    const v = axisValue(tuning, axis.id)
    if (v !== axis.neutral) bits.push(axis.labels[v].toLowerCase())
  }

  return bits.join(' · ')
}
