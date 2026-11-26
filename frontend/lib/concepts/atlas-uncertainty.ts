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
 * directly above it, so the same shape is there to be taken again. This file's
 * two areas have now given up a chain of two and a chain of one, and the
 * departure blocks above each area record what happened to every edge.
 */

import type { MapArea } from './atlas'

/**
 * TWO NODES HAVE LEFT THIS AREA WHEN THEY WERE AUTHORED, AND THEY HAD TO.
 *
 * `atlasProblems` rejects a map node whose id collides with an authored concept
 * — see atlas.ts, which argues it at length: the point of naming a concept in
 * `needs` is to POINT at it, and a node of the same id would shadow the authored
 * copy in the composed concept list with a copy that has no knowledge points, so
 * a subject that was fully written would read as unteachable. Promoting a node is
 * therefore a MOVE and not a fill-in, and the node has to be deleted from here on
 * the way out.
 *
 * Both went into the `chance-and-events` subject in ontology-chance.ts, and in
 * prerequisite order, which no pair of promotions out of one area has managed
 * before. `sample-spaces` went first, in the forty-fifth, and was the
 * seventeenth authored ontology and the first written concept in this area:
 * sixteen nodes down to fifteen. `counting-probability` went second, in the
 * forty-sixth, as that subject's second concept: fifteen down to FOURTEEN.
 *
 * THE FLOOR DECIDED NOTHING AND IS NOT CLOSE, which is worth stating because it
 * decides where most promotions may happen. tests/atlas.mjs asserts that no area
 * sits below five nodes once departures count as covered territory, and this area
 * is at fourteen nodes — NINE of headroom on the nodes alone, before any
 * departure is claimed. No `departed` array is declared here and that is still
 * correct rather than an omission: the floor reads absence as zero, the field is
 * for areas drained NEAR the floor, and declaring the two departures would buy
 * two more of headroom that nothing needs. If this area is ever drained past
 * five, that is when to declare it.
 *
 * ── WHY THE ROOT WAS THE NODE WORTH TAKING, TWICE ─────────────────────────
 *
 * This was the largest wholly unwritten area in the atlas and `sample-spaces`
 * was the only node in it whose `needs` pointed entirely OUTSIDE it — which is
 * what made it the one promotable node here. Until then the uncertainty half of
 * the atlas had exactly one written concept and it was the one node in either
 * area that rested on no probability at all. So every node of this area, and
 * every node of `statistics` above it, stood behind an unwritten root.
 *
 * `counting-probability` then inherited that position exactly, which is why the
 * second promotion was available at all: it was the area's sole root the moment
 * the first one left, for the same reason — one of its `needs` had become an
 * authored concept and the other was never in this area. The pattern is worth
 * naming because it is the cheapest shape a run can find: promoting an area's
 * root hands the position to whatever sat directly above it, so a chain into an
 * unwritten area can be walked one node per run with no node ever gaining an
 * in-area prerequisite. `conditional-probability` is the root now.
 *
 * ── WHAT HAPPENED TO THE DEPARTING NODES' EDGES ───────────────────────────
 *
 * An edge belongs to the node that DECLARES it, which is what makes this
 * bookkeeping rather than a judgement.
 *
 *  1. THE STRANDED PREREQUISITES ARE THE `links` ENTRIES BELOW, three of them
 *     now. `sample-spaces` declared `sets` and `fraction-arithmetic`, authored in
 *     `sets-and-membership` and `arithmetic-foundations`, and neither could go in
 *     `chance-and-events` because an authored ontology may only name concepts it
 *     contains. `counting-probability` declared `sample-spaces` and
 *     `counting-principles`: the first is now IN that subject, so it is an
 *     ordinary edge in `CHANCE_AND_EVENTS.edges` and the subject's first internal
 *     one, and only `counting-principles` stranded. The durable form of the rule
 *     is that a promotion strands as many edges as the node declares `needs`
 *     outside its new subject, read off the node — two, then one.
 *  2. THE INBOUND EDGES NEEDED NOTHING DONE TO THEM, AND THEY ARE EACH
 *     PROMOTION'S YIELD. `counting-probability` here and `sampling-and-bias` in
 *     `statistics` each named `sample-spaces` in their own `needs`;
 *     `conditional-probability` names `counting-probability` in its own. All
 *     three are declared by nodes that stayed, `expandEdges` still emits them,
 *     and both endpoints of each exist in the composed graph. A `links` entry for
 *     any of them would be a second copy of an edge that already exists, and
 *     `composeAtlas` does not report duplicates.
 *
 *     EACH YIELD IS ONE NODE CHEAPER THAN THE LAST. The forty-fifth made TWO
 *     nodes ready, which no promotion had done; the forty-sixth made one, because
 *     `conditional-probability` declares `counting-probability` and nothing else
 *     and so was ready the instant it shipped. That one is a Rubneb ANCHOR, so
 *     the next promotion out of this area empties an anchor slot — the cost the
 *     forty-fifth passed to the forty-sixth in the other area, arriving here.
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
 *     checking rather than remembering: the two interference pairs in this file
 *     are `bayes-theorem` ~ `conditional-probability` and `hypothesis-testing` ~
 *     `bayes-theorem`, all four of those nodes are still here, and the reason
 *     anybody knows the credit edge went is that the check was run again.
 */
const PROBABILITY: MapArea = {
  id: 'probability',
  name: 'Probability',
  covers:
    'From a known mechanism to the behaviour of outcomes: conditioning, random variables, the ' +
    'standard distributions, and the limit theorems. NEITHER THE SAMPLE SPACE NOR COUNTING A ' +
    'PROBABILITY OFF ONE IS PART OF THIS AREA ANY MORE, and that is the one thing worth reading ' +
    'before looking for either: what an outcome is, an event as a subset of the outcomes, ' +
    'equally likely outcomes as the hypothesis that licenses dividing, the complement and ' +
    'addition rules, and then P(E) = |E| / |S| with both sides COUNTED once the space is too big ' +
    'to write down, are all written — as `sample-spaces` and `counting-probability` in the ' +
    '`chance-and-events` subject. Those were this area\'s two lowest nodes, taken in order, so ' +
    'everything left here stands behind written material and the combinatorics this subject ' +
    'rests on is written too. The first node above them is `conditional-probability`, which is ' +
    'where the sample space stops being fixed and starts being replaced by what is known — the ' +
    'move nothing below it makes.',
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
  ],
  nodes: [
    {
      id: 'conditional-probability',
      match: /\b(conditional probability|independence \(probability\))\b/i,
      name: 'Conditional probability',
      is: 'Restricting the sample space to what is known, and independence as the case where restricting changes nothing.',
      needs: ['counting-probability'],
      terms: 'conditional probability independence multiplication rule',
    },
    {
      id: 'bayes-theorem',
      match: /\bbayes('|’)?[- ]?(theorem|rule|law)\b/i,
      name: "Bayes' theorem",
      is: 'Reversing the direction of a conditional — the base rate is the term that gets dropped and the reason the answers feel wrong.',
      needs: ['conditional-probability'],
      confusedWith: [{
        id: 'conditional-probability',
        because:
          'P(A|B) and P(B|A) are read as the same quantity, which is the single most consequential ' +
          'confusion in the subject: it is the prosecutor\'s fallacy and the medical-test error, ' +
          'and it is produced by the notation looking symmetric.',
      }],
      terms: 'bayes theorem prior posterior base rate false positive',
    },
    {
      id: 'random-variables',
      match: /\brandom variable\b/i,
      name: 'Random variables',
      is: 'A number attached to each outcome, which is what lets arithmetic be done on a random situation.',
      needs: ['conditional-probability', 'function-concept'],
      terms: 'random variable discrete continuous distribution pmf pdf',
    },
    {
      id: 'expectation',
      match: /\bexpected value\b/i,
      name: 'Expectation',
      is: 'A weighted average of outcomes, linear whether or not the variables are independent — which is the fact that makes it useful.',
      needs: ['random-variables', 'sigma-notation'],
      terms: 'expectation expected value linearity mean',
    },
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
 *     all four of those nodes are still here.
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
