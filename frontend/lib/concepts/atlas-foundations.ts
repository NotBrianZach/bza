/**
 * Foundations: what a school mathematics education actually passes through.
 *
 * Four areas, in the order they are usually met, and the order is a real claim
 * rather than a convention — every edge here is "you cannot do the second
 * without the first", not "the second is normally taught later".
 *
 * ── IT WAS SIX AREAS, AND TWO OF THEM WERE MERGED AWAY ────────────────────
 *
 * `NUMBER_AND_ARITHMETIC` was absorbed into `ALGEBRA_FOUNDATIONS`, and
 * `COORDINATE_GEOMETRY` into `EUCLIDEAN_GEOMETRY`. Both merges were forced by
 * the same thing and both are decisions about the learner-facing MAP rather
 * than bookkeeping, so each is argued where it happened: the block above the
 * node list of `ALGEBRA_FOUNDATIONS` carries the first and the block above
 * `EUCLIDEAN_GEOMETRY`'s carries the second.
 *
 * The forcing fact in one paragraph. tests/atlas.mjs asserts that no area has
 * fewer than five nodes — "no area is a stub" — and authoring a mapped node
 * DELETES it from its area, because `atlasProblems` refuses a map node that
 * collides with an authored concept. So an area that succeeds shrinks toward
 * the floor and then freezes: `number-and-arithmetic` had given up ten nodes,
 * was down to five, and could give up no more. Two of the five were on the
 * only two learning journeys still unfinished. `euclidean-geometry` was three
 * promotions from the same wall with five route concepts to release.
 *
 * The floor was not lowered and must not be. It is the only thing between
 * this map and a scatter of one-node areas, and an area of three nodes is not
 * a region of the map, it is a leftover. What a drained remnant needs is a
 * neighbour, which is what both merges gave it.
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

const ALGEBRA_FOUNDATIONS: MapArea = {
  id: 'algebra-foundations',
  name: 'Number and algebra',
  covers:
    'Number and the letters that stand for it: percent and ratio, scientific notation, and then ' +
    'equations, inequalities, systems and quadratics. These were two areas until the number ' +
    'half had been almost entirely written out. The arithmetic underneath — place value, the ' +
    'written algorithms, order of operations, signed numbers, divisibility, fractions, prime ' +
    'factorisation, the gcd and lcm built on those primes, the roots and the irrationals those ' +
    'factorisations decide, and the decimal expansions they decide in the other direction — has ' +
    'problems written for it and lives in the arithmetic-foundations syllabus, as do what a ' +
    'letter standing for a number actually means and the polynomial and rational manipulation ' +
    'built on that; this area points at all of them rather than restating them. The real line ' +
    'has gone the same way as an eleventh, taking what survives being written down about it: ' +
    'that the digits of an irrational root are each settled by whole-number arithmetic, that no ' +
    'two numbers on the line are adjacent because their mean is always between them, and that ' +
    'the least-upper-bound property is assumed rather than proved at this level. What stays ' +
    'behind of it is nothing, because what would have stayed behind is the construction, and ' +
    'the map already files that in real analysis. So the old line between number and algebra ' +
    '— nothing ' +
    'symbolic on one side, a letter standing for an unknown on the other — still holds of the ' +
    'mathematics and no longer divides two regions of the map. It runs inside this one, and the ' +
    'division a learner can still see is between what is written and what is only named.',
  /**
   * THIS AREA ABSORBED `NUMBER_AND_ARITHMETIC`, AND THE STUB FLOOR IS WHY.
   *
   * tests/atlas.mjs asserts that `AREAS.filter(a => a.nodes.length < 5)` is
   * empty — "no area is a stub". Authoring a mapped node DELETES it from its
   * area, because `atlasProblems` refuses a node whose id collides with an
   * authored concept. So an area that succeeds shrinks, and
   * `number-and-arithmetic` had succeeded ten times: fifteen nodes down to
   * five, which is the floor exactly. It could give up no more, and two of the
   * five — `real-number-line` and `ratio-and-rate` — were steps on the only
   * two learning journeys still carrying unwritten ground.
   * ontology-geometry.ts had been calling that pair "the area-floor
   * casualties" for three promotions running and passing over them each time,
   * which is the shape of a deadlock rather than of a queue.
   *
   * THE THING NOT TO DO WAS EDIT THE CHECK, and it is worth saying plainly
   * because it is both the one-line fix and the wrong one. The floor is what
   * stands between this map and a scatter of one-node areas. An area is the
   * unit a learner is shown a region of mathematics in; three nodes is not a
   * region, it is a leftover, and a map that lets every successful branch
   * decay into one has no editorial standard left. The remnant's own note said
   * exactly this before the merge existed, and said what to do instead: merge
   * into a neighbour. That note is reproduced below, where the ten departures
   * are counted.
   *
   * ONE HONEST WEAKNESS IN THE CHECK — RECOMMENDED, NOT APPLIED. The floor
   * cannot tell an area that DRAINED from one that was never filled: fifteen
   * nodes down to five by authoring reads identically to five somebody
   * sketched and abandoned. A version counting nodes-plus-departures against
   * the floor would separate the two and would have let this area keep
   * promoting with no merge at all. That is a real option and it is not what
   * happened here, for the reason the remnant's note gives: at five remaining
   * against ten gone the honest reading of that area was "mostly written", and
   * a region whose content has moved into a syllabus should follow it rather
   * than be propped up by a more forgiving test. The weakness is written down
   * because the NEXT drained area may genuinely want the other answer, and
   * whoever faces it should not have to rediscover that the choice exists.
   *
   * WHAT HAPPENED TO THE BOUNDARY — IT MOVED, IT WAS NOT RESTATED. Both areas
   * drew the same line from opposite sides. "Nothing symbolic — the moment a
   * letter stands for an unknown, it is algebra" was the number area's closing
   * sentence, and this area's `covers` mirrored it with "letters standing for
   * numbers". That claim is still true of the mathematics and has stopped
   * being a fact about the map, because the map no longer keeps two regions
   * for it to separate. The two `covers` paragraphs were rewritten into the
   * one above, which says so. Leaving either of them asserting the old split
   * would have been the worst outcome available: a reader would find the file
   * claiming a division that the `AREAS` array itself contradicts.
   *
   * WHAT THE MERGE COST, which was almost nothing — and the reason is worth
   * keeping, because it will not be true of the next merge. A merge has to
   * re-examine every `links` entry in BOTH areas, since an entry whose two
   * ends now sit in the SAME area has become an ordinary `needs` edge and must
   * be deleted: `composeAtlas` would otherwise emit that edge twice, and a
   * duplicate is not something it notices or any test catches.
   * `number-and-arithmetic` arrived with `links` EMPTY — it had handed its
   * last entry back to `arithmetic-foundations` when `gcd-and-lcm` was
   * promoted — and not one of the eight entries below has both ends inside
   * this area, so nothing had to go and nothing had to move. Nor did either
   * area carry a `confusedWith` on a node that moved: the single interference
   * in the merged area is `linear-inequalities ~ linear-equations`, and both
   * of its ends were already here.
   *
   * tests/atlas.mjs asserts all three of those by name rather than by count,
   * and the interference one earns its place: `interferes_with` constrains
   * SELECTION rather than gating, so dropping one keeps every suite green
   * while quietly freeing the scheduler to introduce the two most confusable
   * concepts in the subject together.
   *
   * WHAT IT GAINED. Four edges that crossed an area boundary are now internal
   * to one — `absolute-value-equations → absolute-value`,
   * `linear-inequalities → real-number-line`, `word-problems → ratio-and-rate`
   * and `percent → ratio-and-rate`. Not one of them was touched, because an
   * edge is owned by the node that DECLARES it and all four are declared by
   * nodes that were already in one of the two areas. What changed is that
   * `areaOntology` keeps only internal edges, so all four appear in the area
   * view for the first time and the area viewed alone is one connected drawing
   * instead of two with a gap between them.
   *
   * THE BUDGET THIS BOUGHT. Fifteen nodes against a floor of five was ten
   * promotions, and the two remaining journeys needed four of them from here:
   * `real-number-line`, `ratio-and-rate`, `linear-equations` and
   * `systems-of-linear-equations`. The first has since been taken, so it is
   * fourteen nodes, nine promotions of room, and three still owed. Nothing in
   * this area is held back by the floor any more, and nothing in it comes
   * close.
   *
   * The merge is also no longer a change made on a prediction, which is the
   * honest counter-argument it was recorded with. `real-number-line` is the
   * concept this area could not release before the merge and the first one
   * authored after it, so the thing the merge was for has happened once rather
   * than only been argued for.
   */
  /**
   * FIFTEEN NODES HAVE LEFT THE TWO AREAS THAT MADE THIS ONE, AND HAD TO.
   *
   * Eleven from the number half — `place-value`, `integer-arithmetic`,
   * `order-of-operations`, `negative-numbers`, `divisibility`,
   * `fraction-arithmetic`, `prime-factorisation`, `gcd-and-lcm`,
   * `roots-and-irrationals`, `decimal-representation` and `real-number-line`
   * — all now real concepts with worked examples and tasks, in
   * ontology-arithmetic.ts. Four from the algebraic half:
   * `variables-and-expressions` in ontology-algebra.ts, and
   * `completing-the-square`, `quadratic-formula` and `polynomial-roots` in
   * ontology.ts.
   *
   * `atlasProblems` rejects a map node whose id collides with an authored
   * concept — not as tidiness, but because the composed concept list would
   * then hold two entries for the id and the shadowing copy has no knowledge
   * points, so a fully authored concept would silently read as unteachable.
   *
   * The count is kept current deliberately. It is the measurement of how far
   * this area has turned into a syllabus, and a comment saying "five" while
   * eleven have gone is the kind of rot that makes a reader distrust the rest
   * of the file. Fifteen gone against fourteen remaining is also the figure
   * that forced the merge argued above, read one promotion later: ten of the
   * first fourteen came out of a single area of fifteen, and what that left was
   * not a region of the map. The eleventh is the one that could not have
   * happened without the merge.
   *
   * The `needs` below still name the departed. That is the intended way for
   * the map to meet a syllabus: the edge resolves in `composeAtlas`, where
   * both endpoints exist. It is dropped by `areaOntology`, which keeps only
   * edges internal to the area — so this area viewed alone has seven roots
   * rather than one, being every node whose prerequisites have all been
   * authored out from under it, from `absolute-value` at the bottom to
   * `binomial-theorem` near the top. That is the area view being honest about
   * its own boundary rather than a fault, and tests/atlas.mjs asserts the set
   * by NAMED membership, because a merge or a promotion can turn a root set
   * over completely without changing its size.
   *
   * It was eight until `real-number-line` was promoted, and until that
   * promotion this paragraph was claiming an assertion that did not exist —
   * the named-membership check was written for `euclidean-geometry` and never
   * for this area. The promotion added it. Worth leaving on the record,
   * because a comment asserting that something is tested is read as evidence
   * that it is, and this one was wrong for as long as it was true by accident.
   *
   * An edge is owned by the node that DECLARES it, which is the part that
   * catches people out. Promoting a node strands the `needs` on the node
   * itself and leaves every edge declared elsewhere alone — so a promotion
   * needs a `links` entry only when something that STAYED depended on the node
   * that left, and hands one BACK when the far end of an existing link is
   * promoted in turn. The number half produced one of each and finished with
   * `links` empty, which is the whole reason the merge had nothing to
   * reconcile. Every entry under `links` below came from the algebraic half.
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
    /*
     * `decimal-representation` was here and is now authored in
     * ontology-arithmetic.ts, so it had to leave — same rule, tenth time in
     * this area. See the block above the node list.
     *
     * BOTH of its own edges left with it and BOTH are restated inside that
     * subject, which makes this the second promotion out of this area needing
     * no `links` change at all — `roots-and-irrationals` was the first, and the
     * reason is the same: the node declared
     * `needs: ['fraction-arithmetic', 'prime-factorisation']` and both of those
     * are authored in the subject the node has joined, so every stranded edge
     * has an owner there and none crosses a subject boundary.
     *
     * Three edges pointing the OTHER way were left untouched, and this is the
     * cleanest case of that in the file: `percent`, `ratio-and-rate`'s
     * neighbour, is immediately below, and `real-number-line` and
     * `scientific-notation` followed it. All three named this concept in their
     * own `needs`, all three STAYED here, so all three survived as written and
     * `composeAtlas` resolved them across the file boundary. Nothing had to
     * move into `links`, because `links` is for an edge NEITHER of whose owners
     * is a node of this area, and here the declaring end was a node of this
     * area every time.
     *
     * Two of the three still are, and that is the sentence worth correcting
     * rather than deleting. `real-number-line` has since been promoted into
     * `arithmetic-foundations` itself, so the edge it declared is no longer an
     * into-edge resolved across a file boundary — it is an ordinary
     * prerequisite inside that ontology's own `EDGES`. The list above reads
     * like a roster of safe edges and it is not: on a branch being authored
     * upward, every into-edge is a future stranded edge, which is the lesson
     * `EUCLIDEAN_GEOMETRY`'s comment reaches by the same route.
     *
     * Worth noting for whoever promotes the next one: this area is down to five
     * nodes, and tests/atlas.mjs asserts that no area has fewer than five
     * ("no area is a stub"). The next promotion out of here trips that check,
     * and the right answer will probably be to merge what is left into a
     * neighbouring area rather than to loosen the threshold — an area of three
     * nodes is not a region of the map, it is a leftover.
     *
     * THAT IS WHAT HAPPENED, AND THE PREDICTION HELD IN BOTH HALVES. The next
     * promotion out of here was never attempted: ontology-geometry.ts records
     * three successive promotions passing over `real-number-line` and
     * `ratio-and-rate` as "the area-floor casualties", because there was
     * nowhere for them to go. The answer taken was the one this paragraph
     * guessed — `number-and-arithmetic` was merged into `algebra-foundations`,
     * which is the area these five nodes are now part of, and the threshold was
     * left alone. The block above the node list argues it. The one thing this
     * paragraph did not see is that the SAME wall was three promotions ahead in
     * `euclidean-geometry`, so the merge had to be made twice.
     */
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
    /*
     * `roots-and-irrationals` was here and is now authored in
     * ontology-arithmetic.ts, so it had to leave — same rule, ninth time in
     * this area. See the block above the node list.
     *
     * BOTH of its own edges left with it and BOTH are restated inside that
     * subject, which makes this the cleanest promotion this area has
     * produced: it needed no `links` entry and gave none up. The node
     * declared `needs: ['prime-factorisation', 'fraction-arithmetic']` and
     * both endpoints are authored in the same subject as the node now is, so
     * both edges have an owner there and nothing crosses a subject boundary.
     * Compare the two above it — `prime-factorisation` restated one edge and
     * `gcd-and-lcm` restated one and reclaimed one from this area's `links`.
     *
     * Three kinds of edge pointing the OTHER way were left untouched, and
     * they are worth separating because only the first two are of this area:
     *
     *  - `real-number-line`, immediately below, named it in its own `needs`,
     *    and was at the time declared by a node that STAYED — so it survived
     *    as written and `composeAtlas` resolved it across the file boundary.
     *    That stopped being true when `real-number-line` was promoted in its
     *    turn: the edge went with the node, and is now a plain prerequisite
     *    inside `ARITHMETIC_FOUNDATIONS.edges`. Same correction as the bullet
     *    below, reached the same way, one promotion later.
     *  - `pythagoras` USED TO do the same from further away, and no longer
     *    does — it has since been authored in ontology-geometry.ts, so the
     *    edge it declared could not stay with it. A hypotenuse is a square
     *    root, which is the one place school geometry cannot avoid the
     *    irrationals, so the claim is unchanged and only its home moved: it is
     *    now the second entry in `EUCLIDEAN_GEOMETRY.links`, which is where a
     *    stranded edge goes when its two endpoints end up in different
     *    ontologies. Noted rather than deleted because this bullet listed it
     *    under "declared by a node that STAYED", and that is exactly the kind
     *    of sentence that rots into a lie when the node leaves.
     *  - the two entries in `ALGEBRA_FOUNDATIONS.links` running from here to
     *    `quadratic-formula` and to `rational-exponents` stay in `links`, and
     *    the reason has CHANGED even though the location has not: they used
     *    to cross from a map node to an authored concept, and now they cross
     *    between authored concepts in DIFFERENT subjects. An ontology's edges
     *    may only name concepts it contains, so neither end can take them and
     *    `links` is still the only place they fit. The notes beside them say
     *    so.
     *
     * What this area kept was `real-number-line`, which was not made redundant
     * by the promotion — the roots produce the first irrational number, and
     * assembling the rationals and irrationals into one complete ordered line
     * is a separate claim. It has since been promoted in its turn; the note
     * where it sat is below.
     */
    /*
     * `real-number-line` was here and is now authored in ontology-arithmetic.ts,
     * so it had to leave — same rule, eleventh time out of the number half.
     * See the block above the node list.
     *
     * BOTH of its own edges were stranded and BOTH had somewhere to go, which
     * makes this the third promotion out of this half in a row that cost the
     * area nothing at all. It declared
     * `needs: ['roots-and-irrationals', 'decimal-representation']`, both of
     * them already concepts of `arithmetic-foundations`, so the two edges are
     * restated in that ontology's own `EDGES` and no `links` entry was needed
     * in either direction. The long note in that file argues both.
     *
     * THE RUN OF THREE ENDS HERE, AND WHY IS WORTH KNOWING BEFORE THE NEXT
     * PROMOTION. The cheap shape is not a property of this area or of that
     * subject; it is a property of a branch authored from the bottom up, where
     * each promoted node's `needs` point at nodes promoted just before it into
     * the same file. Nothing left in this area has it. `ratio-and-rate` comes
     * closest — it rests on `fraction-arithmetic` alone, which is authored
     * there — and it still fails, because `percent` and `word-problems` name it
     * from INSIDE this area, so promoting it strands two incoming edges into
     * `links`. That is the `fraction-arithmetic` case again, which this file
     * records two removals above.
     *
     * The edge that pointed INTO it was left alone, as the rule says:
     * `linear-inequalities` below names it in its own `needs`, that node
     * stayed, so it still owns the edge and `composeAtlas` resolves it across
     * the file boundary. It also gates now, where before it pointed at an empty
     * node the gating walk looked straight through — so `linear-inequalities`
     * has acquired a real prerequisite without anybody editing it, which is
     * authoring tightening the gate rather than widening it.
     *
     * AND ONE `links` ENTRY'S REASON CHANGED WITHOUT ITS HOME CHANGING, which
     * is the kind of thing that rots quietly. `EUCLIDEAN_GEOMETRY.links` holds
     * `real-number-line → cartesian-plane`, filed there because the edge was
     * `cartesian-plane`'s own `needs` and that node lived in the area which is
     * now part of that one. It used to be there because this end was an
     * unwritten map node with no ontology to belong to. It is there now because
     * this end is authored in `arithmetic-foundations` while the other is
     * authored in `vectors-and-independence`, and an ontology may only name
     * concepts it CONTAINS — so the entry stays, and for the same reason as its
     * neighbour `negative-numbers → cartesian-plane` rather than for a
     * different one. The note above that list says so.
     *
     * THE ROOT SET OF THIS AREA SHRANK, from eight to seven, which is the
     * fifth-promotion shape rather than the fourth's: `real-number-line` had no
     * prerequisite inside this area and was therefore a root itself, and the
     * one node resting on it — `linear-inequalities` — did not take its place,
     * because its other prerequisite `linear-equations` is still here and still
     * gates it from inside. A departing node promotes its dependents to roots
     * only when it was the LAST of their prerequisites inside the area.
     * Asserted by named membership in tests/atlas.mjs, where this promotion
     * added the assertion: the block above the node list had been claiming that
     * set was checked by name and nothing was checking it, so a promotion could
     * have turned it over in silence.
     */
    {
      id: 'scientific-notation',
      match: /\b(scientific notation|order of magnitude|significant figure)/i,
      name: 'Scientific notation and estimation',
      is: 'Writing a quantity as a digit times a power of ten, which is what makes orders of magnitude comparable at a glance.',
      needs: ['decimal-representation'],
      terms: 'scientific notation order of magnitude significant figures estimation',
    },
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
     *
     * It said "as THE root" while this was the algebra area alone, and the
     * merge with `number-and-arithmetic` made it one of eight — see the root
     * set named in the block above the node list. The claim about this node is
     * unchanged; what changed is how many other nodes are in the same position.
     */
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
       * ontology.ts. This one stays here, and the REASON has changed since it
       * was written even though the location has not — worth recording,
       * because the original reason no longer applies and a reader checking it
       * would find it false:
       *
       *  - It used to cross from a map node to an authored concept, and
       *    `links` is where such an edge lives because the map node cannot
       *    own it.
       *  - `roots-and-irrationals` is now authored too, in
       *    `arithmetic-foundations`. So it crosses between two authored
       *    concepts in DIFFERENT subjects, and an authored ontology's edges
       *    may only name concepts it contains, or `ontologyProblems` reports
       *    an unknown endpoint. Neither subject can take it.
       *
       * Same conclusion by a different route: `links` is still the only place
       * it fits. Contrast `gcd-and-lcm → fraction-arithmetic`, which left
       * this file's `links` on promotion precisely because both of ITS
       * endpoints ended up in the same subject.
       *
       * Written at the same time as the first promotion rather than
       * afterwards, because the one previous time a node was authored out of
       * this file the edge went with it and nobody noticed until
       * `function-concept` was drawn as a root of mathematics.
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
      /*
       * Stays in `links` for the same changed reason as the edge above: both
       * ends are authored now, in `arithmetic-foundations` and
       * `exponents-and-logarithms` respectively, and neither subject may name
       * a concept it does not contain.
       *
       * This is also the edge that makes the promotion pay off twice. It is
       * the last step of the "Undo a power" journey, whose other eight steps
       * were already written — so authoring the far end of this one link is
       * what took that route from one gap to none.
       */
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
  name: 'Geometry',
  covers:
    'Geometry both ways round. Synthetic plane and solid geometry — circles, area and volume, ' +
    'and the deductive style the subject exists to teach — and then the same plane done with ' +
    'algebra, where lines and conics are equations, distance and midpoint are formulas, a ' +
    'transformation acts on coordinates, and three dimensions are a third number. ' +
    'Six of its nodes have left for the plane-geometry syllabus, where ' +
    'they have problems written for them, and this area points at them through `needs` rather ' +
    'than restating them: the undefined terms and the first angle facts — what a straight line ' +
    'and a full turn force, a vertical pair, and what a parallel pair forces across a ' +
    'transversal — then the triangle as far as its numbers go, meaning the 180° angle sum, the ' +
    'exterior angle, which triples of lengths close, and why at most one angle can be 90° or ' +
    'more — then congruence as far as it goes without a drawing, meaning what a congruence ' +
    'statement\'s letter order asserts, why three of the six measurements force the rest, and the ' +
    'base angles of an isosceles triangle — and now similarity on the same terms, meaning what a ' +
    'similarity\'s letter order asserts once three of those six claims weaken to a shared ratio, ' +
    'why two angles settle it when three could not settle a congruence, and why a ratio taken ' +
    'inside one figure survives scaling when the scale factor does not. What stayed behind of ' +
    'both is the part that needs the figure: the proofs of SSS, SAS and ASA, the refutation of ' +
    'SSA, and the justification of the similarity criteria. Pythagoras has gone the same way as ' +
    'a fifth, taking the relation itself — why its three letters are not interchangeable, the ' +
    'hypotenuse as a positive root that is normally an irrational surd, and the converse as a ' +
    'test on three lengths whose sign separates acute from right from obtuse — and leaving behind ' +
    'both proofs of the identity, which are dissections or similar-triangle arguments about a ' +
    'figure, and the derivation of the converse, which needs the law of cosines from above this ' +
    'area. The polygons have gone as a sixth, and they are the first departure that is not about ' +
    'the triangle: the two angle totals a polygon carries and why only one of them grows with ' +
    'the number of sides, what a diagonal does to a quadrilateral and which of its four angles ' +
    'that leaves whole, and why equal sides force equal angles in a triangle and in nothing ' +
    'larger. What stayed behind of that one is the part that measures ALONG a diagonal rather ' +
    'than cutting with it — that a parallelogram\'s diagonals bisect each other, that a ' +
    'rhombus\'s are perpendicular, that a rectangle\'s are equal — together with the kite and ' +
    'the trapezium, whose definitions are about which pair of sides does what, and the ' +
    'converses that make the family a hierarchy. The triangle is still named in this area\'s ' +
    'title claim because the rest of what is synthetic about it is still here, the circle ' +
    'theorems above all; `circles` is now the first node above the syllabus. Coordinates used ' +
    'to be a separate area and are not any more: the synthetic/analytic split is still real ' +
    'mathematics and had stopped being a usable division of the MAP, so it runs inside this area ' +
    'now rather than between two of them. The plane itself is in neither half — pairing a point ' +
    'with two numbers has problems written for it and lives in the vectors syllabus, which the ' +
    'analytic nodes point at rather than restating.',
  /**
   * THIS AREA ABSORBED `COORDINATE_GEOMETRY`, AND IT IS THE SAME FLOOR AGAIN.
   *
   * The argument is made in full above the node list of `ALGEBRA_FOUNDATIONS`,
   * which merged for the same reason on the same day, and is not repeated here.
   * What is recorded here is the part that differs, which is the TIMING — and
   * that is the whole of why this merge is a judgement rather than a
   * consequence.
   *
   * `number-and-arithmetic` was frozen: five nodes, floor of five, nowhere to
   * go. This area was not. It had eight nodes and could release three before
   * hitting the floor. But it holds FIVE of the concepts the two unfinished
   * journeys cross — `geometric-proof`, `area-and-perimeter`, `circles`,
   * `circle-measure` and `solid-geometry` — so three releases is not enough,
   * and the two that would be left are the two at the top: the ones a route
   * reaches LAST. And `three-dimensional-coordinates`, in the area that has
   * now been merged in, sits directly behind `solid-geometry`, so it was
   * blocked transitively by a floor in a different area from its own.
   *
   * So the deadlock was not two independent problems. It was one wall standing
   * in two places, and merging only the frozen half would have bought eight
   * promotions project-wide and then stalled both journeys at exactly the
   * point they stall now, with the merge still to make.
   *
   * WHY NOW RATHER THAN WHEN IT BINDS, which was the live question and is
   * worth answering rather than asserting:
   *
   *  - Deferring costs more than nothing, and this file has the receipt.
   *    ontology-geometry.ts passed over `real-number-line` and
   *    `ratio-and-rate` three promotions running, each time recording them as
   *    "the area-floor casualties" and choosing a geometry node instead. The
   *    deferral did not keep the decision cheap; it just moved three
   *    promotions' worth of authoring onto the branch that had room, which is
   *    a map decision made by default.
   *  - None of the information gets better by waiting. Which concepts the
   *    routes cross, and how many nodes each area may give up, are both known
   *    now and neither moves. What waiting changes is only that the next three
   *    promotions get made by somebody who believes the map is settled.
   *  - A merge wants a human read, because it reshapes what a learner is shown
   *    as a region. Two merges in one reviewable change cost one read.
   *
   * AND THE HONEST COUNTER-ARGUMENT, since it is a real one: merging before it
   * binds is a change made on a prediction, and if the geometry branch is
   * never authored the map has been reshaped for nothing. The answer is the
   * test for whether any merge is premature — coordinate geometry belongs in
   * geometry on its own merits, independently of the floor, so the map is
   * right either way and the floor only decided WHEN.
   *
   * WHY `COORDINATE_GEOMETRY` AND NOT `TRIGONOMETRY`, which was the other
   * neighbour and the other candidate. Trigonometry rests on this area
   * directly — `right-triangle-trig` needs `similarity` and `pythagoras`,
   * `radians` needs `circle-measure` — and it has thirteen nodes, so it would
   * have cleared the floor just as well. It is the wrong merge anyway: more
   * than half of it is about the circular FUNCTIONS rather than about figures,
   * and an area holding the identities, the inverse functions, polar form and
   * Euler's formula alongside straightedge-and-compass constructions has no
   * boundary anybody could write down. Coordinate geometry is not a
   * neighbouring subject at all — it is this subject done with coordinates,
   * the Euclidean plane with a distance on it, which is why the id
   * `euclidean-geometry` survived the merge and `coordinate-geometry` did not.
   * The id has to be true of the union, and only one of the two was: synthetic
   * geometry is not coordinate geometry, while coordinate geometry is
   * Euclidean. The display name is `Geometry`, because that is what the union
   * is called.
   *
   * WHAT THE MERGE COST. Four `links` entries had to be re-examined, two from
   * each area, and all four survived unchanged — none of them has both ends
   * inside this area, so none collapsed into an ordinary `needs`. The note
   * above the `links` list below says which came from where and why each still
   * has nowhere better to live. Neither area carried a `confusedWith` at all,
   * so there was no interference to strand; the merged area has none, and
   * tests/atlas.mjs asserts that rather than leaving it to be noticed, because
   * a dropped `interferes_with` is the one stranding that keeps every suite
   * green. The only thing that moved is the `promotedBy` stamp on the two
   * entries that came across, from `atlas:coordinate-geometry` to
   * `atlas:euclidean-geometry` — nothing reads it but the assertion that every
   * atlas edge names who promoted it, and it is now true of a different area.
   *
   * WHAT IT GAINED, and this is the half that actually clears the deadlock.
   * Two edges that crossed an area boundary are internal now:
   * `circles-analytic → circles`, and `three-dimensional-coordinates →
   * solid-geometry`. The second is the one that matters. That edge is why
   * `three-dimensional-coordinates` was blocked without its own area ever
   * being near the floor — it was waiting on a node in a region that had run
   * out of room — and both ends are now in the same area with twelve
   * promotions of headroom between them. Neither edge was touched: an edge is
   * owned by the node that DECLARES it, and both are declared by nodes that
   * were already in one of the two areas.
   *
   * THE BUDGET THIS BOUGHT. Seventeen nodes against a floor of five is twelve
   * promotions. The two remaining journeys need seven of them from here —
   * `geometric-proof`, `area-and-perimeter`, `circles`, `circle-measure`,
   * `solid-geometry`, `dot-product-geometry` and
   * `three-dimensional-coordinates` — which leaves five to spare. Seventeen is
   * also not an outlier: `discrete-mathematics` is seventeen too, and
   * `abstract-algebra` and `differential-calculus` are fifteen each, so the
   * merged area is the size of the largest existing one rather than a new kind
   * of thing.
   *
   * THE AREA'S OWN ROOTS WENT FROM THREE TO SIX, which is the merge's visible
   * effect on the area view: `area-and-perimeter`, `geometric-proof` and
   * `isometries-and-symmetry` were already there, and `distance-and-midpoint`,
   * `dot-product-geometry` and `plane-transformations` arrived as roots
   * because every one of their prerequisites is outside the merged area.
   * Asserted by named membership in tests/atlas.mjs, never by count — the
   * promotions below have twice turned that set over without changing its
   * size, which a `length === N` check passes while every claim it makes has
   * gone stale.
   */
  /**
   * SIX NODES LEFT THIS AREA WHEN THEY WERE AUTHORED, AND HAD TO.
   *
   * `points-lines-angles`, `triangle-basics`, `congruence`, `similarity`,
   * `pythagoras` and `quadrilaterals-and-polygons` are real concepts now —
   * eighteen knowledge points between them, with worked examples and
   * thirty-six tasks — in ontology-geometry.ts, under the `plane-geometry`
   * subject.
   * `atlasProblems` rejects a map node whose id collides with an authored
   * concept, and not as tidiness: the composed concept list would then hold two
   * entries for the id, and the shadowing copy has no knowledge points, so a
   * fully authored concept would silently read as unteachable. Leave any of the
   * six here and the material in ontology-geometry.ts becomes unreachable
   * without a single error.
   *
   * FOUR OF THE SIX WERE THE CHEAP KIND OF PROMOTION AND TWO WERE NOT, which
   * makes this area the right place to learn the edge rule from — it shows both
   * halves, and shows each of them more than once. The rule is one sentence: an
   * edge is owned by the node that DECLARES it. So promoting a node strands the
   * edges on its own `needs` and leaves every edge pointing INTO it untouched,
   * because those are declared elsewhere. What varies is where a stranded edge
   * can go, and that is decided by where its OTHER endpoint ended up — which,
   * as the fifth promotion showed, means which FILE it ended up in and not
   * merely whether it was written.
   *
   * The cheap and expensive cases did not arrive in two blocks, and that is
   * the correction the sixth promotion makes to the sentence below. For a while
   * the record read "the first three were cheap and the last two were not",
   * which invited the reading that the area had moved from easy nodes to hard
   * ones. It had not: what made three in a row cheap was that the branch was
   * being authored strictly upward from its root, so each promoted node's
   * `needs` pointed at the node promoted just before it. The sixth is cheap
   * again — one `needs`, pointing at `congruence`, already a concept of the
   * same subject — while being the first promotion here that was NOT directly
   * above the last. So cheapness is a property of where a node's prerequisites
   * live, and nothing else.
   *
   *   `points-lines-angles` stranded NOTHING. It declared no `needs` at all —
   *   the map calls it a root, because the undefined terms rest on nothing
   *   earlier in mathematics — so there was nothing to restate anywhere. The
   *   one edge into it was declared by `triangle-basics`, which was still here
   *   at the time and therefore still owned it.
   *
   *   `triangle-basics` then stranded exactly that one edge, since
   *   `points-lines-angles` was its own `needs`. It did NOT come back here as a
   *   `links` entry, which is the usual rehoming and would have been wrong:
   *   both endpoints are now concepts of `plane-geometry`, so the edge is
   *   internal to that ontology and is declared there, in its `EDGES`. An area
   *   asserting a relation between two concepts it no longer contains would
   *   also be filtered straight back out by `areaOntology`.
   *
   *   `congruence` repeated that case exactly, which is the useful part: the
   *   cheap shape is not a quirk of the first two. Its own `needs` was
   *   `['triangle-basics']`, by then already a concept of `plane-geometry`, so
   *   the stranded edge was internal the moment it was stranded and went to the
   *   same `EDGES` list. Three nodes given up and still no `links` in either
   *   direction, which tests/atlas.mjs asserted by name.
   *
   *   `similarity` ENDED THAT RUN, and it is worth understanding why rather
   *   than just recording it. Nothing about the promotion was different in
   *   kind; the node simply declared TWO `needs` instead of one, and they did
   *   not end up in the same place. `congruence` was already a concept of
   *   `plane-geometry`, so that edge went to `EDGES` like the two before it.
   *   `ratio-and-rate` was then a node of `NUMBER_AND_ARITHMETIC` — it is a
   *   node of `algebra-foundations` now, those two areas having since merged —
   *   and an authored ontology may only name concepts it CONTAINS, so that one
   *   could not go there and came back here as this area's first `links`
   *   entry. The merge did not change that: it is still a map node in an area,
   *   not a concept of `plane-geometry`. See
   *   the comment on `links` below for why it is filed in this area rather than
   *   in the one that holds the other endpoint.
   *
   *   It also stranded a third edge that is not a prerequisite at all: the
   *   node's `confusedWith` pointing at `congruence`, which `expandEdges` turns
   *   into an `interferes_with`. Both endpoints were concepts by then so it
   *   went to `EDGES`, but it is the stranding most worth naming, because its
   *   loss is the only one here that would not have shown up as a missing gate.
   *   Interference constrains SELECTION rather than introduction order, so
   *   dropping it would have silently freed the scheduler to introduce
   *   similarity and congruence together — the single worst pairing in the
   *   subject, and the one the node existed to prevent.
   *
   *   `pythagoras` THEN REPEATED THE EXPENSIVE CASE, which is what settles it
   *   as the pattern rather than as one awkward node. Two `needs` again,
   *   landing in two places again: `similarity` was a concept of
   *   `plane-geometry` by then, so that edge went to `EDGES` like the three
   *   before it, and `roots-and-irrationals` came back here as this area's
   *   SECOND `links` entry.
   *
   *   But the REASON it could not follow is a different one, and the
   *   distinction is the most useful thing this promotion produced.
   *   `ratio-and-rate` could not go into `PLANE_GEOMETRY.edges` because it is
   *   unwritten — a map node, with no ontology to belong to.
   *   `roots-and-irrationals` is fully authored; it is simply authored in
   *   `arithmetic-foundations`. An ontology may only name concepts it CONTAINS,
   *   and belonging to the wrong subject fails that test exactly as being a
   *   skeleton does. So `links` is not "where edges into unwritten nodes go" —
   *   it is where any edge goes whose two endpoints end up in different files,
   *   and an author who learned the narrower rule from `similarity` would have
   *   looked for somewhere better to put this one.
   *
   *   The consequence also differs, and in the direction that matters. The
   *   `ratio-and-rate` link gates nothing, because the gating walk passes
   *   through a node with no material. This one gates immediately:
   *   `roots-and-irrationals` is three knowledge points and six tasks, so
   *   `pythagoras` now sits behind a prerequisite in another subject that a
   *   learner has to actually demonstrate. It is the first `links` entry in
   *   this area that changes what anybody is shown.
   *
   * So the lesson the run of three suggested was too strong, and the fourth
   * promotion is the correction: a promotion is cheap when the departing node's
   * `needs` all point at concepts of the SAME authored subject, and that was a
   * property of a branch being authored strictly upward from its root, one node
   * at a time. The moment a promoted node depends on something outside that
   * line, the expensive case is back. The fifth promotion did it again, so the
   * cheap case should now be read as the exception it always was.
   * `NUMBER_AND_ARITHMETIC` produced one promotion of every expensive kind and
   * was the fuller record of them; that record is now in the block above
   * `ALGEBRA_FOUNDATIONS`'s node list, which is the area that absorbed it.
   *
   * The edges that pointed INTO the departed nodes needed no attention at any
   * point, with two exceptions that prove the rule rather than breaking it.
   * `congruence`, `area-and-perimeter` and `law-of-sines-cosines` each named
   * `triangle-basics` in their own `needs`; `geometric-proof`, `similarity`,
   * `quadrilaterals-and-polygons` and `isometries-and-symmetry` each named
   * `congruence` in theirs; `circles`, `right-triangle-trig`,
   * `distance-and-midpoint` and `diophantine-equations` each name `pythagoras`
   * in theirs; and `area-and-perimeter` names `quadrilaterals-and-polygons` in
   * its own, as the sixth promotion's only into-edge. Every one of those nodes
   * that stayed still owns its edge, and `composeAtlas` resolves it across the
   * file boundary.
   *
   * The first exception is `pythagoras` itself, which named `similarity` in its
   * own `needs` while both were nodes here. That edge was an into-edge for the
   * fourth promotion and needed no attention then — and it became a stranded
   * OWN edge at the fifth, when the node declaring it left. So "an edge
   * pointing into a departed node is safe" is true only until the node at the
   * other end is promoted too. On a branch being authored upward, every
   * into-edge is a future stranded edge.
   *
   * The second is `quadrilaterals-and-polygons`, which names `congruence` and
   * is listed above among the four that did. It stayed for three promotions and
   * then left at the sixth, stranding that edge the same way — which makes the
   * sentence above true of a list that keeps shrinking rather than of a fixed
   * set, and is worth noting because the list reads like a roster of nodes that
   * are safe. It is not. It is a roster of future stranded edges.
   *
   * `areaOntology` keeps only edges internal to the area, so the root of this
   * area viewed alone keeps walking upward as the branch is authored. It was
   * `triangle-basics` after the first promotion, `congruence` after the second,
   * and the third replaced that single root with the FOUR nodes that rested on
   * it — `geometric-proof`, `similarity`, `quadrilaterals-and-polygons` and
   * `isometries-and-symmetry`. A promotion fans the area's roots out like that
   * whenever the node that leaves is the one thing several others stood on, so
   * the count is not a tidy sequence and should not be asserted as one. That is
   * the area view being honest about its own boundary rather than a fault.
   *
   * The fourth promotion then did the quietest version of the same thing: it
   * took `similarity` out of that set of four and put `pythagoras` in, since
   * `pythagoras` was the one node resting on it and both of its `needs` are now
   * outside the area. Four roots before and four after, which is why the
   * assertion in tests/atlas.mjs is written against the DERIVED set rather than
   * against the number — a count would have passed this promotion without
   * noticing that the membership changed completely.
   *
   * THE FIFTH PROMOTION THEN SHRANK THE SET, which no promotion here had done
   * before, and it is the correction to the rule the three before it suggested.
   * `pythagoras` left and nothing took its place: four roots before and THREE
   * after — `geometric-proof`, `quadrilaterals-and-polygons` and
   * `isometries-and-symmetry`. The node resting on `pythagoras` is `circles`,
   * and it did not become a root because its other prerequisite,
   * `geometric-proof`, is still in the area and still gates it from inside. So
   * a departing node promotes its dependents to roots only when it was the LAST
   * of their prerequisites inside the area. The four-way fan-out after
   * `congruence` looked like the rule and was a special case of it, since all
   * four of those nodes rested on `congruence` alone. Worth stating plainly
   * because a reader who learned the pattern from the promotions above would
   * predict `circles` joining the set, and it does not.
   *
   * THE SIXTH PROMOTION SUBSTITUTED, which is the fourth's shape rather than
   * the fifth's, and having both in the record is what makes the rule above
   * readable. `quadrilaterals-and-polygons` left the set of three and
   * `area-and-perimeter` joined it — three roots before and three after, with
   * different membership — because the departing node WAS the last of
   * `area-and-perimeter`'s prerequisites inside the area: its other one is
   * `triangle-basics`, gone since the second promotion. Compare `circles` at
   * the fifth, which did not join because `geometric-proof` was still here to
   * gate it from inside. Same rule, opposite outcome, decided entirely by
   * whether anything else in the area was still holding the dependent back.
   *
   * WHAT DID NOT GO WITH THEM, and the reason the eight still here are still
   * here: they are about figures. `visualRef` exists so a knowledge point can
   * name a diagram, and there are none in this build to name. What was written
   * is the geometry that survives being written down — two angle sums, a
   * subtraction done twice, a translation along a transversal, then the angle
   * sum that follows from that translation, a comparison between two routes,
   * arithmetic on a total, the three parts of congruence that are about a
   * CORRESPONDENCE rather than about a picture, then the three parts of
   * similarity that are the same correspondence with a ratio in it, then the
   * three parts of Pythagoras that are about which slot a length occupies
   * rather than about any triangle you could draw, and now the three parts of
   * the polygons that are two angle totals, a diagonal used to cut rather than
   * to measure, and a disagreement between two words. That is a property of the
   * material rather than of how much time anybody had, and
   * ontology-geometry.ts argues it at length so the next author does not start
   * by rediscovering it.
   *
   * THIS COMMENT USED TO NAME `congruence` AS UNWRITEABLE, AND THAT WAS HALF
   * WRONG — worth leaving on the record, because the mistake is the kind a map
   * invites. The sentence was "why SSS is enough and SSA is not is a claim
   * about two triangles the reader has to be looking at", which is true and is
   * still true, and the error was letting it decide the whole node. A node's
   * `is` line is one sentence and reads as one indivisible topic; the material
   * underneath it is not. Congruence turned out to be mostly notation and
   * arithmetic — what the letter order asserts, why three of six measurements
   * force the rest, AAS collapsing into ASA by the angle sum, and the base
   * angles via matching a triangle with ITSELF, which needs no second triangle
   * to look at. The criteria's proofs and SSA stayed behind, exactly as that
   * sentence said they would have to.
   *
   * So the test to apply to the eight below is not "is this node about figures"
   * but "is EVERY part of it about figures".
   *
   * THAT TEST WAS THEN APPLIED TO `similarity`, WHICH THIS COMMENT NOMINATED,
   * AND IT PASSED — so the paragraph that named it has been replaced by this
   * one rather than left standing as an open suggestion. The prediction was
   * right in detail: the correspondence half is the same notational fact with a
   * ratio in it, so the first knowledge point is the congruence statement with
   * three of its six claims weakened, and the justification of the criteria
   * stayed behind exactly as expected. What the prediction did not see was the
   * best part of the concept, and it is worth recording because it is the
   * second time this test has found MORE than it was looking for. Similarity
   * and congruence disagree about AAA — three angles cannot fix a size, which
   * sinks AAA as a congruence criterion and is precisely why AA suffices here —
   * and that is an argument about two criteria, with no figure anywhere in it.
   * A node's figure-free material is not only the notational part; it is
   * everything that is really a claim about claims.
   *
   * THAT TEST WAS THEN APPLIED TO `pythagoras`, WHICH THIS COMMENT NOMINATED,
   * AND IT PASSED — so the paragraph nominating it has been replaced by this
   * one, the same way the similarity paragraph replaced its own. This is the
   * third nomination in a row to be taken up and the third to hold, and the
   * useful part is that the warning attached to it was WRONG while the
   * prediction underneath it was right.
   *
   * The warning said the test would be harder here: one identity and a
   * converse, proofs that are all dissections or similar-triangle arguments
   * about a figure, and "what is left once those go is arithmetic on three
   * numbers" — possibly the first node where every part is about the figure.
   * The proofs did stay behind, exactly as that said they would. What was wrong
   * was "arithmetic on three numbers", and the error is the same one the
   * congruence paragraph made one promotion earlier: identifying the concept
   * with its theorem. The identity has a shape, and the shape is figure-free.
   * a² + b² = c² is not symmetric in its three letters, nothing in three
   * numbers says which is the hypotenuse, and the assignment decides whether
   * the arithmetic adds or subtracts — the same claim-about-a-claim that made
   * the congruence letter order worth a knowledge point, with the identical
   * failure mode of correct computation on mis-assigned slots. And the converse
   * is a decision procedure that sorts, squares and compares, which is
   * figure-free end to end and answers more than it is asked: the sign of
   * a² + b² − c² separates acute from right from obtuse.
   *
   * So the test has now run five times without once finding a node where every
   * part was about the picture, and that is a warning rather than a boast. A
   * test that has never failed is one an author will find a way to pass. The
   * honest statement is that what stayed behind here is the largest debt in the
   * subject — both proofs, and with them the reason the identity is true —
   * which ontology-geometry.ts names at length rather than approximating.
   *
   * THAT WARNING WAS THEN EARNED, BY THE FIRST NODE THE TEST ONLY HALF TOOK.
   * This comment nominated two candidates and predicted which would win and
   * how it would hurt, and both halves held, so the paragraph making the
   * prediction has been replaced by this account of it rather than left
   * standing.
   *
   * `quadrilaterals-and-polygons` was taken and `geometric-proof` was not, for
   * the reason given: `geometric-proof` is a node about the ARGUMENT being the
   * answer, its natural task kind is `justify`, `justify` is not
   * machine-rulable, and a concept every one of whose chains ends with no
   * ruling is the `chainsWithNoRuling` case types.ts warns about. Writing it
   * would have added three chains that cannot become evidence, which is worse
   * than leaving it mapped, so it is still the obvious next place to try and
   * the question to answer BEFORE writing it is unchanged: what in it can be
   * asked as a value at all.
   *
   * The polygons won on exactly the stated grounds — the two angle totals are
   * arithmetic on a total, which is the shape that has now passed the test five
   * times — and the stated risk landed too. The node SPLIT, which is the first
   * time this test has refused part of a node rather than all or none of it,
   * and the refused part is the part the prediction named: the properties that
   * are proved from congruence by measuring along a diagonal. What went is the
   * diagonal used to CUT the figure, which produces two triangles for
   * congruence to compare and is a correspondence argument with no measurement
   * in it; what stayed is the diagonal used as a length — bisection,
   * perpendicularity, equality — along with the kite, the trapezium and the
   * converses that make the family a hierarchy. ontology-geometry.ts names all
   * of it rather than approximating any of it.
   *
   * So the test's record is five whole nodes and one split, and the split is
   * the useful data point: the warning was that a test which never fails is one
   * an author will find a way to pass, and the answer turned out to be that it
   * fails PARTIALLY. A node is not a unit the test can take or leave.
   *
   * This area also records the case where a node's material SPLIT, and then the
   * case where the split was repaired. The triangle's angle classification was
   * authored and its side classification was not, because
   * equilateral/isosceles/scalene only do work once equal sides are tied to
   * equal angles, and that tie is the base-angle theorem, proved from
   * congruence. That debt was handed forward in this comment to whoever
   * authored `congruence`, and the third knowledge point of that concept is
   * where it was paid.
   */
  nodes: [
    {
      id: 'geometric-proof',
      name: 'Deductive proof',
      is: 'Chaining established facts to an unobvious conclusion — the first place in mathematics where the argument is the answer.',
      needs: ['congruence'],
      terms: 'geometric proof two column deduction axiom',
    },
    /*
     * `pythagoras` was here and is now authored in ontology-geometry.ts, so it
     * had to leave — same rule, fifth time in this area. See the block above
     * the node list.
     *
     * It stranded BOTH of its own `needs` and they went to two different
     * places, which repeats `similarity`'s shape and settles that the expensive
     * case is the pattern rather than the exception:
     *
     *  - `similarity` is a concept of `plane-geometry`, so that edge is
     *    internal to that ontology and is declared in its `EDGES`.
     *  - `roots-and-irrationals` is authored too, but in
     *    `arithmetic-foundations`, and an ontology's edges may only name
     *    concepts it CONTAINS. So it came back here as this area's SECOND
     *    `links` entry. See the note on `links` below — it is the first link
     *    here that gates anything.
     *
     * The edges pointing INTO it were left untouched, as always, because an
     * edge is owned by the node that DECLARES it. `circles` names it in its
     * own `needs` and stayed, so that one survives as written;
     * `distance-and-midpoint` in `coordinate-geometry` names it in both `needs`
     * and `exercises` and stayed too, which makes this the first promotion out
     * of this area to leave a real concept on one end of an `encompasses` edge.
     * `right-triangle-trig` and `diophantine-equations` are the other two
     * dependents and are in the same position. `composeAtlas` resolves all of
     * them across the file boundary.
     */
    /*
     * `quadrilaterals-and-polygons` was here and is now authored in
     * ontology-geometry.ts, so it had to leave — same rule, sixth time in this
     * area. See the block above the node list.
     *
     * IT IS THE CHEAP CASE AGAIN, the first since `congruence` three
     * promotions ago, and the reason is the one the expensive pair established
     * by failing it. The node declared `needs: ['congruence']` and nothing
     * else; `congruence` is a concept of `plane-geometry`, which is where the
     * node has gone, so the one stranded edge is internal to that ontology the
     * moment it is stranded and is declared in its `EDGES`. Nothing crossed a
     * file boundary, so this area's `links` needed no entry and gave none up —
     * it still holds exactly the two that `similarity` and `pythagoras` left.
     *
     * The edge pointing the OTHER way was left untouched, as always:
     * `area-and-perimeter`, immediately below, is this node's only dependent
     * anywhere in the atlas and it names the node in its own `needs`. It stayed
     * here, so it still owns that edge and `composeAtlas` resolves it across
     * the file boundary. What changed is that the edge now BITES —
     * `area-and-perimeter` already had `triangle-basics` gating it from the
     * second promotion, and the other half of its pair was the half the walk
     * was still looking straight through.
     *
     * One thing about this promotion is new and is not about edges: it is the
     * first out of this area that was NOT the node directly above the last.
     * Five times running the cheapest next concept was the one above its
     * predecessor, because the branch was being authored upward one node at a
     * time, and above `pythagoras` there is nothing writable — `circles` also
     * needs `geometric-proof`, and its other dependents are in other areas. So
     * the line ended and the other child of `congruence` was taken instead.
     * ontology-geometry.ts argues it at length; the consequence here is only
     * that a reader should stop predicting the next promotion from the last.
     */
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
    /*
     * ── THE ANALYTIC HALF STARTS HERE ────────────────────────────────────
     *
     * The nine nodes below were `COORDINATE_GEOMETRY` until the merge argued
     * in the block above the node list. They are kept together and in their
     * own order rather than interleaved with the synthetic nodes, because the
     * split is still how the subject is taught even though it is no longer how
     * the map is divided: you do the figures first and then you put axes on
     * them. Interleaving by dependency would have produced a node list in
     * which neither half is readable, and a reader looking for "the
     * coordinate part" would have to reconstruct it.
     *
     * ONE NODE HAD ALREADY LEFT THIS HALF, AND HAD TO.
     *
     * `cartesian-plane` is a real concept with worked examples and tasks, in
     * ontology-vectors.ts. `atlasProblems` rejects a map node whose id
     * collides with an authored concept — not as tidiness, but because the
     * composed concept list would then hold two entries for the id and the
     * shadowing copy has no knowledge points, so a fully authored concept
     * would silently read as unteachable.
     *
     * The `needs` below still name it, and that is the intended way for the
     * map to meet a syllabus: the edge resolves in `composeAtlas`, where both
     * endpoints exist. The same promotion in reverse is what `links` is for,
     * and that promotion moved an entry in BOTH directions — it is the one
     * place in this file where a promotion made the map simpler. The note
     * above `links` at the end of this area carries it, and carries what the
     * merge then did to the two entries it left behind.
     *
     * `cartesian-plane` was promoted AHEAD of `real-number-line`, the node
     * directly beneath it, precisely because of the floor this merge exists to
     * answer — see the note where the node used to sit, a few lines down. That
     * ordering constraint is gone now.
     */
    /*
     * `cartesian-plane` was here and is now authored in ontology-vectors.ts, so
     * it had to leave. See the block above the node list.
     *
     * BOTH of its own edges were stranded and NEITHER could be restated inside
     * the subject it joined, which makes this the opposite case to the
     * promotions out of `number-and-arithmetic` — there, both endpoints were
     * authored alongside and no `links` entry was needed. The node declared
     * `needs: ['real-number-line', 'negative-numbers']` and the two halves fail
     * for different reasons:
     *
     *  - `real-number-line` is still a map node, in `number-and-arithmetic`.
     *  - `negative-numbers` is authored, but in `arithmetic-foundations`, and an
     *    ontology's edges may only name concepts it contains.
     *
     * So both are now `links` entries below. Dropping them instead was the real
     * hazard: the edges into the plane are the only thing connecting the whole
     * vectors-and-matrices chain to the arithmetic underneath it, and losing
     * them would have left that chain a root of the map — the failure this
     * area's existing `links` note already records happening once.
     *
     * Two edges pointing the OTHER way were left untouched, because an edge is
     * owned by the node that DECLARES it: `distance-and-midpoint` and
     * `plane-transformations` both name `cartesian-plane` in their own `needs`,
     * both stayed here, so both survive as written and `composeAtlas` resolves
     * them across the file boundary.
     *
     * This area is down to nine nodes, which is clear of the five-node stub
     * threshold tests/atlas.mjs enforces. That threshold is the reason the plane
     * was promoted ahead of `real-number-line`, which is the node directly
     * beneath it and has both of ITS prerequisites authored already:
     * `number-and-arithmetic` has exactly five nodes left, so promoting out of
     * it trips the check and needs the area merge that file's own note calls
     * for. That is a map question, not an authoring one.
     */
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
  /**
   * FOUR ENTRIES NOW, AND THE MERGE WITH `COORDINATE_GEOMETRY` IS WHY.
   *
   * Two of them are this area's own, from the fourth and fifth promotions, and
   * the long note above them is unchanged. Two came across with the analytic
   * nodes, and the merge's job was to decide whether either had stopped being
   * a `links` entry — because an entry whose two ends end up in the SAME area
   * has become an ordinary `needs` edge, and leaving it here would make
   * `composeAtlas` emit the edge twice, which nothing notices and no test
   * catches.
   *
   * Neither had. Both run INTO `cartesian-plane`, which is an authored concept
   * of the vectors syllabus and is in neither half of this area, so both still
   * have exactly one home.
   *
   * THEY USED TO DIFFER IN WHY, AND NO LONGER DO, WHICH IS WORTH RECORDING
   * BECAUSE THE DISTINCTION WAS THE POINT. At the merge, `real-number-line`
   * was an unwritten map node — of `algebra-foundations`, after the other
   * merge — so it had no ontology to belong to at all, while `negative-numbers`
   * was fully authored and simply authored in `arithmetic-foundations`. That
   * was the same two-reasons-one-home pair the first two entries record, and it
   * was the file's cleanest illustration that `links` is about which FILE an
   * endpoint is in rather than about whether it was written.
   *
   * `real-number-line` has since been authored, into `arithmetic-foundations`,
   * so both entries are now the second case and the pair no longer illustrates
   * anything. Neither moved and neither could: an ontology may only name
   * concepts it CONTAINS, and both of these ends are authored in a subject the
   * other end does not belong to. The first two entries in the list still
   * carry the distinction — `ratio-and-rate` is a map node and
   * `roots-and-irrationals` is authored elsewhere — so it has not been lost,
   * only moved up two lines.
   *
   * They are declared here because the edge was `cartesian-plane`'s own
   * `needs` and `cartesian-plane` was a node of `coordinate-geometry`, which
   * is now part of this area. A `links` entry is filed in the area that owned
   * the DEPARTING node, not in the one holding the other endpoint — filing
   * these under the vectors syllabus would read as linear algebra making a
   * claim about where the plane comes from.
   *
   * What the merge did change is the `promotedBy` stamp `expandEdges` puts on
   * them, which is now `atlas:euclidean-geometry`. Worth saying because the
   * composed graph is where that stamp is read, and "who promoted this edge"
   * is now a different answer for these two than it was.
   */
  /**
   * THE FIRST `links` THIS AREA HAS EVER NEEDED, AND THE FOURTH PROMOTION IS
   * WHY — SO THE "CHEAPEST KIND OF PROMOTION" RUN HAS ENDED AT THREE.
   *
   * The three promotions before this one each stranded either nothing or an
   * edge whose two endpoints were both already concepts of `plane-geometry`, so
   * every one of them went into `PLANE_GEOMETRY.edges` and this area kept
   * asking for no links at all. tests/atlas.mjs asserted that emptiness by
   * name, three departures deep, and it was a real claim rather than a tidiness
   * check — it is what would have caught a link added "for symmetry".
   *
   * `similarity` broke the run because it declared TWO `needs` rather than one,
   * and they do not live in the same place:
   *
   *   `congruence` is a concept of `plane-geometry`, so that edge is internal
   *   to the ontology and went there with the other two, as a prerequisite.
   *
   *   `ratio-and-rate` was then a node of `NUMBER_AND_ARITHMETIC` and is a
   *   node of `algebra-foundations` now, those two areas having merged. Either
   *   way it is a map node rather than a concept of `plane-geometry`, and an
   *   authored ontology may only name concepts it CONTAINS —
   *   `ontologyProblems` reports an unknown endpoint otherwise — so
   *   `PLANE_GEOMETRY.edges` cannot hold this one, and `links` is its only
   *   home.
   *
   * It is declared HERE, in the area that owned it, rather than in the area
   * that holds the other endpoint. The edge was `similarity`'s own `needs` and the
   * node lived in this area, so this is where the dependency was decided and
   * this is where it keeps being asserted. Filing it under the other endpoint's
   * area would read as arithmetic making a claim about geometry.
   *
   * `ratio-and-rate` has no material, so this edge gates nothing today —
   * `gatingPrerequisitesOf` walks straight through an unwritten node. That is
   * exactly why it has to be written down now rather than when the node is
   * authored: an edge that gates nothing is invisible, and the three
   * promotions above all show that an edge nobody can see is an edge that gets
   * dropped. When `ratio-and-rate` is finally promoted out of its own area, the
   * gate appears with no further edit here.
   *
   * THE FIFTH PROMOTION ADDED THE SECOND, AND IT IS THE FIRST LINK HERE THAT
   * DOES ANYTHING. `pythagoras` stranded two `needs` exactly as `similarity`
   * did: `similarity` itself went to `PLANE_GEOMETRY.edges`, and
   * `roots-and-irrationals` had to come here. The reason it had to is NOT the
   * reason above, and the difference is the useful part. `ratio-and-rate` is
   * still a map node, so it has no ontology to live in. `roots-and-irrationals`
   * is a fully authored concept — it simply belongs to `arithmetic-foundations`
   * rather than to `plane-geometry`, and an ontology's edges may only name
   * concepts it CONTAINS. Being authored in the wrong subject fails that test
   * just as being unwritten does, which is worth knowing before the next
   * promotion: `links` is for every edge whose endpoints end up in different
   * files, not only for edges into skeletons.
   *
   * And because that endpoint has material — three knowledge points, six tasks
   * — this link GATES. `gatingPrerequisitesOf('pythagoras')` now names
   * `roots-and-irrationals` as well as `similarity`, so a learner has to
   * demonstrate the surds before the hypotenuse, across a subject boundary.
   * That is the first time a `links` entry in this area has been more than a
   * placeholder, and it is also the answer to anyone wondering whether these
   * entries are bookkeeping: this one changes what a learner is shown.
   *
   * It is declared here for the same reason the first one is — the edge was
   * `pythagoras`'s own `needs` and `pythagoras` lived in this area, so this is
   * where the dependency was decided. Filing it under `arithmetic-foundations`
   * would read as arithmetic making a claim about geometry.
   */
  links: [
    {
      from: 'ratio-and-rate',
      to: 'similarity',
      because:
        'Similarity is where geometry first needs a ratio to be a number you can carry between ' +
        'two figures rather than a comparison made inside one. Its whole content is that three ' +
        'matched pairs of sides share a single quotient, so a learner who cannot yet treat a ' +
        'quotient as one value has nothing for the scale factor to be.',
    },
    {
      from: 'roots-and-irrationals',
      to: 'pythagoras',
      because:
        'A hypotenuse is a square root, and almost never a whole one: the relation yields the ' +
        'square of a side and getting the side back needs a root that is irrational unless the ' +
        'three lengths happen to form a triple. So this is the one place school geometry cannot ' +
        'avoid the irrationals, and a learner who cannot reduce a surd cannot write the answer ' +
        'exactly — only round it, which is a different claim about the triangle.',
    },
    {
      from: 'real-number-line',
      to: 'cartesian-plane',
      because:
        'Each axis IS a real line, so a coordinate means nothing until the line it is measured ' +
        'along is complete — the point halfway up a diagonal has an irrational coordinate.',
    },
    {
      from: 'negative-numbers',
      to: 'cartesian-plane',
      because:
        'Three of the four quadrants need a signed coordinate to be named at all, so the plane ' +
        'is only a quarter of itself until a number may be less than zero.',
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

/*
 * Four, not six. `NUMBER_AND_ARITHMETIC` and `COORDINATE_GEOMETRY` were
 * merged into their neighbours — see the blocks above the node lists of
 * `ALGEBRA_FOUNDATIONS` and `EUCLIDEAN_GEOMETRY`, which argue each one.
 */
export const FOUNDATION_AREAS: MapArea[] = [
  ALGEBRA_FOUNDATIONS,
  FUNCTIONS,
  EUCLIDEAN_GEOMETRY,
  TRIGONOMETRY,
]
