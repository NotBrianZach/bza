/**
 * Drafting a composed offering, so the player does not have to write one cold.
 *
 * Why this exists rather than a catalogue. The catalogued media each have a real
 * index behind them, and for the physical media there is no equivalent to find:
 * exercise and stretch have open datasets of *named* movements, but dance has
 * nothing usable — Wikidata lists dance genres rather than steps, and the one
 * corpus of steps-with-definitions is square-dance calls under a copyleft licence.
 * So the honest options for `movement` were "ask the player to author every one by
 * hand" or "draft one on demand". This is the second, and it is deliberately not
 * dressed up as a lookup.
 *
 * The distinction that keeps it honest: drafting a composed offering invents
 * nothing, because a composed offering was never a record. It is an instruction to
 * do something, judged by whether a second person could follow it. That is why this
 * module exists only for composed media, and why the equivalent for a catalogued
 * medium would be indefensible — "suggest a song" means "invent a track", which is
 * the exact failure the search guard exists to prevent.
 *
 * A draft gets no special standing. It passes through `checkPerformability` exactly
 * as typed input does, and a draft that fails is discarded rather than shown: the
 * player asked for something doable, and vague mush is not a weaker version of
 * that, it is the thing the guard is for.
 */

import { checkPerformability, type ComposedInput, type PerformabilityProblem } from './composed'
import type { ActionIntent, MediumId } from '@/lib/correlate/types'

/** A draft, in the shape the picker's fields already take. */
export interface SuggestedDraft {
  title: string
  steps: string[]
  framing: string
  intent: ActionIntent
}

/**
 * Why a draft could not be used.
 *
 * Every one of these is our side failing rather than the player's, so the UI says
 * "could not draft one" instead of correcting them — the same reason
 * `ReplyRejection` is kept distinct from a search miss. A player who pressed a
 * button and got a lecture about vague steps would reasonably conclude they had
 * done something wrong.
 */
export type DraftRejection =
  | { reason: 'unparseable' }
  | { reason: 'repeat'; title: string }
  | { reason: 'unperformable'; problems: PerformabilityProblem[] }

export function describeDraftRejection(r: DraftRejection): string {
  switch (r.reason) {
    case 'unparseable':   return 'the draft came back in a shape that could not be read'
    case 'repeat':        return `the draft repeated "${r.title}", which was already discarded`
    case 'unperformable': return `the draft had no followable steps (${r.problems.join(', ')})`
  }
}

/** How many discards are carried into the prompt before the oldest are dropped. */
export const MAX_REJECTED = 8
/** A brief is a nudge, not a specification. Long enough for a sentence. */
export const MAX_BRIEF_CHARS = 240

/**
 * Titles compare case- and punctuation-insensitively, because "The Interrupted
 * Reach" and "the interrupted reach." are the same suggestion, and returning the
 * second after the first was discarded makes the discard button look broken.
 */
export function titleKey(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/** Coerce whatever the client sent into a bounded list of discarded titles. */
export function normalizeRejected(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of input) {
    if (typeof v !== 'string') continue
    const title = v.trim().slice(0, 120)
    if (!title) continue
    const key = titleKey(title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(title)
  }
  // Keep the most recent. A long run of discards should still constrain the next
  // attempt rather than spending the whole budget on ancient rejections.
  return out.slice(-MAX_REJECTED)
}

export function normalizeBrief(input: unknown): string {
  return typeof input === 'string' ? input.trim().slice(0, MAX_BRIEF_CHARS) : ''
}

const SYSTEM = [
  'You draft one physical action a person could actually perform, and you return it as JSON.',
  '',
  'The only test that matters is whether a second person, reading your steps, could do the',
  'thing you meant. Concrete beats evocative every time. "Extend one arm forward at chest',
  'height, unhurried" is a step. "A movement expressing longing" is not a step — it is a',
  'description of a feeling, and there is nothing in it to follow.',
  '',
  'Rules:',
  '- Between one and five steps. One is fine. A turn is one action, not a routine.',
  '- Every step says what moves and where to, or what is held and for how long.',
  '- No equipment beyond what is in an ordinary room, and nothing that needs space to',
  '  travel through. Assume someone standing or sitting where they already are.',
  '- Nothing that risks injury, and nothing that assumes a particular body. Where a step',
  '  needs a joint to do something not everyone can do, give the supported version.',
  '- The framing names which part of the action carries the meaning. It is not a summary.',
  '',
  'Respond with exactly this JSON object and nothing else:',
  '{"title": "...", "steps": ["...", "..."], "framing": "...", "intent": "shown" | "invited"}',
  '',
  '"intent" is "shown" if you are describing the action, "invited" if you are asking the',
  'player to try it. Choose whichever the brief implies, and prefer "shown" when unsure.',
].join('\n')

export function buildSuggestSystemPrompt(): string {
  return SYSTEM
}

/**
 * The ask, with the discards named.
 *
 * Carrying the rejected titles is the whole mechanism behind the discard button.
 * Without them, "suggest another" is a fresh sample from the same distribution and
 * comes back with the same handful of obvious answers, which reads as the button
 * not working. This is the correction `buildRetryPrompt` already makes for a failed
 * reply: tell it what it tried, so it does not try it again.
 */
export function buildSuggestPrompt(opts: {
  medium: MediumId
  /** Singular noun from the medium registry, e.g. "movement". */
  mediumName: string
  /** The registry's framing hint, so the framing matches what the field asks for. */
  framingHint: string
  /** What the player typed, if anything. Blank is valid and handled. */
  brief: string
  rejected: string[]
}): string {
  const { mediumName, framingHint, brief, rejected } = opts
  const parts: string[] = []

  parts.push(`Draft one ${mediumName}.`)

  parts.push(
    brief
      ? `WHAT THE PLAYER ASKED FOR\n${brief}`
      : 'The player did not say what they wanted, so choose something with a clear shape ' +
        'rather than something safe. An action with one surprising constraint in it is ' +
        'better than a generic one.',
  )

  if (rejected.length > 0) {
    parts.push(
      'ALREADY DISCARDED — do not offer these again, and do not offer a variation on them\n' +
      rejected.map(t => `- ${t}`).join('\n') +
      `\nThe player rejecting ${rejected.length === 1 ? 'that' : 'those'} is information: ` +
      'reach somewhere genuinely different, not one step sideways.',
    )
  }

  parts.push(`WHAT THE FRAMING SHOULD POINT AT\n${framingHint}`)
  parts.push('Respond with the JSON object and nothing else.')

  return parts.join('\n\n')
}

/**
 * Turn a model response into a draft, or say why it is not one.
 *
 * Takes already-parsed JSON rather than a raw string, so the tolerant-parse logic
 * stays in the prompt layer and there is one implementation of it instead of two.
 */
export function parseSuggestion(
  parsed: unknown,
  opts: { medium: MediumId; rejected: string[] },
): { ok: true; draft: SuggestedDraft } | { ok: false; rejection: DraftRejection } {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, rejection: { reason: 'unparseable' } }
  }
  const raw = parsed as Record<string, unknown>

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const framing = typeof raw.framing === 'string' ? raw.framing.trim() : ''
  const steps = Array.isArray(raw.steps)
    ? raw.steps.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
    : []
  const intent: ActionIntent = raw.intent === 'invited' ? 'invited' : 'shown'

  // The discard guard runs before performability. A repeat is perfectly
  // performable, so reporting it as unperformable would tell the player something
  // false about what went wrong.
  const rejectedKeys = new Set(opts.rejected.map(titleKey))
  if (title && rejectedKeys.has(titleKey(title))) {
    return { ok: false, rejection: { reason: 'repeat', title } }
  }

  const input: ComposedInput = { medium: opts.medium, title, steps, framing, intent }
  const problems = checkPerformability(input)
  if (problems.length > 0) return { ok: false, rejection: { reason: 'unperformable', problems } }

  return { ok: true, draft: { title, steps, framing, intent } }
}
