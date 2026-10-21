/**
 * Practice tasks for the rational-expressions ontology.
 *
 * TWO KINDS ARE IMPLEMENTED END TO END. `transform_to_form` is machine-rulable in
 * both of its dimensions — equivalence by the worker, form by forms.ts — so it is
 * the kind that exercises the whole verifier path including the inconclusive
 * branch. `evaluate` is ruled by exact rational arithmetic in verify.ts and needs
 * no worker at all; see `ruleEvaluate` for why that is a correctness requirement
 * rather than an optimisation.
 *
 * `state` and `justify` remain declared in the registry (registry.ts) with
 * `verifiable: false` and carry no tasks, because a build that served a `justify`
 * task and then silently never scored it would look complete and quietly stop
 * recording evidence. `counterexample` is declared verifiable and also carries no
 * tasks: it needs a ruler that can check a produced object against a claim, and
 * until that exists a task of the kind would be served and never settled.
 *
 * ── Why the evaluate tasks look like they are testing the wrong thing ──────
 *
 * Several of them ask for the value of something that is not the skill's output:
 * the discriminant of a quadratic, a denominator at an excluded point, the left
 * side of a cleared identity at a root. That is deliberate and it is how an
 * `evaluate` task earns its place next to a knowledge point whose natural kind is
 * `state` or `justify`.
 *
 * "Name the excluded points" is not machine-rulable — it asks for a set, in prose.
 * But the *reason* a point is excluded is that the denominator vanishes there, and
 * `x^2 - 2x - 15` at `x = 5` is exactly that computation. So the task asks the one
 * question in the vicinity that has a checkable answer, rather than asking the
 * real question and grading it by keyword. Each such task names what it is
 * standing in for, so nobody later mistakes the proxy for the objective.
 *
 * `reference` is the author's answer and is never the *only* answer. Any
 * expression equivalent to it and in the demanded form is correct, which is the
 * only defensible reading of "write this as a sum of partial fractions" — the
 * terms may be in any order, the constants may be written as fractions or
 * decimals, and `-3/2 x` and `-(3/2)x` are the same thing.
 *
 * Every `given`/`reference` pair here was checked by hand against the worked
 * example it practises. The test suite re-checks the shape of each one (parses,
 * declares its symbols, reference satisfies its own demanded form); it cannot
 * re-check the algebra without the worker, which is the point of the worker.
 */

import { generatedTaskById } from './generators'
import type { PracticeTask } from './types'

/** Every task declares its symbols. Most of them are one real variable. */
const REAL_X = [{ name: 'x', assumptions: { real: true } }]

/** The discriminant tasks are in the coefficients, not in x. */
const REAL_ABC = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

export const TASKS: PracticeTask[] = [
  // ── polynomial-arithmetic ───────────────────────────────────────────────
  {
    id: 'expand-binomials-1',
    knowledgePointId: 'expand-binomials',
    kind: 'transform_to_form',
    prompt: 'Expand and collect like terms.',
    given: '(x + 3)(x - 5)',
    form: 'expanded',
    variables: REAL_X,
    reference: 'x^2 - 2x - 15',
  },
  {
    id: 'expand-binomials-2',
    knowledgePointId: 'expand-binomials',
    kind: 'transform_to_form',
    prompt: 'Expand and collect like terms.',
    given: '(2x - 1)(x + 4)',
    form: 'expanded',
    variables: REAL_X,
    reference: '2x^2 + 7x - 4',
  },
  {
    id: 'add-polynomials-1',
    knowledgePointId: 'add-polynomials',
    kind: 'transform_to_form',
    prompt: 'Add these and collect like terms.',
    given: '(2x^2 - x + 4) + (x^2 + 5x - 9)',
    form: 'expanded',
    variables: REAL_X,
    reference: '3x^2 + 4x - 5',
  },

  // ── factoring-quadratics ────────────────────────────────────────────────
  {
    id: 'factor-monic-1',
    knowledgePointId: 'factor-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this into two linear factors.',
    given: 'x^2 - 2x - 15',
    form: 'factored',
    variables: REAL_X,
    reference: '(x + 3)(x - 5)',
  },
  {
    id: 'factor-monic-2',
    knowledgePointId: 'factor-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this into two linear factors.',
    given: 'x^2 - 25',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 5)(x + 5)',
  },
  {
    id: 'factor-non-monic-1',
    knowledgePointId: 'factor-non-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this. The leading coefficient is not 1.',
    given: '2x^2 + 7x + 3',
    form: 'factored',
    variables: REAL_X,
    reference: '(2x + 1)(x + 3)',
  },

  // ── polynomial-division ─────────────────────────────────────────────────
  {
    id: 'long-division-1',
    knowledgePointId: 'long-division',
    kind: 'transform_to_form',
    prompt:
      'Divide, and write the result as a polynomial plus a proper fraction — ' +
      'quotient + remainder/divisor.',
    given: '(x^2 + 3x + 5)/(x + 1)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -1'],
    // The polynomial part makes this a sum of three terms, two of which carry no
    // denominator. That is legal partial-fraction form and is exactly what the
    // `improper-first` knowledge point is about.
    reference: 'x + 2 + 3/(x + 1)',
  },

  // ── simplifying-rational ────────────────────────────────────────────────
  {
    id: 'cancel-common-factors-1',
    knowledgePointId: 'cancel-common-factors',
    kind: 'transform_to_form',
    prompt: 'Reduce to lowest terms, as a single fraction.',
    given: '(x^2 - 2x - 15)/(x^2 - 25)',
    form: 'single_fraction',
    // Without this the task accepts its own input: the unreduced fraction is a
    // single fraction and is equivalent to itself, so both rulings pass. The
    // bound is what makes "reduce" checkable — cancelling (x - 5) takes the
    // denominator from degree 2 to degree 1.
    maxDenominatorDegree: 1,
    variables: REAL_X,
    // Both conditions are stated by the author, including the one the answer no
    // longer shows. A ruling of "correct" carries them back out.
    domainConditions: ['x != 5', 'x != -5'],
    reference: '(x + 3)/(x + 5)',
  },

  // ── combining-rational ──────────────────────────────────────────────────
  {
    id: 'combine-two-1',
    knowledgePointId: 'combine-two',
    kind: 'transform_to_form',
    prompt: 'Write this as a single fraction.',
    given: '1/(x + 3) + 2/(x - 5)',
    form: 'single_fraction',
    variables: REAL_X,
    domainConditions: ['x != -3', 'x != 5'],
    reference: '(3x + 1)/((x + 3)(x - 5))',
  },
  {
    id: 'combine-two-2',
    knowledgePointId: 'combine-two',
    kind: 'transform_to_form',
    prompt: 'Write this as a single fraction.',
    given: '3/(x - 1) - 1/(x + 2)',
    form: 'single_fraction',
    variables: REAL_X,
    domainConditions: ['x != 1', 'x != -2'],
    reference: '(2x + 7)/((x - 1)(x + 2))',
  },

  // ── partial-fractions-linear ────────────────────────────────────────────
  // The kind's flagship task, and the inverse of combine-two-1 on purpose.
  {
    id: 'decompose-distinct-1',
    knowledgePointId: 'decompose-distinct',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions.',
    given: '(3x + 1)/((x + 3)(x - 5))',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -3', 'x != 5'],
    reference: '1/(x + 3) + 2/(x - 5)',
  },
  {
    id: 'decompose-distinct-2',
    knowledgePointId: 'decompose-distinct',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions. Factor the denominator first.',
    given: '(5x - 7)/(x^2 - 3x + 2)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != 1', 'x != 2'],
    // x^2 - 3x + 2 = (x-1)(x-2). A/(x-1) + B/(x-2): 5x - 7 = A(x-2) + B(x-1).
    // x = 2 gives 3 = B. x = 1 gives -2 = -A, so A = 2.
    reference: '2/(x - 1) + 3/(x - 2)',
  },

  // ── partial-fractions-repeated ──────────────────────────────────────────
  {
    id: 'one-term-per-power-1',
    knowledgePointId: 'one-term-per-power',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions. The denominator has a repeated factor.',
    given: '(x + 4)/(x + 1)^2',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -1'],
    reference: '1/(x + 1) + 3/(x + 1)^2',
  },

  // ── partial-fractions-quadratic ─────────────────────────────────────────
  {
    id: 'linear-numerator-1',
    knowledgePointId: 'linear-numerator',
    kind: 'transform_to_form',
    prompt:
      'Decompose into partial fractions. Check whether the quadratic factor is irreducible ' +
      'before choosing a template.',
    given: '(2x + 1)/((x - 1)(x^2 + 1))',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != 1'],
    reference: '(3/2)/(x - 1) + (-(3/2)x + 1/2)/(x^2 + 1)',
  },

  // ── irreducible-quadratic ───────────────────────────────────────────────
  // Standing in for: "show that a quadratic does not factor over the reals",
  // whose honest kind is `justify`. The discriminant is what decides it, and the
  // discriminant is a number, so that is the part a verifier can rule.
  {
    id: 'discriminant-1',
    knowledgePointId: 'irreducible-quadratic',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² + x + 1. A negative value means no real linear factors.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '1', c: '1' },
    // 1 - 4·1·1 = -3. The worked example's own number.
    reference: '-3',
  },
  {
    id: 'discriminant-2',
    knowledgePointId: 'irreducible-quadratic',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² − 2x − 15. Compare what you get with the fact that it ' +
      'factors as (x + 3)(x − 5).',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '-2', c: '-15' },
    // 4 - 4·1·(-15) = 4 + 60 = 64, a perfect square — which is why the factors
    // came out rational in factor-monic-1.
    reference: '64',
  },

  // ── improper-first ──────────────────────────────────────────────────────
  {
    id: 'improper-first-1',
    knowledgePointId: 'improper-first',
    kind: 'transform_to_form',
    prompt:
      'This fraction is improper. Divide first, then write it as a polynomial plus a proper ' +
      'fraction.',
    given: '(2x^2 + 5x + 1)/(x + 2)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -2'],
    // (x + 2)(2x + 1) = 2x² + 5x + 2, so the numerator is that less 1.
    reference: '2x + 1 - 1/(x + 2)',
  },
  {
    id: 'improper-first-2',
    knowledgePointId: 'improper-first',
    kind: 'evaluate',
    prompt:
      'Evaluate the improper fraction at x = 2. It is the same expression long-division-1 ' +
      'rewrote, so the quotient form must give this same value.',
    given: '(x^2 + 3*x + 5)/(x + 1)',
    variables: REAL_X,
    at: { x: '2' },
    domainConditions: ['x != -1'],
    // (4 + 6 + 5)/3 = 15/3 = 5. And x + 2 + 3/(x + 1) at 2 is 4 + 1 = 5.
    reference: '5',
  },

  // ── excluded-points ─────────────────────────────────────────────────────
  // Standing in for: "name every point this expression excludes, and say why",
  // whose honest kind is `state`. What is checkable is the computation the
  // knowledge point rests on — the denominator really does vanish there.
  {
    id: 'excluded-points-1',
    knowledgePointId: 'excluded-points',
    kind: 'evaluate',
    prompt:
      'Evaluate the denominator of (x + 3)/(x² − 2x − 15) at x = 5. What you get is why 5 is ' +
      'excluded.',
    given: 'x^2 - 2*x - 15',
    variables: REAL_X,
    at: { x: '5' },
    // 25 - 10 - 15 = 0.
    reference: '0',
  },
  {
    id: 'excluded-points-2',
    knowledgePointId: 'excluded-points',
    kind: 'evaluate',
    prompt:
      'Now the same denominator at x = −3. Note that the numerator vanishes there too, and ' +
      'that 0/0 is still not a value.',
    given: 'x^2 - 2*x - 15',
    variables: REAL_X,
    at: { x: '-3' },
    // 9 + 6 - 15 = 0.
    reference: '0',
  },

  // ── cancelling-keeps-the-hole ───────────────────────────────────────────
  {
    id: 'cancelling-keeps-the-hole-1',
    knowledgePointId: 'cancelling-keeps-the-hole',
    kind: 'evaluate',
    prompt:
      'Evaluate 1/(x − 5) at x = −3. The expression it came from, (x + 3)/((x + 3)(x − 5)), ' +
      'is undefined there — so these are not the same function.',
    given: '1/(x - 5)',
    variables: REAL_X,
    at: { x: '-3' },
    // 1/(-8). The worked example's own value, and the whole point: the cancelled
    // form has a value at the hole, which is why cancelling changed the function.
    domainConditions: ['x != 5'],
    reference: '-1/8',
  },

  // ── terms-are-not-factors ───────────────────────────────────────────────
  {
    id: 'terms-are-not-factors-1',
    knowledgePointId: 'terms-are-not-factors',
    kind: 'evaluate',
    prompt:
      'Evaluate (x + 3)/(x + 5) at x = 1. Compare it with 3/5 — the answer you get if you ' +
      'cancel the x out of a sum.',
    given: '(x + 3)/(x + 5)',
    variables: REAL_X,
    at: { x: '1' },
    domainConditions: ['x != -5'],
    // 4/6 = 2/3, and 2/3 is not 3/5. The disconfirming computation, not an
    // assertion that cancelling terms is illegal.
    reference: '2/3',
  },

  // ── why-substitution-is-legal ───────────────────────────────────────────
  {
    id: 'why-substitution-is-legal-1',
    knowledgePointId: 'why-substitution-is-legal',
    kind: 'evaluate',
    prompt:
      'Clearing denominators in (3x + 1)/((x + 3)(x − 5)) gives the identity ' +
      '3x + 1 = A(x − 5) + B(x + 3). Evaluate its left side at x = 5.',
    given: '3*x + 1',
    variables: REAL_X,
    at: { x: '5' },
    // 16, which is the 16 = 8B of the worked example. No domain conditions, and
    // that absence is the knowledge point: the cleared identity is a polynomial
    // one and excludes nothing, which is what licenses substituting the root.
    reference: '16',
  },
]

/**
 * An authored task, or a generated one rebuilt from its id.
 *
 * The verify route looks a submission up by id and has no other handle on it, so
 * a generated instance has to be reconstructible from its id alone — which is
 * exactly what `generatedTaskById` does. Authored ids are checked first and
 * cannot collide: a generated id contains an `@` and no authored one does.
 */
export function taskById(id: string): PracticeTask | null {
  const authored = TASKS.find(t => t.id === id)
  if (authored) return authored
  return generatedTaskById(id)
}

export function tasksForPoint(knowledgePointId: string): PracticeTask[] {
  return TASKS.filter(t => t.knowledgePointId === knowledgePointId)
}

/**
 * The variable a form check is about.
 *
 * The first declared variable, because the declaration order is the author's own
 * statement of which one the problem is in. Guessing it from the tree would pick
 * whichever symbol happened to be mentioned first by the learner.
 */
export function primaryVariable(task: PracticeTask): string {
  return task.variables[0]?.name ?? 'x'
}
