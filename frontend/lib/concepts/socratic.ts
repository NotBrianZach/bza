/**
 * Tutor mode — the walk across the question map, and the prompts it asks with.
 *
 * `questions.ts` built the map: 352 steps inside 105 worked examples, each one
 * a move and what that move establishes, derived from the ontologies so it
 * cannot contradict them. It was wired to nothing. This module is the walk —
 * how a chain is entered, how one question is phrased, and where the walk ends.
 *
 * ── Four sources for one sentence, and the cheapest one wins ──────────────
 *
 * A question put to the learner comes from exactly one of these, in this order:
 *
 *  1. `authored` — the subgoal's own `socratic` phrasing, used VERBATIM and
 *     without a model call. 101 of 352 steps have one. An author who wrote the
 *     question wrote a better one than a model will, and paraphrasing it would
 *     be spending a token to make it worse.
 *  2. `tutor` — a model phrases the move as a question, answer-blind (below).
 *  3. `unphrased` — no model configured, or the call failed. The step's own
 *     words in a fixed shell. Honest and labelled as such; see
 *     `unphrasedQuestion` for why it is not dressed up as Socratic.
 *
 * Which one a learner got is returned and shown, never averaged. A surface
 * that said "Socratic question" over all three would be claiming 352 authored
 * questions, and 251 of them are not sentences yet — the same overstatement
 * `questionCoverage` exists to prevent.
 *
 * ── The asking model does not have the answer. Structurally. ──────────────
 *
 * Every prompt here is built from a `SocraticContext`, and that type is
 * incapable of carrying the asked step's `establishes` — see questions.ts.
 * This is a type-level guarantee rather than an instruction in a prompt, and
 * the difference is the whole point: an instruction not to reveal the answer
 * is defeated by one careless edit to a prompt string, and the failure is
 * invisible because a leaked answer reads as a perfectly good question.
 *
 * Two consequences fall out, and both are wanted:
 *
 *  - The model cannot leak what it was never given.
 *  - The model cannot MARK. "Is this right?" is unanswerable by something that
 *    does not know the answer, so the refusal is not a policy that can erode.
 *    Rulings come from the verifier, against an exact answer, on a task —
 *    which is what `convertsTo` leads to and why a walk ends at a problem.
 *
 * ── A walk records nothing ────────────────────────────────────────────────
 *
 * No strength, no journey progress, no observation. Prose is unverifiable,
 * `Observation` requires a `Verdict`, and a model approving an answer is
 * exactly what PracticeChat's header refuses. So there is no table here and no
 * write path: the walk is an introduction whose terminus is a rulable problem,
 * and the problem is where evidence comes from.
 *
 * That also means tutor mode is NOT gated on prerequisites. Reading a worked
 * example is already ungated — ConceptBrowser prints every concept's full text
 * — and a walk that advances nothing cannot be a way around the mastery floor.
 * What the floor gates is the problem at the end, through the existing
 * `introducible` path, untouched. `unmetBefore` exists so a surface can SAY
 * what is missing while still letting someone read.
 */

import {
  chainsForConcept, socraticContext,
  type QuestionChain, type SocraticContext,
} from './questions'
import { conceptById, conceptOfPoint, gatingPrerequisitesOf, isTeachable } from './registry'
import type { ConceptOntology } from './types'

/** Where the sentence the learner reads came from. Never averaged — see header. */
export type Phrasing = 'authored' | 'tutor' | 'unphrased'

// ---------------------------------------------------------------------------
// Entering a walk
// ---------------------------------------------------------------------------

/**
 * One walk a learner could start, summarised for a list.
 *
 * `steps` and `authored` are both reported because they are different claims
 * about the same chain: how long the walk is, and how much of it is a written
 * question rather than a generated one.
 */
export interface WalkOpening {
  knowledgePointId: string
  conceptId: string
  conceptName: string
  /** The worked example's problem — what the whole chain is about. */
  problem: string
  steps: number
  /** Steps with an authored `socratic` phrasing. The rest are phrased at ask time. */
  authored: number
  /**
   * Tasks this walk can turn into evidence.
   *
   * Empty means the conversation leads nowhere rulable. Shown, never hidden:
   * a walk that cannot end at a problem is still worth taking, and a learner
   * is entitled to know that nothing will come of it on the record.
   */
  convertsTo: string[]
}

function asOpening(o: ConceptOntology, chain: QuestionChain): WalkOpening {
  return {
    knowledgePointId: chain.knowledgePointId,
    conceptId: chain.conceptId,
    conceptName: conceptById(o, chain.conceptId)?.name ?? chain.conceptId,
    problem: chain.problem,
    steps: chain.questions.length,
    authored: chain.questions.filter(q => q.authoredAsQuestion).length,
    convertsTo: chain.convertsTo,
  }
}

/**
 * The walks available for one concept, in the knowledge points' own order.
 *
 * Empty for a concept the ontology does not contain and for a mapped-only one
 * with nothing written — the two are indistinguishable here on purpose, since
 * both answer "there is nothing to lead you through" and the caller's next
 * move is the same either way.
 */
export function openingsForConcept(o: ConceptOntology, conceptId: string): WalkOpening[] {
  return chainsForConcept(o, conceptId).map(c => asOpening(o, c))
}

/**
 * The chain belonging to one knowledge point, or null.
 *
 * This is the entry point a PROBLEM uses. A generated task has no subgoals of
 * its own — `tasks.ts` makes numbers, not derivations — so "lead me through
 * this" on a queued task means the worked example on the same knowledge point:
 * the same move in different numbers, which is exactly what `convertsTo`
 * already encodes in the other direction.
 */
export function chainForPoint(o: ConceptOntology, pointId: string): QuestionChain | null {
  const concept = conceptOfPoint(o, pointId)
  if (!concept) return null
  return chainsForConcept(o, concept.id).find(c => c.knowledgePointId === pointId) ?? null
}

export function openingForPoint(o: ConceptOntology, pointId: string): WalkOpening | null {
  const chain = chainForPoint(o, pointId)
  return chain ? asOpening(o, chain) : null
}

/**
 * The teachable prerequisites of a concept that are not yet above the floor.
 *
 * For SAYING, not for blocking — see the header. A learner who wants to be led
 * through logarithms before exponents should be able to, and should be told
 * that the derivation will lean on something they have not demonstrated.
 *
 * `gatingPrerequisitesOf` rather than `prerequisitesOf`, for the reason that
 * function exists: an unteachable node has no knowledge points, so its
 * strength is permanently 0, and naming it here would report a gap nobody can
 * ever close.
 */
export function unmetBefore(
  o: ConceptOntology,
  conceptId: string,
  strengths: { conceptId: string; strength: number }[],
  floor: number,
): { conceptId: string; name: string }[] {
  if (!conceptById(o, conceptId)) return []
  const strength = new Map(strengths.map(s => [s.conceptId, s.strength]))
  return gatingPrerequisitesOf(o, conceptId)
    .filter(id => id !== conceptId && isTeachable(o, id))
    .filter(id => (strength.get(id) ?? 0) < floor)
    .map(id => ({ conceptId: id, name: conceptById(o, id)?.name ?? id }))
}

// ---------------------------------------------------------------------------
// Where a walk ends
// ---------------------------------------------------------------------------

export interface WalkTerminus {
  /** The worked example's authored final answer. */
  answer: string
  /** Rulable tasks on this point. Empty means the walk records nothing, ever. */
  convertsTo: string[]
}

export function walkTerminus(chain: QuestionChain): WalkTerminus {
  return { answer: chain.answer, convertsTo: chain.convertsTo }
}

/**
 * What the learner is shown AFTER they have answered: the step's own detail.
 *
 * A separate function from `socraticContext` and deliberately not derivable
 * from it. The two answer different questions — "what may the asker see" and
 * "what does the learner check themselves against" — and the one hazard worth
 * designing against is a future caller reaching for whichever is nearest. They
 * are not interchangeable, so they do not look alike.
 */
export function revealOf(chain: QuestionChain, position: number): string | null {
  return chain.questions[position]?.establishes ?? null
}

// ---------------------------------------------------------------------------
// The question, when nothing phrased it
// ---------------------------------------------------------------------------

/**
 * The step's own words in a fixed shell, for when no model is configured.
 *
 * NOT dressed up as a Socratic question, and the reason is the measurement in
 * questions.ts: 251 of 352 labels are imperative — "Add the places
 * separately" — and punctuation cannot fix that, because "Should you add the
 * places separately?" telegraphs its own answer. A template that pretended
 * otherwise would be worse than this, which asks a real question about a step
 * it names: it withholds the detail, which is the only thing that must be
 * withheld.
 *
 * An interrogative label never reaches here — the caller uses it verbatim —
 * but the guard is kept so that calling this on one asks the author's question
 * rather than wrapping a question in a shell.
 */
export function unphrasedQuestion(ctx: SocraticContext): string {
  const move = ctx.ask.trim()
  if (ctx.verbatim) return move
  const named = move.endsWith('.') ? move.slice(0, -1) : move
  return `The next move is: “${named}.” What does that give you here?`
}

// ---------------------------------------------------------------------------
// The prompts
// ---------------------------------------------------------------------------

/**
 * One paragraph of LaTeX rules, kept short on purpose.
 *
 * /api/problem-set-chat carries a much longer version because it writes whole
 * solutions with headings and lists. This asks one question of at most two
 * sentences, and most of that budget would be spent telling a model not to use
 * formatting it has no room for.
 */
const MATH_SYNTAX =
  'Wrap every mathematical expression in dollar signs, however simple — $3^3$, $x+y$, $n$ — '
  + 'because bare math is stripped by the renderer. Use standard LaTeX inside them. '
  + 'No headings, no lists, no bold.'

/** The rules both prompts share. The ones that cannot be relaxed per-mode. */
const FLOOR =
  'WHAT YOU HAVE, AND WHAT YOU DO NOT\n'
  + 'You are given the problem, the moves already established with what each one gave, and the '
  + 'single move to ask about next. You are NOT given what that next move establishes. You do not '
  + 'know the answer to the question you are asking, and nothing will tell you it. That is '
  + 'deliberate: a tutor who has been shown the answer leaks it into the question.\n\n'
  + 'THEREFORE, AND THESE ARE NOT STYLE PREFERENCES\n'
  + '- Never state, complete, or hint at the result of the move you are asking about.\n'
  + '- Never say whether the learner is right or wrong, and never imply it. You cannot know. '
  + 'Marking happens elsewhere: a verifier rules on an exact answer to a problem, and this '
  + 'conversation records nothing.\n'
  + '- Ask exactly ONE question. No preamble, no praise, no summary of the derivation so far.\n'
  + '- Two sentences at most: at most one of setup, then the question.\n'
  + '- Do not offer multiple-choice options. A list of candidates contains the answer.\n'
  + '- Point AT the move, never past it. The learner is meant to take this step themselves.'

function contextBlock(ctx: SocraticContext): string {
  const established = ctx.established.length === 0
    ? 'Nothing yet — this is the first step.'
    : ctx.established.map((e, i) => `${i + 1}. ${e.move} → ${e.establishes}`).join('\n')
  return (
    `THE PROBLEM\n${ctx.problem}\n\n`
    + `ESTABLISHED SO FAR\n${established}\n\n`
    + `THE MOVE TO ASK ABOUT (you have not been told what it yields)\n${ctx.ask}\n\n`
    + `There ${ctx.remaining === 1 ? 'is' : 'are'} ${ctx.remaining} step`
    + `${ctx.remaining === 1 ? '' : 's'} after this one.`
  )
}

export interface Prompt { system: string; user: string }

/**
 * Phrase one step as a question.
 *
 * Only called for a step with no authored `socratic` phrasing: an authored
 * question is used verbatim and never round-tripped through a model. The
 * `verbatim` flag rides along in the context anyway, so this function cannot
 * be the only thing enforcing that — see `/api/learn/socratic`.
 */
export function socraticPrompt(ctx: SocraticContext, subjectName?: string): Prompt {
  return {
    system:
      'You are a Socratic tutor leading one learner through one derivation'
      + `${subjectName ? ` in ${subjectName}` : ''}, one step at a time.\n\n`
      + `${FLOOR}\n\n`
      + 'Your job is to turn the named move into a question the learner can answer from what is '
      + 'already established. The move is often written as an instruction; do not simply bolt a '
      + 'question mark onto it, because an instruction phrased as a question contains its own '
      + 'answer. Ask instead about the thing the move turns on.\n\n'
      + `${MATH_SYNTAX}\n\n`
      + 'Reply with the question and nothing else.',
    user: contextBlock(ctx),
  }
}

/**
 * The reply turn: the learner has answered, or has said they are stuck.
 *
 * This is the primary path through a walk rather than the escape hatch it was
 * first written as. The learner's own words are included; the answer to the
 * step still is not. So it cannot become a marking turn however the learner
 * phrases the request — a model asked "is that right?" by something that does
 * not hold the answer can only ask a better question, which is the behaviour
 * wanted anyway. The guarantee is the missing field, not the instruction.
 *
 * The two cases get different instructions because they are different asks. An
 * answered step wants the question that moves past what they have shown; a
 * stuck one wants a smaller way into the same step. Writing one set of
 * instructions for both produced a reply that re-asked the step at a learner
 * who had just answered it.
 *
 * `answer` is trimmed and capped. A learner pasting their entire scratchpad is
 * normal, and the cap is here rather than at the route so that the prompt and
 * the test of the prompt agree about what gets sent.
 */
export function nudgePrompt(
  ctx: SocraticContext,
  learnerAnswer: string,
  subjectName?: string,
): Prompt {
  const said = learnerAnswer.trim().slice(0, 1200)
  const answered = said.length > 0
  return {
    system:
      'You are a Socratic tutor leading one learner through one derivation'
      + `${subjectName ? ` in ${subjectName}` : ''}, one step at a time. `
      + (answered
        ? 'The learner has just answered the current step in their own words.\n\n'
        : 'The learner is stuck on the current step and has not answered it.\n\n')
      + `${FLOOR}\n\n`
      + (answered
        ? 'Take what they wrote seriously and ask the ONE question it earns. If their reasoning '
          + 'has a gap you can see from what is established, aim the question at that gap. If it '
          + 'reads as complete, ask the question that takes the derivation forward from where '
          + 'they are. Do NOT re-ask the step they have just answered, do not grade what they '
          + 'wrote, and do not tell them they have it — you have not been told what this step '
          + 'establishes, so you cannot know either way. Never say "correct", "right", "exactly", '
          + '"good" or any synonym: the learner will read it as a mark, and it would be one you '
          + 'are not entitled to give.'
        : 'Ask a SMALLER question that gets at the same move — one they can answer from what is '
          + 'established, and which leaves the step itself still to be taken. Breaking the step '
          + 'into something answerable is the help; doing the step is not.')
      + `\n\n${MATH_SYNTAX}\n\n`
      + 'Reply with the question and nothing else.',
    user:
      `${contextBlock(ctx)}\n\n`
      + (answered
        ? `WHAT THE LEARNER WROTE\n${said}`
        : 'WHAT THE LEARNER SAID\n(nothing — they said only that they are stuck)'),
  }
}

/**
 * Both prompts for one step, by position, or null for a position off the end.
 *
 * The one place a caller should reach for: it builds the context itself, so no
 * route has to assemble a `SocraticContext` by hand and no route is in a
 * position to put the answer in one.
 */
export function promptFor(
  chain: QuestionChain,
  position: number,
  mode: 'ask' | 'nudge',
  learnerAnswer: string,
  subjectName?: string,
): { prompt: Prompt; context: SocraticContext } | null {
  const ctx = socraticContext(chain, position)
  if (!ctx) return null
  return {
    prompt: mode === 'nudge'
      ? nudgePrompt(ctx, learnerAnswer, subjectName)
      : socraticPrompt(ctx, subjectName),
    context: ctx,
  }
}
