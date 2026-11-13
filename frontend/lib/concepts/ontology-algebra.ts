/**
 * A seventh subject ontology: the step from arithmetic into algebra.
 *
 * ── Why this concept, and why it is its own subject ───────────────────────
 *
 * `variables-and-expressions` was a map node in `algebra-foundations`, and it
 * was the single unwritten concept standing on the route of TWO journeys —
 * "Run a function backwards" and "Find where an expression breaks" — each of
 * which had exactly one unwritten step left. Writing it finishes both, which
 * is worth more than reducing a sixteen-step route to fifteen.
 *
 * It is a subject of its own rather than an addition to an existing one, and
 * the reason is the same one that produced ontology-arithmetic.ts. Every
 * other authored subject declares a boundary in its `covers` that this concept
 * falls outside of:
 *
 *  - `arithmetic-foundations` says "nothing symbolic — the moment a letter
 *    stands for an unknown it is algebra". That is exactly this concept.
 *  - `rational-expressions` starts at polynomial arithmetic, and
 *    `polynomial-arithmetic` is the ROOT of that subject's own view. Filing
 *    this underneath it would make that root gated, so the whole subject
 *    would stop being introducible on its own terms.
 *  - `functions-and-inverses` is about functions. A letter standing for a
 *    number is what a function is written WITH, not a kind of function.
 *
 * So the layer beneath gets its own subject and joins the rest through the
 * area's `links`, which is the pattern ontology-arithmetic.ts established:
 * each subject keeps a standalone view that is still a valid, walkable
 * ontology, and the gates between subjects exist only in the composed map.
 *
 * ── THIS TIGHTENS THE GATE, AS AUTHORING ALWAYS DOES ──────────────────────
 *
 * Before this file, `gatingPrerequisitesOf` looked straight through
 * `variables-and-expressions` — it had no material, so it made no claim about
 * mastery and could not gate. `polynomial-arithmetic` and `function-concept`
 * were therefore gated by the arithmetic alone. Now there is a concept in
 * between that has to be demonstrated, so both move one step further from a
 * cold account.
 *
 * That is the design working rather than a regression (see
 * `gatingPrerequisitesOf`: gating tightens, never loosens, as material is
 * authored), and it is checked by name in tests/atlas.mjs.
 *
 * ── What is deliberately NOT here ─────────────────────────────────────────
 *
 * `linear-equations`, `linear-inequalities`, `systems-of-linear-equations` and
 * `word-problems` stay mapped, and the subject is named for the pair so there
 * is somewhere for them to land. Solving is a genuinely different skill from
 * reading — it is about which operations preserve a truth, not about what a
 * letter means — and it needs a task kind this build does not have: "solve for
 * x" asks for the SET of numbers satisfying a condition, and no `NamedForm`
 * and no `evaluate` target expresses a solution set. Authoring them as
 * substitute-and-check tasks would drill verification and never ask for the
 * solving, which is the proxy-task failure tasks.ts warns about.
 *
 * ── Why every task here is `evaluate`, and the form that is missing ───────
 *
 * Collecting like terms is the natural `transform_to_form` ask and it cannot
 * be asked. There is no `collected` form, and the two that come closest both
 * fail in the way types.ts warns about for `maxDenominatorDegree`: `5x + 2 +
 * 3x − 7 + x²` is ALREADY a sum of monomials, so `expanded` is satisfied by
 * the input unchanged, and the equivalence check passes trivially because the
 * input is equivalent to itself. The task would be a free mark.
 *
 * So the tasks ask the one checkable question in the vicinity — the collected
 * form and the original must agree at every x, so they agree at x = 3 — and
 * each prompt names what it is standing in for. That keeps the subject
 * gradable with no math worker configured, which matters more here than
 * elsewhere: this concept now sits directly above arithmetic on the entry
 * route, so a worker outage must not wall it off.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'expressions-and-equations',
  name: 'Expressions and equations',
  covers:
    'What a letter standing for a number means: the two readings of one, an unknown a ' +
    'condition pins down and a variable a claim holds for; terms, and which of them collect; ' +
    'and substituting a signed number back in. Equations, inequalities and systems are the ' +
    'other half of the subject and are still mapped only — solving is a different skill from ' +
    'reading, and nothing is written for it yet.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'variables-and-expressions',
    name: 'Variables and expressions',
    subjectId: subject.id,
    scope: {
      id: 'variables-and-expressions',
      label: 'Variables and expressions',
      hint: 'variable algebraic expression term coefficient',
      /*
       * Carried verbatim from the map node this concept was promoted out of.
       *
       * Deliberately unchanged. The pattern decides against an article title,
       * and widening it at the same time as writing the material would make
       * two changes at once — the recognition figure in tests/atlas.mjs would
       * move and there would be no way to say which edit moved it.
       */
      match: /\b(algebraic expression|elementary algebra)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'tell-an-unknown-from-a-variable',
        statement:
          'Say whether the letter in a given sentence is an unknown that a condition pins down ' +
          'or a variable that a claim holds for, and say what would count as an answer to each.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'collect-the-terms-that-collect',
        statement:
          'Break an expression into terms, collect the ones whose non-numeric part is identical, ' +
          'and leave the others standing as separate terms.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'substitute-a-signed-number',
        statement:
          'Substitute a negative number into an expression, supplying the brackets the letter was ' +
          'standing in for, and finish by the order of operations.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-letter-has-two-readings',
        conceptId: 'variables-and-expressions',
        statement:
          'A letter can be an unknown — one particular number, not yet named, that a condition ' +
          'picks out — or a variable, standing for any number at all in a claim that holds for ' +
          'all of them. Nothing in the symbol says which. The sentence it sits in says, and that ' +
          'decides what would count as an answer.',
        position: 1,
        /*
         * No `automaticityTarget`. This point is read-and-explain, and a timing
         * target on "say which reading is in force" measures typing — the case
         * types.ts names when it argues the field should usually be absent.
         */
        workedExample: {
          problem:
            'In 3x − 7 = 11 and in 3(x + 2) = 3x + 6, say which reading of x is in force in each, ' +
            'and what would count as an answer.',
          subgoals: [
            {
              label: 'Ask what each sentence claims about x',
              detail:
                'The first is a condition: true for some numbers and false for others, so it is ' +
                'singling one out. The second is a claim: it asserts that two ways of writing the ' +
                'same quantity agree, and it singles nothing out.',
              socratic:
                'Try a few numbers in each of these two sentences. What is different about how ' +
                'the two of them respond?',
            },
            {
              label: 'Test each with numbers',
              detail:
                '3x − 7 = 11 at x = 6 gives 18 − 7 = 11, which is true; at x = 5 it gives 8, which ' +
                'is not. So the first sentence accepts 6 and rejects 5. 3(x + 2) = 3x + 6 at x = 5 ' +
                'gives 21 on both sides, and at x = −1 gives 3 on both sides. Nothing has ' +
                'separated the two sides yet.',
              socratic:
                'You have found a number that satisfies the first sentence and a number that ' +
                'fails it. What happens when you go looking for a number that fails the second?',
            },
            {
              label: 'Read off what would count as an answer',
              detail:
                'For the unknown an answer is a number, and substituting it back is the check — ' +
                'which is why 6 settles the first sentence completely. For the variable no single ' +
                'number can be the answer, because the claim is about all of them: a substitution ' +
                'that works is one case and establishes nothing, and what settles it is the ' +
                'distributive law. A substitution that FAILED would disprove it, and that is the ' +
                'one thing substitution can do here.',
              socratic:
                'Substituting 5 made both sides of the second sentence equal. How much of the ' +
                'claim has that settled?',
            },
          ],
          answer:
            'In 3x − 7 = 11 the x is an unknown, and the answer is the number 6. In ' +
            '3(x + 2) = 3x + 6 the x is a variable, and the answer is that the two sides are the ' +
            'same number for every x — by the distributive law, not by substitution.',
        },
      },
      {
        id: 'terms-collect-only-when-the-letters-match',
        conceptId: 'variables-and-expressions',
        statement:
          'An expression breaks apart at its + and − signs into terms, and inside a term ' +
          'everything is multiplied together. Two terms collect only when the non-numeric part of ' +
          'each is identical, because collecting is the distributive law read backwards — which is ' +
          'also why 3x + 2x² does not collect, however much it looks as though it should.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Simplify 5x + 2 + 3x − 7 + x², and say why the answer is not a single term.',
          subgoals: [
            {
              label: 'Cut the expression at its + and − signs',
              detail:
                'Five terms: 5x, +2, +3x, −7, +x². Each sign belongs to the term that follows it, ' +
                'which is why −7 is a term and not an instruction to do something to the 2.',
              socratic:
                'Where are you allowed to cut this expression into pieces that can be handled ' +
                'independently, and what happens to a minus sign when you cut just before it?',
            },
            {
              label: 'Find which terms share a non-numeric part',
              detail:
                '5x and 3x are each a number times x. 2 and −7 are numbers with no letter at all. ' +
                'x² is x · x, and nothing else here has an x · x in it.',
              socratic:
                'Two of these five terms have exactly the same letter part as each other. Which ' +
                'two — and what is the letter part of x²?',
            },
            {
              label: 'Collect by running the distributive law backwards',
              detail:
                '5x + 3x = (5 + 3)x = 8x. That is the entire justification, and it works only ' +
                'because x stands for a number and the law holds for numbers. The constants ' +
                'collect the same way: 2 − 7 = −5.',
              socratic:
                'What is it that allows 5x + 3x to be written as 8x — and would that same reason ' +
                'work on 5x + 3x²?',
            },
            {
              label: 'Say where it has to stop',
              detail:
                'x², 8x and −5 have three different non-numeric parts — x · x, x, and nothing — so ' +
                'no further collecting is legal. Three terms is the finished answer; an expression ' +
                'not coming down to one thing is the ordinary case, not unfinished work.',
              socratic:
                'You are left with three terms. What would have to be true of two of them for the ' +
                'simplification to carry on?',
            },
          ],
          answer: 'x² + 8x − 5',
        },
      },
      {
        id: 'substituting-supplies-the-hidden-brackets',
        conceptId: 'variables-and-expressions',
        statement:
          'An expression is a recipe rather than a number: it has a value only once the letter ' +
          'has one. Putting a number in means writing out the arithmetic the letter stood for — ' +
          'and a letter carries its sign and its wholeness invisibly, so a negative number needs ' +
          'brackets written down that the letter never needed.',
        position: 3,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Evaluate 5 − 2x + x² at x = −3.',
          subgoals: [
            {
              label: 'Write the substitution with the brackets the letter was hiding',
              detail:
                '2x means 2 · x, so at x = −3 it is 2 · (−3), written 2(−3). The whole expression ' +
                'becomes 5 − 2(−3) + (−3)². Writing 5 − 2 − 3 + −3² instead is not a slip of ' +
                'notation; it is a different expression.',
              socratic:
                'x is one single number here, and that number is negative. What has to appear in ' +
                '2x when you write the −3 in, that was not needed while it was still x?',
            },
            {
              label: 'Let the order of operations finish it',
              detail:
                'The product binds tighter than the subtraction, so 2(−3) = −6 first, and then ' +
                '5 − (−6) = 5 + 6 = 11. The power binds tighter still: (−3)² = (−3)(−3) = 9. ' +
                'Together, 11 + 9 = 20.',
              socratic:
                'There are three operations waiting here and only one of them may go first. ' +
                'Which, and what decides that it is that one?',
            },
            {
              label: 'Check the square against the one it is not',
              detail:
                '(−3)² = 9, because x² is x · x and the letter\'s minus sign is inside the number ' +
                'it stands for. Written −3², the convention applies the power to the 3 alone and ' +
                'negates afterwards, giving −9. Two expressions differing by one pair of brackets, ' +
                'with answers of opposite sign — the same lesson brackets taught in arithmetic, ' +
                'now with a letter to hide the brackets from you.',
              socratic:
                '(−3)² and −3² are not the same number. Which of them is x² at x = −3, and which ' +
                'rule of reading decides that?',
            },
          ],
          answer: '20',
        },
      },
    ],
  },
]

/**
 * No edges, and that is a fact about the boundary rather than an omission.
 *
 * An authored ontology's edges may only name concepts it contains, or
 * `ontologyProblems` reports an unknown endpoint for every one. This subject
 * holds a single concept, so there is no internal pair to join. Everything
 * this concept rests on and everything that rests on it crosses a subject
 * boundary and therefore lives in an area's `links` — see
 * `ALGEBRA_FOUNDATIONS` in atlas-foundations.ts, which declares both halves.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between
 * "there are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const EXPRESSIONS_AND_EQUATIONS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
