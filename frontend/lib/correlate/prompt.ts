/**
 * Builds the interpreter prompt for a correlation turn, and parses what comes
 * back. Server-only: this is the single place the rules are handed to a model, so
 * the registries stay declarative.
 */

import type {
  CorrelationGame, Interpretation, MediumId, MoveBy, Offering, RelationId, ReplyPlan,
} from './types'
import { getMedium, isComposed, isPropositional, resolveMedia } from './media'
import { SELF_REPLY_GUIDANCE } from './continuation'
import { RELATIONS, getRelation, resolveRelations } from './relations'
import { mergeWorld } from './graph'
import {
  DEFAULT_TUNING, describeTuning, isNeutral, mutedMedia, type Tuning,
} from './tuning'

/** A previous turn, trimmed to what the interpreter needs to stay consistent. */
export interface TurnContext {
  turn_index: number
  move_offering: Offering
  reply_offering: Offering | null
  relation: RelationId | null
  reading: string | null
  narration: string | null
  carried: string | null
  /** 'partner' when that turn's move was the interpreter's own answer. */
  move_by?: MoveBy | null
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
  // For a text medium the words *are* the offering, so they have to be here: an
  // interpreter given only "Noether's theorem" reasons about a title and guesses at
  // the content, which is the failure the knowledge media exist to avoid. Composed
  // media are excluded because their steps are already printed above.
  if (o.perceptible.kind === 'text' && !isComposed(o.medium)) {
    bits.push(`\n    text: ${o.perceptible.body}`)
  }

  return bits.join(' ')
}

/**
 * The system prompt.
 *
 * `tuning` is optional and contributes nothing when neutral — so a game nobody has
 * adjusted produces exactly the prompt it produced before tuning existed, which is
 * both the cheapest default and the one that cannot have changed anyone's play.
 *
 * `selfReply` adds the one section and the one schema field a turn needs when the
 * move it is reading is the interpreter's own previous answer. Off by default, for
 * the same reason: a player turn must produce the prompt it always produced.
 */
export function buildSystemPrompt(
  game: CorrelationGame,
  media: MediumId[],
  relations: RelationId[],
  tuning: Tuning = DEFAULT_TUNING,
  selfReply = false,
): string {
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
  // Media whose content is a proposition rather than a thing. They get their own
  // sentence because the ordinary "never invent a record" warning is not enough:
  // inventing a *track* produces a search miss, which is visible, and inventing a
  // *statement* produces fluent text that nothing downstream can catch.
  const propositional = media.filter(isPropositional)

  // The enum the interpreter is handed is the media it may *answer* in, which is
  // not the media in play: a muted medium stays playable by the player and stays
  // readable here, it simply cannot be answered in. Never empty — see
  // weightedReplyMedia.
  const muted = mutedMedia(tuning, media)
  const answerable = muted.length < media.length ? media.filter(m => !muted.includes(m)) : media

  const tuningBlock = describeTuning(tuning, media)

  return `${game.persona}

You are the interpreter for a correlation game called "${game.name}". In this game an
offering is: ${game.offeringIs}.

A correlation game is one where each turn proposes a connection between two things
and makes it perceptible by offering a second thing. Some connections are
discovered and some are created through play; the only requirement is that the
connection be explainable.

A change of medium *can* be the move — a song's tension becoming a painting's
composition, then a movement, then a scene's conflict. It is not required, and a
connection that lives inside one medium is not a lesser one. Change medium when the
connection is genuinely better said in another; stay when it is not. Only
translation and embodiment demand a crossing; every other relation is free either
way. Do not change medium merely to look inventive.

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
${tuningBlock ? `\n${tuningBlock}\n` : ''}
A reply in a catalogued medium is a *query*, not a claim: it is searched, and if no
real ${media.includes('music') ? 'song, work' : 'work'} matches, your turn lands nowhere. Name something you are confident
exists, as "Attribution — Title"${propositional.length > 0 ? ' — that form is for music, art and film; the knowledge media below are named differently' : ''}. Never invent a record. Never reply with something
already in play.
${propositional.length > 0 ? `
${propositional.map(id => getMedium(id)?.plural ?? id).join(', ')} work the same way and the rule matters more there,
because a wrong answer in those media does not look wrong. Name the theorem, the
effect, the creature or the place and let it be looked up — do NOT write out what it
says. The statement you are shown is the one the record actually carries; a statement
you compose yourself is a guess wearing the clothes of a fact, and it is the one kind
of invention here that a reader cannot catch.

NAME THEM, DO NOT DESCRIBE THEM. These records have no author, so there is no
"Attribution — " half and no gloss after a dash: the query is a proper name or an
established term, and nothing else. "Anglerfish", not "a fish that lures prey with
light". "Mount Erebus", not "a volcano that holds a lava lake". "Noether's theorem",
not "the one where symmetry gives you conservation".

This is the one failure in these media that does not announce itself. A query that
describes what you want instead of naming it does not come back empty — it comes
back with the encyclopedia's article about the *category*, because that is what
ranks for an abstract phrase. Answering a grackle with the definition of *species*
is the dullest move available here and it is a move you will make by accident. So:
name a member, never the class. A creature, not "species". A mountain, not
"geography". If your query contains "that", "which", "a kind of" or "something
like", you have described instead of named — rewrite it as the name of one thing.
` : ''}
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
${selfReply ? `\n${SELF_REPLY_GUIDANCE}\n` : ''}
WHAT CARRIED, AND WHAT DID NOT
A connection across media is almost never exact. Rhythm becomes repetition in an
image; dissonance becomes conflict in a scene; balance becomes something felt in a
body. Name what crossed and name what was dropped. The loss is not a failure to
apologise for, it is the interesting part.

THE GAME IS A GRAPH, NOT A LINE
A player may answer any earlier exchange, not only the latest one, so several
different turns can answer the same offering. You are shown THE PATH — the exchanges
leading to the one being answered, which is the history that binds — and separately
a short index of EXCHANGES ELSEWHERE, on branches that were not taken to get here.
What the path established is binding. What happened elsewhere did not happen to this
branch: you may notice it, you may not assume it.

POINTING BACK
If this exchange genuinely rhymes with an earlier one — the same quality surfacing
again, a pattern completing, something answered now that was left open then — say so
in "link" with that turn's number and one clause on what the two share. Prefer a turn
on another branch when you have one, because a correlation the player cannot see from
where they are standing is the observation worth volunteering. Name only a turn you
were actually shown, and set "link" to null rather than reaching: a callback to a turn
that does not exist is the same mistake as a reply to a record that does not exist.
The turn being answered is never a link — the exchange already answers it.

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
  "reading": "how you read ${selfReply ? 'your own offering, now that you are the one answering it' : "the player's offering"}, 1-2 sentences. The argument, not the story.",
  "narration": "what the exchange did to the world, 2-4 sentences, in your voice.",
  "relation": ${JSON.stringify(relations)},
  "link": null | { "turn": <the turn number of an earlier exchange this one rhymes with>, "note": "what the two share, one clause" },
  "reply": {
    "medium": ${JSON.stringify(answerable)},
    "query": "${propositional.length > 0
      ? `Attribution — Title; for ${propositional.map(id => getMedium(id)?.plural ?? id).join(', ')} the bare name, no attribution and no gloss`
      : 'Attribution — Title'}    (catalogued media only)",
    "composed": { "title": "short name", "steps": ["…", "…"], "intent": "shown" | "invited" },
    "framing": "which part of your reply is in play"
  },
  "replyReason": "why that reply answers this move, one sentence.",${selfReply
    ? '\n  "reframing": "the part of your OWN offering you are now answering — omit or leave empty for the whole of it.",'
    : ''}
  "carried": "what survived the crossing, one clause.",
  "lost": "what did not, one clause.",
  "facts": ["at most two new durable statements"],
  "worldDelta": { "only": "changed keys" }${game.enforcesConstraint && !selfReply ? ',\n  "verdict": "legal" | "illegal"' : ''}
}

Include "query" or "composed", never both — whichever the reply's medium calls for.

The "medium" field of your reply must be EXACTLY one of the strings listed above —
not a synonym. Write "passage", not "prose" or "text"; "artwork", not "painting";
"movement", not "dance". A reply naming a medium not on that list cannot be looked
up, and your turn lands nowhere.`
}

/** One exchange on a branch the player is not standing on. */
export interface ElsewhereContext {
  turn_index: number
  move_offering: Offering
  reply_offering: Offering | null
  carried: string | null
}

export function buildUserPrompt(opts: {
  game: CorrelationGame
  media: MediumId[]
  relations: RelationId[]
  world: Record<string, any>
  /** The exchanges on the path to the one being answered, oldest first. */
  history: TurnContext[]
  /**
   * Exchanges on other branches, named so a callback can reach them. Deliberately
   * thinner than the path: it is there to be pointed at, not to be reasoned from.
   */
  elsewhere?: ElsewhereContext[]
  move: Offering
  previous: Offering | null
  /**
   * True when `move` is the interpreter's own previous answer and the player took
   * no turn. Changes who the move is attributed to and suppresses everything that
   * only makes sense about a player's claim.
   */
  selfReply?: boolean
  /** Which exchange the partner's own offering came out of, for a self-reply. */
  selfReplyFrom?: number | null
  /** How many turns in a row the partner has now taken, including this one. */
  selfReplyDepth?: number
  /** The turn being answered, when it is not simply the newest one. */
  parentIndex?: number | null
  /** What the player claimed their relation was, in games that ask. */
  claimedRelation: RelationId | null
  /** Relations this branch has just used and may not immediately reuse. */
  spent: RelationId[]
  prediction?: string | null
  turnIndex: number
  tuning?: Tuning
  /** The medium the weights say is owed a turn, if any. */
  due?: MediumId | null
}): string {
  const {
    game, media, relations, world, history, elsewhere, move, previous, parentIndex,
    claimedRelation, spent, prediction, turnIndex, tuning, due,
    selfReply = false, selfReplyFrom, selfReplyDepth = 0,
  } = opts
  const parts: string[] = []

  parts.push(`WORLD STATE (turn ${turnIndex})\n${JSON.stringify(world, null, 2)}`)

  if (history.length > 0) {
    const log = history.map(t => {
      // Who played each move, because a path may now contain turns the player took
      // no part in. An interpreter shown its own offering attributed to the player
      // reads the branch as a conversation it was not having.
      const by = t.move_by === 'partner' ? 'you yourself offered' : 'player offered'
      const lines = [`Turn ${t.turn_index}: ${by} ${offeringLine(t.move_offering)}`]
      if (t.relation) lines.push(`  relation: ${t.relation}`)
      if (t.reply_offering) lines.push(`  answered with ${offeringLine(t.reply_offering)}`)
      if (t.carried) lines.push(`  carried: ${t.carried}`)
      if (t.narration) lines.push(`  ${t.narration}`)
      return lines.join('\n')
    }).join('\n')
    parts.push(`THE PATH TO HERE\n${log}`)
  }

  // Thin by design: a title, a medium and what carried is enough to recognise an
  // exchange and point at it, and anything more would invite reasoning from a
  // branch that did not happen here.
  if (elsewhere && elsewhere.length > 0) {
    const index = elsewhere.map(t => {
      const reply = t.reply_offering
        ? ` → ${t.reply_offering.title} (${getMedium(t.reply_offering.medium)?.plural ?? t.reply_offering.medium})`
        : ''
      const carried = t.carried ? ` · carried: ${t.carried}` : ''
      return `Turn ${t.turn_index}: ${t.move_offering.title} ` +
        `(${getMedium(t.move_offering.medium)?.plural ?? t.move_offering.medium})${reply}${carried}`
    }).join('\n')
    parts.push(
      `EXCHANGES ELSEWHERE (other branches — available to point at, not to reason from)\n${index}`,
    )
  }

  if (typeof parentIndex === 'number') {
    parts.push(
      `WHICH EXCHANGE IS BEING ANSWERED\nTurn ${parentIndex}. The player has gone back to it ` +
      `rather than continuing from the newest exchange, so the offering on the table is the one ` +
      `turn ${parentIndex} left there, and nothing played after it has happened on this branch.`,
    )
  }

  // The move is the partner's own last answer, so saying "the player's move" here
  // would be the one false sentence in the prompt — and the one most likely to be
  // believed, because every other turn it is true.
  if (selfReply) {
    const from = typeof selfReplyFrom === 'number' ? ` from turn ${selfReplyFrom}` : ''
    const run = selfReplyDepth > 1
      ? ` This is turn ${selfReplyDepth} of a run you have taken alone, so the last ` +
        `${selfReplyDepth - 1} offerings on this branch were also yours — answer outward, ` +
        `not further in.`
      : ''
    parts.push(
      `YOUR OWN OFFERING, NOW THE MOVE\n${offeringLine(move)}\n` +
      `This is the answer you played${from}. Nobody has answered it, and you are the one ` +
      `answering it.${run}`,
    )
  } else {
    parts.push(`THE PLAYER'S MOVE\n${offeringLine(move)}`)
  }

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

    // Never on a self-reply, even if a caller somehow supplies both. There is no
    // claim to rule on when the move was not played by anybody, and an interpreter
    // invited to judge its own offering is not a judge.
    if (game.enforcesConstraint && !selfReply) {
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

  // Proportion is the one instruction a single completion cannot follow: every
  // reply looks locally right, so "mostly music with the occasional stretch"
  // becomes all music and nothing notices. The arithmetic is done from the log and
  // the result is stated — advisory, because a ratio is a worse reason to answer in
  // a medium than the connection is.
  if (due) {
    const label = getMedium(due)?.plural ?? due
    parts.push(
      `THE BALANCE SO FAR\nYour recent replies on this branch are short of what the player's ` +
      `weighting asks for in ${label}. If a connection in ${label} is available and genuinely ` +
      `answers this move, that is the one to play. Do not force it — a weaker ${label} answer ` +
      `is worse than a strong one anywhere else, and the shortfall will keep.`,
    )
  }

  if (tuning && !isNeutral(tuning)) {
    parts.push(
      `The weighting in your instructions is what the player has set as of this turn. They may ` +
      `have just changed it; answer to what it says now, not to what previous turns did.`,
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
  // theorem — a model reaching for this medium reaches for the field, not the id
  math: 'theorem', mathematics: 'theorem', proof: 'theorem', lemma: 'theorem',
  identity: 'theorem', conjecture: 'theorem', axiom: 'theorem', equation: 'theorem',
  // phenomenon
  science: 'phenomenon', fact: 'phenomenon', physics: 'phenomenon', chemistry: 'phenomenon',
  law: 'phenomenon', effect: 'phenomenon', experiment: 'phenomenon',
  // organism
  animal: 'organism', creature: 'organism', species: 'organism', plant: 'organism',
  biology: 'organism', bird: 'organism', insect: 'organism', fungus: 'organism',
  // place
  location: 'place', city: 'place', geography: 'place', landscape: 'place',
  mountain: 'place', river: 'place', island: 'place',
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
  | { reason: 'muted-medium'; medium: string }

export function describeRejection(r: ReplyRejection): string {
  switch (r.reason) {
    case 'absent':          return 'the interpreter proposed no reply'
    case 'unknown-medium':   return `the interpreter answered in "${r.written}", which is not in play`
    case 'no-query':         return `the interpreter named no ${r.medium} to look for`
    case 'unperformable':    return `the interpreter's ${r.medium} had no followable steps`
    // Distinct from unknown-medium on purpose: the player did this, deliberately,
    // and probably a moment ago. It is not a bug in the prompt or the alias table,
    // and reading it as one would send someone hunting for a defect.
    case 'muted-medium':     return `the interpreter answered in ${r.medium}, which you have turned off`
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
  muted: MediumId[] = [],
): { ok: true; plan: ReplyPlan } | { ok: false; rejection: ReplyRejection } {
  if (!parsed || typeof parsed !== 'object') return { ok: false, rejection: { reason: 'absent' } }

  const written = str(parsed.medium)
  const medium = resolveReplyMedium(written, media)
  if (!medium) return { ok: false, rejection: { reason: 'unknown-medium', written: written || '(none)' } }

  // A weight of zero is arithmetic, not a hint: the medium is dropped from the
  // prompt's enum *and* refused here, because a model that answers in it anyway
  // must not be the thing that decides.
  if (muted.includes(medium)) return { ok: false, rejection: { reason: 'muted-medium', medium } }

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

/** Everything about the turn's own position that coercion has to know. */
export interface NormalizeOptions {
  /** Media the player has turned off. Refused rather than resolved. */
  muted?: MediumId[]
  /**
   * Turn indexes the interpreter was actually shown, so a callback to a turn that
   * does not exist is dropped rather than stored. Undefined means "do not accept
   * links at all", which is what every caller that has no graph wants.
   */
  linkable?: number[]
}

/**
 * Coerce a volunteered callback, or drop it.
 *
 * Validated against the turns the interpreter was shown for the same reason a reply
 * is searched rather than asserted: a link to turn 12 of a nine-turn game is an
 * invented record, and the fact that it is cheap to invent is exactly why it has to
 * be checked. A link with no note is also dropped — "this rhymes with turn 3" with
 * nothing said about how is not an observation.
 */
function normalizeLink(parsed: any, linkable?: number[]): Interpretation['link'] {
  if (!parsed || typeof parsed !== 'object' || !linkable || linkable.length === 0) return null

  const raw = (parsed as { turn?: unknown }).turn
  const turnIndex = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isInteger(turnIndex) || !linkable.includes(turnIndex)) return null

  const note = str((parsed as { note?: unknown }).note)
  if (!note) return null

  return { turnIndex, note }
}

/** Coerce a parsed object into an Interpretation, dropping anything malformed. */
export function normalizeInterpretation(
  parsed: any,
  media: MediumId[],
  relations: RelationId[],
  opts: NormalizeOptions = {},
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

  const replyResult = normalizeReply(parsed.reply, media, opts.muted ?? [])

  return {
    reading,
    narration,
    reply: replyResult.ok ? replyResult.plan : null,
    replyRejection: replyResult.ok ? null : replyResult.rejection,
    replyReason: str(parsed.replyReason),
    // Only ever asked for on a self-reply turn, and only ever applied there. A
    // player turn that comes back with one is ignored by the route — re-framing
    // somebody else's offering is not a move the interpreter gets to make.
    reframing: str(parsed.reframing),
    relation,
    link: normalizeLink(parsed.link, opts.linkable),
    carried: str(parsed.carried),
    lost: str(parsed.lost),
    facts,
    worldDelta,
    verdict: parsed.verdict === 'illegal' ? 'illegal' : parsed.verdict === 'legal' ? 'legal' : undefined,
  }
}

/**
 * Apply an interpretation to the world.
 *
 * Shallow merge by design: the interpreter returns only changed keys, and `facts`
 * accumulates rather than being overwritten so a later turn cannot erase what play
 * established. The merge itself lives in graph.ts because a branched game also has
 * to recompute a world from the deltas along a path, and those two must be the same
 * rule — if they ever differed, reopening a game would show a different world than
 * playing it did.
 */
export function applyWorldDelta(
  world: Record<string, any>,
  interpretation: Interpretation,
): Record<string, any> {
  return mergeWorld(world, interpretation.worldDelta, interpretation.facts)
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

/**
 * A corrective second ask, when the interpreter's reply could not be made real.
 *
 * An empty reply is not an acceptable outcome: the next turn has nothing to
 * answer, which in a chain game simply ends it. So a failed reply buys one more
 * attempt, told exactly what went wrong and restricted to media that cannot fail
 * for reasons outside the interpreter's control.
 *
 * It re-states the move rather than relying on conversation memory, because this
 * is a fresh completion and there is no thread.
 */
export function buildRetryPrompt(opts: {
  game: CorrelationGame
  media: MediumId[]
  relations: RelationId[]
  move: Offering
  previous: Offering | null
  /** What went wrong the first time, in plain words. */
  problem: string
  /** What it tried, so it does not try the same thing again. */
  attempted: string | null
  reading: string
  /** True when the move being re-answered is the interpreter's own offering. */
  selfReply?: boolean
}): string {
  const {
    game, media, relations, move, previous, problem, attempted, reading, selfReply = false,
  } = opts
  const parts: string[] = []

  parts.push(
    `YOUR LAST REPLY COULD NOT BE USED\n${problem}` +
    (attempted ? `\nYou tried: ${attempted}. Do not offer that again.` : ''),
  )
  parts.push(selfReply
    ? `YOUR OWN OFFERING, WHICH YOU ARE ANSWERING\n${offeringLine(move)}`
    : `THE PLAYER'S MOVE\n${offeringLine(move)}`)
  if (previous) parts.push(`THE OFFERING ON THE TABLE\n${offeringLine(previous)}`)
  parts.push(`YOUR READING OF THE MOVE (unchanged — keep it)\n${reading}`)

  // Each bullet is conditional on the media actually on offer. The first version of
  // this prompt named recordings, paintings and composed gestures unconditionally,
  // and in a session narrowed to one knowledge medium that is advice to answer in
  // three media that are not there — so the retry proposed one, was refused for
  // answering off-list, and the turn fell through to the server's own salvage
  // search. A corrective prompt that recommends the impossible is worse than none.
  const composed = media.filter(isComposed)
  const knowledge = media.filter(isPropositional)
  const catalogues = media.filter(m => !isComposed(m) && !isPropositional(m))
  const plural = (id: MediumId) => getMedium(id)?.plural ?? id

  const bullets: string[] = [
    `- Your reply medium must be exactly one of: ${media.join(', ')}. That list already ` +
    `excludes anything the player has turned off, so it is the whole of what is available.`,
    `- Your relation must be exactly one of: ${relations.join(', ')}.`,
  ]

  if (media.length === 1) {
    bullets.push(
      `- ${plural(media[0])} is the only medium open to you on this turn, so the answer ` +
      `has to be one. There is nothing to change medium to, and "the connection is better ` +
      `said elsewhere" is not available — find the one that can be said here.`,
    )
  }

  if (catalogues.length > 0) {
    bullets.push(
      `- For ${catalogues.map(plural).join(' and ')}, name something well known enough to be ` +
      `found — a famous recording, a famous painting. This is the second attempt; reach for ` +
      `the obvious rather than the obscure.`,
    )
  }

  if (knowledge.length > 0) {
    bullets.push(
      `- For ${knowledge.map(plural).join(', ')}, the query is a NAME and nothing else — one ` +
      `creature, one place, one named result. "Anglerfish", not "a fish that lures prey with ` +
      `light"; a creature, never "species". A description does not come back empty, it comes ` +
      `back with the article about the category, which is the dullest answer there is. Reach ` +
      `for the well-known one.`,
    )
  }

  if (composed.length > 0) {
    bullets.push(
      `- For a composed medium (${composed.join(', ')}) you author it outright, so it cannot ` +
      `fail to be found: give a title and one to five concrete ordered steps. That is the ` +
      `safest way to answer this turn.`,
    )
  }

  parts.push(`ANSWER AGAIN. Constraints for this attempt:\n${bullets.join('\n')}`)
  parts.push(`Respond with the same JSON object as before, and nothing else.`)

  return parts.join('\n\n')
}

/**
 * An account of the reply the server found on its own, after the interpreter's two
 * attempts both failed to resolve.
 *
 * Needed because a salvaged turn used to be stored wearing the first pass's
 * narration, `carried` and `lost` — all three of which describe the reply the
 * interpreter *planned*, not the one that landed. Observed in production: a Life-only
 * game read a grackle, planned an anglerfish, salvaged something else entirely, and
 * stored prose about the anglerfish's lure underneath a record that was never played.
 * The reading of the move survives that (it is about the move, and the move has not
 * changed); everything that describes the crossing does not.
 *
 * Deliberately a small ask. The interpreter is not being invited to re-judge
 * anything or to revise its reading — only to say what, if anything, connects the
 * move to the record it has been handed, and to say so honestly when the answer is
 * "not much". A salvage is already a visible event in the UI; this is so the prose
 * agrees with it.
 */
export function buildSalvageAccountPrompt(opts: {
  move: Offering
  reply: Offering
  reading: string
  /** True when the move being accounted for is the interpreter's own offering. */
  selfReply?: boolean
}): string {
  const { move, reply, reading, selfReply = false } = opts

  return [
    `A REPLY WAS FOUND WITHOUT YOU\nTwo answers you proposed could not be found in any ` +
    `catalogue, so the server searched on its own terms and came back with the record ` +
    `below. It is real and it is now on the table. It was not your choice.`,
    selfReply
      ? `YOUR OWN OFFERING, WHICH WAS BEING ANSWERED\n${offeringLine(move)}`
      : `THE PLAYER'S MOVE\n${offeringLine(move)}`,
    `YOUR READING OF IT (unchanged — this still stands)\n${reading}`,
    `THE RECORD THAT LANDED\n${offeringLine(reply)}`,
    `Account for the exchange as it actually is. Do not re-judge the move, do not ` +
    `revise your reading, and do not describe the answer you wanted — that one is gone ` +
    `and saying anything about it here would be a lie about what is on the table.\n` +
    `If something genuinely connects the move to this record, name it. If the ` +
    `connection is thin, say it is thin. If there is none, say that plainly: a found ` +
    `record that answers nothing is an honest outcome and pretending otherwise is not.`,
    `Reply with a single JSON object and nothing else:\n` +
    `{\n` +
    `  "narration": "what this exchange is, 1-3 sentences, in your voice.",\n` +
    `  "carried": "what connects the two, one clause — or \\"\\" if nothing does.",\n` +
    `  "lost": "what this record does not answer, one clause — or \\"\\"."\n` +
    `}`,
  ].join('\n\n')
}

/**
 * Queries the server can try on its own, if two interpreter attempts both failed.
 *
 * Last resort before giving up, and ordered by how likely each is to mean
 * something — which used to be the wrong order. The quality the interpreter said
 * carried across went first, and in a game whose readings are abstract by design
 * that is four abstract nouns: `carried` of "the principle that survival requires
 * both fitting and signalling" became the query "principle survival requires
 * both", which a catalogue answers with whatever article is nearest to the words.
 *
 * So names first. The interpreter's own query failed to resolve in the medium it
 * chose, but it is the one *name* anywhere in the interpretation, and a name is
 * worth more to a catalogue than any amount of description.
 */
export function salvageQueries(interpretation: Interpretation, move: Offering): string[] {
  /**
   * Function words outlive a length filter and mean nothing to a search. Dropping
   * them is not enough to make a described query good — nothing is — but it stops
   * the seed being built entirely out of grammar.
   */
  const STOP = /^(?:that|this|those|these|with|from|into|onto|their|there|where|which|while|what|when|than|then|them|they|also|both|each|every|some|most|more|less|only|very|just|much|many|such|same|other|another|about|against|between|through|without|within|being|been|have|has|had|does|will|would|could|should|must|requires|require|something|anything|everything|itself|while)$/i

  const words = (s: string) => s
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP.test(w))
    .slice(0, 4)
    .join(' ')

  return [
    // Stripped of any "Name — gloss" tail, which is the half a catalogue chokes on.
    interpretation.reply?.query?.split(/\s+[-–—]\s+/)[0] ?? '',
    move.title,
    move.attribution ?? '',
    interpretation.carried ? words(interpretation.carried) : '',
  ].map(s => s.trim()).filter(Boolean)
}
