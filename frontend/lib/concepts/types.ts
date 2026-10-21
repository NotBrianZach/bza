/**
 * The fifth registry — what depends on what.
 *
 * Media say what an offering can be made of. Relations say what a reply can do to
 * one. Tuning says in what proportion. Scope says from which region of a medium.
 * None of them answers *what depends on what*, and that is the axis a practice
 * loop is made of: you cannot serve a problem about partial fractions to somebody
 * who cannot factor a quadratic, and no amount of narrowing the region says so.
 *
 * It is a graph rather than a flat enum, which is why it is a fifth registry and
 * not a fifth facet. Scope's value type is `medium → facet → option ids`: a set
 * membership test. A prerequisite is an edge, and the questions worth asking of it
 * — what is reachable, what did this exercise, what must never sit next to this —
 * are walks. A set cannot answer a walk.
 *
 * ── How this reuses the fourth registry rather than duplicating it ─────────
 *
 * A mathematical concept tree *is* a scope ontology over the `theorem` medium.
 * Not by analogy — by construction. "Algebra → rational expressions → partial
 * fractions" is a region of a medium, expressed as a search hint plus a membership
 * pattern, which is exactly what a `FacetOption` is (lib/correlate/scope.ts). So
 * each concept carries one, and `conceptFacet()` assembles a subject's concepts
 * into a real `Facet` the existing `facetAdmits` can enforce.
 *
 * It is deliberately NOT registered in `FACETS`. Doing so would put a mathematics
 * curriculum into the scope picker of all eleven correlation games, and the
 * ontology is the one thing the sibling engine does not share with them.
 *
 * ── Fidelity, and one honest correction to the design note ─────────────────
 *
 * Scope's two-kind distinction transfers intact and is restated per concept
 * because the UI needs it there. But the provider here is Wikipedia, via
 * lib/offerings/knowledge.ts — not a formal library. So 'checked' means *the
 * pattern decides against the page's own title, extract and categories*, which is
 * precisely what the shipped `theorem` branch facet already calls checked. It does
 * not mean mathlib-backed: nothing in this build reads a declaration name, a
 * module path or a hypothesis. A mathlib fidelity upgrade is a later change to the
 * provider, and until it lands, claiming decidable membership would be the exact
 * dishonesty the enforcement/caveat split exists to prevent.
 */

import type { Facet, FacetOption } from '@/lib/correlate/scope'

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

/**
 * The kinds of thing a learner can be asked to do.
 *
 * `verifiable` is the load-bearing field and it is a property of the *kind*, not
 * of an instance: no `justify` task will ever be ruled by a worker, so a
 * scheduler that treats one as pending-verification is waiting for something that
 * cannot arrive. Declaring it here is what lets the assembler refuse to serve a
 * kind the engine cannot rule, instead of serving it and silently never scoring it.
 */
export type TaskKind =
  /** Rewrite an expression into a named form. Machine-rulable: equivalence plus shape. */
  | 'transform_to_form'
  /** Produce a number from an expression at stated inputs. Machine-rulable. */
  | 'evaluate'
  /** State a definition or a theorem in your own words. Not machine-rulable. */
  | 'state'
  /** Produce an object that breaks a claim. Machine-rulable when the claim is an identity. */
  | 'counterexample'
  /** Argue why a step follows. Not machine-rulable, and should never pretend to be. */
  | 'justify'

export interface TaskKindSpec {
  id: TaskKind
  name: string
  /** What the learner is asked for, in one line. */
  asks: string
  /**
   * Whether a verifier can rule it at all.
   *
   * False is not a deficiency to be engineered away. "Explain why this step
   * follows" is the most valuable thing to ask and the least mechanisable, and a
   * build that only asks what it can grade has chosen its curriculum to suit its
   * grader.
   */
  verifiable: boolean
}

/**
 * The named forms a `transform_to_form` task can demand.
 *
 * A form is a claim about *syntax*, which is why it is checked here rather than by
 * the worker: "write this as a sum of partial fractions" is not satisfied by
 * handing back the original expression, however equivalent it is. Equivalence and
 * form are two independent rulings and both have to pass — see verify.ts.
 *
 * ── This union was the one part of the schema a second subject broke ──────
 *
 * It used to hold four members, all of them rational-expression forms. The
 * exponents-and-logarithms ontology could therefore not ask for
 * `transform_to_form` AT ALL — the natural demands in that subject are "as a
 * single power", "with no negative exponents" and "radical-free", and none
 * existed. So it shipped `evaluate`-only tasks and recorded the gap in its own
 * header rather than inventing a form that half-fitted.
 *
 * The forms are no longer one subject's. What makes this safe to extend is in
 * forms.ts: `FORM_CHECKS` is a `Record<NamedForm, FormSpec>`, so the compiler
 * refuses a new member here until a checker for it exists. Adding a form name
 * without a way to rule it is the failure that matters, and it is now
 * impossible rather than merely discouraged.
 *
 * A form is NOT tagged with a subject, deliberately. "No negative exponents" is
 * a syntactic property of an expression, not a fact about a curriculum, and
 * tagging would rebuild the same coupling one level up — an ontology would then
 * be restricted to its own forms, and a rational-expression task that wanted a
 * radical-free answer could not say so.
 */
export type NamedForm =
  // ── Rational expressions ──
  /** A sum of terms, each a constant over a power of a factor. */
  | 'partial_fractions'
  /** One quotient. No top-level sum. */
  | 'single_fraction'
  /** A product of factors, or a constant times one. No top-level sum. */
  | 'factored'
  /** A sum of monomials. No unexpanded product of sums, no quotient by a non-constant. */
  | 'expanded'
  // ── Exponents and logarithms ──
  /** One power, or a plain numeral or symbol. No product or quotient of powers of one base. */
  | 'single_power'
  /** Every exponent non-negative. `x^-2` must be written as `1/x^2`. */
  | 'no_negative_exponents'
  /** No `sqrt` and no fractional exponent. */
  | 'radical_free'

// ---------------------------------------------------------------------------
// Knowledge points
// ---------------------------------------------------------------------------

/**
 * A worked example, with its subgoals labelled.
 *
 * Subgoal-labelled rather than a flat list of steps, and the difference is the
 * whole reason this is a required field rather than an optional one. A flat list
 * teaches the moves of this problem; a labelled one teaches which move answers
 * which question, which is what transfers to the next problem. An unlabelled
 * worked example is a solution, not an example.
 */
export interface WorkedExample {
  problem: string
  subgoals: { label: string; detail: string }[]
  answer: string
}

export interface KnowledgePoint {
  id: string
  conceptId: string
  /** One or two sentences, in the learner's language rather than the field's. */
  statement: string
  /** Required. See the note on WorkedExample. */
  workedExample: WorkedExample
  /** Dual coding — a figure, when one exists. Absent is honest; a placeholder is not. */
  visualRef?: string
  /** Order within the concept. */
  position: number
  /**
   * Target time in milliseconds for an unaided correct answer.
   *
   * Absent means automaticity is not tracked for this point, which is the right
   * answer for most of them: a timing target on "explain why the degrees must
   * match" measures typing. Only set it where speed is genuinely part of the
   * skill, and the scheduler reads its absence as "do not time this" rather than
   * as a missing value to default.
   */
  automaticityTarget?: number
}

export interface Objective {
  id: string
  /** What the learner will be able to do. */
  statement: string
  /**
   * The task kinds that evidence this objective. Never empty — an objective with
   * no kind names no observation, so nothing could ever satisfy it, and a
   * curriculum full of those looks complete while being unreachable.
   */
  taskKinds: TaskKind[]
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

export interface Concept {
  id: string
  name: string
  /** Which subject ontology this belongs to. */
  subjectId: string
  /**
   * The facet option that selects this concept's offerings — a search hint plus a
   * membership pattern over the `theorem` medium. See the header: this is the
   * fourth registry's own mechanism, owned here instead of in `FACETS`.
   */
  scope: FacetOption
  /**
   * 'checked' when `scope.match` decides membership against the provider's text;
   * 'guided' when nothing does.
   *
   * Derivable from the option, and restated anyway because the UI prints it per
   * concept and a derived value would have to be recomputed at every print site.
   * `conceptFacet` asserts the two agree rather than trusting this field.
   */
  fidelity: 'checked' | 'guided'
  /** Required when guided. Printed verbatim; never summarised away. */
  caveat?: string
  objectives: Objective[]
  knowledgePoints: KnowledgePoint[]
}

/**
 * The kinds of edge between two concepts.
 *
 * Four rather than one, because the principles they encode are not the same
 * relation and folding them into "depends on" loses the three that do work:
 *
 *  - `prerequisite` gates introduction. Mastery learning: you are not shown a
 *    concept until what it rests on is strong.
 *  - `encompasses` is what makes credit computable. Exercising an advanced
 *    concept exercises what it encompasses, so a prerequisite you just used does
 *    not come due as though untouched. Without this edge a learner re-drills
 *    exactly what they most recently demonstrated — the dominant inefficiency in
 *    a domain that is mostly prerequisite structure.
 *  - `interferes_with` is a hard selection constraint: never introduce these
 *    together. Authored, never inferred, because similarity of *name* is a poor
 *    proxy — `sin` and `sinh` interfere; two unrelated lemmas with similar names
 *    do not.
 *  - `candidate_prerequisite` is imported structure held in quarantine until a
 *    human promotes it. It participates in no walk and gates nothing. Its only
 *    job is to be counted: the promotion rate is the measurement that tells you
 *    whether the ontology is authorable at scale, and that number is only
 *    meaningful if unpromoted edges are still in the file.
 */
export type ConceptEdgeKind =
  | 'prerequisite'
  | 'candidate_prerequisite'
  | 'interferes_with'
  | 'encompasses'

/**
 * One edge. Direction is `from` → `to` and reads differently per kind, which is
 * worth stating once because getting it backwards is silent:
 *
 *   prerequisite            `from` must be strong before `to` is introduced
 *   candidate_prerequisite  the same claim, unpromoted
 *   encompasses             exercising `from` also exercises `to`
 *   interferes_with         symmetric; stored once, read both ways
 */
export interface ConceptEdge {
  id: string
  from: string
  to: string
  kind: ConceptEdgeKind
  /** Who promoted it. Absent on a candidate, and that absence is the quarantine. */
  promotedBy?: string
  /**
   * Who reviewed it and said no.
   *
   * The quarantine had only two states — unreviewed candidate, or promoted edge —
   * and no way to record that a person looked and declined. That gap costs more
   * than it sounds:
   *
   *  - A rejected proposal is indistinguishable from one nobody has opened, so
   *    the same bad edge is re-reviewed forever.
   *  - Derivation and import produce candidates in bulk (derive.ts proposes
   *    eleven at 8% precision). Without a way to dismiss one, the pending list
   *    only grows and stops being a worklist.
   *  - "Looked and said no" is *evidence about the proposal mechanism* and the
   *    most valuable kind. Deleting the edge instead would throw it away, and
   *    would also inflate `promotionRate` by shrinking its denominator — turning
   *    a measurement of whether structure is importable into a measurement of
   *    how much got deleted.
   *
   * So a rejected edge stays in the file, still `candidate_prerequisite`, still
   * gating nothing, with its reason attached. It is excluded from the pending
   * worklist and counted in full by the rate.
   *
   * Mutually exclusive with `promotedBy`; `ontologyProblems` enforces that, and
   * `rationale` is required here because an unexplained rejection cannot be
   * revisited.
   */
  rejectedBy?: string
  /** Why. Required on `interferes_with` and on a rejection; an unexplained one is unreviewable. */
  rationale?: string
}

export interface Subject {
  id: string
  name: string
  /** One line on what the ontology covers, and what it does not. */
  covers: string
  /** The medium the concepts are a scope over. `theorem` for mathematics. */
  medium: 'theorem'
  /** The facet heading and description, for the assembled `Facet`. */
  facetName: string
  facetDoes: string
}

export interface ConceptOntology {
  subject: Subject
  concepts: Concept[]
  edges: ConceptEdge[]
}

// ---------------------------------------------------------------------------
// Practice tasks
// ---------------------------------------------------------------------------

/** A declared symbol and the assumptions it carries. Mirrors the worker's `variables`. */
export interface VariableDeclaration {
  name: string
  /**
   * Assumption flags, passed through to the engine.
   *
   * Declared rather than inferred because `Symbol('x')` and
   * `Symbol('x', positive=True)` simplify differently — a tree that invented
   * symbols as it walked would silently decide the mathematics. This is the
   * worker's rule (worker/mathwb/exprtree.py) and it is restated here so a task
   * author cannot omit it by accident.
   */
  assumptions?: Record<string, boolean>
}

export interface PracticeTask {
  id: string
  knowledgePointId: string
  kind: TaskKind
  /** What the learner reads. */
  prompt: string
  /** The expression to start from, in the restricted infix `parseExpression` accepts. */
  given: string
  /** `transform_to_form` only: the form the answer must be in. */
  form?: NamedForm
  /**
   * An upper bound on the degree of the answer's denominator.
   *
   * Set it when the task asks for a *reduction* rather than a change of shape.
   * "Reduce to lowest terms" is a claim about the answer relative to the input,
   * and `form` cannot express it — a fraction that has had nothing cancelled is
   * still a single fraction, and is still equivalent to itself. Without this
   * bound a cancellation task accepts its own input as correct. See
   * `checkDenominatorDegree` in forms.ts.
   */
  maxDenominatorDegree?: number
  variables: VariableDeclaration[]
  /** Domain conditions the author states, e.g. `x != 1`. Carried into every ruling. */
  domainConditions?: string[]
  /**
   * The author's own answer.
   *
   * Used as the right-hand side of an equivalence check and never shown before a
   * ruling. It is not "the" answer: any expression equivalent to it and in the
   * demanded form is correct, which is the only defensible reading of "write this
   * as a sum of partial fractions".
   */
  reference: string
  /** `evaluate` only: the inputs to substitute. Exact numerals as strings. */
  at?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Rulings
// ---------------------------------------------------------------------------

/**
 * How much help the learner had.
 *
 * The distinction the whole evidence design exists to keep: a hint-assisted
 * correct answer and an independent one are different observations, and bza's own
 * quiz path collapses them (`mastered = score >= 0.6` in
 * lib/queries/knowledge-graph.ts counts any success regardless of assistance).
 * Only 'none' advances strength — see scheduling.ts.
 */
export type Assistance = 'none' | 'hint' | 'worked_example'

export interface Verdict {
  /**
   * The ruling.
   *
   * `inconclusive` is first-class and is **never** scored as wrong. The engine
   * failing to settle a question is a statement about the engine, not about the
   * learner — scoring it against them trains them on this build's limitations.
   * It routes to human review instead. This is the one rule in the design most
   * likely to be quietly violated by a later convenience, so both the scheduler
   * and the persisted observation enforce it independently.
   */
  ruling: 'correct' | 'incorrect' | 'inconclusive' | 'abandoned'
  /** How it was decided. An inconclusive ruling names what it tried. */
  method: string
  /**
   * Populated for 'incorrect': the first step that does not follow.
   *
   * This is what replaces the correlation engine's reply guarantee. There, a
   * failed turn is answered with a salvaged offering, because a player who scoped
   * themselves into a corner deserves an answer rather than a dead chain. Here
   * that would be a lie: when the learner is wrong the correct response is
   * *wrong, and here is the step that broke*. Both refuse to leave somebody with
   * nothing; they disagree about what "something" is.
   */
  brokeAt?: { step: number; detail: string }
  /**
   * The domain the ruling holds on. Never dropped.
   *
   * `(x^2 - 1)/(x - 1)` and `x + 1` are different functions and the difference is
   * exactly `x != 1`. A ruling of "correct" that discards that condition has
   * taught the learner something false.
   */
  conditions: string[]
  /**
   * Where the ruling came from, when a run produced it.
   *
   * Carried so a verdict can be re-examined against the ledger rather than
   * believed. Absent when nothing was run — an unconfigured worker, or a form
   * check that settled the question before any engine was asked.
   */
  evidence?: {
    runId?: string | number
    engineVersion?: string
    environmentHash?: string
    /** What the result is entitled to claim. The worker's own field, passed through. */
    evidenceKind?: string
    cached?: boolean
  }
}

/** One recorded attempt. The unit the scheduler reads. */
export interface Observation {
  knowledgePointId: string
  taskId: string
  kind: TaskKind
  verdict: Verdict
  assistance: Assistance
  /** What the learner submitted, verbatim. */
  answer: string
  /** Milliseconds from task shown to submission, when the client measured it. */
  elapsedMs?: number
  /** ISO timestamp. Passed in rather than read from a clock, so this stays pure. */
  at: string
}
