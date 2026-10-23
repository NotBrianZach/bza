/**
 * A third subject ontology: the arithmetic the other two rest on.
 *
 * ── Why this subject, and what it is actually for ─────────────────────────
 *
 * The atlas (atlas.ts, atlas-foundations.ts) named 291 concepts and wrote
 * material for 15 of them, all in algebra. Every one of those 15 therefore sat
 * at the top of a chain whose lower half was mapped-only, and
 * `gatingPrerequisitesOf` looked straight through the lower half to nothing —
 * so `polynomial-arithmetic` and `exponent-rules` were introducible on a cold
 * account. That is correct behaviour for an unwritten map and it is the wrong
 * curriculum: the first thing a learner met was expanding a product of
 * binomials, with no way to be served the long multiplication it is a
 * generalisation of.
 *
 * This file writes the lower half. Five concepts, chosen as the ones the two
 * existing subjects genuinely rest on by way of `algebra-foundations.links`:
 * `integer-arithmetic` under `exponent-rules`, and `order-of-operations` plus
 * `negative-numbers` under `variables-and-expressions` and thence under
 * `polynomial-arithmetic`.
 *
 * ── THE CONSEQUENCE, STATED PLAINLY: THIS TIGHTENS THE GATE ───────────────
 *
 * Authoring material for a mapped node makes it teachable, and a teachable
 * node GATES. So the effect of this file is not to widen the entry point — it
 * is to move it down. Before: `polynomial-arithmetic` open on a cold account,
 * three tasks available. After: `place-value` open, three tasks available, and
 * the two algebra subjects sit behind arithmetic that has to be demonstrated.
 *
 * That is the design working (see `gatingPrerequisitesOf`: gating tightens,
 * never loosens, as material is authored) and it is worth being explicit about
 * because it is easy to author a foundation expecting the session to get bigger
 * and find it got stricter instead.
 *
 * The session does get bigger, two concepts later. Clearing `place-value` and
 * then `integer-arithmetic` opens `order-of-operations`, `negative-numbers` and
 * `divisibility` TOGETHER — and with `place-value` itself still in the pool
 * that is four open concepts and twelve candidate tasks, so the set comes back
 * full at `assemble`'s default size of 8. It is the first point anywhere in the
 * build where `size` binds before the per-concept cap of 3, and it is the whole
 * reason those three are authored as siblings rather than as a chain: a chain
 * would have served 3 tasks at every step of itself.
 *
 * ── A CLAIM DOES NOT SKIP A CHAIN, ONLY A CONCEPT ─────────────────────────
 *
 * It is tempting to say that an adult who already knows this can claim
 * `place-value` and be waved through. They cannot, and the asymmetry is
 * deliberate: `introducible` does not pass `claimed` into its own recursion, so
 * a claim opens the concept it names and is never evidence about anything
 * downstream of it. Skipping arithmetic therefore means claiming each concept
 * you want problems from, one at a time. More friction than it looks, and the
 * safe direction — the worst a bluff achieves is being handed problems it
 * cannot do, which the ordinary ruling path then catches.
 *
 * ── Why these five are gradable with no worker at all ─────────────────────
 *
 * Every task here is `evaluate`, and `ruleEvaluate` settles those by exact
 * rational arithmetic in numerals.ts — bigint over bigint, no CAS. Arithmetic
 * is the one subject in the build where that is not a partial capability but
 * the whole of it, so this subject is fully rulable on a deployment with no
 * math worker configured. `exactValue` returns null for a `function` node, so
 * nothing here uses `abs` even where the mathematics would suggest it; that is
 * also why `absolute-value` is left on the map rather than authored here.
 *
 * `given` is symbolic with an `at` table rather than a bare numeral, following
 * the convention the exponents tasks set. It is not decoration: the test suite
 * re-derives every reference from `given` at `at` (concepts-logic.mjs, "every
 * rationally-valued reference equals its given at the stated inputs"), so an
 * authoring typo fails a test instead of marking a correct learner wrong. A
 * literal numeral in `given` would make that check vacuous.
 *
 * ── What is deliberately NOT here ─────────────────────────────────────────
 *
 * `fraction-arithmetic`, `prime-factorisation` and `gcd-and-lcm` stay mapped.
 * They are the obvious next three and each needs its own form work to be asked
 * for properly — "reduce this fraction" is a claim about the answer relative to
 * the input, which `maxDenominatorDegree` expresses for rational expressions
 * and nothing yet expresses for integers. Authoring them as `evaluate`-only
 * would teach the arithmetic and never ask for the reduction, which is the
 * proxy-task failure tasks.ts warns about — acceptable once, next to a point
 * whose real kind is unrulable, and not acceptable as a whole concept.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'arithmetic-foundations',
  name: 'Arithmetic foundations',
  covers:
    'Whole-number arithmetic and the conventions for reading it: place value, the written ' +
    'algorithms and why they work, order of operations, signed numbers, and divisibility. ' +
    'Nothing symbolic — the moment a letter stands for an unknown it is algebra — and no ' +
    'fractions, which rest on the divisibility here and have their own syllabus still to write.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'place-value',
    name: 'Place value',
    subjectId: subject.id,
    scope: {
      id: 'place-value',
      label: 'Place value',
      hint: 'place value positional notation base ten',
      match: /\b(place value|positional notation|base ten|decimal system|digit\w* position)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-numeral-as-a-sum',
        statement:
          'Write any numeral as a sum of digits times powers of ten, and read that sum back as ' +
          'the numeral.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'digit-position-is-a-multiplier',
        conceptId: 'place-value',
        statement:
          'A digit does not have a value on its own — its position supplies a multiplier, which ' +
          'is a power of ten. That is the whole of why ten symbols are enough to write every ' +
          'number there is.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Write 4073 as a sum of digits times powers of ten.',
          subgoals: [
            {
              label: 'Which position is each digit in?',
              detail:
                'Counting from the right and starting at zero: 3 is in position 0, 7 in position ' +
                '1, 0 in position 2, 4 in position 3. The counting starts at zero because the ' +
                'rightmost multiplier is 10⁰ = 1.',
            },
            {
              label: 'Turn each position into its multiplier',
              detail:
                'Position n contributes 10ⁿ. So the digits are worth 4·10³, 0·10², 7·10¹ and ' +
                '3·10⁰ respectively.',
            },
            {
              label: 'Why the zero still has to be written',
              detail:
                '0·10² contributes nothing to the sum, so it looks droppable — but dropping the ' +
                'symbol moves 4 into position 2 and changes it to 400. The zero is not a value, ' +
                'it is a position-holder, and that is exactly what a positional system needs.',
            },
          ],
          answer: '4·10³ + 0·10² + 7·10¹ + 3·10⁰',
        },
      },
      {
        id: 'carrying-is-regrouping',
        conceptId: 'place-value',
        statement:
          'Carrying is not a rule about writing a small number above a column. It is an exchange: ' +
          'ten of one place is one of the next place up, so a column that overflows hands the ' +
          'excess to its neighbour.',
        position: 2,
        workedExample: {
          problem: 'Add 78 and 45 by working in the places rather than by the written algorithm.',
          subgoals: [
            {
              label: 'Split both numbers into their places',
              detail: '78 is 7·10 + 8, and 45 is 4·10 + 5.',
            },
            {
              label: 'Add the places separately',
              detail:
                'Tens with tens and units with units: (7 + 4)·10 + (8 + 5) = 11·10 + 13. This is ' +
                'already the right number — it is just not written in a legal numeral yet, ' +
                'because a place may only hold one digit.',
            },
            {
              label: 'Exchange until every place holds a single digit',
              detail:
                '13 units is 1·10 + 3, so the units place keeps 3 and hands 1 up: ' +
                '(11 + 1)·10 + 3 = 12·10 + 3. Now the tens place holds 12, so it keeps 2 and ' +
                'hands 1 up to the hundreds: 1·10² + 2·10 + 3.',
            },
            {
              label: 'What the written algorithm was doing',
              detail:
                'The digit you write above the column is the 1 being handed up. The algorithm is ' +
                'this exchange done right-to-left so that each place is final before you leave it.',
            },
          ],
          answer: '1·10² + 2·10 + 3 = 123',
        },
      },
      {
        id: 'places-continue-rightwards',
        conceptId: 'place-value',
        statement:
          'The pattern does not stop at the units. Each step right divides the multiplier by ten, ' +
          'so the places past the point are 10⁻¹, 10⁻² and so on — a decimal is the same idea, ' +
          'not a second one.',
        position: 3,
        workedExample: {
          problem: 'Write 2.37 as a sum of digits times powers of ten, and give its exact value as a fraction.',
          subgoals: [
            {
              label: 'Continue the multipliers past 10⁰',
              detail:
                'Going left multiplies by ten each step, so going right divides by ten each step: ' +
                '10⁰, then 10⁻¹ = 1/10, then 10⁻² = 1/100.',
            },
            {
              label: 'Attach the digits',
              detail: '2·10⁰ + 3·10⁻¹ + 7·10⁻².',
            },
            {
              label: 'Add it up exactly',
              detail:
                '2 + 3/10 + 7/100. Over a hundredth: 200/100 + 30/100 + 7/100 = 237/100. Which is ' +
                'the observation that a terminating decimal is a fraction whose denominator is a ' +
                'power of ten — read off the numeral directly.',
            },
          ],
          answer: '2·10⁰ + 3·10⁻¹ + 7·10⁻² = 237/100',
        },
      },
    ],
  },

  {
    id: 'integer-arithmetic',
    name: 'Adding and multiplying whole numbers',
    subjectId: subject.id,
    scope: {
      id: 'integer-arithmetic',
      label: 'Whole-number arithmetic',
      hint: 'addition multiplication long division distributive law',
      match: /\b(long multiplication|long division|distributive law|associativ\w+|commutativ\w+|quotient and remainder)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'multiply-and-divide-with-reasons',
        statement:
          'Multiply and divide whole numbers, and say which law of arithmetic each step of the ' +
          'written method is using.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'multiplication-distributes-over-the-places',
        conceptId: 'integer-arithmetic',
        statement:
          'Long multiplication is the distributive law applied to place value. You split each ' +
          'number into its places, multiply every part by every part, and add — the grid of ' +
          'partial products is the method, not a trick for remembering it.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Multiply 23 by 47 using the places, and say where the written method\'s rows come from.',
          subgoals: [
            {
              label: 'Split both numbers',
              detail: '23 = 20 + 3 and 47 = 40 + 7.',
            },
            {
              label: 'Multiply every part by every part',
              detail:
                '(20 + 3)(40 + 7) = 20·40 + 20·7 + 3·40 + 3·7 = 800 + 140 + 120 + 21. Four ' +
                'products because each of two parts meets each of two parts.',
            },
            {
              label: 'Add them',
              detail: '800 + 140 + 120 + 21 = 1081.',
            },
            {
              label: 'Where the two rows of the written method went',
              detail:
                'The written method groups the four products into two rows: 7·23 = 161 and ' +
                '40·23 = 920. Same four products, added in a different order, which is legal ' +
                'because addition is associative and commutative. This is the same identity that ' +
                'later expands (x + 3)(x + 7) — the letters change nothing.',
            },
          ],
          answer: '1081',
        },
      },
      {
        id: 'division-leaves-a-remainder',
        conceptId: 'integer-arithmetic',
        statement:
          'Dividing one whole number by another gives a quotient and a remainder, and they are ' +
          'defined by an identity rather than by the algorithm: a = qb + r, with r smaller than b. ' +
          'That constraint on r is what makes the pair unique.',
        position: 2,
        workedExample: {
          problem: 'Divide 137 by 19, and check the answer without dividing again.',
          subgoals: [
            {
              label: 'Find how many whole copies fit',
              detail:
                '19·7 = 133 and 19·8 = 152, which is already past 137. So the quotient is 7.',
            },
            {
              label: 'What is left over',
              detail: '137 − 133 = 4. So the remainder is 4.',
            },
            {
              label: 'Check r is small enough',
              detail:
                '4 < 19. If it were not, another whole copy of 19 would still fit and the ' +
                'quotient would have been too small — this is the check that makes the answer ' +
                'unique rather than merely true.',
            },
            {
              label: 'Verify by the identity, not by repeating the division',
              detail:
                '19·7 + 4 = 133 + 4 = 137. Checking a division by multiplying back is a genuinely ' +
                'independent check; redoing the division repeats whatever mistake you made.',
            },
          ],
          answer: '137 = 19·7 + 4, so the quotient is 7 and the remainder 4',
        },
      },
      {
        id: 'regrouping-makes-arithmetic-easier',
        conceptId: 'integer-arithmetic',
        statement:
          'Commutativity and associativity are not facts to recite — they are permission to ' +
          'reorder a calculation into an easier one. Spotting the pair that makes a round number ' +
          'is most of mental arithmetic.',
        position: 3,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Work out 8 · 7 · 125 without writing down a long multiplication.',
          subgoals: [
            {
              label: 'Look for a pair that is round',
              detail:
                '8 · 125 = 1000. Taken in the written order you would compute 8 · 7 = 56 first and ' +
                'then face 56 · 125, which is a long multiplication.',
            },
            {
              label: 'Reorder, and name the permission',
              detail:
                'Commutativity lets you swap 7 and 125; associativity lets you bracket the 8 with ' +
                'the 125. Both are needed and they are different claims — one about order, one ' +
                'about grouping.',
            },
            {
              label: 'Finish',
              detail: '(8 · 125) · 7 = 1000 · 7 = 7000.',
            },
          ],
          answer: '7000',
        },
      },
    ],
  },

  {
    id: 'order-of-operations',
    name: 'Order of operations',
    subjectId: subject.id,
    scope: {
      id: 'order-of-operations',
      label: 'Order of operations',
      hint: 'order of operations precedence brackets',
      match: /\b(order of operations|precedence|bracket\w*|parenthes\w+|bodmas|pemdas|left[- ]to[- ]right)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-an-unbracketed-expression',
        statement:
          'Evaluate an expression written without enough brackets to be unambiguous, and say ' +
          'which convention decided each step.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'precedence-is-a-convention',
        conceptId: 'order-of-operations',
        statement:
          'Nothing in arithmetic forces 2 + 3·4 to be 14 rather than 20. It is an agreement about ' +
          'how to read a string of symbols, not a theorem — which is why it has to be learned and ' +
          'cannot be derived.',
        position: 1,
        automaticityTarget: 12_000,
        workedExample: {
          problem: 'Evaluate 2 + 3 · 4, and say what the other reading would have given.',
          subgoals: [
            {
              label: 'Notice there are two readings',
              detail:
                'Multiply first: 2 + 12. Add first: 5 · 4. These are 14 and 20 — genuinely ' +
                'different numbers, so the notation on its own is ambiguous.',
            },
            {
              label: 'Apply the convention',
              detail:
                'Multiplication is agreed to bind tighter than addition, so 3 · 4 is one quantity ' +
                'that the 2 is then added to. The answer is 14.',
            },
            {
              label: 'Why this convention and not the other',
              detail:
                'It makes polynomials writable without brackets: 2 + 3x means 2 + (3x), which is ' +
                'the form you want constantly. The convention was chosen to suit the expressions ' +
                'people actually write, which is the only kind of reason a convention can have.',
            },
          ],
          answer: '14',
        },
      },
      {
        id: 'brackets-override-precedence',
        conceptId: 'order-of-operations',
        statement:
          'Brackets are how you say the thing the convention would otherwise not let you say. ' +
          'They are not emphasis and they are not optional decoration — removing a bracket ' +
          'changes which expression you wrote.',
        position: 2,
        automaticityTarget: 12_000,
        workedExample: {
          problem: 'Evaluate (2 + 3) · 4, and compare it with 2 + 3 · 4.',
          subgoals: [
            {
              label: 'Do what the brackets demand',
              detail: '2 + 3 = 5 must happen first, because that is what the bracket means.',
            },
            {
              label: 'Then the outer operation',
              detail: '5 · 4 = 20.',
            },
            {
              label: 'The comparison is the point',
              detail:
                '2 + 3 · 4 = 14 and (2 + 3) · 4 = 20. Two expressions, differing by one pair of ' +
                'brackets, with different values. This is why "simplify" never means "drop the ' +
                'brackets".',
            },
          ],
          answer: '20',
        },
      },
      {
        id: 'equal-rank-goes-left-to-right',
        conceptId: 'order-of-operations',
        statement:
          'Precedence orders operations of different kinds. It says nothing about two of the same ' +
          'rank, and for subtraction and division that gap matters: they are read left to right, ' +
          'because they are not associative.',
        position: 3,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Evaluate 20 − 8 − 5, and show that the grouping is not free.',
          subgoals: [
            {
              label: 'Group to the left, as the convention says',
              detail: '(20 − 8) − 5 = 12 − 5 = 7.',
            },
            {
              label: 'Group to the right, to see what is at stake',
              detail:
                '20 − (8 − 5) = 20 − 3 = 17. Not the same, so subtraction really is ' +
                'non-associative and the convention is doing load-bearing work rather than ' +
                'breaking a tie that does not matter.',
            },
            {
              label: 'The same for division',
              detail:
                '36 / 6 / 3 is (36 / 6) / 3 = 2, not 36 / (6 / 3) = 18. Addition and ' +
                'multiplication are associative, which is exactly why nobody ever needs this rule ' +
                'for them.',
            },
          ],
          answer: '7',
        },
      },
    ],
  },

  {
    id: 'negative-numbers',
    name: 'Negative numbers',
    subjectId: subject.id,
    scope: {
      id: 'negative-numbers',
      label: 'Negative numbers',
      hint: 'negative number signed arithmetic integers sign rules',
      match: /\b(negative number\w*|signed (number\w*|arithmetic)|integers?|sign rule\w*|minus sign)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-with-signs',
        statement:
          'Add, subtract and multiply signed numbers, and justify the sign of the result rather ' +
          'than recalling a rule for it.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'subtraction-becomes-total',
        conceptId: 'negative-numbers',
        statement:
          'Among whole numbers, 4 − 9 has no answer. Extending below zero is what makes ' +
          'subtraction always possible — the negatives are not an extra topic, they are the ' +
          'repair to a gap in an operation you already had.',
        position: 1,
        automaticityTarget: 10_000,
        workedExample: {
          problem: 'Evaluate 4 − 9, and say what is being extended.',
          subgoals: [
            {
              label: 'Ask what the answer has to satisfy',
              detail:
                'It is the number you add to 9 to get 4. Among the whole numbers there is none, ' +
                'because adding to 9 only ever gets bigger.',
            },
            {
              label: 'Extend the line so there is one',
              detail:
                'Going five steps below zero gives −5, and 9 + (−5) = 4 as required. The ' +
                'extension is made so that the answer exists, which is the usual reason a number ' +
                'system grows.',
            },
            {
              label: 'What is kept',
              detail:
                'Every law of arithmetic — commutativity, associativity, distributivity — is ' +
                'required to keep holding on the larger line. That requirement is what fixes the ' +
                'sign rules, as the next point shows; they are consequences, not conventions.',
            },
          ],
          answer: '−5',
        },
      },
      {
        id: 'two-negatives-make-a-positive',
        conceptId: 'negative-numbers',
        statement:
          'That a negative times a negative is positive is forced, not agreed. If you want the ' +
          'distributive law to survive on the extended line, there is no other value it could ' +
          'take.',
        position: 2,
        automaticityTarget: 12_000,
        workedExample: {
          problem: 'Evaluate (−3) · (−7), and show that no other answer is consistent.',
          subgoals: [
            {
              label: 'Start from something certainly zero',
              detail: '(−3) · 0 = 0, and 0 can be written as 7 + (−7).',
            },
            {
              label: 'Distribute',
              detail:
                '(−3)·(7 + (−7)) = (−3)·7 + (−3)·(−7). The left side is 0, and (−3)·7 = −21 ' +
                '(a negative amount taken seven times). So −21 + (−3)·(−7) = 0.',
            },
            {
              label: 'Solve for the unknown product',
              detail:
                '(−3)·(−7) must be whatever adds to −21 to give 0, which is 21. Nothing was ' +
                'chosen here — the distributive law left exactly one option.',
            },
            {
              label: 'Why this is worth knowing as a derivation',
              detail:
                'A remembered sign rule is forgettable and gets misapplied to addition, where it ' +
                'is false: (−3) + (−7) is −10, not 10. A derivation does not transfer to the ' +
                'wrong operation, because the step it rests on is about multiplying.',
            },
          ],
          answer: '21',
        },
      },
      {
        id: 'a-minus-before-a-bracket-distributes',
        conceptId: 'negative-numbers',
        statement:
          'Subtracting a bracket subtracts everything in it. The commonest error in all of ' +
          'arithmetic is applying the minus to the first term only, and it survives into algebra ' +
          'unchanged.',
        position: 3,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Evaluate 5 − (3 − 8).',
          subgoals: [
            {
              label: 'Settle the bracket first',
              detail: '3 − 8 = −5, by the extension in the first point.',
            },
            {
              label: 'Subtract that',
              detail: '5 − (−5) = 5 + 5 = 10, because subtracting a negative adds its size.',
            },
            {
              label: 'The other route, and the trap in it',
              detail:
                'Distributing instead: 5 − 3 + 8 = 10. Same answer — note the sign of the 8 ' +
                'flipped. Writing 5 − 3 − 8 = −6 is the error, and it comes from applying the ' +
                'minus to the 3 and forgetting the 8.',
            },
          ],
          answer: '10',
        },
      },
    ],
  },

  {
    id: 'divisibility',
    name: 'Divisibility and factors',
    subjectId: subject.id,
    scope: {
      id: 'divisibility',
      label: 'Divisibility and factors',
      hint: 'divisibility factor multiple divisor digit sum test',
      match: /\b(divisib\w+|factor\w*|multiple\w*|divisor\w*|divides exactly|digit sum)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-and-use-divisibility',
        statement:
          'Decide whether one whole number divides another, and take a common factor out of a ' +
          'pair.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'divides-exactly-means-no-remainder',
        conceptId: 'divisibility',
        statement:
          'b divides a when the remainder is zero — that is, when a = qb exactly, with nothing ' +
          'left over. It is a statement about a pair of numbers, not about whether the division ' +
          'is easy.',
        position: 1,
        workedExample: {
          problem: 'Does 7 divide 1274? Give the quotient if it does.',
          subgoals: [
            {
              label: 'Divide and watch the remainder',
              detail:
                '7 · 100 = 700, leaving 574. 7 · 80 = 560, leaving 14. 7 · 2 = 14, leaving 0.',
            },
            {
              label: 'Collect the quotient',
              detail: '100 + 80 + 2 = 182, and the remainder is 0.',
            },
            {
              label: 'State it as the definition requires',
              detail:
                '1274 = 7 · 182 with nothing left over, so 7 divides 1274 and 182 is the other ' +
                'factor. Note that finding one factor hands you a second one for free — factors ' +
                'come in pairs.',
            },
          ],
          answer: '1274 = 7 · 182, so yes, with quotient 182',
        },
      },
      {
        id: 'the-digit-sum-test-for-nine',
        conceptId: 'divisibility',
        statement:
          'A number is divisible by 9 exactly when its digit sum is. The test is not a ' +
          'coincidence: every power of ten is one more than a multiple of 9, so each digit ' +
          'contributes its own face value plus a multiple of 9.',
        position: 2,
        workedExample: {
          problem: 'Is 4581 divisible by 9?',
          subgoals: [
            {
              label: 'Add the digits',
              detail: '4 + 5 + 8 + 1 = 18, and 18 is 9 · 2.',
            },
            {
              label: 'Why that settles it',
              detail:
                'Write 4581 in its places: 4·1000 + 5·100 + 8·10 + 1. Now 1000 = 999 + 1, ' +
                '100 = 99 + 1 and 10 = 9 + 1, and 999, 99 and 9 are all multiples of 9. So ' +
                '4581 = (4·999 + 5·99 + 8·9) + (4 + 5 + 8 + 1) — a multiple of 9 plus the digit ' +
                'sum.',
            },
            {
              label: 'Read off the conclusion',
              detail:
                'The bracketed part is divisible by 9 whatever the digits are, so the whole number ' +
                'is divisible by 9 exactly when the digit sum is. 18 is, so 4581 is. The same ' +
                'argument gives the test for 3, because 999, 99 and 9 are multiples of 3 too.',
            },
          ],
          answer: 'Yes — the digit sum is 18, which 9 divides',
        },
      },
      {
        id: 'a-common-factor-comes-out',
        conceptId: 'divisibility',
        statement:
          'When one number divides two others it can be taken outside: 84 and 36 are both 12 ' +
          'times something, so they are 12·(7 + 3) together. This is the distributive law read ' +
          'backwards, and it is the whole of what cancelling a fraction later does.',
        position: 3,
        workedExample: {
          problem: 'Take the largest common factor out of 84 + 36.',
          subgoals: [
            {
              label: 'Find a factor they share',
              detail:
                '12 divides 84 (84 = 12·7) and 12 divides 36 (36 = 12·3). Nothing larger divides ' +
                'both: the next candidates, 24 and 36, fail on 84.',
            },
            {
              label: 'Pull it out',
              detail:
                '84 + 36 = 12·7 + 12·3 = 12·(7 + 3). The step is the distributive law used ' +
                'right-to-left, which is the only direction it ever gets used in when factoring.',
            },
            {
              label: 'Check',
              detail: '12·(7 + 3) = 12·10 = 120, and 84 + 36 = 120.',
            },
            {
              label: 'Where this reappears',
              detail:
                'Identical to taking x out of x² + 3x to get x(x + 3). The authored ' +
                'rational-expressions syllabus opens with that move; this is the numerical case ' +
                'of it, which is why this concept sits beneath it on the map.',
            },
          ],
          answer: '12 · (7 + 3)',
        },
      },
    ],
  },
]

/**
 * The edges.
 *
 * `place-value` is the only root, and that is a real claim rather than an
 * artefact of where the authoring stopped: the written algorithms for addition
 * and multiplication *are* statements about the places, so there is nothing to
 * explain about them to somebody for whom 4073 is four unrelated symbols.
 *
 * The three concepts above `integer-arithmetic` are deliberately siblings
 * rather than a chain. None of them needs either of the others — reading
 * 2 + 3·4 does not require signed numbers, and divisibility does not require
 * brackets — and chaining them to make the curriculum tidier would gate a
 * learner behind something their next problem does not use. It also matters for
 * the session: three open concepts is the first point at which `assemble` fills
 * a set of 8 rather than stopping at one concept's cap of 3.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'place-value->integer-arithmetic',
    from: 'place-value',
    to: 'integer-arithmetic',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'integer-arithmetic->order-of-operations',
    from: 'integer-arithmetic',
    to: 'order-of-operations',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'integer-arithmetic->negative-numbers',
    from: 'integer-arithmetic',
    to: 'negative-numbers',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'integer-arithmetic->divisibility',
    from: 'integer-arithmetic',
    to: 'divisibility',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },

  /**
   * Credit propagation.
   *
   * Each of these is a genuine "you cannot do the first without doing the
   * second", which is the standard `encompasses` has to meet — it is what stops
   * a learner re-drilling exactly what they just demonstrated.
   *
   * `integer-arithmetic => place-value` is the strongest: long multiplication is
   * place value in use, so a correct 23·47 is evidence about the places and
   * should not leave `place-value` coming due as though untouched.
   *
   * There is deliberately no `divisibility => place-value` edge, even though the
   * digit-sum point argues from the places. The argument is in the worked
   * example; the TASK for that point is a digit sum, which exercises addition
   * and not place value, and an encompasses edge is a claim about what
   * practising actually exercises rather than about what the exposition
   * mentions.
   */
  {
    id: 'integer-arithmetic=>place-value',
    from: 'integer-arithmetic',
    to: 'place-value',
    kind: 'encompasses',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'The written algorithms are statements about the places, so multiplying 23 by 47 ' +
      'correctly is evidence that the places are understood.',
  },
  {
    id: 'order-of-operations=>integer-arithmetic',
    from: 'order-of-operations',
    to: 'integer-arithmetic',
    kind: 'encompasses',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'Deciding the order is only half of it — the operations still have to be carried out, so ' +
      'every order-of-operations task is also an arithmetic task.',
  },
  {
    id: 'negative-numbers=>integer-arithmetic',
    from: 'negative-numbers',
    to: 'integer-arithmetic',
    kind: 'encompasses',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'Signed arithmetic is unsigned arithmetic plus a sign decision; the magnitudes are still ' +
      'computed the same way.',
  },
  {
    id: 'divisibility=>integer-arithmetic',
    from: 'divisibility',
    to: 'integer-arithmetic',
    kind: 'encompasses',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'Deciding divisibility is performing a division and looking at the remainder, so it ' +
      'exercises the division it is a question about.',
  },

  /**
   * One interference, and it is the real one.
   *
   * `−3²` and `(−3)²` are −9 and 9, and the reason is that the minus is not part
   * of the base unless a bracket makes it so — which is a precedence fact
   * sitting inside a sign question. A learner drilling signs reads the minus as
   * belonging to the 3; a learner drilling precedence reads the exponent first
   * and is right. Introduced in one set, each concept supplies the plausible
   * wrong reading of the other.
   *
   * It is stated once, from `negative-numbers`, and read both ways.
   */
  {
    id: 'negative-numbers~order-of-operations',
    from: 'negative-numbers',
    to: 'order-of-operations',
    kind: 'interferes_with',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'The sign rules and the precedence rules collide on −3² versus (−3)², where the question ' +
      '"does the minus belong to the base" is a precedence question wearing a sign question\'s ' +
      'clothes. Each concept supplies the other\'s most plausible wrong answer, so they must not ' +
      'be introduced in the same set.',
  },
]

export const ARITHMETIC_FOUNDATIONS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
