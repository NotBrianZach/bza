/**
 * Structures: the objects, and the mathematics of reasoning about them.
 *
 * Five areas — linear algebra, discrete mathematics, number theory, abstract
 * algebra, topology. They are grouped because what they share is a method: fix
 * a set with some structure on it, and ask what follows from the structure
 * alone.
 *
 * ── WHY `logic-and-proof` LIVES IN DISCRETE RATHER THAN AT THE ROOT ───────
 *
 * Logically it comes first. Pedagogically it does not: a reader with no
 * experience of a proof has nothing to formalise, which is why
 * `geometric-proof` in the foundations is the real entry point and this is the
 * second pass. The prerequisite edge runs from the geometry, and that direction
 * is deliberate.
 */

import type { MapArea } from './atlas'

const LINEAR_ALGEBRA: MapArea = {
  id: 'linear-algebra',
  name: 'Linear algebra',
  covers:
    'Vectors, matrices and linear maps, from dimension and rank through to the spectral ' +
    'theorem and the singular value decomposition. Row reduction is no longer here: it is ' +
    'authored as `gaussian-elimination` in `expressions-and-equations`, since the engine has ' +
    'no matrix type and every question the method can be asked is about a number the ' +
    'elimination produces, which makes the material equations rather than grids. Nor are the ' +
    'AXIOMS, nor the DIMENSION, nor the INNER PRODUCT: `vector-spaces`, `basis-and-dimension` ' +
    'and `inner-product-spaces` are all three authored in `vectors-and-independence`, the ' +
    'subject that made the span and independence arguments the axioms are a summary of, that ' +
    'owns the cross-check every coordinate divides by, and that owns the one product of two ' +
    'vectors returning a number. NOR IS THE RANK, which is the sentence this area has now had to ' +
    'withdraw: it used to say the area begins at "what a MAP does to them, which is a rank and a ' +
    'kernel", and `rank-nullity` is authored in that same subject as of the thirtieth promotion — ' +
    'because a rank and a nullity are dimensions, and the question "how many directions does ' +
    'this reach" belongs with the concept that taught the counting rather than with the grids. So ' +
    'this area begins one question later still, and the question is the EIGENVALUE: not how far a ' +
    'map reaches, but which directions it leaves alone. The definition of a space, the count of ' +
    'its directions, the rule that gives it angles and the measure of what a map hits and kills ' +
    'are all somewhere a learner arrives from the plane rather than from the top of this list. ' +
    'NOR IS THE BEST ANSWER TO AN UNSOLVABLE SYSTEM, which is the half of the next sentence this ' +
    'area has now had to withdraw as well. It used to read "what is still here and rests on the ' +
    'last two of those is the ORTHOGONALITY THAT IS A THEOREM rather than a definition: a ' +
    'symmetric matrix having an orthonormal eigenbasis, and the best answer to an unsolvable ' +
    'system being a projection onto a column space" — and `least-squares` is authored in ' +
    '`vectors-and-independence` as of the forty-first promotion, because what it minimises is a ' +
    'SUM OF SQUARED misses, which is an inner product, and the condition picking the minimiser ' +
    'is the projection the subject that owns the inner product had already derived. So what is ' +
    'still here is the FIRST half of that sentence alone: a symmetric matrix having an ' +
    'orthonormal eigenbasis, which really does rest on the eigenvalue this area begins at and ' +
    'cannot be reached from the inner product by itself. ' +
    'FIVE THINGS A SECOND COURSE COVERS WERE MISSING FROM THIS LIST AND HAVE BEEN ADDED: the ' +
    'canonical form a matrix takes when it has too few eigenvectors, the fact that a matrix ' +
    'satisfies its own characteristic polynomial and the least polynomial that it does, the ' +
    'classification of quadratic and bilinear forms by the signs of their eigenvalues, the dual ' +
    'space a row vector lives in, and the power series that turns a linear system of ' +
    'differential equations into a formula. They were absent by content and not merely under ' +
    'other names, which is the check worth stating: `similarity` is a concept of ' +
    '`plane-geometry` about figures, so matrix similarity stays a search term of ' +
    '`diagonalisation` rather than becoming a sixth node here. ' +
    'AND THE FOURTH OF THOSE FIVE HAS ALREADY LEFT, which is the sentence this area has to ' +
    'withdraw one addition after making it: `dual-spaces` is authored in ' +
    '`vectors-and-independence` as of the forty-second promotion, because a functional is ' +
    'decided by its values on a BASIS and the dual basis is built out of the coordinate ' +
    'formulas that subject already owns — so the dual needs an address and a dimension count ' +
    'and no eigenvalue at all, which is the same argument that moved the axioms, the dimension, ' +
    'the inner product, the rank and the least squares. It was added here and promoted out of ' +
    'here within three weeks, and both halves were right: the gap was real, and this was never ' +
    'where the material belonged once somebody wrote it. What is still here of the five is the ' +
    'canonical form, the characteristic polynomial, the quadratic forms and the matrix ' +
    'exponential, and every one of those genuinely rests on the eigenvalue this area begins at.',
  nodes: [
    {
      id: 'eigenvalues',
      match: /\beigen(value|vector|decomposition)/i,
      name: 'Eigenvalues and eigenvectors',
      is: 'Directions a map only stretches, which is what reduces an iterated map to arithmetic on numbers.',
      needs: ['determinant', 'basis-and-dimension', 'polynomial-roots'],
      terms: 'eigenvalue eigenvector characteristic polynomial spectrum',
    },
    {
      id: 'diagonalisation',
      match: /\bdiagonali[sz]able\b|\bdiagonali[sz]ation\b/i,
      name: 'Diagonalisation',
      is: 'Choosing a basis of eigenvectors so the matrix becomes diagonal — and the obstruction when there are not enough.',
      needs: ['eigenvalues', 'rank-nullity'],
      terms: 'diagonalisation similar matrices multiplicity eigenbasis',
    },
    {
      id: 'spectral-theorem',
      match: /\bspectral theorem\b/i,
      name: 'The spectral theorem',
      is: 'A symmetric matrix has an orthonormal eigenbasis and real eigenvalues — the cleanest theorem in the subject.',
      needs: ['diagonalisation', 'inner-product-spaces'],
      terms: 'spectral theorem symmetric matrix orthogonal diagonalisation orthonormal eigenbasis',
    },
    {
      id: 'singular-value-decomposition',
      match: /\bsingular value decomposition\b/i,
      name: 'The singular value decomposition',
      is: 'Every matrix is a rotation, a scaling and another rotation — which is why low-rank approximation works.',
      needs: ['spectral-theorem', 'least-squares'],
      terms: 'singular value decomposition svd low rank approximation pseudoinverse',
    },
    {
      id: 'numerical-linear-algebra',
      match: /\bnumerical linear algebra\b|\bmatrix decomposition\b/i,
      name: 'Numerical linear algebra',
      is: 'Conditioning, LU and QR factorisation, iterative methods — where floating point makes the exact theory insufficient.',
      needs: ['singular-value-decomposition', 'gaussian-elimination'],
      terms: 'condition number lu decomposition qr iterative method stability',
    },
    /*
     * ── THE FIVE BELOW WERE ADDED BECAUSE THE MAP WAS THIN, NOT TO BUY ROOM ──
     *
     * Worth separating, because the two readings suggest opposite standards.
     * This area had six nodes against a floor of five when these were written,
     * so adding them does raise the headroom — but the floor was fixed in the
     * same change, by `departed` below, and it was fixed FIRST for exactly this
     * reason. Nodes added to satisfy a check are topics invented to order, and
     * that is the failure the floor exists to prevent rather than a way of
     * passing it. These five are here on their own merits and would be correct
     * additions with no floor at all.
     *
     * The merit is that the area's `covers` claims the subject "from dimension
     * and rank through to the spectral theorem and the singular value
     * decomposition", and a linear algebra course that stopped where this one
     * did would have skipped the canonical form, the theorem that a matrix
     * satisfies its own characteristic polynomial, the classification of
     * quadratic forms, the dual, and the one construction that makes a linear
     * system of differential equations a formula. Those are not advanced
     * footnotes; four of the five are in every standard second course. The
     * atlas says of itself that it is "not a complete map of mathematics and
     * should not be described as one", and this is a case where the gap was
     * findable by reading the area against the subject it names.
     *
     * CHECKED FOR BY CONTENT AND NOT BY ID BEFORE BEING ADDED. `similarity` is
     * already a concept — of `plane-geometry`, about figures with equal angles —
     * so matrix similarity is deliberately NOT a node here and lives in
     * `diagonalisation`'s terms, where it was already. Two phrases moved out of
     * existing nodes' `terms` for the same reason, noted at each.
     *
     * ONE OF THE FIVE IS IMMEDIATELY READY (`dual-spaces`, whose only
     * prerequisite is authored) and the other four are not, which is the honest
     * distribution: they rest on the spectral chain this area has not written
     * yet. So this does not hand the next promotion four cheap candidates.
     *
     * AND THE ONE THAT WAS READY IS GONE, which is the sentence above coming
     * true rather than going stale. The forty-second promotion took
     * `dual-spaces`; the other four are still unready, so NONE of what remains
     * of these five is a candidate until somebody writes the spectral chain.
     * The next promotion out of this area is `eigenvalues`, which is ready, was
     * ready before these five were added, and is the gateway to four of them —
     * `cayley-hamilton` directly, and `jordan-normal-form`, `quadratic-forms`
     * and `matrix-exponential` behind `diagonalisation`.
     */
    {
      id: 'cayley-hamilton',
      match: /\bcayley[–-]hamilton\b|\bminimal polynomial\b/i,
      name: 'Cayley–Hamilton and the minimal polynomial',
      is: 'A matrix satisfies its own characteristic polynomial, and the least polynomial it satisfies is what decides whether it diagonalises.',
      needs: ['eigenvalues'],
      terms: 'cayley hamilton theorem minimal polynomial characteristic polynomial annihilating',
    },
    {
      id: 'jordan-normal-form',
      match: /\bjordan (normal|canonical) form\b/i,
      name: 'Jordan normal form',
      is: 'The canonical form when there are not enough eigenvectors: diagonal blocks with ones above the diagonal, one block per invariant factor.',
      /*
       * `diagonalisation` names "the obstruction when there are not enough" and
       * this is what the obstruction turns out to be, so the edge is the whole
       * reason the sentence over there could be written. The minimal polynomial
       * is the second prerequisite rather than a nicety: it is what decides the
       * block SIZES, and without it the form can be stated but not found.
       *
       * "jordan form" was in `diagonalisation`'s `terms` and has been removed
       * from it, since a search for the phrase should land on the node that is
       * about it rather than on the node that mentions it.
       */
      needs: ['diagonalisation', 'cayley-hamilton'],
      terms: 'jordan normal form canonical form jordan block invariant factors nilpotent',
    },
    {
      id: 'quadratic-forms',
      match: /\bquadratic form\b|\bbilinear form\b/i,
      name: 'Quadratic and bilinear forms',
      is: 'A homogeneous degree-two expression in several variables, classified by the signs of the eigenvalues of its symmetric matrix.',
      /*
       * `spectral-theorem` and not `eigenvalues`: the classification IS the
       * orthogonal diagonalisation, so a node resting on the eigenvalues alone
       * would be able to state the forms and not to sort them. "quadratic form"
       * was in that node's `terms` and has been removed from it, for the reason
       * given on the Jordan form above.
       */
      needs: ['spectral-theorem'],
      terms: 'quadratic form bilinear form signature definite congruence sylvester',
    },
    /*
     * `dual-spaces` WAS THE FOURTH OF THE FIVE AND IS A CONCEPT NOW, WHICH
     * MAKES IT THE FIRST NODE THIS BUILD ADDED AND THEN AUTHORED OUT.
     *
     * It is a concept of `vectors-and-independence`, in ontology-vectors.ts, as
     * of the forty-second promotion — so a node of the same id here would
     * collide with it and `atlasProblems` reports that as an error rather than
     * merging the two: the authored copy would be shadowed by a node with no
     * knowledge points, and a written subject would silently read as
     * unteachable.
     *
     * THE PARAGRAPH ABOVE PREDICTED THIS AND WAS RIGHT FOR THE REASON IT GAVE.
     * It said this was "the one addition resting on written material rather
     * than on this area's own chain, and so the one that is ready", and that it
     * does not hand the next promotion four cheap candidates. One of the five
     * has now been taken and the other four are still unready, which is the
     * distribution the note claimed. What it did NOT foresee is the shape of
     * the cost: a node added because the map was thin and then promoted inside
     * three weeks spent nothing of this area's territory either way, because
     * the floor counts departures.
     *
     * WHAT IT STRANDED WAS ITS ONLY `needs`, AND NOTHING ELSE AT ALL. The node
     * declared one, `basis-and-dimension`, which is authored in the SAME
     * subject the concept went to — so it is an ordinary edge in that
     * ontology's `EDGES` and there is no `links` entry here. No node and no
     * concept in any file named `dual-spaces` in its own `needs` or
     * `exercises`, so no edge pointed IN and none had to survive; it is the
     * first promotion in this build with no dependents whatever. The node also
     * declared no `confusedWith`, which is the stranding `expandEdges` performs
     * silently and that no suite reports.
     *
     * TAKING IT COST AN ARMATURE ANCHOR, for the fifth time out of this area
     * and the second running with no derivable refill. See armature.ts, where
     * the judgement and its alternative are recorded.
     */
    {
      id: 'matrix-exponential',
      match: /\bmatrix exponential\b/i,
      name: 'The matrix exponential',
      is: 'Summing a power series of a matrix, which turns a linear system of differential equations into a single closed formula.',
      /*
       * Two prerequisites in two areas, and both are load-bearing: the series
       * is what the object IS, and the diagonalisation is the only way to sum
       * it by hand. `power-series` is a node of `sequences-and-series` and
       * unwritten, so this edge crosses from map to map and resolves in
       * `composeAtlas` — declared here rather than in `links` because this end
       * is a node of this area, which is the condition `links` exists for the
       * absence of.
       */
      needs: ['diagonalisation', 'power-series'],
      terms: 'matrix exponential one parameter group linear system fundamental matrix',
    },
  ],
  /*
   * ELEVEN NODES HAVE BEEN AUTHORED OUT OF THIS AREA, which is more than any
   * other area has given up, and this is the list the stub floor reads so that
   * eleven departures count as territory covered rather than territory
   * missing. See `MapArea.departed` in atlas.ts for why the floor needed it and
   * why absence means zero.
   *
   * Four left together when ontology-matrices.ts was authored and are the four
   * the `links` block below restates the incoming edges for. The other seven
   * are one promotion each — the fourteenth, twentieth, twenty-second,
   * twenty-third, thirtieth, forty-first and forty-second — and every one of
   * them is named in `covers` above, which is where the reasoning for each move
   * lives. Nothing here is a node that merely points into this area:
   * `three-dimensional-coordinates` was authored into the same subject as six
   * of these and was a node of `euclidean-geometry`, so it is declared over
   * there and not here.
   *
   * SEVEN OF THE ELEVEN WENT TO ONE SUBJECT, which is worth noticing rather
   * than only recording. `vector-spaces`, `basis-and-dimension`,
   * `inner-product-spaces`, `rank-nullity`, `least-squares` and now
   * `dual-spaces` are all concepts of `vectors-and-independence`, and
   * `gaussian-elimination` went to the equations. The pattern is the one
   * `covers` argues at length: what this area kept is what genuinely needs an
   * eigenvalue, and almost everything that does not turns out to belong with
   * the subject a learner arrives from the plane into.
   *
   * THE LAST ENTRY IS THE ONE THAT WAS NEVER ON THE ORIGINAL MAP, and it is
   * worth separating from the other ten. `dual-spaces` was ADDED to this area
   * on 2026-11-24, when the area was read against its own `covers` and five
   * second-course topics were found missing, and it was authored out on
   * 2026-11-25. Every other name here was a node from the beginning. So this
   * list now records two different kinds of event — a node the map always had
   * and gave up, and a node the map gained and then grew material for — and the
   * second kind is what a thin area looks like when the fix works.
   */
  departed: [
    'matrices-and-maps',
    'matrix-multiplication',
    'determinant',
    'matrix-inverse',
    'gaussian-elimination',
    'vector-spaces',
    'basis-and-dimension',
    'inner-product-spaces',
    'rank-nullity',
    'least-squares',
    'dual-spaces',
  ],
  /**
   * THE FOUR EDGES THAT CAME IN TO THE AUTHORED NODES.
   *
   * `matrices-and-maps`, `matrix-multiplication`, `determinant` and
   * `matrix-inverse` are real concepts now, in ontology-matrices.ts, so they
   * had to leave this area — `atlasProblems` rejects a node colliding with an
   * authored concept.
   *
   * Removing a node removes every edge declared on its OWN `needs`, and that
   * is the whole reason this block exists. It was learned the hard way one
   * subject ago: authoring `function-concept` silently deleted
   * `variables-and-expressions → function-concept` and made that syllabus a
   * root of the entire map, practisable from a cold account by somebody who
   * had never met a letter standing for a number.
   *
   * Edges pointing the other way — `eigenvalues` needs `determinant`, and
   * `numerical-linear-algebra` needs `gaussian-elimination` — are declared on
   * the nodes that REMAIN, so they survive untouched and resolve across the
   * file boundary in `composeAtlas`. Only the incoming ones are restated here.
   * `rank-nullity` used to be named in that list for its own row-reduction
   * edge; it is an authored concept now and the edge is a `links` entry below,
   * which is the ninth departure's section.
   *
   * Two of the four reach into another authored subject rather than into the
   * map, which is exactly what `links` is for: an edge whose endpoints are
   * both outside the area declaring it.
   *
   * ── AND NOW A FIFTH, FROM THE ONE NODE THIS AREA HAS LOST SINCE ──────────
   *
   * `gaussian-elimination` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
   * It is a concept of `expressions-and-equations` now, in
   * ontology-algebra.ts, so a node of the same id here would collide with it
   * and `atlasProblems` reports that as an error rather than merging the two —
   * the authored copy would be shadowed by a node with no knowledge points,
   * and a written subject would silently read as unteachable.
   *
   * ELEVEN NODES BEFORE, TEN AFTER, against a stub floor of five. The area
   * keeps five spare, so nothing here is frozen by the departure and the two
   * nodes that rest on row reduction — `rank-nullity` and
   * `numerical-linear-algebra` — kept their edges, since both declare them.
   *
   * WHAT IT STRANDED WAS ONE HALF OF ITS OWN `needs`. The node declared two:
   * `systems-of-linear-equations` and `matrices-and-maps`. The first is
   * authored in the SAME subject the concept went to, so it is an ordinary
   * edge in that ontology's `EDGES` and is not here. The second is authored in
   * `matrices-and-determinants`, a different subject — and an authored
   * ontology's edges may only name concepts it contains, so neither ontology
   * could declare it. That is the entry below, filed with the area that OWNED
   * the departing node rather than with the subject holding the far end, which
   * is the rule when neither end is local.
   *
   * IT GATES, and that is the point of restating it: a matrix has to mean
   * something before a system is solved by reducing one. Dropping it instead
   * would have left row reduction resting on the equations alone, which is the
   * silent failure the paragraph above this one records for `function-concept`.
   *
   * AND IT STRANDED A SECOND EDGE OF A DIFFERENT KIND, WHICH `links` CANNOT
   * CARRY AND DID NOT HAVE TO. The node also declared
   * `exercises: ['systems-of-linear-equations']`, which `expandEdges` turns
   * into an `encompasses` edge; `links` produces `prerequisite` edges only, so
   * had the concept been filed in `matrices-and-determinants` — where
   * ontology-matrices.ts had reserved it — that credit edge would have joined
   * two concepts in different ontologies and been expressible nowhere at all.
   * It would have gone, in silence, with every suite green. The concept went
   * to the subject holding the far end instead, so it is an ordinary
   * `encompasses` edge there. Worth knowing that this constraint CHOSE the
   * filing: the usual question is which subject a concept belongs to, and here
   * one of the two candidate answers could not hold all of its edges.
   *
   * NOTHING WAS HANDED BACK THIS TIME, which is the comparison to make with
   * the deleted first entry below. `gaussian-elimination → determinant` is
   * still here and still has to be: this area owns neither end, the promoted
   * concept went to `expressions-and-equations` and `determinant` is in
   * `matrices-and-determinants`, so the two ends are in two different
   * ontologies and `links` remains the only home for it. A promotion hands an
   * edge back only when the promoted concept lands in the SAME ontology as the
   * far end, and that is a fact about where it was filed rather than about the
   * edge.
   *
   * `confusedWith` on the departing node: NONE. Checked before deleting it,
   * because `expandEdges` turns one into an `interferes_with` and interference
   * constrains SELECTION rather than gating — so losing one leaves every suite
   * green while freeing the scheduler to introduce the two most confusable
   * concepts in a subject together. There was none to lose, and an absence has
   * to be looked for to be known.
   *
   * ── AND A SIXTH, WHICH WAS THIS AREA'S ONLY ROOT ─────────────────────────
   *
   * `vector-spaces` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO. It is a
   * concept of `vectors-and-independence` now, in ontology-vectors.ts, so a
   * node of the same id here would collide with it and `atlasProblems` reports
   * that as an error rather than merging the two.
   *
   * NINE NODES AFTER, against a stub floor of five, so the area keeps four
   * spare and nothing here is frozen by the departure. Two departures have now
   * cost this area two of its six nodes of headroom; the third would leave
   * three, and the area has no other node whose prerequisites are written, so
   * nothing is close.
   *
   * WHAT IT STRANDED WAS ONE EDGE AND THERE IS NO `links` ENTRY FOR IT. The
   * node declared a single `needs`, `linear-independence`, which is authored in
   * the very subject the concept went to — so both ends are concepts of one
   * ontology and the edge is declared in that ontology's own `EDGES`. This is
   * the cheapest shape a promotion can have and it is why this node was chosen
   * over two candidates with more dependents: a split `needs` costs an entry
   * down here, three files from anything that mentions the concept, and that is
   * the entry people drop.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of this area named
   * `vector-spaces` at either end, so there was no duplicate edge to delete —
   * the case the first entry below records, and the one no test catches.
   *
   * THE EDGES POINTING IN SURVIVED, which is the half of a departure that
   * needs no action and is worth stating because it looks like the dangerous
   * half. `basis-and-dimension` and `inner-product-spaces` each name
   * `vector-spaces` in their OWN `needs`, so those two edges are declared on
   * nodes that remain and resolve across the file boundary in `composeAtlas`
   * untouched. Only a node's own `needs` is stranded by deleting it.
   *
   * THE AREA VIEW NOW HAS TWO ROOTS WHERE IT HAD ONE, and the direction is the
   * surprise. The departing node was the single root of this area — every other
   * node reaches it — and `areaOntology` filters each node's `needs` down to
   * the ones inside the area, so the two nodes that named ONLY `vector-spaces`
   * and something outside are now rooted themselves: `basis-and-dimension`
   * (whose other `needs` is `linear-independence`, authored elsewhere) and
   * `inner-product-spaces` (whose other is `dot-product-geometry`, likewise).
   * A promotion usually shrinks a root set or substitutes into it; promoting a
   * sole root SPLITS it into whichever dependents it was the last local
   * prerequisite of. Which is why tests/atlas.mjs asserts the set by named
   * membership and never by its length — a count would read "one became two"
   * and say nothing about which two, and getting the pair wrong is how a node
   * silently loses its only prerequisite.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER. Checked
   * before deleting it, for the reason the paragraph above this section gives.
   * The absence of `exercises` is the one that chose nothing here, and that is
   * worth a line: an `encompasses` edge whose ends land in two ontologies is
   * expressible nowhere — not in an ontology, which may only name concepts it
   * contains, and not in `links`, which hard-codes `kind: 'prerequisite'` — so
   * a node carrying one can only be filed in the subject holding the far end.
   * This one carried none, so the filing was decided on content.
   *
   * ── AND A SEVENTH, WHICH WAS ONE OF THE TWO ROOTS THE SIXTH LEFT ─────────
   *
   * `basis-and-dimension` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO. It
   * is a concept of `vectors-and-independence` now, in ontology-vectors.ts, so
   * a node of the same id here would collide with it and `atlasProblems`
   * reports that as an error rather than merging the two — the authored copy
   * would be shadowed by a node with no knowledge points, and a written subject
   * would silently read as unteachable.
   *
   * THE PARAGRAPH TWO SECTIONS UP IS NOW HALF HISTORY, and it is left standing
   * rather than rewritten because the claim it made was true and is the reason
   * this departure cost nothing. It said the two edges INTO `vector-spaces`
   * survived that promotion untouched, `basis-and-dimension` and
   * `inner-product-spaces` each declaring one in their own `needs`. One of
   * those two declarations has now gone with its node — which is the same rule
   * from the other side, and the edge did not go with it: `vector-spaces` is a
   * concept of the subject this one joined, so the stranded edge is an ordinary
   * `EDGES` entry there. The surviving half of that sentence is
   * `inner-product-spaces`, which still declares it here.
   *
   * EIGHT NODES AFTER, against a stub floor of five, so the area keeps three
   * spare. Three departures have now cost it three of its six nodes of
   * headroom. The next one would leave two and the one after that would leave
   * one, so this is the point at which the count starts mattering.
   *
   * THE SENTENCE THAT USED TO FINISH THIS PARAGRAPH WAS WRONG AND IS WORTH
   * KEEPING AS A CORRECTION. It said that of the eight remaining nodes "exactly
   * one has every prerequisite written (`inner-product-spaces`), so there is
   * one more departure available before anything else here could be authored at
   * all". THREE did. Writing `basis-and-dimension` is what made `rank-nullity`
   * and `eigenvalues` ready — they each name it in their own `needs` — so the
   * promotion this paragraph describes created two of the three candidates its
   * own last clause denied existed. Readiness was computed BEFORE the edit and
   * written down as a claim about after it, and nothing tests a sentence, so it
   * would have rotted here indefinitely. The lesson is narrow and repeatable:
   * a promotion's effect on what is READY NEXT has to be recomputed after the
   * node is deleted, not predicted from the state it was chosen in.
   *
   * WHAT IT STRANDED WAS BOTH OF ITS `needs` AND THERE IS NO `links` ENTRY FOR
   * EITHER. The node declared `vector-spaces` and `linear-independence`, and
   * both are authored concepts of the subject it went to — so both edges are
   * declared in that ontology's own `EDGES` and this area owes nothing. Worth
   * noting against the sixth departure's note above, which calls a single
   * stranded edge "the cheapest shape a promotion can have": the cost is about
   * where each `needs` POINTS and not about how many there are, and two edges
   * landing in one ontology is as cheap as one.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of this area named
   * `basis-and-dimension` at either end, so there was no duplicate edge to
   * delete — the case the first entry below records, and the one no test
   * catches.
   *
   * THE THREE EDGES POINTING IN SURVIVED. `rank-nullity` and `eigenvalues` are
   * nodes of this area and `field-extensions` is a node of `abstract-algebra`;
   * all three name the departing concept in their OWN `needs`, so those edges
   * are declared on nodes that remain and resolve across the file boundary in
   * `composeAtlas` untouched.
   *
   * THE AREA VIEW NOW HAS THREE ROOTS WHERE IT HAD TWO, AND ONLY ONE IS THE
   * SAME ONE. The departing node was a root itself, so it left the set; and it
   * was the last in-area prerequisite of `rank-nullity` (whose other `needs` is
   * `gaussian-elimination`, authored elsewhere) and of `eigenvalues` (whose
   * others are `determinant` and `polynomial-roots`, likewise), so both of them
   * are now rooted. Two out, one in, two newly in: the set went from
   * {`basis-and-dimension`, `inner-product-spaces`} to {`eigenvalues`,
   * `inner-product-spaces`, `rank-nullity`}. A promotion out of a root both
   * SHRINKS the set by its own member and SPLITS it into the dependents it was
   * the last local prerequisite of, and both halves happened here at once —
   * which is the reason tests/atlas.mjs asserts the set by named membership and
   * never by its length. Two became three, and a count saying so would make no
   * claim about which three.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER. Checked
   * before deleting it, for the reason the sixth departure's note gives. The
   * absence of `exercises` chose nothing here either, both `needs` pointing at
   * one ontology already.
   *
   * IT WAS ALSO AN `armature.ts` ANCHOR, which is the fifth file a promotion
   * can touch and the only one that is not in this directory's own dependency
   * graph. Krull anchored on it, an anchor must be a node of its region's
   * `area`, and `armatureProblems` fails loudly rather than quietly — so the
   * slot was refilled with `rank-nullity`, which inherited the departing node's
   * place in the area exactly as the departing node inherited the axioms'. That
   * is twice running for this region, and the comment there says so.
   *
   * ── AND AN EIGHTH, WHICH IS THE CHEAPEST DEPARTURE THIS AREA HAS HAD ─────
   *
   * `inner-product-spaces` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO. It
   * is a concept of `vectors-and-independence` now, in ontology-vectors.ts, so
   * a node of the same id here would collide with it and `atlasProblems`
   * reports that as an error rather than merging the two.
   *
   * SEVEN NODES AFTER, against a stub floor of five, so the area keeps two
   * spare. Four departures have now cost it four of its six nodes of headroom.
   * Recomputed rather than predicted, which is the correction the paragraph
   * above this one records: of the SEVEN that remain, two have every
   * prerequisite written — `rank-nullity` and `eigenvalues`, both made ready by
   * the twenty-second promotion — so the floor is still not what would stop the
   * next one. Two departures of headroom and two ready candidates is the first
   * time those two numbers have been equal, and it is the point at which the
   * area's own `covers` stops being able to absorb another rewrite: a fifth
   * departure leaves one spare and a sixth freezes it. What `atlas-foundations.ts`
   * says to do then is MERGE the remnant into a neighbouring area, not lower the
   * threshold, and that is a decision about the learner-facing map.
   *
   * WHAT IT STRANDED WAS BOTH OF ITS `needs` AND THERE IS NO `links` ENTRY FOR
   * EITHER. The node declared `vector-spaces` and `dot-product-geometry`, and
   * both are authored concepts of the subject it went to — so both edges are
   * declared in that ontology's own `EDGES` and this area owes nothing. That is
   * now three promotions running out of this area with a `links` cost of zero,
   * which is a fact about where `vectors-and-independence` sits rather than
   * luck: it holds every concept the unwritten half of this area rests on
   * except the row reduction and the determinant.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of this area — nor of any other —
   * named `inner-product-spaces` at either end, checked before the node was
   * deleted. That case is real and no test catches it: `composeAtlas` would
   * have produced the same edge twice and said nothing. See the deleted first
   * entry below.
   *
   * THE THREE EDGES POINTING IN SURVIVED, and they reach further than any
   * previous departure's. `spectral-theorem` and `least-squares` are nodes of
   * this area; `functional-analysis-intro` is a node of `real-analysis`, in
   * atlas-analysis.ts. All three name the departing concept in their OWN
   * `needs`, so all three are declared on nodes that remain and resolve across
   * the file boundary in `composeAtlas` untouched. Only a node's own `needs` is
   * stranded by deleting it.
   *
   * THE AREA VIEW LOST A ROOT AND GAINED NOTHING, which is the third distinct
   * shape this one area has now produced. The fourteenth promotion SUBSTITUTED
   * into the root set, the twentieth SPLIT it, the twenty-second did both at
   * once — and this one only SHRINKS it, from {`eigenvalues`,
   * `inner-product-spaces`, `rank-nullity`} to {`eigenvalues`,
   * `rank-nullity`}. The departing node was a root itself, so it left; and it
   * was the last in-area prerequisite of nothing, because both nodes that named
   * it — `spectral-theorem` and `least-squares` — name a second node of this
   * area as well (`diagonalisation` and `rank-nullity`), so neither became
   * rooted. Three became two with both survivors unchanged, and that is only
   * sayable by membership: a length check reading "three became two" would make
   * no claim about which two, and cannot tell a shrink from a shrink-and-split.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER. Checked
   * before deleting it, for the reason the sixth departure's note gives — and
   * the `exercises` absence chose nothing here either, both `needs` pointing at
   * one ontology already.
   *
   * IT WAS NOT AN `armature.ts` ANCHOR, which is the first of the four
   * departures from this area that was not. Krull's three anchors are
   * `rank-nullity`, `eigenvalues` and `diagonalisation`, and all three are
   * still nodes here, so the fifth file a promotion can touch was untouched.
   * Worth stating as an absence: the slot has turned over twice running and the
   * reason it did not a third time is that this node was never the root the
   * region anchors on.
   *
   * ── AND A NINTH, WHICH SPENDS THE SECOND-TO-LAST NODE OF HEADROOM ────────
   *
   * `rank-nullity` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO. It is a
   * concept of `vectors-and-independence` now, in ontology-vectors.ts, so a
   * node of the same id here would collide with it and `atlasProblems` reports
   * that as an error rather than merging the two — the authored copy would be
   * shadowed by a node with no knowledge points, and a written subject would
   * silently read as unteachable.
   *
   * SIX NODES AFTER, against a stub floor of five, so the area keeps ONE spare.
   * Five departures have now cost it five of its six nodes of headroom.
   * Recomputed rather than predicted, which is the correction the seventh
   * departure's note records: of the SIX that remain, exactly one has every
   * prerequisite written — `eigenvalues`, made ready by the twenty-second
   * promotion alongside this node — so for the first time the headroom and the
   * ready-candidate count are both ONE, and spending it would land the area on
   * the floor. The paragraph above predicted this as "a fifth departure leaves
   * one spare and a sixth freezes it", and the prediction is now the state.
   *
   * WHAT TO DO AT THAT POINT IS NOT TO LOWER THE FLOOR. atlas-foundations.ts
   * says to MERGE the remnant into a neighbouring area, which is a decision
   * about the learner-facing map and belongs to a person rather than to an
   * authoring run. The merge that is already precedent — `coordinate-geometry`
   * into `euclidean-geometry` — is the shape, and the neighbour here is not
   * obvious: what remains of this area is the spectral half, which sits as
   * naturally beside `real-analysis` as beside anything in the foundations.
   * Stated here rather than decided.
   *
   * WHAT IT STRANDED WAS ONE EDGE OF ITS TWO, AND THERE IS A `links` ENTRY FOR
   * IT. The node declared `basis-and-dimension` and `gaussian-elimination`.
   * The first is authored in the subject the concept went to, so that edge is
   * an ordinary entry in that ontology's own `EDGES`. The second is authored
   * in `expressions-and-equations`, a different subject — and an authored
   * ontology's edges may only name concepts it contains, so neither ontology
   * could declare it. That is the last entry below, filed with the area that
   * OWNED the departing node rather than with the subject holding the far end,
   * which is the rule when neither end is local.
   *
   * IT ENDS THREE PROMOTIONS OF ZERO `links` COST, and the eighth departure's
   * note is the reason that run had to end: it said a zero cost was "a fact
   * about where `vectors-and-independence` sits rather than luck — it holds
   * every concept the unwritten half of this area rests on except the row
   * reduction and the determinant", and this is the first departure since whose
   * `needs` reaches one of the two exceptions. The sentence was right and it
   * named its own expiry.
   *
   * IT GATES IMMEDIATELY, both ends having material, which is why dropping it
   * would be the expensive kind of silence: the concept would rest on the
   * dimension alone and a learner could reach "the nullity is the number of
   * free columns" without ever having eliminated anything.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of this area — nor of any other —
   * named `rank-nullity` at either end, checked before the node was deleted.
   * That case is real and no test catches it: `composeAtlas` would have
   * produced the same edge twice and said nothing. See the deleted first entry
   * below.
   *
   * THE FOUR EDGES POINTING IN SURVIVED, and they reach into two map files this
   * area's previous departures never touched. `diagonalisation` and
   * `least-squares` are nodes of this area; `homology` is a node of `topology`,
   * further down this same file, and `multiple-regression` is a node of
   * `statistics`, in atlas-uncertainty.ts. All four name the departing concept
   * in their OWN `needs`, so all four are declared on nodes that remain and
   * resolve across the file boundary in `composeAtlas`. Only a node's own
   * `needs` is stranded by deleting it.
   *
   * THE AREA VIEW SUBSTITUTED, WHICH IS THE FIRST SHAPE THIS AREA PRODUCED AND
   * THE FIRST ONE IT HAS REPEATED. The departing node was a root itself, so it
   * left the set; and it was the last in-area prerequisite of `least-squares`
   * (whose other `needs` is `inner-product-spaces`, authored elsewhere), so
   * that node is now rooted. `diagonalisation` named it too and did NOT become
   * rooted, `eigenvalues` being a second node of this area above it. So the set
   * went from {`eigenvalues`, `rank-nullity`} to {`eigenvalues`,
   * `least-squares`}: one out, one in, SIZE UNCHANGED AT TWO. That is exactly
   * why tests/atlas.mjs asserts the set by named membership and never by its
   * length — a count here reads "two and still two" and would pass while every
   * claim it makes about which two is stale.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER. Checked
   * before deleting it, for the reason the sixth departure's note gives. The
   * `exercises` absence CHOSE nothing here and that is worth one line, because
   * this is the first departure from this area where it could have: the node's
   * two `needs` land in two different subjects, so had it carried an
   * `encompasses` edge that edge would have joined two concepts in two
   * ontologies, which neither may declare and no `links` entry can express —
   * and the filing would have been forced to the subject holding the far end
   * rather than decided on content.
   *
   * IT WAS AN `armature.ts` ANCHOR, AND KRULL'S SLOT HAS NOW TURNED OVER THREE
   * TIMES ON ONE RULE. The region anchored on it, an anchor must be a node of
   * its region's `area`, and `armatureProblems` fails loudly rather than
   * quietly — so the slot was refilled with `least-squares`, which inherited
   * the departing node's place as a root of the area view exactly as that node
   * inherited `basis-and-dimension`'s and that one inherited the axioms'. The
   * rule the eighth departure's note wrote down — "a region anchoring on the
   * ROOT of a growing area will be refilled every time that area is authored
   * out from underneath it, and the refill is always the node that was next" —
   * predicted this one, and the comment there says so. What is new is that the
   * rule had TWO candidates to choose between for the first time, and only one
   * of them became a root; see the note in armature.ts.
   *
   * ── AND A TENTH, WHICH IS THE ONE THE REFILL RULE COULD NOT ANSWER ──────
   *
   * `least-squares` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO. It is a
   * concept of `vectors-and-independence` now, in ontology-vectors.ts, so a
   * node of the same id here would collide with it and `atlasProblems` reports
   * that as an error rather than merging the two — the authored copy would be
   * shadowed by a node with no knowledge points, and a written subject would
   * silently read as unteachable.
   *
   * TEN NODES AFTER, against a stub floor of five, and the count no longer
   * decides anything: the floor reads `departed` as covered territory, so this
   * area stands at ten nodes plus ten departures against a threshold of five
   * and the total is unchanged by the move. The figures live in the group named
   * "the floor stopped binding" at the end of tests/atlas.mjs and nowhere else,
   * which is the rule five groups' worth of red taught that file.
   *
   * WHAT IT STRANDED WAS BOTH OF ITS `needs` AND THERE IS NO `links` ENTRY FOR
   * EITHER. The node declared `inner-product-spaces` and `rank-nullity`, and
   * both are authored concepts of the subject it went to — so both edges are
   * declared in that ontology's own `EDGES` and this area owes nothing. That is
   * the cheapest shape a promotion can have, it is the fourth time out of this
   * one area, and it is what chose this node over the five other unrefused
   * candidates whose `needs` reach across two or three subjects.
   *
   * NOTHING WAS HANDED BACK. No `links` entry of this area — or of any area —
   * named `least-squares` at either end, so there was no duplicate to delete.
   * An absence, and one that has to be looked for: `links` never cared whether
   * an end was a node or a concept, so a stale entry would go on resolving
   * perfectly well and `composeAtlas` would produce the same edge twice, which
   * is not a redundancy the loader notices and no suite checks for.
   *
   * THE ONE EDGE POINTING IN SURVIVED. `singular-value-decomposition` names
   * this concept in its OWN `needs`, so that edge is declared on a node that
   * remains and resolves untouched. Only a node's own `needs` is stranded by
   * deleting it — and this area has now recorded that fact ten times, which is
   * the number of times somebody could have got it backwards.
   *
   * THE AREA VIEW SHRANK WITHOUT SUBSTITUTING, which is the SEVENTH shape this
   * area has produced and the second of this one. The departing node was a root
   * of the area view, so it left the set; and nothing replaced it, because its
   * only in-area dependent is `singular-value-decomposition`, which also names
   * `spectral-theorem` — a node of this area — and so did not become rooted.
   * {`dual-spaces`, `eigenvalues`, `least-squares`} became {`dual-spaces`,
   * `eigenvalues`}: three to two, both survivors unchanged. A
   * direction-of-change check would read this and the twenty-second promotion's
   * shrink identically, and what distinguishes them is which members moved,
   * which is why tests/atlas.mjs asserts the set by named membership and never
   * by its length.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER, checked
   * before deleting it. `expandEdges` handles all THREE edge-bearing node
   * fields and `exercises` is the one no comment in this file named until the
   * fortieth promotion found it — an `encompasses` edge whose ends land in two
   * ontologies is expressible nowhere, so a node carrying one can only be filed
   * in the subject holding the far end, and this node's two `needs` are both in
   * one subject so it would not even have had that escape. Both absent, so the
   * filing was argued on content.
   *
   * AN `encompasses` EDGE DOES POINT AT IT, AND IT IS DECLARED SOMEWHERE ELSE
   * ENTIRELY. `linear-regression`, a node of `statistics` in
   * atlas-uncertainty.ts, carries `exercises: ['least-squares']` alongside its
   * `needs` — so the claim that fitting a regression line exercises this
   * concept survives the departure like any far-end declaration, and begins
   * doing work the day that node is written. The authored subject could not
   * have declared it: an ontology may only name concepts it contains.
   *
   * IT WAS AN `armature.ts` ANCHOR, AND KRULL'S SLOT HAS NOW TURNED OVER FOUR
   * TIMES — BUT THE DOCUMENTED REFILL RULE RETURNED NOBODY. The rule the eighth
   * departure's note wrote down is "the refill is always the node that was
   * next", and the thirtieth promotion sharpened it to the dependent that
   * BECOMES A ROOT of the area view. No node did, for the reason the paragraph
   * above gives. So the refill was a judgement for the first time, and
   * `dual-spaces` took the slot on the surviving half of the rule — it is the
   * area's other root, and this area's two ready nodes are exactly its two
   * roots, the other being `eigenvalues`, which is an anchor already. So it was
   * the only ready node available without shrinking the region to two. See the
   * note in armature.ts for the whole argument, including why the alternative
   * was tempting and lost, and for the claim this file got wrong first — that
   * the dual was the ONLY ready node here, which it is not and which the suite
   * caught.
   *
   * ── AND AN ELEVENTH, WHICH IS THE NODE THE PARAGRAPH ABOVE JUST REFILLED ──
   *
   * `dual-spaces` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO, for the
   * collision reason every entry above gives. It is a concept of
   * `vectors-and-independence` now, which makes it the SEVENTH node of this
   * area to land in that one subject.
   *
   * NINE NODES AFTER, against a stub floor of five, and the count still decides
   * nothing: nine nodes plus eleven departures is the same twenty of territory
   * that ten plus ten was. The figures live in the group named "the floor
   * stopped binding" at the end of tests/atlas.mjs and nowhere else.
   *
   * IT STRANDED ONE EDGE AND THERE IS NO `links` ENTRY FOR IT. The node
   * declared a single `need`, `basis-and-dimension`, and that is an authored
   * concept of the subject it went to — so the edge is declared in that
   * ontology's own `EDGES` and this area owes nothing. Fifth time out of this
   * one area, and the third promotion running with that shape.
   *
   * NOTHING WAS HANDED BACK, checked the same way as above and for the same
   * reason: no `links` entry of any area named `dual-spaces` at either end, so
   * there was no duplicate to delete and no suite would have reported one.
   *
   * NOTHING POINTED IN AT ALL, which is new. Every departure above left at
   * least one far-end edge behind — `singular-value-decomposition` naming the
   * least squares, `numerical-linear-algebra` naming the elimination,
   * `eigenvalues` naming the determinant. This node had NO dependents anywhere
   * in the build: nothing names it in a `needs` and nothing names it in an
   * `exercises`. So the "edges declared at the far end survive untouched" half
   * of a departure was vacuous here, and that is precisely the third factor
   * this node lost on and took anyway — it was the only unrefused candidate
   * whose prerequisites sat in one subject, and the one with the fewest
   * dependents of any candidate at all. The node that would have unlocked four
   * is `eigenvalues`, which is still here and still ready.
   *
   * THE AREA VIEW SHRANK WITHOUT SUBSTITUTING AGAIN, which is the EIGHTH shape
   * and the third shrink. {`dual-spaces`, `eigenvalues`} became
   * {`eigenvalues`}: two to one, the survivor unchanged, and nothing could have
   * replaced it since it had no dependents at all to promote into the set. So
   * the root set of this area is a single node for the first time since the
   * fourteenth promotion, and the one member is the node every unwritten part
   * of this area stands on.
   *
   * `confusedWith` and `exercises` on the departing node: NEITHER, checked
   * before deleting it rather than inferred from the suites staying green,
   * which for `confusedWith` is the only way to know — `expandEdges` turns one
   * into an `interferes_with`, and interference constrains SELECTION rather
   * than gating, so losing one leaves every assertion in the build passing
   * while the scheduler is quietly freed to introduce two confusable concepts
   * together.
   *
   * IT WAS AN `armature.ts` ANCHOR, AND KRULL'S SLOT HAS NOW TURNED OVER FIVE
   * TIMES — with the documented refill rule returning nobody for the second
   * time running, and this time for a stronger reason than last. At the
   * forty-first the rule failed because the departing node's only in-area
   * dependent did not become a root; here it fails because the departing node
   * has no dependents at all, so there is no candidate for the rule to reject.
   * The refill is a judgement again and it is recorded in armature.ts, with its
   * alternative named.
   */
  links: [
    /*
     * `three-dimensional-coordinates → vectors-and-spans` WAS THE FIRST ENTRY
     * HERE AND HAS BEEN DELETED, which is a shape of edit this file had not
     * made before and the one worth reading first.
     *
     * The entry existed because this area owned NEITHER end. `vectors-and-spans`
     * had been authored into ontology-vectors.ts and `three-dimensional-
     * coordinates` was a node of `euclidean-geometry`, so no ontology could
     * declare it and `links` was its only home. The thirteenth promotion wrote
     * that node into `vectors-and-independence` — the same subject as the far
     * end — so both ends are now concepts of ONE ontology, the edge is declared
     * there as an ordinary prerequisite with the `because` above carried over
     * verbatim as its `rationale`, and this entry had to go.
     *
     * IT WOULD NOT HAVE FAILED ANYTHING IF IT HAD STAYED, and that is the whole
     * reason this comment is long. `links` never cared whether an end was a
     * node or a concept — the note that used to sit here said exactly that, as
     * a reassurance — so the entry would have gone on resolving perfectly well
     * and `composeAtlas` would have produced the same edge twice, once from
     * here and once from the ontology. Two identical edges in the composed
     * graph is not a redundancy the loader notices and no suite checks for it.
     * So a promotion can hand an edge BACK to an ontology, and the only way to
     * find out is to read the file the far end lives in; the suites going green
     * is not evidence either way.
     *
     * The direction is the other thing to keep. It reads at a glance as though
     * span came first, and it is the reverse: the three dimensions GATE span,
     * which is why that concept landed in the middle of the receiving subject's
     * chain rather than on the end of it.
     */
    {
      from: 'vectors-and-spans',
      to: 'matrices-and-maps',
      because:
        'A matrix acts on vectors and its columns ARE vectors, so adding and scaling them has ' +
        'to mean something before a matrix can.',
    },
    {
      from: 'function-concept',
      to: 'matrices-and-maps',
      because:
        'A matrix is a function before it is a grid — the content of "linear map" is that it is ' +
        'a rule with exactly one output, which is the function concept itself.',
    },
    {
      from: 'function-composition',
      to: 'matrix-multiplication',
      because:
        'Matrix multiplication IS composition: AB means do B then A, and the row-by-column rule ' +
        'is derived from that rather than stated alongside it. A learner who has not composed ' +
        'two functions has no reason the rule is not arbitrary.',
    },
    {
      /*
       * The edge the fourteenth promotion stranded, restated.
       *
       * Direction is the thing to keep: the matrix reading GATES row
       * reduction, not the other way round. It reads backwards at a glance
       * because row reduction is the older topic in most tellings, and the map
       * takes the other view — the node's own `needs` named
       * `matrices-and-maps` and this entry carries that claim unchanged.
       *
       * It is also the half of the promotion that had to be written down
       * rather than noticed: the other stranded edge went to the receiving
       * ontology, where it is adjacent to the concept and impossible to miss,
       * and this one lives in the area the concept left, three files away from
       * anything that mentions it.
       */
      from: 'matrices-and-maps',
      to: 'gaussian-elimination',
      because:
        'Reducing a system is reducing a matrix of its coefficients, so "this grid is a map and ' +
        'its columns are where the basis goes" has to mean something before the rows of one are ' +
        'worth combining. Without it, row reduction rests on the equations alone and the ' +
        'reduced form is bookkeeping rather than a statement about a map.',
    },
    {
      from: 'gaussian-elimination',
      to: 'determinant',
      because:
        'Row reduction is how a determinant is computed at any size past 3×3, and the effect of ' +
        'each row operation on it is the standard derivation.',
    },
    {
      /**
       * The edge the map was missing, found by writing a journey across it.
       *
       * Authoring "When can a linear map be undone?" assumed the standard
       * telling — vectors, span, independence, then matrices — and the derived
       * route disagreed: there was no prerequisite path from
       * `linear-independence` to `matrix-inverse` at all. The two authored
       * subjects each had their own chain and nothing joined independence to
       * invertibility, which is the single most important equivalence in the
       * subject.
       *
       * Declared here and not in ontology-matrices.ts for the usual reason:
       * both endpoints are authored concepts in OTHER subjects, so an edge on
       * the subject's own `EDGES` would name a concept that ontology does not
       * contain and `ontologyProblems` would reject it when viewed alone.
       * `links` is the field for exactly this.
       *
       * It gates, which is the point and the cost: invertibility now waits on
       * independence, so a learner cannot reach it from the determinant alone.
       * That is the correct order — "det = 0" is a computation, and what it
       * MEANS is that the columns were dependent and a direction was lost.
       */
      from: 'linear-independence',
      to: 'matrix-inverse',
      because:
        'Invertible means no information was lost, and that is exactly the columns being ' +
        'independent — a zero determinant is the computation, dependence is what it says. ' +
        'Without independence first, "det = 0 so there is no inverse" is a rule to remember ' +
        'rather than a thing that follows.',
    },
    {
      /*
       * The edge the ninth departure stranded, restated — and the entry that
       * ends three promotions of owing nothing.
       *
       * It lives here rather than in either ontology because both of its ends
       * are authored concepts in OTHER subjects: `gaussian-elimination` is in
       * `expressions-and-equations` and `rank-nullity` is in
       * `vectors-and-independence`, so an edge on either subject's own `EDGES`
       * would name a concept that ontology does not contain and
       * `ontologyProblems` would reject it when the subject is viewed alone.
       *
       * It is also the half of that promotion that had to be written down
       * rather than noticed: the other stranded edge went to the receiving
       * ontology, where it sits beside the concept and cannot be missed, and
       * this one lives in the area the concept left, three files away from
       * anything that mentions it. The fourteenth promotion's entry above says
       * the same thing about the same hazard, which is why both are spelled out
       * instead of one referring to the other.
       */
      from: 'gaussian-elimination',
      to: 'rank-nullity',
      because:
        'The rank is the number of pivots and the nullity the number of free columns, so both ' +
        'counts are produced BY the elimination — "two of the three unknowns are pinned and one ' +
        'is free" is the whole content of the theorem and is a sentence about a reduced system. ' +
        'Without row reduction first, a rank is a number somebody asserts about a grid rather ' +
        'than a count a learner has watched being made.',
    },
  ],
}

const DISCRETE_MATHEMATICS: MapArea = {
  id: 'discrete-mathematics',
  name: 'Discrete mathematics',
  covers:
    'Counting, graphs and recurrences — the mathematics of finite and countable structures. ' +
    'The three bottom layers of the logic have problems written for them and live outside this ' +
    'area, and so now does the first layer the arguments are used ON. A letter standing for a ' +
    'whole statement, the connectives as finite tables, and which rearrangements of an ' +
    'implication are the same claim are the statements-and-connectives syllabus; a statement ' +
    'with a hole in it, the two words that close the hole, and why the order of two different ' +
    'ones changes the claim are the predicates-and-quantifiers syllabus; choosing which end of ' +
    'an implication to start from, assuming a claim false to reach something impossible, and ' +
    'splitting into cases that leave nothing out are the methods-of-proof syllabus; and ' +
    'membership, the operations as conditions on it, the sizes they force and the double ' +
    'inclusion an identity about them is proved by are the sets-and-membership syllabus. This ' +
    'area points at all four rather than restating any, and keeps the layers above them: the ' +
    'relations a set carries once it is a subset of a product, the counting — where the product ' +
    'and sum rules and inclusion–exclusion over many sets live, the two-set correction having ' +
    'gone with the sets that force it — the graphs, the comparison of infinite sets by ' +
    'bijection, and the formal systems, where derivation inside a stated calculus is a ' +
    'different subject from the arguments a person writes for another person and is the one ' +
    'still mapped only.',
  /**
   * FOUR NODES HAVE LEFT THIS AREA, ON FOUR CONSECUTIVE PROMOTIONS, UP ONE
   * CHAIN, AND EACH WAS THE ROOT AT THE TIME.
   *
   * `propositional-logic` went first, to ontology-logic.ts as the single member
   * of a twelfth subject; `quantifiers` followed it, to ontology-quantifiers.ts
   * as the single member of a thirteenth; `proof-techniques` followed that, to
   * ontology-proof.ts as the single member of a fourteenth; `sets` followed
   * that, to ontology-sets.ts as the single member of a fifteenth. All four are
   * real concepts now. `atlasProblems` rejects a map node whose id collides with
   * an authored concept — the composed list would hold two entries for the id,
   * and the shadowing copy has no knowledge points, so a fully authored concept
   * would read as unteachable. So promoting is a MOVE out of this array and not
   * a fill-in, and each node had to go.
   *
   * THE FOURTH DEPARTURE IS THE ONE THAT ENDS THE CHAIN AS A CHAIN, and it is
   * the only thing about this run that the three paragraphs below did not
   * already predict. Each of the first three nodes had exactly ONE dependent
   * inside this area, so the root set turned its single member over and stayed at
   * size one for three promotions running. `sets` has TWO in-area dependents —
   * `relations` and `counting-principles` — and was the last in-area prerequisite
   * of both, so the root set SPLITS: {`sets`} becomes {`relations`,
   * `counting-principles`}. The practical consequence is for whoever comes next.
   * Three promotions had no choice about which node to take, because there was
   * one; the fifth departure from this area has two candidates and they go to
   * different places — `relations` is the subset-of-a-product layer and
   * `counting-principles` is the product and sum rules, and `counting-principles`
   * also needs `binomial-theorem`, which is authored in `rational-expressions`,
   * so it would strand two edges into two subjects where `relations` strands one.
   * Stated rather than decided.
   *
   * THE AREA HAS LOST ITS ROOT FOUR TIMES AND HAS NOT LOST ITS ENTRY POINT
   * ONCE, which is the part worth explaining rather than counting. Every node
   * here stood on those four eventually, in that order, and the root set in
   * the composed graph moved up the same chain one step per promotion:
   * `propositional-logic`, then `quantifiers`, then `proof-techniques`, then
   * `sets` — and then stopped moving up a single chain, because `sets` was the
   * last in-area prerequisite of two nodes rather than one, so the set is
   * {`relations`, `counting-principles`} now. Nothing is stranded and nothing
   * became unreachable: both edges those two declare still resolve, because they
   * resolve against the composed atlas, where the far end is now a concept with
   * problems instead of a skeleton.
   *
   * THE EDGES POINTING IN NEEDED NO ATTENTION ON THE DAY, every time, for the
   * reason the eighth promotion out of `euclidean-geometry` recorded: an edge is
   * owned by the node that DECLARES it. `graph-colouring-planarity` and
   * `division-algorithm` still named `proof-techniques` in their own `needs`,
   * they stayed, and `composeAtlas` resolved both untouched. `sets` named it
   * too and is the exception that proves the rule rather than a counterexample
   * to it: that node did not stay, so its edge is the one that moved, which is
   * the next paragraph.
   *
   * AND ONE OF THE TWO HAS SINCE STOPPED BEING A NODE, exactly the way the rule
   * two paragraphs down predicts and in the same shape it has been undone four
   * times here. The thirty-ninth promotion authored `division-algorithm` into
   * `arithmetic-foundations`, so the sentence above is kept in the past tense and
   * `graph-colouring-planarity` is the only node still carrying its own edge to
   * `proof-techniques`. The difference from the four departures out of THIS area
   * is where the stranded edge landed: `number-theory` owned the declarer, so the
   * entry is in that area's `links` and not in this one's, which is why this
   * area's four did not become five. `proof-techniques` is now a `from` in two
   * areas' `links` at once, and NUMBER_THEORY's own block explains why filing by
   * the `from` instead of by the declarer would be wrong.
   *
   * THE EDGE EACH NODE DECLARED ITSELF IS THE ONE THAT MOVED, which is why
   * there are now FOUR entries in `links` where there was one. That is the
   * case the rule above does NOT cover: when the DECLARING end is promoted, its
   * `needs` have nowhere left to live, and the answer is the area the declarer
   * left rather than the area or subject holding the far end. Every far end is
   * an authored concept of another subject — `geometric-proof` in
   * `plane-geometry`, `propositional-logic` in `statements-and-connectives`,
   * `quantifiers` in `predicates-and-quantifiers`, `proof-techniques` in
   * `methods-of-proof` — so no ontology may hold any of the four edges, because
   * an authored ontology's edges may only name concepts it contains. An area's
   * `links` is the only place in the build that can say "an authored concept
   * rests on an authored concept of a third subject".
   *
   * THE SECOND PROMOTION SHOWED THE CHAIN'S SHAPE, THE THIRD CONFIRMED IT IS A
   * RULE RATHER THAN AN ACCIDENT, AND THE FOURTH HAS NOW PAID IT AGAIN. This is
   * worth stating as a rule because it looks like a mistake every time. The
   * thirty-fifth promotion's comment here said of `quantifiers` that "it stayed,
   * and `composeAtlas` resolves it untouched", and asserted the ABSENCE of a
   * `links` entry for it; the thirty-sixth said the same of `proof-techniques`
   * while adding the entry for `quantifiers`; the thirty-seventh said the same of
   * `sets` while adding the entry for `proof-techniques`. Each was right when
   * written and each was undone one promotion later, because the moment a
   * declaring end is authored the edge it owned is stranded and the absence
   * becomes a missing entry.
   *
   * THE RULE, AND IT HELD FOR A FOURTH STEP WITHOUT AMENDMENT: walking up a
   * chain strands exactly ONE edge per step — the one the node being promoted
   * declares — and invalidates exactly the previous promotion's claim that no
   * entry was needed for it. So when promoting, check not only the node's own
   * `needs` but whether the previous promotion's assertions rest on this node
   * staying put. Each of the last three runs paid two rewrites in
   * tests/atlas.mjs for it, every one anticipated in the comment beside it.
   *
   * WHAT THE FOURTH STEP ADDS IS THAT THE RULE'S PRECONDITION HAS NOW EXPIRED.
   * "Walking up a chain" was true of this area four times because each departing
   * node had one in-area dependent; `sets` had two, so there is no single next
   * node and the fifth departure is a choice (see the split above). The stranding
   * rule itself is unaffected — it is about the declaring end and not about the
   * shape of what is above — but the sentence "the next one up" has no referent
   * here any more, and a future run should not go looking for one.
   *
   * NO `confusedWith` WAS LOST ANY OF THE FOUR TIMES, and it was checked rather
   * than assumed each time. `expandEdges` in atlas.ts turns a node's
   * `confusedWith` into an `interferes_with` edge, so deleting a node DELETES
   * that edge, and nothing goes red when it happens: interference constrains
   * SELECTION rather than gating, so every suite stays green while the
   * scheduler is freed to introduce the two most confusable concepts in a
   * subject together. None of the four declared one, so there was nothing to
   * re-home — but the check is the one a promotion forgets, and the candidates
   * are worth recording. ontology-functions.ts argues that
   * `mathematical-induction` and `propositional-logic` genuinely interfere,
   * ontology-quantifiers.ts that `mathematical-induction` and `quantifiers` do,
   * and ontology-proof.ts that `mathematical-induction` and `proof-techniques`
   * do, since induction is a proof technique for one shape of domain and
   * `proof-techniques` is the account of the other four.
   *
   * A FOURTH PAIR NOW JOINS THEM AND IT IS THE FIRST ONE THAT IS NOT ABOUT
   * INDUCTION: `sets` and `propositional-logic`. The two De Morgan identities
   * are written in the same shape and are about different objects — one swaps
   * `and` for `or` between two columns of truth values, the other between two
   * membership conditions — and a learner meeting them in either order will take
   * the second for a restatement of the first, which is precisely the mistake
   * the third knowledge point of ontology-sets.ts exists to prevent. Both ends
   * are authored concepts of different subjects, `links` hard-codes
   * `prerequisite`, and an ontology may not name a concept it does not contain.
   * A cross-subject `interferes_with` has no home in this build, which is the
   * sixth time that has had to be written down and the fourth pair it costs.
   */
  links: [
    /*
     * The one edge the departing node declared itself, restated.
     *
     * It GATES immediately and for real, which is unusual for a `links` entry:
     * most are written while the far end is still an unwritten node and
     * constrain nothing until somebody authors it. Both ends have material
     * here, so `gatingPrerequisitesOf` on the written concept returns exactly
     * this one, and a learner cannot be shown a truth table until the first
     * proofs about figures are strong.
     *
     * If `geometric-proof` ever MOVED into `statements-and-connectives` — which
     * is the shape the reasoning-subject question in ontology-functions.ts and
     * ontology-logic.ts leaves open — this edge would become an ordinary
     * `needs` there and the entry below would have to be DELETED. Two
     * identical edges in the composed graph is not a duplicate `composeAtlas`
     * notices, and no test reports one. tests/atlas.mjs asserts the subject of
     * the far end for exactly that reason.
     */
    {
      from: 'geometric-proof',
      to: 'propositional-logic',
      because:
        'The geometry is where a learner first meets a converse and a contrapositive at all — ' +
        'on one proved statement about triangles, used on three particular triangles, which is ' +
        'meeting the rearrangement before having a notation for it. This concept is the second ' +
        'pass: the same distinction as a subtraction of two columns, true of every implication ' +
        'rather than of that one. Taken in the other order the truth table is a table of ' +
        'symbols with nothing it has ever decided, and the rule that a proposed counterexample ' +
        'must pass the hypothesis first — the one fact both concepts share — arrives as ' +
        'bookkeeping instead of as something a learner has already been caught by.',
    },
    /*
     * The edge the SECOND departing node declared itself, restated — and the
     * entry the thirty-fifth promotion asserted was absent.
     *
     * It gates immediately and for real, like the one above and unlike most
     * `links` entries, which are written while the far end is still an
     * unwritten node and constrain nothing until somebody authors it. Both ends
     * have material, so `gatingPrerequisitesOf('quantifiers')` returns exactly
     * this one and a learner cannot be shown "for all" and "there exists" until
     * the truth table for "if ... then" is strong. That is the right order: the
     * material writes a universal as "and" repeated and an existential as "or"
     * repeated, so a learner who has not met those two connectives as tables
     * meets the quantifiers as a notation instead of as a generalisation.
     *
     * If the two logic subjects were ever MERGED — which ontology-quantifiers.ts
     * argues is an easy change somebody may want, and is the reason it refused
     * the cheaper filing — this edge would become an ordinary `needs` in the
     * merged ontology and the entry below would have to be DELETED. Two
     * identical edges in the composed graph is not a duplicate `composeAtlas`
     * notices and no test reports one, so tests/atlas.mjs asserts the far end's
     * subject by name for exactly that reason.
     */
    {
      from: 'propositional-logic',
      to: 'quantifiers',
      because:
        'A quantifier over a finite domain is one of the connectives repeated: "for all" is ' +
        '"and" across the domain and "there exists" is "or" across it, which is how this ' +
        'build asks and grades every question about either. A learner who has not met "and" ' +
        'and "or" as TABLES has nothing for the repetition to be a repetition of, and meets ' +
        'the two quantifiers as a pair of symbols to be translated rather than as the same ' +
        'two connectives at a larger scale. The negation rule is the sharper half of it: ' +
        '"not every x works" becoming "some x fails" is De Morgan one layer up, and the ' +
        'proof that the two are one claim is the earlier concept\'s subtraction of columns ' +
        'applied to a product.',
    },
    /*
     * The edge the THIRD departing node declared itself, restated — and the
     * entry the thirty-sixth promotion asserted was absent, in the same words
     * the thirty-fifth used about the entry above.
     *
     * It gates immediately and for real, like both of the others and unlike
     * most `links` entries, which are written while the far end is still an
     * unwritten node and constrain nothing until somebody authors it. Both ends
     * have material, so `gatingPrerequisitesOf('proof-techniques')` returns
     * exactly this one and a learner cannot be shown the four shapes of
     * argument until "for all" and "there exists" are strong. That is the right
     * order and it is the sharper of the three: ontology-proof.ts's whole
     * premise is that a quantified claim over a domain that does NOT run out
     * cannot be settled by multiplying, so a learner who has not met the
     * finite-domain product has not met the wall these techniques exist to get
     * over, and meets them as four styles rather than as four answers to one
     * problem.
     *
     * If the logic subjects were ever MERGED, or a single REASONING subject
     * founded out of them and `mathematical-induction` and `geometric-proof` —
     * which ontology-proof.ts argues is the change founding a fourteenth
     * subject keeps available rather than forecloses — this edge would become an
     * ordinary `needs` in the merged ontology and the entry below would have to
     * be DELETED. Two identical edges in the composed graph is not a duplicate
     * `composeAtlas` notices and no test reports one, so tests/atlas.mjs asserts
     * the far end's subject by name for exactly that reason, as it does for the
     * two above.
     */
    {
      from: 'quantifiers',
      to: 'proof-techniques',
      because:
        'The quantifiers are where the licence to settle a universal claim by writing all its ' +
        'cases down runs out, and these four techniques are what replaces it. That concept ' +
        'ends on the fact: a product needs a LAST factor, so "every whole number has a ' +
        'successor" is not a computation and an argument about an ARBITRARY member has to take ' +
        'over. Taken in this order the first technique is the answer to a question the learner ' +
        'has already been stopped by; taken in the other it is four styles of writing with ' +
        'nothing either has had to do. The negation rule is the half that is used rather than ' +
        'merely motivating: a proof by contradiction begins by negating the claim, and "there ' +
        'is no largest prime" only becomes a finite list you can multiply because the earlier ' +
        'concept says what the negation of a universal is.',
    },
    /*
     * The edge the FOURTH departing node declared itself, restated — and the
     * entry the thirty-seventh promotion asserted was absent, in the same words
     * the thirty-sixth used about the entry above and the thirty-fifth used
     * about the one above that. Three identical predictions, three identical
     * outcomes; the rule is in the block at the top of this area.
     *
     * It gates immediately and for real, like all three of the others and unlike
     * most `links` entries, which are written while the far end is still an
     * unwritten node and constrain nothing until somebody authors it. Both ends
     * have material, so `gatingPrerequisitesOf('sets')` returns exactly this one
     * and a learner cannot be shown membership and the operations until the four
     * shapes of argument are strong. That is the right order, and it is the one
     * of the four where the prerequisite is a METHOD the material cannot proceed
     * without rather than a fact it cites: every identity in ontology-sets.ts is
     * established by double inclusion, which is two universal implications each
     * proved from the end whose hypothesis is a form — the earlier concept's
     * first lesson, run twice. A learner who arrived here first would meet the
     * object and the only available means of saying anything general about it in
     * the same sitting.
     *
     * If the logic and proof subjects were ever MERGED, or a single REASONING
     * subject founded out of them, this edge would still live here: both of its
     * ends would remain authored concepts of two different subjects, because
     * ontology-sets.ts argues at length that the sets subject is not a candidate
     * for that merge — it is about an object and the other four are about
     * arguments. That is the one difference from the three entries above, each of
     * which says it would have to be DELETED in that event, and it is the reason
     * tests/atlas.mjs asserts the far end's subject here as well: the claim being
     * made is that these two are permanently in different subjects, which is a
     * stronger statement than "they happen to be today".
     */
    {
      from: 'proof-techniques',
      to: 'sets',
      because:
        'Two sets are equal when they have the same members, which is two universal implications ' +
        'at once — and every identity in the sets material is proved that way, by taking an ' +
        'arbitrary member of one side and rearranging its membership condition until it is the ' +
        'other side. That is the earlier concept\'s first lesson applied twice: each inclusion is ' +
        'proved from the end whose hypothesis is a FORM there is something to substitute into, ' +
        'which for a set is "x is in the left-hand expression" unpacked. Taken in this order the ' +
        'double inclusion is a technique the learner already owns, used on a new kind of object. ' +
        'Taken in the other it is a ritual, and the alternative on offer is the Venn diagram — ' +
        'which really does settle a three-set identity, really does fail from four sets up, and ' +
        'gives a learner no way to tell those two situations apart.',
    },
  ],
  nodes: [
    {
      id: 'relations',
      match: /\b(binary relation|equivalence relation|partial order)\b/i,
      name: 'Relations',
      is: 'A subset of a product, with equivalence relations partitioning a set and orders arranging it.',
      needs: ['sets'],
      terms: 'relation reflexive symmetric transitive equivalence class partition partial order',
    },
    {
      id: 'functions-formally',
      match: /^function \(mathematics\)|\b(injective|surjective|bijection)\b/i,
      name: 'Functions, formally',
      is: 'A function as a relation with a uniqueness condition, which is where injective, surjective and bijective get defined properly.',
      needs: ['relations', 'inverse-functions'],
      terms: 'injective surjective bijective image preimage well defined',
    },
    {
      id: 'cardinality',
      match: /\b(cardinality|countable set|cantor('|’)?s diagonal)\b/i,
      name: 'Cardinality and countability',
      is: 'Comparing infinite sets by bijection: the rationals are countable, the reals are not, and the diagonal argument shows it.',
      needs: ['functions-formally', 'real-number-line'],
      terms: 'cardinality countable uncountable diagonal argument bijection aleph',
    },
    {
      id: 'counting-principles',
      match: /\b(combination|permutation|pigeonhole principle|combinatoric)/i,
      name: 'Counting',
      is: 'Product and sum rules, permutations and combinations, with inclusion–exclusion for when the cases overlap.',
      needs: ['sets', 'binomial-theorem'],
      terms: 'permutation combination factorial inclusion exclusion pigeonhole',
    },
    {
      id: 'combinatorial-identities',
      match: /\b(pascal('|’)?s triangle|inclusion(–|-)exclusion)\b/i,
      name: 'Combinatorial identities',
      is: 'Proving a counting identity by counting the same set two ways — a style of argument with no algebraic substitute.',
      needs: ['counting-principles', 'mathematical-induction'],
      terms: 'double counting bijective proof binomial identity vandermonde',
    },
    {
      id: 'recurrence-relations',
      match: /\b(recurrence relation|fibonacci (number|sequence))\b/i,
      name: 'Recurrence relations',
      is: 'Defining a sequence by its predecessors, and solving the linear ones by their characteristic polynomial.',
      needs: ['counting-principles', 'geometric-sequences'],
      terms: 'recurrence relation characteristic root fibonacci master theorem',
    },
    {
      id: 'generating-functions',
      match: /\bgenerating function\b/i,
      name: 'Generating functions',
      is: 'Encoding a sequence as the coefficients of a power series, so counting becomes algebra.',
      needs: ['recurrence-relations', 'power-series'],
      terms: 'generating function formal power series coefficient extraction convolution',
    },
    {
      id: 'graphs',
      match: /\bgraph theory\b|^graph \(discrete mathematics\)/i,
      name: 'Graphs',
      is: 'Vertices and edges, with degree, paths and connectedness as the first vocabulary — and the handshake lemma as the first theorem.',
      needs: ['relations'],
      terms: 'graph vertex edge degree path connected handshake lemma',
    },
    {
      id: 'trees',
      match: /^tree \(graph theory\)|\bspanning tree\b/i,
      name: 'Trees',
      is: 'Connected and acyclic, with the n−1 edge count and the uniqueness of paths as two readings of one fact.',
      needs: ['graphs', 'mathematical-induction'],
      terms: 'tree spanning tree acyclic leaf root forest',
    },
    {
      id: 'graph-algorithms',
      match: /\b(dijkstra|breadth-first|depth-first|shortest path)\b/i,
      name: 'Graph algorithms',
      is: 'Traversal, shortest paths and minimum spanning trees, where the correctness proof is the mathematics.',
      needs: ['trees'],
      terms: 'breadth first search dijkstra kruskal prim shortest path',
    },
    {
      id: 'graph-colouring-planarity',
      match: /\b(graph colo(u)?ring|planar graph|four colo(u)?r)\b/i,
      name: 'Colouring and planarity',
      is: 'Euler\'s formula, planar graphs and chromatic number — where easy questions turn out to be genuinely hard.',
      needs: ['graphs', 'proof-techniques'],
      terms: 'graph colouring chromatic number planar euler formula four colour',
    },
    {
      id: 'computability-and-complexity',
      match: /\b(turing machine|computability|halting problem|np-completeness|computational complexity)\b/i,
      name: 'Computability and complexity',
      is: 'What an algorithm is, what cannot be computed at all, and the P versus NP question as a precise statement.',
      needs: ['cardinality', 'graph-algorithms', 'asymptotic-comparison'],
      terms: 'turing machine halting problem complexity p np reduction',
    },
    {
      id: 'formal-logic-and-incompleteness',
      match: /\b(g(ö|o)del('|’)?s (incompleteness|completeness)|first-order logic|peano axioms)\b/i,
      name: 'Formal systems and incompleteness',
      is: 'Axioms, derivation and models, up to the statement that any adequate system has truths it cannot prove.',
      needs: ['computability-and-complexity', 'quantifiers'],
      terms: 'first order logic model completeness godel incompleteness consistency',
    },
  ],
}

/**
 * TWO NODES LEFT THIS AREA WHEN THEY WERE AUTHORED, AND HAD TO.
 *
 * The thirty-ninth promotion wrote `division-algorithm` into
 * `arithmetic-foundations` and the fortieth wrote `euclidean-algorithm` into the
 * same subject, and both nodes are DELETED from the list below rather
 * than annotated. That is not a style choice and it is the thing most likely to
 * trip whoever promotes the next one here, so it is stated at the top of the
 * area instead of beside the gap: `atlasProblems` REJECTS a map node whose id
 * collides with an authored concept. The two are siblings in the composed graph
 * — `composeAtlas` concatenates the areas and the authored ontologies — so a
 * surviving skeleton would put two different objects behind one string, and
 * `areaOf` would answer with an area id for one and a subject id for the other.
 * Promoting a concept is therefore a MOVE and never a fill-in. The same
 * paragraph is at the top of NUMBER_AND_ARITHMETIC's successor in
 * atlas-foundations.ts, where five nodes left at once.
 *
 * THE FIRST TWO DEPARTURES THIS AREA HAS EVER HAD, in consecutive promotions and
 * up one chain — the second node is the direct dependent of the first, and it
 * became ready in the edit that wrote the first. Twelve nodes down to ten, five
 * clear of the stub floor of five by nodes alone and seven once the two
 * departures count as covered territory, so nothing here is near frozen and the
 * next run has room.
 *
 * ── WHAT THE FORTIETH PROMOTION COST, WHICH WAS LESS THAN ANY BEFORE IT ───
 *
 * `euclidean-algorithm` declared `needs: ['division-algorithm', 'gcd-and-lcm']`
 * and both are authored concepts of `arithmetic-foundations`, so BOTH edges are
 * ordinary `prerequisite` entries in ontology-arithmetic.ts and this area needed
 * no new `links` entry in either direction. That is the cheap shape in its purest
 * form: zero entries, no new subject, nothing stranded anywhere. It was available
 * because the previous promotion created it — `division-algorithm` was a node of
 * this area on the morning of the thirty-ninth promotion, and a node's
 * prerequisites all being authored in one subject is a property that can arrive
 * without the node being edited at all.
 *
 * `modular-arithmetic` STAYED and declares `needs: ['euclidean-algorithm',
 * 'relations']` itself. By the rule stated below — an edge is owned by the node
 * that DECLARES it — that edge resolves in `composeAtlas` untouched and needs no
 * `links` entry, which is the case most often got wrong in the opposite
 * direction: a promotion is tempted to add an entry for something that stayed
 * and depended on what left, and a spurious entry is a duplicate edge no suite
 * reports. What did change with no edit at all is the GATE.
 * `gatingPrerequisitesOf('modular-arithmetic')` used to walk through this empty
 * node to the two concepts below it and answered `division-algorithm,
 * gcd-and-lcm, sets`; it now stops here and answers `euclidean-algorithm, sets`.
 * Three names to two, measured before and after rather than predicted.
 *
 * THE ROOT SET TURNED OVER WITHOUT CHANGING SIZE, which is the trap a count
 * would miss. This area's roots were `euclidean-algorithm` and
 * `prime-distribution`; they are now `modular-arithmetic` and
 * `prime-distribution`, because the departing node was `modular-arithmetic`'s
 * only in-area prerequisite — `relations` is a node of `discrete-mathematics`.
 * Two before, two after, one member different. tests/atlas.mjs asserts the
 * membership by name for exactly this reason.
 *
 * NO `confusedWith` WAS LOST — the node declared none, checked before the delete
 * rather than assumed. But it DID declare `exercises: ['gcd-and-lcm']`, and that
 * is a stranding of the same kind which nothing in this codebase had written
 * down: `expandEdges` turns `exercises` into an `encompasses` edge just as it
 * turns `confusedWith` into an `interferes_with` one, so deleting a node deletes
 * those too and no suite goes red, because `encompasses` governs credit
 * propagation rather than gating. That edge is declined rather than lost, and the
 * argument is in ontology-arithmetic.ts's `EDGES` beside the pair it concerns.
 * Three edge-bearing fields, three silent strandings; a promotion has to check
 * all three.
 *
 * ── WHERE THE THIRTY-NINTH PROMOTION'S TWO EDGES WENT ────────────────────
 *
 * WHY THEY WENT TO DIFFERENT PLACES.
 * The node declared `needs: ['divisibility', 'proof-techniques']`, and the rule
 * the discrete-mathematics block above states in full applies: an edge is owned
 * by the node that DECLARES it, so promoting a node strands only its own `needs`
 * and edges declared at the far end resolve untouched. Both of these were the
 * node's own, and they still parted company:
 *
 *   `divisibility` is authored in `arithmetic-foundations`, which is the subject
 *   the node was promoted INTO. Both ends are concepts of one ontology, so that
 *   edge is an ordinary `prerequisite` in ontology-arithmetic.ts and needs
 *   nothing here.
 *
 *   `proof-techniques` is authored in `methods-of-proof`. An authored ontology's
 *   edges may only name concepts it contains, so that edge may live in NEITHER
 *   subject — not in the arithmetic, which does not contain `proof-techniques`,
 *   and not in the proof subject, which does not contain `division-algorithm`.
 *   An area's `links` is the only place in the build that can say "an authored
 *   concept rests on an authored concept of a third subject", and the area it
 *   belongs to is the one the DECLARER left. Hence the first entry below.
 *
 * So the general cost of a promotion into an EXISTING subject is one `links`
 * entry per `need` that points outside it, and this node had one of each kind.
 * The five promotions before this founded new subjects, where every `need`
 * points outside by construction and every edge strands.
 *
 * `proof-techniques` IS NOW A `from` IN TWO AREAS' `links` AT ONCE —
 * `discrete-mathematics` holds the entry for `sets` and this area holds the one
 * for `division-algorithm` — and that is correct rather than a duplication to be
 * tidied. The entries are two different edges to two different `to`s, and the
 * area is chosen by which node declared the edge, not by where the `from` lives.
 * A reader who files by the `from` instead would collect every edge out of one
 * concept into one area and break the rule the moment a third dependent is
 * authored.
 *
 * NO `confusedWith` WAS LOST, and it was checked rather than assumed, because
 * this is the stranding no suite catches: `expandEdges` in atlas.ts turns a
 * node's `confusedWith` into an `interferes_with` edge, so deleting a node
 * DELETES that edge and nothing goes red — interference constrains SELECTION
 * rather than gating, so every suite stays green while the scheduler is freed to
 * introduce the two most confusable concepts in a subject together. This node
 * declared none, so there was nothing to carry.
 *
 * What is worth recording is that authoring it found one the map had never
 * noticed, which is the opposite shape and the first instance of it:
 * `division-algorithm ~ fraction-arithmetic` is declared in
 * ontology-arithmetic.ts, because writing out what the concept actually says
 * about a ÷ b made the collision with the fraction concrete in a way a skeleton
 * one-liner could not. A promotion can ADD an interference as well as drop one.
 *
 * AND HASSPAB LOST AN ANCHOR WITHOUT GAINING ANY COVERAGE, which is a
 * consequence of this departure that no other area's has had. armature.ts places
 * this area in Hasspab and `authored` subjects are claimed per region, but
 * `arithmetic-foundations` is claimed by Ringed Mountains and has been since the
 * `number-and-arithmetic` area was retired. So the material this area gave up
 * appears on the game's map in a different region, Hasspab still reports nothing
 * written, and its anchor slot had to be refilled. That file carries the refill
 * and the argument for it.
 */
const NUMBER_THEORY: MapArea = {
  id: 'number-theory',
  name: 'Number theory',
  covers:
    'The integers taken seriously: divisibility, congruence, the multiplicative structure of the ' +
    'residues, and the distribution of primes. The one general fact underneath all of it — that ' +
    'a quotient and a remainder always exist, are unique, and put the remainder in 0 ≤ r < b — ' +
    'is no longer here: it is `division-algorithm`, authored in `arithmetic-foundations` ' +
    'alongside the divisibility it generalises. Nor is the step above it — computing a gcd by ' +
    'repeated remainder, and the identity that writes that gcd as a whole-number combination of ' +
    'the pair — which is `euclidean-algorithm`, authored in the same subject because both of ' +
    'its prerequisites are. What remains mapped begins where the subject matter stops being ' +
    'about numbers: arithmetic on the remainders themselves, which is a claim about classes of ' +
    'integers rather than about integers, and everything that rests on it.',
  links: [
    /*
     * The one edge the departing node declared that had nowhere else to go.
     *
     * It GATES immediately and for real, which most `links` entries do not:
     * they are usually written while the far end is still an unwritten node and
     * constrain nothing until somebody authors it. Both ends have material, so
     * `gatingPrerequisitesOf('division-algorithm')` on the composed atlas
     * returns this alongside `divisibility`, and a learner cannot be shown the
     * uniqueness argument until the four shapes of proof are strong.
     *
     * The direction is worth checking against the material rather than taken on
     * trust, because `proof-techniques` leans the other way in its own prose.
     * That concept's third knowledge point uses "dividing by 3 leaves exactly
     * one of three remainders", which is an INSTANCE of what this edge's `to`
     * establishes in general — and ontology-proof.ts says so explicitly, uses
     * the instance only, and refuses the general form precisely because the map
     * puts it above. So the gate runs upward and the prose runs downward, and
     * both are right: the general theorem rests on knowing how to argue, and one
     * instance of it can be checked by hand before the theorem exists.
     * tests/atlas.mjs asserts that pairing by hand, since a circularity between
     * a gate and a citation is not a shape any walk detects.
     */
    {
      from: 'proof-techniques',
      to: 'division-algorithm',
      because:
        'Existence needs the least leftover to be reachable and uniqueness is a direct argument '
        + 'about the difference of two candidate remainders, so the claim cannot be stated — '
        + 'never mind believed — by somebody who has not met an argument about an arbitrary '
        + 'member. The concept below supplies one instance of the conclusion and this supplies '
        + 'the method the general statement needs.',
    },
  ],
  /*
   * TWO NODES HAVE BEEN AUTHORED OUT OF THIS AREA. See `MapArea.departed` in
   * atlas.ts for the mechanism, which landed between the thirty-ninth
   * promotion's first edit and its last and is the reason this list exists at
   * all.
   *
   * DECLARED ALTHOUGH THIS AREA IS NOWHERE NEAR THE FLOOR — ten nodes against
   * five, so `STUB_FLOOR_TERRITORY` would pass on the nodes alone and this
   * changes no check's outcome today. It follows the precedent of the area that
   * declared nine with two of headroom, and for the same reason: the field's job
   * is to stop a DRAINED area reading as an abandoned one, and the moment to
   * record a departure is when it happens rather than when the arithmetic starts
   * to matter. A list written at the floor has to be reconstructed from prose by
   * somebody under pressure.
   *
   * The why is in the block at the top of this area; this carries only the fact.
   */
  departed: ['division-algorithm', 'euclidean-algorithm'],
  nodes: [
    /*
     * `euclidean-algorithm` was here and is now authored in
     * `arithmetic-foundations`, by the fortieth promotion. It is the node
     * `modular-arithmetic` below still names, so the gate the area declares is
     * unchanged — what changed is that the gate now stops at written material
     * one step down instead of walking through an empty node to two.
     */
    {
      id: 'modular-arithmetic',
      match: /\bmodular arithmetic\b/i,
      name: 'Modular arithmetic',
      is: 'Arithmetic on remainders, well defined because congruence respects addition and multiplication — but not division.',
      needs: ['euclidean-algorithm', 'relations'],
      terms: 'congruence modulo residue class modular arithmetic',
    },
    {
      id: 'linear-congruences',
      match: /\b(linear congruence|modular multiplicative inverse)\b/i,
      name: 'Linear congruences and inverses',
      is: 'Solving ax ≡ b, which is solvable exactly when the gcd divides b — so Bézout is the solution method.',
      needs: ['modular-arithmetic'],
      terms: 'linear congruence modular inverse solvability',
    },
    {
      id: 'chinese-remainder',
      match: /\bchinese remainder\b/i,
      name: 'The Chinese remainder theorem',
      is: 'Independent congruences to coprime moduli have a simultaneous solution, which splits a modulus into its prime-power parts.',
      needs: ['linear-congruences'],
      terms: 'chinese remainder theorem coprime moduli simultaneous congruence',
    },
    {
      id: 'fermat-euler',
      match: /\b(fermat('|’)?s little theorem|euler('|’)?s (theorem|totient))\b/i,
      name: 'Fermat and Euler theorems',
      is: 'Exponents live modulo φ(n), which is what makes modular exponentiation cheap and RSA possible.',
      needs: ['chinese-remainder', 'exponent-rules'],
      terms: 'fermat little theorem euler totient theorem phi function',
    },
    {
      id: 'primitive-roots',
      match: /\b(primitive root|discrete logarithm)\b/i,
      name: 'Primitive roots and discrete logarithms',
      is: 'When the units modulo n are generated by a single element, and the asymmetry of inverting that.',
      needs: ['fermat-euler', 'logarithm-definition'],
      terms: 'primitive root multiplicative order discrete logarithm cyclic',
    },
    {
      id: 'quadratic-reciprocity',
      match: /\b(quadratic (reciprocity|residue)|legendre symbol)\b/i,
      name: 'Quadratic residues and reciprocity',
      is: 'Which numbers are squares modulo p, and the unexpected symmetry between two primes asking about each other.',
      needs: ['primitive-roots'],
      terms: 'quadratic residue legendre symbol reciprocity euler criterion',
    },
    {
      id: 'diophantine-equations',
      match: /\b(diophantine|fermat('|’)?s last theorem|pell('|’)?s equation)\b/i,
      name: 'Diophantine equations',
      is: 'Equations required to have integer solutions, where existence is the hard question and descent is the classical tool.',
      needs: ['chinese-remainder', 'pythagoras'],
      terms: 'diophantine equation pell pythagorean triple infinite descent fermat',
    },
    {
      id: 'prime-distribution',
      match: /\b(prime number theorem|distribution of primes|prime-counting)\b/i,
      name: 'The distribution of primes',
      is: 'There are infinitely many, they thin out like 1/log, and the prime number theorem says exactly how.',
      needs: ['prime-factorisation', 'asymptotic-comparison'],
      terms: 'prime number theorem sieve of eratosthenes euclid infinitude density',
    },
    {
      id: 'analytic-number-theory',
      match: /\b(riemann (zeta|hypothesis)|dirichlet (series|l-function)|analytic number theory)\b/i,
      name: 'Analytic number theory',
      is: 'Using complex analysis on the zeta function to count primes, which is where the Riemann hypothesis lives.',
      needs: ['prime-distribution', 'analytic-continuation'],
      terms: 'riemann zeta function dirichlet series euler product riemann hypothesis',
    },
    {
      id: 'cryptographic-number-theory',
      match: /\b(rsa \(cryptosystem\)|public-key|diffie(–|-)hellman)\b/i,
      name: 'Number theory in cryptography',
      is: 'RSA and Diffie–Hellman as direct consequences of Euler and of the hardness of the discrete logarithm.',
      needs: ['primitive-roots', 'fermat-euler'],
      terms: 'rsa diffie hellman public key factoring hardness',
    },
  ],
}

const ABSTRACT_ALGEBRA: MapArea = {
  id: 'abstract-algebra',
  name: 'Abstract algebra',
  covers:
    'Groups, rings and fields: what follows from the axioms alone, up to the Galois correspondence ' +
    'and why the quintic has no formula.',
  nodes: [
    {
      id: 'binary-operations',
      match: /\b(binary operation|magma \(algebra\)|monoid|semigroup)\b/i,
      name: 'Binary operations and axioms',
      is: 'Closure, associativity, identity and inverse as separable properties — and examples failing exactly one of them.',
      needs: ['functions-formally', 'isometries-and-symmetry'],
      terms: 'binary operation closure associative identity inverse cayley table',
    },
    {
      id: 'groups',
      match: /^group \(mathematics\)|\b(abelian group|cyclic group|symmetric group|dihedral group)\b/i,
      name: 'Groups',
      is: 'The four axioms, with the symmetries of an object as the motivating example rather than an afterthought.',
      needs: ['binary-operations'],
      terms: 'group abelian order of element symmetric group dihedral',
    },
    {
      id: 'subgroups-and-cosets',
      match: /\b(subgroup|coset|lagrange('|’)?s theorem \(group theory\))\b/i,
      name: 'Subgroups, cosets and Lagrange',
      is: 'Cosets partition a group into equal blocks, so a subgroup\'s order divides the group\'s — one of the great cheap theorems.',
      needs: ['groups', 'relations'],
      terms: 'subgroup coset lagrange theorem index cyclic subgroup',
    },
    {
      id: 'group-homomorphisms',
      match: /\b(group homomorphism|group isomorphism|isomorphism theorem)\b/i,
      name: 'Homomorphisms and isomorphism',
      is: 'Maps that respect the operation, with the kernel measuring what is lost and isomorphism meaning "the same group".',
      needs: ['subgroups-and-cosets'],
      terms: 'homomorphism isomorphism kernel image structure preserving',
    },
    {
      id: 'quotient-groups',
      match: /\b(normal subgroup|quotient group)\b/i,
      name: 'Normal subgroups and quotients',
      is: 'When the cosets form a group themselves, and the first isomorphism theorem as the statement that kernels and quotients are the same thing.',
      needs: ['group-homomorphisms'],
      terms: 'normal subgroup quotient group first isomorphism theorem simple group',
    },
    {
      id: 'group-actions',
      match: /\b(group action|orbit(–|-)stabili[sz]er|burnside)\b/i,
      name: 'Group actions',
      is: 'A group acting on a set, with orbits, stabilisers and the counting formula that follows — this is how groups get used.',
      needs: ['quotient-groups', 'counting-principles'],
      terms: 'group action orbit stabiliser burnside orbit counting conjugacy',
    },
    {
      id: 'finite-group-classification',
      match: /\b(sylow|classification of finite simple groups|finite group)\b/i,
      name: 'Structure of finite groups',
      is: 'Sylow\'s theorems and the classification of finite abelian groups — how far the axioms alone pin a group down.',
      needs: ['group-actions'],
      terms: 'sylow theorem finite abelian group classification p group solvable',
    },
    {
      id: 'rings',
      match: /^ring \(mathematics\)|\bring theory\b/i,
      name: 'Rings',
      is: 'Two operations instead of one, which admits the integers, polynomials and matrices as the same kind of object.',
      needs: ['groups', 'polynomial-arithmetic'],
      terms: 'ring commutative ring unit zero divisor integral domain',
    },
    {
      id: 'ideals-and-quotient-rings',
      match: /\b(ideal \(ring theory\)|quotient ring)\b/i,
      name: 'Ideals and quotient rings',
      is: 'The ring analogue of a normal subgroup, and modular arithmetic as the first example of a quotient.',
      needs: ['rings', 'modular-arithmetic'],
      exercises: ['modular-arithmetic'],
      terms: 'ideal principal ideal quotient ring maximal prime ideal',
    },
    {
      id: 'unique-factorisation-domains',
      match: /\b(unique factori[sz]ation|principal ideal domain|euclidean domain)\b/i,
      name: 'Factorisation in rings',
      is: 'Where unique factorisation survives and where it fails — the failure is what motivated algebraic number theory.',
      needs: ['ideals-and-quotient-rings', 'prime-factorisation'],
      terms: 'euclidean domain principal ideal domain unique factorisation irreducible',
    },
    {
      id: 'fields',
      match: /^field \(mathematics\)|\bfinite field\b/i,
      name: 'Fields',
      is: 'Every nonzero element invertible, with the finite fields as the examples that are not just the usual number systems.',
      needs: ['ideals-and-quotient-rings'],
      terms: 'field finite field characteristic galois field division ring',
    },
    {
      id: 'polynomial-rings',
      match: /\b(polynomial ring|irreducible polynomial|eisenstein('|’)?s criterion)\b/i,
      name: 'Polynomial rings and irreducibility',
      is: 'Polynomials over a field as a Euclidean domain, with irreducibility playing the role of primality.',
      needs: ['fields', 'polynomial-division'],
      exercises: ['polynomial-division'],
      terms: 'polynomial ring irreducible eisenstein gauss lemma',
    },
    {
      id: 'field-extensions',
      match: /\bfield extension\b|\balgebraic extension\b/i,
      name: 'Field extensions',
      is: 'Building a bigger field by adjoining a root, and measuring the result as a vector space over the smaller one.',
      needs: ['polynomial-rings', 'basis-and-dimension'],
      terms: 'field extension degree algebraic element minimal polynomial splitting field',
    },
    {
      id: 'galois-theory',
      match: /\bgalois\b/i,
      name: 'Galois theory',
      is: 'A correspondence between subfields and subgroups, which converts a question about roots into a question about a group.',
      needs: ['field-extensions', 'quotient-groups'],
      terms: 'galois group correspondence solvable by radicals quintic constructible',
    },
    {
      id: 'representation-theory',
      match: /\brepresentation theory\b|\bcharacter theory\b/i,
      name: 'Representation theory',
      is: 'Realising a group as matrices, so linear algebra answers questions the group axioms alone cannot.',
      needs: ['group-actions', 'spectral-theorem'],
      terms: 'representation character irreducible schur lemma maschke',
    },
  ],
}

const TOPOLOGY: MapArea = {
  id: 'topology',
  name: 'Topology',
  covers:
    'What survives when distance is dropped and only nearness is kept: continuity, compactness, ' +
    'connectedness, and the first invariants.',
  nodes: [
    {
      id: 'topological-spaces',
      match: /\b(topological space|topology)\b/i,
      name: 'Topological spaces',
      is: 'Declaring which sets are open and requiring only unions and finite intersections — less structure than a metric, and enough for continuity.',
      needs: ['metric-spaces', 'sets'],
      terms: 'topological space open set closed set basis subspace topology',
    },
    {
      id: 'closure-and-interior',
      match: /\b(closure \(topology\)|interior \(topology\)|boundary \(topology\))\b/i,
      name: 'Closure, interior and boundary',
      is: 'The largest open set inside, the smallest closed set outside, and what is left over — with density as a consequence.',
      needs: ['topological-spaces'],
      terms: 'closure interior boundary dense limit point',
    },
    {
      id: 'topological-continuity',
      match: /\bcontinuous function \(topology\)|\bhomeomorphism\b/i,
      name: 'Continuity without distance',
      is: 'Preimages of open sets are open, which is equivalent to ε-δ on a metric space and makes sense where ε does not.',
      needs: ['closure-and-interior', 'uniform-continuity'],
      terms: 'continuous map preimage open homeomorphism topological equivalence',
    },
    {
      id: 'compactness',
      match: /\bcompact (space|set)\b|\bcompactness\b|\bheine(–|-)borel\b/i,
      name: 'Compactness',
      is: 'Every open cover has a finite subcover — the property that makes "closed and bounded" work, generalised correctly.',
      needs: ['topological-continuity', 'bolzano-weierstrass'],
      terms: 'compact open cover finite subcover heine borel tychonoff',
    },
    {
      id: 'connectedness',
      match: /\bconnected space\b|\bconnectedness\b/i,
      name: 'Connectedness',
      is: 'Not splittable into two open pieces, which is what the intermediate value theorem is really a statement about.',
      needs: ['topological-continuity'],
      terms: 'connected path connected component intermediate value',
    },
    {
      id: 'separation-and-metrisability',
      match: /\b(separation axiom|hausdorff space|urysohn)\b/i,
      name: 'Separation axioms',
      is: 'Hausdorff and its relatives: how much a topology has to allow points to be told apart before it behaves.',
      needs: ['compactness'],
      terms: 'hausdorff regular normal separation axiom urysohn metrisable',
    },
    {
      id: 'quotient-and-product-spaces',
      match: /\b(quotient space \(topology\)|product topology)\b/i,
      name: 'Products and quotients',
      is: 'Building new spaces by gluing or multiplying, which is how the torus and the Möbius band get defined precisely.',
      needs: ['separation-and-metrisability', 'relations'],
      terms: 'product topology quotient space gluing identification torus mobius',
    },
    {
      id: 'homotopy-and-fundamental-group',
      match: /\b(homotopy|fundamental group|covering space)\b/i,
      name: 'Homotopy and the fundamental group',
      is: 'Loops up to deformation, forming a group whose non-triviality detects a hole.',
      needs: ['quotient-and-product-spaces', 'groups'],
      terms: 'homotopy fundamental group loop covering space simply connected',
    },
    {
      id: 'homology',
      match: /\bhomology\b|\bcohomology\b/i,
      name: 'Homology',
      is: 'Counting holes of each dimension by linear algebra on chains, which is computable where homotopy is not.',
      needs: ['homotopy-and-fundamental-group', 'rank-nullity'],
      terms: 'homology chain complex betti number euler characteristic exact sequence',
    },
    {
      id: 'manifolds',
      match: /\bmanifold/i,
      name: 'Manifolds',
      is: 'Spaces that look locally like Euclidean space, which is the minimum needed to do calculus on something curved.',
      needs: ['quotient-and-product-spaces', 'multivariable-chain-rule'],
      terms: 'manifold chart atlas tangent space smooth structure',
    },
    {
      id: 'differential-forms',
      match: /\bdifferential form\b|\bexterior derivative\b/i,
      name: 'Differential forms and Stokes',
      is: 'The object an integral really eats, under which Green, Stokes and divergence become one equation.',
      needs: ['manifolds', 'greens-stokes-divergence'],
      exercises: ['greens-stokes-divergence'],
      terms: 'differential form exterior derivative wedge product generalised stokes',
    },
  ],
}

export const STRUCTURE_AREAS: MapArea[] = [
  LINEAR_ALGEBRA,
  DISCRETE_MATHEMATICS,
  NUMBER_THEORY,
  ABSTRACT_ALGEBRA,
  TOPOLOGY,
]
