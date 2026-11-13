/**
 * Foundations: what a school mathematics education actually passes through.
 *
 * Six areas, in the order they are usually met, and the order is a real claim
 * rather than a convention — every edge here is "you cannot do the second
 * without the first", not "the second is normally taught later".
 *
 * ── WHERE THIS MEETS THE AUTHORED SYLLABI ─────────────────────────────────
 *
 * `rational-expressions` and `exponents-and-logarithms` have problems written
 * for them, so this file does NOT restate their concepts. It points at them:
 * `quadratic-formula` needs `factoring-quadratics`, the real one. The `links`
 * on `algebra-foundations` do the converse, giving those syllabi the arithmetic
 * they genuinely rest on, so they stop appearing as roots of mathematics.
 *
 * ── WHAT IS DELIBERATELY NOT SPLIT ────────────────────────────────────────
 *
 * Granularity is the hard editorial call in a map, and the rule used here is:
 * split when the prerequisite structure differs, not when the topics differ. So
 * `area-and-perimeter` is one node rather than one per shape — the shapes share
 * every prerequisite — while `congruence` and `similarity` are separate,
 * because similarity needs ratio and congruence does not.
 */

import type { MapArea } from './atlas'

const NUMBER_AND_ARITHMETIC: MapArea = {
  id: 'number-and-arithmetic',
  name: 'Number and arithmetic',
  covers:
    'Whole numbers through rational numbers: ratio and percent, decimals and recurrence, ' +
    'scientific notation, and the step out to the irrationals and the real line. What is left ' +
    'here is what rests on the primes rather than the primes themselves. The arithmetic ' +
    'underneath — place value, the written algorithms, order of operations, signed numbers, ' +
    'divisibility, fractions, prime factorisation, and the gcd and lcm built on those primes — ' +
    'now has problems written for it and lives in the arithmetic-foundations syllabus; this ' +
    'area points at those concepts rather than restating them. Nothing of that group is left ' +
    'here. Nothing symbolic — the moment a letter stands for an unknown, it is algebra.',
  /**
   * EIGHT NODES HAVE LEFT THIS AREA AS THEY WERE AUTHORED, AND HAD TO.
   *
   * `place-value`, `integer-arithmetic`, `order-of-operations`,
   * `negative-numbers`, `divisibility`, `fraction-arithmetic`,
   * `prime-factorisation` and `gcd-and-lcm` are now real concepts with worked
   * examples and tasks, in ontology-arithmetic.ts. `atlasProblems` rejects a
   * map node whose id collides with an authored concept — not as tidiness, but
   * because the composed concept list would then hold two entries for the id
   * and the shadowing copy has no knowledge points, so a fully authored
   * concept would silently read as unteachable.
   *
   * The count is kept current deliberately. It is the measurement of how far
   * this area has turned into a syllabus, and a comment saying "five" while
   * eight have gone is the kind of rot that makes a reader distrust the rest
   * of the file.
   *
   * The `needs` below still name them. That is the intended way for the map to
   * meet a syllabus: the edge resolves in `composeAtlas`, where both endpoints
   * exist. It is dropped by `areaOntology`, which keeps only edges internal to
   * the area — so this area viewed alone now shows `absolute-value` and
   * `divisibility`-dependent nodes as roots. That is the area view being
   * honest about its own boundary rather than a fault.
   *
   * An edge is owned by the node that DECLARES it, which is the part that
   * catches people out. Promoting a node strands the `needs` on the node
   * itself and leaves every edge declared elsewhere alone — so a promotion
   * needs a `links` entry only when something that STAYED here depended on the
   * node that left, and hands one BACK when the far end of an existing link is
   * promoted in turn. This area has now produced one of each; the notes
   * further down say which was which, and `links` is empty again as a result.
   */
  nodes: [
    {
      id: 'absolute-value',
      match: /\babsolute value\b/i,
      name: 'Absolute value',
      is: 'Distance from zero, which is why it is a function of sign rather than an instruction to delete a minus.',
      needs: ['negative-numbers'],
      terms: 'absolute value modulus distance from zero',
    },
    /*
     * `prime-factorisation` was here and is now authored in
     * ontology-arithmetic.ts, so it had to leave — same rule, seventh time in
     * this area. See the block above the node list.
     *
     * Its OWN `needs: ['divisibility']` left with it and is restated as an
     * edge inside that subject, where both endpoints now live. It did not need
     * a `links` entry the way `fraction-arithmetic` did, and the difference is
     * worth knowing for the next promotion: `fraction-arithmetic` was depended
     * on by a node that STAYED here, so the incoming edge had nowhere to go
     * but `links`. Every edge into `prime-factorisation` is declared by the
     * node at the far end — `decimal-representation`, `roots-and-irrationals`,
     * two in atlas-structures.ts, and `gcd-and-lcm`, which was below until it
     * was promoted in turn — so all five sat in files that were not touched,
     * and `composeAtlas` resolves them because both endpoints exist in the
     * composed graph.
     *
     * The rule in one line: a `needs` is owned by the node that DECLARES it.
     * Promoting a node strands the edges it declared and leaves the rest alone.
     */
    /*
     * `gcd-and-lcm` was here and is now authored in ontology-arithmetic.ts, so
     * it had to leave — same rule, eighth time in this area, and it is the last
     * of the group the arithmetic syllabus was written to cover.
     *
     * Both of its own edges went with it and BOTH are restated inside that
     * subject, which is the first promotion in this file where that is true of
     * the incoming side as well:
     *
     *  - `needs: ['prime-factorisation']` is restated as a prerequisite edge
     *    there, both endpoints being authored in the same subject. Same as
     *    `prime-factorisation`'s own `needs` above it.
     *  - `exercises: ['prime-factorisation']` is NOT restated, and that is a
     *    judgement rather than an omission. `exercises` here is a claim about
     *    the mathematics, which is why this field is authored on unwritten
     *    nodes at all; an authored `encompasses` edge is a claim about what
     *    PRACTISING exercises, and measured against the three tasks that now
     *    exist it does not hold. The full argument is beside the credit-
     *    propagation block in ontology-arithmetic.ts, where a reader looking
     *    for the missing edge will go.
     *
     * The `links` entry that used to sit below also moved into that subject,
     * and that one did not come off the node at all — see the note on `links`
     * at the end of this area.
     */
    /*
     * `fraction-arithmetic` was here and is now authored in
     * ontology-arithmetic.ts, so it had to leave: `atlasProblems` rejects a
     * mapped node colliding with an authored concept.
     *
     * Its OWN `needs` left with it — that is the trap this file already
     * records one area down, where authoring `function-concept` silently
     * deleted `variables-and-expressions → function-concept`. The node
     * declared `needs: ['gcd-and-lcm', 'negative-numbers']`, and both halves
     * now live inside the arithmetic subject: `negative-numbers` went straight
     * there, being authored alongside, and `gcd-and-lcm` spent a while in this
     * area's `links` and followed it when that node was promoted too. So this
     * area carries nothing on behalf of either any more — see the note where
     * `links` used to be.
     *
     * Edges pointing the OTHER way survive untouched: `decimal-representation`,
     * `ratio-and-rate` and `roots-and-irrationals` each name
     * `fraction-arithmetic` in their own `needs`, they are all still here, and
     * `composeAtlas` resolves them across the file boundary.
     */
    {
      id: 'decimal-representation',
      match: /\b(decimal (representation|expansion)|repeating decimal)/i,
      name: 'Decimals and recurrence',
      is: 'Writing a rational number in base ten, and why it terminates exactly when the denominator has only 2s and 5s.',
      needs: ['fraction-arithmetic', 'prime-factorisation'],
      terms: 'decimal expansion recurring repeating decimal',
    },
    {
      id: 'ratio-and-rate',
      match: /^ratio\b|\b(proportionality|rate of change)\b/i,
      name: 'Ratio and rate',
      is: 'Comparing two quantities multiplicatively, and the difference between a ratio of like things and a rate of unlike ones.',
      needs: ['fraction-arithmetic'],
      terms: 'ratio rate proportion unit rate',
    },
    {
      id: 'percent',
      match: /^percent(age)?\b/i,
      name: 'Percent',
      is: 'A ratio with a fixed denominator, where the recurring error is compounding a percent of the wrong base.',
      needs: ['ratio-and-rate', 'decimal-representation'],
      terms: 'percent percentage increase discount',
    },
    {
      id: 'roots-and-irrationals',
      match: /\b(irrational number|square root|nth root|surd)/i,
      name: 'Roots and irrational numbers',
      is: 'Square and higher roots, and the proof that √2 is not a ratio — the first number a reader meets that is not rational.',
      needs: ['prime-factorisation', 'fraction-arithmetic'],
      terms: 'square root irrational surd radical',
    },
    {
      id: 'real-number-line',
      match: /\b(real number|real line|number line)\b/i,
      name: 'The real line',
      is: 'Rationals and irrationals together as a complete ordered line, taken on trust here and constructed in real analysis.',
      needs: ['roots-and-irrationals', 'decimal-representation'],
      terms: 'real numbers number line completeness',
    },
    {
      id: 'scientific-notation',
      match: /\b(scientific notation|order of magnitude|significant figure)/i,
      name: 'Scientific notation and estimation',
      is: 'Writing a quantity as a digit times a power of ten, which is what makes orders of magnitude comparable at a glance.',
      needs: ['decimal-representation'],
      terms: 'scientific notation order of magnitude significant figures estimation',
    },
  ],
  /*
   * NO `links`, AND THE ONE THAT WAS HERE WENT SOMEWHERE BETTER.
   *
   * `gcd-and-lcm → fraction-arithmetic` lived here from the moment
   * `fraction-arithmetic` was authored. The reason given at the time was that
   * it "crosses from a map node to an authored concept and has nowhere else to
   * live", which was true: `links` exists exactly for an edge neither of whose
   * owners is a node of this area, and the far end was a node of this area.
   *
   * Promoting `gcd-and-lcm` made both endpoints authored concepts of
   * `arithmetic-foundations`, so the edge now has an owner and it is not this
   * file. It was moved into that subject's own edge list, and the move is worth
   * more than consistency: `links` reaches only the composed `MATHEMATICS`,
   * while `ONTOLOGIES[0]` — what `assemble` is handed when nobody names a
   * subject — is the standalone arithmetic ontology. So for as long as the edge
   * was here, the default session did not know that fractions rest on the lcm.
   *
   * The rule, since this area has now produced one example of each case: a
   * promotion needs a `links` entry when something that STAYED here depends on
   * the node that left, and gives one UP when the thing at the other end of a
   * link leaves too.
   */
}
/*
 * NOTE ON THE EDGE THAT IS NOT DECLARED HERE.
 *
 * `fraction-arithmetic → combining-rational` was the edge this concept was
 * authored for, and it already existed — in `ALGEBRA_FOUNDATIONS.links`
 * below, pointing at the mapped node. Declaring a second copy here was the
 * first attempt and was wrong.
 *
 * Which changes the story in a way worth recording: authoring this concept did
 * not ADD a gate, it made an existing edge BITE. The map had always said
 * combining rational expressions rests on fraction arithmetic;
 * `gatingPrerequisitesOf` looked straight through it because the endpoint had
 * no material to serve. Now it has, so the edge gates — and the one invariant
 * that matters still holds, because the concept it gates on is teachable.
 */

const ALGEBRA_FOUNDATIONS: MapArea = {
  id: 'algebra-foundations',
  name: 'Algebra',
  covers:
    'Letters standing for numbers: equations, inequalities, systems and quadratics. What a letter ' +
    'standing for a number actually means — the two readings of one, which terms collect, and ' +
    'substituting a signed number back in — now has problems written for it and lives in the ' +
    'expressions-and-equations syllabus; this area points at that concept rather than restating ' +
    'it. Polynomial and rational manipulation likewise has its own authored syllabus and is not ' +
    'restated here.',
  /**
   * `variables-and-expressions` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
   *
   * It is a real concept now — three knowledge points, worked examples and
   * tasks — in ontology-algebra.ts, under the new `expressions-and-equations`
   * subject. `atlasProblems` rejects a map node whose id collides with an
   * authored concept, and not as tidiness: the composed concept list would
   * then hold two entries for the id, and the shadowing copy has no knowledge
   * points, so a fully authored concept would silently read as unteachable.
   *
   * ITS OWN `needs` LEFT WITH IT, WHICH IS THE TRAP THIS FILE KEEPS RECORDING.
   * The node declared `needs: ['order-of-operations', 'negative-numbers']`.
   * Removing a node removes every edge declared on its own `needs`, and both
   * of those endpoints are authored in `arithmetic-foundations` — a different
   * subject from the new one — so neither edge can live in either ontology's
   * own edge list. They are restated in `links` below. Dropping them is
   * exactly how `function-concept` once became a root of the whole map: a
   * syllabus authored above the arithmetic and joined to nothing beneath it,
   * practisable from a cold account by somebody who had never carried a digit.
   *
   * Edges pointing the OTHER way survive untouched. `linear-equations` below
   * still names it in its own `needs`, and the two `links` that already
   * pointed at it — to `polynomial-arithmetic` here and to `function-concept`
   * in the functions area — did not need changing, because `links` never
   * cared which side was authored. All three resolve in `composeAtlas`, where
   * map nodes and authored concepts both exist. That is the intended way for
   * the map to meet a syllabus.
   *
   * `areaOntology` keeps only edges internal to the area, so this area viewed
   * alone now shows `linear-equations` as a root. That is the area view being
   * honest about its own boundary rather than a fault.
   */
  nodes: [
    {
      id: 'linear-equations',
      match: /\blinear equation\b/i,
      name: 'Linear equations in one variable',
      is: 'Solving by doing the same thing to both sides, which works because equality is preserved by any invertible operation.',
      needs: ['variables-and-expressions'],
      terms: 'linear equation solve for x balance both sides',
    },
    {
      id: 'linear-inequalities',
      match: /\blinear (inequality|inequalities)\b/i,
      name: 'Linear inequalities',
      is: 'The same moves as an equation, except multiplying by a negative reverses the relation.',
      needs: ['linear-equations', 'real-number-line'],
      confusedWith: [{
        id: 'linear-equations',
        because:
          'The procedures are identical except for one step — multiplying or dividing by a ' +
          'negative flips the inequality — so a learner who has just drilled equations applies ' +
          'the equation rule and gets a confidently wrong direction.',
      }],
      terms: 'inequality solution set interval notation',
    },
    {
      id: 'absolute-value-equations',
      match: /\babsolute[- ]value (equation|inequalit)/i,
      name: 'Absolute-value equations and inequalities',
      is: 'Splitting into cases on sign, which is why one equation can have two solutions and one inequality an interval or its complement.',
      needs: ['linear-inequalities', 'absolute-value'],
      terms: 'absolute value equation case split',
    },
    {
      id: 'systems-of-linear-equations',
      match: /\bsystem of linear equations\b/i,
      name: 'Systems of linear equations',
      is: 'Two or more conditions at once, solved by substitution or elimination, with no solution and infinitely many as real outcomes.',
      needs: ['linear-equations'],
      terms: 'simultaneous equations elimination substitution system',
    },
    {
      id: 'word-problems',
      name: 'Modelling with equations',
      is: 'Turning a description into an equation, which is the step that actually fails when algebra fails.',
      needs: ['linear-equations', 'ratio-and-rate'],
      terms: 'word problem modelling translate into equations',
    },
    {
      // Two nodes stood here and both have been AUTHORED — they live in
      // ontology.ts beside `factoring-quadratics`, which is their prerequisite:
      //
      //   completing-the-square
      //   quadratic-formula
      //
      // They had to leave. `atlasProblems` refuses a map node that collides
      // with an authored concept, because the shadowed copy carries no
      // knowledge points and an authored subject would silently read as
      // unteachable.
      //
      // Their `needs` edges did NOT leave with them. The ones joining authored
      // concepts moved into that ontology's own edge list, and
      // `quadratic-formula needs roots-and-irrationals` — which crosses from an
      // authored concept to a map node — is a `links` entry on this area below.
      // Dropping that one is precisely how `function-concept` once became a root
      // of the whole map; see the comment on `functions.links`.
      //
      // Every `needs: ['quadratic-formula']` and `needs:
      // ['completing-the-square']` elsewhere in this file still resolves,
      // because `composeAtlas` is the view in which authored concepts and map
      // nodes both exist.
      id: 'complex-numbers',
      match: /^complex number|\bimaginary unit\b/i,
      name: 'Complex numbers',
      is: 'Adjoining a square root of −1 so every quadratic has roots, with arithmetic, conjugates and modulus.',
      needs: ['quadratic-formula'],
      terms: 'complex number imaginary unit conjugate modulus argand',
    },
    // `polynomial-roots` stood here and is now AUTHORED in ontology.ts. Its
    // `needs: ['polynomial-division']` moved there with it, both endpoints
    // being authored concepts; `complex-numbers` is still a map node, so that
    // edge is a `links` entry below.
    //
    // The authored concept covers the factor and remainder theorems and
    // rational-root search. It does NOT cover the fundamental theorem of
    // algebra, which is where the complex-numbers dependency actually comes
    // from — and the edge is kept anyway rather than narrowed to match what is
    // written, because dropping it would loosen the ordering on the strength of
    // what happens to be authored today.
    {
      id: 'radical-equations',
      match: /\bradical equation\b/i,
      name: 'Radical equations',
      is: 'Squaring both sides is not invertible, so every solution has to be checked — extraneous roots are produced by the method, not by error.',
      needs: ['quadratic-formula', 'rational-exponents'],
      terms: 'radical equation extraneous solution',
    },
    {
      id: 'nonlinear-systems',
      name: 'Nonlinear systems',
      is: 'A line meeting a conic, or two conics, where the count of solutions is geometry rather than algebra.',
      needs: ['systems-of-linear-equations', 'quadratic-formula'],
      terms: 'nonlinear system intersection simultaneous quadratic',
    },
    {
      id: 'binomial-theorem',
      match: /\bbinomial (theorem|coefficient)\b/i,
      name: 'The binomial theorem',
      is: 'Expanding (a+b)^n by counting how many ways each term arises, which is where algebra first needs combinatorics.',
      needs: ['polynomial-arithmetic', 'exponent-rules'],
      terms: 'binomial theorem pascal triangle binomial coefficient',
    },
    {
      id: 'inequality-proofs',
      name: 'Proving inequalities',
      is: 'AM–GM, Cauchy–Schwarz and the rearrangement idea — the first place algebra is used to establish a claim rather than find a number.',
      needs: ['linear-inequalities', 'quadratic-formula'],
      terms: 'am-gm cauchy schwarz inequality proof',
    },
  ],
  links: [
    /**
     * THE TWO EDGES THAT WOULD HAVE BEEN LOST WHEN `variables-and-expressions`
     * WAS AUTHORED.
     *
     * They were `needs` on the node and came off with it. Both endpoints are
     * authored and they are in DIFFERENT subjects — `arithmetic-foundations`
     * on one side, `expressions-and-equations` on the other — so neither
     * ontology may declare them, and `links` is their only home.
     *
     * Written at the same time as the promotion rather than afterwards,
     * because the first time a node was authored out of this file the edge
     * went with it and nobody noticed until `function-concept` was drawn as a
     * root of mathematics.
     */
    {
      from: 'order-of-operations',
      to: 'variables-and-expressions',
      because:
        'Reading 2 + 3x as 2 + (3x) is a convention about precedence, not a fact about letters, ' +
        'so every expression written without brackets already depends on it. Substituting a ' +
        'number for the letter then asks the same question again with more at stake: 5 − 2x at ' +
        'x = −3 is 5 − 2(−3), and which operation goes first decides the answer.',
    },
    {
      from: 'negative-numbers',
      to: 'variables-and-expressions',
      because:
        'A letter carries its sign invisibly, so the moment one stands for a negative number the ' +
        'signed arithmetic has to be already fluent: 5 − 2x at x = −3 turns a subtraction into ' +
        'an addition, and x² at x = −3 is positive. A learner who is unsure of (−3)(−3) cannot ' +
        'tell a substitution error from a sign error.',
    },
    {
      from: 'variables-and-expressions',
      to: 'polynomial-arithmetic',
      because:
        'Expanding a product of brackets is the distributive law applied to letters, so it ' +
        'presupposes that a letter stands for a number at all. Without this edge the authored ' +
        'rational-expressions syllabus is drawn as a root of mathematics.',
    },
    {
      /**
       * THE EDGE THAT WOULD HAVE BEEN LOST WHEN `quadratic-formula` WAS AUTHORED.
       *
       * The node declared `needs: ['completing-the-square', 'roots-and-irrationals']`.
       * The first is now an authored concept, so that edge moved into
       * ontology.ts. This one crosses from an authored concept to a map node and
       * has nowhere else to live — an authored ontology's edges may only name
       * concepts it contains, or `ontologyProblems` reports an unknown endpoint.
       *
       * Written at the same time as the promotion rather than afterwards,
       * because the one previous time a node was authored out of this file the
       * edge went with it and nobody noticed until `function-concept` was
       * drawn as a root of mathematics.
       */
      from: 'roots-and-irrationals',
      to: 'quadratic-formula',
      because:
        'The formula produces a square root whenever the discriminant is not a perfect square, ' +
        'so a learner who cannot read √8 as 2√2 cannot write the answer the formula gives.',
    },
    {
      /**
       * The other edge `polynomial-roots` carried when it was a node here.
       *
       * Kept although the authored concept stops short of the fundamental
       * theorem of algebra, which is the part that actually needs complex
       * numbers. Narrowing the ordering to match what is currently written
       * would loosen it, and this file's rule is that gating tightens as
       * material is authored and never the reverse.
       *
       * It gates nobody today: `complex-numbers` has no material, and
       * `gatingPrerequisitesOf` looks through an unteachable prerequisite
       * rather than at it. The day somebody authors complex arithmetic it
       * starts gating, which is the behaviour that rule exists to produce.
       */
      from: 'complex-numbers',
      to: 'polynomial-roots',
      because:
        'A cubic with no rational root still has three roots, and saying so at all requires the ' +
        'complex numbers — which is where the fundamental theorem of algebra, the thing the ' +
        'root-finding techniques are groping toward, has to be met.',
    },
    {
      from: 'fraction-arithmetic',
      to: 'combining-rational',
      because:
        'Putting two algebraic fractions over a common denominator is numerical fraction ' +
        'addition with polynomials in place of integers; a learner who cannot do the second ' +
        'cannot see what the first is for.',
    },
    {
      from: 'integer-arithmetic',
      to: 'exponent-rules',
      because:
        'A power is repeated multiplication before it is anything else, and the product rule ' +
        'is counting how many factors there are in total.',
    },
    {
      from: 'roots-and-irrationals',
      to: 'rational-exponents',
      because:
        'x^(1/2) is defined to agree with the square root, so the radical has to mean something ' +
        'before the fractional exponent can be given that meaning.',
    },
  ],
}

const FUNCTIONS: MapArea = {
  id: 'functions',
  name: 'Functions',
  covers:
    'The standard families and what you can read off a picture of them: graphs, transformations, ' +
    'piecewise definitions, and the linear, polynomial, rational, exponential and logarithmic ' +
    'shapes. The function concept itself — what a function is, where it is defined, composition ' +
    'and inverses — now has problems written for it and lives in the functions-and-inverses ' +
    'syllabus; this area points at those concepts rather than restating them.',
  /**
   * FOUR NODES LEFT THIS AREA WHEN THEY WERE AUTHORED.
   *
   * `function-concept`, `domain-and-range`, `function-composition` and
   * `inverse-functions` are real concepts now, in ontology-functions.ts.
   * `atlasProblems` rejects a map node colliding with an authored concept —
   * the composed list would hold two entries for the id and the shadowing copy
   * has no knowledge points, so a fully authored concept would read as
   * unteachable.
   *
   * The boundary is the verifier rather than the curriculum: everything left
   * here either IS a picture (`graphs-of-functions`, `transformations`) or
   * rests on one, and "the graph is increasing here" is not a claim exact
   * rational arithmetic can rule. See the header of ontology-functions.ts.
   *
   * `graphs-of-functions` still names `domain-and-range` below. That edge now
   * crosses into the syllabus and resolves in `composeAtlas`, which is the
   * intended way for the map to meet authored material.
   */
  nodes: [
    {
      id: 'graphs-of-functions',
      name: 'Reading a graph',
      is: 'The graph as the set of input–output pairs, so every feature of the picture is a statement about the rule.',
      needs: ['domain-and-range', 'cartesian-plane'],
      terms: 'graph of a function intercept increasing decreasing',
    },
    {
      id: 'transformations-of-graphs',
      match: /\b(graph transformation|transformation of (a )?graph)/i,
      name: 'Transformations',
      is: 'Shifts, stretches and reflections, and why what happens to x happens backwards.',
      needs: ['graphs-of-functions'],
      terms: 'translation stretch reflection transformation of graphs',
    },
    {
      id: 'piecewise-functions',
      match: /\bpiecewise\b/i,
      name: 'Piecewise definitions',
      is: 'One function given by different rules on different pieces, which is how a definition can be complete without being a single formula.',
      needs: ['graphs-of-functions', 'absolute-value-equations'],
      terms: 'piecewise function case defined',
    },
    {
      id: 'linear-functions',
      match: /\blinear function\b/i,
      name: 'Linear functions',
      is: 'Constant rate of change, and the three forms of a line as three different questions it answers.',
      needs: ['graphs-of-functions', 'linear-equations'],
      terms: 'linear function slope intercept gradient',
    },
    {
      id: 'quadratic-functions',
      match: /\b(quadratic function|parabola)\b/i,
      name: 'Quadratic functions',
      is: 'The parabola, where completing the square and the vertex are the same fact written two ways.',
      needs: ['linear-functions', 'completing-the-square'],
      exercises: ['completing-the-square'],
      terms: 'quadratic function parabola vertex axis of symmetry',
    },
    {
      id: 'polynomial-functions',
      match: /\bpolynomial\b(?!.*\bring\b)/i,
      name: 'Polynomial functions',
      is: 'End behaviour from the leading term, turning points bounded by the degree, and roots as the only place the sign can change.',
      needs: ['quadratic-functions', 'polynomial-roots'],
      terms: 'polynomial function end behaviour degree turning point',
    },
    {
      id: 'rational-functions',
      match: /\b(rational function|asymptote)\b/i,
      name: 'Rational functions and asymptotes',
      is: 'Where a quotient blows up and what it approaches far out — the vertical asymptotes are exactly the excluded domain.',
      needs: ['polynomial-functions', 'rational-domain'],
      exercises: ['rational-domain', 'simplifying-rational'],
      terms: 'rational function vertical asymptote horizontal asymptote hole',
    },
    {
      id: 'exponential-functions',
      match: /\bexponential (function|growth|decay)\b/i,
      name: 'Exponential functions',
      is: 'Constant ratio rather than constant difference, which is the whole of why growth outruns any polynomial.',
      needs: ['linear-functions', 'rational-exponents'],
      confusedWith: [{
        id: 'polynomial-functions',
        because:
          'x² and 2^x are read as the same shape by learners who see "a power", and the two ' +
          'differ in exactly the way that matters: which of the base and the exponent is the ' +
          'variable. Introducing them together produces 2^x differentiated as x·2^(x−1).',
      }],
      terms: 'exponential function growth decay base',
    },
    {
      id: 'logarithmic-functions',
      match: /\blogarithm/i,
      name: 'Logarithmic functions',
      is: 'The inverse of an exponential, so its domain, its shape and its slowness are all forced by that.',
      needs: ['exponential-functions', 'inverse-functions', 'logarithm-definition'],
      exercises: ['logarithm-definition'],
      terms: 'logarithmic function log graph inverse exponential',
    },
    {
      id: 'parametric-and-implicit',
      match: /\bparametric equation\b/i,
      name: 'Parametric and implicit descriptions',
      is: 'Curves that are not graphs of functions, given by a parameter or by an equation in both variables.',
      needs: ['graphs-of-functions', 'nonlinear-systems'],
      terms: 'parametric equations implicit curve',
    },
  ],
  links: [
    {
      /**
       * THE EDGE THAT WAS LOST WHEN `function-concept` WAS AUTHORED.
       *
       * It used to be a `needs` on the node, and removing the node to make room
       * for the syllabus removed the edge with it — which made
       * `function-concept` a ROOT of the whole map. A syllabus authored above
       * the algebra but joined to nothing beneath it is a second entry point:
       * practisable from a cold account, in parallel with arithmetic, by
       * somebody who has never met a letter standing for a number.
       *
       * `links` is the right home for it precisely because both endpoints
       * live outside this area. When this was written that meant a mapped node
       * in algebra-foundations and an authored concept in
       * functions-and-inverses; `variables-and-expressions` has since been
       * authored too, so it is now an edge between two authored subjects and
       * this entry did not need changing. `links` never cared which side was
       * which, which is the property that makes promoting a node cheap.
       */
      from: 'variables-and-expressions',
      to: 'function-concept',
      because:
        'f(x) = 3x − 2 is a letter standing for any number before it is anything else, so the ' +
        'function concept presupposes the expression it is written with.',
    },
  ],
}

const EUCLIDEAN_GEOMETRY: MapArea = {
  id: 'euclidean-geometry',
  name: 'Euclidean geometry',
  covers:
    'Synthetic plane and solid geometry: angles, triangles, congruence, similarity, circles, ' +
    'area and volume, and the deductive style the subject exists to teach. Coordinates are a ' +
    'separate area.',
  nodes: [
    {
      id: 'points-lines-angles',
      match: /^(angle|line|point) \(geometry\)|\b(vertical angles|transversal)\b/i,
      name: 'Points, lines and angles',
      is: 'The undefined terms and the first angle facts — vertical, supplementary, and what a parallel pair forces.',
      terms: 'point line angle parallel transversal vertical angles',
    },
    {
      id: 'triangle-basics',
      match: /^triangle\b/i,
      name: 'Triangles',
      is: 'The angle sum, the triangle inequality, and the classification that the later theorems are stated against.',
      needs: ['points-lines-angles'],
      terms: 'triangle angle sum triangle inequality isosceles',
    },
    {
      id: 'congruence',
      match: /\bcongruence \(geometry\)|\bcongruent (triangle|figure)/i,
      name: 'Congruence',
      is: 'When two figures are the same figure, and why SSS, SAS and ASA are enough while SSA is not.',
      needs: ['triangle-basics'],
      terms: 'congruence sss sas asa rigid motion',
    },
    {
      id: 'geometric-proof',
      name: 'Deductive proof',
      is: 'Chaining established facts to an unobvious conclusion — the first place in mathematics where the argument is the answer.',
      needs: ['congruence'],
      terms: 'geometric proof two column deduction axiom',
    },
    {
      id: 'similarity',
      match: /\bsimilarity \(geometry\)|\bsimilar triangle/i,
      name: 'Similarity',
      is: 'Same shape, different size: equal angles force proportional sides, which is where geometry needs ratio.',
      needs: ['congruence', 'ratio-and-rate'],
      confusedWith: [{
        id: 'congruence',
        because:
          'Both are taught as triangle criteria with three-letter names and both conclude ' +
          '"corresponding parts match", so learners apply congruence criteria to similar ' +
          'figures and conclude the sides are equal rather than proportional.',
      }],
      terms: 'similarity similar triangles scale factor proportional sides',
    },
    {
      id: 'pythagoras',
      match: /\bpythagorean theorem\b|\bpythagoras('|’)? theorem\b/i,
      name: 'Pythagoras',
      is: 'The relation among the sides of a right triangle, provable from similarity, and the converse that tests for a right angle.',
      needs: ['similarity', 'roots-and-irrationals'],
      terms: 'pythagorean theorem hypotenuse right triangle converse',
    },
    {
      id: 'quadrilaterals-and-polygons',
      match: /^(quadrilateral|polygon|parallelogram|trapez|rhombus)/i,
      name: 'Quadrilaterals and polygons',
      is: 'The parallelogram family and the interior-angle sum, each property proved rather than listed.',
      needs: ['congruence'],
      terms: 'parallelogram rhombus trapezoid polygon interior angle',
    },
    {
      id: 'area-and-perimeter',
      match: /^(area|perimeter)\b/i,
      name: 'Area and perimeter',
      is: 'Area as an additive measure, with every polygon formula reduced to the rectangle by cutting and rearranging.',
      needs: ['quadrilaterals-and-polygons', 'triangle-basics'],
      terms: 'area perimeter rectangle triangle area formula',
    },
    {
      id: 'circles',
      match: /^circle\b/i,
      name: 'Circles',
      is: 'Chords, tangents and the inscribed-angle theorem — the richest set of consequences from a single definition in school geometry.',
      needs: ['geometric-proof', 'pythagoras'],
      terms: 'circle chord tangent inscribed angle arc',
    },
    {
      id: 'circle-measure',
      match: /\b(circumference|area of a (disk|circle)|\bpi\b)/i,
      name: 'Circumference and circular area',
      is: 'π as the ratio that is the same for every circle, and area as a limit of inscribed polygons rather than a formula to accept.',
      needs: ['circles', 'area-and-perimeter'],
      terms: 'circumference pi area of a circle arc length sector',
    },
    {
      id: 'solid-geometry',
      match: /^(solid geometry|polyhedron|sphere|cylinder|cone \(geometry\))/i,
      name: 'Solids, volume and surface area',
      is: 'Prisms, pyramids, cylinders, cones and the sphere, with the factor of a third and the factor of four as the two facts worth proving.',
      needs: ['circle-measure'],
      terms: 'volume surface area prism pyramid cone sphere',
    },
    {
      id: 'isometries-and-symmetry',
      match: /\b(isometry|symmetry group|reflection symmetry|rotational symmetry)\b/i,
      name: 'Isometries and symmetry',
      is: 'Reflections, rotations and translations as the maps that preserve distance, and symmetry as invariance under them.',
      needs: ['congruence'],
      terms: 'isometry reflection rotation translation symmetry group',
    },
    {
      id: 'constructions',
      match: /\bstraightedge and compass\b|\bcompass[- ]and[- ]straightedge\b/i,
      name: 'Straightedge and compass constructions',
      is: 'What can be built from the two classical tools, and the fact that some famous targets provably cannot.',
      needs: ['circles'],
      terms: 'construction straightedge compass bisector trisection',
    },
    {
      id: 'non-euclidean-geometry',
      match: /\bnon-?euclidean\b|\b(hyperbolic|spherical) geometry\b/i,
      name: 'Non-Euclidean geometry',
      is: 'What happens when the parallel postulate is dropped — the discovery that the axioms were a choice.',
      needs: ['geometric-proof', 'circles'],
      terms: 'non euclidean hyperbolic spherical parallel postulate',
    },
  ],
}

const COORDINATE_GEOMETRY: MapArea = {
  id: 'coordinate-geometry',
  name: 'Coordinate geometry',
  covers:
    'Geometry done with algebra: the plane as pairs of numbers, lines and conics as equations, ' +
    'and vectors in two and three dimensions.',
  nodes: [
    {
      id: 'cartesian-plane',
      match: /\bcartesian coordinate|\bcoordinate system\b/i,
      name: 'The Cartesian plane',
      is: 'Pairing a point with two numbers, which is the move that lets every geometric question be asked algebraically.',
      needs: ['real-number-line', 'negative-numbers'],
      terms: 'cartesian coordinates axes quadrant ordered pair',
    },
    {
      id: 'distance-and-midpoint',
      match: /\b(distance formula|euclidean distance|midpoint)\b/i,
      name: 'Distance and midpoint',
      is: 'Pythagoras in coordinates, and the average of coordinates as the midpoint.',
      needs: ['cartesian-plane', 'pythagoras'],
      exercises: ['pythagoras'],
      terms: 'distance formula midpoint coordinate',
    },
    {
      id: 'lines-in-the-plane',
      match: /\b(linear equation|slope|line \(geometry\))\b/i,
      name: 'Lines',
      is: 'Slope as a rate, the three standard forms, and the perpendicularity condition that is not obvious until it is proved.',
      needs: ['distance-and-midpoint', 'linear-functions'],
      terms: 'slope equation of a line perpendicular parallel',
    },
    {
      id: 'circles-analytic',
      name: 'Circles as equations',
      is: 'The circle as a distance condition, which is why completing the square recovers its centre.',
      needs: ['lines-in-the-plane', 'completing-the-square', 'circles'],
      terms: 'equation of a circle centre radius completing the square',
    },
    {
      id: 'conic-sections',
      match: /\bconic section|^(ellipse|hyperbola|parabola)/i,
      name: 'Conic sections',
      is: 'Parabola, ellipse and hyperbola by focus–directrix and as slices of a cone — one family, three appearances.',
      needs: ['circles-analytic', 'quadratic-functions'],
      terms: 'conic parabola ellipse hyperbola focus directrix eccentricity',
    },
    {
      id: 'dot-product-geometry',
      match: /\b(dot product|scalar product|cross product)\b/i,
      name: 'The dot product',
      is: 'A product of two vectors that returns a number, equal to the product of lengths times the cosine — so it measures angle.',
      needs: ['plane-vectors', 'right-triangle-trig'],
      terms: 'dot product scalar product projection angle between vectors',
    },
    {
      id: 'three-dimensional-coordinates',
      match: /\bthree-dimensional space\b/i,
      name: 'Three dimensions',
      is: 'Coordinates, lines and planes in space, where the cross product appears because orientation becomes a question.',
      needs: ['dot-product-geometry', 'solid-geometry'],
      terms: 'three dimensional coordinates plane equation cross product normal',
    },
    /*
     * Three more, because this was the thinnest area on the map at seven nodes
     * and the gaps were not obscure — they were things a reader arrives
     * holding. Each `match` is title-shaped rather than a bare word, because
     * tests/atlas.mjs caps how many concepts one title may claim and a loose
     * pattern burns that budget on prose.
     *
     * Polar coordinates was the obvious fourth and is NOT here: it already
     * exists in the trigonometry area, where it belongs — it is reached
     * through the unit circle, not through the Cartesian plane. The test
     * caught the duplicate, which is what it is for.
     */
    {
      id: 'parametric-curves',
      match: /^parametric (equation|curve)|\bparametrisation\b/i,
      name: 'Parametric curves',
      is: 'Describing a path by where you are at each time rather than by a relation between x and y — which is how a curve that fails the vertical-line test becomes a single function again.',
      needs: ['lines-in-the-plane', 'function-concept'],
      terms: 'parametric equations parameter t path trace curve',
    },
    {
      id: 'plane-transformations',
      match: /\b(translation|rotation|reflection|dilation) (of|in) the plane\b|\bisometr(y|ies)\b/i,
      name: 'Transformations of the plane',
      is: 'Translation, rotation, reflection and scaling as operations on coordinates, and which of them preserve distance — the first place geometry is studied through what leaves a figure unchanged.',
      needs: ['cartesian-plane', 'congruence'],
      terms: 'translation rotation reflection dilation isometry symmetry transformation',
    },
    {
      id: 'loci-and-regions',
      match: /\blocus\b|\bloci\b|\bregion in the plane\b/i,
      name: 'Loci and regions',
      is: 'The set of points satisfying a condition, which is what an equation has always been — and reading an inequality as an area rather than a boundary.',
      needs: ['distance-and-midpoint', 'linear-inequalities'],
      terms: 'locus loci region half plane feasible shaded inequality',
    },
  ],
  links: [
    {
      /**
       * `plane-vectors` was authored into ontology-vectors.ts and left this
       * area, taking its own `needs` with it. Restated here for the reason
       * that is now a pattern: removing a node deletes every edge declared on
       * it, and the first time that happened it made a whole syllabus a root
       * of the map.
       *
       * `dot-product-geometry` above still names `plane-vectors` and needs no
       * help — that edge is declared on the node that stayed.
       */
      from: 'cartesian-plane',
      to: 'plane-vectors',
      because:
        'Components are coordinates read as a displacement, so the plane and its axes have to ' +
        'mean something before a vector can be written as a pair.',
    },
  ],
}

const TRIGONOMETRY: MapArea = {
  id: 'trigonometry',
  name: 'Trigonometry',
  covers:
    'The circular functions from both directions: ratios in a right triangle, and coordinates on ' +
    'the unit circle. Includes identities, the inverse functions, the oblique-triangle laws and ' +
    'polar coordinates.',
  nodes: [
    {
      id: 'right-triangle-trig',
      match: /\b(right triangle|trigonometric (ratio|function)|sine|cosine|tangent)\b/i,
      name: 'Right-triangle ratios',
      is: 'Sine, cosine and tangent as side ratios that depend only on the angle — which is a corollary of similarity.',
      needs: ['similarity', 'pythagoras'],
      terms: 'sine cosine tangent sohcahtoa right triangle ratio',
    },
    {
      id: 'unit-circle',
      match: /\bunit circle\b/i,
      name: 'The unit circle',
      is: 'Redefining the ratios as coordinates on a circle, which is what extends them past 90° and makes them periodic.',
      needs: ['right-triangle-trig', 'circles-analytic'],
      terms: 'unit circle reference angle periodic quadrant signs',
    },
    {
      id: 'radians',
      match: /\bradian\b/i,
      name: 'Radian measure',
      is: 'Angle as arc length on the unit circle — not a convenience but the measure that makes the derivative of sine come out as cosine.',
      needs: ['unit-circle', 'circle-measure'],
      terms: 'radian arc length angle measure degrees conversion',
    },
    {
      id: 'trig-graphs',
      match: /\b(sine wave|sinusoid|periodic function)/i,
      name: 'Graphs of the circular functions',
      is: 'Amplitude, period and phase as the transformations of a graph, applied to a periodic shape.',
      needs: ['radians', 'transformations-of-graphs'],
      terms: 'sine graph amplitude period phase shift asymptote tangent graph',
    },
    {
      id: 'pythagorean-identity',
      match: /\bpythagorean (trigonometric )?identity\b/i,
      name: 'The Pythagorean identity',
      is: 'sin²+cos²=1, which is Pythagoras restated on the unit circle, and the identity every other one is reduced to.',
      needs: ['unit-circle'],
      terms: 'pythagorean identity trigonometric identity',
    },
    {
      id: 'angle-sum-identities',
      match: /\b(angle sum|double[- ]angle|trigonometric identit)/i,
      name: 'Angle sum and double angle',
      is: 'How the circular functions behave under addition of angles — the reason they are not additive and the source of most identities.',
      needs: ['pythagorean-identity'],
      exercises: ['pythagorean-identity'],
      terms: 'angle sum identity double angle half angle product to sum',
    },
    {
      id: 'trig-equations',
      match: /\btrigonometric equation\b/i,
      name: 'Trigonometric equations',
      is: 'Solving for an angle, where periodicity means the answer is a family and not a number.',
      needs: ['angle-sum-identities', 'trig-graphs'],
      terms: 'trigonometric equation general solution principal value',
    },
    {
      id: 'inverse-trig',
      match: /\binverse trigonometric\b/i,
      name: 'Inverse circular functions',
      is: 'Arcsine and its relatives, which exist only because the domain was cut down — and the cut is why the range looks arbitrary.',
      needs: ['trig-equations', 'inverse-functions'],
      terms: 'arcsin arccos arctan inverse trigonometric principal branch',
    },
    {
      id: 'law-of-sines-cosines',
      match: /\blaw of (sines|cosines)\b/i,
      name: 'The laws of sines and cosines',
      is: 'Solving triangles that have no right angle, with the ambiguous case as a genuine two-answer situation rather than a trap.',
      needs: ['right-triangle-trig', 'triangle-basics'],
      terms: 'law of sines law of cosines ambiguous case solving triangles',
    },
    {
      id: 'polar-coordinates',
      match: /\bpolar coordinate\b/i,
      name: 'Polar coordinates',
      is: 'Locating a point by distance and angle, under which some curves become simple and the representation stops being unique.',
      needs: ['radians', 'cartesian-plane'],
      terms: 'polar coordinates r theta polar curve rose cardioid',
    },
    {
      id: 'complex-polar-form',
      name: 'Complex numbers in polar form',
      is: 'Multiplication as adding angles, which turns de Moivre into a one-line fact and roots of unity into a regular polygon.',
      needs: ['polar-coordinates', 'complex-numbers'],
      terms: 'polar form de moivre roots of unity argument modulus',
    },
    {
      id: 'eulers-formula',
      match: /\beuler('|’)?s (formula|identity)\b/i,
      name: "Euler's formula",
      is: 'e^{iθ} = cosθ + i sinθ — the identity that makes the circular and exponential functions the same function.',
      needs: ['complex-polar-form', 'exponential-functions'],
      terms: 'euler formula complex exponential',
    },
    {
      id: 'trig-substitution-setup',
      name: 'Trigonometric form of algebraic expressions',
      is: 'Recognising a²−x², a²+x² and x²−a² as the three shapes a circular substitution simplifies.',
      needs: ['pythagorean-identity', 'radical-equations'],
      terms: 'trigonometric substitution completing the square radical form',
    },
  ],
}

export const FOUNDATION_AREAS: MapArea[] = [
  NUMBER_AND_ARITHMETIC,
  ALGEBRA_FOUNDATIONS,
  FUNCTIONS,
  EUCLIDEAN_GEOMETRY,
  COORDINATE_GEOMETRY,
  TRIGONOMETRY,
]
