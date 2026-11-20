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
