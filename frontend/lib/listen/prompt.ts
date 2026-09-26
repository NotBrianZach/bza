/**
 * Builds the interpreter prompt for a Listen Along turn, and parses what comes
 * back. Server-only: this is the one place the game's rules are handed to a
 * model, so the mode registry stays declarative.
 */

import type { Interpretation, LinkCheck, ListenMode, TrackRef } from './types'
import { describeLinks } from './links'

/** A previous turn, trimmed to what the interpreter needs to stay consistent. */
export interface TurnContext {
  turn_index: number
  move_track: TrackRef
  reply_track: TrackRef | null
  reading: string | null
  narration: string | null
}

function trackLine(t: TrackRef): string {
  const year = t.releaseDate?.slice(0, 4) ?? '????'
  return `"${t.name}" — ${t.artist} (${t.album}, ${year})`
}

export function buildSystemPrompt(mode: ListenMode): string {
  const keys = mode.worldKeys
    .map(k => `  - ${k.key}: ${k.description}`)
    .join('\n')

  return `${mode.persona}

You are the interpreter for a music game called "${mode.name}". In this game a song
is: ${mode.songIs}.

THE RULES YOU ENFORCE
- Player move: ${mode.pieces.playerMove}
- How you read it: ${mode.pieces.interpreter}
- What comes back: ${mode.pieces.responseRule}
- What persists: ${mode.pieces.worldState}
- The constraint: ${mode.pieces.constraint}
- The goal: ${mode.pieces.goal}

CHOOSING YOUR REPLY SONG
${mode.replyRule}

Your reply is a *query*, not a claim: it is searched against Spotify, and if no
real song matches, your turn lands nowhere. So name a song you are confident
exists, formatted exactly as "Artist — Title". Never invent a track. Never reply
with a song already in play.

THE WORLD YOU MAINTAIN
${keys}
  - facts: durable statements established by play.

Rules for the world:
- Return only a *delta*. Keys you omit are left alone. Never restate the whole world.
- Anything an earlier turn established is binding. You may complicate it, reveal
  it was incomplete, or put it in doubt — but you may not silently contradict it.
- One turn establishes one new thing. Resist summarising.

OUTPUT
Reply with a single JSON object and nothing else. No prose before or after, no
markdown fence. Schema:

{
  "reading": "how you read the player's song, 1-2 sentences. The argument, not the story.",
  "narration": "what the exchange did to the world, 2-4 sentences, in your voice.",
  "replyQuery": "Artist — Title",
  "replyReason": "why that song answers this move, one sentence.",
  "facts": ["at most two new durable statements"],
  "worldDelta": { "only": "changed keys" }${mode.judge === 'features' ? ',\n  "verdict": "legal" | "illegal"' : ''}
}`
}

export function buildUserPrompt(opts: {
  mode: ListenMode
  world: Record<string, any>
  history: TurnContext[]
  move: TrackRef
  links: LinkCheck[]
  previous: TrackRef | null
  prediction?: string | null
  turnIndex: number
}): string {
  const { mode, world, history, move, links, previous, prediction, turnIndex } = opts
  const parts: string[] = []

  parts.push(`WORLD STATE (turn ${turnIndex})\n${JSON.stringify(world, null, 2)}`)

  if (history.length > 0) {
    const log = history
      .map(t => {
        const lines = [`Turn ${t.turn_index}: player sent ${trackLine(t.move_track)}`]
        if (t.reply_track) lines.push(`  dial answered ${trackLine(t.reply_track)}`)
        if (t.narration) lines.push(`  ${t.narration}`)
        return lines.join('\n')
      })
      .join('\n')
    parts.push(`RECENT TURNS\n${log}`)
  }

  parts.push(`THE PLAYER'S MOVE\n${trackLine(move)}\nDuration ${Math.round(move.durationMs / 1000)}s · popularity ${move.popularity}/100${move.explicit ? ' · explicit' : ''}`)

  if (previous) {
    parts.push(
      `VERIFIED LINKS between this move and the song on the table (${trackLine(previous)}):\n` +
      `${describeLinks(links)}\n` +
      `These were computed from Spotify metadata. Treat them as fact; do not claim links that are not listed.`,
    )
    if (mode.judge === 'features') {
      parts.push(
        links.length === 0
          ? 'No link holds, so this move is illegal under the constraint. Set verdict to "illegal", say plainly which link the player seemed to be reaching for and why it does not hold, and do not extend the chain — leave replyQuery as an empty string.'
          : 'At least one link holds, so the move is legal. Set verdict to "legal" and name the link you are treating as the connection.',
      )
    }
  }

  if (prediction) {
    parts.push(
      `THE PLAYER'S PREDICTION (you must choose your reply on your own terms first, then judge it): "${prediction}"\n` +
      `In your narration, say whether they called it and exactly where their reasoning diverged from yours.`,
    )
  }

  if (turnIndex === 0) {
    parts.push(`This is the opening turn. Establish the world concretely — one place, one fact — rather than gesturing at possibility.`)
  }

  parts.push('Respond with the JSON object only.')
  return parts.join('\n\n')
}

/**
 * Pull a JSON object out of a model response. Models occasionally wrap the
 * object in a fence or add a sentence, so take the outermost balanced braces
 * rather than trusting the whole string to parse.
 */
export function parseJsonObject(raw: string): any | null {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')

  try {
    return JSON.parse(text)
  } catch {}

  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Coerce a parsed object into an Interpretation, dropping anything malformed. */
export function normalizeInterpretation(parsed: any): Interpretation | null {
  if (!parsed || typeof parsed !== 'object') return null

  const str = (v: any): string => (typeof v === 'string' ? v.trim() : '')
  const reading = str(parsed.reading)
  const narration = str(parsed.narration)
  if (!reading && !narration) return null

  const facts = Array.isArray(parsed.facts)
    ? parsed.facts.map(str).filter(Boolean).slice(0, 3)
    : []

  const worldDelta =
    parsed.worldDelta && typeof parsed.worldDelta === 'object' && !Array.isArray(parsed.worldDelta)
      ? parsed.worldDelta as Record<string, any>
      : {}

  return {
    reading,
    narration,
    replyQuery: str(parsed.replyQuery),
    replyReason: str(parsed.replyReason),
    facts,
    worldDelta,
    verdict: parsed.verdict === 'illegal' ? 'illegal' : parsed.verdict === 'legal' ? 'legal' : undefined,
  }
}

/**
 * Apply an interpretation to the world. Shallow merge by design: the
 * interpreter returns only changed keys, and `facts` accumulates rather than
 * being overwritten so a later turn cannot erase what play established.
 */
export function applyWorldDelta(
  world: Record<string, any>,
  interpretation: Interpretation,
): Record<string, any> {
  const next: Record<string, any> = { ...world, ...interpretation.worldDelta }

  const existingFacts: string[] = Array.isArray(world.facts) ? world.facts : []
  // A delta may also carry facts; fold both in and drop repeats.
  const deltaFacts: string[] = Array.isArray(interpretation.worldDelta?.facts)
    ? interpretation.worldDelta.facts.filter((f: any) => typeof f === 'string')
    : []
  const merged = [...existingFacts, ...deltaFacts, ...interpretation.facts]
  next.facts = merged.filter((f, i) => merged.indexOf(f) === i)

  return next
}
