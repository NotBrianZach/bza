/**
 * Analysis: the limit, and everything that rests on it.
 *
 * Eight areas. The ordering claim worth stating is that `real-analysis` comes
 * AFTER the calculus it re-proves rather than before it. That is not how a
 * logical development would run, and it is how learning runs: ε-δ is a standard
 * of argument applied to facts the reader already believes, and a reader with no
 * prior belief about the derivative has nothing for the rigour to be rigorous
 * about.
 *
 * `integral-calculus` is where this file meets the authored material most
 * directly — integration by partial fractions needs
 * `partial-fractions-linear`, which has real problems behind it, so that one
 * mapped node genuinely opens when the syllabus is mastered.
 *
 * `sequences-and-series` is now the second such place, and it meets it from
 * the other direction: this file's own first node was PROMOTED out of it into
 * `functions-and-inverses`, so the three nodes that rested on `sequences` rest
 * on real material rather than on a skeleton. The note where it sat records
 * what that cost and what it did not. The distinction worth keeping is that
 * the `integral-calculus` case is a mapped node pointing at a syllabus
 * somebody else wrote, and this one is a node of this file having BECOME one.
 *
 * `sigma-notation` then followed it out of the same area and into the same
 * subject, one step above it, and `riemann-sums` in `integral-calculus` is one
 * of the five nodes left resting on it. So the two directions have met: a node
 * of this file now points at a syllabus that is partly made of nodes of this
 * file.
 */

import type { MapArea } from './atlas'

const SEQUENCES_AND_SERIES: MapArea = {
  id: 'sequences-and-series',
  name: 'Sequences and series',
  covers:
    'Lists indexed by the naturals, their sums, and when an infinite sum means anything. ' +
    'Three things have left for the functions-and-inverses syllabus, where they have problems ' +
    'written for them, and this area points at them through `needs` rather than restating ' +
    'them: what a sequence IS — a function whose input is a position, given by a formula or by ' +
    'a recurrence — the notation for adding one up, which terms its limits name and the two ' +
    'rearrangements that make such a sum manipulable, the arithmetic family, whose term at ' +
    'a position, position of a term and total by pairing the ends are all plain numbers, and ' +
    'proof by induction, whose step turns out to be a factorisation and whose base case is two ' +
    'numbers compared. What stayed is what needs a limit rather than a reading: the geometric ' +
    'family with its constant ratio and its sum to infinity, and when an infinite sum totals ' +
    'anything. Convergence is stated ' +
    'and tested here; it is proved in real analysis.',
  /**
   * THE FIRST `links` ENTRY THIS AREA HAS EVER CARRIED, added by the fourth
   * departure and predicted by name in three of the notes below.
   *
   * `geometric-proof → mathematical-induction` has both ends authored, in two
   * DIFFERENT subjects — the proof in `plane-geometry`, the induction in
   * `functions-and-inverses` — so neither ontology may name it: an ontology
   * may only name concepts it CONTAINS, and `ontologyProblems` reports an
   * unknown endpoint otherwise. This is the only place it can live, and the
   * area that owned the DEPARTING node is where such an entry is filed, not
   * the one holding the far end.
   *
   * The claim is the map's rather than the receiving syllabus's: a learner
   * should have met what a proof IS — a chain of cited facts, and the
   * asymmetry between refuting a universal claim and establishing one —
   * before being shown a proof technique. ontology-geometry.ts argues the same
   * boundary from its end, and says induction is deliberately left out of
   * `geometric-proof` because the map places it above that node rather than
   * inside it.
   *
   * NO `encompasses` RUNS BACK ALONG IT, and `links` could not carry one
   * anyway — `expandEdges` hard-codes `kind: 'prerequisite'` for every entry
   * here. That is the right answer on the merits too: none of the six tasks on
   * the induction cites a geometric fact or writes a two-column chain, so
   * practising it exercises no part of deductive proof and a credit edge would
   * stop that concept coming due when it had genuinely gone cold.
   */
  links: [
    {
      from: 'geometric-proof',
      to: 'mathematical-induction',
      because:
        'Both ends are authored concepts of two different subjects, so neither ontology may '
        + 'name this edge and it can only live here. The claim is the map\'s: what a proof is, '
        + 'and that one case refutes a universal claim while no number of cases establishes '
        + 'one, comes before a technique for establishing one. Both ends being written means '
        + 'this edge GATES from the moment it exists, unlike a links entry pointing at an '
        + 'unwritten node.',
    },
  ],
  nodes: [
    /**
     * `sequences` LEFT THIS AREA WHEN IT WAS AUTHORED, AND HAD TO.
     *
     * It is a concept of `functions-and-inverses` now, in ontology-functions.ts.
     * The rule that forces the deletion is structural rather than editorial:
     * `atlasProblems` REJECTS a map node whose id collides with an authored
     * concept, because `composeAtlas` concatenates the skeleton and the
     * syllabi into one `MATHEMATICS` and two concepts with one id is a graph
     * whose edges have no determinate endpoints. So promoting a concept is a
     * MOVE and never a fill-in, and a run that wrote the material without
     * deleting the node here would fail loudly, which is the good case.
     *
     * THIS IS THE FIRST DEPARTURE FROM THIS FILE, so the whole rule is written
     * out once rather than cross-referenced. atlas-foundations.ts has the long
     * version at NUMBER_AND_ARITHMETIC; nothing below contradicts it.
     *
     * WHERE ITS ONE STRANDED EDGE WENT. An edge is owned by the node that
     * DECLARES it, so deleting this node deleted exactly the edges written ON
     * it, and it declared one: `needs: ['function-concept']`. That went to
     * `FUNCTIONS_AND_INVERSES.edges`, which it was allowed to do for the single
     * reason that decides every such case — both endpoints are concepts of
     * that one ontology, and an ontology may only name concepts it CONTAINS.
     * This area's `links` therefore stayed EMPTY, which is the cheap shape
     * atlas-foundations.ts describes: it is a property of where a departing
     * node's prerequisites live, and not of this area being tidy. The first
     * promotion out of here whose node names a prerequisite in another file
     * will cost `links` an entry however well authored that endpoint is.
     *
     * IT STRANDED NO `confusedWith`, AND THAT IS WORTH ITS OWN LINE because it
     * is the stranding no suite catches. `expandEdges` turns a node's
     * `confusedWith` into an `interferes_with` edge, so deleting a node that
     * carries one DELETES that edge — and interference constrains SELECTION
     * rather than gating, so every test stays green while the scheduler is
     * quietly freed to introduce the two most confusable concepts in the
     * subject together. This node declared none, and neither did
     * `sigma-notation` when it followed. The one in this area is on
     * `geometric-sequences`, pointing at `arithmetic-sequences`.
     *
     * THIS PARAGRAPH THEN TOLD THE NEXT AUTHOR THE WRONG THING, and the third
     * departure is the correction, so the rule is restated here rather than
     * left to be found two notes down. It said that whoever promoted EITHER of
     * those two must re-declare the edge in the receiving ontology's `EDGES`
     * with its `rationale` "or it is gone without a sound". That is true of
     * `geometric-sequences` only, because `expandEdges` walks an area's OWN
     * nodes and `geometric-sequences` is the node that DECLARES this edge.
     * Promoting `arithmetic-sequences` — the far end — stranded nothing: the
     * declaring node stayed, so the area still emits the edge and
     * `composeAtlas` resolves it with an authored concept at one end. An edge
     * is owned by the node that declares it, which is the rule
     * atlas-foundations.ts had to correct itself over for `needs` and which is
     * no different for a `confusedWith`.
     *
     * Worse, obeying it at that end was impossible in both directions — the
     * ontology may name only concepts it contains, and `links` hard-codes
     * `kind: 'prerequisite'` — so the full account is in the note where that
     * node sat. What survives of the warning is this: promoting
     * `geometric-sequences` really does delete this edge in silence, because
     * interference constrains SELECTION rather than gating and every suite
     * stays green while the scheduler is freed to introduce the two most
     * confusable concepts in the area together.
     *
     * NOR DID IT HAND AN EDGE BACK. The opposite failure is a `links` entry
     * that existed because the area owned NEITHER end, whose two ends both
     * finish inside one ontology after a promotion: it has stopped being a
     * cross-file edge and must be DELETED, or `composeAtlas` emits the same
     * prerequisite twice, and a duplicate gates exactly like a single one so
     * nothing reports it. This area's `links` was empty, so there was nothing
     * to hand back.
     *
     * THE THREE EDGES POINTING INTO IT WERE LEFT ALONE, as the rule says.
     * `arithmetic-sequences`, `geometric-sequences` and `sigma-notation` each
     * named it in their own `needs` and all three stayed at the time, so all three still
     * owned their edges and `composeAtlas` resolved them across the file
     * boundary. What changed without a line being edited in any of them is
     * that those edges now GATE: they used to point at a node with no
     * material, which `gatingPrerequisitesOf` looks straight through. All
     * three are one demonstration further from a cold account than they were,
     * which is authoring tightening the gate rather than widening it, and is
     * checked by name in tests/atlas.mjs because it is invisible from their
     * own definitions. (One of the three, `sigma-notation`, has since been
     * authored itself — see the note further down this list. The edge did not
     * move when that happened: it is `sequences → sigma-notation` either way,
     * and all that changed is that both ends now live in the same ontology, so
     * the declaration moved there with the node.)
     *
     * THE ROOT SET OF THIS AREA GREW, from one to three, which is the case
     * atlas-foundations.ts warns is the reason to check root membership by NAME
     * and never by size. This node had no prerequisite inside the area and was
     * its only root; it was also the ONLY in-area prerequisite of all three
     * nodes above it, so all three took its place at once. One root out, three
     * in — a count would have gone 1 → 3 here and could just as easily have
     * held steady while every member changed. It did exactly that one
     * promotion later, which is recorded where it happened.
     *
     * HEADROOM. Eleven nodes became ten, against the floor of five that
     * tests/atlas.mjs enforces as "no area is a stub", so this area had five
     * more promotions of room and nothing in it was held back. The floor is why
     * the departure order matters at all, and atlas-foundations.ts is explicit
     * that a drained area's answer is to MERGE into a neighbour rather than to
     * lower the threshold. Two of those five have since been spent and nothing
     * here is close to needing that decision.
     */
    /**
     * `arithmetic-sequences` LEFT THIS AREA TOO, THE THIRD DEPARTURE FROM IT
     * AND THE TWENTY-SIXTH IN THE BUILD. Same structural rule — `atlasProblems`
     * rejects a node whose id collides with an authored concept, so a promotion
     * is a MOVE and never a fill-in. The long version is in the note above
     * `geometric-sequences` and in atlas-foundations.ts; what follows is only
     * what is DIFFERENT about the third one.
     *
     * IT IS A CONCEPT OF `functions-and-inverses` NOW, beside `sequences` and
     * `sigma-notation`, which makes that branch a FORK where it was a chain:
     * `function-concept` → `sequences` → {`sigma-notation`, this}. Three of the
     * four concepts that subject has taken from this file came out of this one
     * area.
     *
     * ITS ONE STRANDED EDGE WENT TO THE ONTOLOGY FOR THE THIRD TIME, and the
     * note above `geometric-sequences` asked the next departure to check
     * whether that was tidiness or luck. It is neither, and the right word is
     * the one atlas-foundations.ts uses: it is a property of where the
     * departing node's prerequisites LIVE. This node declared
     * `needs: ['sequences']` and nothing else, and `sequences` had been a
     * concept of that file since the first departure, so the edge could be
     * restated there. `links` is empty a third time and
     * `mathematical-induction` is still sitting in this list unable to avoid an
     * entry whenever its turn comes, since it needs `geometric-proof` and that
     * is the geometry subject's.
     *
     * NOTHING WAS HANDED BACK, `links` being empty and an empty list having
     * nothing to collapse.
     *
     * NO EDGE POINTED INTO IT AT ALL, which is new here and is the reason this
     * promotion GATES NOTHING. The two departures above had three and five
     * dependents between them, every one of which gained a gate the day the
     * node it rested on got material. Nothing on the map and nothing authored
     * declares `needs: ['arithmetic-sequences']` — `geometric-sequences`
     * directly above rests on `sequences` and `exponential-functions`, not on
     * this — so no walk anywhere changes. Worth stating because "authoring
     * tightens the gate" has been true of every promotion out of this area so
     * far and a reader would reasonably assume it again.
     *
     * THE INTERFERENCE SURVIVED, AND THE NOTE ABOVE `geometric-sequences` WAS
     * WRONG ABOUT THIS END. That note tells whoever promotes either of the two
     * named families that the `confusedWith` between them "must be re-declared
     * in the receiving ontology's `EDGES`, with its `rationale`, or it is gone
     * without a sound". It is right for `geometric-sequences` and wrong here,
     * and the correction is the same one atlas-foundations.ts had to make for
     * `needs`: an edge is owned by the node that DECLARES it.
     *
     * The `confusedWith` is written on `geometric-sequences`, which stayed.
     * `expandEdges` walks an area's OWN nodes, so the area still declares that
     * edge and `composeAtlas` still emits
     * `geometric-sequences ~ arithmetic-sequences`, now with a map node at one
     * end and an authored concept at the other. Nothing was stranded and there
     * was nothing to re-declare.
     *
     * Following the instruction would in fact have been impossible, which is
     * the part worth having in writing before somebody spends a run on it.
     * `FUNCTIONS_AND_INVERSES` may name only concepts it CONTAINS, so an
     * `interferes_with` there pointing at `geometric-sequences` makes
     * `ontologyProblems` report an unknown endpoint. And `links` cannot carry
     * it: `expandEdges` hard-codes `kind: 'prerequisite'` for every entry
     * there, and in any case `links` is for edges this area owns NEITHER end
     * of. A cross-file interference is expressible nowhere in this build —
     * ontology-functions.ts says the same thing about `f⁻¹` against `x⁻¹` — so
     * the only safe move was to leave the declaring end alone and check that
     * the composed edge was still there. tests/atlas.mjs now asserts it from
     * the composed map AND asserts that only one end is a node of this area,
     * which is the shape that would have caught a re-declaration as a
     * duplicate.
     *
     * The instruction still stands for the other end, and that is why it has
     * not been deleted: promoting `geometric-sequences` DOES strand this edge,
     * and if both families end up in `functions-and-inverses` it can and must
     * be restated in that ontology's `EDGES` with its rationale.
     *
     * THE ROOT SET SHRANK, THREE TO TWO, and it is the cause
     * atlas-foundations.ts records under `binomial-theorem` rather than either
     * of the two this area has shown. This node was a root here — its only
     * prerequisite had been authored out from under it by the first departure —
     * and nothing replaced it, because a node can only substitute into this set
     * by being freed INSIDE this area and this one was the last in-area
     * prerequisite of nothing. The roots were `arithmetic-sequences`,
     * `geometric-sequences` and `mathematical-induction`; they are the latter
     * two. tests/atlas.mjs asserts the pair by name, as it asserted the triple.
     *
     * So this area has now produced growth (1 → 3), turnover at constant size
     * (3 → 3) and shrinkage (3 → 2), in that order, from three departures. The
     * outcome depends on the DEPENDENTS of the node that leaves and not on the
     * node, which is why the set is computed on both sides of a promotion here
     * rather than predicted.
     *
     * HEADROOM. Nine nodes became eight, against the floor of five, so three
     * more promotions of room. Nothing here is near needing the merge decision
     * atlas-foundations.ts describes, and that decision belongs to a human
     * either way.
     */
    {
      id: 'geometric-sequences',
      match: /\bgeometric (sequence|progression|series)\b/i,
      name: 'Geometric sequences and sums',
      is: 'Constant ratio, with a closed-form sum, and a finite total when the ratio is inside the unit interval.',
      needs: ['sequences', 'exponential-functions'],
      confusedWith: [{
        id: 'arithmetic-sequences',
        because:
          'The two are introduced together, with parallel vocabulary (common difference versus ' +
          'common ratio) and parallel sum formulas, so learners substitute into whichever they ' +
          'recall. The failure is silent: both produce a number.',
      }],
      terms: 'geometric sequence common ratio geometric series sum to infinity',
    },
    /**
     * `sigma-notation` LEFT THIS AREA TOO, ONE PROMOTION AFTER `sequences`,
     * AND FOR THE SAME STRUCTURAL REASON — `atlasProblems` rejects a node whose
     * id collides with an authored concept, so this is a MOVE and not a
     * fill-in. The long version of that rule is in the note above and in
     * atlas-foundations.ts at NUMBER_AND_ARITHMETIC; what follows is only what
     * is DIFFERENT about the second departure, because a reader who finds the
     * two notes saying the same thing twice will stop reading either.
     *
     * IT IS A CONCEPT OF `functions-and-inverses` NOW, directly above
     * `sequences`, so that branch of ontology-functions.ts is a chain of its
     * own: `function-concept` → `sequences` → `sigma-notation`.
     *
     * ITS ONE STRANDED EDGE WENT TO THE ONTOLOGY AGAIN, AND THAT WAS LUCK
     * RATHER THAN TIDINESS — which is the sentence the note above asks the
     * next departure to check. It declared `needs: ['sequences']` and nothing
     * else, and `sequences` had become a concept of that same file one
     * promotion earlier. Had this node been promoted FIRST, that identical
     * `needs` would have pointed at a map node, no ontology could have named
     * it, and the edge would have had to be a `links` entry here. So the
     * cheapness came from the ORDER the two were authored in, and `links` is
     * still empty for a reason that will not survive the first promotion out of
     * here whose prerequisites live in another file. `mathematical-induction`
     * is the example sitting in this list: it needs `geometric-proof`, which is
     * geometry's, so promoting it would cost an entry whatever else happened.
     *
     * NO `confusedWith` AGAIN, so no `interferes_with` was silently deleted —
     * the stranding no suite catches. This area's one interference is still
     * `geometric-sequences` → `arithmetic-sequences`, and at this point both of
     * those nodes were still here. The third departure took the far end and
     * the edge survived, for the reason the note above now gives; the warning
     * is addressed to whoever promotes `geometric-sequences`, the end that
     * declares it.
     *
     * NOTHING WAS HANDED BACK, because `links` was empty and an empty list has
     * nothing to collapse.
     *
     * THE FIVE EDGES POINTING INTO IT SURVIVE UNTOUCHED, declared by the nodes
     * that stayed: `mathematical-induction` and `infinite-series` here,
     * `riemann-sums` in integral-calculus, and `expectation` and
     * `descriptive-statistics` in atlas-uncertainty.ts. That is five dependents
     * across three map files, and not one of those files was edited — an edge
     * is owned by the node that DECLARES it, and all five declare theirs. What
     * changed without a line being touched in any of them is that those edges
     * now gate, where `gatingPrerequisitesOf` used to look straight through a
     * node with no material.
     *
     * THE ROOT SET TURNED OVER WITHOUT CHANGING SIZE, which is the case
     * atlas-foundations.ts says to check root membership by NAME for, and the
     * previous note said could "just as easily" have happened. It happened
     * here. The roots were `arithmetic-sequences`, `geometric-sequences` and
     * `sigma-notation`; they are now `arithmetic-sequences`,
     * `geometric-sequences` and `mathematical-induction`, which took the
     * departing node's place because `sigma-notation` was its only in-area
     * prerequisite. `infinite-series` did NOT become a root, because it also
     * needs `sequence-convergence` and that is still here. Three in, three out,
     * one member different — a `length === 3` check would have passed.
     *
     * The third departure then SHRANK it, three to two, for a third distinct
     * reason. The note where that node sat has the account; the short version
     * is that growth, turnover and shrinkage have now all come out of this one
     * area, so there is no pattern here to read off and the set is computed on
     * both sides of a promotion rather than predicted.
     *
     * HEADROOM. Ten nodes became nine, against the floor of five, so four more
     * promotions of room at the time, and eight nodes with three of room after
     * the third departure. The floor is why departure order matters at all and
     * nothing here is near needing the merge decision atlas-foundations.ts
     * describes.
     */
    /**
     * `mathematical-induction` LEFT THIS AREA TOO, THE FOURTH DEPARTURE FROM
     * IT AND THE THIRTY-SECOND IN THE BUILD. Same structural rule —
     * `atlasProblems` rejects a node whose id collides with an authored
     * concept, so a promotion is a MOVE and never a fill-in. The long version
     * is in the notes above and in atlas-foundations.ts; what follows is only
     * what is DIFFERENT about the fourth one.
     *
     * IT IS A CONCEPT OF `functions-and-inverses` NOW, above `sigma-notation`,
     * so that branch is two deep below the fork: `function-concept` →
     * `sequences` → {`sigma-notation` → this, `arithmetic-sequences`}. Four of
     * the five concepts that subject has taken from this file came out of this
     * one area.
     *
     * THE `links` LIST IS NO LONGER EMPTY, AND THREE SEPARATE NOTES IN THIS
     * FILE SAID THIS WOULD BE THE NODE THAT ENDED IT. They were right, and the
     * mechanism is exactly the one they named rather than a new one. This node
     * declared `needs: ['sigma-notation', 'geometric-proof']`. The first is a
     * concept of the receiving ontology, so that edge went to its `EDGES` like
     * the three before it. The second is a concept of `plane-geometry`, and an
     * authored ontology may name only concepts it CONTAINS — `ontologyProblems`
     * reports an unknown endpoint otherwise — so no ontology could hold it and
     * it is the entry below.
     *
     * Worth being precise about what made it expensive, because "its
     * prerequisite was in another file" is the half that generalises and the
     * other half is not what a reader expects: `geometric-proof` is FULLY
     * AUTHORED, with material and tasks. A `links` entry is about which
     * SUBJECT an endpoint belongs to, never about whether anybody has written
     * it. So this edge GATES from the moment it exists, which makes it one of
     * the easy ones to notice — the hard ones point at an unwritten node and
     * gate nothing until it is written, and dropping one of those leaves every
     * suite green.
     *
     * NOTHING WAS HANDED BACK. A promotion can make an existing `links` entry
     * redundant, if an area filed one because it owned neither end and the
     * promoted node lands in the same ontology as the far end — then the edge
     * becomes an ordinary `needs` there and the entry must be DELETED, or the
     * composed graph carries it twice, which `composeAtlas` does not notice and
     * no suite checks. Every area's `links` was read for this id at both ends
     * before the node was deleted. This area's was empty, and no other area
     * mentions it.
     *
     * IT STRANDED NO `confusedWith` — checked on the node before deleting it
     * rather than inferred from the suites passing afterwards, which they would
     * have either way. `expandEdges` turns a `confusedWith` into an
     * `interferes_with`, interference constrains SELECTION rather than gating,
     * and deleting the declaring node deletes the edge in silence. This node
     * declared none and no `exercises` either. The area's one interference is
     * still `geometric-sequences → arithmetic-sequences`, declared by the node
     * that stayed.
     *
     * THE THREE EDGES POINTING INTO IT SURVIVE UNTOUCHED, declared by the nodes
     * that stayed and in two other map FILES: `supremum-and-completeness` in
     * `real-analysis` further down this file, and `combinatorial-identities`
     * and `trees` in atlas-structures.ts. Not one of those files was edited —
     * an edge is owned by the node that DECLARES it — and what changed without
     * a line being touched is that all three now GATE, where
     * `gatingPrerequisitesOf` used to look straight through a node with no
     * material.
     *
     * THE ROOT SET SHRANK AGAIN, TWO TO ONE, for the same cause as the third
     * departure and with a different shape of evidence. This node was a root
     * here — it became one when `sigma-notation`, its only in-area
     * prerequisite, was authored out from under it — and nothing replaced it,
     * because a node can only substitute into this set by being freed INSIDE
     * the area and this one was the last in-area prerequisite of nothing here.
     * `geometric-sequences` is now the area's sole root.
     *
     * So four departures from one area have produced growth (1 → 3), turnover
     * at constant size (3 → 3) and shrinkage twice (3 → 2, 2 → 1). The outcome
     * depends on the DEPENDENTS of the node that leaves and not on the node,
     * which is why the set is computed on both sides of a promotion here rather
     * than predicted.
     *
     * AND IT MADE ONE ASSERTION IN tests/atlas.mjs UNWRITABLE FROM THIS AREA,
     * which is the trap worth recording for the fifth departure. The second
     * promotion's group asserted its substitution by reading
     * `SEQ_AREA.nodes.find(n => n.id === 'mathematical-induction').needs` — a
     * claim about a node that has now left, which does not go vacuous but
     * THROWS on `undefined.needs`. That is the loud end of the failure mode
     * atlas-foundations.ts records as a silently-passing optional chain: write
     * it as `(find(...)?.needs ?? [])` and it would have passed forever while
     * asserting nothing. It is restated over the composed map instead, where
     * both of its endpoints still exist.
     *
     * HEADROOM. Eight nodes became seven, against the floor of five that
     * tests/atlas.mjs enforces as "no area is a stub", so two more promotions
     * of room. That is now the tightest this area has been, and it is worth
     * naming what it is NOT: `algebra-foundations` and `linear-algebra` are
     * both at six with one departure of room each, and a promotion out of
     * either is the merge decision atlas-foundations.ts describes rather than
     * an authoring job. This area is not there yet and the next run may still
     * take `geometric-sequences`, `sequence-convergence` or `infinite-series`
     * from it without raising that question.
     */
    {
      id: 'sequence-convergence',
      match: /\b(limit of a sequence|convergent sequence)\b/i,
      name: 'Convergence of a sequence',
      is: 'What it means for terms to settle down, taken informally here: monotone and bounded is enough, and that claim is the one analysis has to earn.',
      needs: ['geometric-sequences', 'real-number-line'],
      terms: 'convergence limit of a sequence bounded monotone divergent',
    },
    {
      id: 'infinite-series',
      match: /^series \(mathematics\)|\b(infinite series|harmonic series|geometric series)\b/i,
      name: 'Infinite series',
      is: 'A sum as the limit of its partial sums, which is why rearranging one can change the answer.',
      needs: ['sequence-convergence', 'sigma-notation'],
      terms: 'infinite series partial sum convergent divergent harmonic',
    },
    {
      id: 'convergence-tests',
      match: /\b(convergence test|ratio test|comparison test|integral test|alternating series)\b/i,
      name: 'Convergence tests',
      is: 'Comparison, ratio, root, integral and alternating — a toolkit, and knowing which one the shape of the terms calls for.',
      needs: ['infinite-series'],
      terms: 'ratio test root test comparison test integral test alternating series',
    },
    {
      id: 'power-series',
      match: /\bpower series\b/i,
      name: 'Power series',
      is: 'A series whose terms carry a variable, with a radius of convergence inside which it defines a function.',
      needs: ['convergence-tests', 'polynomial-functions'],
      terms: 'power series radius of convergence interval of convergence',
    },
    {
      id: 'taylor-series',
      match: /\b(taylor (series|theorem|expansion)|maclaurin)\b/i,
      name: 'Taylor and Maclaurin series',
      is: 'Building the power series whose derivatives at a point match a given function, and the remainder that says how wrong a truncation is.',
      needs: ['power-series', 'higher-derivatives'],
      exercises: ['higher-derivatives'],
      terms: 'taylor series maclaurin remainder term expansion',
    },
    {
      id: 'fourier-series',
      match: /\bfourier (series|analysis)\b/i,
      name: 'Fourier series',
      is: 'Expanding a periodic function in sines and cosines instead of powers, which works because they are orthogonal.',
      needs: ['taylor-series', 'definite-integral', 'trig-graphs'],
      terms: 'fourier series harmonic orthogonality periodic expansion',
    },
  ],
}

const LIMITS_AND_CONTINUITY: MapArea = {
  id: 'limits-and-continuity',
  name: 'Limits and continuity',
  covers:
    'The limit of a function and what continuity buys you. Computational and intuitive; the ' +
    'ε-δ definition is in real analysis.',
  nodes: [
    {
      id: 'limit-of-a-function',
      match: /\blimit of a function\b|^limit \(mathematics\)/i,
      name: 'The limit of a function',
      is: 'What the outputs approach as the input approaches a point — a claim about the neighbourhood, deliberately not about the point itself.',
      needs: ['graphs-of-functions', 'sequence-convergence'],
      terms: 'limit approaches tends to limit laws',
    },
    {
      id: 'one-sided-limits',
      match: /\bone-sided limit\b/i,
      name: 'One-sided limits',
      is: 'Approaching from the left and from the right separately, and a two-sided limit existing exactly when they agree.',
      needs: ['limit-of-a-function', 'piecewise-functions'],
      terms: 'one sided limit left hand right hand jump',
    },
    {
      id: 'indeterminate-forms',
      match: /\bindeterminate form\b/i,
      name: 'Indeterminate forms',
      is: '0/0 is not a value but a signal that the expression must be rewritten — which is why cancelling is the main technique.',
      needs: ['limit-of-a-function', 'simplifying-rational'],
      exercises: ['simplifying-rational'],
      terms: 'indeterminate form zero over zero cancel factor',
    },
    {
      id: 'limits-at-infinity',
      name: 'Limits at infinity',
      is: 'End behaviour as a limit, which turns the asymptote rules for rational functions into a one-line computation.',
      needs: ['indeterminate-forms', 'rational-functions'],
      terms: 'limit at infinity horizontal asymptote end behaviour growth rate',
    },
    {
      id: 'squeeze-theorem',
      match: /\bsqueeze theorem\b/i,
      name: 'The squeeze theorem',
      is: 'Trapping a function between two that agree in the limit — the standard route to sin(x)/x and the first genuinely clever limit argument.',
      needs: ['limit-of-a-function', 'trig-graphs'],
      terms: 'squeeze theorem sandwich sin x over x',
    },
    {
      id: 'continuity',
      // "Continuity" is the commonest word in analysis and four nodes have a
      // claim on it — this one, the proved version, the topological one, and
      // the complex one. So the pattern takes only the article title, and the
      // bare word is left to no one rather than fought over.
      match: /^continuous function\b/i,
      name: 'Continuity',
      is: 'The limit existing and equalling the value — three conditions, and a function can fail any one of them alone.',
      needs: ['one-sided-limits'],
      terms: 'continuous discontinuity removable jump infinite',
    },
    {
      id: 'intermediate-value-theorem',
      match: /\bintermediate value theorem\b/i,
      name: 'The intermediate value theorem',
      is: 'A continuous function on an interval hits every value between its endpoints, which is how a root is located without being solved for.',
      needs: ['continuity'],
      terms: 'intermediate value theorem root existence bisection',
    },
    {
      id: 'extreme-value-theorem',
      match: /\bextreme value theorem\b/i,
      name: 'The extreme value theorem',
      is: 'Continuous on a closed bounded interval means the maximum is attained — closed and bounded both do work here.',
      needs: ['continuity'],
      terms: 'extreme value theorem maximum attained compact interval',
    },
    {
      id: 'asymptotic-comparison',
      match: /\b(asymptotic analysis|big o notation)\b/i,
      name: 'Comparing growth rates',
      is: 'Which of two functions wins far out, ordering logs below powers below exponentials, and the notation that records it.',
      needs: ['limits-at-infinity', 'logarithmic-functions'],
      terms: 'growth rate big o asymptotic dominance',
    },
  ],
}

const DIFFERENTIAL_CALCULUS: MapArea = {
  id: 'differential-calculus',
  name: 'Differential calculus',
  covers:
    'The derivative: its definition, the rules for computing it, and what it is used for. ' +
    'Single variable, real valued.',
  nodes: [
    {
      id: 'derivative-definition',
      match: /^derivative\b|\bdifference quotient\b/i,
      name: 'The derivative as a limit',
      is: 'The limit of the difference quotient — instantaneous rate of change defined without ever dividing by zero.',
      needs: ['limit-of-a-function', 'lines-in-the-plane'],
      terms: 'derivative difference quotient tangent line rate of change',
    },
    {
      id: 'differentiability',
      match: /\bdifferentiab(le|ility)\b/i,
      name: 'Differentiability versus continuity',
      is: 'Differentiable implies continuous and not the reverse; the absolute value at zero is the whole counterexample.',
      needs: ['derivative-definition', 'continuity'],
      terms: 'differentiable continuous corner cusp vertical tangent',
    },
    {
      id: 'power-and-sum-rules',
      match: /\bpower rule\b/i,
      name: 'Power, sum and constant rules',
      is: 'The first differentiation rules, each proved from the definition rather than asserted.',
      needs: ['derivative-definition', 'binomial-theorem'],
      terms: 'power rule sum rule constant multiple derivative rules',
    },
    {
      id: 'product-and-quotient-rules',
      match: /\b(product rule|quotient rule)\b/i,
      name: 'Product and quotient rules',
      is: 'The derivative of a product is not the product of derivatives, and the quotient rule is the product rule plus the chain rule.',
      needs: ['power-and-sum-rules'],
      terms: 'product rule quotient rule leibniz',
    },
    {
      id: 'chain-rule',
      match: /\bchain rule\b/i,
      name: 'The chain rule',
      is: 'Differentiating a composition by multiplying rates, which is the rule that makes every other one general.',
      needs: ['product-and-quotient-rules', 'function-composition'],
      terms: 'chain rule composition inner function outer function',
    },
    {
      id: 'derivatives-of-transcendentals',
      name: 'Derivatives of the standard functions',
      is: 'Sine, cosine, exponential and log — where e is defined by the derivative coming out right and radians earn their keep.',
      needs: ['chain-rule', 'squeeze-theorem', 'logarithmic-functions'],
      terms: 'derivative of sine derivative of e^x natural log derivative',
    },
    {
      id: 'implicit-differentiation',
      match: /\bimplicit (function|differentiation)\b/i,
      name: 'Implicit differentiation',
      is: 'Differentiating an equation rather than a formula, which gets a slope on a curve that is not a function.',
      needs: ['chain-rule', 'parametric-and-implicit'],
      terms: 'implicit differentiation dy dx curve',
    },
    {
      id: 'inverse-derivatives',
      name: 'Derivatives of inverse functions',
      is: 'The reciprocal-slope relation, which is where the derivatives of arcsine and the logarithm actually come from.',
      needs: ['implicit-differentiation', 'inverse-trig'],
      terms: 'derivative of inverse function arcsin derivative reciprocal slope',
    },
    {
      id: 'higher-derivatives',
      match: /\b(second derivative|higher[- ]order derivative)\b/i,
      name: 'Higher derivatives',
      is: 'Differentiating again: the second derivative as concavity, and the notation that keeps the order straight.',
      needs: ['chain-rule'],
      terms: 'second derivative concavity higher order notation',
    },
    {
      id: 'mean-value-theorem',
      match: /\b(mean value theorem|rolle('|’)?s theorem)\b/i,
      name: 'The mean value theorem',
      is: 'Somewhere the instantaneous rate equals the average rate — the theorem almost every later statement about derivatives is proved from.',
      needs: ['differentiability', 'extreme-value-theorem'],
      terms: 'mean value theorem rolle average rate',
    },
    {
      id: 'curve-sketching',
      name: 'Curve sketching',
      is: 'Assembling a graph from sign information: increasing from the first derivative, concavity from the second, asymptotes from limits.',
      needs: ['higher-derivatives', 'limits-at-infinity', 'mean-value-theorem'],
      terms: 'curve sketching critical point inflection increasing concave',
    },
    {
      id: 'optimisation',
      match: /\b(maxima and minima|optimi[sz]ation)\b/i,
      name: 'Optimisation',
      is: 'Finding a largest or smallest value, where the real difficulty is building the function and its domain, not differentiating it.',
      needs: ['curve-sketching', 'word-problems'],
      terms: 'optimisation maximum minimum constraint critical point',
    },
    {
      id: 'related-rates',
      match: /\brelated rates\b/i,
      name: 'Related rates',
      is: 'Differentiating a relation with respect to time, which is the chain rule applied to a situation rather than a formula.',
      needs: ['implicit-differentiation', 'word-problems'],
      terms: 'related rates with respect to time implicit chain rule',
    },
    {
      id: 'linear-approximation',
      match: /\b(linear approximation|differential \(infinitesimal\))\b/i,
      name: 'Linear approximation and differentials',
      is: 'Replacing a function by its tangent line nearby, which is the first term of Taylor and the basis of Newton\'s method.',
      needs: ['derivative-definition', 'curve-sketching'],
      terms: 'linear approximation tangent line differential newton method error',
    },
    {
      id: 'lhopital',
      match: /\bl('|’)?h(ô|o)pital\b/i,
      name: "L'Hôpital's rule",
      is: 'Resolving an indeterminate quotient by differentiating top and bottom, which is legal only for the forms it names.',
      needs: ['mean-value-theorem', 'indeterminate-forms'],
      terms: "l'hopital rule indeterminate quotient",
    },
  ],
}

const INTEGRAL_CALCULUS: MapArea = {
  id: 'integral-calculus',
  name: 'Integral calculus',
  covers:
    'The integral from both of its definitions — the antiderivative and the limit of sums — the ' +
    'theorem that ties them together, and the standard techniques.',
  nodes: [
    {
      id: 'antiderivative',
      match: /\bantiderivative\b/i,
      name: 'Antiderivatives',
      is: 'Undoing differentiation, where the constant of integration is the statement that the answer is a family.',
      needs: ['derivatives-of-transcendentals'],
      terms: 'antiderivative indefinite integral constant of integration',
    },
    {
      id: 'riemann-sums',
      match: /\briemann sum\b/i,
      name: 'Riemann sums',
      is: 'Approximating area by rectangles and refining, which is the definition the antiderivative turns out to compute.',
      needs: ['sigma-notation', 'limit-of-a-function', 'area-and-perimeter'],
      terms: 'riemann sum left right midpoint partition area under curve',
    },
    {
      id: 'definite-integral',
      match: /^integral\b|\bdefinite integral\b/i,
      name: 'The definite integral',
      is: 'The limit of Riemann sums as a number attached to an interval, signed, and additive over subintervals.',
      needs: ['riemann-sums'],
      terms: 'definite integral limits of integration signed area additivity',
    },
    {
      id: 'fundamental-theorem',
      match: /\bfundamental theorem of calculus\b/i,
      name: 'The fundamental theorem of calculus',
      is: 'Differentiation and integration are inverse — the reason an area is computable at all, and the central theorem of the subject.',
      needs: ['definite-integral', 'antiderivative', 'mean-value-theorem'],
      terms: 'fundamental theorem of calculus evaluation accumulation function',
    },
    {
      id: 'integration-by-substitution',
      match: /\bintegration by substitution\b/i,
      name: 'Substitution',
      is: 'The chain rule read backwards, which is why spotting the inner function is the whole skill.',
      needs: ['fundamental-theorem', 'chain-rule'],
      exercises: ['chain-rule'],
      terms: 'substitution u substitution change of variable',
    },
    {
      id: 'integration-by-parts',
      match: /\bintegration by parts\b/i,
      name: 'Integration by parts',
      is: 'The product rule read backwards, where the choice of which factor to differentiate decides whether it helps.',
      needs: ['integration-by-substitution', 'product-and-quotient-rules'],
      terms: 'integration by parts lipet choice of u',
    },
    {
      id: 'trig-integrals-and-substitution',
      match: /\btrigonometric substitution\b/i,
      name: 'Trigonometric integrals and substitution',
      is: 'Using identities to make an integrand integrable, and turning a radical into a circular function.',
      needs: ['integration-by-parts', 'trig-substitution-setup'],
      terms: 'trigonometric integral trig substitution identity radical',
    },
    {
      id: 'integration-partial-fractions',
      match: /\bpartial fraction\b/i,
      name: 'Integrating a rational function',
      is: 'Decompose, then integrate termwise — every rational function is elementary-integrable, which is special and worth noticing.',
      needs: ['integration-by-substitution', 'partial-fractions-linear'],
      exercises: ['partial-fractions-linear', 'combining-rational'],
      terms: 'partial fractions integration rational function logarithm arctan',
    },
    {
      id: 'improper-integrals',
      match: /\bimproper integral\b/i,
      name: 'Improper integrals',
      is: 'An integral over an unbounded interval or past a vertical asymptote, which only means anything as a limit.',
      needs: ['integration-by-parts', 'limits-at-infinity'],
      terms: 'improper integral divergent convergent unbounded',
    },
    {
      id: 'area-between-curves',
      name: 'Area between curves',
      is: 'Integrating a difference, where the hard part is finding where the two swap over.',
      needs: ['fundamental-theorem'],
      terms: 'area between curves intersection integrate difference',
    },
    {
      id: 'volumes-of-revolution',
      match: /\bsolid of revolution\b/i,
      name: 'Volumes by slicing and revolution',
      is: 'Integrating a cross-sectional area; discs, washers and shells are three bookkeeping choices for one idea.',
      needs: ['area-between-curves', 'solid-geometry'],
      terms: 'volume of revolution disc washer shell cross section',
    },
    {
      id: 'arc-length-and-surface',
      match: /\b(arc length|surface of revolution)\b/i,
      name: 'Arc length and surface area',
      is: 'Integrating an element of length built from Pythagoras, which is why the integrand carries a square root.',
      needs: ['volumes-of-revolution', 'distance-and-midpoint'],
      terms: 'arc length surface of revolution element of length',
    },
    {
      id: 'numerical-integration',
      match: /\b(numerical integration|simpson('|’)?s rule|trapezoidal rule)\b/i,
      name: 'Numerical integration',
      is: 'Trapezium and Simpson with error bounds — the honest route when no antiderivative is elementary, which is most of the time.',
      needs: ['definite-integral', 'higher-derivatives'],
      terms: 'trapezium rule simpson rule numerical quadrature error bound',
    },
    {
      id: 'integration-applications',
      name: 'Accumulation in applications',
      is: 'Work, centre of mass and average value, each the same move: integrate a rate to get a total.',
      needs: ['area-between-curves'],
      terms: 'work centroid average value accumulation',
    },
  ],
}

/**
 * ONE NODE LEFT THIS AREA WHEN IT WAS AUTHORED, AND IT HAD TO.
 *
 * `atlasProblems` REJECTS a map node whose id collides with an authored
 * concept, so promoting one is a MOVE and never a fill-in. The node cannot
 * stay here as a skeleton beside the syllabus entry — `composeAtlas`
 * concatenates the two and the duplicate id is a fault, reported rather than
 * silently resolved in either direction. That is the rule, and it is why this
 * area is one node lighter than its `covers` used to describe.
 *
 * `functions-of-several-variables` was the departure, the twenty-first
 * promotion, and it is now a concept of `functions-and-inverses` in
 * ontology-functions.ts. Twelve nodes to ELEVEN, against a stub floor of five
 * — tests/atlas.mjs asserts no area holds fewer than five nodes, so this area
 * has six more promotions of slack and the floor played no part in choosing
 * this one.
 *
 * WHY IT WENT TO THE FUNCTIONS SUBJECT rather than founding a multivariable
 * one: this node's own `is` line said "a function of a point rather than a
 * number", which is a claim about what the INPUT is, and that is the axis
 * ontology-functions.ts is organised on. An area is a region of the MAP; a
 * subject is a syllabus with problems in it, and the two have never been
 * required to agree. The precedent is `sequences` and `sigma-notation`, both
 * nodes of `sequences-and-series` in this same file and both authored there.
 *
 * WHY THIS NODE AND NOT ANOTHER, since nothing forced it — all ten journeys in
 * journeys.ts have read zero unwritten steps on route since the fourteenth
 * promotion, and no area is near the floor. Two grounds that outlived the
 * expired ones: evaluating a rule in two letters at a stated pair is exact
 * rational arithmetic, so every knowledge point could get a real `evaluate`
 * task with no worker; and this node was the SOLE ROOT of the whole area, so
 * all twelve nodes here were gated behind one unwritten concept and
 * `gatingPrerequisitesOf` was answering for them two files away.
 *
 * ── THE EDGES, WHICH IS WHERE A PROMOTION LOSES SOMETHING SILENTLY ────────
 *
 * An edge is owned by the node that DECLARES it, so deleting this node
 * stranded only the two on its own `needs`. They went to two different places,
 * and the split is the thing to understand:
 *
 *  - `domain-and-range → functions-of-several-variables` has both ends in
 *    ontology-functions.ts now, so it is an ordinary `EDGES` entry over there
 *    and cost this area nothing.
 *  - `three-dimensional-coordinates → functions-of-several-variables` is the
 *    other one, and `three-dimensional-coordinates` is a concept of
 *    `vectors-and-independence`. Two authored subjects, so NEITHER ontology
 *    may name it — an ontology may only name concepts it CONTAINS, and
 *    `ontologyProblems` reports an unknown endpoint otherwise — and it is this
 *    area's first and only `links` entry. It GATES from the moment it exists,
 *    because both of its ends are authored; a `links` entry pointing at a node
 *    with no material gates nothing until that node is written, which is what
 *    makes those ones easy to drop.
 *
 * THE EDGES POINTING IN WERE LEFT ALONE, as the rule says. `partial-
 * derivatives` here and `complex-functions` in `complex-analysis` each name
 * this concept in their own `needs`, at the far end, so `composeAtlas`
 * resolves both across the file boundary and neither needed touching.
 *
 * AND NO `links` ENTRY WAS HANDED BACK. A promotion can make an existing entry
 * redundant — if an area filed one because it owned neither end, and the
 * promoted node lands in the same ontology as the far end, that edge becomes
 * an ordinary `needs` there and the entry must be DELETED or the composed
 * graph carries it twice, which `composeAtlas` does not notice and no suite
 * checks. Every area's `links` was read for this id before the node was
 * deleted. There were none: this area had an empty list, and no other area
 * mentioned the node at either end.
 *
 * IT STRANDED NO `confusedWith` — checked on the node before deleting it
 * rather than inferred from the suites passing afterwards. `expandEdges` turns
 * one into an `interferes_with`, interference constrains SELECTION rather than
 * gating, and dropping one leaves every suite green, so an absence here has to
 * be looked for and not assumed. The node declared none, and no `exercises`
 * either.
 *
 * THE ROOT SET SPLIT RATHER THAN SHRINKING: one root out, one root in, and the
 * size happens not to have moved. `partial-derivatives` is the new root
 * because this node was the last of its prerequisites INSIDE the area — its
 * other, `chain-rule`, is a node of `differential-calculus`. Nothing else here
 * named the departed node, so nothing else was promoted. A `length === 1`
 * check would have passed on both sides of this while every claim it made went
 * stale, which is why tests/atlas.mjs asserts this set by NAMED MEMBERSHIP.
 *
 * WHAT STAYED, and the boundary is the verifier's rather than the curriculum's.
 * The departed node's `is` line also promised level curves, and a level curve
 * is a claim about a drawing — the same line ontology-functions.ts draws in
 * front of `graphs-of-functions`, one dimension further out. So what was
 * authored is the ALGEBRA under that picture: match each number to its slot,
 * hold one letter and a rule in the other is left, and read a domain off a
 * condition on the pair. `partial-derivatives` still owns differentiating
 * along a slice, which is the next move and needs no figure either.
 */
const MULTIVARIABLE_CALCULUS: MapArea = {
  id: 'multivariable-calculus',
  name: 'Multivariable calculus',
  covers:
    'Calculus on functions of several variables and on vector fields, up to the three classical ' +
    'theorems that generalise the fundamental theorem. What a function of several variables IS ' +
    'has left this area — it is authored in the functions subject, since the move it makes is ' +
    'to the input rather than to the calculus — so this area now starts at differentiating one, ' +
    'and the level curves and surfaces that picture one are still here and still unwritten.',
  links: [
    {
      from: 'three-dimensional-coordinates',
      to: 'functions-of-several-variables',
      because:
        'Both ends are authored concepts of two different subjects, so neither ontology may '
        + 'name this edge and it can only live here. The claim is the map\'s: a learner meets '
        + 'z = f(x, y) as a surface in space, so the three coordinates come first. Note that '
        + 'nothing in the authored material uses a third coordinate, which is why the edge '
        + 'gates and no `encompasses` runs back along it.',
    },
  ],
  nodes: [
    {
      id: 'partial-derivatives',
      match: /\bpartial derivative/i,
      name: 'Partial derivatives',
      is: 'Differentiating in one direction while the rest are held, which is a single-variable derivative on a slice.',
      needs: ['functions-of-several-variables', 'chain-rule'],
      terms: 'partial derivative held constant mixed partial',
    },
    {
      id: 'gradient-and-directional',
      match: /\b(gradient|directional derivative)\b/i,
      name: 'Gradient and directional derivatives',
      is: 'The gradient as the vector of partials, which points the steepest way up and is perpendicular to the level set.',
      needs: ['partial-derivatives', 'dot-product-geometry'],
      terms: 'gradient directional derivative steepest ascent normal to level set',
    },
    {
      id: 'multivariable-chain-rule',
      name: 'The chain rule in several variables',
      is: 'Rates add over the paths they travel, which is why the multivariable version is a sum of products.',
      needs: ['gradient-and-directional'],
      terms: 'multivariable chain rule tree diagram total derivative',
    },
    {
      id: 'multivariable-optimisation',
      match: /\bsecond partial derivative test\b/i,
      name: 'Optimisation in several variables',
      is: 'Critical points from a vanishing gradient, classified by the second-derivative test — with saddle points as a genuinely new outcome.',
      needs: ['multivariable-chain-rule', 'optimisation'],
      terms: 'critical point saddle hessian second derivative test',
    },
    {
      id: 'lagrange-multipliers',
      match: /\blagrange multiplier\b/i,
      name: 'Lagrange multipliers',
      is: 'Optimising under a constraint by aligning gradients, which is a geometric statement before it is a method.',
      needs: ['multivariable-optimisation'],
      terms: 'lagrange multiplier constrained optimisation tangency',
    },
    {
      id: 'multiple-integrals',
      match: /\b(multiple integral|double integral|triple integral)\b/i,
      name: 'Double and triple integrals',
      is: 'Integrating over a region, where choosing the order of integration is choosing how to describe the region.',
      needs: ['partial-derivatives', 'definite-integral'],
      terms: 'double integral triple integral iterated order of integration',
    },
    {
      id: 'change-of-variables',
      match: /\b(jacobian|change of variables)\b/i,
      name: 'Change of variables and the Jacobian',
      is: 'Polar, cylindrical and spherical substitution, with the Jacobian as the factor by which the substitution distorts area.',
      needs: ['multiple-integrals', 'polar-coordinates'],
      terms: 'jacobian change of variables polar cylindrical spherical',
    },
    {
      id: 'vector-fields',
      match: /\bvector field\b/i,
      name: 'Vector fields',
      is: 'A vector attached to every point, with divergence and curl as the two local measurements you can make of one.',
      needs: ['gradient-and-directional'],
      terms: 'vector field divergence curl flow',
    },
    {
      id: 'line-integrals',
      match: /\b(line integral|conservative (vector )?field)\b/i,
      name: 'Line integrals and conservative fields',
      is: 'Integrating along a path; a field is conservative exactly when the answer does not depend on which path.',
      needs: ['vector-fields', 'arc-length-and-surface'],
      terms: 'line integral work conservative field potential function',
    },
    {
      id: 'surface-integrals',
      match: /\bsurface integral\b|\bflux\b/i,
      name: 'Surface integrals and flux',
      is: 'Integrating over a surface, where orientation has to be chosen and the choice changes the sign.',
      needs: ['line-integrals', 'change-of-variables'],
      terms: 'surface integral flux orientation normal vector',
    },
    {
      id: 'greens-stokes-divergence',
      match: /\b(green('|’)?s theorem|stokes('|’)? theorem|divergence theorem)\b/i,
      name: 'Green, Stokes and divergence',
      is: 'Three statements that an integral over a boundary equals an integral over the inside — all one theorem, and all the fundamental theorem.',
      needs: ['surface-integrals', 'fundamental-theorem'],
      terms: 'green theorem stokes theorem divergence theorem boundary',
    },
  ],
}

const DIFFERENTIAL_EQUATIONS: MapArea = {
  id: 'differential-equations',
  name: 'Differential equations',
  covers:
    'Equations whose unknown is a function. Ordinary equations in depth; partial equations only ' +
    'as far as separation of variables.',
  nodes: [
    {
      id: 'what-an-ode-is',
      match: /\b(ordinary differential equation|differential equation)\b/i,
      name: 'What a differential equation is',
      is: 'A relation between a function and its derivatives, where the solution is a family and an initial condition picks one out.',
      needs: ['antiderivative'],
      terms: 'differential equation order initial condition general solution',
    },
    {
      id: 'separable-equations',
      match: /\bseparation of variables\b/i,
      name: 'Separable equations',
      is: 'Pulling the variables apart and integrating both sides, which is the chain rule used in reverse on purpose.',
      needs: ['what-an-ode-is', 'integration-by-substitution'],
      terms: 'separable equation separation of variables implicit solution',
    },
    {
      id: 'first-order-linear',
      name: 'First-order linear equations',
      is: 'The integrating factor, which turns the left side into a derivative of a product so it can be integrated at all.',
      needs: ['separable-equations', 'product-and-quotient-rules'],
      terms: 'first order linear integrating factor',
    },
    {
      id: 'direction-fields',
      match: /\b(slope field|phase (plane|portrait))\b/i,
      name: 'Direction fields and qualitative behaviour',
      is: 'Reading the long-run behaviour off the equation without solving it — equilibria and their stability.',
      needs: ['what-an-ode-is', 'vector-fields'],
      terms: 'direction field slope field equilibrium stability phase line',
    },
    {
      id: 'second-order-linear',
      name: 'Second-order linear equations',
      is: 'Constant coefficients solved by the characteristic polynomial, where the three root cases are the three physical behaviours.',
      needs: ['first-order-linear', 'complex-numbers'],
      terms: 'second order linear characteristic equation homogeneous damping',
    },
    {
      id: 'nonhomogeneous-equations',
      name: 'Forced equations and resonance',
      is: 'A particular solution plus the homogeneous family, with resonance as what happens when the forcing matches the natural mode.',
      needs: ['second-order-linear'],
      terms: 'nonhomogeneous particular solution undetermined coefficients resonance',
    },
    {
      id: 'series-solutions',
      name: 'Series solutions',
      is: 'Assuming a power series and matching coefficients, which is how the equations with no closed form are handled.',
      needs: ['second-order-linear', 'power-series'],
      terms: 'series solution recurrence frobenius ordinary point',
    },
    {
      id: 'laplace-transform',
      match: /\blaplace transform\b/i,
      name: 'The Laplace transform',
      is: 'Turning a differential equation into an algebraic one, including the initial conditions — which is why it handles discontinuous forcing.',
      needs: ['improper-integrals', 'nonhomogeneous-equations'],
      terms: 'laplace transform inverse transform step function convolution',
    },
    {
      id: 'systems-of-odes',
      name: 'Systems of differential equations',
      is: 'Several coupled unknowns, where the behaviour is read off the eigenvalues of the coefficient matrix.',
      needs: ['second-order-linear', 'eigenvalues'],
      exercises: ['eigenvalues'],
      terms: 'system of odes phase portrait eigenvalue node spiral',
    },
    {
      id: 'numerical-odes',
      match: /\b(euler method|runge(–|-)kutta)\b/i,
      name: 'Numerical solution',
      is: 'Euler and Runge–Kutta: stepping forward with a local error you can bound and a global error you mostly cannot.',
      needs: ['direction-fields', 'linear-approximation'],
      terms: 'euler method runge kutta step size local error stiffness',
    },
    {
      id: 'pde-introduction',
      match: /\bpartial differential equation\b|\b(heat|wave) equation\b/i,
      name: 'Partial differential equations',
      is: 'The heat, wave and Laplace equations, and separation of variables as the one technique that gets a reader started.',
      needs: ['systems-of-odes', 'fourier-series', 'partial-derivatives'],
      terms: 'partial differential equation heat equation wave equation separation of variables',
    },
  ],
}

const REAL_ANALYSIS: MapArea = {
  id: 'real-analysis',
  name: 'Real analysis',
  covers:
    'Calculus proved rather than computed: the completeness of the reals, ε-δ, and the theorems ' +
    'that were taken on trust earlier. Deliberately after calculus — see the file header.',
  nodes: [
    {
      id: 'supremum-and-completeness',
      match: /\b(supremum|infimum|least[- ]upper[- ]bound)\b/i,
      name: 'Supremum and completeness',
      is: 'Every bounded set of reals has a least upper bound. This is the axiom the rationals fail, and every theorem below is downstream of it.',
      needs: ['real-number-line', 'mathematical-induction'],
      terms: 'supremum infimum least upper bound completeness axiom dedekind',
    },
    {
      id: 'epsilon-delta',
      match: /\b(epsilon|\(ε, ?δ\))[- ]?delta\b/i,
      name: 'ε-δ and ε-N',
      is: 'Making "approaches" into a quantified statement, which is what turns limit arguments into proofs.',
      needs: ['supremum-and-completeness', 'limit-of-a-function'],
      terms: 'epsilon delta definition of limit quantifier rigorous',
    },
    {
      id: 'cauchy-sequences',
      match: /\bcauchy sequence\b/i,
      name: 'Cauchy sequences',
      is: 'Terms getting close to each other rather than to a limit — equivalent to convergence in the reals, and that equivalence IS completeness.',
      needs: ['epsilon-delta', 'sequence-convergence'],
      terms: 'cauchy sequence complete space convergence criterion',
    },
    {
      id: 'bolzano-weierstrass',
      match: /\bbolzano(–|-)weierstrass\b/i,
      name: 'Bolzano–Weierstrass',
      is: 'Every bounded sequence has a convergent subsequence — the compactness fact that the extreme value theorem actually rests on.',
      needs: ['cauchy-sequences'],
      terms: 'bolzano weierstrass subsequence bounded accumulation point',
    },
    {
      id: 'rigorous-continuity',
      name: 'Continuity, proved',
      is: 'Continuity in ε-δ terms, and proofs of the intermediate and extreme value theorems that were asserted in calculus.',
      needs: ['bolzano-weierstrass', 'intermediate-value-theorem'],
      terms: 'continuity proof intermediate value extreme value',
    },
    {
      id: 'uniform-continuity',
      match: /\buniform continuity\b|\buniformly continuous\b/i,
      name: 'Uniform continuity',
      is: 'One δ that works everywhere, which is strictly stronger than continuity at every point — and automatic on a closed bounded interval.',
      needs: ['rigorous-continuity'],
      confusedWith: [{
        id: 'rigorous-continuity',
        because:
          'The definitions differ only in the order of two quantifiers, and that is exactly the ' +
          'difference nobody sees on a first reading. x² on the whole line is the example that ' +
          'separates them.',
      }],
      terms: 'uniform continuity quantifier order lipschitz',
    },
    {
      id: 'rigorous-differentiation',
      name: 'Differentiation, proved',
      is: 'The derivative from the definition with proofs of the rules, and the mean value theorem established rather than quoted.',
      needs: ['rigorous-continuity', 'mean-value-theorem'],
      terms: 'differentiability proof mean value theorem rolle darboux',
    },
    {
      id: 'riemann-integral',
      match: /\briemann integral\b/i,
      name: 'The Riemann integral',
      is: 'Upper and lower sums, with integrability defined as their agreement — which makes "is this integrable" a real question.',
      needs: ['rigorous-differentiation', 'definite-integral'],
      terms: 'riemann integral upper sum lower sum darboux integrability',
    },
    {
      id: 'uniform-convergence',
      match: /\buniform convergence\b/i,
      name: 'Uniform convergence',
      is: 'When a limit of functions inherits continuity and commutes with integration — pointwise convergence does neither.',
      needs: ['riemann-integral', 'uniform-continuity', 'infinite-series'],
      terms: 'uniform convergence pointwise weierstrass m test interchange limits',
    },
    {
      id: 'metric-spaces',
      match: /\bmetric space\b/i,
      name: 'Metric spaces',
      is: 'Keeping only the distance function, after which convergence, continuity and completeness all still make sense.',
      needs: ['cauchy-sequences'],
      terms: 'metric space distance function open ball complete separable',
    },
    {
      id: 'measure-zero-and-lebesgue',
      match: /\b(lebesgue (integral|measure)|measure theory|measure \(mathematics\))\b/i,
      name: 'Measure and the Lebesgue integral',
      is: 'Replacing the partition of the domain with a measure on it, which integrates the functions Riemann cannot and makes the limit theorems clean.',
      needs: ['riemann-integral', 'metric-spaces'],
      terms: 'measure lebesgue integral null set almost everywhere dominated convergence',
    },
    {
      id: 'functional-analysis-intro',
      match: /\b(hilbert space|banach space|normed vector space|functional analysis)\b/i,
      name: 'Normed and Hilbert spaces',
      is: 'Vector spaces of functions with a length, where completeness and an inner product recover geometry in infinite dimensions.',
      needs: ['measure-zero-and-lebesgue', 'inner-product-spaces'],
      terms: 'normed space banach hilbert space orthonormal basis operator',
    },
  ],
}

const COMPLEX_ANALYSIS: MapArea = {
  id: 'complex-analysis',
  name: 'Complex analysis',
  covers:
    'Calculus of functions of a complex variable, where differentiability is a far stronger ' +
    'condition than it is on the line.',
  nodes: [
    {
      id: 'complex-functions',
      match: /\bcomplex (analysis|function)\b/i,
      name: 'Functions of a complex variable',
      is: 'A map of the plane to itself, which cannot be graphed — so the pictures are of what it does to regions.',
      needs: ['complex-polar-form', 'functions-of-several-variables'],
      terms: 'complex function mapping region image',
    },
    {
      id: 'complex-limits',
      name: 'Limits and continuity in the plane',
      is: 'Approach from every direction at once, which is what makes complex differentiability so restrictive.',
      needs: ['complex-functions', 'epsilon-delta'],
      terms: 'complex limit continuity approach from any direction',
    },
    {
      id: 'holomorphic-functions',
      match: /\b(holomorphic|cauchy(–|-)riemann|analytic function)\b/i,
      name: 'Holomorphic functions and Cauchy–Riemann',
      is: 'Complex differentiability, equivalent to a pair of partial differential equations, and it forces the real and imaginary parts to be harmonic.',
      needs: ['complex-limits', 'partial-derivatives'],
      terms: 'holomorphic analytic cauchy riemann equations harmonic conjugate',
    },
    {
      id: 'contour-integration',
      match: /\bcontour integration\b/i,
      name: 'Contour integration',
      is: 'A line integral in the plane, taken along a curve chosen for convenience rather than given by the problem.',
      needs: ['holomorphic-functions', 'line-integrals'],
      terms: 'contour integral path complex integration',
    },
    {
      id: 'cauchy-integral-theorem',
      match: /\bcauchy('|’)?s (integral )?(theorem|formula)\b/i,
      name: "Cauchy's theorem and integral formula",
      is: 'A holomorphic function integrates to zero round a closed loop, and its values inside are determined by its values on the boundary.',
      needs: ['contour-integration', 'greens-stokes-divergence'],
      terms: 'cauchy integral theorem integral formula simply connected',
    },
    {
      id: 'complex-power-series',
      match: /\blaurent series\b/i,
      name: 'Taylor and Laurent series',
      is: 'Holomorphic means analytic — infinitely differentiable and locally a power series, which has no real-variable analogue.',
      needs: ['cauchy-integral-theorem', 'power-series'],
      terms: 'taylor series laurent series annulus principal part',
    },
    {
      id: 'singularities',
      match: /\b(singularity \(mathematics\)|essential singularity|pole \(complex analysis\)|residue \(complex analysis\))\b/i,
      name: 'Singularities and residues',
      is: 'Classifying the ways a function fails to be holomorphic at a point, and the one coefficient that an integral around it depends on.',
      needs: ['complex-power-series'],
      terms: 'pole essential singularity removable residue',
    },
    {
      id: 'residue-theorem',
      match: /\bresidue theorem\b/i,
      name: 'The residue theorem',
      is: 'Evaluating a contour integral by summing residues, which computes real integrals no real method reaches.',
      needs: ['singularities'],
      exercises: ['improper-integrals'],
      terms: 'residue theorem evaluate real integral contour',
    },
    {
      id: 'conformal-maps',
      match: /\bconformal map\b/i,
      name: 'Conformal mapping',
      is: 'Holomorphic maps preserve angles, so they transport a solved boundary-value problem from one region to another.',
      needs: ['holomorphic-functions'],
      terms: 'conformal map angle preserving mobius transformation riemann mapping',
    },
    {
      id: 'analytic-continuation',
      match: /\banalytic continuation\b/i,
      name: 'Analytic continuation',
      is: 'A holomorphic function is determined by its values on any small disc, so an extension, if it exists, is unique.',
      needs: ['complex-power-series'],
      terms: 'analytic continuation identity theorem monodromy zeta function',
    },
  ],
}

export const ANALYSIS_AREAS: MapArea[] = [
  SEQUENCES_AND_SERIES,
  LIMITS_AND_CONTINUITY,
  DIFFERENTIAL_CALCULUS,
  INTEGRAL_CALCULUS,
  MULTIVARIABLE_CALCULUS,
  DIFFERENTIAL_EQUATIONS,
  REAL_ANALYSIS,
  COMPLEX_ANALYSIS,
]
