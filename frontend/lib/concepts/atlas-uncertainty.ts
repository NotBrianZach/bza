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
 * ONE NODE HAS LEFT THIS FILE, AND IT IS THE ONE THE SENTENCE ABOVE WAS NEVER
 * TRUE OF. `descriptive-statistics` is authored now — the `data-summaries`
 * subject in ontology-statistics.ts, the first written concept anywhere in
 * either of these two areas. It rested on `percent` and `sigma-notation` and on
 * nothing in `probability` at all, because describing a list you have is not
 * reasoning in either direction: there is no mechanism in it and no inference
 * out of it. So the split this file is organised around has three sides rather
 * than two, and the third one is the smallest and the only one written. The
 * departure block above `STATISTICS` records what happened to its edges.
 */

import type { MapArea } from './atlas'

const PROBABILITY: MapArea = {
  id: 'probability',
  name: 'Probability',
  covers:
    'From a known mechanism to the behaviour of outcomes: sample spaces, conditioning, random ' +
    'variables, the standard distributions, and the limit theorems.',
  nodes: [
    {
      id: 'sample-spaces',
      match: /\b(sample space|probability axioms|event \(probability theory\))\b/i,
      name: 'Sample spaces and events',
      is: 'Listing what could happen and taking an event to be a set of those — probability as a measure on that set.',
      needs: ['sets', 'fraction-arithmetic'],
      terms: 'sample space event outcome probability axioms',
    },
    {
      id: 'counting-probability',
      name: 'Equally likely outcomes',
      is: 'Probability as a ratio of counts, which is why combinatorics is the first real technique in the subject.',
      needs: ['sample-spaces', 'counting-principles'],
      exercises: ['counting-principles'],
      terms: 'equally likely favourable outcomes combinatorial probability',
    },
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
