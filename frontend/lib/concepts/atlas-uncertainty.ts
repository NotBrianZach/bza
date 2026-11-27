/**
 * Uncertainty: probability, and inference from data.
 *
 * Two areas, split at the point where the direction of reasoning reverses.
 * Probability argues from a known mechanism to what the data will look like;
 * statistics argues from observed data back to the mechanism. That is not a
 * difference of difficulty or of topic but of which end is given, and keeping
 * them separate is what stops a reader treating a p-value as the probability a
 * hypothesis is true.
 *
 * `statistics` therefore rests on `probability` throughout and never the
 * reverse.
 *
 * THREE NODES HAVE LEFT THIS FILE — ONE FROM `statistics` AND TWO FROM
 * `probability` — AND THE ORDER THE FIRST TWO WENT IN IS THE OPPOSITE OF THE
 * DEPENDENCE ABOVE.
 *
 * `descriptive-statistics` went first — the `data-summaries` subject in
 * ontology-statistics.ts, the first written concept anywhere in either of these
 * two areas — and it is the one the sentence above was never true of. It rested
 * on `percent` and `sigma-notation` and on nothing in `probability` at all,
 * because describing a list you have is not reasoning in either direction: there
 * is no mechanism in it and no inference out of it. So the split this file is
 * organised around has three sides rather than two, and the third one is the
 * smallest.
 *
 * `sample-spaces` went second, in the forty-fifth promotion, into the
 * `chance-and-events` subject in ontology-chance.ts — and this one IS on the
 * dependence above. It is `probability`'s root, so it is the first written
 * material in the direction of reasoning this file is organised around, and
 * everything the statistics half rests on now rests on something written.
 *
 * `counting-probability` went third, in the forty-sixth, into that same subject.
 * It is the first node either area has released that was NOT the first thing
 * written in its half, and the reason it was available is mechanical rather than
 * lucky: promoting an area's root hands the root position to whatever sat
 * directly above it, so the same shape is there to be taken again.
 *
 * `conditional-probability` went fourth, in the forty-seventh, into that same
 * subject again — three consecutive nodes off one chain, which no other area has
 * given up. It is also where the shape above STOPS, and the departure block for
 * `probability` sets out why: the rule only walks a chain while exactly one node
 * sits directly above the root, and this one had three. This file's two areas
 * have now given up a chain of three and a chain of one, and the departure blocks
 * above each area record what happened to every edge.
 */

import type { MapArea } from './atlas'

/**
 * FOUR NODES HAVE LEFT THIS AREA WHEN THEY WERE AUTHORED, AND THEY HAD TO.
 *
 * `atlasProblems` rejects a map node whose id collides with an authored concept
 * — see atlas.ts, which argues it at length: the point of naming a concept in
 * `needs` is to POINT at it, and a node of the same id would shadow the authored
 * copy in the composed concept list with a copy that has no knowledge points, so
 * a subject that was fully written would read as unteachable. Promoting a node is
 * therefore a MOVE and not a fill-in, and the node has to be deleted from here on
 * the way out.
 *
 * All four went into the `chance-and-events` subject in ontology-chance.ts, and
 * in prerequisite order, which no run of promotions out of one area has matched.
 * `sample-spaces` went first, in the forty-fifth, and was the seventeenth
 * authored ontology and the first written concept in this area: sixteen nodes
 * down to fifteen. `counting-probability` went second, in the forty-sixth, as
 * that subject's second concept: fifteen down to fourteen.
 * `conditional-probability` went third, in the forty-seventh: fourteen down to
 * thirteen. `bayes-theorem` went fourth, in the forty-eighth: thirteen down to
 * TWELVE. tests/atlas.mjs holds the node count in the forty-eighth promotion's
 * group, which is the fourth group to own it.
 *
 * THE FLOOR DECIDED NOTHING AND IS NOT CLOSE, which is worth stating because it
 * decides where most promotions may happen. tests/atlas.mjs asserts that no area
 * sits below five nodes once departures count as covered territory, and this area
 * is at twelve nodes — SEVEN of headroom on the nodes alone, before any departure
 * is claimed. No `departed` array is declared here and that is still correct
 * rather than an omission: the floor reads absence as zero, the field is for
 * areas drained NEAR the floor, and declaring the four departures would buy four
 * more of headroom that nothing needs. If this area is ever drained past five,
 * that is when to declare it.
 *
 * ── THE ROOT WAS THE NODE WORTH TAKING THREE TIMES, AND THEN THE SHAPE RAN OUT ──
 *
 * This was the largest wholly unwritten area in the atlas and `sample-spaces`
 * was the only node in it whose `needs` pointed entirely OUTSIDE it — which is
 * what made it the one promotable node here. Until then the uncertainty half of
 * the atlas had exactly one written concept and it was the one node in either
 * area that rested on no probability at all. So every node of this area, and
 * every node of `statistics` above it, stood behind an unwritten root.
 *
 * `counting-probability` then inherited that position exactly, and
 * `conditional-probability` inherited it from that, which is why the second and
 * third promotions were available at all: each was the area's sole root the
 * moment the one below it left, for the same reason — one of its `needs` had
 * become an authored concept and the rest were never in this area. Promoting an
 * area's root hands the position to whatever sat directly above it, so a chain
 * into an unwritten area can be walked one node per run with no node ever
 * gaining an in-area prerequisite.
 *
 * THE FORTY-SEVENTH PROMOTION IS WHERE THAT STOPS, AND THE MECHANISM SAYS WHY
 * RATHER THAN THE INSTANCE. "The root position passes to whatever sat directly
 * above it" is only a chain-walk while exactly ONE node sits directly above. The
 * first two departures each had one in-area dependent; `conditional-probability`
 * had THREE — `bayes-theorem`, `random-variables` and `markov-chains` all named
 * it and nothing else inside this area — so its departure handed the root
 * position to all three at once. The root set went from size one to size THREE,
 * the first time it has grown here, and the next run picks among three rather
 * than inheriting one. So the cheap shape was never a property of this area; it
 * was a property of the part of the chain that happened to be a chain, and it
 * ends at the first branch point. The three roots were not equally available
 * either: `bayes-theorem` and `random-variables` were READY, and `markov-chains`
 * names `eigenvalues`, which ontology-matrices.ts declines by name.
 *
 * ── THE FORTY-EIGHTH PICKED FROM THAT SET, AND THE SET SHRANK ─────────────
 *
 * `bayes-theorem` was the first promotion out of this area that was CHOSEN
 * rather than inherited — three roots, two of them ready, and the order
 * "stranded edges before dependents" settled it. Everything the three
 * promotions before it learned about a chain still held: the node's one `need`
 * had been authored into `chance-and-events` by the run before, so it stranded
 * NOTHING, which is the second consecutive zero-cost departure and the thing a
 * chain taken in order keeps buying after it stops producing a single heir.
 *
 * WHAT IS NEW IS A SEVENTH ROOT-SET OUTCOME: the set went from three to TWO.
 * Every earlier departure here turned the set over at constant size or grew it,
 * and both of those happen because the departing node had in-area dependents to
 * hand its position to. This one had NONE. `bayes-theorem`'s only dependent
 * anywhere is `bayesian-inference`, and that node is in `statistics`, not here —
 * so nothing inside this area was waiting on it and nothing inherited its place.
 * A root with no in-area dependent simply leaves, and the durable statement is
 * that the root set grows, holds or shrinks according to how many in-area nodes
 * named the departing one: three, one and zero have each now happened.
 *
 * AND THE YIELD WAS ZERO READY NODES, THE FIRST TIME IN THIS AREA. The same fact
 * says it: `bayesian-inference` names `maximum-likelihood` as well, which is
 * unwritten and sits above it in `statistics`, so the one dependent this
 * promotion fed is not ready and will not be for some time. The forty-fifth made
 * two, the forty-sixth one, the forty-seventh two, this one none — so a promotion
 * can be the cheapest available and still feed nothing, and "what does this
 * unlock" is a question with the answer zero often enough to be asked rather
 * than assumed.
 *
 * ── THE FORTY-NINTH STEPPED OFF THE CHAIN, AND THE SET GREW BACK ──────────
 *
 * `random-variables` was the only unrefused ready node on the whole map, so this
 * one was neither inherited nor chosen — the field had come down to one. It is
 * the fifth departure from this area and the FIRST that is not the next link in
 * the chain: it and `bayes-theorem` both declared `conditional-probability` and
 * nothing else of that subject, so they are SIBLINGS off the third concept
 * rather than a fourth and fifth step up one line.
 *
 * AN EIGHTH ROOT-SET OUTCOME, AND IT IS A SECOND GROWTH: two to THREE. The rule
 * the forty-eighth wrote down holds unchanged and this is the case it predicts —
 * the departing node had TWO in-area dependents, `expectation` and
 * `continuous-distributions`, and both inherited its position beside
 * `markov-chains`. So the set changes size by (in-area dependents) minus one,
 * and +1, 0, +2 and -1 have now all happened in this file.
 *
 * THE YIELD WAS ONE READY NODE AND THE READY COUNT ACROSS THE MAP DID NOT MOVE,
 * which has not happened before here and is the thing worth carrying. Twelve
 * ready before, twelve after: it spent one and made one, so a run that measured
 * only the number would conclude the promotion changed nothing about what is
 * authorable, while in fact the MEMBERSHIP turned over. `expectation` needs
 * `random-variables` and `sigma-notation`, both now written, and is ready.
 * `continuous-distributions` needs `random-variables` and `definite-integral`,
 * and the latter is a node of `integration` — so it became a ROOT of this area
 * without becoming ready, which is the sharpest available statement that those
 * two measures are independent. A dependent whose other prerequisite is
 * unwritten is not yield, and a dependent count cannot see the difference.
 *
 * AND THE DEPARTURE COST THIS FILE AN ENTRY, WHICH ENDS A RUN OF TWO ZEROES.
 * `links` goes to FOUR. The reason is the sibling shape rather than any
 * carelessness: a chain taken in order is cheap because each step's one
 * prerequisite is the step below it, and this node had TWO prerequisites with
 * one of them pointing at `functions-and-inverses`. The note on `links` below
 * works that out in full, because "a chain eventually costs nothing" was the
 * sentence this promotion found the limit of.
 *
 * ── WHAT HAPPENED TO THE DEPARTING NODES' EDGES ───────────────────────────
 *
 * An edge belongs to the node that DECLARES it, which is what makes this
 * bookkeeping rather than a judgement.
 *
 *  1. THE STRANDED PREREQUISITES ARE THE `links` ENTRIES BELOW, now FOUR of
 *     them. Neither the forty-seventh nor the forty-eighth promotion
 *     added one and the forty-ninth did — `bayes-theorem` declared `conditional-probability` and nothing
 *     else, and that concept had been authored into the subject it was joining
 *     one promotion earlier, so there was again no far end in a third subject
 *     and nothing to file. `sample-spaces`
 *     declared `sets` and `fraction-arithmetic`, authored in `sets-and-membership`
 *     and `arithmetic-foundations`, and neither could go in `chance-and-events`
 *     because an authored ontology may only name concepts it contains.
 *     `counting-probability` declared `sample-spaces` and `counting-principles`:
 *     the first is now IN that subject, so it is an ordinary edge in
 *     `CHANCE_AND_EVENTS.edges` and the subject's first internal one, and only
 *     `counting-principles` stranded. `conditional-probability` declared
 *     `counting-probability` and NOTHING ELSE, and that concept was already in
 *     the subject it joined — so its one edge went straight into
 *     `CHANCE_AND_EVENTS.edges` and the cost to this file was zero. The durable
 *     declared TWO, `conditional-probability` and `function-concept`, and only
 *     the first was in the subject it joined — so `function-concept` stranded
 *     and is the fourth entry. The durable
 *     form of the rule is that a promotion strands as many edges as the node
 *     declares `needs` outside its new subject, read off the node — two, then
 *     one, then NONE, then none again, then one.
 *
 *     A ZERO-COST PROMOTION IS WHAT A CHAIN WALKED IN ORDER EVENTUALLY BUYS, and
 *     that is the one sense in which the shape kept paying after it stopped
 *     producing a single heir: each node's prerequisite had been authored into
 *     the same subject by the run before, so the third departure had nowhere to
 *     strand anything TO.
 *
 *     AND THE FORTY-NINTH FOUND THE LIMIT OF THAT SENTENCE, which is the thing
 *     to carry out of this paragraph. A chain is cheap because each step's ONE
 *     prerequisite is the step below it, not because the promotions were
 *     orderly. `random-variables` is a sibling off the third concept with two
 *     prerequisites, one of them in `functions-and-inverses` and authored years
 *     of promotions earlier by somebody who knew nothing about probability — so
 *     there was no run before that could have moved it, and no amount of order
 *     would have made the departure free.
 *  2. THE INBOUND EDGES NEEDED NOTHING DONE TO THEM, AND THEY ARE EACH
 *     PROMOTION'S YIELD. `counting-probability` here and `sampling-and-bias` in
 *     `statistics` each named `sample-spaces` in their own `needs`;
 *     `conditional-probability` named `counting-probability` in its own;
 *     `bayes-theorem`, `random-variables`, `markov-chains` here and
 *     `causal-inference` in `statistics` each named `conditional-probability` in
 *     theirs; and `expectation` and `continuous-distributions` here each name
 *     `random-variables` in theirs. Every one is declared by a node that stayed,
 *     `expandEdges` still
 *     emits them, and both endpoints of each exist in the composed graph. A
 *     `links` entry for any of them would be a second copy of an edge that
 *     already exists, and `composeAtlas` does not report duplicates.
 *
 *     THE YIELD STOPPED SHRINKING, GREW, AND THEN WENT TO ZERO. The forty-fifth
 *     made TWO nodes ready, which no promotion had done; the forty-sixth made
 *     one, because `conditional-probability` declared `counting-probability` and
 *     nothing else; the forty-seventh made TWO again — `bayes-theorem`, which
 *     named the new concept and nothing else, and `random-variables`, which
 *     names it and `function-concept`, already written. `markov-chains` and
 *     `causal-inference` also name it and are NOT ready, because `eigenvalues`
 *     and `anova-and-design` are unwritten. Four inbound edges, two ready nodes:
 *     the count of dependents is an upper bound on the yield and not the yield.
 *
 *     THE FORTY-EIGHTH MADE NONE, which is that upper bound reaching its floor
 *     and is the sharpest case the rule has had. `bayes-theorem` had exactly ONE
 *     dependent anywhere — `bayesian-inference`, over in `statistics` — and that
 *     node also names `maximum-likelihood`, which is unwritten. So one inbound
 *     edge, zero ready nodes. A promotion that strands nothing and unlocks
 *     nothing is not a contradiction: the two measure different things, and the
 *     cheapest departure available can sit at the end of a branch.
 *
 *     THE FORTY-NINTH MADE ONE OF TWO, AND IT IS THE CLEANEST STATEMENT OF THE
 *     UPPER-BOUND RULE SO FAR because both dependents are in this area and they
 *     split. `expectation` names `random-variables` and `sigma-notation`, both
 *     written, so it is ready. `continuous-distributions` names
 *     `random-variables` and `definite-integral`, and the latter is a node of
 *     `integration` — so it is not ready and will not be until calculus is
 *     authored. Two inbound edges, one ready node, and the two dependents are
 *     indistinguishable from each other in any count: what separated them is the
 *     OTHER prerequisite, which is a property of the dependent and not of the
 *     promotion.
 *  3. ONE `exercises` CLAIM WAS LOST AND IT IS THE FIRST TIME. `sample-spaces`
 *     declared no `confusedWith` and no `exercises`, which was checked rather
 *     than remembered. `counting-probability` declared
 *     `exercises: ['counting-principles']`, and `expandEdges` was turning that
 *     into an `encompasses` edge — so authoring the node DELETED a credit edge
 *     and nothing went red, because neither `encompasses` nor `interferes_with`
 *     gates. ontology-chance.ts argues why the subject boundary was worth it and
 *     records that the claim is inexpressible rather than refused: `encompasses`
 *     may only be declared in an ontology holding both ends, and a `links` entry
 *     carries `from`, `to` and `because` and no KIND.
 *
 *     That is the stranding this comment block has warned about four times while
 *     having nothing to lose. It bit on the fifth, which is the argument for
 *     checking rather than remembering, and the check was run a sixth time for
 *     the forty-seventh: `conditional-probability` declared no `exercises` and no
 *     `confusedWith`, so nothing was lost.
 *
 *     THE FORTY-SEVENTH IS WHERE THE INTERFERENCE CHECK CHANGED SIDES, which is
 *     worth more than the result. The two interference pairs in this file are
 *     `bayes-theorem` ~ `conditional-probability` and `hypothesis-testing` ~
 *     `bayes-theorem`, and the FIRST of those is declared by `bayes-theorem`, not
 *     by the node that left — an edge belongs to the node that DECLARES it, so
 *     promoting the far end could not touch it and `expandEdges` emitted it
 *     still, pointing at an authored concept rather than at a node. What that
 *     meant for the next run was written down here as a warning: `bayes-theorem`
 *     was then the readiest node here AND it owned that edge, so whoever took it
 *     had to re-declare the interference, and nothing would have gone red if
 *     they had not.
 *
 *     THE FORTY-EIGHTH TOOK IT AND PAID THE WARNING, which is the first time in
 *     this build that a `confusedWith` has survived its declaring node being
 *     promoted. The edge is now an ordinary `interferes_with` entry in
 *     `CHANCE_AND_EVENTS.edges` with the node's own `because` carried verbatim as
 *     its `rationale`. It was cheap for one reason only and the reason is worth
 *     keeping, because it will not usually hold: the far end had ALREADY been
 *     authored into the subject the node was going to, so both ends landed in
 *     one ontology. `ontologyProblems` refuses an edge naming a concept its
 *     ontology does not contain, and an area's `links` hard-codes `prerequisite`
 *     and carries no kind — so had `conditional-probability` been authored
 *     anywhere else, this edge would have been INEXPRESSIBLE rather than merely
 *     unwritten, which is what happened to `counting-probability`'s `exercises`
 *     claim at the forty-sixth. Taking the two ends of an interference pair in
 *     order, lower end first, is therefore the only sequence that preserves one,
 *     and that is a scheduling fact about promotions rather than about this edge.
 *
 *     THE SECOND PAIR NEEDED NOTHING AND IS NOW THE ASYMMETRIC CASE.
 *     `hypothesis-testing` declares its `confusedWith` against `bayes-theorem`,
 *     that node is in `statistics` and stayed, so `expandEdges` emits the edge
 *     from a node to an authored concept and the check was run rather than
 *     assumed. It is also the pair still exposed: promoting `hypothesis-testing`
 *     would strand it, and `bayes-theorem` is in `chance-and-events` while that
 *     node would go to a statistics subject, so the cheap repair is NOT available
 *     there. Whoever promotes it should expect to lose the edge and say so.
 *
 *     THE FORTY-NINTH HAD NOTHING AT RISK AND THAT WAS CHECKED, NOT REMEMBERED.
 *     `random-variables` declared no `confusedWith`, no `exercises` and no
 *     `encompasses` — all three read off the node before it was deleted, since
 *     all three strand in silence. So no credit or interference edge was lost,
 *     and the two pairs above are unchanged. The check is worth running on every
 *     promotion precisely because the answer is usually "nothing": the one time
 *     it was not, at the forty-sixth, nothing went red.
 */
const PROBABILITY: MapArea = {
  id: 'probability',
  name: 'Probability',
  covers:
    'From a known mechanism to the behaviour of outcomes: random variables, the standard ' +
    'distributions, and the limit theorems. NEITHER THE SAMPLE SPACE, NOR COUNTING A ' +
    'PROBABILITY OFF ONE, NOR CONDITIONING IS PART OF THIS AREA ANY MORE, and that is the one ' +
    'thing worth reading before looking for any of them: what an outcome is, an event as a ' +
    'subset of the outcomes, equally likely outcomes as the hypothesis that licenses dividing, ' +
    'the complement and addition rules, then P(E) = |E| / |S| with both sides COUNTED once the ' +
    'space is too big to write down, and then conditioning as the replacement of the space by ' +
    'what is known — P(A given B) = |A and B| / |B|, the multiplication rule along a sequence ' +
    'of draws, and independence as the product test passing — are all written, as ' +
    '`sample-spaces`, `counting-probability` and `conditional-probability` in the ' +
    '`chance-and-events` subject. Those were this area\'s three lowest nodes, taken in order up ' +
    'one chain, so everything left here stands behind written material and the combinatorics ' +
    'the subject rests on is written too. NOR IS REVERSING A CONDITIONAL, which left next: ' +
    'getting P(A given B) out of P(B given A) and a base rate, the law of total probability ' +
    'that builds its denominator, and the odds form in which the update is one multiplication ' +
    'by a likelihood ratio are all written as `bayes-theorem` in that same subject — so the ' +
    'four lowest nodes of this area have gone up one chain in order, and the prosecutor\'s ' +
    'fallacy and the screening-test error are taught rather than listed. NOR IS ATTACHING A ' +
    'NUMBER TO EACH OUTCOME, which left next and is the first departure that was not next in ' +
    'that chain: a random variable as a RULE over the outcomes so that a value of it names a ' +
    'preimage, the whole distribution as a table forced to total 1 by the rule being a ' +
    'function, and a function of a random variable merging values so that their probabilities ' +
    'add — all written as `random-variables` in the same subject. NOR IS COLLAPSING THAT TABLE ' +
    'TO ONE NUMBER, which left next and is the sixth departure: the weighted total of value ' +
    'times probability, which is in the units of the variable and need not be a value the ' +
    'variable takes; the push-through rule E[aX + b] = aE[X] + b, standing on the table ' +
    'totalling exactly 1 and refusing any rule that is not linear; and the addition of ' +
    'expectations across two variables on one space WHETHER OR NOT they are independent, with ' +
    'the multiplicative version failing on the same pair — all written as `expectation` in ' +
    'that subject, which now holds six ' +
    'concepts and eighteen ideas. THE THREE NODES ABOVE THEM ARE WHERE THIS AREA NOW STARTS, ' +
    'and it starts in three places rather than one: `variance-and-covariance` is an expectation ' +
    'of a squared deviation and is the one of the three with everything it needs already ' +
    'written, `continuous-distributions` replaces the table with a density and waits on ' +
    '`definite-integral`, and `markov-chains` conditions along time and waits on `eigenvalues`.',
  links: [
    /*
     * THREE STRANDED PREREQUISITES, FROM TWO PROMOTIONS: the first two entries
     * are `sample-spaces`' and the third is `counting-probability`'s. In every
     * case the far end is an authored concept of another subject, so the edge
     * cannot live in `chance-and-events` — `ontologyProblems` reports an unknown
     * endpoint for an edge naming a concept its ontology does not contain — and
     * an area's `links` is the only place in the build that can express "an
     * authored concept rests on an authored concept of a third subject".
     *
     * Filed HERE, in the area that owned the departing node, rather than in
     * `discrete-mathematics` or `algebra-foundations` where the far ends were
     * promoted from. That is the established rule and the reason is ownership:
     * this area is where somebody looking for what became of these nodes will
     * come, and the far subjects have no record that the edges exist.
     *
     * ALL THREE GATE, immediately and for real, which is unusual for a `links`
     * entry: most are written while the far node is still unwritten and constrain
     * nothing until it is authored. Here every end has material, so
     * `gatingPrerequisitesOf` on each written concept returns exactly its own
     * entries, and a learner cannot be shown a sample space until sets and
     * fractions are strong or a counted probability until the counting is.
     *
     * AND THE FORTY-SIXTH PROMOTION SHOWED WHAT THIS BLOCK SAYS CAN HAPPEN. The
     * note here used to warn that if a far concept ever MOVED into
     * `chance-and-events` its entry would have to be DELETED, since two identical
     * edges in the composed graph is not a duplicate `composeAtlas` notices and
     * no test reports one. That is exactly what `counting-probability` did with
     * its OWN `sample-spaces` prerequisite — which never became an entry here,
     * because the node was authored into the subject already holding the far end,
     * so the edge went straight into `CHANCE_AND_EVENTS.edges` as that subject's
     * first internal one. The warning still stands for the three below;
     * tests/atlas.mjs asserts the subject of each far end for exactly that
     * reason, and now also asserts that `sample-spaces` appears on no entry here.
     *
     * AND NEITHER THE FORTY-SEVENTH NOR THE FORTY-EIGHTH PROMOTION ADDED
     * ANYTHING TO THIS LIST, which is the limiting case of the same mechanism
     * and is asserted as an absence in each of their groups.
     * `conditional-probability` declared one `need`, `counting-probability`, and
     * the forty-sixth promotion had already authored that concept into
     * `chance-and-events`; `bayes-theorem` declared one `need`,
     * `conditional-probability`, and the forty-seventh had just authored THAT
     * into the same subject. Each time there was no far end in a third subject
     * and nothing to file. A chain taken in order eventually costs an area
     * nothing: the run before has always already moved the far end.
     *
     * THE FORTY-NINTH ENDED THAT RUN OF TWO ZEROES, AND THE FOURTH ENTRY BELOW
     * IS WHY — WHICH NAMES THE LIMIT OF THE SENTENCE ABOVE. "A chain taken in
     * order eventually costs an area nothing" is true while you stay ON the
     * chain. `random-variables` declared TWO `needs`, `conditional-probability`
     * and `function-concept`, and it is `bayes-theorem`'s SIBLING off the first
     * of them rather than the next step up the line — so the run before had
     * moved one far end and had no reason to have moved the other.
     * `function-concept` is in `functions-and-inverses` and was authored long
     * before any of this, by a promotion that knew nothing about probability.
     *
     * SO THE SHAPE TO CARRY IS NOT "A CHAIN IS CHEAP" BUT "A CHAIN IS CHEAP
     * BECAUSE EACH STEP'S ONE PREREQUISITE IS THE STEP BELOW IT". A node with
     * two prerequisites costs an entry here the moment one of them points
     * outside the subject it is joining, and that is a property of the NODE's
     * `needs` rather than of how orderly the promotions have been.
     */
    {
      from: 'sets',
      to: 'sample-spaces',
      because:
        'An event IS a subset of the sample space, not a sentence about it, and the third ' +
        'knowledge point unions, intersects and complements events as sets — so union, ' +
        'intersection, complement and the subset relation are the vocabulary the concept is ' +
        'written in rather than a later convenience. The two-set correction is the sharpest ' +
        'case: |A ∪ B| = |A| + |B| − |A ∩ B| is proved there for sizes, and the addition rule ' +
        'for probabilities is that identity divided through by the size of the space.',
    },
    {
      from: 'fraction-arithmetic',
      to: 'sample-spaces',
      because:
        'Every probability in the concept is a count of outcomes over the size of the space, so ' +
        'the answers are eighths, and the third point adds and subtracts them: 4/8 + 4/8 − 3/8 ' +
        'and 1 − 1/8. Comparing 1/4 with 3/8 over a common denominator is also the step the ' +
        'second point\'s whole argument turns on — the two spaces disagree, and seeing that they ' +
        'disagree is a fraction comparison before it is anything about probability.',
    },
    /*
     * THE FORTY-SIXTH PROMOTION'S ONE STRANDED EDGE, and the only one it had:
     * `counting-probability` declared `['sample-spaces', 'counting-principles']`
     * and the first of those is in the subject it joined.
     *
     * This entry is also where the credit edge WOULD have gone if anything could
     * carry it. The departing node declared `exercises: ['counting-principles']`
     * as well, which `expandEdges` was turning into an `encompasses`, and
     * authoring the node deleted it: `links` hard-codes `prerequisite`, so the
     * two claims — "the counting must be strong first" and "doing this counts as
     * having done the counting" — collapse into the one below. Only the gate
     * survives. ontology-chance.ts argues the trade.
     */
    {
      from: 'counting-principles',
      to: 'counting-probability',
      because:
        'The concept is a ratio of two counts and it does not derive either of them. Its space ' +
        'is (12 × 11 × 10)/6 = 220 committees — a descending product over the orderings of one ' +
        'selection, which is that concept\'s second knowledge point exactly — and its second ' +
        'point multiplies two such counts, 5 × 21, having first checked the product rule\'s ' +
        'condition the way that concept\'s first point insists on. Its third point is ' +
        'inclusion–exclusion over two sets with one division at the end. So every number above ' +
        'the division line is that subject\'s work, and a learner who cannot produce them has ' +
        'nothing to divide.',
    },
    /*
     * THE FORTY-NINTH PROMOTION'S ONE STRANDED EDGE, and the first entry this
     * list has gained since the forty-sixth. `random-variables` declared
     * `['conditional-probability', 'function-concept']`; the first is in the
     * subject it joined and became an ordinary `EDGES` entry there, and this is
     * the other half.
     *
     * IT GATES IMMEDIATELY, like the three above and unlike most `links`
     * entries: both ends have material, so `gatingPrerequisitesOf` on
     * `random-variables` returns `conditional-probability` from the ontology and
     * `function-concept` from here, and a learner cannot be shown a random
     * variable until both are strong.
     *
     * NO CREDIT EDGE IS LOST HERE, which is worth one line because the entry
     * above it did lose one. The departing node declared no `exercises` and no
     * `encompasses`, so there was nothing for `links` to be unable to carry —
     * `links` hard-codes `prerequisite` and has no kind, which is what collapsed
     * `counting-probability`'s two claims into one. The credit this concept DOES
     * claim runs to `sample-spaces`, inside `chance-and-events`, so it needed
     * nothing from this file.
     */
    {
      from: 'function-concept',
      to: 'random-variables',
      because:
        'A random variable IS a function — one number attached to each outcome — and the ' +
        'concept leans on that twice over rather than borrowing the word. Its second knowledge ' +
        'point proves the table must total 1 FROM the function property: a function sends each ' +
        'outcome to exactly one value, so the preimages of the values have nothing in common ' +
        'and leave nothing out, and a partition of the space has probability 1. Without that ' +
        'the total is a coincidence to be checked rather than a fact to be relied on. And the ' +
        'first point needs a function to be defined EVERYWHERE on its domain: the second ' +
        'variable there records which toss the first head fell on, TTT has no head, and the ' +
        'point is that a value has to be chosen at TTT or the rule is not a function on this ' +
        'space at all.',
    },
    /*
     * THE FIFTIETH PROMOTION'S ONE STRANDED EDGE, and the second consecutive
     * entry this list has gained. `expectation` declared
     * `['random-variables', 'sigma-notation']`; the first is in the subject it
     * joined and became an ordinary `EDGES` entry there, and this is the other
     * half.
     *
     * IT IS THE SAME SHAPE AS THE ENTRY ABOVE AND IT FALSIFIES THAT ENTRY'S
     * EXPLANATION, which is the thing worth recording. The forty-ninth's note
     * says a chain is cheap because each step's one prerequisite is the step
     * below it, and attributes its own cost to having stepped SIDEWAYS off the
     * chain. This promotion stepped straight back onto it — `expectation` sits
     * directly above `random-variables` — and still cost an entry, because it
     * declared two `needs` and one of them points outside the subject. So the
     * sentence to keep is the one that note ENDED on rather than the one it
     * opened with: the cost is a property of the NODE's `needs`, and the
     * orderliness of the promotions has nothing to do with it. Four of this
     * area's six departures were free, and both of the costly ones declared two
     * prerequisites.
     *
     * IT GATES IMMEDIATELY, like the four above: both ends have material, so
     * `gatingPrerequisitesOf` on `expectation` returns `random-variables` from
     * the ontology and `sigma-notation` from here, and a learner cannot be shown
     * an expectation until both are strong. That is now true of every entry in
     * this list, which is unusual — most `links` entries are written while the
     * far node is unwritten and constrain nothing until it is authored.
     *
     * NO CREDIT EDGE IS LOST HERE. The departing node declared no `exercises`
     * and no `encompasses`, so there was nothing for `links` to be unable to
     * carry; the credit this concept DOES claim runs to `random-variables`,
     * inside `chance-and-events`, so it needed nothing from this file. Read off
     * the node before deletion rather than assumed, as the block above the node
     * list insists.
     */
    {
      from: 'sigma-notation',
      to: 'expectation',
      because:
        'The expectation IS a sum over the values, so the notation is not a convenience here ' +
        'but the form the definition is written in, and all three of that concept\'s points do ' +
        'work. Its first — both limits are included, so the term count is upper − lower + 1 — ' +
        'is why the heads-count total has FOUR terms and not three, which is the commonest ' +
        'arithmetic slip available on this table. Its third is load-bearing twice over: a ' +
        'constant factor coming outside a sum and a sum of two terms splitting into two sums ' +
        'are between them the whole proof that E[aX + b] = aE[X] + b, and the same split with ' +
        'a second variable where the constant was is the proof that expectations add. And its ' +
        'second — a term that ignores the index still counts the terms — is what the constant b ' +
        'becomes before the table\'s total of 1 collapses it to b.',
    },
  ],
  nodes: [
    /*
     * `random-variables` WAS THE FIRST ENTRY HERE AND LEFT AT THE FORTY-NINTH
     * PROMOTION, into `chance-and-events` as that subject's fifth concept. It
     * had to be deleted rather than annotated: `atlasProblems` rejects a map
     * node whose id collides with an authored concept, because the composed
     * list would hold two entries for the id and the shadowing copy has no
     * knowledge points, so a fully authored concept would read as unteachable.
     *
     * IT IS THE FIFTH DEPARTURE FROM THIS AREA AND THE FIRST THAT IS NOT NEXT
     * IN THE CHAIN. The four before it went up one line — `sample-spaces`,
     * `counting-probability`, `conditional-probability`, `bayes-theorem` — and
     * this one is `bayes-theorem`'s SIBLING off the third of them. The
     * difference shows in `links` below: a chain taken in order costs the area
     * nothing because the run before has always already moved the far end, and
     * stepping off the chain ends that.
     */
    /*
     * `expectation` WAS THE FIRST ENTRY HERE AFTER THAT AND LEFT AT THE
     * FIFTIETH PROMOTION, into `chance-and-events` as that subject's sixth
     * concept. Deleted rather than annotated, for the collision reason above.
     *
     * IT IS THE SIXTH DEPARTURE FROM THIS AREA AND THE CHAIN RESUMES. The
     * forty-ninth stepped sideways off the line; this one steps straight up
     * from where that landed, so the six departures are now a chain of four,
     * one sibling branch, and a step up from the branch. That matters for the
     * `links` list below rather than as bookkeeping: a chain is cheap because
     * each step's one prerequisite is the step below it, and this node declared
     * TWO — so being back on the chain did NOT make it free, and the fifth
     * entry below is the proof. The cheapness was never about order.
     *
     * AND ITS DEPARTURE IS THE FIRST TO LEAVE THIS AREA'S ROOT SET THE SAME
     * SIZE WITH DIFFERENT MEMBERS. The forty-eighth's rule — the set changes
     * size by (in-area dependents) minus one — predicts zero here, because
     * `variance-and-covariance` was its single in-area dependent and inherited
     * the position it vacated. A `length === 3` check would have passed across
     * this promotion while every node it named had changed.
     */
    {
      id: 'variance-and-covariance',
      match: /\b(variance|covariance|standard deviation|correlation)\b/i,
      name: 'Variance and covariance',
      is: 'Spread as an expected squared deviation, with covariance measuring joint movement and independence implying zero but not conversely.',
      needs: ['expectation'],
      terms: 'variance standard deviation covariance correlation independence',
    },
    {
      id: 'discrete-distributions',
      match: /\b(binomial|poisson|geometric|bernoulli) distribution\b/i,
      name: 'The discrete distributions',
      is: 'Bernoulli, binomial, geometric and Poisson — each is a mechanism, and naming the mechanism is how you choose one.',
      needs: ['variance-and-covariance', 'binomial-theorem'],
      terms: 'bernoulli binomial geometric poisson distribution',
    },
    {
      id: 'continuous-distributions',
      match: /\b(normal|exponential|uniform|gamma|beta) distribution\b/i,
      name: 'The continuous distributions',
      is: 'Density rather than probability at a point, with uniform, exponential and normal as the three to know.',
      needs: ['random-variables', 'definite-integral'],
      exercises: ['definite-integral'],
      terms: 'probability density function uniform exponential normal gaussian cdf',
    },
    {
      id: 'joint-distributions',
      match: /\b(joint (probability )?distribution|marginal distribution)\b/i,
      name: 'Joint and marginal distributions',
      is: 'Two random variables at once, where the marginals do not determine the joint — which is exactly where dependence lives.',
      needs: ['continuous-distributions', 'multiple-integrals'],
      terms: 'joint distribution marginal conditional density copula',
    },
    {
      id: 'transformations-of-variables',
      name: 'Functions of random variables',
      is: 'The distribution of a transformed variable, where the Jacobian appears for the same reason it does in integration.',
      needs: ['joint-distributions', 'change-of-variables'],
      terms: 'transformation of random variables jacobian convolution sum of variables',
    },
    {
      id: 'law-of-large-numbers',
      match: /\blaw of large numbers\b/i,
      name: 'The law of large numbers',
      is: 'Sample means converge to the expectation — the theorem that licenses estimating anything from a sample at all.',
      needs: ['variance-and-covariance', 'sequence-convergence'],
      terms: 'law of large numbers convergence in probability chebyshev',
    },
    {
      id: 'central-limit-theorem',
      match: /\bcentral limit theorem\b/i,
      name: 'The central limit theorem',
      is: 'Sums of many independent contributions are approximately normal whatever they came from, which is why the normal is everywhere.',
      needs: ['law-of-large-numbers', 'continuous-distributions'],
      terms: 'central limit theorem normal approximation standard error',
    },
    {
      id: 'markov-chains',
      match: /\bmarkov (chain|process|property)\b/i,
      name: 'Markov chains',
      is: 'A process whose next state depends only on the present one, with the long-run behaviour read off the transition matrix.',
      needs: ['conditional-probability', 'eigenvalues'],
      exercises: ['eigenvalues'],
      terms: 'markov chain transition matrix stationary distribution absorbing recurrent',
    },
    {
      id: 'stochastic-processes',
      match: /\b(stochastic process|brownian motion|poisson process|martingale)\b/i,
      name: 'Stochastic processes',
      is: 'Randomness indexed by time: Poisson processes, random walks, and Brownian motion as the continuous limit.',
      needs: ['markov-chains', 'central-limit-theorem'],
      terms: 'poisson process random walk brownian motion martingale',
    },
    {
      id: 'measure-theoretic-probability',
      match: /\bprobability space\b|\bprobability measure\b/i,
      name: 'Probability as measure theory',
      is: 'A probability is a measure of total mass one, which is the framing that makes conditioning on a continuous variable well defined.',
      needs: ['stochastic-processes', 'measure-zero-and-lebesgue'],
      terms: 'probability space sigma algebra measure radon nikodym conditional expectation',
    },
  ],
}

/**
 * ONE NODE LEFT THIS AREA WHEN IT WAS AUTHORED, AND IT HAD TO.
 *
 * `atlasProblems` rejects a map node whose id collides with an authored
 * concept — see atlas.ts, which argues it at length: the point of naming a
 * concept in `needs` is to POINT at it, and a node of the same id would shadow
 * the authored copy in the composed concept list with a copy that has no
 * knowledge points. So a subject that was fully written would read as
 * unteachable. Promoting a node is therefore a MOVE and not a fill-in, and the
 * node has to be deleted from here on the way out.
 *
 * `descriptive-statistics` is the one that has gone, into the `data-summaries`
 * subject in ontology-statistics.ts — the eleventh authored ontology, and the
 * FIRST authored concept anywhere in the uncertainty half of the atlas. The
 * two areas in this file held thirty-two nodes between them with nothing
 * written for any of them; they hold thirty-one now.
 *
 * Sixteen nodes went down to fifteen, against the five-node stub floor
 * tests/atlas.mjs asserts. The floor decided nothing here and is not close:
 * every one of this area's remaining nodes is unwritten, so there are ten
 * promotions of room before the question even arises. That is NOT true of
 * `algebra-foundations` or `linear-algebra`, both of which sit at six with
 * ready candidates they cannot spend, which is why the brief for a promotion
 * run has to check the area before the concept.
 *
 * ── WHAT HAPPENED TO THE DEPARTING NODE'S FOUR EDGES ──────────────────────
 *
 * An edge belongs to the node that DECLARES it, which is what makes this
 * bookkeeping rather than a judgement, and the four split three ways:
 *
 *  1. The two `needs` it declared ITSELF are stranded and are now the `links`
 *     entries below. Both of their far ends are authored concepts of OTHER
 *     subjects — `percent` in `arithmetic-foundations`, `sigma-notation` in
 *     `functions-and-inverses` — and an authored ontology may only name
 *     concepts it contains, so neither edge could go in `data-summaries`. This
 *     is the first promotion in the build whose stranded edges reach two
 *     different authored subjects, so the `links` entries are forced rather
 *     than chosen: there is no single ontology that could have held both.
 *  2. `sampling-and-bias` names `descriptive-statistics` in its own `needs`,
 *     and that edge needed NOTHING done to it. It is declared by a node that
 *     stayed, `expandEdges` still emits it, and both of its endpoints exist in
 *     the composed graph — one as an authored concept and one as a node. A
 *     `links` entry for it would be a second copy of an edge that already
 *     exists, and `composeAtlas` does not report duplicates.
 *  3. There was no `confusedWith` and no `exercises` to lose, and that is
 *     checked rather than remembered. `expandEdges` turns a node's
 *     `confusedWith` into an `interferes_with` edge, so deleting a node deletes
 *     that edge and NOTHING goes red — interference constrains selection rather
 *     than gating, so every suite stays green while the scheduler is quietly
 *     freed to introduce the two most confusable concepts in the subject
 *     together. The two interference pairs in this file are `bayes-theorem` ~
 *     `conditional-probability` and `hypothesis-testing` ~ `bayes-theorem`, and
 *     BOTH ARE NOW PART-AUTHORED rather than node-to-node: the forty-seventh
 *     promotion took `conditional-probability` and the forty-eighth took
 *     `bayes-theorem`, so the first pair is two concepts of
 *     `chance-and-events` and lives in that ontology's `edges`, while the
 *     second runs from a node still here to a concept there and `expandEdges`
 *     emits it unchanged. Only `hypothesis-testing` is still a node of this
 *     area, and it is the only one of the four whose departure would now
 *     strand anything.
 */
const STATISTICS: MapArea = {
  id: 'statistics',
  name: 'Statistics',
  covers:
    'From data back to the mechanism: estimation, intervals, testing, and regression. ' +
    'Every inferential claim here is a probability statement about the procedure, not about the ' +
    'hypothesis. DESCRIPTION IS NO LONGER PART OF THIS AREA and that is the one thing worth ' +
    'reading before looking for it: a mean, a median, a variance and an interquartile range are ' +
    'functions of a list somebody already has, they make no claim about anything unobserved, and ' +
    'they are written — as `descriptive-statistics` in the `data-summaries` subject. Everything ' +
    'left here rests on `probability`, which is the direction of reasoning this area is split ' +
    'from that one along, and on the data having come from somewhere, which is ' +
    '`sampling-and-bias` and is the first node above the written material.',
  links: [
    /*
     * The two edges the departing node declared itself. Both far ends are
     * authored concepts of other subjects, so neither can live in
     * `data-summaries` — `ontologyProblems` reports an unknown endpoint for an
     * edge naming a concept its ontology does not contain — and an area's
     * `links` is the only place in the build that can express "an authored
     * concept rests on an authored concept of a third subject".
     *
     * Filed HERE, in the area that owned the departing node, rather than in
     * `algebra-foundations` or `functions` where the far ends were promoted
     * from. That is the established rule and the reason is ownership: this area
     * is where somebody looking for what became of this node will come, and the
     * far subjects have no record that the edge exists.
     *
     * Both of them GATE, immediately and for real, which is unusual for a
     * `links` entry: most are written while the far node is still unwritten and
     * constrain nothing until it is authored. Here both ends have material, so
     * `gatingPrerequisitesOf` on the written concept returns exactly these two
     * and a learner cannot be shown the median until percentages and Σ are
     * strong.
     *
     * If either far concept ever MOVED into `data-summaries`, that edge would
     * become an ordinary `needs` there and the entry below would have to be
     * DELETED — two identical edges in the composed graph is not a duplicate
     * `composeAtlas` notices, and no test reports one. tests/atlas.mjs asserts
     * the subject of each far end for exactly that reason.
     */
    {
      from: 'percent',
      to: 'descriptive-statistics',
      because:
        'Every summary here is a share of a whole — what fraction of the list sits below the ' +
        'median, how much of the spread one value accounts for — and a percentage is the form ' +
        'those are read in. It is also the only prerequisite that was ever on the critical ' +
        'path: while `percent` was a skeleton this gate forked through it and came out at ' +
        '`ratio-and-rate` and `decimal-representation` as well, so authoring percentages made ' +
        'the gate on this concept SHORTER rather than substituting into it.',
    },
    {
      from: 'sigma-notation',
      to: 'descriptive-statistics',
      because:
        'A mean is Σxᵢ / n and a variance is Σ(xᵢ − x̄)² / n, so both of this concept\'s ' +
        'measures are sums over a list before they are anything else. Σ is also where the ' +
        'proof that the signed deviations cancel is written down — Σxᵢ − n·x̄ with n·x̄ = Σxᵢ ' +
        '— which is the one fact the subject proves rather than computes, and it cannot be ' +
        'stated without the notation.',
    },
  ],
  nodes: [
    {
      id: 'sampling-and-bias',
      match: /\b(sampling \(statistics\)|selection bias|survey methodology)\b/i,
      name: 'Sampling and bias',
      is: 'Where the data came from, which decides what any later calculation can possibly be about — and no computation repairs a bad sample.',
      needs: ['descriptive-statistics', 'sample-spaces'],
      terms: 'random sample bias sampling frame selection effect survey nonresponse',
    },
    {
      id: 'sampling-distributions',
      match: /\b(sampling distribution|standard error)\b/i,
      name: 'Sampling distributions',
      is: 'The distribution of a statistic over repeated samples, which is the object every inference is actually about.',
      needs: ['sampling-and-bias', 'central-limit-theorem'],
      terms: 'sampling distribution standard error statistic estimator',
    },
    {
      id: 'point-estimation',
      match: /\b(estimator|point estimation|bias of an estimator)\b/i,
      name: 'Estimation',
      is: 'Bias, variance and consistency as the properties of an estimator, and the trade-off between the first two.',
      needs: ['sampling-distributions'],
      terms: 'estimator bias variance consistency efficiency method of moments',
    },
    {
      id: 'maximum-likelihood',
      match: /\b(maximum likelihood|likelihood function)\b/i,
      name: 'Maximum likelihood',
      is: 'Choosing the parameter that makes the observed data most probable, which turns estimation into optimisation.',
      needs: ['point-estimation', 'optimisation'],
      exercises: ['optimisation'],
      terms: 'likelihood function maximum likelihood log likelihood fisher information',
    },
    {
      id: 'confidence-intervals',
      match: /\bconfidence interval\b/i,
      name: 'Confidence intervals',
      is: 'An interval produced by a procedure that covers the truth 95% of the time — a statement about the procedure, not about this interval.',
      needs: ['point-estimation'],
      terms: 'confidence interval coverage margin of error t distribution',
    },
    {
      id: 'hypothesis-testing',
      // No trailing \b after "test": the article is "Hypothesis testing", and
      // `test\b` cannot match inside "testing". Same trap as any pattern whose
      // last word takes a suffix in the title people actually use.
      match: /\b(hypothesis test|significance test|p-value|null hypothesis|type i and type ii)/i,
      name: 'Hypothesis testing',
      is: 'Computing how surprising the data would be if a null were true, and the two ways of being wrong that the thresholds trade off.',
      needs: ['confidence-intervals'],
      confusedWith: [{
        id: 'bayes-theorem',
        because:
          'A p-value is P(data this extreme | null true) and is universally read as P(null true | data) — ' +
          'the exact inversion Bayes exists to perform. The two must not be met together, because ' +
          'the second is the conclusion the first is constantly mistaken for.',
      }],
      terms: 'null hypothesis p value significance type i error power',
    },
    {
      id: 'multiple-comparisons',
      match: /\b(multiple comparisons|bonferroni|false discovery rate)\b/i,
      name: 'Multiple comparisons',
      is: 'Running many tests makes a false positive near-certain, which is why the threshold has to answer to how many questions were asked.',
      needs: ['hypothesis-testing'],
      terms: 'multiple comparisons bonferroni false discovery rate p hacking preregistration',
    },
    {
      id: 'linear-regression',
      match: /\b(linear regression|ordinary least squares)\b/i,
      name: 'Linear regression',
      is: 'Fitting a line by least squares, with the residuals — not the fit — carrying the information about whether the model holds.',
      needs: ['hypothesis-testing', 'least-squares'],
      exercises: ['least-squares'],
      terms: 'linear regression least squares residual r squared coefficient',
    },
    {
      id: 'multiple-regression',
      match: /\b(multiple (linear )?regression|multicollinearity)\b/i,
      name: 'Multiple regression',
      is: 'Several predictors at once, where a coefficient means "holding the others fixed" and collinearity makes that meaningless.',
      needs: ['linear-regression', 'rank-nullity'],
      terms: 'multiple regression collinearity adjusted r squared interaction term',
    },
    {
      id: 'anova-and-design',
      match: /\b(analysis of variance|anova|design of experiments)\b/i,
      name: 'Experimental design and ANOVA',
      is: 'Randomisation, blocking and the partition of variance — the part of statistics that happens before any data exists.',
      needs: ['multiple-regression', 'sampling-and-bias'],
      terms: 'anova experimental design randomisation blocking factorial',
    },
    {
      id: 'causal-inference',
      match: /\b(causal inference|confounding|instrumental variable|propensity score)\b/i,
      name: 'Causal inference',
      is: 'When a correlation licenses a causal claim: confounding, the counterfactual framing, and what an instrument buys.',
      needs: ['anova-and-design', 'conditional-probability'],
      terms: 'causal inference confounding counterfactual instrumental variable dag',
    },
    {
      id: 'bayesian-inference',
      match: /\bbayesian (inference|statistics|probability)\b/i,
      name: 'Bayesian inference',
      is: 'Treating the parameter as random and updating a prior, which answers the question the p-value is mistaken for.',
      needs: ['maximum-likelihood', 'bayes-theorem'],
      terms: 'bayesian inference prior posterior credible interval conjugate mcmc',
    },
    {
      id: 'nonparametric-methods',
      match: /\b(nonparametric statistics|bootstrapping \(statistics\)|rank correlation)\b/i,
      name: 'Nonparametric and resampling methods',
      is: 'Rank tests and the bootstrap, for when the distributional assumption is the weakest part of the argument.',
      needs: ['hypothesis-testing', 'sampling-distributions'],
      terms: 'nonparametric rank test bootstrap permutation test resampling',
    },
    {
      id: 'statistical-learning',
      match: /\b(statistical learning|overfitting|cross-validation|regulari[sz]ation)\b/i,
      name: 'Statistical learning',
      is: 'Prediction rather than inference, where overfitting is the central problem and cross-validation the honest measurement.',
      needs: ['multiple-regression', 'maximum-likelihood'],
      terms: 'statistical learning overfitting regularisation cross validation bias variance tradeoff',
    },
    {
      id: 'time-series',
      match: /\btime series\b|\bautocorrelation\b/i,
      name: 'Time series',
      is: 'Data where observations are not independent, so the standard errors of ordinary methods are simply wrong.',
      needs: ['multiple-regression', 'stochastic-processes'],
      terms: 'time series autocorrelation stationarity arima seasonality',
    },
  ],
}

export const UNCERTAINTY_AREAS: MapArea[] = [PROBABILITY, STATISTICS]
