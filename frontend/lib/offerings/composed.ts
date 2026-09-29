/**
 * Composed offerings — gesture, movement, stretch, exercise.
 *
 * These have no catalogue, and that changes the honesty problem rather than
 * removing it. For a catalogued medium the guard is a miss: the interpreter names
 * a query, the server searches, and nothing gets asserted into existence. There is
 * no equivalent here, so the risk moves from "it invented a record" to "it wrote
 * vague mush" — and a gesture described as "a movement expressing longing" is the
 * composed-medium version of an invented track.
 *
 * So the guard is **structural, not stylistic**: a composed offering must carry
 * ordered concrete steps, a framing, and an intent. Structure is checkable; prose
 * quality is not, and a length threshold would only teach a model to pad. Asking
 * for steps forces specificity in a way nothing else here can.
 *
 * The vocabularies below are prompts, not a closed list. They exist so a player
 * facing an empty field has somewhere to start, and so an interpreter has a
 * register to imitate. Anything can be composed; nothing has to come from here.
 */

import type { ActionIntent, MediumId, Offering } from '@/lib/correlate/types'
import { composedId } from './shared'

export interface ComposedInput {
  medium: MediumId
  title: string
  steps: string[]
  framing: string
  intent: ActionIntent
}

/** Why a composed offering was refused. Shown to whoever wrote it. */
export type PerformabilityProblem =
  | 'no-title'
  | 'no-steps'
  | 'too-many-steps'
  | 'vague-steps'
  | 'no-framing'

export const PROBLEM_COPY: Record<PerformabilityProblem, string> = {
  'no-title': 'Give it a name, so it can be referred to later.',
  'no-steps': 'Break it into at least one concrete step. "Something expressing longing" is not doable.',
  'too-many-steps': 'Five steps is the most this can hold — a turn is one action, not a routine.',
  'vague-steps': 'At least one step is too short to act on. Say what actually moves, and where to.',
  'no-framing': 'Say which part matters — the reach, the pause, the sensation. Otherwise nobody knows what they are answering.',
}

const MAX_STEPS = 5
/** Short enough to catch "do it" and "move", long enough not to punish terseness. */
const MIN_STEP_CHARS = 12

/**
 * Is this performable — could a second person actually do it?
 *
 * Deliberately structural. It does not try to judge whether the movement is
 * *good*, which is the interpreter's job and the player's, not a validator's.
 */
export function checkPerformability(input: ComposedInput): PerformabilityProblem[] {
  const problems: PerformabilityProblem[] = []
  const steps = (input.steps ?? []).map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)

  if (!input.title?.trim()) problems.push('no-title')
  if (steps.length === 0) problems.push('no-steps')
  else if (steps.length > MAX_STEPS) problems.push('too-many-steps')
  if (steps.length > 0 && steps.some(s => s.length < MIN_STEP_CHARS)) problems.push('vague-steps')
  if (!input.framing?.trim()) problems.push('no-framing')

  return problems
}

/**
 * Build an Offering from authored input, or explain why it cannot be one.
 *
 * Returns a discriminated result rather than throwing, because a failed
 * performability check is ordinary feedback to a player mid-composition, not an
 * error condition.
 */
export function composeOffering(
  input: ComposedInput,
): { ok: true; offering: Offering } | { ok: false; problems: PerformabilityProblem[] } {
  const problems = checkPerformability(input)
  if (problems.length > 0) return { ok: false, problems }

  const steps = input.steps.map(s => s.trim()).filter(Boolean)
  const title = input.title.trim()

  return {
    ok: true,
    offering: {
      medium: input.medium,
      id: composedId(input.medium, title),
      title,
      attribution: null,
      framing: input.framing.trim(),
      steps,
      intent: input.intent,
      // Text is the only honest rendering of an action nobody filmed.
      perceptible: { kind: 'text', body: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') },
      sourceUrl: null,
      origin: 'composed',
      meta: { intent: input.intent, stepCount: steps.length },
    },
  }
}

/**
 * Starting points, by medium.
 *
 * Chosen to span a range rather than to be a taxonomy: each one is a different
 * *shape* of action, so a player scanning the list finds a contrast rather than
 * eight variations on reaching.
 */
export const VOCABULARIES: Partial<Record<MediumId, { title: string; steps: string[]; framing: string }[]>> = {
  gesture: [
    {
      title: 'The interrupted reach',
      steps: ['Extend one arm forward at chest height, unhurried', 'Stop it dead, two thirds of the way out', 'Let it stay there longer than is comfortable'],
      framing: 'The stopping, not the reaching.',
    },
    {
      title: 'Putting something down',
      steps: ['Hold an imagined weight in both hands at your sternum', 'Lower it to waist height slowly enough that it is clearly heavy', 'Open your hands and leave them open'],
      framing: 'The moment the hands open.',
    },
    {
      title: 'Turning away and back',
      steps: ['Turn your head forty-five degrees away from someone', 'Wait one breath', 'Return, but not quite to where you were looking before'],
      framing: 'The place the eyes land the second time.',
    },
  ],
  movement: [
    {
      title: 'Expanding on a count',
      steps: ['Stand with feet together, arms at your sides', 'Over eight slow counts, open arms and stance a little on every count', 'On the eighth, stop mid-movement rather than at the end'],
      framing: 'The rate of the opening, not the shape it ends in.',
    },
    {
      title: 'Falling and catching',
      steps: ['Shift weight forward until you have to step', 'Take the step late', 'Repeat three times, each one later than the last'],
      framing: 'The delay before the catch.',
    },
    {
      title: 'One angular phrase',
      steps: ['Make three consecutive shapes using only straight lines and right angles', 'Hold each for one count', 'Let the transitions be as abrupt as the shapes'],
      framing: 'The angles, and the refusal to curve between them.',
    },
  ],
  stretch: [
    {
      title: 'Seated forward fold',
      steps: ['Sit with legs extended, or knees softly bent', 'Hinge from the hips and let the spine round toward the legs', 'Stay for five slow breaths, going no further on any of them'],
      framing: 'The length behind the knees and along the back.',
    },
    {
      title: 'Doorway chest opening',
      steps: ['Place forearms on a doorframe at shoulder height', 'Step through until the front of the chest lengthens', 'Hold for four breaths, easing back on each exhale'],
      framing: 'The width across the collarbones.',
    },
    {
      title: 'Supported side bend',
      steps: ['Stand or sit tall, one hand resting on a surface for support', 'Lengthen the other arm overhead and lean away from it', 'Breathe into the stretched side for three breaths'],
      framing: 'The space between the lowest rib and the hip.',
    },
  ],
  exercise: [
    {
      title: 'Slow descent',
      steps: ['Choose any movement you can already do', 'Take five seconds to lower, one second to return', 'Three repetitions, no more'],
      framing: 'The resistance on the way down.',
    },
    {
      title: 'Holding still under load',
      steps: ['Take a position that is work to maintain — a wall sit, a plank on the knees, arms held out', 'Stay for twenty seconds', 'Notice which part quits first'],
      framing: 'Where the effort relocates over time.',
    },
    {
      title: 'Carrying on one side',
      steps: ['Pick up something moderately heavy in one hand', 'Walk twenty steps keeping the shoulders level', 'Swap hands and repeat'],
      framing: 'What the unloaded side has to do.',
    },
  ],
}

export function vocabularyFor(medium: MediumId) {
  return VOCABULARIES[medium] ?? []
}
