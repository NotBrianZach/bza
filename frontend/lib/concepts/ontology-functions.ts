/**
 * A fourth subject: what a function is, and the three things you do to one.
 *
 * ── Why this subject, and why it does NOT move the entry point ────────────
 *
 * ontology-arithmetic.ts was authored *beneath* the algebra syllabi, and the
 * consequence was that it tightened the gate — the entry point moved down and
 * `polynomial-arithmetic` stopped being introducible on a cold account. That
 * is correct behaviour and it was worth stating loudly.
 *
 * This subject sits ABOVE the algebra, and the consequence is different —
 * though not as simple as "it changes nothing", which is what this paragraph
 * said until a test disagreed with it.
 *
 * Authoring these four DID create gates. `graphs-of-functions` rests on
 * `domain-and-range`, and while that was mapped-only `gatingPrerequisitesOf`
 * looked straight through it; now it is teachable, so it gates, and so
 * transitively does every one of the ~170 nodes above it — all of calculus,
 * analysis, topology. That is a lot of new gates.
 *
 * What is true, and is the thing worth asserting, is narrower: NO CONCEPT
 * ANYBODY CAN PRACTISE GAINED A GATE. Everything that acquired one is
 * mapped-only and has no task to serve, so no learner's session changes. The
 * gates arrive ahead of the material, which is the right order — the day
 * somebody authors `graphs-of-functions` it will already rest on a domain
 * concept that exists.
 *
 * The precise claim is in tests/atlas.mjs: no *teachable* concept outside this
 * subject gates on one of its concepts.
 *
 * ── What it covers, and the line it stops at ──────────────────────────────
 *
 * Four concepts in one chain: what a function is, where it is defined, what
 * happens when you feed one into another, and what it means to undo it. That
 * is the part of the functions area whose questions have exactly-checkable
 * answers.
 *
 * It stops at `graphs-of-functions` deliberately, and the boundary is the
 * verifier rather than the curriculum. Reading a graph is the natural next
 * concept and most of what makes it worth teaching — where the curve turns,
 * what it approaches — is a claim about a picture. `ruleEvaluate` settles
 * exact rational arithmetic; it cannot rule "the graph is increasing here",
 * and a task that asked it and then graded by keyword would be the proxy
 * failure tasks.ts warns about dressed as a feature. So the graph stays on the
 * map, and everything above it stays mapped with it.
 *
 * ── Every task is exactly rulable, and two constraints shaped them ────────
 *
 * 1. THE EXPRESSION LANGUAGE HAS NO USER-DEFINED FUNCTIONS. There is no way to
 *    write `f(g(2))` and have the engine know what `f` is. So a composition
 *    task is written as the already-substituted expression — `(2x - 3)^2 + 1`
 *    rather than `f(g(x))` — and the prompt names the two functions it came
 *    from. That is not a workaround: substituting the inner rule where the
 *    outer variable was IS what composition means, and writing it out is the
 *    step a learner gets wrong.
 *
 * 2. `exactValue` RETURNS NULL FOR A `function` NODE. `sqrt(9)` cannot be
 *    settled locally; `9^(1/2)` can, through `exactRoot`. So nothing here uses
 *    a named function even where the mathematics would suggest one — see
 *    `not-every-rule-is-a-function`, which writes the two branches of a circle
 *    as `±(1 - x²)^(1/2)`.
 *
 * ── No `interferes_with` edge, and that is a choice rather than an omission ─
 *
 * The real confusion in this subject is `f⁻¹` against `x⁻¹` — the notation for
 * an inverse function is the notation for a reciprocal, and they are unrelated
 * operations. But the reciprocal lives in `zero-and-negative-exponents`, in
 * the exponents subject, and an `interferes_with` edge whose far endpoint is
 * not in this ontology fails `ontologyProblems` on the subject viewed alone.
 * Cross-area edges belong to the atlas, and `MapArea.links` carries
 * prerequisites only.
 *
 * Rather than invent a within-subject pair to have one, the confusion is
 * taught where it actually helps — in the worked example for
 * `an-inverse-undoes-the-rule`, which is where a learner meets the notation.
 * An authored interference that nobody believes is worse than none.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'functions-and-inverses',
  name: 'Functions and inverses',
  covers:
    'What a function is and the three things done to one: where it is defined, what happens ' +
    'when one is fed into another, and what undoing it requires. Nothing about graphs — reading ' +
    'a curve is the natural next step and its questions are about a picture, which this ' +
    'verifier cannot rule — and so nothing about transformations, families or asymptotes either.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'function-concept',
    name: 'What a function is',
    subjectId: subject.id,
    scope: {
      id: 'function-concept',
      label: 'The function concept',
      hint: 'function mapping input output well defined',
      match: /\b(function|mapping|well[- ]defined|single[- ]valued|vertical[- ]line test|input and output)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'apply-a-rule',
        statement:
          'Apply a function to an input, including an input that is itself an expression, and ' +
          'say why a rule that gives two answers is not a function.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'one-output-per-input',
        conceptId: 'function-concept',
        statement:
          'A function assigns exactly one output to each input. The uniqueness is the whole ' +
          'content of the definition — everything else about functions is built on being able ' +
          'to say "the" value rather than "a" value.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f(4), and say what the definition guarantees.',
          subgoals: [
            {
              label: 'Put the input where the variable is',
              detail: 'Every x in the rule becomes 4: 3·4 − 2.',
            },
            {
              label: 'Compute',
              detail: '12 − 2 = 10.',
            },
            {
              label: 'What "exactly one" bought you',
              detail:
                'There is no second answer to look for, which is why "f(4)" names a number ' +
                'rather than a set. That is what makes it legal to write f(4) inside a larger ' +
                'expression at all — a rule returning two values could not be substituted into ' +
                'anything.',
            },
          ],
          answer: '10',
        },
      },
      {
        id: 'the-input-can-be-an-expression',
        conceptId: 'function-concept',
        statement:
          'The variable in a rule is a placeholder, not a name. Whatever you put in its place ' +
          'goes in everywhere it appears — a number, another letter, or a whole expression.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f(x + 1) at x = 4.',
          subgoals: [
            {
              label: 'Substitute the whole expression',
              detail:
                'The placeholder becomes (x + 1), brackets and all: 3(x + 1) − 2. Dropping the ' +
                'brackets gives 3x + 1 − 2, which is a different rule — the commonest error here ' +
                'and the same one as subtracting a bracket.',
            },
            {
              label: 'Now put the number in',
              detail: 'At x = 4 the input is 5, so 3·5 − 2 = 13.',
            },
            {
              label: 'Check it against the other order',
              detail:
                'f(4) = 10 and f(5) = 13. f(x + 1) at x = 4 must equal f(5), and it does — which ' +
                'is the check that the substitution was done to the input rather than to the ' +
                'output.',
            },
          ],
          answer: '13',
        },
      },
      {
        id: 'not-every-rule-is-a-function',
        conceptId: 'function-concept',
        statement:
          'x² + y² = 1 is a perfectly good relation and not a function: at x = 0 it allows both ' +
          'y = 1 and y = −1. A rule fails to be a function the moment one input has two outputs.',
        position: 3,
        workedExample: {
          problem:
            'The unit circle gives y = ±(1 − x²)^(1/2). Show it is not a function by measuring ' +
            'the gap between its two branches at x = 0.',
          subgoals: [
            {
              label: 'Name both candidate outputs',
              detail:
                'The positive branch is (1 − x²)^(1/2) and the negative branch is its negation. ' +
                'At x = 0 those are 1 and −1.',
            },
            {
              label: 'Measure the gap',
              detail:
                'Subtracting one from the other gives 1 − (−1) = 2. A gap of zero would mean the ' +
                'two branches agreed and there was only ever one output.',
            },
            {
              label: 'Read off the conclusion',
              detail:
                'The gap is not zero, so x = 0 has two outputs and the relation is not a ' +
                'function. This is exactly what the vertical-line test draws: a vertical line at ' +
                'x = 0 crosses the circle twice.',
            },
            {
              label: 'And how it is repaired',
              detail:
                'Keeping only the positive branch gives a function. That is a restriction, not a ' +
                'discovery — the circle did not become a function, a part of it was chosen.',
            },
          ],
          answer: 'The gap is 2, so there are two outputs at x = 0 and it is not a function',
        },
      },
    ],
  },

  {
    id: 'domain-and-range',
    name: 'Domain and range',
    subjectId: subject.id,
    scope: {
      id: 'domain-and-range',
      label: 'Domain and range',
      hint: 'domain range codomain where a function is defined',
      match: /\b(domain|range|codomain|excluded (value|point)s?|where .{0,20}defined)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-where-a-rule-works',
        statement:
          'Find the inputs a rule cannot take and say what goes wrong at each, and name what the ' +
          'rule actually reaches.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-domain-is-where-the-rule-works',
        conceptId: 'domain-and-range',
        statement:
          'The domain is every input the rule can accept. For a quotient that means everywhere ' +
          'the denominator is not zero — and the way to find the exclusions is to ask what makes ' +
          'it vanish, not to look at the fraction and guess.',
        position: 1,
        workedExample: {
          problem: 'Where is f(x) = 1/(x − 3) undefined? Evaluate the denominator there.',
          subgoals: [
            {
              label: 'Ask what breaks the rule',
              detail:
                'Division is defined for every pair except a zero divisor, so the only way this ' +
                'rule can fail is x − 3 = 0.',
            },
            {
              label: 'Solve for that input',
              detail: 'x = 3. The denominator at x = 3 is 3 − 3 = 0.',
            },
            {
              label: 'State the domain',
              detail:
                'Every real number except 3. Note the exclusion is a fact about the RULE — ' +
                'f is not "undefined at 3" because somebody decided, but because nothing is.',
            },
          ],
          answer: 'Undefined at x = 3, where the denominator evaluates to 0',
        },
      },
      {
        id: 'the-range-is-what-it-reaches',
        conceptId: 'domain-and-range',
        statement:
          'The range is the set of outputs the rule actually produces, which is usually smaller ' +
          'than the numbers it is allowed to produce. Finding it means asking what the rule can ' +
          'and cannot get to, not reading it off the formula.',
        position: 2,
        workedExample: {
          problem: 'f(x) = x² + 4. Evaluate f(0), and say why that value is the bottom of the range.',
          subgoals: [
            {
              label: 'Evaluate at the obvious place',
              detail: 'f(0) = 0 + 4 = 4.',
            },
            {
              label: 'Argue nothing is below it',
              detail:
                'x² is never negative, so x² + 4 is never below 4. The value 4 is reached, at ' +
                'x = 0, so it is in the range rather than merely a bound.',
            },
            {
              label: 'State the range',
              detail:
                'Every number from 4 upwards. The domain here is everything — this is a function ' +
                'whose domain and range are quite different sets, which is the normal case.',
            },
          ],
          answer: 'f(0) = 4, and the range is everything from 4 up',
        },
      },
      {
        id: 'a-hole-is-not-a-simplification',
        conceptId: 'domain-and-range',
        statement:
          'Cancelling a common factor changes the domain. (x² − 4)/(x − 2) and x + 2 agree ' +
          'everywhere except x = 2, where the first is undefined and the second is 4 — so they ' +
          'are different functions that happen to share almost all their values.',
        position: 3,
        workedExample: {
          problem: 'Evaluate (x² − 4)/(x − 2) at x = 5, and say what happens at x = 2.',
          subgoals: [
            {
              label: 'Evaluate where it is defined',
              detail: '(25 − 4)/(5 − 2) = 21/3 = 7. Note x + 2 at x = 5 is also 7.',
            },
            {
              label: 'Now look at the excluded point',
              detail:
                'At x = 2 the denominator is 0, so the original is undefined — even though the ' +
                'numerator is 0 too and the cancelled form gives 4.',
            },
            {
              label: 'Say what the cancellation did',
              detail:
                'Factoring gives (x − 2)(x + 2)/(x − 2), and cancelling is legal only when ' +
                'x ≠ 2 — the step quietly assumes the thing it is dividing by is not zero. The ' +
                'result is a function with a hole at x = 2, and writing "= x + 2" without that ' +
                'condition has thrown the hole away.',
            },
          ],
          answer: '7 at x = 5; undefined at x = 2, which is a hole rather than a value',
        },
      },
    ],
  },

  {
    id: 'function-composition',
    name: 'Composition',
    subjectId: subject.id,
    scope: {
      id: 'function-composition',
      label: 'Composition',
      hint: 'composition composite function feeding one function into another',
      match: /\b(composit\w+|compose\w*|f ?∘ ?g|f\(g\(|inner function|outer function)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compose-two-rules',
        statement:
          'Evaluate a composite in the right order, and say why the composite may be undefined ' +
          'where both parts are fine.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'composition-is-substitution',
        conceptId: 'function-composition',
        statement:
          'f(g(x)) means: work out g(x), then feed that number to f. On paper it is substituting ' +
          'the whole of g\'s rule where f\'s variable was — the same move as putting an ' +
          'expression into a function, done with a rule instead of a number.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'f(x) = x² + 1 and g(x) = 2x − 3. Find f(g(2)).',
          subgoals: [
            {
              label: 'Work from the inside out',
              detail: 'g(2) = 2·2 − 3 = 1. That number is the input to f.',
            },
            {
              label: 'Feed it to the outer rule',
              detail: 'f(1) = 1² + 1 = 2.',
            },
            {
              label: 'The same thing as one expression',
              detail:
                'Substituting g\'s rule into f gives f(g(x)) = (2x − 3)² + 1, and at x = 2 that ' +
                'is (1)² + 1 = 2. Same answer, and the second form is the one you need when the ' +
                'input is a letter rather than a number.',
            },
          ],
          answer: '2',
        },
      },
      {
        id: 'the-order-matters',
        conceptId: 'function-composition',
        statement:
          'f(g(x)) and g(f(x)) are different functions. Composition is not commutative, and ' +
          'expecting it to be is the error that makes inverses look harder than they are.',
        position: 2,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'With the same f(x) = x² + 1 and g(x) = 2x − 3, find g(f(2)) and compare.',
          subgoals: [
            {
              label: 'Inside first, but a different inside',
              detail: 'Now f is inner: f(2) = 4 + 1 = 5.',
            },
            {
              label: 'Then the outer rule',
              detail: 'g(5) = 2·5 − 3 = 7.',
            },
            {
              label: 'Compare with the other order',
              detail:
                'f(g(2)) = 2 and g(f(2)) = 7. Not equal, and not close — the two compositions ' +
                'are genuinely different rules: (2x − 3)² + 1 against 2(x² + 1) − 3.',
            },
          ],
          answer: '7, against 2 the other way round',
        },
      },
      {
        id: 'the-composite-domain-can-shrink',
        conceptId: 'function-composition',
        statement:
          'The domain of f(g(x)) is the inputs where g is defined AND g\'s output is something f ' +
          'accepts. So a composite can be undefined at a point where both functions separately ' +
          'are perfectly happy.',
        position: 3,
        workedExample: {
          problem: 'f(x) = 1/x and g(x) = x − 1. Evaluate f(g(3)), and find where the composite fails.',
          subgoals: [
            {
              label: 'Evaluate it',
              detail: 'g(3) = 2, and f(2) = 1/2. So f(g(3)) = 1/2.',
            },
            {
              label: 'Write the composite',
              detail: 'f(g(x)) = 1/(x − 1).',
            },
            {
              label: 'Find where it breaks, and notice where it does not',
              detail:
                'It fails at x = 1. But g is defined at 1 — g(1) = 0, perfectly fine — and f is ' +
                'defined at every input except 0. Neither function is broken at x = 1; the ' +
                'composite is, because g sends 1 to exactly the one place f cannot take.',
            },
            {
              label: 'The rule this gives you',
              detail:
                'Checking the two domains separately is not enough. You have to ask what the ' +
                'inner function\'s outputs are, and whether any of them land where the outer ' +
                'one is undefined.',
            },
          ],
          answer: '1/2, and the composite is undefined at x = 1',
        },
      },
    ],
  },

  {
    id: 'inverse-functions',
    name: 'Inverse functions',
    subjectId: subject.id,
    scope: {
      id: 'inverse-functions',
      label: 'Inverse functions',
      hint: 'inverse function one to one injective restrict the domain undo',
      match: /\b(inverse functions?|one[- ]to[- ]one|injectiv\w+|f\^?-1|restrict\w* the domain)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'undo-a-rule',
        statement:
          'Apply the inverse of a rule, show the two compose to the identity, and say why a rule ' +
          'that is not one-to-one has no inverse until its domain is cut down.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-inverse-undoes-the-rule',
        conceptId: 'inverse-functions',
        statement:
          'f⁻¹ is the rule that takes an output back to the input it came from. The notation is ' +
          'borrowed and it is a genuine trap: f⁻¹ is NOT 1/f. For f(x) = 3x − 2 the inverse is ' +
          '(y + 2)/3, and the reciprocal is 1/(3x − 2), which are not the same function at any ' +
          'point worth checking.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f⁻¹(10).',
          subgoals: [
            {
              label: 'Ask the question backwards',
              detail:
                'f⁻¹(10) is the input whose output is 10 — the x with 3x − 2 = 10, not the ' +
                'value of some new formula applied to 10.',
            },
            {
              label: 'Undo the steps in reverse order',
              detail:
                'f multiplies by 3 then subtracts 2. Undoing means add 2 then divide by 3: ' +
                '(10 + 2)/3 = 4. Reverse order matters — dividing first would undo a rule that ' +
                'subtracted first.',
            },
            {
              label: 'Check against the original',
              detail: 'f(4) = 3·4 − 2 = 10, which is where we started.',
            },
            {
              label: 'And check it is not the reciprocal',
              detail:
                '1/f(10) = 1/28, nothing like 4. The superscript −1 means "inverse function" on ' +
                'a function and "reciprocal" on a number, and the only defence is to read which ' +
                'object it is attached to.',
            },
          ],
          answer: '4',
        },
      },
      {
        id: 'the-pair-composes-to-the-identity',
        conceptId: 'inverse-functions',
        statement:
          'What makes f⁻¹ the inverse is that f(f⁻¹(y)) = y and f⁻¹(f(x)) = x. That is the ' +
          'definition, and it is also the only check worth doing — a candidate inverse either ' +
          'composes back to the identity or it is not the inverse.',
        position: 2,
        workedExample: {
          problem: 'With f(x) = 3x − 2 and the candidate f⁻¹(y) = (y + 2)/3, evaluate f(f⁻¹(7)).',
          subgoals: [
            {
              label: 'Inner first',
              detail: 'f⁻¹(7) = (7 + 2)/3 = 3.',
            },
            {
              label: 'Then the outer',
              detail: 'f(3) = 3·3 − 2 = 7.',
            },
            {
              label: 'Why landing back on 7 settles it',
              detail:
                'The composite returned its own input. Written out, f(f⁻¹(y)) = 3·((y + 2)/3) − 2 ' +
                '= (y + 2) − 2 = y for every y, so this is not a coincidence at 7 — it is the ' +
                'identity, which is what being an inverse means.',
            },
          ],
          answer: '7 — the composite returns its input',
        },
      },
      {
        id: 'it-has-to-be-one-to-one',
        conceptId: 'inverse-functions',
        statement:
          'A function has an inverse only if different inputs give different outputs. Squaring ' +
          'does not: 3 and −3 both go to 9, so there is no rule that can send 9 back to the one ' +
          'it came from.',
        position: 3,
        workedExample: {
          problem: 'Show that squaring is not one-to-one by evaluating x² − (−x)² at x = 3.',
          subgoals: [
            {
              label: 'Square both of a pair',
              detail: '3² = 9 and (−3)² = 9.',
            },
            {
              label: 'Measure the difference',
              detail:
                '9 − 9 = 0. Two different inputs, and the gap between their outputs is nothing — ' +
                'which is exactly the failure. For a one-to-one rule this difference could not ' +
                'be zero unless the inputs were equal.',
            },
            {
              label: 'What that costs',
              detail:
                'An inverse would have to decide whether 9 came from 3 or from −3, and nothing ' +
                'in the output records which. So no inverse exists on the whole line.',
            },
            {
              label: 'And how it is repaired',
              detail:
                'Restrict the domain to x ≥ 0 and squaring becomes one-to-one, with the positive ' +
                'square root as its inverse. The restriction is part of the answer, not a ' +
                'technicality — "the inverse of x²" is meaningless until somebody says which ' +
                'half.',
            },
          ],
          answer: '0 — two inputs share an output, so there is no inverse',
        },
      },
    ],
  },
]

/**
 * The edges. One chain, and every link is a real dependency rather than a
 * teaching order.
 *
 * `domain-and-range` genuinely needs `function-concept`: "where is this
 * defined" presupposes that there is a single value to be defined. Composition
 * needs the domain, because the thing that makes composites hard is the
 * shrinking domain rather than the substitution. And an inverse is defined BY a
 * composition — f⁻¹ is the thing that composes with f to the identity — so it
 * cannot come first.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'function-concept->domain-and-range',
    from: 'function-concept',
    to: 'domain-and-range',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  {
    id: 'domain-and-range->function-composition',
    from: 'domain-and-range',
    to: 'function-composition',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  {
    id: 'function-composition->inverse-functions',
    from: 'function-composition',
    to: 'inverse-functions',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },

  /**
   * Credit propagation. Each of these is "you cannot do the first without
   * doing the second", which is the standard the edge has to meet.
   *
   * `inverse-functions => function-composition` is the strongest in the
   * build: the check that something IS an inverse is a composition, so every
   * inverse task performs one. Without this edge a learner who had just
   * demonstrated composition inside an inverse problem would have composition
   * come due as though untouched.
   */
  {
    id: 'domain-and-range=>function-concept',
    from: 'domain-and-range',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Deciding where a rule is defined means applying the rule and watching it fail, so every ' +
      'domain question also exercises evaluating the function.',
  },
  {
    id: 'function-composition=>function-concept',
    from: 'function-composition',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'A composite is evaluated by applying two rules in turn; substituting into each is the ' +
      'function concept in use.',
  },
  {
    id: 'inverse-functions=>function-composition',
    from: 'inverse-functions',
    to: 'function-composition',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Verifying an inverse IS composing it with the original and checking the identity, so an ' +
      'inverse task is a composition task with its answer known in advance.',
  },
]

export const FUNCTIONS_AND_INVERSES: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
