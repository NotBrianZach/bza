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
 */

import type { MapArea } from './atlas'

const SEQUENCES_AND_SERIES: MapArea = {
  id: 'sequences-and-series',
  name: 'Sequences and series',
  covers:
    'Lists indexed by the naturals, their sums, and when an infinite sum means anything. ' +
    'Convergence is stated and tested here; it is proved in real analysis.',
  nodes: [
    {
      id: 'sequences',
      name: 'Sequences',
      is: 'A function on the naturals, given by a formula or by a recurrence, and those two are not interchangeable.',
      needs: ['function-concept'],
      terms: 'sequence term recurrence relation nth term',
    },
    {
      id: 'arithmetic-sequences',
      name: 'Arithmetic sequences and sums',
      is: 'Constant difference, with the sum obtained by pairing the ends — the argument, not the formula, is the content.',
      needs: ['sequences'],
      terms: 'arithmetic sequence common difference sum of series',
    },
    {
      id: 'geometric-sequences',
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
    {
      id: 'sigma-notation',
      name: 'Sigma notation',
      is: 'Notation for a sum with an index, and the linearity rules that make it manipulable rather than only readable.',
      needs: ['sequences'],
      terms: 'sigma notation summation index linearity',
    },
    {
      id: 'mathematical-induction',
      name: 'Induction',
      is: 'Proving a statement for every natural by proving it is inherited — the base case is not a formality.',
      needs: ['sigma-notation', 'geometric-proof'],
      terms: 'mathematical induction base case inductive step strong induction',
    },
    {
      id: 'sequence-convergence',
      name: 'Convergence of a sequence',
      is: 'What it means for terms to settle down, taken informally here: monotone and bounded is enough, and that claim is the one analysis has to earn.',
      needs: ['geometric-sequences', 'real-number-line'],
      terms: 'convergence limit of a sequence bounded monotone divergent',
    },
    {
      id: 'infinite-series',
      name: 'Infinite series',
      is: 'A sum as the limit of its partial sums, which is why rearranging one can change the answer.',
      needs: ['sequence-convergence', 'sigma-notation'],
      terms: 'infinite series partial sum convergent divergent harmonic',
    },
    {
      id: 'convergence-tests',
      name: 'Convergence tests',
      is: 'Comparison, ratio, root, integral and alternating — a toolkit, and knowing which one the shape of the terms calls for.',
      needs: ['infinite-series'],
      terms: 'ratio test root test comparison test integral test alternating series',
    },
    {
      id: 'power-series',
      name: 'Power series',
      is: 'A series whose terms carry a variable, with a radius of convergence inside which it defines a function.',
      needs: ['convergence-tests', 'polynomial-functions'],
      terms: 'power series radius of convergence interval of convergence',
    },
    {
      id: 'taylor-series',
      name: 'Taylor and Maclaurin series',
      is: 'Building the power series whose derivatives at a point match a given function, and the remainder that says how wrong a truncation is.',
      needs: ['power-series', 'higher-derivatives'],
      exercises: ['higher-derivatives'],
      terms: 'taylor series maclaurin remainder term expansion',
    },
    {
      id: 'fourier-series',
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
      name: 'The limit of a function',
      is: 'What the outputs approach as the input approaches a point — a claim about the neighbourhood, deliberately not about the point itself.',
      needs: ['graphs-of-functions', 'sequence-convergence'],
      terms: 'limit approaches tends to limit laws',
    },
    {
      id: 'one-sided-limits',
      name: 'One-sided limits',
      is: 'Approaching from the left and from the right separately, and a two-sided limit existing exactly when they agree.',
      needs: ['limit-of-a-function', 'piecewise-functions'],
      terms: 'one sided limit left hand right hand jump',
    },
    {
      id: 'indeterminate-forms',
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
      name: 'The squeeze theorem',
      is: 'Trapping a function between two that agree in the limit — the standard route to sin(x)/x and the first genuinely clever limit argument.',
      needs: ['limit-of-a-function', 'trig-graphs'],
      terms: 'squeeze theorem sandwich sin x over x',
    },
    {
      id: 'continuity',
      name: 'Continuity',
      is: 'The limit existing and equalling the value — three conditions, and a function can fail any one of them alone.',
      needs: ['one-sided-limits'],
      terms: 'continuous discontinuity removable jump infinite',
    },
    {
      id: 'intermediate-value-theorem',
      name: 'The intermediate value theorem',
      is: 'A continuous function on an interval hits every value between its endpoints, which is how a root is located without being solved for.',
      needs: ['continuity'],
      terms: 'intermediate value theorem root existence bisection',
    },
    {
      id: 'extreme-value-theorem',
      name: 'The extreme value theorem',
      is: 'Continuous on a closed bounded interval means the maximum is attained — closed and bounded both do work here.',
      needs: ['continuity'],
      terms: 'extreme value theorem maximum attained compact interval',
    },
    {
      id: 'asymptotic-comparison',
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
      name: 'The derivative as a limit',
      is: 'The limit of the difference quotient — instantaneous rate of change defined without ever dividing by zero.',
      needs: ['limit-of-a-function', 'lines-in-the-plane'],
      terms: 'derivative difference quotient tangent line rate of change',
    },
    {
      id: 'differentiability',
      name: 'Differentiability versus continuity',
      is: 'Differentiable implies continuous and not the reverse; the absolute value at zero is the whole counterexample.',
      needs: ['derivative-definition', 'continuity'],
      terms: 'differentiable continuous corner cusp vertical tangent',
    },
    {
      id: 'power-and-sum-rules',
      name: 'Power, sum and constant rules',
      is: 'The first differentiation rules, each proved from the definition rather than asserted.',
      needs: ['derivative-definition', 'binomial-theorem'],
      terms: 'power rule sum rule constant multiple derivative rules',
    },
    {
      id: 'product-and-quotient-rules',
      name: 'Product and quotient rules',
      is: 'The derivative of a product is not the product of derivatives, and the quotient rule is the product rule plus the chain rule.',
      needs: ['power-and-sum-rules'],
      terms: 'product rule quotient rule leibniz',
    },
    {
      id: 'chain-rule',
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
      name: 'Higher derivatives',
      is: 'Differentiating again: the second derivative as concavity, and the notation that keeps the order straight.',
      needs: ['chain-rule'],
      terms: 'second derivative concavity higher order notation',
    },
    {
      id: 'mean-value-theorem',
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
      name: 'Optimisation',
      is: 'Finding a largest or smallest value, where the real difficulty is building the function and its domain, not differentiating it.',
      needs: ['curve-sketching', 'word-problems'],
      terms: 'optimisation maximum minimum constraint critical point',
    },
    {
      id: 'related-rates',
      name: 'Related rates',
      is: 'Differentiating a relation with respect to time, which is the chain rule applied to a situation rather than a formula.',
      needs: ['implicit-differentiation', 'word-problems'],
      terms: 'related rates with respect to time implicit chain rule',
    },
    {
      id: 'linear-approximation',
      name: 'Linear approximation and differentials',
      is: 'Replacing a function by its tangent line nearby, which is the first term of Taylor and the basis of Newton\'s method.',
      needs: ['derivative-definition', 'curve-sketching'],
      terms: 'linear approximation tangent line differential newton method error',
    },
    {
      id: 'lhopital',
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
      name: 'Antiderivatives',
      is: 'Undoing differentiation, where the constant of integration is the statement that the answer is a family.',
      needs: ['derivatives-of-transcendentals'],
      terms: 'antiderivative indefinite integral constant of integration',
    },
    {
      id: 'riemann-sums',
      name: 'Riemann sums',
      is: 'Approximating area by rectangles and refining, which is the definition the antiderivative turns out to compute.',
      needs: ['sigma-notation', 'limit-of-a-function', 'area-and-perimeter'],
      terms: 'riemann sum left right midpoint partition area under curve',
    },
    {
      id: 'definite-integral',
      name: 'The definite integral',
      is: 'The limit of Riemann sums as a number attached to an interval, signed, and additive over subintervals.',
      needs: ['riemann-sums'],
      terms: 'definite integral limits of integration signed area additivity',
    },
    {
      id: 'fundamental-theorem',
      name: 'The fundamental theorem of calculus',
      is: 'Differentiation and integration are inverse — the reason an area is computable at all, and the central theorem of the subject.',
      needs: ['definite-integral', 'antiderivative', 'mean-value-theorem'],
      terms: 'fundamental theorem of calculus evaluation accumulation function',
    },
    {
      id: 'integration-by-substitution',
      name: 'Substitution',
      is: 'The chain rule read backwards, which is why spotting the inner function is the whole skill.',
      needs: ['fundamental-theorem', 'chain-rule'],
      exercises: ['chain-rule'],
      terms: 'substitution u substitution change of variable',
    },
    {
      id: 'integration-by-parts',
      name: 'Integration by parts',
      is: 'The product rule read backwards, where the choice of which factor to differentiate decides whether it helps.',
      needs: ['integration-by-substitution', 'product-and-quotient-rules'],
      terms: 'integration by parts lipet choice of u',
    },
    {
      id: 'trig-integrals-and-substitution',
      name: 'Trigonometric integrals and substitution',
      is: 'Using identities to make an integrand integrable, and turning a radical into a circular function.',
      needs: ['integration-by-parts', 'trig-substitution-setup'],
      terms: 'trigonometric integral trig substitution identity radical',
    },
    {
      id: 'integration-partial-fractions',
      name: 'Integrating a rational function',
      is: 'Decompose, then integrate termwise — every rational function is elementary-integrable, which is special and worth noticing.',
      needs: ['integration-by-substitution', 'partial-fractions-linear'],
      exercises: ['partial-fractions-linear', 'combining-rational'],
      terms: 'partial fractions integration rational function logarithm arctan',
    },
    {
      id: 'improper-integrals',
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
      name: 'Volumes by slicing and revolution',
      is: 'Integrating a cross-sectional area; discs, washers and shells are three bookkeeping choices for one idea.',
      needs: ['area-between-curves', 'solid-geometry'],
      terms: 'volume of revolution disc washer shell cross section',
    },
    {
      id: 'arc-length-and-surface',
      name: 'Arc length and surface area',
      is: 'Integrating an element of length built from Pythagoras, which is why the integrand carries a square root.',
      needs: ['volumes-of-revolution', 'distance-and-midpoint'],
      terms: 'arc length surface of revolution element of length',
    },
    {
      id: 'numerical-integration',
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

const MULTIVARIABLE_CALCULUS: MapArea = {
  id: 'multivariable-calculus',
  name: 'Multivariable calculus',
  covers:
    'Calculus on functions of several variables and on vector fields, up to the three classical ' +
    'theorems that generalise the fundamental theorem.',
  nodes: [
    {
      id: 'functions-of-several-variables',
      name: 'Functions of several variables',
      is: 'A function of a point rather than a number, pictured by level curves instead of a graph.',
      needs: ['three-dimensional-coordinates', 'domain-and-range'],
      terms: 'function of two variables level curve contour surface',
    },
    {
      id: 'partial-derivatives',
      name: 'Partial derivatives',
      is: 'Differentiating in one direction while the rest are held, which is a single-variable derivative on a slice.',
      needs: ['functions-of-several-variables', 'chain-rule'],
      terms: 'partial derivative held constant mixed partial',
    },
    {
      id: 'gradient-and-directional',
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
      name: 'Optimisation in several variables',
      is: 'Critical points from a vanishing gradient, classified by the second-derivative test — with saddle points as a genuinely new outcome.',
      needs: ['multivariable-chain-rule', 'optimisation'],
      terms: 'critical point saddle hessian second derivative test',
    },
    {
      id: 'lagrange-multipliers',
      name: 'Lagrange multipliers',
      is: 'Optimising under a constraint by aligning gradients, which is a geometric statement before it is a method.',
      needs: ['multivariable-optimisation'],
      terms: 'lagrange multiplier constrained optimisation tangency',
    },
    {
      id: 'multiple-integrals',
      name: 'Double and triple integrals',
      is: 'Integrating over a region, where choosing the order of integration is choosing how to describe the region.',
      needs: ['partial-derivatives', 'definite-integral'],
      terms: 'double integral triple integral iterated order of integration',
    },
    {
      id: 'change-of-variables',
      name: 'Change of variables and the Jacobian',
      is: 'Polar, cylindrical and spherical substitution, with the Jacobian as the factor by which the substitution distorts area.',
      needs: ['multiple-integrals', 'polar-coordinates'],
      terms: 'jacobian change of variables polar cylindrical spherical',
    },
    {
      id: 'vector-fields',
      name: 'Vector fields',
      is: 'A vector attached to every point, with divergence and curl as the two local measurements you can make of one.',
      needs: ['gradient-and-directional'],
      terms: 'vector field divergence curl flow',
    },
    {
      id: 'line-integrals',
      name: 'Line integrals and conservative fields',
      is: 'Integrating along a path; a field is conservative exactly when the answer does not depend on which path.',
      needs: ['vector-fields', 'arc-length-and-surface'],
      terms: 'line integral work conservative field potential function',
    },
    {
      id: 'surface-integrals',
      name: 'Surface integrals and flux',
      is: 'Integrating over a surface, where orientation has to be chosen and the choice changes the sign.',
      needs: ['line-integrals', 'change-of-variables'],
      terms: 'surface integral flux orientation normal vector',
    },
    {
      id: 'greens-stokes-divergence',
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
      name: 'What a differential equation is',
      is: 'A relation between a function and its derivatives, where the solution is a family and an initial condition picks one out.',
      needs: ['antiderivative'],
      terms: 'differential equation order initial condition general solution',
    },
    {
      id: 'separable-equations',
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
      name: 'Numerical solution',
      is: 'Euler and Runge–Kutta: stepping forward with a local error you can bound and a global error you mostly cannot.',
      needs: ['direction-fields', 'linear-approximation'],
      terms: 'euler method runge kutta step size local error stiffness',
    },
    {
      id: 'pde-introduction',
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
      name: 'Supremum and completeness',
      is: 'Every bounded set of reals has a least upper bound. This is the axiom the rationals fail, and every theorem below is downstream of it.',
      needs: ['real-number-line', 'mathematical-induction'],
      terms: 'supremum infimum least upper bound completeness axiom dedekind',
    },
    {
      id: 'epsilon-delta',
      name: 'ε-δ and ε-N',
      is: 'Making "approaches" into a quantified statement, which is what turns limit arguments into proofs.',
      needs: ['supremum-and-completeness', 'limit-of-a-function'],
      terms: 'epsilon delta definition of limit quantifier rigorous',
    },
    {
      id: 'cauchy-sequences',
      name: 'Cauchy sequences',
      is: 'Terms getting close to each other rather than to a limit — equivalent to convergence in the reals, and that equivalence IS completeness.',
      needs: ['epsilon-delta', 'sequence-convergence'],
      terms: 'cauchy sequence complete space convergence criterion',
    },
    {
      id: 'bolzano-weierstrass',
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
      name: 'The Riemann integral',
      is: 'Upper and lower sums, with integrability defined as their agreement — which makes "is this integrable" a real question.',
      needs: ['rigorous-differentiation', 'definite-integral'],
      terms: 'riemann integral upper sum lower sum darboux integrability',
    },
    {
      id: 'uniform-convergence',
      name: 'Uniform convergence',
      is: 'When a limit of functions inherits continuity and commutes with integration — pointwise convergence does neither.',
      needs: ['riemann-integral', 'uniform-continuity', 'infinite-series'],
      terms: 'uniform convergence pointwise weierstrass m test interchange limits',
    },
    {
      id: 'metric-spaces',
      name: 'Metric spaces',
      is: 'Keeping only the distance function, after which convergence, continuity and completeness all still make sense.',
      needs: ['cauchy-sequences'],
      terms: 'metric space distance function open ball complete separable',
    },
    {
      id: 'measure-zero-and-lebesgue',
      name: 'Measure and the Lebesgue integral',
      is: 'Replacing the partition of the domain with a measure on it, which integrates the functions Riemann cannot and makes the limit theorems clean.',
      needs: ['riemann-integral', 'metric-spaces'],
      terms: 'measure lebesgue integral null set almost everywhere dominated convergence',
    },
    {
      id: 'functional-analysis-intro',
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
      name: 'Holomorphic functions and Cauchy–Riemann',
      is: 'Complex differentiability, equivalent to a pair of partial differential equations, and it forces the real and imaginary parts to be harmonic.',
      needs: ['complex-limits', 'partial-derivatives'],
      terms: 'holomorphic analytic cauchy riemann equations harmonic conjugate',
    },
    {
      id: 'contour-integration',
      name: 'Contour integration',
      is: 'A line integral in the plane, taken along a curve chosen for convenience rather than given by the problem.',
      needs: ['holomorphic-functions', 'line-integrals'],
      terms: 'contour integral path complex integration',
    },
    {
      id: 'cauchy-integral-theorem',
      name: "Cauchy's theorem and integral formula",
      is: 'A holomorphic function integrates to zero round a closed loop, and its values inside are determined by its values on the boundary.',
      needs: ['contour-integration', 'greens-stokes-divergence'],
      terms: 'cauchy integral theorem integral formula simply connected',
    },
    {
      id: 'complex-power-series',
      name: 'Taylor and Laurent series',
      is: 'Holomorphic means analytic — infinitely differentiable and locally a power series, which has no real-variable analogue.',
      needs: ['cauchy-integral-theorem', 'power-series'],
      terms: 'taylor series laurent series annulus principal part',
    },
    {
      id: 'singularities',
      name: 'Singularities and residues',
      is: 'Classifying the ways a function fails to be holomorphic at a point, and the one coefficient that an integral around it depends on.',
      needs: ['complex-power-series'],
      terms: 'pole essential singularity removable residue',
    },
    {
      id: 'residue-theorem',
      name: 'The residue theorem',
      is: 'Evaluating a contour integral by summing residues, which computes real integrals no real method reaches.',
      needs: ['singularities'],
      exercises: ['improper-integrals'],
      terms: 'residue theorem evaluate real integral contour',
    },
    {
      id: 'conformal-maps',
      name: 'Conformal mapping',
      is: 'Holomorphic maps preserve angles, so they transport a solved boundary-value problem from one region to another.',
      needs: ['holomorphic-functions'],
      terms: 'conformal map angle preserving mobius transformation riemann mapping',
    },
    {
      id: 'analytic-continuation',
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
