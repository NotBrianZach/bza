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
 * ── THE ELEVENTH PROMOTION WAS CHOSEN BY AN EDGE KIND, NOT BY A ROUTE ─────
 *
 * `distance-and-midpoint` is the first concept written here with no journey
 * behind it. Every promotion above was argued from a route — "the journey it is
 * on had N unwritten steps left and the other had M" — and that argument has
 * run out: all ten journeys read zero unwritten, the route table in
 * tests/atlas.mjs is empty, and the test it gave way to is not a weaker version
 * of the same thing. Recomputing readiness from the tree left twenty-one map
 * nodes with every prerequisite authored and no area anywhere near the
 * five-node floor, so nothing was decided by availability.
 *
 * WHAT DECIDED IT WAS AN EDGE THAT COULD BE EXPRESSED IN EXACTLY ONE PLACE.
 * The node declared `exercises: ['pythagoras']`, which `expandEdges` turns into
 * an `encompasses`, and deleting the node deletes it with no suite going red —
 * `encompasses` gates nothing, so its loss shows up only as a learner
 * re-drilling what they just demonstrated. `pythagoras`'s own promotion note in
 * this file predicted exactly this: it called the edge "half-live" and said
 * "the remaining half is the other endpoint's promotion". Keeping it meant
 * filing the concept in the subject holding the far end, because an area's
 * `links` carries `prerequisite` edges ONLY and an `encompasses` across two
 * files has no home at all. So the half-live edge is now live, and this subject
 * has a coordinate concept in it.
 *
 * THE FILING IS THE PART TO ARGUE WITH, and the objection is this file's own:
 * `subject.covers` describes a syllabus of figures taken "as far as it goes
 * without a drawing", and `vectors-and-independence` already owns
 * `cartesian-plane`, the dot product and three-dimensional coordinates. On
 * subject matter the vectors win. They lose on the edge, and the edge is not a
 * detail — the whole argument for `encompasses` existing as a kind is in
 * types.ts, which calls it the thing that "makes credit computable" and names
 * re-drilling the most recently demonstrated prerequisite "the dominant
 * inefficiency in a domain that is mostly prerequisite structure". A filing
 * that reads better and silently deletes that is the worse trade.
 *
 * It is also not a new precedent. ontology-algebra.ts took
 * `gaussian-elimination` away from the matrices subject that had reserved it
 * for exactly this reason, running the other way: the credit edge to
 * `systems-of-linear-equations` "could exist nowhere but inside one ontology".
 * Two promotions decided by `links` carrying one kind is enough to call it a
 * rule — when a promoted node's `exercises` or `confusedWith` points at an
 * authored concept, the subject holding that concept is the only candidate, and
 * the subject-matter argument is a tie-break between whatever is left.
 *
 * WHAT IS NOT HERE, so that the boundary is a boundary and not a beachhead.
 * Slope, the three forms of a line, the circle as an equation and the conics
 * are still nodes of `euclidean-geometry`, and none of them has a credit edge
 * into this subject — `lines-in-the-plane` and `loci-and-regions` both simply
 * NEED this concept, which is an edge declared at their end and therefore
 * untouched. So nothing about this promotion pulls the next one here, and
 * `covers` says so rather than leaving it to be inferred.
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
 * AND IT WAS TAKEN, which is why that paragraph is in the past tense now
 * rather than standing as an open recommendation. `real-number-line` is the
 * eleventh concept of `arithmetic-foundations`, authored in
 * ontology-arithmetic.ts, and the gate it tightened is the predicted one:
 * `cartesian-plane` used to rest on an empty node that `gatingPrerequisitesOf`
 * looked straight through to the arithmetic two steps below, and now rests on
 * a concept with three knowledge points and three tasks.
 *
 * So the next choice is genuinely open and this file no longer has a
 * nomination to hand over. What it still has is the warning it earned:
 * `geometric-proof` is the one remaining concept in this subject's own area
 * whose prerequisites are all written, and the objection recorded above it has
 * not been answered. Its natural task kind is `justify`, `justify` is not
 * machine-rulable, and three chains that cannot become evidence is a worse
 * outcome than a mapped node. The question to answer BEFORE writing it is
 * unchanged — what in it can be asked as a value at all — and the real-line
 * promotion is weak evidence that the answer exists, since the one part of
 * THAT concept which could not be asked for was handled by asking a
 * hypothesis of the argument and saying in the prompt that the conclusion was
 * unaskable. Whether that compromise scales to a concept where EVERY chain
 * ends in an argument is the open question, not a settled no.
 *
 * IT WAS NOT A SETTLED NO, AND THE EIGHTH PROMOTION SETTLED IT YES. Left in
 * the present tense above because it is the record of two promotions declining
 * the node, and that record is the evidence the question was real rather than
 * an excuse — but a reader must not arrive here believing it is still open.
 * `geometric-proof` is authored; the answer is in the eighth-promotion section
 * below, and it did not need the real line's compromise at all.
 *
 * ── THE SEVENTH PROMOTION WENT ROUND THAT WARNING, AND SAYS SO ────────────
 *
 * `area-and-perimeter` is the seventh, and it is the first promotion in this
 * file chosen over a better-placed candidate for a reason that is about the
 * ENGINE rather than about the map. Two nodes of the merged area had all their
 * prerequisites written: this one, resting on `quadrilaterals-and-polygons`
 * and `triangle-basics`, and `geometric-proof`, resting on `congruence`. Both
 * are on both unfinished routes, so each cuts exactly one unwritten step off
 * each of them and there is nothing to choose between them there.
 *
 * `geometric-proof` has the better structural case and losing anyway is the
 * point. It is the sole remaining blocker of `circles`, so authoring it is the
 * only move that makes a NEW node available; authoring this one unblocks
 * nothing, because the node above it is `circle-measure` and that needs
 * `circles` too. By the measure the first six promotions used it should have
 * been taken.
 * What stopped it is the objection two paragraphs up, which has been standing
 * in this file and in atlas-foundations.ts since the sixth promotion and is
 * still unanswered: `justify` is not machine-rulable, and a concept all of
 * whose chains end with no ruling is worse than a mapped node. Answering that
 * question is a decision about what evidence the build will accept, and it is
 * not a thing to settle as a side effect of writing worked examples — which is
 * the same argument the area-merge paragraphs above make about the map, applied
 * to the grader instead.
 *
 * So the honest statement of what this promotion is: the best available node
 * whose material can be RULED, taken in preference to the best available node.
 * The debt is unchanged and is handed on rather than reduced.
 *
 * AND THE EIGHTH PROMOTION THEN PAID IT, which is what makes the two deferrals
 * above worth reading rather than merely worth apologising for. The question
 * they refused to settle as a side effect was the right question, and it had a
 * better answer than either of them expected: the three points of
 * `geometric-proof` carry six `evaluate` tasks and `chainsWithNoRuling` did not
 * move. What the deferrals cost was two promotions' delay on the only node that
 * unblocks a new one. What they bought was the question being asked out loud
 * instead of answered by whoever happened to be writing worked examples, which
 * is the trade this file would make again.
 *
 * WHAT SURVIVES BEING WRITTEN DOWN, in a concept whose node summary is "every
 * polygon formula reduced to the rectangle by cutting and rearranging" — which
 * is a figure argument from end to end, so the figure test looked certain to
 * take at most a third of this node:
 *
 *   Additivity, which is where the formulas come FROM rather than one of them.
 *   A region cut into pieces has the sum of their areas, so a rectangle with a
 *   rectangular piece removed is 60 − 12 and nothing in that subtraction says
 *   where the piece was. That is arithmetic on a total — the shape that has now
 *   passed this test seven times — and it is also the first point in the file
 *   whose content is that a given was NOT used. The rectangle's own formula is
 *   taken as the definition of the measure and the cut-and-rearrange
 *   derivations are taken as given, which leaves additivity carrying the
 *   concept, and it turns out to be enough.
 *
 *   The matched pair. ½ × base × height is not symmetric in its two letters any
 *   more than a² + b² = c² is in its three: the height belongs to one base, and
 *   a triangle carries three such pairs which all give the same area. This is
 *   `pythagoras`'s first point in a second concept — assign the roles before
 *   computing, with the identical failure mode, which is correct arithmetic on
 *   mis-assigned slots. What is new is that the mis-assignment can be REFUSED
 *   rather than merely scored wrong: the perpendicular from a vertex is the
 *   shortest route to the base's line, so the triangle inequality rules out any
 *   candidate height longer than a side reaching the base, before any
 *   arithmetic is done. That is the first subgoal in the subject that disposes
 *   of a wrong answer without computing it.
 *
 *   Neither measure decides the other. The best part of the concept, and the
 *   claim-about-claims shape for the fifth time. Cut the same 12 cm² piece out
 *   of the same sheet at a corner and at the middle of an edge: both leave
 *   48 cm², and the perimeters are 32 cm and 38 cm, because a corner cut
 *   replaces the two edge-lengths it removes with the two sides of its notch
 *   while a middle cut adds both of its sides with nothing removed to pay for
 *   them. One piece, one area, two perimeters. The converse direction is a pair
 *   of rectangles — 10 by 6 and 15 by 1, both 32 cm round, 60 cm² against
 *   15 cm². No figure in any of it, and both directions are exact arithmetic.
 *
 * WHAT IS ABSENT, named rather than approximated:
 *
 *   Every cut-and-rearrange derivation, which is the node summary's own
 *   description of the concept. That two copies of a triangle make a
 *   parallelogram on the same base and height, and that a parallelogram cuts
 *   and rearranges into a rectangle, are both taken as given like SSS, SAS,
 *   ASA, AA, the Pythagorean identity and the triangulation above them. They
 *   are statements about what a drawing does. So the halving is asserted and
 *   everything built on it is derived, which is the same division of a point
 *   the polygons made: the figure-dependent half is one sentence of hypothesis
 *   and the arithmetic on top of it is the material.
 *
 *   The trapezium and every other named-shape formula. Each is stated in terms
 *   of which pair of sides is parallel and which distance separates them, so
 *   stating one is describing a figure. The concept works with rectangles,
 *   triangles and regions assembled out of rectangles, which are the shapes a
 *   sentence can pin down completely.
 *
 *   Circular measure, which is a node of its own above this one — π as the
 *   ratio shared by every circle, and circular area as a limit of inscribed
 *   polygons. It needs `circles` as well as this concept and is therefore
 *   behind `geometric-proof` too, so it is doubly out of reach rather than
 *   merely unwritten.
 *
 *   Units of area as a system, and the scaling law that goes with it — that
 *   multiplying every length by k multiplies an area by k². It is genuinely
 *   figure-free and it was left out on a boundary rather than a figure: the
 *   claim is about similar figures and `similarity` is not a prerequisite of
 *   this node. Writing it here would lean on a concept the map does not gate
 *   this one by, and adding that edge is a decision about the map. Named so the
 *   omission does not read as an oversight.
 *
 * ── THE EIGHTH PROMOTION ANSWERED THE QUESTION THE SIXTH AND SEVENTH ASKED ─
 *
 * `geometric-proof` is the eighth, and it is the node this file passed over
 * twice while recording exactly what would have to be settled before anybody
 * took it. The debt is paid rather than handed on again, so the paragraphs that
 * state it stand as the record of two promotions choosing against it and this
 * section is what happened when the choice went the other way.
 *
 * THE OBJECTION, restated so it is not softened in the retelling: this node is
 * about the ARGUMENT being the answer, its natural task kind is `justify`,
 * `justify` is declared unverifiable in types.ts and tests/concepts-logic.mjs
 * refuses to ship a task of any unverifiable kind at all — so a justify-only
 * concept has no tasks, and a knowledge point with no task is a chain that
 * cannot become evidence. Three of those is worse than a mapped node. The
 * question attached to the objection was "what in it can be asked as a value at
 * all", and it was a real question rather than a rhetorical one.
 *
 * THE ANSWER IS THE ONE THE PREVIOUS FIVE PROMOTIONS ALREADY FOUND, which is
 * why it is worth stating plainly rather than presenting as an invention. What
 * survives being written down in a figure-heavy node has turned out, every time,
 * to be the part that is really a CLAIM ABOUT CLAIMS — the congruence letter
 * order, similarity and congruence disagreeing about AAA, which slot of
 * a² + b² = c² a length occupies, the two angle totals, two measures
 * determining each other in neither direction. A claim about claims can be
 * refuted by a value, and a refutation is a number. So:
 *
 *   The chain is an expression. A proof that cites the straight line, the
 *   base-angle theorem and the angle sum in that order composes into
 *   180 − 2(180 − x), which simplifies to 2x − 180. That is the argument
 *   written as arithmetic, and evaluating it is a real `evaluate` ask rather
 *   than a proxy: the composite form IS the citations in order, and the fact
 *   that it returns an angle only for x above 90° is the chain stating its own
 *   hypothesis. What the task cannot score is the ORDER the citations were made
 *   in, which the prompts name, as every block in tasks.ts does.
 *
 *   A converse and a contrapositive are told apart by a subtraction. Congruent
 *   triangles have equal perimeters; the contrapositive of that is free and the
 *   converse is a new and false claim. Both are settled by the sign of one
 *   difference of two perimeters — zero is the converse's hypothesis holding and
 *   licensing nothing, non-zero is the contrapositive concluding outright. One
 *   expression, two inputs, and the two verdicts are "this proves nothing" and
 *   "this proves it", which is the distinction the point exists for.
 *
 *   A counterexample is checked by an angle sum before it is used. One exterior
 *   angle of 180 − 100 = 80° kills "every exterior angle is obtuse"; a proposed
 *   counterexample whose angles total 190 kills nothing, because the claim never
 *   spoke about it. The second of those is the better task, and it is the same
 *   expression as `the-third-angle-was-never-free-1` in `congruence` doing the
 *   opposite job — identically zero there for any real triangle, non-zero here
 *   to disqualify an object that is not one.
 *
 * So `chainsWithNoRuling` did not move. It is 1, it is
 * `log-argument-is-positive` in the exponentials subject, and it is there
 * deliberately and permanently.
 *
 * WHAT IS STILL ABSENT, named rather than approximated, and the first item is
 * the one the objection was really about:
 *
 *   `counterexample` as a task kind. The third point is the first place in the
 *   build where it is the natural ask — "produce a triangle that breaks this" —
 *   and tasks.ts declares the kind verifiable while shipping no tasks of it,
 *   because ruling one needs a checker that can test a produced object against a
 *   claim and there is none. So the objective does not name it. The refutation is
 *   asked as the two values it reduces to instead, which is less than the real
 *   ask and is the honest amount less. This is the thing to build if anybody
 *   wants this concept asked properly.
 *
 *   Every proof whose steps are about a drawing, which is most of school
 *   geometry's proofs and all of the ones this area is still holding. The worked
 *   examples here chain angle facts, because an angle chain is a chain of
 *   sentences; a proof that adds a construction line is a chain of pictures.
 *
 *   Two-column layout, and this one is left out on a boundary rather than a
 *   figure. It is a convention for writing a proof down rather than a fact about
 *   what makes one valid, and the node's `terms` mention it only as a search
 *   hint. The citation discipline it exists to enforce — every reason named,
 *   every reason available before the step that uses it — is the first knowledge
 *   point's whole subject, written as prose instead of as a table.
 *
 *   Induction, and the formal treatment of implication. Both are figure-free,
 *   and both are left out because the MAP has already placed them above this
 *   node rather than inside it. `mathematical-induction` is in
 *   `sequences-and-series` and names `geometric-proof` in its own `needs`;
 *   `propositional-logic` is in `discrete-mathematics`, names this node too, and
 *   atlas-structures.ts argues at length that the geometry is the real entry
 *   point and the logic is the second pass.
 *
 *   That second one is the sharpest boundary in this concept, because
 *   `propositional-logic` lists "contrapositive" among its own `terms` and the
 *   second knowledge point here is about exactly that word. The division is not
 *   arbitrary: what is written here is the contrapositive of ONE proved
 *   statement about triangles, used on three specific triangles, which is a
 *   learner meeting the rearrangement before having a notation for it. What is
 *   above is the truth table — implication as a connective, the equivalence
 *   proved rather than demonstrated, and the quantifier negation that makes the
 *   third point's "every" into a "there exists". So this concept must not grow
 *   a general account of implication, and the reason is the map's, not a limit
 *   of what prose can carry.
 *
 * ── THE NINTH PROMOTION TOOK THE NODE THIS FILE HAD WRITTEN OFF IN PROSE ──
 *
 * `circles` was chosen by the same readiness test as the eight above it, and
 * the test is now the only heuristic left — the three the file used to lean on
 * are all spent. It is not the node above the last: `geometric-proof` has one
 * other dependent and it is in another area. There is no area floor to dodge,
 * since the merge argued below put `euclidean-geometry` fifteen nodes above a
 * floor of five. And there is no cheaper candidate: of the ten concepts still
 * unwritten on the two unfinished journeys, four have all their prerequisites
 * written — `circles`, `right-triangle-trig`, `linear-equations` and
 * `ratio-and-rate` — and this is the only one of the four that unblocks
 * anything, because `circle-measure` needs it, `solid-geometry` needs that,
 * and `three-dimensional-coordinates` needs that. Three concepts stand behind
 * this one; nothing stands behind the other three.
 *
 * WHAT MAKES IT WORTH A PARAGRAPH IS THAT THIS FILE HAD ALREADY REFUSED IT,
 * twice over and in writing. `subject.covers` ended, until this promotion, with
 * "The circle theorems, circular measure and the solids are the rest and are
 * still mapped only — each of them is about a figure, and nothing in this build
 * can show one", and `EUCLIDEAN_GEOMETRY`'s comment says the same. That
 * sentence was a prediction dressed as a boundary, and it was wrong in the way
 * the file has now been wrong six times: it identified the concept with its
 * theorems, and the theorems are the part that needs the drawing.
 *
 * The figure test's record was six whole nodes and one split. It is now seven
 * and one, and this is the first node taken where the sentence being overturned
 * was in THIS file rather than in the atlas — so the test has stopped being a
 * tool for reading the map and has started correcting the syllabus's own
 * account of its boundary. Worth the warning that goes with it: a file that
 * records its refusals in prose and then overturns them is only honest if the
 * overturning is as explicit as the refusal was, which is why this paragraph
 * exists instead of a quiet edit to `covers`.
 *
 * WHAT SURVIVES BEING WRITTEN DOWN, and why each one needs no figure:
 *
 *   The inscribed angle, as an INVARIANCE rather than as a construction. The
 *   halving is one division. What makes a knowledge point is that a chord has
 *   two central angles on it rather than one, the vertex halves the one on the
 *   arc it is NOT on, and the vertex's position on its own arc never enters the
 *   answer — so a problem that pins the vertex has over-specified itself. That
 *   is a claim about what the answer depends on, which is the claim-about-claims
 *   shape the six promotions above kept finding, and it is figure-free in the
 *   strong sense: there is nothing to look at, because the whole content is
 *   that looking at a particular picture would mislead you into thinking the
 *   position mattered. The reflex case is where learners actually fail, and it
 *   is arithmetic: 360 − 110, halved.
 *
 *   The tangent length, as a SLOT ASSIGNMENT made by geometry instead of by
 *   reading. `pythagoras`' first point is that the relation is not symmetric in
 *   its three letters and that nothing in three numbers says which is the
 *   hypotenuse. Here something does: the right angle is at the point of
 *   contact, so the centre-to-point distance is opposite it and the tangent is
 *   a leg, so the move is a subtraction — decided before any number is read.
 *   That is the prerequisite being used rather than restated, and it arrives
 *   with two free consequences that are usually drawn. The expression needs
 *   d ≥ r, so a point inside the circle is refused by a negative square rather
 *   than by inspecting a figure — the same shape as the triangle inequality
 *   refusing a height in `area-and-perimeter`. And because only d and r enter
 *   it, the two tangents from one external point are equal, which is a
 *   standard figure argument obtained here by noticing which variables the
 *   formula does not contain.
 *
 *   The cyclic quadrilateral, as the file's cleanest instance of an argument
 *   about which check carries information. Opposite angles total 180°, and
 *   that is DERIVED from the first point rather than taken: two opposite
 *   vertices stand on the same diagonal from opposite arcs, so they halve two
 *   central angles totalling 360°. The useful direction is the contrapositive,
 *   which is `geometric-proof`'s second point cited by name. And set against it
 *   is the 360° total of all four angles, which every quadrilateral passes —
 *   so the commonest thing a learner does here tests only that the figure is a
 *   quadrilateral. The second pair of opposites then turns out to repeat the
 *   first, because 360 minus 180 is 180, so one pair is the whole test. Three
 *   checks, one of which decides, one of which decides nothing, and one of
 *   which is the first one again.
 *
 * WHAT IS ABSENT, named rather than approximated:
 *
 *   The inscribed-angle theorem's own proof, which is the largest debt this
 *   concept takes on and is taken on the same terms as the congruence
 *   criteria. It is a case analysis over where the centre falls relative to the
 *   angle — inside, on a side, outside — with an isosceles triangle on two
 *   radii in each case. Three figures, and the case split is itself a statement
 *   about a picture, so there is no half of it to keep.
 *
 *   The perpendicularity of a tangent to its radius, taken as given for the
 *   same reason and more cheaply: the usual argument is that the radius is the
 *   shortest segment from the centre to the line, which is the shortest-route
 *   fact `area-and-perimeter` already leans on, applied to a figure. The second
 *   knowledge point is explicit that this fact is what decides the slot
 *   assignment and that it is not being established here.
 *
 *   The chord theorems, and this is the part of the node that the figure test
 *   genuinely refused rather than merely left for later. Equal chords are
 *   equidistant from the centre; two chords crossing inside cut each other
 *   into products that match; the angle between a tangent and a chord equals
 *   the angle in the alternate segment. Each is a similar-triangles or
 *   isosceles argument whose statement is already a description of a drawing,
 *   and unlike the inscribed angle none of them has an invariance underneath
 *   to write about instead. The node's `is` line names chords first, so what
 *   went is the second and third of its three advertised topics and not the
 *   first — the split the sixth promotion found, in a different proportion.
 *
 *   Arc length and sector area, which are absent on a MAP boundary rather than
 *   a figure one and are worth separating for that reason. They are
 *   `circle-measure`'s content, that node names this one in its own `needs`,
 *   and π as "the ratio that is the same for every circle" is exactly the kind
 *   of claim this file would otherwise reach for. It is the next node up and
 *   taking its material here would make the promotion above this one write
 *   around a hole.
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
 * ── What the seventh promotion did, which TIGHTENS A GATE BY SHORTENING IT ──
 *
 * `area-and-perimeter` was gated by both of its prerequisites already — the
 * second promotion installed one and the sixth the other — so no gate moved
 * for it. What moved is the gate on `circle-measure`, its only dependent
 * anywhere in the atlas, and the movement is a shape none of the six
 * promotions above produced.
 *
 * Every tightening before this one ADDED to its dependents' gating sets: the
 * walk had been passing through an empty node and now stopped at a real one,
 * so there was one more concept to demonstrate. This one made the set
 * SMALLER, from four members to three. `gatingPrerequisitesOf(circle-measure)`
 * used to name `congruence`, `pythagoras`, `quadrilaterals-and-polygons` and
 * `triangle-basics` — the last two because the walk looked straight through
 * this node and collected both of its prerequisites. It now names
 * `congruence`, `pythagoras` and this concept, which stands above both of
 * them.
 *
 * A shorter list is a TIGHTER gate, and that is worth stating because a count
 * reads it backwards. The function names the NEAREST teachable ancestors, so
 * fewer of them means the gate sits closer to the thing it gates:
 * demonstrating the polygons and the triangles no longer licenses circular
 * measure, because the concept between them has to be demonstrated too. One
 * demonstration has replaced two, further up. tests/atlas.mjs asserts the
 * whole set by name rather than its size, for exactly this reason.
 *
 * The other half of that node's pair is untouched, as always: `circles` is
 * unwritten, so the walk still passes through it to `congruence` and
 * `pythagoras`, and those two are in the set for that reason rather than
 * through this concept.
 *
 * The area's roots SHRANK, from six to five, which is the fifth promotion's
 * shape rather than the sixth's. `area-and-perimeter` left and nothing
 * replaced it: the node resting on it is `circle-measure`, which did not
 * become a root because its other prerequisite, `circles`, is still in the
 * area and still gates it from inside. That is the fifth promotion's rule
 * reproduced exactly — a departing node promotes its dependents to roots only
 * when it was the LAST of their prerequisites inside the area — and it is the
 * third distinct thing that has happened to this set, after a fan-out, two
 * substitutions and a merge that doubled it.
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
 * THE AREA CONCEPT OBEYS IT THE EASY WAY TOO, and it raises one case the rule
 * had not had to decide: a figure whose angles come from its NAME. The
 * triangle in the second point states three sides — 13, 14 and 15, which is
 * exactly three independent parts — and no angle at all; its height of 12 to
 * the 14 is computed rather than stated, like the third side in Pythagoras,
 * and the triangle is real (Heron on 13, 14, 15 gives 84, and 2 × 84 ÷ 14 is
 * 12). The other figures are rectangles, and a rectangle's four right angles
 * are not independent parts: they are what the word means, in the same way the
 * right angle in a Pythagoras problem is the hypothesis of the theorem rather
 * than a measurement. So "10 cm by 6 cm" spends two parts and not six, and the
 * sheet with a 4 by 3 piece cut out of it spends two more on the piece — all
 * of them lengths, with every angle in the figure forced by the two words
 * describing it.
 *
 * The one check worth doing by hand, because no test can do it, is that the
 * two cut sheets are realisable as described and have the perimeters claimed.
 * A 4 by 3 piece out of a corner: the boundary is 6 + 3 + 4 + 3 + 10 + 6 = 32.
 * The same piece out of the middle of a 10 cm edge, leaving 3 cm either side of
 * it: 10 + 6 + 3 + 3 + 4 + 3 + 3 + 6 = 38. Both need the piece to be smaller
 * than the sheet in both directions, which 4 < 10 and 3 < 6 satisfy, and the
 * middle cut additionally needs the two remnants of the top edge to be
 * positive, which 3 + 4 + 3 = 10 satisfies exactly. Those are the figure's
 * realisability conditions, and they are stated here for the reason the
 * impossible triangle is: the arithmetic is right either way.
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
 * The area tasks are the first block here that owes no apology at all, and the
 * reason is a property of the concept rather than an improvement in the asks.
 * Both of its measures ARE numbers. "How much is left" is a value, "how far
 * round" is a value, and the claim the third point is built on — that the two
 * do not determine each other — is settled by comparing two of them. So all six
 * tasks ask what the knowledge points are about, and the proxy paragraph that
 * every block above had to write does not apply.
 *
 * Two of them are worth naming for their shape rather than their subject.
 * `the-notch-cancels-out-of-the-corner-perimeter-1` is the boundary walk of a
 * corner cut written out in full, (a − c) + (b − d) + c + d + a + b, which is
 * identically 2(a + b): the notch's two dimensions cancel, so the answer would
 * be 32 for a corner piece of ANY size. That is `the-exterior-total-never-moves-1`'s
 * shape in a second concept, and the independence is the content rather than an
 * accident of the numbers. And `equal-perimeters-left-the-areas-unequal-1` is
 * `a*b − c*d` — the same expression as the first point's cut — doing the
 * opposite job: there it is one region's area, here it is the DIFFERENCE between
 * two areas whose perimeters are equal, and anything other than 0 refutes
 * "equal round means equal inside". That is the arithmetic refutation
 * `equal-sides-left-the-angles-unequal-1` made for the polygons, in a third
 * concept.
 *
 * What stays unscored here is one step and it is small: which of the two
 * measures a question is asking for, the first subgoal of the first example. A
 * learner handed "evaluate a*b − c*d" has been told it is an area. Named in the
 * prompt, as in every block above.
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
 *
 * The three area points make it twenty-one and still one, and they hit two of
 * the three reasons rather than all three — worth saying, because a block
 * claiming all three a fourth time would be reciting the list rather than
 * checking it. The second point is the read-it-slowly case in its sharpest
 * form here: the error it exists to stop is grabbing whichever length is to
 * hand as the height, so a speed reward would train precisely the mistake. The
 * first is that same shape one level up, since answering an area question with
 * a perimeter is what haste produces there. The third is a decision with an
 * argument behind it, like the triangle inequality, the Pythagorean converse
 * and the rhombus comparison. What none of the three is, is the "times an
 * operation another point already times" case — the arithmetic in this concept
 * is a multiplication and a halving rather than the 180-minus subtraction the
 * rest of the subject keeps borrowing — so the reason that applied to five
 * points above does not apply to any of these.
 *
 * THIS COUNT HAD STOPPED AT TWENTY-ONE AND SHOULD HAVE READ TWENTY-FOUR, which
 * is worth repairing out loud rather than quietly. The eighth promotion wrote
 * three untimed points and did not come back here, so the running total was a
 * promotion behind — and nothing caught it, because the total is a sentence in
 * a comment and no test reads it. Every other invariant this file maintains by
 * hand has an assertion standing behind it; this one is the exception, and the
 * cheapest reading of the gap is that a prose counter is not an invariant at
 * all, it is a note that happens to be checkable.
 *
 * So: the three proof points and the three circle points together take it from
 * twenty-one to TWENTY-SEVEN, still with exactly one target in the file.
 *
 * AND IT DRIFTED AGAIN, TWICE OVER, which settles the reading the paragraph
 * above only guessed at. The tenth promotion wrote three untimed points and did
 * not come back here either, so twenty-seven should have read THIRTY the moment
 * `circle-measure` shipped; the eleventh makes it THIRTY-THREE, still with
 * exactly one target. Two repairs of the same sentence for the same reason is
 * no longer an oversight, it is what a hand-maintained number in a comment does
 * when no assertion reads it — and the honest conclusion is the one the
 * paragraph above reached and then did not act on. Treat this figure as a note,
 * not an invariant. The invariant is in tests/concepts-logic.mjs, which counts
 * the points and the targets and goes red.
 *
 * The three coordinate points are untimed for two of the reasons already on
 * record and sharpen one of them. The first and the third are the
 * "decision in front of trivial arithmetic" case: two subtractions and a root
 * in one, a doubling and a subtraction in the other, with the content being
 * which triangle to complete and which of two numbers already in view is the
 * answer. The third is the sharpest instance of it in the file, because the
 * WRONG number arrives first — a learner who is fast gets the displacement, so
 * a speed target would reward the error by construction. The second is the
 * finish-early case, which no concept above gave: its two errors are stopping
 * after one coordinate and rounding a half, and both are what haste produces.
 *
 * The proof points are untimed for one reason shared by all three, and it is a
 * reason none of the concepts above could give: the point of a proof is which
 * fact licenses which step, so rewarding speed rewards reaching for the
 * arithmetic ahead of the citation — which is not a mistake about the
 * arithmetic but a refusal to do the thing being taught. The subtractions
 * underneath them are already timed by `two-sums-every-angle-chase-uses`.
 *
 * The circle points hit two of the established reasons and sharpen one of
 * them. The first and the third are the "decision in front of trivial
 * arithmetic" case, and the first is the sharpest instance of it in the file:
 * the halving is a single division that would time beautifully, and what the
 * point is actually about is which of two central angles the learner may
 * halve, so a target would measure precisely the half of the task that is not
 * the content. The third is the same shape with three additions in front of
 * it, and the decision is which of two checks carries information. The second
 * is the read-it-slowly case inherited from `pythagoras`, with the twist that
 * speed gets it right by luck — the external point is always further from the
 * centre than the radius, so "assign the hypotenuse to the larger number"
 * never fails here while never being the reason. A timed point that can be
 * passed by the wrong method is worse than an untimed one.
 *
 * ── THE TWELFTH PROMOTION: `isometries-and-symmetry` ─────────────────────
 *
 * Chosen on the three factors ontology-algebra.ts and the atlas comments have
 * settled on, in that order, and recorded here because the brief that asked for
 * it carried a candidate list from a week earlier that was entirely spent.
 *
 *  - RULABILITY. A symmetry count, the order of a rotation and the angle two
 *    mirrors compose to are whole numbers, so every ask in the concept is an
 *    `evaluate` with an exact reference and the subject's no-worker contract
 *    holds unchanged. This is the factor that can make material dishonest
 *    rather than merely expensive, which is why it is first.
 *  - A SINGLE-ONTOLOGY `needs`. The node declared `['congruence']` and nothing
 *    else, so the one stranded edge is internal here and no area `links` entry
 *    is owed. That is the cheapest shape a promotion can have, and the entry it
 *    avoids is three files away from anything that mentions the concept — which
 *    is the entry people drop.
 *  - DEPENDENTS, as a tie-break only. One: `binary-operations` in
 *    `abstract-algebra`, whose gate this tightens from `congruence` onto this
 *    concept.
 *
 * `rank-nullity` had four dependents and was passed over, because its `needs`
 * splits across two subjects and because `linear-algebra` is down to two nodes
 * of stub-floor headroom with two ready candidates — so spending one of them
 * brings forward the area-merge decision that atlas-foundations.ts reserves for
 * a person. `euclidean-geometry` keeps three nodes of headroom after this one.
 *
 * THAT DEFERRAL WAS SPENT BY THE THIRTIETH PROMOTION, which wrote
 * `rank-nullity` into `vectors-and-independence`, and the paragraph is kept
 * because its arithmetic was right and its conclusion was a judgement. The
 * split `needs` did cost an area `links` entry, exactly as predicted; the
 * headroom reading was the half that needed a second look, since "brings
 * forward the merge decision" is one promotion of distance rather than the
 * decision itself. `linear-algebra` is now at ONE node of headroom with ONE
 * ready candidate, so the next run out of that area is the one that has to stop
 * and ask rather than this one having been wrong to defer.
 *
 * WHAT THE CONCEPT IS ABOUT IS ITS OWN PREREQUISITE, which is the first time
 * that has been true here and is the reason the figure objection does not land.
 * `congruence` left the JUSTIFICATION of the criteria on the map — SSS being
 * enough and SSA not is a claim about two triangles the reader has to be looking
 * at — and this concept does not reopen that. It uses SSS as given, exactly as
 * that concept does, and asks the question `congruence` could not: what is a
 * congruence a congruence OF. The answer is one map, and counting the
 * assumptions is the whole of the first worked example.
 *
 * TWO THINGS IT DELIBERATELY DOES NOT DO. There are no coordinates anywhere in
 * it: `cartesian-plane` is not a prerequisite of this node, `plane-transformations`
 * is the mapped node that does the same three motions with numbers, and writing
 * a reflection as (x, −y) here would be using a concept the gate does not
 * include. And the GROUP is not named, though the third point counts one: the
 * axioms are `binary-operations`' content and this is the motivating example
 * they are abstracted from, so naming them here would describe the abstraction
 * before anything has been abstracted.
 *
 * ITS THREE POINTS ARE UNTIMED FOR REASONS ALREADY ON RECORD, taking the count
 * to thirty-six with exactly one `automaticityTarget` in the file. The first is
 * the "times an operation another point already times" case — the arithmetic is
 * the 180-minus subtraction `two-sums-every-angle-chase-uses` measures, and
 * what this point adds in front of it is a citation. The second and third are
 * both the "decision in front of trivial arithmetic" case, and the third is the
 * sharpest instance of the pass-by-the-wrong-method objection in the file: 2n
 * answers the regular polygon on sight and gets the rectangle and the scalene
 * triangle wrong, so a speed target would reward the one method the point
 * exists to refuse. Treat that running total as a note rather than an
 * invariant, which is the conclusion the two repairs above reached: the
 * invariant is in tests/concepts-logic.mjs.
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
    'are absent. Then area and perimeter, as two measures rather than a list of formulas: the ' +
    'rectangle\'s area taken as the definition of the measure and every other area got from ' +
    'additivity, so that a rectangle with a rectangular piece cut out of it is one subtraction ' +
    'and the position of the cut never enters it; a triangle\'s base and the height belonging to ' +
    'that base as a matched pair, with a side offered as a height refused by the triangle ' +
    'inequality before any arithmetic is done; and the two measures shown to determine each ' +
    'other in neither direction, by two regions of equal area whose perimeters differ and two ' +
    'rectangles of equal perimeter whose areas differ. The cut-and-rearrange derivations are ' +
    'taken as given — the halving that makes a triangle half a parallelogram, and that ' +
    'parallelogram\'s reduction to a rectangle — as is every area formula whose statement needs ' +
    'a figure pointed at rather than described. Then deductive proof, which is the first concept ' +
    'here whose subject is the ARGUMENT rather than any figure: a chain of cited facts reaching ' +
    'an angle nobody stated, and collapsing into one expression in the given once it is written ' +
    'out; the difference between a converse, which is a new claim needing its own proof, and a ' +
    'contrapositive, which is the same claim and comes free; and the asymmetry between refuting ' +
    'a universal claim, which takes one case, and establishing one, which no number of cases ' +
    'does — together with the check that a proposed counterexample has to pass the hypothesis ' +
    'before its arithmetic means anything. Two-column layout is absent, since it is a convention ' +
    'about how a proof is written down rather than about what makes one valid, and so is every ' +
    'proof whose steps are about a drawing. Then the circle, which is the first concept here ' +
    'that the sentence this one used to end with had written off: an inscribed angle as half the ' +
    'central angle standing on the arc the vertex is NOT on, so that a chord carries two answers ' +
    'rather than one and the reflex angle is the right one for half the positions, and so that ' +
    'the angle is a property of the chord and the side while the vertex\'s exact place on its ' +
    'arc goes unused; a tangent length as the leg a right angle leaves, with the hypotenuse '  +
    'fixed at the centre-to-point distance by the perpendicularity at the point of contact ' +
    'rather than by which number is larger, normally irrational and left as a reduced surd, and ' +
    'with both the condition for a tangent to exist and the equality of the two tangents from ' +
    'one point read off that same expression; and the opposite angles of a cyclic quadrilateral ' +
    'totalling 180°, obtained by halving twice rather than taken as new, used in its ' +
    'contrapositive direction to refute concyclicity outright, and set against the total of all ' +
    'four angles, which every quadrilateral passes and which therefore decides nothing. The ' +
    'inscribed-angle theorem itself is taken as given, like the congruence criteria, and so is ' +
    'the perpendicularity of a tangent to its radius: proving either is a case analysis over ' +
    'where the centre falls relative to the figure. The chord theorems are absent — equal ' +
    'chords equidistant from the centre, the intersecting-chord products, the alternate segment ' +
    '— because each is a similar-triangles or isosceles argument about a drawing with no ' +
    'figure-free part to take. Then circular measure, where the sentence this one used to end ' +
    'with turned out to be half right and the half it got right is still absent: π as the ' +
    'quotient of circumference and DIAMETER, with the content being that the quotient is the ' +
    'same for every circle because any two circles are similar and scaling multiplies the top ' +
    'and the bottom alike — so π is forced rather than measured — and the relation run backwards, ' +
    'a circumference kept as an exact multiple of π dividing to a radius with nothing rounded; ' +
    'a central angle\'s share of a full turn computed ONCE and then taken of two different ' +
    'wholes, the circumference for the arc and the area for the sector, so that the two answers ' +
    'differ in number and in units while the fraction does not, together with the sector\'s ' +
    'perimeter as the one measure of it that is a share of nothing, since a full circle has no ' +
    'radii on its boundary; and a scale factor entering the boundary once and the area twice, ' +
    'so that trebling a radius multiplies the circumference by three and the area by nine, with ' +
    'the parameter count behind it — a circle has ONE free number, so any measure of it fixes ' +
    'the rest, which is how it escapes the two measures determining each other in neither ' +
    'direction that area and perimeter established for the rectangle. What stayed behind is the ' +
    'half that needs the figure, and it is the half that says WHY: the area of a circle as a ' +
    'limit of inscribed polygons. πr² is used here and not derived, exactly as the congruence ' +
    'criteria and the inscribed-angle theorem are, because the derivation is a sequence of ' +
    'drawings with more and more sides and there is no figure-free part of it to take. The ' +
    'solids are the rest, and they are no longer mapped only: this sentence used to end "and ' +
    'are still mapped only", which was this subject naming the material it excludes, and the ' +
    'exclusion is why the twelfth promotion went to `solid-measure` rather than here. The id is ' +
    'the boundary — a prism is not a figure in the plane, and the one move that subject is about ' +
    'is the move out of it. Then ONE concept in coordinates, which is a boundary this subject ' +
    'crossed rather than a sentence it always held: distance between two points as Pythagoras ' +
    'with the legs read off the axes and the subtraction order erased by the squaring, the ' +
    'midpoint as a per-axis average that costs two numbers and a carried half, and the two ' +
    'halves it cuts shown to add to the whole — which is what puts it ON the segment, equal ' +
    'distances alone putting it anywhere on the perpendicular bisector; then the relation run ' +
    'backwards to recover an endpoint, where the error worth naming is handing back the ' +
    'displacement to the midpoint instead of the coordinate asked for. Everything else analytic ' +
    'is absent and stays absent — slope, the equations of a line, the circle as an equation, ' +
    'the conics — and this concept is not the start of a coordinate syllabus. It is here ' +
    'because an area\'s `links` carries `prerequisite` edges only, so the credit edge saying ' +
    'that practising the distance formula practises Pythagoras could live in no file but the ' +
    'one holding both ends. The vectors subject was the obvious home and would have cost that ' +
    'edge. Then the maps themselves, which is congruence read a second time and from the other ' +
    'end: an isometry as a map keeping every distance, with the angles following by SSS rather ' +
    'than being assumed alongside — so that one hypothesis yields all six of a congruence\'s ' +
    'equalities and a congruence statement\'s letter order is the record of where a map sent ' +
    'each vertex, and so that the argument needs the three sides EQUAL rather than KNOWN and ' +
    'survives two of them never being measured; two reflections in crossing mirrors composing ' +
    'to a rotation through TWICE the angle between them, derived from each mirror bisecting the ' +
    'angle it turns a point through, with the starting point dropping out of the sum — which is ' +
    'what makes the composition one rotation rather than a motion that varies from point to ' +
    'point — and with the order of the two reflections mattering everywhere except at ' +
    'perpendicular mirrors; and a figure\'s symmetries counted as a full turn over the smallest ' +
    'returning turn plus one per mirror line, the identity sitting in the first count and in ' +
    'the second never, so that a regular n-gon has 2n and a scalene triangle has 1 rather than ' +
    '0. The classification is taken as given, like the congruence criteria and the ' +
    'inscribed-angle theorem: that every isometry of the plane is a translation, a rotation, a ' +
    'reflection or a glide reflection needs an argument about where three fixed points can lie, ' +
    'not the definition. The GROUP is absent, and deliberately: the composition facts here are ' +
    'the motivating example the axioms are abstracted from, and `binary-operations` in ' +
    '`abstract-algebra` is the node that abstracts them. So is every transformation written in ' +
    'coordinates — `plane-transformations` is still mapped and is the same three maps done with ' +
    'numbers — since this subject\'s one coordinate concept is here for an edge rather than as ' +
    'the start of a syllabus.',
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
  {
    id: 'area-and-perimeter',
    name: 'Area and perimeter',
    subjectId: subject.id,
    scope: {
      id: 'area-and-perimeter',
      label: 'Area and perimeter',
      hint: 'area perimeter rectangle triangle area formula',
      /*
       * Carried verbatim from the map node, like all six patterns above it and
       * for the same reason: widening a pattern while writing the material
       * makes two changes at once, and the recognition figure in
       * tests/atlas.mjs would move with no way to say which edit moved it.
       *
       * It overlaps `circle-measure`'s pattern on titles beginning "Area of a
       * disk", and that is not a defect to fix here. Both patterns are
       * anchored, both are about the measure the article really is about, and
       * `atlasProblems` is the check that would object if any title were
       * claimed by too many concepts. Narrowing this one to exclude circles
       * would be a recognition decision made to tidy an overlap rather than
       * because a title was being misfiled.
       */
      match: /^(area|perimeter)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-an-area-by-additivity-rather-than-by-a-formula-per-shape',
        statement:
          'Give the area of a rectangle with a rectangular piece removed, by taking the piece out '
          + 'of the whole rather than by looking for a formula for the resulting shape, and assemble '
          + 'the same region out of two rectangles to get the same number; say which of the givens '
          + 'the area never used, and why that is additivity rather than luck.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'pair-a-base-with-its-own-height-before-using-the-formula',
        statement:
          'Find a triangle\'s area from a base and the height matched to that base, read the same '
          + 'area off a second base to show it is a property of the triangle, and rule out a side '
          + 'offered as a height by the shortest-route fact rather than by computing with it; say '
          + 'why three side lengths alone do not give an area.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'decide-whether-either-measure-determines-the-other',
        statement:
          'Produce two regions of equal area with unequal perimeters, and two of equal perimeter '
          + 'with unequal areas, and say which part of the given each measure depended on; decide '
          + 'in both directions whether one measure can be computed from the other.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'additivity-turns-a-cut-into-a-subtraction',
        conceptId: 'area-and-perimeter',
        statement:
          'Area counts unit squares and perimeter measures the way round, so they answer different '
          + 'questions and come out in different units — a number of square centimetres against a '
          + 'number of centimetres, which is why one can never be compared with the other. One area '
          + 'formula is taken as given: a rectangle b units by h units is h rows of b unit squares, '
          + 'so its area is b × h. Everything else comes from ADDITIVITY — a region cut into pieces '
          + 'has the sum of their areas — used forwards to assemble a region out of rectangles and '
          + 'backwards to turn a removal into a subtraction. Nothing in that subtraction says WHERE '
          + 'the piece was taken from, which is what makes an area computable from a description '
          + 'rather than from a drawing, and is exactly the property perimeter does not have.',
        position: 1,
        /*
         * No `automaticityTarget`. The arithmetic is one multiplication and one
         * subtraction and the whole decision is which measure the question
         * asks for, so this is the read-it-slowly case the congruence and
         * Pythagoras points are untimed for: the error it exists to stop is
         * answering an area question with a perimeter, and rewarding speed
         * would train exactly that. The subtraction itself is also the one
         * `two-sums-every-angle-chase-uses` already times.
         */
        workedExample: {
          problem:
            'A rectangular sheet 10 cm by 6 cm has a rectangular piece 4 cm by 3 cm cut out of it. '
            + 'What is the area of what is left, and what would you still need to know to give its '
            + 'perimeter?',
          subgoals: [
            {
              label: 'Settle which of the two measures is being asked for, and so what unit the answer carries',
              detail:
                'How much sheet is left is an area, so the answer is a number of square '
                + 'centimetres; the distance round its edge is a perimeter and is a number of '
                + 'centimetres. The two measures are not comparable and neither is a shortcut to '
                + 'the other — the third point here is about how far apart they can be — so '
                + 'naming the measure first is what fixes the unit of everything below.',
              socratic:
                'The answer will be a number — but a number of centimetres, or of square '
                + 'centimetres? Which of the two measures does "how much sheet is left" ask for?',
            },
            {
              label: 'Take the whole rectangle from the one area formula this concept assumes',
              detail:
                'The uncut sheet is 10 × 6 = 60 square centimetres. That is the only formula taken '
                + 'as given here, and it is the definition of the measure rather than a result: six '
                + 'rows of ten one-centimetre squares tile the sheet exactly, and counting them is '
                + 'the multiplication. Every other area below is reduced to this one.',
              socratic:
                'Before anything is removed, how many one-centimetre squares does it take to tile '
                + 'the sheet?',
            },
            {
              label: 'Use additivity backwards, which is what turns the cut into a subtraction',
              detail:
                'The piece removed and the region left make up the whole sheet between them, so '
                + 'additivity says their two areas add to 60. The piece is itself a rectangle, so '
                + 'its area is 4 × 3 = 12, and the region left is 60 − 12 = 48 square centimetres. '
                + 'There is no formula for the shape that is left and none is wanted: additivity '
                + 'read forwards assembles an area out of pieces, and read backwards it turns a '
                + 'removal into one subtraction.',
              socratic:
                'The piece and what is left make up the whole sheet between them. If the whole is '
                + '60 and the piece is 12, what does that force the rest to be?',
            },
            {
              label: 'Find the given that never entered the arithmetic, and say what its absence costs the other measure',
              detail:
                'Nothing in 60 − 12 = 48 refers to where on the sheet the piece was cut from — a '
                + 'corner, the middle of an edge, the middle of the sheet. The area is 48 either '
                + 'way, and additivity is precisely the property that makes that true. The '
                + 'perimeter is not like that, so the problem can only be half answered: the same '
                + 'piece taken from a corner leaves a perimeter of 32 cm and taken from the middle '
                + 'of a 10 cm edge leaves 38 cm, and the question never said which. That pair is '
                + 'the third point of this concept.',
              socratic:
                'Which of the numbers you were given never appeared in the subtraction at all — '
                + 'and can you give the perimeter without it?',
            },
          ],
          answer:
            '48 square centimetres. The whole sheet is 10 × 6 = 60, the piece removed is '
            + '4 × 3 = 12, and additivity says the piece and the remainder add to the whole, so the '
            + 'remainder is 60 − 12 = 48. The perimeter cannot be given from what was stated: '
            + 'where the piece was cut from never entered the area arithmetic, and it is exactly '
            + 'what decides the perimeter — 32 cm if the piece came from a corner, 38 cm if it came '
            + 'from the middle of a 10 cm edge.',
        },
      },
      {
        id: 'a-height-belongs-to-one-base-and-is-usually-no-side',
        conceptId: 'area-and-perimeter',
        statement:
          'A triangle\'s area is half the base times the height, and those two are a MATCHED PAIR: '
          + 'the height is the perpendicular distance to the line of THAT base from the vertex '
          + 'opposite it. A triangle therefore carries three bases and the height belonging to each, '
          + 'and any one of the three pairs gives the same area, because the area is a property of '
          + 'the triangle rather than of the base you picked. A side is the height only where it '
          + 'meets the base at a right angle, which in most triangles no side does — so three side '
          + 'lengths on their own do not give an area, and a candidate height longer than a side '
          + 'reaching the base is not merely wrong but impossible, since the perpendicular is the '
          + 'shortest route from the vertex to the base\'s line. The halving is taken as given: two '
          + 'copies of the triangle make a parallelogram on the same base and height.',
        position: 2,
        /*
         * No `automaticityTarget`, and this is the read-it-slowly case in its
         * sharpest form in the file. The error the point exists to stop is
         * grabbing whichever length is to hand as the height, so a speed
         * reward would train the mistake rather than measure anything. The
         * arithmetic underneath it is one multiplication and a halving, which
         * is not a fluency skill the subject is missing.
         */
        workedExample: {
          problem:
            'A triangle has sides 13 cm, 14 cm and 15 cm, and the perpendicular height to the '
            + '14 cm side is 12 cm. Find its area.',
          subgoals: [
            {
              label: 'Pair the base with the height that belongs to it, before reaching for the formula',
              detail:
                'Four lengths have been given and the formula takes two. The 12 cm is the height to '
                + 'the 14 cm side, so the matched pair is base 14 and height 12, and the 13 and the '
                + '15 do not appear in the calculation at all. The formula wants a base together '
                + 'with the perpendicular distance to that base\'s line from the opposite vertex — '
                + 'one pair out of the three the triangle carries.',
              socratic:
                'Four lengths are given and the formula takes two of them. Which two belong to '
                + 'each other?',
            },
            {
              label: 'Halve the product of the matched pair',
              detail:
                '½ × 14 × 12 = 84 square centimetres. The halving is the step taken as given here: '
                + 'two copies of the triangle, one of them turned, make a parallelogram standing on '
                + 'the same 14 cm base with the same 12 cm height, so one copy is half of '
                + '14 × 12 = 168. That parallelogram in turn reduces to a rectangle by cutting and '
                + 'rearranging, which is why the rectangle is the only formula the first point '
                + 'assumes.',
              socratic:
                'Two copies of the triangle make a parallelogram on a 14 cm base with a 12 cm '
                + 'height. What is one copy worth?',
            },
            {
              label: 'Rule out the two tempting mis-pairings by the shortest-route fact rather than by computing them',
              detail:
                'Using 13 as the height to the 14 would give ½ × 14 × 13 = 91, and using 15 would '
                + 'give 105. Both are impossible before any arithmetic is done. The height drops '
                + 'perpendicular from the opposite vertex to the base\'s line, and the triangle '
                + 'inequality says that perpendicular is shorter than either route along a side to '
                + 'the same vertex — so the height to the 14 is less than 13 and less than 15, and '
                + '12 is. A length offered as a height that exceeds a side reaching the base is not '
                + 'a wrong answer to be checked; it is not a height.',
              socratic:
                'The height drops straight to the base and the two other sides reach the same '
                + 'vertex the long way round. Which of 12, 13 and 15 could a height to the 14 cm '
                + 'side possibly be?',
            },
            {
              label: 'Read the same area off a second base, so the answer does not depend on which one was chosen',
              detail:
                'Put the triangle on its 13 cm side instead. If the area really is 84 then '
                + '½ × 13 × h = 84, so h = 168/13 cm, which is about 12.9 — not a whole number, and '
                + 'it does not need to be. The three matched pairs are three ways of reading off '
                + 'one number, not three different measurements, and the heights come out '
                + 'irrational or fractional as often as not. This one also obeys the fact above: '
                + '168/13 is less than both 14 and 15.',
              socratic:
                'If the area is a property of the triangle rather than of the base you picked, what '
                + 'must the height to the 13 cm side come to?',
            },
          ],
          answer:
            '84 square centimetres. The 12 cm height is matched to the 14 cm base, so the area is '
            + '½ × 14 × 12 = 84 and the 13 and 15 never enter it. Pairing the 14 with the 13 or the '
            + '15 would give 91 or 105, and both are impossible before the arithmetic: the '
            + 'perpendicular from a vertex is shorter than either side reaching it, so a height to '
            + 'the 14 has to be less than both. Reading the same area off the 13 cm base gives a '
            + 'height of 168/13 cm, which is less than both of the other two sides and gives 84 '
            + 'again.',
        },
      },
      {
        id: 'neither-measure-decides-the-other',
        conceptId: 'area-and-perimeter',
        statement:
          'Equal areas do not force equal perimeters and equal perimeters do not force equal '
          + 'areas, so neither measure can be computed from the other. One direction: the same '
          + '12 cm² piece cut from the same 10 cm by 6 cm sheet leaves 48 cm² wherever it is taken '
          + 'from, but a corner cut leaves the perimeter at 32 cm while a cut from the middle of a '
          + '10 cm edge raises it to 38 cm. The other direction: a 10 by 6 rectangle and a 15 by 1 '
          + 'rectangle both have perimeter 32 cm, and their areas are 60 cm² and 15 cm². The reason '
          + 'is the one the first point names — a boundary notices where a piece was removed and an '
          + 'area does not — and it is why "bigger" has to say which measure it means.',
        position: 3,
        /*
         * No `automaticityTarget`, for the reason the triangle inequality, the
         * Pythagorean converse and the rhombus comparison are untimed: this is
         * a decision with an argument behind it rather than a fluency skill,
         * and the arithmetic carrying the decision is a boundary walk and one
         * subtraction the first point already covers.
         */
        workedExample: {
          problem:
            'A 10 cm by 6 cm sheet has a 4 cm by 3 cm rectangle cut out of it — in one case from a '
            + 'corner, in the other from the middle of a 10 cm edge. Compare the areas of the two '
            + 'results, and their perimeters.',
          subgoals: [
            {
              label: 'Compute both areas and find there is nothing to choose between them',
              detail:
                'Both are 60 − 12 = 48 square centimetres, by the subtraction of the first point. '
                + 'The position of the cut did not appear in that subtraction, so the two areas are '
                + 'not merely close: they are the same number, for the same reason, and no amount '
                + 'of detail about where the piece came from would change either of them.',
              socratic:
                'The two cuts take the same piece out of the same sheet. What does additivity force '
                + 'about the two areas?',
            },
            {
              label: 'Walk the boundary of the corner cut, and find the lengths removed exactly replaced',
              detail:
                'The uncut sheet goes 10 + 6 + 10 + 6 = 32 cm. Cutting a 4 by 3 piece out of a '
                + 'corner shortens one 10 cm edge to 6 and one 6 cm edge to 3, which takes 4 + 3 = 7 '
                + 'off the boundary — and the two new edges of the notch are 4 cm and 3 cm, which '
                + 'puts the same 7 back. So the perimeter is 32 − 7 + 7 = 32 cm, unchanged, and it '
                + 'would be unchanged for a corner piece of any size.',
              socratic:
                'The cut shortens two outer edges by 4 cm and 3 cm, and puts two new edges in their '
                + 'place. How long are the new ones, and so what happens to the total?',
            },
            {
              label: 'Walk the boundary of the middle cut, and find two edges with nothing removed to pay for them',
              detail:
                'Along the top, 3 + 4 + 3 = 10 cm is still traversed — the floor of the notch '
                + 'replaces the 4 cm it removed, exactly the trade the corner cut made. What is new '
                + 'is the notch\'s two SIDES, 3 cm each, and nothing was taken off the boundary to '
                + 'pay for them: the corner cut used the sheet\'s own edge as one side of its '
                + 'notch, and a cut in the middle of an edge has sheet on both sides of it. So the '
                + 'perimeter is 32 + 3 + 3 = 38 cm.',
              socratic:
                'The top edge still contributes 10 cm in total. What else is on this boundary that '
                + 'was not on the corner-cut one, and what was removed to pay for it?',
            },
            {
              label: 'Read off both directions of the independence, and name which given each measure needed',
              detail:
                'Equal areas, unequal perimeters: 48 cm² with 32 cm and 48 cm² with 38 cm, so an '
                + 'area does not decide a perimeter. The other direction needs a different pair and '
                + 'is as easy: a 10 by 6 rectangle and a 15 by 1 rectangle both have perimeter '
                + '2 × (10 + 6) = 2 × (15 + 1) = 32 cm, and their areas are 60 cm² and 15 cm². So a '
                + 'perimeter does not decide an area either. The two measures read different parts '
                + 'of the same given: the area needed only the sizes of the sheet and the piece, '
                + 'and the perimeter needed where the piece was.',
              socratic:
                'You now have two regions with equal areas and unequal perimeters. What pair of '
                + 'rectangles would show the same thing the other way round?',
            },
          ],
          answer:
            'Both cuts leave 48 cm², and the perimeters are 32 cm for the corner cut and 38 cm for '
            + 'the middle cut. The areas agree because additivity makes the area 60 − 12 wherever '
            + 'the piece came from. The perimeters differ because a corner cut replaces the two '
            + 'edge-lengths it removes with the two sides of its notch, while a cut from the middle '
            + 'of an edge adds both of its 3 cm sides with nothing removed to pay for them. The '
            + 'other direction takes one more pair: a 10 by 6 and a 15 by 1 rectangle both have '
            + 'perimeter 32 cm and have areas of 60 cm² and 15 cm². Neither measure decides the '
            + 'other.',
        },
      },
    ],
  },

  {
    id: 'geometric-proof',
    name: 'Deductive proof',
    subjectId: subject.id,
    scope: {
      id: 'geometric-proof',
      label: 'Deductive proof',
      hint: 'geometric proof two column deduction axiom',
      /*
       * NO `match`, and this is the first promotion in the subject where that
       * is the honest answer rather than a copy of the node's.
       *
       * The seven concepts above each carried a pattern verbatim from the map
       * node, for the reason `area-and-perimeter`'s scope gives: widening one
       * while writing material makes two changes at once and the recognition
       * figure in tests/atlas.mjs moves with no way to say which edit moved it.
       * This node never had one. The same rule therefore says do not invent one
       * HERE either — writing a pattern during an authoring pass is exactly the
       * change that rule forbids, and `expandNode` has been reporting the
       * absence correctly all along.
       *
       * It is also the right answer on the merits, which is why `fidelity` is
       * `guided` without regret. "Proof" is in the title of a large part of the
       * medium and in the body of nearly all of it, so a pattern on the word
       * would claim the corpus rather than select from it — the failure
       * `MapNode.match` warns about by name, with `/probability/i` as its
       * example. The articles that really cover this ("Mathematical proof",
       * "Deductive reasoning", "Axiom") are about proof in general rather than
       * about the geometric style the concept teaches, so even an anchored
       * pattern on those three titles would be deciding a different question.
       */
    },
    fidelity: 'guided',
    caveat:
      'Nothing checks that a statement is really about deductive proof, and no pattern here '
      + 'could. "Proof" names the activity of most of mathematics rather than a topic inside it, '
      + 'so a pattern on the word would claim nearly every statement instead of selecting one; '
      + 'the articles that genuinely cover this are about proof in general rather than about the '
      + 'geometric style taught here. So this concept steers the search and the instruction and '
      + 'filters nothing. The material below is written and practisable — it is the RECOGNITION '
      + 'that is unchecked, not the teaching.',
    objectives: [
      {
        id: 'reach-a-conclusion-by-citing-facts-rather-than-by-measuring-one',
        statement:
          'Produce an angle nobody stated by citing the straight line, the base-angle theorem and '
          + 'the angle sum in that order, say which given each step consumed, and say why the '
          + 'answer is forced by the chain rather than read off a figure — including what the '
          + 'chain needs of the given before it produces a triangle at all.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'tell-a-converse-from-a-contrapositive-and-say-which-came-free',
        statement:
          'Given a true implication, write both its converse and its contrapositive, decide which '
          + 'pairs of triangles each one settles and which it leaves open, and say which of the '
          + 'two rearrangements is the same claim and which is a new one needing its own proof.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'refute-a-universal-claim-with-one-case-after-checking-the-case',
        statement:
          'Refute a claim made of every triangle by producing a single triangle that breaks it, '
          + 'reject a proposed counterexample that fails the claim\'s own hypothesis, and say why '
          + 'any number of confirming instances is not a proof while one failure is a refutation.',
        /*
         * `counterexample` is NOT claimed here, and this is the one concept in
         * the build where that is a real decision rather than a formality.
         * tasks.ts says why: the kind is declared verifiable and carries no
         * tasks, because it needs a ruler that can check a produced object
         * against a claim and none exists — so a task of the kind would be
         * served and never settled. This is the first objective whose natural
         * kind it is, and naming it would promise practice that cannot be
         * served, which is the exact fault `ontologyProblems` reports for a
         * mapped node's empty objectives. So the refutation is asked as the two
         * `evaluate` values it reduces to, and the gap is recorded instead of
         * papered over.
         */
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-proof-cites-facts-already-established',
        conceptId: 'geometric-proof',
        statement:
          'A proof is a chain. Each step states something and names the established fact that '
          + 'licenses it, and the chain is only sound if every fact it cites was available BEFORE '
          + 'that step — a step that cites the conclusion, or a fact derived later, proves nothing '
          + 'however true its sentence is. What the chain buys is a quantity nobody measured: the '
          + 'conclusion is forced by the givens, so it holds for every figure with those givens '
          + 'rather than for the one in front of you. Written out as arithmetic, a finished chain '
          + 'collapses into a single expression in the given — which is what "the argument is the '
          + 'answer" means here, since the expression IS the citations composed in order.',
        position: 1,
        /*
         * No `automaticityTarget`. The whole content is which fact licenses
         * which step, so rewarding speed would reward reaching for the
         * arithmetic before the citation — the error the point exists to stop.
         * The subtractions underneath it are already timed by
         * `two-sums-every-angle-chase-uses`.
         */
        workedExample: {
          problem:
            'In triangle ABC, AB = AC. The side CB is extended beyond B to a point D, and the '
            + 'angle ABD measures 140°. Find the angle at A.',
          subgoals: [
            {
              label: 'Separate the givens from the conclusion, and list what may be cited',
              detail:
                'Given: AB = AC, and the angle ABD is 140° where C, B and D lie on one straight '
                + 'line. To be found: the angle at A, which nothing in the problem states. '
                + 'Available to cite: that angles on a straight line total 180°, that the angles '
                + 'of a triangle total 180°, and the base-angle theorem — equal sides force equal '
                + 'angles opposite them. Nothing else is used below, and listing them first is '
                + 'what makes each step checkable rather than plausible.',
              socratic:
                'Nothing you have been told is an angle of the triangle itself. What exactly were '
                + 'you handed, and what single quantity do you have to produce from it?',
            },
            {
              label: 'Cite the straight line to turn the angle outside the triangle into one inside it',
              detail:
                'C, B and D are collinear, so the angles ABC and ABD are angles on a straight '
                + 'line and total 180°. Therefore the angle ABC is 180 − 140 = 40°. This is the '
                + 'step that brings the given INTO the triangle: the 140° is not an angle of ABC '
                + 'at all, and no fact about triangles applies to it.',
              socratic:
                'The 140° sits outside the triangle. Which of the facts you listed says anything '
                + 'about the angle at the same vertex on the other side of the line?',
            },
            {
              label: 'Cite the base-angle theorem to carry that angle across to the far vertex',
              detail:
                'AB = AC, so A is the apex and BC is the base, and the base angles are the ones '
                + 'at B and at C. The base-angle theorem makes them equal, so the angle ACB is '
                + 'also 40°. This is the step that spends the other given: a chain that never '
                + 'used AB = AC would be answering a problem about some other triangle.',
              socratic:
                'You know one angle of the triangle, and you know two of its sides are equal. '
                + 'Which fact turns a statement about sides into a statement about angles?',
            },
            {
              label: 'Cite the angle sum to close the triangle, and check the chain against its own givens',
              detail:
                'The three angles total 180°, so the angle at A is 180 − 40 − 40 = 100°. Both '
                + 'givens were used and each exactly once, which is what separates a proof from a '
                + 'guess that happens to land. Composing the three citations in order gives '
                + '180 − 2(180 − x) for an exterior angle of x°, and that simplifies to 2x − 180: '
                + 'one expression in the given, which is the finished argument rather than a '
                + 'shortcut past it. It also states its own hypothesis — the expression is an '
                + 'angle of a real triangle only for x above 90°, since at x = 90 it returns 0, '
                + 'so the chain tells you which givens it accepts.',
              socratic:
                'Two of the three angles are now known. What closes the third — and has every '
                + 'given been used, or is one still sitting unspent?',
            },
          ],
          answer:
            '100°. The angles ABC and ABD are on a straight line, so ABC is 180 − 140 = 40°; '
            + 'AB = AC makes B and C the base angles, so the base-angle theorem gives ACB = 40° '
            + 'too; and the angle sum leaves 180 − 40 − 40 = 100° at A. The three citations '
            + 'compose to 180 − 2(180 − x) = 2x − 180, which is 100 at x = 140 and is an angle of '
            + 'a genuine triangle only while x exceeds 90°.',
        },
      },
      {
        id: 'a-converse-is-a-new-claim-and-a-contrapositive-is-not',
        conceptId: 'geometric-proof',
        statement:
          'A proved implication points one way. Congruent triangles have equal perimeters, because '
          + 'a congruence asserts all six measurements equal and the three sides therefore sum the '
          + 'same — and that is the only direction proved. Swapping hypothesis and conclusion '
          + 'gives the CONVERSE, which is a different claim that needs its own proof and here is '
          + 'false: equal perimeters are easy to arrange between triangles with different sides. '
          + 'Negating both and then swapping gives the CONTRAPOSITIVE, which is the original claim '
          + 'rearranged and so comes free — unequal perimeters prove non-congruence outright. The '
          + 'two rearrangements look equally innocent and only one of them is.',
        position: 2,
        /*
         * No `automaticityTarget`. The arithmetic is two additions and a
         * subtraction, and the decision is which of two rearrangements the
         * learner is entitled to use. A speed reward here would train
         * answering the easy half fast, which is precisely the mistake.
         */
        workedExample: {
          problem:
            'It is proved that congruent triangles have equal perimeters. Triangle ABC has sides '
            + '5 cm, 9 cm and 10 cm; triangle PQR has sides 6 cm, 8 cm and 10 cm; triangle XYZ '
            + 'has sides 6 cm, 8 cm and 11 cm. What does the proved statement settle about ABC and '
            + 'PQR, and what does it settle about PQR and XYZ?',
          subgoals: [
            {
              label: 'Write the implication with its hypothesis and conclusion named, before rearranging anything',
              detail:
                'Hypothesis: the two triangles are congruent. Conclusion: their perimeters are '
                + 'equal. Nothing in it says that a perimeter decides a congruence, and the whole '
                + 'point of writing it this way round first is that the three rearrangements '
                + 'below are indistinguishable once the labels are dropped.',
              socratic:
                'Before you use it on anything: which half of that sentence is the assumption, '
                + 'and which half is what follows from it?',
            },
            {
              label: 'Form the converse by swapping the two, and test it on the first pair',
              detail:
                'The converse reads: if their perimeters are equal then they are congruent. ABC '
                + 'has perimeter 5 + 9 + 10 = 24 cm and PQR has 6 + 8 + 10 = 24 cm, so the '
                + 'converse\'s hypothesis holds. But a congruence would make all three sides '
                + 'match, and {5, 9, 10} is not {6, 8, 10}, so these two are NOT congruent. The '
                + 'converse is therefore false, and the proved statement settles nothing at all '
                + 'about this pair.',
              socratic:
                'Both of these have perimeter 24 cm. Does that let you conclude anything — and '
                + 'what do their side lengths say about whether it would even be true?',
            },
            {
              label: 'Form the contrapositive by negating both halves and swapping, and apply it to the second pair',
              detail:
                'The contrapositive reads: if their perimeters are not equal then they are not '
                + 'congruent. PQR has perimeter 24 cm and XYZ has 6 + 8 + 11 = 25 cm, and '
                + '24 ≠ 25. So PQR and XYZ are definitely not congruent, and that conclusion came '
                + 'from the original implication with nothing added to it.',
              socratic:
                'These two differ by 1 cm round the outside. What does the proved statement let '
                + 'you say about them, and did you have to prove anything new to say it?',
            },
            {
              label: 'Say which rearrangement was free and which was a new claim',
              detail:
                'The contrapositive is the same claim written backwards: anything that made it '
                + 'fail would make the original fail, so proving one proves the other and no work '
                + 'was done. The converse is a genuinely different statement about the same two '
                + 'properties, it needed its own proof, and it does not have one — the first pair '
                + 'is a counterexample to it. A learner who treats the two rearrangements as '
                + 'interchangeable will conclude that ABC and PQR are congruent, which is false '
                + 'about two triangles whose data is entirely consistent.',
              socratic:
                'You have used two rearrangements of one sentence and they behaved differently. '
                + 'Which of them could you have written down without proving anything, and why '
                + 'that one?',
            },
          ],
          answer:
            'About ABC and PQR: nothing. Their perimeters are both 24 cm, but that is the '
            + 'converse\'s hypothesis and the converse is false — and in fact these two are not '
            + 'congruent, since {5, 9, 10} and {6, 8, 10} are different side lengths. About PQR '
            + 'and XYZ: they are not congruent. Their perimeters are 24 cm and 25 cm, and the '
            + 'contrapositive of the proved statement settles it with nothing added. The '
            + 'contrapositive came free; the converse was a new claim and a false one.',
        },
      },
      {
        id: 'one-counterexample-settles-it-if-it-meets-the-hypothesis',
        conceptId: 'geometric-proof',
        statement:
          'A claim about EVERY triangle is refuted by one triangle that breaks it and is '
          + 'established by no number of triangles that do not. That asymmetry is why proof exists '
          + 'at all: checking cases can only ever kill a universal claim, never confirm one. But '
          + 'the case has to be a case. A proposed counterexample that fails the claim\'s own '
          + 'hypothesis refutes nothing, because the claim never spoke about it — so the first '
          + 'thing to check about a counterexample is not whether it breaks the conclusion but '
          + 'whether it satisfies the hypothesis.',
        position: 3,
        /*
         * No `automaticityTarget`, for the sharpest version of the reason the
         * two points above are untimed. The error here is accepting an object
         * as a counterexample without checking it is one, and that is a step a
         * learner skips when hurried. The arithmetic is a subtraction and an
         * angle sum, neither of which is a fluency gap in this subject.
         */
        workedExample: {
          problem:
            'A learner claims that every exterior angle of a triangle is obtuse, and offers two '
            + 'objects against it. The first is a triangle with angles 100°, 40° and 40°. The '
            + 'second has angles 100°, 50° and 40°. Which of the two refutes the claim, and what '
            + 'does the other one do?',
          subgoals: [
            {
              label: 'Read the claim\'s quantifier, since that is what decides what would settle it',
              detail:
                'The claim is about EVERY exterior angle of EVERY triangle. One exterior angle '
                + 'that is not obtuse therefore refutes it completely, and any number that are '
                + 'obtuse leaves it exactly where it was. So the work is to find one failure, and '
                + 'the obvious place to look is the vertex whose interior angle is largest.',
              socratic:
                'The claim says "every". How many cases would you need to kill it, and how many '
                + 'would you need to establish it?',
            },
            {
              label: 'Test the first candidate at the vertex most likely to break it',
              detail:
                'At the 100° vertex the exterior angle is on a straight line with the interior '
                + 'one, so it is 180 − 100 = 80°. That is acute, not obtuse, so this triangle '
                + 'breaks the claim and the claim is finished. Checking a second vertex is '
                + 'unnecessary — the refutation is already complete.',
              socratic:
                'Which vertex of 100°, 40°, 40° would you try first, and what does the straight '
                + 'line give you for the exterior angle there?',
            },
            {
              label: 'Check the second candidate against the hypothesis before using it at all',
              detail:
                '100 + 50 + 40 = 190, and the angles of a triangle total 180°, so there is no '
                + 'such triangle. Its "exterior angle" of 80° refutes nothing, because the claim '
                + 'was about triangles and this is not one. This is the failure worth more than '
                + 'the refutation above: the object looks like a counterexample, produces the '
                + 'same 80°, and is worthless — so a counterexample must be checked against the '
                + 'hypothesis first and the conclusion second.',
              socratic:
                'Before asking whether this object breaks the claim, ask whether the claim was '
                + 'ever talking about it. What does 100 + 50 + 40 tell you?',
            },
            {
              label: 'Say what the surviving vertices contribute, and repair the claim into a true one',
              detail:
                'The other two vertices of the real triangle give 180 − 40 = 140° each, both '
                + 'obtuse. They are instances of the claim and they are worth nothing: a '
                + 'universal claim that has already failed once is not partly true. What IS true '
                + 'is the repaired version — at most one exterior angle of a triangle fails to be '
                + 'obtuse — and it follows from a fact already established, that at most one of a '
                + 'triangle\'s angles can be 90° or more. An exterior angle is non-obtuse exactly '
                + 'at such a vertex, and there is at most one.',
              socratic:
                'The other two exterior angles here are both obtuse. What do they add to the '
                + 'claim\'s case — and is there a version of the claim they would support?',
            },
          ],
          answer:
            'The first refutes it, the second does nothing. In the 100°, 40°, 40° triangle the '
            + 'exterior angle at the 100° vertex is 180 − 100 = 80°, which is acute, and one '
            + 'failure ends a claim made of every triangle. The second object has angles summing '
            + 'to 190°, so no such triangle exists and it cannot refute a claim about triangles '
            + 'however its arithmetic comes out. The two obtuse exterior angles of the first '
            + 'triangle, 140° each, add nothing: instances never establish a universal claim. The '
            + 'repaired claim — at most one exterior angle of a triangle is not obtuse — is true, '
            + 'because at most one of a triangle\'s angles is 90° or more.',
        },
      },
    ],
  },
  {
    id: 'circles',
    name: 'Circles',
    subjectId: subject.id,
    scope: {
      id: 'circles',
      label: 'Circles',
      hint: 'circle chord tangent inscribed angle arc',
      /*
       * Carried verbatim from the map node, like the seven anchored patterns
       * above it and for the same reason `area-and-perimeter`'s scope gives:
       * widening a pattern while writing the material makes two changes at
       * once, and the recognition figure in tests/atlas.mjs would move with no
       * way to say which edit moved it.
       *
       * Worth one note on what this pattern does NOT reach, because the gap
       * looks like an oversight and is the rule working. `/^circle\b/i` is
       * anchored and the `\b` is before a word boundary, so it takes "Circle"
       * and "Circle theorem" and does not take "Circles", "Inscribed angle",
       * "Tangent lines to circles" or "Cyclic quadrilateral" — which is to say
       * it misses the title of every theorem this concept actually teaches.
       * Widening it is a recognition decision and belongs on the map as its
       * own change, not here as a side effect of writing worked examples. The
       * eighth promotion made the same argument from the other direction, where
       * the honest answer was no pattern at all.
       */
      match: /^circle\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'halve-the-central-angle-the-vertex-is-entitled-to-halve',
        statement:
          'Given a chord and the angle it makes at the centre, produce the angle it makes at a '
          + 'point of the circle, for a vertex on either arc — which means deciding first which of '
          + 'the two central angles standing on that chord the vertex is looking at, since the '
          + 'reflex one is the answer for half the positions. Say which part of the given the '
          + 'answer never used, and why that makes the angle a property of the chord and the side '
          + 'rather than of the vertex.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'put-the-hypotenuse-where-the-tangent-forces-it-and-stop-at-the-surd',
        statement:
          'Find the length of a tangent from an external point given the radius and the distance '
          + 'to the centre, assigning the hypotenuse by the position of the right angle rather '
          + 'than by which number is larger; leave an irrational answer as a reduced surd rather '
          + 'than a decimal, and read off the same expression both the condition for a tangent to '
          + 'exist at all and the reason the two tangents from one point are equal.',
        taskKinds: ['evaluate', 'transform_to_form', 'justify'],
      },
      {
        id: 'refute-concyclicity-with-the-pair-that-carries-information',
        statement:
          'Decide what a quadrilateral\'s four angles settle about whether its vertices lie on one '
          + 'circle: refute it outright from one pair of opposite angles, say why the total of all '
          + 'four is not evidence of anything, say why the second pair of opposites repeats the '
          + 'first rather than confirming it, and say which direction of the statement a figure '
          + 'that passes has actually satisfied.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-inscribed-angle-halves-the-central-angle-on-the-arc-it-is-not-on',
        conceptId: 'circles',
        statement:
          'A chord makes an angle at the centre and an angle at a point of the circle, and the '
          + 'second is half the first. Which first, though, is the whole of the difficulty: a '
          + 'chord has TWO angles standing on it at the centre, the non-reflex one and the reflex '
          + 'one, and they total 360° because together they go once round. The angle at a vertex '
          + 'halves the one standing on the arc the vertex is NOT on. So the answer depends on the '
          + 'chord and on which side of it the vertex lies, and on nothing else — every point of '
          + 'one arc gives the same angle, which is why a problem that says where exactly the '
          + 'vertex is has told you more than the answer can use.',
        position: 1,
        /*
         * No `automaticityTarget`. The halving is one division and would time
         * well, which is exactly the trap: the content of the point is WHICH of
         * two central angles the learner is entitled to halve, and a speed
         * reward trains halving whichever number was printed. That is the error
         * the point exists to stop, and it is the same reason
         * `quadrilaterals-and-polygons`' first point is untimed — the
         * arithmetic is trivial and the decision in front of it is not.
         */
        workedExample: {
          problem:
            'A circle has centre O, and A and B are points on it with the non-reflex angle AOB '
            + 'measuring 110°. P is some point of the major arc AB and Q is some point of the '
            + 'minor arc AB. Find the angles APB and AQB, and say which part of the given neither '
            + 'answer used.',
          subgoals: [
            {
              label: 'Count the angles standing on the chord at the centre, before halving anything',
              detail:
                'The chord AB cuts the circle into a major and a minor arc, and there are two '
                + 'angles at O standing on it: the non-reflex 110° given, which stands on the '
                + 'minor arc, and the reflex 360 − 110 = 250°, which stands on the major arc. They '
                + 'total 360° because between them they sweep once round O. Both are available to '
                + 'be halved, and which one a vertex gets is settled by the arc the vertex is not '
                + 'sitting on — so the first move is to have both numbers written down rather '
                + 'than to halve the one that was printed.',
              socratic:
                'P and Q are on opposite sides of the chord AB. What angle does the centre make '
                + 'over each of the two arcs, and what must those two angles total?',
            },
            {
              label: 'Halve the one standing on the arc P is not on',
              detail:
                'P is on the major arc, so the arc AB that P is not on is the minor one, and the '
                + 'angle standing on the minor arc at the centre is the 110° given. So APB is '
                + '110 ÷ 2 = 55°. The 250° never enters this calculation: it stands on the arc P '
                + 'is sitting on, and the theorem pairs a vertex with the far arc.',
              socratic:
                'The arc AB that P does not sit on is the minor one, under the 110° at the '
                + 'centre. How does the angle at P compare with that 110°, and which of the two '
                + 'is the bigger?',
            },
            {
              label: 'Repeat the same halving for Q, where the far arc is the major one',
              detail:
                'Q is on the minor arc, so the arc it is not on is the major one, and the angle '
                + 'standing on the major arc is the reflex 250°. So AQB is 250 ÷ 2 = 125°. The '
                + 'arithmetic is the same division as the step above; the only thing that changed '
                + 'is which of the two central angles the vertex was entitled to halve. A learner '
                + 'who halves the printed 110° again answers 55° and is wrong by 70°, with every '
                + 'step of the division correct.',
              socratic:
                'Q is on the minor arc. Which arc is Q not sitting on, what angle stands at the '
                + 'centre over that one, and what does the same halving give you now?',
            },
            {
              label: 'Name the given that neither answer used, and check the two against each other',
              detail:
                'Neither answer used where on its arc the vertex was. Any other point of the '
                + 'major arc halves the same 110° and gives 55° as well, so "P is some point of '
                + 'the major arc" was the whole of the data about P, and a problem pinning P '
                + 'exactly would have over-specified it. That invariance IS the theorem: the '
                + 'inscribed angle is a function of the chord and the side, not of the vertex. '
                + 'The two answers also check each other — 55 + 125 = 180°, which is forced, '
                + 'since the two central angles total 360° and both were halved.',
              socratic:
                'You were told only that P is somewhere on the major arc. Why was that enough to '
                + 'pin the angle down, and what would a different point of the same arc give?',
            },
          ],
          answer:
            'APB = 55° and AQB = 125°. P is on the major arc, so the arc AB without P on it is '
            + 'the minor one, carrying the given 110° at the centre, and APB = 110 ÷ 2 = 55°. Q '
            + 'is on the minor arc, so the arc without Q on it is the major one, carrying the '
            + 'reflex angle 360 − 110 = 250°, and AQB = 250 ÷ 2 = 125°. Neither answer used where '
            + 'on its arc the vertex lay: every point of the major arc gives 55° and every point '
            + 'of the minor arc gives 125°, so the side of the chord was the only thing about the '
            + 'vertex that mattered. The two total 180°, which is forced rather than coincidental '
            + '— the two central angles total 360° and each was halved.',
        },
      },
      {
        id: 'a-tangent-length-is-the-leg-the-right-angle-leaves',
        conceptId: 'circles',
        statement:
          'A tangent is perpendicular to the radius at the point where it touches. That single '
          + 'fact decides the thing Pythagoras cannot decide for itself: the right angle sits at '
          + 'the point of contact, so the side opposite it — the distance from the centre to the '
          + 'external point — is the hypotenuse, always, and the radius and the tangent are both '
          + 'legs. So a tangent length is a subtraction, √(d² − r²), and the two numbers handed '
          + 'to you are never both legs. The same expression says when there is nothing to find: '
          + 'it needs d > r, and a point with d < r is inside the circle and has no tangent '
          + 'through it at all.',
        position: 2,
        /*
         * No `automaticityTarget`, and this is the point in the concept where
         * one would be most tempting — a subtraction and a root is exactly the
         * shape that times well, and `pythagoras` is where the subject's one
         * timed point lives. It is still wrong here. What this point adds to
         * Pythagoras is not the arithmetic but the SLOT ASSIGNMENT being made
         * by a geometric fact instead of by reading the problem, and a learner
         * rewarded for speed assigns the slots by which number is larger —
         * which gets this one right by luck, since d > r always, and gets the
         * reasoning wrong. The squaring and subtracting are already timed by
         * `the-hypotenuse-is-not-one-of-three-equals`.
         */
        workedExample: {
          problem:
            'A circle has centre O and radius 9 cm, and the point T is 41 cm from O. A tangent '
            + 'from T touches the circle at A. Find TA. Then find the tangent length from a point '
            + '8 cm from the centre of a circle of radius 5 cm.',
          subgoals: [
            {
              label: 'Place the right angle from the tangent fact, before any length goes into a slot',
              detail:
                'OA is the radius drawn to the point of contact and TA is the tangent, so they '
                + 'meet at right angles and the right angle of triangle OAT is at A. Pythagoras '
                + 'puts the hypotenuse opposite the right angle, so the hypotenuse is OT — the '
                + 'centre-to-point distance, 41 cm — and OA and TA are the two legs. Nothing '
                + 'about the numbers 9 and 41 establishes this. The perpendicularity does, and it '
                + 'is the only thing that does.',
              socratic:
                'Three lengths, and only one of them can be opposite the right angle. Which angle '
                + 'of triangle OAT is forced to be 90°, and by which fact about tangents?',
            },
            {
              label: 'Subtract rather than add, because the unknown is a leg and not the hypotenuse',
              detail:
                'TA² = OT² − OA² = 41² − 9² = 1681 − 81 = 1600, so TA = 40 cm. The subtraction is '
                + 'forced by the assignment made in the step above: adding the squares would be '
                + 'solving for the hypotenuse, and the hypotenuse is the length already given. '
                + 'This is the leg-versus-hypotenuse decision Pythagoras is built on, met here '
                + 'with the decision already settled by a fact about circles rather than by a '
                + 'phrase in the problem.',
              socratic:
                'The 41 cm is the hypotenuse and the 9 cm is a leg. Does finding the third side '
                + 'add the two squares or take one from the other — and how would you know if you '
                + 'had chosen wrong?',
            },
            {
              label: 'Run it again where the answer is irrational, and stop at the reduced surd',
              detail:
                'Same assignment, different numbers: the 8 cm is the hypotenuse and the 5 cm '
                + 'radius is a leg, so the tangent length squared is 8² − 5² = 64 − 25 = 39 and '
                + 'the length is √39 cm. 39 = 3 × 13 has no square factor, so there is nothing to '
                + 'take out from under the sign and √39 already IS the answer; writing 6.24 cm '
                + 'states a length the figure does not have. The first case came out whole only '
                + 'because 9, 40, 41 is a Pythagorean triple, which is the exception — a tangent '
                + 'length is normally an irrational.',
              socratic:
                '64 − 25 = 39. Is there a whole number whose square is 39 — and if not, is there '
                + 'anything you can take out from under the sign?',
            },
            {
              label: 'Read the existence condition and the equal-tangents fact off the same expression',
              detail:
                '√(d² − r²) needs d² − r² to be non-negative, which is d ≥ r. At d = r the point '
                + 'is on the circle and the tangent length is 0; for d < r the point is inside, '
                + 'no tangent through it touches the circle, and the arithmetic refuses the '
                + 'configuration by producing a negative square before any root is taken. The '
                + 'same expression also settles a fact usually argued from a drawing: a second '
                + 'tangent from T touches at some other point B, and TB² = d² − r² with the same '
                + 'two numbers, so TA = TB. The two tangents from an external point are equal '
                + 'because only d and r enter the formula and the point of contact does not.',
              socratic:
                'Try the same expression for a point 5 cm from the centre of the 9 cm circle. '
                + 'What does the subtraction do, and what is it telling you about where that '
                + 'point is, before you reach for a root?',
            },
          ],
          answer:
            'TA = 40 cm, and √39 cm in the second case. The radius OA meets the tangent at A at a '
            + 'right angle, so OT is the hypotenuse and the tangent is a leg: TA² = 41² − 9² = '
            + '1681 − 81 = 1600, giving TA = 40 cm. For the second circle the tangent length '
            + 'squared is 8² − 5² = 39, and 39 = 3 × 13 is square-free, so the exact length is '
            + '√39 cm with nothing to reduce. The subtraction is forced by the right angle being '
            + 'at the point of contact rather than at the centre or at T. The same expression '
            + 'carries two more things: it needs d ≥ r, so a point inside the circle is refused '
            + 'by a negative square before a root is taken, and it depends on d and r alone, '
            + 'which is why the two tangents from one external point have equal length.',
        },
      },
      {
        id: 'opposite-angles-decide-concyclicity-and-the-total-of-all-four-does-not',
        conceptId: 'circles',
        statement:
          'If a quadrilateral\'s four vertices lie on one circle, each pair of opposite angles '
          + 'totals 180° — which is the halving above rather than a new fact, since two opposite '
          + 'vertices stand on the same diagonal from opposite arcs and so halve two central '
          + 'angles that total 360°. The direction that does work is the contrapositive: a pair of '
          + 'opposite angles that does not total 180° proves the four points are not concyclic. '
          + 'The angles of EVERY quadrilateral total 360°, so that total is evidence of nothing, '
          + 'and checking it is the commonest way of appearing to test for a circle while testing '
          + 'only that the figure is a quadrilateral.',
        position: 3,
        /*
         * No `automaticityTarget`. The arithmetic is three additions, and the
         * content is which of two checks carries information — so a speed
         * reward would train running the 360° check fast, and that check is the
         * one the point exists to discredit. Same reason as the second point of
         * `quadrilaterals-and-polygons`, where haste is what produces the wrong
         * total.
         */
        workedExample: {
          problem:
            'Two quadrilaterals are offered as having all four vertices on one circle. ABCD has '
            + 'angles A = 85°, B = 98°, C = 95° and D = 82°. PQRS has angles P = 85°, Q = 98°, '
            + 'R = 94° and S = 83°. Decide what can be concluded about each, and say which check '
            + 'did the work.',
          subgoals: [
            {
              label: 'Run the check every quadrilateral passes, and establish that it separates nothing',
              detail:
                'ABCD: 85 + 98 + 95 + 82 = 360. PQRS: 85 + 98 + 94 + 83 = 360. Both total 360°, '
                + 'and so does every quadrilateral whatever its vertices lie on — one diagonal '
                + 'cuts it into two triangles and each contributes 180°. So this check cannot '
                + 'tell a cyclic quadrilateral from any other, and a figure failing it would not '
                + 'be a quadrilateral at all. It is still worth doing first, for exactly that '
                + 'reason: it confirms the data describes a quadrilateral, and that is the whole '
                + 'of what it confirms.',
              socratic:
                'Both sets of four angles total 360°. Before deciding what that tells you about '
                + 'circles, ask the other question: which quadrilaterals would FAIL that check?',
            },
            {
              label: 'Test the pair the theorem actually speaks about, on the second figure',
              detail:
                'P + R = 85 + 94 = 179, which is not 180. The proved statement runs "concyclic, '
                + 'therefore opposite angles total 180°", so its contrapositive — opposite angles '
                + 'not totalling 180°, therefore not concyclic — settles PQRS with nothing new '
                + 'proved. Those four points do not lie on one circle, and a subtraction finding '
                + '1° did it.',
              socratic:
                'One of the two figures fails a check the other passes. What do you get from '
                + 'P + R, and is the statement you are using the one that was proved or its '
                + 'reverse?',
            },
            {
              label: 'Check the other pair as well, and find you have checked one thing twice',
              detail:
                'Q + S = 98 + 83 = 181, and in ABCD both A + C = 85 + 95 = 180 and B + D = 98 + '
                + '82 = 180. The second pair never carries new information: the four angles total '
                + '360°, so if one pair totals 180° the other totals 360 − 180 = 180° as well, '
                + 'and if one pair falls 1° short the other runs 1° over. The 179 and the 181 are '
                + 'one failure read twice. So one pair is the entire test, and 360° is what makes '
                + 'that true.',
              socratic:
                'You have 179 for one pair. Without adding the other two angles, what must Q + S '
                + 'be — and what does that make the second check worth?',
            },
            {
              label: 'Say which direction the passing figure satisfied, and which one would need its own proof',
              detail:
                'ABCD passes, and passing is the CONVERSE\'s hypothesis rather than the proved '
                + 'statement\'s. What was proved runs concyclic ⟹ 180°; reading it backwards is a '
                + 'different claim that needs its own proof, exactly as a converse always does. '
                + 'That converse happens to be true — a quadrilateral whose opposite angles total '
                + '180° is cyclic — and the distinction stands anyway, because being true is not '
                + 'the same as being licensed by the statement in hand. So PQRS is refuted '
                + 'outright and ABCD has passed the only test available, which is a weaker thing '
                + 'to be able to say and the honest one.',
              socratic:
                'ABCD\'s opposite angles do total 180°. Which way round is the statement that was '
                + 'proved, and does it let you conclude ABCD is cyclic?',
            },
          ],
          answer:
            'PQRS is definitely not concyclic; ABCD passes the test without being proved cyclic '
            + 'by the statement in hand. Both total 360° — 85 + 98 + 95 + 82 and 85 + 98 + 94 + '
            + '83 — and that separates nothing, since every quadrilateral totals 360°. The pair '
            + 'that matters: in PQRS, P + R = 85 + 94 = 179 ≠ 180, so the contrapositive of '
            + '"concyclic, therefore opposite angles total 180°" settles it with nothing added. '
            + 'Q + S = 181 is the same failure read twice, because the four angles total 360° and '
            + 'so the two pairs must share that 360° between them. In ABCD both pairs total 180°, '
            + 'which is the converse\'s hypothesis — a separate claim needing its own proof, true '
            + 'as it happens but not what was proved here. The 180° fact itself is the first '
            + 'point\'s halving: opposite vertices stand on the same diagonal from opposite arcs, '
            + 'so their angles halve two central angles totalling 360°.',
        },
      },
    ],
  },
  {
    id: 'circle-measure',
    name: 'Circumference and circular area',
    subjectId: subject.id,
    scope: {
      id: 'circle-measure',
      label: 'Circumference and circular area',
      hint: 'circumference pi area of a circle arc length sector',
      /*
       * Carried verbatim from the map node, like the seven anchored patterns
       * before it and against the eighth's precedent of no pattern at all. The
       * rule those comments establish cuts both ways: do not invent a pattern
       * during an authoring pass, and do not widen one either, because the
       * recognition figure in tests/atlas.mjs would move with no way to say
       * which edit moved it.
       *
       * The gap is the same shape as `circles`' and worth naming for the same
       * reason. The alternation takes "Circumference", "Area of a disk", "Area
       * of a circle" and "Pi", and the `\b` on the last keeps it off "pizza"
       * and "pint" — but it does not take "Arc length", "Circular sector" or
       * "Radian", which are the titles of two of the three things taught below.
       * So the pattern selects precisely and recalls badly, and `fidelity` is
       * still `checked`: what `checked` claims is that the pattern really
       * decides membership for what it matches, not that it matches everything
       * the concept covers. Widening it to reach the sector is a recognition
       * decision and belongs on the map as its own change.
       */
      match: /\b(circumference|area of a (disk|circle)|\bpi\b)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'produce-either-of-the-circumference-and-the-radius-from-the-other',
        statement:
          'Given a radius, produce the circumference as an exact multiple of π, having first '
          + 'decided whether the defining ratio is taken against the radius or the diameter; and '
          + 'given a circumference in that form, divide back to the radius with nothing rounded '
          + 'anywhere. Say why the quotient C/d is the same for every circle — that it follows '
          + 'from all circles being similar, rather than from any particular circle having been '
          + 'measured carefully.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'take-one-fraction-of-a-turn-and-apply-it-to-two-different-wholes',
        statement:
          'Given a central angle, produce both the arc length and the sector area of the circle '
          + 'it cuts, computing the angle\'s share of a full turn ONCE and then choosing which '
          + 'whole to take that share of. Say why one fraction serves a length and an area alike, '
          + 'and why the sector\'s perimeter is the one measure of it that is a fraction of '
          + 'nothing at all.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'carry-a-scale-factor-into-the-boundary-once-and-the-area-twice',
        statement:
          'Given two circles, or a scale factor between them, produce the factor by which the '
          + 'circumference grows and the factor by which the area grows, and say why the second '
          + 'is the square of the first rather than equal to it. Recover any one measure of a '
          + 'circle from any other, and say why that is available here when `area-and-perimeter` '
          + 'established that a perimeter does not determine an area.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-ratio-is-taken-against-the-diameter-and-does-not-depend-on-the-circle',
        conceptId: 'circle-measure',
        statement:
          'π is the circumference divided by the DIAMETER, and the content of the point is the '
          + 'second half of that: the quotient comes out the same for every circle, which is what '
          + 'entitles it to be a number rather than a measurement of one particular circle. The '
          + 'reason is similarity. Any two circles are scaled copies of each other, scaling '
          + 'multiplies every length by the same factor, and a quotient whose top and bottom are '
          + 'both multiplied by that factor does not move. From C/d = π comes C = πd = 2πr, and '
          + 'the commonest error is taking the ratio against the radius instead, which halves '
          + 'every answer while every multiplication in it stays correct. The relation also runs '
          + 'backwards: a circumference left as an exact multiple of π divides back to a radius '
          + 'with no rounding anywhere, which a decimal cannot do.',
        position: 1,
        /*
         * No `automaticityTarget`. Doubling a radius is the fastest arithmetic
         * in the subject and would time beautifully, which is exactly the trap:
         * the content is WHICH length the ratio is taken against, and a speed
         * reward trains multiplying whichever number was printed by 2π. That is
         * the error the point exists to stop, and it is the same argument the
         * first point of `circles` makes about halving the printed angle.
         */
        workedExample: {
          problem:
            'A circle has radius 7 cm. Find its circumference exactly. A second circle has '
            + 'circumference 50π cm; find its radius. Then say why the quotient C/d could not '
            + 'have come out differently for the two of them.',
          subgoals: [
            {
              label: 'Name which length the ratio is taken against, before substituting anything',
              detail:
                'π is the circumference over the DIAMETER, not over the radius: C/d = π, so '
                + 'C = πd. What was given is the radius, so the diameter has to be formed first — '
                + 'd = 2r = 14 cm — and then C = 14π cm. Substituting the printed 7 straight into '
                + 'πd gives 7π and halves the circumference, with the multiplication itself '
                + 'correct. So the first move is to say which length the definition names, not to '
                + 'use the number that was supplied.',
              socratic:
                'π is the circumference divided by one other length of the circle. Which length '
                + 'is it — and which one were you handed here?',
            },
            {
              label: 'Substitute and stop at the exact multiple of π',
              detail:
                'C = π × 14 = 14π cm, and 14π IS the circumference — there is no arithmetic left '
                + 'to do. Writing 43.98 cm states a length the circle does not have: π is '
                + 'irrational, so every decimal for it is a rounding, and the rounding would now '
                + 'be inside the answer. The exact form also keeps the 14 in view, which is the '
                + 'diameter, so it still says where it came from in a way a decimal does not.',
              socratic:
                'You have C = π × 14. Is there still a calculation to do here, or is 14π already '
                + 'the length?',
            },
            {
              label: 'Run the relation backwards, since C = πd is an equation and not a procedure',
              detail:
                'The second circle gives 50π = πd, and dividing both sides by π — legal, because '
                + 'π is not zero — leaves d = 50 cm, so r = 25 cm. The π cancels exactly and '
                + 'nothing is rounded, which is the practical payoff of having kept the first '
                + 'answer exact: a circumference recorded as 43.98 cm would have had to be '
                + 'divided by a decimal for π, and would have come back as 13.9995 rather than '
                + 'as 14. The error to avoid at the end is stopping at the 50, which is the '
                + 'diameter, and calling it the radius.',
              socratic:
                '50π = πd. What single division undoes this in one step, and what is left on '
                + 'each side when it is done?',
            },
            {
              label: 'Say why the quotient was never free to differ between the two circles',
              detail:
                'Any two circles are similar — one is a scaled copy of the other — and here the '
                + 'factor is 50/14 = 25/7, which is the ratio of the radii as well. Scaling '
                + 'multiplies EVERY length of a figure by that factor, so the second circle\'s '
                + 'circumference and its diameter are both 25/7 times the first\'s, and a '
                + 'quotient with the same factor top and bottom is unchanged. So C/d is one '
                + 'number for all circles. It is not a fact about circles that somebody measured '
                + 'well; it is forced by similarity, and the argument that a ratio inside one '
                + 'figure survives scaling it is `similarity`\'s third point.',
              socratic:
                'The second circle is a scaled copy of the first. What does that scaling do to '
                + 'the top and the bottom of C/d separately — and so what does it do to the '
                + 'quotient?',
            },
          ],
          answer:
            'C = 14π cm for the first circle, and r = 25 cm for the second. π is the ratio of '
            + 'circumference to DIAMETER, so C = πd = π × 14 = 14π cm; taking it against the '
            + 'radius would have given 7π and halved it. For the second, 50π = πd divides by π '
            + 'exactly to give d = 50 cm and hence r = 25 cm, with nothing rounded at any point. '
            + 'The quotient C/d is the same for both because any two circles are similar: the '
            + 'second is the first scaled by 25/7, and scaling multiplies circumference and '
            + 'diameter by that one factor, so their quotient does not move. That invariance is '
            + 'what makes π a number rather than a measurement of some particular circle.',
        },
      },
      {
        id: 'an-arc-and-a-sector-take-the-same-fraction-of-two-different-wholes',
        conceptId: 'circle-measure',
        statement:
          'A central angle of θ° opens θ/360 of a full turn, and that single fraction scales BOTH '
          + 'of the circle\'s measures: θ/360 of the circumference is the arc, and θ/360 of the '
          + 'area is the sector. The fraction is computed once and the thing that changes is '
          + 'which whole it is taken of — so the two answers differ in their numbers and in their '
          + 'units, and getting the same number twice means the fraction was applied once and the '
          + 'answer reused. The sector\'s PERIMETER is the measure the rule does not reach: it is '
          + 'the arc plus two radii, and no fraction of the circumference can produce it, because '
          + 'a full circle has no radii on its boundary for a fraction to take a share of.',
        position: 2,
        /*
         * No `automaticityTarget`. The fraction is one division and the two
         * products are one multiplication each, so this would time as well as
         * anything here — and the decision the point is about is which WHOLE to
         * multiply, which a speed reward does not touch. Timing it would reward
         * reaching for the first whole that comes to mind, and taking the
         * fraction of the wrong whole is the error named in the statement.
         */
        workedExample: {
          problem:
            'A circle has radius 18 cm, and a sector of it has a central angle of 60°. Find the '
            + 'length of the arc and the area of the sector, both exactly. Then find the '
            + 'sector\'s perimeter, and say why that one is not a fraction of anything.',
          subgoals: [
            {
              label: 'Turn the angle into a fraction of a full turn, once, before touching either measure',
              detail:
                'A full turn is 360°, so 60° opens 60/360 = 1/6 of the circle. That one fraction '
                + 'is the whole of what the angle contributes, and it is going to serve both '
                + 'measures, so it is worth reducing now rather than carrying 60/360 through two '
                + 'separate calculations. Notice what it does not mention: the radius. The '
                + 'fraction is what the angle does, and the radius decides what it is a fraction '
                + 'OF.',
              socratic:
                'A full turn is 360°. What fraction of it does 60° open — and does that fraction '
                + 'change if the circle is bigger?',
            },
            {
              label: 'Take that fraction of the circumference to get the arc',
              detail:
                'The whole circumference is C = 2πr = 2π(18) = 36π cm, and the arc is a sixth of '
                + 'it: 36π/6 = 6π cm. The arc is part of the BOUNDARY, so the whole it is a share '
                + 'of has to be the boundary\'s length. A learner holding the correct 1/6 who '
                + 'reaches for the area at this step has not made an arithmetic mistake — they '
                + 'have offered an area where a length was asked for, and the units are the only '
                + 'thing that says so.',
              socratic:
                'The arc is part of the circle\'s boundary. How long is the whole boundary, and '
                + 'what is a sixth of that?',
            },
            {
              label: 'Take the SAME fraction of the area, which is a different whole',
              detail:
                'The whole area is A = πr² = π(18²) = 324π cm², and the sector is a sixth of '
                + 'that: 324π/6 = 54π cm². The fraction is the identical 1/6 from the first step '
                + 'and only the whole has changed. The two answers are 6π cm and 54π cm² — '
                + 'different numbers and different units — and that difference is the check that '
                + 'two wholes were really used, because the one way to get the same number twice '
                + 'is to take the fraction once and reuse what it gave.',
              socratic:
                'You took a sixth of the circumference for the arc. What is the whole AREA here, '
                + 'and what is the same sixth of that?',
            },
            {
              label: 'Close the sector, and find the one measure no fraction supplies',
              detail:
                'The sector is bounded by the arc and by the two radii that cut it out, so its '
                + 'perimeter is 6π + 18 + 18 = (6π + 36) cm. This is not a sixth of anything. A '
                + 'sixth of the circumference is the arc by itself, and the two radii are not '
                + 'part of the circle\'s boundary at all — a full circle has none on its edge — '
                + 'so there is nothing in the whole for a fraction to have taken them from. The '
                + 'fraction rule covers the arc and the sector\'s area and stops there, and this '
                + 'is where applying it anyway answers 6π and silently drops 36 cm of boundary.',
              socratic:
                'Walk the whole way round the sector and back to where you started. Which part '
                + 'of that journey runs along the circle, and which part would a fraction of the '
                + 'circumference never have counted?',
            },
          ],
          answer:
            'The arc is 6π cm, the sector is 54π cm², and the sector\'s perimeter is (6π + 36) '
            + 'cm. The angle opens 60/360 = 1/6 of a full turn, and that one fraction serves both '
            + 'measures. The whole circumference is 2π(18) = 36π cm, so the arc is 36π/6 = 6π cm; '
            + 'the whole area is π(18²) = 324π cm², so the sector is 324π/6 = 54π cm². Same '
            + 'fraction, two different wholes — and the answers differ in both number and units, '
            + 'which is how you know two wholes were used rather than one answer reused. The '
            + 'perimeter is the exception: the sector is closed by the arc and TWO RADII, giving '
            + '6π + 36 cm, and no fraction of the circumference could have produced it, because a '
            + 'full circle has no radii on its boundary to take a share of.',
        },
      },
      {
        id: 'a-scale-factor-multiplies-the-boundary-once-and-the-area-twice',
        conceptId: 'circle-measure',
        statement:
          'Scaling a circle by a factor k multiplies its circumference by k and its area by k², '
          + 'because a circumference is a length and an area is a length times a length. So '
          + 'doubling the radius doubles the boundary and QUADRUPLES the area, and "k times as '
          + 'wide, k times as big" is wrong by a whole factor of k — the right number multiplied '
          + 'once where it should have been multiplied twice. The exponents also settle something '
          + '`area-and-perimeter` showed to be false in general. There, neither measure '
          + 'determined the other, because a rectangle has two free numbers and a perimeter pins '
          + 'only their sum. A circle has ONE free number, so any one of its measures fixes the '
          + 'radius and the radius fixes the rest — which means that concept\'s claim was about '
          + 'shapes with room to vary, not about measures as such.',
        position: 3,
        /*
         * No `automaticityTarget`, and this is the point where one would be
         * least defensible. Squaring 3 is the whole arithmetic, and the error
         * the point exists to stop — answering k where k² was wanted — is a
         * learner who computed FAST and once. A speed target would reward
         * exactly the reflex being corrected, which is the argument the third
         * point of `quadrilaterals-and-polygons` makes about haste producing
         * the wrong total.
         */
        workedExample: {
          problem:
            'Circle A has radius 5 cm and circle B has radius 15 cm. By what factor does the '
            + 'circumference grow from A to B, and by what factor does the area? Then a third '
            + 'circle has circumference 20π cm — find its area, and say why that was possible '
            + 'here when `area-and-perimeter` showed that a perimeter does not fix an area.',
          subgoals: [
            {
              label: 'Get the scale factor from the two radii before computing any measure',
              detail:
                'B\'s radius is 15 cm and A\'s is 5 cm, so B is A scaled by k = 15/5 = 3: every '
                + 'length of B is three times the matching length of A, which is what a scale '
                + 'factor means. Both answers below come out of this one number. Computing all '
                + 'four measures first and comparing them afterwards also works, and hides the '
                + 'point — the two factors are not two separate findings, they are k and k².',
              socratic:
                'B is a scaled copy of A. What single number multiplies every length of A to '
                + 'give the matching length of B?',
            },
            {
              label: 'Multiply the boundary once, because a circumference is a length',
              detail:
                'C_A = 2π(5) = 10π cm and C_B = 2π(15) = 30π cm, so the circumference grew by '
                + '30π/10π = 3 — the scale factor itself, with no further change. A circumference '
                + 'is a length, scaling multiplies lengths by k, and so the boundary carries '
                + 'exactly one factor of k.',
              socratic:
                'A circumference is a length. If every length of the figure triples, what happens '
                + 'to this particular one?',
            },
            {
              label: 'Multiply the area twice, because an area is a length times a length',
              detail:
                'A_A = π(5²) = 25π cm² and A_B = π(15²) = 225π cm², so the area grew by '
                + '225π/25π = 9, which is 3² and not 3. The radius sits SQUARED in πr², so a '
                + 'factor of 3 on the radius enters the area twice. This is precisely where '
                + '"three times as wide, three times as big" fails, and it fails by a factor of '
                + '3: the area is nine times, and a learner who answers three has multiplied the '
                + 'correct number once instead of twice.',
              socratic:
                'An area is a length times a length. If each of those two lengths triples, what '
                + 'happens to the product — and how does that compare with what happened to the '
                + 'boundary?',
            },
            {
              label: 'Cross between the measures through the single parameter, which a rectangle has not got',
              detail:
                'The third circle has C = 20π cm, so 20π = 2πr gives r = 10 cm, and then '
                + 'A = π(10²) = 100π cm². One measure fixed another — and `area-and-perimeter` '
                + 'showed that for a rectangle it does not, by exhibiting two rectangles of equal '
                + 'perimeter with different areas. The difference is how many numbers it takes to '
                + 'describe the shape. A rectangle needs two, and a perimeter pins only their '
                + 'sum, so one degree of freedom survives. A circle needs ONE, so any measure of '
                + 'it pins the radius, and the radius pins everything else.',
              socratic:
                'A rectangle\'s perimeter left its area undecided. How many numbers does it take '
                + 'to describe a circle completely — and does knowing the circumference leave any '
                + 'of them free?',
            },
          ],
          answer:
            'The circumference grows by a factor of 3 and the area by a factor of 9; the third '
            + 'circle\'s area is 100π cm². B is A scaled by k = 15/5 = 3. A circumference is a '
            + 'length, so it carries one factor of k: 10π cm becomes 30π cm, a factor of 3. An '
            + 'area is a length times a length, so it carries two: 25π cm² becomes 225π cm², a '
            + 'factor of 9 = 3². That is why "three times as wide, three times as big" is wrong, '
            + 'and wrong by a factor of 3. For the third circle, C = 20π gives 20π = 2πr, so '
            + 'r = 10 cm and A = π(10²) = 100π cm². One measure fixing another is available here '
            + 'and was not for the rectangle in `area-and-perimeter`, and the difference is the '
            + 'number of free parameters: a rectangle has two and its perimeter pins only their '
            + 'sum, while a circle has one, so any measure of it pins all the others.',
        },
      },
    ],
  },
  {
    id: 'distance-and-midpoint',
    name: 'Distance and midpoint',
    subjectId: subject.id,
    scope: {
      id: 'distance-and-midpoint',
      label: 'Distance and midpoint',
      hint: 'distance formula midpoint coordinate',
      /*
       * Carried verbatim from the map node, like every pattern above it and for
       * the same reason: widening one while writing the material makes two
       * changes at once, and the recognition figure in tests/atlas.mjs would
       * move with no way to say which edit moved it.
       */
      match: /\b(distance formula|euclidean distance|midpoint)\b/i,
    },
    fidelity: 'checked',
    /*
     * THESE OBJECTIVES NAME `evaluate` AND NOTHING ELSE, which is a departure
     * from every concept above them in this file and is deliberate.
     *
     * `pythagoras` names `justify` on all three of its objectives and
     * `transform_to_form` on one; the other nine concepts here name `justify`
     * somewhere too. That is defensible on the letter of types.ts — a justify
     * task WOULD evidence those objectives — and no justify task exists
     * anywhere in the build, so it is a promise with nothing behind it, which
     * is the failure the "never empty" rule exists to prevent one step up.
     * ontology-algebra.ts changed the habit for the same reason and it is
     * followed here.
     *
     * The cost is that each objective had to be PHRASED so that a value really
     * evidences it, which is the part worth copying rather than the rule. The
     * first does not ask why the formula needs no absolute value; it asks for
     * the difference between the two orderings, which is a number and is zero.
     * The second does not ask whether the midpoint lies on the segment; it asks
     * for the length of one of the two halves, which is half the whole. The
     * third does not ask what a displacement is; it asks for a coordinate in a
     * problem where the displacement is also on offer.
     */
    objectives: [
      {
        id: 'build-the-right-triangle-the-two-points-already-make',
        statement:
          'Produce the distance between two points from their coordinates alone, by taking the '
          + 'two coordinate differences as the legs of a right triangle and the segment as its '
          + 'hypotenuse; and show that swapping the two points leaves the answer unchanged, '
          + 'which is why the formula carries no absolute value.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'average-each-axis-and-measure-the-half-it-makes',
        statement:
          'Produce a midpoint as TWO numbers rather than one, averaging each coordinate '
          + 'separately and carrying a half rather than rounding it; and check the answer by '
          + 'measuring one of the two halves it cuts the segment into against the whole.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'tell-a-coordinate-from-the-step-that-reaches-it',
        statement:
          'Recover an unknown endpoint from one endpoint and the midpoint by solving the '
          + 'midpoint condition on each axis in turn; and give the coordinate that was asked '
          + 'for rather than the displacement that reaches it, which the same problem also '
          + 'offers and which the method produces one step early.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-legs-are-the-coordinate-differences',
        conceptId: 'distance-and-midpoint',
        statement:
          'The distance between two points is not a new formula; it is Pythagoras with the two '
          + 'legs read off the coordinates. Complete the right triangle whose other two sides '
          + 'run along the axes: the horizontal one spans the difference of the '
          + 'x-coordinates, the vertical one the difference of the y-coordinates, and the '
          + 'segment itself is the hypotenuse — so d² = (x₂ − x₁)² + (y₂ − y₁)². The right '
          + 'angle is there because the axes are perpendicular, not because the figure was '
          + 'drawn that way. And the squares are what make the subtraction order irrelevant, '
          + 'since (x₁ − x₂)² is the same number as (x₂ − x₁)²: that is why the formula is '
          + 'written with no absolute value signs in it, and why there is no "first" point to '
          + 'get wrong.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason the Pythagoras points give and
         * which applies here with one extra turn of the screw. The arithmetic is
         * two subtractions, two squarings, an addition and a root, all of it
         * already timed where it belongs — `two-sums-every-angle-chase-uses`
         * times the subtraction and nothing here is faster than that. What the
         * point is about is completing the triangle and noticing that the signs
         * cannot matter, and a learner who is quick about the second half is
         * usually one who never looked at the first.
         */
        workedExample: {
          problem:
            'Find the distance from A(−2, 1) to B(3, 13). Then compute it again with the points '
            + 'taken in the other order, from B to A, and say what makes the two answers the '
            + 'same number.',
          subgoals: [
            {
              label: 'Complete the right triangle the two points already determine, before computing anything',
              detail:
                'A and B are the two ends of the hypotenuse. The third vertex is the point that '
                + 'takes its x from one of them and its y from the other — (3, 1) here, B\'s x '
                + 'with A\'s y — so the two legs run along the axes, one horizontal at height '
                + 'y = 1 and one vertical at x = 3. Either choice of which point lends which '
                + 'coordinate works; the other corner is (−2, 13) and gives the same two leg '
                + 'lengths. Nothing has been calculated yet, and this is the only '
                + 'step in the problem that is not arithmetic. It is also what makes this '
                + 'Pythagoras rather than a separate fact: the right angle is at that third '
                + 'vertex, and it is a right angle because the axes are perpendicular.',
              socratic:
                'You want the length of the segment joining two points. What third point turns '
                + 'that segment into the hypotenuse of a right triangle whose other two sides '
                + 'you can measure one coordinate at a time?',
            },
            {
              label: 'Measure each leg as one coordinate difference, which is where the signed arithmetic sits',
              detail:
                'The horizontal leg runs from x = −2 across to x = 3, so its length is '
                + '3 − (−2) = 5 — subtracting a negative, which is the step this calculation '
                + 'most often loses. The vertical leg runs from y = 1 up to y = 13, so its '
                + 'length is 13 − 1 = 12. Each leg uses one coordinate from each point and '
                + 'ignores the other, because each runs along a single axis.',
              socratic:
                'The horizontal leg goes from x = −2 across to x = 3. How long is it, and which '
                + 'number from each point does the vertical leg use instead?',
            },
            {
              label: 'Add the two squares, because the side you were asked for is the hypotenuse',
              detail:
                'Both legs are known and the hypotenuse is not, so this is the adding direction '
                + 'of the relation: d² = 5² + 12² = 25 + 144 = 169. What has been produced is '
                + 'd² and not d. The slot assignment that `pythagoras` makes a whole knowledge '
                + 'point of is settled here before any number is read — the segment is the '
                + 'hypotenuse because the right angle is at the corner, not at either of the '
                + 'points you were given.',
              socratic:
                'The legs are 5 and 12 and the side you want is the one opposite the right '
                + 'angle. Does the relation have you add the two squares or subtract one from '
                + 'the other?',
            },
            {
              label: 'Take the positive root, and notice that a whole number here is luck',
              detail:
                'd = √169 = 13, so the distance is 13. Only the positive root is a distance, '
                + 'for the reason `pythagoras` separates out carefully: nothing in d² = 169 '
                + 'prefers either solution, and what rules one out is what d MEANS. The answer '
                + 'came out whole because 5, 12, 13 is a Pythagorean triple; two points picked '
                + 'at random give an irrational distance, and the exact answer is then a '
                + 'reduced surd rather than a decimal.',
              socratic:
                'You have d² = 169. What is left to do to it, and should you expect a whole '
                + 'number from a pair of points chosen at random?',
            },
            {
              label: 'Swap the two points and watch the squaring erase the difference',
              detail:
                'Taken from B to A the differences come out as −2 − 3 = −5 and 1 − 13 = −12. '
                + 'Neither is a length, since a length cannot be negative — but (−5)² = 25 and '
                + '(−12)² = 144 are the same two numbers as before, so d² is 169 again and d is '
                + '13. That is the whole reason the formula needs no absolute value: the order '
                + 'of subtraction decides a sign and the squaring discards it. Note what this '
                + 'does NOT say. The two differences are genuinely different numbers, and the '
                + 'third point of this concept is about telling a difference apart from a '
                + 'coordinate — there the sign is part of what the difference IS, and nothing '
                + 'squares it away.',
              socratic:
                'Reversing the order makes both differences negative, and a length cannot be '
                + 'negative. Why does the distance come out the same anyway?',
            },
          ],
          answer:
            'The distance is 13. The third vertex (3, 1) completes a right triangle whose legs '
            + 'run along the axes: the horizontal one is 3 − (−2) = 5 and the vertical one is '
            + '13 − 1 = 12. The segment is the hypotenuse, so the squares add — '
            + 'd² = 25 + 144 = 169 — and d = √169 = 13, taking the positive root because a '
            + 'distance is one. Taken the other way the differences are −5 and −12, which are '
            + 'not lengths, but their squares are 25 and 144, the same two numbers, so d² is '
            + '169 again. That is why the formula is written with no absolute value: the order '
            + 'of subtraction decides a sign and the squaring discards it. The whole-number '
            + 'answer is the exception rather than the rule, since it needs the two squares to '
            + 'add to a square — 5, 12, 13 is a Pythagorean triple, and a pair of points picked '
            + 'at random gives an irrational distance best left as a reduced surd.',
        },
      },
      {
        id: 'a-midpoint-is-an-average-per-axis-and-costs-two-numbers',
        conceptId: 'distance-and-midpoint',
        statement:
          'The midpoint of a segment is the average of its two ends, taken one axis at a time: '
          + 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2). Averaging each coordinate on its own works because '
          + 'the axes do not interact — halfway along the segment is independently halfway '
          + 'across in x and halfway up in y. Two things follow that the formula does not say '
          + 'by itself. The answer is a POINT, so it is two numbers and not one, and stopping '
          + 'after the first axis answers half the question. And the halving is exact: the '
          + 'midpoint of two points with whole coordinates need not have whole coordinates, so '
          + 'a half that appears has to be carried rather than rounded away.',
        position: 2,
        /*
         * No `automaticityTarget`. Two additions and two halvings would time
         * beautifully, and that is the argument against it: what the point is
         * about is that the answer is two numbers and that one of them is not a
         * whole number, and both of those are things a learner gets wrong by
         * finishing early. A speed reward on this point would reward stopping
         * after the x and rounding the half, which are precisely the two errors
         * it exists to stop. Same shape as the third point of
         * `quadrilaterals-and-polygons`, where haste produces the wrong total.
         */
        workedExample: {
          problem:
            'Find the midpoint M of the segment from A(−2, 1) to B(3, 13) — the same two points '
            + 'as the point above. Then measure A to M and M to B, and say what the two lengths '
            + 'together establish that "the same distance from both ends" does not.',
          subgoals: [
            {
              label: 'Average the two x-coordinates, and keep the half the division produces',
              detail:
                'The x of M is (−2 + 3)/2 = 1/2. Both ends have whole x-coordinates and the '
                + 'midpoint does not, which is the ordinary case rather than a sign that '
                + 'something has gone wrong: an average of two whole numbers is itself whole '
                + 'only when the two share a parity. Rounding 1/2 to 0 or to 1 would move the '
                + 'point off the middle of the segment, and the check in the last subgoal would '
                + 'then fail by an amount you could measure.',
              socratic:
                'Halfway between x = −2 and x = 3 — what number is that, and what would be lost '
                + 'by writing it as a whole one?',
            },
            {
              label: 'Do the other axis separately, because the answer is a point rather than a length',
              detail:
                'The y of M is (1 + 13)/2 = 7, so M = (1/2, 7). It is the same move on '
                + 'different numbers and it still has to be made: a learner who answers 1/2 has '
                + 'given one of the two coordinates the question asked for. Nothing about the '
                + 'x-average enters the y-average, which is exactly why a problem in two '
                + 'dimensions is two problems in one.',
              socratic:
                'You have the x of the midpoint. What is still missing, and does the number you '
                + 'just found change how you get it?',
            },
            {
              label: 'Measure one half of the segment with the previous point\'s formula',
              detail:
                'From A(−2, 1) to M(1/2, 7) the legs are 1/2 − (−2) = 5/2 and 7 − 1 = 6, so '
                + 'd² = 25/4 + 36 = 25/4 + 144/4 = 169/4 and that half is 13/2. From M to '
                + 'B(3, 13) the legs are 3 − 1/2 = 5/2 and 13 − 7 = 6 — the same two numbers — '
                + 'so the other half is 13/2 as well. The fractions were carried exactly, and '
                + 'that is what makes the two agree: a midpoint rounded to (0, 7) or (1, 7) '
                + 'gives halves of different lengths.',
              socratic:
                'You have the midpoint, and the point above gives you distances. How long is '
                + 'each of the two pieces the midpoint cuts the segment into?',
            },
            {
              label: 'Add the two halves and recognise the whole, which equal distances alone would not give you',
              detail:
                '13/2 + 13/2 = 13, and 13 is the A-to-B distance computed in the point above. '
                + 'That sum is worth separating from the equality, because the equality is the '
                + 'weaker of the two facts. Being the same distance from both ends puts a point '
                + 'anywhere on the perpendicular bisector of AB: the apex of an isosceles '
                + 'triangle on AB qualifies and is nowhere near the segment. What pins M to the '
                + 'segment is that the two distances ADD to the whole — the triangle inequality '
                + 'makes a route through M at least as long as the straight one, with equality '
                + 'only when the three points are in line. So "midpoint" is two claims, and the '
                + 'one people check is not the one that does the work.',
              socratic:
                'The two halves are equal — and so are the distances from the apex of an '
                + 'isosceles triangle to the two ends of its base. What do you have here that '
                + 'the apex has not got?',
            },
          ],
          answer:
            'M = (1/2, 7). The x is (−2 + 3)/2 = 1/2 and the y is (1 + 13)/2 = 7 — one average '
            + 'per axis, because halfway along the segment is independently halfway across and '
            + 'halfway up, and because the answer is a point it is two numbers rather than one. '
            + 'The half is exact and is carried: an average of two whole numbers is whole only '
            + 'when they share a parity. Each half of the segment then measures 13/2 by the '
            + 'previous point\'s formula — A to M has legs 5/2 and 6, and M to B has legs 5/2 '
            + 'and 6 as well — so the two halves are equal, and they also add to 13, which is '
            + 'the whole distance from A to B. The sum is the stronger fact. Equal distances on '
            + 'their own put a point anywhere on the perpendicular bisector of AB, including '
            + 'apexes of isosceles triangles far from the segment; the distances adding to the '
            + 'whole forces the three points to be in line, since the triangle inequality makes '
            + 'a route through M at least as long as the straight one and lets it be equal only '
            + 'when M is on it.',
        },
      },
      {
        id: 'a-coordinate-is-not-the-step-that-reaches-it',
        conceptId: 'distance-and-midpoint',
        statement:
          'Both formulas above are built out of two different kinds of number, and running '
          + 'either backwards is where the two get swapped. A coordinate says WHERE a point '
          + 'is, measured from the origin; a difference of coordinates says how far and in '
          + 'which direction you move, measured from wherever you started. Given one endpoint '
          + 'and the midpoint, the other endpoint comes from solving the midpoint condition on '
          + 'each axis: (x₁ + x₂)/2 = m gives x₂ = 2m − x₁, so the doubling comes first and the '
          + 'subtraction second. The common wrong answer is m − x₁, and it is not a slip in the '
          + 'arithmetic — it is a real number in the problem, the step from the known endpoint '
          + 'to the midpoint, handed back where a place was asked for.',
        position: 3,
        /*
         * No `automaticityTarget`, for the reason the Pythagoras slot-assignment
         * point gives. The arithmetic is a doubling and a subtraction; the
         * content is which of two numbers already in front of you is the answer,
         * and the wrong one arrives sooner. A speed target would reward the
         * learner who stopped at the displacement.
         */
        workedExample: {
          problem:
            'A segment has one endpoint A(−2, 1) and midpoint M(4, −3). Find the other '
            + 'endpoint B. Then say what the number 6 is in this problem, given that it is the '
            + 'commonest answer to the first coordinate and is not it.',
          subgoals: [
            {
              label: 'Write the midpoint condition as an equation in the unknown coordinate, one axis at a time',
              detail:
                'M is the average of A and B, so on the x-axis (−2 + x)/2 = 4, where x is B\'s '
                + 'x-coordinate. That is a linear equation in one unknown, and it is the whole '
                + 'of the method: the backwards direction is not a second formula to learn but '
                + 'the same relation read as a condition on x instead of as a recipe for M.',
              socratic:
                'The midpoint is the average of the two ends. Written as an equation whose '
                + 'unknown is B\'s x-coordinate, what does that say here?',
            },
            {
              label: 'Clear the halving first, so the 2 multiplies the midpoint and not the difference',
              detail:
                'Multiplying both sides by 2 gives −2 + x = 8. The 2 lands on the midpoint\'s '
                + 'coordinate, and that is where the doubling in x₂ = 2m − x₁ comes from: the '
                + 'whole segment is twice the half. Reaching for the subtraction first instead '
                + '— 4 − (−2) = 6 — answers a different question, and the last subgoal says '
                + 'which one.',
              socratic:
                'The left side of the equation is divided by 2. What do you do to both sides '
                + 'first, and which of the two numbers does the 2 end up multiplying?',
            },
            {
              label: 'Finish the solve, and watch the signed number one more time',
              detail:
                'From −2 + x = 8, adding 2 to both sides gives x = 10. Taking the −2 across is '
                + 'what makes the number grow, exactly as subtracting a negative did in the '
                + 'first point of this concept. So B\'s x-coordinate is 10.',
              socratic:
                'You have −2 + x = 8. What is x, and does getting rid of the −2 make it larger '
                + 'or smaller?',
            },
            {
              label: 'Repeat on the second axis rather than reusing the first answer',
              detail:
                '(1 + y)/2 = −3 gives 1 + y = −6 and then y = −7, so B = (10, −7). Two moves on '
                + 'different numbers, and both signs bite: doubling a negative midpoint gives '
                + '−6, and taking the +1 off that goes further down rather than back up. As in '
                + 'the point above, a point costs two of these, and stopping after one answers '
                + 'half the question.',
              socratic:
                'Do the y-axis the same way, from (1 + y)/2 = −3. What is y, and does it sit '
                + 'above or below the midpoint\'s −3?',
            },
            {
              label: 'Name what the rejected number actually is, which is what makes the error diagnosable',
              detail:
                'The step from A to M is (4 − (−2), −3 − 1) = (6, −4), and the step from M to B '
                + 'is (10 − 4, −7 − (−3)) = (6, −4) — the same displacement twice, which is '
                + 'what being the midpoint means. So 6 is real and it is the x-part of that '
                + 'step. It is not B\'s x-coordinate, because a coordinate is measured from the '
                + 'origin and a displacement from wherever you happened to start; 4 + 6 = 10 is '
                + 'the bridge between the two. Answering 6 is therefore not bad arithmetic, it '
                + 'is a difference offered where a place was wanted — and the tell is that the '
                + 'two steps agree while neither of them answers the question.',
              socratic:
                '6 appears twice in this problem and is the answer to neither coordinate. What '
                + 'is it the length and direction of, and what would you have to add it to in '
                + 'order to reach B?',
            },
          ],
          answer:
            'B = (10, −7). On each axis the midpoint condition is an equation in the unknown '
            + 'coordinate: (−2 + x)/2 = 4 gives −2 + x = 8 and then x = 10, and (1 + y)/2 = −3 '
            + 'gives 1 + y = −6 and then y = −7. The halving is cleared first, which is why the '
            + 'midpoint gets doubled — the whole segment is twice the half — and the known '
            + 'endpoint is subtracted after, so x₂ = 2m − x₁. The number 6 is the x-part of the '
            + 'displacement from A to M: that step is (4 − (−2), −3 − 1) = (6, −4), and the '
            + 'step from M to B is (10 − 4, −7 − (−3)) = (6, −4) as well, the two being equal '
            + 'being exactly what makes M the midpoint. So 6 is a how-far and B\'s coordinate '
            + 'is a where, with 4 + 6 = 10 the bridge between them. Answering 6 is not an '
            + 'arithmetic slip but a confusion of a difference with a place, which is the one '
            + 'error this point exists to make nameable.',
        },
      },
    ],
  },
  {
    id: 'isometries-and-symmetry',
    name: 'Isometries and symmetry',
    subjectId: subject.id,
    scope: {
      id: 'isometries-and-symmetry',
      label: 'Isometries and symmetry',
      hint: 'isometry reflection rotation translation symmetry group',
      /*
       * Carried verbatim from the map node, like the nine anchored patterns
       * above it and for the reason `circles`' scope gives at length: widening
       * a pattern while writing the material makes two changes at once, and the
       * recognition figure in tests/atlas.mjs would move with no way to say
       * which edit moved it.
       *
       * This one recalls better than most in the subject, which is worth a line
       * because the previous three scopes each had to record a gap. The
       * alternation takes "Isometry", "Symmetry group", "Reflection symmetry"
       * and "Rotational symmetry", and those are the titles of four of the
       * things actually taught below rather than four near misses. What it does
       * not take is "Glide reflection" or "Dihedral group" — the first is named
       * in the first knowledge point as a kind, the second is the object the
       * third point counts without naming it — so the pattern still selects
       * more precisely than it recalls, and `fidelity` is `checked` on the
       * strength of the first claim rather than the second.
       *
       * It overlaps with `plane-transformations`, which is still a node of
       * `euclidean-geometry` and whose own pattern ends `|\bisometr(y|ies)\b`.
       * That overlap is not new — both matched "Isometry" while both were
       * nodes — and nothing in the build requires a title to select one
       * concept, so it is left alone here. Narrowing either pattern is a
       * recognition decision and belongs on the map.
       */
      match: /\b(isometry|symmetry group|reflection symmetry|rotational symmetry)\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE HERE NAMES ONLY `evaluate`, WHICH IS A DEPARTURE FROM THIS
     * SUBJECT AND IS THE POINT OF THE DEPARTURE.
     *
     * Twenty-eight of the objectives above name `justify`, and no `justify`
     * task exists anywhere in this build — so those objectives name an
     * observation that cannot be made. `ontology-solids.ts` decided against
     * that for the tenth subject and tests/concepts-logic.mjs asserts it there;
     * this is the first concept of the eighth subject to follow, because
     * following it is cheaper than arguing with it and the alternative is
     * promising three more unservable observations.
     *
     * The "say why" half of this concept is not dropped, it is MOVED. Every
     * subgoal below carries a `socratic`, which is where types.ts puts a
     * question nothing can rule, and the three best unrulable questions in the
     * concept — why angle preservation is not a second assumption, why the
     * starting point drops out of the doubling, and why a figure with no mirror
     * line still has one symmetry — are asked there by the tutor rather than
     * advertised here as practice. The honest reading of the 28 above is that
     * they advertise it.
     */
    objectives: [
      {
        id: 'transfer-every-measurement-across-an-isometry-from-the-one-hypothesis',
        statement:
          'Given a figure, its image under an isometry and the correspondence between them, '
          + 'produce every length and every angle of the image from the single assumption that '
          + 'distances are kept — reading the lengths straight off the definition and the angles '
          + 'off SSS, which asks for the three sides to be EQUAL rather than to be known. Decide '
          + 'whether a proposed pair of figures can be related by an isometry at all, by finding '
          + 'one pair of distances that disagree.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'compose-two-reflections-into-the-single-rotation-they-amount-to',
        statement:
          'Given two mirror lines crossing at a stated angle, produce the angle of the single '
          + 'rotation the two reflections compose to — which is DOUBLE the angle between the '
          + 'mirrors and not the angle itself — and run the doubling backwards to get the mirror '
          + 'angle a required rotation demands. Decide whether reversing the order of the two '
          + 'reflections changes the result, by testing the angle rather than by appealing to a '
          + 'rule about composition.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'count-a-figures-symmetries-with-the-identity-among-them',
        statement:
          'Given a figure, produce the number of isometries that carry it onto itself: count the '
          + 'rotations as a full turn divided by the smallest turn that returns the figure, count '
          + 'the mirror lines separately, and add the two — having checked that the identity sits '
          + 'in the first count exactly once and in the second not at all. Produce the count for '
          + 'a figure with no mirror line and no partial turn that returns it, and get 1 rather '
          + 'than 0.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'distance-is-the-only-hypothesis-and-the-angles-follow-by-sss',
        conceptId: 'isometries-and-symmetry',
        statement:
          'An isometry of the plane is a map that keeps every distance: for any two points P and '
          + 'Q, the images satisfy P′Q′ = PQ. Nothing is assumed about angles, and nothing needs '
          + 'to be — take any three points of a figure that are not in a line, together with '
          + 'their images; the three sides match in length, so SSS makes the two triangles '
          + 'congruent and the angles match as well. One hypothesis delivers all six of '
          + '`congruence`\'s equalities, which is why "congruent" and "some isometry carries one '
          + 'onto the other" are the same claim, and why a congruence statement\'s letter order '
          + 'is the record of where the map sent each vertex. The argument asks for the three '
          + 'sides to be EQUAL and not to be KNOWN, so the angles transfer even when only one '
          + 'length was ever measured. That every isometry of the plane is a translation, a '
          + 'rotation, a reflection or a glide reflection is taken as given here, like the '
          + 'congruence criteria are: it needs the classification argument rather than the '
          + 'definition.',
        position: 1,
        /*
         * No `automaticityTarget`. The only arithmetic is 180 − 53 − 59, which
         * `two-sums-every-angle-chase-uses` already times, and what this point
         * is about is which fact licensed carrying an angle across — so a speed
         * reward would report one skill twice and reward reaching for the
         * subtraction ahead of the citation. That is the reason the three proof
         * points give, and it applies here for the same reason: the content is a
         * licence, not a calculation.
         */
        workedExample: {
          problem:
            'An isometry of the plane carries triangle ABC to triangle DEF, sending A to D, B to '
            + 'E and C to F. The only measurements recorded for ABC are ∠A = 53°, ∠B = 59° and '
            + 'AB = 13 cm. State every measurement of DEF that can be stated, and say which fact '
            + 'licensed the angles, given that the definition speaks only about distances.',
          subgoals: [
            {
              label: 'Read where each vertex goes, before transferring any measurement',
              detail:
                'The map sends A to D, B to E and C to F, so AB has image DE, BC has EF and CA '
                + 'has FD. That is what fixes which side of DEF is the 13 cm one — the '
                + 'correspondence, not the size of the number. Pairing the sides by length '
                + 'instead happens to work here only because one length was given, and it is the '
                + 'habit that produces the wrong answer the moment there are two. The letter '
                + 'order is doing exactly the job `congruence` gave it: naming a correspondence '
                + 'rather than listing two triangles.',
              socratic:
                'The map sends A to D, B to E and C to F. Which side of DEF is the image of AB — '
                + 'and what told you, the letters or the 13?',
            },
            {
              label: 'Transfer the one distance you have, straight from the definition',
              detail:
                'An isometry satisfies P′Q′ = PQ for every pair of points. Apply that to the '
                + 'single pair A, B: DE = AB = 13 cm, with nothing derived and nothing else '
                + 'needed. This is the whole of what the hypothesis gives directly — a statement '
                + 'about distances, one pair at a time — and everything else below is got out of '
                + 'it rather than assumed alongside it.',
              socratic:
                'The word isometry makes one claim about a pair of points and their two images. '
                + 'Applied to A and B alone, what does that claim give you?',
            },
            {
              label: 'Get the angles from SSS, which asks for the sides to be equal and not for them to be known',
              detail:
                'The definition also gives EF = BC and FD = CA, because it speaks about EVERY '
                + 'pair of points and not only the measured one. Neither of those two numbers was '
                + 'recorded and neither is needed: SSS asks for three pairs of equal sides, and '
                + 'three pairs of equal sides is precisely what the definition has just supplied. '
                + 'So ABC and DEF are congruent, corresponding angles are equal, and ∠D = ∠A = '
                + '53° with ∠E = ∠B = 59°. Notice what never went in — nothing about angles was '
                + 'assumed, and two angle equalities came out.',
              socratic:
                'Only one of the three sides is a number you know. What do the other two pairs '
                + 'still have in common — and which congruence criterion asks for exactly that '
                + 'and nothing more?',
            },
            {
              label: 'Close the third angle on the total, and say which triangle you closed it in',
              detail:
                '∠F = 180° − 53° − 59° = 68°, by the angle sum. It can be read in either '
                + 'triangle and the answer is the same, which is the content rather than a '
                + 'convenience: ∠C = 68° too, and the congruence is what entitles you to carry '
                + 'the number across. A learner who computes 68° inside ABC and writes it at F '
                + 'has used the correspondence of the first step a second time, which is worth '
                + 'noticing because it is the only thing standing between the two triangles.',
              socratic:
                'Two of DEF\'s angles are 53° and 59°. What is the third — and would you have got '
                + 'the same number working inside ABC instead?',
            },
            {
              label: 'Count the assumptions, and say what that makes of the word congruent',
              detail:
                '`congruence` described two triangles as agreeing in six separate measurements, '
                + 'three sides and three angles, and gave criteria for when three of the six '
                + 'force the other three. This example made ONE assumption and all six '
                + 'equalities followed from it. So a congruence is not a coincidence of six '
                + 'readings: it is the trace of a single map, and the criteria are statements '
                + 'about how little of the trace you have to see before the map must exist. EF '
                + 'and FD were never measured and the conclusion does not care.',
              socratic:
                'You have finished with six equalities between the two triangles. How many '
                + 'assumptions did the example actually start from?',
            },
          ],
          answer:
            'DE = 13 cm; EF = BC and FD = CA, equal to their originals but never recorded as '
            + 'numbers; ∠D = 53°, ∠E = 59° and ∠F = 68°. The correspondence A→D, B→E, C→F is '
            + 'what says DE rather than EF is the 13 cm side. The one distance transfers straight '
            + 'from the definition, P′Q′ = PQ. The angles are NOT a second assumption: the '
            + 'definition gives all three pairs of sides equal, which is SSS in full, so the '
            + 'triangles are congruent and corresponding angles are equal — and SSS asks for the '
            + 'sides to be equal rather than known, which is why two unmeasured sides cost '
            + 'nothing. The third angle closes on the total, 180 − 53 − 59 = 68, and it is '
            + 'readable in either triangle because they are congruent. One hypothesis about '
            + 'distances produced all six of congruence\'s equalities, which is what makes '
            + '"congruent" and "carried onto by an isometry" the same claim.',
        },
      },
      {
        id: 'two-reflections-compose-to-twice-the-angle-between-the-mirrors',
        conceptId: 'isometries-and-symmetry',
        statement:
          'Reflecting in one line and then reflecting the result in a second line that crosses it '
          + 'is a single rotation about the crossing point, through TWICE the angle between the '
          + 'two mirrors. The doubling is the content: mirrors 35° apart turn a figure through '
          + '70°, and perpendicular mirrors give a half turn rather than a quarter. The reason is '
          + 'that each mirror bisects the angle it turns a point through, so the two half-angles '
          + 'add to the angle between the mirrors and the total is twice it — and the point\'s '
          + 'own starting position drops out of that sum, which is what makes the composition one '
          + 'rotation for every point rather than a different motion for each. That is the '
          + 'argument for a point whose first image falls INSIDE the angle between the mirrors, '
          + 'which is the case worked below; when it falls outside, the two half-angles subtract '
          + 'rather than add and the total is still twice the angle between the mirrors, by the '
          + 'same two steps with one sign changed. The parallel case '
          + 'is the same statement with a distance in place of an angle: two mirrors d apart '
          + 'compose to a translation through 2d, perpendicular to them. Order matters. '
          + 'Reflecting in the second mirror first turns the figure through the same 2θ the other '
          + 'way, so the two orders agree only where a turn of 2θ and a turn of −2θ are the same '
          + 'rotation — which needs 4θ to be a whole number of turns, and for mirrors strictly '
          + 'between 0° and 180° that happens at 90° and nowhere else.',
        position: 2,
        /*
         * No `automaticityTarget`. Doubling 35 is the fastest arithmetic in the
         * concept and would time beautifully, which is exactly the trap — the
         * error the point exists to stop is answering θ where 2θ was wanted,
         * and that is a learner who computed FAST and once. A speed target
         * would reward the reflex being corrected, which is the argument the
         * third point of `circle-measure` makes about answering k where k² was
         * wanted.
         */
        workedExample: {
          problem:
            'Two mirror lines m and n cross at O with a 35° angle between them. A point P is '
            + 'reflected in m, and that image is then reflected in n; the first image P₁ lies '
            + 'between the two mirrors, 20° from m and 15° from n. Identify the single isometry '
            + 'that takes P to P₂. Then say what changes if the two reflections are done in the '
            + 'other order, and find the angle between the mirrors that would make the '
            + 'composition a half turn.',
          subgoals: [
            {
              label: 'Fix what the two reflections do to the distance from O, before any angle is computed',
              detail:
                'O lies on m and on n, so each reflection leaves O exactly where it is, and each '
                + 'keeps every distance. So OP = OP₁ = OP₂: P₂ is as far from O as P was. '
                + 'Whatever the composition turns out to be, it moves points around O without '
                + 'changing how far from it they are, which is what a rotation about O does. The '
                + 'angle is all that is left to find, and that is worth establishing first — it '
                + 'is the step that says the answer will be a rotation rather than a translation '
                + 'or a reflection.',
              socratic:
                'O lies on both mirrors. What does each reflection do to O itself, and what does '
                + 'that force about the three lengths OP, OP₁ and OP₂?',
            },
            {
              label: 'Double each half-angle, because a mirror bisects the angle it turns a point through',
              detail:
                'P₁ is 20° from m and P is its mirror image in m, so P is 20° from m on the other '
                + 'side: ∠POP₁ = 2 × 20° = 40°. The same at the second mirror — P₁ is 15° from n, '
                + 'so P₂ is 15° beyond n and ∠P₁OP₂ = 2 × 15° = 30°. Each reflection contributes '
                + 'twice the angle between the point and the mirror, and that is where every '
                + 'factor of 2 in this knowledge point comes from. It is one fact used twice, not '
                + 'two facts.',
              socratic:
                'P₁ sits 20° from m. Where does its mirror image in m sit — and so how big is '
                + 'the angle from P round to P₁?',
            },
            {
              label: 'Add the two turns, and watch the starting position drop out',
              detail:
                'The total turn is 40° + 30° = 70°, and 70° = 2 × 35°. The 20 and the 15 have '
                + 'gone: they entered only as 2(20 + 15), and 20 + 15 is the angle between the '
                + 'mirrors precisely because P₁ lies between them. So the answer depends on the '
                + 'mirrors alone, and a different starting point would have given the same 70° '
                + 'from a different pair of half-angles — 5° and 30° instead of 20° and 15°, say. '
                + 'That is what entitles the two reflections to be called one rotation: a motion '
                + 'that varied from point to point would not be a single isometry at all. A point '
                + 'whose first image falls OUTSIDE the two mirrors needs the same two steps with '
                + 'one sign changed, the half-angles subtracting rather than adding, and the '
                + 'total comes out at 70° there too.',
              socratic:
                'You have 40° and 30°. What do they total — and which of the three numbers 20, '
                + '15 and 35 did that total actually need?',
            },
            {
              label: 'Reverse the order and compare, rather than assuming composition behaves like multiplication',
              detail:
                'Reflecting in n first and then in m runs the same argument with the mirrors '
                + 'swapped, so the turn is again 2 × 35° = 70° — but measured from n towards m, '
                + 'which is the opposite sense. The two results are a 70° rotation and a −70° '
                + 'rotation, 140° apart, so the order is not bookkeeping: P₂ genuinely lands in '
                + 'two different places. They would agree only if a turn of 2θ and a turn of −2θ '
                + 'were the same rotation, and that needs their difference 4θ to be a whole '
                + 'number of turns.',
              socratic:
                'Swap the two mirrors in the argument above and you get 70° a second time. So '
                + 'why are the two final positions not the same point?',
            },
            {
              label: 'Run the doubling backwards for the half turn, and find the one angle where order stops mattering',
              detail:
                'A half turn is 180°, and 2θ = 180° gives θ = 90°: perpendicular mirrors. That is '
                + 'also the only mirror angle strictly between 0° and 180° at which 4θ is a whole '
                + 'number of turns, since 4 × 90° = 360° and the next multiple would need θ = '
                + '180°, which is one line twice rather than two mirrors. So perpendicular '
                + 'mirrors are exactly the case where m-then-n and n-then-m agree. The two '
                + 'questions in this step have one answer and that is not a coincidence: a half '
                + 'turn is its own reverse.',
              socratic:
                'You want the composition to be a half turn. What does that make 2θ, and so what '
                + 'is θ — and what does that same angle do to the disagreement found in the step '
                + 'above?',
            },
          ],
          answer:
            'P to P₂ is a rotation about O through 70°. Both mirrors pass through O, so O is '
            + 'fixed by both and OP = OP₁ = OP₂, which is why the composition is a rotation about '
            + 'O. Each mirror bisects the angle it turns the point through: ∠POP₁ = 2 × 20° = 40° '
            + 'and ∠P₁OP₂ = 2 × 15° = 30°, totalling 70° = 2 × 35°. The half-angles 20 and 15 '
            + 'appear only as their sum, which is the angle between the mirrors, so the same 70° '
            + 'comes out for every starting point — one rotation, not a point-by-point motion. In '
            + 'the other order the turn is 70° the other way, landing 140° from the first result, '
            + 'so the order of two reflections is not interchangeable. The composition is a half '
            + 'turn when 2θ = 180°, that is when the mirrors are perpendicular — and θ = 90° is '
            + 'also the only angle strictly between 0° and 180° at which the two orders agree, '
            + 'since that needs 4θ to be a whole number of turns.',
        },
      },
      {
        id: 'a-figures-symmetries-are-counted-with-the-identity-among-them',
        conceptId: 'isometries-and-symmetry',
        statement:
          'A symmetry of a figure is an isometry that carries the figure onto ITSELF rather than '
          + 'onto a copy somewhere else. The identity — the map that moves nothing — keeps every '
          + 'distance and sends the figure to itself, so it is always one of them, and leaving it '
          + 'out is what makes a square come out as seven. Count the rotations and the '
          + 'reflections separately and add: if the smallest turn that returns the figure is r°, '
          + 'the rotations number 360/r, and the reflections are one per mirror line. A regular '
          + 'n-gon has n of each, so 2n in all, and the axes are arranged according to the parity '
          + 'of n — for even n half of them join opposite vertices and half join opposite edge '
          + 'midpoints, while for odd n a vertex has no opposite vertex and every axis runs from '
          + 'a vertex to the midpoint of the side facing it. The count falls as fast as the '
          + 'regularity: a rectangle that is not a square keeps two rotations and two axes, '
          + 'because a quarter turn and a diagonal reflection would each stand a long side where '
          + 'a short one was. A scalene triangle has exactly ONE symmetry — a mirror line would '
          + 'fix one vertex and swap the other two, forcing the two sides at that vertex equal, '
          + 'and `congruence` has already established what equal sides do in a triangle — so its '
          + 'answer is 1 and not 0.',
        position: 3,
        /*
         * No `automaticityTarget`. The arithmetic is one division and one
         * addition, and the content is which maps belong in the two lists —
         * so a speed reward would train answering 2n on sight, which gets the
         * regular polygon right and the rectangle and the scalene triangle
         * wrong. A timed point that can be passed by the wrong method is worse
         * than an untimed one, which is the argument the second point of
         * `circles` makes about the external point always being the further
         * one.
         */
        workedExample: {
          problem:
            'Count the symmetries of a regular hexagon, of a regular pentagon, of a rectangle '
            + 'that is not a square, and of a scalene triangle. For the hexagon and the pentagon '
            + 'say how the mirror lines are arranged, and say which of the four counts is the one '
            + 'that gets answered wrongly.',
          subgoals: [
            {
              label: 'Count the rotations from the smallest turn that returns the figure',
              detail:
                'The hexagon comes back to itself after 60°, and after every multiple of it: 0°, '
                + '60°, 120°, 180°, 240°, 300°. That is 360/60 = 6 rotations, and the 0° one is '
                + 'the identity, which belongs in the list because a map that moves nothing still '
                + 'carries the figure onto itself. A 360° turn is not a seventh — it is the same '
                + 'map as 0° — which is why the list stops one step short of a full turn. The '
                + 'pentagon returns after 72°, giving 360/72 = 5.',
              socratic:
                'A regular hexagon returns to itself after a 60° turn. Which turns smaller than a '
                + 'full revolution also return it — and is the do-nothing turn one of them?',
            },
            {
              label: 'Count the mirror lines, and let the parity of n decide how they are arranged',
              detail:
                'The hexagon has 3 axes through pairs of opposite vertices and 3 more through '
                + 'pairs of opposite edge midpoints: 6 in all. The pentagon cannot be split that '
                + 'way, because 5 is odd and a vertex has no opposite vertex — each of its axes '
                + 'runs from a vertex to the midpoint of the side facing it, giving 5. So both '
                + 'come out at n by arrangements that are not the same arrangement, and a learner '
                + 'who counts the hexagon\'s three vertex-to-vertex axes and stops has halved the '
                + 'answer.',
              socratic:
                'A hexagon has 3 pairs of opposite vertices. Are those all of its mirror lines — '
                + 'and what has to change in the counting when the number of sides is odd?',
            },
            {
              label: 'Add the two counts, having checked that nothing sits in both lists',
              detail:
                'Hexagon: 6 + 6 = 12. Pentagon: 5 + 5 = 10. The thing worth checking before '
                + 'adding is whether any map has been counted twice, and the identity is the '
                + 'candidate — it is in the rotation list, at 0°. It is not in the reflection '
                + 'list: a reflection moves every point that is not on its axis, so no reflection '
                + 'is the identity. The two lists are therefore disjoint and the addition is '
                + 'safe, which is where the 2n for a regular n-gon comes from.',
              socratic:
                'You have 6 rotations and 6 reflections. Before adding them, is there any single '
                + 'map that appears in both lists?',
            },
            {
              label: 'Take the regularity away and run the same count on a weaker figure',
              detail:
                'A rectangle that is not a square returns after 180° and not before, so 360/180 = '
                + '2 rotations — a quarter turn would stand the long side where the short side '
                + 'was. Its axes are the two lines through opposite edge midpoints, and the '
                + 'diagonals are NOT axes for that same reason, a diagonal reflection sending a '
                + 'long side onto a short one. So 2 + 2 = 4, against the square\'s 8: the square '
                + 'is the rectangle that owns the other four.',
              socratic:
                'Which of the square\'s eight symmetries does a 5 cm by 3 cm rectangle lose — and '
                + 'what length would each of the lost ones have had to change?',
            },
            {
              label: 'Count the figure that looks like it has none, which is the answer people get wrong',
              detail:
                'A scalene triangle has no two sides equal. A mirror line of a triangle has to fix '
                + 'one vertex and swap the other two, which makes the two sides meeting at the '
                + 'fixed vertex equal — and `congruence` established what equal sides and equal '
                + 'angles do to each other in a triangle — so a scalene triangle has no axis at '
                + 'all. The smallest turn that returns it is a full one, so 360/360 = 1 rotation. '
                + 'The count is 1 + 0 = 1, not 0: the figure has exactly one symmetry, the '
                + 'identity, and "it has no symmetry" is wrong by exactly the map that is easiest '
                + 'to forget.',
              socratic:
                'A scalene triangle has no mirror line, and no turn short of a full one returns '
                + 'it. Is its count of symmetries therefore 0 — and if not, what is left?',
            },
          ],
          answer:
            '12 for the regular hexagon, 10 for the regular pentagon, 4 for the non-square '
            + 'rectangle and 1 for the scalene triangle. The rotations are 360/r from the '
            + 'smallest returning turn r: 360/60 = 6, 360/72 = 5, 360/180 = 2 and 360/360 = 1, '
            + 'the identity being the 0° member of each list and a 360° turn not a separate map. '
            + 'The reflections are one per axis: 6 for the hexagon, three joining opposite '
            + 'vertices and three joining opposite edge midpoints because 6 is even; 5 for the '
            + 'pentagon, each from a vertex to the midpoint of the side facing it because 5 is '
            + 'odd; 2 for the rectangle, through the edge midpoints only, since a diagonal would '
            + 'send a long side onto a short one; and none at all for the scalene triangle, where '
            + 'an axis would force two sides equal. The sums are safe because no reflection is '
            + 'the identity, so the two lists never overlap — which gives 2n for a regular n-gon. '
            + 'The count worth stating slowly is the last one: 1, not 0.',
        },
      },
    ],
  },
]

/**
 * Sixteen edges: one prerequisite per promotion after the first, TWO for the
 * seventh, TWO for the ninth and TWO for the tenth, plus the one interference
 * the fourth promotion brought with it and the one `encompasses` the eleventh
 * did.
 *
 * THE TWELFTH PROMOTION ADDED ONE PREREQUISITE AND NOTHING ELSE, which makes it
 * the cheapest since the sixth and is the shape this list has held most often.
 * The note on `congruence->isometries-and-symmetry` at the bottom carries the
 * argument; the short version is that a node declaring one `needs` that points
 * at a concept of this subject strands exactly one edge and that edge is
 * internal, so `EUCLIDEAN_GEOMETRY.links` was neither added to nor relieved.
 *
 * THE ELEVENTH PROMOTION BROUGHT THE SUBJECT'S FIRST `encompasses`, which is
 * the one edge KIND this list had not held and the one whose absence no suite
 * can see.
 *
 * `distance-and-midpoint` declared `exercises: ['pythagoras']` on top of
 * needing it, and `expandEdges` turns `exercises` into an `encompasses`. Both
 * endpoints finish in this subject, so it is internal and sits below. What
 * makes it worth a heading rather than a line is that losing it was free:
 * `encompasses` gates nothing, so every assertion in both suites would have
 * stayed green while the credit path quietly vanished. The list has now held
 * three of the four kinds, and the two non-prerequisite ones arrived for
 * opposite reasons — the interference because `similarity` happened to carry a
 * `confusedWith`, this one because `pythagoras`'s own promotion note predicted
 * it and said where to look.
 *
 * It is also the first promotion here whose stranded edges split BY KIND rather
 * than only by file. The prerequisite on `pythagoras` came here, the
 * prerequisite on `cartesian-plane` went to `EUCLIDEAN_GEOMETRY.links`, and the
 * `encompasses` could have gone to neither if the concept had been filed with
 * the vectors — `links` carries `prerequisite` only. See the note on the edge
 * itself: that constraint is what decided the filing, against both the obvious
 * subject and this one's own `covers`.
 *
 * THE TENTH PROMOTION CLOSED THE FORK, which is the last thing that could
 * happen to a prerequisite graph that had not happened here yet, and it is a
 * different event from the merge the ninth recorded.
 *
 * `congruence` forked three ways — `similarity` at the fourth promotion,
 * `quadrilaterals-and-polygons` at the sixth, `geometric-proof` at the eighth —
 * and the ninth reconverged two of the three. `circles` reaches `similarity`
 * through `pythagoras` and `geometric-proof` directly, and the note on
 * `pythagoras->circles` records at length that the polygons branch is
 * deliberately NOT behind it. `circle-measure` reaches all three, because its
 * second parent `area-and-perimeter` sits on that third branch. So this is the
 * first concept of the subject with every child of `congruence` in its
 * ancestry, and the fork the sixth and eighth promotions widened is now shut
 * above it.
 *
 * Why that is a separate claim from the ninth's, rather than the same one
 * again: in-degree is two for both nodes, "its two parents are on branches that
 * genuinely parted" is true of both, and even "neither parent is an ancestor of
 * the other" is true of both. The only thing that separates them is WHICH
 * branches are underneath, so tests/concepts-logic.mjs asserts the ancestry of
 * the named three rather than any count — and asserts, against it, that
 * `circles` still does not reach the polygons, since that contrast is the whole
 * content of the distinction.
 *
 * THE NINTH PROMOTION MERGED TWO BRANCHES, which is the one thing that can
 * happen to a prerequisite graph that had not happened here yet, and it is a
 * different event from the two the list already records.
 *
 * `congruence` forked three ways and this is where two of the three come back
 * together: `circles` names `geometric-proof` and `pythagoras`, and neither of
 * those is an ancestor of the other. The seventh promotion also contributed a
 * two-parent node, so in-degree two is not new — but `area-and-perimeter`'s two
 * parents are nested, `triangle-basics` being an ancestor of
 * `quadrilaterals-and-polygons` through `congruence`, so that node joined a
 * line to a point lower down the same line. This one joins two lines that had
 * genuinely parted, which is why the subject's shape is now a DAG rather than a
 * tree with a shortcut in it, and why tests/concepts-logic.mjs asserts the
 * ancestry relation between the two parents rather than counting them.
 *
 * It added no branch point either. `geometric-proof` and `pythagoras` each went
 * from no children to one, so `congruence` and `triangle-basics` are still the
 * only forks. Three claims that this list has now separated: the tree grew (the
 * sixth), the tree branched (the sixth and seventh), two branches merged (this
 * one). A count of edges reports all three identically.
 *
 * THE EIGHTH PROMOTION PUT A THIRD CHILD ON `congruence` AND ADDED NO BRANCH
 * POINT, which is the one shape this list had not yet shown. The sixth made
 * `congruence` a branch point and the seventh made `triangle-basics` a second
 * one; this promotion widens a fork that already existed rather than opening a
 * new one, so the number of branch points is unchanged at two while the subject
 * gets its first node of out-degree three. Worth separating because "the tree
 * grew" and "the tree branched" are different claims and the second has
 * stopped being true of every promotion. The note on
 * `congruence->geometric-proof` at the bottom carries the argument.
 *
 * THE SIXTH PROMOTION MADE THIS A TREE RATHER THAN A LINE, which is the one
 * structural thing about the list that has changed since it was written, and
 * the note on `congruence->quadrilaterals-and-polygons` at the bottom carries
 * the argument. Everything below it describes a list of five that was a chain
 * of four plus an interference, and all of that is still true of those five.
 *
 * THE SEVENTH ADDED A SECOND BRANCH POINT AND THE FIRST PAIR. One promotion
 * has never contributed two edges here before: every node promoted so far
 * either declared one `needs` or declared two with one of them unable to
 * follow. `area-and-perimeter` declared two and both were already concepts of
 * this subject, so both came. One of them forks off `triangle-basics`, which
 * had been a leaf of the line since the second promotion, so the tree now has
 * two branch points rather than one. The notes on the last two entries carry
 * the argument.
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
  {
    id: 'quadrilaterals-and-polygons->area-and-perimeter',
    from: 'quadrilaterals-and-polygons',
    to: 'area-and-perimeter',
    kind: 'prerequisite',
    /*
     * THE FIRST PROMOTION HERE WHOSE WHOLE `needs` LIST CAME HOME, which is a
     * third shape for the edge rule rather than a repeat of either known one.
     *
     * The cheap case so far has meant a node with ONE `needs`, pointing at a
     * concept of this subject — the triangles, `congruence`, the polygons. The
     * expensive case has meant a node with TWO, one of which could not follow
     * and went to `EUCLIDEAN_GEOMETRY.links` — `similarity` and `pythagoras`.
     * This node declared two, `['quadrilaterals-and-polygons',
     * 'triangle-basics']`, and BOTH of them were already concepts here, so
     * both edges are internal the moment they are stranded and both are
     * declared below. The area's `links` needed no entry and gave none up: it
     * still holds exactly the four it had.
     *
     * So the expense of a promotion is not the SIZE of its `needs` list. It is
     * how many of the endpoints live outside the ontology the node is joining,
     * which is what the two-for-two case makes visible and the one-for-one
     * cases could not.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the six above it:
     * `expandEdges` stamped the area on it while it was the node's `needs`,
     * and the provenance moved with the edge.
     *
     * The claim is load-bearing rather than ordering. The first knowledge
     * point computes the area of a rectangle with a rectangular piece removed,
     * and the polygons point is where a figure that is not a triangle is first
     * taken apart into pieces whose parts correspond; the third point then
     * compares two regions that are neither triangles nor rectangles. Without
     * the polygons there is no object for additivity to be applied to beyond
     * the rectangle itself.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'triangle-basics->area-and-perimeter',
    from: 'triangle-basics',
    to: 'area-and-perimeter',
    kind: 'prerequisite',
    /*
     * The second half of the same promotion, and the SECOND FORK in the
     * subject — this one off `triangle-basics`, where the sixth promotion's
     * was off `congruence`. So the edge list is a tree with two branch points
     * now, and tests/concepts-logic.mjs asserts each fork against the node
     * that carries it rather than asserting one ordered string: an edge
     * accidentally hung off `congruence` instead of the triangles would pass a
     * list comparison written after the fact while changing what gates what.
     *
     * This is also the first edge here that points INTO a node two promotions
     * after it was first described. atlas-foundations.ts recorded, at the
     * second promotion, that `area-and-perimeter` was one of three nodes whose
     * gate the triangles had just tightened; it is the same claim, now written
     * from the other side because both of its endpoints are concepts.
     *
     * The claim is load-bearing. The second knowledge point is a triangle's
     * area, and the argument that rules out a side offered as a height is the
     * triangle inequality from `the-inequality-compares-two-routes` — the
     * perpendicular from a vertex is the shortest route to the base's line, so
     * a height cannot exceed a side reaching the base. That subgoal cannot be
     * written without the inequality, and it is the one part of the concept
     * that refuses a wrong answer before computing it.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'congruence->geometric-proof',
    from: 'congruence',
    to: 'geometric-proof',
    kind: 'prerequisite',
    /*
     * THE THIRD CHILD OF `congruence`, AND THE FIRST EDGE HERE THAT WIDENS A
     * FORK INSTEAD OF MAKING ONE.
     *
     * `congruence` already carried `similarity` from the fourth promotion and
     * `quadrilaterals-and-polygons` from the sixth. This is the third, so the
     * node has out-degree three and the subject still has exactly two branch
     * points. tests/concepts-logic.mjs asserts the children of `congruence` as a
     * named set for that reason: a count would have moved from two to three
     * either way, and what is worth holding is WHICH three, since an edge
     * accidentally hung off `pythagoras` or the polygons would pass an
     * out-degree check while changing what gates what.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the seven above it:
     * `expandEdges` stamped the area on it while it was the node's `needs`, and
     * the provenance moved with the edge.
     *
     * THE CHEAP CASE, for the fifth time, and the node made it cheap by
     * declaring exactly one `needs` that was already a concept here. So the
     * area's `links` needed no entry and gave none up: `EUCLIDEAN_GEOMETRY`
     * still holds exactly the four cross-file edges it had. Nothing about this
     * promotion was expensive, which is worth recording next to the fact that it
     * was the one every previous author passed over — the cost that stopped them
     * was never structural.
     *
     * The claim is load-bearing rather than ordering, and it is load-bearing in
     * all three knowledge points, which no previous edge in this subject can
     * say. The first point's chain cites the base-angle theorem by name, and
     * that theorem is `congruence`'s third point — matching a triangle with
     * itself. The second point's true implication is "congruent triangles have
     * equal perimeters", which is read straight off the six equalities a
     * congruence asserts, and its refutation of the converse compares two side
     * triples as a congruence would. Only the third point could be written
     * without `congruence`, and it is a claim about proof rather than about
     * figures. Remove the prerequisite and two of the three worked examples
     * stop being finishable.
     *
     * THE EDGES POINTING INTO THE NODE ARE THE WIDEST FAN-OUT ANY PROMOTION
     * HERE HAS LEFT BEHIND, and none of them needed attention: an edge is owned
     * by the node that DECLARES it. `circles` and `non-euclidean-geometry` name
     * `geometric-proof` in their own `needs` and are still in
     * `euclidean-geometry`; two more name it from other atlas files entirely,
     * one in the analysis areas and one in the structures. All four stayed, so
     * all four still own their edge and `composeAtlas` resolves them across the
     * file boundary. The only one whose GATE changes is `circles`, which had
     * `pythagoras` gating it since the fifth promotion and was still having the
     * walk look straight through this half of its pair.
     *
     * WHAT THIS PROMOTION COST THE AREA that the six before it did not:
     * `circles` becomes a root of `euclidean-geometry` viewed alone. It is the
     * node that the fifth promotion's note is built around — it did NOT become a
     * root when `pythagoras` left, because `geometric-proof` was still here to
     * gate it from inside — and this is the other half of that rule arriving.
     * atlas-foundations.ts carries it; the consequence for this file is only
     * that the subject it feeds has stopped being blocked above `pythagoras`.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'geometric-proof->circles',
    from: 'geometric-proof',
    to: 'circles',
    kind: 'prerequisite',
    /*
     * THE FIRST OF A PAIR, AND THE PAIR IS WHAT MAKES THIS PROMOTION NEW: it
     * is the first node here whose two parents are on DIFFERENT branches.
     *
     * The seventh promotion also brought two edges, so "two at once" is not
     * the novelty — `area-and-perimeter` named `quadrilaterals-and-polygons`
     * and `triangle-basics`, and both were already concepts here. But those
     * two are NESTED: `triangle-basics` is an ancestor of
     * `quadrilaterals-and-polygons` through `congruence`, so that join tied a
     * node to one line and to a point further down the same line. This one
     * joins two lines that genuinely parted. `geometric-proof` hangs off
     * `congruence` directly; `pythagoras` hangs off `similarity`, which hangs
     * off `congruence`; neither is an ancestor of the other. So the subject
     * forked at `congruence` and this is the first node where two of its
     * branches come back together.
     *
     * That distinction is asserted in tests/concepts-logic.mjs rather than
     * described, because both joins look identical to an in-degree check and
     * only one of them is a reconvergence. It also means the subject has
     * stopped being readable as a tree with one shortcut — the right word for
     * its shape now is a DAG, and the teaching order through it is not
     * recoverable from any single path.
     *
     * The branch points did not move, which is the other half worth stating.
     * `geometric-proof` and `pythagoras` each went from no children to one, so
     * neither became a fork; `congruence` and `triangle-basics` are still the
     * only two nodes of out-degree above one. "The tree grew", "the tree
     * branched" and "two branches merged" are three different claims, and this
     * promotion is the third with neither of the first two.
     *
     * The claim is load-bearing in two of the three knowledge points and in a
     * way the other prerequisite cannot cover. The third point's whole subject
     * is a converse and a contrapositive of one proved implication, which is
     * `geometric-proof`'s second knowledge point used rather than restated —
     * the distinction is cited by name and not re-derived. And the first
     * point's closing move is that an answer which does not use part of its
     * given is reporting an invariance, which is the "say which given each
     * step consumed" discipline from that concept's first point. Remove this
     * edge and the third worked example has to re-teach what a converse is
     * before it can refuse one.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the eight above
     * it: `expandEdges` stamped the area on this edge while it was the node's
     * `needs`, and the provenance moved with the edge.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'pythagoras->circles',
    from: 'pythagoras',
    to: 'circles',
    kind: 'prerequisite',
    /*
     * THE SECOND OF THE PAIR, AND THE CHEAP CASE FOR THE SECOND TIME WITH TWO
     * `needs` — zero endpoints outside this subject, out of two.
     *
     * The seventh promotion settled that the expense of a promotion is not the
     * SIZE of the departing node's `needs` list but how many of its endpoints
     * live outside the ontology the node is joining. This is the second node to
     * score zero out of two, so that reading now has two instances rather than
     * one, and `EUCLIDEAN_GEOMETRY.links` needed no entry and gave none up: it
     * still holds exactly the four cross-file edges it had.
     *
     * The claim is the most concretely load-bearing edge in the subject. The
     * second knowledge point is Pythagoras applied with its slot assignment
     * already decided by a fact about circles, and it cites that concept's
     * first point — the hypotenuse is not one of three equals — by its own
     * argument rather than by name: the right angle is at the point of contact,
     * so the centre-to-point distance is opposite it and the tangent is a leg,
     * so the move is a subtraction. Its third subgoal then lands on an
     * irrational length and leaves it as a reduced surd, which is that
     * concept's second point. Two of Pythagoras's three knowledge points are
     * used in one worked example here, and neither is restated.
     *
     * Worth recording what this edge does NOT license, since the file's habit
     * is to name what a promotion left alone. The third knowledge point uses
     * the fact that a quadrilateral's angles total 360°, which is
     * `quadrilaterals-and-polygons`' material — and that concept is NOT an
     * ancestor of this one. It forks off `congruence` on a third branch, so
     * nothing in the gating walk puts it behind this concept. No edge was
     * invented to make it one: adding a prerequisite changes what gates what
     * for every learner, and doing it as a side effect of writing a worked
     * example is the thing this file records itself refusing to do for
     * `integer-arithmetic`. The example derives the 360° in line instead, from
     * one diagonal and the triangle angle sum — and `triangle-basics` IS an
     * ancestor, through `congruence` and `geometric-proof` — so the fact is
     * reached from inside the gate rather than borrowed from beside it.
     *
     * `author:` for the same reason as every edge above it.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'circles->circle-measure',
    from: 'circles',
    to: 'circle-measure',
    kind: 'prerequisite',
    /*
     * THE FIRST OF THE TENTH PROMOTION'S PAIR, AND IT CLOSES THE FORK
     * `congruence` OPENED — which is the one structural event this subject had
     * not yet produced.
     *
     * The ninth promotion merged two branches and said so, so a reconvergence
     * is not the novelty. What is new is WHICH branches. `congruence` has three
     * children here — `similarity` from the fourth promotion,
     * `quadrilaterals-and-polygons` from the sixth, `geometric-proof` from the
     * eighth — and `circles` reconverged only two of them: it reaches
     * `similarity` through `pythagoras` and `geometric-proof` directly, and the
     * polygons branch was explicitly NOT behind it, which the edge above
     * records at length. This node reaches all three, because its other parent
     * `area-and-perimeter` sits on the polygons branch. So `circle-measure` is
     * the first concept of the subject with every child of `congruence` in its
     * ancestry, and the three-way fork is fully closed above it.
     *
     * That is asserted in tests/concepts-logic.mjs as an ancestry claim over
     * the named three, not as an in-degree or a count. In-degree is 2 here and
     * was 2 at the ninth; "its parents are on separate branches" was already
     * true at the ninth. The only thing that separates the two events is which
     * branches are underneath, so that is what the assertion names.
     *
     * No branch point was added, for the third promotion running. `circles` and
     * `area-and-perimeter` each went from no children to one, so neither became
     * a fork, and `congruence` and `triangle-basics` are still the only nodes
     * of out-degree above one.
     *
     * What that leaves is worth one line, because it is the tidiest the
     * subject's shape has ever been and will not survive the next promotion.
     * Both parents were LEAVES until now — nothing rested on either — and this
     * is the first promotion here to take two nodes out of the leaf set at once.
     * The subject is now a DAG with exactly one source and exactly one sink:
     * every path starts at `points-lines-angles` and every path ends here. That
     * is a fact about a syllabus authored upward from one root with no node yet
     * written above two different tops, not a property worth preserving, so it
     * is recorded rather than asserted — a test holding "one sink" would go red
     * for the eleventh promotion whichever node that turns out to be.
     *
     * The claim is load-bearing in two of the three knowledge points and in a
     * way `area-and-perimeter` cannot cover. The first point's whole argument is
     * that C/d does not depend on the circle, and it needs a circle to be an
     * object with a centre, a radius and a diameter standing in fixed relation —
     * which is `circles`' subject matter rather than a measurement fact. The
     * second point cuts a sector with a CENTRAL angle and treats the arc it
     * subtends as a part of the boundary picked out by that angle; the
     * vocabulary of central angles, arcs and the two-arcs-per-chord split is
     * `circles`' first knowledge point exactly, used rather than restated. Take
     * this edge away and the second worked example has to define a central angle
     * before it can take a fraction of a turn.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the eleven above
     * it: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moved with the edge.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'area-and-perimeter->circle-measure',
    from: 'area-and-perimeter',
    to: 'circle-measure',
    kind: 'prerequisite',
    /*
     * THE SECOND OF THE PAIR, AND THE CHEAP CASE FOR THE THIRD TIME WITH TWO
     * `needs` — zero endpoints outside this subject, out of two.
     *
     * The seventh promotion settled that expense is not the SIZE of the
     * departing node's `needs` list but how many endpoints live outside the
     * ontology it is joining, and the ninth produced the second instance of
     * zero-out-of-two. This is the third, so the reading is now as well
     * evidenced as the rule it replaced: `EUCLIDEAN_GEOMETRY.links` needed no
     * entry and gave none up, and still holds exactly the four cross-file edges
     * it had.
     *
     * It also hands nothing back, which is the check this promotion had to make
     * and pass rather than assume. A `links` entry whose two ends BOTH finish
     * inside one ontology has become an ordinary `needs` and must be deleted, or
     * `composeAtlas` emits the edge twice and no test notices. None of the four
     * entries names this node or either of its parents — they run
     * `ratio-and-rate->similarity`, `roots-and-irrationals->pythagoras` and two
     * into `cartesian-plane` — so there was nothing to collapse. Recorded
     * because the absence of a deletion and the failure to look are
     * indistinguishable afterwards.
     *
     * The node stranded no `confusedWith`, and that is the stranding worth
     * naming precisely because nothing would have gone red if it had. The map
     * node declared none, so there was no `interferes_with` for `expandEdges` to
     * lose — unlike `similarity`, whose stranded interference is the one edge in
     * this subject that gates nothing and whose loss would have shown up as no
     * failure at all. Checked before the node was deleted rather than inferred
     * from the suites staying green.
     *
     * The claim is load-bearing in two of the three knowledge points, and it is
     * the only prerequisite that can carry them. The second point takes a
     * fraction of the circle's AREA to get a sector, which presupposes that an
     * area is a measure with a whole to take a share of — and the whole content
     * of the third point is a comparison with what `area-and-perimeter`
     * established: that neither measure determines the other. That concept
     * proved it false for rectangles; this one shows a circle escaping it on a
     * parameter count, and the fourth subgoal cites the equal-perimeter pair
     * from that concept's third point by its argument. Remove this edge and the
     * third worked example is contradicting a concept the learner has not been
     * shown.
     *
     * `author:` for the same reason as every edge above it.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'pythagoras->distance-and-midpoint',
    from: 'pythagoras',
    to: 'distance-and-midpoint',
    kind: 'prerequisite',
    /*
     * THE ELEVENTH PROMOTION'S PREREQUISITE, AND THE EXPENSIVE CASE WITH ONE
     * ENDPOINT OUT OF TWO — the shape the fourth and fifth promotions had, back
     * after five cheap ones.
     *
     * `distance-and-midpoint` declared `['cartesian-plane', 'pythagoras']`.
     * `pythagoras` is a concept of this subject, so that edge is internal and
     * is this entry. `cartesian-plane` is authored in
     * `vectors-and-independence`, and an ontology may only name concepts it
     * CONTAINS, so that one went to `EUCLIDEAN_GEOMETRY.links` — the eighth
     * entry there.
     *
     * The claim is load-bearing in all three knowledge points, which is unusual
     * enough to be worth stating: the first point IS Pythagoras, with the legs
     * read off the coordinates instead of handed over, and it cites that
     * concept's slot assignment and its positive-root-only rule by name. The
     * second measures two halves of a segment with the first point's formula.
     * The third subtracts a negative for the third time in the concept. Take
     * this edge away and the first worked example has to prove a² + b² = c²
     * before it can use it.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the thirteen above
     * it: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moved with the edge.
     */
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'distance-and-midpoint=>pythagoras',
    from: 'distance-and-midpoint',
    to: 'pythagoras',
    kind: 'encompasses',
    /*
     * THE SUBJECT'S FIRST `encompasses` EDGE, AND THE ONLY STRANDING THAT WOULD
     * HAVE COST NOTHING TO LOSE.
     *
     * The map node declared `exercises: ['pythagoras']` as well as needing it,
     * and `expandEdges` turns `exercises` into an `encompasses` — the edge that
     * makes credit computable, so that practising the coordinate distance
     * formula counts as practising the relation underneath it and that relation
     * does not come due as though untouched. Deleting the node deletes the
     * edge, and NOTHING would have gone red: `encompasses` gates nothing, so a
     * missing one shows up only as a learner re-drilling what they last
     * demonstrated. The header of `pythagoras`'s own promotion wrote this down
     * in advance — it called the edge "half-live", with "the remaining half the
     * other endpoint's promotion" — which is the only reason it was looked for
     * rather than lost.
     *
     * IT ALSO DECIDED WHICH SUBJECT THIS CONCEPT JOINED, and that is the
     * structural fact worth carrying. `vectors-and-independence` was the
     * obvious home: `cartesian-plane` is there, so is the dot product, and the
     * covers of this subject says "congruence as far as it goes without a
     * drawing", which is not coordinates. But an area's `links` carries
     * `prerequisite` edges ONLY — the kind is hard-coded in `expandEdges` — so
     * an `encompasses` whose two endpoints end up in different files is
     * expressible NOWHERE. Filing the concept with the vectors would have
     * forced this edge to be dropped. Filing it here keeps both of its
     * endpoints in one ontology and spends a `links` entry on the prerequisite
     * instead, which `links` can carry. The same trade decided
     * `gaussian-elimination`'s filing in ontology-algebra.ts, for the same
     * reason and in the opposite direction.
     *
     * The claim itself is as strong as an `encompasses` gets here. The first
     * knowledge point is not an application of Pythagoras, it is Pythagoras: a
     * learner who gets d² = 25 + 144 right has performed the adding direction
     * of the relation and assigned its three slots, which is that concept's
     * first and second points exactly.
     */
    rationale:
      'The distance formula IS Pythagoras with the legs read off the coordinates, so a learner '
      + 'who computes one has performed the other — the adding direction of the relation and '
      + 'the slot assignment in front of it both. Carried over from the map node\'s '
      + '`exercises`, which is the only stranding a promotion can lose without any test going '
      + 'red.',
    promotedBy: 'author:plane-geometry',
  },
  {
    id: 'congruence->isometries-and-symmetry',
    from: 'congruence',
    to: 'isometries-and-symmetry',
    kind: 'prerequisite',
    /*
     * THE FOURTH CHILD OF `congruence`, AND THE CHEAPEST PROMOTION THIS SUBJECT
     * HAS HAD SINCE THE SIXTH.
     *
     * The node declared `needs: ['congruence']` and nothing else, so this one
     * edge is the whole of what the twelfth promotion stranded, and both of its
     * endpoints were already concepts here — so it is internal to the ontology
     * and `EUCLIDEAN_GEOMETRY.links` needed no entry and gave none up. That is
     * the one-for-one cheap case, which the seventh promotion's note says is
     * about where each `needs` POINTS rather than how many there are.
     *
     * `author:` rather than `atlas:euclidean-geometry`, like the fourteen above
     * it: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moved with the edge.
     *
     * The claim is load-bearing rather than ordering, and more plainly so than
     * any edge above it. The first knowledge point does not merely use
     * `congruence`, it is ABOUT it: SSS is what turns the single
     * distance-preserving hypothesis into all six of a congruence's equalities,
     * and the worked example's last move is to count the assumptions and
     * conclude that a congruence is the trace of one map. The third point then
     * uses the base-angle fact from that concept's third point to rule out a
     * mirror line in a scalene triangle. Take the edge away and the first
     * example has no criterion to appeal to and the third has no reason for its
     * answer of 1.
     *
     * It is the FOURTH edge out of `congruence` and adds no branch point, which
     * is the eighth promotion's shape rather than the sixth's: `congruence` was
     * already a fork of out-degree three, so this widens a fork instead of
     * opening one and the subject still has exactly two branch points. Worth
     * separating for the reason the header gives — "the tree grew" and "the tree
     * branched" are different claims, and only the first is true here.
     *
     * `confusedWith` and `exercises` on the departing node: NEITHER, checked
     * before it was deleted. The `confusedWith` absence is the one that had to
     * be looked for: `expandEdges` turns one into an `interferes_with`, which
     * gates nothing, so losing one leaves every suite green while freeing the
     * scheduler to introduce the two most confusable concepts in the subject
     * together. There was a real candidate for one here — `plane-transformations`
     * is the same three maps written in coordinates and is still a node — so the
     * absence is worth recording rather than assumed. Adding one would be a
     * claim about learner confusion made up during an authoring pass, which is
     * what the scope comments forbid for patterns and the same argument covers.
     */
    promotedBy: 'author:plane-geometry',
  },
]

export const PLANE_GEOMETRY: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
