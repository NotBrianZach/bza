import type { Exact } from './rpn'

/**
 * Dimensions and unit conversion, for tasks that ask for a physical quantity.
 *
 * ── WHY THE VERIFIER NEEDED THIS BEFORE IT COULD TAKE PHYSICS ─────────────
 *
 * `ruleEvaluate` compares exact rationals. That is exactly right for
 * mathematics and silently wrong for physics, in both directions:
 *
 *  - `9.8` and `9.8 m/s^2` compare EQUAL, so an answer that names no quantity
 *    at all passes a question about acceleration.
 *  - `1 km` and `1000 m` compare UNEQUAL, so a correct answer in a different
 *    unit is marked wrong.
 *
 * Neither failure announces itself. The first is the one that matters: a
 * physics course whose checker ignores units teaches that units are
 * decoration, which is the opposite of the single most useful habit the
 * subject has.
 *
 * ── WHAT THIS DELIBERATELY IS NOT ─────────────────────────────────────────
 *
 * Not a general unit library. It covers SI base units, the derived units a
 * first course actually uses, decimal prefixes, and the handful of accepted
 * non-SI units (gram, minute, hour, litre, tonne) whose conversions are
 * rational. That last word is the constraint that decides the whole design.
 *
 * EVERY SCALE IS AN EXACT RATIONAL, because the engine it feeds compares
 * exact rationals and nothing here may introduce a float. Powers of ten are
 * rational, 60 and 3600 are rational, so the covered set stays exact end to
 * end. Degrees are therefore ABSENT: converting them needs π, the scale would
 * have to be approximate, and an approximate scale inside an exact comparison
 * is a wrong answer that looks like a rounding question. An angle task should
 * ask in radians, or not declare a unit at all.
 *
 * Temperature is dimension-only for the same family of reasons. K and °C
 * differ by an OFFSET rather than a factor, and this module multiplies; a
 * scale factor cannot express 273.15. °C is not accepted rather than accepted
 * wrongly.
 */

/** The seven SI base dimensions. Everything else is a product of these. */
export type Base = 'm' | 'kg' | 's' | 'A' | 'K' | 'mol' | 'cd'
const BASES: Base[] = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd']

/** Exponent per base. Absent means zero. */
export type Dim = Partial<Record<Base, number>>

export interface ParsedUnit {
  dim: Dim
  /** Multiply a value in this unit by `scale` to get the SI base value. */
  scale: Exact
}

/*
 * Rational arithmetic in `Exact` directly, rather than through rpn's
 * `exact()`. That helper returns a `Value` — the tagged union the calculator
 * passes around — and every scale here would have to be unwrapped at each
 * step. One eight-line normaliser is less code than the unwrapping, and it
 * keeps this module's only rpn dependency a type import.
 */
const gcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a, y = b < 0n ? -b : b
  while (y) { const t = x % y; x = y; y = t }
  return x || 1n
}
const rat = (n: bigint, dd: bigint): Exact => {
  const sign = dd < 0n ? -1n : 1n
  const nn = n * sign, den = dd * sign
  const g = gcd(nn, den)
  return { n: nn / g, d: den / g }
}

const one: Exact = { n: 1n, d: 1n }
const mul = (a: Exact, b: Exact): Exact => rat(a.n * b.n, a.d * b.d)
const pow = (a: Exact, k: number): Exact => {
  if (k === 0) return one
  const base = k < 0 ? rat(a.d, a.n) : a
  let acc = one
  for (let i = 0; i < Math.abs(k); i++) acc = mul(acc, base)
  return acc
}
const ten = (k: number): Exact => k >= 0 ? rat(10n ** BigInt(k), 1n) : rat(1n, 10n ** BigInt(-k))

const d = (parts: Dim): Dim => parts

/**
 * Units by their exact symbol, checked before any prefix is considered.
 *
 * WHOLE-TOKEN-FIRST IS WHAT RESOLVES `m`, and the ambiguity is not exotic:
 * `m` is both the metre and the milli- prefix, `T` is both tesla and tera-.
 * Looking the whole token up first makes `m` the metre and leaves `ms` to be
 * read as milli+second, which is what everybody means by both. Trying prefixes
 * first would make `m` a prefix with no unit, and `kg` a kilo-gram by luck
 * rather than by rule.
 */
const UNITS: Record<string, { dim: Dim; scale: Exact }> = {
  // Base
  m:   { dim: d({ m: 1 }),   scale: one },
  kg:  { dim: d({ kg: 1 }),  scale: one },
  s:   { dim: d({ s: 1 }),   scale: one },
  A:   { dim: d({ A: 1 }),   scale: one },
  K:   { dim: d({ K: 1 }),   scale: one },
  mol: { dim: d({ mol: 1 }), scale: one },
  cd:  { dim: d({ cd: 1 }),  scale: one },

  // Derived, expanded to base so a dimension check needs no special cases
  N:  { dim: d({ kg: 1, m: 1, s: -2 }),          scale: one },
  J:  { dim: d({ kg: 1, m: 2, s: -2 }),          scale: one },
  W:  { dim: d({ kg: 1, m: 2, s: -3 }),          scale: one },
  Pa: { dim: d({ kg: 1, m: -1, s: -2 }),         scale: one },
  Hz: { dim: d({ s: -1 }),                       scale: one },
  C:  { dim: d({ A: 1, s: 1 }),                  scale: one },
  V:  { dim: d({ kg: 1, m: 2, s: -3, A: -1 }),   scale: one },
  F:  { dim: d({ kg: -1, m: -2, s: 4, A: 2 }),   scale: one },
  // Spelled out as well as Ω, because an answer box is typed on a keyboard.
  ohm: { dim: d({ kg: 1, m: 2, s: -3, A: -2 }),  scale: one },
  'Ω': { dim: d({ kg: 1, m: 2, s: -3, A: -2 }),  scale: one },

  // Accepted non-SI, all with rational conversions
  g: { dim: d({ kg: 1 }), scale: rat(1n, 1000n) },
  t: { dim: d({ kg: 1 }), scale: rat(1000n, 1n) },
  min: { dim: d({ s: 1 }), scale: rat(60n, 1n) },
  h: { dim: d({ s: 1 }), scale: rat(3600n, 1n) },
  L: { dim: d({ m: 3 }), scale: rat(1n, 1000n) },
}

/**
 * Decimal prefixes. `da` is absent on purpose — it is the only two-letter
 * prefix, it collides with nothing anybody writes, and supporting it would
 * mean the longest-prefix scan this lookup deliberately does not need.
 */
const PREFIXES: Record<string, number> = {
  T: 12, G: 9, M: 6, k: 3, h: 2,
  d: -1, c: -2, m: -3, u: -6, 'μ': -6, n: -9, p: -12,
}

/** One factor like `kg`, `ms`, `cm^3`, `s²`. */
function parseFactor(tok: string): ParsedUnit | null {
  const m = /^([A-Za-zΩμ]+)(?:\^(-?\d+)|([²³]))?$/.exec(tok.trim())
  if (!m) return null
  const sym = m[1]
  const expo = m[2] ? parseInt(m[2], 10) : m[3] ? (m[3] === '²' ? 2 : 3) : 1

  let found = UNITS[sym]
  let prefixScale = one
  if (!found) {
    // Whole token lost; now a one-character prefix plus a known unit.
    const p = PREFIXES[sym[0]]
    const rest = sym.slice(1)
    if (p === undefined || !UNITS[rest]) return null
    found = UNITS[rest]
    prefixScale = ten(p)
  }

  const dim: Dim = {}
  for (const b of BASES) {
    const e = (found.dim[b] ?? 0) * expo
    if (e !== 0) dim[b] = e
  }
  return { dim, scale: pow(mul(found.scale, prefixScale), expo) }
}

/**
 * A unit expression: factors joined by `*`, `·` or spaces, with `/` dividing
 * everything that follows it.
 *
 * `m/s/s` is therefore m·s⁻², which is the reading every physics text uses and
 * the opposite of left-to-right arithmetic. That is a deliberate departure: a
 * unit string is not an arithmetic expression, and nobody writing `kg*m/s^2`
 * means `(kg*m/s)*s`.
 */
export function parseUnit(text: string): ParsedUnit | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  // A bare 1 is dimensionless — lets a task say "this answer has no unit".
  if (trimmed === '1') return { dim: {}, scale: one }

  const groups = trimmed.split('/')
  let dim: Dim = {}
  let scale = one

  for (let gi = 0; gi < groups.length; gi++) {
    const sign = gi === 0 ? 1 : -1
    const factors = groups[gi].split(/[*·\s]+/).filter(Boolean)
    if (factors.length === 0) return null
    for (const f of factors) {
      if (gi > 0 && f === '1') continue
      const parsed = parseFactor(f)
      if (!parsed) return null
      for (const b of BASES) {
        const e = (dim[b] ?? 0) + sign * (parsed.dim[b] ?? 0)
        if (e === 0) delete dim[b]; else dim[b] = e
      }
      scale = sign === 1 ? mul(scale, parsed.scale) : mul(scale, pow(parsed.scale, -1))
    }
  }
  return { dim, scale }
}

export function sameDimension(a: Dim, b: Dim): boolean {
  return BASES.every(x => (a[x] ?? 0) === (b[x] ?? 0))
}

/** `kg·m/s²`, for telling somebody which dimension they actually wrote. */
export function showDimension(dim: Dim): string {
  const up = BASES.filter(b => (dim[b] ?? 0) > 0)
  const down = BASES.filter(b => (dim[b] ?? 0) < 0)
  if (up.length === 0 && down.length === 0) return 'dimensionless'
  const sup = (n: number) => n === 1 ? '' : String(n).replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c])
  const num = up.map(b => b + sup(dim[b]!)).join('·') || '1'
  const den = down.map(b => b + sup(-dim[b]!)).join('·')
  if (!den) return num
  /*
   * Bracket a denominator with more than one factor. Without it the volt
   * printed as `m²·kg/s³·A`, which reads as (m²·kg/s³)·A — the wrong
   * dimension, and wrong in a string whose entire job is telling somebody
   * which dimension they actually wrote.
   */
  return down.length > 1 ? `${num}/(${den})` : `${num}/${den}`
}

/**
 * Split an answer into its numeric part and its unit, when it has one.
 *
 * Conservative on purpose: the unit has to be a trailing run of letters and
 * unit punctuation that PARSES, and anything else leaves the answer alone as
 * pure arithmetic. A greedier split would eat the `x` out of an algebra
 * answer and report a dimension error on a task that never mentioned units.
 */
export function splitUnit(answer: string): { value: string; unit: ParsedUnit | null; unitText: string } {
  const m = /^(.*?)([A-Za-zΩμ][A-Za-zΩμ0-9^*/·²³\s]*)$/.exec(answer.trim())
  if (!m || !m[1].trim()) return { value: answer, unit: null, unitText: '' }
  const unit = parseUnit(m[2])
  if (!unit) return { value: answer, unit: null, unitText: '' }
  return { value: m[1].trim(), unit, unitText: m[2].trim() }
}
