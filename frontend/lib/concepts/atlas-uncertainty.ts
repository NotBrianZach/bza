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
      name: 'Conditional probability',
      is: 'Restricting the sample space to what is known, and independence as the case where restricting changes nothing.',
      needs: ['counting-probability'],
      terms: 'conditional probability independence multiplication rule',
    },
    {
      id: 'bayes-theorem',
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
      name: 'Random variables',
      is: 'A number attached to each outcome, which is what lets arithmetic be done on a random situation.',
      needs: ['conditional-probability', 'function-concept'],
      terms: 'random variable discrete continuous distribution pmf pdf',
    },
    {
      id: 'expectation',
      name: 'Expectation',
      is: 'A weighted average of outcomes, linear whether or not the variables are independent — which is the fact that makes it useful.',
      needs: ['random-variables', 'sigma-notation'],
      terms: 'expectation expected value linearity mean',
    },
    {
      id: 'variance-and-covariance',
      name: 'Variance and covariance',
      is: 'Spread as an expected squared deviation, with covariance measuring joint movement and independence implying zero but not conversely.',
      needs: ['expectation'],
      terms: 'variance standard deviation covariance correlation independence',
    },
    {
      id: 'discrete-distributions',
      name: 'The discrete distributions',
      is: 'Bernoulli, binomial, geometric and Poisson — each is a mechanism, and naming the mechanism is how you choose one.',
      needs: ['variance-and-covariance', 'binomial-theorem'],
      terms: 'bernoulli binomial geometric poisson distribution',
    },
    {
      id: 'continuous-distributions',
      name: 'The continuous distributions',
      is: 'Density rather than probability at a point, with uniform, exponential and normal as the three to know.',
      needs: ['random-variables', 'definite-integral'],
      exercises: ['definite-integral'],
      terms: 'probability density function uniform exponential normal gaussian cdf',
    },
    {
      id: 'joint-distributions',
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
      name: 'The law of large numbers',
      is: 'Sample means converge to the expectation — the theorem that licenses estimating anything from a sample at all.',
      needs: ['variance-and-covariance', 'sequence-convergence'],
      terms: 'law of large numbers convergence in probability chebyshev',
    },
    {
      id: 'central-limit-theorem',
      name: 'The central limit theorem',
      is: 'Sums of many independent contributions are approximately normal whatever they came from, which is why the normal is everywhere.',
      needs: ['law-of-large-numbers', 'continuous-distributions'],
      terms: 'central limit theorem normal approximation standard error',
    },
    {
      id: 'markov-chains',
      name: 'Markov chains',
      is: 'A process whose next state depends only on the present one, with the long-run behaviour read off the transition matrix.',
      needs: ['conditional-probability', 'eigenvalues'],
      exercises: ['eigenvalues'],
      terms: 'markov chain transition matrix stationary distribution absorbing recurrent',
    },
    {
      id: 'stochastic-processes',
      name: 'Stochastic processes',
      is: 'Randomness indexed by time: Poisson processes, random walks, and Brownian motion as the continuous limit.',
      needs: ['markov-chains', 'central-limit-theorem'],
      terms: 'poisson process random walk brownian motion martingale',
    },
    {
      id: 'measure-theoretic-probability',
      name: 'Probability as measure theory',
      is: 'A probability is a measure of total mass one, which is the framing that makes conditioning on a continuous variable well defined.',
      needs: ['stochastic-processes', 'measure-zero-and-lebesgue'],
      terms: 'probability space sigma algebra measure radon nikodym conditional expectation',
    },
  ],
}

const STATISTICS: MapArea = {
  id: 'statistics',
  name: 'Statistics',
  covers:
    'From data back to the mechanism: description, estimation, intervals, testing, and regression. ' +
    'Every inferential claim here is a probability statement about the procedure, not about the ' +
    'hypothesis.',
  nodes: [
    {
      id: 'descriptive-statistics',
      name: 'Describing data',
      is: 'Centre, spread and shape of a sample, with the mean-versus-median choice determined by the tail rather than by taste.',
      needs: ['percent', 'sigma-notation'],
      terms: 'mean median mode quartile standard deviation histogram boxplot skew',
    },
    {
      id: 'sampling-and-bias',
      name: 'Sampling and bias',
      is: 'Where the data came from, which decides what any later calculation can possibly be about — and no computation repairs a bad sample.',
      needs: ['descriptive-statistics', 'sample-spaces'],
      terms: 'random sample bias sampling frame selection effect survey nonresponse',
    },
    {
      id: 'sampling-distributions',
      name: 'Sampling distributions',
      is: 'The distribution of a statistic over repeated samples, which is the object every inference is actually about.',
      needs: ['sampling-and-bias', 'central-limit-theorem'],
      terms: 'sampling distribution standard error statistic estimator',
    },
    {
      id: 'point-estimation',
      name: 'Estimation',
      is: 'Bias, variance and consistency as the properties of an estimator, and the trade-off between the first two.',
      needs: ['sampling-distributions'],
      terms: 'estimator bias variance consistency efficiency method of moments',
    },
    {
      id: 'maximum-likelihood',
      name: 'Maximum likelihood',
      is: 'Choosing the parameter that makes the observed data most probable, which turns estimation into optimisation.',
      needs: ['point-estimation', 'optimisation'],
      exercises: ['optimisation'],
      terms: 'likelihood function maximum likelihood log likelihood fisher information',
    },
    {
      id: 'confidence-intervals',
      name: 'Confidence intervals',
      is: 'An interval produced by a procedure that covers the truth 95% of the time — a statement about the procedure, not about this interval.',
      needs: ['point-estimation'],
      terms: 'confidence interval coverage margin of error t distribution',
    },
    {
      id: 'hypothesis-testing',
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
      name: 'Multiple comparisons',
      is: 'Running many tests makes a false positive near-certain, which is why the threshold has to answer to how many questions were asked.',
      needs: ['hypothesis-testing'],
      terms: 'multiple comparisons bonferroni false discovery rate p hacking preregistration',
    },
    {
      id: 'linear-regression',
      name: 'Linear regression',
      is: 'Fitting a line by least squares, with the residuals — not the fit — carrying the information about whether the model holds.',
      needs: ['hypothesis-testing', 'least-squares'],
      exercises: ['least-squares'],
      terms: 'linear regression least squares residual r squared coefficient',
    },
    {
      id: 'multiple-regression',
      name: 'Multiple regression',
      is: 'Several predictors at once, where a coefficient means "holding the others fixed" and collinearity makes that meaningless.',
      needs: ['linear-regression', 'rank-nullity'],
      terms: 'multiple regression collinearity adjusted r squared interaction term',
    },
    {
      id: 'anova-and-design',
      name: 'Experimental design and ANOVA',
      is: 'Randomisation, blocking and the partition of variance — the part of statistics that happens before any data exists.',
      needs: ['multiple-regression', 'sampling-and-bias'],
      terms: 'anova experimental design randomisation blocking factorial',
    },
    {
      id: 'causal-inference',
      name: 'Causal inference',
      is: 'When a correlation licenses a causal claim: confounding, the counterfactual framing, and what an instrument buys.',
      needs: ['anova-and-design', 'conditional-probability'],
      terms: 'causal inference confounding counterfactual instrumental variable dag',
    },
    {
      id: 'bayesian-inference',
      name: 'Bayesian inference',
      is: 'Treating the parameter as random and updating a prior, which answers the question the p-value is mistaken for.',
      needs: ['maximum-likelihood', 'bayes-theorem'],
      terms: 'bayesian inference prior posterior credible interval conjugate mcmc',
    },
    {
      id: 'nonparametric-methods',
      name: 'Nonparametric and resampling methods',
      is: 'Rank tests and the bootstrap, for when the distributional assumption is the weakest part of the argument.',
      needs: ['hypothesis-testing', 'sampling-distributions'],
      terms: 'nonparametric rank test bootstrap permutation test resampling',
    },
    {
      id: 'statistical-learning',
      name: 'Statistical learning',
      is: 'Prediction rather than inference, where overfitting is the central problem and cross-validation the honest measurement.',
      needs: ['multiple-regression', 'maximum-likelihood'],
      terms: 'statistical learning overfitting regularisation cross validation bias variance tradeoff',
    },
    {
      id: 'time-series',
      name: 'Time series',
      is: 'Data where observations are not independent, so the standard errors of ordinary methods are simply wrong.',
      needs: ['multiple-regression', 'stochastic-processes'],
      terms: 'time series autocorrelation stationarity arima seasonality',
    },
  ],
}

export const UNCERTAINTY_AREAS: MapArea[] = [PROBABILITY, STATISTICS]
