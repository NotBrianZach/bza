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
import { FUNCTIONS_AND_INVERSES } from './ontology-functions'
import { MATRICES_AND_DETERMINANTS } from './ontology-matrices'
import { VECTORS_AND_INDEPENDENCE } from './ontology-vectors'
import { EXPONENTS_AND_LOGARITHMS } from './ontology-exponentials'
import type { ConceptEdge, ConceptOntology, Subject } from './types'
import type { Concept } from './types'

export { ARITHMETIC_FOUNDATIONS } from './ontology-arithmetic'
export { FUNCTIONS_AND_INVERSES } from './ontology-functions'
export { MATRICES_AND_DETERMINANTS } from './ontology-matrices'
export { VECTORS_AND_INDEPENDENCE } from './ontology-vectors'
export { EXPONENTS_AND_LOGARITHMS } from './ontology-exponentials'

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
            },
            {
              label: 'Form them',
              detail: 'x·x = x², x·(−5) = −5x, 3·x = 3x, 3·(−5) = −15.',
            },
            {
              label: 'Collect like terms',
              detail: 'Only −5x and 3x share a power of x: −5x + 3x = −2x.',
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
            { label: 'What can be added?', detail: 'Only terms carrying the same power of x.' },
            {
              label: 'Group by power',
              detail: 'x²: 2 + 1 = 3. x: −1 + 5 = 4. Constants: 4 − 9 = −5.',
            },
          ],
          answer: '3x² + 4x − 5',
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
            },
            {
              label: 'Walk the factor pairs of −15',
              detail: '(1, −15) sums to −14. (−1, 15) sums to 14. (3, −5) sums to −2 — that is the pair.',
            },
            {
              label: 'Write the factors',
              detail: 'x² − 2x − 15 = (x + 3)(x − 5). Expanding it back is the check.',
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
            },
            { label: 'Split the middle term', detail: '2x² + x + 6x + 3.' },
            {
              label: 'Group in pairs',
              detail: 'x(2x + 1) + 3(2x + 1). Both groups carry 2x + 1, so it comes out.',
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
            },
            { label: 'Compute it', detail: '1² − 4·1·1 = −3.' },
            {
              label: 'Read it',
              detail:
                '−3 < 0, so there are no real roots and therefore no real linear factors. ' +
                'The quadratic is irreducible over the reals.',
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
            { label: 'First quotient term?', detail: 'Leading over leading: x²/x = x.' },
            { label: 'Subtract x(x + 1)', detail: 'x² + 3x + 5 − (x² + x) = 2x + 5.' },
            {
              label: 'Repeat, then know when to stop',
              detail: '2x/x = 2; 2x + 5 − (2x + 2) = 3. Degree 0 is below degree 1, so stop.',
            },
            { label: 'Write the result as an identity', detail: 'x² + 3x + 5 = (x + 1)(x + 2) + 3.' },
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
            },
            {
              label: 'What the division buys',
              detail: 'Dividing first gives x + 2 + 3/(x + 1): a polynomial part plus a proper fraction.',
            },
            {
              label: 'The rule',
              detail: 'Divide until the numerator degree is strictly below the denominator degree.',
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
            { label: 'Where is it undefined?', detail: 'Exactly where the denominator vanishes.' },
            {
              label: 'Solve the denominator',
              detail: 'x² − 2x − 15 = (x + 3)(x − 5), which is zero at x = −3 and x = 5.',
            },
            {
              label: 'State the domain',
              detail:
                'All real x except −3 and 5. Note that x = −3 is excluded even though it also ' +
                'makes the numerator zero — 0/0 is not a value.',
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
            { label: 'Simplify the formula', detail: 'The factor x + 3 cancels, leaving 1/(x − 5).' },
            {
              label: 'Compare domains',
              detail:
                'The first is undefined at x = −3. The second is perfectly defined there, with ' +
                'value −1/8.',
            },
            {
              label: 'The verdict, stated precisely',
              detail:
                'Same formula after cancelling, different functions. They agree on the common ' +
                'domain, which is every real x except −3 and 5.',
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
            { label: 'Factor both', detail: '(x + 3)(x − 5) over (x − 5)(x + 5).' },
            { label: 'Cancel the common factor', detail: 'x − 5 appears in both, so it cancels.' },
            {
              label: 'Record what the domain lost',
              detail:
                'x ≠ 5 from the factor that cancelled, and x ≠ −5 from the one that remains. ' +
                'The first condition is invisible in the answer and has to be carried.',
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
            { label: 'What was cancelled?', detail: 'An x out of a sum — but x is a term there, not a factor.' },
            {
              label: 'Why that is illegal',
              detail: 'Cancellation divides both parts by the same thing, and x + 3 is not x times anything.',
            },
            { label: 'Test it', detail: 'At x = 1 the expression is 4/6 = 2/3, and 3/5 is not 2/3.' },
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
            },
            {
              label: 'Re-express each over it',
              detail: '1/(x + 3) = (x − 5)/D and 2/(x − 5) = 2(x + 3)/D, where D = (x + 3)(x − 5).',
            },
            {
              label: 'Add the numerators',
              detail: '(x − 5) + 2(x + 3) = x − 5 + 2x + 6 = 3x + 1.',
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
            },
            {
              label: 'Clear the denominators',
              detail:
                'Multiply through by (x + 3)(x − 5): 3x + 1 = A(x − 5) + B(x + 3). This must hold ' +
                'for every x, which is what licenses the next step.',
            },
            {
              label: 'Choose x to isolate one unknown at a time',
              detail: 'x = 5 gives 16 = 8B, so B = 2. x = −3 gives −8 = −8A, so A = 1.',
            },
            {
              label: 'Check by recombining',
              detail:
                '1/(x + 3) + 2/(x − 5) = ((x − 5) + 2(x + 3))/D = (3x + 1)/D. This is the previous ' +
                'concept run backwards, which is why doing this exercises that.',
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
            },
            {
              label: 'Why the identity is still the right one',
              detail:
                'Two polynomials agreeing at every point except finitely many agree everywhere — ' +
                'their difference is a polynomial with infinitely many roots, so it is zero.',
            },
            {
              label: 'What this does not license',
              detail:
                'It does not make the original expression defined at x = 5. The decomposition ' +
                'inherits that exclusion and carries it.',
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
            },
            { label: 'Clear the denominators', detail: 'x + 4 = A(x + 1) + B.' },
            {
              label: 'Solve',
              detail: 'x = −1 gives B = 3. Comparing the coefficients of x gives A = 1.',
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
            },
            {
              label: 'What shape?',
              detail:
                'A/(x − 1) + (Bx + C)/(x² + 1). Three unknowns for a numerator with up to three ' +
                'coefficients to match.',
            },
            {
              label: 'Clear the denominators',
              detail: '2x + 1 = A(x² + 1) + (Bx + C)(x − 1).',
            },
            {
              label: 'Solve — one substitution, then coefficients',
              detail:
                'x = 1 gives 3 = 2A, so A = 3/2. Comparing x²: 0 = A + B, so B = −3/2. Comparing ' +
                'constants: 1 = A − C, so C = 1/2.',
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
            },
            {
              label: 'What did the bracket add?',
              detail: '(x + 3)² = x² + 6x + 9. The 9 is not in the original, so subtract it.',
            },
            {
              label: 'Put the constant back',
              detail: 'x² + 6x + 5 = (x + 3)² − 9 + 5 = (x + 3)² − 4.',
            },
            {
              label: 'Check by expanding',
              detail: '(x + 3)² − 4 = x² + 6x + 9 − 4 = x² + 6x + 5. It agrees.',
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
            { label: 'Half of b', detail: 'b = 3, so half is 3/2. The bracket is (x + 3/2).' },
            {
              label: 'What did it add?',
              detail: '(x + 3/2)² = x² + 3x + 9/4, so 9/4 has to come off.',
            },
            {
              label: 'Combine the constants',
              detail: '1 − 9/4 = 4/4 − 9/4 = −5/4.',
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
            { label: 'Take the 2 out of the x terms', detail: '2(x² + 4x) + 5.' },
            {
              label: 'Complete the square inside',
              detail: 'x² + 4x = (x + 2)² − 4, so this is 2((x + 2)² − 4) + 5.',
            },
            {
              label: 'Multiply the correction out too',
              detail:
                '2(x + 2)² − 8 + 5 = 2(x + 2)² − 3. Forgetting to multiply the −4 by 2 is the ' +
                'usual error, and expanding the answer back catches it.',
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
            { label: 'Name a, b, c', detail: 'a = 1, b = 1, c = 1.' },
            { label: 'Compute b² − 4ac', detail: '1 − 4·1·1 = 1 − 4 = −3.' },
            {
              label: 'Read the sign',
              detail:
                'Negative, so there is no real square root to take and the equation has no real ' +
                'roots. The parabola never crosses the axis.',
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
            { label: 'Name a, b, c', detail: 'a = 1, b = −2, c = −15.' },
            {
              label: 'The discriminant first',
              detail: '(−2)² − 4·1·(−15) = 4 + 60 = 64. A perfect square, so expect rational roots.',
            },
            {
              label: 'Substitute',
              detail: 'x = (2 ± 8) / 2, since −b = 2 and √64 = 8.',
            },
            {
              label: 'Both branches',
              detail: 'x = 10/2 = 5, or x = −6/2 = −3.',
            },
            {
              label: 'Check against factoring',
              detail:
                'x² − 2x − 15 = (x + 3)(x − 5), whose roots are −3 and 5. The two methods agree, ' +
                'which is the check available whenever the discriminant is a perfect square.',
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
            { label: 'Name a, b, c', detail: 'a = 1, b = 2, c = −1.' },
            { label: 'The discriminant', detail: '4 − 4·1·(−1) = 4 + 4 = 8. Positive, not a square.' },
            {
              label: 'Substitute and simplify the surd',
              detail: 'x = (−2 ± √8)/2. √8 = 2√2, so x = (−2 ± 2√2)/2 = −1 ± √2.',
            },
            {
              label: 'Why factoring could not have done this',
              detail:
                'There is no pair of rationals multiplying to −1 and adding to 2. That is the ' +
                'same fact as the discriminant not being a perfect square.',
            },
          ],
          answer: 'x = −1 + √2 or x = −1 − √2',
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
 */
export const ONTOLOGIES: ConceptOntology[] = [
  ARITHMETIC_FOUNDATIONS, RATIONAL_EXPRESSIONS, EXPONENTS_AND_LOGARITHMS,
  FUNCTIONS_AND_INVERSES, VECTORS_AND_INDEPENDENCE, MATRICES_AND_DETERMINANTS,
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
