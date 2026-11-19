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
    'is where the quotients stop being about a triangle. Everything here is a right triangle; ' +
    'the oblique-triangle laws are this subject\'s next concept and are still mapped only.',
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
]

/**
 * No edges, and that is a fact about the boundary rather than an omission.
 *
 * An authored ontology's edges may only name concepts it contains, or
 * `ontologyProblems` reports an unknown endpoint for every one. This subject
 * holds a single concept, so there is no internal pair to join — and both of
 * that concept's prerequisites, `similarity` and `pythagoras`, are concepts of
 * `plane-geometry`. Being authored in another subject fails the containment
 * test exactly as being unwritten does, so both edges live in
 * `TRIGONOMETRY.links` in atlas-foundations.ts, which is the area that owned
 * the departing node.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between
 * "there are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const TRIANGLE_TRIGONOMETRY: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
