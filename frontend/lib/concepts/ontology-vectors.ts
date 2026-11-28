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
 *
 * ── AND THE COUNT ARRIVED EIGHTH, OUT OF THE SAME AREA ───────────────────
 *
 * `basis-and-dimension` was a node of `linear-algebra` and is the last concept
 * below. The twentieth promotion's note two paragraphs up says what it
 * deliberately left for this one — "WHAT IT DELIBERATELY DOES NOT DO is name a
 * dimension. Counting independent directions is `basis-and-dimension`, the node
 * directly above it" — so this was a recorded recommendation rather than an
 * open question, and tasks.ts says the same thing beside
 * `function-pointwise-sum-1`. The work was to check the premise rather than to
 * re-argue the filing.
 *
 * WHAT SELECTED IT, since none of the usual selectors did. Every one of the ten
 * journeys reads zero unwritten, so no route needed it; the smallest area on
 * the map is nine nodes against a stub floor of five, so nothing was near the
 * floor; and about nineteen nodes have every prerequisite written. What was
 * left was RULABILITY, and that is what decided it against
 * `inner-product-spaces`, which is tied with it on dependents (three each) and
 * on edge cost (both of its `needs` land in this ontology too). A dimension is
 * a count, a coordinate is an exact quotient, and an independence test is a
 * product of integers; the inner-product concept's content is length and angle
 * in a general space, which is square roots and an inverse cosine — the two
 * things this subject has refused to put in front of a learner since the dot
 * product.
 *
 * WHY HERE, beyond the recommendation: both of its `needs` are concepts of this
 * file, and the content argument runs the same way. `linear-independence` ends
 * by saying that "how many independent vectors" is the useful count rather than
 * "how many vectors", and this is the concept that performs that count. The
 * subject-creating test the three new-ontology promotions used does not pass
 * either: nothing in this file's boundary sentences excluded a dimension, and
 * the one sentence that mentioned it said the opposite — `covers` ended by
 * naming the count as "the first thing the map asks after this", which is a
 * forward reference and not a boundary. That sentence is now spent and the
 * `covers` has been rewritten to say what the count IS.
 *
 * THE THREE POINTS, AND WHAT IS NOT AMONG THEM. A basis and the uniqueness of
 * the address it gives; the theorem that every basis of one space has the same
 * size; and the dimension as a count of directions rather than of entries.
 * CHANGE OF BASIS IS NOT HERE, and it is named in the node's `terms`, so the
 * shortfall is stated rather than left to be found — the way ontology-solids.ts
 * stated its own. Converting an address in one basis into an address in another
 * is a matrix acting on a coordinate vector, which is `matrices-and-maps` in a
 * different subject, and the honest version of it here would be a second
 * elimination with no new idea in it. The scope pattern still names the article,
 * because the pattern is about what an offering may be ABOUT and this concept
 * is where a reader arrives from.
 *
 * THE SAME-SIZE THEOREM IS DEMONSTRATED AND NOT PROVED, which is the other
 * honest limit. The second point squeezes the plane's count from both sides —
 * three vectors are always dependent, one never spans — and says in its last
 * subgoal that the general theorem is the same squeeze in any space. The
 * exchange lemma that makes that a proof is not written, and a worked example
 * claiming it would be a worked example that does not work.
 *
 * ── AND THE NINTH, WHICH OVERTURNS THE REFUSAL WRITTEN DIRECTLY ABOVE ─────
 *
 * `inner-product-spaces` was a node of `linear-algebra` and is the last concept
 * below. The paragraph above it is the twenty-second promotion's own account of
 * why it took the dimension INSTEAD of this one, and it is left standing
 * because the comparison it made was fair and the sentence that decided it was
 * not:
 *
 *   the inner-product concept's content is length and angle in a general
 *   space, which is square roots and an inverse cosine — the two things this
 *   subject has refused to put in front of a learner since the dot product.
 *
 * WHICH HALF OF THAT EXPIRED. The refusal names the SHAPE of an answer — a
 * root, an inverse cosine — and tests/atlas.mjs records four refusals of
 * exactly that form that all turned out to be overturnable, against one
 * (`linear-inequalities`) that names a MOVE and still binds. A shape can be
 * swapped for a deciding number; a move cannot. And the swap here is not a
 * dodge, because length and angle are what an inner product YIELDS and not
 * what it IS. What it is, is a rule with three properties, and the three
 * questions that follow from the properties alone are all integer arithmetic:
 * what number does a chosen rule return, which pairs does it send to zero, and
 * what coefficient splits one vector along another. Not one task below takes a
 * root, which is the same contract `vector-spaces` and `basis-and-dimension`
 * each hold and is asserted per promotion rather than assumed.
 *
 * WHAT IS CARRIED RATHER THAN OVERTURNED is the angle, and that matters more
 * than the overturn does. Nothing here asks for one, nothing here converts a
 * quotient into degrees, and the third point's last subgoal says so by pointing
 * at `24/25` — the projection coefficient comes out `13/7` under the weighted
 * rule and `13/7` IS the answer, exactly as the cosine's quotient was. So the
 * boundary sentence in `covers` is unchanged; it was never the inner product
 * that pushed against it.
 *
 * WHY HERE. Both of its `needs` — `vector-spaces` and `dot-product-geometry` —
 * are concepts of this file, so both stranded edges are ordinary `EDGES`
 * entries and no area `links` entry is owed, which is the cheapest shape a
 * promotion has and is the same shape the two before it had. The content
 * argument runs the same way: the cosine point already SPLIT b into a multiple
 * of a plus something perpendicular, used that split to derive the identity,
 * and never computed one. This is the concept that computes it. The
 * subject-creating test does not pass either — nothing in this file's boundary
 * sentences excludes a general inner product, and the one sentence that came
 * close was the refusal above, which is prose rather than a boundary.
 *
 * THE THREE POINTS, AND WHAT IS NOT AMONG THEM. The three properties and a
 * weighted rule that satisfies them; orthogonality as a fact about a pair AND a
 * rule; and the projection with its orthogonal remainder, which is
 * Gram–Schmidt on two vectors. GRAM–SCHMIDT IN GENERAL IS NOT HERE, and it is
 * named in the node's `terms`, so the shortfall is stated rather than left to
 * be found. The third vector needs two projections subtracted and introduces no
 * new idea; the induction that turns the two-vector step into an algorithm is
 * where a basis of three starts mattering, and that is a change of basis and a
 * matrix. NOR IS THE NORM, for the reason the overturn above gives: `⟨u, u⟩` is
 * here and is where positivity gets used, and `√⟨u, u⟩` is the quantity whose
 * shape the subject has declined since the dot product.
 *
 * ── AND THE TENTH, WHICH IS WHAT A MAP DOES TO A SPACE ───────────────────
 *
 * `rank-nullity` was a node of `linear-algebra` and is the last concept below.
 * It is the thirtieth promotion and the fifth out of that one area, which is
 * the number that decides how this file is read next: the area is at six nodes
 * against a stub floor of five, so it has one departure of room left and
 * `eigenvalues` is the one candidate there with every prerequisite written.
 * Spending it lands the area on the floor, and what atlas-foundations.ts says
 * to do then is MERGE the remnant into a neighbouring area rather than lower
 * the threshold — a decision about the learner-facing map and not one to take
 * while authoring.
 *
 * WHAT SELECTED IT. No route asked: every one of the ten journeys has read zero
 * unwritten since the fourteenth promotion, so route demand ranks nothing and
 * the three factors that remain are rulability, where the `needs` point, and
 * dependents. It has FOUR dependents — `diagonalisation`, `least-squares`,
 * `homology`, `multiple-regression`, in three different areas — which is the
 * most of any candidate that is rulable at all. `graphs-of-functions` has five
 * and was passed over again: its content is a judgement about a drawing,
 * `visualRef` must be omitted when no figure exists, so there is no graph to
 * show.
 *
 * THE RULABILITY WAS THE QUESTION AND IT IS NOT THE OBVIOUS ANSWER. "What is
 * the rank of A" has a number for an answer, so the concept reads cheap — but
 * the engine has no matrix type, `parseExpression` knowing numbers, symbols and
 * five operators, so no task can be handed a grid and asked to reduce it. What
 * made it writable is the same move ontology-matrices.ts made for the
 * determinant and this file made for the dimension: ask for the number that
 * DECIDES the count rather than for the count. A cross product puts a second
 * direction in the image, a triple product refuses a third, a row's dot product
 * with a candidate accepts or rejects it as a kernel vector, and the theorem
 * itself is a subtraction. Not one task takes a root and not one asks for an
 * angle, which are this subject's two standing boundaries.
 *
 * WHY HERE, which was the one real choice. `matrices-and-determinants` is the
 * other candidate and the `is` line argues for it — "what a map hits and what
 * it kills" is a map, and that subject's `covers` ends on "when a map can be
 * undone", of which a zero nullity is the sharp version. It lost on both tests
 * this file uses. The CONTENT test: a rank and a nullity are DIMENSIONS, and
 * the concept directly beneath this one ends by saying a dimension "counts
 * directions and not entries" — this is that count performed on the columns of
 * a matrix and on the vectors it kills, so the subject that made the counting
 * argument is the one the application belongs to. The IDIOM test is the sharper
 * one: that subject's `covers` declares "entries are the unit of work
 * throughout — the engine has no matrix type, so every question asks for one
 * number", and not one question here is about an entry. They are cross
 * products, dot products and counts, which is this file's arithmetic verbatim.
 * Filing it there would have shipped a matrix concept whose material never asks
 * for a matrix entry, which is the mirror of the reason `gaussian-elimination`
 * went to the equations subject rather than staying with the matrices.
 *
 * THE THREE POINTS, AND WHAT IS NOT AMONG THEM. The image as the span of the
 * columns with the rank as its dimension; the kernel with the nullity as its
 * dimension, and a kernel vector read as a dependence among the columns; and
 * the two counts adding to the number of COLUMNS, spent in the direction that
 * saves an elimination. THE THEOREM IS DEMONSTRATED AND NOT PROVED, which is
 * the same honest limit `basis-and-dimension` recorded for the same-size
 * theorem. The second subgoal of the third point gives the argument in full for
 * a matrix whose elimination has been performed — each column takes exactly one
 * label, pivot or free, so the two counts partition the columns — and what is
 * missing from it is that a basis of the image really is the pivot columns,
 * which wants the exchange lemma that file also declined to write. A worked
 * example claiming the general proof would be a worked example that does not
 * work.
 *
 * NOR IS THE ROW RANK, and the node's `terms` names neither it nor the
 * transpose, so this is a shortfall of the concept rather than of the pattern.
 * That row rank equals column rank is the surprising half of the subject and
 * its proof is a second elimination on the transpose; the first point says
 * plainly that the rows say what is KILLED and the columns say what is REACHED,
 * which is the distinction a learner needs before the two counts coinciding is
 * interesting rather than confusing.
 *
 * ── AND THE ELEVENTH, WHICH IS WHAT TO DO WHEN THERE IS NO ANSWER ────────
 *
 * `least-squares` was a node of `linear-algebra` and is the last concept below.
 * It is the forty-first promotion and the SIXTH out of that one area, which is
 * more than any other area has given up.
 *
 * ── THE READY FIELD, MEASURED RATHER THAN QUOTED ─────────────────────────
 *
 * Recomputed from the tree before anything was written, because the brief that
 * ships with this task carries a 2026-11-15 snapshot that is wrong in every
 * figure. 214 map nodes, 85 authored concepts, 19 areas, 15 subjects.
 * FOURTEEN NODES WERE READY — every `needs` already teachable — where the
 * fortieth promotion found fifteen, and the change is exactly the one node it
 * wrote. Nothing became newly ready: `euclidean-algorithm`'s only unwritten
 * dependent is `modular-arithmetic`, which also names `relations`, and that is
 * refused.
 *
 * NONE OF THE FOURTEEN IS FLOOR-BLOCKED, for the second promotion running. The
 * floor counts an area's DEPARTURES as covered territory (`MapArea.departed`,
 * atlas.ts), so headroom is not a reason any promotion is blocked and the
 * tally this header carried for five runs stays retired.
 *
 * SEVEN OF THE FOURTEEN ARE UNDER REFUSALS THAT STILL BIND, and the list is
 * unchanged from the fortieth promotion's header, which is where each one's
 * argument lives: `graphs-of-functions` is a judgement about a drawing,
 * `constructions` is a procedure with a straightedge, `non-euclidean-geometry`
 * is a choice of axioms, `supremum-and-completeness` is a claim about a set
 * whose bound is not attained, `linear-inequalities` names a MOVE rather than a
 * shape, `complex-numbers` has no case in `exactValue`, and `relations` is a
 * SET OF PAIRS whose three defining properties are judgements the engine
 * cannot grade. That leaves SEVEN unrefused, one fewer than last time because
 * this is one of them.
 *
 * THE SECOND FACTOR DECIDED IT AGAIN, AND THE FORTIETH PROMOTION'S HEADER HAD
 * ALREADY SAID SO. Of the seven unrefused, only two have every `needs` inside
 * ONE authored subject — this node and `dual-spaces`, both of them
 * `vectors-and-independence` — so only those two cost zero `links` entries and
 * no new subject. The other five each name concepts in two or three subjects:
 * `counting-principles` and `sample-spaces` are still blocked from the cheap
 * filing by `sets-and-membership` having written "it does not claim COUNTING as
 * a subject" into its own file, and `eigenvalues`, `word-problems` and
 * `nonlinear-systems` each reach across two or three. The third factor then
 * separates the two survivors and not narrowly: two dependents to zero.
 *
 * THAT IS THE SAME ANSWER THE PREVIOUS PROMOTION PREDICTED, WHICH IS WORTH
 * ONE LINE OF SUSPICION RATHER THAN NONE. Its header named this node "the one
 * candidate that beats this on the third factor and ties on the second", and a
 * prediction made by the pass that would fulfil it proves nothing — the
 * paragraph above `real-number-line` in ontology-arithmetic.ts records exactly
 * that trap. So the field was recomputed from the tree first and the ranking
 * re-run from the three factors; the agreement is evidence the rule is stable
 * across runs, not an argument for the pick.
 *
 * RULABILITY REJECTED NOBODY AMONG THE SEVEN, which is the usual outcome. What
 * it confirms is this node, and it took the care `rank-nullity` took rather
 * than none: "fit a line to this data" is not a number and the engine has no
 * matrix type, so nothing can be handed a grid and asked to solve it. What a
 * task can return is the coefficient the normal equation forces, the sum of
 * squared misses it leaves, the value that same test returns at a WRONG
 * coefficient, and the count that says how many ways there are to name one
 * answer. Ten tasks ask for ten of those and every one is exact.
 *
 * ── WHY HERE, AND THE ONE SENTENCE THAT HAD TO BE RE-READ ────────────────
 *
 * `vectors-and-independence`, both of its `needs` being concepts of this file —
 * `inner-product-spaces` directly above it and `rank-nullity` the one above
 * that. Nothing is reached across a file boundary at all, which is the third
 * promotion in a row with that shape and the reason the material can quote both
 * prerequisites by their own numbers.
 *
 * THE SENTENCE TO RE-READ IS THIS SUBJECT'S OWN: "Not the NORM and not
 * Gram–Schmidt past two vectors: the first is a square root of a product that
 * is here." A concept about making a MISS as small as possible looks like it
 * must measure that miss, and measuring it is a norm. It does not, and the
 * reason is the concept's own name: what is minimised is the SUM OF THE
 * SQUARED misses, ⟨r, r⟩, and its square root is minimised by the same
 * coefficient because the root is increasing. So the boundary is not bent, it
 * is spent — ⟨u, u⟩ was already here and is where positive-definiteness got
 * used, and this is the concept that has a reason to minimise it. Not one task
 * takes a root, which is this subject's standing contract and is asserted per
 * promotion rather than assumed.
 *
 * ── THE DIVISION OF LABOUR, AND THREE DEBTS THIS PAYS ───────────────────
 *
 * `inner-product-spaces` supplies the whole of the first point. Its third
 * knowledge point splits v as cu + r with ⟨r, u⟩ = 0 and shows the coefficient
 * is FORCED rather than chosen: c = ⟨v, u⟩/⟨u, u⟩. That is the least-squares
 * coefficient, and the only thing this concept adds to it is a reason to want
 * it — over there the split was an identity, here it is the answer to a
 * question that has no exact answer. Its worked example is u = (1, 2),
 * v = (4, 3), c = 2; nothing here re-asks that pair, and the arithmetic moves
 * to three and four components, which is where a projection stops being a
 * reconstruction.
 *
 * `rank-nullity` supplies the last subgoal and the task beside it. Write a
 * column down twice and the span does not grow, so the projection, the
 * residual and the least sum of squares are all unchanged — while the
 * coefficients stop being unique and become a line. The dimension of that line
 * is three columns minus a rank of two, which is that concept's theorem spent
 * in a direction it did not itself ask: not "how far does the map reach" but
 * "how many ways are there to name one output".
 *
 * AND A THIRD DEBT, TO A SUBJECT IN ANOTHER FILE, WHICH IS WHY THE FIRST
 * COLUMN IS ALL ONES. With a = (1, 1, 1) the forced coefficient
 * ⟨b, a⟩/⟨a, a⟩ reads "add the components and divide by how many there are" for
 * any b at all — so the least-squares fit of a constant IS the mean, and
 * `descriptive-statistics` in ontology-statistics.ts already says of the mean
 * that the signed deviations from it total zero. That total is ⟨r, a⟩ and the
 * zero is the normal equation. Two authored subjects were asserting one fact
 * from two sides without either naming the other; this concept names it, and
 * the first point's last subgoal and `the-constant-fit-is-the-mean-1` are where.
 *
 * ── `evaluate` ONLY, AND THE TWO THINGS THAT ARE NOT HERE ────────────────
 *
 * Ten tasks, all `evaluate`, all settled by exact integer arithmetic with no
 * worker. No `justify`, zero of that kind existing in the build, so an
 * objective naming it would promise an observation nothing can make.
 *
 * THE GENERAL NORMAL EQUATIONS ARE NOT HERE, and that is the one real
 * shortfall rather than a boundary. With two columns the condition is one
 * equation per column, and unless the columns are orthogonal to each other the
 * two equations share both unknowns and are a 2×2 system — which is
 * `systems-of-linear-equations`, authored in `expressions-and-equations`, a
 * subject this node does not name in its `needs`. So the worked example
 * measures the times from the MIDDLE of the run, which makes ⟨u, t⟩ = 0 and
 * uncouples the two equations into two one-column problems. That is a real
 * technique and the reason statisticians centre data rather than a dodge, and
 * the second subgoal says plainly what the uncentred case would cost. Adding
 * the edge instead would have been a `links` entry and a gate, and it is a
 * decision about the map rather than one to take while authoring.
 *
 * NOR IS THE VERDICT ON THE MODEL. The four misses in the worked example are
 * (1, −1, −1, 1): they do not scatter, which is a line failing to bend with
 * data that bends. Reading a residual pattern as signal or noise is
 * `linear-regression`, a node of `statistics` that declares
 * `exercises: ['least-squares']` — so the credit edge for this concept already
 * exists at that end and will resolve when somebody writes it. The arithmetic
 * of the fit is here; the judgement about whether the fit deserved to be a line
 * is not, and the fourth subgoal says so to the learner rather than only here.
 *
 * ── AND THE TWELFTH, WHICH IS WHERE A ROW VECTOR LIVES ───────────────────
 *
 * `dual-spaces` was a node of `linear-algebra` and is the last concept below.
 * It is the forty-second promotion and the SEVENTH out of that one area, which
 * is still more than any other area has given up — and it is the first node
 * this build ADDED to the map and then authored out of it, the five thin-spot
 * additions of 2026-11-24 having been written three weeks after the area was
 * first read against its own `covers`.
 *
 * ── THE READY FIELD, MEASURED RATHER THAN QUOTED ─────────────────────────
 *
 * Recomputed from the tree before anything was written, for the reason the
 * eleventh section above gives and which has not stopped being true: the brief
 * that ships with this task carries a 2026-11-15 snapshot wrong in every
 * figure, including a candidate list of eight nodes of which six are authored.
 * 213 map nodes, 86 authored concepts, 19 areas, 15 subjects. THIRTEEN NODES
 * WERE READY — every `needs` already teachable — where the forty-first found
 * fourteen, and the change is exactly the one node it wrote. Nothing became
 * newly ready and nothing stopped being: `least-squares`'s two dependents
 * (`singular-value-decomposition`, `linear-regression`) each name a second
 * unwritten concept.
 *
 * NONE OF THE THIRTEEN IS FLOOR-BLOCKED, for the third promotion running, and
 * the tally this header carried for five runs stays retired — the floor counts
 * an area's DEPARTURES as covered territory (`MapArea.departed`, atlas.ts), so
 * headroom is not a reason any promotion is blocked.
 *
 * SEVEN OF THE THIRTEEN ARE UNDER REFUSALS THAT STILL BIND, and the list is
 * unchanged from the forty-first promotion's header, which is where each one's
 * argument lives: `graphs-of-functions` is a judgement about a drawing,
 * `constructions` is a procedure with a straightedge, `non-euclidean-geometry`
 * is a choice of axioms, `supremum-and-completeness` is a claim about a set
 * whose bound is not attained, `linear-inequalities` names a MOVE rather than a
 * shape, `complex-numbers` has no case in `exactValue`, and `relations` is a
 * SET OF PAIRS whose three defining properties are judgements the engine cannot
 * grade. Nothing expired and nothing was added. That leaves SIX unrefused, one
 * fewer than last time because this is one of them.
 *
 * THE SECOND FACTOR DECIDED IT AGAIN AND THE THIRD POINTED THE OTHER WAY FOR
 * THE FIRST TIME, which is the one thing about this pick worth arguing rather
 * than recording. Of the six unrefused, this is the ONLY node with every
 * `needs` inside one authored subject — the other five reach across two or
 * three, `counting-principles` and `sample-spaces` still foreclosed from the
 * cheap filing by `sets-and-membership` having written "it does not claim
 * COUNTING as a subject" into its own file, and `eigenvalues`, `word-problems`
 * and `nonlinear-systems` each naming concepts in two or three. So it costs
 * zero `links` entries and no new subject, where every alternative costs at
 * least one. But it has ZERO dependents and `eigenvalues` has four, the most of
 * anything unrefused, so for the first time since the rule was written down the
 * cheap shape and the useful one are different nodes.
 *
 * THE RULE WAS FOLLOWED RATHER THAN RE-DECIDED, and the reason is worth one
 * paragraph because the next run may face the same split. The documented order
 * is rulability, then single-ontology prerequisites, then dependents "as a
 * tie-break only" — and the second factor is not about convenience, it is about
 * the one cost that is paid SILENTLY. A `links` entry gates nothing until the
 * far node is written, so dropping one leaves every suite green and a concept
 * resting on nothing; three promotions have nearly done it. A low dependent
 * count costs nothing silently: it is visible in the map the day it is taken.
 * So the order is right and the split does not overturn it. What the split DOES
 * deserve is saying out loud that `eigenvalues` is now the strongest candidate
 * on the third factor and the gateway to four of this area's five unwritten
 * nodes, and that taking it means budgeting for two `links` entries across
 * three subjects — which is a decision about how much to spend, not about
 * whether the material is honest, and belongs to whoever runs next.
 *
 * RULABILITY REJECTED NOBODY AMONG THE SIX, which is the usual outcome, and
 * what it confirms here took less care than `least-squares` needed. A functional
 * is an abstraction and its answers are not: what f returns on a vector, what a
 * coordinate-reading functional returns on a basis vector, what a coefficient
 * row returns on a vector in its kernel, and how many freedoms one equation
 * leaves are four exact integers. Eleven tasks ask for eleven of those.
 *
 * ── WHY HERE, AND THE BRANCH IT MAKES ───────────────────────────────────
 *
 * `vectors-and-independence`, its single `needs` being `basis-and-dimension`, a
 * concept of this file — so nothing is reached across a file boundary, which is
 * the fourth promotion in a row with that shape.
 *
 * IT IS A BRANCH AND NOT AN EXTENSION, which the position of the concept in the
 * array below hides. It is written last, as every promotion into this file has
 * been, and it rests on NEITHER of the two concepts above it: not on
 * `least-squares`, not on `rank-nullity`, not on the inner product. It hangs
 * off `basis-and-dimension`, four concepts back, which now has two dependents
 * in this file where it had one: `rank-nullity` and this.
 *
 * The subject has forked before — `dot-product-geometry` reaches back to
 * `plane-vectors` past two concepts, and `basis-and-dimension` already had
 * `rank-nullity` hanging off it — so this is not a new SHAPE, and the reason to
 * write it down anyway is the test it forbids. An assertion phrased as an
 * ordered walk through the subject would accept this concept hung off the least
 * squares by accident, and the two have nothing whatever to do with each other.
 * What is asserted instead is the branch POINT, by name.
 *
 * ── THE DIVISION OF LABOUR, AND THE DEBT THIS PAYS BACKWARDS ────────────
 *
 * `basis-and-dimension` supplies the whole of the machinery and gets something
 * back, which is the unusual half. It supplies the ADDRESS: every vector is
 * exactly one combination of a basis, which is what makes "f is decided by its
 * values on the basis" true rather than plausible, and its first worked example
 * computed the address of w = (3, −5) in {(2, −1), (1, 3)} as (2, −1) with the
 * cross-check 7 as the divisor. All three points here run on that one example,
 * so nothing is re-derived and the arithmetic a learner meets is arithmetic
 * they have already done.
 *
 * WHAT IT GETS BACK IS AN EXPLANATION OF ITS OWN DIVISOR. Over there the 7 is
 * "the number every coordinate in this basis is built from", established and
 * then used. Here the dual basis functionals come out as f₁(x, y) = (3x − y)/7
 * and f₂(x, y) = (x + 2y)/7, so the cross-check is not merely a divisor that
 * appears — it is the denominator of the two functionals that READ the
 * coordinates, and the second point's expansion 3f₁ − 2f₂ cancels it exactly
 * because both halves carry it. A learner who has met the 7 as a hurdle meets
 * it again as the thing that makes the coordinate-reading rules linear.
 *
 * AND ITS THIRD WORKED EXAMPLE IS RE-READ FROM THE OTHER SIDE. The plane
 * 2x − y + 2z = 0 was a set with two freedoms there, with a basis {(1, 2, 0),
 * (0, 2, 1)} and a normal (2, −1, 2) that came out as a cross product. Here it
 * is the KERNEL of the functional f(x, y, z) = 2x − y + 2z, whose coefficient
 * row is that same normal — so a plane's normal vector and the row of the
 * functional cutting the plane out are one object seen twice, and solving the
 * equation for y recovers that concept's own basis vectors rather than
 * asserting them. The dimension 2 is the same count both times, and "one
 * equation spends one freedom" is what it means here.
 *
 * ── `evaluate` ONLY, AND THE THREE THINGS THAT ARE NOT HERE ─────────────
 *
 * Eleven tasks, all `evaluate`, all settled by exact integer arithmetic with
 * no worker. No `justify`, zero of that kind existing in the build, so an
 * objective naming it would promise an observation nothing can make.
 *
 * THE TRANSPOSE IS NOT HERE, and that is a boundary rather than a shortfall.
 * The node's `terms` names it, and the content of "the transpose is the dual
 * map" is that a matrix acting on a row from the right is the same arithmetic
 * as its transpose acting on a column — which needs a matrix, and matrices are
 * `matrices-and-determinants` in ontology-matrices.ts, a subject this node does
 * not name in its `needs`. What CAN be said without one is said: a row is a
 * functional and a column is a vector, and they are different objects rather
 * than the same numbers written sideways.
 *
 * THE ANNIHILATOR OF A SUBSPACE IS NOT HERE EITHER, and this one is the real
 * shortfall. The node's `terms` names it, and dim W° = dim V − dim W is the
 * theorem that makes the dual worth the trouble. What is written instead is the
 * kernel of ONE functional — the same subtraction with the roles swapped, the
 * subspace being the kernel rather than the thing annihilated — and it is
 * written as a count a learner can make rather than as a theorem. The general
 * version needs a basis of a subspace extended to one of the whole space, which
 * is the exchange argument `covers` already records this build as not reaching,
 * so the third point counts the kernel of a single functional and names the
 * general statement as `rank-nullity`'s subtraction rather than proving it.
 *
 * NOR IS THE INFINITE-DIMENSIONAL CASE, where the interesting fact is that the
 * dual is BIGGER and a dual basis does not exist. `basis-and-dimension`'s third
 * point already says a space of functions has no finite basis, so the question
 * is reachable from here and the answer is not: it needs a cardinality argument
 * and a topology to make the continuous dual the one anybody means, and
 * `functional-analysis-intro` is a node of `real-analysis` for exactly that
 * reason. The point's statement says "finite-dimensional" where the theorem
 * needs it rather than leaving the quantifier off.
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
    'It ends on the count those axioms made worth asking: a basis is a spanning set that is ' +
    'independent, which is what gives every vector exactly one address, and every basis of one ' +
    'space turns out to have the same number of elements — so that number is a property of the ' +
    'space and is its dimension. It counts directions and not entries, which is why a plane in ' +
    'space has dimension 2 while each of its points is written with three coordinates, and why ' +
    'a space of functions has no finite basis at all. Not the CHANGE of basis, which is a ' +
    'matrix acting on an address and belongs with the matrices; and the same-size theorem is ' +
    'demonstrated in the plane rather than proved in general, the exchange argument that would ' +
    'prove it being somewhere this build does not go. It ends by generalising the one product ' +
    'above: an inner product is any rule obeying three properties, the dot product is one of ' +
    'them and a weighted rule on the same plane is another, so a right angle turns out to be a ' +
    'fact about a PAIR AND A RULE rather than about two arrows — and the split of one vector ' +
    'into a multiple of another plus a perpendicular remainder, which the cosine identity ' +
    'assumed and never computed, is forced by the properties and so comes out differently under ' +
    'each rule. Not the NORM and not Gram–Schmidt past two vectors: the first is a square root ' +
    'of a product that is here, and the second subtracts two projections instead of one and ' +
    'needs the change of basis to become an algorithm. It ends by spending the count on a MAP: ' +
    'everything a matrix can reach is a combination of its columns, so the image is their span ' +
    'and the rank is its dimension — which is why three columns can reach a plane and no more. ' +
    'What the map kills is the kernel, a space in its own right whose dimension is the nullity, ' +
    'and a vector in it is the same three numbers as a dependence among the columns read the ' +
    'other way round. The two counts add to the number of COLUMNS and never of rows, because ' +
    'elimination gives each column exactly one label, so knowing either count is knowing both — ' +
    'and for a square matrix that is a trade: what is lost on the way in is missed on the way ' +
    'out. Not the ROW rank, whose equality with the column rank is the surprise of the subject ' +
    'and wants a second elimination on the transpose; and the theorem is demonstrated on a ' +
    'matrix already reduced rather than proved, the missing step being that the pivot columns ' +
    'are a basis of the image, which is the same exchange argument the count above left out. ' +
    'It ends by spending the projection and that count together on the case the rest of the ' +
    'subject has no answer for: a system with more equations than unknowns usually has NO ' +
    'solution, the target not being a combination of the columns — and the honest replacement ' +
    'for solving it is to miss by as little as possible. What is minimised is the SUM OF THE ' +
    'SQUARED misses and not its square root, which the two having the same minimiser makes a ' +
    'free choice and is why the norm is still absent; for one column the best coefficient is ' +
    'the projection coefficient already derived, and the condition that picks it is that the ' +
    'miss comes out perpendicular to the column. That condition is also the PROOF, by the ' +
    'Pythagorean relation the orthogonality point established: any other choice adds a ' +
    'perpendicular piece whose square can only add. With more than one column there is one such ' +
    'equation per column, and the fit of a constant turns out to be the MEAN — so the rule that ' +
    'the signed deviations from a mean total zero is this normal equation, read in the ' +
    'summaries subject. Not the general normal equations, which share both unknowns and are a ' +
    '2×2 system belonging to the equations subject: the worked example measures its times from ' +
    'the middle of the run so that the two columns are perpendicular and each coefficient comes ' +
    'out of its own equation, and what the uncentred case would cost is stated rather than ' +
    'hidden. Not the verdict on the model either — the misses can show a pattern rather than ' +
    'scatter, and deciding what such a pattern means is regression and not arithmetic. The ' +
    'nearest point is always unique and the WAY OF NAMING it need not be: repeat a column and ' +
    'the fit does not move while the coefficients become a line, whose dimension is the number ' +
    'of columns less the rank. ' +
    'It ends by turning the address itself into an object: a linear functional is a rule sending ' +
    'a vector to a single number, and because every vector is exactly one combination of a ' +
    'basis, the values on that basis decide the rule everywhere — so a functional on the plane ' +
    'IS a pair of numbers, and nothing constrains which pair. The functionals add pointwise and ' +
    'pass the three checks, so they are a space of their own, the DUAL, and it has the same ' +
    'dimension: the basis exhibiting that is the pair of functionals returning 1 on their own ' +
    'basis vector and 0 on the other, which means "take the first coordinate" is a functional ' +
    'and a vector\'s address is the list of what those functionals return on it. They are ' +
    '(3x − y)/7 and (x + 2y)/7 for the basis this subject has used throughout, so the ' +
    'cross-check turns out to be the denominator of the rules that read the coordinates rather ' +
    'than only the divisor the elimination happened to produce. On components a functional is a ' +
    'dot product with a fixed ROW, which is why a row and a column are different objects and ' +
    'not the same numbers written sideways, and setting one to zero is a single linear equation ' +
    'whose solutions are a space one dimension down — so the plane 2x − y + 2z = 0 is the kernel ' +
    'of a functional whose row is the plane\'s own normal vector, and scaling the row leaves the ' +
    'kernel exactly where it was. Not the TRANSPOSE, whose content is that a matrix acting on a ' +
    'row is its transpose acting on a column, and which therefore needs the matrices; not the ' +
    'ANNIHILATOR of a general subspace, whose count wants a basis of one extended to a basis of ' +
    'the whole space — the same exchange argument this subject left out twice above — so what is ' +
    'written is the kernel of a single functional and the general version is named as the rank ' +
    'theorem\'s subtraction; and not the infinite-dimensional case, where the dual is strictly ' +
    'bigger and has no dual basis at all, which is a cardinality argument and a topology and is ' +
    'why the statement here says finite-dimensional where it needs to.',
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
              socratic:
                'u is three across and four up; v is one back and two up. Of those four ' +
                'numbers, which ones can possibly change how far across u + v takes you — and ' +
                'what does that leave the first component as?',
            },
            {
              label: 'Why that matches the picture',
              detail:
                'Walk 3 right and 4 up, then 1 LEFT and 2 up. Net horizontal travel is 2 and ' +
                'vertical is 6 — the components never interact, because going across does not ' +
                'change how far up you are.',
              socratic:
                'Now take the same two trips as a walk — three right and four up, then one left ' +
                'and two up — and ask where you finish. The arithmetic already said (2, 6). ' +
                'What is it about sideways travel that makes the walk end up at exactly that ' +
                'point rather than merely near it?',
            },
            {
              label: 'And why order does not matter here',
              detail:
                'v + u gives the same (2, 6). Vector addition is commutative because number ' +
                'addition is, component by component — unlike the matrix products these build ' +
                'toward, where it is not.',
              socratic:
                'Walking v first and u second also finishes at (2, 6), and you never had to ' +
                'check that separately — each component was a sum of two ordinary numbers. ' +
                'Which fact about ordinary numbers is that order-independence borrowed from, ' +
                'and what does that tell you about where it could fail?',
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
              socratic:
                'You already know what u + u would do to the two numbers, because adding never ' +
                'lets one component disturb the other. 3u asks for that trip three times over ' +
                'rather than twice. What does that do to each of u\'s numbers on its own, and ' +
                'what does it leave the first component of 3u as?',
            },
            {
              label: 'Read the geometry',
              detail:
                'Three times as long, pointing the same way. Had the factor been −3 the length ' +
                'would be the same and the arrow would point the other way.',
              socratic:
                'Both of u\'s numbers came out three times bigger and neither of them flipped ' +
                'sign. What does that do to the length of the arrow and to the direction it ' +
                'points, and which of those two answers would have read differently had the ' +
                'factor been −3 instead?',
            },
            {
              label: 'The fact this sets up',
              detail:
                'Every scalar multiple of u lies on one line through the origin. That line is ' +
                'everything u alone can reach — which is the span, and the next concept.',
              socratic:
                'Scaling changed how long u is but not the line it lies along, and that held ' +
                'even for the −3 you just considered. Picture the tips of all such arrows drawn ' +
                'from the origin at once, for every factor there is: what shape do they fill, ' +
                'and what does that settle about the places u on its own can never take you?',
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
              socratic:
                'There are two factors here, a 2 and a 3, and each one is attached to a ' +
                'different vector — nothing in 2u + 3v asks you to stretch u by 3. You have ' +
                'already tripled a vector of your own and watched both of its numbers grow. ' +
                'What does each factor do to the pair of numbers it is attached to, and what ' +
                'two pairs does that leave you holding?',
            },
            {
              label: 'Add',
              detail: 'First component: 4 + 3 = 7. (The second is −2 + 9 = 7 as well, by accident.)',
              socratic:
                'The two scaled vectors are (4, −2) and (3, 9), and the question wants only the ' +
                'first component of their sum. When you added vectors tip to tail, travelling ' +
                'sideways never changed how far up you were. Which of those four numbers can ' +
                'therefore reach your answer, and what does that make it?',
            },
            {
              label: 'What the weights mean',
              detail:
                'They are the recipe. Changing them to 2 and −1 reaches somewhere else entirely; ' +
                'the set of everywhere you can reach by varying them is the span.',
              socratic:
                'The 2 and the 3 were handed to you by the question, and had they been 2 and −1 ' +
                'the sum would have come out somewhere else. You know already that letting the ' +
                'single factor on u range over every number traces out a line. Here two factors ' +
                'are free to vary, and independently. What is the collection of all the places ' +
                '2u + 3v could have landed, and what part did this particular pair of numbers ' +
                'play in it?',
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
              socratic:
                'Everything u on its own can reach is a multiple of it, so either w is c·u for ' +
                'one single number c or it is not on that line at all. Scaling does not get to ' +
                'use a different factor on each component — one c has to serve both. Looking at ' +
                'the first components alone, the 2 and the 6, how many values of c are left in ' +
                'the running, and what one claim does that leave you to test?',
            },
            {
              label: 'Check the other component agrees',
              detail: '−3/−1 = 3 as well. Subtracting: 3 − 3 = 0.',
              socratic:
                'That candidate came out of the first components by themselves, which means the ' +
                'second pair — the −3 above the −1 — had no hand in choosing it and is still ' +
                'free to disagree. Ask the second components what factor they demand, and ' +
                'subtract it from the one you already have. What makes that difference a real ' +
                'test rather than a repeat of the division you just did, and what does it come ' +
                'to here?',
            },
            {
              label: 'Read the answer',
              detail:
                'The ratios match, so w = 3u and w IS in the span. A non-zero difference would ' +
                'have meant the two components demanded different multiples, which no single ' +
                'scaling can satisfy.',
              socratic:
                'Both components turned out to demand the same factor, so the difference between ' +
                'their two demands came to 0. A single scaling has only one number to spend and ' +
                'must spend it on both components at once. What does that zero settle about ' +
                'whether w lies on u\'s line, and what would any non-zero difference have told ' +
                'you about the two demands instead?',
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

  {
    id: 'basis-and-dimension',
    name: 'Basis and dimension',
    subjectId: subject.id,
    scope: {
      id: 'basis-and-dimension',
      label: 'Basis and dimension',
      /*
       * NARROWED from the map node, which is the opposite of what the three
       * promotions above did, and the reason is a fault in the node's pattern
       * rather than a change of taste.
       *
       * The node read
       *
       *   /\b(basis \(linear algebra\)|dimension \(vector space\)
       *      |linear independence)\b/i
       *
       * and that pattern matched exactly one of its own three alternatives.
       * `\b` is a boundary between a word character and a non-word one, and the
       * group's `\b` sits after a closing parenthesis — so for the two
       * disambiguated titles it can only match if the NEXT character is a word
       * character, which at the end of "Basis (linear algebra)" there is not.
       * Tested rather than reasoned about: the node claimed "Linear
       * independence" and nothing else, and the two titles it was written for
       * were never recognised at all. That is the same trap tests/atlas.mjs
       * records for `test\b` against "Hypothesis testing", arriving from the
       * other side — a suffix there, a bracket here.
       *
       * So the third alternative was doing all the work, and it is the one
       * alternative that had to go: it was written while `linear-independence`
       * was unwritten and the node was standing in for it. That concept is
       * authored in this very file, three above, with `linear(ly)?
       * (in)?dependen\w+` of its own, and the article titled "Linear
       * independence" belongs to the concept whose material is about it.
       *
       * `change of basis` is in the node's `terms` and is a real article title,
       * so it is named; `dimension theorem` is the same-size theorem of the
       * second point below. Neither widens the claim to a bare word — "Basis",
       * "Dimension", "Orthonormal basis" and "Hausdorff dimension" all stay
       * out, and the last two matter: orthonormality is `inner-product-spaces`,
       * and a fractal dimension is not this count.
       *
       * "STILL MAPPED" is what this said about that concept and it is authored
       * now, the promotion after this one, at the foot of this file. The
       * reservation is therefore unchanged and still unfulfilled: that
       * concept's pattern was carried verbatim from its node and does not reach
       * "Orthonormal basis" either, so the article is claimed by nobody. The
       * note beside it says why widening was left as its own change.
       */
      hint: 'basis dimension coordinates change of basis',
      match: /\bbasis \(linear algebra\)|\bdimension \(vector space\)|\bchange of basis\b|\bdimension theorem\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, as the concept above it does and
     * for the reason stated there: the build ships no `justify` task anywhere,
     * so an objective naming that kind names an observation that cannot be
     * made.
     *
     * The statements are written to what `evaluate` can evidence, which in this
     * concept took care. "Is this set a basis" and "what is the dimension" are
     * the sentences the material is about and neither is a number. What a task
     * can return is the number that DECIDES them — the cross-check that makes a
     * coordinate exist, the cross product that settles independence in space,
     * the triple product that shows a third vector adds nothing — so that is
     * what the objectives claim, and the deciding is in the `socratic`
     * phrasings, asked by a tutor and marked by nothing.
     */
    objectives: [
      {
        id: 'produce-the-coordinates-a-basis-assigns',
        statement:
          'Produce a coordinate of a plane vector relative to a given basis, and the number the ' +
          'elimination divides by — which is the independence test, and is why the coordinates ' +
          'exist at all.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-two-values-that-bound-the-size',
        statement:
          'Produce the value that shows a third plane vector is redundant and the value that ' +
          'shows a single one is not enough — the two bounds that leave every basis of the plane ' +
          'with exactly two elements.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-numbers-a-dimension-count-in-space-turns-on',
        statement:
          'Produce the cross product that settles whether two vectors of a plane in space are ' +
          'independent, and the triple product that shows a third one lies in the plane they ' +
          'already span.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-basis-is-a-spanning-set-with-nothing-spare',
        conceptId: 'basis-and-dimension',
        statement:
          'A basis of a space is a set that spans it AND is independent. Spanning says every ' +
          'vector is reachable; independence says it is reachable in only one way. Together they ' +
          'turn vectors into coordinates: relative to a basis, each vector has exactly one ' +
          'recipe, and that list of weights is its address. Independence is what makes the ' +
          'address single-valued rather than merely tidy — and in the plane the number you ' +
          'divide by to find it is the cross-check itself.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points. Finding a
         * coordinate is an elimination, which is timed where it is taught —
         * `the-cross-check` carries a target for the arithmetic this reuses —
         * and the three things this concept adds are a decision, a theorem and
         * a count. A timing target on "is this set a basis" measures typing,
         * which is the case types.ts makes for the field usually being absent.
         */
        workedExample: {
          problem:
            'u = (2, −1) and v = (1, 3). Write w = (3, −5) in the basis {u, v} — that is, find ' +
            'the weights c₁ and c₂ with c₁u + c₂v = w.',
          subgoals: [
            {
              label: 'Check it is a basis before asking it for an address',
              detail:
                'The cross-check is 2·3 − (−1)·1 = 7. Non-zero, so u and v are independent, and ' +
                'two independent vectors in the plane span it — which is what the span concept ' +
                'established. So {u, v} is a basis and the question has an answer. A zero here ' +
                'would have meant the pair reached only a line, and asking for an address in it ' +
                'would be asking for a recipe that either does not exist or is not unique.',
              socratic:
                'Before looking for any weights, what does u₁v₂ − u₂v₁ come to for these two — ' +
                'and what would a zero there have meant about the address you are about to ' +
                'compute?',
            },
            {
              label: 'Turn one vector equation into one equation per component',
              detail:
                'c₁u + c₂v = w has to hold in both components at once, so it is two equations: ' +
                '2c₁ + c₂ = 3 from the first and −c₁ + 3c₂ = −5 from the second. This is the ' +
                'step the span concept promised would turn reachability questions into systems.',
              socratic:
                'w has two components and the combination has to match it in both. What two ' +
                'equations in c₁ and c₂ does that give?',
            },
            {
              label: 'Eliminate, and watch the cross-check appear as the divisor',
              detail:
                'The first equation gives c₂ = 3 − 2c₁. Substituting into the second: ' +
                '−c₁ + 3(3 − 2c₁) = −5, so −c₁ + 9 − 6c₁ = −5 and −7c₁ = −14, giving c₁ = 2 and ' +
                'then c₂ = 3 − 4 = −1. The 7 is not a coincidence — it is the cross-check from ' +
                'the first subgoal, and it is the divisor every coordinate in this basis is ' +
                'built from. That is the mechanical reason independence is required rather than ' +
                'preferred: a dependent pair makes that divisor zero.',
              socratic:
                'Substituting c₂ = 3 − 2c₁ into the second equation leaves a single multiple of ' +
                'c₁ on the left. Which number is that multiple, and where in this problem have ' +
                'you written it already?',
            },
            {
              label: 'Establish that there is no second answer',
              detail:
                'Suppose weights d₁ and d₂ also reached w. Subtracting the two combinations ' +
                'gives (c₁ − d₁)u + (c₂ − d₂)v = 0. If the two recipes differed at all, that is ' +
                'a combination of u and v landing on the origin with weights not both zero — a ' +
                'dependence, which the cross-check has already ruled out. So the differences are ' +
                'both zero and the recipes were the same one. This is why "the coordinates of w" ' +
                'is a phrase at all: without independence the plural would be wrong.',
              socratic:
                'Suppose somebody else\'s weights also reached w. Subtract their combination ' +
                'from yours — what vector do you get, and what does the cross-check say about ' +
                'the weights that produced it?',
            },
          ],
          answer:
            '(2, −1) — w = 2u − v, and the 7 the elimination divided by is the cross-check, ' +
            'which is also what makes that address the only one',
        },
      },
      {
        id: 'every-basis-of-a-space-is-the-same-size',
        conceptId: 'basis-and-dimension',
        statement:
          'Nothing stops a spanning set from being any size, and yet every BASIS of one space ' +
          'has the same number of elements. In the plane the count is squeezed from both sides: ' +
          'three plane vectors are always dependent, so three is too many, and one vector spans ' +
          'only a line, so one is too few. Two is what is left. The theorem is that this squeeze ' +
          'happens in every vector space — any two bases of one space have equally many ' +
          'elements — which is what lets the number be named instead of merely computed.',
        position: 2,
        workedExample: {
          problem:
            'u = (2, −1), v = (1, 3) and w = (3, −5). Decide whether {u, v, w} is a basis of the ' +
            'plane, and whether {u} on its own could be.',
          subgoals: [
            {
              label: 'Reuse the address rather than hunting for weights again',
              detail:
                'The previous point found w = 2u − v, so w − 2u + v = 0. Checking: the first ' +
                'component is 3 − 4 + 1 = 0 and the second is −5 + 2 + 3 = 0. That is a ' +
                'combination of all three vectors landing on the origin with weights (−2, 1, 1), ' +
                'which are not all zero — a dependence. So {u, v, w} spans the plane and is not ' +
                'a basis of it: spanning was never the property in question.',
              socratic:
                'You already know w = 2u − v. Rearranged so that one side is the zero vector, ' +
                'what combination of the three does that give — and which of its three weights ' +
                'are zero?',
            },
            {
              label: 'Notice that the dependence was forced, not lucky',
              detail:
                'Nothing about w was special. {u, v} spans the plane, so ANY third plane vector ' +
                'has an address in it, computed exactly as the last point computed this one — ' +
                'and that address, rearranged, is a dependence. So no set of three plane vectors ' +
                'is ever independent, and no basis of the plane has three elements. Three is ' +
                'ruled out for every choice at once rather than for this one.',
              socratic:
                'The address of ANY plane vector in {u, v} can be found the same way you found ' +
                'w\'s. What does the existence of that address say about whether a third vector ' +
                'could ever be independent of u and v?',
            },
            {
              label: 'Close off the other direction as well',
              detail:
                'A single vector spans a line, so {u} can only be a basis if the plane is that ' +
                'line. The cross-check on u and w is 2·(−5) − (−1)·3 = −10 + 3 = −7, which is ' +
                'not zero, so w is not a multiple of u and sits off the line through u. One ' +
                'vector is therefore not enough. The −7 is the 7 of the previous point with a ' +
                'sign: w = 2u − v, and replacing v by w in the cross-check scales it by w\'s ' +
                'v-coordinate, which is −1.',
              socratic:
                'If {u} were a basis of the plane on its own, every plane vector would have to ' +
                'be a multiple of u. What does the cross-check of u and w come to, and what does ' +
                'that settle?',
            },
            {
              label: 'Read off what the two bounds leave',
              detail:
                'Three is too many and one is too few, and neither verdict used anything ' +
                'specific about these vectors. So every basis of the plane has exactly two ' +
                'elements, and the size is a fact about the plane rather than about the set ' +
                'somebody happened to pick. The theorem says the same squeeze exists in every ' +
                'vector space, with the same shape of argument: a set bigger than a basis is ' +
                'dependent, a set smaller than one cannot span. A quantity that comes out the ' +
                'same however it is measured deserves a name, and the next point gives it one.',
              socratic:
                'Three vectors are always dependent here and one never spans, and neither ' +
                'conclusion mentioned u, v or w in particular. What is left for the size of a ' +
                'basis of the plane to be?',
            },
          ],
          answer:
            '{u, v, w} is dependent — w − 2u + v = 0 — and {u} spans only a line, since the ' +
            'cross-check of u and w is −7; so every basis of the plane has exactly two elements',
        },
      },
      {
        id: 'the-dimension-counts-directions-not-entries',
        conceptId: 'basis-and-dimension',
        statement:
          'The dimension of a space is the size of any of its bases, which the previous point ' +
          'makes a well-defined number. It counts independent DIRECTIONS and not the entries an ' +
          'element is written with: the plane 2x − y + 2z = 0 has elements of three coordinates ' +
          'and dimension 2, because one equation spends one of the three freedoms. And a space ' +
          'need not have a finite basis at all — the functions of the previous concept add ' +
          'pointwise, obey every axiom, and no finite set spans them — which is what ' +
          '"infinite-dimensional" means and the last reason dimension is a count of directions ' +
          'rather than of numbers on the page.',
        position: 3,
        workedExample: {
          problem:
            'W is the plane 2x − y + 2z = 0 through the origin. a = (1, 2, 0) and b = (0, 2, 1) ' +
            'lie in it, and so do c = (2, −2, −3), u = (2, 2, −1) and v = (1, 0, −1). Find the ' +
            'dimension of W, and check the answer against a second basis of it.',
          subgoals: [
            {
              label: 'Count the freedoms before counting the entries',
              detail:
                'Solving the condition for y gives y = 2x + 2z. So x and z may be chosen freely ' +
                'and y follows: two free choices, and every element still written as three ' +
                'numbers. That is the first reading of "dimension 2 inside three coordinates", ' +
                'and it is a count of what you may choose rather than of what you must write ' +
                'down.',
              socratic:
                'Solve 2x − y + 2z = 0 for y. Once you have, how many of the three coordinates ' +
                'are still free to choose — and how many numbers does it take to write the ' +
                'result down?',
            },
            {
              label: 'Exhibit a basis and let it confirm the count',
              detail:
                'a and b are both in W: 2 − 2 + 0 = 0 and 0 − 2 + 2 = 0. They are independent ' +
                'because a × b = (2, −1, 2) is not the zero vector, which is the space version ' +
                'of the cross-check. Two independent vectors inside a two-freedom set span it, ' +
                'so {a, b} is a basis and dim W = 2. The cross product coming out as exactly ' +
                'W\'s own normal vector is not a coincidence: it is perpendicular to both, and W ' +
                'is precisely the set of points perpendicular to that normal.',
              socratic:
                'a and b both satisfy W\'s condition. What is a × b, and what does a non-zero ' +
                'answer there settle about the pair?',
            },
            {
              label: 'Test the theorem against a set that is one too big',
              detail:
                'c is not visibly built from a and b, so the question is settled by arithmetic ' +
                'rather than by inspection: with n = a × b = (2, −1, 2), n·c = 4 + 2 − 6 = 0, so ' +
                'c lies in the plane that a and b span — and c = 2a − 3b, which the zero was ' +
                'evidence for before the weights were found. So {a, b, c} still spans W and the ' +
                'dimension is still 2. Three vectors, two directions, exactly as three plane ' +
                'vectors gave two in the point above.',
              socratic:
                'c is not obviously a combination of a and b. What does (a × b)·c come to, and ' +
                'what does a zero there say about where c lies?',
            },
            {
              label: 'Change the basis and get the same number back',
              detail:
                'u and v are in W as well — 4 − 2 − 2 = 0 and 2 − 0 − 2 = 0 — and they are ' +
                'independent, since the first component of u × v is u₂v₃ − u₃v₂ = ' +
                '2·(−1) − (−1)·0 = −2. So {u, v} is a second basis of the same plane, and it has ' +
                'two elements like the first. That is the previous point\'s theorem arriving ' +
                'where it is not obvious: nothing about u and v resembles a and b, and the count ' +
                'is forced to agree anyway. What dimension is NOT is the entry count — every ' +
                'vector here is written with three numbers and the dimension is 2 — and in the ' +
                'function space of the previous concept there is no entry count at all, which is ' +
                'the case the word "infinite-dimensional" is reserved for.',
              socratic:
                'u and v are in W too and look nothing like a and b. The first component of ' +
                'u × v is u₂v₃ − u₃v₂ — what does it come to, and what does that force about the ' +
                'number of vectors in this second basis?',
            },
          ],
          answer:
            '2 — {a, b} and {u, v} are both bases of W and both have two elements, while every ' +
            'element of W is written with three coordinates',
        },
      },
    ],
  },

  {
    id: 'inner-product-spaces',
    name: 'Inner products and orthogonality',
    subjectId: subject.id,
    scope: {
      id: 'inner-product-spaces',
      label: 'Inner products and orthogonality',
      /*
       * Carried verbatim from the map node, which is what three of the four
       * promotions into this file did and is the right default: the pattern
       * decides against an article title, so widening it in the same edit that
       * makes the material appear leaves no way to say which change moved the
       * title table. `basis-and-dimension` is the exception and it narrowed
       * rather than widened, because its pattern had a FAULT — a `\b` after a
       * closing parenthesis, which matched only one of three alternatives.
       *
       * Checked for that same fault here before carrying it, since the trap is
       * invisible otherwise: `fidelityMismatches` asks only whether a checked
       * concept HAS a pattern, and the recognition figure counts patterns
       * rather than testing them. All three alternatives end in a word
       * character — "product", "orthogonalisation", "schmidt" — so the
       * trailing `\b` is a real boundary for each, and tests/atlas.mjs now
       * carries title rows for two of them rather than leaving that reasoned
       * about.
       *
       * WHAT IT DOES NOT REACH, stated because the previous promotion promised
       * it would. The comment beside `basis-and-dimension`'s pattern keeps
       * "Orthonormal basis" out of the dimension on the ground that
       * orthonormality is this concept — and this pattern does not claim that
       * title either, nor the bare "Orthogonality", since `orthogonali[sz]ation`
       * wants the derived noun. So that article is currently claimed by nobody.
       * Widening is a one-word change and is deliberately NOT made here: it
       * would move the title table in the same commit as the material, which is
       * the attribution this file protects.
       */
      hint: 'inner product orthogonal gram schmidt projection orthonormal',
      match: /\b(inner product|orthogonali[sz]ation|gram(–|-)schmidt)\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, as the two concepts above it do
     * and for the reason stated there: the build ships no `justify` task
     * anywhere, so an objective naming that kind names an observation that
     * cannot be made.
     *
     * The statements are written to what `evaluate` can evidence, which took
     * the same care it took one concept up. "Is this rule an inner product" and
     * "are these two perpendicular" are the sentences the material is about and
     * neither is a number. What a task can return is the number that DECIDES
     * them — the value a candidate rule hands back on a vector and itself, the
     * two values one pair returns under two rules, the zero a remainder
     * returns — so that is what the objectives claim, and the deciding is in
     * the `socratic` phrasings, asked by a tutor and marked by nothing.
     */
    objectives: [
      {
        id: 'produce-the-number-a-chosen-rule-returns',
        statement:
          'Produce the value a weighted inner product returns on a pair of plane vectors, and ' +
          'the value that disqualifies a candidate rule by making some non-zero vector\'s ' +
          'product with itself negative.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-two-values-that-disagree-about-a-right-angle',
        statement:
          'Produce the two values ONE pair of vectors returns under two different inner ' +
          'products, one of them zero and one of them not — which is what makes a right angle ' +
          'a fact about a pair and a rule rather than about two arrows.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-coefficient-and-the-zero-it-was-solved-for',
        statement:
          'Produce the coefficient that splits one vector into a multiple of another plus a ' +
          'remainder, and the value that remainder\'s inner product with the other returns — ' +
          'which is the zero the coefficient was chosen to force.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-inner-product-is-three-properties-and-not-a-formula',
        conceptId: 'inner-product-spaces',
        statement:
          'An inner product on a real vector space is a rule ⟨u, v⟩ taking two vectors to a ' +
          'number, obeying three properties: it is symmetric, it is linear in each slot, and it ' +
          'is positive-definite — ⟨u, u⟩ > 0 for every u except the zero vector. The dot product ' +
          'obeys all three. So does the weighted rule ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂ on the same plane, ' +
          'and so does the integral of a product of two functions. This is the axioms\' move made ' +
          'once more: every consequence drawn from the three properties holds for all of them, ' +
          'with no argument repeated.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points, which follows the
         * two concepts above rather than the two below the dot product. The
         * arithmetic here is a weighted sum and a quotient, both timed where
         * they are taught, and what this concept adds is a TEST, a
         * disagreement and a derivation. A timing target on "which property
         * does that refute" measures typing, which is the case types.ts names
         * when it argues the field should usually be absent.
         */
        workedExample: {
          problem:
            'Take ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂ on the plane, with u = (1, 4) and v = (5, −2). Find ' +
            '⟨u, v⟩ and ⟨u, u⟩, and then say which property the rule 2u₁v₁ − 3u₂v₂ fails.',
          subgoals: [
            {
              label: 'Read the weights off the rule before substituting anything',
              detail:
                'The rule pairs the components by position exactly as the dot product does — ' +
                'first with first, second with second — and then weights the two products ' +
                'differently: 2 on the first, 3 on the second. Nothing is paired across, and ' +
                'setting both weights to 1 would give the dot product back, so the dot product ' +
                'is one member of a family rather than the definition of the family.',
              socratic:
                'The rule is 2u₁v₁ + 3u₂v₂. Which two of the four numbers in u and v does the 2 ' +
                'multiply together, and what rule would you be left with if both weights were 1?',
            },
            {
              label: 'Compute the number the rule returns on this pair',
              detail:
                '2·1·5 = 10 and 3·4·(−2) = −24, so ⟨u, v⟩ = 10 − 24 = −14. The ordinary dot ' +
                'product of the same two vectors is 1·5 + 4·(−2) = 5 − 8 = −3, a different ' +
                'number. Two rules, one pair, two answers — which is the fact the next point is ' +
                'entirely about.',
              socratic:
                'Substitute and add: what does the weighted rule return here? Now run the plain ' +
                'dot product on the same two vectors — do the two rules agree?',
            },
            {
              label: 'Spend the two properties that need no numbers, then the one that does',
              detail:
                'Symmetry holds because 2v₁u₁ + 3v₂u₂ is the same sum written backwards, and ' +
                'linearity in each slot holds because multiplication distributes over addition; ' +
                'neither argument looks at a component\'s value. Positive-definiteness is the ' +
                'one that does: ⟨u, u⟩ = 2u₁² + 3u₂², which at u = (1, 4) is 2 + 48 = 50. In ' +
                'general it is a sum of two terms neither of which can be negative, so it ' +
                'vanishes only when both squares do — and that needs u₁ = u₂ = 0. The weights ' +
                'being positive is what makes that argument run.',
              socratic:
                '⟨u, u⟩ comes out as 2u₁² + 3u₂². What would have to be true of u for that to ' +
                'come to zero, and which fact about the numbers 2 and 3 is doing the work in ' +
                'that answer?',
            },
            {
              label: 'Break one weight and watch which property goes',
              detail:
                'Change the second weight to −3. The rule 2u₁v₁ − 3u₂v₂ is still symmetric and ' +
                'still linear in each slot — both of those arguments were about the shape of the ' +
                'sum, and the shape has not changed. But at w = (1, 1) it returns 2 − 3 = −1, so ' +
                'a non-zero vector has a negative product with itself, and positive-definiteness ' +
                'fails. One number settles it. That is why the three properties are listed ' +
                'separately rather than rolled into one: the first two cannot imply the third, ' +
                'exactly as the subspace test\'s three checks could not imply each other.',
              socratic:
                'Keep the rule but flip the second weight to −3, and try it on w = (1, 1) ' +
                'against itself. What does it return — and which of the three properties has ' +
                'that single number just refuted?',
            },
          ],
          answer:
            '⟨u, v⟩ = −14 and ⟨u, u⟩ = 50; and 2u₁v₁ − 3u₂v₂ fails positive-definiteness, since ' +
            'at w = (1, 1) it returns −1',
        },
      },
      {
        id: 'a-right-angle-belongs-to-a-pair-and-a-rule',
        conceptId: 'inner-product-spaces',
        statement:
          'Perpendicular means ⟨u, v⟩ = 0, so which pairs count depends on which inner product ' +
          'is in use. Under the dot product (3, 2) and (−2, 3) are at right angles; under ' +
          '⟨u, v⟩ = 2u₁v₁ + 3u₂v₂ they are not, and (1, −1) is instead. The arrows did not move. ' +
          'What DOES survive the change of rule is every consequence of a zero — the Pythagorean ' +
          'relation, and the projection in the next point — because those were derived from the ' +
          'three properties and never from the picture.',
        position: 2,
        workedExample: {
          problem:
            'u = (3, 2). Find a whole-number vector orthogonal to u under the dot product, and ' +
            'one orthogonal to u under ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂, and test each against the other ' +
            'rule.',
          subgoals: [
            {
              label: 'Solve the zero condition rather than turning the arrow',
              detail:
                'u·v = 0 reads 3v₁ + 2v₂ = 0, which is one linear equation in two unknowns, so ' +
                'its solutions are a line through the origin — the same "one equation spends one ' +
                'freedom" count the dimension point made. Choosing v₁ = −2 gives v₂ = 3, so ' +
                'v = (−2, 3), and 3·(−2) + 2·3 = −6 + 6 = 0. Swapping the components and ' +
                'negating one is the familiar shortcut, and it is a shortcut for THIS rule only.',
              socratic:
                'u·v = 0 reads 3v₁ + 2v₂ = 0. How many of v\'s two components are you still free ' +
                'to choose once that holds, and which whole-number v does the choice v₁ = −2 ' +
                'give you?',
            },
            {
              label: 'Put the same pair to the other rule',
              detail:
                '2·3·(−2) + 3·2·3 = −12 + 18 = 6, which is not zero. So under the weighted rule ' +
                'u and v are not perpendicular, and nothing was redrawn to make that happen — ' +
                'the two vectors are the same two vectors. A right angle is therefore not a ' +
                'property of two arrows on their own.',
              socratic:
                'Neither arrow has moved. What does 2u₁v₁ + 3u₂v₂ return on this same pair, and ' +
                'what does a non-zero answer now entitle you to say about the angle between them?',
            },
            {
              label: 'Solve the zero condition again, for the weighted rule',
              detail:
                '⟨u, w⟩ = 0 reads 2·3·w₁ + 3·2·w₂ = 6w₁ + 6w₂ = 0, so w₁ = −w₂ and w = (1, −1) ' +
                'is the whole-number choice: 2·3·1 + 3·2·(−1) = 6 − 6 = 0. Its dot product with ' +
                'u is 3·1 + 2·(−1) = 1, also not zero. So each rule has its own line of vectors ' +
                'it calls perpendicular to u, and the two lines are different.',
              socratic:
                'Now set 2u₁w₁ + 3u₂w₂ = 0 with u = (3, 2). What single equation in w₁ and w₂ ' +
                'does that reduce to, and which whole-number w satisfies it?',
            },
            {
              label: 'Separate what the change of rule costs from what it does not',
              detail:
                'Expanding ⟨u − v, u − v⟩ by linearity in each slot and then symmetry gives ' +
                '⟨u, u⟩ − 2⟨u, v⟩ + ⟨v, v⟩, and that derivation never names a rule. So when the ' +
                'middle term is zero, "the square on the third side is the sum of the other two ' +
                'squares" still holds — with each square meaning that rule\'s own ⟨x, x⟩. The ' +
                'arrows that count as perpendicular change; the consequences of a zero do not. ' +
                'That is the whole return on stating three properties instead of a formula, and ' +
                'it is why the next point\'s derivation can be run twice without being redone.',
              socratic:
                'Expanding ⟨u − v, u − v⟩ uses linearity and symmetry and nothing else. Which of ' +
                'the three terms does a zero inner product remove — and did that expansion ever ' +
                'need to know which of the two rules you were using?',
            },
          ],
          answer:
            '(−2, 3) is orthogonal to u under the dot product and returns 6 under the weighted ' +
            'rule; (1, −1) is orthogonal under the weighted rule and returns 1 under the dot ' +
            'product — so perpendicularity is a fact about a pair AND a rule',
        },
      },
      {
        id: 'the-projection-coefficient-is-forced-by-the-properties',
        conceptId: 'inner-product-spaces',
        statement:
          'For u ≠ 0 every v splits as v = cu + r with ⟨r, u⟩ = 0, and the coefficient is not ' +
          'chosen: taking the inner product of both sides with u gives ⟨v, u⟩ = c⟨u, u⟩, so ' +
          'c = ⟨v, u⟩/⟨u, u⟩. That is the split the cosine identity assumed and never computed. ' +
          'The derivation uses only the three properties — including positive-definiteness, ' +
          'which is what makes ⟨u, u⟩ safe to divide by — so the same formula runs under any ' +
          'inner product and returns a different number for each. The pair {u, r} is orthogonal ' +
          'and spans what u and v spanned, which is Gram–Schmidt on two vectors.',
        position: 3,
        workedExample: {
          problem:
            'u = (1, 2) and v = (4, 3), under the dot product. Split v as cu + r with r ' +
            'perpendicular to u, and check the remainder. Then run the same derivation under ' +
            '⟨u, v⟩ = 2u₁v₁ + 3u₂v₂.',
          subgoals: [
            {
              label: 'Force the coefficient instead of guessing it',
              detail:
                'Write v = cu + r and demand ⟨r, u⟩ = 0. Taking the inner product of both sides ' +
                'with u, linearity gives ⟨v, u⟩ = c⟨u, u⟩ + ⟨r, u⟩, and the demand kills the ' +
                'second term — so c = ⟨v, u⟩/⟨u, u⟩ and nothing was chosen. The division is ' +
                'legitimate because ⟨u, u⟩ > 0 for u ≠ 0, which is the property the first point ' +
                'showed a rule can fail; this is where it is used rather than merely checked.',
              socratic:
                'Write v = cu + r and take the inner product of both sides with u. Which of the ' +
                'two terms on the right has to vanish if r is to be orthogonal to u, and what ' +
                'does that leave c equal to?',
            },
            {
              label: 'Compute the coefficient for these two vectors',
              detail:
                'v·u = 4·1 + 3·2 = 10 and u·u = 1 + 4 = 5, so c = 10/5 = 2 and the part of v ' +
                'along u is 2u = (2, 4). Both numbers are dot products of the kind the previous ' +
                'concept computed, one of them a vector with itself — so the formula is assembled ' +
                'from two quantities already in hand rather than from anything new.',
              socratic:
                'What do v·u and u·u come to for u = (1, 2) and v = (4, 3), and what does their ' +
                'quotient make the part of v that lies along u?',
            },
            {
              label: 'Subtract, and check the remainder really is orthogonal',
              detail:
                'r = v − 2u = (4 − 2, 3 − 4) = (2, −1), and r·u = 2·1 + (−1)·2 = 2 − 2 = 0. The ' +
                'zero is not a coincidence of these components: it is the condition c was solved ' +
                'for, so it would come out for any v. And {u, r} = {(1, 2), (2, −1)} is a ' +
                'perpendicular pair spanning the same plane u and v spanned, which is what ' +
                'orthogonalising two vectors amounts to — a basis whose coordinates can be read ' +
                'off one at a time, because asking for one weight no longer drags the other in.',
              socratic:
                'Subtract the part along u from v. What is the remainder, what does its dot ' +
                'product with u come to — and was that zero always going to happen, or only for ' +
                'this particular v?',
            },
            {
              label: 'Run the same derivation under the other rule and watch the number move',
              detail:
                'Under ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂ the two quantities are ⟨v, u⟩ = 2·4·1 + 3·3·2 = ' +
                '8 + 18 = 26 and ⟨u, u⟩ = 2·1 + 3·4 = 14, so c = 26/14 = 13/7 and the remainder ' +
                'is v − (13/7)u = (15/7, −5/7) — which this rule does send to zero: ' +
                '2·(15/7)·1 + 3·(−5/7)·2 = 30/7 − 30/7 = 0. One derivation, two answers, because ' +
                'the derivation used the properties and not the formula. And 13/7 is the answer ' +
                'in the same way 24/25 was the answer to the cosine: a quotient pins the split ' +
                'down exactly and 1.857 is a rounding of it.',
              socratic:
                'Nothing in the derivation of c mentioned which rule you were using. Recompute ' +
                '⟨v, u⟩ and ⟨u, u⟩ with the weights 2 and 3 — what is c now, and what has that ' +
                'done to which vector counts as the remainder?',
            },
          ],
          answer:
            'c = 2, so v = 2u + r with r = (2, −1) and r·u = 0; and under the weighted rule the ' +
            'same derivation gives c = 13/7 with remainder (15/7, −5/7), which that rule sends ' +
            'to zero',
        },
      },
    ],
  },
  {
    id: 'rank-nullity',
    name: 'Rank, kernel and the rank–nullity theorem',
    subjectId: subject.id,
    scope: {
      id: 'rank-nullity',
      label: 'Rank, kernel and the rank–nullity theorem',
      /*
       * REPAIRED rather than carried verbatim, and it is the SAME FAULT
       * `basis-and-dimension` found two promotions ago — which is the reason
       * that note was written down at length rather than fixed in silence.
       *
       * The node read
       *
       *   /\b(rank(–|-)nullity|rank \(linear algebra\)
       *      |kernel \(linear algebra\))\b/i
       *
       * and two of its three alternatives could never match. `\b` is a boundary
       * between a word character and a non-word one, and the group's trailing
       * `\b` sits after a closing parenthesis — so a disambiguated title can
       * only match when the NEXT character is a word character, which at the
       * end of "Rank (linear algebra)" there is not. So the node claimed
       * "Rank–nullity theorem" and nothing else for as long as it existed, and
       * nothing said so: `fidelityMismatches` asks only whether a checked
       * concept HAS a pattern, and the recognition figure counts patterns
       * rather than testing them.
       *
       * The repair is the same one that file made — a leading `\b` per
       * alternative and a trailing one only where the alternative ends in a
       * word character — and the three alternatives are otherwise UNCHANGED.
       * Fixing a dead branch is not widening: it makes the pattern claim what
       * it was written to claim, and tests/atlas.mjs now carries a title row
       * for each of the three rather than leaving any of them reasoned about.
       *
       * The en dash in `rank(–|-)nullity` is the node's and is kept. Wikipedia
       * titles the article with an en dash, as it does Gram–Schmidt, and almost
       * everybody typing the pattern would use a hyphen — so dropping either
       * branch leaves the alternative matching only the form nobody writes.
       *
       * WHAT IT DOES NOT REACH, stated rather than widened in the same change
       * as the material. "Row and column spaces" and "Null space" are real
       * articles and this pattern claims neither; `column space` is claimed by
       * `matrices-and-maps`, which is the right owner of the phrase, and the
       * other two are unclaimed. Widening is its own change for the reason the
       * three promotions above give: a pattern edit and a material edit in one
       * commit leaves no way to say which moved the title table.
       */
      hint: 'rank nullity kernel null space image column space',
      match: /\brank(–|-)nullity\b|\brank \(linear algebra\)|\bkernel \(linear algebra\)/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, as the three concepts above it do
     * and for the reason stated there: the build ships no `justify` task
     * anywhere, so an objective naming that kind names an observation that
     * cannot be made.
     *
     * The statements are written to what `evaluate` can evidence, and this
     * concept is the clearest case in the file of why that distinction is not
     * pedantry. "What is the rank of A" and "what is its kernel" are the
     * sentences the material is about; the first answer is a count nothing here
     * can compute in one step and the second is a LINE. What a task can return
     * is the number that DECIDES each — the cross product that puts a second
     * direction in the image, the triple product that refuses a third, the dot
     * product that accepts or rejects a candidate kernel vector, and the
     * subtraction the theorem is — so that is what the objectives claim, and
     * the deciding is in the `socratic` phrasings, asked by a tutor and marked
     * by nothing.
     */
    objectives: [
      {
        id: 'produce-the-two-values-that-pin-the-rank',
        statement:
          'Produce the cross product that shows two columns of a matrix reach independent ' +
          'directions and the triple product that shows a third one reaches no further — the two ' +
          'values that bound the rank from below and from above.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-value-that-decides-kernel-membership',
        statement:
          'Produce the value a row of a matrix returns on a candidate kernel vector, and the ' +
          'value it returns on a near miss — which is what makes the kernel one particular line ' +
          'rather than a shape to be recognised.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-count-the-theorem-hands-back',
        statement:
          'Produce the rank a stated nullity forces with no elimination performed, and the value ' +
          'showing a vector the image misses — which is the direction the kernel cost.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-rank-counts-the-directions-the-columns-reach',
        conceptId: 'rank-nullity',
        statement:
          'Ax is x₁ times the first column plus x₂ times the second and so on, so everything the ' +
          'map can reach is a combination of the columns: the image IS their span. Its dimension ' +
          'is the rank. Counting columns is therefore not counting directions — three columns can ' +
          'reach a plane and no more, and the rank is the honest count of how far the map gets.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points. The arithmetic is
         * a cross product and a dot product, both timed where they are taught,
         * and what this concept adds is two counts and a trade between them. A
         * timing target on "which direction did the kernel cost" measures
         * typing, which is the case types.ts names when it argues the field
         * should usually be absent.
         */
        workedExample: {
          problem:
            'A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]]. Find the rank of A, and say which set the ' +
            'image actually is.',
          subgoals: [
            {
              label: 'Read the image off the columns rather than off the rows',
              detail:
                'Ax = x₁(1, 2, 1) + x₂(2, 4, 1) + x₃(3, 6, 1), because the jth column is where ' +
                'the jth basis vector lands and the map respects addition and scaling. So as x ' +
                'runs over everything, Ax runs over exactly the span of the three columns — the ' +
                'image is a span, which is why a dimension can be asked of it at all. The rows ' +
                'say which vectors are KILLED and are the next point; they do not say what is ' +
                'reached.',
              socratic:
                'Write Ax out as a combination of A\'s three columns. As x ranges over the whole ' +
                'of space, what set does Ax range over — and is that a set you already know how ' +
                'to put a dimension on?',
            },
            {
              label: 'Bound the count from below with the first two columns',
              detail:
                'c₁ = (1, 2, 1) and c₂ = (2, 4, 1), and the independence test in space is the ' +
                'cross product: c₁ × c₂ = (2·1 − 1·4, 1·2 − 1·1, 1·4 − 2·2) = (−2, 1, 0). It is ' +
                'not the zero vector, so the two columns are independent and the image contains ' +
                'the whole plane they span. The rank is at least 2. And the answer is useful ' +
                'twice: a cross product is perpendicular to both inputs, so (−2, 1, 0) is the ' +
                'normal of that plane.',
              socratic:
                'c₁ = (1, 2, 1) and c₂ = (2, 4, 1). What does c₁ × c₂ come to, what does a ' +
                'non-zero answer entitle you to say about the rank — and what else is that ' +
                'particular vector good for?',
            },
            {
              label: 'Bound it from above by asking the third column one question',
              detail:
                'A vector lies in the plane exactly when its dot product with the normal is ' +
                'zero, so test c₃ = (3, 6, 1): (−2)·3 + 1·6 + 0·1 = −6 + 6 = 0. It is in the ' +
                'plane, so it adds no direction and the rank is exactly 2. Note what this did ' +
                'NOT need: the weights that write c₃ in terms of the other two are nowhere in ' +
                'the calculation. Membership is settled before anybody finds them, which is the ' +
                'same move the dimension concept made with a triple product.',
              socratic:
                'The plane the first two columns span has normal (−2, 1, 0). What single number ' +
                'decides whether c₃ = (3, 6, 1) lies in that plane, what is it here, and did you ' +
                'have to find how c₃ is built out of c₁ and c₂ to get it?',
            },
            {
              label: 'Name the image instead of settling for its size',
              detail:
                'The normal is (−2, 1, 0), so the image is the set of (x, y, z) with −2x + y = ' +
                '0, which is the plane y = 2x — with z free, so it really is a plane in space ' +
                'rather than a line. All three columns satisfy it: 2 = 2·1, 4 = 2·2, 6 = 2·3. ' +
                'So "rank 2" is not merely a smaller number than 3; it says A crushes the whole ' +
                'of space onto one plane, and the rank is the dimension of the thing left.',
              socratic:
                'Turn the normal (−2, 1, 0) into an equation on (x, y, z). Which plane is that, ' +
                'do all three columns satisfy it — and what does a rank of 2 rather than 3 tell ' +
                'you about where every output of A lives?',
            },
          ],
          answer:
            'the rank is 2, and the image is the plane y = 2x — the first two columns are ' +
            'independent and the third lies in the plane they span',
        },
      },
      {
        id: 'the-kernel-is-what-the-map-kills-and-the-nullity-counts-it',
        conceptId: 'rank-nullity',
        statement:
          'The kernel is the set of x with Ax = 0. It passes the three subspace checks — the ' +
          'zero vector is in it, and a sum or a multiple of killed vectors is killed — so it is ' +
          'a space in its own right and has a dimension, called the nullity. A kernel vector is ' +
          'the same thing as a dependence among the columns, read the other way round: its ' +
          'components ARE the weights that combine the columns to nothing.',
        position: 2,
        workedExample: {
          problem:
            'Same A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]]. Find its kernel and the nullity, and say ' +
            'what a kernel vector tells you about the columns.',
          subgoals: [
            {
              label: 'Reduce the rows instead of guessing a vector',
              detail:
                'Ax = 0 is three equations: x + 2y + 3z = 0, 2x + 4y + 6z = 0, x + y + z = 0. ' +
                'Row 2 minus twice row 1 is 0 = 0 and tells you nothing — which is the rank being ' +
                '2 showing up as a row rather than as a column. Row 3 minus row 1 is ' +
                '−y − 2z = 0. Two surviving equations in three unknowns, so one unknown is left ' +
                'free and the kernel is a line rather than a point.',
              socratic:
                'Write Ax = 0 as three equations and take row 2 minus twice row 1. What is left ' +
                'of that equation, how many of the three are then saying something, and what ' +
                'does that leave you free to choose?',
            },
            {
              label: 'Back-substitute from the equation with fewest unknowns',
              detail:
                '−y − 2z = 0 gives y = −2z. Putting that into x + 2y + 3z = 0 gives x − 4z + 3z ' +
                '= 0, so x = z. Choosing z = 1 gives k = (1, −2, 1), and every multiple of it is ' +
                'in the kernel too. One free choice means one dimension: the nullity is 1, and ' +
                'the kernel is the line through (1, −2, 1).',
              socratic:
                'From −y − 2z = 0 and x + 2y + 3z = 0, write x and y in terms of z. Which vector ' +
                'does z = 1 give you, and how many independent choices did you make on the way ' +
                'to it?',
            },
            {
              label: 'Check against the original rows and not the reduced ones',
              detail:
                'Row 1: 1 − 4 + 3 = 0. Row 2: 2 − 8 + 6 = 0. Row 3: 1 − 2 + 1 = 0. All three, ' +
                'so Ak = 0 and k really is in the kernel. Checking against the rows you reduced ' +
                'TO would only confirm the arithmetic of the reduction; checking against the ' +
                'rows you started with is what confirms the answer to the question asked. And ' +
                'each check is a dot product of a row with k, which is the one calculation this ' +
                'point can be tested on.',
              socratic:
                'Take k = (1, −2, 1) back to the three rows you started with. What does each row ' +
                'return on it — and why is checking there worth more than checking against the ' +
                'reduced rows?',
            },
            {
              label: 'Read the same three numbers as weights on the columns',
              detail:
                'Ak = 1·c₁ + (−2)·c₂ + 1·c₃, so Ak = 0 says c₁ − 2c₂ + c₃ = 0, which rearranges ' +
                'to c₃ = 2c₂ − c₁: (4, 8, 2) − (1, 2, 1) = (3, 6, 1). That is exactly the ' +
                'redundancy the previous point established with a triple product, and the two ' +
                'calculations are one fact. A non-zero kernel and dependent columns are the same ' +
                'claim, which is why a map that kills something cannot reach everything.',
              socratic:
                'Multiply out Ak as a combination of the columns with k\'s components as the ' +
                'weights. Which column does that equation let you write in terms of the other ' +
                'two, and where did you meet that same redundancy before?',
            },
          ],
          answer:
            'the kernel is the line through (1, −2, 1), so the nullity is 1 — and those three ' +
            'numbers are the weights showing c₃ = 2c₂ − c₁',
        },
      },
      {
        id: 'the-two-counts-add-to-the-number-of-columns',
        conceptId: 'rank-nullity',
        statement:
          'Rank plus nullity is the number of COLUMNS, never the number of rows. Elimination ' +
          'gives each column exactly one label — pivot or free — and the pivots count the ' +
          'image\'s directions while the free ones count the kernel\'s, so neither count can ' +
          'move without the other moving the other way. Knowing one of the two is knowing both.',
        position: 3,
        workedExample: {
          problem:
            'Check the theorem on A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]], then spend it on ' +
            'C, which has 5 columns, 40 rows and a kernel that is a plane.',
          subgoals: [
            {
              label: 'Add the two counts and see nothing is left over',
              detail:
                'The rank came out 2 and the nullity 1, and A has three columns: 2 + 1 = 3. The ' +
                'elimination is where that comes from rather than from the answers happening to ' +
                'fit. It found two pivots — x and y were pinned — and left z free, and three ' +
                'columns had between them exactly those three labels.',
              socratic:
                'You have a rank of 2 and a nullity of 1. What do they come to, which of A\'s ' +
                'three measurements does that match, and which step of the work handed out the ' +
                'three labels being counted?',
            },
            {
              label: 'See why no column can take both labels or neither',
              detail:
                'A pivot column\'s unknown is determined once the free ones are chosen, so it ' +
                'contributes no freedom to the kernel; a free column\'s unknown is chosen, so it ' +
                'contributes one. Every column gets one label and no column gets two, so the two ' +
                'counts partition the columns — which is why they must add to the number of ' +
                'columns and not merely happen to. This is a count of A\'s INPUTS, so the number ' +
                'of rows cannot appear in it.',
              socratic:
                'Each unknown is either pinned by a pivot or free to choose. Can one be both, can ' +
                'it be neither — and which of A\'s two dimensions is therefore the one the two ' +
                'counts have to add up to?',
            },
            {
              label: 'Read the theorem as a trade, with the condition it needs',
              detail:
                'A is square, so inputs and outputs live in the same space, and there the ' +
                'theorem is a trade: nullity 1 forces rank 2, so the image is a plane and some ' +
                'vector of space is not hit. (0, 1, 0) is one — the normal test gives ' +
                '(−2)·0 + 1·1 + 0·0 = 1, not zero. What is lost on the way in is missed on the ' +
                'way out. The condition is real and the trade fails without it: a matrix with ' +
                '2 rows and 4 columns has nullity at least 2 while its image can still be the ' +
                'whole of its two-dimensional target, so it kills two directions and misses none.',
              socratic:
                'A kills a line, so its image is a plane rather than the whole of space. Test ' +
                '(0, 1, 0) against the normal (−2, 1, 0) — is it hit? And would that trade still ' +
                'read the same way if A had 2 rows and 4 columns?',
            },
            {
              label: 'Spend it in the direction that saves the elimination',
              detail:
                'C has 5 columns and a kernel of dimension 2, so the rank is 5 − 2 = 3 and no ' +
                'row of C was looked at. The 40 rows are the number a reader reaches for and the ' +
                'theorem never touches: they bound nothing here, because the count being ' +
                'partitioned is the columns. So at most 3 of C\'s 5 columns are independent, ' +
                'and the image is 3-dimensional — three facts about a grid nobody reduced.',
              socratic:
                'C has 5 columns, 40 rows, and a kernel that is a plane. What is its rank, which ' +
                'of the two measurements did you use — and how much of C did you have to look at?',
            },
          ],
          answer:
            '2 + 1 = 3 for A, whose image misses (0, 1, 0); and C has rank 5 − 2 = 3, so at most ' +
            'three of its five columns are independent',
        },
      },
    ],
  },

  {
    id: 'least-squares',
    name: 'Least squares',
    subjectId: subject.id,
    scope: {
      id: 'least-squares',
      label: 'Least squares',
      /*
       * Carried VERBATIM from the map node, which is what four of the five
       * promotions into this file did and is the right default: the pattern
       * decides against an article title, so widening it in the same edit that
       * makes the material appear leaves no way to say which change moved the
       * title table.
       *
       * Checked for the `\b`-after-a-bracket fault first, since that trap is
       * invisible otherwise — `fidelityMismatches` asks only whether a checked
       * concept HAS a pattern, and the recognition figure counts patterns
       * rather than testing them. There is no bracket and no alternation here,
       * and "squares" ends in a word character, so the trailing `\b` is a real
       * boundary. One alternative, live.
       *
       * WHAT IT REACHES AND WHAT OF THAT THIS MATERIAL IS. The pattern claims
       * "Least squares", "Linear least squares" and "Ordinary least squares",
       * which are this concept — and also "Total least squares" and "Partial
       * least squares regression", which are different estimators: the first
       * minimises perpendicular distance to the line rather than vertical
       * distance, the second projects onto latent components first. Both are
       * still least-squares fits in an inner product, so the pattern decides
       * correctly that an article about them is about THIS, and the material is
       * narrower than the pattern — which is the ordinary case for every
       * concept here and the reason `fidelity` is about the pattern deciding
       * membership rather than about the article being covered.
       *
       * AND IT OVERLAPS `linear-regression`, WHICH IS A NODE AND NOT A FAULT.
       * That node's pattern is `/\b(linear regression|ordinary least
       * squares)\b/i`, so "Ordinary least squares" is claimed by both. Nothing
       * rejects two patterns matching one title — `atlasProblems` rejects a
       * colliding ID, not a colliding match — and the overlap is honest: that
       * article is the arithmetic here plus the inference there. Narrowing
       * either would move the title table, which is deliberately not done in
       * the same commit as material.
       */
      hint: 'least squares normal equations projection residual regression',
      match: /\bleast squares\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, as the four concepts above it do
     * and for the reason stated there: the build ships no `justify` task
     * anywhere, so an objective naming that kind names an observation that
     * cannot be made.
     *
     * The statements are written to what `evaluate` can evidence, which took
     * the same care it took one concept up. "Fit a line to this data" and "why
     * is that the best fit" are the sentences the material is about and neither
     * is a number. What a task can return is the coefficient the normal
     * equation forces, the sum of squared misses it leaves, the value that same
     * test returns at a WRONG coefficient, and the count of ways one fit can be
     * named — so that is what the objectives claim, and the deciding is in the
     * `socratic` phrasings, asked by a tutor and marked by nothing.
     */
    objectives: [
      {
        id: 'produce-the-coefficient-and-the-least-miss-it-leaves',
        statement:
          'Produce the coefficient that makes an unsolvable one-column system miss least, the ' +
          'sum of squared misses it leaves, and that same coefficient by the averaging route — ' +
          'the three numbers that say what "best" was taken to mean and that it was not invented ' +
          'here.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-test-that-accepts-and-the-one-that-rejects',
        statement:
          'Produce the value the normal equation returns at the best coefficient and at a wrong ' +
          'one, and the larger sum of squared misses the wrong one leaves — which is what makes ' +
          '"least" a claim that was checked rather than a name.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-two-coefficients-and-the-count-of-ways-to-name-them',
        statement:
          'Produce the value that decides whether two columns\' normal equations interact, the ' +
          'coefficient each one forces on its own, the sum of squared misses the resulting fit ' +
          'leaves, and the dimension of the set of coefficients producing that same fit when a ' +
          'column is repeated.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-unsolvable-system-still-has-a-least-miss',
        conceptId: 'least-squares',
        statement:
          'Ax = b has no solution exactly when b is not a combination of the columns, which is ' +
          'the usual case once there are more equations than unknowns — and three measurements ' +
          'of one quantity is already that case. Least squares replaces "solve it" with "miss by ' +
          'as little as possible", and the quantity made small is ⟨r, r⟩ for r = b − Ax: the SUM ' +
          'of the squared misses, which is what the name says and is not its square root. The ' +
          'two have the same minimiser, because the root is increasing, so taking it would ' +
          'change the number and not the answer. For a single column a the minimiser is already ' +
          'derived: it is the projection coefficient x̂ = ⟨b, a⟩/⟨a, a⟩, which the previous ' +
          'concept forced out of the demand that the remainder be perpendicular.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points, which follows the
         * four concepts above. The arithmetic is inner products and a quotient,
         * both timed where they are taught, and what this concept adds is a
         * choice of what to minimise, a proof that the choice is met, and a
         * count. A timing target on "which average have you just taken"
         * measures typing, which is the case types.ts names when it argues the
         * field should usually be absent.
         */
        workedExample: {
          problem:
            'Three measurements of one quantity give x = 2, x = 3 and x = 7 — the system ' +
            'x·a = b with a = (1, 1, 1) and b = (2, 3, 7). No x satisfies all three. Find the x ' +
            'that leaves the least sum of squared misses, and that sum.',
          subgoals: [
            {
              label: 'Settle that there is no solution before looking for a substitute',
              detail:
                'A solution would make b a multiple of a, and every multiple of (1, 1, 1) has ' +
                'its three components equal. b = (2, 3, 7) does not, so no x works and the ' +
                'question has to be replaced rather than pressed harder. What replaces it is a ' +
                'CHOICE — x is to make the miss r = b − xa small — and "small" has to be pinned ' +
                'down before it decides anything.',
              socratic:
                'What do the three components of any multiple of (1, 1, 1) have in common? ' +
                'Compare that with b = (2, 3, 7) — and once you have, what question are you ' +
                'going to answer instead of the one that has no answer?',
            },
            {
              label: 'Pin "small" to the squared miss and watch the root disappear',
              detail:
                'Take the size of r to be ⟨r, r⟩ = r₁² + r₂² + r₃², which is the quantity this ' +
                'concept is named for. The length of r is its square root, and the two rise and ' +
                'fall together as x moves, so they are minimised by the same x: taking the root ' +
                'would change the number reported and not the answer chosen. That is why this ' +
                'concept sits inside a subject that has declined √⟨u, u⟩ since the dot product — ' +
                'it never needed it, and the only reason to notice is that the name of the thing ' +
                'is "least squares" rather than "least distance".',
              socratic:
                '⟨r, r⟩ and its square root rise and fall together as x moves. Which of the two ' +
                'is worth minimising then, and what does working with that one save you from ' +
                'having to write down?',
            },
            {
              label: 'Force the coefficient instead of searching for it',
              detail:
                'The previous concept has already done this: splitting b as xa + r and demanding ' +
                '⟨r, a⟩ = 0 gives ⟨b, a⟩ = x⟨a, a⟩, so x = ⟨b, a⟩/⟨a, a⟩ with nothing chosen on ' +
                'the way. Here ⟨b, a⟩ = 2 + 3 + 7 = 12 and ⟨a, a⟩ = 1 + 1 + 1 = 3, so x̂ = 12/3 ' +
                '= 4 and the projection is 4a = (4, 4, 4). What is new is not the formula but the ' +
                'reason to want it: over there the split was an identity about any two vectors, ' +
                'and here it is the answer to a question that has no exact one. Why ' +
                '"perpendicular remainder" and "least sum of squares" are the same condition is ' +
                'the next point and is not assumed here.',
              socratic:
                'The split of b into a multiple of a plus a perpendicular remainder has a forced ' +
                'coefficient. What are ⟨b, a⟩ and ⟨a, a⟩ for these two vectors, and what does ' +
                'their quotient make x̂?',
            },
            {
              label: 'Add up the miss that is left, and name the average you have just taken',
              detail:
                'r = b − 4a = (2 − 4, 3 − 4, 7 − 4) = (−2, −1, 3), so ⟨r, r⟩ = 4 + 1 + 9 = 14. ' +
                'That 14 is the least this sum can be made and not a measure of a mistake — ' +
                'there is no x anywhere that does better, which the next point proves. Now look ' +
                'at 12/3 again: with a = (1, 1, 1) the formula ⟨b, a⟩/⟨a, a⟩ reads "add the ' +
                'components and divide by how many there are" for ANY b, so the least-squares ' +
                'fit of a constant is the MEAN. So the mean being the number that minimises the ' +
                'squared deviations is not a separate fact about lists — it is this projection ' +
                'with a column of ones. And the authored summaries subject already says the ' +
                'signed deviations from a mean total zero, which is ⟨r, a⟩ = −2 − 1 + 3 = 0: this ' +
                'concept\'s own condition under another name. A column that is NOT all ones gives ' +
                'a weighted answer instead — the slope in the third point is one of those, and it ' +
                'is not an average of anything.',
              socratic:
                'Subtract 4a from b and add up the squares. Then look at 12/3 once more: with ' +
                'a = (1, 1, 1), what does ⟨b, a⟩/⟨a, a⟩ do to any b at all — and what is that ' +
                'operation usually called?',
            },
          ],
          answer:
            'x̂ = 4, leaving r = (−2, −1, 3) and ⟨r, r⟩ = 14 — and with a = (1, 1, 1) that ' +
            'coefficient is the mean of the three measurements',
        },
      },
      {
        id: 'the-normal-equation-is-what-makes-it-least',
        conceptId: 'least-squares',
        statement:
          'The condition ⟨b − x̂a, a⟩ = 0 — the normal equation — does not merely produce a ' +
          'candidate, it is what makes the candidate least. Write any other choice as x = x̂ − d. ' +
          'Then b − xa = r + da, and because ⟨r, a⟩ = 0 the Pythagorean relation of the ' +
          'orthogonality point applies: ⟨b − xa, b − xa⟩ = ⟨r, r⟩ + d²⟨a, a⟩. The second term is ' +
          'a square times a positive number, so it can only ADD — which says the minimum is at ' +
          'd = 0, and that the price of being wrong by d is d²⟨a, a⟩. No calculus and no trying ' +
          'of values; and if ⟨r, a⟩ were not zero the cross term 2d⟨r, a⟩ would survive, could be ' +
          'made negative, and some other x would beat x̂.',
        position: 2,
        workedExample: {
          problem:
            'Same a = (1, 1, 1) and b = (2, 3, 7), with x̂ = 4 and ⟨r, r⟩ = 14. Check the normal ' +
            'equation at x = 4, see what it returns at x = 5, and get the sum of squared misses ' +
            'at x = 5 twice — once from the split and once by adding the squares.',
          subgoals: [
            {
              label: 'Put the residual to the column and get back the zero it was solved for',
              detail:
                'r = (−2, −1, 3) and a = (1, 1, 1), so ⟨r, a⟩ = −2 − 1 + 3 = 0. That zero is the ' +
                'normal equation holding — and it is worth being clear about how little it ' +
                'proves on its own, because x̂ was solved for out of this very condition. It ' +
                'confirms the arithmetic. That the condition picks the LEAST miss rather than ' +
                'merely a tidy one is a separate claim, and the rest of this point is it.',
              socratic:
                'What does ⟨r, a⟩ come to for r = (−2, −1, 3)? Given that x̂ was solved for out ' +
                'of exactly that equation, what has the zero told you that you did not already ' +
                'put in?',
            },
            {
              label: 'Break the condition on purpose and read the direction off the sign',
              detail:
                'At x = 5 the residual is b − 5a = (−3, −2, 2), and ⟨b − 5a, a⟩ = −3 − 2 + 2 = ' +
                '−3, which is not zero — so the test rejects 5. The sign says which way to move, ' +
                'and the clean way to see that is to write the test as ⟨b, a⟩ − x⟨a, a⟩ = 12 − ' +
                '3x: positive below 4, zero at 4, negative above. So a negative value means more ' +
                'of a has been taken out than b had in it and x must come down. One expression ' +
                'both accepts the answer and points at the correction, which is what makes it a ' +
                'test rather than a ritual.',
              socratic:
                'Recompute b − xa at x = 5 and take its inner product with a. Writing the test as ' +
                '⟨b, a⟩ − x⟨a, a⟩, does a negative answer mean x is too big or too small?',
            },
            {
              label: 'Spend the split instead of recomputing the miss',
              detail:
                'x = 5 is x̂ − d with d = −1, so the split gives ⟨b − 5a, b − 5a⟩ = 14 + ' +
                '(−1)²·3 = 17 with nothing squared component by component: the 14 was already in ' +
                'hand and the 3 is ⟨a, a⟩. Read as a formula it says the penalty for missing x̂ ' +
                'by 1 is 3, by 2 is 12 and by 10 would be 300 — growing with the SQUARE of the ' +
                'error and in proportion to the size of the column. The second factor is the ' +
                'surprising one: the same error in x costs more when a is longer, because a ' +
                'wrong coefficient is multiplied through every component.',
              socratic:
                'x = 5 misses the best coefficient by 1. What does ⟨r, r⟩ + d²⟨a, a⟩ give for the ' +
                'sum of squared misses there, and how much of that did you have to get from the ' +
                'components?',
            },
            {
              label: 'Check the split against the direct sum, since a derivation never checked is a hope',
              detail:
                'Directly: b − 5a = (−3, −2, 2) and 9 + 4 + 4 = 17. The two routes agree, and ' +
                'the reason they agree is the cross term 2d⟨r, a⟩ vanishing — the normal equation ' +
                'used a second time, for the thing that matters rather than for the thing it was ' +
                'solved for. That is the whole argument: "the remainder is perpendicular" and ' +
                '"the sum of squares is least" are one condition and not two, and 17 against 14 ' +
                'is that claim in numbers for one competitor. The claim covers all of them at ' +
                'once because d was never given a value in the derivation.',
              socratic:
                'Add the squares of b − 5a straight out. Does it match the split — and which term ' +
                'in the expansion of ⟨r + da, r + da⟩ had to vanish for the two to have agreed?',
            },
          ],
          answer:
            '⟨r, a⟩ = 0 at x = 4 and −3 at x = 5, where the sum of squared misses is ' +
            '14 + 1·3 = 17 by the split and 9 + 4 + 4 = 17 directly — so 4 beats 5 by exactly ' +
            '⟨a, a⟩',
        },
      },
      {
        id: 'one-normal-equation-per-column-and-a-count-for-the-rest',
        conceptId: 'least-squares',
        statement:
          'With more than one column the condition is one normal equation per column: the ' +
          'residual must be orthogonal to EVERY column, since each column is a direction the fit ' +
          'could have moved along and a component of r along one of them is a miss that could ' +
          'have been reduced. If the columns are orthogonal to each other the equations share no ' +
          'unknown and each coefficient is its own one-column problem; otherwise they are a ' +
          'system to be solved together, which is where this material stops. And the ' +
          'coefficients need not be unique: a repeated column leaves the nearest point exactly ' +
          'where it was while giving the weights a whole line to move along, whose dimension is ' +
          'the columns less the rank — the previous concept\'s count, asked about the inputs that ' +
          'produce one output rather than about the outputs.',
        position: 3,
        workedExample: {
          problem:
            'Four readings y = (2, 2, 4, 8) are taken at times t = (−3, −1, 1, 3), measured from ' +
            'the middle of the run. Fit y ≈ c + mt by least squares: find c and m and the sum of ' +
            'squared misses, then say what changes if the column of ones is written down twice.',
          subgoals: [
            {
              label: 'Write the fit as a combination of columns, so the condition is the one already derived',
              detail:
                'c + mt means c·(1, 1, 1, 1) + m·(−3, −1, 1, 3), so the fitted vector is a ' +
                'combination of two columns — u = (1, 1, 1, 1) and t — and as c and m range over ' +
                'everything it ranges over their span. Fitting is therefore projecting y onto ' +
                'that span, and the residual r = y − cu − mt has to be orthogonal to BOTH ' +
                'columns: ⟨r, u⟩ = 0 and ⟨r, t⟩ = 0. One equation per column, for the same reason ' +
                'as before — a component of r along a column could be removed by moving that ' +
                'column\'s coefficient, so a residual that failed one of the two would not be ' +
                'least.',
              socratic:
                'Write c + mt as a combination of two vectors. How many normal equations does the ' +
                'residual have to satisfy now, and what could you still do to improve the fit if ' +
                'it failed one of them?',
            },
            {
              label: 'Ask whether the two equations interact before solving either',
              detail:
                '⟨u, t⟩ = −3 − 1 + 1 + 3 = 0, so the two columns are perpendicular — which is ' +
                'what measuring the times from the middle of the run arranges, and is the reason ' +
                'to do it. With that zero, ⟨r, u⟩ = 0 reads ⟨y, u⟩ = c⟨u, u⟩ with no m in it, and ' +
                '⟨r, t⟩ = 0 reads ⟨y, t⟩ = m⟨t, t⟩ with no c: two separate one-column problems, ' +
                'each the previous point verbatim. Times measured from the start instead would ' +
                'leave ⟨u, t⟩ ≠ 0, both equations would carry both unknowns, and solving them is ' +
                'a 2×2 system — `systems-of-linear-equations`, authored in another subject and ' +
                'not something this concept rests on. So the centring is why this example can be ' +
                'done with what is in hand, and the uncentred case is a real gap rather than a ' +
                'harder version of the same thing.',
              socratic:
                'What does ⟨u, t⟩ come to for these two columns? If it is zero, what has happened ' +
                'to the m term in the first normal equation and to the c term in the second?',
            },
            {
              label: 'Take each coefficient out of its own column',
              detail:
                '⟨y, u⟩ = 2 + 2 + 4 + 8 = 16 and ⟨u, u⟩ = 4, so c = 16/4 = 4 — the mean of the ' +
                'four readings, which is what a column of ones always gives and was the first ' +
                'point\'s last subgoal. Then ⟨y, t⟩ = (−3)·2 + (−1)·2 + 1·4 + 3·8 = −6 − 2 + 4 + ' +
                '24 = 20 and ⟨t, t⟩ = 9 + 1 + 1 + 9 = 20, so m = 20/20 = 1. The fit is y ≈ 4 + t, ' +
                'which at the four times gives (1, 3, 5, 7).',
              socratic:
                'Compute ⟨y, u⟩/⟨u, u⟩ and then ⟨y, t⟩/⟨t, t⟩. What are c and m — and which of ' +
                'the two came out as a plain average of the four readings rather than as a ' +
                'weighted sum of them?',
            },
            {
              label: 'Check both equations, then read the residual and not only its total',
              detail:
                'r = y − (1, 3, 5, 7) = (1, −1, −1, 1). Both conditions hold: ⟨r, u⟩ = 1 − 1 − 1 ' +
                '+ 1 = 0 and ⟨r, t⟩ = −3 + 1 − 1 + 3 = 0, so ⟨r, r⟩ = 1 + 1 + 1 + 1 = 4 is the ' +
                'least sum of squared misses available to ANY line through this data. What the ' +
                'four numbers say beyond their total is the thing the total hides: the misses run ' +
                '+, −, −, + rather than scattering, which is a line failing to bend with data ' +
                'that bends. Whether a pattern like that is signal or noise is `linear-regression` ' +
                'and is unwritten; that node already declares this concept as what it exercises, ' +
                'so the arithmetic of the fit is here and the verdict on the model is honestly ' +
                'somewhere else.',
              socratic:
                'Subtract the fitted values from y. What do ⟨r, u⟩ and ⟨r, t⟩ come to, what is ' +
                '⟨r, r⟩ — and what do you notice about the ORDER of the four signs that their ' +
                'total cannot show you?',
            },
            {
              label: 'Write a column down twice and watch the answer stop being unique',
              detail:
                'Add a third column equal to 2u. The span does not grow — anything 2u reaches, u ' +
                'already reached — so the nearest point (1, 3, 5, 7), the residual and the 4 are ' +
                'all unchanged. What changes is the naming: the output is ' +
                '(x₁ + 2x₃)u + x₂t, so any x₁ and x₃ with x₁ + 2x₃ = 4 produce the same fit, and ' +
                '(4, 1, 0), (0, 1, 2) and (4 − 2k, 1, k) for every k are all least-squares ' +
                'solutions. One free choice is a line of them, and its dimension is the previous ' +
                'concept\'s count: three columns, rank 2, so 3 − 2 = 1. So least squares always ' +
                'has a nearest point and need not have one way of writing it down — and which ' +
                'case you are in is settled by a count rather than by a judgement.',
              socratic:
                'The third column is 2u, so what has it added to the set of vectors the fit can ' +
                'reach? If the weights on u and on 2u only matter through x₁ + 2x₃, how many of ' +
                'the three are you free to choose — and which count of the previous concept is ' +
                'that number?',
            },
          ],
          answer:
            'c = 4 and m = 1, so y ≈ 4 + t with r = (1, −1, −1, 1) and ⟨r, r⟩ = 4; and repeating ' +
            'the column of ones leaves every one of those unchanged while making the coefficients ' +
            'a line of solutions of dimension 3 − 2 = 1',
        },
      },
    ],
  },

  {
    id: 'dual-spaces',
    name: 'Dual spaces',
    subjectId: subject.id,
    scope: {
      id: 'dual-spaces',
      label: 'Dual spaces',
      /*
       * Carried VERBATIM from the map node, which is what five of the six
       * promotions into this file did and is the right default: the pattern
       * decides against an article title, so widening it in the same edit that
       * makes the material appear leaves no way to say which change moved the
       * title table.
       *
       * Checked for the `\b`-after-a-bracket fault first, since that trap is
       * invisible otherwise and this file has found it twice —
       * `fidelityMismatches` asks only whether a checked concept HAS a pattern,
       * and the recognition figure counts patterns rather than testing them.
       * There is no bracket here and the alternation is INSIDE the pattern
       * rather than at its end, so the trailing `\b` sits after "space" or
       * "basis", both of which end in a word character. Two alternatives, both
       * live.
       *
       * WHAT IT REACHES AND WHAT OF THAT THIS MATERIAL IS. It claims "Dual
       * space" and "Dual basis", which are this concept, and also "Dual space
       * (functional analysis)" and the continuous-dual half of the first — which
       * is a DIFFERENT object: the dual of an infinite-dimensional normed space,
       * where the bounded functionals are the ones anybody means and no dual
       * basis exists. The pattern decides correctly that such an article is
       * about this, and the material is narrower than the pattern, which is the
       * ordinary case for every concept here. The third point's statement says
       * finite-dimensional where the theorem needs it, so the narrowing is
       * visible to a learner and not only here.
       *
       * WHAT IT DOES NOT REACH IS "Dual norm" AND "Duality (mathematics)", and
       * both absences are correct. The first is a norm, which this subject has
       * declined since the dot product; the second is a survey of a word.
       */
      hint: 'dual space dual basis linear functional annihilator transpose',
      match: /\bdual (space|basis)\b/i,
    },
    fidelity: 'checked',
    /*
     * EVERY OBJECTIVE NAMES ONLY `evaluate`, as the five concepts above it do
     * and for the reason stated there: the build ships no `justify` task
     * anywhere, so an objective naming that kind names an observation that
     * cannot be made.
     *
     * The statements are written to what `evaluate` can evidence, and this
     * concept is the one where that gap looked widest before it was measured.
     * "What is a linear functional" and "why does the dual have the same
     * dimension" are the sentences the material is about and neither is a
     * number. What a task can return is the value a functional takes on a
     * vector it was never given, the 1 and the 0 that DEFINE a dual basis
     * element, the coordinate one of them reads off, the value a coefficient
     * row returns inside and outside its kernel, and the coordinate that one
     * equation leaves determined — so that is what the objectives claim, and
     * the deciding is in the `socratic` phrasings, asked by a tutor and marked
     * by nothing.
     */
    objectives: [
      {
        id: 'produce-the-value-a-functional-takes-on-a-vector-it-was-not-given',
        statement:
          'Produce the value a linear functional returns on a vector it was never told about, ' +
          'from its values on a basis and that vector\'s address — and that address, which is ' +
          'the quotient the previous concept\'s elimination produces and whose divisor is the ' +
          'independence test.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-what-the-coordinate-reading-functionals-return',
        statement:
          'Produce the 1 and the 0 that define a dual basis functional, the coordinate it reads ' +
          'off a third vector, and the value the expansion of a functional in that basis returns ' +
          '— the four numbers that make the dual a space of the same dimension rather than a ' +
          'name for one.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-what-a-coefficient-row-returns-inside-and-outside-its-kernel',
        statement:
          'Produce what a functional\'s coefficient row returns on a vector its equation kills ' +
          'and on one it does not, the same value after the row is doubled, and the coordinate ' +
          'the equation leaves determined — which is one equation spending one freedom, done as ' +
          'arithmetic rather than asserted.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-functional-is-fixed-by-its-values-on-a-basis',
        conceptId: 'dual-spaces',
        statement:
          'A linear functional on a space is a linear map from it to the numbers: f(a + b) = ' +
          'f(a) + f(b) and f(ca) = c·f(a), with a single number coming out rather than a vector. ' +
          'Linearity plus the previous concept\'s address makes such a rule very small to ' +
          'describe. Every vector is exactly one combination of a basis, so f(c₁u + c₂v) = ' +
          'c₁f(u) + c₂f(v), and the two values f(u) and f(v) decide f on every vector of the ' +
          'plane. Nothing constrains those two values either: any pair of numbers handed to a ' +
          'basis extends to exactly one functional. So a functional on the plane IS a pair of ' +
          'numbers, which is the first sign that the functionals have a dimension of their own.',
        position: 1,
        /*
         * No `automaticityTarget` on any of the three points, which follows the
         * five concepts above. The arithmetic is an address and a dot product,
         * both timed where they are taught — `the-cross-check` carries a target
         * for the elimination this reuses — and what this concept adds is a
         * change of object: the rule that reads a coordinate becomes a thing
         * with a coordinate of its own. A timing target on "which of these two
         * objects is the vector" measures typing, which is the case types.ts
         * makes when it argues the field should usually be absent.
         */
        workedExample: {
          problem:
            'u = (2, −1) and v = (1, 3) are the basis of the previous concept, and f is linear ' +
            'with f(u) = 3 and f(v) = −2. Find f(w) for w = (3, −5) — a vector f was told ' +
            'nothing about.',
          subgoals: [
            {
              label: 'Establish that two numbers are enough before asking for more',
              detail:
                'Linearity says f(c₁u + c₂v) = c₁f(u) + c₂f(v): the weights come out in front ' +
                'and what is left is the two values f was given. So f is already pinned on every ' +
                'vector with an address in {u, v}, which the previous concept showed is every ' +
                'vector of the plane. Nothing further about f has to be supplied — what has to ' +
                'be found is w\'s address.',
              socratic:
                'f is linear and w is some combination c₁u + c₂v. Write f(w) using only c₁, c₂, ' +
                'f(u) and f(v) — and once you have, how many more numbers about f do you need to ' +
                'be told?',
            },
            {
              label: 'Fetch the address, which is the previous concept\'s own quotient',
              detail:
                'w = 2u − v, found there by eliminating one component equation against the other ' +
                'and dividing by the cross-check 2·3 − (−1)·1 = 7. The division is legitimate ' +
                'because that 7 is not zero, which is exactly the independence of {u, v} — and ' +
                'this is where a functional needs a BASIS rather than any spanning set. A ' +
                'dependent pair would give w two addresses, and two addresses would give f two ' +
                'values at one vector, which is not a function.',
              socratic:
                'What is w\'s address in {u, v}, and which number did the elimination divide by ' +
                'to produce it? If that number had come out zero, what would have gone wrong ' +
                'with f rather than with the arithmetic?',
            },
            {
              label: 'Spend the address on the two values',
              detail:
                'f(w) = 2·f(u) + (−1)·f(v) = 2·3 + (−1)·(−2) = 6 + 2 = 8. The two minus signs ' +
                'are worth slowing down for: the second weight is −1 and the second value is −2, ' +
                'so their product ADDS. And notice what was never needed — no formula for f in x ' +
                'and y, no rule on components. Two numbers and an address.',
              socratic:
                'w = 2u − v, f(u) = 3 and f(v) = −2. What is f(w) — and what sign does the ' +
                'product of the second weight with the second value carry?',
            },
            {
              label: 'Check that the two values were free, which is what makes this a space',
              detail:
                'Nothing above used 3 and −2 being those particular numbers. Any pair would have ' +
                'given a rule, and the rule would have been linear: define g on a vector by ' +
                'finding its address and taking that same combination of the pair, and g adds ' +
                'and scales because addresses do. Two different pairs give two different ' +
                'functionals, since they already disagree at u or at v. So the functionals on ' +
                'the plane correspond exactly to pairs of numbers — and a set that corresponds ' +
                'exactly to pairs is one the next point can count a basis for.',
              socratic:
                'Nothing above depended on f(u) being 3. Hand a different pair of numbers to u ' +
                'and v: do you still get a linear rule — and could two different pairs ever ' +
                'produce the same rule?',
            },
          ],
          answer:
            '8 — and the only facts about f used anywhere were f(u) = 3, f(v) = −2 and the ' +
            'address w = 2u − v',
        },
      },
      {
        id: 'the-dual-basis-reads-coordinates-and-counts-the-same-dimension',
        conceptId: 'dual-spaces',
        statement:
          'Functionals add and scale pointwise — (f + g)(a) = f(a) + g(a) and (cf)(a) = c·f(a) ' +
          '— and every axiom of the axioms concept holds for them, so they are a vector space in ' +
          'their own right: the DUAL space. Any basis of the original gives it a basis. Let f_i ' +
          'be the functional sending the i-th basis vector to 1 and the others to 0, which the ' +
          'previous point makes a legitimate definition rather than a wish. Then f_i(w) is ' +
          'exactly the i-th coordinate of w, so the dual basis is the coordinate-reading ' +
          'functionals — and there are as many of them as there are basis vectors. That is the ' +
          'theorem: a finite-dimensional space and its dual have the same dimension.',
        position: 2,
        workedExample: {
          problem:
            'With u = (2, −1) and v = (1, 3) again, write the two dual basis functionals f₁ and ' +
            'f₂ as rules on the components (x, y), check them on u and v, and express the f of ' +
            'the previous point — f(u) = 3, f(v) = −2 — in terms of them.',
          subgoals: [
            {
              label: 'Settle that the functionals are a space before counting a basis for one',
              detail:
                'Add two functionals by adding what they return. The sum is linear: (f + g)(a + ' +
                'b) = f(a + b) + g(a + b) = f(a) + f(b) + g(a) + g(b), which regroups into ' +
                '(f + g)(a) + (f + g)(b) because numbers may be added in any order. Scaling is ' +
                'the same argument, the zero functional sends every vector to 0, and −f is f ' +
                'with its output negated — so the three-part test of the axioms concept passes ' +
                'and a dimension is something this set HAS. Without that step, "the dual has the ' +
                'same dimension" compares a number against nothing.',
              socratic:
                'Functionals are added by adding what they return. Before asking how many ' +
                'directions that set has, which fact about it has to be settled first — and ' +
                'which concept\'s three checks settle it?',
            },
            {
              label: 'Define the two coordinate readers and solve for their rules',
              detail:
                'Let f₁(u) = 1, f₁(v) = 0 and f₂(u) = 0, f₂(v) = 1 — allowed by the previous ' +
                'point, which established that the values on a basis may be any numbers at all. ' +
                'To get f₁ as a rule in x and y, use the previous concept\'s coordinate formula: ' +
                'the first coordinate of (x, y) is (3x − y)/7 and the second is (x + 2y)/7, so ' +
                'f₁(x, y) = (3x − y)/7 and f₂(x, y) = (x + 2y)/7. Checking the first: f₁(u) = ' +
                '(6 + 1)/7 = 1 and f₁(v) = (3 − 3)/7 = 0, which is what f₁ was asked for. The 7 ' +
                'is the cross-check once more — every coordinate in this basis divides by it, so ' +
                'every one of these functionals carries it in a denominator.',
              socratic:
                'The first coordinate of (x, y) in {u, v} is (3x − y)/7. What does that ' +
                'expression give at u = (2, −1) and at v = (1, 3), and why are those two answers ' +
                'exactly the ones f₁ was defined by?',
            },
            {
              label: 'Read a coordinate as a value and recognise the pair',
              detail:
                'f₁(w) = (9 + 5)/7 = 2 and f₂(w) = (3 − 10)/7 = −1, which is w\'s address ' +
                '(2, −1) from the previous point arriving as two evaluations. That is the content ' +
                'of the dual basis rather than a consequence of it: "take the first coordinate" ' +
                'is not bookkeeping alongside the mathematics, it is a functional, and a ' +
                'vector\'s address is the list of what the dual basis returns on it.',
              socratic:
                'Evaluate f₁ and f₂ at w = (3, −5). Where in this concept have you already seen ' +
                'the pair of numbers you get?',
            },
            {
              label: 'Expand f in them, and watch the divisor cancel',
              detail:
                'Every functional equals f(u)·f₁ + f(v)·f₂, because the two sides agree at u and ' +
                'at v and the previous point says agreeing on a basis is agreeing everywhere. So ' +
                'f = 3f₁ − 2f₂. On components that is (3(3x − y) − 2(x + 2y))/7 = ' +
                '(9x − 3y − 2x − 4y)/7 = (7x − 7y)/7 = x − y, the sevenths cancelling because ' +
                'both halves were built from the same cross-check. Checking: f(u) = 2 − (−1) = 3 ' +
                'and f(v) = 1 − 3 = −2, and f(w) = 3 − (−5) = 8, which is the previous point\'s ' +
                'answer by a route that mentions neither u nor an address. The expansion also ' +
                'finishes the count. The pair SPANS, every f being such a combination; and it is ' +
                'INDEPENDENT, since af₁ + bf₂ = 0 evaluated at u gives a = 0 and at v gives ' +
                'b = 0. Two functionals against two basis vectors, which is the theorem shown in ' +
                'the plane.',
              socratic:
                'f and 3f₁ − 2f₂ agree at u and at v. What does the first point let you conclude ' +
                'about every other vector — and when you write 3f₁ − 2f₂ out over the common ' +
                'denominator 7, what becomes of the 7?',
            },
          ],
          answer:
            'f₁(x, y) = (3x − y)/7 and f₂(x, y) = (x + 2y)/7, with f₁(w) = 2 and f₂(w) = −1 ' +
            'being w\'s address; f = 3f₁ − 2f₂, which collapses to x − y; and the dual basis has ' +
            'two elements, like the basis it was built from',
        },
      },
      {
        id: 'a-functional-is-a-row-and-its-kernel-costs-one-dimension',
        conceptId: 'dual-spaces',
        statement:
          'On components every functional is a dot product with a fixed list of coefficients: ' +
          'f(x) = f(e₁)x₁ + … + f(eₙ)xₙ, since x is x₁e₁ + … + xₙeₙ and the points above take it ' +
          'from there. That list is what a ROW is, and it is why a row and a column are ' +
          'different objects rather than the same numbers written sideways — a column is a ' +
          'vector and a row is a functional waiting for one. Setting a functional to zero is a ' +
          'single linear EQUATION, and the vectors it kills are its kernel: a space, one ' +
          'dimension below the whole, because the equation determines one coordinate and leaves ' +
          'the rest free. Scaling the row does not move that kernel, so a kernel names a ' +
          'functional only up to a multiple.',
        position: 3,
        workedExample: {
          problem:
            'f(x, y, z) = 2x − y + 2z, which is the equation of the plane W of the previous ' +
            'concept. Evaluate f at a = (1, 2, 0), at c = (2, −2, −3) and at p = (1, 1, 1); say ' +
            'which vector its coefficient row is; and find the dimension of its kernel.',
          subgoals: [
            {
              label: 'Read the row off the values on the standard basis',
              detail:
                'f(e₁) = 2, f(e₂) = −1 and f(e₃) = 2, so the coefficient row is n = (2, −1, 2) ' +
                'and f(r) = n·r — the dot product of three concepts ago, with the row supplying ' +
                'one of its two arguments. That n is the plane\'s own normal vector, which the ' +
                'previous concept computed as a × b for a = (1, 2, 0) and b = (0, 2, 1). So the ' +
                'normal of a plane through the origin and the row of the functional cutting that ' +
                'plane out are the same three numbers seen from two sides.',
              socratic:
                'What does f return on each of (1, 0, 0), (0, 1, 0) and (0, 0, 1) — and where in ' +
                'the previous concept did those three answers appear together as one vector?',
            },
            {
              label: 'Separate the vectors the row kills from the ones it does not',
              detail:
                'f(a) = 2 − 2 + 0 = 0 and f(c) = 4 + 2 − 6 = 0, so a and c are both in the ' +
                'kernel — and in the previous concept those same two zeros meant "this point ' +
                'lies in W" and "this third vector adds no direction". f(p) = 2 − 1 + 2 = 3, so ' +
                'p is not: the equation fails at p, and the 3 is by how much it fails rather ' +
                'than a distance to the plane. One non-zero value is the whole of what is needed ' +
                'to know the kernel is smaller than the space, since a functional returning zero ' +
                'everywhere would be the zero functional.',
              socratic:
                'Evaluate f at a = (1, 2, 0) and at p = (1, 1, 1). Which of the two answers ' +
                'tells you the kernel is not the whole space, and what does the other one say ' +
                'about where a sits?',
            },
            {
              label: 'Count the freedom the one equation spends',
              detail:
                'Solve f = 0 for a coordinate whose coefficient is not zero: y = 2x + 2z. Now x ' +
                'and z may be chosen freely and y follows, so the kernel has two free choices ' +
                'and dimension 2 — three coordinates less the one the equation determines. ' +
                'Choosing x = 1 and z = 0 gives y = 2 and the vector (1, 2, 0), which is a; ' +
                'choosing x = 0 and z = 1 gives (0, 2, 1), which is b. The previous concept\'s ' +
                'basis of W comes back OUT of the functional instead of being handed over. The ' +
                'general statement — a non-zero functional\'s kernel is one dimension down — is ' +
                'the rank theorem\'s subtraction with an image of dimension 1, and it is spent ' +
                'here rather than proved: what this example establishes is the case a learner ' +
                'can count.',
              socratic:
                'Solve 2x − y + 2z = 0 for y. How many of the three coordinates are still free ' +
                'afterwards — and if you choose x = 1 and z = 0, which vector of the previous ' +
                'concept comes back out?',
            },
            {
              label: 'Double the row and find the kernel has not moved',
              detail:
                '2f has row (4, −2, 4), and 2f(c) = 8 + 4 − 12 = 0 — still zero, and not because ' +
                'of anything about c: doubling a number that is zero leaves it zero, so 2f kills ' +
                'exactly what f kills. The two functionals are different, agreeing at no vector ' +
                'except the ones they both send to 0, and the kernel cannot tell them apart. So ' +
                'a plane through the origin does not name one equation, it names a whole line of ' +
                'them — which is why "the" equation of a plane is only ever determined up to a ' +
                'multiple, and why 4x − 2y + 4z = 0 draws the same picture as 2x − y + 2z = 0.',
              socratic:
                'Evaluate the doubled row (4, −2, 4) against c = (2, −2, −3). Given your answer, ' +
                'can a kernel ever tell you which multiple of the row it came from?',
            },
          ],
          answer:
            'f(a) = 0, f(c) = 0 and f(p) = 3; the row is n = (2, −1, 2), the plane\'s own ' +
            'normal, so f(r) = n·r; and the kernel is W, of dimension 2 — three coordinates less ' +
            'the one coordinate the single equation determines',
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

  /*
   * THE TWENTY-SECOND PROMOTION'S TWO EDGES, AND THE REASON THERE IS NO THIRD.
   *
   * `basis-and-dimension` declared BOTH of its `needs` here —
   * `vector-spaces` and `linear-independence` — and both are concepts of this
   * ontology, so the whole of what the node stranded is the two entries below
   * and no area `links` entry was owed. That is the same cheapest shape the
   * axioms had one promotion earlier, and this time it was two edges rather
   * than one: a promotion's `links` cost is about where each `needs` POINTS,
   * not about how many there are.
   *
   * It is no longer a leaf, which the note above this one said the axioms were.
   * The axioms are now an interior concept of the subject with this one hanging
   * off them, and the subject has gained a second branch point: the axioms fork
   * into nothing else, but `linear-independence` now has two dependents here.
   *
   * THE THREE EDGES OUT SURVIVED UNTOUCHED, which is the half of a departure
   * that needs no action and looks like the dangerous half. `rank-nullity` and
   * `eigenvalues` are nodes of `linear-algebra` and `field-extensions` is a
   * node of `abstract-algebra`; all three name this concept in their OWN
   * `needs`, so those edges are declared at the far end and resolve across the
   * file boundary in `composeAtlas`. Three dependents in two different areas is
   * also what made this the candidate worth taking.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of any area named
   * `basis-and-dimension` at either end — checked before the node was deleted —
   * so there was no duplicate edge to remove. That case is real and no test
   * catches it; see the deleted first entry of `LINEAR_ALGEBRA.links`.
   *
   * AND THE NODE DECLARED NO `confusedWith` AND NO `exercises`, checked on it
   * before deletion rather than inferred from the suites passing afterwards.
   * `expandEdges` turns a `confusedWith` into an `interferes_with`, which
   * constrains SELECTION rather than gating, so losing one leaves every suite
   * green while freeing the scheduler to introduce the two most confusable
   * concepts in a subject together.
   *
   * ── THE `encompasses` EDGE THIS FILE HAS REFUSED THREE TIMES IS TAKEN ─────
   *
   * And it is taken on the test the three refusals were made with, not against
   * it: the claim is about what PRACTISING exercises, measured against the
   * tasks that exist rather than against the prose. Two of the six tasks below
   * this concept compute the cross-check and compute it as the whole of their
   * arithmetic — `basis-coordinate-1` divides by `u1*v2 - u2*v1`, which is
   * `cross-check-independent-1`'s `given` written symbol for symbol, and
   * `one-vector-is-not-enough-1` IS that expression with `w` for `v`. A learner
   * cannot produce a coordinate in this concept without producing the
   * independence number on the way, so a cross-check demonstrated here should
   * not come due as though untouched.
   *
   * ONE EDGE AND NOT THREE, which is the part worth stating. `linear-
   * independence` already claims credit down to `vectors-and-spans`, which
   * claims it down to `plane-vectors`, and `encompassedClosure` is transitive —
   * so this single edge credits the span and the components at depths 2 and 3
   * with no further declaration. A second edge straight to `vectors-and-spans`
   * would have been defensible on `basis-reconstruct-1`, whose `given` is
   * `span-plane-1`'s verbatim, and would have added nothing but a duplicate
   * route. And no edge runs back to `vector-spaces`: nothing in these tasks
   * tests a subset for closure or touches an axiom, so credit for the axioms
   * would be claimed on material that never exercises them.
   */
  {
    id: 'vector-spaces->basis-and-dimension',
    from: 'vector-spaces',
    to: 'basis-and-dimension',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'The count is a count of a SPACE, so there has to be a space to count the directions of. ' +
      'The axioms are also what makes the answer worth more than an observation about pairs: a ' +
      'dimension is a fact about any set with the two operations, and the polynomials and ' +
      'functions the axioms admit are where the count stops being the length of a component ' +
      'list.',
  },
  {
    id: 'linear-independence->basis-and-dimension',
    from: 'linear-independence',
    to: 'basis-and-dimension',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'A basis is a spanning set that is independent, so half of the definition is the previous ' +
      'concept, and the cross-check is the arithmetic every coordinate here divides by. A ' +
      'learner who has not met the test reads "and independent" as a tidiness condition rather ' +
      'than as the thing that makes an address single-valued.',
  },
  {
    id: 'basis-and-dimension=>linear-independence',
    from: 'basis-and-dimension',
    to: 'linear-independence',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Finding a coordinate in a basis means dividing by the cross-check, and ruling out a ' +
      'one-element basis means computing one: two of this concept\'s six tasks have ' +
      '`u1*v2 - u2*v1` as their whole arithmetic, which is the independence concept\'s own task ' +
      'verbatim. So a cross-check demonstrated here has been demonstrated, and should not come ' +
      'due as though it had not.',
  },

  /*
   * THE TWENTY-THIRD PROMOTION'S THREE EDGES, AND THE SECOND BRANCH THEY CLOSE.
   *
   * `inner-product-spaces` declared BOTH of its `needs` here —
   * `vector-spaces` and `dot-product-geometry` — so both stranded edges are the
   * two entries below and no area `links` entry was owed, the same cheapest
   * shape the two promotions above had. It is the third promotion running into
   * this file whose whole `links` cost is nothing.
   *
   * WHAT IS NEW IS THE SHAPE OF IT IN THE SUBJECT. The twenty-second promotion
   * added a second branch POINT — `linear-independence` gained two dependents —
   * and this one is the first concept here to JOIN two branches back together.
   * The dot product forked off `plane-vectors` at the second concept and the
   * span line ran on through independence to the axioms; this rests on one end
   * of each, so the two lines that separated five concepts ago meet. That is
   * worth a line because it is what makes the concept's own derivation possible
   * rather than merely allowed: it needs a product that returns a number, which
   * is the fork, and a set with the axioms on it, which is the other.
   *
   * THE THREE EDGES OUT SURVIVED UNTOUCHED, which is the half of a departure
   * that needs no action and looks like the dangerous half. `spectral-theorem`
   * and `least-squares` are nodes of `linear-algebra` and
   * `functional-analysis-intro` is a node of `real-analysis`, two map files
   * apart; all three name this concept in their OWN `needs`, so those edges are
   * declared at the far end and resolve across the file boundary in
   * `composeAtlas`.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of any area named
   * `inner-product-spaces` at either end — checked before the node was deleted,
   * because two identical edges in the composed graph is not a redundancy
   * `composeAtlas` notices and no suite catches it.
   *
   * AND THE NODE DECLARED NO `confusedWith` AND NO `exercises`, checked on it
   * before deletion rather than inferred from the suites passing afterwards.
   * `expandEdges` turns a `confusedWith` into an `interferes_with`, which
   * constrains SELECTION rather than gating, so losing one leaves every suite
   * green while freeing the scheduler to introduce the two most confusable
   * concepts in a subject together.
   *
   * ── THE `encompasses` EDGE, TAKEN, AND POINTED AT THE FORK ───────────────
   *
   * On the same test the three refusals in this file were made with: the claim
   * is about what PRACTISING exercises, measured against the tasks that exist
   * rather than against the prose. Two of the six tasks below have a dot
   * product as the whole of their arithmetic —
   * `perpendicular-under-the-dot-rule-1`'s `given` is `u1*v1 + u2*v2`, which is
   * `dot-product-1`'s written symbol for symbol, and
   * `projection-coefficient-1` divides that same expression by
   * `u1*u1 + u2*u2`, which is `dot-product-self-1`'s. A learner cannot produce
   * a projection coefficient here without producing both of the dot product's
   * own numbers on the way.
   *
   * THE THIRD CANDIDATE IS DECLINED AND NAMING IT IS THE POINT.
   * `orthogonal-remainder-1` is a dot product too — `(v1 - c*u1)*u1 +
   * (v2 - c*u2)*u2` — but one of its two vectors is computed inside the
   * expression and never written as a pair, which is the shape the thirteenth
   * promotion deliberately excluded from its own count (`plane-membership-1`'s
   * `2*x - y + 2*z`) and the twentieth used to refuse an edge outright. Two,
   * not three, so the claim is stated at the shape a regex can see.
   *
   * ONE EDGE AND NOT TWO. `dot-product-geometry` already claims credit down to
   * `plane-vectors` and `encompassedClosure` is transitive, so this single edge
   * credits the components at depth 2 with nothing else declared — asserted by
   * DEPTH in tests/concepts-logic.mjs, so the transitivity is checked rather
   * than assumed. And NO edge runs back to `vector-spaces`: nothing in these
   * tasks tests a subset for closure or touches an axiom. The axioms are what
   * this concept's prose generalises over, which is not the same as what its
   * arithmetic exercises, and `encompasses` is read by the scheduler as the
   * second.
   */
  {
    id: 'vector-spaces->inner-product-spaces',
    from: 'vector-spaces',
    to: 'inner-product-spaces',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'The whole content of this concept is that a rule obeying three properties is enough, and ' +
      '"enough for what" is the axioms: it is because a space is any set with the two ' +
      'operations that a weighted rule on the plane and an integral of two functions are the ' +
      'same object. A learner without the axioms reads the properties as a longer definition of ' +
      'the dot product rather than as what replaces it.',
  },
  {
    id: 'dot-product-geometry->inner-product-spaces',
    from: 'dot-product-geometry',
    to: 'inner-product-spaces',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'This is that product generalised, so there has to be one to generalise. The specific ' +
      'debt is the split: the cosine identity is derived by writing b as a multiple of a plus ' +
      'something perpendicular to a, and the third point here is that split computed — so the ' +
      'projection arrives as the thing a previous argument assumed rather than as a new formula.',
  },
  {
    id: 'inner-product-spaces=>dot-product-geometry',
    from: 'inner-product-spaces',
    to: 'dot-product-geometry',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Two of this concept\'s six tasks are a dot product and nothing else: one has ' +
      '`u1*v1 + u2*v2` as its whole `given`, which is the product\'s own task verbatim, and the ' +
      'projection coefficient divides that by `u1*u1 + u2*u2`, which is the self-product\'s. So ' +
      'the product has been demonstrated by anybody who has produced a coefficient here, and ' +
      'should not come due as though untouched.',
  },

  /*
   * THE THIRTIETH PROMOTION'S TWO EDGES, AND THE FIRST `links` COST THIS FILE
   * HAS OWED IN FOUR PROMOTIONS.
   *
   * `rank-nullity` declared two `needs` and they point at two different
   * subjects, which is the shape the three promotions above did not have.
   * `basis-and-dimension` is a concept of this ontology, so that edge is the
   * entry below like any other. `gaussian-elimination` is authored in
   * `expressions-and-equations` — and an ontology's edges may only name
   * concepts it CONTAINS, so being authored in another subject fails that test
   * exactly as being unwritten would. It is a `links` entry of
   * `LINEAR_ALGEBRA` in atlas-structures.ts, filed with the area that OWNED
   * the departing node rather than with the subject holding the far end, which
   * is the rule when neither end is local. It gates immediately, both ends
   * having material.
   *
   * Worth stating against the note three sections up, which calls a single
   * stranded edge "the cheapest shape a promotion can have" and was then
   * corrected by the twenty-second: the cost is about where each `needs`
   * POINTS. Two edges into one ontology is free; one edge out of it is not,
   * and this concept has one of each.
   *
   * THE FOUR EDGES OUT SURVIVED UNTOUCHED, and they reach further than any
   * previous departure from that area. `diagonalisation` and `least-squares`
   * are nodes of `linear-algebra`; `homology` is a node of `topology` and
   * `multiple-regression` a node of `statistics`, in a map file this subject
   * has never touched. All four name this concept in their OWN `needs`, so all
   * four are declared at the far end and resolve across the file boundary in
   * `composeAtlas`. Four dependents in three areas is also what made this the
   * candidate worth taking: no journey asked for it, every route being written.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of any area named `rank-nullity`
   * at either end — checked before the node was deleted, because two identical
   * edges in the composed graph is not a redundancy `composeAtlas` notices and
   * no suite catches it.
   *
   * AND THE NODE DECLARED NO `confusedWith` AND NO `exercises`, checked on it
   * before deletion rather than inferred from the suites passing afterwards.
   * `expandEdges` turns a `confusedWith` into an `interferes_with`, which
   * constrains SELECTION rather than gating, so losing one leaves every suite
   * green while freeing the scheduler to introduce the two most confusable
   * concepts in a subject together. The `exercises` absence CHOSE nothing here
   * and that is worth a line: an `encompasses` edge whose ends land in two
   * ontologies is expressible nowhere, so a node carrying one can only be filed
   * in the subject holding the far end — and this node's two `needs` are in two
   * subjects, so had it carried one the filing would have been forced.
   *
   * ── THE `encompasses` EDGE, TAKEN, AND POINTED AT THE COUNT ──────────────
   *
   * On the same test the three refusals in this file were made with: the claim
   * is about what PRACTISING exercises, measured against the tasks that exist
   * rather than against the prose. THREE of the six tasks below have a
   * `basis-and-dimension` task's `given` verbatim.
   * `image-two-columns-independent-1`'s is `u2*v3 - u3*v2`, which is
   * `plane-basis-cross-product-1`'s written symbol for symbol; and
   * `image-third-column-adds-nothing-1` and `what-the-kernel-costs-the-image-1`
   * are both `n1*r1 + n2*r2 + n3*r3`, which is `third-vector-redundant-1`'s. A
   * learner cannot bound a rank here without producing the dimension concept's
   * own two numbers on the way.
   *
   * THE THREE OTHERS ARE DECLINED AND NAMING THEM IS THE POINT. The two kernel
   * tasks are a dot product of a matrix ROW against a candidate, which is not
   * any task of the dimension concept, and `rank-from-the-nullity-1` is a
   * subtraction of two counts. Three of six, so the claim is stated at the
   * shape a regex can see.
   *
   * ONE EDGE AND NOT FOUR. `basis-and-dimension` already claims credit down to
   * `linear-independence`, which claims it down to `vectors-and-spans`, which
   * claims it down to `plane-vectors` — and `encompassedClosure` is transitive,
   * so this single edge credits three further concepts at depths 2, 3 and 4
   * with nothing else declared. Asserted by DEPTH in tests/concepts-logic.mjs,
   * so the transitivity is checked rather than assumed, and it is the deepest
   * chain this file has.
   *
   * AND NO EDGE TO `three-dimensional-coordinates`, THOUGH THE CROSS PRODUCT IS
   * ITS OWN TASK VERBATIM — `image-two-columns-independent-1` is
   * `cross-product-component-1`'s `given` symbol for symbol. The refusal is on
   * the COUNT: that is ONE task of six, below the bar every credit edge in this
   * file has been taken at, and `basis-and-dimension` had the identical case
   * one promotion earlier with its own `plane-basis-cross-product-1` and
   * declined it. The tempting reason — that the concept is not on this one's
   * prerequisite path — is FALSE and is recorded because the first draft of
   * this comment used it: the three dimensions gate `vectors-and-spans`, which
   * the thirteenth promotion inserted them above, so they are on every path
   * through this subject. tests/concepts-logic.mjs asserts the reachability in
   * the direction that caught that.
   */
  {
    id: 'basis-and-dimension->rank-nullity',
    from: 'basis-and-dimension',
    to: 'rank-nullity',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'A rank and a nullity are both dimensions, so the count has to exist before either can be ' +
      'asked for — and the specific debt is sharper than that. The rank is found by deciding how ' +
      'many of the columns are independent directions, which is the previous concept\'s own ' +
      'squeeze applied to a particular set of vectors; a learner without it reads "rank 2" as a ' +
      'label the elimination produced rather than as the dimension of the plane the map lands on.',
  },
  {
    id: 'rank-nullity=>basis-and-dimension',
    from: 'rank-nullity',
    to: 'basis-and-dimension',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Three of this concept\'s six tasks are the dimension concept\'s own arithmetic verbatim: ' +
      'the cross product that bounds the rank from below is `plane-basis-cross-product-1`\'s ' +
      '`given`, and the two triple products that bound it from above and name a vector the image ' +
      'misses are `third-vector-redundant-1`\'s. So somebody who has pinned a rank has counted ' +
      'directions, and the count should not come due as though untouched.',
  },

  /*
   * THE FORTY-FIRST PROMOTION'S THREE EDGES, AND A `links` COST OF ZERO.
   *
   * `least-squares` declared two `needs` and BOTH are concepts of this
   * ontology — `inner-product-spaces` and `rank-nullity`, the two directly
   * above it — so both stranded edges are entries below and no area owes
   * anything. That is the cheapest shape a promotion has, it is the second time
   * running it has been available, and it is what decided the pick: of the
   * seven unrefused ready nodes, only this one and `dual-spaces` had it.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of any area named this node at
   * either end — checked against `AREAS.flatMap(a => a.links)` before the node
   * was deleted, because a `links` entry whose far end lands in the receiving
   * ontology becomes a duplicate of the edge declared here, and two identical
   * edges in the composed graph is not a redundancy `composeAtlas` notices.
   *
   * THE TWO EDGES OUT SURVIVED UNTOUCHED, and they cross two map files.
   * `singular-value-decomposition` is a node of `linear-algebra` and
   * `linear-regression` is a node of `statistics`, in atlas-uncertainty.ts;
   * both name this concept in their OWN `needs`, so both are declared at the
   * far end and resolve in `composeAtlas` — the half of a departure that needs
   * no action and whose failure mode is not an error but a node quietly rooted
   * with nothing above it. Those two dependents are also the third factor that
   * separated this node from `dual-spaces`, which ties it on the second and has
   * none.
   *
   * AND THE NODE DECLARED NO `confusedWith` AND NO `exercises`, checked on it
   * before deletion rather than inferred from the suites passing afterwards.
   * `expandEdges` handles all THREE edge-bearing node fields and the third is
   * the one no checklist named until the fortieth promotion found it:
   * `confusedWith` becomes an `interferes_with`, which constrains SELECTION
   * rather than gating, and `exercises` becomes an `encompasses`, which between
   * two ontologies is expressible nowhere and would therefore have FORCED the
   * filing. Both absent, so the filing was argued on content.
   *
   * WHAT IS NOT ABSENT IS AN `encompasses` EDGE POINTING THE OTHER WAY, AND IT
   * ARRIVES FROM A MAP NODE RATHER THAN FROM HERE. `linear-regression`, a node
   * of `statistics` in atlas-uncertainty.ts, declares both
   * `needs: [..., 'least-squares']` and `exercises: ['least-squares']` — so the
   * claim that fitting a regression line exercises this concept is already in
   * the build, declared at the far end, and it starts doing work the day
   * somebody writes that node. Nothing here had to create it and nothing here
   * may: an authored ontology may only name concepts it contains.
   *
   * ── THE `encompasses` EDGE DOWN, TAKEN, AND THE ONE DECLINED ────────────
   *
   * Taken to `inner-product-spaces`, on the same test the refusals in this file
   * were made with: the claim is about what PRACTISING exercises, measured
   * against the tasks that exist rather than against the prose. FIVE of the ten
   * tasks are an inner-product-spaces expression at more components —
   * `least-squares-coefficient-1` and `the-slope-from-its-own-column-1` are
   * `projection-coefficient-1`'s quotient of two inner products at three and
   * four terms, `normal-equation-holds-1` and
   * `normal-equation-rejects-and-points-1` are `orthogonal-remainder-1`'s
   * remainder-against-the-column at three, and
   * `the-two-columns-do-not-interact-1` is the orthogonality test at four.
   *
   * THE ARITY CHANGE IS WHY THE BAR IS WORTH RESTATING. This file's usual
   * phrasing for a credit edge is "a task's `given` symbol for symbol", and not
   * one of the five is that: all ten tasks here work in three or four
   * components where every task of both prerequisites works in two or three.
   * The precedent is `three-dimensional-coordinates=>dot-product-geometry`
   * above, taken on "four of this concept's eight tasks evaluate a THREE-TERM
   * dot product" against a concept whose own tasks are two-term — so an
   * extension of the same formula to more components has already counted here,
   * and the verbatim phrasing is the proxy rather than the rule. Five of ten is
   * above every bar this file has taken an edge at (two of six twice, three of
   * six, four of eight).
   *
   * DECLINED TO `rank-nullity`, and naming the failing count is the point.
   * Exactly ONE task touches it — `how-many-ways-to-name-the-same-fit-1`,
   * which is `n - p` — and that task spends the theorem rather than producing
   * either count: nothing in it reduces anything, bounds a rank or tests a
   * kernel vector, and the rank of 2 is handed to the learner in the prompt.
   * One of ten is below every bar above, and the standard the fortieth
   * promotion wrote down is sharper still: no task may be answerable without
   * the other concept's work. A learner who has never met a rank can answer
   * 3 − 2. So the prerequisite edge gates and the credit edge does not exist,
   * which is the right pair — the count is needed to UNDERSTAND the answer and
   * is not exercised by producing it.
   *
   * ONE EDGE AND NOT THREE. `inner-product-spaces` already claims credit down
   * to `dot-product-geometry`, which claims it down to `plane-vectors`, and
   * `encompassedClosure` is transitive — so this single edge credits three
   * concepts at depths 1, 2 and 3 with nothing else declared. Asserted by DEPTH
   * in tests/concepts-logic.mjs, so the transitivity is checked rather than
   * assumed.
   */
  {
    id: 'inner-product-spaces->least-squares',
    from: 'inner-product-spaces',
    to: 'least-squares',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'The coefficient this concept calls the least-squares solution IS the projection ' +
      'coefficient derived there, forced out of the demand that the remainder be perpendicular — ' +
      'and the proof that it is least is that concept\'s Pythagorean relation with the cross ' +
      'term killed by the same zero. A learner without the split reads ⟨b, a⟩/⟨a, a⟩ as a ' +
      'formula to remember and the normal equation as a coincidence, rather than as one ' +
      'condition met twice.',
  },
  {
    id: 'rank-nullity->least-squares',
    from: 'rank-nullity',
    to: 'least-squares',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Whether the system has a solution at all is whether the target is in the image, which is ' +
      'the span of the columns — so the rank is what says how much a fit can reach and the ' +
      'shortfall is why there is nothing to solve. The sharper debt is uniqueness: a repeated ' +
      'column leaves the nearest point alone and makes the coefficients a line, and the ' +
      'dimension of that line is the columns less the rank. Without the count, "the answer is ' +
      'unique but the way of naming it is not" is a puzzle rather than a subtraction.',
  },
  {
    id: 'least-squares=>inner-product-spaces',
    from: 'least-squares',
    to: 'inner-product-spaces',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Five of this concept\'s ten tasks are that concept\'s own arithmetic at three or four ' +
      'components: two divide one inner product by another, which is the projection ' +
      'coefficient\'s `given` extended; two take the residual\'s inner product with the column, ' +
      'which is the orthogonal remainder\'s; and one is the orthogonality test on a pair of ' +
      'columns. Nobody can produce a least-squares fit here without computing inner products ' +
      'and dividing by a self-product, so that concept should not come due as though untouched.',
  },

  /*
   * THE FORTY-SECOND PROMOTION'S TWO EDGES, A `links` COST OF ZERO, AND A
   * BRANCH RATHER THAN A CONTINUATION.
   *
   * `dual-spaces` declared ONE `need` and it is a concept of this ontology —
   * `basis-and-dimension`, four concepts above rather than the one directly
   * above — so the single stranded edge is the entry below and no area owes
   * anything. That is the cheapest shape a promotion has, it is the third time
   * running it has been available, and it is what decided the pick: of the six
   * unrefused ready nodes, only this one had it.
   *
   * THE EDGE DOES NOT COME FROM `least-squares` AND MUST NOT BE WRITTEN AS
   * THOUGH IT DID. This concept is written last in the array and rests on
   * neither of the two above it, so `basis-and-dimension` now has two
   * dependents in this file where it had one. An assertion phrased as an
   * ordered walk through the subject would accept this edge hung off the least
   * squares by accident; `tests/concepts-logic.mjs` asserts the branch POINT
   * instead, which is the same correction the twenty-third promotion made for
   * the dot product.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of any area named this node at
   * either end — checked against `AREAS.flatMap(a => a.links)` before the node
   * was deleted, because a `links` entry whose far end lands in the receiving
   * ontology becomes a duplicate of the edge declared here, and two identical
   * edges in the composed graph is not a redundancy `composeAtlas` notices.
   *
   * AND THERE WAS NO EDGE OUT AT ALL, which is the first time that has been
   * true of a promotion from this build and is exactly the third factor this
   * node lost on. `dependentsOf` returns nothing: no node and no concept in any
   * file names `dual-spaces` in its `needs` or its `exercises`. So the half of
   * a departure that usually needs no action needed none because there was
   * none, and the usual failure mode — a far node quietly rooted with nothing
   * above it — cannot occur here. What that costs is real and is recorded in
   * the header: this promotion unlocks nobody, and the node that would have
   * unlocked four is `eigenvalues`.
   *
   * AND THE NODE DECLARED NO `confusedWith` AND NO `exercises`, checked on it
   * before deletion rather than inferred from the suites passing afterwards.
   * `expandEdges` handles all THREE edge-bearing node fields and two of them
   * strand SILENTLY: `confusedWith` becomes an `interferes_with`, which
   * constrains SELECTION rather than gating, and `exercises` becomes an
   * `encompasses`, which between two ontologies is expressible nowhere. Both
   * absent, so the filing was argued on content.
   *
   * ── THE `encompasses` EDGE DOWN, TAKEN ON A VERBATIM `given` AT LAST ─────
   *
   * Taken to `basis-and-dimension`, on the same test every credit edge in this
   * file was taken with: the claim is about what PRACTISING exercises, measured
   * against the tasks that exist rather than against the prose. FOUR of the
   * eleven tasks here compute a `basis-and-dimension` task's `given` SYMBOL FOR
   * SYMBOL, which is this file's usual phrasing and which the forty-first
   * promotion could not meet at all — `the-address-a-functional-is-spent-on-1`
   * is `basis-coordinate-1`'s coordinate quotient at new inputs, and the three
   * row tasks are `third-vector-redundant-1`'s triple product at new inputs.
   *
   * ONE OF THE FOUR IS WORTH MORE THAN THE OTHER THREE AND THE NOTE SAYS SO
   * RATHER THAN COUNTING TO FOUR. `basis-coordinate-1`'s quotient
   * `(v2*w1 - v1*w2)/(u1*v2 - u2*v1)` belongs to that concept and to nothing
   * else in the build: it is the coordinate formula with the cross-check as its
   * divisor. The triple product `n1*r1 + n2*r2 + n3*r3` is that concept's too,
   * but it is ALSO `plane-constant-1`'s and `cross-product-perpendicular-1`'s —
   * the file records the sharing at `third-vector-redundant-1` itself — so
   * three of the four are evidence of a dot product rather than of a dimension
   * count. One exclusive match and three shared is the honest reading, and it
   * is still above the bars this file has taken an edge at (two of six twice,
   * three of six, four of eight, five of ten), because the substantive claim
   * does not rest on the arithmetic alone: all THREE knowledge points consume
   * either an address or a dimension count, and neither is a thing this concept
   * produces for itself.
   *
   * NO SECOND CREDIT EDGE, AND THE REASON IS TRANSITIVITY RATHER THAN A
   * JUDGEMENT. `basis-and-dimension` already claims credit down to
   * `linear-independence`, which claims it down to `vectors-and-spans`, and
   * `encompassedClosure` is transitive — so this one edge credits three
   * concepts at depths 1, 2 and 3 with nothing else declared. The tempting
   * extra is an edge to `dot-product-geometry`, since the third point's whole
   * content is that a functional IS a dot product with a row; it is declined
   * because the credit already arrives there transitively through the
   * dimension, and declaring it again would make the depth figures in
   * tests/concepts-logic.mjs assert a shape the closure did not need.
   */
  {
    id: 'basis-and-dimension->dual-spaces',
    from: 'basis-and-dimension',
    to: 'dual-spaces',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'A functional is decided by its values on a basis, and that claim is false without the ' +
      'previous concept\'s theorem: it holds because every vector has exactly ONE address, which ' +
      'is independence, and because every vector has one at all, which is spanning. A learner ' +
      'without the address reads "the values on a basis determine f" as a convention about how ' +
      'functionals are written down rather than as a consequence, and has no way to compute ' +
      'f(w) for a w nobody supplied a value for. The sharper debt is the dual basis itself — its ' +
      'two functionals ARE that concept\'s coordinate formulas, cross-check divisor and all, so ' +
      'without them the pair comes out of nowhere; and the dimension count the whole second ' +
      'point exists to make is that concept\'s own number applied to a different space.',
  },
  {
    id: 'dual-spaces=>basis-and-dimension',
    from: 'dual-spaces',
    to: 'basis-and-dimension',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Four of this concept\'s eleven tasks are that concept\'s own `given` symbol for symbol ' +
      'at new inputs: one is the coordinate quotient whose divisor is the cross-check, which no ' +
      'other task in the build computes, and three are the triple product it shares with the ' +
      'cross-product tasks of the concept below it. Beyond the arithmetic, every one of the ' +
      'three knowledge points consumes an address or a dimension and none of them produces one ' +
      '— the first spends a coordinate, the second builds the functionals that read coordinates ' +
      'and counts them, and the third counts the dimension one equation leaves. Nobody can ' +
      'practise the dual without counting directions, so that concept should not come due as ' +
      'though untouched.',
  },
]

export const VECTORS_AND_INDEPENDENCE: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
