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
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'exponents-and-logarithms',
  name: 'Exponents and logarithms',
  covers:
    'Integer exponent rules through solving a one-step exponential equation. Real bases, ' +
    'positive where a logarithm requires it. Nothing about e or natural growth, nothing about ' +
    'complex exponents, and no calculus — the derivative of a logarithm is the usual next step ' +
    'and is not in here.',
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
