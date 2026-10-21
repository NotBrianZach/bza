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
 * **Coverage is partial and deliberately so.** Nine knowledge points, tasks on
 * the five that exact arithmetic can rule. The rest carry worked examples and no
 * tasks, which the registry permits and which is honest: a knowledge point with
 * no rulable task is still worth teaching, and faking a task for it would be the
 * failure tasks.ts's header warns about.
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
            },
            {
              label: 'Count the copies',
              detail: 'Three 2s times four 2s is seven 2s in a row, so the result is 2⁷.',
            },
            {
              label: 'State the rule the count proves',
              detail:
                'xᵃ · xᵇ = xᵃ⁺ᵇ. The addition in the exponent is where the counting went, which ' +
                'is why the rule needs the bases to be the same — you cannot count 2s and 3s together.',
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
            },
            {
              label: 'Use the rule you already have',
              detail: 'Four factors of the same base add their exponents: 2 + 2 + 2 + 2 = 8.',
            },
            {
              label: 'Read off the general rule',
              detail:
                '(xᵃ)ᵇ = xᵃᵇ. The multiplication is repeated addition of the inner exponent, ' +
                'which is why this rule rests on the product rule rather than standing beside it.',
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
            },
            {
              label: 'Solve for the unknown value',
              detail: 'Dividing both sides by 5ᵃ — legal because 5ᵃ ≠ 0 — leaves 5⁰ = 1.',
            },
            {
              label: 'Notice what the argument needed',
              detail:
                'It divided by the base to a power. For base 0 that division is illegal, which is ' +
                'exactly why 0⁰ is left undefined rather than declared to be 1.',
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
            },
            { label: 'Write the reciprocal', detail: '1/2³ = 1/8.' },
            {
              label: 'Check the sign',
              detail:
                '1/8 is positive. A negative exponent never makes a positive base negative, and ' +
                'reading it as −8 is the error this point exists to prevent.',
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
        statement: 'Evaluate a power with a rational exponent, and state when it is defined.',
        taskKinds: ['evaluate', 'state'],
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
            },
            {
              label: 'Read what that says',
              detail: '9^(1/2) is a number whose square is 9. That is what "square root of 9" means.',
            },
            {
              label: 'Pick the one that is meant',
              detail:
                'Both 3 and −3 square to 9. The notation x^(1/2) means the *non-negative* one by ' +
                'convention, so 9^(1/2) = 3 and not −3.',
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
            },
            {
              label: 'Find the step that failed',
              detail:
                'The power rule (xᵃ)ᵇ = xᵃᵇ was applied to a negative base with a fractional ' +
                'exponent. It is not valid there — (−4)^(1/2) is not a real number at all.',
            },
            {
              label: 'State the rule with its condition',
              detail:
                '(xᵃ)ᵇ = xᵃᵇ for x ≥ 0 when b is not an integer. Dropping "x ≥ 0" is what produced ' +
                '4 = −4.',
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
            },
            { label: 'Answer the exponent question', detail: '2⁵ = 32, so the exponent is 5.' },
            {
              label: 'Write the definition down',
              detail:
                'log_b(x) = y means exactly b^y = x. The two statements are the same fact in two ' +
                'notations, which is why no new technique is needed here.',
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
            },
            {
              label: 'Ask what values 2^y can take',
              detail:
                '2^y is positive for every real y — large y makes it large, very negative y makes ' +
                'it a small positive fraction, and it never reaches 0 or crosses below it.',
            },
            {
              label: 'Conclude, and note the shape of the argument',
              detail:
                'No real y works, so the expression names nothing. This is a statement about the ' +
                'range of the exponential, not a missing rule.',
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
            },
            {
              label: 'Check without the rule',
              detail: '8 · 4 = 32 and log₂(32) = 5. The rule agreed.',
            },
            {
              label: 'See why it had to work',
              detail:
                '8 = 2³ and 4 = 2², so their product is 2³⁺². The addition in the exponent *is* ' +
                'the addition of the logs — this rule and xᵃ · xᵇ = xᵃ⁺ᵇ are one fact.',
            },
            {
              label: 'Note what it does not say',
              detail:
                'log₂(8 + 4) = log₂(12), which is not 3 + 2. The rule needs a product, and using ' +
                'it on a sum is the most common error in the subject.',
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
            },
            { label: 'Evaluate the simpler log', detail: '3² = 9, so log₃(9) = 2.' },
            { label: 'Multiply', detail: '4 · 2 = 8. And indeed 9⁴ = 3⁸.' },
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
            },
            {
              label: 'Apply the inverse to both sides',
              detail: 'log₂(2^x) = log₂(32). The left side is x, by the definition of the logarithm.',
            },
            { label: 'Read off the answer', detail: 'x = log₂(32) = 5.' },
            {
              label: 'Check that nothing was lost',
              detail:
                'log₂ is one-to-one, so the new equation has exactly the solutions the old one had. ' +
                'Squaring both sides would not have this property, which is why this step is safe ' +
                'and that one needs a check.',
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
