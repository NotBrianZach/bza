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
    default:
      // symbol, constant, function — no rational value, and saying so is the point.
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
