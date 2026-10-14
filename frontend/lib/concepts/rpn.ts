/**
 * An RPN calculator that emits the same record Emacs Calc does.
 *
 * WHY THE RECORD SHAPE IS THE DESIGN. This is the one genuinely new build of the
 * four surface features, and the temptation with a new build is to invent its own
 * output. The Emacs side already captures, with every snapshot: the expression
 * text, the calculation mode, the precision, the angle convention and the engine
 * version (`math-workbench-calc` in the `math` project). If this widget emits that
 * same record, a calculation is one object on both sides and can cross between
 * them. Built freehand, the two diverge on day one and nothing ever reconciles
 * them, because neither side is wrong.
 *
 * The field names below are Calc's, verbatim, including `evidence` — which is
 * why `evidence` draws from the worker's own `evidence_kind` vocabulary and gains
 * no new term here.
 *
 * ── Exactness, and the one place this is weaker than Calc ─────────────────
 *
 * Integers and quotients of integers are computed exactly, in BigInt, and the
 * record says `symbolic_result`. Anything touching a decimal numeral or a
 * transcendental function goes through a JS double and the record says
 * `numerical_observation`.
 *
 * A decimal numeral is a float rather than an exact tenth, and that is the
 * worker's own rule rather than a shortcut: `{"kind": "decimal"}` in
 * worker/mathwb/exprtree.py is a `sympy.Float` with the authored precision,
 * because "the author wrote a measurement, not a fraction". Diverging from that
 * here would mean `0.1 + 0.2` answering differently in the calculator and in the
 * workbench, which is the exact divergence the shared record shape exists to
 * prevent.
 *
 * Where this is honestly weaker: Emacs Calc is arbitrary-precision, and a JS
 * double is not. A `precision` above about 15 is a *display* setting here, not a
 * computation one, and `precisionIsAdvisory` says so to the UI so it can tell the
 * user rather than quietly rounding. Exact non-rational work is what the worker
 * is for, which is why `toWorkerTree` exists.
 */

import type { ExprNode } from './expr'

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** An exact rational, normalised: `d > 0`, gcd(n, d) = 1. */
export interface Exact { n: bigint; d: bigint }

export type Value =
  | { kind: 'exact'; v: Exact }
  | { kind: 'float'; v: number }

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a
  let y = b < 0n ? -b : b
  while (y) { const t = x % y; x = y; y = t }
  return x
}

export function exact(n: bigint, d: bigint = 1n): Value {
  if (d === 0n) throw new RpnError('division by zero')
  const sign = d < 0n ? -1n : 1n
  const nn = n * sign
  const dd = d * sign
  const g = gcd(nn, dd) || 1n
  return { kind: 'exact', v: { n: nn / g, d: dd / g } }
}

const asFloat = (value: Value): number =>
  value.kind === 'float' ? value.v : Number(value.v.n) / Number(value.v.d)

export class RpnError extends Error {
  constructor(message: string) { super(message); this.name = 'RpnError' }
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

export type AngleMode = 'deg' | 'rad'

export interface RpnSettings {
  /** Significant digits for display. See `precisionIsAdvisory`. */
  precision: number
  angle: AngleMode
}

export const DEFAULT_SETTINGS: RpnSettings = { precision: 12, angle: 'deg' }

/** Where a JS double stops being able to honour the precision setting. */
export const DOUBLE_DIGITS = 15

export const precisionIsAdvisory = (settings: RpnSettings) => settings.precision > DOUBLE_DIGITS

interface OpSpec {
  /** How many values it takes off the stack. */
  arity: number
  /** Whether it can stay exact when its inputs are exact. */
  canBeExact: boolean
  apply: (args: Value[], settings: RpnSettings) => Value
}

const toRadians = (x: number, angle: AngleMode) => angle === 'deg' ? (x * Math.PI) / 180 : x
const fromRadians = (x: number, angle: AngleMode) => angle === 'deg' ? (x * 180) / Math.PI : x

/** Lift a float-only unary function. The result is never exact. */
const floaty = (fn: (x: number, s: RpnSettings) => number): OpSpec => ({
  arity: 1,
  canBeExact: false,
  apply: ([a], s) => ({ kind: 'float', v: fn(asFloat(a), s) }),
})

export const OPERATORS: Record<string, OpSpec> = {
  '+': {
    arity: 2, canBeExact: true,
    apply: ([a, b]) => a.kind === 'exact' && b.kind === 'exact'
      ? exact(a.v.n * b.v.d + b.v.n * a.v.d, a.v.d * b.v.d)
      : { kind: 'float', v: asFloat(a) + asFloat(b) },
  },
  '-': {
    arity: 2, canBeExact: true,
    apply: ([a, b]) => a.kind === 'exact' && b.kind === 'exact'
      ? exact(a.v.n * b.v.d - b.v.n * a.v.d, a.v.d * b.v.d)
      : { kind: 'float', v: asFloat(a) - asFloat(b) },
  },
  '*': {
    arity: 2, canBeExact: true,
    apply: ([a, b]) => a.kind === 'exact' && b.kind === 'exact'
      ? exact(a.v.n * b.v.n, a.v.d * b.v.d)
      : { kind: 'float', v: asFloat(a) * asFloat(b) },
  },
  '/': {
    arity: 2, canBeExact: true,
    apply: ([a, b]) => {
      if (a.kind === 'exact' && b.kind === 'exact') {
        if (b.v.n === 0n) throw new RpnError('division by zero')
        return exact(a.v.n * b.v.d, a.v.d * b.v.n)
      }
      const divisor = asFloat(b)
      if (divisor === 0) throw new RpnError('division by zero')
      return { kind: 'float', v: asFloat(a) / divisor }
    },
  },
  '^': {
    arity: 2, canBeExact: true,
    apply: ([a, b]) => {
      // Exact only for an integer exponent. A rational exponent is a root, and a
      // root of a rational is not generally rational — claiming exactness there
      // would be the one kind of lie this file is organised to avoid.
      if (a.kind === 'exact' && b.kind === 'exact' && b.v.d === 1n) {
        const power = b.v.n
        if (power >= 0n) return exact(a.v.n ** power, a.v.d ** power)
        if (a.v.n === 0n) throw new RpnError('zero to a negative power')
        return exact(a.v.d ** -power, a.v.n ** -power)
      }
      return { kind: 'float', v: asFloat(a) ** asFloat(b) }
    },
  },
  neg: { arity: 1, canBeExact: true, apply: ([a]) => a.kind === 'exact' ? exact(-a.v.n, a.v.d) : { kind: 'float', v: -a.v } },
  inv: {
    arity: 1, canBeExact: true,
    apply: ([a]) => {
      if (a.kind === 'exact') {
        if (a.v.n === 0n) throw new RpnError('division by zero')
        return exact(a.v.d, a.v.n)
      }
      if (a.v === 0) throw new RpnError('division by zero')
      return { kind: 'float', v: 1 / a.v }
    },
  },
  abs: { arity: 1, canBeExact: true, apply: ([a]) => a.kind === 'exact' ? exact(a.v.n < 0n ? -a.v.n : a.v.n, a.v.d) : { kind: 'float', v: Math.abs(a.v) } },
  sqrt: {
    arity: 1, canBeExact: true,
    apply: ([a]) => {
      if (a.kind === 'exact' && a.v.n >= 0n) {
        // Stay exact when both parts are perfect squares, which is the case that
        // actually comes up — sqrt(9/4). Otherwise fall to a double and say so.
        const rn = bigintSqrt(a.v.n)
        const rd = bigintSqrt(a.v.d)
        if (rn !== null && rd !== null) return exact(rn, rd)
      }
      const x = asFloat(a)
      if (x < 0) throw new RpnError('square root of a negative number')
      return { kind: 'float', v: Math.sqrt(x) }
    },
  },
  sin: floaty((x, s) => Math.sin(toRadians(x, s.angle))),
  cos: floaty((x, s) => Math.cos(toRadians(x, s.angle))),
  tan: floaty((x, s) => Math.tan(toRadians(x, s.angle))),
  asin: floaty((x, s) => fromRadians(Math.asin(x), s.angle)),
  acos: floaty((x, s) => fromRadians(Math.acos(x), s.angle)),
  atan: floaty((x, s) => fromRadians(Math.atan(x), s.angle)),
  ln: floaty(x => { if (x <= 0) throw new RpnError('logarithm of a non-positive number'); return Math.log(x) }),
  exp: floaty(x => Math.exp(x)),
}

/** Exact integer square root, or null when `n` is not a perfect square. */
function bigintSqrt(n: bigint): bigint | null {
  if (n < 0n) return null
  if (n < 2n) return n
  let x = n
  let y = (x + 1n) / 2n
  while (y < x) { x = y; y = (x + n / x) / 2n }
  return x * x === n ? x : null
}

/** Stack manipulation, which is not arithmetic and does not go through OPERATORS. */
const STACK_WORDS = new Set(['dup', 'drop', 'swap', 'over'])

export const CONSTANT_WORDS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface RpnResult {
  stack: Value[]
  /** The top of the stack, formatted. Empty when the stack is empty. */
  display: string
  /** True when every operation along the way stayed exact. */
  isExact: boolean
}

function parseNumber(token: string): Value | null {
  if (/^[+-]?\d+$/.test(token)) return exact(BigInt(token))
  // Calc's own fraction syntax, and it is worth supporting because it is the only
  // way to type an exact third.
  const ratio = /^([+-]?\d+):(\d+)$/.exec(token)
  if (ratio) return exact(BigInt(ratio[1]), BigInt(ratio[2]))
  if (/^[+-]?(\d+\.\d*|\.\d+)(e[+-]?\d+)?$/i.test(token)) return { kind: 'float', v: Number(token) }
  return null
}

/**
 * Evaluate a whitespace-separated RPN expression.
 *
 * Throws `RpnError` with a message naming the token, because the useful thing to
 * know about a stack underflow is which word wanted an operand that was not there.
 */
export function evaluateRpn(input: string, settings: RpnSettings = DEFAULT_SETTINGS): RpnResult {
  const stack: Value[] = []
  let exactSoFar = true

  for (const token of input.trim().split(/\s+/).filter(Boolean)) {
    const numeral = parseNumber(token)
    if (numeral) {
      if (numeral.kind === 'float') exactSoFar = false
      stack.push(numeral)
      continue
    }

    const lower = token.toLowerCase()

    if (lower in CONSTANT_WORDS) {
      exactSoFar = false   // pi and e are doubles here, and are not exact
      stack.push({ kind: 'float', v: CONSTANT_WORDS[lower] })
      continue
    }

    if (STACK_WORDS.has(lower)) {
      const need = lower === 'swap' || lower === 'over' ? 2 : 1
      if (stack.length < need) throw new RpnError(`${token} needs ${need} value(s) on the stack`)
      if (lower === 'dup') stack.push(stack[stack.length - 1])
      if (lower === 'drop') stack.pop()
      if (lower === 'over') stack.push(stack[stack.length - 2])
      if (lower === 'swap') {
        const b = stack.pop()!
        const a = stack.pop()!
        stack.push(b, a)
      }
      continue
    }

    const op = OPERATORS[token] ?? OPERATORS[lower]
    if (!op) throw new RpnError(`${token} is not a number or a known operator`)
    if (stack.length < op.arity) {
      throw new RpnError(`${token} needs ${op.arity} value(s) on the stack, found ${stack.length}`)
    }
    const args = stack.splice(stack.length - op.arity, op.arity)
    const result = op.apply(args, settings)
    if (result.kind === 'float') exactSoFar = false
    stack.push(result)
  }

  return {
    stack,
    display: stack.length > 0 ? formatValue(stack[stack.length - 1], settings) : '',
    isExact: exactSoFar && stack.every(v => v.kind === 'exact'),
  }
}

/**
 * Format one value.
 *
 * An exact value prints as `n` or `n:d`, in Calc's own notation, so a result
 * pasted into Emacs is read back as the same thing. A float honours `precision`
 * up to what a double can actually carry.
 */
export function formatValue(value: Value, settings: RpnSettings = DEFAULT_SETTINGS): string {
  if (value.kind === 'exact') {
    return value.v.d === 1n ? value.v.n.toString() : `${value.v.n}:${value.v.d}`
  }
  if (!Number.isFinite(value.v)) return value.v > 0 ? 'inf' : (Number.isNaN(value.v) ? 'nan' : '-inf')
  const digits = Math.max(1, Math.min(settings.precision, DOUBLE_DIGITS + 2))
  // toPrecision then strip the trailing zeros it adds, so 2 at precision 12 is
  // "2" and not "2.00000000000".
  return Number(value.v.toPrecision(digits)).toString()
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

/**
 * One captured calculation. Field for field, `math-workbench-calc`'s drawer.
 *
 * `revision` is sha256 of the input text, which is what `math-workbench--revision`
 * computes. Hashing in a browser is async (`crypto.subtle`), so it is passed in
 * rather than computed here — see `sha256Hex`.
 */
export interface CalcRecord {
  engine: string
  mode: 'rpn' | 'algebraic'
  precision: number
  angle: AngleMode
  input: string
  result: string
  /** The worker's `evidence_kind` vocabulary. No new term. */
  evidence: 'symbolic_result' | 'numerical_observation'
  revision: string
}

export function calcRecord(
  input: string,
  result: RpnResult,
  settings: RpnSettings,
  revision: string,
  engineLabel = 'rpn (bza web)',
): CalcRecord {
  return {
    engine: engineLabel,
    mode: 'rpn',
    precision: settings.precision,
    angle: settings.angle,
    input,
    result: result.display,
    evidence: result.isExact ? 'symbolic_result' : 'numerical_observation',
    revision,
  }
}

/** The drawer text Emacs would have written, so a record can be pasted straight in. */
export function toOrgDrawer(record: CalcRecord, drawer = 'RESULTS'): string {
  return [
    `:${drawer}:`,
    `engine: ${record.engine}`,
    `mode: ${record.mode}`,
    `precision: ${record.precision}`,
    `angle: ${record.angle}`,
    `input: ${record.input}`,
    `result: ${record.result}`,
    `evidence: ${record.evidence}`,
    `revision: ${record.revision}`,
    ':END:',
  ].join('\n')
}

/** sha256, hex, matching `(secure-hash 'sha256 text)`. */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------------------------
// Handing a stack value to the worker
// ---------------------------------------------------------------------------

/**
 * One value as a worker expression tree, so the scratchpad can ask for an exact
 * answer it cannot compute itself.
 *
 * This is the seam that makes the "no CAS in the browser" hole survivable: the
 * calculator is for speed, the worker is for exactness, and a value crosses
 * between them as a tree rather than as a string — the same rule everything else
 * here obeys.
 */
export function toWorkerTree(value: Value, settings: RpnSettings = DEFAULT_SETTINGS): ExprNode {
  if (value.kind === 'exact') {
    return value.v.d === 1n
      ? { kind: 'integer', value: value.v.n.toString() }
      : { kind: 'rational', numerator: value.v.n.toString(), denominator: value.v.d.toString() }
  }
  const text = formatValue(value, settings)
  return Number.isInteger(value.v) && Math.abs(value.v) < Number.MAX_SAFE_INTEGER
    ? { kind: 'integer', value: String(value.v) }
    : { kind: 'decimal', value: text, precision: Math.max(1, Math.min(settings.precision, DOUBLE_DIGITS)) }
}
