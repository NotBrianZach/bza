/**
 * A seventh subject ontology: the step from arithmetic into algebra.
 *
 * ── Why this subject, and why it is its own ───────────────────────────────
 *
 * `variables-and-expressions` was a map node in `algebra-foundations`, and it
 * was the single unwritten concept standing on the route of TWO journeys —
 * "Run a function backwards" and "Find where an expression breaks" — each of
 * which had exactly one unwritten step left. Writing it finishes both, which
 * is worth more than reducing a sixteen-step route to fifteen.
 *
 * It is a subject of its own rather than an addition to an existing one, and
 * the reason is the same one that produced ontology-arithmetic.ts. Every
 * other authored subject declares a boundary in its `covers` that that concept
 * falls outside of:
 *
 *  - `arithmetic-foundations` says "nothing symbolic — the moment a letter
 *    stands for an unknown it is algebra". That is exactly this concept.
 *  - `rational-expressions` starts at polynomial arithmetic, and
 *    `polynomial-arithmetic` is the ROOT of that subject's own view. Filing
 *    this underneath it would make that root gated, so the whole subject
 *    would stop being introducible on its own terms.
 *  - `functions-and-inverses` is about functions. A letter standing for a
 *    number is what a function is written WITH, not a kind of function.
 *
 * So the layer beneath gets its own subject and joins the rest through the
 * area's `links`, which is the pattern ontology-arithmetic.ts established:
 * each subject keeps a standalone view that is still a valid, walkable
 * ontology, and the gates between subjects exist only in the composed map.
 *
 * ── THE SECOND CONCEPT, AND THE REFUSAL IT HAD TO OVERTURN ────────────────
 *
 * `linear-equations` is the other half the subject was named for, and this
 * file declined it IN WRITING when it was created. The refusal is reproduced
 * here rather than deleted, because half of it was right and the half that was
 * wrong is wrong in a way worth being able to recognise again:
 *
 *   Solving is a genuinely different skill from reading — it is about which
 *   operations preserve a truth, not about what a letter means — and it needs
 *   a task kind this build does not have: "solve for x" asks for the SET of
 *   numbers satisfying a condition, and no `NamedForm` and no `evaluate`
 *   target expresses a solution set. Authoring them as substitute-and-check
 *   tasks would drill verification and never ask for the solving, which is the
 *   proxy-task failure tasks.ts warns about.
 *
 * THE FIRST SENTENCE STANDS. There is still no `solve` kind, a solution is in
 * general a set, and no `evaluate` target expresses one. Nothing below claims
 * otherwise.
 *
 * THE LAST SENTENCE WAS FALSE, and types.ts names the counterexample three
 * screens from where the refusal was written. `solve-exponential-1` is a
 * shipped solve-for-x task of kind `evaluate`: it asks for the x satisfying
 * 9^x = 27, and its `given` carries `log(c, b)` — the expression the METHOD
 * leaves x equal to once logs have been taken of both sides. The learner reads
 * the equation, does the solving, and submits a number that is ruled exactly.
 * That is not substitute-and-check. The refusal had collapsed two different
 * limits into one: `evaluate` cannot express a solution SET, but it rules a
 * solution VALUE perfectly, and "the number the method produces" is a value.
 *
 * So the three tasks below that ask for a solution carry the method's own
 * output in `given` — `(c + b)/a` for ax − b = c, `(d - b)/(a - c)` for
 * ax + b = cx + d — and the prompt carries the equation. Same shape as the
 * exponential one, for the same reason, and the one-variable case is where it
 * is safest: with a ≠ 0 there is exactly one solution, so the set and the
 * value coincide and nothing is being rounded off.
 *
 * ── THE THIRD CONCEPT, AND THE OTHER HALF OF THAT SAME REFUSAL ────────────
 *
 * `systems-of-linear-equations` was declined in writing twice: once by the
 * section this one replaces, and once more sharply in tests/atlas.mjs, which
 * said it "DOES NOT INHERIT THE UNBLOCKING" above, on the grounds that a
 * system "resolves to a point, a line, or nothing", that "no solution" and
 * "every point on this line" are not values, and that the solution-set limit
 * therefore binds it "directly and in its own right". That is a better
 * argument than the first refusal made, it is careful to disclaim the easy
 * mistake of inheriting a block, and it is still wrong. How it is wrong is the
 * part worth keeping, because the same shape has now caught three concepts in
 * this build:
 *
 *   A SOLUTION SET IS NOT ONE THING TO ASK FOR. What `evaluate` cannot take is
 *   a set AS AN ANSWER. What it can take is the NUMBER THAT DECIDES ONE. For a
 *   system those are two different questions, and only the first is blocked.
 *
 * In the generic case the answer is a POINT. A point is not a value, and it is
 * TWO values — so a pair of `evaluate` tasks is what a point costs, which is a
 * price rather than an obstacle. The two tasks on the first knowledge point
 * ask for the x and for the y of one system, and neither number can be reached
 * without carrying out the elimination. tasks.ts already ships a pair that
 * means nothing read singly and the whole knowledge point read together —
 * `gained-solution-satisfies-the-new-equation-1` with
 * `gained-solution-fails-the-original-1` — so this is an established shape in
 * the file rather than one invented to get past a refusal.
 *
 * `given` carries the METHOD'S OWN OUTPUT here as it does above, and that is
 * what makes the first point honest rather than formulaic. Eliminate y from
 * ax + by = c and dx + ey = f on the letters instead of on the numbers —
 * multiply the first by e, the second by b, subtract — and what is left is
 * (ae − bd)x = ce − bf. So `(c*e - b*f)/(a*e - b*d)` is not a formula being
 * quoted at the learner; it is the elimination they are being asked to do,
 * performed once in general. The same is true of the substitution task, whose
 * `given` is what putting ax + b in for y leaves.
 *
 * In the DEGENERATE cases the limit binds exactly as the refusal said, and the
 * concession is worth stating before the answer to it: no task in this concept
 * asks how many solutions a system has, because "none" and "every point on
 * this line" are not values and nothing below pretends they are. What IS
 * askable is the number the elimination LEAVES. Double 2x + 3y = 7 and take
 * 4x + 6y = 11 off it and both letters go together, leaving 0 = 3; do it
 * against 4x + 6y = 14 instead and it leaves 0 = 0. Three and nought are
 * values, they are produced by doing the mathematics rather than by reporting
 * a conclusion about it, and which of the two comes out IS the distinction
 * between no solutions and infinitely many. The concept above reached the same
 * place by the same route for its own third point, where one number satisfying
 * a transformed equation and failing the original was the only form in which
 * "the solution set changed" could be said.
 *
 * AND THE DECIDING NUMBER IS THE DENOMINATOR OF THE FIRST POINT'S ANSWER,
 * which is the one fact that makes this a single concept rather than three
 * loosely related procedures. ae − bd is what the elimination divides by, and
 * it is zero exactly when one equation's left side is a multiple of the
 * other's — which is when both letters cancel together and the right-hand
 * sides are left to decide between nothing and the whole line. 2·6 − 3·4 = 0
 * for the pair in the third point; 2·(−1) − 3·5 = −17 for the system in the
 * first. The third knowledge point ends there deliberately.
 *
 * WHAT REMAINS TRUE AFTER ALL THREE PROMOTIONS. There is no `solve` kind, a
 * solution is in general a set, and no `evaluate` target expresses one.
 * Nothing above claims otherwise, and the sentence that keeps failing is never
 * that one — it is the inference from it to "therefore this concept cannot be
 * authored". That inference has now been drawn and withdrawn three times, for
 * `dot-product-geometry` (ontology-vectors.ts, where the useful question
 * turned out to be which DIRECTION the engine limit ran in: evaluating cos 16°
 * is out of reach, producing a cosine as a quotient is arithmetic), for
 * `linear-equations` above (a set against a value), and for this one (a set
 * against the number that decides a set). Three is enough to call it a
 * pattern: a refusal resting on a task-kind limit should name the exact
 * question it cannot ask, because the neighbouring question is usually askable
 * and is usually the one worth asking.
 *
 * ── THE FOURTH CONCEPT, AND THE FOURTH TIME THAT INFERENCE WAS WITHDRAWN ───
 *
 * `gaussian-elimination` was the last unwritten concept on any journey's route
 * in the whole build, and two files refused it in writing. Reproduced rather
 * than deleted, for the reason the refusals above are:
 *
 *   ontology-matrices.ts: "row reduction's answer is a matrix in a normal
 *   form, and checking 'is this in reduced row echelon form' is a `form` check
 *   over a structure the engine has no type for."
 *
 *   tests/atlas.mjs: what stops it is that "solve for x" asks for a solution
 *   SET and no `NamedForm` and no `evaluate` target expresses one, "which is a
 *   decision about what counts as evidence rather than an authoring job".
 *
 * BOTH HALVES OF THE FIRST ONE ARE TRUE AND NEITHER IS A BLOCK. There is no
 * matrix type, and `form` cannot express row-echelon shape. What follows from
 * that is not "this concept cannot be authored" but "this concept cannot be
 * authored AS A MATRIX TASK" — and ontology-matrices.ts had already settled
 * what to do about exactly that, two headings above the refusal: the engine
 * has no matrix type, so every task there asks for ONE ENTRY with the grid
 * living in the prompt. That is not a reduction of the subject, as that file
 * argues at length; it is how the subject is performed. The same move applied
 * here does not even need a grid in the prompt, because row reduction on three
 * equations is three equations, and that is what the material below is written
 * as throughout.
 *
 * THE SECOND REFUSAL IS THE SAME SENTENCE THIS FILE HAS ALREADY WITHDRAWN
 * TWICE, applied a third time and wrong for the third time. The answer to a
 * 3×3 solve is a TRIPLE, so it is not a value, and it is three values — a
 * triple costs three tasks the way a point cost two, which is a price and not
 * an obstacle. The forward pass produces the first of the three outright, and
 * the two tasks on the second knowledge point are the other two. When a row
 * empties the answer is again not a value, and again the number that DECIDES
 * it is: 0 = 3 against 0 = 0, generalised one letter up from the concept above.
 *
 * So the inference has now been drawn and withdrawn FOUR times — for
 * `dot-product-geometry`, for `linear-equations`, for
 * `systems-of-linear-equations`, and here. Each withdrawal was cheaper than
 * the last because the pattern was already written down, and the fourth took
 * the last unwritten concept off the last unfinished route. A refusal resting
 * on a task-kind limit should name the exact question it cannot ask; the
 * neighbouring question is usually askable, and is usually the one worth
 * asking.
 *
 * WHAT A FOURTH EXPIRY SAYS ABOUT THE REMAINING ONES. `linear-inequalities`
 * below is still blocked and the paragraph on it is still the right analysis —
 * it names a different obstacle rather than the same one waiting out its term.
 * The distinction to carry forward is that three of the four expired refusals
 * described the ANSWER'S SHAPE and the surviving ones describe the MOVE: an
 * answer's shape can almost always be swapped for a deciding number, and a
 * claim about the relation symbol has no number behind it to swap to.
 *
 * ── THE FIFTH CONCEPT, AND THE FIRST ONE NO REFUSAL STOOD IN FRONT OF ─────
 *
 * `nonlinear-systems` was a node of `algebra-foundations` and is the last
 * concept below. Four files had argued against the four concepts above it and
 * not one of them mentions this node, which is worth a sentence because it is
 * the first time that has been true in this subject: the three expired refusals
 * were all the same inference from the same task-kind limit, and this node never
 * attracted one because its answer was never the problem. A line meeting a
 * conic has two intersection points, each of them a pair of numbers, and a pair
 * costs two tasks — which is the price `systems-of-linear-equations` already
 * paid two concepts up.
 *
 * IT IS A FORK AND NOT THE FIFTH LINK OF THE CHAIN, which is the one structural
 * thing about this promotion that a reader must not get wrong. The four
 * concepts above are a chain — reading, then one equation, then two, then three
 * with the order fixed — and every assertion written about this subject so far
 * could have been phrased as an ordered walk and still have been correct. This
 * concept rests on `systems-of-linear-equations`, four back from the end of the
 * array and NOT on `gaussian-elimination` directly above it. Three unknowns are
 * nothing to do with it; what it borrows is the two-equation idea that a
 * solution is a PAIR and that one equation can be spent to remove one letter.
 * So `systems-of-linear-equations` now has two dependents in this file where it
 * had one, and an assertion phrased as "the subject is a chain in array order"
 * would accept this concept hung off the row reduction by accident. What
 * tests/concepts-logic.mjs asserts instead is the branch POINT, by name.
 *
 * ── THE OTHER PREREQUISITE IS THE QUADRATIC, AND IT COULD NOT COME HERE ───
 *
 * The node declared two `needs`. `systems-of-linear-equations` is a concept of
 * this subject, so that edge is an ordinary prerequisite below.
 * `quadratic-formula` is a concept of `rational-expressions`, and an authored
 * ontology may only name concepts it contains — so that edge has nowhere to
 * live but `ALGEBRA_FOUNDATIONS.links`, filed with the area that owned the
 * departing node rather than with the subject holding the far end. Both of its
 * ends are authored, so unlike a `links` entry pointing at an unwritten node it
 * gates from the moment it exists.
 *
 * That makes two promotions in a row costing `links` an entry, where the first
 * three cost it nothing. The cause is the same one the paragraph on the fourth
 * promotion names and it is not an accident of this area: a branch authored
 * from the bottom up keeps finding a local owner for its stranded edges, and
 * stops the moment a node's `needs` reach sideways into a subject somebody else
 * wrote. This one reaches into the quadratics, which were authored long before
 * this file existed.
 *
 * `confusedWith` on the departing node: NONE, checked before deleting it, as on
 * the four promotions above. `exercises`: none either, which the fourth
 * promotion had and which is why it is now checked separately — a map node's
 * `exercises` becomes an `encompasses` edge in `expandEdges` and vanishes with
 * the node just as silently as a `confusedWith` does. Both absences are
 * asserted rather than described, because an absence has to be looked for to be
 * known.
 *
 * ── AND NO CREDIT EDGE, WHICH IS A JUDGEMENT RATHER THAN AN OVERSIGHT ─────
 *
 * `gaussian-elimination => systems-of-linear-equations` is in the list below
 * because the last step of the forward pass IS a two-equation elimination, and
 * the two tasks are ruled by the SAME expression at different coefficients.
 * The obvious move is to claim the same thing here, on the grounds that the
 * first knowledge point substitutes one equation into another and the second
 * concept's second point is called `substitution-reduces-the-system-to-one-
 * equation`.
 *
 * Measured against the tasks rather than against the names, it does not hold.
 * What a learner performs here is the quadratic formula at coefficients the
 * substitution produced — `nonlinear-line-meets-circle-x-1`'s expression is the
 * formula, not the linear substitution's `(e - d*b)/(c + d*a)` — and the move
 * the two-equation concept drills, multiplying one whole equation through so
 * that a letter's coefficients cancel and then adding, is performed NOWHERE in
 * this concept. The third point's subtraction comes closest and is still not
 * it: the two squared terms are already identical, so nothing is multiplied
 * through and one subtraction does the work. So the credit claim would be about
 * the word "substitute" and not about the arithmetic, and a review deferred on
 * that evidence would be deferred on work the learner did not do. Declining it
 * costs a learner one review they may not need; granting it wrongly costs them
 * a prerequisite they never demonstrated, and the second is the error this edge
 * kind exists to avoid rather than to commit.
 *
 * ── What is STILL deliberately not here ───────────────────────────────────
 *
 * The degenerate cases OF A SINGLE EQUATION. When the x-terms cancel in one
 * linear equation it is either an identity satisfied by every number or a
 * contradiction satisfied by none, and those two outcomes are what `evaluate`
 * cannot ask for directly. They are not missing from `linear-equations` by
 * accident and they are not what it is about: the node's own one-liner is
 * "solving by doing the same thing to both sides, which works because equality
 * is preserved by any invertible operation".
 *
 * What the subject CAN say about them it now says twice, in the two places the
 * sentence is a value rather than a set. `linear-equations`' third point
 * exhibits one number that satisfies a transformed equation and not the one it
 * came from. `systems-of-linear-equations`' third point exhibits the leftover
 * of an elimination that killed both letters, and that one covers the empty and
 * the universal solution set both — because a system of two equations in two
 * unknowns is the smallest place where those outcomes arise from a METHOD
 * rather than from an equation chosen to be degenerate.
 *
 * `linear-inequalities` is what is left mapped, and it is blocked for a reason
 * none of the three overturned refusals answers: its answer is an INTERVAL, a
 * set with no finite list of deciding numbers behind it, and the move that
 * matters — multiplying by a negative reverses the relation — is a claim about
 * the relation symbol, which no `NamedForm` and no `evaluate` target mentions
 * at all. That is a different obstacle from "a set is not a value" and should
 * not be read as the same one waiting to expire.
 *
 * THE CONICS THEMSELVES, which the fifth concept uses and does not teach. It
 * solves systems in which one equation is a circle or a parabola, and it says
 * nothing about why x² + y² = r² is a circle, where a parabola's vertex is, or
 * what the other two conics look like. That is deliberate and it is a boundary
 * rather than a backlog: every equation in the material is handed over in
 * coordinates and every question asked of it is answered by algebra, so a
 * learner who has never heard the word "conic" can do all of it. The figures
 * are what makes the second knowledge point intelligible rather than what makes
 * it rulable — a line can cut a curve twice, touch it once or miss it, and
 * those three pictures are named in the prose where the discriminant's three
 * signs are produced. `circles-analytic` and `conic-sections` are nodes of
 * `euclidean-geometry` and are where the shapes belong; this concept names
 * neither in its `needs` and neither in its material, because nothing here
 * depends on either. The map node agreed — it declared `systems-of-linear-
 * equations` and `quadratic-formula` and nothing geometric — which is the
 * check that this boundary was the map's reading and not an authoring
 * convenience.
 *
 * ── THIS TIGHTENS THE GATE, AS AUTHORING ALWAYS DOES ──────────────────────
 *
 * Before this file, `gatingPrerequisitesOf` looked straight through
 * `variables-and-expressions` — it had no material, so it made no claim about
 * mastery and could not gate. `polynomial-arithmetic` and `function-concept`
 * were therefore gated by the arithmetic alone. Now there is a concept in
 * between that has to be demonstrated, so both move one step further from a
 * cold account.
 *
 * That is the design working rather than a regression (see
 * `gatingPrerequisitesOf`: gating tightens, never loosens, as material is
 * authored), and it is checked by name in tests/atlas.mjs.
 *
 * IT HAS NOW HAPPENED A SECOND TIME, one layer up, and to three nodes at once.
 * `linear-inequalities`, `systems-of-linear-equations` and `word-problems` all
 * name `linear-equations` in their own `needs` and all three were still map
 * nodes. While it was mapped-only the walk looked straight through it and
 * reported `variables-and-expressions`; now it gates in its own right, so all
 * three are one demonstration further from a cold account without anybody
 * editing them. Also checked by name, because three nodes acquiring a real
 * prerequisite is invisible from their own definitions.
 *
 * A THIRD TIME, AND THE TENSE ABOVE IS WHY THIS IS WORTH ITS OWN PARAGRAPH.
 * One of those three — `systems-of-linear-equations` — is a concept of this
 * subject now, so the sentence "all three are still map nodes" had to become
 * "were". Two nodes still rest on `linear-equations` and are checked as such;
 * the third has moved up a layer and is doing the gating itself. What it
 * tightened in turn is `nonlinear-systems` here and `gaussian-elimination` in
 * `linear-algebra`, both of which named it while it had no material and were
 * therefore gated by `linear-equations` through it. Neither was edited.
 *
 * The shape of this file's history is that paragraph three times over: every
 * promotion out of `algebra-foundations` tightens the gate on whatever rests
 * on the departing node, and every assertion recording a previous tightening
 * is phrased about nodes that may themselves be promoted next. There is no way
 * to write those claims so they never need amending — only the choice between
 * amending them and letting them rot.
 *
 * A FOURTH TIME, AND IT MADE THREE GATING SETS SHORTER RATHER THAN LONGER,
 * which reads backwards until you have the definition in front of you.
 * `gatingPrerequisitesOf` names the NEAREST teachable ancestors and looks
 * through the unteachable ones, so while `gaussian-elimination` had no material
 * the walk passed through it and reported what IT rested on — `matrices-and-maps`
 * and `systems-of-linear-equations`, two names for one unwritten node. Now the
 * walk stops at the node itself. `determinant` in `matrices-and-determinants`
 * goes from three gating concepts to two, and `rank-nullity` and
 * `numerical-linear-algebra` — both nodes of `linear-algebra` at the time, the
 * first of them a concept of `vectors-and-independence` since the thirtieth
 * promotion — do the same, with no edit to any of the three. A tighter gate is
 * a SHORTER list, so the quantity to assert
 * is membership and not length — and the figure has to be computed before and
 * after rather than predicted, because which way the count moves depends on how
 * many prerequisites the promoted node had.
 *
 * The gate on `determinant` is the one worth naming, because it crosses into
 * another subject through an entry in `LINEAR_ALGEBRA.links` — row reduction is
 * how a determinant is computed past 3×3 — so authoring here changed what a
 * matrices concept waits on, in a file this one does not touch and whose text
 * says nothing about it.
 *
 * ── Why every task here is `evaluate`, and the form that is missing ───────
 *
 * Collecting like terms is the natural `transform_to_form` ask and it cannot
 * be asked. There is no `collected` form, and the two that come closest both
 * fail in the way types.ts warns about for `maxDenominatorDegree`: `5x + 2 +
 * 3x − 7 + x²` is ALREADY a sum of monomials, so `expanded` is satisfied by
 * the input unchanged, and the equivalence check passes trivially because the
 * input is equivalent to itself. The task would be a free mark.
 *
 * So the tasks ask the one checkable question in the vicinity — the collected
 * form and the original must agree at every x, so they agree at x = 3 — and
 * each prompt names what it is standing in for. That keeps the subject
 * gradable with no math worker configured, which matters more here than
 * elsewhere: the first concept sits directly above arithmetic on the entry
 * route, so a worker outage must not wall it off.
 *
 * The equations half is `evaluate`-only for a different reason — there is no
 * `solve` kind at all, rather than a form that half-fits — and it holds the
 * worker-free property too. Every reference below is reached by exact rational
 * arithmetic on whole numbers, including the two answers that are not integers
 * (7/4 and 1/2, each chosen precisely so the division cannot be guessed past),
 * so the whole subject still rules with nothing configured.
 *
 * The systems half is `evaluate`-only for the same reason as the equations
 * half and keeps the same property, which is not a coincidence worth passing
 * over: a system is where the arithmetic first gets long enough that a worker
 * looks necessary, and it is not. Cramer's expressions in the coefficients are
 * four multiplications and two subtractions, and every one of the seven
 * references is an exact rational. A subject sitting this low on the entry
 * route must not acquire a service dependency at its top.
 *
 * The row-reduction half is where that contract was most at risk and it holds
 * unchanged. `transform_to_form` is the kind row reduction asks for in every
 * other telling — "put this in row echelon form" — and it is unavailable twice
 * over: there is no `NamedForm` for echelon shape and nothing in `expr.ts` can
 * hold a grid to check the shape OF. What is left is the numbers the pass
 * produces, and the seven tasks are all of them: a reduced coefficient, the
 * value the bottom row is left holding, the two coordinates the upward pass
 * recovers, the leftover of an emptied row in each of its two outcomes, and one
 * coordinate of one solution when a letter is left free. Every reference is an
 * exact rational on whole numbers, two of them deliberately not integers.
 *
 * The nonlinear half is `evaluate`-only for the same reason and holds the
 * property too, which took one choice rather than none. Every reference is an
 * exact INTEGER here, and that is not laziness about the arithmetic: the
 * quadratic a substitution leaves has irrational roots for almost every line
 * anybody writes down, and `quadratic-formula` already owns the surd — two of
 * its tasks exist precisely to refuse a decimal. What this concept is about is
 * which pairs come out and how many there are, so the systems are chosen so
 * that the roots do not fight the point being made. The two `sqrt` calls in its
 * eight tasks are the formula and a back-substitution into a square, and both
 * land on whole numbers because the circle was given radius 5 and the chord was
 * put at x = 3 — the same 3–4–5 triangle twice, which is also why a learner can
 * check either answer against a figure they already know.
 *
 * ── Objectives name `evaluate` and nothing else, which is a change of habit ─
 *
 * `variables-and-expressions` names `['evaluate', 'justify']` on two of its
 * three objectives and no `justify` task exists anywhere in the build. That is
 * defensible on the letter of types.ts — a justify task WOULD evidence those
 * objectives — and it is still a claim with nothing behind it, which is the
 * exact failure the "never empty" rule was written to prevent, one step up.
 *
 * The three objectives on `linear-equations` therefore name only the kind they
 * actually ship. Each was also phrased so that `evaluate` genuinely evidences
 * it: the third one asks for the VALUE of each side at the number a
 * non-invertible step created, rather than for an account of why the step was
 * illegal. The account is worth asking for and is asked for — in `socratic`,
 * where an unrulable question belongs, rather than in `taskKinds`, where it
 * would promise an observation that cannot be made.
 *
 * `systems-of-linear-equations` holds the same rule and its third objective is
 * where the rule did real work rather than being easy to obey. The obvious
 * phrasing is "say whether a system has no solutions, one, or infinitely
 * many", and that objective would be unsatisfiable by anything this build can
 * observe — it names a classification, and no verifiable kind returns one. So
 * it asks instead for the number the elimination leaves, which is a value, and
 * says in the statement what the two possible values mean. The classification
 * is the thing to understand and the leftover is the thing to produce; putting
 * the first in `taskKinds` would have been a curriculum claiming an
 * observation it cannot make, which is the failure the never-empty rule exists
 * one level below to prevent.
 *
 * `gaussian-elimination` holds the rule too, and the question it had to keep
 * out of `taskKinds` is the best question in the concept: WHY fixing the order
 * turns a search into a procedure, which is the whole difference between this
 * and the concept below it. No verifiable kind returns an argument, so that one
 * is asked in `socratic` — the fourth subgoal of the first point — while the
 * objective names what can be observed, the value the bottom row is left
 * holding. Its third objective is the generalisation of the one above and keeps
 * the same shape: the leftover is produced, the classification is not claimed.
 *
 * `nonlinear-systems` holds the rule and its second objective is where the rule
 * did the most work of any in this file. The natural phrasing is "say whether
 * the line cuts the curve twice, touches it once, or misses it", and that
 * objective names a classification — which is the shape the concept above
 * caught and refused, one subject earlier than this one existed. So it asks for
 * the DISCRIMINANT, which is a value, and says in the statement what the three
 * signs of it mean. The same distinction twice over in one file is the argument
 * for writing it down: the leftover and the discriminant are different numbers
 * doing identical work, each the one thing `evaluate` can be given when the
 * answer a learner should carry away is a count.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'expressions-and-equations',
  name: 'Expressions and equations',
  covers:
    'What a letter standing for a number means: the two readings of one, an unknown a ' +
    'condition pins down and a variable a claim holds for; terms, and which of them collect; ' +
    'and substituting a signed number back in. Then solving one equation in one unknown — ' +
    'undoing the operations in reverse order, collecting the unknown when it stands on both ' +
    'sides, and why the rule is that the same move on both sides must be INVERTIBLE rather ' +
    'than merely the same. Then two equations in two unknowns: eliminating a letter by ' +
    'combining the equations, substituting when one of them already names a letter, and the ' +
    'two outcomes that are not a point — which arise when the elimination kills both letters ' +
    'and the number it leaves behind decides between no solution and every point on one line. ' +
    'Then three equations in three unknowns, where combining whichever two look convenient ' +
    'stops working and the order has to be fixed: clear one letter out of every row below the ' +
    'first, clear the next out of the row below that, and a staircase is left whose bottom row ' +
    'holds one letter — then come back up it, each row having exactly one letter in it you do ' +
    'not yet know. And the case where a row empties of every letter at once, which is the ' +
    'two-unknown leftover with one more letter in play. ' +
    'And then one equation of a pair stops being linear, which is a branch off the two-unknown ' +
    'case rather than a step past the three-unknown one: combining the equations no longer ' +
    'cancels anything, because a letter and its square are not multiples of each other, so what ' +
    'is left is substitution — and what substitution leaves is a QUADRATIC, which is why the ' +
    'count of solutions stops being one number and becomes the discriminant. Two intersection ' +
    'points where the linear case had one, a repeated root where a line touches a curve instead ' +
    'of crossing it, and no real root at all where it misses — and missing is the ordinary case ' +
    'here, not a degeneracy of contradictory equations. Each root has to be paired with its OWN ' +
    'partner coordinate, since a solution is a point and the four numbers two points are made ' +
    'of can be combined wrongly. When neither equation names a letter the linear move comes ' +
    'back one level up: if two conics carry the same squared terms, one subtraction removes both ' +
    'at once and leaves a line, which is where the intersection points are and nothing else is. ' +
    'What is not here is the inequality, whose answer is an interval and whose one interesting ' +
    'step is a claim about the relation symbol rather than about a number, so no form and no ' +
    'evaluate target can ask for it; it is still mapped only. Nor is the matrix: the engine has ' +
    'no type for a grid, so the row reduction here is written as equations throughout and ' +
    'nothing asks for a matrix in a normal form. Nor are the SHAPES: the nonlinear systems are ' +
    'solved in coordinates and nothing here says why one of the equations draws a circle or ' +
    'where a parabola\'s vertex is, which is `circles-analytic` and `conic-sections` on the ' +
    'map. The three pictures are named where the three signs of a discriminant are produced, ' +
    'and that is the whole of the geometry this subject claims.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'variables-and-expressions',
    name: 'Variables and expressions',
    subjectId: subject.id,
    scope: {
      id: 'variables-and-expressions',
      label: 'Variables and expressions',
      hint: 'variable algebraic expression term coefficient',
      /*
       * Carried verbatim from the map node this concept was promoted out of.
       *
       * Deliberately unchanged. The pattern decides against an article title,
       * and widening it at the same time as writing the material would make
       * two changes at once — the recognition figure in tests/atlas.mjs would
       * move and there would be no way to say which edit moved it.
       */
      match: /\b(algebraic expression|elementary algebra)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'tell-an-unknown-from-a-variable',
        statement:
          'Say whether the letter in a given sentence is an unknown that a condition pins down ' +
          'or a variable that a claim holds for, and say what would count as an answer to each.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'collect-the-terms-that-collect',
        statement:
          'Break an expression into terms, collect the ones whose non-numeric part is identical, ' +
          'and leave the others standing as separate terms.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'substitute-a-signed-number',
        statement:
          'Substitute a negative number into an expression, supplying the brackets the letter was ' +
          'standing in for, and finish by the order of operations.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-letter-has-two-readings',
        conceptId: 'variables-and-expressions',
        statement:
          'A letter can be an unknown — one particular number, not yet named, that a condition ' +
          'picks out — or a variable, standing for any number at all in a claim that holds for ' +
          'all of them. Nothing in the symbol says which. The sentence it sits in says, and that ' +
          'decides what would count as an answer.',
        position: 1,
        /*
         * No `automaticityTarget`. This point is read-and-explain, and a timing
         * target on "say which reading is in force" measures typing — the case
         * types.ts names when it argues the field should usually be absent.
         */
        workedExample: {
          problem:
            'In 3x − 7 = 11 and in 3(x + 2) = 3x + 6, say which reading of x is in force in each, ' +
            'and what would count as an answer.',
          subgoals: [
            {
              label: 'Ask what each sentence claims about x',
              detail:
                'The first is a condition: true for some numbers and false for others, so it is ' +
                'singling one out. The second is a claim: it asserts that two ways of writing the ' +
                'same quantity agree, and it singles nothing out.',
              socratic:
                'Try a few numbers in each of these two sentences. What is different about how ' +
                'the two of them respond?',
            },
            {
              label: 'Test each with numbers',
              detail:
                '3x − 7 = 11 at x = 6 gives 18 − 7 = 11, which is true; at x = 5 it gives 8, which ' +
                'is not. So the first sentence accepts 6 and rejects 5. 3(x + 2) = 3x + 6 at x = 5 ' +
                'gives 21 on both sides, and at x = −1 gives 3 on both sides. Nothing has ' +
                'separated the two sides yet.',
              socratic:
                'You have found a number that satisfies the first sentence and a number that ' +
                'fails it. What happens when you go looking for a number that fails the second?',
            },
            {
              label: 'Read off what would count as an answer',
              detail:
                'For the unknown an answer is a number, and substituting it back is the check — ' +
                'which is why 6 settles the first sentence completely. For the variable no single ' +
                'number can be the answer, because the claim is about all of them: a substitution ' +
                'that works is one case and establishes nothing, and what settles it is the ' +
                'distributive law. A substitution that FAILED would disprove it, and that is the ' +
                'one thing substitution can do here.',
              socratic:
                'Substituting 5 made both sides of the second sentence equal. How much of the ' +
                'claim has that settled?',
            },
          ],
          answer:
            'In 3x − 7 = 11 the x is an unknown, and the answer is the number 6. In ' +
            '3(x + 2) = 3x + 6 the x is a variable, and the answer is that the two sides are the ' +
            'same number for every x — by the distributive law, not by substitution.',
        },
      },
      {
        id: 'terms-collect-only-when-the-letters-match',
        conceptId: 'variables-and-expressions',
        statement:
          'An expression breaks apart at its + and − signs into terms, and inside a term ' +
          'everything is multiplied together. Two terms collect only when the non-numeric part of ' +
          'each is identical, because collecting is the distributive law read backwards — which is ' +
          'also why 3x + 2x² does not collect, however much it looks as though it should.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Simplify 5x + 2 + 3x − 7 + x², and say why the answer is not a single term.',
          subgoals: [
            {
              label: 'Cut the expression at its + and − signs',
              detail:
                'Five terms: 5x, +2, +3x, −7, +x². Each sign belongs to the term that follows it, ' +
                'which is why −7 is a term and not an instruction to do something to the 2.',
              socratic:
                'Where are you allowed to cut this expression into pieces that can be handled ' +
                'independently, and what happens to a minus sign when you cut just before it?',
            },
            {
              label: 'Find which terms share a non-numeric part',
              detail:
                '5x and 3x are each a number times x. 2 and −7 are numbers with no letter at all. ' +
                'x² is x · x, and nothing else here has an x · x in it.',
              socratic:
                'Two of these five terms have exactly the same letter part as each other. Which ' +
                'two — and what is the letter part of x²?',
            },
            {
              label: 'Collect by running the distributive law backwards',
              detail:
                '5x + 3x = (5 + 3)x = 8x. That is the entire justification, and it works only ' +
                'because x stands for a number and the law holds for numbers. The constants ' +
                'collect the same way: 2 − 7 = −5.',
              socratic:
                'What is it that allows 5x + 3x to be written as 8x — and would that same reason ' +
                'work on 5x + 3x²?',
            },
            {
              label: 'Say where it has to stop',
              detail:
                'x², 8x and −5 have three different non-numeric parts — x · x, x, and nothing — so ' +
                'no further collecting is legal. Three terms is the finished answer; an expression ' +
                'not coming down to one thing is the ordinary case, not unfinished work.',
              socratic:
                'You are left with three terms. What would have to be true of two of them for the ' +
                'simplification to carry on?',
            },
          ],
          answer: 'x² + 8x − 5',
        },
      },
      {
        id: 'substituting-supplies-the-hidden-brackets',
        conceptId: 'variables-and-expressions',
        statement:
          'An expression is a recipe rather than a number: it has a value only once the letter ' +
          'has one. Putting a number in means writing out the arithmetic the letter stood for — ' +
          'and a letter carries its sign and its wholeness invisibly, so a negative number needs ' +
          'brackets written down that the letter never needed.',
        position: 3,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Evaluate 5 − 2x + x² at x = −3.',
          subgoals: [
            {
              label: 'Write the substitution with the brackets the letter was hiding',
              detail:
                '2x means 2 · x, so at x = −3 it is 2 · (−3), written 2(−3). The whole expression ' +
                'becomes 5 − 2(−3) + (−3)². Writing 5 − 2 − 3 + −3² instead is not a slip of ' +
                'notation; it is a different expression.',
              socratic:
                'x is one single number here, and that number is negative. What has to appear in ' +
                '2x when you write the −3 in, that was not needed while it was still x?',
            },
            {
              label: 'Let the order of operations finish it',
              detail:
                'The product binds tighter than the subtraction, so 2(−3) = −6 first, and then ' +
                '5 − (−6) = 5 + 6 = 11. The power binds tighter still: (−3)² = (−3)(−3) = 9. ' +
                'Together, 11 + 9 = 20.',
              socratic:
                'There are three operations waiting here and only one of them may go first. ' +
                'Which, and what decides that it is that one?',
            },
            {
              label: 'Check the square against the one it is not',
              detail:
                '(−3)² = 9, because x² is x · x and the letter\'s minus sign is inside the number ' +
                'it stands for. Written −3², the convention applies the power to the 3 alone and ' +
                'negates afterwards, giving −9. Two expressions differing by one pair of brackets, ' +
                'with answers of opposite sign — the same lesson brackets taught in arithmetic, ' +
                'now with a letter to hide the brackets from you.',
              socratic:
                '(−3)² and −3² are not the same number. Which of them is x² at x = −3, and which ' +
                'rule of reading decides that?',
            },
          ],
          answer: '20',
        },
      },
    ],
  },
  {
    id: 'linear-equations',
    name: 'Linear equations in one variable',
    subjectId: subject.id,
    scope: {
      id: 'linear-equations',
      label: 'Linear equations in one variable',
      hint: 'linear equation solve for x balance both sides',
      /*
       * Carried verbatim from the map node, for the reason the concept above
       * gives and which applies again unchanged: widening the pattern at the
       * same time as writing the material would move the recognition figure in
       * tests/atlas.mjs with no way to say which of the two edits moved it.
       *
       * Worth knowing that it is deliberately singular. `\b` after "equation"
       * fails against "equations", so this matches the provider's own title
       * "Linear equation" and not a plural heading. That is the right side of
       * the trade for a `checked` claim — a pattern loose enough to catch every
       * plural would also catch "system of linear equations", which is a
       * different concept and still a map node.
       */
      match: /\blinear equation\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'solve-by-undoing-in-reverse-order',
        statement:
          'Solve a linear equation in one unknown by applying the inverse of each operation to ' +
          'both sides, undoing them in the reverse of the order they were applied, and produce ' +
          'the number that satisfies it.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'collect-the-unknown-before-undoing',
        statement:
          'Given an equation with the unknown on both sides, subtract one of its terms in the ' +
          'unknown from both sides to reduce it to the one-sided case, and produce the solution ' +
          '— reaching the same number whichever side is cleared.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'show-a-non-invertible-step-changed-the-solutions',
        statement:
          'When a step on both sides is not invertible, produce the value of each equation at a ' +
          'number the transformed one admits, exhibiting that it satisfies the new equation and ' +
          'not the original.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'undo-the-operations-in-reverse-order',
        conceptId: 'linear-equations',
        statement:
          'An equation says two expressions name the same number. Applying one operation to both ' +
          'sides keeps that true, so the way to reach the unknown is to undo what was done to it ' +
          '— last operation first, because that is the order a sequence comes apart in. The ' +
          'condition is that each operation undone is invertible; dividing by 3 qualifies ' +
          'because 3 is not zero, and that is the whole of why the rule says invertible.',
        position: 1,
        /*
         * Timed, unlike the point below it. Reaching for the right inverse in
         * the right order is a procedure that has to become fluent before an
         * equation can be a step inside a longer problem rather than the
         * problem — which is the case types.ts names for setting the field at
         * all. The third point is untimed for the opposite reason.
         */
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Solve 3x − 7 = 11.',
          subgoals: [
            {
              label: 'Read the left side as a recipe and find which step came last',
              detail:
                '3x − 7 says: take x, multiply by 3, then subtract 7. The order matters for what ' +
                'follows, because undoing a sequence of operations means undoing it backwards — ' +
                'so the subtraction, being last, is the first thing to go.',
              socratic:
                'The left side does two things to x. Which of the two happens last, and what in ' +
                'the way it is written tells you so?',
            },
            {
              label: 'Undo the last step, on both sides at once',
              detail:
                'Add 7 to both sides: 3x − 7 + 7 = 11 + 7, so 3x = 18. The reason both sides get ' +
                'it is that 3x − 7 and 11 are two names for ONE number. Add 7 to that number and ' +
                'you have one number again, so whatever is written on each side still names the ' +
                'same thing.',
              socratic:
                'You want the −7 gone. What single operation removes it — and why does the 11 ' +
                'have to receive it too?',
            },
            {
              label: 'Undo the multiplication, and name the condition that permits it',
              detail:
                'Divide both sides by 3: x = 6. This is allowed because 3 is not zero. That is ' +
                'the condition rather than a technicality — division by zero is the one ' +
                'arithmetic operation with no inverse, which is exactly why the rule is "any ' +
                'invertible operation" and not "any operation".',
              socratic:
                'One operation is left to undo. What is it, and what would have to be true of ' +
                'the 3 for that undoing to be impossible?',
            },
            {
              label: 'Say why this is the whole solution set and not just one answer',
              detail:
                'Both moves were reversible: adding 7 undoes subtracting 7, dividing by 3 undoes ' +
                'multiplying by 3. So 3x − 7 = 11 and x = 6 are satisfied by exactly the same ' +
                'numbers, which makes 6 the only one. Substituting back gives 18 − 7 = 11 and ' +
                'confirms the arithmetic, but it is the reversibility and not the substitution ' +
                'that rules out a second answer — one substitution could never do that.',
              socratic:
                'You have a number that works. What is it about the steps you took — rather than ' +
                'about checking the answer — that tells you no second number also works?',
            },
          ],
          answer: 'x = 6',
        },
      },
      {
        id: 'the-unknown-on-both-sides-is-collected-first',
        conceptId: 'linear-equations',
        statement:
          'When the unknown appears on both sides there is no single chain of operations to ' +
          'reverse, so nothing can be undone yet. Subtracting a term in the unknown from both ' +
          'sides is the move that fixes it, and it is the same move as subtracting a number: ' +
          'once x stands for a number, 2x names a number too, and adding 2x back undoes it.',
        position: 2,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'Solve 5x + 4 = 2x + 19.',
          subgoals: [
            {
              label: 'Try to name the last operation, and find that there is not one',
              detail:
                'x occurs in two places, so the equation is not one chain of operations applied ' +
                'to a single x. "Undo the last thing first" has nothing to take hold of until ' +
                'the unknown is in one place, which is what makes collecting a step in its own ' +
                'right rather than tidying.',
              socratic:
                'Try to say what the last thing done to x was here. Where does that question ' +
                'break down?',
            },
            {
              label: 'Subtract one of the terms in the unknown from both sides',
              detail:
                'Subtract 2x from both sides: 5x + 4 − 2x = 2x + 19 − 2x, so 3x + 4 = 19. This ' +
                'is not a new kind of move. Once x stands for a number, 2x names a number, so ' +
                'this is the same operation as subtracting 4 — and it is invertible, since ' +
                'adding 2x back returns the equation you started from.',
              socratic:
                'Subtracting 4 from both sides was allowed. What makes subtracting 2x from both ' +
                'sides the same kind of move rather than a new one needing its own licence?',
            },
            {
              label: 'Finish as the one-sided case',
              detail:
                'The unknown is in one place now, so the previous point applies as written: ' +
                'subtract 4 to get 3x = 15, then divide by 3 to get x = 5. Checking, the left ' +
                'side is 25 + 4 = 29 and the right is 10 + 19 = 29.',
              socratic:
                'The unknown is in one place. Which problem have you turned this into, and what ' +
                'are the two steps still to do?',
            },
            {
              label: 'Clear the other side instead, and compare the answers',
              detail:
                'Subtract 5x rather than 2x: 4 = −3x + 19, then subtract 19 to get −15 = −3x, ' +
                'then divide by −3 to get x = 5. The same number, and that is the point worth ' +
                'taking away: both subtractions are invertible, so both preserve the solutions, ' +
                'and nothing about the method depends on which side you clear. The second route ' +
                'divides by a negative, which is where a sign slip lives and the reason it is ' +
                'worth walking once.',
              socratic:
                'Suppose you had cleared the 5x instead of the 2x. Would you expect the same ' +
                'number out — and what property of both moves decides that?',
            },
          ],
          answer: 'x = 5',
        },
      },
      {
        id: 'a-non-invertible-step-changes-the-solutions',
        conceptId: 'linear-equations',
        statement:
          '"Do the same thing to both sides" was never the whole rule — the same thing has to be ' +
          'invertible. Multiply both sides by an expression that can be zero and the new equation ' +
          'can be satisfied by numbers the old one rejects, because at the value where the ' +
          'multiplier is zero the step cannot be undone. The solutions were not rearranged; they ' +
          'were changed.',
        position: 3,
        /*
         * No `automaticityTarget`, and the contrast with the two points above
         * is the argument for the field existing. Those are procedures and
         * fluency in them is the skill. This one asks which of two steps is
         * invertible and why, and a timing target on that measures typing —
         * the case types.ts makes for leaving it absent.
         */
        workedExample: {
          problem:
            'Solve 2x − 6 = 0. Then multiply both sides by x − 1 and compare what the two ' +
            'equations are satisfied by.',
          subgoals: [
            {
              label: 'Solve it as it stands, so there is something to compare against',
              detail:
                'Add 6 to both sides to get 2x = 6, then divide by 2 to get x = 3. Both steps ' +
                'are invertible, so by the first point 3 is not merely a solution but the only ' +
                'one. That single-element solution set is the thing the next step will disturb.',
              socratic:
                'Before changing anything: which numbers satisfy this equation, and how many of ' +
                'them are there?',
            },
            {
              label: 'Multiply both sides by x − 1 and ask what the result admits',
              detail:
                'The left side becomes (x − 1)(2x − 6) and the right becomes 0 · (x − 1), which ' +
                'is 0. A product is zero exactly when one of its factors is, so (x − 1)(2x − 6) ' +
                '= 0 is satisfied by x = 1 and by x = 3. Two numbers, where the equation it came ' +
                'from had one.',
              socratic:
                'The right side was 0, and zero times anything is zero. Which numbers satisfy ' +
                'the equation you are now looking at, and how does that count compare with the ' +
                'one you started from?',
            },
            {
              label: 'Put the extra number back into the original equation',
              detail:
                'At x = 1 the original left side is 2(1) − 6 = −4, and −4 is not 0. So 1 ' +
                'satisfies the multiplied equation and fails the one it was derived from. The ' +
                'step did not rewrite the equation into an equivalent one; it produced a ' +
                'different question with a different answer.',
              socratic:
                'One of your two numbers is new. Put it into the equation you started with — ' +
                'what does each side come to?',
            },
            {
              label: 'Name the property that the multiplier by 2 has and x − 1 does not',
              detail:
                'Multiplying both sides by 2 is invertible: divide by 2 and you are back. ' +
                'Multiplying by x − 1 is not, because at x = 1 the multiplier IS zero, and ' +
                'multiplying by zero cannot be undone — every number is sent to 0, so nothing ' +
                'about the original survives at that one value. This is the word "invertible" in ' +
                'the first point doing work rather than decorating, and it is where the ' +
                'extraneous roots of a radical equation come from: squaring both sides fails the ' +
                'same test, since two numbers share a square.',
              socratic:
                'Multiplying both sides by 2 is safe; multiplying both sides by x − 1 is not. ' +
                'What is true of the first multiplier at every value of x that is not true of ' +
                'the second one at x = 1?',
            },
          ],
          answer:
            '2x − 6 = 0 has the single solution 3. After multiplying both sides by x − 1, ' +
            '(x − 1)(2x − 6) = 0 is satisfied by 1 and by 3. The 1 was created by the step: at ' +
            'x = 1 the multiplier x − 1 is zero and multiplying by zero has no inverse, so that ' +
            'step falls outside the rule the first point states.',
        },
      },
    ],
  },
  {
    id: 'systems-of-linear-equations',
    name: 'Systems of two linear equations',
    subjectId: subject.id,
    scope: {
      id: 'systems-of-linear-equations',
      label: 'Systems of two linear equations',
      hint: 'simultaneous equations elimination substitution system',
      /*
       * Carried verbatim from the map node, for the reason both concepts above
       * give: widening a pattern at the same time as writing the material
       * would move the recognition figure in tests/atlas.mjs with no way to
       * say which of the two edits moved it.
       *
       * It does not collide with `linear-equations`' pattern and the reason is
       * worth knowing, because the two look like they should. That one is
       * `/\blinear equation\b/i` — singular, with the `\b` after "equation"
       * failing against "equations" — so the provider's title "System of
       * linear equations" is matched by this concept and by nothing else. The
       * note on that pattern predicted exactly this case as the reason not to
       * loosen it, and this is the promotion that cashes the prediction in.
       */
      match: /\bsystem of linear equations\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'eliminate-a-letter-and-produce-both-coordinates',
        statement:
          'Solve a system of two linear equations in two unknowns by multiplying one equation ' +
          'through so that one letter\'s coefficients cancel, adding the equations to remove it, ' +
          'and producing each coordinate of the point that satisfies both.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'substitute-and-reach-the-same-point',
        statement:
          'Given a system in which one equation already names a letter in terms of the other, ' +
          'solve it by substituting that expression — reducing the system to one equation in one ' +
          'unknown — and produce the same coordinate elimination gives for the same system.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-leftover-when-both-letters-cancel',
        statement:
          'When the elimination removes both letters at once, produce the number it leaves on ' +
          'the right: nought when the second equation repeats the first, so every pair on one ' +
          'line solves the system, and anything else when the two equations contradict, so no ' +
          'pair does.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'eliminate-a-letter-by-combining-the-equations',
        conceptId: 'systems-of-linear-equations',
        statement:
          'One linear equation in two unknowns is satisfied by infinitely many pairs, so neither ' +
          'equation of a system decides anything on its own and a solution is a PAIR rather than ' +
          'a number. The way in is to combine the two equations so that one letter cancels: ' +
          'adding equals to equals gives equals, so the combination is a condition every pair ' +
          'satisfying both must satisfy — and it has only one letter left in it.',
        position: 1,
        /*
         * Timed, and at 25 seconds rather than the 20 the two procedural points
         * in `linear-equations` carry. The longest figure in the subject, and
         * deliberately: before the first inverse can be applied there is a
         * multiplication through an entire equation and an addition of two,
         * which is two equations' worth of arithmetic that a one-sided solve
         * does not have. Fluency here is what lets a system be a step inside a
         * longer problem rather than the problem, which is the case types.ts
         * makes for setting the field at all.
         */
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Solve 2x + 3y = 12 and 5x − y = 13.',
          subgoals: [
            {
              label: 'Check what one equation alone settles, and find that it is nothing',
              detail:
                '2x + 3y = 12 is satisfied by (0, 4), by (3, 2), by (6, 0) and by infinitely ' +
                'many other pairs. 5x − y = 13 is satisfied by (2, −3), by (3, 2) and by (4, 7). ' +
                'So neither equation picks out a pair; what the system asks for is the pair — ' +
                'here it looks like just one — that appears in both lists.',
              socratic:
                'Find two different pairs that satisfy 2x + 3y = 12. How many do you think there ' +
                'are, and what does that tell you about what one equation on its own can settle?',
            },
            {
              label: 'Multiply one equation through so that a letter\'s coefficients cancel',
              detail:
                'The y terms are +3y and −y. Multiplying the second equation by 3 gives ' +
                '15x − 3y = 39, and now the y terms are +3y and −3y. Multiplying both sides of ' +
                'an equation by 3 is invertible, so the new equation is satisfied by exactly the ' +
                'same pairs as the one it came from — which is the licence for changing it at all.',
              socratic:
                'You want the y terms to destroy each other when the two equations meet. The ' +
                'coefficients are 3 and −1 — what would you have to do to one whole equation to ' +
                'arrange that, and why is doing it allowed?',
            },
            {
              label: 'Add the two equations, which removes the letter and leaves one unknown',
              detail:
                'Adding 2x + 3y = 12 to 15x − 3y = 39 gives 17x = 51, so x = 3. The addition is ' +
                'legal because each side of each equation names the same number as the other, so ' +
                'the sum of the two left sides names the sum of the two right sides. The y terms ' +
                'contribute 3y − 3y = 0, which is the whole purpose of the previous step.',
              socratic:
                'Add the left sides together and the right sides together. What justifies that, ' +
                'and what has happened to the y?',
            },
            {
              label: 'Recover the other coordinate, then check the pair in the equation you did not use',
              detail:
                'Putting x = 3 into 5x − y = 13 gives 15 − y = 13, so y = 2. The check has to be ' +
                'in the OTHER equation: 2(3) + 3(2) = 6 + 6 = 12. Substituting back into the ' +
                'equation you just used cannot fail, because y was computed from it — so it ' +
                'checks nothing. The pair (3, 2) satisfying both is the answer.',
              socratic:
                'You have x = 3 and, from one of the equations, y = 2. Which equation should you ' +
                'put the pair into to find out whether you have made an arithmetic slip, and why ' +
                'does it have to be that one?',
            },
          ],
          answer: 'x = 3 and y = 2 — the single pair (3, 2), which satisfies both equations.',
        },
      },
      {
        id: 'substitution-reduces-the-system-to-one-equation',
        conceptId: 'systems-of-linear-equations',
        statement:
          'When one equation already names a letter in terms of the other, that expression and ' +
          'the letter are two names for one number wherever the equation holds — so putting it ' +
          'in for the letter changes no pair\'s status. The point of doing it is that the second ' +
          'equation becomes one equation in one unknown, which is the problem already solved. ' +
          'Elimination and substitution reach the same pair because both are the same move: ' +
          'spend one equation to remove one letter.',
        position: 2,
        /*
         * Timed, for the reason the point above is, and at the same figure. The
         * knowledge point's CONTENT is that two routes agree, which is a
         * comparison rather than a drill — but the task it sets is the
         * substitution itself, and that is a procedure whose fluency is the
         * skill. A timing target has to describe what is actually being asked.
         */
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Solve y = 2x − 1 and 3x + 2y = 12, then solve the same system by elimination.',
          subgoals: [
            {
              label: 'Notice that one equation already names a letter',
              detail:
                'y = 2x − 1 does not have to be rearranged: it says that whatever x turns out to ' +
                'be, y is 2x − 1. That makes "y" and "2x − 1" two names for one number for every ' +
                'pair on that line, and interchangeable in anything else that holds there.',
              socratic:
                'Of the two equations, one is already in a shape the other is not. What is that ' +
                'equation telling you that you could use somewhere else?',
            },
            {
              label: 'Put the expression in for the letter, with the brackets the letter was hiding',
              detail:
                '3x + 2y = 12 becomes 3x + 2(2x − 1) = 12. The brackets are not optional: y ' +
                'stands for one whole number, so 2y is twice the whole of 2x − 1, and writing ' +
                '3x + 2 · 2x − 1 = 12 is a different equation. This is the hidden-bracket rule ' +
                'from `variables-and-expressions`, with an expression substituted rather than a ' +
                'negative number.',
              socratic:
                'You are replacing y by 2x − 1 inside 2y. What has to be written down that was ' +
                'not needed while it was still a single letter?',
            },
            {
              label: 'Count the unknowns, and solve the equation that is left',
              detail:
                'Only x occurs now, so this is a linear equation in one unknown and the previous ' +
                'concept applies as written. Collecting gives 3x + 4x − 2 = 12, so 7x − 2 = 12, ' +
                'then 7x = 14 and x = 2. Putting that back into y = 2x − 1 gives y = 3, and ' +
                'checking the pair in the equation that was substituted into: 3(2) + 2(3) = 12.',
              socratic:
                'How many different letters are in the equation now, and which problem does that ' +
                'make it?',
            },
            {
              label: 'Run the same system by elimination, and compare the answers',
              detail:
                'Rewrite y = 2x − 1 as 2x − y = 1 and eliminate: double it to get 4x − 2y = 2, ' +
                'add 3x + 2y = 12, and the y terms cancel to leave 7x = 14, so x = 2 again. The ' +
                'agreement is not a coincidence and it is not two methods checking each other. ' +
                'Both routes spend one equation to delete one letter, and both deletions are ' +
                'invertible, so neither changes which pairs satisfy the system — so neither can ' +
                'reach a different pair.',
              socratic:
                'Both routes gave x = 2. Would you expect that of any system, or was this one ' +
                'lucky — and what do the two methods have in common that decides it?',
            },
          ],
          answer:
            'x = 2 and y = 3, by substitution and by elimination alike — the pair (2, 3).',
        },
      },
      {
        id: 'when-both-letters-cancel-the-leftover-decides',
        conceptId: 'systems-of-linear-equations',
        statement:
          'Sometimes the elimination removes both letters at once, and what is left is a sentence ' +
          'with no letter in it to make true or false by choosing. That sentence is the answer. ' +
          'If it is false, no pair satisfies both equations; if it is true, the second equation ' +
          'asked for nothing the first had not, and every pair on that one line is a solution. ' +
          'Neither outcome is a failure of the method — the method ran and reported.',
        position: 3,
        /*
         * No `automaticityTarget`, and the contrast with the two points above is
         * the argument for the field existing — the same contrast
         * `linear-equations` draws at its own third point. Those two are
         * procedures and fluency in them is the skill. This one asks what a
         * leftover 0 = 3 means about a pair of lines, and a timing target on
         * that measures typing.
         */
        workedExample: {
          problem:
            'Try to solve 2x + 3y = 7 with 4x + 6y = 11. Then try the same with 4x + 6y = 14.',
          subgoals: [
            {
              label: 'Eliminate as usual, and find that both letters go together',
              detail:
                'Double the first equation: 4x + 6y = 14. Taking 4x + 6y = 11 off it removes the ' +
                'x terms and the y terms in one stroke, leaving 0 = 3. There is no x to divide ' +
                'for and nothing to substitute back into, because the step that was supposed to ' +
                'leave one unknown left none.',
              socratic:
                'Double the first equation and subtract the second. The x terms cancel as ' +
                'planned — what happens to the y terms, and what are you left holding?',
            },
            {
              label: 'Read the leftover sentence as a claim about every pair',
              detail:
                '0 = 3 is false, and there is no letter in it to be chosen well. The left side ' +
                'is 0 for every pair of numbers whatsoever, so no pair can make it 3 — which ' +
                'means no pair satisfies both equations. Said the other way round: if ' +
                '2x + 3y = 7 then 4x + 6y is forced to be 14, whatever x and y are, and the ' +
                'second equation insists it is 11.',
              socratic:
                'You are left with 0 = 3. There is no letter left to solve for — so what does ' +
                'that sentence tell you about how many pairs satisfy both equations?',
            },
            {
              label: 'Change one number and run it again',
              detail:
                'With 4x + 6y = 14, doubling the first equation produces that second equation ' +
                'exactly, so subtracting leaves 0 = 0 — true for every pair. The second equation ' +
                'has added no condition, so the solution set is every pair satisfying ' +
                '2x + 3y = 7: choose any y and x is (7 − 3y)/2. At y = 3 that is x = −1, and ' +
                '2(−1) + 3(3) = 7 with 4(−1) + 6(3) = 14, so (−1, 3) satisfies both. A different ' +
                'y gives a different solution, and there is no last one.',
              socratic:
                'This time the leftover is 0 = 0. Pick a value for y — any value — and see ' +
                'whether you can find an x to go with it. How many solutions does that make?',
            },
            {
              label: 'Name the number that decided all three outcomes before you started',
              detail:
                'For ax + by = c with dx + ey = f, the elimination leaves (ae − bd)x = ce − bf, ' +
                'so ae − bd is what the answer is divided by. Both letters cancel together ' +
                'exactly when it is 0, which is exactly when one left side is a multiple of the ' +
                'other: here 4x + 6y is 2(2x + 3y), and 2 · 6 − 3 · 4 = 0. For the system in the ' +
                'first point, 2 · (−1) − 3 · 5 = −17, which is not 0, and that is why a single x ' +
                'survived and a single point came out. So the three outcomes — one point, no ' +
                'pairs, a whole line — are not three accidents of arithmetic: one number ' +
                'separates the first from the other two, and the leftover separates those two ' +
                'from each other.',
              socratic:
                'In the first point the elimination ended with 17x = 51 and here it ended with ' +
                '0 = 3. Looking at the coefficients of the two systems rather than at the ' +
                'answers — what is different about them that could have told you in advance?',
            },
          ],
          answer:
            '2x + 3y = 7 with 4x + 6y = 11 is satisfied by no pair at all: the elimination ' +
            'leaves 0 = 3. With 11 changed to 14 it is satisfied by every pair on the line ' +
            '2x + 3y = 7 — (−1, 3) and (1/2, 2) among them — because the elimination leaves ' +
            '0 = 0. Both systems have 2 · 6 − 3 · 4 = 0, which is what put them in this case ' +
            'rather than the first point\'s.',
        },
      },
    ],
  },
  {
    id: 'gaussian-elimination',
    name: 'Gaussian elimination',
    subjectId: subject.id,
    scope: {
      id: 'gaussian-elimination',
      label: 'Gaussian elimination',
      hint: 'gaussian elimination row echelon pivot free variable rank',
      /*
       * Carried verbatim from the map node, for the reason all three concepts
       * above give and which applies again unchanged: widening a pattern at the
       * same time as writing the material would move the recognition figure in
       * tests/atlas.mjs with no way to say which of the two edits moved it.
       *
       * The two alternatives are both real article titles — "Gaussian
       * elimination" and "Row echelon form" — and the second is why the pattern
       * is worth more than the name alone. It does not collide with either
       * equation concept above: neither `\blinear equation\b` nor
       * `\bsystem of linear equations\b` appears in either title.
       */
      match: /\b(gaussian elimination|row echelon)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'clear-downwards-to-one-unknown',
        statement:
          'Carry out the forward pass on three equations in three unknowns — the first equation ' +
          'removing the first letter from both of the others, then one of what is left removing ' +
          'the second letter from the other — and produce the value of the single unknown the ' +
          'bottom row is left holding.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'back-substitute-up-the-staircase',
        statement:
          'Given the staircase the forward pass leaves, produce the remaining coordinates by ' +
          'working back up it, each row having exactly one letter in it that is not yet known by ' +
          'the time you arrive at that row.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-leftover-of-an-emptied-row',
        statement:
          'When the forward pass takes every letter out of a row at once, produce the number it ' +
          'leaves on the right — nought when the third equation asked for nothing the first two ' +
          'had not, anything else when they contradict — and in the first of those two cases ' +
          'produce a coordinate of one of the solutions by choosing the letter left free.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'clear-downwards-so-each-row-holds-one-letter-fewer',
        conceptId: 'gaussian-elimination',
        statement:
          'With three unknowns there is no single pair of equations to combine: taking a letter ' +
          'out of one pair leaves it in the third, and combining whichever two look convenient ' +
          'can put back what the last step removed. What makes this a method rather than a ' +
          'search is fixing the order. Use the first equation to remove the first letter from ' +
          'BOTH of the others, then use one of the two that are left to remove the second letter ' +
          'from the other. Each row then holds one letter fewer than the row above it, and the ' +
          'bottom row holds exactly one — which is the problem already solved.',
        position: 1,
        /*
         * Timed, and at 30 seconds — the longest figure in the subject, past the
         * 25 the two-equation points carry. The forward pass is three equations
         * multiplied through and subtracted rather than two, so it is half again
         * as much arithmetic before the first inverse can be applied, and the
         * figure is set from what the work actually is rather than rounded to
         * match its neighbours. Fluency matters here for the reason types.ts
         * names: a solve this long is only usable as a STEP inside a longer
         * problem if it does not become the problem.
         */
        automaticityTarget: 30_000,
        workedExample: {
          problem:
            'Solve x + y + z = 6, x + 2y − z = 2 and 2x − y + z = 3 by clearing downwards, and ' +
            'read the z off the bottom row.',
          subgoals: [
            {
              label: 'Pick the row that will do the clearing, and the letter it will clear',
              detail:
                'The first equation carries a single x, so subtracting a multiple of it from ' +
                'another equation costs no fractions. So x is the letter to go — and it has to ' +
                'go from BOTH of the other rows. Clearing it from one of them and stopping ' +
                'leaves two equations still holding three letters between them, which decides ' +
                'nothing: one equation in two unknowns is satisfied by infinitely many pairs, ' +
                'and that is the trap the two-equation concept opens with.',
              socratic:
                'You have three equations and three letters. If you combine just two of them ' +
                'and remove x, how many letters and how many equations are you left with — and ' +
                'is that any nearer an answer than you started?',
            },
            {
              label: 'Subtract multiples of the first row from both of the others',
              detail:
                'x + 2y − z = 2 less x + y + z = 6 gives y − 2z = −4. The third row needs twice ' +
                'the first taken off it rather than once, because its x term is 2x: ' +
                '2x − y + z = 3 less 2x + 2y + 2z = 12 gives −3y − z = −9. Each subtraction is ' +
                'a combination of two equations that hold, so every triple satisfying the ' +
                'originals satisfies it; and each is reversible — add the multiple back and the ' +
                'original row returns — so no triple has been gained or lost either.',
              socratic:
                'The second equation starts with one x and the third with two. What do you have ' +
                'to multiply the first row by before subtracting it from each of them — and why ' +
                'are you allowed to subtract one equation from another at all?',
            },
            {
              label: 'Clear the next letter, using one of the two rows that are left on the other',
              detail:
                'Two equations in y and z remain: y − 2z = −4 and −3y − z = −9. The first ' +
                'carries a single y, so three times it is 3y − 6z = −12, and adding that to ' +
                '−3y − z = −9 removes y and leaves −7z = −21. This step is exactly the ' +
                'two-equation elimination of `systems-of-linear-equations`, with the two ' +
                'equations being ones the previous step produced rather than ones that were ' +
                'handed to you.',
              socratic:
                'You are down to two equations in y and z. One of the two is the easier one to ' +
                'multiply through — which, and what about the way it is written tells you so?',
            },
            {
              label: 'Read the bottom row, and name what fixing the order bought',
              detail:
                '−7z = −21, so z = 3. The staircase is what made that reachable: the top row ' +
                'holds x, y and z, the middle row holds y and z, the bottom row holds z alone. ' +
                'Nothing in any of the three steps depended on these particular numbers, which ' +
                'is why the same pass works on four equations and on forty, and why it can be ' +
                'written down as a procedure at all. Hunting for a convenient pair cannot be.',
              socratic:
                'Count the letters in each of your three rows, top down. What is the pattern — ' +
                'and if there had been a fourth equation, how many rows would the pass have ' +
                'needed before one of them held a single letter?',
            },
          ],
          answer:
            'z = 3. The three rows end as x + y + z = 6, y − 2z = −4 and −7z = −21 — one letter ' +
            'fewer at each step down.',
        },
      },
      {
        id: 'back-substitution-runs-back-up-the-staircase',
        conceptId: 'gaussian-elimination',
        statement:
          'The forward pass does not finish the solve; it makes the solve possible. What it ' +
          'leaves is a staircase in which the bottom row holds one letter, the row above holds ' +
          'that letter and one more, and so on to the top — so coming back UP it, every row you ' +
          'arrive at has exactly one letter in it you do not yet know. That is why the order is ' +
          'forced in both directions, and why no row ever has to be guessed at.',
        position: 2,
        /*
         * Timed at the same figure as the two-equation points rather than the
         * 30 above, and the difference is the work rather than a tidier number.
         * The upward pass is one substitution and one inverse per row with no
         * equation multiplied through, so it is the arithmetic of a one-sided
         * solve done twice — not the arithmetic of the forward pass.
         */
        automaticityTarget: 25_000,
        workedExample: {
          problem:
            'The forward pass on x + y + z = 6, x + 2y − z = 2 and 2x − y + z = 3 left the ' +
            'staircase x + y + z = 6, y − 2z = −4, −7z = −21. Finish the solve, and check the ' +
            'triple somewhere the working cannot have put it.',
          subgoals: [
            {
              label: 'Solve the bottom row, which has nothing left to wait for',
              detail:
                '−7z = −21 is one equation in one unknown, so divide: z = 3. The division is ' +
                'permitted because −7 is not zero, which is the same condition a one-sided solve ' +
                'rests on and not a different rule for a longer problem.',
              socratic:
                'The bottom row holds one letter. What stands between you and its value, and ' +
                'what would have to be true of the −7 for that step to be impossible?',
            },
            {
              label: 'Move up one row and put in the letter you now know',
              detail:
                'y − 2z = −4 holds two letters and one of them is now a number: y − 2(3) = −4, ' +
                'so y − 6 = −4 and y = 2. The row above was BUILT to hold exactly one unsolved ' +
                'letter by the time you reached it, which is what clearing downwards in a fixed ' +
                'order was for.',
              socratic:
                'The row above the bottom has a y and a z in it, and you have a value for one ' +
                'of those two. What kind of equation does that make the row?',
            },
            {
              label: 'Move up again, where two of the three are known',
              detail:
                'x + y + z = 6 holds all three letters and two of them are numbers now: ' +
                'x + 2 + 3 = 6, so x = 1. The count comes out at every step because each row ' +
                'down the staircase had lost exactly one letter, so each row up gains exactly ' +
                'one known.',
              socratic:
                'The top row still has three letters in it. How many of them do you have values ' +
                'for by now, and how many does that leave to find?',
            },
            {
              label: 'Check in an equation that was not the one a number came out of',
              detail:
                'x came out of x + y + z = 6, so putting the triple back into THAT row cannot ' +
                'fail — it is the equation x was solved from, and it would agree just as ' +
                'happily with an x computed from a wrong y. What is worth substituting into is ' +
                'an original equation the pass only consumed on the way down: 2x − y + z at ' +
                '(1, 2, 3) is 2 − 2 + 3 = 3, which is what the third equation asked for. Every ' +
                'multiplication and subtraction of the forward pass flows into the bottom row, ' +
                'so a slip anywhere in it shows up in that one line.',
              socratic:
                'Each of your three numbers came out of one particular row. If you put the ' +
                'triple back into the row it came from, what could you possibly learn — and ' +
                'which of the three original equations has not been used that way?',
            },
          ],
          answer:
            'x = 1, y = 2, z = 3 — the single triple (1, 2, 3), which satisfies 2x − y + z = 3 ' +
            'as well as the two equations the staircase was built from.',
        },
      },
      {
        id: 'a-row-that-empties-reports-instead-of-stalling',
        conceptId: 'gaussian-elimination',
        statement:
          'The pass can take every letter out of a row at once, and then the row that was ' +
          'supposed to hold one unknown holds none. What is left is a sentence with no letter in ' +
          'it to choose well, and that sentence is the answer: false, and no triple satisfies ' +
          'all three equations; true, and the third equation asked for nothing the first two had ' +
          'not, so the solutions are a whole line of triples rather than one. Two numbers decide ' +
          'between the three outcomes and neither does it alone — how many rows are left holding ' +
          'a letter says whether there is a single triple, and the leftover of the row that ' +
          'emptied says which of the other two you are in.',
        position: 3,
        /*
         * No `automaticityTarget`, and the contrast with the two points above is
         * the same one `linear-equations` and `systems-of-linear-equations` each
         * draw at their own third point. Those are procedures and fluency in
         * them is the skill. This one asks what a leftover 0 = 3 says about
         * three planes, and a timing target on that measures typing.
         */
        workedExample: {
          problem:
            'Run the forward pass on x + y + z = 6, x + 2y − z = 2 and 2x + 3y = 11. Then ' +
            'change the 11 to 8 and run it again.',
          subgoals: [
            {
              label: 'Clear downwards as usual, and watch the bottom row empty',
              detail:
                'The second row less the first gives y − 2z = −4, as before. The third row has ' +
                'no z at all, and less twice the first — 2x + 3y + 0z = 11 against ' +
                '2x + 2y + 2z = 12 — it gives y − 2z = −1. The two reduced rows have the SAME ' +
                'left side, so removing y from one using the other takes the z with it: ' +
                '(y − 2z) − (y − 2z) is nothing, and −1 − (−4) leaves 3. The bottom row is ' +
                '0 = 3.',
              socratic:
                'Your two reduced rows are y − 2z = −4 and y − 2z = −1. You are about to remove ' +
                'y from one of them using the other — what happens to the z while you do it?',
            },
            {
              label: 'Read the emptied row as a claim about every triple',
              detail:
                '0 = 3 is false, and there is no letter in it left to be chosen well. The left ' +
                'side is 0 for every triple of numbers whatsoever, so no triple can make it 3 — ' +
                'which is to say no triple satisfies all three equations at once. Said forwards ' +
                'instead of backwards: add the first two equations and 2x + 3y is forced to be ' +
                '8, whatever x, y and z are, and the third insists it is 11.',
              socratic:
                'You are left holding 0 = 3, and there is no letter in it to solve for. What ' +
                'does that sentence tell you about how many triples satisfy all three equations?',
            },
            {
              label: 'Change one number and run the same pass again',
              detail:
                'With 2x + 3y = 8, the third row less twice the first gives y − 2z = −4 — the ' +
                'very row the second one gave. Subtracting leaves 0 = 0, true for every triple. ' +
                'The third equation was the sum of the first two all along, so it asked for ' +
                'nothing new: 2x + 3y = 8 is exactly what x + y + z = 6 and x + 2y − z = 2 ' +
                'already said together.',
              socratic:
                'This time the emptied row reads 0 = 0. Add the first two equations together and ' +
                'look at what comes out — what does that tell you the third equation was asking ' +
                'for?',
            },
            {
              label: 'Count the rows that survived, then go and find one of the solutions',
              detail:
                'Two rows hold a letter and three letters are in play, so one of the three may ' +
                'be chosen and the other two follow: take z, the second row gives y = 2z − 4, ' +
                'and the first gives x = 6 − y − z = 10 − 3z. At z = 1/2 that is y = −3 and ' +
                'x = 17/2, and all three equations hold — 17/2 − 3 + 1/2 = 6, 17/2 − 6 − 1/2 = 2 ' +
                'and 2(17/2) + 3(−3) = 8. A different z gives a different triple and there is no ' +
                'last one. Note what the count on its own did NOT settle: both runs above left ' +
                'two rows holding a letter, so two is what rules out a single triple, and it is ' +
                'the leftover — 3 against 0 — that separates no solutions from a line of them.',
              socratic:
                'Two of your three rows still hold a letter and there are three letters. How ' +
                'many of them are you free to choose before the rest are forced — and would a ' +
                'count of two on its own have told you which of the two runs you were looking ' +
                'at?',
            },
          ],
          answer:
            '2x + 3y = 11 is satisfied by no triple at all: the pass empties the bottom row and ' +
            'leaves 0 = 3, while the first two equations force 2x + 3y to be 8. With the 11 ' +
            'changed to 8 the leftover is 0 = 0, the third equation is the sum of the first two ' +
            'and adds no condition, and the solutions are every triple on the line ' +
            'x = 10 − 3z, y = 2z − 4 — (17/2, −3, 1/2) and (7, −2, 1) among them.',
        },
      },
    ],
  },
  {
    id: 'nonlinear-systems',
    name: 'Nonlinear systems',
    subjectId: subject.id,
    scope: {
      id: 'nonlinear-systems',
      label: 'Nonlinear systems',
      // The map node's own `terms`, verbatim. There was no `match` to carry:
      // see `fidelity` below.
      hint: 'nonlinear system intersection simultaneous quadratic',
      /*
       * No `match`, and inventing one during an authoring pass is the change
       * the four concepts above each decline to make — widening or adding a
       * pattern while writing material moves the recognition figure in
       * tests/atlas.mjs and the written-concept count at once, with no way
       * afterwards to say which edit moved which. `expandNode` has been
       * reporting this absence correctly all along.
       *
       * It is also the right answer on the merits, which is the half worth
       * writing down. "Nonlinear system" IS an article title and it is about
       * the wrong thing: nonlinear DYNAMICS — chaos, attractors, differential
       * equations that do not superpose — not two simultaneous equations one of
       * which is a quadratic. A pattern on it would claim that page
       * confidently, which is worse than claiming nothing, and it is exactly
       * the failure `MapNode.match` warns about with `/probability/i`. The
       * pages that really cover this are filed under the shapes
       * (`circles-analytic`, `conic-sections`) or under solving in general, and
       * neither is wrong. `radical-equations` in ontology-exponentials.ts is
       * the closest sibling and the diagnosis there is the same one: a provider
       * that files by object has no title for a method.
       */
    },
    fidelity: 'guided',
    caveat:
      'Nothing here checks that a statement is really about solving a nonlinear system. The ' +
      'one article with this concept\'s name is about nonlinear DYNAMICS — chaos and ' +
      'differential equations — rather than about two simultaneous equations one of which is a ' +
      'quadratic, so a pattern matching the name would claim the wrong page rather than select ' +
      'the right one. What genuinely covers this is filed under the circle and the conics, or ' +
      'under solving equations in general. So this concept steers the search and filters ' +
      'nothing. The material below is written and practisable — it is the RECOGNITION that is ' +
      'unchecked, not the teaching.',
    objectives: [
      {
        id: 'substitute-into-the-conic-and-produce-both-coordinates',
        statement:
          'Solve a system of a line and a conic by substituting the line\'s expression for one ' +
          'letter into the other equation, solving the quadratic that is left, and producing ' +
          'each coordinate of an intersection point — each root paired with the partner the ' +
          'line gives it rather than with the other root\'s.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'produce-the-discriminant-that-counts-the-intersections',
        /*
         * The DISCRIMINANT and not the count, for the reason the header's
         * objectives section gives at length. "Say whether it cuts, touches or
         * misses" names a classification, and no verifiable kind returns one;
         * the number behind the classification is a value, and the statement
         * says what each of its three signs means so nothing is lost by asking
         * for the number instead.
         */
        statement:
          'Produce the discriminant of the quadratic a substitution leaves — the one number ' +
          'that decides, before any root is found, whether the line cuts the curve at two ' +
          'points, touches it at one, or misses it entirely.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'subtract-two-conics-and-produce-the-coordinates',
        statement:
          'Given two conics written in the same squared terms, subtract one equation from the ' +
          'other to remove both squares at once, solve the linear equation that is left, and ' +
          'produce a coordinate of an intersection point by putting that value back into one ' +
          'of the conics.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'substitution-is-the-only-move-left',
        conceptId: 'nonlinear-systems',
        statement:
          'Combining two equations to cancel a letter stops working the moment one of them is ' +
          'not linear: no multiple of y will cancel a y², because a letter and its square are ' +
          'not multiples of each other. What still works is substitution — one equation names a ' +
          'letter, put it in the other — and what is left is one equation in one unknown. It is ' +
          'a QUADRATIC rather than linear, so it has two roots, and two roots mean two ' +
          'intersection points rather than one.',
        position: 1,
        /*
         * Timed, at 30 seconds. That is the figure `gaussian-elimination`
         * carries rather than the 25 the two-equation points do, and the reason
         * is the work and not the position: a substitution, a square expanded,
         * a quadratic solved, and then TWO back-substitutions, where the
         * two-equation case has one of each. Fluency matters for the reason
         * types.ts names — this is the procedure every later intersection
         * problem performs as a step.
         */
        automaticityTarget: 30_000,
        workedExample: {
          problem: 'Solve y = x + 1 and x² + y² = 25.',
          subgoals: [
            {
              label: 'Try to eliminate a letter, and find there is nothing to cancel',
              detail:
                'Elimination needs the two equations to carry the same letter to the same power, ' +
                'so that multiplying one through makes a pair of terms destroy each other. ' +
                'Multiply y = x + 1 by anything and what you have is a multiple of y; the other ' +
                'equation holds y², and no multiple of y is a multiple of y². So the move the ' +
                'two-equation concept is built on has nothing to take hold of here, and that is ' +
                'a fact about the shapes rather than about these numbers.',
              socratic:
                'The two-equation method works by multiplying one equation through so that one ' +
                'letter\'s terms cancel when you add. Try to arrange that for the y here — the ' +
                'first equation has a y and the second has a y². What would you have to ' +
                'multiply the first equation by, and what goes wrong when you look for it?',
            },
            {
              label: 'Substitute, because one equation already names a letter',
              detail:
                'y = x + 1 says that wherever the line holds, y and x + 1 are two names for one ' +
                'number — so putting x + 1 in for y changes no pair\'s status. The brackets are ' +
                'not optional: y² is the square of the whole of x + 1, so it is (x + 1)² and ' +
                'not x + 1². That is the hidden-bracket rule from ' +
                '`variables-and-expressions`, meeting a power instead of a coefficient. The ' +
                'system becomes x² + (x + 1)² = 25.',
              socratic:
                'The first equation hands you something to use somewhere else. You are about to ' +
                'put x + 1 where the y² is — what has to be written down that was not needed ' +
                'while it was still a single letter, and what would x + 1² mean instead?',
            },
            {
              label: 'Count the unknowns, and solve the quadratic that is left',
              detail:
                'Only x occurs now. Expanding, x² + x² + 2x + 1 = 25, so 2x² + 2x − 24 = 0, and ' +
                'dividing through by 2 gives x² + x − 12 = 0. That factors as ' +
                '(x + 4)(x − 3) = 0, so x = −4 or x = 3. This is `factoring-quadratics` and ' +
                '`quadratic-formula` as written — the problem already solved — and the only new ' +
                'thing is that it has TWO answers where the linear case had one.',
              socratic:
                'How many different letters are in x² + (x + 1)² = 25, and what is the highest ' +
                'power of the one that is left? Expand it and collect it — which problem have ' +
                'you turned the system into, how many answers does a problem of that kind ' +
                'have, and how many did the two-equation case have?',
            },
            {
              label: 'Pair each root with its OWN partner, then check where the working cannot have put it',
              detail:
                'A solution is a point, so each x needs the y that goes with it, and the line is ' +
                'what supplies it: at x = 3, y = 3 + 1 = 4; at x = −4, y = −4 + 1 = −3. The ' +
                'pairing is the part to get right — (3, −3) and (−4, 4) are made of the same ' +
                'four numbers and satisfy neither equation. The check goes into the circle, ' +
                'which is the equation the y did NOT come out of: 3² + 4² = 9 + 16 = 25, and ' +
                '(−4)² + (−3)² = 16 + 9 = 25. Substituting back into the line cannot fail, ' +
                'because the line is where each y was computed.',
              socratic:
                'You have two values of x and the line to get a y from. Work out both points — ' +
                'and then try deliberately pairing the wrong way round, x = 3 with the other ' +
                'root\'s y, and see what the circle says about that pair. Which of your two ' +
                'equations should the finished points be tested in if the test is to be capable ' +
                'of catching an arithmetic slip, and why can it not be the other one?',
            },
          ],
          answer:
            'Two points: (3, 4) and (−4, −3). The substitution leaves x² + x − 12 = 0, whose ' +
            'roots 3 and −4 are the x-coordinates, and y = x + 1 gives each one its own y.',
        },
      },
      {
        id: 'the-discriminant-counts-the-intersections',
        conceptId: 'nonlinear-systems',
        statement:
          'How many points two curves meet in is settled before any root is found, by the ' +
          'discriminant of the quadratic the substitution leaves. Positive and there are two ' +
          'intersections; nought and the two roots have collapsed into one, which is a line ' +
          'touching a curve rather than crossing it; negative and there is no real root at all, ' +
          'so the line misses. The linear case had one deciding number too — but there, no ' +
          'solutions meant the equations contradicted each other, and here a line is simply ' +
          'allowed to pass a curve by.',
        position: 2,
        /*
         * No `automaticityTarget`, and the contrast with the points either side
         * is the argument for the field existing — the same contrast the three
         * concepts above draw at their own third points, which is where the
         * meaning point usually sits. Here it is the SECOND, because the two
         * conics are a procedure and belong after it; the timing follows what
         * is being asked rather than the position in the array. This point asks
         * what the sign of a number says about a picture, and a timing target
         * on that measures typing.
         */
        workedExample: {
          problem:
            'The parabola y = x² meets the line y = 2x + k. Find how many intersection points ' +
            'there are for k = 0, for k = −1 and for k = −2.',
          subgoals: [
            {
              label: 'Substitute once, keeping k as a number not yet chosen',
              detail:
                'Both equations already name y, so either may go into the other: x² = 2x + k, ' +
                'which rearranges to x² − 2x − k = 0. One quadratic covers all three lines, ' +
                'with k riding along as a letter standing for a number that has not been ' +
                'picked. Doing the substitution once instead of three times is the whole reason ' +
                'the comparison below is possible.',
              socratic:
                'Three lines are being asked about and they differ in one number. Substitute ' +
                'before choosing it: what is the one equation in x that you are left with, and ' +
                'what is k doing in it?',
            },
            {
              label: 'Compute the discriminant, which is not the roots',
              detail:
                'For ax² + bx + c = 0 the discriminant is b² − 4ac. Here a = 1, b = −2 and ' +
                'c = −k, so it is (−2)² − 4(1)(−k) = 4 + 4k. Note what has NOT been done: no ' +
                'root has been found, and none is needed. The discriminant is the part of the ' +
                'formula under the root sign, and it is a number about the quadratic rather ' +
                'than a solution of it.',
              socratic:
                'The quadratic formula has a square root in it, and the thing under that root ' +
                'is what decides how the formula behaves. Write it out for x² − 2x − k = 0, ' +
                'taking care over the sign of c. What have you computed — and, just as ' +
                'importantly, what have you not?',
            },
            {
              label: 'Read the three cases off the sign',
              detail:
                'At k = 0 the discriminant is 4, which is positive: two roots, x² − 2x = 0 ' +
                'giving x = 0 and x = 2, so the points are (0, 0) and (2, 4). At k = −1 it is ' +
                '0: the two roots have collapsed, x² − 2x + 1 = (x − 1)² giving x = 1 alone, so ' +
                'the only point is (1, 1) and the line touches the parabola there. At k = −2 it ' +
                'is −4: a negative number has no real square root, so there is no real x at all ' +
                'and the line and the parabola never meet.',
              socratic:
                '4 + 4k at your three values of k gives three numbers, and only their signs ' +
                'matter. Take them one at a time: what does the formula do when the thing under ' +
                'the root is positive, what does it do when that thing is nought, and what goes ' +
                'wrong when it is negative?',
            },
            {
              label: 'Compare the deciding number with the linear case\'s, and say what is different',
              detail:
                'The two-equation concept also had one number deciding between three outcomes — ' +
                'ae − bd, zero exactly when both letters cancel together. But there, "no ' +
                'solutions" only happened when the two equations contradicted each other: two ' +
                'lines that do not meet are parallel, which is a coincidence of the ' +
                'coefficients. Here missing is ordinary. A line that passes above a parabola is ' +
                'not a contradiction and nothing is degenerate about it — so the negative ' +
                'discriminant is reporting a fact about two shapes, which is why the count is ' +
                'geometry rather than algebra.',
              socratic:
                'In the two-equation case, no solution meant the two equations were ' +
                'inconsistent — doubling one and subtracting the other left 0 = 3, something ' +
                'that could never be true. Your k = −2 line also has no solution. Draw the ' +
                'parabola and that line, or just ask where y = 2x − 2 sits relative to y = x²: ' +
                'is anything about that pair of equations contradictory, and if not, what is ' +
                'the negative discriminant telling you about instead?',
            },
          ],
          answer:
            'Two points for k = 0, one for k = −1, none for k = −2. The substitution leaves ' +
            'x² − 2x − k = 0 with discriminant 4 + 4k, which is 4, 0 and −4 at those three ' +
            'values of k.',
        },
      },
      {
        id: 'two-conics-lose-both-squares-at-once',
        conceptId: 'nonlinear-systems',
        statement:
          'When neither equation names a letter there is nothing to substitute, and the linear ' +
          'move comes back one level up. If both equations carry the same squared terms, ' +
          'subtracting one from the other removes BOTH squares in a single stroke and what is ' +
          'left is linear. That line is not either curve: it is the line the intersection ' +
          'points lie on, and solving it then putting the answer back into a curve finishes the ' +
          'job — with two partners this time, because the thing being put back into is a square.',
        position: 3,
        /*
         * Timed at 25 seconds rather than the 30 the first point carries, and
         * the difference is the arithmetic. There is no quadratic to solve here:
         * the subtraction is free because the squared terms are already
         * identical, and what is left is a one-sided linear solve. What it adds
         * back is the root at the end, which the first point does not have.
         */
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Solve x² + y² = 25 and (x − 6)² + y² = 25.',
          subgoals: [
            {
              label: 'Look for a letter to substitute, and find neither equation names one',
              detail:
                'The first point\'s move needed an equation already in the form "y = something". ' +
                'Neither of these is: both carry x and y to the second power, and rearranging ' +
                'either for y produces a square root, which puts a root into the other equation ' +
                'instead of removing a letter from it. So the way in is not substitution, and ' +
                'the first step is to write both equations in the same terms: expanding the ' +
                'second gives x² − 12x + 36 + y² = 25.',
              socratic:
                'The move from the first point needs one equation that already names a letter ' +
                'outright. Try to get one here by rearranging either equation for y — what ' +
                'appears, and what would happen if you substituted that into the other ' +
                'equation?',
            },
            {
              label: 'Subtract, and both squares go together',
              detail:
                'Both equations now hold exactly x² and exactly y². Taking the first from the ' +
                'second removes both at once: (x² − 12x + 36 + y²) − (x² + y²) = 25 − 25 leaves ' +
                '−12x + 36 = 0. The licence is the two-equation concept\'s own — a combination ' +
                'of two equations that hold is a condition every pair satisfying both must ' +
                'satisfy, and the subtraction is invertible, so no pair is gained or lost. ' +
                'Nothing was multiplied through, because the terms to be killed were already ' +
                'identical.',
              socratic:
                'You have x² + y² = 25 and x² − 12x + 36 + y² = 25. Compare them term by term ' +
                'and find what the two have in common. Subtract one from the other — how many ' +
                'of the squared terms survive it, and what is the highest power left in what ' +
                'you are holding?',
            },
            {
              label: 'Solve the line, then go back to a circle for the other coordinate',
              detail:
                '−12x + 36 = 0 is one equation in one unknown, so x = 3. The line decides x ' +
                'alone and says nothing about y, which is the half still to find: putting x = 3 ' +
                'into x² + y² = 25 gives 9 + y² = 25, so y² = 16 and y = 4 or y = −4. TWO ' +
                'values, and both are solutions — the first point\'s back-substitution gave one ' +
                'y per x because the line handed it over directly, and here it is a square ' +
                'being undone.',
              socratic:
                'The equation you are left with has one letter in it, so finish it. Then you ' +
                'have an x and no y — put it back into whichever of the two circles you prefer ' +
                'and solve for y. How many values come out, and why is that different from what ' +
                'happened at the end of the first point?',
            },
            {
              label: 'Say what the line you solved actually was',
              detail:
                'x = 3 is neither circle. Everything the two circles have in common is on it, ' +
                'and the subtraction threw away everything else — so it is the line through ' +
                'both intersection points, which is why one linear equation was enough to pin ' +
                'the x of both. Here it is also the perpendicular bisector of the two centres, ' +
                '(0, 0) and (6, 0), and that is no accident: the two radii are equal, so ' +
                'anything on both circles is the same distance from each centre. Checking in ' +
                'the second circle, which is where neither coordinate was computed: ' +
                '(3 − 6)² + 4² = 9 + 16 = 25, and (3 − 6)² + (−4)² = 25 as well.',
              socratic:
                'You solved x = 3 and got two points out of it. That equation is not one of the ' +
                'two circles — so what is it? Plot the two points you found: what do they both ' +
                'satisfy that the subtraction kept, and what was it that got thrown away? Then ' +
                'look at where the two centres sit and at the two radii — did x = 3 landing ' +
                'exactly halfway between them have to happen, or is it a coincidence of these ' +
                'numbers?',
            },
          ],
          answer:
            'Two points: (3, 4) and (3, −4). Subtracting the equations removes both squares and ' +
            'leaves −12x + 36 = 0, so x = 3 for both; putting that into x² + y² = 25 gives ' +
            'y² = 16, and both roots are solutions.',
        },
      },
    ],
  },
]

/**
 * TWO EDGES, AND BOTH ARE THE EDGE THE PROMOTED NODE ARRIVED CARRYING.
 *
 * This list was empty, and the comment explaining the emptiness was a correct
 * statement about a one-concept subject: an authored ontology's edges may only
 * name concepts it contains, so with nothing to pair there was no internal
 * edge to declare, and everything crossing the boundary lived in
 * `ALGEBRA_FOUNDATIONS.links` instead.
 *
 * The promotion of `linear-equations` is the cheapest shape a promotion has,
 * and this edge is why. The node declared exactly one `needs`, pointing at
 * `variables-and-expressions` — and that concept is authored in THIS subject.
 * So the stranded edge has an owner here, it crosses no boundary, and the
 * promotion cost `links` nothing in either direction. Compare the concept
 * above it, whose two `needs` pointed into `arithmetic-foundations` and
 * therefore had to go to `links` and stay there.
 *
 * Dropping it instead is the failure atlas-foundations.ts keeps recording:
 * removing a map node removes every edge declared on its own `needs`, in
 * silence, and a syllabus joined to nothing beneath it is practisable from a
 * cold account. Here that would have made `linear-equations` a root of
 * mathematics alongside `place-value`, which tests/atlas.mjs refuses by name.
 *
 * THE SECOND EDGE IS THE SAME SHAPE A SECOND TIME, which is worth one
 * paragraph rather than none because two in a row is what turns a cheap
 * promotion from luck into a property. `systems-of-linear-equations` also
 * declared exactly one `needs`, and it also pointed at a concept authored in
 * this subject — `linear-equations`, promoted here one change earlier. So
 * again the stranded edge has an owner here, again it crosses no boundary, and
 * again `links` needed nothing in either direction.
 *
 * The property is not about this area or this subject. It is what a branch
 * authored from the BOTTOM UP looks like: each promoted node's own `needs`
 * point at nodes promoted just before it into the same file, so there is
 * always somewhere local for the stranded edge to go. atlas-foundations.ts
 * reaches the same conclusion from the arithmetic half, where a run of three
 * cheap promotions ended as soon as the next candidate had a dependent
 * STAYING in the area. This subject is now a chain of three authored in
 * dependency order, which is the cheapest shape available, and it will stop
 * being cheap the moment something is authored that an area node depends on.
 *
 * WHAT IS NOT HERE, because it is not this file's to declare. The interference
 * between `linear-equations` and `linear-inequalities` is real and survives the
 * promotion untouched — it is declared by `linear-inequalities`, as a
 * `confusedWith`, and that node is still on the map. An edge is owned by the
 * node that DECLARES it, so this one never came off `linear-equations` and
 * there is nothing to re-home. Restating it here would be the duplicate
 * `composeAtlas` does not notice.
 *
 * The same check was run on the second promotion and came back empty, which is
 * the one thing about it worth recording: `systems-of-linear-equations`
 * declared NO `confusedWith`, so nothing was deleted in silence. That is the
 * stranding no suite catches — `expandEdges` turns a node's `confusedWith`
 * into an `interferes_with`, and interference constrains selection rather than
 * gating, so losing one leaves every test green while freeing the scheduler to
 * introduce the two most confusable concepts in the subject together. An
 * absence has to be looked for to be known, and this is the record that it was.
 *
 * Two edges, and `roots(EXPRESSIONS_AND_EQUATIONS)` is still just the reading:
 * the subject is a chain, reading before solving before solving two at once.
 * tests/concepts-logic.mjs asserts the two edges by NAME rather than as an
 * ordered pair, which matters the moment the chain forks — a positional check
 * reads correctly today and would pass an edge accidentally hung off the wrong
 * parent later.
 *
 * ── THE FOURTH PROMOTION ENDED THE RUN OF CHEAP ONES, EXACTLY AS PREDICTED ─
 *
 * The paragraph above says the property "will stop being cheap the moment
 * something is authored that an area node depends on". `gaussian-elimination`
 * is that thing and this is the sentence being cashed in rather than corrected.
 * The node declared TWO `needs`: `systems-of-linear-equations`, authored here
 * one change earlier, and `matrices-and-maps`, authored in
 * `matrices-and-determinants`. So one stranded edge has an owner in this file
 * and the other cannot — an authored ontology's edges may only name concepts
 * it contains — and that one is in `LINEAR_ALGEBRA.links` now, filed with the
 * area that owned the departing node rather than with the subject holding the
 * far end. Three promotions cost `links` nothing; the fourth cost it an entry.
 *
 * ── AND A SECOND EDGE KIND, WHICH IS WHAT DECIDED WHERE THE CONCEPT WENT ───
 *
 * The node also declared `exercises: ['systems-of-linear-equations']`, which
 * `expandEdges` turned into an `encompasses` edge for free while it was a map
 * node (lib/concepts/atlas.ts). Deleting the node deletes that edge, and it is
 * restated below — but as an authored claim, which tests/atlas.mjs is careful
 * to say is a DIFFERENT claim from the map's: a map node's `exercises` is a
 * statement about the mathematics and is expanded unconditionally, while an
 * ontology's `encompasses` is a statement about what PRACTISING this material
 * exercises, measured against the tasks that actually exist.
 *
 * Measured against them it holds, and not approximately. The last step of the
 * forward pass IS a two-equation elimination — the third knowledge point of
 * `systems-of-linear-equations`, performed on rows the previous step produced
 * — and `gaussian-forward-pass-for-z-1` rules it with the SAME expression
 * `solve-system-eliminate-for-y-1` uses, `(a*f - c*d)/(a*e - b*d)`, at the
 * reduced coefficients instead of the original ones. A learner who has just
 * done that has demonstrated the two-equation elimination, and without this
 * edge it would come due for review as though untouched.
 *
 * THAT EDGE IS ALSO WHY THIS CONCEPT IS FILED HERE AND NOT IN
 * `matrices-and-determinants`, which is where ontology-matrices.ts had
 * reserved it. Two reasons, and the second is the structural one:
 *
 *  - The engine has no matrix type (that file's own second heading), so no task
 *    here can ask for a grid or for a row-echelon FORM. Every question this
 *    concept can actually ask is about a number the elimination produces, and
 *    every worked example is written as equations in letters. The material is
 *    this subject's material; filing it next to the matrices would have shipped
 *    a matrix concept whose tasks never mention a matrix.
 *  - `links` carries `prerequisite` edges only. Had the concept gone into the
 *    matrices subject, the credit edge would have joined two concepts in
 *    different ontologies, which neither ontology may declare and no `links`
 *    entry can express — so it would have had to be dropped, silently and with
 *    every suite green, which is the stranding `confusedWith` is famous for.
 *    Keeping both ends in one subject is what made it sayable at all.
 *
 * `confusedWith` on the departing node: NONE, checked before deleting it, as
 * on the two promotions above. So nothing was lost that way for a third time,
 * and that fact is asserted rather than described, because an absence has to
 * be looked for to be known.
 *
 * Four edges now, and `roots` is still just the reading. The chain is four
 * long: reading, then one equation, then two, then three with the order fixed.
 *
 * ── THE FIFTH PROMOTION ENDED THE CHAIN, WHICH IS A SENTENCE ABOUT THIS LIST ─
 *
 * Five edges, and the paragraph directly above is now wrong about the shape in
 * a way worth correcting in place rather than deleting. The subject is NOT a
 * chain five long. `nonlinear-systems` declared `needs:
 * ['systems-of-linear-equations', 'quadratic-formula']`, and the first of those
 * is the THIRD concept in this file, not the fourth — so the new edge hangs off
 * the two-equation case alongside `gaussian-elimination` rather than behind it.
 * `systems-of-linear-equations` has two dependents here where it had one, and
 * `roots` is still just the reading, which is the one thing about the shape
 * that has not changed.
 *
 * tests/concepts-logic.mjs already asserted the edges by NAME rather than as an
 * ordered pair, and the comment giving the reason — "a positional check reads
 * correctly today and would pass an edge accidentally hung off the wrong parent
 * later" — was written two promotions before the fork it was guarding against
 * arrived. That is the whole return on the habit: nothing had to be rewritten
 * to stay true, only added to. An ordered-walk assertion would have passed this
 * concept hung off the row reduction, and three unknowns have nothing whatever
 * to do with a line meeting a circle.
 *
 * THE SECOND `needs` IS NOT HERE AND CANNOT BE. `quadratic-formula` is a
 * concept of `rational-expressions`, and an authored ontology's edges may only
 * name concepts it contains, so that edge is an entry in
 * `ALGEBRA_FOUNDATIONS.links` — filed with the area that owned the departing
 * node, which is the rule the fourth promotion's entry follows into
 * `LINEAR_ALGEBRA.links`. Both of its ends are authored, so it gates from the
 * moment it exists rather than waiting on a node somebody has yet to write.
 *
 * AND NO `encompasses`, which the header argues at length and which is the one
 * thing in this list a reader might expect to find and should not. The short
 * form: the credit claim would rest on the word "substitute" rather than on
 * arithmetic the learner performs, because the linear substitution's expression
 * appears in none of the eight new tasks.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'variables-and-expressions->linear-equations',
    from: 'variables-and-expressions',
    to: 'linear-equations',
    kind: 'prerequisite',
    promotedBy: 'author:expressions-and-equations',
  },
  {
    id: 'linear-equations->systems-of-linear-equations',
    from: 'linear-equations',
    to: 'systems-of-linear-equations',
    kind: 'prerequisite',
    promotedBy: 'author:expressions-and-equations',
  },
  {
    id: 'systems-of-linear-equations->gaussian-elimination',
    from: 'systems-of-linear-equations',
    to: 'gaussian-elimination',
    kind: 'prerequisite',
    promotedBy: 'author:expressions-and-equations',
  },
  /*
   * The fork. Same `from` as the edge directly above and a different `to`, so
   * the two are siblings rather than a chain — see the header's note on why
   * that had to be said out loud.
   */
  {
    id: 'systems-of-linear-equations->nonlinear-systems',
    from: 'systems-of-linear-equations',
    to: 'nonlinear-systems',
    kind: 'prerequisite',
    promotedBy: 'author:expressions-and-equations',
  },

  {
    id: 'gaussian-elimination=>systems-of-linear-equations',
    from: 'gaussian-elimination',
    to: 'systems-of-linear-equations',
    kind: 'encompasses',
    promotedBy: 'author:expressions-and-equations',
    rationale:
      'The last step of the forward pass is a two-equation elimination on rows the earlier ' +
      'steps produced, and the emptied-row tasks are the two-unknown leftover with one more ' +
      'letter in play — so row reduction cannot be practised without performing the ' +
      'two-equation solve, and that review should not come due as though untouched.',
  },
]

export const EXPRESSIONS_AND_EQUATIONS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
