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
import type { ConceptOntology, PracticeTask } from './types'

/** Every task declares its symbols. Most of them are one real variable. */
const REAL_X = [{ name: 'x', assumptions: { real: true } }]

/**
 * Completing the square is in b and c only, with no `a` to give a value to.
 *
 * A separate declaration rather than reusing `REAL_ABC`, because every declared
 * symbol must have a stated input — an unused `a` is an authoring fault the
 * suite reports, and correctly so: a task whose inputs do not cover its symbols
 * cannot be evaluated at all.
 */
const REAL_BC = [
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * Three real parameters, no x.
 *
 * The discriminant tasks are in the coefficients rather than in x, which is
 * what this was written for. The plane-geometry tasks reuse it for three angle
 * measures, and the Pythagoras ones for the three sides of a triangle — in
 * every case three reals with no variable to substitute into — rather than
 * declaring identical sets under geometric names, since what a symbol MEANS is
 * the prompt's job and what it may be assumed to BE is this one's.
 *
 * Real rather than `positive`, which a length arguably is. Deliberate: the two
 * converse tasks are a SUBTRACTION of squares whose sign is the ruling, and one
 * of them is negative. Nothing is assumed about the symbols that the tasks do
 * not need, and `positive` would be an assumption about the lengths that the
 * engine could in principle use to simplify a result these tasks want left
 * alone.
 */
const REAL_ABC = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * Two real parameters, for the triangle tasks that are about a pair.
 *
 * A fourth declaration rather than reusing `REAL_ABC` and leaving `c` without
 * a value, for the reason `REAL_BC` gives: every declared symbol must have a
 * stated input, and a task whose inputs do not cover its symbols cannot be
 * evaluated at all — the suite reports it, correctly.
 *
 * Real rather than integer, matching the plane-geometry tasks it joins and for
 * the same reason. Two of the six pairs here are angle measures and four are
 * pairs of side lengths — one from the triangle inequality and three from
 * Pythagoras — and nothing in either fact is about whole numbers:
 * 180 − (180 − a − b) = a + b holds for every pair of angles, and a triangle's
 * sides are not required to be integers. The whole-number values in the
 * prompts are a convenience of the figures chosen, and in the Pythagoras cases
 * a deliberate one — a triple is picked where the answer should be rational and
 * avoided where the point is that it is not.
 */
const REAL_AB = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
]

/**
 * Four real parameters, for the area tasks.
 *
 * A fifth declaration rather than reusing `REAL_ABC` with a spare, for the
 * reason `REAL_BC` and `REAL_AB` give: every declared symbol must have a stated
 * input. These four are two rectangles' worth of sides — a sheet and the piece
 * taken out of it, or two rectangles being compared — so four is what the
 * expressions use and four is what they declare.
 *
 * Real rather than `positive`, matching the plane-geometry tasks it joins.
 * A length is arguably positive, but `equal-perimeters-left-the-areas-unequal-1`
 * is a difference of two areas whose SIGN says which region is larger, and
 * nothing should be assumed about the symbols that the tasks do not need.
 *
 * Real rather than `integer` for the same reason `REAL_AB` is: nothing in
 * either measure is about whole numbers. The whole-number sides in the prompts
 * are a convenience of the figures chosen, and the one height the concept
 * computes is 168/13.
 */
const REAL_ABCD = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

/**
 * Six real parameters, for the one task that compares two triangles at once.
 *
 * A sixth real declaration rather than reusing `REAL_ABCD` with two spares, for
 * the reason every set above gives: every declared symbol must have a stated
 * input, and a task whose inputs do not cover its symbols cannot be evaluated
 * at all. Six is what "the three sides of this triangle against the three sides
 * of that one" uses, and it is the widest any task in the build gets.
 *
 * Real rather than `positive`, matching the plane-geometry tasks it joins, and
 * here the reason is not a convention but the task: the two perimeter tasks are
 * a DIFFERENCE whose sign is the ruling, and one of them is negative. Real
 * rather than `integer` for the usual reason — a triangle's sides are not
 * required to be whole numbers, and the whole numbers in the prompts are a
 * convenience of the figures chosen.
 */
const REAL_ABCDEF = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
  { name: 'e', assumptions: { real: true } },
  { name: 'f', assumptions: { real: true } },
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
 * A coefficient, a constant and the variable, for the expressions subject.
 *
 * Exactly three, rather than reusing `REAL_ABC_X` and leaving `c` unused: every
 * declared symbol must have a stated input, and an unused one is an authoring
 * fault the suite reports. Real rather than integer because nothing in that
 * concept is about whole numbers — the point is that a letter stands for a
 * number, and the tasks substitute a negative one on purpose.
 */
const REAL_ABX = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'x', assumptions: { real: true } },
]

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

/**
 * Two points, P and Q, as four coordinates.
 *
 * `real` and not `integer`, for the same reason the vector components above are
 * real: a coordinate of the plane is a real number, and these three tasks
 * happening to use whole ones is a choice about arithmetic load rather than a
 * fact about the object. The point concept's own material says each axis is a
 * complete real line.
 *
 * All four are declared for all three tasks even though each uses two. The
 * alternative is three near-identical pairs, and `at` is what decides which
 * symbols a task actually substitutes — an unused declaration costs nothing,
 * while a symbol missing from `at` fails the "every symbol in the given has a
 * stated input" assertion in tests/concepts-logic.mjs.
 */
const POINT_PQ = [
  { name: 'p1', assumptions: { real: true } },
  { name: 'p2', assumptions: { real: true } },
  { name: 'q1', assumptions: { real: true } },
  { name: 'q2', assumptions: { real: true } },
]

/** Four digits, most significant first. Shared by the two four-digit tasks. */
const WHOLE_DIGITS = [
  { name: 'd3', assumptions: { integer: true } },
  { name: 'd2', assumptions: { integer: true } },
  { name: 'd1', assumptions: { integer: true } },
  { name: 'd0', assumptions: { integer: true } },
]

export const TASKS: PracticeTask[] = [
  /*
   * ── fraction-arithmetic ─────────────────────────────────────────────────
   *
   * Three `evaluate` tasks with integer symbols, one per knowledge point,
   * because that is this subject's contract rather than a style preference:
   * "the third subject is gradable with no worker" is asserted in
   * tests/concepts-logic.mjs over every task it owns.
   *
   * The first draft used `transform_to_form` with `single_fraction` and was
   * wrong twice over. It would have made arithmetic — the root of the whole
   * map — depend on the CAS worker being reachable, so an outage would wall
   * off the entry point rather than a branch. And the division task was a free
   * mark: `single_fraction` means "one quotient, no top-level sum", and
   * `(2x/3)/(4/5)` is already one quotient, so the given satisfied the form it
   * was being asked to reach. The test for that caught it by name.
   *
   * Exact rational arithmetic is what `exactValue` settles, so each reference
   * below is reproducible from its given with nothing consulted — which is the
   * property that makes fractions the right concept to put here.
   */
  {
    id: 'fraction-add-1',
    knowledgePointId: 'only-same-sized-parts-add',
    kind: 'evaluate',
    prompt:
      'Evaluate a/b + c/d at a = 2, b = 3, c = 1, d = 4. Only parts of the same size can be '
      + 'added, so the work is cutting both into twelfths first.',
    given: 'a/b + c/d',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '2', b: '3', c: '1', d: '4' },
    reference: '11/12',
  },
  {
    id: 'fraction-multiply-1',
    knowledgePointId: 'multiplying-needs-no-common-denominator',
    kind: 'evaluate',
    prompt:
      'Evaluate (a/b) · (c/d) at a = 4, b = 9, c = 3, d = 8. No common denominator is wanted '
      + 'here — cancel across the product and the numbers stay small.',
    given: '(a/b) * (c/d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '4', b: '9', c: '3', d: '8' },
    reference: '1/6',
  },
  {
    id: 'fraction-divide-1',
    knowledgePointId: 'dividing-is-multiplying-by-the-reciprocal',
    kind: 'evaluate',
    prompt:
      'Evaluate (a/b) ÷ (c/d) at a = 2, b = 3, c = 4, d = 5. Dividing by c/d multiplies by d/c, '
      + 'which is why the answer can be larger than you started with.',
    given: '(a/b) / (c/d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true, nonzero: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '2', b: '3', c: '4', d: '5' },
    reference: '5/6',
  },

  /*
   * ── prime-factorisation ─────────────────────────────────────────────────
   *
   * `evaluate` like the rest of this subject, and for a reason stronger than
   * consistency: there is no form that can ask for a product of primes.
   * `checkFactored` is symbol-relative, a numeral has degree 0, and degree 0
   * is reported as already irreducible — so `transform_to_form` with
   * `factored` would be satisfied by handing the number back unchanged. The
   * concept's own header in ontology-arithmetic.ts has the full argument.
   *
   * What that costs is stated rather than hidden: none of these three asks the
   * learner to FIND a factorisation. Each asks a question that can only be
   * answered once you have one, so each prompt hands over the factorisation
   * and names the step it is standing in for. Finding it is what the worked
   * examples are for.
   *
   * Three different numbers from the ones in the worked examples, so the task
   * is not a recall of the example. Each reference is reproducible from its
   * given by exact rational arithmetic, which the subject's test group checks
   * for every task it owns.
   */
  {
    id: 'prime-factorisation-check-1',
    knowledgePointId: 'one-factorisation-each',
    kind: 'evaluate',
    prompt:
      'A prime factorisation is a claim, and multiplying it back out is the only check there '
      + 'is on one. Evaluate p^a · q^b · r^c at p = 2, a = 1, q = 5, b = 2, r = 7, c = 2 — this '
      + 'is that check on "2450 = 2 · 5² · 7²".',
    given: 'p^a * q^b * r^c',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'r', assumptions: { integer: true, positive: true } },
      { name: 'c', assumptions: { integer: true } },
    ],
    at: { p: '2', a: '1', q: '5', b: '2', r: '7', c: '2' },
    reference: '2450',
  },
  /*
   * The ask this concept actually teaches, now that a form can express it.
   *
   * Its three sibling tasks are all `evaluate`, and the concept's header says
   * why: no form could demand a product of primes, so each one hands the
   * factorisation over in the prompt and asks the learner to multiply it back.
   * That is the proxy-task compromise this file warns about — it drills the
   * check and never asks for the work.
   *
   * `prime_factored` is that form, and `ruleTransform`'s exact-arithmetic path
   * is what keeps this task inside the subject's no-worker contract: 2310 and
   * 2 · 3 · 5 · 7 · 11 are both integers, so the equivalence half is bigint
   * arithmetic and never reaches the CAS.
   *
   * 2310 is the product of the first five primes, chosen so that every prime is
   * distinct and no exponent is above 1 — the exponent-collecting case is what
   * the worked example covers, and a first task should not need both moves at
   * once. It shares no number with the three worked examples.
   */
  {
    id: 'prime-factorisation-factorise-1',
    knowledgePointId: 'one-factorisation-each',
    kind: 'transform_to_form',
    prompt: 'Write 2310 as a product of primes.',
    given: '2310',
    form: 'prime_factored',
    variables: [],
    reference: '2 * 3 * 5 * 7 * 11',
  },
  {
    id: 'prime-factorisation-divisor-count-1',
    knowledgePointId: 'the-exponents-count-the-divisors',
    kind: 'evaluate',
    prompt:
      '1350 = 2 · 3³ · 5², so its exponents are 1, 3 and 2. A divisor is an independent choice '
      + 'of how many of each prime to take, which makes the number of them (a+1)(b+1)(c+1). '
      + 'Evaluate that at a = 1, b = 3, c = 2.',
    given: '(a + 1) * (b + 1) * (c + 1)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'c', assumptions: { integer: true } },
    ],
    at: { a: '1', b: '3', c: '2' },
    reference: '24',
  },
  {
    id: 'prime-factorisation-square-part-1',
    knowledgePointId: 'a-square-has-even-exponents',
    kind: 'evaluate',
    prompt:
      '1960 = 2³ · 5 · 7². The primes with an odd exponent are 2 and 5, and taking one copy of '
      + 'each out leaves every exponent even — which is to say, leaves the largest square that '
      + 'divides 1960. Evaluate n/(p · q) at n = 1960, p = 2, q = 5.',
    given: 'n / (p * q)',
    variables: [
      { name: 'n', assumptions: { integer: true } },
      { name: 'p', assumptions: { integer: true, nonzero: true } },
      { name: 'q', assumptions: { integer: true, nonzero: true } },
    ],
    at: { n: '1960', p: '2', q: '5' },
    reference: '196',
  },

  /*
   * ── gcd-and-lcm ─────────────────────────────────────────────────────────
   *
   * `evaluate` like the rest of this subject, and under a sharper version of
   * the same constraint. ontology.ts recorded the problem when it skipped this
   * node: a gcd is a NUMBER, every task must declare a symbol, and so "what is
   * gcd(48, 180)" has no shape here at all. The answer is that while a gcd is
   * not an expression, `p^a · q^b` at stated primes and exponents is — and it
   * IS the gcd once the exponents are the minima.
   *
   * So each of these hands over what the previous concept supplies and asks the
   * arithmetic that turns it into the answer. The first is given the
   * factorisations and the minima; the second is given the gcd; the third is
   * given the lcm and told the result will not be in lowest terms. What none of
   * them asks is which exponent is the smaller, because that is a relation
   * between two integers and no form in forms.ts can demand one — the same gap
   * that stops a task asking for a product of primes. Each prompt names the
   * step it stands in for, and the choosing is what the worked examples teach.
   *
   * Different numbers from the worked examples in all three cases, so none is a
   * recall of its own example. Every reference is reproducible from its given
   * by exact rational arithmetic, which is what the subject's test group checks
   * over every task it owns.
   */
  {
    id: 'gcd-from-the-exponents-1',
    knowledgePointId: 'the-exponents-decide-both',
    kind: 'evaluate',
    prompt:
      '540 = 2² · 3³ · 5 and 378 = 2 · 3³ · 7. The gcd takes the smaller exponent of each '
      + 'prime: one 2, three 3s, and nothing of the 5 or the 7 because each is missing from one '
      + 'of the two. Evaluate p^a · q^b at p = 2, a = 1, q = 3, b = 3 — that product is the gcd.',
    given: 'p^a * q^b',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { p: '2', a: '1', q: '3', b: '3' },
    reference: '54',
  },
  {
    id: 'lcm-from-the-gcd-1',
    knowledgePointId: 'the-product-is-the-pair',
    kind: 'evaluate',
    prompt:
      '90 = 2 · 3² · 5 and 48 = 2⁴ · 3, so gcd(90, 48) = 2 · 3 = 6. Because gcd · lcm is the '
      + 'product of the pair, the lcm is that product divided by the gcd — no second pass over '
      + 'the exponents is needed. Evaluate (a · b)/g at a = 90, b = 48, g = 6.',
    given: '(a * b) / g',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'g', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '90', b: '48', g: '6' },
    reference: '720',
  },
  /*
   * The same `given` as `fraction-add-1`, deliberately, because the numbers are
   * the content here. That task adds thirds and quarters: coprime denominators,
   * so their lcm IS their product and the answer is already in lowest terms —
   * which makes it exactly the case in which neither of these two numbers has
   * anything to do. This one is the case where both do.
   */
  {
    id: 'common-denominator-is-an-lcm-1',
    knowledgePointId: 'a-common-denominator-is-an-lcm',
    kind: 'evaluate',
    prompt:
      'Evaluate a/b + c/d at a = 1, b = 15, c = 1, d = 10, and give the answer in lowest terms. '
      + '15 = 3 · 5 and 10 = 2 · 5, so the denominator to work over is lcm(15, 10) = 30 rather '
      + 'than 150 — and when the two numerators are added the result still shares a factor with '
      + '30, so the addition is not the last step.',
    given: 'a/b + c/d',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '1', b: '15', c: '1', d: '10' },
    reference: '1/6',
  },

  /*
   * ── roots-and-irrationals ─────────────────────────────────────────────────
   *
   * Four tasks, and the shape of all four is decided by one fact: the natural
   * task for this concept is "simplify √720" and no form in forms.ts can
   * demand it. `radical_free` asks for the radical to GO, and 12√5 still has
   * one; what is wanted is "no square factor remains underneath", which is a
   * claim about a subterm's factorisation rather than about the top-level
   * shape of the answer. That is the third time this subject has met the same
   * missing-form wall — see the concept's header in ontology-arithmetic.ts.
   *
   * So these compute WITH the split rather than asking for it, the way
   * `prime-factorisation` and `gcd-and-lcm` do above. The first asks for a
   * root that comes out whole, which is the one case needing no split at all;
   * the second hands over the extracted root and asks for the square-free part
   * by division; the third asks the one root of a non-integer that is exactly
   * rational; the fourth squares the best small approximation to √2 and lets
   * the learner see it miss. Each prompt names the step it stands in for.
   *
   * Every one is settled by `exactValue` with no worker configured, which was
   * checked rather than assumed for a concept about irrational numbers: a
   * `sqrt` node and a rational exponent are both handled, returning a value
   * when it is rational and null when it is not. So all four re-derive
   * locally and none needs adding to `WORKER_ONLY` in the test suite.
   *
   * Different numbers from the worked examples throughout — the examples use
   * 1728, 720, 2 and 45 — so none of these is a recall of its own exposition.
   */
  {
    id: 'fourth-root-from-exponents-1',
    knowledgePointId: 'a-root-undoes-a-power',
    kind: 'evaluate',
    prompt:
      '4096 = 2¹², and the index you are rooting by is 4. The exponent 12 is divisible by 4, so '
      + 'this root comes out a whole number and the root is built by dividing the exponent rather '
      + 'than by searching: 2^(12/4) = 2³. Evaluate x^(1/n) at x = 4096, n = 4.',
    given: 'x^(1/n)',
    variables: [
      { name: 'x', assumptions: { integer: true, positive: true } },
      { name: 'n', assumptions: { integer: true, positive: true } },
    ],
    at: { x: '4096', n: '4' },
    reference: '8',
  },
  {
    id: 'square-free-part-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'evaluate',
    prompt:
      '2700 = 2² · 3³ · 5². Only the 3 has an odd exponent, so one copy of it has to stay under '
      + 'the radical and everything else comes out: the largest square factor is 2² · 3² · 5² = '
      + '900, whose root is 30. What stays behind is 2700 divided by that square — evaluate '
      + 'x / c^2 at x = 2700, c = 30. Your answer is the number left under the radical when '
      + '√2700 is written as 30 times a smaller root.',
    given: 'x / c^2',
    variables: [
      { name: 'x', assumptions: { integer: true, positive: true } },
      { name: 'c', assumptions: { integer: true, nonzero: true } },
    ],
    at: { x: '2700', c: '30' },
    reference: '3',
  },
  /*
   * The ask this concept is named for, finally expressible.
   *
   * `roots-and-irrationals`' header records the gap at length: the natural task
   * for this knowledge point is "simplify √720", and it could not be asked.
   * `radical_free` demands the radical GO and 12√5 still has one, so the two
   * tasks beside this one hand the extracted root over in the prompt and ask
   * for a division instead — the move the concept most wants to teach, replaced
   * by its own last step.
   *
   * Two things had to land for this to work, and the second was not the one the
   * header predicted. `surd_reduced` is the form. But `transform_to_form` was
   * also routed unconditionally to the CAS, and this subject's contract is that
   * every task in it grades with no worker — so `asSurd` in numerals.ts put
   * both sides in normal form, which is a decision rather than a heuristic
   * because √r for distinct square-free r are linearly independent over Q.
   *
   * 1008 = 2⁴ · 3² · 7, so the square part is 144 and the answer is 12√7.
   * Different numbers from the worked example's 720 = 12√5, and from 2700 in
   * the task above, so it is not a recall of either.
   */
  {
    id: 'simplify-a-surd-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'transform_to_form',
    prompt:
      'Simplify √1008, leaving nothing under the radical that need not be there. Write it as a '
      + 'whole number times a smaller root.',
    given: 'sqrt(1008)',
    form: 'surd_reduced',
    variables: [],
    reference: '12*sqrt(7)',
  },
  {
    id: 'root-of-a-fraction-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'evaluate',
    prompt:
      'A root splits over a quotient as well as over a product: √(a/b) = √a / √b. Both 49 and 16 '
      + 'are perfect squares, so this is the case where a root of something that is not a whole '
      + 'number is still exactly rational. Evaluate sqrt(a/b) at a = 49, b = 16.',
    given: 'sqrt(a/b)',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '49', b: '16' },
    reference: '7/4',
  },
  {
    id: 'no-ratio-squares-to-two-1',
    knowledgePointId: 'root-of-a-non-square-is-irrational',
    kind: 'evaluate',
    prompt:
      '99/70 is a classical approximation to √2 and a close one — it is within one ten-thousandth. '
      + 'If the proof in this point is right then squaring it cannot give exactly 2, however close '
      + 'it looks, so it is worth seeing what it gives instead. Evaluate (a/b)^2 at a = 99, '
      + 'b = 70, and compare your answer with 2 written over the same denominator, which is '
      + '9800/4900.',
    given: '(a/b)^2',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '99', b: '70' },
    reference: '9801/4900',
  },

  /*
   * ── decimal-representation ──────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, and the missing-form wall
   * is steeper here than anywhere else in the subject: the thing this concept
   * teaches is how to WRITE a rational number, and 0.125 and 1/8 are the same
   * rational number. So an equivalence check cannot prefer one over the other,
   * and asking "write 1/8 as a decimal" would mark `1/8` correct. There is no
   * form to demand the decimal shape — the concept's header in
   * ontology-arithmetic.ts names the one that would do it and says why it was
   * not added in a content pass.
   *
   * So none of these asks for a decimal. Each asks the arithmetic the method
   * genuinely turns on, where the answer is a single number that only comes out
   * right if the step was understood, and each prompt names the move it stands
   * in for:
   *
   *  - the first completes a denominator to a power of ten, which is the step
   *    that converts at all. The reduction to 1/8 is handed over in the prompt,
   *    because reducing is the other thing no form can demand.
   *  - the second divides 10⁶ − 1 by 7, which is the recurrence fact without
   *    the long division: the quotient 142857 IS the repeating block of 1/7, so
   *    the answer is the digits rather than a number about them.
   *  - the third performs the align-and-subtract itself, as the one quotient
   *    (416 − 41)/(1000 − 100) the method reduces to.
   *
   * All three are integer arithmetic settled by `exactValue` with no worker, so
   * none goes in `WORKER_ONLY`. Different numbers from the worked examples
   * throughout — those use 7/56, 3/7 and 0.41666… — except the 7 in the second,
   * which is deliberate: it is the same denominator seen from the other side,
   * and the prompt says so.
   */
  {
    id: 'complete-the-denominator-1',
    knowledgePointId: 'terminates-when-the-denominator-is-only-2s-and-5s',
    kind: 'evaluate',
    prompt:
      '14/112 reduces to 1/8, and 8 = 2³ contains no prime but 2, so this one terminates. '
      + 'Converting it means completing the denominator to a power of ten: 2³ needs three 5s to '
      + 'become 2³ · 5³ = 1000. Evaluate (a * p^k) / (b * p^k) at a = 1, b = 8, p = 5, k = 3. '
      + 'Your answer is 1/8, and the numerator and denominator you pass through on the way — '
      + 'read as a numerator over a power of ten — are what its three decimal places are.',
    given: '(a * p^k) / (b * p^k)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'k', assumptions: { integer: true } },
    ],
    at: { a: '1', b: '8', p: '5', k: '3' },
    reference: '0.125',
  },
  {
    id: 'repeating-block-from-nines-1',
    knowledgePointId: 'a-remainder-must-repeat',
    kind: 'evaluate',
    prompt:
      'A block of length n means the denominator divides 10ⁿ − 1, which is why a purely '
      + 'recurring decimal can be written over a string of nines. For 7 the block has length 6, '
      + 'so 7 divides 999999. Evaluate (10^n - 1) / d at n = 6, d = 7. Your answer is not just a '
      + 'quotient: it is the repeating block of 1/7 itself, digit for digit.',
    given: '(10^n - 1) / d',
    variables: [
      { name: 'n', assumptions: { integer: true, positive: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { n: '6', d: '7' },
    reference: '142857',
  },
  {
    id: 'align-and-subtract-1',
    knowledgePointId: 'subtract-to-clear-the-recurring-tail',
    kind: 'evaluate',
    prompt:
      'Take x = 0.41666…, where only the 6 repeats. Two fixed digits and a block of one give '
      + '1000x = 416.666… and 100x = 41.666…, whose tails are identical — so subtracting leaves '
      + 'whole numbers on both sides. That subtraction is this quotient: evaluate '
      + '(a - b) / (c - d) at a = 416, b = 41, c = 1000, d = 100. Your answer is x exactly.',
    given: '(a - b) / (c - d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true } },
    ],
    at: { a: '416', b: '41', c: '1000', d: '100' },
    reference: '5/12',
  },

  /*
   * ── real-number-line ────────────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, and this concept is the
   * hardest case in the subject for the proxy rule rather than for the missing
   * form. The content is a decimal expansion that does not stop, a set with no
   * last element, and an axiom about infinite sets. None of those is a value,
   * and no `NamedForm` would change that — unlike `decimal-representation`,
   * where a `decimal_expansion` form genuinely would close the gap.
   *
   * So each asks the one comparison the argument turns on, and each prompt
   * names what it stands in for:
   *
   *  - the first clears the decimal point and compares two integers. 2.64² < 7
   *    and 264² < 7 · 100² are the same statement, and the integer form is the
   *    mathematically honest one: it is what shows that every digit of an
   *    irrational root is settled by whole-number arithmetic, so the
   *    irrationality lives in the non-termination and never in a step.
   *  - the second is the mean itself, which is the one part of that point that
   *    IS a construction with an answer. The conclusion it supports — that the
   *    move never runs out, so nothing has a next number — cannot be asked.
   *  - the third is one hypothesis of a two-hypothesis argument: that 17/12 is
   *    above √2, hence above every term of the increasing list. "And no bound
   *    is least" is the other half and is unaskable; the prompt says so.
   *
   * The first and third are both "square and subtract", which is worth
   * admitting rather than disguising: they are the same decision procedure run
   * in opposite directions, one establishing a lower bracket on a digit and one
   * an upper bound on a set, and on different kinds of operand — integers after
   * clearing a decimal, and a fraction. They are not proxies for each other,
   * and the middle task is a different shape entirely.
   *
   * All three are integer or rational arithmetic settled by `exactValue` with
   * no worker, which was worth checking for a concept about numbers
   * `exactValue` returns null for. Not one of them asks for an irrational
   * value. Different numbers from the worked examples where it matters — those
   * use √7 at 2.64, the pair 2/9 and 3/13, and the bound 17/12 — except the
   * 17/12 in the third, deliberately: it is the bound the example establishes
   * and the task is the single comparison that establishes it, so a different
   * fraction would be a different claim rather than a fresh exercise.
   */
  {
    id: 'clear-the-point-to-settle-a-digit-1',
    knowledgePointId: 'every-digit-is-settled-by-whole-numbers',
    kind: 'evaluate',
    prompt:
      '2.65² = 7.0225 is already past 7, so the second decimal place of √7 is 4 rather than 5 — '
      + 'provided 2.64 is still short of it. Comparing 2.64² with 7 is the same as comparing '
      + '264² with 7 · 100², which is the form worth seeing: the digits of an irrational root '
      + 'are decided by whole-number arithmetic, and nothing at any single step is approximate. '
      + 'Evaluate n * m^2 - d^2 at n = 7, m = 100, d = 264. A positive answer says 2.64² is '
      + 'still below 7 and the digit stands. The task cannot ask for the digit itself — a digit '
      + 'is not a value this engine can demand of an expression — so it asks the comparison the '
      + 'digit rests on.',
    given: 'n * m^2 - d^2',
    variables: [
      { name: 'n', assumptions: { integer: true, positive: true } },
      { name: 'm', assumptions: { integer: true, positive: true } },
      { name: 'd', assumptions: { integer: true, positive: true } },
    ],
    at: { n: '7', m: '100', d: '264' },
    reference: '304',
  },
  {
    id: 'mean-of-two-fractions-1',
    knowledgePointId: 'no-two-reals-are-adjacent',
    kind: 'evaluate',
    prompt:
      'Over the common denominator 165 the fractions 4/15 and 3/11 are 44/165 and 45/165 — '
      + 'consecutive numerators, which is exactly the shape that makes adjacency look real. The '
      + 'mean settles it, and it is also the whole construction rather than a check on one: '
      + 'evaluate (a/b + c/d) / 2 at a = 4, b = 15, c = 3, d = 11. Your answer lies strictly '
      + 'between the two, so they were never adjacent — and the same move applies to it and '
      + 'either of them in turn, which is the part no task can ask you for.',
    given: '(a/b + c/d) / 2',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '4', b: '15', c: '3', d: '11' },
    reference: '89/330',
  },
  {
    id: 'a-rational-upper-bound-1',
    knowledgePointId: 'completeness-is-assumed-not-proved-here',
    kind: 'evaluate',
    prompt:
      'Showing that 17/12 bounds the increasing list 1, 1.4, 1.41, 1.414, … means showing '
      + '(17/12)² is above 2, since squaring preserves order on the positives and every term of '
      + 'the list squares to below 2. That is one subtraction and its sign is the ruling: '
      + 'evaluate (p/q)^2 - n at p = 17, q = 12, n = 2. A positive answer makes 17/12 an upper '
      + 'bound. How SMALL the answer is hints at the other half of the point, which is that no '
      + 'rational bound is the least one — and that half is a claim about an infinite set, so no '
      + 'task in this build can ask for it.',
    given: '(p/q)^2 - n',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'q', assumptions: { integer: true, nonzero: true } },
      { name: 'n', assumptions: { integer: true, positive: true } },
    ],
    at: { p: '17', q: '12', n: '2' },
    reference: '1/144',
  },

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

  /*
   * `evaluate` tasks on polynomial arithmetic, so the subject survives the
   * worker being unreachable.
   *
   * This concept's other three tasks are all `transform_to_form`, which cannot
   * be settled without the CAS — and `factoring-quadratics` and
   * `polynomial-division` are each gated SOLELY behind it. So whenever the
   * worker is down, a learner who chose rational-expressions meets a wall at
   * its first concept and nothing behind it can be reached by doing problems.
   *
   * NOT because the worker is absent. It is deployed and wired up:
   * `services.mathwb` on zMothership2, published at
   * math-worker.aireadalong.com by a Cloudflare Tunnel, with
   * MATH_WORKBENCH_URL and MATH_WORKBENCH_TOKEN live as Worker secrets. An
   * earlier version of this comment claimed production had no worker, which was
   * wrong — it was inferred from a locally-built `NO_WORKER` config rather than
   * observed. But the tunnel terminates on a home machine, so "unreachable" is
   * an ordinary state rather than a hypothetical, and a subject that becomes
   * impassable when it happens is worth preventing.
   *
   * Evaluating at a point is the right fallback rather than a consolation
   * prize: expansion is an identity, so the two forms must agree at every
   * value, and checking one is how the expansion is verified by hand anyway.
   * It cannot be done without expanding correctly.
   */
  {
    id: 'expand-binomials-at-1',
    knowledgePointId: 'expand-binomials',
    kind: 'evaluate',
    prompt:
      'Evaluate (x + 3)(x − 5) at x = 2. Expanding first and substituting first must agree — ' +
      'that is what makes the expansion an identity rather than a guess.',
    given: '(x + 3)*(x - 5)',
    variables: REAL_X,
    at: { x: '2' },
    reference: '-15',
  },
  {
    id: 'expand-binomials-at-2',
    knowledgePointId: 'expand-binomials',
    kind: 'evaluate',
    prompt: 'Evaluate (2x − 1)(x + 4) at x = −3.',
    given: '(2*x - 1)*(x + 4)',
    variables: REAL_X,
    at: { x: '-3' },
    reference: '-7',
  },
  {
    id: 'add-polynomials-at-1',
    knowledgePointId: 'add-polynomials',
    kind: 'evaluate',
    prompt:
      'Evaluate (2x² − x + 4) + (x² + 5x − 9) at x = 3. Collecting like terms first should give ' +
      'the same number.',
    given: '(2*x^2 - x + 4) + (x^2 + 5*x - 9)',
    variables: REAL_X,
    at: { x: '3' },
    reference: '34',
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

  // ── completing-the-square ───────────────────────────────────────────────
  //
  // `form: 'completed_square'` is doing the real work on every one of these.
  // Without it the reference check alone would accept the given back unchanged:
  // `x^2 + 6x + 5` is equivalent to `(x + 3)^2 - 4`, so equivalence cannot tell
  // a completed square from an untouched quadratic. The form is what makes the
  // task a task.
  {
    id: 'complete-monic-1',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 + 6x + 5',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 3)^2 - 4',
  },
  {
    id: 'complete-monic-2',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 - 10x + 7',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x - 5)^2 - 18',
  },
  // A negative constant inside, so the two corrections do not cancel into
  // something that looks right for the wrong reason.
  {
    id: 'complete-monic-3',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 + 4x - 1',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 2)^2 - 5',
  },
  {
    id: 'complete-odd-b-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. Keep the fraction exact.',
    given: 'x^2 + 3x + 1',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 3/2)^2 - 5/4',
  },
  {
    id: 'complete-odd-b-2',
    knowledgePointId: 'complete-odd-b',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. Keep the fraction exact.',
    given: 'x^2 - 5x + 2',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x - 5/2)^2 - 17/4',
  },
  {
    id: 'complete-non-monic-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. The leading coefficient is not 1.',
    given: '2x^2 + 8x + 5',
    form: 'completed_square',
    variables: REAL_X,
    reference: '2(x + 2)^2 - 3',
  },
  {
    id: 'complete-non-monic-2',
    knowledgePointId: 'complete-non-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. The leading coefficient is not 1.',
    given: '3x^2 - 12x + 7',
    form: 'completed_square',
    variables: REAL_X,
    reference: '3(x - 2)^2 - 5',
  },
  /*
   * The same skill as `evaluate`, so the concept stays gradable when the worker
   * is unreachable.
   *
   * All seven `transform_to_form` tasks above need the CAS for the equivalence
   * half, and a concept whose every task is inconclusive cannot gain strength —
   * so `quadratic-formula`, which this gates, would be reachable only by
   * claiming past it. (The worker IS deployed; see the longer note on the
   * polynomial-arithmetic tasks above, including the correction to an earlier
   * claim here that it was not.)
   *
   * Completing the square computes exactly two numbers, h = b/2a and
   * k = c − b²/4a, and both are exactly rational. Asking for them directly is
   * not a restatement of the answer: it is the arithmetic the move consists of,
   * and it isolates the two places it goes wrong — the fraction when b is odd,
   * and the 4a when the leading coefficient is not 1.
   *
   * The transform tasks stay. They are the better test of the skill and they
   * will rule the moment a worker is configured; these are the floor under
   * them, not a replacement.
   */
  {
    id: 'complete-monic-k-1',
    knowledgePointId: 'complete-monic',
    kind: 'evaluate',
    prompt:
      'For x² + 6x + 5 written as (x + h)² + k, what is k? It is the constant left after the ' +
      'bracket has added (b/2)² that was never there.',
    given: 'c - (b/2)^2',
    variables: REAL_BC,
    at: { b: '6', c: '5' },
    reference: '-4',
  },
  {
    id: 'complete-odd-b-h-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'evaluate',
    prompt:
      'For x² + 3x + 1 written as (x + h)² + k, what is h? Keep it exact — rounding it makes ' +
      'the identity false.',
    given: 'b/2',
    variables: REAL_BC,
    at: { b: '3', c: '1' },
    reference: '3/2',
  },
  {
    id: 'complete-odd-b-k-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'evaluate',
    prompt: 'And for the same quadratic, x² + 3x + 1, what is k?',
    given: 'c - (b/2)^2',
    variables: REAL_BC,
    at: { b: '3', c: '1' },
    reference: '-5/4',
  },
  {
    id: 'complete-non-monic-k-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'evaluate',
    prompt:
      'For 2x² + 8x + 5 written as a(x + h)² + k, what is k? The correction is divided by 4a, ' +
      'not by 4 — that factor is the step people drop.',
    given: 'c - b^2/(4*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '8', c: '5' },
    reference: '-3',
  },
  {
    id: 'complete-non-monic-h-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'evaluate',
    prompt: 'For the same quadratic, 2x² + 8x + 5, what is h?',
    given: 'b/(2*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '8', c: '5' },
    reference: '2',
  },

  // ── polynomial-roots ────────────────────────────────────────────────────
  //
  // Both halves on purpose. The remainder and factor theorems are `evaluate`,
  // so they settle locally with no worker; full factorisation is a
  // `transform_to_form` only the CAS can rule. That satisfies the "finishable
  // without the worker" invariant with the concept's real content rather than
  // with a stand-in invented to satisfy it.
  {
    id: 'remainder-theorem-1',
    knowledgePointId: 'remainder-theorem',
    kind: 'evaluate',
    prompt:
      'What is the remainder when x³ − 2x² + 4 is divided by x − 3? Substitute rather than divide.',
    given: 'x^3 - 2*x^2 + 4',
    variables: REAL_X,
    at: { x: '3' },
    reference: '13',
  },
  // Negative a, which is where the sign of x − a is misread as x + a.
  {
    id: 'remainder-theorem-2',
    knowledgePointId: 'remainder-theorem',
    kind: 'evaluate',
    prompt: 'What is the remainder when 2x³ + x − 5 is divided by x + 2? Mind what a is.',
    given: '2*x^3 + x - 5',
    variables: REAL_X,
    at: { x: '-2' },
    reference: '-23',
  },
  {
    id: 'factor-theorem-1',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt:
      'Evaluate x³ − 7x + 6 at x = 1. A result of zero means x − 1 is a factor.',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '1' },
    reference: '0',
  },
  {
    id: 'factor-theorem-2',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt: 'Evaluate the same polynomial, x³ − 7x + 6, at x = 2. Is x − 2 a factor?',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '2' },
    reference: '0',
  },
  // A candidate that fails, so the test is a test rather than a formality — and
  // the value it returns is the remainder, which is the previous point's skill.
  {
    id: 'factor-theorem-3',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt:
      'Evaluate x³ − 7x + 6 at x = 3. Not every candidate is a root — and what you get is the ' +
      'remainder on division by x − 3.',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '3' },
    reference: '12',
  },
  {
    id: 'rational-root-1',
    knowledgePointId: 'rational-root-search',
    kind: 'transform_to_form',
    prompt: 'Factor this completely into three linear factors.',
    given: 'x^3 - 7*x + 6',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 1)*(x - 2)*(x + 3)',
  },
  // Leading coefficient 2, so the candidate list includes halves — the part of
  // the rule that is dropped when people only try divisors of the constant.
  {
    id: 'rational-root-2',
    knowledgePointId: 'rational-root-search',
    kind: 'transform_to_form',
    prompt:
      'Factor this completely. The leading coefficient is not 1, so the candidate roots include ' +
      'fractions.',
    given: '2*x^3 - 3*x^2 - 11*x + 6',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 3)*(2*x - 1)*(x + 2)',
  },

  // ── quadratic-formula ───────────────────────────────────────────────────
  //
  // All `evaluate`, which is what made this concept authorable with no new
  // engine work: `sqrt` is already in ALLOWED_FUNCTIONS, so an irrational root
  // is an exact expression the verifier can rule.
  //
  // One root per task, always a named one. A quadratic has two roots and a task
  // has one reference, and accepting either would let a learner who always takes
  // the + branch never discover they had not understood the ±.
  {
    id: 'discriminant-negative-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² + x + 1. Its sign is the answer to "how many real roots".',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '1', c: '1' },
    reference: '-3',
  },
  {
    id: 'discriminant-zero-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² − 6x + 9. Zero means the two roots have collided into one.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '-6', c: '9' },
    reference: '0',
  },
  // A non-monic perfect square, so the 4ac term cannot be mistaken for 4c.
  {
    id: 'discriminant-square-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of 2x² + 5x − 3. A perfect square here means factoring would ' +
      'also have worked.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '2', b: '5', c: '-3' },
    reference: '49',
  },
  {
    id: 'formula-rational-1',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt:
      'Use the formula to find the LARGER root of x² − 2x − 15 = 0. It factors, so you can check ' +
      'the answer against (x + 3)(x − 5).',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '-2', c: '-15' },
    reference: '5',
  },
  {
    id: 'formula-rational-2',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt: 'Find the SMALLER root of 2x² + 5x − 3 = 0.',
    given: '(-b - sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '5', c: '-3' },
    reference: '-3',
  },
  // b positive, so −b is negative: the sign slip the knowledge point names.
  {
    id: 'formula-rational-3',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt: 'Find the LARGER root of x² + 7x + 12 = 0. Watch the sign of −b.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '7', c: '12' },
    reference: '-3',
  },
  {
    id: 'formula-irrational-1',
    knowledgePointId: 'irrational-roots',
    kind: 'evaluate',
    prompt:
      'Find the LARGER root of x² + 2x − 1 = 0, exactly. Keep the surd — a decimal is not the ' +
      'answer the formula gives.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '2', c: '-1' },
    reference: '-1 + sqrt(2)',
  },
  {
    id: 'formula-irrational-2',
    knowledgePointId: 'irrational-roots',
    kind: 'evaluate',
    prompt: 'Find the LARGER root of x² − 4x + 1 = 0, exactly.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '-4', c: '1' },
    reference: '2 + sqrt(3)',
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

  // ── even-root-needs-nonnegative ─────────────────────────────────────────
  //
  // A domain restriction that IS rulable, which is worth stating plainly
  // because the two notes nearby say the opposite about their own points and
  // the difference between the cases is easy to miss.
  //
  // `cancelling-keeps-the-hole` and `log-argument-is-positive` are both
  // unaskable for the same reason: the only thing separating the two sides of
  // their claim is a point where one side is UNDEFINED, and
  // `ruleCounterexample` refuses such a point — correctly, since an excluded
  // point does not refute a claim about values. So those claims have no answer
  // the engine accepts.
  //
  // This claim does not have that shape. `(x^2)^(1/2) = x` is the power rule
  // with its condition dropped, and both sides are defined at every real x:
  // squaring first lands on something non-negative, so the even root is always
  // taken of a legal argument. The left side is |x| and the right is x, so they
  // differ at an ordinary interior point and substitution settles it. The
  // undefined case the point teaches — (−4)^(1/2) — is the step the false
  // reasoning passes THROUGH, not a side of the claim, which is exactly why it
  // costs nothing here.
  //
  // Every negative x is a witness and every x >= 0 makes the two sides agree.
  // That is a sharper fact than the single reference below, and a learner who
  // reaches it has the knowledge point rather than one lucky number.
  {
    id: 'break-even-root-needs-nonnegative-1',
    knowledgePointId: 'even-root-needs-nonnegative',
    kind: 'counterexample',
    prompt:
      'Somebody cancelled the 2 against the 1/2 and claims (x²)^(1/2) = x for every real x. ' +
      'Give a value of x that proves them wrong.',
    given: '(x^2)^(1/2) = x',
    variables: REAL_X,
    // At x = −3 the left side is 9^(1/2) = 3 and the right is −3. Not the −4 of
    // the worked example, deliberately: the witness is a different number from
    // the one the example works through, so answering it takes the reasoning
    // rather than the recollection. No `domainConditions` — there is nothing to
    // exclude, and that absence is the whole point of the note above.
    reference: '-3',
  },

  // ── the logarithm concepts, which had material and no problems ──────────
  //
  // `logarithm-definition`, `logarithm-rules` and `solving-exponential-equations`
  // were the three concepts `isPractisable` was written to expose: knowledge
  // points, worked examples, and nothing a learner could be set. The diagnosis
  // at the time was that their natural task is *solving* or *stating* and the
  // engine has no verifiable kind for either, so the fix would have to be a new
  // task kind.
  //
  // That was half right and the wrong half was load-bearing. The reason no
  // `evaluate` task could be written here was not the task kind — it was that
  // `exactValue` returned null for every `log`, so `ruleEvaluate` could not
  // recompute the task's own value and fell through to comparing the learner
  // against the author's unverified reference. An authored task that cannot
  // re-derive its own answer is exactly what the re-derivation check exists to
  // refuse, so writing these would have been writing three unvouched tasks.
  //
  // `exactLog` closed that. A logarithm is exactly rational when its argument
  // is a rational power of its base, which is the only case a logarithm is set
  // in by hand — so all five tasks below are settled locally and exactly, with
  // no worker, like their `evaluate` neighbours above.
  //
  // `log(x, b)` is log base b of x: sympy's argument order, which the worker
  // inherits by calling `sympy.log(*args)` and `exactValue` now matches. The
  // prompts write it as log₂(32) because that is how it is read.
  {
    id: 'log-as-exponent-1',
    knowledgePointId: 'log-is-an-exponent',
    kind: 'evaluate',
    prompt:
      'Evaluate log₂(32). Read the notation as the question it is — what power of 2 gives 32? — ' +
      'rather than reaching for a calculator.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', c: '32' },
    // 2^5 = 32.
    reference: '5',
  },
  {
    id: 'log-as-exponent-2',
    knowledgePointId: 'log-is-an-exponent',
    kind: 'evaluate',
    // The second task on the point, and it is the one that does the teaching.
    // log₂(1/8) is where "a logarithm is an exponent" has to survive contact
    // with an exponent that is negative — and it separates two things learners
    // merge: the ARGUMENT of a log must be positive, while its VALUE is free to
    // be negative. 1/8 is a perfectly good argument.
    prompt:
      'Evaluate log₂(1/8). The argument is positive, so this is defined — and the answer is not.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', c: '1/8' },
    // 2^-3 = 1/8.
    reference: '-3',
  },
  // NOT AUTHORED: `log-argument-is-positive`, and this is a genuine engine gap
  // rather than an authoring backlog. Its content is that log₂(−8) *names
  // nothing*, and `evaluate` asks for a value — there is no way to submit
  // "undefined" as an answer, and a task whose reference is undefined would
  // have `exactValue` return null for its own truth, which is the unvouched
  // state the whole re-derivation check refuses.
  //
  // The honest kinds for it are `state` and `justify`, both declared
  // unverifiable in types.ts, and `counterexample` does not fit either: the
  // claim "log is defined everywhere" is not an identity, so substitution
  // cannot refute it. So the point keeps its worked example and no task, which
  // the registry permits. `log-as-exponent-2` above covers the part of the
  // confusion that IS rulable.
  {
    id: 'log-of-product-1',
    knowledgePointId: 'log-of-product',
    kind: 'evaluate',
    prompt:
      'Evaluate log₂(8 · 4) by splitting it into log₂(8) + log₂(4). Then check it against ' +
      'log₂(32) — the rule and the direct route have to agree.',
    // The product is left unmultiplied in `given` so the task's own expression
    // is the thing the rule applies to. `exactLog` evaluates it either way,
    // which is what makes the check in the prompt a real check.
    given: 'log(x*y, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'x', assumptions: { real: true, positive: true } },
      { name: 'y', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', x: '8', y: '4' },
    // 3 + 2 = 5, and log₂(32) = 5.
    reference: '5',
  },
  {
    id: 'log-of-power-1',
    knowledgePointId: 'log-of-power',
    kind: 'evaluate',
    prompt:
      'Evaluate log₃(9⁴). Bring the exponent out in front first — 9⁴ is 6561 and nobody wants ' +
      'to find its logarithm the other way.',
    given: 'log(x^n, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'x', assumptions: { real: true, positive: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '3', x: '9', n: '4' },
    // 4 · log₃(9) = 4 · 2 = 8.
    reference: '8',
  },
  {
    id: 'solve-exponential-1',
    knowledgePointId: 'take-logs-of-both-sides',
    kind: 'evaluate',
    // ── An evaluate task standing in for a solve, and what it does not claim ──
    //
    // There is still no verifiable `solve` kind, and this is not one. The
    // expression language parses expressions rather than equations, and a
    // solution is in general a SET — no solutions, one, or infinitely many —
    // which no `evaluate` task can ask for.
    //
    // What makes this legitimate rather than a dodge is that the task asks for
    // the number the method produces: taking log₉ of both sides of 9^x = 27
    // turns the equation into x = log₉(27), and that expression is what `given`
    // carries. The learner submits a number and it is ruled exactly. A learner
    // who submits `log(27, 9)` instead is also ruled correct, because
    // `exactValue` now evaluates it — which is the right outcome, since the
    // unsimplified form is a complete answer to "solve for x".
    //
    // The answer is 3/2 deliberately. An integer answer can be reached by
    // guessing powers; 9^x = 27 cannot, so it is the smallest instance where
    // the method is the only route. It is also the case that exercises
    // `exactLog`'s rational-exponent search rather than its integer walk.
    prompt:
      'Solve 9^x = 27. The unknown is in the exponent, so take log₉ of both sides and read off x. ' +
      'The answer is not a whole number, which is the point — no amount of trying powers of 9 ' +
      'gets there.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '9', c: '27' },
    // 9^(3/2) = 27.
    reference: '3/2',
    // The `log(27, 9)` acceptance described above, now enforced rather than
    // only asserted in a comment. `ruleEvaluate` otherwise refuses an answer
    // that is the given with its inputs substituted — which this one is,
    // textually — because that was a free mark everywhere else. See
    // `acceptsUnevaluated` in types.ts for why the exemption has to be the
    // author's call and cannot be inferred.
    acceptsUnevaluated: true,
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

  // ── expressions-and-equations ───────────────────────────────────────────
  //
  // Five `evaluate` tasks across three knowledge points, all settled by exact
  // rational arithmetic, so this subject is gradable with no worker — which
  // matters more here than in most places, because the concept now sits
  // directly above arithmetic on the entry route and a worker outage must not
  // wall off the way in.
  //
  // THE FIRST TWO ARE A PAIR AND HAVE TO BE READ AS ONE. The knowledge point
  // is that a letter has two readings, and the two readings are checked by the
  // same act — substitution — doing two different jobs. `unknown-check-1`
  // substitutes to CONFIRM the number a condition picked out, which is what
  // settles an unknown. `identity-difference-1` substitutes into the
  // difference of the two sides of an identity and gets 0, which is what
  // substitution can do for a variable and no more: one case, not a proof. A
  // single task could only have taught one of those.
  //
  // `collect-like-terms-1` IS A PROXY AND SAYS SO. Collecting is a claim about
  // an expression, and no `NamedForm` expresses "collected": `5x + 2 + 3x − 7
  // + x²` is already a sum of monomials, so `expanded` would be satisfied by
  // the input unchanged and the equivalence check would pass trivially. See
  // ontology-algebra.ts for the longer version. The checkable question in the
  // vicinity is that the collected form and the original agree at every x, so
  // the task asks for their common value at one.
  {
    id: 'unknown-check-1',
    knowledgePointId: 'a-letter-has-two-readings',
    kind: 'evaluate',
    prompt:
      'The condition 3x − 7 = 11 picks out one number. Evaluate ax − b at a = 3, x = 6, b = 7 to '
      + 'check that 6 is it. Substituting back is the whole of what settles an unknown, which is '
      + 'why this reading has a number for an answer.',
    given: 'a*x - b',
    variables: REAL_ABX,
    // 3·6 − 7 = 18 − 7 = 11, the right-hand side of the condition.
    reference: '11',
    at: { a: '3', x: '6', b: '7' },
  },
  {
    id: 'identity-difference-1',
    knowledgePointId: 'a-letter-has-two-readings',
    kind: 'evaluate',
    prompt:
      'Now the other reading. 3(x + 2) = 3x + 6 claims the two sides are the same number for '
      + 'every x, so their difference should be 0 wherever you look. Evaluate '
      + 'a(x + b) − (ax + ab) at a = 3, x = −4, b = 2. Note what this does and does not show: '
      + 'one value of 0 is a single case, and the claim is about all of them.',
    given: 'a*(x + b) - (a*x + a*b)',
    variables: REAL_ABX,
    // 3(−4 + 2) − (3·(−4) + 3·2) = 3(−2) − (−12 + 6) = −6 − (−6) = 0.
    reference: '0',
    at: { a: '3', x: '-4', b: '2' },
  },
  {
    id: 'collect-like-terms-1',
    knowledgePointId: 'terms-collect-only-when-the-letters-match',
    kind: 'evaluate',
    prompt:
      'Collect 5x + 2 + 3x − 7 + x² into three terms, then evaluate it at x = 3. Your collected '
      + 'answer must give the same number at x = 3 as the original does — that agreement is what '
      + 'is being checked here, because "collected" is a claim about the expression and no form '
      + 'in this build can ask for it directly.',
    given: '5*x + 2 + 3*x - 7 + x^2',
    variables: REAL_X,
    // 15 + 2 + 9 − 7 + 9 = 28, and the collected x² + 8x − 5 at x = 3 is
    // 9 + 24 − 5 = 28. The two agreeing is the point of the task.
    reference: '28',
    at: { x: '3' },
  },
  {
    id: 'substitute-signed-1',
    knowledgePointId: 'substituting-supplies-the-hidden-brackets',
    kind: 'evaluate',
    prompt:
      'Evaluate 5 − 2x + x² at x = −3. Both brackets the letter was hiding have to be written '
      + 'down: 2x becomes 2(−3), and x² becomes (−3)².',
    given: '5 - 2*x + x^2',
    variables: REAL_X,
    // 5 − 2(−3) + (−3)² = 5 + 6 + 9 = 20. Reading the square as −3² instead
    // gives 5 + 6 − 9 = 2, so a bracket error changes the answer rather than
    // hiding inside it — which is what makes this task worth setting.
    reference: '20',
    at: { x: '-3' },
  },
  {
    id: 'power-binds-before-minus-1',
    knowledgePointId: 'substituting-supplies-the-hidden-brackets',
    kind: 'evaluate',
    prompt:
      'Evaluate −x² at x = −3. The power binds tighter than the minus sign in front of it, so the '
      + 'squaring happens first and the negation second — and the x brought its own sign inside. '
      + 'This is the order-of-operations convention deciding a sign rather than a magnitude.',
    given: '-x^2',
    variables: REAL_X,
    // −((−3)²) = −9. Negating first instead gives (+3)² = 9, so the two
    // readings differ in sign and the convention is doing the work.
    reference: '-9',
    at: { x: '-3' },
  },

  // ── plane-geometry ──────────────────────────────────────────────────────
  //
  // Six `evaluate` tasks across three knowledge points, all settled by exact
  // rational arithmetic, so this subject needs no worker — which matters here
  // because the concept is a ROOT of the whole map and a worker outage would
  // wall off a way in rather than a branch.
  //
  // EVERY ONE OF THEM IS A PROXY AND THE SET SAYS SO ONCE, HERE. The real ask
  // in this concept is "find the missing angle and name the fact you used",
  // and no verifiable kind can take the second half: a reason is not a value
  // and not a form. So each task asks the arithmetic its fact licenses, and
  // each prompt names the decision it is standing in for — the same move the
  // rational-expressions tasks make for "state the excluded points".
  //
  // The cost is specific and worth writing down rather than discovering: a
  // learner who subtracts from 180 where the figure called for 360 gets the
  // arithmetic question right. Choosing between the two sums is the skill and
  // it is unscorable here, which is why `straight-line-remainder-1` and
  // `full-turn-remainder-1` are a PAIR — same shape, different total, so the
  // two sit next to each other in practice and the choice is at least visible
  // even though no ruling turns on it.
  //
  // They declare `real` rather than `integer`, unlike the arithmetic tasks
  // they otherwise resemble. The whole-degree values are a convenience of the
  // figures chosen; nothing in these facts is about whole numbers, and
  // 180 − (180 − a) = a is a claim about every angle. Narrowing the
  // declaration would narrow the claim.
  {
    id: 'straight-line-remainder-1',
    knowledgePointId: 'two-sums-every-angle-chase-uses',
    kind: 'evaluate',
    prompt:
      'Four rays leave a point on a straight line, all on the same side of it, cutting angles of '
      + '42°, 55°, x° and 38° in a row. Evaluate 180 − a − b − c at a = 42, b = 55, c = 38 to get '
      + 'x. The 180 is in the expression because the figure put it there — that the four angles '
      + 'span a straight line and not a full turn is the decision this task cannot ask you for.',
    given: '180 - a - b - c',
    variables: REAL_ABC,
    // 180 − 42 − 55 − 38 = 45, the x of the worked example.
    reference: '45',
    at: { a: '42', b: '55', c: '38' },
  },
  {
    id: 'full-turn-remainder-1',
    knowledgePointId: 'two-sums-every-angle-chase-uses',
    kind: 'evaluate',
    prompt:
      'Now the other total. Four rays leave a point and fill the whole turn around it; three of '
      + 'the four angles are 90°, 73° and 115°. Evaluate 360 − a − b − c at a = 90, b = 73, '
      + 'c = 115 to get the fourth. Read this one against the task before it: the arithmetic is '
      + 'the same arithmetic, and the only thing that changed is which total the figure makes.',
    given: '360 - a - b - c',
    variables: REAL_ABC,
    // 360 − 90 − 73 − 115 = 82. Taking 180 as the total instead gives −98,
    // which is impossible rather than merely wrong — the sign is the signal
    // that the wrong sum was chosen.
    reference: '82',
    at: { a: '90', b: '73', c: '115' },
  },
  {
    id: 'adjacent-angle-on-a-line-1',
    knowledgePointId: 'vertical-angles-equal-by-subtracting-twice',
    kind: 'evaluate',
    prompt:
      'Two straight lines cross, and one of the four angles is 35°. Evaluate 180 − x at x = 35 to '
      + 'get the angle beside it. This single subtraction is the only geometric fact the vertical '
      + 'argument uses; the next task is what happens when you do it twice.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 35 = 145, the b and d of the worked example.
    reference: '145',
    at: { x: '35' },
  },
  {
    id: 'vertical-pair-difference-1',
    knowledgePointId: 'vertical-angles-equal-by-subtracting-twice',
    kind: 'evaluate',
    prompt:
      'The angle facing the first one is 180 − (180 − x): beside it along one line, then beside '
      + 'THAT along the other. Evaluate (180 − (180 − x)) − x at x = 118. A difference of 0 says '
      + 'the facing angle came back to where it started — and note what one value does and does '
      + 'not show: 118 is not the 35 of the worked example, which is the point, but two cases are '
      + 'still two cases. What settles it is that the two subtractions undo each other for every x.',
    given: '(180 - (180 - x)) - x',
    variables: REAL_X,
    // 180 − (180 − 118) = 180 − 62 = 118, and 118 − 118 = 0. Zero for every x,
    // which is the theorem; this evaluates one instance of it.
    reference: '0',
    at: { x: '118' },
  },
  {
    id: 'co-interior-remainder-1',
    knowledgePointId: 'a-transversal-across-parallels-has-two-values',
    kind: 'evaluate',
    prompt:
      'A line crosses two parallel lines at P and Q. The angle at P opening into the strip '
      + 'between them, on the right of the crossing line, is 118°. Evaluate 180 − x at x = 118 to '
      + 'get the angle at Q opening into that same strip on that same side. The subtraction is '
      + 'the part that can be checked; why it is a subtraction and not the 118° over again is the '
      + 'slide argument, and that is the half no task here can score.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 118 = 62. Answering 118 is the error the worked example is built
    // around: the slide lands that angle outside the strip, not inside it.
    reference: '62',
    at: { x: '118' },
  },
  {
    id: 'eight-angles-two-values-1',
    knowledgePointId: 'a-transversal-across-parallels-has-two-values',
    kind: 'evaluate',
    prompt:
      'All eight angles in that figure are 118° or 62°, four of each, and they fill the four '
      + 'straight angles the two crossings make — two at each crossing. Evaluate 4x + 4(180 − x) '
      + 'at x = 118. That the x cancels is the content: the total is 4 × 180 whatever the crossing '
      + 'line\'s slant, which is another way of saying the figure holds two numbers and no third.',
    given: '4*x + 4*(180 - x)',
    variables: REAL_X,
    // 4·118 + 4·62 = 472 + 248 = 720, which is 4 × 180 — the two crossings'
    // four straight angles. Identically 720 for every x.
    reference: '720',
    at: { x: '118' },
  },

  // ── plane-geometry: the triangle ─────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `triangle-basics`.
  // Everything the block above says applies unchanged — all settled by exact
  // rational arithmetic with no worker, all proxies for an ask whose second
  // half is a reason, and all naming the decision they stand in for.
  //
  // ONE THING IS NEW AND IT IS THE INEQUALITY. "Do these three lengths make a
  // triangle?" has a perfectly good task kind waiting for it: `counterexample`
  // asks for an object that breaks a claim, and three lengths that fail to
  // close is exactly such an object. It is rulable only when the claim is an
  // identity, and this claim is an inequality, so the kind would be served and
  // never scored — which the assembler is designed to refuse.
  //
  // So the test is asked as the subtraction whose SIGN decides it, and the
  // prompt says so. That is better than it sounds and worse than it looks:
  // the ruling is genuinely in the learner's answer rather than nowhere, since
  // a + b − c carries the verdict in one number — but a learner who computes
  // −1 and concludes "yes, a triangle" still scores the mark. Reading the sign
  // is the skill and no task here can score it, the same shape of loss as
  // choosing between 180 and 360 one block up.
  {
    id: 'third-angle-of-a-triangle-1',
    knowledgePointId: 'the-angle-sum-is-the-transversal-fact-again',
    kind: 'evaluate',
    prompt:
      'Two angles of a triangle are 47° and 68°. Evaluate 180 − a − b at a = 47, b = 68 to get '
      + 'the third. The 180 is there because a line through one vertex parallel to the opposite '
      + 'side puts all three angles along a straight line — that derivation is the content of '
      + 'this point and this task takes it as given.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 47 − 68 = 65, the third angle of the worked example.
    reference: '65',
    at: { a: '47', b: '68' },
  },
  {
    id: 'exterior-angle-is-the-other-two-1',
    knowledgePointId: 'the-angle-sum-is-the-transversal-fact-again',
    kind: 'evaluate',
    prompt:
      'The exterior angle at that third vertex is 180 minus the third angle — beside it along a '
      + 'straight line. So it is 180 − (180 − a − b), and the claim is that this is just a + b. '
      + 'Evaluate (180 − (180 − a − b)) − (a + b) at a = 47, b = 68. A difference of 0 says the '
      + 'two subtractions cancelled; that they cancel for EVERY a and b is what makes the '
      + 'exterior-angle fact a theorem rather than an arithmetic coincidence, and one pair of '
      + 'values cannot show that.',
    given: '(180 - (180 - a - b)) - (a + b)',
    variables: REAL_AB,
    // 180 − 47 − 68 = 65; 180 − 65 = 115; 115 − (47 + 68) = 115 − 115 = 0.
    // Identically 0, which is the theorem; this evaluates one instance.
    reference: '0',
    at: { a: '47', b: '68' },
  },
  {
    id: 'longest-against-the-other-two-1',
    knowledgePointId: 'the-inequality-compares-two-routes',
    kind: 'evaluate',
    prompt:
      'Three lengths are 7, 10 and 18. Evaluate a + b − c at a = 7, b = 10, c = 18, where c is '
      + 'the longest. This compares the way round through the third vertex against the way '
      + 'straight along the longest side, so a positive answer is a triangle and a negative one '
      + 'is a route shorter than the straight line, which no route can be. Picking out which of '
      + 'the three is c, and reading what the sign then means, are the two halves this task '
      + 'cannot ask you for.',
    given: 'a + b - c',
    variables: REAL_ABC,
    // 7 + 10 − 18 = −1. Negative, so no triangle: the detour is a unit shorter
    // than the direct route. The sign is the ruling and the magnitude is how
    // far short the two shorter sides fall.
    reference: '-1',
    at: { a: '7', b: '10', c: '18' },
  },
  {
    id: 'the-window-for-a-third-length-1',
    knowledgePointId: 'the-inequality-compares-two-routes',
    kind: 'evaluate',
    prompt:
      'Keep two sides of 7 and 10 and let the third be x. The two conditions give x > 10 − 7 and '
      + 'x < 10 + 7, so the third length lies strictly between b − a and b + a. Evaluate '
      + '(b + a) − (b − a) at a = 7, b = 10 to get how wide that window is. That the b cancels is '
      + 'the content: the window is twice the SHORTER side whatever the longer one is.',
    given: '(b + a) - (b - a)',
    variables: REAL_AB,
    // (10 + 7) − (10 − 7) = 17 − 3 = 14, which is 2 × 7. Identically 2a, so
    // the width depends on the shorter side alone.
    reference: '14',
    at: { a: '7', b: '10' },
  },
  {
    id: 'share-what-the-given-angle-leaves-1',
    knowledgePointId: 'at-most-one-angle-is-not-acute',
    kind: 'evaluate',
    prompt:
      'A triangle has one angle of 110° and the other two are equal. Evaluate (180 − x)/2 at '
      + 'x = 110 to get each of them. The division by 2 is in the expression because the two '
      + 'angles were said to be equal; deciding that the 110 has to come out of the total BEFORE '
      + 'anything is shared is the step this task cannot ask you for.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 110)/2 = 70/2 = 35, and 110 + 35 + 35 = 180.
    reference: '35',
    at: { x: '110' },
  },
  {
    id: 'two-obtuse-angles-overrun-the-total-1',
    knowledgePointId: 'at-most-one-angle-is-not-acute',
    kind: 'evaluate',
    prompt:
      'Now suppose a triangle had TWO angles of 110°. Evaluate 180 − a − b at a = 110, b = 110 '
      + 'to see what the third angle would have to be. Read the answer against '
      + 'third-angle-of-a-triangle-1: the arithmetic is identical and only the inputs moved, '
      + 'which is what makes the impossibility arithmetic rather than a matter of drawing it and '
      + 'seeing that it will not fit.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 110 − 110 = −40. A negative third angle is impossible rather than
    // merely wrong, and 90 + 90 = 180 gives exactly 0 — also impossible, which
    // is why the rule is "at most one of 90° OR MORE" and not "at most one
    // strictly over 90°".
    reference: '-40',
    at: { a: '110', b: '110' },
  },

  // ── plane-geometry: congruence ───────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `congruence`.
  // Everything the two blocks above say applies unchanged — exact rational
  // arithmetic, no worker, every one a proxy that names the decision it stands
  // in for.
  //
  // THE PROXY IS WIDER HERE THAN ANYWHERE ELSE IN THE SUBJECT, and that is
  // the honest thing to write down rather than discover. In the angle concepts
  // the unscorable half was a REASON. Here it is a CORRESPONDENCE: the object
  // the first point is really about is a pairing of vertices, which is not a
  // value and not a `NamedForm`, so no verifiable kind can carry it. So these
  // tasks ask the arithmetic a correspondence licenses ONCE IT HAS BEEN READ,
  // and the reading is unscored — a learner who pairs the vertices wrongly and
  // then subtracts correctly still takes the mark. Naming the criterion is
  // unscorable for the same reason: SSS, SAS and ASA are not values either.
  //
  // What that leaves scorable is worth stating, because it is not nothing: the
  // angle-sum arithmetic is exactly the mechanical step the concept adds, and
  // `aas-completes-to-asa-1` puts it to real work — it checks that an angle
  // computed in ONE triangle equals an angle given in the OTHER, which is the
  // whole of why AAS is not a fourth criterion.
  //
  // Two of these six deliberately echo expressions from the blocks above.
  // `isosceles-base-angles-1` is `(180 − x)/2`, the same expression as
  // `share-what-the-given-angle-leaves-1`, and the repetition IS the content:
  // there the halving was licensed by being TOLD the other two angles were
  // equal, and here it is licensed by the base-angle theorem, derived from a
  // triangle matched with itself. Same arithmetic, one of them earned. The
  // prompts say so and cross-reference each other, because a learner meeting
  // the second one has every right to ask what is new.
  {
    id: 'third-angle-then-carried-across-1',
    knowledgePointId: 'a-congruence-names-a-correspondence',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is congruent to triangle DEF. In ABC the angle at A is 24° and the angle at '
      + 'B is 115°. Evaluate 180 − a − b at a = 24, b = 115 to get the angle at C, which the '
      + 'correspondence then makes equal to the angle at F. Note which half of that this task '
      + 'scores: the subtraction, not the pairing. That F is the letter matching C — rather than '
      + 'D or E — is read off the letter order, and no answer you type here can show you read it '
      + 'correctly.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 24 − 115 = 41, the angle at C and so the angle at F.
    reference: '41',
    at: { a: '24', b: '115' },
  },
  {
    id: 'the-reordered-claim-is-false-1',
    knowledgePointId: 'a-congruence-names-a-correspondence',
    kind: 'evaluate',
    prompt:
      'Same two triangles, where the angle at A is 24° and the angle at E is 115°. Writing "ABC '
      + 'is congruent to EDF" instead pairs A with E, so it demands those two angles be equal. '
      + 'Evaluate a − b at a = 115, b = 24 to test that demand. A difference of 0 would mean the '
      + 'reordering changed nothing; anything else means it made a different claim, and a false '
      + 'one, about the very same pair of triangles.',
    given: 'a - b',
    variables: REAL_AB,
    // 115 − 24 = 91. Non-zero, so the reordered statement is false — about two
    // triangles that genuinely are congruent under the original order.
    reference: '91',
    at: { a: '115', b: '24' },
  },
  {
    id: 'aas-completes-to-asa-1',
    knowledgePointId: 'three-of-the-six-and-aas-is-asa-again',
    kind: 'evaluate',
    prompt:
      'In triangle PQR the angles at P and Q are 73° and 44°. In triangle XYZ the angles at X '
      + 'and Z are 73° and 63°, so the angle at Y is 180 − 73 − 63. The claim is that this '
      + 'recovers the 44° that PQR was given, which is what turns a side and two angles into ASA. '
      + 'Evaluate (180 − a − c) − b at a = 73, c = 63, b = 44. A difference of 0 says the '
      + 'computed angle and the given one are the same angle, so the two triangles hold the same '
      + 'ASA data and AAS was never a fourth criterion.',
    given: '(180 - a - c) - b',
    variables: REAL_ABC,
    // 180 − 73 − 63 = 44, and 44 − 44 = 0. The AAS data for XYZ completes to
    // exactly the ASA data PQR was handed.
    reference: '0',
    at: { a: '73', c: '63', b: '44' },
  },
  {
    id: 'the-third-angle-was-never-free-1',
    knowledgePointId: 'three-of-the-six-and-aas-is-asa-again',
    kind: 'evaluate',
    prompt:
      'Both triangles turn out to have the angles 73°, 44° and 63°. Evaluate (a + b + c) − 180 '
      + 'at a = 73, b = 44, c = 63. A difference of 0 is the angle sum, and here it is making a '
      + 'point about criteria rather than about this triangle: the third angle is forced by the '
      + 'other two, so three angles are really only two independent numbers — and neither of '
      + 'them is a length. That is why AAA cannot be a criterion however much angle data it '
      + 'carries.',
    given: '(a + b + c) - 180',
    variables: REAL_ABC,
    // 73 + 44 + 63 = 180, so 0. Identically 0 for any triangle's angles, which
    // is the dependence that makes AAA offer two numbers rather than three.
    reference: '0',
    at: { a: '73', b: '44', c: '63' },
  },
  {
    id: 'isosceles-base-angles-1',
    knowledgePointId: 'base-angles-by-matching-a-triangle-with-itself',
    kind: 'evaluate',
    prompt:
      'In triangle ABC, AB = AC and the angle at A is 28°. Evaluate (180 − x)/2 at x = 28 to get '
      + 'each of the base angles. Read this against share-what-the-given-angle-leaves-1, which is '
      + 'the identical expression: there you were TOLD the other two angles were equal, and here '
      + 'you were told only that two SIDES are equal. What licenses the division by 2 is the '
      + 'base-angle theorem — matching ABC with ACB and applying SAS — and that derivation is '
      + 'the half this task cannot score.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 28)/2 = 152/2 = 76, and 28 + 76 + 76 = 180. The equality of the
    // two base angles is derived here rather than given, which is the whole
    // difference from the triangle task of the same shape.
    reference: '76',
    at: { x: '28' },
  },
  {
    id: 'the-equilateral-fixed-point-1',
    knowledgePointId: 'base-angles-by-matching-a-triangle-with-itself',
    kind: 'evaluate',
    prompt:
      'Apply the base-angle theorem to a SECOND pair of equal sides and all three angles come '
      + 'out equal, so an equilateral triangle has a definite angle rather than merely three '
      + 'matching ones. Evaluate (180 − x)/2 at x = 60. Getting 60 back is the content: 60° is '
      + 'the one apex angle that equals its own base angles, so it is the only value all three '
      + 'can take at once.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 60)/2 = 120/2 = 60. The fixed point of x ↦ (180 − x)/2, which is
    // the equilateral case: 3x = 180 and x = 60 are the same statement.
    reference: '60',
    at: { x: '60' },
  },

  // The similarity tasks pay the same unscorable-half price a fourth time, and
  // the shape of the debt is worth separating from the three above because it
  // is not the same one. In the angle concepts the unscorable half was a
  // REASON; in congruence it was a CORRESPONDENCE. Here it is both at once, and
  // one more besides: what the first point teaches is which three of the six
  // claims a similarity weakens, and "the angles stayed equal and the sides
  // became proportional" is a statement about a claim rather than a value, so
  // no verifiable kind carries it. A learner who believes EF = 9 and then
  // multiplies correctly takes the mark on the task below. That is named in the
  // prompt, as it is in every other block that makes this trade.
  //
  // What IS scorable here is better than it was for congruence, and the second
  // task is why. A reversed letter order produces a FALSE PROPORTION, and a
  // false proportion is two numbers that fail to be equal — which is a value,
  // and is rulable. So `the-reversed-order-is-false-1` scores the very thing
  // the congruence concept could only assert: it is the arithmetic refutation
  // of a misread correspondence, not a proxy for one.
  //
  // Two of these six deliberately echo tasks from the block above, and in both
  // cases the repetition is the content. `aa-completes-both-triples-1` is the
  // same expression as `aas-completes-to-asa-1` and `the-third-angle-was-never-
  // free-1` is cited by `two-angles-are-all-there-ever-were-1`: the angle sum
  // forcing the third angle is one fact that lands in opposite places, killing
  // AAA as a congruence criterion and collapsing AAA into AA for similarity.
  // Asking it twice is how the two verdicts get attached to one piece of
  // arithmetic. The prompts say so and cross-reference by id.
  {
    id: 'the-scale-factor-carried-across-1',
    knowledgePointId: 'a-similarity-loosens-three-of-the-six',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is similar to triangle DEF. In ABC, AB = 6 and BC = 9; in DEF, DE = 10. The '
      + 'matched pair AB and DE fixes the scale factor, and every other matched pair shares it. '
      + 'Evaluate c * a / b at a = 10, b = 6, c = 9 to get EF. Note which half of this task '
      + 'scores: the multiplication, not the reading. That EF is the side matching BC — rather '
      + 'than DE or FD — comes off the letter order, and so does the fact that EF is 5/3 of BC '
      + 'rather than equal to it. Neither is anything your answer here can show you got right.',
    given: 'c * a / b',
    variables: REAL_ABC,
    // 9 × 10/6 = 9 × 5/3 = 15, the side EF. The congruence habit answers 9,
    // which is the error the knowledge point is built to refuse.
    reference: '15',
    at: { a: '10', b: '6', c: '9' },
  },
  {
    id: 'the-reversed-order-is-false-1',
    knowledgePointId: 'a-similarity-loosens-three-of-the-six',
    kind: 'evaluate',
    prompt:
      'Same two triangles, now with all four lengths known: AB = 6 and BC = 9, DE = 10 and '
      + 'EF = 15. FED names the same triangle as DEF, so not one length changes — but "ABC is '
      + 'similar to FED" matches AB with FE and BC with ED instead, and so demands that 6/15 and '
      + '9/10 be the same number. Evaluate a/b - c/x at a = 6, b = 15, c = 9, x = 10 to test that '
      + 'demand. A difference of 0 would mean the reversal changed nothing; anything else means '
      + 'it made a different claim, and a false one, about an unchanged pair of triangles.',
    given: 'a/b - c/x',
    variables: REAL_ABC_X,
    // 6/15 − 9/10 = 2/5 − 9/10 = 4/10 − 9/10 = −1/2. Non-zero, so the reversed
    // statement is false about two triangles that genuinely are similar.
    reference: '-1/2',
    at: { a: '6', b: '15', c: '9', x: '10' },
  },
  {
    id: 'aa-completes-both-triples-1',
    knowledgePointId: 'two-angles-settle-it-and-no-length-is-needed',
    kind: 'evaluate',
    prompt:
      'In triangle ABC the angles at A and B are 52° and 85°. In triangle DEF the angles at D and '
      + 'F are 52° and 43°, so the angle at E is 180 − 52 − 43. The claim is that this recovers '
      + 'the 85° that ABC was given, which is what makes the two triangles similar by AA. '
      + 'Evaluate (180 - a - c) - b at a = 52, c = 43, b = 85. A difference of 0 says the computed '
      + 'angle and the given one are the same angle, so the two triangles have the same three '
      + 'angles and the correspondence is forced. This is the identical expression to '
      + 'aas-completes-to-asa-1 in the congruence concept — the same completion of an angle '
      + 'triple, reused here to settle a similarity rather than a congruence.',
    given: '(180 - a - c) - b',
    variables: REAL_ABC,
    // 180 − 52 − 43 = 85, and 85 − 85 = 0. DEF's third angle is exactly the one
    // ABC was handed, so both triangles carry 52°, 85° and 43°.
    reference: '0',
    at: { a: '52', c: '43', b: '85' },
  },
  {
    id: 'two-angles-are-all-there-ever-were-1',
    knowledgePointId: 'two-angles-settle-it-and-no-length-is-needed',
    kind: 'evaluate',
    prompt:
      'Evaluate 180 - a - b at a = 52, b = 85 to get the third angle of ABC. The value is not the '
      + 'point — that it was computable at all is. Naming a third angle adds no information to '
      + 'two, which is why AA and AAA are one criterion and nobody writes AAA for similarity. '
      + 'Read this against the-third-angle-was-never-free-1, which asserts the same dependence as '
      + 'a difference of zero: there it is the reason AAA cannot be a CONGRUENCE criterion, since '
      + 'three angles are two independent numbers and neither is a length. One fact, two opposite '
      + 'verdicts, and the difference is only whether size was being asked for.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 52 − 85 = 43, the angle at C. Also the expression of
    // third-angle-then-carried-across-1 at different inputs: that task carries a
    // computed angle across a congruence, this one shows it was never free.
    reference: '43',
    at: { a: '52', b: '85' },
  },
  {
    id: 'the-down-ratio-is-one-number-1',
    knowledgePointId: 'the-same-proportion-read-across-or-down',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is similar to triangle DEF, with AB = 8, BC = 14, DE = 20 and so EF = 35. '
      + 'Rearranging AB/DE = BC/EF gives AB/BC = DE/EF, a ratio taken inside each triangle rather '
      + 'than between them. Evaluate a/b - c/x at a = 8, b = 14, c = 20, x = 35 to compare the '
      + 'two. A difference of 0 says both triangles give the same number — and note that number '
      + 'is 4/7, not the scale factor 5/2: these are two different ratios measuring two different '
      + 'things, which is the confusion this point exists to separate.',
    given: 'a/b - c/x',
    variables: REAL_ABC_X,
    // 8/14 − 20/35 = 4/7 − 4/7 = 0. Guaranteed by the rearrangement before
    // either side is computed, which is why the equality is the content and the
    // arithmetic is only the instance.
    reference: '0',
    at: { a: '8', b: '14', c: '20', x: '35' },
  },
  {
    id: 'the-down-ratio-survives-scaling-1',
    knowledgePointId: 'the-same-proportion-read-across-or-down',
    kind: 'evaluate',
    prompt:
      'Scale DEF again, by a factor of 3: its sides DE = 20 and EF = 35 become 60 and 105. '
      + 'Evaluate (a*x)/(b*x) at a = 20, b = 35, x = 3. Getting 4/7 back — the same value the '
      + 'unscaled triangle gave — is the content: the factor cancels top and bottom, so a ratio '
      + 'of two sides of one figure cannot see how big the figure is. The scale factor has no such '
      + 'protection; it would have gone from 5/2 to 15/2. That is why a ratio of two sides is a '
      + 'function of the angles alone, and so why it can be tabulated against an angle at all.',
    given: '(a*x)/(b*x)',
    variables: REAL_ABX,
    // (20 × 3)/(35 × 3) = 60/105 = 4/7, which is 20/35 unchanged. The x cancels
    // for every non-zero x, so this is the invariance rather than one instance
    // of it.
    reference: '4/7',
    at: { a: '20', b: '35', x: '3' },
  },

  // ── pythagoras ──────────────────────────────────────────────────────────
  //
  // Six tasks, and the first in this subject that is not an `evaluate`.
  //
  // THE PROXY PROBLEM IS MILDER HERE THAN ANYWHERE ELSE IN THE SUBJECT, which
  // is worth saying after four blocks of apologia above. The four concepts
  // before this one are about correspondences and criteria, and neither is a
  // value, so their tasks all score arithmetic standing in for a reading. This
  // concept's content is a relation between three numbers, so most of it IS a
  // value and most of these tasks score the thing itself.
  //
  // What is still unscored is the slot assignment, and it is unscored in the
  // same way and for the same reason: which of three lengths is the hypotenuse
  // is a decision, not a value, and a learner who assigns it wrongly and then
  // computes correctly takes the mark. The first pair is built to make that
  // decision as visible as a task can — same two inputs, two different
  // expressions, two answers — but the choosing is still the learner's and the
  // ruling cannot see it. Named in both prompts, as everywhere else here.
  //
  // THE SURD TASK IS THE ONE REAL GAIN, and it was checked before the material
  // was written rather than hoped for. `transform_to_form` with `surd_reduced`
  // rules locally — `asSurd` in numerals.ts normalises both sides, so no CAS is
  // consulted — which keeps this subject's no-worker contract intact while
  // asking the second point's actual question. An `evaluate` could not have
  // asked it at all: `exactValue` returns null on √180, correctly, since there
  // is no exact rational to return.
  {
    id: 'the-leg-is-a-subtraction-1',
    knowledgePointId: 'the-hypotenuse-is-not-one-of-three-equals',
    kind: 'evaluate',
    prompt:
      'A right triangle has a hypotenuse of 25 and one leg of 7. Because the hypotenuse is the '
      + 'side that is KNOWN here, the relation is used in its subtracting direction: the missing '
      + 'leg is √(25² − 7²). Evaluate sqrt(b^2 - a^2) at a = 7, b = 25. Note which half of this '
      + 'task scores — the arithmetic, not the decision. That 25 goes in the b slot rather than '
      + 'the a slot is the whole content of the knowledge point, and it was handed to you in this '
      + 'prompt rather than left for you to get right. Compare your answer with '
      + 'the-same-two-numbers-the-other-way-1, which gives these two numbers the other roles.',
    given: 'sqrt(b^2 - a^2)',
    variables: REAL_AB,
    // 25² − 7² = 625 − 49 = 576, and √576 = 24 exactly, so 7, 24, 25. A perfect
    // square on purpose: this task is about the direction of the rearrangement,
    // and an irrational answer would have moved the difficulty to the root.
    reference: '24',
    at: { a: '7', b: '25' },
  },
  {
    id: 'the-same-two-numbers-the-other-way-1',
    knowledgePointId: 'the-hypotenuse-is-not-one-of-three-equals',
    kind: 'evaluate',
    prompt:
      'Same two numbers, 7 and 25, but now both of them are LEGS of a right triangle and the '
      + 'hypotenuse is what is missing. So the relation is used in its adding direction instead. '
      + 'Evaluate a^2 + b^2 at a = 7, b = 25 to get the square of that hypotenuse. Read the answer '
      + 'against the 576 that the-leg-is-a-subtraction-1 produced from the same two inputs: the '
      + 'gap between them is what one decision about which length is the hypotenuse is worth, and '
      + 'it is larger than the smaller of the two sides. This task stops at the square — taking '
      + 'the root is the next point, and this root is irrational.',
    given: 'a^2 + b^2',
    variables: REAL_AB,
    // 49 + 625 = 674, against 576 from the task above. 674 − 576 = 98 = 2 × 7².
    // The root is √674 = √(2 × 337) with 337 prime, so it does not reduce —
    // which is why this task asks for the square and the next point takes roots.
    reference: '674',
    at: { a: '7', b: '25' },
  },
  {
    id: 'reduce-the-hypotenuse-surd-1',
    knowledgePointId: 'a-length-is-the-positive-root-and-usually-a-surd',
    kind: 'transform_to_form',
    prompt:
      'A right triangle has legs 6 and 12, so the square of its hypotenuse is 36 + 144 = 180 and '
      + 'the hypotenuse itself is √180. Give that length exactly, with nothing left under the '
      + 'radical that need not be there — a whole number times a smaller root. A decimal is a '
      + 'rounding of this length rather than the length.',
    given: 'sqrt(180)',
    form: 'surd_reduced',
    variables: [],
    // 180 = 36 × 5 with 36 = 6², so 6√5, and 5 is square-free so nothing further
    // comes out. Ruled by `asSurd`'s normal form with no worker: correct for
    // 6*sqrt(5), incorrect for an unreduced sqrt(180), naming the square 36.
    //
    // Different numbers from `simplify-a-surd-1` in roots-and-irrationals
    // (1008 = 12√7) and from that concept's worked example (720 = 12√5), so
    // this is not a recall of either — and here the radicand was PRODUCED by
    // Pythagoras rather than handed over.
    reference: '6*sqrt(5)',
  },
  {
    id: 'the-rational-hypotenuse-is-the-exception-1',
    knowledgePointId: 'a-length-is-the-positive-root-and-usually-a-surd',
    kind: 'evaluate',
    prompt:
      'Change one leg: a right triangle with legs 9 and 12. Evaluate sqrt(a^2 + b^2) at a = 9, '
      + 'b = 12. The answer is a whole number, and that is the rare case rather than the normal '
      + 'one — it happens only when the two squares add to a square, which is what makes these '
      + 'three lengths a Pythagorean triple. Read it against reduce-the-hypotenuse-surd-1, where '
      + 'legs 6 and 12 gave 6√5: the same operation on a comparable pair of legs, and only one of '
      + 'the two answers can be written without a radical.',
    given: 'sqrt(a^2 + b^2)',
    variables: REAL_AB,
    // 81 + 144 = 225 = 15², so exactly 15 and the triangle is 9, 12, 15 — the
    // 3-4-5 triple scaled by three. Rational on purpose, as the counterpart to
    // the surd task above; `exactValue` settles it with no worker.
    reference: '15',
    at: { a: '9', b: '12' },
  },
  {
    id: 'the-converse-as-a-difference-1',
    knowledgePointId: 'the-converse-tests-a-triple-and-the-sign-grades-it',
    kind: 'evaluate',
    prompt:
      'Three lengths, 9, 40 and 41, and no figure. The largest is 41, so that is the only side a '
      + 'right angle could be opposite. Evaluate a^2 + b^2 - c^2 at a = 9, b = 40, c = 41. A '
      + 'difference of 0 says the two smaller squares add to exactly the largest, so there is a '
      + 'right angle opposite 41; anything else says there is not. Written as a difference rather '
      + 'than as an equation to check, because the next task needs its sign.',
    given: 'a^2 + b^2 - c^2',
    variables: REAL_ABC,
    // 81 + 1600 − 1681 = 0. A right triangle, and a Pythagorean triple.
    // Mis-slotted as 9² + 41² − 40² it gives 1762 − 1600 = 162 — correct
    // arithmetic, wrong verdict, which is the error the first point is about and
    // which no ruling here can distinguish from a genuine answer.
    reference: '0',
    at: { a: '9', b: '40', c: '41' },
  },
  {
    id: 'the-sign-says-obtuse-1',
    knowledgePointId: 'the-converse-tests-a-triple-and-the-sign-grades-it',
    kind: 'evaluate',
    prompt:
      'Now shorten the smallest length by one and leave the other two: 8, 40 and 41. Evaluate '
      + 'a^2 + b^2 - c^2 at a = 8, b = 40, c = 41. The same expression as '
      + 'the-converse-as-a-difference-1 and the SIGN of the answer is the ruling, not its size: '
      + 'zero would be a right angle, positive means the angle opposite 41 is acute, negative '
      + 'means it is obtuse. These three lengths still make a triangle — 8 + 40 exceeds 41 — so '
      + 'the triangle inequality admits them and this test is what tells you what kind of triangle '
      + 'they admit.',
    given: 'a^2 + b^2 - c^2',
    variables: REAL_ABC,
    // 64 + 1600 − 1681 = −17. Negative, so the smaller squares fall short and the
    // angle opposite 41 is obtuse. The same expression at a = 10 gives
    // 1700 − 1681 = +19 and an acute angle, which the worked example states but
    // no task asks — two of the three signs are enough to show it is the sign
    // that rules.
    reference: '-17',
    at: { a: '8', b: '40', c: '41' },
  },

  // ── quadrilaterals-and-polygons ─────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of
  // `quadrilaterals-and-polygons`. Exact rational arithmetic, no worker, as
  // everywhere else in this subject.
  //
  // THE PROXY PROBLEM IS MILDER HERE THAN IN ANY OF THE FIVE BLOCKS ABOVE,
  // and that is worth saying plainly rather than repeating an apology that no
  // longer fits. Two of the three points are about values. "How many sides"
  // IS a number, so the first task is the whole computation rather than a
  // stand-in for one. "Are the four angles equal" is a difference of two
  // numbers, so the fifth task REFUTES the equiangular reading arithmetically
  // — the gain `the-reversed-order-is-false-1` made for similarity, in a
  // second concept.
  //
  // What is still unscored is one decision, and it is the first subgoal of the
  // first worked example: which of the two totals to work in. A learner handed
  // "evaluate 360/(180 − x)" has been given that choice rather than asked to
  // make it, and no answer typed into this task can show they would have
  // chosen it. Named in the prompt, as in every block above.
  //
  // Two of these six echo expressions from earlier blocks and in both cases
  // the repetition is the content. `co-interior-across-the-parallel-pair-1` is
  // `180 - x`, the same expression as `co-interior-remainder-1` in the
  // transversal point, because a parallelogram's adjacent angles ARE that
  // co-interior pair — the same subtraction, now with the strip closed into a
  // figure. And the last pair is one expression at two inputs, exactly as
  // `isosceles-base-angles-1` and `the-equilateral-fixed-point-1` are: there
  // the fixed point was the equilateral triangle, here it is the square, and
  // the difference between the two cases is the whole third knowledge point.
  {
    id: 'exterior-angle-counts-the-sides-1',
    knowledgePointId: 'two-totals-and-only-one-grows-with-n',
    kind: 'evaluate',
    prompt:
      'A regular polygon has interior angles of 156°. Evaluate 360/(180 − x) at x = 156. The '
      + 'subtraction is the straight-line sum at one vertex, turning the interior angle there into '
      + 'the exterior angle; the division shares out the one total that does not depend on how '
      + 'many sides there are. Note which half of the problem this scores: the arithmetic, not the '
      + 'route. That the question is asked through the exterior angle rather than through '
      + '(n − 2) × 180 ÷ n is the content of the knowledge point, and this prompt has handed it to '
      + 'you already made.',
    given: '360/(180 - x)',
    variables: REAL_X,
    // 180 − 156 = 24 and 360/24 = 15, so a regular 15-gon. Checked the other
    // way in the worked example: (15 − 2) × 180 = 2340 and 2340/15 = 156.
    reference: '15',
    at: { x: '156' },
  },
  {
    id: 'the-exterior-total-never-moves-1',
    knowledgePointId: 'two-totals-and-only-one-grows-with-n',
    kind: 'evaluate',
    prompt:
      'The two angles at each vertex of a polygon lie along a straight line, so the n vertices '
      + 'contribute 180° each to the two totals TOGETHER: they come to n × 180 between them, and '
      + 'the interior total is (n − 2) × 180. Evaluate x*180 − (x − 2)*180 at x = 15 to get what '
      + 'is left over for the exterior angles. The answer is 360, and the point is that it would '
      + 'have been 360 for any x you were handed — the expression is identically 360, which is the '
      + 'whole reason one total grows with the number of sides and the other does not.',
    given: 'x*180 - (x - 2)*180',
    variables: REAL_X,
    // 15·180 − 13·180 = 2700 − 2340 = 360. Identically 360 for every x, since
    // the two multiples of 180 differ by 2 whatever x is — which is the claim,
    // and this evaluates one instance of it.
    reference: '360',
    at: { x: '15' },
  },
  {
    id: 'co-interior-across-the-parallel-pair-1',
    knowledgePointId: 'a-diagonal-makes-two-triangles-that-match',
    kind: 'evaluate',
    prompt:
      'ABCD is a parallelogram and the angle at A is 64°. AD and BC are parallel and AB crosses '
      + 'both of them, so the angles at A and at B are the co-interior pair and add to 180°. '
      + 'Evaluate 180 − x at x = 64 to get the angle at B. This is the one step of the worked '
      + 'example that produces a NUMBER — the congruence before it says which angles are equal to '
      + 'which and nothing about their size, and no answer typed here can show you read that '
      + 'correspondence the right way round. Compare co-interior-remainder-1 in the transversal '
      + 'point: the same subtraction on the same fact, before the strip was closed into a figure.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 64 = 116. The correspondence then spreads it: D = B = 116 and
    // C = A = 64, and 64 + 116 + 64 + 116 = 360 = (4 − 2) × 180.
    reference: '116',
    at: { x: '64' },
  },
  {
    id: 'the-four-angles-are-two-angles-twice-1',
    knowledgePointId: 'a-diagonal-makes-two-triangles-that-match',
    kind: 'evaluate',
    prompt:
      'The congruence makes a parallelogram\'s angles equal in opposite pairs, so the four of them '
      + 'are a, b, a and b. Evaluate 2a + 2b − 360 at a = 64, b = 116. A difference of 0 says '
      + 'those four close the quadrilateral — and the 360 is the first point\'s (n − 2) × 180 at '
      + 'n = 4, so this is the polygon total being used rather than a separate fact about '
      + 'quadrilaterals. It is NOT identically zero: it is zero exactly when b is 180 − a, which '
      + 'is what the co-interior pair gave, so a learner who used the wrong angle at B does not '
      + 'get a free 0 here.',
    given: '2*a + 2*b - 360',
    variables: REAL_AB,
    // 128 + 232 − 360 = 0. At b = 117 it is +2, so the task can fail — which
    // is what separates it from the identities elsewhere in this subject.
    reference: '0',
    at: { a: '64', b: '116' },
  },
  {
    id: 'equal-sides-left-the-angles-unequal-1',
    knowledgePointId: 'equal-sides-force-equal-angles-only-in-a-triangle',
    kind: 'evaluate',
    prompt:
      'ABCD is a rhombus — all four sides equal — with the angle at A equal to 64°, so its angles '
      + 'are 64°, 116°, 64°, 116°. Evaluate (180 − x) − x at x = 64 to compare two ADJACENT ones. '
      + 'Anything other than 0 says the four equal sides did not make the four angles equal, which '
      + 'is exactly what equal sides DO force in a triangle by the base-angle theorem. Read it '
      + 'against the-square-is-the-only-fixed-point-1, which is this same expression at the one '
      + 'value where the difference vanishes.',
    given: '(180 - x) - x',
    variables: REAL_X,
    // 116 − 64 = 52. Non-zero, so an equilateral quadrilateral need not be
    // equiangular — the refutation the third knowledge point is built on, and
    // a value rather than a reading, so the ruling scores the claim itself.
    reference: '52',
    at: { x: '64' },
  },
  {
    id: 'the-square-is-the-only-fixed-point-1',
    knowledgePointId: 'equal-sides-force-equal-angles-only-in-a-triangle',
    kind: 'evaluate',
    prompt:
      'The same expression, at x = 90. Evaluate (180 − x) − x at x = 90. Getting 0 is the content: '
      + '90° is the one angle a rhombus can have and be equal-angled as well as equal-sided, so '
      + 'the square is the single quadrilateral where those two claims coincide. Read it against '
      + 'the-equilateral-fixed-point-1 in congruence, which is the same kind of question with the '
      + 'opposite answer — there EVERY equal-sided triangle satisfies the matching condition, and '
      + 'here exactly one equal-sided quadrilateral does.',
    given: '(180 - x) - x',
    variables: REAL_X,
    // 90 − 90 = 0, and it is the only root of 180 − 2x, so the square is the
    // only equiangular rhombus. At 64 the same expression is 52, which is the
    // task above — one expression, two inputs, two verdicts.
    reference: '0',
    at: { x: '90' },
  },

  // ── area-and-perimeter ──────────────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of
  // `area-and-perimeter`. Exact rational arithmetic, no worker, as everywhere
  // else in this subject.
  //
  // THE PROXY PROBLEM DOES NOT ARISE HERE, which is the first time that can be
  // said in this file and is a property of the concept rather than of the asks.
  // Both of the concept's measures are numbers: "how much is left" is a value,
  // "how far round" is a value, and the claim the third point is built on — that
  // neither decides the other — is settled by comparing two of them. So every
  // one of these six asks what its knowledge point is about. The one step that
  // stays unscored is small and is the first subgoal of the first example:
  // which of the two measures the question wants. A learner handed
  // "evaluate a*b − c*d" has been told it is an area. Named in the prompts.
  //
  // Two of the six echo expressions from earlier blocks and in both cases the
  // repetition is the content, which is this subject's habit by now.
  // `the-notch-cancels-out-of-the-corner-perimeter-1` is identically 2(a + b),
  // so it answers 32 for a corner piece of any size — the shape of
  // `the-exterior-total-never-moves-1` in a second concept. And
  // `equal-perimeters-left-the-areas-unequal-1` is `a*b - c*d`, the same
  // expression as the first task below, doing the opposite job: there it is one
  // region's area and here it is the difference between two areas whose
  // perimeters are equal, so anything other than 0 refutes "equal round means
  // equal inside". That is the arithmetic refutation
  // `equal-sides-left-the-angles-unequal-1` made for the polygons, in a third
  // concept.
  {
    id: 'the-cut-is-a-subtraction-1',
    knowledgePointId: 'additivity-turns-a-cut-into-a-subtraction',
    kind: 'evaluate',
    prompt:
      'A rectangular sheet 10 cm by 6 cm has a rectangular piece 4 cm by 3 cm cut out of it. '
      + 'Evaluate a*b − c*d at a = 10, b = 6, c = 4, d = 3 to get the area of what is left, in '
      + 'square centimetres. The first product is the sheet and the second is the piece, and the '
      + 'subtraction is additivity read backwards: the piece and the remainder add to the whole, '
      + 'so the remainder is the whole less the piece. Note what the expression does NOT contain, '
      + 'which is the content of the point — nothing in it says where on the sheet the piece was '
      + 'cut from. Note also which half of the problem this scores: that the answer wanted is an '
      + 'area rather than a perimeter is the first decision in the problem, and this prompt has '
      + 'handed it to you already made.',
    given: 'a*b - c*d',
    variables: REAL_ABCD,
    // 60 − 12 = 48. Checked the other way in the worked example and in the
    // task below: the same region assembled out of its two rectangles, 36 + 12.
    reference: '48',
    at: { a: '10', b: '6', c: '4', d: '3' },
  },
  {
    id: 'additivity-forwards-gives-the-same-area-1',
    knowledgePointId: 'additivity-turns-a-cut-into-a-subtraction',
    kind: 'evaluate',
    prompt:
      'The same cut sheet as the task above, if the piece came out of a corner: it is then two '
      + 'rectangles, one 6 cm by 6 cm and one 4 cm by 3 cm. Evaluate a*b + c*d at a = 6, b = 6, '
      + 'c = 4, d = 3 to get its area by assembling it instead of cutting it. Getting 48 again is '
      + 'the point rather than the arithmetic: additivity read forwards adds the pieces of a '
      + 'region and read backwards turns a removal into a subtraction, and the two routes have to '
      + 'agree or it is not a measure. Read it against the-cut-is-a-subtraction-1, which is the '
      + 'same region by the other route.',
    given: 'a*b + c*d',
    variables: REAL_ABCD,
    // 36 + 12 = 48, the same number the subtraction above gives. The split is
    // the honest one for a corner cut: cutting the remainder vertically 6 cm
    // from the uncut side leaves a full-height 6 by 6 and a 4 by 3 beside it.
    reference: '48',
    at: { a: '6', b: '6', c: '4', d: '3' },
  },
  {
    id: 'halve-the-matched-pair-1',
    knowledgePointId: 'a-height-belongs-to-one-base-and-is-usually-no-side',
    kind: 'evaluate',
    prompt:
      'A triangle has sides 13 cm, 14 cm and 15 cm, and the perpendicular height to the 14 cm '
      + 'side is 12 cm. Evaluate a*b/2 at a = 14, b = 12 to get its area in square centimetres. '
      + 'The two inputs are the matched pair — a base and the height belonging to THAT base — and '
      + 'the 13 and the 15 are not in the expression at all. The halving is the step taken as '
      + 'given: two copies of the triangle make a parallelogram on the same base and height. What '
      + 'this scores is the arithmetic and not the pairing: a learner who takes 13 as the height '
      + 'and evaluates the same expression gets 91 and is wrong, but nothing typed here shows '
      + 'which of the four given lengths you believed belonged together.',
    given: 'a*b/2',
    variables: REAL_AB,
    // 14 · 12 / 2 = 84. Heron on 13, 14, 15: s = 21 and
    // √(21 · 8 · 7 · 6) = √7056 = 84, so the height is really 2 · 84 / 14 = 12.
    reference: '84',
    at: { a: '14', b: '12' },
  },
  {
    id: 'the-same-area-off-a-second-base-1',
    knowledgePointId: 'a-height-belongs-to-one-base-and-is-usually-no-side',
    kind: 'evaluate',
    prompt:
      'The same triangle on a different base. Evaluate a*b/2 at a = 13, b = 168/13 — the 13 cm '
      + 'side, with the height belonging to it. Getting 84 again is the content: the area is a '
      + 'property of the triangle and the three matched pairs are three ways of reading off one '
      + 'number, not three measurements. The height is a fraction and does not need to be '
      + 'anything else; it is also less than both 14 and 15, as the shortest-route fact requires. '
      + 'Read it against halve-the-matched-pair-1, which is the same expression at the other pair.',
    given: 'a*b/2',
    variables: REAL_AB,
    // 13 · (168/13) / 2 = 168/2 = 84. Exact, and deliberately not an integer
    // height: ½ · 13 · h = 84 forces h = 168/13 ≈ 12.92.
    reference: '84',
    at: { a: '13', b: '168/13' },
  },
  {
    id: 'the-notch-cancels-out-of-the-corner-perimeter-1',
    knowledgePointId: 'neither-measure-decides-the-other',
    kind: 'evaluate',
    prompt:
      'A 10 cm by 6 cm sheet has a 4 cm by 3 cm piece cut out of one CORNER. Walking the boundary '
      + 'of what is left gives (a − c) + (b − d) + c + d + a + b: the two outer edges shortened by '
      + 'the cut, then the notch\'s two new edges, then the two edges it did not touch. Evaluate '
      + 'it at a = 10, b = 6, c = 4, d = 3. The answer is 32, which is the perimeter of the UNCUT '
      + 'sheet — and the point is that it would have been 2(a + b) for a corner piece of any size, '
      + 'since the c and the d cancel. A cut that removes area and leaves the perimeter alone is '
      + 'half of the reason neither measure decides the other.',
    given: '(a - c) + (b - d) + c + d + a + b',
    variables: REAL_ABCD,
    // 6 + 3 + 4 + 3 + 10 + 6 = 32, and the expression is identically 2(a + b),
    // which is the claim rather than a coincidence of these four numbers. The
    // same piece taken from the middle of a 10 cm edge gives 38, because both
    // of its 3 cm sides are added with nothing removed to pay for them.
    reference: '32',
    at: { a: '10', b: '6', c: '4', d: '3' },
  },
  {
    id: 'equal-perimeters-left-the-areas-unequal-1',
    knowledgePointId: 'neither-measure-decides-the-other',
    kind: 'evaluate',
    prompt:
      'A 10 cm by 6 cm rectangle and a 15 cm by 1 cm rectangle both have perimeter 32 cm, since '
      + '2 × (10 + 6) = 2 × (15 + 1). Evaluate a*b − c*d at a = 10, b = 6, c = 15, d = 1 to '
      + 'compare their areas. Anything other than 0 says equal perimeters did not make the areas '
      + 'equal, which is the other direction of the third point — the first is two regions of '
      + 'equal area whose perimeters differ. Read it against the-cut-is-a-subtraction-1, which is '
      + 'this same expression measuring one region rather than the gap between two.',
    given: 'a*b - c*d',
    variables: REAL_ABCD,
    // 60 − 15 = 45. Non-zero, so a perimeter does not decide an area — a value
    // rather than a reading, so the ruling scores the claim itself. It is NOT
    // identically non-zero: at c = 12, d = 5 it is 0, two rectangles of equal
    // area, so a learner cannot score this by typing any number at all.
    reference: '45',
    at: { a: '10', b: '6', c: '15', d: '1' },
  },

  // ── geometric-proof ─────────────────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `geometric-proof`.
  // Exact rational arithmetic, no worker, as everywhere else in this subject.
  //
  // THIS BLOCK IS THE ANSWER TO AN OBJECTION, AND THE OBJECTION IS WHY THE
  // CONCEPT WAS TWICE LEFT ON THE MAP. `justify` is the natural kind for a node
  // about proof; it is declared unverifiable in types.ts; the suite refuses to
  // ship any unverifiable kind; so a justify-only concept has no tasks at all,
  // and a knowledge point with no task is a chain that cannot become evidence.
  // Three of those was correctly judged worse than leaving the node mapped.
  // ontology-geometry.ts argues the way out at length — the figure-free part of
  // a proof node is the part that is a CLAIM ABOUT CLAIMS, and a claim about
  // claims is refuted by a value — and these six are what that produces.
  //
  // THE PROXY PROBLEM IS THE WIDEST IN THE SUBJECT IN ONE PLACE AND NARROWEST
  // IN ANOTHER, which is unusual enough to be worth the paragraph.
  //
  // Widest in the first point. What that point teaches is the ORDER of three
  // citations, and an order is not a value — so the task hands over the composed
  // expression and scores the arithmetic of a chain the learner did not have to
  // build. That is the congruence block's correspondence problem in a second
  // form, and it is named in both prompts. What makes it better than that
  // precedent is that the composite form is itself the content: the given is
  // written as 180 − 2*(180 − x) rather than as the equivalent 2x − 180, so the
  // expression a learner reads is the three cited facts in the order they were
  // cited, and the simplification is the theorem the chain proves.
  //
  // Narrowest in the second and third. "A difference of 0 licenses nothing and a
  // difference of 1 proves non-congruence" is a statement about two values, and
  // the values are the whole claim rather than a stand-in for it; the same goes
  // for an angle sum that disqualifies a proposed counterexample. Those four
  // tasks score what their points are about with nothing held back.
  //
  // `counterexample` is the kind the third point really wants and it carries no
  // tasks anywhere in the build, for the reason at the top of this file. So the
  // refutation is asked as the two values it reduces to. That is the one real
  // gap in this block and the concept's third objective says so rather than
  // naming a kind it cannot serve.
  //
  // Two of the six echo expressions from earlier blocks, which is this subject's
  // habit by now, and in both cases the repetition is the content.
  // `one-acute-exterior-angle-ends-the-claim-1` is `180 - x`, the same
  // expression as `co-interior-remainder-1` and
  // `co-interior-across-the-parallel-pair-1` — the straight-line subtraction,
  // here deciding a universal claim rather than filling in a figure. And
  // `a-candidate-that-is-not-a-triangle-refutes-nothing-1` is
  // `(a + b + c) - 180`, the same expression as `the-third-angle-was-never-
  // free-1` in `congruence`, doing the opposite job: there it is identically 0
  // and that makes a point about criteria, here it is non-zero and that
  // disqualifies an object from being a counterexample at all.
  {
    id: 'chain-the-three-cited-facts-1',
    knowledgePointId: 'a-proof-cites-facts-already-established',
    kind: 'evaluate',
    prompt:
      'In triangle ABC, AB = AC. CB is extended beyond B to D, and the angle ABD is 140°. '
      + 'Evaluate 180 − 2*(180 − x) at x = 140 to get the angle at A. The expression is the proof '
      + 'written out: the inner subtraction is the straight line turning the given exterior angle '
      + 'into the interior angle at B, the doubling is the base-angle theorem making the angle at '
      + 'C equal to it, and the outer subtraction is the angle sum closing the triangle. It is '
      + 'deliberately NOT written as the equivalent 2x − 180, because that form is the theorem and '
      + 'this form is the argument. Note which half of the problem this scores: the arithmetic, '
      + 'not the order. That those three facts are the ones to cite, and in that sequence, is the '
      + 'content of the knowledge point, and this prompt has handed it to you already assembled.',
    given: '180 - 2*(180 - x)',
    variables: REAL_X,
    // 180 − 140 = 40 at B, so 40 at C by the base angles, and
    // 180 − 40 − 40 = 100 at A. Checked the other way: the simplified form
    // 2x − 180 at x = 140 is 280 − 180 = 100. The expression is an angle of a
    // real triangle only for x > 90 — at x = 90 it returns 0 — which is the
    // chain stating its own hypothesis.
    reference: '100',
    at: { x: '140' },
  },
  {
    id: 'the-same-chain-from-a-second-exterior-angle-1',
    knowledgePointId: 'a-proof-cites-facts-already-established',
    kind: 'evaluate',
    prompt:
      'The same triangle and the same chain, with the exterior angle at B given as 110° instead. '
      + 'Evaluate 180 − 2*(180 − x) at x = 110. Getting a different answer from the task above is '
      + 'the point rather than the arithmetic: nothing in the chain was rebuilt, so the '
      + 'conclusion was forced by the citations and not by the first set of numbers — which is '
      + 'what makes it a proof about every triangle with those givens rather than a measurement '
      + 'of one. Read it against chain-the-three-cited-facts-1, which is the same expression at '
      + 'the other input.',
    given: '180 - 2*(180 - x)',
    variables: REAL_X,
    // 180 − 110 = 70 at B and at C, and 180 − 70 − 70 = 40 at A, so
    // 40 + 70 + 70 = 180. The simplified form 2x − 180 at x = 110 is also 40.
    reference: '40',
    at: { x: '110' },
  },
  {
    id: 'the-equal-total-settles-nothing-1',
    knowledgePointId: 'a-converse-is-a-new-claim-and-a-contrapositive-is-not',
    kind: 'evaluate',
    prompt:
      'It is proved that congruent triangles have equal perimeters. Triangle ABC has sides 5 cm, '
      + '9 cm and 10 cm, and triangle PQR has 6 cm, 8 cm and 10 cm. Evaluate '
      + '(a + b + c) − (d + e + f) at a = 5, b = 9, c = 10, d = 6, e = 8, f = 10 to compare their '
      + 'perimeters. A difference of 0 is the CONVERSE\'s hypothesis holding, and the converse is '
      + 'not the proved statement — so 0 is precisely the value that licenses nothing. These two '
      + 'are in fact not congruent, since a congruence would make all three sides match and '
      + '{5, 9, 10} is not {6, 8, 10}. Read it against the-unequal-total-settles-it-1, which is '
      + 'the same expression returning a verdict instead of a shrug.',
    given: '(a + b + c) - (d + e + f)',
    variables: REAL_ABCDEF,
    // 24 − 24 = 0. Both triples close: 5 + 9 = 14 > 10 and 6 + 8 = 14 > 10, so
    // both are real triangles and the pair is a genuine counterexample to the
    // converse rather than an arithmetic trick.
    reference: '0',
    at: { a: '5', b: '9', c: '10', d: '6', e: '8', f: '10' },
  },
  {
    id: 'the-unequal-total-settles-it-1',
    knowledgePointId: 'a-converse-is-a-new-claim-and-a-contrapositive-is-not',
    kind: 'evaluate',
    prompt:
      'The same proved statement, on triangle PQR with sides 6 cm, 8 cm and 10 cm against '
      + 'triangle XYZ with 6 cm, 8 cm and 11 cm. Evaluate (a + b + c) − (d + e + f) at a = 6, '
      + 'b = 8, c = 10, d = 6, e = 8, f = 11. Anything other than 0 proves these two are not '
      + 'congruent, and that conclusion is the CONTRAPOSITIVE — the proved statement rearranged, '
      + 'with nothing new proved to get it. One expression, two inputs, and the difference '
      + 'between the two verdicts is the whole knowledge point: a converse has to be earned and a '
      + 'contrapositive comes free.',
    given: '(a + b + c) - (d + e + f)',
    variables: REAL_ABCDEF,
    // 24 − 25 = −1. Non-zero, so not congruent, by the contrapositive alone.
    // Both triples close: 6 + 8 = 14 exceeds 10 and 11 alike. The sign carries
    // no meaning here beyond "not equal", which is why the task is a difference
    // rather than a comparison.
    reference: '-1',
    at: { a: '6', b: '8', c: '10', d: '6', e: '8', f: '11' },
  },
  {
    id: 'one-acute-exterior-angle-ends-the-claim-1',
    knowledgePointId: 'one-counterexample-settles-it-if-it-meets-the-hypothesis',
    kind: 'evaluate',
    prompt:
      'Somebody claims that every exterior angle of a triangle is obtuse. Take the triangle with '
      + 'angles 100°, 40° and 40°, and evaluate 180 − x at x = 100 to get the exterior angle at '
      + 'its largest vertex. An answer below 90 refutes the claim outright, because the claim was '
      + 'made of EVERY exterior angle and one failure is enough. The other two vertices of this '
      + 'same triangle give 140° each, both obtuse, and they add nothing at all — a universal '
      + 'claim is not partly true once it has failed once, and that asymmetry between refuting '
      + 'and confirming is why proof exists. Compare co-interior-remainder-1: the same '
      + 'subtraction, there filling in a figure and here deciding a claim.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 100 = 80, acute, so the claim is false. The triangle is real:
    // 100 + 40 + 40 = 180. The repaired claim — at most one exterior angle is
    // not obtuse — holds, since at most one of a triangle's angles is 90° or
    // more, which is `at-most-one-angle-is-not-acute` in triangle-basics.
    reference: '80',
    at: { x: '100' },
  },
  {
    id: 'a-candidate-that-is-not-a-triangle-refutes-nothing-1',
    knowledgePointId: 'one-counterexample-settles-it-if-it-meets-the-hypothesis',
    kind: 'evaluate',
    prompt:
      'A second candidate is offered against the same claim: angles of 100°, 50° and 40°, whose '
      + 'exterior angle at the first vertex is also 80°. Evaluate (a + b + c) − 180 at a = 100, '
      + 'b = 50, c = 40 BEFORE using it. Anything other than 0 says the three angles do not close '
      + 'a triangle, so no such triangle exists and it cannot refute a claim about triangles '
      + 'however its arithmetic comes out. This is the better of the two tasks on this point: the '
      + 'object looks like a counterexample and produces the same 80° as the real one. Read it '
      + 'against the-third-angle-was-never-free-1 in congruence, which is this expression '
      + 'identically 0 for any genuine triangle — there the 0 makes a point about criteria, here '
      + 'the non-zero disqualifies an object from being evidence.',
    given: '(a + b + c) - 180',
    variables: REAL_ABC,
    // 190 − 180 = 10. Non-zero, so the candidate fails the claim's hypothesis
    // and refutes nothing. The task is the hypothesis check rather than the
    // refutation, which is the order the knowledge point insists on.
    reference: '10',
    at: { a: '100', b: '50', c: '40' },
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
  // Twelve tasks, all exactly rulable: three on the plane the components are
  // read off, then nine on components. Two vector pairs run through the
  // component half of the subject — u = (2,-1) with v = (1,3) independent, and
  // u with w = (6,-3) dependent — so the same numbers answer "is it in the
  // span", "is it independent" and "what does it cost", and a learner can see
  // the cross-check give 7 and then 0 on pairs they already know the shape of.
  //
  // The three plane tasks do the same thing one level down, with two points
  // reused throughout: P = (-4, 7) and Q = (2, 7) answer "which quadrant" and
  // "how far apart" in turn, and their shared second coordinate is the whole
  // point of the second question. The first task uses (3, 5) and (5, 3)
  // instead, because what it is about is the swap.
  {
    id: 'ordered-pair-1',
    knowledgePointId: 'a-point-is-an-ordered-pair',
    kind: 'evaluate',
    prompt:
      'P = (3, 5) and Q = (5, 3). Evaluate the difference of their FIRST coordinates. Points are ' +
      'equal only when both coordinates agree, so one disagreement is enough to tell them apart.',
    given: 'p1 - q1',
    variables: POINT_PQ,
    at: { p1: '3', q1: '5' },
    // 3 - 5 = -2. Negative rather than positive because P is the left-hand
    // point; the sign is not incidental here, it is the next task but one.
    reference: '-2',
  },
  {
    id: 'quadrant-signs-1',
    knowledgePointId: 'the-signs-name-the-quadrant',
    kind: 'evaluate',
    prompt:
      'P = (-4, 7). Evaluate the product of its coordinates. A negative product means the two ' +
      'coordinates have opposite signs, which leaves quadrants II and IV — and the positive ' +
      'second coordinate then picks II.',
    // A proxy, named as one, the same way `span-line-1` below is: the question
    // is "which quadrant" and the answer to that is not a number. The product
    // is the step that halves it and is exactly checkable; the prompt carries
    // the half the arithmetic cannot settle, rather than pretending -28 is the
    // quadrant.
    given: 'p1 * p2',
    variables: POINT_PQ,
    at: { p1: '-4', p2: '7' },
    reference: '-28',
  },
  {
    id: 'coordinate-separation-1',
    knowledgePointId: 'separation-is-one-axis-at-a-time',
    kind: 'evaluate',
    prompt:
      'P = (-4, 7) and Q = (2, 7). Find the horizontal separation by evaluating the first ' +
      'coordinate of Q minus the first coordinate of P. The vertical difference is 7 - 7 = 0, so ' +
      'the points are the same height and this one number is the whole distance.',
    given: 'q1 - p1',
    variables: POINT_PQ,
    at: { q1: '2', p1: '-4' },
    // 2 - (-4) = 6. Subtracting across zero is the arithmetic this task is
    // really drilling, which is why the pair straddles the axis.
    reference: '6',
  },
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
 * Whether a concept has an actual problem behind it, which is NOT `isTeachable`.
 *
 * ── The overstatement this exists to stop ─────────────────────────────────
 *
 * `isTeachable` means "has at least one knowledge point", and every surface in
 * the app reported it as the number of concepts that "have problems written
 * for them". For most concepts those coincide. For three they did not:
 * `logarithm-definition`, `logarithm-rules` and `solving-exponential-equations`
 * each carried knowledge points and ZERO tasks, so they were counted in the
 * figure while offering nothing to do.
 *
 * Found by authoring — the honest question "which concept should get problems
 * next" turned up three that already claimed to have them.
 *
 * ── The diagnosis was wrong in a way worth recording ──────────────────────
 *
 * This comment used to end: "the pattern is not random either: they are the
 * concepts whose natural task is *solving* or *stating*, and the engine has no
 * verifiable kind for either. So the gap will recur." The observation was
 * right and the cause was not. What actually blocked them was one line in
 * numerals.ts: `exactValue` returned null for every `log`, so `ruleEvaluate`
 * could not recompute an authored task's own answer and would have graded
 * learners against an unvouched reference. The fix was `exactLog`, not a new
 * task kind, and all three are practisable now.
 *
 * So this function currently excludes nothing — and stays, because the state
 * it names is reachable the moment anybody writes material before problems,
 * which is the normal order of authoring. A count that silently re-widened
 * would be the original defect returning.
 *
 * The *kind* gap is real and narrower than it looked: it costs
 * `log-argument-is-positive` its task, since "this expression is undefined" is
 * not a value `evaluate` can ask for. A knowledge point, not a concept.
 *
 * This is the same discipline as `atlasCoverage` printing how little is
 * written, `notLoadedNotice` saying the librarian knows nothing rather than
 * that there is nothing, and `unwrittenOnPath` counting the gaps a journey
 * crosses. One number per claim, and no claim wider than its evidence.
 *
 * `isTeachable` is NOT redefined. It gates introduction and must keep meaning
 * "there is material here", which is the right question for the scheduler —
 * a concept with knowledge points and no tasks still has something to read.
 * This is the question for a DISPLAY: can they go and do it.
 */
export function isPractisable(o: ConceptOntology, conceptId: string): boolean {
  const c = o.concepts.find(x => x.id === conceptId)
  if (!c) return false
  return c.knowledgePoints.some(p => TASKS.some(t => t.knowledgePointId === p.id))
}

/** Concepts with at least one real problem, for a coverage figure. */
export function practisableConcepts(o: ConceptOntology): string[] {
  return o.concepts.filter(c => isPractisable(o, c.id)).map(c => c.id)
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
