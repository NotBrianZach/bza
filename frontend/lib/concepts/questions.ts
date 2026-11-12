/**
 * The question map — the fourth map, and the only one whose nodes are things
 * said rather than things known.
 *
 * The concept map's nodes are concepts, the practice map's are problems, the
 * narratives map's are destinations. This one's are **questions**: the steps a
 * derivation actually moves through, each one asked rather than told, so a
 * learner can be led to a result instead of shown it.
 *
 * ── The map is DERIVED, for the reason journeys.ts gives ──────────────────
 *
 * 283 subgoals are already authored, inside 87 worked examples, as
 * `{ label, detail }` pairs — the move a step makes, and what that move
 * establishes. They are ordered within their example, the example hangs off a
 * knowledge point, the point off a concept, and the concepts are already
 * ordered by `teachingOrder`. So the entire spine of a question map exists and
 * has never been read as one.
 *
 * An authored question LIST would be the obvious shape and is the same trap
 * journeys.ts names: the moment anybody edits a worked example, the list is a
 * second, stale opinion about how the derivation goes, and it is the one the
 * learner is being led through. Deriving makes the question map structurally
 * incapable of contradicting the worked example it came from.
 *
 * ── What is NOT free, measured before it was designed around ──────────────
 *
 * The first version of this idea assumed the questions were already written,
 * because the subgoal labels in the rational-expressions ontology read like
 * questions — "What pair am I looking for?", "Where is it undefined?", "What
 * was cancelled?". Counted across all six ontologies, **21 of 283** labels are
 * interrogative. Four of the six have none at all: arithmetic, functions,
 * matrices and vectors label their steps as instructions — "Add the places
 * separately", "Attach the digits", "Continue the multipliers past 10⁰".
 *
 * That figure is the whole reason this module is shaped the way it is, and it
 * is reported rather than smoothed over (`questionCoverage`). An imperative
 * step is not a Socratic question and cannot be turned into one by punctuation:
 * "Should you add the places separately?" telegraphs its own answer, which is
 * the one thing a Socratic question must not do. So:
 *
 *  - The STRUCTURE is derived and total — all 283 steps are nodes.
 *  - The PHRASING is authored where it exists (`authoredAsQuestion`), and
 *    produced at ask time from the move and its context otherwise.
 *  - `socratic?: string` on a subgoal is the override for the ones worth
 *    writing by hand, and the coverage figure is what says how many there are.
 *
 * ── Why a question is never evidence ──────────────────────────────────────
 *
 * This is the constraint that decides everything else, and it is not
 * negotiable: a Socratic answer is prose, `state` and `justify` are declared
 * unverifiable in types.ts, and `Observation` requires a `Verdict`. A model
 * reading an answer and approving it is exactly what PracticeChat's header
 * refuses — "a model saying 'that looks right' is not a ruling". So walking
 * this map advances NOTHING. No strength, no journey progress, no mastery.
 *
 * What it does instead is `convertsTo`: the rulable tasks on the same knowledge
 * point. A question chain is an introduction whose terminus is a problem, and
 * the problem is where the evidence comes from. Where `convertsTo` is empty the
 * conversation cannot become evidence at all, and `questionCoverage` counts
 * those separately — `log-argument-is-positive` is one, deliberately and
 * permanently, because "this expression is undefined" is not a value any
 * verifiable kind can ask for.
 *
 * ── Why the asking model is not told the answer ───────────────────────────
 *
 * `socraticContext` hands a tutor the problem, the moves already established,
 * and the move to ask about. It does NOT hand over that move's `detail`.
 *
 * Two things fall out, and both are the point. A model that has never seen the
 * answer cannot leak it into the question, which is the dominant failure of
 * generated Socratic prompts. And a model that has never seen the answer
 * cannot pretend to mark the learner against it — the authored `detail` is
 * revealed by the app, after, as the thing the learner checks themselves
 * against. The model phrases; it does not rule. Same line as everywhere else
 * in this engine, drawn at the one place it would otherwise be crossed.
 */

import {
  allKnowledgePoints, conceptById, conceptOfPoint, teachingOrder,
} from './registry'
import { tasksForPoint } from './tasks'
import type { ConceptOntology, KnowledgePoint } from './types'

// ---------------------------------------------------------------------------
// The nodes
// ---------------------------------------------------------------------------

export interface QuestionNode {
  /**
   * `<pointId>#<position>`.
   *
   * Reconstructible from the id alone, which is the same requirement
   * `generatedTaskById` carries and for the same reason: a stored answer has no
   * handle on its question except this string. Position rather than a subgoal
   * id because subgoals have none — so REORDERING a worked example renumbers
   * its questions, exactly as renaming a knowledge point would. Both are
   * authoring changes that invalidate stored references, and `questionById`
   * returning null is the honest outcome rather than a wrong node.
   */
  id: string
  knowledgePointId: string
  conceptId: string
  subjectId: string
  /** 0-based index within the worked example. The derivation's own order. */
  position: number
  /** The authored subgoal label: which move this step makes. */
  move: string
  /**
   * The authored subgoal detail: what the move establishes.
   *
   * The answer. Never sent to the asking model (see the header), and shown to
   * the learner only after they have answered.
   */
  establishes: string
  /**
   * Whether the author phrased the label as a question.
   *
   * 21 of 283 are. Carried per node rather than counted once, because a tutor
   * can use an authored question VERBATIM and has to invent the other 262 —
   * which are different levels of trust and should not look alike at the point
   * of use.
   */
  authoredAsQuestion: boolean
  /** The worked example's problem, which every question in the chain is about. */
  context: string
  /**
   * Tasks that can turn this chain's understanding into evidence.
   *
   * Empty means the conversation leads nowhere rulable. Not a fault — see the
   * header — but never hidden.
   */
  convertsTo: string[]
}

/** One worked example's questions, in derivation order. */
export interface QuestionChain {
  knowledgePointId: string
  conceptId: string
  /** The worked example's problem. */
  problem: string
  /** The authored final answer, for the end of the walk. */
  answer: string
  questions: QuestionNode[]
  /** Task ids on this point. Empty means the chain cannot convert to evidence. */
  convertsTo: string[]
}

/**
 * Is this label already a question?
 *
 * Trailing `?` and nothing cleverer. A heuristic that looked for interrogative
 * openers would claim "What the written algorithm was doing" — a real label,
 * and a noun phrase rather than a question. The punctuation is the author's own
 * statement of intent and is the only signal here that is not a guess.
 */
export function isInterrogative(label: string): boolean {
  return label.trimEnd().endsWith('?')
}

/**
 * Every question in a knowledge point's worked example, in order.
 *
 * `socratic` on a subgoal overrides the label for the ASKING without changing
 * `move`, so an authored question and the step it questions stay separable —
 * the map still draws the derivation, and the tutor still asks the better
 * sentence.
 */
export function questionsForPoint(
  o: ConceptOntology,
  point: KnowledgePoint,
): QuestionNode[] {
  const concept = conceptOfPoint(o, point.id)
  if (!concept) return []
  const convertsTo = tasksForPoint(point.id).map(t => t.id)
  return point.workedExample.subgoals.map((subgoal, position) => {
    const asked = subgoal.socratic ?? subgoal.label
    return {
      id: `${point.id}#${position}`,
      knowledgePointId: point.id,
      conceptId: concept.id,
      subjectId: concept.subjectId,
      position,
      move: asked,
      establishes: subgoal.detail,
      authoredAsQuestion: isInterrogative(asked),
      context: point.workedExample.problem,
      convertsTo,
    }
  })
}

/**
 * Every chain in the ontology, in teaching order.
 *
 * Teaching order and not file order, because the map is a route: a learner
 * walking it should meet the questions of a prerequisite before the questions
 * of what it gates. `teachingOrder` returns null on a cycle, and the fallback
 * is file order — a cycle is already reported by `ontologyProblems` and
 * `cycles`, and refusing to produce a map on top of that would hide the
 * questions rather than the cycle.
 */
export function questionChains(o: ConceptOntology): QuestionChain[] {
  const order = teachingOrder(o) ?? o.concepts.map(c => c.id)
  const rank = new Map(order.map((id, i) => [id, i]))

  return allKnowledgePoints(o)
    .map(point => {
      const questions = questionsForPoint(o, point)
      if (questions.length === 0) return null
      return {
        knowledgePointId: point.id,
        conceptId: questions[0].conceptId,
        problem: point.workedExample.problem,
        answer: point.workedExample.answer,
        questions,
        convertsTo: questions[0].convertsTo,
      }
    })
    .filter((c): c is QuestionChain => c !== null)
    .sort((a, b) => {
      const byConcept = (rank.get(a.conceptId) ?? 0) - (rank.get(b.conceptId) ?? 0)
      if (byConcept !== 0) return byConcept
      // Within a concept, the knowledge points' own authored order.
      return positionOf(o, a.knowledgePointId) - positionOf(o, b.knowledgePointId)
    })
}

function positionOf(o: ConceptOntology, pointId: string): number {
  for (const c of o.concepts) {
    const found = c.knowledgePoints.find(p => p.id === pointId)
    if (found) return found.position
  }
  return 0
}

/** Every question in the ontology, flattened, in the same order. */
export function allQuestions(o: ConceptOntology): QuestionNode[] {
  return questionChains(o).flatMap(c => c.questions)
}

/**
 * One question by id, or null.
 *
 * Null for a renumbered or renamed reference rather than the node that happens
 * to sit at that index now — see the note on `QuestionNode.id`.
 */
export function questionById(o: ConceptOntology, id: string): QuestionNode | null {
  const hash = id.lastIndexOf('#')
  if (hash < 1) return null
  const pointId = id.slice(0, hash)
  const position = Number(id.slice(hash + 1))
  if (!Number.isInteger(position) || position < 0) return null
  return allQuestions(o).find(q => q.knowledgePointId === pointId && q.position === position) ?? null
}

// ---------------------------------------------------------------------------
// The honest figures
// ---------------------------------------------------------------------------

export interface QuestionCoverage {
  questions: number
  /** Phrased as a question by the author. The rest are phrased at ask time. */
  authoredAsQuestions: number
  chains: number
  conceptsWithQuestions: number
  /**
   * Chains whose knowledge point has no rulable task.
   *
   * A conversation that cannot become evidence. Printed, never netted off.
   */
  chainsWithNoRuling: number
  /** Concepts in the ontology with no worked example anywhere — nothing to ask. */
  conceptsWithNoQuestions: number
}

export function questionCoverage(o: ConceptOntology): QuestionCoverage {
  const chains = questionChains(o)
  const questions = chains.flatMap(c => c.questions)
  const withQuestions = new Set(chains.map(c => c.conceptId))
  return {
    questions: questions.length,
    authoredAsQuestions: questions.filter(q => q.authoredAsQuestion).length,
    chains: chains.length,
    conceptsWithQuestions: withQuestions.size,
    chainsWithNoRuling: chains.filter(c => c.convertsTo.length === 0).length,
    conceptsWithNoQuestions: o.concepts.filter(c => !withQuestions.has(c.id)).length,
  }
}

/**
 * One line, for a surface that shows the map.
 *
 * Written here so every caller says the same thing, in the same shape as
 * `atlasCoverage`'s line: the structural total first, then how much of it is
 * authored rather than generated, then what cannot become evidence. A map that
 * printed only the first number would be claiming 283 Socratic questions, and
 * 262 of them do not exist yet as sentences.
 */
export function questionCoverageLine(o: ConceptOntology): string {
  const c = questionCoverage(o)
  const pct = c.questions === 0 ? 0 : Math.round(100 * c.authoredAsQuestions / c.questions)
  return (
    `${c.questions} question${c.questions === 1 ? '' : 's'} across ${c.chains} worked `
    + `example${c.chains === 1 ? '' : 's'} — ${c.authoredAsQuestions} written as questions `
    + `(${pct}%), the rest phrased from the step they ask about`
    + (c.chainsWithNoRuling > 0
      ? `. ${c.chainsWithNoRuling} chain${c.chainsWithNoRuling === 1 ? '' : 's'} `
        + `end${c.chainsWithNoRuling === 1 ? 's' : ''} with no problem to be set, so talking `
        + `through ${c.chainsWithNoRuling === 1 ? 'it' : 'them'} records nothing`
      : '')
  )
}

// ---------------------------------------------------------------------------
// What the tutor is given
// ---------------------------------------------------------------------------

export interface SocraticContext {
  /** The worked example's problem. */
  problem: string
  /** The moves already established, in order, with what each one gave. */
  established: { move: string; establishes: string }[]
  /** The move to ask about. Its `establishes` is deliberately absent. */
  ask: string
  /** True when `ask` is the author's own question and should be used verbatim. */
  verbatim: boolean
  /** How many steps remain after this one, so a tutor can pace the walk. */
  remaining: number
}

/**
 * Everything a tutor needs to ask one question, and nothing it must not have.
 *
 * The exclusion is the contract: `established` carries the details of every
 * PRIOR step — which is what a tutor mid-derivation legitimately knows — and
 * the current step contributes only its move. Asserted by the test suite
 * against the node's own `establishes`, because this is the one invariant whose
 * violation would be invisible in the output: a leaked answer reads as a
 * perfectly good question.
 */
export function socraticContext(
  chain: QuestionChain,
  position: number,
): SocraticContext | null {
  const node = chain.questions[position]
  if (!node) return null
  return {
    problem: chain.problem,
    established: chain.questions.slice(0, position).map(q => ({
      move: q.move,
      establishes: q.establishes,
    })),
    ask: node.move,
    verbatim: node.authoredAsQuestion,
    remaining: chain.questions.length - position - 1,
  }
}

/**
 * The chains a learner could be led through for one concept.
 *
 * Ordered by the knowledge points' own positions, so "lead me through
 * logarithms" walks the definition before the rules.
 */
export function chainsForConcept(o: ConceptOntology, conceptId: string): QuestionChain[] {
  if (!conceptById(o, conceptId)) return []
  return questionChains(o).filter(c => c.conceptId === conceptId)
}
