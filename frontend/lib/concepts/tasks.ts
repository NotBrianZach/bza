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
