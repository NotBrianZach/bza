/**
 * Is the answer in the form that was asked for?
 *
 * WHY THIS IS NOT THE WORKER'S JOB, and why it is a *separate* ruling rather than
 * part of the equivalence check. "Write this as a sum of partial fractions" is not
 * satisfied by handing back the original expression, and no CAS will say
 * otherwise, because the original expression is equivalent to itself. Equivalence
 * is a question about the function; form is a question about the syntax the
 * learner wrote. They are independent, both have to pass, and collapsing them
 * would make exactly one of the two failures invisible:
 *
 *   equivalent, in form        → correct
 *   equivalent, not in form    → incorrect, and the step that broke is the rewrite
 *   not equivalent             → incorrect, and the step that broke is the algebra
 *
 * So form is checked here, over the learner's own parsed tree, with no engine
 * involved. That also means it is available when the worker is not — a form
 * failure is settled locally and never degrades to inconclusive.
 *
 * ── Where this checker refuses to rule ────────────────────────────────────
 *
 * `degreeIn` returns null for anything it cannot determine, and every check here
 * propagates that to `{ held: null }` rather than to false. A form check that
 * guessed would be worse than one that abstained: abstaining routes the answer to
 * human review, where guessing marks a learner wrong for writing something the
 * checker was too simple to read.
 */

import { degreeIn, isNumeral, renderExpr, symbolsIn, unsigned, type ExprNode } from './expr'
import type { NamedForm } from './types'

export interface FormCheck {
  /** True in form, false out of form, null when this checker cannot tell. */
  held: boolean | null
  /** What was checked, and what was found. Shown to the learner verbatim. */
  detail: string
}

/** One form: how to say it, and how to rule it. */
export interface FormSpec {
  label: string
  check: (node: ExprNode, symbol: string) => FormCheck
  /**
   * Whether satisfying this form says something specific about the shape.
   *
   * A POSITIVE form makes a structural claim: `factored` means the tree is a
   * product, `partial_fractions` means a sum of constant-over-power terms. An
   * ABSENCE form says only that something is missing — `no_negative_exponents`
   * and `radical_free` are satisfied by `x^2 - 2x - 15`, by `7`, and by almost
   * every expression anyone will ever type.
   *
   * The distinction exists because derive.ts uses the set of forms a tree
   * satisfies as a shape signature, and a dimension that is true of nearly
   * everything carries no information while making every signature look more
   * alike. Adding the three new forms to the signature immediately broke the
   * derive tests for exactly that reason: an expanded quadratic started
   * reporting `["expanded", "no_negative_exponents", "radical_free"]`, and two
   * thirds of that is noise.
   *
   * So `discriminating: false` keeps a form fully askable and fully rulable
   * while keeping it out of the structural signature. It is not a quality
   * ranking of forms — `no_negative_exponents` is the ONLY thing that can rule
   * its task, since `x^-2` and `1/x^2` are equivalent everywhere.
   */
  discriminating: boolean
}

/** The terms of a top-level sum. A non-sum is one term, which is the useful reading. */
function terms(node: ExprNode): ExprNode[] {
  if (node.kind === 'add') return node.args
  if (node.kind === 'subtract') return [node.left, { kind: 'negate', operand: node.right }]
  return [node]
}

/** The factors of a product, with a power counted as one factor. */
function factors(node: ExprNode): ExprNode[] {
  const n = unsigned(node)
  return n.kind === 'multiply' ? n.args.flatMap(factors) : [n]
}

/**
 * A factor and its multiplicity, for a denominator like `(x+1)^2`.
 *
 * Returns multiplicity 1 for a bare factor. A non-integer or symbolic exponent
 * returns null, because "one term per power" is not a statement about `(x+1)^n`.
 */
function basePower(node: ExprNode): { base: ExprNode; power: number } | null {
  const n = unsigned(node)
  if (n.kind !== 'power') return { base: n, power: 1 }
  const exponent = unsigned(n.exponent)
  if (exponent.kind !== 'integer' || n.exponent.kind === 'negate') return null
  const power = Number(exponent.value)
  if (!Number.isInteger(power) || power < 1) return null
  return { base: n.base, power }
}

/** Does any part of this tree divide by something containing the symbol? */
function hasSymbolicDenominator(node: ExprNode, symbol: string): boolean {
  switch (node.kind) {
    case 'divide':
      return !isNumeral(node.denominator)
        || hasSymbolicDenominator(node.numerator, symbol)
        || hasSymbolicDenominator(node.denominator, symbol)
    case 'add': case 'multiply': case 'function':
      return node.args.some(a => hasSymbolicDenominator(a, symbol))
    case 'subtract': case 'equation':
      return hasSymbolicDenominator(node.left, symbol) || hasSymbolicDenominator(node.right, symbol)
    case 'power':
      return hasSymbolicDenominator(node.base, symbol) || hasSymbolicDenominator(node.exponent, symbol)
    case 'negate':
      return hasSymbolicDenominator(node.operand, symbol)
    default:
      return false
  }
}

// ---------------------------------------------------------------------------
// The four forms
// ---------------------------------------------------------------------------

/**
 * A sum of partial fractions.
 *
 * Three conditions, and the second is the one that does the work:
 *
 *  1. The top level is a sum of at least two terms. One term is whatever was
 *     handed in, not a decomposition of it.
 *  2. Every fractional term's denominator is a **single** factor, or an integer
 *     power of one. This is precisely what "decomposed" means: a fraction still
 *     sitting over `(x+3)(x-5)` has not been split, however it is written.
 *  3. Every fractional term is proper — numerator degree strictly below the
 *     degree of the denominator's base. `(x+1)/(x+3)` is equivalent to
 *     `1 - 2/(x+3)` and is not a partial fraction.
 *
 * Non-fractional terms are allowed and are not an error: an improper input
 * decomposes to a polynomial part plus proper fractions, which is the whole point
 * of the `improper-first` knowledge point.
 */
function checkPartialFractions(node: ExprNode, symbol: string): FormCheck {
  const parts = terms(node)
  if (parts.length < 2) {
    return {
      held: false,
      detail:
        'this is a single term. A decomposition is a sum of at least two terms — one per ' +
        'factor of the denominator, plus a polynomial part if the fraction was improper.',
    }
  }

  const complaints: string[] = []
  let abstained = ''
  let fractional = 0

  for (const term of parts) {
    const t = unsigned(term)

    if (t.kind !== 'divide') {
      // A polynomial part is legitimate. A term that divides by the symbol
      // somewhere inside without being a quotient at its top level is not
      // something this checker should rule on.
      if (hasSymbolicDenominator(t, symbol)) {
        abstained = abstained || `the term ${describe(t)} has a denominator inside it rather than at its top level`
      }
      continue
    }

    fractional += 1

    if (isNumeral(t.denominator)) continue  // a rational coefficient, not a fraction in x

    const split = basePower(t.denominator)
    if (!split) {
      abstained = abstained || `the exponent in ${describe(t.denominator)} is not a positive integer`
      continue
    }

    if (unsigned(split.base).kind === 'multiply') {
      complaints.push(
        `${describe(t.denominator)} is still a product of factors, so that term is not decomposed`,
      )
      continue
    }

    const baseDegree = degreeIn(split.base, symbol)
    const numeratorDegree = degreeIn(t.numerator, symbol)
    if (baseDegree === null || numeratorDegree === null) {
      abstained = abstained || `the degree of ${describe(t)} could not be determined`
      continue
    }
    if (numeratorDegree >= baseDegree) {
      complaints.push(
        `${describe(t)} is improper — its numerator has degree ${numeratorDegree} over a factor ` +
        `of degree ${baseDegree}, so it still divides out`,
      )
    }
  }

  if (complaints.length > 0) return { held: false, detail: complaints.join('; ') }
  if (abstained) return { held: null, detail: abstained }
  if (fractional === 0) {
    return {
      held: false,
      detail: 'no term is a fraction, so nothing has been decomposed',
    }
  }
  return { held: true, detail: `a sum of ${parts.length} terms, each over a single factor` }
}

/** One quotient. A top-level sum is the failure this catches. */
function checkSingleFraction(node: ExprNode, symbol: string): FormCheck {
  const n = unsigned(node)
  if (terms(n).length > 1) {
    return { held: false, detail: `this is a sum of ${terms(n).length} terms, not a single fraction` }
  }
  if (n.kind !== 'divide') {
    return hasSymbolicDenominator(n, symbol)
      ? { held: null, detail: 'there is a denominator in here, but not at the top level' }
      : { held: false, detail: 'there is no division at the top level, so this is not a fraction' }
  }
  return { held: true, detail: 'one quotient at the top level' }
}

/**
 * A product of factors. A top-level sum is what this refuses — except when the
 * expression has no factors left to find.
 *
 * The degree test has to come FIRST, and the reason is the whole subtlety of this
 * check: `x + 3` is a sum of two terms and is also completely factored, because a
 * degree-1 polynomial is irreducible. Rejecting it for being a sum would mark a
 * learner wrong for writing the only possible answer.
 */
function checkFactored(node: ExprNode, symbol: string): FormCheck {
  const n = unsigned(node)

  const overall = degreeIn(n, symbol)
  if (overall === null) return { held: null, detail: 'the degree could not be determined' }
  if (overall <= 1) {
    return { held: true, detail: `degree ${overall} in ${symbol}, which is already irreducible` }
  }

  if (terms(n).length > 1) {
    return {
      held: false,
      detail: `this is a sum of ${terms(n).length} terms. A factored form is a product.`,
    }
  }
  const list = factors(n)
  const nonTrivial = list.filter(f => symbolsIn(f).includes(symbol))
  if (nonTrivial.length === 0) {
    // Degree is above 1 by the test at the top, so an expression with no factor
    // mentioning the symbol has not been factored at all.
    return { held: false, detail: `no factor mentions ${symbol}` }
  }
  if (list.length === 1) {
    return {
      held: false,
      detail: `${describe(n)} is a single factor of degree ${overall} and is not written as a product`,
    }
  }
  return { held: true, detail: `a product of ${list.length} factors` }
}

/**
 * Is the answer's denominator *simpler* than the one it started from?
 *
 * Not a form, and that is why it is a separate function with a separate name.
 * "Reduce to lowest terms" is a claim about the answer **relative to the input**,
 * and no check over the answer alone can express it: `(x²−2x−15)/(x²−25)` is a
 * perfectly good single fraction, is equivalent to itself, and is exactly the
 * thing the learner was asked to change.
 *
 * That gap was a real bug rather than a hypothetical: without this check a
 * cancellation task accepted its own input as correct, since the unchanged
 * expression passes both the form check and the equivalence check. The test suite
 * caught it by asserting that no task's `given` already satisfies what the task
 * asks for.
 *
 * Checking the degree of the denominator is the honest, syntactic version of
 * "lowest terms" — it is what cancelling a common factor actually buys, and it
 * needs no CAS. It does not prove the result is fully reduced; a task that wants
 * that bound asserts it, and the bound is the author's claim about their own
 * reference answer.
 */
export function checkDenominatorDegree(
  node: ExprNode, symbol: string, max: number,
): FormCheck {
  const n = unsigned(node)

  // Nothing to measure is within any bound, and this case has to be tested
  // before the shape cases: a cancellation can legitimately remove the
  // denominator entirely — (x²−9)/(x−3) reduces to x + 3 — and refusing that for
  // "not being a fraction" would mark the most completely reduced answer wrong.
  if (!hasSymbolicDenominator(n, symbol)) {
    return { held: true, detail: `nothing is divided by ${symbol} any more` }
  }

  if (n.kind !== 'divide') {
    return {
      held: false,
      detail:
        `there are denominators in here but not one at the top level, so there is no single ` +
        `denominator to measure against the bound`,
    }
  }

  const degree = degreeIn(n.denominator, symbol)
  if (degree === null) {
    return { held: null, detail: `the degree of ${describe(n.denominator)} could not be determined` }
  }
  return degree <= max
    ? { held: true, detail: `the denominator is degree ${degree}, within the ${max} asked for` }
    : {
      held: false,
      detail:
        `the denominator ${describe(n.denominator)} is still degree ${degree}. A common factor ` +
        `has not been cancelled — reducing this should leave degree ${max} or less.`,
    }
}

/** A sum of monomials: nothing left to multiply out, nothing divided by the symbol. */
function checkExpanded(node: ExprNode, symbol: string): FormCheck {
  if (hasSymbolicDenominator(node, symbol)) {
    return { held: false, detail: `this still divides by something containing ${symbol}` }
  }
  for (const term of terms(node)) {
    for (const factor of factors(term)) {
      const f = unsigned(factor)
      if (terms(f).length > 1) {
        return { held: false, detail: `${describe(f)} is an unexpanded bracket` }
      }
      if (f.kind === 'power' && terms(unsigned(f.base)).length > 1) {
        return { held: false, detail: `${describe(f)} is an unexpanded power of a sum` }
      }
    }
  }
  const degree = degreeIn(node, symbol)
  if (degree === null) return { held: null, detail: 'this is not a polynomial shape this checker can read' }
  return { held: true, detail: `a sum of ${terms(node).length} term(s), fully multiplied out` }
}

// ---------------------------------------------------------------------------
// Exponents and logarithms
// ---------------------------------------------------------------------------
//
// These three exist because the exponents-and-logarithms ontology could not ask
// for `transform_to_form` without them. They are the demands that subject
// actually makes — "as a single power", "with no negative exponents",
// "radical-free" — and none of the four rational forms expresses any of them.

/** Every `power` node in the tree, outermost first. */
function powers(node: ExprNode, out: ExprNode[] = []): ExprNode[] {
  if (node.kind === 'power') out.push(node)
  for (const child of children(node)) powers(child, out)
  return out
}

/** The subtrees of a node, whatever its kind. One place, so a new kind is one edit. */
function children(node: ExprNode): ExprNode[] {
  switch (node.kind) {
    case 'add': case 'multiply': case 'function': return node.args
    case 'subtract': return [node.left, node.right]
    case 'divide': return [node.numerator, node.denominator]
    case 'power': return [node.base, node.exponent]
    case 'negate': return [node.operand]
    case 'equation': return [node.left, node.right]
    default: return []
  }
}

/**
 * The numeric value of an exponent, when it has one.
 *
 * `null` for anything symbolic — `x^n` with `n` a declared variable has no
 * knowable value, and a checker that assumed one would mark a correct answer
 * wrong, which is the outcome this file's header forbids.
 *
 * The `divide` branch is not optional and was missing from the first version.
 * `x^(1/2)` does NOT parse to a `rational` node: the parser produces
 * `power(x, divide(1, 2))`, because `rational` is for literals the tokenizer
 * reads as one. Without this branch both checkers below abstained on every
 * fractional exponent written the way a learner writes it — which is to say,
 * `radical_free` could not detect a radical.
 *
 * One function rather than a sign test and an integer test, so the two cannot
 * disagree about what a tree means.
 */
function exponentValue(node: ExprNode): number | null {
  switch (node.kind) {
    case 'integer': {
      const v = Number(node.value)
      return Number.isFinite(v) ? v : null
    }
    case 'decimal': {
      const v = Number(node.value)
      return Number.isFinite(v) ? v : null
    }
    case 'rational': {
      const n = Number(node.numerator), d = Number(node.denominator)
      return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null
    }
    case 'divide': {
      const n = exponentValue(node.numerator), d = exponentValue(node.denominator)
      return n !== null && d !== null && d !== 0 ? n / d : null
    }
    case 'negate': {
      const v = exponentValue(node.operand)
      return v === null ? null : -v
    }
    default:
      return null
  }
}

/** The sign of an exponent, when it can be known. */
function numericSign(node: ExprNode): 'negative' | 'non-negative' | null {
  const v = exponentValue(node)
  if (v === null) return null
  return v < 0 ? 'negative' : 'non-negative'
}

/** Whether an exponent is a whole number. `null` when it cannot be told. */
function isIntegerExponent(node: ExprNode): boolean | null {
  const v = exponentValue(node)
  // 4/2 is a whole-number exponent even though it is written as a quotient,
  // which is why this asks about the VALUE and not about the spelling.
  return v === null ? null : Number.isInteger(v)
}

/**
 * The whole expression is one power.
 *
 * A bare numeral or symbol passes: `x` is `x^1`, and `128` is the combined
 * value of `2^3 · 2^4`, so demanding the exponent be written out would be a
 * notational preference rather than a form.
 *
 * ── Why this is strict, after a first draft that was not ──────────────────
 *
 * The first version also accepted "a product of powers of distinct bases", on
 * the reasoning that `2^3 · 3^2` cannot be combined further. That let through
 * anything merely CONTAINING one power, and the derive tests caught it
 * immediately: `(x + 4)/(x + 1)^2` was ruled a single power, because the
 * denominator is one and nothing rejected the surrounding quotient. A form
 * whose label is "a single power" should not accept a quotient.
 *
 * So the rule is literal — one exponentiation, at the top, nothing around it —
 * which is also exactly what the tasks asking for it mean. The same-base
 * message below is kept ahead of the general one only because it names the
 * thing still to be done, which is more use to a learner than "this is not a
 * single power".
 */
function checkSinglePower(node: ExprNode, _symbol: string): FormCheck {
  /**
   * A power whose base is itself a power is NOT a single power.
   *
   * `(x^2)^4` is one `power` node, so the first version of this check passed
   * it — and the task validator caught the consequence immediately: a
   * "write as a single power" task whose given is `(x^2)^4` was asking for
   * nothing, because the given already satisfied the form. Which is correct
   * about the syntax and wrong about the skill: the exponents have not been
   * multiplied, and multiplying them is the entire content of
   * `multiply-exponents-on-power`.
   *
   * So "single" means one exponentiation, not one node.
   */
  const nestedPower = (n: ExprNode): ExprNode | null => {
    if (n.kind === 'power' && unsigned(n.base).kind === 'power') return n
    for (const c of children(n)) {
      const hit = nestedPower(c)
      if (hit) return hit
    }
    return null
  }
  const nested = nestedPower(node)
  if (nested) {
    return {
      held: false,
      detail: `${describe(nested)} is a power of a power — multiply the exponents to get one power`,
    }
  }

  const bases = new Map<string, number>()
  let sawCombinable = false

  const scan = (n: ExprNode, inDenominator: boolean) => {
    if (n.kind === 'multiply') { n.args.forEach(a => scan(a, inDenominator)); return }
    if (n.kind === 'divide') { scan(n.numerator, inDenominator); scan(n.denominator, !inDenominator); return }
    if (n.kind === 'negate') { scan(n.operand, inDenominator); return }
    const base = n.kind === 'power' ? renderExpr(n.base) : null
    if (base !== null) {
      const seen = bases.get(base) ?? 0
      if (seen > 0) sawCombinable = true
      bases.set(base, seen + 1)
    }
  }
  scan(node, false)

  if (sawCombinable) {
    const repeated = [...bases.entries()].find(([, n]) => n > 1)?.[0]
    return {
      held: false,
      detail: `there is still more than one power of ${repeated} to combine`,
    }
  }
  const top = unsigned(node)
  if (top.kind === 'power') return { held: true, detail: 'a single power' }
  if (isNumeral(top)) return { held: true, detail: 'a single value, with nothing left to combine' }
  if (top.kind === 'symbol') return { held: true, detail: `${renderExpr(top)}, which is a single power` }

  if (terms(top).length > 1) {
    return { held: false, detail: 'this is a sum, not a single power' }
  }
  if (top.kind === 'divide') {
    return { held: false, detail: 'this is a quotient, not a single power' }
  }
  if (top.kind === 'multiply') {
    return { held: false, detail: 'this is a product, not a single power' }
  }
  return { held: null, detail: 'this is not a shape this checker can read as a power' }
}

/**
 * No negative exponents anywhere.
 *
 * Abstains on a symbolic exponent rather than passing it. `x^n` is not evidence
 * that the learner avoided a negative exponent — it is evidence the checker
 * cannot tell, and routing it to review is the honest outcome.
 */
function checkNoNegativeExponents(node: ExprNode, _symbol: string): FormCheck {
  let unknown: string | null = null
  for (const p of powers(node)) {
    if (p.kind !== 'power') continue
    const sign = numericSign(p.exponent)
    if (sign === 'negative') {
      return {
        held: false,
        detail: `${describe(p)} still has a negative exponent — write it as a reciprocal instead`,
      }
    }
    if (sign === null) unknown = describe(p)
  }
  if (unknown) {
    return {
      held: null,
      detail: `the exponent in ${unknown} is not a number, so this checker cannot tell its sign`,
    }
  }
  return { held: true, detail: 'every exponent is non-negative' }
}

/**
 * No radicals: no `sqrt` call and no fractional exponent.
 *
 * Both spellings, because they are the same thing written two ways and a check
 * that caught only one would be trivially satisfiable by using the other.
 */
function checkRadicalFree(node: ExprNode, _symbol: string): FormCheck {
  const findSqrt = (n: ExprNode): boolean => {
    if (n.kind === 'function' && n.name === 'sqrt') return true
    return children(n).some(findSqrt)
  }
  if (findSqrt(node)) {
    return { held: false, detail: 'this still contains a square root' }
  }
  let unknown: string | null = null
  for (const p of powers(node)) {
    if (p.kind !== 'power') continue
    const whole = isIntegerExponent(p.exponent)
    if (whole === false) {
      return { held: false, detail: `${describe(p)} has a fractional exponent, which is a radical` }
    }
    if (whole === null) unknown = describe(p)
  }
  if (unknown) {
    return {
      held: null,
      detail: `the exponent in ${unknown} is not a number, so this checker cannot tell whether it is a whole number`,
    }
  }
  return { held: true, detail: 'no roots and no fractional exponents' }
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

/**
 * Every form, with its label and its checker.
 *
 * `Record<NamedForm, FormSpec>` and not a switch, and that is the whole point
 * of the refactor: the type makes the table TOTAL, so adding a member to
 * `NamedForm` fails to compile until a checker for it exists here. A switch
 * only warned about this if someone remembered to keep it exhaustive, and the
 * failure it allowed — a form that can be asked for and never ruled — is
 * precisely the one worth making impossible.
 *
 * It also replaces the old `FORM_LABELS` constant, which was a second table
 * keyed by the same union and therefore a second thing to forget.
 */
export const FORM_CHECKS: Record<NamedForm, FormSpec> = {
  partial_fractions: {
    label: 'a sum of partial fractions', check: checkPartialFractions, discriminating: true,
  },
  single_fraction: {
    label: 'a single fraction', check: checkSingleFraction, discriminating: true,
  },
  factored: {
    label: 'a product of factors', check: checkFactored, discriminating: true,
  },
  expanded: {
    label: 'expanded, as a sum of terms', check: checkExpanded, discriminating: true,
  },
  single_power: {
    label: 'a single power', check: checkSinglePower, discriminating: true,
  },
  // Absence forms. See `discriminating` on FormSpec: satisfied by nearly every
  // expression, so useless in a shape signature and essential as a demand.
  no_negative_exponents: {
    label: 'with no negative exponents', check: checkNoNegativeExponents, discriminating: false,
  },
  radical_free: {
    label: 'without radicals', check: checkRadicalFree, discriminating: false,
  },
}

/** Every form name. Derived, so it cannot fall behind the union. */
export const ALL_NAMED_FORMS = Object.keys(FORM_CHECKS) as NamedForm[]

/** The forms worth putting in a shape signature. See `FormSpec.discriminating`. */
export const DISCRIMINATING_FORMS = (Object.keys(FORM_CHECKS) as NamedForm[])
  .filter(f => FORM_CHECKS[f].discriminating)

/**
 * How to say each form, for a prompt or a review row.
 *
 * Kept as an export because `ReviewQueue.tsx` and `verify.ts` both read it, but
 * now derived from the registry rather than maintained beside it.
 */
export const FORM_LABELS: Record<NamedForm, string> = Object.fromEntries(
  Object.entries(FORM_CHECKS).map(([id, spec]) => [id, spec.label]),
) as Record<NamedForm, string>

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Check an answer against a named form.
 *
 * `symbol` is the variable the form is about — the task's own primary variable
 * rather than something guessed from the tree, because "proper fraction in x" and
 * "proper fraction in a" are different claims about the same expression.
 */
export function checkForm(node: ExprNode, form: NamedForm, symbol: string): FormCheck {
  if (node.kind === 'equation') {
    return {
      held: false,
      detail: 'this is an equation. Submit the rewritten expression, not an equation about it.',
    }
  }
  const spec = FORM_CHECKS[form]
  if (!spec) {
    // Unreachable through the type system, and handled anyway: `form` arrives
    // from a stored task row, and a row written by an older build could name a
    // form this one has dropped. Abstaining sends it to review; throwing would
    // lose the learner's answer.
    return { held: null, detail: `"${form}" is not a form this build knows how to check` }
  }
  return spec.check(node, symbol)
}

/**
 * A short rendering of a subtree for an error message.
 *
 * Truncated, because a complaint that quotes the learner's entire answer back at
 * them has told them nothing about which part of it was the problem.
 */
function describe(node: ExprNode): string {
  const text = renderExpr(node)
  return text.length > 48 ? `${text.slice(0, 45)}…` : text
}
