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
    'vectors returning a number. So this area now begins one question later again — not "how ' +
    'many independent directions does a space have", nor "what does it mean for two of them to ' +
    'be perpendicular", but what a MAP does to them, which is a rank and a kernel. The ' +
    'definition of a space, the count of its directions and the rule that gives it angles are ' +
    'all somewhere a learner arrives from the plane rather than from the top of this list. What ' +
    'is still here and rests on the last of those is the ORTHOGONALITY THAT IS A THEOREM rather ' +
    'than a definition: a symmetric matrix having an orthonormal eigenbasis, and the best answer ' +
    'to an unsolvable system being a projection onto a column space.',
  nodes: [
    {
      id: 'rank-nullity',
      match: /\b(rank(–|-)nullity|rank \(linear algebra\)|kernel \(linear algebra\))\b/i,
      name: 'Rank, kernel and the rank–nullity theorem',
      is: 'What a map hits and what it kills, with their dimensions summing to the dimension of the source.',
      needs: ['basis-and-dimension', 'gaussian-elimination'],
      terms: 'rank nullity kernel null space image column space',
    },
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
      terms: 'diagonalisation similar matrices jordan form multiplicity',
    },
    {
      id: 'spectral-theorem',
      match: /\bspectral theorem\b/i,
      name: 'The spectral theorem',
      is: 'A symmetric matrix has an orthonormal eigenbasis and real eigenvalues — the cleanest theorem in the subject.',
      needs: ['diagonalisation', 'inner-product-spaces'],
      terms: 'spectral theorem symmetric matrix orthogonal diagonalisation quadratic form',
    },
    {
      id: 'least-squares',
      match: /\bleast squares\b/i,
      name: 'Least squares',
      is: 'The best answer to an unsolvable system, which is an orthogonal projection onto the column space.',
      needs: ['inner-product-spaces', 'rank-nullity'],
      terms: 'least squares normal equations projection residual regression',
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
   * Edges pointing the other way — `eigenvalues` needs `determinant`,
   * `rank-nullity` and `numerical-linear-algebra` need `gaussian-elimination`
   * — are declared on the nodes that REMAIN, so they survive untouched and
   * resolve across the file boundary in `composeAtlas`. Only the incoming ones
   * are restated here.
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
  ],
}

const DISCRETE_MATHEMATICS: MapArea = {
  id: 'discrete-mathematics',
  name: 'Discrete mathematics',
  covers:
    'Logic, sets, counting, graphs and recurrences — the mathematics of finite and countable ' +
    'structures, and the formal apparatus of proof.',
  nodes: [
    {
      id: 'propositional-logic',
      match: /\b(propositional (logic|calculus)|boolean algebra|truth table)\b/i,
      name: 'Propositional logic',
      is: 'Connectives and truth tables, with implication as the one whose truth table surprises everybody.',
      needs: ['geometric-proof'],
      terms: 'propositional logic truth table implication contrapositive tautology',
    },
    {
      id: 'quantifiers',
      match: /\bquantifier\b/i,
      name: 'Quantifiers',
      is: 'For-all and there-exists, where the order of two different quantifiers changes the claim entirely.',
      needs: ['propositional-logic'],
      terms: 'quantifier universal existential negation of quantifier scope',
    },
    {
      id: 'proof-techniques',
      match: /\b(mathematical proof|proof by contradiction|contraposition)\b/i,
      name: 'Proof techniques',
      is: 'Direct, contrapositive, contradiction and cases — four shapes of argument, each suited to a shape of statement.',
      needs: ['quantifiers'],
      terms: 'direct proof contradiction contrapositive proof by cases counterexample',
    },
    {
      id: 'sets',
      match: /\bset (theory|operations)\b|^set \(mathematics\)/i,
      name: 'Sets and set operations',
      is: 'Membership, the operations, and the identities — proved by double inclusion rather than by picture.',
      needs: ['proof-techniques'],
      terms: 'set union intersection complement subset power set venn',
    },
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

const NUMBER_THEORY: MapArea = {
  id: 'number-theory',
  name: 'Number theory',
  covers:
    'The integers taken seriously: divisibility, congruence, the multiplicative structure of the ' +
    'residues, and the distribution of primes.',
  nodes: [
    {
      id: 'division-algorithm',
      match: /\b(euclidean division|division algorithm|divisor)\b/i,
      name: 'The division algorithm',
      is: 'Quotient and remainder exist and are unique — the fact every argument about divisibility unwinds to.',
      needs: ['divisibility', 'proof-techniques'],
      terms: 'division algorithm quotient remainder well ordering',
    },
    {
      id: 'euclidean-algorithm',
      match: /\b(euclidean algorithm|b(é|e)zout)\b/i,
      name: 'The Euclidean algorithm and Bézout',
      is: 'Computing a gcd by repeated remainder, and the identity that writes it as an integer combination.',
      needs: ['division-algorithm', 'gcd-and-lcm'],
      exercises: ['gcd-and-lcm'],
      terms: 'euclidean algorithm bezout identity extended gcd coprime',
    },
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
