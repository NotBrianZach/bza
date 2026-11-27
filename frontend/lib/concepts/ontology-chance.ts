/**
 * Chance and events — the seventeenth subject, and SIX concepts.
 *
 * `sample-spaces` was a node of `probability` and was the whole of this subject
 * until the forty-sixth promotion added `counting-probability` above it, the
 * forty-seventh added `conditional-probability` above that, the forty-eighth
 * added `bayes-theorem` above that, the forty-ninth added `random-variables`
 * off the third of them rather than off the fourth, and the fiftieth added
 * `expectation` above the fifth. The sections about the first
 * run to the `EDGES` note; the second concept's argument begins at `── THE SECOND
 * CONCEPT`, the third at `── THE THIRD CONCEPT`, the fourth at `── THE FOURTH
 * CONCEPT`, the fifth at `── THE FIFTH CONCEPT`, and the SIXTH concept's
 * argument together with this file's live measurement of the ready field begins
 * at `── THE SIXTH CONCEPT`.
 *
 * READ THE LAST OF THOSE SIX FOR THE FIELD, NEVER AN EARLIER ONE. Six sections
 * with near-identical titles now sit in this header in promotion order, and a
 * later one can CONTRADICT an earlier one — the third section recommends two
 * candidates, the fourth has spent one of them, the fifth has spent the last one
 * and reports a field of ONE, and the sixth has spent that one. Counting is the
 * only way to pick the live one; `templedb vcs log bza` names the promotion that
 * wrote it.
 *
 * All six were nodes of `probability`, and each had to be DELETED from that
 * array on the way in. `atlasProblems` rejects a map node whose id collides with
 * an authored concept — the composed list would hold two entries for the id and
 * the shadowing copy has no knowledge points, so a fully authored concept would
 * read as unteachable — so promoting is a MOVE out of that array rather than a
 * fill-in.
 *
 * THIS SUBJECT TOOK FOUR CONSECUTIVE NODES OFF ONE CHAIN AND THE FIFTH IS THE
 * FIRST THAT IS NOT ON IT. That was the cheapest shape the promotion run has
 * found, and the fourth section records where it stopped paying: the
 * forty-seventh is where the chain-WALK stopped, because the node it took was a
 * branch point and handed the area three roots instead of one, and the
 * forty-eighth strands nothing and unlocked nothing at all. The forty-ninth
 * comes off `conditional-probability` SIDEWAYS — it is the fourth concept's
 * sibling and not its successor — which is why it strands an edge where the two
 * before it stranded none, and why its material leans on the FIRST concept
 * rather than on the one it was gated behind.
 *
 * ── WHY THIS CONCEPT, AND WHY THE FIELD CAME DOWN TO TWO ──────────────────
 *
 * The field was recomputed from the tree rather than read out of the previous
 * promotion's header, which every promotion from the fortieth on has had to
 * repeat. 210 map nodes, 89 authored, 19 areas, 16 subjects, ELEVEN ready — a
 * ready node being one whose every `needs` is `isTeachable` — and NONE
 * floor-blocked: the thinnest area with a ready node is `functions` at ten nodes
 * against a floor of five. All ten journeys read zero unwritten steps on route,
 * as they have since 2026-11-18, so route demand ranked nothing.
 *
 * NINE OF THE ELEVEN ARE UNDER A REFUSAL, and the forty-fourth promotion's header
 * enumerates all nine with its reasons, which this run verified rather than
 * quoting: `graphs-of-functions`, `relations`, `linear-inequalities`,
 * `complex-numbers`, `supremum-and-completeness`, `constructions`,
 * `non-euclidean-geometry`, `word-problems` (refused on rulability by the
 * forty-third), and `eigenvalues` (refused by its own host, ontology-matrices.ts,
 * in two places). That left `sample-spaces` and `combinatorial-identities`.
 *
 * `combinatorial-identities` IS REFUSED HERE, ON THE FIRST FACTOR, AND IT IS THE
 * MORE INTERESTING HALF OF THIS RUN'S CHOICE — because on the second factor it
 * wins. It is the cheapest filing anywhere on the map: `counting-principles` is
 * authored in `counting-and-arrangements`, so filed there its first `needs` would
 * be an ordinary internal edge, it would strand only the `mathematical-induction`
 * edge, and it would give that one-concept subject the internal edge
 * ontology-counting.ts says it lacks. That file names the opportunity and — to its
 * credit — files it as "a measurement rather than a recommendation".
 *
 * The measurement was right and the concept is still not authorable, for the
 * reason the map node itself states in its `is`: "Proving a counting identity by
 * counting the same set two ways — a style of argument WITH NO ALGEBRAIC
 * SUBSTITUTE". The content is the argument. Its second prerequisite is
 * `mathematical-induction`, which is the other way of establishing the same
 * identities and confirms what the node is for. And no kind this build ships can
 * observe a double-counting argument: `justify` exists in the union and is
 * unrulable by declaration, and an `evaluate` on either side of an identity grades
 * arithmetic. Worse, it grades arithmetic `counting-principles` already drills —
 * C(9, 3) and C(9, 6) are computed there, and the agreement of the two IS that
 * concept's second knowledge point. So the honest version of this concept would be
 * a second lap of its own prerequisite under a title promising proof, which is
 * exactly the "complete while being unreachable" shape types.ts warns about.
 *
 * ONE SHAPE WAS TESTED BEFORE REFUSING, because the refusal should not rest on
 * "an evaluate cannot see a proof" alone. An identity task can be made to FORCE
 * the identity if the direct route is out of reach — "how many subsets of a
 * 20-element set have an even number of elements" is 2¹⁹ by the row-splitting
 * identity and eleven large binomial coefficients otherwise. That works for a row
 * sum and for nothing else: symmetry and Pascal's rule are both cheaper to
 * evaluate directly at every size `exactValue` handles, so one of three knowledge
 * points could be given a task that evidences its own claim and two could not.
 * That is the shape of refusal rather than a shortfall to work around.
 *
 * SO THE CHOICE WAS FORCED, AND IT IS WORTH SAYING THAT THE THIRD FACTOR AGREED
 * for once rather than being the tiebreak it was last promotion: `sample-spaces`
 * has two dependents (`counting-probability`, `sampling-and-bias`) where
 * `combinatorial-identities` has none, and promoting it makes BOTH of them ready.
 * The second factor is the one this run paid against: both `needs` strand, so this
 * is the second promotion in a row to cost two `links` entries, where
 * ontology-counting.ts had been the first ever to do so.
 *
 * AND ONE ARGUMENT OUTSIDE THE FACTORS, which is the strongest single reason this
 * node was worth the two entries. `probability` is SIXTEEN NODES WITH NOTHING
 * WRITTEN — the largest wholly unwritten area in the atlas — and this is its root:
 * the only node in it whose `needs` point entirely outside it. Until now the
 * uncertainty half of the map had exactly one written concept
 * (`descriptive-statistics`, in `data-summaries`) and it was the one node there
 * that rested on no probability at all, which atlas-uncertainty.ts says in as many
 * words. So this is the first authored material anywhere in the direction of
 * reasoning that half of the atlas is organised around, and the subject it founds
 * has a growth path that is immediate rather than hoped for: `counting-probability`
 * sits directly above it and is ready the moment this file ships.
 *
 * ── WHY A SEVENTEENTH SUBJECT ─────────────────────────────────────────────
 *
 * Two subjects hold this node's prerequisites and neither is a defensible host.
 *
 * `sets-and-membership` holds `sets`, and it is the nearer of the two: an event IS
 * a subset, and the union, intersection and complement in the third point below
 * are that subject's operations unchanged. It declines nothing about probability —
 * unlike counting and relations, which it declines by name — so this refusal is
 * this promotion's own and rests on the merits. What that subject claims is
 * "membership and what is built out of it: the operations as conditions on
 * membership, the identities those conditions decide, and the counting the sizes
 * obey". A probability is not built out of membership. It is a FUNCTION FROM
 * SUBSETS TO NUMBERS, pinned by two conditions on the function rather than on the
 * sets, and the whole content of the second point below is where the number 1/8
 * comes from — which no fact about membership decides. The sets subject supplies
 * the domain of that function and says nothing about the function.
 *
 * `arithmetic-foundations` holds `fraction-arithmetic` and is the worse home
 * rather than the second-best one. Every probability below is an eighth and the
 * third point adds and subtracts them, so the prerequisite is real and used — but
 * it is used as a TOOL. A seventeen-concept subject about the rules of number
 * would have to make its `covers` a promise about chance in order to hold this,
 * and "the arithmetic of a probability" is not a topic: the arithmetic is the same
 * arithmetic.
 *
 * So the layer gets its own subject and joins the rest through the area's `links`,
 * which is the pattern ontology-arithmetic.ts established and the ninth through
 * sixteenth subjects repeated. One concept is not a reason to hesitate:
 * `solid-measure`, `statements-and-connectives`, `predicates-and-quantifiers`,
 * `methods-of-proof`, `sets-and-membership`, `data-summaries` and
 * `counting-and-arrangements` each ship with exactly one, and a subject is a
 * boundary rather than a volume. This one's boundary is argued below and its growth
 * path is named above.
 *
 * ── THE SUBJECT IS NAMED FOR THE LAYER, NOT THE AREA AND NOT THE NODE ─────
 *
 * `chance-and-events`, and three refusals went into that.
 *
 * Not `probability`, which is the id of the AREA this concept was promoted out of.
 * `areaOf` answers with a subject id for an authored concept and an area id for a
 * map node, so a collision would put two different things behind one string and
 * `getOntology(id)` and `conceptById(M, id)` would answer about different objects.
 * The ninth subject recorded that hazard and the tenth recorded the worse route to
 * it — naming the subject after its one concept, where nothing looks wrong because
 * the concept would merely report itself as its own area.
 *
 * Not `probability-foundations` or anything else built on that word, and this is
 * the refusal with content. `probability`'s own `covers` promises "sample spaces,
 * conditioning, random variables, the standard distributions, and the limit
 * theorems". A subject called after the word would be read as claiming that list,
 * and this one holds the first item. `chance` says what the measure is for without
 * promising the machinery, and `events` names the object it is a measure ON — the
 * two halves of this concept and no more. That is the discipline `data-summaries`
 * applied when it declined to call itself `statistics` and
 * `counting-and-arrangements` applied when it declined `combinatorics`.
 *
 * ── FIDELITY IS `checked`, AND THE SHORTFALL IS RECALL ────────────────────
 *
 * The map node's pattern is carried verbatim, as every promotion since the fourth
 * has carried its own. Widening or narrowing one in the same change that adds
 * material moves the recognition figure in tests/atlas.mjs and the written-concept
 * count at once, and there is no way afterwards to say which edit moved which. The
 * node already declared `checked` — `expandNode` sets it from the presence of a
 * `match` — so recognition is unmoved by this promotion.
 *
 * AND THE SHORTFALL IS IN THE BETTER DIRECTION, which is the opposite of the last
 * promotion's and so is worth saying plainly. The pattern spells three article
 * titles — "Sample space", "Probability axioms", "Event (probability theory)" —
 * and every one of them is this concept, so it claims nothing it does not teach.
 * What it MISSES is a list: "Outcome (probability)", "Elementary event",
 * "Complementary event", and the bare "Probability" page, all of which are at
 * least partly this material. A learner reading one of those gets no concept
 * offered rather than the wrong one, and that is the failure mode to prefer.
 * Widening is a separate change and the obvious widening is wrong:
 * `/\bprobability\b/` would claim every page in a sixteen-node area, fifteen of
 * which are unwritten.
 *
 * ONE OF THE THREE IT SPELLS IS DEAD, AND THIS PROMOTION FOUND IT BY TESTING THE
 * PATTERN RATHER THAN READING IT. `event \(probability theory\)` can never match,
 * because the alternation is wrapped in `\b(...)\b` and the alternative ends in a
 * literal `)`. A `\b` after a non-word character needs a word character next, and
 * in the title "Event (probability theory)" there is nothing next. So the pattern
 * reaches TWO titles, not three, and `match.test('Event (probability theory)')` is
 * false for the exact title the author was aiming at.
 *
 * That is the trap the `hypothesis-testing` node in atlas-uncertainty.ts carries a
 * comment about — "no trailing \b after 'test': the article is 'Hypothesis
 * testing'" — one file away and in the same half of the atlas, arrived at from the
 * other direction: there the suffix made the boundary fail, here the bracket does.
 * Any alternation ending in punctuation inside a `\b(...)\b` has the same hole.
 *
 * NOT FIXED HERE, AND THE REASON IS THE RULE ABOVE RATHER THAN TIMIDITY. The
 * pattern is carried verbatim so that nothing about recognition moves in the same
 * change that adds material; narrowing or widening one is a separate commit whose
 * effect on the recognition figure can be read on its own. The fix is small — drop
 * the group's trailing `\b`, or move the bracketed alternative outside it — and it
 * belongs with a sweep of every other `\b(...)\b` in the atlas files for the same
 * shape, which is a change about patterns and not about probability. What matters
 * for now is that the dead alternative is RECORDED: tests/concepts-logic.mjs
 * asserts two titles reachable and this one not, so the day somebody repairs it the
 * assertion goes red and names what changed.
 *
 * ── WHAT IS NOT HERE, WHICH IS A BOUNDARY RATHER THAN A BACKLOG ───────────
 *
 * CONDITIONING AND INDEPENDENCE. `conditional-probability` is two nodes above and
 * the boundary is sharp rather than one of depth: everything below assigns a
 * number to an event of ONE fixed space, and conditioning replaces the space. The
 * third point's addition rule is the last thing sayable without that move, which is
 * why it is the last point.
 *
 * COUNTING AS A TECHNIQUE, and this one is load-bearing because the material would
 * drift into it by itself. `counting-probability` directly above is where
 * combinatorics meets chance, and `counting-principles` is the authored subject
 * that does the counting. So the one experiment below has EIGHT outcomes and they
 * are WRITTEN OUT — every event in the three points is read off a list a learner
 * can see in full. The first task multiplies 2 × 2 × 2, and that is the only
 * multiplication in the subject: the moment an event has to be counted rather than
 * read, the question has become the node above's.
 *
 * RANDOM VARIABLES, EXPECTATION AND THE DISTRIBUTIONS. A random variable is a
 * NUMBER attached to each outcome and everything below is about the outcomes
 * themselves; the three heads-counts in the first point are the nearest thing here
 * to one, and the point they make is that recording only that number loses
 * information rather than that it is an object worth studying.
 *
 * INFINITE AND CONTINUOUS SPACES, AND THE AXIOMS IN THEIR GENERAL FORM. Everything
 * below rests on P(Ω) = 1 plus additivity over FINITELY many disjoint events, which
 * is all eight outcomes ever need. Countable additivity, a σ-algebra and a density
 * are `measure-theoretic-probability` at the far end of the same area, and the
 * reason they are not a harder version of this is that equally likely outcomes stop
 * existing: there is no uniform probability on a countably infinite set, so the one
 * formula this concept is built on has no analogue there rather than a subtler one.
 *
 * ── WHY EVERY TASK IS `evaluate`, AND WHAT THE NINE ARE MADE OF ───────────
 *
 * Nine tasks, three on each point, all nine `evaluate` and every one settled by
 * exact arithmetic with no worker. The subjects either side hold the same
 * property and it is load-bearing the same way: a subject whose prerequisites are
 * a set and a fraction sits low enough that a worker outage must not wall it off.
 *
 * THE DIFFERENCE FROM `counting-and-arrangements` IS THAT THESE ARE NOT ALL
 * INTEGERS. That file could state "every reference is a whole number, because
 * every one of them counts something, so an answer of 83.5 means the expression is
 * wrong". FIVE of the nine below are probabilities and so are rational — eighths
 * and one half — and the check that replaces it is tighter rather than looser: a
 * probability lies in [0, 1] AND is a count of outcomes over the size of the
 * space, so every one of the five is k/8 with k a whole number between 0 and 8,
 * and 1/2 is that with the fraction reduced. The four that are not probabilities
 * are the size of the space, a subset size, the partition total and the
 * multiplicity, which is exactly the set of answers that count something.
 *
 *     a*b*c             two results per toss, three tosses — the size of the space
 *     r + s             two cases of a partition, added
 *     p + q + r + s     the whole partition, which must come back to the space
 *     e/n               a count of outcomes over the size of the space
 *     e/n + f/n         two disjoint events, their probabilities added
 *     a/n + b/n - c/n   two OVERLAPPING events, with the overlap taken off once
 *     p + q - r         how many times one outcome is counted — a MULTIPLICITY
 *     1 - c/n           a complement, from P(Ω) = 1
 *
 * TWO TASKS SHARE THE REFERENCE 8 AND THE AGREEMENT IS THE CONTENT, which is the
 * device ontology-sets.ts and ontology-counting.ts each used. 2 × 2 × 2 is the size
 * of the space; 1 + 3 + 3 + 1 is the same space counted by how many heads came up.
 * A partition that did not add back to the whole would not be a partition, so the
 * second task's answer is the first task's answer or the audit has failed.
 *
 * NO `transform_to_form`. The forms this build ships are claims about an ALGEBRAIC
 * shape — expanded, factored, a completed square, a prime factorisation, a reduced
 * surd — and there is no demand of shape here. `5/8` is not asked as a form
 * because the question is how likely the event is, not how to write the number.
 * Note the one that would have been useful and does not exist: a probability is
 * conventionally given in lowest terms, and `maxDenominatorDegree` bounds a
 * DEGREE rather than a denominator, so `4/8` cannot be refused in favour of `1/2`.
 * `exactValue` compares values, so both rule correct — which is the right ruling
 * for an `evaluate` and the reason no task below asks for lowest terms.
 *
 * NO `counterexample` AND NO `justify`, and the second is the live loss again. The
 * `justify` ask is the third point's multiplicity audit — "say why the overlap is
 * subtracted exactly once" — and naming the kind in an objective would promise an
 * observation nothing in this build can make. What stands in for it is a task whose
 * ANSWER is the justification: an outcome in both events is counted once by each of
 * the first two terms and removed once by the third, and the answer 1 is the reason
 * one subtraction is the whole repair.
 *
 * NO `domainConditions` ON ANY OF THE NINE. Every denominator is the size of the
 * sample space, which is 8 in every task and never a declared variable that could
 * be zero.
 *
 * ── THE TWO STRANDED EDGES, AND THE TWO SILENT LOSSES CHECKED FOR ─────────
 *
 * The node declared two `needs` and BOTH are stranded, which is the second
 * promotion running to strand two where the four before ontology-counting.ts
 * stranded one each. An authored ontology may only name concepts it contains, so
 * neither edge can live in the `EDGES` below — `sets` is a concept of
 * `sets-and-membership` and `fraction-arithmetic` one of `arithmetic-foundations`.
 * Both are entries in `PROBABILITY.links`, filed with the area that OWNED the
 * departing node rather than with either subject holding a far end, and both ends
 * of both are authored, so unlike a `links` entry pointing at an unwritten node
 * each GATES from the moment it exists.
 *
 * THE DURABLE FORM OF THE RULE, which ontology-counting.ts had to correct and which
 * this promotion is the first confirmation of: a promotion strands exactly as many
 * edges as the node declares `needs` outside its new subject. The number is read
 * off the node. "One per step" was a fact about CHAINS and the four promotions out
 * of `discrete-mathematics` were a chain; this node is not in one, and it stranded
 * two for the same reason that one did.
 *
 * `confusedWith` ON THE DEPARTING NODE: NONE, checked before deleting it rather
 * than assumed. `expandEdges` in atlas.ts turns a node's `confusedWith` into an
 * `interferes_with` edge, so deleting the node would have deleted the edge with no
 * suite going red — interference constrains SELECTION rather than gating.
 * `exercises`: none either, which becomes an `encompasses` edge by the same route
 * and vanishes just as silently. Both absences are asserted in tests/atlas.mjs
 * rather than merely described, because an absence has to be looked for to be
 * known.
 *
 * TWO INBOUND EDGES SURVIVED AND NEITHER WAS AT RISK, and they are worth naming
 * because between them they are this promotion's whole yield. `counting-probability`
 * (a node of `probability`) and `sampling-and-bias` (a node of `statistics`) each
 * declare this node in their own `needs`. An edge is owned by the node that
 * DECLARES it, both of those nodes stayed, and `composeAtlas` resolved both
 * untouched. Each of them also has exactly one other `needs` and both of those are
 * already authored — `counting-principles` and `descriptive-statistics` — so both
 * nodes become READY the moment this file ships, and the second of them is the
 * first ready node the `statistics` area has ever had. The assertion in
 * tests/atlas.mjs is scoped to a DIRECTION rather than to this id, which is the
 * generalisation ontology-counting.ts drew after its first draft would have been
 * satisfied by deleting a credit edge another area owns.
 *
 * NO CREDIT EDGE, AND THE JUDGEMENT IS THE OTHER WAY ROUND THIS TIME. The obvious
 * claim would be `sample-spaces => sets`: every event below is a subset and the
 * third point unions, intersects and complements them, so a learner exercising this
 * has surely exercised that. It is declined because `encompasses` may only be
 * declared in an ontology containing both ends and this subject does not contain
 * `sets`, while a `links` entry carries `from`, `to` and `because` and no KIND — it
 * hard-codes `prerequisite`. So the edge is INEXPRESSIBLE rather than refused, which
 * is the fifth time a cross-subject edge kind has had nowhere to live. Recorded as
 * a loss rather than a decision: unlike ontology-counting.ts's declined credit edge,
 * which failed on the merits, this one would have held.
 *
 * ── THE SECOND CONCEPT, AND THE READY FIELD MEASURED RATHER THAN QUOTED ───
 *
 * `counting-probability`, the forty-sixth promotion, and the first node this
 * subject has taken from directly above its own material.
 *
 * The field was recomputed from the tree rather than read out of the section
 * above, which every promotion from the fortieth on has had to repeat. 209 map
 * nodes, 90 authored, 19 areas, 17 subjects, TWELVE ready — a ready node being
 * one whose every `needs` is `isTeachable` — and NONE floor-blocked: the
 * thinnest area holding a ready node is `functions` at ten against a floor of
 * five, and `probability` itself has ten of headroom. All ten journeys read zero
 * unwritten steps on route, as they have since 2026-11-18, so route demand
 * ranked nothing.
 *
 * TEN OF THE TWELVE ARE UNDER A REFUSAL, and each was checked against the tree
 * rather than counted off the section above: the standing seven
 * (`graphs-of-functions`, `relations`, `linear-inequalities`, `complex-numbers`,
 * `supremum-and-completeness`, `constructions`, `non-euclidean-geometry`),
 * `word-problems` (the forty-third, on rulability), `eigenvalues` (refused by its
 * own host, ontology-matrices.ts, in two places), and
 * `combinatorial-identities` (refused by the section above, on rulability, and
 * the refusal still binds — nothing shipped can observe a double-counting
 * argument). That left exactly the two nodes the forty-fifth promotion made
 * ready, which is the field it predicted it was leaving.
 *
 * `sampling-and-bias` IS REFUSED HERE, ON THE FIRST FACTOR, and the refusal is
 * the `word-problems` one a layer up. Its own `is` says what it is for: "where
 * the data came from, which decides what any later calculation can possibly be
 * about — and no computation repairs a bad sample". The content is a JUDGEMENT
 * about a procedure that produced some numbers, and the judgement is the whole
 * of it. `evaluate` can be made to produce a response rate or the size of a
 * sampling frame, and both are `percent` and `counting-principles` wearing a
 * statistics prompt; what cannot be asked for is "this frame excludes the people
 * the question is about", which is a claim and not a value. `justify` is in the
 * union, is unrulable by declaration, and naming it in an objective would
 * promise an observation nothing in this build can make. So the honest version
 * of that concept is prose with arithmetic attached, and the arithmetic is
 * somebody else's — the exact "complete while being unreachable" shape types.ts
 * warns about. It is also a Gal-garad ANCHOR, which would have forced a refill;
 * that is recorded after the refusal rather than as part of it, because a factor
 * which only ever adds work to one side of a choice must not decide anything.
 *
 * SO THE CHOICE WAS FORCED AGAIN. Worth saying that the other two factors
 * agreed: `counting-probability` strands ONE edge against `sampling-and-bias`'s
 * one, so the second factor tied, and the third separated them the wrong way
 * round — one dependent against two — which is the case where the weakest factor
 * is overruled by the strongest rather than consulted. Rulability rejects
 * absolutely when it rejects at all.
 *
 * ── WHY THIS SUBJECT, WHICH COST A CREDIT EDGE THAT ALREADY EXISTED ───────
 *
 * This is the first promotion in the build where the two candidate HOSTS were
 * both defensible, so the argument is worth setting out in full.
 *
 * The node declares `needs: ['sample-spaces', 'counting-principles']` and
 * `exercises: ['counting-principles']`. Filed in `counting-and-arrangements` the
 * `counting-principles` prerequisite would have become an ordinary internal edge
 * AND the `exercises` claim would have become an `encompasses` edge in that
 * ontology, so the one stranded edge would have been `sample-spaces` and nothing
 * else would have been lost. Filed HERE, `sample-spaces` becomes the internal
 * edge — the first this file has ever held — the `counting-principles`
 * prerequisite strands into `PROBABILITY.links`, and the `exercises` claim has
 * NOWHERE TO LIVE: `encompasses` may only be declared in an ontology containing
 * both ends, and a `links` entry carries `from`, `to` and `because` and no KIND.
 *
 * SO FILING IT HERE DESTROYS AN EDGE THAT WAS ALREADY IN THE COMPOSED GRAPH, and
 * that is a worse kind of cost than the five inexpressible edges this build has
 * recorded before. Those were claims nobody could ever say. This one was being
 * said, by the map node, and authoring the node is what silences it — the exact
 * mechanism atlas.ts warns about for `confusedWith`, arriving through
 * `exercises` instead, and tests/atlas.mjs had a line asserting that edge present
 * which this promotion had to rewrite.
 *
 * IT IS FILED HERE ANYWAY, AND ontology-counting.ts PRE-ARGUED THE CASE. That
 * file declined `counting-principles => binomial-theorem` on the merits and then
 * recorded, about this exact structural limit: "had the credit claim held, filing
 * this concept in `rational-expressions` would have become the only way to say
 * so, and a boundary refused above on the merits would have had to be re-argued
 * against a structural limit." That is this promotion's situation with the signs
 * flipped, and the conclusion it names is the one taken: the boundary is decided
 * on the merits and the loss is recorded.
 *
 * AND THE MERITS ARE NOT CLOSE. `counting-and-arrangements` claims "how big a set
 * is, worked out from the structure of the choices that build it"; it declined
 * the name `combinatorics` on the ground that the word would have made its
 * `covers` a promise about generating functions and the probabilistic method. A
 * concept whose content is that a RATIO of two counts is a probability — which
 * needs the equally-likely hypothesis, which is a fact about a SPACE and is this
 * subject's second knowledge point and nothing at all to do with counting —
 * would make that `covers` a promise about chance. It is also the wrong place
 * structurally: `conditional-probability` names this node, so the probability
 * chain would run up through a counting subject. Both of the sentences a learner
 * actually reads point the other way. `probability`'s own `covers` says "the
 * first node above it is `counting-probability`, where combinatorics becomes the
 * SUBJECT'S first real technique", and this subject's `covers` said
 * "`counting-probability` directly above is where it meets chance". Filing in
 * counting would have falsified the first of those, which is the half that
 * matters, and that is the test ontology-counting.ts itself applied to
 * `sets-and-membership`.
 *
 * WHAT PARTLY REPLACES THE LOST EDGE IS A DIFFERENT ONE, declared below and NOT
 * offered as a substitute for it. `counting-probability => sample-spaces` is an
 * `encompasses` this ontology may say because it contains both ends, and it holds
 * on the merits measured against the tasks rather than by analogy: the second
 * point below reads an event off a space, the third takes a complement from 1 and
 * repairs an overlap, and those are the first concept's second and third points
 * being used rather than mentioned. What it does not do is credit the COUNTING,
 * which is the edge that went, and a learner who has just computed C(12, 3) will
 * still have `counting-principles` come due as though untouched. That is the
 * behaviour change this promotion ships, it is named here rather than left to be
 * found, and the fix is a `kind` on `links` rather than anything about chance.
 *
 * ── FIDELITY IS `guided`, AND NO PATTERN WAS INVENTED FOR IT ──────────────
 *
 * The map node carried NO `match`, so there is nothing to carry across verbatim
 * and the rule every promotion since the fourth has followed does not reach this
 * case. What does reach it is ontology-algebra.ts's `nonlinear-systems`, the one
 * other promotion to author a patternless node: adding a pattern while writing
 * material moves the recognition figure in tests/atlas.mjs and the
 * written-concept count in the same edit, with no way afterwards to say which
 * change moved which. So `fidelity` is `guided`, the `caveat` is required and is
 * printed verbatim, and recognition is unmoved — 271 of 299 before and after,
 * since the denominator is the composed list and a promotion neither adds nor
 * removes an entry from it.
 *
 * THE PATTERN THAT WOULD BE REACHED FOR IS THE ONE atlas.ts NAMES AS THE FAILURE
 * MODE. `MapNode.match` says to write it "as an encyclopaedia names the thing"
 * and gives the counter-example literally: "`/\bbayes/i` and not
 * `/probability/i`, because the second matches forty articles that merely mention
 * probability". This concept's content has no title of its own that the atlas can
 * vouch for — the node's own name, "Equally likely outcomes", is a description
 * and not a heading — and the words available are the ones a pattern must not
 * take, since fourteen unwritten nodes of `probability` would answer to them.
 * Narrowing or widening recognition here is a separate change with its own
 * measurement, exactly as the section above says of the dead alternative it
 * found and did not repair.
 *
 * ── WHAT IS NOT HERE, WHICH IS A BOUNDARY RATHER THAN A BACKLOG ───────────
 *
 * COUNTING AS A SUBJECT. All three points below call `counting-principles` out
 * loud and use it — a descending product over its orderings, a product of two
 * such counts, inclusion–exclusion over two sets — and not one of them re-derives
 * it. Every count is set up, named as that concept's work, and then DIVIDED,
 * which is the only move this concept owns. The boundary is assertable and is
 * asserted: exactly three of the nine tasks below answer with a count rather than
 * a probability, they are the size of the space, one favourable count and a
 * partition total, and the subject the counting belongs to is authored — so a
 * learner who cannot do it is gated out by the `links` entry rather than taught
 * it here.
 *
 * THE HYPERGEOMETRIC DISTRIBUTION, which the second point below computes one
 * value of without naming. C(5, 1)·C(7, 2)/C(12, 3) IS a hypergeometric
 * probability, and the reason the name is absent is that a distribution is a
 * FUNCTION of k and the material asks for one number at a time:
 * `discrete-distributions` is five nodes up this area and needs
 * `random-variables` first, because the object it is about is the function and
 * not any of its values. Naming it here would promise a mechanism from an
 * instance.
 *
 * CONDITIONING, INDEPENDENCE AND MULTIPLICATION ALONG A TREE.
 * `conditional-probability` is the node directly above and the boundary is the
 * same one the section above drew, now one layer higher: everything below counts
 * subsets of ONE fixed space, and conditioning replaces the space. In particular
 * nothing below multiplies two probabilities. The draws in the worked examples
 * are all simultaneous for that reason — "three members at once, drawn by lot" —
 * because a sequence of draws invites P(first)·P(second given first) and that
 * product is the node above's.
 *
 * SAMPLING WITH REPLACEMENT. It would be one line from the product rule and it
 * belongs with conditioning rather than here: the natural question about it is
 * whether the draws influence one another, which is independence.
 *
 * ── WHY EVERY TASK IS `evaluate`, AND WHAT THE NINE ARE MADE OF ───────────
 *
 * Nine tasks, three on each point, all nine `evaluate` and every one settled by
 * exact arithmetic with no worker. That is the property both neighbouring
 * subjects hold and the reason is the same: a subject whose prerequisites are a
 * list and a count sits low enough that a worker outage must not wall it off.
 *
 * THE CHECK THAT REPLACES THE FIRST CONCEPT'S IS THE SAME ONE WITH A DIFFERENT
 * DENOMINATOR, and it is the sharper half of this material's defence. There,
 * five of nine references were k/8 with k whole. Here SIX of nine are
 * probabilities and every one of them is k/220 in lowest terms with k a whole
 * number between 0 and 220 — 1/22 is 10/220, 21/44 is 105/220, 37/44 is 185/220,
 * 5/11 is 100/220 — because every probability below is a count of favourable
 * committees over the 220 committees there are. The three that are NOT
 * probabilities are the size of the space, a favourable count, and the partition
 * total, which is exactly the set of answers that count something. A reference
 * outside [0, 1], or one whose numerator over 220 is not whole, is an authoring
 * fault in the same way 83.5 would be one in the counting subject.
 *
 *     (a*b*c)/d           an unordered count: the ordered one over its orderings
 *     e/n                 a favourable count over the size of the space
 *     (a*b*c)/(d*e*f)     the same probability with BOTH counts left ordered
 *     a*((b*c)/d)         two selection counts multiplied — one type, then the other
 *     a + b + c + d       four cases of a partition, which must return the space
 *     1 - c/n             a complement taken AFTER dividing
 *     (a + b - c)/n       an overlap repaired on the COUNTS, divided once
 *     (n - c)/n           the same union by its complement, repaired BEFORE dividing
 *
 * THREE PAIRS OF TASKS AGREE ON PURPOSE, which is three more than usual and
 * needs saying, because a reference appearing twice is normally a duplicate. Each
 * agreement is the content of the point it sits in and none of the three is
 * between two tasks of the same shape:
 *
 *  - 1/22 twice, by `e/n` at (10, 220) and by `(a*b*c)/(d*e*f)` at (5, 4, 3, 12,
 *    11, 10). The unordered route and the ordered route to ONE probability, which
 *    is the first point's whole claim: the 3! divides both counts and a common
 *    factor in a ratio cancels, so the convention is free as long as it is the
 *    same one twice.
 *  - 220 twice, by `(a*b*c)/d` at (12, 11, 10, 6) and by `a + b + c + d` at (35,
 *    105, 70, 10). The size of the space, and the same space counted by how many
 *    new members a committee holds. A partition that did not come back to the
 *    whole would not be a partition, so the second answer is the first answer or
 *    the audit has failed — the device ontology-sets.ts introduced and both
 *    neighbouring subjects reused.
 *  - 5/11 twice, by `(a + b - c)/n` at (55, 55, 10, 220) and by `(n - c)/n` at
 *    (120, 220). The inclusion–exclusion repair, and a route to the same union
 *    that never adds or subtracts an overlap at all. An error in the alternating
 *    expression could not survive into the second, which is what makes it a check
 *    rather than a rearrangement.
 *
 * `(a + b - c)/n` IS COLLECTED OVER ONE DENOMINATOR, AND THE FIRST CONCEPT
 * REFUSED EXACTLY THAT. Its `a/n + b/n - c/n` is three separate probabilities
 * because its lesson is that the two probabilities could not be ADDED in the
 * first place, and a collected numerator would have hidden it. Here the lesson is
 * the opposite one and the collected form is the right encoding: inclusion–
 * exclusion is a repair to the COUNTS, done by `counting-principles` before any
 * probability exists, and dividing once at the end is all this concept adds. The
 * two expressions are the two concepts' boundary written in a denominator.
 *
 * `1 - c/n` IS THE FIRST CONCEPT'S EXPRESSION RE-ASKED, deliberately and at a
 * different substitution, because the rule really is unchanged and the only thing
 * that moved is where the 35 came from: there `c` was read off a printed list of
 * eight outcomes, here it is C(7, 3) and had to be counted. Paired below with
 * `(n - c)/n`, which takes the complement BEFORE dividing, so the two together
 * say that the complement may be taken on either side of the division — which is
 * a fact and not a presentation choice.
 *
 * NO `transform_to_form`. The forms this build ships are claims about an
 * ALGEBRAIC shape and there is no demand of shape here; `21/44` is not asked as a
 * form because the question is how likely the committee is, not how to write the
 * number. The one that would have been useful still does not exist, and the
 * section above records it: a probability is conventionally given in lowest terms
 * and `maxDenominatorDegree` bounds a DEGREE rather than a denominator, so
 * `105/220` cannot be refused in favour of `21/44`. `exactValue` compares values
 * and rules both correct, which is the right ruling for an `evaluate`.
 *
 * NO `counterexample` AND NO `justify`, the second being the live loss again.
 * The `justify` ask here is the first point's cancellation — "say why the
 * orderings divide out of the ratio" — and naming the kind in an objective would
 * promise an observation nothing in this build can make. What stands in for it is
 * the pair of tasks whose AGREEMENT is the argument: two routes, one number, and
 * the number is the reason the convention does not matter.
 *
 * NO `domainConditions` ON ANY OF THE NINE. Every denominator is either the size
 * of the sample space, which is 220 in every task, or a count of orderings, which
 * is 2 or 6; none is a declared variable that could be zero.
 *
 * ── THE ONE STRANDED EDGE, AND THE TWO SILENT LOSSES CHECKED FOR ──────────
 *
 * The node declared two `needs` and ONE is stranded, which is one fewer than each
 * of the two promotions before it cost and is read off the node exactly as the
 * durable rule says: a promotion strands as many edges as the node
 * declares `needs` outside its new subject. `sample-spaces` is in this subject so
 * that edge is in the `EDGES` below; `counting-principles` is a concept of
 * `counting-and-arrangements`, so `ontologyProblems` would report an unknown
 * endpoint for it here and it is an entry in `PROBABILITY.links` — the third that
 * area now holds, filed with the area that owned the departing node. Both its
 * ends are authored, so it gates from the moment it exists.
 *
 * `confusedWith` ON THE DEPARTING NODE: NONE, checked before deleting it rather
 * than assumed, which is the stranding no suite catches.
 *
 * `exercises`: ONE, `counting-principles`, and it is the edge this promotion
 * destroyed. Argued above rather than here. It is the first time an `exercises`
 * claim has been lost to a promotion, where the four previous checks for one
 * found nothing to lose.
 *
 * ONE INBOUND EDGE SURVIVED AND WAS NEVER AT RISK. `conditional-probability`, a
 * node of `probability`, declares this one in its own `needs`; it stayed, so
 * `expandEdges` emits that edge and `composeAtlas` resolves it untouched. It is
 * also this promotion's whole yield, and it is expensive: that node declares this
 * concept and NOTHING else, so it is READY the moment this file ships — and it is
 * one of Rubneb's three ANCHORS, so the next run out of this area empties a slot
 * and pays a refill. armature.ts said the slot was safe "three or four deep" on
 * the strength of this concept being unwritten; that sentence had to be corrected
 * there, and the correction is this promotion's.
 *
 * ── THE THIRD CONCEPT, AND THE READY FIELD MEASURED RATHER THAN QUOTED ────
 *
 * `conditional-probability`, the forty-seventh promotion, and the THIRD node this
 * subject has taken in a row from directly above its own material.
 *
 * The field was recomputed from the tree rather than read out of the section
 * above, which every promotion from the fortieth on has had to repeat. 208 map
 * nodes before, 207 after; 91 authored concepts before, 92 after; 19 areas, 17
 * subjects, TWELVE ready before and THIRTEEN after — a ready node being one whose
 * every `needs` is `isTeachable` — and NONE floor-blocked, the thinnest area
 * holding a ready node being `functions` at ten against a floor of five. All ten
 * journeys read zero unwritten steps on route, as they have since 2026-11-18, so
 * route demand ranked nothing.
 *
 * ELEVEN OF THE TWELVE WERE UNDER A REFUSAL, each checked against the file that
 * records it rather than counted off the section above: the standing seven
 * (`graphs-of-functions`, `relations`, `linear-inequalities`, `complex-numbers`,
 * `supremum-and-completeness`, `constructions`, `non-euclidean-geometry`),
 * `word-problems` (the forty-third, on rulability), `eigenvalues` (refused by its
 * own host, ontology-matrices.ts, in two places), `combinatorial-identities` (the
 * forty-fifth, on rulability) and `sampling-and-bias` (the forty-sixth, on
 * rulability, the `word-problems` shape one layer up). So the choice was FORCED
 * for the third promotion running: exactly one unrefused node, and it was the one
 * the section above predicted it was leaving.
 *
 * THE OTHER TWO FACTORS AGREED, WHICH IS WORTH RECORDING BECAUSE THEY HAVE NOT
 * HAD THE CHANCE TO SINCE THE FORTY-SECOND. This node strands ZERO edges — it
 * declared `needs: ['counting-probability']` and nothing else, and the run before
 * had already authored that concept into this subject — and it had four
 * dependents, the most of anything unrefused. A forced choice that the ranking
 * would also have made is the one case where the ranking can be checked.
 *
 * ── THE CHAIN-WALK RAN OUT, AND THAT IS THIS PROMOTION'S REAL FINDING ─────
 *
 * atlas-uncertainty.ts has been recording a mechanism since the forty-fifth:
 * promoting an area's root hands the root position to whatever sat directly above
 * it, so a chain into an unwritten area can be walked one node per run, and each
 * run's yield is the next run's candidate. Three promotions did exactly that.
 *
 * It stops here, and the reason is that the rule was stated too widely. "Whatever
 * sat directly above it" is a chain-walk only while EXACTLY ONE node sits
 * directly above. `sample-spaces` and `counting-probability` each had one in-area
 * dependent; `conditional-probability` had THREE — `bayes-theorem`,
 * `random-variables` and `markov-chains` all name it and nothing else inside
 * `probability` — so its departure handed the root position to all three at once
 * and the root set GREW from one to three, the first growth that area has seen.
 * The cheap shape was never a property of the area. It was a property of the part
 * of the chain that happened to be a chain, and it ends at the first fork.
 *
 * WHAT DID KEEP PAYING IS THE OTHER HALF: a chain taken in order eventually costs
 * the area NOTHING, because the run before has always already moved the far end
 * of the only edge there was. Two stranded, then one, then none.
 *
 * AND FOUR DEPENDENTS BOUGHT TWO READY NODES, NOT FOUR, which is the first time
 * in this area those two numbers have differed. `bayes-theorem` names this
 * concept and nothing else. `random-variables` names it and `function-concept`,
 * written. `markov-chains` names it and `eigenvalues`, refused by its host; and
 * `causal-inference`, over in `statistics`, names it and `anova-and-design`,
 * unwritten and nine nodes deep. So the count of dependents is an UPPER BOUND on
 * the yield and every earlier promotion here got away with treating them as the
 * same number.
 *
 * ── THE FIELD THE NEXT RUN INHERITS, WHICH HAS TWO CANDIDATES AND A TRAP ──
 *
 * THIRTEEN ready, 0 floor-blocked, ELEVEN still refused — the list above is
 * unchanged, this promotion adding no refusal. Unrefused and available: TWO, and
 * both are this promotion's own yield.
 *
 *  - `bayes-theorem` (`probability`) — needs `conditional-probability` and
 *    NOTHING else, so filed here it strands ZERO edges, which is what this
 *    promotion also managed and nothing before the forty-second had. ONE
 *    dependent, `bayesian-inference`. Rulable: reversing a conditional from a
 *    base rate is a number, and the medical-test instance is the standard one.
 *  - `random-variables` (`probability`) — needs `conditional-probability` and
 *    `function-concept`, the latter authored in `functions-and-inverses`, so
 *    filed here it strands ONE edge into `PROBABILITY.links`. TWO dependents,
 *    `expectation` and `continuous-distributions`. Worth thinking about before
 *    assuming it is rulable: a random variable IS a function, and what can be
 *    asked for is a value of its distribution rather than the object itself.
 *
 * So the second factor says `bayes-theorem` and the third says
 * `random-variables`, which is the shape the forty-first promotion's header
 * described and the established order resolves — stranded edges before
 * dependents. BOTH are Rubneb ANCHORS, so either empties that slot; a factor
 * that adds the same work to both sides decides nothing and is recorded here
 * rather than argued.
 *
 * AND THE TRAP IS AN EDGE, WHICH IS WHY THIS SECTION ENDS ON IT.
 * `bayes-theorem` DECLARES `confusedWith: ['conditional-probability']`, with a
 * `because` calling it "the single most consequential confusion in the subject —
 * the prosecutor's fallacy and the medical-test error". An edge belongs to the
 * node that declares it, so this promotion could not touch that one and did not;
 * `expandEdges` still emits it, now from a node to an authored concept. But the
 * run that promotes `bayes-theorem` DELETES it, and nothing goes red, because
 * `interferes_with` constrains SELECTION rather than gating — the exact stranding
 * atlas.ts warns about and the forty-sixth promotion lost an `exercises` claim
 * to. The repair is available and cheap for once: both ends would be in THIS
 * ontology, so the edge becomes an ordinary entry in `EDGES` with a `rationale`,
 * which tests/atlas.mjs requires. That makes `bayes-theorem` the first candidate
 * on this map whose promotion would make an existing edge MORE expressible
 * instead of less, and it is a reason to prefer it beyond the second factor.
 *
 * ── FIDELITY IS `checked`, AND THE SHORTFALL RUNS BOTH WAYS FOR THE FIRST TIME ──
 *
 * The map node's pattern is carried verbatim, as every promotion since the fourth
 * has carried its own, and the node already declared `checked` — `expandNode`
 * sets fidelity from the presence of a `match` — so recognition is unmoved at 271
 * of 299. Widening or narrowing a pattern in the same change that adds material
 * moves the recognition figure and the written-concept count at once, with no way
 * afterwards to say which edit moved which.
 *
 * THE FIRST CONCEPT'S SHORTFALL IS RECALL AND THIS ONE'S IS BOTH, which is worth
 * saying plainly because that file calls underclaiming "the failure mode to
 * prefer" and this pattern does not have the luxury. `/\bconditional
 * probability\b/` reaches "Conditional probability", which is exactly this
 * concept, and ALSO "Conditional probability distribution" and "Conditional
 * probability table" — pages about a FUNCTION of a random variable and about
 * Bayesian networks. `random-variables` is a node of `probability` and unwritten,
 * so a learner on either page is offered this concept, which is its prerequisite
 * rather than its subject. That is an overclaim, it is the first in this file, and
 * it is defensible only in the weak sense that the concept offered is the one the
 * page rests on.
 *
 * WHAT IT MISSES IS A LIST, and each entry is at least partly this material:
 * "Independence (probability theory)", "Conditional independence", "Law of total
 * probability", "Chain rule (probability)". The obvious widenings are both wrong
 * and worse than the gap — `/\bindependence\b/` claims the linear-algebra and
 * set-theory senses of the word, and `/\bconditional\b/` claims conditional
 * expectation, conditional convergence and conditional statements in logic, which
 * are three authored subjects away from here.
 *
 * AND THE SECOND ALTERNATIVE IS DEAD, WHICH IS THE SECOND TIME IN THIS FILE'S
 * THREE PATTERNS. `independence \(probability\)` can never match: the alternation
 * is wrapped in `\b(...)\b` and the alternative ends in a literal `)`, and a `\b`
 * after a non-word character needs a word character next. That is identical to
 * `sample-spaces`' `event \(probability theory\)`, one concept down, found the
 * same way — by testing the pattern rather than reading it. Finding the same hole
 * in the next node up the same chain is what turns one mistake into a shape worth
 * sweeping the atlas for, and the sweep is still a separate change.
 *
 * THIS ONE IS DEAD TWICE OVER, which the first instance was not, and the
 * difference matters to whoever repairs them. There the author had a real title
 * and one `\b` defeated it, so dropping the `\b` revives it. Here the article is
 * "Independence (probability theory)", so the alternative is wrong about the
 * TITLE as well as unreachable and repairing the bracket would leave it dead.
 * tests/concepts-logic.mjs asserts both facts, so the commit that fixes patterns
 * is told which of the two cases each one is.
 *
 * ── WHAT IS NOT HERE, WHICH IS A BOUNDARY RATHER THAN A BACKLOG ───────────
 *
 * REVERSING A CONDITIONAL WITHOUT THE OVERLAP IN HAND. That is `bayes-theorem`,
 * the node directly above, and the boundary is sharper than "harder cases of the
 * same thing": the material below computes P(A|B) = 6/55 and P(B|A) = 3/5 from
 * the SAME overlap of 6, which is the asymmetry demonstrated rather than
 * asserted. What it never does is get one from the other, because that needs the
 * base rate and a partition of the space — and the reason to hold the line there
 * is that the error Bayes exists to prevent is produced by believing the two
 * conditionals are one quantity, so the fact has to be met before the formula
 * that exploits it. The interference edge the node above declares says the same
 * thing in the graph.
 *
 * THE LAW OF TOTAL PROBABILITY. One line from the multiplication rule and a
 * partition, and genuinely useful — it is also exactly what `bayes-theorem`
 * needs, so it belongs with it rather than here. The second point adds across
 * TWO paths of one tree, which is the special case where the partition is a
 * single draw's outcomes, and it is named there as what it is rather than as the
 * general law.
 *
 * CONDITIONAL EXPECTATION AND CONDITIONAL DISTRIBUTIONS. Both attach a NUMBER to
 * each outcome first, so both wait on `random-variables`, exactly as the
 * hypergeometric distribution did for the concept below. The pattern overclaims
 * one of their article titles, which is recorded above and is not repaired here.
 *
 * INFINITE AND CONTINUOUS SPACES. Equally likely outcomes stop existing there, so
 * `|A and B| / |B|` has no analogue — but `P(A and B) / P(B)` does, which is why
 * the first point derives the second form from the first instead of mentioning
 * it. That is the one place this concept reaches past the subject's own floor,
 * and it reaches with a definition rather than with an example.
 *
 * ── WHY EVERY TASK IS `evaluate`, AND WHAT THE NINE ARE MADE OF ───────────
 *
 * Nine tasks, three on each point, all nine `evaluate` and every one settled by
 * exact arithmetic with no worker — the property both concepts below hold, for
 * the reason both give: a subject whose prerequisites are a list and a count sits
 * low enough that a worker outage must not wall it off.
 *
 * THE REFERENCE CHECK IS THE CONCEPT BELOW'S WITH THE DENOMINATOR TAKEN AWAY.
 * There every one of the nine answers was a count of committees or such a count
 * over the 220 there are, so `220 x reference` was a whole number nine times out
 * of nine. Here it is whole FOUR times and not whole five, and neither number is
 * arbitrary:
 *
 *  - NOT ONE of the nine answers with a count, where that concept had exactly
 *    three. All nine lie in [0, 1]. Every count this concept uses is supplied in
 *    a prompt as the concept below's work, and the only move it owns is choosing
 *    a denominator — so a tenth task answering with a count would mean a count
 *    was being asked for its own sake.
 *  - THE FOUR with `220 x reference` whole are the questions still asked inside
 *    the committee space: 6/55 twice, 3/5, and the 1/22 the chain reproduces. The
 *    FIVE that are not are asked in a space that is not the committee draw at
 *    all — an ordered run of three (1320), a pair (66), a draw WITH replacement
 *    (144), and two products of probabilities which are not event counts over
 *    anything (16, 968). That is "conditioning replaces the space" as a property
 *    of the answers rather than of the prose.
 *
 *     k/m                        the overlap over the CONDITION, not the space
 *     (k/n)/(m/n)                the same conditional from two probabilities
 *     (a/p)*(b/q)*(c/r)          one conditional factor per draw
 *     (a/p)*(b/q) + (c/p)*(d/q)  two paths: multiply along, add across
 *     (a/n)*(b/n)                the independence test's right-hand side
 *     (a/p)*(a/p)                the same factor twice, which is independence
 *
 * THREE EXPRESSIONS ARE EACH ASKED TWICE AND IN EVERY CASE THE TWO ANSWERS
 * DIFFER, which inverts the device the concept below used three times. There
 * three pairs of the same shape AGREED and the agreement was the content; here
 * the content is that moving one number changes the answer. `k/m` goes 6/55 then
 * 3/5, which is the asymmetry of conditioning with the numerator held fixed; the
 * chain goes 1/22 then 7/66, which is the conditioning tracking WHICH type left
 * rather than merely that one did; the product test goes 1/16 then 7/968, which
 * is the test failing narrowly and then structurally.
 *
 * AND EXACTLY ONE PAIR DOES AGREE, ACROSS TWO DIFFERENT SHAPES, which is where
 * the older device still applies: `k/m` at (6, 55) and `(k/n)/(m/n)` at
 * (6, 55, 220) are both 6/55, because |A and B| / |B| and P(A and B) / P(B) are
 * ONE definition with the old space divided out. Two shapes one answer, where
 * every same-shape pair gives two answers — so both the agreement and the
 * disagreements carry a claim, and nine distinct references would have been the
 * fault rather than the target.
 *
 * NO `transform_to_form`. There is no demand of algebraic shape here; 6/55 is
 * asked because it is how likely the committee is, not because of how the number
 * should be written. The gap the concept below records is unchanged —
 * `maxDenominatorDegree` bounds a DEGREE rather than a denominator, so a
 * probability cannot be required in lowest terms — and `exactValue` ruling both
 * forms correct is the right ruling for an `evaluate`.
 *
 * NO `counterexample` AND NO `justify`, the second being the live loss again. The
 * `justify` asks here are the three the worked examples carry and no task can:
 * why the restricted outcomes are still equally likely, why the paths may be
 * added, and why disjointness is not independence. What stands in for the last of
 * those is the one task whose ANSWER is the argument — 7/968 is worth computing
 * only because it is not zero.
 *
 * NO `domainConditions` ON ANY OF THE NINE. Every denominator is a pool size, an
 * event count given in the prompt, or the size of the space; none is a declared
 * variable that could be zero. Worth one sentence rather than none, because this
 * is the first concept in the subject whose denominators are not all the same
 * number, so the check had to be made per task instead of once.
 *
 * ── THE FOURTH CONCEPT, AND THE READY FIELD MEASURED RATHER THAN QUOTED ───
 *
 * `bayes-theorem`, the forty-eighth promotion, and the fourth consecutive node
 * off this one chain. Read THIS section for the field, not the three above it.
 *
 * The field was recomputed from the tree, which every promotion from the fortieth
 * on has had to repeat because the brief's list is a 2026-11-15 snapshot and is
 * wrong. BEFORE: 207 map nodes, 92 authored, 19 areas, 17 subjects, THIRTEEN
 * ready — a ready node being one whose every `needs` is `isTeachable` — and 0
 * floor-blocked, the thinnest area holding a ready node being `algebra-
 * foundations` at five nodes with eleven departures declared. ELEVEN of the
 * thirteen were refused, which the section above enumerates and which this
 * promotion adds none to, so the field came down to TWO: this node and
 * `random-variables`.
 *
 * WHY THIS ONE OF THE TWO, AND THE THIRD FACTOR POINTED THE OTHER WAY. The
 * established order is stranded edges, then dependents. `bayes-theorem` declared
 * `conditional-probability` and nothing else and so stranded ZERO — the run
 * before had authored that concept into this very subject — where
 * `random-variables` also names `function-concept`, written in
 * `functions-and-inverses`, and would strand one into `PROBABILITY.links`. On
 * dependents it loses: one against two. Both are Rubneb anchors, so that factor
 * adds the same work to both sides and decides nothing, which is recorded rather
 * than argued.
 *
 * AND THERE WAS A FOURTH REASON, WHICH IS THE ONE THAT ACTUALLY MATTERED. This
 * node DECLARED the `confusedWith` against `conditional-probability` — the
 * prosecutor's fallacy and the medical-test error, called the most consequential
 * confusion in the subject by its own `because`. `expandEdges` turns that into an
 * `interferes_with`, so deleting the node DELETES the edge and nothing goes red,
 * because interference constrains selection rather than gating. Promoting it
 * therefore either destroys that edge or makes it MORE expressible, and here it
 * is the latter: both ends land in this ontology, so the edge is an ordinary
 * `EDGES` entry. No other candidate on the map offered that, it is the first
 * `confusedWith` in the build to survive its declaring node's promotion, and it
 * survived only because the chain was taken in ORDER, lower end first. Had
 * `conditional-probability` been authored into any other subject, the edge would
 * have been inexpressible rather than unwritten — the fate
 * `counting-probability`'s `exercises` claim met at the forty-sixth. That is a
 * scheduling fact about promotions and is the durable part.
 *
 * ── WHAT THIS PROMOTION COST AND YIELDED, WHICH ARE NOT THE SAME NUMBER ───
 *
 * AFTER: 206 map nodes, 93 authored, 19 areas, 17 subjects, TWELVE ready, 0
 * floor-blocked. It spent one and made NONE, which is the first zero yield in
 * this area and the sharpest case the "dependents are an upper bound" rule has
 * had: this node had exactly ONE dependent anywhere, `bayesian-inference`, that
 * node is in `statistics` rather than here, and it also names
 * `maximum-likelihood`, unwritten. One inbound edge, zero ready nodes.
 *
 * SO A PROMOTION CAN STRAND NOTHING AND UNLOCK NOTHING AT ONCE, and the two
 * measures are independent rather than correlated. Three promotions in this area
 * had cheapness and yield move together and it was a coincidence of a chain.
 *
 * THE ROOT SET SHRANK, three to TWO, which atlas-uncertainty.ts records as the
 * seventh root-set outcome in that file and the first shrink. Same fact from the
 * other side: nothing in `probability` named the departing node, so nothing
 * inherited its place. The durable rule is that the set changes size by the
 * number of in-area dependents minus one, and three, one and zero have now all
 * happened.
 *
 * ── THE FIELD THE NEXT RUN INHERITS, WHICH IS A SINGLE CANDIDATE ──────────
 *
 * TWELVE ready, 0 floor-blocked, ELEVEN still refused and the list above
 * unchanged. Unrefused and available: ONE.
 *
 *  - `random-variables` (`probability`) — needs `conditional-probability`, now
 *    the third concept here, and `function-concept`, authored in
 *    `functions-and-inverses`. Filed here it is an ordinary `needs` for the
 *    first and strands the second into `PROBABILITY.links`, which would be that
 *    list's fourth entry and the first it has gained since the forty-sixth. TWO
 *    dependents, `expectation` and `continuous-distributions`, and it is the
 *    other root of this area. It is NOT a Rubneb anchor hazard in the way the
 *    last two were: it is already an anchor, so taking it empties that slot a
 *    THIRD time in three promotions, and armature.ts says plainly that there is
 *    no fallback left once `markov-chains` is spent — whoever takes it has to
 *    choose on the region's `because` with nothing in the area that preserves
 *    the reading. That is the real cost and it is larger than an edge.
 *
 * RULABILITY IS THE QUESTION TO SETTLE BEFORE ASSUMING IT, and the forty-seventh
 * header raised it without answering it. A random variable IS a function from
 * outcomes to numbers, so "write down the random variable" is a `state` task and
 * this build has no verifiable kind for one. What CAN be asked is a VALUE: the
 * probability that X takes a particular value, an expectation once that concept
 * exists, a distribution evaluated at a point. The fourth idea of this subject
 * is the hypergeometric distribution's formula in all but name, which this
 * file's own boundary section defers to that node precisely because a
 * distribution is the FUNCTION rather than any of its values. So the material is
 * there and the risk is the opposite of `combinatorial-identities`' — not that
 * nothing can be asked, but that what can be asked is indistinguishable from the
 * concept below it. Somebody should decide that deliberately rather than
 * discover it after authoring nine tasks.
 *
 * AND IF IT IS REFUSED, THE FIELD IS EMPTY. Twelve ready, eleven refused, one
 * candidate: a refusal here leaves no unrefused ready node anywhere on the map
 * for the first time since the promotion run began, and the next run's job
 * becomes overturning a recorded refusal rather than authoring. `eigenvalues` is
 * the one to look at first — four dependents, refused by its own host in
 * ontology-matrices.ts rather than on rulability — and the SHAPE-vs-MOVE test is
 * how the earlier refusals were overturned. That is a measurement and not a
 * recommendation.
 *
 * ── THE FIFTH CONCEPT, AND THE READY FIELD MEASURED RATHER THAN QUOTED ────
 *
 * `random-variables`, the forty-ninth promotion, and the only candidate the
 * section above left. Read THIS section for the field, not the four above it.
 *
 * The field was recomputed from the tree rather than taken from that section.
 * BEFORE: 206 map nodes, 93 authored, 19 areas, 17 subjects, TWELVE ready — a
 * ready node being one whose every `needs` is `isTeachable` — and 0
 * floor-blocked, the thinnest area holding a ready node being
 * `algebra-foundations` at five nodes with eleven departures declared. ELEVEN of
 * the twelve were refused, which the sections above enumerate and which this
 * promotion adds none to, so the field came down to ONE and the choice was made
 * for this run before it started. The eleven are `linear-inequalities`,
 * `word-problems`, `complex-numbers`, `graphs-of-functions`, `constructions`,
 * `non-euclidean-geometry`, `supremum-and-completeness`, `eigenvalues`,
 * `relations`, `combinatorial-identities` and `sampling-and-bias`; the
 * measurement agreed with the list above it in every entry, which is the first
 * time a run has recomputed the field and found the previous header exactly
 * right.
 *
 * ── THE RULABILITY QUESTION THE SECTION ABOVE DEFERRED, ANSWERED ──────────
 *
 * The forty-eighth raised it and declined to settle it, correctly: "somebody
 * should decide that deliberately rather than discover it after authoring nine
 * tasks". The worry was not that nothing could be asked but that what could be
 * asked would be INDISTINGUISHABLE from the concepts below — a random variable
 * IS a function from outcomes to numbers, "write down the random variable" is a
 * `state` task and this build has no verifiable kind for one, and the values
 * that can be asked for are probabilities, which is what the three concepts
 * below already ask for.
 *
 * THE ANSWER WAS ALREADY WRITTEN IN THIS FILE AND NOBODY HAD NOTICED. The first
 * concept's second point computes TWO answers for "exactly two heads" — 3/8 in
 * the eight-sequence space and 1/4 in the space that records only the heads
 * count — and says the wrong one is the one whose outcomes were never equally
 * likely, without saying WHICH. That four-outcome space is the set of values of
 * the heads count, which is to say it is this concept's object seen from below,
 * and the reason it cannot be divided in is that its outcomes have preimages of
 * sizes 1, 3, 3 and 1. The first concept records the disagreement and calls it
 * information loss. It cannot settle it, because settling it needs the four
 * probabilities, and four probabilities attached to the values of a rule is a
 * DISTRIBUTION. So the fifth concept finishes an argument the first one opened
 * and left open on purpose.
 *
 * THAT MAKES THE THREE MOVES SEPARABLE FROM EVERYTHING BELOW, which is the
 * actual test and not "is a number produced":
 *
 *  - THE PREIMAGE. "X = 2" is a condition on a number and a probability can only
 *    be assigned to a SUBSET of the space, so the move is to read the rule
 *    backwards and collect the sequences it sends to 2. Nothing below does this:
 *    there the event arrives already described in words ("exactly one new
 *    member") and the work is counting it. Here the event arrives as a value of a
 *    function somebody CHOSE, and the work is recovering the set. The space is
 *    deliberately eight sequences written out, so that the counting is not the
 *    content.
 *  - THE WHOLE TABLE, AND THE OBLIGATION THAT IT ADD TO 1. Every question in the
 *    three concepts below produces ONE number. This one's object is four numbers
 *    at once, and the total is a check no lower concept has: it is forced,
 *    because X is a FUNCTION and therefore sends each sequence to exactly one
 *    value, so the preimages partition the space. That is where
 *    `function-concept` is load-bearing rather than decorative, and the second
 *    place is TTT — a second variable in the worked example needs a value there
 *    or it is not a function on this space at all.
 *  - THE COLLAPSE. A function of a random variable is a random variable, and its
 *    table is got by ADDING the probabilities of the values it merges. That
 *    arithmetic is on probabilities already in hand; no counting can produce it
 *    and no question below can ask for it, because below there is no table to
 *    merge entries of. It is the move that most sharply is not the concept
 *    underneath.
 *
 * SO THE VERDICT IS PROMOTE, and the thing that would have made it a refusal is
 * worth naming: had the material been set on the club, every task would have
 * been a count over 220 with a letter X written in front of it, which is exactly
 * the indistinguishability the section above feared. The setting is what made
 * the difference, not the subject matter.
 *
 * ── WHAT THIS PROMOTION COST AND YIELDED ──────────────────────────────────
 *
 * AFTER: 205 map nodes, 94 authored, 19 areas, 17 subjects, TWELVE ready, 0
 * floor-blocked. It spent one and made ONE — `expectation` — so the ready COUNT
 * is unchanged at twelve while its MEMBERSHIP turned over, which has not happened
 * before in this area and is exactly the shape the "assert by name, never by
 * length" rule exists for. A run that checked only the number would conclude the
 * promotion changed nothing about what is authorable.
 *
 * TWO NODES NAMED THE DEPARTING ONE AND ONLY ONE OF THEM BECAME READY, which is
 * the "dependents are an upper bound on yield" rule biting again.
 * `continuous-distributions` also names `definite-integral`, which is a node of
 * `integration` and unwritten, so it is not ready and will not be until calculus
 * is authored. Worth stating because it is the obvious thing to get wrong here:
 * a dependent whose other prerequisite is unwritten is NOT yield, and the
 * difference is invisible in a dependent count.
 *
 * IT STRANDED ONE EDGE, WHICH ENDS A RUN OF TWO ZEROES. The node declared
 * `needs: ['conditional-probability', 'function-concept']`. The first is a
 * concept of this ontology and so is an ordinary `EDGES` entry; the second is
 * `functions-and-inverses`, so that edge cannot live here at all —
 * `ontologyProblems` refuses an edge naming a concept its ontology lacks — and
 * it is `PROBABILITY.links`' FOURTH entry, the first that list has gained since
 * the forty-sixth. The two promotions before this one cost the area nothing
 * because they came up a chain whose lower end the run before had always already
 * moved; this one comes off the chain sideways and the saving stops. That is the
 * limit of "a chain taken in order eventually costs nothing": it costs nothing
 * while you stay ON the chain.
 *
 * NO `confusedWith` WAS AT RISK, checked rather than assumed. The node declared
 * none, so there was no `interferes_with` for `expandEdges` to be emitting and
 * nothing for this promotion to destroy in silence — unlike the forty-eighth,
 * which had to rescue one. It declared no `exercises` and no `encompasses`
 * either. All four fields were read off the node before it was deleted, because
 * three of them strand without anything going red.
 *
 * THE ROOT SET GREW FROM TWO TO THREE, which is an eighth root-set outcome for
 * atlas-uncertainty.ts and the second growth it records. `markov-chains` was a
 * root and still is; the departing node had TWO in-area dependents and both
 * inherited its position, so `expectation` and `continuous-distributions` join
 * it. The rule the forty-eighth promotion wrote down holds unchanged — the set
 * changes size by (in-area dependents) minus one, and +1, 0, +2 and −1 have now
 * all happened — and the point worth keeping is that the set grew while the
 * READY count held, so the two measures move independently. Being a root says
 * nothing about being authorable; `continuous-distributions` is a root and is
 * not ready.
 *
 * ── THE FIELD THE NEXT RUN INHERITS, WHICH IS A SINGLE CANDIDATE AGAIN ────
 *
 * TWELVE ready, 0 floor-blocked, ELEVEN still refused and the list above
 * unchanged. Unrefused and available: ONE, and it is this promotion's own yield.
 *
 *  - `expectation` (`probability`) — needs `random-variables`, now the fifth
 *    concept here, and `sigma-notation`, authored in `functions-and-inverses`.
 *    Filed here it strands ONE, which would be `PROBABILITY.links`' fifth entry
 *    and the second consecutive promotion to add to that list. TWO dependents
 *    (`variance-and-covariance`, `law-of-large-numbers`). It is a Rubneb ANCHOR,
 *    so taking it empties that slot for the FOURTH time in four promotions, and
 *    the refill this run used — `variance-and-covariance` — is one of its two
 *    dependents and would still be a node, so the refill is available again.
 *    Plainly rulable: a weighted average is a number, and the distribution it
 *    averages over is now written down rather than assumed. The one thing to
 *    settle first is the opposite of this run's question — not whether anything
 *    can be asked, but whether the nine tasks would be arithmetic over a table
 *    the fifth concept supplies, which would make it this concept with a sum in
 *    front of it. The answer is probably LINEARITY, which is a fact about
 *    expectation that no table of one variable can state.
 *
 * SO THE WARNING THE SECTION ABOVE GAVE STILL STANDS ONE PROMOTION LATER: if
 * `expectation` is refused there is no unrefused ready node anywhere on the map
 * and the next run's job becomes overturning a recorded refusal rather than
 * authoring. `eigenvalues` remains the one to look at — four dependents, refused
 * by its own host in ontology-matrices.ts rather than on rulability — and that
 * is a measurement rather than a recommendation.
 *
 * AND THE ARMATURE NOTE'S "NO FALLBACK LEFT" IS NOT TRUE, which is this run's
 * second correction to a predecessor. armature.ts said that the next time
 * Rubneb's slot emptied there would be nothing to name, having ruled out the
 * distributions, the limit theorems, `stochastic-processes` and
 * `measure-theoretic-probability`. That is seven of the nine non-anchor nodes
 * and the enumeration never reached the other two. `variance-and-covariance` is
 * E[(X − μ)²] — an expected value, which is what the region's own `because` says
 * the swamp is always computing — and it is the refill this promotion used. The
 * lesson is narrower than "the note was wrong": an exhaustive-sounding
 * enumeration that rules out CATEGORIES has to be checked against the node list,
 * because a category sweep silently misses whatever belongs to no category it
 * named.
 *
 * ── THE SETTING IS THE FIRST CONCEPT'S COIN, AND THAT IS THE ARGUMENT ─────
 *
 * The three concepts between this one and the first are set on twelve club
 * members and 220 committees, and the fourth dropped the club for a screening
 * test. This one goes back to three coin tosses and the eight sequences, which is
 * the FIRST return to an earlier concept's setting in the subject and is not
 * nostalgia.
 *
 * TWO REASONS, AND THE SECOND IS THE LOAD-BEARING ONE. The first is that the
 * argument this concept finishes was opened on that space: the 3/8-against-1/4
 * disagreement is about those eight sequences and the four heads-counts, so
 * settling it anywhere else would be settling a different question. The second
 * is the boundary against `counting-probability`. On the club every preimage
 * would be a binomial coefficient and every task a count over 220, and the
 * content would be the counting with a letter X in front of it — which is
 * precisely the indistinguishability the rulability question feared. Eight
 * sequences printed in full means the preimage can be COLLECTED by eye, so the
 * only thing a learner can be doing is the move this concept is about.
 *
 * SO THE CLUB'S ABSENCE HERE IS THE SAME BOUNDARY THE FOURTH CONCEPT DREW AND
 * THE OPPOSITE DIRECTION. There the club had to go because its overlaps are
 * countable and a reversal is only needed when they are not. Here it has to go
 * because its preimages are countable and nothing else, and a concept whose
 * content is "which set is this" must not be set where finding the set is the
 * hard part.
 *
 * ── FIDELITY IS `checked`, AND THE SHORTFALL IS THE PLURAL ────────────────
 *
 * The map node's pattern and its `terms` as the hint, carried across unchanged,
 * as every promotion since the fourth has done. `expandNode` sets fidelity from
 * the presence of a `match`, so recognition is unmoved at 271 of 299 — the
 * denominator is 206 nodes plus 93 concepts before and 205 plus 94 after, which
 * is why it does not move either. Widening a pattern in the same change that adds
 * material moves the recognition figure and the written-concept count at once,
 * with no way afterwards to say which edit moved which, so the pattern is left
 * exactly as the node had it.
 *
 * `/\brandom variable\b/i` REACHES THE SINGULAR AND NOTHING PLURAL, and that is
 * the whole of its recall gap. "Random variable" is the article and it is this
 * concept; "Discrete random variable" is this concept more narrowly. Every
 * naturally-plural title in the area is unreachable — "Random variables",
 * "Algebra of random variables", "Convergence of random variables", "Sum of
 * normally distributed random variables" — because the trailing `\b` sits
 * between `variable` and the `s` that follows it, where both sides are word
 * characters and no boundary exists.
 *
 * THAT IS THE THIRD SIGHTING OF THE SAME `\b` SHAPE IN THIS FILE AND THE FIRST
 * THAT IS NOT A DEAD ALTERNATIVE. `sample-spaces` carries
 * `event \(probability theory\)` and `conditional-probability` carries
 * `independence \(probability\)`, and both can never match anything because an
 * alternative ending in a literal `)` cannot be followed by a word boundary.
 * Here the boundary does not kill the pattern — the one title that matters is
 * singular — it only costs the plural family. So the file now holds both failure
 * modes of one construction, which is worth saying because the repair differs:
 * those two want the `\b` moved or dropped, and this one wants `s?` before it.
 * tests/concepts-logic.mjs asserts the plural misses by name, so the day somebody
 * sweeps the atlas for this shape the assertion goes red and names what changed.
 *
 * AND THE OVERCLAIM IS ONE TITLE AND IS THE SAME SHAPE AS THE THIRD CONCEPT'S.
 * "Continuous random variable" matches, and this concept is discrete throughout:
 * eight outcomes, a table of four entries, and no density anywhere. A learner on
 * that page is offered this concept, which is `continuous-distributions`'
 * prerequisite rather than its subject — defensible only in the weak sense the
 * third concept's note already admits about "Conditional probability
 * distribution", and recorded for the same reason, that an overclaim is invisible
 * from the inside.
 *
 * AUTHORING THIS MAKES THE THIRD CONCEPT'S OVERCLAIM REPAIRABLE AND THE REPAIR IS
 * NOT DONE HERE. That note says `/\bconditional probability\b/` wrongly reaches
 * "Conditional probability distribution" and "Conditional probability table",
 * pages about a FUNCTION of a random variable, and that the gap could not be
 * closed because `random-variables` was unwritten — so narrowing would have left
 * those pages with no concept at all. There is now a concept about distributions
 * for them to reach. The repair is two edits in one change, a negative lookahead
 * on the third concept's pattern and a widening here, and it belongs in a commit
 * that moves no material, for the reason given above.
 *
 * ── WHAT IS NOT HERE, WHICH IS A BOUNDARY RATHER THAN A BACKLOG ───────────
 *
 * EXPECTATION. The node directly above, and the boundary is sharp rather than one
 * of depth: everything below produces the TABLE and stops. A weighted average
 * collapses the table to one number and needs `sigma-notation` to write, and the
 * fact that makes it worth having — E(X + Y) = E(X) + E(Y) whether or not the two
 * are independent — is about two variables at once, where nothing below has a
 * second variable on the page at the same time as the first. The third point's Y
 * is a function OF X rather than a second variable beside it, which is the
 * distinction that keeps the line clean.
 *
 * THE NAMED DISTRIBUTIONS. The table in the second point is the binomial with
 * three trials and a fair coin, and the name is absent deliberately: a named
 * distribution is a FAMILY indexed by its parameters, and what is built below is
 * one member of one family by collecting preimages. `discrete-distributions` is
 * three nodes up and needs `variance-and-covariance` and `binomial-theorem`
 * first. Naming it here would promise a mechanism from an instance, which is the
 * trade the second concept's note made about the hypergeometric and is the same
 * trade.
 *
 * CONTINUOUS VARIABLES AND DENSITY. A random variable on an interval has
 * P(X = c) = 0 at every single value, so the table — the one object this concept
 * is about — does not exist there and a density takes its place. That is not a
 * harder version of this: it is the case where this concept's central object is
 * identically zero, which is why `continuous-distributions` waits on
 * `definite-integral` and not merely on this.
 *
 * JOINT AND CONDITIONAL DISTRIBUTIONS AS OBJECTS. The third point computes the
 * conditional distribution of X given at least one head, and that is deliberate
 * and bounded: it is there as the CONTRAST that shows why merging values needs no
 * renormalisation and discarding outcomes does. What is not here is the
 * conditional distribution as a thing with its own algebra, or any second
 * variable to be joint WITH, both of which need `joint-distributions` five nodes
 * up. One worked contrast is not a topic.
 *
 * THE INDICATOR TRICK AND ANY OTHER VARIABLE WORTH A NAME. An indicator is the
 * random variable whose table is 1 minus p and p, and it is the cheapest example
 * in the subject — which is exactly why it is not here. Its preimage is the event
 * itself, so collecting it teaches nothing, and the whole content of the first
 * point is that collecting is a move.
 *
 * ── WHY EVERY TASK IS `evaluate`, AND WHAT THE NINE ARE MADE OF ───────────
 *
 * Nine tasks, three on each point, all nine `evaluate` and every one settled by
 * exact arithmetic with no worker — the property all four concepts below hold,
 * for the reason they give: a subject sitting this low must not be walled off by
 * a worker outage.
 *
 * NO `state` TASK, WHICH IS THE REFUSAL THE RULABILITY QUESTION WAS ABOUT. "Write
 * down the random variable" is the natural first question about this concept and
 * it is a `state`, which `TaskKind` declares unverifiable — so asking it would
 * produce a chain that cannot become evidence and would raise
 * `chainsWithNoRuling`. What is asked instead is always a VALUE the table
 * decides: a preimage's probability, a total, a merged entry, a renormalised
 * entry. The object is taught in the worked examples, where telling is honest,
 * and only its values are graded.
 *
 * THE DENOMINATOR IS 8 IN EVERY TASK AND IS WRITTEN AS `u*v*w` IN THREE OF THEM.
 * That triple is the first concept's `a*b*c` at (2, 2, 2) with different letters,
 * and the repetition is the point rather than laziness: the space has not
 * changed, and the three tasks that write it out are the three where a learner
 * might otherwise divide by 4. Everywhere the space is not in question it is the
 * literal `n = 8`.
 *
 *  - EIGHT of the nine lie in [0, 1] and ONE does not. 3 is the ratio of the most
 *    likely entry to the least, and a ratio of two probabilities is not a
 *    probability — the same category the fourth concept's odds ratio 18 belongs
 *    to, and the second such reference in these subjects.
 *    tests/concepts-logic.mjs asserts the count is exactly one, as that concept's
 *    group does, so the exception cannot spread quietly.
 *  - NOT ONE of the nine is a count, which is the property the two concepts above
 *    also hold. Every count in the material — the preimage sizes 1, 3, 3, 1, the
 *    four sequences behind T = 1, the seven behind X at least 1 — is in a worked
 *    example, and each task divides rather than counts.
 *  - ONE reference is exactly 1, and it is a PROBABILITY and not a count. It is
 *    the total of the table, which is the second point's whole content, and it is
 *    the first reference in these subjects that is 1 for a reason rather than by
 *    arithmetic accident.
 *  - NO GIVEN IS REPEATED, inside this concept or against the thirty-six tasks
 *    below it. The subject has six expressions asked at more than one
 *    substitution and this promotion adds none, which is deliberate: the fourth
 *    concept's group asserts a ranking over exactly those six, and a seventh
 *    would have made that assertion this promotion's business for no teaching
 *    gain.
 *
 * TWO DIFFERENT SHAPES AGREE ON 3/4 AND THE AGREEMENT IS THE TEACHING. `(q+r)/n`
 * in the second point and `q/n + r/n` in the third give the same number because
 * they are the same event: "X is 1 or 2" and "Y is 1" are one subset of the eight
 * sequences under two descriptions, which is what it MEANS for Y to merge two
 * values of X. The fourth concept had three shapes agree because a theorem has
 * forms; this is two shapes agreeing because a set has two names.
 *
 * NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
 * `domainConditions` on any of the nine, for the reasons the four concepts below
 * give. One addition: `1 - p/n` appears inside a DENOMINATOR in the ninth task,
 * which is the first time a complement has been divided by in these subjects, and
 * it cannot vanish — `p < n` at the one substitution used, and a complement of
 * probability 0 would be conditioning on an impossible event, which is undefined
 * rather than merely awkward. Checked on the task rather than declared as a
 * domain condition, because the expression is fine and only a substitution could
 * break it.
 *
 * ── THE ONE STRANDED EDGE, AND THE FOUR SILENT LOSSES CHECKED FOR ─────────
 *
 * The node declared `needs: ['conditional-probability', 'function-concept']`.
 * The first is a concept of this ontology and is an ordinary `EDGES` entry. The
 * second is `functions-and-inverses`, so it is `PROBABILITY.links`' fourth entry
 * — filed in the area that OWNED the departing node, which is the established
 * rule — and it GATES immediately, because both ends have material.
 *
 * THE FOUR FIELDS THAT STRAND WITHOUT ANYTHING GOING RED were each read off the
 * node before it was deleted, and all four were empty: no `confusedWith` (so no
 * `interferes_with` for `expandEdges` to lose), no `exercises` and no
 * `encompasses` (so no credit edge to lose), and no second cross-subject `need`.
 * Saying "all four were empty" is worth a line because the forty-sixth promotion
 * lost an `exercises` claim to this mechanism and the forty-eighth had to rescue
 * an `interferes_with`, and in neither case would a suite have noticed.
 *
 * THE CREDIT EDGE THIS CONCEPT DECLARES SKIPS ITS OWN PREREQUISITE, which is a
 * first in the subject and is argued in the `EDGES` entry rather than here. In
 * one line: it credits `sample-spaces`, two concepts down, because every division
 * in the material is in that concept's space under that concept's licence — and
 * it does NOT credit `conditional-probability`, which gates it, because exactly
 * one of nine tasks conditions anything.
 *
 * ── THE SIXTH CONCEPT, AND THE READY FIELD MEASURED RATHER THAN QUOTED ────
 *
 * `expectation` was the SINGLE unrefused ready node on the map, so the choice
 * was forced and the fiftieth promotion's work was the question the forty-ninth
 * deferred: is this concept distinguishable from the one below it, or is it that
 * concept with a sum in front of it? The predecessor guessed LINEARITY and the
 * guess was right, with one addition it did not reach.
 *
 * THE VERDICT IS PROMOTE, AND THE ARGUMENT IS THAT TWO OF THE THREE MOVES CANNOT
 * BE STATED BY A TABLE OF ONE VARIABLE AT ALL.
 *
 *  - THE WEIGHTED TOTAL is the move that IS arithmetic over the fifth concept's
 *    table, and on its own it would have been the refusal. What rescues it is
 *    that it produces a new KIND of number — 12/8 is outside [0, 1] and is
 *    measured in heads rather than in chance, which no quantity in the five
 *    concepts below is — and that the weights are provably doing work. The
 *    proof is the sharp part: X and T take the SAME four values on the same
 *    eight sequences, so any method reading only the value list must give them
 *    the same answer, and their expectations are 12/8 and 11/8. The first two
 *    tasks are therefore ONE EXPRESSION AT TWO SUBSTITUTIONS, with the values
 *    written in as literals so that nothing a learner can see distinguishes the
 *    questions. Every other shared-expression pair in these subjects is a pair
 *    because the two AGREE; this is the first where disagreeing is the content.
 *  - LINEARITY cannot be stated by that table. E[aX + b] = aE[X] + b is a claim
 *    about a FAMILY of rules, and its proof is `sigma-notation`'s third point
 *    twice over plus the fifth concept's forced total of 1 — so the shortcut is
 *    standing on the partition, and against a conditioned table totalling 7/8 it
 *    would give aE[X] + 7b/8 and be false. The boundary is where it earns its
 *    keep: on Y = |2X - 3| the shortcut returns |2(12/8) - 3| = 0 while
 *    E[Y] = 12/8, and 0 is not merely wrong but OUTSIDE the range of Y, which is
 *    1 or 3 on every one of the eight sequences. A fault catchable before any
 *    arithmetic is done.
 *  - ADDITIVITY is the one that settles the question. E[X + T] = E[X] + E[T]
 *    needs TWO variables side by side, and the fifth concept has none — its Y is
 *    a function OF X and carries no information X does not. The subject's own
 *    `covers` had already recorded that, which is why this was the deferred
 *    question rather than an open one. And what makes it the useful fact is what
 *    it does NOT need: X and T are DEPENDENT by `conditional-probability`'s
 *    product test, 1/16 against an empty overlap, and the addition held anyway.
 *    The multiplicative version does not — E[XT] = 17/8 against
 *    E[X]E[T] = 33/16, false by 1/16 — so the asymmetry is observed rather than
 *    asserted.
 *
 * ── WHAT THIS PROMOTION COST AND YIELDED ──────────────────────────────────
 *
 * AFTER: 204 map nodes, 95 authored, 19 areas, 17 subjects, TWELVE ready, 0
 * floor-blocked. Coverage 94 -> 95 material, 94/94 -> 95/95 practisable,
 * 966/1053 -> 984/1071 questions, 266 -> 269 chains, `chainsWithNoRuling`
 * UNCHANGED at 1, recognition unchanged at 271/299 since the pattern was carried
 * verbatim.
 *
 * THE READY COUNT HELD AT TWELVE A SECOND CONSECUTIVE TIME, BY A DIFFERENT
 * MECHANISM, which is the measurement finding. The forty-ninth had TWO
 * dependents and one happened to be ready, so it spent one and made one by the
 * luck of the split. This node has ONE dependent and it was ready, so it spent
 * one and made one NECESSARILY. Same figure twice, two different reasons — and a
 * run reading only "twelve again" would conclude the field had stopped moving
 * when in fact its membership has now turned over twice running.
 *
 * AND THE ROOT SET HELD AT THREE WHILE EVERY MEMBER CHANGED, which is a first
 * for atlas-uncertainty.ts and is the sharpest case yet for the "assert roots by
 * name, never by length" rule — sharper than the ready-count version, because it
 * is the same measure on the same object: `length === 3` was true before and
 * after, and not one of the three nodes it named is the same.
 * `variance-and-covariance` inherited the position `expectation` vacated, and
 * the forty-eighth's rule predicted it exactly: the set changes size by (in-area
 * dependents) minus one, and this node had one.
 *
 * IT STRANDED ONE EDGE, AND THAT FALSIFIES THE FORTY-NINTH'S ACCOUNT OF ITS OWN
 * COST. That promotion also cost an entry and blamed having stepped SIDEWAYS off
 * the chain, writing that "a chain is cheap because each step's ONE prerequisite
 * is the step below it". This one stepped straight back ON to the chain —
 * `expectation` sits directly above `random-variables` — and paid anyway,
 * because the node declared TWO `needs` and `sigma-notation` is
 * `functions-and-inverses`. So the durable rule is the sentence that note ENDED
 * on rather than the one it opened with: the cost is a property of the NODE's
 * `needs`, and the orderliness of the promotions never mattered. Four of this
 * area's six departures were free and both costly ones declared two
 * prerequisites.
 *
 * NOTHING STRANDED IN SILENCE. The node declared no `confusedWith`, no
 * `exercises` and no `encompasses`; all four fields were read off it before
 * deletion. The credit edge it DOES declare goes back to the ordinary shape —
 * `expectation => random-variables`, pointing at its own gate — so the
 * forty-ninth's skip stays a single reasoned exception rather than becoming the
 * subject's habit.
 *
 * THREE ASSERTIONS WENT RED THAT WERE NOT FIGURES, AND THEY ARE THE SAME BUG
 * TWICE. Two claims about what `random-variables` DECLARES were written
 * undirected — `[e.from, e.to].includes(...)` — so authoring anything above it
 * falsified them while nothing had been lost. One of them, "nothing credits this
 * concept", was never measuring a loss at all; it was measuring whether a
 * successor existed. The repair is DIRECTION plus KIND: scoping to `e.from`
 * alone was still wrong, because this promotion's prerequisite edge also leaves
 * that concept. An absence assertion needs both, and the credit-edge one is now
 * asserted by PROVENANCE instead — every `encompasses` touching the concept is
 * `author:`-promoted, so none came off the node, which no later promotion can
 * falsify.
 *
 * AND A FIGURE PLACED AS A GUARD WENT RED ON SOMEBODY ELSE'S PROMOTION. The
 * forty-eighth's group ranks the widest same-expression pair in the subject over
 * "exactly six" repeated expressions, and the forty-ninth's group re-asserted
 * that six DELIBERATELY — saying it was doing so in the group whose promotion
 * could have caused a seventh, "rather than left for the other group to discover
 * as a failure". Both went red here, on a pair spanning 1/8 that leaves the
 * superlative untouched. Two lessons: a guard written where the damage could
 * come from only works while that is the newest code, and the forty-eighth's
 * comment described the trigger it wanted (a WIDER pair) while its code carried
 * a broader one (any new pair). The population now lives in this promotion's
 * group and the superlative stayed where it was argued.
 *
 * ── THE FIELD THE NEXT RUN INHERITS, WHICH IS A SINGLE CANDIDATE AGAIN ────
 *
 * TWELVE ready, 0 floor-blocked, ELEVEN still refused and the list unchanged:
 * `graphs-of-functions`, `relations`, `linear-inequalities`, `complex-numbers`,
 * `supremum-and-completeness`, `constructions`, `non-euclidean-geometry`,
 * `word-problems`, `eigenvalues`, `combinatorial-identities`,
 * `sampling-and-bias`. Unrefused and available: ONE, and it is this promotion's
 * own yield for the third promotion running.
 *
 *  - `variance-and-covariance` (`probability`) — needs `expectation` and
 *    NOTHING else, so filed here it strands ZERO, which no promotion has managed
 *    since the forty-eighth. TWO dependents (`discrete-distributions`,
 *    `law-of-large-numbers`). It declares no `confusedWith`, no `exercises` and
 *    no `encompasses`. It is a Rubneb ANCHOR and has been since the forty-ninth,
 *    so taking it empties that slot a FIFTH time — and this time there is
 *    genuinely nothing left to name, because the category sweep's seven plus the
 *    two that have since filled the slot account for every node the area has.
 *    Plainly rulable: E[(X - m)^2] is a number.
 *
 * THE QUESTION TO SETTLE FIRST IS NOT RULABILITY AND NOT DISTINGUISHABILITY FROM
 * THIS CONCEPT. It is a BOUNDARY against an already-authored concept in a
 * different subject, and it is invisible to the refusal set because it is not a
 * refusal. `descriptive-statistics` in ontology-statistics.ts already teaches
 * variance as the mean of the squared deviations, dividing by n, with the n - 1
 * answer named as the one it is not. So two subjects would hold a concept called
 * variance, one over a data set and one over a distribution, and whoever writes
 * the second owes an account of why they are not the same thing — the honest one
 * being that a distribution weights its squared deviations by probability where a
 * data set weights them equally, which is the sixteenth idea above applied to
 * squares. That is a real argument and it is available; what it is not is
 * automatic.
 *
 * AND ONE THIRD OF ITS LIKELY CONTENT IS ALREADY COMPUTED HERE. The ninth task
 * of this concept asks for `k/n - (g/n)*(h/n)` and answers 1/16, which is
 * E[XY] - E[X]E[Y] exactly — a covariance, deliberately not named as one,
 * because naming it would promise an account of what the number MEANS and this
 * subject has independence only as a test. A run authoring
 * `variance-and-covariance` should read that task before writing a covariance
 * point, because the arithmetic is done and only the interpretation is missing.
 *
 * SO IF `variance-and-covariance` IS REFUSED THE FIELD IS EMPTY, which is the
 * same warning the two sections above gave and which has now been deferred three
 * times. `eigenvalues` remains the one to look at first — four dependents, the
 * most of anything unrefused, and refused by its own HOST in ontology-matrices.ts
 * rather than on rulability. That is a measurement rather than a recommendation.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'chance-and-events',
  name: 'Chance and events',
  covers:
    'How likely something is, worked out from everything that could have happened — first by '
    + 'writing that list down, then by COUNTING it once it is too long to write, and then by '
    + 'REPLACING it with what you have been told, then by REVERSING what you were told '
    + 'into what you wanted to know, then by attaching a NUMBER to each outcome and '
    + 'asking after the number instead, and last by COLLAPSING those numbers to one. Six '
    + 'concepts and eighteen ideas. The first '
    + 'three are one experiment small enough to print in full, and the last SIX go back to '
    + 'that same experiment. First, '
    + 'THE SAMPLE SPACE IS A SET YOU CHOOSE, AND THE '
    + 'CHOICE IS PART OF THE MODEL. An OUTCOME is one complete result, the sample space is the '
    + 'set of all of them, and the only two conditions are that no two outcomes can both happen '
    + 'and that one of them must. An EVENT is a SUBSET of that set — "exactly two heads" is not a '
    + 'sentence about the outcomes, it is the three of them that have exactly two heads. The same '
    + 'experiment admits several sample spaces, all legal and not interchangeable: recording three '
    + 'coin tosses in order gives eight outcomes, recording only how many heads came up gives '
    + 'four, and the second is a legitimate space that has thrown away which toss was which. '
    + 'Second, EQUALLY LIKELY OUTCOMES ARE WHAT LICENSE DIVIDING, AND THAT IS A PROPERTY OF THE '
    + 'SPACE RATHER THAN OF THE EVENT. P assigns a number to each event under two conditions — '
    + 'P(of the whole space) = 1, and the probabilities of events with no outcome in common ADD. '
    + 'Those two are enough: if the eight sequences are equally likely then eight equal numbers '
    + 'add to 1, so each outcome has probability 1/8, and an event made of k of them has '
    + 'probability k/8. That is where P(E) = |E| / |S| comes from, and it is a derivation and not '
    + 'a definition — which matters because in the four-outcome space the same division gives 1/4 '
    + 'for an event the eight sequences put at 3/8, and the two cannot both be right. The one '
    + 'that is wrong is the one whose outcomes were never equally likely. Third, A COMPLEMENT '
    + 'SUBTRACTS FROM 1 AND AN OVERLAP IS SUBTRACTED ONCE. An event and its complement have no '
    + 'outcome in common and together are everything, so P(not E) = 1 - P(E) — which is the cheap '
    + 'route whenever an event is nearly everything. Two events that DO overlap cannot simply be '
    + 'added, because additivity was only ever licensed on disjoint events: P(A or B) = P(A) + '
    + 'P(B) - P(A and B), and the correction is forced rather than conventional — an outcome in '
    + 'both is counted once by each of the first two terms, so one subtraction takes it from twice '
    + 'to once. The next three ideas are the same three again with the list taken away. Fourth, '
    + 'ONCE THE SPACE IS TOO BIG TO WRITE DOWN, ITS SIZE AND THE EVENT\'S ARE BOTH COUNTS — AND '
    + 'ONE CONVENTION HAS TO SERVE BOTH. Twelve club members drawn three at a time give 220 '
    + 'committees, which is (12 x 11 x 10)/6 and not a list anybody prints. P(E) = |E| / |S| is '
    + 'the same formula as before and it is now a ratio of two counting arguments, so the only '
    + 'new risk is counting the two differently: with everything left in order the committees '
    + 'number 1320 and the all-new ones 60, and 60/1320 is the same 1/22 that 10/220 gives, '
    + 'because the 3! orderings divide BOTH counts and a common factor in a ratio cancels. Mixing '
    + 'the conventions is the one error worth drilling, and it does not announce itself: it '
    + 'inflates an answer by exactly 3! and can produce a probability greater than 1. Fifth, THE '
    + 'FAVOURABLE COUNT IS ITSELF A COUNTING PROBLEM, which is why combinatorics is this '
    + 'subject\'s first real technique. "Exactly one of the five new members" is one choice AND '
    + 'another — one of 5, then two of the remaining 7 — so the counts multiply, 5 x 21 = 105, '
    + 'and the product rule is licensed because the 21 does not depend on WHICH new member was '
    + 'picked. Dividing by the 220 gives 21/44. The four cases by how many new members a '
    + 'committee holds are 35, 105, 70 and 10, which add back to 220 or they were never a '
    + 'partition. Sixth, A COMPLEMENT OR AN OVERLAP IS REPAIRED ON THE COUNTS AND DIVIDED THROUGH '
    + 'ONCE. "At least one new member" fails for 35 of the 220, so it is 1 - 35/220 = 37/44, and '
    + 'the saving is in the counting rather than the dividing. Two overlapping events are '
    + 'inclusion-exclusion and then one division: the committees holding a particular member '
    + 'number 55, two such events share the 10 holding both, so 55 + 55 - 10 = 100 and the answer '
    + 'is 100/220 = 5/11 — checked against the 120 committees holding neither, since 220 - 120 is '
    + 'the same 100 by a route that never handles an overlap at all. The last three ideas stop '
    + 'treating the space as fixed. Seventh, BEING TOLD SOMETHING DOES NOT CHANGE THE FORMULA, IT '
    + 'CHANGES THE SET THE FORMULA COUNTS. The outcomes ruled out are gone and the ones left kept '
    + 'their chances relative to one another, so they are still equally likely among themselves '
    + 'and dividing is licensed for the same reason as before: P(A given B) = |A and B| / |B|, '
    + 'the OVERLAP over the CONDITION. Told that Ann is on the committee, the space is the 55 '
    + 'committees holding her and 6 of those are all-new, so the probability all three are new '
    + 'rises from 1/22 = 5/110 to 6/55 = 12/110. Dividing both counts by 220 turns the same '
    + 'statement into P(A and B) / P(B), which is not a second definition but the first with the '
    + 'old space cancelled — and is the form that still says something when nothing can be '
    + 'counted. The numerator of P(A given B) and of P(B given A) is the SAME number and only '
    + 'the denominator moves, so P(Ann on it given all three new) is 6/10 = 3/5, nothing like '
    + '6/55. Eighth, A SEQUENCE OF DRAWS MULTIPLIES ONE CONDITIONAL FACTOR PER STEP. Multiplying '
    + 'the definition through by P(B) gives P(A and B) = P(B) x P(A given B), so drawing three '
    + 'members one at a time gives (5/12) x (4/11) x (3/10) = 1/22 — each denominator counting '
    + 'what is LEFT — and that is the same 1/22 the simultaneous draw gave, which is a check and '
    + 'not a coincidence. This is the first thing in the subject that multiplies two '
    + 'probabilities. When an event can happen along several paths the paths are disjoint, so '
    + 'they ADD while each path multiplies: exactly one of the first two drawn being new is '
    + '(5/12) x (7/11) + (7/12) x (5/11) = 35/66. Reusing the first factor unchanged is not bad '
    + 'arithmetic, it is the right answer to the experiment where each member is put back. Ninth, '
    + 'INDEPENDENCE IS A TEST YOU COMPUTE, NOT A STORY ABOUT INFLUENCE. A and B are independent '
    + 'when P(A and B) = P(A) x P(B), equivalently when conditioning leaves A alone. "Ann is on '
    + 'the committee" and "Bob is on the committee" FAIL it — 1/22 against (1/4) x (1/4) = 1/16 — '
    + 'because three places are being competed for, and the conditional says which way: '
    + 'P(Ann given Bob) = 10/55 = 2/11, which is two places among eleven people. Two draws from '
    + 'the same twelve people PASS it if the first is put back, since then the second factor is '
    + '5/12 rather than 4/11 and P(both new) = 25/144. So independence is a fact about the '
    + 'mechanism and one sentence of the description decides it. And two events that cannot both '
    + 'happen are never independent: P(A and B) = 0 while P(A) x P(B) = (1/22) x (7/44) = 7/968, '
    + 'so mutually exclusive is close to the opposite of independent rather than a version of '
    + 'it. The last three ideas keep the conditional and take the OVERLAP away. Tenth, '
    + 'REVERSING A CONDITIONAL MEANS BUILDING THE OVERLAP FROM THE DIRECTION YOU WERE GIVEN, AND '
    + 'THE BASE RATE IS WHAT TURNS ONE INTO THE OTHER. P(A given B) and P(B given A) share the '
    + 'one number P(A and B), so P(A given B) = P(B given A) x P(A) / P(B) is the definition '
    + 'written twice and divided, not a new rule. Screen a population where 1 in 100 has a '
    + 'condition with a test that is positive for 9 in 10 who have it and 1 in 20 who do not: '
    + 'the overlap you want is (9/10) x (1/100) = 9/1000, the OTHER overlap is '
    + '(1/20) x (99/100) = 99/2000, and since 9/1000 is 18/2000 the false positives outnumber '
    + 'the true ones by more than five to one — because 99 times as many people sit behind the '
    + 'small rate. So a positive result gives 18/117 = 2/13, about 15%, and the 9/10 somebody '
    + 'reports instead is the answer to the question nobody asked. Eleventh, THE DENOMINATOR IS '
    + 'A SUM OVER THE CASES, WHICH IS WHERE THE BASE RATE ENTERS TWICE MORE. A positive arrives '
    + 'by exactly two routes and they are disjoint, so the sixth idea\'s addition applies: '
    + 'P(B) = P(B|A)P(A) + P(B|not A)P(not A) = 18/2000 + 99/2000 = 117/2000, checked against '
    + 'the negatives, which must come to 1883/2000 and do. The base rate is therefore in the '
    + 'numerator once and in the denominator twice, so it does not scale the answer — it decides '
    + 'the balance between the two terms, and moving it alone is enough: the SAME test on a '
    + 'group where 1 in 2 has the condition gives (9/20)/(19/40) = 18/19. Two answers nearly '
    + 'four fifths apart from one pair of test figures is why "how accurate is the test" has no '
    + 'answer on its own. Twelfth, IN ODDS FORM THE UPDATE IS ONE MULTIPLICATION, SO THE PRIOR '
    + 'IS A FACTOR RATHER THAN A CORRECTION. Write the theorem for A and for not-A and divide: '
    + 'P(B) is in both and cancels, leaving posterior odds = prior odds x P(B|A)/P(B|not A). '
    + 'The evidence contributes only that ratio — here (9/10)/(1/20) = 18 — so 1:99 becomes '
    + '18:99 and 18/(18+99) is the same 2/13, with no total probability computed anywhere. A '
    + 'large factor on a small prior is still small, and that is the arithmetic of the '
    + 'prosecutor\'s fallacy: if a trace matches whoever left it and 1 in 10,000 others by '
    + 'chance, and exactly one of 20,001 equally suspected people left it, then the likelihood '
    + 'ratio is 10,000, the prior odds are 1:20,000, the posterior odds are 1:2, and the '
    + 'probability of INNOCENCE given a match is 2/3 — not the 1/10,000 that gets quoted, which '
    + 'is P(match given innocence) wearing the answer\'s clothes. The last three ideas go back to '
    + 'the three tosses and attach a NUMBER to each of the eight sequences, which is what lets '
    + 'arithmetic be done on a random situation at all. Thirteenth, A VALUE OF THAT NUMBER NAMES A '
    + 'SET OF OUTCOMES, AND THAT SET IS WHAT THE PROBABILITY BELONGS TO. Let X be the count of '
    + 'heads. X is not a number, it is a RULE: HHH goes to 3, HHT and HTH and THH go to 2, and so '
    + 'on. So "X = 2" is a condition on a number and has to be read backwards into the three '
    + 'sequences the rule sends to 2 — the PREIMAGE — because the only thing a probability can be '
    + 'assigned to is a subset of the space. Dividing then happens where the outcomes are equally '
    + 'likely, which is the eight sequences, giving 3/8. This is also what SETTLES the second '
    + 'idea\'s open question: the four-outcome space that records only the heads count has the '
    + 'VALUES of X as its outcomes, those values have preimages of sizes 1, 3, 3 and 1, and four '
    + 'outcomes of unequal size cannot be equally likely — so its 1/4 was never licensed and 3/8 '
    + 'is right. The rule is a CHOICE made on top of the space, exactly as the space was: the '
    + 'same eight sequences also carry T, the toss the first head came up on, and T must be given '
    + 'a value at TTT or it is not a function on this space at all. Fourteenth, THE VALUES '
    + 'PARTITION THE SPACE, SO THE WHOLE TABLE ADDS TO 1 — AND THE VALUES ARE NOT EQUALLY LIKELY. '
    + 'Take the preimage of every value and divide each by 8: X is 1/8, 3/8, 3/8, 1/8 at 0, 1, 2, '
    + '3. Those four numbers together are the DISTRIBUTION, and the total is forced rather than '
    + 'lucky — X is a function, so it sends each sequence to exactly one value, the preimages '
    + 'therefore have nothing in common and leave nothing out, and the first idea puts the whole '
    + 'space at 1. A total that is not 1 means a sequence was double-counted or missed, which is '
    + 'the only error the check can catch and the reason to make it every time. Two entries also '
    + 'add with NO correction term, because two values of X can never share a sequence: '
    + 'P(X = 1 or 2) = 3/8 + 3/8 = 3/4, where the third idea had to subtract an overlap. And the '
    + 'middle entries are three times the end ones — (3/8)/(1/8) = 3, a ratio of probabilities '
    + 'and not itself a probability — which is the exact price of the information the four-outcome '
    + 'space threw away. Fifteenth, A NEW RULE OVER THE SAME OUTCOMES MERGES VALUES, AND THE '
    + 'PROBABILITIES OF WHAT IT MERGES ADD. Let Y be the margin, |heads - tails|. Tails is 3 - X, '
    + 'so Y = |2X - 3| and Y is 3, 1, 1, 3 as X runs 0 to 3: a function of a random variable is a '
    + 'random variable, on the same space. It is not one-to-one, which is the whole of what is '
    + 'new — two values of X sit behind each value of Y, so P(Y = 1) = P(X = 1) + P(X = 2) = 3/4 '
    + 'and P(Y = 3) = 1/8 + 1/8 = 1/4, arithmetic on probabilities already in hand with no count '
    + 'anywhere. The total survives merging necessarily, since a coarser partition is still a '
    + 'partition. CONDITIONING rebuilds a table the other way and the contrast is the point: '
    + 'given at least one head, 7 of the 8 sequences remain, so the entries become (3/8)/(7/8) = '
    + '3/7, 3/7 and 1/7 — and those add to 1 only BECAUSE of the division, their numerators '
    + 'adding to 7/8. Merging keeps the total for free because nothing left the space; '
    + 'conditioning discards TTT and has to renormalise. Sixteenth, THE TABLE COLLAPSES TO ONE '
    + 'NUMBER BY WEIGHTING EACH VALUE WITH ITS OWN PROBABILITY. E[X] = 0(1/8) + 1(3/8) + 2(3/8) '
    + '+ 3(1/8) = 12/8 = 3/2, written in `sigma-notation` and totalled over four terms because '
    + 'both limits are included. That number is neither of the kinds met so far: it is outside '
    + '[0, 1] and measured in heads rather than in chance, and it is not a value X takes at all, '
    + 'since X counts whole heads — so the average names no outcome of the experiment, which is '
    + 'not a defect. And the WEIGHTS are what this table hides, because the plain average of the '
    + 'values 0, 1, 2, 3 is also 3/2: the entries are symmetric, so the pull towards the middle '
    + 'cancels and the wrong route is right by accident. T, the toss the first head falls on, is '
    + 'the proof — it takes the SAME four values on the same eight sequences, with table 1/8, '
    + '1/2, 1/4, 1/8, and E[T] = 11/8. Two rules, one value list, two answers, so the '
    + 'expectation was never a function of the list. Seventeenth, A LINEAR RULE CAN BE PUSHED '
    + 'THROUGH THE EXPECTATION, AND THE TABLE TOTALLING 1 IS WHAT LICENSES IT. '
    + 'E[aX + b] = aE[X] + b, so E[2X + 1] = 2(3/2) + 1 = 4, which rebuilding the table confirms '
    + 'at 32/8. The proof is the two rearrangements `sigma-notation` allows — split a sum of two '
    + 'terms, bring a constant factor outside — leaving aE[X] plus b times the total of every '
    + 'probability, and the fourteenth idea forced that total to be exactly 1. So the rule stands '
    + 'on the partition: against a conditioned table totalling 7/8 it would give aE[X] + 7b/8 and '
    + 'be false. The licence comes from the SHAPE of the rule and nothing else, and Y = |2X - 3| '
    + 'is where it stops — |2E[X] - 3| = 0 against E[Y] = 1(3/4) + 3(1/4) = 3/2, and 0 is not '
    + 'merely wrong but outside the range of Y, which is 1 or 3 on every single sequence. '
    + 'Eighteenth, EXPECTATION ADDS ACROSS TWO RULES WHETHER OR NOT THEY ARE INDEPENDENT, which '
    + 'is the fact no table of ONE variable can state. With S = X + T, E[S] = E[X] + E[T] = '
    + '12/8 + 11/8 = 23/8, and S\'s own table — 1/8, 1/8, 3/8, 3/8 at 0, 2, 3, 4, skipping 1 '
    + 'entirely — gives the same 23/8, because totalling X + T over the eight sequences adds the '
    + 'same numbers in a different order and 23 = 12 + 11. X and T are NOT independent: the '
    + 'seventh idea\'s product test puts P(X = 0)P(T = 1) at 1/16 while P(X = 0 and T = 1) is 0, '
    + 'no sequence without heads having its first head on toss one. The addition held regardless, '
    + 'so nothing has to be checked before adding two expectations — and that is the whole of why '
    + 'it is the useful fact. Multiplying is not free: E[XT] = 17/8 = 34/16 against '
    + 'E[X]E[T] = 33/16, false by 1/16 and so by little enough to survive a careless check. What '
    + 'is NOT here is a boundary '
    + 'rather than a backlog. THE COUNTING ITSELF is '
    + '`counting-principles`, an '
    + 'authored subject of its own — every count above is set up, named as its work, and then '
    + 'divided, and none of it is re-derived here. SPREAD is not: VARIANCE is an expected value '
    + 'of a squared deviation and so is arithmetic the sixteenth idea can already express, but '
    + 'its content is which deviations get squared and why, and the eighteenth idea is where that '
    + 'would have to start rather than where it ends — E[XT] missing E[X]E[T] by 1/16 is a '
    + 'covariance in all but name, and naming it would promise an account of independence this '
    + 'subject gives only as a test. THE NAMED DISTRIBUTIONS, the '
    + 'HYPERGEOMETRIC among them, are FAMILIES indexed by their parameters, where the fourteenth '
    + 'idea builds one member of one family by collecting preimages, and the fifth idea\'s '
    + 'C(5,1)C(7,2)/C(12,3) is one value of another; naming a family from an instance would '
    + 'promise a mechanism nothing above supplies. And INFINITE OR CONTINUOUS spaces are '
    + 'not a harder version of this: equally likely outcomes stop existing there, so the one '
    + 'formula the first three concepts rest on has no analogue rather than a subtler one, and '
    + 'the table the last three are about does not exist either, since P(X = c) = 0 at every '
    + 'single value — though P(A and B) / P(B) does survive, which is why the seventh idea is '
    + 'written in that form as well as in counts, and why the fourth concept never counts '
    + 'anything at all.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'sample-spaces',
    name: 'Sample spaces and events',
    subjectId: subject.id,
    scope: {
      id: 'sample-spaces',
      label: 'Sample spaces and events',
      hint: 'sample space event outcome probability axioms',
      /*
       * The map node's pattern and its `terms` as the hint, both carried across
       * unchanged. Three titles, all three of them this concept; the shortfall
       * is recall and is listed in this file's header, along with why the
       * obvious widening would be worse than the gap.
       */
      match: /\b(sample space|probability axioms|event \(probability theory\))\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'write-down-a-sample-space-and-read-an-event-off-it-as-a-subset',
        statement:
          'Produce the number of outcomes in a sample space built by recording each step of an '
          + 'experiment in order, and so treat the space as a set that is listed rather than '
          + 'described. Produce the number of outcomes in an event that is given in English, and '
          + 'so read the English as a membership test on that list. Produce the total of a '
          + 'partition of the space by a recorded quantity, and so establish that a coarser '
          + 'record of the same experiment is a legitimate sample space whose outcomes stand for '
          + 'different numbers of the original ones.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'derive-a-probability-from-the-two-conditions-rather-than-from-a-formula',
        statement:
          'Produce the probability of a single outcome of a space whose outcomes are equally '
          + 'likely, and so derive it from the whole space having probability 1 rather than '
          + 'assume it. Produce the probability of an event as a count of its outcomes over the '
          + 'size of the space, and so identify that division as the addition of equal terms done '
          + 'in one step. Produce the probability of a union of two events with no outcome in '
          + 'common by adding, and so decide from the SPACE rather than from the event whether '
          + 'either move was licensed at all.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'repair-an-overlapping-union-and-take-a-complement-from-one',
        statement:
          'Produce the probability of a union of two OVERLAPPING events, and so distinguish a '
          + 'correction derived from what additivity requires from a formula recalled by its '
          + 'shape. Produce the number of times a single outcome is counted by the whole '
          + 'corrected expression, and so settle why the overlap is subtracted exactly once — the '
          + 'answer being the justification and not merely consistent with it. Produce the '
          + 'probability of an event that is nearly the whole space by way of its complement, and '
          + 'so use P(not E) = 1 - P(E) as a saving rather than as a further rule.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'an-outcome-is-a-complete-result-and-an-event-is-a-subset-of-the-listed-space',
        conceptId: 'sample-spaces',
        statement:
          'Before anything can be called likely there has to be a list of what could happen. One '
          + 'entry on that list is an OUTCOME — a complete result, settling everything the '
          + 'experiment distinguishes — and the list itself is the SAMPLE SPACE. It has to satisfy '
          + 'exactly two conditions: no two entries can both happen, and one of them must. An '
          + 'EVENT is then a SUBSET of that list, and this is the part worth taking literally: '
          + '"exactly two heads" is not a remark about the outcomes, it IS the collection of '
          + 'outcomes that have exactly two heads, and finding it means going through the list and '
          + 'keeping some. The thing that is easy to miss is that the list is a CHOICE. One '
          + 'experiment has many sample spaces and they are all legal as long as they meet the two '
          + 'conditions — recording three coin tosses in order gives eight outcomes, recording '
          + 'only how many heads came up gives four — and they are not interchangeable, because '
          + 'the coarser one has thrown away which toss was which. Nothing has gone wrong yet; the '
          + 'cost of the choice only appears in the next point, when something has to be divided.',
        position: 1,
        /*
         * No `automaticityTarget`. Multiplying 2 × 2 × 2 would time beautifully,
         * which is the trap: the skill is deciding what one outcome has to
         * record, and a speed reward trains the arithmetic a learner already
         * has.
         */
        workedExample: {
          problem:
            'A coin is tossed three times and the result of each toss is written down in order. '
            + 'Write the sample space. Write the event "exactly two heads" as a set. Then write a '
            + 'DIFFERENT sample space for the same experiment — the one you get by recording only '
            + 'how many heads came up — and say exactly what the second one can no longer tell '
            + 'you.',
          subgoals: [
            {
              label: 'Decide what one outcome has to record, before listing any of them',
              detail:
                'An outcome has to settle everything the experiment distinguishes, because the '
                + 'two conditions are about the whole list at once: if an entry left something '
                + 'open, two entries could both be true of the same run. Here the experiment '
                + 'writes down each toss in order, so one outcome is a sequence of three letters '
                + 'such as HHT — and HHT, HTH and THH are three DIFFERENT outcomes even though '
                + 'the same number of heads came up in each. That decision is the model, not a '
                + 'formality: everything below is read off the list it produces.',
              socratic:
                'You are about to list the possible results of three tosses. Before writing any '
                + 'of them down — what does one entry have to say, so that exactly one entry can '
                + 'be true of whatever actually happens?',
            },
            {
              label: 'List the space in an order that makes a gap visible',
              detail:
                'Each toss is H or T, so fix the first letter and run through the rest: HHH, HHT, '
                + 'HTH, HTT, then THH, THT, TTH, TTT. Eight outcomes, which is 2 x 2 x 2 — two '
                + 'results per toss, three tosses. Written in that order the list is its own '
                + 'check: the four beginning with H come first, each pair differs in the last '
                + 'letter only, and a missing sequence would break the pattern. Both conditions '
                + 'now hold by inspection. No two can both happen, because two different '
                + 'sequences disagree about some toss; and one must, because every run writes '
                + 'down three letters and all eight three-letter words are here.',
              socratic:
                'Each toss has two results and there are three tosses. In what order would you '
                + 'write the sequences down so that a reader could see at a glance that none is '
                + 'missing?',
            },
            {
              label: 'Read the event off the list by keeping some outcomes and discarding others',
              detail:
                'Go along the eight and keep the ones with exactly two heads: HHT, HTH and THH. '
                + 'HHH has three and is out; HTT, THT and TTH have one; TTT has none. So the event '
                + 'is the set {HHT, HTH, THH} and it has three outcomes out of eight. What the '
                + 'English phrase did was act as a test on each entry — the event is the result of '
                + 'applying it, and from here on "exactly two heads" means those three sequences '
                + 'and nothing else.',
              socratic:
                'Walk the eight sequences and keep the ones with exactly two heads. How many did '
                + 'you keep — and after keeping them, what kind of object is "exactly two heads"?',
            },
            {
              label: 'Build the coarser space, and check it is a legal sample space too',
              detail:
                'Now record only the number of heads. The possible records are 0, 1, 2 and 3: four '
                + 'outcomes. Test the two conditions on this list rather than assuming they fail. '
                + 'No two can both happen — a run has one number of heads — and one must, since '
                + 'the count of heads in three tosses is always 0, 1, 2 or 3. So this IS a sample '
                + 'space for the same experiment, with four outcomes where the other had eight. '
                + 'Neither is the right one; they are different models, and so far nothing '
                + 'separates them.',
              socratic:
                'Suppose the only thing written down were how many heads came up. What are the '
                + 'possible records, and do they meet the two conditions a sample space has to '
                + 'meet?',
            },
            {
              label: 'Audit the coarser space against the finer one to find what was thrown away',
              detail:
                'Each of the four records stands for a group of sequences: 0 heads is TTT alone, 1 '
                + 'head is HTT, THT and TTH, 2 heads is HHT, HTH and THH, 3 heads is HHH alone. '
                + 'That is 1 + 3 + 3 + 1 = 8, which must come back to the size of the finer space '
                + 'or the groups were not a partition of it. The audit is the point: the four '
                + 'groups are NOT the same size. "Exactly two heads" is one outcome out of four in '
                + 'the coarser space and three out of eight in the finer one, and the next point '
                + 'is where that difference starts to matter.',
              socratic:
                'How many of the eight sequences does each of the four records stand for? Add '
                + 'those four numbers — what must the total be, and what do you notice about the '
                + 'four numbers themselves?',
            },
          ],
          answer:
            'The sample space is {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}: eight outcomes, 2 x 2 '
            + 'x 2. "Exactly two heads" is the subset {HHT, HTH, THH}, three of the eight. '
            + 'Recording only the number of heads gives {0, 1, 2, 3}, which is also a sample space '
            + '— its four outcomes are mutually exclusive and one of them must occur — but it has '
            + 'thrown away which toss was which, and its outcomes stand for 1, 3, 3 and 1 of the '
            + 'original sequences. Those four numbers add to 8, as they must, and they are not '
            + 'equal, which is the fact the next point needs.',
        },
      },
      {
        id: 'equal-likelihood-is-a-property-of-the-space-and-is-what-licenses-dividing',
        conceptId: 'sample-spaces',
        statement:
          'A probability is a number given to each EVENT, and two conditions pin the whole system '
          + 'down. The first is that the entire sample space gets 1 — something happens. The '
          + 'second is that if two events have no outcome in common, the probability of one or the '
          + 'other is the SUM of theirs. Nothing else is needed for a finite list. If on top of '
          + 'that the outcomes are EQUALLY LIKELY, the familiar formula follows rather than being '
          + 'assumed: the space splits into its one-outcome events, no two of which share an '
          + 'outcome, so their probabilities add to 1; eight equal numbers adding to 1 makes each '
          + 'of them 1/8; and an event made of k outcomes is k of those added, which is k/8. So '
          + 'P(E) = |E| / |S| is the second condition applied k times, and "equally likely" is a '
          + 'claim about the SPACE and not about the event. That is the whole of the care this '
          + 'point asks for, because the same division carried out in a space whose outcomes are '
          + 'not equally likely gives a different answer to the same question — and both answers '
          + 'cannot be right.',
        position: 2,
        workedExample: {
          problem:
            'The coin from the first point is fair. Find the probability of exactly two heads, '
            + 'deriving the probability of a single sequence rather than assuming it. Then compute '
            + 'the same probability in the four-record space by dividing by 4, get a different '
            + 'answer, and settle which one is wrong and why.',
          subgoals: [
            {
              label: 'Turn "the coin is fair" into a statement about the eight sequences',
              detail:
                '"Fair" is a sentence about one toss: heads and tails are not favoured over each '
                + 'other, and the tosses do not influence one another. Carry that to the list. '
                + 'Take any two of the eight sequences — HHT and THT, say — and the only '
                + 'difference between them is which way one toss fell. If neither way is favoured '
                + 'on any toss, no sequence is favoured over any other. So the eight one-outcome '
                + 'events all have the SAME probability. Call it p; it is not yet known to be '
                + '1/8, and the next step is where that comes from.',
              socratic:
                '"The coin is fair" is a claim about a single toss. What does it let you say when '
                + 'you compare two of the eight sequences, and which of the eight does it single '
                + 'out?',
            },
            {
              label: 'Pin p from the whole space having probability 1',
              detail:
                'The eight one-outcome events have no outcome in common with each other, and '
                + 'together they are the whole space. The second condition says disjoint events '
                + 'add, so the probability of the whole space is the sum of the eight; the first '
                + 'condition says that sum is 1. Eight copies of p add to 1, so 8p = 1 and p = '
                + '1/8. That is a derivation, and it is worth noticing which way round it runs: '
                + '1/8 is a CONSEQUENCE of fairness plus the two conditions, not a definition of '
                + 'fairness, and this is exactly the step that will fail in the other space.',
              socratic:
                'The eight one-outcome events cannot overlap and one of them has to happen. What '
                + 'does that force about the sum of their eight probabilities, and so what is each '
                + 'one?',
            },
            {
              label: 'Add the outcomes in the event, which is where the division comes from',
              detail:
                'The event is {HHT, HTH, THH} from the first point. Those are three one-outcome '
                + 'events with no outcome in common, so their probabilities add: 1/8 + 1/8 + 1/8 = '
                + '3/8. Writing that as 3/8 — the count of outcomes in the event over the count in '
                + 'the space — is the same addition done in one step, which is all the formula '
                + 'P(E) = |E| / |S| is. Keeping the addition in view is what makes the next '
                + 'subgoal possible: a formula has no hypothesis visible in it, and the addition '
                + 'does.',
              socratic:
                'The event holds three sequences and each has probability 1/8. What is the '
                + 'probability of the event, and which of the two conditions did you just use?',
            },
            {
              label: 'Run the same division in the four-record space and compare',
              detail:
                'In the coarser space the records are 0, 1, 2, 3 and "exactly two heads" is the '
                + 'single record 2 — one outcome out of four. Dividing as before gives 1/4. Now '
                + 'compare: 1/4 against 3/8. Over a common denominator those are 2/8 and 3/8, so '
                + 'they are genuinely different numbers, and they are answers to the SAME question '
                + 'about the same coin. At most one of them is right, and which one cannot be '
                + 'settled by doing the arithmetic again.',
              socratic:
                'In the four-record space the event is one record out of four. What does dividing '
                + 'by 4 give, and how does it compare with 3/8 once both are over the same '
                + 'denominator?',
            },
            {
              label: 'Settle it by asking which space the fairness assumption is about',
              detail:
                'Go back to the derivation. The division needs the outcomes to be equally likely, '
                + 'and that came from being able to swap one outcome for another without the coin '
                + 'caring: any sequence turns into any other by changing which way some tosses '
                + 'fell, and fairness says that costs nothing. Try the same in the coarser space '
                + 'and it runs out immediately — the record 3 stands for one sequence and the '
                + 'record 2 stands for three, so no symmetry of the coin carries one to the other. '
                + 'The four records are a legal sample space with outcomes that are not equally '
                + 'likely, so the division by 4 was never licensed. 3/8 is right, 1/4 is wrong, '
                + 'and the error is not arithmetic: it is dividing in a space the hypothesis was '
                + 'false in.',
              socratic:
                'Only one of 1/4 and 3/8 can be right. Fairness lets you swap one outcome for '
                + 'another — in each of the two spaces, what can you swap, and where does the '
                + 'swapping run out?',
            },
          ],
          answer:
            'P(exactly two heads) = 3/8. Fairness makes the eight sequences equally likely, so the '
            + 'eight one-outcome events share a probability p; being disjoint and together the '
            + 'whole space, they give 8p = 1 and p = 1/8; the event holds three of them, so 1/8 + '
            + '1/8 + 1/8 = 3/8. The four-record space gives 1/4 = 2/8 for the same question, and '
            + '1/4 is wrong: its four outcomes stand for 1, 3, 3 and 1 sequences, so they are not '
            + 'equally likely and dividing by 4 was never licensed. The formula |E| / |S| carries '
            + 'a hypothesis about the space, and it is the only thing separating the two answers.',
        },
      },
      {
        id: 'a-complement-subtracts-from-one-and-an-overlap-is-subtracted-exactly-once',
        conceptId: 'sample-spaces',
        statement:
          'Two moves finish what a finite space can be asked. An event and its COMPLEMENT have no '
          + 'outcome in common and together are the whole space, so their probabilities add to 1 '
          + 'and P(not E) = 1 - P(E). That is worth looking for whenever an event is nearly '
          + 'everything, because the complement is then nearly nothing and listing it is the '
          + 'cheaper job. The second move is the one that needs care. Adding the probabilities of '
          + 'two events is only licensed when they have no outcome in common, so for two events '
          + 'that DO overlap the sum is not the answer: every outcome lying in both has been '
          + 'counted by both terms. Subtracting the probability of the overlap once takes each such '
          + 'outcome from twice to once, which gives P(A or B) = P(A) + P(B) - P(A and B). The '
          + 'correction is forced by the condition rather than being an extra rule to remember, and '
          + 'the way to see that it is exactly one subtraction is to follow a single outcome '
          + 'through the three terms and count how many times it ends up counted.',
        position: 3,
        workedExample: {
          problem:
            'Same coin, same eight sequences. Let A be "the first toss is heads" and B be "at '
            + 'least two heads". Find P(A or B) twice — by listing the union, and by the addition '
            + 'rule — and say what goes wrong if the overlap is ignored. Then find P(at least one '
            + 'head) without listing the sequences it holds.',
          subgoals: [
            {
              label: 'Write both events as subsets and identify the overlap exactly',
              detail:
                'A is the sequences starting with H: {HHH, HHT, HTH, HTT}, four of them. B is the '
                + 'sequences with two or three heads: {HHH, HHT, HTH, THH}, also four — the three '
                + 'from the first point plus HHH. The overlap A and B is the sequences in both: '
                + '{HHH, HHT, HTH}, three. Two near misses are what make the overlap worth '
                + 'checking rather than guessing. THH has two heads so it is in B, but it starts '
                + 'with T so it is not in A. HTT starts with H so it is in A, but it has one head '
                + 'so it is not in B.',
              socratic:
                'Write A and B out as lists of sequences. Which sequences are in both lists — and '
                + 'why is THH not one of them when it has two heads?',
            },
            {
              label: 'List the union first, so there is an independent number to check against',
              detail:
                'Put the two lists together and keep each sequence once: HHH, HHT, HTH from both, '
                + 'HTT from A alone, THH from B alone. That is {HHH, HHT, HTH, HTT, THH}, five '
                + 'outcomes, so P(A or B) = 5/8. Doing this BEFORE the rule is deliberate. The '
                + 'rule is what is being learned, so it must not also be the only source of the '
                + 'answer — and three sequences, THT, TTH and TTT, are in neither event, which is '
                + 'a fact the next subgoal will need.',
              socratic:
                'Combine the two lists, keeping each sequence once. How many different sequences '
                + 'are in the combined list, and which of the eight are in neither event?',
            },
            {
              label: 'Add the two probabilities alone and watch the answer become impossible',
              detail:
                'P(A) = 4/8 = 1/2 and P(B) = 4/8 = 1/2. Adding them gives 1, which says the union '
                + 'is certain — and it cannot be, because THT, TTH and TTT are in neither event '
                + 'and one of them might well come up. So the sum is not merely too big by a bit; '
                + 'it has produced a claim the list refutes. The reason is the condition on '
                + 'adding: A and B share three outcomes, so adding was never licensed, and each of '
                + 'HHH, HHT and HTH has been counted twice — once in P(A) and once in P(B).',
              socratic:
                'P(A) and P(B) are each 1/2, so adding gives 1. What would a probability of 1 be '
                + 'claiming here, and which three sequences show that claim to be false?',
            },
            {
              label: 'Follow one shared outcome through the three terms to fix the repair at once',
              detail:
                'Take HHH and count how many times each term counts it. P(A) counts it once; P(B) '
                + 'counts it once; subtracting P(A and B) removes it once. That is 1 + 1 - 1 = 1, '
                + 'counted exactly once, which is what the union needs. The same arithmetic holds '
                + 'for HHT and HTH, and an outcome in only one event is counted 1 + 0 - 0 = 1 as '
                + 'well, while one in neither is 0 + 0 - 0 = 0. Every outcome ends up counted the '
                + 'right number of times, so 4/8 + 4/8 - 3/8 = 5/8 — which is the number the list '
                + 'gave. One subtraction is the whole repair because a shared outcome was counted '
                + 'exactly twice, and that is why the rule does not need remembering.',
              socratic:
                'Count how many times HHH is counted by each of the three terms in P(A) + P(B) - '
                + 'P(A and B). What do those three numbers come to, and what would a second '
                + 'subtraction do to it?',
            },
            {
              label: 'Take the cheap route when an event is nearly the whole space',
              detail:
                '"At least one head" holds for every sequence except one, so listing its seven '
                + 'outcomes is work for nothing. Its complement is "no heads at all", which is '
                + '{TTT} — one outcome, probability 1/8. The two events have no outcome in common '
                + 'and together they are the whole space, so their probabilities add to 1, giving '
                + '1 - 1/8 = 7/8. That is the same two conditions as the second point, used in the '
                + 'direction that saves work, and the saving grows with the space: an event of 99 '
                + 'outcomes out of 100 is one subtraction away from an event of one.',
              socratic:
                '"At least one head" is true of nearly every sequence. What is the single sequence '
                + 'it fails for, and how does that one sequence give you the probability without '
                + 'listing the other seven?',
            },
          ],
          answer:
            'A = {HHH, HHT, HTH, HTT} and B = {HHH, HHT, HTH, THH}, overlapping in {HHH, HHT, '
            + 'HTH}. Listing the union gives five sequences, so P(A or B) = 5/8. Adding alone '
            + 'gives 1/2 + 1/2 = 1, which is impossible since THT, TTH and TTT are in neither '
            + 'event; the three shared outcomes were each counted twice. Subtracting the overlap '
            + 'once gives 4/8 + 4/8 - 3/8 = 5/8, agreeing with the list, and one subtraction is '
            + 'exact because a shared outcome is counted 1 + 1 - 1 = 1 time. P(at least one head) '
            + '= 1 - P(no heads) = 1 - 1/8 = 7/8.',
        },
      },
    ],
  },
  {
    id: 'counting-probability',
    name: 'Equally likely outcomes',
    subjectId: subject.id,
    scope: {
      id: 'counting-probability',
      label: 'Equally likely outcomes',
      hint: 'equally likely favourable outcomes combinatorial probability',
      /*
       * No `match`, and the map node carried none either — so unlike every
       * promotion since the fourth there was no pattern to bring across, and
       * writing one during an authoring pass is the change
       * ontology-algebra.ts's `nonlinear-systems` declines to make: it would
       * move the recognition figure in tests/atlas.mjs and the written-concept
       * count in one edit, with no way afterwards to say which moved which.
       *
       * It is also the right answer on the merits. The only words available are
       * the ones `MapNode.match` names as the failure mode — "`/\bbayes/i` and
       * not `/probability/i`, because the second matches forty articles that
       * merely mention probability" — and fourteen unwritten nodes of this
       * area would answer to them. The node's name is a description of a
       * hypothesis, not a heading an encyclopaedia files anything under.
       */
    },
    fidelity: 'guided',
    caveat:
      'Nothing here checks that a statement is really about reading a probability off two '
      + 'counts. This concept has no pattern, because the words it would have to match on are '
      + 'the ones that cover the whole of probability rather than this one layer of it — a '
      + 'pattern on the word itself would claim pages about conditioning, distributions and the '
      + 'limit theorems, none of which is written anywhere. So this concept steers the search '
      + 'and filters nothing. The material below is written and practisable: it is the '
      + 'RECOGNITION that is unchecked, not the teaching.',
    objectives: [
      {
        id: 'count-the-space-and-the-event-under-one-convention-and-divide',
        statement:
          'Produce the number of outcomes in a sample space that is too large to list, as an '
          + 'unordered selection count, and so treat the space as something COUNTED rather than '
          + 'written down. Produce the probability of an event as that event\'s count over the '
          + 'space\'s, and so apply P(E) = |E| / |S| where neither number was read off a page. '
          + 'Produce the same probability a second time with BOTH counts left in order, and so '
          + 'establish that the orderings divide out of the ratio — which is why either '
          + 'convention is allowed and mixing them is not.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'build-a-favourable-count-as-a-product-of-selection-counts',
        statement:
          'Produce the number of selections holding a stated number of objects of one type, as '
          + 'a PRODUCT of one selection count per type, and so decide whether the product rule '
          + 'is licensed by asking whether the second factor depends on which objects the first '
          + 'one chose. Produce the probability of that event by dividing by a space counted the '
          + 'same way. Produce the total of the cases a type splits the space into, and so '
          + 'establish that those counts are a partition of the space rather than a set of '
          + 'separately plausible numbers.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'reach-an-awkward-event-by-its-complement-or-by-repairing-an-overlap',
        statement:
          'Produce the probability of an event that is nearly the whole space from the count of '
          + 'its complement, and so use P(not E) = 1 - P(E) where the saving is in the COUNTING '
          + 'rather than in the division. Produce the probability of a union of two OVERLAPPING '
          + 'events by repairing the counts before dividing once, and so distinguish a '
          + 'correction that inclusion-exclusion supplies from a formula recalled by its shape. '
          + 'Produce the same union from the count of the outcomes in neither event, and so '
          + 'settle the first answer by a route that handles no overlap at all.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'one-convention-has-to-serve-both-counts-because-the-orderings-cancel',
        conceptId: 'counting-probability',
        statement:
          'As soon as the sample space is too long to write down, |E| and |S| both have to be '
          + 'COUNTED, and that is the whole of what this concept adds: the formula P(E) = |E| / '
          + '|S| does not change, and the equally likely hypothesis is still a claim about the '
          + 'space, but the two numbers now come out of a counting argument instead of off a '
          + 'list. There is exactly one new way to go wrong, and it is invisible in the answer. '
          + 'A selection can be counted with order as information or without it, and the two '
          + 'counts differ by a factor of r! — the orderings of one selection. Count the space '
          + 'one way and the event the other and the ratio is wrong by that same factor, which '
          + 'is not an arithmetic slip but two different sample spaces. Count BOTH the same way '
          + 'and the factor appears in the numerator and the denominator and cancels, so the '
          + 'probability is the same whichever convention you chose. That cancellation is the '
          + 'reason the choice is free, and knowing it is the difference between picking a '
          + 'convention and having to.',
        position: 1,
        /*
         * No `automaticityTarget`. Evaluating (12 x 11 x 10)/6 would time
         * beautifully, which is the trap the subject's first concept names
         * about its own multiplication: the skill is deciding whether the two
         * counts were made the same way, and a speed reward trains the
         * arithmetic a learner already has.
         */
        workedExample: {
          problem:
            'A club has 12 members, 5 of whom joined this year. Three of the 12 are drawn by lot '
            + 'to form a committee — all three at once, so no member can be drawn twice and the '
            + 'order they come out in is not recorded. Find the probability that all three are '
            + 'new members. Do it twice: once counting selections without order, once counting '
            + 'them with order. Then say what goes wrong if the two counts are made differently.',
          subgoals: [
            {
              label: 'Say what one outcome is, and what "by lot" claims about the space',
              detail:
                'An outcome has to settle everything the experiment distinguishes, and this '
                + 'experiment records only who is on the committee — so one outcome is a SET of '
                + 'three members, and {Ann, Bob, Cleo} is one outcome rather than six. Drawing '
                + 'by lot is the claim that no such set is favoured over any other, which makes '
                + 'the outcomes equally likely and is what will license dividing. Note where '
                + 'that claim sits: it is about the space of committees, not about any event in '
                + 'it, and it is the only reason the rest of this is arithmetic.',
              socratic:
                'Three of the twelve are drawn together and only the membership is written down. '
                + 'What does one outcome of this experiment have to record — and what does "by '
                + 'lot" let you assume about the whole collection of them?',
            },
            {
              label: 'Count the space, since there are too many outcomes to list',
              detail:
                'This is `counting-principles` and not new work: in order there are 12 x 11 x 10 '
                + '= 1320 ways to draw three members, every committee of three was reached once '
                + 'for each of its 3! = 6 orderings, and that 6 is the same for every committee, '
                + 'so the unordered count is 1320/6 = 220. There are 220 possible committees. '
                + 'The number is small enough to compute and far too large to print, which is '
                + 'exactly the situation the first concept\'s eight sequences were chosen to '
                + 'avoid — and the reason every event below is counted rather than read.',
              socratic:
                'There are 12 x 11 x 10 ways to draw three members in order. How many times over '
                + 'does that count a single committee of three — and so how many committees are '
                + 'there?',
            },
            {
              label: 'Count the event the same way, and divide',
              detail:
                'The event "all three are new" holds exactly the committees drawn from the 5 new '
                + 'members. Count it with the same convention: 5 x 4 x 3 = 60 in order, each '
                + 'all-new committee reached 6 times, so 60/6 = 10 of them. Both numbers are now '
                + 'unordered counts of the same space, so P(all three new) = 10/220 = 1/22. '
                + 'Nothing about the formula changed; what changed is that both of its inputs '
                + 'were produced rather than counted off.',
              socratic:
                'How many of the 220 committees are made up only of the 5 new members? Having '
                + 'that number, what do you divide it by, and why that number and not another?',
            },
            {
              label: 'Do it again in the ordered space, and watch the 6 cancel',
              detail:
                'Keep the order instead. The space is the 1320 ordered draws and the event is '
                + 'the 60 ordered draws of three new members, so the probability is 60/1320 = '
                + '1/22. The same answer, and the reason is visible if the two counts are left '
                + 'unsimplified: 10/220 is (60/6)/(1320/6), and dividing a numerator and a '
                + 'denominator by the same 6 changes nothing. The 6 is the orderings of one '
                + 'selection, it is the same 6 in both counts because every committee of three '
                + 'has exactly 3! orderings, and a common factor in a ratio cancels. So the '
                + 'convention is genuinely free.',
              socratic:
                'In the ordered space the event has 60 outcomes and the space has 1320. Before '
                + 'you simplify 60/1320, which factor do the 60 and the 1320 have in common, '
                + 'where did it come from, and what does that tell you the answer will be?',
            },
            {
              label: 'Mix the two conventions and measure the damage',
              detail:
                'Put the unordered event over the ordered space: 10/1320 = 1/132, six times too '
                + 'small. Put the ordered event over the unordered space: 60/220 = 3/11, six '
                + 'times too big. Neither is a slip in the arithmetic — each is a count of one '
                + 'space divided by the size of a different one, and the error is always exactly '
                + 'the factor r! that failed to cancel. That is why it is worth drilling: 3/11 '
                + 'is a perfectly ordinary-looking probability and nothing in it announces that '
                + 'two spaces were crossed. The next point has a case where the same mistake '
                + 'produces a number greater than 1, which is the only version of it that '
                + 'reports itself.',
              socratic:
                'Suppose you counted the committees without order but the all-new draws with '
                + 'order, giving 60/220. By what factor is that wrong, and could you have told '
                + 'from the answer alone that anything had gone wrong?',
            },
          ],
          answer:
            'P(all three new) = 1/22. Unordered: there are (12 x 11 x 10)/6 = 220 committees and '
            + '(5 x 4 x 3)/6 = 10 made only of new members, so 10/220 = 1/22. Ordered: 1320 '
            + 'draws and 60 favourable ones, so 60/1320 = 1/22 again — the 3! = 6 orderings of '
            + 'each committee divide both counts and cancel in the ratio, which is why either '
            + 'convention may be used. Mixing them does not cancel: 60/220 = 3/11 is six times '
            + 'too large and 10/1320 = 1/132 is six times too small, and both look like ordinary '
            + 'probabilities.',
        },
      },
      {
        id: 'the-favourable-count-is-a-product-of-one-selection-count-per-type',
        conceptId: 'counting-probability',
        statement:
          'Once the space is counted, the work moves into the numerator, and this is where '
          + 'counting stops being a preliminary and becomes the technique. An event described by '
          + 'how many objects of each type it holds is built by making one choice AND then '
          + 'another — which of the objects of the first type, then which of the second — so its '
          + 'count is a PRODUCT of selection counts, one per type. The product rule\'s condition '
          + 'has to be checked rather than assumed, and here it holds for a reason worth saying '
          + 'out loud: the number of ways to choose the second type does not depend on WHICH '
          + 'objects of the first type were chosen, because the two types are drawn from '
          + 'different people. Dividing that product by a space counted the same way is the '
          + 'probability. And because the types partition the space, the counts for every '
          + 'possible split have to add back to the size of the space — which is an audit that '
          + 'catches a wrong factor, and the only check available when the event is too large to '
          + 'list.',
        position: 2,
        workedExample: {
          problem:
            'The same club: 12 members, 5 new and 7 who joined earlier, three drawn by lot. Find '
            + 'the probability that exactly one of the three is a new member. Then audit the '
            + 'answer by counting all four cases and checking they return the 220 committees. '
            + 'Then try the same count with order left in and see what happens.',
          subgoals: [
            {
              label: 'Turn the English into two choices joined by AND',
              detail:
                '"Exactly one new member" means the committee holds one of the 5 new members and '
                + '— since it has three places — two of the 7 older ones. Both halves are forced '
                + 'by the phrase, and the second is the half that gets dropped: "exactly one '
                + 'new" is not a condition on one member, it is a complete description of the '
                + 'committee\'s composition. So the event is "one of these five AND two of those '
                + 'seven", which is a shape the product rule is for.',
              socratic:
                'The committee has three places and exactly one is to be a new member. What does '
                + 'that force about the other two places, and why is naming them part of the '
                + 'condition rather than extra detail?',
            },
            {
              label: 'Count each factor as an unordered selection',
              detail:
                'One new member from 5: there are 5 ways, and a descending product of one factor '
                + 'is just the pool, with 1! = 1 to divide by. Two older members from 7: in '
                + 'order 7 x 6 = 42, each pair reached 2! = 2 ways, so 42/2 = 21. Both are '
                + 'unordered counts, matching the convention the space was counted in — which is '
                + 'the previous point\'s rule being obeyed rather than restated, and it has to '
                + 'be obeyed by every factor, not just by the total.',
              socratic:
                'How many ways are there to pick one of the 5 new members, and how many to pick '
                + 'two of the 7 older ones? Which convention do those two counts have to be in, '
                + 'and why that one?',
            },
            {
              label: 'Check the product rule\'s condition before multiplying',
              detail:
                'The rule needs the number of options for the second choice to be the same '
                + 'whichever option was taken first. It is: whichever of the 5 new members is on '
                + 'the committee, the two older places are still being filled from all 7 older '
                + 'members, so the second factor is 21 every time. The SET of available people '
                + 'never changed at all here, which is a stronger condition than the rule '
                + 'requires — the rule would be satisfied by the count holding still while the '
                + 'set moved. So 5 x 21 = 105 committees hold exactly one new member.',
              socratic:
                'You are about to multiply 5 by 21. What would have to be true of the 21 for '
                + 'that to be allowed, and is it true here — whichever new member was picked?',
            },
            {
              label: 'Divide by the space, counted the same way',
              detail:
                '105 favourable committees out of 220, so P(exactly one new) = 105/220 = 21/44, '
                + 'a little under a half. The division is licensed by the same thing as before: '
                + 'the 220 committees are equally likely because the draw is by lot, and both '
                + 'counts are unordered. Note that nothing in this point touched the '
                + 'denominator — the space was counted once, in the point above, and every '
                + 'probability in the concept divides by that same 220.',
              socratic:
                'You have 105 favourable committees. What is the probability, and which of the '
                + 'two numbers in that fraction did this point actually do any work on?',
            },
            {
              label: 'Audit the four cases, which must give the space back',
              detail:
                'A committee holds 0, 1, 2 or 3 new members, exactly one of those, so the four '
                + 'cases are a partition of the 220. Count each the same way. Zero new: (7 x 6 x '
                + '5)/6 = 35. One new: 105, above. Two new: (5 x 4)/2 = 10 pairs of new members '
                + 'times 7 older, so 70. Three new: 10, from the point above. Add them: 35 + 105 '
                + '+ 70 + 10 = 220, which is the size of the space, so no case was double '
                + 'counted and none was missed. This is the only check available when the event '
                + 'is too big to list, and a single wrong factor shows up in it immediately.',
              socratic:
                'How many new members can a committee hold, and how many committees are there in '
                + 'each of those cases? Add your four numbers — what must the total be, and what '
                + 'would a total of 230 have told you?',
            },
            {
              label: 'Try it with order left in, and watch a probability exceed 1',
              detail:
                'Counting favourable draws in order: the new member can come out first, second '
                + 'or third — 3 positions — then there are 5 choices for who it is and 7 x 6 = '
                + '42 ordered ways to fill the other two places, so 3 x 5 x 42 = 630. Over the '
                + 'ordered space that is 630/1320 = 21/44, the right answer again, as the '
                + 'previous point promised. Over the UNORDERED space it is 630/220 = 63/22, '
                + 'nearly 2.9 — and a probability cannot exceed 1, so this version of the '
                + 'mistake refutes itself. It is the same mistake as 60/220 in the previous '
                + 'point, with nothing different about it except that the event was large enough '
                + 'for the factor of 6 to push the answer past 1.',
              socratic:
                'In the ordered space there are 630 favourable draws. Divide that by 220 and look '
                + 'at the answer — what is wrong with it as a probability, and what does that '
                + 'tell you about which space the 220 belongs to?',
            },
          ],
          answer:
            'P(exactly one new) = 21/44. The event is one of the 5 new AND two of the 7 older: 5 '
            + 'ways times (7 x 6)/2 = 21 ways, and the multiplication is licensed because the 21 '
            + 'is the same whichever new member was chosen, so 5 x 21 = 105 committees. Then '
            + '105/220 = 21/44. The audit: the four cases by number of new members are 35, 105, '
            + '70 and 10, which add to 220, so they partition the space. With order left in the '
            + 'favourable count is 3 x 5 x 42 = 630, and 630/1320 = 21/44 as expected — while '
            + '630/220 = 63/22 is greater than 1 and so announces the mixed convention, which '
            + 'the previous point\'s 3/11 did not.',
        },
      },
      {
        id: 'a-complement-or-an-overlap-is-repaired-on-the-counts-then-divided-once',
        conceptId: 'counting-probability',
        statement:
          'Two events are awkward to count directly and both are reached by counting something '
          + 'else. An event that is nearly the whole space has a small complement, and since the '
          + 'two have no outcome in common and together are everything, P(not E) = 1 - P(E): '
          + 'count the small side and subtract. The saving is in the counting and not in the '
          + 'division, which is worth noticing, because it means the complement can be taken '
          + 'before dividing as easily as after — (|S| - |not E|) / |S| and 1 - |not E| / |S| '
          + 'are the same number. The second awkward case is a union of two events that overlap. '
          + 'Adding the two counts counts the shared outcomes twice, so the repair is '
          + 'inclusion-exclusion on the COUNTS — |A| + |B| - |A and B| — and then one division '
          + 'at the end. That is the difference from the first concept, where the correction had '
          + 'to be shown happening to the probabilities: here the counting subject supplies the '
          + 'repaired count before any probability exists, and this concept divides it once.',
        position: 3,
        workedExample: {
          problem:
            'The same club and the same 220 committees. First find the probability that the '
            + 'committee includes at least one new member. Then let A be "Ann is on the '
            + 'committee" and B be "Bob is on the committee", for two particular members, and '
            + 'find P(A or B) — once by repairing the overlap, and once by counting the '
            + 'committees that include neither of them.',
          subgoals: [
            {
              label: 'Notice which side of the complement is the smaller count',
              detail:
                '"At least one new member" is true of most committees, so counting it directly '
                + 'means adding the 1-new, 2-new and 3-new cases — three counts. Its complement '
                + 'is "no new members at all", which is a committee drawn from the 7 older '
                + 'members alone: (7 x 6 x 5)/6 = 35. One count instead of three, and it is the '
                + 'same 35 the audit in the previous point produced, which is a useful sign that '
                + 'the partition and the complement are the same bookkeeping seen twice.',
              socratic:
                '"At least one new member" is true of most of the 220 committees. Which committees '
                + 'is it false for, how many of those are there, and why is that the number worth '
                + 'computing?',
            },
            {
              label: 'Subtract, and note that it can be done on either side of the division',
              detail:
                'The event and its complement share no outcome and together are the whole space, '
                + 'so their probabilities add to 1: P(at least one new) = 1 - 35/220 = 1 - 7/44 '
                + '= 37/44. Equivalently, subtract the counts first: 220 - 35 = 185 favourable '
                + 'committees, and 185/220 = 37/44. The same number, because dividing is the '
                + 'last step either way — which tells you that the saving was entirely in the '
                + 'counting, and that this is the first concept\'s complement rule unchanged '
                + 'with a counted 35 in place of a 1 read off a list.',
              socratic:
                '35 of the 220 committees have no new member. Get the answer by subtracting from '
                + '1, then get it again by subtracting 35 from 220 before dividing. Why must '
                + 'those two agree?',
            },
            {
              label: 'Count the two overlapping events, and the overlap exactly',
              detail:
                'A is the committees containing Ann. Fix her in one place and choose the other '
                + 'two from the remaining 11: (11 x 10)/2 = 55. The same for Bob: 55. Note the '
                + 'check available here — 55/220 = 1/4, and three seats among twelve members is '
                + 'exactly a quarter, which is the kind of agreement worth looking for. A and B '
                + 'overlap, because a committee can hold both of them: fix both and choose one '
                + 'more from the remaining 10, so |A and B| = 10.',
              socratic:
                'How many of the 220 committees include Ann? Now how many include both Ann and '
                + 'Bob — and why can that second number not be zero?',
            },
            {
              label: 'Repair the count, then divide once',
              detail:
                'Adding gives 55 + 55 = 110, and that counts each of the 10 committees holding '
                + 'both of them twice — once as a committee with Ann, once as a committee with '
                + 'Bob. Taking one copy of the overlap off puts every committee in the union at '
                + 'exactly one: 55 + 55 - 10 = 100. Then divide, once, at the end: P(A or B) = '
                + '100/220 = 5/11. The repair happened to the counts, which is where '
                + 'inclusion-exclusion lives, and the division is the only thing this concept '
                + 'added to it.',
              socratic:
                'You have 55, 55 and an overlap of 10. Which committees were counted twice by '
                + 'the 110, how many times should each be counted, and at what point in the '
                + 'calculation does a probability appear at all?',
            },
            {
              label: 'Check it by the count that handles no overlap at all',
              detail:
                'A committee is in neither A nor B exactly when it excludes both Ann and Bob, so '
                + 'it is drawn from the other 10 members: (10 x 9 x 8)/6 = 120. Then the union '
                + 'holds 220 - 120 = 100 committees, which is the 100 above. That is a real '
                + 'check rather than a rearrangement: it never adds two counts and never '
                + 'subtracts an overlap, so a wrong overlap in the first route could not have '
                + 'survived into it. It also puts the two moves of this point together — the '
                + 'union was awkward, so it was reached through its complement.',
              socratic:
                'How many committees include neither Ann nor Bob? Use that to get the number in '
                + 'the union — and what makes this a check on the previous answer rather than '
                + 'the same calculation written differently?',
            },
          ],
          answer:
            'P(at least one new) = 37/44: the complement is the 35 committees drawn from the 7 '
            + 'older members alone, so 1 - 35/220 = 37/44, and subtracting first gives 185/220 = '
            + '37/44 as well. For the two members: |A| = |B| = (11 x 10)/2 = 55 and |A and B| = '
            + '10, so adding alone double-counts those 10 and the repaired count is 55 + 55 - 10 '
            + '= 100, giving P(A or B) = 100/220 = 5/11. The check: 120 committees contain '
            + 'neither Ann nor Bob, and 220 - 120 = 100, by a route that handles no overlap at '
            + 'all. Both moves repair a COUNT and divide once at the end.',
        },
      },
    ],
  },
  {
    id: 'conditional-probability',
    name: 'Conditional probability',
    subjectId: subject.id,
    scope: {
      id: 'conditional-probability',
      label: 'Conditional probability',
      hint: 'conditional probability independence multiplication rule',
      /*
       * The map node's pattern and its `terms` as the hint, both carried across
       * unchanged, which every promotion since the fourth has done. The
       * shortfall is in BOTH directions for the first time in this file and is
       * set out in the header, along with the second dead alternative this
       * file's three patterns have now produced.
       */
      match: /\b(conditional probability|independence \(probability\))\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'divide-by-the-condition-rather-than-by-the-whole-space',
        statement:
          'Produce the probability of one event given another by dividing the count of the '
          + 'OVERLAP by the count of the CONDITION, and so treat conditioning as a change of '
          + 'sample space rather than as a new formula. Produce the same number as a ratio of '
          + 'two ordinary probabilities, and so establish that the size of the original space '
          + 'divides out of it — which is why the two ways of writing the definition are one. '
          + 'Produce the conditional with the two events swapped, and so establish that P(A|B) '
          + 'and P(B|A) are different numbers reached by moving the same numerator over a '
          + 'different denominator.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'multiply-one-conditional-factor-per-draw-along-a-sequence',
        statement:
          'Produce the probability of a run of draws made one at a time by multiplying one '
          + 'factor per draw, and so decide each factor\'s denominator from what the draws '
          + 'before it removed. Produce the probability of an event that can happen along more '
          + 'than one path by multiplying along each path and adding across them, and so '
          + 'distinguish the rule that multiplies from the rule that adds. Produce the same '
          + 'probability the simultaneous draw gave, and so establish that the two experiments '
          + 'agree where this concept says they must.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'settle-independence-by-the-product-test-rather-than-by-how-it-sounds',
        statement:
          'Produce P(A) x P(B) for two events whose counts are known and compare it with the '
          + 'probability of their overlap, and so settle independence by a numerical identity '
          + 'rather than by whether the events sound related. Produce the probability of two '
          + 'draws made WITH replacement, and so establish that the conditional factor equals '
          + 'the unconditional one exactly when the mechanism restores the space. Produce '
          + 'P(A) x P(B) for two events that cannot both happen, and so establish that '
          + 'mutually exclusive is not a kind of independent.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'conditioning-replaces-the-space-so-the-denominator-is-the-condition',
        conceptId: 'conditional-probability',
        statement:
          'Being told that something happened does not change the formula; it changes the SET '
          + 'the formula counts. The outcomes the information rules out are gone, the ones it '
          + 'leaves kept their chances relative to one another, so they are still equally '
          + 'likely among themselves and dividing is licensed in the new space for exactly the '
          + 'reason it was in the old one. That gives P(A given B) = |A and B| / |B|: the '
          + 'numerator is the overlap, because only outcomes in the restricted space can count '
          + 'towards A, and the denominator is the CONDITION and not the whole space. Dividing '
          + 'both counts by the size of the original space turns the same statement into '
          + 'P(A given B) = P(A and B) / P(B), which is not a second definition but the first '
          + 'one with |S| cancelled — and is the form that survives when the outcomes are not '
          + 'equally likely and there are no counts to use. One consequence is worth meeting '
          + 'immediately: the numerator of P(A given B) and of P(B given A) is the same number '
          + 'and only the denominator moves, so the two are different quantities and reading '
          + 'one for the other is the most consequential error in the subject.',
        position: 1,
        /*
         * No `automaticityTarget`. Dividing 6 by 55 would time beautifully,
         * which is the trap both concepts below name about their own
         * arithmetic: the skill is deciding WHICH SET the denominator counts,
         * and a speed reward trains the division a learner already has.
         */
        workedExample: {
          problem:
            'The same club: 12 members, 5 of whom joined this year, and three drawn by lot so '
            + 'that the 220 possible committees are equally likely. Ann is one of the 5 new '
            + 'members. You are told that Ann is on the committee. Find the probability that '
            + 'all three members are new. Then reach the same number as a ratio of two '
            + 'ordinary probabilities. Then find the probability that Ann is on the committee '
            + 'given that all three are new, and compare the two answers.',
          subgoals: [
            {
              label: 'Replace the space with the outcomes the information leaves standing',
              detail:
                'Being told Ann is on the committee rules out every committee without her and '
                + 'says nothing to separate the ones that remain, so those keep their chances '
                + 'relative to one another and are still equally likely among themselves. '
                + 'There are (11 x 10)/2 = 55 of them — fix Ann in one place and choose the '
                + 'other two from the remaining 11, which is `counting-principles` and is the '
                + 'same 55 the concept below counted for this event. So the experiment to '
                + 'work in has 55 outcomes rather than 220, and that substitution is the whole '
                + 'of what conditioning does.',
              socratic:
                'You are told Ann is on the committee. Which of the 220 committees are still '
                + 'possible, how many of those are there, and what has being told this done to '
                + 'their chances relative to one another?',
            },
            {
              label: 'Count the event inside the new space rather than the old one',
              detail:
                '"All three are new" has to be counted among the 55, not among the 220. Every '
                + 'committee in the restricted space already holds Ann, who is new, so it is '
                + 'all-new exactly when its other two members are both new — two chosen from '
                + 'the other 4 new members, (4 x 3)/2 = 6. Those 6 are precisely the '
                + 'committees lying in BOTH events, which is why the general form has the '
                + 'OVERLAP on top: an outcome outside the condition cannot count towards the '
                + 'event any more, because it is no longer an outcome.',
              socratic:
                'Among the 55 committees that contain Ann, which ones have all three members '
                + 'new — and once Ann\'s place is taken, how many new members are left to '
                + 'choose the other two from?',
            },
            {
              label: 'Divide, and measure what the information actually moved',
              detail:
                'P(all three new given Ann is on it) = 6/55. Without the information it was '
                + '10/220 = 1/22. Compare them over a common denominator rather than by eye: '
                + '6/55 is 12/110 and 1/22 is 5/110, so being told about Ann has more than '
                + 'doubled the probability, which is the sense in which it was information. '
                + 'Notice what did NOT happen — the formula P(E) = |E| / |S| was not amended, '
                + 'extended or replaced. Only the set that |S| counts moved, and that is the '
                + 'entire content of this concept.',
              socratic:
                'You have 6 favourable committees out of the 55 that are still possible. What '
                + 'is the probability, and how does it compare with the 1/22 you had before '
                + 'you were told anything — over a common denominator rather than by eye?',
            },
            {
              label: 'Reach it again from two ordinary probabilities, and watch the 220 cancel',
              detail:
                'Work in the original space instead. P(all new AND Ann on it) = 6/220 = 3/110 '
                + 'and P(Ann on it) = 55/220 = 1/4. Divide the first by the second: '
                + '(6/220)/(55/220) = 6/55, because the 220 is in both and a common factor in '
                + 'a ratio cancels. So |A and B| / |B| and P(A and B) / P(B) are ONE '
                + 'definition with the size of the original space divided out, not two rules '
                + 'to remember. The second form is the one that matters later: it never '
                + 'mentions counting, so it still says something when the outcomes are not '
                + 'equally likely and there is nothing to count.',
              socratic:
                'P(all new and Ann on it) is 6/220 and P(Ann on it) is 55/220. Divide the '
                + 'first by the second — which number disappears when you do, and what does '
                + 'that tell you about the two ways the definition gets written?',
            },
            {
              label: 'Swap the condition, and find it is a different question entirely',
              detail:
                'Now condition the other way: given that all three are new, how likely is it '
                + 'that Ann is one of them? The overlap is the same 6 committees, but the '
                + 'space is now the 10 all-new ones, so the answer is 6/10 = 3/5. Check it '
                + 'without the formula — if all three are new then three of the 5 new members '
                + 'are on the committee, so a particular new member is on it with probability '
                + '3/5, which agrees. Against 6/55 that is not a small discrepancy, and the '
                + 'reason is visible in the arithmetic: the numerator was the same both times '
                + 'and only the denominator moved. Reversing a conditional when the overlap is '
                + 'NOT in hand is `bayes-theorem`, a node above this concept.',
              socratic:
                'Keep the same 6 committees on top and put the 10 all-new ones underneath '
                + 'instead. What have you computed, why is it nothing like 6/55, and which of '
                + 'the two numbers did the swap actually change?',
            },
          ],
          answer:
            'P(all three new given Ann is on the committee) = 6/55. The information leaves the '
            + '(11 x 10)/2 = 55 committees containing Ann, still equally likely among '
            + 'themselves, and 6 of those have her two colleagues drawn from the other 4 new '
            + 'members, since (4 x 3)/2 = 6. The same number comes from (6/220)/(55/220) = '
            + '6/55 with the 220 cancelling, which is why |A and B| / |B| and P(A and B) / '
            + 'P(B) are one definition. Against the unconditional 1/22 = 5/110, the '
            + 'conditional 6/55 = 12/110 is more than double. Swapping the condition gives '
            + 'P(Ann on it given all three new) = 6/10 = 3/5 — the same 6 over a different '
            + 'denominator, and nothing like the same number.',
        },
      },
      {
        id: 'a-sequence-of-draws-multiplies-one-conditional-factor-per-step',
        conceptId: 'conditional-probability',
        statement:
          'Multiplying both sides of the definition by the condition\'s probability gives '
          + 'P(A and B) = P(B) x P(A given B), and that rearrangement is what makes a sequence '
          + 'of draws computable. Draw one at a time and each draw has its own space: the '
          + 'first factor is unconditional, and every factor after it is conditioned on what '
          + 'the earlier draws removed, so its denominator counts what is LEFT rather than '
          + 'what there was. Chain it and the probability of a whole run is a product of one '
          + 'factor per step. This is the first thing in the subject that multiplies two '
          + 'probabilities — the two concepts below draw everything simultaneously precisely so '
          + 'that they never have to. When an event can happen along more than one path, the '
          + 'paths are outcomes with nothing in common, so they ADD while each path '
          + 'multiplies: that is the addition rule and this rule doing different jobs in one '
          + 'calculation. And the error this point exists to prevent is reusing the first '
          + 'factor unchanged, which is not bad arithmetic but the right answer to a different '
          + 'experiment.',
        position: 2,
        workedExample: {
          problem:
            'The same twelve members, 5 of them new, but now the three are drawn one at a '
            + 'time and kept out once drawn. Find the probability that all three drawn are '
            + 'new, as a product of one factor per draw, and check it against the 1/22 the '
            + 'simultaneous draw gave. Then find the probability that exactly one of the first '
            + 'TWO drawn is new. Then say what question (5/12) x (5/12) x (5/12) answers.',
          subgoals: [
            {
              label: 'Write the first factor, which is the only unconditioned one',
              detail:
                'Nothing has happened yet, so the first draw is an ordinary probability in the '
                + 'full space: 5 of the 12 members are new, so P(first is new) = 5/12. Worth '
                + 'naming that this is the only factor in the whole product that needs no '
                + 'condition, because it is the only one with nothing before it — which is '
                + 'also why a chain has to be written in an order and the first position is '
                + 'not interchangeable with the others.',
              socratic:
                'Before any member has been drawn, how likely is it that the first one out is '
                + 'new — and what makes this factor different from every other factor you are '
                + 'about to write?',
            },
            {
              label: 'Condition the second factor on what the first draw took away',
              detail:
                'Suppose the first member drawn was new and is kept out. Eleven members are '
                + 'left and 4 of them are new, so P(second is new given the first was) = 4/11. '
                + 'This is the point above with the restricted space being the remaining pool: '
                + 'the denominator counts what is left, not what there was. Writing 5/12 a '
                + 'second time would not be a slip — it would be a claim that the first member '
                + 'went back, which is a different experiment.',
              socratic:
                'The first member drawn was new and is not going back. How many members are '
                + 'left, how many of those are new, and so what is the probability the second '
                + 'is new as well?',
            },
            {
              label: 'Multiply along the sequence, which is the definition rearranged',
              detail:
                'P(A and B) = P(A) x P(B given A) is P(B given A) = P(A and B)/P(A) with both '
                + 'sides multiplied by P(A), so the product rule for probabilities is the '
                + 'point above with nothing added. Chain it for three draws: after two new '
                + 'members are out, 10 remain and 3 are new, so the third factor is 3/10 and '
                + 'P(all three new) = (5/12) x (4/11) x (3/10) = 60/1320 = 1/22. Each '
                + 'denominator drops by one because each draw removes somebody, and each '
                + 'numerator drops by one because each draw removed a NEW somebody — that is '
                + 'what the conditioning is keeping track of, and the two halves of it are '
                + 'worth separating. Ask instead for new, then new, then NOT new, in that '
                + 'order: the denominators are the same 12, 11, 10, because the pool shrinks '
                + 'whatever type came out, but the third numerator is now the 7 members who '
                + 'are not new, giving (5/12) x (4/11) x (7/10) = 140/1320 = 7/66. A learner '
                + 'who has learned "the numbers go down by one each time" gets the first of '
                + 'those right and the second wrong.',
              socratic:
                'You have 5/12 and 4/11, and after two new members are out there are 10 left '
                + 'of whom 3 are new. What is the third factor, and which rule from the point '
                + 'above is it that lets you multiply the three together rather than combine '
                + 'them some other way?',
            },
            {
              label: 'Check it against the draw that happened all at once',
              detail:
                'The concept below drew three members simultaneously, counted 10 all-new '
                + 'committees out of 220, and got 1/22 without multiplying anything. This '
                + 'route multiplies three conditional factors and gets 1/22 as well. The two '
                + 'experiments record different things — one knows who came out first — and '
                + 'agree on this probability because the 3! orderings divide both of that '
                + 'concept\'s counts, which is its own first knowledge point arriving here as '
                + 'a check. A disagreement would mean one of the conditional factors was '
                + 'wrong, so this is worth doing rather than noting.',
              socratic:
                'Drawing the three at once gave 10 favourable committees out of 220. You have '
                + 'just multiplied three fractions and got 1/22. Must those two agree, and what '
                + 'would it have meant if they had not?',
            },
            {
              label: 'Add across the paths when the event can happen more than one way',
              detail:
                '"Exactly one of the first two is new" happens as new-then-older or as '
                + 'older-then-new, and no draw can be both, so the two paths are disjoint '
                + 'events. Multiply along each: (5/12) x (7/11) = 35/132 and (7/12) x (5/11) = '
                + '35/132. They are equal because each is 5 x 7 over 12 x 11 with the factors '
                + 'taken in the other order, not by coincidence of these numbers. Being '
                + 'disjoint they add: 70/132 = 35/66. Multiplying runs ALONG a path and adding '
                + 'runs ACROSS paths, which is this rule and `sample-spaces`\' addition rule '
                + 'doing different jobs in one calculation. Checked the simultaneous way: '
                + '5 x 7 = 35 of the (12 x 11)/2 = 66 pairs hold one of each.',
              socratic:
                'There are two ways for exactly one of the first two draws to be new. What is '
                + 'each of them as a product, and what is it about the two of them that lets '
                + 'the results be added rather than multiplied?',
            },
            {
              label: 'Say what the unconditioned product would have been the answer to',
              detail:
                '(5/12) x (5/12) x (5/12) = 125/1728, about 0.072, where the right answer is '
                + '1/22, about 0.045. That is not an arithmetic fault: it is the correct answer '
                + 'to the experiment in which each member drawn is put back before the next '
                + 'draw, so the pool is restored and the factors really are all 5/12. The tell '
                + 'is in the denominators — a second factor still over 12 is a claim that '
                + 'nothing was removed. Which experiment you are in is settled by one sentence '
                + 'in the description, and the next point is about exactly that.',
              socratic:
                '5/12 multiplied by itself three times is 125/1728, where the right answer is '
                + '1/22. Rather than calling it wrong, what experiment would it be the right '
                + 'answer to — and which part of those three fractions tells you which '
                + 'experiment you are in?',
            },
          ],
          answer:
            'P(all three new) = (5/12) x (4/11) x (3/10) = 60/1320 = 1/22. Each factor after '
            + 'the first is conditioned on what the earlier draws removed — 11 left with 4 new, '
            + 'then 10 left with 3 new — and the product is the multiplication rule chained, '
            + 'where asking for new, new, then NOT new keeps the same three denominators and '
            + 'changes only the last numerator: (5/12) x (4/11) x (7/10) = 7/66. The product is '
            + 'which is the definition of a conditional probability multiplied through by the '
            + 'condition. It agrees with the 10/220 = 1/22 the simultaneous draw gave, by a '
            + 'route that multiplies nothing. For exactly one of the first two: the paths are '
            + '(5/12) x (7/11) and (7/12) x (5/11), both 35/132 because the same two factors '
            + 'are multiplied in the other order, and they are disjoint so they add to 70/132 '
            + '= 35/66 — the same as the 5 x 7 = 35 mixed pairs among the (12 x 11)/2 = 66 '
            + 'pairs there are. And (5/12) x (5/12) x (5/12) = 125/1728 is not a mistake about '
            + 'this experiment but the right answer to the one where each member is put back.',
        },
      },
      {
        id: 'independence-is-a-product-test-that-has-to-be-computed',
        conceptId: 'conditional-probability',
        statement:
          'Independence is the case where conditioning changes nothing: P(A given B) = P(A), '
          + 'or equivalently and without a denominator, P(A and B) = P(A) x P(B). That is the '
          + 'DEFINITION rather than a consequence of one, which matters because it means '
          + 'independence is settled by computing two numbers and comparing them, and never by '
          + 'how related the two events sound. Two events about different people can fail the '
          + 'test, because they compete for the same places; two draws from the same twelve '
          + 'people can pass it, if the mechanism puts the first one back. When the test fails, '
          + 'the conditional says which way and by how much, and the product test on its own '
          + 'does not. And the word most often mistaken for this one means close to the '
          + 'opposite: two events that cannot both happen have P(A and B) = 0 while P(A) x '
          + 'P(B) is positive, so mutually exclusive events are never independent — knowing one '
          + 'has happened tells you the other is impossible, which is the most that one event '
          + 'can say about another.',
        position: 3,
        workedExample: {
          problem:
            'Three questions about the same club, each settled by the same test. Are "Ann is '
            + 'on the committee" and "Bob is on the committee" independent? Two members are '
            + 'drawn one at a time with the first put back before the second is drawn — are '
            + 'those two draws independent? And are "all three are new" and "no member is new" '
            + 'independent?',
          subgoals: [
            {
              label: 'State the test as an identity between two numbers you can compute',
              detail:
                'A and B are independent when P(A and B) = P(A) x P(B). Where P(B) is not '
                + 'zero that is the same as saying P(A given B) = P(A) — conditioning on B '
                + 'leaves A exactly where it was — and the product form is usually easier '
                + 'because it needs no restricted space and is symmetric in the two events. '
                + 'Either way it is an equation between numbers. Nothing about whether the '
                + 'events are about the same people, or sound connected, enters into it.',
              socratic:
                'Independence is meant to say that knowing B tells you nothing about A. '
                + 'Written as an equation between probabilities, what has to hold exactly — '
                + 'and which quantity is the one required not to move?',
            },
            {
              label: 'Test the two members, using counts the concept below already produced',
              detail:
                'P(Ann on it) = 55/220 = 1/4 and P(Bob on it) = 1/4 the same way, so the '
                + 'product is 1/16 = 0.0625. The overlap is the 10 committees holding both of '
                + 'them, so P(both on it) = 10/220 = 1/22, about 0.0455. Those are not equal, '
                + 'so the two events are NOT independent. The three counts — 55, 55 and 10 — '
                + 'are exactly the ones the concept below produced for the union of these same '
                + 'two events, which is worth noticing: the same counts answer a question '
                + 'about adding and a question about multiplying, and the two questions are '
                + 'unrelated.',
              socratic:
                '55 of the 220 committees hold Ann, 55 hold Bob, and 10 hold both. Which two '
                + 'numbers does the test ask you to compare, what are they, and what does the '
                + 'comparison settle?',
            },
            {
              label: 'Read the direction and the mechanism off the conditional',
              detail:
                'The product test says the events are dependent but not which way. Condition: '
                + 'P(Ann on it given Bob is) = 10/55 = 2/11, about 0.18, against an '
                + 'unconditional 1/4. So knowing Bob is on the committee makes Ann LESS likely, '
                + 'and there is a plain mechanism — the committee has three places, Bob is '
                + 'occupying one, so Ann is competing for two places among the other eleven '
                + 'members, which is 2/11 directly. That agreement is a check on the 10 and '
                + 'the 55, and it is the reason the dependence is negative rather than '
                + 'positive: the two events are rivals for a fixed number of seats.',
              socratic:
                'Given that Bob is on the committee, how many places remain and how many '
                + 'people are competing for them? What does that make P(Ann given Bob), and '
                + 'which way has the information pushed Ann\'s chances compared with the 1/4 '
                + 'she started with?',
            },
            {
              label: 'Put the member back, and watch the conditional factor become the plain one',
              detail:
                'Now the second experiment. The first member drawn is returned before the '
                + 'second draw, so when the second draw happens the pool is the same 12 '
                + 'members with the same 5 new: P(second is new given the first was) = 5/12, '
                + 'which is exactly P(second is new). The test passes, so P(both new) = (5/12) '
                + 'x (5/12) = 25/144. The independence is a fact about the MECHANISM — '
                + 'replacement restores the space the point above kept shrinking — and not '
                + 'about the members, who are the same twelve people as before.',
              socratic:
                'With the first member put back, what is the pool when the second draw '
                + 'happens? What does that make P(second is new given the first was), how does '
                + 'it compare with P(second is new), and what has the comparison settled?',
            },
            {
              label: 'Run the same two draws without replacement and watch the test fail',
              detail:
                'Take the member out instead and the second factor is 4/11, where the '
                + 'unconditional probability is 5/12. Over a common denominator 4/11 = 48/132 '
                + 'and 5/12 = 55/132, so they differ and the second draw is slightly less '
                + 'likely to be new. Two descriptions of the same twelve people, differing by '
                + 'one sentence about whether the first is returned, and one experiment is '
                + 'independent while the other is not. So independence cannot be read off the '
                + 'objects in the problem; it has to be computed from the mechanism, which is '
                + 'why this is a test and not an observation.',
              socratic:
                'Without replacement the second factor is 4/11 and the unconditional '
                + 'probability is 5/12. Compare them over a common denominator — and given '
                + 'that the twelve people have not changed, what is it that made one version '
                + 'of this experiment independent and the other not?',
            },
            {
              label: 'Test two events that cannot both happen, where the answer surprises',
              detail:
                '"All three are new" holds 10 committees and "no member is new" holds 35, and '
                + 'no committee is in both, so P(A and B) = 0. But P(A) x P(B) = (10/220) x '
                + '(35/220) = (1/22) x (7/44) = 7/968, which is not zero. The test fails, so '
                + 'mutually exclusive events with positive probabilities are never '
                + 'independent — and the two ideas point close to opposite ways. Being told '
                + 'one has happened tells you the other is IMPOSSIBLE, which is the most '
                + 'information one event can carry about another. The concept below used '
                + 'disjointness as the condition for ADDING probabilities; the test here is '
                + 'about MULTIPLYING them, and treating the one word as answering both '
                + 'questions is the standard error.',
              socratic:
                'No committee can have all three members new and also no new members. What '
                + 'does that make P(A and B), what is P(A) x P(B), and what do those two '
                + 'numbers together say about whether disjoint events are independent?',
            },
          ],
          answer:
            'The two members are not independent: P(Ann) x P(Bob) = (1/4) x (1/4) = 1/16 while '
            + 'P(both) = 10/220 = 1/22. The conditional says which way — P(Ann given Bob) = '
            + '10/55 = 2/11, below 1/4, because Bob occupies one of the three places and Ann '
            + 'is competing for two among the other eleven members. The two draws WITH '
            + 'replacement ARE independent: the pool is restored, so P(second new given first '
            + 'new) = 5/12 = P(second new), and P(both new) = (5/12) x (5/12) = 25/144. The '
            + 'same two draws without replacement are not: 4/11 = 48/132 against 5/12 = '
            + '55/132. And "all three new" and "no member new" are not independent either, '
            + 'though they cannot both happen: P(A and B) = 0 while P(A) x P(B) = (1/22) x '
            + '(7/44) = 7/968, so disjointness is the opposite of independence rather than a '
            + 'version of it.',
        },
      },
    ],
  },
  {
    id: 'bayes-theorem',
    name: "Bayes' theorem",
    subjectId: subject.id,
    scope: {
      id: 'bayes-theorem',
      label: "Bayes' theorem",
      hint: 'bayes theorem prior posterior base rate false positive',
      /*
       * The map node's pattern and its `terms` as the hint, carried across
       * unchanged, as every promotion since the fourth has done. This is the
       * FIRST of this file's four patterns with no dead alternative and no
       * overclaim — the header sets out what that cost in recall, and the sweep
       * that found the other two was run again rather than assumed.
       */
      match: /\bbayes('|’)?[- ]?(theorem|rule|law)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'reverse-a-conditional-by-building-the-overlap-from-the-other-direction',
        statement:
          'Produce the probability of a condition given a positive result from the rate of '
          + 'positives under that condition and the rate at which the condition occurs, and so '
          + 'establish that the two conditionals are joined by the one overlap they share rather '
          + 'than by a new formula. Produce the overlap belonging to the case you were NOT asked '
          + 'about, and so establish that the answer is decided by which of the two overlaps is '
          + 'the larger. Produce the same number by counting a population instead of dividing '
          + 'probabilities, and so establish that nothing in the reversal needs a conditional '
          + 'probability to be written down at all.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'build-the-denominator-as-a-sum-over-the-cases-and-move-the-base-rate-alone',
        statement:
          'Produce the probability of the evidence by adding one term per case, and so decide '
          + 'from the cases being disjoint and exhaustive that the sum is the whole of it. '
          + 'Produce the answer again with the base rate changed and every test figure held, '
          + 'and so establish that a test has no accuracy on its own and that the base rate '
          + 'decides the balance between the two terms rather than scaling the result. Produce '
          + 'the probability of the opposite result by the same split, and so check the '
          + 'denominator against the whole space instead of trusting it.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'update-in-odds-form-so-that-the-prior-is-visibly-a-factor',
        statement:
          'Produce the ratio of the two rates at which the evidence arrives, and so isolate '
          + 'everything the evidence itself contributes. Produce the posterior probability as '
          + 'prior odds times that ratio converted back, and so establish that the update is '
          + 'ONE multiplication and that the total probability never had to be computed. '
          + 'Produce the probability of the innocent case given a match in a pool where the '
          + 'prior odds are long, and so establish that a very large likelihood ratio on a very '
          + 'small prior is still small — which is the arithmetic the prosecutor\'s fallacy gets '
          + 'backwards.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'reversing-a-conditional-is-the-definition-written-twice-and-divided',
        conceptId: 'bayes-theorem',
        statement:
          'The concept below computes P(A given B) and P(B given A) from the same two counts and '
          + 'shows they differ. This one is what to do when the OVERLAP is not something you '
          + 'can count — when what you have is the conditional the other way round, and the '
          + 'rate at which the condition occurs at all. The two conditionals share exactly one '
          + 'number, P(A and B), because P(A given B) x P(B) and P(B given A) x P(A) are both '
          + 'equal to it. So one can be built from the other: P(A given B) = '
          + 'P(B given A) x P(A) / P(B). That is the definition written twice and divided, not '
          + 'a rule to remember, and the term that does the work is P(A) — the BASE RATE, the '
          + 'probability of the condition before any evidence arrived. Dropping it is the error '
          + 'this concept exists for, and dropping it does not make the answer slightly wrong: '
          + 'it answers the other conditional, which can differ from the right one by any '
          + 'amount at all. The reason is visible in the two overlaps. P(A and B) is one of '
          + 'them, P(not A and B) is the other, and a positive result comes from whichever of '
          + 'those two is the larger — so a small rate acting on a large group beats a large '
          + 'rate acting on a small one.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason all three concepts below give
         * about their own arithmetic: multiplying 9/10 by 1/100 would time
         * beautifully, and the skill is deciding WHICH conditional you were
         * handed. A speed reward trains the multiplication a learner already
         * has, and would reward the learner who answers 9/10 fastest.
         */
        workedExample: {
          problem:
            'A condition occurs in 1 person in 100. A screening test is positive for 9 in 10 '
            + 'of the people who have it, and positive for 1 in 20 of the people who do not. '
            + 'Somebody tests positive. Find the probability that they have the condition. '
            + 'Then reach the same number by counting a population of 10,000 instead, and say '
            + 'what the answer 9/10 would have been the answer to.',
          subgoals: [
            {
              label: 'Separate the conditional you were handed from the one you were asked for',
              detail:
                'The test\'s figures are about people whose status is already known: among '
                + 'those who HAVE the condition, 9 in 10 test positive, which is '
                + 'P(positive given condition) = 9/10. The question is about somebody whose '
                + 'status is not known and whose result is: P(condition given positive). The '
                + 'concept below established that those are different quantities by computing '
                + 'both from one pair of counts. Here there is no overlap to count — nobody has '
                + 'been counted at all — so the reversal has to be built, and the first move is '
                + 'to notice that it needs building.',
              socratic:
                'The test\'s 9-in-10 figure describes people already known to have the '
                + 'condition, and the question describes somebody known only to have tested '
                + 'positive. Which of those two groups is the one you were asked about, and '
                + 'what would you need in order to say anything about it?',
            },
            {
              label: 'Build the overlap you want from the direction you were given',
              detail:
                'P(condition and positive) = P(condition) x P(positive given condition), which '
                + 'is the concept below\'s multiplication rule with nothing added — the '
                + 'definition of a conditional probability multiplied through by its condition. '
                + 'So the overlap is (1/100) x (9/10) = 9/1000. This is the whole trick of the '
                + 'reversal: the overlap is the one quantity both conditionals contain, and it '
                + 'can be reached from EITHER direction, so being given the wrong direction '
                + 'costs nothing provided the base rate is in hand.',
              socratic:
                '1 in 100 has the condition, and 9 in 10 of those test positive. Which rule '
                + 'from the concept below combines those two figures into the probability of '
                + 'both at once, and what number does it give?',
            },
            {
              label: 'Build the OTHER overlap, which is where the answer actually comes from',
              detail:
                '99 of every 100 people do not have the condition, and 1 in 20 of them tests '
                + 'positive anyway, so P(no condition and positive) = (99/100) x (1/20) = '
                + '99/2000. Put the two side by side over the same denominator: 9/1000 is '
                + '18/2000 against 99/2000. The false positives outnumber the true positives '
                + 'by more than five to one, and not because the test is bad — 1 in 20 is a '
                + 'much smaller rate than 9 in 10. It is because 99 times as many people sit '
                + 'behind the small rate. That comparison is the content of this concept, and a '
                + 'learner who has made it will never again report the 9/10.',
              socratic:
                '99 of every 100 people do not have the condition and 1 in 20 of them still '
                + 'tests positive. What is the probability of that combination, and once you '
                + 'put it over the same denominator as the 9/1000, which of the two groups '
                + 'supplies most of the positive results?',
            },
            {
              label: 'Divide the overlap you want by every way the result you saw can arrive',
              detail:
                'A positive result happens in exactly two ways and they cannot both happen, so '
                + 'P(positive) = 18/2000 + 99/2000 = 117/2000. Now the definition applies '
                + 'directly: P(condition given positive) = P(condition and positive) / '
                + 'P(positive) = (9/1000)/(117/2000) = 18/117 = 2/13, about 0.154. Written out, '
                + 'that is P(positive given condition) x P(condition) / P(positive) — the '
                + 'theorem, assembled rather than quoted. Notice that the numerator is one of '
                + 'the two terms in the denominator, which is why the answer can never exceed '
                + '1 and why it is near 1 only when the other term is small.',
              socratic:
                'A positive result arrives by exactly two routes and you have the probability '
                + 'of each. What is the probability of a positive result at all, and which of '
                + 'your two overlaps belongs on top when the question is about the people who '
                + 'have the condition?',
            },
            {
              label: 'Check it by counting a population, with no conditional probability in sight',
              detail:
                'Take 10,000 people. 100 have the condition and 9,900 do not. Of the 100, '
                + '9 in 10 test positive: 90. Of the 9,900, 1 in 20 test positive: 495. So '
                + '585 people test positive and 90 of them have the condition, giving 90/585 = '
                + '2/13 — the same answer, by a route that divides one count by another exactly '
                + 'as `counting-probability` does and never writes a conditional probability at '
                + 'all. This is worth doing rather than noting: it is a check on the 117/2000, '
                + 'and it is also the form in which the result stops being surprising, because '
                + '495 against 90 is a fact about two groups of people rather than about a '
                + 'formula.',
              socratic:
                'Take 10,000 people. How many have the condition, how many of those test '
                + 'positive, how many of the rest test positive anyway, and so what fraction of '
                + 'everybody who tested positive actually has it?',
            },
            {
              label: 'Say what the discarded answer was the answer to, since that names the error',
              detail:
                'Somebody who reports 9/10 has reported P(positive given condition) — a true '
                + 'statement about a question nobody asked. Against 2/13 that is not an '
                + 'approximation of the right answer; it is a different number about a '
                + 'different group. What IS true is that the positive result moved the '
                + 'probability from 1/100 to 2/13, which is a rise of more than fifteenfold, so '
                + 'the test is informative and the result is still far from a diagnosis. Both '
                + 'halves of that have to be said together: the base rate is the reason the '
                + 'answer is small, and the likelihood ratio is the reason it moved at all.',
              socratic:
                'A positive result moves the probability from 1 in 100 to 2/13. Is that a large '
                + 'change or a small one — and which group of people was somebody describing if '
                + 'they answered 9/10 instead?',
            },
          ],
          answer:
            'P(condition given positive) = 2/13, about 0.154. The overlap asked about is '
            + '(1/100) x (9/10) = 9/1000 = 18/2000, built from the conditional given rather '
            + 'than counted; the other overlap is (99/100) x (1/20) = 99/2000, and it is more '
            + 'than five times larger because 99 times as many people sit behind the smaller '
            + 'rate. A positive arrives only those two ways, so P(positive) = 117/2000 and the '
            + 'answer is (9/1000)/(117/2000) = 18/117 = 2/13. Counting 10,000 people gives the '
            + 'same thing with no conditional probability written down: 90 true positives and '
            + '495 false ones, so 90/585 = 2/13. The 9/10 is P(positive given condition) and is '
            + 'the answer to the other question entirely; what the result did do is raise the '
            + 'probability from 1/100 to 2/13, more than fifteenfold.',
        },
      },
      {
        id: 'the-denominator-is-a-sum-over-the-cases-so-the-base-rate-enters-three-times',
        conceptId: 'bayes-theorem',
        statement:
          'The denominator of the reversal is the probability of the evidence, and that is '
          + 'almost never given — it has to be built by splitting the evidence across the cases '
          + 'it can arrive by. Those cases must have nothing in common and must cover '
          + 'everything, and then `sample-spaces`\' addition applies term by term: '
          + 'P(B) = P(B|A)P(A) + P(B|not A)P(not A). That is the law of total probability, and '
          + 'it is the addition rule and the multiplication rule used once each. The '
          + 'consequence worth holding is a count: the base rate P(A) appears in the numerator '
          + 'once and in the denominator TWICE, once as itself and once as 1 - P(A). So it does '
          + 'not scale the answer and cannot be treated as a correction applied at the end — it '
          + 'decides the balance between the two terms, which is the whole quantity. Moving it '
          + 'and nothing else is therefore enough to change the answer completely, and that is '
          + 'why a test has no accuracy on its own: the same two test figures give 2/13 on a '
          + 'population where 1 in 100 has the condition and 18/19 on a group where half do.',
        position: 2,
        workedExample: {
          problem:
            'The same test: positive for 9 in 10 who have the condition and 1 in 20 who do '
            + 'not. Build P(positive) as a sum over the two cases when 1 person in 100 has the '
            + 'condition, and check your denominator by splitting the NEGATIVE result the same '
            + 'way. Then run the same test on a group in which 1 in 2 has the condition, '
            + 'changing nothing else.',
          subgoals: [
            {
              label: 'Split the evidence across cases that are disjoint and leave nothing out',
              detail:
                'Everybody either has the condition or does not: the two cases have no '
                + 'overlap and together they are the whole population, which is exactly the '
                + 'hypothesis `sample-spaces` requires before probabilities may be added. So a '
                + 'positive result is the union of two disjoint events — positive-with and '
                + 'positive-without — and P(positive) is the sum of their probabilities with no '
                + 'correction term, because there is no outcome in both to subtract. Each term '
                + 'is then a multiplication: a rate times the size of the group it applies to.',
              socratic:
                'A positive result can come from somebody who has the condition or from '
                + 'somebody who does not. What has to be true of those two cases before you '
                + 'are allowed to add their probabilities, and which of the two rules from the '
                + 'concept below does each term need?',
            },
            {
              label: 'Add the two terms, which are the two overlaps from the point above',
              detail:
                'P(positive) = (9/10) x (1/100) + (1/20) x (99/100) = 9/1000 + 99/2000 = '
                + '18/2000 + 99/2000 = 117/2000, which is 0.0585. These are the two numbers the '
                + 'point above already produced, and the only new thing is that they are being '
                + 'added rather than compared. Worth seeing that the denominator is bigger than '
                + 'the numerator of the reversal by exactly the amount of the second term, so '
                + 'the second term IS the gap between 9/10 and 2/13.',
              socratic:
                'You already have 18/2000 and 99/2000 from the point above. What is the '
                + 'probability of a positive result at all, and what does the second of those '
                + 'two terms account for in the final answer?',
            },
            {
              label: 'Check the split against the whole space rather than trusting it',
              detail:
                'If the cases really partition, the same split applied to the NEGATIVE result '
                + 'must give 1 - 117/2000 = 1883/2000. Run it: a negative comes from somebody '
                + 'with the condition at (1/10) x (1/100) = 1/1000 = 2/2000, and from somebody '
                + 'without at (19/20) x (99/100) = 1881/2000. That is 1883/2000, and it agrees. '
                + 'The check is worth running because a sum over cases that have been chosen '
                + 'badly looks exactly like one that has not: it is still a sum of plausible '
                + 'products, and only its disagreement with the complement exposes it.',
              socratic:
                'If your two cases really cover everybody, what must the probabilities of a '
                + 'negative result add up to? Work them out and compare — and what sort of '
                + 'mistake would this check have caught that reading the two terms again would '
                + 'not?',
            },
            {
              label: 'Count where the base rate appears, which is three places and not one',
              detail:
                'Written out, the answer is (9/10)(1/100) / [ (9/10)(1/100) + (1/20)(99/100) ]. '
                + 'The base rate 1/100 is in the numerator, in the first term of the '
                + 'denominator, and — as the 99/100 — in the second. Three occurrences, and the '
                + 'third is the one that gets forgotten because it is wearing a complement. '
                + 'That is why the base rate cannot be applied as a correction at the end: a '
                + 'quantity appearing above and below a division line does not scale what the '
                + 'division gives. It sets how the two terms below compare, and the answer is '
                + 'nothing but that comparison.',
              socratic:
                'Write the whole answer out as one fraction. In how many places does the 1 in '
                + '100 appear, counting the 99/100 as one of them — and what does appearing '
                + 'both above and below the line stop it from doing to the answer?',
            },
            {
              label: 'Move the base rate alone and watch the answer leave the room',
              detail:
                'Same test, different group: 1 in 2 has the condition. P(positive) = '
                + '(9/10)(1/2) + (1/20)(1/2) = 9/20 + 1/40 = 18/40 + 1/40 = 19/40, and '
                + 'P(condition given positive) = (9/20)/(19/40) = 18/19, about 0.947. Nothing '
                + 'about the test changed — 9 in 10 and 1 in 20 are the same two figures — and '
                + 'the answer went from about 0.154 to about 0.947. So "how accurate is this '
                + 'test" is not a question with an answer: the test has two rates, and the '
                + 'probability a positive result carries depends on who was tested. Screening '
                + 'everybody and testing people who already have symptoms are two different '
                + 'experiments with one piece of equipment.',
              socratic:
                'Keep the 9-in-10 and the 1-in-20 exactly as they are and test a group in '
                + 'which half the people have the condition. What is the answer now, and since '
                + 'nothing about the test moved, what does that say about describing a test as '
                + 'being a certain percentage accurate?',
            },
            {
              label: 'Push the base rate to each end, where the expression answers by itself',
              detail:
                'Set the base rate to 0 and the numerator is 0, so the answer is 0 — nobody '
                + 'has the condition, so a positive cannot indicate it however the test '
                + 'behaves. Set it to 1 and the second term of the denominator vanishes, so the '
                + 'answer is 1. Both come out of the same expression with no special case '
                + 'written for them, which is the sign that the denominator was built correctly '
                + 'rather than fitted: a sum over cases that has been assembled from the '
                + 'partition degenerates properly when the partition does.',
              socratic:
                'What happens to the numerator if nobody at all has the condition, and to the '
                + 'second term of the denominator if everybody does? What answers does the '
                + 'expression then give, and why is it reassuring that you did not have to '
                + 'write either of those cases down separately?',
            },
          ],
          answer:
            'P(positive) = (9/10)(1/100) + (1/20)(99/100) = 18/2000 + 99/2000 = 117/2000, the '
            + 'two cases being disjoint and exhaustive so that the addition rule applies with '
            + 'no overlap to subtract. The split checks out against the complement: the '
            + 'negatives give (1/10)(1/100) + (19/20)(99/100) = 2/2000 + 1881/2000 = 1883/2000, '
            + 'which is 1 - 117/2000. The base rate appears three times in the full fraction — '
            + 'numerator, first denominator term, and as 99/100 in the second — so it fixes the '
            + 'balance between the two terms rather than scaling the result. Moving it alone to '
            + '1 in 2 gives P(positive) = 19/40 and P(condition given positive) = '
            + '(9/20)/(19/40) = 18/19, about 0.947, against the earlier 2/13, about 0.154, with '
            + 'both test figures unchanged. At a base rate of 0 the expression gives 0 and at 1 '
            + 'it gives 1, with no case written for either.',
        },
      },
      {
        id: 'in-odds-form-the-update-is-one-multiplication-by-the-likelihood-ratio',
        conceptId: 'bayes-theorem',
        statement:
          'Write the theorem for A and again for not-A and divide one by the other. P(B) is the '
          + 'denominator of both, so it cancels, and what is left is '
          + 'P(A|B)/P(not A|B) = [ P(B|A)/P(B|not A) ] x [ P(A)/P(not A) ]: posterior ODDS are '
          + 'prior odds times the ratio of the two rates at which the evidence arrives. Three '
          + 'things follow and each is worth having separately. The total probability never has '
          + 'to be computed, which is why this is the form to use when the cases are many. The '
          + 'evidence contributes exactly one number, the likelihood ratio, and that number is '
          + 'the honest measure of how much a piece of evidence is worth. And the prior is a '
          + 'FACTOR, which is the form in which it is hardest to drop by accident: a large '
          + 'ratio applied to long odds is still long odds, because multiplying is not adding. '
          + 'That last point is the arithmetic of the prosecutor\'s fallacy, where a match '
          + 'probability of one in ten thousand is reported as the probability of innocence '
          + 'while the prior odds against any particular person being the one are twenty '
          + 'thousand to one.',
        position: 3,
        workedExample: {
          problem:
            'Redo the screening answer in odds form: prior odds 1:99, and a test positive for '
            + '9 in 10 with the condition and 1 in 20 without. Then take a trace that matches '
            + 'whoever left it and also matches 1 person in 10,000 by chance, where exactly one '
            + 'of 20,001 equally suspected people left it, and find the probability that a '
            + 'matching person is innocent.',
          subgoals: [
            {
              label: 'Divide the theorem by itself to make the awkward denominator cancel',
              detail:
                'P(A|B) = P(B|A)P(A)/P(B) and P(not A|B) = P(B|not A)P(not A)/P(B). Divide the '
                + 'first by the second and the P(B) — the one quantity in the point above that '
                + 'took real work to build — is in both and cancels. What is left has no sum '
                + 'over cases in it at all: posterior odds = prior odds x '
                + 'P(B|A)/P(B|not A). Nothing has been assumed to get there; it is the same '
                + 'theorem stated about two complementary cases and the ratio taken.',
              socratic:
                'Write the theorem once for the condition and once for its complement. Which '
                + 'quantity is the denominator of both, and what happens to it if you divide '
                + 'one statement by the other?',
            },
            {
              label: 'Compute the likelihood ratio, which is all the evidence contributes',
              detail:
                'P(positive given condition) / P(positive given no condition) = '
                + '(9/10)/(1/20) = (9/10) x 20 = 18. A positive result is 18 times as likely '
                + 'to come from somebody with the condition as from somebody without. That '
                + 'single number is the whole evidential content of the test — neither rate '
                + 'matters on its own, only their ratio — and it is worth noticing that it is '
                + 'bigger than 1, which no probability in this subject has been. An odds '
                + 'ratio is not a probability and does not live in [0, 1].',
              socratic:
                'The test is positive for 9 in 10 who have the condition and 1 in 20 who do '
                + 'not. How many times more likely is a positive result from the first group '
                + 'than from the second, and what does it tell you about this quantity that '
                + 'the answer came out bigger than 1?',
            },
            {
              label: 'Multiply the prior odds by it, then convert the odds back to a probability',
              detail:
                'A base rate of 1 in 100 is prior odds of 1:99. Multiply the first term by 18: '
                + 'posterior odds are 18:99. Odds of a:b mean a probability of a/(a+b), so the '
                + 'answer is 18/(18+99) = 18/117 = 2/13 — the same number the first point '
                + 'reached, by a route that never computed P(positive). The agreement is a '
                + 'check rather than a repetition: if it had failed, the likelihood ratio or '
                + 'the prior odds would be wrong, and both are easier to get wrong than the '
                + 'division they replace.',
              socratic:
                'A base rate of 1 in 100 is odds of 1 to 99. What are the odds after '
                + 'multiplying by 18, what probability do those odds correspond to, and where '
                + 'in this route did the probability of a positive result go?',
            },
            {
              label: 'Read off why a big factor on long odds is still long odds',
              detail:
                '18 is a large multiplier and the answer is still about 0.154, because 1:99 is '
                + 'a long way from even and multiplying one side by 18 does not get it there. '
                + 'Written in odds, the reason is arithmetic rather than rhetorical: 18 against '
                + '99 is still less than 1:5. This is the form in which the base rate is '
                + 'hardest to drop, because it is a factor sitting in plain sight rather than '
                + 'a term buried in a denominator — which is the practical argument for using '
                + 'this form when the answer is going to be reported to somebody.',
              socratic:
                'Eighteen is a big multiplier and the answer is still about 0.154. Looking at '
                + 'the odds 18:99 rather than at the probability, what is it about the starting '
                + 'odds that the multiplication could not overcome?',
            },
            {
              label: 'Run the case where the prior odds ARE the argument',
              detail:
                'A trace matches whoever left it, and matches 1 person in 10,000 by chance, so '
                + 'the likelihood ratio is 1 / (1/10,000) = 10,000. Exactly one of 20,001 '
                + 'equally suspected people left it, so before the match the odds that any '
                + 'particular one of them is that person are 1:20,000. Posterior odds are '
                + '10,000:20,000, which is 1:2 — so P(guilty given a match) = 1/3 and '
                + 'P(innocent given a match) = 2/3. The same thing by counting: the one guilty '
                + 'person matches, and about 20,000 x 1/10,000 = 2 of the innocents match, so a '
                + 'match picks out about three people of whom one is guilty.',
              socratic:
                'The trace matches whoever left it and 1 person in 10,000 otherwise, and one '
                + 'of 20,001 equally suspected people left it. What is the likelihood ratio, '
                + 'what are the prior odds, and so what are the odds that a person who matches '
                + 'is the one who left it?',
            },
            {
              label: 'Name the two numbers that get swapped, and how far apart they are',
              detail:
                'P(match given innocence) = 1/10,000 and P(innocence given a match) = 2/3. '
                + 'Both come out of the same data, they differ by a factor of more than six '
                + 'thousand, and the second is the one a verdict turns on while the first is '
                + 'the one that gets quoted. That is the confusion `conditional-probability` '
                + 'declares against this concept as the most consequential in the subject, and '
                + 'it is the same swap the first point made with 9/10 against 2/13 — a '
                + 'screening test and a courtroom running one error. Nothing here says the '
                + 'match is uninformative: a likelihood ratio of 10,000 is enormous, and it is '
                + 'the prior odds of 1:20,000 that leave the answer where it is.',
              socratic:
                'You have 1/10,000 for one conditional and 2/3 for the other, from the same '
                + 'data. Which of the two is the probability of innocence, roughly how far '
                + 'apart are they, and does the gap mean the match told you nothing?',
            },
          ],
          answer:
            'In odds form, posterior odds = prior odds x P(B|A)/P(B|not A), the P(B) having '
            + 'cancelled between the theorem for A and the theorem for not-A. The likelihood '
            + 'ratio is (9/10)/(1/20) = 18, the prior odds are 1:99, so the posterior odds are '
            + '18:99 and the probability is 18/(18+99) = 18/117 = 2/13 — the first point\'s '
            + 'answer with no total probability computed. The multiplier is large and the '
            + 'answer small because 18 against 99 is still under 1:5. For the trace: the '
            + 'likelihood ratio is 10,000, the prior odds 1:20,000, so the posterior odds are '
            + '10,000:20,000 = 1:2, P(guilty given a match) = 1/3 and P(innocent given a '
            + 'match) = 2/3 — checked by counting, since one guilty person and about two '
            + 'matching innocents make three. P(match given innocence) = 1/10,000 and '
            + 'P(innocence given a match) = 2/3 are the two numbers the fallacy exchanges, and '
            + 'they differ by more than six thousandfold.',
        },
      },
    ],
  },
  {
    id: 'random-variables',
    name: 'Random variables',
    subjectId: subject.id,
    scope: {
      id: 'random-variables',
      label: 'Random variables',
      hint: 'random variable discrete continuous distribution pmf pdf',
      /*
       * The map node's pattern and its `terms` as the hint, carried across
       * unchanged, as every promotion since the fourth has done. The header
       * records what it costs: the trailing `\b` sits between `variable` and any
       * `s`, so every plural title in the area is unreachable, and
       * "Continuous random variable" is reached where this concept is discrete
       * throughout. Both are asserted by name in tests/concepts-logic.mjs, and
       * neither is repaired here — widening in the same change that adds
       * material would move recognition and the written-concept count at once.
       */
      match: /\brandom variable\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-probability-off-a-preimage-rather-than-off-the-list-of-values',
        statement:
          'Produce the probability that a stated rule takes a stated value, and so establish '
          + 'that the value names a SET of outcomes rather than a number, and that the set is '
          + 'what the probability belongs to. Produce the gap between the answer reached in the '
          + 'space of outcomes and the answer reached in the space of values, and so settle '
          + 'which of the two the first concept left open — the one whose outcomes have '
          + 'preimages of different sizes was never equally likely. Produce the probability of '
          + 'a value of a DIFFERENT rule over the same outcomes, and so establish that the rule '
          + 'is a choice made on top of the space rather than something the experiment handed '
          + 'you.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'build-the-whole-distribution-and-check-it-against-one',
        statement:
          'Produce the total of every entry in the table, and so decide from the rule being a '
          + 'FUNCTION — one value per outcome — that the entries must come to exactly 1, and '
          + 'that any other total means an outcome was counted twice or missed. Produce the '
          + 'probability of two values together with no correction term, and so establish that '
          + 'different values of one rule can never share an outcome where two events in '
          + 'general can. Produce the ratio of the largest entry to the smallest, and so '
          + 'establish how far the values are from equally likely and what the four-outcome '
          + 'space had thrown away.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'rebuild-a-distribution-under-a-new-rule-and-know-which-rebuild-needs-a-division',
        statement:
          'Produce an entry of the table of a rule built FROM the first rule, and so establish '
          + 'that a function of a random variable is a random variable and that the entries it '
          + 'merges are ADDED, because the outcomes behind different values are disjoint. '
          + 'Produce the same entry by adding the outcome counts and dividing once instead, and '
          + 'so establish that the two routes agree and that no counting was needed. Produce an '
          + 'entry of the table once an outcome has been RULED OUT instead of merged, and so '
          + 'establish that this rebuild needs a division where merging needed none, because '
          + 'the surviving entries no longer total 1 on their own.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-value-of-the-variable-names-a-set-of-outcomes-so-its-probability-is-that-set-over-the-space',
        conceptId: 'random-variables',
        statement:
          'A random variable is not a number and not an outcome. It is a RULE that attaches one '
          + 'number to each outcome of a sample space — the heads-count over three coin tosses '
          + 'sends HHH to 3, HHT to 2, TTT to 0, and so on for all eight sequences. So the three '
          + 'characters "X = 2" look like a statement about a number and are really the name of a '
          + 'SET: the sequences the rule sends to 2, which is its PREIMAGE. That matters because '
          + '`sample-spaces` established that a probability is only ever assigned to a subset of '
          + 'the space, so the first move on meeting a value is to read the rule backwards and '
          + 'collect the outcomes, and only then divide. Dividing happens where the outcomes were '
          + 'the ones assumed equally likely, which is the eight sequences — and that is what '
          + 'settles the question the first concept deliberately left open. It found 3/8 for '
          + '"exactly two heads" in the eight-sequence space and 1/4 in the space that records '
          + 'only the heads count, said the two cannot both be right, and said the wrong one is '
          + 'the one whose outcomes were never equally likely. The four-outcome space\'s outcomes '
          + 'ARE the values of X, and their preimages have sizes 1, 3, 3 and 1, so four unequal '
          + 'groups were being treated as four equal ones: 3/8 is right and 1/4 was never '
          + 'licensed. Finally the rule is a CHOICE, exactly as the space was. The same eight '
          + 'sequences carry other variables — the toss on which the first head appears, the '
          + 'number of changes of side — and each gives a different table.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason all four concepts below give
         * about their own arithmetic: 3/8 would time beautifully and the skill
         * is knowing that the 3 is a count of sequences and the 8 is the space
         * they came from. A speed reward trains the division a learner already
         * has, and would reward whoever divides by 4 fastest.
         */
        workedExample: {
          problem:
            'A fair coin is tossed three times and all eight sequences are equally likely. Let X '
            + 'be the number of heads. Find P(X = 2) and say what "X = 2" actually names. Then '
            + 'settle the disagreement `sample-spaces` left open: that concept got 3/8 for '
            + 'exactly two heads in the eight-sequence space and 1/4 in the space that records '
            + 'only the heads count, and said the wrong answer is the one whose outcomes were '
            + 'never equally likely — say which, and by how much they differ. Then let T be the '
            + 'number of the toss on which the first head appears, and find P(T = 1).',
          subgoals: [
            {
              label: 'Write the rule out, which is bookkeeping about a function and not yet a probability',
              detail:
                'X attaches a number to each of the eight sequences: HHH goes to 3, HHT to 2, '
                + 'HTH to 2, HTT to 1, THH to 2, THT to 1, TTH to 1, TTT to 0. That is the whole '
                + 'of what X is, and nothing about likelihood has been used to write it — the '
                + 'table would be identical for a biased coin. Doing this first is what keeps '
                + 'the rule and the probabilities apart, and they are the two things most easily '
                + 'run together here.',
              socratic:
                'X is written as though it were a number, but what you were handed was a coin. '
                + 'What does X do to each of the eight sequences, and does writing that down '
                + 'need to know anything about how likely they are?',
            },
            {
              label: 'Turn the numeric condition back into a set of outcomes',
              detail:
                '"X = 2" is a condition on a number, and `sample-spaces` is clear that a '
                + 'probability belongs to an EVENT, which is a subset of the sample space. So '
                + 'read the table backwards: the sequences X sends to 2 are HHT, HTH and THH. '
                + 'That three-element set is the event, and it is what "X = 2" is the name of. '
                + 'Collecting it is the move this concept adds — in the three concepts between '
                + 'this one and the first, the event always arrived already described in words '
                + 'and the work was counting it.',
              socratic:
                'A probability can only be assigned to a subset of the sample space. Which of '
                + 'the eight sequences does X send to 2, and so which event is "X = 2" a name '
                + 'for?',
            },
            {
              label: 'Divide in the space whose outcomes were assumed equally likely',
              detail:
                'The hypothesis is about the eight sequences, so `sample-spaces`\' second point '
                + 'applies to them and to nothing else: three of eight equally likely outcomes '
                + 'gives P(X = 2) = 3/8. Nothing new has been used. The denominator is worth '
                + 'writing as 2 x 2 x 2 rather than as 8, because 8 is also what you would get '
                + 'by a wrong route and the product says which space is in use.',
              socratic:
                'You have three sequences in the event. Which space\'s outcomes were the ones '
                + 'you were told are equally likely, and so what does the 3 get divided by?',
            },
            {
              label: 'Settle which of the two spaces was wrong, now that the preimages are visible',
              detail:
                'The four-outcome space\'s outcomes are the values 0, 1, 2 and 3 of X. The table '
                + 'in the first subgoal says how many sequences sit behind each: 1, 3, 3 and 1. '
                + 'Four groups of unequal size cannot be four equally likely outcomes, so '
                + 'dividing by 4 was never licensed and 1/4 is the wrong answer. 3/8 is right, '
                + 'and the gap is 3/8 - 1/4 = 3/8 - 2/8 = 1/8. Notice what has happened: the '
                + 'first concept could state the disagreement and not settle it, because '
                + 'settling it needs the four preimage sizes, and four probabilities attached to '
                + 'the values of a rule is the object this concept is about.',
              socratic:
                'The four-outcome space has the values 0, 1, 2 and 3 as its outcomes. How many '
                + 'sequences sit behind each of them, and what does that do to the assumption '
                + 'that the four are equally likely?',
            },
            {
              label: 'Change the rule and watch the same space carry a different variable',
              detail:
                'T is the number of the toss the first head appears on. First a decision has to '
                + 'be made about TTT, which has no head: T has to be given a value there — 0 is '
                + 'the usual choice — or T is not a function on this space at all, and '
                + '`function-concept` is exactly the requirement that a function assign a value '
                + 'to every member of its domain. With that settled, T = 1 is the sequences '
                + 'beginning with H. Fixing the first toss to heads leaves the other two free, '
                + 'so there are 2 x 2 = 4 of them out of 2 x 2 x 2 = 8, and P(T = 1) = 1/2. The '
                + 'space has not changed by one outcome; only the rule has.',
              socratic:
                'Keep the same eight sequences and record instead which toss the first head came '
                + 'up on. What has to be decided about TTT before that is even a rule, and which '
                + 'sequences does the rule send to 1?',
            },
            {
              label: 'Say what the two variables together establish about the space',
              detail:
                'One space, two rules, two different tables. So a random variable is a choice '
                + 'made on top of the space in the same way the space was a choice made about '
                + 'the experiment, and `sample-spaces`\' four-outcome space was never a rival '
                + 'space so much as the table of ONE variable with the information about which '
                + 'toss was which already thrown away. That is the sense in which recording '
                + 'only the heads count "loses information": HHT and HTH are two sequences the '
                + 'four-outcome space cannot tell apart.',
              socratic:
                'Two rules, eight sequences, two different tables. Which of those three things '
                + 'did the experiment hand you and which did you choose — and which sequences '
                + 'can the heads-count no longer tell apart?',
            },
          ],
          answer:
            'P(X = 2) = 3/8. "X = 2" names the three sequences HHT, HTH and THH — the preimage — '
            + 'and that set, not the number 2, is what the probability belongs to; the 3 is '
            + 'divided by 2 x 2 x 2 = 8 because the eight sequences are the outcomes assumed '
            + 'equally likely. The four-outcome space\'s 1/4 is the wrong answer: its outcomes '
            + 'are the values 0, 1, 2, 3, the preimages behind them have sizes 1, 3, 3 and 1, '
            + 'and four groups of unequal size cannot be four equally likely outcomes, so '
            + 'dividing by 4 was never licensed. The two answers differ by 3/8 - 1/4 = 1/8. '
            + 'P(T = 1) = 1/2: fixing the first toss to heads leaves the other two free, so four '
            + 'of the eight sequences — and T needs a value at TTT, 0 by convention, or it is '
            + 'not a function on this space. One space, two rules, two tables, and the '
            + 'heads-count is the one that can no longer tell HHT from HTH.',
        },
      },
      {
        id: 'the-values-partition-the-space-so-the-table-adds-to-one-and-they-are-not-equally-likely',
        conceptId: 'random-variables',
        statement:
          'The object worth having is not one probability but the whole TABLE: every value the '
          + 'rule takes, with the probability of each. Take the preimage of each value and divide '
          + 'by the size of the space, and for the heads-count over three tosses that is 1/8, '
          + '3/8, 3/8, 1/8 at 0, 1, 2 and 3. The four add to exactly 1, and that is forced rather '
          + 'than lucky: X is a FUNCTION, so it sends each sequence to exactly one value, which '
          + 'means the preimages have no sequence in common and leave none out — they PARTITION '
          + 'the space. `sample-spaces` licenses adding probabilities across events with nothing '
          + 'in common and puts the whole space at 1, so the total has to be 1. That makes the '
          + 'check worth doing every time, because the only thing it can catch is the only thing '
          + 'likely to go wrong: a sequence counted twice or missed. Two consequences follow. '
          + 'Entries ADD with no correction term — P(X = 1 or X = 2) = 3/8 + 3/8 = 3/4, where the '
          + 'first concept\'s third point had to subtract an overlap, because two values of X can '
          + 'never share a sequence. And the entries are visibly unequal: (3/8)/(1/8) = 3, so a '
          + 'middle value is three times as likely as an end one. That 3 is a ratio of two '
          + 'probabilities and so is not itself a probability, and it is the exact size of the '
          + 'error the four-outcome space was making.',
        position: 2,
        workedExample: {
          problem:
            'Same three tosses, same X = number of heads. Write down the whole distribution of X '
            + '— every value it takes with the probability of each — and check it. Then find '
            + 'P(X = 1 or X = 2) without looking for an overlap to subtract, and say how many '
            + 'times more likely the most likely value is than the least.',
          subgoals: [
            {
              label: 'Take the preimage of every value, not just the one you were asked about',
              detail:
                'Reading the rule backwards at each value: 0 comes from TTT alone; 1 from HTT, '
                + 'THT and TTH; 2 from HHT, HTH and THH; 3 from HHH alone. Four preimages, of '
                + 'sizes 1, 3, 3 and 1. Those four numbers add to 8, which is already a check '
                + 'and is the same check `sample-spaces` made on its counts before any division '
                + 'happened.',
              socratic:
                'You found one preimage in the point below. What do you get doing it at every '
                + 'value X takes, and what do the four sizes add to?',
            },
            {
              label: 'Divide each preimage by the size of the space, which gives the distribution',
              detail:
                'Eight equally likely sequences, so each preimage\'s probability is its size '
                + 'over 8: P(X = 0) = 1/8, P(X = 1) = 3/8, P(X = 2) = 3/8, P(X = 3) = 1/8. The '
                + 'four of them TOGETHER are the distribution of X, and that is the shift this '
                + 'point makes: the three concepts below each produce one number per question, '
                + 'and the object here is the complete table.',
              socratic:
                'Four preimages of sizes 1, 3, 3 and 1 in a space of eight equally likely '
                + 'sequences. What are the four probabilities, and what is the name for all four '
                + 'of them together rather than for any one?',
            },
            {
              label: 'Check the total, and know why the check is a theorem rather than good luck',
              detail:
                '1/8 + 3/8 + 3/8 + 1/8 = 8/8 = 1. It could not have come out otherwise. X is a '
                + 'function, so every sequence has exactly one value of X — not none, which '
                + 'would leave a sequence out of every preimage, and not two, which would put it '
                + 'in two. So the four preimages partition the eight sequences, '
                + '`sample-spaces` lets probabilities of events with nothing in common be added, '
                + 'and the whole space has probability 1. A total of 9/8 would therefore not '
                + 'mean the table was slightly off: it would mean a sequence had been put in two '
                + 'preimages, and 7/8 would mean one had been left out of all of them.',
              socratic:
                'The four probabilities add to exactly 1. Which property of X guarantees that in '
                + 'advance, and what would a total of 9/8 have told you about your four '
                + 'preimages?',
            },
            {
              label: 'Add two entries with no correction term, because a partition cannot overlap',
              detail:
                'P(X = 1 or X = 2) = 3/8 + 3/8 = 6/8 = 3/4. `sample-spaces`\' third point says '
                + 'two events in general need P(A) + P(B) - P(A and B), and the correction is '
                + 'forced rather than conventional. Here it is not computed and found to be '
                + 'zero — there is nothing to compute. "Exactly one head AND exactly two heads" '
                + 'is a condition no sequence can meet, because X gives each sequence one '
                + 'number, so the event is empty and the whole third term is absent. That is the '
                + 'partition paying for itself.',
              socratic:
                'Two events generally need P(A) + P(B) - P(A and B). What is the probability '
                + 'that a sequence has exactly one head AND exactly two heads, and so what '
                + 'becomes of the correction term?',
            },
            {
              label: 'Measure how far from equally likely the values are, which is what the small space got wrong',
              detail:
                '(3/8)/(1/8) = 3. A middle value is three times as likely as an end one. That '
                + 'number is the reason the four-outcome space cannot be divided in: equally '
                + 'likely would mean 1/4 four times, and the table says 1/8, 3/8, 3/8, 1/8. '
                + 'Note what 3 is and is not — it is a ratio of two probabilities, so it is not '
                + 'itself an answer to "how likely", and it can exceed 1 where no entry in the '
                + 'table ever can.',
              socratic:
                'Compare the probability of two heads with the probability of three heads. How '
                + 'many times larger is it, and what does that number say about treating the '
                + 'four values as equally likely?',
            },
            {
              label: 'Say what the table records and what it has given up',
              detail:
                'The table answers every question about the NUMBER of heads and no question '
                + 'about which toss was which. HHT and HTH are different sequences with the same '
                + 'value of X, so the table holds the 3/8 they belong to and cannot separate '
                + 'them. That is the information loss `sample-spaces` named when it compared the '
                + 'two spaces, now with the price attached: four numbers instead of eight, and '
                + 'the ordering gone.',
              socratic:
                'HHT and HTH are different sequences with the same heads-count. What can the '
                + 'table tell you about each of them, and what has it given up in exchange for '
                + 'being four numbers instead of eight?',
            },
          ],
          answer:
            'The distribution of X is P(X = 0) = 1/8, P(X = 1) = 3/8, P(X = 2) = 3/8, '
            + 'P(X = 3) = 1/8, from preimages of sizes 1, 3, 3 and 1 over eight equally likely '
            + 'sequences. The four add to 8/8 = 1, and that is forced: X is a function, so each '
            + 'sequence has exactly one value, the four preimages therefore partition the space, '
            + 'and `sample-spaces` puts the whole space at 1 — a total of 9/8 would have meant a '
            + 'sequence in two preimages and 7/8 one in none. P(X = 1 or X = 2) = 3/8 + 3/8 = '
            + '3/4 with no correction term, because no sequence has both one head and two, so '
            + 'the overlap event is empty rather than merely small. The middle values are three '
            + 'times as likely as the ends, (3/8)/(1/8) = 3, which is exactly why the '
            + 'four-outcome space cannot be divided in as though its outcomes were equally '
            + 'likely — and that 3 is a ratio of probabilities, not a probability. The price of '
            + 'four numbers instead of eight is that HHT and HTH are no longer distinguishable.',
        },
      },
      {
        id: 'a-new-rule-over-the-same-outcomes-merges-values-and-the-probabilities-of-what-it-merges-add',
        conceptId: 'random-variables',
        statement:
          'Apply a second rule to the number the first one produced and you have another random '
          + 'variable on the same outcomes — a function of a random variable is a random '
          + 'variable. Its table is got by MERGING: if two values of X are sent to the same new '
          + 'value, that new value\'s preimage is the union of their two preimages, those two '
          + 'have nothing in common, so their probabilities ADD. For the margin Y = |heads - '
          + 'tails| over three tosses, tails is 3 - X so Y = |2X - 3|, which is 3, 1, 1, 3 as X '
          + 'runs 0 to 3; Y takes two values where X took four, and P(Y = 1) = 3/8 + 3/8 = 3/4 '
          + 'while P(Y = 3) = 1/8 + 1/8 = 1/4. Two things are worth noticing. The arithmetic is '
          + 'on probabilities already in hand — nothing is counted and the eight sequences are '
          + 'never revisited, which is what having the table bought. And the total survives for '
          + 'free: a coarser partition is still a partition, so merging can never break it. '
          + 'CONDITIONING rebuilds a table the other way and the difference is the point. Given '
          + 'at least one head, seven of the eight sequences remain, and '
          + '`conditional-probability` divides each surviving entry by the probability of the '
          + 'condition: (3/8)/(7/8) = 3/7, 3/7 and 1/7. Those add to 1 only BECAUSE of the '
          + 'division — their numerators add to 7/8. So both operations rebuild a distribution, '
          + 'and whether a division is needed turns on one thing: merging keeps every outcome, '
          + 'conditioning throws some away.',
        position: 3,
        workedExample: {
          problem:
            'Same three tosses, same X = number of heads, and its table 1/8, 3/8, 3/8, 1/8. Let '
            + 'Y be the margin, |heads - tails|. Find the whole distribution of Y, check its '
            + 'total, and find P(Y = 3) a second time by going back to the sequences. Then find '
            + 'the distribution of X given that at least one head came up, and say which of the '
            + 'two rebuilds needed a division and why.',
          subgoals: [
            {
              label: 'Compose the new rule with the old one instead of going back to the sequences',
              detail:
                'Y is defined from the two counts, and there were three tosses, so tails = '
                + '3 - X and Y = |X - (3 - X)| = |2X - 3|. Now Y can be evaluated at the four '
                + 'values of X rather than at the eight sequences: X = 0 gives |-3| = 3, X = 1 '
                + 'gives |-1| = 1, X = 2 gives |1| = 1, X = 3 gives |3| = 3. Y is a rule applied '
                + 'to the output of a rule, so it is a rule on the eight sequences too — which '
                + 'is the claim that a function of a random variable is a random variable.',
              socratic:
                'There were three tosses, so tails is 3 - heads. Write Y in terms of X alone, '
                + 'and then what are its values as X runs 0, 1, 2, 3?',
            },
            {
              label: 'Notice the new rule is not one-to-one, which is the whole of what makes this different',
              detail:
                'X = 1 and X = 2 both give Y = 1; X = 0 and X = 3 both give Y = 3. So Y takes '
                + 'two values where X took four, and each value of Y has TWO values of X behind '
                + 'it. Reading that down to the sequences: the preimage of a value of Y is the '
                + 'union of the preimages of the values of X it merged. If the new rule had been '
                + 'one-to-one — the margin with its sign, say, or 2X - 3 without the bars — '
                + 'nothing would happen but a relabelling of the same four entries, and there '
                + 'would be no arithmetic to do.',
              socratic:
                'Y takes two values where X took four. Which values of X does Y send to 1, and '
                + 'so how many of the eight sequences sit behind "Y = 1"?',
            },
            {
              label: 'Add the probabilities of what the rule merged, which the disjointness licenses',
              detail:
                'P(Y = 1) = P(X = 1) + P(X = 2) = 3/8 + 3/8 = 3/4, and P(Y = 3) = P(X = 0) + '
                + 'P(X = 3) = 1/8 + 1/8 = 1/4. The addition is licensed by the point below: '
                + 'different values of X have preimages with nothing in common, so '
                + '`sample-spaces`\' additivity applies with no correction. And note the route — '
                + 'two numbers were taken off the table and added. No sequence was looked at, '
                + 'nothing was counted, and that is what having built the table bought.',
              socratic:
                'You already have X\'s four probabilities. What makes it legal to add two of '
                + 'them with no correction, and what are P(Y = 1) and P(Y = 3)?',
            },
            {
              label: 'Check the total, see that it had to hold, and get one entry a second way',
              detail:
                '3/4 + 1/4 = 1. Merging can never break the total: every sequence still goes to '
                + 'exactly one value of Y, so the preimages of Y are a coarser partition of the '
                + 'same eight sequences and a coarser partition is still a partition. The second '
                + 'route confirms it from below — Y = 3 is TTT and HHH, two sequences of eight, '
                + 'so 2/8 = 1/4. That is adding the counts and dividing once, where the subgoal '
                + 'above divided twice and added; the two agree because dividing a sum by 8 and '
                + 'summing the quotients are the same thing.',
              socratic:
                'The two probabilities add to 1 again. Does merging values ever need a '
                + 'correction to keep the total at 1 — and what do you get for Y = 3 by going '
                + 'back and counting the sequences instead?',
            },
            {
              label: 'Rebuild the table the other way, by ruling outcomes out instead of merging them',
              detail:
                '"At least one head" is X at least 1, which is every sequence but TTT: seven of '
                + 'the eight, and its probability is 1 - 1/8 = 7/8 by `sample-spaces`\' '
                + 'complement rule. `conditional-probability` then replaces the space with that '
                + 'event, so each surviving entry is divided by 7/8: P(X = 1 | X at least 1) = '
                + '(3/8)/(7/8) = 3/7, P(X = 2 | X at least 1) = 3/7, and '
                + 'P(X = 3 | X at least 1) = (1/8)/(7/8) = 1/7. X = 0 is gone from the table '
                + 'rather than set to 0 — it is not a value the conditioned variable takes.',
              socratic:
                '"At least one head" is seven of the eight sequences. What does conditioning on '
                + 'it do to the denominator of each entry that survives, and what are the three '
                + 'probabilities?',
            },
            {
              label: 'Say which rebuild needed the division, since both produced a table',
              detail:
                '3/7 + 3/7 + 1/7 = 1, but only because of the division: the three numerators '
                + '3/8, 3/8 and 1/8 add to 7/8, not to 1, and dividing by 7/8 is exactly what '
                + 'puts the total back. Merging needed nothing of the kind because nothing left '
                + 'the space. So the rule is one line: a rebuild that keeps every outcome '
                + 'preserves the total for free, and a rebuild that discards outcomes has to '
                + 'renormalise by the probability of what it kept. Both are legitimate and they '
                + 'answer different questions — Y asks a coarser question about every sequence, '
                + 'and the conditioned X asks the original question about seven of them.',
              socratic:
                'Before dividing, the three surviving entries added to 7/8. What had to happen '
                + 'to make them add to 1 — and why did the merging in the first half of this '
                + 'problem need nothing of the kind?',
            },
          ],
          answer:
            'Tails is 3 - X, so Y = |X - (3 - X)| = |2X - 3|, which is 3, 1, 1, 3 as X runs 0 to '
            + '3: a function of a random variable is a random variable on the same eight '
            + 'sequences. The rule is not one-to-one, which is what makes the arithmetic new — '
            + 'P(Y = 1) = P(X = 1) + P(X = 2) = 3/8 + 3/8 = 3/4 and P(Y = 3) = P(X = 0) + '
            + 'P(X = 3) = 1/8 + 1/8 = 1/4, added rather than counted because different values of '
            + 'X have disjoint preimages. The total survives necessarily, 3/4 + 1/4 = 1, since a '
            + 'coarser partition is still a partition; counting instead gives Y = 3 as TTT and '
            + 'HHH, 2 of 8 = 1/4, the same answer with the division done once. Conditioning '
            + 'rebuilds the table the other way: "at least one head" is 7 of the 8 sequences '
            + 'with probability 1 - 1/8 = 7/8, so P(X = 1 | X at least 1) = (3/8)/(7/8) = 3/7, '
            + 'P(X = 2 | X at least 1) = 3/7 and P(X = 3 | X at least 1) = 1/7, with X = 0 gone '
            + 'from the table rather than set to 0. Those three add to 1 only because of the '
            + 'division — their numerators add to 7/8. Merging keeps the total for free because '
            + 'nothing left the space; conditioning discards TTT and has to renormalise.',
        },
      },
    ],
  },
  {
    id: 'expectation',
    name: 'Expectation',
    subjectId: subject.id,
    scope: {
      id: 'expectation',
      label: 'Expectation',
      hint: 'expectation expected value linearity mean',
      /*
       * The map node's pattern and its `terms` as the hint, carried across
       * unchanged, as every promotion since the fourth has done.
       *
       * IT IS ALIVE AND IT IS NARROW, which is a different shortfall from the
       * two shapes already in this file. The concept below carries a `\b` that
       * reaches a singular title and no plural, and the two below that carry
       * DEAD `\b`-after-`)` alternatives. This one has neither fault and a
       * third: the pattern names the encyclopaedia's title for this concept
       * exactly — "Expected value" is where the article is filed — and so takes
       * it and nothing else. What it cannot reach is every title that says
       * EXPECTATION instead, which is most of the family: "Conditional
       * expectation", "Law of total expectation", "Expectation value". A
       * learner reading any of those is not offered this concept.
       *
       * Not repaired here, for the reason the three below give: widening a
       * pattern in the same change that adds material moves recognition and the
       * written-concept count at once, and the two want separate measurements.
       * The misses are asserted by name in tests/concepts-logic.mjs, since a
       * recall gap is invisible by construction.
       */
      match: /\bexpected value\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'total-value-times-probability-and-know-what-kind-of-number-comes-out',
        statement:
          'Produce the total of value times probability across a whole table, and so establish '
          + 'that the number it yields is in the units of the VARIABLE rather than in chance — it '
          + 'may leave [0, 1], and it need not be a value the variable ever takes. Produce the '
          + 'plain average of the values the variable takes, and so establish that on a symmetric '
          + 'table the two agree and that the agreement is about that table rather than about the '
          + 'method. Produce the weighted total for a SECOND rule whose values are the same four '
          + 'numbers, and so establish that the answer is not a function of the value list at '
          + 'all, because two rules sharing a list have different answers.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'push-the-expectation-through-a-linear-rule-and-find-where-the-licence-stops',
        statement:
          'Produce the expectation of aX + b from E[X] alone with no table rebuilt, and so '
          + 'establish that a constant factor comes outside the sum and a constant term '
          + 'multiplies the total of the probabilities. Produce that same total, and so establish '
          + 'that the step is standing on the table adding to exactly 1 and would be false under '
          + 'any other total. Produce both sides for a rule that is NOT of that form, and so '
          + 'establish that the licence comes from the shape of the rule and nothing else — the '
          + 'illegal route returns a number outside the range of the quantity it claims to be '
          + 'averaging.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'add-expectations-across-two-rules-and-test-what-the-addition-did-not-need',
        statement:
          'Produce the expectation of a SUM of two rules on one space from the two expectations '
          + 'separately, and so establish the one fact in this subject that no table of a single '
          + 'variable can state, because stating it needs two variables side by side. Produce the '
          + 'product test on one pair of their values, and so establish that the addition held '
          + 'while the two were DEPENDENT, so nothing had to be checked before adding. Produce '
          + 'both sides of the multiplicative analogue, and so establish that it is addition '
          + 'specifically that is free, and that the multiplicative version misses by little '
          + 'enough to survive a careless check.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-expectation-weights-each-value-by-its-probability-so-two-rules-sharing-a-value-list-differ',
        conceptId: 'expectation',
        statement:
          'A table of four probabilities answers every question about which value came up and '
          + 'does not answer "so what is X, roughly?". Expectation answers it with one number: '
          + 'multiply each value by its OWN probability and total the lot. For the heads-count '
          + 'over three tosses that is 0(1/8) + 1(3/8) + 2(3/8) + 3(1/8) = 12/8 = 3/2. Three '
          + 'things about that number are worth fixing before any shortcut is reached for. It is '
          + 'NOT a probability — every entry in the table lies in [0, 1] and this is 3/2, measured '
          + 'in heads rather than in chance. It is NOT a value X takes, since X counts whole '
          + 'heads, so "the average number of heads" names no outcome of the experiment and is '
          + 'not meant to. And the WEIGHTS are not decoration, which is the claim this particular '
          + 'example hides: the plain average of the values 0, 1, 2, 3 is also 6/4 = 3/2, so a '
          + 'learner who ignored the table would be right here by a route that is wrong. T, the '
          + 'toss the first head falls on, is the proof. T takes the SAME four values on the same '
          + 'eight sequences, so anything computed from the value list alone must give T the same '
          + '3/2 — and its table is 1/8, 1/2, 1/4, 1/8, giving E[T] = 0 + 4/8 + 4/8 + 3/8 = 11/8. '
          + 'Two rules, one value list, two answers. So the expectation was never a function of '
          + 'the list, and the weights are precisely what the list cannot see.',
        position: 1,
        /*
         * No `automaticityTarget`, for the reason all five concepts below give
         * about their own arithmetic, and with one addition specific to this
         * one. 12/8 would time beautifully and the skill is knowing that the 12
         * came from four products and not from four values added — and a learner
         * racing the clock on this table gets the right answer fastest by
         * averaging 0, 1, 2, 3 and ignoring the probabilities, which is the
         * exact error the point exists to close. A speed reward here would
         * reward the wrong route for arriving first.
         */
        workedExample: {
          problem:
            'A fair coin is tossed three times and all eight sequences are equally likely. X is '
            + 'the number of heads, with the table 1/8, 3/8, 3/8, 1/8 at 0, 1, 2, 3 that '
            + '`random-variables` built. Find E[X], and say what kind of number it is. Then take '
            + 'the plain average of the four values X takes and say why it agrees here. Then let '
            + 'T be the toss on which the first head appears, with T = 0 at TTT; build its table, '
            + 'find E[T], and say what the comparison proves about the plain average.',
          subgoals: [
            {
              label: 'Weight each value by its own probability rather than by one over the count',
              detail:
                'E[X] is the total of value times probability taken over every row of the table: '
                + '0(1/8) + 1(3/8) + 2(3/8) + 3(1/8). `sigma-notation` is the notation it is '
                + 'written in, and its first point is the thing to get right — the index runs '
                + 'over the values with BOTH ends included, so there are four terms and not '
                + 'three. The products are 0, 3/8, 6/8 and 3/8, totalling 12/8 = 3/2. Nothing '
                + 'was counted and no sequence was looked at; the four probabilities were already '
                + 'on the table.',
              socratic:
                'Each value of X arrives with its own probability rather than with a share of '
                + 'one. What gets multiplied by what here, and how many terms does the total '
                + 'have?',
            },
            {
              label: 'Say what kind of number came out, since it is neither kind met so far',
              detail:
                '3/2 is not a probability. Every entry in the table lies in [0, 1]; this is 1.5, '
                + 'and it is measured in heads rather than in chance — the only other number in '
                + 'this subject outside [0, 1] was `random-variables`\' ratio 3, which was a '
                + 'ratio of two probabilities and so in no units at all. Nor is 3/2 a value of '
                + 'X: X counts whole heads and cannot be one and a half of them, so the average '
                + 'names no outcome. That is not a defect to be apologised for. A weighted total '
                + 'of values is in the units of the values, and its whole use is to stand in for '
                + 'a rule that takes four different numbers.',
              socratic:
                'Every entry in the table sits between 0 and 1, and this answer is 3/2. What is '
                + 'it measured in, and is it a value X ever takes?',
            },
            {
              label: 'Average the four values with the table ignored, and notice it agrees',
              detail:
                'The values are 0, 1, 2 and 3, and (0 + 1 + 2 + 3)/4 = 6/4 = 3/2. The same '
                + 'answer, reached without looking at a single probability. That agreement is a '
                + 'property of THIS table and not of expectation: 1/8, 3/8, 3/8, 1/8 is '
                + 'symmetric about the middle, so the pull towards the heavy middle is equal from '
                + 'both sides and cancels. It is said out loud because it is the one coincidence '
                + 'in this concept that can hide the content — and because a learner who meets '
                + 'this table first has every reason to generalise from it.',
              socratic:
                'Ignore the probabilities and average the four values 0, 1, 2 and 3. What comes '
                + 'out, and does arriving at the right answer that way show the probabilities '
                + 'were not needed?',
            },
            {
              label: 'Build the second rule\'s table, which shares the value list and nothing else',
              detail:
                'T is the toss the first head appears on, with T = 0 at TTT — the convention '
                + '`random-variables` had to fix before T was a function on this space at all. '
                + 'Collecting preimages the way that concept\'s second point does: T = 0 is TTT '
                + 'alone, T = 1 is the four sequences beginning with H, T = 2 is THH and THT, and '
                + 'T = 3 is TTH alone. So the table is 1/8, 1/2, 1/4, 1/8 at 0, 1, 2, 3, and '
                + '1/8 + 4/8 + 2/8 + 1/8 = 1 as that point says it must. T takes the SAME four '
                + 'values as X on the same eight sequences.',
              socratic:
                'Which sequences does T send to each of 0, 1, 2 and 3, what are the four '
                + 'probabilities, and do they total what they have to?',
            },
            {
              label: 'Total it the same way and get a different answer out of the same values',
              detail:
                'E[T] = 0(1/8) + 1(1/2) + 2(1/4) + 3(1/8) = 0 + 4/8 + 4/8 + 3/8 = 11/8. Now put '
                + 'the plain average beside it: T\'s values are the same 0, 1, 2, 3, so the plain '
                + 'average is the same 6/4 = 12/8 it was for X. The weighted route gives 12/8 for '
                + 'X and 11/8 for T. The two rules differ by 1/8 and the plain route cannot see '
                + 'the difference, because the difference is not in the values.',
              socratic:
                'T has the same four values as X and a different table. What does the weighted '
                + 'total give for T, and what would the plain average of its values have given?',
            },
            {
              label: 'State what the comparison proved, which is stronger than "use the weights"',
              detail:
                'Two rules on one space, one value list, two expectations. So the expectation is '
                + 'not a function of the values a variable takes — it is a function of the values '
                + 'AND the table, and no amount of care with the list can recover it. That also '
                + 'settles the status of the agreement three subgoals up: it was arithmetic about '
                + 'one symmetric table, not evidence about the method. Which is why the weights '
                + 'get written every time, including where they would cancel.',
              socratic:
                'X and T take the same four numbers and have different expectations. What does '
                + 'that rule out as a way of computing one?',
            },
          ],
          answer:
            'E[X] = 0(1/8) + 1(3/8) + 2(3/8) + 3(1/8) = 12/8 = 3/2. It is not a probability — it '
            + 'is outside [0, 1] and is measured in heads rather than in chance — and not a value '
            + 'X takes, since X counts whole heads, so the average names no outcome of the '
            + 'experiment. The plain average of the values 0, 1, 2, 3 is also 6/4 = 3/2, and that '
            + 'agreement is a fact about this symmetric table rather than about expectation. T '
            + 'has preimages TTT; HHH, HHT, HTH, HTT; THH, THT; TTH, so its table is 1/8, 1/2, '
            + '1/4, 1/8 at 0, 1, 2, 3 — totalling 1 — and E[T] = 0 + 4/8 + 4/8 + 3/8 = 11/8. Same '
            + 'four values, so the plain average is still 12/8, while the weighted totals are '
            + '12/8 and 11/8. The expectation is therefore not a function of the value list, and '
            + 'the weights are exactly what the list cannot see.',
        },
      },
      {
        id: 'a-linear-rule-can-be-pushed-through-the-expectation-and-the-total-of-one-is-what-licenses-it',
        conceptId: 'expectation',
        statement:
          'A rule built from X by multiplying and adding — aX + b — has its expectation without '
          + 'any table being rebuilt: E[aX + b] = aE[X] + b. For 2X + 1 on the heads-count that '
          + 'is 2(3/2) + 1 = 4, and rebuilding the table gives the same 4. The proof is two '
          + 'rearrangements from `sigma-notation`\' third point and one fact from the concept '
          + 'below. The total of (ax + b)P(X = x) SPLITS into the total of axP(X = x) plus the '
          + 'total of bP(X = x); the constant a comes OUTSIDE the first, leaving aE[X]; and the '
          + 'second is b times the total of every probability in the table, which '
          + '`random-variables`\' second point forced to be exactly 1, leaving b. So the shortcut '
          + 'is standing on the partition — had the table totalled 7/8, as a conditioned table '
          + 'does before it is renormalised, the constant would have come out as 7b/8 and the '
          + 'rule would be false. AND THE LICENCE COMES FROM THE SHAPE OF THE RULE AND NOTHING '
          + 'ELSE. Y = |2X - 3| is 2X - 3 with one more operation on the outside, and the '
          + 'shortcut fails loudly: |2E[X] - 3| = |3 - 3| = 0, while E[Y] = 1(3/4) + 3(1/4) = '
          + '3/2. Not merely a different number. Y is 1 or 3 on every one of the eight sequences, '
          + 'so 0 is outside the range of the quantity being averaged, and the fault is visible '
          + 'before E[Y] is computed at all. Pushing a function through an expectation has to be '
          + 'earned, and only a linear one earns it.',
        position: 2,
        workedExample: {
          problem:
            'Same three tosses, same X with the table 1/8, 3/8, 3/8, 1/8, and E[X] = 3/2 from the '
            + 'point below. Let W = 2X + 1. Find E[W] from E[X] alone, then again by building '
            + 'W\'s table, and say which step of the shortcut needs the table to total 1. Then '
            + 'let Y = |2X - 3| be the margin and try the same shortcut on it: compare '
            + '|2E[X] - 3| with E[Y], and say what is wrong with the shortcut\'s answer beyond '
            + 'its being the wrong number.',
          subgoals: [
            {
              label: 'Push the expectation through the linear rule and get a number for nothing',
              detail:
                'E[2X + 1] = 2E[X] + 1 = 2(3/2) + 1 = 3 + 1 = 4. No table was built and no '
                + 'probability was consulted: E[X] was already 3/2 and the rest is arithmetic on '
                + 'one number. That is the whole attraction of the rule, and it is also the '
                + 'reason it is worth proving rather than assuming — a step this cheap gets '
                + 'reused on rules that have not earned it, which is the second half of this '
                + 'problem.',
              socratic:
                'You already have E[X] = 3/2. If a rule of the form aX + b can be pushed '
                + 'through, what is E[2X + 1] — and how many of W\'s own probabilities did you '
                + 'need?',
            },
            {
              label: 'Rebuild the table and check the shortcut against the long way round',
              detail:
                'W = 2X + 1 is one-to-one, so nothing merges: W takes 1, 3, 5, 7 where X took 0, '
                + '1, 2, 3 and carries the same probabilities 1/8, 3/8, 3/8, 1/8. That is the '
                + 'case `random-variables`\' third point named as having no arithmetic in it — a '
                + 'relabelling of four entries. Totalling: E[W] = 1(1/8) + 3(3/8) + 5(3/8) + '
                + '7(1/8) = (1 + 9 + 15 + 7)/8 = 32/8 = 4. The same 4, so the shortcut is a '
                + 'theorem and not a lucky feature of the first route.',
              socratic:
                'W takes 1, 3, 5 and 7, carrying the probabilities X had. What does totalling '
                + 'value times probability give, and does it meet the shortcut\'s answer?',
            },
            {
              label: 'Split the total in two, which is the only move the proof makes',
              detail:
                'E[aX + b] is the total of (ax + b)P(X = x) over the values. '
                + '`sigma-notation`\' third point licenses exactly two rearrangements and both '
                + 'are used here: a sum of two terms splits into two sums, and a constant factor '
                + 'comes outside one. So this becomes a times the total of xP(X = x), plus b '
                + 'times the total of P(X = x). The first of those totals is the definition of '
                + 'E[X] from the point below, so it is already in hand. The second is the one '
                + 'worth stopping at.',
              socratic:
                'The term is (ax + b) times P(X = x). Which two rearrangements does '
                + '`sigma-notation` permit on that, and what is the first of the two sums they '
                + 'leave behind?',
            },
            {
              label: 'Find where the table\'s total of 1 is carrying the proof',
              detail:
                'The second sum is b times the total of P(X = x) over every value — and that '
                + 'total is 1. Not by assumption: `random-variables`\' second point proves it, '
                + 'since the values of a function partition the space. So b times 1 is b, and '
                + 'E[aX + b] = aE[X] + b. The counterfactual is what makes the dependence '
                + 'visible: a conditioned table in that concept\'s third point has three '
                + 'surviving entries totalling 7/8 before renormalising, and on a table like '
                + 'that the constant would emerge as 7b/8 and the shortcut would be wrong. The '
                + 'rule is standing on the partition rather than on the algebra.',
              socratic:
                'The second sum is b multiplied by the total of every probability in the table. '
                + 'What is that total, which concept forces it, and so what does the second sum '
                + 'come to?',
            },
            {
              label: 'Try the same shortcut on a rule that is not of that form',
              detail:
                'Y = |2X - 3| is 2X - 3 with one more operation wrapped round the outside. '
                + 'Pushing through gives |2E[X] - 3| = |2(3/2) - 3| = |0| = 0. The honest route '
                + 'uses Y\'s own table from `random-variables`\' third point, 3/4 at 1 and 1/4 '
                + 'at 3: E[Y] = 1(3/4) + 3(1/4) = 3/4 + 3/4 = 3/2. The two routes give 0 and '
                + '3/2, so one is wrong, and the proof above says which — a modulus sign is '
                + 'neither a constant factor to bring outside nor a sum to split, so not one '
                + 'step of the derivation applies to it.',
              socratic:
                'Y is |2X - 3|. What does pushing E[X] through the rule give, what does Y\'s own '
                + 'table give, and which of the proof\'s two rearrangements does a modulus sign '
                + 'permit?',
            },
            {
              label: 'Say what is wrong with the illegal answer besides its being wrong',
              detail:
                'Y is 1 or 3 on every single sequence and never anything else, so any average of '
                + 'Y has to lie between 1 and 3. The shortcut returned 0 — outside the range of '
                + 'the quantity it claimed to be averaging — which is a sharper fault than being '
                + 'off by 3/2, because it could have been caught without computing E[Y] at all. '
                + 'The reason is visible in the rule: 2X - 3 is negative at X = 0 and X = 1 and '
                + 'positive at X = 2 and X = 3, the modulus folds the negative half up, and '
                + 'pushing the expectation through takes the fold at the AVERAGE rather than at '
                + 'every value — by which point the cancellation the fold was there to prevent '
                + 'has already happened.',
              socratic:
                'Y is 1 or 3 on every one of the eight sequences. What range must any average of '
                + 'Y lie in, and what does that tell you about the shortcut\'s 0 before you '
                + 'compute anything else?',
            },
          ],
          answer:
            'E[W] = E[2X + 1] = 2E[X] + 1 = 2(3/2) + 1 = 4 by the shortcut, and 1(1/8) + 3(3/8) '
            + '+ 5(3/8) + 7(1/8) = 32/8 = 4 from W\'s rebuilt table, so the rule is a theorem '
            + 'rather than a coincidence. The proof splits the total of (ax + b)P(X = x) by '
            + '`sigma-notation`\' third point into a times the total of xP(X = x), which is '
            + 'aE[X], plus b times the total of P(X = x) — and that second total is 1 only '
            + 'because the values of a function partition the space, which is where the whole '
            + 'shortcut is standing; on a conditioned table totalling 7/8 it would have given '
            + '7b/8 and been false. On Y = |2X - 3| the shortcut fails: |2E[X] - 3| = 0 while '
            + 'E[Y] = 1(3/4) + 3(1/4) = 3/2. A modulus is neither a constant factor to bring '
            + 'outside nor a sum to split, so no step of the proof applies — and the fault shows '
            + 'before any arithmetic, since Y is 1 or 3 on every sequence and 0 is outside the '
            + 'range of what is being averaged.',
        },
      },
      {
        id: 'expectation-adds-across-two-rules-on-one-space-whether-or-not-they-are-independent',
        conceptId: 'expectation',
        statement:
          'The fact that makes expectation worth having is about TWO rules at once, so no table '
          + 'of a single variable can state it. Put X, the heads-count, beside T, the toss the '
          + 'first head falls on, and let S = X + T. Then E[S] = E[X] + E[T] = 12/8 + 11/8 = '
          + '23/8, and building S\'s own table gives the same 23/8. The reason is the split from '
          + 'the point below with a second variable where the constant was: totalling X + T over '
          + 'the eight sequences adds the same numbers in a different order, 23 = 12 + 11, and '
          + 'one division by 8 at the end is the same as two divisions and a sum. WHAT IS '
          + 'REMARKABLE IS WHAT IT DOES NOT REQUIRE. X and T are not independent, and '
          + '`conditional-probability`\'s product test settles it in a line: P(X = 0) = 1/8 and '
          + 'P(T = 1) = 1/2 multiply to 1/16, while P(X = 0 and T = 1) is 0, since a sequence '
          + 'with no heads cannot have its first head on the first toss. The addition held '
          + 'anyway. So nothing has to be established before two expectations are added, which is '
          + 'the whole of why this is the useful fact rather than a curiosity — the condition one '
          + 'expects to need is the expensive one to check, and it is not needed. AND IT IS '
          + 'ADDITION SPECIFICALLY. E[XT] = 17/8 while E[X]E[T] = (12/8)(11/8) = 33/16, and 17/8 '
          + 'is 34/16, so the multiplicative version is false here by 1/16. A near miss rather '
          + 'than a blow-up, which is worse: it would survive a careless check.',
        position: 3,
        workedExample: {
          problem:
            'Same eight sequences. X is the heads-count with E[X] = 12/8, and T is the toss the '
            + 'first head falls on with E[T] = 11/8, both from the point two below. Let '
            + 'S = X + T. Find E[S] from the two expectations, then again from S\'s own table, '
            + 'and say which property of addition makes them agree. Then settle whether X and T '
            + 'are independent by the product test on one pair of values, and say what that does '
            + 'to the first answer. Finally compare E[XT] with E[X]E[T].',
          subgoals: [
            {
              label: 'Add the two expectations and commit to the answer before building anything',
              detail:
                'E[X] + E[T] = 12/8 + 11/8 = 23/8. That is the claim, written down first so that '
                + 'what follows is a check rather than the derivation. Notice how little it '
                + 'rests on: it is a prediction about a rule whose table nobody has seen, since '
                + 'S = X + T has not been evaluated on a single sequence yet.',
              socratic:
                'E[X] is 12/8 and E[T] is 11/8. What does adding the expectations predict for '
                + 'E[X + T], and how much of S\'s own table did that prediction use?',
            },
            {
              label: 'Evaluate the sum on every sequence and build the table it has',
              detail:
                'Sequence by sequence, X + T: HHH gives 3 + 1 = 4, HHT 2 + 1 = 3, HTH 2 + 1 = 3, '
                + 'HTT 1 + 1 = 2, THH 2 + 2 = 4, THT 1 + 2 = 3, TTH 1 + 3 = 4, and TTT 0 + 0 = '
                + '0. So S takes 0 once, 2 once, 3 three times and 4 three times — the table is '
                + '1/8, 1/8, 3/8, 3/8, which totals 1. S misses the value 1 entirely, which is '
                + 'worth a glance: S = 1 would need either no heads with a first head on toss '
                + 'one, or one head with no head anywhere.',
              socratic:
                'Work X + T out on each of the eight sequences. Which values does S take, with '
                + 'what probabilities, and is there a value between its smallest and its largest '
                + 'that it never takes?',
            },
            {
              label: 'Total S\'s table and meet the number that was predicted',
              detail:
                'E[S] = 0(1/8) + 2(1/8) + 3(3/8) + 4(3/8) = (0 + 2 + 9 + 12)/8 = 23/8. The '
                + 'prediction holds, and the agreement is not luck. Summing X + T across the '
                + 'eight sequences gives 23, which is the 12 from X plus the 11 from T, because '
                + 'the same sixteen numbers are being added in a different order — and dividing '
                + 'one total by 8 is the same as dividing two totals by 8 and adding, which is '
                + 'the single piece of `fraction-arithmetic` the whole fact needs.',
              socratic:
                'S\'s table is 1/8, 1/8, 3/8, 3/8 at 0, 2, 3, 4. What is the weighted total, and '
                + 'why did the sequence-by-sequence sums have to come out as 12 + 11?',
            },
            {
              label: 'Run the product test, because the obvious condition has not been checked',
              detail:
                'Nothing above asked whether X and T were independent, so ask now. '
                + '`conditional-probability`\'s third point makes independence a product test '
                + 'that has to be COMPUTED rather than judged by how it sounds. P(X = 0) = 1/8, '
                + 'since TTT alone has no heads; P(T = 1) = 1/2, the four sequences beginning '
                + 'with H; and the product is 1/16. But P(X = 0 and T = 1) is 0 — a sequence with '
                + 'no heads cannot have its first head on the first toss, so the event is empty. '
                + '0 is not 1/16, so X and T are dependent.',
              socratic:
                'P(X = 0) is 1/8 and P(T = 1) is 1/2. What is the probability of both at once, '
                + 'and what does the product test then say about X and T?',
            },
            {
              label: 'Say what the dependence did to the addition, which is nothing at all',
              detail:
                'The two expectations still added, and the check above says they had no right to '
                + 'by any rule about independence. So additivity is not a reward for '
                + 'independence and is not licensed by a test: it falls out of reordering a sum, '
                + 'and a sum can be reordered whatever its terms have to do with one another. '
                + 'That is why this is the fact worth having rather than a curiosity. It is also '
                + 'the first claim in this subject about two variables SIDE BY SIDE rather than '
                + 'about one rule or a function of one — Y was built from X — which is exactly '
                + 'why no table above could have stated it.',
              socratic:
                'X and T are dependent and E[X + T] was still E[X] + E[T]. What did the product '
                + 'test turn out to be needed for here, and why can reordering a sum not care '
                + 'about the answer?',
            },
            {
              label: 'Check whether multiplying is free as well, since adding turned out to be',
              detail:
                'XT sequence by sequence is 3, 2, 2, 1, 4, 2, 3, 0, totalling 17, so '
                + 'E[XT] = 17/8. Against that, E[X]E[T] = (12/8)(11/8) = 132/64 = 33/16. Over '
                + 'sixteenths it is 34/16 against 33/16: not equal, and short by exactly 1/16. '
                + 'So the multiplicative version is false, and it fails by so little that a '
                + 'rounded or eyeballed comparison would pass it. That asymmetry is the thing to '
                + 'carry — the product version is the one that needs independence, and the '
                + 'addition is the one that needs nothing.',
              socratic:
                'XT totals 17 over the eight sequences. Put E[XT] beside E[X] times E[T] over a '
                + 'common denominator — do they agree, and if not, by how much do they miss?',
            },
          ],
          answer:
            'E[X] + E[T] = 12/8 + 11/8 = 23/8, predicted before S\'s table existed. S = X + T is '
            + '4, 3, 3, 2, 4, 3, 4, 0 on HHH to TTT, so its table is 1/8 at 0, 1/8 at 2, 3/8 at '
            + '3 and 3/8 at 4 — totalling 1, and missing the value 1 — and E[S] = (0 + 2 + 9 + '
            + '12)/8 = 23/8. The two agree because totalling X + T over the eight sequences adds '
            + 'the same numbers in a different order, 23 = 12 + 11, and one division by 8 is the '
            + 'same as two divisions and a sum. X and T are NOT independent: P(X = 0) = 1/8 and '
            + 'P(T = 1) = 1/2 multiply to 1/16, while P(X = 0 and T = 1) = 0, since a sequence '
            + 'with no heads cannot have its first head on toss one. The addition held regardless, '
            + 'so nothing has to be checked before adding two expectations — which is precisely '
            + 'what makes the fact useful. Multiplying is not free: E[XT] = 17/8 = 34/16 against '
            + 'E[X]E[T] = 33/16, false by 1/16.',
        },
      },
    ],
  },
]

/**
 * Six edges. The forty-seventh promotion added the simplest one in the file and
 * the forty-eighth added three at once, which is the most any promotion here has
 * declared and is the whole of why `bayes-theorem` was the candidate to take: an
 * ordinary prerequisite, a credit edge argued on the merits, and an
 * `interferes_with` that this file is the only place in the build that could
 * hold. The fourth section of the file header argues the selection; the comments
 * on the last three entries argue each edge.
 *
 * THIS ARRAY WAS EMPTY AND THE NOTE EXPLAINING WHY NAMED ITS OWN REPAIR. One
 * concept meant no internal pair, and both of `sample-spaces`' prerequisites are
 * authored in other subjects, so neither of ITS edges may be declared here —
 * `ontologyProblems` reports an unknown endpoint for an edge naming a concept its
 * ontology does not contain. Both still live in `PROBABILITY.links` in
 * atlas-uncertainty.ts, the area that owned the departing node, and both still
 * gate for real because both far ends have material. That has not changed and the
 * group in tests/atlas.mjs that asserts it is unedited.
 *
 * What the note went on to say was that `counting-probability` authored HERE
 * would make `sample-spaces -> counting-probability` the first edge this file
 * could hold, and it filed that as "a measurement rather than a recommendation".
 * The forty-sixth promotion recomputed and took it. So the first edge below is
 * that prediction, and the file-header section argues the host choice it stated
 * only the cheap half of.
 *
 * THE SECOND EDGE IS A CREDIT CLAIM AND IS NOT A SUBSTITUTE FOR THE ONE THIS
 * PROMOTION LOST. `counting-probability => counting-principles` was an
 * `encompasses` in the composed graph, carried by the map node's `exercises`, and
 * authoring the node deleted it with nothing going red; the header argues why the
 * boundary was still worth it. `counting-probability => sample-spaces` is a
 * DIFFERENT claim and holds on its own terms, measured against the tasks rather
 * than by analogy: the second point reads an event off a space and the third
 * takes a complement from 1 and subtracts an overlap once, which is the first
 * concept's second and third points being used rather than mentioned. It credits
 * the probability and not the counting, which is exactly the half that went.
 *
 * THE THIRD EDGE IS THE FORTY-SEVENTH PROMOTION'S AND IT IS THE WHOLE OF WHAT
 * THAT PROMOTION COST. `conditional-probability` declared ONE `need`,
 * `counting-probability`, and that concept is already here — so the edge is an
 * ordinary internal one, NOTHING stranded into `PROBABILITY.links`, and no area
 * had to record anything. No promotion since the forty-second has managed that.
 *
 * AND THAT PROMOTION DECLARED NO CREDIT EDGE, WHICH IS A DECISION AND NOT AN
 * OMISSION. One was available and would have been sayable — both ends are in this
 * ontology — and it is declined on the merits, argued in the file header: the
 * third concept supplies every count it uses and never chooses a counting
 * convention, so `counting-probability`'s first knowledge point is untouched by
 * doing it. The `encompasses` below is a credit for the DIVISION and the third
 * concept earns no such credit for the COUNTING, which is the same distinction
 * that edge was written to make.
 *
 * THE FORTY-EIGHTH ADDED THREE, THE FORTY-NINTH TWO AND THE FIFTIETH TWO, SO
 * THE ARRAY HOLDS TEN, and the counts in the paragraphs above are each about the
 * promotion that wrote them rather than about the array — the fourth concept's
 * three are argued at its own entries below, the fifth's two at theirs and the
 * sixth's two at theirs. The fifth
 * promotion's pair is the one to read if you are wondering why a credit edge
 * here skips the concept that gates it: `random-variables` is a SIBLING of
 * `bayes-theorem` off the third concept, not a step above it, so for the first
 * time in this subject the gate and the material point at different concepts.
 *
 * Both ends of all eight edges are in `CONCEPTS` above, which is the containment
 * rule `ontologyProblems` enforces and the whole reason the array could not hold
 * either of the first concept's own edges.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'sample-spaces->counting-probability',
    from: 'sample-spaces',
    to: 'counting-probability',
    kind: 'prerequisite',
    /*
     * THIS SUBJECT'S FIRST INTERNAL EDGE, and the cheap half of the promotion
     * the note above predicted. The node declared
     * `needs: ['sample-spaces', 'counting-principles']`; the first end is a
     * concept of this subject so the edge is this entry, and the second is a
     * concept of `counting-and-arrangements`, so it had to become the third
     * entry in `PROBABILITY.links`.
     *
     * The claim is load-bearing in all three of the second concept's points,
     * which is worth stating because an edge that only the first point needed
     * would be a weaker gate than this one. Every probability below divides a
     * count of outcomes by the size of a space; the first concept is where that
     * division comes from and what licenses it — an event is a SUBSET, equal
     * likelihood is a property of the SPACE, and P(E) = |E| / |S| is additivity
     * applied k times rather than a definition. A learner who met the counting
     * version first would have the formula with its hypothesis stripped off,
     * which is the one failure the first concept was written to prevent.
     *
     * `author:` rather than `atlas:probability`: `expandEdges` stamped the area
     * on this edge while it was the node's own `needs`, and the provenance moves
     * with the edge when the edge moves into an ontology.
     */
    promotedBy: 'author:chance-and-events',
  },
  {
    id: 'counting-probability=>sample-spaces',
    from: 'counting-probability',
    to: 'sample-spaces',
    kind: 'encompasses',
    /*
     * THE SUBJECT'S FIRST CREDIT EDGE, AND IT EXISTS BECAUSE A DIFFERENT ONE
     * DOES NOT. `counting-probability => counting-principles` was in the composed
     * graph, carried by the map node's `exercises`, and authoring the node
     * deleted it with no suite going red — the stranding atlas.ts warns about for
     * `confusedWith`, arriving through `exercises` instead. The file header
     * argues why the subject boundary was worth that, and the point of this
     * comment is that the edge below is NOT the lost one repaired. It credits the
     * probability; the counting is uncredited and stays that way until `links`
     * carries a kind.
     */
    promotedBy: 'author:chance-and-events',
    rationale:
      'Every task in the second concept names a space, reads an event off it as a subset and '
      + 'divides, and its third point takes a complement from 1 and subtracts an overlap '
      + 'exactly once — the first concept\'s second and third points, used rather than '
      + 'mentioned. So a learner who has just computed 5/11 from 55 + 55 - 10 over 220 has '
      + 'demonstrated the addition rule, and the first concept must not come due as though '
      + 'untouched. It does NOT credit the counting: that claim is the edge this promotion '
      + 'destroyed, and nothing in this build can express it.',
  },
  {
    id: 'counting-probability->conditional-probability',
    from: 'counting-probability',
    to: 'conditional-probability',
    kind: 'prerequisite',
    /*
     * THE SUBJECT'S SECOND INTERNAL PREREQUISITE, AND THE FORTY-SEVENTH
     * PROMOTION'S ONLY STRUCTURAL COST. The node declared
     * `needs: ['counting-probability']` and nothing else, and that concept was
     * already here — so this entry is the whole of the bookkeeping and the
     * area's `links` list did not grow. Read off the node, which is the durable
     * rule: a promotion strands as many edges as the node declares `needs`
     * outside its new subject, and that number was ZERO.
     *
     * The claim is load-bearing in all three of the new concept's points and
     * not just the first, which is the test the edge above this one had to pass
     * as well. Every count the third concept divides — 220, 55, 10, 35, 6, 66 —
     * is produced by the second concept's method, and its first point's
     * comparison of 6/55 against 1/22 is only legible to somebody who knows
     * where the 1/22 came from. Its second point's check, that three
     * conditional factors multiply to the same 1/22 the simultaneous draw gave,
     * is literally the second concept's answer used as an audit. A learner who
     * met conditioning first would be dividing by a restricted space without
     * knowing why dividing by the whole one was licensed, which is the error
     * `sample-spaces` was written to prevent, arriving one layer up.
     *
     * `author:` rather than `atlas:probability`, as above: `expandEdges` stamped
     * the area on this edge while it was the node's own `needs`, and the
     * provenance moves with the edge when the edge moves into an ontology.
     */
    promotedBy: 'author:chance-and-events',
  },
  {
    id: 'conditional-probability->bayes-theorem',
    from: 'conditional-probability',
    to: 'bayes-theorem',
    kind: 'prerequisite',
    /*
     * THE SUBJECT'S THIRD INTERNAL PREREQUISITE, AND THE SECOND ZERO-STRANDED
     * PROMOTION RUNNING. `bayes-theorem` declared
     * `needs: ['conditional-probability']` and nothing else, and that concept
     * was already here — so this entry is the whole of the prerequisite
     * bookkeeping and `PROBABILITY.links` did not grow for a second consecutive
     * promotion. Read off the node, which is the durable rule.
     *
     * The claim is load-bearing in all three of the new concept's points. The
     * first builds an overlap with the multiplication rule and then divides by
     * the probability of the condition, which is the third concept's first point
     * in its second form; the second adds two such products over a partition;
     * the third divides two statements of the definition by each other. A
     * learner who met the reversal first would be rearranging a formula whose
     * terms are all conditional probabilities, with no account of what any of
     * them means.
     *
     * `author:` rather than `atlas:probability`, as with the two prerequisites
     * above: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moves with the edge.
     */
    promotedBy: 'author:chance-and-events',
  },
  {
    id: 'bayes-theorem=>conditional-probability',
    from: 'bayes-theorem',
    to: 'conditional-probability',
    kind: 'encompasses',
    /*
     * THE SUBJECT'S SECOND CREDIT EDGE, AND THE FORTY-SEVENTH PROMOTION'S
     * REFUSAL IS WHY IT NEEDS AN ARGUMENT RATHER THAN A NOD. That promotion
     * could have declared `conditional-probability => counting-probability` and
     * declined it: the third concept supplies every count it uses and never
     * chooses a counting convention, so the concept below's first point was
     * untouched by doing it. The test that refusal implies is whether the
     * higher concept USES the lower one's points or merely rests on them, and
     * this one passes it on two of three.
     *
     * Two of three is also the standard the `counting-probability =>
     * sample-spaces` edge above was held to, and the third point is named here
     * for the same reason it was named there: INDEPENDENCE is not exercised at
     * all. Every situation in this concept is one where conditioning moves the
     * answer — that is what makes a reversal worth doing — so nothing here ever
     * computes P(A) x P(B) and compares it with an overlap. A learner who has
     * done all nine of these tasks has demonstrated the multiplication rule and
     * the definition, and has demonstrated nothing whatever about the product
     * test.
     */
    promotedBy: 'author:chance-and-events',
    rationale:
      'Every task in the fourth concept builds an overlap as a rate times a base rate, which is '
      + 'the third concept\'s SECOND point — the definition multiplied through by its condition '
      + '— used rather than mentioned, and then divides by the probability of the condition, '
      + 'which is its FIRST point in the P(A and B) / P(B) form that point insists on writing. '
      + 'So a learner who has just produced 18/117 from 9/1000 over 117/2000 has exercised both, '
      + 'and neither must come due as though untouched. It does NOT credit the third point: '
      + 'independence is a case where conditioning changes nothing, and nothing in a reversal '
      + 'ever computes P(A) x P(B) to compare with an overlap.',
  },
  {
    id: 'bayes-theorem~conditional-probability',
    from: 'bayes-theorem',
    to: 'conditional-probability',
    kind: 'interferes_with',
    /*
     * THE EDGE THIS PROMOTION WOULD HAVE DESTROYED IN SILENCE, RE-DECLARED.
     *
     * `expandEdges` turns a node's `confusedWith` into an `interferes_with`
     * edge, so deleting the `bayes-theorem` node from atlas-uncertainty.ts
     * deleted this one — and nothing goes red, because interference constrains
     * SELECTION rather than gating, so every suite stays green while the
     * scheduler is freed to introduce the two most confusable concepts in the
     * subject together. atlas.ts warns about exactly this, the forty-sixth
     * promotion lost an `exercises` claim to the same mechanism through
     * `exercises`, and the forty-seventh promotion's own group in tests/atlas.mjs
     * wrote the warning down with this edge named in it.
     *
     * THE REPAIR WAS CHEAP ONLY BECAUSE OF WHERE THE FAR END SITS. Both ends are
     * now concepts of this ontology, so the edge is an ordinary entry here;
     * `ontologyProblems` would have reported an unknown endpoint if
     * `conditional-probability` had been authored anywhere else, and `links`
     * hard-codes `prerequisite` and so could not have carried it either. That
     * is the sense in which promoting this node made an existing edge MORE
     * expressible rather than less, which no other candidate on the map offered.
     *
     * `rationale` is the node's own `because`, carried verbatim, because
     * tests/atlas.mjs requires one on every `interferes_with` and the sentence
     * the node shipped is the argument. Direction is `from` the higher concept,
     * matching what `expandEdges` emitted, though the kind is symmetric and
     * stored once.
     *
     * AND THE EDGE DOES NOT CONTRADICT THE PREREQUISITE ABOVE IT. A prerequisite
     * says the lower concept must be strong before the higher is introduced; the
     * interference says the two must not be introduced TOGETHER. Both held while
     * one end was a node and both hold now, and the pair is exactly the right
     * description: meet conditioning, master it, and only then meet the thing
     * most easily mistaken for it.
     */
    promotedBy: 'author:chance-and-events',
    rationale:
      'P(A|B) and P(B|A) are read as the same quantity, which is the single most consequential '
      + 'confusion in the subject: it is the prosecutor\'s fallacy and the medical-test error, '
      + 'and it is produced by the notation looking symmetric.',
  },
  {
    id: 'conditional-probability->random-variables',
    from: 'conditional-probability',
    to: 'random-variables',
    kind: 'prerequisite',
    /*
     * THE SUBJECT'S FOURTH INTERNAL PREREQUISITE, AND THE FIRST THAT IS NOT THE
     * NEXT LINK IN A CHAIN. `random-variables` and `bayes-theorem` both declared
     * `conditional-probability` and nothing else of this subject, so they are
     * SIBLINGS off the third concept rather than a fourth and fifth step up one
     * line. Read off the node, which is the durable rule, and it is the half of
     * that node's `needs` that could live here at all — `function-concept` is
     * `functions-and-inverses` and became `PROBABILITY.links`' fourth entry.
     *
     * THE CLAIM IS LOAD-BEARING IN EXACTLY ONE PLACE AND THAT IS WORTH STATING
     * PLAINLY RATHER THAN DRESSING UP. The third knowledge point's last two
     * subgoals condition on "at least one head" and divide three surviving
     * entries by 7/8, and the whole teaching of that half is the CONTRAST
     * between a rebuild that keeps every outcome and one that discards some —
     * which cannot be taught to somebody who has not met the replacement of the
     * space. The first two points use no conditioning at all.
     *
     * SO THE HONEST READING IS THAT THE REAL PREREQUISITE IS `sample-spaces` AND
     * THIS EDGE IS THE MAP'S, NOT THIS FILE'S. Every division in the material is
     * by 8 under the first concept's licence, and the argument the fifth concept
     * finishes is the first concept's. The map node declared
     * `conditional-probability` and this promotion honoured it as declared rather
     * than quietly relaxing the gate, because tightening or loosening a gate is a
     * curriculum decision and not a bookkeeping one. The `encompasses` below is
     * where the difference shows: it credits `sample-spaces` and NOT this edge's
     * far end.
     *
     * `author:` rather than `atlas:probability`, as with the three prerequisites
     * above: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moves with the edge.
     */
    promotedBy: 'author:chance-and-events',
  },
  {
    id: 'random-variables=>sample-spaces',
    from: 'random-variables',
    to: 'sample-spaces',
    kind: 'encompasses',
    /*
     * THE SUBJECT'S THIRD CREDIT EDGE, AND THE FIRST IN THE BUILD TO SKIP THE
     * CONCEPT THAT GATES IT.
     *
     * The two above run one step down the chain — `counting-probability =>
     * sample-spaces` and `bayes-theorem => conditional-probability` — and each
     * credits its own prerequisite. This one reaches TWO concepts down and
     * declines the one directly behind it, which is a decision rather than an
     * oversight and is why it needs an argument.
     *
     * WHY `sample-spaces` IS CREDITED: the test is whether the higher concept
     * USES the lower one's points or merely rests on them, and here it uses all
     * three. The first point — an event is a SUBSET of the listed space — is the
     * preimage, which is this concept's opening move and is nothing else. The
     * second — equal likelihood is a property of the SPACE and is what licenses
     * dividing — is used at every division (by 8, never by 4) and is the subject
     * of an entire subgoal that settles which of two spaces may be divided in.
     * The third is used in HALF: the complement rule produces P(X at least 1) =
     * 1 - 1/8 = 7/8 inside the ninth task's denominator, but inclusion-exclusion
     * is deliberately NOT exercised, because two values of one rule can never
     * overlap and the correction term is absent rather than zero. The rationale
     * says so, since "all three" would be an overclaim by a half point.
     *
     * WHY `conditional-probability` IS NOT CREDITED, which is the forty-seventh
     * promotion's refusal applied to a new shape. ONE of nine tasks conditions
     * anything and two of eighteen subgoals do. That concept's three points are
     * the definition with the space replaced, the multiplication rule along a
     * sequence of draws, and independence as a product test — and nothing here
     * multiplies two probabilities along a sequence or computes a product test at
     * all. A learner who has done all nine of these tasks has divided by a
     * complement once and has demonstrated nothing whatever about multiplication
     * along a tree. Crediting it would stop the concept coming due as though
     * untouched when it very nearly was untouched, which is the exact failure the
     * `encompasses` edge exists to prevent in the other direction.
     *
     * AND THE PAIR OF DECISIONS IS THE DURABLE PART: credit follows the material,
     * not the gate. Those two normally coincide because a chain taken in order
     * makes them coincide, and this is the first promotion in the subject where
     * they came apart — which they did because this node is a SIBLING off the
     * third concept rather than a step above the fourth.
     */
    promotedBy: 'author:chance-and-events',
    rationale:
      'The preimage IS the first concept\'s first point — an event is a subset of the listed '
      + 'space, not a sentence about it — used as this concept\'s opening move rather than '
      + 'mentioned. Every division in all nine tasks is by the eight sequences and never by the '
      + 'four values, which is that concept\'s second point, and one subgoal settles the '
      + 'disagreement it left open by showing the four values have preimages of sizes 1, 3, 3 '
      + 'and 1. Its third point is credited in HALF: the complement rule gives '
      + 'P(X at least 1) = 1 - 1/8 = 7/8, which the ninth task divides by, but '
      + 'inclusion-exclusion is NOT exercised — two values of one rule share no outcome, so the '
      + 'correction term is absent rather than computed and found to be zero. It credits the '
      + 'SPACE and not the conditioning: one of nine tasks conditions anything, nothing here '
      + 'multiplies along a sequence of draws or runs a product test, so '
      + '`conditional-probability` must still come due as though untouched.',
  },
  {
    id: 'random-variables->expectation',
    from: 'random-variables',
    to: 'expectation',
    kind: 'prerequisite',
    /*
     * THE SUBJECT'S FIFTH INTERNAL PREREQUISITE, AND THE CHAIN RESUMES. The
     * fourth was the first off the line — `random-variables` and `bayes-theorem`
     * are siblings off the third concept — and this one steps straight up from
     * the fifth, so the array is back in prerequisite order for its last two
     * entries while remaining a writing order overall.
     *
     * IT IS THE HALF OF THE NODE'S `needs` THAT CAN LIVE HERE. The node declared
     * `['random-variables', 'sigma-notation']`; the second is
     * `functions-and-inverses` and became `PROBABILITY.links`' fifth entry, for
     * the same containment reason as the promotion before — an authored ontology
     * may only name concepts it contains.
     *
     * AND THIS GATE IS LOAD-BEARING EVERYWHERE RATHER THAN IN ONE PLACE, which
     * is worth stating because the edge above had to admit the opposite. Every
     * one of the three knowledge points starts from a table this concept's
     * prerequisite builds: the first totals X's and then builds T's by
     * collecting preimages, the second rebuilds one under a relabelling and
     * leans on the forced total of 1 for the whole proof, and the third builds
     * two and then a third. There is no half of this concept that could be
     * taught to somebody who has not met a distribution.
     *
     * `author:` rather than `atlas:probability`, as with the four prerequisites
     * above: `expandEdges` stamped the area on this edge while it was the node's
     * own `needs`, and the provenance moves with the edge.
     */
    promotedBy: 'author:chance-and-events',
  },
  {
    id: 'expectation=>random-variables',
    from: 'expectation',
    to: 'random-variables',
    kind: 'encompasses',
    /*
     * THE SUBJECT'S FOURTH CREDIT EDGE, AND IT GOES BACK TO CREDITING THE
     * CONCEPT DIRECTLY BELOW — which is the ordinary shape here and is worth a
     * sentence only because the edge above it is the exception.
     *
     * The forty-ninth's `random-variables => sample-spaces` reached TWO concepts
     * down and declined the one that gated it, because that node was a sibling
     * and its material used the first concept rather than the fourth. Nothing
     * like that applies here. This concept is a step UP the line from the fifth,
     * and the fifth's three points are what every task does before it does
     * anything of its own.
     *
     * ALL THREE OF ITS POINTS ARE USED, AND THE SECOND IS USED AS A THEOREM
     * RATHER THAN AS A HABIT, which is the part worth the claim. The preimage
     * collection — that concept's first point — is how T's table is built in the
     * first point here. The forced total of 1 — its second — is not merely
     * checked but DERIVED FROM, since the proof of linearity turns on the
     * probabilities totalling exactly 1 and the point here says in so many words
     * that on a table totalling 7/8 the rule would be false. And the
     * relabelling case of its third point is W = 2X + 1, where a one-to-one rule
     * moves four entries and merges none.
     *
     * WHY `sample-spaces` IS NOT ALSO CREDITED, which is the question the edge
     * above makes unavoidable. Every division here is by 8, so the second point
     * of that concept is in use — but it arrives through the table rather than
     * from the space, and that is the distinction. Nothing in these nine tasks
     * collects an event off a listed space, takes a complement, or repairs an
     * overlap; the eight sequences are visited twice and both times to total a
     * variable over them, never to count a subset. A learner who has done all
     * nine has not demonstrated that an event is a subset. The forty-ninth
     * promotion credited that concept for exactly those moves, so crediting it
     * again from one step higher would be claiming them twice.
     */
    promotedBy: 'author:chance-and-events',
    rationale:
      'Every one of the three points starts from a distribution that concept builds, and two of '
      + 'its three points are used rather than rested on. Its first — a value names a preimage — '
      + 'is how T\'s table is collected here, TTT then the four sequences beginning with H then '
      + 'THH and THT then TTH. Its second — the entries total exactly 1 because the values of a '
      + 'function partition the space — is DERIVED FROM rather than checked: the proof that '
      + 'E[aX + b] = aE[X] + b turns on that total being 1, and the material states that on a '
      + 'conditioned table totalling 7/8 the rule would come out as aE[X] + 7b/8 and be false. '
      + 'Its third supplies the relabelling case, W = 2X + 1 moving four entries and merging '
      + 'none, and Y = |2X - 3| as the rule the linear shortcut must refuse. It credits the '
      + 'TABLE and not the space: nothing here collects an event off a listed space, takes a '
      + 'complement or repairs an overlap, so `sample-spaces` must still come due as though '
      + 'untouched.',
  },
]

export const CHANCE_AND_EVENTS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
