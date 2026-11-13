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
 * ── What is deliberately NOT here, AND HOW THAT LIST HAS SHRUNK ───────────
 *
 * This said that `fraction-arithmetic`, `prime-factorisation` and
 * `gcd-and-lcm` all stay mapped: the obvious next three, each needing its own
 * form work to be asked for properly, since "reduce this fraction" is a claim
 * about the answer relative to the input, which `maxDenominatorDegree`
 * expresses for rational expressions and nothing yet expresses for integers.
 * Authoring them as `evaluate`-only would teach the arithmetic and never ask
 * for the reduction, which is the proxy-task failure tasks.ts warns about.
 *
 * Two of the three have since been written anyway, and the reasoning above was
 * half right rather than wrong, which is worth separating:
 *
 *  - `fraction-arithmetic` escaped it. A fraction answer HAS an exact rational
 *    value, so `exactValue` settles it with nothing consulted, and the
 *    reduction never had to be asked for separately.
 *  - `prime-factorisation` did not escape it, and its own header says so in
 *    full after re-checking `checkFactored` rather than trusting this note.
 *    There is still no form that can demand a product of primes. Its tasks ask
 *    the three checkable questions in the vicinity and each prompt names what
 *    it stands in for, which is the same compromise ontology-algebra.ts makes
 *    for collecting like terms.
 *
 * `gcd-and-lcm` was the third, it was the next one to write for the reason
 * recorded below in its own header, and it has now been written — so the list
 * of three deferrals is closed. It did not escape the missing form either: it
 * met the obstacle ontology.ts records (a gcd is a number with no expression in
 * it, and every task must declare a symbol) and worked around it the way
 * `prime-factorisation` did, by computing WITH the factorisation rather than
 * asking for it.
 *
 * Which leaves this subject with seven of its eight concepts needing no form
 * work and one, `fraction-arithmetic`, that never needed any. The next
 * whole-number concept worth authoring is not in this file's territory at all:
 * it is `euclidean-algorithm`, in the number-theory area, and it is the first
 * one where "run this procedure and report the remainder" is the whole content
 * — so it may well be the first in this subject's vicinity that an `evaluate`
 * task fits rather than works around.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'arithmetic-foundations',
  name: 'Arithmetic foundations',
  covers:
    'Whole-number arithmetic and the conventions for reading it: place value, the written ' +
    'algorithms and why they work, order of operations, signed numbers, divisibility, and the ' +
    'primes a whole number comes apart into. Fractions are here too, resting on that ' +
    'divisibility, and so are the gcd and the lcm the fractions are made of. Nothing symbolic ' +
    '— the moment a letter stands for an unknown it is algebra. What is left of whole-number ' +
    'arithmetic is what rests on the gcd rather than on the primes: the Euclidean algorithm and ' +
    'the congruences, which are mapped in the number-theory area and still unwritten.',
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

  /**
   * Fractions, which were the hole under the whole algebra syllabus.
   *
   * ── Why this one, out of 257 mapped concepts ──────────────────────────────
   *
   * `combining-rational` — adding x/(x+1) + 1/x — was reachable without ever
   * having added 1/2 + 1/3. Every move in it IS fraction arithmetic with
   * letters where the numbers were: find a common denominator, rewrite both
   * parts over it, add the numerators, cancel. A learner who has not done that
   * with numbers is being asked to learn the procedure and the abstraction at
   * the same time, and the one that fails is usually the arithmetic.
   *
   * So this gates `combining-rational`, deliberately — see the link in
   * atlas-foundations.ts and the test group in tests/atlas.mjs. That tightens
   * the gate on a concept people can already practise, which authoring
   * arithmetic beneath the algebra did once before and is the same call made
   * for the same reason.
   *
   * ── Why it is exactly rulable, which decided the knowledge points ────────
   *
   * Exact rational arithmetic is precisely what `exactValue` settles, so a
   * fraction answer can be ruled without the CAS at all. The tasks therefore
   * carry a variable rather than being pure numerals — `x/2 + x/3` instead of
   * `1/2 + 1/3` — for two reasons: `tasks.ts` requires every task to declare
   * its symbols, and the variable is the bridge this concept exists to build.
   * The numbers version lives in the worked examples, where it belongs.
   */
  {
    id: 'fraction-arithmetic',
    name: 'Fraction arithmetic',
    subjectId: subject.id,
    scope: {
      id: 'fraction-arithmetic',
      label: 'Fraction arithmetic',
      hint: 'fraction numerator denominator common denominator reciprocal',
      /*
       * Title-shaped, not text-shaped. A pattern loose enough to catch the word
       * "fraction" anywhere in a body of prose would claim every passage that
       * mentions a half — see the scope note in lib/correlate/scope.ts and the
       * four-concept ceiling asserted in tests/atlas.mjs.
       */
      match: /^fractions?\b|\b(common fraction|common denominator|numerator|denominator|reciprocal)s?\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'combine-fractions-exactly',
        statement:
          'Add, multiply and divide fractions, and say which operation needs a common '
          + 'denominator and which does not.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'only-same-sized-parts-add',
        conceptId: 'fraction-arithmetic',
        statement:
          'Only parts of the same size can be added. A common denominator is not a ritual step — '
          + 'it is the act of cutting both fractions into the same-sized pieces so that counting '
          + 'them means something.',
        position: 1,
        workedExample: {
          problem: 'Add 2/3 + 1/4.',
          subgoals: [
            {
              label: 'Find a size both can be cut into',
              detail:
                'Thirds and quarters are different sizes, so neither count can be added to the '
                + 'other. Twelfths work, because 12 is a multiple of both 3 and 4.',
            },
            {
              label: 'Rewrite each part over that size',
              detail:
                '2/3 = 8/12, because each third is four twelfths. 1/4 = 3/12, because each '
                + 'quarter is three twelfths. Nothing has changed value — only the unit.',
            },
            {
              label: 'Now the counts are comparable, so add them',
              detail: '8 twelfths and 3 twelfths is 11 twelfths. The denominator does not add.',
            },
          ],
          answer: '11/12',
        },
      },
      {
        id: 'multiplying-needs-no-common-denominator',
        conceptId: 'fraction-arithmetic',
        statement:
          'Multiplication needs no common denominator, because it is not combining counts of the '
          + 'same thing — it is taking a part OF a part. Cancel common factors before multiplying '
          + 'and the numbers stay small.',
        position: 2,
        workedExample: {
          problem: 'Multiply 4/9 · 3/8.',
          subgoals: [
            {
              label: 'Notice why no common denominator is wanted',
              detail:
                '4/9 of 3/8 asks for a part of a part. Nothing is being counted together, so '
                + 'there is nothing to make the same size.',
            },
            {
              label: 'Cancel across the product first',
              detail:
                '4 and 8 share a factor of 4, leaving 1 and 2. 3 and 9 share a factor of 3, '
                + 'leaving 1 and 3. This is legal because a product may be reordered.',
            },
            {
              label: 'Multiply what is left, straight across',
              detail: '(1 · 1)/(3 · 2) = 1/6. Cancelling after would have meant 12/72.',
            },
          ],
          answer: '1/6',
        },
      },
      {
        id: 'dividing-is-multiplying-by-the-reciprocal',
        conceptId: 'fraction-arithmetic',
        statement:
          'Dividing by a fraction multiplies by its reciprocal. "How many 1/4s fit into 3?" is '
          + 'the question, and the answer is larger than 3 — which is why dividing by something '
          + 'below 1 makes a number bigger.',
        position: 3,
        workedExample: {
          problem: 'Work out (2/3) ÷ (4/5).',
          subgoals: [
            {
              label: 'Say what the question asks',
              detail: 'How many four-fifths fit into two-thirds? Less than one, since 4/5 > 2/3.',
            },
            {
              label: 'Turn it into a multiplication',
              detail:
                'Dividing by 4/5 undoes multiplying by 4/5, and what undoes that is multiplying '
                + 'by 5/4. So (2/3) ÷ (4/5) = (2/3) · (5/4).',
            },
            {
              label: 'Cancel, then multiply',
              detail: '2 and 4 share a factor of 2: (1/3) · (5/2) = 5/6.',
            },
          ],
          answer: '5/6',
        },
      },
    ],
  },

  /**
   * Primes, which is where every other question about a whole number ends up.
   *
   * ── Why this one, and what writing it finishes ────────────────────────────
   *
   * It was the unwritten concept standing lowest on FOUR journeys at once.
   * "Add things that are not the same size" and "Break a hard fraction into
   * easy ones" each had two unwritten steps left and they were the SAME two —
   * this and `gcd-and-lcm` — while "Solve any quadratic" and "Undo a power"
   * each had three, including both of those. So neither of the pair finishes a
   * journey on its own, and the tie broke on which one can lean on material
   * rather than on map: this needs only `divisibility`, two concepts up this
   * file, and `gcd-and-lcm` needs THIS. Writing them the other way round would
   * have stood a syllabus on a skeleton.
   *
   * ── THE MISSING FORM, RE-CHECKED RATHER THAN TAKEN ON TRUST ───────────────
   *
   * This file's header deferred `fraction-arithmetic`, `prime-factorisation`
   * and `gcd-and-lcm` together for each wanting "its own form work". For
   * fractions that turned out to be escapable; here it is not, and the reason
   * is worth writing down because the next person will reach for the same form.
   *
   * "Write 7350 as a product of primes" is the natural `transform_to_form` ask,
   * and `factored` cannot express it. `checkFactored` measures
   * `degreeIn(n, symbol)`; a numeral has degree 0; and degree 0 returns
   * `held: true` with "already irreducible" — correctly, because `x + 3` must
   * not be marked wrong for being a sum. So the form would be satisfied by
   * handing 7350 straight back, which is exactly the free mark
   * tests/concepts-logic.mjs catches by name on `cancel-common-factors-1`.
   * A form that could ask this would have to be about the factors of an
   * integer, and nothing in forms.ts is.
   *
   * So the tasks are `evaluate`, like every other task in this subject, and
   * each prompt names the step it stands in for instead of implying it asked
   * for the factorisation. The factoring lives in the worked examples, which is
   * where `fraction-arithmetic` above put its numbers for the same reason.
   * What the tasks do ask is not a proxy for it: multiplying a factorisation
   * back is the only check there is on one, the divisor count is a fact about
   * the exponents and about nothing else, and dividing out the odd-exponent
   * primes is the move that gets a square out from under a root.
   *
   * ── No automaticity targets, and that is a judgement not an omission ──────
   *
   * The four concepts at the top of this file all carry one; `divisibility` and
   * `fraction-arithmetic` carry none. This belongs with the second pair. Trial
   * division on a four-prime number is a procedure with a stopping rule rather
   * than a recall, and the other two points are arguments — a clock on "which
   * of these exponents are odd" would measure reading speed.
   */
  {
    id: 'prime-factorisation',
    name: 'Prime factorisation',
    subjectId: subject.id,
    scope: {
      id: 'prime-factorisation',
      label: 'Prime factorisation',
      hint: 'prime factorisation fundamental theorem of arithmetic',
      /*
       * Carried verbatim from the map node this was promoted out of, so the
       * concept trail recognises exactly what it recognised before. Title-shaped
       * on purpose: a pattern loose enough to catch "prime" alone would claim
       * every passage that mentions a prime in passing, and the four-concept
       * ceiling in tests/atlas.mjs is what holds that line.
       */
      match: /\b(prime factor|fundamental theorem of arithmetic)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'factor-into-primes',
        statement:
          'Factor a whole number into primes, and check the result by multiplying it back.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'compute-from-the-exponents',
        statement:
          'Answer a question about a number from the exponents of its factorisation rather '
          + 'than by searching: how many divisors it has, and which square divides it.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'one-factorisation-each',
        conceptId: 'prime-factorisation',
        statement:
          'Every whole number above one is a product of primes, and in exactly one way apart '
          + 'from the order. "Exactly one" is the half that does the work later: it is what '
          + 'makes a question about a number answerable by looking at its primes, because there '
          + 'is no second set of primes it might have had instead.',
        position: 1,
        workedExample: {
          problem: 'Factor 7350 into primes.',
          subgoals: [
            {
              label: 'Divide out the smallest prime that goes in',
              detail:
                '7350 is even, so 2 divides it: 7350 = 2 · 3675. What is left is odd, so 2 is '
                + 'finished with — and it cannot come back, because dividing by other primes '
                + 'will not make an odd number even again.',
              socratic:
                'What is the smallest prime that divides 7350 — and once you have taken it out, '
                + 'what tells you whether to take it out a second time?',
            },
            {
              label: 'Repeat on what is left, working up the primes',
              detail:
                'The digit sum of 3675 is 21, which 3 divides, so 3675 = 3 · 1225. The digit sum '
                + 'of 1225 is 10, so 3 is finished. 1225 ends in 5, so 1225 = 5 · 245 and '
                + '245 = 5 · 49 — the 5 goes in twice.',
              socratic:
                'You have 3675 left and 2 is done with. There is a test for 3 that needs no '
                + 'division at all — what is it, and what does it say about this number?',
            },
            {
              label: 'Know when the list of candidates runs out',
              detail:
                '49 is left, and the next prime to try is 7. It is also the last one worth '
                + 'trying: if a number has no prime factor at or below its own square root then '
                + 'it has none at all, since the two factors of any split cannot both exceed the '
                + 'root. Here 7 · 7 = 49 exactly, so 7 goes in twice and 1 remains.',
              socratic:
                'You are down to 49. Which primes do you still have to test — and what makes '
                + 'that a short list rather than every prime below 49?',
            },
            {
              label: 'Collect the repeats as exponents, then check',
              detail:
                'The primes taken out were 2, 3, 5, 5, 7, 7, so 7350 = 2 · 3 · 5² · 7². '
                + 'Multiplying back is the check and it is not optional: 5² · 7² = 25 · 49 = 1225, '
                + 'and 1225 · 6 = 7350. A dropped prime shows up here as a product that is too '
                + 'small, which is the only symptom it has.',
              socratic:
                'Your list of primes is 2, 3, 5, 5, 7, 7. What single piece of arithmetic would '
                + 'catch it if you had dropped one of them along the way?',
            },
          ],
          answer: '7350 = 2 · 3 · 5² · 7²',
        },
      },
      {
        id: 'the-exponents-count-the-divisors',
        conceptId: 'prime-factorisation',
        statement:
          'A divisor is built by choosing how many of each prime to take — none, some, or all '
          + 'of them — and the choices do not interact. So a number with exponents a, b, c has '
          + 'exactly (a+1)(b+1)(c+1) divisors. The count is a fact about the exponents and not '
          + 'about the size of the number: 7350 has 36 divisors and 4096 has 13.',
        position: 2,
        workedExample: {
          problem: 'How many divisors does 7350 = 2 · 3 · 5² · 7² have?',
          subgoals: [
            {
              label: 'Say what a divisor is allowed to be built out of',
              detail:
                'Because 7350 has only one factorisation, any divisor of it is made of 2s, 3s, '
                + '5s and 7s and nothing else — an 11 in a divisor would put an 11 into 7350 '
                + 'too. And it can take no more of each prime than 7350 has. So a divisor IS a '
                + 'choice of exponent for each of the four.',
              socratic:
                'A divisor of 7350 — what is it allowed to be built out of, and what rules 11 '
                + 'out of that list?',
            },
            {
              label: 'Count the choices one prime at a time',
              detail:
                'The 2 can appear 0 times or 1 time: two choices. The 3, the same. The 5 can '
                + 'appear 0, 1 or 2 times: three choices. The 7, the same. Each count is the '
                + 'exponent plus one, and the extra one is the option of leaving that prime out '
                + 'altogether.',
              socratic:
                'The 5 appears twice in 7350. How many different numbers of 5s can one of its '
                + 'divisors contain?',
            },
            {
              label: 'Multiply, because the choices are independent',
              detail:
                'Fixing how many 2s a divisor has constrains nothing about how many 5s it has, '
                + 'so the counts multiply: 2 · 2 · 3 · 3 = 36. Adding them would answer a '
                + 'different question — how many ways there are to pick a single one of the '
                + 'four primes.',
              socratic:
                'You have counts of 2, 2, 3 and 3. What is it about these four decisions that '
                + 'decides whether those numbers get added or multiplied?',
            },
            {
              label: 'Check the two ends of the count',
              detail:
                'Taking every exponent 0 gives 1, and taking every exponent as large as it goes '
                + 'gives 7350 itself. Both really are divisors, so both belong in the 36 — a '
                + 'formula answering 34 here would have quietly left them out.',
              socratic:
                'Which two divisors come from the most extreme choices available, and should '
                + 'they be inside the count or outside it?',
            },
          ],
          answer: '36',
        },
      },
      {
        id: 'a-square-has-even-exponents',
        conceptId: 'prime-factorisation',
        statement:
          'A number is a perfect square exactly when every exponent in its factorisation is '
          + 'even, because squaring doubles every exponent and — there being only one '
          + 'factorisation — nothing else can produce an even one. This is the test that says '
          + 'which part of a number can come out of a square root, and it is what the proof '
          + 'that √2 is irrational actually turns on.',
        position: 3,
        workedExample: {
          problem: 'Is 7350 a square? If not, what is the largest square that divides it?',
          subgoals: [
            {
              label: 'Square something and watch the exponents',
              detail:
                '(2 · 3²)² = 2² · 3⁴ — each exponent doubled, and 18² = 324 = 4 · 81 confirms '
                + 'it. Doubling always lands on an even number, so every exponent of a square '
                + 'is even. Uniqueness is what turns that into a test rather than a hint: a '
                + 'number with an odd exponent cannot also have an all-even factorisation, '
                + 'because it has only the one.',
              socratic:
                'Square 2 · 3² and look at what happened to each exponent. What does that let '
                + 'you rule out about any number with an odd exponent in its factorisation?',
            },
            {
              label: 'Read the exponents against the test',
              detail:
                '7350 = 2 · 3 · 5² · 7² has exponents 1, 1, 2, 2. The 2 and the 3 appear an odd '
                + 'number of times, so 7350 is not a square. Nothing was square-rooted to '
                + 'establish that, and the size of 7350 never came into it.',
              socratic:
                'Read the exponents of 7350 = 2 · 3 · 5² · 7² against that test. Which of them '
                + 'fail it — and did you have to work out a square root to find out?',
            },
            {
              label: 'Split the number at its odd exponents',
              detail:
                'Take out one copy of each odd-exponent prime and what is left has all-even '
                + 'exponents: 7350 / (2 · 3) = 1225 = 5² · 7² = (5 · 7)² = 35². Nothing smaller '
                + 'than 6 would do, because any square divisor has to leave both the 2 and the 3 '
                + 'behind in even quantity and there is only one of each to begin with. So 6 is '
                + 'square-free and 1225 is the largest square dividing 7350.',
              socratic:
                'You know the 2 and the 3 are what spoils it. What is the smallest number you '
                + 'can divide 7350 by to leave a square behind?',
            },
            {
              label: 'Read off what the split is worth elsewhere',
              detail:
                '√7350 = √(35² · 6) = 35√6, and simplifying any root is this same split. It is '
                + 'also the whole of why √2 is not a ratio: a/b = √2 would give a² = 2b², where '
                + 'the exponent of 2 is even on the left and odd on the right, and one number '
                + 'cannot have two factorisations.',
              socratic:
                'You have written 7350 as 35² · 6. What does that let you write √7350 as?',
            },
          ],
          answer:
            '7350 is not a square — the 2 and the 3 have odd exponents. The largest square '
            + 'dividing it is 1225 = 35², leaving the square-free part 6.',
        },
      },
    ],
  },

  /**
   * Gcd and lcm — the last unwritten node of the arithmetic group.
   *
   * ── Why this one, and what writing it finishes ────────────────────────────
   *
   * It was the ONLY unwritten step on two journeys at once: "Add things that
   * are not the same size", which ends at `fraction-arithmetic`, and "Break a
   * hard fraction into easy ones", which ends at `partial-fractions-linear`.
   * Both had one unwritten step left and it was this, so this concept finishes
   * a learner-visible route twice rather than denting a long one. "Solve any
   * quadratic" and "Undo a power" each drop from two unwritten steps to one,
   * `roots-and-irrationals` being the other.
   *
   * It also leans entirely on material: its single prerequisite is
   * `prime-factorisation`, three concepts up this file, and every move here is
   * a question asked of a factorisation. That was the tie-break when those two
   * were written — see that concept's header — and it is now spent.
   *
   * ── THE OBSTACLE ontology.ts RECORDED, AND HOW IT IS ANSWERED ─────────────
   *
   * ontology.ts says, beside `quadratic-formula`, that this node was skipped
   * because "a gcd is a number with no expression to manipulate, and every task
   * must declare a symbol, so 'what is gcd(48, 180)' has no honest shape in
   * this schema at all". That is still true and it is still the constraint.
   *
   * The way round it is the one `prime-factorisation` found: compute WITH the
   * factorisation rather than asking for it. A gcd is not an expression, but
   * `p^a · q^b` at stated primes and exponents is — and that expression IS the
   * gcd once the exponents are the minima, which is the content of the first
   * knowledge point. Likewise `(a · b)/g` is the lcm once `g` is the gcd. So
   * each task hands over the factorisations and the minima, and asks the
   * arithmetic that turns them into the answer. The prompts say so. Finding the
   * factorisation is `prime-factorisation`'s job and finding the minima is what
   * the worked examples teach.
   *
   * What no task here asks is "which exponent is smaller". That needs a form
   * that can demand a relation between two integers, and forms.ts has none —
   * the same gap that stops a `transform_to_form` task asking for a product of
   * primes. Stated rather than hidden, like the compromise one concept up.
   *
   * ── No automaticity targets ───────────────────────────────────────────────
   *
   * Same judgement as `divisibility` and `prime-factorisation`: taking minima
   * over a list of primes is a procedure with a stopping rule, and the other
   * two points are arguments. A clock on "which of these exponents is smaller"
   * would measure reading speed.
   */
  {
    id: 'gcd-and-lcm',
    name: 'Greatest common divisor and least common multiple',
    subjectId: subject.id,
    scope: {
      id: 'gcd-and-lcm',
      label: 'Greatest common divisor and least common multiple',
      hint: 'gcd greatest common divisor lcm least common multiple',
      /*
       * Carried verbatim from the map node this was promoted out of, so the
       * concept trail recognises exactly what it recognised before and the
       * four-concept ceiling in tests/atlas.mjs is unaffected. Title-shaped:
       * the abbreviations are bounded on both sides because "lcm" appears
       * inside no ordinary word but does appear in identifiers.
       */
      match: /\b(greatest common (divisor|factor)|least common multiple|\bgcd\b|\blcm\b)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-both-from-the-factorisations',
        statement:
          'Compute the gcd and the lcm of two whole numbers by taking the smaller and the '
          + 'larger exponent of each prime, instead of listing factors or multiples until '
          + 'something matches.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'trade-one-for-the-other',
        statement:
          'Use gcd · lcm = the product of the pair to get either one from the other in a '
          + 'single division, and say why the argument holds for two numbers and fails for '
          + 'three.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'use-them-on-fractions',
        statement:
          'Add fractions over the lcm of their denominators and reduce the result by its gcd, '
          + 'so neither the size of the intermediate numbers nor the final cancellation is '
          + 'left to searching.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-exponents-decide-both',
        conceptId: 'gcd-and-lcm',
        statement:
          'Factor both numbers and there is nothing left to search for: the gcd takes the '
          + 'SMALLER exponent of each prime and the lcm takes the LARGER. A prime missing from '
          + 'one of the two counts as exponent zero, which is exactly why it is absent from the '
          + 'gcd and present in the lcm.',
        position: 1,
        workedExample: {
          problem: 'Find the gcd and the lcm of 360 and 84.',
          subgoals: [
            {
              label: 'Factor both over the same list of primes',
              detail:
                '360 = 2³ · 3² · 5 and 84 = 2² · 3 · 7. Between them the primes are 2, 3, 5 and '
                + '7, and writing the missing ones in makes the two comparable: 360 is '
                + '2³ · 3² · 5¹ · 7⁰ and 84 is 2² · 3¹ · 5⁰ · 7¹. Both numbers are now a choice '
                + 'of exponent over the same four primes, which is what lets the rest be read '
                + 'off a column at a time.',
              socratic:
                '360 has no 7 in it and 84 has no 5. What exponent do you write for a prime a '
                + 'number does not contain, so that both numbers are lists over the same four '
                + 'primes?',
            },
            {
              label: 'Take the smaller exponent of each prime for the gcd',
              detail:
                'min(3, 2) = 2 for the 2, min(2, 1) = 1 for the 3, min(1, 0) = 0 for the 5 and '
                + 'min(0, 1) = 0 for the 7. So the gcd is 2² · 3 = 12. The smaller exponent is '
                + 'forced rather than chosen: a number dividing both cannot ask for more 2s than '
                + 'the one with fewer of them has, and it may take every one of those.',
              socratic:
                '360 has three 2s and 84 has two. How many 2s can a number that divides BOTH of '
                + 'them contain, and which of the two numbers is what caps it?',
            },
            {
              label: 'Take the larger exponent of each prime for the lcm',
              detail:
                'max(3, 2) = 3, max(2, 1) = 2, max(1, 0) = 1 and max(0, 1) = 1, so the lcm is '
                + '2³ · 3² · 5 · 7 = 8 · 9 · 35 = 2520. Forced the other way: a multiple of 360 '
                + 'contains everything 360 contains, a multiple of 84 contains everything 84 '
                + 'contains, and the least number doing both takes no prime beyond what one of '
                + 'them demanded.',
              socratic:
                'A multiple of 360 has to contain its three 2s, and a multiple of 84 its two. '
                + 'How many 2s does the smallest number that is a multiple of both contain?',
            },
            {
              label: 'Check the pair against the pair, not against your own arithmetic',
              detail:
                '12 · 2520 = 30240, and 360 · 84 = 30240. The two agree, which is the identity '
                + 'in the next point used here as a check — and it is the check worth doing, '
                + 'because the error this method actually produces is a min read as a max, and '
                + 'that moves both answers at once in opposite directions.',
              socratic:
                'You have a gcd of 12 and an lcm of 2520 from the same two numbers. What single '
                + 'multiplication would disagree with you if you had read one of the minima as a '
                + 'maximum?',
            },
          ],
          answer: 'gcd(360, 84) = 12 and lcm(360, 84) = 2520',
        },
      },
      {
        id: 'the-product-is-the-pair',
        conceptId: 'gcd-and-lcm',
        statement:
          'gcd(a, b) · lcm(a, b) = a · b, and the reason is one line about exponents: of any two '
          + 'exponents, the smaller and the larger ARE the two, so their sum is the sum you '
          + 'started with. So either of the pair hands you the other for the price of one '
          + 'division, and the lcm never has to be built from scratch.',
        position: 2,
        workedExample: {
          problem: 'Find the lcm of 24 and 36, and say why finding the gcd was enough.',
          subgoals: [
            {
              label: 'Read the gcd off the factorisations',
              detail:
                '24 = 2³ · 3 and 36 = 2² · 3². The smaller exponents are 2 for the 2 and 1 for '
                + 'the 3, so the gcd is 2² · 3 = 12.',
              socratic:
                '24 = 2³ · 3 and 36 = 2² · 3². For a number that has to divide both, which of '
                + 'each pair of exponents are you forced to take?',
            },
            {
              label: 'Show that the smaller plus the larger is the sum of the two',
              detail:
                'For the 2: min(3, 2) + max(3, 2) = 2 + 3, and 3 + 2 is the same sum. For the 3: '
                + 'min(1, 2) + max(1, 2) = 1 + 2, and 1 + 2 is the same sum. Nothing is special '
                + 'about these numbers — naming two exponents as "the smaller" and "the larger" '
                + 'renames them without replacing them. Multiply over every prime and the '
                + 'exponents of gcd · lcm are the exponents of a · b, so the two numbers are '
                + 'equal.',
              socratic:
                'Take any two exponents and write down the smaller one and then the larger one. '
                + 'What do you notice about the pair you have written down compared with the '
                + 'pair you started with?',
            },
            {
              label: 'Divide rather than factor a second time',
              detail:
                '24 · 36 = 864, and 864 / 12 = 72, so the lcm is 72 — reached without taking a '
                + 'single maximum. Reading it off the exponents gives 2³ · 3² = 72 as well, '
                + 'which is the confirmation and not the method.',
              socratic:
                'You know 24 · 36 = 864 and that gcd(24, 36) = 12. What one piece of arithmetic '
                + 'gets you the lcm from those two facts?',
            },
            {
              label: 'Find where the identity stops — it is a fact about two numbers',
              detail:
                'It fails for three. gcd(2, 2, 2) = 2 and lcm(2, 2, 2) = 2, so the product is 4 '
                + 'while 2 · 2 · 2 = 8. The min-plus-max argument is what breaks: with three '
                + 'exponents the smallest and the largest leave the middle one unaccounted for, '
                + 'so nothing says the sums agree. A three-number lcm has to be built from the '
                + 'exponents.',
              socratic:
                'Try the identity on the three numbers 2, 2 and 2. Which exponent does the '
                + 'min-plus-max argument fail to account for?',
            },
          ],
          answer: 'lcm(24, 36) = 72, from 24 · 36 = 864 divided by the gcd 12',
        },
      },
      {
        id: 'a-common-denominator-is-an-lcm',
        conceptId: 'gcd-and-lcm',
        statement:
          'The two halves of fraction arithmetic are these two numbers wearing different hats. A '
          + 'common denominator is a common multiple, and taking the LEAST one is what keeps the '
          + 'numbers small; reducing the answer divides top and bottom by their gcd, and taking '
          + 'the GREATEST one is what finishes the job in a single division instead of a search.',
        position: 3,
        workedExample: {
          problem: 'Add 1/20 + 11/30, and leave the answer in lowest terms.',
          subgoals: [
            {
              label: 'Use the lcm of the denominators, not their product',
              detail:
                '20 = 2² · 5 and 30 = 2 · 3 · 5, so the lcm is 2² · 3 · 5 = 60. The product '
                + '20 · 30 = 600 is also a common denominator and would give the right answer, '
                + 'but it is ten times larger than it needs to be — and the factor it is too '
                + 'large by is exactly the gcd, which is 10. That is the identity from the '
                + 'previous point showing up as the reason the product is ever the wrong choice.',
              socratic:
                '20 · 30 = 600 is certainly a denominator both twentieths and thirtieths fit '
                + 'into. What is the smallest one, and what number is 600 too large by?',
            },
            {
              label: 'Rewrite each fraction over 60',
              detail:
                '60 / 20 = 3, so each twentieth is three sixtieths and 1/20 = 3/60. '
                + '60 / 30 = 2, so each thirtieth is two sixtieths and 11/30 = 22/60. Each '
                + 'numerator was multiplied by the same factor as its own denominator, so '
                + 'neither fraction changed value — only the unit it is counted in.',
              socratic:
                'You are cutting twentieths up into sixtieths. How many sixtieths is one '
                + 'twentieth, and which division tells you?',
            },
            {
              label: 'Add the counts, now that the parts are the same size',
              detail:
                '3 sixtieths and 22 sixtieths is 25 sixtieths, so the sum is 25/60. The '
                + 'denominator does not add; only the counts do, which is the whole of what a '
                + 'common denominator was for.',
              socratic:
                'You have 3 sixtieths and 22 sixtieths. What happens to the 60 when you put the '
                + 'two together, and why?',
            },
            {
              label: 'Reduce by the gcd, which does it in one division',
              detail:
                '25 = 5² and 60 = 2² · 3 · 5, so the only prime they share is 5 — and 60 has '
                + 'just the one of it, which is the smaller exponent and therefore the one the '
                + 'gcd takes: gcd(25, 60) = 5, and 25/60 = 5/12. Dividing by the greatest '
                + 'common divisor is what makes "lowest terms" a single step — divide by any '
                + 'smaller common factor and there is still something left to cancel, which is '
                + 'how a reduction turns into a hunt.',
              socratic:
                '25/60 is correct but not finished. What is the largest number dividing both 25 '
                + 'and 60, and what are you left holding if you divide by something smaller?',
            },
          ],
          answer: '1/20 + 11/30 = 5/12',
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
  /*
   * Fractions rest on both, and on different parts of each: divisibility is
   * what makes a common denominator findable and a cancellation visible, and
   * signed numbers are what make a negative fraction behave.
   *
   * The edge into `combining-rational` is NOT here — that endpoint is in
   * another authored subject, so it lives in the area's `links`. See
   * atlas-foundations.ts.
   */
  {
    id: 'divisibility->fraction-arithmetic',
    from: 'divisibility',
    to: 'fraction-arithmetic',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'negative-numbers->fraction-arithmetic',
    from: 'negative-numbers',
    to: 'fraction-arithmetic',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },

  /**
   * THE EDGE THAT CAME DOWN OFF THE MAP WITH `prime-factorisation`.
   *
   * The map node declared `needs: ['divisibility']` and that `needs` left the
   * area when the node did — the trap atlas-foundations.ts records twice
   * already. Both endpoints are authored in THIS subject, so unlike the
   * `gcd-and-lcm → fraction-arithmetic` case it has somewhere to live here
   * rather than in the area's `links`.
   *
   * It is also a real gate and not bookkeeping: every step of a trial division
   * is the question "does this prime go in", which is the whole of
   * `divisibility`. Factoring without the tests is guessing.
   */
  {
    id: 'divisibility->prime-factorisation',
    from: 'divisibility',
    to: 'prime-factorisation',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },

  /**
   * THE TWO EDGES THAT CAME DOWN OFF THE MAP WITH `gcd-and-lcm`, FROM OPPOSITE
   * DIRECTIONS.
   *
   * The first is the node's own `needs: ['prime-factorisation']`, stranded by
   * the promotion the way `prime-factorisation`'s own `needs` was one block up.
   * It is a real gate: every move in this concept is a question asked of a
   * factorisation, and there is nothing to take a minimum of until both
   * numbers have one.
   *
   * The second did NOT come off the node. It was
   * `NUMBER_AND_ARITHMETIC.links`, declared there when `fraction-arithmetic`
   * was authored because at that point it crossed from a map node to an
   * authored concept and had nowhere else to live. Promoting this node gives it
   * somewhere: both endpoints are authored in THIS subject now, so the area no
   * longer owns either end of it. Moving it matters for more than tidiness —
   * `links` only reaches the composed `MATHEMATICS`, so while the edge lived
   * there the standalone arithmetic subject, which is `ONTOLOGIES[0]` and what
   * `assemble` is handed by default, did not know that fractions rest on this.
   * Now it does, and the gate bites in the session a cold account is served.
   *
   * Its `because` is carried verbatim as `rationale` rather than reworded,
   * since it is the same claim about the same pair.
   */
  {
    id: 'prime-factorisation->gcd-and-lcm',
    from: 'prime-factorisation',
    to: 'gcd-and-lcm',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'gcd-and-lcm->fraction-arithmetic',
    from: 'gcd-and-lcm',
    to: 'fraction-arithmetic',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'A common denominator is a common multiple and a cancellation is a common factor, so '
      + 'both halves of fraction arithmetic are gcd and lcm wearing different hats.',
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

  /*
   * NO `prime-factorisation => divisibility` EDGE, AND THE REASON IS THE RULE
   * STATED ABOVE RATHER THAN AN OVERSIGHT.
   *
   * It is tempting, and the prose would support it: every step of a trial
   * division asks "does this prime go in", which is `divisibility` exactly —
   * which is why the PREREQUISITE edge is there. But an encompasses edge is a
   * claim about what PRACTISING exercises, not about what the exposition
   * argues from, and that distinction is already what keeps
   * `divisibility => place-value` out of this list.
   *
   * Measured against the three tasks actually shipped for this concept, the
   * claim fails: they are a multiplication (checking a factorisation back), a
   * product of exponents-plus-one, and one division by a stated number. Not one
   * of them makes the learner decide a divisibility question. Adding the edge
   * would hand out credit for divisibility on evidence that contains none of
   * it, and the cost lands on the learner as a concept that stops coming due
   * while still being weak.
   *
   * If a later task for `one-factorisation-each` genuinely asks for the trial
   * division itself — which needs a form this build does not have, see the
   * concept's own header — then this edge becomes correct and should be added
   * with that task, not before it.
   */

  /*
   * AND NO `gcd-and-lcm => prime-factorisation` EDGE, WHICH IS A DELETION AND
   * NOT AN OVERSIGHT, SO IT IS WRITTEN DOWN.
   *
   * The map node declared `exercises: ['prime-factorisation']`, and
   * `expandEdges` turned that into exactly this encompasses edge. It left with
   * the node and has not been restated, because promoting a node moves it from
   * one standard to a stricter one and this claim does not survive the move.
   *
   * `MapNode.exercises` says in its own doc comment that it is "a claim about
   * the mathematics rather than about the material, so it is just as true
   * before the problems exist" — and as mathematics it is unarguable: a gcd is
   * read off two factorisations. An authored `encompasses` edge is the other
   * thing: a claim about what PRACTISING exercises, which is the rule stated
   * above and already what keeps `divisibility => place-value` out of this
   * list. Inert on the map, it becomes load-bearing the moment there is
   * strength to propagate.
   *
   * Measured against the three tasks actually shipped: `(a · b)/g` is one
   * division and the fraction sum is fraction arithmetic, so neither touches a
   * factorisation. The first, `p^a · q^b`, genuinely does share its shape with
   * `prime-factorisation-check-1` — multiplying a factorisation back out. One
   * task of three is not enough, and the asymmetry is why: the effect of an
   * encompasses edge is to stop a concept coming due, so a learner who
   * practised only the other two would be credited for primes on evidence
   * containing none, and the cost lands on them as a weak concept that has
   * stopped being asked about. Re-drilling a prime factorisation costs them a
   * task.
   *
   * What would make it correct is a task here that asks for the minima
   * themselves rather than being handed them — see this concept's header on the
   * form that would take. Add the edge with that task, not before it.
   */

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
