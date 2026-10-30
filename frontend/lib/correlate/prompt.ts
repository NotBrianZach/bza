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
  DEFAULT_TUNING, TUNING_AXES, axisValue, describeTuning, gatesLegality, isNeutral,
  mutedMedia, readingLengths, restateTuning,
  type Tuning,
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
  /**
   * The name of the game that turn was played under, when it is not the game
   * being played now.
   *
   * Set only across a switch, and absent otherwise so an unswitched game
   * produces exactly the prompt it produced before switching existed. The path
   * is deliberately not truncated at the boundary: truncating loses the
   * continuity that makes switching worth doing, and per-turn `mode` is what
   * makes the alternative sayable — the history can be shown while being
   * labelled as somebody else's rules.
   */
  played_as?: string | null
}

/**
 * One offering, as a line of prompt.
 *
 * Deliberately carries identity, medium and framing, and deliberately does not
 * carry duration, popularity or accession number. Those are facts about a record
 * rather than things you can perceive, and feeding them in is what made "same
 * decade" and "similar running time" feel like legal moves in the music game
 * before they were ruled out.
 *
 * That rule got applied one step too widely, though, and the casualty was
 * *content*. A resolver is free to put anything in `meta`, and two of them put the
 * only description of the record they have there — `album` for a track, `overview`
 * for a film, the latter already truncated to 400 characters for exactly this
 * purpose — and this function printed neither. So a film arrived as `"Stalker"
 * (1979, film)` with its plot summary sitting one key away unread, and the
 * interpreter did the only thing left: reasoned about the title. A plot summary is
 * not catalogue trivia, it is what the thing is *about*, and the whole complaint
 * this fixes — readings that never touch what a work says — starts here.
 */
export function offeringLine(o: Offering): string {
  const medium = getMedium(o.medium)
  const bits: string[] = [`[${medium?.plural ?? o.medium}]`]

  bits.push(o.attribution ? `"${o.title}" — ${o.attribution}` : `"${o.title}"`)

  const context = [
    o.meta.year, o.meta.date, o.meta.genre, o.meta.medium, o.meta.book, o.meta.kind,
    // Last, and labelled, because it is the one that is not a bare fact about the
    // filing: "from the album X" tells you a track's company, which is often the
    // only context a 30-second preview has.
    o.meta.album ? `from the album "${o.meta.album}"` : null,
  ]
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
  // Same principle, for the medium that ships a synopsis instead of its text. On
  // its own line because it is a sentence or two, not a parenthetical.
  if (o.meta.overview) bits.push(`\n    about: ${o.meta.overview}`)

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
  /** Media still within their share this turn. Omit for no proportions filter. */
  answerIn?: MediumId[],
  /**
   * True when the player supplied a prediction this turn, which adds the one
   * schema field a ruling on it needs.
   *
   * A flag rather than `game.id === 'prediction'` deliberately: the turn route
   * accepts the field from any game, so the schema has to follow the field and
   * not the registry. See the PREDICTION block in `buildUserPrompt`.
   */
  predicted = false,
  /**
   * Media whose records are attached to *this* turn as images, so the prompt can
   * stop claiming they cannot be seen.
   *
   * Load-bearing rather than cosmetic. The READING A RECORD YOU CANNOT PERCEIVE
   * block below says in so many words "You cannot hear the track or see the
   * canvas" — with a canvas attached that is the one false sentence in the
   * prompt, and false in the direction that matters: an interpreter told it
   * cannot see will write the reading-of-a-mood it writes when it has nothing,
   * while the picture sits unread in the same message.
   *
   * Per turn, not per game, because it depends on whether the particular records
   * in play have pictures. See `lookAt` in the turn route.
   */
  seen: MediumId[] = [],
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

  /**
   * Media that arrive here as a *name* rather than as their content.
   *
   * Every other class of medium hands the interpreter the thing itself: a passage
   * and the knowledge media print their text, a composed medium prints its steps.
   * These do not and cannot — nobody can put thirty seconds of audio or a painting
   * into a prompt — so a track reaches this model as `"Idioteque" — Radiohead` and
   * that is the whole of it.
   *
   * It is derived rather than listed so a fifth catalogue joins it by existing,
   * which matters because the failure it causes is invisible from inside the
   * prompt. A model with no content to be concrete *about* does not report that;
   * it writes the one kind of reading that is always available without content,
   * which is a reading of mood. That is the "everything is abstract and nothing
   * answers the song" complaint, and no tuning fixes it: the Abstraction axis sits
   * at Concrete by default, and "reach for what the move literally contains" is an
   * instruction a model cannot follow when it has not been told what the move
   * contains.
   */
  const unperceived = media.filter(
    m => !isComposed(m) && !isPropositional(m) && !getMedium(m)?.dependsOnUserLibrary,
    // A medium whose record is attached as an image this turn is not one of
    // these, for this turn. Subtracted rather than the block being suppressed
    // wholesale: with a painting attached and a song on the table, the warning is
    // still true of the song and still needed.
  ).filter(m => !seen.includes(m))

  // The enum the interpreter is handed is the media it may *answer* in, which is
  // not the media in play: a muted medium stays playable by the player and stays
  // readable here, it simply cannot be answered in. Never empty — see
  // weightedReplyMedia.
  //
  // `answerIn` is passed when the caller has already narrowed this further — the
  // proportions filter, which is what makes a share binding rather than advisory.
  // It arrives as an argument rather than being computed here because it depends
  // on the branch's reply history, which a prompt builder has no business knowing.
  const muted = mutedMedia(tuning, media)
  const answerable = answerIn && answerIn.length > 0
    ? answerIn
    : muted.length < media.length ? media.filter(m => !muted.includes(m)) : media

  const tuningBlock = describeTuning(tuning, media)

  // From the Breadth axis, because the schema is where a length instruction
  // actually binds — see `readingLengths`. The neutral stop returns the strings
  // this schema has always carried, so an untouched game's prompt is unchanged.
  const lengths = readingLengths(tuning)

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
${seen.length > 0 ? `
YOU CAN SEE THEM
The records in play this turn are attached to this message as images. Look at them
before you write anything. This is not a courtesy — it is the difference between
the two kinds of reading you can give, and only one of them is worth having:

- What is actually there. The composition, where the weight sits, what is cropped
  out, what the light is doing, who is looking at whom, what the picture is of.
  Name something a person standing in front of it would notice.
- What a title suggests. Available without looking, fluent, and the thing you
  write when you have nothing — a reading of mood, filed under the subject the
  name implies.

Reach for the first. If the picture contradicts what its title led you to expect,
say so; that is usually the most interesting sentence available about it.
` : ''}
${unperceived.length > 0 ? `
READING A RECORD YOU CANNOT PERCEIVE
${unperceived.map(id => getMedium(id)?.plural ?? id).join(', ')} arrive as a name, an attribution and at most a line
of description. You cannot hear the track or see the canvas, and the words of the
thing itself are never printed for you. That limit has one honest answer and one
dishonest one, and the dishonest one is the easier sentence to write.

- Honest: reach for what you actually know of *that* record — the one in THE
  PLAYER'S MOVE, not the one it answers. A song is its words as much as its sound:
  what it says, who is speaking, who they are speaking to, what happens in it, how
  it ends. Its title is a phrase in a language, so read it as one — Hallelujah is a
  word with a history, Idioteque is a coinage, A Case of You is half an idiom. Lead
  your reading with whatever of that you have.
- Dishonest: step past the record to the mood nearest it and connect moods. "Both
  hold a tension that never resolves", "each one circles a loss" — those are
  readings of nothing. They would be true of ten thousand records, which is how you
  can tell you have not committed to this one. If your reading would survive
  swapping the title out for another title, it is not a reading of this offering.

Name the words, the subject, the scene, the speaker. A referee who answers the
*theme* of a song is doing the job; one who answers its atmosphere is filing it.

DO NOT QUOTE. Say what the words are about; never put them in quotation marks as
though you were reading them off the sleeve. This is a flat prohibition rather than
a matter of confidence, because here you cannot tell the difference: these records
carry no text in this prompt, so nothing downstream can catch a misquote, and the
misquote you will actually make is not an invention from nothing — it is a real line
by the right artist attached to the wrong song of theirs, which is the most
convincing wrong thing available to you. Recounting what happens in a song is the
job. Reciting it is not, and you are not in a position to.

And if you do not know the record, say so plainly in "recognised" and read what you
genuinely have — the title, the artist, the album, the player's framing. A thin
reading of the real thing beats a confident reading of a mood, and both beat a
fluent reading of a record you have confused with another one.
` : ''}
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
- One turn establishes one new thing. Resist summarising.${predicted ? `
- A running prediction score is NOT yours to keep. Set "called" and the engine counts
  it; a "record" in your delta would be a second tally kept by the less reliable of
  the two. Say what the player's reasoning got right or missed in prose instead —
  that part no arithmetic can produce.` : ''}

OUTPUT
Reply with a single JSON object and nothing else. No prose before or after, no
markdown fence. Schema:

{${unperceived.length > 0 ? `
  "recognised": "what you actually know of ${selfReply ? 'your own offering above' : "THE PLAYER'S MOVE above — that record, not the one on the table"} — its subject, who is speaking, what happens in it — or \\"\\" if you do not know it. One or two sentences, no quotation, before you read anything.",` : ''}
  "reading": "how you read ${selfReply ? 'your own offering, now that you are the one answering it' : "the player's offering"}, ${lengths.reading}. The argument, not the story.",
  "narration": "what the exchange did to the world, ${lengths.narration}, in your voice.",
  "relation": ${relations.map(r => JSON.stringify(r)).join(' | ')},    (exactly one of these, as a bare string — not an array)
  "link": null | { "turn": <the turn number of an earlier exchange this one rhymes with>, "note": "what the two share, one clause" },
  "reply": {
    "medium": ${answerable.map(m => JSON.stringify(m)).join(' | ')},    (exactly one of these, as a bare string — not an array)
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
  "worldDelta": { "only": "changed keys" }${predicted ? ',\n  "called": true | false    (did the player\'s prediction land? a bare boolean, and it is recorded on the turn — do not also maintain a running score in worldDelta)' : ''}${game.enforcesConstraint && !selfReply && gatesLegality(tuning) ? ',\n  "verdict": "legal" | "illegal"' : ''}
}

Include "query" or "composed", never both — whichever the reply's medium calls for.
${unperceived.length > 0 ? `
Write the fields in the order they are listed. "recognised" is first because it is
what the rest is built on: naming the record before you read it is what stops the
reading being about a mood, and a reading written first will not go back and become
concrete. An empty "recognised" is a legitimate answer and costs you nothing — a
fabricated one costs the whole turn.
` : ''}

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
  /**
   * The game being left behind, on the turn a switch happens. See `switchedTo`.
   */
  switchedFrom?: { name: string; keptWorld: boolean; released: RelationId[] } | null
  prediction?: string | null
  turnIndex: number
  tuning?: Tuning
  /** The medium furthest behind its share, if any is behind by a whole reply. */
  due?: MediumId | null
}): string {
  const {
    game, media, relations, world, history, elsewhere, move, previous, parentIndex,
    claimedRelation, spent, switchedFrom, prediction, turnIndex, tuning, due,
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
      // Which turns were a different game. Said per turn rather than as one
      // sentence about the boundary, because an interpreter reading a long path
      // needs to know of each exchange whether its rules were these rules.
      if (t.played_as) lines.push(`  played as ${t.played_as}, not the game you are reading now`)
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

  /**
   * THE SWITCH, EXPLAINED TO THE INTERPRETER.
   *
   * Placed here on purpose: immediately after the path it has just read, and
   * before the move it is about to read. Everything above this block belongs to
   * the game being left — the exchanges, their readings, their relations — and
   * everything below belongs to the one being entered. Said in the other order,
   * or left unsaid, the prompt reads as a world that inexplicably emptied.
   *
   * It states the lifted constraint rather than letting it vanish. A prompt that
   * silently stops forbidding the relation it forbade last turn is
   * indistinguishable from a prompt that forgot, and the interpreter has no way
   * to tell which — so a reply that avoids the released relation out of caution
   * is the likely outcome, which is the opposite of what releasing it was for.
   */
  /**
   * A switch taken before anything was played is not a handoff.
   *
   * Both bullets in the block below are statements about history — "the exchanges
   * in THE PATH TO HERE happened under X", "the offering on the table is the
   * opening move" — and with no turns there is neither a path nor a table. Saying
   * them anyway would be the prompt describing a game that did not happen, which
   * is worse than saying nothing: the interpreter would go looking for the
   * inherited context it had been promised.
   *
   * So this case gets its own short block. It is also the honest description of
   * what the player did, which is choose a variant rather than hand one game off
   * to another.
   */
  if (switchedFrom && history.length === 0 && !previous) {
    parts.push(
      `WHICH GAME THIS IS\nThe player opened under ${switchedFrom.name} and changed their mind ` +
      `before playing anything, so this is a game of ${game.name} from its first move. Nothing ` +
      `has happened yet and nothing is inherited — treat the move below as an opening offering ` +
      `and establish ${game.name}'s world from it.`,
    )
  } else if (switchedFrom) {
    const released = switchedFrom.released.length > 0
      ? `\n- ${switchedFrom.released.join(', ')} ${switchedFrom.released.length === 1 ? 'was' : 'were'} ` +
        `spent in ${switchedFrom.name} and ${switchedFrom.released.length === 1 ? 'is' : 'are'} ` +
        `released, deliberately: "do not reuse the connection you just used" was that game's rule, ` +
        `not this one's. You may use ${switchedFrom.released.length === 1 ? 'it' : 'them'} if ` +
        `${switchedFrom.released.length === 1 ? 'it is' : 'they are'} the right answer.`
      : ''
    parts.push(
      `THE GAME HAS JUST CHANGED\nThis branch was being played as ${switchedFrom.name}. The player ` +
      `has switched it to ${game.name}, and this move is the first one under your rules.\n` +
      `- The exchanges in THE PATH TO HERE happened under ${switchedFrom.name}. They are real and ` +
      `they are theirs — read them as context you have inherited, not as turns you ruled on.\n` +
      (switchedFrom.keptWorld
        ? `- The world carries over: ${game.name} keeps the same shape, so nothing was reset.`
        : `- The world starts empty, which is where ${game.name} is supposed to start. The offering ` +
          `on the table is the opening move: treat it the way you would treat a first offering, and ` +
          `establish the world concretely from it rather than importing anything from above.`) +
      released,
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
      /**
       * HOW STRICTLY TO RULE IS THE FRICTION AXIS'S BUSINESS.
       *
       * This block used to be static, which had two consequences. "Agreeable" and
       * "Adversarial" ruled identically — the axis that exists to say whether the
       * partner goes with the player or argues had no bearing on the sharpest form
       * that choice takes. And at the default the prompt contradicted itself in one
       * word: the tuning block asks for "the most generous available reading of the
       * move" while this block said "do not invent a connection to be generous".
       *
       * Reported from a real game: a player at Agreeable had a move turned away and
       * said it should not have been possible. It was, at every setting.
       *
       * THE FLOOR DOES NOT MOVE WITH IT. Filing coincidences stay illegal at every
       * setting, because that is the one rule this game has — an agreeable referee
       * that accepts anything is not a lenient referee, it is the end of the game.
       * Generosity decides a doubtful reading; it cannot turn a coincidence of
       * filing into a connection.
       */
      if (!gatesLegality(tuning)) {
        // The agreeable side. Not a lenient ruling — no ruling. The player asked
        // the partner to go with them, so finding the thread is the partner's
        // job here rather than a test the move has to pass.
        parts.push(
          `NAMING THE THREAD\nThe player has asked you to go with them, so this move is not on ` +
          `trial and you are not judging it. Find the connection and name it: take the most ` +
          `generous perceivable reading available, and where the player has not spelled one out, ` +
          `make one — at this setting the work of finding the thread is yours, not theirs.\n` +
          `- Name something a person could perceive or recognise: something heard, seen, read, ` +
          `felt or done.\n` +
          `- Shared catalogue metadata is still not a thread. A shared release year, a similar ` +
          `running time, the same accession decade: if a coincidence of filing is the only thing ` +
          `you can see, look again for something perceivable rather than naming the coincidence. ` +
          `Look harder — do not refuse.\n` +
          `- There is no verdict to set and nothing to turn away. Name the thread and extend the ` +
          `chain.` +
          (claimedRelation
            ? `\n- The player named their relation. If what they made reads as a different one, ` +
              `say which, and set "relation" to the one they actually made — but play on either way.`
            : ''),
        )
      } else {
        const friction = tuning ? axisValue(tuning, 'friction') : TUNING_AXES.friction.neutral
        const howToRule = friction >= 3
          ? `- The player has asked you to push back. Hold the move to the connection it ` +
            `actually makes rather than the best one available to it, and do not supply a ` +
            `reading it did not earn.`
          : `- Do not invent a connection that is not there.`
        parts.push(
          `RULING ON THE MOVE\nDecide whether the move genuinely follows from the offering on the ` +
          `table. You are the judge — nothing has been computed for you.\n` +
          `- The connection must be one a person could perceive or recognise: something heard, seen, ` +
          `read, felt or done. Name it.\n` +
          `- Shared catalogue metadata is NOT a connection. A shared release year, a similar running ` +
          `time, comparable fame, the same accession decade: those are coincidences of filing. If that ` +
          `is all two offerings share, rule it illegal.\n` +
          `- Do not reject a real connection for being obvious.\n` +
          howToRule +
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
  // becomes all stretches and nothing notices. That is why the enum is filtered
  // rather than this paragraph being trusted — and why this paragraph no longer
  // ends "do not force it", which is the sentence the model took us up on.
  if (due) {
    const label = getMedium(due)?.plural ?? due
    parts.push(
      `THE BALANCE SO FAR\nThis branch is at least one whole reply short of what the player ` +
      `asked for in ${label}, which is why ${label} is in the list you may answer in. The ` +
      `media that are already over their share have been removed from that list, so there is ` +
      `no need to ration yourself — answer with the best connection available from what you ` +
      `have been given.`,
    )
  }

  if (tuning && !isNeutral(tuning)) {
    parts.push(
      `The weighting in your instructions is what the player has set as of this turn. They may ` +
      `have just changed it; answer to what it says now, not to what previous turns did.`,
    )
    // And the half of it that nothing enforces, said again here rather than only in
    // the system prompt — see `restateTuning` for the measurement that made this
    // necessary. Position is the whole point: this lands next to the decision it is
    // trying to change, not four hundred lines above it.
    const standing = restateTuning(tuning)
    if (standing) parts.push(standing)
  }

  /**
   * THE PREDICTION, AND THE TWO WAYS TO GET IT WRONG.
   *
   * This block is in `buildUserPrompt` rather than in Prediction's own registry
   * entry, which means it is reached by *every* game — the route accepts the
   * field unconditionally and only the composer gates it. So the rules have to
   * stand on their own here, without the game's persona behind them.
   *
   * Ordering first, because a guess read before the answer is chosen stops being
   * a guess and becomes a suggestion. That much was already here.
   *
   * What was not, and is the more likely failure: **swerving**. An interpreter
   * that treats the guess as something to resist will avoid an answer the player
   * correctly predicted, which punishes a good read and makes the interpreter
   * unlearnable — the exact thing the game exists to let you learn. It is also
   * invisible from inside the turn: a swerved answer looks like an independent
   * one. So the instruction is stated positively, and "being predicted is this
   * working" is said outright rather than implied.
   */
  if (prediction) {
    parts.push(
      `THE PLAYER'S PREDICTION\n"${prediction}"\n` +
      `Choose your reply on your own terms, then read this. The ordering is not suspicion of the ` +
      `player — it is that a guess read first becomes a suggestion, and then there was nothing for ` +
      `them to have predicted.\n` +
      `- If they called it: say so plainly, and play that answer anyway. Reaching for something ` +
      `else because they saw it coming is the one move that makes you impossible to learn, and it ` +
      `is a worse outcome than being obvious. Set "called" to true.\n` +
      `- If they missed: say exactly where their reasoning diverged from yours, in terms they could ` +
      `use to call it next time. Set "called" to false.\n` +
      `- Either way you are on their side. The aim is that they get good at reading you, so the ` +
      `reasoning you give is the thing they are owed — not a verdict on their guess.`,
    )
  }

  if (turnIndex === 0) {
    parts.push(
      `This is the opening turn. There is nothing to connect to, so nothing can be illegal. Establish ` +
      `the world concretely — one place, one fact — rather than gesturing at possibility.`,
    )
  }

  // Last, which is the whole of why it works. See `restateGame`.
  if (!selfReply) parts.push(restateGame(game))

  parts.push('Respond with the JSON object only.')
  return parts.join('\n\n')
}

/**
 * The game's own rules, restated at the point of deciding.
 *
 * Measured rather than guessed at, because the number is the argument. The system
 * prompt is 14.6–16.3k characters depending on the game, and **93% of its lines
 * are identical between any two games**: 3.1k characters of Tag's prompt are
 * Tag's, and almost all of that sits in the first 11%. After it come eleven
 * thousand characters of instruction every game shares — how to read a record you
 * cannot perceive, framing, what carried, the graph, pointing back, the world
 * rules, the output schema.
 *
 * The user prompt, which is what the model reads last, is 576–1,361 characters
 * and contains nothing about which game it is: the world, the move, the offering
 * on the table, the medium-dependent relations, and "respond with the JSON object
 * only". So at the moment of answering, the nearest thing in context saying this
 * is Transformation and not Tag was fifteen thousand characters ago, behind
 * everything that is true of all eleven. The reported symptom is that the games
 * feel same-y and the content rules are not respected, which is exactly what that
 * shape predicts.
 *
 * This is not a new idea in this file — it is the move `restateTuning` already
 * made, and its comment says why: "Position is the whole point: this lands next
 * to the decision it is trying to change, not four hundred lines above it." The
 * same was never done for the game itself, which is the stranger omission of the
 * two.
 *
 * Kept short and phrased as instruction rather than reference. The system prompt
 * lists the six pieces so they can be consulted; this restates the four that bind
 * a single answer, which is a different job. Suppressed on a self-reply, where the
 * prompt is already carrying `SELF_REPLY_GUIDANCE` and a second block about whose
 * rules apply would compete with it.
 */
export function restateGame(game: CorrelationGame): string {
  const keys = game.worldKeys.map(k => k.key).join(', ')
  return (
    `YOU ARE PLAYING ${game.name.toUpperCase()}, NOT A CORRELATION GAME IN GENERAL\n` +
    `Everything above about media, framing and the graph is true of all eleven games. These five ` +
    `lines are what makes this one itself, and they are the ones that bind the answer you are ` +
    `about to give.\n` +
    `- An offering here is ${game.offeringIs.toLowerCase()}. The move above is one of those, ` +
    `whatever else it also is.\n` +
    `- You read it as: ${game.pieces.interpreter}\n` +
    `- What must come back: ${game.replyRule}\n` +
    `- A turn holds only if: ${game.pieces.constraint}\n` +
    `- The world you move is ${keys} — change what this exchange actually changed, nothing else.\n` +
    `A reading that would have fitted any of the other ten games is the failure to avoid here. ` +
    `Answer in ${game.name}'s own terms.`
  )
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
  /**
   * The index just past the last comma at the root object's own level.
   *
   * Where a truncated response can be cut so that every value left in it arrived
   * complete. See the salvage below.
   */
  let lastMemberEnd = -1

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{' || ch === '[') depth++
    else if (ch === ']') depth--
    else if (ch === ',' && depth === 1) lastMemberEnd = i
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

  /**
   * SALVAGE A TRUNCATED OBJECT.
   *
   * Depth never returned to zero, which in practice means one thing: the
   * completion hit `max_tokens` mid-object. Before this, that was fatal — the
   * whole response was discarded and the turn came back as "the interpreter
   * returned something unreadable", with no retry anywhere (the three-stage
   * ladder in the turn route retries a *reply* that would not resolve, and has
   * never covered a response that would not parse). The player's recourse was to
   * press the button again, which is the reported symptom.
   *
   * The repair is deliberately lossy in one specific way: it cuts at the last
   * completed top-level member and closes the object, **discarding** any
   * partially-written value rather than closing its string. Closing the string
   * would be the easier repair and it is the wrong one — `"worldDelta": {"scene":
   * "A bus sh` would become a world whose scene is the string "A bus sh", and
   * that corruption would then be folded into every later turn on the branch. A
   * missing key is recoverable; a truncated one is a lie that persists.
   *
   * What is usually lost is `worldDelta` and whatever follows it in schema order,
   * because they are last — so the exchange is recorded and the world simply does
   * not advance on that turn. An absent `verdict` reads as legal, which is the
   * generous direction and matches what the default Friction setting already
   * promises.
   *
   * Returns null when nothing complete arrived at all, which is still a real
   * failure and still handled by the caller.
   */
  if (lastMemberEnd > start) {
    try {
      return JSON.parse(`${text.slice(start, lastMemberEnd)}}`)
    } catch {
      return null
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
 * A field the schema offers as a choice, which the model sometimes returns as a
 * one-element list of that choice.
 *
 * Two fields printed their options as a JSON array — `"relation":
 * ["association","translation",…]` and `"medium": ["music","artwork"]` — meaning
 * "pick one" and reading, reasonably, as "here is the value". `str()` returns ''
 * for an array, so both failures were silent in the worst way available: a wrapped
 * `relation` stored null and stopped Tag's no-repeated-connection rule from being
 * enforced, and a wrapped `medium` was rejected as "not in play", which spends the
 * corrective re-ask on an interpreter that had answered correctly the first time.
 * Observed intermittently on claude-haiku-4-5 at temperature 0.9.
 *
 * Both schema lines now read `"a" | "b"` instead, which is the actual fix. This is
 * the one that holds when the next model does it anyway.
 */
const oneOf = (v: any): string =>
  str(Array.isArray(v) && v.length === 1 ? v[0] : v)

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

  const written = oneOf(parsed.medium)
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

  // `recognised` is asked for and deliberately not kept. It is a thinking field:
  // its whole job is to be written *before* the reading, so the reading has a
  // record in front of it rather than a mood. There is no column for it on
  // listen_turns and it is not worth a migration to store a sentence the reading
  // is supposed to have absorbed — but it is also the one field that would show a
  // player *why* a turn was vague ("recognised": ""), so if that ever wants
  // showing, this is the line that drops it.
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

  // `oneOf` rather than `str`, and the reason is in its comment: a wrapped relation
  // used to store null, and a null relation is not a missing label — it is
  // `spentRelations` finding nothing spent, which is Tag's one rule silently not
  // being enforced.
  const claimed = oneOf(parsed.relation) as RelationId
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
    // Strict on the two booleans and null on anything else, including the string
    // "true". A hit rate is arithmetic over this column, so a coerced value is a
    // wrong number rather than a soft label — and null already has a meaning
    // ("no prediction was made") that a failed parse should fall into rather
    // than guessing at a verdict nobody gave.
    called: parsed.called === true ? true : parsed.called === false ? false : null,
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
  /**
   * True on the last attempt, where `media` is the composed floor rather than what
   * the player asked for.
   *
   * It changes what the prompt may claim. Two bullets below are true of a retry and
   * false of the floor: that the medium list excludes what the player turned off
   * (the floor is *made of* media they turned off), and that a composed reply should
   * not be "an escape from searching" (searching is what already failed twice).
   * Left unflagged, the floor would arrive carrying a retry's advice to prefer the
   * player's top medium — which is not on the list — and an instruction not to do
   * the only thing it is there to do.
   */
  floor?: boolean
}): string {
  const {
    game, media, relations, move, previous, problem, attempted, reading,
    selfReply = false, floor = false,
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
    floor
      ? `- Your reply medium must be exactly one of: ${media.join(', ')}. This is the last ` +
        `attempt. Two reaches into the media the player asked for came back with nothing real, ` +
        `and these are the media you author rather than search, so an answer here exists by ` +
        `construction. The player has these turned off — you are here because the game owes ` +
        `them an answer that exists more than it owes them one in the medium they chose.`
      : `- Your reply medium must be exactly one of: ${media.join(', ')}. That list already ` +
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
    // This bullet used to end "That is the safest way to answer this turn", and it
    // was measurably too persuasive: four of five retries in real games landed in a
    // composed medium, which is how a game set to mostly music filled up with
    // stretches. A composed reply cannot miss, which is worth saying, but "cannot
    // miss" is not "should be chosen" — the first medium listed is the one the
    // player asked for most, and that is the one to try first.
    bullets.push(floor
      ? `- You author a composed reply outright, so it cannot fail to be found: give a title ` +
        `and one to five concrete ordered steps. Make it genuinely answer the move — it is ` +
        `the record the player will be left holding, and "it was all that could be reached" ` +
        `does not excuse one that answers nothing.`
      : `- For a composed medium (${composed.join(', ')}) you author it outright, so it cannot ` +
        `fail to be found: give a title and one to five concrete ordered steps. Use one when ` +
        `it genuinely answers the move — not as an escape from searching. ` +
        `${plural(media[0])} is what the player has asked for most of; try that first.`,
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
 * Author a new game's premise for a scene it was not written for.
 *
 * The only place in this engine that produces *seed* content. Every other seed
 * is authored by hand in the registry, and `worldFor` only ever folds deltas
 * onto one — so this is a genuinely new kind of call and worth being clear about
 * why it is justified rather than a shortcut.
 *
 * It exists for one switch: between two games that both turn on a `scene`
 * (`duel` ↔ `transformation`). The scene the player has been playing crosses
 * over, and the destination's remaining authored keys are statements *about a
 * scene* — `invariants` is "what has survived every transformation so far". The
 * canned value is true of the game's own opening scene and false of the one that
 * arrived, so there are three options and two of them are bad: keep it and the
 * world asserts something untrue, drop it and the destination has lost the thing
 * it tracks. Writing it for the scene that is actually there is the third.
 *
 * Deliberately narrow, and the narrowness is the honesty guard. It is shown the
 * carried world and nothing else — no move, no history, no reply to plan — and
 * it may only return the keys it was asked for. It cannot establish a fact,
 * cannot touch the chain, and cannot invent a scene: the scene is an input.
 *
 * Paired with `buildSeedSystemPrompt` rather than with the full
 * `buildSystemPrompt`, because handing it the turn schema would invite it to
 * answer a turn nobody is playing.
 */
export function buildSeedSystemPrompt(to: CorrelationGame): string {
  return `${to.persona}

You are setting up a game of "${to.name}" on a scene that has arrived from another
game, mid-session. The player was playing something else; what they built is below,
and it is now what this game is about.

You are not taking a turn. Nothing is being answered, nothing is being judged, and
no offering is being chosen. You are writing down what is true of this scene at the
moment this game starts — the things ${to.name} keeps track of, which do not exist
yet because the scene came from somewhere else.

Two rules, and the first is the one that matters:

- **Read the scene you were given. Do not improve it, extend it, or replace it.**
  It is not your opening scene and it is not a draft. If it is an apartment, your
  answer is about an apartment. A premise you prefer would be exactly the thing
  this call exists to avoid — the canned one arriving mid-chain and contradicting
  what the player just played.
- Write only what the scene supports. If what you can say about it is thin, say
  something thin and true rather than something rich and invented.`
}

export function buildSeedPrompt(opts: {
  from: CorrelationGame
  to: CorrelationGame
  /** The keys that crossed, with the values they crossed with. */
  carried: Record<string, any>
  /** What needs authoring, with the destination's own description of each. */
  keys: { key: string; description: string }[]
}): string {
  const { from, to, carried, keys } = opts

  const carriedBlock = Object.entries(carried)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v, null, 2)}`)
    .join('\n\n')

  return [
    `WHERE THIS CAME FROM\nThe player has been playing ${from.name}. They have switched to ` +
    `${to.name}, and this is the first moment of it.`,
    `WHAT CROSSED OVER\n${carriedBlock}`,
    `WHAT ${to.name.toUpperCase()} NEEDS, AND DOES NOT HAVE\n` +
    keys.map(k => `- ${k.key}: ${k.description}`).join('\n'),
    `Write ${keys.length === 1 ? 'that one key' : 'those keys'} for the scene above. ` +
    `${keys.length === 1 ? 'It has' : 'They have'} to be true of it as it stands — ` +
    `including whatever the other game already did to it.`,
    `Reply with a single JSON object and nothing else, with exactly ` +
    `${keys.length === 1 ? 'this key' : 'these keys'} and no others:\n` +
    `{\n${keys.map(k => `  "${k.key}": …`).join(',\n')}\n}`,
  ].join('\n\n')
}

/**
 * Rule on a rhyme the player claims between two exchanges.
 *
 * The inverse of every other ruling in this engine, and the reason it needed its
 * own prompt rather than a flag on the turn loop: everywhere else the
 * interpreter judges a move the player *made*, and here it judges a reading the
 * player *noticed*. Those pull in opposite directions. A move is generously read
 * because the player committed to it and the chain has to continue; a claim is
 * ruled on squarely, because the player is reaching for credit and credit handed
 * out for nothing is worth nothing.
 *
 * So this is the one place in the section that does not take the most generous
 * available reading. It still does not punish: `thin` exists, it is a real
 * outcome, and a thin rhyme that is genuinely there beats a confident one that
 * is not.
 *
 * Shown both exchanges whole — move, reply, reading, what carried — because a
 * rhyme is a claim about the *shape* of two exchanges and the titles alone would
 * make it a claim about two records.
 */
export function buildClaimPrompt(opts: {
  game: CorrelationGame
  from: { turn_index: number; move_offering: Offering; reply_offering: Offering | null; reading: string | null; carried: string | null; relation: RelationId | null }
  to: { turn_index: number; move_offering: Offering; reply_offering: Offering | null; reading: string | null; carried: string | null; relation: RelationId | null }
  note: string
}): string {
  const { game, from, to, note } = opts

  const describe = (t: typeof from) => [
    `  move: ${offeringLine(t.move_offering)}`,
    t.reply_offering ? `  answered with: ${offeringLine(t.reply_offering)}` : '  nothing came back',
    t.relation ? `  relation: ${t.relation}` : '',
    t.reading ? `  how it was read: ${t.reading}` : '',
    t.carried ? `  carried: ${t.carried}` : '',
  ].filter(Boolean).join('\n')

  return [
    `A CLAIM, NOT A MOVE\nThe player is not playing a turn. They are pointing at two exchanges ` +
    `already on the record and saying the two rhyme — that one is doing again, in its own terms, ` +
    `what the other did. Your job is to rule on whether they are right.`,
    `EXCHANGE ${to.turn_index} (the earlier one)\n${describe(to)}`,
    `EXCHANGE ${from.turn_index} (the one they are standing on)\n${describe(from)}`,
    `WHAT THEY SAY THE TWO SHARE\n"${note}"`,
    `HOW TO RULE\nThis is the one ruling in this game you do NOT make generously, and the reason ` +
    `is not strictness: the player is reaching for credit here rather than committing to a move, ` +
    `and credit given for nothing is worth nothing. Judge the claim they actually made, not the ` +
    `best claim available about these two exchanges.\n` +
    `- "holds" — the thing they named is really running through both, and a second person shown ` +
    `the two would recognise it.\n` +
    `- "thin" — something is there and it is less than they said, or it is there for a different ` +
    `reason than they gave. Say which. A thin rhyme that is genuinely present is a real result ` +
    `and you should not grudge it.\n` +
    `- "no" — the two exchanges do not share what they claim. Say plainly what each one is ` +
    `actually doing, so the miss teaches them something.\n` +
    `Shared catalogue metadata is not a rhyme, at any verdict: a shared decade, a shared ` +
    `provider, comparable fame. Neither is "both are about loss" where the two losses have ` +
    `nothing perceivable in common — that is the vaguest claim available and it is always ` +
    `technically true.\n` +
    `If you can see a stronger rhyme between these two than the one they named, say so in your ` +
    `ruling. It does not change the verdict on their claim, and it is the most useful thing you ` +
    `can tell them.`,
    `Reply with a single JSON object and nothing else:\n` +
    `{\n` +
    `  "verdict": "holds" | "thin" | "no",\n` +
    `  "ruling": "one or two sentences, in your voice, on what the two do and do not share."\n` +
    `}`,
  ].join('\n\n')
}

/**
 * What the chain turned out to be about, once it is over.
 *
 * The payoff a game had no way to produce. Every entry in the registry carries a
 * `goal` — "exhaust a subject from every side it has", "map somewhere real enough
 * to come back to", "find out which interpretations only make sense once
 * something does them" — and nothing in this engine has ever measured one or
 * closed one. `status = 'finished'` was a flag the player set by hand, with
 * nothing on the other side of it.
 *
 * Two questions, deliberately in this order. What the chain became comes first,
 * because it is the interesting one and because it is the one a player cannot
 * answer for themselves: they chose every move and therefore cannot see the shape
 * from outside. The verdict on the goal comes second, and is asked for in the
 * same register the rest of the engine rules in — a thin success is a real one
 * here, the way a thin connection is.
 *
 * It is told the whole line rather than a window. This is the one call where the
 * *arc* is the subject, so the eight-turn history the turn loop uses would defeat
 * the question being asked.
 */
export function buildClosingPrompt(opts: {
  game: CorrelationGame
  world: Record<string, any>
  /** Every legal exchange on the line that was played, oldest first. */
  line: TurnContext[]
  /** How many turns went somewhere else, so the reading can acknowledge them. */
  elsewhereCount: number
  /** True when the game ran out of turns rather than being stopped by hand. */
  reachedLimit: boolean
}): string {
  const { game, world, line, elsewhereCount, reachedLimit } = opts

  const log = line.map(t => {
    const bits = [`Turn ${t.turn_index}: ${offeringLine(t.move_offering)}`]
    if (t.relation) bits.push(`  relation: ${t.relation}`)
    if (t.reply_offering) bits.push(`  answered with ${offeringLine(t.reply_offering)}`)
    if (t.carried) bits.push(`  carried: ${t.carried}`)
    return bits.join('\n')
  }).join('\n')

  return [
    `THE GAME IS OVER\n${reachedLimit
      ? `It ran to the end of its turns. Nobody stopped it early — this is the full length of it.`
      : `The player has closed it here.`}`,
    `THE LINE IT TOOK (${line.length} exchange${line.length === 1 ? '' : 's'})\n${log}`,
    elsewhereCount > 0
      ? `ELSEWHERE\n${elsewhereCount} other exchange${elsewhereCount === 1 ? '' : 's'} were played ` +
        `on branches this line did not go down. They happened; they are not what this line is.`
      : '',
    `THE WORLD AT THE END\n${JSON.stringify(world, null, 2)}`,
    `WHAT THIS GAME WAS FOR\n${game.pieces.goal}`,
    `Write the closing reading. Two short paragraphs, no headings, no list.\n\n` +
    `First: what this chain turned out to be *about* — the thing running through it that nobody ` +
    `stated, including the player. They chose every move and so cannot see the shape from outside; ` +
    `that is the whole value of this paragraph. Name it concretely, from what is actually in the ` +
    `log, and do not flatter it. If the chain wandered without a thread, say that — "it went ` +
    `everywhere and settled nowhere" is a real finding and a more useful one than an invented ` +
    `theme.\n\n` +
    `Second: how it did against what the game was for, in the same register you have ruled in all ` +
    `game. A thin success is a success here. Say what it reached and what it never got to.`,
    `Reply with a single JSON object and nothing else:\n` +
    `{\n  "closing": "the two paragraphs, separated by a blank line."\n}`,
  ].filter(Boolean).join('\n\n')
}

/**
 * Validate authored seed content against the shape the destination declared.
 *
 * Returns null — and the route then refuses the switch — rather than patching a
 * half-answer. That is deliberate, and it is the one place a model call gets to
 * block a switch: the alternative to a usable premise is the canned one, which
 * is the dishonest option this whole path exists to avoid. Better to tell the
 * player it could not be set up than to start Transformation on an apartment
 * while asserting there is still one man waiting.
 *
 * The expected shape comes from the game's own `seedWorld` value for that key,
 * so nothing has to be declared twice: `invariants` is an array because
 * Transformation seeds it with one, and a string arriving where an array belongs
 * is wrapped rather than rejected, because "one invariant" is a reasonable thing
 * to have meant and the shape is recoverable without guessing at content.
 */
export function normalizeSeed(
  parsed: any,
  to: CorrelationGame,
  keys: string[],
): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const seed: Record<string, unknown> = {}
  for (const key of keys) {
    const expected = (to.seedWorld as Record<string, unknown>)[key]
    const got = parsed[key]

    if (Array.isArray(expected)) {
      const list = Array.isArray(got) ? got : typeof got === 'string' ? [got] : null
      if (!list) return null
      const cleaned = list.map(v => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
      if (cleaned.length === 0) return null
      seed[key] = cleaned
      continue
    }

    if (typeof expected === 'string') {
      if (typeof got !== 'string' || !got.trim()) return null
      seed[key] = got.trim()
      continue
    }

    // No shape to check against — the key was seeded null or with a number, which
    // means the registry does not say what it looks like. Take what came back if
    // anything did, since refusing would be stricter than the game itself.
    if (got === undefined || got === null) return null
    seed[key] = got
  }
  return seed
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
