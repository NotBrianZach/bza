/**
 * A ninth subject ontology: the side ratios of a right triangle, and nothing
 * circular.
 *
 * ── Why this concept, and why it was the only one that moved anything ─────
 *
 * `right-triangle-trig` was a map node in `trigonometry`, and it is the only
 * remaining promotion on either unfinished journey that UNBLOCKS something.
 * Eight of the ten shipped journeys have no unwritten step left; the two that
 * do — "See what a matrix does to space" and "When can a linear map be
 * undone?" — cross the same four geometry concepts, and those four are a chain
 * rather than a set:
 *
 *     right-triangle-trig -> dot-product-geometry -> three-dimensional-coordinates
 *                            solid-geometry      ->
 *
 * `dot-product-geometry` needs `plane-vectors`, which is authored, and this
 * concept, which was not. So this node is the sole blocker of the dot product,
 * which with `solid-geometry` is the sole remaining blocker of the three
 * dimensions. Nothing stands behind `solid-geometry` on its own, and the three
 * algebra candidates — `linear-equations`, `systems-of-linear-equations`,
 * `gaussian-elimination` — are blocked on a missing task kind rather than on
 * effort, for the reason ontology-algebra.ts's header gives: "solve for x" asks
 * for a solution SET and no `NamedForm` or `evaluate` target expresses one.
 *
 * ALL THREE ARE AUTHORED NOW, in `expressions-and-equations`, so that clause
 * records a block that was never there: a set cannot be an ANSWER, and the
 * number that DECIDES one is a value. Left as written because it records what
 * this promotion was chosen on, and the choice stands either way — both of this
 * node's prerequisites were written and the dot product was waiting above it.
 *
 * So the readiness test that chose the ten promotions before this one — all
 * prerequisites written, and preferably something waiting above — has exactly
 * one answer here. Both of this node's own prerequisites, `similarity` and
 * `pythagoras`, are authored concepts of `plane-geometry`.
 *
 * The `trigonometry` area is thirteen nodes against a stub floor of five, so
 * the floor that dominated the earlier promotions is not what decided this
 * one. It has stopped being the constraint anywhere on these routes.
 *
 * ── WHY A NINTH SUBJECT RATHER THAN A CONCEPT OF AN EXISTING ONE ──────────
 *
 * The same test ontology-arithmetic.ts and ontology-algebra.ts applied, run
 * against every subject that now exists. Each one declares a boundary in its
 * `covers` that this concept falls outside of:
 *
 *  - `plane-geometry` is the obvious candidate and the id is the refusal: it is
 *    *plane* geometry, and its `covers` is a list of claims about figures in
 *    the plane. A ratio is not a figure. More to the point, this concept's
 *    content is that a quotient of two lengths is a function of an ANGLE, which
 *    is the first thing in the map that measures a figure by something other
 *    than a length or an angle sum.
 *  - `arithmetic-foundations` says "nothing symbolic". A tabulated function of
 *    an angle is not arithmetic.
 *  - `expressions-and-equations` is about what a letter standing for a number
 *    means. `sin A` is a letter standing for a number, but so is every symbol
 *    in mathematics; filing this there would make the subject mean nothing.
 *  - `rational-expressions` starts at polynomial arithmetic, and
 *    `polynomial-arithmetic` is the ROOT of that subject's own view. Filing
 *    this underneath it would gate that root.
 *  - `functions-and-inverses` is the near miss and deserves the paragraph.
 *    Sine IS a function, and this concept's whole content is that it is well
 *    defined. But that subject is about what a function is and how one is
 *    undone, and the sine's inverse is `inverse-trig`, four nodes further up
 *    the map behind the unit circle and periodicity. A concept whose own
 *    inverse is out of reach is a poor member of the subject about inverses.
 *  - `vectors-and-independence` and `matrices-and-determinants` are above this
 *    concept, not beside it: `dot-product-geometry` is exactly the node that
 *    waits on it.
 *
 * So the layer gets its own subject and joins the rest through the area's
 * `links` — the pattern ontology-arithmetic.ts established and ontology-
 * algebra.ts repeated. Each subject keeps a standalone view that is a valid,
 * walkable ontology, and the gates between subjects exist only in the composed
 * map.
 *
 * ONE CONCEPT IS NOT A REASON NOT TO, and the precedent is in the build rather
 * than in an argument: `expressions-and-equations` ships today with exactly one
 * concept and has since it was written. A subject is a boundary, not a volume.
 * What would be wrong is a subject with nowhere to grow, and this one has the
 * most room of any in the build — `law-of-sines-cosines` names this concept and
 * `triangle-basics` as its only needs, so it is the natural second member and
 * is reachable now rather than behind two further promotions.
 *
 * ── THE SUBJECT IS NAMED FOR THE TRIANGLE, WHICH IS A REFUSAL ─────────────
 *
 * `triangle-trigonometry` and not `trigonometry`, which is the area's id and
 * would have claimed the whole of it. Eleven of the thirteen nodes in that
 * area are about the CIRCULAR functions — the unit circle, radians, the
 * identities, the graphs, the inverses, polar form — and none of them is here.
 * They are a different subject that does not exist yet, and they are not
 * reachable from this one: `unit-circle` needs `circles-analytic` as well as
 * this node. Naming the subject for the whole area would have made the
 * `covers` sentence below a promise about material nobody has written.
 *
 * It also matters that no subject id collides with an area id anywhere in the
 * build — `plane-geometry` against `euclidean-geometry`,
 * `expressions-and-equations` against `algebra-foundations`. A collision would
 * put two different things behind one string in `areaOf` and `getOntology`.
 *
 * ── THE FIGURE OBJECTION, WHICH LANDS DIFFERENTLY HERE ────────────────────
 *
 * ontology-geometry.ts has overturned its own "needs a drawing" refusals seven
 * times, and the lesson each time was the same: the part of a node that needs
 * the figure is the part that JUSTIFIES a claim about a figure, and the rest is
 * most of it. Here the objection barely arises, and saying why is worth more
 * than another round of the same test.
 *
 * The content of this concept is not a claim about a drawing at all. It is that
 * a quotient is well defined — that naming one acute angle of a right triangle
 * fixes the quotient of any two of its sides, so the quotient may be given a
 * name and tabulated. That is a statement about similar triangles, and
 * `similarity` is authored. What a learner has to hold is which of three
 * lengths plays which role relative to a NAMED vertex, and that is the same
 * kind of fact as `congruence`'s letter order: settled by matching names, not
 * by looking. A drawing would arguably hurt, for the reason the correspondence
 * point gives — the claim is in the naming, and a picture invites the learner
 * to read "opposite" off the page instead of off the angle they chose.
 *
 * WHAT IS ABSENT, named rather than approximated:
 *
 *   Any angle given in degrees, except 30 and 60. No task here asks for an
 *   angle and no worked example states one, and this is the constraint that
 *   shaped the whole file. The inverse direction — "which angle has this
 *   quotient" — is `inverse-trig`, and the only honest answer at this level is
 *   a rounded decimal from a table, which is a measurement of the angle rather
 *   than the angle. Where an angle IS named here it is 30° or 60°, and those
 *   two are derived rather than looked up: the altitude of an equilateral
 *   triangle splits it into two congruent halves, so the quotient at 30° is
 *   exactly 1/2 with no table consulted.
 *
 *   sin²A + cos²A = 1. It is `pythagorean-identity` on the map, behind
 *   `unit-circle`, and it is tempting here because both quotients of an
 *   8-15-17 triangle are in the second worked example and 64 + 225 = 289 is
 *   one line away. Writing it here would reproduce a node the map has filed
 *   elsewhere, which is the failure ontology-geometry.ts names about SSA: a
 *   concept must not grow content the map has already placed above it.
 *
 *   The law of sines and the law of cosines, which is this subject's own next
 *   concept and is still mapped. Everything here is a RIGHT triangle, and the
 *   `covers` sentence says so.
 *
 * ── THIS TIGHTENS THE GATE, AND THE GATING LIST GETS SHORTER ──────────────
 *
 * Before this file, `gatingPrerequisitesOf` looked straight through
 * `right-triangle-trig` — no material, so no claim about mastery, so no gate.
 * `dot-product-geometry` was therefore gated by `plane-vectors`, `similarity`
 * and `pythagoras` directly. Now there is a concept in between that has to be
 * demonstrated, so the dot product moves one step further from a cold account.
 *
 * The part worth asserting is that the LIST shrank while the gate tightened:
 * three entries became two, because `gatingPrerequisitesOf` names NEAREST
 * authored ancestors and this concept now stands between the dot product and
 * both geometry concepts. A reader who expected a longer list from a stricter
 * gate would read the shorter one as a regression. Both halves are checked by
 * name in tests/atlas.mjs.
 *
 * ── WHY EVERY TASK IS EXACT, AND WHY THAT IS NOT LUCK ─────────────────────
 *
 * Five `evaluate` and one `transform_to_form`, every one settled by exact
 * arithmetic with no worker, like the three subjects before it. That is a
 * consequence of the paragraph on degrees rather than a win that generalises:
 * a quotient of two whole-number sides is rational, and the triples chosen —
 * 3-4-5, 5-12-13, 7-24-25, 8-15-17 — make every quotient in the file an exact
 * fraction. The one irrational quantity, the altitude of the equilateral
 * triangle, is asked for as a reduced surd through `surd_reduced` exactly as
 * `pythagoras` asks for a hypotenuse, because `exactValue` returns null on
 * √3 and correctly so.
 *
 * THE SIDES-AND-ANGLES CONSTRAINT IS WHY THE TRIPLES ARE THERE. A right
 * triangle cannot have three whole-number sides AND whole-number acute angles:
 * the figure would not exist, and nothing in the build would catch it. So each
 * worked example picks one. The first two and the third describe triangles by
 * their SIDES and never state the measure of the acute angle, which is not a
 * whole number of degrees in any of them. The one example that names an angle
 * — 30° in the first point's second task — describes a triangle whose sides are
 * 5, 5√3 and 10, and the irrational side is the content rather than an
 * inconvenience.
 *
 * ── THE SECOND CONCEPT, AND THE RESERVATION IT COLLECTS ───────────────────
 *
 * `law-of-sines-cosines` is the second member, and this subject said it would
 * be. The paragraph above on one concept not being a reason not to split ends
 * "it is the natural second member and is reachable now rather than behind two
 * further promotions", and the `covers` sentence below used to end "the
 * oblique-triangle laws are this subject's next concept and are still mapped
 * only". Two other files reserved it too: ontology-geometry.ts declined to
 * write SSA and said so — "the map has already filed it where it can be done —
 * `law-of-sines-cosines` describes the ambiguous case as its own content" — and
 * ontology-solids.ts measured its own thin headroom against this one, "the
 * ninth subject could point at `law-of-sines-cosines` as a reachable second
 * member; this one has no second member reachable today".
 *
 * Collecting a reservation is worth preferring to the documented selection
 * heuristics for a reason that is structural rather than tidy: the boundary was
 * drawn from the other side FIRST, so the new material cannot overlap the old.
 * Nothing here re-teaches SSA, because the geometry refused it by name and
 * pointed here; and nothing in the first concept was written around this one,
 * because the first concept's `covers` had already declared everything
 * oblique out of scope.
 *
 * ── WHAT THE UNIT CIRCLE OWNS, AND THE TWO DETOURS THAT AVOIDS ────────────
 *
 * The boundary that shaped the first concept — no angles out, nothing circular
 * — binds harder here, because the standard treatment of both laws crosses it
 * twice. Both detours are in the material rather than worked around in silence.
 *
 *  1. THE COSINE LAW'S USUAL PROOF NEEDS sin²A + cos²A = 1, which is
 *     `pythagorean-identity`, a map node behind `unit-circle`. Writing
 *     h = c·sin A and then collecting c²sin²A + c²cos²A is the route every
 *     textbook takes. The proof here writes h² = c² − AD² instead, straight
 *     out of Pythagoras, and the AD² cancels against the (b − AD)² on the
 *     other side — so the identity is never needed and the one trigonometric
 *     substitution left is AD = c·cos A, which is adjacent-over-hypotenuse at
 *     an acute angle and is the first concept's own content. The cancellation
 *     is also the better derivation to teach: the move that makes the proof
 *     work is that one construction serves both halves.
 *
 *     THE THIRD POINT WOULD HAVE CROSSED THE SAME LINE and does not. Its
 *     existence condition is a² > b²(1 − cos²A), and the natural gloss is
 *     "b·sin A, the altitude" — which is the identity again, since
 *     1 − cos²A = sin²A is exactly what the unit circle is for. It is written
 *     as Pythagoras instead: the perpendicular from the far vertex onto the
 *     other arm makes a right triangle with hypotenuse b and one leg b·cos A,
 *     so the perpendicular's SQUARE is b² − b²cos²A directly. Same quantity,
 *     no identity, and the figure explains the formula rather than the formula
 *     being quoted at the figure.
 *
 *  2. cos 90° = 0 AND cos 120° = −1/2 ARE UNIT-CIRCLE FACTS. Right-triangle
 *     ratios are defined for acute angles only, so this concept may not assert
 *     either. What it can do is say what they MEAN in the figure: the
 *     correction term is −2b·AD, and when the angle at A is right the foot of
 *     the perpendicular lands on A itself, so AD = 0 and the term vanishes —
 *     which is Pythagoras, geometrically rather than by quoting a cosine. When
 *     the angle at A is obtuse the foot falls outside the segment and AD is a
 *     length to be added rather than subtracted. That the one formula covers
 *     all three cases with one sign convention is exactly what the unit circle
 *     buys, and the material says so instead of pretending the formula was
 *     always general.
 *
 *     The consequence is the shape of the second knowledge point's example:
 *     its angles are given by their SINES as rational numbers and never in
 *     degrees. That is the first concept's discipline — "sin A = 7/25" with no
 *     angle named — and it is what lets a law-of-sines task be `evaluate` at
 *     all, since the sines of the angles this build can name exactly are 1/2,
 *     √2/2, √3/2 and 1, and a quotient of two of those is rational only when
 *     they are equal.
 *
 * ── THE SIDES-AND-ANGLES CONSTRAINT, GENERALISED OFF THE RIGHT TRIANGLE ───
 *
 * The paragraph above states it for right triangles. The general rule is worth
 * having written down, because this concept's figures are oblique and the
 * right-triangle wording would have forbidden the best of them:
 *
 *   In a triangle with three whole-number sides, every angle has a RATIONAL
 *   cosine, by the cosine law rearranged. An angle that is a whole number of
 *   degrees is a rational multiple of π, and the only rational cosines a
 *   rational multiple of π can have are 0 and ±1/2 — so such an angle must be
 *   90°, 60° or 120°, and nothing else.
 *
 * So 5-7-8 with a 60° angle is a perfectly real figure and 3-7-8 with one is
 * too, while "sides 5, 7, 8 and an angle of 50°" is impossible in exactly the
 * way "three whole sides and whole acute angles" is. Two whole-degree angles
 * at once need two of {90°, 60°, 120°} summing below 180°, which leaves only
 * 60° twice — the equilateral triangle, whose third angle is 60° as well. Every
 * integer triangle in this file therefore names at most one angle, and
 * tests/atlas.mjs checks that by computing all three cosines rather than by
 * reading the prose: the triangle whose task names no angle at all, 25-39-56,
 * has no whole-degree angle to name.
 *
 * ── WHAT THIS ONE DOES NOT DO, STATED SO IT IS NOT LOOKED FOR ─────────────
 *
 * The circumscribed circle. a/sin A is one number for the triangle, and that
 * number is the diameter of the circle through all three vertices — 65 in the
 * second point's example. Saying so needs `circles`, which is authored, AND the
 * inscribed-angle theorem, which `circles` names as absent for the figure
 * reason. So the material establishes that the quotient is ONE number and
 * stops there, which is all the law is used for.
 *
 * Recovering an angle from a side pair. Still absent, still `inverse-trig`,
 * and the third knowledge point is where the absence bites hardest: the
 * textbook route into the ambiguous case is "sin B has two angles below 180°
 * with that sine", which is a sentence about obtuse sines. The route taken
 * instead reaches the same two triangles as the two positive roots of a
 * quadratic in the unknown side, which needs no angle recovered and no sine of
 * an obtuse angle — and which arguably locates the ambiguity better, since it
 * exhibits the two triangles rather than the two angles.
 *
 * ── THE TASKS, AND WHY THE SURD ONE SAT WHERE IT DID ──────────────────────
 *
 * Five more `evaluate` and one more `transform_to_form`, the same split as the
 * first concept and settled the same way, with no worker. The surd task is on
 * the COSINE point rather than the sine point, and that is a fact about the two
 * laws: the cosine law produces a², so a given of `sqrt(76)` is the honest next
 * step of the learner's own work, while the sine law produces a directly and
 * its irrational outputs arrive already reduced.
 *
 * THAT DISTINCTION IS LOAD-BEARING AND WAS FOUND BY TESTING, not reasoned out.
 * `surd_reduced` checks that every radicand is square-free, so the authentic
 * law-of-sines expression `10·√3/√2` PASSES the form check unchanged — both 3
 * and 2 are square-free — and a task with that given rules its own input
 * correct, which is the free mark types.ts warns about under
 * `maxDenominatorDegree`. `sqrt(76)` is refused by the same checker, naming the
 * square 4. So a surd task's given must be a single radical with a square
 * factor in it, and the first concept's `sqrt(75)` was right for a reason its
 * own comment does not give.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'triangle-trigonometry',
  name: 'Triangle trigonometry',
  covers:
    'The side ratios of a RIGHT triangle, and why they are ratios of an angle rather than of a ' +
    'triangle: that naming one acute angle leaves none of the three angles free, so any two ' +
    'right triangles sharing it are similar and share every quotient taken between two of their ' +
    'own sides — which is what lets a quotient be named sin A and tabulated at all, and what ' +
    'lets a quotient read off a 3-4-5 triangle be carried to one whose sides were never given; ' +
    'that the hypotenuse is fixed by the right angle while opposite and adjacent are roles a leg ' +
    'plays relative to the vertex you chose, so the two acute angles of one triangle give the ' +
    'same two quotients with the names traded, which is sin A = cos(90° − A) and not a second ' +
    'fact; and that the relation runs in both directions, the known side deciding whether the ' +
    'other is a multiplication or a division, with the quotient itself bounded below 1 for a ' +
    'sine by Pythagoras and unbounded for a tangent, so an impossible sine can be refused ' +
    'before any arithmetic. The quotients at 30° and 60° are derived here, from the altitude of ' +
    'an equilateral triangle; every other angle would need a table, and no task asks for an ' +
    'angle. Going the other way is absent — "which angle has this quotient" is the inverse ' +
    'functions, which sit four nodes further up behind the unit circle. The Pythagorean ' +
    'identity is absent too, and deliberately: the map files it behind the unit circle, which ' +
    'is where the quotients stop being about a triangle. Then the triangle stops having to ' +
    'carry a right angle: the oblique-triangle laws are here as well, the cosine law as ' +
    'Pythagoras with one correction term whose sign is the acute/right/obtuse verdict, the ' +
    'sine law as the claim that a side over the sine of the angle facing it is one number for ' +
    'the whole triangle, and the ambiguous case as a genuine two-answer situation reached by ' +
    'solving the cosine law as a quadratic in the unknown side. Both laws are proved from the ' +
    'one perpendicular that cuts an oblique triangle into two right ones, so the only ' +
    'trigonometry underneath them is the ratios above. Still no angle is ever asked for, and ' +
    'the circumscribed circle that a/sin A measures is not named: that needs the ' +
    'inscribed-angle theorem, which `circles` declares absent.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'right-triangle-trig',
    name: 'Right-triangle ratios',
    subjectId: subject.id,
    scope: {
      id: 'right-triangle-trig',
      label: 'Right-triangle ratios',
      hint: 'sine cosine tangent sohcahtoa right triangle ratio',
      /*
       * Carried verbatim from the map node this concept was promoted out of,
       * for the reason ontology-algebra.ts gives: the pattern decides against
       * an article title, and widening it during an authoring pass would move
       * the recognition figure in tests/atlas.mjs at the same time as the
       * material appeared, leaving no way to say which edit moved it.
       *
       * It is worth knowing that the `tangent` branch also matches articles
       * about a tangent to a circle, which `circles` is the concept for.
       * Overlap is allowed — two concepts may both be about one offering — and
       * narrowing it is a separate change with its own measurement.
       */
      match: /\b(right triangle|trigonometric (ratio|function)|sine|cosine|tangent)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'carry-a-quotient-between-triangles-that-share-an-angle',
        statement:
          'Given two sides of one right triangle and one side of a second right triangle with the ' +
          'same acute angle, produce the matching side of the second, and name the property of ' +
          'the pair that licenses carrying the quotient across.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'assign-the-three-roles-to-a-named-angle',
        statement:
          'For a named acute angle of a right triangle, say which side is opposite it, which is ' +
          'adjacent and which is the hypotenuse, and produce the quotients the OTHER acute angle ' +
          'gives from the same three lengths.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'run-the-relation-in-the-direction-the-known-side-dictates',
        statement:
          'Decide from which side is given whether recovering the other is a multiplication or a ' +
          'division, produce it, and give a side that Pythagoras leaves irrational exactly as a ' +
          'reduced surd rather than as a decimal.',
        taskKinds: ['evaluate', 'transform_to_form'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-quotient-belongs-to-the-angle-not-to-the-triangle',
        conceptId: 'right-triangle-trig',
        statement:
          'Naming one acute angle of a right triangle leaves none of the three angles free: the ' +
          'right angle is given and the third is 180° less the other two. So any two right ' +
          'triangles with that same acute angle have all three angles equal, which is AA, which ' +
          'makes them similar — and similar figures share every quotient taken between two of ' +
          'their own sides. The quotient opposite-over-hypotenuse is therefore one number ' +
          'determined by the angle and by nothing else about the triangle, which is what lets it ' +
          'be given a name, sin A, and tabulated against the angle.',
        position: 1,
        /*
         * No `automaticityTarget`. The content is an argument about what is
         * determined by what, and the arithmetic in it is one multiplication —
         * a timing target would measure typing, which is the case types.ts
         * names when it argues the field should usually be absent.
         */
        workedExample: {
          problem:
            'One right triangle has the side opposite A equal to 3 and a hypotenuse of 5. A ' +
            'second right triangle also has an angle equal to A, and its hypotenuse is 35. How ' +
            'long is its side opposite A, and what exactly were you allowed to carry across?',
          subgoals: [
            {
              label: 'Count how many angles are still free once A is named',
              detail:
                'None. Each triangle has a right angle, each has A, and the third angle is ' +
                '180° − 90° − A in both. So the two triangles agree on all three angles, which is ' +
                'the AA criterion, so they are similar. Nothing about their sizes was used to get ' +
                'there.',
              socratic:
                'You know one angle of each triangle is A, and you know each has a right angle. ' +
                'How many of the three angles does that leave you free to choose?',
            },
            {
              label: 'Carry the quotient, not the lengths',
              detail:
                'Similarity says the quotient of two sides of one figure equals the quotient of ' +
                'the matching two of the other. In the first triangle that quotient is 3/5. So in ' +
                'the second, opposite-over-35 is also 3/5. The numbers 3 and 5 themselves carry ' +
                'nothing into the second triangle — its sides are seven times as big.',
              socratic:
                'The second triangle\'s sides are not 3 and 5. What is it that the two triangles ' +
                'do share, given that you were told nothing about either one\'s size?',
            },
            {
              label: 'Run the quotient forwards to the missing length',
              detail:
                'The hypotenuse is the side that is known, so the quotient is used in its ' +
                'multiplying direction: opposite = (3/5) × 35 = 21. The second triangle is 21, 28, ' +
                '35 — the first scaled by 7 — and 21 is smaller than 35, as the side opposite an ' +
                'acute angle has to be.',
              socratic:
                'You know the quotient is 3/5 and you know the hypotenuse is 35. Which of ' +
                'multiplying and dividing by 3/5 can possibly give you a length shorter than 35?',
            },
            {
              label: 'Say what the number 3/5 is a function of',
              detail:
                'Of A, and of nothing else. Nothing in 3/5 records how big either triangle was, ' +
                'which is exactly why it can be written in a table against the angle — and that ' +
                'table is what the name sin A refers to. Note also what was never needed: the ' +
                'measure of A in degrees, which is not a whole number here. The quotient pins the ' +
                'angle down more precisely than a rounded degree figure would.',
              socratic:
                'Two triangles of different sizes produced the same 3/5. What would have to ' +
                'change about a right triangle before that number changed?',
            },
          ],
          answer:
            '21. The second triangle is 21, 28, 35 — the first one scaled by 7 — and the only ' +
            'thing carried across is the quotient 3/5, which is fixed by A and by nothing else ' +
            'about either triangle.',
        },
      },
      {
        id: 'opposite-and-adjacent-are-roles-not-sides',
        conceptId: 'right-triangle-trig',
        statement:
          'The hypotenuse is settled before you choose anything: it is the side opposite the ' +
          'right angle. "Opposite" and "adjacent" are not properties of the other two sides — ' +
          'they are roles a leg plays relative to the acute angle you decided to work from. ' +
          'Switch to the other acute angle of the same triangle and the two legs exchange roles, ' +
          'so the same three lengths give sin A = cos B and cos A = sin B. And because the two ' +
          'acute angles add to 90°, that exchange is the whole content of ' +
          'sin A = cos(90° − A) — not a second fact to learn.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem:
            'A right triangle has its right angle at C, legs of 8 and 15, and a hypotenuse of 17. ' +
            'Take A to be the vertex where the sides of length 15 and 17 meet. Write down sin A, ' +
            'cos A, sin B and cos B, and say which of the four are equal and why.',
          subgoals: [
            {
              label: 'Fix the one side that is not a matter of choice',
              detail:
                'The hypotenuse is the side opposite the right angle, so it is 17 whichever acute ' +
                'angle you work from. It appears in the denominator of all four quotients and ' +
                'never moves. The two legs are the sides whose roles are still open.',
              socratic:
                'One of the three sides gets its name before you have chosen any angle to work ' +
                'from. Which one is it, and what names it?',
            },
            {
              label: 'Read the roles off the vertex, not off the lengths',
              detail:
                'A is where 15 and 17 meet. The hypotenuse is 17, so the leg running into A is ' +
                'the one of length 15 — that is the adjacent side. The remaining leg, 8, does not ' +
                'touch A, so it faces it: that is the opposite side. Hence sin A = 8/17 and ' +
                'cos A = 15/17. The number 8 is not "the opposite side"; it is the side opposite A.',
              socratic:
                'The leg of length 15 runs into the vertex A and the leg of length 8 does not. ' +
                'Which of those two is facing A, and which word names the one that touches it?',
            },
            {
              label: 'Switch to B and watch the two legs exchange roles',
              detail:
                'B is the other acute angle. The leg of length 8 runs into B, so there it is the ' +
                'adjacent side; the leg of length 15 faces B, so there it is the opposite one. ' +
                'Hence sin B = 15/17 and cos B = 8/17. The triangle has not changed and neither ' +
                'number has changed — only which vertex you stood at — and two of the four ' +
                'answers are now repeats of the other two.',
              socratic:
                'You have not altered the triangle and you have not altered either leg. What have ' +
                'you altered, and which two of your four answers have you now written twice?',
            },
            {
              label: 'State the exchange as a claim about the angles',
              detail:
                'The three angles total 180° and C is 90°, so A + B = 90° — the two acute angles ' +
                'of a right triangle are always complementary. So B is 90° − A, and sin A = cos B ' +
                'reads sin A = cos(90° − A). It holds for every right triangle because the role ' +
                'exchange does, not because 8, 15 and 17 happen to work.',
              socratic:
                'A and B are not independent of each other. What do they have to add to, and what ' +
                'does that let you write in place of B?',
            },
          ],
          answer:
            'sin A = 8/17, cos A = 15/17, sin B = 15/17, cos B = 8/17. So sin A = cos B and ' +
            'cos A = sin B, because B is the other acute angle and the two legs exchange the roles ' +
            'of opposite and adjacent; and since A + B = 90°, that is sin A = cos(90° − A).',
        },
      },
      {
        id: 'the-relation-runs-both-ways-and-the-sine-is-bounded',
        conceptId: 'right-triangle-trig',
        statement:
          'sin A = opposite/hypotenuse is one equation in two lengths, so a known quotient and ' +
          'either length give the other: the hypotenuse is multiplied DOWN to the opposite side, ' +
          'and the opposite side is divided UP to the hypotenuse. Which operation is right is ' +
          'decided by which side was given, not by the shape of the formula. And the quotient is ' +
          'not free to be anything: c² = a² + b² with b positive forces c > a, so a sine or a ' +
          'cosine of an acute angle lies strictly between 0 and 1 — a claimed sine of 25/7 can ' +
          'be refused before any arithmetic is done. A tangent is a quotient of two legs and has ' +
          'no such ceiling.',
        position: 3,
        automaticityTarget: 20_000,
        workedExample: {
          problem:
            'Two right triangles share the acute angle A, and sin A = 7/25. The first has a ' +
            'hypotenuse of 150; in the second the side opposite A is 56. Find the side that is ' +
            'missing in each, and say what decided whether you multiplied or divided. Then say ' +
            'why no right triangle has sin A = 25/7.',
          subgoals: [
            {
              label: 'Write the relation once, before deciding anything',
              detail:
                'sin A = opposite/hypotenuse, so 7/25 = opposite/hypotenuse in both triangles. ' +
                'That is one equation with two lengths in it, so one of the two has to be given ' +
                'and the other is what the equation is being solved for. Which is which is the ' +
                'only decision in the problem.',
              socratic:
                'You have one equation and two unknown lengths in it. How many of those lengths do ' +
                'you need to be handed before the equation does any work?',
            },
            {
              label: 'Let the known side pick the operation',
              detail:
                'First triangle: the hypotenuse 150 is known, so opposite = (7/25) × 150 = 42. ' +
                'Second triangle: the opposite side 56 is known, so hypotenuse = 56 ÷ (7/25) = ' +
                '56 × 25/7 = 200. The same quotient, used in opposite directions, because the ' +
                'given side was on a different side of the fraction.',
              socratic:
                'In one of these triangles your answer must come out smaller than the number you ' +
                'were given, and in the other larger. Which is which — and what tells you that ' +
                'before you compute either?',
            },
            {
              label: 'Check each answer against the side it came from',
              detail:
                '42 < 150 and 200 > 56, as they must be: the side opposite an acute angle is ' +
                'shorter than the hypotenuse. An answer on the wrong side of the given number is ' +
                'wrong whatever the arithmetic said, which makes this a check you can run without ' +
                'redoing the work. The two triangles are 42, 144, 150 and 56, 192, 200 — the ' +
                '7-24-25 triangle scaled by 6 and by 8.',
              socratic:
                'You now have two lengths in each triangle. Which of the two has to be the bigger, ' +
                'and does each of your answers agree with that?',
            },
            {
              label: 'Read the bound off Pythagoras, and refuse 25/7',
              detail:
                'c² = a² + b² with b > 0 gives c² > a², and both are positive, so c > a > 0 and ' +
                'therefore 0 < a/c < 1. Every sine of an acute angle is less than 1, so ' +
                'sin A = 25/7 describes no right triangle and no arithmetic is needed to say so. ' +
                'The same argument does not touch the tangent, which is a/b: neither leg is forced ' +
                'to be the longer, so a tangent may be anything positive.',
              socratic:
                'c² = a² + b² is a statement about three positive numbers. What does it already ' +
                'tell you about how a/c compares with 1 — and does the same reasoning work on a/b?',
            },
          ],
          answer:
            '42 in the first triangle and 200 in the second. The known side decides the ' +
            'operation: a known hypotenuse is multiplied by the quotient, a known opposite side is ' +
            'divided by it. And sin A = 25/7 is impossible, because c² = a² + b² with b > 0 forces ' +
            'c > a, so opposite-over-hypotenuse is always less than 1 — a bound the tangent does ' +
            'not have.',
        },
      },
    ],
  },
  {
    id: 'law-of-sines-cosines',
    name: 'The laws of sines and cosines',
    subjectId: subject.id,
    scope: {
      id: 'law-of-sines-cosines',
      label: 'The laws of sines and cosines',
      hint: 'law of sines law of cosines ambiguous case solving triangles',
      /*
       * Carried verbatim from the map node, for the reason the concept above
       * gives: widening it during an authoring pass would move the recognition
       * figure in tests/atlas.mjs at the same time as the material appeared,
       * leaving no way to say which edit moved it.
       *
       * The alternation has two branches and tests/atlas.mjs had a row for
       * only one of them. Both are rows now, so dropping either goes red —
       * which is the point of a row per branch.
       */
      match: /\blaw of (sines|cosines)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'produce-the-third-side-from-two-sides-and-the-angle-between-them',
        statement:
          'Given two sides of a triangle and the angle they enclose, produce the side facing ' +
          'that angle — as a whole number when it is one, and as a reduced surd when the ' +
          'cosine law leaves its square without an exact root.',
        taskKinds: ['evaluate', 'transform_to_form'],
      },
      {
        id: 'read-the-corrections-sign-as-the-acute-right-obtuse-verdict',
        statement:
          'Given three sides, produce the cosine of a named angle from them, and use its sign ' +
          'to say whether that angle is narrower than, equal to or wider than a right angle — ' +
          'without recovering the angle itself.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'carry-the-side-over-sine-quotient-between-two-vertices',
        statement:
          'Given a side together with the sine of the angle facing it, produce that quotient, ' +
          'show it is the same number at a second vertex, and use it to produce the side facing ' +
          'a third angle whose sine is known.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-every-third-side-consistent-with-a-non-included-angle',
        statement:
          'Given two sides and an angle NOT between them, produce every third side the data ' +
          'admits, and produce the quantity whose sign decides whether that count is two, one ' +
          'or none.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-cosine-law-is-pythagoras-with-one-correction-term',
        conceptId: 'law-of-sines-cosines',
        statement:
          'Drop the perpendicular from B to the line through A and C. It cuts the triangle into ' +
          'two right triangles that share that perpendicular, so the only tool needed is the ' +
          'one the concept below supplies. Pythagoras in each half, with the shared h² ' +
          'cancelling between them, gives a² = b² + c² − 2bc·cos A: Pythagoras plus one ' +
          'correction term. The term is −2b·AD, where AD is the distance from A to the foot of ' +
          'the perpendicular, so when the angle at A is a right angle the foot lands on A ' +
          'itself, AD is 0, and the correction vanishes — Pythagoras is this law at one angle ' +
          'and not a separate theorem. Rearranged the other way, cos A = (b² + c² − a²)/(2bc), ' +
          'and the SIGN of that quotient is the verdict: positive means a² falls short of ' +
          'b² + c² and the angle is narrower than a right angle, zero means equal, negative ' +
          'means wider. The verdict needs no angle recovered, which is why this concept can ' +
          'give it and cannot give the angle.',
        position: 1,
        /*
         * No `automaticityTarget`. The content is a derivation and a reading of
         * a sign, and the arithmetic in it is three multiplications — the case
         * types.ts names when it says a timing target would measure typing. The
         * point below, which is a substitution into a settled formula, is the
         * one in this concept where speed is part of the skill.
         */
        workedExample: {
          problem:
            'In triangle ABC the two sides meeting at A are b = 5 and c = 8, and the angle at A ' +
            'is 60°. Find a, the side facing A. Then turn the law around: in the triangle with ' +
            'sides 3, 7 and 8, decide whether the angle facing the longest side is narrower ' +
            'than, equal to or wider than a right angle — without finding it.',
          subgoals: [
            {
              label: 'Cut the triangle into two right triangles with one perpendicular',
              detail:
                'Drop the perpendicular from B onto the line through A and C; call its foot D ' +
                'and its length h. Triangles ABD and BDC are both right-angled at D, and both ' +
                'contain h. That single construction is the whole proof, and it is what lets ' +
                'right-triangle ratios — the only ones that exist yet — say anything about a ' +
                'triangle that has no right angle.',
              socratic:
                'Every side relation you have so far is about right triangles, and this ' +
                'triangle is not one. What is the smallest addition to the figure that would ' +
                'give you some to work with?',
            },
            {
              label: 'Write h² from each half and let it cancel',
              detail:
                'Pythagoras in ABD gives h² = c² − AD². Pythagoras in BDC gives a² = h² + DC², ' +
                'and DC is b − AD. Substituting the first into the second: ' +
                'a² = c² − AD² + (b − AD)² = c² − AD² + b² − 2b·AD + AD². The two AD² terms ' +
                'cancel and h is gone, leaving a² = b² + c² − 2b·AD. No fact about the angle ' +
                'has been used yet — this is still pure Pythagoras.',
              socratic:
                'Both halves of the figure contain h, and the relation you want contains no h ' +
                'at all. What does having two expressions for the same h² let you do?',
            },
            {
              label: 'Name AD with the one ratio the angle at A supplies',
              detail:
                'AD is the leg of ABD that runs into A and c is that triangle\'s hypotenuse, so ' +
                'AD = c·cos A — adjacent over hypotenuse, read at the vertex A. Substituting ' +
                'gives a² = b² + c² − 2bc·cos A. Every term is now one of the three things you ' +
                'were given, and the figure\'s own h and AD have both left.',
              socratic:
                'AD is a length in your figure, and the formula is not allowed to keep it. ' +
                'Which of the three facts given at A fixes AD, and through which of the three ' +
                'quotients?',
            },
            {
              label: 'Substitute, and read the correction against Pythagoras',
              detail:
                'cos 60° = 1/2, which the altitude of an equilateral triangle gives with no ' +
                'table consulted. So a² = 25 + 64 − 2·5·8·(1/2) = 89 − 40 = 49, and a = 7. ' +
                'Pythagoras on its own would have claimed a² = 89. The correction took 40 off, ' +
                'and the reason is that 89 is the answer for the triangle whose angle at A has ' +
                'opened all the way to a right angle: closing it to 60° brings B and C nearer ' +
                'together, so the side facing A is shorter.',
              socratic:
                'Pythagoras on 5 and 8 would have given a² = 89 rather than 49. What would it ' +
                'have been assuming about the angle at A, and would that assumption make the ' +
                'facing side longer or shorter than the truth?',
            },
            {
              label: 'Run it backwards, and ask for the sign instead of the angle',
              detail:
                'Rearranged, cos A = (b² + c² − a²)/(2bc). In the triangle 3, 7, 8 the angle ' +
                'facing the 8 has cosine (9 + 49 − 64)/(2·3·7) = −6/42 = −1/7. It is negative, ' +
                'so 64 exceeds 9 + 49 and the angle is wider than a right angle — which is the ' +
                'converse of Pythagoras stated as a comparison rather than as an equality. ' +
                'Naming the angle would need the inverse cosine and that is four nodes up the ' +
                'map; the sign needs only the subtraction, and the sign is what was asked for.',
              socratic:
                'You have worked out that (b² + c² − a²)/(2bc) comes out negative here. What ' +
                'does that tell you about how a² compares with b² + c², and what does the ' +
                'converse of Pythagoras make of that comparison?',
            },
          ],
          answer:
            'a = 7, from 25 + 64 − 40 = 49 — where Pythagoras alone would have said 89, the ' +
            'difference being the correction term 2bc·cos A. And in the triangle 3, 7, 8 the ' +
            'angle facing the 8 has cosine −1/7; it is negative, so that angle is wider than a ' +
            'right angle. The sign settles the verdict without the angle ever being named.',
        },
      },
      {
        id: 'the-ratio-of-a-side-to-the-sine-facing-it-is-one-number',
        conceptId: 'law-of-sines-cosines',
        statement:
          'The same perpendicular proves a second thing, and more cheaply. h is a leg of both ' +
          'right triangles, so reading it in ABD gives h = c·sin A and reading it in BDC gives ' +
          'h = a·sin C. One length, two expressions, so c·sin A = a·sin C, which rearranges to ' +
          'a/sin A = c/sin C. Nothing in that argument singled out the vertex B, so repeating ' +
          'it elsewhere gives b/sin B as well: the quotient of a side by the sine of the angle ' +
          'FACING it is one number belonging to the triangle rather than three numbers ' +
          'belonging to its vertices. Every step pairs a side with its opposite angle, so this ' +
          'law needs one complete pair before it can do anything — and two sides with the angle ' +
          'between them is precisely not that, because the angle given faces the side that is ' +
          'missing. The two laws are not alternatives to choose between; they take different ' +
          'data, and which one applies is decided by the data and not by preference.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem:
            'A triangle has the side a = 39 facing the angle A, and sin A = 3/5. The side ' +
            'c = 56 faces C, and sin C = 56/65. At the third vertex only the sine is known: ' +
            'sin B = 5/13. Check that the side-over-sine quotient really is the same number at ' +
            'A and at C, then use it to find b. Notice as you go that no angle in this problem ' +
            'is named in degrees, and none needs to be.',
          subgoals: [
            {
              label: 'Form the quotient at a vertex where both halves of the pair are known',
              detail:
                'At A the side facing the angle and the sine of the angle are both given, so ' +
                'the quotient can be formed immediately: 39 ÷ 3/5 = 39 × 5/3 = 65. That number ' +
                'is the whole claim. If the law holds, the same 65 has to come back out at the ' +
                'other vertices, from numbers that have nothing in common with these.',
              socratic:
                'The law is about a side divided by the sine of the angle it faces. Of the ' +
                'three vertices here, at which one can you form that quotient without finding ' +
                'anything first, and what does the law then predict about the others?',
            },
            {
              label: 'Form it again at the other complete pair and compare',
              detail:
                '56 ÷ 56/65 = 56 × 65/56 = 65. The same number, out of a longer side and a much ' +
                'larger sine. Nothing in the arithmetic forced that: 39, 3/5, 56 and 56/65 are ' +
                'four independent-looking numbers, and the two quotients agreeing is the ' +
                'theorem rather than a property of this example.',
              socratic:
                'You are about to divide 56 by 56/65, and you already have an answer from the ' +
                'vertex A. Before you do it — what would it mean about the law if the two ' +
                'results disagreed?',
            },
            {
              label: 'Turn the one number onto the vertex where only the sine is known',
              detail:
                'The quotient is 65 everywhere in this triangle, so b ÷ sin B = 65 too, and ' +
                'b = 65 × 5/13 = 25. Written without the 65 it is b = a × sin B ÷ sin A = ' +
                '39 × (5/13) ÷ (3/5) = 25 — the same arithmetic, with the triangle\'s own number ' +
                'never set down. The triangle is 25, 39, 56.',
              socratic:
                'You know the triangle\'s single quotient and you know the sine at B. One of ' +
                'multiplying and dividing gives you a length and the other gives you another ' +
                'quotient. Which is which, and how does the quotient\'s own units tell you?',
            },
            {
              label: 'Say what data this law can take, and what it cannot',
              detail:
                'Look back at what every step used: a side together with the angle facing it. ' +
                'So one complete pair is the entry price, and one further fact about a side or ' +
                'an angle is enough after that. Hand this law two sides and the angle between ' +
                'them instead and it can form nothing — the angle you were given faces the ' +
                'third side, which is the unknown. That case is the point above, and the ' +
                'division of labour between the two laws is exactly this.',
              socratic:
                'Every step here paired a side with the angle opposite it. If somebody handed ' +
                'you two sides and the angle enclosed between them, which of those pairings ' +
                'could you form?',
            },
          ],
          answer:
            'The quotient is 65 at A, from 39 ÷ 3/5, and 65 again at C, from 56 ÷ 56/65 — one ' +
            'number for the triangle. So b = 65 × 5/13 = 25, and the triangle is 25, 39, 56. ' +
            'The law pairs a side with the angle facing it, so it needs one complete pair plus ' +
            'one more fact; two sides and the angle between them is not that data, and that is ' +
            'the cosine law\'s case.',
        },
      },
      {
        id: 'two-sides-and-a-non-included-angle-can-describe-two-triangles',
        conceptId: 'law-of-sines-cosines',
        statement:
          'Hand the cosine law the data that fits neither law neatly and it reports the trouble ' +
          'itself. Suppose the known angle A faces the known side a, and the other known side ' +
          'is b, so the missing side c is one of the two enclosing A. Then ' +
          'a² = b² + c² − 2bc·cos A is a QUADRATIC in c: c² − (2b·cos A)c + (b² − a²) = 0. Two ' +
          'positive roots mean two genuinely different triangles satisfy every number you were ' +
          'given; one root means one triangle; none means no triangle has that data. So "two ' +
          'sides and a non-included angle" is not a method failing — the data really does fail ' +
          'to determine a triangle, and the count of positive roots says by how much. Their ' +
          'product is b² − a², positive only when a < b, and their sum is 2b·cos A, positive ' +
          'only when cos A is — so by the sign rule of the first point, a non-included angle ' +
          'that is wider than a right angle can never be ambiguous.',
        position: 3,
        /*
         * No `automaticityTarget`, and for a different reason from the first
         * point's. Here the arithmetic is real — a quadratic to form, solve and
         * then check twice — but what the point teaches is a JUDGEMENT about
         * how many answers the data has. Timing that would reward guessing the
         * count, which is the one thing the point exists to stop.
         */
        workedExample: {
          problem:
            'A triangle has an angle of 60°, and the side facing that angle is 7. One of the ' +
            'two sides enclosing the angle is 8. Find every possible length for the remaining ' +
            'side, and then say what quantity decided that there was more than one.',
          subgoals: [
            {
              label: 'Write the cosine law around the angle you know and see what is left',
              detail:
                'The 60° angle is at A, so the law reads a² = b² + c² − 2bc·cos A with a = 7, ' +
                'b = 8 and cos A = 1/2. Everything in it is known except c — and c appears both ' +
                'squared and on its own. That is the whole difficulty: this is not a formula to ' +
                'evaluate, it is an equation to solve, and an equation of the second degree can ' +
                'have two answers.',
              socratic:
                'Put a = 7, b = 8 and cos A = 1/2 into a² = b² + c² − 2bc·cos A and look at ' +
                'what remains. How many times does c occur, and at what powers?',
            },
            {
              label: 'Collect it as a quadratic and solve it',
              detail:
                '49 = 64 + c² − 2·8·c·(1/2) = 64 + c² − 8c. Bringing everything to one side, ' +
                'c² − 8c + 15 = 0, which factors as (c − 3)(c − 5) = 0. Both roots are ' +
                'positive, so neither can be dismissed as a length that does not exist: c = 3 ' +
                'and c = 5.',
              socratic:
                'You have 49 = 64 + c² − 8c. Once that is written as something = 0, which two ' +
                'numbers multiply to 15 and add to 8?',
            },
            {
              label: 'Check that both roots really are triangles with the data you were given',
              detail:
                'For the sides 3, 7, 8 the angle facing the 7 has cosine ' +
                '(9 + 64 − 49)/(2·3·8) = 24/48 = 1/2, which is the 60° that was given. For 5, ' +
                '7, 8 it is (25 + 64 − 49)/(2·5·8) = 40/80 = 1/2, the same. Both also satisfy ' +
                'the triangle inequality. So the data genuinely describes two triangles, and ' +
                'they are not the same one relabelled: in 3, 7, 8 the angle facing the 8 has ' +
                'cosine −1/7 and in 5, 7, 8 it has +1/7, so that angle is wider than a right ' +
                'angle in one and narrower in the other.',
              socratic:
                'A quadratic will sometimes hand you a root that satisfies the algebra and ' +
                'describes no figure at all. What would you need to check about 3, 7, 8 and ' +
                'about 5, 7, 8 before believing that both are triangles with a 60° angle facing ' +
                'their side of 7?',
            },
            {
              label: 'Name the quantity that decided the count was two',
              detail:
                'The roots multiply to b² − a² = 64 − 49 = 15 and add to 2b·cos A = 8, so both ' +
                'are positive provided the discriminant is: (2b·cos A)² − 4(b² − a²) > 0, which ' +
                'tidies to a² − b²(1 − cos²A) > 0. Here that is 49 − 48 = 1. And ' +
                'b²(1 − cos²A) has a meaning in the figure: drop the perpendicular from C onto ' +
                'the other arm of the angle, and that right triangle has hypotenuse b and one ' +
                'leg b·cos A, so Pythagoras makes the perpendicular\'s square b² − b²cos²A — ' +
                'exactly the quantity above. The perpendicular is the shortest the facing side ' +
                'could possibly be, so the condition says a has to CLEAR it to give two ' +
                'triangles, falls short of it for none, and passes b for one. Here it clears by ' +
                'the narrowest whole-number margin there is: 49 against 48.',
              socratic:
                'The two roots multiply to b² − a² and add to 2b·cos A. What has to hold of ' +
                'those two numbers, and of the discriminant, before both roots can be positive ' +
                'lengths?',
            },
          ],
          answer:
            'c = 3 or c = 5. The data describes two triangles, 3, 7, 8 and 5, 7, 8, and both ' +
            'really do have a 60° angle facing their side of 7 — one is wider than a right ' +
            'angle at the vertex facing the 8 and the other is narrower. There are two because ' +
            'c² − 8c + 15 = 0 has two positive roots, which needs a < b for the product and ' +
            'a² > b²(1 − cos²A) for the discriminant: 49 against 48, so it clears the ' +
            'perpendicular by 1.',
        },
      },
    ],
  },
]

/**
 * ONE EDGE, AND THE SECOND PROMOTION IS WHY IT COULD EXIST AT ALL.
 *
 * This array was empty while the subject held one concept, and the comment
 * here used to explain that as a fact about the boundary rather than an
 * omission: an authored ontology's edges may only name concepts it CONTAINS,
 * and the single concept's two prerequisites, `similarity` and `pythagoras`,
 * are concepts of `plane-geometry`. Being authored in another subject fails
 * the containment test exactly as being unwritten does, so both of those live
 * in `TRIGONOMETRY.links` in atlas-foundations.ts and still do.
 *
 * `law-of-sines-cosines` declared two `needs` as a map node and they split:
 *
 *   right-triangle-trig   a concept of THIS subject  ->  the edge below
 *   triangle-basics       a concept of plane-geometry ->  TRIGONOMETRY.links
 *
 * So one promotion produced both kinds of rehoming at once, which is the
 * clearest statement of the rule available anywhere in the build: where a
 * stranded edge goes is decided by the FAR endpoint's subject, not by its
 * area, not by whether it is authored, and not by which node declared it.
 * `triangle-basics` is authored, teachable and practisable, and it still
 * cannot be named here.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'right-triangle-trig->law-of-sines-cosines',
    from: 'right-triangle-trig',
    to: 'law-of-sines-cosines',
    kind: 'prerequisite',
    promotedBy: 'author:triangle-trigonometry',
    rationale:
      'Both proofs cut the oblique triangle into two right triangles with one perpendicular ' +
      'and then read a ratio at a vertex of each — AD = c·cos A for the cosine law, ' +
      'h = c·sin A for the sine law. So the ratios are not background for these laws, they ' +
      'are the step the derivation turns on, and a learner who cannot say why ' +
      'adjacent-over-hypotenuse is a function of the angle has no reason to believe either ' +
      'law holds for a triangle whose sides were never given.',
  },
]

export const TRIANGLE_TRIGONOMETRY: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
