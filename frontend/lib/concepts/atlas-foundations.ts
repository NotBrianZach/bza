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
    'Number and the letters that stand for it: the complex numbers, and then ' +
    'equations, inequalities, systems and quadratics. These were two areas until the number ' +
    'half had been almost entirely written out. The arithmetic underneath — place value, the ' +
    'written algorithms, order of operations, signed numbers, divisibility, fractions, prime ' +
    'factorisation, the gcd and lcm built on those primes, the roots and the irrationals those ' +
    'factorisations decide, and the decimal expansions they decide in the other direction — has ' +
    'problems written for it and lives in the arithmetic-foundations syllabus, as do what a ' +
    'letter standing for a number actually means, solving one equation in one unknown, and the ' +
    'polynomial and rational manipulation ' +
    'built on that; this area points at all of them rather than restating them. The real line ' +
    'has gone the same way as an eleventh, taking what survives being written down about it: ' +
    'that the digits of an irrational root are each settled by whole-number arithmetic, that no ' +
    'two numbers on the line are adjacent because their mean is always between them, and that ' +
    'the least-upper-bound property is assumed rather than proved at this level. What stays ' +
    'behind of it is nothing, because what would have stayed behind is the construction, and ' +
    'the map already files that in real analysis. Ratio and rate have followed it as a ' +
    'twelfth, and what went is the whole node: that a ratio is a claim about a quotient and so ' +
    'needs a second number before it says any amount, that a rate of unlike quantities has two ' +
    'reciprocal ways up which compare in opposite directions, and that scaling multiplies where ' +
    'the additive reading adds. What stays behind of that one is nothing: percent was the ' +
    'remnant and has followed it as a twenty-first, taking the same comparison with its ' +
    'denominator fixed at 100 — that the symbol supplies the hundred so a percent names no ' +
    'amount until a base is handed to it, that a percentage change is one multiplication by a ' +
    'factor so reversing it is a division and not the percentage applied the other way, and ' +
    'that successive changes multiply their factors, which is why equal rises and falls lose ' +
    'instead of cancelling. Scientific notation has followed as a twenty-second out of this ' +
    'area, taking the notation and the arithmetic of it: that a × 10ⁿ with 1 ≤ a < 10 has one ' +
    'writing per quantity, so exponents alone order quantities by size and orders of magnitude ' +
    'become comparable at a glance; that the exponent counts the places the digits shift and ' +
    'not the zeros that happen to be printed; that a product multiplies the digit parts and ' +
    'ADDS the exponents, then may need a factor of ten moved out of the digit part to get back ' +
    'inside the range; and that a sum needs both terms on a common power of ten before the ' +
    'digit parts can be added at all, which is column alignment in the other notation. What ' +
    'stays behind of that one is significant figures and estimation — the departing node\'s ' +
    'search terms named both and the authored material teaches neither, so they are named here ' +
    'and not written, with the complication that the recognition pattern went with the concept ' +
    'and still claims them. Linear equations in one unknown have gone the same way as a thirteenth, ' +
    'taking the whole of what solving one is: undoing the operations in reverse order, ' +
    'collecting the unknown when it stands on both sides, and why the rule is that the same ' +
    'move on both sides must be invertible and not merely the same. What stays behind of it is ' +
    'the answers that are not a single number — the inequality answered by an interval, and the ' +
    'system answered by a point or a line or nothing — which are still named here and not ' +
    'written, because no way to ask for a solution set exists yet. The binomial theorem has ' +
    'gone as a nineteenth, taking the expansion itself: that the coefficients of (a+b)^n are a ' +
    'row of Pascal\'s triangle built by adding adjacent entries, that each term is its own ' +
    'calculation so a single one can be written down without the others, and that putting ' +
    'a=b=1 turns the expansion into the row added up and so into a power of two. What stays ' +
    'behind of that one is nothing, because what would have stayed behind is the counting ' +
    'argument for why an entry counts subsets, and the map files that in discrete mathematics, ' +
    'where it depends on the theorem rather than the other way round. The absolute value has ' +
    'gone as a twentieth, taking what it IS: distance from zero, a definition in two branches ' +
    'selected by the sign of what is inside rather than by a minus sign being visible, and the ' +
    'gap between two numbers that comes out the same whichever way round they are subtracted. ' +
    'What stays behind of that one is the equations — asking which numbers satisfy a condition ' +
    'with the bars in it is a case split producing two answers, and it is named here and not ' +
    'written for the same reason the inequalities are not. Radical equations have gone as a ' +
    'twenty-third, taking the whole of what solving one is: that squaring both sides is not ' +
    'invertible, so the numbers it produces are candidates and the check in the original is ' +
    'part of the method; that a root has to stand alone on its side before squaring removes it, ' +
    'because the square of a difference keeps the root in the middle term; that a discarded ' +
    'candidate is not an intruder but the solution of the same equation with the other side\'s ' +
    'sign flipped, which squaring folds into the one quadratic; and that the index is what ' +
    'forces the check, an even power sending two numbers to one where an odd power sends each ' +
    'to its own. What stays behind of that one is the inequality — asking which numbers satisfy ' +
    'a condition with a root in it is answered by an interval, and it is named here and not ' +
    'written for the same reason the other two are not. The nonlinear systems have gone as a ' +
    'forty-third, taking the whole of what solving one is: that combining the equations cancels ' +
    'nothing once a letter meets its own square, so substitution is the only way in; that what ' +
    'substitution leaves is a QUADRATIC, which is why there are two intersection points and ' +
    'why each root has to be paired with the partner its own line gives it; that the COUNT of ' +
    'solutions is the discriminant of that quadratic, read off before any root is found, and ' +
    'that missing entirely is an ordinary thing for a line to do rather than the contradiction ' +
    'it was in the linear case; and that two conics carrying the same squared terms lose both ' +
    'of them to one subtraction, which leaves the line the intersection points lie on. What ' +
    'stays behind of that one is nothing, because what would have stayed behind is the SHAPES — ' +
    'why one of those equations draws a circle and where a parabola sits — and the map already ' +
    'files those as `circles-analytic` and `conic-sections` in Euclidean geometry, where they ' +
    'depend on the coordinate plane rather than on the solving. So the old line between ' +
    'number and algebra ' +
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
   * into a neighbour. That note is reproduced below, where the eleven departures
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
   * be deleted: `composeAtlas` would otherwise emit that edge twice, and
   * `composeAtlas` itself does not notice.
   *
   * THIS SENTENCE USED TO END "and a duplicate is not something it notices or
   * any test catches", AND THE SECOND HALF IS NO LONGER TRUE. tests/atlas.mjs
   * asserts both `no links entry has both of its ends inside its own area` and
   * `the composed graph holds no edge twice`, either of which fails on the
   * hand-back being missed. Corrected rather than deleted because the claim was
   * load-bearing when written — it is the reason this paragraph exists — and
   * because a comment saying a hazard is unguarded, when it is guarded, costs
   * the next author the work of re-deriving a check that is already there. The
   * nineteenth promotion wrote exactly that duplicate before finding the
   * original.
   * `number-and-arithmetic` arrived with `links` EMPTY — it had handed its
   * last entry back to `arithmetic-foundations` when `gcd-and-lcm` was
   * promoted — and not one of the eleven entries below has both ends inside
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
   * THE BUDGET THIS BOUGHT, AND IT IS NOW FULLY SPENT ON WHAT IT WAS FOR.
   * Fifteen nodes against a floor of five was ten promotions, and the two
   * remaining journeys needed four of them from here: `real-number-line`,
   * `ratio-and-rate`, `linear-equations` and `systems-of-linear-equations`.
   * All four have been taken, and NOTHING is owed on any route — there is no
   * unfinished one left.
   *
   * THE FIGURE IN THIS PARAGRAPH IS THE KIND THAT ROTS, so it is stated as a
   * count that can be checked rather than left as prose. It read "ten nodes,
   * five promotions of room" when the four route nodes had just been taken;
   * `absolute-value`, `percent`, `scientific-notation`, `radical-equations` and
   * `nonlinear-systems` have gone since, none of them for a route, and it is
   * FIVE nodes and NO promotions of room by node count at all. Whoever takes
   * the next one should correct this sentence rather than adding another beside
   * it — a paragraph accumulating revisions of one number is harder to trust
   * than a wrong number, because a reader cannot tell which revision is
   * current.
   *
   * NO ROOM BY NODE COUNT IS NOT THE SAME AS NO ROOM, and the distinction is
   * the whole reason `MapArea.departed` exists — so this paragraph has to state
   * which number it is quoting or it misleads in the opposite direction from
   * the one it used to. Five nodes plus eleven departures is sixteen of
   * territory against a floor of five, and `STUB_FLOOR_TERRITORY` has read
   * sixteen since the merge however the nodes were distributed. What has
   * changed is only that the two readings now DISAGREE here for the first time:
   * node count says spent, territory says eleven clear. tests/atlas.mjs
   * asserts both.
   *
   * WHICH READING IS LIVE IS A DECISION ALREADY MADE AND WORTH NOT
   * RE-LITIGATING. The floor was changed to count departures precisely so an
   * area that drained by succeeding would stop being read as a sketch, and a
   * person was asked and declined both to merge this area and to lower the
   * threshold. So a promotion out of here is not blocked. What it should not do
   * is touch either check: the node-count assertion is what stands between this
   * map and a scatter of one-node areas, and if this area ever genuinely needs
   * to fall below five the answer the block above prescribes is a neighbour to
   * fold into, which is a decision about the learner-facing map.
   *
   * WHAT THE REMAINING NODES COULD BE SPENT ON IS NOT A FREE CHOICE, which is
   * the part a budget framed in nodes hides. Of the five, `complex-numbers` and
   * `linear-inequalities` each carry a live refusal, and `inequality-proofs`,
   * `absolute-value-equations` and `word-problems` are the ones whose answers
   * are sets, intervals and arguments rather than values. So the floor is not
   * what binds here and has not been for some time: the verifier is. Every node
   * left in this area is under one obstacle or the other, which is a sharper
   * statement than the "four candidates" this sentence used to count — the
   * candidate that was neither refused nor set-answered is the one just
   * authored.
   *
   * THAT LIST HAD A FIFTH ENTRY AND IT WAS WRONG, which is the most useful
   * correction this paragraph has had to make. `radical-equations` stood beside
   * `inequality-proofs` as a concept whose answers "are sets, intervals and
   * arguments rather than values", and nothing about it was ever like that: a
   * radical equation has a finite list of candidates, each of them a number,
   * and deciding whether one belongs is a substitution whose outcome is a
   * value. It has been authored with nine `evaluate` tasks and no new task
   * kind. The error was a grouping — four concepts that genuinely cannot be
   * ruled, and one swept in with them because it sits in the same part of a
   * syllabus — and it is the third kind of refusal this file's taxonomy
   * already names, the one that was WRONG WHEN WRITTEN and needed nothing but
   * reading again. The two that remain under a mechanism refusal are still
   * there and should be re-checked rather than trusted; what this correction
   * adds is that a refusal stated over a LIST deserves the same suspicion one
   * at a time, because a list is where a wrong entry hides behind four right
   * ones.
   *
   * THE FOURTH WAS THE ONE THIS PARAGRAPH SAID WOULD NEVER HAPPEN, and the
   * sentence is worth quoting rather than quietly replacing: "the honest
   * reading of it is that this area will probably never spend the rest of that
   * budget on it … It is short of a way to ASK for its answer: a system
   * resolves to a point, a line, or nothing, and no task kind in this build
   * expresses a solution set."
   *
   * The second clause is still true and the prediction built on it was wrong.
   * No task kind expresses a solution SET, and none had to: a point is two
   * values and costs two `evaluate` tasks, and the difference between the
   * other two outcomes is decided by the number the elimination leaves when
   * both letters cancel — 0 for a repeated equation, anything else for a
   * contradiction. Those are values produced by doing the mathematics, not
   * conclusions reported about it. ontology-algebra.ts argues it in full and
   * reproduces the refusal rather than deleting it.
   *
   * SO THE LIMITATION THIS PARAGRAPH CLAIMED WAS THE WRONG ONE. It said a
   * budget measured in nodes cannot see a task-kind block, which is true and
   * was not the problem here. What a budget in nodes cannot see is that a
   * block of that sort may not be real — it is an argument somebody wrote
   * down, and an argument is the one kind of obstacle that can be removed by
   * reading it again. Three of them in this build have been, which
   * ontology-algebra.ts lists. A paragraph recording a block should therefore
   * name the exact question that cannot be asked, not the conclusion that
   * nothing can be.
   *
   * The merge is also no longer a change made on a prediction, which is the
   * honest counter-argument it was recorded with. `real-number-line` is the
   * concept this area could not release before the merge and the first one
   * authored after it, so the thing the merge was for has happened — three
   * times now, rather than only been argued for.
   */
  /**
   * TWENTY-THREE NODES HAVE LEFT THE TWO AREAS THAT MADE THIS ONE, AND HAD TO.
   *
   * Fourteen from the number half — `place-value`, `integer-arithmetic`,
   * `order-of-operations`, `negative-numbers`, `divisibility`,
   * `fraction-arithmetic`, `prime-factorisation`, `gcd-and-lcm`,
   * `roots-and-irrationals`, `decimal-representation`, `real-number-line`,
   * `ratio-and-rate`, `percent` and `scientific-notation` — all now real
   * concepts with worked examples and tasks, in ontology-arithmetic.ts. Seven
   * from the algebraic half: `variables-and-expressions`, `linear-equations`
   * and `systems-of-linear-equations` in ontology-algebra.ts, and
   * `completing-the-square`, `quadratic-formula`, `polynomial-roots` and
   * `binomial-theorem` in ontology.ts.
   *
   * THAT IS TWENTY-ONE, AND THE OTHER TWO WENT SOMEWHERE NEITHER HALF POINTS
   * AT. `absolute-value` is the twentieth and is dealt with in the paragraph
   * immediately below, which is where this list first stopped predicting where
   * a node would land. `radical-equations` is the twenty-third and went further
   * still: to `exponents-and-logarithms`, a subject this area has never fed
   * before and one that was written whole rather than grown out of the map. So
   * the destination column of this roster now holds four ontologies rather than
   * two, and the split by "which half of this area it sat in" has stopped
   * carrying any information about where a promotion goes.
   *
   * AND THE TWENTIETH CROSSES THAT LINE, which is the one thing worth noting
   * about the arithmetic twelve becoming thirteen. `absolute-value` was a node
   * of the ALGEBRAIC half of this area — it is below `absolute-value-equations`
   * and nowhere near place value — and it was authored into
   * `arithmetic-foundations` anyway, because a distance from zero on the number
   * line is arithmetic and because its sole prerequisite, `negative-numbers`,
   * is a concept of that subject. So the twelve-and-seven split above is a
   * record of where nodes came FROM and has stopped predicting where they go.
   * Which subject receives a promoted node is decided by where its own
   * prerequisites live, not by which half of this area it sat in.
   *
   * `atlasProblems` rejects a map node whose id collides with an authored
   * concept — not as tidiness, but because the composed concept list would
   * then hold two entries for the id and the shadowing copy has no knowledge
   * points, so a fully authored concept would silently read as unteachable.
   *
   * The count is kept current deliberately. It is the measurement of how far
   * this area has turned into a syllabus, and a comment saying "five" while
   * eleven have gone is the kind of rot that makes a reader distrust the rest
   * of the file. Twenty-three gone against six remaining is also the figure
   * that forced the merge argued above, read eight promotions later: ten of the
   * first fourteen came out of a single area of fifteen, and what that left was
   * not a region of the map. The eleventh and twelfth are the two that could
   * not have happened without the merge, and they are the pair
   * ontology-geometry.ts spent three promotions calling the area-floor
   * casualties — so the merge is now fully cashed in rather than half.
   *
   * IT WAS ALLOWED TO ROT ANYWAY, two promotions' worth, and the correction is
   * worth more than the number. The headline read TWENTY while twenty-two had
   * gone: `percent` and `scientific-notation` each updated their own departure
   * notes and the `covers` ordinals and left this count alone. So "kept current
   * deliberately" describes an intention and not a practice, and the reason is
   * structural — the count lives in one place and the evidence for it is spread
   * over a `covers` paragraph, a roster and one note per departure, with
   * nothing reading any of them. No assertion can fix that, because the
   * departed nodes are gone from the data and what is left is prose. What the
   * next author can do is check this headline against the highest ordinal in
   * `covers` before adding anything, which is a ten-second test and is how this
   * instance was found.
   *
   * THE NINETEENTH WAS CHOSEN ON A GROUND NONE OF THE OTHER EIGHTEEN WERE, and
   * the shift is the most useful thing this paragraph now records.
   * `binomial-theorem` was not on a route — no node is, because all ten
   * journeys read zero unwritten before it was written — and it was not an
   * area-floor casualty, because this area has five nodes of headroom. It was
   * taken because it RULES LOCALLY: `exactValue` is exact rational arithmetic,
   * so an expansion evaluated at a stated input needs no worker, and the
   * concept stays passable when the tunnel is down.
   *
   * The node that looked next in line, `complex-numbers`, was declined on the
   * same axis and the reason is worth keeping because it is a fact about the
   * TOOLING rather than about the map. `exactValue` has no complex case, so
   * every expression containing the imaginary unit is unsettleable locally —
   * `(3 + 2i)(3 − 2i)` included, whose value is the integer 13. Authoring it
   * would have meant widening the ratchet in tests/concepts-logic.mjs that
   * caps how many shipped `evaluate` tasks may need the worker. So the next
   * promotion out of this area is gated on a change to numerals.ts and not on
   * anything in this file, which is a new kind of entry for this list.
   *
   * THE LAST SENTENCE WAS TRUE OF `complex-numbers` AND WRONG ABOUT THE AREA,
   * and the twentieth promotion is what showed the difference. It said "the
   * next promotion out of this area is gated on a change to numerals.ts", which
   * read a block on one node as a block on the whole area and was never
   * checked against the others — the same error ontology-arithmetic.ts made
   * three promotions earlier by computing readiness before an edit and writing
   * it down as a claim about after it. `absolute-value` went next, and it needed
   * no change to numerals.ts because the change it needed had already been made
   * for `sqrt`.
   *
   * THE TWENTIETH WAS CHOSEN BY DISBELIEVING A COMMENT IN THE RECEIVING FILE,
   * which is the fourth distinct ground in this list and the only one where the
   * refusal was CORRECT when written. ontology-arithmetic.ts declined
   * `absolute-value` in its own header because `exactValue` returned null for a
   * function node, so no task in that subject could contain `abs`. That was a
   * true statement about numerals.ts. It stopped being one when a
   * `case 'function'` branch was added there — for `sqrt`, then `abs`, then
   * `log` — and nothing re-read the sentence that depended on it.
   *
   * So the taxonomy this list keeps is now three deep and the third entry is
   * the dangerous one. A refusal about the MATHEMATICS does not expire
   * (`roots-and-irrationals` on irrational answers). A refusal that was WRONG
   * WHEN WRITTEN can be read again and withdrawn (`linear-equations`,
   * `systems-of-linear-equations`). A refusal naming a MECHANISM — a function
   * that returns null, a form that does not exist — was right and has an expiry
   * date set by work nobody connected to it, and it will not tell you when it
   * passes. `complex-numbers` directly above is the same shape and has NOT
   * expired, which is why the pair is worth keeping side by side: the lesson is
   * to re-check the mechanism, not to distrust the conclusion.
   *
   * WHAT THE ROUTE TABLE RUNNING DRY DID TO THE TIE-BREAK, stated once so the
   * next author does not go looking for a route to serve. Node count, floor
   * distance and route demand were the three heuristics the first eighteen
   * promotions used, and all three are now spent or silent here. What is left
   * is rulability, and it is a better criterion than the others rather than a
   * fallback: a concept that cannot be ruled produces a chain that cannot
   * become evidence, which `questionCoverage.chainsWithNoRuling` counts and
   * the coverage line prints.
   *
   * THE SEVENTEENTH IS THE FIRST SINCE THE MERGE THAT THE MERGE HAD NOTHING TO
   * DO WITH, and that is worth separating out. `linear-equations` was never an
   * area-floor casualty; it was declined IN WRITING by ontology-algebra.ts for
   * want of a task kind that could express a solution set. What unblocked it
   * was reading that refusal against types.ts, which names a shipped
   * solve-for-x task of kind `evaluate` three screens from where the refusal
   * was written. So this departure measures the authoring tooling being
   * understood rather than the map being reshaped.
   *
   * THE EIGHTEENTH IS THE SAME EVENT AGAIN, AGAINST A REFUSAL WRITTEN TO
   * SURVIVE IT. `systems-of-linear-equations` was not merely inheriting the
   * block: three separate files argued it specifically, on the ground that a
   * system resolves to a point, a line, or nothing, and that a solution set is
   * not a value. The answer is that neither question had to be asked — a point
   * costs two `evaluate` tasks and the other two outcomes are told apart by the
   * number the elimination leaves. ontology-algebra.ts has it in full.
   *
   * The distinction worth carrying forward is between a refusal that EXPIRED
   * and one that was WRONG WHEN WRITTEN. `dot-product-geometry`'s expired: the
   * trigonometry it wanted genuinely did not exist yet, and then it did. The
   * last two out of this area were wrong on the day they were written, and the
   * only thing that changed was somebody reading them against what the build
   * already shipped.
   *
   * No tally of the eighteen by cause is offered here, deliberately. The
   * sentence that stood in this spot gave one — "twelve of the seventeen were
   * cheap, two needed a merge, and one needed somebody to disbelieve a
   * comment" — and its three groups overlap, because the two that needed the
   * merge are also two of the twelve cheap ones. It read as a partition and
   * was not one. A number in a comment is only worth keeping if an assertion
   * reads it, and nothing reads that one.
   *
   * The `needs` below still name the departed. That is the intended way for
   * the map to meet a syllabus: the edge resolves in `composeAtlas`, where
   * both endpoints exist. It is dropped by `areaOntology`, which keeps only
   * edges internal to the area — so this area viewed alone has FOUR roots
   * rather than one, being every node whose prerequisites have all been
   * authored out from under it: `complex-numbers`, `linear-inequalities`,
   * `nonlinear-systems` and `word-problems`. That is the area view being
   * honest about its own boundary rather than a fault, and tests/atlas.mjs
   * asserts the set by NAMED membership, because a merge or a promotion can
   * turn a root set over completely without changing its size.
   *
   * The two names this sentence used to give as its endpoints — "from
   * `scientific-notation` at the bottom to `radical-equations` near the top" —
   * have both been promoted, and the pair is a small lesson in what to put in a
   * comment. Naming the extremes of a set made the sentence readable and gave
   * it two independent ways to go stale, and it went stale both ways within
   * three promotions. The members are listed outright now: no shorter to read,
   * and wrong all at once rather than quietly half-wrong.
   *
   * IT HAS NOW DONE EXACTLY THAT, which is the best possible argument for that
   * last sentence and is why this paragraph is worth reading twice. The
   * twelfth promotion took `ratio-and-rate`, which WAS a root here, and put
   * `percent` in its place — both of `percent`'s prerequisites are authored
   * now, so nothing in the area comes before it. Seven before, seven after,
   * one member different. A `length === 7` check would have passed while the
   * claim it was making had changed.
   *
   * THE SEVENTEENTH THEN MOVED THE SIZE AS WELL, three at once, and the two
   * events together are why neither a size check nor a membership check alone
   * would have been enough. `linear-equations` was a root and is gone, and
   * `linear-inequalities`, `systems-of-linear-equations` and `word-problems`
   * all three took its place, because it was the LAST of their prerequisites
   * still inside this area. Seven to nine, one member out and three in. The
   * twelfth promotion was turnover with no size change; this one is both at
   * once — so a suite checking only the size would have missed the first
   * entirely and under-reported the second as "two more roots".
   *
   * THE EIGHTEENTH WENT BACK TO TURNOVER, AND IT TOOK ONE OF THOSE THREE.
   * `systems-of-linear-equations` had been a root for exactly one promotion
   * before being promoted itself, and `nonlinear-systems` replaced it, both of
   * whose prerequisites — that concept and `quadratic-formula` — are now
   * authored. Nine before, nine after, one member different.
   *
   * Three consecutive promotions out of this area have therefore produced
   * shrinkage, a three-wide fan-out, and a one-for-one substitution, in that
   * order. There is no pattern to read off: which outcome you get depends on
   * whether the departing node was the last in-area prerequisite of anything,
   * which is a fact about the dependents and not about the node. So the set has
   * to be COMPUTED on both sides of a promotion rather than predicted — which
   * is also why the assertion names its members and this paragraph does not
   * predict the next one.
   *
   * THE NINETEENTH IS SHRINKAGE AGAIN, NINE TO EIGHT, and it is the cleanest
   * instance of the rule this list keeps restating. `binomial-theorem` was a
   * root here — both of its prerequisites had already been authored out from
   * under it — and nothing replaced it, because it was the last in-area
   * prerequisite of NOTHING. All three of its dependents live in other areas:
   * `power-and-sum-rules` in differential calculus, `counting-principles` in
   * discrete mathematics and `discrete-distributions` in probability. A node
   * can only substitute into this set by being freed inside this area, and a
   * departing node with no in-area dependent therefore always shrinks it.
   *
   * That is the fourth distinct outcome-by-cause in four promotions, and the
   * causes are what to read rather than the sequence: shrinkage because the
   * freed dependent was still gated from inside, fan-out because one node was
   * the last in-area prerequisite of three, substitution because it was the
   * last for exactly one, and shrinkage again because it was the last for none.
   * Computing the set on both sides remains the only way to know which.
   *
   * SEVEN AFTER THE TWENTIETH, AND IT IS THE FIRST CAUSE REPEATING. Eight to
   * seven: `absolute-value` was a root here and has gone, and
   * `absolute-value-equations` — its only dependent, and a node of this area —
   * did NOT take its place, because `linear-inequalities` is its other
   * prerequisite and is still here gating it from inside. So this is the FIRST
   * cause again, the one `real-number-line`'s promotion showed, and not the
   * fourth: the departing node did have an in-area dependent, which is what
   * distinguishes it from `binomial-theorem` above, and that dependent was
   * still gated from inside anyway. Two different reasons produce the same
   * shrinkage, and only the computed set tells them apart from each other or
   * from a substitution.
   *
   * SIX AFTER THE TWENTY-FIRST, AND IT IS THE BINOMIAL'S CAUSE RATHER THAN THE
   * ONE DIRECTLY ABOVE. `percent` was a root here and is a concept of
   * `arithmetic-foundations` now. Seven to six, the other six untouched.
   *
   * Nothing substituted in, and this time the reason is that the node had no
   * in-area dependent AT ALL — its only dependent anywhere is
   * `descriptive-statistics`, which was over in the statistics area and is an
   * authored concept of `data-summaries` now, so the edge that used to be that
   * node's `needs` is a `links` entry on `STATISTICS`. The departure changed
   * nothing about the claim below and is noted because the location in it was
   * about to go stale. So it is the
   * `binomial-theorem` cause, not the `absolute-value` one, and the two are now
   * both on the record twice each: a node with no in-area dependent can only
   * shrink this set, and a node whose in-area dependent is still gated from
   * inside shrinks it too. The identical observable, twice over from four
   * different causes, is the whole argument for computing the set rather than
   * reasoning about it.
   *
   * What distinguishes this departure from the other three is OUTSIDE this
   * area: the gate on `descriptive-statistics` got SHORTER, three entries to
   * two, where every other promotion out of here substituted at constant
   * length. The note beside the departed node says why —
   * `gatingPrerequisitesOf` names one ancestor per BRANCH, this node had two
   * prerequisites and both were gate entries, and authoring it collapsed the
   * fork into a single node. Every earlier measurement OUT OF THIS AREA was
   * taken on a node with one prerequisite, so none of them could have shown it.
   *
   * It is not the first in the build, and the scope of that sentence is the
   * whole of what a draft of it got wrong. `area-and-perimeter`, which also has
   * two `needs`, took `circle-measure` from four gates to three in
   * `plane-geometry` on 2026-11-15 by the identical collapse. Neither
   * ontology-geometry.ts nor this file recorded it, so the narrower rule reads
   * as universal in both — which is why the correction is written here with its
   * scope attached rather than as another unqualified superlative.
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
   * itself and leaves every edge declared elsewhere alone.
   *
   * THIS PARAGRAPH THEN DREW THE WRONG CONCLUSION FROM THAT, and the twelfth
   * promotion is the counterexample, so it is corrected here rather than left
   * to mislead the next author. It said a promotion "needs a `links` entry only
   * when something that STAYED depended on the node that left". It does not,
   * and the rule it just stated is why: if the dependent stayed, the dependent
   * is the DECLARING end, so it still owns the edge and `composeAtlas` resolves
   * it against the authored concept. `percent` and `word-problems` both depend
   * on `ratio-and-rate` and both stayed, and that promotion added no `links`
   * entry at all — tests/atlas.mjs asserts the absence, because a spurious
   * entry would be a duplicate edge waiting to happen.
   *
   * The condition is the one `links` is documented with: an entry is needed
   * when NEITHER end of the edge is a node of this area. All eleven entries
   * below satisfy that, and the two cases a promotion actually produces are a
   * departing node whose own prerequisite lives outside the ontology it is
   * joining — which costs an entry — and the hand-BACK, when the far end of an
   * existing link is promoted into the same ontology as the near end and the
   * entry has to be deleted. The number half produced one of each and finished
   * with `links` empty, which is the whole reason the merge had nothing to
   * reconcile. Every entry under `links` below came from the algebraic half.
   */
  nodes: [
    /*
     * `absolute-value` was here and is now authored in ontology-arithmetic.ts,
     * so it had to leave — same rule, twentieth time across the two areas that
     * made this one. See the block above the node list.
     *
     * ITS ONE `needs` LEFT WITH IT, AND ONE IS THE FLOOR. The node declared
     * `needs: ['negative-numbers']` and nothing else, so that single edge is
     * the whole of what the promotion stranded, and `negative-numbers` is a
     * concept of the subject the node joined — so the edge is restated in that
     * ontology's own `EDGES` and this area needed no `links` change in either
     * direction. The cheap shape for the fifth time in this subject, and the
     * cheapest it can be: a node with no `needs` at all would be a root of the
     * whole map.
     *
     * WHAT MADE THIS ONE POSSIBLE WAS NOT THE MAP. Every departure above was
     * unblocked by something in this file or in the test suite — a merge, a
     * route, a refusal reread against types.ts. This one was declined IN
     * WRITING by ontology-arithmetic.ts, on the ground that `exactValue`
     * returned null for a function node so no task here could contain `abs`.
     * That premise was reversed by a change made for `sqrt` in a different
     * subject, and the sentence resting on it went on reading as a decision.
     * The distinction this list already draws — a refusal that EXPIRED versus
     * one that was WRONG WHEN WRITTEN — gains a third kind with this
     * departure: a refusal that was right, that names a MECHANISM, and whose
     * expiry date is therefore set by somebody else's unrelated work. It will
     * not announce that it has passed. The one beside `complex-numbers` below
     * is the same shape and has NOT expired, so the two sit here as a matched
     * pair rather than as a rule.
     *
     * The edge pointing the OTHER way was left alone and is the only one there
     * is: `absolute-value-equations`, immediately below, names this concept in
     * its own `needs`, that node STAYED here, so it still DECLARES the edge and
     * `composeAtlas` resolves it across the file boundary. It also GATES now
     * where before the walk looked straight through an empty node to the signed
     * numbers — but the gate did not get LONGER, which is the half worth
     * measuring. `absolute-value-equations` was gated by `linear-equations`,
     * `real-number-line` and `negative-numbers`, and is now gated by the first
     * two plus this concept: three entries either way, one member replaced,
     * because `gatingPrerequisitesOf` names nearest teachable ancestors rather
     * than accumulating them. The chain beneath the gate is a step deeper and
     * the gate itself is the same length.
     *
     * The node carried no `confusedWith` and no `exercises`, both checked
     * before it was deleted rather than inferred from the suites staying green,
     * since staying green is exactly what they would have done either way. What
     * the promotion ADDED on that axis is an `encompasses` edge in the
     * receiving subject — every one of the four tasks computes a signed
     * subtraction inside the bars — which is the first credit edge in that file
     * to pass its own measurement rather than be declined by it.
     */
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
     * ONE OF THE THREE, now that `percent` has gone the same way as a
     * twenty-first, and the prediction in the sentence above has therefore been
     * borne out on two of the three edges it was written about. Only
     * `scientific-notation` is still a node here declaring an into-edge at this
     * concept. The count in a sentence like that is worth correcting each time
     * rather than left to rot, because the roster reads as a list of edges
     * somebody has checked and it is a list of edges waiting to move.
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
    /*
     * `ratio-and-rate` was here and is now authored in ontology-arithmetic.ts,
     * so it had to leave — same rule, sixteenth time across the two areas that
     * made this one. See the block above the node list.
     *
     * Its OWN `needs: ['fraction-arithmetic']` left with it and is restated as
     * an edge inside that subject, where both endpoints now live. So this is
     * the cheap case for the fourth time here and it needed no `links` change
     * at all — which the note beside `real-number-line`'s departure predicted
     * would NOT happen, and that prediction is corrected where it was made,
     * in ontology-arithmetic.ts's `EDGES`.
     *
     * The reason it was wrong is the edge rule read backwards, and it is worth
     * having once beside the nodes it concerns. `percent` and `word-problems`
     * both name this concept in their own `needs` and both STAYED in this area,
     * so each still DECLARES its edge and therefore still owns it;
     * `composeAtlas` resolves both against the authored concept. A dependent
     * staying is what keeps an edge local. What costs a `links` entry is an
     * edge neither of whose ends is a node here, which is true of all eight
     * entries below and of none of these.
     *
     * TWO CONSEQUENCES THIS AREA SHOULD BE READ FOR, since neither is visible
     * from the node list:
     *
     * `percent` has become a ROOT of this area's own view. Both of its
     * prerequisites — this concept and `decimal-representation` — are authored
     * now, so `areaOntology` keeps neither edge and nothing inside the area
     * comes before it. The root set therefore stayed at seven while one member
     * was replaced, which is exactly the turnover the block above the node list
     * warns a `length` check would sail through. tests/atlas.mjs asserts it by
     * name.
     *
     * IT WAS A ROOT FOR NINE PROMOTIONS AND HAS NOW BEEN PROMOTED ITSELF, so
     * that paragraph is a record and not a description. Becoming a root of an
     * area's own view is what readiness LOOKS like here — every prerequisite
     * authored out from under the node — so a node arriving in this set is a
     * node that has just become promotable, and the set is the queue. This one
     * left the set the way `systems-of-linear-equations` did, by being taken.
     *
     * The derived claim above it needs no correction and that is worth one
     * line: the two edges this concept's promotion left pointing at it from
     * inside the area are down to one, since `percent` declared its own and
     * took it along, while `word-problems` is still a node here and still owns
     * the other. A dependent staying is what keeps an edge local, which is the
     * rule the paragraph above states, and it has now been tested in both
     * directions on the same pair.
     *
     * And the `links` entry in `EUCLIDEAN_GEOMETRY` from this concept to
     * `similarity` has started GATING. It was the one entry in that list which
     * gated nothing, because the walk passed straight through a node with no
     * material; `similarity` is now gated by `congruence` and this concept
     * rather than by `congruence` and `fraction-arithmetic`. Same count, one
     * member different — so the assertion that used to record the contrast
     * between that entry and `roots-and-irrationals->pythagoras` had to be
     * rewritten rather than deleted, and tests/atlas.mjs says why.
     */
    /*
     * `percent` was here and is now authored in ontology-arithmetic.ts, so it
     * had to leave — same rule, twenty-first time across the two areas that
     * made this one. See the block above the node list.
     *
     * BOTH of its own edges left with it and BOTH are restated inside that
     * subject. The node declared
     * `needs: ['ratio-and-rate', 'decimal-representation']` and both of those
     * are concepts of the subject it has joined, so every stranded edge has an
     * owner there, none crosses a subject boundary, and this area needed no
     * `links` change in either direction. The cheap shape for the sixth time in
     * this subject.
     *
     * IT IS ALSO THE LAST CHEAP MULTI-EDGE CASE THIS AREA CAN PRODUCE, which is
     * a measurement and not a guess. Six nodes are left here with every
     * prerequisite written, and they fall into exactly two groups:
     *
     *  - `scientific-notation` and `complex-numbers` name ONE concept each
     *    (`decimal-representation`, `quadratic-formula`). A single-prerequisite
     *    node is cheap trivially — one subject is all one edge can reach — which
     *    is the floor `absolute-value` hit and not an instance of this shape.
     *  - `word-problems`, `linear-inequalities`, `radical-equations` and
     *    `nonlinear-systems` name two each, and every one of the four is SPLIT
     *    across two subjects. So each of them costs a `links` entry when it
     *    goes.
     *
     * `percent` was the only node here naming two concepts of one subject, so
     * no later departure can be cheap and multi-edged at once. tests/atlas.mjs
     * had the same fact in a different form — this node was its only available
     * example of a map node resting on two authored arithmetic concepts — and
     * that assertion retires with the node rather than moving on to a
     * successor.
     *
     * THE PREDICTION HELD ON THE FIRST OF THE FOUR TO GO. `radical-equations`
     * was promoted two departures later and cost exactly the one `links` entry
     * this paragraph said it would, `quadratic-formula → radical-equations`,
     * with `rational-exponents → radical-equations` going to the receiving
     * ontology. Three of the four are still here and the grouping still holds
     * of them, so the bullet is left as written rather than narrowed to the
     * survivors: a prediction that came true is worth more standing beside its
     * instance than edited down to the cases that have not been tested yet.
     *
     * The node carried no `confusedWith` and no `exercises`, both checked on it
     * before it was deleted rather than inferred from the suites staying green,
     * since staying green is exactly what they would have done either way. What
     * the promotion ADDED on the `confusedWith` axis is a decision and not an
     * edge: ontology-arithmetic.ts had asked, beside `ratio-and-rate`, whether
     * the two interfere, and could not answer from that end because an ontology
     * may only name concepts it contains. The answer is written there now and
     * it is no — the pair is in a prerequisite relation, so the sessions an
     * interference would forbid are the sensible ones, and the misconception
     * the map node's `is` line named is handled in two subgoals instead.
     *
     * THE ONE CONSEQUENCE A READER WOULD NOT PREDICT is that a gate got
     * SHORTER, which no promotion out of THIS area had done before. Its only
     * dependent is `descriptive-statistics` — a node of the statistics area
     * when this was written and an authored concept of `data-summaries` since
     * — which needs this concept and `sigma-notation`. The measurement below
     * is unaffected: both of those are still its gate, which is why the edges
     * became `links` entries that really gate rather than inert ones. While
     * this node was a skeleton
     * the gating walk passed through it and came out at BOTH of its
     * prerequisites, so that node was gated by `ratio-and-rate`,
     * `decimal-representation` and `sigma-notation`. It is gated by `percent`
     * and `sigma-notation` now: three to two. `gatingPrerequisitesOf` names
     * nearest teachable ancestors, which is one entry per BRANCH, and this
     * promotion put a single teachable node in front of a branch that had
     * forked. Every earlier measurement in this file concluded that a gate
     * substitutes at constant length, and every earlier measurement was taken
     * on a node with exactly one prerequisite.
     */
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
     * because its other prerequisite `linear-equations` was still here and
     * still gated it from inside. A departing node promotes its dependents to
     * roots only when it was the LAST of their prerequisites inside the area.
     * Asserted by named membership in tests/atlas.mjs, where this promotion
     * added the assertion: the block above the node list had been claiming that
     * set was checked by name and nothing was checking it, so a promotion could
     * have turned it over in silence.
     *
     * THE OTHER HALF OF THAT RULE HAS SINCE FIRED, which is why the tense above
     * is past. `linear-equations` was authored in its turn, and it WAS the last
     * in-area prerequisite of `linear-inequalities` — so that node did become a
     * root, along with `systems-of-linear-equations` and `word-problems`. The
     * rule is unchanged and so is this note's reading of it; what changed is
     * which side of the condition the area is on. Both behaviours have now been
     * observed out of this one area, which is the strongest case available for
     * checking the set by name rather than by size.
     */
    /**
     * `scientific-notation` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
     *
     * It is a real concept now — three knowledge points, worked examples and
     * tasks — in ontology-arithmetic.ts, under `arithmetic-foundations`.
     * `atlasProblems` rejects a map node whose id collides with an authored
     * concept, and not as tidiness: the composed concept list would hold two
     * entries for the id, and the shadowing copy has no knowledge points, so a
     * fully authored concept would silently read as unteachable.
     *
     * ITS ONE EDGE LEFT WITH IT AND IS RESTATED INSIDE THAT SUBJECT. The node
     * declared `needs: ['decimal-representation']` and nothing else, and that
     * concept is authored in the subject this node has joined, so the single
     * stranded edge has an owner there and nothing crossed a subject boundary.
     * This area needed no `links` change in either direction.
     *
     * THAT WAS CHEAP BY ARITY RATHER THAN BY LUCK, which is the distinction the
     * note on `percent` above predicted and is worth preserving. The six cheap
     * multi-edge departures from this area were cheap because a node's several
     * prerequisites all happened to land in one subject — a fact about the map
     * that could have gone the other way, and did for the four nodes still
     * here. A one-prerequisite node cannot cost a `links` entry at all: one
     * edge reaches one subject, and either it is the receiving one or it is
     * not. `complex-numbers` below is the only node left here of that shape.
     *
     * NOTHING POINTED INTO IT, MEASURED RATHER THAN ASSUMED. `dependentsOf`
     * returns empty for this id across the composed map, so no surviving node
     * named it in its own `needs` and no `links` entry mentioned it. This is
     * therefore the one departure out of this area that neither stranded an
     * edge pointing in nor tightened a gate anywhere — the "authoring tightens
     * the gate" effect the `real-number-line` note above describes has no
     * instance here, because there was nothing above this node to tighten.
     *
     * The node carried no `confusedWith`, no `exercises` and no `encompasses`,
     * all three checked on it before it was deleted rather than inferred from
     * the suites staying green. Staying green is exactly what they would have
     * done either way: `expandEdges` turns a node's `confusedWith` into an
     * `interferes_with` edge, deleting the node deletes the edge, and nothing
     * goes red because interference constrains SELECTION rather than gating.
     *
     * THE ROOT SET OF THIS AREA SHRANK, from six to five, which is the
     * `real-number-line` shape rather than the `linear-equations` one. This
     * node's only prerequisite was outside the area, so it was a root itself;
     * and it had no dependents at all, so no node took its place. A departing
     * node promotes a dependent to root only when it was the LAST of that
     * dependent's prerequisites inside the area, and with no dependents the
     * condition cannot fire. Measured before and after rather than predicted:
     * {`scientific-notation`, `linear-inequalities`, `word-problems`,
     * `complex-numbers`, `radical-equations`, `nonlinear-systems`} became that
     * set without the first member, with `absolute-value-equations` and
     * `inequality-proofs` still gated from inside as before. Asserted by named
     * membership in tests/atlas.mjs, which is what catches a turnover at
     * constant size.
     *
     * SEVEN NODES LEFT HERE, AND THE FLOOR IS FIVE. tests/atlas.mjs asserts no
     * area has fewer than five nodes ("no area is a stub"), so this area can
     * release two more and then stops. Of the seven, `complex-numbers` is
     * refused on a live mechanism — `exactValue` has no complex case, so every
     * expression containing the imaginary unit is unsettleable locally and
     * authoring it would mean widening the ratchet in tests/concepts-logic.mjs
     * that caps how many shipped `evaluate` tasks may need the worker — and
     * `linear-inequalities` carries a refusal of its own. The next author
     * should re-read both mechanisms rather than trusting either sentence; that
     * is the third entry in the taxonomy above, and it is the dangerous one.
     *
     * ONE OF THOSE TWO WAS TAKEN: `radical-equations`, as the twenty-third
     * departure, leaving SIX and one promotion of room. The figure is kept in
     * the budget paragraph above the node list rather than restated here, since
     * a count maintained in two places is a count maintained in neither — which
     * is exactly how the departure total above was allowed to rot by two. This
     * paragraph is left as the record of where the budget stood when
     * `scientific-notation` went, with the one sentence of arithmetic it needs
     * to stay readable.
     *
     * WHAT IT LEAVES BEHIND, and this one is a debt rather than a boundary. The
     * node's `match` and `terms` named significant figures and estimation
     * alongside the notation, and the authored concept carries that pattern
     * VERBATIM — the convention the last five promotions followed, since
     * widening or narrowing a pattern in the same change that adds a concept
     * would move the recognition figure in tests/atlas.mjs on an edit that also
     * moves the concept count, leaving no way to say which half did it. But the
     * material teaches the notation and its arithmetic only: how a and n are
     * fixed, that a product adds exponents and may need renormalising, and that
     * a sum needs a common power of ten first. Rounding to a stated number of
     * significant figures, and estimation as a technique, are named by the
     * pattern and taught nowhere. So an offering titled "Significant figures"
     * resolves to this concept and will be met with material about the
     * notation. That is the honest reading and it is the one thing about this
     * promotion a reader should not have to discover: the fix is a narrowed
     * pattern or a second concept, in a change that moves the recognition
     * figure and nothing else.
     */
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
     * Edges pointing the OTHER way survive untouched. The two `links` that
     * already pointed at it — to `polynomial-arithmetic` here and to
     * `function-concept` in the functions area — did not need changing, because
     * `links` never cared which side was authored. Both resolve in
     * `composeAtlas`, where map nodes and authored concepts both exist. That is
     * the intended way for the map to meet a syllabus.
     *
     * IT WAS THREE EDGES AND IS TWO, and the one that went is the sentence this
     * paragraph is worth reading for. The third was `linear-equations`, which
     * named this concept in its own `needs` from inside this area — so it
     * survived as written, exactly as this note said. That node is authored now
     * too, in the SAME subject, so the edge did not merely survive: it stopped
     * crossing a boundary at all and is an ordinary prerequisite inside
     * `EXPRESSIONS_AND_EQUATIONS.edges`. A list of surviving into-edges is a
     * list of future stranded edges, which is the lesson this file reaches by
     * four separate routes and the reason the sentence is corrected rather than
     * deleted.
     *
     * `areaOntology` keeps only edges internal to the area, so this area viewed
     * alone showed `linear-equations` as a root while that node was still here.
     * That was the area view being honest about its own boundary rather than a
     * fault, and the same promotion took the node out of the set — see the
     * departure note below, where one root is replaced by three.
     *
     * It said "as THE root" while this was the algebra area alone, and the
     * merge with `number-and-arithmetic` made it one of eight. The claim about
     * that node was never wrong, only ever outnumbered; what has changed since
     * is that it is not a node of this area to be a root of.
     */
    /**
     * `linear-equations` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
     *
     * It is a real concept now — three knowledge points, worked examples with
     * a hand-written question on every subgoal, and six tasks — in
     * ontology-algebra.ts, joining `variables-and-expressions` in the
     * `expressions-and-equations` subject that was NAMED for the pair.
     * `atlasProblems` rejects a map node whose id collides with an authored
     * concept, and not as tidiness: the composed concept list would then hold
     * two entries for the id, and the shadowing copy has no knowledge points,
     * so a fully authored concept would silently read as unteachable.
     *
     * ITS OWN `needs` LEFT WITH IT, AND THIS IS THE CHEAPEST SHAPE THAT TRAP
     * HAS. The node declared `needs: ['variables-and-expressions']` — one
     * edge, pointing at a concept authored in the very subject this node has
     * joined. So the stranded edge is restated in that ontology's own `EDGES`,
     * it crosses no subject boundary, and this area's `links` needed no entry
     * in either direction. Compare the node immediately above, whose own two
     * `needs` pointed into `arithmetic-foundations` and are in `links` below to
     * this day: same area, same promotion mechanics, opposite cost, and the
     * difference is only which subject the far end happens to be in.
     *
     * NOTHING ELSE CAME OFF IT, which is worth saying because two of the three
     * things that CAN be stranded were present here and neither was the node's
     * to own:
     *
     *  - Three nodes still on the map name this concept in their own `needs` —
     *    `linear-inequalities`, `systems-of-linear-equations` and
     *    `word-problems`, all three immediately below. All three STAYED, so
     *    each is the DECLARING end and still owns its edge, and `composeAtlas`
     *    resolves all three against the authored concept. A `links` entry for
     *    any of them would be a duplicate edge waiting to happen — the wrong
     *    rule this file records two removals above predicts exactly that.
     *
     *    TWO of them still are. `systems-of-linear-equations` has since been
     *    promoted into the same subject, so its edge did not merely survive —
     *    it stopped crossing the authored/mapped boundary at all and is an
     *    ordinary prerequisite inside `EXPRESSIONS_AND_EQUATIONS.edges`. Same
     *    correction as the one beside `variables-and-expressions` above, for
     *    the same reason, one promotion later: a list of surviving into-edges
     *    is a list of future stranded edges, and this file has now reached that
     *    sentence by five separate routes.
     *  - The `confusedWith` is declared by `linear-inequalities`, not here.
     *    `expandEdges` turns a node's `confusedWith` into an `interferes_with`,
     *    so deleting a node that DECLARED one deletes the edge in silence —
     *    interference constrains selection rather than gating, so every suite
     *    stays green while the scheduler is freed to introduce the two most
     *    confusable concepts in the subject together. That is the hazard, and
     *    it does not apply here: the declaring node stayed. The edge survives
     *    untouched and it is now an interference between an authored concept
     *    and a map node, which is a thing `composeAtlas` resolves and nothing
     *    else had to change for.
     *
     * tests/atlas.mjs had an assertion asserting that interference and BOTH of
     * its ends being nodes of this area. The second half is what this promotion
     * falsified — an authored concept is not a node of any area — so the
     * assertion was split rather than relaxed: the edge still exists and still
     * carries its reason, and the end that left is checked by its subject
     * instead. A claim about an end being "in the area" is exactly the sentence
     * that rots when the end is promoted.
     *
     * THE ROOT SET OF THIS AREA FANNED OUT, from seven to nine, and this is the
     * widest turnover any promotion out of here has produced. This node WAS a
     * root — `variables-and-expressions` had been authored out from under it —
     * and all three of the dependents listed above take its place at once,
     * because this concept was the LAST of their prerequisites still inside the
     * area: `real-number-line` and `ratio-and-rate` had already gone to
     * `arithmetic-foundations`. One out, three in. The note beside
     * `real-number-line`'s departure says a departing node promotes its
     * dependents only when it was the last of their in-area prerequisites, and
     * this is that condition holding three times over — where that promotion
     * was the case of it failing once. Asserted by named membership in
     * tests/atlas.mjs, which is the only way a one-for-three substitution is
     * visible at all.
     *
     * AND IT TIGHTENED THE GATE ON THOSE SAME THREE NODES. While this concept
     * was mapped-only it made no claim about mastery, so `gatingPrerequisitesOf`
     * looked straight through it and reported `variables-and-expressions`
     * instead. It gates in its own right now, so all three dependents are one
     * demonstration further from a cold account without anybody editing them —
     * authoring tightening the gate rather than widening it, for the second
     * time in this subject and the first time to three nodes at once.
     *
     * One of the three has since been authored in turn and no longer appears in
     * that gate: `gatingPrerequisitesOf` names NEAREST authored ancestors, so
     * `nonlinear-systems` and `gaussian-elimination` are gated by
     * `systems-of-linear-equations` now and not by this concept, which sits
     * behind it. The chain down is unbroken and one link longer. That is why
     * tests/atlas.mjs states this claim as a two-step walk rather than as an
     * immediate gate — the immediate form goes red every time something is
     * authored in between, which is a promotion succeeding rather than a
     * regression.
     */
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
    /**
     * `systems-of-linear-equations` LEFT THIS AREA WHEN IT WAS AUTHORED, AND
     * HAD TO.
     *
     * It is a real concept now — three knowledge points, worked examples with a
     * hand-written question on every subgoal, and seven tasks — in
     * ontology-algebra.ts, joining `variables-and-expressions` and
     * `linear-equations` in `expressions-and-equations`. `atlasProblems`
     * rejects a map node whose id collides with an authored concept, and not as
     * tidiness: the composed concept list would then hold two entries for the
     * id, and the shadowing copy has no knowledge points, so a fully authored
     * concept would silently read as unteachable.
     *
     * ITS OWN `needs` LEFT WITH IT, AND THIS IS THE CHEAPEST SHAPE AGAIN —
     * TWICE IN A ROW OUT OF THE SAME SUBJECT. The node declared
     * `needs: ['linear-equations']`, one edge pointing at the concept promoted
     * out of this area immediately before it and into the very subject this
     * node is joining. So the stranded edge is restated in that ontology's own
     * `EDGES`, it crosses no subject boundary, and this area's `links` needed
     * no entry in either direction.
     *
     * The note beside `real-number-line` says the cheap shape is a property of
     * a branch authored from the BOTTOM UP rather than of any area, and that
     * nothing left here had it. The second half was wrong, and the first half
     * is why: these three concepts were authored in dependency order into one
     * file, which is exactly the condition that note identified. What it had
     * actually observed was that the cheap shape fails when a node that STAYS
     * depends on the one leaving — and nothing that stayed here depends on this
     * one except `nonlinear-systems`, which is the declaring end and therefore
     * keeps its own edge.
     *
     * NOTHING ELSE CAME OFF IT, and both of the things that could have were
     * checked rather than assumed:
     *
     *  - Two nodes still on the map name this concept in their own `needs` —
     *    `nonlinear-systems` below, and `gaussian-elimination` in
     *    atlas-structures.ts, which also claims it under `exercises`. Both
     *    STAYED, so each is the DECLARING end and still owns what it declared,
     *    and `composeAtlas` resolves both against the authored concept. A
     *    `links` entry for either would be a duplicate edge waiting to happen.
     *
     *    ONE OF THE TWO HAS SINCE BEEN AUTHORED, AND BOTH OF ITS EDGES MOVED.
     *    `gaussian-elimination` is a concept of `expressions-and-equations`
     *    now, so it is no longer a declaring end and the paragraph above is a
     *    record rather than the state. The `needs` edge became an ordinary
     *    prerequisite in that ontology — same subject, so no `links` entry —
     *    and so did the `exercises`, as an `encompasses`. Worth reading
     *    together with the sentence above about duplicates: a `links` entry
     *    added here then would have been harmless and silent then, and would be
     *    a duplicate edge NOW, because the far end moved into the same subject.
     *    That is the hazard cartesian-plane found and the reason an edge has to
     *    be looked up in the file its far end lives in rather than reasoned
     *    about from this one.
     *  - It declared NO `confusedWith`, so nothing was deleted in silence.
     *    That is the stranding no suite catches: `expandEdges` turns a node's
     *    `confusedWith` into an `interferes_with`, interference constrains
     *    selection rather than gating, so losing one leaves every test green
     *    while freeing the scheduler to introduce the two most confusable
     *    concepts in the subject together. An absence has to be looked for to
     *    be known, and this is the record that it was.
     *
     * THE ROOT SET OF THIS AREA TURNED OVER WITHOUT CHANGING SIZE, which is the
     * second time that has happened here and the case the named-membership
     * assertion exists for. This node WAS a root — `linear-equations` had been
     * authored out from under it — and `nonlinear-systems` takes its place,
     * because this concept was the LAST of its two prerequisites inside the
     * area and the other, `quadratic-formula`, is authored in ontology.ts.
     * Nine before, nine after, one member different. A `length === 9` check
     * would have passed on both sides of a change that replaced one of its nine
     * claims — exactly as it would have on the `ratio-and-rate` promotion, and
     * unlike the `linear-equations` promotion, which moved the size as well.
     *
     * AND IT TIGHTENED THE GATE ON TWO NODES IN TWO DIFFERENT AREAS. While this
     * concept was mapped-only it made no claim about mastery, so
     * `gatingPrerequisitesOf` looked straight through it and named
     * `linear-equations` instead. It gates in its own right now, so
     * `nonlinear-systems` here and `gaussian-elimination` in `linear-algebra`
     * are each one demonstration further from a cold account with no edit to
     * either. The cross-area half is the part worth noting: a promotion out of
     * this file changed what gates a node in atlas-structures.ts, and nothing
     * in either file's text says so.
     *
     * WHAT THIS AREA NOW OWES ON EITHER UNFINISHED JOURNEY IS NOTHING, and the
     * budget paragraph above the node list is where that is counted. The row
     * this node occupied in tests/atlas.mjs's `ROUTE_STILL_UNWRITTEN` was the
     * last one it had.
     */
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
    /*
     * `radical-equations` was here and is now authored in
     * ontology-exponentials.ts, so it had to leave — same rule, twenty-third
     * time across the two areas that made this one. See the block above the
     * node list.
     *
     * ITS TWO `needs` WENT TO TWO DIFFERENT HOMES, which is the second time
     * that has happened here and the first time the SUBJECT was the decision.
     * The node declared `needs: ['quadratic-formula', 'rational-exponents']`,
     * and those two are concepts of two different subjects, so wherever it
     * went one edge became an ordinary prerequisite and the other became a
     * `links` entry below. `binomial-theorem` had the same split at the
     * nineteenth promotion and made the choice on a credit edge: filing it with
     * the exponent rules would have left its `encompasses` expressible nowhere,
     * because `links` carries `from`, `to` and `because` and no edge KIND.
     *
     * There was no such tie-breaker here, and the one that decided it is worth
     * stating because it will recur. `rational-exponents` says what a radical
     * IS; `quadratic-formula` is a tool the method HAPPENS to need, and the
     * squared equation would be a cubic or a linear one in other examples
     * without changing a word of what the concept teaches. A promoted node
     * belongs with the prerequisite that supplies its meaning rather than its
     * arithmetic. ontology-exponentials.ts argues it beside the concept and
     * declines the credit edge there on a measurement, so the nineteenth
     * promotion's deciding factor is absent in both directions rather than
     * merely unmentioned.
     *
     * THE NODE'S `match` DID NOT COME ACROSS, AND THAT IS THE ONE DEPARTURE
     * FROM THE CONVENTION IN THIS FILE. The last five promotions carried a
     * node's pattern over verbatim, so the recognition figure in
     * tests/atlas.mjs could not move on a change that also moved the concept
     * count. This node's pattern was `/\bradical equation\b/i`, and
     * `conceptsInOffering` tests a pattern against the offering's TITLE and
     * nothing else: no encyclopaedia article is called "radical equation", so
     * the pattern could never have fired, and this node was counted among the
     * concepts that "can be recognised from a title" for its whole life while
     * recognising none. The authored concept is `guided` and carries a caveat
     * saying so, and 267 of 294 becomes 266 of 294 — a figure that is more
     * nearly true after the change than before it. Widening to `radical`
     * instead would have taken its own prerequisite's articles, which is the
     * argument ontology-exponentials.ts makes in full.
     *
     * The node carried no `confusedWith`, no `exercises` and no `encompasses`,
     * all three checked on it before it was deleted rather than inferred from
     * the suites staying green — which is exactly what they would have done
     * either way, since `expandEdges` turns a `confusedWith` into an
     * `interferes_with` edge and interference constrains SELECTION rather than
     * gating. What the promotion ADDED on that axis is a new interference and
     * not a rehomed one: solving an exponential equation and solving a radical
     * one are the same instruction with two different inverses, one of which is
     * one-to-one. It is argued where it is declared.
     *
     * The edge pointing the OTHER way was left alone, and it is in a file
     * neither this one nor the receiving ontology touched.
     * `trig-substitution-setup` in `TRIGONOMETRY` names this concept in its own
     * `needs`, that node stayed, so it still DECLARES the edge and
     * `composeAtlas` resolves it across the boundary. Its GATE moved anyway —
     * the walk used to look straight through an empty node and come out at both
     * of its prerequisites, and it stops here now — so a promotion out of this
     * file changed what gates a node further down the same file with no edit to
     * it.
     *
     * AND IT GOT SHORTER, which is the second instance in this file of
     * something the first eleven promotions out of here all concluded was
     * impossible. Nine entries to eight: `quadratic-formula` and
     * `rational-exponents` both left the gate and `radical-equations` is the
     * single entry that replaced them. `gatingPrerequisitesOf` names the
     * nearest teachable ancestor on each BRANCH, this node had two
     * prerequisites and both were gate entries in their own right, and
     * authoring it put one teachable node in front of a fork. Same mechanism as
     * `percent`'s effect on `descriptive-statistics`, three to two, and the
     * note beside that departure is where it is argued — so the rule is now
     * confirmed twice rather than once, and the earlier "a gate substitutes at
     * constant length" readings stand corrected as measurements taken only on
     * single-prerequisite nodes. Measured on both sides rather than predicted;
     * tests/atlas.mjs holds the figures.
     *
     * THE ROOT SET OF THIS AREA SHRANK, five to four, and it is the
     * `binomial-theorem` cause for the third time: this node had no in-area
     * dependent at all, its only dependent anywhere being
     * `trig-substitution-setup` in another area, so nothing inside this area
     * could have been freed and nothing was. Not the `absolute-value` cause,
     * where the in-area dependent existed and was gated from inside — the two
     * produce identical shrinkage and only the computed set tells them apart.
     */
    /**
     * `nonlinear-systems` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
     *
     * It is a real concept now — three knowledge points, worked examples with a
     * hand-written question on every subgoal, and eight tasks — in
     * ontology-algebra.ts, joining the four concepts of
     * `expressions-and-equations`. `atlasProblems` rejects a map node whose id
     * collides with an authored concept, and not as tidiness: the composed
     * concept list would hold two entries for the id, and the shadowing copy
     * has no knowledge points, so a fully authored concept would silently read
     * as unteachable.
     *
     * THIS IS THE ELEVENTH DEPARTURE AND THE NODE COUNT NOW SITS EXACTLY ON THE
     * FLOOR, which is the fact a reader of this area most needs and the reason
     * this block leads with it. Six nodes become five against a stub floor of
     * five, and eleven departures take `STUB_FLOOR_TERRITORY` to sixteen — the
     * same sixteen it read before the promotion, because the floor counts an
     * area's departures as territory it has covered and a node moving from one
     * column to the other conserves the sum. So nothing here is frozen by this,
     * and the two readings have come as far apart as they can: on node count
     * alone this area is ON the threshold and may give up nothing further,
     * while on territory it has not moved at all since the merge. Whoever
     * promotes out of here next should know which of those two numbers they are
     * reading, and that the live check in tests/atlas.mjs is the territory one
     * — `AREAS.every(a => a.nodes.length >= STUB_FLOOR)` is still asserted
     * beside it and 5 >= 5 is the last value that satisfies it.
     *
     * ONE OF ITS TWO `needs` HAD NOWHERE LOCAL TO GO, which makes this the
     * second promotion in a row to cost `links` an entry where the first three
     * out of this subject cost it nothing. `systems-of-linear-equations` is a
     * concept of the subject this node joined, so that edge is an ordinary
     * prerequisite there. `quadratic-formula` is a concept of
     * `rational-expressions`, and an authored ontology may only name concepts
     * it contains — so that one is the `links` entry below, filed with the area
     * that OWNED the departing node rather than with the subject holding the
     * far end. Both of its ends are authored and teachable, so unlike the
     * `complex-numbers` entry beside it this one gates immediately.
     *
     * NOTHING WAS HANDED BACK AND NOTHING WAS STRANDED, both checked rather
     * than assumed, and the second check is one this area has had to learn to
     * run three separate ways:
     *
     *  - No `links` entry on any area named this node, so there was no entry to
     *    delete. The hand-back hazard is real and `cartesian-plane` found it —
     *    an entry whose far end moves into the promoted concept's own subject
     *    becomes a duplicate edge that `composeAtlas` does not notice.
     *  - The node declared NO `confusedWith`. That is the stranding no suite
     *    catches: `expandEdges` turns one into an `interferes_with`,
     *    interference constrains selection rather than gating, so losing one
     *    leaves every test green while freeing the scheduler to introduce the
     *    two most confusable concepts in the subject together.
     *  - And NO `exercises`, which is the same hazard by a second route and the
     *    one `euclidean-algorithm` added to this list: `expandEdges` turns an
     *    `exercises` into an `encompasses` edge, so a credit claim vanishes
     *    with the node exactly as silently. The fourth promotion out of this
     *    subject DID carry one and had to restate it; this one had none.
     *
     * All three absences are asserted rather than described, because an absence
     * has to be looked for to be known.
     *
     * THE ROOT SET OF THIS AREA SHRANK, four to three, and it is the
     * `binomial-theorem` cause for the fourth time — which keeps that the
     * commonest of the four causes this area has shown. This node had no
     * in-area dependent at all: its only dependent anywhere is
     * `parametric-and-implicit`, which is a node of `functions`. So nothing
     * inside this area could have been freed and nothing was. Worth reading
     * against the `systems-of-linear-equations` departure directly above, which
     * had the same count of dependents and SUBSTITUTED into this set rather
     * than shrinking it, because its one in-area dependent was this node. Two
     * promotions, one dependent each, opposite effects — and only the computed
     * set says which.
     *
     * AND IT MADE ITS ONE DEPENDENT'S GATE SHORTER, in another area and with no
     * edit to it. `gatingPrerequisitesOf` names the NEAREST teachable ancestors
     * and looks through the unteachable ones, so while this node had no material
     * the walk passed through it and reported what IT rested on:
     * `parametric-and-implicit` was gated by `domain-and-range`,
     * `cartesian-plane`, `systems-of-linear-equations` and `quadratic-formula`,
     * four entries. The walk stops at this concept now, so the last two
     * collapse into it and the gate is three. A tighter gate is a SHORTER list,
     * which reads backwards until the definition is in front of you, and which
     * way the count moves depends on how many prerequisites the promoted node
     * had — so it is computed on both sides rather than predicted.
     * tests/atlas.mjs holds the figures.
     */
    // `binomial-theorem` stood here and is now AUTHORED in ontology.ts, beside
    // `polynomial-arithmetic`, which is its prerequisite and the concept it
    // generalises. It had to leave: `atlasProblems` refuses a map node whose id
    // collides with an authored concept.
    //
    // ITS TWO `needs` WENT TO TWO DIFFERENT PLACES, which is why this departure
    // is worth more than a line. `polynomial-arithmetic` is a concept of the
    // ontology it joined, so that edge is an ordinary prerequisite there (p15).
    // `exponent-rules` belongs to `exponents-and-logarithms`, and an authored
    // ontology may only name concepts it contains — so that one is the `links`
    // entry below. It gates nothing today for a reason that does not apply here:
    // both ends are authored and teachable, so unlike the `complex-numbers`
    // entry beside it, this one gates immediately.
    //
    // NOTHING WAS HANDED BACK AND NOTHING WAS STRANDED, both checked rather
    // than assumed. No `links` entry on any area named this node, so there was
    // no entry to delete. The node carried no `confusedWith`, which is the
    // stranding no test catches — `expandEdges` turns one into an
    // `interferes_with` and deleting the declaring node deletes the edge in
    // silence. And its three dependents — `power-and-sum-rules`,
    // `counting-principles` and `discrete-distributions` — all sit in OTHER
    // areas and all DECLARE the edge themselves, so all three resolve through
    // `composeAtlas` untouched. An edge is owned by the node that declares it.
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
      /**
       * THE EDGE `binomial-theorem` COULD NOT TAKE WITH IT.
       *
       * The node declared `needs: ['polynomial-arithmetic', 'exponent-rules']`
       * and the two went to different places. The first joined the ontology the
       * concept now lives in, where it is a plain prerequisite. This one could
       * not: `exponent-rules` is a concept of `exponents-and-logarithms`, the
       * binomial theorem is a concept of `rational-expressions`, and an
       * authored ontology's edges may only name concepts it contains or
       * `ontologyProblems` reports an unknown endpoint. Neither subject can
       * take it, so `links` is the only place it fits — the same conclusion the
       * `roots-and-irrationals → quadratic-formula` entry above reaches, and by
       * the same route rather than that entry's changed one.
       *
       * IT DIFFERS FROM EVERY OTHER ENTRY HERE IN ONE RESPECT: it gates from
       * the day it is written. The entries above it were written while one end
       * was an unwritten map node, and `gatingPrerequisitesOf` looks THROUGH an
       * unteachable prerequisite rather than at it, so they stood in the graph
       * and gated nobody. Both ends of this one are authored and teachable, so
       * the ordering it asks for takes effect immediately. That is the
       * behaviour the file's rule — gating only ever tightens as material is
       * authored — exists to produce, and this is the first entry here to show
       * it on arrival rather than years later.
       */
      from: 'exponent-rules',
      to: 'binomial-theorem',
      because:
        'Every term of (a + b)ⁿ is a product of powers whose exponents must add to n, so the ' +
        'product rule is in use on every line of an expansion. The step it actually decides is ' +
        'the one learners drop: when the bracket carries a coefficient, (2x)³ is 8x³ and not ' +
        '2x³, because the exponent applies to the whole part and not just the letter.',
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
    {
      /**
       * THE EDGE `radical-equations` COULD NOT TAKE WITH IT.
       *
       * The node declared `needs: ['quadratic-formula', 'rational-exponents']`
       * and the two went to different places, the same split
       * `exponent-rules → binomial-theorem` above records. The second joined
       * the ontology the concept now lives in, where it is a plain
       * prerequisite. This one could not: `quadratic-formula` is a concept of
       * `rational-expressions`, `radical-equations` is a concept of
       * `exponents-and-logarithms`, and an authored ontology's edges may only
       * name concepts it contains or `ontologyProblems` reports an unknown
       * endpoint. Neither subject can take it, so `links` is the only place it
       * fits.
       *
       * IT IS THE MIRROR IMAGE OF THAT ENTRY, which is the thing about it worth
       * a note. There, the node went to the subject holding
       * `polynomial-arithmetic` and the exponent rules were left behind; here
       * the node went to the subject holding `rational-exponents` and the
       * quadratic formula is what was left behind. The two entries therefore
       * run between the same two subjects in opposite directions, and both are
       * here rather than one in each area's list, because `links` is filed with
       * the area that OWNED the departing node and both nodes were owned by
       * this one.
       *
       * Like that entry and unlike the three above it, this one GATES from the
       * day it is written: both of its ends are authored and teachable, so
       * `gatingPrerequisitesOf` looks AT the prerequisite rather than through
       * it. The entries written while one end was an empty map node stood in
       * the graph and gated nobody until somebody authored that end.
       */
      from: 'quadratic-formula',
      to: 'radical-equations',
      because:
        'Isolating the root and squaring leaves a polynomial equation, and in every radical ' +
        'equation anybody sets by hand it is a quadratic — √(x + 7) = x + 1 squares to ' +
        'x² + x − 6 = 0. So the candidates a learner then has to check are produced by the ' +
        'formula or by factoring, and somebody who cannot reach them has nothing to check. The ' +
        'ordering is about where the candidates come from and not about the extraneous root: ' +
        'that one is a fact about the squaring, and the quadratic is innocent of it.',
    },
    {
      /**
       * THE EDGE THAT WOULD HAVE BEEN LOST WHEN `nonlinear-systems` WAS
       * AUTHORED, AND THE SECOND ENTRY THIS AREA OWES THE QUADRATIC FORMULA.
       *
       * The node declared `needs: ['systems-of-linear-equations',
       * 'quadratic-formula']`. The first is an authored concept of
       * `expressions-and-equations`, which is the subject this one joined, so
       * that edge is an ordinary prerequisite in ontology-algebra.ts's own
       * `EDGES`. This one crosses into `rational-expressions` and can be
       * declared by neither ontology — an authored ontology's edges may only
       * name concepts it contains — so `links` is its only home.
       *
       * It gates from the day it is written, unlike the `complex-numbers` entry
       * above, and the difference is which end is a node: both ends of this one
       * are authored concepts. The entry two above it, `quadratic-formula ->
       * radical-equations`, is the same `from` with a different `to` and
       * arrived three promotions earlier — so the formula now has two
       * dependents reached through this field, and the note on that entry about
       * gating looking AT a prerequisite rather than through it applies to this
       * one from the start rather than retrospectively.
       */
      from: 'quadratic-formula',
      to: 'nonlinear-systems',
      because:
        'Substituting the line into the conic leaves ONE equation in one unknown and it is a ' +
        'quadratic — x² + (x + 1)² = 25 collects to x² + x − 12 = 0 — so everything the ' +
        'concept does after the substitution is the quadratic being solved. The count of ' +
        'intersections needs more of it than that: the number deciding whether a line cuts a ' +
        'curve twice, touches it once or misses it is the DISCRIMINANT, which is a part of the ' +
        'formula rather than a separate idea, and a learner who has not met it has no way to ' +
        'answer the question without finding the roots first and sometimes failing to. The ' +
        'ordering is not about the surd: the systems here are chosen so the roots come out ' +
        'whole, and the dependency is on where the roots come from and on what their number is ' +
        'read off.',
    },
  ],
  /*
   * ELEVEN NODES HAVE BEEN AUTHORED OUT OF THIS AREA, and this is the list the
   * stub floor reads. See `MapArea.departed` in atlas.ts for the mechanism.
   *
   * THIS IS THE AREA THE FIELD WAS ADDED FOR. It holds five nodes against a
   * floor of five, and every one of the eleven below left because its content
   * got written — so the floor would be reading a sixteen-node area that has
   * covered eleven of them as though it were a five-node sketch. The repair the
   * floor's own comment prescribes for a DRAINED area is to fold the remnant
   * into a neighbour, and that is the one thing this area cannot do: there is
   * nothing above "Number and algebra" to fold into, since it IS the
   * foundation, and its leftovers would scatter across four different areas if
   * one were forced. Hence the other repair the same comment names.
   *
   * THE TWO FIGURES HAVE NOW COME AS FAR APART AS THEY CAN. Six nodes and ten
   * departures became five and eleven, so the territory is sixteen on both
   * sides of the edit — a node moving from one column to the other conserves
   * the sum, which is the invariant rather than the snapshot. What has changed
   * is that the NODE count is now on the threshold rather than one above it, so
   * the next promotion out of here is the first that the two readings would
   * answer differently: `AREAS.every(a => a.nodes.length >= STUB_FLOOR)` is
   * still asserted in tests/atlas.mjs alongside the territory check, and 5 is
   * the last value satisfying it. That is not a reason to lower either check.
   * It is the state the merge note above predicted this area would reach, and
   * the question it raises — merge, or read the territory only — is the same
   * one that note says belongs to a person.
   *
   * Each id is already explained in prose at the point its node used to sit —
   * "`X` was here and is now authored in ..." — and this list is derived from
   * exactly those eleven comments. They stay where they are: they carry the
   * why, and this carries only the fact. Note that the two merged-in areas are
   * not represented here, because `number-and-arithmetic`'s nodes arrived as
   * nodes and departed, if at all, as the ids below.
   */
  departed: [
    'absolute-value',
    'prime-factorisation',
    'gcd-and-lcm',
    'fraction-arithmetic',
    'decimal-representation',
    'ratio-and-rate',
    'percent',
    'roots-and-irrationals',
    'real-number-line',
    'radical-equations',
    'nonlinear-systems',
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
    'algebra, where lines and conics are equations, a ' +
    'transformation acts on coordinates, and three dimensions are a third number. Distance and ' +
    'midpoint used to be named in that list and have been written, so they are pointed at ' +
    'rather than described here. ' +
    'Twelve of its nodes have left for the plane-geometry syllabus, where ' +
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
    'converses that make the family a hierarchy. Area and perimeter went as a seventh, as two ' +
    'measures rather than a list of formulas: the rectangle taken as the definition of area and ' +
    'everything else got from additivity, so that a rectangle with a piece cut out of it is one ' +
    'subtraction and the position of the cut never enters it; a base paired with the height ' +
    'belonging to that base, with a side offered as a height refused by the triangle inequality ' +
    'before any arithmetic; and the two measures shown to determine each other in neither ' +
    'direction. What stayed behind of that one is every cut-and-rearrange derivation and every ' +
    'named-shape formula whose statement is a description of a figure. And deductive proof has ' +
    'gone as an eighth, which is the first departure that is not about a figure at all — a chain ' +
    'of cited facts reaching an angle nobody stated and collapsing into one expression in the ' +
    'given, the difference between a converse that needs its own proof and a contrapositive that ' +
    'comes free, and the asymmetry between refuting a universal claim with one case and ' +
    'establishing one with any number of them. What stayed behind of that is every proof whose ' +
    'steps are about a drawing, which is most of what this area still holds. And the circle has ' +
    'gone as a ninth, which is the departure this area\'s own prose had written off as ' +
    'impossible: an inscribed angle as half the central angle on the arc the vertex is NOT on, ' +
    'so that a chord carries two answers and the vertex\'s place on its arc is not one of the ' +
    'things the answer uses; a tangent length as the leg left by a right angle whose position is ' +
    'fixed by the radius rather than by which number is larger, with the existence condition and ' +
    'the equal-tangents fact read off the same expression; and the opposite angles of a cyclic ' +
    'quadrilateral totalling 180°, halved out of the first of those and set against the total of ' +
    'all four angles, which every quadrilateral passes. What stayed behind of that one is the ' +
    'chords — equal chords equidistant from the centre, the intersecting-chord products, the ' +
    'alternate segment — each a similar-triangles argument about a drawing, together with the ' +
    'proofs of the inscribed-angle theorem and of the tangent\'s perpendicularity, which are case ' +
    'analyses over where the centre falls. And circular measure has gone as a tenth, which is ' +
    'the first departure the figure test split along a line this area\'s own prose had already ' +
    'drawn: π as the quotient of circumference and diameter, with the content being that the ' +
    'quotient is the same for every circle because any two circles are similar and scaling ' +
    'multiplies its top and bottom by one factor, so that π is forced rather than measured; a ' +
    'central angle\'s share of a full turn taken ONCE and then applied to two different wholes, ' +
    'the circumference for the arc and the area for the sector, with the sector\'s perimeter as ' +
    'the one measure that is a share of nothing because a full circle carries no radii on its ' +
    'boundary; and a scale factor entering the boundary once and the area twice, which is where ' +
    'a circle escapes the two measures determining each other in neither direction that area and ' +
    'perimeter established, on a count of free parameters rather than an exception. What stayed ' +
    'behind of that one is the half that says WHY, and it is the half that needs the figure: the ' +
    'area of a circle as a limit of inscribed polygons, which is a sequence of drawings with ' +
    'more and more sides and has no figure-free part to take, so πr² is used in the syllabus and ' +
    'not derived there. The triangle is ' +
    'still named in this area\'s ' +
    'title claim because the rest of what is synthetic about it is still here, the chord ' +
    'theorems above all; `three-dimensional-coordinates` was the first node above the syllabus ' +
    'and has itself gone as a thirteenth, which ended a run of three promotions that each ' +
    'substituted a root — `circle-measure`, then `solid-geometry`, then the three dimensions in ' +
    'turn — by taking one away and putting nothing in its place, since that node\'s dependents ' +
    'are all outside this area. Coordinates ' +
    'used ' +
    'to be a separate area and are not any more: the synthetic/analytic split is still real ' +
    'mathematics and had stopped being a usable division of the MAP, so it runs inside this area ' +
    'now rather than between two of them. The plane itself is in neither half — pairing a point ' +
    'with two numbers has problems written for it and lives in the vectors syllabus, which the ' +
    'analytic nodes point at rather than restating. And the dot product has gone the same way as ' +
    'an eleventh, which is the first departure from this area to land in a subject other than ' +
    'plane-geometry: a product of two vectors that returns a NUMBER, so that a length is one of ' +
    'these products and a right angle is a zero one — proved rather than asserted, out of the ' +
    'converse of Pythagoras applied to the triangle the two arrows make — and so that the sign ' +
    'alone sorts acute from obtuse, exactly where the cosine itself is irrational. What stayed ' +
    'behind of it is the ANGLE: the identity hands back cos θ as an exact quotient, and turning ' +
    'that quotient into a figure in degrees needs a table and is filed with the inverse ' +
    'functions. It left for the vectors syllabus and not this area\'s own, because it is a vector ' +
    'operation before it is a fact about triangles, so the count of departures from here and the ' +
    'size of the plane-geometry syllabus have stopped being one number. And the solids have gone ' +
    'as a twelfth, into a tenth subject of their own rather than into either of those two: a ' +
    'constant cross-section carrying its AREA along a length to make a volume and its PERIMETER ' +
    'along the same length to make the side, so that one prism needs both of the plane measures ' +
    'that determine each other in neither direction; a pyramid or cone taking exactly a third of ' +
    'the volume, with the third PROVED by splitting a cube into three congruent pyramids rather ' +
    'than asserted, and taking no third at all of the surface, because the slanted faces rise ' +
    'along the slant height and that is a separate Pythagoras; and a scale factor entering a ' +
    'length once, an area twice and a volume three times, which is the circular measure\'s two ' +
    'exponents with the third dimension\'s added. What stayed behind is everything about a solid ' +
    'that is not its measure — dihedral angles, nets, Euler\'s formula on the vertices, the five ' +
    'regular polyhedra — which is why the subject is named for the measure and not for the solid, ' +
    'and the one fact it borrows is the 4 in a sphere\'s surface area, Archimedes\' comparison ' +
    'with a cylinder being a claim about matching slices in the same way the inscribed polygons ' +
    'behind πr² are. This is the first departure from here to create a subject, so the three ' +
    'things a promotion out of this area can do with a node have now each happened: ten went to ' +
    '`plane-geometry`, one to a subject that already existed, and one to a subject that did not. ' +
    'And the third dimension has gone as a thirteenth, to the vectors syllabus as the dot ' +
    'product did, which is the second time a departure from here has widened a subject that ' +
    'already existed rather than founding one: a point in space as an ordered triple whose ' +
    'distance is Pythagoras applied twice rather than a formula with a third term bolted on, ' +
    'with the intermediate diagonal irrational and the answer not, so the root is shown being ' +
    'squared away; every consequence the dot product had in the plane carried over on the ' +
    'ground that none of the arguments ever counted the coordinates, set against the one thing ' +
    'that did NOT carry over, the single-number independence test, which in space becomes three ' +
    'numbers and therefore no answer; one linear equation as a PLANE rather than a line, got as ' +
    'n·(r − P) = 0 so that the coefficients are a normal vector rather than three numbers, with ' +
    'the freedom count — three coordinates less one condition — as the reason, and a line in ' +
    'space priced at two equations or a parameter by the same count; and the cross product as ' +
    'the sign of that plane test grown into a direction, with the answer checked against both ' +
    'inputs by dotting rather than trusted, coming back as the exact normal of the plane the two ' +
    'inputs lie in, and reversing when the arguments do, which is what the convention was ' +
    'always for. What stayed behind of that one is lines in space as objects rather than as a ' +
    'count — the parametric form r = r₀ + t·d wants a task kind that can rule "for which t", ' +
    'which is the same gap that still blocks the algebra route concepts — and everything ' +
    'curved, the sphere included, since one equation in three unknowns is a surface by the very ' +
    'count that syllabus teaches and the subject holds nothing curved to make it out of. ' +
    'That leaves this area owing NOTHING on either unfinished journey for the first time since ' +
    'the merge, which is the state the merge was argued for and not a sign the area is spent: ' +
    'eight nodes are still here and none of them is on a route anybody is walking yet. ' +
    'And distance and midpoint have gone as a fourteenth, which is the first departure from ' +
    'this area that no route asked for — every journey reads zero unwritten now, so what chose ' +
    'it was an edge rather than a destination: Pythagoras with the two legs read off the axes ' +
    'and the subtraction order erased by the squaring, so there is no first point to get wrong; ' +
    'the midpoint as a per-axis average that costs TWO numbers and a carried half, with the two ' +
    'pieces it cuts shown to ADD to the whole, which is what puts it on the segment at all ' +
    'since equal distances alone put it anywhere on the perpendicular bisector; and the same ' +
    'relation run backwards to recover an endpoint, where the error worth naming is a ' +
    'displacement handed back in place of a coordinate. It went to `plane-geometry` and not to ' +
    'the vectors syllabus holding `cartesian-plane`, which is the better home on subject ' +
    'matter, and the reason is that the node declared `exercises: [\'pythagoras\']` — an ' +
    '`encompasses` edge, and `links` below carries `prerequisite` edges only, so an ' +
    '`encompasses` across two files is expressible nowhere and filing it with the vectors ' +
    'would have deleted it in silence. Eleven of this area\'s departures have now gone to ' +
    '`plane-geometry`, two to the vectors and one to the solids. What stayed behind is the rest ' +
    'of the analytic half and is untouched by it: slope and the three forms of a line, the ' +
    'circle as an equation, the conics, the parametric curves and the regions — none of which ' +
    'has a credit edge into any syllabus, so nothing about this promotion pulls the next one ' +
    'after it. ' +
    'And the isometries have gone as a fifteenth, which is the departure that says what the ' +
    'third one was ABOUT: a map keeping every distance, with the angles following by SSS rather ' +
    'than assumed beside them — so one hypothesis yields all six of a congruence\'s equalities, ' +
    'a congruence statement\'s letter order is the record of where a map sent each vertex, and ' +
    'the argument needs the three sides EQUAL rather than KNOWN, which is why two of them never ' +
    'being measured costs nothing; two reflections in crossing mirrors composing to a rotation ' +
    'through TWICE the angle between them, each mirror bisecting the angle it turns a point ' +
    'through and the point\'s own position dropping out of the sum, with the order of the two ' +
    'reflections mattering at every mirror angle except the right one; and a figure\'s ' +
    'symmetries counted as a full turn over the smallest returning turn plus one per mirror ' +
    'line, so that a regular n-gon has 2n, its axes arranged by the parity of n, and a scalene ' +
    'triangle has 1 rather than 0. What stayed behind of that one is the CLASSIFICATION — that ' +
    'every isometry of the plane is a translation, a rotation, a reflection or a glide ' +
    'reflection, which is an argument about where three fixed points can lie and is used in the ' +
    'syllabus rather than derived there, exactly as the congruence criteria and the ' +
    'inscribed-angle theorem are — and so did everything the same motions become in ' +
    'coordinates, since `plane-transformations` was still a node here and was where a reflection ' +
    'is written as a rule on a pair of numbers. Twelve of this area\'s departures have now gone ' +
    'to `plane-geometry`, two to the vectors and one to the solids. ' +
    'And that node has gone as a sixteenth, to `plane-geometry` beside the isometries it was ' +
    'the other half of, which makes it the first departure from here that no dependent was ' +
    'waiting on: it has zero dependents anywhere on the map, so what chose it was that an ' +
    'honest task could be set — a transformation as a rule on the PAIR, with the slots kept ' +
    'separate from the signs, since a reflection in an axis and a quarter turn each produce one ' +
    'minus sign and are told apart only by which slot each number lands in; distance ' +
    'preservation COMPUTED by putting both endpoints through the rule and measuring between the ' +
    'images, which turns the isometries\' one hypothesis into something checkable and shows a ' +
    'scaling failing the check, with the factor entering each leg once, each square twice and ' +
    'leaving the root once; and a centre that is not the origin, where the rule becomes three ' +
    'moves and the wrong answer the origin rule gives is computed in full and then refuted by ' +
    'the one distance a rotation about a centre may not change. What stayed behind of it is ' +
    'nothing, which no other departure from this area can say: the node\'s content was the four ' +
    'maps in coordinates and all of it went. Thirteen of this area\'s departures have now gone ' +
    'to `plane-geometry`, two to the vectors and one to the solids. Seven nodes are left and ' +
    'none of them is on a route anybody is walking; exactly two of the seven — the ' +
    'constructions and the non-Euclidean geometry — are ready in the sense that every ' +
    'prerequisite is written, and both were passed over here because what they ask for is a ' +
    'procedure carried out on paper or a decision about axioms rather than a value.',
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
   * THE BUDGET THIS BOUGHT, as it stood at the merge. Seventeen nodes against
   * a floor of five is twelve promotions. The two remaining journeys needed
   * seven of them from here — `geometric-proof`, `area-and-perimeter`,
   * `circles`, `circle-measure`, `solid-geometry`, `dot-product-geometry` and
   * `three-dimensional-coordinates` — which left five to spare. Seventeen is
   * also not an outlier: `discrete-mathematics` is seventeen too, and
   * `abstract-algebra` and `differential-calculus` are fifteen each, so the
   * merged area is the size of the largest existing one rather than a new kind
   * of thing.
   *
   * FIVE OF THE SEVEN HAVE SINCE BEEN SPENT, which is the budget being drawn
   * on rather than the figures above going stale. `area-and-perimeter`,
   * `geometric-proof`, `circles`, `circle-measure` and `dot-product-geometry`
   * are all authored, so the area is twelve nodes against two owed and the
   * slack is unchanged at five — which is the arithmetic the budget predicted,
   * since a promotion takes one from each side and the slack is the difference.
   * tests/atlas.mjs recomputes both numbers from the tree rather than trusting
   * either, and its named list of route concepts fails loudly when one of them
   * becomes authored instead of going vacuous.
   *
   * The fifth is the one that did NOT go to `plane-geometry`, and the budget is
   * indifferent to that while a reader of this block is not: the seven named
   * above were counted as debts of this AREA, and one of them has been paid by
   * the vectors syllabus. So "nodes this area owes the journeys" and "concepts
   * the geometry subject will eventually hold" were never the same list, and
   * this is the promotion that shows it.
   *
   * The second of the four is the one that mattered to the ORDER rather than to
   * the count. `geometric-proof` was the sole remaining blocker of `circles`,
   * and `circles` is what the other four owed concepts stood behind —
   * `circle-measure` needed it, `solid-geometry` needs that, and
   * `three-dimensional-coordinates` needs that. So the budget's five remaining
   * entries went from "one available and four unreachable" to a chain with its
   * bottom link open, and that is the deadlock this area's merge was argued for
   * finally being cashed in rather than only cleared. The two promotions since
   * have walked that chain two links further, which is the merge's prediction
   * coming true rather than a new argument.
   *
   * THE AREA'S OWN ROOTS WENT FROM THREE TO SIX, which is the merge's visible
   * effect on the area view: `area-and-perimeter`, `geometric-proof` and
   * `isometries-and-symmetry` were already there, and `distance-and-midpoint`,
   * `dot-product-geometry` and `plane-transformations` arrived as roots
   * because every one of their prerequisites is outside the merged area. The
   * seventh promotion then took `area-and-perimeter` out of that set and left
   * it at five, for the reason the block below the node list gives. Asserted
   * by named membership in tests/atlas.mjs, never by count — the promotions
   * below have twice turned that set over without changing its size, which a
   * `length === N` check passes while every claim it makes has gone stale.
   *
   * NONE OF THE THREE THE MERGE ADDED IS STILL THERE, and the three went one
   * per promotion — `dot-product-geometry` at the eleventh,
   * `distance-and-midpoint` at the fourteenth and `plane-transformations` at
   * the sixteenth. Each arrived as a root for the same reason it was writable,
   * every prerequisite outside the area and nothing here holding it back, and
   * each left as one. So "arrived by merge" turned out to predict "left by
   * promotion" in all three cases, which is the strongest statement this file
   * can make that the area view is about this area's BOUNDARY rather than
   * about the mathematics: a node whose prerequisites all sit elsewhere is
   * both the easiest thing to write and the least attached to where it was
   * filed. The paragraph below is the first of the three and is kept as
   * written, because the shape it records is the one the other two repeated.
   *
   * The eleventh promotion: `dot-product-geometry` was a root of this area for
   * exactly the reason it was writable — every prerequisite outside, nothing
   * here holding it back — and it left as one. That is the shape the fifth and
   * seventh promotions had, a shrink with no substitution, and it happened for
   * the same reason: the node resting on it, `three-dimensional-coordinates`,
   * did not become a root because its other prerequisite `solid-geometry` is
   * in this area and still gates it from inside. A node arriving as a root by
   * merge and leaving as one by promotion is the clearest case there is of the
   * area view being a statement about this area's boundary rather than about
   * the mathematics.
   */
  /**
   * ELEVEN NODES LEFT THIS AREA WHEN THEY WERE AUTHORED, AND HAD TO.
   *
   * `points-lines-angles`, `triangle-basics`, `congruence`, `similarity`,
   * `pythagoras`, `quadrilaterals-and-polygons`, `area-and-perimeter`,
   * `geometric-proof`, `circles` and `circle-measure` are real concepts now —
   * thirty knowledge points between them, with worked examples and sixty tasks
   * — in ontology-geometry.ts, under the `plane-geometry` subject.
   * `atlasProblems` rejects a map node whose id collides with an authored
   * concept, and not as tidiness: the composed concept list would then hold two
   * entries for the id, and the shadowing copy has no knowledge points, so a
   * fully authored concept would silently read as unteachable. Leave any of the
   * ten here and the material in ontology-geometry.ts becomes unreachable
   * without a single error.
   *
   * THE ELEVENTH WENT SOMEWHERE ELSE, which is the one thing about this list
   * that is not covered by the paragraph above. `dot-product-geometry` is a
   * concept of `vectors-and-independence` in ontology-vectors.ts, not of
   * `plane-geometry`, so the count of departures and the size of the geometry
   * syllabus have stopped being the same number. The collision rule is
   * indifferent to which subject absorbed it — `atlasProblems` compares a node
   * id against EVERY authored concept — so the node had to go for exactly the
   * reason the ten before it did. What changes is only where to look for the
   * material, and the stub beside the node list says so.
   *
   * It came from the analytic half rather than the synthetic one, which is the
   * merge finally paying out in a direction the merge block did not predict:
   * that block argued the analytic nodes in on the grounds that coordinate
   * geometry IS Euclidean geometry done with coordinates, and the first of them
   * to be written turned out to belong to neither — it is a vector operation,
   * and the subject that reads coordinates off the plane is where it went.
   *
   * THE NINTH IS WHERE THE BUDGET STOPPED BEING THE CONSTRAINT, and it is the
   * one thing about it this block has to say that the note beside the node does
   * not. The merge above bought twelve promotions against a floor of five and
   * named the seven the journeys needed. Two were spent by the time that block
   * was last edited, so it read "fifteen nodes against five owed, slack
   * unchanged at five". That promotion made it fourteen nodes against four
   * owed, and the slack was still five, which is the arithmetic the budget
   * predicted for the third time running — a promotion takes one from each side
   * and the difference does not move.
   *
   * THE TENTH HELD THAT ARITHMETIC FOR A FOURTH TIME: thirteen nodes against
   * three owed, slack unchanged at five. Worth one line only because the
   * prediction is now old enough to be worth distrusting, and it has not failed
   * yet. It can only fail on a promotion out of this area of a node the
   * journeys do not need — then the node count drops and the owed count does
   * not — and all three still owed are route concepts, so the next promotion
   * from here will hold it again.
   *
   * THE ELEVENTH HELD IT FOR A FIFTH TIME, exactly as that sentence predicted:
   * twelve nodes against two owed, slack unchanged at five. The prediction has
   * now survived every promotion out of this area since the merge, and the
   * reason is not deep — the slack is a difference, and a route concept being
   * written subtracts one from each side of it. It stays worth stating only
   * because the number looks like a measurement and is really an identity, so
   * anybody watching it for a signal is watching the wrong thing.
   *
   * THE TWELFTH HELD IT FOR A SIXTH TIME: eleven nodes against one owed, slack
   * unchanged at five. Nothing new is learned from the sixth instance of an
   * identity, and it is recorded only because the row in tests/atlas.mjs that
   * carries it is now one id long and will be deleted by the next promotion out
   * of here — after which this paragraph is the only place the sequence
   * survives.
   *
   * WHAT HAS MOVED IS THAT THE DEPTH HAS RUN OUT TOO, and that is the state a
   * later author needs rather than the slack. The merge was argued for as
   * replacing a floor with a depth, and the depth was the chain
   * `circle-measure -> solid-geometry -> three-dimensional-coordinates`. Two of
   * those three are written and the third is writable now: both halves of its
   * gate, `solid-geometry` and `dot-product-geometry`, are authored concepts.
   * So this area owes exactly ONE node on either unfinished route, it is
   * immediately available, and nothing about it is waiting on a decision —
   * which is the first time since the merge that has been true of anything
   * here.
   *
   * The filing question the eleventh promotion left attached to `solid-geometry`
   * is answered and is worth keeping as a worked case. `plane-geometry`'s id and
   * its `covers` both excluded the solids by name — the `covers` closed with
   * "The solids are the rest and are still mapped only" — so the subject had
   * already declined the node in writing, and the choice was a tenth ontology
   * rather than a widened one. ontology-solids.ts runs the test against all
   * nine subjects and ontology-trigonometry.ts is the precedent for the test.
   * The lesson is the one the ninth promotion recorded and this confirms:
   * "needs a new subject" is an authoring job with precedent, where "needs a
   * new `TaskKind`" — which is what still blocks the three algebra route
   * concepts — is a decision about what counts as evidence and belongs to a
   * person.
   *
   * `three-dimensional-coordinates` carries a filing question of its own, and
   * it should be answered before it is written rather than during. It is
   * analytic — coordinates, lines and planes in space, with the cross product —
   * so `vectors-and-independence` already owns its neighbourhood and is the
   * likely home, while `solid-measure` is named for the measure of a solid and
   * would have to be renamed to take it. Either answer is defensible; picking
   * one while writing the worked examples is what is not.
   *
   * SEVEN OF THE NINE WERE THE CHEAP KIND OF PROMOTION AND TWO WERE NOT, which
   * makes this area the right place to learn the edge rule from — it shows both
   * halves, and shows each of them more than once. The rule is one sentence: an
   * edge is owned by the node that DECLARES it. So promoting a node strands the
   * edges on its own `needs` and leaves every edge pointing INTO it untouched,
   * because those are declared elsewhere. What varies is where a stranded edge
   * can go, and that is decided by where its OTHER endpoint ended up — which,
   * as the fifth promotion showed, means which FILE it ended up in and not
   * merely whether it was written.
   *
   * THE SEVENTH SETTLED WHAT "CHEAP" MEASURES, which the six before it could
   * not, because every one of them declared either one `needs` or two that
   * split. `area-and-perimeter` declared two and BOTH were already concepts of
   * `plane-geometry`, so both came and no `links` entry was needed. So the
   * expense is not the length of the `needs` list: it is how many of its
   * endpoints live outside the ontology the node is joining. Zero out of two is
   * as cheap as zero out of one, and one out of two is what costs.
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
   * The third is `area-and-perimeter`, and it is the clearest of the three
   * because it appears in that roster TWICE. It named `triangle-basics` and it
   * named `quadrilaterals-and-polygons`, which are two different entries in the
   * list above, and at the seventh promotion both of them were stranded at
   * once by the one node leaving. So a node appearing twice in the roster is a
   * node that will strand two edges, and the only promotion so far with two
   * edges to rehome was exactly that one. The roster can be read forwards.
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
   * THEN THE MERGE WITH `COORDINATE_GEOMETRY` DOUBLED THE SET to six, which is
   * argued in the merge block above, and THE SEVENTH PROMOTION SHRANK IT back
   * to five — the fifth promotion's shape, reproduced exactly.
   * `area-and-perimeter` left and nothing replaced it: the node resting on it
   * was `circle-measure`, which did not become a root then because its other
   * prerequisite, `circles`, was still in this area and gating it from inside.
   * Both of those have since been authored and left, so this paragraph is a
   * record of the seventh promotion and not a description of the area now.
   * That is the third time this set has been touched without its size being a
   * guide to its membership, and the assertion in tests/atlas.mjs is written
   * by name for exactly that reason.
   *
   * THE EIGHTH PROMOTION THEN SUBSTITUTED, five to five, and it is the fourth
   * turnover and the one that closes the rule. `geometric-proof` left and
   * `circles` took its place, because the departing node was the LAST of
   * `circles`'s prerequisites inside the area — its other one, `pythagoras`,
   * has been gone since the fifth promotion. That is the exact case the fifth
   * promotion's note was written around from the other side: `circles` did NOT
   * join the set then, and the reason given was that `geometric-proof` was
   * still here to gate it from inside. So the rule now has both halves of the
   * same node demonstrated — held back while one prerequisite remained, a root
   * the moment it left — which is better evidence than two different nodes
   * illustrating the two outcomes.
   *
   * It also retired an assertion rather than only moving one, and the way it
   * retired it is worth recording. tests/atlas.mjs held "circles is still held
   * back from inside by geometric-proof", written as a membership check on the
   * area's nodes; the moment the node left, the claim stopped being true and
   * the check had to be replaced rather than deleted quietly. The replacement
   * is the same rule at `non-euclidean-geometry`, which needs `geometric-proof`
   * and `circles` and is still held back by the second of those.
   *
   * WHAT DID NOT GO WITH THEM, and the reason the rest are still here: they
   * are about figures. `visualRef` exists so a knowledge point can
   * name a diagram, and there are none in this build to name. What was written
   * is the geometry that survives being written down — two angle sums, a
   * subtraction done twice, a translation along a transversal, then the angle
   * sum that follows from that translation, a comparison between two routes,
   * arithmetic on a total, the three parts of congruence that are about a
   * CORRESPONDENCE rather than about a picture, then the three parts of
   * similarity that are the same correspondence with a ratio in it, then the
   * three parts of Pythagoras that are about which slot a length occupies
   * rather than about any triangle you could draw, then the three parts of
   * the polygons that are two angle totals, a diagonal used to cut rather than
   * to measure, and a disagreement between two words, and now the three parts
   * of area and perimeter that are additivity turning a cut into a
   * subtraction, a base matched to its own height, and two measures shown to
   * determine each other in neither direction. That last one is the clearest
   * case in the area of the figure test taking a node it had no business
   * taking: "every polygon formula reduced to the rectangle by cutting and
   * rearranging" is this node's own summary and is a figure argument from end
   * to end, yet what the formulas come FROM is additivity, and additivity is
   * arithmetic on a total. That is a property of the
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
   * So the test to apply to the nodes below is not "is this node about figures"
   * but "is EVERY part of it about figures". It read "the eight below" until the
   * merge brought the analytic half in and made the count wrong; the test was
   * never about how many there were.
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
   * THAT QUESTION WAS ASKED AND ANSWERED AT THE EIGHTH PROMOTION, so the
   * paragraph above is the record of two deferrals and not a live warning. The
   * answer was not a new idea; it was the figure test's own finding applied to
   * the grader instead of to the prose. The figure-free part of a node has
   * turned out, six times now, to be the part that is really a CLAIM ABOUT
   * CLAIMS — and a claim about claims can be refuted by a value, which means it
   * can be asked by `evaluate`. A chain of three citations composes into one
   * expression in the given; a converse and a contrapositive are separated by
   * the sign of one difference of two perimeters; a proposed counterexample is
   * disqualified by an angle sum that fails to close. Six `evaluate` tasks,
   * three rulable chains, and `chainsWithNoRuling` unmoved at one.
   *
   * What the deferrals cost is worth being exact about, because "they were
   * right to wait" and "waiting was free" are different claims and only the
   * first is true. This node was the sole remaining blocker of `circles`, so
   * two promotions were spent on nodes that unblocked nothing while the only
   * one that would was left on the map. What waiting bought is that the
   * question got asked out loud, in this file and in ontology-geometry.ts,
   * instead of being answered by default by whoever happened to be writing
   * worked examples — which is the same trade the merge blocks above make about
   * the map, and it is the right one.
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
   * THE EIGHTH PROMOTION THEN TOOK THE NODE THE TEST WAS NEVER THE OBSTACLE
   * FOR, and that is the correction it makes to this whole section.
   * `geometric-proof` was listed above among the nodes that are "about
   * figures", and on inspection it is the one node here of which that was
   * simply not true: a proof whose steps are angle facts is a chain of
   * SENTENCES, and the figure-dependent proofs are a subset of its content
   * rather than the whole of it. The test took the node without an argument.
   * What had been stopping it was the GRADER — `justify` is unrulable, and the
   * paragraph two sections up records two promotions declining the node on
   * exactly that ground — and nothing in the figure test speaks to that.
   *
   * The lesson is narrow and worth having: a node left on the map has a REASON
   * and this file has twice let the figure test absorb a reason that was not
   * its. The test's record is now six whole nodes and one split, and the sixth
   * was never in doubt. Whether the two are independent is also now answered —
   * they are, and they can block the same node for different lengths of time.
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
    /*
     * `geometric-proof` was here and is now authored in ontology-geometry.ts,
     * so it had to leave — same rule, eighth time in this area. See the block
     * above the node list.
     *
     * IT IS THE CHEAP CASE, which is worth saying first because this is the
     * node the sixth and seventh promotions both passed over and the reason
     * they gave had nothing to do with edges. It declared `needs:
     * ['congruence']` and nothing else; `congruence` has been a concept of
     * `plane-geometry` since the third promotion, so the one stranded edge was
     * internal to that ontology the moment it was stranded and is declared in
     * its `EDGES`. Nothing crossed a file boundary, so this area's `links`
     * needed no entry and gave none up — it still holds exactly the four that
     * `similarity`, `pythagoras` and the merge left.
     *
     * No `confusedWith` and no `exercises` to strand either, which is the
     * check worth stating rather than leaving to be inferred: `expandEdges`
     * turns a `confusedWith` into an `interferes_with`, interference
     * constrains SELECTION rather than gating, so losing one keeps every suite
     * green while freeing the scheduler to introduce two confusable concepts
     * together. This node had none, and an absence nobody looked for is
     * indistinguishable from a loss.
     *
     * WHAT WAS NOT CHEAP ABOUT IT, since the structural cost being zero is
     * exactly what makes the two deferrals above worth reading. The objection
     * recorded in this comment and in ontology-geometry.ts was about the
     * GRADER: this is a node where the argument is the answer, `justify` is
     * not machine-rulable, and a concept all of whose chains end with no
     * ruling is worse than a mapped node. The question attached to it — what
     * in this node can be asked as a value at all — has now been answered, and
     * the answer is the one the five promotions before it had already
     * established without anybody noticing it applied here: the figure-free
     * part of a node is the part that is really a claim about claims, and a
     * claim about claims is refuted by a value. A chain of three cited facts
     * composes into one expression in the given; a converse and a
     * contrapositive are told apart by the sign of one difference of
     * perimeters; a proposed counterexample is disqualified by an angle sum.
     * Six `evaluate` tasks, and `chainsWithNoRuling` did not move.
     * ontology-geometry.ts carries the full argument.
     *
     * THE EDGES POINTING INTO IT ARE THE WIDEST FAN-OUT THIS AREA HAS GIVEN UP,
     * and none of them needed attention, because an edge is owned by the node
     * that DECLARES it. Four nodes name `geometric-proof` in their own `needs`
     * and all four stayed: `circles` and `non-euclidean-geometry` here,
     * `mathematical-induction` in `sequences-and-series`, and
     * `propositional-logic` in `discrete-mathematics`. The last two are in
     * other atlas FILES, which no promotion out of this area has had to say
     * before, and `composeAtlas` resolves them exactly as it resolves the two
     * local ones. The roster above reads forwards here as it did for
     * `area-and-perimeter`: this node appeared in it once, under `congruence`,
     * and stranded exactly one edge.
     *
     * TWO OF THOSE FOUR HAVE SINCE BEEN PROMOTED THEMSELVES, and both edges
     * moved rather than breaking — worth recording here because it is the
     * case this paragraph's rule does NOT cover. `mathematical-induction` is
     * an authored concept of `functions-and-inverses` as of the thirty-second
     * promotion, and `propositional-logic` one of
     * `statements-and-connectives` as of the thirty-fifth. Neither has a
     * `needs` to own its edge with any more, and no ontology may hold either,
     * both ends in both cases being authored concepts of two different
     * subjects — so they are `SEQUENCES_AND_SERIES.links` and
     * `DISCRETE_MATHEMATICS.links`, each its own area's first and only entry.
     * "An edge is owned by the node that declares it" is what meant nothing
     * here needed attention while those were nodes; it says nothing about
     * where the edge goes when the DECLARING end is promoted, and the answer
     * both times was the area the declarer left, not the area or subject
     * holding the far end.
     *
     * The standing fact that leaves is worth more than the two filings: this
     * node is now gated upon by written material in two subjects that have
     * never heard of it, and BOTH of those edges are recorded somewhere other
     * than here. Nothing in this file would tell a reader so, which is the
     * argument for keeping this paragraph as the fan-out drains rather than
     * shortening it to a line.
     *
     * THE ROOT SET SUBSTITUTED, and this is the half of the fifth promotion's
     * rule that had never been shown from this side. `circles` did NOT become
     * a root when `pythagoras` left, because its other prerequisite was this
     * node and this node was still here to gate it from inside. This promotion
     * is the departure that removes that hold, so `circles` joins the set and
     * `geometric-proof` leaves it: five roots before and five after, with
     * different membership, which is the fourth time this set has turned over
     * without its size being a guide to it. tests/atlas.mjs asserts it by name
     * for exactly that reason, and the assertion that `circles` is held back
     * from inside had to be replaced rather than kept — it would have gone
     * VACUOUSLY TRUE the moment the node it names stopped being in the area.
     */
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
    /*
     * `area-and-perimeter` was here and is now authored in
     * ontology-geometry.ts, so it had to leave — same rule, seventh time in
     * this area. See the block above the node list.
     *
     * IT IS A THIRD SHAPE FOR THE EDGE RULE, and that is the thing to take
     * from it. The cheap case has meant a node with ONE `needs` pointing at a
     * concept of the subject it joins; the expensive case has meant a node
     * with TWO, one of which could not follow and came back here as a `links`
     * entry. This node declared two — `['quadrilaterals-and-polygons',
     * 'triangle-basics']` — and BOTH were already concepts of `plane-geometry`
     * by the time it was promoted, so both stranded edges are internal there
     * and both are declared in its `EDGES`. Nothing crossed a file boundary,
     * so this area's `links` needed no entry and gave none up: it still holds
     * exactly the four it had.
     *
     * So the expense of a promotion is not the SIZE of the node's `needs`
     * list, which the one-and-two pattern of the six promotions above made
     * easy to believe. It is how many of those endpoints live outside the
     * ontology the node is joining, and this is the first promotion where that
     * number was zero out of two rather than zero out of one or one out of two.
     *
     * The edge pointing the OTHER way was left untouched AT THE TIME, as
     * always: `circle-measure` was this node's only dependent anywhere in the
     * atlas and it named the node in its own `needs`, and it was still a map
     * node here, so it still owned that edge.
     *
     * THE TENTH PROMOTION THEN STRANDED IT, which makes this another entry in
     * the "roster of future stranded edges" the block above the node list warns
     * about — and the clearest one, because this node's own note is where the
     * edge was recorded as safe. `circle-measure` is authored now, so the edge
     * it declared came with it into `PLANE_GEOMETRY.edges`. Nothing was lost,
     * and the sentence above is left standing with this one beside it rather
     * than rewritten, because "an into-edge is safe" is true only until the
     * node at the other end is promoted too.
     *
     * THE GATE IT MOVED GOT SHORTER RATHER THAN LONGER, which is new and is
     * the one thing about this promotion a reader is likely to misread. Every
     * tightening before it ADDED a concept to its dependent's gating set: the
     * walk had been passing through an empty node and now stopped at a real
     * one. `gatingPrerequisitesOf(circle-measure)` used to name four —
     * `congruence`, `pythagoras`, `quadrilaterals-and-polygons` and
     * `triangle-basics`, the last two because the walk looked straight through
     * this node and collected both of its prerequisites — and named three after
     * this promotion, with this concept standing in for the pair below it. It
     * has moved twice since: to two at the ninth, and then the tenth authored
     * the gated node itself, so the set that is now worth reading is
     * `solid-geometry`'s. tests/atlas.mjs tracks the whole sequence; the number
     * in this sentence is historical and is not read by any assertion.
     *
     * A shorter list is a TIGHTER gate. The function reports the NEAREST
     * teachable ancestors, so fewer of them means the gate is closer to what
     * it gates: the polygons and the triangles no longer license circular
     * measure between them, because the concept above both now has to be
     * demonstrated as well. tests/atlas.mjs asserts that set by name, which is
     * the only way to tell this apart from a gate going away.
     *
     * The other half of the pair is untouched as always: `circles` is
     * unwritten, so the walk still passes through it to `congruence` and
     * `pythagoras`, and its other prerequisite is `geometric-proof` — the node
     * this promotion chose against, for the rulability reason
     * ontology-geometry.ts argues at length.
     */
    /*
     * `circles` was here and is now authored in ontology-geometry.ts, so it had
     * to leave — same rule, ninth time in this area. See the block above the
     * node list.
     *
     * IT IS THE CHEAP CASE WITH TWO `needs`, which is the seventh promotion's
     * shape and the second instance of it. Both `geometric-proof` and
     * `pythagoras` were already concepts of `plane-geometry`, so both stranded
     * edges are internal to that ontology and both are declared in its
     * `EDGES`. Nothing crossed a file boundary, so this area's `links` needed
     * no entry and gave none up — it still holds exactly the four that
     * `similarity`, `pythagoras` and the merge left. Zero endpoints outside the
     * joining ontology out of two, for the second time, which is what settles
     * the seventh promotion's reading that expense is about WHERE a node's
     * prerequisites live and not how many there are.
     *
     * No `confusedWith` and no `exercises` to strand either, and this is the
     * check worth stating rather than inferring: `expandEdges` turns a
     * `confusedWith` into an `interferes_with`, interference constrains
     * SELECTION rather than gating, so losing one keeps every suite green while
     * freeing the scheduler to introduce two confusable concepts together. This
     * node had none — the only two in this file are on `linear-inequalities`
     * and `exponential-functions` — and an absence nobody looked for is
     * indistinguishable from a loss.
     *
     * THE ROOT SET FANNED OUT, FROM FIVE TO SEVEN, and this is the first time
     * since the third promotion that a departure has added more than one. The
     * three promotions before this each substituted or shrank, which made the
     * fan-out look like a one-off of `congruence`. It is not: it is what the
     * fifth promotion's rule produces whenever the departing node was the LAST
     * in-area prerequisite of SEVERAL dependents at once. `circles` had four
     * dependents and three of them were in that position — `circle-measure`,
     * whose other prerequisite `area-and-perimeter` left at the seventh;
     * `constructions`, which names nothing else; and `non-euclidean-geometry`,
     * whose other prerequisite `geometric-proof` left at the eighth. All three
     * became roots. `circles-analytic` is the fourth dependent and did NOT,
     * because it also needs `lines-in-the-plane`, which is in the analytic half
     * of this area and still gates it from inside.
     *
     * So the set has now done all four things it can do — fanned out twice,
     * substituted three times, shrunk twice, and been doubled by a merge — and
     * across nine promotions plus that merge its size has read 1, 1, 4, 4, 3,
     * 3, 6, 5, 5 and now 7. That sequence is the argument for asserting it by
     * name: no reading of the count predicts the next value, and FOUR of the
     * ten transitions moved membership without moving size at all — the second
     * promotion, when the single root walked from `triangle-basics` to
     * `congruence`, and then the fourth, sixth and eighth.
     *
     * The three that arrived are also the three that make this promotion worth
     * making rather than merely possible. `circle-measure` needs this node,
     * `solid-geometry` needs that, and `three-dimensional-coordinates` needs
     * that — the chain the merge block above was argued for. It had its bottom
     * link opened by the eighth promotion and this is the link itself being
     * written, so the four concepts that stood behind `circles` now stand
     * behind a real one.
     */
    /*
     * `circle-measure` was here and is now authored in ontology-geometry.ts, so
     * it had to leave — same rule, tenth time in this area. See the block above
     * the node list.
     *
     * IT IS THE CHEAP CASE WITH TWO EDGES, for the third time, which makes that
     * reading as well evidenced as the one-and-two pattern it replaced. The node
     * declared `needs: ['circles', 'area-and-perimeter']` and BOTH are concepts
     * of `plane-geometry` by now, so both stranded edges are internal to that
     * ontology the moment they are stranded and both are declared in its
     * `EDGES`. Nothing crossed a file boundary, so this area's `links` needed no
     * entry and gave none up: it still holds exactly the four it had.
     *
     * NOTHING WAS HANDED BACK EITHER, and that is the check this promotion had
     * to make rather than assume. A `links` entry whose two ends BOTH end up
     * inside one ontology has stopped being a cross-file edge and become an
     * ordinary `needs`, and leaving it there makes `composeAtlas` emit the same
     * edge twice — which no test notices, because a duplicate prerequisite gates
     * exactly like a single one. None of the four entries names this node or
     * either of its parents, so there was nothing to collapse. Recorded because
     * afterwards there is no way to tell a deletion that was not needed from a
     * deletion that was missed.
     *
     * IT STRANDED NO `confusedWith`, and that is the one worth stating plainly,
     * because its loss is the only stranding here that would not have shown up
     * as a missing gate. `expandEdges` turns a node's `confusedWith` into an
     * `interferes_with`, interference constrains SELECTION rather than
     * introduction order, and dropping one leaves every suite green while the
     * scheduler is quietly freed to introduce two confusable concepts together.
     * This node declared none — checked on the node before it was deleted, not
     * inferred from the tests passing afterwards — so there was nothing to
     * rehome. `similarity` is still the only promotion out of this area that
     * stranded one.
     *
     * THE ROOT SET SUBSTITUTED, five to five in shape and seven to seven in
     * size, which is the fourth promotion's outcome and the fifth turnover of
     * this set. This node WAS a root — the ninth promotion made it one, as the
     * fan-out note above records — and `solid-geometry` takes its place, because
     * the departing node was the last of that node's prerequisites inside the
     * area and in fact its ONLY one. So the set reads `constructions`,
     * `distance-and-midpoint`, `dot-product-geometry`, `isometries-and-symmetry`,
     * `non-euclidean-geometry`, `plane-transformations` and `solid-geometry`.
     * Five of the seven members have now come and gone while the size has moved
     * eleven times; tests/atlas.mjs asserts it by name, and a `length === 7`
     * check would have passed this promotion while both of the claims that
     * changed went stale.
     *
     * THE EDGES POINTING INTO IT needed no attention, for the usual reason.
     * `solid-geometry` names it in its own `needs` and stayed here, and
     * `radians` names it from `trigonometry` — a different atlas area — and
     * stayed there. Both still own their edge and `composeAtlas` resolves them
     * across the file boundary. `radians` is the one worth noting: it is the
     * first edge out of this area to land on a node in `trigonometry`, which is
     * the area the merge block above considered and rejected as a merge partner,
     * so the boundary that decision drew is now load-bearing rather than
     * hypothetical.
     *
     * WHAT THE FIGURE TEST TOOK, AND IT TOOK HALF: this is the second node the
     * test has split, and the first where the node's own `is` line named both
     * halves. That line read "π as the ratio that is the same for every circle,
     * and area as a limit of inscribed polygons rather than a formula to
     * accept", and the subject's `covers` had written the whole node off on the
     * strength of the second clause. The first clause is figure-free and is one
     * of the strongest claims-about-claims in the subject — the quotient cannot
     * differ between two circles, because similarity multiplies its top and its
     * bottom by one factor — so it was taken. The second genuinely needs the
     * figure: a limit of inscribed polygons is a sequence of drawings with more
     * and more sides, and there is no part of it that survives being written
     * down. So πr² is used below and not derived, exactly as the congruence
     * criteria and the inscribed-angle theorem are, and ontology-geometry.ts
     * says so in the concept rather than leaving the omission to be noticed.
     *
     * That is the sixth time the test has found more than the `is` line
     * promised, and the warning attached to it in the block above the node list
     * still stands: a test that has never once rejected a node whole is a test
     * an author will find a way to pass.
     */
    /*
     * `solid-geometry` was here and is now authored in ontology-solids.ts, so
     * it had to leave — same rule, twelfth time in this area.
     *
     * IT WENT TO A SUBJECT THAT DID NOT EXIST, which is the third and last
     * thing a departure from here can do with a node, and the first time this
     * area has done it. Ten of the twelve became concepts of `plane-geometry`;
     * `dot-product-geometry` became one of `vectors-and-independence`, a
     * subject that already existed; and this one became the only concept of
     * `solid-measure`, a tenth ontology. So "which syllabus does a departure
     * feed" has now had all three answers, and the count of departures from
     * here is three numbers rather than one.
     *
     * The filing was argued before anything was written, which the block above
     * the node list said it should be. `plane-geometry`'s `covers` CLOSED with
     * the sentence "The solids are the rest and are still mapped only" — a
     * boundary the subject drew around itself, naming this exact node as
     * outside it — and its id says the same thing in one word. So the choice
     * was never between a widened subject and a tenth one; the subject had
     * already declined it in writing. ontology-solids.ts runs the test against
     * all nine and ontology-trigonometry.ts is the precedent for the test
     * itself.
     *
     * IT IS THE EXPENSIVE CASE AT ITS SIMPLEST, which is new here: one `needs`,
     * entirely rehomed. The node declared `needs: ['circle-measure']`, and
     * `circle-measure` is an authored concept of `plane-geometry` — a different
     * subject from the one this node joined — so the edge could not go into
     * `SOLID_MEASURE.edges`, because an ontology may only name concepts it
     * CONTAINS. Being authored elsewhere fails that test exactly as being
     * unwritten does. It is this area's sixth `links` entry, and the seventh
     * promotion's rule is what predicted it: the expense is not the length of
     * the `needs` list but how many of its endpoints live outside the ontology
     * the node is joining, and one out of one is the whole list.
     *
     * The entry GATES from the moment it exists, which only one of the five
     * before it did. Four of them point at nodes still on the map and gate
     * nothing yet; `right-triangle-trig -> dot-product-geometry` was the first
     * with material at both ends, and this is the second.
     *
     * IT STRANDED NO `confusedWith`. The node declared none — checked on the
     * node before it was deleted, not inferred from the tests passing
     * afterwards — so there was nothing to rehome. `expandEdges` turns a
     * `confusedWith` into an `interferes_with`, interference constrains
     * SELECTION rather than introduction order, and dropping one leaves every
     * suite green, so this is the one stranding an absence has to be looked for
     * rather than noticed. `similarity` is still the only promotion out of this
     * area that stranded one.
     *
     * THE ROOT SET SUBSTITUTED, six to six, which is the seventh turnover of
     * this set and the fourth time membership has moved without the size
     * moving. This node WAS a root — the tenth promotion made it one in
     * `circle-measure`'s place — and `three-dimensional-coordinates` takes its
     * place, because the departing node was the LAST of that node's
     * prerequisites inside the area. Its other one, `dot-product-geometry`,
     * left at the eleventh and did not promote it then for exactly this reason,
     * which tests/atlas.mjs asserted at the time. So the set reads
     * `constructions`, `distance-and-midpoint`, `isometries-and-symmetry`,
     * `non-euclidean-geometry`, `plane-transformations` and
     * `three-dimensional-coordinates`. The size has now read 1, 1, 4, 4, 3, 3,
     * 6, 5, 5, 7, 7, 6 and 6 across thirteen transitions, and a `length === 6`
     * check would have passed this promotion while two of the six claims it
     * makes went stale.
     *
     * THE EDGES POINTING INTO IT needed no attention, for the usual reason.
     * `three-dimensional-coordinates` names it in its own `needs` and stayed
     * here, and `volumes-of-revolution` names it from `integral-calculus` in
     * atlas-analysis.ts and stayed there. Both still own their edge and
     * `composeAtlas` resolves them across the file boundary.
     *
     * THE CHAIN THIS AREA HAS BEEN WALKING SINCE THE MERGE IS NOW SPENT, and
     * that is the thing a later author should read first. The merge was argued
     * for as replacing a floor with a depth, and the depth was
     * `circle-measure -> solid-geometry -> three-dimensional-coordinates`. All
     * three links are written or writable: one node is left owed on either
     * unfinished route and it is immediately available, both halves of its gate
     * being authored concepts now. Eleven nodes against a floor of five and one
     * concept owed, so the slack is five for a sixth time — still an identity
     * rather than a measurement, for the reason the budget block gives.
     *
     * WHAT THE FIGURE TEST TOOK, AND IT IS THE FIRST TIME IT TOOK LESS THAN
     * THE `is` LINE PROMISED. That line read "with the factor of a third and
     * the factor of four as the two facts worth proving", and only one of the
     * two could be delivered. The third is provable in sentences: a cube splits
     * into three congruent square pyramids, because a point of it belongs to
     * the pyramid over the face its largest coordinate faces and permuting the
     * coordinates carries any one onto any other, so the whole argument is
     * about which of three numbers is biggest and no drawing enters it. The
     * four is Archimedes', the proof compares the sphere with a cylinder slice
     * by slice, and there is no figure-free part of it to take — so 4πr² is
     * used and not derived, exactly as πr² is in `circle-measure`.
     *
     * Six times running the test found MORE in a node than its `is` line
     * promised, and the block above the node list warned that a test which has
     * never rejected anything is a test an author will find a way to pass. This
     * is the seventh reading and the first in the other direction. It did not
     * reject the node — the concept ships, and the third carries most of it —
     * but it refused one of the two things the node advertised, which is the
     * closest that warning has come to being answered. The subject says so in
     * its own `covers` rather than leaving the omission to be noticed, and
     * ontology-solids.ts records that the sphere costs exactly one borrowed
     * fact and not two, since V = (1/3) × S × r follows from the third.
     */
    /*
     * `isometries-and-symmetry` WAS HERE AND IS NOW A CONCEPT of
     * `plane-geometry`, in ontology-geometry.ts — the FIFTEENTH node to leave
     * this area and the twelfth of them to land in that subject. It had to
     * leave: `atlasProblems` rejects a map node whose id collides with an
     * authored concept, so a node of this id surviving here would shadow the
     * written material with a skeleton that has no knowledge points, and a
     * finished syllabus would silently read as unteachable.
     *
     * EIGHT NODES AFTER, against a stub floor of five, so three spare. The floor
     * decided nothing here and is not close to deciding anything — but the
     * sentence to read next to that is the one in `linear-algebra`'s block,
     * which is at TWO spare with two ready candidates. The floor is a
     * per-area fact and "nothing is frozen" is not a statement about the map.
     *
     * IT IS THE CHEAP CASE WITH ONE `needs`, the fourth time this area has given
     * one of those up and the first since `geometric-proof`. The node declared
     * `needs: ['congruence']` and nothing else; `congruence` has been a concept
     * of `plane-geometry` since the third promotion, so both ends of the
     * stranded edge are in one ontology and it is an ordinary `EDGES` entry
     * there. `links` below was neither added to nor relieved and still holds
     * exactly its eight.
     *
     * NOTHING WAS HANDED BACK, checked rather than assumed. No `links` entry of
     * this area, nor of any other, names `isometries-and-symmetry` at either
     * end — which matters because `links` resolves an endpoint whether it is a
     * node or a concept, so an entry left standing would have gone on working
     * and `composeAtlas` would carry the same edge twice with nothing red. The
     * thirteenth promotion is where that case is written up; this is the check
     * it created, run and come back negative.
     *
     * IT STRANDED NO `confusedWith`, and here that absence took looking for
     * rather than noting. `expandEdges` turns one into an `interferes_with`,
     * which constrains SELECTION rather than gating, so losing one leaves every
     * suite green while freeing the scheduler to introduce the two most
     * confusable concepts in a subject together. This node had a plausible
     * partner — `plane-transformations`, which was three entries below in this
     * list and is the same three motions written on coordinates, matching
     * "isometry" with its own pattern — and declared nothing. That partner was
     * itself promoted at the sixteenth, into the SAME subject, so the pair now
     * sits side by side in ontology-geometry.ts and the refusal is restated
     * there rather than reconsidered: being in one file makes the clash easy to
     * see and still supplies no observation of a learner confusing them.
     * So the absence is recorded, and declaring
     * one now would be inventing a claim about learner confusion during an
     * authoring pass, which is what the scope comments forbid for patterns and
     * the same argument covers. No `exercises` either, so no `encompasses` was
     * at stake and the filing was decided on content.
     *
     * THE ONE EDGE POINTING IN SURVIVED and it reaches further than any of this
     * area's departures except the solids'. `binary-operations` is a node of
     * `abstract-algebra`, names this concept in its OWN `needs`, and is
     * therefore still the owner of that edge, which `composeAtlas` resolves
     * across the file boundary untouched. What moved is the GATE at the far end:
     * the walk used to pass through an empty node and land on `congruence`, and
     * `isometries-and-symmetry` now has material of its own, so that is what a
     * learner has to demonstrate. A gate SUBSTITUTES — it does not lengthen.
     *
     * THE ROOT SET SHRANK, six to FIVE, and this time nothing arrived. The node
     * was a root itself, so it left; and it was the last in-area prerequisite of
     * NOTHING, because its only dependent anywhere in the atlas is in another
     * area. That is the simplest of the five shapes this set has produced — a
     * fan-out twice, three substitutions, a doubling and now a second plain
     * shrinkage — and it is still only sayable by membership. A reading of
     * "six became five" makes no claim about which five, and this set has moved
     * membership without moving size four times.
     *
     * IT WAS AN `armature.ts` ANCHOR, which is the fifth file a promotion can
     * touch and the only one outside this directory's dependency graph.
     * Druuvruke anchored on it, an anchor must be a node of its region's `area`,
     * and `armatureProblems` fails loudly — so the slot was refilled. The note
     * there says why the refill was `plane-transformations` and why the usual
     * rule could not pick it. That refill lasted one promotion: the sixteenth
     * authored it too, so the same slot has now turned over three times running
     * and all three departures went into `plane-geometry`. armature.ts carries
     * the current occupant and the reasoning for it.
     */

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
     * `plane-transformations` both named `cartesian-plane` in their own `needs`
     * and both stayed here at the time, so both survived as written and
     * `composeAtlas` resolved them across the file boundary. Both have since
     * been promoted themselves — the fourteenth and the sixteenth — and each
     * carried its own edge into `links` on the way out, which is where the two
     * rows running into `cartesian-plane` from this area's departures come
     * from. So "the far end owns it" protected these two edges only until the
     * near end stopped being a node.
     *
     * This area is down to nine nodes, which is clear of the five-node stub
     * threshold tests/atlas.mjs enforces. That threshold is the reason the plane
     * was promoted ahead of `real-number-line`, which is the node directly
     * beneath it and has both of ITS prerequisites authored already:
     * `number-and-arithmetic` has exactly five nodes left, so promoting out of
     * it trips the check and needs the area merge that file's own note calls
     * for. That is a map question, not an authoring one.
     */
    /*
     * `distance-and-midpoint` WAS HERE AND IS NOW A CONCEPT of `plane-geometry`,
     * in ontology-geometry.ts — the fourteenth node to leave this area. See the
     * block above the node list for why a promotion is a move out of this list
     * rather than a fill-in: `atlasProblems` rejects a map node whose id
     * collides with an authored concept.
     *
     * IT IS THE FIRST DEPARTURE FROM THIS AREA TO STRAND AN `encompasses`, and
     * that is the stranding no test in the build can catch. The node declared
     * `exercises: ['pythagoras']` as well as needing it, and `expandEdges`
     * turns `exercises` into an `encompasses` — the edge that makes credit
     * computable. Deleting the node deletes it, `encompasses` gates nothing, so
     * both suites stay green while a learner silently starts re-drilling
     * Pythagoras after every distance problem. It was re-declared in
     * `PLANE_GEOMETRY.edges`; the only reason it was looked for is that
     * ontology-geometry.ts predicted it when `pythagoras` itself was promoted,
     * calling the edge "half-live" and naming "the other endpoint's promotion"
     * as the remaining half.
     *
     * AND IT IS WHY THE CONCEPT DID NOT GO TO THE VECTORS. `cartesian-plane` is
     * authored in `vectors-and-independence`, this node's other `needs`, and on
     * subject matter that is plainly the better home for a coordinate concept.
     * But `links` carries `prerequisite` only, so an `encompasses` across two
     * files has nowhere to live: filing it there would have cost the edge. So
     * the prerequisite on the plane came back here as this area's eighth
     * `links` entry — see the note on it — and the other two edges went into
     * the geometry syllabus together.
     *
     * The departure fanned this area's root set out from five to SIX, one
     * leaving and TWO arriving, which is a shape no earlier promotion here
     * produced. `lines-in-the-plane` and `loci-and-regions` each named this
     * node and one concept outside the area, so this was the last in-area
     * prerequisite for both of them at once.
     */
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
    /*
     * `dot-product-geometry` WAS HERE AND IS NOW A CONCEPT of
     * `vectors-and-independence`, in ontology-vectors.ts — the eleventh node to
     * leave this area. See the block above the node list for why it had to go
     * rather than stay and point at the material.
     *
     * It is the first departure from this area whose material landed in a
     * subject that is not `plane-geometry`, which is worth a line here because
     * the edge arithmetic came out differently as a result: both of its `needs`
     * pointed at authored concepts, and they pointed at authored concepts in
     * TWO different files, so one became an ordinary `EDGES` entry over there
     * and one came back as this area's fifth `links` entry.
     */
    /*
     * `three-dimensional-coordinates` WAS HERE AND IS NOW A CONCEPT of
     * `vectors-and-independence`, in ontology-vectors.ts — the thirteenth node
     * to leave this area, and the second to land in that subject. See the block
     * above the node list for why a promotion is a move out of this list rather
     * than a fill-in: `atlasProblems` rejects a map node whose id collides with
     * an authored concept.
     *
     * THE FILING QUESTION THIS NODE CARRIED IS SPENT, and that is the first
     * thing to know, because the block above still poses it and this is the
     * answer. The question was `vectors-and-independence` against
     * `solid-measure`, and it went the way both this file and
     * ontology-solids.ts predicted: the node is analytic, that subject already
     * owned the plane and the dot product, and `solid-measure` is named for the
     * measure of a solid and would have had to be renamed. What that cost was a
     * rewrite of the receiving subject's `covers` AND of its NAME, which had
     * read "The plane, vectors and independence" — a name is a boundary too,
     * and this is the first promotion in the build to move one.
     *
     * ITS EDGES WENT THREE SEPARATE WAYS, which is the full catalogue in one
     * node and is why this area is the right place to learn the rule from.
     *
     *  - `dot-product-geometry → three-dimensional-coordinates` was on the
     *    node's own `needs` and both ends are now in ontology-vectors.ts, so it
     *    is an ordinary `EDGES` entry over there and cost this area nothing.
     *  - `solid-geometry → three-dimensional-coordinates` was the other
     *    `needs`, and `solid-geometry` is a concept of `solid-measure`. Two
     *    authored subjects, so neither ontology may name it — an ontology may
     *    only name concepts it CONTAINS — and it is this area's seventh `links`
     *    entry. It GATES from the moment it exists, which only three of the
     *    seven do.
     *  - AND ONE WENT THE OTHER WAY, WHICH IS THE CASE NO TEST CATCHES.
     *    `three-dimensional-coordinates → vectors-and-spans` was a `links`
     *    entry of `linear-algebra`, filed there because that area owned neither
     *    end. This promotion put BOTH ends in one ontology, so the edge became
     *    an ordinary prerequisite there and the `links` entry was DELETED.
     *    Leaving it would have failed nothing: `links` never cared whether an
     *    end was a node or a concept, so it would have gone on resolving and
     *    the composed graph would carry that edge twice, which `composeAtlas`
     *    does not notice and no suite checks. A promotion can hand an edge
     *    back, and the only way to find out is to read the far end's file.
     *
     * `three-dimensional-coordinates → functions-of-several-variables` is
     * declared on that node's own `needs` in atlas-analysis.ts, at the far end,
     * so it survived untouched for the usual reason.
     *
     * IT STRANDED NO `confusedWith` — checked on the node before it was
     * deleted, not inferred from the suites passing afterwards. `expandEdges`
     * turns one into an `interferes_with`, interference constrains SELECTION
     * rather than introduction order, and dropping one leaves every suite
     * green, so an absence here has to be looked for. `similarity` is still the
     * only promotion out of this area that stranded one.
     *
     * THE ROOT SET SHRANK, SIX TO FIVE, and it is the first promotion out of
     * this area in four that did not substitute. A departing node is replaced
     * in the root set when it was the LAST of some in-area dependent's
     * prerequisites, and this node has no in-area dependents at all — both of
     * them, `vectors-and-spans` and `functions-of-several-variables`, are
     * elsewhere. So the set is now `constructions`, `distance-and-midpoint`,
     * `isometries-and-symmetry`, `non-euclidean-geometry` and
     * `plane-transformations`. The size has read 1, 1, 4, 4, 3, 3, 6, 5, 5, 7,
     * 7, 6, 6 and 5 across fourteen transitions, which is why tests/atlas.mjs
     * asserts this set by NAMED MEMBERSHIP: a `length === 5` check would have
     * passed the seventh and eighth transitions while every claim it made went
     * stale.
     *
     * AND THE AREA NOW OWES NOTHING ON EITHER UNFINISHED ROUTE, which is the
     * line to read before looking here for the next candidate. Ten nodes
     * against a floor of five and zero concepts owed, so the slack identity the
     * block above tracks has finally broken — it held at five for six
     * promotions because a route concept being written subtracts one from each
     * side, and with the owed count at zero the difference is just the node
     * count. The row this area had in tests/atlas.mjs's route table is deleted
     * rather than emptied, the way `trigonometry`'s was; `linear-algebra` is
     * the only row left and `gaussian-elimination` its only entry.
     *
     * THAT ROW IS GONE TOO AND THE TABLE IS EMPTY. `gaussian-elimination` was
     * written into `expressions-and-equations` one promotion later, which took
     * every journey in the build to zero unwritten steps. So the route table
     * has stopped being a worklist, and the heuristic this area's comments were
     * built around — find the next route concept whose prerequisites are all
     * written — has nothing left to return. What the table measured ran out;
     * it did not change.
     */
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
    /*
     * `plane-transformations` STOOD HERE AND WAS AUTHORED AT THE SIXTEENTH
     * PROMOTION, into `plane-geometry` beside the isometries it was the
     * coordinate half of.
     *
     * Its `is` line had already been rewritten once, by the fifteenth
     * promotion, to give up the invariance claim to
     * `isometries-and-symmetry` and keep only the coordinates. That turned out
     * to be the shape of the syllabus rather than a concession: the authored
     * concept tells a quarter turn from a reflection by the SLOTS each number
     * lands in, computes distance preservation instead of assuming it, and
     * handles a centre that is not the origin. None of the three is a claim
     * about a drawing, which is what made this node promotable at all when
     * three of its neighbours here still are not.
     *
     * It was chosen on rulability and not on structure. It has ZERO dependents
     * anywhere in the atlas, so it is the first promotion out of this area that
     * unblocked nothing — every journey has read zero unwritten since the
     * fourteenth, so there is no route to advance and the live tie-break is
     * whether an honest task can be set. `constructions` and
     * `non-euclidean-geometry` are both ready here and were both passed over
     * for that reason: what can be built with two tools is a procedure carried
     * out on paper, and dropping the parallel postulate is a decision about
     * axioms. Neither has an answer that is a number.
     *
     * ITS STRANDED EDGES SPLIT, so this is the expensive case:
     * `congruence` is a concept of `plane-geometry` and that edge is internal
     * there, while `cartesian-plane` is a concept of `vectors-and-independence`
     * and an ontology may only name concepts it CONTAINS — so that one is the
     * ninth entry in `links` below.
     *
     * IT STRANDED NO `confusedWith` and declared no `exercises`, both checked
     * on the node before it was deleted rather than inferred from the suites
     * passing afterwards. The first is the stranding no test catches:
     * `expandEdges` turns a `confusedWith` into an `interferes_with`,
     * interference constrains SELECTION rather than introduction, and dropping
     * one leaves every suite green. There was a real candidate for one in the
     * other direction — `isometries-and-symmetry` is these same maps done
     * synthetically — and ontology-geometry.ts records twice over why neither
     * concept declares it: nobody has observed the confusion, and inventing one
     * during an authoring pass is the same move the scope comments forbid for
     * patterns. `similarity` is still the only promotion out of this area that
     * stranded one.
     *
     * AND IT EMPTIED AN ARMATURE SLOT. This node was one of Druuvruke's three
     * anchors, and `armatureProblems` refuses an anchor that is not a node of
     * its region's `area` — so the slot had to be refilled rather than left.
     * That is the THIRD consecutive turnover of the same slot and the
     * reasoning is in armature.ts, where it belongs.
     */
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
   * FIVE ENTRIES NOW. FOUR OF THEM ARE THE MERGE WITH `COORDINATE_GEOMETRY`
   * AND THE PROMOTIONS BEFORE IT; THE FIFTH IS THE ELEVENTH PROMOTION AND IS
   * DESCRIBED IN ITS OWN BLOCK BELOW.
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
   *
   * THE ELEVENTH PROMOTION ADDED THE FIFTH, AND IT IS THE FIRST ENTRY HERE
   * WHOSE TWO ENDS ARE BOTH AUTHORED AND IN DIFFERENT SUBJECTS BY DESIGN.
   *
   * `dot-product-geometry` declared two `needs` and both pointed at written
   * material, which no earlier promotion out of this area managed — the four
   * expensive cases above each had one endpoint that was either a map node or
   * authored in `arithmetic-foundations` by accident of history. Here
   * `plane-vectors` is a concept of `vectors-and-independence`, which is the
   * subject the node itself joined, so that edge is internal over there and is
   * declared in `VECTORS_AND_INDEPENDENCE.edges`. `right-triangle-trig` is a
   * concept of `triangle-trigonometry`, a third subject, and an ontology may
   * only name concepts it CONTAINS — so it cannot go into the vectors edges
   * either, and this is its only home.
   *
   * That makes the entry below the clearest statement of the rule this file has
   * repeated five times: `links` is not "where edges into unwritten nodes go",
   * and it is not "where edges into other people's subjects go". It is where
   * any edge goes whose two endpoints end up in different FILES. Both of these
   * endpoints are fully authored and the edge still has nowhere else to live.
   *
   * It gates immediately, like the `roots-and-irrationals` entry and unlike the
   * `ratio-and-rate` one: `right-triangle-trig` is three knowledge points and
   * six tasks, so `gatingPrerequisitesOf('dot-product-geometry')` names it and
   * a learner has to demonstrate the ratios first. Nothing about that changed
   * at the promotion — the same edge gated the same way while the dot product
   * was still a node — which is the point of rehoming it rather than noticing
   * later that it had gone.
   *
   * THE TWELFTH PROMOTION ADDED THE SIXTH, AND IT IS THE EXPENSIVE CASE WITH
   * NOTHING LEFT OVER.
   *
   * `solid-geometry` declared one `needs` and it pointed outside the ontology
   * the node joined, so the entry below is not part of the node's stranded
   * edges — it is all of them. Every expensive case before it had at least one
   * edge that stayed in a syllabus, which made the rule look like a split; this
   * one has nothing to split. The rule is unchanged and is now stated at its
   * limit: what decides where a stranded edge goes is which FILE its other
   * endpoint ended up in, and here the answer was "not this one" for the whole
   * list.
   *
   * `circle-measure` is a concept of `plane-geometry` and the node became the
   * only concept of `solid-measure`, a tenth subject. An ontology may name only
   * concepts it CONTAINS, so the edge cannot be declared in either syllabus,
   * and this is its only home.
   *
   * It gates immediately, which is the second entry here to do so:
   * `circle-measure` is three knowledge points and six tasks, so
   * `gatingPrerequisitesOf('solid-geometry')` names it and a learner has to
   * demonstrate circular measure before meeting a cylinder. Four of the six
   * entries still point at nodes with no material and gate nothing yet, which
   * is why this one is worth saying out loud: the edge did the same gating
   * before the promotion as after, and the whole risk of a promotion is that an
   * edge doing silent work gets dropped while nothing goes red.
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
    {
      from: 'right-triangle-trig',
      to: 'dot-product-geometry',
      because:
        'The product is worth having because a·b = |a||b| cos θ, and that identity says nothing ' +
        'to somebody for whom cos θ is a button. The ratios are where a quotient of two sides ' +
        'becomes a function of an angle — and they are also where the derivation comes from, ' +
        'since the part of b lying along a is adjacent over hypotenuse and nothing else.',
    },
    {
      from: 'circle-measure',
      to: 'solid-geometry',
      because:
        'A cylinder, a cone and a sphere are the three solids the measure cannot avoid, and ' +
        'every measure of all three is a multiple of π: the cylinder carries πr² along its ' +
        'length and 2πr round it, and the sphere\'s two formulas are 4πr² and (4/3)πr³. So a ' +
        'learner who has not met π as the quotient that is the same for every circle has no ' +
        'reading of any of those answers, and one who cannot keep a circumference exact cannot ' +
        'keep a volume exact either — the roundings compound through one more multiplication ' +
        'here than they did in the plane.',
    },
    {
      /*
       * The seventh, and the thirteenth promotion's. Both ends are authored and
       * in DIFFERENT subjects — `solid-geometry` in `solid-measure`,
       * `three-dimensional-coordinates` in `vectors-and-independence` — so
       * neither ontology could take it, and it is filed here because this area
       * owned the departing node rather than because it owns either end.
       *
       * It is the third entry in this list that gates anything today. The
       * other two are `right-triangle-trig → dot-product-geometry` and
       * `circle-measure → solid-geometry`, which is this edge's own other half:
       * the two of them together are the chain the merge was argued for,
       * `circle-measure -> solid-geometry -> three-dimensional-coordinates`,
       * and it now exists end to end as two `links` entries of this area with
       * authored material at all three points.
       */
      from: 'solid-geometry',
      to: 'three-dimensional-coordinates',
      because:
        'The third coordinate is what a solid has and a figure in the plane does not, so the ' +
        'first reason to want one is a solid to measure — and the distance in space is got by ' +
        'standing one right triangle on another, which is the prism\'s own construction read as ' +
        'a length: a base figure carried along a perpendicular. A learner who has not yet taken ' +
        'a cross-section along a length has no picture for the axis the third number is ' +
        'measured on, and the cross product\'s whole content is that TWO directions pick out a ' +
        'plane and a third stands off it.',
    },
    {
      /*
       * The eighth, and the fourteenth promotion's — and it is the first entry
       * here whose other half could NOT have become a `links` entry, which is
       * the thing this list cannot express and therefore has to be told about.
       *
       * `distance-and-midpoint` declared `['cartesian-plane', 'pythagoras']`
       * plus `exercises: ['pythagoras']`. The prerequisite on `pythagoras` and
       * the `encompasses` both went into `PLANE_GEOMETRY.edges`, because that is
       * the ontology the node joined. This one could not follow:
       * `cartesian-plane` is a concept of `vectors-and-independence`, and an
       * ontology may only name concepts it CONTAINS. Same route as the seventh
       * entry, both ends authored and in two subjects neither of which is this
       * area's.
       *
       * WHY THE CONCEPT WENT TO `plane-geometry` AND NOT TO THE VECTORS, which
       * is the question this entry otherwise invites: `expandEdges` hard-codes
       * `kind: 'prerequisite'` on every row of this list, so an `encompasses`
       * whose endpoints end up in two files is expressible in no file at all.
       * Filing the concept with `cartesian-plane` would have forced the credit
       * edge to `pythagoras` to be dropped — and dropped silently, since
       * `encompasses` gates nothing and no assertion in either suite reads it.
       * So the filing was decided by this list's one-kind limitation rather
       * than by subject matter, and the cost is this row. ontology-geometry.ts
       * carries the full argument.
       *
       * It gates, like the seventh and unlike the first two: `cartesian-plane`
       * is three knowledge points, so a learner really must demonstrate the
       * plane before the distance formula is introduced.
       */
      from: 'cartesian-plane',
      to: 'distance-and-midpoint',
      because:
        'The formula is about coordinates before it is about distance: its two legs are a ' +
        'difference of x-coordinates and a difference of y-coordinates, so a learner for whom a ' +
        'point is not yet an ordered pair of signed numbers has nothing to subtract. The right ' +
        'angle it leans on is the plane\'s own — the legs are perpendicular because the axes ' +
        'are, which is a fact about the coordinate system and not about the figure.',
    },
    {
      /*
       * NINE NOW, AND THE SIXTEENTH PROMOTION'S ENTRY IS THE SECOND ROW RUNNING
       * INTO `cartesian-plane` FROM A NODE THIS AREA AUTHORED — which is worth
       * separating from the row above it, because the two look identical and
       * were filed for different reasons.
       *
       * `distance-and-midpoint` could have been filed with the vectors, and
       * the only thing that stopped it was that doing so would have dropped an
       * `encompasses` this list cannot carry. There is no such forcing here.
       * `plane-transformations` declared `['cartesian-plane', 'congruence']`
       * and no `exercises`, so both candidate homes cost exactly one row of
       * this list — the vectors would have sent `congruence` here and
       * `plane-geometry` sends the plane here — and the filing was decided on
       * subject matter instead. It went to `plane-geometry` because the
       * concept it is the other half of is there: the material tells a quarter
       * turn from a reflection using the correspondence `congruence` supplies,
       * and checks a composition against `isometries-and-symmetry`'s doubling
       * rule. Filing it with the vectors would have put the two halves of one
       * topic in two files to save nothing.
       *
       * So the rule this list has now demonstrated nine times has a sharper
       * statement than "where the other endpoint lives". Where a stranded edge
       * GOES is decided by which file its far endpoint is in, always and with
       * no exceptions. Which home a CONCEPT takes is decided by subject matter
       * except when a kind this list cannot carry forces it, which has happened
       * once — and the row above is that once.
       *
       * It gates, like the fifth through eighth: `cartesian-plane` has three
       * knowledge points, so a learner must demonstrate the plane before a
       * transformation written on coordinates is introduced.
       */
      from: 'cartesian-plane',
      to: 'plane-transformations',
      because:
        'A transformation here IS a rule on an ordered pair — (x, y) to (−y, x) for a quarter ' +
        'turn, to (−x, y) for a reflection — so a learner for whom a point is not yet two ' +
        'signed numbers in a fixed order has nothing for the rule to act on. The whole content ' +
        'of the first knowledge point is that a reflection and a quarter turn are told apart by ' +
        'WHICH SLOT each number lands in rather than by the sign either produces, and a slot is ' +
        'exactly what the plane contributes: without an agreed first and second coordinate there ' +
        'is no swap to notice. The quadrants matter too, since three of the four need a ' +
        'coordinate to be allowed below zero and every image computed here lands in one.',
    },
  ],
  /*
   * NINE NODES HAVE BEEN AUTHORED OUT OF THIS AREA, declared here although this
   * area is NOT at the floor — it has seven nodes and two of headroom.
   *
   * The field's doc says it is declared where it is load-bearing, and this is
   * the one place that is declared slightly early on purpose: at two of
   * headroom and with five route concepts still to release, this is the next
   * area that will arrive where `algebra-foundations` is, and the list is only
   * recoverable by reading nine separate comments in this file. Doing that
   * archaeology once and writing it down beats doing it again under pressure.
   * It changes no behaviour today, since the floor only consults this when the
   * node count alone would fail.
   *
   * `three-dimensional-coordinates` is in the list and is the one id not
   * explained by a "`X` was here" comment in this area's own nodes — it is
   * explained in atlas-structures.ts, in the `links` block that used to carry
   * its edge, because the thirteenth promotion authored it into the same
   * subject as the far end of that edge. It was a node of THIS area.
   */
  departed: [
    'geometric-proof',
    'pythagoras',
    'quadrilaterals-and-polygons',
    'area-and-perimeter',
    'circles',
    'circle-measure',
    'solid-geometry',
    'cartesian-plane',
    'three-dimensional-coordinates',
  ],
}

const TRIGONOMETRY: MapArea = {
  id: 'trigonometry',
  name: 'Trigonometry',
  covers:
    'The circular functions from both directions: ratios in a right triangle, and coordinates on ' +
    'the unit circle. Includes identities, the inverse functions, the oblique-triangle laws and ' +
    'polar coordinates. The right-triangle ratios and the oblique-triangle laws have BOTH left ' +
    'this area and are written — see `triangle-trigonometry` in ontology-trigonometry.ts; what ' +
    'is still mapped here is everything circular, which is the larger half and is now the whole ' +
    'of what remains. Nothing left in this area is about a triangle.',
  /*
   * TWO NODES HAVE LEFT THIS AREA, AND BOTH WENT INTO THE SAME SUBJECT.
   *
   * `right-triangle-trig` was promoted into authored material as a ninth
   * subject ontology, `triangle-trigonometry`, and `law-of-sines-cosines`
   * followed it into that same subject as its second concept. Promoting a node
   * DELETES it from here, because `atlasProblems` rejects a map node whose id
   * collides with an authored concept — the two would be one id with two
   * different fidelities and two different caveats. So a promotion is a move
   * out of this list and not a fill-in, and this comment is what stops the next
   * reader looking for a node the `covers` sentence above still half-describes.
   *
   * THE SECOND DEPARTURE WAS RESERVED BY THE FIRST, which is the part a later
   * reader should take from this area rather than from the subject file. When
   * `right-triangle-trig` left, ontology-trigonometry.ts argued for a brand new
   * subject holding one concept, and the argument it gave for that being
   * acceptable was explicitly that this node was reachable: "`law-of-sines-
   * cosines` names this concept and `triangle-basics` as its only needs, so it
   * is the natural second member". That claim has now been collected. A
   * one-concept subject justified by a named reachable successor is a promise
   * about THIS list, and it has been kept.
   *
   * WHY THIS AREA GAVE UP A NODE AT ALL, since the question has a short
   * answer and the file's other areas have a long one: it was the only
   * promotion left anywhere on the two unfinished journeys that unblocks
   * something. `dot-product-geometry` in `euclidean-geometry` named this node
   * and `plane-vectors`, and the second was already authored — so this one
   * node stood between both of those journeys and the dot product, and the dot
   * product stands between them and the three dimensions. ontology-
   * trigonometry.ts's header argues it in full.
   *
   * THE ROOT SET WENT ONE → TWO → ONE, AND THE SAME AREA PRODUCED BOTH MOVES.
   * This is the clearest case in the build of why tests/atlas.mjs asserts a
   * root set by NAMED MEMBERSHIP and never by size.
   *
   * Inside `areaOntology` an edge reaching outside the area is filtered away,
   * so this area's roots are just the nodes with no need INSIDE it. Before any
   * promotion that was `right-triangle-trig` alone, every other node resting on
   * something here. Removing it promoted both of its in-area dependents,
   * `unit-circle` and `law-of-sines-cosines`, to roots — growth, and the
   * opposite of what "an area gave up a node" sounds like. Removing the second
   * of those two has now taken the set back to `unit-circle` alone, because
   * NOTHING in this area ever named `law-of-sines-cosines` as a need. A
   * departing root with no in-area dependents simply leaves the set; a
   * departing root with two SUBSTITUTES two members for one.
   *
   * So the three readings an author might generalise from — promoting grows the
   * root set, promoting shrinks it, promoting swaps members at constant size —
   * are all wrong as rules, and this one area has now exhibited two of the
   * three. What decides it is the departing node's in-area dependent count, and
   * the only safe move is to compute the set before and after.
   *
   * THE AREA IS AT ELEVEN NODES AGAINST A STUB FLOOR OF FIVE, so the floor that
   * decided several earlier promotions had no part in either of these. Six more
   * could leave before `AREAS.filter(a => a.nodes.length < 5)` has anything to
   * say.
   *
   * AND NOW NOTHING HERE IS READY, WHICH IS A HARDER STOP THAN THE FLOOR. The
   * constraint was always dependency depth rather than headroom: `unit-circle`
   * needs `circles-analytic`, which is still a map node and lives in
   * `euclidean-geometry`, so `unit-circle` is not ready — and it is the only
   * root. Every other node in this area sits above it. So this area cannot
   * author its way upward on its own at all,
   * and `law-of-sines-cosines` was the last node in it whose prerequisites were
   * both written. Whoever comes here next for a promotion should leave again
   * and take `circles-analytic` first; authoring it is what reopens this area,
   * and nothing inside the area can.
   *
   * THE THREE `links` BELOW ARE THE DEPARTING NODES' OWN `needs`, REHOMED. An
   * edge is owned by the node that DECLARES it, so promoting a node strands
   * exactly the edges written ON it and leaves every edge pointing INTO it
   * alone — `composeAtlas` resolves those against the authored concept with no
   * edit here. The first two came from `right-triangle-trig` and the third from
   * `law-of-sines-cosines`. None of them could go into
   * `TRIANGLE_TRIGONOMETRY.edges`: an authored ontology may only name concepts
   * it CONTAINS, and `similarity`, `pythagoras` and `triangle-basics` are all
   * concepts of `plane-geometry`. So `links` is their only home, and it is
   * declared HERE — in the area that owned the departing node — rather than in
   * `EUCLIDEAN_GEOMETRY`, which holds the other endpoints. The edges were these
   * nodes' own `needs` and these nodes lived here, so this is where the
   * dependency was decided and this is where it keeps being asserted. Filing
   * them under the geometry area would read as geometry making a claim about
   * trigonometry.
   *
   * THE SECOND PROMOTION SPLIT ITS STRANDED EDGES, WHICH IS THE CLEANEST
   * STATEMENT OF THE RULE ANYWHERE IN THE BUILD. `law-of-sines-cosines`
   * declared two `needs` and they went to different places:
   *
   *     right-triangle-trig   same subject as the promoted node
   *                             -> TRIANGLE_TRIGONOMETRY.edges
   *     triangle-basics       a concept of plane-geometry
   *                             -> the third links entry below
   *
   * So where a stranded edge goes is decided by the FAR endpoint's SUBJECT —
   * not by its area, not by whether it is authored, and not by which node
   * declared it. `triangle-basics` is authored, teachable and practisable, and
   * it still cannot be named in the receiving ontology. One promotion produced
   * both outcomes at once, so neither can be read as the general case.
   *
   * AND NOTHING POINTED INTO THE SECOND NODE AT ALL, which is why that
   * promotion rehomed one edge and gained nothing. No node in this area and no
   * concept anywhere named `law-of-sines-cosines` as a need, so it gated
   * nothing while it was mapped and gates nothing now that it is written. Two
   * promotions running have had that shape. The sentence this comment used to
   * carry — that `unit-circle` and `law-of-sines-cosines` both still declared
   * their need of the ratios — is now true of `unit-circle` alone, the other
   * having become an ordinary internal edge of the subject they both left for.
   *
   * BOTH OF THEM GATE, WHICH IS NOT THE USUAL CASE FOR A NEW `links` ENTRY.
   * `EUCLIDEAN_GEOMETRY`'s first link pointed at an unwritten node and
   * therefore gated nothing for several promotions. These two point at
   * authored concepts with material, so `gatingPrerequisitesOf` on the ratios
   * names both of them from the moment this file is saved: a learner has to
   * demonstrate similarity and Pythagoras before being shown a sine, across a
   * subject boundary.
   *
   * `right-triangle-trig` carried no `confusedWith` and no `exercises`, so
   * nothing else was stranded. That is worth stating rather than leaving to be
   * inferred, because `expandEdges` turns a `confusedWith` into an
   * `interferes_with` edge and deleting a node that had one would delete that
   * edge with every suite still green — interference constrains selection
   * rather than gating, so no test is watching.
   */
  links: [
    {
      from: 'similarity',
      to: 'right-triangle-trig',
      because:
        'The whole claim that a side ratio is a function of the angle IS the AA criterion: ' +
        'naming one acute angle of a right triangle leaves no angle free, so any two such ' +
        'triangles are similar, so they share every quotient taken between two of their own ' +
        'sides. A learner who cannot yet say why two triangles are similar has no reason why ' +
        'sin A should be one number rather than one per triangle.',
    },
    {
      from: 'pythagoras',
      to: 'right-triangle-trig',
      because:
        'Two of the three sides are given and the third is wanted in almost every problem here, ' +
        'and the relation between the three is Pythagoras. It also supplies the bound: ' +
        'c² = a² + b² with b positive forces c > a, which is why a sine of an acute angle is ' +
        'always less than 1 and an impossible one can be refused before any arithmetic. Without ' +
        'it the quotients are three unrelated fractions.',
    },
    {
      from: 'triangle-basics',
      to: 'law-of-sines-cosines',
      because:
        'Both laws are proved by cutting an oblique triangle with one perpendicular and reading ' +
        'a ratio in each half, so the proof assumes that the three angles total 180° and that ' +
        'the longer side faces the larger angle — which is what this node is. The ambiguous ' +
        'case needs more of it than that: deciding whether a root of the quadratic is a real ' +
        'triangle is the triangle inequality, and the two answers differ by which side faces ' +
        'the wider angle. A learner without those facts can compute both roots and has no way ' +
        'to say that either describes a figure.',
    },
  ],
  nodes: [
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
