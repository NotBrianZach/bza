/**
 * Structures: the objects, and the mathematics of reasoning about them.
 *
 * Five areas — linear algebra, discrete mathematics, number theory, abstract
 * algebra, topology. They are grouped because what they share is a method: fix
 * a set with some structure on it, and ask what follows from the structure
 * alone.
 *
 * ── WHY `logic-and-proof` LIVES IN DISCRETE RATHER THAN AT THE ROOT ───────
 *
 * Logically it comes first. Pedagogically it does not: a reader with no
 * experience of a proof has nothing to formalise, which is why
 * `geometric-proof` in the foundations is the real entry point and this is the
 * second pass. The prerequisite edge runs from the geometry, and that direction
 * is deliberate.
 */

import type { MapArea } from './atlas'

const LINEAR_ALGEBRA: MapArea = {
  id: 'linear-algebra',
  name: 'Linear algebra',
  covers:
    'Vectors, matrices and linear maps, from solving systems through to the spectral theorem ' +
    'and the singular value decomposition.',
  nodes: [
    {
      id: 'vectors-and-spans',
      name: 'Vectors, linear combinations and span',
      is: 'Adding vectors and scaling them, and the set of everything you can reach that way.',
      needs: ['plane-vectors', 'three-dimensional-coordinates'],
      terms: 'vector linear combination span scalar multiple',
    },
    {
      id: 'linear-independence',
      name: 'Linear independence',
      is: 'When no vector in a set is reachable from the others — the condition that makes a description non-redundant.',
      needs: ['vectors-and-spans'],
      terms: 'linear independence dependence redundant nontrivial combination',
    },
    {
      id: 'matrices-and-maps',
      name: 'Matrices as linear maps',
      is: 'A matrix is a function that respects addition and scaling, and its columns are where the basis vectors go.',
      needs: ['vectors-and-spans', 'function-concept'],
      terms: 'matrix linear transformation columns image',
    },
    {
      id: 'matrix-multiplication',
      name: 'Matrix multiplication',
      is: 'Composition of maps, which is why it is associative and not commutative — the row-by-column rule is a consequence, not the definition.',
      needs: ['matrices-and-maps', 'function-composition'],
      terms: 'matrix multiplication composition associative noncommutative',
    },
    {
      id: 'gaussian-elimination',
      name: 'Gaussian elimination',
      is: 'Row reduction as a systematic solve, with the reduced form telling you the solution set rather than a solution.',
      needs: ['matrices-and-maps', 'systems-of-linear-equations'],
      exercises: ['systems-of-linear-equations'],
      terms: 'gaussian elimination row echelon pivot free variable rank',
    },
    {
      id: 'determinant',
      name: 'The determinant',
      is: 'The signed volume scaling of a map, zero exactly when the map collapses a dimension.',
      needs: ['gaussian-elimination', 'matrix-multiplication'],
      terms: 'determinant volume scaling singular cofactor expansion',
    },
    {
      id: 'matrix-inverse',
      name: 'Invertibility',
      is: 'When a map can be undone, and the half-dozen equivalent conditions that all say the same thing.',
      needs: ['determinant'],
      terms: 'inverse matrix invertible nonsingular identity',
    },
    {
      id: 'vector-spaces',
      name: 'Vector spaces',
      is: 'The axioms abstracted from coordinates, so polynomials and functions become vectors with no change of argument.',
      needs: ['linear-independence'],
      terms: 'vector space axioms subspace function space polynomial space',
    },
    {
      id: 'basis-and-dimension',
      name: 'Basis and dimension',
      is: 'A minimal spanning set, and the theorem that every basis of a space has the same size.',
      needs: ['vector-spaces', 'linear-independence'],
      terms: 'basis dimension coordinates change of basis',
    },
    {
      id: 'rank-nullity',
      name: 'Rank, kernel and the rank–nullity theorem',
      is: 'What a map hits and what it kills, with their dimensions summing to the dimension of the source.',
      needs: ['basis-and-dimension', 'gaussian-elimination'],
      terms: 'rank nullity kernel null space image column space',
    },
    {
      id: 'eigenvalues',
      name: 'Eigenvalues and eigenvectors',
      is: 'Directions a map only stretches, which is what reduces an iterated map to arithmetic on numbers.',
      needs: ['determinant', 'basis-and-dimension', 'polynomial-roots'],
      terms: 'eigenvalue eigenvector characteristic polynomial spectrum',
    },
    {
      id: 'diagonalisation',
      name: 'Diagonalisation',
      is: 'Choosing a basis of eigenvectors so the matrix becomes diagonal — and the obstruction when there are not enough.',
      needs: ['eigenvalues', 'rank-nullity'],
      terms: 'diagonalisation similar matrices jordan form multiplicity',
    },
    {
      id: 'inner-product-spaces',
      name: 'Inner products and orthogonality',
      is: 'Generalising the dot product, which recovers length, angle and projection in any vector space that has one.',
      needs: ['vector-spaces', 'dot-product-geometry'],
      terms: 'inner product orthogonal gram schmidt projection orthonormal',
    },
    {
      id: 'spectral-theorem',
      name: 'The spectral theorem',
      is: 'A symmetric matrix has an orthonormal eigenbasis and real eigenvalues — the cleanest theorem in the subject.',
      needs: ['diagonalisation', 'inner-product-spaces'],
      terms: 'spectral theorem symmetric matrix orthogonal diagonalisation quadratic form',
    },
    {
      id: 'least-squares',
      name: 'Least squares',
      is: 'The best answer to an unsolvable system, which is an orthogonal projection onto the column space.',
      needs: ['inner-product-spaces', 'rank-nullity'],
      terms: 'least squares normal equations projection residual regression',
    },
    {
      id: 'singular-value-decomposition',
      name: 'The singular value decomposition',
      is: 'Every matrix is a rotation, a scaling and another rotation — which is why low-rank approximation works.',
      needs: ['spectral-theorem', 'least-squares'],
      terms: 'singular value decomposition svd low rank approximation pseudoinverse',
    },
    {
      id: 'numerical-linear-algebra',
      name: 'Numerical linear algebra',
      is: 'Conditioning, LU and QR factorisation, iterative methods — where floating point makes the exact theory insufficient.',
      needs: ['singular-value-decomposition', 'gaussian-elimination'],
      terms: 'condition number lu decomposition qr iterative method stability',
    },
  ],
}

const DISCRETE_MATHEMATICS: MapArea = {
  id: 'discrete-mathematics',
  name: 'Discrete mathematics',
  covers:
    'Logic, sets, counting, graphs and recurrences — the mathematics of finite and countable ' +
    'structures, and the formal apparatus of proof.',
  nodes: [
    {
      id: 'propositional-logic',
      name: 'Propositional logic',
      is: 'Connectives and truth tables, with implication as the one whose truth table surprises everybody.',
      needs: ['geometric-proof'],
      terms: 'propositional logic truth table implication contrapositive tautology',
    },
    {
      id: 'quantifiers',
      name: 'Quantifiers',
      is: 'For-all and there-exists, where the order of two different quantifiers changes the claim entirely.',
      needs: ['propositional-logic'],
      terms: 'quantifier universal existential negation of quantifier scope',
    },
    {
      id: 'proof-techniques',
      name: 'Proof techniques',
      is: 'Direct, contrapositive, contradiction and cases — four shapes of argument, each suited to a shape of statement.',
      needs: ['quantifiers'],
      terms: 'direct proof contradiction contrapositive proof by cases counterexample',
    },
    {
      id: 'sets',
      name: 'Sets and set operations',
      is: 'Membership, the operations, and the identities — proved by double inclusion rather than by picture.',
      needs: ['proof-techniques'],
      terms: 'set union intersection complement subset power set venn',
    },
    {
      id: 'relations',
      name: 'Relations',
      is: 'A subset of a product, with equivalence relations partitioning a set and orders arranging it.',
      needs: ['sets'],
      terms: 'relation reflexive symmetric transitive equivalence class partition partial order',
    },
    {
      id: 'functions-formally',
      name: 'Functions, formally',
      is: 'A function as a relation with a uniqueness condition, which is where injective, surjective and bijective get defined properly.',
      needs: ['relations', 'inverse-functions'],
      terms: 'injective surjective bijective image preimage well defined',
    },
    {
      id: 'cardinality',
      name: 'Cardinality and countability',
      is: 'Comparing infinite sets by bijection: the rationals are countable, the reals are not, and the diagonal argument shows it.',
      needs: ['functions-formally', 'real-number-line'],
      terms: 'cardinality countable uncountable diagonal argument bijection aleph',
    },
    {
      id: 'counting-principles',
      name: 'Counting',
      is: 'Product and sum rules, permutations and combinations, with inclusion–exclusion for when the cases overlap.',
      needs: ['sets', 'binomial-theorem'],
      terms: 'permutation combination factorial inclusion exclusion pigeonhole',
    },
    {
      id: 'combinatorial-identities',
      name: 'Combinatorial identities',
      is: 'Proving a counting identity by counting the same set two ways — a style of argument with no algebraic substitute.',
      needs: ['counting-principles', 'mathematical-induction'],
      terms: 'double counting bijective proof binomial identity vandermonde',
    },
    {
      id: 'recurrence-relations',
      name: 'Recurrence relations',
      is: 'Defining a sequence by its predecessors, and solving the linear ones by their characteristic polynomial.',
      needs: ['counting-principles', 'geometric-sequences'],
      terms: 'recurrence relation characteristic root fibonacci master theorem',
    },
    {
      id: 'generating-functions',
      name: 'Generating functions',
      is: 'Encoding a sequence as the coefficients of a power series, so counting becomes algebra.',
      needs: ['recurrence-relations', 'power-series'],
      terms: 'generating function formal power series coefficient extraction convolution',
    },
    {
      id: 'graphs',
      name: 'Graphs',
      is: 'Vertices and edges, with degree, paths and connectedness as the first vocabulary — and the handshake lemma as the first theorem.',
      needs: ['relations'],
      terms: 'graph vertex edge degree path connected handshake lemma',
    },
    {
      id: 'trees',
      name: 'Trees',
      is: 'Connected and acyclic, with the n−1 edge count and the uniqueness of paths as two readings of one fact.',
      needs: ['graphs', 'mathematical-induction'],
      terms: 'tree spanning tree acyclic leaf root forest',
    },
    {
      id: 'graph-algorithms',
      name: 'Graph algorithms',
      is: 'Traversal, shortest paths and minimum spanning trees, where the correctness proof is the mathematics.',
      needs: ['trees'],
      terms: 'breadth first search dijkstra kruskal prim shortest path',
    },
    {
      id: 'graph-colouring-planarity',
      name: 'Colouring and planarity',
      is: 'Euler\'s formula, planar graphs and chromatic number — where easy questions turn out to be genuinely hard.',
      needs: ['graphs', 'proof-techniques'],
      terms: 'graph colouring chromatic number planar euler formula four colour',
    },
    {
      id: 'computability-and-complexity',
      name: 'Computability and complexity',
      is: 'What an algorithm is, what cannot be computed at all, and the P versus NP question as a precise statement.',
      needs: ['cardinality', 'graph-algorithms', 'asymptotic-comparison'],
      terms: 'turing machine halting problem complexity p np reduction',
    },
    {
      id: 'formal-logic-and-incompleteness',
      name: 'Formal systems and incompleteness',
      is: 'Axioms, derivation and models, up to the statement that any adequate system has truths it cannot prove.',
      needs: ['computability-and-complexity', 'quantifiers'],
      terms: 'first order logic model completeness godel incompleteness consistency',
    },
  ],
}

const NUMBER_THEORY: MapArea = {
  id: 'number-theory',
  name: 'Number theory',
  covers:
    'The integers taken seriously: divisibility, congruence, the multiplicative structure of the ' +
    'residues, and the distribution of primes.',
  nodes: [
    {
      id: 'division-algorithm',
      name: 'The division algorithm',
      is: 'Quotient and remainder exist and are unique — the fact every argument about divisibility unwinds to.',
      needs: ['divisibility', 'proof-techniques'],
      terms: 'division algorithm quotient remainder well ordering',
    },
    {
      id: 'euclidean-algorithm',
      name: 'The Euclidean algorithm and Bézout',
      is: 'Computing a gcd by repeated remainder, and the identity that writes it as an integer combination.',
      needs: ['division-algorithm', 'gcd-and-lcm'],
      exercises: ['gcd-and-lcm'],
      terms: 'euclidean algorithm bezout identity extended gcd coprime',
    },
    {
      id: 'modular-arithmetic',
      name: 'Modular arithmetic',
      is: 'Arithmetic on remainders, well defined because congruence respects addition and multiplication — but not division.',
      needs: ['euclidean-algorithm', 'relations'],
      terms: 'congruence modulo residue class modular arithmetic',
    },
    {
      id: 'linear-congruences',
      name: 'Linear congruences and inverses',
      is: 'Solving ax ≡ b, which is solvable exactly when the gcd divides b — so Bézout is the solution method.',
      needs: ['modular-arithmetic'],
      terms: 'linear congruence modular inverse solvability',
    },
    {
      id: 'chinese-remainder',
      name: 'The Chinese remainder theorem',
      is: 'Independent congruences to coprime moduli have a simultaneous solution, which splits a modulus into its prime-power parts.',
      needs: ['linear-congruences'],
      terms: 'chinese remainder theorem coprime moduli simultaneous congruence',
    },
    {
      id: 'fermat-euler',
      name: 'Fermat and Euler theorems',
      is: 'Exponents live modulo φ(n), which is what makes modular exponentiation cheap and RSA possible.',
      needs: ['chinese-remainder', 'exponent-rules'],
      terms: 'fermat little theorem euler totient theorem phi function',
    },
    {
      id: 'primitive-roots',
      name: 'Primitive roots and discrete logarithms',
      is: 'When the units modulo n are generated by a single element, and the asymmetry of inverting that.',
      needs: ['fermat-euler', 'logarithm-definition'],
      terms: 'primitive root multiplicative order discrete logarithm cyclic',
    },
    {
      id: 'quadratic-reciprocity',
      name: 'Quadratic residues and reciprocity',
      is: 'Which numbers are squares modulo p, and the unexpected symmetry between two primes asking about each other.',
      needs: ['primitive-roots'],
      terms: 'quadratic residue legendre symbol reciprocity euler criterion',
    },
    {
      id: 'diophantine-equations',
      name: 'Diophantine equations',
      is: 'Equations required to have integer solutions, where existence is the hard question and descent is the classical tool.',
      needs: ['chinese-remainder', 'pythagoras'],
      terms: 'diophantine equation pell pythagorean triple infinite descent fermat',
    },
    {
      id: 'prime-distribution',
      name: 'The distribution of primes',
      is: 'There are infinitely many, they thin out like 1/log, and the prime number theorem says exactly how.',
      needs: ['prime-factorisation', 'asymptotic-comparison'],
      terms: 'prime number theorem sieve of eratosthenes euclid infinitude density',
    },
    {
      id: 'analytic-number-theory',
      name: 'Analytic number theory',
      is: 'Using complex analysis on the zeta function to count primes, which is where the Riemann hypothesis lives.',
      needs: ['prime-distribution', 'analytic-continuation'],
      terms: 'riemann zeta function dirichlet series euler product riemann hypothesis',
    },
    {
      id: 'cryptographic-number-theory',
      name: 'Number theory in cryptography',
      is: 'RSA and Diffie–Hellman as direct consequences of Euler and of the hardness of the discrete logarithm.',
      needs: ['primitive-roots', 'fermat-euler'],
      terms: 'rsa diffie hellman public key factoring hardness',
    },
  ],
}

const ABSTRACT_ALGEBRA: MapArea = {
  id: 'abstract-algebra',
  name: 'Abstract algebra',
  covers:
    'Groups, rings and fields: what follows from the axioms alone, up to the Galois correspondence ' +
    'and why the quintic has no formula.',
  nodes: [
    {
      id: 'binary-operations',
      name: 'Binary operations and axioms',
      is: 'Closure, associativity, identity and inverse as separable properties — and examples failing exactly one of them.',
      needs: ['functions-formally', 'isometries-and-symmetry'],
      terms: 'binary operation closure associative identity inverse cayley table',
    },
    {
      id: 'groups',
      name: 'Groups',
      is: 'The four axioms, with the symmetries of an object as the motivating example rather than an afterthought.',
      needs: ['binary-operations'],
      terms: 'group abelian order of element symmetric group dihedral',
    },
    {
      id: 'subgroups-and-cosets',
      name: 'Subgroups, cosets and Lagrange',
      is: 'Cosets partition a group into equal blocks, so a subgroup\'s order divides the group\'s — one of the great cheap theorems.',
      needs: ['groups', 'relations'],
      terms: 'subgroup coset lagrange theorem index cyclic subgroup',
    },
    {
      id: 'group-homomorphisms',
      name: 'Homomorphisms and isomorphism',
      is: 'Maps that respect the operation, with the kernel measuring what is lost and isomorphism meaning "the same group".',
      needs: ['subgroups-and-cosets'],
      terms: 'homomorphism isomorphism kernel image structure preserving',
    },
    {
      id: 'quotient-groups',
      name: 'Normal subgroups and quotients',
      is: 'When the cosets form a group themselves, and the first isomorphism theorem as the statement that kernels and quotients are the same thing.',
      needs: ['group-homomorphisms'],
      terms: 'normal subgroup quotient group first isomorphism theorem simple group',
    },
    {
      id: 'group-actions',
      name: 'Group actions',
      is: 'A group acting on a set, with orbits, stabilisers and the counting formula that follows — this is how groups get used.',
      needs: ['quotient-groups', 'counting-principles'],
      terms: 'group action orbit stabiliser burnside orbit counting conjugacy',
    },
    {
      id: 'finite-group-classification',
      name: 'Structure of finite groups',
      is: 'Sylow\'s theorems and the classification of finite abelian groups — how far the axioms alone pin a group down.',
      needs: ['group-actions'],
      terms: 'sylow theorem finite abelian group classification p group solvable',
    },
    {
      id: 'rings',
      name: 'Rings',
      is: 'Two operations instead of one, which admits the integers, polynomials and matrices as the same kind of object.',
      needs: ['groups', 'polynomial-arithmetic'],
      terms: 'ring commutative ring unit zero divisor integral domain',
    },
    {
      id: 'ideals-and-quotient-rings',
      name: 'Ideals and quotient rings',
      is: 'The ring analogue of a normal subgroup, and modular arithmetic as the first example of a quotient.',
      needs: ['rings', 'modular-arithmetic'],
      exercises: ['modular-arithmetic'],
      terms: 'ideal principal ideal quotient ring maximal prime ideal',
    },
    {
      id: 'unique-factorisation-domains',
      name: 'Factorisation in rings',
      is: 'Where unique factorisation survives and where it fails — the failure is what motivated algebraic number theory.',
      needs: ['ideals-and-quotient-rings', 'prime-factorisation'],
      terms: 'euclidean domain principal ideal domain unique factorisation irreducible',
    },
    {
      id: 'fields',
      name: 'Fields',
      is: 'Every nonzero element invertible, with the finite fields as the examples that are not just the usual number systems.',
      needs: ['ideals-and-quotient-rings'],
      terms: 'field finite field characteristic galois field division ring',
    },
    {
      id: 'polynomial-rings',
      name: 'Polynomial rings and irreducibility',
      is: 'Polynomials over a field as a Euclidean domain, with irreducibility playing the role of primality.',
      needs: ['fields', 'polynomial-division'],
      exercises: ['polynomial-division'],
      terms: 'polynomial ring irreducible eisenstein gauss lemma',
    },
    {
      id: 'field-extensions',
      name: 'Field extensions',
      is: 'Building a bigger field by adjoining a root, and measuring the result as a vector space over the smaller one.',
      needs: ['polynomial-rings', 'basis-and-dimension'],
      terms: 'field extension degree algebraic element minimal polynomial splitting field',
    },
    {
      id: 'galois-theory',
      name: 'Galois theory',
      is: 'A correspondence between subfields and subgroups, which converts a question about roots into a question about a group.',
      needs: ['field-extensions', 'quotient-groups'],
      terms: 'galois group correspondence solvable by radicals quintic constructible',
    },
    {
      id: 'representation-theory',
      name: 'Representation theory',
      is: 'Realising a group as matrices, so linear algebra answers questions the group axioms alone cannot.',
      needs: ['group-actions', 'spectral-theorem'],
      terms: 'representation character irreducible schur lemma maschke',
    },
  ],
}

const TOPOLOGY: MapArea = {
  id: 'topology',
  name: 'Topology',
  covers:
    'What survives when distance is dropped and only nearness is kept: continuity, compactness, ' +
    'connectedness, and the first invariants.',
  nodes: [
    {
      id: 'topological-spaces',
      name: 'Topological spaces',
      is: 'Declaring which sets are open and requiring only unions and finite intersections — less structure than a metric, and enough for continuity.',
      needs: ['metric-spaces', 'sets'],
      terms: 'topological space open set closed set basis subspace topology',
    },
    {
      id: 'closure-and-interior',
      name: 'Closure, interior and boundary',
      is: 'The largest open set inside, the smallest closed set outside, and what is left over — with density as a consequence.',
      needs: ['topological-spaces'],
      terms: 'closure interior boundary dense limit point',
    },
    {
      id: 'topological-continuity',
      name: 'Continuity without distance',
      is: 'Preimages of open sets are open, which is equivalent to ε-δ on a metric space and makes sense where ε does not.',
      needs: ['closure-and-interior', 'uniform-continuity'],
      terms: 'continuous map preimage open homeomorphism topological equivalence',
    },
    {
      id: 'compactness',
      name: 'Compactness',
      is: 'Every open cover has a finite subcover — the property that makes "closed and bounded" work, generalised correctly.',
      needs: ['topological-continuity', 'bolzano-weierstrass'],
      terms: 'compact open cover finite subcover heine borel tychonoff',
    },
    {
      id: 'connectedness',
      name: 'Connectedness',
      is: 'Not splittable into two open pieces, which is what the intermediate value theorem is really a statement about.',
      needs: ['topological-continuity'],
      terms: 'connected path connected component intermediate value',
    },
    {
      id: 'separation-and-metrisability',
      name: 'Separation axioms',
      is: 'Hausdorff and its relatives: how much a topology has to allow points to be told apart before it behaves.',
      needs: ['compactness'],
      terms: 'hausdorff regular normal separation axiom urysohn metrisable',
    },
    {
      id: 'quotient-and-product-spaces',
      name: 'Products and quotients',
      is: 'Building new spaces by gluing or multiplying, which is how the torus and the Möbius band get defined precisely.',
      needs: ['separation-and-metrisability', 'relations'],
      terms: 'product topology quotient space gluing identification torus mobius',
    },
    {
      id: 'homotopy-and-fundamental-group',
      name: 'Homotopy and the fundamental group',
      is: 'Loops up to deformation, forming a group whose non-triviality detects a hole.',
      needs: ['quotient-and-product-spaces', 'groups'],
      terms: 'homotopy fundamental group loop covering space simply connected',
    },
    {
      id: 'homology',
      name: 'Homology',
      is: 'Counting holes of each dimension by linear algebra on chains, which is computable where homotopy is not.',
      needs: ['homotopy-and-fundamental-group', 'rank-nullity'],
      terms: 'homology chain complex betti number euler characteristic exact sequence',
    },
    {
      id: 'manifolds',
      name: 'Manifolds',
      is: 'Spaces that look locally like Euclidean space, which is the minimum needed to do calculus on something curved.',
      needs: ['quotient-and-product-spaces', 'multivariable-chain-rule'],
      terms: 'manifold chart atlas tangent space smooth structure',
    },
    {
      id: 'differential-forms',
      name: 'Differential forms and Stokes',
      is: 'The object an integral really eats, under which Green, Stokes and divergence become one equation.',
      needs: ['manifolds', 'greens-stokes-divergence'],
      exercises: ['greens-stokes-divergence'],
      terms: 'differential form exterior derivative wedge product generalised stokes',
    },
  ],
}

export const STRUCTURE_AREAS: MapArea[] = [
  LINEAR_ALGEBRA,
  DISCRETE_MATHEMATICS,
  NUMBER_THEORY,
  ABSTRACT_ALGEBRA,
  TOPOLOGY,
]
