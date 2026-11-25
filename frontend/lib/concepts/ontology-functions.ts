/**
 * A fourth subject: what a function is, and the three things you do to one.
 *
 * ── Why this subject, and why it does NOT move the entry point ────────────
 *
 * ontology-arithmetic.ts was authored *beneath* the algebra syllabi, and the
 * consequence was that it tightened the gate — the entry point moved down and
 * `polynomial-arithmetic` stopped being introducible on a cold account. That
 * is correct behaviour and it was worth stating loudly.
 *
 * This subject sits ABOVE the algebra, and the consequence is different —
 * though not as simple as "it changes nothing", which is what this paragraph
 * said until a test disagreed with it.
 *
 * Authoring these four DID create gates. `graphs-of-functions` rests on
 * `domain-and-range`, and while that was mapped-only `gatingPrerequisitesOf`
 * looked straight through it; now it is teachable, so it gates, and so
 * transitively does every one of the ~170 nodes above it — all of calculus,
 * analysis, topology. That is a lot of new gates.
 *
 * What is true, and is the thing worth asserting, is narrower: NO CONCEPT
 * ANYBODY CAN PRACTISE GAINED A GATE. Everything that acquired one is
 * mapped-only and has no task to serve, so no learner's session changes. The
 * gates arrive ahead of the material, which is the right order — the day
 * somebody authors `graphs-of-functions` it will already rest on a domain
 * concept that exists.
 *
 * The precise claim is in tests/atlas.mjs: no *teachable* concept outside this
 * subject gates on one of its concepts.
 *
 * ── What it covers, and the line it stops at ──────────────────────────────
 *
 * Four concepts in one chain: what a function is, where it is defined, what
 * happens when you feed one into another, and what it means to undo it. That
 * is the part of the functions area whose questions have exactly-checkable
 * answers.
 *
 * ── A FIFTH CONCEPT, AND IT CAME FROM A DIFFERENT AREA ────────────────────
 *
 * `sequences` was a node of `sequences-and-series` in atlas-analysis.ts and is
 * authored here, which is the first concept this subject has taken from an
 * area other than `functions`. The justification is the node's own one-liner,
 * which is why it was promoted here rather than into a subject of its own: "a
 * function on the naturals, given by a formula or by a recurrence, and those
 * two are not interchangeable". A sequence is not LIKE a function on the
 * positions; it is one, and the only thing it adds to `function-concept` is
 * that the input is an index. Filing it anywhere else would have made that
 * identity a remark instead of the structure.
 *
 * The precedent for the area/subject split is `cartesian-plane` and
 * `three-dimensional-coordinates`, both geometry-area nodes authored into
 * `vectors-and-independence`. An area is a region of the MAP a learner is
 * shown; a subject is a syllabus with problems in it, and the two have never
 * been required to agree.
 *
 * It does NOT break the chain, it hangs off the root of it. `function-concept`
 * is its only prerequisite, so the subject became a chain of four with one
 * branch at the bottom — the first fork this ontology has had, and the reason
 * tests/atlas.mjs checks the edges here by name rather than by position. The
 * sixth concept below extended that branch rather than adding another, so the
 * shape is now two chains sharing a root.
 *
 * WHAT IT DELIBERATELY LEAVES BEHIND, because the nodes that rested on it are
 * still mapped and this concept must not pre-empt them. Nothing here teaches
 * the closed form of an arithmetic sequence from its first term and common
 * difference, the geometric closed form, or any sum — those are
 * `arithmetic-sequences` and `geometric-sequences`, which stayed.
 * `sigma-notation` was named here as a third until it was authored below, and
 * the boundary it draws is in the next section; the two named families are
 * still on the map and still own their closed forms.
 * The third knowledge point does use a concrete arithmetic sequence as
 * its vehicle, because formula-against-recurrence needs a sequence that can be
 * written both ways and that is the cheapest honest one; what it asks about is
 * the COST of reaching position n by each route, never the general formula.
 * The test a reader can apply is that no knowledge point, prompt or `given` in
 * this concept names a first term and a common difference as SYMBOLS — every
 * sequence it mentions is a specific one, and the generalisation over all
 * arithmetic sequences is the node that stayed.
 *
 * ── A SIXTH CONCEPT, FROM THE SAME AREA AND ONE STEP ABOVE THE FIFTH ──────
 *
 * `sigma-notation` was the node directly above `sequences` in
 * `sequences-and-series` and is authored here, which makes this branch a chain
 * of its own: `function-concept` → `sequences` → `sigma-notation`. It is the
 * first promotion in the build to follow the previous one UP the same area
 * rather than starting somewhere new, and that is the whole reason it was
 * cheap: its only `needs` was `sequences`, which the fifth promotion had just
 * made a concept of this file, so the stranded edge could come here and the
 * area's `links` stayed empty for a second time. A promotion out of this area
 * whose node names a prerequisite living anywhere else still costs a `links`
 * entry; nothing about either of these two made that go away.
 *
 * It was NOT chosen because a journey wanted it. Every one of the ten journeys
 * in journeys.ts reads zero unwritten steps on route, and has since the
 * fourteenth promotion, so route demand ranks nothing and this was selected on
 * three other grounds: a finite sum IS a plain number, so every knowledge point
 * gets a real `evaluate` task; its one prerequisite is inside one ontology; and
 * five mapped nodes rest on it — `mathematical-induction`, `infinite-series`,
 * `riemann-sums`, `expectation` and `descriptive-statistics` — which is more
 * than any other rulable candidate had. THREE of those five are still mapped,
 * and the two that are not went to two different places, which is the part
 * worth reading. `mathematical-induction` was authored HERE, the ninth concept,
 * so that edge is in `EDGES` below rather than on a node.
 * `descriptive-statistics` went to `data-summaries`, the eleventh subject, and
 * its edge could NOT come here — an ontology may only name concepts it contains
 * — so it is a `links` entry on `STATISTICS` in atlas-uncertainty.ts instead.
 * Same promotion shape, two different filings, and which one you get depends
 * entirely on whether the dependent landed in this subject.
 *
 * WHAT IT LEAVES BEHIND IN TURN, and the line is in the same place the fifth
 * concept drew it. This teaches the NOTATION and the two rearrangements, which
 * is exactly what the node's own one-liner promised. It does not sum an
 * arithmetic progression by pairing the ends, and it does not carry the
 * geometric closed form: those two arguments are the content of the two nodes
 * that stayed, and a worked example that totalled 5 + 7 + 9 + 11 by pairing
 * would have taken `arithmetic-sequences`'s only real idea while leaving its
 * node on the map. So the first example sums k² − 1, whose differences are
 * 7, 9, 11 and which therefore has no pairing shortcut to be tempted by, and
 * the linearity example is handed the total of its terms rather than a rule
 * for them.
 *
 * ── A SEVENTH CONCEPT, AND THE INPUT STOPS BEING A SINGLE NUMBER ──────────
 *
 * `functions-of-several-variables` was the root node of
 * `multivariable-calculus` in atlas-analysis.ts and is authored here, the
 * twenty-first promotion. It is the third concept this subject has taken from
 * the analysis file and the first from a region of it above the sequences.
 *
 * WHY THIS SUBJECT rather than a multivariable one of its own: the node's own
 * one-liner is "a function of a point rather than a number", and that is a
 * claim about what the INPUT is, which is the axis this subject is organised
 * on. `function-concept` establishes that one input gives one output,
 * `sequences` changes the input to an index, and this changes it to a pair.
 * Three concepts, one move each, on the same thing. Founding an eleventh
 * ontology for it would have made the progression a coincidence of filing.
 *
 * WHY THIS NODE, since no journey asked for it — all ten still read zero
 * unwritten steps on route, as they have since the fourteenth promotion, and
 * no area is near the stub floor either. Three grounds, in the order they were
 * applied:
 *
 *  1. IT IS RULABLE WITH NO WORKER. Evaluating a rule in two letters at a
 *     stated pair is exact rational arithmetic and nothing else, so every
 *     knowledge point gets a real `evaluate` task. That was the first filter
 *     and it is what eliminated the candidate with the most dependents —
 *     `graphs-of-functions`, whose refusal is two sections below and which
 *     survives re-examination because it names the MOVE and not the answer's
 *     shape.
 *  2. IT WAS THE SOLE ROOT OF A TWELVE-NODE AREA. Every node of
 *     `multivariable-calculus` was gated behind this one unwritten concept, so
 *     `gatingPrerequisitesOf` was answering for all twelve of them two files
 *     away. That is a stronger and more computable signal than dependent
 *     count: `roots(areaOntology(AREA))` returns it per area.
 *  3. It is not an `armature.ts` anchor, so no region slot had to be refilled.
 *
 * WHAT IT COSTS, which the two promotions before it did not. Its `needs` are
 * `domain-and-range` — a concept of THIS file, so that edge is an ordinary
 * `EDGES` entry below — and `three-dimensional-coordinates`, which is a
 * concept of `vectors-and-independence`. Two authored subjects, so neither
 * ontology may name that edge, and it is the first `links` entry
 * `multivariable-calculus` has ever carried. The run of two promotions that
 * cost this subject no `links` entry is over, and it ended for the reason the
 * section above predicted rather than for a new one.
 *
 * THAT SECOND EDGE GATES AND EARNS NOTHING BACK, stated because the asymmetry
 * is real and is not an oversight. Nothing in the material below uses a third
 * coordinate: the pairs are pairs, and the surface a learner would draw to
 * picture z = f(x, y) is exactly the part that stays mapped. So the
 * prerequisite is preserved as the map declared it — it is the map's claim
 * about what a learner should have met first, not this file's to revise — and
 * there is deliberately no `encompasses` edge running back to it, because
 * practising any of the six tasks exercises no part of three-dimensional
 * coordinates at all.
 *
 * WHAT IT LEAVES BEHIND. The node's one-liner also says "pictured by level
 * curves instead of a graph", and the picture is the half that does not come.
 * A level curve is a claim about a drawing, which is the same boundary
 * `graphs-of-functions` sits behind and the sharper case of it: there, the
 * curve is at least a curve in the plane the learner already has, and here the
 * object being drawn is a surface. So nothing below mentions a contour, and
 * `partial-derivatives` — the one node this promotion releases to the root set
 * — still owns the derivative along a slice. What IS here is the slice itself,
 * which is the algebra under that whole picture: fix one letter and a rule in
 * the other is left. A learner who cannot do that substitution cannot be
 * taught a partial derivative, and it needs no figure.
 *
 * ── AN EIGHTH CONCEPT, AND IT COLLECTS A DEBT THIS FILE WROTE DOWN TWICE ──
 *
 * `arithmetic-sequences` was a node of `sequences-and-series` in
 * atlas-analysis.ts and is authored here, the twenty-sixth promotion. It is the
 * fourth concept this subject has taken from the analysis file and the third
 * from that one area, so the branch at the foot is now `function-concept` →
 * `sequences` → {`sigma-notation`, `arithmetic-sequences`} — a fork, where it
 * was a chain of three.
 *
 * WHY THIS NODE, and the first ground is unlike any earlier selection here: the
 * content was RESERVED FOR IT IN WRITING, in this file and in tasks.ts, by the
 * two promotions that came out of the same area. The fifth concept's section
 * above says "nothing here teaches the closed form of an arithmetic sequence
 * from its first term and common difference ... those are
 * `arithmetic-sequences` and `geometric-sequences`, which stayed". The sixth's
 * says a worked example "that totalled 5 + 7 + 9 + 11 by pairing would have
 * taken `arithmetic-sequences`'s only real idea while leaving its node on the
 * map", and chose a non-arithmetic sum to avoid it. And the `sequences` block
 * in tasks.ts names an "honest gap" — "Which term equals 302" inverts the
 * formula, and the answer is an index rather than a term — and says it "belongs
 * to `arithmetic-sequences` with the closed form it needs, which is still
 * mapped". All three are now spent, and the three knowledge points below are
 * those three sentences in order: the closed form, the inversion, the pairing.
 *
 * That is a better selection signal than any of the three this build has used,
 * and it is worth naming as a general one: a promotion that collects content a
 * previous promotion deliberately declined to pre-empt cannot overlap anything
 * already written, because the boundary was drawn from the other side first.
 *
 * The other grounds, in the order they were applied:
 *
 *  1. IT IS RULABLE WITH NO WORKER. A term, a position and a total are each a
 *     plain rational, so every knowledge point gets a real `evaluate` task and
 *     `exactValue` settles all three. No `sqrt`, no named function.
 *  2. ITS ONE `needs` POINTED INSIDE THIS ONTOLOGY. `sequences` and nothing
 *     else, so the stranded edge comes to `EDGES` below and
 *     `SEQUENCES_AND_SERIES.links` stays empty for a THIRD time — which is
 *     still a fact about this node's prerequisites and not about that area
 *     being tidy. `mathematical-induction` is still sitting in that list unable
 *     to avoid an entry, and the note where this node sat says so. That
 *     prediction was collected by the NINTH concept below: the induction is
 *     authored here, its `geometric-proof` edge is that area's first `links`
 *     entry, and the run of three empty-`links` promotions is over for exactly
 *     the reason this clause gave.
 *  3. IT HAS NO DEPENDENTS AT ALL, which is the axis it loses on and the reason
 *     it is third. Nothing on the map and nothing authored declares
 *     `needs: ['arithmetic-sequences']` — `geometric-sequences` rests on
 *     `sequences` and `exponential-functions`, not on this. So this promotion
 *     creates no gate anywhere, measured rather than assumed, and it is the
 *     first in this subject of which that is true. Rulability outranks
 *     dependent count by the rule atlas-foundations.ts states — a concept that
 *     cannot be ruled produces a chain that cannot become evidence — and the
 *     candidate with the most dependents is still `graphs-of-functions`, still
 *     refused two sections below.
 *
 * WHAT IT LEAVES BEHIND. `geometric-sequences` keeps its closed form and its
 * sum to infinity, exactly as the fifth concept's section promised, and nothing
 * below mentions a common ratio. The one place the two families meet in this
 * material is the third point's fourth subgoal, which says what to do when the
 * count of terms is odd; that argument is about pairing and is this concept's
 * either way.
 *
 * ── The interference was ALREADY DECLARED, FROM THE OTHER END ──────────────
 *
 * atlas-analysis.ts told whoever promoted either of the two named families
 * that the `confusedWith` between them "must be re-declared in the receiving
 * ontology's `EDGES`, with its `rationale`, or it is gone without a sound".
 * For THIS end that instruction is wrong, and following it was impossible, so
 * the reason is recorded here as well as there.
 *
 * `expandEdges` walks an area's OWN nodes. The `confusedWith` is written on
 * `geometric-sequences`, which stayed, so the area still declares it and
 * `composeAtlas` still emits `geometric-sequences ~ arithmetic-sequences` with
 * both endpoints present — the authored concept and the map node. Nothing was
 * stranded. That is the same rule atlas-foundations.ts had to correct itself
 * over for `needs`: an edge is owned by the node that DECLARES it, and this
 * promotion did not touch the declaring end.
 *
 * And obeying the instruction would have failed two ways. An `interferes_with`
 * in `EDGES` here naming `geometric-sequences` makes `ontologyProblems` report
 * an unknown endpoint, because an ontology may only name concepts it CONTAINS.
 * A `links` entry cannot carry it either — `expandEdges` hard-codes
 * `kind: 'prerequisite'` there, and `links` is for edges the area owns NEITHER
 * end of, which is not this. So the only two places it could go both reject it,
 * and the one place it already lives is the right one. The instruction is
 * correct for promoting `geometric-sequences`, the declaring end, and only
 * there; the note in that file now says which end it means.
 *
 * ── Why both objectives name only `evaluate` ──────────────────────────────
 *
 * Every other concept in this file names `justify` alongside it, and there is
 * not one `justify` task in the build — the kind is declared `verifiable:
 * false` in types.ts and nothing will ever rule one. An objective names the
 * kinds that would EVIDENCE it, so naming a kind that ships no tasks is an
 * objective nothing can satisfy, which is the exact fault `ontologyProblems`
 * reports for an empty `taskKinds` list and does not catch for a populated one
 * that is unreachable in practice.
 *
 * The questions worth asking here that `evaluate` cannot rule — why the rule
 * alone does not determine the sequence, what the formula buys at position 100
 * — are in the subgoals' `socratic` phrasings, where a tutor asks them and
 * nothing pretends to mark them. That is the right home for an unrulable
 * question, and it is not a reduction of the concept: it is the difference
 * between asking something and claiming to have measured it.
 *
 * `sigma-notation` holds to the same rule for the same reason, and it has more
 * to keep out: the two rearrangements ARE its content, and the kind that would
 * ask for one — `transform_to_form`, "rewrite this with the constants
 * outside" — needs a `NamedForm` that could see a sigma, which nothing in
 * forms.ts can. So the rearrangement is performed in the worked example, the
 * `evaluate` task rules the number it leaves, and the questions about WHY the
 * 3 may come out and a square may not are in the subgoals. Naming `justify`
 * or `transform_to_form` in those objectives would have described a concept
 * this build does not serve.
 *
 * `arithmetic-sequences` holds to it too, and its keeping-out is the sharpest
 * of the three because the node's own one-liner says "the argument, not the
 * formula, is the content". The argument is that stepping one place in from
 * each end at once leaves the pair's total unchanged, and the kind that would
 * ask for it is `justify`. So the argument is made in the third point's
 * subgoals, the `evaluate` task rules the total it produces, and the two
 * objectives name only what that task can evidence. Naming `justify` would
 * have been a truer description of the concept and an unreachable one.
 *
 * It stops at `graphs-of-functions` deliberately, and the boundary is the
 * verifier rather than the curriculum. Reading a graph is the natural next
 * concept and most of what makes it worth teaching — where the curve turns,
 * what it approaches — is a claim about a picture. `ruleEvaluate` settles
 * exact rational arithmetic; it cannot rule "the graph is increasing here",
 * and a task that asked it and then graded by keyword would be the proxy
 * failure tasks.ts warns about dressed as a feature. So the graph stays on the
 * map, and everything above it stays mapped with it.
 *
 * THAT REFUSAL WAS RE-EXAMINED AT THE SEVENTH CONCEPT AND IT HELD, which is
 * worth recording because four refusals elsewhere in this build have expired
 * on inspection and every one of them described the ANSWER'S SHAPE — a set, a
 * point, a matrix, a cosine — which can almost always be swapped for a
 * deciding number. This one describes the MOVE: the content of reading a graph
 * is a judgement about a drawing, and there is no number behind it to swap to.
 * It also has the problem one step earlier than the others, in the STIMULUS:
 * `visualRef` is to be omitted unless a figure genuinely exists, so there is
 * no graph to put in front of the learner in the first place. `graphs-of-
 * functions` had five dependents, more than any other candidate at the
 * twenty-first promotion, and was passed over on this paragraph.
 *
 * ── Every task is exactly rulable, and two constraints shaped them ────────
 *
 * 1. THE EXPRESSION LANGUAGE HAS NO USER-DEFINED FUNCTIONS. There is no way to
 *    write `f(g(2))` and have the engine know what `f` is. So a composition
 *    task is written as the already-substituted expression — `(2x - 3)^2 + 1`
 *    rather than `f(g(x))` — and the prompt names the two functions it came
 *    from. That is not a workaround: substituting the inner rule where the
 *    outer variable was IS what composition means, and writing it out is the
 *    step a learner gets wrong.
 *
 * 2. `exactValue` RETURNS NULL FOR A `function` NODE. `sqrt(9)` cannot be
 *    settled locally; `9^(1/2)` can, through `exactRoot`. So nothing here uses
 *    a named function even where the mathematics would suggest one — see
 *    `not-every-rule-is-a-function`, which writes the two branches of a circle
 *    as `±(1 - x²)^(1/2)`.
 *
 * ── No `interferes_with` edge, and that is a choice rather than an omission ─
 *
 * The real confusion in this subject is `f⁻¹` against `x⁻¹` — the notation for
 * an inverse function is the notation for a reciprocal, and they are unrelated
 * operations. But the reciprocal lives in `zero-and-negative-exponents`, in
 * the exponents subject, and an `interferes_with` edge whose far endpoint is
 * not in this ontology fails `ontologyProblems` on the subject viewed alone.
 * Cross-area edges belong to the atlas, and `MapArea.links` carries
 * prerequisites only.
 *
 * Rather than invent a within-subject pair to have one, the confusion is
 * taught where it actually helps — in the worked example for
 * `an-inverse-undoes-the-rule`, which is where a learner meets the notation.
 * An authored interference that nobody believes is worse than none.
 *
 * ── A NINTH CONCEPT, AND IT IS THE FIRST METHOD OF ARGUMENT IN HERE ───────
 *
 * `mathematical-induction` was a node of `sequences-and-series` in
 * atlas-analysis.ts and is authored here, the thirty-second promotion. It is
 * the fifth concept this subject has taken from the analysis file and the
 * FOURTH from that one area, which is more than any other area has given to
 * any other subject.
 *
 * WHY THIS SUBJECT, and this is the first filing decision in this file that
 * was genuinely close rather than settled by the node's own one-liner. Every
 * concept here so far has been an OBJECT organised on what its input is — a
 * number, an index, a pair — and this one is a method of proof. So the test
 * ontology-geometry.ts states for founding a new subject ("every existing
 * subject declares a boundary in its `covers` that this falls outside of")
 * arguably passes: induction is not a function, and `plane-geometry` is about
 * the plane figure and says in its own file that the MAP places induction
 * above `geometric-proof` rather than inside it.
 *
 * What decided it instead is the rule `radical-equations` was filed by, which
 * is about COST and is measurable rather than editorial: a home that holds
 * NEITHER prerequisite leaves the concept edge-isolated and costs TWO `links`
 * entries. The node declared `needs: ['sigma-notation', 'geometric-proof']`.
 * A new subject holds neither, so both edges would have become `links`
 * entries on the area; this subject holds `sigma-notation`, so exactly one
 * does. One entry against two, and the one it keeps is the one whose far end
 * is in a subject that will never contain a sum.
 *
 * THE OPEN QUESTION THAT DECISION DOES NOT CLOSE, stated so the next run does
 * not have to rediscover it: whether this build wants a REASONING subject.
 * `propositional-logic` is a node of `discrete-mathematics`, is ready, needs
 * only `geometric-proof`, and is the obvious second member of one — and so is
 * `geometric-proof` itself, which would have to MOVE out of `plane-geometry`
 * for such a subject to be more than a pair of strays. That is a change to
 * the learner-facing syllabus of two existing subjects, which is the same
 * family of decision as merging a drained map area, and it is not an
 * authoring run's to take. If it is ever taken, this concept moves with it
 * and the `links` entry on `SEQUENCES_AND_SERIES` becomes an ontology edge.
 *
 * THAT QUESTION IS STILL OPEN AND ONE OF ITS THREE PIECES HAS MOVED.
 * `propositional-logic` is an authored concept as of the thirty-fifth
 * promotion, in a twelfth subject of its own — `statements-and-connectives`,
 * ontology-logic.ts. What that subject deliberately does NOT do is claim the
 * reasoning layer: it holds letters standing for whole statements and the
 * finite tables that join them, and its `covers` disclaims proof technique and
 * the quantifiers by name, so it is a concept that would MOVE into a reasoning
 * subject rather than a subject that pre-empts one. The paragraph above is
 * therefore unchanged in substance — the decision still needs a person, and it
 * still has to move `geometric-proof` to be worth taking — and what it would
 * now consolidate is three authored concepts in three subjects rather than two
 * concepts and a map node. The cost of that has gone up, which is a reason to
 * put the question in front of somebody rather than to leave it drifting.
 *
 * WHY THIS NODE, since no journey asked for it — all ten have read zero
 * unwritten steps on route since the fourteenth promotion, and the two map
 * areas closest to the stub floor (`algebra-foundations` and `linear-algebra`,
 * both at six against five) are the ones a promotion must now leave alone,
 * since the next departure from either IS the merge decision. Three grounds,
 * in the order applied:
 *
 *  1. IT IS RULABLE, AND THE REFUSAL THAT LOOKS LIKE IT APPLIES DOES NOT.
 *     "Every chain ends in an argument and `justify` is not machine-rulable"
 *     is what held `geometric-proof` back for one promotion, and
 *     `bza`'s own history records that it expired: an argument-shaped concept
 *     ships rulable tasks when you ask for the VALUE the argument turns on.
 *     Here the step is a factorisation — `transform_to_form` with `factored`,
 *     equivalence plus shape, no worker — and the base case is two numbers
 *     compared. Six tasks, two per point, every one exact rational
 *     arithmetic.
 *  2. THREE DEPENDENTS, which was the most of any candidate not under a live
 *     refusal: `supremum-and-completeness` in `real-analysis`, and
 *     `combinatorial-identities` and `trees` in `discrete-mathematics`. All
 *     three declare the edge themselves and none of their files was touched.
 *  3. It is not an `armature.ts` anchor. The Kalkreath Mountains region is
 *     this area's, and its three anchors are `sequence-convergence`,
 *     `infinite-series` and `convergence-tests`, all of which stayed — so no
 *     region slot had to be refilled.
 *
 * WHAT IT MUST NOT PRE-EMPT, and the answer is the same node the sixth
 * concept wrote around. `arithmetic-sequences` owns deriving the total of a
 * run by pairing the ends, and the first worked example below proves
 * 1 + 2 + … + n = n(n + 1)/2 — which IS an arithmetic sum, and whose pairing
 * derivation is that concept's. The two are not the same material and the
 * distinction is the pedagogical point rather than a dodge: pairing DERIVES
 * the formula from nothing, and induction VERIFIES a formula it is handed. A
 * learner who can do one still cannot do the other. Nothing below pairs
 * anything, nothing below derives n(n + 1)/2 from scratch, and the formula
 * arrives in the problem statement as a claim rather than as a result.
 *
 * WHAT IT LEAVES BEHIND. Strong induction, named in the node's `terms` and
 * absent here, which is the one gap worth stating: assuming every earlier
 * case rather than just the previous one needs a claim whose instances are
 * not reached one at a time, and the standard examples are the existence of a
 * prime factor and the closed form of a two-term recurrence. The first is
 * `prime-factorisation`'s territory with an induction on top, and the second
 * needs a recurrence that `sequences` introduces and no concept here solves.
 * So what is written is ordinary induction, three times, on three different
 * kinds of claim — and the third point is there precisely so the concept does
 * not read as a fact about sums.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'functions-and-inverses',
  name: 'Functions and inverses',
  covers:
    'What a function is and the three things done to one: where it is defined, what happens ' +
    'when one is fed into another, and what undoing it requires. Then the case where the input ' +
    'is a position rather than a number — a sequence, given by a formula or by a recurrence, ' +
    'and what each of those two costs to reach the hundredth term. Then the notation for adding ' +
    'a sequence up: which terms the limits name, and the two rearrangements that make such a ' +
    'sum manipulable rather than only readable. Then the case where the input is a PAIR: ' +
    'matching each number to the letter whose place it stands in, holding one letter fixed to ' +
    'leave a rule in the other, and a domain that is a condition on the two coordinates ' +
    'together rather than a list of forbidden numbers. Then the first named family of sequence: ' +
    'a constant difference, the term at any position, which position a given value occupies if ' +
    'it occupies one, and the total of a run of them obtained by pairing the ends rather than ' +
    'by adding. Then the one thing here that is a method of ARGUMENT rather than an object: ' +
    'proving a claim for every natural by proving it is inherited — what instance the step has ' +
    'to land on and why it is written down before the algebra starts, why a claim can be ' +
    'inherited perfectly and be false at every natural so that the base case is a computation ' +
    'rather than a formality, and what the step becomes when the claim is not about a sum and ' +
    'there is no term to add. Strong induction is named as absent: assuming every earlier case ' +
    'rather than the previous one needs a claim whose instances are not reached one at a time, ' +
    'and the natural examples are about prime factors and recurrences that sit elsewhere. ' +
    'Nothing about graphs — reading a curve ' +
    'is the natural next step and its questions are about a picture, which this verifier cannot ' +
    'rule — and so nothing about transformations, families or asymptotes either, and nothing ' +
    'about level curves or surfaces, which are the same boundary one dimension further out; ' +
    'and nothing about the OTHER named family, whose constant ratio, closed form and sum to ' +
    'infinity are still on the map.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'function-concept',
    name: 'What a function is',
    subjectId: subject.id,
    scope: {
      id: 'function-concept',
      label: 'The function concept',
      hint: 'function mapping input output well defined',
      match: /\b(function|mapping|well[- ]defined|single[- ]valued|vertical[- ]line test|input and output)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'apply-a-rule',
        statement:
          'Apply a function to an input, including an input that is itself an expression, and ' +
          'say why a rule that gives two answers is not a function.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'one-output-per-input',
        conceptId: 'function-concept',
        statement:
          'A function assigns exactly one output to each input. The uniqueness is the whole ' +
          'content of the definition — everything else about functions is built on being able ' +
          'to say "the" value rather than "a" value.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f(4), and say what the definition guarantees.',
          subgoals: [
            {
              label: 'Put the input where the variable is',
              detail: 'Every x in the rule becomes 4: 3·4 − 2.',
              socratic:
                'f(4) has to come out as a number, but the rule as written still mentions x. ' +
                'What has to become of the x, and how many places in the rule does that affect?',
            },
            {
              label: 'Compute',
              detail: '12 − 2 = 10.',
              socratic:
                'There is no x left in 3·4 − 2, so this is ordinary arithmetic now. Which of ' +
                'the two operations goes first, and what does that leave you with?',
            },
            {
              label: 'What "exactly one" bought you',
              detail:
                'There is no second answer to look for, which is why "f(4)" names a number ' +
                'rather than a set. That is what makes it legal to write f(4) inside a larger ' +
                'expression at all — a rule returning two values could not be substituted into ' +
                'anything.',
              socratic:
                'You wrote down one number for f(4) and never had to ask whether there was a ' +
                'second. Suppose some rule did return two answers for the same input — what ' +
                'could you no longer do with the symbol f(4)?',
            },
          ],
          answer: '10',
        },
      },
      {
        id: 'the-input-can-be-an-expression',
        conceptId: 'function-concept',
        statement:
          'The variable in a rule is a placeholder, not a name. Whatever you put in its place ' +
          'goes in everywhere it appears — a number, another letter, or a whole expression.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f(x + 1) at x = 4.',
          subgoals: [
            {
              label: 'Substitute the whole expression',
              detail:
                'The placeholder becomes (x + 1), brackets and all: 3(x + 1) − 2. Dropping the ' +
                'brackets gives 3x + 1 − 2, which is a different rule — the commonest error here ' +
                'and the same one as subtracting a bracket.',
              socratic:
                'Last time the thing going into the placeholder was a single number; this time ' +
                'it is the two-term expression x + 1, and the rule triples its input before ' +
                'subtracting. What exactly is it that gets tripled here, and what different ' +
                'rule would 3x + 1 − 2 be?',
            },
            {
              label: 'Now put the number in',
              detail: 'At x = 4 the input is 5, so 3·5 − 2 = 13.',
              socratic:
                'The input to f was written as x + 1, and now x is 4. What does f actually ' +
                'receive — and what makes that different from the 4 you were handed?',
            },
            {
              label: 'Check it against the other order',
              detail:
                'f(4) = 10 and f(5) = 13. f(x + 1) at x = 4 must equal f(5), and it does — which ' +
                'is the check that the substitution was done to the input rather than to the ' +
                'output.',
              socratic:
                'f(4) is 10, and this came out as 13 — a gap of 3, not 1. If the + 1 had been ' +
                'applied to the output of f instead of to its input, what would you have got, ' +
                'and which of the two does 13 rule out?',
            },
          ],
          answer: '13',
        },
      },
      {
        id: 'not-every-rule-is-a-function',
        conceptId: 'function-concept',
        statement:
          'x² + y² = 1 is a perfectly good relation and not a function: at x = 0 it allows both ' +
          'y = 1 and y = −1. A rule fails to be a function the moment one input has two outputs.',
        position: 3,
        workedExample: {
          problem:
            'The unit circle gives y = ±(1 − x²)^(1/2). Show it is not a function by measuring ' +
            'the gap between its two branches at x = 0.',
          subgoals: [
            {
              label: 'Name both candidate outputs',
              detail:
                'The positive branch is (1 − x²)^(1/2) and the negative branch is its negation. ' +
                'At x = 0 those are 1 and −1.',
              socratic:
                'Every rule you have substituted into so far had a single expression after the ' +
                'equals sign; this one has a ± in front of the root. What does that symbol stand ' +
                'for here, and what does it hand you at x = 0?',
            },
            {
              label: 'Measure the gap',
              detail:
                'Subtracting one from the other gives 1 − (−1) = 2. A gap of zero would mean the ' +
                'two branches agreed and there was only ever one output.',
              socratic:
                'You now have 1 and −1 sitting at the same input. Subtracting one from the other ' +
                'turns "these look different" into a number — what would that number have to be ' +
                'for the two branches to have been the same rule all along?',
            },
            {
              label: 'Read off the conclusion',
              detail:
                'The gap is not zero, so x = 0 has two outputs and the relation is not a ' +
                'function. This is exactly what the vertical-line test draws: a vertical line at ' +
                'x = 0 crosses the circle twice.',
              socratic:
                'The gap came out as 2 rather than 0. Which clause of the definition from the ' +
                'first example has that broken, and what would a vertical line drawn at x = 0 do ' +
                'to this curve?',
            },
            {
              label: 'And how it is repaired',
              detail:
                'Keeping only the positive branch gives a function. That is a restriction, not a ' +
                'discovery — the circle did not become a function, a part of it was chosen.',
              socratic:
                'Discarding the negative branch leaves something that no longer fails that test, ' +
                'and yet the circle itself is exactly the equation it was before. So what was it ' +
                'that actually changed, and what did the repair cost you?',
            },
          ],
          answer: 'The gap is 2, so there are two outputs at x = 0 and it is not a function',
        },
      },
    ],
  },

  {
    id: 'domain-and-range',
    name: 'Domain and range',
    subjectId: subject.id,
    scope: {
      id: 'domain-and-range',
      label: 'Domain and range',
      hint: 'domain range codomain where a function is defined',
      match: /\b(domain|range|codomain|excluded (value|point)s?|where .{0,20}defined)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-where-a-rule-works',
        statement:
          'Find the inputs a rule cannot take and say what goes wrong at each, and name what the ' +
          'rule actually reaches.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-domain-is-where-the-rule-works',
        conceptId: 'domain-and-range',
        statement:
          'The domain is every input the rule can accept. For a quotient that means everywhere ' +
          'the denominator is not zero — and the way to find the exclusions is to ask what makes ' +
          'it vanish, not to look at the fraction and guess.',
        position: 1,
        workedExample: {
          problem: 'Where is f(x) = 1/(x − 3) undefined? Evaluate the denominator there.',
          subgoals: [
            {
              label: 'Ask what breaks the rule',
              detail:
                'Division is defined for every pair except a zero divisor, so the only way this ' +
                'rule can fail is x − 3 = 0.',
              socratic:
                'Every input you have put into 3x − 2 came back with a number, because tripling ' +
                'and subtracting never refuse anything. This rule divides instead. Which part of ' +
                'it is capable of refusing an input, and what would have to happen to that part ' +
                'for the refusal to occur?',
            },
            {
              label: 'Solve for that input',
              detail: 'x = 3. The denominator at x = 3 is 3 − 3 = 0.',
              socratic:
                'What you have now is an equation, x − 3 = 0, rather than a fraction to look at ' +
                'and judge. Which input does solving it pick out — and when you put that input ' +
                'back into x − 3, what does it come out as?',
            },
            {
              label: 'State the domain',
              detail:
                'Every real number except 3. Note the exclusion is a fact about the RULE — ' +
                'f is not "undefined at 3" because somebody decided, but because nothing is.',
              socratic:
                'Every input but one survived, and the one that did not was turned away by the ' +
                'arithmetic rather than by anybody\'s choice. How would you describe the set of ' +
                'inputs f accepts — and what would have to become true of division before 3 ' +
                'could be let back in?',
            },
          ],
          answer: 'Undefined at x = 3, where the denominator evaluates to 0',
        },
      },
      {
        id: 'the-range-is-what-it-reaches',
        conceptId: 'domain-and-range',
        statement:
          'The range is the set of outputs the rule actually produces, which is usually smaller ' +
          'than the numbers it is allowed to produce. Finding it means asking what the rule can ' +
          'and cannot get to, not reading it off the formula.',
        position: 2,
        workedExample: {
          problem: 'f(x) = x² + 4. Evaluate f(0), and say why that value is the bottom of the range.',
          subgoals: [
            {
              label: 'Evaluate at the obvious place',
              detail: 'f(0) = 0 + 4 = 4.',
              socratic:
                'The rule before this one turned an input away; this one accepts every number you ' +
                'can hand it, so there is no exclusion to go looking for. What is left is a fixed ' +
                '4 with x² added to it. What can you choose x to be so that the added part ' +
                'contributes nothing, and what does f hand back when you do?',
            },
            {
              label: 'Argue nothing is below it',
              detail:
                'x² is never negative, so x² + 4 is never below 4. The value 4 is reached, at ' +
                'x = 0, so it is in the range rather than merely a bound.',
              socratic:
                'You did not merely get close to 4, you produced it, so 4 is certainly one of the ' +
                'outputs. Everything else the rule produces is that same 4 with x² added. What ' +
                'would x² have to come out as for some output to fall below 4, and which inputs ' +
                'manage that?',
            },
            {
              label: 'State the range',
              detail:
                'Every number from 4 upwards. The domain here is everything — this is a function ' +
                'whose domain and range are quite different sets, which is the normal case.',
              socratic:
                'Nothing falls below 4 and 4 itself is produced. Meanwhile every real number is ' +
                'an acceptable input here — there was no exclusion to find. How would you ' +
                'describe the set of values f actually reaches, and what does holding that set ' +
                'next to the set of inputs show about the two being one question?',
            },
          ],
          answer: 'f(0) = 4, and the range is everything from 4 up',
        },
      },
      {
        id: 'a-hole-is-not-a-simplification',
        conceptId: 'domain-and-range',
        statement:
          'Cancelling a common factor changes the domain. (x² − 4)/(x − 2) and x + 2 agree ' +
          'everywhere except x = 2, where the first is undefined and the second is 4 — so they ' +
          'are different functions that happen to share almost all their values.',
        position: 3,
        workedExample: {
          problem: 'Evaluate (x² − 4)/(x − 2) at x = 5, and say what happens at x = 2.',
          subgoals: [
            {
              label: 'Evaluate where it is defined',
              detail: '(25 − 4)/(5 − 2) = 21/3 = 7. Note x + 2 at x = 5 is also 7.',
              socratic:
                'The denominator at x = 5 is 5 − 2, which is not zero, so the exclusion hunt you ' +
                'did on 1/(x − 3) has nothing to find here — this input is one the rule accepts. ' +
                'What does the fraction hand back at x = 5, and what does x + 2 hand back at the ' +
                'very same input?',
            },
            {
              label: 'Now look at the excluded point',
              detail:
                'At x = 2 the denominator is 0, so the original is undefined — even though the ' +
                'numerator is 0 too and the cancelled form gives 4.',
              socratic:
                'At x = 2 the two forms part company: x + 2 returns 4, while the fraction has ' +
                '0 underneath. Its numerator has gone to 0 as well, which is the detail that ' +
                'tempts people into calling the fraction fine after all. What does division ' +
                'demand of the number underneath, and what does a 0 on top change about that ' +
                'demand?',
            },
            {
              label: 'Say what the cancellation did',
              detail:
                'Factoring gives (x − 2)(x + 2)/(x − 2), and cancelling is legal only when ' +
                'x ≠ 2 — the step quietly assumes the thing it is dividing by is not zero. The ' +
                'result is a function with a hole at x = 2, and writing "= x + 2" without that ' +
                'condition has thrown the hole away.',
              socratic:
                'Factored, the fraction reads (x − 2)(x + 2)/(x − 2), and striking out the ' +
                '(x − 2) is the whole of what turns it into x + 2. But striking out a factor is ' +
                'dividing above and below by it, and you have just watched one input send that ' +
                'factor to 0. What was the cancelling step silently taking for granted — and ' +
                'since the two forms disagree at exactly the input where that fails, what is the ' +
                'honest relationship between (x² − 4)/(x − 2) and x + 2?',
            },
          ],
          answer: '7 at x = 5; undefined at x = 2, which is a hole rather than a value',
        },
      },
    ],
  },

  {
    id: 'function-composition',
    name: 'Composition',
    subjectId: subject.id,
    scope: {
      id: 'function-composition',
      label: 'Composition',
      hint: 'composition composite function feeding one function into another',
      match: /\b(composit\w+|compose\w*|f ?∘ ?g|f\(g\(|inner function|outer function)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compose-two-rules',
        statement:
          'Evaluate a composite in the right order, and say why the composite may be undefined ' +
          'where both parts are fine.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'composition-is-substitution',
        conceptId: 'function-composition',
        statement:
          'f(g(x)) means: work out g(x), then feed that number to f. On paper it is substituting ' +
          'the whole of g\'s rule where f\'s variable was — the same move as putting an ' +
          'expression into a function, done with a rule instead of a number.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'f(x) = x² + 1 and g(x) = 2x − 3. Find f(g(2)).',
          subgoals: [
            {
              label: 'Work from the inside out',
              detail: 'g(2) = 2·2 − 3 = 1. That number is the input to f.',
              socratic:
                'You have fed f a number and then the expression x + 1, and both times the ' +
                'placeholder held whatever was written in its brackets. Here the brackets after f ' +
                'hold g(2) — a rule with its own input still waiting. Only one of the two rules ' +
                'has a number it can work on yet; which one is it, and what does it hand back?',
            },
            {
              label: 'Feed it to the outer rule',
              detail: 'f(1) = 1² + 1 = 2.',
              socratic:
                'g has turned the 2 into a 1, and the 2 itself has no further part to play — it ' +
                'was g\'s input, never f\'s. So the number standing in f\'s placeholder is 1. ' +
                'What does f hand back, and what would you have got instead if the 2 had gone ' +
                'into f directly?',
            },
            {
              label: 'The same thing as one expression',
              detail:
                'Substituting g\'s rule into f gives f(g(x)) = (2x − 3)² + 1, and at x = 2 that ' +
                'is (1)² + 1 = 2. Same answer, and the second form is the one you need when the ' +
                'input is a letter rather than a number.',
              socratic:
                'You handled f(x + 1) by dropping the whole expression into the placeholder, and ' +
                'g\'s rule, 2x − 3, is an expression like any other — so the substitution can be ' +
                'made before any number arrives. What single rule for f(g(x)) does that produce, ' +
                'what must it give at x = 2 if the inside-out working was right, and why is that ' +
                'the form you cannot do without once the input is a letter?',
            },
          ],
          answer: '2',
        },
      },
      {
        id: 'the-order-matters',
        conceptId: 'function-composition',
        statement:
          'f(g(x)) and g(f(x)) are different functions. Composition is not commutative, and ' +
          'expecting it to be is the error that makes inverses look harder than they are.',
        position: 2,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'With the same f(x) = x² + 1 and g(x) = 2x − 3, find g(f(2)) and compare.',
          subgoals: [
            {
              label: 'Inside first, but a different inside',
              detail: 'Now f is inner: f(2) = 4 + 1 = 5.',
              socratic:
                'Working f(g(2)) you started at g, because g was the rule the 2 had been handed ' +
                'to and f was still waiting on a number. Written g(f(2)) the nesting is the other ' +
                'way about, so the inside-out habit survives but it no longer starts in the same ' +
                'place. Which of the two rules has the 2 this time, and what does it hand outward?',
            },
            {
              label: 'Then the outer rule',
              detail: 'g(5) = 2·5 − 3 = 7.',
              socratic:
                'The 5 is the only number g ever sees — the 2 belonged to f and has already been ' +
                'spent. So g\'s placeholder is holding 5, and g\'s rule is the doubling-and-' +
                'subtracting one. What does it hand back, and why is that number rather than the ' +
                '5 the value of g(f(2))?',
            },
            {
              label: 'Compare with the other order',
              detail:
                'f(g(2)) = 2 and g(f(2)) = 7. Not equal, and not close — the two compositions ' +
                'are genuinely different rules: (2x − 3)² + 1 against 2(x² + 1) − 3.',
              socratic:
                'The same two rules and the same starting 2 have produced 2 one way round and 7 ' +
                'the other. Substituting each rule into the other, the way you did at the first ' +
                'point, gives (2x − 3)² + 1 against 2(x² + 1) − 3 — two different rules rather ' +
                'than one rule worked out twice, so the disagreement sits in the rules and not in ' +
                'the arithmetic. What does that leave you able to conclude about g(f(x)) once you ' +
                'have f(g(x)) in hand, and what would have to be special about a pair of rules ' +
                'for both orders to land in the same place?',
            },
          ],
          answer: '7, against 2 the other way round',
        },
      },
      {
        id: 'the-composite-domain-can-shrink',
        conceptId: 'function-composition',
        statement:
          'The domain of f(g(x)) is the inputs where g is defined AND g\'s output is something f ' +
          'accepts. So a composite can be undefined at a point where both functions separately ' +
          'are perfectly happy.',
        position: 3,
        workedExample: {
          problem: 'f(x) = 1/x and g(x) = x − 1. Evaluate f(g(3)), and find where the composite fails.',
          subgoals: [
            {
              label: 'Evaluate it',
              detail: 'g(3) = 2, and f(2) = 1/2. So f(g(3)) = 1/2.',
            },
            {
              label: 'Write the composite',
              detail: 'f(g(x)) = 1/(x − 1).',
            },
            {
              label: 'Find where it breaks, and notice where it does not',
              detail:
                'It fails at x = 1. But g is defined at 1 — g(1) = 0, perfectly fine — and f is ' +
                'defined at every input except 0. Neither function is broken at x = 1; the ' +
                'composite is, because g sends 1 to exactly the one place f cannot take.',
            },
            {
              label: 'The rule this gives you',
              detail:
                'Checking the two domains separately is not enough. You have to ask what the ' +
                'inner function\'s outputs are, and whether any of them land where the outer ' +
                'one is undefined.',
            },
          ],
          answer: '1/2, and the composite is undefined at x = 1',
        },
      },
    ],
  },

  {
    id: 'inverse-functions',
    name: 'Inverse functions',
    subjectId: subject.id,
    scope: {
      id: 'inverse-functions',
      label: 'Inverse functions',
      hint: 'inverse function one to one injective restrict the domain undo',
      match: /\b(inverse functions?|one[- ]to[- ]one|injectiv\w+|f\^?-1|restrict\w* the domain)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'undo-a-rule',
        statement:
          'Apply the inverse of a rule, show the two compose to the identity, and say why a rule ' +
          'that is not one-to-one has no inverse until its domain is cut down.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-inverse-undoes-the-rule',
        conceptId: 'inverse-functions',
        statement:
          'f⁻¹ is the rule that takes an output back to the input it came from. The notation is ' +
          'borrowed and it is a genuine trap: f⁻¹ is NOT 1/f. For f(x) = 3x − 2 the inverse is ' +
          '(y + 2)/3, and the reciprocal is 1/(3x − 2), which are not the same function at any ' +
          'point worth checking.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'f(x) = 3x − 2. Find f⁻¹(10).',
          subgoals: [
            {
              label: 'Ask the question backwards',
              detail:
                'f⁻¹(10) is the input whose output is 10 — the x with 3x − 2 = 10, not the ' +
                'value of some new formula applied to 10.',
            },
            {
              label: 'Undo the steps in reverse order',
              detail:
                'f multiplies by 3 then subtracts 2. Undoing means add 2 then divide by 3: ' +
                '(10 + 2)/3 = 4. Reverse order matters — dividing first would undo a rule that ' +
                'subtracted first.',
            },
            {
              label: 'Check against the original',
              detail: 'f(4) = 3·4 − 2 = 10, which is where we started.',
            },
            {
              label: 'And check it is not the reciprocal',
              detail:
                '1/f(10) = 1/28, nothing like 4. The superscript −1 means "inverse function" on ' +
                'a function and "reciprocal" on a number, and the only defence is to read which ' +
                'object it is attached to.',
            },
          ],
          answer: '4',
        },
      },
      {
        id: 'the-pair-composes-to-the-identity',
        conceptId: 'inverse-functions',
        statement:
          'What makes f⁻¹ the inverse is that f(f⁻¹(y)) = y and f⁻¹(f(x)) = x. That is the ' +
          'definition, and it is also the only check worth doing — a candidate inverse either ' +
          'composes back to the identity or it is not the inverse.',
        position: 2,
        workedExample: {
          problem: 'With f(x) = 3x − 2 and the candidate f⁻¹(y) = (y + 2)/3, evaluate f(f⁻¹(7)).',
          subgoals: [
            {
              label: 'Inner first',
              detail: 'f⁻¹(7) = (7 + 2)/3 = 3.',
            },
            {
              label: 'Then the outer',
              detail: 'f(3) = 3·3 − 2 = 7.',
            },
            {
              label: 'Why landing back on 7 settles it',
              detail:
                'The composite returned its own input. Written out, f(f⁻¹(y)) = 3·((y + 2)/3) − 2 ' +
                '= (y + 2) − 2 = y for every y, so this is not a coincidence at 7 — it is the ' +
                'identity, which is what being an inverse means.',
            },
          ],
          answer: '7 — the composite returns its input',
        },
      },
      {
        id: 'it-has-to-be-one-to-one',
        conceptId: 'inverse-functions',
        statement:
          'A function has an inverse only if different inputs give different outputs. Squaring ' +
          'does not: 3 and −3 both go to 9, so there is no rule that can send 9 back to the one ' +
          'it came from.',
        position: 3,
        workedExample: {
          problem: 'Show that squaring is not one-to-one by evaluating x² − (−x)² at x = 3.',
          subgoals: [
            {
              label: 'Square both of a pair',
              detail: '3² = 9 and (−3)² = 9.',
            },
            {
              label: 'Measure the difference',
              detail:
                '9 − 9 = 0. Two different inputs, and the gap between their outputs is nothing — ' +
                'which is exactly the failure. For a one-to-one rule this difference could not ' +
                'be zero unless the inputs were equal.',
            },
            {
              label: 'What that costs',
              detail:
                'An inverse would have to decide whether 9 came from 3 or from −3, and nothing ' +
                'in the output records which. So no inverse exists on the whole line.',
            },
            {
              label: 'And how it is repaired',
              detail:
                'Restrict the domain to x ≥ 0 and squaring becomes one-to-one, with the positive ' +
                'square root as its inverse. The restriction is part of the answer, not a ' +
                'technicality — "the inverse of x²" is meaningless until somebody says which ' +
                'half.',
            },
          ],
          answer: '0 — two inputs share an output, so there is no inverse',
        },
      },
    ],
  },
  {
    id: 'sequences',
    name: 'Sequences',
    subjectId: subject.id,
    scope: {
      id: 'sequences',
      label: 'Sequences',
      hint: 'sequence term recurrence relation nth term',
      // Carried VERBATIM off the map node, anchor and all. The anchor is the
      // whole value of it: it takes the article "Sequence" and leaves
      // "Arithmetic sequence" and "Cauchy sequence" to the nodes that are
      // actually about those. A promotion that relaxed it to /sequence/i would
      // keep every suite green and quietly claim three other nodes' articles,
      // which is why tests/atlas.mjs asserts the title "Sequence" resolves
      // here and the over-broad group asserts it resolves nowhere else.
      match: /^sequence\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'name-a-term-from-a-formula',
        statement:
          'Compute a stated term of a sequence from a formula in n, without writing out the ' +
          'terms before it.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'walk-a-recurrence-to-a-position',
        statement:
          'Walk a recurrence from its given first term to a stated position, and count the ' +
          'applications that took.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-sequence-is-a-function-on-positions',
        conceptId: 'sequences',
        statement:
          'A sequence is a function whose inputs are the positions 1, 2, 3, … . When the rule ' +
          'is written as a formula in n, the nth term is a value you can name directly — ' +
          'exactly as f(4) names a number rather than a search through earlier answers.',
        position: 1,
        // Substituting a position into a rule is the same skill as `f(4)`, and
        // that point carries 15s. Timed for the same reason: it has to become
        // automatic before the formula-against-recurrence comparison below
        // means anything, because a learner who finds each substitution
        // effortful will not believe one is cheaper than ninety-nine.
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'The sequence with nth term n² + 1 begins 2, 5, 10, 17, … . Find the 6th term.',
          subgoals: [
            {
              label: 'Read the position as the input',
              detail:
                'The 6th term means n = 6. The position goes in and the term comes out, and they ' +
                'are different numbers: the 4th term is 17, not 4.',
              socratic:
                'The rule n² + 1 takes one number in and gives one out. In the phrase "the 6th ' +
                'term", which of those two is the 6 — and which of the four terms already ' +
                'listed settles it for you?',
            },
            {
              label: 'Substitute and compute',
              detail: '6² + 1 = 36 + 1 = 37.',
              socratic:
                'With n replaced by 6 there is no letter left, so this is ordinary arithmetic ' +
                'now. Which of the two operations has to happen first, and what number would ' +
                'the other order hand you instead?',
            },
            {
              label: 'Count what the formula saved',
              detail:
                'The 5th term never entered the calculation. A rule in n reaches position 6 in ' +
                'one substitution, and that is the whole difference between a formula and a list.',
              socratic:
                'You produced the 6th term without ever working out the 5th. What is it about ' +
                'this rule that made that possible, and what would a rule have to look like for ' +
                'the 5th term to be unavoidable?',
            },
          ],
          answer: '37',
        },
      },
      {
        id: 'a-recurrence-needs-its-first-term',
        conceptId: 'sequences',
        statement:
          'A recurrence says what to do to one term to get the next. It does not say where the ' +
          'sequence starts, so the first term is separate data — the same rule with a different ' +
          'first term is a different sequence.',
        position: 2,
        // No automaticityTarget. What is being learned is that the rule is
        // incomplete without a₁ and that reaching aₙ costs n − 1 applications.
        // Both are judgements about the structure; timing them would measure
        // how fast the learner can triple a number three times.
        workedExample: {
          problem: 'a₁ = 2, and every term after that is 3 times the one before it, minus 1. Find a₄.',
          subgoals: [
            {
              label: 'Separate the rule from the starting value',
              detail:
                'The rule is "triple it, then subtract 1". a₁ = 2 is not produced by the rule — ' +
                'it is handed over. Start the same rule at a₁ = 5 instead and it generates 14, ' +
                '41, 122: a different sequence from the identical rule.',
              socratic:
                'You have been given two things here: a rule, and the number 2. Suppose somebody ' +
                'gave you the rule and nothing else — what about the sequence could you then not ' +
                'decide?',
            },
            {
              label: 'Apply the rule once per step',
              detail:
                'a₂ = 3·2 − 1 = 5, then a₃ = 3·5 − 1 = 14. Each line uses only the line above ' +
                'it, which is what makes this a walk rather than a formula.',
              socratic:
                'You have a₂ = 5 and you want a₃. Of every number written down so far, which one ' +
                'does the rule actually need — and is a₁ still among them?',
            },
            {
              label: 'Stop at the position asked for',
              detail:
                'a₄ = 3·14 − 1 = 41. Reaching the 4th term took three applications, not four, ' +
                'because a₁ was given rather than computed.',
              socratic:
                'You were asked for the 4th term and you applied the rule three times. Where did ' +
                'the fourth application go?',
            },
          ],
          answer: '41',
        },
      },
      {
        id: 'a-formula-and-a-recurrence-are-not-interchangeable',
        conceptId: 'sequences',
        statement:
          'One sequence can be given by a formula in n or by a recurrence, and the two are not ' +
          'interchangeable. A formula reaches any position in one substitution; a recurrence ' +
          'reaches position n only by passing through every position before it.',
        position: 3,
        workedExample: {
          problem:
            'The sequence 5, 8, 11, 14, … is given both by the formula 3n + 2 and by a₁ = 5 ' +
            'with each term 3 more than the one before. Check the two agree at n = 4, then find ' +
            'the 100th term.',
          subgoals: [
            {
              label: 'Evaluate the formula at the position',
              detail:
                '3·4 + 2 = 14, which is the fourth entry in the list. One substitution, and the ' +
                'position went straight in.',
              socratic:
                'The list already shows you the 4th term. What do you have to do to 3n + 2 to ' +
                'produce that same number, and how many steps is that?',
            },
            {
              label: 'Walk the recurrence to the same position',
              detail:
                '5, then 8, then 11, then 14 — three additions to arrive at the term the formula ' +
                'produced in one substitution. Agreeing at a position is what entitles you to ' +
                'call them one sequence.',
              socratic:
                'Both descriptions landed on 14. Counting only the arithmetic you actually ' +
                'performed, which route cost you more — and does that difference bear at all on ' +
                'whether the two sequences are the same?',
            },
            {
              label: 'Price the same question at n = 100',
              detail:
                'The formula is still one substitution: 3·100 + 2 = 302. The recurrence is ' +
                'ninety-nine additions and every one of them has to be right. The same sequence, ' +
                'and not the same thing to work with.',
              socratic:
                'Move the question from the 4th term to the 100th. What happens to the work the ' +
                'formula asks of you, and what happens to the work the recurrence asks of you?',
            },
          ],
          answer: '302',
        },
      },
    ],
  },
  {
    id: 'sigma-notation',
    name: 'Sigma notation',
    subjectId: subject.id,
    scope: {
      id: 'sigma-notation',
      label: 'Sigma notation',
      hint: 'sigma notation summation index linearity',
      // Carried VERBATIM off the map node. It takes the article "Summation",
      // which is where an encyclopaedia files this, and the thing it is NOT is
      // a pattern on the bare word "sum" — "Riemann sum", "Sum to infinity"
      // and the angle sum belong to three other nodes, and `/\bsum\b/i` would
      // claim all three. The same discipline as `sequences` above and for the
      // same reason: a widened pattern keeps the TITLES group in
      // tests/atlas.mjs green, because that group asserts the right title
      // lands HERE and a wider pattern still would. The over-broad group is
      // where the three it must refuse are named.
      //
      // What it DOES take besides its own article, stated rather than left to
      // be discovered: "Summation by parts", "Abel summation" and "Einstein
      // summation convention" all match. None of them is a node anywhere in
      // this atlas, so nothing is being stolen, and all three really are about
      // manipulating an indexed sum — which is this concept. Accepted on that
      // basis, not overlooked.
      match: /\bsummation\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'expand-a-sum-and-total-it',
        statement:
          'Write a sum given with an index out as its terms — getting how many there are from ' +
          'the limits, including when the term does not mention the index — and total it.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'rearrange-a-sum-before-totalling-it',
        statement:
          'Take a constant factor outside a sum and split a sum of two terms into two, and use ' +
          'that to total a sum when only the total of its terms is known.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-limits-name-which-terms',
        conceptId: 'sigma-notation',
        statement:
          'The index runs from the lower limit to the upper one and BOTH ends are included, so ' +
          'the number of terms is upper − lower + 1 and not upper − lower. Everything else about ' +
          'the notation follows from writing that list of terms out.',
        position: 1,
        workedExample: {
          problem: 'Expand and total the sum of k² − 1 for k running from 3 to 6.',
          subgoals: [
            {
              label: 'Count the terms before computing any of them',
              detail:
                '6 − 3 + 1 = 4. The lower limit is itself a term rather than a starting line, ' +
                'which is what the + 1 is for: k takes the values 3, 4, 5, 6, and 6 − 3 counts ' +
                'the steps between them instead of the values themselves.',
              socratic:
                'The index starts at 3 and finishes at 6. Write down every value it takes on the ' +
                'way and count what you wrote — which of those values would subtracting 3 from 6 ' +
                'have left out?',
            },
            {
              label: 'Substitute each index value into the whole term',
              detail:
                'k² − 1 at 3, 4, 5, 6 gives 8, 15, 24, 35. The index is an input exactly as a ' +
                'position is, and the subtraction applies to the square rather than to k.',
              socratic:
                'The expression k² − 1 still mentions k, and a total has to be a number. What has ' +
                'to happen to k, and how many separate times does it have to happen?',
            },
            {
              label: 'Add the list',
              detail:
                '8 + 15 + 24 + 35 = 82. The sigma performed none of those three additions — it ' +
                'said which four numbers to perform them on.',
              socratic:
                'You have four numbers in front of you and no sigma left. What is still to be ' +
                'done, and what was it that the notation actually spared you writing?',
            },
          ],
          answer: '82',
        },
      },
      {
        id: 'a-constant-term-still-counts-the-terms',
        conceptId: 'sigma-notation',
        statement:
          'When the term does not mention the index there is nothing to substitute — and the sum ' +
          'is still as long as the limits say. The index has stopped choosing the value and is ' +
          'still choosing how many, which is the one place the count IS the answer.',
        position: 2,
        workedExample: {
          problem: 'Total the sum of the constant 7 for k running from 4 to 9.',
          subgoals: [
            {
              label: 'Notice that the term ignores the index',
              detail:
                'Putting k = 4 into 7 and putting k = 9 into 7 both leave 7, so no substitution ' +
                'does any work here. That is not a reason for the total to be 7.',
              socratic:
                'Substituting the first value of k and substituting the last both leave you ' +
                'looking at 7. Does that make the total 7 — and if it does not, what is the index ' +
                'still deciding?',
            },
            {
              label: 'Read the length off the limits',
              detail:
                '9 − 4 + 1 = 6 values of k, so there are six copies of 7. The term says nothing ' +
                'about how many there are; the limits are the only thing that ever did, here or ' +
                'in the first example.',
              socratic:
                'The term gave you no way to tell a long sum from a short one. Where is the only ' +
                'other place that information could have come from, and what does it say here?',
            },
            {
              label: 'Adding equal numbers is multiplying',
              detail:
                '7 × 6 = 42. The commonest wrong answer is 35, which is five copies — the same ' +
                'slip as 6 − 3 in the first example, except that here it is buried in a product ' +
                'instead of sitting in a list you could count.',
              socratic:
                'Six sevens is a sum nobody writes out. Which single operation replaces it, and ' +
                'which of its two numbers came from the limits rather than from the term?',
            },
          ],
          answer: '42',
        },
      },
      {
        id: 'linearity-moves-a-factor-out-and-splits-a-sum',
        conceptId: 'sigma-notation',
        statement:
          'Two rearrangements are always legal: a constant factor can come outside the sigma, ' +
          'and a sum of two terms can be split into two sigmas. Both are the commutativity and ' +
          'associativity of addition read through the notation — which is also why neither of ' +
          'them lets you move something that depends on the index out.',
        position: 3,
        workedExample: {
          problem:
            'The ten numbers a₁ … a₁₀ total 12 and you are told nothing else about them. Total ' +
            'the sum of 3aₖ + 5 for k running from 1 to 10.',
          subgoals: [
            {
              label: 'Split the sigma across the plus',
              detail:
                'Each of the ten terms is a 3aₖ added to a 5, so this is twenty numbers added ' +
                'up. Gathering the ten of one kind and then the ten of the other changes the ' +
                'order and nothing else: Σ(3aₖ + 5) = Σ3aₖ + Σ5.',
              socratic:
                'Write the first two terms of this sum out in full. Each one is two things added ' +
                'together — so if you gathered all the parts of one kind first and all of the ' +
                'other kind second, what about the total would you have changed?',
            },
            {
              label: 'Take the constant factor outside',
              detail:
                'Every one of the ten terms has been tripled, so tripling the total once does ' +
                'the same job: Σ3aₖ = 3Σaₖ = 3 × 12 = 36.',
              socratic:
                'All ten terms have been tripled. If you added the untripled ones first and ' +
                'tripled the total at the end, would you arrive at a different number — and what ' +
                'is the law that says so?',
            },
            {
              label: 'The constant sigma needs the count, not the terms',
              detail:
                'Σ5 over ten values of k is 5 × 10 = 50, by the previous point. The 10 came off ' +
                'the limits, and no part of that is a fact about aₖ.',
              socratic:
                'The second sigma\'s term never mentions k. What do you need to know in order to ' +
                'total it, and is any part of that information about the aₖ at all?',
            },
            {
              label: 'Add the two parts',
              detail:
                '36 + 50 = 86. You were never told a single value of aₖ, only that the ten of ' +
                'them come to 12, and that was enough — which is what the notation is for rather ' +
                'than a lucky feature of this question.',
              socratic:
                'You have an exact total and you still do not know any one of the ten numbers. ' +
                'Would knowing them individually have changed your answer?',
            },
            {
              label: 'And the rearrangement this does NOT license',
              detail:
                'Squaring is not linear, so Σaₖ² is not (Σaₖ)². Two terms are enough to settle ' +
                'it: at a₁ = 1 and a₂ = 2 the sum of the squares is 1 + 4 = 5 and the square of ' +
                'the sum is 3² = 9. A factor that does not depend on k comes out; something done ' +
                'TO aₖ does not.',
              socratic:
                'The 3 came outside the sigma because it multiplied every term, and squaring ' +
                'also does the same thing to every term. Take a₁ = 1 and a₂ = 2 and compute both ' +
                'readings — what is different about the 3?',
            },
          ],
          answer: '86',
        },
      },
    ],
  },
  {
    id: 'functions-of-several-variables',
    name: 'Functions of several variables',
    subjectId: subject.id,
    scope: {
      id: 'functions-of-several-variables',
      label: 'Functions of several variables',
      hint: 'function of two variables level curve contour surface',
      // Carried VERBATIM off the map node, hint and pattern both, and the hint
      // is deliberately WIDER than the material. "level curve contour surface"
      // names the half of this node that stays mapped — but the hint selects
      // which encyclopaedia articles are about this concept, and the article
      // "Level set" genuinely is. Narrowing it to what the knowledge points
      // teach would make the offerings worse to make a boundary look tidier.
      // `fidelity` is about recognition and `isTeachable` is about problems;
      // the map's own header makes that split and this is the first promotion
      // where the two pull in opposite directions.
      //
      // The pattern is the narrow half. `/\bfunction\b/i` would be the lazy
      // version and tests/atlas.mjs already forbids it by name: "Function
      // (mathematics)" is `function-concept`'s own article and is listed in
      // that suite's over-broad table against this id specifically. So the
      // pattern asks for the SPECIALISATION to be named in the title, which is
      // how an encyclopaedia files it.
      match: /\bfunction of several (real )?variables\b|\bmultivariable calculus\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'evaluate-a-rule-in-two-letters-at-an-ordered-pair',
        statement:
          'Evaluate a rule in two letters at a stated pair, matching each number to the letter ' +
          'whose place it stands in, and show from a computed case that swapping the pair is a ' +
          'different input rather than the same one written twice.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'hold-one-letter-and-evaluate-the-rule-that-is-left',
        statement:
          'Hold either of the two letters at a value, put that value in every place the letter ' +
          'stood, and evaluate the one-variable rule that is left — then use the two slices ' +
          'agreeing at a shared pair as a check on the substitution.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'decide-a-pair-against-a-two-coordinate-domain-condition',
        statement:
          'Decide whether a stated pair is in the domain when the condition involves both ' +
          'coordinates together, and evaluate the function there when it is.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-input-is-an-ordered-pair',
        conceptId: 'functions-of-several-variables',
        statement:
          'A function of two variables takes a PAIR of numbers and returns one number. The pair ' +
          'is ordered: nothing in the two numbers says which letter each belongs to, and the ' +
          'only thing that assigns them is the position they are written in.',
        position: 1,
        workedExample: {
          problem: 'f(x, y) = x² + 3y. Find f(3, 1), then find f(1, 3).',
          subgoals: [
            {
              label: 'Match each number to the letter whose place it stands in',
              detail:
                'f(3, 1) means x = 3 and y = 1. That is a fact about the ORDER the two numbers ' +
                'were written in and about nothing else — the numbers themselves carry no label, ' +
                'which is why the input is written as a pair in brackets rather than as a set.',
              socratic:
                'f(3, 1) hands you two numbers and the rule mentions two letters. What is the ' +
                'only thing in that notation which decides which number goes with which letter?',
            },
            {
              label: 'Substitute both and evaluate',
              detail:
                '3² + 3 × 1 = 9 + 3 = 12. The squaring belongs to x alone and the 3 multiplies y ' +
                'alone, so the two coordinates are not doing the same job even before you choose ' +
                'values for them.',
              socratic:
                'Each of the two letters has something different waiting for it before the ' +
                'addition happens. Which operation is waiting for the 3 and which for the 1, and ' +
                'what is the total?',
            },
            {
              label: 'Swap the pair and run the same rule again',
              detail:
                'f(1, 3) = 1² + 3 × 3 = 1 + 9 = 10. Same two numbers, same rule, and a different ' +
                'answer — because this time the 1 went into the squaring and the 3 into the ' +
                'multiplication.',
              socratic:
                'You have the same two numbers and the same rule in front of you. Is there ' +
                'anything about x² + 3y that would force the two answers to agree — and what is ' +
                'the second one?',
            },
            {
              label: 'Name what the two answers rule out',
              detail:
                '12 ≠ 10, so (3, 1) and (1, 3) are not two names for one input. This is why a ' +
                'function of two variables is called a function of a POINT: a point has ' +
                'coordinates in an order, and an unordered pair of numbers would not have been ' +
                'enough to evaluate the rule. A rule like x + y would have given 4 both ways and ' +
                'settled nothing, which is why this example is not symmetric.',
              socratic:
                'The two totals came out different. What does that settle about whether (3, 1) ' +
                'and (1, 3) are the same input — and would the rule x + y have let you find it ' +
                'out at all?',
            },
          ],
          answer: 'f(3, 1) = 12 and f(1, 3) = 10',
        },
      },
      {
        id: 'holding-one-letter-leaves-a-rule-in-the-other',
        conceptId: 'functions-of-several-variables',
        statement:
          'Fix one of the two letters at a value and what is left is an ordinary one-variable ' +
          'rule in the other. The fixed value goes into EVERY place its letter stood, and which ' +
          'letter you hold changes what kind of rule you are left with.',
        position: 2,
        workedExample: {
          problem:
            'f(x, y) = x²y + 4y. Hold y at 3 and find f(2, 3) from the rule in x that is left. ' +
            'Then hold x at 2 instead and find f(2, 3) again from the rule in y.',
          subgoals: [
            {
              label: 'Put the held value in every place its letter stood',
              detail:
                'y appears in both terms of x²y + 4y, so both of them take the 3, and the rule ' +
                'left is 3x² + 12. Substituting into only the first term leaves 3x² + 4y, which ' +
                'still mentions y and so is not a rule in x at all — and the usual way that ' +
                'becomes a number is to read the leftover 4y as a bare 4, which gives 3x² + 4 ' +
                'and is a slice of no function.',
              socratic:
                'The letter y occurs in two of the terms. If y is fixed at 3, how many of those ' +
                'places does the 3 have to go into, and what does the result still mention?',
            },
            {
              label: 'Evaluate the one-variable rule',
              detail:
                '3 × 2² + 12 = 12 + 12 = 24. Everything after the substitution was ordinary ' +
                'one-variable work; the second variable is not consulted again, which is the ' +
                'whole reason the move is worth making.',
              socratic:
                'You now have 3x² + 12 and the value 2 for x. Is any part of what is left to do ' +
                'about the second variable at all?',
            },
            {
              label: 'Hold the other letter instead and see what changes',
              detail:
                'Fixing x at 2 turns x²y + 4y into 4y + 4y = 8y, which is linear. The same ' +
                'function is quadratic along one slice and linear along the other, so asking ' +
                '"is f quadratic?" has no answer until you say which letter is being held.',
              socratic:
                'Holding y left you a squared term in x. Hold x at 2 instead and write down what ' +
                'is left — what kind of rule is it this time, and what does that do to the ' +
                'question of what kind of function f is?',
            },
            {
              label: 'Check that the two slices agree where they cross',
              detail:
                '8 × 3 = 24, which is the number the first route gave. Both slices contain the ' +
                'pair (2, 3), so they HAVE to agree there — a disagreement would mean one of the ' +
                'two substitutions was wrong. That makes the second route a check rather than a ' +
                'coincidence, and it is the cheapest check available on this kind of work.',
              socratic:
                'Both of your one-variable rules describe the same f, and the pair (2, 3) lies ' +
                'on both slices. What must therefore be true of 3 × 2² + 12 and 8 × 3, and what ' +
                'would a mismatch have told you about your own working?',
            },
          ],
          answer: 'f(2, 3) = 24, reached as 3x² + 12 at x = 2 and as 8y at y = 3',
        },
      },
      {
        id: 'the-domain-is-a-condition-on-both-coordinates',
        conceptId: 'functions-of-several-variables',
        statement:
          'Where a function of two variables is defined is a condition on the pair, not a list ' +
          'of forbidden numbers. There can be no value of x that is refused for every y and no ' +
          'value of y refused for every x, and the function still be undefined somewhere.',
        position: 3,
        workedExample: {
          problem:
            'f(x, y) = (x + y)/(x² − y). Find f(5, 4), and find the one value of y for which ' +
            'f(5, y) is not defined.',
          subgoals: [
            {
              label: 'Evaluate at the pair you were given',
              detail:
                '5² = 25, so the bottom is 25 − 4 = 21 and the top is 5 + 4 = 9. ' +
                'f(5, 4) = 9/21 = 3/7. The squaring happens to the first coordinate before ' +
                'anything is subtracted, and the sum on top is untouched by either.',
              socratic:
                'Both the top and the bottom of this fraction mention x and y. Which operation ' +
                'reaches the 5 before any subtraction does, and what does that make the bottom?',
            },
            {
              label: 'Read the forbidden set off the denominator as a condition on the pair',
              detail:
                'The only way f fails is x² − y = 0, which is y = x². No single number is ' +
                'forbidden on either axis: pick any x at all and exactly one y fails, while every ' +
                'other y is fine. So what the function refuses is a PAIR, and that is the thing a ' +
                'one-variable domain has no way to say.',
              socratic:
                'Try to name a value of x that f refuses no matter what y is, and then a value of ' +
                'y it refuses no matter what x is. If you can do neither, what kind of thing is it ' +
                'that the function is actually refusing?',
            },
            {
              label: 'Put the fixed first coordinate into that condition',
              detail:
                'y = 5² = 25, so f(5, y) is defined at every y except 25. The answer to watch for ' +
                'is 5: that is where the two coordinates agree, which is a different curve ' +
                'entirely, and f(5, 5) = 10/20 = 1/2 is perfectly ordinary.',
              socratic:
                'The condition is y = x² and the first coordinate is fixed at 5. Which y does that ' +
                'forbid — and what actually happens if you test y = 5, where the two coordinates ' +
                'are equal?',
            },
            {
              label: 'Say what kind of object the forbidden set turned out to be',
              detail:
                'In one variable a domain is the line with some points removed, and it can be ' +
                'written as a list of exceptions. Here it is the plane with a whole curve removed ' +
                '— the parabola y = x² — and f is defined at every point off it. That is why ' +
                '"where is this defined" stops being a list and becomes a condition.',
              socratic:
                'In one variable you could write a domain as "all reals except 1 and 2". Try to ' +
                'write this one in that form, as a list of numbers — what goes wrong, and what has ' +
                'to take the list\'s place?',
            },
          ],
          answer: 'f(5, 4) = 3/7, and f(5, y) is undefined only at y = 25',
        },
      },
    ],
  },
  {
    id: 'arithmetic-sequences',
    name: 'Arithmetic sequences and sums',
    subjectId: subject.id,
    scope: {
      id: 'arithmetic-sequences',
      label: 'Arithmetic sequences and sums',
      hint: 'arithmetic sequence common difference sum of series',
      // Carried VERBATIM off the map node, hint and pattern both.
      //
      // The pattern has three alternatives and ALL THREE WERE MEASURED LIVE
      // before it came across, which is the lesson `basis-and-dimension` left:
      // a stray `)` inside an alternation there made a pattern match only a
      // sibling's title, and nothing in the suite could see it because the one
      // row that existed tested a branch that worked. "Arithmetic progression",
      // "Arithmetic sequence" and "Arithmetic series" each land here and
      // nowhere else; all three are rows in tests/atlas.mjs's TITLES table, one
      // per branch, so a future narrowing has to kill a named assertion.
      //
      // What the pattern REFUSES, and the refusal is load-bearing rather than
      // incidental: "Arithmetico-geometric sequence" goes to
      // `geometric-sequences`, because the space after `arithmetic` is not a
      // dash. A relaxation to `/\barithmetic/i` would take that article, and
      // would also take "Arithmetic" and "Arithmetic mean", neither of which is
      // this concept. tests/atlas.mjs forbids the first of those by name.
      //
      // The shortfall, recorded rather than widened in the same change as the
      // material: "Arithmetic mean" is claimed by NOBODY, and the pairing
      // argument below is exactly the fact that an arithmetic sequence's mean
      // is the mean of its two ends. Widening to reach it is one word and the
      // wrong one here — a mean is `descriptive-statistics`, which is an
      // authored concept of `data-summaries` now rather than a node of the
      // statistics area, so this concept would be claiming an article about
      // another SUBJECT's content and not merely about unwritten territory.
      // That strengthens the refusal rather than expiring it: the right owner
      // exists, has material, and still does not take the title either — the
      // shortfall is recorded in ontology-statistics.ts as well.
      match: /\barithmetic (sequence|progression|series)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'name-any-term-from-the-first-term-and-the-difference',
        statement:
          'Read the constant difference off a sequence and name the term at any stated position, ' +
          'counting the steps between positions rather than the positions themselves.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'run-the-formula-backwards-from-a-value-to-its-position',
        statement:
          'Given a value, find which term of the sequence it is by taking the first term off and ' +
          'counting the steps the rest is made of — and read off the same division whether the ' +
          'value is a term at all.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'total-a-run-from-its-two-ends-and-its-length',
        statement:
          'Total a run of an arithmetic sequence from its first term, its last term and how many ' +
          'terms there are, without adding the terms in between.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-formula-counts-steps-not-positions',
        conceptId: 'arithmetic-sequences',
        statement:
          'A sequence that goes up by the same amount every time is fixed by two numbers: where ' +
          'it starts and how big the step is. Getting from position 1 to position n takes n − 1 ' +
          'steps and not n, because position 1 is already occupied before any step is taken — so ' +
          'the nth term is the first term plus (n − 1) differences.',
        position: 1,
        workedExample: {
          problem: 'A sequence begins 5, 9, 13, 17, … . Find its 20th term.',
          subgoals: [
            {
              label: 'Take the difference between neighbours, more than once',
              detail:
                '9 − 5 = 4, and 13 − 9 = 4, and 17 − 13 = 4. One subtraction gives a candidate ' +
                'for the step; the repeats are what make it a constant difference rather than a ' +
                'coincidence between the first two terms.',
              socratic:
                'There are four numbers in front of you, so there are three subtractions you can ' +
                'do between neighbours. What would it mean about this sequence if they did not ' +
                'all give the same answer?',
            },
            {
              label: 'Count the steps standing between position 1 and position 20',
              detail:
                '19. The 5 is already sitting at position 1 before anything has been added, so ' +
                'the additions happen in the gaps between positions and there is one fewer gap ' +
                'than there are positions.',
              socratic:
                'The 5 is at position 1 and no addition has happened yet. How many additions ' +
                'stand between it and position 20 — and is that the same as how many terms you ' +
                'have passed?',
            },
            {
              label: 'Replace nineteen identical additions with one multiplication',
              detail:
                '19 × 4 = 76, so the 20th term is 5 + 76 = 81. Nothing between the 17 and the 81 ' +
                'had to be written down, which is what the formula buys over counting up.',
              socratic:
                'You know how many steps there are and how big each one is. Which single ' +
                'operation stands in for taking the step over and over, and what is the first ' +
                'term still doing afterwards?',
            },
            {
              label: 'And identify where 85 comes from, since it is not an arithmetic slip',
              detail:
                '5 + 20 × 4 = 85, and 85 really is a term of this sequence — the 21st. Using n ' +
                'where n − 1 was wanted does not produce a wrong number, it produces the right ' +
                'number for the next position along, which is why the mistake survives a sanity ' +
                'check on the size of the answer.',
              socratic:
                'Multiplying by 20 instead of 19 gives 85, and 85 is in this sequence. Which ' +
                'position does it sit at, and what does that tell you about the kind of mistake ' +
                'it was?',
            },
          ],
          answer: '81',
        },
      },
      {
        id: 'a-value-tells-you-its-own-position-or-that-it-has-none',
        conceptId: 'arithmetic-sequences',
        statement:
          'The formula runs backwards. Told a value and asked which term it is, take the first ' +
          'term off and divide by the step: that counts the steps, and one more than it is the ' +
          'position. A position has to be a whole number, so a division that does not come out ' +
          'whole is not a failed calculation — it is the answer that the value is not in the ' +
          'sequence.',
        position: 2,
        workedExample: {
          problem: 'A sequence begins 2, 7, 12, 17, … . One of its terms is 302. Which term is it?',
          subgoals: [
            {
              label: 'Write the same formula down before deciding what to solve for',
              detail:
                'The nth term is 2 + (n − 1) × 5. The formula does not change when the question ' +
                'is reversed; what changes is which of its letters is the unknown. Here the value ' +
                'is given and n is wanted, where in the previous point it was the other way.',
              socratic:
                'You are handed a value and asked for a position. Which letter in the nth-term ' +
                'formula is the unknown this time — and does the formula itself have to be ' +
                'rewritten?',
            },
            {
              label: 'Subtract the first term, because it was never a step',
              detail:
                '302 − 2 = 300. That 300 is the part the repeated additions actually built; the 2 ' +
                'was there before any of them happened and is not evidence about how many there ' +
                'were.',
              socratic:
                'The 2 was already in place before a single 5 was added. How much of the 302 did ' +
                'the additions contribute, and what do you have to do to the 302 to see only that ' +
                'part?',
            },
            {
              label: 'Divide by the step to count the steps, then turn steps into a position',
              detail:
                '300 ÷ 5 = 60 steps, so the position is 60 + 1 = 61. The + 1 is the same + 1 as ' +
                'in the previous point and for the same reason — position 1 was occupied before ' +
                'the first step — except that here it is being added back rather than subtracted ' +
                'off.',
              socratic:
                'Sixty fives make up the 300. Sixty is a count of steps rather than of terms — so ' +
                'what does the position come out as, and why is it not 60?',
            },
            {
              label: 'Run the same three moves on a value that is not in the sequence',
              detail:
                'For 300: 300 − 2 = 298, and 298 ÷ 5 = 59.6. There is no such thing as 59.6 ' +
                'steps, so 300 sits strictly between the 60th term and the 61st and is not a term ' +
                'at all. The division answered the membership question on the way past, which is ' +
                'why this method tells you more than checking terms one at a time ever could.',
              socratic:
                'Try those three moves on 300 instead of 302 and the division leaves 59.6. Is ' +
                'that a position you have found, or is it telling you something else — and what?',
            },
          ],
          answer: '61',
        },
      },
      {
        id: 'pairing-the-ends-turns-the-sum-into-a-multiplication',
        conceptId: 'arithmetic-sequences',
        statement:
          'A run of an arithmetic sequence never has to be added up term by term. Step one place ' +
          'in from each end at once and one term rises by the difference while the other falls by ' +
          'it, so every such pair has the same total — the total of the two ends. The whole sum is ' +
          'therefore that one total, taken half as many times as there are terms, and the terms ' +
          'in the middle are never needed individually. Half, rather than "once per pair", ' +
          'because an odd count leaves one term with no partner and the rule has to hold for it ' +
          'too.',
        position: 3,
        workedExample: {
          problem: 'Total 3 + 7 + 11 + 15 + 19 + 23 + 27 + 31 + 35 + 39.',
          subgoals: [
            {
              label: 'Count the terms before pairing any of them',
              detail:
                'The difference is 4, so (39 − 3) ÷ 4 = 9 steps and there are 9 + 1 = 10 terms. ' +
                'That is the previous point\'s move used as a tool rather than as the question: ' +
                'the pairing needs to know how many pairs there will be, and nothing else about ' +
                'the list.',
              socratic:
                'You are about to pair terms off from the two ends inwards. What is the one thing ' +
                'you need to know first in order to say how many pairs that will give you?',
            },
            {
              label: 'Add the two ends, then the next two inwards, and watch nothing change',
              detail:
                '3 + 39 = 42, 7 + 35 = 42, 11 + 31 = 42, 15 + 27 = 42, 19 + 23 = 42. Moving in ' +
                'one place from the left adds 4 and moving in one place from the right takes 4 ' +
                'away, and those two cancel exactly — which is the whole argument, and it holds ' +
                'for any constant difference rather than for these numbers.',
              socratic:
                'Step one place inwards from each end at the same time. One of the two terms goes ' +
                'up by 4 and the other goes down by 4 — what does that do to their total, and why ' +
                'does it keep on doing it all the way to the middle?',
            },
            {
              label: 'Ten terms make five pairs, so multiply instead of adding',
              detail:
                '5 × 42 = 210. Nine additions have become one multiplication. The step above ' +
                'computed all five pairs in order to show the pattern, but its argument is what ' +
                'means only the first ever has to be computed — the two ends and the count are ' +
                'the whole of what the answer depends on, which is why this works just as well ' +
                'on a run of five hundred terms.',
              socratic:
                'Ten terms, every pair totalling 42. How many pairs is that — and if you trusted ' +
                'the last step\'s argument instead of checking it, how many of the five pairs ' +
                'would you actually have had to add up?',
            },
            {
              label: 'And what to do when the count of terms is odd',
              detail:
                'With eleven terms one is left stranded in the middle with no partner. Write the ' +
                'sum out and then write it out again backwards underneath: now every column is a ' +
                'pair of ends-inwards, there are eleven columns, each totals first + last, and ' +
                'what you have is twice the sum. So the sum is 11 × (first + last) ÷ 2 — the same ' +
                'rule, with the halving moved to the end, and it never needs the pairing to come ' +
                'out even.',
              socratic:
                'Suppose there had been eleven terms instead of ten, so one is stranded in the ' +
                'middle. What could you add to this sum that would give every single term a ' +
                'partner — and what would you then have to do to the result?',
            },
          ],
          answer: '210',
        },
      },
    ],
  },
  {
    id: 'mathematical-induction',
    name: 'Induction',
    subjectId: subject.id,
    scope: {
      id: 'mathematical-induction',
      label: 'Induction',
      hint: 'mathematical induction base case inductive step',
      /*
       * Carried VERBATIM off the map node, which is the discipline
       * `area-and-perimeter`'s scope states and the reason this is `checked`
       * without argument: widening a pattern during an authoring pass makes
       * two changes at once, and the recognition figure in tests/atlas.mjs
       * then moves with no way to say which edit moved it.
       *
       * THE FIRST BRANCH IS VERIFIED AND THE SECOND IS NOT, and the
       * difference is worth writing down because `conceptsInOffering`
       * (offerings.ts) does `const subject = offering.title` and tests this
       * pattern against the TITLE and nothing else — no extract, no
       * categories. So a branch that no article is TITLED with is dead, and
       * `fidelityMismatches` cannot see that: it only asks whether a
       * `checked` concept HAS a pattern.
       *
       * `\bmathematical induction\b` fires on a real title — the TITLES table
       * in tests/atlas.mjs has the row, so the claim is asserted rather than
       * assumed, and it is what makes `checked` honest here on its own.
       * `^induction \(` is the unverified half: it is anchored, so it can only
       * take a title that BEGINS "Induction (", and whether the provider has
       * such a page in the mathematical sense was not established. It is left
       * exactly as the node wrote it rather than deleted, because deleting it
       * is as much an unmeasured edit as widening would be — and if it is
       * dead it is harmless, since the first branch carries the concept.
       * Whoever next audits the `checked` patterns should ask that question of
       * this one; it is the same fault `radical-equations` was repaired for,
       * caught early rather than late.
       */
      match: /\bmathematical induction\b|^induction \(/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'carry-out-the-step-by-landing-on-the-claim-with-k-plus-one-in-it',
        statement:
          'Write down the instance the step has to REACH before working towards it, build it out ' +
          'of the assumed instance plus the one new term rather than from scratch, and clear the ' +
          'denominator and factor until what you have is the assumed formula with k + 1 written ' +
          'in place of k.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
      {
        id: 'compute-both-sides-at-the-base-and-say-what-a-failure-there-costs',
        statement:
          'Evaluate a claimed formula and the quantity it claims to equal separately at the base, ' +
          'and say why a claim whose step is valid everywhere establishes nothing when those two ' +
          'numbers differ — including why checking a later case does not rescue it.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'run-the-step-on-a-claim-that-is-not-about-a-sum',
        statement:
          'For a claim with no term to add, form the difference between consecutive instances, ' +
          'factor it, and say which part of "this increment carries the property" the ' +
          'factorisation establishes and which part still needs an argument about the factors.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-step-must-land-on-the-claim-with-k-plus-one-in-it',
        conceptId: 'mathematical-induction',
        statement:
          'The inductive step is not "check the next case". You are allowed to assume the claim ' +
          'at k, and you have to arrive at the claim at k + 1 — which is the SAME formula with ' +
          'k + 1 written everywhere k was. So write that target down first, then build it out of ' +
          'the assumption by adding the one new term, and the rest is algebra on an expression ' +
          'whose destination you already know. A step worked forwards from the assumption with ' +
          'no target in mind is how a learner ends up proving something true and unrelated.',
        position: 1,
        /*
         * No `automaticityTarget`. The content is recognising the target
         * before reaching it, and rewarding speed rewards starting to
         * manipulate — which is the error the point exists to stop. The
         * factorisation underneath it is already timed nowhere, and should
         * not be timed here either.
         */
        workedExample: {
          problem:
            'It is claimed that 1 + 2 + … + n = n(n + 1)/2 for every natural n. Carry out the ' +
            'inductive step.',
          subgoals: [
            {
              label: 'Write down what may be assumed and what must be reached, before touching either',
              detail:
                'Assume 1 + 2 + … + k = k(k + 1)/2. The instance to be reached is the claim with ' +
                'k + 1 in place of k on BOTH sides: 1 + 2 + … + (k + 1) = (k + 1)(k + 2)/2, since ' +
                'substituting k + 1 into n(n + 1)/2 gives (k + 1)((k + 1) + 1)/2. Getting the ' +
                '(k + 2) rather than a (k + 1) is the whole of this step\'s bookkeeping, and it ' +
                'is done before any algebra so that the algebra has somewhere to go.',
              socratic:
                'You are about to prove something about k + 1. Substitute k + 1 into the claimed ' +
                'formula — what exactly is the expression you have to end up staring at?',
            },
            {
              label: 'Build the longer sum out of the assumption rather than from scratch',
              detail:
                'The sum to k + 1 is the sum to k with one more term on the end, and that term is ' +
                'the (k + 1)th, which is k + 1. So it is k(k + 1)/2 + (k + 1). This is the only ' +
                'place the assumption is spent, and spending it is the difference between an ' +
                'induction and a fresh calculation: nothing below re-derives the sum to k.',
              socratic:
                'The sum to k + 1 contains the sum to k inside it. What is the single thing left ' +
                'over — and which of the two is the one you are allowed to replace by a formula?',
            },
            {
              label: 'Clear the denominator and factor, which is where the (k + 2) appears',
              detail:
                'Doubling both sides turns k(k + 1)/2 + (k + 1) into k(k + 1) + 2(k + 1), and ' +
                'both terms carry a (k + 1). Taking it out leaves (k + 1)(k + 2). So the doubled ' +
                'sum is (k + 1)(k + 2) and the sum itself is (k + 1)(k + 2)/2. The (k + 2) was ' +
                'not aimed at — it fell out of the common factor — which is why this is a ' +
                'derivation and not a rearrangement towards a known answer.',
              socratic:
                'Both terms of k(k + 1) + 2(k + 1) carry the same bracket. Take out whatever ' +
                'they share — what is left inside, and is the result the expression you wrote ' +
                'down as the target?',
            },
            {
              label: 'Compare with the target, and discharge the base case in one line',
              detail:
                'That is exactly the instance written down first, so the step holds for every k. ' +
                'The proof still needs somewhere to start: at n = 1 the sum is the single term 1 ' +
                'and the formula gives 1 × 2/2 = 1, so the base case holds too and the two ' +
                'obligations together carry the claim to every natural. The base case is one line ' +
                'HERE and is the next point\'s entire subject, because it is one line only when ' +
                'it passes.',
              socratic:
                'The step is done, and it says the claim is inherited. Inherited from what — and ' +
                'what is the smallest amount of work that supplies it?',
            },
          ],
          answer:
            'The step holds. Assuming 1 + … + k = k(k + 1)/2, the sum to k + 1 is ' +
            'k(k + 1)/2 + (k + 1); doubling gives k(k + 1) + 2(k + 1) = (k + 1)(k + 2), so the ' +
            'sum to k + 1 is (k + 1)(k + 2)/2, which is the claim with k + 1 in place of n. With ' +
            'the base case 1 = 1 × 2/2 at n = 1, the claim holds for every natural n.',
        },
      },
      {
        id: 'a-claim-can-be-inherited-and-false-at-every-natural',
        conceptId: 'mathematical-induction',
        statement:
          'The step proves an IMPLICATION — if it holds at k then it holds at k + 1 — and an ' +
          'implication true at every k still says nothing about any particular n, because it has ' +
          'nowhere to start. A claim can be inherited perfectly and be false at every single ' +
          'natural. Only computing both sides at the base catches it, and the reason the step ' +
          'cannot is structural: the step only ever compares CONSECUTIVE instances, so a constant ' +
          'error is invisible to it however far you run it.',
        position: 2,
        workedExample: {
          problem:
            'It is claimed that 1 + 2 + … + n = n(n + 1)/2 + 3 for every natural n. Is the claim ' +
            'true, and does induction settle it?',
          subgoals: [
            {
              label: 'Run the step first, and watch it succeed',
              detail:
                'Assume the sum to k is k(k + 1)/2 + 3. Adding the (k + 1)th term gives ' +
                'k(k + 1)/2 + (k + 1) + 3, and the previous point showed the first two of those ' +
                'collapse to (k + 1)(k + 2)/2. So it is (k + 1)(k + 2)/2 + 3, which is the claim ' +
                'with k + 1 in place of n. The step is valid — not nearly valid, not valid for ' +
                'large k. The 3 rode along untouched because the step never does anything to it.',
              socratic:
                'Do the step on this claim exactly as you did on the last one. At what point in ' +
                'the algebra does the extra 3 cause you any difficulty at all?',
            },
            {
              label: 'Compute the two sides at the base separately, and subtract',
              detail:
                'At n = 1 the left side is the sum of one term, which is 1 — there is nothing to ' +
                'compute, which is what makes the base case cheap and what makes skipping it ' +
                'tempting. The right side is 1 × 2/2 + 3 = 4. They differ by 3, so the claim is ' +
                'false at n = 1 and the induction has no starting point.',
              socratic:
                'Put n = 1 into each side of the claim on its own, without looking at the other. ' +
                'What two numbers do you get, and does the claim survive them?',
            },
            {
              label: 'Check a later case too, and find the same gap rather than a vanishing one',
              detail:
                'At n = 4 the left side is 1 + 2 + 3 + 4 = 10 and the right is 4 × 5/2 + 3 = 13. ' +
                'Still 3 out. That is the step\'s validity showing up as a symptom: a valid step ' +
                'transmits whatever error it is handed exactly, so the gap is CONSTANT rather ' +
                'than shrinking. Testing further cases will never do anything but reproduce it.',
              socratic:
                'Try n = 4. You could have hoped the claim goes wrong only near the start — what ' +
                'does the size of the error at n = 4 tell you about that hope?',
            },
            {
              label: 'Separate what the failed base case proves from what it does not',
              detail:
                'The failed base case proves that THIS induction establishes nothing; on its own ' +
                'it does not prove the claim false at every n, because a failing hypothesis says ' +
                'nothing about the conclusion. What proves that is the previous point: the sum ' +
                'really is n(n + 1)/2, so this claim overshoots by exactly 3 everywhere. Two ' +
                'different arguments, and collapsing them is the mistake worth avoiding — "the ' +
                'base case failed" is a verdict on the proof, not on the claim.',
              socratic:
                'The base case failed. Does that by itself tell you the formula is wrong at ' +
                'n = 100 — and if not, what does?',
            },
          ],
          answer:
            'The claim is false, and the induction settles nothing. The step is valid: assuming ' +
            'the sum to k is k(k + 1)/2 + 3 gives (k + 1)(k + 2)/2 + 3 at k + 1. But at n = 1 the ' +
            'sum is 1 while the formula gives 4, so there is nothing for the step to inherit ' +
            'from. The true sum is n(n + 1)/2, so the claim is 3 too large at every natural n — ' +
            'which is a separate argument from the failed base case rather than a consequence of ' +
            'it.',
        },
      },
      {
        id: 'with-no-term-to-add-the-step-is-about-the-increment',
        conceptId: 'mathematical-induction',
        statement:
          'Induction is not a fact about sums. When the claim is something like "this expression ' +
          'is always a multiple of 6" there is no term to add, so the step subtracts consecutive ' +
          'instances instead and shows the DIFFERENCE carries the property: if instance k has it ' +
          'and the increment has it, instance k + 1 has it. The move is the same — build k + 1 ' +
          'out of k — and only the arithmetic linking them changes.',
        position: 3,
        workedExample: {
          problem:
            'Prove that n³ − n is a multiple of 6 for every natural n.',
          subgoals: [
            {
              label: 'Check the base case, where the property is easiest to mistake for an absence',
              detail:
                'At n = 1, n³ − n is 1 − 1 = 0, and 0 is a multiple of 6 because 0 = 6 × 0. A ' +
                'learner who reads 0 as "no multiple" stops the proof at its first line over a ' +
                'convention rather than over any mathematics, which is why it is worth saying out ' +
                'loud rather than passing over.',
              socratic:
                'At n = 1 the expression comes to 0. Is 0 a multiple of 6 — and what would you ' +
                'have to multiply 6 by to get it?',
            },
            {
              label: 'Name what the step must establish, which is a claim about a DIFFERENCE',
              detail:
                'Assume k³ − k is a multiple of 6. The next instance is (k + 1)³ − (k + 1). There ' +
                'is no "next term" to append — the two instances are separate expressions rather ' +
                'than a short sum and a longer one — so the only way the assumption can help is ' +
                'if the GAP between them is also a multiple of 6. Multiple-of-6 is closed under ' +
                'addition, so assumption plus increment settles the next instance.',
              socratic:
                'You may assume something about k³ − k and you need something about ' +
                '(k + 1)³ − (k + 1). Nothing is being added to a sum here — so what quantity ' +
                'relating those two expressions would let the assumption do any work?',
            },
            {
              label: 'Compute the increment and factor it',
              detail:
                'Expanding, (k + 1)³ − (k + 1) = k³ + 3k² + 3k + 1 − k − 1 = k³ + 3k² + 2k. ' +
                'Subtracting k³ − k leaves 3k² + 3k, and both terms carry a 3k, so the increment ' +
                'is 3k(k + 1). The cubes cancelled, which is the reason this is worth doing at ' +
                'all: the difference of two cubics is a quadratic, so the step is easier than ' +
                'either instance it compares.',
              socratic:
                'Subtract k³ − k from (k + 1)³ − (k + 1). What happened to the cubic terms — and ' +
                'what is the common factor of what survived?',
            },
            {
              label: 'Argue the increment is a multiple of SIX, which the factorisation alone does not give',
              detail:
                '3k(k + 1) is visibly three times something, so it is a multiple of 3 — and that ' +
                'is all the algebra establishes. The other half comes from k(k + 1) being a ' +
                'product of two CONSECUTIVE integers, one of which must be even, so k(k + 1) is ' +
                'even and 3k(k + 1) is a multiple of 3 and of 2, hence of 6. That evenness is an ' +
                'arithmetic fact brought in from outside the factorisation, and it is where this ' +
                'step is actually made. At k = 6 the increment is 3 × 6 × 7 = 126, which is ' +
                '6 × 21, and the instances 210 and 336 differ by exactly that.',
              socratic:
                'The factor of 3 is written in front of you. Where is the factor of 2 going to ' +
                'come from — and what do you know about any two consecutive whole numbers that ' +
                'guarantees it?',
            },
          ],
          answer:
            'A multiple of 6 for every natural n. Base case: at n = 1 the expression is 0 = 6 × 0. ' +
            'Step: ((k + 1)³ − (k + 1)) − (k³ − k) = 3k² + 3k = 3k(k + 1), and k(k + 1) is a ' +
            'product of consecutive integers so is even, making the increment a multiple of both ' +
            '3 and 2 and hence of 6. A multiple of 6 plus a multiple of 6 is a multiple of 6, so ' +
            'the property passes from k to k + 1 and holds everywhere.',
        },
      },
    ],
  },
]

/**
 * The edges. A chain of four with a second chain of two branching off its
 * foot, and every link is a real dependency rather than a teaching order.
 *
 * `domain-and-range` genuinely needs `function-concept`: "where is this
 * defined" presupposes that there is a single value to be defined. Composition
 * needs the domain, because the thing that makes composites hard is the
 * shrinking domain rather than the substitution. And an inverse is defined BY a
 * composition — f⁻¹ is the thing that composes with f to the identity — so it
 * cannot come first.
 *
 * `sequences` is the branch, and it is also the first edge in this file that
 * was STRANDED by a promotion rather than written from scratch. The map node
 * declared `needs: ['function-concept']` and nothing else; deleting the node
 * deletes that edge, so it is restated here. It could come here, rather than
 * into an area's `links`, for the one reason that decides every such case:
 * both of its endpoints are concepts of THIS ontology, and an ontology may
 * only name concepts it contains. Had the node named a single prerequisite
 * outside this file the edge would have had to go back to
 * `SEQUENCES_AND_SERIES.links` instead, however well authored that endpoint
 * was — `links` is about which FILE an endpoint is in, not about whether
 * anybody has written material for it.
 *
 * The three edges pointing INTO the node were left alone, as the rule says.
 * `arithmetic-sequences`, `geometric-sequences` and `sigma-notation` each name
 * it in their own `needs`; the first two are still map nodes and still own
 * their edges, which `composeAtlas` resolves across the file boundary. The
 * third is a concept of this file now, so its edge is declared below rather
 * than on a node — the edge itself never changed, only where it is written.
 * What changed without anybody editing the two that stayed is that the edges
 * now GATE: they used
 * to point at a node with no material, which `gatingPrerequisitesOf` looks
 * straight through.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'function-concept->domain-and-range',
    from: 'function-concept',
    to: 'domain-and-range',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  {
    id: 'function-concept->sequences',
    from: 'function-concept',
    to: 'sequences',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  {
    id: 'domain-and-range->function-composition',
    from: 'domain-and-range',
    to: 'function-composition',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  {
    id: 'function-composition->inverse-functions',
    from: 'function-composition',
    to: 'inverse-functions',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },

  /**
   * Credit propagation. Each of these is "you cannot do the first without
   * doing the second", which is the standard the edge has to meet.
   *
   * `inverse-functions => function-composition` is the strongest in the
   * build: the check that something IS an inverse is a composition, so every
   * inverse task performs one. Without this edge a learner who had just
   * demonstrated composition inside an inverse problem would have composition
   * come due as though untouched.
   */
  {
    id: 'domain-and-range=>function-concept',
    from: 'domain-and-range',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Deciding where a rule is defined means applying the rule and watching it fail, so every ' +
      'domain question also exercises evaluating the function.',
  },
  {
    id: 'function-composition=>function-concept',
    from: 'function-composition',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'A composite is evaluated by applying two rules in turn; substituting into each is the ' +
      'function concept in use.',
  },
  {
    id: 'inverse-functions=>function-composition',
    from: 'inverse-functions',
    to: 'function-composition',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Verifying an inverse IS composing it with the original and checking the identity, so an ' +
      'inverse task is a composition task with its answer known in advance.',
  },
  /**
   * The sequence's credit edge, and it is claimed only because ALL THREE tasks
   * earn it.
   *
   * ontology-arithmetic.ts has the counter-example worth holding this against:
   * the `gcd-and-lcm` node declared `exercises: ['prime-factorisation']`, the
   * promotion made that live, and it was DROPPED rather than restated because
   * two of the three tasks there never touch a factorisation. An encompasses
   * edge is a claim about what practising this material actually exercises, so
   * a majority is not enough — one task that does not perform the sub-skill is
   * a learner getting credit they did not earn.
   *
   * Here every task substitutes a stated number into a rule and evaluates it:
   * `sequence-term-1` is literally f(6) for f(n) = n² + 1, `recurrence-walk-1`
   * is three nested substitutions, and `formula-beats-the-walk-1` is one more.
   * There is no task on this concept that is not the function concept in use.
   */
  {
    id: 'sequences=>function-concept',
    from: 'sequences',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Naming the nth term means substituting a position into a rule and evaluating it, which ' +
      'is applying a function to an input — the only thing the sequence adds is that the input ' +
      'is an index, so every task here exercises the function concept directly.',
  },
  /**
   * The sixth concept's stranded edge, and it came here for the same single
   * reason the fifth one's did: the map node declared `needs: ['sequences']`
   * and nothing else, and `sequences` is a concept of THIS ontology. One
   * `needs` pointing at a node still on the map would have forced the whole
   * edge back to `SEQUENCES_AND_SERIES.links` instead — `links` is about which
   * FILE an endpoint is in, not about how well authored it is.
   *
   * The chain is now three deep on this branch: `function-concept` →
   * `sequences` → `sigma-notation`, and the fork is still at the foot.
   */
  {
    id: 'sequences->sigma-notation',
    from: 'sequences',
    to: 'sigma-notation',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  /**
   * NO CREDIT EDGE FOR `sigma-notation`, AND THE OMISSION IS THE DECISION.
   *
   * `sequences => function-concept` above is claimed because all three of its
   * tasks substitute a number into a rule. The obvious parallel here would be
   * `sigma-notation => sequences`, and it fails the same test that killed
   * `gcd-and-lcm => prime-factorisation` in ontology-arithmetic.ts: an
   * `encompasses` edge is a claim about what practising this material
   * ACTUALLY exercises, so a majority is not enough, and here it is not even a
   * majority. Only the first task names terms from a rule in the index. The
   * second one's term ignores the index completely — that is its whole point —
   * and the third is handed the total of ten numbers it never evaluates, which
   * is what makes linearity worth having. Two of the three never produce a
   * term of a sequence at all.
   *
   * So a learner who practises sigma notation does not thereby demonstrate
   * `sequences`, and claiming otherwise would stop `sequences` coming due when
   * it has genuinely gone cold. The prerequisite edge above is the real
   * relation: you need sequences FIRST, and you do not keep using them.
   *
   * No `interferes_with` either, for the reason the header gives about f⁻¹ and
   * x⁻¹. The confusion worth authoring here is Σ against Π, and Π is nowhere
   * in this build — not on the map and not in any ontology — so there is no
   * far endpoint to name. An authored interference nobody believes is worse
   * than none.
   */
  /**
   * The seventh concept's prerequisite, and it is ONE OF TWO — which is what
   * makes this the first promotion into this subject to cost an area a `links`
   * entry.
   *
   * `domain-and-range → functions-of-several-variables` is the half that could
   * come here, on the same single test as the fifth and sixth concepts: the
   * endpoint is a concept of THIS ontology. The other half,
   * `three-dimensional-coordinates → functions-of-several-variables`, names a
   * concept of `vectors-and-independence`, so an edge written here would make
   * `ontologyProblems` report an unknown endpoint and it is
   * `MULTIVARIABLE_CALCULUS.links` instead. Neither end of it is a node any
   * more, which is exactly the case `links` exists for and the case nothing
   * forces anybody to remember: it gates from the moment it exists, and
   * dropping it would have left every suite green.
   *
   * The edge is real and not merely inherited. "Where is this defined" is a
   * harder question for a pair than for a number — the third knowledge point
   * is that the answer stops being a list and becomes a condition — so the
   * one-variable domain genuinely has to come first, and this subject is now
   * two chains and a third branch sharing one root.
   */
  {
    id: 'domain-and-range->functions-of-several-variables',
    from: 'domain-and-range',
    to: 'functions-of-several-variables',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  /**
   * ONE CREDIT EDGE AND NOT TWO, and both halves of that are argued rather
   * than copied from the nearest neighbour.
   *
   * `=> function-concept` IS claimed, on the `sequences` standard: all six
   * tasks substitute stated numbers into a rule and evaluate it, so there is
   * no task here that is not the function concept in use. `several-variables-
   * slice-x` and `several-variables-slice-y` evaluate a rule that one
   * substitution has already been performed on, which is the function concept
   * twice over rather than not at all.
   *
   * `=> domain-and-range` is NOT, even though `domain-and-range` is the other
   * prerequisite and the parallel would look tidy. Only the two tasks on the
   * third point decide anything against a domain; the other four never meet an
   * undefined pair. Two of six is not a majority, and the `gcd-and-lcm`
   * precedent in ontology-arithmetic.ts says a majority would not have been
   * enough either — an `encompasses` edge is a claim about what practising
   * this material ACTUALLY exercises, and a learner who got credit for the
   * one-variable domain by evaluating x² + 3y at a pair would have it stop
   * coming due when it had genuinely gone cold.
   *
   * And nothing runs back to `three-dimensional-coordinates`, which is the
   * third decision in this group. That edge gates, correctly, and earns
   * nothing: no task below uses a third coordinate.
   */
  {
    id: 'functions-of-several-variables=>function-concept',
    from: 'functions-of-several-variables',
    to: 'function-concept',
    kind: 'encompasses',
    promotedBy: 'author:functions-and-inverses',
    rationale:
      'Every task here substitutes stated numbers into a rule and evaluates it, which is the ' +
      'function concept in use — the only thing two variables add is that the input arrives as ' +
      'a pair, so each of the six exercises it directly.',
  },
  /**
   * NO `interferes_with` FOR THE SEVENTH CONCEPT EITHER, and the reason is the
   * f⁻¹/x⁻¹ one in the header rather than an absence of candidates.
   *
   * The genuine confusion here is between holding a letter as a PARAMETER and
   * feeding it as an INPUT — which is the second knowledge point's whole
   * subject, and the thing a learner gets wrong about a slice. The concept
   * that owns parameters is `parametric-and-implicit`, a node of the
   * `functions` area, and an `interferes_with` whose far endpoint is not in
   * this ontology fails `ontologyProblems` on the subject viewed alone. An
   * area's `links` cannot carry it either: `expandEdges` hard-codes
   * `kind: 'prerequisite'` there, so a cross-file interference is expressible
   * NOWHERE in this build.
   *
   * So it is taught where a learner meets it instead, in the second point's
   * third and fourth subgoals — hold the other letter, and the kind of rule
   * changes. That is the same resolution `an-inverse-undoes-the-rule` got, and
   * it is a real limit of the schema rather than a judgement about the
   * mathematics.
   */
  /**
   * The eighth concept's stranded edge, and the third one to come here for the
   * one reason that decides every such case: the map node declared
   * `needs: ['sequences']` and nothing else, and `sequences` is a concept of
   * THIS ontology.
   *
   * The branch at the foot is now a FORK rather than a chain — `sequences` has
   * two children, `sigma-notation` and this — which is why tests/atlas.mjs and
   * tests/concepts-logic.mjs both assert this edge by NAME. The root is
   * unchanged at `function-concept`, the edge COUNT is uninformative, and an
   * edge accidentally hung off `sigma-notation` instead would leave both of
   * those unmoved while teaching that you must be able to manipulate a sigma
   * before you can say what the 20th term of 5, 9, 13 is.
   */
  {
    id: 'sequences->arithmetic-sequences',
    from: 'sequences',
    to: 'arithmetic-sequences',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  /**
   * NO CREDIT EDGE FOR `arithmetic-sequences` EITHER, AND THE MEASUREMENT IS
   * ONE OF THREE RATHER THAN A JUDGEMENT.
   *
   * `arithmetic-sequences => sequences` is the obvious candidate and it fails
   * the `gcd-and-lcm` test in ontology-arithmetic.ts, the same test
   * `sigma-notation` failed directly above. An `encompasses` edge claims that
   * practising this material exercises the other concept, so every task has to
   * perform the sub-skill — a majority is explicitly not enough, because the
   * learner who gets credit they did not earn has the prerequisite stop coming
   * due when it has genuinely gone cold.
   *
   * Counted per task. `ap-term-1` evaluates `a + (n − 1)d` at a stated
   * position, which IS naming the nth term from a rule, so it earns it.
   * `ap-position-1` runs the rule the other way and its answer is an index, so
   * it never evaluates a sequence at a position. `ap-sum-1` produces a total
   * and reaches it from the two ends and the count, so it never produces a
   * term at all. One of three.
   *
   * The prerequisite above is the real relation and it is a strong one: you
   * cannot be asked for the 20th term of anything until a position is an input.
   * You then stop needing that skill, which is what the absence of this edge
   * says.
   */
  /**
   * AND NO `interferes_with`, BECAUSE THE EDGE THIS CONCEPT NEEDS ALREADY
   * EXISTS AND IS DECLARED SOMEWHERE ELSE.
   *
   * This is the one place in the file where an interference is genuinely
   * wanted, which makes it worth separating from the two "no far endpoint"
   * notes above. `geometric-sequences` carries
   * `confusedWith: ['arithmetic-sequences']` on its map node, with a rationale
   * about parallel vocabulary and parallel sum formulas, and it is right:
   * substituting into whichever of the two you recall produces a number either
   * way, so the failure is silent.
   *
   * That node STAYED, so it still declares the edge, `expandEdges` still emits
   * it and `composeAtlas` resolves it across the file boundary with the
   * authored concept at one end. Re-declaring it here would be a duplicate in
   * the composed map — which nothing reports, since an interference constrains
   * selection and a doubled constraint constrains identically — and it would
   * not even compile past `ontologyProblems`, an ontology being allowed to name
   * only concepts it contains. The header section above has the full reason,
   * because atlas-analysis.ts asked the next author to do exactly this.
   */
  /**
   * The ninth concept's prerequisite, AND IT IS ONLY ONE OF THE TWO THE NODE
   * DECLARED — which is the thing three separate comments in atlas-analysis.ts
   * said would happen the first time this area released a node whose
   * prerequisites were not all in one file.
   *
   * `sigma-notation → mathematical-induction` is the half that can come here,
   * on the single test that decides every such case: the endpoint is a concept
   * of THIS ontology. The other half, `geometric-proof →
   * mathematical-induction`, names a concept of `plane-geometry`, so an edge
   * written here would make `ontologyProblems` report an unknown endpoint, and
   * it is `SEQUENCES_AND_SERIES.links` instead — that area's FIRST links entry
   * after three departures that each kept it empty. Both of its ends are
   * authored, so it gates from the moment it exists, which is the case that is
   * easy to drop and leaves every suite green when dropped.
   *
   * THE BRANCH AT THE FOOT IS NOW TWO DEEP ON ONE OF ITS PRONGS:
   * `function-concept` → `sequences` → {`sigma-notation` →
   * `mathematical-induction`, `arithmetic-sequences`}. So `sigma-notation`
   * stops being a leaf, which is worth naming because the shape of this
   * subject has until now been chains hanging off one root rather than
   * anything two levels deep below a fork. tests/atlas.mjs and
   * tests/concepts-logic.mjs both assert this edge by NAME: hung off
   * `sequences` instead it would leave the root set, the edge count and
   * `ontologyProblems` all unmoved while teaching that induction needs no
   * summation notation, which is false of every worked example below.
   *
   * THE EDGE IS REAL AND NOT MERELY INHERITED FROM THE MAP. The first two
   * knowledge points are both about a summation formula — what the step has to
   * land on, and a formula that is inherited and wrong — and a learner who
   * cannot read Σ or tell how many terms a pair of limits names cannot be
   * handed either. The third point deliberately leaves sums behind, which is
   * why the prerequisite is a genuine gate rather than a description of all
   * three.
   */
  {
    id: 'sigma-notation->mathematical-induction',
    from: 'sigma-notation',
    to: 'mathematical-induction',
    kind: 'prerequisite',
    promotedBy: 'author:functions-and-inverses',
  },
  /**
   * NO CREDIT EDGE, AND THIS ONE IS DECIDED ON THE SUMS RATHER THAN ON TASTE.
   *
   * `mathematical-induction => sigma-notation` is the obvious candidate and it
   * fails the `gcd-and-lcm` test in ontology-arithmetic.ts, the same test
   * `sigma-notation` and `arithmetic-sequences` both failed above. An
   * `encompasses` edge claims that practising this material exercises the
   * other concept, so EVERY task has to perform the sub-skill — a majority is
   * explicitly not enough, because the learner who gets credit they did not
   * earn has the prerequisite stop coming due when it has genuinely gone cold.
   *
   * Counted per task, of the six. `induction-step-factor-1` and
   * `induction-increment-factor-1` are factorisations with no sum in them at
   * all. `induction-next-term-1` and `induction-base-value-1` evaluate a
   * CLOSED FORM, which is the opposite of expanding a sigma — the whole point
   * of n(n + 1)/2 is that the terms are never visited. `induction-base-later-1`
   * is the one task where a learner adds 1 + 2 + 3 + 4 by hand, and totalling
   * four numbers is not sigma notation. And `induction-increment-sixes-1` is
   * about a cube. Zero of six, which is a cleaner verdict than either of the
   * two above it got.
   *
   * So the prerequisite is a strong relation and the credit edge would be
   * false: you need the notation to READ these claims and you then spend the
   * whole concept not using it.
   *
   * NO `interferes_with` EITHER, and for once not because the far endpoint is
   * in another file. The genuine confusion this concept carries is between the
   * two obligations — a learner who has done the step believes the proof is
   * finished — and that is INTERNAL to the concept, which is what the second
   * knowledge point exists to be. `interferes_with` relates two concepts and
   * cannot say "these two halves of one concept are confusable", so it is
   * taught where it is met rather than declared. The nearest real candidate is
   * `propositional-logic`, whose implication-and-contrapositive content is
   * exactly what makes "the step proves an implication" land — and it is a
   * node of `discrete-mathematics`, so an `interferes_with` naming it fails
   * `ontologyProblems` here and `links` hard-codes `prerequisite` and cannot
   * carry it either. A cross-file interference is expressible NOWHERE in this
   * build, which is the third time this file has had to record that.
   *
   * AUTHORING THAT CANDIDATE DID NOT HELP, which is the fact worth adding
   * rather than a correction. `propositional-logic` is a concept of
   * `statements-and-connectives` as of the thirty-fifth promotion, so the
   * reason the edge cannot be written has changed and the conclusion has not:
   * it used to be an unwritten node, and it is now an authored concept of
   * ANOTHER subject, which fails the containment test exactly as being
   * unwritten did. The two most confusable concepts in this neighbourhood both
   * have material now, so the scheduler is free to introduce them together and
   * is likelier than before to actually do it. The missing expressiveness is
   * `links` carrying an edge KIND; nothing else in the build would fix this.
   */
]

export const FUNCTIONS_AND_INVERSES: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
