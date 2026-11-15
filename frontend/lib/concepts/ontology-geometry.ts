/**
 * An eighth subject ontology: the first angle facts, the triangle, and the
 * parts of congruence, similarity and Pythagoras that do not need a drawing.
 *
 * ── Why these concepts, and why they were the ones available ──────────────
 *
 * `points-lines-angles` was a map node in `euclidean-geometry`, and it stands
 * on the route of "See what a matrix does to space" — the journey with the
 * fewest unwritten steps left on it (sixteen; the next one has nineteen, and
 * the other eight journeys have none). That route reaches the vectors through
 * `three-dimensional-coordinates`, which rests on the dot product, which rests
 * on right-triangle ratios, which rest on similarity and Pythagoras — so half
 * the remaining distance on that journey is school geometry, and every node of
 * it sits above this one.
 *
 * It is also the only concept on that route whose prerequisites are not
 * themselves unwritten, which is the property that makes material possible
 * rather than merely desirable. It has no prerequisites at all: the map
 * declares it a root, because the undefined terms and the first angle facts
 * rest on nothing earlier in mathematics. Writing a concept whose foundation
 * is a skeleton would mean either leaning on an empty node or quietly
 * reproducing the material it is missing.
 *
 * `triangle-basics` was promoted next, and the reason is the same test applied
 * a second time. The journey it is on had fifteen unwritten steps left and the
 * other one had eighteen, so this is still the shortest route to finish. Of
 * the fifteen, this is the only one whose prerequisites are all written — and
 * they are written because of the promotion above: its sole `needs` is
 * `points-lines-angles`, which was a skeleton until that file existed and is
 * now three knowledge points and six tasks. One promotion made the next one
 * possible, which is what authoring upward from a root buys and is worth
 * saying once: the cheapest next concept is almost always the one directly
 * above the last.
 *
 * `congruence` is the third, by the same test a third time, and it is the one
 * that had to argue with this file rather than just extend it. The journey it
 * is on had fourteen unwritten steps left and the other had seventeen, so it
 * is still the shortest route to finish. Of those fourteen, three had all
 * their prerequisites written: `real-number-line` and `ratio-and-rate`, both
 * still blocked by the area floor described below, and this one, whose sole
 * `needs` is `triangle-basics` — a skeleton until the promotion above, and now
 * three knowledge points and six tasks. That is the same "cheapest next
 * concept is the one directly above the last" pattern for the third time
 * running.
 *
 * ── THE FIGURE OBJECTION WAS REAL, AND IT WAS ONLY HALF RIGHT ─────────────
 *
 * This file previously listed `congruence` among the nodes that CANNOT be
 * written here, and the reason given was good: "why SSS is enough and SSA is
 * not" is a claim about two triangles the reader has to be looking at, and
 * prose detailed enough to replace the drawing stops being a worked example
 * and becomes a specification. None of that has been retracted. What was wrong
 * was treating the concept as a single block that the objection either took or
 * left, because the objection lands on the JUSTIFICATION of the criteria and
 * not on the rest of the concept — and the rest is most of it.
 *
 * So this is the split the triangle introduced, applied to a bigger node, and
 * the atlas had already anticipated the direction: `EUCLIDEAN_GEOMETRY`'s
 * comment ends by saying whoever authors `congruence` inherits the triangle's
 * unwritten side classification. Discharging that debt is the third knowledge
 * point here.
 *
 * WHAT SURVIVES BEING WRITTEN DOWN, and why each one needs no figure:
 *
 *   The correspondence. "ABC is congruent to DEF" is six equalities read off
 *   the letter order, and reordering the letters makes a different claim. That
 *   is a fact about NOTATION, settled by matching positions in two strings,
 *   and it is the error learners actually make. A drawing does not help with
 *   it and arguably hurts — the whole point is that the claim is in the names
 *   rather than in the picture.
 *
 *   The counting, and AAS. Six measurements, three force the rest; AAS is ASA
 *   plus the angle sum, since the third angle is one subtraction. That
 *   reduction is arithmetic on three numbers, done twice in the second worked
 *   example, and it is the prerequisite being used rather than restated. The
 *   refusal of AAA comes with it and needs no figure either: three angles
 *   contain no length, and a criterion has to fix size as well as shape.
 *
 *   The base angles. Pappus's argument — match ABC with ACB, the same triangle
 *   with two vertices swapped, and SAS applies because AB = AC, AC = AB and
 *   the angle at A is shared. This is the one that pays for the whole concept:
 *   it is figure-free in the strongest sense, since there is only ever ONE
 *   triangle, and it makes the first point's lesson structural rather than
 *   cautionary — a correspondence is so much not a picture that a triangle can
 *   have one with itself.
 *
 * WHAT IS STILL ABSENT, named rather than approximated:
 *
 *   The proofs of SSS, SAS and ASA. They are taken as given here, which is
 *   what Euclid does with SAS and is the honest position rather than a
 *   shortcut — each is a statement about laying one triangle onto another, and
 *   that is the figure-dependent content the objection above correctly
 *   identified. The second worked example therefore teaches choosing and
 *   applying a criterion, not establishing one, and says so.
 *
 *   SSA, and this one is blocked by the MAP and not only by the missing
 *   figure, which is worth separating. Refuting SSA means exhibiting two
 *   different triangles with the same side-side-angle data, and doing that
 *   numerically needs either the law of sines or coordinates and Pythagoras.
 *   `pythagoras` needs `similarity`, which needs `congruence`; and
 *   `law-of-sines-cosines` needs `right-triangle-trig`, which needs both.
 *   Every arithmetical route to the ambiguous case therefore runs through
 *   concepts that sit ABOVE this one, so writing it here would mean either a
 *   forward reference or a figure. The map has already filed it where it can
 *   be done — `law-of-sines-cosines` describes the ambiguous case as its own
 *   content — so there is nothing to invent, and the second knowledge point
 *   names SSA as absent instead of gesturing at it.
 *
 * `similarity` is the fourth, chosen by the same test a fourth time, and it is
 * the one this file had already nominated by name — see the section below on
 * the figure objection, which ends by saying similarity is the obvious place to
 * try the test next. The journey it is on had thirteen unwritten steps left and
 * the other had sixteen, so it is still the shortest route to finish. Of those
 * thirteen, it is the only one whose prerequisites are written OR blocked
 * rather than merely unwritten: `congruence` is authored by the promotion above
 * it, and `ratio-and-rate` is the area-floor casualty described below, which
 * has no material and gates nothing today. So this is the first promotion in
 * this subject that did NOT have all of its prerequisites written, and the
 * honest statement of what that cost is: nothing in the material, because a
 * ratio of two lengths is used here as arithmetic the arithmetic subject
 * already owns, and the dependency is recorded as an edge so the gate appears
 * by itself when that node is finally promoted.
 *
 * It is also the first promotion here that was NOT directly above the last in
 * the one-node-at-a-time sense — it has a second parent outside the line — and
 * that is exactly what made it the first expensive one. atlas-foundations.ts
 * records the consequence for the map, which is that `euclidean-geometry`
 * stopped being the area with promotions and no `links`.
 *
 * `pythagoras` is the fifth, by the same test a fifth time, and it is the
 * cleanest case the test has had. The journey it is on had twelve unwritten
 * steps left and the other had fifteen, so it is still the shortest route to
 * finish. Of those twelve, exactly three had all their prerequisites written —
 * `geometric-proof` and `quadrilaterals-and-polygons`, both resting on
 * `congruence` alone, and this one — once `real-number-line` and
 * `ratio-and-rate` are set aside as the area-floor casualties they have been
 * since the third promotion. `pythagoras` wins the tie on structure rather than
 * on taste: it is the only one of the three that blocks BOTH remaining branches
 * of that journey, since the route reaches the vectors through
 * `three-dimensional-coordinates`, which needs the dot product and the solids,
 * and `pythagoras` sits under the dot product via `right-triangle-trig` and
 * under the solids via `circles`. It has four dependents — `circles`,
 * `distance-and-midpoint`, `right-triangle-trig` and `diophantine-equations` —
 * which ties `geometric-proof` rather than beating it, so the branch argument
 * above is what actually decided the tie.
 *
 * One edge into it is of a kind no previous promotion here has touched:
 * `distance-and-midpoint` names `pythagoras` in `exercises` as well as in
 * `needs`, which `expandEdges` turns into an `encompasses` — the edge that
 * makes credit computable, so that exercising the coordinate distance formula
 * counts as exercising this concept and it does not come due as though
 * untouched. It is worth being exact about what the promotion did and did not
 * do to it. Before, both endpoints were empty nodes; now one of them is a real
 * concept. It still cannot fire, because `distance-and-midpoint` is itself
 * unwritten and nobody can exercise a concept with no knowledge points, so no
 * credit flows across it today. What changed is that it has become a half-live
 * edge rather than a wholly dormant one, and the remaining half is the other
 * endpoint's promotion. Recorded because `encompasses` is the one edge kind
 * whose absence is invisible — a missing gate shows up in the walk, and a
 * missing credit path shows up only as a learner re-drilling what they just
 * demonstrated.
 *
 * `real-number-line` and `ratio-and-rate` were the better-placed candidates on
 * the same route and are still blocked by the same thing — see below. Nothing
 * about that changed; it was not re-litigated, for the third promotion running.
 *
 * `quadrilaterals-and-polygons` is the sixth, and it is the first one that is
 * NOT directly above the last. The journey it is on had eleven unwritten steps
 * left and the other had fourteen, so it is still the shortest route to finish.
 * Of those eleven, two had all their prerequisites written once
 * `real-number-line` and `ratio-and-rate` are set aside as the area-floor
 * casualties they have been since the third promotion: this one and
 * `geometric-proof`, both resting on `congruence` alone — the same pair the
 * fifth promotion chose against, now with nothing left between them and the
 * habit that had been picking the winner.
 *
 * THE HABIT RAN OUT, which is the structural fact worth recording about this
 * promotion. Five times running, the cheapest next concept was the one directly
 * above the last, because the branch was being authored upward one node at a
 * time. Nothing sits directly above `pythagoras` that can be written:
 * `circles` also needs `geometric-proof`, `right-triangle-trig` is in
 * `trigonometry` and would start a lone subject, and `distance-and-midpoint`
 * and `diophantine-equations` are in other areas again. So the line ended, and
 * what was available was the other child of `congruence` — waiting since the
 * third promotion, when authoring that node fanned this area's roots out to
 * four. The consequence for the edge list is that this subject is a tree rather
 * than a chain for the first time; the note on
 * `congruence->quadrilaterals-and-polygons` in `EDGES` carries it.
 *
 * It beat `geometric-proof` on the thing types.ts cares about rather than on
 * taste, and the area file had already called it: `geometric-proof` is a node
 * about the ARGUMENT being the answer, its natural task kind is `justify`,
 * `justify` is not machine-rulable, and a concept every one of whose chains
 * ends with no ruling is the `chainsWithNoRuling` case. Writing it would have
 * added three chains that cannot become evidence, which is a worse outcome than
 * leaving it mapped. The polygons have the opposite property — the interior and
 * exterior totals are arithmetic on a total, which is the shape that has
 * survived prose five times here — so all six of its tasks are `evaluate` and
 * none of its chains is unrulable. `geometric-proof` is still the obvious next
 * place to try, and the question to answer BEFORE writing it is what in it can
 * be asked as a value at all.
 *
 * ── TWO BETTER-PLACED CANDIDATES WERE BLOCKED, AND BY A TEST, NOT BY TASTE ─
 *
 * `real-number-line` and `ratio-and-rate` are both on the same route with
 * every prerequisite already authored, and `real-number-line` is the better
 * concept to have written: it sits directly beneath `cartesian-plane`, which
 * IS authored, so promoting it would tighten a gate in the middle of a written
 * chain rather than at the bottom of an unwritten one.
 *
 * Both are nodes of `NUMBER_AND_ARITHMETIC`, and that area is down to exactly
 * five nodes after ten promotions. tests/atlas.mjs asserts that no area has
 * fewer than five ("no area is a stub"), so the next promotion out of there
 * trips it — which the area's own comment anticipates, and answers: merge the
 * remnant into a neighbouring area rather than lower the threshold. That is a
 * decision about the shape of the MAP, affecting which region a learner sees
 * four concepts filed under, and it is not a thing to do as a side effect of
 * writing a worked example. So it was left alone and recorded instead.
 *
 * ── AND THE BLOCK HAS SINCE BEEN LIFTED, BY THAT MERGE ────────────────────
 *
 * The paragraphs above are left standing because they are the record of three
 * promotions choosing against those two concepts, and that record is the
 * evidence that the deadlock was real rather than a theory. But their present
 * tense has stopped being true, and a reader arriving at "so it was left alone"
 * must not conclude it still is.
 *
 * `NUMBER_AND_ARITHMETIC` was merged into `ALGEBRA_FOUNDATIONS`, exactly as
 * this note said the answer would have to be, and the threshold was not
 * touched. `real-number-line` and `ratio-and-rate` are nodes of
 * `algebra-foundations` now, which has fifteen nodes and owes four concepts to
 * the two unfinished journeys — so promoting either of them costs nothing and
 * neither is an area-floor casualty any more. `EUCLIDEAN_GEOMETRY` had the
 * same wall three promotions ahead of it, holding five route concepts against
 * three releases of room, so it absorbed `COORDINATE_GEOMETRY` in the same
 * change and has twelve promotions of headroom against seven owed.
 * atlas-foundations.ts argues both merges where they happened.
 *
 * What that means for whoever authors next, since this file's whole job is to
 * say why the previous choice was made: the tie-break that produced six
 * geometry promotions in a row — "take the one whose prerequisites are all
 * written, and set the arithmetic pair aside" — no longer has a thumb on the
 * scale. `real-number-line` is the better concept to write of the two, for the
 * reason given above: it sits directly beneath `cartesian-plane`, which IS
 * authored, so promoting it tightens a gate in the middle of a written chain
 * rather than at the bottom of an unwritten one. That argument was never
 * refuted; it was only outvoted by an area count.
 *
 * ── Why a subject of its own ──────────────────────────────────────────────
 *
 * There is no geometry ontology to extend. Every existing subject declares a
 * boundary in its `covers` that this falls outside of — `arithmetic-foundations`
 * stops at the rationals, `expressions-and-equations` begins where a letter
 * stands for a number, and this concept needs neither. So it gets its own
 * subject, the same way `expressions-and-equations` did, and joins the rest of
 * the graph through the map rather than through an edge list here.
 *
 * It is registered THIRD in `ONTOLOGIES`, which is curriculum order: angle
 * facts are met alongside early algebra and long before polynomials, and they
 * need no algebra at all. Appending it last would claim geometry comes after
 * matrices.
 *
 * ── THIS TIGHTENS THE GATE, AS AUTHORING ALWAYS DOES ──────────────────────
 *
 * Before this file, `gatingPrerequisitesOf` looked straight through
 * `points-lines-angles` — no material, so no claim about mastery, so nothing
 * to gate on — and `triangle-basics` was therefore gated by nothing at all.
 * Now there is a concept in between that has to be demonstrated. That is the
 * design working rather than a regression, and it is checked by name in
 * tests/atlas.mjs.
 *
 * Promoting the triangles moved the same gate one step further up, and this
 * time for three other nodes rather than one. `congruence`,
 * `area-and-perimeter` and `law-of-sines-cosines` each declare
 * `triangle-basics` in their own `needs`, and until now that edge pointed at
 * an empty node, so the gating walk passed through it and landed back on the
 * angle facts. All three now have a second thing to demonstrate on the way,
 * and none of those three edges had to be touched to make it happen — they
 * are declared by nodes that stayed on the map, so they still own them.
 *
 * ── What is deliberately NOT here, and the honest reason ──────────────────
 *
 * The other seven nodes of `euclidean-geometry` stay mapped, and so does the
 * half of the polygons that could not come. The blocker is not time. The circle
 * theorems, area and the solids are about FIGURES, and this build has no
 * figure: `visualRef` exists exactly so that a knowledge point can name one,
 * and there are none to name. A prose description detailed enough to replace a
 * drawing stops being a worked example and becomes a specification.
 *
 * `congruence` was on that list and came off it, which was the first case where
 * the objection had to be taken apart rather than accepted or overruled — see
 * the section above. The test it produced is not "is this concept about
 * figures" but "is EVERY part of it about figures", and this file then
 * nominated similarity as the obvious place to try it next.
 *
 * THAT NOMINATION WAS TAKEN UP AND IT HELD, which is why the sentence making it
 * has been replaced by this account of what happened. The prediction was
 * accurate as far as it went: the correspondence half is the same notational
 * fact written with a ratio, so the first knowledge point here is the
 * congruence statement with three of its six claims weakened to one shared
 * ratio, and the justification of the criteria stayed behind exactly as
 * predicted. AA is taken as given here the same way SSS, SAS and ASA are taken
 * as given above, and for the same reason.
 *
 * What the prediction MISSED is the better half of the concept, and it is worth
 * recording because it is the second time this test has turned up more than it
 * was looking for. Similarity and congruence disagree about angle-only data,
 * and the disagreement is figure-free in the strongest sense — it is an
 * argument about two criteria rather than about any pair of triangles. Three
 * angles contain no length, so nothing in them can fix a size; a congruence has
 * to fix the size, so AAA is refused; a similarity claims only the shape, so AA
 * suffices. One fact, two opposite verdicts. The second knowledge point here is
 * built on it and the second worked example settles a similarity without being
 * given a single length, which is the cleanest possible demonstration that no
 * length was needed.
 *
 * So the test is sharper than "notation survives, pictures do not". What
 * survives prose is everything that is really a claim ABOUT CLAIMS — what a
 * statement asserts, what a criterion needs, what two criteria disagree about —
 * and that is a larger share of school geometry than the first version of this
 * objection assumed.
 *
 * ── THE FIFTH PROMOTION, AND THE PREDICTION THAT WAS WRONG ────────────────
 *
 * `pythagoras` was next by every measure the four promotions above used, and
 * this header told its author to expect the test to be HARDER there: one
 * identity and a converse, proofs that are dissections or similar-triangle
 * arguments about a figure, and "what is left once those are set aside is
 * arithmetic on three numbers, which is `roots-and-irrationals` doing the work
 * rather than this concept". It named the node as possibly the first where
 * every part really is about the figure.
 *
 * Half of that held and half of it did not, and the half that failed is the
 * same mistake the congruence paragraph made — identifying the concept with
 * its theorem. The proofs did stay behind, exactly as predicted and for the
 * stated reason. What the prediction got wrong was "arithmetic on three
 * numbers", which treated the identity as something you either apply or do
 * not. The identity has a SHAPE, and the shape is the content:
 *
 *   a² + b² = c² is not symmetric in its three letters. One of the three
 *   lengths is the hypotenuse, its square is the one that stands alone, and
 *   nothing in the three numbers says which. So using the relation at all
 *   begins with assigning a role — and the assignment decides whether the
 *   arithmetic is an addition or a subtraction. That is not arithmetic on three
 *   numbers; it is the same claim-about-a-claim that made the congruence letter
 *   order worth a knowledge point, and it has the identical failure mode, which
 *   is correct computation on mis-assigned slots. The first worked example
 *   hands 7 and 25 to two different problems and gets 24 and √674, which is the
 *   whole lesson in one pair of numbers.
 *
 *   The converse is a DECISION PROCEDURE, and the procedure is figure-free from
 *   end to end: sort three numbers, square them, compare. It also answers more
 *   than it is asked — the sign of a² + b² − c² separates acute from right from
 *   obtuse, so one subtraction classifies the triangle. And it is the second
 *   test on three lengths this subject has written, which makes it an argument
 *   about two criteria: the triangle inequality says whether three lengths
 *   close at all, the converse says what kind of triangle the closing one is.
 *   That is the shape the similarity paragraph identified as the best thing the
 *   test finds, and it is the third time it has turned up.
 *
 * So the figure test has now been run five times and has never yet found a node
 * where every part was about the picture. That is worth stating as a warning
 * rather than as a victory: the test is only useful if it can fail, and an
 * author who expects it to pass will find a way to make it pass. What was
 * genuinely left behind here is large and is named below — both proofs, and
 * with them the reason the identity is TRUE.
 *
 * WHAT IS ABSENT, named rather than approximated: the identity is taken as
 * given, like SSS, SAS, ASA and AA above it, and this is the biggest such debt
 * in the file. Every proof is about a figure. The dissection arguments
 * rearrange four copies of the triangle inside a square, and the
 * similar-triangle argument drops the altitude to the hypotenuse and reads off
 * two similarities — which is what the `similarity` prerequisite is FOR, and it
 * is worth being honest that the prerequisite therefore gates material this
 * concept does not contain. The edge is kept anyway and the note on it in
 * `EDGES` says why. The converse is likewise asserted rather than derived; it
 * follows from the law of cosines, which sits two concepts above this one, so
 * deriving it here would be a forward reference. The third point states the
 * acute/obtuse reading as a fact about the sign and does not claim to prove it.
 *
 * ── THE SIXTH PROMOTION, AND THE FIRST TIME THE TEST SPLIT A NODE ─────────
 *
 * `quadrilaterals-and-polygons` is the first node the figure test has taken
 * only PART of, and the part it refused is the part the area file predicted.
 * Five runs in a row had found the whole node writable, which that file called
 * a warning rather than a boast — a test that never fails is one an author
 * finds a way to pass — so this is the warning being earned rather than
 * repeated.
 *
 * WHAT SURVIVES, and why each one needs no figure:
 *
 *   The two totals. The interior angles of a convex n-gon add to
 *   (n − 2) × 180° and the exterior angles add to 360° whatever n is, and the
 *   second follows from the first by arithmetic on a total: the two angles at a
 *   vertex lie along a straight line, so the two totals come to n × 180°
 *   between them, and n × 180 − (n − 2) × 180 = 360. That is the shape the
 *   triangle's angle sum had and the shape "at most one angle can be 90° or
 *   more" had. It is also the only part of the concept that carries its own
 *   decision: a question about n has to be asked through the total n has
 *   already cancelled out of, and choosing the other one leaves the unknown in
 *   two places.
 *
 *   What a diagonal does to a correspondence. This is the congruence letter
 *   order used on a figure that is not a triangle, and the new content is
 *   exact and figure-free: the diagonal AC leaves the angles at B and D whole,
 *   so those two match as matched parts, and SPLITS the angles at A and C, so
 *   those two match only as SUMS of matched parts. Writing ABC congruent to
 *   ACD instead of CDA is the same error the first congruence point exists to
 *   stop, one object further up.
 *
 *   Where equal sides stop forcing equal angles. The best part of the concept,
 *   and it is the claim-about-claims shape for the fourth time — the one the
 *   similarity section identified as what this test actually finds. The
 *   base-angle theorem makes equilateral and equiangular ONE claim for a
 *   triangle, with every equal-sided triangle satisfying both. For a rhombus
 *   they are two claims, and exactly one figure satisfies both: a = 180 − a,
 *   so a = 90, the square. Every equal-sided triangle against one
 *   equal-sided quadrilateral, out of the same words. No figure anywhere in it.
 *
 * WHAT IS ABSENT, named rather than approximated, and this is the half the
 * prediction got right:
 *
 *   The triangulation. That the diagonals from one vertex cut an n-gon into
 *   n − 2 triangles is taken as given, like SSS, SAS, ASA and AA above it, and
 *   for the same reason — it is a statement about what a drawing does. So
 *   (n − 2) × 180 is asserted and the exterior total is DERIVED from it, which
 *   is the honest division of the point: the figure-dependent half is one
 *   sentence of hypothesis and the arithmetic on top of it is the material.
 *
 *   Convexity. Every claim here is about a convex polygon and says so. A
 *   reflex vertex turns the exterior-angle total into a statement about signed
 *   turning, and making that precise without a figure to point at is a longer
 *   piece of writing than the fact is worth at this level.
 *
 *   The diagonal properties, and these are the real debt. That a
 *   parallelogram's diagonals bisect each other, that a rhombus's are
 *   perpendicular, that a rectangle's are equal — each of them names which
 *   segments meet where, and the second point here deliberately uses a diagonal
 *   only to CUT the figure rather than to measure anything along it. The
 *   kite and the trapezium go with them: their definitions are about which
 *   pair of sides does what, which is a picture.
 *
 *   The hierarchy as a set of converses. "A parallelogram with one right angle
 *   is a rectangle" and its siblings are the interesting content of the family
 *   and every proof of one is a figure argument. What the third point writes
 *   instead is the one fact about the family that is not — that equilateral and
 *   equiangular come apart above three sides — and it names the rest as absent.
 *
 * The points below were chosen because they are the geometry that survives
 * being written down. A straight line and a full turn are numbers; a vertical
 * pair is equal by a subtraction done twice; a transversal across a parallel
 * pair produces two values and the argument for it is a translation. The
 * triangle passed the same test for the same reason: the angle sum is a number
 * and its proof is the transversal fact used once, the triangle inequality is a
 * comparison between two routes with no shape to inspect, and "at most one
 * angle can be 90° or more" is arithmetic on the total. None of those needs a
 * picture to be followed — which is also why they are the part of the subject
 * that can be practised here, and the rest is not.
 *
 * WHAT THE TRIANGLE LEFT BEHIND, because it is the sharper half of the same
 * test: the side classification. Equilateral, isosceles and scalene are named
 * in that concept's third point and deliberately not taught there, because the
 * fact that makes them useful — equal angles force equal sides and the
 * converse — is the base-angle theorem, proved from congruence. So the angle
 * classification was authored and the side classification was named as absent.
 * Splitting a node's material that way was new at the time and is the honest
 * shape when half of it survives prose and half does not; the alternative was
 * to write the sides from the angles without the theorem that connects them,
 * which would teach a result as a definition.
 *
 * THAT DEBT IS NOW PAID, by the third point of `congruence`, and it is the
 * reason the promotion was worth making in this order rather than reaching for
 * a cheaper node elsewhere on the route. The forward reference the triangle
 * concept wrote — "the base-angle theorem, proved from congruence, which has
 * no material in this build" — has stopped being true, and the sentence in
 * `at-most-one-angle-is-not-acute` that says so has been updated to point at
 * the point that discharges it. A forward reference left standing after the
 * thing it points at exists is how a file starts lying about itself.
 *
 * ── What the third promotion did to the gate, which is the usual story ────
 *
 * `congruence` was gated by `triangle-basics` already, so no gate moved for it
 * — the second promotion had done that. What moved is the gate on the four
 * nodes that rest on IT: `geometric-proof`, `similarity`,
 * `quadrilaterals-and-polygons` and `isometries-and-symmetry` each name
 * `congruence` in their own `needs`, and until now that edge pointed at an
 * empty node, so `gatingPrerequisitesOf` passed through it and landed on the
 * triangles. All four now have a third concept to demonstrate on the way, and
 * none of those four edges was touched — they are declared by nodes that
 * stayed on the map, so they still own them.
 *
 * The area's own root moved with it, as the area comment predicted it would
 * keep doing: `areaOntology` keeps only edges internal to the area, so viewed
 * alone `euclidean-geometry` now shows those same four nodes as roots where it
 * showed `congruence` before. Four rather than one, because the node that left
 * was the single thing all four of them rested on.
 *
 * ── What the fourth promotion did, which is the same story once more ──────
 *
 * `similarity` was gated by `congruence` already — the third promotion had
 * done that — so no gate moved for it. What moved is the gate on the one node
 * that rests on IT: `pythagoras` names `similarity` in its own `needs`, and
 * until now that edge pointed at an empty node, so `gatingPrerequisitesOf`
 * passed through it and landed on `congruence`. It now has a fourth concept to
 * demonstrate on the way. One node rather than three or four, because
 * `similarity` was holding up less of the area than `congruence` was, and that
 * edge was not touched either.
 *
 * The area's roots moved by SUBSTITUTION this time rather than by fanning out:
 * `similarity` left the set of four and `pythagoras` joined it, since
 * `pythagoras` was the one node resting on the departing one and its other
 * prerequisite had already left the area. Four roots before and four after,
 * with completely different membership — which is why tests/atlas.mjs asserts
 * that set by name and not by its size.
 *
 * ── What the fifth promotion did, which is the first SHRINKAGE ────────────
 *
 * `pythagoras` was gated by `similarity` already — the fourth promotion had
 * done that — so no gate moved for it. What moved is the gate on `circles`,
 * the one node that names it in `needs` and stays on the map. That edge used
 * to point at an empty node, so the gating walk passed through it and landed on
 * `similarity`; `circles` now has a fifth concept to demonstrate. One node
 * again, and the edge was not touched, for the fifth time.
 *
 * The area's roots did something new, and it is the reason the assertion about
 * them had to change rather than merely be extended. Every previous promotion
 * either fanned the set out or substituted into it, and the count never fell.
 * This one SHRANK it, from four to three: `pythagoras` left, and nothing
 * replaced it. The node resting on it is `circles`, which did not become a root
 * because its OTHER prerequisite, `geometric-proof`, is still in the area and
 * still gates it from inside. So a departing node promotes its dependents to
 * roots only when it was the last of their prerequisites inside the area — the
 * four-way fan-out after `congruence` looked like the rule and was a special
 * case of it, since all four of those nodes rested on `congruence` alone.
 * Stated here because a reader who learned the pattern from the three
 * promotions above would predict `circles` joining the set, and it does not.
 *
 * ── What the sixth promotion did, which is a SUBSTITUTION again ───────────
 *
 * `quadrilaterals-and-polygons` was gated by `congruence` already — the third
 * promotion had done that, and this is the first promotion here to collect a
 * gate somebody else installed three moves earlier rather than one move
 * earlier. What moved is the gate on `area-and-perimeter`, the node's only
 * dependent anywhere in the atlas: it names both this node and
 * `triangle-basics` in its own `needs`, `triangle-basics` has gated it since
 * the second promotion, and this node was the half of that pair the walk was
 * still looking straight through. It now has to be demonstrated too. One
 * dependent again, and the edge was not touched, for the sixth time.
 *
 * The area's roots SUBSTITUTED rather than shrinking, which is the fourth
 * promotion's shape rather than the fifth's: `quadrilaterals-and-polygons` left
 * the set of three and `area-and-perimeter` joined it, because this node was
 * the last of that node's prerequisites inside the area — `triangle-basics`
 * had already gone. So three roots before and three after, with different
 * membership, which is exactly the case the assertion in tests/atlas.mjs is
 * written by NAME to catch and a count would have passed.
 *
 * ── NEVER GIVE A FIGURE BOTH ITS SIDES AND ITS ANGLES ────────────────────
 *
 * An authoring rule the whole file obeys, worth stating because it is easy to
 * break by accident and the break is silent. No small integer-sided triangle
 * has integer angles — the equilateral is the only exception — so a worked
 * example that states three whole-number sides AND two whole-number angles is
 * describing a figure that does not exist. Sides 8, 5 and 11 force angles of
 * 24.62°, 113.58° and 41.80°, not 24°, 115° and 41°.
 *
 * The first draft of `a-congruence-names-a-correspondence` did exactly that
 * and it was caught by checking the example rather than by any test, because
 * no test here can catch it: the task arithmetic is all exactly right, the
 * angle sum closes, the triangle inequality holds, and the figure is still
 * impossible. `verify.ts` rules answers, not the realisability of a problem
 * statement.
 *
 * So each worked example in this subject pins at most THREE independent parts
 * and leaves every other value unstated. That is why `triangle-basics` gives
 * angles with no sides in its first and third points and sides with no angles
 * in its second, and why the three congruence examples pin a side with two
 * angles, then a side with two angles in each of two triangles, then two equal
 * sides with the angle between them — AAS, ASA and SAS, which is to say each
 * example states exactly one criterion's worth of data and no more. The
 * unstated lengths cost nothing — in the first point they are an asset, since
 * "EF = BC with neither number known" is the cleanest statement of what a
 * correspondence does.
 *
 * The similarity examples obey the rule the easy way, by never mixing the two
 * kinds at all: the first and third state lengths only, the second states
 * angles only. That is not caution, it is what the material wanted. A
 * similarity example needs two figures, so the realisability problem would be
 * twice as easy to trip — and the one example that could have mixed them has
 * the better reason not to. The second point exists to show that angles alone
 * settle a similarity, so stating ANY length in it would undercut the thing it
 * is demonstrating. Its last subgoal reads the scale factor off and finds
 * nothing to read, which only works because nothing was given.
 *
 * One consequence worth naming, since it looks like an omission: the first
 * similarity example pins AB, BC and the scale factor, and leaves CA and FD
 * unstated. Three parts about the first triangle would have fixed its shape
 * completely; two sides and a ratio do not, and the triangle is deliberately
 * left underdetermined. The same asset falls out as in congruence — "FD is 5/3
 * of CA with neither length known" is the cleanest statement of what a
 * similarity does to a pair of sides, and it is only available because neither
 * was given.
 *
 * PYTHAGORAS CANNOT OBEY THE RULE THE EASY WAY, and it is the first concept
 * here that cannot, so the rule needed restating rather than reapplying. Every
 * example in it is about a right triangle, which means one angle is pinned at
 * 90° before anything else is chosen — an integer angle, stated, in a figure
 * that also states integer sides. That is not a violation, and the reason is
 * the one the rule rests on: the right angle is not an independent part. It is
 * the hypothesis of the theorem, and it is what makes the three sides satisfy
 * the relation rather than being free. So the budget of three independent parts
 * is spent as the right angle plus two sides, and the THIRD side is computed
 * rather than stated — which is exactly what the problems ask for.
 *
 * That makes the realisability check easy to pass and worth doing anyway, since
 * passing it accidentally is not the same as passing it. 7, 24, 25 and 9, 40,
 * 41 are Pythagorean triples, so each is a genuine right triangle with three
 * whole-number sides and one whole-number angle; their other two angles are
 * irrational in degrees and are never stated. 6, 12, 6√5 and 9, 12, 15 are
 * likewise real. The one triangle in the file that is NOT right is 8, 40, 41 in
 * the third point, and it is the one place a figure could have been impossible:
 * it is realisable because 8 + 40 = 48 exceeds 41, which the example checks out
 * loud as part of the triangle-inequality subgoal rather than in a comment. No
 * angle of it is stated at all — the point establishes only that one of them is
 * obtuse, which is a sign and not a measurement.
 *
 * The isosceles right triangle was avoided on purpose, and it is the near miss
 * worth recording. Legs 6 and 6 give the hypotenuse 6√2, which is a perfectly
 * real figure, so the rule would not have been broken — but its other two
 * angles are 45° each, and an example stating two equal legs is one careless
 * sentence away from stating them. Legs 6 and 12 cost nothing and remove the
 * opportunity, and they give the better surd besides: 180 = 36 × 5 reduces to
 * 6√5, where 72 = 36 × 2 reduces to the 6√2 that every reader already knows.
 *
 * THE POLYGONS OBEY THE RULE THE EASY WAY, and more completely than any
 * concept here: not one of their three examples states a single length. The
 * regular 15-gon is given one angle, the parallelogram is given one angle, and
 * the rhombus is given one angle plus the statement that its four sides are
 * equal to EACH OTHER — which is a relation between the sides and not a
 * measurement of any of them, so it spends none of the budget of three
 * independent parts. The third example's whole argument is that those equal
 * sides constrain nothing about the angles, and naming a length would have
 * invited the reader to look for a figure where the point is that no figure is
 * determined.
 *
 * The 64° is deliberately not 60° or 90°, and that is the near miss here. A 90°
 * parallelogram is a rectangle and a 90° rhombus is a square, so either value
 * would have made the second and third examples silently special — the third
 * one would have found 180 − a = a at the very value it is supposed to compare
 * against, and the whole distinction would have collapsed into one figure.
 * 64 and 116 cost nothing and keep the two cases apart.
 *
 * ── Why nearly every task is `evaluate`, and what that costs ──────────────
 *
 * The natural ask in these concepts is "find the missing angle, and name the
 * fact you used", and the second half is not machine-rulable: no `NamedForm`
 * describes a reason. So each task asks the arithmetic the fact licenses and
 * names in its prompt which decision it is standing in for — the same proxy
 * the rational-expressions tasks make for "state the excluded points", with
 * the same rule, that the proxy must be named so nobody later mistakes it for
 * the objective.
 *
 * `pythagoras` broke the run of twenty-four, with ONE `transform_to_form`, and it is
 * the first task in the subject that asks for a shape rather than a value.
 * `reduce-the-hypotenuse-surd-1` asks for √180 as 6√5 under the `surd_reduced`
 * form. That ask is the honest one for the second knowledge point — the whole
 * point of which is that the answer is irrational and the surd IS the answer —
 * and asking it as an `evaluate` would have been impossible rather than merely
 * weaker: `exactValue` returns null on √180, honestly, because there is no
 * exact rational to return. So the alternative was not a worse task, it was no
 * task, and the point would have been left scoring the addition that precedes
 * it while the content went unexamined.
 *
 * It costs the subject nothing in worker-independence, which is the contract
 * that mattered and the reason this was checked before it was written rather
 * than after. `transform_to_form` used to route unconditionally to the CAS, and
 * `roots-and-irrationals` is where that was fixed: `asSurd` in numerals.ts puts
 * both sides in normal form, which is a decision rather than a heuristic
 * because √r for distinct square-free r are linearly independent over Q. So
 * this task rules `correct` for 6√5 and `incorrect` for an unreduced √180, with
 * the radicand named in the diagnostic, and consults nothing. That earlier fix
 * is what made this ask available, which is worth recording as the shape of
 * how the engine's gaps actually close — the form and the local checker landed
 * in one subject, and a different subject two promotions later gets a task it
 * could not otherwise have asked.
 *
 * The consequence worth stating plainly: a learner who subtracts from 180
 * when the figure called for 360 gets the arithmetic question right. Choosing
 * between the two sums is the skill, it is the first subgoal of the first
 * worked example, and no task here can score it. The triangle tasks pay the
 * same price in a second currency — a `counterexample` kind exists, and "three
 * lengths that do not close" is exactly the object it describes, but it is
 * rulable only when the claim is an identity and this one is an inequality. So
 * the inequality is asked as the subtraction whose SIGN is the ruling, which
 * at least puts the decision in the answer rather than nowhere.
 *
 * The similarity tasks are where that run of losses finally turns, and it is
 * worth stating because four blocks of apologia in a row would otherwise read
 * as a limit of the engine rather than of the asks. A reversed letter order
 * produces a FALSE PROPORTION, and a false proportion is two numbers that fail
 * to be equal — which is a value, and so is rulable. So
 * `the-reversed-order-is-false-1` scores the exact thing the congruence block
 * below could only assert: it is an arithmetic refutation of a misread
 * correspondence rather than a proxy for one. The reading is still unscored
 * when it is CORRECT — that asymmetry is real and is named in the prompts — but
 * the concept is no longer entirely unable to catch the error it is about.
 *
 * The congruence tasks pay it in a third currency, and this one is the
 * sharpest of the three because the concept is MOSTLY the unscorable half.
 * What the first point teaches is that the letter order carries the claim, and
 * the object that would evidence it is a correspondence — not a value and not
 * a form, so no verifiable kind takes it. So those tasks ask the arithmetic
 * that a correspondence licenses once it has been read, and the reading itself
 * is unscored: a learner who pairs the vertices wrongly and then does the
 * subtraction correctly still scores the mark. That is named in both prompts.
 * The second point's criterion-naming is unscorable for the same reason — SSS,
 * SAS and ASA are not values — and what its tasks score is the angle-sum
 * arithmetic that turns AAS into ASA, which is the one mechanical step in it.
 *
 * The polygon tasks are the mildest case in the subject, which is worth saying
 * after five blocks that each name a loss. Two of the three points are about
 * values rather than about readings. "How many sides" is a number, and
 * `exterior-angle-counts-the-sides-1` asks it as the whole computation —
 * subtract at one vertex, divide the constant total — rather than as a proxy
 * for anything. "Are the four angles equal" is a difference of two numbers, so
 * `equal-sides-left-the-angles-unequal-1` REFUTES the equiangular reading
 * arithmetically, the same gain `the-reversed-order-is-false-1` made for
 * similarity. What stays unscored is the choice of which total to work in,
 * which is the first subgoal of the first example and the only real decision in
 * it: a learner handed "evaluate 360/(180 − x)" has been given that choice, and
 * the prompt says so.
 *
 * Every task is settled by exact rational arithmetic, so the subject needs no
 * math worker — which matters because it sits at the bottom of the geometry
 * branch and a worker outage must not wall off a root of the map.
 *
 * ── No `automaticityTarget` on any point but the first ────────────────────
 *
 * Deliberate, and not by copying the two untimed points above it. The timed
 * point in this file is `two-sums-every-angle-chase-uses`, and what it times
 * is taking a known total apart — 180 minus what you have. The triangle's
 * angle sum is that same subtraction with the same 180, so a second target on
 * it would time the same operation twice and report it as two skills. The
 * inequality is a decision with an argument behind it, and the classification
 * point is arithmetic used to rule something out. None of the three is a
 * fluency skill that is not already measured.
 *
 * The three congruence points are untimed for a reason that is nearly the
 * opposite and lands in the same place. Every one of them is an argument about
 * a correspondence, and the arithmetic they contain is that same 180-minus
 * subtraction a third time. Timing the first point would be worse than
 * useless: the error it exists to prevent is reading a letter order too
 * quickly, so rewarding speed there would train the mistake.
 *
 * The three similarity points inherit that last argument exactly. The first is
 * the congruence correspondence with a ratio in it, so it is the same
 * read-it-slowly skill and timing it would train the same haste. The second is
 * the 180-minus subtraction a fourth time, wrapped in an argument about what
 * two criteria disagree about. The third is a rearrangement of a proportion,
 * which is one algebraic move and then a comparison — and the comparison is the
 * content, since the whole point is that the two ratios are different numbers.
 * Nothing in the concept is a fluency skill that is not already measured.
 *
 * The three Pythagoras points are untimed for all three of the reasons above,
 * one each, which is the tidiest the argument has been. The first is the
 * read-it-slowly case verbatim: the error it exists to stop is assigning the
 * hypotenuse's slot too quickly, so a speed reward would train exactly the
 * mistake. The second would time an operation the file does not own — reducing
 * a surd is `pull-the-square-out` in `roots-and-irrationals`, which is itself
 * untimed there, and what this point adds in front of it is one addition. The
 * third is a decision with an argument behind it, like the triangle
 * inequality, and the arithmetic carrying the decision is two squarings and a
 * subtraction that the first point already covers. So the file still has
 * exactly one target in it, after five concepts and fifteen points.
 *
 * The three polygon points make it eighteen and still one, and they hit the
 * same three reasons a third time. The first point's arithmetic is the
 * straight-line subtraction the timed point already measures, followed by one
 * division; timing it would report one skill as two, which is the triangle's
 * argument verbatim. The second point is the read-it-slowly case — the error it
 * exists to stop is matching ABC with ACD, and a speed reward trains exactly
 * that. The third is a decision with an argument behind it, like the triangle
 * inequality and the Pythagorean converse. Nothing in the concept is a fluency
 * skill that is not already measured, which is now true of fifteen points out
 * of eighteen and is a claim about the material rather than a convention.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'plane-geometry',
  name: 'Plane geometry',
  covers:
    'The undefined terms and the first angle facts, the triangle as far as its numbers go, and ' +
    'congruence as far as it goes without a drawing: the two sums every angle chase uses, why a ' +
    'vertical pair is equal rather than merely alike, the two values a transversal makes across ' +
    'a parallel pair, the 180° angle sum and the exterior angle that falls out of it, which ' +
    'triples of lengths close into a triangle, why at most one of a triangle\'s angles can be ' +
    '90° or more, what a congruence statement\'s letter order actually asserts, why three of the ' +
    'six measurements are enough and AAS is ASA with the angle sum applied, and the base angles ' +
    'of an isosceles triangle got by matching the triangle with itself. The criteria SSS, SAS ' +
    'and ASA are taken as given rather than proved, and SSA is named as absent: refuting it ' +
    'needs two triangles drawn, or the law of sines, which sits above this subject. Then ' +
    'similarity on the same terms: what a similarity\'s letter order asserts once three of those ' +
    'six claims weaken from equalities to one shared ratio, why two angles settle a similarity ' +
    'when three could not settle a congruence, and why a ratio taken between two sides of one ' +
    'figure survives scaling it while the scale factor does not. AA is taken as given like the ' +
    'congruence criteria, and for the same reason. Then Pythagoras, as a relation to be used ' +
    'rather than proved: why its three letters are not interchangeable, so that finding a leg ' +
    'subtracts where finding the hypotenuse adds, why a side is the positive root only and is ' +
    'normally an irrational best left as a reduced surd, and the converse read as a test on three ' +
    'lengths whose sign separates acute from right from obtuse. Both proofs of the identity are ' +
    'absent, and so is the derivation of the converse, which needs the law of cosines from above ' +
    'this subject. Then the polygons, which are the first concept here that is not about the ' +
    'triangle: the two angle totals a polygon carries and why only one of them grows with the ' +
    'number of sides, so that counting the sides of a regular polygon goes through the exterior ' +
    'angle; what a diagonal does to a quadrilateral, which is to produce two triangles for ' +
    'congruence to compare and to split two of the four angles while leaving two whole; and why ' +
    'equal sides force equal angles in a triangle and in nothing larger, the square being the one ' +
    'quadrilateral where the two claims coincide. That the diagonals from one vertex cut an ' +
    'n-gon into n − 2 triangles is taken as given like the congruence criteria, the figure is ' +
    'assumed convex throughout, and the diagonal properties that name which segments meet where ' +
    'are absent. Deductive proof, the circle theorems, area and the solids are the rest and are ' +
    'still mapped only — each of them is about a figure, and nothing in this build can show one.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'points-lines-angles',
    name: 'Points, lines and angles',
    subjectId: subject.id,
    scope: {
      id: 'points-lines-angles',
      label: 'Points, lines and angles',
      hint: 'point line angle parallel transversal vertical angles',
      /*
       * Carried verbatim from the map node this concept was promoted out of,
       * for the reason ontology-algebra.ts gives: widening a pattern at the
       * same time as writing the material makes two changes at once, and the
       * recognition figure in tests/atlas.mjs would move with no way to say
       * which edit moved it.
       */
      match: /^(angle|line|point) \(geometry\)|\b(vertical angles|transversal)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'choose-the-sum-the-figure-makes',
        statement:
          'Find a missing angle where several angles meet at a point, having first decided which ' +
          'total the figure makes them come to — 180° across a straight line, 360° all the way ' +
          'round — and say which it was.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'derive-the-vertical-pair',
        statement:
          'Get the equality of a vertical pair out of the straight-line sum applied twice, rather ' +
          'than reading it off the picture, and say which step needs the lines to be straight.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'place-an-angle-among-the-eight',
        statement:
          'Given one of the eight angles a transversal makes with a parallel pair, say which of ' +
          'the other seven equal it and which are its supplement, and which step of the argument ' +
          'is the one that used the lines being parallel.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'two-sums-every-angle-chase-uses',
        conceptId: 'points-lines-angles',
        statement:
          'Angles laid side by side from one end of a straight line to the other come to 180°; ' +
          'angles laid side by side all the way round a point come to 360°. Almost every missing ' +
          'angle in a figure of straight lines is found by deciding which of those two totals the ' +
          'figure makes, adding what is known, and subtracting. The deciding is the part that is ' +
          'about geometry; the subtracting is arithmetic.',
        position: 1,
        /*
         * Timed, unlike the two points below it, and the difference is the
         * judgement types.ts asks for. Taking a known total apart is genuinely
         * a fluency skill — an angle chase is a dozen of these in a row, and
         * one that has to be thought about each time stalls before the figure
         * is finished. The two points below are arguments, and timing an
         * argument measures typing.
         */
        automaticityTarget: 20_000,
        workedExample: {
          problem:
            'Four rays leave a point on a straight line, all on the same side of it, cutting four ' +
            'angles in a row: 42°, 55°, x° and 38°. Find x. Then say what the angles on the other ' +
            'side of the line come to, without being told how many there are.',
          subgoals: [
            {
              label: 'Decide which of the two totals this figure makes',
              detail:
                'The four angles start at one end of the line and finish at the other, so together ' +
                'they fill a half-turn: 180°, not 360°. The 360° would be the right total if the ' +
                'rays went the whole way round the point. Nothing in the numbers says which — the ' +
                'figure says, and this is the only step in the problem that is about geometry.',
              socratic:
                'These four angles begin at one end of the line and end at the other. How much of ' +
                'a full turn have you gone round by the time you reach the far end?',
            },
            {
              label: 'Add the angles that have numbers',
              detail:
                '42 + 55 + 38 = 135. The unknown sits third in the row and that position does not ' +
                'matter to the sum: the four angles fill the half-turn in any order, and addition ' +
                'does not record the order they were met in.',
              socratic:
                'Three of the four angles have numbers on them and the unknown is sitting in the ' +
                'middle of them. Does where it sits change what you are allowed to add?',
            },
            {
              label: 'Subtract to leave the unknown by itself',
              detail:
                '42 + 55 + x + 38 = 180, so x = 180 − 135 = 45. The check is that the four now ' +
                'add to exactly 180: 42 + 55 + 45 + 38 = 180.',
              socratic:
                'You know what all four angles come to and what three of them come to. What does ' +
                'knowing both of those let you do?',
            },
            {
              label: 'Get the other side from the full turn, not from its angles',
              detail:
                'The whole turn at the point is 360°, and the line cuts it into the angles on this ' +
                'side and the angles on the other. This side is 180°, so the other side is ' +
                '360 − 180 = 180° — however many rays are over there and whatever their sizes. The ' +
                'second total is not an extra fact to compute with; it is what makes the first one ' +
                'true, because a straight line is half of a full turn.',
              socratic:
                'You have been told nothing at all about the rays on the far side of the line. ' +
                'What do you nevertheless know about their angles added together, and what is it ' +
                'that tells you?',
            },
          ],
          answer:
            'x = 45. The angles on the other side of the line come to 180° whatever they are, ' +
            'because the full turn is 360° and this side has used half of it.',
        },
      },
      {
        id: 'vertical-angles-equal-by-subtracting-twice',
        conceptId: 'points-lines-angles',
        statement:
          'Two straight lines crossing make four angles, and the two facing each other are equal. ' +
          'The reason is not that they look it. Each of them is what is left of a straight angle ' +
          'once the SAME third angle has been taken away, and two numbers got by subtracting one ' +
          'number from 180 cannot differ.',
        position: 2,
        /*
         * No `automaticityTarget`. What is being learned here is an argument,
         * and a timing target on "say which step needed the lines to be
         * straight" measures typing — the case types.ts names when it argues
         * the field should usually be absent.
         */
        workedExample: {
          problem:
            'Two straight lines cross at a point, and one of the four angles there is 35°. Find ' +
            'the other three, and say which step of the working needs the lines to be straight.',
          subgoals: [
            {
              label: 'Name the four angles so the argument is about them, not about the picture',
              detail:
                'Going round the point in order, call them a = 35°, then b, then c, then d. So a ' +
                'faces c and b faces d, while the pairs that sit side by side — a with b, b with ' +
                'c, c with d, d with a — each lie along one of the two lines. Naming them in order ' +
                'is what makes "faces" and "sits beside" sayable without pointing.',
              socratic:
                'Four angles meet where the lines cross and you have been given one of them. Which ' +
                'of the other three is the one the 35° does not sit beside?',
            },
            {
              label: 'Use the straight-line total on a pair that sits side by side',
              detail:
                'a and b together run from one end of the first line to the other, so a + b = 180 ' +
                'and b = 180 − 35 = 145. The pair a and d does the same along the second line, so ' +
                'd = 180 − 35 = 145 as well.',
              socratic:
                'a and b lie beside each other along one of the two lines. What does that force ' +
                'about a + b — and which property of the line are you leaning on to say so?',
            },
            {
              label: 'Use it again on the next pair, and watch the 35 come back',
              detail:
                'b and c also sit side by side, this time along the second line, so ' +
                'c = 180 − b = 180 − 145 = 35. That is a again — and not because it was measured: ' +
                'c = 180 − (180 − a), and the two subtractions undo each other for every a.',
              socratic:
                'You got b by taking a away from 180. What happens when you now take b away from ' +
                '180?',
            },
            {
              label: 'Separate what was used from what was assumed',
              detail:
                'One fact was used, twice: angles sitting side by side along a straight line come ' +
                'to 180°. That needs each of the two lines to be straight and needs nothing else — ' +
                'no measurement, and nothing about 35 in particular. Since 180 − (180 − a) = a for ' +
                'every a, the result holds for every crossing, which is what makes it a theorem ' +
                'rather than something true of this figure.',
              socratic:
                'The 35 never mattered to any step of that argument. What does that tell you about ' +
                'how many crossings the conclusion covers?',
            },
          ],
          answer:
            'b = 145°, c = 35°, d = 145°. The step that needs the lines to be straight is the one ' +
            'that puts a pair of side-by-side angles equal to 180°; it is used twice, and it is ' +
            'the only geometric fact in the working.',
        },
      },
      {
        id: 'a-transversal-across-parallels-has-two-values',
        conceptId: 'points-lines-angles',
        statement:
          'A line crossing two parallel lines makes eight angles, and only two different numbers ' +
          'appear among them. Slide the first crossing along the crossing line until it lands on ' +
          'the second: because the two lines are parallel, the first lands exactly on the second, ' +
          'so every angle up there reappears down here. With the four-at-a-crossing facts, that ' +
          'leaves every one of the eight equal to x or to 180 − x. Corresponding, alternate and ' +
          'co-interior are three ways of saying which of the two an angle is.',
        position: 3,
        /*
         * No `automaticityTarget` either, and for a reason specific to this
         * point rather than by copying the one above: what has to be learned
         * is which of the two values an angle takes, and the arithmetic once
         * that is settled is a single subtraction. Timing it would measure the
         * subtraction, which point 1 already covers.
         */
        workedExample: {
          problem:
            'A line crosses two parallel lines at P and at Q. The angle at P that opens into the ' +
            'strip between the two parallel lines, on the right of the crossing line, is 118°. ' +
            'Find the angle at Q that opens into that same strip on that same side.',
          subgoals: [
            {
              label: 'Say enough about an angle to have named one of the eight',
              detail:
                'Two things are needed, not one. Which crossing — P or Q — picks out four of the ' +
                'eight. Then, of those four, two open into the strip between the parallel lines ' +
                'and two open away from it, and the crossing line separates each of those pairs ' +
                'into a left and a right. "The angle at P" on its own names four different ' +
                'numbers; "at P, into the strip, on the right" names exactly one, and that is the ' +
                'one carrying the 118°.',
              socratic:
                'There are eight angles in this figure and only one of them is the 118°. Besides ' +
                'which crossing it is at, what else do you have to pin down before you have ' +
                'singled one out?',
            },
            {
              label: 'Slide the first crossing down onto the second',
              detail:
                'Move the whole figure along the crossing line until P arrives at Q. The crossing ' +
                'line slides along itself and so is unmoved, and the first parallel line lands on ' +
                'the second — which is exactly what being parallel means and is the only place in ' +
                'the argument it is used. Every angle at P therefore lands on an angle at Q of the ' +
                'same size. That is why eight angles hold only two numbers: without it, the two ' +
                'crossings have nothing to do with each other and nothing at Q follows from ' +
                'anything at P.',
              socratic:
                'Before any of this, what would you have to know about the two lines for the ' +
                'angles at Q to have anything at all to do with the angles at P?',
            },
            {
              label: 'Read off which angle at Q the slide actually landed on',
              detail:
                'The angle at P opening into the strip opens towards Q. The slide carries it the ' +
                'full width of the strip, so when it arrives at Q it is opening past the second ' +
                'line and out the other side. The 118° therefore reappears at Q on the right of ' +
                'the crossing line and OUTSIDE the strip — which is not the angle the question ' +
                'asked for. Expecting the answer to be 118° is exactly the error of assuming the ' +
                'slide lands an angle in the same part of the figure it started in.',
              socratic:
                'The slide picks up the angle that opens into the strip and carries it the whole ' +
                'width of the strip. Once it gets to Q, which side of the second line is it ' +
                'opening into?',
            },
            {
              label: 'Finish with the straight-line total, on the second line this time',
              detail:
                'At Q the second parallel line is straight, and the crossing line cuts the ' +
                'straight angle on its right-hand side into two pieces: the one inside the strip ' +
                'and the one outside it. Those two come to 180°, so the one asked for is ' +
                '180 − 118 = 62°. So the whole figure holds 118 and 62 and no third number, and ' +
                '118 + 62 = 180 is the co-interior statement itself — derived here rather than ' +
                'memorised as a fourth fact.',
              socratic:
                'You now have 118° at Q outside the strip and you want the one inside it, and the ' +
                'two sit side by side along a straight line. Which fact from earlier finishes ' +
                'this?',
            },
          ],
          answer:
            '62°. The slide lands the 118° outside the strip, and the angle inside it is the rest ' +
            'of that straight angle: 180 − 118 = 62. Two interior angles on one side of the ' +
            'crossing line always come to 180°, so they are equal only when both are 90°.',
        },
      },
    ],
  },
  {
    id: 'triangle-basics',
    name: 'Triangles',
    subjectId: subject.id,
    scope: {
      id: 'triangle-basics',
      label: 'Triangles',
      hint: 'triangle angle sum triangle inequality isosceles',
      /*
       * Carried verbatim from the map node, like the pattern above it and for
       * the same reason: widening a pattern while writing the material makes
       * two changes at once, and the recognition figure in tests/atlas.mjs
       * would move with no way to say which edit moved it.
       *
       * Worth knowing what it does and does not claim, since `fidelity` here
       * is 'checked' and that is a promise about the provider's own text. It
       * takes "Triangle" and "Triangle inequality" and leaves "Triangular
       * number" alone, because `\b` after the final e refuses the -ar. That is
       * the right call either way — the triangular numbers are a
       * number-theory topic and belong nowhere near this concept — but it is
       * luck rather than design, and the next author widening this pattern
       * should check that boundary rather than assume it.
       */
      match: /^triangle\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'close-a-triangles-angles',
        statement:
          'Find the third angle of a triangle from the other two, carry it out to the exterior '
          + 'angle at that vertex, and say why the exterior angle is the sum of the two interior '
          + 'angles it is not beside rather than a fourth fact to be remembered.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'decide-whether-three-lengths-close',
        statement:
          'Decide whether three given lengths are the sides of a triangle by testing the longest '
          + 'against the other two added together, give the whole range of third lengths that '
          + 'work with a given pair, and say why both ends of that range are excluded.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'rule-a-combination-out-against-the-total',
        statement:
          'Rule an impossible combination of angles out by what the 180° total leaves rather '
          + 'than by how it looks, and say why that makes acute, right and obtuse three cases '
          + 'that cover every triangle and never two at once.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-angle-sum-is-the-transversal-fact-again',
        conceptId: 'triangle-basics',
        statement:
          'The three angles of a triangle come to 180°, and this is the transversal fact rather '
          + 'than a new one: a line drawn through one vertex parallel to the side opposite it '
          + 'turns the three angles of the triangle into three angles filling a straight line. '
          + 'Once that is granted, a third angle is one subtraction — and doing that subtraction '
          + 'twice gives the exterior angle at a vertex as the sum of the two interior angles it '
          + 'is not beside.',
        position: 1,
        workedExample: {
          problem:
            'Two angles of a triangle are 47° and 68°. Find the third. Then find the exterior '
            + 'angle at that third vertex — the angle between one of its sides and the extension '
            + 'of the other — and say what it turns out to equal.',
          subgoals: [
            {
              label: 'Reach for the straight-line total rather than a new fact about triangles',
              detail:
                'There is no straight line in a triangle, so one has to be put there: take the '
                + 'line through one vertex running parallel to the side opposite it. The three '
                + 'angles at that vertex fill a straight line, so they come to 180°. The two '
                + 'sides meeting at that vertex are each a transversal across a parallel pair — '
                + 'the new line and the opposite side — so the two outer angles at the vertex '
                + 'equal the two angles at the far ends of the opposite side. The three angles on '
                + 'the line are therefore the triangle\'s own three angles with nothing added and '
                + 'nothing dropped. Every step of that is the previous concept used once.',
              socratic:
                'A triangle has no straight line anywhere in it, and the only angle totals you '
                + 'have are for a straight line and for a full turn. Where could a line be put so '
                + 'that the three angles of the triangle end up sitting along it?',
            },
            {
              label: 'Add the two you were given, then take them out of the total',
              detail:
                '47 + 68 = 115, so the third angle is 180 − 115 = 65. The check is that all '
                + 'three add back to the total: 47 + 68 + 65 = 180.',
              socratic:
                'Two of the three angles have numbers on them, and you now know what all three '
                + 'come to. What does having both of those let you do?',
            },
            {
              label: 'Swing the third angle out to the exterior angle beside it',
              detail:
                'Extending one of the sides at that vertex leaves the exterior angle sitting side '
                + 'by side with the 65° along one straight line, so it is 180 − 65 = 115°. This '
                + 'step is the first fact of the previous concept, used once; nothing about '
                + 'triangles is needed for it, and the triangle could be any shape.',
              socratic:
                'Extending one side leaves the exterior angle lying beside the 65° along a single '
                + 'straight line. Which of the facts you already have settles a pair of angles in '
                + 'that position?',
            },
            {
              label: 'Watch the two subtractions cancel, and take the general fact that leaves',
              detail:
                'The working was 180 − (a + b), and then 180 − that. Those undo each other: '
                + '180 − (180 − a − b) = a + b for every a and b. So the exterior angle is '
                + '47 + 68 = 115 directly, and the 65 was never needed — an exterior angle equals '
                + 'the two interior angles it is NOT beside. Neither 47 nor 68 mattered to that '
                + 'argument, which is what makes it a statement about every triangle rather than '
                + 'about this one. It is also the same shape as the vertical pair: one fact '
                + 'applied twice, undoing itself.',
              socratic:
                'You took the two given angles off 180, and then took the result off 180 again. '
                + 'What did the second subtraction do to the first?',
            },
          ],
          answer:
            'The third angle is 65°. The exterior angle at that vertex is 115°, which is '
            + '47 + 68 — the two interior angles it is not beside. That holds for every triangle, '
            + 'because 180 − (180 − a − b) = a + b whatever a and b are.',
        },
      },
      {
        id: 'the-inequality-compares-two-routes',
        conceptId: 'triangle-basics',
        statement:
          'Three positive lengths are the sides of a triangle exactly when the longest is '
          + 'strictly shorter than the other two added together. To get from one end of the '
          + 'longest side to the other you can go straight along it or go round by way of the '
          + 'third vertex, and a detour cannot be shorter than the direct route. If the detour is '
          + 'exactly as long, the third vertex is sitting ON the longest side and the figure is a '
          + 'flat segment rather than a triangle — which is why the test is strict and not merely '
          + '"not longer".',
        position: 2,
        workedExample: {
          problem:
            'Are 7, 10 and 18 the sides of a triangle? Then keep the 7 and the 10 and let the '
            + 'third length be x: give every x that works, and say whether the ends of that range '
            + 'are included.',
          subgoals: [
            {
              label: 'Sort the three, so there is one comparison to make instead of three',
              detail:
                'In order the lengths are 7, 10, 18. A triangle has to satisfy one of these '
                + 'conditions per side, so there are three, but only the longest can fail. If '
                + '7 + 10 beats 18 then 7 + 18 beats 10 and 10 + 18 beats 7 without being looked '
                + 'at: each of those adds a positive length to something already at least as big '
                + 'as the side it is up against. So the longest side is the only one worth '
                + 'checking, and that is the move to keep.',
              socratic:
                'Three sides means three of these conditions. If you were allowed to check only '
                + 'one of them, which side would you check, and what would make that choice safe?',
            },
            {
              label: 'Put the detour against the direct route',
              detail:
                'Straight along the longest side is 18. Round by way of the third vertex is '
                + '7 + 10 = 17. The way round is a whole unit SHORTER than the way straight, and '
                + 'no path between two points can beat the straight one, so there is nothing for '
                + 'these three lengths to be the sides of. As a single number, '
                + '7 + 10 − 18 = −1, and the negative sign is the entire ruling.',
              socratic:
                'Walking from one end of the 18 to the other, you can go straight along it, or go '
                + 'round through the opposite corner — and the way round measures 17. What is '
                + 'wrong with that?',
            },
            {
              label: 'Turn the single test into a range by asking which length the unknown is',
              detail:
                'Keep 7 and 10 and let the third be x. Two cases, because the unknown may or may '
                + 'not be the longest. If x is the longest, 7 + 10 > x, so x < 17. If 10 is the '
                + 'longest, 7 + x > 10, so x > 3. These are not alternatives to choose between: '
                + 'whichever case x falls in, the other condition is automatic, so what survives '
                + 'is the x satisfying both — 3 < x < 17.',
              socratic:
                'The rule was to test only the longest side, and you no longer know which of the '
                + 'three is longest. How many cases does that leave you with, and what decides '
                + 'which one you are in?',
            },
            {
              label: 'Decide whether the two ends of the range are in or out',
              detail:
                'At x = 17 the two short sides come to exactly the long one: 7 + 10 = 17. The '
                + 'detour equals the direct route, which happens only when the third vertex lies '
                + 'on the long side, so what is left is a flat segment with no area and no third '
                + 'angle. At x = 3 the same thing happens with 10 as the long side: 7 + 3 = 10. '
                + 'Both ends are that flat case, so both are excluded and the range is strict at '
                + 'each end. Its width is 17 − 3 = 14, which is twice the shorter of the two '
                + 'given sides — and since the ends are (b − a) and (b + a), that is true of '
                + 'every pair rather than of this one.',
              socratic:
                'At x = 17 the two shorter sides add to exactly the longest. What is left of the '
                + 'figure when the way round is precisely as long as the way straight?',
            },
          ],
          answer:
            '7, 10 and 18 are not the sides of a triangle: 7 + 10 = 17, which is less than 18. '
            + 'With 7 and 10 kept, the third length works exactly when 3 < x < 17, strictly at '
            + 'both ends, because equality at either end flattens the triangle onto a segment. '
            + 'The window is 14 wide, which is twice the shorter of the two given sides.',
        },
      },
      {
        id: 'at-most-one-angle-is-not-acute',
        conceptId: 'triangle-basics',
        statement:
          'Because the three angles come to 180°, a triangle has at most one angle of 90° or '
          + 'more: two of them would use up the whole total between them, and a triangle\'s third '
          + 'angle cannot be 0°. So acute, right and obtuse are three cases that cover every '
          + 'triangle and cannot overlap — which is what lets every later theorem say "the" right '
          + 'angle and "the" hypotenuse rather than "a". The side names — equilateral, isosceles, '
          + 'scalene — are a separate classification, and tying them to the angles is the '
          + 'base-angle theorem, which is the third knowledge point of `congruence`.',
        position: 3,
        workedExample: {
          problem:
            'A triangle has one angle of 110°, and the other two are equal. Find them. Then '
            + 'decide whether any triangle could have a SECOND angle of 110°, and whether one '
            + 'could have an angle of exactly 90° alongside the 110°.',
          subgoals: [
            {
              label: 'Take the angle you were given out of the total before using anything else',
              detail:
                '180 − 110 = 70 is what the other two have left to share between them. Doing '
                + 'this first is what makes the second piece of information usable at all: "the '
                + 'other two are equal" says how to divide something, and until the 110 is out of '
                + 'the way there is nothing for it to divide.',
              socratic:
                'You were told two things — one angle is 110°, and the other two match each '
                + 'other. One of those is no use to you until the other has been used. Which way '
                + 'round is it?',
            },
            {
              label: 'Share what is left, using the only other thing you were told',
              detail:
                'The two remaining angles come to 70° and are equal, so each is 70 ÷ 2 = 35°. '
                + 'Check against the total: 110 + 35 + 35 = 180.',
              socratic:
                'Seventy degrees is left for two angles, and the only thing you know about them '
                + 'is that they match each other. What does matching let you do to the 70 that '
                + 'you could not have done without it?',
            },
            {
              label: 'Test the impossible combinations against the total, not against the picture',
              detail:
                'A second angle of 110° would give 110 + 110 = 220, which has passed 180 with a '
                + 'third angle still to come, so no triangle has two of them. A 90° alongside the '
                + '110° gives 110 + 90 = 200, and the same arithmetic kills it. Neither refusal '
                + 'needed a drawing and neither needed the 35 — the total did all of the work, '
                + 'and the overshoot is what says "impossible" rather than merely "wrong".',
              socratic:
                'Suppose a triangle did have a second angle of 110°. What do those two alone '
                + 'already come to, and how much of the total is left for the third?',
            },
            {
              label: 'Generalise the two refusals into the rule the classification rests on',
              detail:
                'Neither refusal used 110 or 90 in particular. ANY two angles of 90° or more come '
                + 'to at least 180°, which is the whole total, leaving at most nothing for the '
                + 'third — and a triangle whose third angle is 0° has two of its sides lying '
                + 'along each other, which is the flat case again rather than a triangle. So at '
                + 'most one angle is 90° or more: at most one right angle, at most one obtuse '
                + 'angle, and never one of each. That is what makes acute, right and obtuse a '
                + 'classification rather than three labels two of which might both apply, and it '
                + 'is why the theorems above this concept can say "the" right angle. It settles '
                + 'nothing about the sides: equilateral, isosceles and scalene are a second '
                + 'classification, and the fact that connects the two — equal sides force equal '
                + 'angles, and the converse — is the base-angle theorem, proved from congruence '
                + 'and written up as that concept\'s third point.',
              socratic:
                'Neither of those refusals used the number 110 or the number 90 for anything. '
                + 'What does that tell you about how many triangles the conclusion covers — and '
                + 'what is the smallest pair of angles that would still have broken it?',
            },
          ],
          answer:
            'The other two angles are 35° each. No triangle has a second angle of 110°, and none '
            + 'has a 90° alongside it: either pair already accounts for 180° or more on its own, '
            + 'with a third angle still to come. In general a triangle has at most one angle of '
            + '90° or more, so acute, right and obtuse cover every triangle and never two at '
            + 'once.',
        },
      },
    ],
  },
  {
    id: 'congruence',
    name: 'Congruence',
    subjectId: subject.id,
    scope: {
      id: 'congruence',
      label: 'Congruence',
      hint: 'congruence sss sas asa rigid motion',
      /*
       * Carried verbatim from the map node, like both patterns above it and for
       * the same reason: widening a pattern while writing the material makes
       * two changes at once, and the recognition figure in tests/atlas.mjs
       * would move with no way to say which edit moved it.
       *
       * The title table in that suite already pins the boundary this one has to
       * hold — "Congruence (geometry)" must NOT be claimed by
       * `linear-congruences` or `modular-arithmetic`, which is the collision
       * worth caring about here, since congruence in number theory is a
       * different relation that happens to share the word.
       */
      match: /\bcongruence \(geometry\)|\bcongruent (triangle|figure)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-congruence-as-six-equalities',
        statement:
          'Read a congruence statement as the six equalities its letter order asserts, produce '
          + 'the parts of one triangle from the other, and show that reordering the letters makes '
          + 'a different claim rather than the same one restated.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'complete-data-into-a-criterion',
        statement:
          'Decide whether given data forces a congruence, name which of SSS, SAS and ASA it is, '
          + 'complete a side-and-two-angles into ASA with the angle sum, and say why no amount of '
          + 'angle data on its own can ever be enough.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'tie-equal-sides-to-equal-angles',
        statement:
          'Get the base angles of an isosceles triangle by matching the triangle with itself '
          + 'under the swap of its two equal sides, and say which step of that argument replaces '
          + 'the appeal to how the figure looks.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-congruence-names-a-correspondence',
        conceptId: 'congruence',
        statement:
          'A congruence is a claim about a PAIRING of vertices, not about two shapes. Writing '
          + '"triangle ABC is congruent to triangle DEF" asserts six equalities at once — three '
          + 'sides and three angles — and which six is read off the order the letters are written '
          + 'in: first with first, second with second, third with third. Reorder the letters on '
          + 'one side and you have not restated the claim, you have made a different one, which '
          + 'may be false about the very same two triangles.',
        position: 1,
        /*
         * No `automaticityTarget`. Matching parts off a correspondence looks
         * like a drill and is not one — what is being learned is that the
         * letter order carries the claim, and the error this point exists to
         * stop is reading the order too fast. Timing it would reward exactly
         * the haste the material is trying to slow down.
         */
        workedExample: {
          problem:
            'Triangle ABC is congruent to triangle DEF. In ABC, AB = 8, the angle at A is 24° '
            + 'and the angle at B is 115°. Say what the congruence tells you about each of the '
            + 'six parts of DEF. Then say whether "ABC is congruent to EDF" says the same thing '
            + 'about the same two triangles.',
          subgoals: [
            {
              label: 'Read the pairing off the letter order before using a single measurement',
              detail:
                'A with D, B with E, C with F — by position in the two names, not by anything '
                + 'about the triangles and not alphabetically. That pairing is the whole content '
                + 'of the statement; every equality below is just it being read in one place. '
                + 'Nothing has been measured yet and nothing needs to be.',
              socratic:
                'Before you use any of the numbers, what has writing the second triangle as DEF '
                + 'rather than as EFD already committed you to?',
            },
            {
              label: 'Match each side by the PAIR of letters it is named by',
              detail:
                'DE is named by the first and second letters of DEF, so it matches the side named '
                + 'by the first and second of ABC: DE = AB = 8. EF takes the second and third, so '
                + 'EF = BC, and FD takes the third and first, so FD = CA. Those last two are the '
                + 'useful ones precisely BECAUSE no length was given for them: the '
                + 'correspondence still says exactly which side of DEF equals which side of ABC, '
                + 'without either number being known. A side is not matched by being "the short '
                + 'one" or "the one on the left" — it is matched by which two vertices it joins.',
              socratic:
                'EF is named by the second and third letters of DEF. Which two letters of ABC sit '
                + 'in those same two positions, and so which side must EF equal?',
            },
            {
              label: 'Take the angle you were not given from the total, not from the correspondence',
              detail:
                'The correspondence can only carry across what is already known, and only two of '
                + 'ABC\'s angles were given. The third comes from the angle sum: '
                + '180 − 24 − 115 = 41°, so the angle at C is 41° and the correspondence then '
                + 'makes the angle at F equal to it. So all three angles of DEF are settled: '
                + 'D = 24°, E = 115°, F = 41°. Note which direction the work went — the angle sum '
                + 'inside ABC first, the correspondence across to DEF second. Nothing about DEF '
                + 'was needed to get the 41°.',
              socratic:
                'You were given two of ABC\'s three angles, and a correspondence can only hand '
                + 'across what you already have. Where does the third one have to come from?',
            },
            {
              label: 'Change the order on purpose, to see that the order was the claim',
              detail:
                '"ABC is congruent to EDF" pairs A with E, B with D, C with F. That demands the '
                + 'angle at A equal the angle at E — which is 24° = 115°, and false. So the '
                + 'second statement is not the first one written differently; it is a separate '
                + 'claim, about the two triangles that genuinely ARE congruent, and it is wrong. '
                + 'Notice that its first side equality, AB = ED, is 8 = 8 and perfectly true: '
                + 'checking one matched part and stopping would have accepted the whole thing.',
              socratic:
                'Someone writes "ABC is congruent to EDF" about these same two triangles. Which '
                + 'equalities does that version demand, and are they true?',
            },
          ],
          answer:
            'DE = 8, EF = BC and FD = CA — the last two named exactly even though no length was '
            + 'given for either — and the angles are D = 24°, E = 115° and F = 41°, the last '
            + 'because 180 − 24 − 115 = 41. "ABC is congruent to EDF" does NOT say the same '
            + 'thing: it demands that the angle at A equal the angle at E, that is 24° = 115°, '
            + 'which is false. The letter order is the claim, so reordering it makes a new one — '
            + 'here a false one.',
        },
      },
      {
        id: 'three-of-the-six-and-aas-is-asa-again',
        conceptId: 'congruence',
        statement:
          'A triangle has six measurements and a congruence claims all six match, but you never '
          + 'have to check six: the right three force the other three. SSS, SAS and ASA are those '
          + 'triples, and each of them contains a side, which is what AAA cannot do — three '
          + 'angles carry no length at all, so nothing in them can fix a size. AAS looks like a '
          + 'fourth criterion and is ASA wearing different clothes: the angle sum turns any two '
          + 'angles into all three, so a side together with any two angles is a side together '
          + 'with the two angles at its ends.',
        position: 2,
        workedExample: {
          problem:
            'In triangle PQR the angle at P is 73°, the angle at Q is 44°, and PQ = 9. In '
            + 'triangle XYZ the angle at X is 73°, the angle at Z is 63°, and XY = 9. Are they '
            + 'congruent, and by which criterion?',
          subgoals: [
            {
              label: 'Complete both angle triples before comparing the triangles at all',
              detail:
                'Each triangle has had two of its three angles named, so the third is one '
                + 'subtraction in each: in PQR the angle at R is 180 − 73 − 44 = 63°, and in XYZ '
                + 'the angle at Y is 180 − 73 − 63 = 44°. Both triangles therefore have the angles '
                + '73°, 44° and 63°. Doing this first is what makes the two sets of data '
                + 'comparable — as given, one named the angles at P and Q and the other the angles '
                + 'at X and Z, and those are not the same positions.',
              socratic:
                'Each triangle has had two of its three angles named, and they are not at matching '
                + 'positions. What can you do to each triangle before you compare them?',
            },
            {
              label: 'Fix the correspondence by the angles, then check the side sits in the matching place',
              detail:
                'The angles pair the vertices: P with X at 73°, Q with Y at 44°, R with Z at 63°. '
                + 'Now the sides of 9. PQ joins the 73° and the 44°; XY joins the 73° and the 44° '
                + 'as well, so under this correspondence PQ and XY are matching sides and the two '
                + '9s are the same measurement. Had the 9 in XYZ been XZ instead, it would have '
                + 'joined the 73° and the 63° and been a different side of the triangle — the same '
                + 'number in the wrong position, which forces nothing.',
              socratic:
                'Both triangles have a side of 9. What has to be true about where each 9 sits '
                + 'before the two can be the same side under your correspondence?',
            },
            {
              label: 'Name the criterion by the matched triple, and keep a side in it',
              detail:
                'What matches is two angles and the side between them: ASA, with the included side '
                + '9 and the 73° and 44° at its ends. That the 63° and the 44° had to be computed '
                + 'does not weaken it — a computed value is as known as a given one. And the '
                + 'triple contains a side, which is the part that pins the size: with the angles '
                + 'alone, every one of these equalities would still hold for a triangle twice as '
                + 'big.',
              socratic:
                'You have two angles and a side matching in each triangle. Which of the three '
                + 'criteria is that, and does it matter that one of the angles was computed '
                + 'rather than given?',
            },
            {
              label: 'Look back at what the angle sum did, and read off why AAS and AAA differ',
              detail:
                'XYZ arrived as a side and two angles, one of which — the 63° at Z — was not at '
                + 'either end of that side. That is AAS, and one subtraction turned it into ASA. '
                + 'So AAS is not a fourth criterion to remember; it is ASA plus the angle sum. '
                + 'The same subtraction is why AAA can never join the list: because the third '
                + 'angle is forced by the other two, three angles are really only two independent '
                + 'numbers, and neither of them is a length. A criterion has to pin down size as '
                + 'well as shape, and no quantity of angle data contains any size.',
              socratic:
                'The angle sum let you replace an angle you were not given with one you were. '
                + 'What does that do to the difference between AAS and ASA — and why can angle '
                + 'information alone never be enough, however much of it you have?',
            },
          ],
          answer:
            'Yes. The angle at R is 63° and the angle at Y is 44°, so both triangles have angles '
            + '73°, 44° and 63°, pairing P with X, Q with Y and R with Z; the side of 9 lies '
            + 'between the 73° and the 44° in each. So PQR is congruent to XYZ by ASA. AAS is not '
            + 'a fourth criterion — the angle sum supplies the third angle and turns any '
            + 'side-and-two-angles into ASA — and AAA is not a criterion at all, because three '
            + 'angles contain no length and so cannot fix the size.',
        },
      },
      {
        id: 'base-angles-by-matching-a-triangle-with-itself',
        conceptId: 'congruence',
        statement:
          'The side names — equilateral, isosceles, scalene — only do any work once equal sides '
          + 'are tied to equal angles, and congruence is what ties them. If AB = AC, compare '
          + 'triangle ABC with triangle ACB: the same triangle, named with two of its vertices '
          + 'swapped. Under that pairing AB matches AC, AC matches AB, and the angle at A matches '
          + 'itself — a side, the angle between them, and a side, which is SAS. So the triangle '
          + 'is congruent to itself read the other way round, and therefore the angle at B equals '
          + 'the angle at C. One triangle, matched with itself: nothing has to be drawn twice.',
        position: 3,
        workedExample: {
          problem:
            'In triangle ABC, AB = AC = 13 and the angle at A is 28°. Find the angles at B and '
            + 'C, and say which step of the argument does the work that "it looks symmetrical" '
            + 'cannot.',
          subgoals: [
            {
              label: 'Produce a second triangle without drawing one, by swapping the two vertices the equal sides run to',
              detail:
                'Congruence compares two triangles and there is only one here, so the second has '
                + 'to be this one named differently: ACB, which is A with A, B with C and C with '
                + 'B. The two equal sides both start at A and end at B and at C, so swapping B '
                + 'and C is exactly the swap that exchanges them. Any other relabelling would '
                + 'not.',
              socratic:
                'Congruence is a claim about two triangles and you have been given one. What '
                + 'second triangle can you produce without drawing anything?',
            },
            {
              label: 'Check the three matches that pairing demands, and notice they are the SAS triple',
              detail:
                'Pairing ABC with ACB demands AB = AC, which is given; AC = AB, which is the same '
                + 'given fact read the other way; and the angle at A equal to the angle at A, '
                + 'which needs nothing at all, since A was paired with itself. That is two sides '
                + 'and the angle between them — SAS — so ABC is congruent to ACB.',
              socratic:
                'Under that swap, which side of ABC is being asked to equal which side of ACB — '
                + 'and what makes the angle at A match without your being told anything about it?',
            },
            {
              label: 'Read the conclusion about the angles off the correspondence',
              detail:
                'The congruence makes all six parts match, and the second letter of each name is '
                + 'paired: B in ABC with C in ACB. So the angle at B equals the angle at C. This '
                + 'is the first point used on a correspondence built out of one triangle rather '
                + 'than two, and it is the step that replaces looking at the figure.',
              socratic:
                'The congruence matches all six parts. Which pair of angles does the second '
                + 'letter of each of the two names put together?',
            },
            {
              label: 'Finish with the angle sum, then notice which given values were never used',
              detail:
                'The two base angles come to 180 − 28 = 152°, and they are equal, so each is '
                + '152 ÷ 2 = 76°. Check: 28 + 76 + 76 = 180. Now look at what the equality '
                + 'argument used — only that AB = AC. Neither the 13 nor the 28 appeared in it, '
                + 'and BC was never given because it was never needed. So equal sides force equal '
                + 'angles in EVERY isosceles triangle, which is the fact that makes the side '
                + 'names worth having: the base-angle theorem, got here from congruence as the '
                + 'triangle concept said it would have to be. Apply it to a second pair of equal '
                + 'sides and all three angles are equal, which is why an equilateral triangle has '
                + 'three 60° angles rather than merely three equal ones. The converse — equal '
                + 'angles force equal sides — is the same self-matching with ASA in place of SAS: '
                + 'if the angles at B and C are equal then ABC and ACB match by those two angles '
                + 'and the side BC they both lie along, which forces AB = AC.',
              socratic:
                'Neither the 13 nor the 28 was used to show the two angles are equal. What does '
                + 'that tell you about how many triangles the conclusion covers?',
            },
          ],
          answer:
            'Both are 76°: the angle sum leaves 180 − 28 = 152° for the two of them, and matching '
            + 'ABC with ACB under SAS forces them to be equal, so each is 76°. The step that does '
            + 'the work is that matching — AB = AC and AC = AB with the angle at A shared, so the '
            + 'triangle is congruent to itself read backwards. Neither the 13 nor the 28 entered '
            + 'that argument, so equal sides force equal angles in every triangle, and that is '
            + 'what the names equilateral, isosceles and scalene rest on.',
        },
      },
    ],
  },
  {
    id: 'similarity',
    name: 'Similarity',
    subjectId: subject.id,
    scope: {
      id: 'similarity',
      label: 'Similarity',
      hint: 'similarity similar triangles scale factor proportional sides',
      /*
       * Carried verbatim from the map node, like all three patterns above it and
       * for the same reason: widening a pattern while writing the material makes
       * two changes at once, and the recognition figure in tests/atlas.mjs would
       * move with no way to say which edit moved it.
       */
      match: /\bsimilarity \(geometry\)|\bsimilar triangle/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-similarity-as-angles-and-one-ratio',
        statement:
          'Read a similarity statement as the three angle equalities and the one shared ratio its '
          + 'letter order asserts, produce a side of either triangle from the other, and show that '
          + 'reversing the letter order makes a different claim rather than the same one restated.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'settle-a-similarity-from-angles-alone',
        statement:
          'Settle a similarity from two angles in each triangle, completing both angle triples '
          + 'with the angle sum first, and say why the same shortage of length information that '
          + 'stops AAA being a congruence criterion is what makes AA a sufficient one here.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'move-a-proportion-across-or-down',
        statement:
          'Rearrange a proportion between matched sides into a ratio of two sides of one triangle, '
          + 'and say which of the two ratios survives scaling the figure again and which does not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-similarity-loosens-three-of-the-six',
        conceptId: 'similarity',
        statement:
          'A similarity is read exactly like a congruence — the letter order pairs the vertices, '
          + 'first with first, second with second, third with third — and then claims something '
          + 'weaker about the six parts it pairs. The three angles are still EQUAL. The three '
          + 'sides are no longer equal but proportional: all three matched pairs share one ratio, '
          + 'the scale factor, so one pair of known lengths settles it for the other two. '
          + '"Corresponding parts match" is the sentence that causes the trouble here, because '
          + 'for sides they correspond without being equal.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason the first congruence point
         * gives and which applies here with the ratio added: the error this
         * point exists to stop is reading a letter order too quickly, so
         * rewarding speed would train the mistake. The arithmetic underneath is
         * one multiplication.
         */
        workedExample: {
          problem:
            'Triangle ABC is similar to triangle DEF. In ABC, AB = 6 and BC = 9. In DEF, '
            + 'DE = 10. Say what the similarity settles about the six parts of DEF. Then say '
            + 'whether "ABC is similar to FED" says the same thing about the same two triangles.',
          subgoals: [
            {
              label: 'Read the pairing off the letter order, exactly as a congruence is read',
              detail:
                'A with D, B with E, C with F — by position in the two names, not by anything '
                + 'about the triangles. Nothing new has been learned about reading these '
                + 'statements; what changes is what the pairing goes on to claim, not how the '
                + 'pairing itself is found. Nothing has been measured yet and nothing needs to be.',
              socratic:
                'This statement is read the same way a congruence is. What has writing the second '
                + 'triangle as DEF rather than as FED already committed you to, before any length '
                + 'is used?',
            },
            {
              label: 'Split the six claims into the three that stayed equalities and the three that became a ratio',
              detail:
                'The angles are unchanged from the congruence case: the angle at A equals the '
                + 'angle at D, B equals E, C equals F. Equal, not scaled — an angle has no size '
                + 'to stretch. The sides are where the claim weakens: instead of AB = DE, BC = EF '
                + 'and CA = FD, the statement says AB/DE = BC/EF = CA/FD, one number shared by '
                + 'all three pairs. So the error to refuse right now is concluding EF = BC = 9 '
                + 'because the parts correspond. They do correspond; corresponding sides of '
                + 'similar triangles are proportional, and equal only if the ratio happens to be 1.',
              socratic:
                'A congruence would make all six of these parts equal. Which of the six does a '
                + 'similarity still make equal, and what does it claim about the other three '
                + 'instead?',
            },
            {
              label: 'Take the scale factor from the single pair with both lengths known',
              detail:
                'Only one matched pair has both its lengths given: AB = 6 and DE = 10. So going '
                + 'from ABC to DEF the ratio is 10/6 = 5/3, and because the statement says all '
                + 'three pairs share that number, one pair has settled the lot. Then '
                + 'EF = BC × 5/3 = 9 × 5/3 = 15. And FD = CA × 5/3, which is the useful line '
                + 'precisely BECAUSE neither length is known: the correspondence still says '
                + 'exactly which side of DEF is 5/3 of which side of ABC without either number '
                + 'being available, the same way a congruence named EF = BC with both unknown.',
              socratic:
                'Only one matched pair has both of its lengths known. What can that single pair '
                + 'tell you about the two pairs where only one length is known?',
            },
            {
              label: 'Reverse the letter order on purpose, to see that the order was carrying the claim',
              detail:
                'FED names the same triangle as DEF — the same three vertices, so the same three '
                + 'sides, and not one length has changed. "ABC is similar to FED" pairs A with F, '
                + 'B with E, C with D, which matches AB with FE and BC with ED: that is 6 with 15 '
                + 'and 9 with 10. A similarity demands those two ratios be the same number, and '
                + '6/15 = 2/5 while 9/10 = 9/10, so it is false — about the very two triangles '
                + 'that genuinely are similar. Notice what survived the reversal: B still pairs '
                + 'with E, so the angle claim at that vertex is as true as it ever was, and '
                + 'checking one matched part and stopping would have accepted the whole thing.',
              socratic:
                'FED is the same triangle as DEF, with the same three sides and the same three '
                + 'angles. How can "ABC is similar to FED" be false when "ABC is similar to DEF" '
                + 'is true?',
            },
          ],
          answer:
            'The angles: A = D, B = E and C = F, equal rather than scaled. The sides: the scale '
            + 'factor is 10/6 = 5/3, so EF = 9 × 5/3 = 15, and FD = 5/3 × CA — named exactly '
            + 'although neither length was given. EF is 15 and not 9, which is the whole '
            + 'difference from a congruence. "ABC is similar to FED" does NOT say the same thing: '
            + 'it pairs AB with FE and BC with ED, so it demands 6/15 = 9/10, that is 2/5 = 9/10, '
            + 'which is false. The letter order is the claim, so reversing it makes a new one — '
            + 'here a false one about an unchanged pair of triangles.',
        },
      },
      {
        id: 'two-angles-settle-it-and-no-length-is-needed',
        conceptId: 'similarity',
        statement:
          'Two angles are enough. Equal angles in matched positions force the sides into '
          + 'proportion, and nobody says AAA because the angle sum makes the third angle free — '
          + 'two angles already name all three, so AA and AAA are one criterion. This is the exact '
          + 'place where similarity and congruence come apart: three angles were refused as a '
          + 'congruence criterion because they contain no length and a congruence has to fix the '
          + 'size. A similarity does not ask for the size, so the one thing angle data cannot '
          + 'supply is the one thing it is not being asked for.',
        position: 2,
        workedExample: {
          problem:
            'In triangle ABC the angle at A is 52° and the angle at B is 85°. In triangle DEF the '
            + 'angle at D is 52° and the angle at F is 43°. Are the two triangles similar, under '
            + 'which correspondence, and what is the scale factor?',
          subgoals: [
            {
              label: 'Complete both angle triples first, because the given angles sit in unmatched positions',
              detail:
                'Each triangle has two of its three angles named, and they are not the same two '
                + 'positions: A and B in one, D and F in the other. So in ABC the angle at C is '
                + '180 − 52 − 85 = 43°, and in DEF the angle at E is 180 − 52 − 43 = 85°. Both '
                + 'triangles now carry the angles 52°, 85° and 43°. This is the same subtraction '
                + 'the congruence concept used to turn AAS into ASA, doing the same job here: '
                + 'making two sets of data comparable before any comparison is attempted.',
              socratic:
                'Each triangle has two of its three angles named, and they are not the same two '
                + 'positions. What has to happen before the two sets of angles can be compared at '
                + 'all?',
            },
            {
              label: 'Pair the vertices by equal angle, and check the pairing is forced rather than chosen',
              detail:
                'A with D at 52°, B with E at 85°, C with F at 43°. Each of the three values '
                + 'occurs once in each triangle, so there is exactly one way to pair them and the '
                + 'correspondence is forced. Worth knowing what would change if two of the angles '
                + 'were equal: there would then be two valid correspondences, both true, and the '
                + 'statement would still have to commit to one of them in its letter order — the '
                + 'first point\'s lesson does not relax just because more than one pairing works.',
              socratic:
                'All three angle values occur in both triangles. Which vertex of DEF does each '
                + 'vertex of ABC have to pair with, and what would be different if two of the '
                + 'angles had come out equal?',
            },
            {
              label: 'Declare the similarity, and count how many lengths were used',
              detail:
                'Equal angles in matched positions is AA, so ABC is similar to DEF. Two angles '
                + 'rather than three because the third was never independent — the angle sum '
                + 'produced it in each triangle above, which is why AAA is not a separate '
                + 'criterion to remember but the same one with a redundant letter. And no side '
                + 'length appeared anywhere in the argument, because none was given: the '
                + 'similarity is established with every length in the problem unknown.',
              socratic:
                'You have used no side length at all, because none was given. What is it about '
                + 'what a similarity claims that lets angles on their own settle it?',
            },
            {
              label: 'Look for the scale factor and find there is nothing to read it off',
              detail:
                'The scale factor is a ratio of matched sides, and not one side of either triangle '
                + 'was given, so it is entirely unknown — any positive number is consistent with '
                + 'everything stated. That is not a gap in the problem; it is the content. The '
                + 'congruence concept refused AAA with the sentence that three angles contain no '
                + 'length, so nothing in them can fix a size, and a criterion has to pin down '
                + 'size as well as shape. Every word of that is still true. What changed is the '
                + 'demand: shape is all a similarity claims, so angle data is not short of '
                + 'anything it needs. Same deficiency, opposite verdict.',
              socratic:
                'The angles fixed the shape but left the scale factor completely unknown. '
                + 'Congruence refused angle-only data for exactly that reason — so why does the '
                + 'same gap not sink this criterion too?',
            },
          ],
          answer:
            'Yes. The angle at C is 180 − 52 − 85 = 43° and the angle at E is 180 − 52 − 43 = 85°, '
            + 'so both triangles have the angles 52°, 85° and 43°, pairing A with D, B with E and '
            + 'C with F. So ABC is similar to DEF by AA — AA rather than AAA because the angle sum '
            + 'forces the third angle, making the two the same criterion. The scale factor cannot '
            + 'be found and that is the point: no side of either triangle was given, so it could '
            + 'be any positive number. Three angles contain no length, which is exactly why AAA '
            + 'is not a congruence criterion and exactly why AA is a sufficient similarity one.',
        },
      },
      {
        id: 'the-same-proportion-read-across-or-down',
        conceptId: 'similarity',
        statement:
          'AB/DE = BC/EF compares each triangle with the other. Multiply through and it becomes '
          + 'AB/BC = DE/EF, which compares each triangle with itself — the same four lengths '
          + 'regrouped, no new geometry. The two readings are different numbers measuring '
          + 'different things, and this is the one place in the concept where that matters most: '
          + 'the across reading is the scale factor, which inverts if you start from the other '
          + 'triangle, while the down reading is the same for both triangles and survives scaling '
          + 'either of them again. A ratio of two sides therefore depends only on the angles, and '
          + 'that single fact is what the whole of right-triangle trigonometry is built on.',
        position: 3,
        workedExample: {
          problem:
            'Triangle ABC is similar to triangle DEF, with AB = 8, BC = 14 and DE = 20. Find EF. '
            + 'Then compare the ratio of the two known sides WITHIN each triangle, and say which '
            + 'of the two ratios would change if DEF were scaled again.',
          subgoals: [
            {
              label: 'Work across the two triangles first, to get the scale factor and the missing side',
              detail:
                'AB and DE are a matched pair with both lengths known, so the scale factor from '
                + 'ABC to DEF is 20/8 = 5/2, and EF = BC × 5/2 = 14 × 5/2 = 35. Check it against '
                + 'what a similarity demands of the other pair: AB/DE = 8/20 = 2/5 and '
                + 'BC/EF = 14/35 = 2/5, the same number, as it has to be.',
              socratic:
                'AB and DE are a matched pair with both lengths known. What does that pair give '
                + 'you, and what does it then make EF?',
            },
            {
              label: 'Regroup the proportion so each side of the equation stays inside one triangle',
              detail:
                'Start from AB/DE = BC/EF and multiply both sides by DE/BC. The left becomes '
                + 'AB/BC and the right becomes DE/EF, so AB/BC = DE/EF. Nothing geometric '
                + 'happened — it is the same equation with the same four lengths, regrouped. What '
                + 'changed is what each side of it describes: before, every ratio compared one '
                + 'triangle with the other; now each ratio stays inside a single triangle.',
              socratic:
                'AB/DE = BC/EF compares each triangle with the other. What do you have to do to '
                + 'the equation to make each side of it compare a triangle with itself?',
            },
            {
              label: 'Evaluate both of the within-triangle ratios, and compare the result with the scale factor',
              detail:
                'AB/BC = 8/14 = 4/7, and DE/EF = 20/35 = 4/7. Equal, which the rearrangement '
                + 'guaranteed before either was computed. Now put 4/7 beside the 5/2 from the '
                + 'first subgoal: they are different numbers, and conflating them is the easiest '
                + 'mistake in this concept. 5/2 compares the two triangles; 4/7 describes the '
                + 'shape of either one. Both are ratios of two lengths and that is all they have '
                + 'in common.',
              socratic:
                'You now have 8/14 from one triangle and 20/35 from the other. What do they each '
                + 'come to, and how does that number relate to the 5/2 you found earlier?',
            },
            {
              label: 'Scale the second triangle again and see which of the two ratios moves',
              detail:
                'Multiply every side of DEF by some factor t. The down ratio becomes '
                + '(20t)/(35t) = 4/7 — the t cancels, top and bottom, so it does not move at all. '
                + 'The scale factor becomes 5t/2 and moves with every choice of t. So the down '
                + 'ratio depends only on the triangle\'s shape, which by the point above means '
                + 'only on its angles, while the scale factor depends on the pair of figures and '
                + 'even on which of them you start from — 5/2 one way, 2/5 the other. That '
                + 'invariance is what makes right-triangle ratios worth tabulating: a ratio of '
                + 'two sides of a right triangle is a function of its acute angle alone, so one '
                + 'table serves every right triangle with that angle in it, whatever its size.',
              socratic:
                'Multiply every side of DEF by some factor t. Which of the two ratios still comes '
                + 'out the same, and what does that tell you about what it actually depends on?',
            },
          ],
          answer:
            'EF = 14 × 5/2 = 35. Across the triangles the ratios agree — 8/20 = 14/35 = 2/5 — and '
            + 'rearranging AB/DE = BC/EF into AB/BC = DE/EF gives 8/14 = 20/35 = 4/7, one number '
            + 'for both triangles. The two ratios measure different things: 4/7 describes the '
            + 'shape of either triangle, while the scale factor 5/2 compares the two and inverts '
            + 'to 2/5 if you start from the other. Scaling DEF by any t leaves 4/7 alone, since '
            + 'the t cancels, and sends the scale factor to 5t/2. So a ratio of two sides depends '
            + 'only on the angles, which is why such a ratio can be tabulated against an angle at '
            + 'all.',
        },
      },
    ],
  },
  {
    id: 'pythagoras',
    name: 'Pythagoras',
    subjectId: subject.id,
    scope: {
      id: 'pythagoras',
      label: 'Pythagoras',
      hint: 'pythagorean theorem hypotenuse right triangle converse',
      /*
       * Carried verbatim from the map node, like all four patterns above it and
       * for the same reason: widening a pattern while writing the material makes
       * two changes at once, and the recognition figure in tests/atlas.mjs would
       * move with no way to say which edit moved it.
       */
      match: /\bpythagorean theorem\b|\bpythagoras('|’)? theorem\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'assign-the-three-slots-before-computing',
        statement:
          'Decide which of a right triangle\'s three lengths is the hypotenuse before using the '
          + 'relation at all, and so choose between adding the two squares and subtracting one '
          + 'from another; produce the third length from the other two in either direction.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'take-the-root-and-leave-it-exact',
        statement:
          'Get a length from its square, giving the positive root only and saying what rules the '
          + 'other one out, and leave an irrational answer as a reduced surd rather than a '
          + 'decimal; say which of a rational and an irrational hypotenuse is the ordinary case.',
        taskKinds: ['evaluate', 'transform_to_form', 'justify'],
      },
      {
        id: 'test-three-lengths-and-read-the-sign',
        statement:
          'Decide from three lengths alone whether the triangle they make has a right angle, '
          + 'reading the sign of the comparison as acute, right or obtuse, and say what this test '
          + 'settles that the triangle inequality does not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-hypotenuse-is-not-one-of-three-equals',
        conceptId: 'pythagoras',
        statement:
          'a² + b² = c² is not symmetric in its three letters. c is the hypotenuse — the side '
          + 'opposite the right angle, and therefore the longest — and its square is the one that '
          + 'stands alone. So before the relation can be used at all, one of the three lengths has '
          + 'to be identified as c and the other two as legs. Getting that wrong is not a slip in '
          + 'the arithmetic: it turns an addition into a subtraction. Finding the hypotenuse adds '
          + 'the two squares; finding a leg subtracts the known leg\'s square from the '
          + 'hypotenuse\'s. One identity, rearranged, and which rearrangement you need is settled '
          + 'entirely by which length is missing.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason the first congruence point
         * gives and which applies here unchanged: the error this point exists
         * to stop is assigning the slots too quickly, so rewarding speed would
         * train the mistake. The arithmetic underneath is two squarings and a
         * subtraction.
         */
        workedExample: {
          problem:
            'A right triangle has a hypotenuse of 25 and one leg of 7. Find the other leg. Then '
            + 'take the SAME two numbers as the two legs of a different right triangle and find '
            + 'its hypotenuse. Say why the two answers are not the same number.',
          subgoals: [
            {
              label: 'Name which length the right angle is opposite, before touching the arithmetic',
              detail:
                'The problem calls 25 the hypotenuse, so 25 is the c, and the 7 and the unknown '
                + 'are the legs. That also fixes a bound worth carrying: the hypotenuse is the '
                + 'longest side, so the answer must come out below 25. Nothing has been computed '
                + 'yet, and this is the only step in the problem that is not arithmetic — it '
                + 'decides which of the three lengths the relation will treat differently from '
                + 'the other two.',
              socratic:
                'The relation a² + b² = c² does not treat its three letters alike. Which of the '
                + 'lengths you have been given is the one that has to sit alone on its own side '
                + 'of the equation, and what tells you that?',
            },
            {
              label: 'Rearrange the identity to isolate the unknown, which turns the addition into a subtraction',
              detail:
                'With the hypotenuse known and a leg missing, the relation reads 7² + b² = 25². '
                + 'Taking 7² across gives b² = 25² − 7² = 625 − 49 = 576. The subtraction was not '
                + 'chosen, it was forced by which side is missing: adding these two squares would '
                + 'be answering a different question, which is the second half of this problem.',
              socratic:
                'You know the hypotenuse and one leg, so the relation reads 7² + b² = 25². What '
                + 'has to happen to that equation before b² stands on its own?',
            },
            {
              label: 'Take the root, because the relation produced a square and the question asked for a length',
              detail:
                '576 is b², not b. So b = √576 = 24, and the three sides are 7, 24 and 25. Check '
                + 'it against the bound from the first step: 24 is less than 25, as a leg has to '
                + 'be. A learner who stops at 576 has not answered the question asked, and the '
                + 'size of the discrepancy is what makes it worth naming — 576 is more than '
                + 'twenty times the side it describes.',
              socratic:
                'You have b² = 576. What remains to be done to it, and what does the result have '
                + 'to be smaller than?',
            },
            {
              label: 'Give the same two numbers the other roles, and watch the relation change shape',
              detail:
                'Now let 7 and 25 both be legs, so the hypotenuse is the unknown and the relation '
                + 'is used in the adding direction: c² = 7² + 25² = 49 + 625 = 674. Not 576 — and '
                + 'not a near miss either, since 674 − 576 = 98, which is twice 7². The two '
                + 'problems were handed the same two numbers and differ only in which of them was '
                + 'called the hypotenuse, and that single decision moved the answer by more than '
                + 'the smaller side is long. So assigning the slots is not bookkeeping done '
                + 'before the real work; it IS the question being asked.',
              socratic:
                'The same two numbers, 7 and 25, now name two legs instead of a leg and a '
                + 'hypotenuse. What does the relation ask you to do with them now, and should the '
                + 'answer come out larger or smaller than before?',
            },
          ],
          answer:
            'The other leg is √(25² − 7²) = √576 = 24, so the first triangle is 7, 24, 25. With 7 '
            + 'and 25 as the two legs instead, the hypotenuse is √(7² + 25²) = √674, which is '
            + 'about 25.96 and does not reduce — 674 = 2 × 337 and 337 is prime. The two answers '
            + 'differ because the relation is not symmetric in its three letters: the '
            + 'hypotenuse\'s square is the one that stands alone, so knowing it means subtracting '
            + 'and not knowing it means adding. Both 576 and 674 are built from 49 and 625; which '
            + 'operation joins them is settled entirely by which length was called the hypotenuse.',
        },
      },
      {
        id: 'a-length-is-the-positive-root-and-usually-a-surd',
        conceptId: 'pythagoras',
        statement:
          'The relation gives c², and a side is c. Two things follow that the arithmetic does not '
          + 'supply by itself. The equation c² = 674 has two solutions and the triangle has one '
          + 'side, so only the positive root is a length — and what discards the negative one is '
          + 'what c MEANS, not anything in the algebra, since squares cannot tell a direction. '
          + 'And a sum of two squares is hardly ever itself a square, so the exact answer is '
          + 'normally irrational and is best left as a reduced surd. A decimal is a rounding of '
          + 'the answer; the surd is the answer.',
        position: 2,
        /*
         * Untimed, and the specific risk here is timing the same operation
         * twice. Reducing a surd is `pull-the-square-out` in
         * `roots-and-irrationals`, which is itself untimed, and what this point
         * adds in front of it is one addition. There is no fluency skill here
         * that the prerequisite does not already own.
         */
        workedExample: {
          problem:
            'A right triangle has legs 6 and 12. Give its hypotenuse exactly. Then do the same '
            + 'for legs 9 and 12, and say which of the two answers is the ordinary case.',
          subgoals: [
            {
              label: 'Add the two squares, and notice what the sum is a measurement of',
              detail:
                'Both legs are known and the hypotenuse is not, so this is the adding direction: '
                + 'c² = 6² + 12² = 36 + 144 = 180. What has been produced is c² and not c, and '
                + 'the distinction is about to do real work — 180 is a whole number and the side '
                + 'it describes is not one.',
              socratic:
                'Adding the two squares gives 180. What exactly is 180 a measurement of here — is '
                + 'it the length you were asked for?',
            },
            {
              label: 'Pull every square factor out from under the radical, leaving nothing that could follow',
              detail:
                '180 = 36 × 5 and 36 = 6², so √180 = √36 · √5 = 6√5. Nothing further can come '
                + 'out, because 5 is square-free, and that is what makes 6√5 the exact answer '
                + 'rather than merely a correct one. This is the prerequisite being used rather '
                + 'than restated: reducing a surd belongs to roots-and-irrationals, and what this '
                + 'concept contributed was the 180.',
              socratic:
                '180 = 36 × 5. What does that let you take out from under the radical, and how do '
                + 'you know nothing else can follow it out?',
            },
            {
              label: 'Discard the negative root on geometric grounds, since the algebra has no preference',
              detail:
                'c² = 180 is satisfied by 6√5 and by −6√5, and nothing in that equation prefers '
                + 'either — it is a statement about a square, and a square has lost the sign of '
                + 'what was squared. c is a length, so it is the positive one. The reason is worth '
                + 'separating from the step: it is the meaning of c that rules the other root out, '
                + 'not a cancellation or a restriction anywhere in the working.',
              socratic:
                'c² = 180 has two solutions and the triangle has one hypotenuse. Which solution '
                + 'is it, and what rules the other one out — the equation, or something outside it?',
            },
            {
              label: 'Change one leg to get a rational answer, and decide which case is the exception',
              detail:
                'With legs 9 and 12: c² = 81 + 144 = 225, and 225 = 15², so c = 15 exactly — '
                + 'three whole numbers, 9, 12 and 15. That looks like the well-behaved case and it '
                + 'is the rare one, because it needs the sum of the two squares to be a square, '
                + 'which is exactly what a Pythagorean triple is. 6 and 12 are the ordinary pair '
                + 'and 9 and 12 the lucky one. The sharpest version of the ordinary case is the '
                + '1-by-1 square: its diagonal is √2, the first length anybody proved was not a '
                + 'ratio of whole numbers, and it is this relation that produces it.',
              socratic:
                'Legs 9 and 12 give a whole number and legs 6 and 12 do not. Which of those two '
                + 'outcomes should you expect from a pair of legs picked at random, and what has '
                + 'to be true of the two squares for the other one to happen?',
            },
          ],
          answer:
            'Legs 6 and 12 give c² = 36 + 144 = 180, and √180 = √(36 · 5) = 6√5, which is exact '
            + 'because 5 is square-free; 13.4164… is not the answer but a rounding of it. Only the '
            + 'positive root is taken, and the reason is geometric rather than algebraic — '
            + 'c² = 180 is satisfied by −6√5 just as well, and a side cannot be negative. Legs 9 '
            + 'and 12 give c² = 225 = 15², so c = 15, a whole number. The second is the '
            + 'exception: it needs the sum of the two squares to be a square, which is what makes '
            + '9, 12, 15 a Pythagorean triple. The 1-by-1 square shows the general case is '
            + 'unavoidable — its diagonal is √2.',
        },
      },
      {
        id: 'the-converse-tests-a-triple-and-the-sign-grades-it',
        conceptId: 'pythagoras',
        statement:
          'Read backwards, the relation becomes a test: three lengths make a right triangle '
          + 'exactly when the two smaller squares add to the largest. So with three numbers and no '
          + 'figure you can decide whether there is a right angle among them. Two things make this '
          + 'more than the identity restated. The largest has to be identified first, for the '
          + 'reason the first point gives, or the test rejects a triangle that passes it. And the '
          + 'comparison answers more than yes or no: a² + b² − c², with c the largest, is zero for '
          + 'a right angle, positive when the angle opposite c is acute and negative when it is '
          + 'obtuse, so one subtraction classifies the triangle. It is a SECOND test on three '
          + 'lengths, after the triangle inequality — that one decides whether they close into a '
          + 'triangle at all, this one decides what kind the closing one is.',
        position: 3,
        /*
         * Untimed, like the two points above it and for the reason the triangle
         * inequality is untimed in `triangle-basics`: this is a decision with
         * an argument behind it, and the arithmetic that carries the decision is
         * two squarings and a subtraction, which the first point already covers.
         */
        workedExample: {
          problem:
            'Do the lengths 9, 40 and 41 make a right triangle? Then test 8, 40 and 41 the same '
            + 'way. Say what the sign of the comparison tells you in each case, and what it would '
            + 'have cost to test the first triple without sorting it first.',
          subgoals: [
            {
              label: 'Sort the three lengths, because the test is about the largest rather than about any of the three',
              detail:
                '41 is the largest of 9, 40 and 41, so it is the only candidate for the '
                + 'hypotenuse: a right angle is opposite the longest side, so if any angle here is '
                + 'right it is the one opposite 41. That makes 9 and 40 the legs. This is the '
                + 'first point\'s lesson arriving in the converse, and skipping it is the error '
                + 'the last part of this problem is about.',
              socratic:
                'Before any squaring: which one of 9, 40 and 41 could possibly be the hypotenuse, '
                + 'and what stops either of the other two from being it?',
            },
            {
              label: 'Compare the two smaller squares against the largest, as a difference so the sign stays visible',
              detail:
                '9² + 40² = 81 + 1600 = 1681, and 41² = 1681. So a² + b² − c² = 1681 − 1681 = 0. '
                + 'Zero is the right-angle case exactly, so 9, 40, 41 does make a right triangle — '
                + 'and it is a Pythagorean triple, since all three lengths are whole numbers. '
                + 'Writing the comparison as a difference rather than as two sides of an equation '
                + 'is what makes the next part possible: an equation can only be satisfied or not, '
                + 'while a difference also has a sign.',
              socratic:
                'You have 81 + 1600 on one side and 41² on the other. What is the difference '
                + 'between them, and what does that particular value say about the angle opposite '
                + '41?',
            },
            {
              label: 'Shorten one leg slightly and read the sign, not just the verdict',
              detail:
                'For 8, 40, 41: 8² + 40² = 64 + 1600 = 1664, and 1664 − 1681 = −17. Not zero, so '
                + 'not a right triangle — but the sign says which way it missed. Negative means '
                + 'the two smaller squares fall short of the largest, which means the angle '
                + 'opposite 41 has opened past a right angle: obtuse. That is what shortening a '
                + 'leg while leaving the hypotenuse alone does to that angle. Had the difference '
                + 'come out positive — 10, 40, 41 gives 1700 − 1681 = +19 — the angle would have '
                + 'been acute instead. One expression, three verdicts, chosen by its sign.',
              socratic:
                'For 8, 40, 41 the difference is −17 rather than 0. You already know the triangle '
                + 'is not right; what does the difference being negative rather than positive add '
                + 'to that about the angle opposite 41?',
            },
            {
              label: 'Separate this test from the one that only asks whether a triangle exists at all',
              detail:
                'Both triples close: 9 + 40 = 49 and 8 + 40 = 48, each greater than 41, so the '
                + 'triangle inequality admits both. It was never going to settle this question — '
                + 'it asks whether three lengths make a triangle, and both of these do. The '
                + 'converse asks what kind. Two tests on the same three numbers answering '
                + 'different questions, and a triple can pass the first and fail the second, as 8, '
                + '40, 41 does. The cost of skipping the sorting step is now measurable: testing '
                + 'the genuine right triangle as 9² + 41² against 40² gives 81 + 1681 = 1762 '
                + 'against 1600, a difference of 162, and the verdict "not a right triangle" about '
                + 'a triangle that is one. Every digit of that arithmetic is correct.',
              socratic:
                'Both 9, 40, 41 and 8, 40, 41 satisfy the triangle inequality, yet only one of '
                + 'them has a right angle. What is each of the two tests actually deciding?',
            },
          ],
          answer:
            '9, 40, 41 is a right triangle: 41 is the largest, 9² + 40² = 81 + 1600 = 1681 and '
            + '41² = 1681, so a² + b² − c² = 0. 8, 40, 41 is not: 64 + 1600 = 1664, so the '
            + 'difference is 1664 − 1681 = −17. The sign carries the rest — negative means the '
            + 'smaller squares fall short, so the angle opposite 41 is obtuse; positive would have '
            + 'meant acute, as 10, 40, 41 gives +19. Both triples satisfy the triangle inequality, '
            + 'since 49 and 48 both exceed 41, and that is the point: that test says a triangle '
            + 'exists, this one says what kind. Testing 9, 40, 41 without sorting first — '
            + '9² + 41² = 1762 against 40² = 1600 — gives a difference of 162 and the wrong '
            + 'verdict, by correct arithmetic on mis-assigned slots.',
        },
      },
    ],
  },
  {
    id: 'quadrilaterals-and-polygons',
    name: 'Quadrilaterals and polygons',
    subjectId: subject.id,
    scope: {
      id: 'quadrilaterals-and-polygons',
      label: 'Quadrilaterals and polygons',
      hint: 'parallelogram rhombus trapezoid polygon interior angle',
      /*
       * Carried verbatim from the map node, like all five patterns above it and
       * for the same reason: widening a pattern while writing the material makes
       * two changes at once, and the recognition figure in tests/atlas.mjs would
       * move with no way to say which edit moved it.
       *
       * It is anchored at the start of the title on purpose, which the node
       * decided and this concept has no reason to revisit. "Polygon" appears in
       * the prose of dozens of articles that are not about polygons, and the
       * five alternatives are all names an encyclopaedia puts first when the
       * article really is about the shape.
       */
      match: /^(quadrilateral|polygon|parallelogram|trapez|rhombus)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'ask-about-n-through-the-total-that-does-not-contain-it',
        statement:
          'Find how many sides a regular polygon has from one of its angles, by converting the '
          + 'interior angle at a vertex into the exterior angle and dividing the total that is the '
          + 'same for every polygon; say why the interior total cannot be used the same way.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'split-a-quadrilateral-and-fix-the-correspondence',
        statement:
          'Cut a parallelogram along a diagonal, fix the correspondence between the two triangles '
          + 'from the parallel pairs rather than from how the halves look, and produce all four '
          + 'angles from one of them; say which angles the diagonal left whole and which it split.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'say-what-equal-sides-force-and-where-they-stop',
        statement:
          'Produce the angles of a rhombus from one of them and then say which given they came '
          + 'out of, deciding whether equal sides force equal angles in a figure; say why the '
          + 'answer is yes for a triangle, no for every polygon above it, and what single '
          + 'quadrilateral is the exception.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'two-totals-and-only-one-grows-with-n',
        conceptId: 'quadrilaterals-and-polygons',
        statement:
          'A polygon carries two angle totals and they behave in opposite ways. The interior '
          + 'angles of a convex n-gon add to (n − 2) × 180°, which grows without limit as n does. '
          + 'The exterior angles — one at each vertex, each the supplement of the interior angle '
          + 'there — add to 360° for every convex polygon, whatever n is. The two totals come out '
          + 'of the same n vertices: the interior and exterior angles at a vertex lie along a '
          + 'straight line, so each vertex contributes 180° to the pair of totals together, they '
          + 'come to n × 180° between them, and subtracting the interior total leaves '
          + 'n × 180 − (n − 2) × 180 = 360. So a question about n should be asked through the '
          + 'exterior angle, because that is the total n has already been taken out of.',
        position: 1,
        /*
         * No `automaticityTarget`. The arithmetic here is one subtraction and
         * one division, and the subtraction is the straight-line sum that
         * `two-sums-every-angle-chase-uses` already times — a second target on
         * it would report one skill as two. What this point adds in front of
         * that subtraction is the CHOICE of which total to work in, and a
         * learner who makes it quickly rather than correctly has got the only
         * thing in the problem wrong.
         */
        workedExample: {
          problem: 'A regular polygon has interior angles of 156°. How many sides has it?',
          subgoals: [
            {
              label: 'Choose which of the two totals to work in, before doing any arithmetic',
              detail:
                'Through the interior total the question reads 156 = (n − 2) × 180 ÷ n, which has '
                + 'the unknown in two places — once in the total and once in the sharing out — so '
                + 'it has to be rearranged before it says anything. Through the exterior total it '
                + 'reads 24n = 360, with the unknown in one place and a constant on the right. The '
                + 'exterior total is the one n has already cancelled out of, and choosing it is '
                + 'the only decision in this problem; everything after it is arithmetic.',
              socratic:
                'One of the two totals changes with the number of sides and the other does not. '
                + 'Which of them lets you ask how many sides there are without already knowing?',
            },
            {
              label: 'Turn the interior angle at one vertex into the exterior angle there',
              detail:
                'At each vertex the interior angle and the exterior angle lie along a straight '
                + 'line, so they add to 180°, and the exterior angle is 180 − 156 = 24°. That is '
                + 'the straight-line sum from the angle facts, used once, at one vertex. Nothing '
                + 'about the rest of the polygon has been used yet — and nothing needs to be, '
                + 'which is what makes this step available before n is known.',
              socratic:
                'The interior and the exterior angle at one vertex lie along a straight line. '
                + 'What does that make the exterior angle here?',
            },
            {
              label: 'Divide the total that is the same for every polygon',
              detail:
                'The polygon is regular, so every one of its exterior angles is that same 24°, '
                + 'and they add to 360° however many of them there are. So 24n = 360 and '
                + 'n = 360 ÷ 24 = 15. Note where the 360 came from: not from anything about this '
                + 'polygon, but from the same fact that gives a triangle\'s three exterior angles '
                + '360° between them.',
              socratic:
                'Every exterior angle is 24° and together they come to 360°. How many of them are '
                + 'there?',
            },
            {
              label: 'Check back through the total that does grow, and read off how far apart the two are',
              detail:
                '(15 − 2) × 180 = 2340°, and a regular 15-gon shares that equally between its '
                + 'vertices: 2340 ÷ 15 = 156°, which is what was given, so the two routes agree. '
                + 'The comparison is the point of doing it. Between a triangle and this polygon '
                + 'the interior total went from 180° to 2340° — thirteen times as large — while '
                + 'the exterior total was 360° in both cases. Same vertices, same two angles at '
                + 'each of them, one total growing and one fixed.',
              socratic:
                'A triangle\'s interior angles come to 180° and this polygon\'s come to 2340°. '
                + 'What happened to the other total over the same change?',
            },
          ],
          answer:
            '15 sides. The exterior angle at a vertex is 180 − 156 = 24°, the exterior angles of '
            + 'any convex polygon add to 360°, and 360 ÷ 24 = 15. Checked the other way: '
            + '(15 − 2) × 180 = 2340 and 2340 ÷ 15 = 156, the angle given. The interior total grew '
            + 'from 180° for a triangle to 2340° here and the exterior total was 360° for both, '
            + 'which is exactly why the question was asked through the exterior angle: it is the '
            + 'total the number of sides has already been taken out of.',
        },
      },
      {
        id: 'a-diagonal-makes-two-triangles-that-match',
        conceptId: 'quadrilaterals-and-polygons',
        statement:
          'A quadrilateral is not a new object with its own list of facts: a diagonal cuts it into '
          + 'two triangles, and congruence then says what the two halves share. In parallelogram '
          + 'ABCD the diagonal AC crosses both parallel pairs, so the angle BAC equals the angle '
          + 'DCA and the angle CAD equals the angle ACB by the alternate-angle fact, while AC '
          + 'matches itself — two angles and the side between them, which is ASA. So ABC is '
          + 'congruent to CDA, pairing A with C, B with D and C with A. The angle at B is a whole '
          + 'angle of one triangle, so it equals the angle at D directly off that correspondence. '
          + 'The angles at A and at C are SPLIT by the diagonal, so each matches as a sum of two '
          + 'matched parts rather than as a matched part, and that difference is what a diagonal '
          + 'does to a correspondence.',
        position: 2,
        /*
         * No `automaticityTarget`. The only arithmetic is 180 − 64, which is
         * the subtraction the timed point already measures and the third
         * concept in this file to want it. Everything else here is reading a
         * correspondence, which is the first congruence point's
         * read-it-slowly case: the error this point exists to stop is matching
         * ABC with ACD, and speed is how that happens.
         */
        workedExample: {
          problem:
            'ABCD is a parallelogram and the angle at A is 64°. Find the angles at B, C and D, '
            + 'and say which fact settles each one.',
          subgoals: [
            {
              label: 'Produce two triangles to compare, by cutting along a diagonal rather than adding anything',
              detail:
                'Congruence is a claim about two triangles and a quadrilateral is not one, so draw '
                + 'the diagonal AC: it makes triangles ABC and CDA out of points that are already '
                + 'there. The other diagonal, BD, would do the same job for the other pair of '
                + 'opposite angles. AC is the one chosen here because it leaves the angles at B '
                + 'and at D whole, and the angle at B is what the problem asks for first.',
              socratic:
                'Congruence is a claim about two triangles and you have been given a '
                + 'quadrilateral. What can you cut it with to get two, without adding any new '
                + 'points?',
            },
            {
              label: 'Fix the correspondence from the parallels, not from how the two halves look',
              detail:
                'AB and DC are parallel and AC crosses them, so the angle BAC equals the angle '
                + 'DCA. AD and BC are parallel and AC crosses them too, so the angle CAD equals '
                + 'the angle ACB. And AC = CA needs nothing at all, being one segment read twice '
                + '— the same move as matching a triangle with itself. Two angles and the side '
                + 'between them: ASA, with A paired to C, B to D and C to A. So it is written ABC '
                + 'is congruent to CDA and not ABC is congruent to ACD, which would pair B with C '
                + 'and is supported by nothing here.',
              socratic:
                'The diagonal crosses both pairs of parallel sides. Which pairs of angles does '
                + 'that make equal, and so which vertex of CDA does B have to be paired with?',
            },
            {
              label: 'Read off the angle the diagonal left whole, then see why the others cannot be read the same way',
              detail:
                'B is paired with D and the angle ABC lies entirely inside triangle ABC, so the '
                + 'angle at B equals the angle at D straight off the correspondence. The angle at '
                + 'A is not like that: the diagonal splits it into DAC and CAB, and the '
                + 'correspondence matches those two pieces with BCA and ACD separately, neither of '
                + 'which is the whole angle at C. They still add to the same total — '
                + 'DAB = DAC + CAB = BCA + ACD = BCD — so the angle at A does equal the angle at '
                + 'C, but as a sum of two matched parts and not as one matched part.',
              socratic:
                'The correspondence pairs B with D and the diagonal left both of those angles '
                + 'whole. What did it do to the angles at A and at C, and what has to be added up '
                + 'before those two can be compared?',
            },
            {
              label: 'Get the one number from the parallel pair, then let the correspondence spread it',
              detail:
                'Nothing above produced a value: the congruence says which angles are equal to '
                + 'which, not how big any of them is. The number comes from the parallels a second '
                + 'time. AD and BC are parallel and AB crosses them, which makes the angles at A '
                + 'and at B co-interior, so they add to 180° and the angle at B is '
                + '180 − 64 = 116°. The correspondence then spreads that: the angle at D equals '
                + 'the angle at B, so 116°, and the angle at C equals the angle at A, so 64°. '
                + 'Check against the first point: 64 + 116 + 64 + 116 = 360, which is '
                + '(4 − 2) × 180 — the polygon total at four sides rather than a separate fact '
                + 'about quadrilaterals.',
              socratic:
                'The congruence has told you which angles are equal but not how big any of them '
                + 'is. Which of the two parallel pairs gives you an actual number for the angle '
                + 'at B?',
            },
          ],
          answer:
            'The angle at B is 116°, at C is 64° and at D is 116°. The diagonal AC makes ABC '
            + 'congruent to CDA by ASA — the two alternate-angle pairs supply the angles and AC '
            + 'itself is the included side — and that correspondence gives the angle at B equal to '
            + 'the angle at D directly, and the angle at A equal to the angle at C as a sum of two '
            + 'matched parts, since the diagonal splits both of those. The value comes from the '
            + 'other use of the parallels: AD parallel to BC with AB crossing them makes the '
            + 'angles at A and B co-interior, so B is 180 − 64 = 116. The four together are '
            + '64 + 116 + 64 + 116 = 360, which is (4 − 2) × 180.',
        },
      },
      {
        id: 'equal-sides-force-equal-angles-only-in-a-triangle',
        conceptId: 'quadrilaterals-and-polygons',
        statement:
          'In a triangle, equal sides and equal angles are the same information: the base-angle '
          + 'theorem turns one into the other, so equilateral and equiangular are one claim there '
          + 'and all three angles are forced to 60° with nothing left free. Above three sides that '
          + 'stops being true. A rhombus has four equal sides and its angles are a, 180 − a, a, '
          + '180 − a for every a strictly between 0° and 180°; a rectangle has four equal angles '
          + 'and need not have two sides the same length. So "all sides equal" and "all angles '
          + 'equal" are two separate claims for every polygon with four or more sides, which is '
          + 'why a square needs both words and an equilateral triangle needs one.',
        position: 3,
        /*
         * No `automaticityTarget`, for the reason the triangle inequality and
         * the Pythagorean converse are untimed: this is a decision with an
         * argument behind it rather than a fluency skill, and the arithmetic
         * carrying the decision is the 180-minus subtraction the point above
         * already borrows from the one timed point in the file.
         */
        workedExample: {
          problem:
            'ABCD is a rhombus — all four sides equal — and the angle at A is 64°. Find the other '
            + 'three angles. Then say what "all sides equal" would have forced in a triangle, and '
            + 'why the two answers differ.',
          subgoals: [
            {
              label: 'Use the fact the four equal sides do give you, which is that this is a parallelogram',
              detail:
                'All four sides equal means in particular that each pair of opposite sides is '
                + 'equal, so ABCD is a parallelogram and the point above applies with nothing '
                + 'changed: the angles at A and B are co-interior across the parallel pair, so the '
                + 'angle at B is 180 − 64 = 116°, and the congruence then gives the angle at C as '
                + '64° and the angle at D as 116°. Check: 64 + 116 + 64 + 116 = 360.',
              socratic:
                'All four sides are equal, so in particular each pair of opposite sides is. What '
                + 'kind of quadrilateral does that make this one, and what does the point above '
                + 'then hand you?',
            },
            {
              label: 'Go back through those three steps and ask which given each one used',
              detail:
                'Only the 64°. The step that produced the 116 was the co-interior pair, which '
                + 'needs AD parallel to BC and says nothing about lengths; the two equalities '
                + 'after it came from the congruence, which used the diagonal and the parallels '
                + 'and again no length. So the same four angles would have come out of ANY '
                + 'parallelogram with a 64° angle, and "all four sides equal" constrained nothing '
                + 'about them whatsoever.',
              socratic:
                'Read back through the three steps you just did. Which of them used the fact that '
                + 'the four sides are equal?',
            },
            {
              label: 'Ask the same question of a triangle, where the answer comes out the other way',
              detail:
                'Give a triangle two equal sides and the base-angle theorem forces the two angles '
                + 'opposite them to be equal — that is the self-matching argument under SAS. Apply '
                + 'it to a second pair of equal sides and all three angles are equal, so each is '
                + '180 ÷ 3 = 60° and there is nothing left over to choose. The rhombus left a '
                + 'whole family, one figure for each value of a between 0° and 180°; the '
                + 'equilateral triangle is a single shape.',
              socratic:
                'In a triangle, equal sides do force equal angles. Once all three sides are '
                + 'equal, how much freedom is left in the angles?',
            },
            {
              label: 'Find the one rhombus where the two claims do coincide, and say what is left over',
              detail:
                'A rhombus is equiangular when a = 180 − a, which is a = 90: the square, and only '
                + 'the square. So among equal-sided quadrilaterals exactly one is also '
                + 'equal-angled, where among equal-sided triangles every one of them is. That is '
                + 'the whole difference. "Equilateral" and "equiangular" are one claim at three '
                + 'sides and two different claims at four, and the 64° rhombus is the witness: '
                + 'every side equal, and no two adjacent angles equal.',
              socratic:
                'The rhombus\'s angles are a and 180 − a. For which value of a are all four of '
                + 'them equal, and how many rhombuses does that leave?',
            },
          ],
          answer:
            'The angle at B is 116°, at C is 64° and at D is 116° — which is the answer any '
            + 'parallelogram with a 64° angle would give, since no step used the equal sides. A '
            + 'triangle with all three sides equal is forced to three 60° angles with no freedom '
            + 'at all, by the base-angle theorem applied twice. The difference is that above three '
            + 'sides equal-sided no longer means equal-angled: a rhombus is equiangular only when '
            + 'a = 180 − a, that is a = 90, which is the square. So "all sides equal" and "all '
            + 'angles equal" are one claim for a triangle and two for every polygon beyond it.',
        },
      },
    ],
  },
]

/**
 * Six edges: one prerequisite per promotion after the first, plus the one
 * interference the fourth promotion brought with it.
 *
 * THE SIXTH PROMOTION MADE THIS A TREE RATHER THAN A LINE, which is the one
 * structural thing about the list that has changed since it was written, and
 * the note on `congruence->quadrilaterals-and-polygons` at the bottom carries
 * the argument. Everything below it describes a list of five that was a chain
 * of four plus an interference, and all of that is still true of those five.
 *
 * An authored ontology's edges may only name concepts it contains, or
 * `ontologyProblems` reports an unknown endpoint for each one. While this
 * subject held a single concept there was no internal pair to join, and the
 * list was empty for that reason — stated here because the emptiness was
 * load-bearing text and its disappearance should not read as a fix.
 *
 * `points-lines-angles` stranded nothing when it was promoted: the node
 * declared no `needs`, the map calls it a root, and the one edge pointing INTO
 * it was declared by `triangle-basics`, which was still on the map and
 * therefore still owned it. That was the atlas's cheapest promotion and it is
 * described at length in atlas-foundations.ts.
 *
 * `triangle-basics` then stranded exactly that edge, because an edge is owned
 * by the node that DECLARES it and this one was the promoted node's own
 * `needs`. Removing the node would have deleted it. The usual rehoming is an
 * area's `links`, which is where the expressions subject had to put both
 * halves of its boundary — but here both endpoints are now concepts of THIS
 * subject, so the edge is internal to the ontology and belongs in it. That is
 * strictly better than a `links` entry: an area file would be asserting a
 * relation between two concepts it no longer contains, and `areaOntology`
 * would filter it straight back out of the area view.
 *
 * The three edges pointing INTO `triangle-basics` — from `congruence`,
 * `area-and-perimeter` and `law-of-sines-cosines` — needed no attention at
 * all. Each is declared by a node that stayed in `euclidean-geometry`, so each
 * is still owned where it was written and `composeAtlas` resolves it across
 * the file boundary. `EUCLIDEAN_GEOMETRY` still declares no `links`.
 *
 * `congruence` then did the same thing a second time, and it is worth noting
 * that the cheap case REPEATS rather than being a one-off of the triangles.
 * Its own `needs` was `['triangle-basics']` — one edge, stranded by the
 * promotion because the promoted node declared it — and by the time it was
 * stranded both of its endpoints were concepts of this subject, so it is
 * internal here exactly like the edge above it. The four edges pointing INTO
 * `congruence`, from `geometric-proof`, `similarity`,
 * `quadrilaterals-and-polygons` and `isometries-and-symmetry`, were untouched
 * for the usual reason: each is declared by a node that stayed on the map.
 *
 * `similarity` then broke the streak, and it is the reason this list is no
 * longer all prerequisites and no longer the whole story of the promotions. It
 * declared TWO `needs` and they did not land in the same place. `congruence`
 * was already a concept here, so that edge is internal and sits below with the
 * other two. `ratio-and-rate` was then a node of `NUMBER_AND_ARITHMETIC` and
 * is a node of `algebra-foundations` now, those two areas having merged; either
 * way it is a map node rather than a concept of this subject, and
 * an authored ontology may only name concepts it CONTAINS — `ontologyProblems`
 * reports an unknown endpoint otherwise — so that one could not come here at
 * all and went to `EUCLIDEAN_GEOMETRY.links`, which had been empty through
 * three promotions. The area file carries the full argument for why it is filed
 * there rather than under the other endpoint's area.
 *
 * It also stranded a `confusedWith` pointing at `congruence`, which
 * `expandEdges` turns into an `interferes_with`. Both endpoints were concepts
 * by then, so that one IS internal and does sit below — making this the first
 * edge list in the subject that is not purely a prerequisite chain, which is
 * why tests/concepts-logic.mjs now asserts the chain over the prerequisites
 * specifically rather than over every edge.
 *
 * `pythagoras` then repeated similarity's shape exactly — two `needs`, landing
 * in two different places — so the expensive case is now the pattern rather
 * than the exception, and the "cheapest kind" run of three looks more clearly
 * like a property of authoring upward from a root one node at a time.
 * `similarity` was already a concept here, so that edge is internal and sits
 * below, extending the chain to four. `roots-and-irrationals` could not come,
 * and the reason differs from `ratio-and-rate`'s in a way worth keeping: that
 * one is still a map NODE, while this one is a fully authored concept — of
 * `arithmetic-foundations`, not of this subject. An ontology's edges may only
 * name concepts it contains, and being authored elsewhere fails that test just
 * as being unwritten does. So it went to `EUCLIDEAN_GEOMETRY.links` beside the
 * other one.
 *
 * The consequence is the opposite of that neighbour's, though, and it is the
 * first time a `links` entry in that area has done anything. `ratio-and-rate`
 * has no material, so its link gates nothing today. `roots-and-irrationals` is
 * three knowledge points and six tasks, so the moment this edge was written
 * `pythagoras` acquired a gate in `arithmetic-foundations` — a prerequisite in
 * another subject that a learner must actually demonstrate. A promotion out of
 * this area has not previously reached across a subject boundary and landed on
 * something real.
 *
 * The root claim was left exactly as the map made it. Angle arithmetic plainly
 * uses whole-number subtraction, so an edge down to `integer-arithmetic` could
 * be argued for — but adding a prerequisite changes what gates what for every
 * learner, and doing it as a side effect of writing worked examples is the
 * thing the journeys module records itself refusing to do. If that edge
 * belongs on the map it belongs there as its own decision.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'points-lines-angles->triangle-basics',
    from: 'points-lines-angles',
    to: 'triangle-basics',
    kind: 'prerequisite',
    /*
     * `author:` rather than `atlas:euclidean-geometry`, which is what
     * `expandEdges` stamped on it while it was a node's `needs`. The
     * provenance moved with the edge and saying otherwise would point a reader
     * at an area file that no longer mentions either endpoint.
     *
     * The claim itself is unchanged and is stronger than it was: the angle sum
     * is PROVED from the transversal fact in the point above, so this is not
     * merely curriculum ordering — the first worked example of
     * `triangle-basics` is unreadable without it.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'triangle-basics->congruence',
    from: 'triangle-basics',
    to: 'congruence',
    kind: 'prerequisite',
    /*
     * `author:` for the same reason as the edge above — `expandEdges` stamped
     * `atlas:euclidean-geometry` on it while it was a node's `needs`, and the
     * provenance moved with the edge.
     *
     * The claim is load-bearing rather than ordering. Every one of the three
     * knowledge points below uses the angle sum directly: the first takes a
     * third angle from 180, the second completes two angle triples and turns
     * AAS into ASA with that same subtraction, and the third splits what the
     * apex leaves between the two base angles. Without `triangle-basics` none
     * of the three worked examples can be finished.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'congruence->similarity',
    from: 'congruence',
    to: 'similarity',
    kind: 'prerequisite',
    /*
     * `author:` for the same reason as the two edges above — `expandEdges`
     * stamped `atlas:euclidean-geometry` on it while it was a node's `needs`,
     * and the provenance moved with the edge.
     *
     * Load-bearing rather than ordering, and more so than either edge above it.
     * The first knowledge point here is literally the congruence statement with
     * three of its six claims weakened, and it is written that way: it reads
     * the letter order by the rule congruence established, then says which of
     * the six claims survived. The third point of this concept also leans on
     * the AAA refusal by name. Without `congruence` the first point has nothing
     * to be a loosening OF, and the second point's punchline — same deficiency,
     * opposite verdict — cannot be stated at all.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'similarity~congruence',
    from: 'similarity',
    to: 'congruence',
    kind: 'interferes_with',
    /*
     * THE FIRST EDGE THIS SUBJECT HAS THAT IS NOT A PREREQUISITE, and it was
     * stranded by the promotion exactly like the three above — it was the map
     * node's `confusedWith`, which `expandEdges` turns into an
     * `interferes_with` with the `because` as its rationale. Removing the node
     * would have deleted it silently, and it is the one edge in this area whose
     * loss would not show up as a missing gate: interference constrains
     * SELECTION, so dropping it makes the scheduler free to introduce the two
     * together, which is the single worst pairing in the subject.
     *
     * It keeps the node's reason verbatim. The rationale is also now an
     * understatement of what the material does with it: the first knowledge
     * point is built around this exact error, and the second worked example
     * turns the confusion into the thing being taught rather than merely warned
     * about. The interference stands anyway — the two concepts must still never
     * be INTRODUCED together, and a point that teaches the difference is a
     * reason to keep them apart in the schedule, not a reason to stop caring.
     *
     * Direction is nominal, as types.ts says: `interferes_with` is symmetric
     * and stored once. It is written similarity → congruence, matching the node
     * that declared it.
     */
    promotedBy: 'author:plane-geometry',
    rationale:
      'Both are taught as triangle criteria with three-letter names and both conclude '
      + '"corresponding parts match", so learners apply congruence criteria to similar '
      + 'figures and conclude the sides are equal rather than proportional.',
  },
  {
    id: 'similarity->pythagoras',
    from: 'similarity',
    to: 'pythagoras',
    kind: 'prerequisite',
    /*
     * `author:` for the same reason as the three prerequisites above it, and
     * stranded the same way: it was the promoted node's own `needs`.
     *
     * This is the HALF of `pythagoras`'s `needs` that could come here. The
     * other half, `roots-and-irrationals`, is authored in
     * `arithmetic-foundations`, and an ontology's edges may only name concepts
     * it CONTAINS — so it went to `EUCLIDEAN_GEOMETRY.links` instead, which is
     * the second entry that list has ever held. The area file carries the
     * argument.
     *
     * The claim is ordering rather than load-bearing, and this is the first
     * edge in the subject where that is true, so it is worth being plain about.
     * The three edges above are each used by the material they gate — the first
     * point of `congruence` cannot be finished without the angle sum, and the
     * first point of `similarity` is literally the congruence statement with
     * three claims weakened. Nothing in the three points below reads a
     * similarity. What similarity supplies is the PROOF of the identity, and
     * that proof is the half of this concept that stayed on the map, for the
     * reason the header gives at length. So the edge is kept because the
     * curriculum claim is true — nobody should meet the hypotenuse before
     * meeting similar triangles — and not because a worked example here leans
     * on it. Deleting it to match the material would have been the wrong
     * repair: the map made this claim, the promotion did not re-decide it, and
     * an authoring pass is not the place to drop a gate.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'congruence->quadrilaterals-and-polygons',
    from: 'congruence',
    to: 'quadrilaterals-and-polygons',
    kind: 'prerequisite',
    /*
     * THE EDGE THAT FORKS THE SUBJECT, and it is the first one here that does.
     *
     * Every promotion before this one was directly above the last, so the four
     * prerequisites above form a single line: angle facts, triangles,
     * congruence, similarity, Pythagoras. This one hangs off `congruence`
     * alongside `congruence->similarity`, because the sixth promotion was NOT
     * the node above the fifth — it is a second branch out of the third. The
     * list is therefore a tree now rather than a chain, which is why
     * tests/concepts-logic.mjs asserts the line and the fork separately instead
     * of asserting one ordered string.
     *
     * That is worth being plain about rather than quietly appending, because
     * the five promotions above produced a habit — "the cheapest next concept
     * is the one directly above the last" — and the habit had run out. Nothing
     * sits directly above `pythagoras` whose other prerequisites are written:
     * `circles` needs `geometric-proof` and `right-triangle-trig` is in another
     * area. What was available was the other child of `congruence`, which had
     * been waiting since the third promotion.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the four above it:
     * `expandEdges` stamped the area on it while it was the node's `needs`, and
     * the provenance moved with the edge.
     *
     * The claim is load-bearing rather than ordering, which puts it with the
     * first three edges and not with `similarity->pythagoras`. The second
     * knowledge point IS a congruence argument — it draws a diagonal, fixes the
     * correspondence from the alternate angles, applies ASA and then reads the
     * conclusion off the letter order, which is the first congruence point's
     * lesson used on a figure that is not a triangle. The third point then
     * leans on the base-angle theorem from that concept's third point by name.
     * Neither worked example can be finished without `congruence`.
     *
     * The node's OWN `needs` was `['congruence']` and nothing else, so this is
     * the whole of what the promotion stranded, and `EUCLIDEAN_GEOMETRY.links`
     * needed no entry — the cheap case, back for the first time since the third
     * promotion. The one edge pointing INTO the node was untouched as always:
     * `area-and-perimeter` is its only dependent anywhere in the atlas, it
     * names the node in its own `needs`, and it stayed on the map — so it still
     * owns that edge and `composeAtlas` resolves it across the file boundary.
     * One dependent is also the count at which a dropped edge is easiest to
     * miss, which is why tests/atlas.mjs asserts that particular gate by name.
     */
    promotedBy: 'author:plane-geometry',
  },
]

export const PLANE_GEOMETRY: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
