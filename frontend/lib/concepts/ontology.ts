/**
 * One subject ontology: rational expressions, up to partial fractions.
 *
 * WHY THIS SUBJECT. It was the worked example in the design note, and it has the
 * three properties that make it a real test of whether an ontology is authorable
 * rather than a demonstration that one can be typed:
 *
 *  1. The prerequisite structure is genuinely layered and not a chain. Partial
 *     fractions rests on factoring, on polynomial division and on recombining
 *     fractions, and those three do not rest on each other.
 *  2. It contains a real `encompasses` edge that matters. Decomposing a fraction
 *     and checking the decomposition *is* adding fractions back together — so a
 *     learner who has just done partial fractions has demonstrated the thing a
 *     naive scheduler would make them re-drill.
 *  3. It contains a real `interferes_with` pair that is not a naming accident.
 *     Cancelling is legal across a product and illegal across a sum, and the two
 *     skills taught together produce exactly the error each one is supposed to
 *     prevent.
 *
 * WHAT THIS IS NOT. It is hand-authored, nine concepts wide, and it is not an
 * import of anybody's curriculum. Every concept, edge and worked example below
 * was written here. The promotion rate further down is a real number precisely
 * because the candidate edges were left unpromoted rather than waved through.
 *
 * Every worked example here was checked by hand. Two of them are deliberate
 * inverses of each other (`expand-binomials` and `factor-monic`, `combine-two`
 * and `decompose-distinct`), because the inverse pair is the cheapest way to show
 * a learner that a form is a choice rather than a fact.
 */

import { ARITHMETIC_FOUNDATIONS } from './ontology-arithmetic'
import { EXPRESSIONS_AND_EQUATIONS } from './ontology-algebra'
import { PLANE_GEOMETRY } from './ontology-geometry'
import { TRIANGLE_TRIGONOMETRY } from './ontology-trigonometry'
import { SOLID_MEASURE } from './ontology-solids'
import { FUNCTIONS_AND_INVERSES } from './ontology-functions'
import { MATRICES_AND_DETERMINANTS } from './ontology-matrices'
import { VECTORS_AND_INDEPENDENCE } from './ontology-vectors'
import { EXPONENTS_AND_LOGARITHMS } from './ontology-exponentials'
import { DATA_SUMMARIES } from './ontology-statistics'
import { STATEMENTS_AND_CONNECTIVES } from './ontology-logic'
import { PREDICATES_AND_QUANTIFIERS } from './ontology-quantifiers'
import { METHODS_OF_PROOF } from './ontology-proof'
import { SETS_AND_MEMBERSHIP } from './ontology-sets'
import type { ConceptEdge, ConceptOntology, Subject } from './types'
import type { Concept } from './types'

export { ARITHMETIC_FOUNDATIONS } from './ontology-arithmetic'
export { EXPRESSIONS_AND_EQUATIONS } from './ontology-algebra'
/*
 * Re-exported by the thirty-fifth promotion, which is the first thing that
 * needed this subject by NAME rather than through `ONTOLOGIES`. Its group in
 * tests/atlas.mjs asserts that this ontology does not contain
 * `propositional-logic` — the concept whose only prerequisite it holds, and
 * which it could therefore have taken for free. A negative claim about a
 * specific subject cannot be made through a positional reference.
 */
export { PLANE_GEOMETRY } from './ontology-geometry'
export { FUNCTIONS_AND_INVERSES } from './ontology-functions'
export { MATRICES_AND_DETERMINANTS } from './ontology-matrices'
export { VECTORS_AND_INDEPENDENCE } from './ontology-vectors'
export { EXPONENTS_AND_LOGARITHMS } from './ontology-exponentials'
export { DATA_SUMMARIES } from './ontology-statistics'
export { STATEMENTS_AND_CONNECTIVES } from './ontology-logic'
/*
 * Re-exported by the thirty-sixth promotion for the same reason the geometry
 * above is: its group in tests/atlas.mjs makes a NEGATIVE claim about this
 * specific subject — that it does not contain `propositional-logic` and that
 * `statements-and-connectives` does not contain `quantifiers` — which is the
 * only form a test can give to a filing refused on grounds other than cost. A
 * positional reference cannot say which subject it is about.
 */
export { PREDICATES_AND_QUANTIFIERS } from './ontology-quantifiers'
/*
 * Re-exported by the thirty-seventh promotion, and here the negative claim is
 * doubled rather than merely repeated: BOTH logic subjects could have taken
 * `proof-techniques` for less than a new subject costs, and both had already
 * written it out of their own `covers` by name. So its group in
 * tests/atlas.mjs asserts that neither of them contains it and that this one
 * does, which is three claims about three specific subjects and none of them
 * reachable positionally.
 */
export { METHODS_OF_PROOF } from './ontology-proof'
/*
 * Re-exported by the thirty-eighth promotion, and the negative claim it needs is
 * the same shape as the three above with one subject swapped: `methods-of-proof`
 * holds `sets`' sole prerequisite, so it could have taken the concept for free,
 * and `predicates-and-quantifiers` names the node two steps above itself. Both
 * had already written it out of their own `covers` by name, so its group in
 * tests/atlas.mjs asserts that neither contains it and that this one does.
 *
 * `METHODS_OF_PROOF` is named by that group as well, which is why the thirty-
 * seventh promotion's re-export earns a second reader rather than only its own.
 */
export { SETS_AND_MEMBERSHIP } from './ontology-sets'

const subject: Subject = {
  id: 'rational-expressions',
  name: 'Rational expressions',
  covers:
    'Polynomial arithmetic through partial-fraction decomposition. Real coefficients, ' +
    'one variable. Nothing about convergence, and nothing about integrating the result — ' +
    'both are the usual next step and neither is in here.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

const CONCEPTS: Concept[] = [
  {
    id: 'polynomial-arithmetic',
    name: 'Adding and multiplying polynomials',
    subjectId: subject.id,
    scope: {
      id: 'polynomial-arithmetic',
      label: 'Polynomial arithmetic',
      hint: 'polynomial arithmetic distributive law',
      match: /\b(polynomial|monomial|binomial|distributive|like terms|expand\w*|coefficient)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'expand-a-product',
        statement: 'Expand a product of polynomials and collect like terms.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'expand-binomials',
        conceptId: 'polynomial-arithmetic',
        statement:
          'To multiply two brackets you owe every term of the first times every term of ' +
          'the second — four products for two binomials, not two.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Expand (x + 3)(x − 5).',
          subgoals: [
            {
              label: 'Which products do I owe?',
              detail:
                'Every term of the first bracket against every term of the second. Two ' +
                'terms times two terms is four products.',
              socratic:
                'A first attempt at this often multiplies x by x, then 3 by −5, and stops ' +
                'with those two products. What has it left out?',
            },
            {
              label: 'Form them',
              detail: 'x·x = x², x·(−5) = −5x, 3·x = 3x, 3·(−5) = −15.',
              socratic:
                'Take each term of x + 3 against each term of x − 5 in turn. The term in the ' +
                'second bracket is −5 rather than 5 — what does each of the four products ' +
                'come to, sign included?',
            },
            {
              label: 'Collect like terms',
              detail: 'Only −5x and 3x share a power of x: −5x + 3x = −2x.',
              socratic:
                'Your four products are x², −5x, 3x and −15. Collecting is only legal ' +
                'between terms carrying the same power of x — so which of these collect, and ' +
                'what is left standing alone?',
            },
          ],
          answer: 'x² − 2x − 15',
        },
      },
      {
        id: 'add-polynomials',
        conceptId: 'polynomial-arithmetic',
        statement:
          'Polynomials add power by power. Terms with different powers of x are not like ' +
          'terms and never combine, however much they look as though they should.',
        position: 2,
        workedExample: {
          problem: 'Add (2x² − x + 4) and (x² + 5x − 9).',
          subgoals: [
            {
              label: 'What can be added?',
              detail: 'Only terms carrying the same power of x.',
              socratic:
                'A first attempt here runs down all six terms and totals the numbers: ' +
                '2 − 1 + 4 + 1 + 5 − 9. Not one of those additions is between terms that ' +
                'belong together. Which terms do belong together, and what is it that decides?',
            },
            {
              label: 'Group by power',
              detail: 'x²: 2 + 1 = 3. x: −1 + 5 = 4. Constants: 4 − 9 = −5.',
              socratic:
                'The terms that belong together are now in three groups. Two of them hide ' +
                'something: the x² in the second bracket has no number written in front of it, ' +
                'and the x in the first bracket carries a minus. What does each of the three ' +
                'groups come to once those two are read properly?',
            },
          ],
          answer: '3x² + 4x − 5',
        },
      },
    ],
  },

  /**
   * The binomial theorem — the nineteenth promotion out of the atlas, and the
   * first one taken for its RULABILITY rather than for a route.
   *
   * ── Why it was the one worth doing ───────────────────────────────────────
   *
   * All ten learning journeys read zero unwritten before this was authored, so
   * the route demand that chose the previous several promotions is spent and
   * the tie-break had to come from somewhere else. What decided it is that this
   * concept settles LOCALLY. `exactValue` in numerals.ts is exact rational
   * arithmetic — bigint over bigint — so an expansion evaluated at a stated
   * input is ruled with no worker at all, while the expansion itself is a
   * `transform_to_form` the CAS rules. That is the same two-halves shape
   * `polynomial-roots` was taken for, and it is a property of the mathematics
   * rather than of the authoring.
   *
   * `complex-numbers` was the obvious rival — it is the next node this
   * ontology's own `quadratic-formula` points at, and it would have handed an
   * edge back from `algebra-foundations.links`. It was declined on exactly the
   * ground above. `exactValue` has no complex case, so EVERY expression
   * containing the imaginary unit returns null: `(3 + 2i)(3 − 2i)` is
   * unsettleable locally even though its value is the integer 13. Authoring it
   * would have meant extending the named `WORKER_ONLY` list in
   * tests/concepts-logic.mjs and then loosening the ratchet beside it, which
   * asserts that at most three shipped `evaluate` tasks need the worker. That
   * ratchet is a quality floor, and widening a floor to fit new material is
   * the one move that makes the floor stop meaning anything. The concept is
   * worth writing; it wants a complex case in `exactValue` first.
   *
   * ── Why it belongs in THIS subject ───────────────────────────────────────
   *
   * The node sat in `algebra-foundations`, and the area is not where an
   * authored concept goes — the subject is. Its two prerequisites are
   * `polynomial-arithmetic`, which this ontology owns, and `exponent-rules`,
   * which `exponents-and-logarithms` owns, so the choice was between the two
   * and it was not close. The binomial theorem is the general case of
   * `expand-binomials`: that point teaches the four products two brackets owe,
   * and this one teaches what to do when there are five brackets and sixteen
   * products. Filing it with the exponent rules would have claimed the subject
   * matter is powers, when the powers are the bookkeeping and the expansion is
   * the content.
   *
   * It also decided where the two stranded edges could live, which is the part
   * worth recording because `links` cannot express an edge KIND. Homing it
   * here makes `polynomial-arithmetic → binomial-theorem` an ordinary
   * prerequisite below (p15) AND lets the `encompasses` go in beside it (e12).
   * Homed in the other subject, the prerequisite would have been expressible
   * as a `links` entry and the `encompasses` would have been expressible
   * NOWHERE — a `links` entry carries `from`, `to` and `because` and no kind —
   * so the credit edge would have been silently lost. The `exponent-rules`
   * edge is the one that could not come here, and it is a `links` entry on
   * `algebra-foundations`, filed in the area that owned the departing node.
   *
   * ── What it does not cover ───────────────────────────────────────────────
   *
   * No general n. Every worked example and every task is a specific small
   * exponent, read off a specific row, because the closed form needs a
   * factorial and `ALLOWED_FUNCTIONS` in expr.ts has none — so `C(n, k)`
   * cannot be written in a task's `given` at all. The recursive account is not
   * a simplification for the learner's benefit: adding adjacent entries IS how
   * the triangle is built, and it is the account that explains why the
   * coefficients are symmetric. What is genuinely missing is the counting
   * argument for why the entry is a count of subsets, and that is
   * `counting-principles` on the map, which depends on this concept rather
   * than the other way round.
   */
  {
    id: 'binomial-theorem',
    name: 'The binomial theorem',
    subjectId: subject.id,
    scope: {
      id: 'binomial-theorem',
      label: 'The binomial theorem',
      hint: 'binomial theorem pascal triangle binomial coefficient',
      // The map node's pattern, carried across unchanged and deliberately NOT
      // widened to Pascal's triangle. `counting-principles` in
      // atlas-structures.ts already matches `pascal's triangle`, and the
      // article on the triangle is about the counting object rather than about
      // this expansion. Two concepts claiming it would make the longer pattern
      // win the sort in `conceptsInOffering`, which is the mistake the note on
      // `factoring-quadratics`'s pattern records.
      match: /\bbinomial (theorem|coefficient)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'expand-a-binomial-power',
        statement:
          'Expand (a + b)ⁿ for a small n by reading the coefficients off row n of Pascal\'s ' +
          'triangle, rather than multiplying the brackets together one pair at a time.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
      {
        id: 'check-an-expansion-by-substituting',
        statement:
          'Check a claimed expansion by evaluating both sides at a convenient value, and say ' +
          'what one agreeing value does and does not establish.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'pascal-row-is-the-coefficients',
        conceptId: 'binomial-theorem',
        statement:
          'The coefficients of (a + b)ⁿ are row n of Pascal\'s triangle, where each entry is the ' +
          'sum of the two above it. So the coefficients of (a + b)⁵ are row 5, which you get ' +
          'from row 4 by adding adjacent entries — no brackets multiplied at all.',
        position: 1,
        automaticityTarget: 40_000,
        workedExample: {
          problem: 'Expand (x + 2)⁴.',
          subgoals: [
            {
              label: 'Which row, and how long is it?',
              detail:
                'n = 4, so row 4: 1, 4, 6, 4, 1. It comes from row 3 — 1, 3, 3, 1 — by adding ' +
                'each adjacent pair and keeping a 1 at each end.',
              socratic:
                'Row 3 is 1, 3, 3, 1, and each entry of the next row is the sum of the two above ' +
                'it. What are the entries of row 4, and why does it have five of them rather ' +
                'than four?',
            },
            {
              label: 'Pair each coefficient with a power of each part',
              detail:
                'The power of x runs down 4, 3, 2, 1, 0 while the power of 2 runs up 0, 1, 2, 3, ' +
                '4. The two powers add to 4 in every term, because every term takes one part ' +
                'from each of the four brackets.',
              socratic:
                'There are five terms and each carries a power of x and a power of 2. The first ' +
                'is x⁴, which takes no 2 at all. Given that every term draws from all four ' +
                'brackets, what do the two powers have to add to — and so what pair does each of ' +
                'the other four terms carry?',
            },
            {
              label: 'The row entry is not the whole coefficient',
              detail:
                '1·x⁴, 4·x³·2 = 8x³, 6·x²·4 = 24x², 4·x·8 = 32x, 1·16 = 16. The power of 2 ' +
                'contributes a number as well, which is the step that gets dropped.',
              socratic:
                'The middle term is 6·x²·2². The 6 came from the triangle, but it is not what ' +
                'stands in front of x² in the answer. What is, and what did the 2² contribute?',
            },
          ],
          answer: 'x⁴ + 8x³ + 24x² + 32x + 16',
        },
      },
      {
        id: 'one-term-without-the-rest',
        conceptId: 'binomial-theorem',
        statement:
          'Each term of the expansion is its own calculation: one entry of the row, times a ' +
          'power of each part. So a question about a single term never requires expanding the ' +
          'others — which is the whole reason the theorem is worth more than multiplying out.',
        position: 2,
        workedExample: {
          problem: 'What is the term in x² in (2x − 1)⁵?',
          subgoals: [
            {
              label: 'Which term am I after?',
              detail:
                'Only the (2x) part carries an x, so the power of x in a term is the power of ' +
                '(2x) in it. Wanting x² fixes the power of (2x) at 2, and the powers add to 5, so ' +
                'the power of (−1) is 3.',
              socratic:
                'The two parts here are (2x) and (−1), and only one of them carries an x. If the ' +
                'term you want has x², what power does (2x) carry — and what does that leave for ' +
                'the power of (−1)?',
            },
            {
              label: 'Pick the entry that belongs to that split',
              detail:
                'Row 5 is 1, 5, 10, 10, 5, 1, indexed by the power of (−1) counting from zero. ' +
                'The power of (−1) is 3, so the entry is the fourth one: 10.',
              socratic:
                'Row 5 has six entries — 1, 5, 10, 10, 5, 1 — one for each power of (−1) from 0 ' +
                'to 5. You have just fixed that power at 3. Counting from zero, which entry is ' +
                'yours?',
            },
            {
              label: 'Do not leave the 2 or the minus sitting inside the bracket',
              detail:
                '(2x)² = 4x², not x², and (−1)³ = −1, which is where the sign comes from. So the ' +
                'term is 10·4·(−1)·x² = −40x².',
              socratic:
                'You have 10·(2x)²·(−1)³. Two of those three factors contribute a number to the ' +
                'coefficient and one of them also decides its sign. What is the coefficient of ' +
                'x², sign included?',
            },
          ],
          answer: '−40x²',
        },
      },
      {
        id: 'check-by-substituting-a-value',
        conceptId: 'binomial-theorem',
        statement:
          'An expansion claims two expressions are equal at every value, so substituting one ' +
          'convenient value can catch an error — and substituting 1 into (1 + x)ⁿ makes every ' +
          'power equal 1, which leaves the row added up and is why row n sums to 2ⁿ.',
        position: 3,
        workedExample: {
          problem: 'Check that (x + 2)⁴ = x⁴ + 8x³ + 24x² + 32x + 16 by substituting a value.',
          subgoals: [
            {
              label: 'Pick a value that is easy on both sides',
              detail: 'x = 1 makes every power of x equal 1. On the left, (1 + 2)⁴ = 3⁴ = 81.',
              socratic:
                'An expansion is a claim about every value of x, so any single value can catch a ' +
                'mistake. Which value makes every power of x collapse to 1 — and what does the ' +
                'unexpanded left-hand side come to there?',
            },
            {
              label: 'At that value the right-hand side is just the coefficients',
              detail: '1 + 8 + 24 + 32 + 16 = 81. The two sides agree.',
              socratic:
                'At x = 1 each term on the right is nothing but its own coefficient. What do the ' +
                'five coefficients add to?',
            },
            {
              label: 'What one value can and cannot settle',
              detail:
                'Agreement at a point is not a proof. Had 24x² + 32x been written 23x² + 33x, ' +
                'the check at x = 1 would still have given 81. A degree-4 identity is settled by ' +
                'five values, and x = −1 is the cheap second one.',
              socratic:
                'Suppose the 24x² and 32x had been mistyped as 23x² and 33x. Would the check at ' +
                'x = 1 have noticed, and what does your answer say about how much a single ' +
                'agreeing value proves?',
            },
            {
              label: 'The substitution worth remembering',
              detail:
                'Putting a = b = 1 gives (1 + 1)ⁿ = 2ⁿ on one side and the row added up on the ' +
                'other, so row n always sums to 2ⁿ: row 4 is 1 + 4 + 6 + 4 + 1 = 16 = 2⁴.',
              socratic:
                'Row 4 adds to 16 and row 5 adds to 32. Which substitution into (a + b)ⁿ turns ' +
                'the expansion into exactly "add the row up", and so why must that total always ' +
                'be a power of two?',
            },
          ],
          answer: 'Both sides are 81 at x = 1, and row 4 sums to 2⁴ = 16.',
        },
      },
    ],
  },

  {
    id: 'factoring-quadratics',
    name: 'Factoring a quadratic',
    subjectId: subject.id,
    scope: {
      id: 'factoring-quadratics',
      label: 'Factoring quadratics',
      hint: 'factoring quadratic polynomial discriminant',
      // `completing the square` was an alternative here and has been removed:
      // it is its own authored concept now, and leaving it would have made the
      // longer pattern win the sort in `conceptsInOffering` — labelling the
      // article "Completing the square" as primarily about factoring.
      match: /\b(factor\w*|factoris\w*|factoriz\w*|quadratic|discriminant|irreducible)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'factor-over-rationals',
        statement: 'Factor a quadratic over the rationals, or show that it does not factor.',
        taskKinds: ['transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'factor-monic',
        conceptId: 'factoring-quadratics',
        statement:
          'For x² + bx + c you are looking for two numbers that multiply to c and add to b. ' +
          'This is the reverse of expanding two brackets, and the same arithmetic run backwards.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Factor x² − 2x − 15.',
          subgoals: [
            {
              label: 'What pair am I looking for?',
              detail: 'Two numbers whose product is the constant −15 and whose sum is −2.',
              socratic:
                'You have expanded a pair of brackets before, so run that backwards. If ' +
                'x² − 2x − 15 came from two brackets, the −15 was produced by one part of ' +
                'that expansion and the −2x by another. Which part produced each, and so ' +
                'what two things does the pair of numbers have to do at once?',
            },
            {
              label: 'Walk the factor pairs of −15',
              detail: '(1, −15) sums to −14. (−1, 15) sums to 14. (3, −5) sums to −2 — that is the pair.',
              socratic:
                'A product of −15 is negative, which can only happen when the two numbers ' +
                'have opposite signs — and that is why (1, −15) and (−1, 15) are two ' +
                'candidates rather than one. Go along the pairs that multiply to −15: what ' +
                'rules each one out, until one of them is not ruled out?',
            },
            {
              label: 'Write the factors',
              detail: 'x² − 2x − 15 = (x + 3)(x − 5). Expanding it back is the check.',
              socratic:
                'The pair is not the answer yet — the two numbers still have to be placed. ' +
                'Where does each of them sit in the brackets, sign and all, and what could ' +
                'you then do to the brackets you have written that would tell you, without ' +
                'being told, whether you have it right?',
            },
          ],
          answer: '(x + 3)(x − 5)',
        },
      },
      {
        id: 'factor-non-monic',
        conceptId: 'factoring-quadratics',
        statement:
          'When the leading coefficient is not 1, the pair you want multiplies to a·c and ' +
          'still adds to b. Split the middle term with it, then group.',
        position: 2,
        workedExample: {
          problem: 'Factor 2x² + 7x + 3.',
          subgoals: [
            {
              label: 'Which pair now?',
              detail: 'Product a·c = 2·3 = 6, sum b = 7. That pair is 1 and 6.',
              socratic:
                'Run the monic habit first and watch it fail: a pair multiplying to the ' +
                'constant 3 and adding to the middle 7. The pairs for 3 are 1 and 3, or −1 ' +
                'and −3, and those add to 4 and −4. Nothing is wrong with the method — one ' +
                'number in 2x² + 7x + 3 has so far taken no part in it at all. Which number ' +
                'is it, and what should that do to the product the pair has to hit?',
            },
            {
              label: 'Split the middle term',
              detail: '2x² + x + 6x + 3.',
              socratic:
                'Your pair is 1 and 6, and what you know about it besides its product is that ' +
                'it adds to 7 — which is exactly the coefficient standing in the middle of ' +
                '2x² + 7x + 3. What may you therefore write in place of 7x, and why does ' +
                'doing so leave you with the same quadratic you started with?',
            },
            {
              label: 'Group in pairs',
              detail: 'x(2x + 1) + 3(2x + 1). Both groups carry 2x + 1, so it comes out.',
              socratic:
                'Four terms where there were three looks like going backwards, so they had ' +
                'better come apart in a way the three did not. Pull out whatever the first two ' +
                'terms share, then whatever the last two share. That leaves two brackets, one ' +
                'from each pair — what is true of those two, and what does it let you do with ' +
                'the whole expression that you could not do with 2x² + 7x + 3 as it stood?',
            },
          ],
          answer: '(2x + 1)(x + 3)',
        },
      },
      {
        id: 'irreducible-quadratic',
        conceptId: 'factoring-quadratics',
        statement:
          'The discriminant b² − 4ac decides whether a quadratic factors over the reals at ' +
          'all. Negative means irreducible, and that is not a failure to find the factors.',
        position: 3,
        workedExample: {
          problem: 'Does x² + x + 1 factor into real linear factors?',
          subgoals: [
            {
              label: 'What decides it?',
              detail: 'The discriminant b² − 4ac. Real linear factors exist exactly when it is ≥ 0.',
              socratic:
                'Run the pair-hunt on x² + x + 1 and look at what kind of failure it is. The ' +
                'pairs multiplying to 1 are (1, 1) and (−1, −1), which add to 2 and −2, so ' +
                'nothing works — but you tried only whole numbers, and the question asks about ' +
                'real factors. An empty search leaves two quite different situations looking ' +
                'identical: that no such factors exist, and that you were not looking widely ' +
                'enough. What kind of thing would have to decide this instead, if the answer is ' +
                'to be settled outright rather than merely not found?',
            },
            {
              label: 'Compute it',
              detail: '1² − 4·1·1 = −3.',
              socratic:
                'Everything b² − 4ac asks for is already in x² + x + 1, though two of the three ' +
                'coefficients are never written down — the x² and the x each carry one you have ' +
                'to supply for yourself. What are a, b and c here, what does b² − 4ac come to, ' +
                'and given that not one number in x² + x + 1 is negative, which part of that ' +
                'expression is able to make the result negative anyway?',
            },
            {
              label: 'Read it',
              detail:
                '−3 < 0, so there are no real roots and therefore no real linear factors. ' +
                'The quadratic is irreducible over the reals.',
              socratic:
                'The value came out −3, and that is a fact about x² + x + 1 rather than about ' +
                'how hard you looked. You began with a search that could not tell absent ' +
                'factors from unfound ones. How much does a value of −3 settle about the real ' +
                'linear factors of x² + x + 1, and is what you can now say about them a verdict ' +
                'or still only a record of what you did not find?',
            },
          ],
          answer: 'No — the discriminant is −3, so it is irreducible over the reals.',
        },
      },
    ],
  },

  {
    id: 'polynomial-division',
    name: 'Dividing one polynomial by another',
    subjectId: subject.id,
    scope: {
      id: 'polynomial-division',
      label: 'Polynomial division',
      hint: 'polynomial long division remainder theorem',
      match: /\b(polynomial (?:long )?division|synthetic division|remainder|quotient|euclidean division|divisor)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'divide-with-remainder',
        statement: 'Divide one polynomial by another and name the quotient and remainder.',
        taskKinds: ['transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'long-division',
        conceptId: 'polynomial-division',
        statement:
          'Divide leading term by leading term, subtract, repeat. Stop when the degree of ' +
          'what is left drops below the degree of the divisor.',
        position: 1,
        workedExample: {
          problem: 'Divide x² + 3x + 5 by x + 1.',
          subgoals: [
            {
              label: 'First quotient term?',
              detail: 'Leading over leading: x²/x = x.',
              socratic:
                'You may multiply x + 1 by anything you like, and the one thing in ' +
                'x² + 3x + 5 that x + 1 cannot reach as it stands is the x² — nothing in the ' +
                'divisor goes past degree 1. So the x² has to be manufactured. What must ' +
                'x + 1 be multiplied by for the product to carry an x², and given that the 1 ' +
                'in x + 1 raises nobody\'s degree, which single term of the divisor is doing ' +
                'all the work in that decision?',
            },
            {
              label: 'Subtract x(x + 1)',
              detail: 'x² + 3x + 5 − (x² + x) = 2x + 5.',
              socratic:
                'x(x + 1) comes to x² + x, and your dividend opens with an x² of its own — ' +
                'those are the only degree-2 terms anywhere in the problem. What is left of ' +
                'x² + 3x + 5 once x² + x is taken away from it, and why was it worth spending ' +
                'a step on the x² when the 3x and the 5 were never the difficulty?',
            },
            {
              label: 'Repeat, then know when to stop',
              detail: '2x/x = 2; 2x + 5 − (2x + 2) = 3. Degree 0 is below degree 1, so stop.',
              socratic:
                'What you now hold is the same kind of problem as the one you began with — ' +
                'same divisor, lower degree — so the two moves you have just made apply to it ' +
                'unchanged. Make them. You end on a bare number, and asking x to divide a bare ' +
                'number would call for a negative power of x, which no multiple of x + 1 can ' +
                'supply. What is the comparison between what is left and x + 1 that tells you ' +
                'this is the end, and would that same comparison have let you stop one step ' +
                'earlier at 2x + 5?',
            },
            {
              label: 'Write the result as an identity',
              detail: 'x² + 3x + 5 = (x + 1)(x + 2) + 3.',
              socratic:
                '"x + 2, remainder 3" is a report of what you did rather than a statement about ' +
                'x² + 3x + 5, and a remainder detached from the thing it was left over from says ' +
                'nothing on its own. Every subtraction along the way was reversible, so the ' +
                'three pieces go back together. What is the single line that puts x + 1, what you ' +
                'divided into it, and what was left over into one equation — and what could you ' +
                'do to that line, using only the expanding you already have, to settle whether ' +
                'it holds for every x rather than merely recording your steps?',
            },
          ],
          answer: 'x + 2, remainder 3 — that is, x + 2 + 3/(x + 1)',
        },
      },
      {
        id: 'improper-first',
        conceptId: 'polynomial-division',
        statement:
          'Partial fractions apply only to a proper fraction. If the numerator degree is ' +
          'not below the denominator degree, divide first — the polynomial part is not ' +
          'something a sum of A/(…) terms can produce.',
        position: 2,
        workedExample: {
          problem: 'Why can (x² + 3x + 5)/(x + 1) not be written as A/(x + 1)?',
          subgoals: [
            {
              label: 'Compare degrees',
              detail:
                'Numerator degree 2, denominator degree 1. The quotient grows without bound ' +
                'as x grows; A/(x + 1) tends to 0.',
              socratic:
                'A stands for one fixed number, so A/(x + 1) is that number spread over a ' +
                'divisor that only grows — put x = 1000 into it, then put x = 1000 into ' +
                '(x² + 3x + 5)/(x + 1). There is also a way to see the same thing without ' +
                'substituting anything, by reading the highest power on the top against the ' +
                'highest power on the bottom. What does each of the two expressions do as x ' +
                'runs away, and which comparison of the two degrees is the one that told you ' +
                'so in advance?',
            },
            {
              label: 'What the division buys',
              detail: 'Dividing first gives x + 2 + 3/(x + 1): a polynomial part plus a proper fraction.',
              socratic:
                'You have already divided these very two polynomials and found x + 2 with 3 ' +
                'left over — as an identity, x² + 3x + 5 = (x + 1)(x + 2) + 3. Divide that ' +
                'identity through by x + 1 using only the cancelling you already do, and take ' +
                'what comes out as two pieces rather than one. Which piece supplies the growth ' +
                'a lone A/(x + 1) could never produce, and in the piece that is still a ' +
                'fraction, which way round do the top and bottom degrees come out now?',
            },
            {
              label: 'The rule',
              detail: 'Divide until the numerator degree is strictly below the denominator degree.',
              socratic:
                'It is tempting to settle on "divide when the numerator degree is the bigger ' +
                'one", but try (x + 3)/(x + 1), where the two degrees are equal — put ' +
                'x = 1000 into that and ask whether it is heading for 0 the way every ' +
                'A/(x + 1) must. So what test on the two degrees does a fraction have to pass ' +
                'before a sum of A/(…) terms can be attempted at all, and is the moment you ' +
                'stop dividing a new rule or the one you already used to end the long division?',
            },
          ],
          answer: 'Because the fraction is improper. Dividing first gives x + 2 + 3/(x + 1).',
        },
      },
    ],
  },

  {
    id: 'rational-domain',
    name: 'The domain of a rational expression',
    subjectId: subject.id,
    scope: {
      id: 'rational-domain',
      label: 'Domain and excluded points',
      hint: 'domain of a rational function excluded point',
      // No `match`: see `fidelity` below.
    },
    fidelity: 'guided',
    caveat:
      'Wikipedia has no field for "is about the domain of a rational expression", and no ' +
      'category decides it — the articles that cover this are about functions, about ' +
      'division by zero, or about removable singularities, and none of them is wrong. So ' +
      'this concept steers the search and the instruction and filters nothing. Expect it to ' +
      'lean, not to obey.',
    objectives: [
      {
        id: 'name-excluded-points',
        statement: 'Name every point a rational expression excludes, and say why.',
        taskKinds: ['state', 'justify', 'evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'excluded-points',
        conceptId: 'rational-domain',
        statement:
          'A rational expression is undefined exactly where its denominator is zero. ' +
          'Finding the domain is therefore a factoring problem, not a new technique.',
        position: 1,
        workedExample: {
          problem: 'What is the domain of (x + 3)/(x² − 2x − 15)?',
          subgoals: [
            {
              label: 'Where is it undefined?',
              detail: 'Exactly where the denominator vanishes.',
              socratic:
                'Putting a number into this expression means doing three things with it: ' +
                'working out x + 3, working out x² − 2x − 15, and then one division. The ' +
                'first two are polynomials, and a polynomial never refuses a number — ' +
                'whatever you feed it, it hands something back. So only the third step is ' +
                'capable of failing at all. Which part of the fraction does that leave you ' +
                'having to interrogate, and what exactly would it have to be doing at some ' +
                'value of x for the expression as a whole to have no value there?',
            },
            {
              label: 'Solve the denominator',
              detail: 'x² − 2x − 15 = (x + 3)(x − 5), which is zero at x = −3 and x = 5.',
              socratic:
                'What you are holding now is a condition to satisfy rather than an ' +
                'expression to tidy: x² − 2x − 15 = 0. Nothing about it is new — it is the ' +
                'same quadratic you would have factored had nobody put it underneath a ' +
                'fraction. Factor it, and then notice what you are looking at: a product of ' +
                'two things set equal to zero, which is a far stronger piece of information ' +
                'than a product set equal to, say, 6. What are the two factors, and what ' +
                'property of zero in particular lets you trade the one quadratic equation ' +
                'for two linear ones?',
            },
            {
              label: 'State the domain',
              detail:
                'All real x except −3 and 5. Note that x = −3 is excluded even though it also ' +
                'makes the numerator zero — 0/0 is not a value.',
              socratic:
                'Both of the values you found are ruled out, but one of them is doing ' +
                'something extra — put x = −3 into the top of the fraction as well, and read ' +
                'what the whole expression says there, top and bottom together. That pattern ' +
                'tempts a learner into treating it as a cancellation that rescues the point. ' +
                'What would x = −3 have to have in order to belong to the domain, and once ' +
                'you have settled whether it has it, which x are left?',
            },
          ],
          answer: 'All real x with x ≠ −3 and x ≠ 5.',
        },
      },
      {
        id: 'cancelling-keeps-the-hole',
        conceptId: 'rational-domain',
        statement:
          'Cancelling a factor changes the formula and not the domain. The cancelled point ' +
          'stays excluded, so the two expressions are equal on the common domain and are ' +
          'not the same function.',
        position: 2,
        workedExample: {
          problem: 'Is (x + 3)/((x + 3)(x − 5)) the same function as 1/(x − 5)?',
          subgoals: [
            {
              label: 'Simplify the formula',
              detail: 'The factor x + 3 cancels, leaving 1/(x − 5).',
              socratic:
                'Written out in factors, the top of this fraction is not merely similar to ' +
                'part of the bottom — it is one of the bottom\'s two factors, standing there ' +
                'on its own. Cancelling it is the same move as turning 6/(6 · 7) into 1/7, ' +
                'and it is worth saying out loud which operation that move actually is, done ' +
                'to the top and the bottom alike. Which factor goes, what single expression ' +
                'are you left holding, and what did you have to take for granted about ' +
                'x + 3 in order to be allowed to do that to it?',
            },
            {
              label: 'Compare domains',
              detail:
                'The first is undefined at x = −3. The second is perfectly defined there, with ' +
                'value −1/8.',
              socratic:
                'Set the cancelling aside for a moment and feed x = −3 to each of the two ' +
                'expressions exactly as it is written. In (x + 3)/((x + 3)(x − 5)) that asks ' +
                'you to work out a top, work out a bottom, and divide the one by the other; ' +
                'in 1/(x − 5) it asks you to divide 1 by a number you can name. Those are ' +
                'not the same demand, and only one of them can be met. What does each ' +
                'expression report back at x = −3, and so which real numbers does each of ' +
                'them accept?',
            },
            {
              label: 'The verdict, stated precisely',
              detail:
                'Same formula after cancelling, different functions. They agree on the common ' +
                'domain, which is every real x except −3 and 5.',
              socratic:
                'You now have two findings that pull against each other: after the ' +
                'cancelling the same formula does the calculating in both, and yet there is ' +
                'a number one of them accepts and the other refuses. Deciding the question ' +
                'as asked means first settling what has to match before two functions count ' +
                'as one and the same — whether a shared rule for calculating is enough by ' +
                'itself, or whether something else travels with a function and has to agree ' +
                'too. Once you have settled that, what is your verdict here, and what is the ' +
                'strongest true statement left about how these two are related — holding for ' +
                'exactly which x?',
            },
          ],
          answer: 'No. They agree on the common domain only, which excludes x = −3.',
        },
      },
    ],
  },

  {
    id: 'simplifying-rational',
    name: 'Simplifying a rational expression',
    subjectId: subject.id,
    scope: {
      id: 'simplifying-rational',
      label: 'Simplifying rational expressions',
      hint: 'rational function cancel common factor lowest terms',
      match: /\b(rational (?:function|expression)|lowest terms|cancel\w*|common factor|reduc\w* fraction|removable singularit)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'reduce-to-lowest-terms',
        statement: 'Reduce a rational expression to lowest terms and retain the conditions it cost.',
        taskKinds: ['transform_to_form', 'state'],
      },
    ],
    knowledgePoints: [
      {
        id: 'cancel-common-factors',
        conceptId: 'simplifying-rational',
        statement:
          'Factor the top and the bottom, cancel what they share, and write down the ' +
          'conditions the cancelled factors cost you.',
        position: 1,
        workedExample: {
          problem: 'Simplify (x² − 2x − 15)/(x² − 25).',
          subgoals: [
            {
              label: 'Factor both',
              detail: '(x + 3)(x − 5) over (x − 5)(x + 5).',
              socratic:
                'Nothing in this fraction can be struck out as it stands, and the reason is ' +
                'worth naming before you start: cancelling is division, and division needs a ' +
                'multiplication already standing there to take hold of. The top is a sum of ' +
                'three terms and the bottom a difference of two, so neither is yet presented ' +
                'as anything times anything. One of the two is a standard pattern you should ' +
                'recognise on sight rather than hunt for by trial, and the other wants the ' +
                'pair-of-numbers search you already use on a monic quadratic. What do you ' +
                'have to do to x² − 2x − 15 and to x² − 25 before cancelling is even a ' +
                'question that can be asked, and what does each of them become?',
            },
            {
              label: 'Cancel the common factor',
              detail: 'x − 5 appears in both, so it cancels.',
              socratic:
                'You are now looking at four brackets rather than two sums: (x + 3)(x − 5) on ' +
                'the top and (x − 5)(x + 5) on the bottom. Compare them as whole brackets — ' +
                'x + 3 and x + 5 are not the same thing however alike they look — so there is ' +
                'at most one match to find. Striking that match out is not an erasure either; ' +
                'it is dividing the top and the bottom by one and the same expression, exactly ' +
                'as 35/(7 · 9) becomes 5/9 by dividing both by 7. Which bracket is the match, ' +
                'what single fraction does that leave you holding, and what did you have to ' +
                'take for granted about that bracket in order to be allowed to divide by it?',
            },
            {
              label: 'Record what the domain lost',
              detail:
                'x ≠ 5 from the factor that cancelled, and x ≠ −5 from the one that remains. ' +
                'The first condition is invisible in the answer and has to be carried.',
              socratic:
                'The expression you were handed refuses two values of x, and you can read both ' +
                'of them straight off its factored bottom. Now put the same question to the ' +
                'fraction you have arrived at: how many of those two does it refuse? That gap ' +
                'is the whole difficulty of this step — the cancelling was legitimate, and yet ' +
                '(x + 3)/(x + 5) standing on its own is not a true replacement for what you ' +
                'started with. Which of the two values has gone out of sight, which one is ' +
                'still on display in the answer, and what therefore has to travel alongside ' +
                '(x + 3)/(x + 5) before the two say the same thing about every real number?',
            },
          ],
          answer: '(x + 3)/(x + 5), for x ≠ 5 and x ≠ −5',
        },
      },
      {
        id: 'terms-are-not-factors',
        conceptId: 'simplifying-rational',
        statement:
          'Cancelling means dividing top and bottom by the same factor. A term of a sum is ' +
          'not a factor of it, so nothing in x + 3 cancels against anything in x + 5.',
        position: 2,
        workedExample: {
          problem: 'Is (x + 3)/(x + 5) equal to 3/5?',
          subgoals: [
            {
              label: 'What was cancelled?',
              detail: 'An x out of a sum — but x is a term there, not a factor.',
              socratic:
                'Somebody has got from (x + 3)/(x + 5) to 3/5, and before judging whether they ' +
                'were allowed to, say what they actually did: set the two fractions side by ' +
                'side and name the thing that stood in the first and is gone from the second, ' +
                'on the top and on the bottom alike. Then hold that move beside a cancellation ' +
                'nobody would object to — the (x − 5) coming out of ' +
                '(x + 3)(x − 5)/((x − 5)(x + 5)). There the bracket that cancelled was joined ' +
                'to the bracket beside it by one operation; here the thing struck out is joined ' +
                'to the 3 by a different one. What was struck out, and how does its standing ' +
                'inside x + 3 differ from the standing (x − 5) had in that other fraction?',
            },
            {
              label: 'Why that is illegal',
              detail: 'Cancellation divides both parts by the same thing, and x + 3 is not x times anything.',
              socratic:
                'You have named the move: an x gone from the top and an x gone from the bottom. ' +
                'Now make the charge precise, because calling it illegal is not yet a reason. ' +
                'Striking a thing out of the top is dividing the top by it — that is exactly ' +
                'what makes an honest cancellation honest — so put the claim to the test on ' +
                'the top alone. If dividing x + 3 by x really left 3 behind, then x + 3 would ' +
                'have to be x multiplied by 3. Multiply those two and see whether you land on ' +
                'x + 3. What does x multiplied by 3 actually come to, and which requirement of ' +
                'cancelling does striking the x out of x + 3 therefore fail?',
            },
            {
              label: 'Test it',
              detail: 'At x = 1 the expression is 4/6 = 2/3, and 3/5 is not 2/3.',
              socratic:
                'Everything so far has been structural, and structure is the real reason. But ' +
                'there is a cheaper and more final way to settle a claim that two expressions ' +
                'are equal, and it is worth having in hand: an equality between expressions is ' +
                'a promise about every value of x at once, so it can be examined one value at ' +
                'a time. Take the easiest value you can — x = 1 — work out (x + 3)/(x + 5) ' +
                'there, and set that against 3/5. What does each side come to, and how much of ' +
                'the original claim does a single disagreement of that kind settle?',
            },
          ],
          answer: 'No. Cancelling needs a common factor, and a term of a sum is not one.',
        },
      },
    ],
  },

  {
    id: 'combining-rational',
    name: 'Adding rational expressions',
    subjectId: subject.id,
    scope: {
      id: 'combining-rational',
      label: 'Combining fractions',
      hint: 'common denominator adding algebraic fractions',
      match: /\b(common denominator|least common multiple|lcm|adding fractions|algebraic fraction|single fraction)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'to-one-fraction',
        statement: 'Write a sum of rational expressions as a single fraction.',
        taskKinds: ['transform_to_form'],
      },
    ],
    knowledgePoints: [
      {
        id: 'combine-two',
        conceptId: 'combining-rational',
        statement:
          'Find a denominator both divide, re-express each fraction over it, then add the ' +
          'numerators. The denominators are never added.',
        position: 1,
        automaticityTarget: 45_000,
        workedExample: {
          problem: 'Write 1/(x + 3) + 2/(x − 5) as one fraction.',
          subgoals: [
            {
              label: 'What denominator do both divide?',
              detail: '(x + 3)(x − 5). The factors are distinct, so their product is the least one.',
              socratic:
                'As they stand these two cannot be added at all, and the reason is the same ' +
                'one that stops you adding a quarter to a sixth: a sum of fractions only ' +
                'collapses into one when the two are counting in the same units, and 1/4 + 1/6 ' +
                'goes nowhere until both are rewritten over twelfths. So the first thing to ' +
                'settle is not the answer but what you are going to rewrite these two over — ' +
                'and whatever you choose, each of x + 3 and x − 5 has to divide it exactly, or ' +
                'that one cannot be re-expressed over it. Now look at the two denominators ' +
                'together: they share no factor, and neither is a multiple of the other. What ' +
                'is the smallest expression both of them divide, and what does their having ' +
                'nothing in common tell you about why you cannot manage with anything smaller?',
            },
            {
              label: 'Re-express each over it',
              detail: '1/(x + 3) = (x − 5)/D and 2/(x − 5) = 2(x + 3)/D, where D = (x + 3)(x − 5).',
              socratic:
                'You have fixed on (x + 3)(x − 5) as the denominator both fractions are going ' +
                'to sit over, and each one now has to be rewritten so that it does — without ' +
                'its value changing, because rewriting a fraction is not the same as altering ' +
                'it. The licence for that is the one that turns 1/4 into 3/12: multiply the top ' +
                'and the bottom by the same thing and the fraction is untouched, whereas ' +
                'multiplying only the bottom makes it a different number. So take each fraction ' +
                'in turn, ask what its denominator is short of, and then do that same thing to ' +
                'its numerator as well. Watch the second one especially — the multiplier has to ' +
                'act on the whole of its numerator, not sit beside it. What is each fraction ' +
                'short of, and what numerator does each of them end up carrying once both are ' +
                'written over the common denominator?',
            },
            {
              label: 'Add the numerators',
              detail: '(x − 5) + 2(x + 3) = x − 5 + 2x + 6 = 3x + 1.',
              socratic:
                'Both fractions now sit over one and the same denominator, which is the whole ' +
                'point of the last two steps: it turns the addition from a problem into a ' +
                'single stroke, the way three twelfths and four twelfths make seven twelfths. ' +
                'Attend to what the twelfths do and do not do in that sum, because the same ' +
                'thing happens here, and the commonest wrong answer to a question like this one ' +
                'has the two denominators combined somehow along the way. What you are adding ' +
                'is the numerators, and one of them is still carrying a bracket with a 2 ' +
                'outside it, which has to be cleared before the two can be collected into one ' +
                'expression. What does that second numerator come to once the bracket is ' +
                'multiplied out, what do the two numerators then add to, and what is standing ' +
                'underneath the single fraction you finish with?',
            },
          ],
          answer: '(3x + 1)/((x + 3)(x − 5))',
        },
      },
    ],
  },

  {
    id: 'partial-fractions-linear',
    name: 'Partial fractions: distinct linear factors',
    subjectId: subject.id,
    scope: {
      id: 'partial-fractions-linear',
      label: 'Partial fractions (distinct linear)',
      hint: 'partial fraction decomposition linear factors',
      match: /\b(partial fraction\w*|heaviside cover-?up|decompos\w* into fractions)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decompose-distinct-linear',
        statement:
          'Decompose a proper fraction whose denominator is a product of distinct linear ' +
          'factors, and verify the decomposition by recombining it.',
        taskKinds: ['transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'decompose-distinct',
        conceptId: 'partial-fractions-linear',
        statement:
          'One term per distinct linear factor, each with a constant numerator. Clear the ' +
          'denominators and the unknowns fall out when you substitute the roots.',
        position: 1,
        workedExample: {
          problem: 'Decompose (3x + 1)/((x + 3)(x − 5)).',
          subgoals: [
            {
              label: 'What shape is the answer?',
              detail: 'A/(x + 3) + B/(x − 5), with A and B constants. One term per distinct factor.',
              socratic:
                'What is wanted here is an undoing, so start from what the doing looks like: ' +
                'when two fractions over different denominators are added, each numerator is ' +
                'multiplied by the other denominator and the sum lands over the product of the ' +
                'two. The fraction in front of you sits over exactly such a product, ' +
                '(x + 3)(x − 5), whose two factors share nothing — so it is the kind of thing ' +
                'an addition produces, and the work is to name the two fractions that produced ' +
                'it. Fix their shape before computing anything, because everything after this ' +
                'step is filling that shape in. So: what denominator does each of the two ' +
                'fractions have to carry, and then count — the numerator 3x + 1 has two ' +
                'coefficients in it, so how many unknown numbers do the two pieces need between ' +
                'them, and what does that settle about whether a plain constant on top of each ' +
                'is too little, too much, or exactly right?',
            },
            {
              label: 'Clear the denominators',
              detail:
                'Multiply through by (x + 3)(x − 5): 3x + 1 = A(x − 5) + B(x + 3). This must hold ' +
                'for every x, which is what licenses the next step.',
              socratic:
                'You are holding a claimed equality between the fraction you were given and a ' +
                'sum of two fractions with unknown constants on top, and there is no getting at ' +
                'those constants while they sit underneath denominators. The move is the one ' +
                'that clears fractions out of any equality: multiply both sides by something ' +
                'every denominator divides, and here that can only be (x + 3)(x − 5) itself. It ' +
                'has three places to act — the left-hand side, the A term and the B term — and ' +
                'in each of them a denominator does not vanish into nothing but into whichever ' +
                'factor of the product it had not accounted for. Work those three out and write ' +
                'the line down, then stand back from it: there is not a denominator left ' +
                'anywhere in it, and both sides are plain polynomials. What does each of the ' +
                'three terms come to, and for how many values of x does the line you have ' +
                'written have to hold?',
            },
            {
              label: 'Choose x to isolate one unknown at a time',
              detail: 'x = 5 gives 16 = 8B, so B = 2. x = −3 gives −8 = −8A, so A = 1.',
              socratic:
                'The line in front of you carries both unknowns at once, which looks like a ' +
                'reason to multiply everything out and match coefficients — and that would ' +
                'work. But notice how A and B are each placed: A is multiplied by (x − 5) and ' +
                'nothing else, B by (x + 3) and nothing else. A bracket like that has no fixed ' +
                'value; it depends on the x you put in, and for a bracket of that form there is ' +
                'one value of x that makes it come to nothing at all. Whatever is multiplying ' +
                'nothing then leaves the line, unknown and all, and you are left looking at the ' +
                'other unknown on its own. So choose the two values of x worth trying here and ' +
                'take them one at a time, working out the left-hand side as well as the right. ' +
                'Which value empties which bracket, what one-unknown statement does each ' +
                'substitution leave standing, and what do A and B come to?',
            },
            {
              label: 'Check by recombining',
              detail:
                '1/(x + 3) + 2/(x − 5) = ((x − 5) + 2(x + 3))/D = (3x + 1)/D. This is the previous ' +
                'concept run backwards, which is why doing this exercises that.',
              socratic:
                'You have two constants, but they came out of a substitution, and a slip in the ' +
                'arithmetic there would have handed you two numbers just as confidently as the ' +
                'right ones did. So put the two fractions you have just written back together ' +
                'before you accept them: a common denominator, each numerator multiplied by ' +
                'whichever factor its own denominator was missing, then the numerators added — ' +
                'which is the previous concept at work, and the reason practising this ' +
                'practises that. Mind what you have to land on, too. The decomposition claims ' +
                'that your sum and the fraction you started from are the same expression, so ' +
                'recombining carries that claim out in full rather than sampling it. What do ' +
                'the two numerators add to over the common denominator, how does that stand ' +
                'against the 3x + 1 you began with, and why does getting it back settle the ' +
                'whole of the claim when trying a single value of x could only ever have ' +
                'overturned it?',
            },
          ],
          answer: '1/(x + 3) + 2/(x − 5)',
        },
      },
      {
        id: 'why-substitution-is-legal',
        conceptId: 'partial-fractions-linear',
        statement:
          'After clearing denominators you have an identity in x, not an equation to solve. ' +
          'That is why you may substitute any value — including the roots, where the ' +
          'original fraction was undefined.',
        position: 2,
        workedExample: {
          problem: 'Why is substituting x = 5 allowed when the original expression is undefined there?',
          subgoals: [
            {
              label: 'What was multiplied away',
              detail:
                'The identity 3x + 1 = A(x − 5) + B(x + 3) has no denominator. Both sides are ' +
                'polynomials, defined everywhere.',
              socratic:
                'Two expressions are in play here and the objection only reaches one of them. ' +
                'The fraction you were handed, (3x + 1)/((x + 3)(x − 5)), carries (x − 5) ' +
                'underneath, and at x = 5 that denominator comes to nothing, so the fraction ' +
                'genuinely has no value there — about that much the objection is right. But ' +
                'x = 5 was never put into that fraction. It was put into the line the previous ' +
                'point produced, 3x + 1 = A(x − 5) + B(x + 3), and the multiplying-through that ' +
                'produced that line did not destroy the awkward factors so much as move them. ' +
                'So read it again looking for one thing only, division: where in that line does ' +
                'a denominator appear at all, what kind of expression does that leave standing ' +
                'on each side, and at which values of x does each side have a value?',
            },
            {
              label: 'Why the identity is still the right one',
              detail:
                'Two polynomials agreeing at every point except finitely many agree everywhere — ' +
                'their difference is a polynomial with infinitely many roots, so it is zero.',
              socratic:
                'Granting that both sides are polynomials does not finish the argument, because ' +
                'of how that line was come by. Multiplying an equality through by ' +
                '(x + 3)(x − 5) is a legitimate move only where that product is not zero — at ' +
                'x = 5 and at x = −3 it is multiplying by nothing, which establishes nothing — ' +
                'so what you are entitled to so far is that the two polynomials agree at every ' +
                'x apart from those two, and the two values you most want to use are exactly ' +
                'the ones left out. For most pairs of functions that gap would be fatal. Here ' +
                'the way to close it is to stop comparing the two sides and subtract one from ' +
                'the other, because the difference is a single polynomial and you already know ' +
                'a great deal about where it takes the value zero. At how many values of x do ' +
                'you know it vanishes, what is the highest degree it could have, how many roots ' +
                'can a polynomial of that degree have unless it is the zero polynomial, and ' +
                'what does the comparison force about the two sides at x = 5?',
            },
            {
              label: 'What this does not license',
              detail:
                'It does not make the original expression defined at x = 5. The decomposition ' +
                'inherits that exclusion and carries it.',
              socratic:
                'The identity does hold at x = 5, then, and reading B off it is sound. It is ' +
                'worth being exact about how far that reaches, because the easy over-reading is ' +
                'that the objection was simply mistaken, and it was not. Nothing in the ' +
                'argument went back and gave (3x + 1)/((x + 3)(x − 5)) a value at x = 5; what ' +
                'was shown is that a different expression, the cleared line, is defined there ' +
                'and may be used to pin down A and B. Now turn to the answer those constants ' +
                'build, 1/(x + 3) + 2/(x − 5), and try putting x = 5 into that. At which values ' +
                'of x is the decomposition itself undefined, how does that set stand against ' +
                'the excluded points of the fraction you started from, and so when the ' +
                'decomposition is said to equal that fraction, over which x does the claim run?',
            },
          ],
          answer:
            'Because clearing denominators produced a polynomial identity, which holds at every x — ' +
            'including the points the original fraction excluded.',
        },
      },
    ],
  },

  {
    id: 'partial-fractions-repeated',
    name: 'Partial fractions: repeated linear factors',
    subjectId: subject.id,
    scope: {
      id: 'partial-fractions-repeated',
      label: 'Partial fractions (repeated)',
      hint: 'partial fractions repeated factor multiplicity',
      match: /\b(partial fraction\w*|repeated (?:linear )?factor|multiplicit)\w*/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decompose-repeated',
        statement: 'Decompose a proper fraction with a repeated linear factor.',
        taskKinds: ['transform_to_form'],
      },
    ],
    knowledgePoints: [
      {
        id: 'one-term-per-power',
        conceptId: 'partial-fractions-repeated',
        statement:
          'A factor repeated n times contributes n terms, one for each power from 1 to n. ' +
          'A single term over the highest power has too few unknowns to match.',
        position: 1,
        workedExample: {
          problem: 'Decompose (x + 4)/(x + 1)².',
          subgoals: [
            {
              label: 'What shape?',
              detail:
                'A/(x + 1) + B/(x + 1)². Not B/(x + 1)² alone: the numerator x + 4 has two ' +
                'coefficients to match and one unknown cannot match two.',
              socratic:
                'The rule carried over from the distinct case was one term per factor with a ' +
                'constant on top, and here that rule has almost nothing to work with: the ' +
                'denominator (x + 1)² is built out of a single distinct factor, so read ' +
                'literally it offers you one term, B/(x + 1)², and stops. Test that offer by ' +
                'counting rather than by feel. A single constant on top is one number, and the ' +
                'only number you get to choose, whereas the numerator you have to reproduce, ' +
                'x + 4, is pinned down by two — the coefficient of x and the constant term — ' +
                'and both have to come out right. So count each side of that: how many numbers ' +
                'does the one-term shape let you pick, how many does x + 4 require you to hit, ' +
                'and what does the shortfall settle about B/(x + 1)² standing alone? Then look ' +
                'for more room without reaching for factors the denominator does not have. ' +
                '(x + 1)² has a divisor smaller than itself, and a fraction over that divisor ' +
                'would still combine back over (x + 1)² rather than introducing anything new ' +
                'underneath. Which denominators does that make available to you, and how many ' +
                'unknown constants does the shape then carry against the two the numerator ' +
                'demands?',
            },
            {
              label: 'Clear the denominators',
              detail: 'x + 4 = A(x + 1) + B.',
              socratic:
                'Clearing fractions is the same move as in the distinct case — multiply the ' +
                'whole equality by something every denominator divides — and with (x + 1) and ' +
                '(x + 1)² underneath, the smallest such thing is (x + 1)² itself. What is worth ' +
                'watching is that the three places it acts do not all respond alike. In the ' +
                'distinct case every term lost its own denominator and picked up the other ' +
                'factor, so each one came out carrying something; here the two denominators are ' +
                'a factor and that same factor squared, so the multiplier is used up completely ' +
                'against one of them and only partly against the other. Work through the three ' +
                'places — the left-hand side, the A term and the B term — keeping track in each ' +
                'of how much of (x + 1)² is spent cancelling and how much is left over beside ' +
                'the unknown. What does each of the three come to, which of A and B ends up ' +
                'with a bracket next to it and which is left bare, and for how many values of x ' +
                'does the line you have written have to hold?',
            },
            {
              label: 'Solve',
              detail: 'x = −1 gives B = 3. Comparing the coefficients of x gives A = 1.',
              socratic:
                'The substitution trick from the distinct case still has one move left in it, ' +
                'but only one. There A sat beside (x − 5) and B beside (x + 3): two different ' +
                'brackets with two different roots, so each unknown had a value of x that swept ' +
                'the other away. Look at the line in front of you now and notice that only one ' +
                'of the unknowns is multiplied by a bracket at all. So there is exactly one ' +
                'value of x that empties anything, and it settles one constant while leaving ' +
                'the other exactly where it was — the bare term has no bracket to be caught by, ' +
                'and no choice of x will remove it. Take that substitution first and see which ' +
                'of the two it hands you. Then for the one still outstanding, stop trying to ' +
                'make terms vanish and use what the line is: an identity, true for every x, and ' +
                'two polynomials that agree for every x must agree term by term, so the single ' +
                'x on the left has to be accounted for by whatever carries an x on the right. ' +
                'Which value of x do you substitute and which constant does it give, what must ' +
                'the other constant be once you match the coefficients of x on the two sides, ' +
                'and what does the constant term then offer you as a check you have not already ' +
                'spent?',
            },
          ],
          answer: '1/(x + 1) + 3/(x + 1)²',
        },
      },
    ],
  },

  {
    id: 'partial-fractions-quadratic',
    name: 'Partial fractions: an irreducible quadratic factor',
    subjectId: subject.id,
    scope: {
      id: 'partial-fractions-quadratic',
      label: 'Partial fractions (irreducible quadratic)',
      hint: 'partial fractions irreducible quadratic factor',
      match: /\b(partial fraction\w*|irreducible quadratic|quadratic factor)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decompose-with-quadratic',
        statement:
          'Decompose a proper fraction with an irreducible quadratic factor, and justify the ' +
          'linear numerator.',
        taskKinds: ['transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'linear-numerator',
        conceptId: 'partial-fractions-quadratic',
        statement:
          'An irreducible quadratic factor takes a linear numerator, Bx + C. A constant ' +
          'numerator carries one unknown where the factor needs two.',
        position: 1,
        workedExample: {
          problem: 'Decompose (2x + 1)/((x − 1)(x² + 1)).',
          subgoals: [
            {
              label: 'Is x² + 1 actually irreducible?',
              detail: 'Discriminant 0² − 4·1·1 = −4 < 0, so yes over the reals. Check before assuming.',
              socratic:
                'Every denominator so far arrived already broken into linear pieces, and the ' +
                'method leaned on that twice over: one term per factor, and a root of each ' +
                'factor to substitute. This one offers (x − 1), which is of that kind, and ' +
                'x² + 1, which at least is not. Before deciding what sort of fraction may sit ' +
                'over it, settle whether it is a new case at all, because the two outcomes lead ' +
                'different ways and nothing later will warn you if you guessed. Were it to split ' +
                'into real linear factors, you would have no new method to learn — just the ' +
                'distinct-linear one with three brackets instead of two, and a root apiece. Were ' +
                'it not to split, there is no real root in it for a substitution to use and the ' +
                'shape itself has to change. You already have a way of telling those apart that ' +
                'does not require finding any factors: the quadratic under factoring that you ' +
                'could not break was diagnosed from its coefficients alone. Apply that to ' +
                'x² + 1, minding that the coefficient of x is zero rather than missing. What do ' +
                'the three coefficients come to, what does the test built from them return, what ' +
                'does that settle about factors over the reals, and why is this worth a ' +
                'calculation rather than a glance at an expression that looks unbreakable?',
            },
            {
              label: 'What shape?',
              detail:
                'A/(x − 1) + (Bx + C)/(x² + 1). Three unknowns for a numerator with up to three ' +
                'coefficients to match.',
              socratic:
                'The counting you did for the repeated factor is the tool again, and this time it ' +
                'has to earn its keep in the other direction. Begin with what the rule as it ' +
                'stands offers: one term per distinct factor with a constant on top, so a term ' +
                'over (x − 1) and a term over (x² + 1), which is two numbers for you to choose. ' +
                'Then count what must be matched, and count it from the recombining rather than ' +
                'from the 2x + 1 in front of you. Adding two such fractions lands the sum over ' +
                '(x − 1)(x² + 1), and whatever stands on top of that product is what your shape ' +
                'has to be able to produce; that denominator is a cubic, so a proper fraction ' +
                'over it can carry a numerator of a degree you should name, with a definite ' +
                'number of coefficients in it, and your shape must be able to hit all of them. ' +
                'The extra room cannot come from a new denominator the way it did for the ' +
                'repeated factor — you have just established that x² + 1 does not split, so ' +
                'there is no smaller divisor of it to put a fraction over. It has to come from ' +
                'the top instead, and the one thing limiting how large a numerator may sit over ' +
                'x² + 1 is that the piece has to stay a proper fraction. So how many unknowns ' +
                'does the constant-on-top shape give you against the number to be matched, what ' +
                'is the largest numerator x² + 1 will take without that piece turning improper, ' +
                'how many unknowns does the shape then carry, and what is the shape you are ' +
                'going to fill in?',
            },
            {
              label: 'Clear the denominators',
              detail: '2x + 1 = A(x² + 1) + (Bx + C)(x − 1).',
              socratic:
                'Clearing is the same move for the third time — multiply the whole equality by ' +
                'the smallest thing every denominator divides, which here can only be the ' +
                'product (x − 1)(x² + 1) — so the only question is what the three places it acts ' +
                'come to. Two are familiar: the left-hand side parts with its denominator ' +
                'entirely, and the A term loses (x − 1) and picks up whichever factor it had not ' +
                'accounted for. The third is new in one respect only, that what sits on top of ' +
                'x² + 1 is no longer a single letter. Keep it bracketed as you multiply, because ' +
                'it is a sum and the factor it collects multiplies both parts of it; dropping ' +
                'that bracket is the slip that makes the rest of the point come out wrong ' +
                'without ever looking wrong. Write the line down before expanding anything, then ' +
                'look ahead at what expanding it would do: what degree the right-hand side ' +
                'reaches, and therefore how many coefficients stand ready to be compared against ' +
                'the left. What do the three places come to, how many coefficients does each ' +
                'side carry once expanded, and for how many values of x does the line you have ' +
                'written have to hold?',
            },
            {
              label: 'Solve — one substitution, then coefficients',
              detail:
                'x = 1 gives 3 = 2A, so A = 3/2. Comparing x²: 0 = A + B, so B = −3/2. Comparing ' +
                'constants: 1 = A − C, so C = 1/2.',
              socratic:
                'Both terms on the right carry a bracket, and in the distinct case a bracket ' +
                'apiece was exactly what let a substitution be found for each unknown — so look ' +
                'at which two brackets these are before expecting two substitutions. One is ' +
                '(x − 1), and emptying a bracket of that form is what you did twice over. The ' +
                'other is x² + 1, and the first step of this point was a finding about precisely ' +
                'that expression: no real root, which is another way of saying there is no value ' +
                'you can put in to make it come to nothing. So the substitution route reaches ' +
                'some of the three unknowns and then stops, and for whatever is left you fall ' +
                'back on what the line is rather than on emptying things — an identity in x, two ' +
                'polynomials agreeing at every value, which forces them to agree coefficient by ' +
                'coefficient. Count before you compare, though. Each side carries three ' +
                'coefficients, so there are three comparisons available, and fewer than three ' +
                'unknowns will still be outstanding once the substitution has been taken. ' +
                'Which value of x do you substitute and which unknown does it hand you, how many ' +
                'of the three comparisons do you actually need and which values do they give, ' +
                'and what does the comparison you did not need tell you when you go back and ' +
                'make it?',
            },
          ],
          answer: '(3/2)/(x − 1) + (−(3/2)x + 1/2)/(x² + 1)',
        },
      },
    ],
  },

  /**
   * Completing the square — promoted out of the atlas.
   *
   * It was a map node (`atlas-foundations.ts`, removed in the same commit) and
   * it had to leave the map to be authored: `atlasProblems` refuses a node that
   * collides with an authored concept, because the shadowed copy carries no
   * knowledge points and the subject would silently read as unteachable.
   *
   * It is authored HERE rather than as a new subject because this ontology
   * already owns `factoring-quadratics`, which is its prerequisite. Keeping the
   * pair together means the gate is an edge between two concepts one file owns,
   * and no new `Subject` or `ONTOLOGIES` entry is needed — so the hard-coded
   * `ONTOLOGIES[0]` default that /learn and /api/learn/session both read is
   * untouched.
   *
   * It is also the first concept chosen because of /play. Highlighting
   * "Completing the square" in a game already showed it on the concept trail,
   * marked as mapped with nothing to practise — a dead end arrived at by a
   * feature built to avoid dead ends.
   *
   * ── Why it needed a new form ─────────────────────────────────────────────
   *
   * Neither `expanded` nor `factored` can express the demand. A completed square
   * is not a sum of monomials and not a product of factors, so a task asking for
   * one with no form attached would accept the input back unchanged and call it
   * correct. `completed_square` is in forms.ts, and it rules by counting
   * occurrences of the variable rather than by matching a shape — which is both
   * robust to the four phrasings a right answer arrives in and a restatement of
   * what the skill actually is.
   */
  {
    id: 'completing-the-square',
    name: 'Completing the square',
    subjectId: subject.id,
    scope: {
      id: 'completing-the-square',
      label: 'Completing the square',
      hint: 'completing the square vertex form quadratic',
      match: /\b(completing the square|vertex form)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'complete-the-square',
        statement:
          'Rewrite any quadratic so the variable appears once, and read the vertex off the result.',
        taskKinds: ['transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'complete-monic',
        conceptId: 'completing-the-square',
        statement:
          'For x² + bx + c, half of b is the number that goes inside the bracket. Squaring the ' +
          'bracket adds (b/2)² that was never there, so the same amount comes straight back off.',
        position: 1,
        automaticityTarget: 30_000,
        workedExample: {
          problem: 'Write x² + 6x + 5 as a completed square.',
          subgoals: [
            {
              label: 'Half the coefficient of x',
              detail: 'b = 6, so half of it is 3. The bracket is (x + 3).',
              socratic:
                'This is not a factoring problem — what you are aiming at is one squared ' +
                'bracket, (x + p)², with a constant after it to repair whatever that bracket ' +
                'gets wrong. So everything turns on choosing p, and the only part of the ' +
                'original that can decide it is the 6x, since the 5 has not been consulted ' +
                'yet. Expand (x + p)² for yourself and look at its middle term alone: what is ' +
                'the coefficient of x there, written in terms of p? Set that against the 6x ' +
                'the bracket has to reproduce. What must p be, and why is the number inside ' +
                'the bracket not the 6 itself?',
            },
            {
              label: 'What did the bracket add?',
              detail: '(x + 3)² = x² + 6x + 9. The 9 is not in the original, so subtract it.',
              socratic:
                'You fixed p from the middle term alone, so (x + 3)² is certain to reproduce ' +
                'the x² and the 6x correctly — those were what chose it. The constant is the ' +
                'part nothing was ever matched against. Expand (x + 3)² in full and set it ' +
                'beside x² + 6x + 5: what constant has the bracket brought with it, which of ' +
                'the two expressions does that constant actually belong to, and what ' +
                'therefore has to happen to it before the two sides can be equal?',
            },
            {
              label: 'Put the constant back',
              detail: 'x² + 6x + 5 = (x + 3)² − 9 + 5 = (x + 3)² − 4.',
              socratic:
                'Taking 9 off (x + 3)² hands back x² + 6x and nothing else, while the ' +
                'expression you started from also carries a 5. Two constants are in play at ' +
                'once, then — the one that undoes what the bracket added, and the one that ' +
                'was in the problem from the start — and they arrive from different places, ' +
                'so neither may quietly stand in for the other. Write the line out with both ' +
                'still showing before you combine them. Why is (x + 3)² − 9 wrong, why is ' +
                '(x + 3)² + 5 wrong, and what do the two constants come to together?',
            },
            {
              label: 'Check by expanding',
              detail: '(x + 3)² − 4 = x² + 6x + 9 − 4 = x² + 6x + 5. It agrees.',
              socratic:
                'Expanding back is the check you already used on a pair of factored brackets, ' +
                'and it earns more here, because two separate choices could have gone wrong ' +
                'rather than one: the number inside the bracket and the constant outside it. ' +
                'Expand (x + 3)² − 4 the whole way down to three terms. What does it come to, ' +
                'which of those two choices would a mismatch in the x term have pointed at as ' +
                'against a mismatch in the constant, and for how many values of x does the ' +
                'agreement you are checking have to hold?',
            },
          ],
          answer: '(x + 3)² − 4',
        },
      },
      {
        id: 'complete-odd-b',
        conceptId: 'completing-the-square',
        statement:
          'Nothing changes when b is odd — half of it is simply a fraction. The temptation is to ' +
          'round it, and rounding makes the identity false.',
        position: 2,
        workedExample: {
          problem: 'Write x² + 3x + 1 as a completed square.',
          subgoals: [
            {
              label: 'Half of b',
              detail: 'b = 3, so half is 3/2. The bracket is (x + 3/2).',
              socratic:
                'The rule that fixed p last time read it off the middle term alone, and there it ' +
                'happened to come out a whole number — which makes it easy to read a ' +
                'whole-number requirement into a rule that never stated one. Run the same rule ' +
                'on the 3x in front of you rather than assuming what kind of number it will ' +
                'give. Then test the tidier alternative instead of trusting it: round your p to ' +
                'the nearest whole number, expand that bracket, and look only at its middle ' +
                'term. What coefficient of x does the rounded bracket give, what does the 3x ' +
                'demand, and what does the gap between them settle?',
            },
            {
              label: 'What did it add?',
              detail: '(x + 3/2)² = x² + 3x + 9/4, so 9/4 has to come off.',
              socratic:
                'You fixed p from the middle term, so the bracket will reproduce the x² and the ' +
                '3x correctly — those are what chose it. The constant is again the part nothing ' +
                'was matched against, except that p is a fraction this time, so the constant ' +
                'arrives by squaring a fraction rather than squaring a whole number. Expand ' +
                '(x + 3/2)² in full and read off the constant it brings. What is that constant, ' +
                'how does its denominator compare with the denominator of p itself, and what has ' +
                'to happen to it before the two sides can be equal?',
            },
            {
              label: 'Combine the constants',
              detail: '1 − 9/4 = 4/4 − 9/4 = −5/4.',
              socratic:
                'Taking 9/4 off (x + 3/2)² hands back x² + 3x and nothing else, while the ' +
                'expression you started from also carries its 1 — so two constants are in play ' +
                'from different places, exactly as in the whole-number case. What is new is that ' +
                'they are not written over a common denominator, and the one from the problem ' +
                'does not look like a fraction at all. Write the line out with both still showing ' +
                'before you combine them. What must the 1 be rewritten as first, what do the two ' +
                'come to together, and what one expansion would confirm the finished line rather ' +
                'than just this step?',
            },
          ],
          answer: '(x + 3/2)² − 5/4',
        },
      },
      {
        id: 'complete-non-monic',
        conceptId: 'completing-the-square',
        statement:
          'When the leading coefficient is not 1, take it out of the x terms first and complete ' +
          'the square inside the bracket. The factor then multiplies the correction as well, ' +
          'which is the step people drop.',
        position: 3,
        workedExample: {
          problem: 'Write 2x² + 8x + 5 as a completed square.',
          subgoals: [
            {
              label: 'Take the 2 out of the x terms',
              detail: '2(x² + 4x) + 5.',
              socratic:
                'Every bracket you have chosen so far came out of expanding (x + p)², which ' +
                'begins with a single x² — so the rule that reads p off the middle term was only ' +
                'ever derived for a quadratic whose x² carries a coefficient of 1, and 2x² is ' +
                'not that. The obvious repair is to divide the whole expression by 2, so test it ' +
                'rather than trusting it: divide, then say what has happened to the value, and ' +
                'what would have been different had you been handed an equation set equal to ' +
                'zero instead of an expression to rewrite. The other repair takes the 2 out as a ' +
                'factor, and out of the x terms only — the 5 may stay where it is, since by both ' +
                'earlier points the constant is never what chooses the bracket. What does the ' +
                'expression read as once you do that, and what is left inside the bracket for ' +
                'the rule to run on?',
            },
            {
              label: 'Complete the square inside',
              detail: 'x² + 4x = (x + 2)² − 4, so this is 2((x + 2)² − 4) + 5.',
              socratic:
                'Inside the bracket is x² + 4x — monic, so the rule from the first two points ' +
                'applies to it unchanged and you need invent nothing new. One thing has changed, ' +
                'though: in x² + 6x + 5 there were two constants to reconcile, the one the ' +
                'bracket added and the one the problem supplied, whereas after the 4x inside ' +
                'this bracket there is nothing at all. Complete the square on x² + 4x by itself, ' +
                'then write the result back in with the outer 2 and the 5 both still showing and ' +
                'both untouched. What does the inner expression become, why is the correction it ' +
                'carries the only constant inside the bracket, and what is still standing ' +
                'between that correction and the constant of the finished answer?',
            },
            {
              label: 'Multiply the correction out too',
              detail:
                '2(x + 2)² − 8 + 5 = 2(x + 2)² − 3. Forgetting to multiply the −4 by 2 is the ' +
                'usual error, and expanding the answer back catches it.',
              socratic:
                'The 2 now sits outside a bracket holding two terms rather than one, and only ' +
                'the first of them is the squared bracket. Before settling what comes out, write ' +
                'down the line someone gets by carrying the −4 through unchanged and combining ' +
                'it with the 5, expand that line the whole way down to three terms, and set it ' +
                'beside 2x² + 8x + 5. Then do the same for the line you get by letting the 2 ' +
                'reach both terms inside. Which of the two expansions returns the original, what ' +
                'does that settle about what the factor does to a correction computed inside the ' +
                'bracket, and what is the finished constant?',
            },
          ],
          answer: '2(x + 2)² − 3',
        },
      },
    ],
  },

  /**
   * The quadratic formula — promoted out of the atlas, like the concept above.
   *
   * Chosen second for one reason: of every mapped node, "Quadratic formula" is
   * the likeliest mathematics article to turn up in a game, and it was its own
   * `about` match on the concept trail while having nothing to practise.
   *
   * ── It needed no new machinery, which is why it came before easier nodes ──
   *
   * Every task here is `evaluate`, and `sqrt` is already in
   * `ALLOWED_FUNCTIONS` — so the roots of a quadratic are an exact expression
   * the existing verifier can rule, irrational ones included. That is not true
   * of several nodes that look cheaper: `gcd-and-lcm` is a number with no
   * expression to manipulate, and every task must declare a symbol, so "what is
   * gcd(48, 180)" has no honest shape in this schema at all.
   *
   * ── One root per task, deliberately ──────────────────────────────────────
   *
   * A quadratic has two roots and a task has one reference, so each task asks
   * for a named one — "the larger". The alternative, accepting either, would
   * mean a learner who always took the + branch never discovered they had not
   * understood the ±.
   */
  {
    id: 'quadratic-formula',
    name: 'The quadratic formula',
    subjectId: subject.id,
    scope: {
      id: 'quadratic-formula',
      label: 'The quadratic formula',
      hint: 'quadratic formula discriminant roots',
      match: /\b(quadratic formula|discriminant)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'solve-any-quadratic',
        statement:
          'Solve any quadratic exactly, and say from the discriminant how many real roots it has ' +
          'before solving it.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'read-the-discriminant',
        conceptId: 'quadratic-formula',
        statement:
          'b² − 4ac decides the question before you solve anything: positive gives two real ' +
          'roots, zero gives one, negative gives none. A perfect square additionally means the ' +
          'roots are rational, which is exactly when factoring would have worked.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'How many real roots does x² + x + 1 have?',
          subgoals: [
            {
              label: 'Name a, b, c',
              detail: 'a = 1, b = 1, c = 1.',
              socratic:
                'The question asks how many real roots there are, not what they are — so the ' +
                'answer has to come out of x² + x + 1 as it stands rather than out of solving ' +
                'it. You have met b² − 4ac already, deciding whether this same quadratic had ' +
                'real linear factors. What three numbers does it need from x² + x + 1, and ' +
                'which part of the expression supplies each of them?',
            },
            {
              label: 'Compute b² − 4ac',
              detail: '1 − 4·1·1 = 1 − 4 = −3.',
              socratic:
                'All three of a, b and c came out as 1, which leaves b² − 4ac a contest between ' +
                'just two quantities: b² on one side and 4ac on the other. Work out each of ' +
                'them before you subtract anything. Which of the two is larger here, and what ' +
                'will the sign of the difference therefore be recording about them?',
            },
            {
              label: 'Read the sign',
              detail:
                'Negative, so there is no real square root to take and the equation has no real ' +
                'roots. The parabola never crosses the axis.',
              socratic:
                'The value is −3, and you have met x² + x + 1 before — as a quadratic with no ' +
                'real linear factors. Solving it would mean taking √(b² − 4ac) at this point. ' +
                'What is there to take when that asks for √(−3), how many real roots does it ' +
                'leave x² + x + 1 with, and how does that verdict stand to the earlier one ' +
                'about its factors?',
            },
          ],
          answer: 'None — the discriminant is −3.',
        },
      },
      {
        id: 'apply-the-formula',
        conceptId: 'quadratic-formula',
        statement:
          'x = (−b ± √(b² − 4ac)) / 2a. The whole numerator is over 2a, and the minus sign in ' +
          '−b applies to b whatever sign b already had — both are places the formula is ' +
          'misremembered rather than misunderstood.',
        position: 2,
        workedExample: {
          problem: 'Solve x² − 2x − 15 = 0.',
          subgoals: [
            {
              label: 'Name a, b, c',
              detail: 'a = 1, b = −2, c = −15.',
              socratic:
                'You have read a, b and c off a quadratic twice already, but both times every ' +
                'coefficient was 1 and no sign could go wrong. Here the expression is written ' +
                'x² − 2x − 15, with the minus signs standing between the terms rather than in ' +
                'front of the numbers. Rewrite it as a sum, so that whatever sign each term ' +
                'carries ends up attached to its own number, and read the three coefficients ' +
                'off that. What are a, b and c, and which of the three is nowhere written down ' +
                'in x² − 2x − 15 at all?',
            },
            {
              label: 'The discriminant first',
              detail: '(−2)² − 4·1·(−15) = 4 + 60 = 64. A perfect square, so expect rational roots.',
              socratic:
                'Two of the three numbers going into b² − 4ac are negative here, and each is a ' +
                'place the arithmetic can quietly turn: b² squares a negative, and 4ac ' +
                'multiplies a positive by a negative. Keep the brackets round −2 and −15, work ' +
                'b² and 4ac out separately, and only then subtract one from the other. What does ' +
                'b² − 4ac come to, why does subtracting 4ac leave it larger than b² rather than ' +
                'smaller, and — since the previous point said a perfect square settles something ' +
                'the sign alone does not — what does the value you get lead you to expect of the ' +
                'two roots before you have found either of them?',
            },
            {
              label: 'Substitute',
              detail: 'x = (2 ± 8) / 2, since −b = 2 and √64 = 8.',
              socratic:
                'Now the formula itself, x = (−b ± √(b² − 4ac)) / 2a, with b = −2. The −b in ' +
                'front is not an instruction to write a minus sign: it is the negative of ' +
                'whatever b happens to be, and b is already negative here. Write the substituted ' +
                'line out with the discriminant you just computed in place, then look at where ' +
                'your division bar falls. What does −b come to, how much of the numerator is ' +
                'sitting over 2a — the whole of −b ± √(b² − 4ac), or only the part after the ± — ' +
                'and what would the two roots come out as instead if the bar reached only that ' +
                'part?',
            },
            {
              label: 'Both branches',
              detail: 'x = 10/2 = 5, or x = −6/2 = −3.',
              socratic:
                '(2 ± 8)/2 is not one number with a decoration on it — it is shorthand for two ' +
                'lines that have to be written out separately, and the second is where a sign ' +
                'goes astray, since 2 − 8 and 8 − 2 are not the same thing. Take each branch the ' +
                'whole way down, dividing by 2 at the end of each. What are the two values, ' +
                'which of them is unreachable if you subtract in the more comfortable order, and ' +
                'what would someone who stopped after the + branch be claiming about ' +
                'x² − 2x − 15 that the discriminant you computed has already ruled out?',
            },
            {
              label: 'Check against factoring',
              detail:
                'x² − 2x − 15 = (x + 3)(x − 5), whose roots are −3 and 5. The two methods agree, ' +
                'which is the check available whenever the discriminant is a perfect square.',
              socratic:
                'You have factored this very quadratic already — x² − 2x − 15 = (x + 3)(x − 5) — ' +
                'and you got there by hunting a pair of numbers, with no formula involved ' +
                'anywhere. A product is zero only when one of the things multiplied is zero, so ' +
                'those brackets hand over their own roots. Which values of x make ' +
                '(x + 3)(x − 5) vanish, what does their agreeing with the pair you just computed ' +
                'settle — this answer, or the formula that produced it — and what was it about ' +
                'the discriminant here that made a factored form available to check against at ' +
                'all?',
            },
          ],
          answer: 'x = 5 or x = −3',
        },
      },
      {
        id: 'irrational-roots',
        conceptId: 'quadratic-formula',
        statement:
          'When the discriminant is positive but not a perfect square the roots are irrational, ' +
          'and the exact answer keeps the surd. Reaching for a decimal here loses the thing the ' +
          'formula was for — it is the only method that gives these roots at all.',
        position: 3,
        workedExample: {
          problem: 'Solve x² + 2x − 1 = 0 exactly.',
          subgoals: [
            {
              label: 'Name a, b, c',
              detail: 'a = 1, b = 2, c = −1.',
              socratic:
                'Twice already in this concept you have read a, b and c off a quadratic, and the ' +
                'hard part the second time was that the minus signs stood between the terms ' +
                'rather than in front of the numbers. x² + 2x − 1 has one minus sign only, and ' +
                'it sits in front of a 1 — the smallest of the three numbers and the one whose ' +
                'sign will count for most once 4ac is formed. Rewrite the expression as a sum, ' +
                'so each coefficient ends up carrying its own sign, and read the three off that. ' +
                'What are a, b and c, and what would be different about the quadratic if you ' +
                'recorded c as 1 rather than as whatever it turns out to be?',
            },
            {
              label: 'The discriminant',
              detail: '4 − 4·1·(−1) = 4 + 4 = 8. Positive, not a square.',
              socratic:
                'Only one of the three coefficients is negative this time, and it is c — so the ' +
                'same thing happens to 4ac as happened in x² − 2x − 15, and subtracting it will ' +
                'again leave you above b² rather than below it. Work b² and 4ac out separately ' +
                'and only then subtract. Now the reading, which has two parts to it: the first ' +
                'point in this concept said the sign of b² − 4ac settles how many real roots ' +
                'there are, and that a perfect square settles the further question of what kind ' +
                'of numbers they are — and the 64 of the last example answered both of those the ' +
                'same comfortable way. What does b² − 4ac come to here, which of the two readings ' +
                'does that value satisfy and which does it fail, and so what should you be ' +
                'expecting of the two roots before you have found either?',
            },
            {
              label: 'Substitute and simplify the surd',
              detail: 'x = (−2 ± √8)/2. √8 = 2√2, so x = (−2 ± 2√2)/2 = −1 ± √2.',
              socratic:
                'Substituting the discriminant into x = (−b ± √(b² − 4ac)) / 2a gives a numerator ' +
                'with √8 standing in it, and now something happens that did not happen in either ' +
                'earlier point: √8 is not a whole number, so the arithmetic stops short of a ' +
                'number — and the word "exactly" in the problem is what forbids you to finish it ' +
                'with a decimal. Two separate moves are left. One is inside the radical: 8 is not ' +
                'a square, but it is not free of squares either, so ask which square number ' +
                'divides it and what that lets you carry outside. The other is the 2 underneath, ' +
                'and this subject has already told you that cancelling needs a factor of the ' +
                'whole numerator rather than of one term standing in it. What does √8 simplify ' +
                'to, what does the numerator read as once that is in, and why may the 2 ' +
                'underneath divide both terms of it when striking an x out of x + 3 was not ' +
                'allowed?',
            },
            {
              label: 'Why factoring could not have done this',
              detail:
                'There is no pair of rationals multiplying to −1 and adding to 2. That is the ' +
                'same fact as the discriminant not being a perfect square.',
              socratic:
                'Run the pair-hunt on x² + 2x − 1 before you answer — two numbers multiplying to ' +
                '−1 and adding to 2 — and it comes up empty, which is exactly where you stood on ' +
                'x² + x + 1. There you were told that an empty search settles nothing by itself, ' +
                'since it cannot tell factors that are absent from factors you failed to find. ' +
                'The two cases cannot be the same case, though, because x² + x + 1 has no real ' +
                'roots at all and you have just written down two of them for this quadratic. So ' +
                'b² − 4ac is telling apart more than two situations. How does the 8 stand to the ' +
                '−3 you got there — in what respect do the two verdicts agree about factoring, ' +
                'and in what respect do they differ about roots — and what kind of number was ' +
                'the pair-hunt restricted to all along that −1 ± √2 is not?',
            },
          ],
          answer: 'x = −1 + √2 or x = −1 − √2',
        },
      },
    ],
  },

  /**
   * Roots of higher polynomials — the third promotion out of the atlas.
   *
   * ── What it teaches, and what it deliberately does not ───────────────────
   *
   * The map node's one-liner bundled three things: the factor and remainder
   * theorems, rational-root search, and "the fundamental theorem of algebra as
   * the thing they are groping toward". The first two are authored here. The
   * FTA is not, and that is why the node's `needs: ['complex-numbers']` edge is
   * kept rather than quietly dropped — complex numbers are what the FTA needs,
   * and removing the edge because this concept stops short of it would loosen
   * the ordering on the strength of what is currently written, which is exactly
   * backwards. Gating only ever tightens here.
   *
   * Keeping it costs nothing today: `complex-numbers` has no material, and
   * `gatingPrerequisitesOf` looks *through* an unteachable prerequisite rather
   * than at it. So the claim stands in the graph and gates nobody until somebody
   * authors complex arithmetic, at which point it starts gating and the
   * ordering tightens — which is the behaviour that rule exists for.
   *
   * ── Why it was the next one worth doing ──────────────────────────────────
   *
   * It has both halves. The remainder and factor theorems are `evaluate` —
   * substitute and read the number — so they settle locally with no worker,
   * while full factorisation is a `transform_to_form` the CAS has to rule. That
   * satisfies the invariant the last pass added, rather than needing an
   * `evaluate` stand-in invented to satisfy it.
   */
  {
    id: 'polynomial-roots',
    name: 'Roots of higher polynomials',
    subjectId: subject.id,
    scope: {
      id: 'polynomial-roots',
      label: 'Roots of higher polynomials',
      hint: 'factor theorem remainder theorem rational root cubic',
      match: /\b(factor theorem|remainder theorem|rational root|cubic equation|quartic equation)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'find-roots-beyond-quadratics',
        statement:
          'Find a root of a cubic, show it is one, and use it to factor the polynomial completely.',
        taskKinds: ['evaluate', 'transform_to_form', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'remainder-theorem',
        conceptId: 'polynomial-roots',
        statement:
          'Dividing p(x) by (x − a) leaves a remainder of exactly p(a). So you never have to do ' +
          'the division to find the remainder — substitute.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'What is the remainder when x³ − 2x² + 4 is divided by x − 3?',
          subgoals: [
            { label: 'Which a?', detail: 'Dividing by x − 3 means a = 3. Note the sign: x − a, so a is +3.' },
            { label: 'Substitute', detail: 'p(3) = 27 − 2·9 + 4 = 27 − 18 + 4 = 13.' },
            {
              label: 'That is the remainder',
              detail:
                'No division needed. Doing it long-hand gives quotient x² + x + 3 and remainder 13, ' +
                'which is the check rather than the method.',
            },
          ],
          answer: '13',
        },
      },
      {
        id: 'factor-theorem',
        conceptId: 'polynomial-roots',
        statement:
          'The remainder theorem has one case that matters: if p(a) = 0 then the remainder is zero, ' +
          'so (x − a) divides p exactly. Finding a root and finding a factor are the same act.',
        position: 2,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Show that x − 1 is a factor of x³ − 7x + 6, and that x − 3 is not.',
          subgoals: [
            { label: 'Test a = 1', detail: 'p(1) = 1 − 7 + 6 = 0. Zero, so x − 1 is a factor.' },
            { label: 'Test a = 3', detail: 'p(3) = 27 − 21 + 6 = 12. Not zero, so x − 3 is not a factor.' },
            {
              label: 'What the non-zero value tells you',
              detail:
                'It is not wasted: 12 is the remainder on division by x − 3. A failed factor test is ' +
                'still a completed remainder calculation.',
            },
          ],
          answer: 'x − 1 is a factor; x − 3 leaves remainder 12.',
        },
      },
      {
        id: 'rational-root-search',
        conceptId: 'polynomial-roots',
        statement:
          'A rational root p/q of a polynomial with integer coefficients has p dividing the constant ' +
          'term and q dividing the leading coefficient. That turns "guess a root" into a short finite ' +
          'list to test — and if none of them works, there is no rational root to find.',
        position: 3,
        workedExample: {
          problem: 'Factor 2x³ − 3x² − 11x + 6 completely.',
          subgoals: [
            {
              label: 'Build the candidate list',
              detail:
                'Constant 6 gives p ∈ {±1, ±2, ±3, ±6}; leading coefficient 2 gives q ∈ {±1, ±2}. ' +
                'So the candidates are ±1, ±2, ±3, ±6, ±1/2, ±3/2.',
            },
            { label: 'Test until one lands', detail: 'p(1) = −6. p(−1) = 12. p(2) = −12. p(3) = 54 − 27 − 33 + 6 = 0.' },
            {
              label: 'Divide out the factor you found',
              detail: '2x³ − 3x² − 11x + 6 ÷ (x − 3) = 2x² + 3x − 2.',
            },
            {
              label: 'The rest is a quadratic, which you already know',
              detail: '2x² + 3x − 2 = (2x − 1)(x + 2), so the whole thing is (x − 3)(2x − 1)(x + 2).',
            },
          ],
          answer: '(x − 3)(2x − 1)(x + 2)',
        },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/**
 * Direction is always `from` → `to`. For a prerequisite that reads "`from` must be
 * strong before `to` is introduced"; for `encompasses`, "exercising `from` also
 * exercises `to`".
 *
 * `promotedBy` is what separates a real edge from a candidate. Every promoted edge
 * here says 'author' because they were authored; an imported one would name its
 * importer, and the point of recording it is that an edge nobody looked at should
 * not be able to gate a learner's curriculum.
 */
const EDGES: ConceptEdge[] = [
  // ── prerequisite ────────────────────────────────────────────────────────
  { id: 'p1', from: 'polynomial-arithmetic', to: 'factoring-quadratics', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Factoring is checked by expanding, so the expansion has to be fluent first.' },
  { id: 'p2', from: 'polynomial-arithmetic', to: 'polynomial-division', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Each division step subtracts a product of polynomials.' },
  { id: 'p3', from: 'factoring-quadratics', to: 'rational-domain', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Finding excluded points is solving the denominator, which means factoring it.' },
  { id: 'p4', from: 'factoring-quadratics', to: 'simplifying-rational', kind: 'prerequisite', promotedBy: 'author' },
  { id: 'p5', from: 'rational-domain', to: 'simplifying-rational', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Cancelling without knowing what it costs is the error this ordering prevents.' },
  { id: 'p6', from: 'simplifying-rational', to: 'combining-rational', kind: 'prerequisite', promotedBy: 'author' },
  { id: 'p7', from: 'combining-rational', to: 'partial-fractions-linear', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'The check on a decomposition is a recombination, so it has to be available.' },
  { id: 'p8', from: 'polynomial-division', to: 'partial-fractions-linear', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'An improper fraction has to be divided before it has a decomposition at all.' },
  { id: 'p9', from: 'partial-fractions-linear', to: 'partial-fractions-repeated', kind: 'prerequisite', promotedBy: 'author' },
  { id: 'p10', from: 'partial-fractions-linear', to: 'partial-fractions-quadratic', kind: 'prerequisite', promotedBy: 'author' },
  // Promoted out of the atlas — see `completing-the-square` below. The edge the
  // map node declared (`needs: ['factoring-quadratics']`) is restated here
  // because it now joins two concepts this ontology owns, which is where an
  // edge belongs when it can be.
  { id: 'p11', from: 'factoring-quadratics', to: 'completing-the-square', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Completing the square is what you reach for when the factor pair does not exist, so knowing when it does comes first.' },
  // Also promoted out of the atlas. The node declared
  // `needs: ['completing-the-square', 'roots-and-irrationals']`; the first is
  // now an authored concept so the edge lives here, and the second is still a
  // map node so it is carried as a `links` entry in atlas-foundations. Losing
  // that second edge is how `function-concept` once became a root of the whole
  // map — see the comment on `functions.links`.
  { id: 'p12', from: 'completing-the-square', to: 'quadratic-formula', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'The formula is completing the square carried out once in general, so it is a shortcut for something that has to be understood first.' },
  // The third promotion. `complex-numbers -> polynomial-roots` is the node's
  // other `needs` and is carried as a `links` entry in atlas-foundations, since
  // it crosses from a map node into an authored concept.
  { id: 'p13', from: 'polynomial-division', to: 'polynomial-roots', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Finding a root gives you a factor, and the next step is dividing it out — so the division has to be available before the search is any use.' },
  { id: 'p14', from: 'quadratic-formula', to: 'polynomial-roots', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Dividing a known factor out of a cubic leaves a quadratic, so the cubic case is only finishable by someone who can finish that.' },
  // The nineteenth promotion. The node declared
  // `needs: ['polynomial-arithmetic', 'exponent-rules']`; the first is a concept
  // of this ontology so the edge belongs here, and the second is a concept of
  // `exponents-and-logarithms` — which no ontology may name from outside, so it
  // is a `links` entry on `algebra-foundations`, the area the node left.
  { id: 'p15', from: 'polynomial-arithmetic', to: 'binomial-theorem', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'The theorem is a shortcut for multiplying brackets out, and a shortcut is unreadable to somebody who cannot do the thing it shortcuts — the four products of two binomials are what row 2 of the triangle is counting.' },

  // ── encompasses ─────────────────────────────────────────────────────────
  // The edges that make credit computable. Each one says: a learner who just did
  // the `from` concept has demonstrated the `to` concept, so it must not come due
  // as though untouched.
  { id: 'e1', from: 'partial-fractions-linear', to: 'combining-rational', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Verifying a decomposition is adding the fractions back together.' },
  { id: 'e2', from: 'partial-fractions-linear', to: 'factoring-quadratics', kind: 'encompasses', promotedBy: 'author',
    rationale: 'The denominator has to be factored before the template can be written down.' },
  { id: 'e3', from: 'simplifying-rational', to: 'factoring-quadratics', kind: 'encompasses', promotedBy: 'author' },
  { id: 'e4', from: 'partial-fractions-repeated', to: 'partial-fractions-linear', kind: 'encompasses', promotedBy: 'author' },
  { id: 'e5', from: 'partial-fractions-quadratic', to: 'partial-fractions-linear', kind: 'encompasses', promotedBy: 'author' },
  { id: 'e6', from: 'combining-rational', to: 'polynomial-arithmetic', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Re-expressing each fraction over a common denominator is a polynomial product.' },
  { id: 'e7', from: 'completing-the-square', to: 'polynomial-arithmetic', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Expanding the bracket back is how the completed square is checked, so doing one exercises the expansion.' },
  { id: 'e8', from: 'quadratic-formula', to: 'completing-the-square', kind: 'encompasses', promotedBy: 'author',
    rationale: 'The map node said so with `exercises`, and it is true: applying the formula is completing the square with the arithmetic already done.' },
  { id: 'e9', from: 'quadratic-formula', to: 'factoring-quadratics', kind: 'encompasses', promotedBy: 'author',
    rationale: 'A perfect-square discriminant is exactly the case factoring handles, and the formula computes the discriminant on the way.' },
  { id: 'e10', from: 'polynomial-roots', to: 'polynomial-division', kind: 'encompasses', promotedBy: 'author',
    rationale: 'The map node said so with `exercises`: factoring a cubic means dividing the found factor out, so the division is performed every time.' },
  { id: 'e11', from: 'polynomial-roots', to: 'factoring-quadratics', kind: 'encompasses', promotedBy: 'author',
    rationale: 'What is left after dividing a root out of a cubic is a quadratic to factor, so a completed cubic contains a completed quadratic.' },
  // This edge is the reason the binomial theorem was homed in this subject
  // rather than with the exponent rules. An `encompasses` can only be declared
  // by an ontology that contains BOTH ends, and a `links` entry carries no edge
  // kind, so filed in the other subject it would have been expressible nowhere
  // and the credit would have been lost in silence.
  { id: 'e12', from: 'binomial-theorem', to: 'polynomial-arithmetic', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Every term of the expansion is a product of powers that has to be worked out and the terms then stand as a collected sum, so a learner who has just expanded (2x − 1)⁵ has demonstrated the polynomial arithmetic rather than merely used it.' },

  // ── interferes_with ─────────────────────────────────────────────────────
  // Symmetric, authored, and each one carries its reason, because an unexplained
  // interference claim cannot be reviewed and will eventually be deleted by
  // somebody who cannot see what it was for.
  {
    id: 'i1',
    from: 'simplifying-rational',
    to: 'combining-rational',
    kind: 'interferes_with',
    promotedBy: 'author',
    rationale:
      'Cancelling is legal across a product and illegal across a sum. Taught in the same ' +
      'sitting, the two produce exactly the error each is supposed to prevent: cancelling ' +
      'a term out of a numerator that is a sum.',
  },
  {
    id: 'i2',
    from: 'partial-fractions-repeated',
    to: 'partial-fractions-quadratic',
    kind: 'interferes_with',
    promotedBy: 'author',
    rationale:
      'The two templates differ only in the numerator — a constant over each power versus ' +
      'a linear numerator over the quadratic. Introduced together, learners pick the ' +
      'template by which one they saw last.',
  },

  // ── candidate_prerequisite ──────────────────────────────────────────────
  //
  // All three have now been reviewed and all three declined. They stay in the
  // file rather than being deleted, which is the point of `rejectedBy`: a
  // deleted edge shrinks `promotionRate`'s denominator and would make the
  // proposal mechanism look better than it was, while a rejected one still
  // counts as something that was proposed and did not survive. They gate
  // nothing and appear in no walk, exactly as before.
  //
  // Two of the three fell to the same test — *is the claim already carried by a
  // path?* — which is worth naming because it is the test most import-produced
  // candidates will fail. A prerequisite that duplicates a transitive path adds
  // no gating and is read by a human as a second, independent fact.
  {
    id: 'c1',
    from: 'factoring-quadratics',
    to: 'polynomial-division',
    kind: 'candidate_prerequisite',
    rejectedBy: 'author',
    rationale:
      'Declined. The division algorithm divides leading term by leading term and subtracts; ' +
      'it never factors anything, and nothing in long division needs a factorisation to exist. ' +
      'Division is usually *taught* after factoring, and that is a fact about textbook order ' +
      'rather than about dependency — which is exactly the confusion this edge kind is meant ' +
      'to keep out of the graph.',
  },
  {
    id: 'c2',
    from: 'polynomial-division',
    to: 'partial-fractions-quadratic',
    kind: 'candidate_prerequisite',
    rejectedBy: 'author',
    rationale:
      'Declined as redundant. polynomial-division already gates partial-fractions-linear (p8), ' +
      'which gates partial-fractions-quadratic (p10), so the ordering this asks for is already ' +
      'enforced. A redundant prerequisite edge gates twice, and a reader counts it as a second ' +
      'reason when there is only one.',
  },
  {
    id: 'c3',
    from: 'rational-domain',
    to: 'partial-fractions-linear',
    kind: 'candidate_prerequisite',
    rejectedBy: 'author',
    rationale:
      'Declined on the same ground as c2, though it was the closest call of the three. The ' +
      'claim is true — a decomposition does inherit the original exclusions, and a learner who ' +
      'does not know that will write an answer they cannot justify. But rational-domain already ' +
      'reaches partial-fractions-linear through simplifying-rational (p5) and combining-rational ' +
      '(p6, p7), so the direct edge changes no gating. What it was really asking for is that ' +
      'the *decomposition* concept restate the domain caveat, and that belongs in a knowledge ' +
      'point — `why-substitution-is-legal` already carries it — not in an edge.',
  },
]

export const RATIONAL_EXPRESSIONS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}

/**
 * Every subject ontology the build ships.
 *
 * Three. The second, in ontology-exponentials.ts, exists to test whether the
 * schema was a schema or one worked example's shape, and its header records
 * what survived. The one thing it broke — `NamedForm` being a closed union of
 * *this* subject's forms, so the second subject could not ask for a
 * `transform_to_form` answer at all — has since been fixed: the union carries
 * `single_power`, `no_negative_exponents` and `radical_free`, and `FORM_CHECKS`
 * in forms.ts is total over it so a form name cannot exist without a checker.
 *
 * FUNCTIONS_AND_INVERSES is LAST, and for the mirror of the reason arithmetic
 * is first: it sits above the algebra rather than beneath it, so it is the
 * last thing met rather than the first. Authoring it moved nobody's entry
 * point — a concept gates only what depends on it, and nothing that already
 * existed depends on functions.
 *
 * ARITHMETIC_FOUNDATIONS IS FIRST IN THE ARRAY, AND THE ORDER IS LOAD-BEARING.
 * `roots()` and `teachingOrder()` both break ties by registry order, declaring
 * it "an authoring decision about what to meet first", and arithmetic genuinely
 * is met first — it is underneath both of the others via
 * `algebra-foundations.links`. Appending it would have put place value after
 * partial fractions in the curriculum order for no reason a learner could see.
 *
 * The third subject is also the first one that is gradable with no math worker
 * configured: every one of its tasks is `evaluate`, and `ruleEvaluate` settles
 * those by exact rational arithmetic. See its header for why that is a property
 * of arithmetic rather than a win that generalises.
 *
 * EXPRESSIONS_AND_EQUATIONS IS SECOND, for the same reason and one step up.
 * It is the one concept between the arithmetic and both algebra subjects — a
 * letter standing for a number — so in curriculum order it comes directly
 * after place value and before expanding a bracket. It does not displace
 * arithmetic from index 0, which the cold-account assertion in
 * tests/concepts-logic.mjs depends on.
 *
 * PLANE_GEOMETRY IS THIRD, and the position is the one honest place for it.
 * The first angle facts need no algebra — not a letter, not an equation — so
 * nothing in the array is a prerequisite of it; it is a root of the whole map.
 * What the position claims is only that a learner meets it around the time
 * they meet early algebra and long before polynomials, which is where every
 * school course puts it. Appending it last would have claimed geometry comes
 * after matrices.
 *
 * Inserting rather than appending moves four subjects one place along, and
 * that is safe because registry order is read only as a tie-break and only two
 * positions are asserted anywhere: index 0 must stay arithmetic (the
 * cold-account assertion) and index 1 must stay the expressions subject.
 *
 * TRIANGLE_TRIGONOMETRY IS FOURTH, DIRECTLY BEHIND THE GEOMETRY, and the
 * position is forced by what it rests on rather than chosen. Its single
 * concept needs `similarity` and `pythagoras` and nothing else in the build —
 * not a letter, not an equation, nothing from either algebra subject — so the
 * only thing ahead of it in the curriculum order has to be the geometry it
 * comes out of. Appending it last would have claimed that a learner meets the
 * sine after partial fractions, logarithms, inverse functions and
 * determinants, which is false in every school course and is the same mistake
 * the paragraph above refused for the geometry itself.
 *
 * Three positions are asserted now rather than two: index 2 must stay
 * `plane-geometry`, which the eighth subject's block in
 * tests/concepts-logic.mjs reads by name. Inserting at index 3 leaves all
 * three intact and moves five subjects one place along, which is safe for the
 * reason above — nothing reads an index past 2.
 *
 * SOLID_MEASURE IS FIFTH, AND THE CHOICE BETWEEN FOURTH AND FIFTH IS A
 * TIE-BREAK RATHER THAN A CURRICULUM CLAIM, which is worth saying plainly
 * instead of dressing it up.
 *
 * Its single concept needs `circle-measure` and nothing else in the build, so
 * it rests on the plane geometry exactly as the ratios do and neither of the
 * two is a prerequisite of the other. They are siblings of the same parent,
 * and ordering siblings is not information this array has. What decided it is
 * that index 3 is read by name in tests/concepts-logic.mjs and index 4 is read
 * by nobody, so inserting here leaves all four asserted positions intact and
 * moves four subjects one place along.
 *
 * What the position does claim is only that a learner meets the volume of a
 * prism around the time they meet the sine and long before rational
 * expressions, which is where every school course puts it. Appending it last
 * would have claimed the solids come after determinants.
 *
 * DATA_SUMMARIES IS NINTH, DIRECTLY BEHIND THE FUNCTIONS SUBJECT, and this is
 * the first position in the array that a school course would disagree with.
 *
 * Its single concept needs `percent`, in `arithmetic-foundations` at index 0,
 * and `sigma-notation`, which is a concept of `functions-and-inverses` at index
 * 7 — so the earliest honest place for it is directly behind that one. A
 * learner meets the median long before they meet an inverse function in any
 * real curriculum, and the array cannot say so, because registry order is read
 * as a tie-break but must never contradict a prerequisite. The disagreement is
 * a fact about where this build files Σ rather than about where the mean
 * belongs, and it is written down here so that nobody reads index 8 as a claim
 * about school order.
 *
 * Inserting here rather than appending moves `vectors-and-independence` and
 * `matrices-and-determinants` one place along, which is safe: the five
 * positions read by name anywhere are 0 through 4, each asserted in
 * tests/concepts-logic.mjs, and all five are untouched. Appending last would
 * have claimed a learner meets the quartiles after determinants, which is the
 * same mistake the three paragraphs above refused for the geometry, the ratios
 * and the solids.
 *
 * STATEMENTS_AND_CONNECTIVES IS SIXTH, AND THE CHOICE IS THE SOLIDS' ARGUMENT
 * RUN AGAIN WITH ONE SLOT LESS ROOM.
 *
 * Its single concept needs `geometric-proof` and nothing else in the build, so
 * it rests on the plane geometry at index 2 exactly as the ratios and the
 * solids do, and none of the three is a prerequisite of either other. They are
 * siblings of one parent, and ordering siblings is not information this array
 * carries. So the earliest slot the prerequisite ALLOWS is index 3.
 *
 * It is not taken, and the reason is a change since the solids went in. That
 * paragraph could say "index 3 is read by name in tests/concepts-logic.mjs and
 * index 4 is read by nobody"; index 4 is now read by name too, by the solids'
 * own block. Positions 0 through 4 are therefore all asserted, and index 5 is
 * the earliest free slot — which moves `rational-expressions` and the four
 * after it one place along and leaves every asserted position intact.
 *
 * What the position claims is only that a learner meets the truth table for
 * "if ... then" after the first proofs about figures and before polynomial
 * division, which is both true of a school course and the weakest claim
 * available. Appending it last would have said the logic comes after
 * determinants, which is the mistake the four paragraphs above refused for the
 * geometry, the ratios, the solids and the quartiles.
 *
 * PREDICATES_AND_QUANTIFIERS IS SEVENTH, AND IT IS THE FIRST POSITION IN THIS
 * ARRAY THAT A PREREQUISITE DECIDES ON ITS OWN.
 *
 * Every paragraph above had to pick between slots a prerequisite allowed,
 * because each of those subjects rested on something early and the choice was
 * about which index a test read by name. This one rests on
 * `propositional-logic`, a concept of `statements-and-connectives` at index 5,
 * so the earliest slot the prerequisite ALLOWS is 6 — and 6 was free, index 5
 * being the furthest anything reads positionally. The constraint and the
 * convenience coincided for once and there was nothing to weigh.
 *
 * What the position claims is only that a learner meets "for all" and "there
 * exists" directly after the truth table they generalise and before polynomial
 * division, which is the weakest claim available and is true of any course that
 * teaches the two at all. It moves `rational-expressions` and the five after it
 * one place along, which is safe for the reason the solids' paragraph gives:
 * positions 0 through 5 are each asserted by name in tests/concepts-logic.mjs
 * and all six are untouched.
 *
 * METHODS_OF_PROOF IS EIGHTH, BY THE SAME RULE ONE STEP FURTHER UP, AND THE
 * PRECEDENT NOW HAS A COST THAT IS WORTH NAMING.
 *
 * It rests on `quantifiers`, a concept of `predicates-and-quantifiers` at index
 * 6, so the earliest slot its prerequisite allows is 7 — and 7 was free in the
 * sense that matters: index 6 is the furthest anything reads positionally after
 * the paragraph above, so nothing asserted by index moves except
 * `data-summaries`, which is read by index at 10 and is now 11.
 *
 * THAT IS THE SECOND PROMOTION RUNNING TO MOVE IT, and the third to move it
 * since it was written: 8, then 9, then 10, now 11. A by-index assertion on a
 * subject that sits in the middle of this array is therefore a maintenance cost
 * paid by every future promotion that inserts below it, and the relational
 * assertion beside it — that it comes after the subject holding its
 * prerequisite — has needed no edits at all. Future subjects should prefer the
 * relational form and leave one literal behind only where a position is really
 * load-bearing, which it is for index 0: `ONTOLOGIES[0]` is what
 * /api/learn/session and /learn open on.
 *
 * What this position claims is only that a learner meets the shapes of an
 * argument directly after the quantified claims they are arguments about and
 * before polynomial division — the weakest claim available, and true of any
 * course that teaches them at all.
 *
 * SETS_AND_MEMBERSHIP IS NINTH, BY THE SAME RULE ONE STEP FURTHER UP, AND IT IS
 * THE FIRST OF THESE INSERTIONS TO COST NOTHING AT ALL.
 *
 * It rests on `proof-techniques`, a concept of `methods-of-proof` at index 7, so
 * the earliest slot its prerequisite allows is 8 — and 8 is free in the sense
 * that matters: index 7 is the furthest anything reads positionally after the
 * paragraph above, so nothing asserted by index moves except `data-summaries`,
 * which the previous promotion moved to 11 and which is now 12.
 *
 * THAT IS THE FOURTH PROMOTION RUNNING TO MOVE THAT ONE SUBJECT, and the fourth
 * since it was written: 8, 9, 10, 11, now 12. The paragraph above drew the
 * conclusion and this run is the evidence for it, so it is worth stating as an
 * instruction rather than an observation: a new subject should assert the
 * RELATIONAL fact — that it comes after the subject holding its prerequisite —
 * and leave a literal index behind only where a position is genuinely
 * load-bearing, which it is for index 0 and nowhere else. `ONTOLOGIES[0]` is what
 * /api/learn/session and /learn open on; every other literal in the test files is
 * a debt this insertion collects.
 *
 * What this position claims is only that a learner meets sets directly after the
 * arguments that establish facts about them and before polynomial division — the
 * weakest claim available, and true of any course that teaches them at all. It is
 * also the one place the ordering is doing real work rather than being merely
 * defensible: every identity below is proved by double inclusion, which is the
 * subject at index 7's first lesson run twice, so a learner who arrived here
 * first would meet the method and the object together.
 */
export const ONTOLOGIES: ConceptOntology[] = [
  ARITHMETIC_FOUNDATIONS, EXPRESSIONS_AND_EQUATIONS, PLANE_GEOMETRY,
  TRIANGLE_TRIGONOMETRY, SOLID_MEASURE, STATEMENTS_AND_CONNECTIVES,
  PREDICATES_AND_QUANTIFIERS, METHODS_OF_PROOF, SETS_AND_MEMBERSHIP,
  RATIONAL_EXPRESSIONS, EXPONENTS_AND_LOGARITHMS, FUNCTIONS_AND_INVERSES,
  DATA_SUMMARIES, VECTORS_AND_INDEPENDENCE, MATRICES_AND_DETERMINANTS,
]

export function getOntology(subjectId: string): ConceptOntology | null {
  return ONTOLOGIES.find(o => o.subject.id === subjectId) ?? null
}

/**
 * Which shipped subject owns a knowledge point.
 *
 * Added because the second subject broke something immediately, and the break is
 * worth recording: `TASKS` is one global pool keyed by knowledge-point id, while
 * every route hardcoded `RATIONAL_EXPRESSIONS` as *the* ontology. A submission
 * against an exponents task therefore looked up its point in the wrong subject,
 * found nothing, and returned a 500 saying the task named a point that is not in
 * the ontology.
 *
 * That was a latent single-subject assumption, not a bug in either subject, and
 * it is exactly the kind of thing authoring a second one exists to find. The
 * routes now resolve the ontology from the task rather than assuming it.
 *
 * Point ids are assumed unique across subjects; `pointIdCollisions` is the test
 * that keeps that true, because the failure mode if it stops being true is a
 * silent mis-attribution of credit rather than an error.
 */
export function ontologyForPoint(pointId: string): ConceptOntology | null {
  for (const o of ONTOLOGIES) {
    if (o.concepts.some(c => c.knowledgePoints.some(p => p.id === pointId))) return o
  }
  return null
}

/** Knowledge-point ids used by more than one subject. Must stay empty. */
export function pointIdCollisions(): string[] {
  const seen = new Map<string, string[]>()
  for (const o of ONTOLOGIES) {
    for (const concept of o.concepts) {
      for (const point of concept.knowledgePoints) {
        const subjects = seen.get(point.id) ?? []
        subjects.push(o.subject.id)
        seen.set(point.id, subjects)
      }
    }
  }
  return [...seen.entries()].filter(([, s]) => s.length > 1).map(([id]) => id)
}
