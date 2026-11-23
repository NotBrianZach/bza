/**
 * The Game Master for RPG mode: scenes for a journey the rules already decided.
 *
 * ── THE DIVISION OF LABOUR, WHICH IS THE WHOLE DESIGN ─────────────────────
 *
 * RPG mode had a board and no game. You stood on a map, pressed a concept
 * name, and read "the road opens to Long division" — which is a graph
 * operation wearing a cloak. What a tabletop game has that this did not is
 * somebody describing the place you are standing in and what just happened to
 * you.
 *
 * So: the TRAVERSAL rules, and the GM narrates. In a tabletop game the dice
 * and the rulebook decide, and the GM says what it looked like. Here
 * `offerKey` and the strength gate decide — whether a road opens, where it
 * leads, what is missing — and every one of those answers is computed before
 * a single token is generated and handed to the model as settled fact.
 *
 * The model is a `narrator` in the sense lib/correlate/games.ts means it, not
 * a `verifier`. It has no say in the outcome. That is not a stylistic
 * preference: a GM who could decide whether you had met a prerequisite would
 * be a learning system whose gate is a language model's opinion, and the
 * refusal in traversal.ts — the one thing that "must never relax" — would
 * relax every time the prose came out encouraging.
 *
 * ── WHAT THE GM MAY NOT DO ────────────────────────────────────────────────
 *
 * Four prohibitions, all in `SYSTEM`, and each is a specific failure this
 * surface would otherwise have:
 *
 *  1. It must not say the player has learned, mastered or understood
 *     anything. Only the verifier may say that, from a ruling on work. A
 *     scene that congratulates you on grasping long division is a false
 *     transcript of your own competence.
 *  2. It must not teach, define, hint, or pose a problem. The practice engine
 *     does that, under a verifier. Mathematics that arrives inside fiction
 *     arrives unchecked.
 *  3. It must not invent an outcome or contradict the one it was given. The
 *     outcome is an input.
 *  4. It must not promise what is through a door it was not told about. It
 *     knows where you are and where you just came from, and nothing else about
 *     the map.
 *
 * ── IT WORKS WITH NO MODEL AT ALL ─────────────────────────────────────────
 *
 * `unnarratedScene` builds a scene from the region's own recorded character,
 * so RPG mode is playable with `OPENROUTER_API_KEY` unset. Same discipline as
 * `unphrasedQuestion` in socratic.ts and `verifierConfig` in verify.ts: a
 * missing piece is named, and everything that does not depend on it keeps
 * working.
 */

import type { PlacedRegion } from './armature'

/** What the rules decided, which the GM is told and may not alter. */
export type SceneKind =
  /** First landfall: the journey begins here. */
  | 'start'
  /** A road opened and the party travelled. */
  | 'arrive'
  /** The key was real and opened nothing. `missing` says what is wanted. */
  | 'blocked'
  /** The key is not one the party holds. */
  | 'not-yours'
  /** Everything this key leads to has already been reached. */
  | 'spent'

export interface SceneContext {
  kind: SceneKind
  /** Where the party is standing now. For a refusal, where they still are. */
  region: PlacedRegion
  /** Where they came from, when they moved. */
  from?: PlacedRegion | null
  /** The concept offered as a key. */
  offered?: string
  /** The concept arrived at, for `start` and `arrive`. */
  arrivedAt?: string
  /** What is still wanted, for `blocked`. Names, not ids. */
  missing?: string[]
  /** Places already visited, newest last. Continuity, capped by the caller. */
  visited?: string[]
}

const MAX_VISITED = 6

/**
 * The part of a region's `because` that is about the PLACE.
 *
 * `because` is two things welded together: a sentence of setting — the
 * institutions, the law, the trade — and then the argument for why that
 * setting earned this area of mathematics. The second half is written for
 * somebody reading the map in an editor, and it frequently names the area
 * outright: Hasspab's says "Number theory is the mathematics that feels found
 * rather than built", Taiga's names real analysis.
 *
 * Sending that to the GM would hand a narrator the curriculum and then ask it
 * not to teach, which is a prohibition fighting its own context window. The
 * first sentence is the setting half and names no area in any of the
 * nineteen — checked by the test, not assumed, because the split is a
 * convention of how they were written rather than a guaranteed shape.
 *
 * Falls back to the whole string if there is no sentence break, which keeps a
 * future one-sentence `because` working rather than silently empty.
 */
export function settingOf(because: string): string {
  const first = because.split(/(?<=\.)\s+/)[0]
  return first && first.length > 20 ? first : because
}

/**
 * The GM's standing instructions.
 *
 * Long, and deliberately so: every line is a failure mode this surface would
 * otherwise have, and a short prompt here produces a narrator that teaches,
 * congratulates, and invents doors.
 */
export const SYSTEM = [
  'You are the Game Master of a tabletop role-playing session set on Armat, a continent of',
  'twenty-one city states. One player. Second person, present tense.',
  '',
  'WHAT YOU DO: describe where the player is standing and what just happened to them. Two short',
  'paragraphs, four sentences at the very most. Concrete physical detail over atmosphere: who is',
  'in the room, what it smells like, what somebody is doing with their hands. End on the',
  'situation the player is now in, not on a question and not on a summary.',
  '',
  'WHAT DECIDES THINGS: not you. The outcome of the move is given to you below as settled fact,',
  'and it was decided by the rules before you were asked. Narrate THAT outcome. Never invent a',
  'different one, never soften a refusal into a success, never hint that the refusal might lift.',
  '',
  'YOU MUST NOT:',
  '- Say or imply that the player has learned, mastered, understood or now knows anything. You',
  '  are not the judge of that and you have not seen them do any work. Describe the place and the',
  '  event, never their competence.',
  '- Teach, define, explain, hint at, or pose any mathematics. Not a worked example, not a riddle,',
  '  not a "the scribe asks you to consider...". If mathematics belongs in the scene at all it is',
  '  as something people in the world DO for a living, never as something put to the player.',
  '- Invent what lies through a door you were not told about, or name a region you were not given.',
  '- Congratulate, cheer, or editorialise about the journey. No "well done", no "your journey',
  '  continues", no closing flourish.',
  '',
  'Write plain prose. No markdown, no headings, no bullet points, no bold.',
].join('\n')

/**
 * The game master taking a turn at the table, as opposed to describing a move
 * the traversal made.
 *
 * This is the half that makes RPG mode a session rather than a narrated map.
 * The player writes what they do; the GM answers in the fiction, and when the
 * outcome is genuinely uncertain it CALLS FOR A ROLL rather than deciding.
 *
 * ── THE ROLL IS REQUESTED, NEVER PERFORMED ────────────────────────────────
 *
 * The model returns a tag expression and stops. It never writes a number, and
 * it is told so twice, because a GM that rolls its own dice is a GM whose
 * dice are prose. The server rolls (`rollFor` in rpg.ts, with the draw
 * injected), and the result comes back into the next turn as fact — which is
 * exactly the loop a table runs: describe, call for a roll, roll, describe the
 * result.
 *
 * ── AND IT STILL MAY NOT TEACH ────────────────────────────────────────────
 *
 * Every prohibition in `SYSTEM` carries over and the two most load-bearing are
 * repeated here, because a free-text turn is where they are most likely to
 * break: a player types "I work out the ratio" and the obliging thing is to
 * check their arithmetic. It must not. Mathematics inside fiction is
 * mathematics nobody ruled on, and the engine that does rule is one tab away.
 */
export const TABLE_SYSTEM = [
  SYSTEM,
  '',
  'AT THE TABLE:',
  'The player will tell you what their character does. Answer as the game master: what happens,',
  'what the world does back, what is now in front of them. Two short paragraphs at most.',
  '',
  'WHEN THE OUTCOME IS UNCERTAIN, CALL FOR A ROLL. Do not decide it yourself and do not write a',
  'number. On the last line of your reply, alone, write:',
  'ROLL: (tag) + (tag~) - (opposing tag+)',
  'Tag markers are the setting\'s: # is a flat 1, ~ is a d3, no marker is a d6, + is a d10.',
  'Subtract what opposes. Use the character\'s own tags where they genuinely bear on the action,',
  'and name difficulty tags for what stands in the way. Three to five tags is usual.',
  '',
  'DO NOT call for a roll when failure would not be interesting, or when success is impossible —',
  'say what happens instead. Never roll to find out whether the player knows some mathematics:',
  'that is not a question dice answer here, and the answer is never yours to give.',
  '',
  'You still may not teach, define, hint at or pose any mathematics, and you still may not say',
  'the player has learned or understood anything. If they describe doing a calculation, narrate',
  'the doing and the room around it, never the result and never whether it was right.',
  '',
  'WHEN THE SCENE GENUINELY NEEDS A QUANTITY SETTLED, ASK FOR WORK. Exactly like a roll: you',
  'request it and stop, and something other than you supplies it. On the last line of your reply,',
  'alone, write:',
  'WORK:',
  'That is the whole line. You do NOT say what the work is about and you do NOT write the problem',
  '— the engine chooses a problem the player is ready for and puts it on the table underneath what',
  'you wrote. Naming the subject would be choosing what they practise, which is not yours to',
  'choose, and writing the problem would be mathematics nobody checked.',
  '',
  'So the rule you have had all along is unchanged and now has one sanctioned exception: you may',
  'ASK for work, you may never WRITE it. Set the scene that needs it — who wants the figure, what',
  'turns on it, what the room is like while they wait — and end on WORK:.',
  '',
  'Use it when a number genuinely matters to what happens next: a consignment to reconcile, a span',
  'to measure, a dose to divide. Do NOT use it to gate progress you have already decided, do not',
  'use it as a punishment, and do not ask for work and a roll in the same reply — they are two',
  'different things being settled and only one can be on the table at a time.',
].join('\n')

/**
 * The GM framing a piece of work the ENGINE chose.
 *
 * docs/RPG_AND_THE_GRAPH.md §2 calls this the third row of a table this
 * codebase has already filled in twice:
 *
 *   offerKey + the strength gate decide  → the GM narrates the arrival or refusal
 *   the server's dice decide             → the GM narrates the result
 *   assemble() picks and the verifier rules → the GM frames it and narrates the ruling
 *
 * So this is not a new kind of trust. It is the existing kind, applied to a
 * third decider.
 *
 * ── THE GM IS NOT SHOWN THE MATHEMATICS, AND THAT IS NOT A COMPROMISE ─────
 *
 * The design says the GM "is handed both and writes the ask in the world's
 * terms". Handed the task text, a model restates it — that is the obliging
 * thing to do with a problem you have been shown, and §10's first item is
 * "mathematics the verifier never saw: if a scene contains a sum, the sum came
 * from assemble() and the answer went to the verifier".
 *
 * A prohibition can ask a model not to restate what it was given. Not giving
 * it makes restating impossible. So the GM gets three things — where the
 * player is, what the work is ABOUT (a concept name) and what SHAPE it takes
 * (the task's kind: evaluate, simplify, factor) — and never the prompt, the
 * given, the numbers or the answer.
 *
 * The consequence is deliberate and worth stating plainly: the framing is
 * scenery for the work, not a paraphrase of it. "The quartermaster needs the
 * consignment reconciled before the gate shuts" sits ABOVE the real task,
 * which the app renders verbatim from `assemble()` exactly as the Practice tab
 * does. A learner reads the reason to care from the GM and the mathematics
 * from the engine, and the two are visibly different kinds of text.
 *
 * ── WHAT IT MAY NOT DO, ON TOP OF THE FOUR ────────────────────────────────
 *
 * A fifth prohibition, because this is the one surface where a GM is told that
 * mathematics is about to happen: it must not have anybody in the scene do the
 * work, state what the work comes to, or say whether it went well. It has not
 * been told, and at the moment this prompt runs nobody knows — the learner has
 * not answered yet and the verifier has not ruled.
 */
export const COMMISSION_SYSTEM = [
  SYSTEM,
  '',
  'FRAMING A PIECE OF WORK:',
  'The player has taken on a piece of work in this place. You are told what the work is ABOUT and',
  'what shape it takes. You are NOT told the problem itself and you must not ask for it: the',
  'problem is put to the player by the engine, directly below what you write, and it is not yours.',
  '',
  'Write who in this place needs the work done, and why it matters to them today. One short',
  'paragraph, three sentences at most. Concrete and local: a name, a trade, a deadline, a',
  'consequence. End on the work being handed over, not on encouragement.',
  '',
  'YOU MUST NOT, IN ADDITION TO EVERYTHING ABOVE:',
  '- State, restate, invent or imply the problem, any part of it, or any number in it. Not as a',
  '  worked example, not as "the ledger reads 48 crates", not as a quantity in passing. The work is',
  '  mathematics the engine chose and only the engine states it.',
  '- Have anybody in the scene do the work, check it, or know the answer. Nobody knows: the player',
  '  has not done it yet and the verifier has not ruled.',
  '- Say or hint whether it will go well, be hard, be easy, or be beneath them.',
].join('\n')

export interface CommissionContext {
  region: PlacedRegion
  /** What the work is about. A concept name, never an id. */
  conceptName: string
  /**
   * The shape of the task the engine chose — `evaluate`, `simplify`, `factor`.
   * The nearest thing to the mathematics the GM is allowed, and it is allowed
   * because a kind is a category rather than a problem.
   */
  kind: string
  /** Why the work came up: the road this concept was blocking. */
  blockedRoad?: string | null
}

/**
 * The framing request.
 *
 * Same shape as `scenePrompt` and the same omission: the AREA is not sent, for
 * the reason given there. The concept NAME is sent, which is a narrower thing
 * — "Long division" tells the GM what trade to invent, where "number theory"
 * tells it what to write a lesson about.
 */
export function commissionPrompt(ctx: CommissionContext): { system: string; user: string } {
  const lines: string[] = []
  lines.push(`PLACE: ${ctx.region.name}, "${ctx.region.epithet}".`)
  lines.push(`WHAT THIS PLACE IS: ${settingOf(ctx.region.because)}`)
  lines.push('')
  lines.push(`THE WORK IS ABOUT: ${ctx.conceptName}.`)
  lines.push(`THE SHAPE OF IT: a ${ctx.kind} task. You are not told the task.`)
  if (ctx.blockedRoad) {
    /* Why the player is here at all. Given because it is the one thing that
       makes this scene follow from the last one — they were refused a road and
       went looking for the work that would satisfy it. Stated as the reason
       for the errand, not as a promise: the road opens when the strength gate
       is satisfied, and nothing in this scene may suggest the work is a key. */
    lines.push(`WHY IT CAME UP: the player was refused the road to ${ctx.blockedRoad} and is doing `
      + 'this work because of it. Do not promise that it will open the road, and do not mention the '
      + 'road opening at all.')
  }
  lines.push('')
  lines.push('Write the hand-over.')
  return { system: COMMISSION_SYSTEM, user: lines.join('\n') }
}

/**
 * A hand-over with no model behind it.
 *
 * Flat, like `unnarratedScene`, and for the same reason. It still names the
 * place and the concept, so the work is situated even with no key configured.
 */
export function unframedCommission(ctx: CommissionContext): string {
  return `In ${ctx.region.name}, there is work to be done on ${ctx.conceptName}.`
    + (ctx.blockedRoad ? ` The road to ${ctx.blockedRoad} wanted it.` : '')
}

/**
 * The GM narrating a ruling it did not make and could not have made.
 *
 * The other half of §3's third row. `commissionPrompt` frames work the engine
 * chose; this describes what the room does about the verifier's answer. Both
 * ends are hand-offs and neither is a judgement.
 *
 * ── INCONCLUSIVE IS A SCENE, NOT A FAILURE ────────────────────────────────
 *
 * §6, and it is the reason this prompt is longer than it looks like it needs
 * to be. The verifier's default ruling is `inconclusive` — it refuses rather
 * than guesses — and a narrator handed a word it does not understand will
 * round it to one it does. Both roundings are claims the engine explicitly
 * declined to make.
 *
 * The chart makes the same point structurally: `ruled.inconclusive` is a
 * sibling of `correct` and `incorrect` with no edge to either. This is the
 * prose half of that, and both exist because one of them will be edited by
 * somebody who has not read the other.
 *
 * ── AND CONGRATULATION IS WORST EXACTLY HERE ──────────────────────────────
 *
 * §10's fifth item: a scene following a `correct` ruling is the most tempting
 * place in the product to tell somebody they have mastered something, and
 * mastery is a number with a floor rather than a feeling. The standing
 * prohibition in `SYSTEM` already covers it; it is restated because this is
 * the one surface where the model has a reason to break it.
 *
 * ── IT STILL SEES NO MATHEMATICS ──────────────────────────────────────────
 *
 * Same as the framing: the concept name and the task's kind, plus the ruling
 * word and whether help was used. Never the problem, never the answer, never
 * what the answer should have been. A scene cannot leak a solution it was not
 * given.
 */
export const RULING_SYSTEM = [
  SYSTEM,
  '',
  'NARRATING A RULING:',
  'The player took on a piece of work in this place and it has now been ruled on by the engine.',
  'You are told the ruling as settled fact. Describe what the room does about it — one short',
  'paragraph, three sentences at most. The people who wanted the work done react; the day moves on.',
  '',
  'THE FOUR RULINGS AND WHAT EACH ONE IS:',
  '- CORRECT: the work was right. The room accepts it and uses it. Do NOT tell the player they have',
  '  learned, mastered or understood anything — you have seen one piece of work and nothing else,',
  '  and whether they know this is a number you have not been shown. Describe the work being',
  '  accepted, never the person being competent.',
  '- INCORRECT: the work was wrong. Something in the world is now inconvenient because of it. Do',
  '  not say what the right answer was — you were not told it — and do not have anybody explain it.',
  '- INCONCLUSIVE: the engine could not settle whether it was right. This is NOT a failure and it',
  '  is NOT a success. Nobody in the room can say, and the honest scene is one where the question',
  '  stays open and somebody has to decide what to do anyway. Never imply it was wrong. Never imply',
  '  it was accepted. Both are claims the engine refused to make and they are not yours to make',
  '  either.',
  '- ABANDONED: the work was put down unfinished. Describe it being set aside. No reproach.',
  '',
  'YOU MUST NOT, IN ADDITION TO EVERYTHING ABOVE:',
  '- State the problem, the answer, or what the answer should have been. You have not been told any',
  '  of them.',
  '- Congratulate, or say the player is getting better, or that anything is now unlocked, open, or',
  '  within reach. Whether a road opens is decided elsewhere by a number, and you are not told it.',
  '- Soften a ruling, hedge it, or suggest it might be revisited.',
].join('\n')

export interface RulingContext {
  region: PlacedRegion
  conceptName: string
  /** The verifier's word. The four the engine can produce, and nothing else. */
  ruling: 'correct' | 'incorrect' | 'inconclusive' | 'abandoned'
  /**
   * Whether the learner used help.
   *
   * Told because it is a CIRCUMSTANCE, which is the one thing §5 says the
   * fiction may know about: a commission completed with help moves strength
   * less, as `summarise()` already models, and a scene in which the
   * quartermaster's own clerk sat alongside you is both true and better. It is
   * not permission to editorialise about it — the prohibitions above still
   * stand.
   */
  assisted?: boolean
}

/** What the engine settled, stated as fact in the same shape as `outcomeLine`. */
function rulingLine(ctx: RulingContext): string {
  switch (ctx.ruling) {
    case 'correct':
      return 'RULING: CORRECT. The work was right. Show it being accepted and used. Say nothing '
        + 'about what the player now knows.'
    case 'incorrect':
      return 'RULING: INCORRECT. The work was wrong. Show the inconvenience that follows. Do not '
        + 'reveal or have anybody work out the right answer.'
    case 'inconclusive':
      return 'RULING: INCONCLUSIVE. The engine could not settle it, so nobody in the room can say '
        + 'whether it was right. Write the scene where the question stays open and a decision has '
        + 'to be made anyway. Do not imply it was wrong and do not imply it was accepted.'
    case 'abandoned':
      return 'RULING: ABANDONED. The work was put down unfinished. Show it being set aside, '
        + 'without reproach.'
  }
}

export function rulingPrompt(ctx: RulingContext): { system: string; user: string } {
  const lines: string[] = []
  lines.push(`PLACE: ${ctx.region.name}, "${ctx.region.epithet}".`)
  lines.push(`WHAT THIS PLACE IS: ${settingOf(ctx.region.because)}`)
  lines.push('')
  lines.push(`THE WORK WAS ABOUT: ${ctx.conceptName}. You were never told the problem itself.`)
  if (ctx.assisted) {
    lines.push('THE PLAYER USED HELP. That is a circumstance of the scene, not a fault to remark on.')
  }
  lines.push('')
  lines.push(rulingLine(ctx))
  lines.push('')
  lines.push('Write what the room does.')
  return { system: RULING_SYSTEM, user: lines.join('\n') }
}

/**
 * A ruling with no model behind it.
 *
 * Flat, and `inconclusive` gets the longest line of the four because it is the
 * one a bare sentence most easily turns into a failure.
 */
export function unnarratedRuling(ctx: RulingContext): string {
  const where = ctx.region.name
  switch (ctx.ruling) {
    case 'correct':
      return `The work on ${ctx.conceptName} was right, and ${where} takes it.`
    case 'incorrect':
      return `The work on ${ctx.conceptName} was wrong. ${where} will have to manage.`
    case 'inconclusive':
      return `Nobody in ${where} could say whether the work on ${ctx.conceptName} was right. `
        + 'The question is still open; it was not ruled against you.'
    case 'abandoned':
      return `The work on ${ctx.conceptName} was set aside unfinished.`
  }
}

/** The line that states the outcome as fact, which the GM narrates around. */
function outcomeLine(ctx: SceneContext): string {
  const here = ctx.region.name
  switch (ctx.kind) {
    case 'start':
      return `OUTCOME: the player's journey begins. They have just arrived in ${here} and are `
        + 'setting out from here. Nothing has been refused and nothing has been earned.'
    case 'arrive':
      return `OUTCOME: the road opened. The player has travelled${
        ctx.from ? ` from ${ctx.from.name}` : ''} and has just arrived in ${here}.`
    case 'blocked':
      return `OUTCOME: the way is CLOSED and the player does not travel. They remain in ${here}. `
        + `The road they tried needs ${
          ctx.missing?.length ? ctx.missing.join(' and ') : 'something they do not have'
        }, which they do not have. Show the road being shut to them. Do not let them through and `
        + 'do not suggest a way around it.'
    case 'not-yours':
      return `OUTCOME: the player reached for something they do not actually hold, and nothing `
        + `happens. They remain in ${here}. Show the attempt falling flat.`
    case 'spent':
      return `OUTCOME: this road leads only to places the player has already been. They remain in `
        + `${here}. Show the familiarity of it, and that there is nothing new this way.`
  }
}

/**
 * The scene request.
 *
 * The region's `because` is included because it is the one sentence anybody
 * wrote about what that place IS — institutions, law, trade — and it is drawn
 * from the setting rather than from the mathematics. It is what makes Hasspab
 * read differently from Krull. The AREA is deliberately NOT sent: naming
 * "number theory" in the GM's context is the surest way to get a scene about
 * number theory, which prohibition two forbids.
 */
export function scenePrompt(ctx: SceneContext): { system: string; user: string } {
  const lines: string[] = []
  lines.push(`PLACE: ${ctx.region.name}, "${ctx.region.epithet}".`)
  lines.push(`WHAT THIS PLACE IS: ${settingOf(ctx.region.because)}`)
  lines.push(`DISTANCE FROM THE CONTINENTAL CENTRE: ${ctx.region.km} km.`)
  if (ctx.from) lines.push(`TRAVELLED FROM: ${ctx.from.name}, "${ctx.from.epithet}".`)
  const seen = (ctx.visited ?? []).slice(-MAX_VISITED)
  if (seen.length > 0) lines.push(`ALREADY VISITED, oldest first: ${seen.join(', ')}.`)
  lines.push('')
  lines.push(outcomeLine(ctx))
  lines.push('')
  lines.push('Write the scene.')
  return { system: SYSTEM, user: lines.join('\n') }
}

/**
 * A scene with no model behind it.
 *
 * Assembled from what the region already records, so it is true rather than
 * invented — and flat on purpose. It should read as a stage direction, which
 * is honest about being unnarrated, rather than as a GM having an off day.
 */
/** One exchange at the table, as the log holds it. */
export interface TableTurn {
  who: 'player' | 'gm'
  text: string
  /** Present on a gm turn that called for one, once the server has rolled it. */
  roll?: { expression: string; dice: string; results: number[]; total: number; reading: string }
  /**
   * Work the engine put on the table in answer to a `WORK:` request.
   *
   * The problem lives on the TURN rather than in component state, so it is
   * part of the transcript: a player who closes the tab mid-problem comes
   * back to the scene with the problem still in it, which is the behaviour a
   * log already promises for everything else at the table.
   *
   * `prompt` and `given` are the engine's own strings, passed through
   * untouched. The game master never sees them — see the WORK: protocol in
   * TABLE_SYSTEM — so there is nothing here it could have paraphrased.
   */
  work?: {
    taskId: string
    conceptName: string
    kind: string
    prompt: string
    given: string
    at?: Record<string, string> | null
    domainConditions?: string[]
    /** The verifier's word, once the player has answered. */
    ruling?: 'correct' | 'incorrect' | 'inconclusive' | 'abandoned'
  }
}

const MAX_LOG = 10

/**
 * The turn request: the sheet, the place, what has happened lately, and the
 * thing the player just did.
 *
 * The log is capped at the last ten exchanges. A session that ran all evening
 * would otherwise spend its whole context on its own beginning, and the recent
 * turns are what a scene is actually about. The cap is stated to the model so
 * it knows the history is partial rather than complete — a GM that believes it
 * has seen everything will contradict something it never read.
 */
export function tablePrompt(args: {
  sheet: string
  region: PlacedRegion
  log: TableTurn[]
  action: string
  /** A roll the player just made, which this turn must narrate the result of. */
  resolved?: TableTurn['roll']
  /**
   * Work the verifier has just ruled on, which this turn must narrate.
   *
   * The exact counterpart of `resolved`, and the symmetry is the argument:
   * dice and the verifier are both things that settle something the game
   * master asked for and may not decide. Each comes back as fact and each
   * gets narrated as it stands.
   */
  ruled?: { conceptName: string; ruling: NonNullable<NonNullable<TableTurn['work']>['ruling']>; assisted?: boolean }
}): { system: string; user: string } {
  const lines: string[] = []
  lines.push(args.sheet)
  lines.push('')
  lines.push(`PLACE: ${args.region.name}, "${args.region.epithet}".`)
  lines.push(`WHAT THIS PLACE IS: ${settingOf(args.region.because)}`)
  lines.push('')

  const recent = args.log.slice(-MAX_LOG)
  if (recent.length > 0) {
    lines.push(`RECENT PLAY (the last ${recent.length} exchanges; earlier ones are not shown):`)
    for (const turn of recent) {
      lines.push(`${turn.who === 'player' ? 'PLAYER' : 'GM'}: ${turn.text}`)
      if (turn.roll) {
        lines.push(`ROLLED: ${turn.roll.expression} = ${turn.roll.dice} = ${turn.roll.total}. ${turn.roll.reading}`)
      }
    }
    lines.push('')
  }

  if (args.resolved) {
    /* The result is given as settled fact, same as a traversal outcome. The
       model asked for this roll on the previous turn and does not get to
       revisit what it means now that it can see the number. */
    lines.push(`THE DICE HAVE BEEN ROLLED, and this is the result. Narrate it as it stands:`)
    lines.push(`  ${args.resolved.expression}`)
    lines.push(`  ${args.resolved.dice} = ${args.resolved.results.join(' ')} = ${args.resolved.total}`)
    lines.push(`  ${args.resolved.reading}`)
    lines.push('Do not call for another roll in this reply.')
  } else if (args.ruled) {
    /* The ruling as settled fact, with the four readings restated inline
       rather than by importing RULING_SYSTEM wholesale. At the table the GM
       is mid-scene and needs the one ruling it got, not a rubric for all
       four — and §6's rule about `inconclusive` is the one that has to
       survive the abbreviation, so it is the line that gets the most words. */
    lines.push(`THE WORK HAS BEEN RULED ON by the engine. You did not see the problem and you did `
      + `not judge the answer. Narrate what the room does about this result, as it stands:`)
    lines.push(`  the work was on ${args.ruled.conceptName}`)
    switch (args.ruled.ruling) {
      case 'correct':
        lines.push('  RULING: CORRECT — the work was right. Show it accepted and used. Say nothing '
          + 'about what the player now knows or understands.')
        break
      case 'incorrect':
        lines.push('  RULING: INCORRECT — the work was wrong. Show the inconvenience. Do not reveal '
          + 'the right answer; you were not told it.')
        break
      case 'inconclusive':
        lines.push('  RULING: INCONCLUSIVE — the engine could not settle whether it was right. This '
          + 'is NOT a failure and NOT a success. Nobody in the room can say. Write the scene where '
          + 'the question stays open and a decision has to be made anyway. Do not imply it was '
          + 'wrong and do not imply it was accepted.')
        break
      case 'abandoned':
        lines.push('  RULING: ABANDONED — the work was set aside unfinished. No reproach.')
        break
    }
    if (args.ruled.assisted) {
      lines.push('  The player used help. A circumstance of the scene, not a fault to remark on.')
    }
    lines.push('Do not ask for more work and do not call for a roll in this reply.')
  } else {
    lines.push(`PLAYER DOES: ${args.action}`)
  }
  return { system: TABLE_SYSTEM, user: lines.join('\n') }
}

/**
 * Pull a `ROLL:` line off the end of a reply.
 *
 * Returns the prose without it and the expression if there was one. Tolerant
 * of the model putting it anywhere on its own line, and of it being absent,
 * which is the common case — most turns need no dice.
 */
export function splitRollRequest(reply: string): { text: string; expression: string | null } {
  const lines = reply.split('\n')
  const idx = lines.findIndex(l => /^\s*ROLL:\s*\S/.test(l))
  if (idx === -1) return { text: reply.trim(), expression: null }
  const expression = lines[idx].replace(/^\s*ROLL:\s*/, '').trim()
  lines.splice(idx, 1)
  return { text: lines.join('\n').trim(), expression: expression || null }
}

/**
 * Pull a `WORK:` line off the end of a reply.
 *
 * The same move as `splitRollRequest` and for the same reason: the model
 * requests, something else supplies. A roll is supplied by the server's dice;
 * work is supplied by `assemble()`. Neither is the model's to produce, and in
 * both cases the marker is how it says so without producing it.
 *
 * ── WHY IT CARRIES NOTHING ────────────────────────────────────────────────
 *
 * `ROLL:` has an expression because which tags bear on an action is a
 * narrative judgement and the GM is the thing that can make it. `WORK:` has
 * no argument because the equivalent judgement — WHICH mathematics — is not a
 * narrative one. It belongs to the scheduler, which knows what is
 * introducible, what is on cooldown, what interferes with what and where the
 * mastery floor sits. A `WORK: long division` would be a storyteller's sense
 * of pacing quietly replacing all of that.
 *
 * So the line is bare, and anything the model puts after it is discarded
 * rather than honoured — deliberately, because a model that has been told to
 * write `WORK:` alone will occasionally write `WORK: the ledger` anyway, and
 * the safe reading of that is "work was requested" rather than "work on the
 * ledger".
 *
 * ── A ROLL AND WORK TOGETHER ──────────────────────────────────────────────
 *
 * The prompt forbids it; this handles it anyway, because a prompt is not a
 * parser. Work wins and the roll is dropped: both are things being settled by
 * something other than the model, and settling two at once makes a turn whose
 * outcome has no single shape. Returning work rather than the roll is the
 * conservative half of that choice — a dropped roll costs a flourish, where a
 * dropped `WORK:` would silently turn a scene that was supposed to contain
 * real mathematics into one that only talks about it.
 */
export function splitWorkRequest(reply: string): { text: string; wantsWork: boolean } {
  const lines = reply.split('\n')
  const idx = lines.findIndex(l => /^\s*WORK:/i.test(l))
  if (idx === -1) return { text: reply.trim(), wantsWork: false }
  lines.splice(idx, 1)
  return { text: lines.join('\n').trim(), wantsWork: true }
}

export interface ParsedTag { name: string; tier: string; against: boolean }

/** `name~` → `{ name, tier: '~' }`. A marker is one trailing #, ~ or +. */
function splitTier(raw: string): ParsedTag | null {
  let name = raw.trim()
  const marker = /[+#~]$/.test(name) ? name.slice(-1) : ''
  if (marker) name = name.slice(0, -1).trim()
  if (!name || /[+#~]/.test(name)) return null
  return { name, tier: marker, against: false }
}

/**
 * Parse `(tag) + (tag~) - (difficulty+)` into tags.
 *
 * ── Why it also accepts the form without parentheses ──────────────────────
 *
 * The parenthesised grammar is the game's own, from `roll_resolver`, and it is
 * what the prompt asks for. Models do not reliably give it. Asked for
 * `ROLL: (silver tongued) - (hostility~)`, a perfectly good game master
 * returns `ROLL: Place value + Surveyor - Guild protocol~` — which the strict
 * parser refused, correctly and uselessly, because the consequence was that
 * dice never appeared at all. That was caught by playing a turn against a real
 * model rather than by reading the prompt and believing it.
 *
 * So: parentheses first, since they are unambiguous and let a tag contain
 * anything. Failing that, split on the + and - signs. The only thing lost is a
 * tag whose NAME contains a sign, which no tag has.
 *
 * Genuine nonsense is still refused — empty, unbalanced, a bare marker — and
 * the caller narrates without dice rather than inventing a reading. Returning
 * something plausible for garbage would put numbers on the table that nothing
 * chose.
 */
export function parseRollExpression(expression: string): ParsedTag[] | null {
  const text = expression.trim()
  if (!text) return null

  if (text.includes('(') || text.includes(')')) {
    const pattern = /([+-]?)\s*\(([^()]*)\)/g
    const tags: ParsedTag[] = []
    let end = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
      if (text.slice(end, match.index).trim()) return null
      if (tags.length > 0 && !match[1]) return null
      const tag = splitTier(match[2])
      if (!tag) return null
      tags.push({ ...tag, against: match[1] === '-' })
      end = pattern.lastIndex
    }
    return tags.length > 0 && !text.slice(end).trim() ? tags : null
  }

  /* No parentheses: split before each sign that is followed by a space, so a
     hyphenated tag name stays whole. A leading sign is allowed. */
  const tags: ParsedTag[] = []
  for (const partRaw of text.split(/(?=[+-]\s)/)) {
    const part = partRaw.trim()
    if (!part) continue
    const against = part.startsWith('-')
    const body = against || part.startsWith('+') ? part.slice(1) : part
    const tag = splitTier(body)
    if (!tag) return null
    tags.push({ ...tag, against })
  }
  return tags.length > 0 ? tags : null
}

export function unnarratedScene(ctx: SceneContext): string {
  const here = `${ctx.region.name} — ${ctx.region.epithet}`
  switch (ctx.kind) {
    case 'start':
      return `You begin in ${here}. ${settingOf(ctx.region.because)}`
    case 'arrive':
      return `${ctx.from ? `You travel from ${ctx.from.name} to ` : 'You arrive in '}${here}. `
        + settingOf(ctx.region.because)
    case 'blocked':
      return `The road is closed. You are still in ${here}. It wants ${
        ctx.missing?.length ? ctx.missing.join(' and ') : 'something you do not have'
      } first.`
    case 'not-yours':
      return `Nothing comes of it — that is not something you are carrying. You are still in ${here}.`
    case 'spent':
      return `That road leads only where you have already been. You are still in ${here}.`
  }
}
