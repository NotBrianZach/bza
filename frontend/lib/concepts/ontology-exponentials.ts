/**
 * A second subject ontology: exponents through logarithms.
 *
 * ── Why a second one, and what it was for ─────────────────────────────────
 *
 * ontology.ts shipped one subject and said so: "One, for now, and that is step
 * 1's point." One subject cannot tell you whether the *schema* is a schema or
 * just a shape that fits one worked example. So this exists to be a second
 * subject the types were not designed around, and the interesting output is
 * which parts of the schema survived it.
 *
 * **What survived unchanged.** `Concept`, `KnowledgePoint`, `Objective`,
 * `ConceptEdge` and all four edge kinds took this subject with no edits at all.
 * `encompasses` in particular earned its keep — see e1 below, where the
 * logarithm rules genuinely *are* the exponent rules read through the inverse,
 * which is a stronger instance of the edge than anything in rational
 * expressions. `interferes_with` found two real pairs, one of which (i1) is the
 * single most common confusion in the subject.
 *
 * **What did not survive: `NamedForm` — SINCE FIXED.** This is kept rather than
 * deleted because the finding is the reason the fix looks the way it does.
 *
 * The four forms in types.ts — `partial_fractions`, `single_fraction`,
 * `factored`, `expanded` — were all rational-expression forms, so nothing here
 * could be asked for in any of them. The natural demands for this subject are
 * "as a single power", "with no negative exponents", "radical-free", and none
 * existed. So this subject originally shipped NO `transform_to_form` tasks and
 * said so, rather than inventing a form that half-fitted — a closed union of
 * one subject's forms is a schema defect, not an authoring gap.
 *
 * `NamedForm` is now open and carries those three. What makes that safe is in
 * forms.ts: `FORM_CHECKS` is a `Record<NamedForm, FormSpec>`, so the compiler
 * refuses a new form name until a checker for it exists — the failure worth
 * preventing was a form that can be asked for and never ruled. This subject
 * now ships four form tasks, on `add-exponents-on-product`,
 * `multiply-exponents-on-power`, `negative-is-reciprocal` and
 * `root-as-exponent`.
 *
 * `evaluate` needs no form, and the evaluate tasks here are still ruled locally
 * and exactly by `ruleEvaluate` — which is what makes this subject's arithmetic
 * half gradable with no worker configured. The four form tasks DO need the
 * worker for equivalence, so on a deployment without one they rule
 * inconclusive and `verifier.configured` tells the learner before they start.
 *
 * That took one change to get honestly. `root-as-exponent-1` asks for 9^(1/2),
 * and `exactValue` used to refuse every fractional exponent — which did not make
 * the task fail, it made it fall through to comparing the learner against the
 * author's *unverified* reference, quietly losing the re-derivation check. So
 * `exactValue` grew exact rational roots (numerals.ts). 9^(1/2) is exactly 3;
 * 2^(1/2) still returns null, because it is not rational and saying so is the
 * point.
 *
 * **Coverage was partial and is now nearly total — and the reason it was
 * partial is the most useful thing in this header.** It shipped with tasks on
 * five of its nine knowledge points, and the four bare ones were recorded as a
 * limit of the task kinds: the logarithm points want *solving* and *stating*,
 * and neither kind is verifiable.
 *
 * Three of those four were not blocked on a task kind at all. They were blocked
 * on `exactValue` returning null for every `log`, which meant an `evaluate`
 * task here could not re-derive its own answer — and an authored task that
 * cannot do that grades the learner against the author rather than against the
 * mathematics. `exactLog` (numerals.ts) closed it: a logarithm is exactly
 * rational when its argument is a rational power of its base, which is every
 * logarithm anyone is set by hand. log₂(32), log₂(1/8), log₃(9⁴) and log₉(27)
 * are now ruled locally and exactly, like the arithmetic half.
 *
 * The lesson generalises past this subject: "no task kind fits" and "the
 * verifier cannot see the value" look identical from the outside — both show up
 * as a concept with material and no problems — and only one of them needs
 * schema work. Check the cheaper one first.
 *
 * `log-argument-is-positive` is still bare and always will be. Its content is
 * that log₂(−8) *names nothing*, and no verifiable kind can ask for that: an
 * `evaluate` answer is a value, and a `counterexample` needs an identity to
 * break. It keeps its worked example, which the registry permits and which is
 * honest — a knowledge point with no rulable task is still worth teaching, and
 * faking a task for it would be the failure tasks.ts's header warns about.
 *
 * **It is now the only bare point, and that sentence used to name one of two.**
 * `even-root-needs-nonnegative` was bare as well and went unmentioned here,
 * which made the paragraph above read as a complete account of the subject's
 * coverage when it was not. It has a `counterexample` task now, and the
 * distinction it turns on is the useful part: both points are DOMAIN
 * restrictions, so the obvious reading is that neither can be ruled. The
 * separating question is not "is this about a domain" but "is the claim total
 * where it is stated". (x²)^(1/2) = x is defined at every real x and false at
 * every negative one, so substitution refutes it; a logarithm of a negative
 * number has no value to compare at all. tasks.ts argues it where the task is.
 *
 * **A seventh concept arrived from the map: `radical-equations`.** It is the
 * only concept here that was not authored with the subject, and the two things
 * worth knowing about it are both recorded beside it rather than here — why it
 * was filed with the roots instead of with the quadratic formula, and why it is
 * the second `guided` concept, which cost the recognition figure a point by
 * retiring a pattern that had never matched anything. The paragraph above the
 * concept argues both.
 *
 * It does mean the sentence at the top of this header — one subject, written to
 * test whether the schema was a schema — has stopped describing the file. The
 * schema took a promoted node as readily as it took the original six: no field
 * was added, no edge kind was wanted that did not exist, and the only thing
 * that moved was `fidelity`, in the direction of honesty.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'exponents-and-logarithms',
  name: 'Exponents and logarithms',
  covers:
    'Integer exponent rules through solving a one-step exponential equation, and the other ' +
    'equation a power has to be undone in: one with the unknown under a root, where squaring ' +
    'both sides is not invertible and so hands back candidates the equation does not have. Real ' +
    'bases, positive where a logarithm requires it. Nothing about e or natural growth, nothing ' +
    'about complex exponents, and no calculus — the derivative of a logarithm is the usual next ' +
    'step and is not in here. Nothing about an inequality with a root in it either: the answer ' +
    'to one is an interval and no task kind here expresses a solution set.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'exponent-rules',
    name: 'The exponent rules',
    subjectId: subject.id,
    scope: {
      id: 'exponent-rules',
      label: 'Exponent rules',
      hint: 'exponentiation laws product rule power rule',
      match: /\b(exponent\w*|power rule|index laws|indices|base and exponent|exponentiation)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'combine-powers',
        statement: 'Combine powers of the same base, and say which rule each step used.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'add-exponents-on-product',
        conceptId: 'exponent-rules',
        statement:
          'Multiplying powers of the same base adds the exponents. It is not a new fact — it is ' +
          'counting how many copies of the base you have in total.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Write 2³ · 2⁴ as a single power, then say why.',
          subgoals: [
            {
              label: 'What does each factor stand for?',
              detail: '2³ is three 2s multiplied, and 2⁴ is four 2s. Nothing else is going on yet.',
              socratic:
                'There are two factors here and they are not the same size. Write each one out in ' +
                'full with no shorthand, before you touch either of them: what multiplication is ' +
                '2³, what multiplication is 2⁴, and what is the 3 doing in the one that the 4 is ' +
                'doing in the other?',
            },
            {
              label: 'Count the copies',
              detail: 'Three 2s times four 2s is seven 2s in a row, so the result is 2⁷.',
              socratic:
                'Write out the 2s from both factors as one long multiplication. How many 2s are ' +
                'there altogether, and what single power does that make?',
            },
            {
              label: 'State the rule the count proves',
              detail:
                'xᵃ · xᵇ = xᵃ⁺ᵇ. The addition in the exponent is where the counting went, which ' +
                'is why the rule needs the bases to be the same — you cannot count 2s and 3s together.',
              socratic:
                'The exponents 3 and 4 turned into 7 by counting 2s, not by anything done to 3 ' +
                'and 4 themselves. What is that rule for any base and any two exponents, and ' +
                'what does the counting run into if the bases differ, as in 2³ · 3⁴?',
            },
          ],
          answer: '2⁷ = 128, because xᵃ · xᵇ = xᵃ⁺ᵇ',
        },
      },
      {
        id: 'multiply-exponents-on-power',
        conceptId: 'exponent-rules',
        statement:
          'Raising a power to a power multiplies the exponents. The outer exponent says how many ' +
          'copies of the whole inner power you have.',
        position: 2,
        workedExample: {
          problem: 'Write (3²)⁴ as a single power.',
          subgoals: [
            {
              label: 'What is being repeated?',
              detail: 'The whole of 3², four times: 3² · 3² · 3² · 3².',
              socratic:
                'The 4 sits outside the brackets and the 2 sits inside. Which of the two tells ' +
                'you how many factors to write down, and what is each of those factors?',
            },
            {
              label: 'Use the rule you already have',
              detail: 'Four factors of the same base add their exponents: 2 + 2 + 2 + 2 = 8.',
              socratic:
                '3² · 3² · 3² · 3² is a product of powers of the same base, which is the one ' +
                'shape you already know how to collapse. What exponent does that rule give you ' +
                'here, and what did you do to the four 2s to get it?',
            },
            {
              label: 'Read off the general rule',
              detail:
                '(xᵃ)ᵇ = xᵃᵇ. The multiplication is repeated addition of the inner exponent, ' +
                'which is why this rule rests on the product rule rather than standing beside it.',
              socratic:
                'Adding 2 to itself four times is the long way round one multiplication, and the ' +
                'four came from the exponent outside the brackets. What does (xᵃ)ᵇ come to for ' +
                'any base and any two exponents — and which rule did you lean on to get there?',
            },
          ],
          answer: '3⁸, because (xᵃ)ᵇ = xᵃᵇ',
        },
      },
    ],
  },

  {
    id: 'zero-and-negative-exponents',
    name: 'Zero and negative exponents',
    subjectId: subject.id,
    scope: {
      id: 'zero-and-negative-exponents',
      label: 'Zero and negative exponents',
      hint: 'negative exponent reciprocal zero exponent',
      match: /\b(negative exponent\w*|zero exponent|reciprocal|x to the zero|empty product)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'rewrite-without-negative-exponents',
        statement: 'Evaluate a power with a zero or negative exponent, and justify the value.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'zero-exponent',
        conceptId: 'zero-and-negative-exponents',
        statement:
          'Anything nonzero to the power 0 is 1. This is forced by the product rule rather than ' +
          'chosen, and 0⁰ is left undefined because the forcing argument needs division.',
        position: 1,
        workedExample: {
          problem: 'Why must 5⁰ be 1?',
          subgoals: [
            {
              label: 'Insist the product rule keeps working',
              detail: 'If xᵃ · xᵇ = xᵃ⁺ᵇ is to hold for b = 0, then 5ᵃ · 5⁰ = 5ᵃ.',
              socratic:
                'Nothing so far says what an exponent of 0 should mean — 5⁰ is not a count of 5s ' +
                'the way 5³ is. The one rule you have already proved is xᵃ · xᵇ = xᵃ⁺ᵇ. If you ' +
                'refuse to let that rule break when b is 0, what equation does it hand you for ' +
                '5ᵃ · 5⁰?',
            },
            {
              label: 'Solve for the unknown value',
              detail: 'Dividing both sides by 5ᵃ — legal because 5ᵃ ≠ 0 — leaves 5⁰ = 1.',
              socratic:
                'Read 5ᵃ · 5⁰ = 5ᵃ as an equation whose unknown is 5⁰. What one move clears the ' +
                '5ᵃ off the left-hand side, and what value does the equation then force on 5⁰?',
            },
            {
              label: 'Notice what the argument needed',
              detail:
                'It divided by the base to a power. For base 0 that division is illegal, which is ' +
                'exactly why 0⁰ is left undefined rather than declared to be 1.',
              socratic:
                'That move was a division by 5ᵃ, and it is legal only while 5ᵃ is not 0. Run the ' +
                'same argument with a base of 0 instead of 5: which line is the first to fail, ' +
                'and what does that failure say about whether 0⁰ can be pinned down this way?',
            },
          ],
          answer: '1 — the product rule forces it, for any nonzero base.',
        },
      },
      {
        id: 'negative-is-reciprocal',
        conceptId: 'zero-and-negative-exponents',
        statement:
          'A negative exponent is a reciprocal, not a negative number. x⁻ⁿ = 1/xⁿ, and the result ' +
          'is positive whenever the base is.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Evaluate 2⁻³.',
          subgoals: [
            {
              label: 'Where does the rule come from?',
              detail:
                'The product rule again: 2³ · 2⁻³ = 2⁰ = 1. So 2⁻³ is whatever 2³ must be ' +
                'multiplied by to give 1 — its reciprocal.',
              socratic:
                'Nothing so far says what a negative exponent counts — there is no way to write ' +
                'down minus three 2s. What you do have is the product rule and the value of 2⁰. ' +
                'Add the exponents in 2³ · 2⁻³: what number does that product have to come to, ' +
                'and what does that one equation fix about 2⁻³?',
            },
            {
              label: 'Write the reciprocal',
              detail: '1/2³ = 1/8.',
              socratic:
                'You now have 2³ · 2⁻³ = 1, and 2³ on its own is a number you can work out. What ' +
                'must stand in for 2⁻³ to leave that product at 1, and what is it once the 2³ is ' +
                'evaluated?',
            },
            {
              label: 'Check the sign',
              detail:
                '1/8 is positive. A negative exponent never makes a positive base negative, and ' +
                'reading it as −8 is the error this point exists to prevent.',
              socratic:
                'A common first guess at 2⁻³ is −8, and the number you just worked out is not ' +
                'that. Nothing in the argument ever subtracted or negated anything. So what did ' +
                'the minus sign in the exponent actually do, and what does that settle about the ' +
                'sign of x⁻ⁿ whenever x is positive?',
            },
          ],
          answer: '1/8',
        },
      },
    ],
  },

  {
    id: 'rational-exponents',
    name: 'Rational exponents and roots',
    subjectId: subject.id,
    scope: {
      id: 'rational-exponents',
      label: 'Rational exponents',
      hint: 'rational exponent nth root radical surd',
      match: /\b(rational exponent\w*|fractional exponent\w*|nth root|square root|radical|surd)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'move-between-roots-and-exponents',
        statement:
          'Evaluate a power with a rational exponent, state when it is defined, and break the ' +
          'power rule where its condition is dropped.',
        // `counterexample` was added once the third clause became askable. The
        // condition on (xᵃ)ᵇ = xᵃᵇ can be attacked directly, because
        // (x²)^(1/2) = x is false at every negative x with both sides defined —
        // see the note on the task in tasks.ts. `state` stays: "when is it
        // defined" is still the unrulable half.
        taskKinds: ['evaluate', 'state', 'counterexample'],
      },
    ],
    knowledgePoints: [
      {
        id: 'root-as-exponent',
        conceptId: 'rational-exponents',
        statement:
          'x^(1/n) is the nth root of x. The exponent rules already decide this; naming it a root ' +
          'is a change of notation, not of content.',
        position: 1,
        workedExample: {
          problem: 'Why is 9^(1/2) equal to 3?',
          subgoals: [
            {
              label: 'Apply the power rule to it',
              detail: '(9^(1/2))² = 9^(1/2 · 2) = 9¹ = 9.',
              socratic:
                'An exponent of 1/2 counts nothing — there is no way to write down half a 9 ' +
                'multiplied together, so repeated multiplication has nothing to say here. The one ' +
                'rule you have that mentions two exponents at once is (xᵃ)ᵇ = xᵃᵇ. Raise 9^(1/2) ' +
                'to an outer power of your choosing: which outer power leaves an exponent you can ' +
                'already read off, and what does the rule say the result comes to?',
            },
            {
              label: 'Read what that says',
              detail: '9^(1/2) is a number whose square is 9. That is what "square root of 9" means.',
              socratic:
                'You now have one fact and only one: squaring 9^(1/2) gives 9. Set the fractional ' +
                'exponent aside and describe the number that fact is about — what property does it ' +
                'pin down, and what name does a number with that property already go by?',
            },
            {
              label: 'Pick the one that is meant',
              detail:
                'Both 3 and −3 square to 9. The notation x^(1/2) means the *non-negative* one by ' +
                'convention, so 9^(1/2) = 3 and not −3.',
              socratic:
                '"A number whose square is 9" is a description, and the problem asked for a value. ' +
                'Test 3 and −3 against that description: how many numbers does it admit, and since ' +
                '9^(1/2) is written as though it names exactly one of them, what decides which one ' +
                '— is that decision forced by the exponent rules, or laid on top of them?',
            },
          ],
          answer: '3 — it is the non-negative number whose square is 9.',
        },
      },
      {
        id: 'even-root-needs-nonnegative',
        conceptId: 'rational-exponents',
        statement:
          'An even root of a negative number is not a real number. The exponent rules hold on the ' +
          'domain where every step is defined, and that qualifier is doing real work here.',
        position: 2,
        workedExample: {
          problem: 'What goes wrong in ((−4)²)^(1/2) = (−4)^(2 · 1/2) = −4?',
          subgoals: [
            {
              label: 'Evaluate the left side honestly',
              detail: '(−4)² = 16, and 16^(1/2) = 4. So the left side is 4, not −4.',
              socratic:
                'Every line of that chain rewrites the one above it, and not one of them ever ' +
                'checks the result against the number itself. So work the left side on its own ' +
                'terms instead — the inner power first, then the half power of what you get, ' +
                'reading x^(1/2) the way 9^(1/2) was read a moment ago. What does ' +
                '((−4)²)^(1/2) come to, and what does that alone establish about the chain, ' +
                'before you have any idea which line is at fault?',
            },
            {
              label: 'Find the step that failed',
              detail:
                'The power rule (xᵃ)ᵇ = xᵃᵇ was applied to a negative base with a fractional ' +
                'exponent. It is not valid there — (−4)^(1/2) is not a real number at all.',
              socratic:
                'The left side is 4 and the chain ends at −4, so one of its two rewrites is ' +
                'unsound. The arithmetic 2 · 1/2 = 1 is not a candidate, which leaves ' +
                '(xᵃ)ᵇ = xᵃᵇ used at a base of −4. Ask what that rule needs in order to join ' +
                'its two sides here: a half power of the base, which is to say a number whose ' +
                'square is −4. Describe that number as fully as you can — what does the ' +
                'description amount to, and what does it settle about using the rule at this base?',
            },
            {
              label: 'State the rule with its condition',
              detail:
                '(xᵃ)ᵇ = xᵃᵇ for x ≥ 0 when b is not an integer. Dropping "x ≥ 0" is what produced ' +
                '4 = −4.',
              socratic:
                'You have one rule and one case where it fails, and "(xᵃ)ᵇ = xᵃᵇ except where it ' +
                'breaks" is not a rule. Barring negative bases outright is not one either: it ' +
                'would throw out ((−4)²)³ = (−4)⁶, which you can check by hand and which is true. ' +
                'So what has to be said about x, and what has to be said about b, for the failure ' +
                'you just found to be excluded while that case survives?',
            },
          ],
          answer: 'The power rule was used on a negative base with a fractional exponent, where it does not hold.',
        },
      },
    ],
  },

  /**
   * PROMOTED FROM THE MAP, AND FILED HERE RATHER THAN WITH THE QUADRATIC.
   *
   * `radical-equations` was a node of `algebra-foundations` declaring
   * `needs: ['quadratic-formula', 'rational-exponents']`. Those two live in two
   * different subjects, so the receiving subject was a real choice and only one
   * of the two edges could become an ordinary prerequisite here — the other had
   * to go to that area's `links`, which atlas-foundations.ts argues where it
   * happened.
   *
   * It is here because `rational-exponents` says what a radical IS, and
   * `quadratic-formula` is only a tool the method HAPPENS to need: the squared
   * equation is a quadratic in the examples anybody sets by hand, and would be
   * a cubic or a linear equation in others without changing one word of what
   * this concept teaches. The subject a concept joins should be the one that
   * supplies its meaning rather than its arithmetic, which is the same
   * distinction ontology-vectors.ts drew between what a concept IS and what it
   * YIELDS.
   *
   * It also discharges a forward reference this file already carried.
   * `take-logs-of-both-sides`'s last subgoal holds the log step up against
   * squaring both sides — "turns x = −3 into x² = 9 and then hands you a 3 that
   * solves nothing in the original" — and ontology-algebra.ts says, inside
   * `linear-equations`'s worked example, that this is "where the extraneous
   * roots of a radical equation come from". Both were written before any
   * concept existed to point at. There is one now.
   *
   * ── WHY IT IS GUIDED, WHICH COST THE RECOGNITION FIGURE A POINT ──────────
   *
   * The map node carried `match: /\bradical equation\b/i` and the convention
   * for the last several promotions has been to bring a node's pattern across
   * verbatim, so that the recognition figure in tests/atlas.mjs cannot move on
   * a change that also moves the concept count. That is not what happened here,
   * and the reason is that the pattern was DEAD.
   *
   * `conceptsInOffering` (offerings.ts) tests `scope.match` against
   * `offering.title` and against nothing else. No encyclopaedia article is
   * titled "radical equation" — what covers this is filed under the roots, under
   * extraneous solutions, or under equation solving in general — so the pattern
   * could never have fired on a real offering, and the node was counted among
   * the concepts that "can be recognised from a title" for its whole life while
   * recognising none. 267 of 294 becomes 266 of 294, and the figure is more
   * nearly true after the change than before it.
   *
   * Widening instead was the other option and it is worse. The pattern that
   * would fire is `radical`, and `rational-exponents` directly above already
   * holds it — so widening would hand this concept its prerequisite's articles
   * and make the longer pattern win the specificity sort in
   * `conceptsInOffering`. Retiring a dead branch is not narrowing, the same way
   * repairing one is not widening; ontology-vectors.ts records the other half of
   * that pair, where `rank-nullity` shipped with two of three alternatives dead
   * and nothing said so.
   *
   * So this is the second `guided` concept in the subject, which turns
   * `conceptFacet`'s caveat from one of six into two of seven. Its sibling in
   * that state is `solving-exponential-equations`, which is the right company:
   * both are about SOLVING something, and a provider that files by object has
   * no title for a method.
   */
  {
    id: 'radical-equations',
    name: 'Radical equations',
    subjectId: subject.id,
    scope: {
      id: 'radical-equations',
      label: 'Radical equations',
      // The map node's own `terms`, verbatim. Only the `match` was dropped, and
      // only because it matched nothing — see the block above.
      hint: 'radical equation extraneous solution',
      // No `match`: see `fidelity`.
    },
    fidelity: 'guided',
    caveat:
      'No encyclopaedia article is called "radical equation", and a title is all the provider ' +
      'gives this registry to match on — so nothing here can decide membership. What covers this ' +
      'is filed under the roots themselves, under extraneous solutions, or under solving ' +
      'equations in general, and none of those is wrong. So this concept steers the search and ' +
      'filters nothing. Expect it to lean, not to obey.',
    objectives: [
      {
        id: 'solve-a-radical-equation',
        statement:
          'Isolate the root, square, and submit the number the equation has — having checked ' +
          'every candidate the squaring produced.',
        // `evaluate` only, and the restraint is deliberate. Every other
        // objective in this file names `justify` as well, and there is not one
        // `justify` task anywhere in the build: the kind is declared
        // unverifiable, tests/concepts-logic.mjs refuses to ship a task of an
        // unverifiable kind, and naming it here would promise an observation
        // that can never be made. The unrulable half of this concept — why the
        // step is not invertible — is asked in `socratic` instead, where the
        // tutor asks it and nothing pretends to rule it.
        taskKinds: ['evaluate'],
      },
      {
        id: 'tell-a-solution-from-an-extraneous-root',
        statement:
          'Decide which of the candidates belong to the original equation by evaluating its ' +
          'sides at each, and name the equation the discarded one does solve.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'squaring-can-create-a-solution',
        conceptId: 'radical-equations',
        statement:
          'Squaring both sides can hand you a solution the original equation does not have. ' +
          'A = B and A² = B² are different questions — the second is also satisfied wherever ' +
          'A = −B — so a number that comes out of a squaring is a candidate, not yet an answer.',
        position: 1,
        workedExample: {
          problem: 'Square both sides of √x = −2. What is the solution of the equation you get, and what does it solve?',
          subgoals: [
            {
              label: 'Read the original equation before touching it',
              detail:
                '√x means the non-negative square root, so the left side is never negative, and ' +
                '−2 always is. No value of x can make them equal: the equation has no solution, ' +
                'and that is settled before any algebra.',
              socratic:
                'Nothing has been done to this equation yet, so do not start solving it. Take ' +
                'the two sides one at a time: as x runs over every number for which √x has a ' +
                'value at all, what values can the left side take, and what values can the right ' +
                'side take? Do those two collections of numbers have anything in common?',
            },
            {
              label: 'Square both sides and read off the new equation',
              detail:
                '(√x)² is x and (−2)² is 4, so the squared equation is x = 4. That one has a ' +
                'solution, and the equation it came from has none.',
              socratic:
                'Square each side separately and write down the equation you are left holding. ' +
                'How many numbers satisfy that one — and how does that count compare with the ' +
                'count you just settled for the equation you started from?',
            },
            {
              label: 'Name what the squaring did to the question',
              detail:
                'Squaring sends 2 and −2 to the same 4, so the squared equation cannot tell the ' +
                'sign of either side. It is satisfied where √x = −2 and equally where √x = 2, ' +
                'and the 4 is a solution of the second of those.',
              socratic:
                'The step did not rearrange the equation, it replaced it with a different one. ' +
                'Two numbers of the same size and opposite sign have the same square — say which ' +
                'pair is in play here. Of the two equations √x = −2 and √x = 2, which does your ' +
                'squared equation distinguish, and so which of them did its solution come from?',
            },
            {
              label: 'Say what that costs on every radical equation, not just this one',
              detail:
                'Because the squared equation can have solutions the original does not, the check ' +
                'in the original is part of the method and not a precaution. Here the original was ' +
                'transparent enough to settle in advance; in general it is not.',
              socratic:
                'You happen to have known from the first line that this equation had no solution. ' +
                'Suppose you had not, and had squared and reached x = 4 with no idea whether it ' +
                'belonged: at which point in the work would you have found out that it did not — ' +
                'and what does that make of the idea that checking is an optional last step?',
            },
          ],
          answer:
            'x = 4 is the solution of x = 4, and solves nothing in √x = −2, which has no ' +
            'solution. The squaring created it.',
        },
      },
      {
        id: 'isolate-the-radical-before-squaring',
        conceptId: 'radical-equations',
        statement:
          'Squaring only removes a root that stands alone on its side, because (a − b)² is not ' +
          'a² − b². Isolating the root first is an invertible move and costs nothing; squaring ' +
          'too early leaves the root behind, multiplied by something.',
        position: 2,
        workedExample: {
          problem: 'Solve √(x + 7) − x = 1.',
          subgoals: [
            {
              label: 'Square it where it stands, and see what survives',
              detail:
                'Squaring the left side as written gives (x + 7) − 2x√(x + 7) + x², because the ' +
                'square of a difference has three terms. The root is still there and is now ' +
                'multiplied by −2x. Nothing was removed and the equation is harder than it was.',
              socratic:
                'Square the left side exactly as it is written — all of it, as one bracket — and ' +
                'expand what you get rather than stopping at the first line. How many terms does ' +
                'the expansion have, which of them still contain a root sign, and is the equation ' +
                'you are now holding easier or harder than the one you began with?',
            },
            {
              label: 'Put the root on its own first',
              detail:
                'Add x to both sides: √(x + 7) = x + 1. Adding a quantity to both sides can be ' +
                'undone by subtracting it, so this move neither loses a solution nor invents one.',
              socratic:
                'The obstacle is that the root is sharing its side with a −x. Move things so that ' +
                'the root stands alone, and say which move you used. Can that move be undone by ' +
                'another one of the same kind — and so does the equation you now have exactly the ' +
                'solutions of the one you started with, or only some of them?',
            },
            {
              label: 'Now square, and solve what is left',
              detail:
                'x + 7 = (x + 1)² = x² + 2x + 1, so x² + x − 6 = 0, which factors as ' +
                '(x + 3)(x − 2) = 0. The candidates are x = 2 and x = −3.',
              socratic:
                'With the root standing alone, squaring takes it away for good. Write both sides ' +
                'squared, expand the right one, and collect everything onto one side. What ' +
                'quadratic are you looking at, and what two numbers does it give you?',
            },
            {
              label: 'Check both candidates in the equation as it was first written',
              detail:
                'At x = 2 the left side is √9 − 2 = 3 − 2 = 1, which is what the equation asks ' +
                'for. At x = −3 it is √4 + 3 = 2 + 3 = 5, which is not. So x = 2 is the solution ' +
                'and x = −3 is extraneous.',
              socratic:
                'Two candidates came out of a squaring, so on the strength of the point above ' +
                'neither of them is a solution yet. Put each one back into the equation as it was ' +
                'first written — not into the quadratic, and not into the isolated form — and work ' +
                'the left side out. What does each come to, and which of the two is this equation ' +
                'actually about?',
            },
            {
              label: 'Note that the quadratic itself was never wrong',
              detail:
                'Both candidates really are roots of x² + x − 6, and that polynomial was derived ' +
                'correctly. The extra solution is not an arithmetic slip anywhere in the working: ' +
                'it is produced by the squaring, which is why no amount of care in the algebra ' +
                'removes the need for the check.',
              socratic:
                'Substitute −3 into x² + x − 6 and see what it gives. If that number is a genuine ' +
                'root of the quadratic, and the quadratic was derived from the equation without a ' +
                'mistake, then where in the working did a number that solves nothing get in — and ' +
                'is there any way of being more careful that would have kept it out?',
            },
          ],
          answer:
            'x = 2. The candidate x = −3 is a root of the quadratic and not a solution of the ' +
            'equation; the squaring, not an error, is what produced it.',
        },
      },
      {
        id: 'an-extraneous-root-solves-the-other-sign',
        conceptId: 'radical-equations',
        statement:
          'An extraneous root is not a random intruder. Squaring cannot tell √A = B from ' +
          '√A = −B, so the candidates it creates are the solutions of both equations put ' +
          'together — which is why a discarded one makes the two sides come out the same size ' +
          'with opposite signs.',
        position: 3,
        workedExample: {
          problem:
            'Why did squaring √(x + 7) = x + 1 produce a −3, and could it have been spotted ' +
            'before the check?',
          subgoals: [
            {
              label: 'Evaluate the two sides of the isolated equation at the candidate',
              detail:
                'At x = −3 the root is √4 = 2 and x + 1 is −2. They are not equal, so −3 is not a ' +
                'solution — and they are the same size.',
              socratic:
                'Work out each side of √(x + 7) = x + 1 separately at x = −3, and write the two ' +
                'numbers down side by side rather than only deciding whether they match. They do ' +
                'not match, which you already knew. What else is there to say about the ' +
                'relationship between those particular two numbers?',
            },
            {
              label: 'Name the equation those two numbers DO satisfy',
              detail:
                '2 is −(−2), so at x = −3 the root equals minus the other side. The candidate is ' +
                'a solution of √(x + 7) = −(x + 1).',
              socratic:
                'You have 2 on one side and −2 on the other. Leave the equation you were asked ' +
                'and write down an equation in x that those two values genuinely satisfy at ' +
                'x = −3 — one built from the same root and the same x + 1. Which equation is it?',
            },
            {
              label: 'See that squaring folds the two equations into one',
              detail:
                'Squaring √(x + 7) = x + 1 and squaring √(x + 7) = −(x + 1) give the SAME ' +
                'equation x + 7 = (x + 1)², because (−(x + 1))² is (x + 1)². So the quadratic is ' +
                'the two equations at once, and its roots are the solutions of both together.',
              socratic:
                'Square both of those equations — the one you were asked and the one you just ' +
                'wrote down — and compare the results line by line. What do you notice, and if ' +
                'one equation is all that is left of two, whose solutions is the quadratic ' +
                'reporting?',
            },
            {
              label: 'Turn it into a test that says WHICH candidate fails',
              detail:
                'A candidate is extraneous exactly when the two sides of the isolated equation ' +
                'come out with opposite signs there. At x = 2 both sides are 3 — same sign, so it ' +
                'survives. The check stops being a hunt and becomes a reading of two signs.',
              socratic:
                'You know which equation −3 belongs to, and you found that out by looking at the ' +
                'two numbers the sides of √(x + 7) = x + 1 come to there. Work out that same pair ' +
                'of numbers at x = 2, then set the two pairs beside each other: what is different ' +
                'about them, and what one condition on a candidate\'s pair would have sorted both ' +
                'candidates without substituting into the original at all?',
            },
            {
              label: 'Say what the sign test does not cover',
              detail:
                'It is a test on the ISOLATED equation, the one that was actually squared, and it ' +
                'speaks only about candidates with a sign to compare. A candidate that makes what ' +
                'is under the root negative fails for a different reason — there is no value on ' +
                'the left to have a sign. Neither candidate here does that: x + 7 is 9 at x = 2 ' +
                'and 4 at x = −3.',
              socratic:
                'The test compares the signs of two numbers, so it needs both of them to exist. ' +
                'Imagine a candidate at which x + 7 came out negative. What would the left side ' +
                'of the isolated equation be at that number, what would the test have to compare, ' +
                'and so is a failure of that kind the same thing as an extraneous root?',
            },
          ],
          answer:
            '−3 solves √(x + 7) = −(x + 1), which squares to the same quadratic. The two sides ' +
            'of the equation asked come out as 2 and −2 there: same size, opposite signs, which ' +
            'is the signature of a candidate the squaring folded in.',
        },
      },
      {
        id: 'the-even-index-is-what-forces-the-check',
        conceptId: 'radical-equations',
        statement:
          'It is the EVEN power that makes a check necessary, not the root sign. Squaring sends ' +
          'two numbers to one and so cannot be undone; cubing sends each real number to a cube ' +
          'of its own and can. √x = −2 has no solution at all, and ∛x = −2 has one that needs no ' +
          'checking.',
        position: 4,
        workedExample: {
          problem: 'Undo the root in √x = −2 and in ∛x = −2 the same way. Why does only one of them have a solution?',
          subgoals: [
            {
              label: 'Raise both sides to the index, in both equations',
              detail:
                'Squaring the first gives x = 4. Cubing the second gives x = −8. The two moves ' +
                'are the same move: apply the power that undoes the root. Neither number is a ' +
                'solution yet.',
              socratic:
                'Each equation has a root on the left, and each root is undone by one particular ' +
                'power. Apply that power to both sides of each equation and write down the two ' +
                'results. What number does each equation hand you, and on the strength of the ' +
                'first point in this concept, what are those two numbers so far?',
            },
            {
              label: 'Check each against the equation it came from',
              detail:
                '√4 = 2, which is not −2, so 4 fails. For the other, (−2)³ = −8, so ∛(−8) is ' +
                '−2 and the candidate passes. One check discards and the other does not.',
              socratic:
                'Put each candidate back into its own equation. For the second one it is easier ' +
                'to test the cube root by cubing: ask what (−2)³ comes to and compare it with the ' +
                'candidate. Which of the two candidates survives, and which does not?',
            },
            {
              label: 'Find the property that separates the two powers',
              detail:
                '2 and −2 have the same square, so squaring loses the sign and cannot be undone. ' +
                'No two different real numbers have the same cube, so cubing loses nothing. ' +
                'x ↦ x² is two-to-one on the reals and x ↦ x³ is one-to-one.',
              socratic:
                'The only difference between the two equations is the index of the root, so that ' +
                'is where the difference in behaviour has to come from. Hunt for two different ' +
                'numbers with the same square, then try to find two different numbers with the ' +
                'same cube. How did each search go, and what does that say about which of the two ' +
                'powers can be undone?',
            },
            {
              label: 'Read the same fact off the other side',
              detail:
                'An even root returns only non-negative values, so √x = c has no solution ' +
                'whenever c is negative, before any algebra. An odd root returns every real ' +
                'number, so ∛x = c always has exactly one solution. The range of the root and the ' +
                'invertibility of the power are the same fact told twice.',
              socratic:
                'Go back to the two left-hand sides and ask what values each can take as x ranges ' +
                'over everything it is allowed to be. One of them reaches −2 and the other does ' +
                'not. How does that pair of answers settle the number of solutions each equation ' +
                'has, without undoing anything — and is it telling you something new, or the same ' +
                'thing you found by comparing squares and cubes?',
            },
            {
              label: 'State when the check is part of the method',
              detail:
                'Raise both sides to an EVEN power and candidates can be gained, so every one has ' +
                'to be checked. Raise to an ODD power and none can be, so no check is needed for ' +
                'that reason. The root sign on the page does not decide it; the index does.',
              socratic:
                'Both of your moves were "undo the root by raising both sides to its index", one ' +
                'of them has to be followed by a check and the other does not, and the only thing ' +
                'that differs between them is the index itself. What is the condition on the ' +
                'index — and what does your condition predict for a fourth root and for a fifth, ' +
                'neither of which you have worked?',
            },
          ],
          answer:
            '√x = −2 has no solution: the 4 is a solution of the squared equation only, because ' +
            'squaring cannot tell 2 from −2. ∛x = −2 has the solution x = −8, and cubing being ' +
            'one-to-one is why no check was needed to establish it.',
        },
      },
    ],
  },

  {
    id: 'logarithm-definition',
    name: 'What a logarithm is',
    subjectId: subject.id,
    scope: {
      id: 'logarithm-definition',
      label: 'The definition of a logarithm',
      hint: 'logarithm definition inverse of exponentiation',
      match: /\b(logarithm\w*|log base|inverse function|antilogarithm)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-log-as-an-exponent',
        statement: 'Evaluate a logarithm by naming the exponent it stands for.',
        taskKinds: ['evaluate', 'state'],
      },
    ],
    knowledgePoints: [
      {
        id: 'log-is-an-exponent',
        conceptId: 'logarithm-definition',
        statement:
          'log_b(x) is the exponent you put on b to get x. Every logarithm question is an exponent ' +
          'question asked backwards.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Evaluate log₂(32).',
          subgoals: [
            {
              label: 'Say what is being asked',
              detail: '"What power of 2 gives 32?" — that is the whole content of the notation.',
              socratic:
                'Every power you have written so far carried three numbers: 2³ = 8 has a base, an ' +
                'exponent and a result. log₂(32) is not a power — nothing in it is raised to ' +
                'anything — and it shows you only two of those three. Which two are sitting in ' +
                'front of you, which one is absent, and so what is this notation asking you to find?',
            },
            {
              label: 'Answer the exponent question',
              detail: '2⁵ = 32, so the exponent is 5.',
              socratic:
                'What is left is a question about exponents and nothing else, of the kind you were ' +
                'answering before logarithms were mentioned. Climb the powers of 2 — 2¹, 2², and ' +
                'on — rather than guessing at it. Which one lands on 32, and since those powers ' +
                'only grow as the exponent does, what does that settle about whether some other ' +
                'exponent would have served just as well?',
            },
            {
              label: 'Write the definition down',
              detail:
                'log_b(x) = y means exactly b^y = x. The two statements are the same fact in two ' +
                'notations, which is why no new technique is needed here.',
              socratic:
                'You found that 2⁵ = 32 and then wrote 5 — one fact about 2, 5 and 32, recorded ' +
                'twice, and only the second recording used the word logarithm. Write that pairing ' +
                'out in general, with base b, argument x and answer y: which exponent statement is ' +
                'log_b(x) = y standing in for, and which of the three numbers does each of the two ' +
                'notations leave you to find?',
            },
          ],
          answer: '5',
        },
      },
      {
        id: 'log-argument-is-positive',
        conceptId: 'logarithm-definition',
        statement:
          'A logarithm of zero or of a negative number is undefined for a positive base, because ' +
          'no real exponent on a positive base produces one.',
        position: 2,
        workedExample: {
          problem: 'Why is log₂(−8) undefined?',
          subgoals: [
            {
              label: 'Turn it into the exponent question',
              detail: 'It asks for y with 2^y = −8.',
              socratic:
                'The problem has already told you that this names nothing; what it has not told ' +
                'you is why, and you cannot get at the why while the expression is still written ' +
                'as a logarithm. You have one rule for that, and it does not care whether the ' +
                'argument looks friendly: log_b(x) = y says no more and no less than b^y = x. ' +
                'Read log₂(−8) through it — what exactly would a value of y have to achieve to ' +
                'count as the answer?',
            },
            {
              label: 'Ask what values 2^y can take',
              detail:
                '2^y is positive for every real y — large y makes it large, very negative y makes ' +
                'it a small positive fraction, and it never reaches 0 or crosses below it.',
              socratic:
                'There is now a single requirement to meet, and it is a requirement about 2^y ' +
                'rather than about logarithms, so stop looking at the −8 and watch 2^y on its ' +
                'own. Put in y = 3, then y = 0, then y = −1, then y = −10, and keep pushing y ' +
                'downwards rather than deciding in advance where it is heading. How small can ' +
                'you actually drive 2^y, and what is its sign doing the whole way down?',
            },
            {
              label: 'Conclude, and note the shape of the argument',
              detail:
                'No real y works, so the expression names nothing. This is a statement about the ' +
                'range of the exponential, not a missing rule.',
              socratic:
                'Two findings now sit side by side: the answer would have to make 2^y come out ' +
                'at −8, and 2^y never comes out negative however you choose y. Someone could ' +
                'still insist that log₂(−8) is merely waiting on a rule for negative arguments ' +
                'that nobody has taught you yet. What do your two findings settle about ' +
                'log₂(−8), and what in them makes that insistence the wrong account of what has ' +
                'gone wrong?',
            },
          ],
          answer: 'Because 2^y is positive for every real y, so no exponent gives −8.',
        },
      },
    ],
  },

  {
    id: 'logarithm-rules',
    name: 'The logarithm rules',
    subjectId: subject.id,
    scope: {
      id: 'logarithm-rules',
      label: 'Logarithm rules',
      hint: 'logarithm product rule power rule change of base',
      match: /\b(logarithm\w* (?:rule|law|identit)\w*|log of a product|change of base|log rules)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'use-the-log-rules',
        statement:
          'Evaluate a logarithm by splitting its argument, and justify the split from the exponent rules.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'log-of-product',
        conceptId: 'logarithm-rules',
        statement:
          'The log of a product is the sum of the logs. This is the exponent product rule seen ' +
          'from the other side, and it applies to a product only — never to a sum.',
        position: 1,
        workedExample: {
          problem: 'Evaluate log₂(8 · 4) using the product rule, then check it directly.',
          subgoals: [
            {
              label: 'Split the product',
              detail: 'log₂(8 · 4) = log₂(8) + log₂(4) = 3 + 2 = 5.',
              socratic:
                'The problem names the product rule, which tells you which rule to reach for but ' +
                'not what it does to the expression. What it offers is a trade: one logarithm ' +
                'whose argument is 8 · 4, in exchange for something written in terms of 8 and 4 ' +
                'separately. Make that trade and then finish it off — what stands in place of ' +
                'log₂(8 · 4), and since 8 and 4 are each a power of 2, what is each of the ' +
                'pieces worth?',
            },
            {
              label: 'Check without the rule',
              detail: '8 · 4 = 32 and log₂(32) = 5. The rule agreed.',
              socratic:
                'You have an answer of 5, and every step that produced it leaned on the rule you ' +
                'were told to use — so if you had misremembered the rule, nothing so far would ' +
                'have told you. There is a second route to the same expression that never ' +
                'mentions the rule, because 8 · 4 is a number you can work out and then take the ' +
                'log of directly. Take that route to the end — what answer does it give, and ' +
                'supposing it matches, how much about the rule has that one match settled?',
            },
            {
              label: 'See why it had to work',
              detail:
                '8 = 2³ and 4 = 2², so their product is 2³⁺². The addition in the exponent *is* ' +
                'the addition of the logs — this rule and xᵃ · xᵇ = xᵃ⁺ᵇ are one fact.',
              socratic:
                'One case coming out right still leaves the 5 looking like luck, so go back to ' +
                'where the 3 and the 2 came from: each is the exponent that puts 2 onto one of ' +
                'the factors, which makes 8 · 4 a product of two powers of the same base — the ' +
                'one shape you could already collapse before logarithms were mentioned at all. ' +
                'Rewrite the product that way and apply that older rule: what becomes of the two ' +
                'exponents, and what does that make of the idea that the logarithm product rule ' +
                'is a separate fact to be remembered on its own?',
            },
            {
              label: 'Note what it does not say',
              detail:
                'log₂(8 + 4) = log₂(12), which is not 3 + 2. The rule needs a product, and using ' +
                'it on a sum is the most common error in the subject.',
              socratic:
                'The argument you just gave turned on multiplying powers of the same base, and ' +
                '8 + 4 is not a multiplication — yet on the page log₂(8 + 4) looks so much like ' +
                'log₂(8 · 4) that answering it 3 + 2 is the commonest error in the subject. Try ' +
                'it honestly: add first, so that you are looking at log₂(12), and work out what ' +
                'the answer 3 + 2 would be claiming about 2⁵ and 12. Which of those two numbers ' +
                'does the claim get wrong, and which step of the derivation you just built is the ' +
                'one that cannot run once the argument is a sum?',
            },
          ],
          answer: '5',
        },
      },
      {
        id: 'log-of-power',
        conceptId: 'logarithm-rules',
        statement:
          'The log of a power moves the exponent out in front: log_b(xⁿ) = n · log_b(x). It is the ' +
          'product rule applied n times.',
        position: 2,
        workedExample: {
          problem: 'Evaluate log₃(9⁴).',
          subgoals: [
            {
              label: 'Bring the exponent down',
              detail: 'log₃(9⁴) = 4 · log₃(9).',
              socratic:
                'The one rule you have for taking a logarithm apart needs a product, and what you ' +
                'are handed here is a power — so either this calls for some further rule nobody ' +
                'has given you, or 9⁴ is a product already. Write 9⁴ out as the multiplication it ' +
                'stands for, all four of its factors, and run the product rule across that exactly ' +
                'as you ran it across 8 · 4. What sum does that leave you holding, and since every ' +
                'term in the sum is the same term, how would you write it more shortly than as a ' +
                'sum?',
            },
            {
              label: 'Evaluate the simpler log',
              detail: '3² = 9, so log₃(9) = 2.',
              socratic:
                'What is left of the logarithm is log₃(9), and there is nothing inside it to break ' +
                'apart — no product, no power — so no rule applies to it and none is wanted. That ' +
                'makes it the plain exponent question from the definition again: the base is 3, the ' +
                'argument is 9, and the exponent is what the notation leaves you to find. Climb the ' +
                'powers of 3 rather than trusting that 9 looks familiar. Which one lands on 9, and ' +
                'what does that tell you about why this logarithm has an exact answer at all, where ' +
                'log₃(10) would not?',
            },
            {
              label: 'Multiply',
              detail: '4 · 2 = 8. And indeed 9⁴ = 3⁸.',
              socratic:
                'Two findings are on the table — that log₃(9⁴) equals 4 · log₃(9), and that ' +
                'log₃(9) is 2 — and combining them takes arithmetic and nothing else. Do it, then ' +
                'look at what the number you get is actually claiming: a base-3 logarithm names an ' +
                'exponent on 3, so your answer asserts that one particular power of 3 is equal to ' +
                '9⁴. That assertion can be checked with no logarithm in it anywhere, by replacing ' +
                'the 9 inside 9⁴ with the power of 3 you found a moment ago and collapsing the two ' +
                'exponents the way you did before logarithms were mentioned. Which power of 3 does ' +
                'that route arrive at, and what does its agreeing with your answer settle — and ' +
                'not settle — about the rule you used to get there?',
            },
          ],
          answer: '8',
        },
      },
    ],
  },

  {
    id: 'solving-exponential-equations',
    name: 'Solving an exponential equation',
    subjectId: subject.id,
    scope: {
      id: 'solving-exponential-equations',
      label: 'Exponential equations',
      hint: 'solving exponential equation taking logarithms of both sides',
      // No `match`: see `fidelity`.
    },
    fidelity: 'guided',
    caveat:
      'Wikipedia has no field for "is about solving an exponential equation", and no category ' +
      'decides it — the articles that cover this are about exponential functions, about ' +
      'logarithms, or about equation solving in general, and none of them is wrong. So this ' +
      'concept steers the search and the instruction and filters nothing. Expect it to lean, not ' +
      'to obey.',
    objectives: [
      {
        id: 'solve-for-an-exponent',
        statement: 'Solve b^x = c for x, and say why taking logs of both sides is legal.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'take-logs-of-both-sides',
        conceptId: 'solving-exponential-equations',
        statement:
          'To get at an unknown exponent, take the log of both sides. It is legal for the same ' +
          'reason any invertible operation is: the log is one-to-one, so it loses no solutions and ' +
          'invents none.',
        position: 1,
        workedExample: {
          problem: 'Solve 2^x = 32.',
          subgoals: [
            {
              label: 'Why not just rearrange?',
              detail:
                'The unknown is in the exponent, so no amount of dividing or subtracting reaches ' +
                'it. Something has to undo the exponentiation.',
              socratic:
                'Every equation you have solved until now let you peel operations off the unknown ' +
                'one at a time — divide both sides, subtract from both sides — until the unknown ' +
                'stood alone. Try that honestly here rather than deciding in advance that it ' +
                'fails: divide both sides of 2^x = 32 by 2 and write down what you are left ' +
                'holding, then go back to the original and subtract 2 from both sides and write ' +
                'that down too. In each case, where has the x ended up, and what is it about the ' +
                'place x occupies in 2^x that lets both of those moves pass it by?',
            },
            {
              label: 'Apply the inverse to both sides',
              detail: 'log₂(2^x) = log₂(32). The left side is x, by the definition of the logarithm.',
              socratic:
                'What is holding the x is "2 raised to", and you have met exactly one thing that ' +
                'answers a question about 2 raised to something: log₂(x) = y says no more and no ' +
                'less than 2^y = x. Nothing may be done to one side of an equation alone, so ' +
                'write log₂ in front of each side and look at what each becomes. Read the left ' +
                'one straight off that definition rather than through any of the rules — which ' +
                'exponent on 2 produces 2^x, and so what is standing on the left-hand side once ' +
                'you have answered that?',
            },
            {
              label: 'Read off the answer',
              detail: 'x = log₂(32) = 5.',
              socratic:
                'The equation now reads x = log₂(32), which looks like an answer and is not quite ' +
                'one: it names x by an expression rather than by a number, and whether that ' +
                'expression is a number you can write down depends on the 32. That right-hand ' +
                'side is asking only the backwards exponent question from the definition, so ' +
                'answer it by climbing the powers of 2 rather than by recognising the shape. ' +
                'What does x come out at, and what is it about 32 in particular that let this ' +
                'finish on a whole number, where 2^x = 30 would have left you holding the ' +
                'expression?',
            },
            {
              label: 'Check that nothing was lost',
              detail:
                'log₂ is one-to-one, so the new equation has exactly the solutions the old one had. ' +
                'Squaring both sides would not have this property, which is why this step is safe ' +
                'and that one needs a check.',
              socratic:
                'The second step did not rearrange the equation, it swapped it: you stopped ' +
                'working on 2^x = 32 and started working on log₂(2^x) = log₂(32), and the number ' +
                'you finished with is a solution of the second one. Someone is entitled to ask ' +
                'what makes it a solution of the first. Hold the move up against squaring both ' +
                'sides, which turns x = −3 into x² = 9 and then hands you a 3 that solves nothing ' +
                'in the original. What is true of log₂ — about how many different arguments it ' +
                'can send to the same value — that is not true of squaring, and what does that ' +
                'buy you about the solutions of the equation you were actually asked?',
            },
          ],
          answer: 'x = 5',
        },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

const EDGES: ConceptEdge[] = [
  // ── prerequisite ────────────────────────────────────────────────────────
  { id: 'xp1', from: 'exponent-rules', to: 'zero-and-negative-exponents', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Both values are *derived* from the product rule rather than defined, so the rule has to be available first.' },
  { id: 'xp2', from: 'exponent-rules', to: 'rational-exponents', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'x^(1/n) is identified as a root by applying the power rule to it.' },
  { id: 'xp3', from: 'exponent-rules', to: 'logarithm-definition', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'A logarithm is an exponent. There is nothing to ask for until exponentiation means something.' },
  { id: 'xp4', from: 'logarithm-definition', to: 'logarithm-rules', kind: 'prerequisite', promotedBy: 'author' },
  { id: 'xp5', from: 'logarithm-definition', to: 'solving-exponential-equations', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'The solving step is "apply the inverse", which requires knowing the log *is* the inverse.' },
  { id: 'xp6', from: 'logarithm-rules', to: 'solving-exponential-equations', kind: 'prerequisite', promotedBy: 'author' },
  /*
   * THE STRANDED HALF OF A PROMOTED NODE'S `needs`, RESTATED HERE BECAUSE BOTH
   * ENDS ARE CONCEPTS OF THIS SUBJECT.
   *
   * `radical-equations` declared `needs: ['quadratic-formula',
   * 'rational-exponents']` while it was a map node, and promoting it stranded
   * both — an edge is owned by the node that DECLARES it, so a promotion
   * strands exactly the `needs` written on the node and nothing else. This one
   * has an owner here. The other names a concept of `rational-expressions`,
   * which this ontology may not mention — `ontologyProblems` reports an unknown
   * endpoint — so it is a `links` entry on the area the node left, argued in
   * atlas-foundations.ts.
   */
  { id: 'xp7', from: 'rational-exponents', to: 'radical-equations', kind: 'prerequisite', promotedBy: 'author',
    rationale: 'Squaring both sides is only a safe-looking move while the root is a mystery; the reason it loses a solution is that x^(1/2) is defined to be the NON-NEGATIVE root, which is this concept and not the equation-solving. A learner for whom √9 could be −3 has no reason why any candidate should ever fail.' },

  // ── encompasses ─────────────────────────────────────────────────────────
  //
  // e1 is the strongest instance of this edge kind anywhere in the build, and
  // worth the note. The logarithm rules are not merely *analogous* to the
  // exponent rules — log(xy) = log x + log y and xᵃ · xᵇ = xᵃ⁺ᵇ are the same
  // fact stated through an inverse. A learner who has just used one has used the
  // other, and a scheduler that brought the exponent rules due afterwards would
  // be re-drilling what was demonstrated a moment ago.
  { id: 'xe1', from: 'logarithm-rules', to: 'exponent-rules', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Each log rule is an exponent rule read through the inverse; using one uses the other.' },
  { id: 'xe2', from: 'solving-exponential-equations', to: 'logarithm-definition', kind: 'encompasses', promotedBy: 'author',
    rationale: 'The solving step is the definition applied once: log_b(b^x) = x.' },
  { id: 'xe3', from: 'rational-exponents', to: 'exponent-rules', kind: 'encompasses', promotedBy: 'author' },
  { id: 'xe4', from: 'zero-and-negative-exponents', to: 'exponent-rules', kind: 'encompasses', promotedBy: 'author',
    rationale: 'Both derivations run the product rule and then divide.' },
  /*
   * NO `encompasses` FROM `radical-equations` TO `rational-exponents`, AND THE
   * MEASUREMENT IS THE REASON RATHER THAN AN OVERSIGHT.
   *
   * It is the obvious edge to want: six of the nine tasks the promotion shipped
   * evaluate a square root, so practising radical equations plainly involves
   * taking roots. But `encompasses` is a claim about what PRACTISING a concept
   * exercises, measured against the tasks that exist, and the two knowledge
   * points of `rational-exponents` are the notational identity x^(1/n) = ⁿ√x
   * and the condition on (xᵃ)ᵇ = xᵃᵇ. Not one of the nine tasks writes a
   * fractional exponent or uses either fact: they want √9 to BE 3, which is
   * arithmetic, and `roots-and-irrationals` in `arithmetic-foundations` is where
   * that is taught. A learner who finished all nine would have demonstrated
   * nothing about reading a root as a power, so crediting the prerequisite
   * would stop it coming due on the strength of work that did not touch it —
   * the exact inefficiency, run backwards, that the edge kind exists to
   * prevent.
   *
   * The prerequisite edge xp7 below is a different claim and stands: you cannot
   * see why a candidate fails without knowing that √ names the non-negative
   * root. Needing a fact to understand a method is not the same as rehearsing
   * it by carrying the method out. ontology-arithmetic.ts declines the credit
   * edge on `gcd-and-lcm` by the same measurement and ontology-vectors.ts
   * declines one on `basis-and-dimension`, so this is the third refusal of that
   * shape and the first in this file.
   */

  // ── interferes_with ─────────────────────────────────────────────────────
  {
    id: 'xi1',
    from: 'exponent-rules',
    to: 'logarithm-rules',
    kind: 'interferes_with',
    promotedBy: 'author',
    rationale:
      'Both are "multiplication becomes addition", applied to different objects: xᵃ · xᵇ = xᵃ⁺ᵇ ' +
      'adds the *exponents* of a product, while log(xy) = log x + log y adds the *logs*. Taught ' +
      'in the same sitting, learners produce log(x)·log(y) for log(xy) and xᵃᵇ for xᵃ · xᵇ — each ' +
      'rule misapplied in the other\'s shape. The close kinship that makes xe1 true is exactly ' +
      'what makes them confusable, so the two edges are not in tension.',
  },
  {
    id: 'xi2',
    from: 'zero-and-negative-exponents',
    to: 'rational-exponents',
    kind: 'interferes_with',
    promotedBy: 'author',
    rationale:
      'x⁻² and x^(1/2) are both "an exponent that is not a counting number", and the two rules ' +
      'answer different questions — one takes a reciprocal, the other takes a root. Introduced ' +
      'together, learners read x^(1/2) as 1/x² and x⁻² as a root.',
  },
  /*
   * THE THIRD PAIR, AND IT IS A CLAIM ABOUT THE SAME MOVE RATHER THAN THE SAME
   * SHAPE.
   *
   * `radical-equations` arrived from the map with no `confusedWith` on it — the
   * node was checked for one before it was deleted, since `expandEdges` turns a
   * node's `confusedWith` into an `interferes_with` edge and deleting the node
   * deletes the edge with every suite staying green. So this is not a rehomed
   * interference. It is a new one, and it is here because the subject's own
   * material already draws it.
   *
   * Both concepts say "apply the inverse of what is wrapping the unknown to
   * both sides". For an exponential that inverse is a logarithm, which is
   * one-to-one, so the step loses nothing and invents nothing. For a radical it
   * is a power, and an even power is two-to-one, so the step can invent a
   * solution. Taught in one sitting, the shared instruction is what gets
   * remembered and the difference between the two inverses is what gets
   * dropped — the learner squares an exponential equation, or solves a radical
   * one and stops without checking, which is the single commonest failure in
   * either topic.
   *
   * `take-logs-of-both-sides`'s fourth subgoal already holds the two moves up
   * against each other, so a reader may reasonably object that the material
   * WANTS them together. It wants the contrast, which costs nothing: that
   * subgoal names squaring and needs no concept scheduled beside it.
   * `interferes_with` constrains which pair may be INTRODUCED in one session,
   * and introducing the two methods together is exactly what collapses them.
   * Same resolution as xi1 above, where the kinship that makes a credit edge
   * true is what makes the pair confusable.
   */
  {
    id: 'xi3',
    from: 'solving-exponential-equations',
    to: 'radical-equations',
    kind: 'interferes_with',
    promotedBy: 'author',
    rationale:
      'Both are "undo what wraps the unknown by applying its inverse to both sides", and the ' +
      'two inverses differ in the one respect that decides whether the answer needs checking: ' +
      'log_b is one-to-one, an even power is not. Introduced together, the shared instruction ' +
      'survives and the distinction does not — learners take logs of a radical equation, or ' +
      'square an exponential one, or solve a radical equation correctly and never check.',
  },

  // ── candidate_prerequisite ──────────────────────────────────────────────
  //
  // Unreviewed, and left that way on purpose: `promotionRate` is only a
  // measurement while something is in the denominator that nobody has ruled on.
  // The rational-expressions subject now has zero pending candidates, so without
  // these two the rate there would be the only one left and it would be a
  // tautology.
  {
    id: 'xc1',
    from: 'zero-and-negative-exponents',
    to: 'logarithm-definition',
    kind: 'candidate_prerequisite',
    rationale:
      'A logarithm can be negative — log₂(1/8) = −3 — so arguably a learner needs negative ' +
      'exponents before logs mean anything on (0, 1). Against it: the definition itself needs no ' +
      'negative exponent, and xp3 already gates on the exponent rules.',
  },
  {
    id: 'xc2',
    from: 'rational-exponents',
    to: 'solving-exponential-equations',
    kind: 'candidate_prerequisite',
    rationale:
      'Solving 2^x = 10 gives a non-integer answer, so the solution set only makes sense if a ' +
      'fractional exponent does. Against it: the *method* needs nothing of the kind, and the ' +
      'shipped tasks all have integer answers.',
  },
]

export const EXPONENTS_AND_LOGARITHMS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
