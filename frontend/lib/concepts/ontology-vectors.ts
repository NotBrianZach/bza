/**
 * A sixth subject: the plane, vectors, spans, and when a description is
 * redundant.
 *
 * ── This one goes UNDERNEATH, so it tightens the gate ─────────────────────
 *
 * The last two subjects were authored above the algebra and gated only
 * mapped-only material. This one sits below `matrices-and-determinants`,
 * which is teachable — `matrices-and-maps` rests on `vectors-and-spans` by a
 * link written when matrices was authored. So making these concepts teachable
 * puts a real gate under a subject people can already practise, exactly as
 * arithmetic did to the algebra.
 *
 * That is correct and it is the design working (gating tightens, never
 * loosens, as material is authored), but it has a consequence worth stating:
 * ANYBODY MID-WAY THROUGH MATRICES IS NOW GATED BEHIND VECTORS THEY HAVE NOT
 * DONE. The claim path is the answer — these are four concepts, claimable in
 * one press from the graph — and the alternative, leaving the foundation
 * unwritten so nobody is inconvenienced, is how a map stays a map for ever.
 *
 * ── THE PLANE ARRIVED LATER, PROMOTED OUT OF THE MAP ──────────────────────
 *
 * `cartesian-plane` was a node of `coordinate-geometry` in atlas-foundations.ts
 * and is now the first concept below. It joined THIS subject rather than
 * becoming a subject of its own, and the reason is worth stating because the
 * alternative was tempting: a one-concept ontology would have been a smaller
 * edit, and it would have put the plane in a syllabus nobody arrives at. The
 * subject it belongs to is the one that reads coordinates off it.
 *
 * Joining here also moved an edge out of the map. `coordinate-geometry.links`
 * carried `cartesian-plane → plane-vectors`, because a `links` entry is for an
 * edge the area does not own both ends of, and before the promotion the
 * authored end was `plane-vectors`. Both ends are now concepts of this
 * ontology, so the edge is declared below as a plain prerequisite and the
 * `links` entry is gone — the one case where promoting a node makes the map
 * simpler rather than stranding something. The two edges INTO the plane went
 * the other way: at the time `real-number-line` was still a map node and
 * `negative-numbers` was authored in a different subject, so neither could be
 * named from here and both had to become `links`. `real-number-line` has since
 * been authored too, in `arithmetic-foundations` alongside `negative-numbers`,
 * which changes the reason for its entry and not its home — an ontology may
 * only name concepts it contains, and this one contains neither. Both are
 * still `links`, and the note in atlas-foundations.ts says so.
 *
 * It tightened the gate one step further down, and this time on material
 * authored in this very file: `plane-vectors` used to gate on
 * `roots-and-irrationals` and `decimal-representation`, because
 * `gatingPrerequisitesOf` looked through the unwritten plane and the unwritten
 * real line to the nearest teachable ancestors. It now gates on the plane
 * itself, which is both nearer and the right answer.
 *
 * No `encompasses` edge from `plane-vectors` back down to it, and that is a
 * judgement rather than an omission. The claim such an edge makes is about what
 * PRACTISING exercises, and measured against the three vector tasks that exist
 * it does not hold: they are handed components as numbers and never locate a
 * point, decide a quadrant, or subtract the coordinates of two points. The
 * same test was applied to `gcd-and-lcm`'s `exercises` claim when arithmetic
 * was authored, and failed there too.
 *
 * ── THE DOT PRODUCT ARRIVED FIFTH, AND THIS FILE HAD REFUSED IT ───────────
 *
 * This header used to carry a section called "Why these and not the dot
 * product", and the refusal it made was: the half worth teaching is
 * `a·b = |a||b|cos θ`, the components half is checkable arithmetic, "the
 * cosine half needs trigonometry this build cannot rule", and writing only the
 * arithmetic would teach the formula while dropping the reason anybody cares
 * about it. The last clause is still right and is why the concept is shaped the
 * way it is. The clause in quotation marks had TWO readings and only one of
 * them was ever true, which is the useful part of the record:
 *
 *   The CURRICULUM reading — no concept in the build gives `cos θ` a meaning —
 *   was true when it was written and has expired. `right-triangle-trig` is
 *   authored now, as the `triangle-trigonometry` subject, and its whole content
 *   is that a quotient of two sides is a well-defined function of an angle. So
 *   there is somewhere for the cosine in the identity to come FROM.
 *
 *   The ENGINE reading — nothing here can rule a trigonometric value — is
 *   still true and was never the obstacle, because the identity does not ask
 *   anybody to evaluate a cosine. It asks for one: `cos θ = (a·b)/(|a||b|)`
 *   hands the cosine back as a quotient of things the components already give,
 *   and for `a = (3, 4)`, `b = (4, 3)` that quotient is exactly 24/25. No
 *   table is consulted and no worker is needed.
 *
 * So the sentence that had looked like one blocker was one expired fact and one
 * irrelevant one. The lesson is narrow and worth having: a refusal written
 * about an ENGINE limit should name which direction the limit runs in. Evaluating
 * `cos 16°` is out of reach; producing the cosine of the angle between two
 * named vectors is arithmetic.
 *
 * WHAT STAYS OUT, and it is the same boundary `right-triangle-trig` drew: the
 * ANGLE. 24/25 is the answer and 16.26° is a rounding of it, so nothing here
 * asks for a figure in degrees — recovering an angle from its cosine is
 * `inverse-trig`, four nodes up behind the unit circle. The one angle that IS
 * named is the right angle, and it is named exactly, because `a·b = 0` needs no
 * table: it is the converse of Pythagoras applied to the triangle the two
 * arrows make. That case is not stated here, it is PROVED, and both halves of
 * the proof — `pythagoras` and its converse — are authored concepts of
 * `plane-geometry`.
 *
 * The general identity is proved too, and without the law of cosines, which is
 * the usual route and is still mapped (`law-of-sines-cosines`). Splitting `b`
 * into the part along `a` and the part across it needs only the span of one
 * vector, the perpendicularity criterion, and adjacent-over-hypotenuse — one
 * fact from each of the three concepts underneath it. That the standard proof
 * is unavailable and a second one is not is why this node turned out writable
 * at all.
 *
 * ── WHY IT JOINED THIS SUBJECT RATHER THAN BECOMING A TENTH ───────────────
 *
 * The three subjects before it each argued for a new ontology because every
 * existing `covers` declared a boundary the concept fell outside. Here exactly
 * one did — this file's own, which said "nothing about the dot product or
 * angles" — and the REASON that sentence gave has expired, as above. A boundary
 * sentence whose justification has gone is a sentence to rewrite, not a sentence
 * to work around by filing a vector operation somewhere else. The id helps say
 * so: `vectors-and-independence` is not `vectors-without-angles`, and the dot
 * product is a vector operation before it is anything about triangles.
 *
 * `three-dimensional-coordinates` is still mapped, and now for only half the
 * reason it was: it rests on the dot product, which is written, and on
 * `solid-geometry`, which is not.
 *
 * ── AND THEN IT WAS WRITTEN, WHICH IS THE THIRTEENTH PROMOTION ────────────
 *
 * The sentence above has expired and is kept because the prediction in it came
 * true: `solid-geometry` is an authored concept of `solid-measure` now, the
 * twelfth promotion, and that was the whole of what
 * `three-dimensional-coordinates` was waiting for. It is the sixth concept
 * below.
 *
 * It was the ONLY concept left unwritten on either unfinished journey that is
 * also unblocked — recomputed from the tree rather than taken from a list, as
 * `[dest, ...allPrerequisitesOf(M, dest)].filter(id => !isTeachable(M, id))`
 * per destination. That returned two ids: this one, which both routes cross,
 * and `gaussian-elimination`, which only the longer one crosses and which is
 * blocked on a missing task kind rather than on effort (ontology-algebra.ts's
 * header: "solve for x" asks for a solution SET and no `NamedForm` expresses
 * one). So writing this one finishes "See what a matrix does to space"
 * outright — the ninth of ten journeys to have no unwritten step — and leaves
 * the tenth owing exactly one.
 *
 * THE TENTH OWES NOTHING NOW, AND THE PARENTHESIS ABOVE IS WHY THIS NOTE IS
 * HERE. `gaussian-elimination` was not blocked on a missing task kind; it is
 * an authored concept of `expressions-and-equations`, written one promotion
 * after this one, and the refusal quoted in that parenthesis had already been
 * withdrawn twice in the file it cites. The sentence to distrust is "asks for a
 * solution SET and no `NamedForm` expresses one" — true, and never the reason a
 * concept cannot be authored, because the number that DECIDES the set is a
 * value. Left as written because it records the information this promotion was
 * chosen on, and the choice was right either way: this concept finished a
 * journey outright and that one did not.
 *
 * ── WHY HERE, WHICH WAS DECIDED IN WRITING BEFORE IT WAS WRITTEN ──────────
 *
 * ontology-solids.ts argued it while declining it: the node "is analytic —
 * coordinates, lines and planes in space, and the cross product — so it is a
 * better fit for `vectors-and-independence`, which already owns the plane and
 * the dot product", and `solid-measure` "would have to be renamed to take it".
 * tests/atlas.mjs says the same thing in its route table. So this was a
 * recorded recommendation rather than an open question, and the work was to
 * check the premise rather than to re-argue it.
 *
 * The premise holds three ways. TWO OF ITS THREE PREREQUISITES ARE CONCEPTS OF
 * THIS FILE — `dot-product-geometry` by its own `needs`, and `vectors-and-spans`
 * by the edge discussed below — so no other subject is even adjacent to it.
 * ITS CONTENT IS THIS SUBJECT'S CONTENT WITH A TERM ADDED: a magnitude is still
 * a·a under a root, a right angle is still a zero product, and the cross product
 * is the plane's own independence test having outgrown being a single number.
 * AND THIS SUBJECT'S OWN SCOPE ALREADY REACHED INTO IT — `dot-product-geometry`
 * matches articles titled for the cross product, and the comment on that
 * pattern says so and names this node as where the cross product is filed.
 *
 * The id helps again, as it did for the dot product. `vectors-and-independence`
 * is not `vectors-in-the-plane`, and the strongest evidence that the subject
 * was never meant to stop at two coordinates is the rationale on the edge that
 * came home: span "is stated for vectors in any dimension". That sentence was
 * written by somebody filing this node OUTSIDE this subject, and it is an
 * argument for filing it inside.
 *
 * SO THE `covers` WAS REWRITTEN AND SO WAS THE SUBJECT'S NAME, and the name is
 * the part worth flagging. `covers` ended with "Nothing in three dimensions, so
 * no cross product", which is the same shape of expired boundary the dot
 * product rewrote and the same remedy. The NAME was "The plane, vectors and
 * independence", and that is a boundary too — the one place the subject still
 * claimed a floor it no longer has — so it is now "Vectors, independence and
 * space". A `covers` rewritten under a name that contradicts it would be worse
 * than either alone. The ID did NOT change and must not: `areaOf` returns a
 * subject id for an authored concept, and every edge, test and stored strength
 * in the build names it.
 *
 * ── THE SIX KNOWLEDGE POINTS THAT ARE NOT HERE, AND ONE THAT IS ───────────
 *
 * FOUR POINTS RATHER THAN THE THREE EVERY OTHER CONCEPT IN THIS FILE CARRIES,
 * and the extra one is the `is` line being paid rather than padding. That line
 * promises "coordinates, lines and planes in space, where the cross product
 * appears because orientation becomes a question", which is three deliverables
 * and a reason, and the arithmetic bridge has to come first or none of them can
 * be computed. So: the third coordinate and the term it adds, what survives it
 * and what does not, one equation as a plane, and the cross product.
 *
 * LINES IN SPACE ARE A PARAGRAPH AND NOT A POINT, which is the one place this
 * concept delivers less than its `is` line says — stated here rather than left
 * to be discovered, the way ontology-solids.ts stated its own shortfall. The
 * useful half is cheap and is in the plane point's last subgoal: three
 * coordinates less one equation leaves two freedoms, so one equation is a
 * SURFACE, and a line is one freedom and therefore needs two equations or a
 * parameter. The expensive half is the parametric form r = r₀ + t·d, and it
 * wants a task kind that can rule "for which t". `parametric-curves` is the
 * node that owns it and it is still mapped.
 *
 * This used to call that "the same gap that blocks `gaussian-elimination`", and
 * the comparison was wrong twice over: that concept is authored now, and the
 * gap was never the same one. A parametric form asks for the t at which a
 * condition holds, which is a solve whose answer is a set with no finite list
 * of deciding numbers behind it — the shape `linear-inequalities` is blocked by.
 * Row reduction's answers were values all along.
 *
 * THE SPHERE IS NOT HERE EITHER, and that is the new `covers` boundary rather
 * than an omission: x² + y² + z² = r² is one equation in three unknowns and so
 * is a surface by the count this concept teaches, but nothing curved is in this
 * subject and the distance formula is all it would borrow.
 *
 * ── THE EDGE THAT COULD NOT COME WITH IT ──────────────────────────────────
 *
 * The node declared two `needs`. `plane-vectors` is a concept of this
 * ontology, so that edge is declared below in `EDGES` like any other. The other
 * is `right-triangle-trig`, which is authored in `triangle-trigonometry` — and
 * an ontology's edges may only name concepts it CONTAINS, so being authored in
 * another subject fails that test exactly as being unwritten would. It is a
 * `links` entry of `EUCLIDEAN_GEOMETRY` in atlas-foundations.ts, filed in the
 * area that owned the departing node rather than in the one holding the other
 * end. It gates immediately, because that endpoint has material: a learner has
 * to demonstrate the ratios before the dot product.
 *
 * ── THE THIRTEENTH PROMOTION'S EDGES, INCLUDING ONE COMING BACK ───────────
 *
 * Three edges touched this node and they went three different ways, which is
 * the whole catalogue of what a promotion can do to an edge and is why they are
 * listed rather than summarised.
 *
 * STRANDED AND REHOMED HERE. `dot-product-geometry → three-dimensional-
 * coordinates` was declared on the node's own `needs`, so deleting the node
 * deleted it. Both ends are concepts of this ontology, so it is an ordinary
 * `EDGES` entry below.
 *
 * STRANDED AND REHOMED TO THE MAP. `solid-geometry → three-dimensional-
 * coordinates` was the node's other `needs`, and `solid-geometry` is a concept
 * of `solid-measure`. An ontology may only name concepts it CONTAINS, so being
 * authored in another subject fails that test exactly as being unwritten would,
 * and it is a `links` entry of `EUCLIDEAN_GEOMETRY` in atlas-foundations.ts —
 * filed in the area that owned the departing node. It gates from the moment it
 * exists, both ends having material.
 *
 * AND ONE HANDED BACK, WHICH IS THE CASE NO TEST CATCHES.
 * `three-dimensional-coordinates → vectors-and-spans` was a `links` entry of
 * `linear-algebra` in atlas-structures.ts, because that area owned neither end.
 * This promotion puts BOTH ends in this ontology, so the edge is declared below
 * as a plain prerequisite and the `links` entry is deleted. Leaving it would
 * not have failed anything: `links` never cared whether an end was a node or a
 * concept, so the entry would have gone on resolving and the composed graph
 * would have carried the edge twice, which `composeAtlas` does not notice and
 * no suite checks. It is the second time this file has had an edge come home —
 * `cartesian-plane → plane-vectors` was the first — and both times the thing
 * that made it safe was looking at what the far end's file said rather than at
 * whether the suites went green.
 *
 * Note the DIRECTION, because the prose in atlas-structures.ts reads the other
 * way round at a glance and the edge is load-bearing: the three dimensions gate
 * SPAN, not the reverse. So this concept lands in the middle of the subject
 * rather than on the end of it, and file order below is no longer teaching
 * order — `teachingOrder` computes the walk and the array is append-only.
 *
 * NOTHING ELSE MOVED. `three-dimensional-coordinates → functions-of-several-
 * variables` is declared on the `functions-of-several-variables` node's own
 * `needs` in atlas-analysis.ts, at the far end, so it survives untouched and
 * resolves across the file boundary. AND THE NODE DECLARED NO `confusedWith` —
 * checked on the node before it was deleted rather than inferred from the
 * suites passing afterwards, because `expandEdges` turns one into an
 * `interferes_with`, interference constrains SELECTION rather than gating, and
 * dropping one leaves every suite green.
 *
 * WHAT THE GATE DID, which is the measurement worth keeping. `vectors-and-spans`
 * was gated by `plane-vectors`, `dot-product-geometry` and `solid-geometry`:
 * `gatingPrerequisitesOf` names NEAREST authored ancestors and the walk passed
 * straight through the unwritten node to the two behind it. It is now gated by
 * `plane-vectors` and this concept — three entries replaced by two. The gate
 * TIGHTENED and the list SHRANK, which is the reading a count gets backwards.
 *
 * ── The determinant appears here, as a check, without an edge ─────────────
 *
 * Two vectors in the plane are dependent exactly when a₁b₂ − a₂b₁ = 0, which
 * is the determinant of the matrix with them as columns. It is taught here —
 * it is the only practical independence test at this size — but NO
 * prerequisite edge is drawn to `determinant`, and the omission is deliberate
 * rather than an oversight.
 *
 * Drawing one would make a cycle: `vectors-and-spans` gates
 * `matrices-and-maps`, which gates `matrix-multiplication`, which gates
 * `determinant`. An edge back from `determinant` to `linear-independence`
 * closes the loop, and `teachingOrder` returns null on a cyclic ontology
 * rather than a partial order — the whole curriculum would stop having an
 * order, to record a connection that is really just foreshadowing.
 *
 * So the worked example says plainly that this is the determinant and that it
 * is met properly later. A cross-reference in prose costs nothing; a cycle in
 * the graph costs the ordering of every subject.
 *
 * ── THE AXIOMS ARRIVED SEVENTH, FROM A THIRD MAP FILE ────────────────────
 *
 * `vector-spaces` was the root node of `linear-algebra` in atlas-structures.ts
 * and is the last concept below. It is the twentieth promotion, and the first
 * thing to say about it is that it was chosen on a different criterion from the
 * last several: no journey needed it, no area was near the stub floor, and
 * about nineteen map nodes had every prerequisite written. What decided it was
 * that the node was the SOLE ROOT of a ten-node area — every other node there
 * reaches it — so the whole of linear algebra was gated behind one unwritten
 * concept, and `gatingPrerequisitesOf` was answering for it by naming what IT
 * rested on, two subjects away.
 *
 * WHY HERE. Its only `needs` is `linear-independence`, a concept of this file,
 * and that is also the content argument rather than merely the cheap one: the
 * axioms are the list of facts the span and independence arguments turned out
 * to have used, so the subject that made those arguments is the one the summary
 * belongs to. The alternative was a new ontology for abstract linear algebra,
 * and the `covers` test the three subject-creating promotions used does not
 * pass here — nothing in this file's boundary sentences excluded it. It said
 * "components throughout", which is a statement about how the material is
 * COMPUTED and still true: every task below is componentwise arithmetic.
 *
 * WHAT IT DELIBERATELY DOES NOT DO is name a dimension. Counting independent
 * directions is `basis-and-dimension`, the node directly above it, and the one
 * place this concept points forward is the last subgoal of its first point —
 * function spaces obey every rule and have no finite component list, which is
 * the question dimension exists to answer. Writing the count here would have
 * taken the node above it as well, on material that wants a theorem (every
 * basis of a space has the same size) rather than a check.
 *
 * ONE EDGE, NO `links`, AND A REFUSAL. The single stranded prerequisite is an
 * ordinary `EDGES` entry, both ends being concepts of this ontology; the two
 * edges INTO the node are declared at their far ends on nodes that remain, so
 * they survive untouched. The node declared no `confusedWith` and no
 * `exercises` — checked on it before deletion rather than inferred from the
 * suites passing afterwards, since `expandEdges` turns a `confusedWith` into an
 * `interferes_with`, interference constrains SELECTION rather than gating, and
 * losing one leaves every suite green. The refusal is the `encompasses` edge,
 * for the third time in this file; the note beside `EDGES` gives the precedent
 * that settles it.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'vectors-and-independence',
  name: 'Vectors, independence and space',
  covers:
    'The plane as pairs of numbers, then vectors as displacements across it, linear ' +
    'combinations and span, the condition that makes a set of them non-redundant, and the one ' +
    'product of two vectors that returns a number — so that a length is a dot product, a right ' +
    'angle is a zero one, and the sign of one separates acute from obtuse without a cosine ' +
    'being computed at all. Components throughout, and now three of them: a third axis adds a ' +
    'term to every sum and takes nothing away, one linear equation stops being a line and ' +
    'becomes a plane whose coefficients are its own normal vector, and the independence test ' +
    'stops being a number and becomes the cross product — because in space which of the two ' +
    'perpendicular directions you mean is a choice the geometry does not make for you. The ' +
    'ANGLE is absent and deliberately: the identity hands back cos θ as an exact quotient and ' +
    'that quotient is the answer, while turning a cosine into a figure in degrees needs a table ' +
    'and is the inverse functions, which are not written. Lines in space are counted and not ' +
    'parametrised, and nothing is curved — no spheres, and no surface that is not a plane. ' +
    'It ends by naming the rules the rest of it used: the axioms, the three-part test for a ' +
    'subset that is a space in its own right, and two sets that fail it in different ways — ' +
    'which is what lets a polynomial and a function be vectors with no argument made twice. ' +
    'Not the DIMENSION of a space, which is the count of independent directions and the first ' +
    'thing the map asks after this.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'cartesian-plane',
    name: 'The Cartesian plane',
    subjectId: subject.id,
    scope: {
      id: 'cartesian-plane',
      label: 'The Cartesian plane',
      hint: 'cartesian coordinates axes quadrant ordered pair',
      // Carried over unchanged from the map node. It was written title-shaped
      // and already passes the over-broad check in tests/atlas.mjs, so the
      // promotion is not the moment to start editing it — `/coordinate/i`
      // would claim every coordinate-geometry article on the map.
      match: /\bcartesian coordinate|\bcoordinate system\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-point-from-its-pair',
        statement:
          'Name the point a pair of numbers refers to, say which quadrant it is in from the ' +
          'signs alone, and say why swapping the entries moves it.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'measure-with-coordinates',
        statement:
          'Find the horizontal and vertical separation of two points, and say what the sign of ' +
          'a difference records that its size does not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-point-is-an-ordered-pair',
        conceptId: 'cartesian-plane',
        statement:
          'Two number lines crossing at a shared zero turn a point into a pair of numbers: how ' +
          'far across, then how far up. The pair is ORDERED, so (3, 5) and (5, 3) are different ' +
          'points — and that convention is most of the content of the idea, because it is what ' +
          'makes "the point" and "the numbers" interchangeable.',
        position: 1,
        // No automaticity target. This point is the distinction between a pair
        // and a set, and answering it fast is not the skill.
        workedExample: {
          problem:
            'P = (3, 5) and Q = (5, 3). Show they are different points by evaluating the ' +
            'difference of their first coordinates.',
          subgoals: [
            {
              label: 'Read each pair in the agreed order',
              detail:
                'The first entry is the distance across, the second the distance up. So P is 3 ' +
                'across and 5 up, and Q is 5 across and 3 up.',
              socratic:
                'Both of these points are built from a 3 and a 5. What has to be agreed about ' +
                'those two numbers before either pair refers to anywhere at all?',
            },
            {
              label: 'Compare one coordinate',
              detail: 'The first coordinates are 3 and 5, and 3 − 5 = −2.',
              socratic:
                'There are four numbers in front of you and two points to tell apart. Which ' +
                'single comparison is already enough to decide it, and what does that ' +
                'comparison come to?',
            },
            {
              label: 'What one disagreement proves',
              detail:
                'Two points are equal only when BOTH coordinates agree, so one disagreement ' +
                'settles it: −2 ≠ 0, so P ≠ Q. P sits left of Q and higher up — the swap moved ' +
                'the point rather than renaming it.',
              socratic:
                'Your difference is not zero, and you have not looked at the second ' +
                'coordinates yet. How much of the comparison is still outstanding, and why?',
            },
          ],
          answer: '−2 — non-zero, so P and Q are different points',
        },
      },
      {
        id: 'the-signs-name-the-quadrant',
        conceptId: 'cartesian-plane',
        statement:
          'The axes cut the plane into four quadrants, and which one a point is in is decided by ' +
          'the signs of its coordinates and nothing else. This is the first time a question ' +
          'about where something IS gets answered by looking at an expression instead of at a ' +
          'picture.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Which quadrant is P = (−4, 7) in? Start from the product of its coordinates.',
          subgoals: [
            {
              label: 'Multiply the coordinates to compare their signs',
              detail:
                '(−4)(7) = −28. A negative product means the two coordinates have opposite ' +
                'signs; a positive one would mean they agree.',
              socratic:
                'You want to know whether these two coordinates agree in sign. Which single ' +
                'operation on the pair answers that without telling you anything about their ' +
                'sizes, and what sign does it return here?',
            },
            {
              label: 'Opposite signs leaves two quadrants, not one',
              detail:
                'Opposite signs rule out quadrant I, which is (+, +), and quadrant III, which ' +
                'is (−, −). That leaves II at (−, +) and IV at (+, −). The product has halved ' +
                'the question and cannot finish it.',
              socratic:
                'The product says the signs differ. Of the four quadrants, how many are still ' +
                'possible — and what is it about a single product that stops it narrowing ' +
                'things any further?',
            },
            {
              label: 'Either coordinate alone decides between the two',
              detail:
                'The second coordinate is 7, which is positive, so P is above the horizontal ' +
                'axis: quadrant II. The first coordinate settles it the same way, being −4 and ' +
                'so left of the vertical axis.',
              socratic:
                'Quadrants II and IV sit on opposite sides of the horizontal axis. Which of ' +
                "P's two numbers tells you which side it is on, and what does it say?",
            },
            {
              label: 'Why nothing was plotted',
              detail:
                'The region was decided by the signs of a pair of numbers. That is the trade ' +
                'the plane offers in both directions — a geometric question becomes an ' +
                'arithmetic one, and the arithmetic does not care how large the numbers are.',
              socratic:
                'You named the region without drawing anything. What did you read instead — and ' +
                'what does that let you do with a point whose coordinates are far too large to ' +
                'fit on a page?',
            },
          ],
          answer: 'Quadrant II — the product −28 shows the signs differ, and the positive second coordinate picks II over IV',
        },
      },
      {
        id: 'separation-is-one-axis-at-a-time',
        conceptId: 'cartesian-plane',
        statement:
          'The horizontal gap between two points is the difference of their first coordinates, ' +
          'and the vertical gap is the difference of their seconds. The two axes never interfere, ' +
          'which is why a position in the plane can be handled as two independent numbers — and ' +
          'it is the same bookkeeping the next concept calls components.',
        position: 3,
        automaticityTarget: 15_000,
        workedExample: {
          problem:
            'P = (−4, 7) and Q = (2, 7). Find the horizontal separation of P and Q by evaluating ' +
            'the difference of the first coordinates.',
          subgoals: [
            {
              label: 'Subtract the first coordinates',
              detail: '2 − (−4) = 2 + 4 = 6, so the horizontal separation is 6.',
              socratic:
                'The two points sit at −4 and at 2 along the horizontal axis, so the gap ' +
                'between them crosses zero. What does subtracting a negative do to the ' +
                'arithmetic, and what gap does it leave you with?',
            },
            {
              label: 'Do the other axis separately',
              detail: '7 − 7 = 0. There is no vertical gap at all — both points are the same height.',
              socratic:
                'Now the second coordinates, which are both 7. What does their difference come ' +
                'to, and what does that tell you about how the two points sit relative to the ' +
                'horizontal axis?',
            },
            {
              label: 'Read the two numbers together',
              detail:
                'Six across and nothing up: P and Q lie on one horizontal line, 6 apart. The ' +
                'distance between the points is 6 only BECAUSE the vertical gap vanished; with ' +
                'both gaps non-zero the two numbers would not combine by addition, which is ' +
                'what the next concept needs Pythagoras for.',
              socratic:
                'You have two gaps now, one across and one up. What is the distance between the ' +
                'points themselves, and what would have gone wrong with reading it off a single ' +
                'one of those numbers if the vertical gap had come to 3 instead of 0?',
            },
            {
              label: 'The order of subtraction is a sign, not a mistake',
              detail:
                '−4 − 2 = −6 rather than 6. The size is the separation either way; the sign ' +
                'records which direction you travelled. Keeping it is what turns a gap into a ' +
                'displacement, and a displacement is exactly what the next concept calls a ' +
                'component.',
              socratic:
                'Subtracting the other way round gives −6, and both answers describe the same ' +
                'pair of points. What is the minus sign carrying that a bare distance does not?',
            },
          ],
          answer: '6',
        },
      },
    ],
  },

  {
    id: 'plane-vectors',
    name: 'Vectors in the plane',
    subjectId: subject.id,
    scope: {
      id: 'plane-vectors',
      label: 'Vectors in the plane',
      hint: 'vector displacement components magnitude tip to tail scalar multiple',
      match: /\b(vector|displacement|tip[- ]to[- ]tail|magnitude|components?|scalar multiple)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-with-components',
        statement:
          'Add and scale vectors by components, find a magnitude, and say why a vector is not a ' +
          'point.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-vector-is-a-displacement',
        conceptId: 'plane-vectors',
        statement:
          'A vector has a length and a direction and no position. (3, 4) is "three right, four ' +
          'up" from wherever you are — which is why the same vector can be drawn anywhere on the ' +
          'page, and why a vector and a point are different objects that happen to share a ' +
          'notation.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Find the magnitude of v = (3, 4).',
          subgoals: [
            {
              label: 'The components are two legs of a right triangle',
              detail: 'Going 3 across and 4 up, the displacement itself is the hypotenuse.',
              socratic:
                'Sketch the trip — three across, then four up — and then the arrow straight ' +
                'from where you started to where you finished. What figure have those three ' +
                'segments made, and which one of them is v?',
            },
            {
              label: 'Pythagoras',
              detail: '|v| = (3² + 4²)^(1/2) = (9 + 16)^(1/2) = 25^(1/2) = 5.',
              socratic:
                'Two sides of that triangle are 3 and 4, and the one you want is the ' +
                'hypotenuse. What relation between the three sides gets you from the two you ' +
                'have to the one you want, and what length does it give?',
            },
            {
              label: 'What the number is about',
              detail:
                'It is the length of the arrow, not a location. The vector from (0,0) to (3,4) ' +
                'and the one from (7,1) to (10,5) are the SAME vector — same displacement — ' +
                'while the points at their tips are nothing alike.',
              socratic:
                'The arrow from (0,0) to (3,4) and the arrow from (7,1) to (10,5) describe the ' +
                'same three-across-four-up trip, but their tips are nowhere near each other. ' +
                'Which of those two things is the 5 a measurement of?',
            },
          ],
          answer: '5',
        },
      },
      {
        id: 'adding-is-tip-to-tail',
        conceptId: 'plane-vectors',
        statement:
          'Adding two vectors means doing one displacement then the other, which in components ' +
          'is just adding them separately. The geometry and the arithmetic are the same ' +
          'statement, and that agreement is the reason components are worth using.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'u = (3, 4) and v = (−1, 2). Find the first component of u + v.',
          subgoals: [
            {
              label: 'Add component by component',
              detail: 'First: 3 + (−1) = 2. Second: 4 + 2 = 6. So u + v = (2, 6).',
            },
            {
              label: 'Why that matches the picture',
              detail:
                'Walk 3 right and 4 up, then 1 LEFT and 2 up. Net horizontal travel is 2 and ' +
                'vertical is 6 — the components never interact, because going across does not ' +
                'change how far up you are.',
            },
            {
              label: 'And why order does not matter here',
              detail:
                'v + u gives the same (2, 6). Vector addition is commutative because number ' +
                'addition is, component by component — unlike the matrix products these build ' +
                'toward, where it is not.',
            },
          ],
          answer: '2',
        },
      },
      {
        id: 'scaling-stretches-and-flips',
        conceptId: 'plane-vectors',
        statement:
          'Multiplying by a number stretches a vector by that factor and reverses it if the ' +
          'number is negative. The direction is otherwise untouched, which is what makes "scalar ' +
          'multiple" and "same line through the origin" the same condition.',
        position: 3,
        workedExample: {
          problem: 'u = (2, −1). Find the first component of 3u, and say what 3u looks like.',
          subgoals: [
            {
              label: 'Scale each component',
              detail: '3·2 = 6 and 3·(−1) = −3, so 3u = (6, −3).',
            },
            {
              label: 'Read the geometry',
              detail:
                'Three times as long, pointing the same way. Had the factor been −3 the length ' +
                'would be the same and the arrow would point the other way.',
            },
            {
              label: 'The fact this sets up',
              detail:
                'Every scalar multiple of u lies on one line through the origin. That line is ' +
                'everything u alone can reach — which is the span, and the next concept.',
            },
          ],
          answer: '6',
        },
      },
    ],
  },

  {
    id: 'vectors-and-spans',
    name: 'Linear combinations and span',
    subjectId: subject.id,
    scope: {
      id: 'vectors-and-spans',
      label: 'Linear combinations and span',
      hint: 'linear combination span reachable set of vectors',
      match: /\b(linear combination|span|spanning set|reachable|generated by)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'form-and-test-combinations',
        statement:
          'Form a linear combination, and decide whether a given vector is reachable from a set.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-linear-combination',
        conceptId: 'vectors-and-spans',
        statement:
          'A linear combination is a scaled sum: c₁u + c₂v. Those two operations — scale and ' +
          'add — are the only ones vectors have, so a combination is everything you are ever ' +
          'allowed to build.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'u = (2, −1) and v = (1, 3). Find the first component of 2u + 3v.',
          subgoals: [
            {
              label: 'Scale each one',
              detail: '2u = (4, −2) and 3v = (3, 9).',
            },
            {
              label: 'Add',
              detail: 'First component: 4 + 3 = 7. (The second is −2 + 9 = 7 as well, by accident.)',
            },
            {
              label: 'What the weights mean',
              detail:
                'They are the recipe. Changing them to 2 and −1 reaches somewhere else entirely; ' +
                'the set of everywhere you can reach by varying them is the span.',
            },
          ],
          answer: '7',
        },
      },
      {
        id: 'one-vector-spans-a-line',
        conceptId: 'vectors-and-spans',
        statement:
          'The span of a single non-zero vector is the line through the origin along it. So ' +
          'asking "is w in the span of u" means asking whether w is a multiple of u — and the ' +
          'way to check is whether the components are in the same ratio.',
        position: 2,
        workedExample: {
          problem: 'Is w = (6, −3) in the span of u = (2, −1)? Compare the ratios.',
          subgoals: [
            {
              label: 'Ask what multiple it would have to be',
              detail:
                'The first components force c = 6/2 = 3. If w is a multiple of u at all, it is 3u.',
            },
            {
              label: 'Check the other component agrees',
              detail: '−3/−1 = 3 as well. Subtracting: 3 − 3 = 0.',
            },
            {
              label: 'Read the answer',
              detail:
                'The ratios match, so w = 3u and w IS in the span. A non-zero difference would ' +
                'have meant the two components demanded different multiples, which no single ' +
                'scaling can satisfy.',
            },
          ],
          answer: '0 — the ratios agree, so w = 3u is on the line',
        },
      },
      {
        id: 'two-vectors-usually-span-the-plane',
        conceptId: 'vectors-and-spans',
        statement:
          'Two vectors that do not lie on one line reach every point of the plane: given any ' +
          'target there are weights that build it. Finding them is solving two equations in two ' +
          'unknowns, which is why spanning questions turn into systems.',
        position: 3,
        workedExample: {
          problem:
            'u = (2, −1), v = (1, 3). Show that 3u + 1v reaches (7, 0) by evaluating its second ' +
            'component.',
          subgoals: [
            {
              label: 'Apply the weights to the second components',
              detail: '3·(−1) + 1·3 = −3 + 3 = 0.',
            },
            {
              label: 'And the first, for completeness',
              detail: '3·2 + 1·1 = 7. So 3u + v = (7, 0), as claimed.',
            },
            {
              label: 'What had to be true for weights to exist',
              detail:
                'u and v point in genuinely different directions. Had v been a multiple of u, ' +
                'every combination would have stayed on one line and almost no target would be ' +
                'reachable — which is the next concept.',
            },
          ],
          answer: '0',
        },
      },
    ],
  },

  {
    id: 'linear-independence',
    name: 'Linear independence',
    subjectId: subject.id,
    scope: {
      id: 'linear-independence',
      label: 'Linear independence',
      hint: 'linear independence dependence redundant nontrivial combination',
      match: /\b(linear(ly)? (in)?dependen\w+|redundant|nontrivial combination|spanning set)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-independence',
        statement:
          'Decide whether two vectors are independent, and say what a dependence costs a ' +
          'description.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'dependent-means-redundant',
        conceptId: 'linear-independence',
        statement:
          'A set is dependent when one of its vectors is already reachable from the others — so ' +
          'it adds nothing. Independence is the condition that every vector in the set is ' +
          'pulling its weight.',
        position: 1,
        workedExample: {
          problem: 'u = (2, −1) and w = (6, −3). Is {u, w} independent? Evaluate w − 3u.',
          subgoals: [
            {
              label: 'Test the obvious candidate',
              detail: 'The first components suggest w might be 3u. 3u = (6, −3).',
            },
            {
              label: 'Subtract',
              detail: 'First component of w − 3u: 6 − 6 = 0. The second gives −3 + 3 = 0 too.',
            },
            {
              label: 'What vanishing proves',
              detail:
                'w − 3u = 0 is a combination of u and w, with weights 1 and −3, that comes out ' +
                'at the origin — and the weights are not both zero. That is a DEPENDENCE. The ' +
                'span of {u, w} is just the line through u, so w was redundant.',
            },
          ],
          answer: '0 — w = 3u, so the set is dependent',
        },
      },
      {
        id: 'the-cross-check',
        conceptId: 'linear-independence',
        statement:
          'For two vectors in the plane the test is a₁b₂ − a₂b₁. Zero means dependent, anything ' +
          'else means independent. This is the determinant of the matrix with them as columns, ' +
          'met properly later — here it is simply the one arithmetic check that settles the ' +
          'question without hunting for weights.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Apply the cross-check to u = (2, −1) and v = (1, 3).',
          subgoals: [
            {
              label: 'Multiply crosswise and subtract',
              detail: '2·3 − (−1)·1 = 6 + 1 = 7.',
            },
            {
              label: 'Read it',
              detail:
                'Not zero, so u and v are independent — neither is a multiple of the other, and ' +
                'together they span the whole plane.',
            },
            {
              label: 'Why it works',
              detail:
                'If v were cu then the expression would be a₁(ca₂) − a₂(ca₁) = 0 identically. ' +
                'The cross-check is exactly a test for "same ratio", written so that no division ' +
                'is needed — which matters, since a zero component would make the ratio ' +
                'undefined.',
            },
            {
              label: 'Where you will meet it again',
              detail:
                'This is the 2×2 determinant. That it is zero precisely when the columns are ' +
                'dependent, and that this means the map collapses the plane onto a line, is the ' +
                'same fact arriving with more machinery.',
            },
          ],
          answer: '7 — non-zero, so independent',
        },
      },
      {
        id: 'dependence-costs-a-dimension',
        conceptId: 'linear-independence',
        statement:
          'A dependent pair spans a line rather than a plane. So dependence is not a technical ' +
          'blemish — it is the difference between a description that can reach everything and ' +
          'one that cannot, and it is why "how many independent vectors" is the useful count ' +
          'rather than "how many vectors".',
        position: 3,
        workedExample: {
          problem:
            'Apply the cross-check to u = (2, −1) and w = (6, −3), and say what the answer costs.',
          subgoals: [
            {
              label: 'Compute',
              detail: '2·(−3) − (−1)·6 = −6 + 6 = 0.',
            },
            {
              label: 'So the pair is dependent',
              detail: 'Which the first point already showed directly: w = 3u.',
            },
            {
              label: 'The cost, stated plainly',
              detail:
                'Two vectors and still only a line. The target (7, 0) is unreachable from {u, w} ' +
                'however the weights are chosen, while {u, v} reached it with weights 3 and 1. ' +
                'Adding more copies of the same direction never helps.',
            },
          ],
          answer: '0 — dependent, so the pair spans a line and not the plane',
        },
      },
    ],
  },

  {
    id: 'dot-product-geometry',
    name: 'The dot product',
    subjectId: subject.id,
    scope: {
      id: 'dot-product-geometry',
      label: 'The dot product',
      hint: 'dot product scalar product projection angle between vectors',
      /*
       * Carried verbatim from the map node, for the reason
       * ontology-algebra.ts gives and ontology-trigonometry.ts repeats: the
       * pattern decides against an article title, and widening it during an
       * authoring pass would move the recognition figure in tests/atlas.mjs at
       * the same time as the material appeared, leaving no way to say which
       * edit moved it.
       *
       * The `cross product` branch is worth naming, because it matches
       * articles about an operation this concept does NOT contain — the
       * `covers` sentence says "nothing in three dimensions, so no cross
       * product", and the cross product is filed on the map under
       * `three-dimensional-coordinates`. Overlap is allowed and a title
       * claiming two concepts is normal; narrowing this is a separate change
       * with its own measurement, exactly as the `tangent` branch of
       * `right-triangle-trig` is.
       */
      match: /\b(dot product|scalar product|cross product)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'produce-the-product-and-tell-it-from-the-cross-check',
        statement:
          'Produce a·b from components, produce a·a and say which quantity already met in this ' +
          'subject it equals, and say which different question the crosswise-and-subtract ' +
          'combination of the same four numbers answers.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'decide-the-angle-by-the-sign-of-the-product',
        statement:
          'Decide from a·b alone whether two vectors are perpendicular, acute or obtuse to each ' +
          'other, and justify the right-angle case from the converse of Pythagoras applied to the ' +
          'triangle the two arrows make.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'produce-the-cosine-exactly-and-refuse-the-angle',
        statement:
          'Produce cos θ exactly, as the product divided by the two magnitudes, read it against ' +
          'the values 1, 0 and −1, and say why a figure in degrees is a rounding of that quotient ' +
          'rather than the answer to the question.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-product-of-two-vectors-is-a-number',
        conceptId: 'dot-product-geometry',
        statement:
          'The dot product multiplies the components that match and adds: a·b = a₁b₁ + a₂b₂. Two ' +
          'vectors go in and a NUMBER comes out, which is new — adding and scaling both handed a ' +
          'vector back. That is what makes lengths and angles reachable at all, since those are ' +
          'numbers and no vector-valued operation could produce one. Applied to a single vector ' +
          'twice it gives a·a = |a|², so the magnitude was a dot product all along.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'a = (3, 4) and b = (4, 3). Find a·b, and say what kind of object the answer is.',
          subgoals: [
            {
              label: 'Pair the components by position, not across',
              detail:
                'First with first and second with second: 3·4 = 12 and 4·3 = 12, and adding them ' +
                'gives a·b = 24. Pairing them the other way round — 3·3 and 4·4 — would give 25, ' +
                'which is a different number and is not what the definition says.',
              socratic:
                'There are four numbers here and the definition allows you exactly two products. ' +
                'Which component of b does the 3 in a multiply with, and what is it about the two ' +
                'vectors that decides that rather than the other pairing?',
            },
            {
              label: 'Notice what came out, and what did not',
              detail:
                '24 is a number. u + v was a vector and 3u was a vector; this is the first ' +
                'operation in the subject that takes two vectors and hands back a scalar. A length ' +
                'and an angle are numbers, so no amount of adding and scaling could ever have ' +
                'produced one — this is the operation that opens them up.',
              socratic:
                'u + v was a vector and 3u was a vector. What sort of thing is 24 — and what kinds ' +
                'of question does that let this operation answer that the other two never could?',
            },
            {
              label: 'Take the product of a vector with itself',
              detail:
                'a·a = 3·3 + 4·4 = 9 + 16 = 25, and 25 is 5², and 5 is |a|. So a·a = |a|² always: ' +
                'the sum of squares Pythagoras gave for a magnitude IS a dot product. The ' +
                'magnitude is not a separate idea that this one happens to sit beside; it is this ' +
                'operation applied twice to the same arrow.',
              socratic:
                'Now run the same two products with b replaced by a itself. You have met 25 before ' +
                'in this subject — where, and what was it the square of?',
            },
            {
              label: 'Set it beside the cross-check, which is the same four numbers',
              detail:
                'The independence test was a₁b₂ − a₂b₁: multiply crosswise and subtract. On these ' +
                'four numbers it gives 3·3 − 4·4 = −7. This product multiplies alongside and adds, ' +
                'giving 24. Two combinations of one set of four numbers, answering two different ' +
                'questions — whether the pair spreads out to cover the plane, and how far the two ' +
                'of them agree in direction.',
              socratic:
                'You met a₁b₂ − a₂b₁ as the independence test. Run it on these same four numbers. ' +
                'Is it the number you just computed — and if not, what is different about the way ' +
                'the two expressions combine them?',
            },
          ],
          answer:
            '24, and it is a number rather than a vector — which is also why a·a comes to 25, ' +
            'that being |a|².',
        },
      },
      {
        id: 'a-zero-product-is-a-right-angle',
        conceptId: 'dot-product-geometry',
        statement:
          'For two non-zero vectors, a·b = 0 exactly when they are at right angles. That is the ' +
          'one angle this product names with no table involved, and it is not a definition: ' +
          '|a − b|² = |a|² + |b|² − 2(a·b), so a zero product says precisely that the Pythagorean ' +
          'relation holds for the triangle the two arrows make, and the converse of Pythagoras ' +
          'then supplies the right angle. The same identity turns the SIGN of a·b into the ' +
          'converse\'s own sign test — positive for acute, negative for obtuse — and a sign stays ' +
          'exact in cases where the cosine does not.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem:
            'u = (3, 4) and v = (−4, 3). Find u·v, and then prove from the three side lengths ' +
            'that the two arrows really are at right angles.',
          subgoals: [
            {
              label: 'Compute the product and read the zero',
              detail:
                '3(−4) + 4(3) = −12 + 12 = 0. The two products came out equal and opposite, which ' +
                'is what the zero records. The claim to be checked is that this is not a ' +
                'coincidence of these numbers but exactly the condition for a right angle.',
              socratic:
                'Multiply the matching components and add. What have the two products done to each ' +
                'other here, and what does that leave as the total?',
            },
            {
              label: 'Turn the two arrows into a triangle with three known sides',
              detail:
                'Drawn from one point, u and v are two sides of a triangle, and the third side ' +
                'joins their tips: it is u − v = (7, 1). So the three sides are |u| = 5, |v| = 5 ' +
                'and |u − v|, whose square is 49 + 1 = 50. Three lengths, all from components.',
              socratic:
                'Two arrows drawn from the same point are two sides of a triangle. What is the ' +
                'third side as a vector — and which subtraction of the two you have gives it?',
            },
            {
              label: 'Let the converse of Pythagoras decide the angle',
              detail:
                '|u|² + |v|² = 25 + 25 = 50, and |u − v|² is 50 as well. Pythagoras run forwards ' +
                'would need the right angle first; the CONVERSE goes the way this problem needs — ' +
                'a triangle whose longest side squared equals the sum of the other two squares has ' +
                'a right angle, sitting between the two sides that were squared. Those two sides ' +
                'are u and v, so the angle between u and v is the right one. Nothing was measured ' +
                'and nothing was drawn to scale.',
              socratic:
                'You have 25, 25 and 50 for the three squared sides. One direction of Pythagoras ' +
                'assumes a right angle and one concludes it. Which do you need here, and what does ' +
                'it let you say about where in this triangle the right angle sits?',
            },
            {
              label: 'Read the sign when the total is not zero',
              detail:
                'The same expansion in general gives |u − v|² = |u|² + |v|² − 2(u·v), so ' +
                '|u|² + |v|² − |u − v|² is exactly twice the product. The converse\'s three-way ' +
                'sign test on that difference — positive acute, zero right, negative obtuse — is ' +
                'therefore a sign test on u·v itself. For u = (3, 4) and v = (−4, 1) the product is ' +
                '−12 + 4 = −8, so that pair is obtuse. Worth noticing what was NOT needed: |v| is ' +
                '√17 there, so the cosine is irrational, and the sign was settled exactly anyway.',
              socratic:
                'The converse sorted triangles three ways by the sign of a² + b² − c². Rewrite ' +
                'that difference using the expansion above — what is it, in terms of u·v? And what ' +
                'does that let you say about a pair whose product comes out negative?',
            },
          ],
          answer:
            '0, and the right angle follows from the converse of Pythagoras: the triangle\'s sides ' +
            'are 5, 5 and |u − v| with |u − v|² = 50 = 25 + 25, which puts the right angle between ' +
            'u and v.',
        },
      },
      {
        id: 'the-product-gives-the-cosine-not-the-angle',
        conceptId: 'dot-product-geometry',
        statement:
          'a·b = |a||b| cos θ. Three of those four quantities come straight from the components, ' +
          'so the fourth is forced: cos θ = (a·b)/(|a||b|). That quotient is the answer. A figure ' +
          'in degrees is a rounding of it — this product measures the angle BY its cosine, and ' +
          'turning a cosine back into an angle is the inverse question, which needs a table.',
        position: 3,
        /*
         * No `automaticityTarget`. Two of the four subgoals are an argument —
         * where the identity comes from, and why the quotient rather than the
         * angle is the answer — and a timing target on those measures typing,
         * which is the case types.ts names when it argues the field should
         * usually be absent. The two points above it are timed, because
         * computing a·b and reading its sign genuinely are meant to become
         * automatic.
         */
        workedExample: {
          problem:
            'a = (3, 4) and b = (4, 3). Find cos θ for the angle between them, exactly. Then say ' +
            'why the angle itself is not the answer.',
          subgoals: [
            {
              label: 'Collect the three quantities the identity needs',
              detail:
                'a·b = 24, from the first point. |a| = (3² + 4²)^(1/2) = 5 and ' +
                '|b| = (4² + 3²)^(1/2) = 5. All three came out of the components alone, which ' +
                'leaves cos θ as the only thing in the identity not yet known.',
              socratic:
                'a·b = |a||b| cos θ has four quantities in it. Which three can you get from the ' +
                'components you were handed, and what does that leave the equation to tell you?',
            },
            {
              label: 'Where the identity comes from, and what it costs',
              detail:
                'Split b into the part along a and the part across it: b = ca + b⊥, with b⊥ ' +
                'perpendicular to a. The split is allowed because every multiple of a lies on one ' +
                'line — that is the span of a single vector — and whatever b has left over can be ' +
                'taken perpendicular to it. Then a·b = c(a·a) + a·b⊥ = c|a|², the second term ' +
                'vanishing by the previous point. And ca is the leg adjacent to θ in the right ' +
                'triangle with b as hypotenuse, so cos θ = c|a|/|b|, which is adjacent over ' +
                'hypotenuse. Substituting for c gives a·b = |a||b| cos θ. The usual proof goes ' +
                'through the law of cosines, which this map files above here and nobody has ' +
                'written; this one needs one fact from each of the three concepts underneath.',
              socratic:
                'You know a·b = 0 when the two are perpendicular, and you know every multiple of a ' +
                'lies on one line. If b were written as some multiple of a plus something ' +
                'perpendicular to a, how much of a·b would survive — and which part would it come ' +
                'from?',
            },
            {
              label: 'Divide, and keep the answer as a quotient',
              detail:
                'cos θ = 24/(5 × 5) = 24/25, and that is exact. It is a fraction because both ' +
                'magnitudes came out whole, which is a property of these components rather than of ' +
                'the method: for u = (3, 4) and v = (−4, 1) the denominator is 5√17 and the cosine ' +
                'is irrational, while the sign of the product is still exactly −8. The sign ' +
                'survives where the cosine does not.',
              socratic:
                'You have 24 on top and 5 and 5 underneath. What is cos θ — and would the answer ' +
                'still have been a fraction if |b| had come out as √17 instead of 5?',
            },
            {
              label: 'Read 24/25 against the three values that mean something',
              detail:
                '1 means b is a positive multiple of a: for b = (6, 8) the product is 50 and the ' +
                'magnitudes are 5 and 10, so cos θ = 50/50 = 1 exactly, and indeed (6, 8) = 2(3, 4). ' +
                '0 is perpendicular, from the previous point, and −1 is opposite. 24/25 is just ' +
                'under 1, so these two arrows nearly agree in direction — which the components ' +
                'confirm: (4, 3) is (3, 4) with its entries swapped, so each is the other reflected ' +
                'in the line that bisects the first quadrant.',
              socratic:
                'Three values of cos θ have a plain geometric meaning: 1, 0 and −1. Which of them ' +
                'is 24/25 close to, and what does that say about how these two arrows sit relative ' +
                'to each other?',
            },
            {
              label: 'Stop at the cosine, and say why that is finishing rather than giving up',
              detail:
                'A calculator reports about 16.26°, and that figure is a rounding of the answer ' +
                'rather than the answer: 24/25 pins the angle down exactly and 16.26° does not. ' +
                'Going back from a quotient to an angle is the inverse question — `inverse-trig` on ' +
                'the map, behind the unit circle — and it is the same refusal the right-triangle ' +
                'ratios make, for the same reason a hypotenuse is left as a surd instead of being ' +
                'rounded.',
              socratic:
                'A calculator would hand you about 16.26° here. Which of that and 24/25 is the ' +
                'exact answer to the question that was asked, and what has happened to the other ' +
                'one?',
            },
          ],
          answer:
            '24/25. The angle is about 16.26°, but 24/25 is exact and the degree figure is a ' +
            'rounding of it — recovering the angle from its cosine is the inverse question and ' +
            'needs a table.',
        },
      },
    ],
  },

  {
    id: 'three-dimensional-coordinates',
    name: 'Three dimensions',
    subjectId: subject.id,
    scope: {
      id: 'three-dimensional-coordinates',
      label: 'Three dimensions',
      hint: 'three dimensional coordinates plane equation cross product normal',
      /*
       * Carried verbatim from the map node, including the `terms` string as the
       * hint, for the reason `dot-product-geometry` above gives and the two
       * subjects before it repeat: the pattern decides against an article
       * title, and widening it during an authoring pass would move the
       * recognition figure in tests/atlas.mjs at the same time as the material
       * appeared, leaving no way to say which edit moved it.
       *
       * It is the narrowest pattern in this file and that is deliberate here
       * rather than inherited. "Three-dimensional space" is an article title;
       * `/\bthree dimensions?\b/i` would claim every article that mentions
       * them in passing, which is most of the solids, the multivariable
       * calculus and the vector fields. The dot product's pattern can afford to
       * be generous because the phrases it matches ARE the operation. There is
       * no phrase that means this concept and nothing else except its title.
       */
      match: /\bthree-dimensional space\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'extend-the-component-arithmetic-into-space',
        statement:
          'Produce a magnitude and a dot product from three components, and say which of the ' +
          'conclusions reached in the plane the extra term leaves standing and why none of the ' +
          'arguments had to be made again.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'read-a-plane-off-its-equation',
        statement:
          'Produce the equation of a plane from a point and a normal vector, read the normal ' +
          'straight off any equation of that shape, decide whether a given point lies on it, and ' +
          'say why the single equation that described a line in the plane describes a surface here.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'produce-a-perpendicular-and-account-for-its-direction',
        statement:
          'Produce u × v component by component, check the result against both inputs with a dot ' +
          'product rather than by trusting the formula, and say what the order of the two ' +
          'arguments decides that the geometry does not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'space-adds-one-coordinate-and-one-term',
        conceptId: 'three-dimensional-coordinates',
        statement:
          'A point in space is an ordered TRIPLE: a third axis is set perpendicular to the other ' +
          'two, and the third number says how far along it. Nothing already written is replaced. ' +
          'The distance from the origin is Pythagoras used twice rather than a new formula — once ' +
          'across the floor, once standing up — and the sum of squares the two applications ' +
          'collapse into is a·a again, so the dot product extends by one term and the identity ' +
          'a·a = |a|² comes with it rather than being re-chosen to fit.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem:
            'a = (2, 3, 6). Find |a|, using Pythagoras twice rather than quoting a formula for ' +
            'three dimensions.',
          subgoals: [
            {
              label: 'Flatten it to a problem already solved',
              detail:
                'The first two coordinates describe a displacement in the floor plane: 2 across ' +
                'and 3 along. Its length is (2² + 3²)^(1/2) = 13^(1/2), by the magnitude of a ' +
                'plane vector. The third coordinate has not been used yet.',
              socratic:
                'Two of these three numbers describe a displacement you already know how to ' +
                'measure. Which two, and what length do they give?',
            },
            {
              label: 'Stand a second right triangle on the first',
              detail:
                'The rise of 6 is along an axis perpendicular to the WHOLE floor plane, so it is ' +
                'perpendicular to that diagonal in particular. Diagonal and rise are therefore ' +
                'the two legs of a second right triangle whose hypotenuse is a itself: ' +
                '|a|² = (13^(1/2))² + 6² = 13 + 36 = 49, so |a| = 7.',
              socratic:
                'You have a segment of length 13^(1/2) lying flat and a rise of 6 going straight ' +
                'up. What is the angle between those two, and what does knowing it let you do ' +
                'with them?',
            },
            {
              label: 'Look at what survived the squaring',
              detail:
                'The 13 was 2² + 3², so 49 is 2² + 3² + 6². Squaring the first hypotenuse undid ' +
                'the root taken to get it, which is why two applications of Pythagoras leave one ' +
                'sum of squares and not a nested expression — and why the pattern keeps ' +
                'extending: each further perpendicular axis contributes its square and nothing ' +
                'else.',
              socratic:
                'Write 49 out in terms of the three numbers you started with. What became of the ' +
                'square root you took along the way?',
            },
            {
              label: 'Name the sum you have just written',
              detail:
                'In the plane that sum of squares was a·a, and the magnitude was its square root. ' +
                'The same sum here has three terms, so the dot product in space must be ' +
                'a₁b₁ + a₂b₂ + a₃b₃ — one product per axis — and a·a = |a|² still holds. The ' +
                'definition was not adjusted to make that come out; it is the old definition with ' +
                'a term added, and the consequence followed.',
              socratic:
                'In the plane this sum of squares had a name as the product of a vector with ' +
                'itself. What was it called — and what does that force the dot product of two ' +
                'DIFFERENT vectors in space to be?',
            },
          ],
          answer: '7',
        },
      },
      {
        id: 'every-plane-fact-extends-and-one-does-not',
        conceptId: 'three-dimensional-coordinates',
        statement:
          'Every consequence the dot product had in the plane survives the third term, because ' +
          'none of the arguments ever counted the coordinates: a zero product is still a right ' +
          'angle by the converse of Pythagoras on the triangle the two arrows make, and cos θ is ' +
          'still the product over the two magnitudes. What does NOT survive is the cross-check ' +
          'a₁b₂ − a₂b₁. In the plane there was one way to pick two coordinates from two, and the ' +
          'single number it gave decided independence; in space there are three ways, and no one ' +
          'of the three answers the question on its own.',
        position: 2,
        /*
         * No `automaticityTarget`. Computing the product IS meant to become
         * automatic and the point above it carries the target for that; the
         * content HERE is two arguments — what the proofs did not depend on,
         * and what the cross-check lost — and a timing target on those measures
         * typing, which is the case types.ts names when it argues the field
         * should usually be absent.
         */
        workedExample: {
          problem:
            'n = (2, −1, 2) and u = (1, 2, 0). Find n·u, and say what the answer settles and what ' +
            'it does not.',
          subgoals: [
            {
              label: 'Pair the components by position and add the third term',
              detail:
                '2·1 = 2, (−1)·2 = −2 and 2·0 = 0, and the three add to n·u = 0. The rule is the ' +
                'plane\'s rule with one more product in the sum; nothing about how the first two ' +
                'terms are formed has changed.',
              socratic:
                'The definition allows you exactly one product per axis. How many products is ' +
                'that here, and what do they come to altogether?',
            },
            {
              label: 'Spend the zero without computing an angle',
              detail:
                'Drawn from one point, n and u are two sides of a triangle whose third side ' +
                'is n − u = (1, −3, 2). The three squared sides are |n|² = 4 + 1 + 4 = 9, ' +
                '|u|² = 1 + 4 + 0 = 5, and |n − u|² = 1 + 9 + 4 = 14. Since 9 + 5 = 14, the ' +
                'converse of Pythagoras puts a right angle between the two sides that were ' +
                'squared, which are n and u. That is the plane\'s argument word for word — it ' +
                'names three side lengths and never how many coordinates each was built from.',
              socratic:
                'Make a triangle out of the two arrows and find its three squared sides. Which ' +
                'direction of Pythagoras do you need to get from those three numbers to an angle, ' +
                'and what does it tell you about where in the triangle that angle sits?',
            },
            {
              label: 'Produce the cosine, and notice the denominator did not matter',
              detail:
                'cos θ = (n·u)/(|n||u|) = 0/(3 · 5^(1/2)) = 0, and 0 is exactly the value that ' +
                'means perpendicular. |n| came out whole at 3 and |u| did not, so the denominator ' +
                'is irrational — and the quotient is still exact, because a zero numerator ' +
                'settles it. That is the same observation the plane made about the sign surviving ' +
                'where the cosine does not.',
              socratic:
                'One of these two magnitudes is 5^(1/2), so the denominator of the cosine is ' +
                'irrational. Why is the quotient exact anyway?',
            },
            {
              label: 'Try the cross-check and watch it stop being a number',
              detail:
                'The plane\'s independence test was a₁b₂ − a₂b₁, built from the two coordinates ' +
                'there are. Here there are three pairs to choose: the first two coordinates give ' +
                '2·2 − (−1)·1 = 5, the last two give (−1)·0 − 2·2 = −4, and the first and third ' +
                'give 2·0 − 2·1 = −2. Three numbers, and none of them is the answer — a pair of ' +
                'vectors in space is dependent only when ALL three vanish. The question has ' +
                'stopped having a single-number answer, which is the first sign that what ' +
                'replaces it is going to be a vector.',
              socratic:
                'In the plane the independence test used both coordinates of both vectors, and ' +
                'there was only one way to choose them. How many ways are there now — and what ' +
                'does that do to the idea of "the" cross-check?',
            },
          ],
          answer:
            '0 — so n and u are perpendicular, by the converse of Pythagoras on squared sides ' +
            '9, 5 and 14.',
        },
      },
      {
        id: 'one-equation-in-space-is-a-plane',
        conceptId: 'three-dimensional-coordinates',
        statement:
          'In the plane, ax + by = c was a line. In space, ax + by + cz = d is a PLANE, and the ' +
          'jump is not a quirk of counting: one equation removes one freedom from three and ' +
          'leaves two, which is a surface. The reason is the dot product — the equation says ' +
          'n·r = d with n = (a, b, c) — so the coefficients ARE a vector perpendicular to the ' +
          'surface they describe, and the equation is really the statement that the displacement ' +
          'from one point of the plane to any other is perpendicular to n. A line in space is one ' +
          'freedom, so it cannot be one equation: it takes two of them, or a parameter.',
        position: 3,
        workedExample: {
          problem:
            'Write the equation of the plane through P = (1, 2, 3) perpendicular to ' +
            'n = (2, −1, 2), then check whether the point P + (1, 2, 0) lies on it.',
          subgoals: [
            {
              label: 'State the condition as a dot product rather than as a formula',
              detail:
                'A point r lies on the plane exactly when the displacement r − P lies IN the ' +
                'plane, and that is exactly when it is perpendicular to n. So the condition is ' +
                'n·(r − P) = 0, and so far nothing has been assumed about x, y or z.',
              socratic:
                'You know a right angle is a zero dot product. Which two vectors have to be ' +
                'perpendicular for r to lie on this plane, and which of the two is not yet given ' +
                'to you as numbers?',
            },
            {
              label: 'Expand the single dot product you have',
              detail:
                'With r = (x, y, z) the displacement is (x − 1, y − 2, z − 3), and feeding it to ' +
                'the definition gives 2(x − 1) + (−1)(y − 2) + 2(z − 3) = 0.',
              socratic:
                'Write r − P out component by component and hand it to the definition. What ' +
                'equation in x, y and z does the one geometric condition turn into?',
            },
            {
              label: 'Collect the constants and read the coefficients',
              detail:
                'Multiplying out and moving the numbers across gives 2x − y + 2z = ' +
                '2(1) + (−1)(2) + 2(3) = 2 − 2 + 6 = 6. So the plane is 2x − y + 2z = 6, the ' +
                'right-hand side is n·P, and the three coefficients on the left are n itself. ' +
                'Every equation of this shape carries its own normal vector in plain sight.',
              socratic:
                'Look at the three numbers multiplying x, y and z, and then look at n. What do ' +
                'you notice — and what does that let you read off any equation of this shape with ' +
                'no work at all?',
            },
            {
              label: 'Test the second point, and find the fact that made it pass',
              detail:
                'P + (1, 2, 0) = (2, 4, 3), and 2(2) − 4 + 2(3) = 4 − 4 + 6 = 6, so it is on the ' +
                'plane. It was never going to miss: n·(1, 2, 0) = 2 − 2 + 0 = 0 is the previous ' +
                'point\'s own worked example, so that displacement is perpendicular to n and ' +
                'adding it cannot leave the plane. Every point of the plane is reached from P ' +
                'this way.',
              socratic:
                'You stepped away from P by (1, 2, 0) and landed back on the plane. What is ' +
                'n·(1, 2, 0) — and why does that answer make the landing inevitable rather than ' +
                'lucky?',
            },
            {
              label: 'Count what one equation cost, and price a line',
              detail:
                'Three coordinates, one condition, two freedoms left: a surface. The same count ' +
                'in the plane was two coordinates less one condition, leaving one freedom — a ' +
                'line. So "one equation is a line" was a fact about the plane and not about ' +
                'equations, and a line in space needs one freedom removed twice: two equations, ' +
                'which is two planes crossing, or a point and a direction and a parameter.',
              socratic:
                'x, y and z are three numbers and you have imposed one condition on them. How ' +
                'many are still free — and does that make this set of points a curve or a ' +
                'surface?',
            },
          ],
          answer:
            '2x − y + 2z = 6, and P + (1, 2, 0) = (2, 4, 3) is on it, because the step taken was ' +
            'perpendicular to n.',
        },
      },
      {
        id: 'the-cross-product-is-a-choice-of-direction',
        conceptId: 'three-dimensional-coordinates',
        statement:
          'Two vectors in space that are not parallel have a whole LINE of vectors perpendicular ' +
          'to both, and the two directions along that line are equally good — so "the ' +
          'perpendicular" is not well defined until a convention picks one. The cross product ' +
          'makes the pick and hands back a VECTOR: ' +
          'u × v = (u₂v₃ − u₃v₂, u₃v₁ − u₁v₃, u₁v₂ − u₂v₁). Each component is the plane\'s own ' +
          'crosswise-and-subtract test run on the two coordinates it leaves out, so the three ' +
          'numbers that stopped being an answer have become one object. Swapping the arguments ' +
          'negates it, which makes this the first operation in the subject where order matters.',
        position: 4,
        workedExample: {
          problem:
            'u = (1, 2, 0) and v = (0, 2, 1) are two displacements that leave the plane ' +
            '2x − y + 2z = 6 unchanged — each is perpendicular to its normal n = (2, −1, 2). ' +
            'Compute u × v.',
          subgoals: [
            {
              label: 'Say what is being asked for before computing anything',
              detail:
                'A vector perpendicular to both u and v. There is a line of them: if w works then ' +
                'so does −w, and so does every multiple of w. So perpendicularity alone cannot ' +
                'force an answer — something has to choose, and the formula is that choice ' +
                'written down.',
              socratic:
                'Suppose you find one vector perpendicular to both u and v. Name another that is ' +
                'also perpendicular to both. How many are there, and what does that do to the ' +
                'question "what is THE perpendicular"?',
            },
            {
              label: 'Build each component from the two coordinates it leaves out',
              detail:
                'The first component ignores the first coordinates and runs the plane\'s ' +
                'cross-check on the other two: u₂v₃ − u₃v₂ = 2·1 − 0·2 = 2. The third ignores the ' +
                'third: u₁v₂ − u₂v₁ = 1·2 − 2·0 = 2. The middle one runs the other way round — ' +
                'u₃v₁ − u₁v₃ = 0·0 − 1·1 = −1 — and that alternation is not decoration; it is ' +
                'what makes the result come out perpendicular rather than merely built from the ' +
                'right six numbers. So u × v = (2, −1, 2).',
              socratic:
                'Each component is built from four of the six numbers you were given. Which two ' +
                'coordinates does the FIRST component leave out, and which test already in hand ' +
                'is it running on the four that are left?',
            },
            {
              label: 'Check perpendicularity instead of trusting the formula',
              detail:
                'u·(u × v) = 1·2 + 2·(−1) + 0·2 = 0, and v·(u × v) = 0·2 + 2·(−1) + 1·2 = 0. Both ' +
                'zero, so the result really is perpendicular to both inputs — and the check is a ' +
                'dot product, which is the operation from two points ago being used to audit the ' +
                'one from this one.',
              socratic:
                'You have a candidate perpendicular. Which operation already in hand decides ' +
                'whether one vector is perpendicular to another, and what does it give for each ' +
                'of u and v here?',
            },
            {
              label: 'Recognise the answer, and read the previous point backwards',
              detail:
                '(2, −1, 2) is n — not a multiple of it, exactly it. The previous point went from ' +
                'a normal vector to the equation of a plane; this goes from two directions lying ' +
                'in a surface to its normal. Two non-parallel displacements determine a plane, ' +
                'and the cross product is how its equation is got out of them.',
              socratic:
                'Compare (2, −1, 2) with the normal of the plane u and v were taken from. What ' +
                'has the cross product just computed — and which way does that run compared with ' +
                'the previous point?',
            },
            {
              label: 'Swap the arguments and find out what the convention was for',
              detail:
                'v × u = (2·0 − 1·2, 1·1 − 0·0, 0·2 − 2·1) = (−2, 1, −2), which is −(u × v). It ' +
                'is perpendicular to both as well, and it is just as much a normal of the same ' +
                'plane. The plane cannot tell the two apart, so the ORDER of the arguments is ' +
                'carrying information the geometry does not have — which way round u and v sit. ' +
                'In the plane that same information was the SIGN of a₁b₂ − a₂b₁, one number\'s ' +
                'worth of it; in space it has become a direction. That is why this product is not ' +
                'commutative when adding, scaling and the dot product all were.',
              socratic:
                'Run the formula again with u and v the other way round. What has happened to ' +
                'every component — and given that both answers are perpendicular to both vectors, ' +
                'what is the order of the arguments deciding?',
            },
          ],
          answer:
            '(2, −1, 2) — which is exactly the normal of the plane u and v lie in. Reversed, ' +
            'v × u = (−2, 1, −2), equally perpendicular to both and equally a normal.',
        },
      },
    ],
  },

  {
    id: 'vector-spaces',
    name: 'Vector spaces',
    subjectId: subject.id,
    scope: {
      id: 'vector-spaces',
      /*
       * Carried verbatim from the map node, `terms` string and all, for the
       * reason the two promotions above state: the pattern decides against an
       * article title, and widening it while the material appears would move
       * the recognition figure in tests/atlas.mjs at the same time, leaving no
       * way to say which edit moved it.
       *
       * It can afford to be generous where `three-dimensional-coordinates`
       * could not, because "vector space" IS the phrase that means this
       * concept — an article using it is about this, and the three sibling
       * phrases in the hint (subspace, function space, polynomial space) are
       * the examples the material is built out of rather than other topics.
       */
      label: 'Vector spaces',
      hint: 'vector space axioms subspace function space polynomial space',
      match: /\bvector space\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, which is the rule `solid-measure`
     * made and `sequences` was the first promotion into an older subject to
     * keep. The five concepts above all name `justify` beside it and the build
     * ships no `justify` task anywhere, so those objectives name an observation
     * that cannot be made; matching the local style would have copied a fault
     * by being neighbourly.
     *
     * The statements are written to the tasks for the same reason. "Decide
     * whether W is a subspace" is the sentence this concept wants and it is
     * not an `evaluate` claim — what `evaluate` evidences is the NUMBER the
     * condition returns at a sum, which is what decides it. The deciding and
     * the saying-why are in the `socratic` phrasings below, asked by a tutor
     * and marked by nothing.
     */
    objectives: [
      {
        id: 'work-the-arithmetic-in-a-set-that-is-not-pairs',
        statement:
          'Produce a coefficient of a sum of polynomials and a value of a sum of functions — ' +
          'the component arithmetic of this subject, performed on objects that have no ' +
          'components.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-numbers-the-subspace-test-turns-on',
        statement:
          'Produce the value a subset\'s defining condition returns at the sum of two of its ' +
          'members, and the coordinate that puts a partly specified point into the subset.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-value-that-disqualifies-a-set',
        statement:
          'Produce the value that fails the test for a plane missing the origin and for a pair ' +
          'of axes taken together, which are the two ways a subset falls short of being a ' +
          'subspace.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-axioms-are-the-rules-the-components-already-used',
        conceptId: 'vector-spaces',
        statement:
          'A vector space is a set with an addition and a scaling obeying eight rules the ' +
          'component arithmetic already obeyed: addition commutes and associates, there is a ' +
          'zero and every vector has a negative, scaling distributes over a sum of vectors and ' +
          'over a sum of scalars, scaling twice is scaling by the product of the two scalars, ' +
          'and scaling by 1 changes nothing. Writing them down adds nothing to the plane. What ' +
          'it buys is everything else, because no argument in this subject ever used the fact ' +
          'that a ' +
          'vector was a PAIR — so any other set with those two operations inherits span, ' +
          'independence and every consequence drawn from them, with no change of argument.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points, which is a
         * decision rather than an omission. The arithmetic here is a coefficient
         * and a substitution and is already timed one concept down, where
         * `space-adds-one-coordinate-and-one-term` carries the target for it.
         * What this concept adds is a TEST — which three things to check, and
         * which of them a value has just settled — and a timing target on that
         * measures typing, which is the case types.ts names when it argues the
         * field should usually be absent.
         */
        workedExample: {
          problem:
            'p = 2 + 3x − x² and q = 1 − x + 4x². Find the coefficient of x² in 2p + q, and ' +
            'say which facts about polynomials the calculation used.',
          subgoals: [
            {
              label: 'Scale and add in the only way the operations allow',
              detail:
                'Scaling 2p multiplies every coefficient of p by 2, and adding q collects terms ' +
                'of matching power. Neither move carries anything from one power to another, so ' +
                'the x² coefficient of the answer is built from the x² coefficients of p and q ' +
                'and from nothing else in either polynomial.',
              socratic:
                'Scaling and adding polynomials never turns an x term into an x² term. Given ' +
                'that, which of the six numbers written in p and q can affect the x² ' +
                'coefficient of 2p + q?',
            },
            {
              label: 'Compute the single coefficient asked for',
              detail: 'p contributes −1 and q contributes 4, so the coefficient is 2·(−1) + 4 = 2.',
              socratic:
                'The x² term of p is −x² and the x² term of q is 4x². What is left after ' +
                'doubling the first and adding the second?',
            },
            {
              label: 'Audit the calculation for anything polynomial in it',
              detail:
                'There was nothing. The three coefficients of a degree-≤2 polynomial were ' +
                'handled exactly as a triple (a₀, a₁, a₂) is handled — scale each entry, add ' +
                'entrywise — so 2p + q was 2u + v on triples under another name. Every argument ' +
                'this subject made about triples therefore holds for these polynomials: the ' +
                'span of {1, x, x²} is all of them, 1 + x and 2 + 2x are dependent, and neither ' +
                'claim has to be proved a second time.',
              socratic:
                'Write p and q as the triples (2, 3, −1) and (1, −1, 4). What is the difference ' +
                'between the calculation you have just done and computing 2u + v?',
            },
            {
              label: 'Push the same idea until the components run out',
              detail:
                'Functions add pointwise: f + g is the function whose value at each x is ' +
                'f(x) + g(x). For f(x) = x² and g(x) = 3x that gives (f + g)(2) = 4 + 6 = 10. ' +
                'All the rules hold — the zero function is a zero, −f is a negative, scaling ' +
                'distributes — and yet there is no finite list of coordinates to read off, ' +
                'because the rule has to be given at every x at once. So "vector" is a ' +
                'behaviour and not a shape, which is why the next question the subject asks is ' +
                'how many independent directions a space has rather than how many numbers an ' +
                'element is written with.',
              socratic:
                'There are no components to add here and f + g is still perfectly well defined. ' +
                'What is the rule that says what the sum is at one particular x?',
            },
          ],
          answer:
            '2 — and the only facts used were "scale each coefficient" and "add like powers", ' +
            'which is entrywise arithmetic on triples',
        },
      },
      {
        id: 'a-subspace-is-a-subset-that-passes-three-checks',
        conceptId: 'vector-spaces',
        statement:
          'A subset W of a vector space is a subspace when it contains the zero vector, is ' +
          'closed under addition, and is closed under scaling. Pass those three and W is a ' +
          'vector space in its own right, so nothing about it has to be proved again. The ' +
          'example to keep is the plane through the origin: its condition is n·r = 0 for the ' +
          'normal vector n, and both closures come out of one line of component algebra rather ' +
          'than out of a new idea.',
        position: 2,
        workedExample: {
          problem:
            'W is the set of points in space with 2x − y + 2z = 0 — the plane through the ' +
            'origin whose normal vector is n = (2, −1, 2). Take u = (2, 2, −1) and ' +
            'v = (1, 0, −1), and test u + v.',
          subgoals: [
            {
              label: 'Spend the cheapest of the three checks first',
              detail:
                'At (0, 0, 0) the left-hand side is 0, which is the value the condition demands, ' +
                'so the zero vector is in W. This is the check to make first because it is one ' +
                'substitution and, when it fails, it finishes the question outright.',
              socratic:
                'Before testing any sum, put (0, 0, 0) into 2x − y + 2z. What does it come to, ' +
                'and what does the condition require of that number?',
            },
            {
              label: 'Confirm that both vectors really are members',
              detail:
                'For u: 2·2 − 2 + 2·(−1) = 4 − 2 − 2 = 0. For v: 2·1 − 0 + 2·(−1) = 2 − 2 = 0. ' +
                'Both satisfy the condition, so what follows is a question about two MEMBERS of ' +
                'W and not about two arbitrary points of space — closure says nothing about ' +
                'those.',
              socratic:
                'The closure claim is only about members of W. What does 2x − y + 2z come to at ' +
                'u, and at v?',
            },
            {
              label: 'Add the two vectors and test the result',
              detail:
                'u + v = (3, 2, −2), and 2·3 − 2 + 2·(−2) = 6 − 2 − 4 = 0, so the sum is in W ' +
                'as well. That is one instance of closure under addition and not yet the claim.',
              socratic:
                'Add u and v componentwise and put the result into the condition — what value ' +
                'does it return?',
            },
            {
              label: 'Settle every pair at once, from the components',
              detail:
                'The left-hand side is the dot product n·r. Coordinate by coordinate, u + v ' +
                'contributes nᵢ(uᵢ + vᵢ) = nᵢuᵢ + nᵢvᵢ to it, so the whole sum splits into ' +
                'n·u + n·v = 0 + 0 = 0. Scaling is the same line: cu contributes ' +
                'nᵢ(cuᵢ) = c(nᵢuᵢ), so n·(cu) = c(n·u) = 0. No numbers appear in either ' +
                'argument, which is why one plane through the origin standing up to the test is ' +
                'evidence about all of them.',
              socratic:
                'The condition is really n·r = 0, and each coordinate of u + v contributes ' +
                'nᵢ(uᵢ + vᵢ) to that product. Expanding that bracket splits the whole sum into ' +
                'what?',
            },
          ],
          answer:
            '0 — u + v satisfies the same condition, and splitting n·(u + v) shows every sum of ' +
            'members must',
        },
      },
      {
        id: 'the-three-checks-are-independent',
        conceptId: 'vector-spaces',
        statement:
          'The test has three parts because each can fail while the others hold. A plane that ' +
          'misses the origin fails the zero check, and fails addition too — adding two of its ' +
          'points doubles the constant, and 0 is the only constant that survives doubling. The ' +
          'two axes taken together fail nothing but addition: the set holds the zero vector and ' +
          'every scalar multiple of a member, and still loses a sum.',
        position: 3,
        workedExample: {
          problem:
            'Two sets that are not subspaces, failing differently. V is the plane ' +
            '2x − y + 2z = 6, and P = (1, 2, 3) and Q = (2, 4, 3) are both on it. S is the set ' +
            'of points of the plane with xy = 0 — the two axes together. Find what each set\'s ' +
            'condition returns at P + Q, and at (1, 0) + (0, 1).',
          subgoals: [
            {
              label: 'Disqualify the shifted plane in one substitution',
              detail:
                'At (0, 0, 0) the left-hand side of V\'s condition is 0 and the condition ' +
                'demands 6, so the zero vector is not in V and V is not a subspace. It is a ' +
                'perfectly good plane; what it is not is a set the algebra of this concept ' +
                'applies to, which is a statement about that algebra rather than about its ' +
                'geometry.',
              socratic:
                'V\'s condition reads 2x − y + 2z = 6. What does the left-hand side come to at ' +
                'the origin, and what does the mismatch settle?',
            },
            {
              label: 'Watch the constant double when two members are added',
              detail:
                'P and Q are both on V: 2 − 2 + 6 = 6 and 4 − 4 + 6 = 6. Their sum is ' +
                'P + Q = (3, 6, 6), where the condition returns 2·3 − 6 + 2·6 = 6 − 6 + 12 = 12 ' +
                '— which is 2 × 6 and not 6. The splitting from the previous point says why in ' +
                'general: n·(P + Q) = n·P + n·Q = d + d, so a set with any member at all is ' +
                'closed under addition only if d + d = d, and the only d satisfying that is 0. ' +
                'For a set cut out by one linear equation the first check and the second are ' +
                'therefore the same condition wearing two faces.',
              socratic:
                'P and Q each return 6, and the last point showed how n·(P + Q) splits. What ' +
                'must the sum return — and which constants d could survive that?',
            },
            {
              label: 'Find a set where the checks come apart properly',
              detail:
                'S = {(x, y) : xy = 0} is the two axes together. The zero vector is in it, since ' +
                '0·0 = 0. Every scalar multiple of a member is in it, since ' +
                '(cx)(cy) = c²·xy = 0. But (1, 0) and (0, 1) are both in S and their sum is ' +
                '(1, 1), where the condition returns 1·1 = 1 rather than 0. Two checks pass, the ' +
                'third fails, and no amount of the first two implies it — which is why the test ' +
                'is three conditions and not one.',
              socratic:
                'Both axes belong to S, so (1, 0) and (0, 1) are members of it. Where does their ' +
                'sum land, and what does xy come to there?',
            },
            {
              label: 'Name what that failure costs and what repairs it',
              detail:
                'Each axis on its own IS a subspace — it is the span of one vector, which is the ' +
                'line this subject met two concepts ago. The union of two subspaces is not one ' +
                'unless one of them contains the other, because a sum can leave both pieces ' +
                'while staying inside neither. The repair is the span: span{(1, 0), (0, 1)} is ' +
                'the whole plane, and it is the smallest subspace containing S. Every span ' +
                'passes the three checks automatically, which is where most subspaces come from.',
              socratic:
                'Each axis by itself is the span of a single vector, and so passes all three ' +
                'checks. What goes wrong when you take the two axes together instead of the span ' +
                'of both vectors?',
            },
          ],
          answer:
            '12 at P + Q, where V demands 6; and 1 at (1, 1), where S demands 0',
        },
      },
    ],
  },
]

/**
 * The edges. A FORK now, plus the credit that flows back down it.
 *
 * It was a chain of four for as long as the subject was four concepts, and the
 * fifth promotion ended that: `dot-product-geometry` rests on `plane-vectors`
 * and on nothing else in here, so the subject branches at the second concept
 * into the span line and the product. Worth stating because an assertion
 * written as one ordered string — "the subject is this chain" — would pass
 * while quietly accepting the new concept hung off the wrong parent, and
 * tests/atlas.mjs now checks the branch point by name instead.
 *
 * It rests on `plane-vectors` rather than on `linear-independence`, which is
 * the near miss and is worth one line because `the-cross-check` and the dot
 * product are the same four numbers combined two ways. They are not
 * dependent on each other: the product needs components and a magnitude, which
 * is `plane-vectors`, and nothing about redundancy or span. Filing it above
 * independence would gate it behind material it never uses.
 *
 * No edge to `determinant`, deliberately — see the header. `the-cross-check`
 * IS a determinant and says so in prose, but an edge would close a cycle
 * through `matrices-and-maps` and cost `teachingOrder` its answer for every
 * subject.
 *
 * The first edge below used to live in `coordinate-geometry.links`, because
 * `cartesian-plane` was a map node and only one end was authored. Promoting
 * the plane into this subject put both ends here, so the edge is declared on
 * the concept that depends on it like any other — and the `links` entry was
 * removed rather than left in place, since two identical edges in the composed
 * graph is not a redundancy the loader would notice. Its rationale came with
 * it; it is the reason the plane is the first concept and not an aside.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'cartesian-plane->plane-vectors',
    from: 'cartesian-plane',
    to: 'plane-vectors',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Components are coordinates read as a displacement, so the plane and its axes have to ' +
      'mean something before a vector can be written as a pair.',
  },
  {
    id: 'plane-vectors->vectors-and-spans',
    from: 'plane-vectors',
    to: 'vectors-and-spans',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
  },
  {
    id: 'vectors-and-spans->linear-independence',
    from: 'vectors-and-spans',
    to: 'linear-independence',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
  },

  {
    id: 'vectors-and-spans=>plane-vectors',
    from: 'vectors-and-spans',
    to: 'plane-vectors',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Forming a linear combination scales and adds vectors, so every span task performs the ' +
      'component arithmetic the previous concept is about.',
  },
  {
    id: 'linear-independence=>vectors-and-spans',
    from: 'linear-independence',
    to: 'vectors-and-spans',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Deciding independence is deciding whether one vector lies in the span of the others, so ' +
      'an independence question is a span question with a yes/no answer.',
  },

  /*
   * The fifth promotion's two edges. The prerequisite was stranded by the node
   * leaving the map and had somewhere to go; the `encompasses` is a new claim
   * and had to earn its place.
   *
   * This file refused an `encompasses` edge once already — from `plane-vectors`
   * down to `cartesian-plane` — and gave the test: the claim is about what
   * PRACTISING exercises, and measured against the tasks that actually exist it
   * did not hold, because the vector tasks are handed components as numbers and
   * never locate a point or decide a quadrant. The same test applied here
   * passes, and naming which tasks is what makes that checkable rather than
   * asserted: `cosine-exact-1` and `cosine-aligned-1` each compute two
   * magnitudes as `(u1^2 + u2^2)^(1/2)`, which is `magnitude-1` verbatim, and
   * `dot-product-self-1` computes the same sum of squares one layer in. So
   * somebody who has just produced a cosine has demonstrated the magnitude, and
   * `plane-vectors` should not come due as though untouched.
   *
   * The claim is deliberately narrow. It is not that the dot product exercises
   * all of `plane-vectors` — nothing here adds two vectors tip to tail or
   * scales one — but `encompasses` is read by the scheduler as credit toward the
   * concept, and two of its three knowledge points are about component
   * arithmetic that every task below performs.
   */
  {
    id: 'plane-vectors->dot-product-geometry',
    from: 'plane-vectors',
    to: 'dot-product-geometry',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'The product is defined on components and its first consequence is that a·a is the square ' +
      'of a magnitude, so both halves of what a vector is — a pair of components, and a length ' +
      'got from them by Pythagoras — have to be in hand before the definition says anything.',
  },
  {
    id: 'dot-product-geometry=>plane-vectors',
    from: 'dot-product-geometry',
    to: 'plane-vectors',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Every cosine task computes two magnitudes from components by Pythagoras, which is exactly ' +
      'what the magnitude task below it asks for, so producing a cosine is evidence about the ' +
      'component arithmetic as well.',
  },

  /*
   * The thirteenth promotion's three edges. See the header section for which of
   * them was stranded, which came home from `linear-algebra.links`, and which
   * one went out to the map instead of in here.
   *
   * The first two are the ones that make this concept sit in the MIDDLE of the
   * subject rather than on the end: it rests on the dot product and span rests
   * on it. That is the first time anything has been inserted into an existing
   * chain in this file rather than hung off it, and it is why the array above
   * is no longer in teaching order.
   *
   * The `encompasses` edge had to earn its place the same way the dot product's
   * did — the claim is about what PRACTISING exercises, measured against the
   * tasks that exist rather than against the prose — and naming the tasks is
   * what makes it checkable. FOUR of this concept's eight tasks are a dot
   * product written out as `a1*b1 + a2*b2 + a3*b3`: `space-dot-product-1` and
   * `cross-product-perpendicular-1` are that sum on two different vectors,
   * `plane-constant-1` is it computing n·P for a plane's constant, and
   * `space-dot-self-1` is it applied twice to one vector. So somebody who has
   * just found a plane's constant has demonstrated the product, and
   * `dot-product-geometry` should not come due as though untouched.
   *
   * Four and not five, which is worth one line because the first draft of this
   * comment said five and enumerated four. The fifth candidate is
   * `space-magnitude-1`, and it is the same sum of squares under a one-half
   * power — a·a with a root on it. Counting it would have made the number true
   * of a looser claim than the one the test checks, so the claim is stated at
   * the shape the regex can see and the magnitude is left out of it.
   *
   * NO `encompasses` DOWN TO `vectors-and-spans`, and that is the refusal this
   * file keeps recording rather than leaving implicit. Nothing here forms a
   * linear combination, chooses weights, or decides whether a target is
   * reachable — the same test that refused `plane-vectors → cartesian-plane`
   * fails this for the same reason. The prerequisite edge runs the other way in
   * any case; credit flowing back down it would be a claim about span, which
   * the tasks do not support.
   */
  {
    id: 'dot-product-geometry->three-dimensional-coordinates',
    from: 'dot-product-geometry',
    to: 'three-dimensional-coordinates',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Every one of the three new facts is a dot product: the distance in space is a·a under a ' +
      'root, a plane is n·r = d, and the cross product is checked by dotting the answer against ' +
      'both inputs. The product has to mean something before any of the three can be stated.',
  },
  {
    id: 'three-dimensional-coordinates->vectors-and-spans',
    from: 'three-dimensional-coordinates',
    to: 'vectors-and-spans',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    /*
     * Carried verbatim from the `links` entry of `linear-algebra` this edge
     * came home from, in atlas-structures.ts. It is the sentence that argues
     * this subject was never meant to stop at two coordinates, so it is worth
     * keeping in the words somebody else wrote it in.
     */
    rationale:
      'Span is stated for vectors in any dimension, and the step past the plane is where it ' +
      'stops being obvious that the reachable set is a line or a plane rather than everything.',
  },
  {
    id: 'three-dimensional-coordinates=>dot-product-geometry',
    from: 'three-dimensional-coordinates',
    to: 'dot-product-geometry',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Four of this concept\'s eight tasks evaluate a three-term dot product — two of them on a ' +
      'pair of vectors, one of them n·P for a plane\'s constant, one of them a vector against ' +
      'itself — so practising in space is evidence about the product as well.',
  },

  /*
   * The twentieth promotion's ONE edge, and the one it refused.
   *
   * `vector-spaces` declared a single `needs`, pointing at `linear-independence`
   * — a concept of this ontology — so the whole of what the node stranded is
   * the entry below and no area `links` entry was needed. That is the cheapest
   * shape a promotion can have and it is why this candidate was chosen over
   * two with more dependents: a split `needs` costs a `links` entry three files
   * away from anything that mentions the concept, and that entry is the one
   * people drop.
   *
   * It is a LEAF of the subject, which no previous promotion here has been.
   * The dot product forked the chain, the three dimensions were inserted into
   * the middle of it, and this one hangs off the end: nothing in this ontology
   * rests on the axioms. What rests on them is in the `linear-algebra` AREA —
   * `basis-and-dimension` and `inner-product-spaces` both declare it in their
   * own `needs`, at the far end, so those two edges survive the node's deletion
   * untouched and resolve across the file boundary in `composeAtlas`. They are
   * also the whole reason the promotion is worth making: those two nodes were
   * gating on what the UNWRITTEN axioms rested on, and they now gate on the
   * axioms themselves.
   *
   * NO `encompasses` EDGE, and this file now refuses one for the third time.
   * The claim such an edge makes is about what PRACTISING exercises, measured
   * against the tasks that exist, and the precedent that decides it is one
   * concept down: `three-dimensional-coordinates` claims credit for the dot
   * product on FOUR of its eight tasks and the four are the ones whose `given`
   * is `n1*r1 + n2*r2 + n3*r3`, written symbol by symbol. `plane-membership-1`,
   * whose `given` is `2*x - y + 2*z`, was deliberately left out of that count.
   * Both of the closure tasks here are that same literal-coefficient shape —
   * the learner substitutes into a linear expression and never writes n as a
   * vector — so counting them as dot-product practice would claim credit on a
   * shape the file has already declined to count. The component addition inside
   * the brackets fails the same test for the same reason: `u + v` is formed
   * inside one expression and never reported, so nothing here is evidence about
   * `plane-vectors` either.
   */
  {
    id: 'linear-independence->vector-spaces',
    from: 'linear-independence',
    to: 'vector-spaces',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'The axioms are worth writing down only once the arguments they abstract have been made, ' +
      'and the independence test is the sharpest of them: it decides whether a description is ' +
      'redundant without ever asking what a vector is made of. A learner who has run the ' +
      'cross-check has the experience the definition is a summary of; one who has not reads it ' +
      'as a list of rules nobody needed.',
  },
]

export const VECTORS_AND_INDEPENDENCE: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
