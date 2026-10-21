/**
 * Practice tasks as generators, not instances.
 *
 * ── The requirement this exists to meet ───────────────────────────────────
 *
 * SPEC-LEARNING.md §5 specifies a `variant_seed` that "makes a fresh instance of
 * the same task reproducible", and §7 requires that an independent re-attempt be
 * "a *different instance of the same objective*, not the same numbers again".
 * Neither was implementable against tasks.ts, which ships hand-authored
 * instances with the numbers baked in: a learner who retried `factor-monic-1`
 * got x² − 2x − 15 for the second time, which measures recall of an answer
 * rather than of a method.
 *
 * ── Author the answer, then invert ────────────────────────────────────────
 *
 * Every generator here picks the *answer* first and manufactures the problem
 * from it. To make a partial-fractions problem, pick A, B and two distinct
 * linear factors — the answer is `A/(x−p) + B/(x−q)` — then combine them to get
 * the thing the learner is handed. The reference is therefore correct **by
 * construction** rather than by hand-checked arithmetic, which removes the entire
 * class of fault that `ruleEvaluate`'s re-derivation check was added to catch.
 *
 * ontology.ts already noted that two of its concept pairs are deliberate inverses
 * ("the inverse pair is the cheapest way to show a learner that a form is a
 * choice rather than a fact"). That was a pedagogical observation; here it is the
 * generation mechanism. `combine-two` and `decompose-distinct` draw the *same*
 * numbers and swap which side is the question.
 *
 * ── Why a generated instance can be trusted without a CAS ─────────────────
 *
 * Nothing is taken on faith. `validateInstance` re-checks every instance before
 * it can be served:
 *
 *   - both sides parse under the task's own declarations
 *   - the reference satisfies the form the task demands
 *   - the *given* does NOT satisfy it, so the task requires work. A generator
 *     that drew a degenerate instance — a quadratic that was already factored, a
 *     fraction with nothing to cancel — is rejected rather than served.
 *   - given and reference agree at enough exact rational points to be the same
 *     function. Not a spot check: see `agreeAtPoints` in numerals.ts. A nonzero
 *     polynomial of degree d has at most d roots, so agreement at d+1 non-pole
 *     points is conclusive, and every generator declares the degree bound that
 *     makes it so.
 *
 * A draw that fails any of these returns null and the next seed is tried. The
 * test suite sweeps hundreds of seeds per generator and asserts that every
 * instance which *is* produced passes all of it.
 *
 * ── Statelessness, which the verify route depends on ──────────────────────
 *
 * A generated task's id is `<generatorId>@<seed>` and that is the whole of its
 * storage. `POST /api/learn/verify` looks a submission up by id, so a generated
 * task has to be reconstructible from its id alone, by anyone, later, with no
 * row anywhere. That is why the PRNG is seeded and deterministic and why
 * `Math.random` appears nowhere in this file: the seed *is* the instance, and a
 * single non-determinism would make a learner's submission unrulable.
 */

import { parseExpression, symbolsIn, tryParse, type ExprNode } from './expr'
import { checkDenominatorDegree, checkForm } from './forms'
import { agreeAtPoints, exactValue, sameValue, substitute } from './numerals'
import { isVerifiableKind } from './registry'
import type { NamedForm, PracticeTask, TaskKind, VariableDeclaration } from './types'

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

export interface Rng {
  /** Inclusive on both ends. */
  int(min: number, max: number): number
  /** A magnitude in [min, max] with a random sign, never zero. */
  nonZero(min: number, max: number): number
  pick<T>(items: readonly T[]): T
}

/**
 * mulberry32 — small, fast, and good enough for picking coefficients.
 *
 * Explicitly not a cryptographic generator and not trying to be; what matters is
 * that the same seed yields the same instance on every machine and every
 * release, which rules out `Math.random` and anything that reads a clock.
 */
export function rngFrom(seed: number): Rng {
  let a = (seed >>> 0) || 0x9e3779b9
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  return {
    int,
    nonZero: (min, max) => int(Math.max(1, min), max) * (next() < 0.5 ? -1 : 1),
    pick: items => items[int(0, items.length - 1)],
  }
}

/**
 * Fold a point id and an attempt count into a seed.
 *
 * FNV-1a over the id, mixed with the counters. The attempt count is in here
 * because it is what makes §7 true: a learner's second attempt at a point has a
 * different count, so it draws a different instance, deterministically and with
 * no extra storage — the counters are already in the strength table.
 */
export function variantSeedFor(base: number, pointId: string, attempts: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < pointId.length; i += 1) {
    h ^= pointId.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= Math.imul(base >>> 0, 0x85ebca6b)
  h = Math.imul(h ^ attempts, 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

// ---------------------------------------------------------------------------
// Rendering restricted infix
// ---------------------------------------------------------------------------

/**
 * A polynomial from its coefficients, highest power first.
 *
 * Hand-rendered rather than built as a tree and printed with `renderExpr`,
 * because `renderExpr` parenthesises for safety and a learner should be shown
 * `2x^2 + 7x - 4`, not its fully-bracketed equivalent. The risk that comes with
 * hand-rendering — a sign or an omitted coefficient wrong — is exactly what
 * `validateInstance` re-checks by parsing the result back and comparing values,
 * so a formatting bug fails the instance instead of reaching a learner.
 */
export function polynomial(coefficients: number[], v = 'x'): string {
  const degree = coefficients.length - 1
  let out = ''
  coefficients.forEach((c, i) => {
    if (c === 0) return
    const power = degree - i
    const magnitude = Math.abs(c)
    const body =
      power === 0 ? `${magnitude}`
      : power === 1 ? (magnitude === 1 ? v : `${magnitude}${v}`)
      : (magnitude === 1 ? `${v}^${power}` : `${magnitude}${v}^${power}`)
    if (out === '') out = c < 0 ? `-${body}` : body
    else out += c < 0 ? ` - ${body}` : ` + ${body}`
  })
  return out === '' ? '0' : out
}

export const linear = (a: number, b: number, v = 'x') => polynomial([a, b], v)
export const bracket = (s: string) => `(${s})`
/** `(x - 3)`, from the root. The form a factored answer is written in. */
export const factorFor = (root: number, v = 'x') => bracket(linear(1, -root, v))

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) { const t = x % y; x = y; y = t }
  return x || 1
}

/** A reduced fraction as restricted infix: `5`, `-1/8`, `2/3`. */
export function fraction(numerator: number, denominator: number): string {
  if (denominator === 0) throw new Error('fraction with a zero denominator')
  const sign = (numerator < 0) !== (denominator < 0) ? -1 : 1
  const n = Math.abs(numerator)
  const d = Math.abs(denominator)
  const g = gcd(n, d)
  const top = n / g
  const bottom = d / g
  const body = bottom === 1 ? `${top}` : `${top}/${bottom}`
  return sign < 0 ? `-${body}` : body
}

/** Append `+ k/(…)` or `- k/(…)`, with the sign carried onto the operator. */
function plusFraction(head: string, k: number, denominator: string): string {
  if (k === 0) return head
  return `${head} ${k < 0 ? '-' : '+'} ${Math.abs(k)}/${denominator}`
}

/**
 * A sum of constant-over-factor terms, with signs on the operators.
 *
 * The naive `${A}/${d1} + ${B}/${d2}` renders a negative numerator as
 * `-3/(x + 1) + -3/(x - 9)`, which parses and is arithmetically right and is not
 * how anybody writes it. Since this string is literally the problem a learner
 * reads — and, for the inverse generator, the answer they are shown — the sign
 * belongs on the operator.
 */
export function sumOfFractions(terms: { numerator: number; denominator: string }[]): string {
  let out = ''
  for (const { numerator, denominator } of terms) {
    if (numerator === 0) continue
    const magnitude = `${Math.abs(numerator)}/${denominator}`
    if (out === '') out = numerator < 0 ? `-${magnitude}` : magnitude
    else out += numerator < 0 ? ` - ${magnitude}` : ` + ${magnitude}`
  }
  return out === '' ? '0' : out
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

export interface GeneratedSpec {
  prompt: string
  given: string
  reference: string
  form?: NamedForm
  maxDenominatorDegree?: number
  variables: VariableDeclaration[]
  domainConditions?: string[]
  at?: Record<string, string>
  /**
   * An upper bound on the degree of the numerator of `given - reference`.
   *
   * Declared by the generator because only the generator knows it — it built
   * both sides. This is what upgrades the point-agreement check from a sample to
   * a proof, so it must be an honest *upper* bound; too low and the check stops
   * being conclusive.
   */
  degreeBound: number
}

export interface TaskGenerator {
  id: string
  knowledgePointId: string
  kind: TaskKind
  /** What varies between instances, for review and for the UI. */
  varies: string
  /** Null when the draw was degenerate. The caller tries the next seed. */
  build(rng: Rng): GeneratedSpec | null
}

const REAL_X: VariableDeclaration[] = [{ name: 'x', assumptions: { real: true } }]
const REAL_ABC: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/** Distinct nonzero roots, or null if the draw collided. */
function twoRoots(rng: Rng, span = 9): [number, number] | null {
  const p = rng.nonZero(1, span)
  const q = rng.nonZero(1, span)
  return p === q ? null : [p, q]
}

export const GENERATORS: TaskGenerator[] = [
  // ── polynomial-arithmetic ───────────────────────────────────────────────
  {
    id: 'gen-expand-binomials',
    knowledgePointId: 'expand-binomials',
    kind: 'transform_to_form',
    varies: 'both binomials, including a non-unit leading coefficient',
    build(rng) {
      const a = rng.int(1, 3)
      const b = rng.nonZero(1, 9)
      const c = rng.int(1, 2)
      const d = rng.nonZero(1, 9)
      return {
        prompt: 'Expand and collect like terms.',
        given: `${bracket(linear(a, b))}${bracket(linear(c, d))}`,
        reference: polynomial([a * c, a * d + b * c, b * d]),
        form: 'expanded',
        variables: REAL_X,
        degreeBound: 2,
      }
    },
  },
  {
    id: 'gen-add-polynomials',
    knowledgePointId: 'add-polynomials',
    kind: 'transform_to_form',
    varies: 'the coefficients of both quadratics',
    build(rng) {
      const first = [rng.int(1, 4), rng.nonZero(1, 7), rng.nonZero(1, 9)]
      const second = [rng.int(1, 4), rng.nonZero(1, 7), rng.nonZero(1, 9)]
      const sum = [first[0] + second[0], first[1] + second[1], first[2] + second[2]]
      // An all-zero sum is arithmetically fine and pedagogically empty.
      if (sum.every(c => c === 0)) return null
      return {
        prompt: 'Add these and collect like terms.',
        given: `${bracket(polynomial(first))} + ${bracket(polynomial(second))}`,
        reference: polynomial(sum),
        form: 'expanded',
        variables: REAL_X,
        degreeBound: 2,
      }
    },
  },

  // ── factoring-quadratics ────────────────────────────────────────────────
  {
    id: 'gen-factor-monic',
    knowledgePointId: 'factor-monic',
    kind: 'transform_to_form',
    varies: 'both roots, and whether they share a sign',
    build(rng) {
      const roots = twoRoots(rng)
      if (!roots) return null
      const [p, q] = roots
      return {
        prompt: 'Factor this into two linear factors.',
        // (x - p)(x - q) = x² - (p+q)x + pq
        given: polynomial([1, -(p + q), p * q]),
        reference: `${factorFor(p)}${factorFor(q)}`,
        form: 'factored',
        variables: REAL_X,
        degreeBound: 2,
      }
    },
  },
  {
    id: 'gen-factor-non-monic',
    knowledgePointId: 'factor-non-monic',
    kind: 'transform_to_form',
    varies: 'the leading coefficient and both factors',
    build(rng) {
      const a = rng.int(2, 4)
      const b = rng.nonZero(1, 5)
      const d = rng.nonZero(1, 5)
      // (a x + b)(x + d) = a x² + (a d + b) x + b d. Reject when a divides b, since
      // then a common factor comes out and the exercise is a different one.
      if (b % a === 0) return null
      return {
        prompt: 'Factor this. The leading coefficient is not 1.',
        given: polynomial([a, a * d + b, b * d]),
        reference: `${bracket(linear(a, b))}${bracket(linear(1, d))}`,
        form: 'factored',
        variables: REAL_X,
        degreeBound: 2,
      }
    },
  },
  {
    id: 'gen-discriminant',
    knowledgePointId: 'irreducible-quadratic',
    kind: 'evaluate',
    varies: 'the three coefficients, and therefore the sign of the result',
    build(rng) {
      const a = rng.int(1, 3)
      const b = rng.nonZero(1, 7)
      const c = rng.nonZero(1, 8)
      const value = b * b - 4 * a * c
      return {
        prompt:
          `Compute the discriminant of ${polynomial([a, b, c])}. A negative value means it ` +
          `has no real linear factors.`,
        given: 'b^2 - 4*a*c',
        variables: REAL_ABC,
        at: { a: `${a}`, b: `${b}`, c: `${c}` },
        reference: `${value}`,
        degreeBound: 0,
      }
    },
  },

  // ── polynomial-division ─────────────────────────────────────────────────
  {
    id: 'gen-long-division',
    knowledgePointId: 'long-division',
    kind: 'transform_to_form',
    varies: 'the divisor, the quotient and a nonzero remainder',
    build(rng) {
      const p = rng.nonZero(1, 6)      // divisor is (x - p)
      const q = rng.nonZero(1, 6)      // quotient is (x + q)
      const r = rng.nonZero(1, 9)      // remainder
      // numerator = (x - p)(x + q) + r = x² + (q - p)x + (r - p q)
      return {
        prompt:
          'Divide, and write the result as a polynomial plus a proper fraction — ' +
          'quotient + remainder/divisor.',
        given: `${bracket(polynomial([1, q - p, r - p * q]))}/${factorFor(p)}`,
        reference: plusFraction(linear(1, q), r, factorFor(p)),
        form: 'partial_fractions',
        variables: REAL_X,
        domainConditions: [`x != ${p}`],
        degreeBound: 3,
      }
    },
  },
  {
    id: 'gen-improper-first',
    knowledgePointId: 'improper-first',
    kind: 'transform_to_form',
    varies: 'the leading coefficient, so the polynomial part is not always monic',
    build(rng) {
      const p = rng.nonZero(1, 5)
      const a = rng.int(2, 3)          // quotient is (a x + q)
      const q = rng.nonZero(1, 6)
      const r = rng.nonZero(1, 7)
      // numerator = (x - p)(a x + q) + r = a x² + (q - a p) x + (r - p q)
      return {
        prompt:
          'This fraction is improper. Divide first, then write it as a polynomial plus a ' +
          'proper fraction.',
        given: `${bracket(polynomial([a, q - a * p, r - p * q]))}/${factorFor(p)}`,
        reference: plusFraction(linear(a, q), r, factorFor(p)),
        form: 'partial_fractions',
        variables: REAL_X,
        domainConditions: [`x != ${p}`],
        degreeBound: 3,
      }
    },
  },

  // ── rational-domain ─────────────────────────────────────────────────────
  {
    id: 'gen-excluded-points',
    knowledgePointId: 'excluded-points',
    kind: 'evaluate',
    varies: 'the denominator, and which of its two roots is asked about',
    build(rng) {
      const roots = twoRoots(rng)
      if (!roots) return null
      const [p, q] = roots
      const asked = rng.pick([p, q])
      return {
        prompt:
          `Evaluate the denominator of a fraction over ${polynomial([1, -(p + q), p * q])} at ` +
          `x = ${asked}. What you get is why ${asked} is excluded.`,
        given: polynomial([1, -(p + q), p * q]),
        variables: REAL_X,
        at: { x: `${asked}` },
        reference: '0',
        degreeBound: 0,
      }
    },
  },
  {
    id: 'gen-cancelling-keeps-the-hole',
    knowledgePointId: 'cancelling-keeps-the-hole',
    kind: 'evaluate',
    varies: 'the cancelled factor and the point it was cancelled at',
    build(rng) {
      const roots = twoRoots(rng, 7)
      if (!roots) return null
      const [hole, pole] = roots
      // The cancelled form 1/(x - pole) has a value at the hole; the expression it
      // came from does not. That difference is the knowledge point.
      const denominator = hole - pole
      if (denominator === 0) return null
      return {
        prompt:
          `Evaluate 1/${factorFor(pole)} at x = ${hole}. The expression it came from, ` +
          `${factorFor(hole)}/(${factorFor(hole)}${factorFor(pole)}), is undefined there — so ` +
          `they are not the same function.`,
        given: `1/${factorFor(pole)}`,
        variables: REAL_X,
        at: { x: `${hole}` },
        domainConditions: [`x != ${pole}`],
        reference: fraction(1, denominator),
        degreeBound: 0,
      }
    },
  },

  // ── simplifying-rational ────────────────────────────────────────────────
  {
    id: 'gen-cancel-common-factors',
    knowledgePointId: 'cancel-common-factors',
    kind: 'transform_to_form',
    varies: 'the shared factor and both survivors',
    build(rng) {
      const shared = rng.nonZero(1, 7)
      const top = rng.nonZero(1, 7)
      const bottom = rng.nonZero(1, 7)
      if (new Set([shared, top, bottom]).size !== 3) return null
      return {
        prompt: 'Reduce to lowest terms, as a single fraction.',
        given:
          `${bracket(polynomial([1, -(shared + top), shared * top]))}/` +
          `${bracket(polynomial([1, -(shared + bottom), shared * bottom]))}`,
        reference: `${factorFor(top)}/${factorFor(bottom)}`,
        form: 'single_fraction',
        // Without this the task accepts its own input: an unreduced fraction is a
        // single fraction and is equivalent to itself.
        maxDenominatorDegree: 1,
        variables: REAL_X,
        domainConditions: [`x != ${shared}`, `x != ${bottom}`],
        degreeBound: 4,
      }
    },
  },
  {
    id: 'gen-terms-are-not-factors',
    knowledgePointId: 'terms-are-not-factors',
    kind: 'evaluate',
    varies: 'both constants and the point of evaluation',
    build(rng) {
      const m = rng.nonZero(1, 8)
      const n = rng.nonZero(1, 8)
      if (m === n) return null
      const x0 = rng.nonZero(1, 5)
      if (x0 + n === 0) return null
      return {
        prompt:
          `Evaluate ${bracket(linear(1, m))}/${bracket(linear(1, n))} at x = ${x0}. Compare it ` +
          `with ${fraction(m, n)} — the answer you get if you cancel the x out of a sum.`,
        given: `${bracket(linear(1, m))}/${bracket(linear(1, n))}`,
        variables: REAL_X,
        at: { x: `${x0}` },
        domainConditions: [`x != ${-n}`],
        reference: fraction(x0 + m, x0 + n),
        degreeBound: 0,
      }
    },
  },

  // ── combining-rational / partial fractions: the inverse pair ───────────
  //
  // These two draw the same numbers and swap which side is the question, which
  // is the cheapest way to show that a form is a choice rather than a fact.
  {
    id: 'gen-combine-two',
    knowledgePointId: 'combine-two',
    kind: 'transform_to_form',
    varies: 'both numerators and both factors',
    build(rng) {
      const roots = twoRoots(rng)
      if (!roots) return null
      const [p, q] = roots
      const A = rng.nonZero(1, 5)
      const B = rng.nonZero(1, 5)
      // A/(x-p) + B/(x-q) = ((A+B)x - (A q + B p)) / ((x-p)(x-q))
      const numerator = polynomial([A + B, -(A * q + B * p)])
      return {
        prompt: 'Write this as a single fraction.',
        given: sumOfFractions([
          { numerator: A, denominator: factorFor(p) },
          { numerator: B, denominator: factorFor(q) },
        ]),
        reference: `${bracket(numerator)}/(${factorFor(p)}${factorFor(q)})`,
        form: 'single_fraction',
        variables: REAL_X,
        domainConditions: [`x != ${p}`, `x != ${q}`],
        degreeBound: 3,
      }
    },
  },
  {
    id: 'gen-decompose-distinct',
    knowledgePointId: 'decompose-distinct',
    kind: 'transform_to_form',
    varies: 'both residues and both factors',
    build(rng) {
      const roots = twoRoots(rng)
      if (!roots) return null
      const [p, q] = roots
      const A = rng.nonZero(1, 5)
      const B = rng.nonZero(1, 5)
      const numerator = polynomial([A + B, -(A * q + B * p)])
      return {
        prompt: 'Decompose into partial fractions.',
        given: `${bracket(numerator)}/(${factorFor(p)}${factorFor(q)})`,
        reference: sumOfFractions([
          { numerator: A, denominator: factorFor(p) },
          { numerator: B, denominator: factorFor(q) },
        ]),
        form: 'partial_fractions',
        variables: REAL_X,
        domainConditions: [`x != ${p}`, `x != ${q}`],
        degreeBound: 3,
      }
    },
  },
  {
    id: 'gen-one-term-per-power',
    knowledgePointId: 'one-term-per-power',
    kind: 'transform_to_form',
    varies: 'the repeated factor and both numerators',
    build(rng) {
      const p = rng.nonZero(1, 6)
      const A = rng.nonZero(1, 5)
      const B = rng.nonZero(1, 6)
      // A/(x-p) + B/(x-p)² = (A x + (B - A p)) / (x-p)²
      return {
        prompt: 'Decompose into partial fractions. The denominator has a repeated factor.',
        given: `${bracket(polynomial([A, B - A * p]))}/${factorFor(p)}^2`,
        reference: sumOfFractions([
          { numerator: A, denominator: factorFor(p) },
          { numerator: B, denominator: `${factorFor(p)}^2` },
        ]),
        form: 'partial_fractions',
        variables: REAL_X,
        domainConditions: [`x != ${p}`],
        degreeBound: 3,
      }
    },
  },
]

export function generatorById(id: string): TaskGenerator | null {
  return GENERATORS.find(g => g.id === id) ?? null
}

export function generatorsForPoint(pointId: string): TaskGenerator[] {
  return GENERATORS.filter(g => g.knowledgePointId === pointId)
}

// ---------------------------------------------------------------------------
// Ids — the whole of a generated task's storage
// ---------------------------------------------------------------------------

/** `@` rather than `-`, so a generated id can never collide with an authored one. */
export const taskIdFor = (generatorId: string, seed: number) => `${generatorId}@${seed}`

export function parseTaskId(id: string): { generatorId: string; seed: number } | null {
  const at = id.lastIndexOf('@')
  if (at <= 0) return null
  const seed = Number(id.slice(at + 1))
  if (!Number.isInteger(seed) || seed < 0) return null
  return { generatorId: id.slice(0, at), seed }
}

// ---------------------------------------------------------------------------
// Validation — every instance, every time
// ---------------------------------------------------------------------------

/**
 * Everything wrong with a candidate instance. Empty means it is safe to serve.
 *
 * Run on every generated instance before it is handed out, not only in tests.
 * The cost is a handful of parses and twenty substitutions; the alternative is a
 * formatting bug in `polynomial` reaching a learner as a problem whose stated
 * answer is wrong, which is the worst failure this engine has.
 */
export function validateInstance(task: PracticeTask, degreeBound: number): string[] {
  const problems: string[] = []
  const symbols = task.variables.map(v => v.name)
  const variable = task.variables[0]?.name ?? 'x'

  if (!isVerifiableKind(task.kind)) {
    problems.push(`kind "${task.kind}" cannot be ruled, so an instance of it must not be served`)
    return problems
  }

  const givenTree = treeOf(task.given, symbols)
  if (!givenTree) problems.push(`given does not parse: ${failureOf(task.given, symbols)}`)
  const referenceTree = treeOf(task.reference, symbols)
  if (!referenceTree) problems.push(`reference does not parse: ${failureOf(task.reference, symbols)}`)
  if (!givenTree || !referenceTree) return problems

  if (task.given.trim() === task.reference.trim()) {
    problems.push('given and reference are the same string, so there is nothing to do')
  }

  // ── shape, as a conjunction in both directions ──────────────────────────
  //
  // The form check and the denominator bound are two halves of ONE claim about
  // the answer's shape, and they have to be read together — `ruleTransform`
  // collects them into one list and refuses if any refuses, so this must agree.
  //
  // Reading them independently was a real bug: `(x²−…)/(x²−…)` genuinely *is* a
  // single fraction, so requiring the form check to fail on the given rejected
  // every cancellation task. What makes such a task non-trivial is that the
  // given fails the *denominator bound* — which is exactly why
  // `maxDenominatorDegree` exists. So: every check must hold on the reference,
  // and at least one must not hold on the given.
  const shapeOf = (tree: ExprNode) => {
    const checks = []
    if (task.form) checks.push(checkForm(tree, task.form, variable))
    if (typeof task.maxDenominatorDegree === 'number') {
      checks.push(checkDenominatorDegree(tree, variable, task.maxDenominatorDegree))
    }
    return checks
  }

  const onReference = shapeOf(referenceTree)
  for (const check of onReference) {
    if (check.held !== true) {
      problems.push(`reference does not satisfy its own shape claim: ${check.detail}`)
    }
  }
  const onGiven = shapeOf(givenTree)
  if (onGiven.length > 0 && onGiven.every(c => c.held === true)) {
    problems.push('given already has the shape the task demands, so it asks for nothing')
  }

  // ── the mathematics ────────────────────────────────────────────────────
  if (task.kind === 'evaluate') {
    const at = task.at ?? {}
    if (Object.keys(at).length === 0) {
      problems.push('an evaluate instance states no inputs')
      return problems
    }
    const atTrees: Record<string, ExprNode> = {}
    for (const [name, raw] of Object.entries(at)) {
      const tree = treeOf(raw, [])
      if (!tree || exactValue(tree) === null) {
        problems.push(`input ${name} = ${raw} is not an exact numeral`)
        return problems
      }
      atTrees[name] = tree
    }
    const uncovered = symbolsIn(givenTree).filter(s => !(s in atTrees))
    if (uncovered.length > 0) {
      problems.push(`given mentions ${uncovered.join(', ')}, which the inputs do not value`)
      return problems
    }
    const truth = exactValue(substitute(givenTree, atTrees))
    const claimed = exactValue(referenceTree)
    if (truth === null) problems.push('given has no exact value at the stated inputs')
    else if (claimed === null) problems.push('reference has no exact rational value')
    else if (!sameValue(truth, claimed)) {
      problems.push(`reference is ${task.reference}, but given at its inputs is a different value`)
    }
    return problems
  }

  // `transform_to_form`: prove the two sides are the same function. `minPoints`
  // must exceed the declared degree bound for the check to be conclusive — see
  // agreeAtPoints. The floor of 8 is comfort, not rigour.
  const minPoints = Math.max(degreeBound + 1, 8)
  const agreement = agreeAtPoints(givenTree, referenceTree, variable, minPoints)
  if (!agreement.agree) {
    problems.push(
      agreement.disagreedAt
        ? `given and reference differ at ${variable} = ${agreement.disagreedAt.point}: ` +
          `${agreement.disagreedAt.left} vs ${agreement.disagreedAt.right}`
        : `only ${agreement.checked} usable sample points, which does not clear the degree ` +
          `bound of ${degreeBound}`,
    )
  }

  return problems
}

/**
 * Parse accessors written with `in` rather than by discriminating on `.ok`.
 *
 * `tryParse` returns `{ok: true, tree} | {ok: false, message, position}`, which
 * narrows perfectly under the project's `strict` config. It does *not* narrow
 * when these modules are compiled standalone — the test harness and
 * scripts/import-bza.mjs both do that — because with `strictNullChecks` off the
 * literal types `true` and `false` widen to `boolean` and the union stops being
 * discriminable. An `in` check is unaffected by that, so these two helpers keep
 * one source of truth compiling cleanly under both.
 */
function treeOf(source: string, symbols: string[]): ExprNode | null {
  const result = tryParse(source, symbols)
  return 'tree' in result ? result.tree : null
}

function failureOf(source: string, symbols: string[]): string {
  const result = tryParse(source, symbols)
  return 'message' in result ? result.message : 'it parsed'
}

// ---------------------------------------------------------------------------
// Producing instances
// ---------------------------------------------------------------------------

function toTask(generator: TaskGenerator, seed: number, spec: GeneratedSpec): PracticeTask {
  return {
    id: taskIdFor(generator.id, seed),
    knowledgePointId: generator.knowledgePointId,
    kind: generator.kind,
    prompt: spec.prompt,
    given: spec.given,
    ...(spec.form ? { form: spec.form } : {}),
    ...(typeof spec.maxDenominatorDegree === 'number'
      ? { maxDenominatorDegree: spec.maxDenominatorDegree }
      : {}),
    variables: spec.variables,
    ...(spec.domainConditions ? { domainConditions: spec.domainConditions } : {}),
    reference: spec.reference,
    ...(spec.at ? { at: spec.at } : {}),
  }
}

/**
 * One instance, from a generator and a seed. Null when that exact draw is
 * degenerate or fails validation.
 *
 * Deliberately *not* self-healing: `generate(id, seed)` either is the instance
 * that seed names or is nothing. Walking to the next seed here would make the
 * returned task's id disagree with the seed it was asked for, and the verify
 * route would then rebuild a different problem than the learner answered.
 * Walking is `generateFrom`'s job, and it reports the seed it landed on.
 */
export function generate(generatorId: string, seed: number): PracticeTask | null {
  const generator = generatorById(generatorId)
  if (!generator) return null
  const spec = generator.build(rngFrom(seed))
  if (!spec) return null
  const task = toTask(generator, seed, spec)
  return validateInstance(task, spec.degreeBound).length === 0 ? task : null
}

/** Why a seed produced nothing, for tests and for review. Never shown to a learner. */
export function explain(generatorId: string, seed: number): string[] {
  const generator = generatorById(generatorId)
  if (!generator) return [`no generator ${generatorId}`]
  const spec = generator.build(rngFrom(seed))
  if (!spec) return ['the draw was degenerate and the generator declined it']
  return validateInstance(toTask(generator, seed, spec), spec.degreeBound)
}

/**
 * Walk forward from `seed` until a seed yields a valid instance.
 *
 * Bounded, and returns null rather than looping: a generator that cannot produce
 * anything in `attempts` tries is broken, and the honest response is to serve no
 * task for that point and let the scheduler report it skipped.
 */
export function generateFrom(
  generatorId: string,
  seed: number,
  attempts = 64,
): PracticeTask | null {
  for (let i = 0; i < attempts; i += 1) {
    const task = generate(generatorId, (seed + i) >>> 0)
    if (task) return task
  }
  return null
}

/** Resolve a generated task id back into its instance. The verify route's entry point. */
export function generatedTaskById(id: string): PracticeTask | null {
  const parsed = parseTaskId(id)
  return parsed ? generate(parsed.generatorId, parsed.seed) : null
}

/**
 * One instance per generator for a knowledge point, seeded from the learner's
 * own history on it.
 *
 * `attempts` is the count of *scored* attempts. An inconclusive ruling does not
 * increment it, so a learner whose submission the engine could not settle is
 * re-served the same instance — which is the fair outcome: the engine failed,
 * not them, and changing the numbers would discard the work they did.
 */
export function variantsForPoint(
  pointId: string,
  base: number,
  attempts: number,
): PracticeTask[] {
  const out: PracticeTask[] = []
  for (const generator of generatorsForPoint(pointId)) {
    const task = generateFrom(generator.id, variantSeedFor(base, pointId, attempts))
    if (task) out.push(task)
  }
  return out
}

/** Parse once, for callers that want the tree. Exported for the tests. */
export function parseGiven(task: PracticeTask): ExprNode {
  return parseExpression(task.given, task.variables.map(v => v.name))
}
