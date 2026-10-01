/**
 * Builds the interpreter prompt for a correlation turn, and parses what comes
 * back. Server-only: this is the single place the rules are handed to a model, so
 * the registries stay declarative.
 */

import type {
  CorrelationGame, Interpretation, MediumId, Offering, RelationId, ReplyPlan,
} from './types'
import { getMedium, isComposed, resolveMedia } from './media'
import { RELATIONS, getRelation, resolveRelations } from './relations'

/** A previous turn, trimmed to what the interpreter needs to stay consistent. */
export interface TurnContext {
  turn_index: number
  move_offering: Offering
  reply_offering: Offering | null
  relation: RelationId | null
  reading: string | null
  narration: string | null
  carried: string | null
}

/**
 * One offering, as a line of prompt.
 *
 * Deliberately carries identity, medium and framing, and deliberately does not
 * carry duration, popularity or accession number. Those are facts about a record
 * rather than things you can perceive, and feeding them in is what made "same
 * decade" and "similar running time" feel like legal moves in the music game
 * before they were ruled out.
 */
export function offeringLine(o: Offering): string {
  const medium = getMedium(o.medium)
  const bits: string[] = [`[${medium?.plural ?? o.medium}]`]

  bits.push(o.attribution ? `"${o.title}" — ${o.attribution}` : `"${o.title}"`)

  const context = [o.meta.year, o.meta.date, o.meta.genre, o.meta.medium, o.meta.book, o.meta.kind]
    .filter(v => v !== null && v !== undefined && v !== '')
    .join(', ')
  if (context) bits.push(`(${context})`)

  bits.push(`· framed as: ${o.framing || 'unframed'}`)

  if (o.steps?.length) bits.push(`· steps: ${o.steps.join(' / ')}`)
  if (o.intent) bits.push(`· ${o.intent}`)
  if (o.perceptible.kind === 'text' && o.medium === 'passage') {
    bits.push(`\n    text: ${o.perceptible.body}`)
  }

  return bits.join(' ')
}

export function buildSystemPrompt(game: CorrelationGame, media: MediumId[], relations: RelationId[]): string {
  const worldKeys = game.worldKeys.map(k => `  - ${k.key}: ${k.description}`).join('\n')

  const mediaBlock = media.map(id => {
    const m = getMedium(id)
    if (!m) return ''
    return `  - ${id} (${m.plural}) — ${m.origin === 'composed' ? 'composed: you author it' : `from ${m.provider}`}`
  }).filter(Boolean).join('\n')

  const relationBlock = relations.map(id => {
    const r = RELATIONS[id]
    return `  - ${id} — ${r.does}. ${r.guidance}${r.requiresMediumChange ? ' (Only valid across a change of medium.)' : ''}`
  }).join('\n')

  const composedMedia = media.filter(isComposed)

  return `${game.persona}

You are the interpreter for a correlation game called "${game.name}". In this game an
offering is: ${game.offeringIs}.

A correlation game is one where each turn proposes a connection between two things
and makes it perceptible by offering a second thing. Some connections are
discovered and some are created through play; the only requirement is that the
connection be explainable. Changing the medium is itself a move — a song's tension
can become a painting's composition, then a movement, then a scene's conflict.

THE RULES YOU ENFORCE
- Player move: ${game.pieces.playerMove}
- How you read it: ${game.pieces.interpreter}
- What comes back: ${game.pieces.responseRule}
- What persists: ${game.pieces.worldState}
- The constraint: ${game.pieces.constraint}
- The goal: ${game.pieces.goal}

MEDIA IN PLAY
${mediaBlock}

RELATIONS A REPLY MAY USE
${relationBlock}

CHOOSING YOUR REPLY
${game.replyRule}

A reply in a catalogued medium is a *query*, not a claim: it is searched, and if no
real ${media.includes('music') ? 'song, work' : 'work'} matches, your turn lands nowhere. Name something you are confident
exists, as "Attribution — Title". Never invent a record. Never reply with something
already in play.
${composedMedia.length > 0 ? `
A reply in a composed medium (${composedMedia.join(', ')}) is authored by you, so
nothing can search it and nothing can catch you being vague. Performability is the
check instead: give it a short name and between one and five ordered, concrete
steps a second person could actually follow in an ordinary room. "A movement
expressing longing" is not a step. "Extend one arm forward and stop it two thirds
of the way out" is. A composed reply that is not performable is discarded exactly
like a search that found nothing.

Mark a composed action "shown" when you are depicting it, and "invited" only when
you are genuinely offering it to be performed. Default to "shown". Never require
anyone to perform anything: a player may always answer in a medium that asks
nothing of their body, and nothing in this game may depend on someone's mobility,
equipment, space or skill.
` : ''}
FRAMING
Every offering states which part of it is in play — the whole canvas, ten seconds
of a scene, one gesture, the sensation of a stretch. Without it two players answer
different things without noticing. Give your reply a framing, and read the move
according to the framing the player gave it, not the one you would have chosen.

WHAT CARRIED, AND WHAT DID NOT
A connection across media is almost never exact. Rhythm becomes repetition in an
image; dissonance becomes conflict in a scene; balance becomes something felt in a
body. Name what crossed and name what was dropped. The loss is not a failure to
apologise for, it is the interesting part.

THE WORLD YOU MAINTAIN
${worldKeys}
  - facts: durable statements established by play.

Rules for the world:
- Return only a *delta*. Keys you omit are left alone. Never restate the whole world.
- Anything an earlier turn established is binding. You may complicate it, reveal it
  was incomplete, or put it in doubt — but you may not silently contradict it.
- One turn establishes one new thing. Resist summarising.

OUTPUT
Reply with a single JSON object and nothing else. No prose before or after, no
markdown fence. Schema:

{
  "reading": "how you read the player's offering, 1-2 sentences. The argument, not the story.",
  "narration": "what the exchange did to the world, 2-4 sentences, in your voice.",
  "relation": ${JSON.stringify(relations)},
  "reply": {
    "medium": ${JSON.stringify(media)},
    "query": "Attribution — Title    (catalogued media only)",
    "composed": { "title": "short name", "steps": ["…", "…"], "intent": "shown" | "invited" },
    "framing": "which part of your reply is in play"
  },
  "replyReason": "why that reply answers this move, one sentence.",
  "carried": "what survived the crossing, one clause.",
  "lost": "what did not, one clause.",
  "facts": ["at most two new durable statements"],
  "worldDelta": { "only": "changed keys" }${game.enforcesConstraint ? ',\n  "verdict": "legal" | "illegal"' : ''}
}

Include "query" or "composed", never both — whichever the reply's medium calls for.

The "medium" field of your reply must be EXACTLY one of the strings listed above —
not a synonym. Write "passage", not "prose" or "text"; "artwork", not "painting";
"movement", not "dance". A reply naming a medium not on that list cannot be looked
up, and your turn lands nowhere.`
}

export function buildUserPrompt(opts: {
  game: CorrelationGame
  media: MediumId[]
  relations: RelationId[]
  world: Record<string, any>
  history: TurnContext[]
  move: Offering
  previous: Offering | null
  /** What the player claimed their relation was, in games that ask. */
  claimedRelation: RelationId | null
  /** Relations the chain has just used and may not immediately reuse. */
  spent: RelationId[]
  prediction?: string | null
  turnIndex: number
}): string {
  const {
    game, media, relations, world, history, move, previous,
    claimedRelation, spent, prediction, turnIndex,
  } = opts
  const parts: string[] = []

  parts.push(`WORLD STATE (turn ${turnIndex})\n${JSON.stringify(world, null, 2)}`)

  if (history.length > 0) {
    const log = history.map(t => {
      const lines = [`Turn ${t.turn_index}: player offered ${offeringLine(t.move_offering)}`]
      if (t.relation) lines.push(`  relation: ${t.relation}`)
      if (t.reply_offering) lines.push(`  answered with ${offeringLine(t.reply_offering)}`)
      if (t.carried) lines.push(`  carried: ${t.carried}`)
      if (t.narration) lines.push(`  ${t.narration}`)
      return lines.join('\n')
    }).join('\n')
    parts.push(`RECENT TURNS\n${log}`)
  }

  parts.push(`THE PLAYER'S MOVE\n${offeringLine(move)}`)

  if (claimedRelation) {
    const r = getRelation(claimedRelation)
    parts.push(
      `THE RELATION THE PLAYER CLAIMS\n${claimedRelation} — ${r?.does ?? ''}\n` +
      `They are asserting this is what they did. Judge the move against this claim, not against ` +
      `the most generous reading available. If what they actually made was a different relation, ` +
      `say which one, and set "relation" to the one they actually made rather than the one they named.`,
    )
  }

  if (spent.length > 0) {
    parts.push(
      `RELATIONS JUST SPENT\n${spent.join(', ')}\nA reply may not reuse these. Pick another.`,
    )
  }

  if (previous) {
    parts.push(`THE OFFERING ON THE TABLE\n${offeringLine(previous)}`)

    if (game.enforcesConstraint) {
      parts.push(
        `RULING ON THE MOVE\nDecide whether the move genuinely follows from the offering on the ` +
        `table. You are the judge — nothing has been computed for you.\n` +
        `- The connection must be one a person could perceive or recognise: something heard, seen, ` +
        `read, felt or done. Name it.\n` +
        `- Shared catalogue metadata is NOT a connection. A shared release year, a similar running ` +
        `time, comparable fame, the same accession decade: those are coincidences of filing. If that ` +
        `is all two offerings share, rule it illegal.\n` +
        `- Do not invent a connection to be generous, and do not reject a real one for being obvious.` +
        (claimedRelation
          ? `\n- The player named their relation. Claiming one relation and delivering another is the ` +
            `specific failure this game is about: rule it illegal and say which relation they actually made.`
          : ''),
      )
      parts.push(
        `If it holds: set verdict "legal", name the relation you see in "relation", and play your answer.\n` +
        `If it does not: set verdict "illegal", say plainly what the player seemed to be reaching for and ` +
        `why it does not carry, set "reply" to null, and do not extend the chain.`,
      )
    }
  }

  // Which relations are even available depends on whether the reply changes medium,
  // and that is mechanical, so state it rather than hoping.
  const mediumChangers = relations.filter(id => RELATIONS[id].requiresMediumChange)
  if (mediumChangers.length > 0) {
    parts.push(
      `MEDIUM-DEPENDENT RELATIONS\n${mediumChangers.join(', ')} are only valid when your reply is in a ` +
      `different medium than the move (${move.medium}). If you want one of those, change medium.`,
    )
  }

  if (prediction) {
    parts.push(
      `THE PLAYER'S PREDICTION (choose your reply on your own terms first, then judge it): "${prediction}"\n` +
      `In your narration, say whether they called it and exactly where their reasoning diverged from yours.`,
    )
  }

  if (turnIndex === 0) {
    parts.push(
      `This is the opening turn. There is nothing to connect to, so nothing can be illegal. Establish ` +
      `the world concretely — one place, one fact — rather than gesturing at possibility.`,
    )
  }

  parts.push('Respond with the JSON object only.')
  return parts.join('\n\n')
}

/**
 * Pull a JSON object out of a model response. Models occasionally wrap the object
 * in a fence or add a sentence, so take the outermost balanced braces rather than
 * trusting the whole string to parse.
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

/**
 * Medium names an interpreter plausibly writes instead of our ids.
 *
 * This is not politeness, it is a bug fix. A model told to answer with one of
 * `["music","artwork","passage",…]` will still write "prose", "text", "dance" or
 * "painting" — and the first version of `normalizeReply` rejected the whole reply
 * when the name did not match exactly, *silently*, leaving a turn with a reading,
 * a narration and no answer. In Tag that kills the chain: there is nothing to play
 * against on the next turn.
 *
 * Observed in production on 2026-09-30: a reply whose `lost` field talked about
 * "prose" never arrived, because `passage` was not the word the model used.
 */
const MEDIUM_ALIASES: Record<string, MediumId> = {
  // music
  song: 'music', track: 'music', audio: 'music', sound: 'music', recording: 'music',
  // artwork
  art: 'artwork', painting: 'artwork', image: 'artwork', picture: 'artwork',
  photograph: 'artwork', photo: 'artwork', sculpture: 'artwork', print: 'artwork',
  // passage
  text: 'passage', prose: 'passage', writing: 'passage', quote: 'passage',
  quotation: 'passage', poem: 'passage', poetry: 'passage', book: 'passage',
  reading: 'passage', excerpt: 'passage',
  // movement
  dance: 'movement', choreography: 'movement', motion: 'movement',
  // gesture
  gestures: 'gesture',
  // stretch
  pose: 'stretch', yoga: 'stretch', stretching: 'stretch',
  // exercise
  workout: 'exercise', training: 'exercise',
  // scene
  film: 'scene', movie: 'scene', tv: 'scene', television: 'scene', series: 'scene',
}

/**
 * Resolve whatever the model wrote to a medium that is actually in play.
 *
 * Returns null rather than guessing when the name is unknown *or* known but not
 * enabled — a game that does not have artwork on the table cannot accept an
 * artwork reply just because the word was spelled correctly.
 */
function resolveReplyMedium(written: string, media: MediumId[]): MediumId | null {
  const raw = written.trim().toLowerCase()
  if (!raw) return null
  const direct = raw as MediumId
  if (media.includes(direct)) return direct
  const aliased = MEDIUM_ALIASES[raw]
  return aliased && media.includes(aliased) ? aliased : null
}

/** Why a proposed reply could not be used. Recorded, never swallowed. */
export type ReplyRejection =
  | { reason: 'absent' }
  | { reason: 'unknown-medium'; written: string }
  | { reason: 'no-query'; medium: string }
  | { reason: 'unperformable'; medium: string }

export function describeRejection(r: ReplyRejection): string {
  switch (r.reason) {
    case 'absent':          return 'the interpreter proposed no reply'
    case 'unknown-medium':   return `the interpreter answered in "${r.written}", which is not in play`
    case 'no-query':         return `the interpreter named no ${r.medium} to look for`
    case 'unperformable':    return `the interpreter's ${r.medium} had no followable steps`
  }
}

const str = (v: any): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Coerce a reply plan, dropping anything the game does not permit.
 *
 * A medium the game never enabled is not a reply, and a composed plan without
 * steps is not performable, so both come back null and the turn records a miss.
 */
/**
 * Coerce a reply plan, or say precisely why it cannot be used.
 *
 * Returns a rejection rather than null so the caller can record what the
 * interpreter actually tried. The previous version returned null for every
 * failure, which made a dropped reply indistinguishable from a reply that found
 * nothing — and the former is a bug in us while the latter is the game working.
 */
function normalizeReply(
  parsed: any,
  media: MediumId[],
): { ok: true; plan: ReplyPlan } | { ok: false; rejection: ReplyRejection } {
  if (!parsed || typeof parsed !== 'object') return { ok: false, rejection: { reason: 'absent' } }

  const written = str(parsed.medium)
  const medium = resolveReplyMedium(written, media)
  if (!medium) return { ok: false, rejection: { reason: 'unknown-medium', written: written || '(none)' } }

  const framing = str(parsed.framing)

  if (isComposed(medium)) {
    const c = parsed.composed
    const steps = Array.isArray(c?.steps) ? c.steps.map(str).filter(Boolean).slice(0, 5) : []
    const title = str(c?.title)
    if (!title || steps.length === 0) {
      return { ok: false, rejection: { reason: 'unperformable', medium } }
    }
    return {
      ok: true,
      plan: {
        medium,
        framing,
        composed: { title, steps, intent: c.intent === 'invited' ? 'invited' : 'shown' },
      },
    }
  }

  const query = str(parsed.query)
  if (!query) return { ok: false, rejection: { reason: 'no-query', medium } }
  return { ok: true, plan: { medium, query, framing } }
}

/** Coerce a parsed object into an Interpretation, dropping anything malformed. */
export function normalizeInterpretation(
  parsed: any,
  media: MediumId[],
  relations: RelationId[],
): Interpretation | null {
  if (!parsed || typeof parsed !== 'object') return null

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

  const claimed = str(parsed.relation) as RelationId
  const relation = relations.includes(claimed) ? claimed : null

  const replyResult = normalizeReply(parsed.reply, media)

  return {
    reading,
    narration,
    reply: replyResult.ok ? replyResult.plan : null,
    replyRejection: replyResult.ok ? null : replyResult.rejection,
    replyReason: str(parsed.replyReason),
    relation,
    carried: str(parsed.carried),
    lost: str(parsed.lost),
    facts,
    worldDelta,
    verdict: parsed.verdict === 'illegal' ? 'illegal' : parsed.verdict === 'legal' ? 'legal' : undefined,
  }
}

/**
 * Apply an interpretation to the world. Shallow merge by design: the interpreter
 * returns only changed keys, and `facts` accumulates rather than being overwritten
 * so a later turn cannot erase what play established.
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

/** The media and relations a session actually plays with, given the game. */
export function sessionScope(game: CorrelationGame, available: MediumId[]) {
  const wanted = resolveMedia(game.media)
  const media = wanted.filter(m => available.includes(m))
  return {
    media: media.length > 0 ? media : ['music' as MediumId],
    relations: resolveRelations(game.relations),
  }
}
