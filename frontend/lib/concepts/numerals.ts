/**
 * Exact arithmetic over parsed trees, and substitution.
 *
 * Extracted from verify.ts because two callers now need it and one of them
 * cannot import the other. The verifier rules a learner's answer; the generators
 * prove that a *generated* problem and its answer are the same function before
 * either is shown to anybody. Both questions are "what is this tree worth,
 * exactly", and neither is CAS work — reducing a fraction of bigints is
 * arithmetic, and the moment a question needs more than that these functions
 * return null and the worker is asked instead.
 *
 * Module placement is forced rather than chosen: `exact` lives in rpn.ts and
 * rpn.ts only *type*-imports expr.ts, so a module importing both at runtime is
 * cycle-free. Putting these in expr.ts would make expr depend on rpn, and
 * putting them in verify.ts — where they started — made generators.ts depend on
 * verify.ts, which depends on tasks.ts, which depends on generators.ts.
 */

import { type ExprNode } from './expr'
import { exact, type Exact } from './rpn'

/**
 * Substitution, as pure tree surgery.
 *
 * Not a computation — nothing is folded, nothing is simplified, and a symbol the
 * table does not mention is left exactly where it was. That restraint is what
 * keeps this out of CAS territory: replacing a leaf with a numeral is a rewrite
 * the parser's own grammar already permits, whereas deciding what the result
 * *equals* is the worker's job.
 */
export function substitute(node: ExprNode, at: Record<string, ExprNode>): ExprNode {
  switch (node.kind) {
    case 'symbol':
      return at[node.name] ?? node
    case 'add':
      return { kind: 'add', args: node.args.map(a => substitute(a, at)) }
    case 'multiply':
      return { kind: 'multiply', args: node.args.map(a => substitute(a, at)) }
    case 'function':
      return { kind: 'function', name: node.name, args: node.args.map(a => substitute(a, at)) }
    case 'subtract':
      return { kind: 'subtract', left: substitute(node.left, at), right: substitute(node.right, at) }
    case 'equation':
      return { kind: 'equation', left: substitute(node.left, at), right: substitute(node.right, at) }
    case 'divide':
      return {
        kind: 'divide',
        numerator: substitute(node.numerator, at),
        denominator: substitute(node.denominator, at),
      }
    case 'power':
      return { kind: 'power', base: substitute(node.base, at), exponent: substitute(node.exponent, at) }
    case 'negate':
      return { kind: 'negate', operand: substitute(node.operand, at) }
    default:
      return node
  }
}

/** The largest exponent this will expand. Beyond it, a bigint pow is a denial of service. */
const MAX_EXPONENT = 64n

/**
 * A tree's exact rational value, or `null` when it does not have one.
 *
 * `null` is the important half of the contract and it is not a failure: `pi`,
 * `sqrt(2)` and `1/0` are all perfectly good expressions with no rational value,
 * and the caller's correct response is to ask the worker rather than to rule.
 * Returning 0 or NaN for any of them would turn "I cannot settle this" into a
 * ruling against the learner, which is the one thing the whole verdict design
 * exists to prevent.
 *
 * Exact throughout — bigint numerator over bigint denominator, reduced by rpn's
 * own `exact` so the sign normalisation and the zero-denominator refusal are
 * shared rather than reimplemented. Decimals are read as the fraction they
 * literally are (`1.5` is `15/10`), which is what makes a learner who answers
 * `1.5` and a learner who answers `3/2` get the same ruling.
 */
export function exactValue(node: ExprNode): Exact | null {
  const ratio = (n: bigint, d: bigint): Exact | null => {
    if (d === 0n) return null
    const value = exact(n, d)
    return value.kind === 'exact' ? value.v : null
  }

  switch (node.kind) {
    case 'integer':
      return ratio(BigInt(node.value), 1n)
    case 'rational':
      return ratio(BigInt(node.numerator), BigInt(node.denominator))
    case 'decimal': {
      const [whole, frac = ''] = node.value.split('.')
      // `${whole}${frac}` rather than arithmetic, so '.5' and '1.' both work and
      // no precision is lost on the way through a float.
      return ratio(BigInt(`${whole || '0'}${frac}` || '0'), 10n ** BigInt(frac.length))
    }
    case 'negate': {
      const v = exactValue(node.operand)
      return v ? ratio(-v.n, v.d) : null
    }
    case 'add': {
      let acc: Exact | null = { n: 0n, d: 1n }
      for (const arg of node.args) {
        const v = exactValue(arg)
        if (!v || !acc) return null
        acc = ratio(acc.n * v.d + v.n * acc.d, acc.d * v.d)
      }
      return acc
    }
    case 'multiply': {
      let acc: Exact | null = { n: 1n, d: 1n }
      for (const arg of node.args) {
        const v = exactValue(arg)
        if (!v || !acc) return null
        acc = ratio(acc.n * v.n, acc.d * v.d)
      }
      return acc
    }
    case 'subtract': {
      const l = exactValue(node.left)
      const r = exactValue(node.right)
      return l && r ? ratio(l.n * r.d - r.n * l.d, l.d * r.d) : null
    }
    case 'divide': {
      const n = exactValue(node.numerator)
      const d = exactValue(node.denominator)
      if (!n || !d || d.n === 0n) return null
      return ratio(n.n * d.d, n.d * d.n)
    }
    case 'power': {
      const base = exactValue(node.base)
      const exponent = exactValue(node.exponent)
      if (!base || !exponent) return null

      // A rational exponent is a root, and a root is *sometimes* rational.
      //
      // Taking it seriously rather than refusing outright is what lets the
      // exponents subject be graded locally. Returning null here instead made
      // `ruleEvaluate` fall through to `truth ?? claimed` and grade a learner
      // against the author's *unverified* assertion — the one thing the
      // re-derivation check exists to prevent. 9^(1/2) is exactly 3 and there is
      // no reason to pretend otherwise; 2^(1/2) is not rational and still
      // returns null, which is the honest answer for it.
      if (exponent.d !== 1n) {
        if (exponent.d > MAX_EXPONENT) return null
        const root = exactRoot(base, exponent.d)
        if (!root) return null
        const e = exponent.n < 0n ? -exponent.n : exponent.n
        if (e > MAX_EXPONENT) return null
        const powered = ratio(root.n ** e, root.d ** e)
        if (!powered) return null
        if (exponent.n < 0n) {
          if (powered.n === 0n) return null
          return ratio(powered.d, powered.n)
        }
        return powered
      }

      const e = exponent.n < 0n ? -exponent.n : exponent.n
      if (e > MAX_EXPONENT) return null
      const pow = (x: bigint) => x ** e
      if (exponent.n < 0n) {
        if (base.n === 0n) return null
        return ratio(pow(base.d), pow(base.n))
      }
      return ratio(pow(base.n), pow(base.d))
    }
    /**
     * `sqrt` and `abs`, which are sometimes exactly rational.
     *
     * Added for the same reason the rational-exponent branch above gives for
     * itself: `9^(1/2)` is exactly 3 and there is no reason to pretend
     * otherwise, so refusing outright would make `ruleEvaluate` fall through to
     * the author's unverified assertion. `sqrt(9)` is the same number written
     * the other way, and it was returning null purely because nothing handled a
     * function node at all.
     *
     * That gap had a visible cost. The quadratic formula is
     * `(-b + sqrt(b^2 - 4ac))/(2a)`, so every task on it needed the math worker
     * — which took the suite's "every evaluate task is gradable with no worker
     * configured" from true to false for the three tasks whose discriminant is
     * a perfect square.
     *
     * `sqrt(2)` still returns null, which remains the honest answer: it has no
     * rational value and the worker is the thing that can rule it. So the
     * irrational-roots tasks are genuinely worker-only, and that is a property
     * of the mathematics rather than a hole in this function.
     *
     * ── `log`, and the correction to what this comment used to say ──────────
     *
     * It used to end "only these two: every other allowed function — `log`,
     * `sin`, `gamma` — is irrational at essentially every rational argument,
     * so a case for it would be a long way to write `return null`." The first
     * clause is true and the conclusion did not follow, because *essentially
     * every* is not every, and the exceptions are not a curiosity: a logarithm
     * is exactly rational precisely when its argument is a rational power of
     * its base, which is the only situation a logarithm is ever *set* in
     * before a calculator appears. log₂(32), log₂(1/8), log₃(9⁴) and log₉(27)
     * are 5, −3, 8 and 3/2 — the entire shipped content of the logarithm
     * concepts, and all of it was going to the worker.
     *
     * That cost three concepts their practice. `logarithm-definition`,
     * `logarithm-rules` and `solving-exponential-equations` carried knowledge
     * points and no tasks, because an `evaluate` task whose own value cannot
     * be recomputed here loses the re-derivation check in `ruleEvaluate` and
     * grades the learner against the author's unverified reference. Authoring
     * them needed this, not a new task kind. See `exactLog`.
     */
    case 'function': {
      // `log` is the only two-argument function in the allowed set, and the
      // arity decides which logarithm is meant — sympy's own convention, which
      // the worker inherits by calling `sympy.log(*args)`. Checked before the
      // single-argument guard below, which would otherwise refuse `log(32, 2)`
      // for having two.
      if (node.name === 'log') {
        if (node.args.length === 1) {
          // A natural log, and rational at exactly one argument: ln(1) = 0.
          // Handled rather than refused because it costs a comparison and is
          // the one value a learner can be expected to know without a table.
          const v = exactValue(node.args[0])
          return v && v.n === v.d ? { n: 0n, d: 1n } : null
        }
        if (node.args.length !== 2) return null
        const v = exactValue(node.args[0])
        const b = exactValue(node.args[1])
        return v && b ? exactLog(v, b) : null
      }
      if (node.args.length !== 1) return null
      const v = exactValue(node.args[0])
      if (!v) return null
      if (node.name === 'sqrt') return exactRoot(v, 2n)
      if (node.name === 'abs') return v.n < 0n ? ratio(-v.n, v.d) : ratio(v.n, v.d)
      return null
    }
    default:
      // symbol, constant — no rational value, and saying so is the point.
      return null
  }
}

/**
 * The exact `r`th root of a rational, or null when it is not rational.
 *
 * Numerator and denominator are rooted separately, which is valid because the
 * fraction is already reduced: if p/q is in lowest terms then so is any exact
 * root of it, and a rational root therefore requires *both* parts to be perfect
 * `r`th powers. That is why checking them independently does not miss a case.
 *
 * An even root of a negative is not a real number and returns null. An odd root
 * of a negative is fine and keeps its sign.
 */
export function exactRoot(value: Exact, r: bigint): Exact | null {
  if (r < 1n) return null
  if (r === 1n) return value
  const negative = value.n < 0n
  if (negative && r % 2n === 0n) return null

  const top = integerRoot(negative ? -value.n : value.n, r)
  const bottom = integerRoot(value.d, r)
  if (top === null || bottom === null) return null
  return { n: negative ? -top : top, d: bottom }
}

/**
 * `log_base(value)` when it is exactly rational, and null when it is not.
 *
 * ── Why this is a complete search and not a lucky-case table ───────────────
 *
 * The answer, if there is one, is a reduced fraction p/q with
 * `base^(p/q) = value`. That makes it look like a two-dimensional search, and
 * it is not, because of one fact: if `gcd(p, q) = 1` then Bézout gives
 * integers s, t with `ps + qt = 1`, so
 *
 *   base^(1/q) = base^((ps + qt)/q) = (base^(p/q))^s · base^t = value^s · base^t
 *
 * — a product of rationals. So **a rational answer forces `base` to be an
 * exact qth power of a rational**, and `exactRoot` finds that number or proves
 * there is none. Each q therefore costs one root extraction plus a walk up the
 * powers of the root it found, and a q whose root is irrational is dismissed
 * outright rather than searched.
 *
 * That is what makes a null here mean "not rational" rather than "not found" —
 * within the bound, which is the honest caveat. `MAX_EXPONENT` caps both p and
 * q, so a logarithm whose value is 1/97 is refused and goes to the worker.
 * Nothing in the shipped tasks has a denominator above 2.
 *
 * The undefined cases return null for the reason the header of `exactValue`
 * gives: a non-positive argument, a non-positive base and base 1 are
 * expressions that name no number, and ruling against the learner on one of
 * them would turn "undefined" into "wrong". `log-argument-is-positive` is a
 * knowledge point in the ontology precisely because that distinction matters.
 */
export function exactLog(value: Exact, base: Exact): Exact | null {
  if (value.n <= 0n || base.n <= 0n) return null
  if (base.n === base.d) return null          // log base 1 is undefined
  if (value.n === value.d) return { n: 0n, d: 1n }  // log_b(1) = 0 for every legal b

  /** Is a/b bigger, smaller or equal? Both denominators are positive. */
  const compare = (a: Exact, b: Exact) => {
    const left = a.n * b.d, right = b.n * a.d
    return left === right ? 0 : left < right ? -1 : 1
  }

  for (let q = 1n; q <= MAX_EXPONENT; q++) {
    const root = exactRoot(base, q)
    if (!root) continue
    if (root.n === root.d) continue  // base is 1 after all; nothing to walk

    // Walk the powers of the root in whichever direction approaches the value.
    // `root` is positive and not 1, so the walk is monotone and passing the
    // target proves no exponent of this q lands on it — which is the break.
    const up = compare(root, { n: 1n, d: 1n }) > 0
    const towards = compare(value, { n: 1n, d: 1n }) > 0
    const step: Exact = up === towards ? root : { n: root.d, d: root.n }
    const sign = up === towards ? 1n : -1n

    let acc: Exact = { n: 1n, d: 1n }
    for (let p = 1n; p <= MAX_EXPONENT; p++) {
      const next = exact(acc.n * step.n, acc.d * step.d)
      if (next.kind !== 'exact') break
      acc = next.v
      const order = compare(acc, value)
      if (order === 0) {
        const answer = exact(sign * p, q)
        return answer.kind === 'exact' ? answer.v : null
      }
      // Moved past it: this q cannot land on the value, whatever p is.
      if (towards ? order > 0 : order < 0) break
    }
  }
  return null
}

/**
 * The exact integer `r`th root of a non-negative bigint, or null.
 *
 * Binary search rather than `Math.pow` on a Number: these are bigints precisely
 * so that nothing silently loses precision, and round-tripping through a double
 * would defeat that for values above 2^53. The final multiply-back is the
 * exactness check — a search that lands near the root is not good enough, it has
 * to land *on* it.
 */
function integerRoot(value: bigint, r: bigint): bigint | null {
  if (value < 0n) return null
  if (value === 0n || value === 1n) return value
  let low = 1n
  let high = value
  while (low <= high) {
    const mid = (low + high) / 2n
    const raised = mid ** r
    if (raised === value) return mid
    if (raised < value) low = mid + 1n
    else high = mid - 1n
  }
  return null
}

export const sameValue = (a: Exact, b: Exact) => a.n === b.n && a.d === b.d

/** `n/d`, or just `n` when the denominator is 1. For feedback, not for parsing. */
export function showExact(value: Exact): string {
  return value.d === 1n ? `${value.n}` : `${value.n}/${value.d}`
}

// ---------------------------------------------------------------------------
// Proving two trees are the same function, without a CAS
// ---------------------------------------------------------------------------

/**
 * Sample points, chosen to be awkward rather than convenient.
 *
 * Integers and a couple of fractions, spread out and including negatives, so a
 * coincidental agreement is unlikely and a sign error cannot hide. They are
 * fixed rather than drawn, because a generator that validated itself against
 * random points would be unreproducible — the same instance has to pass or fail
 * the same way every time it is built from its seed.
 */
const SAMPLE_POINTS = [
  '0', '1', '-1', '2', '-2', '3', '-3', '4', '-5', '6', '-7', '8',
  '10', '-11', '13', '1/2', '-1/3', '3/2', '-5/2', '7/3',
] as const

export interface AgreementResult {
  agree: boolean
  /** Points where both sides had a value and the values matched. */
  checked: number
  /** The first disagreement found, for the message. */
  disagreedAt?: { point: string; left: string; right: string }
  /** Points skipped because one side had no value there — a pole, usually. */
  skipped: number
}

/**
 * Do two trees agree at enough rational points to be the same function?
 *
 * ── Why this is a proof and not a spot check ───────────────────────────────
 *
 * For two rational functions, `left - right` is a rational function whose
 * numerator is a polynomial. A nonzero polynomial of degree d has at most d
 * roots, so if the numerator has degree at most d and the two sides agree at
 * d + 1 distinct non-pole points, the numerator is identically zero and the
 * functions are equal on their common domain.
 *
 * So this is conclusive exactly when `minPoints` exceeds the degree bound of
 * that numerator. The caller knows the bound, because the caller *built* both
 * trees — a generator that multiplies two linear factors knows the result is
 * quadratic. The default of 12 is far above the degree of anything in the
 * shipped generators (the worst is degree 3 over degree 2, so a numerator bound
 * of 5), which is why it is safe to use as a gate.
 *
 * It is **not** a general equivalence test and must not be used as one. Hand it
 * `sin(x)` and `x` and it will correctly disagree, but hand it two expressions
 * of unbounded degree and the guarantee is gone. Equivalence of arbitrary
 * learner input is the worker's job and stays there.
 */
export function agreeAtPoints(
  left: ExprNode,
  right: ExprNode,
  variable: string,
  minPoints = 12,
): AgreementResult {
  let checked = 0
  let skipped = 0
  let disagreedAt: AgreementResult['disagreedAt']

  for (const point of SAMPLE_POINTS) {
    const at = { [variable]: parsePoint(point) }
    const l = exactValue(substitute(left, at))
    const r = exactValue(substitute(right, at))
    // One side undefined here: a pole, or a division that collapsed. Skipped
    // rather than failed — the functions are only claimed equal on the common
    // domain, which is the same caveat every ruling in this engine carries.
    if (l === null || r === null) {
      skipped += 1
      continue
    }
    if (!sameValue(l, r)) {
      if (!disagreedAt) {
        disagreedAt = { point, left: showExact(l), right: showExact(r) }
      }
      continue
    }
    checked += 1
  }

  return { agree: !disagreedAt && checked >= minPoints, checked, skipped, disagreedAt }
}

/**
 * The sample points as trees, built without the parser.
 *
 * Deliberately not `parseExpression`: these are this module's own constants, and
 * routing them through the parser would make a parser regression look like an
 * arithmetic one. `-1/3` is built as a negated quotient, which is what the
 * parser would produce for it anyway.
 */
function parsePoint(point: string): ExprNode {
  const negative = point.startsWith('-')
  const body = negative ? point.slice(1) : point
  const [n, d] = body.split('/')
  const magnitude: ExprNode = d
    ? { kind: 'rational', numerator: n, denominator: d }
    : { kind: 'integer', value: n }
  return negative ? { kind: 'negate', operand: magnitude } : magnitude
}
