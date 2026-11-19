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
 * Which leaves this subject with nine of its ten whole-number concepts needing
 * no form work and one, `fraction-arithmetic`, that never needed any. The next
 * whole-number concept worth authoring is not in this file's territory at all:
 * it is `euclidean-algorithm`, in the number-theory area, and it is the first
 * one where "run this procedure and report the remainder" is the whole content
 * — so it may well be the first in this subject's vicinity that an `evaluate`
 * task fits rather than works around.
 *
 * ── THE ELEVENTH CONCEPT IS NOT A WHOLE-NUMBER ONE, AND THAT IS THE POINT ──
 *
 * `real-number-line` was promoted into this file, and the paragraph above is
 * why it took a sentence of argument rather than none: the sentence says the
 * next thing to write here is a whole-number concept in somebody else's area,
 * and the eleventh concept is instead the one that says what this subject's
 * numbers are NOT enough of. Both can be true. `euclidean-algorithm` is still
 * the next whole-number concept and still mapped elsewhere; this one was
 * available and better placed, and the reasons are structural rather than
 * editorial:
 *
 *  - It was one of six concepts anywhere on the map with every prerequisite
 *    already authored, and the only one of the six whose prerequisites are
 *    both in THIS file — so both stranded edges had somewhere to live and the
 *    area it left needed no `links` entry at all. That is the cheap shape
 *    atlas-foundations.ts describes, for the third time in this subject.
 *  - It is a step on both of the two learning journeys that still cross
 *    unwritten ground, so the promotion shortens both.
 *  - It sits directly beneath `cartesian-plane`, which IS authored, in
 *    ontology-vectors.ts. That makes it the first promotion in this subject
 *    that tightens a gate in the MIDDLE of a written chain rather than at the
 *    bottom of an unwritten one: `plane-vectors` already gated on the plane,
 *    and the plane now gates on a real concept instead of looking through an
 *    empty node to the arithmetic two steps further down.
 *
 * ontology-geometry.ts had been making the second and third of those arguments
 * for three promotions running while choosing against this node anyway,
 * because its area was at the stub floor and could release nothing. The merge
 * described in atlas-foundations.ts removed that block, and this is the first
 * promotion to take the node the record had already named.
 *
 * ── AND IT IS THE FIRST CONCEPT HERE WHOSE SUBJECT IS NOT ARITHMETIC ──────
 *
 * Worth being exact about, because the subject's `covers` draws a line this
 * concept stands on. "Nothing symbolic" still holds — there is not a letter
 * standing for an unknown anywhere in the material. What the concept adds is a
 * claim that is not about computing at all: that the rationals have gaps, that
 * a decimal expansion names a point whether or not it terminates or recurs,
 * and that the least-upper-bound property is what fills them. That is assumed
 * here and PROVED nowhere in this build — real analysis is where the map files
 * the construction — so the third knowledge point says so in those words
 * rather than implying the matter is settled. A foundations subject that
 * asserted completeness as though it had earned it would be the one dishonesty
 * this file has otherwise avoided.
 *
 * ── THE TWELFTH CONCEPT IS THE OTHER HALF OF THAT DEADLOCK ────────────────
 *
 * `ratio-and-rate` was the second of the pair ontology-geometry.ts spent three
 * promotions calling "the area-floor casualties" — both on the route of the
 * two unfinished journeys, both with every prerequisite already authored, and
 * both unpromotable because the area holding them was at the stub floor. The
 * merge described in atlas-foundations.ts lifted that, `real-number-line` was
 * taken straight afterwards, and this is the other one. The record of three
 * promotions declining them is now fully cashed in rather than half.
 *
 * It was chosen over the alternatives on structure, and the comparison is
 * worth keeping because the brief that produced it had gone stale:
 *
 *  - `linear-equations` was the better-placed candidate by dependency depth —
 *    it heads a chain of three reaching `gaussian-elimination`. It is BLOCKED,
 *    and not by effort: ontology-algebra.ts declines it in writing because
 *    "solve for x" asks for the SET of numbers satisfying a condition, and no
 *    `NamedForm` and no `evaluate` target expresses a solution set. Authoring
 *    it as substitute-and-check tasks is the proxy-task failure tasks.ts warns
 *    about. Unblocking it is a TaskKind decision, not an authoring one.
 *
 *    THAT BLOCK HAS SINCE EXPIRED AND SO HAS THE REST OF THAT CHAIN. All three
 *    of `linear-equations`, `systems-of-linear-equations` and
 *    `gaussian-elimination` are authored concepts of `expressions-and-equations`
 *    now. The last sentence is the one that was wrong and it is the one to
 *    distrust in any comment shaped like it: `evaluate` cannot take a set as an
 *    ANSWER, and it rules the NUMBER THAT DECIDES one — which is what every
 *    solve task in that subject asks for. See ontology-algebra.ts's header,
 *    which withdrew the inference four times and wrote down how to recognise it.
 *    The comparison above is left as written because it is a record of why THIS
 *    concept was chosen then, and it was chosen correctly on the information of
 *    the day.
 *  - `solid-geometry` is the one available candidate in `euclidean-geometry`
 *    and its own area file nominates it. It would have to start a NINTH
 *    subject: `plane-geometry`'s `covers` ends "The solids are the rest and
 *    are still mapped only", and the id is literally plane geometry, so solids
 *    cannot be filed there. That is a decision about what region a learner is
 *    shown their material under, which is the kind of thing the merges above
 *    were careful not to make as a side effect of writing worked examples.
 *  - `right-triangle-trig` has the same problem and no area file arguing for
 *    it.
 *
 * This one lands in an EXISTING subject whose `covers` already describes it —
 * "nothing symbolic", and a ratio of two whole numbers is as unsymbolic as
 * arithmetic gets — so it is the only one of the four that adds material
 * without also redrawing the map.
 *
 * WHAT IT COSTS THE GATE, which is the thing authoring always does and is
 * worth stating because this one tightens a gate in a FOREIGN subject.
 * `similarity`, in `plane-geometry`, rests on this concept through
 * `EUCLIDEAN_GEOMETRY.links`. That link gated nothing while this was a
 * skeleton: the walk passed through it to `fraction-arithmetic`. Now
 * `similarity` is gated by `congruence` and this concept instead — the same
 * number of gates with one of them replaced, which is why tests/atlas.mjs
 * checks that set by membership and never by length.
 *
 * AND WHAT IT UNBLOCKS. `percent` rests on this concept and on
 * `decimal-representation`, both authored now, so it becomes the next
 * mechanically-ready node in `algebra-foundations` and a root of that area's
 * own view. It is not on either unfinished journey, so it buys readiness rather
 * than distance. The journeys themselves each lose one unwritten step, which is
 * what made this concept worth taking over a node on only one of them.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'arithmetic-foundations',
  name: 'Arithmetic foundations',
  covers:
    'Whole-number arithmetic and the conventions for reading it: place value, the written ' +
    'algorithms and why they work, order of operations, signed numbers, divisibility, and the ' +
    'primes a whole number comes apart into. Fractions are here too, resting on that ' +
    'divisibility, and so are the gcd and the lcm the fractions are made of. Then the two ' +
    'things a factorisation decides about a ratio — which roots of it are rational, and which ' +
    'of its decimal expansions stop — then the real line, which is where the subject ' +
    'stops being about computing: that a non-terminating non-recurring expansion still names a ' +
    'point, that no two numbers on the line are adjacent, and that the least-upper-bound ' +
    'property is what makes both true. That last one is ASSUMED here and constructed in real ' +
    'analysis, which the concept says in those words. Finally comparison by division, which is ' +
    'the one concept here that USES the fractions rather than building them: a ratio as a claim ' +
    'about a quotient and nothing else, so that its terms count parts and 3 : 5 is three ' +
    'eighths rather than three fifths, and so that the ratio fixes the relation while a second ' +
    'number is needed to fix the size; a rate as a quotient of UNLIKE quantities, which carries ' +
    'a unit and comes in two reciprocal ways up that answer different questions and compare in ' +
    'opposite directions, because sending x to 1/x reverses order on the positives; and scaling ' +
    'as multiplication by the factor the other quantity grew by rather than addition of the ' +
    'difference, with what a relationship gives at zero as the test of whether it may be scaled ' +
    'at all. Percent is the neighbouring node and is mapped only, as are the word problems ' +
    'above it. Nothing symbolic — the moment a letter ' +
    'stands for an unknown it is algebra. What is left of whole-number arithmetic is what ' +
    'rests on the gcd rather than on the primes: the Euclidean algorithm and the congruences, ' +
    'which are mapped in the number-theory area and still unwritten.',
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

  /**
   * Roots and irrational numbers — the step off the rationals.
   *
   * ── Why this one, and what writing it finishes ────────────────────────────
   *
   * `gcd-and-lcm`'s header, two concepts up, named this as the only unwritten
   * step left on "Solve any quadratic" and on "Undo a power" once it was
   * written. That is what this closes: both journeys had exactly one gap, it
   * was this node in both, and promoting it finishes two learner-visible
   * routes rather than denting a long one. It is the same tie-break that
   * chose the last two and it is now spent — every remaining journey with a
   * gap has at least nineteen.
   *
   * It also leans entirely on material. Its two prerequisites are
   * `prime-factorisation` and `fraction-arithmetic`, both authored in this
   * file, and that is not a coincidence of ordering: every move here is a
   * question asked of a factorisation, and the one case where a root comes
   * out rational without being a whole number is a question asked of a
   * fraction. Both edges are restated below rather than left on the map.
   *
   * ── WHAT prime-factorisation ALREADY SAID, AND WHY THIS IS NOT A REPEAT ───
   *
   * The fourth subgoal of `a-square-has-even-exponents` ends by observing that
   * the odd-exponent split "is also the whole of why √2 is not a ratio", and gives
   * the a² = 2b² parity argument in two lines. That was a preview offered as
   * the pay-off of a technique; it is the content here, and the division is
   * deliberate rather than duplication:
   *
   *  - There, the question was "what is the largest square dividing 7350" and
   *    the irrationality remark was what the answer turned out to be good for.
   *  - Here, the question is "which roots are rational at all", and the parity
   *    argument is the thing being established. The third knowledge point
   *    therefore states it as a proof and then uses it as a TEST — the part
   *    the preview does not reach — because the useful form of the argument is
   *    not "√2 is irrational" but "√N is rational exactly when every exponent
   *    of N is even", which decides any case put in front of it.
   *
   * The worked examples share no numbers with that concept's, so neither reads
   * as a recall of the other.
   *
   * ── THE FORM THAT DID NOT EXIST, AND NOW DOES ─────────────────────────────
   *
   * This section used to record a wall. The natural task for the middle
   * knowledge point is "simplify √1008", and it could not be asked:
   * `radical_free` demands the radical GO and 12√7 still has one, and nothing
   * in forms.ts made a claim about a SUBTERM's factorisation rather than about
   * the top-level shape of an answer. This was the third time the subject met
   * that wall — a product of primes (`prime-factorisation`), a relation between
   * two integers (`gcd-and-lcm`), a condition under a radical here — and each
   * concept worked around it by computing WITH a split it was handed.
   *
   * `surd_reduced` is that form, and the middle point now asks the question
   * directly. Two things had to land, and the second was not the one this
   * header predicted:
   *
   *  1. the form itself, which refuses √1008 and accepts 12√7;
   *  2. a way to compare the two WITHOUT the CAS. `transform_to_form` was
   *     routed unconditionally to the worker, which would have broken this
   *     subject's no-worker contract to ask a question about integers. `asSurd`
   *     in numerals.ts puts a single-term surd in normal form, and for distinct
   *     square-free r the numbers √r are linearly independent over the
   *     rationals — so agreement of normal forms is a DECISION, not a sample.
   *
   * The two older tasks stay. They are not proxies for the new one: one takes
   * the square-free part of an integer root, the other the one root of a
   * non-integer that is still exactly rational, and neither is what "simplify
   * this surd" asks. `gcd-and-lcm`'s wall is the one still standing — a
   * relation between two integers is not a property of one expression, so no
   * form can carry it and it needs a task kind instead.
   *
   * ── Still gradable with no worker, which was worth checking rather than ───
   *    assuming
   *
   * This subject's header claims every task in it is settled by exact rational
   * arithmetic with no math worker configured, and a concept about irrational
   * numbers is the obvious place for that to quietly stop being true.
   * `exactValue` handles a `sqrt` node and a rational exponent, returning the
   * value when it is rational and null when it is not — so `sqrt(49/16)` is
   * 7/4 locally and `sqrt(2)` is worker-only, honestly. The three `evaluate`
   * tasks are therefore built on roots that come out exactly: a perfect fourth
   * power, a perfect square over a perfect square, and two plain divisions.
   *
   * The `surd_reduced` task is the one case where BOTH sides are irrational and
   * it is still settled here, which is worth stating because it is the
   * surprising part: `exactValue` returns null for √1008 and for 12√7 alike, so
   * nothing about their VALUES is computed. `asSurd` compares normal forms
   * instead, and that is exact. Nothing here needs `WORKER_ONLY` in the test
   * suite, and the claim in the subject header stands unamended.
   *
   * ── No automaticity targets, and no `encompasses` edge ────────────────────
   *
   * Same judgement as the three concepts above: dividing exponents by an index
   * is a procedure with a stopping rule, and the third point is an argument. A
   * clock on "is this exponent even" measures reading speed.
   *
   * The `encompasses` question is the one `gcd-and-lcm` records at length, and
   * it comes out the same way for the same reason. Reading a root off a
   * factorisation genuinely shares its shape with `prime-factorisation`, but
   * measured against the four tasks actually shipped, three of them are handed
   * the factorisation or do not involve one at all. Crediting primes on that
   * evidence would stop the concept coming due for a learner who never
   * produced a factorisation, and the cost lands on them. Add the edge with a
   * task that asks for the split itself — see the form note above.
   */
  {
    id: 'roots-and-irrationals',
    name: 'Roots and irrational numbers',
    subjectId: subject.id,
    scope: {
      id: 'roots-and-irrationals',
      label: 'Roots and irrational numbers',
      hint: 'square root irrational surd radical',
      /*
       * Carried verbatim from the map node this was promoted out of, so the
       * concept trail recognises exactly what it recognised before and the
       * four-concept ceiling in tests/atlas.mjs is unaffected. Title-shaped:
       * "square root" and "nth root" are left unbounded on the right so that
       * "Square root of 2" and "nth root algorithm" both land, while
       * "irrational number" is bounded because "irrational" alone is a word
       * about behaviour as often as about number.
       */
      match: /\b(irrational number|square root|nth root|surd)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-root-off-a-factorisation',
        statement:
          'Decide whether a whole number is a perfect nth power and produce its nth root by '
          + 'dividing each exponent of its factorisation by n, instead of searching for a '
          + 'number that works.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'write-a-root-exactly-rather-than-rounded',
        statement:
          'Split a root into its largest square factor and its square-free part, so a root '
          + 'that is not a whole number is written exactly as a multiple of a smaller root '
          + 'instead of rounded to a decimal.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'say-which-roots-are-rational-and-why',
        statement:
          'State the exponent argument showing no fraction squares to 2, and use it as a test '
          + 'to decide whether a given root is rational or irrational.',
        taskKinds: ['state', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-root-undoes-a-power',
        conceptId: 'roots-and-irrationals',
        statement:
          'An nth root asks the question an nth power answers: which number, used as a factor n '
          + 'times, gives this one. On a factorisation that question is pure bookkeeping — '
          + 'raising to the nth power MULTIPLIES every exponent by n, so taking the nth root '
          + 'DIVIDES every exponent by n, and the root is a whole number exactly when every '
          + 'division comes out even.',
        position: 1,
        workedExample: {
          problem: 'Is 1728 a perfect cube, and if so what is its cube root?',
          subgoals: [
            {
              label: 'Factor first, so the question becomes arithmetic on exponents',
              detail:
                '1728 = 2⁶ · 3³. Worth doing before anything else: a cube root is a question '
                + 'about the exponents, and until they are written down there is nothing to ask '
                + 'it of. Guessing instead means multiplying candidates out — and the candidates '
                + 'near the answer are 11³ = 1331 and 13³ = 2197, neither close enough to '
                + 'suggest the next guess.',
              socratic:
                'Before deciding whether 1728 is a cube, what do you need written down about '
                + 'it — and what would you otherwise be reduced to doing?',
            },
            {
              label: 'Test each exponent for divisibility by the index, not the number for size',
              detail:
                'The index is 3, and the exponents are 6 and 3. Both are divisible by 3, so 1728 '
                + 'IS a perfect cube. This is the square test from `prime-factorisation` with 3 '
                + 'in place of 2: there, an even exponent everywhere meant a square. The rule is '
                + 'the same because the reason is — a cube has three equal factors, so every '
                + 'prime in it appears a multiple of three times.',
              socratic:
                '1728 = 2⁶ · 3³ and you are asking about cubes rather than squares. What do you '
                + 'now need to be true of the 6 and the 3?',
            },
            {
              label: 'Divide each exponent by the index to build the root',
              detail:
                '6 / 3 = 2 and 3 / 3 = 1, so the cube root is 2² · 3¹ = 4 · 3 = 12. The root is '
                + 'assembled rather than found: nothing was tried and rejected, and the size of '
                + '1728 played no part in the work.',
              socratic:
                'You have 2⁶ · 3³ and an index of 3. What do you do to the 6 and the 3 to get '
                + 'the exponents of the root itself?',
            },
            {
              label: 'Check forwards, because the error this makes is an arithmetic slip',
              detail:
                '12³ = 12 · 144 = 1728. Worth the one multiplication: the method cannot produce '
                + 'the wrong KIND of answer once the divisibility test has passed, so the only '
                + 'failure left is mis-dividing an exponent or mis-multiplying the root back '
                + 'together, and going forwards catches both.',
              socratic:
                'You have 12 as the cube root. What single calculation would disagree with you '
                + 'if you had divided one of the exponents wrongly?',
            },
          ],
          answer: '1728 = 2⁶ · 3³ is a perfect cube, and its cube root is 2² · 3 = 12',
        },
      },
      {
        id: 'pull-the-square-out',
        conceptId: 'roots-and-irrationals',
        statement:
          'When the exponents do NOT all divide, the root still splits: √(a · b) = √a · √b lets '
          + 'the perfect-square part come out from under the radical and leaves the rest behind. '
          + 'Taking out the LARGEST square factor leaves a square-free number under the sign, '
          + 'which is what makes the written answer exact and unique rather than merely correct.',
        position: 2,
        workedExample: {
          problem: 'Write √720 exactly, with nothing left under the radical that need not be there.',
          subgoals: [
            {
              label: 'Factor, and sort the exponents into even and odd',
              detail:
                '720 = 2⁴ · 3² · 5¹. The 2 and the 3 have even exponents and the 5 has an odd '
                + 'one. That sorting is the whole decision: an even exponent is a square already '
                + 'and can leave, an odd one has one copy too many to pair up and must stay.',
              socratic:
                '720 = 2⁴ · 3² · 5. A square needs its factors in pairs. Which of these three '
                + 'primes cannot be fully paired up?',
            },
            {
              label: 'Take out one copy of each odd-exponent prime, and halve the rest',
              detail:
                'The single 5 stays under the sign. Everything else is 2⁴ · 3² = 16 · 9 = 144, '
                + 'and halving its exponents gives √144 = 2² · 3 = 12. So 144 is the largest '
                + 'square dividing 720 and 5 is the square-free part. Nothing larger would work: '
                + 'any square divisor must leave the 5 behind, because there is only one of it.',
              socratic:
                'The 5 has to stay. What is the largest square that divides 720, and what does '
                + 'the single 5 force about it?',
            },
            {
              label: 'Read the two parts off as a product',
              detail:
                '√720 = √(144 · 5) = √144 · √5 = 12√5. The split is only legal because the root '
                + 'of a product is the product of the roots, which is what lets a factor cross '
                + 'the radical sign at all — and it is why the part that crosses has to be a '
                + 'perfect square.',
              socratic:
                'You have 720 = 144 · 5 with 144 a perfect square. What does that let you write '
                + '√720 as, and which rule about roots are you using?',
            },
            {
              label: 'Check the size, because this is where a decimal would have hidden an error',
              detail:
                '26² = 676 and 27² = 729, and 720 sits between them, so √720 is between 26 and '
                + '27. And 12√5 ≈ 12 · 2.236 = 26.8, which agrees. The check is worth having '
                + 'because 12√5 is EXACT and 26.8 is not: the decimal is where the next step '
                + 'would start losing precision, so it belongs in the check and not in the '
                + 'answer.',
              socratic:
                'You have 12√5 and no decimal anywhere in it. What two consecutive whole numbers '
                + 'could you square to trap 720 between them, and does your answer land inside?',
            },
          ],
          answer: '√720 = 12√5, from 720 = 144 · 5 with 144 = 12² the largest square factor',
        },
      },
      {
        id: 'root-of-a-non-square-is-irrational',
        conceptId: 'roots-and-irrationals',
        statement:
          'When the square-free part is not 1, the root is not a fraction AT ALL — not a '
          + 'fraction nobody has found, but one that cannot exist. The reason is the exponent '
          + 'bookkeeping again: squaring a fraction doubles every exponent, and a doubled '
          + 'exponent is even, so no squared fraction can equal a number with an odd one. This '
          + 'is the first number a reader meets that the fractions cannot reach.',
        position: 3,
        workedExample: {
          problem: 'Show that √2 is not a ratio of whole numbers, then use the argument to decide √45.',
          subgoals: [
            {
              label: 'Suppose it is a ratio, and square to clear the root',
              detail:
                'Suppose √2 = a/b for whole numbers a and b. Squaring both sides gives '
                + 'a²/b² = 2, so a² = 2b². The root is now gone and what is left is a statement '
                + 'about whole numbers — which is the move that makes the question answerable, '
                + 'because unique factorisation is a fact about whole numbers and says nothing '
                + 'about radicals.',
              socratic:
                'You have assumed √2 = a/b. What can you do to both sides to leave a statement '
                + 'with no root in it, and why is that worth having?',
            },
            {
              label: 'Count the 2s on each side',
              detail:
                'Let a contain the prime 2 exactly m times and b exactly k times. Then a² '
                + 'contains it 2m times, and 2b² contains it 2k + 1 times — the doubling from '
                + 'the square, plus the one 2 standing in front. So the left side has an even '
                + 'number of 2s and the right side an odd number. Note that no size estimate, '
                + 'and no "lowest terms" assumption, has been used.',
              socratic:
                'In a² = 2b², count how many times the prime 2 divides each side. What is '
                + 'different about the two counts?',
            },
            {
              label: 'Close it with uniqueness, which is what forbids two answers',
              detail:
                'a² and 2b² are the same number, and a number has exactly one factorisation, so '
                + 'it has one count of 2s — it cannot be both even and odd. The supposition is '
                + 'therefore impossible, and no whole numbers a and b exist. The conclusion is '
                + 'not that the fraction is hard to find; it is that 2 is not the square of any '
                + 'ratio.',
              socratic:
                'The same number has been shown to contain an even and an odd number of 2s. '
                + 'Which fact about factorisations makes that impossible rather than merely '
                + 'surprising?',
            },
            {
              label: 'Turn the proof into a test and run it',
              detail:
                'The argument used nothing about 2 except that its exponent was odd, so it works '
                + 'on any prime: √N is rational exactly when every exponent of N is even — the '
                + 'perfect-square test from the first point, now with a converse. 45 = 3² · 5, '
                + 'and the 5 has exponent 1, so √45 is irrational. The second point still says '
                + 'how to write it: √45 = 3√5.',
              socratic:
                '45 = 3² · 5. The argument above only ever used that an exponent was odd — so '
                + 'what does it tell you about √45, and which exponent decides it?',
            },
          ],
          answer:
            'No whole a, b satisfy a² = 2b², because the prime 2 would divide one number an even '
            + 'and an odd number of times — so √2 is irrational. By the same count √45 is too, '
            + 'and √45 = 3√5.',
        },
      },
    ],
  },

  /**
   * The tenth concept, and the one that finishes what base ten can say about a
   * ratio.
   *
   * ── Why this one next ─────────────────────────────────────────────────────
   *
   * It was the only node left in `NUMBER_AND_ARITHMETIC` whose every
   * prerequisite was already authored, and both of them are load-bearing
   * rather than nominal, which is the argument for writing it rather than
   * something further up:
   *
   *  - `prime-factorisation` DECIDES the question. A fraction terminates
   *    exactly when its reduced denominator has no prime but 2 and 5, and that
   *    is not a rule of thumb about the denominator's size or shape — it is a
   *    statement about its factorisation, because 10ⁿ = 2ⁿ · 5ⁿ and a
   *    denominator can only divide a power of ten by being built from the same
   *    two primes.
   *  - `fraction-arithmetic` is what makes the test APPLICABLE. The
   *    factorisation that decides it is the factorisation of the REDUCED
   *    denominator, so a learner who cannot cancel will read 7/56 as having a
   *    7 in the bottom and conclude it recurs. It is 1/8, and it stops after
   *    three places. The reduction is the first move of the first worked
   *    example for exactly that reason.
   *
   * So this concept is where the two halves of the subject above fractions
   * meet, and the meeting is the content rather than a convenience.
   *
   * ── THE FORM THAT DOES NOT EXIST, AND WHAT THAT COSTS ─────────────────────
   *
   * Three concepts in this subject have now met the same wall and this is the
   * fourth: the thing the concept teaches is a claim about the FORM of an
   * answer, and `evaluate` can only check its VALUE. Here it bites harder than
   * it did for `prime-factorisation`, because 0.125 and 1/8 are *the same
   * rational number*. No equivalence check can prefer one, so no task in this
   * build can ask "write this as a decimal" and refuse the fraction — and
   * `no evaluate task declares a form` is asserted over the whole set, so the
   * demand cannot be smuggled in either.
   *
   * What would fix it is a `NamedForm` making a claim about the WRITTEN shape
   * of a numeral — "decimal_expansion", satisfied by 0.125 and refused for
   * 1/8. forms.ts could decide it with no CAS, since `expr.ts` already parses
   * a decimal as its own node kind (`{ kind: 'decimal' }`) and keeps the digits
   * as written. That is a smaller change than `surd_reduced` was. It is not
   * made here because adding a form is a change to a shared union that every
   * subject reads, and it should be made with the task that needs it in front
   * of a reviewer rather than folded into a content pass.
   *
   * Until it lands, the three tasks follow the compromise this file already
   * records for `prime-factorisation`: each asks the arithmetic the method
   * actually turns on, and each prompt names the step it stands in for. The
   * tasks.ts comment says which move each one is. Writing the decimal is what
   * the worked examples are for.
   *
   * ── Still gradable with no worker ─────────────────────────────────────────
   *
   * The subject's no-worker contract holds and this concept is the easiest case
   * for it in the file: every task is integer arithmetic over integers. A
   * decimal numeral is an exact rational to `exactValue` — it reads the digits
   * as an integer over a power of ten via bigint, so nothing goes through a
   * float and 0.125 is 1/8 exactly rather than nearly. The repeating-block task
   * is one exact division of 999999, and the recurring-to-fraction task is one
   * subtraction over another. Nothing here needs `WORKER_ONLY`.
   *
   * ── No automaticity targets, and no `encompasses` edge ────────────────────
   *
   * Same judgement as every concept above, and the second half is the one worth
   * stating. Converting a fraction to a decimal is a division, so an
   * `encompasses` edge to `fraction-arithmetic` is tempting and the prose would
   * carry it. Measured against the three tasks actually shipped it fails the
   * standard this file holds `encompasses` to — a claim about what PRACTISING
   * exercises, not about what the exposition argues from. Task one is handed its
   * reduction in the prompt, task two is a division by 7 with no fraction in it,
   * and task three is a subtraction. Not one of them makes the learner cancel a
   * fraction, so crediting fraction arithmetic here would stop it coming due on
   * evidence containing none of it, and the cost lands on the learner.
   *
   * The edge becomes correct alongside a task that asks for the reduction
   * itself — which is the same missing form again, since "reduce this" is a
   * claim about the answer relative to the input.
   */
  {
    id: 'decimal-representation',
    name: 'Decimals and recurrence',
    subjectId: subject.id,
    scope: {
      id: 'decimal-representation',
      label: 'Decimals and recurrence',
      hint: 'decimal expansion recurring repeating decimal',
      /*
       * Carried verbatim from the map node this was promoted out of, so the
       * concept trail recognises exactly what it recognised before and the
       * four-concept ceiling in tests/atlas.mjs is unaffected.
       *
       * Title-shaped, and narrow on purpose: "decimal" alone is a word about
       * notation everywhere in school mathematics, so it is only matched when
       * followed by the word that makes it this concept's subject —
       * "representation" or "expansion" — while "repeating decimal" is its own
       * alternative because that is the title the recurring case is filed
       * under.
       */
      match: /\b(decimal (representation|expansion)|repeating decimal)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-termination-from-the-reduced-denominator',
        statement:
          'Decide whether a fraction terminates in base ten by reducing it and factorising the '
          + 'denominator, and say why only 2s and 5s are allowed, rather than by dividing and '
          + 'waiting to see what happens.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'produce-a-repeating-block-and-bound-it',
        statement:
          'Produce the repeating block of a fraction that does not terminate, and argue from the '
          + 'remainders that the digits must eventually repeat and that the block is no longer '
          + 'than one less than the denominator.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'recover-the-exact-fraction-from-a-recurring-decimal',
        statement:
          'Recover the exact fraction a recurring decimal names, by multiplying through by the '
          + 'two powers of ten that align the tails and subtracting — and state why those two '
          + 'powers are the ones to choose.',
        taskKinds: ['evaluate', 'state'],
      },
    ],
    knowledgePoints: [
      {
        id: 'terminates-when-the-denominator-is-only-2s-and-5s',
        conceptId: 'decimal-representation',
        statement:
          'A decimal with n places IS a fraction over 10ⁿ — 0.125 is 125/1000 and nothing else. '
          + 'So a fraction has a terminating decimal exactly when it can be rewritten over a '
          + 'power of ten, and since 10ⁿ = 2ⁿ · 5ⁿ that happens exactly when the REDUCED '
          + 'denominator is built from no primes but 2 and 5. Any other prime can never be '
          + 'cancelled into a power of ten, because a power of ten does not contain it.',
        position: 1,
        workedExample: {
          problem: 'Does 7/56 terminate in base ten, and if so write it out exactly?',
          subgoals: [
            {
              label: 'Reduce first, because the test is about the reduced denominator',
              detail:
                'gcd(7, 56) = 7, so 7/56 = 1/8. This move is not tidying and skipping it gives '
                + 'the wrong answer: 56 = 2³ · 7 contains a 7, so the unreduced denominator fails '
                + 'the test, while the number itself passes it. The 7 was never really in the '
                + 'denominator — it was a factor of both ends waiting to cancel.',
              socratic:
                'You are about to factorise the denominator of 7/56 to decide this. Is 56 the '
                + 'number the test should be applied to?',
            },
            {
              label: 'Factorise the denominator and look for a prime that is not 2 or 5',
              detail:
                '8 = 2³. There is no prime here but 2, so 1/8 terminates. The rule is not '
                + 'arbitrary: to become a decimal the fraction must be rewritten over some 10ⁿ = '
                + '2ⁿ · 5ⁿ, which means 8 has to DIVIDE a power of ten, and a number containing '
                + 'any other prime cannot — unique factorisation says the power of ten has no '
                + 'such prime to match it against.',
              socratic:
                '8 = 2³, and to be a decimal this has to be rewritten over a power of ten. What '
                + 'is a power of ten made of, and does 2³ fit inside one?',
            },
            {
              label: 'Complete the denominator to a power of ten, which also says how many places',
              detail:
                'The denominator needs to become 2ⁿ · 5ⁿ, and 8 = 2³ already has three 2s and no '
                + '5s — so multiplying top and bottom by 5³ = 125 gives 125/1000. The deficit '
                + 'decides the length: n is the LARGER of the two exponents, here max(3, 0) = 3, '
                + 'so the decimal has exactly three places.',
              socratic:
                'You have 1/8 = 1/2³ and you want a denominator of the form 2ⁿ · 5ⁿ. What is the '
                + 'smallest n that works, and what does that force you to multiply by?',
            },
            {
              label: 'Read the digits off the numerator, since the denominator is now a power of ten',
              detail:
                '125/1000 = 0.125. No division was performed at this step and that is the point '
                + 'of having completed the denominator: over a power of ten the decimal is the '
                + 'numerator with the point moved, so the three places come from the three zeros '
                + 'rather than from a long division that happened to stop.',
              socratic:
                'You have 125/1000. Why does this one need no division at all to be written as a '
                + 'decimal, when 1/8 did?',
            },
          ],
          answer:
            '7/56 = 1/8, and 8 = 2³ has no prime but 2, so it terminates: 1/8 = 125/1000 = 0.125, '
            + 'with max(3, 0) = 3 places.',
        },
      },
      {
        id: 'a-remainder-must-repeat',
        conceptId: 'decimal-representation',
        statement:
          'When the reduced denominator d does contain another prime, the division never ends — '
          + 'but it cannot wander forever either. Every step leaves a remainder in 1 … d − 1, so '
          + 'within d − 1 steps some remainder must come back, and a repeated remainder means a '
          + 'repeated state: from there the digits do exactly what they did before. The decimal '
          + 'recurs because there are only finitely many places for it to be.',
        position: 2,
        workedExample: {
          problem: 'Divide out 3/7, and say what fixes the length of its repeating block.',
          subgoals: [
            {
              label: 'Divide, and record the REMAINDER at each step rather than only the digit',
              detail:
                '30 ÷ 7 = 4 r 2; 20 ÷ 7 = 2 r 6; 60 ÷ 7 = 8 r 4; 40 ÷ 7 = 5 r 5; 50 ÷ 7 = 7 r 1; '
                + '10 ÷ 7 = 1 r 3. Digits so far: 0.428571. The remainders are the thing to watch '
                + 'because they, not the digits, are what the next step depends on — the digit is '
                + 'an output and the remainder is the state.',
              socratic:
                'At each step of this division you write down a digit and carry a remainder. '
                + 'Which of the two determines what the next step does?',
            },
            {
              label: 'Stop when a remainder recurs, not when a digit looks familiar',
              detail:
                'The last remainder is 3, which is the one the division started with. So step '
                + 'seven must be step one again, and the six digits 428571 repeat forever: 3/7 = '
                + '0.428571428571… The repetition is forced at the moment the remainder returns, '
                + 'and a digit coming round again proves nothing on its own — the 4 and the 2 '
                + 'could recur with different remainders behind them and the sequel would differ.',
              socratic:
                'The remainder has just come back to 3, the value you began with. What does that '
                + 'tell you about the next six digits, and why would a repeated DIGIT not have '
                + 'told you the same thing?',
            },
            {
              label: 'Bound the block by counting the states available',
              detail:
                'A nonzero remainder on division by 7 is one of 1, 2, 3, 4, 5, 6 — six values. '
                + 'The six that appeared were 3, 2, 6, 4, 5, 1, all of them, so this block is as '
                + 'long as division by 7 permits. That is the general bound: the period is at most '
                + 'd − 1, because a seventh step would have to reuse a remainder it had already '
                + 'had, and termination is the case where the remainder reaches 0 instead.',
              socratic:
                'Dividing by 7, how many different nonzero remainders can there be — and what '
                + 'does that let you say about the period before you divide at all?',
            },
            {
              label: 'Check against a power of ten, which is the same fact without the division',
              detail:
                'A block of length 6 means 10⁶ − 1 is divisible by 7, and 999999 = 7 · 142857. '
                + 'That is the check and also the shortcut: 1/7 = 142857/999999, and dividing by a '
                + 'string of nines is what a purely repeating decimal IS. Multiplying by 3 gives '
                + '3/7 = 428571/999999, whose numerator is the block just computed.',
              socratic:
                'If the block has length 6, then 3/7 can be written with a denominator of 999999. '
                + 'What must be true of 7 and 10⁶ − 1 for that to work?',
            },
          ],
          answer:
            '3/7 = 0.428571428571… with a block of 6, because the remainders 3, 2, 6, 4, 5, 1 use '
            + 'every nonzero remainder available before returning to 3 — the longest a denominator '
            + 'of 7 allows. Equivalently 3/7 = 428571/999999.',
        },
      },
      {
        id: 'subtract-to-clear-the-recurring-tail',
        conceptId: 'decimal-representation',
        statement:
          'A recurring decimal is not an approximation of a fraction, it is a way of writing one '
          + 'exactly — and the fraction can be recovered. Two copies of the number scaled so their '
          + 'infinite tails line up have a DIFFERENCE with no tail at all, which turns the '
          + 'recurring part from the obstacle into the thing that cancels.',
        position: 3,
        workedExample: {
          problem: 'Write 0.41666… — where only the 6 repeats — as an exact fraction.',
          subgoals: [
            {
              label: 'Count the two lengths, because they choose the two multipliers',
              detail:
                'Let x = 0.41666… There are two digits before the repetition starts (41) and one '
                + 'digit in the repeating block (6). Those two counts are the whole of the setup: '
                + 'everything that follows is forced by them, and a method that says "multiply by '
                + '10 or 100 or 1000" without counting is guessing at which.',
              socratic:
                'In 0.41666… two things need counting before you multiply by anything. What are '
                + 'they?',
            },
            {
              label: 'Scale twice, to put the two tails in the same position',
              detail:
                '1000x = 416.666… and 100x = 41.666… — the 100 moves the point past the two fixed '
                + 'digits, and the extra factor of 10 moves it on past one full block. Both now '
                + 'have the identical tail .666…, which is the only property being engineered '
                + 'here; their whole-number parts are allowed to be anything.',
              socratic:
                'You want two multiples of x whose decimal tails are identical. Given two fixed '
                + 'digits and a block of one, which two powers of ten do that, and what is each '
                + 'one for?',
            },
            {
              label: 'Subtract, and the infinite part disappears',
              detail:
                '1000x − 100x = 416.666… − 41.666… = 375, so 900x = 375. The tails were equal and '
                + 'cancelled exactly — not approximately — which is why this is a derivation and '
                + 'not an estimate. What is left is an equation between whole numbers.',
              socratic:
                'You have 1000x = 416.666… and 100x = 41.666…. What happens to the part that goes '
                + 'on forever when you subtract, and how exact is that?',
            },
            {
              label: 'Solve, reduce, and check against the terminating test',
              detail:
                'x = 375/900 = 5/12. Worth checking against the first point rather than trusting '
                + 'it: 12 = 2² · 3, and the 3 is a prime other than 2 and 5, so this number had to '
                + 'recur — and the 2² predicts exactly max(2, 0) = 2 non-repeating places, which '
                + 'is the 41 that was counted at the start. The two points agree.',
              socratic:
                'You have x = 5/12 and 12 = 2² · 3. Does the first point agree that this number '
                + 'recurs, and does it also account for the two digits before the repetition?',
            },
          ],
          answer:
            'x = 0.41666… gives 1000x − 100x = 375, so x = 375/900 = 5/12. The denominator 12 = '
            + '2² · 3 confirms it: the 3 forces recurrence, and the 2² the two fixed places.',
        },
      },
    ],
  },

  /**
   * The eleventh concept, and the one that stops the subject being about
   * computing.
   *
   * ── What it adds that its two prerequisites do not ────────────────────────
   *
   * Both of them end one step short of this, and in opposite directions, which
   * is why the concept has content rather than being their summary:
   *
   *  - `roots-and-irrationals` proves that √2 is not a ratio. That is a
   *    NEGATIVE result: it says what the number is not, and nothing in it says
   *    where the number is. A learner who has only that proof has been shown a
   *    hole, not a point.
   *  - `decimal-representation` says what a decimal does when the number IS a
   *    ratio — it stops, or it recurs, decided by the reduced denominator's
   *    factorisation. It therefore classifies every expansion a rational can
   *    have, and says nothing at all about the ones left over.
   *
   * Put together they say that a non-terminating non-recurring expansion is
   * not a fraction and that such expansions exist. What neither says is that
   * one NAMES something. That is this concept, and the three points are the
   * three parts of it: the digits can be computed (and are never revised), the
   * things so named are packed with no gaps and no successors, and the
   * assumption that makes both true is completeness.
   *
   * ── Why it is figure-free, which was the thing to check ───────────────────
   *
   * "The real line" sounds like a picture, and if the material were the
   * picture it would belong on the map with the circle theorems — this build
   * has no figures and `visualRef` has nothing to name. It is not the picture.
   * Every move in all three worked examples is a comparison between two exact
   * rationals, and the number line is only ever the ORDER those comparisons
   * establish. The one place a drawing would normally be doing the work is the
   * claim that there are no gaps, and that is exactly the claim this concept
   * refuses to make from a drawing: the third point states it as an axiom and
   * names where it is proved.
   *
   * ── THE THIRD POINT IS ABOUT SOMETHING THIS BUILD CANNOT RULE, AND SAYS SO ─
   *
   * Completeness is not a computation and no `evaluate` task can ask for it.
   * That is a harder version of the missing-form wall the four concepts above
   * record, because here the thing missing is not a `NamedForm` but a claim
   * about an infinite set, and no form would help. So the task for that point
   * asks the one inequality the argument turns on — that 17/12 is above √2 and
   * therefore bounds the whole increasing list — and the prompt says plainly
   * that the least-upper-bound half cannot be asked for. The compromise is the
   * one tasks.ts describes for proxy tasks, held to its own rule: ask a
   * checkable question in the vicinity and name what it stands in for.
   *
   * It is the first point in this subject where the proxy covers only PART of
   * the content rather than standing in for the whole of it, and that is worth
   * separating. For `prime-factorisation` the task was the method's last step
   * instead of its first; here the task is one hypothesis of a two-hypothesis
   * argument, and the conclusion is unreachable by any task. A reader deciding
   * whether to write another concept of this shape should know that the
   * worked example is carrying more of the teaching than usual, which is an
   * argument for the Socratic phrasing being complete rather than for the
   * concept being skipped.
   *
   * ── Still gradable with no worker ─────────────────────────────────────────
   *
   * The subject's no-worker contract holds, and this was the concept most
   * likely to break it — the material is about numbers `exactValue` returns
   * null for. It holds because none of the three tasks asks for an irrational
   * VALUE. The first clears the decimal point and compares two integers
   * (264² against 7 · 100²), which is the same comparison the digit rests on
   * and is why a digit of √7 can be settled exactly at all. The second is a
   * mean of two fractions. The third squares a fraction and subtracts. Nothing
   * here goes near `WORKER_ONLY`.
   *
   * The first task's shape is the mathematically interesting part of that and
   * not a dodge: 2.64² < 7 and 264² < 7 · 100² are the same statement, and
   * writing it the second way is what shows that every digit of an irrational
   * is decided by whole-number arithmetic. The irrationality is in the
   * non-termination, never in any one step.
   *
   * ── No automaticity targets, and no `encompasses` edge ────────────────────
   *
   * No targets, same judgement as the ten concepts above: squaring candidates
   * until the sign changes is a procedure with a stopping rule, and the other
   * two points are arguments.
   *
   * The `encompasses` question is closer here than anywhere else in the file
   * and still comes out no, which is why it is written down. Two of the three
   * tasks are fraction arithmetic in the plainest sense — a mean over a common
   * denominator, and a square of a fraction — so a `=> fraction-arithmetic`
   * edge has more support than the one-task-in-three cases this file has
   * already declined. It fails anyway, on the rule those declines establish:
   * the standard is what PRACTISING exercises, and the first task contains no
   * fraction at all. A learner who practised only that one would stop having
   * fraction arithmetic come due on evidence containing none of it, and the
   * cost lands on them. Two of three is not "you cannot do the first without
   * doing the second", which is the bar.
   *
   * No interference either, and this one is an absence rather than a decline:
   * the map node carried no `confusedWith`, so the promotion stranded none.
   * Recorded because `expandEdges` turns a `confusedWith` into an
   * `interferes_with` and deleting the node would have deleted the edge with
   * every suite still green — an absence nobody checked reads exactly like a
   * loss.
   */
  {
    id: 'real-number-line',
    name: 'The real line',
    subjectId: subject.id,
    scope: {
      id: 'real-number-line',
      label: 'The real line',
      hint: 'real numbers number line completeness',
      /*
       * Carried verbatim from the map node this was promoted out of, so the
       * concept trail recognises exactly what it recognised before and the
       * four-concept ceiling in tests/atlas.mjs is unaffected.
       *
       * Title-shaped, and all three alternatives are bounded on both sides.
       * "Real" is an adjective about everything in mathematics — a real matrix,
       * a real root, the real part — so it is only matched where the next word
       * makes the phrase the name of this object.
       */
      match: /\b(real number|real line|number line)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-the-digits-of-a-number-that-is-not-a-fraction',
        statement:
          'Settle any decimal place of an irrational square root by squaring candidate decimals '
          + 'and reading the sign of the comparison, and say why each digit so found is never '
          + 'afterwards revised — rather than copying a calculator\'s display and trusting it.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'show-that-no-two-reals-are-adjacent',
        statement:
          'Produce a number strictly between any two given different numbers by taking their '
          + 'mean, and use the fact that this never runs out to explain why no number on the '
          + 'line has a next one — including why 0.4999… is not the number just below 0.5.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'state-what-completeness-assumes-and-what-it-buys',
        statement:
          'State the least-upper-bound property as an assumption rather than a result, exhibit a '
          + 'rational upper bound for the decimal approximations of √2 and show that no rational '
          + 'bound is least, and name real analysis as where a system with the property is '
          + 'constructed.',
        taskKinds: ['evaluate', 'state'],
      },
    ],
    knowledgePoints: [
      {
        id: 'every-digit-is-settled-by-whole-numbers',
        conceptId: 'real-number-line',
        statement:
          'An irrational number has a decimal expansion, and every digit of it is decided by '
          + 'whole-number arithmetic. To find a place of √N you square candidate decimals and '
          + 'compare the square with N: squaring preserves order on positive numbers, so the '
          + 'comparison transfers, and you never need the root to find a digit of the root. Each '
          + 'digit is fixed by an exact inequality and no later digit can move an earlier one — '
          + 'what makes the number irrational is that the process does not stop, never that any '
          + 'one step is approximate.',
        position: 1,
        workedExample: {
          problem: 'Find the first two decimal places of √7, using nothing but multiplication.',
          subgoals: [
            {
              label: 'Bracket between whole numbers first, so the later digits have somewhere to sit',
              detail:
                '2² = 4 and 3² = 9, and 4 < 7 < 9. Squaring is increasing on the positives, so '
                + 'the number whose square is 7 lies between 2 and 3. The whole-number part is '
                + 'now settled and nothing computed later can change it, which is what makes the '
                + 'next step a search over one digit rather than over a number.',
              socratic:
                'You want the digits of √7 and the only operation you are allowed is '
                + 'multiplication. Which two whole numbers can you square to trap 7 between them?',
            },
            {
              label: 'Walk the tenths and stop where the comparison changes side',
              detail:
                '2.6² = 6.76 and 2.7² = 7.29, so 6.76 < 7 < 7.29 and the first decimal place is '
                + '6. Notice what was compared: the two SQUARES against 7, never the candidates '
                + 'against √7. That is the move the whole method rests on — comparing against '
                + 'the root would need the root, which is the thing being computed.',
              socratic:
                'You are testing 2.6 and 2.7 as candidates for the first digit. You cannot '
                + 'compare either of them with √7, because that is what you are looking for — so '
                + 'what can you compare, and against what?',
            },
            {
              label: 'Repeat at the hundredths, and watch the bracket shrink by a factor of ten',
              detail:
                '2.64² = 6.9696 and 2.65² = 7.0225, so 6.9696 < 7 < 7.0225 and the second place '
                + 'is 4. The bracket has gone from width 1 to 0.1 to 0.01. That is the whole '
                + 'cost structure of the method: one more digit costs a handful of '
                + 'multiplications and buys one more place, and there is no step at which it '
                + 'becomes harder.',
              socratic:
                'The tenths trapped √7 between 2.6 and 2.7. How wide is that interval, and how '
                + 'wide will it be once you have settled the next digit?',
            },
            {
              label: 'Read off what the process delivers, and what it does not',
              detail:
                'It delivers 2.64…, and each digit for good: every one was fixed by an '
                + 'inequality between exact rationals, so no later work can revise it. It does '
                + 'not deliver an end. 7 has the odd exponent 1, so √7 is irrational by the test '
                + 'in `roots-and-irrationals`; and `decimal-representation` showed that every '
                + 'fraction either terminates or recurs, so this expansion can do neither. It '
                + 'therefore names something that is not a fraction — which is the claim the '
                + 'rest of this concept is about, and the first point at which the rationals are '
                + 'not enough.',
              socratic:
                'Every digit here was fixed for good by an exact comparison, and the process '
                + 'never ends. Given that a fraction\'s expansion must either stop or recur, '
                + 'what does that tell you about what these digits name?',
            },
          ],
          answer:
            '√7 = 2.64…: 2² = 4 < 7 < 9 = 3², then 2.6² = 6.76 < 7 < 7.29 = 2.7², then '
            + '2.64² = 6.9696 < 7 < 7.0225 = 2.65². Every digit is settled by a comparison '
            + 'between exact rationals and never revised, and the process does not terminate — 7 '
            + 'has an odd exponent, so √7 is irrational, and an expansion that neither '
            + 'terminates nor recurs is not a fraction.',
        },
      },
      {
        id: 'no-two-reals-are-adjacent',
        conceptId: 'real-number-line',
        statement:
          'Every integer has a next one. No number on the line does. Given two different numbers, '
          + 'their mean lies strictly between them and is a number of the same kind — so there is '
          + 'always a third, and then infinitely many, and no "next" number for any of them to '
          + 'be. Adjacency is never a property of two numbers; it is a property of the '
          + 'denominator or the decimal place you happened to write them over.',
        position: 2,
        workedExample: {
          problem:
            'Find a number strictly between 2/9 and 3/13, then decide what lies strictly between '
            + '0.4999… and 0.5.',
          subgoals: [
            {
              label: 'Put the two over a common denominator, which is where the trap is set',
              detail:
                '9 and 13 are coprime, so the common denominator is 117: 2/9 = 26/117 and '
                + '3/13 = 27/117. The numerators are CONSECUTIVE, and that is exactly the shape '
                + 'that makes a learner say there is nothing in between. What has actually been '
                + 'established is narrower: there is no number between them WITH DENOMINATOR '
                + '117. The question was about the line.',
              socratic:
                '2/9 = 26/117 and 3/13 = 27/117. What makes it tempting to say nothing lies '
                + 'between these two, and what has the common denominator actually established?',
            },
            {
              label: 'Take the mean, which moves the denominator instead of the numerators',
              detail:
                '(26/117 + 27/117) / 2 = (53/117) / 2 = 53/234. Over 234 the two original '
                + 'numbers are 52/234 and 54/234, so 53/234 sits strictly between them. The '
                + 'numerators had no room and the denominator did: doubling it is what created '
                + 'the space, which is the sense in which adjacency was an artefact of the '
                + 'denominator chosen.',
              socratic:
                'You want a number between 26/117 and 27/117 and the numerators leave no room. '
                + 'What else about the way they are written can you change?',
            },
            {
              label: 'Notice the move has no last step, which is the actual conclusion',
              detail:
                'The same argument now applies to 26/117 and 53/234, and to whatever that '
                + 'produces, with no stopping point. So 53/234 is not the next number after 2/9 '
                + 'and nothing else is either — 2/9 has no next number. And nothing in the '
                + 'argument used that the two numbers were fractions: the mean of any two '
                + 'different numbers lies strictly between them, so this is a fact about the '
                + 'line and not about the rationals.',
              socratic:
                'You have found one number between these two. What stops you from calling 53/234 '
                + 'the next number after 2/9?',
            },
            {
              label: 'Apply it to the case that feels like a counterexample',
              detail:
                '0.4999… is read as the number just below 0.5, which is a belief in a next '
                + 'number — and the argument above has just ruled one out, since a largest '
                + 'number below 0.5 would have a mean with 0.5 that was larger and still below. '
                + 'So recover it with the previous concept\'s method: x = 0.4999… and '
                + '10x = 4.999… have identical tails, so 10x − x = 4.5, giving 9x = 4.5 and '
                + 'x = 0.5. It is not just below 0.5; it is 0.5, written differently. Two '
                + 'expansions, one point.',
              socratic:
                'Recover the number 0.4999… names, by aligning the tails and subtracting. What '
                + 'does your answer say about "the number just below 0.5"?',
            },
          ],
          answer:
            '2/9 = 26/117 and 3/13 = 27/117, and their mean 53/234 lies strictly between them, '
            + 'since 26/117 = 52/234 and 27/117 = 54/234. The move works on any two different '
            + 'numbers and has no last step, so nothing on the line has a next one — and '
            + '0.4999… is therefore not just below 0.5. Aligning and subtracting gives '
            + '9x = 4.5, so it IS 0.5.',
        },
      },
      {
        id: 'completeness-is-assumed-not-proved-here',
        conceptId: 'real-number-line',
        statement:
          'Both points above used that a decimal expansion names a number, and nothing so far has '
          + 'said why it does. The decimals 1, 1.4, 1.41, 1.414, … increase, never pass 17/12, and '
          + 'close in on nothing that is a fraction — so within the rationals this list has upper '
          + 'bounds and no LEAST one. The real line is the system in which every bounded set has '
          + 'a least upper bound, and that is assumed here rather than established: real analysis '
          + 'constructs such a system out of the rationals. Naming the assumption is the content; '
          + '"the line has no gaps" is a picture, and the axiom is what replaces it.',
        position: 3,
        workedExample: {
          problem:
            'Show that 1, 1.4, 1.41, 1.414, … has rational upper bounds but no least one, and say '
            + 'which assumption fills the gap.',
          subgoals: [
            {
              label: 'Check the two hypotheses, because they are all the argument uses',
              detail:
                'Increasing: each term keeps the previous digits and appends another, and the '
                + 'square of each stays below 2 — 1.414² = 1.999396. Bounded: '
                + '(17/12)² = 289/144 = 2 + 1/144, which is above 2, so by the order argument of '
                + 'the first point 17/12 is above every term whose square is below 2. The bound '
                + 'is itself rational, and close: 17/12 = 1.41666…',
              socratic:
                'You want to show 17/12 is above every term of this list. You cannot compare '
                + '17/12 with √2, since that is the number in question — so what do you compare, '
                + 'and which fact about squaring makes the comparison transfer?',
            },
            {
              label: 'Show the bound is not the least one, by producing a smaller bound',
              detail:
                '1.4143² = 2.00024449, which is above 2, so 1.4143 is also an upper bound — and '
                + '1.4143 < 17/12. So is 1.41422, since 1.41422² = 2.0000182084. Both are '
                + 'smaller than the bound before them, and the recipe is general: take enough '
                + 'digits of the expansion and round the last one up.',
              socratic:
                '17/12 bounds the list. Using the digits the first point computes, how would you '
                + 'produce a SMALLER rational number that also bounds it?',
            },
            {
              label: 'Close the gap off: no rational bound can be least',
              detail:
                'Let r be any rational upper bound. Then r² ≥ 2 — if r² were below 2, the '
                + 'bracketing of the first point would eventually produce a term of the list '
                + 'above r, and r would not have been a bound. And r² = 2 is impossible by '
                + '`roots-and-irrationals`, so r² > 2 strictly. Now take enough digits and round '
                + 'the last one up: that gives a rational bound within 10^(−k) of the number the '
                + 'list approaches, so for large enough k it is below r. Every rational bound has '
                + 'a smaller one, which means this bounded increasing list has no least upper '
                + 'bound in the rationals. That is not a gap in the argument; it is a gap in the '
                + 'rationals.',
              socratic:
                'Suppose r is a rational upper bound for the list. What do the irrationality '
                + 'proof and the shrinking brackets of the first point together let you build '
                + 'from r?',
            },
            {
              label: 'Name the assumption, and name where it is discharged',
              detail:
                'The least-upper-bound property — every non-empty set with an upper bound has a '
                + 'least one — is what the real line asserts and what the rationals have just '
                + 'been shown to lack. It is ASSUMED here. A system satisfying it is constructed '
                + 'from the rationals in real analysis, by Dedekind cuts or by Cauchy sequences, '
                + 'and the map files that construction there rather than here. Everything above '
                + 'rests on it: the digits of √7 in the first point name a number only because '
                + 'the assumption says there is one for them to name.',
              socratic:
                'Those three facts — increasing, bounded, no least rational bound — are all '
                + 'facts about the rationals, and together they say this list closes in on '
                + 'nothing inside them. What does the real line have to assert for it to close '
                + 'in on something, and has anything here proved that assertion?',
            },
          ],
          answer:
            'Every term of 1, 1.4, 1.41, 1.414, … squares to below 2, and (17/12)² = 2 + 1/144 is '
            + 'above it, so 17/12 bounds the list. It is not least: 1.4143² = 2.00024449 and '
            + '1.41422² = 2.0000182084 are both above 2 and both smaller, and one more digit '
            + 'rounded up always gives a smaller one again — so no rational upper bound is least. '
            + 'The least-upper-bound property is what the real line assumes and the rationals '
            + 'lack, and real analysis is where a system having it is built.',
        },
      },
    ],
  },
  {
    id: 'ratio-and-rate',
    name: 'Ratio and rate',
    subjectId: subject.id,
    scope: {
      id: 'ratio-and-rate',
      label: 'Ratio and rate',
      hint: 'ratio rate proportion unit rate',
      /*
       * Carried verbatim from the map node, as the two promotions before this
       * one were, and for their reason: widening a pattern at the same time as
       * writing the material would move the recognition figure in
       * tests/atlas.mjs on a change that also adds a concept, and there would
       * be no way to say which edit moved it.
       *
       * It was already title-shaped and tightly so, which is worth reading
       * rather than assuming. `^ratio` is ANCHORED instead of matching the word
       * anywhere, because "ratio" sits inside the ratio test, the golden ratio
       * and the likelihood ratio, and none of those is this concept. "Rate" is
       * not matched alone at all, for the reason `real-number-line` gives about
       * "real": an interest rate, a heart rate and a rate of convergence are
       * all rates, so the word is reached only through "rate of change", where
       * the phrase is the name of the thing.
       */
      match: /^ratio\b|\b(proportionality|rate of change)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'share-a-total-in-a-given-ratio',
        statement:
          'Divide a given total in a given ratio by counting the PARTS rather than the terms, '
          + 'and say what a ratio on its own does and does not settle about the two quantities.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'put-a-rate-the-right-way-up',
        statement:
          'Compute either of the two unit rates a pair of unlike quantities admits, say which '
          + 'question each one answers, and explain why the better buy is the smaller of one and '
          + 'the larger of the other.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'tell-a-proportional-relationship-from-an-additive-one',
        statement:
          'Scale a quantity by multiplying by the factor the other one grew by rather than '
          + 'adding the difference, and decide whether a stated relationship is proportional at '
          + 'all by testing what it gives at zero.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-ratio-fixes-the-quotient-not-the-quantities',
        conceptId: 'ratio-and-rate',
        statement:
          'A ratio compares two quantities by dividing them, so 3 : 5 is satisfied by 3 and 5, by '
          + '30 and 50, and by 90 and 150 — what every such pair shares is the quotient and '
          + 'nothing else. So a ratio never says how much of anything there is; it says how the '
          + 'amounts are related, and one further number, usually the total, is what settles the '
          + 'size. The terms also count PARTS rather than wholes: 3 : 5 is three parts out of '
          + 'eight, never three out of five.',
        position: 1,
        /*
         * No `automaticityTarget`, and not by copying the five untimed points
         * above it. The error this point exists to stop is reading 3 : 5 as
         * three fifths, which is a misreading — so rewarding speed here would
         * train precisely the mistake, which is the case ontology-geometry.ts
         * calls the read-it-slowly one. The arithmetic underneath is one
         * division and one multiplication, and `place-value` already times
         * those.
         */
        workedExample: {
          problem: 'Share 240 in the ratio 3 : 5, and say what the ratio alone left undecided.',
          subgoals: [
            {
              label: 'Count the parts, which is where the 8 comes from and the 5 does not',
              detail:
                'The terms are 3 and 5, so the total is cut into 3 + 5 = 8 equal parts. The '
                + 'commonest error is reading 3 : 5 as "three fifths" and taking 3/5 of 240, '
                + 'which gives 144 — a first share larger than the second, from a ratio that '
                + 'says it is smaller. The terms are counts of parts, so the denominator has to '
                + 'be their sum.',
              socratic:
                'The ratio has a 3 and a 5 in it, and the working has an 8. Where does the 8 '
                + 'come from, and what goes wrong if you use the 5 as the denominator instead?',
            },
            {
              label: 'Find one part, which makes both shares a multiplication',
              detail:
                '240 / 8 = 30, so one part is 30, and the shares are 3 · 30 = 90 and '
                + '5 · 30 = 150. Finding the single part first is what makes the second share '
                + 'free rather than a fresh division, and it generalises: any number of terms '
                + 'is one division followed by that many multiplications.',
              socratic:
                'You have 240 split into 8 equal parts. What is the one number that turns both '
                + 'shares into a single multiplication each?',
            },
            {
              label: 'Check against BOTH conditions, since a wrong answer usually passes one',
              detail:
                'The shares must total the original: 90 + 150 = 240. And their quotient must be '
                + 'the ratio: 90/150 = 3/5, both dividing by 30. Checking only the total is what '
                + 'lets the misreading through — 144 and 96 also total 240, and their quotient '
                + 'is 3/2, so the total alone cannot tell the right answer from the wrong one.',
              socratic:
                'Your two shares have to satisfy two separate conditions. What are they, and '
                + 'which of the two would 144 and 96 pass?',
            },
            {
              label: 'Read off what the ratio never said, which is the point of the question',
              detail:
                '3 : 5 is equally true of 3 and 5, of 30 and 50 and of 90 and 150, so it fixed '
                + 'the quotient and left the size open. The total 240 is the second fact and it '
                + 'was needed — one constraint cannot settle two numbers. Run it the other way '
                + 'and the total alone does no better: 240 also splits as 120 and 120. Each of '
                + 'the two facts supplies exactly half of the answer.',
              socratic:
                '90 and 150 are in the ratio 3 : 5, and so are 30 and 50. Given that, how much '
                + 'of your answer did the ratio actually supply, and where did the rest of it '
                + 'come from?',
            },
          ],
          answer:
            '90 and 150. The ratio makes 3 + 5 = 8 parts, one part is 240 / 8 = 30, and the '
            + 'shares are 3 · 30 = 90 and 5 · 30 = 150 — which total 240 and divide to 3/5. The '
            + 'ratio alone fixes only the quotient, so it would have been equally satisfied by '
            + '30 and 50; the total is the second fact, and it is what settles the size.',
        },
      },
      {
        id: 'a-rate-has-two-ways-up-and-they-compare-oppositely',
        conceptId: 'ratio-and-rate',
        statement:
          'A rate divides two quantities that are not the same kind of thing, so it carries a '
          + 'unit — pence per kilogram — and there are always two of them, each the reciprocal of '
          + 'the other. Both are correct and they answer different questions. What does not '
          + 'survive the swap is the DIRECTION of a comparison: the better buy is the smaller '
          + 'number of pence per kilogram and the larger number of kilograms per pound, because '
          + 'taking reciprocals reverses order on the positives.',
        position: 2,
        /*
         * Untimed for the same read-it-slowly reason as the point above, in its
         * sharpest form here: the error is dividing the wrong way round, and a
         * speed reward would train grabbing whichever division is to hand.
         */
        workedExample: {
          problem:
            'A 3 kg bag costs £7.50 and a 5 kg bag costs £12.00. Decide which is better value, '
            + 'both ways up.',
          subgoals: [
            {
              label: 'Divide price by weight, and keep the unit attached to the answer',
              detail:
                'Working in pence: 750 / 3 = 250 and 1200 / 5 = 240. The unit is pence per '
                + 'kilogram and it is part of the answer rather than decoration — 250 and 240 '
                + 'are comparable only because each is the price of one kilogram. So the 5 kg '
                + 'bag is cheaper per kilogram, by 10p.',
              socratic:
                'The two bags are different sizes, so their prices cannot be compared as they '
                + 'stand. What do you divide by what to make them comparable, and what does the '
                + 'resulting number mean?',
            },
            {
              label: 'Divide the other way, and watch which answer is now the bigger',
              detail:
                '3 / 7.50 = 2/5 and 5 / 12, in kilograms per pound. Over 60 those are 24/60 and '
                + '25/60, so the 5 kg bag is again the better buy — but this time it is the '
                + 'LARGER number. Nothing about the bags changed. The question changed, from '
                + '"what does one kilogram cost" to "what does one pound buy".',
              socratic:
                'You have just found the 5 kg bag better at 240 against 250 — the smaller '
                + 'number. Divide the other way round and it is 5/12 against 2/5, the larger '
                + 'one. Why has the better buy moved from the smaller number to the larger?',
            },
            {
              label: 'Name the reason the direction flipped, which is not about shopping',
              detail:
                'The two rates are reciprocals: 250 pence per kilogram is £2.50 per kilogram, '
                + 'and 1 / 2.50 = 0.4 = 2/5 kilograms per pound. On the positives x ↦ 1/x is '
                + 'decreasing, so it reverses every comparison applied to it — 240 < 250 becomes '
                + '1/240 > 1/250. "Bigger is better" is therefore not a property of a rate at '
                + 'all; it is a property of which way up the rate was written.',
              socratic:
                '250 and 240 turned into 2/5 and 5/12, and the order reversed. What operation '
                + 'took you from the one pair to the other, and what does that operation always '
                + 'do to an inequality between positive numbers?',
            },
            {
              label: 'Check the two answers are one claim rather than two',
              detail:
                'Within a single bag the two rates must multiply to 1, since each is the other '
                + 'reciprocated: 2.50 · 2/5 = 1 and 2.40 · 5/12 = 1. So there is one fact about '
                + 'each bag written two ways, not two facts that happened to agree — which is '
                + 'why only the direction of the comparison needed care, and never the '
                + 'conclusion.',
              socratic:
                'You reached the same conclusion by two different routes. What should one bag\'s '
                + 'price per kilogram and its kilograms per pound multiply to, and do yours?',
            },
          ],
          answer:
            'The 5 kg bag, both ways up. Per kilogram it costs 1200 / 5 = 240p against '
            + '750 / 3 = 250p, so it is the smaller number; per pound it buys 5/12 kg against '
            + '3 / 7.50 = 2/5 kg, which over 60 is 25/60 against 24/60, so it is the larger. The '
            + 'two rates are reciprocals and x ↦ 1/x reverses order on the positives, so the '
            + 'direction of the comparison flips while the conclusion does not.',
        },
      },
      {
        id: 'proportional-is-not-additive-and-zero-is-the-test',
        conceptId: 'ratio-and-rate',
        statement:
          'Scaling a proportional quantity means multiplying by the factor the other one grew '
          + 'by, not adding the difference: tripling the rooms triples the paint. The two '
          + 'readings disagree whenever that factor is not 1, and the disagreement is a number '
          + 'you can compute rather than a matter of taste. Not every relationship is '
          + 'proportional, and the test is what it gives at zero — a proportional one passes '
          + 'through 0, so doubling the input doubles the output, while one with a fixed charge '
          + 'in it does neither.',
        position: 3,
        /*
         * Untimed because it is a decision with an argument behind it, which is
         * the second of the two reasons this subject uses — the same shape as
         * the triangle inequality in `plane-geometry`. The arithmetic carrying
         * the decision is one multiplication and one division, already timed
         * lower down this file.
         */
        workedExample: {
          problem:
            '5 rooms take 8 litres of paint. Find the paint for 15 rooms, then decide whether a '
            + 'taxi fare of £3 plus £2 a mile can be scaled the same way.',
          subgoals: [
            {
              label: 'Find the factor the known quantity grew by',
              detail:
                '15 / 5 = 3, so the rooms tripled. That factor is the whole content of a '
                + 'proportional step: it comes from dividing like by like, so it has no unit '
                + 'attached, and being unit-free is exactly what lets it carry across to a '
                + 'quantity measured in litres.',
              socratic:
                'You know 5 rooms and you want 15. What single number takes you from the one to '
                + 'the other, and why does it have no unit on it?',
            },
            {
              label: 'Multiply by the factor instead of adding the difference',
              detail:
                '8 · 3 = 24 litres. The additive reading notices 10 more rooms and adds 10 to '
                + 'the 8 litres, giving 18 — and the two differ by 6, which is not a rounding '
                + 'disagreement but a different claim about how paint depends on rooms. The same '
                + 'answer comes through the unit rate: 8/5 = 1.6 litres a room, and '
                + '15 · 1.6 = 24.',
              socratic:
                'There really are 10 more rooms than before, and 8 litres did the first 5. So '
                + 'what makes 18 litres the wrong answer?',
            },
            {
              label: 'Test the taxi at zero before scaling it at all',
              detail:
                '5 miles costs 3 + 2 · 5 = £13, and 10 miles costs 3 + 2 · 10 = £23. Doubling '
                + 'the distance did not double the fare: twice 13 is 26, and the shortfall is '
                + 'exactly the £3 that got charged once rather than twice. At zero miles the '
                + 'fare is £3 and not £0, which is the fixed charge showing up in the one place '
                + 'a proportional relationship cannot have anything.',
              socratic:
                'Double the 5-mile fare and compare it with the 10-mile fare. They differ by '
                + '£3 — what is that £3, and what does the fare at zero miles tell you about '
                + 'scaling this one?',
            },
            {
              label: 'State the test as a condition you could check on something else',
              detail:
                'A relationship is proportional when one quantity is a fixed multiple of the '
                + 'other, and its two consequences are equivalent: it gives 0 at 0, and '
                + 'multiplying the input by k multiplies the output by k. Paint passes — 0 rooms '
                + 'take 0 litres — so the factor of 3 was legitimate. The fare fails both, so it '
                + 'has no single rate to be scaled by, and only its per-mile PART does.',
              socratic:
                'Paint could be scaled by a factor and the fare could not. What property does '
                + 'paint have that the fare lacks — and can you put it in a form you could check '
                + 'on a relationship you have not seen yet?',
            },
          ],
          answer:
            '24 litres: the rooms grew by 15 / 5 = 3, so the paint does too, and 8 · 3 = 24 — '
            + 'where the additive reading gives 18, a difference of 6 and a different claim. The '
            + 'fare cannot be scaled: 5 miles is £13 and 10 miles is £23 rather than £26, short '
            + 'by the £3 charged once instead of twice, and £3 at zero miles is what a '
            + 'proportional relationship cannot have.',
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
   * BOTH EDGES THAT CAME DOWN OFF THE MAP WITH `roots-and-irrationals`, AND
   * BOTH BELONG HERE.
   *
   * The map node declared `needs: ['prime-factorisation', 'fraction-arithmetic']`
   * and that `needs` left the area with it. This is the first promotion out of
   * that area where BOTH stranded edges land in this subject with nothing left
   * over for `links` — `prime-factorisation` needed one edge restated here,
   * `gcd-and-lcm` needed one here and one moved in, and this one needs two
   * here and no change to the area at all beyond the node's own removal.
   *
   * Both are real gates rather than bookkeeping, and they gate different
   * halves of the concept:
   *
   *  - `prime-factorisation` is the whole method. Every move here reads
   *    exponents off a factorisation — testing an nth power, dividing the
   *    exponents to build the root, pulling out the largest square — and the
   *    irrationality proof is unique factorisation applied twice. There is
   *    nothing to do here at all without it.
   *  - `fraction-arithmetic` is less obvious and still necessary. The concept
   *    is ABOUT the boundary of the rationals, and a learner who cannot
   *    compute with a ratio cannot be shown that something is not one: the
   *    proof squares a/b and compares, the one exactly-rational root of a
   *    non-integer is √(49/16) = 7/4, and the square-free part is reached by a
   *    division. "Not a fraction" is not a statement somebody can receive
   *    before fractions.
   *
   * Edges pointing the other way were left alone and resolve in `composeAtlas`:
   * `real-number-line` and `pythagoras` both named this concept in their own
   * `needs` and both were map nodes at the time, and the two `links` in
   * `ALGEBRA_FOUNDATIONS` that run from here to `quadratic-formula` and
   * `rational-exponents` stay where they are, because those endpoints are
   * authored in OTHER subjects and an ontology's edges may only name concepts
   * it contains.
   *
   * Both of those into-edges have since moved, in opposite directions, which
   * is the clearest pair in the file for the rule that where a stranded edge
   * goes is decided by which FILE the other endpoint ended up in.
   * `pythagoras` was authored into `plane-geometry`, so its edge became the
   * second entry in `EUCLIDEAN_GEOMETRY.links`. `real-number-line` was
   * authored into THIS subject, so its edge is two blocks below as an ordinary
   * prerequisite. Same promotion shape, different home, because one landed in
   * this file and the other did not.
   */
  {
    id: 'prime-factorisation->roots-and-irrationals',
    from: 'prime-factorisation',
    to: 'roots-and-irrationals',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
  },
  {
    id: 'fraction-arithmetic->roots-and-irrationals',
    from: 'fraction-arithmetic',
    to: 'roots-and-irrationals',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'The concept exists to show that a number need not be a ratio, which is not a claim a '
      + 'learner can receive before they can compute with one — the proof squares a/b, and the '
      + 'one root here that is exactly rational is a root of a fraction.',
  },

  /**
   * BOTH EDGES THAT CAME DOWN OFF THE MAP WITH `decimal-representation`, AND
   * BOTH BELONG HERE — THE SAME SHAPE AS `roots-and-irrationals` ABOVE.
   *
   * The map node declared `needs: ['fraction-arithmetic', 'prime-factorisation']`
   * and that `needs` left the area with the node, so both are restated here and
   * the area needed no change beyond the removal itself. Second promotion out of
   * `NUMBER_AND_ARITHMETIC` for which that is true.
   *
   * Both are real gates, and the second one is the whole reason this concept
   * could be written next:
   *
   *  - `prime-factorisation` DECIDES the concept's central question. A fraction
   *    terminates exactly when its denominator has no prime but 2 and 5, which
   *    is a statement about a factorisation and about nothing else — 10ⁿ is
   *    2ⁿ · 5ⁿ, so a denominator divides a power of ten only by being built out
   *    of the same two primes. Without the factorisation there is no test, only
   *    dividing and waiting.
   *  - `fraction-arithmetic` is what makes that test APPLICABLE rather than
   *    merely true. The denominator it must be applied to is the REDUCED one,
   *    and a learner who cannot cancel sees the 7 in 7/56 and concludes it
   *    recurs. It is 1/8 and it stops after three places. The gate is on the
   *    first move of the first worked example, not on background knowledge.
   *
   * Edges pointing the other way were left alone and resolve in `composeAtlas`:
   * `percent`, `real-number-line` and `scientific-notation` each named this
   * concept in their own `needs` and all three were map nodes — in
   * `NUMBER_AND_ARITHMETIC` when this was written, and in `algebra-foundations`
   * since those two areas merged. Because all three STAYED, nothing had to move
   * into that area's `links` — see the note there.
   *
   * Two of the three still are. `real-number-line` was authored into this
   * subject, so the edge it declared is no longer resolved across a file
   * boundary at all — it is one block below, as a plain prerequisite. A list of
   * surviving into-edges is a list of FUTURE stranded edges, which is the
   * correction this file and atlas-foundations.ts have now each had to make
   * twice.
   */
  {
    id: 'prime-factorisation->decimal-representation',
    from: 'prime-factorisation',
    to: 'decimal-representation',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'Termination is a question about the denominator\'s factorisation and not about its size: '
      + 'a denominator divides some 10ⁿ = 2ⁿ · 5ⁿ exactly when it is built from 2s and 5s alone.',
  },
  {
    id: 'fraction-arithmetic->decimal-representation',
    from: 'fraction-arithmetic',
    to: 'decimal-representation',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'The test applies to the reduced denominator, so cancelling comes first — 7/56 looks like '
      + 'it recurs and is 1/8, which stops after three places.',
  },

  /**
   * BOTH EDGES THAT CAME DOWN OFF THE MAP WITH `real-number-line`, AND BOTH
   * BELONG HERE — THE THIRD CONSECUTIVE PROMOTION OF THAT SHAPE.
   *
   * The map node declared `needs: ['roots-and-irrationals', 'decimal-representation']`
   * and that `needs` left the area with the node. Both endpoints are concepts
   * of THIS subject, so both are restated here and `algebra-foundations` needed
   * no change beyond the removal itself — the same as `roots-and-irrationals`
   * and `decimal-representation` before it.
   *
   * It is worth saying why the cheap shape holds: a node's prerequisites were
   * all authored into ONE file, which happened three times running because this
   * subject was being written out of a single area from the bottom up.
   *
   * THIS PARAGRAPH THEN PREDICTED THE RUN WOULD END AT THREE, AND IT WAS
   * WRONG — the twelfth promotion is a fourth cheap one. The claim was that
   * `ratio-and-rate` "rests on `fraction-arithmetic` alone and would be a
   * fourth, but `percent` and `word-problems` each rest on it from inside the
   * area, so promoting it strands an incoming edge into `links`". The second
   * half does not follow from the first, and the error is worth keeping on the
   * record because it is the edge rule applied backwards.
   *
   * An edge is owned by the node that DECLARES it. `percent` and
   * `word-problems` are the declaring ends and they STAYED in
   * `algebra-foundations`, so each still owns its edge and `composeAtlas`
   * resolves it against the authored concept. A dependent staying put is
   * exactly what keeps an edge local — it is a dependent LEAVING, or an
   * endpoint that was never in the area, that costs a `links` entry. All eight
   * entries in `algebra-foundations.links` have both ends outside the area,
   * which is the shape of the rule rather than a coincidence.
   *
   * So the cheapness was neither the branch's nor the subject's: it is a
   * property of where a departing node's OWN prerequisites live, which is what
   * `EUCLIDEAN_GEOMETRY`'s comment reaches by the same route and states
   * correctly.
   *
   * Both are real gates, and they gate the two halves of the concept that this
   * file's header describes as the two things its prerequisites each stop one
   * step short of:
   *
   *  - `roots-and-irrationals` supplies the only numbers the concept is about.
   *    Without it there is no reason to believe any expansion fails to
   *    terminate or recur, so the whole concept would be about an empty case —
   *    and its exponent test is what the first point invokes to say that √7's
   *    expansion does not stop, and what the third point invokes to rule out
   *    r² = 2.
   *  - `decimal-representation` supplies the classification the concept works
   *    in the gap of. It establishes that a fraction's expansion terminates or
   *    recurs, which is what turns "neither" into "not a fraction" rather than
   *    into "not yet finished". Its align-and-subtract method is also used
   *    directly, in the second point, to show that 0.4999… is 0.5.
   *
   * Edges pointing the other way were left alone and resolve in `composeAtlas`:
   * `linear-inequalities` names this concept in its own `needs` and is still a
   * map node of `algebra-foundations`, and the `links` entry in
   * `EUCLIDEAN_GEOMETRY` running from here to `cartesian-plane` stays where it
   * is — that endpoint is authored in `vectors-and-independence`, and an
   * ontology's edges may only name concepts it contains. What changed for that
   * entry is its REASON and not its home: it used to cross from a map node to
   * an authored concept, and now it crosses between two authored concepts in
   * different subjects. The note beside it in atlas-foundations.ts says so.
   */
  {
    id: 'roots-and-irrationals->real-number-line',
    from: 'roots-and-irrationals',
    to: 'real-number-line',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'The concept exists to say where the numbers that are not fractions sit, which is not a '
      + 'question somebody has before they have been shown that any such number exists — and the '
      + 'exponent test is what both the first and third points invoke by name.',
  },
  {
    id: 'decimal-representation->real-number-line',
    from: 'decimal-representation',
    to: 'real-number-line',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'That every fraction either terminates or recurs is what makes "neither" mean "not a '
      + 'fraction" instead of "not finished yet", so the classification has to be in hand before '
      + 'an expansion can be read as evidence about the number it names.',
  },

  /**
   * THE TWELFTH PROMOTION'S ONE STRANDED EDGE, AND IT IS THE CHEAP SHAPE — SO
   * THE PARAGRAPH ABOVE PREDICTING OTHERWISE WAS WRONG, AND IS CORRECTED THERE.
   *
   * `ratio-and-rate` declared exactly one `needs`, `fraction-arithmetic`, and
   * that concept is in THIS file, so the stranded edge has an owner here and
   * crosses no subject boundary. `algebra-foundations` needed no `links` entry
   * for the departure, which makes this the fourth cheap case in this subject
   * rather than the first expensive one.
   *
   * It is a real gate rather than a formality. Both of the first two knowledge
   * points turn on comparing two quotients — 90/150 against 3/5 in the first,
   * and 2/5 against 5/12 over a common denominator of 60 in the second — so a
   * learner who cannot yet put two fractions over one denominator cannot check
   * either answer. The prerequisite is used, not merely cited.
   *
   * Edges pointing the OTHER way were left alone and resolve in `composeAtlas`,
   * which is the half the paragraph above got backwards. `percent` and
   * `word-problems` both name this concept in their own `needs` and are both
   * still map nodes of `algebra-foundations`, so the DECLARING end of each edge
   * is still a node of that area and still owns it. `links` is for an edge
   * NEITHER of whose owners is a node of the area, which is why all eight
   * entries there have both ends outside it.
   *
   * The `links` entry in `EUCLIDEAN_GEOMETRY` running from here to `similarity`
   * stays where it is, for the reason it has always had: `similarity` is
   * authored in `plane-geometry`, and an ontology's edges may only name
   * concepts it CONTAINS. What changed for that entry is its CONSEQUENCE and
   * not its home, and it is the one effect of this promotion a reader would not
   * predict. It used to gate nothing, because the gating walk passed straight
   * through a node with no material — `similarity` was gated by `congruence`
   * and `fraction-arithmetic`. It gates now, and the gating set is the same
   * SIZE with one member replaced, since this concept stands in front of the
   * fractions it used to reach. tests/atlas.mjs asserts that by membership,
   * which is the only reason the turnover is visible rather than silent.
   */
  {
    id: 'fraction-arithmetic->ratio-and-rate',
    from: 'fraction-arithmetic',
    to: 'ratio-and-rate',
    kind: 'prerequisite',
    promotedBy: 'author:arithmetic-foundations',
    rationale:
      'A ratio IS a quotient, and both of the first two points turn on comparing two of them — '
      + '90/150 against 3/5, and 2/5 against 5/12 over a common denominator. Putting two '
      + 'fractions over one denominator is the move every check in this concept is made of, so '
      + 'it has to be in hand first.',
  },

  /*
   * AND NO `ratio-and-rate => fraction-arithmetic` EDGE, which is a judgement
   * against the obvious reading, made by the rule below rather than by taste.
   *
   * The prose would support it: a ratio is a quotient, so practising ratios
   * looks like practising fractions. But an `encompasses` edge is a claim about
   * what PRACTISING exercises, measured against the tasks actually shipped, and
   * that is already what keeps `divisibility => place-value` and
   * `gcd-and-lcm => prime-factorisation` out of this list.
   *
   * Measured that way the claim fails, by the same margin those two did. Of the
   * three tasks here, `one-part-settles-both-shares-1` is an integer division
   * followed by a multiplication, and
   * `the-additive-reading-is-a-different-claim-1` is integer arithmetic
   * throughout. Only `which-bag-is-dearer-per-kilogram-1` is a difference of
   * two quotients, and even there both divide exactly. One task of three is not
   * enough: the effect of an encompasses edge is to stop a concept coming due,
   * so a learner who practised the other two would be credited for fraction
   * arithmetic on evidence containing none of it, and the cost lands on them as
   * a weak concept that has quietly stopped being asked about.
   *
   * What would make it correct is a task here whose answer is a fraction in
   * lowest terms rather than an integer — sharing a total that does not divide
   * by the number of parts would do it. Add the edge with that task, not before
   * it.
   */

  /*
   * NO `interferes_with` EITHER, AND IT GETS A LINE BECAUSE IT IS THE STRANDING
   * NO TEST CATCHES.
   *
   * `expandEdges` turns a node's `confusedWith` into an `interferes_with`, so
   * promoting a node DELETES any interference it declared — and nothing goes
   * red, because `interferes_with` constrains selection rather than gating. The
   * `ratio-and-rate` node declared none, so there was nothing to restate here
   * and nothing was lost. Checked on the node before it was deleted, rather
   * than inferred from the suites staying green, since staying green is exactly
   * what they would have done either way.
   *
   * `percent` is what this concept would interfere with if anything did — it is
   * a ratio with its denominator fixed at 100, and compounding a percent of the
   * wrong base is its own node's stated error. It cannot be declared from here:
   * `percent` is still a map node, and an ontology may only name concepts it
   * contains. Whoever promotes `percent` should look at the pair again from
   * that end.
   */

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
