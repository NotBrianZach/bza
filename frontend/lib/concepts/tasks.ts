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

/**
 * The arithmetic tasks declare `integer`, not `real`.
 *
 * It is a stronger assumption than the algebra tasks make and it is the honest
 * one: every symbol in that subject stands for a whole number, and a remainder
 * or a digit sum is not a statement about the reals. `integer` is in the
 * worker's own `ALLOWED_ASSUMPTIONS` (worker/mathwb/exprtree.py), so the
 * declaration survives the round trip even though these tasks are settled
 * locally and never reach it.
 */
const WHOLE_ABC = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

const WHOLE_ABCD = [...WHOLE_ABC, { name: 'd', assumptions: { integer: true } }]

/**
 * Coefficients plus the variable, for the functions subject.
 *
 * Real rather than integer: these stand for the parameters of an arbitrary
 * linear or quadratic rule, and nothing in those concepts is about whole
 * numbers. The arithmetic subject declares `integer` for the opposite reason.
 */
const REAL_ABC_X = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'x', assumptions: { real: true } },
]

/**
 * Matrix entries, named by position rather than by letter.
 *
 * `a11` rather than `a` because the subject's whole difficulty is which entry
 * goes with which — row 1 against column 1 — and a task whose symbols were
 * `a, b, c, d` would hide the one thing being drilled. The determinant tasks
 * are the exception and use `a, b, c, d`, because `ad − bc` is universally
 * written that way and renaming it would make the formula unrecognisable.
 */
const MATRIX_ROW_VEC = [
  { name: 'a11', assumptions: { real: true } },
  { name: 'a12', assumptions: { real: true } },
  { name: 'x1', assumptions: { real: true } },
  { name: 'x2', assumptions: { real: true } },
]

const MATRIX_AB = [
  { name: 'a11', assumptions: { real: true } },
  { name: 'a12', assumptions: { real: true } },
  { name: 'b11', assumptions: { real: true } },
  { name: 'b21', assumptions: { real: true } },
]

/** The determinant's own lettering, kept because `ad − bc` is how it is read. */
const MATRIX_ABCD = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

/**
 * Vector components, subscripted by position.
 *
 * `u1`/`u2` rather than `a`/`b` for the same reason the matrix entries are
 * `a11`: which component goes with which is the thing being learned, and
 * single letters would hide it. Real rather than integer — a displacement is
 * not a whole-number object even when these examples happen to use them.
 */
const VEC_V = [
  { name: 'v1', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
]

const VEC_U = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
]

const VEC_UV = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
]

const VEC_UV_FULL = [...VEC_U, ...VEC_V.map(v => ({ ...v, name: v.name }))]

const VEC_UW = [
  ...VEC_U,
  { name: 'w1', assumptions: { real: true } },
  { name: 'w2', assumptions: { real: true } },
]

const VEC_WEIGHTED = [
  { name: 'c1', assumptions: { real: true } },
  { name: 'c2', assumptions: { real: true } },
  { name: 'u1', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
]

const VEC_WEIGHTED_2 = [
  { name: 'c1', assumptions: { real: true } },
  { name: 'c2', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
]

/** Four digits, most significant first. Shared by the two four-digit tasks. */
const WHOLE_DIGITS = [
  { name: 'd3', assumptions: { integer: true } },
  { name: 'd2', assumptions: { integer: true } },
  { name: 'd1', assumptions: { integer: true } },
  { name: 'd0', assumptions: { integer: true } },
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

  // ── counterexample ──────────────────────────────────────────────────────
  //
  // `given` is an `equation` node — the claim to be broken — rather than an
  // expression to be rewritten. That is the one place a task's `given` is not
  // the thing the learner manipulates, and `ruleCounterexample` reads both of
  // its sides.
  //
  // `reference` is *an* answer and emphatically not *the* answer: any point where
  // the two sides differ is correct, and the ruler never compares against this.
  // It is here so the shipped set can be checked for having a witness at all.
  {
    id: 'break-terms-are-not-factors-1',
    knowledgePointId: 'terms-are-not-factors',
    kind: 'counterexample',
    prompt:
      'Somebody cancelled the x out of the top and bottom and claims this. Give a value of x ' +
      'that proves them wrong.',
    given: '(x + 3)/(x + 5) = 3/5',
    variables: REAL_X,
    domainConditions: ['x != -5'],
    // At x = 1 the left side is 4/6 = 2/3 and the right is 3/5. Any x other than
    // 0 works, which is the point — the claim is false almost everywhere, and a
    // learner who finds x = 0 (where it happens to hold) has learned something
    // sharper than one who finds x = 1.
    reference: '1',
  },
  // NOT AUTHORED, and the reason is worth keeping where the next author will see
  // it. `cancelling-keeps-the-hole` looks like the best counterexample task in
  // the subject — "(x+3)/((x+3)(x−5)) and 1/(x−5) are the same function" is a
  // claim worth breaking. It cannot be one here.
  //
  // Those two expressions are equal at *every* point where both are defined. The
  // only thing separating them is x = −3, where the left side is undefined — and
  // `ruleCounterexample` correctly refuses an undefined-side point, because an
  // excluded point does not refute a claim about values. So the task would have
  // no answer the engine accepts, which is precisely the "looks like practice and
  // records nothing" failure the kind registry exists to prevent.
  //
  // The gap is real and is in the *claim language*, not the ruler: refuting a
  // claim about domains needs a task kind that compares domains, and this engine
  // has none. `state` already covers the point for a human reader.

  // ── exponents-and-logarithms ────────────────────────────────────────────
  //
  // Mostly `evaluate`, which exact arithmetic rules with no worker — that is
  // what makes this the first subject fully gradable on a deployment with none.
  //
  // `given` on an `evaluate` task carries a *numeric* instance rather than the
  // general rule, because `evaluate` substitutes and compares values.
  //
  // THE FORM TASKS BELOW ARE NEW, and they are the thing the subject was
  // originally unable to ask for. `NamedForm` held only rational-expression
  // forms, so "write this as a single power" had nowhere to go; the subject
  // shipped evaluate-only and recorded that as a schema defect rather than
  // inventing a form that half-fitted. The union is now open and
  // `FORM_CHECKS` is total over it, so the demand this subject actually makes
  // is expressible and rulable.
  //
  // These three need the worker for equivalence, unlike their evaluate
  // neighbours — so on a deployment with none they rule inconclusive and the
  // learner is told so up front by `verifier.configured`.
  {
    id: 'add-exponents-1',
    knowledgePointId: 'add-exponents-on-product',
    kind: 'evaluate',
    prompt:
      'Evaluate 2³ · 2⁴ by adding the exponents first. The answer is a single power of 2 — give its value.',
    given: 'b^m * b^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'm', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '2', m: '3', n: '4' },
    // 2^3 · 2^4 = 2^7 = 128.
    reference: '128',
  },
  {
    id: 'multiply-exponents-1',
    knowledgePointId: 'multiply-exponents-on-power',
    kind: 'evaluate',
    prompt: 'Evaluate (3²)⁴. Multiply the exponents rather than expanding the inside first.',
    given: '(b^m)^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'm', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '3', m: '2', n: '4' },
    // (3^2)^4 = 3^8 = 6561.
    reference: '6561',
  },
  {
    id: 'zero-exponent-1',
    knowledgePointId: 'zero-exponent',
    kind: 'evaluate',
    prompt: 'Evaluate 7⁰.',
    given: 'b^0',
    variables: [{ name: 'b', assumptions: { real: true } }],
    at: { b: '7' },
    reference: '1',
  },
  {
    id: 'negative-exponent-1',
    knowledgePointId: 'negative-is-reciprocal',
    kind: 'evaluate',
    prompt:
      'Evaluate 2⁻³. Give the exact value as a fraction — a negative exponent is a reciprocal, ' +
      'not a negative number.',
    given: 'b^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '2', n: '-3' },
    // 1/8, and emphatically not -8.
    reference: '1/8',
  },
  {
    id: 'root-as-exponent-1',
    knowledgePointId: 'root-as-exponent',
    kind: 'evaluate',
    prompt: 'Evaluate 9^(1/2), then 16^(1/2) in your head to check you have the right reading.',
    given: 'b^(1/2)',
    variables: [{ name: 'b', assumptions: { real: true } }],
    at: { b: '9' },
    // This task is why `exactValue` grew exact rational roots. It used to be
    // unverifiable locally, which made `ruleEvaluate` fall through to comparing
    // the learner against the author's *unverified* reference — losing exactly
    // the re-derivation check that kind was built around. 9^(1/2) is exactly 3,
    // so there was no reason to refuse it. 2^(1/2) still returns null, which is
    // the honest answer for an irrational root.
    reference: '3',
  },

  // ── the form tasks this subject could not previously ask for ────────────

  {
    id: 'combine-powers-form-1',
    knowledgePointId: 'add-exponents-on-product',
    kind: 'transform_to_form',
    // The general rule, not a numeric instance. That is the whole difference
    // this form makes: `evaluate` could only ask "what is 2³·2⁴", which is
    // answerable by multiplying it out and never demonstrates the rule. This
    // asks for the rule applied, and the form check refuses `x^3 * x^5`
    // handed straight back.
    prompt: 'Write this as a single power of x.',
    given: 'x^3 * x^5',
    form: 'single_power',
    variables: REAL_X,
    reference: 'x^8',
  },
  {
    id: 'multiply-exponents-form-1',
    knowledgePointId: 'multiply-exponents-on-power',
    kind: 'transform_to_form',
    prompt: 'Write this as a single power of x.',
    given: '(x^2)^4',
    form: 'single_power',
    variables: REAL_X,
    reference: 'x^8',
  },
  {
    id: 'negative-exponent-form-1',
    knowledgePointId: 'negative-is-reciprocal',
    kind: 'transform_to_form',
    // The one place the form IS the whole content of the task. `x^-2` and
    // `1/x^2` are equal everywhere they are defined, so no equivalence check
    // can distinguish the answer from the question — only the shape ruling can,
    // which is exactly the independence argued for in the header of forms.ts.
    prompt: 'Rewrite this with no negative exponents.',
    given: 'x^-2',
    form: 'no_negative_exponents',
    variables: REAL_X,
    reference: '1/x^2',
  },
  {
    id: 'radical-to-exponent-form-1',
    knowledgePointId: 'root-as-exponent',
    kind: 'transform_to_form',
    // The first draft of this task asked to "rewrite using a fractional
    // exponent instead of a root sign" and gave `x^(3/2)` as the reference —
    // against the `radical_free` form, which a fractional exponent VIOLATES.
    // A fractional exponent is a radical written the other way round; that is
    // the whole point of `move-between-roots-and-exponents`. The task
    // validator caught it, which is what it is for.
    //
    // So the demand runs the other way: clear the radical entirely, which is
    // possible here because the index divides the exponent.
    prompt: 'Rewrite this with no root sign and no fractional exponent.',
    // `(x^4)^(1/2)` rather than `sqrt(x^4)`, and this is a limitation of the
    // local checker rather than a pedagogical choice. The validator wants the
    // reference to agree with the given at sample points, and `sqrt` as a
    // function call is not something `exactValue` evaluates — so a `sqrt`
    // given yields zero usable points and the reference goes unverified,
    // which is the one thing an authored task must not do. A rational
    // exponent it CAN evaluate exactly, after that capability was added for
    // `root-as-exponent-1`.
    given: '(x^4)^(1/2)',
    form: 'radical_free',
    variables: REAL_X,
    reference: 'x^2',
  },

  // ── arithmetic-foundations ──────────────────────────────────────────────
  //
  // Fifteen tasks, one per knowledge point, every one `evaluate` and every one
  // settled by `ruleEvaluate`'s exact rational arithmetic with no worker in the
  // loop. Arithmetic is the one subject where that is total rather than
  // partial, so this is the first syllabus in the build that is fully gradable
  // on a deployment with no worker configured.
  //
  // `given` is symbolic with an `at` table even where the mathematics is a bare
  // numeral, and the reason is the test suite rather than the schema: the
  // re-derivation check recomputes each `reference` from `given` at `at`, and a
  // literal answer in `given` would make it compare a number with itself. The
  // concrete numbers are repeated in the prompt so the learner sees the problem
  // and not the template.
  {
    id: 'digit-position-1',
    knowledgePointId: 'digit-position-is-a-multiplier',
    kind: 'evaluate',
    prompt:
      'Here is 4073 written out as its places: 4·10³ + 0·10² + 7·10¹ + 3·10⁰. Evaluate that sum. ' +
      'Getting the original number back is the check that the decomposition was right.',
    given: 'd3*10^3 + d2*10^2 + d1*10^1 + d0*10^0',
    variables: WHOLE_DIGITS,
    at: { d3: '4', d2: '0', d1: '7', d0: '3' },
    reference: '4073',
  },
  {
    id: 'carrying-1',
    knowledgePointId: 'carrying-is-regrouping',
    kind: 'evaluate',
    prompt:
      'Add 78 and 45 by their places: (7·10 + 8) + (4·10 + 5). Evaluate it. The tens column comes ' +
      'to 11 and the units to 13, so both have to be exchanged before the answer is a numeral.',
    given: '(a1*10 + a0) + (b1*10 + b0)',
    variables: [
      { name: 'a1', assumptions: { integer: true } },
      { name: 'a0', assumptions: { integer: true } },
      { name: 'b1', assumptions: { integer: true } },
      { name: 'b0', assumptions: { integer: true } },
    ],
    at: { a1: '7', a0: '8', b1: '4', b0: '5' },
    reference: '123',
  },
  {
    id: 'places-rightwards-1',
    knowledgePointId: 'places-continue-rightwards',
    kind: 'evaluate',
    prompt:
      'Evaluate 2·10⁰ + 3·10⁻¹ + 7·10⁻², which is 2.37 written out as its places. Give the exact ' +
      'value as a fraction — a terminating decimal is a fraction over a power of ten.',
    given: 'd0*10^0 + d1*10^(-1) + d2*10^(-2)',
    variables: [
      { name: 'd0', assumptions: { integer: true } },
      { name: 'd1', assumptions: { integer: true } },
      { name: 'd2', assumptions: { integer: true } },
    ],
    at: { d0: '2', d1: '3', d2: '7' },
    // 2 + 3/10 + 7/100 = 237/100. A learner answering 2.37 is ruled correct:
    // `exactValue` reads a decimal as the fraction it literally is.
    reference: '237/100',
  },
  {
    id: 'distribute-over-places-1',
    knowledgePointId: 'multiplication-distributes-over-the-places',
    kind: 'evaluate',
    prompt:
      'Multiply 23 by 47 the way the places say to: (20 + 3)(40 + 7). Evaluate it. There are four ' +
      'partial products, and the written method\'s two rows are those four grouped in pairs.',
    given: '(a + b)*(c + d)',
    variables: WHOLE_ABCD,
    at: { a: '20', b: '3', c: '40', d: '7' },
    // 800 + 140 + 120 + 21 = 1081.
    reference: '1081',
  },
  {
    id: 'division-remainder-1',
    knowledgePointId: 'division-leaves-a-remainder',
    kind: 'evaluate',
    prompt:
      'Dividing 137 by 19 gives a quotient of 7. Find the remainder by evaluating 137 − 19·7, then ' +
      'check it is less than 19 — that check is what makes the quotient the right one rather than ' +
      'merely a small one.',
    // Not a proxy task. Verifying a division by multiplying back is the fourth
    // subgoal of the worked example, and it is the step that is independent of
    // whatever mistake the division itself might have made. The quotient is
    // supplied because `exactValue` has no remainder operation — there is no
    // tree whose exact rational value is 137 mod 19 — so the alternative was
    // not a harder task but an unrulable one.
    given: 'a - q*b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { a: '137', q: '7', b: '19' },
    reference: '4',
  },
  {
    id: 'regrouping-1',
    knowledgePointId: 'regrouping-makes-arithmetic-easier',
    kind: 'evaluate',
    prompt:
      'Evaluate 8 · 7 · 125. Taken left to right this needs a long multiplication; reordered it ' +
      'does not, because one of the three pairs makes a round thousand.',
    given: 'a*b*c',
    variables: WHOLE_ABC,
    at: { a: '8', b: '7', c: '125' },
    // (8 · 125) · 7 = 1000 · 7.
    reference: '7000',
  },
  {
    id: 'precedence-1',
    knowledgePointId: 'precedence-is-a-convention',
    kind: 'evaluate',
    prompt:
      'Evaluate 2 + 3 · 4. The other reading of the same symbols gives 20, so this is a question ' +
      'about the convention rather than about the arithmetic.',
    given: 'a + b*c',
    variables: WHOLE_ABC,
    at: { a: '2', b: '3', c: '4' },
    reference: '14',
  },
  {
    id: 'brackets-override-1',
    knowledgePointId: 'brackets-override-precedence',
    kind: 'evaluate',
    prompt:
      'Evaluate (2 + 3) · 4. Compare your answer with 2 + 3 · 4: one pair of brackets, two ' +
      'different numbers.',
    given: '(a + b)*c',
    variables: WHOLE_ABC,
    at: { a: '2', b: '3', c: '4' },
    reference: '20',
  },
  {
    id: 'left-to-right-1',
    knowledgePointId: 'equal-rank-goes-left-to-right',
    kind: 'evaluate',
    prompt:
      'Evaluate 20 − 8 − 5. Grouping to the right instead gives 17, so the left-to-right rule is ' +
      'deciding the answer here rather than breaking a tie that does not matter.',
    given: 'a - b - c',
    variables: WHOLE_ABC,
    at: { a: '20', b: '8', c: '5' },
    reference: '7',
  },
  {
    id: 'subtraction-total-1',
    knowledgePointId: 'subtraction-becomes-total',
    kind: 'evaluate',
    prompt:
      'Evaluate 4 − 9. Among the whole numbers this has no answer at all; the negatives are the ' +
      'extension that gives it one.',
    given: 'a - b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { a: '4', b: '9' },
    reference: '-5',
  },
  {
    id: 'two-negatives-1',
    knowledgePointId: 'two-negatives-make-a-positive',
    kind: 'evaluate',
    prompt:
      'Evaluate (−3) · (−7). The distributive law leaves exactly one possible answer — see the ' +
      'worked example for why it is forced rather than agreed.',
    given: '(-a)*(-b)',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '3', b: '7' },
    reference: '21',
  },
  {
    id: 'minus-before-bracket-1',
    knowledgePointId: 'a-minus-before-a-bracket-distributes',
    kind: 'evaluate',
    prompt:
      'Evaluate 5 − (3 − 8). Distributing the minus flips the sign of BOTH terms in the bracket; ' +
      'flipping only the first is the commonest error in arithmetic and gives −6.',
    given: 'a - (b - c)',
    variables: WHOLE_ABC,
    at: { a: '5', b: '3', c: '8' },
    reference: '10',
  },
  {
    id: 'divides-exactly-1',
    knowledgePointId: 'divides-exactly-means-no-remainder',
    kind: 'evaluate',
    prompt:
      'Evaluate 1274 / 7. It comes out whole, which is what "7 divides 1274" means — and the ' +
      'answer is the second factor of the pair.',
    given: 'a/b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '1274', b: '7' },
    reference: '182',
  },
  {
    id: 'digit-sum-nine-1',
    knowledgePointId: 'the-digit-sum-test-for-nine',
    kind: 'evaluate',
    prompt:
      'Is 4581 divisible by 9? Evaluate its digit sum 4 + 5 + 8 + 1 — the test says the number is ' +
      'divisible by 9 exactly when this is, and the worked example shows why that is not a ' +
      'coincidence.',
    // A proxy, and named as one: "is it divisible by 9" wants a yes or a no, and
    // no tree has a rational value of yes. The digit sum is the one question in
    // the vicinity with a checkable answer, and it is also the step the learner
    // actually has to perform, so the proxy is tight. The decision that 9
    // divides 18 is left to the learner and is not scored.
    given: 'd3 + d2 + d1 + d0',
    variables: WHOLE_DIGITS,
    at: { d3: '4', d2: '5', d1: '8', d0: '1' },
    reference: '18',
  },
  {
    id: 'common-factor-1',
    knowledgePointId: 'a-common-factor-comes-out',
    kind: 'evaluate',
    prompt:
      'Taking 12 out of 84 + 36 leaves 12 · (? + ?). Evaluate (84 + 36) / 12 to get what is inside ' +
      'the bracket. This is the distributive law read right-to-left, and it is what cancelling a ' +
      'fraction will later be.',
    given: '(a + b)/g',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'g', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '84', b: '36', g: '12' },
    // 120/12 = 10, which is the 7 + 3 of the worked example.
    reference: '10',
  },

  // ── functions-and-inverses ──────────────────────────────────────────────
  //
  // Twelve tasks, one per knowledge point, all `evaluate` and all settled by
  // exact rational arithmetic — so this subject, like arithmetic, is gradable
  // with no worker configured.
  //
  // TWO THINGS SHAPE EVERY ONE OF THEM, and both are properties of the engine
  // rather than of the mathematics:
  //
  //  1. There are no user-defined functions in the expression language. `f`
  //     means nothing to the parser, so a composition is written as the
  //     already-substituted expression and the PROMPT names the two rules it
  //     came from. Substituting the inner rule where the outer variable was is
  //     what composition is, so this is the task rather than a dodge.
  //  2. `exactValue` returns null for a `function` node, so `sqrt(9)` cannot
  //     be ruled locally and `9^(1/2)` can. Nothing here uses a named
  //     function; the circle's two branches are written with `^(1/2)`.
  {
    id: 'one-output-1',
    knowledgePointId: 'one-output-per-input',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2. Find f(4). The definition guarantees there is exactly one answer, which is ' +
      'what makes "f(4)" the name of a number.',
    given: 'a*x + b',
    variables: REAL_ABC_X,
    at: { a: '3', b: '-2', x: '4' },
    reference: '10',
  },
  {
    id: 'input-expression-1',
    knowledgePointId: 'the-input-can-be-an-expression',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2. Find f(x + 1) at x = 4 — so the input is 5, not 4. Substituting gives ' +
      '3(x + 1) − 2; dropping those brackets is the commonest error here.',
    given: 'a*(x + h) + b',
    variables: [...REAL_ABC_X, { name: 'h', assumptions: { real: true } }],
    at: { a: '3', b: '-2', x: '4', h: '1' },
    // 3·5 − 2 = 13, and f(4) = 10 — the two differ, which is the point.
    reference: '13',
  },
  {
    id: 'not-a-function-1',
    knowledgePointId: 'not-every-rule-is-a-function',
    kind: 'evaluate',
    prompt:
      'The unit circle gives y = ±(1 − x²)^(1/2) — two branches. Measure the gap between them at ' +
      'x = 0 by evaluating (1 − x²)^(1/2) − (−(1 − x²)^(1/2)). A gap of 0 would mean one output; ' +
      'anything else means this is not a function.',
    // A proxy, and named as one: "is this a function" wants yes or no, and no
    // tree has a rational value of yes. The gap between the branches is the
    // computation the vertical-line test performs, and it is checkable.
    given: '(1 - x^2)^(1/2) - (-(1 - x^2)^(1/2))',
    variables: REAL_X,
    at: { x: '0' },
    // 1 − (−1) = 2. `exactValue` settles 1^(1/2) through `exactRoot`.
    reference: '2',
  },
  {
    id: 'domain-excluded-1',
    knowledgePointId: 'the-domain-is-where-the-rule-works',
    kind: 'evaluate',
    prompt:
      'f(x) = 1/(x − 3) is undefined somewhere. Evaluate the denominator x − 3 at x = 3 to show ' +
      'what goes wrong there.',
    // The same proxy the rational-domain tasks use: "name the excluded points"
    // asks for a set in prose, and the reason a point is excluded is that the
    // denominator vanishes — which is exactly this arithmetic.
    given: 'x - c',
    variables: [...REAL_X, { name: 'c', assumptions: { real: true } }],
    at: { x: '3', c: '3' },
    reference: '0',
  },
  {
    id: 'range-floor-1',
    knowledgePointId: 'the-range-is-what-it-reaches',
    kind: 'evaluate',
    prompt:
      'f(x) = x² + 4. Evaluate f(0). Since x² is never negative this value is the smallest the ' +
      'rule reaches, so the range starts here.',
    given: 'x^2 + c',
    variables: [...REAL_X, { name: 'c', assumptions: { real: true } }],
    at: { x: '0', c: '4' },
    reference: '4',
  },
  {
    id: 'hole-1',
    knowledgePointId: 'a-hole-is-not-a-simplification',
    kind: 'evaluate',
    prompt:
      'Evaluate (x² − 4)/(x − 2) at x = 5. The cancelled form x + 2 gives the same answer here — ' +
      'and a different one at x = 2, where the original is undefined.',
    given: '(x^2 - 4)/(x - 2)',
    variables: REAL_X,
    at: { x: '5' },
    // 21/3 = 7, and x + 2 at 5 is also 7. They part company only at x = 2.
    reference: '7',
  },
  {
    id: 'compose-1',
    knowledgePointId: 'composition-is-substitution',
    kind: 'evaluate',
    prompt:
      'f(x) = x² + 1 and g(x) = 2x − 3. Find f(g(2)) — inner rule first. Written as one ' +
      'expression that is (2x − 3)² + 1.',
    given: '(a*x + b)^2 + c',
    variables: REAL_ABC_X,
    at: { a: '2', b: '-3', c: '1', x: '2' },
    // g(2) = 1, f(1) = 2.
    reference: '2',
  },
  {
    id: 'compose-order-1',
    knowledgePointId: 'the-order-matters',
    kind: 'evaluate',
    prompt:
      'Same f(x) = x² + 1 and g(x) = 2x − 3, the other way round: find g(f(2)), which is ' +
      '2(x² + 1) − 3. Compare it with f(g(2)) = 2.',
    given: 'a*(x^2 + c) + b',
    variables: REAL_ABC_X,
    at: { a: '2', b: '-3', c: '1', x: '2' },
    // f(2) = 5, g(5) = 7. Emphatically not 2.
    reference: '7',
  },
  {
    id: 'composite-domain-1',
    knowledgePointId: 'the-composite-domain-can-shrink',
    kind: 'evaluate',
    prompt:
      'f(x) = 1/x and g(x) = x − 1, so f(g(x)) = 1/(x − 1). Evaluate it at x = 3. The composite ' +
      'is undefined at x = 1 even though g(1) = 0 is fine and f is fine everywhere but 0.',
    given: '1/(x - b)',
    variables: [...REAL_X, { name: 'b', assumptions: { real: true } }],
    at: { x: '3', b: '1' },
    reference: '1/2',
  },
  {
    id: 'inverse-apply-1',
    knowledgePointId: 'an-inverse-undoes-the-rule',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2, so f⁻¹(y) = (y + 2)/3. Find f⁻¹(10). Note this is not 1/f(10) = 1/28 — ' +
      'the superscript means inverse function here, not reciprocal.',
    given: '(y + b)/a',
    variables: [
      { name: 'y', assumptions: { real: true } },
      { name: 'a', assumptions: { real: true, nonzero: true } },
      { name: 'b', assumptions: { real: true } },
    ],
    at: { y: '10', a: '3', b: '2' },
    reference: '4',
  },
  {
    id: 'inverse-identity-1',
    knowledgePointId: 'the-pair-composes-to-the-identity',
    kind: 'evaluate',
    prompt:
      'With f(x) = 3x − 2 and f⁻¹(y) = (y + 2)/3, evaluate f(f⁻¹(7)) — written out, ' +
      '3·((y + 2)/3) − 2. Getting 7 back is what makes it the inverse.',
    given: 'a*((y + b)/a) - b',
    variables: [
      { name: 'y', assumptions: { real: true } },
      { name: 'a', assumptions: { real: true, nonzero: true } },
      { name: 'b', assumptions: { real: true } },
    ],
    at: { y: '7', a: '3', b: '2' },
    // The composite is the identity, so the answer is the input.
    reference: '7',
  },
  {
    id: 'not-one-to-one-1',
    knowledgePointId: 'it-has-to-be-one-to-one',
    kind: 'evaluate',
    prompt:
      'Squaring sends 3 and −3 to the same place. Evaluate x² − (−x)² at x = 3: a difference of ' +
      '0 between two different inputs is exactly why no inverse exists.',
    given: 'x^2 - (-x)^2',
    variables: REAL_X,
    at: { x: '3' },
    reference: '0',
  },

  // ── matrices-and-determinants ───────────────────────────────────────────
  //
  // EVERY TASK ASKS FOR ONE ENTRY, because the engine has no matrix type.
  // `parseExpression` knows numbers, symbols and five operators; there is no
  // way to write a matrix, so no way for an answer to be a grid.
  //
  // That is how the subject is performed anyway — nobody multiplies two
  // matrices in one step, they compute entry (1,1) and then (1,2), and the
  // rule being drilled is "row i against column j". Asking for one entry asks
  // for exactly that rule. The matrices live in the prompt and their entries
  // are the symbols.
  //
  // The honest gap: nothing here tests laying a product out. A learner could
  // get every entry right and still not produce the grid. That is the
  // verifier's limit, not the curriculum's, and it is why `gaussian-elimination`
  // is left mapped — its answer IS a matrix in a normal form.
  //
  // One matrix pair runs through the whole subject — A = [[2,-1],[3,4]] and
  // B = [[5,0],[3,1]] — so a learner meets the same numbers in every concept
  // and can see det(A) = 11 reappear as the denominator of the inverse.
  {
    id: 'columns-basis-1',
    knowledgePointId: 'the-columns-are-where-the-basis-goes',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find the first component of A·e₁ where e₁ = (1, 0) — that is, ' +
      'evaluate a₁₁·1 + a₁₂·0. The answer is the top of column 1, which is the point.',
    given: 'a11*x1 + a12*x2',
    variables: MATRIX_ROW_VEC,
    at: { a11: '2', a12: '-1', x1: '1', x2: '0' },
    reference: '2',
  },
  {
    id: 'linearity-1',
    knowledgePointId: 'a-matrix-respects-addition-and-scaling',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]], u = (1, 2), v = (3, −1). Find the first component of A(u + v) by ' +
      'adding the vectors first. Computing Au + Av instead must give the same answer — that is ' +
      'linearity.',
    given: 'a11*(u1 + v1) + a12*(u2 + v2)',
    variables: [
      { name: 'a11', assumptions: { real: true } },
      { name: 'a12', assumptions: { real: true } },
      { name: 'u1', assumptions: { real: true } },
      { name: 'u2', assumptions: { real: true } },
      { name: 'v1', assumptions: { real: true } },
      { name: 'v2', assumptions: { real: true } },
    ],
    at: { a11: '2', a12: '-1', u1: '1', u2: '2', v1: '3', v2: '-1' },
    // u + v = (4, 1); 2·4 − 1 = 7. And Au + Av = 0 + 7 = 7.
    reference: '7',
  },
  {
    id: 'image-span-1',
    knowledgePointId: 'the-image-is-the-span-of-the-columns',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find the first component of 2·(column 1) + 3·(column 2). This is ' +
      'the same thing as applying A to the vector (2, 3) — combining columns and feeding in a ' +
      'vector are one operation.',
    given: 'c1*a11 + c2*a12',
    variables: [
      { name: 'c1', assumptions: { real: true } },
      { name: 'c2', assumptions: { real: true } },
      { name: 'a11', assumptions: { real: true } },
      { name: 'a12', assumptions: { real: true } },
    ],
    at: { c1: '2', c2: '3', a11: '2', a12: '-1' },
    // 4 − 3 = 1.
    reference: '1',
  },
  {
    id: 'row-by-column-1',
    knowledgePointId: 'row-against-column',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]] and B = [[5, 0], [3, 1]]. Find entry (1,1) of AB: row 1 of A ' +
      'against column 1 of B.',
    given: 'a11*b11 + a12*b21',
    variables: MATRIX_AB,
    at: { a11: '2', a12: '-1', b11: '5', b21: '3' },
    // 10 − 3 = 7.
    reference: '7',
  },
  {
    id: 'order-matters-ab-1',
    knowledgePointId: 'matrix-order-matters',
    kind: 'evaluate',
    prompt:
      'Same A and B, the other way round: find entry (1,1) of BA — row 1 of B against column 1 ' +
      'of A. Compare with 7, which is what AB gave.',
    given: 'b11*a11 + b12*a21',
    variables: [
      { name: 'b11', assumptions: { real: true } },
      { name: 'b12', assumptions: { real: true } },
      { name: 'a11', assumptions: { real: true } },
      { name: 'a21', assumptions: { real: true } },
    ],
    at: { b11: '5', b12: '0', a11: '2', a21: '3' },
    // 10 + 0 = 10. One differing entry proves AB ≠ BA.
    reference: '10',
  },
  {
    id: 'associative-1',
    knowledgePointId: 'grouping-does-not-matter',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]], B = [[5, 0], [3, 1]], C = the column (1, 2). Find the first ' +
      'component of A(BC) — innermost first. Grouping as (AB)C does different arithmetic and ' +
      'must reach the same number.',
    given: 'a11*(b11*c1 + b12*c2) + a12*(b21*c1 + b22*c2)',
    variables: [
      ...MATRIX_AB,
      { name: 'b12', assumptions: { real: true } },
      { name: 'b22', assumptions: { real: true } },
      { name: 'c1', assumptions: { real: true } },
      { name: 'c2', assumptions: { real: true } },
    ],
    at: { a11: '2', a12: '-1', b11: '5', b12: '0', b21: '3', b22: '1', c1: '1', c2: '2' },
    // BC = (5, 5); 2·5 − 5 = 5. And (AB)C = 7·1 − 1·2 = 5.
    reference: '5',
  },
  {
    id: 'det-2x2-1',
    knowledgePointId: 'ad-minus-bc',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[2, −1], [3, 4]] — that is ad − bc. It is the factor every area ' +
      'is multiplied by, and its sign says whether orientation survived.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // 8 + 3 = 11. This number reappears as the inverse's denominator.
    reference: '11',
  },
  {
    id: 'det-zero-1',
    knowledgePointId: 'zero-means-collapse',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[2, 4], [1, 2]]. Its columns are (2,1) and (4,2) — one is twice ' +
      'the other, so the map crushes the plane onto a line and the answer should say so.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '4', c: '1', d: '2' },
    reference: '0',
  },
  {
    id: 'det-multiplies-1',
    knowledgePointId: 'the-determinant-multiplies',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]] and B = [[5, 0], [3, 1]]. Find det(A)·det(B), which is det(AB) — so ' +
      'you get the determinant of the product without computing a single entry of it.',
    given: '(a*d - b*c)*(p*s - q*r)',
    variables: [
      ...MATRIX_ABCD,
      { name: 'p', assumptions: { real: true } },
      { name: 'q', assumptions: { real: true } },
      { name: 'r', assumptions: { real: true } },
      { name: 's', assumptions: { real: true } },
    ],
    at: { a: '2', b: '-1', c: '3', d: '4', p: '5', q: '0', r: '3', s: '1' },
    // 11 · 5 = 55.
    reference: '55',
  },
  {
    id: 'inverse-entry-1',
    knowledgePointId: 'swap-negate-divide',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find entry (1,1) of A⁻¹, which is d/det — swap the diagonal, ' +
      'negate the other two, divide by ad − bc. Give the exact fraction.',
    given: 'd/(a*d - b*c)',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // 4/11. The division is the only step that can fail.
    reference: '4/11',
  },
  {
    id: 'inverse-identity-matrix-1',
    knowledgePointId: 'it-composes-to-the-identity',
    kind: 'evaluate',
    prompt:
      'With A = [[2, −1], [3, 4]] and A⁻¹ = (1/11)[[4, 1], [−3, 2]], verify entry (1,1) of A⁻¹A: ' +
      'row 1 of the adjugate against column 1 of A, over the determinant. The identity has 1 there.',
    given: '(d*a + (-b)*c)/(a*d - b*c)',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // (8 + 3)/11 = 1. The numerator IS the determinant — that cancellation is
    // the reason the formula divides by det at all.
    reference: '1',
  },
  {
    id: 'singular-no-inverse-1',
    knowledgePointId: 'singular-means-no-inverse',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[6, 3], [4, 2]]. A zero here is why no inverse exists — not ' +
      'because the formula divides by zero, but because the map sent two different vectors to ' +
      'the same place.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '6', b: '3', c: '4', d: '2' },
    reference: '0',
  },

  // ── vectors-and-independence ────────────────────────────────────────────
  //
  // Nine tasks on components, all exactly rulable. Two vector pairs run
  // through the whole subject — u = (2,-1) with v = (1,3) independent, and
  // u with w = (6,-3) dependent — so the same numbers answer "is it in the
  // span", "is it independent" and "what does it cost", and a learner can see
  // the cross-check give 7 and then 0 on pairs they already know the shape of.
  {
    id: 'magnitude-1',
    knowledgePointId: 'a-vector-is-a-displacement',
    kind: 'evaluate',
    prompt:
      'v = (3, 4). Find |v| — the components are the legs of a right triangle and the vector is ' +
      'the hypotenuse, so this is (3² + 4²)^(1/2).',
    // `^(1/2)` rather than `sqrt(...)`: `exactValue` returns null for a
    // `function` node, so sqrt cannot be settled locally while a rational
    // exponent goes through `exactRoot`. 25^(1/2) is exactly 5.
    given: '(v1^2 + v2^2)^(1/2)',
    variables: VEC_V,
    at: { v1: '3', v2: '4' },
    reference: '5',
  },
  {
    id: 'vector-add-1',
    knowledgePointId: 'adding-is-tip-to-tail',
    kind: 'evaluate',
    prompt:
      'u = (3, 4) and v = (−1, 2). Find the first component of u + v. The components never ' +
      'interact — going across does not change how far up you are.',
    given: 'u1 + v1',
    variables: VEC_UV,
    at: { u1: '3', v1: '-1' },
    reference: '2',
  },
  {
    id: 'vector-scale-1',
    knowledgePointId: 'scaling-stretches-and-flips',
    kind: 'evaluate',
    prompt:
      'u = (2, −1). Find the first component of 3u. Every scalar multiple of u lies on one line ' +
      'through the origin, which is what the next concept calls its span.',
    given: 'c*u1',
    variables: [{ name: 'c', assumptions: { real: true } }, ...VEC_U],
    at: { c: '3', u1: '2' },
    reference: '6',
  },
  {
    id: 'combination-1',
    knowledgePointId: 'a-linear-combination',
    kind: 'evaluate',
    prompt:
      'u = (2, −1) and v = (1, 3). Find the first component of 2u + 3v — scale each, then add.',
    given: 'c1*u1 + c2*v1',
    variables: VEC_WEIGHTED,
    at: { c1: '2', c2: '3', u1: '2', v1: '1' },
    // 4 + 3 = 7.
    reference: '7',
  },
  {
    id: 'span-line-1',
    knowledgePointId: 'one-vector-spans-a-line',
    kind: 'evaluate',
    prompt:
      'Is w = (6, −3) in the span of u = (2, −1)? The first components force the multiple to be ' +
      '6/2; evaluate 6/2 − (−3)/(−1) to check the second agrees. Zero means yes.',
    // A proxy, named as one: "is it in the span" wants yes or no. The ratio
    // difference is the computation that decides it, and it is checkable.
    given: 'w1/u1 - w2/u2',
    variables: VEC_UW,
    at: { w1: '6', w2: '-3', u1: '2', u2: '-1' },
    // 3 − 3 = 0, so w = 3u.
    reference: '0',
  },
  {
    id: 'span-plane-1',
    knowledgePointId: 'two-vectors-usually-span-the-plane',
    kind: 'evaluate',
    prompt:
      'u = (2, −1), v = (1, 3). Show 3u + 1v reaches (7, 0) by evaluating its SECOND component. ' +
      'The first comes to 7.',
    given: 'c1*u2 + c2*v2',
    variables: VEC_WEIGHTED_2,
    at: { c1: '3', c2: '1', u2: '-1', v2: '3' },
    // −3 + 3 = 0.
    reference: '0',
  },
  {
    id: 'dependent-1',
    knowledgePointId: 'dependent-means-redundant',
    kind: 'evaluate',
    prompt:
      'u = (2, −1) and w = (6, −3). Evaluate the first component of w − 3u. Vanishing means w ' +
      'was already reachable from u, so it added nothing.',
    given: 'w1 - c*u1',
    variables: [...VEC_UW, { name: 'c', assumptions: { real: true } }],
    at: { w1: '6', w2: '-3', u1: '2', u2: '-1', c: '3' },
    reference: '0',
  },
  {
    id: 'cross-check-independent-1',
    knowledgePointId: 'the-cross-check',
    kind: 'evaluate',
    prompt:
      'Apply the cross-check u₁v₂ − u₂v₁ to u = (2, −1) and v = (1, 3). Non-zero means ' +
      'independent. No division is needed, which matters when a component is zero.',
    given: 'u1*v2 - u2*v1',
    variables: VEC_UV_FULL,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3' },
    // 6 + 1 = 7. This is the 2x2 determinant, met properly in the matrices
    // subject — deliberately with no prerequisite edge, which would cycle.
    reference: '7',
  },
  {
    id: 'cross-check-dependent-1',
    knowledgePointId: 'dependence-costs-a-dimension',
    kind: 'evaluate',
    prompt:
      'Same cross-check on u = (2, −1) and w = (6, −3). A zero here means two vectors still only ' +
      'reach a line, so (7, 0) is unreachable however the weights are chosen.',
    given: 'u1*v2 - u2*v1',
    variables: VEC_UV_FULL,
    at: { u1: '2', u2: '-1', v1: '6', v2: '-3' },
    // −6 + 6 = 0.
    reference: '0',
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
