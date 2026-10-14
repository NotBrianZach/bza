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

export const FORM_LABELS: Record<NamedForm, string> = {
  partial_fractions: 'a sum of partial fractions',
  single_fraction: 'a single fraction',
  factored: 'a product of factors',
  expanded: 'expanded, as a sum of terms',
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
  switch (form) {
    case 'partial_fractions': return checkPartialFractions(node, symbol)
    case 'single_fraction': return checkSingleFraction(node, symbol)
    case 'factored': return checkFactored(node, symbol)
    case 'expanded': return checkExpanded(node, symbol)
  }
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
