/**
 * Practice tasks for the rational-expressions ontology.
 *
 * TWO KINDS ARE IMPLEMENTED END TO END. `transform_to_form` is machine-rulable in
 * both of its dimensions — equivalence by the worker, form by forms.ts — so it is
 * the kind that exercises the whole verifier path including the inconclusive
 * branch. `evaluate` is ruled by exact rational arithmetic in verify.ts and needs
 * no worker at all; see `ruleEvaluate` for why that is a correctness requirement
 * rather than an optimisation.
 *
 * `state` and `justify` remain declared in the registry (registry.ts) with
 * `verifiable: false` and carry no tasks, because a build that served a `justify`
 * task and then silently never scored it would look complete and quietly stop
 * recording evidence. `counterexample` is declared verifiable and also carries no
 * tasks: it needs a ruler that can check a produced object against a claim, and
 * until that exists a task of the kind would be served and never settled.
 *
 * ── Why the evaluate tasks look like they are testing the wrong thing ──────
 *
 * Several of them ask for the value of something that is not the skill's output:
 * the discriminant of a quadratic, a denominator at an excluded point, the left
 * side of a cleared identity at a root. That is deliberate and it is how an
 * `evaluate` task earns its place next to a knowledge point whose natural kind is
 * `state` or `justify`.
 *
 * "Name the excluded points" is not machine-rulable — it asks for a set, in prose.
 * But the *reason* a point is excluded is that the denominator vanishes there, and
 * `x^2 - 2x - 15` at `x = 5` is exactly that computation. So the task asks the one
 * question in the vicinity that has a checkable answer, rather than asking the
 * real question and grading it by keyword. Each such task names what it is
 * standing in for, so nobody later mistakes the proxy for the objective.
 *
 * `reference` is the author's answer and is never the *only* answer. Any
 * expression equivalent to it and in the demanded form is correct, which is the
 * only defensible reading of "write this as a sum of partial fractions" — the
 * terms may be in any order, the constants may be written as fractions or
 * decimals, and `-3/2 x` and `-(3/2)x` are the same thing.
 *
 * Every `given`/`reference` pair here was checked by hand against the worked
 * example it practises. The test suite re-checks the shape of each one (parses,
 * declares its symbols, reference satisfies its own demanded form); it cannot
 * re-check the algebra without the worker, which is the point of the worker.
 */

import { generatedTaskById } from './generators'
import type { ConceptOntology, PracticeTask, VariableDeclaration } from './types'

/** Every task declares its symbols. Most of them are one real variable. */
const REAL_X = [{ name: 'x', assumptions: { real: true } }]

/**
 * Completing the square is in b and c only, with no `a` to give a value to.
 *
 * A separate declaration rather than reusing `REAL_ABC`, because every declared
 * symbol must have a stated input — an unused `a` is an authoring fault the
 * suite reports, and correctly so: a task whose inputs do not cover its symbols
 * cannot be evaluated at all.
 */
const REAL_BC = [
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * Three real parameters, no x.
 *
 * The discriminant tasks are in the coefficients rather than in x, which is
 * what this was written for. The plane-geometry tasks reuse it for three angle
 * measures, and the Pythagoras ones for the three sides of a triangle — in
 * every case three reals with no variable to substitute into — rather than
 * declaring identical sets under geometric names, since what a symbol MEANS is
 * the prompt's job and what it may be assumed to BE is this one's.
 *
 * The two one-sided linear solves reuse it for the same reason and are the
 * clearest case of the rule: their `given` is the SOLUTION of ax − b = c, so
 * there is genuinely no x to substitute into — the x is what the expression
 * computes. A declaration named for the unknown would have been wrong there,
 * not merely redundant.
 *
 * Real rather than `positive`, which a length arguably is. Deliberate: the two
 * converse tasks are a SUBTRACTION of squares whose sign is the ruling, and one
 * of them is negative. Nothing is assumed about the symbols that the tasks do
 * not need, and `positive` would be an assumption about the lengths that the
 * engine could in principle use to simplify a result these tasks want left
 * alone.
 */
const REAL_ABC = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * Two real parameters, for the triangle tasks that are about a pair.
 *
 * A fourth declaration rather than reusing `REAL_ABC` and leaving `c` without
 * a value, for the reason `REAL_BC` gives: every declared symbol must have a
 * stated input, and a task whose inputs do not cover its symbols cannot be
 * evaluated at all — the suite reports it, correctly.
 *
 * Real rather than integer, matching the plane-geometry tasks it joins and for
 * the same reason. The pairs it carries are angle measures, pairs of side
 * lengths — from the triangle inequality and from Pythagoras — a surface and a
 * radius, and, since the twelfth promotion, a returning turn with a count of
 * mirror lines. (That list used to be a tally of six, which three later
 * promotions each falsified without visiting it; the kinds of thing the symbols
 * stand for is the durable claim and the count was not, for the reason
 * ontology-geometry.ts's header gives about hand-maintained numbers.) Nothing
 * in any of those facts is about whole numbers:
 * 180 − (180 − a − b) = a + b holds for every pair of angles, and a triangle's
 * sides are not required to be integers. The whole-number values in the
 * prompts are a convenience of the figures chosen, and in the Pythagoras cases
 * a deliberate one — a triple is picked where the answer should be rational and
 * avoided where the point is that it is not.
 */
const REAL_AB = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
]

/**
 * Two sides and a COSINE, for the oblique-triangle tasks.
 *
 * `k` rather than a name like `cosA` because the parser takes single symbols
 * and because what the symbol means is the prompt's job, which is the rule
 * `REAL_ABC` states. Three of the four cosine-law tasks use this set: the two
 * sides enclosing an angle plus the cosine of that angle is exactly the data
 * the cosine law takes, and the ambiguous-case pair is the same three numbers
 * read with one of the sides facing the angle instead of enclosing it.
 *
 * Real rather than `positive`, and here that is not inherited caution — it is
 * required. A cosine is negative precisely when the angle is wider than a
 * right angle, which is half the content of the first knowledge point, and
 * `positive` on `k` would be an assumption that forbids the obtuse case.
 * `a^2 - b^2*(1 - k^2)` is also a subtraction whose SIGN is the answer, the
 * same shape as the two converse-of-Pythagoras tasks that gave `REAL_ABC` its
 * reason.
 */
const REAL_ABK = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'k', assumptions: { real: true } },
]

/**
 * Two sides and the two sines facing them, for the sine law's own claim.
 *
 * Four symbols because the claim IS about two vertices at once: the law says
 * a/sin A and c/sin C are the same number, and an expression with one vertex
 * in it cannot say so. A set with a spare would not do — every declared symbol
 * must have a stated input, the rule `REAL_BC` and `REAL_AB` were split out
 * for.
 *
 * `s` and `u` for the two sines rather than reusing `b`, which in every other
 * triangle task in this file is a LENGTH. A symbol that means a side in six
 * tasks and a sine in one is the authoring fault this file avoids by naming
 * each set for what its tasks do.
 */
const REAL_ACSU = [
  { name: 'a', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 's', assumptions: { real: true } },
  { name: 'u', assumptions: { real: true } },
]

/**
 * One side and two sines, for the sine law used in its recovering direction.
 *
 * A separate declaration from `REAL_ACSU` rather than that set with `c` left
 * unused, for the reason given three times above: a task whose inputs do not
 * cover its symbols cannot be evaluated, and the suite reports it. The side
 * here is the one the quotient is FORMED from and the two sines are the angle
 * it was formed at and the angle being recovered — three numbers, which is
 * what the law needs once one complete side-and-facing-sine pair exists.
 */
const REAL_AST = [
  { name: 'a', assumptions: { real: true } },
  { name: 's', assumptions: { real: true } },
  { name: 't', assumptions: { real: true } },
]

/**
 * Four real parameters, for the area tasks.
 *
 * A fifth declaration rather than reusing `REAL_ABC` with a spare, for the
 * reason `REAL_BC` and `REAL_AB` give: every declared symbol must have a stated
 * input. These four are two rectangles' worth of sides — a sheet and the piece
 * taken out of it, or two rectangles being compared — so four is what the
 * expressions use and four is what they declare.
 *
 * Real rather than `positive`, matching the plane-geometry tasks it joins.
 * A length is arguably positive, but `equal-perimeters-left-the-areas-unequal-1`
 * is a difference of two areas whose SIGN says which region is larger, and
 * nothing should be assumed about the symbols that the tasks do not need.
 *
 * Real rather than `integer` for the same reason `REAL_AB` is: nothing in
 * either measure is about whole numbers. The whole-number sides in the prompts
 * are a convenience of the figures chosen, and the one height the concept
 * computes is 168/13.
 *
 * The two-sided linear solves reuse it for the four coefficients of
 * ax + b = cx + d, which is the widest a linear equation gets and uses all
 * four. Real rather than integer there too: the move those tasks drill is
 * subtracting a term in the unknown from both sides, and nothing about it
 * needs the coefficients whole.
 */
const REAL_ABCD = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

/**
 * Six real parameters, for the one task that compares two triangles at once.
 *
 * A sixth real declaration rather than reusing `REAL_ABCD` with two spares, for
 * the reason every set above gives: every declared symbol must have a stated
 * input, and a task whose inputs do not cover its symbols cannot be evaluated
 * at all. Six is what "the three sides of this triangle against the three sides
 * of that one" uses, and it is the widest any task in the build gets.
 *
 * Real rather than `positive`, matching the plane-geometry tasks it joins, and
 * here the reason is not a convention but the task: the two perimeter tasks are
 * a DIFFERENCE whose sign is the ruling, and one of them is negative. Real
 * rather than `integer` for the usual reason — a triangle's sides are not
 * required to be whole numbers, and the whole numbers in the prompts are a
 * convenience of the figures chosen.
 *
 * The three system-elimination tasks reuse it for the six coefficients of
 * ax + by = c with dx + ey = f, which is what two linear equations in two
 * unknowns uses and all of what they use. It is no longer "the one task" and
 * six is still the widest any task in the build gets — and the sentence that
 * used to end here, "a third equation would be `gaussian-elimination`, which is
 * still a map node", turned out to predict the wrong thing. That concept is
 * authored, two of its tasks reuse this very set, and six did not have to grow
 * for it: carrying a 3×3 forward pass on the letters would take twelve
 * coefficients, so the tasks carry ONE STEP of the method in general instead,
 * and a step of it is never wider than a 2×2 elimination. The widest
 * declaration is a fact about how general a single `given` is, not about how
 * big the problems get. Same rule as
 * `REAL_ABC`: what a symbol MEANS is the prompt's job and what it may be
 * assumed to BE is this one's, so three sides and six coefficients share a
 * declaration rather than duplicating it under separate names.
 */
const REAL_ABCDEF = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
  { name: 'e', assumptions: { real: true } },
  { name: 'f', assumptions: { real: true } },
]

/**
 * Five real parameters, for the one substitution task that needs five.
 *
 * A seventh real declaration rather than reusing `REAL_ABCDEF` with a spare,
 * for the reason every set above gives: every declared symbol must have a
 * stated input, and an unused one is an authoring fault the suite reports.
 *
 * Five is what substituting into a system costs and it is not padding. The
 * system is y = ax + b with cx + dy = e, and solving it leaves
 * x = (e − db)/(c + da) — the slope and intercept of the equation that names a
 * letter, plus all three coefficients of the equation it is substituted into.
 * The declaration was added rather than the mathematics contorted to fit a
 * four-letter set; a second equation with a leading 1 would have fitted
 * `REAL_ABCD` and would have made the task less general for the convenience of
 * a constant.
 *
 * Real rather than integer, matching the rest of this subject: nothing about
 * eliminating a letter needs the coefficients whole, and the whole numbers in
 * the prompts are a convenience of the systems chosen.
 */
const REAL_ABCDE = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
  { name: 'e', assumptions: { real: true } },
]

/**
 * A line's slope and intercept, plus a circle's radius — for the nonlinear
 * systems.
 *
 * Three more declarations rather than reusing a set above with letters renamed,
 * for the reason every set here gives: every declared symbol must have a stated
 * input, and an unused one is an authoring fault the suite reports. The names
 * are the mathematics' own rather than a, b, c, which is a departure from the
 * rest of this file and deliberate. `m` is a slope, `k` an intercept, `r` and
 * `s` radii and `d` the distance between two centres, and these expressions are
 * long enough — a quadratic formula at substituted coefficients — that a reader
 * checking one against the prose needs the letters to say what they are. The
 * four concepts above name coefficients positionally because their expressions
 * are short and the system is written ax + by = c in every prompt.
 *
 * Real rather than integer, matching the rest of this subject: nothing about
 * intersecting a line with a circle needs whole numbers, and the whole numbers
 * in the prompts are a choice about the arithmetic a learner meets rather than
 * a condition on the method. ontology-algebra.ts's header argues that choice.
 */
const REAL_KMR = [
  { name: 'k', assumptions: { real: true } },
  { name: 'm', assumptions: { real: true } },
  { name: 'r', assumptions: { real: true } },
]

const REAL_KM = [
  { name: 'k', assumptions: { real: true } },
  { name: 'm', assumptions: { real: true } },
]

const REAL_DRS = [
  { name: 'd', assumptions: { real: true } },
  { name: 'r', assumptions: { real: true } },
  { name: 's', assumptions: { real: true } },
]

/**
 * The arithmetic tasks declare `integer`, not `real`.
 *
 * It is a stronger assumption than the algebra tasks make and it is the honest
 * one: every symbol in that subject stands for a whole number, and a remainder
 * or a digit sum is not a statement about the reals. `integer` is in the
 * worker's own `ALLOWED_ASSUMPTIONS` (worker/mathwb/exprtree.py), so the
 * declaration survives the round trip even though these tasks are settled
 * locally and never reach it.
 */
const WHOLE_ABC = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

const WHOLE_ABCD = [...WHOLE_ABC, { name: 'd', assumptions: { integer: true } }]

/**
 * A coefficient, a constant and the variable, for the expressions subject.
 *
 * Exactly three, rather than reusing `REAL_ABC_X` and leaving `c` unused: every
 * declared symbol must have a stated input, and an unused one is an authoring
 * fault the suite reports. Real rather than integer because nothing in that
 * concept is about whole numbers — the point is that a letter stands for a
 * number, and the tasks substitute a negative one on purpose.
 */
const REAL_ABX = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'x', assumptions: { real: true } },
]

/**
 * Coefficients plus the variable, for the functions subject.
 *
 * Real rather than integer: these stand for the parameters of an arbitrary
 * linear or quadratic rule, and nothing in those concepts is about whole
 * numbers. The arithmetic subject declares `integer` for the opposite reason.
 */
const REAL_ABC_X = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'x', assumptions: { real: true } },
]

/**
 * The sequence tasks, and `n` carries assumptions the other subjects' symbols
 * do not.
 *
 * `n` is declared `integer` and `positive` because that is what a position IS
 * — a sequence is a function on 1, 2, 3, … and nothing else. The declaration
 * is inert for these three tasks, which substitute 6, 4 and 100 and evaluate
 * to rationals either way; it is written because types.ts's note on
 * `VariableDeclaration` is explicit that assumptions are declared rather than
 * inferred, so `Symbol('n')` and `Symbol('n', integer=True, positive=True)`
 * are different symbols to the engine. A later task on this concept that
 * simplified rather than evaluated would get the wrong answer from the
 * unqualified one, and would get it silently.
 *
 * The coefficients stay `real` for the reason `REAL_ABC_X` gives: they are the
 * parameters of an arbitrary rule and whole numbers are not what is being
 * taught. Three separate lists rather than one wide one, because
 * `every symbol in the given has a stated input` means an unused symbol in a
 * shared list fails the suite.
 */
const SEQUENCE_INDEX = { name: 'n', assumptions: { integer: true, positive: true } }

const SEQUENCE_INDEX_C = [
  SEQUENCE_INDEX,
  { name: 'c', assumptions: { real: true } },
]

const SEQUENCE_INDEX_DC = [
  SEQUENCE_INDEX,
  { name: 'd', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * The recurrence walk: a multiplier, an offset, and the first term.
 *
 * No `n`. The position is not a symbol here — it is the DEPTH of the nesting
 * in the given, which is the whole difference between the two descriptions
 * this concept compares. A recurrence task with an `n` in it would be a
 * closed form wearing a recurrence's prompt.
 */
const SEQUENCE_RECURRENCE = [
  { name: 'r', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'a', assumptions: { real: true } },
]

/**
 * The sigma tasks. A separate index symbol from `SEQUENCE_INDEX` on purpose.
 *
 * `k` rather than `n` because in a sum the two are different things and the
 * notation says so: `k` is the index that runs, `n` is normally the limit it
 * runs to. Reusing one symbol for both would make the one distinction the
 * first knowledge point is about — the value against the count — invisible in
 * the task's own `given`.
 *
 * `k` carries `integer` and `positive` for the reason the sequence note gives,
 * and `lo`/`hi` carry them too: a summation limit is a position in the same
 * sense an index is. They are inert for these tasks, which substitute whole
 * numbers and evaluate to integers either way, and declared because
 * assumptions are declared rather than inferred.
 */
const SIGMA_INDEX_C: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true, positive: true } },
  { name: 'c', assumptions: { real: true } },
]

const SIGMA_LIMITS_C: VariableDeclaration[] = [
  { name: 'lo', assumptions: { integer: true, positive: true } },
  { name: 'hi', assumptions: { integer: true, positive: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * Linearity's four parts: the factor pulled out, the total it multiplies, the
 * constant term, and how many of it there are.
 *
 * `s` is a TOTAL and not a term, which is the point of the task — the learner
 * is never told a single one of the ten numbers it came from, and there is no
 * symbol here for one, because a task that had one would be asking for a
 * closed form the concept deliberately does not teach.
 */
const SIGMA_LINEARITY: VariableDeclaration[] = [
  { name: 'p', assumptions: { real: true } },
  { name: 's', assumptions: { real: true } },
  { name: 'q', assumptions: { real: true } },
  { name: 'm', assumptions: { integer: true, positive: true } },
]

/**
 * The arithmetic-sequence tasks. Three lists, and the differences between them
 * are the three questions the concept asks rather than bookkeeping.
 *
 * `a` is the first term in all three and `d` the common difference in all
 * three; what changes is the third symbol, and it changes because the unknown
 * does. `n` is a POSITION and is given, so the answer is a term. `v` is a VALUE
 * and is given, so the answer is a position — the same formula read backwards,
 * which is the second knowledge point. `b` is the LAST TERM, which is given
 * instead of the count, and the count being derivable from the two ends is the
 * third point's whole reason for existing.
 *
 * Three lists rather than one wide one, for the reason the note above the
 * sequence declarations gives: `every symbol in the given has a stated input`
 * is asserted over the shipped set, so an unused symbol in a shared list fails
 * the suite rather than sitting there harmlessly.
 *
 * `n` carries `integer` and `positive` as every position in this file does.
 * `a`, `d`, `v` and `b` are plain `real`, and that is deliberately wider than
 * the numbers these three tasks substitute: a constant difference may be
 * negative or fractional, and declaring `d` an integer would make the symbol
 * narrower than the object. There is no symbol anywhere here for the COUNT of
 * terms, which is the point of the third list — a task handed the count would
 * not be asking the question the point is about.
 */
const AP_TERM: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'n', assumptions: { integer: true, positive: true } },
  { name: 'd', assumptions: { real: true } },
]

const AP_POSITION: VariableDeclaration[] = [
  { name: 'v', assumptions: { real: true } },
  { name: 'a', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

const AP_SUM: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

/**
 * The induction tasks. Two lists, and the split is the index against the
 * claim's own parameter.
 *
 * `k` carries `integer` AND `positive` on both, which is load-bearing rather
 * than tidy: every claim these tasks are about is quantified over the
 * naturals, and an inductive step at k = −1 or k = 1/2 is not a weaker version
 * of the step but a different statement. The three `transform_to_form`
 * references are identities over all of ℝ and would pass equivalence without
 * the assumption; the point of declaring it is that the SYMBOL means a
 * position in the claim, the same discipline `AP_TERM`'s `n` follows.
 *
 * `c` is the false claim's constant offset, declared `real` rather than
 * `integer`, and the looseness is the second knowledge point's content: the
 * reason the step cannot detect the offset has nothing to do with what KIND
 * of number it is, and a task whose symbol said `integer` would quietly
 * suggest otherwise. There is no symbol anywhere here for the number of terms
 * or for the sum itself — `induction-base-later-1` makes the learner add
 * 1 + 2 + 3 + 4 by hand against a closed form, and handing either side over as
 * a symbol would be handing over the comparison the task exists for.
 */
const INDUCTION_INDEX: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true, positive: true } },
]

const INDUCTION_OFFSET: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true, positive: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * The two coordinates of a pair. The first declaration in this file with two
 * symbols that are the SAME kind of thing.
 *
 * Everywhere above, a second symbol is a parameter of some sort — a multiplier,
 * a limit, a coefficient — and `x` alone is the input. Here both are inputs,
 * and the only thing distinguishing them is which slot of the pair they stand
 * in, which is the first knowledge point's entire subject.
 *
 * `real` and nothing narrower on both. `integer` would be wrong rather than
 * merely tight: `several-variables-domain-1` turns on 25 − 5 being 20 and not
 * 0, and the third knowledge point's claim is that the forbidden set is a curve
 * through the plane — a claim that needs the plane, not the lattice. Both
 * carry a negative value in `several-variables-domain-2`, so `positive` is out
 * for the same reason.
 */
const SEVERAL_VARIABLES_XY: VariableDeclaration[] = [
  { name: 'x', assumptions: { real: true } },
  { name: 'y', assumptions: { real: true } },
]

/**
 * The same pair under neutral names, used by two tasks for one reason.
 *
 * `a` and `b` rather than `x` and `y` deliberately. In
 * `several-variables-order-1` the expression `(a² + 3b) − (b² + 3a)` puts each
 * symbol in BOTH roles, so naming them after the letters of the rule would say
 * that `a` is the x — exactly the identification the task asks the learner to
 * stop making automatically. In `several-variables-slice-y-1` the `a` is a held
 * coordinate and the `b` is the one still running, which is the reverse of the
 * slice above it. Neither task can honestly call its symbols x and y, and the
 * shared list is the same claim in both: these are slots, not letters.
 */
const SEVERAL_VARIABLES_AB: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
]

/**
 * A slice: the letter being HELD, as a symbol, beside the one still running.
 *
 * `c` is the held value and it appears twice in `c*x^2 + 4*c`, which is the
 * point of writing it as a symbol instead of substituting the 3 — the learner
 * can see that the held value lands in every place its letter stood, and the
 * commonest slip is to put it in one.
 *
 * `x` keeps `real` rather than taking the held letter's assumptions. A slice is
 * a one-variable function on the whole line, and declaring otherwise would make
 * the symbol narrower than the object.
 */
const SEVERAL_VARIABLES_SLICE_C: VariableDeclaration[] = [
  { name: 'c', assumptions: { real: true } },
  { name: 'x', assumptions: { real: true } },
]


/**
 * Matrix entries, named by position rather than by letter.
 *
 * `a11` rather than `a` because the subject's whole difficulty is which entry
 * goes with which — row 1 against column 1 — and a task whose symbols were
 * `a, b, c, d` would hide the one thing being drilled. The determinant tasks
 * are the exception and use `a, b, c, d`, because `ad − bc` is universally
 * written that way and renaming it would make the formula unrecognisable.
 */
const MATRIX_ROW_VEC = [
  { name: 'a11', assumptions: { real: true } },
  { name: 'a12', assumptions: { real: true } },
  { name: 'x1', assumptions: { real: true } },
  { name: 'x2', assumptions: { real: true } },
]

const MATRIX_AB = [
  { name: 'a11', assumptions: { real: true } },
  { name: 'a12', assumptions: { real: true } },
  { name: 'b11', assumptions: { real: true } },
  { name: 'b21', assumptions: { real: true } },
]

/** The determinant's own lettering, kept because `ad − bc` is how it is read. */
const MATRIX_ABCD = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
]

/**
 * Vector components, subscripted by position.
 *
 * `u1`/`u2` rather than `a`/`b` for the same reason the matrix entries are
 * `a11`: which component goes with which is the thing being learned, and
 * single letters would hide it. Real rather than integer — a displacement is
 * not a whole-number object even when these examples happen to use them.
 */
const VEC_V = [
  { name: 'v1', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
]

const VEC_U = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
]

const VEC_UV = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
]

const VEC_UV_FULL = [...VEC_U, ...VEC_V.map(v => ({ ...v, name: v.name }))]

const VEC_UW = [
  ...VEC_U,
  { name: 'w1', assumptions: { real: true } },
  { name: 'w2', assumptions: { real: true } },
]

const VEC_WEIGHTED = [
  { name: 'c1', assumptions: { real: true } },
  { name: 'c2', assumptions: { real: true } },
  { name: 'u1', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
]

const VEC_WEIGHTED_2 = [
  { name: 'c1', assumptions: { real: true } },
  { name: 'c2', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
]

/**
 * The same components with a third one, for the thirteenth promotion.
 *
 * Separate constants rather than a spread of the two-component sets, because
 * the two-component ones are the shape the plane material is ABOUT — a
 * displacement in the plane has two components and not three with one unused —
 * and a task declaring `u3` while working in the plane would read as a typo.
 *
 * `a1`/`a2`/`a3` for a single vector in space, matching the material's own
 * naming of a·a and |a|, and `u`/`v` for a pair, as the plane tasks do. The
 * third components are declared across the whole pair in `VEC_UV_3D` for the
 * reason `POINT_PQ` below gives: `at` decides which symbols a task substitutes,
 * an unused declaration costs nothing, and a symbol missing from `at` fails an
 * assertion.
 */
const VEC_A_3D = [
  { name: 'a1', assumptions: { real: true } },
  { name: 'a2', assumptions: { real: true } },
  { name: 'a3', assumptions: { real: true } },
]

const VEC_UV_3D = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'u3', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
  { name: 'v3', assumptions: { real: true } },
]

const VEC_UW_3D = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'u3', assumptions: { real: true } },
  { name: 'w1', assumptions: { real: true } },
  { name: 'w2', assumptions: { real: true } },
  { name: 'w3', assumptions: { real: true } },
]

/**
 * A normal vector and a point on a plane, for `n·r = d`.
 *
 * `n` rather than another letter because the material calls it the normal
 * throughout and the whole content of the point is that those three numbers are
 * a vector rather than three coefficients.
 */
const PLANE_N_P = [
  { name: 'n1', assumptions: { real: true } },
  { name: 'n2', assumptions: { real: true } },
  { name: 'n3', assumptions: { real: true } },
  { name: 'r1', assumptions: { real: true } },
  { name: 'r2', assumptions: { real: true } },
  { name: 'r3', assumptions: { real: true } },
]

/**
 * One coefficient from each of two polynomials, and the scalar in front of the
 * first — for the twentieth promotion.
 *
 * `p2` and `q2` are subscripted by the POWER and not by position in a list,
 * which is the opposite convention from the vector components above and is
 * stated here because the two sit side by side. The coefficient of x² in a
 * degree-≤2 polynomial is the THIRD entry of the triple (a₀, a₁, a₂), and
 * naming it `p3` to match `u3` would hide the thing the task is about: the
 * power is the index, which is why a polynomial can be read as a vector at all.
 *
 * Only the x² coefficients are declared. The other four numbers in the two
 * polynomials cannot reach the answer — scaling and adding never move a term
 * between powers — and declaring them would suggest they take part.
 */
const POLY_X2_COEFFS = [
  { name: 'c', assumptions: { real: true } },
  { name: 'p2', assumptions: { real: true } },
  { name: 'q2', assumptions: { real: true } },
]

/**
 * Three plane vectors at once, for the twenty-second promotion.
 *
 * `u`, `v` and `w` with both components each, because the basis concept is the
 * first in this subject to need all three in one expression: a coordinate is
 * found from u, v AND the target, and the dependence that follows from it
 * combines all three. `VEC_UW` and `VEC_UV_FULL` each hold two of the three
 * and neither can be extended by a spread without declaring a symbol twice.
 *
 * Every one of the six is declared in each task that uses this set even where
 * the `given` names only some of them, for the reason `PLANE_N_P` and
 * `VEC_UV_3D` give: `at` is what decides which symbols a task substitutes, an
 * unused declaration costs nothing, and a symbol missing from `at` fails an
 * assertion.
 */
const VEC_UVW = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
  { name: 'w1', assumptions: { real: true } },
  { name: 'w2', assumptions: { real: true } },
]

/**
 * A pair of plane vectors and the coefficient that splits one along the other,
 * for the twenty-third promotion.
 *
 * `c` rather than a subscripted name because there is exactly one of it — the
 * weight in v = cu + r — and `c1`/`c2` in `VEC_WEIGHTED` above mean something
 * else: two weights in a linear combination of two vectors. Naming this one
 * `c1` would read as the first of a pair that does not exist.
 *
 * Only one of the two projection tasks uses this set. The other asks for `c`
 * itself and therefore must not be handed it, so it declares `VEC_UV_FULL` and
 * the symbol is absent rather than declared-and-unused — the one place in this
 * file where an unused declaration would cost something, since `at` is what a
 * task substitutes and substituting the answer would make the question free.
 */
const VEC_UV_COEFF = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'v1', assumptions: { real: true } },
  { name: 'v2', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
]

/**
 * One row of a matrix and one candidate kernel vector, for the thirtieth
 * promotion.
 *
 * `a1`/`a2`/`a3` for the row, reusing `VEC_A_3D`'s naming because a row IS a
 * vector here and the task is a dot product of it against something; `k` for
 * the candidate, because the question every task in that pair asks is whether
 * this particular vector is in the KERNEL. Naming it `v` would make the two
 * tasks read as a pair of arbitrary vectors, which is exactly the reading the
 * point exists to refuse — the kernel is one line and not a shape.
 */
const MATRIX_ROW_AND_CANDIDATE = [
  ...VEC_A_3D,
  { name: 'k1', assumptions: { real: true } },
  { name: 'k2', assumptions: { real: true } },
  { name: 'k3', assumptions: { real: true } },
]

/**
 * A column count and a nullity, for the one task that is the theorem itself.
 *
 * `integer` and not `real`, which is the whole point of the pair: both are
 * COUNTS, and the theorem's content is that the two of them and the number of
 * columns cannot be chosen independently. `n` is the number of columns and not
 * of rows — the distinction the task's prompt turns on, since the number of
 * rows never enters the arithmetic.
 *
 * `n` here is unrelated to `n1`/`n2`/`n3` in `PLANE_N_P`, which are a normal
 * vector's components. Two tasks of the same concept use both, and each prompt
 * names its own symbols; a shared constant for the two would be a single
 * declaration list describing two different objects.
 *
 * Annotated rather than left to inference, which the two differing assumption
 * lists make necessary: `n` carries `positive` and `k` does not, so an
 * unannotated literal infers the element type as a union whose `k` member
 * reads `positive?: undefined`, and `undefined` is not assignable to the
 * `Record<string, boolean>` the field declares. The annotation checks each
 * entry against the interface instead of unioning the entries first.
 *
 * Nothing under tests/ catches this. concepts-logic, atlas and journeys all
 * run the emitted JavaScript, where the types are gone, so they stay green
 * while `next build` — which has `typescript.ignoreBuildErrors: false` on
 * purpose — exits 1 and takes the whole production deploy with it. This
 * constant did that to `deployment_history` rows 441 and 442, both of which
 * read `Build failed (exit 1)`, and nothing shipped in between. Every other
 * unannotated declaration list in this file happens to use one identical set
 * of keys throughout, which is the only reason they infer cleanly; adding a
 * key to a single entry of any of them needs the annotation too.
 */
const COLUMNS_AND_NULLITY: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true, positive: true } },
  { name: 'k', assumptions: { integer: true } },
]

/**
 * One column of a system and the target it cannot reach, for the forty-first
 * promotion — and the pair of sets exists for the reason `VEC_UV_COEFF`'s note
 * gives.
 *
 * `a` for the column and `b` for the target, which is the naming the material
 * uses throughout (`x·a = b`) and the naming every textbook statement of
 * `Ax = b` uses. Not `u`/`v`: those are two vectors of the same standing, and
 * the whole content here is that one of the two is reachable territory and the
 * other is the thing being reached FOR.
 *
 * The coefficient `x` is declared in the second set only. The first task asks
 * for `x` itself and therefore must not be handed it — `at` is what a task
 * substitutes, and substituting the answer would make the question free — so
 * that task declares the set without it and the symbol is absent rather than
 * declared-and-unused. Every other declaration list in this file may carry an
 * unused entry harmlessly; these two are the exception, as the projection
 * coefficient's pair was.
 *
 * `real` and not `integer` throughout, for the same reason the vector
 * components above are real: a measurement is not a whole-number object, and
 * these examples using whole ones is a choice about arithmetic load. `x` least
 * of all — a least-squares coefficient is a quotient and is only whole here
 * because the numbers were chosen to make it so.
 */
const LS_COLUMN_AND_TARGET = [
  { name: 'a1', assumptions: { real: true } },
  { name: 'a2', assumptions: { real: true } },
  { name: 'a3', assumptions: { real: true } },
  { name: 'b1', assumptions: { real: true } },
  { name: 'b2', assumptions: { real: true } },
  { name: 'b3', assumptions: { real: true } },
]

const LS_COLUMN_TARGET_AND_X = [
  ...LS_COLUMN_AND_TARGET,
  { name: 'x', assumptions: { real: true } },
]

/**
 * Four readings, the four times they were taken at, and the column of ones —
 * for the two-column fit.
 *
 * Four components rather than three, and that is the point of a separate set
 * rather than a spread: a fit of two coefficients to three readings would be
 * one reading away from exact, and the residual pattern the material reads off
 * needs a fourth miss to be a pattern at all. `u` is the column of ones
 * because the material calls it a column throughout and the first thing a
 * learner has to see is that a constant term IS a column of a matrix; `t` for
 * the times and `y` for the readings, which is the one place this file lets the
 * story name the symbols, since "the times are measured from the middle of the
 * run" is the fact that makes ⟨u, t⟩ = 0.
 *
 * `c` and `m` are in the second set only, for the reason the pair above gives:
 * the task that asks for `m` must not be handed it.
 */
const LS_FOUR_POINT_FIT = [
  { name: 'u1', assumptions: { real: true } },
  { name: 'u2', assumptions: { real: true } },
  { name: 'u3', assumptions: { real: true } },
  { name: 'u4', assumptions: { real: true } },
  { name: 't1', assumptions: { real: true } },
  { name: 't2', assumptions: { real: true } },
  { name: 't3', assumptions: { real: true } },
  { name: 't4', assumptions: { real: true } },
  { name: 'y1', assumptions: { real: true } },
  { name: 'y2', assumptions: { real: true } },
  { name: 'y3', assumptions: { real: true } },
  { name: 'y4', assumptions: { real: true } },
]

const LS_FOUR_POINT_FIT_COEFFS = [
  ...LS_FOUR_POINT_FIT,
  { name: 'c', assumptions: { real: true } },
  { name: 'm', assumptions: { real: true } },
]

/**
 * A column count and a RANK, for the one task that counts the ways of naming
 * one fit.
 *
 * `integer` and not `real`, which is the whole point of the pair exactly as it
 * is for `COLUMNS_AND_NULLITY` above: both are COUNTS, and the content is that
 * they and the dimension of the solution set cannot be chosen independently.
 *
 * A separate constant from that one, and NOT a reuse of it, though the `given`
 * is the same subtraction. There `k` is the nullity and the answer is the rank;
 * here the second input is the rank and the answer is the nullity — the same
 * theorem read in the other direction, at a question that concept did not ask.
 * One declaration list describing two different objects is the thing
 * `COLUMNS_AND_NULLITY`'s own note refuses, and `p` rather than `k` is
 * deliberate: the material calls the count of pivot columns the pivots, and
 * naming it `r` would collide in a reader's head with the residual vector that
 * every other task on this concept is about.
 *
 * Annotated with `VariableDeclaration[]` for the reason that note gives at
 * length: the two entries carry different assumption keys, so an unannotated
 * literal infers an element type whose `p` member reads `positive?: undefined`,
 * `undefined` is not assignable to `Record<string, boolean>`, nothing under
 * tests/ catches it because all three suites run the emitted JavaScript, and
 * `next build` exits 1 and takes the production deploy with it.
 */
const LS_COLUMNS_AND_PIVOTS: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true, positive: true } },
  { name: 'p', assumptions: { integer: true } },
]

/**
 * Two weights and the two values a functional takes on a basis — for the dual.
 *
 * `fu` and `fv` rather than `f1` and `f2`, because the numbered names are the
 * DUAL BASIS functionals in that concept's material and these are the values of
 * one arbitrary functional on u and v. Naming them `f1`, `f2` would make the
 * two tasks that share this set read as though they were about the dual basis,
 * which is the next point and a different object.
 *
 * `real` and not `integer` for all four, like the vector components above: a
 * functional's values are real numbers, and these tasks using whole ones is a
 * choice about arithmetic load.
 */
const DUAL_WEIGHTS_AND_VALUES = [
  { name: 'c1', assumptions: { real: true } },
  { name: 'c2', assumptions: { real: true } },
  { name: 'fu', assumptions: { real: true } },
  { name: 'fv', assumptions: { real: true } },
]

/**
 * The two components of a plane vector, as the ARGUMENT of a rule in x and y.
 *
 * Separate from `VEC_UVW` and from `PLANE_XYZ` deliberately. The dual basis
 * functionals are written as rules on components — `(3x − y)/7` — so what the
 * four tasks sharing this set substitute is a point being fed to a rule, not a
 * vector being combined with others. Reusing `u1`/`u2` would have made the
 * expression read as though it were about a specific named vector when the
 * whole claim is that it is a rule applying to any.
 */
const DUAL_PLANE_XY = [
  { name: 'x', assumptions: { real: true } },
  { name: 'y', assumptions: { real: true } },
]

/** The three coordinates of a point, for substituting into a plane equation. */
const PLANE_XYZ = [
  { name: 'x', assumptions: { real: true } },
  { name: 'y', assumptions: { real: true } },
  { name: 'z', assumptions: { real: true } },
]

/**
 * Two points, P and Q, as four coordinates.
 *
 * `real` and not `integer`, for the same reason the vector components above are
 * real: a coordinate of the plane is a real number, and these three tasks
 * happening to use whole ones is a choice about arithmetic load rather than a
 * fact about the object. The point concept's own material says each axis is a
 * complete real line.
 *
 * All four are declared for all three tasks even though each uses two. The
 * alternative is three near-identical pairs, and `at` is what decides which
 * symbols a task actually substitutes — an unused declaration costs nothing,
 * while a symbol missing from `at` fails the "every symbol in the given has a
 * stated input" assertion in tests/concepts-logic.mjs.
 */
const POINT_PQ = [
  { name: 'p1', assumptions: { real: true } },
  { name: 'p2', assumptions: { real: true } },
  { name: 'q1', assumptions: { real: true } },
  { name: 'q2', assumptions: { real: true } },
]

/** Four digits, most significant first. Shared by the two four-digit tasks. */
const WHOLE_DIGITS = [
  { name: 'd3', assumptions: { integer: true } },
  { name: 'd2', assumptions: { integer: true } },
  { name: 'd1', assumptions: { integer: true } },
  { name: 'd0', assumptions: { integer: true } },
]

/**
 * How many values are in the list, on its own. The narrowest declaration in the
 * file and the one whose assumptions do the most work.
 *
 * `integer` AND `positive`, for the reason `SEQUENCE_INDEX` gives and more
 * sharply: a COUNT of things is not a real number, and the two tasks using this
 * are precisely about the arithmetic of (n + 1)/2 landing on a whole position
 * for an odd n and between two positions for an even one. A symbol declared
 * `real` would make "n is odd or n is even" a statement about an arbitrary
 * number, which is not a case split at all.
 *
 * Inert for the local rulings — both tasks substitute a numeral and evaluate to
 * a rational either way — and declared because types.ts is explicit that
 * assumptions are stated rather than inferred.
 */
const SAMPLE_COUNT: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true, positive: true } },
]

/**
 * Five values of a list, plus how many of them there are.
 *
 * `n` is the count and carries `integer`/`positive` like every count in this
 * file; the five values are plain `real`. That is deliberately wider than the
 * whole pounds the prompts use: a list of measurements is not a list of
 * integers, and the mean of five whole numbers is normally not whole. The
 * donations happen to divide exactly because a worked example that ends in
 * 11.3 would be teaching long division.
 *
 * The count is a symbol rather than the literal 5, and that is the content: the
 * mean divides by HOW MANY THERE ARE, and a learner who reads a hard-coded 5 as
 * part of the formula has learned the wrong thing. There is no symbol here for
 * the total, because a task handed the total would have skipped the only
 * summation in the point.
 */
const SAMPLE_FIVE_AND_COUNT: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
  { name: 'e', assumptions: { real: true } },
  { name: 'n', assumptions: { integer: true, positive: true } },
]

/**
 * Five values of a list, plus the mean as a sixth symbol.
 *
 * A separate list from `SAMPLE_FIVE_AND_COUNT` rather than that one with `n`
 * renamed, because `m` is a different KIND of thing: the count is a whole
 * number of items and the mean is a value in the same units as the data, so the
 * two cannot share assumptions. `m` is `real` and must be — the mean of a list
 * of integers is not an integer, and the deviations task leans on `m` being
 * exactly the mean rather than near it.
 *
 * The mean is HANDED to both tasks rather than computed inside them. That is a
 * deliberate narrowing of what they score: point 1 already rules the mean, and
 * these two are about what happens to the deviations once you have it. A
 * `given` that recomputed the mean five times over would make a slip in the
 * division look like a failure to understand why the deviations cancel.
 */
const SAMPLE_FIVE_AND_MEAN: VariableDeclaration[] = [
  { name: 'a', assumptions: { real: true } },
  { name: 'b', assumptions: { real: true } },
  { name: 'c', assumptions: { real: true } },
  { name: 'd', assumptions: { real: true } },
  { name: 'e', assumptions: { real: true } },
  { name: 'm', assumptions: { real: true } },
]

/**
 * How many letters a truth table is over. Used once, for 2ⁿ.
 *
 * `integer` and `positive`, like `SAMPLE_COUNT` and for the sharper half of its
 * reason: n counts the letters, and 2ⁿ is the number of rows, so a non-integer
 * n does not name a smaller table — it names nothing. Declaring it `real` would
 * make "2^n rows" a claim about an arbitrary exponent, which is a statement
 * about powers rather than about how many cases there are.
 */
const LETTER_COUNT: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true, positive: true } },
]

/**
 * Two truth values, as 1 and 0.
 *
 * `integer` IS THE STRONGEST THING THE SCHEMA CAN SAY HERE, and the gap is
 * worth naming rather than papering over. What these symbols really satisfy is
 * p ∈ {0, 1}, and `VariableDeclaration.assumptions` is a flag set mirroring the
 * worker's — `integer`, `positive`, `real` — with no way to express membership
 * of a two-element set. `domainConditions` cannot carry it either: it holds
 * conditions like `x != 1`, and the condition wanted here is an equation.
 *
 * So the restriction is stated in the PROMPTS, which are printed verbatim, and
 * ontology-logic.ts makes it the first knowledge point's content rather than a
 * footnote. That is not a workaround for the three tasks that need it, it is
 * the honest place for it: the restriction is a fact about what the 1-and-0
 * encoding IS, and a learner who reads it as a declaration on a symbol has
 * learnt the wrong thing. The one task where it bites — the excluded middle,
 * whose expression equals 1 only because p² = p — says so in its prompt and
 * gives the value at p = 1/2 that breaks it.
 *
 * Not `positive`, which would be false: false is 0.
 */
const TRUTH_VALUES: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
]

/** One truth value. The excluded-middle task mentions no second letter. */
const TRUTH_VALUE: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
]

/**
 * A predicate's truth value at each member of a four-member domain.
 *
 * `integer` for `TRUTH_VALUES`' reason and with its gap: what these really
 * satisfy is membership of {0, 1}, and `assumptions` is a flag set with no way
 * to say so. The restriction lives in the prompts and in
 * ontology-quantifiers.ts's first knowledge point, which is the honest place for
 * it rather than a workaround for the schema.
 *
 * ONE LIST FOR TWO READINGS, declared once on purpose. In the first two points
 * the four symbols are P's value at each of the four domain members; in the
 * third they are the value of an INNER quantified statement at each of the four
 * outer values — "is there a y for this x", or "does every x work for this y".
 * Those are different readings of the same kind of thing: a truth value, as a 1
 * or a 0, and the assumptions a declaration can carry are identical. So a second
 * list would differ only in its name, which is what `TRUTH_VALUE` versus
 * `TRUTH_VALUES` is not — there the arity of the statement differs and
 * declaring an unmentioned `q` would claim a four-row table where there are two.
 * Each prompt says which reading it is using, because that is the part a
 * declaration cannot carry.
 *
 * Four rather than the six the first worked example uses, and the gap is
 * deliberate: the example is richer than the tasks because it also changes the
 * domain, and a task that declared six symbols to score one product would be
 * five of bookkeeping per fact.
 */
const FOUR_TRUTH_VALUES: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * Which member of the whole numbers a universal claim is being tested at.
 *
 * `integer` and NOT `positive`, which is the whole reason this is not
 * `LETTER_COUNT` with the comment rewritten. The claim under test is "for every
 * whole number n, n² + n + 11 is prime", and its domain includes 0 — the worked
 * example's search starts there and n = 0 is one of the ten supporting cases. A
 * `positive` declaration would quietly narrow the domain of the claim the task
 * is about, which in a subject whose first point is "the domain is part of the
 * claim" would be the material contradicting its own symbol.
 */
const WHOLE_NUMBER_INDEX: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
]

/**
 * The arbitrary whole number a CASE is written in terms of.
 *
 * `integer` and NOT `positive`, for `WHOLE_NUMBER_INDEX`'s reason read one layer
 * in. The claims these tasks belong to range over every whole number, and k = 0
 * is a legitimate member of each case — it is n = 1 in the odd case, n = 2 in
 * the 3k + 2 case — so `positive` would quietly exclude the smallest instance of
 * exactly the thing being proved. Both prompts that use it name k = 0 as one of
 * the further values the answer is unchanged at, so a `positive` declaration
 * would also contradict its own prompt.
 *
 * This is the subject's whole encoding in one declaration: a case is a FORM,
 * `2*k + 1` or `3*k + 2`, and "for an arbitrary member of the case" means the
 * answer does not mention k. Two of the tasks below are expressions that are
 * identically 1 for that reason, and the k cancelling is the fact being taught
 * rather than a convenience of the arithmetic.
 */
const CASE_INDEX: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true } },
]

/**
 * A particular whole number a claim is being tested at, with nothing else named.
 *
 * Separate from `WHOLE_NUMBER_INDEX` despite declaring the same symbol with the
 * same assumption, because that list's comment is a claim about the domain of
 * ONE statement — "for every whole number n, n² + n + 11 is prime" — and reusing
 * it here would attach that reading to two tasks that are about division. The
 * two tasks sharing this one divide by a stated constant: 2 ÷ 4 to refute a
 * converse, and 30031 ÷ 59 to produce the second factor of a number assumed to
 * have none.
 */
const NUMBER_UNDER_TEST: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A number, a divisor, and a candidate quotient — the three symbols a remainder
 * is read off.
 *
 * ONE LIST FOR TWO POINTS ON PURPOSE, and the expression `n - p*k` is shared
 * with it. In the contradiction point it answers "does any prime on the list
 * divide 30031", where a remainder of 1 means none of them does; in the cases
 * point it answers "which case is 2027 in", where a remainder of 2 means the
 * case a two-case split forgot. Those are two different facts and ONE move, and
 * two differently-written expressions would have said they were two moves.
 * ontology-quantifiers.ts shares a `given` across a point boundary for the same
 * reason and says so in the same words.
 *
 * All three `integer` and none `positive`: the move is defined for 0 and the
 * claims it serves do not exclude it, and nothing here divides by a symbol, so
 * `p != 0` is not a condition any ruling needs.
 *
 * ── AND NOW ONE LIST FOR THREE POINTS IN TWO SUBJECTS, WHICH IS WHY IT STAYS ──
 *
 * The thirty-ninth promotion authored `division-algorithm` — the concept the two
 * uses above were IMPORTING their fact from, named as such in
 * ontology-proof.ts's header — and it evaluates `n - p*k` six more times. So this
 * list is now shared by eight tasks across three knowledge points of two
 * subjects, and it should be read as the theorem's own formula rather than as a
 * convenience: r = a − bq is what `division-algorithm` asserts has a unique
 * solution, and every task in that concept is that formula evaluated somewhere.
 *
 * The `integer`-not-`positive` decision above turns out to be load-bearing
 * rather than merely defensible, which was not foreseeable when it was made. The
 * new concept's second knowledge point divides −2026 by 7, so `n` is NEGATIVE in
 * two of the eight tasks, and `k` is negative in one. Declaring either positive
 * would have made the whole point about negative dividends undeclarable in the
 * one concept whose job is to explain it — the same trap
 * `SET_SIZES_AND_OVERLAP`'s comment records about declaring an overlap positive
 * and losing the disjoint case.
 *
 * ONE SUBSTITUTION IS RESERVED AND MUST NOT BE REUSED: (2027, 3, 675) → 2 is
 * `which-case-a-number-is-in-decides-whether-a-split-covers-it-1`, in the
 * `proof-techniques` block. Two tasks with one expression, one substitution and
 * one answer are one task written twice, however far apart they sit, so the
 * general concept divides 2026 by 9 for the same move — and a different divisor
 * is the point there anyway, since what it has to show is that the case count is
 * b and 3 was never special.
 *
 * ── AND NOW THIRTEEN TASKS ACROSS FOUR POINTS, WHICH IS THE LAST OF THE ──
 * ── ARGUMENT THE PARAGRAPHS ABOVE WERE BUILDING ─────────────────────────
 *
 * The fortieth promotion authored `euclidean-algorithm`, which is the division
 * algorithm ITERATED, and five of its nine tasks are this expression again:
 * (360, 84, 4), (84, 24, 3), (24, 12, 2), (7, 3, 2) and (30, 12, 2). Three of
 * those five are consecutive steps of one run, so a learner answering them in
 * order has executed an algorithm by evaluating one expression three times. That
 * is the strongest form of the claim this comment has been making — read the list
 * as the theorem's formula and not as a convenience — because here the formula
 * being reusable IS the content of the concept above it.
 *
 * A SECOND RESERVATION, IN THE OTHER DIRECTION. (2026, 7, 289) → 3 is
 * `the-remainder-is-what-the-whole-bs-leave-1` in the `division-algorithm`
 * block, and it is step ONE of gcd(2026, 7). The Euclidean algorithm's third
 * knowledge point uses exactly that run, so it starts at step TWO with (7, 3, 2)
 * and its worked example quotes the first step by name rather than re-deriving
 * it. The first reservation above protects a general concept from re-asking an
 * instance; this one protects a dependent from re-asking its prerequisite. Both
 * are the same rule and the asymmetry is worth naming, because a run that only
 * knows the first version will check the wrong direction.
 *
 * tests/concepts-logic.mjs now asserts the whole subject's `evaluate` tasks are
 * distinct as (expression, substitution) pairs, so neither reservation depends on
 * a reader finding this comment.
 */
const DIVIDEND_DIVISOR_QUOTIENT: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'k', assumptions: { integer: true } },
]

/**
 * A divisor, a quotient and a remainder — the three symbols the dividend is
 * reassembled from.
 *
 * The same three numbers as `DIVIDEND_DIVISOR_QUOTIENT` holds, with the dividend
 * dropped and the remainder named, because the one task on it runs the division
 * BACKWARDS: `p*k + r`, which is the left-hand side of a = bq + r being built
 * rather than the remainder being read off. A separate list rather than a reuse
 * for the reason `NUMBER_UNDER_TEST`'s comment gives about `WHOLE_NUMBER_INDEX`:
 * the other list's comment is a claim about reading a remainder, and attaching it
 * to the task that does the opposite would make the comment wrong about one of
 * its users.
 *
 * `integer` throughout and nothing `positive`, since the quotient is negative in
 * the concept's second point and a remainder of 0 is the exact case that point's
 * last subgoal turns on.
 */
const DIVISOR_QUOTIENT_REMAINDER: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'k', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
]

/**
 * A divisor and a remainder, with no dividend and no quotient.
 *
 * For the one task that computes b − r: the remainder −a leaves, given the
 * remainder a leaves. Two symbols rather than four because the claim genuinely
 * does not mention the other two — whatever a and q were, a positive a leaving r
 * forces −a to leave b − r — and declaring symbols a task cannot use would say
 * the fact depends on them.
 */
const DIVISOR_AND_REMAINDER: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
]

/**
 * A divisor and a count of cases somebody checked.
 *
 * Separate from `DIVISOR_AND_REMAINDER` despite being two integers alongside the
 * same `p`, and the distinction is the one `SET_SIZES_AND_OVERLAP` and
 * `SET_SIZE_AND_OVERLAP` draw: `c` is not a remainder. It counts how many of the
 * b residue classes an argument examined, so `p - c` is the number of forms the
 * argument said nothing about. Calling it `r` would have made the expression read
 * as a remainder subtraction and invited the reuse that silently changes what a
 * task is about.
 */
const DIVISOR_AND_CASES_CHECKED: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * A pair of numbers and the two coefficients that combine them — the four
 * symbols a Bézout identity is checked from.
 *
 * `a*x + b*y` rather than four separate products, and the interleaved order is
 * the author's statement of which coefficient belongs to which number:
 * `primaryVariable` takes the FIRST declared symbol, so `a` leading is what
 * makes a form check, if one ever applies here, be about the first of the pair.
 *
 * A separate list rather than a reuse of `REAL_ABCD`, which holds the same
 * arity for `a*b + c*d`, and the distinction is the one `DIVISOR_AND_REMAINDER`
 * and `DIVISOR_AND_CASES_CHECKED` draw: that list's comment is about areas of
 * rectangles and its symbols are real, and these four are integers of which two
 * are coefficients that must be allowed to be negative. Sharing it would have
 * made one comment wrong about both users.
 *
 * `integer` throughout and NOTHING `positive`, which is the one assumption worth
 * arguing about and is forced rather than cautious here. Whenever the gcd is
 * smaller than both numbers — every case except one of them dividing the other
 * — one of the two coefficients is necessarily negative, since any non-zero
 * whole multiple of either number is already at least the smaller of them. So
 * `positive` on `x` or `y` would make the concept's central identity
 * undeclarable in the very concept that explains it, which is the trap
 * `SET_SIZES_AND_OVERLAP` records about declaring an overlap positive and losing
 * the disjoint case, and `DIVIDEND_DIVISOR_QUOTIENT` records about the negative
 * dividend.
 */
const PAIR_AND_BEZOUT_COEFFICIENTS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'x', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'y', assumptions: { integer: true } },
]

/**
 * Six primes a list is assumed to exhaust.
 *
 * Six rather than a shorter run because the point of the task is that the number
 * built comes out COMPOSITE, and the shortest list for which it does is this
 * one: 2 · 3 · 5 · 7 + 1 is 211 and prime, and 2 · 3 · 5 · 7 · 11 · 13 + 1 is
 * 30031 = 59 × 509. The worked example uses both, and the task uses the one that
 * makes the misreading visible.
 *
 * `integer`, not `positive`, by the file's convention, and the real restriction
 * — that each is prime — is not something `assumptions` can carry. It lives in
 * the prompt, which is printed verbatim, the way the {0, 1} restriction does for
 * `FOUR_TRUTH_VALUES`.
 */
const SIX_PRIMES: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
  { name: 'e', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
]

/**
 * Two set sizes and the size of their overlap — the three numbers a union is
 * counted from.
 *
 * `integer` and not `positive`, which is the one assumption worth arguing about
 * here. A size is never negative, so `positive` looks like the tighter and
 * therefore better declaration, and it would be wrong: the EMPTY set has size 0
 * and is the case the second knowledge point turns on, since two disjoint sets
 * are exactly the ones whose correction term is zero. Declaring the overlap
 * positive would make the disjoint case undeclarable in the very subject that
 * explains it.
 *
 * Shared by two tasks across a point boundary, which is the point of one list
 * rather than two. In the operations point `a + b - c` counts a union of two
 * divisor sets; in the identities point it counts a union of two DIFFERENCES,
 * which is one side of `A \ (B ∩ C) = (A \ B) ∪ (A \ C)`. The repair is the same
 * move either way — the sum double-counts the overlap, so one copy comes off —
 * and two differently-named lists would have implied those were two facts.
 */
const SET_SIZES_AND_OVERLAP: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * One set's size and the size of its overlap with whatever is being taken away.
 *
 * `a - c` is `|A| − |A ∩ B|`, which is `|A \ B|`: the members of A that survive
 * are all of them less the ones that are also in B. THREE tasks share this, which
 * is further than any previous subject has carried one expression, and the reason
 * is that the three questions look unrelated until they are written the same way:
 *
 *   at (6, 6)  the second half of a double inclusion — nothing of B is left out
 *              of A, so B ⊆ A, so with A ⊆ B already in hand the sets are equal
 *   at (6, 4)  the divisors of 12 that do not divide 18
 *   at (6, 2)  the left-hand side of the identity in the third point
 *
 * The first of those is the one the shared expression earns its place on. A ⊆ B
 * is just the case where the overlap IS the smaller set, so the inclusion is not
 * a different kind of fact from a difference — it is a difference that comes out
 * zero. Three expressions would have hidden that.
 */
const SET_SIZE_AND_OVERLAP: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * A universe and a subset of it, which is the one operation that needs both.
 *
 * Separate from `SET_SIZE_AND_OVERLAP` despite being two sizes subtracted,
 * because the SYMBOL is the content: `u` is there to be named. "Not in A" has no
 * answer until the universe is stated, and the same six divisors of 12 have a
 * complement of 14 inside the numbers 1 to 20 and of 6 inside the numbers 1 to
 * 12. Writing that as `a - c` would have made the universe look like an overlap
 * and lost the one thing the task is about.
 */
const UNIVERSE_AND_SUBSET: VariableDeclaration[] = [
  { name: 'u', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
]

/**
 * How many members a set has, when the question is how many subsets follow.
 *
 * One symbol, and the exponent position is the whole reason this is a list of its
 * own rather than a reuse of `NUMBER_UNDER_TEST`. `2^n` is the only place in the
 * authored tasks where a declared variable sits in an exponent, and what it
 * encodes is an independent binary choice per member — in or out, n times over.
 * That is the content of the count, and a list whose comment is about division
 * would attach the wrong reading to it.
 */
const MEMBER_COUNT: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
]

/**
 * How many entries were written down, and how many of them named an object
 * already written.
 *
 * `n - d` is the number of members the list actually contributes. The subtraction
 * is of WRITING rather than of objects, which is the first knowledge point's
 * whole claim: a set is fixed by which things belong to it, so the second 2 in
 * 1, 2, 2, 3, 6, 6, 6 adds nothing and neither do the second and third 6.
 * Declared apart from every other two-symbol subtraction in this file because
 * neither symbol is a set size — `n` counts marks on a page.
 */
const WRITTEN_ENTRIES: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * How many sets a claim is about, and how many regions a diagram of that many
 * circles can supply.
 *
 * `2^n - r` is the number of membership cases a picture cannot give a region to.
 * Both figures are exact: n sets have 2ⁿ cases, and n circles in general position
 * cut the plane into at most n² − n + 2 pieces, so `r` is a number the asker
 * computes rather than estimates. The two agree at n = 1, 2, 3 and part company
 * at 4, which is why the task is asked at 4 — the answer 2 is the exact size of
 * the gap between a Venn diagram and a proof, and at n = 3 it would have been 0
 * and said the opposite.
 *
 * Separate from `MEMBER_COUNT` even though both declare `n`, and the reason is
 * the same one `NUMBER_UNDER_TEST`'s comment gives about `WHOLE_NUMBER_INDEX`:
 * there `n` counts the MEMBERS of one set and here it counts the SETS, which are
 * two different readings of one letter inside one concept. Sharing the list would
 * have claimed they were one.
 */
const CASES_AND_REGIONS: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
]

/**
 * The option counts of a sequence of choices, one letter per choice.
 *
 * `a*b*c` IS the product rule, which is why the list is three plain integers and
 * not a declaration of n and r. The closed form would need a factorial and
 * `exactValue` in numerals.ts has no case for a function call — see the header of
 * ontology-counting.ts, which also corrects ontology.ts's reason for the same
 * absence — so a descending product is the only encoding available. It is also
 * the better one: a learner who writes 9 × 8 × 7 has performed the rule, where
 * one who writes a quotient of factorials has substituted into a formula.
 *
 * `integer` and NOT `positive`, which looks like the tighter and therefore better
 * declaration and would foreclose the lesson. An option count of 0 is the case
 * where a choice cannot be made at all, and the first knowledge point's whole
 * subject is that these counts are the thing to check rather than assume. A list
 * that could not express a zero would be asserting the hypothesis it is there to
 * test.
 *
 * Shared across a point boundary deliberately, and the substitutions differ. In
 * the first point `a*b*c` counts three-digit numbers with distinct digits at
 * (9, 9, 8); in the second it counts three distinct offices filled from nine
 * members at (9, 8, 7). Two differently-named lists would have implied those were
 * two rules, and they are one rule applied to a pool that holds still and a pool
 * that shrinks — which is the distinction the two points are built to separate.
 */
const OPTION_COUNTS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * A case's option counts and the option count of the case that came first.
 *
 * `p + q*r*s` is the sum rule closing over the product rule: `p` is a case
 * already counted and `q*r*s` is the other case counted the same way. Four
 * letters rather than reusing `OPTION_COUNTS` twice because the shapes differ —
 * one case of this split needs two factors and the other needs three, which is
 * the asymmetry that forced the split in the first place and would be hidden by a
 * symmetric declaration.
 */
const TWO_CASES_OF_A_SPLIT: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
]

/**
 * A descending product and the orderings of one selection it counted.
 *
 * `(a*b*c)/d` is the unordered selection count: the ordered product over the
 * number of ways to arrange the objects one selection chose. `d` is `r!` and is
 * written as a number by the asker for the reason above — there is no factorial
 * to call — which is why it is a declared variable and not a literal: the task
 * that asks for C(9, 6) substitutes 720 into the same letter that takes 6 for
 * C(9, 3), and one list makes those the same question at two sizes.
 *
 * The division is exact at every substitution these tasks use, and that is a
 * property of the mathematics rather than of the numbers chosen: a descending
 * product of r factors from n is always divisible by r!, because the quotient
 * counts something. No `domainConditions` is needed and none would help — `d` is
 * never zero, since 0! = 1.
 */
const ORDERED_PRODUCT_AND_ORDERINGS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * A longer descending product and the orderings of one selection.
 *
 * Six factors and a divisor, for the symmetry task: choosing which 6 of 9 members
 * are left OUT is the same act as choosing which 3 are in, so C(9, 6) must equal
 * C(9, 3). Separate from `ORDERED_PRODUCT_AND_ORDERINGS` because the arity is
 * genuinely different and an expression cannot be written over a list shorter
 * than itself — and the pair of tasks is the point: the two reach 84 down
 * products of different lengths, which is what makes the symmetry a saving rather
 * than a curiosity.
 */
const SIX_FACTOR_PRODUCT_AND_ORDERINGS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
  { name: 'e', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
]

/**
 * A range and a divisor, for counting multiples.
 *
 * `n/d` counts the multiples of `d` up to `n`, and it is exact ONLY because every
 * substitution here uses an `n` that `d` divides — 60 against 2, 3, 5, 6, 10, 15
 * and 30. That is a choice about the worked example rather than a limit of the
 * encoding: a general count is a floor, `exactValue` has no floor, and a range
 * chosen to make the divisions exact keeps the whole concept worker-free. The
 * prompts say which range and why, so a learner is never shown a division that
 * silently rounded.
 */
const RANGE_AND_DIVISOR: VariableDeclaration[] = [
  { name: 'n', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * How many times one element is counted by each tier of inclusion–exclusion.
 *
 * `a - b + c` is a MULTIPLICITY and not a size, which is the one thing about this
 * list to get right: the three letters are how many of the singles, the pairwise
 * terms and the triple term include one particular element, and the answer is how
 * many times that element ends up counted. The union is counted by the other list
 * below. Keeping them separate is the same discipline `CASES_AND_REGIONS`
 * applies against `MEMBER_COUNT` — one letter standing for two readings inside
 * one concept is worth two lists.
 */
const TIER_MULTIPLICITIES: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * Three set sizes, three pairwise overlaps and one triple overlap.
 *
 * `a+b+c-d-e-f+g` is three-set inclusion–exclusion written out, and the seven
 * letters are deliberate where a shorter list would have been possible: the
 * alternating signs are the content, so the expression has to SHOW three
 * additions, three subtractions and one addition rather than hide any of them
 * behind a collected term. A learner who sees `a+b+c-(d+e+f)+g` has been told the
 * pairs come off together, which is true, and not told that each one comes off
 * because of a different pair of conditions.
 *
 * `integer` and not `positive` for the reason the sets lists give: a disjoint
 * triple has `g = 0` and is the degenerate case the general expression has to
 * keep expressible.
 */
const THREE_SETS_AND_THEIR_OVERLAPS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
  { name: 'e', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
]

/**
 * How many results each step of an experiment can have.
 *
 * `a*b*c` at (2, 2, 2) is the size of the sample space for three coin tosses
 * recorded in order, and this is the ONLY multiplication in
 * `chance-and-events` — which is a boundary rather than a coincidence. The
 * moment an event has to be COUNTED rather than read off a written list, the
 * question has become `counting-probability`'s, and the counting itself is
 * `counting-principles`. So this list exists to size a space small enough to
 * write out in full, and the eight sequences are written out in the point's
 * worked example.
 *
 * Separate from `OPTION_COUNTS`, which holds the same three integer symbols for
 * the product rule itself. The readings differ in what the answer is FOR: there
 * the number is the answer to "how many ways", here it is the length of a list
 * that is then enumerated and subsetted. One letter standing for two readings
 * across two subjects is worth two lists, which is the discipline
 * `CASES_AND_REGIONS` applies against `MEMBER_COUNT`.
 */
const RESULTS_PER_TRIAL: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
]

/**
 * How many outcomes of a finer sample space each outcome of a coarser one stands
 * for.
 *
 * The four letters are the groups of three-toss sequences sharing a number of
 * heads, in order: `p` is 0 heads, `q` is 1, `r` is 2, `s` is 3. Shared by two
 * tasks across no point boundary — both are in the first point — and the reason
 * is that the two questions are one audit:
 *
 *   `r + s`           at (3, 1)        "at least two heads", two cases added
 *   `p + q + r + s`   at (1, 3, 3, 1)  the whole partition, which must come
 *                                      back to the size of the finer space
 *
 * `integer` rather than `positive` because a partition of a space by a recorded
 * quantity may have an empty class — a record nothing produces is still a legal
 * outcome of the coarser space — and the general expression has to keep that
 * expressible even though this instance has none.
 *
 * THE INEQUALITY OF THE FOUR VALUES IS THE CONTENT, not an incidental fact about
 * this experiment. 1, 3, 3 and 1 are what make the coarser space's outcomes
 * unequally likely, which is the whole of the second knowledge point's argument.
 */
const OUTCOMES_BY_CASE: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
]

/**
 * How many outcomes an event holds, and how many the whole space holds.
 *
 * `e/n` is P(E) when the outcomes are equally likely, and `n` is in the
 * denominator rather than being a plain divisor for a reason this subject is
 * built on: the division is licensed by a property of the SPACE, so the size of
 * the space is the thing being divided by and not a convenient number. `f` is a
 * second event with no outcome in common with the first, so `e/n + f/n` is
 * additivity on disjoint events written out rather than collected into
 * `(e + f)/n` — the sum of two probabilities is what the condition is about, and
 * a single fraction would have hidden it.
 *
 * Three tasks share this list, all in the second point, and `f` is unused by two
 * of them. That is deliberate and it is what the derivation looks like: the first
 * task is one outcome, the second is three, and only the third has a second event
 * to add.
 */
const EVENT_SIZES_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'e', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * Two event sizes, the size of their overlap, and the size of the space.
 *
 * `a/n + b/n - c/n` is the addition rule for two events that are NOT disjoint,
 * and the three fractions are written separately for the reason
 * `THREE_SETS_AND_THEIR_OVERLAPS` gives about its seven letters: the correction
 * is the content, so the expression has to SHOW a probability being subtracted
 * rather than hide it inside a collected numerator. A learner who sees
 * `(a + b - c)/n` has been told the repair happens to the count; what the
 * condition on additivity actually says is that the two probabilities could not
 * be added in the first place.
 *
 * Separate from `EVENT_SIZES_AND_THE_SPACE` even though both are event sizes over
 * a space, because `f` there is disjoint from `e` by hypothesis and `b` here
 * overlaps `a` by construction. The same three-symbol shape carrying opposite
 * hypotheses is exactly the case where one list would mislead.
 */
const TWO_EVENTS_THEIR_OVERLAP_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * How many times each term of the addition rule counts one particular outcome.
 *
 * `p + q - r` is a MULTIPLICITY and not a probability, which is the one thing
 * about this list to get right — the same warning `TIER_MULTIPLICITIES` carries
 * about `a - b + c`, and it matters more here because every other expression in
 * this subject evaluates to a probability. The three letters are whether P(A)
 * counts the outcome, whether P(B) does, and whether subtracting P(A and B)
 * removes it; the answer is how many times it ends up counted, and it has to be
 * 1 for every outcome of the union.
 *
 * Asked at (1, 1, 1) — an outcome in BOTH events — because that is the case the
 * repair exists for, and because the answer 1 is the justification for
 * subtracting exactly once rather than merely consistent with it. The other two
 * cases are in the worked example and are not asked: (1, 0, 0) and (0, 0, 0)
 * come out at 1 and 0 and would be grading nothing.
 */
const HOW_MANY_TIMES_AN_OUTCOME_IS_COUNTED: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
]

/**
 * How many outcomes an event's COMPLEMENT holds, and how many the space holds.
 *
 * `1 - c/n` is P(not E) and the literal 1 is in the expression rather than being
 * a substituted symbol, which is the point of a list of its own: the 1 is
 * P(of the whole space) and is a condition rather than a quantity of this
 * problem. A symbol there would have implied it could be something else.
 *
 * `c` is the complement's size and not the event's, which is the saving: the
 * expression is worth using precisely when `c` is small and `n - c` is not, so
 * asking for the complement's size is asking for the cheap half.
 */
const THE_COMPLEMENT_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'c', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A descending product and the orderings of one selection, used for the size of
 * a SAMPLE SPACE and for the size of an EVENT alike.
 *
 * `(a*b*c)/d` at (12, 11, 10, 6) is the 220 committees of three from twelve
 * members, and at (5, 4, 3, 6) it is the 10 made only of new members. One list
 * for both, which is the opposite of the discipline `RESULTS_PER_TRIAL` applies
 * against `OPTION_COUNTS` — and deliberately, because here the sameness is the
 * concept's content. `counting-probability`'s first claim is that one convention
 * has to serve both counts, so a space counted one way and an event counted
 * another would be two readings of this list and exactly the error the point
 * exists to drill. Giving them separate lists would have said they were
 * different kinds of number.
 *
 * Separate from `ORDERED_PRODUCT_AND_ORDERINGS`, which holds the same four
 * integer symbols for `counting-and-arrangements`. There the quotient is the
 * ANSWER to "how many ways"; here it is one side of a ratio and nothing is
 * finished until it has been divided by the other. One letter standing for two
 * readings across two subjects is worth two lists.
 */
const SELECTION_COUNT_FACTORS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * A favourable count and the size of the space, both of them COUNTED.
 *
 * `e/n` is P(E) over equally likely outcomes, the same expression and the same
 * reading `EVENT_SIZES_AND_THE_SPACE` carries for `sample-spaces` — and a
 * separate list because of what the learner has in hand when the task is asked.
 * There both numbers are printed in the prompt, read off a list of eight; here
 * `e` and `n` are numbers the two previous tasks produced, so the ratio is the
 * last step of a counting argument rather than the only step of anything. That
 * list also declares an `f` for a second disjoint event, which this concept never
 * adds: every union below is repaired before it is divided.
 *
 * Two tasks share this list, across a point boundary, at (10, 220) and
 * (105, 220) — the device `OPTION_COUNTS` uses for `a*b*c`. `n` is 220 in both
 * and in every probability in the concept, because the space is counted once.
 */
const A_COUNTED_EVENT_AND_A_COUNTED_SPACE: VariableDeclaration[] = [
  { name: 'e', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * Two ordered counts, the event's and the space's, as six separate factors.
 *
 * `(a*b*c)/(d*e*f)` at (5, 4, 3, 12, 11, 10) is 60/1320, which is the same 1/22
 * as the unordered 10/220 — and that agreement is the first knowledge point's
 * whole claim. Six letters rather than two, because the content is that the
 * orderings divide out: a learner handed `p/q` at (60, 1320) would be dividing
 * two numbers somebody else produced, where this expression shows both products
 * descending from their own pools and lets the common factor of 3! be found
 * rather than asserted.
 *
 * No divisor for the orderings anywhere in it, which is the point: this is the
 * ratio with the division by 6 omitted from BOTH counts, and the answer being
 * unchanged is what says it was free to omit.
 */
const ORDERED_EVENT_AND_ORDERED_SPACE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
  { name: 'e', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
]

/**
 * One selection count per type, multiplied — the first a bare pool, the second a
 * descending product over its orderings.
 *
 * `a*((b*c)/d)` at (5, 7, 6, 2) is 5 × 21 = 105, the committees holding exactly
 * one of five new members and two of seven older ones. The nesting is the
 * structure and is worth the brackets: `a` is C(5, 1), which is just the pool
 * because a descending product of one factor has 1! to divide by, and
 * `(b*c)/d` is C(7, 2) with its own orderings divided out. Written flat as
 * `a*b*c/d` the two factors would have read as one four-factor product, which is
 * what a learner who has not separated the types would write.
 *
 * Both factors are UNORDERED counts, matching the convention the space was
 * counted in. That is the previous point's rule applying to every factor and not
 * just to the total, and it is why this list is separate from
 * `ORDERED_EVENT_AND_ORDERED_SPACE` above rather than a longer version of it.
 */
const ONE_SELECTION_COUNT_PER_TYPE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * How many selections fall in each case of a partition of the space.
 *
 * `a + b + c + d` at (35, 105, 70, 10) is the committees holding 0, 1, 2 and 3
 * new members, and the four letters are those cases in that order. The answer
 * must come back to the size of the space or the cases were not a partition,
 * which is the only check available when the event is too large to list — a
 * single wrong factor in any one case shows up in the total immediately.
 *
 * Separate from `OUTCOMES_BY_CASE`, which holds four integer symbols for the
 * same shape of audit in `sample-spaces`. There each letter is how many outcomes
 * of a FINER space one outcome of a coarser one stands for, and the inequality of
 * the four values is the content because it is what makes the coarser space's
 * outcomes unequally likely. Here all four are counts in ONE space and their
 * inequality means nothing at all: 35, 105, 70 and 10 are four cases of a
 * partition and the 220 equally likely committees underneath them are untouched.
 * Two readings, two lists.
 *
 * `integer` rather than `positive` because a case of such a partition can be
 * empty — with fewer than three older members "0 new" would count nothing — and
 * the general expression has to keep that expressible even though this instance
 * has no empty case.
 */
const CASE_COUNTS_OF_A_PARTITION: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * The size of a COUNTED complement and the size of the space, with the
 * complement taken on either side of the division.
 *
 * Two tasks share this list and the pair is the content: `1 - c/n` at (35, 220)
 * takes the complement AFTER dividing, and `(n - c)/n` at (120, 220) takes it
 * BEFORE. Those are the same number by construction, which is what says the
 * saving was entirely in the counting — so the two expressions together are a
 * fact about the rule rather than two presentations of one task, and their
 * references differ because the two complements are different events.
 *
 * Separate from `THE_COMPLEMENT_AND_THE_SPACE`, which holds the same two integer
 * symbols for `1 - c/n` in `sample-spaces`. The reading there is identical and
 * the difference is where `c` comes from: 1, read off a printed list of eight
 * outcomes, against C(7, 3) = 35 and C(10, 3) = 120, which have to be counted.
 * That list also exists to say the literal 1 is P(of the whole space) rather than
 * a quantity of its problem, and that is true here too — but only one of the two
 * expressions below contains it, which is itself the thing being taught.
 */
const A_COMPLEMENT_COUNT_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'c', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * Two selection counts, the size of their overlap, and the size of the space.
 *
 * `(a + b - c)/n` is inclusion–exclusion repaired on the COUNTS and then divided
 * once, at (55, 55, 10, 220).
 *
 * COLLECTED OVER ONE DENOMINATOR, AND `TWO_EVENTS_THEIR_OVERLAP_AND_THE_SPACE`
 * REFUSES EXACTLY THAT for the same four quantities — its `a/n + b/n - c/n`
 * writes three separate probabilities because `sample-spaces`' lesson is that the
 * two probabilities could not be ADDED in the first place, and a collected
 * numerator would have hidden it. Here the lesson is the opposite one. The repair
 * belongs to `counting-principles` and happens before any probability exists, so
 * the expression has to show one division at the end and not three. The two
 * expressions are the boundary between the two concepts written in a
 * denominator, which is why they are two lists rather than one.
 */
const OVERLAPPING_COUNTS_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * The size of an OVERLAP and the size of a CONDITION — the two counts a
 * conditional probability divides, neither of which is the whole space.
 *
 * `k/m` at (6, 55) is P(all three new given Ann is on the committee): 6 of the
 * 55 committees containing Ann hold three new members.
 *
 * THE LETTERS ARE DIFFERENT FROM `A_COUNTED_EVENT_AND_A_COUNTED_SPACE`'s AND
 * THAT IS THE WHOLE REASON THIS LIST EXISTS. There `n` is the size of the sample
 * space and is 220 in every task of the concept; here `m` is the size of the
 * CONDITION and is never 220 in any of them. Reusing `e/n` would have said the
 * denominator was the same kind of number, which is exactly the claim
 * `conditional-probability` exists to deny — the formula P(E) = |E| / |S| is
 * unchanged and the set S counts has moved. One expression, two readings, two
 * lists, as `sample-spaces` and `counting-probability` already needed for `e/n`
 * itself.
 *
 * Two tasks share this list, at (6, 55) and (6, 10), and the pair is the
 * asymmetry of conditioning written as a substitution: P(A given B) and
 * P(B given A), the same expression, the SAME NUMERATOR, and nothing like the
 * same answer. Two expressions would have let the difference look like a
 * difference of method. One expression with the denominator moved says what
 * actually happens, and the references differ so the pair cannot read as a
 * duplicate.
 */
const AN_OVERLAP_AND_A_CONDITION: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * The same two counts with the size of the ORIGINAL space as well, so that the
 * conditional can be asked as a ratio of two ordinary probabilities.
 *
 * `(k/n)/(m/n)` at (6, 55, 220) is (6/220)/(55/220) = 6/55 — the same answer as
 * `k/m` at (6, 55), and the agreement is the point. P(A given B) =
 * |A and B| / |B| and P(A given B) = P(A and B) / P(B) are ONE definition with
 * `n` cancelled, not two rules, and a learner who computes both has watched the
 * cancellation rather than been told about it.
 *
 * The nested division is deliberate and `p/q` at (3/110, 1/4) would not do: the
 * content is that the SAME `n` appears in both halves, and two pre-divided
 * fractions would hide where it went. This is the device
 * `ORDERED_EVENT_AND_ORDERED_SPACE` uses for the orderings that cancel in the
 * concept below, with the common factor being a space rather than a factorial.
 */
const AN_OVERLAP_A_CONDITION_AND_THE_OLD_SPACE: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A pool and a count drawn from it, repeated once per draw — the factors of a
 * chain of conditional probabilities.
 *
 * `(a/p)*(b/q)*(c/r)` at (5, 12, 4, 11, 3, 10) is P(all three drawn are new)
 * when the three are drawn one at a time and kept out, and it is 1/22 — the same
 * answer the concept below got by counting 10 committees out of 220 with no
 * multiplication at all.
 *
 * ONE PAIR OF LETTERS PER DRAW, WHICH IS THE KNOWLEDGE POINT. Each factor has
 * its OWN denominator because each draw leaves a smaller pool, and the error
 * this point exists to prevent is reusing the first factor — so the expression
 * has to make the denominators separately substitutable. `(a*b*c)/(d*e*f)` at
 * the same six numbers has the same value and would teach the opposite thing:
 * it is one ratio of two products, which is how the concept below counts an
 * ORDERED space, where this is three probabilities multiplied. Same six
 * integers, two different claims, and the brackets are where the difference
 * lives. That pair of expressions is this concept's boundary against the one
 * below it written in a bracket, the way `(a + b - c)/n` against
 * `a/n + b/n - c/n` was the boundary one layer down.
 *
 * Two tasks share this list, both in the second point, at (5, 12, 4, 11, 3, 10)
 * and (5, 12, 4, 11, 7, 10). The first two factors are IDENTICAL and only the
 * third moves, from 3/10 to 7/10 — a run of three new members against new, new,
 * older. That is the pair that says the conditioning tracks WHICH type was
 * removed and not merely that something was: both numerators and both
 * denominators fall by one in the first case, while in the second the
 * denominator falls and the numerator is a count of the other type entirely. The
 * references differ, 1/22 against 7/66.
 */
const A_POOL_AND_A_DRAW_PER_STEP: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
]

/**
 * Two pools and TWO draws from each, because the event happens along either of
 * two paths through the same two draws.
 *
 * `(a/p)*(b/q) + (c/p)*(d/q)` at (5, 12, 7, 11, 7, 5) is P(exactly one of the
 * first two drawn is new) = (5/12) x (7/11) + (7/12) x (5/11) = 35/66. The two
 * products share their denominators `p` and `q` — the pool sizes do not depend
 * on which type came out first — and swap their numerators, which is the whole
 * shape of a two-path tree.
 *
 * SEPARATE FROM `A_POOL_AND_A_DRAW_PER_STEP` BECAUSE THE PLUS IS THE CONTENT.
 * That list is one factor per draw and nothing but multiplication; this one
 * multiplies ALONG each path and adds ACROSS the two, which is this concept's
 * rule and `sample-spaces`' addition rule doing different jobs in one
 * expression. A learner who cannot say which operation goes where has the one
 * misunderstanding this task exists to catch, and a shared list would have
 * suggested the two expressions were lengths of the same thing.
 *
 * The two paths are equal here — both 35/132 — and that is a FACT about this
 * shape rather than a coincidence of these numbers: each path is 5 x 7 over
 * 12 x 11 with the factors taken in the other order. The substitution puts
 * (c, d) = (7, 5) against (a, b) = (5, 7) so the swap is visible in the `at`
 * rather than hidden in equal values.
 */
const TWO_PATHS_THROUGH_TWO_DRAWS: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'c', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * One pool and one count, drawn from twice — the only list in these three
 * subjects whose expression uses a letter TWICE, and the repetition is the
 * claim.
 *
 * `(a/p)*(a/p)` at (5, 12) is P(both drawn are new) when the first is put back
 * before the second is drawn: 25/144. Independence is the case where the
 * conditional factor equals the unconditional one, so the second factor is a
 * COPY of the first — and writing it as a copy is the difference from
 * `A_POOL_AND_A_DRAW_PER_STEP`, where a fresh pair of letters per draw says the
 * space moved. Two letters against six, for two draws either way, and the count
 * of letters is the thing being taught.
 *
 * `a` and `p` are not reused with a second meaning anywhere in the expression,
 * so this is one substitution and not two: `at` carries a single value for each.
 * That is also why the list is two entries rather than four with equal values —
 * four would have asserted that there were two draws to describe, when the
 * mechanism's whole claim is that there is only one description.
 */
const ONE_POOL_DRAWN_TWICE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
]

/**
 * Two event counts and the size of the space, multiplied as two probabilities —
 * the right-hand side of the independence test.
 *
 * `(a/n)*(b/n)` at (55, 55, 220) is P(Ann on it) x P(Bob on it) = 1/16, which is
 * to be compared with the 10/220 = 1/22 those two events actually share: not
 * equal, so not independent. At (10, 35, 220) it is P(all three new) x P(no
 * member new) = 7/968, to be compared with ZERO, because no committee is in both
 * — which is how two events that cannot happen together fail this test rather
 * than passing it trivially.
 *
 * SEPARATE FROM `OVERLAPPING_COUNTS_AND_THE_SPACE`, which holds the same shape
 * of quantities for `(a + b - c)/n` in the concept below, and the difference is
 * the operation rather than the numbers: 55, 55 and 10 are the counts of two
 * events and their overlap in both lists, and there they are repaired and
 * divided once to give a union while here two of them are divided and
 * multiplied to test independence. The same three counts answer a question about
 * ADDING and a question about MULTIPLYING, and the two questions have nothing to
 * do with each other — which is the confusion the third point's last subgoal is
 * about, so the lists are kept apart to stop the expressions reading as
 * variants.
 */
const TWO_EVENT_COUNTS_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A RATE UNDER A CONDITION AND THE RATE AT WHICH THE CONDITION OCCURS — the two
 * figures a reversal is built from, and the first list in these subjects whose
 * letters are RATES rather than counts.
 *
 * `(s/t)*(a/n)` at (9, 10, 1, 100) is P(condition and positive) = 9/1000: 1 in
 * 100 has the condition, 9 in 10 of those test positive, so the overlap is the
 * product. The concept below's `A_POOL_AND_A_DRAW_PER_STEP` is the same
 * multiplication rule with a pool shrinking behind it; here nothing is drawn
 * from anything, which is why the letters are a rate `s/t` and a base rate
 * `a/n` rather than a count over a pool.
 *
 * THE OVERLAP IS THE WHOLE REASON THIS EXPRESSION EXISTS AS A TASK OF ITS OWN.
 * `bayes-theorem` cannot count an overlap — that is its boundary against the
 * concept below, which counts every one of its six — so the overlap has to be
 * BUILT from the conditional that was given, and a learner who cannot produce
 * 9/1000 has nothing to put on top of the division. Asking for it separately is
 * also what makes the next task's comparison legible: 9/1000 is 18/2000, and
 * the other overlap is 99/2000.
 */
const A_RATE_UNDER_THE_CONDITION_AND_A_BASE_RATE: VariableDeclaration[] = [
  { name: 's', assumptions: { integer: true } },
  { name: 't', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A RATE UNDER THE COMPLEMENT AND THE SAME BASE RATE, with the complement
 * written as `(n-a)/n` rather than handed over as a second fraction.
 *
 * `(f/g)*((n-a)/n)` at (1, 20, 100, 1) is P(no condition and positive) =
 * (1/20) x (99/100) = 99/2000, the overlap belonging to the case the question
 * was NOT about and the one the answer actually turns on.
 *
 * SEPARATE FROM THE LIST ABOVE THOUGH THE SHAPE IS NEARLY THE SAME, and the
 * difference is `(n-a)/n`. Handing over 99 and 100 as their own letters would
 * have let the two groups look like two independent pieces of data; writing the
 * complement in terms of the base rate says that there is ONE base rate and the
 * second group is whatever is left, which is the fact the next point's
 * partition check rests on. `f` and `g` are a different pair of letters from
 * `s` and `t` for the reason `AN_OVERLAP_AND_A_CONDITION` is a different list
 * from `A_COUNTED_EVENT_AND_A_COUNTED_SPACE`: a false-positive rate and a
 * sensitivity are not the same kind of number, and reusing the letters would
 * say they were.
 */
const A_RATE_UNDER_THE_COMPLEMENT_AND_THE_BASE_RATE: VariableDeclaration[] = [
  { name: 'f', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
]

/**
 * The same two figures with the probability of the EVIDENCE supplied, so that
 * the reversal can be asked before the denominator has been built.
 *
 * `((s/t)*(a/n))/(p/q)` at (9, 10, 1, 100, 117, 2000) is
 * (9/1000)/(117/2000) = 2/13 — the theorem with its hard part given away.
 *
 * THE DENOMINATOR IS A GIFT HERE AND IS EARNED IN THE SECOND POINT, which is
 * the same division of labour `AN_OVERLAP_A_CONDITION_AND_THE_OLD_SPACE` makes
 * in the concept below: ask the division first with the counts supplied, then
 * ask where the counts came from. A learner who met the full
 * numerator-inside-the-denominator expression first would be rearranging
 * something with four products in it before having once reversed a conditional.
 *
 * `p/q` rather than a single letter, because 117/2000 is a probability and
 * every probability in these subjects is written as a ratio of two declared
 * integers — a lone `p` at 117/2000 would need a non-integer substitution, and
 * `at` carries exact numerals.
 */
const THE_REVERSAL_WITH_ITS_TOTAL_SUPPLIED: VariableDeclaration[] = [
  { name: 's', assumptions: { integer: true } },
  { name: 't', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
]

/**
 * BOTH BRANCHES OF THE SPLIT IN ONE LIST — two rates and one base rate, which is
 * everything the law of total probability needs and everything the theorem needs.
 *
 * Two expressions share it, which is deliberate and is the point of the list.
 * `(s/t)*(a/n) + (f/g)*((n-a)/n)` at (9, 10, 1, 20, 1, 100) is P(positive) =
 * 117/2000, the denominator built; and
 * `((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))` at the same six numbers is
 * 2/13, the whole theorem. The second expression CONTAINS the first, so a
 * learner who has produced 117/2000 has produced the denominator of the next
 * task — and the six substitutions being identical is what says so.
 *
 * THE SAME EXPRESSION IS THEN ASKED AT A DIFFERENT BASE RATE AND NOWHERE ELSE,
 * at (9, 10, 1, 20, 1, 2), giving 18/19 instead of 2/13. Every test figure is
 * held and only `a` and `n` move, so the pair is "a test has no accuracy on its
 * own" written as a substitution. That is this concept's version of the device
 * the concept below used on `k/m`: one expression, two substitutions, two
 * answers, and the difference between them is the claim.
 *
 * SIX LETTERS AND NOT EIGHT. The complement is `(n-a)/n` rather than its own
 * pair, so the expression cannot be substituted into a state where the two
 * groups fail to make up the population — which is the hypothesis the addition
 * rule needs and the one thing a reader has to take on trust in every other
 * presentation of this formula.
 */
const BOTH_BRANCHES_OF_THE_SPLIT: VariableDeclaration[] = [
  { name: 's', assumptions: { integer: true } },
  { name: 't', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * TWO RATES AND NO BASE RATE AT ALL — the likelihood ratio, which is the only
 * expression in these three subjects that deliberately omits the population.
 *
 * `(s/t)/(f/g)` at (9, 10, 1, 20) is (9/10)/(1/20) = 18: a positive result is
 * 18 times as likely from somebody with the condition as from somebody without.
 *
 * THE ABSENT LETTERS ARE THE CONTENT. `a` and `n` are in every other list in
 * this concept and are not here, because the whole claim of the odds form is
 * that the evidence contributes one number and the population contributes
 * another and the two are multiplied rather than mixed. A list carrying the
 * base rate would have let the ratio look like a step in a longer calculation
 * instead of a quantity in its own right.
 *
 * AND ITS ANSWER IS NOT A PROBABILITY, which is the first time in this subject.
 * 18 is greater than 1 and is meant to be; an odds ratio does not live in
 * [0, 1], and `tests/concepts-logic.mjs` asserts that exactly one of this
 * concept's nine references lies outside that interval so that the exception
 * cannot spread quietly.
 */
const TWO_RATES_TO_COMPARE: VariableDeclaration[] = [
  { name: 's', assumptions: { integer: true } },
  { name: 't', assumptions: { integer: true } },
  { name: 'f', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
]

/**
 * A LIKELIHOOD RATIO AND A BASE RATE, with the odds-to-probability conversion
 * folded into the expression.
 *
 * `(w*a)/(w*a + (n-a))` at (18, 1, 100) is 18/(18 + 99) = 18/117 = 2/13 — the
 * screening answer reached a THIRD way, with no total probability computed
 * anywhere. Prior odds of `a` to `n-a`, the first term multiplied by the ratio
 * `w`, and `x/(x+y)` turning odds back into a probability.
 *
 * THE MULTIPLICATION IS VISIBLE AND THAT IS WHY THE CONVERSION IS INSIDE THE
 * EXPRESSION RATHER THAN IN THE PROMPT. The claim of the point is that the
 * prior is a FACTOR: `w*a` against `n-a` is 18 against 99, and a reader can see
 * that an eighteenfold multiplier has not got 1:99 anywhere near even. Asking
 * for the odds and then separately for the probability would have hidden that
 * behind two small answers.
 *
 * THE SAME REFERENCE AS TWO EARLIER TASKS, 2/13, AND THE AGREEMENT IS THE
 * CONTENT — the one place this concept reuses the concept below's device of two
 * routes to one number. Three expressions of entirely different shapes give
 * 2/13: the definition with the denominator supplied, the definition with the
 * denominator built, and the odds form. Three forms of one statement, which is
 * what the theorem is.
 */
const A_LIKELIHOOD_RATIO_AND_PRIOR_ODDS: VariableDeclaration[] = [
  { name: 'w', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * POSTERIOR ODDS AS TWO BARE NUMBERS, converted to the probability of the
 * SECOND of them.
 *
 * `m/(r+m)` at (10000, 20000) is 20000/30000 = 2/3: with a likelihood ratio of
 * 10,000 against prior odds of 1:20,000, the posterior odds are 10,000:20,000
 * and the probability of INNOCENCE given a match is 2/3.
 *
 * THE ANSWER IS THE COMPLEMENTARY CASE AND THAT IS THE WHOLE TASK. Every other
 * task in this concept answers about the condition; this one answers about its
 * complement, because the number the prosecutor's fallacy misreports is the
 * probability of innocence. 2/3 against the 1/10,000 quoted in the prompt is a
 * factor of more than six thousand, and both numbers are conditionals on the
 * same data with the arguments swapped — the confusion
 * `conditional-probability` declares against this concept, at the largest scale
 * the subject can produce.
 *
 * TWO LETTERS AND NO RATES, because at this point the two multiplications have
 * been done. The task is deliberately the LAST of the nine: it is the only one
 * whose numbers were produced by reasoning carried out in the prompt, and that
 * is defensible only once the reader has done the odds-form arithmetic
 * themselves in the task before it.
 */
const POSTERIOR_ODDS_OF_THE_TWO_CASES: VariableDeclaration[] = [
  { name: 'r', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * A PREIMAGE SIZE OVER THE SPACE WRITTEN AS THE THREE TOSSES — the fifth
 * concept of `chance-and-events`, and the first list in these subjects whose
 * whole job is to make a DENOMINATOR unmistakable.
 *
 * `c/(u*v*w)` at (3, 2, 2, 2) is P(X = 2) = 3/8, where X is the number of heads
 * in three tosses: three sequences in the preimage of 2, over the eight
 * sequences the equal-likelihood hypothesis is about.
 *
 * `u*v*w` RATHER THAN A LETTER AT 8, AND THAT IS THE POINT OF THE LIST. The
 * error this concept exists to prevent is dividing by 4 — the number of VALUES
 * X takes — instead of by 8, and `sample-spaces` reports both answers without
 * settling which is right. A lone `n = 8` would be a number the learner has to
 * trust; the product says which space produced it, one factor per toss. It is
 * the first concept's `a*b*c` at (2, 2, 2) with different letters, and the
 * repetition is deliberate: the space has not changed between the two concepts,
 * only what is being asked about it.
 *
 * Different letters all the same, for the reason `A_RATE_UNDER_THE_COMPLEMENT`
 * uses `f` and `g`: `a`, `b` and `c` are three choices being multiplied into a
 * count over there, and here the product is a space being divided BY, so
 * reusing them would say the two were the same kind of number.
 */
const A_PREIMAGE_OVER_THE_SPACE_AS_THREE_TOSSES: VariableDeclaration[] = [
  { name: 'c', assumptions: { integer: true } },
  { name: 'u', assumptions: { integer: true } },
  { name: 'v', assumptions: { integer: true } },
  { name: 'w', assumptions: { integer: true } },
]

/**
 * THE SAME PREIMAGE AGAINST THE WRONG SPACE, so that the disagreement
 * `sample-spaces` left open is a number rather than a remark.
 *
 * `c/(u*v*w) - 1/m` at (3, 2, 2, 2, 4) is 3/8 - 1/4 = 1/8: the answer reached
 * in the space of sequences minus the answer reached by treating the four
 * VALUES as equally likely.
 *
 * `1/m` WITH `m` AT 4 IS THE WRONG ANSWER AND IT IS WRITTEN AS SUCH ON PURPOSE.
 * No task in these subjects has a wrong answer for its reference and this one
 * does not either — what is asked for is the GAP, which is a true fact about
 * two spaces, and the prompt says which of the two is licensed before asking
 * for it. Asking "which is right" is not a kind the build can rule; asking how
 * far apart they are is, and a learner who produces 1/8 has had to compute
 * both.
 *
 * `m` RATHER THAN A SECOND PRODUCT, because the four is not a product of
 * anything. It is the number of values of a rule, which is exactly why dividing
 * by it is unlicensed — there is no "one factor per toss" story to tell about
 * it, and writing it as a bare letter is the honest shape.
 */
const THE_TWO_SPACES_SIDE_BY_SIDE: VariableDeclaration[] = [
  { name: 'c', assumptions: { integer: true } },
  { name: 'u', assumptions: { integer: true } },
  { name: 'v', assumptions: { integer: true } },
  { name: 'w', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * A PREIMAGE THAT IS ITSELF A PRODUCT, for a SECOND rule on the same eight
 * sequences.
 *
 * `(v*w)/(u*v*w)` at (2, 2, 2) is 4/8 = 1/2 — P(T = 1), where T is the toss the
 * first head appeared on: fixing the first toss to heads leaves the other two
 * free, so the preimage is 2 x 2 of the 2 x 2 x 2.
 *
 * THE NUMERATOR SHARES ITS LETTERS WITH THE DENOMINATOR AND THAT IS THE
 * TEACHING. Every other task in this concept has a preimage SIZE on top, counted
 * by collecting sequences. Here the preimage is "whatever the last two tosses
 * do", so its size is literally two of the three factors of the space, and the
 * expression cancels to 1/2 by itself. A learner who sees `(v*w)/(u*v*w)` has
 * the reason the answer is a half in front of them rather than in the prose:
 * one toss was pinned and two were not.
 *
 * THREE LETTERS, NOT FOUR, so the substitution cannot describe a numerator that
 * is not a sub-product of the space. Handing the 4 over as its own letter would
 * allow `at` to claim a preimage bigger than the space it sits in.
 */
const A_SUB_PRODUCT_OF_THE_SAME_SPACE: VariableDeclaration[] = [
  { name: 'u', assumptions: { integer: true } },
  { name: 'v', assumptions: { integer: true } },
  { name: 'w', assumptions: { integer: true } },
]

/**
 * THE FOUR PREIMAGE SIZES AND THE SPACE — the whole table in one substitution,
 * which is what makes the total assertable rather than describable.
 *
 * `(p + q + r + s)/n` at (1, 3, 3, 1, 8) is 8/8 = 1: the four preimages of the
 * heads-count, added and divided once.
 *
 * THE SUM IS INSIDE THE DIVISION AND NOT OUTSIDE IT, which is the one decision
 * in this list. `sample-spaces` asks `p + q + r + s` at the same four numbers
 * and gets 8, a COUNT, and that task is the partition checked on the sequences.
 * This one is the partition checked as a PROBABILITY, and the difference is the
 * whole of what the fifth concept adds: four counts adding to the size of the
 * space is bookkeeping, and four probabilities adding to exactly 1 is the
 * statement that the values of a function partition its domain. Same five
 * numbers, two different claims, and the division is where they part.
 *
 * SO THE REFERENCE IS 1 AND IT IS A PROBABILITY. It is the first reference in
 * these subjects to be exactly 1 for a reason rather than by arithmetic
 * accident, and tests/concepts-logic.mjs asserts that it is this expression
 * that produces it — a 1 arriving from anywhere else here would be a
 * probability of certainty, which nothing in this concept is about.
 */
const THE_FOUR_PREIMAGES_AND_THE_SPACE: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * TWO PREIMAGE SIZES AND THE SPACE, added before the division.
 *
 * `(q + r)/n` at (3, 3, 8) is 6/8 = 3/4 — P(X = 1 or X = 2), two entries of the
 * table taken together.
 *
 * NO CORRECTION TERM, AND ITS ABSENCE IS THE CLAIM. `sample-spaces` asks
 * `a/n + b/n - c/n` because two events in general share outcomes, and this
 * expression has no third term at all: two values of one rule cannot share a
 * sequence, since the rule gives each sequence one number. So the subtraction is
 * not computed and found to be zero — there is nothing to subtract, and the
 * shape of the expression says so before any arithmetic is done.
 *
 * TWO LETTERS FOR THE TWO ENTRIES RATHER THAN ONE DOUBLED, because the two
 * preimages are both of size 3 by coincidence and a single `2*q` would make the
 * coincidence look structural. The table is 1, 3, 3, 1 and the symmetry is a
 * fact about a fair coin, not about merging.
 */
const TWO_ENTRIES_TAKEN_TOGETHER: VariableDeclaration[] = [
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * THE LARGEST ENTRY OVER THE SMALLEST, which is a ratio of two probabilities
 * and so is not a probability.
 *
 * `(r/n)/(p/n)` at (3, 1, 8) is (3/8)/(1/8) = 3: a middle value of the
 * heads-count is three times as likely as an end one.
 *
 * THE SPACE APPEARS TWICE AND CANCELS, AND THAT IS WHY IT IS WRITTEN TWICE.
 * `r/p` would give the same 3 and would be a ratio of two COUNTS; what is
 * wanted is the ratio of two PROBABILITIES, which is the thing the four-outcome
 * space got wrong. Writing both denominators and letting them cancel is the
 * demonstration that the comparison does not depend on the size of the space —
 * the same shape `conditional-probability` uses in `(k/n)/(m/n)` and for the
 * same reason, that a quotient of probabilities is a different object from the
 * quotient of the counts behind them.
 *
 * ITS REFERENCE LEAVES [0, 1] AND IT IS THE ONLY ONE HERE THAT DOES. 3 is the
 * second such reference in these subjects, after `bayes-theorem`'s odds ratio
 * 18, and it is the same category: a ratio of probabilities. The count is pinned
 * at one in tests/concepts-logic.mjs so the exception cannot spread to a task
 * that has no business outside the interval.
 */
const THE_LARGEST_ENTRY_OVER_THE_SMALLEST: VariableDeclaration[] = [
  { name: 'r', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * TWO TABLE ENTRIES ADDED AS PROBABILITIES — the merge, with the division done
 * twice and the sum taken after.
 *
 * `q/n + r/n` at (3, 3, 8) is 3/8 + 3/8 = 3/4 — P(Y = 1), where Y is the margin
 * |heads - tails|: X = 1 and X = 2 are both sent to 1, so their entries add.
 *
 * IT GIVES THE SAME ANSWER AS `(q + r)/n` IN THE POINT ABOVE AND THE AGREEMENT
 * IS THE TEACHING. Those two are the same event under two descriptions — "X is
 * 1 or 2" and "Y is 1" — which is what it MEANS for Y to merge two values of X,
 * so the two expressions must agree or the merge was not a merge. They are kept
 * as two shapes rather than one asked twice because the ROUTES differ: this one
 * adds probabilities already in hand, which is the only arithmetic the third
 * point does, and the one above adds counts and divides once.
 *
 * SO THIS EXPRESSION DELIBERATELY NEVER TOUCHES THE EIGHT SEQUENCES. That is
 * what building the table bought, and it is why the third point can be done on
 * the table alone — a learner who goes back to the sequences here has not got
 * the point, and would arrive at 3/4 anyway, which is why the agreement is
 * asserted rather than hoped for.
 */
const TWO_ENTRIES_MERGED_AS_PROBABILITIES: VariableDeclaration[] = [
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * THE TWO END ENTRIES MERGED ON THEIR COUNTS, with one division at the end.
 *
 * `(p + s)/n` at (1, 1, 8) is 2/8 = 1/4 — P(Y = 3), the other value of the
 * margin: X = 0 and X = 3 are both sent to 3, and TTT and HHH are the two
 * sequences behind it.
 *
 * THE OTHER ROUTE, ON PURPOSE, so that the third point shows both and says they
 * must agree. `q/n + r/n` divides twice and adds; this adds and divides once.
 * They agree because dividing a sum by 8 and summing the quotients are the same
 * operation, which is the one piece of `fraction-arithmetic` the merge needs and
 * the reason no learner has to be told that merging is safe.
 *
 * SAME SHAPE AS `TWO_ENTRIES_TAKEN_TOGETHER` AND A DIFFERENT PAIR OF LETTERS,
 * which is not redundancy. `q` and `r` are the two MIDDLE entries and `p` and
 * `s` the two ENDS, and the tasks that use them answer about different values
 * of Y — so a shared list would let a substitution claim that the ends and the
 * middles were the same two numbers, which is the one thing the table says they
 * are not.
 */
const THE_TWO_END_ENTRIES_MERGED_ON_COUNTS: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * ONE ENTRY OVER A COMPLEMENT — conditioning, which is the other way a table
 * gets rebuilt and the only one that needs a division.
 *
 * `(r/n)/(1 - p/n)` at (3, 1, 8) is (3/8)/(7/8) = 3/7 —
 * P(X = 2 given X is at least 1), once TTT has been ruled out.
 *
 * THE DENOMINATOR IS A COMPLEMENT RATHER THAN A SUPPLIED TOTAL, and that is the
 * whole reason this expression is shaped as it is. `1 - c/n` is
 * `sample-spaces`' third point, asked there at the same two numbers and
 * answering 7/8 on its own; here it sits UNDERNEATH an entry, which is the first
 * time in these subjects a complement has been divided by. A learner who
 * produces 3/7 has used the complement rule as a step rather than as an answer,
 * and has seen that the three surviving entries — 3/7, 3/7, 1/7 — add to 1 only
 * because of that division, their numerators adding to 7/8.
 *
 * IT CANNOT VANISH, WHICH IS CHECKED ON THE TASK AND NOT DECLARED AS A DOMAIN
 * CONDITION. `1 - p/n` is zero exactly when p = n, and at the one substitution
 * used p = 1 and n = 8. The expression itself is fine and only a substitution
 * could break it, and what it would break is not arithmetic: conditioning on an
 * event of probability 0 is undefined rather than merely awkward, because there
 * is no space left to replace the old one with.
 */
const AN_ENTRY_OVER_A_COMPLEMENT: VariableDeclaration[] = [
  { name: 'r', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * FOUR PREIMAGE SIZES AND THE SPACE — the same five numbers the table-total
 * expression takes, and the list five of this concept's nine tasks share.
 *
 * SHARED DELIBERATELY ACROSS FIVE TASKS, which is the opposite decision from
 * `TWO_ENTRIES_TAKEN_TOGETHER` and `TWO_ENTRIES_MERGED_AS_PROBABILITIES` above,
 * and the reason is that the letters mean ONE thing here and two things there.
 * `q` and `r` are the middle entries and `p` and `s` the ends, so a shared list
 * would have let a substitution claim the ends and the middles were the same two
 * numbers. In this concept every use of p, q, r, s, n is "the four preimage
 * sizes of some rule, in value order, over the size of the space" — for X, for
 * T, for the relabelled W and for the sum S — and what differs between the five
 * tasks is which RULE the sizes belong to and which VALUES weight them. Both of
 * those live in the expression, where they can be read, rather than in a
 * declaration, where they could not.
 *
 * SO THE DECLARATION IS WHAT MAKES THE CONCEPT'S CLAIM ASSERTABLE. The first two
 * tasks are the same expression at two substitutions, which no other pair in
 * these subjects is for this reason: the values 0, 1, 2, 3 are written into the
 * expression as literals, so two tasks differing ONLY in `at` prove that the
 * answer is not a function of the value list. Had the values been letters too,
 * the two substitutions would have differed in nine places and the
 * demonstration would have been invisible.
 */
const A_TABLE_AND_THE_SPACE_IT_CAME_FROM: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * THE WEIGHTED TOTAL WITH THE UNWEIGHTED ONE SUBTRACTED, so that "the weights
 * are doing work" is a number rather than a remark.
 *
 * `(0 + 1 + 2 + 3)/m - (0*p + 1*q + 2*r + 3*s)/n` at (1, 4, 2, 1, 8, 4) is
 * 12/8 - 11/8 = 1/8: how far the plain average of T's four values overshoots
 * E[T].
 *
 * THE SAME SHAPE AS `THE_TWO_SPACES_SIDE_BY_SIDE` AND THE SAME JUSTIFICATION.
 * `1/m` with `m` at 4 is a wrong answer there and the plain average is a wrong
 * route here, and in neither case is the reference the wrong number: what is
 * asked for is the GAP, which is a true fact about two computations, and the
 * prompt settles which of the two is licensed before asking for it. "Which
 * method is right" is a `state` task and unrulable; "how far apart are they" is
 * an `evaluate` that cannot be answered without doing both.
 *
 * IT IS ASKED ON T AND NOT ON X, WHICH IS THE WHOLE REASON THE TASK EXISTS. On
 * X the two routes agree at 3/2, because that table is symmetric, so the same
 * expression at X's substitution would have reference 0 — a true statement that
 * teaches the opposite of the point. The numerator `0 + 1 + 2 + 3` is left
 * unevaluated rather than written as 6 so that the two halves can be seen to be
 * reading the same four values.
 */
const A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE: VariableDeclaration[] = [
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * A LINEAR RULE WRAPPED AROUND A WHOLE TABLE — the push-through, with the table
 * appearing exactly once and the rule acting on it from outside.
 *
 * `a*((0*p + 1*q + 2*r + 3*s)/n) + b` at (2, 1, 1, 3, 3, 1, 8) is
 * 2(12/8) + 1 = 4.
 *
 * THE NESTING IS THE CLAIM AND IT IS WHY THIS IS NOT WRITTEN AS `a*e + b`. An
 * expression taking E[X] as a single letter would have been shorter and would
 * have asserted nothing: the content of the rule is that a and b reach the
 * answer WITHOUT reaching the four probabilities, and only a shape with the
 * table inside the brackets and the rule outside them says so. A learner looking
 * at `a*e + b` cannot see what was skipped.
 *
 * `a` AND `b` ARE SEPARATE LETTERS RATHER THAN THE LITERALS 2 AND 1, which is
 * the reverse of the decision about the values. The values are fixed by the
 * experiment — X counts heads, so 0, 1, 2, 3 are not parameters — while a and b
 * are what makes the rule LINEAR, and they are the two things the theorem is
 * quantified over. Writing them as letters is the difference between asking for
 * one number and asking for an instance of a rule.
 */
const A_LINEAR_RULE_OUTSIDE_A_WHOLE_TABLE: VariableDeclaration[] = [
  { name: 'a', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'p', assumptions: { integer: true } },
  { name: 'q', assumptions: { integer: true } },
  { name: 'r', assumptions: { integer: true } },
  { name: 's', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * TWO TOTALS OVER ONE SPACE, ADDED, WITH ONE DIVISION AT THE END — additivity in
 * the form that shows WHY it holds.
 *
 * `(g + h)/n` at (12, 11, 8) is 23/8: g is the total of X across the eight
 * sequences and h is the total of T across the same eight, and E[X + T] is their
 * sum over the space.
 *
 * THE TOTALS ARRIVE AS COUNTS AND THAT IS THE POINT, not a simplification.
 * Writing the two weighted sums out would have given the same 23/8 by a route
 * that hides the argument: the reason the two expectations add is that summing
 * X + T over the eight sequences adds the same numbers in a different order, so
 * 23 = 12 + 11 before any division happens. `(g + h)/n` is that sentence, and
 * the single `n` underneath both is the step `fraction-arithmetic` supplies —
 * dividing one total by 8 is the same as dividing two and adding.
 *
 * IT IS ALSO WHY NO INDEPENDENCE TEST APPEARS ANYWHERE IN THE EXPRESSION. There
 * is nothing in `(g + h)/n` that could carry one, which is the honest shape for
 * a fact that does not need one — and the task that DOES run the product test
 * is in the concept below, where independence is a product of probabilities
 * rather than a condition on this sum.
 */
const TWO_TOTALS_OVER_ONE_SPACE: VariableDeclaration[] = [
  { name: 'g', assumptions: { integer: true } },
  { name: 'h', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * THE TOTAL OF A PRODUCT AGAINST THE PRODUCT OF TWO TOTALS — the near miss, and
 * the one place this concept's arithmetic is a subtraction rather than a total.
 *
 * `k/n - (g/n)*(h/n)` at (17, 12, 11, 8) is 17/8 - (12/8)(11/8) = 34/16 - 33/16
 * = 1/16.
 *
 * THE SAME THREE LETTERS AS `TWO_TOTALS_OVER_ONE_SPACE` PLUS ONE, DELIBERATELY,
 * because g and h mean exactly what they mean there — the totals of X and of T
 * over the eight sequences — and the pair of tasks is the comparison. Additivity
 * is `(g + h)/n` and is exact; the multiplicative version is this, and is not.
 * A different letter set would have made two unrelated-looking tasks out of one
 * fact.
 *
 * THE REFERENCE IS 1/16 AND IT IS A GAP, like the two above and for the third
 * distinct reason in this subject. The first gap is between two SPACES, the
 * second between two METHODS on one table, and this is between two sides of an
 * identity that does not hold. What makes it worth asking is its SIZE: 34/16
 * against 33/16 would pass any rounded comparison, so a learner who has computed
 * 1/16 knows the identity is false in a way that eyeballing two decimals cannot
 * establish.
 *
 * AND IT IS A COVARIANCE, WHICH THE FIFTY-FIRST PROMOTION NAMED AND THIS
 * DECLARATION IS NOW SHARED WITH. This expression is E[XY] - E[X]E[Y] exactly.
 * When it was written, `variance-and-covariance` was a node of `probability` and
 * the material deliberately did not name the number, because naming it would
 * promise an account of what it MEANS and the subject had independence only as a
 * test. That concept is now the seventh of `chance-and-events`, its third point
 * gives the number its job — twice it is the amount by which Var(X + T) exceeds
 * Var(X) + Var(T) — and the tenth task of that concept is THIS EXPRESSION AT A
 * SECOND SUBSTITUTION, where it comes out 0 on a pair one of whose members is a
 * function of the other. So the paragraph above stands as written and the
 * boundary it describes has been crossed on purpose rather than eroded; see the
 * `── variance-and-covariance ──` block for why the second substitution is the
 * sharper half of the pair.
 */
const A_PRODUCT_TOTAL_AGAINST_A_PRODUCT_OF_TOTALS: VariableDeclaration[] = [
  { name: 'k', assumptions: { integer: true } },
  { name: 'g', assumptions: { integer: true } },
  { name: 'h', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * THREE SPREADS OVER A COMMON DENOMINATOR, SUBTRACTED — the shortfall that stops
 * variances adding, asked as a difference of numbers already in hand.
 *
 * `(u - v - w)/d` at (103, 48, 47, 64) is (103 - 48 - 47)/64 = 8/64 = 1/8: u is
 * Var(X + T), v is Var(X) and w is Var(T), each over sixty-fourths.
 *
 * THE NUMERATORS ARRIVE AS INTEGERS AND THAT IS THE POINT, which is the same
 * decision as `TWO_TOTALS_OVER_ONE_SPACE` one concept down and for the same
 * reason. The three variances are computed by three other tasks, so rebuilding
 * them inside this expression would ask those questions a second time and bury
 * the one this task is for. What is being asked is whether the three numbers are
 * CONSISTENT with the spreads adding, and over a common denominator of 64 that is
 * a single subtraction: 103 against 95.
 *
 * THE REFERENCE IS A GAP, like the two in the concept below and for a fourth
 * distinct reason. There the gaps are between two spaces, between two methods on
 * one table, and between two sides of a false identity. This one is between two
 * sides of a TRUE identity with a term left out — Var(X + T) really does equal
 * Var(X) + Var(T) + 2Cov(X, T), and 1/8 is what the omitted term was worth. So a
 * learner who produces it has not found an error; they have measured a quantity
 * the concept below computed as 1/16 and left unnamed, and doubled it.
 */
const THREE_SPREADS_OVER_A_COMMON_DENOMINATOR: VariableDeclaration[] = [
  { name: 'u', assumptions: { integer: true } },
  { name: 'v', assumptions: { integer: true } },
  { name: 'w', assumptions: { integer: true } },
  { name: 'd', assumptions: { integer: true } },
]

/**
 * ONE INDICATOR'S SPREAD, TAKEN j TIMES — additivity under independence, in the
 * form that shows what independence bought.
 *
 * `j*(a/n - (a/n)*(a/n))` at (3, 4, 8) is 3(1/2 - 1/4) = 3/4: a is how many of
 * the n sequences put the indicator at 1, and j is how many independent copies
 * are being added.
 *
 * THE INNER BRACKET IS THE TWO-TOTAL IDENTITY AT A VARIABLE THAT IS ITS OWN
 * SQUARE, which is why it is written as `a/n - (a/n)*(a/n)` and not as a single
 * number. A indicator takes only 0 and 1, so A² IS A, so E[A²] = E[A] = a/n and
 * the identity collapses to p - p². Writing 1/4 directly would have asked
 * nothing; writing the subtraction says WHERE the 1/4 comes from, and a reader
 * can see that the same shape that gave 3 - 9/4 for the heads-count gives this.
 *
 * `j` IS A LETTER AND `3` IS NOT THE POINT. What the task asserts is that
 * independent spreads add, so the multiplier is the thing being quantified over —
 * the same reasoning that makes `a` and `b` letters in
 * `A_LINEAR_RULE_OUTSIDE_A_WHOLE_TABLE` while the values 0, 1, 2, 3 stay
 * literals. And the answer is 3/4, which is the heads-count's variance computed
 * in the first point from four deviations and in the second from two totals: a
 * third route to one number, and the only one of the three that never mentions
 * the table.
 */
const ONE_INDICATOR_SPREAD_TAKEN_SEVERAL_TIMES: VariableDeclaration[] = [
  { name: 'j', assumptions: { integer: true } },
  { name: 'a', assumptions: { integer: true } },
  { name: 'n', assumptions: { integer: true } },
]

/**
 * A WEIGHT AS A RATIO OF TWO INTEGERS — the first parameter in this subject that
 * is meant to MOVE, and the reason it is two letters rather than one.
 *
 * `b/m - (b/m)*(b/m)` at (1, 3) is 1/3 - 1/9 = 2/9: the spread of a single trial
 * whose success probability is b/m. At (1, 5) the same expression is 4/25, and at
 * (1, 2) it would be the 1/4 `ONE_INDICATOR_SPREAD_TAKEN_SEVERAL_TIMES` carries
 * inside its bracket.
 *
 * IT IS THAT DECLARATION'S INNER BRACKET WITH THE COUNT REMOVED AND THE WEIGHT
 * FREED, which is the whole relationship between the two concepts. There the
 * weight is `a/n` — how many of the n sequences put the indicator at 1 — so it
 * is a FACT ABOUT A SPACE and cannot be anything but 4/8. Here it is b/m, a
 * parameter of the experiment, and the two tasks that share this declaration
 * differ only in what it is set to. A reader can see that the arithmetic did not
 * change and the status of the number did.
 *
 * TWO LETTERS AND NOT ONE, BECAUSE `exactValue` SETTLES RATIONALS AND THE
 * SUBSTITUTION IS A STRING. A single `p` set to `1/3` would also work, and it
 * would hide the thing the pair of tasks is for: with b and m separate, moving
 * the parameter is visibly moving ONE of the two inputs, and `(m - b)/m` is the
 * complement written in the same terms rather than as a second decimal.
 */
const A_WEIGHT_AS_A_RATIO_OF_INTEGERS: VariableDeclaration[] = [
  { name: 'b', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * A COUNT OF EQUALLY PRICED RUNS AND THE WEIGHT THEY ARE PRICED AT — the
 * binomial entry, with the two subjects' contributions kept in separate letters.
 *
 * `c*(b/m)*((m - b)/m)*((m - b)/m)` at (3, 1, 2) is 3(1/2)(1/2)(1/2) = 3/8, which
 * is P(X = 1) on the three tosses every concept of this subject since the fourth
 * is set on. At (3, 1, 3) it is 3(1/3)(2/3)(2/3) = 4/9.
 *
 * `c` IS A LETTER AND THE THREE FACTORS ARE NOT, which is the same decision
 * `A_LINEAR_RULE_OUTSIDE_A_WHOLE_TABLE` makes about a and b. The coefficient is
 * `counting-principles`' work and arrives from outside, so it is the input; the
 * SHAPE of the product — one weight per success and one complement per failure —
 * is what the entry IS, so it is written out. Three factors rather than a power,
 * because at n = 3 the exponents are 1 and 2 and spelling them out lets a reader
 * count the trials.
 *
 * THE PAIR DISAGREES AND THE DISAGREEMENT IS THE CONTENT, which is the shape the
 * seventh concept's first pair established. 3/8 against 4/9 says that moving the
 * weight DOWN raises the chance of exactly one success, which is not obvious and
 * is not a rounding: 27/72 against 32/72.
 */
const A_COUNT_OF_RUNS_AND_THE_WEIGHT_THEY_COST: VariableDeclaration[] = [
  { name: 'c', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

/**
 * A PLAIN AVERAGE AGAINST A MEAN BUILT FROM TWO PARAMETERS — the sixth concept's
 * comparison asked again at a weight that is not a half.
 *
 * `(0 + 1 + 2 + 3)/v - j*(b/m)` at (4, 3, 1, 3) is 3/2 - 1 = 1/2.
 *
 * IT IS `A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE` WITH THE TABLE REPLACED BY A
 * FORMULA, and that substitution is the point. There the right-hand term is
 * `(0*p + 1*q + 2*r + 3*s)/n` — four preimage sizes over the size of the space,
 * so the expectation can only be computed by reading a table. Here it is
 * `j*(b/m)`, which is np, so the same number comes out of two parameters with no
 * table consulted at all. The LEFT-hand term is unchanged, which is what makes
 * the two tasks comparable: the same four values, averaged the same wrong way.
 *
 * AND THE REFERENCE IS 1/2 WHERE THE SAME COMPARISON ON X WOULD BE 0, which is
 * the whole of why this task exists. `A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE`
 * had to be asked on T because on X the two routes agree and the reference would
 * be a true 0 that teaches the opposite of its point. This asks it on X — on the
 * heads-count itself — and gets 1/2, because the weight has moved off a half.
 * So the coincidence that had to be explained away in two earlier concepts is
 * DESTROYED here by moving a parameter rather than by changing the rule.
 *
 * `v` IS 4 BECAUSE THE LIST HAS FOUR ENTRIES and `j` is 3 because there are three
 * trials, and they are separate letters because they are separate facts that
 * happen to be close together. Writing one letter for both would make the task
 * pass unchanged if a four-trial binomial were ever substituted.
 */
const A_PLAIN_AVERAGE_AGAINST_A_PARAMETERISED_MEAN: VariableDeclaration[] = [
  { name: 'v', assumptions: { integer: true } },
  { name: 'j', assumptions: { integer: true } },
  { name: 'b', assumptions: { integer: true } },
  { name: 'm', assumptions: { integer: true } },
]

export const TASKS: PracticeTask[] = [
  /*
   * ── fraction-arithmetic ─────────────────────────────────────────────────
   *
   * Three `evaluate` tasks with integer symbols, one per knowledge point,
   * because that is this subject's contract rather than a style preference:
   * "the third subject is gradable with no worker" is asserted in
   * tests/concepts-logic.mjs over every task it owns.
   *
   * The first draft used `transform_to_form` with `single_fraction` and was
   * wrong twice over. It would have made arithmetic — the root of the whole
   * map — depend on the CAS worker being reachable, so an outage would wall
   * off the entry point rather than a branch. And the division task was a free
   * mark: `single_fraction` means "one quotient, no top-level sum", and
   * `(2x/3)/(4/5)` is already one quotient, so the given satisfied the form it
   * was being asked to reach. The test for that caught it by name.
   *
   * Exact rational arithmetic is what `exactValue` settles, so each reference
   * below is reproducible from its given with nothing consulted — which is the
   * property that makes fractions the right concept to put here.
   */
  {
    id: 'fraction-add-1',
    knowledgePointId: 'only-same-sized-parts-add',
    kind: 'evaluate',
    prompt:
      'Evaluate a/b + c/d at a = 2, b = 3, c = 1, d = 4. Only parts of the same size can be '
      + 'added, so the work is cutting both into twelfths first.',
    given: 'a/b + c/d',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '2', b: '3', c: '1', d: '4' },
    reference: '11/12',
  },
  {
    id: 'fraction-multiply-1',
    knowledgePointId: 'multiplying-needs-no-common-denominator',
    kind: 'evaluate',
    prompt:
      'Evaluate (a/b) · (c/d) at a = 4, b = 9, c = 3, d = 8. No common denominator is wanted '
      + 'here — cancel across the product and the numbers stay small.',
    given: '(a/b) * (c/d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '4', b: '9', c: '3', d: '8' },
    reference: '1/6',
  },
  {
    id: 'fraction-divide-1',
    knowledgePointId: 'dividing-is-multiplying-by-the-reciprocal',
    kind: 'evaluate',
    prompt:
      'Evaluate (a/b) ÷ (c/d) at a = 2, b = 3, c = 4, d = 5. Dividing by c/d multiplies by d/c, '
      + 'which is why the answer can be larger than you started with.',
    given: '(a/b) / (c/d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true, nonzero: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '2', b: '3', c: '4', d: '5' },
    reference: '5/6',
  },

  /*
   * ── prime-factorisation ─────────────────────────────────────────────────
   *
   * `evaluate` like the rest of this subject, and for a reason stronger than
   * consistency: there is no form that can ask for a product of primes.
   * `checkFactored` is symbol-relative, a numeral has degree 0, and degree 0
   * is reported as already irreducible — so `transform_to_form` with
   * `factored` would be satisfied by handing the number back unchanged. The
   * concept's own header in ontology-arithmetic.ts has the full argument.
   *
   * What that costs is stated rather than hidden: none of these three asks the
   * learner to FIND a factorisation. Each asks a question that can only be
   * answered once you have one, so each prompt hands over the factorisation
   * and names the step it is standing in for. Finding it is what the worked
   * examples are for.
   *
   * Three different numbers from the ones in the worked examples, so the task
   * is not a recall of the example. Each reference is reproducible from its
   * given by exact rational arithmetic, which the subject's test group checks
   * for every task it owns.
   */
  {
    id: 'prime-factorisation-check-1',
    knowledgePointId: 'one-factorisation-each',
    kind: 'evaluate',
    prompt:
      'A prime factorisation is a claim, and multiplying it back out is the only check there '
      + 'is on one. Evaluate p^a · q^b · r^c at p = 2, a = 1, q = 5, b = 2, r = 7, c = 2 — this '
      + 'is that check on "2450 = 2 · 5² · 7²".',
    given: 'p^a * q^b * r^c',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'r', assumptions: { integer: true, positive: true } },
      { name: 'c', assumptions: { integer: true } },
    ],
    at: { p: '2', a: '1', q: '5', b: '2', r: '7', c: '2' },
    reference: '2450',
  },
  /*
   * The ask this concept actually teaches, now that a form can express it.
   *
   * Its three sibling tasks are all `evaluate`, and the concept's header says
   * why: no form could demand a product of primes, so each one hands the
   * factorisation over in the prompt and asks the learner to multiply it back.
   * That is the proxy-task compromise this file warns about — it drills the
   * check and never asks for the work.
   *
   * `prime_factored` is that form, and `ruleTransform`'s exact-arithmetic path
   * is what keeps this task inside the subject's no-worker contract: 2310 and
   * 2 · 3 · 5 · 7 · 11 are both integers, so the equivalence half is bigint
   * arithmetic and never reaches the CAS.
   *
   * 2310 is the product of the first five primes, chosen so that every prime is
   * distinct and no exponent is above 1 — the exponent-collecting case is what
   * the worked example covers, and a first task should not need both moves at
   * once. It shares no number with the three worked examples.
   */
  {
    id: 'prime-factorisation-factorise-1',
    knowledgePointId: 'one-factorisation-each',
    kind: 'transform_to_form',
    prompt: 'Write 2310 as a product of primes.',
    given: '2310',
    form: 'prime_factored',
    variables: [],
    reference: '2 * 3 * 5 * 7 * 11',
  },
  {
    id: 'prime-factorisation-divisor-count-1',
    knowledgePointId: 'the-exponents-count-the-divisors',
    kind: 'evaluate',
    prompt:
      '1350 = 2 · 3³ · 5², so its exponents are 1, 3 and 2. A divisor is an independent choice '
      + 'of how many of each prime to take, which makes the number of them (a+1)(b+1)(c+1). '
      + 'Evaluate that at a = 1, b = 3, c = 2.',
    given: '(a + 1) * (b + 1) * (c + 1)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'c', assumptions: { integer: true } },
    ],
    at: { a: '1', b: '3', c: '2' },
    reference: '24',
  },
  {
    id: 'prime-factorisation-square-part-1',
    knowledgePointId: 'a-square-has-even-exponents',
    kind: 'evaluate',
    prompt:
      '1960 = 2³ · 5 · 7². The primes with an odd exponent are 2 and 5, and taking one copy of '
      + 'each out leaves every exponent even — which is to say, leaves the largest square that '
      + 'divides 1960. Evaluate n/(p · q) at n = 1960, p = 2, q = 5.',
    given: 'n / (p * q)',
    variables: [
      { name: 'n', assumptions: { integer: true } },
      { name: 'p', assumptions: { integer: true, nonzero: true } },
      { name: 'q', assumptions: { integer: true, nonzero: true } },
    ],
    at: { n: '1960', p: '2', q: '5' },
    reference: '196',
  },

  /*
   * ── gcd-and-lcm ─────────────────────────────────────────────────────────
   *
   * `evaluate` like the rest of this subject, and under a sharper version of
   * the same constraint. ontology.ts recorded the problem when it skipped this
   * node: a gcd is a NUMBER, every task must declare a symbol, and so "what is
   * gcd(48, 180)" has no shape here at all. The answer is that while a gcd is
   * not an expression, `p^a · q^b` at stated primes and exponents is — and it
   * IS the gcd once the exponents are the minima.
   *
   * So each of these hands over what the previous concept supplies and asks the
   * arithmetic that turns it into the answer. The first is given the
   * factorisations and the minima; the second is given the gcd; the third is
   * given the lcm and told the result will not be in lowest terms. What none of
   * them asks is which exponent is the smaller, because that is a relation
   * between two integers and no form in forms.ts can demand one — the same gap
   * that stops a task asking for a product of primes. Each prompt names the
   * step it stands in for, and the choosing is what the worked examples teach.
   *
   * Different numbers from the worked examples in all three cases, so none is a
   * recall of its own example. Every reference is reproducible from its given
   * by exact rational arithmetic, which is what the subject's test group checks
   * over every task it owns.
   */
  {
    id: 'gcd-from-the-exponents-1',
    knowledgePointId: 'the-exponents-decide-both',
    kind: 'evaluate',
    prompt:
      '540 = 2² · 3³ · 5 and 378 = 2 · 3³ · 7. The gcd takes the smaller exponent of each '
      + 'prime: one 2, three 3s, and nothing of the 5 or the 7 because each is missing from one '
      + 'of the two. Evaluate p^a · q^b at p = 2, a = 1, q = 3, b = 3 — that product is the gcd.',
    given: 'p^a * q^b',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { p: '2', a: '1', q: '3', b: '3' },
    reference: '54',
  },
  {
    id: 'lcm-from-the-gcd-1',
    knowledgePointId: 'the-product-is-the-pair',
    kind: 'evaluate',
    prompt:
      '90 = 2 · 3² · 5 and 48 = 2⁴ · 3, so gcd(90, 48) = 2 · 3 = 6. Because gcd · lcm is the '
      + 'product of the pair, the lcm is that product divided by the gcd — no second pass over '
      + 'the exponents is needed. Evaluate (a · b)/g at a = 90, b = 48, g = 6.',
    given: '(a * b) / g',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'g', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '90', b: '48', g: '6' },
    reference: '720',
  },
  /*
   * The same `given` as `fraction-add-1`, deliberately, because the numbers are
   * the content here. That task adds thirds and quarters: coprime denominators,
   * so their lcm IS their product and the answer is already in lowest terms —
   * which makes it exactly the case in which neither of these two numbers has
   * anything to do. This one is the case where both do.
   */
  {
    id: 'common-denominator-is-an-lcm-1',
    knowledgePointId: 'a-common-denominator-is-an-lcm',
    kind: 'evaluate',
    prompt:
      'Evaluate a/b + c/d at a = 1, b = 15, c = 1, d = 10, and give the answer in lowest terms. '
      + '15 = 3 · 5 and 10 = 2 · 5, so the denominator to work over is lcm(15, 10) = 30 rather '
      + 'than 150 — and when the two numerators are added the result still shares a factor with '
      + '30, so the addition is not the last step.',
    given: 'a/b + c/d',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '1', b: '15', c: '1', d: '10' },
    reference: '1/6',
  },

  /*
   * ── roots-and-irrationals ─────────────────────────────────────────────────
   *
   * Four tasks, and the shape of all four is decided by one fact: the natural
   * task for this concept is "simplify √720" and no form in forms.ts can
   * demand it. `radical_free` asks for the radical to GO, and 12√5 still has
   * one; what is wanted is "no square factor remains underneath", which is a
   * claim about a subterm's factorisation rather than about the top-level
   * shape of the answer. That is the third time this subject has met the same
   * missing-form wall — see the concept's header in ontology-arithmetic.ts.
   *
   * So these compute WITH the split rather than asking for it, the way
   * `prime-factorisation` and `gcd-and-lcm` do above. The first asks for a
   * root that comes out whole, which is the one case needing no split at all;
   * the second hands over the extracted root and asks for the square-free part
   * by division; the third asks the one root of a non-integer that is exactly
   * rational; the fourth squares the best small approximation to √2 and lets
   * the learner see it miss. Each prompt names the step it stands in for.
   *
   * Every one is settled by `exactValue` with no worker configured, which was
   * checked rather than assumed for a concept about irrational numbers: a
   * `sqrt` node and a rational exponent are both handled, returning a value
   * when it is rational and null when it is not. So all four re-derive
   * locally and none needs adding to `WORKER_ONLY` in the test suite.
   *
   * Different numbers from the worked examples throughout — the examples use
   * 1728, 720, 2 and 45 — so none of these is a recall of its own exposition.
   */
  {
    id: 'fourth-root-from-exponents-1',
    knowledgePointId: 'a-root-undoes-a-power',
    kind: 'evaluate',
    prompt:
      '4096 = 2¹², and the index you are rooting by is 4. The exponent 12 is divisible by 4, so '
      + 'this root comes out a whole number and the root is built by dividing the exponent rather '
      + 'than by searching: 2^(12/4) = 2³. Evaluate x^(1/n) at x = 4096, n = 4.',
    given: 'x^(1/n)',
    variables: [
      { name: 'x', assumptions: { integer: true, positive: true } },
      { name: 'n', assumptions: { integer: true, positive: true } },
    ],
    at: { x: '4096', n: '4' },
    reference: '8',
  },
  {
    id: 'square-free-part-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'evaluate',
    prompt:
      '2700 = 2² · 3³ · 5². Only the 3 has an odd exponent, so one copy of it has to stay under '
      + 'the radical and everything else comes out: the largest square factor is 2² · 3² · 5² = '
      + '900, whose root is 30. What stays behind is 2700 divided by that square — evaluate '
      + 'x / c^2 at x = 2700, c = 30. Your answer is the number left under the radical when '
      + '√2700 is written as 30 times a smaller root.',
    given: 'x / c^2',
    variables: [
      { name: 'x', assumptions: { integer: true, positive: true } },
      { name: 'c', assumptions: { integer: true, nonzero: true } },
    ],
    at: { x: '2700', c: '30' },
    reference: '3',
  },
  /*
   * The ask this concept is named for, finally expressible.
   *
   * `roots-and-irrationals`' header records the gap at length: the natural task
   * for this knowledge point is "simplify √720", and it could not be asked.
   * `radical_free` demands the radical GO and 12√5 still has one, so the two
   * tasks beside this one hand the extracted root over in the prompt and ask
   * for a division instead — the move the concept most wants to teach, replaced
   * by its own last step.
   *
   * Two things had to land for this to work, and the second was not the one the
   * header predicted. `surd_reduced` is the form. But `transform_to_form` was
   * also routed unconditionally to the CAS, and this subject's contract is that
   * every task in it grades with no worker — so `asSurd` in numerals.ts put
   * both sides in normal form, which is a decision rather than a heuristic
   * because √r for distinct square-free r are linearly independent over Q.
   *
   * 1008 = 2⁴ · 3² · 7, so the square part is 144 and the answer is 12√7.
   * Different numbers from the worked example's 720 = 12√5, and from 2700 in
   * the task above, so it is not a recall of either.
   */
  {
    id: 'simplify-a-surd-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'transform_to_form',
    prompt:
      'Simplify √1008, leaving nothing under the radical that need not be there. Write it as a '
      + 'whole number times a smaller root.',
    given: 'sqrt(1008)',
    form: 'surd_reduced',
    variables: [],
    reference: '12*sqrt(7)',
  },
  {
    id: 'root-of-a-fraction-1',
    knowledgePointId: 'pull-the-square-out',
    kind: 'evaluate',
    prompt:
      'A root splits over a quotient as well as over a product: √(a/b) = √a / √b. Both 49 and 16 '
      + 'are perfect squares, so this is the case where a root of something that is not a whole '
      + 'number is still exactly rational. Evaluate sqrt(a/b) at a = 49, b = 16.',
    given: 'sqrt(a/b)',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '49', b: '16' },
    reference: '7/4',
  },
  {
    id: 'no-ratio-squares-to-two-1',
    knowledgePointId: 'root-of-a-non-square-is-irrational',
    kind: 'evaluate',
    prompt:
      '99/70 is a classical approximation to √2 and a close one — it is within one ten-thousandth. '
      + 'If the proof in this point is right then squaring it cannot give exactly 2, however close '
      + 'it looks, so it is worth seeing what it gives instead. Evaluate (a/b)^2 at a = 99, '
      + 'b = 70, and compare your answer with 2 written over the same denominator, which is '
      + '9800/4900.',
    given: '(a/b)^2',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '99', b: '70' },
    reference: '9801/4900',
  },

  /*
   * ── decimal-representation ──────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, and the missing-form wall
   * is steeper here than anywhere else in the subject: the thing this concept
   * teaches is how to WRITE a rational number, and 0.125 and 1/8 are the same
   * rational number. So an equivalence check cannot prefer one over the other,
   * and asking "write 1/8 as a decimal" would mark `1/8` correct. There is no
   * form to demand the decimal shape — the concept's header in
   * ontology-arithmetic.ts names the one that would do it and says why it was
   * not added in a content pass.
   *
   * So none of these asks for a decimal. Each asks the arithmetic the method
   * genuinely turns on, where the answer is a single number that only comes out
   * right if the step was understood, and each prompt names the move it stands
   * in for:
   *
   *  - the first completes a denominator to a power of ten, which is the step
   *    that converts at all. The reduction to 1/8 is handed over in the prompt,
   *    because reducing is the other thing no form can demand.
   *  - the second divides 10⁶ − 1 by 7, which is the recurrence fact without
   *    the long division: the quotient 142857 IS the repeating block of 1/7, so
   *    the answer is the digits rather than a number about them.
   *  - the third performs the align-and-subtract itself, as the one quotient
   *    (416 − 41)/(1000 − 100) the method reduces to.
   *
   * All three are integer arithmetic settled by `exactValue` with no worker, so
   * none goes in `WORKER_ONLY`. Different numbers from the worked examples
   * throughout — those use 7/56, 3/7 and 0.41666… — except the 7 in the second,
   * which is deliberate: it is the same denominator seen from the other side,
   * and the prompt says so.
   */
  {
    id: 'complete-the-denominator-1',
    knowledgePointId: 'terminates-when-the-denominator-is-only-2s-and-5s',
    kind: 'evaluate',
    prompt:
      '14/112 reduces to 1/8, and 8 = 2³ contains no prime but 2, so this one terminates. '
      + 'Converting it means completing the denominator to a power of ten: 2³ needs three 5s to '
      + 'become 2³ · 5³ = 1000. Evaluate (a * p^k) / (b * p^k) at a = 1, b = 8, p = 5, k = 3. '
      + 'Your answer is 1/8, and the numerator and denominator you pass through on the way — '
      + 'read as a numerator over a power of ten — are what its three decimal places are.',
    given: '(a * p^k) / (b * p^k)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'k', assumptions: { integer: true } },
    ],
    at: { a: '1', b: '8', p: '5', k: '3' },
    reference: '0.125',
  },
  {
    id: 'repeating-block-from-nines-1',
    knowledgePointId: 'a-remainder-must-repeat',
    kind: 'evaluate',
    prompt:
      'A block of length n means the denominator divides 10ⁿ − 1, which is why a purely '
      + 'recurring decimal can be written over a string of nines. For 7 the block has length 6, '
      + 'so 7 divides 999999. Evaluate (10^n - 1) / d at n = 6, d = 7. Your answer is not just a '
      + 'quotient: it is the repeating block of 1/7 itself, digit for digit.',
    given: '(10^n - 1) / d',
    variables: [
      { name: 'n', assumptions: { integer: true, positive: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { n: '6', d: '7' },
    reference: '142857',
  },
  {
    id: 'align-and-subtract-1',
    knowledgePointId: 'subtract-to-clear-the-recurring-tail',
    kind: 'evaluate',
    prompt:
      'Take x = 0.41666…, where only the 6 repeats. Two fixed digits and a block of one give '
      + '1000x = 416.666… and 100x = 41.666…, whose tails are identical — so subtracting leaves '
      + 'whole numbers on both sides. That subtraction is this quotient: evaluate '
      + '(a - b) / (c - d) at a = 416, b = 41, c = 1000, d = 100. Your answer is x exactly.',
    given: '(a - b) / (c - d)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true } },
    ],
    at: { a: '416', b: '41', c: '1000', d: '100' },
    reference: '5/12',
  },

  /*
   * ── real-number-line ────────────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, and this concept is the
   * hardest case in the subject for the proxy rule rather than for the missing
   * form. The content is a decimal expansion that does not stop, a set with no
   * last element, and an axiom about infinite sets. None of those is a value,
   * and no `NamedForm` would change that — unlike `decimal-representation`,
   * where a `decimal_expansion` form genuinely would close the gap.
   *
   * So each asks the one comparison the argument turns on, and each prompt
   * names what it stands in for:
   *
   *  - the first clears the decimal point and compares two integers. 2.64² < 7
   *    and 264² < 7 · 100² are the same statement, and the integer form is the
   *    mathematically honest one: it is what shows that every digit of an
   *    irrational root is settled by whole-number arithmetic, so the
   *    irrationality lives in the non-termination and never in a step.
   *  - the second is the mean itself, which is the one part of that point that
   *    IS a construction with an answer. The conclusion it supports — that the
   *    move never runs out, so nothing has a next number — cannot be asked.
   *  - the third is one hypothesis of a two-hypothesis argument: that 17/12 is
   *    above √2, hence above every term of the increasing list. "And no bound
   *    is least" is the other half and is unaskable; the prompt says so.
   *
   * The first and third are both "square and subtract", which is worth
   * admitting rather than disguising: they are the same decision procedure run
   * in opposite directions, one establishing a lower bracket on a digit and one
   * an upper bound on a set, and on different kinds of operand — integers after
   * clearing a decimal, and a fraction. They are not proxies for each other,
   * and the middle task is a different shape entirely.
   *
   * All three are integer or rational arithmetic settled by `exactValue` with
   * no worker, which was worth checking for a concept about numbers
   * `exactValue` returns null for. Not one of them asks for an irrational
   * value. Different numbers from the worked examples where it matters — those
   * use √7 at 2.64, the pair 2/9 and 3/13, and the bound 17/12 — except the
   * 17/12 in the third, deliberately: it is the bound the example establishes
   * and the task is the single comparison that establishes it, so a different
   * fraction would be a different claim rather than a fresh exercise.
   */
  {
    id: 'clear-the-point-to-settle-a-digit-1',
    knowledgePointId: 'every-digit-is-settled-by-whole-numbers',
    kind: 'evaluate',
    prompt:
      '2.65² = 7.0225 is already past 7, so the second decimal place of √7 is 4 rather than 5 — '
      + 'provided 2.64 is still short of it. Comparing 2.64² with 7 is the same as comparing '
      + '264² with 7 · 100², which is the form worth seeing: the digits of an irrational root '
      + 'are decided by whole-number arithmetic, and nothing at any single step is approximate. '
      + 'Evaluate n * m^2 - d^2 at n = 7, m = 100, d = 264. A positive answer says 2.64² is '
      + 'still below 7 and the digit stands. The task cannot ask for the digit itself — a digit '
      + 'is not a value this engine can demand of an expression — so it asks the comparison the '
      + 'digit rests on.',
    given: 'n * m^2 - d^2',
    variables: [
      { name: 'n', assumptions: { integer: true, positive: true } },
      { name: 'm', assumptions: { integer: true, positive: true } },
      { name: 'd', assumptions: { integer: true, positive: true } },
    ],
    at: { n: '7', m: '100', d: '264' },
    reference: '304',
  },
  {
    id: 'mean-of-two-fractions-1',
    knowledgePointId: 'no-two-reals-are-adjacent',
    kind: 'evaluate',
    prompt:
      'Over the common denominator 165 the fractions 4/15 and 3/11 are 44/165 and 45/165 — '
      + 'consecutive numerators, which is exactly the shape that makes adjacency look real. The '
      + 'mean settles it, and it is also the whole construction rather than a check on one: '
      + 'evaluate (a/b + c/d) / 2 at a = 4, b = 15, c = 3, d = 11. Your answer lies strictly '
      + 'between the two, so they were never adjacent — and the same move applies to it and '
      + 'either of them in turn, which is the part no task can ask you for.',
    given: '(a/b + c/d) / 2',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
      { name: 'c', assumptions: { integer: true } },
      { name: 'd', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '4', b: '15', c: '3', d: '11' },
    reference: '89/330',
  },
  {
    id: 'a-rational-upper-bound-1',
    knowledgePointId: 'completeness-is-assumed-not-proved-here',
    kind: 'evaluate',
    prompt:
      'Showing that 17/12 bounds the increasing list 1, 1.4, 1.41, 1.414, … means showing '
      + '(17/12)² is above 2, since squaring preserves order on the positives and every term of '
      + 'the list squares to below 2. That is one subtraction and its sign is the ruling: '
      + 'evaluate (p/q)^2 - n at p = 17, q = 12, n = 2. A positive answer makes 17/12 an upper '
      + 'bound. How SMALL the answer is hints at the other half of the point, which is that no '
      + 'rational bound is the least one — and that half is a claim about an infinite set, so no '
      + 'task in this build can ask for it.',
    given: '(p/q)^2 - n',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'q', assumptions: { integer: true, nonzero: true } },
      { name: 'n', assumptions: { integer: true, positive: true } },
    ],
    at: { p: '17', q: '12', n: '2' },
    reference: '1/144',
  },

  /*
   * ── ratio-and-rate ──────────────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, exact rational arithmetic
   * throughout so the subject's "gradable with no worker" contract still holds
   * over every task it owns.
   *
   * THIS IS THE FIRST BLOCK IN THE SUBJECT THAT OWES NO PROXY APOLOGY, and the
   * reason is a property of the concept rather than better asks. Every one of
   * its three points is about a NUMBER: a share is a value, a price per
   * kilogram is a value, and "how far apart are the two readings" is a value.
   * Compare `real-number-line` directly above, where the content is a
   * non-terminating expansion, a set with no last element and an axiom about
   * infinite sets, and all three tasks had to stand in for something. Nothing
   * here stands in for anything.
   *
   * What each one asks, and why it is the content rather than beside it:
   *
   *  - the first is one part times a term. The whole error the point exists to
   *    stop is using the wrong denominator — 3/5 of the total instead of 3/8 —
   *    and `p + q` in the given is exactly the disputed quantity, so a learner
   *    who makes that mistake cannot arrive at the reference.
   *  - the second is a difference of two unit rates, and its SIGN is the
   *    ruling. That is the point's own shape: the comparison is the content and
   *    the two prices are not, which is why the task subtracts rather than
   *    asking for either rate alone.
   *  - the third is the proportional reading minus the additive one. A non-zero
   *    answer refutes the additive reading arithmetically, which is the
   *    refutation-by-value shape `plane-geometry` found five times over. Zero
   *    would mean the two readings agreed, and they agree only when the scale
   *    factor is 1.
   *
   * Different numbers from the worked examples in all three, since none of
   * these is establishing a specific claim the example made: the shares are
   * 360 in 4 : 5 rather than 240 in 3 : 5, the bags are 4 kg and 6 kg rather
   * than 3 kg and 5 kg, and the paint is 9 litres over 4 rooms rather than 8
   * over 5.
   *
   * What stays unscored is one step, and it is the same one every block in this
   * subject names: which way up the second task's division goes. A learner
   * handed `a/b - c/d` with a in pence and b in kilograms has been told it is
   * price per weight. The prompt says so.
   */
  {
    id: 'one-part-settles-both-shares-1',
    knowledgePointId: 'a-ratio-fixes-the-quotient-not-the-quantities',
    kind: 'evaluate',
    prompt:
      'Share 360 in the ratio 4 : 5 and give the FIRST share. The terms count parts, so the '
      + 'denominator is their sum and not either of them — which is the whole of what this task '
      + 'checks, since using 4/5 instead of 4/9 lands somewhere else entirely. Evaluate '
      + 't * p / (p + q) at t = 360, p = 4, q = 5. The second share is the same expression with '
      + 'p and q swapped, and the two must total 360.',
    given: 't * p / (p + q)',
    variables: [
      { name: 't', assumptions: { integer: true, positive: true } },
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
    ],
    at: { t: '360', p: '4', q: '5' },
    reference: '160',
  },
  {
    id: 'which-bag-is-dearer-per-kilogram-1',
    knowledgePointId: 'a-rate-has-two-ways-up-and-they-compare-oppositely',
    kind: 'evaluate',
    prompt:
      'A 4 kg bag costs 900p and a 6 kg bag costs 1320p. Different sizes, so the prices are not '
      + 'comparable until each is divided by its weight — pence by kilograms, in that order. '
      + 'Evaluate a/b - c/d at a = 900, b = 4, c = 1320, d = 6. A positive answer says the first '
      + 'bag is DEARER per kilogram. Note that the sign is the ruling rather than the size: had '
      + 'you divided the other way up, into kilograms per penny, the same conclusion would have '
      + 'come out with the opposite sign, which is the part of the point a single task cannot '
      + 'ask you for.',
    given: 'a/b - c/d',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
      { name: 'c', assumptions: { integer: true, positive: true } },
      { name: 'd', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '900', b: '4', c: '1320', d: '6' },
    reference: '5',
  },
  {
    id: 'the-additive-reading-is-a-different-claim-1',
    knowledgePointId: 'proportional-is-not-additive-and-zero-is-the-test',
    kind: 'evaluate',
    prompt:
      '9 litres of paint covers 4 rooms. The proportional reading scales by the factor the '
      + 'rooms grew by, giving e * n / m for n rooms; the additive one adds the extra rooms to '
      + 'the litres, giving e + (n - m). Evaluate e * n / m - (e + (n - m)) at e = 9, m = 4, '
      + 'n = 12 — the gap between the two readings. Anything other than 0 means they are '
      + 'different claims rather than two routes to one answer, and they agree only when the '
      + 'factor is 1. Which of the two is RIGHT is decided by what the relationship gives at '
      + 'zero, and that test is not something an expression can be asked for.',
    given: 'e * n / m - (e + (n - m))',
    variables: [
      { name: 'e', assumptions: { integer: true, positive: true } },
      { name: 'm', assumptions: { integer: true, positive: true } },
      { name: 'n', assumptions: { integer: true, positive: true } },
    ],
    at: { e: '9', m: '4', n: '12' },
    reference: '10',
  },

  /*
   * ── percent ─────────────────────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, exact rational arithmetic
   * throughout so the subject's "gradable with no worker" contract still holds
   * over every task it owns.
   *
   * The second concept in this subject that owes no proxy apology, after
   * `ratio-and-rate` directly above, and for its reason: every point here ends
   * in a NUMBER. An amount, a price before a discount and a price after two
   * changes are all values, so nothing stands in for anything.
   *
   * What each one asks, and why it is the content rather than beside it:
   *
   *  - the first is the percent applied to a base, with `/100` written out in
   *    the `given`. That division is the disputed quantity — the error the
   *    point exists to stop is reading the percent as the amount — so a learner
   *    who makes it cannot reach the reference. The prompt names the second
   *    base, 80, because the point is that the SAME percent gives a different
   *    amount, and one evaluation cannot show two.
   *  - the second is the gap between the two readings of a reverse percentage:
   *    divide by the factor, or apply the percentage back the other way. A
   *    non-zero answer refutes the second arithmetically, which is the
   *    refutation-by-value shape `plane-geometry` found five times over. It
   *    vanishes only at p = 0, since 100² = (100+p)(100−p) forces p = 0 — so
   *    the two readings agree exactly when there is no change to reverse.
   *  - the third composes two changes and asks where the price ENDS relative to
   *    where it started, so a learner who believes equal percentages cancel
   *    predicts 0 and the reference refutes it. Worth knowing about this one:
   *    its reference is 0 for some inputs and that is the content rather than a
   *    defect, since (100+p)(100−q) = 10000 is exactly the undoing condition.
   *    At p = 25 the undoing fall is q = 20, which the prompt gives as the
   *    contrast — the pair that does cancel is not the equal one.
   *
   * None of the three is 0 at its own inputs, and none has an
   * input-independent reference: the first moves with both p and b, the second
   * with s and p, the third with all of b, p and q. A task whose answer does
   * not move when its input moves can be answered without the content, which is
   * the trap `absolute-value` had to pair a task to get out of.
   *
   * Different numbers from the worked examples in all three, since none of them
   * is establishing a specific claim an example made: 35% of 120 rather than
   * 60% of 30, a 10% discount leaving 180 rather than a 20% one leaving 84, and
   * 25% either way on 64 rather than 20% either way on 50.
   *
   * What stays unscored is which of 100 − p and 100 + p belongs in a reverse
   * percentage's denominator. Both appear in the second task's `given`, so the
   * learner is told; choosing between them unprompted is the step a single
   * expression cannot ask for, and the second knowledge point's first two
   * subgoals are where it is taught.
   */
  {
    id: 'percent-of-a-stated-base-1',
    knowledgePointId: 'a-percent-abbreviates-a-fraction-and-needs-a-base',
    kind: 'evaluate',
    prompt:
      '35% of a club\'s 120 members voted in favour. How many is that? The % sign supplies the '
      + 'denominator 100, which is why it is written out below rather than hidden in the '
      + 'arithmetic — reading the 35 as the answer is the error this task checks against. '
      + 'Evaluate p * b / 100 at p = 35, b = 120. Had the club had 80 members the same 35% '
      + 'would have been 28 instead, which is the half of the point one evaluation cannot show '
      + 'you: the percent fixes the quotient and the base fixes the amount.',
    given: 'p * b / 100',
    variables: [
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { p: '35', b: '120' },
    reference: '42',
  },
  {
    id: 'reverse-a-discount-1',
    knowledgePointId: 'a-change-is-a-factor-so-reversing-it-is-a-division',
    kind: 'evaluate',
    prompt:
      'A jacket costs £180 after a 10% discount. The correct reading divides by the factor it '
      + 'was multiplied by, giving s * 100 / (100 - p); the wrong one applies the percentage '
      + 'back the other way, giving s * (100 + p) / 100. Evaluate '
      + 's * 100 / (100 - p) - s * (100 + p) / 100 at s = 180, p = 10 — the gap between the two '
      + 'in pounds. Anything other than 0 means they are different calculations rather than two '
      + 'routes to one answer, and they agree only when p = 0, since 100 * 100 = (100 + p)(100 - p) '
      + 'forces it. Which of 100 - p and 100 + p belongs underneath is handed to you here, and '
      + 'that choice is the step no single expression can ask you to make.',
    given: 's * 100 / (100 - p) - s * (100 + p) / 100',
    variables: [
      { name: 's', assumptions: { integer: true, positive: true } },
      { name: 'p', assumptions: { integer: true, positive: true } },
    ],
    at: { s: '180', p: '10' },
    reference: '2',
  },
  {
    id: 'equal-rises-and-falls-1',
    knowledgePointId: 'successive-changes-multiply-so-equal-ones-do-not-cancel',
    kind: 'evaluate',
    prompt:
      'A £64 holding rises 25% and then falls 25%. Each change is a multiplication by a factor, '
      + 'so the pair is b * (100 + p) / 100 * (100 - q) / 100, and subtracting b gives the net '
      + 'change in pounds. Evaluate b * (100 + p) / 100 * (100 - q) / 100 - b at b = 64, p = 25, '
      + 'q = 25. A learner who thinks equal percentages cancel predicts 0; the sign of what you '
      + 'get says which way the holding actually moved. The fall that WOULD have undone the rise '
      + 'is q = 20 rather than q = 25, and at that value this expression really is 0 — the pair '
      + 'that cancels is not the equal one, because the fall acts on the larger base.',
    given: 'b * (100 + p) / 100 * (100 - q) / 100 - b',
    variables: [
      { name: 'b', assumptions: { integer: true, positive: true } },
      { name: 'p', assumptions: { integer: true, positive: true } },
      { name: 'q', assumptions: { integer: true, positive: true } },
    ],
    at: { b: '64', p: '25', q: '25' },
    reference: '-4',
  },

  /*
   * ── scientific-notation ─────────────────────────────────────────────────
   *
   * Three `evaluate` tasks, one per knowledge point, exact rational arithmetic
   * throughout. `10^n` with n substituted from `at` is settled by `exactValue`'s
   * integer-power branch, including the negative exponent in the second task, so
   * none of these goes in `WORKER_ONLY` and the subject's "gradable with no
   * worker" contract still holds over every task it owns.
   *
   * THE REFERENCE MAY BE ANSWERED IN THE NOTATION BEING TAUGHT, which is worth
   * stating because it is the opposite of the limitation this concept was
   * expected to have. `ruleEvaluate` compares exact rationals rather than
   * strings, so `4 * 10^5` and `400000` are the same answer and both are marked
   * correct against a reference of `400000`. That was verified against
   * `ruleEvaluate` before these were written rather than assumed from reading
   * it — all three were run with the scientific-notation form as the answer.
   * The consequence is that the learner is never forced to abandon the form to
   * be graded, which is as close as an `evaluate` task gets to ruling on the
   * notation itself.
   *
   * What is still unscored is the CHOICE of a and n. "Put this in scientific
   * notation" asks for a pair, no task kind carries a pair, and no `NamedForm`
   * in forms.ts can see a power of ten — the same mechanism that keeps
   * `sigma-notation` from naming `transform_to_form`. So the choosing is done
   * in the worked examples and these tasks rule the number it produces. The
   * third task is the nearest thing to an exception: the form rules out a digit
   * part of 11 on its own, so a learner who makes the aligned-addition error
   * can detect it without the arithmetic, and the subgoal says so.
   *
   * What each one asks, and why it is the content rather than beside it:
   *
   *  - the first is a refutation by value, the shape `plane-geometry` found five
   *    times and `percent`'s second task reuses. Counting the zeros after the
   *    point and counting the places give −3 and −4, and the task evaluates the
   *    gap between the two readings. A learner is not asked which is right; they
   *    are shown that the two name different numbers, and by how much. It
   *    vanishes only at a = 0, since a/10³ = a/10⁴ forces it — so the readings
   *    agree exactly when there is no quantity to write.
   *  - the second multiplies two quantities and is the one task here whose
   *    `given` hands over nothing: the digit product and the exponent sum are
   *    both left to the learner. Adding the exponents versus multiplying them
   *    is sixteen orders of magnitude apart at these inputs, and the product
   *    leaves the admissible range, so the renormalising step is exercised
   *    rather than described.
   *  - the third adds two quantities with different exponents, where the
   *    plausible error — add the digit parts, keep the larger exponent — gives
   *    15 × 10⁷ against a true 6.9 × 10⁷, more than double. The alignment is
   *    the content and the sum is what reports whether it happened.
   *
   * None of the three is 0 at its own inputs and none has an input-independent
   * reference: the first moves with a, z and p, the second with all four, the
   * third with all four. A task whose answer does not move when its input moves
   * can be answered without the content, which is the trap `absolute-value` had
   * to pair a task to get out of.
   *
   * Different numbers from the worked examples in all three — 5 at 10⁻³ against
   * 10⁻⁴ rather than the example's comparison of 0.0005 with 52 000, 8 × 10⁶
   * times 5 × 10⁻² rather than 5 × 10⁴ times 4 × 10³, and 6 × 10⁷ plus 9 × 10⁶
   * rather than 7 × 10⁵ plus 4 × 10⁴ — since none of them is establishing a
   * specific claim an example made. The one deliberate carry-over is the digit
   * 5 in the first, which is the same digit the example mis-counts, because the
   * task is the arithmetic that settles that exact dispute.
   */
  {
    id: 'count-the-places-not-the-zeros-1',
    knowledgePointId: 'the-exponent-counts-the-shift-not-the-zeros',
    kind: 'evaluate',
    prompt:
      '0.0005 is to be written as 5 × 10ⁿ. Counting the zeros between the point and the 5 gives '
      + 'three; counting the places the digits have to shift gives four, and the exponent is a '
      + 'count of places. Rather than being told which is right, evaluate the gap between the '
      + 'two readings: evaluate a / 10^z - a / 10^p at a = 5, z = 3, p = 4. Anything other than 0 '
      + 'means they name different numbers rather than one number written two ways, and the '
      + 'result is nine times the 0.0005 being written — so the mis-count is not a rounding '
      + 'matter. The two readings agree only when a = 0, since a/10³ = a/10⁴ forces it.',
    given: 'a / 10^z - a / 10^p',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'z', assumptions: { integer: true } },
      { name: 'p', assumptions: { integer: true } },
    ],
    at: { a: '5', z: '3', p: '4' },
    reference: '0.0045',
  },
  {
    id: 'multiply-and-renormalise-1',
    knowledgePointId: 'multiplying-adds-the-exponents-and-may-need-renormalising',
    kind: 'evaluate',
    prompt:
      'A probe collects 8 × 10⁶ samples, each of mass 5 × 10⁻² grams. The digit parts multiply '
      + 'and the exponents ADD; multiplying the exponents instead would put the answer sixteen '
      + 'orders of magnitude away. Evaluate a * 10^m * b * 10^n at a = 8, m = 6, b = 5, n = -2 '
      + 'for the total mass in grams. Writing your answer in scientific notation needs one '
      + 'further step, because the digit parts take the product outside 1 ≤ a < 10 and a factor '
      + 'of ten has to move from the digit part into the exponent — dropping that ten instead of '
      + 'carrying it leaves you a tenth of the right answer. Either writing is accepted here: '
      + '4 * 10^5 and 400000 are the same number.',
    given: 'a * 10^m * b * 10^n',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'm', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
      { name: 'n', assumptions: { integer: true } },
    ],
    at: { a: '8', m: '6', b: '5', n: '-2' },
    reference: '400000',
  },
  {
    id: 'align-before-adding-1',
    knowledgePointId: 'adding-needs-a-common-power-of-ten',
    kind: 'evaluate',
    prompt:
      'Two counts are 6 × 10⁷ and 9 × 10⁶. Evaluate a * 10^m + b * 10^n at a = 6, m = 7, b = 9, '
      + 'n = 6 for the total. The exponents differ, so the digit parts 6 and 9 are counts of '
      + 'different-sized units and cannot be added as they stand — one term has to be rewritten '
      + 'on the other\'s power of ten first. A learner who adds the digit parts and keeps the '
      + 'larger exponent gets 15 × 10⁷, more than double the true total, and that answer also '
      + 'fails the form on its own: a digit part of 15 is outside 1 ≤ a < 10.',
    given: 'a * 10^m + b * 10^n',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'm', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
      { name: 'n', assumptions: { integer: true } },
    ],
    at: { a: '6', m: '7', b: '9', n: '6' },
    reference: '69000000',
  },

  // ── polynomial-arithmetic ───────────────────────────────────────────────
  {
    id: 'expand-binomials-1',
    knowledgePointId: 'expand-binomials',
    kind: 'transform_to_form',
    prompt: 'Expand and collect like terms.',
    given: '(x + 3)(x - 5)',
    form: 'expanded',
    variables: REAL_X,
    reference: 'x^2 - 2x - 15',
  },
  {
    id: 'expand-binomials-2',
    knowledgePointId: 'expand-binomials',
    kind: 'transform_to_form',
    prompt: 'Expand and collect like terms.',
    given: '(2x - 1)(x + 4)',
    form: 'expanded',
    variables: REAL_X,
    reference: '2x^2 + 7x - 4',
  },
  {
    id: 'add-polynomials-1',
    knowledgePointId: 'add-polynomials',
    kind: 'transform_to_form',
    prompt: 'Add these and collect like terms.',
    given: '(2x^2 - x + 4) + (x^2 + 5x - 9)',
    form: 'expanded',
    variables: REAL_X,
    reference: '3x^2 + 4x - 5',
  },

  /*
   * `evaluate` tasks on polynomial arithmetic, so the subject survives the
   * worker being unreachable.
   *
   * This concept's other three tasks are all `transform_to_form`, which cannot
   * be settled without the CAS — and `factoring-quadratics` and
   * `polynomial-division` are each gated SOLELY behind it. So whenever the
   * worker is down, a learner who chose rational-expressions meets a wall at
   * its first concept and nothing behind it can be reached by doing problems.
   *
   * NOT because the worker is absent. It is deployed and wired up:
   * `services.mathwb` on zMothership2, published at
   * math-worker.aireadalong.com by a Cloudflare Tunnel, with
   * MATH_WORKBENCH_URL and MATH_WORKBENCH_TOKEN live as Worker secrets. An
   * earlier version of this comment claimed production had no worker, which was
   * wrong — it was inferred from a locally-built `NO_WORKER` config rather than
   * observed. But the tunnel terminates on a home machine, so "unreachable" is
   * an ordinary state rather than a hypothetical, and a subject that becomes
   * impassable when it happens is worth preventing.
   *
   * Evaluating at a point is the right fallback rather than a consolation
   * prize: expansion is an identity, so the two forms must agree at every
   * value, and checking one is how the expansion is verified by hand anyway.
   * It cannot be done without expanding correctly.
   */
  {
    id: 'expand-binomials-at-1',
    knowledgePointId: 'expand-binomials',
    kind: 'evaluate',
    prompt:
      'Evaluate (x + 3)(x − 5) at x = 2. Expanding first and substituting first must agree — ' +
      'that is what makes the expansion an identity rather than a guess.',
    given: '(x + 3)*(x - 5)',
    variables: REAL_X,
    at: { x: '2' },
    reference: '-15',
  },
  {
    id: 'expand-binomials-at-2',
    knowledgePointId: 'expand-binomials',
    kind: 'evaluate',
    prompt: 'Evaluate (2x − 1)(x + 4) at x = −3.',
    given: '(2*x - 1)*(x + 4)',
    variables: REAL_X,
    at: { x: '-3' },
    reference: '-7',
  },
  {
    id: 'add-polynomials-at-1',
    knowledgePointId: 'add-polynomials',
    kind: 'evaluate',
    prompt:
      'Evaluate (2x² − x + 4) + (x² + 5x − 9) at x = 3. Collecting like terms first should give ' +
      'the same number.',
    given: '(2*x^2 - x + 4) + (x^2 + 5*x - 9)',
    variables: REAL_X,
    at: { x: '3' },
    reference: '34',
  },

  /*
   * ── binomial-theorem ───────────────────────────────────────────────────
   *
   * Three `transform_to_form` tasks and four `evaluate`, and the split is the
   * reason this concept was the one promoted. The expansions need the CAS to
   * rule equivalence; the evaluations are settled by `exactValue` alone, so
   * the concept stays passable with the worker unreachable — the state the
   * note on `expand-binomials-at-1` above explains is ordinary rather than
   * hypothetical.
   *
   * No task asks for a general n. The closed form needs a factorial and
   * `ALLOWED_FUNCTIONS` has none, so `C(n, k)` cannot appear in a `given` at
   * all; every task names a specific small exponent and a specific row.
   *
   * The `given` of each transform task is deliberately NOT already in the
   * demanded form — `(x + 2)^4` is an unexpanded power of a sum, so the form
   * check refuses the input unchanged. A transform task whose given already
   * satisfies its form is a free mark, which is the failure
   * `maxDenominatorDegree` exists to prevent in the reduction case.
   */
  {
    id: 'binomial-row-1',
    knowledgePointId: 'pascal-row-is-the-coefficients',
    kind: 'transform_to_form',
    prompt: 'Expand this, reading the coefficients off row 4 of Pascal\'s triangle.',
    given: '(x + 2)^4',
    form: 'expanded',
    variables: REAL_X,
    reference: 'x^4 + 8*x^3 + 24*x^2 + 32*x + 16',
  },
  {
    id: 'binomial-row-2',
    knowledgePointId: 'pascal-row-is-the-coefficients',
    kind: 'transform_to_form',
    prompt:
      'Expand this. The second part of the bracket is negative, so the signs alternate — row 3 ' +
      'is still 1, 3, 3, 1.',
    given: '(x - 3)^3',
    form: 'expanded',
    variables: REAL_X,
    reference: 'x^3 - 9*x^2 + 27*x - 27',
  },
  {
    id: 'binomial-row-at-1',
    knowledgePointId: 'pascal-row-is-the-coefficients',
    kind: 'evaluate',
    prompt:
      'Evaluate (x + 2)⁴ at x = 1. Expanding first and substituting first must give the same ' +
      'number — that is what makes the expansion an identity rather than a guess.',
    given: '(x + 2)^4',
    variables: REAL_X,
    at: { x: '1' },
    reference: '81',
  },
  {
    id: 'binomial-term-1',
    knowledgePointId: 'one-term-without-the-rest',
    kind: 'transform_to_form',
    prompt:
      'Expand this in full. Both parts of the bracket carry something other than x — a 2 and a ' +
      'minus sign — and both have to come out of the bracket term by term.',
    given: '(2*x - 1)^5',
    form: 'expanded',
    variables: REAL_X,
    reference: '32*x^5 - 80*x^4 + 80*x^3 - 40*x^2 + 10*x - 1',
  },
  {
    id: 'binomial-term-at-1',
    knowledgePointId: 'one-term-without-the-rest',
    kind: 'evaluate',
    prompt:
      'Evaluate (2x − 1)⁵ at x = 2. Substituting into the bracket first is three steps; ' +
      'substituting into your expansion is six terms, and they have to agree.',
    given: '(2*x - 1)^5',
    variables: REAL_X,
    at: { x: '2' },
    reference: '243',
  },
  {
    id: 'binomial-row-sum-1',
    knowledgePointId: 'check-by-substituting-a-value',
    kind: 'evaluate',
    prompt:
      'Evaluate (1 + x)⁵ at x = 1. Every power becomes 1, so what is left is row 5 of Pascal\'s ' +
      'triangle added up.',
    given: '(1 + x)^5',
    variables: REAL_X,
    at: { x: '1' },
    reference: '32',
  },
  {
    id: 'binomial-alternating-1',
    knowledgePointId: 'check-by-substituting-a-value',
    kind: 'evaluate',
    prompt:
      'Evaluate (1 + x)⁵ at x = −1. This is row 5 added up with the signs alternating, and the ' +
      'answer is the reason x = −1 is the cheap second check on an expansion.',
    given: '(1 + x)^5',
    variables: REAL_X,
    at: { x: '-1' },
    reference: '0',
  },

  // ── factoring-quadratics ────────────────────────────────────────────────
  {
    id: 'factor-monic-1',
    knowledgePointId: 'factor-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this into two linear factors.',
    given: 'x^2 - 2x - 15',
    form: 'factored',
    variables: REAL_X,
    reference: '(x + 3)(x - 5)',
  },
  {
    id: 'factor-monic-2',
    knowledgePointId: 'factor-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this into two linear factors.',
    given: 'x^2 - 25',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 5)(x + 5)',
  },
  {
    id: 'factor-non-monic-1',
    knowledgePointId: 'factor-non-monic',
    kind: 'transform_to_form',
    prompt: 'Factor this. The leading coefficient is not 1.',
    given: '2x^2 + 7x + 3',
    form: 'factored',
    variables: REAL_X,
    reference: '(2x + 1)(x + 3)',
  },

  // ── completing-the-square ───────────────────────────────────────────────
  //
  // `form: 'completed_square'` is doing the real work on every one of these.
  // Without it the reference check alone would accept the given back unchanged:
  // `x^2 + 6x + 5` is equivalent to `(x + 3)^2 - 4`, so equivalence cannot tell
  // a completed square from an untouched quadratic. The form is what makes the
  // task a task.
  {
    id: 'complete-monic-1',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 + 6x + 5',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 3)^2 - 4',
  },
  {
    id: 'complete-monic-2',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 - 10x + 7',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x - 5)^2 - 18',
  },
  // A negative constant inside, so the two corrections do not cancel into
  // something that looks right for the wrong reason.
  {
    id: 'complete-monic-3',
    knowledgePointId: 'complete-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square.',
    given: 'x^2 + 4x - 1',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 2)^2 - 5',
  },
  {
    id: 'complete-odd-b-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. Keep the fraction exact.',
    given: 'x^2 + 3x + 1',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x + 3/2)^2 - 5/4',
  },
  {
    id: 'complete-odd-b-2',
    knowledgePointId: 'complete-odd-b',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. Keep the fraction exact.',
    given: 'x^2 - 5x + 2',
    form: 'completed_square',
    variables: REAL_X,
    reference: '(x - 5/2)^2 - 17/4',
  },
  {
    id: 'complete-non-monic-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. The leading coefficient is not 1.',
    given: '2x^2 + 8x + 5',
    form: 'completed_square',
    variables: REAL_X,
    reference: '2(x + 2)^2 - 3',
  },
  {
    id: 'complete-non-monic-2',
    knowledgePointId: 'complete-non-monic',
    kind: 'transform_to_form',
    prompt: 'Write this as a completed square. The leading coefficient is not 1.',
    given: '3x^2 - 12x + 7',
    form: 'completed_square',
    variables: REAL_X,
    reference: '3(x - 2)^2 - 5',
  },
  /*
   * The same skill as `evaluate`, so the concept stays gradable when the worker
   * is unreachable.
   *
   * All seven `transform_to_form` tasks above need the CAS for the equivalence
   * half, and a concept whose every task is inconclusive cannot gain strength —
   * so `quadratic-formula`, which this gates, would be reachable only by
   * claiming past it. (The worker IS deployed; see the longer note on the
   * polynomial-arithmetic tasks above, including the correction to an earlier
   * claim here that it was not.)
   *
   * Completing the square computes exactly two numbers, h = b/2a and
   * k = c − b²/4a, and both are exactly rational. Asking for them directly is
   * not a restatement of the answer: it is the arithmetic the move consists of,
   * and it isolates the two places it goes wrong — the fraction when b is odd,
   * and the 4a when the leading coefficient is not 1.
   *
   * The transform tasks stay. They are the better test of the skill and they
   * will rule the moment a worker is configured; these are the floor under
   * them, not a replacement.
   */
  {
    id: 'complete-monic-k-1',
    knowledgePointId: 'complete-monic',
    kind: 'evaluate',
    prompt:
      'For x² + 6x + 5 written as (x + h)² + k, what is k? It is the constant left after the ' +
      'bracket has added (b/2)² that was never there.',
    given: 'c - (b/2)^2',
    variables: REAL_BC,
    at: { b: '6', c: '5' },
    reference: '-4',
  },
  {
    id: 'complete-odd-b-h-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'evaluate',
    prompt:
      'For x² + 3x + 1 written as (x + h)² + k, what is h? Keep it exact — rounding it makes ' +
      'the identity false.',
    given: 'b/2',
    variables: REAL_BC,
    at: { b: '3', c: '1' },
    reference: '3/2',
  },
  {
    id: 'complete-odd-b-k-1',
    knowledgePointId: 'complete-odd-b',
    kind: 'evaluate',
    prompt: 'And for the same quadratic, x² + 3x + 1, what is k?',
    given: 'c - (b/2)^2',
    variables: REAL_BC,
    at: { b: '3', c: '1' },
    reference: '-5/4',
  },
  {
    id: 'complete-non-monic-k-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'evaluate',
    prompt:
      'For 2x² + 8x + 5 written as a(x + h)² + k, what is k? The correction is divided by 4a, ' +
      'not by 4 — that factor is the step people drop.',
    given: 'c - b^2/(4*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '8', c: '5' },
    reference: '-3',
  },
  {
    id: 'complete-non-monic-h-1',
    knowledgePointId: 'complete-non-monic',
    kind: 'evaluate',
    prompt: 'For the same quadratic, 2x² + 8x + 5, what is h?',
    given: 'b/(2*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '8', c: '5' },
    reference: '2',
  },

  // ── polynomial-roots ────────────────────────────────────────────────────
  //
  // Both halves on purpose. The remainder and factor theorems are `evaluate`,
  // so they settle locally with no worker; full factorisation is a
  // `transform_to_form` only the CAS can rule. That satisfies the "finishable
  // without the worker" invariant with the concept's real content rather than
  // with a stand-in invented to satisfy it.
  {
    id: 'remainder-theorem-1',
    knowledgePointId: 'remainder-theorem',
    kind: 'evaluate',
    prompt:
      'What is the remainder when x³ − 2x² + 4 is divided by x − 3? Substitute rather than divide.',
    given: 'x^3 - 2*x^2 + 4',
    variables: REAL_X,
    at: { x: '3' },
    reference: '13',
  },
  // Negative a, which is where the sign of x − a is misread as x + a.
  {
    id: 'remainder-theorem-2',
    knowledgePointId: 'remainder-theorem',
    kind: 'evaluate',
    prompt: 'What is the remainder when 2x³ + x − 5 is divided by x + 2? Mind what a is.',
    given: '2*x^3 + x - 5',
    variables: REAL_X,
    at: { x: '-2' },
    reference: '-23',
  },
  {
    id: 'factor-theorem-1',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt:
      'Evaluate x³ − 7x + 6 at x = 1. A result of zero means x − 1 is a factor.',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '1' },
    reference: '0',
  },
  {
    id: 'factor-theorem-2',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt: 'Evaluate the same polynomial, x³ − 7x + 6, at x = 2. Is x − 2 a factor?',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '2' },
    reference: '0',
  },
  // A candidate that fails, so the test is a test rather than a formality — and
  // the value it returns is the remainder, which is the previous point's skill.
  {
    id: 'factor-theorem-3',
    knowledgePointId: 'factor-theorem',
    kind: 'evaluate',
    prompt:
      'Evaluate x³ − 7x + 6 at x = 3. Not every candidate is a root — and what you get is the ' +
      'remainder on division by x − 3.',
    given: 'x^3 - 7*x + 6',
    variables: REAL_X,
    at: { x: '3' },
    reference: '12',
  },
  {
    id: 'rational-root-1',
    knowledgePointId: 'rational-root-search',
    kind: 'transform_to_form',
    prompt: 'Factor this completely into three linear factors.',
    given: 'x^3 - 7*x + 6',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 1)*(x - 2)*(x + 3)',
  },
  // Leading coefficient 2, so the candidate list includes halves — the part of
  // the rule that is dropped when people only try divisors of the constant.
  {
    id: 'rational-root-2',
    knowledgePointId: 'rational-root-search',
    kind: 'transform_to_form',
    prompt:
      'Factor this completely. The leading coefficient is not 1, so the candidate roots include ' +
      'fractions.',
    given: '2*x^3 - 3*x^2 - 11*x + 6',
    form: 'factored',
    variables: REAL_X,
    reference: '(x - 3)*(2*x - 1)*(x + 2)',
  },

  // ── quadratic-formula ───────────────────────────────────────────────────
  //
  // All `evaluate`, which is what made this concept authorable with no new
  // engine work: `sqrt` is already in ALLOWED_FUNCTIONS, so an irrational root
  // is an exact expression the verifier can rule.
  //
  // One root per task, always a named one. A quadratic has two roots and a task
  // has one reference, and accepting either would let a learner who always takes
  // the + branch never discover they had not understood the ±.
  {
    id: 'discriminant-negative-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² + x + 1. Its sign is the answer to "how many real roots".',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '1', c: '1' },
    reference: '-3',
  },
  {
    id: 'discriminant-zero-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² − 6x + 9. Zero means the two roots have collided into one.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '-6', c: '9' },
    reference: '0',
  },
  // A non-monic perfect square, so the 4ac term cannot be mistaken for 4c.
  {
    id: 'discriminant-square-1',
    knowledgePointId: 'read-the-discriminant',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of 2x² + 5x − 3. A perfect square here means factoring would ' +
      'also have worked.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '2', b: '5', c: '-3' },
    reference: '49',
  },
  {
    id: 'formula-rational-1',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt:
      'Use the formula to find the LARGER root of x² − 2x − 15 = 0. It factors, so you can check ' +
      'the answer against (x + 3)(x − 5).',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '-2', c: '-15' },
    reference: '5',
  },
  {
    id: 'formula-rational-2',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt: 'Find the SMALLER root of 2x² + 5x − 3 = 0.',
    given: '(-b - sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '2', b: '5', c: '-3' },
    reference: '-3',
  },
  // b positive, so −b is negative: the sign slip the knowledge point names.
  {
    id: 'formula-rational-3',
    knowledgePointId: 'apply-the-formula',
    kind: 'evaluate',
    prompt: 'Find the LARGER root of x² + 7x + 12 = 0. Watch the sign of −b.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '7', c: '12' },
    reference: '-3',
  },
  {
    id: 'formula-irrational-1',
    knowledgePointId: 'irrational-roots',
    kind: 'evaluate',
    prompt:
      'Find the LARGER root of x² + 2x − 1 = 0, exactly. Keep the surd — a decimal is not the ' +
      'answer the formula gives.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '2', c: '-1' },
    reference: '-1 + sqrt(2)',
  },
  {
    id: 'formula-irrational-2',
    knowledgePointId: 'irrational-roots',
    kind: 'evaluate',
    prompt: 'Find the LARGER root of x² − 4x + 1 = 0, exactly.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    at: { a: '1', b: '-4', c: '1' },
    reference: '2 + sqrt(3)',
  },

  // ── polynomial-division ─────────────────────────────────────────────────
  {
    id: 'long-division-1',
    knowledgePointId: 'long-division',
    kind: 'transform_to_form',
    prompt:
      'Divide, and write the result as a polynomial plus a proper fraction — ' +
      'quotient + remainder/divisor.',
    given: '(x^2 + 3x + 5)/(x + 1)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -1'],
    // The polynomial part makes this a sum of three terms, two of which carry no
    // denominator. That is legal partial-fraction form and is exactly what the
    // `improper-first` knowledge point is about.
    reference: 'x + 2 + 3/(x + 1)',
  },

  // ── simplifying-rational ────────────────────────────────────────────────
  {
    id: 'cancel-common-factors-1',
    knowledgePointId: 'cancel-common-factors',
    kind: 'transform_to_form',
    prompt: 'Reduce to lowest terms, as a single fraction.',
    given: '(x^2 - 2x - 15)/(x^2 - 25)',
    form: 'single_fraction',
    // Without this the task accepts its own input: the unreduced fraction is a
    // single fraction and is equivalent to itself, so both rulings pass. The
    // bound is what makes "reduce" checkable — cancelling (x - 5) takes the
    // denominator from degree 2 to degree 1.
    maxDenominatorDegree: 1,
    variables: REAL_X,
    // Both conditions are stated by the author, including the one the answer no
    // longer shows. A ruling of "correct" carries them back out.
    domainConditions: ['x != 5', 'x != -5'],
    reference: '(x + 3)/(x + 5)',
  },

  // ── combining-rational ──────────────────────────────────────────────────
  {
    id: 'combine-two-1',
    knowledgePointId: 'combine-two',
    kind: 'transform_to_form',
    prompt: 'Write this as a single fraction.',
    given: '1/(x + 3) + 2/(x - 5)',
    form: 'single_fraction',
    variables: REAL_X,
    domainConditions: ['x != -3', 'x != 5'],
    reference: '(3x + 1)/((x + 3)(x - 5))',
  },
  {
    id: 'combine-two-2',
    knowledgePointId: 'combine-two',
    kind: 'transform_to_form',
    prompt: 'Write this as a single fraction.',
    given: '3/(x - 1) - 1/(x + 2)',
    form: 'single_fraction',
    variables: REAL_X,
    domainConditions: ['x != 1', 'x != -2'],
    reference: '(2x + 7)/((x - 1)(x + 2))',
  },

  // ── partial-fractions-linear ────────────────────────────────────────────
  // The kind's flagship task, and the inverse of combine-two-1 on purpose.
  {
    id: 'decompose-distinct-1',
    knowledgePointId: 'decompose-distinct',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions.',
    given: '(3x + 1)/((x + 3)(x - 5))',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -3', 'x != 5'],
    reference: '1/(x + 3) + 2/(x - 5)',
  },
  {
    id: 'decompose-distinct-2',
    knowledgePointId: 'decompose-distinct',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions. Factor the denominator first.',
    given: '(5x - 7)/(x^2 - 3x + 2)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != 1', 'x != 2'],
    // x^2 - 3x + 2 = (x-1)(x-2). A/(x-1) + B/(x-2): 5x - 7 = A(x-2) + B(x-1).
    // x = 2 gives 3 = B. x = 1 gives -2 = -A, so A = 2.
    reference: '2/(x - 1) + 3/(x - 2)',
  },

  // ── partial-fractions-repeated ──────────────────────────────────────────
  {
    id: 'one-term-per-power-1',
    knowledgePointId: 'one-term-per-power',
    kind: 'transform_to_form',
    prompt: 'Decompose into partial fractions. The denominator has a repeated factor.',
    given: '(x + 4)/(x + 1)^2',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -1'],
    reference: '1/(x + 1) + 3/(x + 1)^2',
  },

  // ── partial-fractions-quadratic ─────────────────────────────────────────
  {
    id: 'linear-numerator-1',
    knowledgePointId: 'linear-numerator',
    kind: 'transform_to_form',
    prompt:
      'Decompose into partial fractions. Check whether the quadratic factor is irreducible ' +
      'before choosing a template.',
    given: '(2x + 1)/((x - 1)(x^2 + 1))',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != 1'],
    reference: '(3/2)/(x - 1) + (-(3/2)x + 1/2)/(x^2 + 1)',
  },

  // ── irreducible-quadratic ───────────────────────────────────────────────
  // Standing in for: "show that a quadratic does not factor over the reals",
  // whose honest kind is `justify`. The discriminant is what decides it, and the
  // discriminant is a number, so that is the part a verifier can rule.
  {
    id: 'discriminant-1',
    knowledgePointId: 'irreducible-quadratic',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² + x + 1. A negative value means no real linear factors.',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '1', c: '1' },
    // 1 - 4·1·1 = -3. The worked example's own number.
    reference: '-3',
  },
  {
    id: 'discriminant-2',
    knowledgePointId: 'irreducible-quadratic',
    kind: 'evaluate',
    prompt:
      'Compute the discriminant of x² − 2x − 15. Compare what you get with the fact that it ' +
      'factors as (x + 3)(x − 5).',
    given: 'b^2 - 4*a*c',
    variables: REAL_ABC,
    at: { a: '1', b: '-2', c: '-15' },
    // 4 - 4·1·(-15) = 4 + 60 = 64, a perfect square — which is why the factors
    // came out rational in factor-monic-1.
    reference: '64',
  },

  // ── improper-first ──────────────────────────────────────────────────────
  {
    id: 'improper-first-1',
    knowledgePointId: 'improper-first',
    kind: 'transform_to_form',
    prompt:
      'This fraction is improper. Divide first, then write it as a polynomial plus a proper ' +
      'fraction.',
    given: '(2x^2 + 5x + 1)/(x + 2)',
    form: 'partial_fractions',
    variables: REAL_X,
    domainConditions: ['x != -2'],
    // (x + 2)(2x + 1) = 2x² + 5x + 2, so the numerator is that less 1.
    reference: '2x + 1 - 1/(x + 2)',
  },
  {
    id: 'improper-first-2',
    knowledgePointId: 'improper-first',
    kind: 'evaluate',
    prompt:
      'Evaluate the improper fraction at x = 2. It is the same expression long-division-1 ' +
      'rewrote, so the quotient form must give this same value.',
    given: '(x^2 + 3*x + 5)/(x + 1)',
    variables: REAL_X,
    at: { x: '2' },
    domainConditions: ['x != -1'],
    // (4 + 6 + 5)/3 = 15/3 = 5. And x + 2 + 3/(x + 1) at 2 is 4 + 1 = 5.
    reference: '5',
  },

  // ── excluded-points ─────────────────────────────────────────────────────
  // Standing in for: "name every point this expression excludes, and say why",
  // whose honest kind is `state`. What is checkable is the computation the
  // knowledge point rests on — the denominator really does vanish there.
  {
    id: 'excluded-points-1',
    knowledgePointId: 'excluded-points',
    kind: 'evaluate',
    prompt:
      'Evaluate the denominator of (x + 3)/(x² − 2x − 15) at x = 5. What you get is why 5 is ' +
      'excluded.',
    given: 'x^2 - 2*x - 15',
    variables: REAL_X,
    at: { x: '5' },
    // 25 - 10 - 15 = 0.
    reference: '0',
  },
  {
    id: 'excluded-points-2',
    knowledgePointId: 'excluded-points',
    kind: 'evaluate',
    prompt:
      'Now the same denominator at x = −3. Note that the numerator vanishes there too, and ' +
      'that 0/0 is still not a value.',
    given: 'x^2 - 2*x - 15',
    variables: REAL_X,
    at: { x: '-3' },
    // 9 + 6 - 15 = 0.
    reference: '0',
  },

  // ── cancelling-keeps-the-hole ───────────────────────────────────────────
  {
    id: 'cancelling-keeps-the-hole-1',
    knowledgePointId: 'cancelling-keeps-the-hole',
    kind: 'evaluate',
    prompt:
      'Evaluate 1/(x − 5) at x = −3. The expression it came from, (x + 3)/((x + 3)(x − 5)), ' +
      'is undefined there — so these are not the same function.',
    given: '1/(x - 5)',
    variables: REAL_X,
    at: { x: '-3' },
    // 1/(-8). The worked example's own value, and the whole point: the cancelled
    // form has a value at the hole, which is why cancelling changed the function.
    domainConditions: ['x != 5'],
    reference: '-1/8',
  },

  // ── terms-are-not-factors ───────────────────────────────────────────────
  {
    id: 'terms-are-not-factors-1',
    knowledgePointId: 'terms-are-not-factors',
    kind: 'evaluate',
    prompt:
      'Evaluate (x + 3)/(x + 5) at x = 1. Compare it with 3/5 — the answer you get if you ' +
      'cancel the x out of a sum.',
    given: '(x + 3)/(x + 5)',
    variables: REAL_X,
    at: { x: '1' },
    domainConditions: ['x != -5'],
    // 4/6 = 2/3, and 2/3 is not 3/5. The disconfirming computation, not an
    // assertion that cancelling terms is illegal.
    reference: '2/3',
  },

  // ── why-substitution-is-legal ───────────────────────────────────────────
  {
    id: 'why-substitution-is-legal-1',
    knowledgePointId: 'why-substitution-is-legal',
    kind: 'evaluate',
    prompt:
      'Clearing denominators in (3x + 1)/((x + 3)(x − 5)) gives the identity ' +
      '3x + 1 = A(x − 5) + B(x + 3). Evaluate its left side at x = 5.',
    given: '3*x + 1',
    variables: REAL_X,
    at: { x: '5' },
    // 16, which is the 16 = 8B of the worked example. No domain conditions, and
    // that absence is the knowledge point: the cleared identity is a polynomial
    // one and excludes nothing, which is what licenses substituting the root.
    reference: '16',
  },

  // ── counterexample ──────────────────────────────────────────────────────
  //
  // `given` is an `equation` node — the claim to be broken — rather than an
  // expression to be rewritten. That is the one place a task's `given` is not
  // the thing the learner manipulates, and `ruleCounterexample` reads both of
  // its sides.
  //
  // `reference` is *an* answer and emphatically not *the* answer: any point where
  // the two sides differ is correct, and the ruler never compares against this.
  // It is here so the shipped set can be checked for having a witness at all.
  {
    id: 'break-terms-are-not-factors-1',
    knowledgePointId: 'terms-are-not-factors',
    kind: 'counterexample',
    prompt:
      'Somebody cancelled the x out of the top and bottom and claims this. Give a value of x ' +
      'that proves them wrong.',
    given: '(x + 3)/(x + 5) = 3/5',
    variables: REAL_X,
    domainConditions: ['x != -5'],
    // At x = 1 the left side is 4/6 = 2/3 and the right is 3/5. Any x other than
    // 0 works, which is the point — the claim is false almost everywhere, and a
    // learner who finds x = 0 (where it happens to hold) has learned something
    // sharper than one who finds x = 1.
    reference: '1',
  },
  // NOT AUTHORED, and the reason is worth keeping where the next author will see
  // it. `cancelling-keeps-the-hole` looks like the best counterexample task in
  // the subject — "(x+3)/((x+3)(x−5)) and 1/(x−5) are the same function" is a
  // claim worth breaking. It cannot be one here.
  //
  // Those two expressions are equal at *every* point where both are defined. The
  // only thing separating them is x = −3, where the left side is undefined — and
  // `ruleCounterexample` correctly refuses an undefined-side point, because an
  // excluded point does not refute a claim about values. So the task would have
  // no answer the engine accepts, which is precisely the "looks like practice and
  // records nothing" failure the kind registry exists to prevent.
  //
  // The gap is real and is in the *claim language*, not the ruler: refuting a
  // claim about domains needs a task kind that compares domains, and this engine
  // has none. `state` already covers the point for a human reader.

  // ── exponents-and-logarithms ────────────────────────────────────────────
  //
  // Mostly `evaluate`, which exact arithmetic rules with no worker — that is
  // what makes this the first subject fully gradable on a deployment with none.
  //
  // `given` on an `evaluate` task carries a *numeric* instance rather than the
  // general rule, because `evaluate` substitutes and compares values.
  //
  // THE FORM TASKS BELOW ARE NEW, and they are the thing the subject was
  // originally unable to ask for. `NamedForm` held only rational-expression
  // forms, so "write this as a single power" had nowhere to go; the subject
  // shipped evaluate-only and recorded that as a schema defect rather than
  // inventing a form that half-fitted. The union is now open and
  // `FORM_CHECKS` is total over it, so the demand this subject actually makes
  // is expressible and rulable.
  //
  // These three need the worker for equivalence, unlike their evaluate
  // neighbours — so on a deployment with none they rule inconclusive and the
  // learner is told so up front by `verifier.configured`.
  {
    id: 'add-exponents-1',
    knowledgePointId: 'add-exponents-on-product',
    kind: 'evaluate',
    prompt:
      'Evaluate 2³ · 2⁴ by adding the exponents first. The answer is a single power of 2 — give its value.',
    given: 'b^m * b^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'm', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '2', m: '3', n: '4' },
    // 2^3 · 2^4 = 2^7 = 128.
    reference: '128',
  },
  {
    id: 'multiply-exponents-1',
    knowledgePointId: 'multiply-exponents-on-power',
    kind: 'evaluate',
    prompt: 'Evaluate (3²)⁴. Multiply the exponents rather than expanding the inside first.',
    given: '(b^m)^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'm', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '3', m: '2', n: '4' },
    // (3^2)^4 = 3^8 = 6561.
    reference: '6561',
  },
  {
    id: 'zero-exponent-1',
    knowledgePointId: 'zero-exponent',
    kind: 'evaluate',
    prompt: 'Evaluate 7⁰.',
    given: 'b^0',
    variables: [{ name: 'b', assumptions: { real: true } }],
    at: { b: '7' },
    reference: '1',
  },
  {
    id: 'negative-exponent-1',
    knowledgePointId: 'negative-is-reciprocal',
    kind: 'evaluate',
    prompt:
      'Evaluate 2⁻³. Give the exact value as a fraction — a negative exponent is a reciprocal, ' +
      'not a negative number.',
    given: 'b^n',
    variables: [
      { name: 'b', assumptions: { real: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '2', n: '-3' },
    // 1/8, and emphatically not -8.
    reference: '1/8',
  },
  {
    id: 'root-as-exponent-1',
    knowledgePointId: 'root-as-exponent',
    kind: 'evaluate',
    prompt: 'Evaluate 9^(1/2), then 16^(1/2) in your head to check you have the right reading.',
    given: 'b^(1/2)',
    variables: [{ name: 'b', assumptions: { real: true } }],
    at: { b: '9' },
    // This task is why `exactValue` grew exact rational roots. It used to be
    // unverifiable locally, which made `ruleEvaluate` fall through to comparing
    // the learner against the author's *unverified* reference — losing exactly
    // the re-derivation check that kind was built around. 9^(1/2) is exactly 3,
    // so there was no reason to refuse it. 2^(1/2) still returns null, which is
    // the honest answer for an irrational root.
    reference: '3',
  },

  // ── the form tasks this subject could not previously ask for ────────────

  {
    id: 'combine-powers-form-1',
    knowledgePointId: 'add-exponents-on-product',
    kind: 'transform_to_form',
    // The general rule, not a numeric instance. That is the whole difference
    // this form makes: `evaluate` could only ask "what is 2³·2⁴", which is
    // answerable by multiplying it out and never demonstrates the rule. This
    // asks for the rule applied, and the form check refuses `x^3 * x^5`
    // handed straight back.
    prompt: 'Write this as a single power of x.',
    given: 'x^3 * x^5',
    form: 'single_power',
    variables: REAL_X,
    reference: 'x^8',
  },
  {
    id: 'multiply-exponents-form-1',
    knowledgePointId: 'multiply-exponents-on-power',
    kind: 'transform_to_form',
    prompt: 'Write this as a single power of x.',
    given: '(x^2)^4',
    form: 'single_power',
    variables: REAL_X,
    reference: 'x^8',
  },
  {
    id: 'negative-exponent-form-1',
    knowledgePointId: 'negative-is-reciprocal',
    kind: 'transform_to_form',
    // The one place the form IS the whole content of the task. `x^-2` and
    // `1/x^2` are equal everywhere they are defined, so no equivalence check
    // can distinguish the answer from the question — only the shape ruling can,
    // which is exactly the independence argued for in the header of forms.ts.
    prompt: 'Rewrite this with no negative exponents.',
    given: 'x^-2',
    form: 'no_negative_exponents',
    variables: REAL_X,
    reference: '1/x^2',
  },
  {
    id: 'radical-to-exponent-form-1',
    knowledgePointId: 'root-as-exponent',
    kind: 'transform_to_form',
    // The first draft of this task asked to "rewrite using a fractional
    // exponent instead of a root sign" and gave `x^(3/2)` as the reference —
    // against the `radical_free` form, which a fractional exponent VIOLATES.
    // A fractional exponent is a radical written the other way round; that is
    // the whole point of `move-between-roots-and-exponents`. The task
    // validator caught it, which is what it is for.
    //
    // So the demand runs the other way: clear the radical entirely, which is
    // possible here because the index divides the exponent.
    prompt: 'Rewrite this with no root sign and no fractional exponent.',
    // `(x^4)^(1/2)` rather than `sqrt(x^4)`, and this is a limitation of the
    // local checker rather than a pedagogical choice. The validator wants the
    // reference to agree with the given at sample points, and `sqrt` as a
    // function call is not something `exactValue` evaluates — so a `sqrt`
    // given yields zero usable points and the reference goes unverified,
    // which is the one thing an authored task must not do. A rational
    // exponent it CAN evaluate exactly, after that capability was added for
    // `root-as-exponent-1`.
    given: '(x^4)^(1/2)',
    form: 'radical_free',
    variables: REAL_X,
    reference: 'x^2',
  },

  // ── even-root-needs-nonnegative ─────────────────────────────────────────
  //
  // A domain restriction that IS rulable, which is worth stating plainly
  // because the two notes nearby say the opposite about their own points and
  // the difference between the cases is easy to miss.
  //
  // `cancelling-keeps-the-hole` and `log-argument-is-positive` are both
  // unaskable for the same reason: the only thing separating the two sides of
  // their claim is a point where one side is UNDEFINED, and
  // `ruleCounterexample` refuses such a point — correctly, since an excluded
  // point does not refute a claim about values. So those claims have no answer
  // the engine accepts.
  //
  // This claim does not have that shape. `(x^2)^(1/2) = x` is the power rule
  // with its condition dropped, and both sides are defined at every real x:
  // squaring first lands on something non-negative, so the even root is always
  // taken of a legal argument. The left side is |x| and the right is x, so they
  // differ at an ordinary interior point and substitution settles it. The
  // undefined case the point teaches — (−4)^(1/2) — is the step the false
  // reasoning passes THROUGH, not a side of the claim, which is exactly why it
  // costs nothing here.
  //
  // Every negative x is a witness and every x >= 0 makes the two sides agree.
  // That is a sharper fact than the single reference below, and a learner who
  // reaches it has the knowledge point rather than one lucky number.
  {
    id: 'break-even-root-needs-nonnegative-1',
    knowledgePointId: 'even-root-needs-nonnegative',
    kind: 'counterexample',
    prompt:
      'Somebody cancelled the 2 against the 1/2 and claims (x²)^(1/2) = x for every real x. ' +
      'Give a value of x that proves them wrong.',
    given: '(x^2)^(1/2) = x',
    variables: REAL_X,
    // At x = −3 the left side is 9^(1/2) = 3 and the right is −3. Not the −4 of
    // the worked example, deliberately: the witness is a different number from
    // the one the example works through, so answering it takes the reasoning
    // rather than the recollection. No `domainConditions` — there is nothing to
    // exclude, and that absence is the whole point of the note above.
    reference: '-3',
  },

  // ── the logarithm concepts, which had material and no problems ──────────
  //
  // `logarithm-definition`, `logarithm-rules` and `solving-exponential-equations`
  // were the three concepts `isPractisable` was written to expose: knowledge
  // points, worked examples, and nothing a learner could be set. The diagnosis
  // at the time was that their natural task is *solving* or *stating* and the
  // engine has no verifiable kind for either, so the fix would have to be a new
  // task kind.
  //
  // That was half right and the wrong half was load-bearing. The reason no
  // `evaluate` task could be written here was not the task kind — it was that
  // `exactValue` returned null for every `log`, so `ruleEvaluate` could not
  // recompute the task's own value and fell through to comparing the learner
  // against the author's unverified reference. An authored task that cannot
  // re-derive its own answer is exactly what the re-derivation check exists to
  // refuse, so writing these would have been writing three unvouched tasks.
  //
  // `exactLog` closed that. A logarithm is exactly rational when its argument
  // is a rational power of its base, which is the only case a logarithm is set
  // in by hand — so all five tasks below are settled locally and exactly, with
  // no worker, like their `evaluate` neighbours above.
  //
  // `log(x, b)` is log base b of x: sympy's argument order, which the worker
  // inherits by calling `sympy.log(*args)` and `exactValue` now matches. The
  // prompts write it as log₂(32) because that is how it is read.
  {
    id: 'log-as-exponent-1',
    knowledgePointId: 'log-is-an-exponent',
    kind: 'evaluate',
    prompt:
      'Evaluate log₂(32). Read the notation as the question it is — what power of 2 gives 32? — ' +
      'rather than reaching for a calculator.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', c: '32' },
    // 2^5 = 32.
    reference: '5',
  },
  {
    id: 'log-as-exponent-2',
    knowledgePointId: 'log-is-an-exponent',
    kind: 'evaluate',
    // The second task on the point, and it is the one that does the teaching.
    // log₂(1/8) is where "a logarithm is an exponent" has to survive contact
    // with an exponent that is negative — and it separates two things learners
    // merge: the ARGUMENT of a log must be positive, while its VALUE is free to
    // be negative. 1/8 is a perfectly good argument.
    prompt:
      'Evaluate log₂(1/8). The argument is positive, so this is defined — and the answer is not.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', c: '1/8' },
    // 2^-3 = 1/8.
    reference: '-3',
  },
  // NOT AUTHORED: `log-argument-is-positive`, and this is a genuine engine gap
  // rather than an authoring backlog. Its content is that log₂(−8) *names
  // nothing*, and `evaluate` asks for a value — there is no way to submit
  // "undefined" as an answer, and a task whose reference is undefined would
  // have `exactValue` return null for its own truth, which is the unvouched
  // state the whole re-derivation check refuses.
  //
  // The honest kinds for it are `state` and `justify`, both declared
  // unverifiable in types.ts, and `counterexample` does not fit either: the
  // claim "log is defined everywhere" is not an identity, so substitution
  // cannot refute it. So the point keeps its worked example and no task, which
  // the registry permits. `log-as-exponent-2` above covers the part of the
  // confusion that IS rulable.
  {
    id: 'log-of-product-1',
    knowledgePointId: 'log-of-product',
    kind: 'evaluate',
    prompt:
      'Evaluate log₂(8 · 4) by splitting it into log₂(8) + log₂(4). Then check it against ' +
      'log₂(32) — the rule and the direct route have to agree.',
    // The product is left unmultiplied in `given` so the task's own expression
    // is the thing the rule applies to. `exactLog` evaluates it either way,
    // which is what makes the check in the prompt a real check.
    given: 'log(x*y, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'x', assumptions: { real: true, positive: true } },
      { name: 'y', assumptions: { real: true, positive: true } },
    ],
    at: { b: '2', x: '8', y: '4' },
    // 3 + 2 = 5, and log₂(32) = 5.
    reference: '5',
  },
  {
    id: 'log-of-power-1',
    knowledgePointId: 'log-of-power',
    kind: 'evaluate',
    prompt:
      'Evaluate log₃(9⁴). Bring the exponent out in front first — 9⁴ is 6561 and nobody wants ' +
      'to find its logarithm the other way.',
    given: 'log(x^n, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'x', assumptions: { real: true, positive: true } },
      { name: 'n', assumptions: { real: true } },
    ],
    at: { b: '3', x: '9', n: '4' },
    // 4 · log₃(9) = 4 · 2 = 8.
    reference: '8',
  },
  {
    id: 'solve-exponential-1',
    knowledgePointId: 'take-logs-of-both-sides',
    kind: 'evaluate',
    // ── An evaluate task standing in for a solve, and what it does not claim ──
    //
    // There is still no verifiable `solve` kind, and this is not one. The
    // expression language parses expressions rather than equations, and a
    // solution is in general a SET — no solutions, one, or infinitely many —
    // which no `evaluate` task can ask for.
    //
    // What makes this legitimate rather than a dodge is that the task asks for
    // the number the method produces: taking log₉ of both sides of 9^x = 27
    // turns the equation into x = log₉(27), and that expression is what `given`
    // carries. The learner submits a number and it is ruled exactly. A learner
    // who submits `log(27, 9)` instead is also ruled correct, because
    // `exactValue` now evaluates it — which is the right outcome, since the
    // unsimplified form is a complete answer to "solve for x".
    //
    // The answer is 3/2 deliberately. An integer answer can be reached by
    // guessing powers; 9^x = 27 cannot, so it is the smallest instance where
    // the method is the only route. It is also the case that exercises
    // `exactLog`'s rational-exponent search rather than its integer walk.
    prompt:
      'Solve 9^x = 27. The unknown is in the exponent, so take log₉ of both sides and read off x. ' +
      'The answer is not a whole number, which is the point — no amount of trying powers of 9 ' +
      'gets there.',
    given: 'log(c, b)',
    variables: [
      { name: 'b', assumptions: { real: true, positive: true } },
      { name: 'c', assumptions: { real: true, positive: true } },
    ],
    at: { b: '9', c: '27' },
    // 9^(3/2) = 27.
    reference: '3/2',
    // The `log(27, 9)` acceptance described above, now enforced rather than
    // only asserted in a comment. `ruleEvaluate` otherwise refuses an answer
    // that is the given with its inputs substituted — which this one is,
    // textually — because that was a free mark everywhere else. See
    // `acceptsUnevaluated` in types.ts for why the exemption has to be the
    // author's call and cannot be inferred.
    acceptsUnevaluated: true,
  },

  // ── exponents-and-logarithms: radical-equations ─────────────────────────
  //
  // NINE TASKS, ALL `evaluate`, ALL RULED LOCALLY AND EXACTLY, AND THE LAST
  // CLAUSE IS WHY THIS CONCEPT COULD BE AUTHORED AT ALL.
  //
  // atlas-foundations.ts had this node on a list of five whose "answers are
  // sets, intervals and arguments rather than values", alongside
  // `inequality-proofs`. That is true of the other four and was never true of
  // this one: a radical equation has a finite list of candidates, each of which
  // is a number, and deciding whether one belongs is done by evaluating the two
  // sides there and comparing. The whole content of the concept is a
  // substitution whose outcome is a value, which is precisely what `evaluate`
  // asks for. The sentence is corrected where it was written.
  //
  // Every root taken here is a root of a perfect square, which is a constraint
  // and not a coincidence. `exactValue` returns a rational for `sqrt(9)` and
  // null for `sqrt(2)`, and a task whose own truth is null grades the learner
  // against the author's unvouched reference instead of against the
  // mathematics — see the note on `root-as-exponent-1` above, which is the task
  // that forced exact rational roots into numerals.ts. So the arithmetic is
  // chosen to keep the ruling local. The mathematics does not suffer for it:
  // extraneous roots arise from the SIGN of the two sides, and a surd would add
  // nothing to that and would cost the ruling.
  //
  // THE TASKS COME IN PAIRS WHOSE TWO VERDICTS DIFFER IN KIND, which is this
  // build's established way of making an asymmetry scoreable — the shape
  // `gained-solution-satisfies-the-new-equation-1` and its partner introduced
  // for `linear-equations`, and the one ontology-geometry.ts uses for a
  // converse against its contrapositive. Three pairs here:
  //
  //  - one number satisfying the SQUARED equation and failing the ORIGINAL,
  //    which is an invented solution caught in the act;
  //  - one expression at two candidates, coming to 1 at the survivor and 5 at
  //    the casualty, which is the check doing its job;
  //  - the same two candidates against the equation the squaring FOLDED IN,
  //    coming to 0 at the casualty and 6 at the survivor — 0 being the claim
  //    that the root equals minus the other side there.
  //
  // Neither half of any pair shows anything alone. The first is "4 − 4 = 0",
  // the second is one subtraction, and read apart they are arithmetic. Read
  // together each pair is the solution set having changed under a step, which
  // is the only form that fact can take in a build with no `solve` kind.
  //
  // `isolate-then-solve-1` is the one task here that is a solve, and it is
  // expressed the way the six `linear-equations` solves are: `given` carries
  // the method written out on the letters — the quadratic formula — and the
  // learner submits the number. The `+` branch is asked for because it gives
  // the LARGER root, which is also the one that survives the check; the
  // casualty is reached by the two tasks either side of it rather than by a
  // second formula task, since asking for both roots would test the formula
  // twice and the concept once.
  {
    id: 'squared-equation-admits-the-candidate-1',
    knowledgePointId: 'squaring-can-create-a-solution',
    kind: 'evaluate',
    prompt:
      '√x = −2 was squared, giving x = 4. Evaluate x − 4 at x = 4. A value of 0 means 4 '
      + 'satisfies the squared equation.',
    given: 'x - 4',
    variables: REAL_X,
    // 4 − 4 = 0, so 4 solves the equation the squaring produced. Half of a
    // pair; the other half shows it solves nothing in the equation squared.
    reference: '0',
    at: { x: '4' },
  },
  {
    id: 'original-rejects-the-candidate-1',
    knowledgePointId: 'squaring-can-create-a-solution',
    kind: 'evaluate',
    prompt:
      'Now the same x = 4 in the equation that was squared. √x = −2 says √x + 2 = 0, so '
      + 'evaluate √x + 2 at x = 4. Anything other than 0 means 4 is not a solution of it — and '
      + 'the equation it does solve was produced by the squaring, not found by it.',
    given: 'sqrt(x) + 2',
    variables: REAL_X,
    // √4 + 2 = 2 + 2 = 4, which is not 0. Written as `sqrt(x) + 2` rather than
    // as the two sides separately because `given` is one expression and a
    // difference from zero is how an equation is tested inside one. The root is
    // of a perfect square, so `exactValue` settles it with no worker.
    reference: '4',
    at: { x: '4' },
  },
  {
    id: 'isolate-then-solve-1',
    knowledgePointId: 'isolate-the-radical-before-squaring',
    kind: 'evaluate',
    prompt:
      'Solve √(x + 7) − x = 1. Add x to both sides so the root stands alone, square, and you '
      + 'are left with x² + x − 6 = 0. Submit the LARGER of the two numbers that quadratic '
      + 'gives — it is also the one that survives the check.',
    given: '(-b + sqrt(b^2 - 4*a*c))/(2*a)',
    variables: REAL_ABC,
    // a = 1, b = 1, c = −6: the discriminant is 1 + 24 = 25, so the formula
    // gives (−1 + 5)/2 = 2 on the `+` branch and (−1 − 5)/2 = −3 on the other.
    // Checking 2 against the equation itself: √9 − 2 = 3 − 2 = 1. The −3 is the
    // extraneous one and is reached by the two tasks below.
    //
    // A perfect-square discriminant, which is the opposite of the choice
    // `formula-irrational-1` makes two hundred lines up. That task wants the
    // surd because keeping the answer exact is its knowledge point; this one
    // wants the ruling local, because the quadratic is scaffolding here and the
    // concept is what happens after it.
    reference: '2',
    at: { a: '1', b: '1', c: '-6' },
  },
  {
    id: 'survivor-satisfies-the-original-1',
    knowledgePointId: 'isolate-the-radical-before-squaring',
    kind: 'evaluate',
    prompt:
      'Squaring √(x + 7) − x = 1 produced the candidates 2 and −3. Evaluate the left side, '
      + '√(x + 7) − x, at x = 2. A value of 1 means this candidate is a solution of the '
      + 'equation as it was written.',
    given: 'sqrt(x+7) - x',
    variables: REAL_X,
    // √9 − 2 = 3 − 2 = 1, which is what the equation asks for.
    reference: '1',
    at: { x: '2' },
  },
  {
    id: 'casualty-fails-the-original-1',
    knowledgePointId: 'isolate-the-radical-before-squaring',
    kind: 'evaluate',
    prompt:
      'The same left side at the other candidate, x = −3. Anything other than 1 means −3 is not '
      + 'a solution — and nothing in the working was wrong, since −3 really is a root of '
      + 'x² + x − 6.',
    given: 'sqrt(x+7) - x',
    variables: REAL_X,
    // √4 − (−3) = 2 + 3 = 5, which is not 1. One expression at two inputs, 1 at
    // the survivor and 5 at the casualty: the verdicts differ in kind rather
    // than in size, which is the only way this build can score the asymmetry.
    reference: '5',
    at: { x: '-3' },
  },
  {
    id: 'casualty-solves-the-folded-equation-1',
    knowledgePointId: 'an-extraneous-root-solves-the-other-sign',
    kind: 'evaluate',
    prompt:
      'Squaring cannot tell √(x + 7) = x + 1 from √(x + 7) = −(x + 1), because the two squared '
      + 'are the same equation. The second says √(x + 7) + (x + 1) = 0. Evaluate '
      + '√(x + 7) + (x + 1) at x = −3.',
    given: 'sqrt(x+7) + (x+1)',
    variables: REAL_X,
    // √4 + (−3 + 1) = 2 + (−2) = 0. A value of 0 is the claim: at this
    // candidate the root equals MINUS the other side, so −3 is a solution of
    // the equation the squaring folded in, and that is where it came from.
    reference: '0',
    at: { x: '-3' },
  },
  {
    id: 'survivor-fails-the-folded-equation-1',
    knowledgePointId: 'an-extraneous-root-solves-the-other-sign',
    kind: 'evaluate',
    prompt:
      'The same expression at the surviving candidate, x = 2. Anything other than 0 means this '
      + 'one is NOT a solution of the folded-in equation — so the two candidates the quadratic '
      + 'gave belong to one equation each.',
    given: 'sqrt(x+7) + (x+1)',
    variables: REAL_X,
    // √9 + (2 + 1) = 3 + 3 = 6. Both sides of the equation asked come out as 3
    // here — same sign — which is the test the knowledge point's fourth subgoal
    // states, and it agrees with the substitution two tasks up.
    reference: '6',
    at: { x: '2' },
  },
  {
    id: 'even-power-cannot-be-undone-1',
    knowledgePointId: 'the-even-index-is-what-forces-the-check',
    kind: 'evaluate',
    prompt:
      'Evaluate x² at x = −2. Then note that 2² gives the same answer. A step that sends two '
      + 'different numbers to one cannot be undone, which is the whole reason a squaring needs '
      + 'to be followed by a check.',
    given: 'x^2',
    variables: REAL_X,
    // 4, and 2² is 4 as well. The pair with the task below is one shape at one
    // input, and the verdicts differ in kind: this value is shared with another
    // input and that one is not.
    reference: '4',
    at: { x: '-2' },
  },
  {
    id: 'odd-power-can-be-undone-1',
    knowledgePointId: 'the-even-index-is-what-forces-the-check',
    kind: 'evaluate',
    prompt:
      'Now x³ at x = −2. No other real number cubes to this, so cubing both sides of ∛x = −2 '
      + 'loses nothing and the candidate it gives needs no check. The index decides it, not the '
      + 'root sign.',
    given: 'x^3',
    variables: REAL_X,
    // −8, and nothing else cubed is −8. This is also the check on ∛(−8) = −2
    // run the easy way round: the cube root of −8 is −2 exactly because
    // (−2)³ = −8, and cubing is something `exactValue` settles where a cube
    // root is not in the expression language's function set at all.
    reference: '-8',
    at: { x: '-2' },
  },

  // ── arithmetic-foundations ──────────────────────────────────────────────
  //
  // Fifteen tasks, one per knowledge point, every one `evaluate` and every one
  // settled by `ruleEvaluate`'s exact rational arithmetic with no worker in the
  // loop. Arithmetic is the one subject where that is total rather than
  // partial, so this is the first syllabus in the build that is fully gradable
  // on a deployment with no worker configured.
  //
  // `given` is symbolic with an `at` table even where the mathematics is a bare
  // numeral, and the reason is the test suite rather than the schema: the
  // re-derivation check recomputes each `reference` from `given` at `at`, and a
  // literal answer in `given` would make it compare a number with itself. The
  // concrete numbers are repeated in the prompt so the learner sees the problem
  // and not the template.
  {
    id: 'digit-position-1',
    knowledgePointId: 'digit-position-is-a-multiplier',
    kind: 'evaluate',
    prompt:
      'Here is 4073 written out as its places: 4·10³ + 0·10² + 7·10¹ + 3·10⁰. Evaluate that sum. ' +
      'Getting the original number back is the check that the decomposition was right.',
    given: 'd3*10^3 + d2*10^2 + d1*10^1 + d0*10^0',
    variables: WHOLE_DIGITS,
    at: { d3: '4', d2: '0', d1: '7', d0: '3' },
    reference: '4073',
  },
  {
    id: 'carrying-1',
    knowledgePointId: 'carrying-is-regrouping',
    kind: 'evaluate',
    prompt:
      'Add 78 and 45 by their places: (7·10 + 8) + (4·10 + 5). Evaluate it. The tens column comes ' +
      'to 11 and the units to 13, so both have to be exchanged before the answer is a numeral.',
    given: '(a1*10 + a0) + (b1*10 + b0)',
    variables: [
      { name: 'a1', assumptions: { integer: true } },
      { name: 'a0', assumptions: { integer: true } },
      { name: 'b1', assumptions: { integer: true } },
      { name: 'b0', assumptions: { integer: true } },
    ],
    at: { a1: '7', a0: '8', b1: '4', b0: '5' },
    reference: '123',
  },
  {
    id: 'places-rightwards-1',
    knowledgePointId: 'places-continue-rightwards',
    kind: 'evaluate',
    prompt:
      'Evaluate 2·10⁰ + 3·10⁻¹ + 7·10⁻², which is 2.37 written out as its places. Give the exact ' +
      'value as a fraction — a terminating decimal is a fraction over a power of ten.',
    given: 'd0*10^0 + d1*10^(-1) + d2*10^(-2)',
    variables: [
      { name: 'd0', assumptions: { integer: true } },
      { name: 'd1', assumptions: { integer: true } },
      { name: 'd2', assumptions: { integer: true } },
    ],
    at: { d0: '2', d1: '3', d2: '7' },
    // 2 + 3/10 + 7/100 = 237/100. A learner answering 2.37 is ruled correct:
    // `exactValue` reads a decimal as the fraction it literally is.
    reference: '237/100',
  },
  {
    id: 'distribute-over-places-1',
    knowledgePointId: 'multiplication-distributes-over-the-places',
    kind: 'evaluate',
    prompt:
      'Multiply 23 by 47 the way the places say to: (20 + 3)(40 + 7). Evaluate it. There are four ' +
      'partial products, and the written method\'s two rows are those four grouped in pairs.',
    given: '(a + b)*(c + d)',
    variables: WHOLE_ABCD,
    at: { a: '20', b: '3', c: '40', d: '7' },
    // 800 + 140 + 120 + 21 = 1081.
    reference: '1081',
  },
  {
    id: 'division-remainder-1',
    knowledgePointId: 'division-leaves-a-remainder',
    kind: 'evaluate',
    prompt:
      'Dividing 137 by 19 gives a quotient of 7. Find the remainder by evaluating 137 − 19·7, then ' +
      'check it is less than 19 — that check is what makes the quotient the right one rather than ' +
      'merely a small one.',
    // Not a proxy task. Verifying a division by multiplying back is the fourth
    // subgoal of the worked example, and it is the step that is independent of
    // whatever mistake the division itself might have made. The quotient is
    // supplied because `exactValue` has no remainder operation — there is no
    // tree whose exact rational value is 137 mod 19 — so the alternative was
    // not a harder task but an unrulable one.
    given: 'a - q*b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'q', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { a: '137', q: '7', b: '19' },
    reference: '4',
  },
  {
    id: 'regrouping-1',
    knowledgePointId: 'regrouping-makes-arithmetic-easier',
    kind: 'evaluate',
    prompt:
      'Evaluate 8 · 7 · 125. Taken left to right this needs a long multiplication; reordered it ' +
      'does not, because one of the three pairs makes a round thousand.',
    given: 'a*b*c',
    variables: WHOLE_ABC,
    at: { a: '8', b: '7', c: '125' },
    // (8 · 125) · 7 = 1000 · 7.
    reference: '7000',
  },
  {
    id: 'precedence-1',
    knowledgePointId: 'precedence-is-a-convention',
    kind: 'evaluate',
    prompt:
      'Evaluate 2 + 3 · 4. The other reading of the same symbols gives 20, so this is a question ' +
      'about the convention rather than about the arithmetic.',
    given: 'a + b*c',
    variables: WHOLE_ABC,
    at: { a: '2', b: '3', c: '4' },
    reference: '14',
  },
  {
    id: 'brackets-override-1',
    knowledgePointId: 'brackets-override-precedence',
    kind: 'evaluate',
    prompt:
      'Evaluate (2 + 3) · 4. Compare your answer with 2 + 3 · 4: one pair of brackets, two ' +
      'different numbers.',
    given: '(a + b)*c',
    variables: WHOLE_ABC,
    at: { a: '2', b: '3', c: '4' },
    reference: '20',
  },
  {
    id: 'left-to-right-1',
    knowledgePointId: 'equal-rank-goes-left-to-right',
    kind: 'evaluate',
    prompt:
      'Evaluate 20 − 8 − 5. Grouping to the right instead gives 17, so the left-to-right rule is ' +
      'deciding the answer here rather than breaking a tie that does not matter.',
    given: 'a - b - c',
    variables: WHOLE_ABC,
    at: { a: '20', b: '8', c: '5' },
    reference: '7',
  },
  {
    id: 'subtraction-total-1',
    knowledgePointId: 'subtraction-becomes-total',
    kind: 'evaluate',
    prompt:
      'Evaluate 4 − 9. Among the whole numbers this has no answer at all; the negatives are the ' +
      'extension that gives it one.',
    given: 'a - b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { a: '4', b: '9' },
    reference: '-5',
  },
  {
    id: 'two-negatives-1',
    knowledgePointId: 'two-negatives-make-a-positive',
    kind: 'evaluate',
    prompt:
      'Evaluate (−3) · (−7). The distributive law leaves exactly one possible answer — see the ' +
      'worked example for why it is forced rather than agreed.',
    given: '(-a)*(-b)',
    variables: [
      { name: 'a', assumptions: { integer: true, positive: true } },
      { name: 'b', assumptions: { integer: true, positive: true } },
    ],
    at: { a: '3', b: '7' },
    reference: '21',
  },
  {
    id: 'minus-before-bracket-1',
    knowledgePointId: 'a-minus-before-a-bracket-distributes',
    kind: 'evaluate',
    prompt:
      'Evaluate 5 − (3 − 8). Distributing the minus flips the sign of BOTH terms in the bracket; ' +
      'flipping only the first is the commonest error in arithmetic and gives −6.',
    given: 'a - (b - c)',
    variables: WHOLE_ABC,
    at: { a: '5', b: '3', c: '8' },
    reference: '10',
  },
  /*
   * `absolute-value`, THE FIRST TASKS IN THE BUILD TO USE `abs`.
   *
   * Worth a block, because the concept was declined in writing for years on
   * the ground that they could not exist. ontology-arithmetic.ts's header said
   * "`exactValue` returns null for a `function` node, so nothing here uses
   * `abs`", and that stopped being true when numerals.ts grew its
   * `case 'function'` branch — `abs` is handled there exactly, by the sign of a
   * rational it already holds. So all four of these are settled locally with no
   * worker, like every other task in this subject, and none of them goes near
   * the ratchet in tests/concepts-logic.mjs capping how many shipped `evaluate`
   * tasks may need one.
   *
   * Every answer is an integer, and that is a property of the concept rather
   * than of careful input choice: `abs` of a whole number is a whole number,
   * and there is nothing else in the material.
   *
   * THE SECOND POINT CARRIES TWO, AND THEY ASK DIFFERENT QUESTIONS. The
   * quotient `abs(x)/x` is the sign claim — it is −1 at every negative x, which
   * is the whole of what it reports — and a learner could land on it by
   * remembering "negative, so −1" without having understood anything. So the
   * difference `abs(x) - x` sits beside it, where the answer depends on the
   * input and the two wrong readings are both visible in it: a learner who
   * believes |x| = x gets 0, and one who negates the wrong term gets 0 as well,
   * while the right answer is twice the size. One task of the pair is cheap to
   * guess and the other is not, which is why neither is sufficient alone.
   *
   * NO TASK ASKS FOR THE SYMMETRY, deliberately. The third point's claim is
   * |a − b| = |b − a|, whose natural ask is `abs(a - b) - abs(b - a)` — and the
   * answer to that is 0 for every pair of inputs, so a learner who writes 0
   * without reading the question is marked correct. A task whose reference is
   * independent of its inputs is not evidence, which is the proxy-task failure
   * this file warns about wearing a more flattering shape. The symmetry is
   * argued in the worked example's third subgoal instead, and the task asks for
   * the gap itself, where the number is the thing being claimed.
   */
  {
    id: 'abs-two-branches-1',
    knowledgePointId: 'distance-from-zero-has-two-branches',
    kind: 'evaluate',
    prompt:
      'Evaluate |x − 9| at x = 2. Work out what is inside the bars first, then apply the branch '
      + 'the sign of that number selects — there is a minus sign written in x − 9 at every input '
      + 'and at none of them is it the thing to delete. The answer is how far 2 is from 9.',
    given: 'abs(x - a)',
    variables: [
      { name: 'x', assumptions: { integer: true } },
      { name: 'a', assumptions: { integer: true } },
    ],
    at: { x: '2', a: '9' },
    reference: '7',
  },
  {
    id: 'abs-negative-branch-1',
    knowledgePointId: 'the-negative-branch-returns-the-positive-number',
    kind: 'evaluate',
    prompt:
      'Evaluate |x|/x at x = −12. The answer is 1 or −1 and nothing else, whatever x is — so the '
      + 'question is which, and that is the question of whether the bars changed the number.',
    given: 'abs(x)/x',
    variables: [{ name: 'x', assumptions: { integer: true } }],
    at: { x: '-12' },
    reference: '-1',
  },
  {
    id: 'abs-gap-size-1',
    knowledgePointId: 'the-negative-branch-returns-the-positive-number',
    kind: 'evaluate',
    prompt:
      'Evaluate |x| − x at x = −7. Anybody who thinks |x| and x are the same number here will '
      + 'write 0; the right answer says how far apart they really are.',
    given: 'abs(x) - x',
    variables: [{ name: 'x', assumptions: { integer: true } }],
    at: { x: '-7' },
    reference: '14',
  },
  {
    id: 'abs-distance-between-1',
    knowledgePointId: 'the-bars-measure-a-gap-either-way-round',
    kind: 'evaluate',
    prompt:
      'Evaluate |a − b| at a = −9 and b = 6. The two numbers are on opposite sides of zero, so '
      + 'the gap between them is not the difference of their sizes — and subtracting the other '
      + 'way round must give the same answer.',
    given: 'abs(a - b)',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
    ],
    at: { a: '-9', b: '6' },
    reference: '15',
  },
  {
    id: 'divides-exactly-1',
    knowledgePointId: 'divides-exactly-means-no-remainder',
    kind: 'evaluate',
    prompt:
      'Evaluate 1274 / 7. It comes out whole, which is what "7 divides 1274" means — and the ' +
      'answer is the second factor of the pair.',
    given: 'a/b',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '1274', b: '7' },
    reference: '182',
  },
  {
    id: 'digit-sum-nine-1',
    knowledgePointId: 'the-digit-sum-test-for-nine',
    kind: 'evaluate',
    prompt:
      'Is 4581 divisible by 9? Evaluate its digit sum 4 + 5 + 8 + 1 — the test says the number is ' +
      'divisible by 9 exactly when this is, and the worked example shows why that is not a ' +
      'coincidence.',
    // A proxy, and named as one: "is it divisible by 9" wants a yes or a no, and
    // no tree has a rational value of yes. The digit sum is the one question in
    // the vicinity with a checkable answer, and it is also the step the learner
    // actually has to perform, so the proxy is tight. The decision that 9
    // divides 18 is left to the learner and is not scored.
    given: 'd3 + d2 + d1 + d0',
    variables: WHOLE_DIGITS,
    at: { d3: '4', d2: '5', d1: '8', d0: '1' },
    reference: '18',
  },
  {
    id: 'common-factor-1',
    knowledgePointId: 'a-common-factor-comes-out',
    kind: 'evaluate',
    prompt:
      'Taking 12 out of 84 + 36 leaves 12 · (? + ?). Evaluate (84 + 36) / 12 to get what is inside ' +
      'the bracket. This is the distributive law read right-to-left, and it is what cancelling a ' +
      'fraction will later be.',
    given: '(a + b)/g',
    variables: [
      { name: 'a', assumptions: { integer: true } },
      { name: 'b', assumptions: { integer: true } },
      { name: 'g', assumptions: { integer: true, nonzero: true } },
    ],
    at: { a: '84', b: '36', g: '12' },
    // 120/12 = 10, which is the 7 + 3 of the worked example.
    reference: '10',
  },

  // ── expressions-and-equations ───────────────────────────────────────────
  //
  // Eighteen `evaluate` tasks across nine knowledge points — five for
  // `variables-and-expressions`, six for `linear-equations` and seven for
  // `systems-of-linear-equations` — all settled by exact rational arithmetic,
  // so this subject is gradable with no worker, which matters more here than
  // in most places: the first concept sits directly above arithmetic on the
  // entry route and a worker outage must not wall off the way in.
  //
  // Those figures are asserted in tests/concepts-logic.mjs rather than only
  // written here. A hand-maintained count in a comment is the thing in these
  // files most likely to be a promotion behind — the geometry files record
  // exactly that happening twice in one change — and the only numbers worth
  // trusting are the ones an assertion reads.
  //
  // THE FIRST TWO ARE A PAIR AND HAVE TO BE READ AS ONE. The knowledge point
  // is that a letter has two readings, and the two readings are checked by the
  // same act — substitution — doing two different jobs. `unknown-check-1`
  // substitutes to CONFIRM the number a condition picked out, which is what
  // settles an unknown. `identity-difference-1` substitutes into the
  // difference of the two sides of an identity and gets 0, which is what
  // substitution can do for a variable and no more: one case, not a proof. A
  // single task could only have taught one of those.
  //
  // `collect-like-terms-1` IS A PROXY AND SAYS SO. Collecting is a claim about
  // an expression, and no `NamedForm` expresses "collected": `5x + 2 + 3x − 7
  // + x²` is already a sum of monomials, so `expanded` would be satisfied by
  // the input unchanged and the equivalence check would pass trivially. See
  // ontology-algebra.ts for the longer version. The checkable question in the
  // vicinity is that the collected form and the original agree at every x, so
  // the task asks for their common value at one.
  {
    id: 'unknown-check-1',
    knowledgePointId: 'a-letter-has-two-readings',
    kind: 'evaluate',
    prompt:
      'The condition 3x − 7 = 11 picks out one number. Evaluate ax − b at a = 3, x = 6, b = 7 to '
      + 'check that 6 is it. Substituting back is the whole of what settles an unknown, which is '
      + 'why this reading has a number for an answer.',
    given: 'a*x - b',
    variables: REAL_ABX,
    // 3·6 − 7 = 18 − 7 = 11, the right-hand side of the condition.
    reference: '11',
    at: { a: '3', x: '6', b: '7' },
  },
  {
    id: 'identity-difference-1',
    knowledgePointId: 'a-letter-has-two-readings',
    kind: 'evaluate',
    prompt:
      'Now the other reading. 3(x + 2) = 3x + 6 claims the two sides are the same number for '
      + 'every x, so their difference should be 0 wherever you look. Evaluate '
      + 'a(x + b) − (ax + ab) at a = 3, x = −4, b = 2. Note what this does and does not show: '
      + 'one value of 0 is a single case, and the claim is about all of them.',
    given: 'a*(x + b) - (a*x + a*b)',
    variables: REAL_ABX,
    // 3(−4 + 2) − (3·(−4) + 3·2) = 3(−2) − (−12 + 6) = −6 − (−6) = 0.
    reference: '0',
    at: { a: '3', x: '-4', b: '2' },
  },
  {
    id: 'collect-like-terms-1',
    knowledgePointId: 'terms-collect-only-when-the-letters-match',
    kind: 'evaluate',
    prompt:
      'Collect 5x + 2 + 3x − 7 + x² into three terms, then evaluate it at x = 3. Your collected '
      + 'answer must give the same number at x = 3 as the original does — that agreement is what '
      + 'is being checked here, because "collected" is a claim about the expression and no form '
      + 'in this build can ask for it directly.',
    given: '5*x + 2 + 3*x - 7 + x^2',
    variables: REAL_X,
    // 15 + 2 + 9 − 7 + 9 = 28, and the collected x² + 8x − 5 at x = 3 is
    // 9 + 24 − 5 = 28. The two agreeing is the point of the task.
    reference: '28',
    at: { x: '3' },
  },
  {
    id: 'substitute-signed-1',
    knowledgePointId: 'substituting-supplies-the-hidden-brackets',
    kind: 'evaluate',
    prompt:
      'Evaluate 5 − 2x + x² at x = −3. Both brackets the letter was hiding have to be written '
      + 'down: 2x becomes 2(−3), and x² becomes (−3)².',
    given: '5 - 2*x + x^2',
    variables: REAL_X,
    // 5 − 2(−3) + (−3)² = 5 + 6 + 9 = 20. Reading the square as −3² instead
    // gives 5 + 6 − 9 = 2, so a bracket error changes the answer rather than
    // hiding inside it — which is what makes this task worth setting.
    reference: '20',
    at: { x: '-3' },
  },
  {
    id: 'power-binds-before-minus-1',
    knowledgePointId: 'substituting-supplies-the-hidden-brackets',
    kind: 'evaluate',
    prompt:
      'Evaluate −x² at x = −3. The power binds tighter than the minus sign in front of it, so the '
      + 'squaring happens first and the negation second — and the x brought its own sign inside. '
      + 'This is the order-of-operations convention deciding a sign rather than a magnitude.',
    given: '-x^2',
    variables: REAL_X,
    // −((−3)²) = −9. Negating first instead gives (+3)² = 9, so the two
    // readings differ in sign and the convention is doing the work.
    reference: '-9',
    at: { x: '-3' },
  },

  // ── expressions-and-equations: linear-equations ─────────────────────────
  //
  // SIX SOLVE TASKS EXPRESSED AS `evaluate`, AND WHAT MAKES THAT HONEST.
  //
  // There is no `solve` kind and these do not pretend to be one. A solution is
  // in general a SET — none, one, or infinitely many — and no `evaluate` target
  // expresses a set. What these four ask for is the NUMBER the method produces:
  // `given` carries the expression the unknown is left equal to once the
  // operations have been undone, and `prompt` carries the equation. The learner
  // does the solving and submits a number that is ruled exactly.
  //
  // `solve-exponential-1` is the precedent and types.ts argues it at length.
  // The one-variable linear case is where the shape is SAFEST: with a non-zero
  // coefficient there is exactly one solution, so the set and the value
  // coincide and nothing is being quietly rounded off.
  //
  // THIS COMMENT WENT ON TO SAY THAT `systems-of-linear-equations` "STILL
  // CANNOT" BE AUTHORED, and that clause is gone because it was wrong; the
  // seven tasks for it are below. The reasoning offered was that a system
  // "answers with a point, a line, or nothing, and that distinction is the
  // whole content of it". The distinction is PART of the content and the
  // conclusion did not follow: a point is two values and costs two tasks, and
  // the distinction between the other two outcomes is decided by a number the
  // elimination hands you. ontology-algebra.ts argues both at length and
  // reproduces the refusal rather than deleting it. Corrected here rather than
  // silently dropped because a comment in a data file is where the next author
  // looks for what has already been ruled out.
  //
  // THE FIRST TWO ARE A PAIR SPLIT ON THE SIGN OF b, which is why their
  // `given`s differ by one character. `solve-linear-one-sided-1` is ax − b = c
  // and undoing the subtraction ADDS, so its solution is (c + b)/a;
  // `solve-linear-non-integer-1` is ax + b = c and undoes the other way. A
  // learner who has memorised one shape rather than the move gets exactly one
  // of the two right, which is the only way this build can see the difference.
  //
  // `solve-linear-non-integer-1` answers 7/4 ON PURPOSE, for the reason
  // `solve-exponential-1` answers 3/2: an integer answer can be reached by
  // trying numbers, so the division step is only load-bearing when the answer
  // is not one.
  //
  // THE SECOND PAIR IS THE SAME EQUATION CLEARED FROM OPPOSITE SIDES, and the
  // pairing is the point rather than repetition. `(d - b)/(a - c)` is what
  // subtracting the smaller term in the unknown leaves; `(b - d)/(c - a)` is
  // what subtracting the larger one leaves, and it divides by a negative. Both
  // evaluate to 5 at the same inputs. A single task could not have asked
  // whether the answer depends on the choice, which is the knowledge point.
  //
  // THE LAST PAIR IS THE ONE PLACE A SOLUTION SET IS SAYABLE HERE, and it is
  // sayable because one number is a value. Multiplying 2x − 6 = 0 through by
  // x − 1 is not invertible, and the two tasks are the two halves of the
  // evidence: x = 1 sends the multiplied left side to 0, so it solves the new
  // equation, and sends the original left side to −4, so it does not solve the
  // old one. Neither task alone shows anything — the first is "a product with a
  // zero factor is zero" and the second is arithmetic. Read together they are
  // the solution set having changed, which is as close to the degenerate cases
  // as this build can get. ontology-algebra.ts says what stays out and why.
  {
    id: 'solve-linear-one-sided-1',
    knowledgePointId: 'undo-the-operations-in-reverse-order',
    kind: 'evaluate',
    prompt:
      'Solve 3x − 7 = 11. Undo the operations in the reverse of the order they were applied: '
      + 'the subtraction went on last, so it comes off first, and the multiplication by 3 comes '
      + 'off second. Submit the number x has to be.',
    given: '(c + b)/a',
    variables: REAL_ABC,
    // The equation is ax − b = c, so undoing the subtraction ADDS b:
    // x = (11 + 7)/3 = 18/3 = 6. Checking against the equation itself,
    // 3·6 − 7 = 18 − 7 = 11.
    reference: '6',
    at: { a: '3', b: '7', c: '11' },
  },
  {
    id: 'solve-linear-non-integer-1',
    knowledgePointId: 'undo-the-operations-in-reverse-order',
    kind: 'evaluate',
    prompt:
      'Solve 4x + 5 = 12. This one adds rather than subtracts, so the first step off is a '
      + 'subtraction — and the answer is not a whole number, which is the point: no amount of '
      + 'trying values gets there, only the division does.',
    given: '(c - b)/a',
    variables: REAL_ABC,
    // ax + b = c, so x = (12 − 5)/4 = 7/4. Checking, 4·(7/4) + 5 = 7 + 5 = 12.
    // Not an integer deliberately — see the note above.
    reference: '7/4',
    at: { a: '4', b: '5', c: '12' },
  },
  {
    id: 'collect-unknown-both-sides-1',
    knowledgePointId: 'the-unknown-on-both-sides-is-collected-first',
    kind: 'evaluate',
    prompt:
      'Solve 5x + 4 = 2x + 19. Nothing can be undone while x stands on both sides, so subtract '
      + '2x from both sides first — the same move as subtracting a number, since 2x names one — '
      + 'and then finish as a one-sided equation.',
    given: '(d - b)/(a - c)',
    variables: REAL_ABCD,
    // ax + b = cx + d, so x = (d − b)/(a − c) = (19 − 4)/(5 − 2) = 15/3 = 5.
    // Checking against the equation: 5·5 + 4 = 29 and 2·5 + 19 = 29.
    reference: '5',
    at: { a: '5', b: '4', c: '2', d: '19' },
  },
  {
    id: 'collect-from-the-other-side-1',
    knowledgePointId: 'the-unknown-on-both-sides-is-collected-first',
    kind: 'evaluate',
    prompt:
      'The same equation, 5x + 4 = 2x + 19, cleared the other way: subtract 5x from both sides '
      + 'instead of 2x. The last step is a division by a negative number. Submit the solution, '
      + 'and note whether it is the one the other route gave.',
    given: '(b - d)/(c - a)',
    variables: REAL_ABCD,
    // Clearing the larger term instead leaves b − d = (c − a)x, so
    // x = (4 − 19)/(2 − 5) = (−15)/(−3) = 5. The same number as
    // `collect-unknown-both-sides-1`, from a different expression at the same
    // inputs — which is the knowledge point's fourth subgoal as a ruling.
    reference: '5',
    at: { a: '5', b: '4', c: '2', d: '19' },
  },
  {
    id: 'gained-solution-satisfies-the-new-equation-1',
    knowledgePointId: 'a-non-invertible-step-changes-the-solutions',
    kind: 'evaluate',
    prompt:
      '2x − 6 = 0 was multiplied through by x − 1, giving (x − 1)(2x − 6) = 0. Evaluate the left '
      + 'side of that new equation at x = 1. A left side of 0 means 1 satisfies it.',
    given: '(x - 1)*(2*x - 6)',
    variables: REAL_X,
    // (1 − 1)(2·1 − 6) = 0 · (−4) = 0. So x = 1 solves the multiplied equation.
    // Half of a pair; the other half shows it does not solve the original.
    reference: '0',
    at: { x: '1' },
  },
  {
    id: 'gained-solution-fails-the-original-1',
    knowledgePointId: 'a-non-invertible-step-changes-the-solutions',
    kind: 'evaluate',
    prompt:
      'Now the same x = 1 in the equation that was multiplied, 2x − 6 = 0. Evaluate its left '
      + 'side. Anything other than 0 means 1 does not satisfy this one — so the step that '
      + 'produced it changed which numbers are solutions rather than rearranging the equation.',
    given: '2*x - 6',
    variables: REAL_X,
    // 2·1 − 6 = −4, which is not 0. Paired with the task above: one number,
    // satisfying the multiplied equation and failing the original, is the
    // solution the non-invertible step created.
    reference: '-4',
    at: { x: '1' },
  },

  // ── expressions-and-equations: systems-of-linear-equations ──────────────
  //
  // SEVEN MORE `evaluate` TASKS, AND THE THREE SHAPES THEY TAKE ARE THE THREE
  // THINGS `evaluate` CAN DO FOR AN ANSWER THAT IS NOT ONE NUMBER.
  //
  // Every `given` here is the method carried out ON THE LETTERS, which is the
  // property that makes a solve expressible as an `evaluate` honest rather
  // than a dodge. Eliminating y from ax + by = c and dx + ey = f — multiply
  // the first by e, the second by b, subtract — leaves (ae − bd)x = ce − bf,
  // so `(c*e - b*f)/(a*e - b*d)` is the learner's own elimination written down
  // once in general. It is not a formula quoted at them: the prompt carries
  // the system in numbers and nothing in the task data carries the formula to
  // them. Same for the substitution task, whose `given` is what putting
  // ax + b in for y leaves.
  //
  // A POINT COSTS TWO TASKS, which is the first shape. The first two ask for
  // the x and the y of 2x + 3y = 12 with 5x − y = 13, and the pairing is the
  // point rather than repetition — a solution here is a PAIR, `evaluate`
  // takes one value, and a learner who produced only one coordinate has not
  // solved the system. `gained-solution-*` above is the same device for a
  // different reason, so the shape is established in this file.
  //
  // THE SECOND SHAPE IS TWO ROUTES AT ONE SYSTEM. `solve-system-by-
  // substitution-1` and `solve-system-same-point-by-elimination-1` are
  // y = 2x − 1 with 3x + 2y = 12, once by substitution and once with the first
  // equation rewritten as 2x − y = 1 and eliminated. Their `given`s are
  // different expressions and their `at`s are different parameterisations of
  // one system, and both reach 2. That is the knowledge point's fourth subgoal
  // as a ruling, and it is the same device as `collect-unknown-both-sides-1`
  // against `collect-from-the-other-side-1` one concept down — where the two
  // `given`s differed and the inputs did not. Here both differ, because the
  // two methods do not even agree on how many coefficients the system has.
  //
  // THE THIRD SHAPE IS THE ONE THAT ANSWERS THE SOLUTION-SET REFUSAL, and it
  // is a pair differing in ONE INPUT. `inconsistent-system-leftover-1` and
  // `dependent-system-leftover-1` share the expression `a*b - c` and the first
  // two inputs, and differ in the third: 2 · 7 − 11 = 3 against 2 · 7 − 14 = 0.
  // Both are the number the elimination leaves when doubling 2x + 3y = 7 and
  // subtracting the other equation kills both letters at once. 3 means 0 = 3,
  // so no pair satisfies both; 0 means 0 = 0, so every pair on the line does.
  // Neither task asks HOW MANY solutions there are — that is a classification
  // and no verifiable kind returns one. Each asks for the number that decides
  // it, which is a value, and which the learner can only get by doing the
  // elimination.
  //
  // `dependent-system-pick-a-y-1` IS THE THIRD IN THAT GROUP AND THE ONLY ONE
  // THAT EVIDENCES "INFINITELY MANY" RATHER THAN "NOT NONE". A leftover of 0
  // says the second equation added no condition; it takes an actual pair to
  // show the solutions are there to be had. So that task fixes y = 2 and asks
  // for the x beside it, and the answer is 1/2 — deliberately not an integer,
  // for the reason `solve-linear-non-integer-1` answers 7/4: a whole number
  // can be reached by trying values, and the line is not a list of lattice
  // points. It also uses a different y from the worked example's 3, so the two
  // together show two solutions rather than one twice.
  //
  // All seven are exact rational arithmetic on whole numbers, so this subject
  // still rules with no worker configured — which matters more here than
  // elsewhere, because it sits directly above the arithmetic on the entry
  // route and a worker outage must not wall off the way in.
  {
    id: 'solve-system-eliminate-for-x-1',
    knowledgePointId: 'eliminate-a-letter-by-combining-the-equations',
    kind: 'evaluate',
    prompt:
      'Solve 2x + 3y = 12 and 5x − y = 13, and submit the value of x. Multiply the second '
      + 'equation by 3 so that the y terms become +3y and −3y, add the two equations to remove '
      + 'y altogether, and divide. The y is asked for separately, because a solution here is a '
      + 'pair and each coordinate is its own answer.',
    given: '(c*e - b*f)/(a*e - b*d)',
    variables: REAL_ABCDEF,
    // The system is ax + by = c with dx + ey = f, so eliminating y leaves
    // (ae − bd)x = ce − bf. At a=2, b=3, c=12, d=5, e=−1, f=13:
    // ae − bd = −2 − 15 = −17 and ce − bf = −12 − 39 = −51, so x = 3.
    // Against the equations themselves: 2·3 + 3·2 = 12 and 5·3 − 2 = 13.
    reference: '3',
    at: { a: '2', b: '3', c: '12', d: '5', e: '-1', f: '13' },
  },
  {
    id: 'solve-system-eliminate-for-y-1',
    knowledgePointId: 'eliminate-a-letter-by-combining-the-equations',
    kind: 'evaluate',
    prompt:
      'The other coordinate of the same system, 2x + 3y = 12 and 5x − y = 13. Submit the value '
      + 'of y — either by putting your x into one equation and checking the pair in the other, '
      + 'or by eliminating x instead. The two coordinates together are the solution; one of them '
      + 'is half of it.',
    given: '(a*f - c*d)/(a*e - b*d)',
    variables: REAL_ABCDEF,
    // Eliminating x instead leaves (ae − bd)y = af − cd. At the same inputs
    // af − cd = 26 − 60 = −34 over −17, so y = 2 — which is also what putting
    // x = 3 into 5x − y = 13 gives. Same denominator as the task above, which
    // is the point of the third knowledge point.
    reference: '2',
    at: { a: '2', b: '3', c: '12', d: '5', e: '-1', f: '13' },
  },
  {
    id: 'solve-system-by-substitution-1',
    knowledgePointId: 'substitution-reduces-the-system-to-one-equation',
    kind: 'evaluate',
    prompt:
      'Solve y = 2x − 1 and 3x + 2y = 12 by substitution, and submit the value of x. The first '
      + 'equation already names y, so put 2x − 1 in for it — brackets included, since y stands '
      + 'for one whole number — and what is left is one equation in one unknown.',
    given: '(e - d*b)/(c + d*a)',
    variables: REAL_ABCDE,
    // The system is y = ax + b with cx + dy = e. Substituting gives
    // cx + d(ax + b) = e, so (c + da)x = e − db. At a=2, b=−1, c=3, d=2, e=12:
    // (12 + 2)/(3 + 4) = 14/7 = 2. Against the equations: y = 2·2 − 1 = 3 and
    // 3·2 + 2·3 = 12.
    reference: '2',
    at: { a: '2', b: '-1', c: '3', d: '2', e: '12' },
  },
  {
    id: 'solve-system-same-point-by-elimination-1',
    knowledgePointId: 'substitution-reduces-the-system-to-one-equation',
    kind: 'evaluate',
    prompt:
      'The same system by the other route. Rewrite y = 2x − 1 as 2x − y = 1, then eliminate: '
      + 'double it so the y terms become −2y and +2y, add 3x + 2y = 12, and divide. Submit the '
      + 'value of x, and note whether it is the one substitution gave.',
    given: '(c*e - b*f)/(a*e - b*d)',
    variables: REAL_ABCDEF,
    // Now in the ax + by = c, dx + ey = f shape: a=2, b=−1, c=1, d=3, e=2,
    // f=12. ae − bd = 4 + 3 = 7 and ce − bf = 2 + 12 = 14, so x = 2 — the same
    // number as `solve-system-by-substitution-1` from a different expression at
    // different inputs, which is that knowledge point's fourth subgoal.
    reference: '2',
    at: { a: '2', b: '-1', c: '1', d: '3', e: '2', f: '12' },
  },
  {
    id: 'inconsistent-system-leftover-1',
    knowledgePointId: 'when-both-letters-cancel-the-leftover-decides',
    kind: 'evaluate',
    prompt:
      '2x + 3y = 7 and 4x + 6y = 11. Double the first equation and subtract the second. Both '
      + 'the x terms and the y terms cancel, so the left side is 0 for every pair of numbers — '
      + 'submit the number left on the right. Anything other than 0 means no pair satisfies both '
      + 'equations, because 0 cannot equal it.',
    given: 'a*b - c',
    variables: REAL_ABC,
    // a is the multiplier, b the first equation's right side, c the second's.
    // Doubling 2x + 3y = 7 gives 4x + 6y = 14, and 2·7 − 11 = 3, so the
    // elimination ends at 0 = 3. The left sides are identical after doubling,
    // which is why both letters go at once.
    reference: '3',
    at: { a: '2', b: '7', c: '11' },
  },
  {
    id: 'dependent-system-leftover-1',
    knowledgePointId: 'when-both-letters-cancel-the-leftover-decides',
    kind: 'evaluate',
    prompt:
      'The same move on 2x + 3y = 7 and 4x + 6y = 14 — one number changed. Double the first and '
      + 'subtract the second, and submit what is left on the right. A leftover of 0 says the '
      + 'second equation repeated the first and added no condition at all.',
    given: 'a*b - c',
    variables: REAL_ABC,
    // Same expression and same first two inputs as the task above, one input
    // different: 2·7 − 14 = 0, so the elimination ends at 0 = 0, true for every
    // pair. The pair of tasks is the two degenerate outcomes side by side, and
    // it is as close as `evaluate` gets to a solution set — see the group note.
    reference: '0',
    at: { a: '2', b: '7', c: '14' },
  },
  {
    id: 'dependent-system-pick-a-y-1',
    knowledgePointId: 'when-both-letters-cancel-the-leftover-decides',
    kind: 'evaluate',
    prompt:
      'A leftover of 0 says there is no condition left to narrow 2x + 3y = 7, so pick a y and '
      + 'there will be an x beside it. Take y = 2 and submit that x. It is not a whole number, '
      + 'which is the point: the solutions are every point on a line, not a list of the tidy ones.',
    given: '(c - b*d)/a',
    variables: REAL_ABCD,
    // 2x + 3y = 7 solved for x with y = d: x = (c − bd)/a = (7 − 6)/2 = 1/2.
    // Checking in both equations: 2(1/2) + 3·2 = 7 and 4(1/2) + 6·2 = 14, so
    // (1/2, 2) satisfies the whole system. A different y from the worked
    // example's 3, which gives (−1, 3), so the two exhibit two solutions.
    reference: '1/2',
    at: { a: '2', b: '3', c: '7', d: '2' },
  },

  // ── expressions-and-equations: gaussian-elimination ────────────────────
  //
  // SEVEN MORE, AND THE SHAPE IS THE PREVIOUS CONCEPT'S SHAPE WITH ONE MORE
  // LETTER IN PLAY — WHICH IS ALSO WHY THE CREDIT EDGE BETWEEN THEM IS REAL.
  //
  // `transform_to_form` is the kind row reduction asks for in every other
  // telling: "put this in row echelon form". It is unavailable twice over —
  // there is no `NamedForm` for echelon shape, and `expr.ts` cannot hold a grid
  // to check the shape OF. So the demand is not half-expressed with a form that
  // nearly fits, which is the trap types.ts names for `maxDenominatorDegree`;
  // it is left out, and what is asked for instead is the numbers the pass
  // produces. These seven are all of them.
  //
  // A TRIPLE COSTS THREE TASKS, which is the two-equation concept's "a point
  // costs two" one letter up, and the three are deliberately not all on one
  // knowledge point. `gaussian-forward-pass-for-z-1` is the z, because the
  // forward pass is what produces it; `gaussian-back-substitute-for-y-1` and
  // `-for-x-1` are the other two, because the upward pass is what produces
  // those. The method splits the answer and the material splits with it, rather
  // than stacking three coordinates on the first point and leaving the second
  // with a drill.
  //
  // THE FORWARD-PASS `given` IS THE SAME EXPRESSION THE TWO-EQUATION
  // ELIMINATION USES, and that is the whole argument for
  // `gaussian-elimination=>systems-of-linear-equations` being a claim about
  // these tasks rather than a plausible sentence. `(a*f - c*d)/(a*e - b*d)` is
  // `solve-system-eliminate-for-y-1`'s expression verbatim, evaluated at the
  // REDUCED coefficients instead of the original ones — because the last step
  // of a 3×3 forward pass is a 2×2 elimination on rows the earlier steps made.
  // A learner who reached that number performed the earlier concept on the way.
  //
  // WHAT THE `given`S ARE NOT is a 3×3 Cramer expression. Carrying the whole
  // forward pass on the letters would be a ratio of two 3×3 determinants in
  // twelve of them, past the widest declaration in this file and past the point
  // where it is still the learner's own move written down once — which is the
  // property that makes expressing a solve as an `evaluate` honest. So each
  // `given` is ONE STEP of the method in general, at the inputs that step
  // actually receives: a reduced coefficient, the final elimination, a
  // back-substitution, the leftover. The prompts carry the equations and the
  // comments carry the derivation of every input.
  //
  // `gaussian-reduced-coefficient-1` IS THE ONE THAT IS NOT A SOLVE and it
  // earns its place the way the discriminant tasks do: the single arithmetic
  // step most often got wrong in the whole method is subtracting a positive y
  // term from a negative one, and a wrong coefficient there is undetectable
  // from the final answer alone — it just produces a different number.
  //
  // THE LAST THREE ARE THE EMPTIED ROW, and the first two of them share
  // `c - a - b` and differ in one input, exactly as `inconsistent-system-
  // leftover-1` and `dependent-system-leftover-1` share `a*b - c` and differ in
  // one. 11 − 6 − 2 = 3 means 0 = 3 and no triple satisfies all three
  // equations; 8 − 6 − 2 = 0 means 0 = 0 and the third equation was the sum of
  // the first two. Neither asks HOW MANY solutions there are, because that is a
  // classification and no verifiable kind returns one.
  // `gaussian-free-variable-pick-a-z-1` is the third, and the only one that
  // evidences "a whole line of them" rather than "not none": it fixes z and
  // asks for the x beside it, and the answer is 17/2 — not an integer, for the
  // reason `dependent-system-pick-a-y-1` answers 1/2 and
  // `solve-linear-non-integer-1` answers 7/4. A whole number can be reached by
  // trying values, and a line is not a list of lattice points.
  //
  // All seven are exact rational arithmetic on whole numbers, so this subject
  // still rules with no worker configured. That contract matters more here than
  // anywhere: this is the top of the subject sitting directly above the
  // arithmetic on the entry route, and it is the concept most likely to look as
  // though it needs a service.
  {
    id: 'gaussian-reduced-coefficient-1',
    knowledgePointId: 'clear-downwards-so-each-row-holds-one-letter-fewer',
    kind: 'evaluate',
    prompt:
      'x + y + z = 6, x + 2y − z = 2 and 2x − y + z = 3. Before anything can be solved the third '
      + 'equation has to lose its x, and its x term is 2x — so subtract TWICE the first equation '
      + 'from it. Submit the coefficient of y in the row that comes out. It is the step in the '
      + 'whole method most often got wrong, because the y term being subtracted is positive and '
      + 'the one it is subtracted from is negative.',
    given: 'a - b*c',
    variables: REAL_ABC,
    // a is the third equation's y coefficient, b the multiplier the first
    // equation is taken through, c the first equation's y coefficient:
    // −1 − 2·1 = −3, so the reduced row is −3y − z = −9. The z coefficient
    // comes out the same way, 1 − 2·1 = −1, and the right side as 3 − 2·6 = −9.
    reference: '-3',
    at: { a: '-1', b: '2', c: '1' },
  },
  {
    id: 'gaussian-forward-pass-for-z-1',
    knowledgePointId: 'clear-downwards-so-each-row-holds-one-letter-fewer',
    kind: 'evaluate',
    prompt:
      'Finish the forward pass on the same system and submit the value of z. Subtracting the '
      + 'first equation from the second and twice the first from the third leaves two equations '
      + 'in y and z alone; take y out of one of those using the other, and the row left holds z '
      + 'by itself. The other two coordinates are asked for separately, because a solution here '
      + 'is a triple and each coordinate is its own answer.',
    given: '(a*f - c*d)/(a*e - b*d)',
    variables: REAL_ABCDEF,
    // The reduced pair is ay + bz = c with dy + ez = f, so eliminating y leaves
    // (ae − bd)z = af − cd — `solve-system-eliminate-for-y-1`'s expression,
    // because this step IS that concept's elimination on rows the pass made.
    // The pair is y − 2z = −4 and −3y − z = −9, so a=1, b=−2, c=−4, d=−3,
    // e=−1, f=−9: af − cd = −9 − 12 = −21 and ae − bd = −1 − 6 = −7, so z = 3.
    // Against the originals at (1, 2, 3): 1 + 2 + 3 = 6, 1 + 4 − 3 = 2 and
    // 2 − 2 + 3 = 3.
    reference: '3',
    at: { a: '1', b: '-2', c: '-4', d: '-3', e: '-1', f: '-9' },
  },
  {
    id: 'gaussian-back-substitute-for-y-1',
    knowledgePointId: 'back-substitution-runs-back-up-the-staircase',
    kind: 'evaluate',
    prompt:
      'The forward pass on x + y + z = 6, x + 2y − z = 2, 2x − y + z = 3 leaves the staircase '
      + 'x + y + z = 6, y − 2z = −4, −7z = −21. With z = 3 off the bottom row, move up one row '
      + 'and submit the value of y. That row was built to hold exactly one letter you do not '
      + 'already know by the time you arrive at it.',
    given: '(c - b*d)/a',
    variables: REAL_ABCD,
    // The row is ay + bz = c and d is the z already known, so y = (c − bz)/a.
    // At a=1, b=−2, c=−4, d=3: (−4 + 6)/1 = 2. Same expression as
    // `dependent-system-pick-a-y-1` and the same move — one linear equation in
    // one unknown once the other letter is a number — which is the point rather
    // than a coincidence: back-substitution is the first concept of this
    // subject's solve, repeated up the staircase.
    reference: '2',
    at: { a: '1', b: '-2', c: '-4', d: '3' },
  },
  {
    id: 'gaussian-back-substitute-for-x-1',
    knowledgePointId: 'back-substitution-runs-back-up-the-staircase',
    kind: 'evaluate',
    prompt:
      'The top row of the same staircase, x + y + z = 6, with y = 2 and z = 3 both known now. '
      + 'Submit the value of x. Then check the triple in 2x − y + z = 3 rather than in the top '
      + 'row: the top row is the equation x came out of, so it cannot fail, while the third '
      + 'original equation is one the pass only consumed on the way down and can.',
    given: '(d - b*e - c*f)/a',
    variables: REAL_ABCDEF,
    // The row is ax + by + cz = d with e and f the two letters already known,
    // so x = (d − be − cf)/a. At a=1, b=1, c=1, d=6, e=2, f=3: 6 − 2 − 3 = 1.
    // The check the prompt asks for: 2(1) − 2 + 3 = 3, which is the third
    // equation's right side, so the whole forward pass is confirmed in one line.
    reference: '1',
    at: { a: '1', b: '1', c: '1', d: '6', e: '2', f: '3' },
  },
  {
    id: 'gaussian-emptied-row-contradiction-1',
    knowledgePointId: 'a-row-that-empties-reports-instead-of-stalling',
    kind: 'evaluate',
    prompt:
      'x + y + z = 6, x + 2y − z = 2 and 2x + 3y = 11. Clear downwards: the second row less the '
      + 'first and the third row less twice the first come out with the SAME left side, y − 2z, '
      + 'so taking y out of one using the other takes the z with it and the bottom row has no '
      + 'letter left in it at all. Submit the number it leaves on the right. Anything other than '
      + '0 means no triple satisfies all three equations, because 0 cannot equal it.',
    given: 'c - a - b',
    variables: REAL_ABC,
    // a, b and c are the three right-hand sides. The second reduced row's right
    // side is b − a = −4 and the third's is c − 2a = −1, so the leftover is
    // (c − 2a) − (b − a) = c − a − b: 11 − 6 − 2 = 3, and the pass ends at
    // 0 = 3. Read forwards, a + b is what the first two equations force
    // 2x + 3y to be — 8 — and the third asks for 11.
    reference: '3',
    at: { a: '6', b: '2', c: '11' },
  },
  {
    id: 'gaussian-emptied-row-dependent-1',
    knowledgePointId: 'a-row-that-empties-reports-instead-of-stalling',
    kind: 'evaluate',
    prompt:
      'The same clear on x + y + z = 6, x + 2y − z = 2 and 2x + 3y = 8 — one number changed. '
      + 'Submit what the emptied row leaves on the right. A leftover of 0 says the third '
      + 'equation was the sum of the first two and added no condition at all.',
    given: 'c - a - b',
    variables: REAL_ABC,
    // Same expression and same first two inputs as the task above, one input
    // different: 8 − 6 − 2 = 0, so the pass ends at 0 = 0, true for every
    // triple. The pair is the two degenerate outcomes side by side, and it is
    // as close as `evaluate` gets to a solution set.
    reference: '0',
    at: { a: '6', b: '2', c: '8' },
  },
  {
    id: 'gaussian-free-variable-pick-a-z-1',
    knowledgePointId: 'a-row-that-empties-reports-instead-of-stalling',
    kind: 'evaluate',
    prompt:
      'A leftover of 0 leaves two rows holding a letter and three letters in play, so one of the '
      + 'three may be chosen and the other two follow. Take z = 1/2 in x + y + z = 6 with '
      + 'x + 2y − z = 2, and submit the x beside it. It is not a whole number, which is the '
      + 'point: the solutions are every triple on a line, not a list of the tidy ones.',
    given: '2*a - b - 3*c',
    variables: REAL_ABC,
    // a and b are the first two equations' right sides and c the chosen z. The
    // reduced second row is y − 2z = b − a, so y = (b − a) + 2z, and the first
    // row gives x = a − y − z = 2a − b − 3z. At a=6, b=2, c=1/2:
    // 12 − 2 − 3/2 = 17/2, with y = −4 + 1 = −3. Checking (17/2, −3, 1/2) in
    // all three: 17/2 − 3 + 1/2 = 6, 17/2 − 6 − 1/2 = 2, and 17 − 9 = 8.
    reference: '17/2',
    at: { a: '6', b: '2', c: '1/2' },
  },

  // ── expressions-and-equations: nonlinear-systems ───────────────────────
  //
  // EIGHT MORE `evaluate` TASKS, AND THE THREE SHAPES ARE THE THREE THE
  // PREVIOUS TWO CONCEPTS ESTABLISHED, WITH ONE OF THEM DOING A NEW JOB.
  //
  // Every `given` is still the method carried out ON THE LETTERS, and here it
  // is the quadratic formula at the coefficients a substitution produces.
  // Putting y = mx + k into x² + y² = r² gives (1 + m²)x² + 2mkx + (k² − r²)
  // = 0, so the roots are (−mk ± √(m²k² − (1 + m²)(k² − r²)))/(1 + m²), and
  // that is the learner's own substitution and solve written down once in
  // general. The prompts carry the systems in numbers and nothing in the task
  // data carries the formula to them.
  //
  // A POINT COSTS TWO TASKS, which is the shape `solve-system-eliminate-for-*`
  // established and the reason the first two here are a pair rather than
  // repetition. `nonlinear-line-meets-circle-x-1` and
  // `nonlinear-line-meets-circle-y-1` are the 3 and the 4 of ONE intersection,
  // and the y task's expression is the x task's fed through the line — which is
  // the knowledge point's fourth subgoal as a ruling, because a learner who
  // pairs x = 3 with the other root's y has produced two numbers that satisfy
  // neither equation. `nonlinear-line-meets-circle-second-x-1` is the third in
  // that group and is the minus branch of the same expression: two tasks say
  // what a point is and the third says there are two of them, which a pair
  // alone cannot.
  //
  // THE SECOND SHAPE IS A PAIR DIFFERING IN ONE INPUT, lifted straight from
  // `inconsistent-system-leftover-1` against `dependent-system-leftover-1`.
  // `nonlinear-discriminant-touches-1` and `nonlinear-discriminant-misses-1`
  // share the expression `m^2 + 4*k` and the input m = 2, and differ in k:
  // 4 + 4(−1) = 0 against 4 + 4(−2) = −4. Both are the discriminant of
  // x² − mx − k = 0, which is what substituting y = mx + k into y = x² leaves.
  // Neither task asks HOW MANY points there are — that is a classification and
  // no verifiable kind returns one. Each asks for the number that decides it.
  // `nonlinear-tangent-x-1` is the third and is what a discriminant of 0 is
  // WORTH: the repeated root is the single point of contact, and reaching it
  // means having computed the 0 first rather than reporting it.
  //
  // THE THIRD SHAPE IS THE PAIR AGAIN AND THE NEW JOB IS IN THE SECOND HALF.
  // `nonlinear-two-circles-x-1` and `nonlinear-two-circles-y-1` are the x and
  // the y of (3, 4), so they are a point costing two tasks for the second time
  // in this concept — but the y task is a back-substitution INTO A SQUARE
  // rather than into a line, so its expression carries a `sqrt` and its answer
  // has a twin. The prompt says which of the two to submit and says the other
  // is equally a solution, because an answer key that silently preferred the
  // positive root would be teaching that a square root has one value.
  //
  // ALL EIGHT ARE EXACT INTEGERS, which took choosing rather than luck and is
  // argued in ontology-algebra.ts's header: the quadratic a substitution leaves
  // has irrational roots for almost every line anybody writes down, and
  // `quadratic-formula` already owns the surd. The circle is given radius 5 and
  // the chord is put at x = 3, so both `sqrt` calls land on whole numbers off
  // the same 3–4–5 triangle. So this subject still rules with no worker
  // configured, which is the contract the four concepts above hold and which
  // matters most at the bottom of the entry route.
  {
    id: 'nonlinear-line-meets-circle-x-1',
    knowledgePointId: 'substitution-is-the-only-move-left',
    kind: 'evaluate',
    prompt:
      'Solve y = x + 1 and x² + y² = 25, and submit the LARGER of the two x-coordinates. '
      + 'Combining the equations cancels nothing — no multiple of y will kill a y² — so put '
      + 'x + 1 in for y, brackets included, and solve the quadratic that is left. The y is '
      + 'asked for separately, because a solution here is a point and each coordinate is its '
      + 'own answer.',
    given: '(-m*k + sqrt(m^2*k^2 - (1 + m^2)*(k^2 - r^2)))/(1 + m^2)',
    variables: REAL_KMR,
    // The line is y = mx + k and the circle x² + y² = r², so substituting
    // leaves (1 + m²)x² + 2mkx + (k² − r²) = 0 and the roots are as written.
    // At m=1, k=1, r=5: m²k² = 1 and (1 + m²)(k² − r²) = 2(1 − 25) = −48, so
    // the root is (−1 + √49)/2 = 6/2 = 3. Against the equations themselves:
    // y = 3 + 1 = 4, and 3² + 4² = 9 + 16 = 25.
    reference: '3',
    at: { m: '1', k: '1', r: '5' },
  },
  {
    id: 'nonlinear-line-meets-circle-y-1',
    knowledgePointId: 'substitution-is-the-only-move-left',
    kind: 'evaluate',
    prompt:
      'The other coordinate of that same intersection point of y = x + 1 and x² + y² = 25. '
      + 'Submit the y that goes with the larger x. It comes from the line rather than from the '
      + 'circle, which is also why the finished pair has to be checked in the circle: the line '
      + 'is where the y was computed and cannot catch a slip.',
    given: 'm*((-m*k + sqrt(m^2*k^2 - (1 + m^2)*(k^2 - r^2)))/(1 + m^2)) + k',
    variables: REAL_KMR,
    // The x task's expression fed through the line y = mx + k, which is what
    // the back-substitution is. At the same inputs, 1·3 + 1 = 4. Paired with
    // the task above: the two together are the point (3, 4), and pairing this
    // 4 with the OTHER root −4 gives (−4, 4), which satisfies neither equation.
    reference: '4',
    at: { m: '1', k: '1', r: '5' },
  },
  {
    id: 'nonlinear-line-meets-circle-second-x-1',
    knowledgePointId: 'substitution-is-the-only-move-left',
    kind: 'evaluate',
    prompt:
      'The same system, y = x + 1 with x² + y² = 25, has a second intersection point. Submit '
      + 'the SMALLER x-coordinate. The quadratic has two roots and both are real here, so the '
      + 'line crosses the circle rather than touching it — one root would have been the whole '
      + 'answer only if the two had collapsed together.',
    given: '(-m*k - sqrt(m^2*k^2 - (1 + m^2)*(k^2 - r^2)))/(1 + m^2)',
    variables: REAL_KMR,
    // The minus branch of the first task's expression, at the same inputs:
    // (−1 − 7)/2 = −4, whose partner on the line is −3. Checking (−4, −3) in
    // the circle: 16 + 9 = 25. Two tasks say what a point is; this one says
    // there are two of them, which the pair above cannot.
    reference: '-4',
    at: { m: '1', k: '1', r: '5' },
  },
  {
    id: 'nonlinear-discriminant-touches-1',
    knowledgePointId: 'the-discriminant-counts-the-intersections',
    kind: 'evaluate',
    prompt:
      'The parabola y = x² meets the line y = 2x − 1. Substitute to get one equation in x, and '
      + 'submit the DISCRIMINANT of it — the part of the quadratic formula under the root sign. '
      + 'Do not find the roots: the discriminant is what says how many there are, and it is '
      + 'reachable without them.',
    given: 'm^2 + 4*k',
    variables: REAL_KM,
    // Substituting y = mx + k into y = x² leaves x² − mx − k = 0, whose
    // discriminant is (−m)² − 4(1)(−k) = m² + 4k. At m=2, k=−1 that is
    // 4 − 4 = 0, so the two roots have collapsed: x² − 2x + 1 = (x − 1)² and
    // the line touches the parabola at (1, 1), which is the next task.
    reference: '0',
    at: { m: '2', k: '-1' },
  },
  {
    id: 'nonlinear-discriminant-misses-1',
    knowledgePointId: 'the-discriminant-counts-the-intersections',
    kind: 'evaluate',
    prompt:
      'The same parabola y = x² against y = 2x − 2 — one number changed. Submit the '
      + 'discriminant again. A negative value means the quadratic has no real root at all, so '
      + 'the line and the parabola never meet; nothing about the two equations contradicts, '
      + 'which is what makes this different from a pair of parallel lines.',
    given: 'm^2 + 4*k',
    variables: REAL_KM,
    // Same expression and same m as the task above, one input different:
    // 4 + 4(−2) = −4. x² − 2x + 2 = 0 has no real root, and the line passes
    // above the parabola everywhere. The pair of tasks is two of the three
    // outcomes side by side, which is as close as `evaluate` gets to a count.
    reference: '-4',
    at: { m: '2', k: '-2' },
  },
  {
    id: 'nonlinear-tangent-x-1',
    knowledgePointId: 'the-discriminant-counts-the-intersections',
    kind: 'evaluate',
    prompt:
      'A discriminant of 0 says y = x² and y = 2x − 1 meet at exactly one point. Submit the '
      + 'x-coordinate of it. The formula still applies — the two roots have come together, so '
      + 'reaching this number means having the discriminant first rather than being told it is '
      + 'zero.',
    given: '(m + sqrt(m^2 + 4*k))/2',
    variables: REAL_KM,
    // The quadratic formula on x² − mx − k = 0, whose roots are
    // (m ± √(m² + 4k))/2. At m=2, k=−1 the root under the sign is 0, so both
    // branches give (2 + 0)/2 = 1, and y = 1² = 1 — the line y = 2x − 1 passes
    // through (1, 1) and touches there. Evidences "one point" where the pair
    // above only evidences "not two".
    reference: '1',
    at: { m: '2', k: '-1' },
  },
  {
    id: 'nonlinear-two-circles-x-1',
    knowledgePointId: 'two-conics-lose-both-squares-at-once',
    kind: 'evaluate',
    prompt:
      'Solve x² + y² = 25 and (x − 6)² + y² = 25. Neither equation names a letter, so there is '
      + 'nothing to substitute — expand the second, subtract the first, and both squared terms '
      + 'go at once. Solve the linear equation that is left and submit the x. Both intersection '
      + 'points share it, which is why one linear equation is enough.',
    given: '(d^2 + r^2 - s^2)/(2*d)',
    variables: REAL_DRS,
    // The circles are x² + y² = r² and (x − d)² + y² = s². Expanding the
    // second gives x² − 2dx + d² + y² = s², and subtracting the first leaves
    // −2dx + d² = s² − r², so x = (d² + r² − s²)/(2d). At d=6, r=5, s=5 that
    // is (36 + 25 − 25)/12 = 3. The line x = 3 is also the perpendicular
    // bisector of the two centres here, the radii being equal.
    reference: '3',
    at: { d: '6', r: '5', s: '5' },
  },
  {
    id: 'nonlinear-two-circles-y-1',
    knowledgePointId: 'two-conics-lose-both-squares-at-once',
    kind: 'evaluate',
    prompt:
      'Put that x back into x² + y² = 25 and submit the POSITIVE y. There are two values and '
      + 'both are intersection points — the thing being undone is a square, not a line, so one '
      + 'x carries two partners here where the line-and-circle system gave each root exactly '
      + 'one.',
    given: 'sqrt(r^2 - ((d^2 + r^2 - s^2)/(2*d))^2)',
    variables: REAL_DRS,
    // The x the task above produces, substituted into the first circle: at
    // d=6, r=5, s=5 that is √(25 − 9) = 4, and −4 is equally a solution. The
    // two points are (3, 4) and (3, −4); checking the first in the circle the
    // coordinate did NOT come from, (3 − 6)² + 4² = 9 + 16 = 25.
    reference: '4',
    at: { d: '6', r: '5', s: '5' },
  },

  // ── plane-geometry ──────────────────────────────────────────────────────
  //
  // Six `evaluate` tasks across three knowledge points, all settled by exact
  // rational arithmetic, so this subject needs no worker — which matters here
  // because the concept is a ROOT of the whole map and a worker outage would
  // wall off a way in rather than a branch.
  //
  // EVERY ONE OF THEM IS A PROXY AND THE SET SAYS SO ONCE, HERE. The real ask
  // in this concept is "find the missing angle and name the fact you used",
  // and no verifiable kind can take the second half: a reason is not a value
  // and not a form. So each task asks the arithmetic its fact licenses, and
  // each prompt names the decision it is standing in for — the same move the
  // rational-expressions tasks make for "state the excluded points".
  //
  // The cost is specific and worth writing down rather than discovering: a
  // learner who subtracts from 180 where the figure called for 360 gets the
  // arithmetic question right. Choosing between the two sums is the skill and
  // it is unscorable here, which is why `straight-line-remainder-1` and
  // `full-turn-remainder-1` are a PAIR — same shape, different total, so the
  // two sit next to each other in practice and the choice is at least visible
  // even though no ruling turns on it.
  //
  // They declare `real` rather than `integer`, unlike the arithmetic tasks
  // they otherwise resemble. The whole-degree values are a convenience of the
  // figures chosen; nothing in these facts is about whole numbers, and
  // 180 − (180 − a) = a is a claim about every angle. Narrowing the
  // declaration would narrow the claim.
  {
    id: 'straight-line-remainder-1',
    knowledgePointId: 'two-sums-every-angle-chase-uses',
    kind: 'evaluate',
    prompt:
      'Four rays leave a point on a straight line, all on the same side of it, cutting angles of '
      + '42°, 55°, x° and 38° in a row. Evaluate 180 − a − b − c at a = 42, b = 55, c = 38 to get '
      + 'x. The 180 is in the expression because the figure put it there — that the four angles '
      + 'span a straight line and not a full turn is the decision this task cannot ask you for.',
    given: '180 - a - b - c',
    variables: REAL_ABC,
    // 180 − 42 − 55 − 38 = 45, the x of the worked example.
    reference: '45',
    at: { a: '42', b: '55', c: '38' },
  },
  {
    id: 'full-turn-remainder-1',
    knowledgePointId: 'two-sums-every-angle-chase-uses',
    kind: 'evaluate',
    prompt:
      'Now the other total. Four rays leave a point and fill the whole turn around it; three of '
      + 'the four angles are 90°, 73° and 115°. Evaluate 360 − a − b − c at a = 90, b = 73, '
      + 'c = 115 to get the fourth. Read this one against the task before it: the arithmetic is '
      + 'the same arithmetic, and the only thing that changed is which total the figure makes.',
    given: '360 - a - b - c',
    variables: REAL_ABC,
    // 360 − 90 − 73 − 115 = 82. Taking 180 as the total instead gives −98,
    // which is impossible rather than merely wrong — the sign is the signal
    // that the wrong sum was chosen.
    reference: '82',
    at: { a: '90', b: '73', c: '115' },
  },
  {
    id: 'adjacent-angle-on-a-line-1',
    knowledgePointId: 'vertical-angles-equal-by-subtracting-twice',
    kind: 'evaluate',
    prompt:
      'Two straight lines cross, and one of the four angles is 35°. Evaluate 180 − x at x = 35 to '
      + 'get the angle beside it. This single subtraction is the only geometric fact the vertical '
      + 'argument uses; the next task is what happens when you do it twice.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 35 = 145, the b and d of the worked example.
    reference: '145',
    at: { x: '35' },
  },
  {
    id: 'vertical-pair-difference-1',
    knowledgePointId: 'vertical-angles-equal-by-subtracting-twice',
    kind: 'evaluate',
    prompt:
      'The angle facing the first one is 180 − (180 − x): beside it along one line, then beside '
      + 'THAT along the other. Evaluate (180 − (180 − x)) − x at x = 118. A difference of 0 says '
      + 'the facing angle came back to where it started — and note what one value does and does '
      + 'not show: 118 is not the 35 of the worked example, which is the point, but two cases are '
      + 'still two cases. What settles it is that the two subtractions undo each other for every x.',
    given: '(180 - (180 - x)) - x',
    variables: REAL_X,
    // 180 − (180 − 118) = 180 − 62 = 118, and 118 − 118 = 0. Zero for every x,
    // which is the theorem; this evaluates one instance of it.
    reference: '0',
    at: { x: '118' },
  },
  {
    id: 'co-interior-remainder-1',
    knowledgePointId: 'a-transversal-across-parallels-has-two-values',
    kind: 'evaluate',
    prompt:
      'A line crosses two parallel lines at P and Q. The angle at P opening into the strip '
      + 'between them, on the right of the crossing line, is 118°. Evaluate 180 − x at x = 118 to '
      + 'get the angle at Q opening into that same strip on that same side. The subtraction is '
      + 'the part that can be checked; why it is a subtraction and not the 118° over again is the '
      + 'slide argument, and that is the half no task here can score.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 118 = 62. Answering 118 is the error the worked example is built
    // around: the slide lands that angle outside the strip, not inside it.
    reference: '62',
    at: { x: '118' },
  },
  {
    id: 'eight-angles-two-values-1',
    knowledgePointId: 'a-transversal-across-parallels-has-two-values',
    kind: 'evaluate',
    prompt:
      'All eight angles in that figure are 118° or 62°, four of each, and they fill the four '
      + 'straight angles the two crossings make — two at each crossing. Evaluate 4x + 4(180 − x) '
      + 'at x = 118. That the x cancels is the content: the total is 4 × 180 whatever the crossing '
      + 'line\'s slant, which is another way of saying the figure holds two numbers and no third.',
    given: '4*x + 4*(180 - x)',
    variables: REAL_X,
    // 4·118 + 4·62 = 472 + 248 = 720, which is 4 × 180 — the two crossings'
    // four straight angles. Identically 720 for every x.
    reference: '720',
    at: { x: '118' },
  },

  // ── plane-geometry: the triangle ─────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `triangle-basics`.
  // Everything the block above says applies unchanged — all settled by exact
  // rational arithmetic with no worker, all proxies for an ask whose second
  // half is a reason, and all naming the decision they stand in for.
  //
  // ONE THING IS NEW AND IT IS THE INEQUALITY. "Do these three lengths make a
  // triangle?" has a perfectly good task kind waiting for it: `counterexample`
  // asks for an object that breaks a claim, and three lengths that fail to
  // close is exactly such an object. It is rulable only when the claim is an
  // identity, and this claim is an inequality, so the kind would be served and
  // never scored — which the assembler is designed to refuse.
  //
  // So the test is asked as the subtraction whose SIGN decides it, and the
  // prompt says so. That is better than it sounds and worse than it looks:
  // the ruling is genuinely in the learner's answer rather than nowhere, since
  // a + b − c carries the verdict in one number — but a learner who computes
  // −1 and concludes "yes, a triangle" still scores the mark. Reading the sign
  // is the skill and no task here can score it, the same shape of loss as
  // choosing between 180 and 360 one block up.
  {
    id: 'third-angle-of-a-triangle-1',
    knowledgePointId: 'the-angle-sum-is-the-transversal-fact-again',
    kind: 'evaluate',
    prompt:
      'Two angles of a triangle are 47° and 68°. Evaluate 180 − a − b at a = 47, b = 68 to get '
      + 'the third. The 180 is there because a line through one vertex parallel to the opposite '
      + 'side puts all three angles along a straight line — that derivation is the content of '
      + 'this point and this task takes it as given.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 47 − 68 = 65, the third angle of the worked example.
    reference: '65',
    at: { a: '47', b: '68' },
  },
  {
    id: 'exterior-angle-is-the-other-two-1',
    knowledgePointId: 'the-angle-sum-is-the-transversal-fact-again',
    kind: 'evaluate',
    prompt:
      'The exterior angle at that third vertex is 180 minus the third angle — beside it along a '
      + 'straight line. So it is 180 − (180 − a − b), and the claim is that this is just a + b. '
      + 'Evaluate (180 − (180 − a − b)) − (a + b) at a = 47, b = 68. A difference of 0 says the '
      + 'two subtractions cancelled; that they cancel for EVERY a and b is what makes the '
      + 'exterior-angle fact a theorem rather than an arithmetic coincidence, and one pair of '
      + 'values cannot show that.',
    given: '(180 - (180 - a - b)) - (a + b)',
    variables: REAL_AB,
    // 180 − 47 − 68 = 65; 180 − 65 = 115; 115 − (47 + 68) = 115 − 115 = 0.
    // Identically 0, which is the theorem; this evaluates one instance.
    reference: '0',
    at: { a: '47', b: '68' },
  },
  {
    id: 'longest-against-the-other-two-1',
    knowledgePointId: 'the-inequality-compares-two-routes',
    kind: 'evaluate',
    prompt:
      'Three lengths are 7, 10 and 18. Evaluate a + b − c at a = 7, b = 10, c = 18, where c is '
      + 'the longest. This compares the way round through the third vertex against the way '
      + 'straight along the longest side, so a positive answer is a triangle and a negative one '
      + 'is a route shorter than the straight line, which no route can be. Picking out which of '
      + 'the three is c, and reading what the sign then means, are the two halves this task '
      + 'cannot ask you for.',
    given: 'a + b - c',
    variables: REAL_ABC,
    // 7 + 10 − 18 = −1. Negative, so no triangle: the detour is a unit shorter
    // than the direct route. The sign is the ruling and the magnitude is how
    // far short the two shorter sides fall.
    reference: '-1',
    at: { a: '7', b: '10', c: '18' },
  },
  {
    id: 'the-window-for-a-third-length-1',
    knowledgePointId: 'the-inequality-compares-two-routes',
    kind: 'evaluate',
    prompt:
      'Keep two sides of 7 and 10 and let the third be x. The two conditions give x > 10 − 7 and '
      + 'x < 10 + 7, so the third length lies strictly between b − a and b + a. Evaluate '
      + '(b + a) − (b − a) at a = 7, b = 10 to get how wide that window is. That the b cancels is '
      + 'the content: the window is twice the SHORTER side whatever the longer one is.',
    given: '(b + a) - (b - a)',
    variables: REAL_AB,
    // (10 + 7) − (10 − 7) = 17 − 3 = 14, which is 2 × 7. Identically 2a, so
    // the width depends on the shorter side alone.
    reference: '14',
    at: { a: '7', b: '10' },
  },
  {
    id: 'share-what-the-given-angle-leaves-1',
    knowledgePointId: 'at-most-one-angle-is-not-acute',
    kind: 'evaluate',
    prompt:
      'A triangle has one angle of 110° and the other two are equal. Evaluate (180 − x)/2 at '
      + 'x = 110 to get each of them. The division by 2 is in the expression because the two '
      + 'angles were said to be equal; deciding that the 110 has to come out of the total BEFORE '
      + 'anything is shared is the step this task cannot ask you for.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 110)/2 = 70/2 = 35, and 110 + 35 + 35 = 180.
    reference: '35',
    at: { x: '110' },
  },
  {
    id: 'two-obtuse-angles-overrun-the-total-1',
    knowledgePointId: 'at-most-one-angle-is-not-acute',
    kind: 'evaluate',
    prompt:
      'Now suppose a triangle had TWO angles of 110°. Evaluate 180 − a − b at a = 110, b = 110 '
      + 'to see what the third angle would have to be. Read the answer against '
      + 'third-angle-of-a-triangle-1: the arithmetic is identical and only the inputs moved, '
      + 'which is what makes the impossibility arithmetic rather than a matter of drawing it and '
      + 'seeing that it will not fit.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 110 − 110 = −40. A negative third angle is impossible rather than
    // merely wrong, and 90 + 90 = 180 gives exactly 0 — also impossible, which
    // is why the rule is "at most one of 90° OR MORE" and not "at most one
    // strictly over 90°".
    reference: '-40',
    at: { a: '110', b: '110' },
  },

  // ── plane-geometry: congruence ───────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `congruence`.
  // Everything the two blocks above say applies unchanged — exact rational
  // arithmetic, no worker, every one a proxy that names the decision it stands
  // in for.
  //
  // THE PROXY IS WIDER HERE THAN ANYWHERE ELSE IN THE SUBJECT, and that is
  // the honest thing to write down rather than discover. In the angle concepts
  // the unscorable half was a REASON. Here it is a CORRESPONDENCE: the object
  // the first point is really about is a pairing of vertices, which is not a
  // value and not a `NamedForm`, so no verifiable kind can carry it. So these
  // tasks ask the arithmetic a correspondence licenses ONCE IT HAS BEEN READ,
  // and the reading is unscored — a learner who pairs the vertices wrongly and
  // then subtracts correctly still takes the mark. Naming the criterion is
  // unscorable for the same reason: SSS, SAS and ASA are not values either.
  //
  // What that leaves scorable is worth stating, because it is not nothing: the
  // angle-sum arithmetic is exactly the mechanical step the concept adds, and
  // `aas-completes-to-asa-1` puts it to real work — it checks that an angle
  // computed in ONE triangle equals an angle given in the OTHER, which is the
  // whole of why AAS is not a fourth criterion.
  //
  // Two of these six deliberately echo expressions from the blocks above.
  // `isosceles-base-angles-1` is `(180 − x)/2`, the same expression as
  // `share-what-the-given-angle-leaves-1`, and the repetition IS the content:
  // there the halving was licensed by being TOLD the other two angles were
  // equal, and here it is licensed by the base-angle theorem, derived from a
  // triangle matched with itself. Same arithmetic, one of them earned. The
  // prompts say so and cross-reference each other, because a learner meeting
  // the second one has every right to ask what is new.
  {
    id: 'third-angle-then-carried-across-1',
    knowledgePointId: 'a-congruence-names-a-correspondence',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is congruent to triangle DEF. In ABC the angle at A is 24° and the angle at '
      + 'B is 115°. Evaluate 180 − a − b at a = 24, b = 115 to get the angle at C, which the '
      + 'correspondence then makes equal to the angle at F. Note which half of that this task '
      + 'scores: the subtraction, not the pairing. That F is the letter matching C — rather than '
      + 'D or E — is read off the letter order, and no answer you type here can show you read it '
      + 'correctly.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 24 − 115 = 41, the angle at C and so the angle at F.
    reference: '41',
    at: { a: '24', b: '115' },
  },
  {
    id: 'the-reordered-claim-is-false-1',
    knowledgePointId: 'a-congruence-names-a-correspondence',
    kind: 'evaluate',
    prompt:
      'Same two triangles, where the angle at A is 24° and the angle at E is 115°. Writing "ABC '
      + 'is congruent to EDF" instead pairs A with E, so it demands those two angles be equal. '
      + 'Evaluate a − b at a = 115, b = 24 to test that demand. A difference of 0 would mean the '
      + 'reordering changed nothing; anything else means it made a different claim, and a false '
      + 'one, about the very same pair of triangles.',
    given: 'a - b',
    variables: REAL_AB,
    // 115 − 24 = 91. Non-zero, so the reordered statement is false — about two
    // triangles that genuinely are congruent under the original order.
    reference: '91',
    at: { a: '115', b: '24' },
  },
  {
    id: 'aas-completes-to-asa-1',
    knowledgePointId: 'three-of-the-six-and-aas-is-asa-again',
    kind: 'evaluate',
    prompt:
      'In triangle PQR the angles at P and Q are 73° and 44°. In triangle XYZ the angles at X '
      + 'and Z are 73° and 63°, so the angle at Y is 180 − 73 − 63. The claim is that this '
      + 'recovers the 44° that PQR was given, which is what turns a side and two angles into ASA. '
      + 'Evaluate (180 − a − c) − b at a = 73, c = 63, b = 44. A difference of 0 says the '
      + 'computed angle and the given one are the same angle, so the two triangles hold the same '
      + 'ASA data and AAS was never a fourth criterion.',
    given: '(180 - a - c) - b',
    variables: REAL_ABC,
    // 180 − 73 − 63 = 44, and 44 − 44 = 0. The AAS data for XYZ completes to
    // exactly the ASA data PQR was handed.
    reference: '0',
    at: { a: '73', c: '63', b: '44' },
  },
  {
    id: 'the-third-angle-was-never-free-1',
    knowledgePointId: 'three-of-the-six-and-aas-is-asa-again',
    kind: 'evaluate',
    prompt:
      'Both triangles turn out to have the angles 73°, 44° and 63°. Evaluate (a + b + c) − 180 '
      + 'at a = 73, b = 44, c = 63. A difference of 0 is the angle sum, and here it is making a '
      + 'point about criteria rather than about this triangle: the third angle is forced by the '
      + 'other two, so three angles are really only two independent numbers — and neither of '
      + 'them is a length. That is why AAA cannot be a criterion however much angle data it '
      + 'carries.',
    given: '(a + b + c) - 180',
    variables: REAL_ABC,
    // 73 + 44 + 63 = 180, so 0. Identically 0 for any triangle's angles, which
    // is the dependence that makes AAA offer two numbers rather than three.
    reference: '0',
    at: { a: '73', b: '44', c: '63' },
  },
  {
    id: 'isosceles-base-angles-1',
    knowledgePointId: 'base-angles-by-matching-a-triangle-with-itself',
    kind: 'evaluate',
    prompt:
      'In triangle ABC, AB = AC and the angle at A is 28°. Evaluate (180 − x)/2 at x = 28 to get '
      + 'each of the base angles. Read this against share-what-the-given-angle-leaves-1, which is '
      + 'the identical expression: there you were TOLD the other two angles were equal, and here '
      + 'you were told only that two SIDES are equal. What licenses the division by 2 is the '
      + 'base-angle theorem — matching ABC with ACB and applying SAS — and that derivation is '
      + 'the half this task cannot score.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 28)/2 = 152/2 = 76, and 28 + 76 + 76 = 180. The equality of the
    // two base angles is derived here rather than given, which is the whole
    // difference from the triangle task of the same shape.
    reference: '76',
    at: { x: '28' },
  },
  {
    id: 'the-equilateral-fixed-point-1',
    knowledgePointId: 'base-angles-by-matching-a-triangle-with-itself',
    kind: 'evaluate',
    prompt:
      'Apply the base-angle theorem to a SECOND pair of equal sides and all three angles come '
      + 'out equal, so an equilateral triangle has a definite angle rather than merely three '
      + 'matching ones. Evaluate (180 − x)/2 at x = 60. Getting 60 back is the content: 60° is '
      + 'the one apex angle that equals its own base angles, so it is the only value all three '
      + 'can take at once.',
    given: '(180 - x)/2',
    variables: REAL_X,
    // (180 − 60)/2 = 120/2 = 60. The fixed point of x ↦ (180 − x)/2, which is
    // the equilateral case: 3x = 180 and x = 60 are the same statement.
    reference: '60',
    at: { x: '60' },
  },

  // The similarity tasks pay the same unscorable-half price a fourth time, and
  // the shape of the debt is worth separating from the three above because it
  // is not the same one. In the angle concepts the unscorable half was a
  // REASON; in congruence it was a CORRESPONDENCE. Here it is both at once, and
  // one more besides: what the first point teaches is which three of the six
  // claims a similarity weakens, and "the angles stayed equal and the sides
  // became proportional" is a statement about a claim rather than a value, so
  // no verifiable kind carries it. A learner who believes EF = 9 and then
  // multiplies correctly takes the mark on the task below. That is named in the
  // prompt, as it is in every other block that makes this trade.
  //
  // What IS scorable here is better than it was for congruence, and the second
  // task is why. A reversed letter order produces a FALSE PROPORTION, and a
  // false proportion is two numbers that fail to be equal — which is a value,
  // and is rulable. So `the-reversed-order-is-false-1` scores the very thing
  // the congruence concept could only assert: it is the arithmetic refutation
  // of a misread correspondence, not a proxy for one.
  //
  // Two of these six deliberately echo tasks from the block above, and in both
  // cases the repetition is the content. `aa-completes-both-triples-1` is the
  // same expression as `aas-completes-to-asa-1` and `the-third-angle-was-never-
  // free-1` is cited by `two-angles-are-all-there-ever-were-1`: the angle sum
  // forcing the third angle is one fact that lands in opposite places, killing
  // AAA as a congruence criterion and collapsing AAA into AA for similarity.
  // Asking it twice is how the two verdicts get attached to one piece of
  // arithmetic. The prompts say so and cross-reference by id.
  {
    id: 'the-scale-factor-carried-across-1',
    knowledgePointId: 'a-similarity-loosens-three-of-the-six',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is similar to triangle DEF. In ABC, AB = 6 and BC = 9; in DEF, DE = 10. The '
      + 'matched pair AB and DE fixes the scale factor, and every other matched pair shares it. '
      + 'Evaluate c * a / b at a = 10, b = 6, c = 9 to get EF. Note which half of this task '
      + 'scores: the multiplication, not the reading. That EF is the side matching BC — rather '
      + 'than DE or FD — comes off the letter order, and so does the fact that EF is 5/3 of BC '
      + 'rather than equal to it. Neither is anything your answer here can show you got right.',
    given: 'c * a / b',
    variables: REAL_ABC,
    // 9 × 10/6 = 9 × 5/3 = 15, the side EF. The congruence habit answers 9,
    // which is the error the knowledge point is built to refuse.
    reference: '15',
    at: { a: '10', b: '6', c: '9' },
  },
  {
    id: 'the-reversed-order-is-false-1',
    knowledgePointId: 'a-similarity-loosens-three-of-the-six',
    kind: 'evaluate',
    prompt:
      'Same two triangles, now with all four lengths known: AB = 6 and BC = 9, DE = 10 and '
      + 'EF = 15. FED names the same triangle as DEF, so not one length changes — but "ABC is '
      + 'similar to FED" matches AB with FE and BC with ED instead, and so demands that 6/15 and '
      + '9/10 be the same number. Evaluate a/b - c/x at a = 6, b = 15, c = 9, x = 10 to test that '
      + 'demand. A difference of 0 would mean the reversal changed nothing; anything else means '
      + 'it made a different claim, and a false one, about an unchanged pair of triangles.',
    given: 'a/b - c/x',
    variables: REAL_ABC_X,
    // 6/15 − 9/10 = 2/5 − 9/10 = 4/10 − 9/10 = −1/2. Non-zero, so the reversed
    // statement is false about two triangles that genuinely are similar.
    reference: '-1/2',
    at: { a: '6', b: '15', c: '9', x: '10' },
  },
  {
    id: 'aa-completes-both-triples-1',
    knowledgePointId: 'two-angles-settle-it-and-no-length-is-needed',
    kind: 'evaluate',
    prompt:
      'In triangle ABC the angles at A and B are 52° and 85°. In triangle DEF the angles at D and '
      + 'F are 52° and 43°, so the angle at E is 180 − 52 − 43. The claim is that this recovers '
      + 'the 85° that ABC was given, which is what makes the two triangles similar by AA. '
      + 'Evaluate (180 - a - c) - b at a = 52, c = 43, b = 85. A difference of 0 says the computed '
      + 'angle and the given one are the same angle, so the two triangles have the same three '
      + 'angles and the correspondence is forced. This is the identical expression to '
      + 'aas-completes-to-asa-1 in the congruence concept — the same completion of an angle '
      + 'triple, reused here to settle a similarity rather than a congruence.',
    given: '(180 - a - c) - b',
    variables: REAL_ABC,
    // 180 − 52 − 43 = 85, and 85 − 85 = 0. DEF's third angle is exactly the one
    // ABC was handed, so both triangles carry 52°, 85° and 43°.
    reference: '0',
    at: { a: '52', c: '43', b: '85' },
  },
  {
    id: 'two-angles-are-all-there-ever-were-1',
    knowledgePointId: 'two-angles-settle-it-and-no-length-is-needed',
    kind: 'evaluate',
    prompt:
      'Evaluate 180 - a - b at a = 52, b = 85 to get the third angle of ABC. The value is not the '
      + 'point — that it was computable at all is. Naming a third angle adds no information to '
      + 'two, which is why AA and AAA are one criterion and nobody writes AAA for similarity. '
      + 'Read this against the-third-angle-was-never-free-1, which asserts the same dependence as '
      + 'a difference of zero: there it is the reason AAA cannot be a CONGRUENCE criterion, since '
      + 'three angles are two independent numbers and neither is a length. One fact, two opposite '
      + 'verdicts, and the difference is only whether size was being asked for.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 52 − 85 = 43, the angle at C. Also the expression of
    // third-angle-then-carried-across-1 at different inputs: that task carries a
    // computed angle across a congruence, this one shows it was never free.
    reference: '43',
    at: { a: '52', b: '85' },
  },
  {
    id: 'the-down-ratio-is-one-number-1',
    knowledgePointId: 'the-same-proportion-read-across-or-down',
    kind: 'evaluate',
    prompt:
      'Triangle ABC is similar to triangle DEF, with AB = 8, BC = 14, DE = 20 and so EF = 35. '
      + 'Rearranging AB/DE = BC/EF gives AB/BC = DE/EF, a ratio taken inside each triangle rather '
      + 'than between them. Evaluate a/b - c/x at a = 8, b = 14, c = 20, x = 35 to compare the '
      + 'two. A difference of 0 says both triangles give the same number — and note that number '
      + 'is 4/7, not the scale factor 5/2: these are two different ratios measuring two different '
      + 'things, which is the confusion this point exists to separate.',
    given: 'a/b - c/x',
    variables: REAL_ABC_X,
    // 8/14 − 20/35 = 4/7 − 4/7 = 0. Guaranteed by the rearrangement before
    // either side is computed, which is why the equality is the content and the
    // arithmetic is only the instance.
    reference: '0',
    at: { a: '8', b: '14', c: '20', x: '35' },
  },
  {
    id: 'the-down-ratio-survives-scaling-1',
    knowledgePointId: 'the-same-proportion-read-across-or-down',
    kind: 'evaluate',
    prompt:
      'Scale DEF again, by a factor of 3: its sides DE = 20 and EF = 35 become 60 and 105. '
      + 'Evaluate (a*x)/(b*x) at a = 20, b = 35, x = 3. Getting 4/7 back — the same value the '
      + 'unscaled triangle gave — is the content: the factor cancels top and bottom, so a ratio '
      + 'of two sides of one figure cannot see how big the figure is. The scale factor has no such '
      + 'protection; it would have gone from 5/2 to 15/2. That is why a ratio of two sides is a '
      + 'function of the angles alone, and so why it can be tabulated against an angle at all.',
    given: '(a*x)/(b*x)',
    variables: REAL_ABX,
    // (20 × 3)/(35 × 3) = 60/105 = 4/7, which is 20/35 unchanged. The x cancels
    // for every non-zero x, so this is the invariance rather than one instance
    // of it.
    reference: '4/7',
    at: { a: '20', b: '35', x: '3' },
  },

  // ── pythagoras ──────────────────────────────────────────────────────────
  //
  // Six tasks, and the first in this subject that is not an `evaluate`.
  //
  // THE PROXY PROBLEM IS MILDER HERE THAN ANYWHERE ELSE IN THE SUBJECT, which
  // is worth saying after four blocks of apologia above. The four concepts
  // before this one are about correspondences and criteria, and neither is a
  // value, so their tasks all score arithmetic standing in for a reading. This
  // concept's content is a relation between three numbers, so most of it IS a
  // value and most of these tasks score the thing itself.
  //
  // What is still unscored is the slot assignment, and it is unscored in the
  // same way and for the same reason: which of three lengths is the hypotenuse
  // is a decision, not a value, and a learner who assigns it wrongly and then
  // computes correctly takes the mark. The first pair is built to make that
  // decision as visible as a task can — same two inputs, two different
  // expressions, two answers — but the choosing is still the learner's and the
  // ruling cannot see it. Named in both prompts, as everywhere else here.
  //
  // THE SURD TASK IS THE ONE REAL GAIN, and it was checked before the material
  // was written rather than hoped for. `transform_to_form` with `surd_reduced`
  // rules locally — `asSurd` in numerals.ts normalises both sides, so no CAS is
  // consulted — which keeps this subject's no-worker contract intact while
  // asking the second point's actual question. An `evaluate` could not have
  // asked it at all: `exactValue` returns null on √180, correctly, since there
  // is no exact rational to return.
  {
    id: 'the-leg-is-a-subtraction-1',
    knowledgePointId: 'the-hypotenuse-is-not-one-of-three-equals',
    kind: 'evaluate',
    prompt:
      'A right triangle has a hypotenuse of 25 and one leg of 7. Because the hypotenuse is the '
      + 'side that is KNOWN here, the relation is used in its subtracting direction: the missing '
      + 'leg is √(25² − 7²). Evaluate sqrt(b^2 - a^2) at a = 7, b = 25. Note which half of this '
      + 'task scores — the arithmetic, not the decision. That 25 goes in the b slot rather than '
      + 'the a slot is the whole content of the knowledge point, and it was handed to you in this '
      + 'prompt rather than left for you to get right. Compare your answer with '
      + 'the-same-two-numbers-the-other-way-1, which gives these two numbers the other roles.',
    given: 'sqrt(b^2 - a^2)',
    variables: REAL_AB,
    // 25² − 7² = 625 − 49 = 576, and √576 = 24 exactly, so 7, 24, 25. A perfect
    // square on purpose: this task is about the direction of the rearrangement,
    // and an irrational answer would have moved the difficulty to the root.
    reference: '24',
    at: { a: '7', b: '25' },
  },
  {
    id: 'the-same-two-numbers-the-other-way-1',
    knowledgePointId: 'the-hypotenuse-is-not-one-of-three-equals',
    kind: 'evaluate',
    prompt:
      'Same two numbers, 7 and 25, but now both of them are LEGS of a right triangle and the '
      + 'hypotenuse is what is missing. So the relation is used in its adding direction instead. '
      + 'Evaluate a^2 + b^2 at a = 7, b = 25 to get the square of that hypotenuse. Read the answer '
      + 'against the 576 that the-leg-is-a-subtraction-1 produced from the same two inputs: the '
      + 'gap between them is what one decision about which length is the hypotenuse is worth, and '
      + 'it is larger than the smaller of the two sides. This task stops at the square — taking '
      + 'the root is the next point, and this root is irrational.',
    given: 'a^2 + b^2',
    variables: REAL_AB,
    // 49 + 625 = 674, against 576 from the task above. 674 − 576 = 98 = 2 × 7².
    // The root is √674 = √(2 × 337) with 337 prime, so it does not reduce —
    // which is why this task asks for the square and the next point takes roots.
    reference: '674',
    at: { a: '7', b: '25' },
  },
  {
    id: 'reduce-the-hypotenuse-surd-1',
    knowledgePointId: 'a-length-is-the-positive-root-and-usually-a-surd',
    kind: 'transform_to_form',
    prompt:
      'A right triangle has legs 6 and 12, so the square of its hypotenuse is 36 + 144 = 180 and '
      + 'the hypotenuse itself is √180. Give that length exactly, with nothing left under the '
      + 'radical that need not be there — a whole number times a smaller root. A decimal is a '
      + 'rounding of this length rather than the length.',
    given: 'sqrt(180)',
    form: 'surd_reduced',
    variables: [],
    // 180 = 36 × 5 with 36 = 6², so 6√5, and 5 is square-free so nothing further
    // comes out. Ruled by `asSurd`'s normal form with no worker: correct for
    // 6*sqrt(5), incorrect for an unreduced sqrt(180), naming the square 36.
    //
    // Different numbers from `simplify-a-surd-1` in roots-and-irrationals
    // (1008 = 12√7) and from that concept's worked example (720 = 12√5), so
    // this is not a recall of either — and here the radicand was PRODUCED by
    // Pythagoras rather than handed over.
    reference: '6*sqrt(5)',
  },
  {
    id: 'the-rational-hypotenuse-is-the-exception-1',
    knowledgePointId: 'a-length-is-the-positive-root-and-usually-a-surd',
    kind: 'evaluate',
    prompt:
      'Change one leg: a right triangle with legs 9 and 12. Evaluate sqrt(a^2 + b^2) at a = 9, '
      + 'b = 12. The answer is a whole number, and that is the rare case rather than the normal '
      + 'one — it happens only when the two squares add to a square, which is what makes these '
      + 'three lengths a Pythagorean triple. Read it against reduce-the-hypotenuse-surd-1, where '
      + 'legs 6 and 12 gave 6√5: the same operation on a comparable pair of legs, and only one of '
      + 'the two answers can be written without a radical.',
    given: 'sqrt(a^2 + b^2)',
    variables: REAL_AB,
    // 81 + 144 = 225 = 15², so exactly 15 and the triangle is 9, 12, 15 — the
    // 3-4-5 triple scaled by three. Rational on purpose, as the counterpart to
    // the surd task above; `exactValue` settles it with no worker.
    reference: '15',
    at: { a: '9', b: '12' },
  },
  {
    id: 'the-converse-as-a-difference-1',
    knowledgePointId: 'the-converse-tests-a-triple-and-the-sign-grades-it',
    kind: 'evaluate',
    prompt:
      'Three lengths, 9, 40 and 41, and no figure. The largest is 41, so that is the only side a '
      + 'right angle could be opposite. Evaluate a^2 + b^2 - c^2 at a = 9, b = 40, c = 41. A '
      + 'difference of 0 says the two smaller squares add to exactly the largest, so there is a '
      + 'right angle opposite 41; anything else says there is not. Written as a difference rather '
      + 'than as an equation to check, because the next task needs its sign.',
    given: 'a^2 + b^2 - c^2',
    variables: REAL_ABC,
    // 81 + 1600 − 1681 = 0. A right triangle, and a Pythagorean triple.
    // Mis-slotted as 9² + 41² − 40² it gives 1762 − 1600 = 162 — correct
    // arithmetic, wrong verdict, which is the error the first point is about and
    // which no ruling here can distinguish from a genuine answer.
    reference: '0',
    at: { a: '9', b: '40', c: '41' },
  },
  {
    id: 'the-sign-says-obtuse-1',
    knowledgePointId: 'the-converse-tests-a-triple-and-the-sign-grades-it',
    kind: 'evaluate',
    prompt:
      'Now shorten the smallest length by one and leave the other two: 8, 40 and 41. Evaluate '
      + 'a^2 + b^2 - c^2 at a = 8, b = 40, c = 41. The same expression as '
      + 'the-converse-as-a-difference-1 and the SIGN of the answer is the ruling, not its size: '
      + 'zero would be a right angle, positive means the angle opposite 41 is acute, negative '
      + 'means it is obtuse. These three lengths still make a triangle — 8 + 40 exceeds 41 — so '
      + 'the triangle inequality admits them and this test is what tells you what kind of triangle '
      + 'they admit.',
    given: 'a^2 + b^2 - c^2',
    variables: REAL_ABC,
    // 64 + 1600 − 1681 = −17. Negative, so the smaller squares fall short and the
    // angle opposite 41 is obtuse. The same expression at a = 10 gives
    // 1700 − 1681 = +19 and an acute angle, which the worked example states but
    // no task asks — two of the three signs are enough to show it is the sign
    // that rules.
    reference: '-17',
    at: { a: '8', b: '40', c: '41' },
  },

  // ── quadrilaterals-and-polygons ─────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of
  // `quadrilaterals-and-polygons`. Exact rational arithmetic, no worker, as
  // everywhere else in this subject.
  //
  // THE PROXY PROBLEM IS MILDER HERE THAN IN ANY OF THE FIVE BLOCKS ABOVE,
  // and that is worth saying plainly rather than repeating an apology that no
  // longer fits. Two of the three points are about values. "How many sides"
  // IS a number, so the first task is the whole computation rather than a
  // stand-in for one. "Are the four angles equal" is a difference of two
  // numbers, so the fifth task REFUTES the equiangular reading arithmetically
  // — the gain `the-reversed-order-is-false-1` made for similarity, in a
  // second concept.
  //
  // What is still unscored is one decision, and it is the first subgoal of the
  // first worked example: which of the two totals to work in. A learner handed
  // "evaluate 360/(180 − x)" has been given that choice rather than asked to
  // make it, and no answer typed into this task can show they would have
  // chosen it. Named in the prompt, as in every block above.
  //
  // Two of these six echo expressions from earlier blocks and in both cases
  // the repetition is the content. `co-interior-across-the-parallel-pair-1` is
  // `180 - x`, the same expression as `co-interior-remainder-1` in the
  // transversal point, because a parallelogram's adjacent angles ARE that
  // co-interior pair — the same subtraction, now with the strip closed into a
  // figure. And the last pair is one expression at two inputs, exactly as
  // `isosceles-base-angles-1` and `the-equilateral-fixed-point-1` are: there
  // the fixed point was the equilateral triangle, here it is the square, and
  // the difference between the two cases is the whole third knowledge point.
  {
    id: 'exterior-angle-counts-the-sides-1',
    knowledgePointId: 'two-totals-and-only-one-grows-with-n',
    kind: 'evaluate',
    prompt:
      'A regular polygon has interior angles of 156°. Evaluate 360/(180 − x) at x = 156. The '
      + 'subtraction is the straight-line sum at one vertex, turning the interior angle there into '
      + 'the exterior angle; the division shares out the one total that does not depend on how '
      + 'many sides there are. Note which half of the problem this scores: the arithmetic, not the '
      + 'route. That the question is asked through the exterior angle rather than through '
      + '(n − 2) × 180 ÷ n is the content of the knowledge point, and this prompt has handed it to '
      + 'you already made.',
    given: '360/(180 - x)',
    variables: REAL_X,
    // 180 − 156 = 24 and 360/24 = 15, so a regular 15-gon. Checked the other
    // way in the worked example: (15 − 2) × 180 = 2340 and 2340/15 = 156.
    reference: '15',
    at: { x: '156' },
  },
  {
    id: 'the-exterior-total-never-moves-1',
    knowledgePointId: 'two-totals-and-only-one-grows-with-n',
    kind: 'evaluate',
    prompt:
      'The two angles at each vertex of a polygon lie along a straight line, so the n vertices '
      + 'contribute 180° each to the two totals TOGETHER: they come to n × 180 between them, and '
      + 'the interior total is (n − 2) × 180. Evaluate x*180 − (x − 2)*180 at x = 15 to get what '
      + 'is left over for the exterior angles. The answer is 360, and the point is that it would '
      + 'have been 360 for any x you were handed — the expression is identically 360, which is the '
      + 'whole reason one total grows with the number of sides and the other does not.',
    given: 'x*180 - (x - 2)*180',
    variables: REAL_X,
    // 15·180 − 13·180 = 2700 − 2340 = 360. Identically 360 for every x, since
    // the two multiples of 180 differ by 2 whatever x is — which is the claim,
    // and this evaluates one instance of it.
    reference: '360',
    at: { x: '15' },
  },
  {
    id: 'co-interior-across-the-parallel-pair-1',
    knowledgePointId: 'a-diagonal-makes-two-triangles-that-match',
    kind: 'evaluate',
    prompt:
      'ABCD is a parallelogram and the angle at A is 64°. AD and BC are parallel and AB crosses '
      + 'both of them, so the angles at A and at B are the co-interior pair and add to 180°. '
      + 'Evaluate 180 − x at x = 64 to get the angle at B. This is the one step of the worked '
      + 'example that produces a NUMBER — the congruence before it says which angles are equal to '
      + 'which and nothing about their size, and no answer typed here can show you read that '
      + 'correspondence the right way round. Compare co-interior-remainder-1 in the transversal '
      + 'point: the same subtraction on the same fact, before the strip was closed into a figure.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 64 = 116. The correspondence then spreads it: D = B = 116 and
    // C = A = 64, and 64 + 116 + 64 + 116 = 360 = (4 − 2) × 180.
    reference: '116',
    at: { x: '64' },
  },
  {
    id: 'the-four-angles-are-two-angles-twice-1',
    knowledgePointId: 'a-diagonal-makes-two-triangles-that-match',
    kind: 'evaluate',
    prompt:
      'The congruence makes a parallelogram\'s angles equal in opposite pairs, so the four of them '
      + 'are a, b, a and b. Evaluate 2a + 2b − 360 at a = 64, b = 116. A difference of 0 says '
      + 'those four close the quadrilateral — and the 360 is the first point\'s (n − 2) × 180 at '
      + 'n = 4, so this is the polygon total being used rather than a separate fact about '
      + 'quadrilaterals. It is NOT identically zero: it is zero exactly when b is 180 − a, which '
      + 'is what the co-interior pair gave, so a learner who used the wrong angle at B does not '
      + 'get a free 0 here.',
    given: '2*a + 2*b - 360',
    variables: REAL_AB,
    // 128 + 232 − 360 = 0. At b = 117 it is +2, so the task can fail — which
    // is what separates it from the identities elsewhere in this subject.
    reference: '0',
    at: { a: '64', b: '116' },
  },
  {
    id: 'equal-sides-left-the-angles-unequal-1',
    knowledgePointId: 'equal-sides-force-equal-angles-only-in-a-triangle',
    kind: 'evaluate',
    prompt:
      'ABCD is a rhombus — all four sides equal — with the angle at A equal to 64°, so its angles '
      + 'are 64°, 116°, 64°, 116°. Evaluate (180 − x) − x at x = 64 to compare two ADJACENT ones. '
      + 'Anything other than 0 says the four equal sides did not make the four angles equal, which '
      + 'is exactly what equal sides DO force in a triangle by the base-angle theorem. Read it '
      + 'against the-square-is-the-only-fixed-point-1, which is this same expression at the one '
      + 'value where the difference vanishes.',
    given: '(180 - x) - x',
    variables: REAL_X,
    // 116 − 64 = 52. Non-zero, so an equilateral quadrilateral need not be
    // equiangular — the refutation the third knowledge point is built on, and
    // a value rather than a reading, so the ruling scores the claim itself.
    reference: '52',
    at: { x: '64' },
  },
  {
    id: 'the-square-is-the-only-fixed-point-1',
    knowledgePointId: 'equal-sides-force-equal-angles-only-in-a-triangle',
    kind: 'evaluate',
    prompt:
      'The same expression, at x = 90. Evaluate (180 − x) − x at x = 90. Getting 0 is the content: '
      + '90° is the one angle a rhombus can have and be equal-angled as well as equal-sided, so '
      + 'the square is the single quadrilateral where those two claims coincide. Read it against '
      + 'the-equilateral-fixed-point-1 in congruence, which is the same kind of question with the '
      + 'opposite answer — there EVERY equal-sided triangle satisfies the matching condition, and '
      + 'here exactly one equal-sided quadrilateral does.',
    given: '(180 - x) - x',
    variables: REAL_X,
    // 90 − 90 = 0, and it is the only root of 180 − 2x, so the square is the
    // only equiangular rhombus. At 64 the same expression is 52, which is the
    // task above — one expression, two inputs, two verdicts.
    reference: '0',
    at: { x: '90' },
  },

  // ── area-and-perimeter ──────────────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of
  // `area-and-perimeter`. Exact rational arithmetic, no worker, as everywhere
  // else in this subject.
  //
  // THE PROXY PROBLEM DOES NOT ARISE HERE, which is the first time that can be
  // said in this file and is a property of the concept rather than of the asks.
  // Both of the concept's measures are numbers: "how much is left" is a value,
  // "how far round" is a value, and the claim the third point is built on — that
  // neither decides the other — is settled by comparing two of them. So every
  // one of these six asks what its knowledge point is about. The one step that
  // stays unscored is small and is the first subgoal of the first example:
  // which of the two measures the question wants. A learner handed
  // "evaluate a*b − c*d" has been told it is an area. Named in the prompts.
  //
  // Two of the six echo expressions from earlier blocks and in both cases the
  // repetition is the content, which is this subject's habit by now.
  // `the-notch-cancels-out-of-the-corner-perimeter-1` is identically 2(a + b),
  // so it answers 32 for a corner piece of any size — the shape of
  // `the-exterior-total-never-moves-1` in a second concept. And
  // `equal-perimeters-left-the-areas-unequal-1` is `a*b - c*d`, the same
  // expression as the first task below, doing the opposite job: there it is one
  // region's area and here it is the difference between two areas whose
  // perimeters are equal, so anything other than 0 refutes "equal round means
  // equal inside". That is the arithmetic refutation
  // `equal-sides-left-the-angles-unequal-1` made for the polygons, in a third
  // concept.
  {
    id: 'the-cut-is-a-subtraction-1',
    knowledgePointId: 'additivity-turns-a-cut-into-a-subtraction',
    kind: 'evaluate',
    prompt:
      'A rectangular sheet 10 cm by 6 cm has a rectangular piece 4 cm by 3 cm cut out of it. '
      + 'Evaluate a*b − c*d at a = 10, b = 6, c = 4, d = 3 to get the area of what is left, in '
      + 'square centimetres. The first product is the sheet and the second is the piece, and the '
      + 'subtraction is additivity read backwards: the piece and the remainder add to the whole, '
      + 'so the remainder is the whole less the piece. Note what the expression does NOT contain, '
      + 'which is the content of the point — nothing in it says where on the sheet the piece was '
      + 'cut from. Note also which half of the problem this scores: that the answer wanted is an '
      + 'area rather than a perimeter is the first decision in the problem, and this prompt has '
      + 'handed it to you already made.',
    given: 'a*b - c*d',
    variables: REAL_ABCD,
    // 60 − 12 = 48. Checked the other way in the worked example and in the
    // task below: the same region assembled out of its two rectangles, 36 + 12.
    reference: '48',
    at: { a: '10', b: '6', c: '4', d: '3' },
  },
  {
    id: 'additivity-forwards-gives-the-same-area-1',
    knowledgePointId: 'additivity-turns-a-cut-into-a-subtraction',
    kind: 'evaluate',
    prompt:
      'The same cut sheet as the task above, if the piece came out of a corner: it is then two '
      + 'rectangles, one 6 cm by 6 cm and one 4 cm by 3 cm. Evaluate a*b + c*d at a = 6, b = 6, '
      + 'c = 4, d = 3 to get its area by assembling it instead of cutting it. Getting 48 again is '
      + 'the point rather than the arithmetic: additivity read forwards adds the pieces of a '
      + 'region and read backwards turns a removal into a subtraction, and the two routes have to '
      + 'agree or it is not a measure. Read it against the-cut-is-a-subtraction-1, which is the '
      + 'same region by the other route.',
    given: 'a*b + c*d',
    variables: REAL_ABCD,
    // 36 + 12 = 48, the same number the subtraction above gives. The split is
    // the honest one for a corner cut: cutting the remainder vertically 6 cm
    // from the uncut side leaves a full-height 6 by 6 and a 4 by 3 beside it.
    reference: '48',
    at: { a: '6', b: '6', c: '4', d: '3' },
  },
  {
    id: 'halve-the-matched-pair-1',
    knowledgePointId: 'a-height-belongs-to-one-base-and-is-usually-no-side',
    kind: 'evaluate',
    prompt:
      'A triangle has sides 13 cm, 14 cm and 15 cm, and the perpendicular height to the 14 cm '
      + 'side is 12 cm. Evaluate a*b/2 at a = 14, b = 12 to get its area in square centimetres. '
      + 'The two inputs are the matched pair — a base and the height belonging to THAT base — and '
      + 'the 13 and the 15 are not in the expression at all. The halving is the step taken as '
      + 'given: two copies of the triangle make a parallelogram on the same base and height. What '
      + 'this scores is the arithmetic and not the pairing: a learner who takes 13 as the height '
      + 'and evaluates the same expression gets 91 and is wrong, but nothing typed here shows '
      + 'which of the four given lengths you believed belonged together.',
    given: 'a*b/2',
    variables: REAL_AB,
    // 14 · 12 / 2 = 84. Heron on 13, 14, 15: s = 21 and
    // √(21 · 8 · 7 · 6) = √7056 = 84, so the height is really 2 · 84 / 14 = 12.
    reference: '84',
    at: { a: '14', b: '12' },
  },
  {
    id: 'the-same-area-off-a-second-base-1',
    knowledgePointId: 'a-height-belongs-to-one-base-and-is-usually-no-side',
    kind: 'evaluate',
    prompt:
      'The same triangle on a different base. Evaluate a*b/2 at a = 13, b = 168/13 — the 13 cm '
      + 'side, with the height belonging to it. Getting 84 again is the content: the area is a '
      + 'property of the triangle and the three matched pairs are three ways of reading off one '
      + 'number, not three measurements. The height is a fraction and does not need to be '
      + 'anything else; it is also less than both 14 and 15, as the shortest-route fact requires. '
      + 'Read it against halve-the-matched-pair-1, which is the same expression at the other pair.',
    given: 'a*b/2',
    variables: REAL_AB,
    // 13 · (168/13) / 2 = 168/2 = 84. Exact, and deliberately not an integer
    // height: ½ · 13 · h = 84 forces h = 168/13 ≈ 12.92.
    reference: '84',
    at: { a: '13', b: '168/13' },
  },
  {
    id: 'the-notch-cancels-out-of-the-corner-perimeter-1',
    knowledgePointId: 'neither-measure-decides-the-other',
    kind: 'evaluate',
    prompt:
      'A 10 cm by 6 cm sheet has a 4 cm by 3 cm piece cut out of one CORNER. Walking the boundary '
      + 'of what is left gives (a − c) + (b − d) + c + d + a + b: the two outer edges shortened by '
      + 'the cut, then the notch\'s two new edges, then the two edges it did not touch. Evaluate '
      + 'it at a = 10, b = 6, c = 4, d = 3. The answer is 32, which is the perimeter of the UNCUT '
      + 'sheet — and the point is that it would have been 2(a + b) for a corner piece of any size, '
      + 'since the c and the d cancel. A cut that removes area and leaves the perimeter alone is '
      + 'half of the reason neither measure decides the other.',
    given: '(a - c) + (b - d) + c + d + a + b',
    variables: REAL_ABCD,
    // 6 + 3 + 4 + 3 + 10 + 6 = 32, and the expression is identically 2(a + b),
    // which is the claim rather than a coincidence of these four numbers. The
    // same piece taken from the middle of a 10 cm edge gives 38, because both
    // of its 3 cm sides are added with nothing removed to pay for them.
    reference: '32',
    at: { a: '10', b: '6', c: '4', d: '3' },
  },
  {
    id: 'equal-perimeters-left-the-areas-unequal-1',
    knowledgePointId: 'neither-measure-decides-the-other',
    kind: 'evaluate',
    prompt:
      'A 10 cm by 6 cm rectangle and a 15 cm by 1 cm rectangle both have perimeter 32 cm, since '
      + '2 × (10 + 6) = 2 × (15 + 1). Evaluate a*b − c*d at a = 10, b = 6, c = 15, d = 1 to '
      + 'compare their areas. Anything other than 0 says equal perimeters did not make the areas '
      + 'equal, which is the other direction of the third point — the first is two regions of '
      + 'equal area whose perimeters differ. Read it against the-cut-is-a-subtraction-1, which is '
      + 'this same expression measuring one region rather than the gap between two.',
    given: 'a*b - c*d',
    variables: REAL_ABCD,
    // 60 − 15 = 45. Non-zero, so a perimeter does not decide an area — a value
    // rather than a reading, so the ruling scores the claim itself. It is NOT
    // identically non-zero: at c = 12, d = 5 it is 0, two rectangles of equal
    // area, so a learner cannot score this by typing any number at all.
    reference: '45',
    at: { a: '10', b: '6', c: '15', d: '1' },
  },

  // ── geometric-proof ─────────────────────────────────────────────────────
  //
  // Six more `evaluate` tasks, across the three points of `geometric-proof`.
  // Exact rational arithmetic, no worker, as everywhere else in this subject.
  //
  // THIS BLOCK IS THE ANSWER TO AN OBJECTION, AND THE OBJECTION IS WHY THE
  // CONCEPT WAS TWICE LEFT ON THE MAP. `justify` is the natural kind for a node
  // about proof; it is declared unverifiable in types.ts; the suite refuses to
  // ship any unverifiable kind; so a justify-only concept has no tasks at all,
  // and a knowledge point with no task is a chain that cannot become evidence.
  // Three of those was correctly judged worse than leaving the node mapped.
  // ontology-geometry.ts argues the way out at length — the figure-free part of
  // a proof node is the part that is a CLAIM ABOUT CLAIMS, and a claim about
  // claims is refuted by a value — and these six are what that produces.
  //
  // THE PROXY PROBLEM IS THE WIDEST IN THE SUBJECT IN ONE PLACE AND NARROWEST
  // IN ANOTHER, which is unusual enough to be worth the paragraph.
  //
  // Widest in the first point. What that point teaches is the ORDER of three
  // citations, and an order is not a value — so the task hands over the composed
  // expression and scores the arithmetic of a chain the learner did not have to
  // build. That is the congruence block's correspondence problem in a second
  // form, and it is named in both prompts. What makes it better than that
  // precedent is that the composite form is itself the content: the given is
  // written as 180 − 2*(180 − x) rather than as the equivalent 2x − 180, so the
  // expression a learner reads is the three cited facts in the order they were
  // cited, and the simplification is the theorem the chain proves.
  //
  // Narrowest in the second and third. "A difference of 0 licenses nothing and a
  // difference of 1 proves non-congruence" is a statement about two values, and
  // the values are the whole claim rather than a stand-in for it; the same goes
  // for an angle sum that disqualifies a proposed counterexample. Those four
  // tasks score what their points are about with nothing held back.
  //
  // `counterexample` is the kind the third point really wants and it carries no
  // tasks anywhere in the build, for the reason at the top of this file. So the
  // refutation is asked as the two values it reduces to. That is the one real
  // gap in this block and the concept's third objective says so rather than
  // naming a kind it cannot serve.
  //
  // Two of the six echo expressions from earlier blocks, which is this subject's
  // habit by now, and in both cases the repetition is the content.
  // `one-acute-exterior-angle-ends-the-claim-1` is `180 - x`, the same
  // expression as `co-interior-remainder-1` and
  // `co-interior-across-the-parallel-pair-1` — the straight-line subtraction,
  // here deciding a universal claim rather than filling in a figure. And
  // `a-candidate-that-is-not-a-triangle-refutes-nothing-1` is
  // `(a + b + c) - 180`, the same expression as `the-third-angle-was-never-
  // free-1` in `congruence`, doing the opposite job: there it is identically 0
  // and that makes a point about criteria, here it is non-zero and that
  // disqualifies an object from being a counterexample at all.
  {
    id: 'chain-the-three-cited-facts-1',
    knowledgePointId: 'a-proof-cites-facts-already-established',
    kind: 'evaluate',
    prompt:
      'In triangle ABC, AB = AC. CB is extended beyond B to D, and the angle ABD is 140°. '
      + 'Evaluate 180 − 2*(180 − x) at x = 140 to get the angle at A. The expression is the proof '
      + 'written out: the inner subtraction is the straight line turning the given exterior angle '
      + 'into the interior angle at B, the doubling is the base-angle theorem making the angle at '
      + 'C equal to it, and the outer subtraction is the angle sum closing the triangle. It is '
      + 'deliberately NOT written as the equivalent 2x − 180, because that form is the theorem and '
      + 'this form is the argument. Note which half of the problem this scores: the arithmetic, '
      + 'not the order. That those three facts are the ones to cite, and in that sequence, is the '
      + 'content of the knowledge point, and this prompt has handed it to you already assembled.',
    given: '180 - 2*(180 - x)',
    variables: REAL_X,
    // 180 − 140 = 40 at B, so 40 at C by the base angles, and
    // 180 − 40 − 40 = 100 at A. Checked the other way: the simplified form
    // 2x − 180 at x = 140 is 280 − 180 = 100. The expression is an angle of a
    // real triangle only for x > 90 — at x = 90 it returns 0 — which is the
    // chain stating its own hypothesis.
    reference: '100',
    at: { x: '140' },
  },
  {
    id: 'the-same-chain-from-a-second-exterior-angle-1',
    knowledgePointId: 'a-proof-cites-facts-already-established',
    kind: 'evaluate',
    prompt:
      'The same triangle and the same chain, with the exterior angle at B given as 110° instead. '
      + 'Evaluate 180 − 2*(180 − x) at x = 110. Getting a different answer from the task above is '
      + 'the point rather than the arithmetic: nothing in the chain was rebuilt, so the '
      + 'conclusion was forced by the citations and not by the first set of numbers — which is '
      + 'what makes it a proof about every triangle with those givens rather than a measurement '
      + 'of one. Read it against chain-the-three-cited-facts-1, which is the same expression at '
      + 'the other input.',
    given: '180 - 2*(180 - x)',
    variables: REAL_X,
    // 180 − 110 = 70 at B and at C, and 180 − 70 − 70 = 40 at A, so
    // 40 + 70 + 70 = 180. The simplified form 2x − 180 at x = 110 is also 40.
    reference: '40',
    at: { x: '110' },
  },
  {
    id: 'the-equal-total-settles-nothing-1',
    knowledgePointId: 'a-converse-is-a-new-claim-and-a-contrapositive-is-not',
    kind: 'evaluate',
    prompt:
      'It is proved that congruent triangles have equal perimeters. Triangle ABC has sides 5 cm, '
      + '9 cm and 10 cm, and triangle PQR has 6 cm, 8 cm and 10 cm. Evaluate '
      + '(a + b + c) − (d + e + f) at a = 5, b = 9, c = 10, d = 6, e = 8, f = 10 to compare their '
      + 'perimeters. A difference of 0 is the CONVERSE\'s hypothesis holding, and the converse is '
      + 'not the proved statement — so 0 is precisely the value that licenses nothing. These two '
      + 'are in fact not congruent, since a congruence would make all three sides match and '
      + '{5, 9, 10} is not {6, 8, 10}. Read it against the-unequal-total-settles-it-1, which is '
      + 'the same expression returning a verdict instead of a shrug.',
    given: '(a + b + c) - (d + e + f)',
    variables: REAL_ABCDEF,
    // 24 − 24 = 0. Both triples close: 5 + 9 = 14 > 10 and 6 + 8 = 14 > 10, so
    // both are real triangles and the pair is a genuine counterexample to the
    // converse rather than an arithmetic trick.
    reference: '0',
    at: { a: '5', b: '9', c: '10', d: '6', e: '8', f: '10' },
  },
  {
    id: 'the-unequal-total-settles-it-1',
    knowledgePointId: 'a-converse-is-a-new-claim-and-a-contrapositive-is-not',
    kind: 'evaluate',
    prompt:
      'The same proved statement, on triangle PQR with sides 6 cm, 8 cm and 10 cm against '
      + 'triangle XYZ with 6 cm, 8 cm and 11 cm. Evaluate (a + b + c) − (d + e + f) at a = 6, '
      + 'b = 8, c = 10, d = 6, e = 8, f = 11. Anything other than 0 proves these two are not '
      + 'congruent, and that conclusion is the CONTRAPOSITIVE — the proved statement rearranged, '
      + 'with nothing new proved to get it. One expression, two inputs, and the difference '
      + 'between the two verdicts is the whole knowledge point: a converse has to be earned and a '
      + 'contrapositive comes free.',
    given: '(a + b + c) - (d + e + f)',
    variables: REAL_ABCDEF,
    // 24 − 25 = −1. Non-zero, so not congruent, by the contrapositive alone.
    // Both triples close: 6 + 8 = 14 exceeds 10 and 11 alike. The sign carries
    // no meaning here beyond "not equal", which is why the task is a difference
    // rather than a comparison.
    reference: '-1',
    at: { a: '6', b: '8', c: '10', d: '6', e: '8', f: '11' },
  },
  {
    id: 'one-acute-exterior-angle-ends-the-claim-1',
    knowledgePointId: 'one-counterexample-settles-it-if-it-meets-the-hypothesis',
    kind: 'evaluate',
    prompt:
      'Somebody claims that every exterior angle of a triangle is obtuse. Take the triangle with '
      + 'angles 100°, 40° and 40°, and evaluate 180 − x at x = 100 to get the exterior angle at '
      + 'its largest vertex. An answer below 90 refutes the claim outright, because the claim was '
      + 'made of EVERY exterior angle and one failure is enough. The other two vertices of this '
      + 'same triangle give 140° each, both obtuse, and they add nothing at all — a universal '
      + 'claim is not partly true once it has failed once, and that asymmetry between refuting '
      + 'and confirming is why proof exists. Compare co-interior-remainder-1: the same '
      + 'subtraction, there filling in a figure and here deciding a claim.',
    given: '180 - x',
    variables: REAL_X,
    // 180 − 100 = 80, acute, so the claim is false. The triangle is real:
    // 100 + 40 + 40 = 180. The repaired claim — at most one exterior angle is
    // not obtuse — holds, since at most one of a triangle's angles is 90° or
    // more, which is `at-most-one-angle-is-not-acute` in triangle-basics.
    reference: '80',
    at: { x: '100' },
  },
  {
    id: 'a-candidate-that-is-not-a-triangle-refutes-nothing-1',
    knowledgePointId: 'one-counterexample-settles-it-if-it-meets-the-hypothesis',
    kind: 'evaluate',
    prompt:
      'A second candidate is offered against the same claim: angles of 100°, 50° and 40°, whose '
      + 'exterior angle at the first vertex is also 80°. Evaluate (a + b + c) − 180 at a = 100, '
      + 'b = 50, c = 40 BEFORE using it. Anything other than 0 says the three angles do not close '
      + 'a triangle, so no such triangle exists and it cannot refute a claim about triangles '
      + 'however its arithmetic comes out. This is the better of the two tasks on this point: the '
      + 'object looks like a counterexample and produces the same 80° as the real one. Read it '
      + 'against the-third-angle-was-never-free-1 in congruence, which is this expression '
      + 'identically 0 for any genuine triangle — there the 0 makes a point about criteria, here '
      + 'the non-zero disqualifies an object from being evidence.',
    given: '(a + b + c) - 180',
    variables: REAL_ABC,
    // 190 − 180 = 10. Non-zero, so the candidate fails the claim's hypothesis
    // and refutes nothing. The task is the hypothesis check rather than the
    // refutation, which is the order the knowledge point insists on.
    reference: '10',
    at: { a: '100', b: '50', c: '40' },
  },

  // ── circles ─────────────────────────────────────────────────────────────
  //
  // Six tasks across the three points of `circles`: five `evaluate` and one
  // `transform_to_form`, which makes this the second concept in the subject to
  // use a form and for the same reason `pythagoras` did — a tangent length is
  // normally an irrational and the ask the concept wants is "leave it exactly".
  //
  // THE PROXY PROBLEM IS NARROW IN ALL THREE POINTS, which is unusual here and
  // is a property of the material rather than of the task writing. The subject's
  // standing complaint is that the natural ask is "find the angle and name the
  // fact you used", the second half is not machine-rulable, and so each task
  // scores the arithmetic a decision licenses while the decision itself goes
  // unscored. These six are better placed than that because in each point the
  // decision IS a choice between two expressions, and a task can hand over one
  // expression rather than the other:
  //
  //   The first point's content is which of two central angles a vertex may
  //   halve, and the two tasks are `x/2` and `(360 - x)/2` at the same input.
  //   Getting the second one right is getting the decision right; there is no
  //   version of it that is correct arithmetic on the wrong choice, because the
  //   wrong choice is literally the other task. That is as close as this
  //   subject has come to grading a decision with `evaluate`.
  //
  //   The second point's content is which length is the hypotenuse, and the
  //   task is `sqrt(a^2 - b^2)`. The subtraction is the assignment. A learner
  //   who puts the tangent opposite the right angle computes a sum, and
  //   `sqrt(41^2 + 9^2)` is not 40.
  //
  //   The third point's content is which of two checks carries information, and
  //   the two tasks are the two checks on the same figure — one returning a
  //   verdict and one returning the 0 that every quadrilateral returns. The
  //   pair is the point; neither task alone is.
  //
  // What stays unscored is the part that always does: that the right angle is at
  // the point of contact, that the far arc is the one to halve, that 360° is
  // vacuous. Each prompt names which decision it has handed over, the same way
  // the congruence and proof blocks do.
  //
  // TWO OF THE SIX ECHO EXPRESSIONS FROM EARLIER BLOCKS, which is this subject's
  // habit, and in both cases the repetition is the content.
  // `the-tangent-leg-is-the-subtraction-1` is `sqrt(a^2 - b^2)`, which is
  // `the-leg-is-a-subtraction-1` in `pythagoras` with the root taken — there the
  // task stops at the square because the point is the slot, here it finishes
  // because the point is that a circle fact chose the slot already. And
  // `every-quadrilateral-passes-this-one-1` is `(a + b + c + d) - 360`, the
  // four-term sibling of `the-third-angle-was-never-free-1` in `congruence` and
  // of `a-candidate-that-is-not-a-triangle-refutes-nothing-1` in
  // `geometric-proof`. All three are "does this close", and the three jobs are
  // different: in congruence the identical 0 makes a point about criteria, in
  // the proof concept a non-zero disqualifies an object from being evidence, and
  // here the 0 is the trap — it arrives, it is correct, and it settles nothing.
  {
    id: 'halve-the-central-angle-on-the-far-arc-1',
    knowledgePointId: 'an-inscribed-angle-halves-the-central-angle-on-the-arc-it-is-not-on',
    kind: 'evaluate',
    prompt:
      'A and B are on a circle of centre O, with the non-reflex angle AOB measuring 110°. P is '
      + 'some point of the MAJOR arc AB. Evaluate x/2 at x = 110 to get the angle APB. The arc AB '
      + 'that P does not sit on is the minor one, and 110° is the angle standing on it at the '
      + 'centre, which is why this is the expression rather than the one in the task below. Note '
      + 'what this task does NOT ask: where on the major arc P is. Every point of it gives the '
      + 'same answer, and that invariance is the knowledge point.',
    given: 'x / 2',
    variables: REAL_X,
    // 110 ÷ 2 = 55. The non-reflex central angle is the one standing on the arc
    // P is NOT on, so it is the one halved. Checks against the task below:
    // 55 + 125 = 180, forced because the two central angles total 360°.
    reference: '55',
    at: { x: '110' },
  },
  {
    id: 'the-other-arc-halves-the-reflex-angle-1',
    knowledgePointId: 'an-inscribed-angle-halves-the-central-angle-on-the-arc-it-is-not-on',
    kind: 'evaluate',
    prompt:
      'The same circle and the same 110° at the centre, but now Q is a point of the MINOR arc AB. '
      + 'Evaluate (360 − x)/2 at x = 110 to get the angle AQB. The arc Q does not sit on is the '
      + 'major one, and the angle standing on that at the centre is the REFLEX one, 360 − 110. '
      + 'Read this against halve-the-central-angle-on-the-far-arc-1: same circle, same given, '
      + 'different expression, and choosing between the two expressions is the whole of what this '
      + 'point teaches. A learner who halves the printed 110° for both vertices answers 55° twice '
      + 'and is out by 70° on this one, with the division correct.',
    given: '(360 - x) / 2',
    variables: REAL_X,
    // 360 − 110 = 250, halved is 125. Q is on the minor arc, so the far arc is
    // the major one and the reflex angle is what stands on it. 55 + 125 = 180,
    // which is the cyclic-quadrilateral fact of the third point falling out of
    // these two tasks.
    reference: '125',
    at: { x: '110' },
  },
  {
    id: 'the-tangent-leg-is-the-subtraction-1',
    knowledgePointId: 'a-tangent-length-is-the-leg-the-right-angle-leaves',
    kind: 'evaluate',
    prompt:
      'A circle has centre O and radius 9 cm, and T is 41 cm from O. A tangent from T touches at '
      + 'A. Evaluate sqrt(a^2 - b^2) at a = 41, b = 9 to get TA. The subtraction is the content: '
      + 'the radius OA meets the tangent at right angles AT THE POINT OF CONTACT, so OT is '
      + 'opposite the right angle and is the hypotenuse, and TA is a leg — which is decided before '
      + 'any number is read. Putting the tangent opposite the right angle instead gives '
      + 'sqrt(41^2 + 9^2), and that is not this answer. Read it against '
      + 'the-leg-is-a-subtraction-1 in pythagoras, which is this expression stopped at the '
      + 'square because there the slot is what is in doubt.',
    given: 'sqrt(a^2 - b^2)',
    variables: REAL_AB,
    // 41² − 9² = 1681 − 81 = 1600 and √1600 = 40, rational because 9, 40, 41 is
    // a Pythagorean triple — picked so this first task comes out whole and the
    // surd task below carries the irrational case. The wrong assignment gives
    // √1762, which is not an integer, so the two are not confusable by accident.
    reference: '40',
    at: { a: '41', b: '9' },
  },
  {
    id: 'reduce-the-tangent-length-surd-1',
    knowledgePointId: 'a-tangent-length-is-the-leg-the-right-angle-leaves',
    kind: 'transform_to_form',
    prompt:
      'A circle of radius 2 cm has a point 14 cm from its centre. The tangent length from that '
      + 'point is sqrt(14^2 - 2^2). Give it exactly, with nothing left under the radical that '
      + 'need not be there — a whole number times a smaller root. A decimal is a rounding of this '
      + 'length rather than the length, and the radicand here was PRODUCED by the subtraction '
      + 'rather than handed to you.',
    given: 'sqrt(14^2 - 2^2)',
    form: 'surd_reduced',
    variables: [],
    // 196 − 4 = 192 = 64 × 3 with 64 = 8², so 8√3, and 3 is square-free so
    // nothing further comes out. Ruled by `asSurd`'s normal form with no worker,
    // like the two surd tasks above it in the build.
    //
    // Different numbers from `reduce-the-hypotenuse-surd-1` in pythagoras
    // (180 = 6√5), from `simplify-a-surd-1` in roots-and-irrationals
    // (1008 = 12√7) and from that concept's worked example (720 = 12√5), so it
    // is a recall of none of them. Also different from this concept's own
    // worked example, whose second case is √39 — square-free, so it reduces to
    // itself and could not be asked as a form at all. That is why the task
    // takes a third pair of numbers rather than reusing the example's.
    reference: '8*sqrt(3)',
  },
  {
    id: 'the-opposite-pair-refutes-it-1',
    knowledgePointId: 'opposite-angles-decide-concyclicity-and-the-total-of-all-four-does-not',
    kind: 'evaluate',
    prompt:
      'Quadrilateral PQRS is offered as having all four vertices on one circle, with angles '
      + 'P = 85°, Q = 98°, R = 94° and S = 83°. Evaluate (a + b) − 180 at a = 85, b = 94 — the '
      + 'pair of OPPOSITE angles P and R. Anything other than 0 proves those four points are not '
      + 'concyclic, and that conclusion is the contrapositive of "concyclic, therefore opposite '
      + 'angles total 180°", so nothing new had to be proved to reach it. What this task hands '
      + 'you is which pair to add; that it is the opposite pair rather than an adjacent one, and '
      + 'that one pair is the whole test, is the knowledge point.',
    given: '(a + b) - 180',
    variables: REAL_AB,
    // 85 + 94 = 179, so −1. Non-zero, so not concyclic. The other pair gives
    // 98 + 83 − 180 = +1, the same failure with the opposite sign, because the
    // four angles total 360° — which is why checking it twice adds nothing. The
    // figure is a genuine quadrilateral: the four angles total 360° and each is
    // under 180°.
    reference: '-1',
    at: { a: '85', b: '94' },
  },
  {
    id: 'every-quadrilateral-passes-this-one-1',
    knowledgePointId: 'opposite-angles-decide-concyclicity-and-the-total-of-all-four-does-not',
    kind: 'evaluate',
    prompt:
      'The same quadrilateral PQRS. Evaluate (a + b + c + d) − 360 at a = 85, b = 98, c = 94, '
      + 'd = 83. The answer is 0, the figure passes, and it is NOT concyclic — which is the point '
      + 'of the task. Every quadrilateral returns 0 here, because one diagonal cuts it into two '
      + 'triangles of 180° each, so this check cannot distinguish a cyclic quadrilateral from any '
      + 'other and a figure that failed it would not be a quadrilateral at all. Read it against '
      + 'the-opposite-pair-refutes-it-1, which is the same four angles arranged into the check '
      + 'that does decide. This is the only task in the subject whose correct answer is evidence '
      + 'of nothing.',
    given: '(a + b + c + d) - 360',
    variables: REAL_ABCD,
    // 85 + 98 + 94 + 83 = 360, so 0. Identically 0 for any quadrilateral, which
    // is the trap rather than a weakness of the task: the-opposite-pair-
    // refutes-it-1 returns −1 on these same four angles. Compare
    // `the-third-angle-was-never-free-1` in congruence, the three-term version,
    // where the identical 0 is used to make a point about criteria.
    reference: '0',
    at: { a: '85', b: '98', c: '94', d: '83' },
  },

  // ── plane-geometry, tenth promotion: circle-measure ─────────────────────
  //
  // Six tasks, two per knowledge point, all `evaluate`, all settled by exact
  // rational arithmetic with no worker — like every block in this subject
  // except the two surds.
  //
  // EVERY ONE OF THEM ASKS FOR THE MULTIPLE OF π RATHER THAN THE MEASUREMENT,
  // and that is the one thing about this concept a later author needs to know
  // before touching it, because it looks like a dodge and is a property of the
  // engine.
  //
  // `pi` is a real constant of the expression language — expr.ts parses it, and
  // `CONSTANTS` maps `pi`, `PI` and nothing else to it. What it has not got is a
  // rational value: `exactValue` returns null on it, deliberately and for the
  // reason its header gives, which is that returning 0 or NaN would turn "I
  // cannot settle this" into a ruling against the learner. So a task whose
  // reference is `36*pi` cannot be ruled locally at all. It would be handed to
  // the worker, and this subject's whole no-worker contract — asserted in
  // tests/concepts-logic.mjs over every `evaluate` here — would end at this
  // concept.
  //
  // The alternative was to ask for the measurement and accept the worker. It
  // was rejected on the same ground `pythagoras` refused to ask for a decimal:
  // 14π IS the circumference, 43.98 cm is a rounding of it, and a task that
  // accepts the rounding teaches that the rounding is the answer. Asking for the
  // 14 keeps the exact object and keeps the ruling exact, and every prompt below
  // says which quantity it wants so that the learner is never guessing whether
  // the π is theirs to supply.
  //
  // What that costs is worth naming rather than glossing: no task here scores
  // the step from `14` to `14π cm`. That step is in all three worked examples
  // and in none of the rulings, which makes it the concept's unscored part — the
  // same shape as "the right angle is at the point of contact" in `circles`,
  // where each prompt names the decision it has handed over.
  //
  // THE SECOND TASK OF EACH PAIR IS WHERE THE CONTENT IS, following this
  // subject's habit of making the pair the point rather than either half:
  //
  //   The first point's two are the relation in both directions — `2*x` for a
  //   circumference from a radius, `x/2` for a radius from a circumference. The
  //   content is which length the ratio is taken against, and each direction has
  //   its own named wrong answer: 7 instead of 14 taking it against the radius,
  //   50 instead of 25 stopping at the diameter.
  //
  //   The second point's two are the SAME fraction at the SAME two inputs over
  //   two different wholes — `(a/360)*2*b` and `(a/360)*b^2`. Choosing between
  //   them is the whole of what the point teaches, and neither task alone shows
  //   it. This is the shape `halve-the-central-angle-on-the-far-arc-1` and
  //   `the-other-arc-halves-the-reflex-angle-1` established one promotion ago.
  //
  //   The third point's two are `x^2` for the area factor and `(x/2)^2` for the
  //   whole crossing from a circumference to an area. The first is as close as
  //   this subject comes to grading a misconception directly: the wrong answer to
  //   "the radius trebles, what happens to the area" is 3, and 3 is the input.
  //
  // `the-radius-from-the-circumference-1` is `x/2` at a different input, which
  // is `halve-the-central-angle-on-the-far-arc-1`'s expression in `circles`. The
  // repetition is this subject's habit and in this case it is nearly the content:
  // there the halving is a theorem about two angles standing on a chord, here it
  // is undoing a definition, and the same division does both. Different numbers
  // (50 against 110) so neither is a recall of the other.
  {
    id: 'the-circumference-is-the-diameter-times-pi-1',
    knowledgePointId: 'the-ratio-is-taken-against-the-diameter-and-does-not-depend-on-the-circle',
    kind: 'evaluate',
    prompt:
      'A circle has radius 7 cm. Its circumference is an exact multiple of π; evaluate 2*x at '
      + 'x = 7 to get that multiple, so the circumference is your answer times π centimetres. The '
      + 'doubling is the content: π is the circumference over the DIAMETER, so C = πd and the '
      + 'diameter has to be formed from the radius before anything is multiplied. Taking the '
      + 'ratio against the radius instead answers 7, which is this task\'s wrong answer and is '
      + 'the printed number handed back. The task asks for the multiple rather than for the '
      + 'length because π has no exact rational value, so a decimal answer could not be ruled '
      + 'here without a worker and would be a rounding of the circumference rather than the '
      + 'circumference.',
    given: '2*x',
    variables: REAL_X,
    // 2 × 7 = 14, so C = 14π cm. The wrong assignment — ratio against the
    // radius — gives 7, the input unchanged, so the two are distinguishable.
    reference: '14',
    at: { x: '7' },
  },
  {
    id: 'the-radius-from-the-circumference-1',
    knowledgePointId: 'the-ratio-is-taken-against-the-diameter-and-does-not-depend-on-the-circle',
    kind: 'evaluate',
    prompt:
      'A different circle has circumference 50π cm. Evaluate x/2 at x = 50 to get its radius in '
      + 'centimetres. Read it against the-circumference-is-the-diameter-times-pi-1: same '
      + 'relation, run the other way. Dividing the multiple by π is the step that has already '
      + 'been done for you — 50π = πd cancels to d = 50 exactly, with nothing rounded, which is '
      + 'why the exact form was worth keeping — and what is left is the one halving that takes '
      + 'the diameter to the radius. Stopping at 50 is this task\'s wrong answer: that is the '
      + 'diameter, and it is the error the worked example names.',
    given: 'x / 2',
    variables: REAL_X,
    // 50 ÷ 2 = 25 cm. The 50 is the diameter, reached by cancelling π from
    // 50π = πd, so the remaining work is the halving. Different input from
    // `halve-the-central-angle-on-the-far-arc-1` in circles, which is the same
    // expression doing an unrelated job.
    reference: '25',
    at: { x: '50' },
  },
  {
    id: 'the-arc-is-that-fraction-of-the-circumference-1',
    knowledgePointId: 'an-arc-and-a-sector-take-the-same-fraction-of-two-different-wholes',
    kind: 'evaluate',
    prompt:
      'A circle of radius 18 cm has a sector with a central angle of 60°. Evaluate (a/360)*2*b '
      + 'at a = 60, b = 18 to get the arc length as a multiple of π, so the arc is your answer '
      + 'times π centimetres. Two things are in the expression: a/360 is the angle\'s share of a '
      + 'full turn, and 2*b is the whole circumference over π. The arc is part of the BOUNDARY, '
      + 'so the boundary is the whole that share is taken of. Read this against '
      + 'the-sector-is-the-same-fraction-of-the-area-1, which has the same two inputs and the '
      + 'same fraction over a different whole — choosing between the two expressions is what this '
      + 'point teaches, and neither task shows it alone.',
    given: '(a/360)*2*b',
    variables: REAL_AB,
    // 60/360 = 1/6, and the circumference over π is 2 × 18 = 36, so the arc
    // over π is 36/6 = 6: the arc is 6π cm. Checks against the task below,
    // which is 54 rather than 6 — two different wholes, so two different
    // numbers, which the worked example uses as its own check.
    reference: '6',
    at: { a: '60', b: '18' },
  },
  {
    id: 'the-sector-is-the-same-fraction-of-the-area-1',
    knowledgePointId: 'an-arc-and-a-sector-take-the-same-fraction-of-two-different-wholes',
    kind: 'evaluate',
    prompt:
      'The same circle and the same 60° sector. Evaluate (a/360)*b^2 at a = 60, b = 18 to get '
      + 'the sector\'s AREA as a multiple of π, in square centimetres. The fraction a/360 is '
      + 'identical to the one in the task above and only the whole has changed: b^2 is the '
      + 'circle\'s whole area over π, because an area is πr² where a circumference is 2πr. So the '
      + 'squaring is the entire difference between the two tasks, and it is the decision the '
      + 'point is about. A learner who takes the fraction once and reuses what it gave answers 6 '
      + 'here, which is a length offered as an area, and the units are the only thing that says '
      + 'so.',
    given: '(a/360)*b^2',
    variables: REAL_AB,
    // 60/360 = 1/6, and the area over π is 18² = 324, so the sector over π is
    // 324/6 = 54: the sector is 54π cm². Same inputs and same fraction as the
    // task above, differing only in the whole — 2b against b², which is 2πr
    // against πr².
    reference: '54',
    at: { a: '60', b: '18' },
  },
  {
    id: 'the-area-factor-is-the-square-of-the-scale-factor-1',
    knowledgePointId: 'a-scale-factor-multiplies-the-boundary-once-and-the-area-twice',
    kind: 'evaluate',
    prompt:
      'One circle\'s radius is three times another\'s. Evaluate x^2 at x = 3 to get the factor '
      + 'by which its AREA is larger. The squaring is the whole content: the radius sits squared '
      + 'in πr², so a factor on the radius enters the area twice, while the circumference is a '
      + 'length and takes it once. This is the one task in the subject whose wrong answer is its '
      + 'own input — a learner who reasons "three times as wide, three times as big" answers 3, '
      + 'which is the scale factor and is also the factor the CIRCUMFERENCE grows by, so the '
      + 'error is a correct answer to the other question.',
    given: 'x^2',
    variables: REAL_X,
    // 3² = 9. The circumference factor is 3, so answering 3 here is the
    // misconception the knowledge point exists to correct rather than an
    // arithmetic slip — and it is the input, which is why the prompt names it.
    reference: '9',
    at: { x: '3' },
  },
  {
    id: 'one-measure-of-a-circle-pins-the-others-1',
    knowledgePointId: 'a-scale-factor-multiplies-the-boundary-once-and-the-area-twice',
    kind: 'evaluate',
    prompt:
      'A circle has circumference 20π cm. Evaluate (x/2)^2 at x = 20 to get its area as a '
      + 'multiple of π, in square centimetres. The expression is the whole crossing in one step: '
      + 'x/2 takes the circumference\'s multiple of π to the radius, since C = 2πr, and squaring '
      + 'that takes the radius to the area\'s multiple, since A = πr². That this is possible at '
      + 'all is the point — `area-and-perimeter` showed two rectangles of equal perimeter with '
      + 'different areas, so a perimeter does not fix an area in general. A circle has one free '
      + 'number rather than two, so any measure of it pins the rest.',
    given: '(x/2)^2',
    variables: REAL_X,
    // 20 ÷ 2 = 10, the radius, and 10² = 100, so the area is 100π cm². Both
    // steps are forced by the two formulas and neither is reversible for a
    // rectangle, which is the comparison the fourth subgoal makes.
    reference: '100',
    at: { x: '20' },
  },

  // ── plane-geometry, eleventh promotion: distance-and-midpoint ───────────
  //
  // Six tasks, two per knowledge point, all `evaluate`, every one settled by
  // exact rational arithmetic with no worker — so the subject's no-worker
  // contract holds unchanged and the pair of `surd_reduced` tasks above stays a
  // pair.
  //
  // WHICH IS A DECISION HERE, NOT AN OUTCOME, and the decision runs the other
  // way from `circle-measure`'s. There a form was wanted and none existed. Here
  // one exists and was declined: a distance is a root, so `surd_reduced` fits,
  // and asking for one would have been a third copy of a question
  // `roots-and-irrationals` owns and `pythagoras` and `circles` have each
  // already borrowed. What this concept adds in front of the root is the two
  // legs, and that is upstream of the radical rather than in it. So the figures
  // were chosen to make the roots come out whole — 5, 12, 13 for the distance
  // and its halves — and the irrational case is stated in the worked examples
  // and in the second objective's own phrasing rather than drilled a fourth
  // time.
  //
  // THE UNSCORED PART, named as everywhere else in this subject: completing the
  // right triangle. Which third point turns the segment into a hypotenuse is a
  // decision and not a value, and a learner who writes the formula down from
  // memory and substitutes correctly takes the mark without having made it.
  // That is the same gap `pythagoras` records for its slot assignment, and the
  // same answer is given to it — the task below that scores the SYMMETRY is
  // built to make the half that can be scored carry as much of the content as
  // possible, since "the order cannot matter" is the one claim in the first
  // point that is a number.
  //
  // WHY `REAL_ABCD` AND NOT A COORDINATE-NAMED SET. Four reals is what two
  // points cost, and the file's rule is the one `REAL_ABC` states: what a
  // symbol MEANS is the prompt's job and what it may be assumed to BE is the
  // declaration's. So two points share a declaration with two rectangles' sides
  // and with the four coefficients of ax + b = cx + d rather than duplicating
  // it under geometric names. Real rather than integer for the reason the rest
  // of this subject gives — nothing about either formula needs whole
  // coordinates, and the whole numbers in the prompts are a convenience of the
  // points chosen.
  {
    id: 'the-distance-is-a-hypotenuse-1',
    knowledgePointId: 'the-legs-are-the-coordinate-differences',
    kind: 'evaluate',
    prompt:
      'A is the point (−2, 1) and B is (3, 13). The segment AB is the hypotenuse of a right '
      + 'triangle whose legs run along the axes, so its length is the root of the sum of the two '
      + 'squared coordinate differences. Evaluate sqrt((c - a)^2 + (d - b)^2) at a = -2, b = 1, '
      + 'c = 3, d = 13, where (a, b) is A and (c, d) is B. Note which half of this task scores — '
      + 'the arithmetic, not the decision. That the segment is the hypotenuse rather than a leg '
      + 'is settled by the right angle being at the corner (3, 1), and it was handed to you in '
      + 'this prompt rather than left for you to get right.',
    given: 'sqrt((c - a)^2 + (d - b)^2)',
    variables: REAL_ABCD,
    // 3 − (−2) = 5 and 13 − 1 = 12, so 25 + 144 = 169 and the root is 13 exactly.
    // A triple on purpose: this task is about reading the legs off the
    // coordinates, and an irrational answer would have moved the difficulty into
    // the radical, where `roots-and-irrationals` already owns it. The negative
    // input is deliberate — 3 − (−2) is the subtraction the second subgoal says
    // is most often lost.
    reference: '13',
    at: { a: '-2', b: '1', c: '3', d: '13' },
  },
  {
    id: 'swapping-the-two-points-changes-nothing-1',
    knowledgePointId: 'the-legs-are-the-coordinate-differences',
    kind: 'evaluate',
    prompt:
      'Same two points. Taken from A to B the differences are 5 and 12; taken from B to A they '
      + 'are −5 and −12, and neither of those is a length. Evaluate '
      + '(c - a)^2 + (d - b)^2 - ((a - c)^2 + (b - d)^2) at a = -2, b = 1, c = 3, d = 13 — the '
      + 'squared sum one way round, minus the squared sum the other. The answer is the whole '
      + 'reason the formula is written with no absolute value signs in it, and it is the same '
      + 'answer for ANY two points rather than a coincidence of these two.',
    given: '(c - a)^2 + (d - b)^2 - ((a - c)^2 + (b - d)^2)',
    variables: REAL_ABCD,
    // Identically 0, since (a − c)² = (c − a)² term by term. The same shape as
    // `the-third-angle-was-never-free-1` in `congruence`: the content is that
    // the difference vanishes for every input, so tests/concepts-logic.mjs
    // checks it at a second, unrelated quadruple as well.
    reference: '0',
    at: { a: '-2', b: '1', c: '3', d: '13' },
  },
  {
    id: 'the-midpoint-x-is-an-average-1',
    knowledgePointId: 'a-midpoint-is-an-average-per-axis-and-costs-two-numbers',
    kind: 'evaluate',
    prompt:
      'Still A(−2, 1) and B(3, 13). The midpoint\'s x-coordinate is the average of the two '
      + 'x-coordinates. Evaluate (a + b)/2 at a = -2, b = 3, where a and b are those two '
      + 'x-coordinates and nothing to do with the y\'s. Give the answer exactly: both inputs are '
      + 'whole numbers and this one is not, which is the ordinary case rather than a signal that '
      + 'something has gone wrong — an average of two whole numbers is whole only when they share '
      + 'a parity. The y-coordinate is the same move on 1 and 13 and is not asked here; the next '
      + 'task uses both of them.',
    given: '(a + b)/2',
    variables: REAL_AB,
    // (−2 + 3)/2 = 1/2. Deliberately not an integer: rounding it is one of the
    // two errors the knowledge point exists to stop, and a whole-number midpoint
    // would have hidden it. `exactValue` returns the rational, so no worker.
    reference: '1/2',
    at: { a: '-2', b: '3' },
  },
  {
    id: 'the-midpoint-halves-the-distance-1',
    knowledgePointId: 'a-midpoint-is-an-average-per-axis-and-costs-two-numbers',
    kind: 'evaluate',
    prompt:
      'Same two points, and now measure from A to the midpoint. Evaluate '
      + 'sqrt(((a + c)/2 - a)^2 + ((b + d)/2 - b)^2) at a = -2, b = 1, c = 3, d = 13, where '
      + '(a, b) is A and (c, d) is B: the expression averages each axis to get the midpoint, '
      + 'subtracts A from it, and applies the previous point\'s formula. Read the answer against '
      + 'the-distance-is-a-hypotenuse-1, which gave 13 for the whole segment. Both halves come '
      + 'out the same, and what puts the midpoint ON the segment is that they ADD to the whole — '
      + 'equal distances alone would put it anywhere on the perpendicular bisector.',
    given: 'sqrt(((a + c)/2 - a)^2 + ((b + d)/2 - b)^2)',
    variables: REAL_ABCD,
    // The midpoint is (1/2, 7), so the legs are 5/2 and 6 and the square is
    // 25/4 + 36 = 169/4, whose root is 13/2 — exactly half of 13. Rational
    // rather than integer on purpose: the carried half survives into the answer,
    // so a learner who rounded the midpoint cannot reach it. `exactValue`
    // settles sqrt(169/4) with no worker, which was checked before this task was
    // written rather than assumed.
    reference: '13/2',
    at: { a: '-2', b: '1', c: '3', d: '13' },
  },
  {
    id: 'recover-the-far-endpoint-x-1',
    knowledgePointId: 'a-coordinate-is-not-the-step-that-reaches-it',
    kind: 'evaluate',
    prompt:
      'A different segment: one endpoint A(−2, 1) and midpoint M(4, −3). The other endpoint B '
      + 'satisfies (−2 + x)/2 = 4 on the x-axis, so clearing the halving first gives '
      + 'x = 2(4) − (−2). Evaluate 2*b - a at a = -2, b = 4, where a is A\'s x-coordinate and b '
      + 'is M\'s. The number 6 is also available in this problem — it is b − a, the step from A '
      + 'to M — and it is the commonest wrong answer here. It is not wrong arithmetic: it is a '
      + 'displacement handed back where a coordinate was asked for.',
    given: '2*b - a',
    variables: REAL_AB,
    // 2(4) − (−2) = 8 + 2 = 10. The rejected 6 is 4 − (−2), the x-part of the
    // displacement A→M, which is also the x-part of M→B — that the two agree is
    // what makes M the midpoint, and neither of them answers the question.
    reference: '10',
    at: { a: '-2', b: '4' },
  },
  {
    id: 'recover-the-far-endpoint-y-1',
    knowledgePointId: 'a-coordinate-is-not-the-step-that-reaches-it',
    kind: 'evaluate',
    prompt:
      'Same segment, other axis — because the answer is a POINT and one coordinate is half of '
      + 'it. B\'s y satisfies (1 + y)/2 = −3, so y = 2(−3) − 1. Evaluate 2*b - a at a = 1, '
      + 'b = -3, where a is now A\'s y-coordinate and b is M\'s. The same expression as '
      + 'recover-the-far-endpoint-x-1 and the same two moves; what changes is that both signs '
      + 'bite, since doubling a negative midpoint goes further down and taking the +1 off it '
      + 'goes further down again.',
    given: '2*b - a',
    variables: REAL_AB,
    // 2(−3) − 1 = −6 − 1 = −7. One expression, two tasks, because a point is two
    // numbers — the shape `systems-of-linear-equations` established for the x
    // and the y of one system. Picked so the answer is below BOTH the known
    // endpoint and the midpoint, which "average" makes easy to doubt.
    reference: '-7',
    at: { a: '1', b: '-3' },
  },

  // ── triangle-trigonometry ───────────────────────────────────────────────
  //
  // Six tasks, two per knowledge point: five `evaluate` and one
  // `transform_to_form`, every one settled by exact arithmetic with no worker.
  //
  // WHY THE WHOLE-NUMBER TRIPLES, since four of them appear and they look like
  // a convenience. They are what makes the subject gradable at all. A side
  // ratio is a quotient of two lengths, and `exactValue` can settle a quotient
  // only when it is rational — so the triples 3-4-5, 5-12-13, 7-24-25 and
  // 8-15-17 are chosen so that every quotient below is an exact fraction.
  // Choose a triangle by its ANGLES instead and the quotients are irrational
  // for all but a handful of angles, `exactValue` correctly returns null, and
  // every task here would be handed to the worker.
  //
  // NO TASK ASKS FOR AN ANGLE, AND THAT IS THE SUBJECT'S BOUNDARY RATHER THAN
  // A GAP IN THE GRADER. "Which angle has this quotient" is the inverse
  // direction, which the map files as `inverse-trig` behind the unit circle,
  // and the only answer available at this level is a rounded figure from a
  // table — a measurement of the angle rather than the angle, exactly as 43.98
  // is a rounding of 14π in `circle-measure`. The acute angles of the four
  // triples are not whole numbers of degrees, and no prompt states one.
  //
  // THE ONE PLACE AN ANGLE IS NAMED IS THE SURD TASK, and it names 30° and 60°
  // because those two are DERIVED rather than looked up: the altitude of an
  // equilateral triangle splits it into two congruent halves, so the short leg
  // is half the side and the apex angle is half of 60°. That triangle's sides
  // are 5, 5√3 and 10 — not three whole numbers, which is the point. A right
  // triangle cannot have whole-number sides AND whole-number acute angles, the
  // figure would not exist, and nothing in this build would catch it. Each
  // worked example and each task here picks one or the other.
  //
  // WHAT IS UNSCORED, named here as the blocks above name theirs: which of the
  // three sides plays which role. The second point's whole content is that
  // "opposite" and "adjacent" are roles relative to a chosen vertex, and both
  // of its tasks hand the assignment over in the prompt — a learner who reads
  // the roles off the wrong vertex and then divides correctly takes the mark.
  // The pair is built to make the decision as visible as a task can, which is
  // the shape `pythagoras` used for the hypotenuse slot: the same three
  // lengths, two different quotients, two different answers.
  {
    id: 'the-quotient-is-the-same-in-both-triangles-1',
    knowledgePointId: 'the-quotient-belongs-to-the-angle-not-to-the-triangle',
    kind: 'evaluate',
    prompt:
      'Two right triangles share the acute angle A. In the first, the side opposite A is 5 and '
      + 'the hypotenuse is 13. In the second they are 20 and 52. Evaluate a/c - b/x at a = 5, '
      + 'c = 13, b = 20, x = 52 to compare the two quotients. A difference of 0 is the content, '
      + 'and it is guaranteed before either division is done: the triangles agree on all three '
      + 'angles, so they are similar, so the quotient taken between two of one triangle\'s own '
      + 'sides equals the same quotient in the other. That the quotient cannot see how big '
      + 'either triangle is, is exactly what lets it be tabulated against the angle and called '
      + 'sin A.',
    given: 'a/c - b/x',
    variables: REAL_ABC_X,
    // 5/13 − 20/52 = 5/13 − 5/13 = 0. The second triangle is 20, 48, 52 — the
    // 5-12-13 triangle scaled by 4 — and the acute angles of it are not whole
    // numbers of degrees, which is why neither is stated.
    //
    // The shape is `the-down-ratio-is-one-number-1` in `similarity`, with
    // different numbers and a different claim. There the two quotients were
    // read off two similar FIGURES and the content was that a ratio taken
    // inside a figure survives scaling. Here the quotient is indexed by an
    // ANGLE: the invariance is what makes a table of one column against the
    // angle possible, which is the step from similarity to trigonometry.
    reference: '0',
    at: { a: '5', c: '13', b: '20', x: '52' },
  },
  {
    id: 'the-derived-quotient-at-thirty-degrees-1',
    knowledgePointId: 'the-quotient-belongs-to-the-angle-not-to-the-triangle',
    kind: 'transform_to_form',
    prompt:
      'An equilateral triangle of side 10 is cut by the altitude from one vertex. That altitude '
      + 'splits it into two congruent right triangles, so each has a hypotenuse of 10, a short '
      + 'leg of 5 — half the side — and an angle of 30° at the apex, half of the 60° the '
      + 'equilateral triangle had there. So the quotient short-leg-over-hypotenuse at 30° is '
      + 'exactly 5/10 = 1/2, derived rather than read from a table. The altitude is the third '
      + 'side: its square is 10² − 5² = 75. Give that length exactly, with nothing left under '
      + 'the radical that need not be there. A decimal is a rounding of this length rather than '
      + 'the length — and the quotient it forms with the hypotenuse, √3/2, is irrational, which '
      + 'is why 30° is nearly the only angle whose ratios can be written down without a table.',
    given: 'sqrt(75)',
    form: 'surd_reduced',
    variables: [],
    // 75 = 25 × 3 with 25 = 5², so 5√3, and 3 is square-free so nothing
    // further comes out. Ruled by `asSurd`'s normal form with no worker, the
    // same way `reduce-the-hypotenuse-surd-1` in `pythagoras` is.
    //
    // A third radicand distinct from both of that subject's: 180 gave 6√5 and
    // 192 gave 8√3, so this is not a recall of either. It is also the one
    // triangle in this subject with whole-number ANGLES, and its third side is
    // irrational — which is the sides-and-angles constraint being obeyed
    // rather than dodged. Stating 5, 10 and a whole-number third side
    // alongside 30° and 60° would describe a triangle that does not exist.
    reference: '5*sqrt(3)',
  },
  {
    id: 'the-two-acute-angles-give-different-quotients-1',
    knowledgePointId: 'opposite-and-adjacent-are-roles-not-sides',
    kind: 'evaluate',
    prompt:
      'A right triangle has its right angle at C, legs of 7 and 24, and a hypotenuse of 25. '
      + 'A is the vertex where the sides of length 24 and 25 meet, so the leg facing A is the 7 '
      + 'and sin A = 7/25; B is the other acute angle, the leg facing it is the 24, and '
      + 'sin B = 24/25. Evaluate a/c - b/c at a = 7, b = 24, c = 25. A non-zero answer is the '
      + 'point: the quotient belongs to an ANGLE and not to a triangle, so the two acute angles '
      + 'of one triangle give different numbers from the very same three lengths. Note which '
      + 'half of this task scores — the arithmetic, not the role reading. That the 7 faces A '
      + 'rather than B was handed to you in this prompt, and it is the whole content of the '
      + 'knowledge point.',
    given: 'a/c - b/c',
    variables: REAL_ABC,
    // 7/25 − 24/25 = −17/25. Negative because the side facing A is the shorter
    // leg; the sign is which of the two acute angles is the smaller, and
    // reading the roles off the wrong vertex gives +17/25.
    //
    // 7² + 24² = 49 + 576 = 625 = 25², so the triangle exists. Its acute
    // angles are not whole numbers of degrees and neither is stated.
    reference: '-17/25',
    at: { a: '7', b: '24', c: '25' },
  },
  {
    id: 'the-tangent-of-the-same-angle-from-two-sides-1',
    knowledgePointId: 'opposite-and-adjacent-are-roles-not-sides',
    kind: 'evaluate',
    prompt:
      'Same triangle, and this time only the hypotenuse 25 and the leg ADJACENT to A, which is '
      + 'the 24, are given. The tangent of A is the leg facing A over the leg touching it, so '
      + 'the facing leg has to be recovered first — by Pythagoras, from the two lengths you '
      + 'have. Evaluate sqrt(c^2 - b^2)/b at b = 24, c = 25. Then read the answer against the '
      + 'tangent of B, which is the same two legs the other way up: 24/7, a number larger than '
      + '1. No sine or cosine is ever larger than 1, and the third knowledge point is why — a '
      + 'tangent has no such ceiling, because neither leg is forced to be the longer one.',
    given: 'sqrt(c^2 - b^2)/b',
    variables: REAL_BC,
    // 625 − 576 = 49, √49 = 7 exactly, so 7/24. Two moves in one expression —
    // recover the facing leg, then form the quotient — and both settled by
    // `exactValue`, the root through `exactRoot`.
    //
    // 7/24 and 24/7 are reciprocals, and the pair is the role exchange in the
    // one place where it changes the SIZE of the answer rather than only its
    // name: for the sine and cosine the exchange swaps two numbers that are
    // both below 1, and for the tangent exactly one of the two is above it.
    reference: '7/24',
    at: { b: '24', c: '25' },
  },
  {
    id: 'a-known-hypotenuse-multiplies-down-1',
    knowledgePointId: 'the-relation-runs-both-ways-and-the-sine-is-bounded',
    kind: 'evaluate',
    prompt:
      'A right triangle has sin A = 8/17 and a hypotenuse of 102. Because the HYPOTENUSE is the '
      + 'side that is known, the relation is used in its multiplying direction: the side facing '
      + 'A is the hypotenuse times the quotient. Evaluate (a/b)*x at a = 8, b = 17, x = 102. '
      + 'Check the answer against the 102 before trusting it — the side facing an acute angle is '
      + 'shorter than the hypotenuse, so an answer above 102 is wrong whatever the arithmetic '
      + 'said. Compare with a-known-opposite-side-divides-up-1, which gives the same quotient '
      + 'the other direction.',
    given: '(a/b)*x',
    variables: REAL_ABX,
    // (8/17) × 102 = 8 × 6 = 48, and 48 < 102 as it must be. The triangle is
    // 48, 90, 102 — the 8-15-17 triangle scaled by 6.
    //
    // 8/17 is the quotient the second knowledge point read off an 8-15-17
    // triangle directly. Here it is used on a triangle whose sides were never
    // given, which is the first point's claim doing work.
    reference: '48',
    at: { a: '8', b: '17', x: '102' },
  },
  {
    id: 'a-known-opposite-side-divides-up-1',
    knowledgePointId: 'the-relation-runs-both-ways-and-the-sine-is-bounded',
    kind: 'evaluate',
    prompt:
      'Same quotient, sin A = 8/17, but now the side facing A is the one that is known and it is '
      + '72; the hypotenuse is what is missing. So the relation is used in its dividing '
      + 'direction instead. Evaluate x/(a/b) at a = 8, b = 17, x = 72. This answer has to come '
      + 'out LARGER than the 72 you were given, where the answer to '
      + 'a-known-hypotenuse-multiplies-down-1 had to come out smaller than its 102 — and nothing '
      + 'about the formula says which. The side you were handed says, which is the whole content '
      + 'of the knowledge point and the one decision this ruling cannot see.',
    given: 'x/(a/b)',
    variables: REAL_ABX,
    // 72 ÷ (8/17) = 72 × 17/8 = 9 × 17 = 153, and 153 > 72 as it must be. The
    // triangle is 72, 135, 153 — the 8-15-17 triangle scaled by 9.
    //
    // The same expression pattern as `the-same-two-numbers-the-other-way-1` in
    // `pythagoras` and for the same reason: one relation, two directions, and
    // the gap between the two answers is what one decision about which side is
    // known is worth.
    reference: '153',
    at: { a: '8', b: '17', x: '72' },
  },

  // ── triangle-trigonometry, second concept: the oblique-triangle laws ────
  //
  // Six more tasks on the same subject, five `evaluate` and one
  // `transform_to_form`, all settled with no worker — the same split as the
  // three points above and settled the same way.
  //
  // WHAT MAKES THEM EXACT IS NOT WHAT MAKES THE RATIOS EXACT, and the
  // difference decides every figure below. There the triples were chosen so
  // that a quotient of two whole sides is rational. Here the cosine of the
  // named angle has to be rational too, and by the cosine law rearranged that
  // is automatic for a triangle with three whole sides — but it cuts the
  // other way as well: an angle that is a whole number of DEGREES and has a
  // rational cosine must be 90°, 60° or 120°, those being the only rational
  // cosines a rational multiple of π has. So the figures are 5-7-8 and 3-7-8,
  // which have a 60° angle facing their 7 and no other whole-degree angle at
  // all; the right-triangle rule "whole sides or whole angles, never both" is
  // the special case of that at 90°. ontology-trigonometry.ts's header argues
  // it in full and tests/atlas.mjs checks it by computing the three cosines
  // rather than by reading these comments.
  //
  // THE SINE-LAW TASKS NAME NO ANGLE AT ALL, which is not a stricter choice
  // than the cosine ones but a forced one. The sines this build can write
  // exactly are 1/2, √2/2, √3/2 and 1, and a quotient of two of those is
  // rational only when they are equal — so a sine-law task with named angles
  // has an irrational answer and `exactValue` correctly returns null. Giving
  // the angles by their rational SINES instead is the first concept's own
  // discipline ("sin A = 7/25", no angle named) and it buys a whole family:
  // 25-39-56 has sines 3/5, 5/13 and 56/65 against the one quotient 65.
  //
  // THE SURD TASK IS ON THE COSINE POINT, and that is a fact about the laws
  // rather than a convenience. The cosine law produces a², so `sqrt(76)` is
  // the honest next step of the learner's own working; the sine law produces a
  // side directly and its irrational outputs arrive already reduced. Which
  // matters more than it sounds: `surd_reduced` only checks that each radicand
  // is square-free, so the authentic sine-law expression `10*sqrt(3)/sqrt(2)`
  // PASSES the form check unchanged and a task given it would rule its own
  // input correct. `sqrt(76)` is refused by the same checker, naming the
  // square 4.
  //
  // WHAT IS UNSCORED: which law applies to the data. Choosing between them is
  // the second point's content and every prompt below hands the choice over by
  // naming the law — a ruling cannot see a decision that was made before the
  // expression was written, and this file says so wherever it is true rather
  // than letting a coverage figure imply otherwise.
  {
    id: 'the-correction-term-off-pythagoras-1',
    knowledgePointId: 'the-cosine-law-is-pythagoras-with-one-correction-term',
    kind: 'evaluate',
    prompt:
      'Two sides of a triangle meeting at one vertex are 5 and 8, and the angle they enclose '
      + 'is 60°, so its cosine is 1/2 — derived from the altitude of an equilateral triangle, '
      + 'not looked up. The cosine law gives the side facing that angle as '
      + 'sqrt(a^2 + b^2 - 2*a*b*k), where a and b are the two enclosing sides and k is the '
      + 'cosine. Evaluate sqrt(a^2 + b^2 - 2*a*b*k) at a = 5, b = 8, k = 1/2. Read the answer '
      + 'against what Pythagoras alone would have claimed, which is sqrt(89): the gap between '
      + 'the two is the whole of the correction term, and the answer must come out SHORTER, '
      + 'because closing the angle from a right angle to 60° brings the far ends of the two '
      + 'sides together.',
    given: 'sqrt(a^2 + b^2 - 2*a*b*k)',
    variables: REAL_ABK,
    // 25 + 64 − 2·5·8·(1/2) = 89 − 40 = 49, and √49 = 7 exactly — the root
    // through `exactRoot`, the same path `sqrt(c^2 - b^2)/b` takes two tasks
    // above. The triangle is 5, 7, 8.
    //
    // 7 < √89 ≈ 9.43 as the prompt promises. The figure names ONE angle and
    // its three sides are whole numbers, which is legitimate here and would
    // not be for a right triangle: 60° is one of the three whole-degree angles
    // an all-integer triangle may have. The other two angles of 5-7-8 have
    // cosines 11/14 and 1/7, neither of which belongs to a whole number of
    // degrees, and neither is stated.
    reference: '7',
    at: { a: '5', b: '8', k: '1/2' },
  },
  {
    id: 'the-sign-of-the-cosine-is-the-obtuse-verdict-1',
    knowledgePointId: 'the-cosine-law-is-pythagoras-with-one-correction-term',
    kind: 'evaluate',
    prompt:
      'Now the law backwards, from three sides to a cosine: a triangle has sides 3, 7 and 8, '
      + 'and the question is what kind of angle faces the longest of them. Rearranged, the '
      + 'cosine of the angle facing a is (b^2 + c^2 - a^2)/(2*b*c). Evaluate it at a = 8, '
      + 'b = 3, c = 7. The SIGN is the answer you were asked for — negative means a² has '
      + 'overshot b² + c², so the angle has opened past a right angle — and it is available '
      + 'without the angle itself, which would need the inverse cosine and is four nodes up '
      + 'the map. Compare the-correction-term-off-pythagoras-1, where the same quantity came '
      + 'out positive for a 60° angle.',
    given: '(b^2 + c^2 - a^2)/(2*b*c)',
    variables: REAL_ABC,
    // (9 + 49 − 64)/42 = −6/42 = −1/7. Negative, so the angle facing the 8 is
    // wider than a right angle — the converse of Pythagoras read as a
    // comparison rather than an equality.
    //
    // 3 + 7 = 10 > 8, so the triangle exists. It is the OTHER root of the
    // ambiguous case in the third point: 3-7-8 and 5-7-8 both have a 60° angle
    // facing their 7, and this task is the reason they are genuinely different
    // triangles rather than one relabelled — the angle facing the 8 has cosine
    // −1/7 here and +1/7 there.
    //
    // `REAL_ABC` rather than `REAL_ABK`: the three inputs are three SIDES, and
    // the two converse-of-Pythagoras tasks in `pythagoras` use this same set
    // for the same reason, a subtraction of squares whose sign is the ruling.
    reference: '-1/7',
    at: { a: '8', b: '3', c: '7' },
  },
  {
    id: 'the-cosine-law-left-a-surd-1',
    knowledgePointId: 'the-cosine-law-is-pythagoras-with-one-correction-term',
    kind: 'transform_to_form',
    prompt:
      'A triangle has two sides of 6 and 10 enclosing an angle of 60°. The cosine law gives '
      + 'the square of the facing side directly: 36 + 100 - 2*6*10*(1/2) = 76. So the side is '
      + '√76, and 76 is not a perfect square — write it with no square factor left under the '
      + 'radical. This is where an oblique triangle differs from the three whole-number '
      + 'triples above: the cosine law hands you a², and an a² with no exact root is the '
      + 'normal case rather than the awkward one. Leave it as √76 and nothing is wrong except '
      + 'that a square is still in there.',
    given: 'sqrt(76)',
    form: 'surd_reduced',
    variables: [],
    // 76 = 4 × 19 with 4 = 2², so 2√19, and 19 is square-free so nothing
    // further comes out. Ruled by `asSurd`'s normal form with no worker, the
    // same way `the-derived-quotient-at-thirty-degrees-1` is.
    //
    // A fourth radicand distinct from every other in the build — 75 gave 5√3
    // here, and `pythagoras` has 180 → 6√5 and 192 → 8√3 — so this is not a
    // recall of any of them, and the square that comes out is 4 rather than
    // 25, 36 or 64.
    //
    // THE GIVEN HAS TO BE A SINGLE RADICAL WITH A SQUARE IN IT. `surd_reduced`
    // checks only that each radicand is square-free, so the authentic
    // sine-law expression `10*sqrt(3)/sqrt(2)` passes unchanged — 3 and 2 are
    // both square-free — and a task given that would accept its own input,
    // which is the free mark types.ts warns about. Verified by ruling
    // `sqrt(76)` as an answer to itself: refused, naming the square 4.
    //
    // The figure states two whole sides, one whole angle and an irrational
    // third side, so the sides-and-angles constraint is satisfied the way the
    // 5, 5√3, 10 triangle above satisfies it rather than the way 5-7-8 does.
    reference: '2*sqrt(19)',
  },
  {
    id: 'the-quotient-is-the-same-at-two-vertices-1',
    knowledgePointId: 'the-ratio-of-a-side-to-the-sine-facing-it-is-one-number',
    kind: 'evaluate',
    prompt:
      'A triangle has the side 39 facing an angle whose sine is 3/5, and the side 56 facing an '
      + 'angle whose sine is 56/65. The sine law claims the quotient side-over-facing-sine is '
      + 'ONE number for the whole triangle, so the two quotients must agree — and the way to '
      + 'ask that as an arithmetic question is to subtract them. Evaluate a/s - c/u at a = 39, '
      + 's = 3/5, c = 56, u = 56/65. An answer of 0 is the law holding; any other answer would '
      + 'be the law failing on these numbers, and nothing in the arithmetic forces 0 — the '
      + 'four inputs look independent. No angle is named anywhere in this task, and none is '
      + 'needed.',
    given: 'a/s - c/u',
    variables: REAL_ACSU,
    // 39 ÷ 3/5 = 65 and 56 ÷ 56/65 = 65, so the difference is exactly 0.
    //
    // A reference of 0 is the content here rather than a degenerate case, and
    // it is checked the way a 0 reference has to be: by perturbing each input
    // and confirming the value MOVES. a = 40 gives 5/3, s = 2/5 gives 65/2,
    // c = 57 gives −65/56, u = 55/65 gives −13/11. So no input is idle and the
    // 0 is not an artefact of the expression's shape.
    //
    // The triangle is 25, 39, 56 with sines 3/5, 5/13 and 56/65 — all three
    // rational, which is why a sine-law task can be `evaluate` at all. Its
    // three cosines are 4/5, 12/13 and −33/65, NONE of them 0 or ±1/2, so this
    // triangle has no whole-degree angle to name and the prompt correctly
    // names none. Consistency checked both ways: (56/65)² + (33/65)² = 1.
    reference: '0',
    at: { a: '39', s: '3/5', c: '56', u: '56/65' },
  },
  {
    id: 'one-complete-pair-recovers-a-third-side-1',
    knowledgePointId: 'the-ratio-of-a-side-to-the-sine-facing-it-is-one-number',
    kind: 'evaluate',
    prompt:
      'Same triangle: the side 39 faces an angle of sine 3/5, and at a second vertex only the '
      + 'sine is known, 5/13. Because the quotient is one number for the triangle, the side '
      + 'facing that second angle is the first side times the ratio of the two sines. Evaluate '
      + 'a*t/s at a = 39, s = 3/5, t = 5/13. Note which direction the ratio runs — the sine '
      + 'being recovered on top — and check the answer for sense before trusting it: 5/13 is '
      + 'the smaller sine, so the side facing it has to come out SHORTER than 39.',
    given: 'a*t/s',
    variables: REAL_AST,
    // 39 × (5/13) ÷ (3/5) = 39 × 25/39 = 25, and 25 < 39 as the prompt
    // promises. Writing it the other way up gives 39 × 39/25, which is larger
    // than 39 and is the error the sense check is for.
    //
    // The same relation as `the-quotient-is-the-same-at-two-vertices-1` used
    // in its recovering direction instead of its asserting one, which is the
    // pairing `a-known-hypotenuse-multiplies-down-1` and
    // `a-known-opposite-side-divides-up-1` make for the ratios: one law, two
    // directions, and the decision the ruling cannot see is which.
    reference: '25',
    at: { a: '39', s: '3/5', t: '5/13' },
  },
  {
    id: 'the-ambiguous-case-has-two-positive-roots-1',
    knowledgePointId: 'two-sides-and-a-non-included-angle-can-describe-two-triangles',
    kind: 'evaluate',
    prompt:
      'A triangle has a 60° angle, the side facing it is 7, and one of the two sides enclosing '
      + 'it is 8. The cosine law in the missing side c is then a quadratic, '
      + 'c² - (2*b*k)c + (b² - a²) = 0, and its two roots are the two possible lengths. The '
      + 'LARGER root is b*k + sqrt(b^2*k^2 - b^2 + a^2). Evaluate it at a = 7, b = 8, k = 1/2. '
      + 'Then note what the quadratic has done that no formula could: with a = 7 facing the '
      + 'angle rather than enclosing it, the data admits a second triangle as well, and its '
      + 'third side is the other root — the same expression with the sign before the radical '
      + 'reversed, which comes out 3.',
    given: 'b*k + sqrt(b^2*k^2 - b^2 + a^2)',
    variables: REAL_ABK,
    // 4 + √(16 − 64 + 49) = 4 + √1 = 5, exactly, the root through `exactRoot`.
    // The minus branch gives 4 − 1 = 3, so the two triangles are 5, 7, 8 and
    // 3, 7, 8 — and both really do have cos = 1/2 facing their 7, checked:
    // (25 + 64 − 49)/80 = 1/2 and (9 + 64 − 49)/48 = 1/2.
    //
    // Both of those triangles are figures in the tasks above —
    // `the-correction-term-off-pythagoras-1` built 5-7-8 from SAS data and
    // `the-sign-of-the-cosine-is-the-obtuse-verdict-1` read 3-7-8's obtuse
    // angle. That is deliberate: the two tasks together are what makes the
    // ambiguity concrete rather than algebraic, since the learner has already
    // met both answers as triangles.
    //
    // Only the larger root is a task. The smaller is named in the prompt
    // instead, because a second task differing by one character would measure
    // the same move twice and the clearance task below measures the thing that
    // DECIDED there were two.
    reference: '5',
    at: { a: '7', b: '8', k: '1/2' },
  },
  {
    id: 'the-side-has-to-clear-the-perpendicular-1',
    knowledgePointId: 'two-sides-and-a-non-included-angle-can-describe-two-triangles',
    kind: 'evaluate',
    prompt:
      'Same data: a = 7 facing a 60° angle, b = 8 enclosing it. Two positive roots need the '
      + 'quadratic\'s discriminant to be positive, and a quarter of that discriminant tidies '
      + 'to a^2 - b^2*(1 - k^2). Evaluate it at a = 7, b = 8, k = 1/2. The quantity '
      + 'b^2*(1 - k^2) has a meaning in the figure: drop the perpendicular from the far vertex '
      + 'onto the other arm of the angle, and Pythagoras in that right triangle — hypotenuse '
      + 'b, one leg b*k — makes the perpendicular\'s square b^2 - b^2*k^2. It is the shortest '
      + 'the facing side could possibly be, so a positive answer says the side you were given '
      + 'CLEARS that perpendicular and a negative one says it falls short, with no triangle at '
      + 'all. Here it clears by the narrowest whole-number margin there is.',
    given: 'a^2 - b^2*(1 - k^2)',
    variables: REAL_ABK,
    // 49 − 64 × 3/4 = 49 − 48 = 1. Positive, so two triangles, and 1 is the
    // smallest positive value a whole-number figure can give — 48 is
    // (4√3)² = (8 sin 60°)².
    //
    // The sign is the ruling, which is why `REAL_ABK` is real rather than
    // positive, and the perturbations show it is live on every input: a = 6
    // gives −12 (the side falls short, no triangle), a = 9 gives 33 (but then
    // a > b and the product of the roots turns negative, so one triangle
    // rather than two), b = 9 gives −47/4, k = 1/3 gives −71/9. So each of the
    // three inputs moves the answer and two of them move it across zero, which
    // is the boundary the task is about.
    reference: '1',
    at: { a: '7', b: '8', k: '1/2' },
  },

  // ── functions-and-inverses ──────────────────────────────────────────────
  //
  // Fifteen tasks, one per knowledge point, all `evaluate` and all settled by
  // exact rational arithmetic — so this subject, like arithmetic, is gradable
  // with no worker configured.
  //
  // TWO THINGS SHAPE EVERY ONE OF THEM, and both are properties of the engine
  // rather than of the mathematics:
  //
  //  1. There are no user-defined functions in the expression language. `f`
  //     means nothing to the parser, so a composition is written as the
  //     already-substituted expression and the PROMPT names the two rules it
  //     came from. Substituting the inner rule where the outer variable was is
  //     what composition is, so this is the task rather than a dodge.
  //  2. `exactValue` returns null for a `function` node, so `sqrt(9)` cannot
  //     be ruled locally and `9^(1/2)` can. Nothing here uses a named
  //     function; the circle's two branches are written with `^(1/2)`.
  {
    id: 'one-output-1',
    knowledgePointId: 'one-output-per-input',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2. Find f(4). The definition guarantees there is exactly one answer, which is ' +
      'what makes "f(4)" the name of a number.',
    given: 'a*x + b',
    variables: REAL_ABC_X,
    at: { a: '3', b: '-2', x: '4' },
    reference: '10',
  },
  {
    id: 'input-expression-1',
    knowledgePointId: 'the-input-can-be-an-expression',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2. Find f(x + 1) at x = 4 — so the input is 5, not 4. Substituting gives ' +
      '3(x + 1) − 2; dropping those brackets is the commonest error here.',
    given: 'a*(x + h) + b',
    variables: [...REAL_ABC_X, { name: 'h', assumptions: { real: true } }],
    at: { a: '3', b: '-2', x: '4', h: '1' },
    // 3·5 − 2 = 13, and f(4) = 10 — the two differ, which is the point.
    reference: '13',
  },
  {
    id: 'not-a-function-1',
    knowledgePointId: 'not-every-rule-is-a-function',
    kind: 'evaluate',
    prompt:
      'The unit circle gives y = ±(1 − x²)^(1/2) — two branches. Measure the gap between them at ' +
      'x = 0 by evaluating (1 − x²)^(1/2) − (−(1 − x²)^(1/2)). A gap of 0 would mean one output; ' +
      'anything else means this is not a function.',
    // A proxy, and named as one: "is this a function" wants yes or no, and no
    // tree has a rational value of yes. The gap between the branches is the
    // computation the vertical-line test performs, and it is checkable.
    given: '(1 - x^2)^(1/2) - (-(1 - x^2)^(1/2))',
    variables: REAL_X,
    at: { x: '0' },
    // 1 − (−1) = 2. `exactValue` settles 1^(1/2) through `exactRoot`.
    reference: '2',
  },
  {
    id: 'domain-excluded-1',
    knowledgePointId: 'the-domain-is-where-the-rule-works',
    kind: 'evaluate',
    prompt:
      'f(x) = 1/(x − 3) is undefined somewhere. Evaluate the denominator x − 3 at x = 3 to show ' +
      'what goes wrong there.',
    // The same proxy the rational-domain tasks use: "name the excluded points"
    // asks for a set in prose, and the reason a point is excluded is that the
    // denominator vanishes — which is exactly this arithmetic.
    given: 'x - c',
    variables: [...REAL_X, { name: 'c', assumptions: { real: true } }],
    at: { x: '3', c: '3' },
    reference: '0',
  },
  {
    id: 'range-floor-1',
    knowledgePointId: 'the-range-is-what-it-reaches',
    kind: 'evaluate',
    prompt:
      'f(x) = x² + 4. Evaluate f(0). Since x² is never negative this value is the smallest the ' +
      'rule reaches, so the range starts here.',
    given: 'x^2 + c',
    variables: [...REAL_X, { name: 'c', assumptions: { real: true } }],
    at: { x: '0', c: '4' },
    reference: '4',
  },
  {
    id: 'hole-1',
    knowledgePointId: 'a-hole-is-not-a-simplification',
    kind: 'evaluate',
    prompt:
      'Evaluate (x² − 4)/(x − 2) at x = 5. The cancelled form x + 2 gives the same answer here — ' +
      'and a different one at x = 2, where the original is undefined.',
    given: '(x^2 - 4)/(x - 2)',
    variables: REAL_X,
    at: { x: '5' },
    // 21/3 = 7, and x + 2 at 5 is also 7. They part company only at x = 2.
    reference: '7',
  },
  {
    id: 'compose-1',
    knowledgePointId: 'composition-is-substitution',
    kind: 'evaluate',
    prompt:
      'f(x) = x² + 1 and g(x) = 2x − 3. Find f(g(2)) — inner rule first. Written as one ' +
      'expression that is (2x − 3)² + 1.',
    given: '(a*x + b)^2 + c',
    variables: REAL_ABC_X,
    at: { a: '2', b: '-3', c: '1', x: '2' },
    // g(2) = 1, f(1) = 2.
    reference: '2',
  },
  {
    id: 'compose-order-1',
    knowledgePointId: 'the-order-matters',
    kind: 'evaluate',
    prompt:
      'Same f(x) = x² + 1 and g(x) = 2x − 3, the other way round: find g(f(2)), which is ' +
      '2(x² + 1) − 3. Compare it with f(g(2)) = 2.',
    given: 'a*(x^2 + c) + b',
    variables: REAL_ABC_X,
    at: { a: '2', b: '-3', c: '1', x: '2' },
    // f(2) = 5, g(5) = 7. Emphatically not 2.
    reference: '7',
  },
  {
    id: 'composite-domain-1',
    knowledgePointId: 'the-composite-domain-can-shrink',
    kind: 'evaluate',
    prompt:
      'f(x) = 1/x and g(x) = x − 1, so f(g(x)) = 1/(x − 1). Evaluate it at x = 3. The composite ' +
      'is undefined at x = 1 even though g(1) = 0 is fine and f is fine everywhere but 0.',
    given: '1/(x - b)',
    variables: [...REAL_X, { name: 'b', assumptions: { real: true } }],
    at: { x: '3', b: '1' },
    reference: '1/2',
  },
  {
    id: 'inverse-apply-1',
    knowledgePointId: 'an-inverse-undoes-the-rule',
    kind: 'evaluate',
    prompt:
      'f(x) = 3x − 2, so f⁻¹(y) = (y + 2)/3. Find f⁻¹(10). Note this is not 1/f(10) = 1/28 — ' +
      'the superscript means inverse function here, not reciprocal.',
    given: '(y + b)/a',
    variables: [
      { name: 'y', assumptions: { real: true } },
      { name: 'a', assumptions: { real: true, nonzero: true } },
      { name: 'b', assumptions: { real: true } },
    ],
    at: { y: '10', a: '3', b: '2' },
    reference: '4',
  },
  {
    id: 'inverse-identity-1',
    knowledgePointId: 'the-pair-composes-to-the-identity',
    kind: 'evaluate',
    prompt:
      'With f(x) = 3x − 2 and f⁻¹(y) = (y + 2)/3, evaluate f(f⁻¹(7)) — written out, ' +
      '3·((y + 2)/3) − 2. Getting 7 back is what makes it the inverse.',
    given: 'a*((y + b)/a) - b',
    variables: [
      { name: 'y', assumptions: { real: true } },
      { name: 'a', assumptions: { real: true, nonzero: true } },
      { name: 'b', assumptions: { real: true } },
    ],
    at: { y: '7', a: '3', b: '2' },
    // The composite is the identity, so the answer is the input.
    reference: '7',
  },
  {
    id: 'not-one-to-one-1',
    knowledgePointId: 'it-has-to-be-one-to-one',
    kind: 'evaluate',
    prompt:
      'Squaring sends 3 and −3 to the same place. Evaluate x² − (−x)² at x = 3: a difference of ' +
      '0 between two different inputs is exactly why no inverse exists.',
    given: 'x^2 - (-x)^2',
    variables: REAL_X,
    at: { x: '3' },
    reference: '0',
  },

  // The three on `sequences`, which came into this subject from the
  // `sequences-and-series` map area. A THIRD constraint shapes them, alongside
  // the two above:
  //
  //  3. THERE IS NO WAY TO WRITE A RECURRENCE. `parseExpression` has numbers,
  //     symbols and five operators; `aₙ = 3aₙ₋₁ − 1` names a function of its
  //     own index and the language has no such thing, for exactly the reason
  //     it has no `f`. So a recurrence task is written as the walk SPELLED
  //     OUT — 3(3(3·2 − 1) − 1) − 1 — which is the same move the composition
  //     tasks above make, and for the same reason it is not a dodge: nesting
  //     one application inside the next IS what following a recurrence does,
  //     and the nesting is the step a learner loses count of.
  //
  // The honest gap that WAS here, and it has been collected rather than
  // deleted, because what filled it is the argument for writing such a note at
  // all. The sentence said: nothing here tests reaching a term the learner was
  // not told the position of; "Which term equals 302" inverts the formula, the
  // answer is an index rather than a term, it is askable, and it belongs to
  // `arithmetic-sequences` with the closed form it needs, which is still
  // mapped.
  //
  // `arithmetic-sequences` is authored now and `ap-position-1` is that task,
  // with that number in it. The gap stays recorded here because a note naming
  // the concept that should own a missing question is what let a later
  // promotion pick it up knowing it could not overlap anything already
  // written — which is worth more than the note being tidied away once it came
  // true.
  {
    id: 'sequence-term-1',
    knowledgePointId: 'a-sequence-is-a-function-on-positions',
    kind: 'evaluate',
    prompt:
      'A sequence has nth term n² + 1, so it begins 2, 5, 10, 17, … . Find the 6th term. The ' +
      'position is the input: "the 6th term" means n = 6, and the answer is not 6.',
    given: 'n^2 + c',
    variables: SEQUENCE_INDEX_C,
    at: { n: '6', c: '1' },
    // 36 + 1. The 5th term, 26, is never needed — which is the knowledge point.
    reference: '37',
  },
  {
    id: 'recurrence-walk-1',
    knowledgePointId: 'a-recurrence-needs-its-first-term',
    kind: 'evaluate',
    prompt:
      'a₁ = 2, and each term after that is 3 times the one before it, minus 1. Find a₄. Written ' +
      'out as one expression the walk is 3(3(3·2 − 1) − 1) − 1 — three applications of the rule ' +
      'to reach the fourth term, because a₁ was given rather than computed.',
    // Three nestings, not four: the innermost `r*a + b` IS a₂, so the depth of
    // the expression is the number of applications and the off-by-one the
    // knowledge point is about is visible in the shape of the given.
    given: 'r*(r*(r*a + b) + b) + b',
    variables: SEQUENCE_RECURRENCE,
    at: { r: '3', b: '-1', a: '2' },
    // 3·2 − 1 = 5, 3·5 − 1 = 14, 3·14 − 1 = 41.
    reference: '41',
  },
  {
    id: 'formula-beats-the-walk-1',
    knowledgePointId: 'a-formula-and-a-recurrence-are-not-interchangeable',
    kind: 'evaluate',
    prompt:
      'The sequence 5, 8, 11, 14, … is given both by the formula 3n + 2 and by a₁ = 5 with each ' +
      'term 3 more than the one before. Find the 100th term. The formula takes one ' +
      'substitution; the recurrence would take ninety-nine additions, and the two routes agree.',
    given: 'd*n + c',
    variables: SEQUENCE_INDEX_DC,
    at: { n: '100', d: '3', c: '2' },
    // 3·100 + 2. The same expression gives 5 at n = 1 and 14 at n = 4, which
    // is what the worked example checks before it trusts the formula at 100.
    reference: '302',
  },

  // The three on `sigma-notation`, which came out of the same map area one
  // step above `sequences`. A FOURTH constraint, and it is the recurrence
  // constraint again in a different costume:
  //
  //  4. THERE IS NO WAY TO WRITE A SIGMA. `parseExpression` has numbers,
  //     symbols and five operators, and Σ binds an index over a range, which
  //     is not an operator on two expressions. So an expansion task is the sum
  //     SPELLED OUT, exactly as a recurrence task is the walk spelled out, and
  //     for the same reason it is not a dodge: writing the four terms down IS
  //     what reading the notation means.
  //
  // What that costs, stated rather than hidden: spelling the sum out puts the
  // number of terms in front of the learner, so `sigma-expand-1` cannot test
  // the inclusive count — the thing its own knowledge point is about. The
  // count is tested by `sigma-constant-1` instead, where it is the factor in
  // the answer and the prompt does NOT give it: a learner who reads 9 − 4 as
  // the length submits 35 and is marked wrong on exactly the slip. The two
  // tasks together cover the point that neither covers alone, which is why
  // the second one looks like arithmetic and is not.
  //
  // The honest gap: nothing here rules a REARRANGEMENT. Linearity's content is
  // that Σ(3aₖ + 5) and 3Σaₖ + Σ5 are the same sum, and `transform_to_form`
  // is the kind that would ask for that — but no `NamedForm` describes "with
  // the constants outside", and inventing one would need a checker in
  // forms.ts that could see a sigma, which nothing can. So the rearrangement
  // is performed in the worked example and the task rules the number it
  // leaves, the same split the solve-for-x tasks use.
  {
    id: 'sigma-expand-1',
    knowledgePointId: 'the-limits-name-which-terms',
    kind: 'evaluate',
    prompt:
      'Total the sum of k² − 1 for k running from 3 to 6. Both limits are included, so written ' +
      'out the sum is (3² − 1) + (4² − 1) + (5² − 1) + (6² − 1). The subtraction applies to the ' +
      'square, not to k.',
    // The four summands are the four values of k, offset from the lower limit,
    // so the LENGTH of the expression is the number of terms — the same
    // property the recurrence task gets from the depth of its nesting.
    given: '(k^2 - c) + ((k + 1)^2 - c) + ((k + 2)^2 - c) + ((k + 3)^2 - c)',
    variables: SIGMA_INDEX_C,
    at: { k: '3', c: '1' },
    // 8 + 15 + 24 + 35. The differences are 7, 9, 11 — deliberately not
    // constant, so there is no pairing shortcut here and nothing of
    // `arithmetic-sequences` was pre-empted. That concept is authored now and
    // `ap-sum-1` is the pairing task, which makes this choice load-bearing
    // rather than merely polite: had this example been an arithmetic one, the
    // two tasks would be the same question and the earlier concept would hold
    // the later one's only argument. The assertion in tests/concepts-logic.mjs
    // derives the differences from this task's own `given` and `at`, so a
    // later edit to "simplify" the example reintroduces the overlap loudly.
    reference: '82',
  },
  {
    id: 'sigma-constant-1',
    knowledgePointId: 'a-constant-term-still-counts-the-terms',
    kind: 'evaluate',
    prompt:
      'Total the sum of the constant 7 for k running from 4 to 9. Nothing is substituted — the ' +
      'term never mentions k — but the index still runs over a definite list of values, and the ' +
      '7 is added once for each of them. Evaluate c·(hi − lo + 1) at lo = 4, hi = 9, c = 7.',
    // The method's output expression, with the limits as symbols rather than
    // the count as a number: the + 1 is visible and the 6 is not, so reading
    // the length off the limits is the work and 35 is a reachable wrong answer.
    given: 'c*(hi - lo + 1)',
    variables: SIGMA_LIMITS_C,
    at: { lo: '4', hi: '9', c: '7' },
    // 7 · 6. Five copies would be 35, which is the slip the point is about.
    reference: '42',
  },
  {
    id: 'sigma-linearity-1',
    knowledgePointId: 'linearity-moves-a-factor-out-and-splits-a-sum',
    kind: 'evaluate',
    prompt:
      'The ten numbers a₁ … a₁₀ total 12, and you are told nothing else about them. Total the ' +
      'sum of 3aₖ + 5 for k running from 1 to 10. Splitting across the plus and taking the 3 ' +
      'outside leaves 3 × (the total of the aₖ) + 5 × (how many there are) — evaluate p·s + q·m ' +
      'at p = 3, s = 12, q = 5, m = 10.',
    given: 'p*s + q*m',
    variables: SIGMA_LINEARITY,
    at: { p: '3', s: '12', q: '5', m: '10' },
    // 36 + 50. No individual aₖ appears anywhere in this task, which is the
    // claim: the total of the ten was the only fact about them that was used.
    reference: '86',
  },

  // The three on `arithmetic-sequences`, the twenty-sixth promotion and the
  // third concept to come into this subject from `sequences-and-series`. One
  // per point, as the sigma tasks above are.
  //
  // EACH `given` IS THE METHOD'S OUTPUT EXPRESSION WITH THE NUMBERS LEFT AS
  // SYMBOLS, which is the shape `sigma-constant-1` above settled on and the
  // reason these three can be ruled at all. The alternative was to hand the
  // learner the answer's ingredients already combined, and then the one move
  // each point is about would have happened in the prompt.
  //
  // What that buys, task by task, is that THE CHARACTERISTIC WRONG ANSWER IS
  // REACHABLE rather than being arithmetically impossible:
  //
  //  - `ap-term-1` keeps the `n - 1` visible and the 19 hidden, so the slip
  //    the point exists for — multiplying by the position instead of by the
  //    steps — lands on 85 rather than on a parse error. 85 is the 21st term
  //    of the same sequence, which is why the worked example names it.
  //  - `ap-position-1` keeps the `+ 1` visible and the 60 hidden, so stopping
  //    at the step count gives 60.
  //  - `ap-sum-1` keeps BOTH the `+ 1` and the halving visible and the 10
  //    hidden, so forgetting the count's `+ 1` gives 189 and forgetting to
  //    halve gives 420.
  //
  // All six of those numbers were evaluated through `exactValue` before these
  // tasks were written, so each is a real value of the task's own `given`
  // under a named misreading rather than a number somebody expected a learner
  // to produce. The suite re-derives the three references from the givens
  // independently.
  //
  // NO `domainConditions` ON ANY OF THE THREE, and the omission is checked
  // rather than overlooked. Two of the givens divide by `d`, so `d != 0` looks
  // like the honest declaration — but a zero common difference is not a
  // forbidden input to a question about THIS sequence, it is a different
  // sequence, and `domainConditions` are carried into every ruling as
  // conditions on the learner's answer. The three tasks substitute d = 4, 5
  // and 4; there is no input at which any of them is undefined, which is the
  // test the rational-expression tasks above apply.
  {
    id: 'ap-term-1',
    knowledgePointId: 'the-formula-counts-steps-not-positions',
    kind: 'evaluate',
    prompt:
      'A sequence begins 5, 9, 13, 17, … . Find its 20th term. The step is the difference '
      + 'between neighbours and the number of steps is not the number of terms — evaluate '
      + 'a + (n − 1)·d at a = 5, n = 20, d = 4.',
    given: 'a + (n - 1)*d',
    variables: AP_TERM,
    at: { a: '5', n: '20', d: '4' },
    // 5 + 19 · 4. Multiplying by 20 gives 85, which is this sequence's 21st
    // term — the slip produces a real term at the wrong position rather than a
    // number that looks wrong.
    reference: '81',
  },
  {
    id: 'ap-position-1',
    knowledgePointId: 'a-value-tells-you-its-own-position-or-that-it-has-none',
    kind: 'evaluate',
    prompt:
      'A sequence begins 2, 7, 12, 17, … and one of its terms is 302. Which term is it? Take the '
      + 'first term off, divide by the step to count the steps, and turn that count into a '
      + 'position — evaluate (v − a)/d + 1 at v = 302, a = 2, d = 5.',
    given: '(v - a)/d + 1',
    variables: AP_POSITION,
    at: { v: '302', a: '2', d: '5' },
    // 300/5 + 1. Stopping at the step count gives 60, which is why the + 1 is
    // in the given and the 60 is not.
    reference: '61',
  },
  {
    id: 'ap-sum-1',
    knowledgePointId: 'pairing-the-ends-turns-the-sum-into-a-multiplication',
    kind: 'evaluate',
    prompt:
      'Total 3 + 7 + 11 + 15 + 19 + 23 + 27 + 31 + 35 + 39. Every pair taken inwards from the '
      + 'two ends has the same total, so the sum is that total times the number of pairs — '
      + 'evaluate ((b − a)/d + 1)/2 · (a + b) at a = 3, b = 39, d = 4.',
    given: '((b - a)/d + 1)/2 * (a + b)',
    variables: AP_SUM,
    at: { a: '3', b: '39', d: '4' },
    // (36/4 + 1)/2 · 42 = 5 · 42. Dropping the count's + 1 gives 189 and
    // dropping the halving gives 420; both are slips the pairing argument is
    // what rules out, and neither is a different arithmetic error.
    reference: '210',
  },

  // The six on `mathematical-induction`, the thirty-second promotion and the
  // FOURTH concept this subject has taken from `sequences-and-series`. Two per
  // point.
  //
  // THIS IS THE FIRST CONCEPT IN THE BUILD WHOSE SUBJECT IS AN ARGUMENT AND
  // WHOSE TASKS ARE NOT ALL `evaluate`, and the reason is worth stating
  // because `geometric-proof` — the other argument-shaped concept — could not
  // do it. There, every chain ends in a claim about a figure, so the
  // refutation had to be asked as the two values it reduces to. Here the
  // inductive step IS a factorisation: you have the induction hypothesis plus
  // one new term, and the work is recognising it as the same formula one
  // position along. `transform_to_form` with `factored` rules exactly that —
  // equivalence AND shape, both checked locally in forms.ts with no worker —
  // so the step is ruled as the move it is rather than as a number it leaves.
  //
  // WHAT FORCED THE DENOMINATOR OUT OF THE TWO FACTORISATION TASKS, measured
  // rather than assumed. The natural reference for the step on
  // 1 + … + n = n(n + 1)/2 is `(k + 1)(k + 2)/2`, and `checkFactored` REFUSES
  // it: the division makes `factors()` see one factor of degree 2, so it
  // reports "is a single factor of degree 2 and is not written as a product"
  // and a learner submitting the correct answer would be marked wrong. The
  // repair is the move a human makes anyway — double both sides, factor, halve
  // at the end — so `induction-step-factor-1` asks for the DOUBLED identity
  // and the worked example's third subgoal does the doubling explicitly. That
  // is a real constraint of the form checker shaping the task, and it is the
  // honest shape rather than a workaround: clearing a denominator before
  // factoring is what the step looks like on paper.
  //
  // `(k + 1)*(k + 2)*(1/2)` DOES pass the check, and was rejected as a
  // reference. It is nobody's way of writing that expression, and a reference
  // the learner would never produce turns an equivalence check into a guessing
  // game about punctuation.
  //
  // THE CHARACTERISTIC WRONG ANSWER IS REACHABLE ON ALL SIX, verified through
  // `exactValue` before these were written rather than predicted:
  //
  //  - `induction-next-term-1` adds the (k + 1)th term, which is k + 1 and not
  //    k. Adding k gives 35 against 36 — the commonest slip in the step, and
  //    one that lands on a plausible number rather than a parse error.
  //  - `induction-base-value-1` keeps the + c OUTSIDE the halving, so reading
  //    it inside gives 5/2. The point is about computing the two sides
  //    separately, and a non-integer answer is the loudest possible signal
  //    that the claim's right side was misread rather than merely mis-added.
  //  - `induction-base-later-1` shares its `given` with the task above and
  //    that is deliberate — see its own comment.
  //  - `induction-increment-sixes-1` divides the INCREMENT by 6. Dividing the
  //    instance at k + 1 instead gives 56, and dividing by 3 — stopping where
  //    the factorisation stops — gives 42. Both are the two halves of the
  //    fourth subgoal's argument failing separately.
  //
  // NO `domainConditions` ON ANY OF THE SIX. `induction-increment-sixes-1`
  // divides by a literal 6 and the other five divide by a literal 2 or by
  // nothing, so there is no input at which any of them is undefined — which is
  // the test the `AP_*` tasks above apply and the rational-expression tasks
  // before them.
  {
    id: 'induction-step-factor-1',
    knowledgePointId: 'the-step-must-land-on-the-claim-with-k-plus-one-in-it',
    kind: 'transform_to_form',
    form: 'factored',
    prompt:
      'Assuming 1 + 2 + … + k = k(k + 1)/2, the sum to k + 1 is k(k + 1)/2 + (k + 1). Doubling '
      + 'both sides to clear the halving leaves k(k + 1) + 2(k + 1). Write that as a product. '
      + 'The step succeeds if what you get is the doubled claim at k + 1, so you are aiming at '
      + 'something you can compare with (k + 1)(k + 2) — but get there by taking out the common '
      + 'factor rather than by expanding and matching.',
    // A sum of two terms, so the given does not already satisfy `factored` —
    // confirmed through `checkForm`, which is the property the suite asserts
    // over every transform task in the build.
    given: 'k*(k + 1) + 2*(k + 1)',
    variables: INDUCTION_INDEX,
    // (k + 1)(k + 2). Both sides are 72 at k = 7 and 20 at k = 3; the identity
    // is k² + 3k + 2 either way, so the equivalence check settles it and the
    // form check is what refuses the given back unchanged.
    reference: '(k + 1)*(k + 2)',
  },
  {
    id: 'induction-next-term-1',
    knowledgePointId: 'the-step-must-land-on-the-claim-with-k-plus-one-in-it',
    kind: 'evaluate',
    prompt:
      'Assuming 1 + 2 + … + k = k(k + 1)/2, the sum to k + 1 is the sum to k plus the one new '
      + 'term. That new term is the (k + 1)th. Evaluate k(k + 1)/2 + (k + 1) at k = 7, and check '
      + 'it against the claim at k + 1 — which is (k + 1)(k + 2)/2, or 8 × 9/2.',
    given: 'k*(k + 1)/2 + (k + 1)',
    variables: INDUCTION_INDEX,
    at: { k: '7' },
    // 28 + 8. The target (k + 1)(k + 2)/2 is 8 · 9/2 = 36 too, which is the
    // whole claim of the step. Adding k rather than k + 1 gives 35 — a term too
    // few, which is the slip the second subgoal is about.
    reference: '36',
  },
  {
    id: 'induction-base-value-1',
    knowledgePointId: 'a-claim-can-be-inherited-and-false-at-every-natural',
    kind: 'evaluate',
    prompt:
      'It is claimed that 1 + 2 + … + n = n(n + 1)/2 + 3, and the inductive step for that claim '
      + 'is valid. Test the base case: evaluate the claim\'s right-hand side n(n + 1)/2 + c at '
      + 'n = 1, c = 3. The left-hand side at n = 1 is the sum of a single term, so it is 1 — and '
      + 'the claim survives only if the two agree.',
    given: 'n*(n + 1)/2 + c',
    variables: INDUCTION_OFFSET,
    at: { n: '1', c: '3' },
    // 1 + 3, against a left-hand side of 1. Reading the + c inside the halving
    // gives 5/2, which is the misreading worth catching here: the offset is
    // added to the formula, not to the product under it.
    reference: '4',
  },
  {
    id: 'induction-base-later-1',
    knowledgePointId: 'a-claim-can-be-inherited-and-false-at-every-natural',
    kind: 'evaluate',
    // THE SAME `given` AS THE TASK ABOVE, WITH A DIFFERENT `at`, AND THAT IS
    // THE TASK. The point's claim is that a valid step transmits an error
    // EXACTLY, so the gap is constant rather than shrinking — and the only way
    // to put that in front of a learner is the same formula at two positions.
    // A different expression here would be asking a different question, and
    // evaluating one position twice would be asking none.
    prompt:
      'Same claim: 1 + 2 + … + n = n(n + 1)/2 + 3. You might hope it goes wrong only near the '
      + 'start. Evaluate n(n + 1)/2 + c at n = 4, c = 3, then add up 1 + 2 + 3 + 4 by hand and '
      + 'compare the two — the size of the difference is what the question is about.',
    given: 'n*(n + 1)/2 + c',
    variables: INDUCTION_OFFSET,
    at: { n: '4', c: '3' },
    // 10 + 3, against a hand-totalled 1 + 2 + 3 + 4 = 10. Still 3 out, which
    // is the point: the step is valid, so it carries the error forward
    // undiminished and no later case will ever look any better.
    reference: '13',
  },
  {
    id: 'induction-increment-factor-1',
    knowledgePointId: 'with-no-term-to-add-the-step-is-about-the-increment',
    kind: 'transform_to_form',
    form: 'factored',
    prompt:
      'To prove n³ − n is always a multiple of 6, the step needs the gap between consecutive '
      + 'instances rather than a term to add. Write ((k + 1)³ − (k + 1)) − (k³ − k) as a '
      + 'product. Expand first and watch the cubes cancel — the difference of two cubics is a '
      + 'quadratic, which is why the step is easier than either instance it compares.',
    // A sum of three terms before expansion, so it does not already satisfy
    // `factored`. Confirmed through `checkForm`, as the task above was.
    given: '(k + 1)^3 - (k + 1) - (k^3 - k)',
    variables: INDUCTION_INDEX,
    // 3k(k + 1). Both sides are 126 at k = 6 and 18 at k = 2. Note what the
    // form check does and does not settle: it rules that the answer is a
    // product, and the FACTOR OF 6 is not in it — 3k(k + 1) is visibly a
    // multiple of 3 and the evenness of k(k + 1) is an arithmetic fact from
    // outside the algebra. That is the fourth subgoal's whole content and the
    // honest limit of what a form checker can rule here.
    reference: '3*k*(k + 1)',
  },
  {
    id: 'induction-increment-sixes-1',
    knowledgePointId: 'with-no-term-to-add-the-step-is-about-the-increment',
    kind: 'evaluate',
    prompt:
      'The increment between consecutive instances of n³ − n is 3k(k + 1). How many sixes is it '
      + 'at k = 6? Evaluate (((k + 1)³ − (k + 1)) − (k³ − k))/6 at k = 6 — written as the '
      + 'difference rather than as 3k(k + 1) so that the two instances, 210 and 336, are the '
      + 'numbers you are working with.',
    given: '((k + 1)^3 - (k + 1) - (k^3 - k))/6',
    variables: INDUCTION_INDEX,
    at: { k: '6' },
    // 126/6. Dividing the instance at k + 1 instead of the increment gives
    // 336/6 = 56, and dividing by 3 — stopping where the factorisation stops,
    // before the evenness argument — gives 42. Both are real values of this
    // task's own expression under a named misreading.
    reference: '21',
  },

  // The six on `functions-of-several-variables`, the twenty-first promotion
  // and the first concept in this subject whose input is a pair. Two per
  // point, which is the shape the last four promotions in the build settled
  // on, and all six are rational-valued with no worker.
  //
  // THE ENGINE TOOK THIS CONCEPT WITHOUT A WORKAROUND, which is unusual enough
  // to state: `parseExpression` has no trouble with two free symbols, and
  // `at` is already a `Record<string, string>` rather than one value. So
  // unlike the sigma tasks above — which could not write a Σ — and unlike the
  // matrix tasks below, nothing here is a spelled-out stand-in for a notation
  // the parser lacks. `x^2 + 3*y` at x = 3, y = 1 is the function, written as
  // the function.
  //
  // What DID shape them is that two of the three points are about a DECISION
  // rather than an arithmetic result, so each needed a number that cannot be
  // reached without making the decision correctly:
  //
  //  - For the ordered pair, the difference f(3,1) − f(1,3). A learner who
  //    reads the pair as unordered has no reason not to submit 0, and 0 is
  //    wrong. Evaluating f at one pair cannot catch that, which is why the
  //    pair of tasks is an evaluation AND a difference rather than two
  //    evaluations.
  //  - For the domain, two pairs that LOOK excluded and are not — (5,5),
  //    where the coordinates are equal, and (−4,−16), where y is the negative
  //    of x². Both are ordinary points of the domain, and the learner who has
  //    the condition wrong as y = x, or who reads (−4)² as −16, is left
  //    dividing by zero with no number to submit at all.
  //
  // The honest gap: nothing here rules "which y is excluded at x = 5". The
  // answer is 25 and it is a perfectly good number, but the only `given` that
  // produces it is `x^2`, and a prompt carrying that expression has handed
  // over the whole of the decision it was meant to test. So the excluded value
  // is found in the worked example and asked about in its subgoals, and the
  // tasks rule the pairs that survive the condition instead — the same split
  // the solve-for-x and sigma tasks use, for the same reason.
  {
    id: 'several-variables-pair-1',
    knowledgePointId: 'the-input-is-an-ordered-pair',
    kind: 'evaluate',
    prompt:
      'f(x, y) = x² + 3y. Find f(3, 1). The first number in the bracket is the x and the second '
      + 'is the y, so the squaring takes one of them and the tripling takes the other.',
    given: 'x^2 + 3*y',
    variables: SEVERAL_VARIABLES_XY,
    at: { x: '3', y: '1' },
    // 9 + 3. Matching the slots the other way gives 1 + 9 = 10, which is the
    // next task's business rather than a wrong answer to this one.
    reference: '12',
  },
  {
    id: 'several-variables-order-1',
    knowledgePointId: 'the-input-is-an-ordered-pair',
    kind: 'evaluate',
    prompt:
      'f(x, y) = x² + 3y again. Find f(3, 1) − f(1, 3). Writing a for whichever number is in '
      + 'the first slot and b for the second, that difference is (a² + 3b) − (b² + 3a); evaluate '
      + 'it at a = 3, b = 1.',
    // The two readings of the same two numbers, subtracted. The deciding number
    // is that this is NOT zero: a learner who treats the pair as unordered has
    // no route to 2, and 0 is the answer that belief produces.
    given: '(a^2 + 3*b) - (b^2 + 3*a)',
    variables: SEVERAL_VARIABLES_AB,
    at: { a: '3', b: '1' },
    // 12 − 10.
    reference: '2',
  },
  {
    id: 'several-variables-slice-x-1',
    knowledgePointId: 'holding-one-letter-leaves-a-rule-in-the-other',
    kind: 'evaluate',
    prompt:
      'f(x, y) = x²y + 4y. Hold y at 3. The y stood in BOTH terms, so the 3 goes into both of '
      + 'them and what is left is a rule in x alone: c·x² + 4c with c = 3. Find its value at '
      + 'x = 5, which is f(5, 3).',
    // The held value is a symbol rather than the number 3, so it appears twice
    // and the substitution is visible as the thing it is. Putting the 3 into
    // only the first term leaves 3x² + 4y, which still has a y in it and
    // settles nothing; the reachable wrong answer is 79, from reading that
    // leftover 4y as a bare 4.
    given: 'c*x^2 + 4*c',
    variables: SEVERAL_VARIABLES_SLICE_C,
    at: { c: '3', x: '5' },
    // 3 · 25 + 12 = 75 + 12. Directly: f(5,3) = 25 · 3 + 4 · 3 = 87.
    reference: '87',
  },
  {
    id: 'several-variables-slice-y-1',
    knowledgePointId: 'holding-one-letter-leaves-a-rule-in-the-other',
    kind: 'evaluate',
    prompt:
      'The same f(x, y) = x²y + 4y, held the other way. Fix x at 2; every term carries a y, so '
      + 'what is left is a multiple of y — (a² + 4)·y with a = 2. Find its value at y = 7, which '
      + 'is f(2, 7).',
    // The companion to the task above and the content of the point: the SAME
    // function is quadratic along the x-slice and linear along the y-slice, so
    // the two `given` expressions must differ in degree. Asserted from the
    // expressions themselves in tests/concepts-logic.mjs, because an edit that
    // "tidied" these into one shape would delete the only evidence of it.
    given: '(a^2 + 4)*b',
    variables: SEVERAL_VARIABLES_AB,
    at: { a: '2', b: '7' },
    // 8 · 7. Directly: f(2,7) = 4 · 7 + 4 · 7 = 56.
    reference: '56',
  },
  {
    id: 'several-variables-domain-1',
    knowledgePointId: 'the-domain-is-a-condition-on-both-coordinates',
    kind: 'evaluate',
    prompt:
      'f(x, y) = (x + y)/(x² − y) is undefined exactly where its denominator is zero. Decide '
      + 'whether (5, 5) is one of those pairs, and if it is not, evaluate f there: '
      + '(x + y)/(x^2 - y) at x = 5, y = 5.',
    given: '(x + y)/(x^2 - y)',
    variables: SEVERAL_VARIABLES_XY,
    at: { x: '5', y: '5' },
    domainConditions: ['x^2 - y != 0'],
    // 10/20. The pair has x = y, which is the condition a learner is most
    // likely to have mistaken for y = x²; believing it leaves them with a zero
    // denominator and no number to submit. The condition is stated here as
    // well as in the prompt because `Verdict.conditions` is never dropped.
    reference: '1/2',
  },
  {
    id: 'several-variables-domain-2',
    knowledgePointId: 'the-domain-is-a-condition-on-both-coordinates',
    kind: 'evaluate',
    prompt:
      'The same f(x, y) = (x + y)/(x² − y). The pair excluded at x = −4 is (−4, 16), because '
      + 'the condition is y = x² and a square has no sign to lose. Evaluate f at (−4, −16): '
      + '(x + y)/(x^2 - y) at x = -4, y = -16.',
    given: '(x + y)/(x^2 - y)',
    variables: SEVERAL_VARIABLES_XY,
    at: { x: '-4', y: '-16' },
    domainConditions: ['x^2 - y != 0'],
    // (−4 + −16)/(16 − (−16)) = −20/32 = −5/8. Two slips both end in a zero
    // denominator rather than a wrong number: reading (−4)² as −16, and
    // subtracting −16 as though it were +16. So the sign work is what the
    // answer costs, and the negative first coordinate is why this task exists
    // beside the one above rather than being a second (5, 5).
    reference: '-5/8',
  },

  // ── matrices-and-determinants ───────────────────────────────────────────
  //
  // EVERY TASK ASKS FOR ONE ENTRY, because the engine has no matrix type.
  // `parseExpression` knows numbers, symbols and five operators; there is no
  // way to write a matrix, so no way for an answer to be a grid.
  //
  // That is how the subject is performed anyway — nobody multiplies two
  // matrices in one step, they compute entry (1,1) and then (1,2), and the
  // rule being drilled is "row i against column j". Asking for one entry asks
  // for exactly that rule. The matrices live in the prompt and their entries
  // are the symbols.
  //
  // The honest gap: nothing here tests laying a product out. A learner could
  // get every entry right and still not produce the grid. That is the
  // verifier's limit, not the curriculum's.
  //
  // This comment used to end "and it is why `gaussian-elimination` is left
  // mapped — its answer IS a matrix in a normal form". Both clauses are still
  // true and the inference was not: the answer being a matrix is why that
  // concept could not be asked for AS a matrix, and the tasks above are this
  // file's own demonstration that nothing here ever is. It is authored in
  // `expressions-and-equations`, where with no grid to display it is three
  // equations and every task asks for a number the elimination produces.
  //
  // One matrix pair runs through the whole subject — A = [[2,-1],[3,4]] and
  // B = [[5,0],[3,1]] — so a learner meets the same numbers in every concept
  // and can see det(A) = 11 reappear as the denominator of the inverse.
  {
    id: 'columns-basis-1',
    knowledgePointId: 'the-columns-are-where-the-basis-goes',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find the first component of A·e₁ where e₁ = (1, 0) — that is, ' +
      'evaluate a₁₁·1 + a₁₂·0. The answer is the top of column 1, which is the point.',
    given: 'a11*x1 + a12*x2',
    variables: MATRIX_ROW_VEC,
    at: { a11: '2', a12: '-1', x1: '1', x2: '0' },
    reference: '2',
  },
  {
    id: 'linearity-1',
    knowledgePointId: 'a-matrix-respects-addition-and-scaling',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]], u = (1, 2), v = (3, −1). Find the first component of A(u + v) by ' +
      'adding the vectors first. Computing Au + Av instead must give the same answer — that is ' +
      'linearity.',
    given: 'a11*(u1 + v1) + a12*(u2 + v2)',
    variables: [
      { name: 'a11', assumptions: { real: true } },
      { name: 'a12', assumptions: { real: true } },
      { name: 'u1', assumptions: { real: true } },
      { name: 'u2', assumptions: { real: true } },
      { name: 'v1', assumptions: { real: true } },
      { name: 'v2', assumptions: { real: true } },
    ],
    at: { a11: '2', a12: '-1', u1: '1', u2: '2', v1: '3', v2: '-1' },
    // u + v = (4, 1); 2·4 − 1 = 7. And Au + Av = 0 + 7 = 7.
    reference: '7',
  },
  {
    id: 'image-span-1',
    knowledgePointId: 'the-image-is-the-span-of-the-columns',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find the first component of 2·(column 1) + 3·(column 2). This is ' +
      'the same thing as applying A to the vector (2, 3) — combining columns and feeding in a ' +
      'vector are one operation.',
    given: 'c1*a11 + c2*a12',
    variables: [
      { name: 'c1', assumptions: { real: true } },
      { name: 'c2', assumptions: { real: true } },
      { name: 'a11', assumptions: { real: true } },
      { name: 'a12', assumptions: { real: true } },
    ],
    at: { c1: '2', c2: '3', a11: '2', a12: '-1' },
    // 4 − 3 = 1.
    reference: '1',
  },
  {
    id: 'row-by-column-1',
    knowledgePointId: 'row-against-column',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]] and B = [[5, 0], [3, 1]]. Find entry (1,1) of AB: row 1 of A ' +
      'against column 1 of B.',
    given: 'a11*b11 + a12*b21',
    variables: MATRIX_AB,
    at: { a11: '2', a12: '-1', b11: '5', b21: '3' },
    // 10 − 3 = 7.
    reference: '7',
  },
  {
    id: 'order-matters-ab-1',
    knowledgePointId: 'matrix-order-matters',
    kind: 'evaluate',
    prompt:
      'Same A and B, the other way round: find entry (1,1) of BA — row 1 of B against column 1 ' +
      'of A. Compare with 7, which is what AB gave.',
    given: 'b11*a11 + b12*a21',
    variables: [
      { name: 'b11', assumptions: { real: true } },
      { name: 'b12', assumptions: { real: true } },
      { name: 'a11', assumptions: { real: true } },
      { name: 'a21', assumptions: { real: true } },
    ],
    at: { b11: '5', b12: '0', a11: '2', a21: '3' },
    // 10 + 0 = 10. One differing entry proves AB ≠ BA.
    reference: '10',
  },
  {
    id: 'associative-1',
    knowledgePointId: 'grouping-does-not-matter',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]], B = [[5, 0], [3, 1]], C = the column (1, 2). Find the first ' +
      'component of A(BC) — innermost first. Grouping as (AB)C does different arithmetic and ' +
      'must reach the same number.',
    given: 'a11*(b11*c1 + b12*c2) + a12*(b21*c1 + b22*c2)',
    variables: [
      ...MATRIX_AB,
      { name: 'b12', assumptions: { real: true } },
      { name: 'b22', assumptions: { real: true } },
      { name: 'c1', assumptions: { real: true } },
      { name: 'c2', assumptions: { real: true } },
    ],
    at: { a11: '2', a12: '-1', b11: '5', b12: '0', b21: '3', b22: '1', c1: '1', c2: '2' },
    // BC = (5, 5); 2·5 − 5 = 5. And (AB)C = 7·1 − 1·2 = 5.
    reference: '5',
  },
  {
    id: 'det-2x2-1',
    knowledgePointId: 'ad-minus-bc',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[2, −1], [3, 4]] — that is ad − bc. It is the factor every area ' +
      'is multiplied by, and its sign says whether orientation survived.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // 8 + 3 = 11. This number reappears as the inverse's denominator.
    reference: '11',
  },
  {
    id: 'det-zero-1',
    knowledgePointId: 'zero-means-collapse',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[2, 4], [1, 2]]. Its columns are (2,1) and (4,2) — one is twice ' +
      'the other, so the map crushes the plane onto a line and the answer should say so.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '4', c: '1', d: '2' },
    reference: '0',
  },
  {
    id: 'det-multiplies-1',
    knowledgePointId: 'the-determinant-multiplies',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]] and B = [[5, 0], [3, 1]]. Find det(A)·det(B), which is det(AB) — so ' +
      'you get the determinant of the product without computing a single entry of it.',
    given: '(a*d - b*c)*(p*s - q*r)',
    variables: [
      ...MATRIX_ABCD,
      { name: 'p', assumptions: { real: true } },
      { name: 'q', assumptions: { real: true } },
      { name: 'r', assumptions: { real: true } },
      { name: 's', assumptions: { real: true } },
    ],
    at: { a: '2', b: '-1', c: '3', d: '4', p: '5', q: '0', r: '3', s: '1' },
    // 11 · 5 = 55.
    reference: '55',
  },
  {
    id: 'inverse-entry-1',
    knowledgePointId: 'swap-negate-divide',
    kind: 'evaluate',
    prompt:
      'A = [[2, −1], [3, 4]]. Find entry (1,1) of A⁻¹, which is d/det — swap the diagonal, ' +
      'negate the other two, divide by ad − bc. Give the exact fraction.',
    given: 'd/(a*d - b*c)',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // 4/11. The division is the only step that can fail.
    reference: '4/11',
  },
  {
    id: 'inverse-identity-matrix-1',
    knowledgePointId: 'it-composes-to-the-identity',
    kind: 'evaluate',
    prompt:
      'With A = [[2, −1], [3, 4]] and A⁻¹ = (1/11)[[4, 1], [−3, 2]], verify entry (1,1) of A⁻¹A: ' +
      'row 1 of the adjugate against column 1 of A, over the determinant. The identity has 1 there.',
    given: '(d*a + (-b)*c)/(a*d - b*c)',
    variables: MATRIX_ABCD,
    at: { a: '2', b: '-1', c: '3', d: '4' },
    // (8 + 3)/11 = 1. The numerator IS the determinant — that cancellation is
    // the reason the formula divides by det at all.
    reference: '1',
  },
  {
    id: 'singular-no-inverse-1',
    knowledgePointId: 'singular-means-no-inverse',
    kind: 'evaluate',
    prompt:
      'Find the determinant of [[6, 3], [4, 2]]. A zero here is why no inverse exists — not ' +
      'because the formula divides by zero, but because the map sent two different vectors to ' +
      'the same place.',
    given: 'a*d - b*c',
    variables: MATRIX_ABCD,
    at: { a: '6', b: '3', c: '4', d: '2' },
    reference: '0',
  },

  // ── matrices-and-determinants: the fifth concept ────────────────────────
  //
  // FOUR TASKS ON A DIFFERENT MATRIX, AND THE SWITCH IS FORCED RATHER THAN
  // CHOSEN. The twelve tasks above run on A = [[2,-1],[3,4]], and that matrix
  // has NO REAL EIGENVALUE — its characteristic polynomial is L^2 - 6L + 11
  // and 36 - 44 is negative. So these four use A = [[3,1],[2,2]], whose
  // eigenvalues are 1 and 4 and whose eigenvectors are (1,1) and (1,-2),
  // every number in sight an integer. One matrix still runs through all four,
  // which is the discipline the comment above describes; it is just not the
  // same one.
  //
  // NOT ONE OF THE FOUR IS A QUADRATIC SOLVE, which is the point they exist to
  // make. ontology-matrices.ts refused this concept for years on the ground
  // that its honest task is "solve the characteristic polynomial", and that
  // refusal is overturned in that file's header by counting what the concept
  // actually asks. These four are the arithmetic half of the count: a scale
  // factor read as a ratio, the characteristic determinant evaluated at an
  // eigenvalue, the second eigenvalue from the diagonal sum with no polynomial
  // at all, and a component of the direction. The factoring step belongs to
  // `polynomial-roots`, which is a prerequisite of this concept, and the worked
  // example hands it back there by name.
  {
    id: 'eigenvalue-as-a-ratio-1',
    knowledgePointId: 'a-direction-the-map-only-scales',
    kind: 'evaluate',
    prompt:
      'A = [[3, 1], [2, 2]] and v = (3, 3). Apply A to v and divide the first component of the ' +
      'output by the first component of v — that ratio is the eigenvalue. The second components ' +
      'must give the same ratio, and that they agree is what makes v an eigenvector at all.',
    given: '(a11*v1 + a12*v2)/v1',
    variables: [
      { name: 'a11', assumptions: { real: true } },
      { name: 'a12', assumptions: { real: true } },
      { name: 'v1', assumptions: { real: true } },
      { name: 'v2', assumptions: { real: true } },
    ],
    at: { a11: '3', a12: '1', v1: '3', v2: '3' },
    // Av = (12, 12), so 12/3 = 4. The vector is (3,3) rather than (1,1) on
    // purpose: the division is then real arithmetic, and a multiple of an
    // eigenvector is an eigenvector with the SAME eigenvalue, which is the
    // third point's last subgoal met early.
    reference: '4',
  },
  {
    id: 'characteristic-determinant-vanishes-1',
    knowledgePointId: 'det-of-a-minus-lambda-i-vanishes',
    kind: 'evaluate',
    prompt:
      'A = [[3, 1], [2, 2]]. Evaluate det(A − LI) = (a − L)(d − L) − bc at L = 4 — that is, the ' +
      'determinant of [[3 − 4, 1], [2, 2 − 4]]. Being an eigenvalue IS this determinant ' +
      'vanishing, so the answer is a check on whether 4 is one.',
    given: '(a - L)*(d - L) - b*c',
    variables: [
      ...MATRIX_ABCD,
      { name: 'L', assumptions: { real: true } },
    ],
    at: { a: '3', b: '1', c: '2', d: '2', L: '4' },
    // (-1)(-2) - 2 = 2 - 2 = 0. The two negatives are the trap and they
    // multiply to a positive, which is the only way the subtraction can bring
    // the expression to zero rather than to -4.
    reference: '0',
  },
  {
    id: 'second-eigenvalue-from-the-diagonal-sum-1',
    knowledgePointId: 'det-of-a-minus-lambda-i-vanishes',
    kind: 'evaluate',
    prompt:
      'A = [[3, 1], [2, 2]], and one of its eigenvalues is 4. The two eigenvalues add up to the ' +
      'diagonal sum a + d, because that is where the characteristic polynomial\'s middle ' +
      'coefficient comes from. Find the other eigenvalue.',
    given: '(a + d) - L1',
    variables: [
      { name: 'a', assumptions: { real: true } },
      { name: 'd', assumptions: { real: true } },
      { name: 'L1', assumptions: { real: true } },
    ],
    at: { a: '3', d: '2', L1: '4' },
    // 5 - 4 = 1. A second eigenvalue with no polynomial anywhere in it, which
    // is the clearest single answer to "this is factoring-quadratics wearing a
    // hat". The product check is the other half: 4 * 1 = 4 = ad - bc.
    reference: '1',
  },
  {
    id: 'eigenvector-component-1',
    knowledgePointId: 'the-direction-comes-from-the-collapse',
    kind: 'evaluate',
    prompt:
      'A = [[3, 1], [2, 2]] with L = 1, so A − LI = [[2, 1], [2, 1]] and both rows demand ' +
      '(a − L)x + by = 0. Take x = 1 and find y — the second component of the direction A ' +
      'leaves unmoved.',
    given: '-(a - L)*x/b',
    variables: [
      { name: 'a', assumptions: { real: true } },
      { name: 'b', assumptions: { real: true } },
      { name: 'L', assumptions: { real: true } },
      { name: 'x', assumptions: { real: true } },
    ],
    at: { a: '3', b: '1', L: '1', x: '1' },
    // -(3-1)*1/1 = -2, giving (1, -2). Check: A(1,-2) = (3-2, 2-4) = (1,-2),
    // unchanged, which is what an eigenvalue of 1 asserts. x = 1 is a choice
    // and the answer is the line through it, which the worked example says
    // and no single-number task can.
    reference: '-2',
  },

  // ── vectors-and-independence ────────────────────────────────────────────
  //
  // Twelve tasks, all exactly rulable: three on the plane the components are
  // read off, then nine on components. Two vector pairs run through the
  // component half of the subject — u = (2,-1) with v = (1,3) independent, and
  // u with w = (6,-3) dependent — so the same numbers answer "is it in the
  // span", "is it independent" and "what does it cost", and a learner can see
  // the cross-check give 7 and then 0 on pairs they already know the shape of.
  //
  // The three plane tasks do the same thing one level down, with two points
  // reused throughout: P = (-4, 7) and Q = (2, 7) answer "which quadrant" and
  // "how far apart" in turn, and their shared second coordinate is the whole
  // point of the second question. The first task uses (3, 5) and (5, 3)
  // instead, because what it is about is the swap.
  {
    id: 'ordered-pair-1',
    knowledgePointId: 'a-point-is-an-ordered-pair',
    kind: 'evaluate',
    prompt:
      'P = (3, 5) and Q = (5, 3). Evaluate the difference of their FIRST coordinates. Points are ' +
      'equal only when both coordinates agree, so one disagreement is enough to tell them apart.',
    given: 'p1 - q1',
    variables: POINT_PQ,
    at: { p1: '3', q1: '5' },
    // 3 - 5 = -2. Negative rather than positive because P is the left-hand
    // point; the sign is not incidental here, it is the next task but one.
    reference: '-2',
  },
  {
    id: 'quadrant-signs-1',
    knowledgePointId: 'the-signs-name-the-quadrant',
    kind: 'evaluate',
    prompt:
      'P = (-4, 7). Evaluate the product of its coordinates. A negative product means the two ' +
      'coordinates have opposite signs, which leaves quadrants II and IV — and the positive ' +
      'second coordinate then picks II.',
    // A proxy, named as one, the same way `span-line-1` below is: the question
    // is "which quadrant" and the answer to that is not a number. The product
    // is the step that halves it and is exactly checkable; the prompt carries
    // the half the arithmetic cannot settle, rather than pretending -28 is the
    // quadrant.
    given: 'p1 * p2',
    variables: POINT_PQ,
    at: { p1: '-4', p2: '7' },
    reference: '-28',
  },
  {
    id: 'coordinate-separation-1',
    knowledgePointId: 'separation-is-one-axis-at-a-time',
    kind: 'evaluate',
    prompt:
      'P = (-4, 7) and Q = (2, 7). Find the horizontal separation by evaluating the first ' +
      'coordinate of Q minus the first coordinate of P. The vertical difference is 7 - 7 = 0, so ' +
      'the points are the same height and this one number is the whole distance.',
    given: 'q1 - p1',
    variables: POINT_PQ,
    at: { q1: '2', p1: '-4' },
    // 2 - (-4) = 6. Subtracting across zero is the arithmetic this task is
    // really drilling, which is why the pair straddles the axis.
    reference: '6',
  },
  {
    id: 'magnitude-1',
    knowledgePointId: 'a-vector-is-a-displacement',
    kind: 'evaluate',
    prompt:
      'v = (3, 4). Find |v| — the components are the legs of a right triangle and the vector is ' +
      'the hypotenuse, so this is (3² + 4²)^(1/2).',
    // `^(1/2)` rather than `sqrt(...)`: `exactValue` returns null for a
    // `function` node, so sqrt cannot be settled locally while a rational
    // exponent goes through `exactRoot`. 25^(1/2) is exactly 5.
    given: '(v1^2 + v2^2)^(1/2)',
    variables: VEC_V,
    at: { v1: '3', v2: '4' },
    reference: '5',
  },
  {
    id: 'vector-add-1',
    knowledgePointId: 'adding-is-tip-to-tail',
    kind: 'evaluate',
    prompt:
      'u = (3, 4) and v = (−1, 2). Find the first component of u + v. The components never ' +
      'interact — going across does not change how far up you are.',
    given: 'u1 + v1',
    variables: VEC_UV,
    at: { u1: '3', v1: '-1' },
    reference: '2',
  },
  {
    id: 'vector-scale-1',
    knowledgePointId: 'scaling-stretches-and-flips',
    kind: 'evaluate',
    prompt:
      'u = (2, −1). Find the first component of 3u. Every scalar multiple of u lies on one line ' +
      'through the origin, which is what the next concept calls its span.',
    given: 'c*u1',
    variables: [{ name: 'c', assumptions: { real: true } }, ...VEC_U],
    at: { c: '3', u1: '2' },
    reference: '6',
  },
  {
    id: 'combination-1',
    knowledgePointId: 'a-linear-combination',
    kind: 'evaluate',
    prompt:
      'u = (2, −1) and v = (1, 3). Find the first component of 2u + 3v — scale each, then add.',
    given: 'c1*u1 + c2*v1',
    variables: VEC_WEIGHTED,
    at: { c1: '2', c2: '3', u1: '2', v1: '1' },
    // 4 + 3 = 7.
    reference: '7',
  },
  {
    id: 'span-line-1',
    knowledgePointId: 'one-vector-spans-a-line',
    kind: 'evaluate',
    prompt:
      'Is w = (6, −3) in the span of u = (2, −1)? The first components force the multiple to be ' +
      '6/2; evaluate 6/2 − (−3)/(−1) to check the second agrees. Zero means yes.',
    // A proxy, named as one: "is it in the span" wants yes or no. The ratio
    // difference is the computation that decides it, and it is checkable.
    given: 'w1/u1 - w2/u2',
    variables: VEC_UW,
    at: { w1: '6', w2: '-3', u1: '2', u2: '-1' },
    // 3 − 3 = 0, so w = 3u.
    reference: '0',
  },
  {
    id: 'span-plane-1',
    knowledgePointId: 'two-vectors-usually-span-the-plane',
    kind: 'evaluate',
    prompt:
      'u = (2, −1), v = (1, 3). Show 3u + 1v reaches (7, 0) by evaluating its SECOND component. ' +
      'The first comes to 7.',
    given: 'c1*u2 + c2*v2',
    variables: VEC_WEIGHTED_2,
    at: { c1: '3', c2: '1', u2: '-1', v2: '3' },
    // −3 + 3 = 0.
    reference: '0',
  },
  {
    id: 'dependent-1',
    knowledgePointId: 'dependent-means-redundant',
    kind: 'evaluate',
    prompt:
      'u = (2, −1) and w = (6, −3). Evaluate the first component of w − 3u. Vanishing means w ' +
      'was already reachable from u, so it added nothing.',
    given: 'w1 - c*u1',
    variables: [...VEC_UW, { name: 'c', assumptions: { real: true } }],
    at: { w1: '6', w2: '-3', u1: '2', u2: '-1', c: '3' },
    reference: '0',
  },
  {
    id: 'cross-check-independent-1',
    knowledgePointId: 'the-cross-check',
    kind: 'evaluate',
    prompt:
      'Apply the cross-check u₁v₂ − u₂v₁ to u = (2, −1) and v = (1, 3). Non-zero means ' +
      'independent. No division is needed, which matters when a component is zero.',
    given: 'u1*v2 - u2*v1',
    variables: VEC_UV_FULL,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3' },
    // 6 + 1 = 7. This is the 2x2 determinant, met properly in the matrices
    // subject — deliberately with no prerequisite edge, which would cycle.
    reference: '7',
  },
  {
    id: 'cross-check-dependent-1',
    knowledgePointId: 'dependence-costs-a-dimension',
    kind: 'evaluate',
    prompt:
      'Same cross-check on u = (2, −1) and w = (6, −3). A zero here means two vectors still only ' +
      'reach a line, so (7, 0) is unreachable however the weights are chosen.',
    given: 'u1*v2 - u2*v1',
    variables: VEC_UV_FULL,
    at: { u1: '2', u2: '-1', v1: '6', v2: '-3' },
    // −6 + 6 = 0.
    reference: '0',
  },

  /*
   * The dot product — six tasks, two on each of its three knowledge points.
   *
   * Every one is settled by exact arithmetic with no worker, and in this
   * concept that took choosing the components rather than being lucky. The
   * identity `cos θ = (a·b)/(|a||b|)` divides by two magnitudes, and a
   * magnitude is a square root: the quotient is rational only when both come
   * out whole. (3, 4) and (4, 3) give 5 and 5, and (3, 4) and (6, 8) give 5 and
   * 10, so the two cosine tasks are 24/25 and exactly 1. The obtuse pair
   * (3, 4) and (−4, 1) has |v| = √17 and therefore an irrational cosine, which
   * is why that task asks for the PRODUCT and reads its sign — the sign is
   * exact where the cosine is not, and the knowledge point says so.
   *
   * Nothing here asks for an angle, for the reason ontology-vectors.ts gives at
   * length: 24/25 is the answer and 16.26° is a rounding of it. That is the
   * same refusal `right-triangle-trig` makes about its own quotients and the
   * same one `pythagoras` makes about a surd, so three concepts in a row now
   * stop at the exact quantity rather than at a decimal that reads as more
   * finished.
   *
   * `^(1/2)` rather than `sqrt(...)`, as `magnitude-1` above explains:
   * `exactValue` returns null on a function node, while a rational exponent
   * goes through `exactRoot`, so 25^(1/2) is exactly 5 and the whole quotient
   * rules locally.
   */
  {
    id: 'dot-product-1',
    knowledgePointId: 'the-product-of-two-vectors-is-a-number',
    kind: 'evaluate',
    prompt:
      'a = (3, 4) and b = (4, 3). Find a·b by multiplying the components that match — first with ' +
      'first, second with second — and adding. The answer is a number, not a vector, which is the ' +
      'whole novelty of this operation.',
    given: 'u1*v1 + u2*v2',
    variables: VEC_UV_FULL,
    at: { u1: '3', u2: '4', v1: '4', v2: '3' },
    // 12 + 12 = 24. Pairing crosswise instead would give 9 + 16 = 25, which is
    // why the prompt says which products the definition allows.
    reference: '24',
  },
  {
    id: 'dot-product-self-1',
    knowledgePointId: 'the-product-of-two-vectors-is-a-number',
    kind: 'evaluate',
    prompt:
      'a = (3, 4). Find a·a. You have computed this sum of squares before in this subject, as the ' +
      'inside of |a| — so the answer is |a|², and the magnitude turns out to have been a dot ' +
      'product.',
    given: 'u1*u1 + u2*u2',
    variables: VEC_U,
    at: { u1: '3', u2: '4' },
    // 9 + 16 = 25 = 5². `magnitude-1` asks for the 5; this asks for the 25,
    // which is the quantity the identity a·a = |a|² is about.
    reference: '25',
  },
  {
    id: 'perpendicular-zero-1',
    knowledgePointId: 'a-zero-product-is-a-right-angle',
    kind: 'evaluate',
    prompt:
      'u = (3, 4) and v = (−4, 3). Find u·v. A zero means the two arrows are at right angles, and ' +
      'the triangle they make has sides 5, 5 and |u − v| with |u − v|² = 50 — which is 25 + 25, so ' +
      'the converse of Pythagoras is what supplies the angle.',
    given: 'u1*v1 + u2*v2',
    variables: VEC_UV_FULL,
    at: { u1: '3', u2: '4', v1: '-4', v2: '3' },
    // −12 + 12 = 0.
    reference: '0',
  },
  {
    id: 'obtuse-sign-1',
    knowledgePointId: 'a-zero-product-is-a-right-angle',
    kind: 'evaluate',
    prompt:
      'u = (3, 4) and v = (−4, 1). Find u·v. The sign is the answer to "acute, right or obtuse", ' +
      'because |u|² + |v|² − |u − v|² is twice this product and that difference is the converse of ' +
      'Pythagoras\'s own three-way test.',
    given: 'u1*v1 + u2*v2',
    variables: VEC_UV_FULL,
    at: { u1: '3', u2: '4', v1: '-4', v2: '1' },
    // −12 + 4 = −8, so obtuse. |v| = √17 here, so the cosine of this angle is
    // irrational — the sign is settled exactly anyway, which is the point of
    // asking for the product rather than for the cosine.
    reference: '-8',
  },
  {
    id: 'cosine-exact-1',
    knowledgePointId: 'the-product-gives-the-cosine-not-the-angle',
    kind: 'evaluate',
    prompt:
      'a = (3, 4) and b = (4, 3). Find cos θ exactly, as a·b divided by the two magnitudes. Give ' +
      'the quotient and not a figure in degrees: the quotient is exact, and turning it into an ' +
      'angle needs a table nobody here has.',
    given: '(u1*v1 + u2*v2) / ((u1^2 + u2^2)^(1/2) * (v1^2 + v2^2)^(1/2))',
    variables: VEC_UV_FULL,
    at: { u1: '3', u2: '4', v1: '4', v2: '3' },
    // 24/(5·5) = 24/25, which is just under 1 — the two arrows nearly agree in
    // direction. About 16.26°, which the prompt refuses to ask for.
    reference: '24/25',
  },
  {
    id: 'cosine-aligned-1',
    knowledgePointId: 'the-product-gives-the-cosine-not-the-angle',
    kind: 'evaluate',
    prompt:
      'a = (3, 4) and b = (6, 8). Find cos θ the same way. The answer is the largest a cosine can ' +
      'be, which says b points the same way as a — and indeed b = 2a, so this is the ceiling the ' +
      'span of a single vector was always going to hit.',
    given: '(u1*v1 + u2*v2) / ((u1^2 + u2^2)^(1/2) * (v1^2 + v2^2)^(1/2))',
    variables: VEC_UV_FULL,
    at: { u1: '3', u2: '4', v1: '6', v2: '8' },
    // (18 + 32)/(5·10) = 50/50 = 1.
    reference: '1',
  },

  // ── vectors-and-independence, thirteenth promotion: three dimensions ────
  //
  // Eight tasks, two on each of the four points, every one `evaluate` and
  // every one settled by exact arithmetic with no worker — which is the
  // subject's standing contract and is asserted per promotion rather than
  // assumed.
  //
  // THE COMPONENTS WERE CHOSEN SO THAT NO ROOT IS EVER LEFT IRRATIONAL IN AN
  // ANSWER, which is the constraint that shaped these and is invisible in the
  // finished set. a = (2, 3, 6) is the smallest triple whose magnitude is a
  // whole number and whose first two components are not themselves a (3, 4):
  // 4 + 9 + 36 = 49, so |a| = 7 and the floor diagonal is 13^(1/2), which is
  // the point — the intermediate length is irrational and the answer is not,
  // so the worked example can show the root being squared away rather than
  // asserting that it is.
  //
  // THE OTHER THREE POINTS DELIBERATELY SHARE ONE FIGURE. n = (2, -1, 2) is
  // the normal, P = (1, 2, 3) the point on the plane, and u = (1, 2, 0) and
  // v = (0, 2, 1) two displacements inside it; |n| = 3 exactly, n·u = 0, the
  // plane is 2x - y + 2z = 6, and u x v comes back as n itself rather than as a
  // multiple of it. So a learner meets 0 as a perpendicularity, then 6 as a
  // plane's constant, then 6 again at a second point of the same plane, then
  // n a third time as a cross product — four tasks whose answers are about one
  // figure, which is what the plane tasks above do with P = (-4, 7) and
  // Q = (2, 7).
  //
  // NO TASK ASKS FOR A VECTOR, because `evaluate` produces a number. The cross
  // product is therefore asked for one component at a time and the prompt says
  // which, the same way `quadrant-signs-1` names itself a proxy: the question
  // is "what is u x v" and the answer to that is not a number, so the tasks
  // take the first component and the perpendicularity check, and the worked
  // example carries the triple the arithmetic cannot return.
  {
    id: 'space-magnitude-1',
    knowledgePointId: 'space-adds-one-coordinate-and-one-term',
    kind: 'evaluate',
    prompt:
      'a = (2, 3, 6). Find |a|. Each perpendicular axis contributes its square and nothing else, ' +
      'so this is (2² + 3² + 6²)^(1/2) — Pythagoras applied twice, with the first square root ' +
      'squared away again.',
    given: '(a1^2 + a2^2 + a3^2)^(1/2)',
    variables: VEC_A_3D,
    at: { a1: '2', a2: '3', a3: '6' },
    // 4 + 9 + 36 = 49, and 49^(1/2) is exactly 7. `^(1/2)` rather than
    // `sqrt(...)` for the reason `magnitude-1` gives: `exactValue` returns null
    // on a `function` node, so sqrt could not be settled locally.
    reference: '7',
  },
  {
    id: 'space-dot-self-1',
    knowledgePointId: 'space-adds-one-coordinate-and-one-term',
    kind: 'evaluate',
    prompt:
      'a = (2, 3, 6). Find a·a, with one product per axis. You have just computed this sum as the ' +
      'inside of |a|, so the answer is |a|² — the identity from the plane survives the extra term ' +
      'because the definition grew by one product and nothing else.',
    given: 'a1*a1 + a2*a2 + a3*a3',
    variables: VEC_A_3D,
    at: { a1: '2', a2: '3', a3: '6' },
    // 4 + 9 + 36 = 49 = 7². `space-magnitude-1` asks for the 7; this asks for
    // the 49, which is the quantity a·a = |a|² is about. The two-component
    // version of this pair is `magnitude-1` and `dot-product-self-1`.
    reference: '49',
  },
  {
    id: 'space-dot-product-1',
    knowledgePointId: 'every-plane-fact-extends-and-one-does-not',
    kind: 'evaluate',
    prompt:
      'n = (2, −1, 2) and u = (1, 2, 0). Find n·u. A zero still means a right angle, and in this ' +
      'case the triangle the two arrows make has squared sides 9, 5 and 14 — so 9 + 5 = 14 and ' +
      'the converse of Pythagoras is what supplies the angle, exactly as it did in the plane.',
    given: 'u1*v1 + u2*v2 + u3*v3',
    variables: VEC_UV_3D,
    at: { u1: '2', u2: '-1', u3: '2', v1: '1', v2: '2', v3: '0' },
    // 2 - 2 + 0 = 0. |n| = 3 and |u| = 5^(1/2), so the cosine's denominator is
    // irrational and the quotient is exact anyway — the knowledge point's third
    // subgoal, and the reason this task asks for the product and not the cosine.
    reference: '0',
  },
  {
    id: 'space-third-side-1',
    knowledgePointId: 'every-plane-fact-extends-and-one-does-not',
    kind: 'evaluate',
    prompt:
      'n = (2, −1, 2) and u = (1, 2, 0). Find |n − u|², the square of the third side of the ' +
      'triangle the two arrows make. This is the one number the converse of Pythagoras needs that ' +
      'is not a magnitude of n or of u.',
    given: '(u1 - v1)^2 + (u2 - v2)^2 + (u3 - v3)^2',
    variables: VEC_UV_3D,
    at: { u1: '2', u2: '-1', u3: '2', v1: '1', v2: '2', v3: '0' },
    // n - u = (1, -3, 2), so 1 + 9 + 4 = 14 — which is |n|² + |u|² = 9 + 5, and
    // that equality is the right angle. Asked as a square because |n - u| is
    // 14^(1/2) and irrational; the squared side is what the converse compares.
    reference: '14',
  },
  {
    id: 'plane-constant-1',
    knowledgePointId: 'one-equation-in-space-is-a-plane',
    kind: 'evaluate',
    prompt:
      'A plane passes through P = (1, 2, 3) and is perpendicular to n = (2, −1, 2). Its equation ' +
      'is n·r = d for a single constant d, so find d by evaluating n·P. The three coefficients of ' +
      'the equation are then n itself.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '2', n2: '-1', n3: '2', r1: '1', r2: '2', r3: '3' },
    // 2 - 2 + 6 = 6, so the plane is 2x - y + 2z = 6.
    reference: '6',
  },
  {
    id: 'plane-membership-1',
    knowledgePointId: 'one-equation-in-space-is-a-plane',
    kind: 'evaluate',
    prompt:
      'A plane has normal vector (2, −1, 2), so its equation reads 2x − y + 2z = d. Evaluate the ' +
      'left-hand side at the point (2, 4, 3). Comparing what you get with the value at ' +
      '(1, 2, 3) is what decides whether the two points lie on the same plane.',
    // The constant is NOT stated, here or in `plane-constant-1`'s prompt, which
    // is what stops this being a free mark: a prompt reading "= 6" would hand
    // over the number the task asks for.
    given: '2*x - y + 2*z',
    variables: PLANE_XYZ,
    at: { x: '2', y: '4', z: '3' },
    // 4 - 4 + 6 = 6, the same as at P — because the step from P to here was
    // (1, 2, 0), and n·(1, 2, 0) = 0 by `space-dot-product-1`.
    reference: '6',
  },
  {
    id: 'cross-product-component-1',
    knowledgePointId: 'the-cross-product-is-a-choice-of-direction',
    kind: 'evaluate',
    prompt:
      'u = (1, 2, 0) and v = (0, 2, 1). Find the FIRST component of u × v. It ignores the first ' +
      'coordinates and runs the plane\'s crosswise-and-subtract test on the second and third: ' +
      'u₂v₃ − u₃v₂.',
    given: 'u2*v3 - u3*v2',
    variables: VEC_UV_3D,
    at: { u1: '1', u2: '2', u3: '0', v1: '0', v2: '2', v3: '1' },
    // 2·1 - 0·2 = 2. The whole product is (2, -1, 2); a vector is not something
    // `evaluate` can return, which is why this asks for one component and the
    // prompt says which.
    reference: '2',
  },
  {
    id: 'cross-product-perpendicular-1',
    knowledgePointId: 'the-cross-product-is-a-choice-of-direction',
    kind: 'evaluate',
    prompt:
      'u = (1, 2, 0), and w = u × v has come out as (2, −1, 2). Find u·w. This is the check that ' +
      'the formula really did return something perpendicular to what went into it, rather than ' +
      'merely something built from the right six numbers.',
    given: 'u1*w1 + u2*w2 + u3*w3',
    variables: VEC_UW_3D,
    at: { u1: '1', u2: '2', u3: '0', w1: '2', w2: '-1', w3: '2' },
    // 2 - 2 + 0 = 0. v·w = 0 - 2 + 2 = 0 as well; the knowledge point does both
    // and this task takes the one whose arithmetic is not the same as
    // `space-dot-product-1`'s.
    reference: '0',
  },

  /*
   * The axioms — six tasks, two on each of the three points, the twentieth
   * promotion. Every one exact with no worker, which is this subject's standing
   * contract, and here it needed no choosing: there is not a square root in the
   * concept.
   *
   * WHAT DID NEED CHOOSING IS THE VERDICTS. The content of a subspace test is
   * that a value of 0 means "closed" and anything else means "not", so a task
   * set that only ever returns 0 teaches the arithmetic and hides the decision —
   * a learner can score full marks by answering 0 to everything. So the two
   * closure tasks are the SAME `given` at two different inputs, where the two
   * answers differ in KIND: `subspace-closed-sum-1` returns 0 on a plane
   * through the origin and `not-a-subspace-constant-doubles-1` returns 12 on a
   * plane that misses it. That is the habit `geometric-proof` established for a
   * pair of tasks whose point is an asymmetry, and it is the only way the
   * asymmetry gets scored rather than narrated.
   *
   * THE FIGURE IS THE ONE FROM THE CONCEPT BELOW IT, deliberately. n = (2, −1, 2)
   * is `plane-constant-1`'s normal vector and (2, 4, 3) is `plane-membership-1`'s
   * second point, so the plane a learner computed a constant for is the plane
   * they now test for closure. The arithmetic is familiar and the question is
   * new, which is the whole of what this concept adds to that one.
   *
   * NOT A DOT-PRODUCT CLAIM, though two of the `given`s are n·(u + v) with n's
   * components written as literals. ontology-vectors.ts argues it beside the
   * edges: the `encompasses` count one concept down counts
   * `n1*r1 + n2*r2 + n3*r3` and deliberately excludes `2*x - y + 2*z`, so these
   * two are the excluded shape and claim nothing.
   */
  {
    id: 'polynomial-as-vector-1',
    knowledgePointId: 'the-axioms-are-the-rules-the-components-already-used',
    kind: 'evaluate',
    prompt:
      'p = 2 + 3x − x² and q = 1 − x + 4x². Find the coefficient of x² in 2p + q. Scaling ' +
      'multiplies every coefficient and adding collects matching powers, so no other term of ' +
      'either polynomial can reach the answer.',
    // The two coefficients are NOT stated — the prompt gives the polynomials and
    // picking −1 and 4 out of them is half of what the task asks. `c` is the
    // scalar rather than a literal 2 in the `given`, because the point is that
    // scaling is an operation the set is equipped with and not a number that
    // happens to be there.
    given: 'c*p2 + q2',
    variables: POLY_X2_COEFFS,
    at: { c: '2', p2: '-1', q2: '4' },
    // 2·(−1) + 4 = 2. The same arithmetic as `combination-1`'s 2u + 3v on
    // components, which is the knowledge point's claim.
    reference: '2',
  },
  {
    id: 'function-pointwise-sum-1',
    knowledgePointId: 'the-axioms-are-the-rules-the-components-already-used',
    kind: 'evaluate',
    prompt:
      'f(x) = x² and g(x) = 3x. Functions add pointwise — f + g is the function whose value at ' +
      'each x is f(x) + g(x) — so find (f + g)(2). There is no list of components to add here, ' +
      'and the sum is well defined anyway.',
    given: 'x^2 + 3*x',
    variables: REAL_X,
    // 4 + 6 = 10. The whole content is that this obeys every rule the triples
    // obeyed while having no finite coordinate list, which is the question
    // `basis-and-dimension` exists to answer and is left to it.
    at: { x: '2' },
    reference: '10',
  },
  {
    id: 'subspace-closed-sum-1',
    knowledgePointId: 'a-subspace-is-a-subset-that-passes-three-checks',
    kind: 'evaluate',
    prompt:
      'W is the set of points with 2x − y + 2z = 0, the plane through the origin with normal ' +
      'n = (2, −1, 2). u = (2, 2, −1) and v = (1, 0, −1) are both in W. Add them componentwise ' +
      'and evaluate the left-hand side at the sum. The value W demands is the one it demands of ' +
      'every member.',
    given: '2*(u1 + v1) - (u2 + v2) + 2*(u3 + v3)',
    variables: VEC_UV_3D,
    at: { u1: '2', u2: '2', u3: '-1', v1: '1', v2: '0', v3: '-1' },
    // u + v = (3, 2, -2), so 6 - 2 - 4 = 0: closed. Paired with
    // `not-a-subspace-constant-doubles-1`, which is this expression at a plane
    // that misses the origin and returns 12.
    reference: '0',
  },
  {
    id: 'subspace-membership-solve-1',
    knowledgePointId: 'a-subspace-is-a-subset-that-passes-three-checks',
    kind: 'evaluate',
    prompt:
      'Exactly one z puts (2, 2, z) on the plane 2x − y + 2z = 0. Solving the condition for z ' +
      'gives z = (y − 2x)/2; evaluate it at that point. This is the vector the closure task ' +
      'above starts from, so the answer is checkable against it.',
    given: '(u2 - 2*u1)/2',
    variables: VEC_U,
    at: { u1: '2', u2: '2' },
    // (2 - 4)/2 = -1, which is u's third coordinate in `subspace-closed-sum-1`.
    // The one task in the set whose answer is neither 0 nor a disqualification,
    // so "answer 0" cannot carry a learner through the concept.
    reference: '-1',
  },
  {
    id: 'not-a-subspace-constant-doubles-1',
    knowledgePointId: 'the-three-checks-are-independent',
    kind: 'evaluate',
    prompt:
      'V is the plane 2x − y + 2z = 6. P = (1, 2, 3) and Q = (2, 4, 3) are both on it. Evaluate ' +
      'the left-hand side at P + Q. Comparing what you get with what V demands is what settles ' +
      'closure, and the comparison is the reason only one constant can ever pass.',
    // Same `given` as `subspace-closed-sum-1`, at different inputs. The constant
    // 6 is in the prompt deliberately and is not what is asked for: the answer
    // is the value at the SUM, and a learner who reads 6 as the answer has
    // missed the doubling the task is about.
    given: '2*(u1 + v1) - (u2 + v2) + 2*(u3 + v3)',
    variables: VEC_UV_3D,
    at: { u1: '1', u2: '2', u3: '3', v1: '2', v2: '4', v3: '3' },
    // P + Q = (3, 6, 6), so 6 - 6 + 12 = 12 = 2 x 6. n·(P + Q) = d + d, so
    // closure forces d = 0 and the zero-vector check is the same condition.
    reference: '12',
  },
  {
    id: 'not-a-subspace-axes-1',
    knowledgePointId: 'the-three-checks-are-independent',
    kind: 'evaluate',
    prompt:
      'S is the set of points of the plane with xy = 0 — the two axes together. (1, 0) and ' +
      '(0, 1) are both in S. Evaluate xy at their sum. S holds the zero vector and every scalar ' +
      'multiple of a member, so this is the one check that can still go wrong.',
    given: '(u1 + v1)*(u2 + v2)',
    variables: VEC_UV_FULL,
    at: { u1: '1', u2: '0', v1: '0', v2: '1' },
    // (1, 0) + (0, 1) = (1, 1), so 1·1 = 1 and not 0. The failure the other two
    // checks cannot predict, which is why the test has three parts: each axis is
    // a subspace on its own and their union is not.
    reference: '1',
  },

  /*
   * The dimension — six tasks, two on each of the three points, the
   * twenty-second promotion. Every one exact with no worker, which is this
   * subject's standing contract and the reason this concept was taken ahead of
   * `inner-product-spaces`: a count, a coordinate and a cross product are
   * integers and an exact quotient, while length and angle in a general space
   * are a square root and an inverse cosine.
   *
   * THAT LAST CLAUSE IS WRONG AS A REASON AND THE TWENTY-THIRD PROMOTION SAYS
   * SO, six tasks further down this file. It describes what an inner product
   * YIELDS rather than what it is, and the three questions that follow from the
   * properties alone — what a rule returns, which pairs it sends to zero, which
   * coefficient splits a vector — are integers and one exact quotient. The
   * comparison it made was fair; the sentence that broke the tie was not. Left
   * standing rather than rewritten, because the refusal and its overturn
   * together are the record of how the choice was made.
   *
   * THE FIGURES ARE THE ONES THE SUBJECT ALREADY WALKED, and deliberately.
   * u = (2, −1) and v = (1, 3) are `combination-1`'s pair and
   * `cross-check-independent-1`'s, so the basis a learner is asked for an
   * address in is the pair they already tested for independence; and
   * n = (2, −1, 2) in the third point's two tasks is `cross-product-component-1`
   * and `cross-product-perpendicular-1`'s own cross product of a = (1, 2, 0)
   * and b = (0, 2, 1). The arithmetic is familiar and the question is new,
   * which is what this concept adds to those.
   *
   * THE ONE NUMBER THAT HAD TO BE CHOSEN is w. A coordinate is
   * `(v2*w1 - v1*w2)/(u1*v2 - u2*v1)`, so it is rational only if the numerator
   * is a multiple of the cross-check, which is 7 here — picking w first would
   * have given sevenths. So the weights were picked and w computed from them:
   * 2u − v = (3, −5), whose address is therefore (2, −1). That also buys the
   * pairing below, since the two coordinates come out positive and negative and
   * neither is 0.
   *
   * WHY NOT A THIRD COORDINATE TASK. The six answers are 2, −5, 0, −7, −2 and
   * 0, which is the spread the twentieth promotion's note argues for: a task
   * set whose every answer is 0 teaches the arithmetic and hides the decision,
   * and two of these six being 0 is what makes the zero MEAN something — in
   * `three-plane-vectors-dependent-1` it means redundant and in
   * `third-vector-redundant-1` it means "already in the plane those two span".
   */
  {
    id: 'basis-coordinate-1',
    knowledgePointId: 'a-basis-is-a-spanning-set-with-nothing-spare',
    kind: 'evaluate',
    prompt:
      'u = (2, −1) and v = (1, 3) are a basis of the plane. Find the FIRST coordinate of ' +
      'w = (3, −5) in it — the c₁ with c₁u + c₂v = w. Eliminating c₂ from the two component ' +
      'equations gives c₁ = (v₂w₁ − v₁w₂)/(u₁v₂ − u₂v₁); the denominator is the cross-check, ' +
      'which is why a basis has to be independent before this quotient means anything.',
    given: '(v2*w1 - v1*w2)/(u1*v2 - u2*v1)',
    variables: VEC_UVW,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3', w1: '3', w2: '-5' },
    // (3·3 − 1·(−5))/(2·3 − (−1)·1) = 14/7 = 2. The denominator is
    // `cross-check-independent-1`'s whole `given` and its answer of 7, which is
    // the arithmetic the `encompasses` edge in ontology-vectors.ts is claimed
    // on. Exact because w was chosen as 2u − v rather than picked first — any
    // other w gives sevenths.
    reference: '2',
  },
  {
    id: 'basis-reconstruct-1',
    knowledgePointId: 'a-basis-is-a-spanning-set-with-nothing-spare',
    kind: 'evaluate',
    prompt:
      'The address of w in the basis {u, v} has come out as (2, −1), with u = (2, −1) and ' +
      'v = (1, 3). Evaluate the SECOND component of 2u − v. This is the check that the address ' +
      'really does rebuild w = (3, −5), rather than merely being a pair of numbers the ' +
      'elimination produced.',
    given: 'c1*u2 + c2*v2',
    variables: VEC_WEIGHTED_2,
    at: { c1: '2', c2: '-1', u2: '-1', v2: '3' },
    // 2·(−1) + (−1)·3 = −5, which is w's second component. Same `given` as
    // `span-plane-1` at different inputs: that task was handed its weights and
    // asked whether they reached a target, and this one has FOUND them and
    // checks back. ontology-vectors.ts declines a second `encompasses` edge to
    // `vectors-and-spans` on the strength of this task alone, since the credit
    // already arrives transitively through `linear-independence`.
    reference: '-5',
  },
  {
    id: 'three-plane-vectors-dependent-1',
    knowledgePointId: 'every-basis-of-a-space-is-the-same-size',
    kind: 'evaluate',
    prompt:
      'u = (2, −1), v = (1, 3), w = (3, −5), and w = 2u − v. Evaluate the first component of ' +
      'w − 2u + v. A zero makes that a combination of all three vectors landing on the origin ' +
      'with weights that are not all zero, which is what rules {u, v, w} out as a basis.',
    given: 'w1 - 2*u1 + v1',
    variables: VEC_UVW,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3', w1: '3', w2: '-5' },
    // 3 − 4 + 1 = 0, and the second component gives −5 + 2 + 3 = 0 as well. The
    // weights are (−2, 1, 1): not all zero, so a dependence. It is the address
    // from `basis-coordinate-1` rearranged, which is the knowledge point's
    // claim — every third plane vector has one, so three are never independent.
    reference: '0',
  },
  {
    id: 'one-vector-is-not-enough-1',
    knowledgePointId: 'every-basis-of-a-space-is-the-same-size',
    kind: 'evaluate',
    prompt:
      'Could {u} alone be a basis of the plane, with u = (2, −1)? Apply the cross-check to u and ' +
      'w = (3, −5): evaluate u₁w₂ − u₂w₁. Anything but zero means w is off the line through u, ' +
      'so one vector does not reach it.',
    given: 'u1*w2 - u2*w1',
    variables: VEC_UVW,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3', w1: '3', w2: '-5' },
    // 2·(−5) − (−1)·3 = −7. Non-zero, so {u} spans a line and not the plane —
    // the lower bound on a basis, as `three-plane-vectors-dependent-1` is the
    // upper one. −7 rather than some unrelated number because w = 2u − v, so
    // the crosswise expression scales the 7 of `cross-check-independent-1` by
    // w's v-coordinate of −1; that is the second of the two tasks the
    // `encompasses` edge is claimed on.
    reference: '-7',
  },
  {
    id: 'plane-basis-cross-product-1',
    knowledgePointId: 'the-dimension-counts-directions-not-entries',
    kind: 'evaluate',
    prompt:
      'W is the plane 2x − y + 2z = 0. u = (2, 2, −1) and v = (1, 0, −1) both lie in it. Find ' +
      'the FIRST component of u × v, which is u₂v₃ − u₃v₂. A non-zero cross product means the ' +
      'pair is independent, so two of them inside a two-freedom plane are a basis of it.',
    given: 'u2*v3 - u3*v2',
    variables: VEC_UV_3D,
    at: { u1: '2', u2: '2', u3: '-1', v1: '1', v2: '0', v3: '-1' },
    // 2·(−1) − (−1)·0 = −2. The whole product is (−2, 1, −2), which is −1 times
    // the plane's normal (2, −1, 2) — it has to be perpendicular to both, and
    // the normal is the only direction that is. Same `given` as
    // `cross-product-component-1` at different inputs: that task built a
    // perpendicular, and this one reads a non-zero answer as independence.
    reference: '-2',
  },
  {
    id: 'third-vector-redundant-1',
    knowledgePointId: 'the-dimension-counts-directions-not-entries',
    kind: 'evaluate',
    prompt:
      'a = (1, 2, 0) and b = (0, 2, 1) span a plane whose normal is n = a × b = (2, −1, 2). ' +
      'Decide whether c = (2, −2, −3) adds a third direction by evaluating n·c. A zero means c ' +
      'lies in the plane a and b already span, so three vectors would still be dimension 2.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '2', n2: '-1', n3: '2', r1: '2', r2: '-2', r3: '-3' },
    // 4 + 2 − 6 = 0, and indeed c = 2a − 3b. The point of asking it this way is
    // that the weights are not visible: the triple product settles membership
    // before anybody finds them. Same `given` as `plane-constant-1` at
    // different inputs, and n is `cross-product-component-1`'s own answer, so
    // this is that cross product being USED rather than computed again.
    reference: '0',
  },

  /*
   * The inner product — six tasks, two on each of the three points, the
   * twenty-third promotion. Every one `evaluate` and every one exact with no
   * worker, which is this subject's standing contract and, this time, the whole
   * argument for the promotion: the note six tasks above refused this concept
   * because length and angle in a general space are a root and an inverse
   * cosine. NOT ONE OF THESE SIX TAKES A ROOT. Three ask what a weighted rule
   * returns, two ask which pairs it sends to zero, and one is a quotient of two
   * dot products that comes out whole.
   *
   * THE WEIGHTS 2 AND 3, AND WHY NOT 1 AND 1. A weighted rule is the cheapest
   * inner product that is not the dot product, and it has to DISAGREE with the
   * dot product on something or the concept's second point has no content.
   * Both weights positive is what keeps it an inner product; the second point's
   * pair is chosen so the two rules disagree about a right angle, and the first
   * point's negative weight is the counterexample that shows which property
   * that would cost.
   *
   * THE FIGURES ARE CHOSEN AGAINST TWO CONSTRAINTS AT ONCE. u = (3, 2) and
   * v = (−2, 3) in the second point are dot-orthogonal and weighted-non-
   * orthogonal — 6, not 0 — and w = (1, −1) is the reverse, 0 against the
   * weighted rule and 1 against the dot product; so one pair of tasks carries
   * the disagreement in both directions. In the third point u = (1, 2) and
   * v = (4, 3) were chosen so that v·u / u·u is WHOLE: the coefficient is
   * 10/5 = 2 and the remainder (2, −1) has integer components. Under the
   * weighted rule the same pair gives 26/14 = 13/7, which is exact and is in
   * the worked example on purpose — it is the point that one derivation returns
   * two numbers — but it is not asked for as a task, so no reference here is a
   * fraction.
   *
   * WHAT IS UNSCORED: which property a value refuted. `signed-rule-fails-
   * positivity-1` asks for the −1 and the prompt says what it means, but
   * naming positive-definiteness is a `justify` question and this build ships
   * no `justify` task anywhere. Same shortfall as the subspace test one
   * concept up, and the objectives name only `evaluate` for the same reason.
   */
  {
    id: 'weighted-inner-product-1',
    knowledgePointId: 'an-inner-product-is-three-properties-and-not-a-formula',
    kind: 'evaluate',
    prompt:
      'Take the rule ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂, with u = (1, 4) and v = (5, −2). Evaluate ' +
      '2*u1*v1 + 3*u2*v2. It pairs the components by position exactly as the dot product does ' +
      'and then weights the two products differently, so setting both weights to 1 would give ' +
      'the dot product back — which on this pair is 5 − 8 = −3, a different number from the one ' +
      'you are about to get.',
    given: '2*u1*v1 + 3*u2*v2',
    variables: VEC_UVW,
    at: { u1: '1', u2: '4', v1: '5', v2: '-2', w1: '1', w2: '1' },
    // 2·1·5 = 10 and 3·4·(−2) = −24, so 10 − 24 = −14. Same `given` as
    // `and-not-under-the-weighted-rule-1` at different inputs, which is this
    // file's habit for a pair whose point is a comparison: there the answer is
    // 6 and the question is whether it is zero, here it is −14 and the question
    // is only what the rule returns.
    reference: '-14',
  },
  {
    id: 'signed-rule-fails-positivity-1',
    knowledgePointId: 'an-inner-product-is-three-properties-and-not-a-formula',
    kind: 'evaluate',
    prompt:
      'Now flip the second weight: 2u₁v₁ − 3u₂v₂. Evaluate it on w = (1, 1) against itself — ' +
      'that is, evaluate 2*w1*w1 - 3*w2*w2. The rule is still symmetric and still linear in ' +
      'each slot, since neither of those arguments looks at a value. One number is enough to ' +
      'disqualify it anyway, and the sign of your answer is which number.',
    given: '2*w1*w1 - 3*w2*w2',
    variables: VEC_UVW,
    at: { u1: '1', u2: '4', v1: '5', v2: '-2', w1: '1', w2: '1' },
    // 2 − 3 = −1. A non-zero vector with a negative product against itself, so
    // positive-definiteness fails — the one of the three properties the other
    // two cannot imply. Asked as a value rather than as "which property", since
    // naming the property is a `justify` and nothing here rules those.
    reference: '-1',
  },
  {
    id: 'perpendicular-under-the-dot-rule-1',
    knowledgePointId: 'a-right-angle-belongs-to-a-pair-and-a-rule',
    kind: 'evaluate',
    prompt:
      'u = (3, 2) and v = (−2, 3). Evaluate u·v = u1*v1 + u2*v2. A zero makes these two ' +
      'perpendicular — under THIS rule, which is the qualification the next task is about.',
    given: 'u1*v1 + u2*v2',
    variables: VEC_UVW,
    at: { u1: '3', u2: '2', v1: '-2', v2: '3', w1: '1', w2: '-1' },
    // 3·(−2) + 2·3 = −6 + 6 = 0. `dot-product-1`'s `given` verbatim at new
    // inputs, which is one of the two tasks the `encompasses` edge down to the
    // dot product is claimed on.
    reference: '0',
  },
  {
    id: 'and-not-under-the-weighted-rule-1',
    knowledgePointId: 'a-right-angle-belongs-to-a-pair-and-a-rule',
    kind: 'evaluate',
    prompt:
      'The same two vectors, u = (3, 2) and v = (−2, 3), under ⟨u, v⟩ = 2u₁v₁ + 3u₂v₂. Evaluate ' +
      '2*u1*v1 + 3*u2*v2. Neither arrow has moved since the previous task, so whatever you get ' +
      'is a fact about the RULE — and if it is not zero, these two are not perpendicular under ' +
      'it. For the record, w = (1, −1) is the reverse case: this rule sends it to 0 against u ' +
      'and the dot product sends it to 1.',
    given: '2*u1*v1 + 3*u2*v2',
    variables: VEC_UVW,
    at: { u1: '3', u2: '2', v1: '-2', v2: '3', w1: '1', w2: '-1' },
    // 2·3·(−2) + 3·2·3 = −12 + 18 = 6. The pair that is orthogonal under one
    // rule and not the other, which is the whole content of the point — and the
    // reason the two tasks on it are the SAME inputs under two givens rather
    // than two different pairs.
    reference: '6',
  },
  {
    id: 'projection-coefficient-1',
    knowledgePointId: 'the-projection-coefficient-is-forced-by-the-properties',
    kind: 'evaluate',
    prompt:
      'u = (1, 2) and v = (4, 3), under the dot product. Splitting v as cu + r with r ' +
      'perpendicular to u forces c = (v·u)/(u·u), so evaluate ' +
      '(u1*v1 + u2*v2) / (u1*u1 + u2*u2). Both halves are products you have computed before: ' +
      'the top is a dot product of two vectors and the bottom is one of a vector with itself. ' +
      'Dividing by the bottom is only legitimate because ⟨u, u⟩ is positive for a non-zero u, ' +
      'which is the property the first point showed a rule can fail.',
    given: '(u1*v1 + u2*v2) / (u1*u1 + u2*u2)',
    variables: VEC_UV_FULL,
    at: { u1: '1', u2: '2', v1: '4', v2: '3' },
    // (4 + 6)/(1 + 4) = 10/5 = 2. The one task here that divides, and u and v
    // were chosen so it lands whole: the numerator has to be a multiple of
    // u·u = 5 or the answer is fifths. The weighted rule on the same pair gives
    // 26/14 = 13/7, which is in the worked example and not asked for.
    //
    // The numerator is `dot-product-1`'s `given` and the denominator is
    // `dot-product-self-1`'s, both verbatim — the second of the two tasks the
    // `encompasses` edge is claimed on.
    reference: '2',
  },
  {
    id: 'orthogonal-remainder-1',
    knowledgePointId: 'the-projection-coefficient-is-forced-by-the-properties',
    kind: 'evaluate',
    prompt:
      'Same u = (1, 2) and v = (4, 3), and the coefficient came out c = 2, so the remainder is ' +
      'r = v − 2u. Evaluate r·u = (v1 - c*u1)*u1 + (v2 - c*u2)*u2 to check that r really is ' +
      'perpendicular to u. The answer is not a coincidence of these components — it is the ' +
      'condition c was solved for, so the same thing happens for any v.',
    given: '(v1 - c*u1)*u1 + (v2 - c*u2)*u2',
    variables: VEC_UV_COEFF,
    at: { u1: '1', u2: '2', v1: '4', v2: '3', c: '2' },
    // r = (4 − 2, 3 − 4) = (2, −1), and 2·1 + (−1)·2 = 0. This is a dot product
    // too, and it is deliberately NOT counted toward the `encompasses` edge:
    // one of its two vectors is computed inside the expression and never
    // written as a pair, which is the shape the thirteenth promotion excluded
    // from its own count and the twentieth refused an edge over.
    reference: '0',
  },

  /*
   * The rank and the kernel — six tasks, two on each of the three points, the
   * thirtieth promotion. Every one `evaluate`, every one exact with no worker,
   * which is this subject's standing contract.
   *
   * ONE MATRIX RUNS THROUGH ALL SIX, and it is
   *
   *     A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]]
   *
   * chosen so that every number the concept needs is small and none of them is
   * an accident. Row 2 is twice row 1, so the rank is at most 2; rows 1 and 3
   * are independent, so it is exactly 2; three columns less two pivots leaves
   * one free, so the nullity is 1. Its columns are c₁ = (1, 2, 1),
   * c₂ = (2, 4, 1), c₃ = (3, 6, 1) — every one of them satisfying y = 2x, which
   * is the plane the image IS.
   *
   * THE KERNEL VECTOR AND THE COLUMN DEPENDENCE ARE THE SAME THREE NUMBERS,
   * which is the reason this matrix rather than a smaller one. The kernel is
   * the line through (1, −2, 1), and 1·c₁ − 2·c₂ + 1·c₃ = 0 is that triple read
   * as weights on the columns. So the first point finds the dependence with a
   * triple product and the second finds it again by eliminating, and a learner
   * can see that the two answers are one fact rather than two.
   *
   * THREE OF THE SIX GIVENS ARE `basis-and-dimension`'S OWN, VERBATIM, and that
   * is what the `encompasses` edge in ontology-vectors.ts is claimed on rather
   * than on the prose. `u2*v3 - u3*v2` is `plane-basis-cross-product-1`'s, and
   * `n1*r1 + n2*r2 + n3*r3` is `third-vector-redundant-1`'s, used twice here at
   * different inputs.
   *
   * NOTHING HERE TAKES A ROOT AND NOTHING ASKS FOR AN ANGLE, which are the two
   * boundaries this subject has held since the dot product. Neither cost
   * anything to keep: a rank is a count and a kernel test is a dot product.
   */
  {
    id: 'image-two-columns-independent-1',
    knowledgePointId: 'the-rank-counts-the-directions-the-columns-reach',
    kind: 'evaluate',
    prompt:
      'A = [[1, 2, 3], [2, 4, 6], [1, 1, 1]], so its first two columns are u = (1, 2, 1) and ' +
      'v = (2, 4, 1). Evaluate the FIRST component of u × v, which is u₂v₃ − u₃v₂. Anything but ' +
      'zero means the two columns are independent, so the image contains a whole plane and the ' +
      'rank is at least 2.',
    given: 'u2*v3 - u3*v2',
    variables: VEC_UV_3D,
    at: { u1: '1', u2: '2', u3: '1', v1: '2', v2: '4', v3: '1' },
    // 2·1 − 1·4 = −2. The whole product is (−2, 1, 0), which is the normal of
    // the plane y = 2x — and all THREE columns lie in it, which is what the
    // next task uses. Same `given` as `plane-basis-cross-product-1` at
    // different inputs: that task settled independence inside a plane given in
    // advance, and this one produces the plane.
    reference: '-2',
  },
  {
    id: 'image-third-column-adds-nothing-1',
    knowledgePointId: 'the-rank-counts-the-directions-the-columns-reach',
    kind: 'evaluate',
    prompt:
      'The first two columns of A span a plane whose normal is n = (−2, 1, 0). Decide whether the ' +
      'third column r = (3, 6, 1) reaches out of that plane by evaluating n·r. A zero means it ' +
      'does not, so the three columns between them reach only two directions and the rank is ' +
      'exactly 2 rather than merely at least 2.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '-2', n2: '1', n3: '0', r1: '3', r2: '6', r3: '1' },
    // −6 + 6 + 0 = 0, and indeed c₃ = 2c₂ − c₁. The pair with the task above is
    // the same squeeze `basis-and-dimension` used on the plane — one value
    // bounds the count from below and one from above — and the weights behind
    // this zero are not visible here, which is what the kernel point finds.
    reference: '0',
  },
  {
    id: 'kernel-vector-is-killed-1',
    knowledgePointId: 'the-kernel-is-what-the-map-kills-and-the-nullity-counts-it',
    kind: 'evaluate',
    prompt:
      'Row 1 of A is a = (1, 2, 3), and eliminating gave k = (1, −2, 1) as a candidate for the ' +
      'kernel. Evaluate a·k. A zero is row 1 sending k to zero, which is one of the three ' +
      'conditions Ak = 0 asks for.',
    given: 'a1*k1 + a2*k2 + a3*k3',
    variables: MATRIX_ROW_AND_CANDIDATE,
    at: { a1: '1', a2: '2', a3: '3', k1: '1', k2: '-2', k3: '1' },
    // 1 − 4 + 3 = 0. Row 2 gives 2 − 8 + 6 = 0 and row 3 gives 1 − 2 + 1 = 0,
    // so all three hold and k really is in the kernel — checked against the
    // ORIGINAL rows rather than the reduced ones, which is the worked example's
    // third subgoal.
    reference: '0',
  },
  {
    id: 'kernel-is-one-particular-line-1',
    knowledgePointId: 'the-kernel-is-what-the-map-kills-and-the-nullity-counts-it',
    kind: 'evaluate',
    prompt:
      'Same row a = (1, 2, 3), and now the candidate k = (1, −1, 1) — which has the same signs as ' +
      'the kernel vector and is not it. Evaluate a·k. A non-zero answer means row 1 alone already ' +
      'rules this vector out, so the kernel is the particular line through (1, −2, 1) rather than ' +
      'any vector that looks roughly right.',
    given: 'a1*k1 + a2*k2 + a3*k3',
    variables: MATRIX_ROW_AND_CANDIDATE,
    at: { a1: '1', a2: '2', a3: '3', k1: '1', k2: '-1', k3: '1' },
    // 1 − 2 + 3 = 2. Same `given` as the task above at different inputs, which
    // is the point's content expressed as a task pair: one dot product decides
    // membership, and it is the SAME dot product either way. A set of tasks
    // that only ever showed the zero would teach that the test returns zero.
    reference: '2',
  },
  {
    id: 'what-the-kernel-costs-the-image-1',
    knowledgePointId: 'the-two-counts-add-to-the-number-of-columns',
    kind: 'evaluate',
    prompt:
      'A has three columns and a kernel of dimension 1, so the theorem fixes the rank at 2 and the ' +
      'image is the plane with normal n = (−2, 1, 0). That means some vector of space is NOT hit. ' +
      'Test r = (0, 1, 0) by evaluating n·r: a non-zero answer is that vector sitting off the ' +
      'image, which is the one direction the kernel cost.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '-2', n2: '1', n3: '0', r1: '0', r2: '1', r3: '0' },
    // 0 + 1 + 0 = 1. Same `given` as `image-third-column-adds-nothing-1` at
    // different inputs, and the contrast is the whole task: a zero there said a
    // column was already inside the image, a one here says a target is outside
    // it. The trade only reads this way because A is square — a 2×4 matrix
    // kills two directions without missing any, which the worked example says.
    reference: '1',
  },
  {
    id: 'rank-from-the-nullity-1',
    knowledgePointId: 'the-two-counts-add-to-the-number-of-columns',
    kind: 'evaluate',
    prompt:
      'C has 5 columns, 40 rows, and a kernel that is a plane. Evaluate n − k with n the number of ' +
      'COLUMNS and k the dimension of the kernel to get the rank. Three judgements come before the ' +
      'subtraction: a plane has dimension 2, the count the theorem spends is the columns and never ' +
      'the rows, and the answer is the rank. No elimination is performed on C at all.',
    given: 'n - k',
    variables: COLUMNS_AND_NULLITY,
    at: { n: '5', k: '2' },
    // 5 − 2 = 3. The 40 rows are in the prompt because they are the number a
    // reader reaches for and the theorem never touches: rank ≤ 5 whatever the
    // rows do. Trivial arithmetic on purpose — the theorem IS this subtraction,
    // and what it buys is that nobody reduces a 40×5 grid to get the 3.
    reference: '3',
  },

  /*
   * Least squares — ten tasks, three on each of the first two points and four
   * on the third, the forty-first promotion. Every one `evaluate`, every one
   * exact with no worker, which is this subject's standing contract.
   *
   * NOT TWO PER POINT, and the exception is the content rather than an
   * accident. The third point makes two claims — the coefficients come out of
   * separate equations WHEN the columns are perpendicular, and the answer is
   * unique while the naming of it need not be — and the first of those needs
   * the test for perpendicularity, the coefficient it uncouples, and the miss
   * the fit leaves before it is a claim at all. So that point gets four and any
   * three of them are part of it.
   *
   * ONE SYSTEM RUNS THROUGH THE FIRST SIX, and it is
   *
   *     x·a = b  with  a = (1, 1, 1)  and  b = (2, 3, 7)
   *
   * which is three measurements of one quantity, inconsistent because the three
   * components of b are not equal. ⟨b, a⟩ = 12 and ⟨a, a⟩ = 3, so x̂ = 4, the
   * residual is (−2, −1, 3) and the least sum of squared misses is 14. The
   * column being all ones is chosen and not incidental: it makes the forced
   * coefficient an AVERAGE, which is what lets the third task reach the same 4
   * by a route that mentions no vector.
   *
   * THE COMPETITOR IS x = 5 AND IT IS THE SAME TWO EXPRESSIONS AT NEW INPUTS.
   * `normal-equation-holds-1` and `normal-equation-rejects-and-points-1` share
   * a `given` and return 0 and −3; `least-squares-miss-at-the-best-1` and
   * `the-penalty-for-missing-it-1` share one and return 14 and 17. Both pairs
   * are the point's content expressed as a task pair rather than as prose: a
   * set of tasks that only ever showed the zero would teach that the test
   * returns zero, and one that only ever showed 14 would leave "least" as a
   * word. 17 − 14 = 3 is exactly ⟨a, a⟩, which is the split predicting the
   * competitor's miss rather than the competitor being measured.
   *
   * THE LAST FOUR RUN ON ONE FIT, four readings y = (2, 2, 4, 8) at times
   * t = (−3, −1, 1, 3). The times are measured from the MIDDLE of the run, so
   * ⟨u, t⟩ = 0 and the two normal equations uncouple — which is a real
   * technique rather than a convenience, and is what keeps this material inside
   * what the node's two `needs` can carry: the uncentred case is a 2×2 system
   * and belongs to `expressions-and-equations`. c = 16/4 = 4 and m = 20/20 = 1,
   * the fit is (1, 3, 5, 7), the residual is (1, −1, −1, 1) and ⟨r, r⟩ = 4.
   *
   * THE RESIDUAL IS A PATTERN AND NOT A SCATTER, which was the hardest choice
   * in the set. Four points, two coefficients, and a residual orthogonal to
   * both columns with no zero component: the sign pattern is FORCED to be
   * +, −, −, + or its negative or the alternating one, so an honest four-point
   * line fit with every reading missed cannot look like noise. Rather than hide
   * that by letting one reading be hit exactly, the material names it — the data
   * bends, a line cannot — and says that reading such a pattern is
   * `linear-regression` and not this concept.
   *
   * NOTHING HERE TAKES A ROOT AND NOTHING ASKS FOR AN ANGLE, which are the two
   * boundaries this subject has held since the dot product. The first one cost
   * something to keep for the first time and the cost was zero: the quantity
   * minimised is the SUM of squared misses and its square root has the same
   * minimiser, so the concept whose name is about squares never needs their
   * root.
   */
  {
    id: 'least-squares-coefficient-1',
    knowledgePointId: 'an-unsolvable-system-still-has-a-least-miss',
    kind: 'evaluate',
    prompt:
      'Three measurements of one quantity give the system x·a = b with a = (1, 1, 1) and ' +
      'b = (2, 3, 7), which no x satisfies — a multiple of (1, 1, 1) has equal components and b ' +
      'does not. The x leaving the least sum of squared misses is the projection coefficient ' +
      '⟨b, a⟩/⟨a, a⟩, so evaluate (a1*b1 + a2*b2 + a3*b3) / (a1*a1 + a2*a2 + a3*a3). Both halves ' +
      'are inner products you have computed before, and dividing by the bottom is legitimate ' +
      'because ⟨a, a⟩ is positive for a non-zero a.',
    given: '(a1*b1 + a2*b2 + a3*b3) / (a1*a1 + a2*a2 + a3*a3)',
    variables: LS_COLUMN_AND_TARGET,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7' },
    // (2 + 3 + 7)/(1 + 1 + 1) = 12/3 = 4. `projection-coefficient-1`'s shape at
    // three components rather than two, which is one of the five tasks the
    // `encompasses` edge down to the inner product is claimed on.
    //
    // `x` is deliberately NOT in this task's declaration list: it is the answer,
    // and `at` is what a task substitutes.
    reference: '4',
  },
  {
    id: 'least-squares-miss-at-the-best-1',
    knowledgePointId: 'an-unsolvable-system-still-has-a-least-miss',
    kind: 'evaluate',
    prompt:
      'Same a = (1, 1, 1) and b = (2, 3, 7), and the coefficient came out x̂ = 4, so the miss is ' +
      'r = b − 4a. Evaluate the sum of its squares, ' +
      '(b1 - x*a1)^2 + (b2 - x*a2)^2 + (b3 - x*a3)^2. That number is the LEAST this sum can be ' +
      'made rather than a measure of a mistake — and it is the sum of the squares and not its ' +
      'square root, which is why this concept is called least squares and why nothing in it ' +
      'takes a root.',
    given: '(b1 - x*a1)^2 + (b2 - x*a2)^2 + (b3 - x*a3)^2',
    variables: LS_COLUMN_TARGET_AND_X,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7', x: '4' },
    // r = (−2, −1, 3) and 4 + 1 + 9 = 14. Paired with
    // `the-penalty-for-missing-it-1`, which is this `given` at x = 5 and returns
    // 17 — and 17 − 14 = 3 is ⟨a, a⟩ exactly, which is the second point's split.
    reference: '14',
  },
  {
    id: 'the-constant-fit-is-the-mean-1',
    knowledgePointId: 'an-unsolvable-system-still-has-a-least-miss',
    kind: 'evaluate',
    prompt:
      'The same three measurements by a route that mentions no vector: evaluate ' +
      '(b1 + b2 + b3) / 3. With a = (1, 1, 1) the formula ⟨b, a⟩/⟨a, a⟩ IS this expression for ' +
      'any b at all — add the components, divide by how many there are — so the least-squares ' +
      'fit of a constant is the MEAN, and this task and the first one are a single number ' +
      'reached two ways. The summaries subject says the signed deviations from a mean total ' +
      'zero; that total is ⟨r, a⟩, and the zero is this concept\'s own condition.',
    given: '(b1 + b2 + b3) / 3',
    variables: LS_COLUMN_AND_TARGET,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7' },
    // (2 + 3 + 7)/3 = 4, the same answer as `least-squares-coefficient-1` from a
    // different `given`. The cross-check is the task: two routes to one number
    // is the shape the Euclidean algorithm's first point used, and here it is
    // also the whole of the debt to `descriptive-statistics`.
    //
    // The 3 is written as a literal and not as a1 + a2 + a3, because the claim
    // is that the formula DEGENERATES into an average — a version that kept the
    // components would be the first task again with the arithmetic rearranged.
    reference: '4',
  },
  {
    id: 'normal-equation-holds-1',
    knowledgePointId: 'the-normal-equation-is-what-makes-it-least',
    kind: 'evaluate',
    prompt:
      'Same a = (1, 1, 1) and b = (2, 3, 7), at x = 4. The normal equation says the miss must ' +
      'come out perpendicular to the column, so evaluate ' +
      'a1*(b1 - x*a1) + a2*(b2 - x*a2) + a3*(b3 - x*a3). A zero is that condition holding — and ' +
      'it confirms the arithmetic rather than proving 4 is best, since x̂ was solved for out of ' +
      'this very equation. What shows it is best is the task after next.',
    given: 'a1*(b1 - x*a1) + a2*(b2 - x*a2) + a3*(b3 - x*a3)',
    variables: LS_COLUMN_TARGET_AND_X,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7', x: '4' },
    // −2 − 1 + 3 = 0. `orthogonal-remainder-1`'s shape at three components —
    // the residual's inner product with the vector it was taken along — which is
    // the second of the five tasks the `encompasses` edge is claimed on.
    reference: '0',
  },
  {
    id: 'normal-equation-rejects-and-points-1',
    knowledgePointId: 'the-normal-equation-is-what-makes-it-least',
    kind: 'evaluate',
    prompt:
      'The SAME expression at x = 5: evaluate ' +
      'a1*(b1 - x*a1) + a2*(b2 - x*a2) + a3*(b3 - x*a3) again, with a and b unchanged. Written ' +
      'out it is ⟨b, a⟩ − x⟨a, a⟩ = 12 − 3x, so it is positive below the best coefficient, zero ' +
      'at it and negative above — a non-zero answer rejects 5, and the sign says that more of a ' +
      'has been taken out than b had in it, so x must come down.',
    given: 'a1*(b1 - x*a1) + a2*(b2 - x*a2) + a3*(b3 - x*a3)',
    variables: LS_COLUMN_TARGET_AND_X,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7', x: '5' },
    // b − 5a = (−3, −2, 2) and −3 − 2 + 2 = −3. Same `given` as the task above
    // at one changed input, which is the point's content as a task pair: one
    // expression accepts the answer and rejects the competitor, and a set that
    // only ever showed the zero would teach that the test returns zero.
    reference: '-3',
  },
  {
    id: 'the-penalty-for-missing-it-1',
    knowledgePointId: 'the-normal-equation-is-what-makes-it-least',
    kind: 'evaluate',
    prompt:
      'Same system, and x = 5 is x̂ − d with d = −1, so d² = 1. The split ' +
      '⟨b − xa, b − xa⟩ = ⟨r, r⟩ + d²⟨a, a⟩ predicts 14 + 1·3 = 17 without squaring anything, so ' +
      'check it directly: evaluate (b1 - x*a1)^2 + (b2 - x*a2)^2 + (b3 - x*a3)^2 at x = 5. The ' +
      'two agree because the cross term 2d⟨r, a⟩ vanished, which is the normal equation used for ' +
      'the thing that matters — a non-zero ⟨r, a⟩ would let that term go negative and some other ' +
      'x would beat 4.',
    given: '(b1 - x*a1)^2 + (b2 - x*a2)^2 + (b3 - x*a3)^2',
    variables: LS_COLUMN_TARGET_AND_X,
    at: { a1: '1', a2: '1', a3: '1', b1: '2', b2: '3', b3: '7', x: '5' },
    // 9 + 4 + 4 = 17, which is `least-squares-miss-at-the-best-1`'s 14 plus
    // ⟨a, a⟩ = 3. Same `given` at one changed input, and the pair is what makes
    // "least" a checked claim: either task alone is a sum of three squares.
    reference: '17',
  },
  {
    id: 'the-two-columns-do-not-interact-1',
    knowledgePointId: 'one-normal-equation-per-column-and-a-count-for-the-rest',
    kind: 'evaluate',
    prompt:
      'Four readings are taken at times t = (−3, −1, 1, 3), measured from the middle of the run, ' +
      'and fitted by y ≈ c + mt — a combination of the two columns u = (1, 1, 1, 1) and t. ' +
      'Evaluate ⟨u, t⟩ = u1*t1 + u2*t2 + u3*t3 + u4*t4. A zero means the two normal equations ' +
      'share no unknown, so each coefficient comes out of its own; anything else and the two are ' +
      'a 2×2 system to be solved together.',
    given: 'u1*t1 + u2*t2 + u3*t3 + u4*t4',
    variables: LS_FOUR_POINT_FIT,
    at: {
      u1: '1', u2: '1', u3: '1', u4: '1',
      t1: '-3', t2: '-1', t3: '1', t4: '3',
      y1: '2', y2: '2', y3: '4', y4: '8',
    },
    // −3 − 1 + 1 + 3 = 0. The orthogonality test of
    // `a-right-angle-belongs-to-a-pair-and-a-rule` at four components, which is
    // the fifth task the `encompasses` edge is claimed on — and the zero is
    // arranged by the times being measured from the middle rather than being
    // lucky, which the prompt says so that the technique is visible.
    //
    // The readings are in `at` though the expression does not use them, which
    // every multi-task set in this file does: `at` decides what is substituted,
    // an unused declaration costs nothing, and a symbol missing from `at` fails
    // an assertion.
    reference: '0',
  },
  {
    id: 'the-slope-from-its-own-column-1',
    knowledgePointId: 'one-normal-equation-per-column-and-a-count-for-the-rest',
    kind: 'evaluate',
    prompt:
      'Same four times, with readings y = (2, 2, 4, 8). The columns being perpendicular, the ' +
      'second normal equation reads ⟨y, t⟩ = m⟨t, t⟩ with no c in it, so evaluate ' +
      '(t1*y1 + t2*y2 + t3*y3 + t4*y4) / (t1*t1 + t2*t2 + t3*t3 + t4*t4). The intercept comes ' +
      'out of the other equation as ⟨y, u⟩/⟨u, u⟩ = 16/4 = 4, which is the mean of the readings ' +
      'exactly as a column of ones always gives.',
    given: '(t1*y1 + t2*y2 + t3*y3 + t4*y4) / (t1*t1 + t2*t2 + t3*t3 + t4*t4)',
    variables: LS_FOUR_POINT_FIT,
    at: {
      u1: '1', u2: '1', u3: '1', u4: '1',
      t1: '-3', t2: '-1', t3: '1', t4: '3',
      y1: '2', y2: '2', y3: '4', y4: '8',
    },
    // (−6 − 2 + 4 + 24)/(9 + 1 + 1 + 9) = 20/20 = 1. The quotient of two inner
    // products again, at four components, which is the third task the
    // `encompasses` edge is claimed on. The intercept is given in the prompt
    // rather than asked for because it is the first point's arithmetic at new
    // numbers, and the claim of THIS task is that the slope needed none of it.
    //
    // `c` and `m` are not in this declaration list: `m` is the answer.
    reference: '1',
  },
  {
    id: 'the-least-miss-of-any-line-1',
    knowledgePointId: 'one-normal-equation-per-column-and-a-count-for-the-rest',
    kind: 'evaluate',
    prompt:
      'The fit came out c = 4 and m = 1, so the fitted readings are c + m·t at the four times. ' +
      'Evaluate the sum of squared misses, ' +
      '(y1 - c - m*t1)^2 + (y2 - c - m*t2)^2 + (y3 - c - m*t3)^2 + (y4 - c - m*t4)^2. No line ' +
      'through this data does better. The four misses are (1, −1, −1, 1), which the total hides: ' +
      'they do not scatter, because the data bends and a line cannot — and whether a pattern ' +
      'like that is signal is regression rather than this concept.',
    given:
      '(y1 - c - m*t1)^2 + (y2 - c - m*t2)^2 + (y3 - c - m*t3)^2 + (y4 - c - m*t4)^2',
    variables: LS_FOUR_POINT_FIT_COEFFS,
    at: {
      u1: '1', u2: '1', u3: '1', u4: '1',
      t1: '-3', t2: '-1', t3: '1', t4: '3',
      y1: '2', y2: '2', y3: '4', y4: '8',
      c: '4', m: '1',
    },
    // Fitted (1, 3, 5, 7), misses (1, −1, −1, 1), 1 + 1 + 1 + 1 = 4. Not counted
    // toward the `encompasses` edge: the vector whose squares are summed is
    // computed inside the expression and never written as a list, which is the
    // shape the thirteenth promotion excluded from its own count and the
    // twentieth refused an edge over.
    reference: '4',
  },
  {
    id: 'how-many-ways-to-name-the-same-fit-1',
    knowledgePointId: 'one-normal-equation-per-column-and-a-count-for-the-rest',
    kind: 'evaluate',
    prompt:
      'Write the column of ones down twice, so the fit has three columns — u, t and 2u — and ' +
      'n = 3. The span has not grown, so the rank is still p = 2 and the fitted readings, the ' +
      'misses and the 4 above are every one of them unchanged. Evaluate n − p for the dimension ' +
      'of the set of coefficient triples producing that same fit: one free choice is a line of ' +
      'solutions, and a zero would have meant the naming was unique.',
    given: 'n - p',
    variables: LS_COLUMNS_AND_PIVOTS,
    at: { n: '3', p: '2' },
    // 3 − 2 = 1. The same subtraction as `rank-from-the-nullity-1` read the
    // other way round — there the nullity was given and the rank was wanted,
    // here the rank is given and the count wanted is the dimension of the
    // solution set. Trivial arithmetic on purpose, as that task is: what it buys
    // is that "the answer is unique and the way of naming it is not" is settled
    // by a count rather than by staring at (4, 1, 0) and (0, 1, 2).
    //
    // It is also the ONE task of the ten that touches `rank-nullity`, which is
    // why no `encompasses` edge runs there: the rank is handed over in the
    // prompt, so nothing here produces it.
    reference: '1',
  },

  /*
   * The dual — eleven tasks, three on the first point and four on each of the
   * other two, the forty-second promotion. Every one `evaluate` and
   * every one settled by exact integer arithmetic with no worker, which is this
   * subject's standing contract across six promotions.
   *
   * THE FIGURES ARE THE PREREQUISITE'S OWN, AND NOT ONE OF THEM IS NEW. All
   * three points run on `basis-and-dimension`'s two worked examples:
   * u = (2, −1), v = (1, 3) and w = (3, −5) in the plane, and the plane
   * 2x − y + 2z = 0 with a = (1, 2, 0), c = (2, −2, −3) and the normal
   * n = (2, −1, 2) in space. That is deliberate and it is the reverse of the
   * usual choice. Most promotions here re-use a pair of vectors and change the
   * question; this one changes what kind of OBJECT is being asked about — the
   * rule that reads a coordinate becomes a thing with a coordinate of its own —
   * and keeping every number identical is what makes the change of object the
   * only new thing on the page.
   *
   * THE ONE NUMBER THAT HAD TO BE CHOSEN is the second plane vector,
   * w = (8, 3), for `the-address-a-functional-is-spent-on-1`. A coordinate in
   * this basis is a seventh unless the numerator is a multiple of 7, which is
   * the trap `basis-coordinate-1`'s own note records — so the weights were
   * picked first and the vector computed from them: 3u + 2v = (8, 3), whose
   * address is therefore (3, 2) and whose f-value is 3·3 + 2·(−2) = 5.
   *
   * FOUR OF THE ELEVEN ARE A `basis-and-dimension` TASK'S `given` SYMBOL FOR
   * SYMBOL,
   * which is the arithmetic the `encompasses` edge in ontology-vectors.ts is
   * claimed on — and the note there says plainly that only ONE of the four is
   * exclusive to that concept. `(v2*w1 - v1*w2)/(u1*v2 - u2*v1)` is
   * `basis-coordinate-1`'s and nothing else's in the build;
   * `n1*r1 + n2*r2 + n3*r3` is `third-vector-redundant-1`'s and also
   * `plane-constant-1`'s and `cross-product-perpendicular-1`'s, so three of the
   * four are evidence of a dot product rather than of a dimension count.
   *
   * THREE ANSWERS ARE 0 AND EACH ZERO MEANS SOMETHING DIFFERENT, which is the
   * spread the twentieth promotion's note argues for: a task set whose every
   * answer is 0 teaches the arithmetic and hides the decision. Here the first
   * zero is a dual basis functional refusing the OTHER basis vector — half of
   * its definition — and the second and third are a row killing a vector, once
   * before and once after the row is doubled. The eleven answers are 8, 3, 5,
   * 1, 0, 2, 8, 0, 3, 2 and 0 across eleven tasks, counting the two eights as
   * the two routes they are.
   *
   * TWO TASKS SHARE AN ANSWER BY DESIGN AND DO NOT SHARE A `given`.
   * `functional-from-its-values-on-a-basis-1` reaches 8 through the address and
   * the two values; `the-dual-expansion-collapses-to-a-row-1` reaches it
   * through 3f₁ − 2f₂ written over the common denominator 7, which simplifies
   * to x − y with the sevenths cancelling. Two routes to one number is the
   * shape the fortieth promotion's first point used and here it is the whole
   * claim of the second point: the expansion in the dual basis IS the
   * functional and not a second description of it.
   *
   * NOTHING HERE TAKES A ROOT AND NOTHING ASKS FOR AN ANGLE, which are the two
   * boundaries this subject has held since the dot product. Neither cost
   * anything this time — a functional returns a number and a dimension is a
   * count, so there was no length to be tempted by.
   */
  {
    id: 'functional-from-its-values-on-a-basis-1',
    knowledgePointId: 'a-functional-is-fixed-by-its-values-on-a-basis',
    kind: 'evaluate',
    prompt:
      'f is a linear functional on the plane — a linear rule returning a single number — with ' +
      'f(u) = 3 and f(v) = −2, where u = (2, −1) and v = (1, 3). The address of w = (3, −5) in ' +
      '{u, v} is (2, −1), so w = 2u − v. Linearity takes the weights out in front: evaluate ' +
      'c1*fu + c2*fv at those weights and values. Nobody told f anything about w — two values on ' +
      'a basis and an address are the whole of what this needs.',
    given: 'c1*fu + c2*fv',
    variables: DUAL_WEIGHTS_AND_VALUES,
    at: { c1: '2', c2: '-1', fu: '3', fv: '-2' },
    // 2·3 + (−1)·(−2) = 6 + 2 = 8. Both minus signs are live: the second weight
    // is −1 and the second value is −2, so the term ADDS, which is the one place
    // in the point where a sign slip gives 4 and looks plausible.
    //
    // Paired with `the-dual-expansion-collapses-to-a-row-1` two points down,
    // which reaches the same 8 from a different `given` and never mentions u or
    // an address — that pair is the second point's claim rather than a
    // repetition.
    reference: '8',
  },
  {
    id: 'the-address-a-functional-is-spent-on-1',
    knowledgePointId: 'a-functional-is-fixed-by-its-values-on-a-basis',
    kind: 'evaluate',
    prompt:
      'A second plane vector, w = (8, 3), with the same basis u = (2, −1) and v = (1, 3). Before ' +
      'f can be applied to it the address has to be found, which is the previous concept\'s own ' +
      'quotient: evaluate (v2*w1 - v1*w2)/(u1*v2 - u2*v1). The denominator is the cross-check, ' +
      'and a functional needs it non-zero for a sharper reason than a coordinate does — a ' +
      'dependent pair would give this vector two addresses, and two addresses would give f two ' +
      'values at one vector, which is not a function at all.',
    given: '(v2*w1 - v1*w2)/(u1*v2 - u2*v1)',
    variables: VEC_UVW,
    at: { u1: '2', u2: '-1', v1: '1', v2: '3', w1: '8', w2: '3' },
    // (3·8 − 1·3)/(2·3 − (−1)·1) = 21/7 = 3, and the second coordinate is 2.
    // `basis-coordinate-1`'s `given` SYMBOL FOR SYMBOL at new inputs, which is
    // the one task of the four claimed for the `encompasses` edge whose
    // expression belongs to that concept alone — the coordinate formula with the
    // cross-check as its divisor appears nowhere else in the build.
    //
    // The symbols are the generic basis-and-vector ones, so `w` here is the
    // second vector rather than `basis-coordinate-1`'s; the prompt names the
    // components and the `at` is what distinguishes the two tasks.
    reference: '3',
  },
  {
    id: 'the-same-functional-on-the-second-vector-1',
    knowledgePointId: 'a-functional-is-fixed-by-its-values-on-a-basis',
    kind: 'evaluate',
    prompt:
      'The address of w = (8, 3) in {u, v} came out as (3, 2) — that is, w = 3u + 2v. With the ' +
      'same f as before, f(u) = 3 and f(v) = −2, evaluate c1*fu + c2*fv at the new weights. Two ' +
      'values about f, a second vector, and nothing new had to be supplied: that is what "the ' +
      'values on a basis decide the functional" means when you use it rather than state it.',
    given: 'c1*fu + c2*fv',
    variables: DUAL_WEIGHTS_AND_VALUES,
    at: { c1: '3', c2: '2', fu: '3', fv: '-2' },
    // 3·3 + 2·(−2) = 9 − 4 = 5. Same `given` as the first task at different
    // inputs, which is the pairing this file's vector promotions use: one task
    // is the arithmetic and the pair is the claim that f was never re-specified.
    //
    // Cross-checkable against the collapsed row x − y of the second point:
    // 8 − 3 = 5. That agreement is not asserted by a task, because a third task
    // computing it would be the same number a third time; the second point's
    // last subgoal states it.
    reference: '5',
  },
  {
    id: 'the-dual-basis-functional-on-its-own-vector-1',
    knowledgePointId: 'the-dual-basis-reads-coordinates-and-counts-the-same-dimension',
    kind: 'evaluate',
    prompt:
      'f₁ is the first dual basis functional of {u, v}, with u = (2, −1) and v = (1, 3): it is ' +
      'the rule (3x − y)/7, which is the previous concept\'s first-coordinate formula written as ' +
      'a functional in its own right. Evaluate (3*x - y)/7 at u itself, x = 2 and y = −1. A 1 is ' +
      'what f₁ was DEFINED to return there, so this is the definition being met rather than a ' +
      'coincidence — and the 7 in the denominator is the cross-check of the pair.',
    given: '(3*x - y)/7',
    variables: DUAL_PLANE_XY,
    at: { x: '2', y: '-1' },
    // (6 + 1)/7 = 1. Paired with the next task, which is this `given` at v and
    // returns 0: the two together are the δ that defines a dual basis, and
    // either alone is a fraction that happens to cancel.
    reference: '1',
  },
  {
    id: 'and-zero-on-the-other-basis-vector-1',
    knowledgePointId: 'the-dual-basis-reads-coordinates-and-counts-the-same-dimension',
    kind: 'evaluate',
    prompt:
      'The same f₁(x, y) = (3x − y)/7, now at v = (1, 3). Evaluate (3*x - y)/7 there. A zero is ' +
      'the other half of the definition: a dual basis functional returns 1 on its own basis ' +
      'vector and 0 on every other one, which is what makes the pair of them READ coordinates ' +
      'rather than merely produce numbers. This task and the one before it are one rule at two ' +
      'inputs, and the pair is the claim.',
    given: '(3*x - y)/7',
    variables: DUAL_PLANE_XY,
    at: { x: '1', y: '3' },
    // (3 − 3)/7 = 0. The zero means "this functional ignores the other basis
    // direction entirely", which is a different zero from the two in the third
    // point, where a row kills a vector.
    reference: '0',
  },
  {
    id: 'the-dual-basis-reads-the-address-1',
    knowledgePointId: 'the-dual-basis-reads-coordinates-and-counts-the-same-dimension',
    kind: 'evaluate',
    prompt:
      'Still f₁(x, y) = (3x − y)/7, now at w = (3, −5). Evaluate (3*x - y)/7 there. Your answer ' +
      'is the FIRST COORDINATE of w in {u, v}, which the previous concept found by eliminating ' +
      'one component equation against the other — so "take the first coordinate" turns out to be ' +
      'a functional, and a vector\'s address is the list of what the dual basis returns on it.',
    given: '(3*x - y)/7',
    variables: DUAL_PLANE_XY,
    at: { x: '3', y: '-5' },
    // (9 + 5)/7 = 2, which is `basis-coordinate-1`'s own answer by an expression
    // in the components instead of one in the basis. Not counted toward the
    // `encompasses` edge: the `given` is this concept's rule and not that
    // concept's quotient, and the four counted there are the verbatim ones.
    reference: '2',
  },
  {
    id: 'the-dual-expansion-collapses-to-a-row-1',
    knowledgePointId: 'the-dual-basis-reads-coordinates-and-counts-the-same-dimension',
    kind: 'evaluate',
    prompt:
      'The f of the first point — f(u) = 3, f(v) = −2 — expands in the dual basis as 3f₁ − 2f₂, ' +
      'with f₁(x, y) = (3x − y)/7 and f₂(x, y) = (x + 2y)/7. Evaluate ' +
      '(3*(3*x - y) - 2*(x + 2*y))/7 at w = (3, −5). Two things are worth noticing. The answer ' +
      'is the first point\'s value for f(w), reached without ever mentioning u, v or an address; ' +
      'and the expression itself simplifies to x − y, the sevenths cancelling because both ' +
      'functionals were built out of the same cross-check.',
    given: '(3*(3*x - y) - 2*(x + 2*y))/7',
    variables: DUAL_PLANE_XY,
    at: { x: '3', y: '-5' },
    // (3·14 − 2·(−7))/7 = (42 + 14)/7 = 56/7 = 8, which is
    // `functional-from-its-values-on-a-basis-1`'s answer from a different
    // `given`. The expression is x − y identically — (9x − 3y − 2x − 4y)/7 =
    // (7x − 7y)/7 — so it checks out at u as 3 and at v as −2 as well, which is
    // the agreement-on-a-basis argument the subgoal makes.
    //
    // Written over the common denominator rather than as x - y on purpose: the
    // claim is that the expansion COLLAPSES, and a task given x - y would be
    // asserting the result instead of producing it.
    reference: '8',
  },
  {
    id: 'the-row-returns-zero-on-its-kernel-1',
    knowledgePointId: 'a-functional-is-a-row-and-its-kernel-costs-one-dimension',
    kind: 'evaluate',
    prompt:
      'f(x, y, z) = 2x − y + 2z is a functional on space, and on components a functional is a ' +
      'dot product with its coefficient ROW: f(r) = n·r with n = (2, −1, 2). Evaluate ' +
      'n1*r1 + n2*r2 + n3*r3 at that row and r = (1, 2, 0). A zero puts r in the KERNEL of f — ' +
      'and the previous concept knew this same vector as a point lying in the plane ' +
      '2x − y + 2z = 0, which is the identical fact approached from the other side.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '2', n2: '-1', n3: '2', r1: '1', r2: '2', r3: '0' },
    // 2 − 2 + 0 = 0. `third-vector-redundant-1`'s `given` symbol for symbol at
    // new inputs — one of the four the `encompasses` edge is claimed on, and one
    // of the three of those four whose expression that concept shares with
    // `plane-constant-1` and `cross-product-perpendicular-1` rather than owning.
    //
    // n is `cross-product-component-1`'s own answer, so the row a learner dots
    // with is a cross product they computed two concepts ago — which is the
    // first subgoal's claim that a plane's normal and its functional's row are
    // one object.
    reference: '0',
  },
  {
    id: 'and-the-row-is-not-zero-outside-it-1',
    knowledgePointId: 'a-functional-is-a-row-and-its-kernel-costs-one-dimension',
    kind: 'evaluate',
    prompt:
      'Same row n = (2, −1, 2), now against p = (1, 1, 1). Evaluate n1*r1 + n2*r2 + n3*r3. A ' +
      'non-zero answer says p is NOT in the kernel, and one such vector is the whole of what is ' +
      'needed to know the kernel is smaller than the space — a functional returning zero ' +
      'everywhere would be the zero functional. What the number is NOT is a distance to the ' +
      'plane: it is by how much p fails the equation, and scaling the row would change it ' +
      'without moving anything.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '2', n2: '-1', n3: '2', r1: '1', r2: '1', r3: '1' },
    // 2 − 1 + 2 = 3. Paired with the task above: same `given`, 0 inside the
    // kernel and 3 outside it. A set that only ever showed the zero would teach
    // that this expression returns zero, which is the failure the forty-first
    // promotion's two pairs were built to avoid.
    reference: '3',
  },
  {
    id: 'the-freedom-the-one-equation-leaves-1',
    knowledgePointId: 'a-functional-is-a-row-and-its-kernel-costs-one-dimension',
    kind: 'evaluate',
    prompt:
      'Solving f = 0 — that is, 2x − y + 2z = 0 — for the coordinate whose coefficient is not ' +
      'zero gives y = 2x + 2z: x and z may be chosen freely and y follows. Evaluate 2*x + 2*z at ' +
      'the choice x = 1, z = 0. Your answer is the y that choice forces, so the kernel vector is ' +
      '(1, 2, 0) — the previous concept\'s own basis vector, recovered from the functional rather ' +
      'than handed over. Two free choices out of three coordinates is why this kernel has ' +
      'dimension 2.',
    given: '2*x + 2*z',
    variables: PLANE_XYZ,
    at: { x: '1', z: '0' },
    // 2·1 + 2·0 = 2, so the vector is (1, 2, 0), which is `a` in
    // `third-vector-redundant-1` and in the previous concept's third worked
    // example. Choosing x = 0, z = 1 gives (0, 2, 1), which is its `b` — so the
    // basis of the plane comes out of the functional both times.
    //
    // `y` is declared and not substituted, which `at` is what decides: the
    // expression is what y EQUALS, so a stated input for it would be asking the
    // learner to confirm a number already given.
    reference: '2',
  },
  {
    id: 'doubling-the-row-keeps-the-kernel-1',
    knowledgePointId: 'a-functional-is-a-row-and-its-kernel-costs-one-dimension',
    kind: 'evaluate',
    prompt:
      'The doubled functional 2f has row (4, −2, 4). Evaluate n1*r1 + n2*r2 + n3*r3 at that row ' +
      'and c = (2, −2, −3), a vector f sends to zero. A zero again — and not because of anything ' +
      'about c: doubling a number that is zero leaves it zero, so 2f kills exactly what f kills. ' +
      'The two functionals differ at every vector outside the kernel and the kernel cannot tell ' +
      'them apart, which is why a plane through the origin names its equation only up to a ' +
      'multiple, and why 4x − 2y + 4z = 0 draws the same picture as 2x − y + 2z = 0.',
    given: 'n1*r1 + n2*r2 + n3*r3',
    variables: PLANE_N_P,
    at: { n1: '4', n2: '-2', n3: '4', r1: '2', r2: '-2', r3: '-3' },
    // 8 + 4 − 12 = 0. Third task on this `given` and the third distinct meaning
    // for its answer: in the kernel, outside it, and still in it after the row
    // moved. c is `third-vector-redundant-1`'s own third vector, whose zero
    // there meant "adds no direction" — the same zero reading as membership of a
    // kernel, which is this point's whole claim about what a row does.
    reference: '0',
  },

  // ── solid-measure, twelfth promotion: solid-geometry ────────────────────
  //
  // Seven tasks — two on the first point, three on the second, two on the
  // third: six `evaluate` and one `transform_to_form`, every one settled by
  // exact arithmetic with no worker, like the four subjects before it.
  //
  // Not two per point, and the exception is the content rather than an
  // accident. The second point makes two claims — the third applies to the
  // volume, and it does NOT apply to the surface — and the second of those
  // needs the slant height before it can be stated at all. So that point gets
  // the volume, the slant and the surface, and the three of them together are
  // the claim; any two of them are half of it.
  //
  // THE π WALL IS `circle-measure`'S AND IS INHERITED WHOLE. `pi` is a real
  // constant of the expression language — expr.ts parses it — but `exactValue`
  // returns null on it, deliberately, because returning 0 or NaN would turn "I
  // cannot settle this" into a ruling against the learner. So a reference of
  // `539*pi` cannot be ruled locally and would be handed to the worker, ending
  // this subject's no-worker contract at its first cylinder. Every task here
  // that touches a circular cross-section asks for the MULTIPLE of π and says
  // so in the prompt, so the learner is never guessing whether the π is theirs
  // to supply. Asking for the measurement instead was rejected on the same
  // ground `pythagoras` refused to ask for a decimal: 539π IS the volume and
  // 1693.3 cm³ is a rounding of it.
  //
  // What that costs is the same cost and is named rather than glossed: no task
  // here scores the step from `288` to `288π cm³`. That step is in two of the
  // three worked examples and in none of the rulings.
  //
  // NO TASK NAMES AN ANGLE, and here that is cheap rather than a constraint
  // fought for. A right triangle cannot have whole-number sides AND
  // whole-number acute angles — the figure would not exist and nothing in this
  // build would catch it — and a solid's measure never needs an angle, so the
  // 8-15-17 cross-section, the 9-12-15 slant and the 4-6 cone are all described
  // by their lengths alone. The ratios subject had to work for this; this one
  // only had to not break it.
  //
  // WHAT IS UNSCORED: the dissection. The second point's third subgoal proves
  // the factor of a third by splitting a cube, and that is a `justify`
  // question, which this build ships no tasks of at all. It is asked by the
  // tutor and ruled by nobody, and the objectives here name only the two kinds
  // that really ship — unlike `plane-geometry`, twenty-eight of whose
  // objectives name `justify`.
  {
    id: 'the-prism-is-its-cross-section-carried-along-the-length-1',
    knowledgePointId: 'a-constant-cross-section-carries-its-area-along-and-its-perimeter-round',
    kind: 'evaluate',
    prompt:
      'A prism is 11 cm long and its cross-section is a right triangle with legs of 8 cm and '
      + '15 cm. Evaluate (a*b/2)*c at a = 8, b = 15, c = 11 to get its volume in cubic '
      + 'centimetres. Two things are in the expression: a*b/2 is the cross-section\'s AREA, and '
      + 'c is the length the solid runs for. Every slice across the prism is that same triangle, '
      + 'so the length multiplies the area exactly once. Read this against '
      + 'the-side-of-a-prism-reads-the-perimeter-not-the-area-1, which carries the same length '
      + 'along the same cross-section\'s OTHER plane measure — choosing between the two is what '
      + 'this point teaches, and neither task shows it alone.',
    given: '(a*b/2)*c',
    variables: REAL_ABC,
    // ½ × 8 × 15 = 60 cm², and 60 × 11 = 660 cm³. The 8-15-17 triangle, whose
    // third side the perimeter task needs and this one does not — the area
    // reads two sides and the perimeter reads three, which is the asymmetry
    // the pair is built on.
    //
    // The triple is `opposite-and-adjacent-are-roles-not-sides`' in
    // triangle-trigonometry, doing an unrelated job: there the three lengths
    // are divided into each other to index an angle, here two of them are
    // multiplied to measure a region.
    reference: '660',
    at: { a: '8', b: '15', c: '11' },
  },
  {
    id: 'the-side-of-a-prism-reads-the-perimeter-not-the-area-1',
    knowledgePointId: 'a-constant-cross-section-carries-its-area-along-and-its-perimeter-round',
    kind: 'evaluate',
    prompt:
      'The same prism. Its cross-section\'s third side is 17 cm, by Pythagoras on 8 and 15. '
      + 'Evaluate (a+b+c)*d at a = 8, b = 15, c = 17, d = 11 to get the area of its SIDE in '
      + 'square centimetres — the three rectangles running its length, not counting the two '
      + 'triangular ends. The length d is the identical 11 from the task above and only the plane '
      + 'measure has changed: a+b+c is the cross-section\'s perimeter where a*b/2 was its area. '
      + 'So answering 660 here is not an arithmetic slip, it is a volume offered where an area '
      + 'was asked for, and the units are the only thing that says so.',
    given: '(a+b+c)*d',
    variables: REAL_ABCD,
    // 8 + 15 + 17 = 40 cm, and 40 × 11 = 440 cm². Unrolled, the side is one
    // rectangle 40 by 11. The two caps are 2 × 60 = 120 more, which the
    // worked example adds and this task deliberately does not: the prompt
    // asks for the side alone, so a learner cannot lose the mark for the
    // omission the example is about.
    reference: '440',
    at: { a: '8', b: '15', c: '17', d: '11' },
  },
  {
    id: 'the-pyramid-is-a-third-of-the-prism-on-the-same-base-1',
    knowledgePointId: 'the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface',
    kind: 'evaluate',
    prompt:
      'A square-based pyramid has base edges of 18 cm and a height of 12 cm. Evaluate '
      + '(a^2*b)/3 at a = 18, b = 12 to get its volume in cubic centimetres. The expression is '
      + 'the whole claim in one line: a^2 is the base, b carries it up to the prism on that same '
      + 'base, and the division by 3 is the one thing a pyramid does to it. Answering 3888 is '
      + 'the prism rather than the pyramid. The third is provable and the worked example proves '
      + 'it — a cube splits into three congruent square pyramids — so it is not a constant to be '
      + 'taken on trust.',
    given: '(a^2*b)/3',
    variables: REAL_AB,
    // 18² = 324 cm², 324 × 12 = 3888 cm³ for the prism, and 3888 ÷ 3 = 1296 cm³
    // for the pyramid. Whole at every step, which is why the base edge is even:
    // the slant-height task below needs half of it to be whole as well.
    reference: '1296',
    at: { a: '18', b: '12' },
  },
  {
    id: 'the-slant-height-is-the-length-the-surface-needs-1',
    knowledgePointId: 'the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface',
    kind: 'transform_to_form',
    prompt:
      'A cone has base radius 4 cm and height 6 cm. Its slanted surface rises along the SLANT '
      + 'height, which is the hypotenuse of a right triangle on the height and the base radius: '
      + 'its square is 6² + 4² = 52. Give that length exactly, with nothing left under the '
      + 'radical that need not be there. The point is that this length exists at all — the volume '
      + 'of this cone uses only the 4 and the 6, so a fifth number appearing is the signal that '
      + 'the surface is a separate calculation and not a fraction of one already done. A decimal '
      + 'is a rounding of the slant height rather than the slant height, which is why it is asked '
      + 'for as a surd.',
    given: 'sqrt(52)',
    form: 'surd_reduced',
    variables: [],
    // 52 = 4 × 13 with 4 = 2², so 2√13, and 13 is square-free so nothing
    // further comes out. Ruled by `asSurd`'s normal form with no worker, the
    // same way `reduce-the-hypotenuse-surd-1` in `pythagoras` is.
    //
    // A radicand distinct from all three already in the build — 180 gave 6√5,
    // 192 gave 8√3 and 75 gave 5√3 — so this is a recall of none of them, and
    // the square that comes out is 4 rather than 25, 36 or 64.
    //
    // A cone rather than the worked example's pyramid, deliberately: the
    // pyramid's slant came out whole at √225, which is what let that example
    // compare two surfaces in integers, and a cone is where the length is
    // irrational in the ordinary case.
    reference: '2*sqrt(13)',
  },
  {
    id: 'the-pyramid-s-surface-takes-no-third-1',
    knowledgePointId: 'the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface',
    kind: 'evaluate',
    prompt:
      'Back to the pyramid with base edges 18 cm and height 12 cm. Evaluate '
      + '2*a*(b^2 + (a/2)^2)^(1/2) at a = 18, b = 12 to get the area of its four slanted faces '
      + 'in square centimetres. The bracket is the slant height — Pythagoras on the height and '
      + 'HALF the base edge — and 2*a is four triangles of base a each taken at a half. Compare '
      + 'your answer with a third of the prism\'s side, which is 864 ÷ 3 = 288: the two do not '
      + 'agree, and that is the point. The third is a claim about volume only, because the '
      + 'prism\'s side rises along the height and these faces rise along the slant.',
    given: '2*a*(b^2 + (a/2)^2)^(1/2)',
    variables: REAL_AB,
    // a/2 = 9, so 12² + 9² = 144 + 81 = 225 and the slant height is 15 — exact,
    // so `exactValue` settles the half-power with no worker, the way the two
    // cosine tasks in `dot-product-geometry` do. Then 2 × 18 × 15 = 540 cm²,
    // which is four triangles of ½ × 18 × 15 = 135.
    //
    // 288 is the wrong answer the prompt names, and it is a third of the real
    // 864 cm² side rather than a mis-multiplication — a correct answer to the
    // question the point says must not be asked.
    reference: '540',
    at: { a: '18', b: '12' },
  },
  {
    id: 'a-volume-takes-the-scale-factor-three-times-1',
    knowledgePointId: 'the-third-dimension-adds-a-third-exponent-and-ties-the-sphere-s-measures',
    kind: 'evaluate',
    prompt:
      'One sphere\'s radius is three times another\'s. Evaluate x^3 at x = 3 to get the factor by '
      + 'which its VOLUME is larger. The cubing is the whole content: a volume is three lengths '
      + 'multiplied, so a factor on the radius enters it three times, where a surface is two '
      + 'lengths and takes it twice. This task has two named wrong answers and both are right '
      + 'answers to a different question — 3 is the factor on a LENGTH, and 9 is the factor on '
      + 'the SURFACE, which is the answer `circle-measure` asked for when there were only two '
      + 'exponents to choose between.',
    given: 'x^3',
    variables: REAL_X,
    // 3³ = 27. The surface factor is 9 and the length factor is 3, so both
    // plausible wrong answers are exact answers to the neighbouring questions
    // rather than slips — which is why the prompt names them.
    //
    // `the-area-factor-is-the-square-of-the-scale-factor-1` in `circle-measure`
    // is `x^2` at the same input, and the repetition is the content: that task
    // is this one with the third dimension removed, and 9 is its answer and
    // this one's commonest error.
    reference: '27',
    at: { x: '3' },
  },
  {
    id: 'the-sphere-s-volume-is-a-third-of-its-surface-times-the-radius-1',
    knowledgePointId: 'the-third-dimension-adds-a-third-exponent-and-ties-the-sphere-s-measures',
    kind: 'evaluate',
    prompt:
      'A sphere of radius 6 cm has surface area 144π cm². Evaluate (a*b)/3 at a = 144, b = 6 to '
      + 'get its volume as a multiple of π, in cubic centimetres — so the volume is your answer '
      + 'times π. The expression is V = (1/3) × S × r, and it is the factor of a third from the '
      + 'point above used with the SURFACE as the base: cut the ball into very thin cones with '
      + 'their apexes at the centre, each has height r, and their bases add up to S. So the two '
      + 'sphere formulas are not independent — this is a check on (4/3)πr³ rather than a second '
      + 'thing to remember — and only S = 4πr² had to be taken as given.',
    given: '(a*b)/3',
    variables: REAL_AB,
    // 144 × 6 = 864, and 864 ÷ 3 = 288, so V = 288π cm³. Checks against the
    // formula: (4/3)π × 6³ = (4/3) × 216 × π = 288π. The radius is 6 and not 3
    // because at 3 the surface and the volume are both 36π, which is a
    // coincidence of that one radius and would hide the fact that two
    // different measures were computed.
    reference: '288',
    at: { a: '144', b: '6' },
  },

  // ── plane-geometry, twelfth promotion: isometries-and-symmetry ──────────
  //
  // Six tasks, two per knowledge point, all `evaluate`, every one settled by
  // exact rational arithmetic with no worker — so the subject's no-worker
  // contract holds unchanged and the pair of `surd_reduced` tasks stays a pair.
  //
  // DECLINED FOR THE SECOND TIME RUNNING, and for a different reason from
  // `distance-and-midpoint`'s. There a form fitted and was declined as a fourth
  // copy of a question `roots-and-irrationals` owns. Here no form fits at all:
  // every quantity this concept produces is a whole number of degrees or a
  // count of maps, and `NamedForm` is a union of claims about the SHAPE of an
  // expression. There is nothing syntactic to demand of "12", so the gap
  // `pythagoras` and `circles` filled with `transform_to_form` does not open.
  //
  // THE SAME EXPRESSION TWICE AT OPPOSITE ENDS OF ITS RANGE, which is this
  // subject's habit and is the third point's whole argument.
  // `count-a-regular-polygons-symmetries-1` and
  // `the-scalene-triangle-has-one-symmetry-and-not-none-1` are both
  // `360/a + b`: at a = 60, b = 6 it answers 12 and at a = 360, b = 0 it
  // answers 1. One formula covers the most symmetric figure in the concept and
  // the least, which is what makes "the identity is a symmetry" a consequence
  // rather than a caveat — a learner who thinks the answer should be 0 has to
  // disagree with the arithmetic rather than with a rule. Asserted as a pair in
  // tests/concepts-logic.mjs.
  //
  // WHAT STAYS UNSCORED is named rather than left to be noticed, as in every
  // block above. In the first pair it is the SSS step: a learner handed
  // "evaluate 180 − a − b" has been told that the image's two angles equal the
  // original's, which is the move the knowledge point exists for. In the third
  // pair it is the two counts themselves — the task supplies r and the number
  // of axes, and working out that a hexagon has six axes rather than three is
  // the content. The prompts say so. What IS scored in both cases is the thing
  // the point's error is about: that the total closes at 180 in whichever
  // triangle you read it, and that the two counts add to 1 rather than 0.
  {
    id: 'the-image-closes-on-the-same-angle-total-1',
    knowledgePointId: 'distance-is-the-only-hypothesis-and-the-angles-follow-by-sss',
    kind: 'evaluate',
    prompt:
      'An isometry carries triangle ABC to DEF, sending A to D, B to E and C to F, and the only '
      + 'angles recorded are ∠A = 53° and ∠B = 59°. SSS has already given you ∠D = ∠A and '
      + '∠E = ∠B — the definition supplies three pairs of equal sides even though two of them '
      + 'were never measured, which is the criterion in full — and that step is what this task '
      + 'hands you. Evaluate 180 − a − b at a = 53, b = 59 to get ∠F. The number can be read in '
      + 'either triangle and that is the content: the congruence is what entitles an angle '
      + 'computed inside ABC to be written at F. Compare third-angle-then-carried-across-1 in '
      + '`congruence`, which is this subtraction reached from three measured parts rather than '
      + 'from one hypothesis about distances.',
    given: '180 - a - b',
    variables: REAL_AB,
    // 180 − 53 − 59 = 68. The figure states only ONE side as a number
    // (AB = 13 cm in the worked example), so there is no triangle here with
    // three whole sides and whole angles — see the note on REAL_ABC and the
    // sides-and-angles rule the oblique-triangle block states in full.
    reference: '68',
    at: { a: '53', b: '59' },
  },
  {
    id: 'one-disagreeing-pair-refutes-an-isometry-1',
    knowledgePointId: 'distance-is-the-only-hypothesis-and-the-angles-follow-by-sss',
    kind: 'evaluate',
    prompt:
      'A map sends A to D, B to E and C to F and is offered as an isometry. The recorded '
      + 'distances are AB = 13 with DE = 13, BC = 14 with EF = 14, and CA = 15 with FD = 16. '
      + 'Evaluate b − a at b = 16, a = 15 — the third pair. Anything other than 0 settles it: the '
      + 'definition says P′Q′ = PQ for EVERY pair of points, so one pair that disagrees refutes '
      + 'the whole claim and the two pairs that matched are worth nothing against it. What this '
      + 'task hands you is which pair to subtract; that checking the agreeing pairs could never '
      + 'have settled anything is the knowledge point.',
    given: 'b - a',
    variables: REAL_AB,
    // 16 − 15 = 1. Non-zero, so no isometry carries ABC onto DEF — and the
    // triangles are not congruent either, 13-14-15 against 13-14-16, which is
    // the same refutation read through SSS.
    reference: '1',
    at: { b: '16', a: '15' },
  },
  {
    id: 'the-starting-point-drops-out-of-the-doubling-1',
    knowledgePointId: 'two-reflections-compose-to-twice-the-angle-between-the-mirrors',
    kind: 'evaluate',
    prompt:
      'Two mirrors m and n cross at 35°, and the first image P₁ lies between them, 20° from m and '
      + '15° from n. Each mirror bisects the angle it turns the point through, so the two turns '
      + 'are 2 × 20° and 2 × 15°, and the claim is that their total is twice the angle between '
      + 'the mirrors. Evaluate (2a + 2b) − 2c at a = 20, b = 15, c = 35. Zero is the content: the '
      + 'half-angles enter only as their sum, so the answer depends on the mirrors and not on '
      + 'where P started, which is what makes the composition one rotation rather than a '
      + 'different motion for each point. It is NOT identically zero — at a = 20, b = 16, c = 35 '
      + 'it is 2, which says P₁ was not between the mirrors as described, so misreading the '
      + 'figure does not earn a free 0.',
    given: '(2*a + 2*b) - 2*c',
    variables: REAL_ABC,
    // 40 + 30 − 70 = 0, and the composition is a 70° rotation about the
    // crossing point. Zero exactly when a + b = c, which is what P₁ lying
    // between the mirrors means.
    reference: '0',
    at: { a: '20', b: '15', c: '35' },
  },
  {
    id: 'the-two-orders-agree-only-at-the-right-angle-1',
    knowledgePointId: 'two-reflections-compose-to-twice-the-angle-between-the-mirrors',
    kind: 'evaluate',
    prompt:
      'Reflecting in m then n turns a figure through 2θ, and reflecting in n then m turns it '
      + 'through 2θ the other way. The two are the same rotation exactly when a turn of 2θ and a '
      + 'turn of −2θ agree, which needs their difference 4θ to be a whole number of turns. '
      + 'Evaluate 4x − 360 at x = 90. Zero says perpendicular mirrors are the case where the '
      + 'order of the two reflections does not matter — and 90° is the only mirror angle strictly '
      + 'between 0° and 180° where it does not, since the next multiple of 360 would need '
      + 'θ = 180°, which is one line twice rather than two mirrors. At x = 35 the same expression '
      + 'is −220, which is the two 70° rotations of the worked example landing 140° apart.',
    given: '4*x - 360',
    variables: REAL_X,
    // 360 − 360 = 0. At 35 it is −220 and at 45 it is −180, so the expression
    // separates the right angle from its neighbours rather than reporting a
    // property every mirror pair has.
    reference: '0',
    at: { x: '90' },
  },
  {
    id: 'count-a-regular-polygons-symmetries-1',
    knowledgePointId: 'a-figures-symmetries-are-counted-with-the-identity-among-them',
    kind: 'evaluate',
    prompt:
      'A regular hexagon returns to itself after a 60° turn, and it has 6 mirror lines — 3 '
      + 'through pairs of opposite vertices and 3 through pairs of opposite edge midpoints. '
      + 'Evaluate 360/a + b at a = 60, b = 6: the division counts the rotations, the 0° one '
      + 'included, and b adds the reflections. The answer is 12, which is 2n at n = 6. What this '
      + 'task hands you is the two counts; that the identity belongs in the first of them, that '
      + 'it is in neither list twice, and that a hexagon has six axes rather than three are the '
      + 'knowledge point.',
    given: '360/a + b',
    variables: REAL_AB,
    // 360/60 = 6 rotations (0°, 60°, 120°, 180°, 240°, 300°) and 6 axes, so 12.
    // A 360° turn is not a seventh rotation: it is the same map as 0°.
    reference: '12',
    at: { a: '60', b: '6' },
  },
  {
    id: 'the-scalene-triangle-has-one-symmetry-and-not-none-1',
    knowledgePointId: 'a-figures-symmetries-are-counted-with-the-identity-among-them',
    kind: 'evaluate',
    prompt:
      'The same expression, on a scalene triangle. It has no mirror line — one would fix a vertex '
      + 'and swap the other two, forcing the two sides at that vertex equal — so b = 0; and no '
      + 'turn short of a full one returns it, so a = 360. Evaluate 360/a + b at a = 360, b = 0. '
      + 'The answer is 1 rather than 0, and that is the whole of the task: the identity is a '
      + 'symmetry, so a figure with no symmetry in the ordinary sense still has exactly one. Read '
      + 'it against count-a-regular-polygons-symmetries-1, which is this expression at the other '
      + 'end of the same scale.',
    given: '360/a + b',
    variables: REAL_AB,
    // 360/360 = 1 rotation, which IS the identity, and no axes: 1 + 0 = 1. The
    // tempting 0 is not an arithmetic slip — it is the identity left out of the
    // first count, which is the error the knowledge point is built on.
    reference: '1',
    at: { a: '360', b: '0' },
  },

  // ── plane-geometry, thirteenth promotion: plane-transformations ──────────
  //
  // Six tasks, two per knowledge point, all `evaluate`, every one settled by
  // exact rational arithmetic with no worker — so the subject's no-worker
  // contract holds unchanged and the pair of `surd_reduced` tasks stays a pair.
  //
  // DECLINED FOR THE THIRD TIME RUNNING, on the same ground as
  // `isometries-and-symmetry` rather than `distance-and-midpoint`'s. The
  // answers here are coordinates, squared distances and whole distances, which
  // are all values; `NamedForm` is a union of claims about the SHAPE of an
  // expression and there is nothing syntactic to demand of "2". The one place
  // a form came close is the second point, where a distance is a root — but the
  // figures are chosen to make every root whole (5, 5 and 15), for exactly the
  // reason `distance-and-midpoint` gives: reducing a surd is a question
  // `roots-and-irrationals` owns and `pythagoras` and `circles` have each
  // already borrowed, and what this concept contributes sits around the
  // radical rather than in it.
  //
  // THE UNSCORED PART, named as everywhere else in this subject, and it is
  // larger here than in any concept above. Every one of the four rules in the
  // first knowledge point is handed to the learner in the prompt, because
  // `evaluate` substitutes into a `given` and the `given` IS the rule — so
  // "which rule is a quarter turn" cannot be the thing scored, only the
  // arithmetic the rule then licenses. The tasks are therefore built to put as
  // much of the content as possible INTO that arithmetic: the first pair
  // computes a squared distance between two images rather than one image's
  // coordinate, so a learner who mixes up the slots gets a different number
  // rather than a differently-labelled answer; and the third pair runs the
  // three-move composition at a centre, where the order of the moves is
  // visible in the expression and a wrong order gives a wrong value.
  //
  // THE SAME GIVEN AT TWO INPUTS, TWICE, which is the shape this subject
  // already uses for `straight-line-remainder-1`/`full-turn-remainder-1` and
  // for the two ends of `360/a + b`. Here it carries two different claims:
  //
  //  - The first pair is `((-a) - (-b))^2 + (b - a)^2`, the squared distance
  //    between the reflection's image and the quarter turn's. At (5, 2) it is
  //    18 and at (4, 4) it is 0, and the pair IS the content — the two maps
  //    disagree at a general point and agree exactly on the line y = x, which
  //    one task alone would have left invisible while drilling the arithmetic.
  //    tests/concepts-logic.mjs checks the vanishing at a third point on that
  //    line, since "it is zero on y = x" is a claim about the line and not
  //    about (4, 4).
  //
  //  - The second pair is `sqrt((c - a)^2 + (d - b)^2)`, which is
  //    `the-distance-is-a-hypotenuse-1`'s own expression reused deliberately.
  //    The content of this point is the COMPARISON of three distances, so the
  //    measuring instrument has to be the same one each time or the comparison
  //    says nothing. At the rotated images it answers 5, matching the original
  //    segment; at the images scaled by 3 it answers 15. Asserted as a pair
  //    with the earlier task below, because a single one of them would show a
  //    distance being computed and not a distance being preserved.
  //
  // WHY `REAL_ABCD` AND `REAL_AB` RATHER THAN COORDINATE-NAMED SETS, which is
  // `distance-and-midpoint`'s rule unchanged: what a symbol MEANS is the
  // prompt's job and what it may be assumed to BE is the declaration's. The
  // third pair is the one worth reading the prompt for — there (a, b) is the
  // CENTRE and (c, d) is the point, the opposite of the second pair's two
  // points, and nothing in the declaration could say so.
  {
    id: 'the-two-maps-disagree-away-from-the-mirror-1',
    knowledgePointId: 'a-transformation-is-a-rule-on-the-pair-and-the-slots-are-half-of-it',
    kind: 'evaluate',
    prompt:
      'Take P(5, 2). Reflected in the y-axis it goes to (−a, b); given a quarter turn '
      + 'anticlockwise about the origin it goes to (−b, a). Both images carry exactly one minus '
      + 'sign, in the same slot, so the signs cannot tell the two maps apart. Evaluate '
      + '((-a) - (-b))^2 + (b - a)^2 at a = 5, b = 2 — the squared distance between the two '
      + 'images, using the squared form because the distance itself is irrational here and '
      + 'nothing in the question needs it to be otherwise. Note which half of this task scores: '
      + 'the arithmetic, not the rules. That a quarter turn is (−y, x) rather than (y, −x) was '
      + 'handed to you, and the way to settle it for yourself is to send (1, 0) through both and '
      + 'see which lands on the positive y-axis.',
    given: '((-a) - (-b))^2 + (b - a)^2',
    variables: REAL_AB,
    // The images are (−5, 2) and (−2, 5). x-difference (−5) − (−2) = −3,
    // y-difference 2 − 5 = −3, so 9 + 9 = 18. Squared on purpose: the real
    // distance is 3√2, `exactValue` returns null on a surd, and asking for the
    // reduced surd would be the question `roots-and-irrationals` owns for a
    // fourth time. A NON-zero answer is the content — the two maps are
    // different maps — and the next task is the same expression where it
    // vanishes.
    reference: '18',
    at: { a: '5', b: '2' },
  },
  {
    id: 'the-two-maps-agree-on-the-mirror-line-1',
    knowledgePointId: 'a-transformation-is-a-rule-on-the-pair-and-the-slots-are-half-of-it',
    kind: 'evaluate',
    prompt:
      'The same two maps and the same expression, at a different point: Q(4, 4), which sits on '
      + 'the line y = x. Evaluate ((-a) - (-b))^2 + (b - a)^2 at a = 4, b = 4. Read the answer '
      + 'against the-two-maps-disagree-away-from-the-mirror-1, which gave 18. A reflection in '
      + 'the y-axis and a quarter turn anticlockwise are not the same map, and this is the whole '
      + 'set of points at which they nevertheless agree — the expression is '
      + '2(b − a)² once simplified, so it vanishes exactly when a = b and nowhere else. The pair '
      + 'of tasks is the point: one of them alone would have drilled the arithmetic and said '
      + 'nothing about where the two maps coincide.',
    given: '((-a) - (-b))^2 + (b - a)^2',
    variables: REAL_AB,
    // Both images are (−4, 4), so the squared distance is 0. The expression is
    // identically 2(b − a)², which is why this is a statement about the line
    // y = x rather than a coincidence at (4, 4) — tests/concepts-logic.mjs
    // evaluates it at a third point on that line to hold the general claim,
    // since a single zero proves nothing about a locus.
    reference: '0',
    at: { a: '4', b: '4' },
  },
  {
    id: 'the-quarter-turn-returns-the-distance-1',
    knowledgePointId: 'distance-preservation-is-computed-here-and-assumed-there',
    kind: 'evaluate',
    prompt:
      'A is (1, 2) and B is (4, 6), so AB = 5 — the legs are 3 and 4. A quarter turn '
      + 'anticlockwise about the origin, (x, y) → (−y, x), sends A to (−2, 1) and B to (−6, 4). '
      + 'Evaluate sqrt((c - a)^2 + (d - b)^2) at a = -2, b = 1, c = -6, d = 4, where (a, b) and '
      + '(c, d) are those two IMAGES. This is the same expression '
      + 'the-distance-is-a-hypotenuse-1 uses, deliberately — the content here is a comparison of '
      + 'distances, so the measuring instrument has to be the same one. Watch the legs as you '
      + 'go: they were 3 and 4 and they are now −4 and 3, so the quarter turn did move them '
      + 'about. Whether it changed the distance is what you are computing rather than what you '
      + 'are being told.',
    given: 'sqrt((c - a)^2 + (d - b)^2)',
    variables: REAL_ABCD,
    // −6 − (−2) = −4 and 4 − 1 = 3, so 16 + 9 = 25 and the root is 5 exactly —
    // the same 5 as the original segment. A 3-4-5 chosen so that the root is
    // whole at every stage of the comparison: an irrational would have moved
    // the difficulty into the radical, where `roots-and-irrationals` owns it,
    // and would have made the three distances harder to set side by side.
    reference: '5',
    at: { a: '-2', b: '1', c: '-6', d: '4' },
  },
  {
    id: 'the-scaling-multiplies-the-distance-once-1',
    knowledgePointId: 'distance-preservation-is-computed-here-and-assumed-there',
    kind: 'evaluate',
    prompt:
      'The same two points and the same expression, under a scaling by 3 about the origin, '
      + '(x, y) → (3x, 3y): A(1, 2) goes to (3, 6) and B(4, 6) goes to (12, 18). Evaluate '
      + 'sqrt((c - a)^2 + (d - b)^2) at a = 3, b = 6, c = 12, d = 18. Read the answer against '
      + 'the-quarter-turn-returns-the-distance-1, which gave 5 for the same segment, and against '
      + 'the original AB of 5. Before you divide the two answers, notice how many times the 3 '
      + 'went in: it multiplied each leg once, so each squared leg twice, so the number under '
      + 'the root is nine times what it was. The answer is not nine times 5, and the reason is '
      + 'the square root.',
    given: 'sqrt((c - a)^2 + (d - b)^2)',
    variables: REAL_ABCD,
    // 12 − 3 = 9 and 18 − 6 = 12, so 81 + 144 = 225 and the root is 15 exactly
    // = 3 × 5. The factor enters twice under the root and leaves once through
    // it, which is `circle-measure`'s exponent count done on two coordinates.
    // 15 against the previous task's 5 is what makes the scaling fail the
    // isometry test on the evidence rather than by definition.
    reference: '15',
    at: { a: '3', b: '6', c: '12', d: '18' },
  },
  {
    id: 'rotate-about-a-centre-the-x-coordinate-1',
    knowledgePointId: 'the-centre-is-part-of-the-rule-and-the-origin-rule-does-not-know-it',
    kind: 'evaluate',
    prompt:
      'Rotate P(7, 3) a quarter turn anticlockwise about C(4, 1), not about the origin. The rule '
      + '(x, y) → (−y, x) is about the origin, so it is applied to the DISPLACEMENT P − C and '
      + 'the centre is then added back: the image\'s x-coordinate is a − (d − b), where (a, b) '
      + 'is C and (c, d) is P. Evaluate a - (d - b) at a = 4, b = 1, c = 7, d = 3 — and note '
      + 'that the first coordinate subtracts the old VERTICAL displacement, which is the (−y) of '
      + 'the origin rule with the centre put back on either side. The origin rule used directly '
      + 'on P would give −3 here, which is a real point and the answer to a different question.',
    given: 'a - (d - b)',
    variables: REAL_ABCD,
    // P − C = (3, 2); the origin rule turns that to (−2, 3); adding C back
    // gives (4 − 2, 1 + 3) = (2, 4). So the x-coordinate is 4 − (3 − 1) = 2.
    // The rejected −3 is (−y) applied straight to P, which rotates about the
    // origin instead — and C decides between the two: CP² = 3² + 2² = 13, and
    // (2, 4) gives (2 − 4)² + (4 − 1)² = 13 while (−3, 7) gives 49 + 36 = 85.
    // `c` is declared and unused in this expression, deliberately: it is the
    // other half of the point P, the next task uses it, and dropping it would
    // make the two tasks disagree about what the four symbols mean.
    reference: '2',
    at: { a: '4', b: '1', c: '7', d: '3' },
  },
  {
    id: 'rotate-about-a-centre-the-y-coordinate-1',
    knowledgePointId: 'the-centre-is-part-of-the-rule-and-the-origin-rule-does-not-know-it',
    kind: 'evaluate',
    prompt:
      'Same rotation, other axis — because the answer is a POINT and one coordinate is half of '
      + 'it. The image\'s y-coordinate is b + (c - a): the second coordinate ADDS the old '
      + 'horizontal displacement where the first subtracted the vertical one. Evaluate '
      + 'b + (c - a) at a = 4, b = 1, c = 7, d = 3, with (a, b) still C and (c, d) still P. The '
      + 'asymmetry between this expression and rotate-about-a-centre-the-x-coordinate-1\'s is '
      + 'the whole of what a quarter turn does: one subtraction and one addition, not two of '
      + 'either. Check your pair of answers against C before trusting them — a rotation about C '
      + 'cannot change a point\'s distance from C, and CP² = 13.',
    given: 'b + (c - a)',
    variables: REAL_ABCD,
    // 1 + (7 − 4) = 4, so the image is (2, 4). One expression per coordinate
    // and two tasks, because a point is two numbers — the shape
    // `distance-and-midpoint` established for recovering an endpoint. Here the
    // two expressions genuinely DIFFER rather than being the same one at two
    // inputs, and that difference is the content: `a - (d - b)` against
    // `b + (c - a)`. Checks out against the centre: (2 − 4)² + (4 − 1)² =
    // 4 + 9 = 13 = CP².
    reference: '4',
    at: { a: '4', b: '1', c: '7', d: '3' },
  },

  // ── data-summaries, fourteenth promotion: descriptive-statistics ────────
  //
  // Eight tasks — three on the first point, two on the second, three on the
  // third — every one `evaluate`, every one settled by exact rational
  // arithmetic with no worker. The sixth subject in the build to hold that
  // contract, and the first whose material is a function of a LIST rather than
  // of one or two numbers.
  //
  // NOT TWO PER POINT, AND THE SHAPE IS THE CONTENT RATHER THAN A DISTRIBUTION.
  // The first point makes one claim about the mean and TWO about the median —
  // that it is a position, and that an even-length list has no value at that
  // position — and the second of those is not a special case of the first, it is
  // the fact that makes the median a position at all. The third point likewise
  // claims a sign and claims a robustness, and the sign claim is a PAIR: one
  // expression at two inputs whose answers differ in sign, which is the only
  // way an asymmetry gets scored rather than described. The middle point gets
  // two because it makes exactly two claims: the signed deviations cancel, and
  // the squares of them do not.
  //
  // NO `transform_to_form` ANYWHERE, which is a fact about the subject. A
  // `NamedForm` is a claim about the SHAPE of an expression and nothing here
  // asks for a shape — every question is "which number does this list give".
  // The one answer that could have been a surd is the standard deviation, and
  // the eight-value sample was chosen so its variance is 4 and its root exactly
  // 2, because the step being taught is that the root restores the UNITS and a
  // radicand would have made it about radicals instead.
  //
  // THREE SAMPLES, REUSED ACROSS THE POINTS ON PURPOSE. The five donations
  // 5, 10, 15, 20, 200 are the lopsided one: mean 50, median 15, and four of
  // the five below the mean. The eight values 2, 4, 4, 4, 5, 5, 7, 9 are the
  // arithmetic one: total 40, mean 5, squared deviations 32, variance 4,
  // standard deviation 2, and an even length so the median position is 4.5.
  // The five marks 5, 16, 17, 18, 19 exist for ONE job — a mean-minus-median
  // gap that is negative — since every other list in the file is right-tailed
  // and a pair of positive examples would not have shown that the sign is the
  // reading.
  //
  // THE DIVISOR IS n AND THE PROMPTS SAY SO. `the-variance-is-the-mean-of-the-
  // squared-deviations-1` divides by 8, not by 7, so a learner checking against
  // a calculator's `s` button gets 32/7 ≈ 4.571 and a contradiction. The prompt
  // names both numbers and says which question each answers, because that
  // disagreement is the subject's own boundary — n − 1 estimates a population
  // nobody has seen — and a silent 4 would read as an arithmetic error.
  //
  // NO FIGURE IS DESCRIBED AND NONE IS NEEDED, which is the opposite of the
  // constraint `plane-geometry` and `solid-measure` work under. There is no
  // sides-and-angles hazard here because there is no figure at all: a histogram
  // and a box plot are where a list's shape is normally read, reading a shape
  // off a drawing is the judgement this build has declined to grade five times,
  // and the third point teaches the part of the shape that is a SIGN.
  {
    id: 'the-mean-is-the-total-shared-out-by-the-count-1',
    knowledgePointId: 'the-mean-keeps-the-total-and-the-median-keeps-the-position',
    kind: 'evaluate',
    prompt:
      'Five club members gave, in pounds: 200, 15, 5, 20, 10. Evaluate (a+b+c+d+e)/n at '
      + 'a = 5, b = 10, c = 15, d = 20, e = 200, n = 5 to get the mean donation. The divisor is '
      + 'a SYMBOL rather than a 5 on purpose: the mean divides by how many values there are, and '
      + 'reading the 5 as part of the formula is the error that makes a six-value list go wrong. '
      + 'Read your answer backwards to check it means something — if all five had given that '
      + 'amount, the club would hold exactly the money it actually holds. Compare it with '
      + 'the-median-sits-at-a-position-not-at-a-value-1, which asks for the other centre of the '
      + 'same list; choosing between the two is what this point teaches and neither task shows '
      + 'it alone.',
    given: '(a+b+c+d+e)/n',
    variables: SAMPLE_FIVE_AND_COUNT,
    // 5 + 10 + 15 + 20 + 200 = 250, and 250 ÷ 5 = 50. The list is handed to the
    // learner unordered in the prompt's sentence and ordered in the inputs,
    // which is free here and is the point of the next task: the mean does not
    // care and the median cannot be computed until it does.
    //
    // The donations divide exactly because a worked example ending in 11.3
    // would be teaching long division. `SAMPLE_FIVE_AND_COUNT` still declares
    // the five values `real` — a list of measurements is not a list of
    // integers, and the whole numbers here are a convenience of the figures.
    reference: '50',
    at: { a: '5', b: '10', c: '15', d: '20', e: '200', n: '5' },
  },
  {
    id: 'the-median-sits-at-a-position-not-at-a-value-1',
    knowledgePointId: 'the-mean-keeps-the-total-and-the-median-keeps-the-position',
    kind: 'evaluate',
    prompt:
      'The same five donations, now in order: 5, 10, 15, 20, 200. Evaluate (n+1)/2 at n = 5 to '
      + 'get the POSITION the median sits at — not the median itself, which is the value you '
      + 'then read off at that position. The distinction is the whole point: the median is a '
      + 'rank, so it is unmoved by how far the 200 is from everything else, where the mean in '
      + 'the task above is not. Having got the position, the median of this list is £15, and the '
      + 'mean is £50.',
    given: '(n+1)/2',
    variables: SAMPLE_COUNT,
    // (5 + 1)/2 = 3, so the third of 5, 10, 15, 20, 200, which is 15. The task
    // asks for the POSITION and not the value, deliberately: a task whose
    // answer were 15 would be ruled correct by a learner who picked the middle
    // of the list by eye, and the thing worth scoring is that there is a
    // formula for which slot to look in.
    reference: '3',
    at: { n: '5' },
  },
  {
    id: 'an-even-length-list-has-no-value-at-its-middle-position-1',
    knowledgePointId: 'the-mean-keeps-the-total-and-the-median-keeps-the-position',
    kind: 'evaluate',
    prompt:
      'Now eight values: 2, 4, 4, 4, 5, 5, 7, 9. Evaluate (n+1)/2 at n = 8. The same expression '
      + 'as the task above at a different input, and the answer is a HALF — there is no value at '
      + 'position four and a half, which is why an even-length list\'s median is taken as the '
      + 'mean of the two values it falls between, here (4 + 5)/2 = 4.5, and need not be one of '
      + 'the numbers in the list at all. That the position and the median are both 4.5 on this '
      + 'list is a coincidence of these particular numbers and is worth not learning: in '
      + '2, 4, 4, 4, 6, 6, 7, 9 the position is still four and a half and the median is 5.',
    given: '(n+1)/2',
    variables: SAMPLE_COUNT,
    // (8 + 1)/2 = 9/2. One expression at two inputs where the two answers
    // differ in KIND rather than in size — a whole position means a value of
    // the list IS the median, a half position means it is a number computed
    // from two of them — which is the shape `geometric-proof` established for
    // scoring an asymmetry and the only way the even case gets ruled at all.
    //
    // `9/2` rather than `4.5`, and either is accepted: `exactValue` reads a
    // decimal as the fraction it literally is, so a learner answering 4.5 and
    // one answering 9/2 get the same ruling.
    reference: '9/2',
    at: { n: '8' },
  },
  {
    id: 'the-signed-deviations-sum-to-zero-on-any-list-1',
    knowledgePointId: 'the-signed-deviations-cancel-which-is-why-the-squares-are-there',
    kind: 'evaluate',
    prompt:
      'The donations 5, 10, 15, 20, 200 have mean 50. Evaluate '
      + '(a-m)+(b-m)+(c-m)+(d-m)+(e-m) at a = 5, b = 10, c = 15, d = 20, e = 200, m = 50 to get '
      + 'the total of the signed distances from the mean. This is the obvious way to measure '
      + 'spread and the answer is what rules it out — and this is the least symmetric list in '
      + 'the subject, with four values pulling one way and one pulling the other, so the answer '
      + 'is not an accident of nice data. Why it had to come out that way: the sum is '
      + 'Σx − n·m, and n·m IS Σx by the definition of the mean.',
    given: '(a-m)+(b-m)+(c-m)+(d-m)+(e-m)',
    variables: SAMPLE_FIVE_AND_MEAN,
    // −45 − 40 − 35 − 30 + 150 = 0. The four negatives total −150 against the
    // single +150, so the cancellation is one value balancing four rather than
    // a symmetry — which is why this task uses the lopsided donations and the
    // variance task below uses the eight-value sample.
    //
    // A reference of 0 and that is the ruling, in the same way the two
    // converse-of-Pythagoras tasks in `pythagoras` are rulings on a sign:
    // zero here means the method measures nothing, and a learner who answers
    // 150 has added the magnitudes and lost the point.
    reference: '0',
    at: { a: '5', b: '10', c: '15', d: '20', e: '200', m: '50' },
  },
  {
    id: 'the-variance-is-the-mean-of-the-squared-deviations-1',
    knowledgePointId: 'the-signed-deviations-cancel-which-is-why-the-squares-are-there',
    kind: 'evaluate',
    prompt:
      'The eight values 2, 4, 4, 4, 5, 5, 7, 9 total 40, so their mean is 5. Evaluate '
      + '((a-m)^2 + 3*(b-m)^2 + 2*(c-m)^2 + (d-m)^2 + (e-m)^2)/8 at a = 2, b = 4, c = 5, d = 7, '
      + 'e = 9, m = 5 to get the variance. Two things in the expression are the content. The '
      + 'multipliers 3 and 2 are how many times the values 4 and 5 OCCUR: there are eight terms '
      + 'in the total and only five different values, and summarising the five distinct values '
      + 'instead gives 30 ÷ 5 = 6 rather than 4 — a tidy number that describes a different '
      + 'list. And the divisor is 8, the count of the list, because a variance is a MEAN of the '
      + 'squares. A calculator\'s `s` button divides by 7 and returns 32/7, about 4.571; that is '
      + 'not a different arithmetic but a different question, since dividing by n − 1 corrects a '
      + 'bias in estimating a population nobody has seen and nothing here estimates anything. '
      + 'The standard deviation is the square root of your answer.',
    given: '((a-m)^2 + 3*(b-m)^2 + 2*(c-m)^2 + (d-m)^2 + (e-m)^2)/8',
    variables: SAMPLE_FIVE_AND_MEAN,
    // (2−5)² = 9; 3 × (4−5)² = 3; 2 × (5−5)² = 0; (7−5)² = 4; (9−5)² = 16.
    // Total 32, and 32 ÷ 8 = 4, so the standard deviation is √4 = 2 exactly —
    // which is why this sample and not another: a variance that is not a
    // perfect square would make the last step of the worked example a surd and
    // the point is that the root restores the units.
    //
    // 6 is the named wrong answer and it is exact rather than a slip: it is
    // (9 + 1 + 0 + 4 + 16)/5, the variance of the five DISTINCT values against
    // the same mean 5. Both numbers are whole, which is what makes dropping
    // the multiplicities silent.
    //
    // 32/7 is the second named wrong answer and is not wrong about anything
    // except which question was asked. Naming it in the prompt is deliberate:
    // a learner who checks against a spreadsheet gets it, and an unexplained 4
    // would read as an error in this file.
    reference: '4',
    at: { a: '2', b: '4', c: '5', d: '7', e: '9', m: '5' },
  },
  {
    id: 'a-positive-gap-puts-the-tail-on-the-high-side-1',
    knowledgePointId: 'the-sign-of-the-gap-names-the-tail-and-the-quartiles-ignore-it',
    kind: 'evaluate',
    prompt:
      'The donations in order: 5, 10, 15, 20, 200. Evaluate (a+b+c+d+e)/5 - c at a = 5, b = 10, '
      + 'c = 15, d = 20, e = 200 to get the mean minus the median. The expression names the '
      + 'median as c because c is the THIRD of five ordered slots, which is where '
      + '(n + 1)/2 put it. What matters is the SIGN of your answer and not its size: positive '
      + 'means the long tail runs to the high values and has dragged the mean up past the '
      + 'middle. Read this against and-a-negative-gap-puts-it-on-the-low-side-1, which is the '
      + 'identical expression on a different list and comes out the other way — one of the two '
      + 'alone would look like a fact about this subtraction rather than about the list.',
    given: '(a+b+c+d+e)/5 - c',
    variables: REAL_ABCDE,
    // 250/5 − 15 = 50 − 15 = 35. Positive, so the tail is high — which the
    // list confirms: 200 sits far above the other four and nothing sits far
    // below them.
    //
    // The 5 is a literal here where `the-mean-is-the-total-shared-out-by-the-
    // count-1` makes it a symbol, and the difference is not an inconsistency.
    // That task is about dividing by the count; this expression is specifically
    // "an ordered list of FIVE", in which the middle slot is the third — so the
    // count is fixed by the shape of the expression and a symbol would have
    // claimed the `- c` works for any n.
    reference: '35',
    at: { a: '5', b: '10', c: '15', d: '20', e: '200' },
  },
  {
    id: 'and-a-negative-gap-puts-it-on-the-low-side-1',
    knowledgePointId: 'the-sign-of-the-gap-names-the-tail-and-the-quartiles-ignore-it',
    kind: 'evaluate',
    prompt:
      'Five marks out of 20, in order: 5, 16, 17, 18, 19. Evaluate the same '
      + '(a+b+c+d+e)/5 - c at a = 5, b = 16, c = 17, d = 18, e = 19. Same expression, same five '
      + 'slots, and the answer has the opposite sign — negative, so this list\'s long tail runs '
      + 'to the LOW values, which is the single mark of 5 among four in the high teens. Its SIZE '
      + 'is not comparable with the 35 the donations gave: one list is in pounds and the other '
      + 'in marks, and the gap carries the units of the data. The sign is the whole reading.',
    given: '(a+b+c+d+e)/5 - c',
    variables: REAL_ABCDE,
    // 5 + 16 + 17 + 18 + 19 = 75, so 75/5 − 17 = 15 − 17 = −2. Negative, so
    // the tail is low.
    //
    // One expression at two inputs whose verdicts differ in KIND — tail high
    // against tail low — rather than in magnitude, which is the shape
    // `geometric-proof` settled for scoring an asymmetry and the reason these
    // are two tasks rather than one. The marks exist in this file for this job
    // alone: every other list here is right-tailed.
    //
    // A mark out of 20 and nothing about the figures is impossible, which is
    // worth noting only because the geometry subjects cannot say it: there is
    // no figure here, so there is no sides-and-angles hazard to avoid.
    reference: '-2',
    at: { a: '5', b: '16', c: '17', d: '18', e: '19' },
  },
  {
    id: 'the-interquartile-range-reads-only-the-middle-of-the-list-1',
    knowledgePointId: 'the-sign-of-the-gap-names-the-tail-and-the-quartiles-ignore-it',
    kind: 'evaluate',
    prompt:
      'Split 2, 4, 4, 4, 5, 5, 7, 9 into two halves of four and take each half\'s median: the '
      + 'lower half is 2, 4, 4, 4 and the upper half is 5, 5, 7, 9. Evaluate '
      + '(c+d)/2 - (a+b)/2 at a = 4, b = 4, c = 5, d = 7 to get the interquartile range — a and '
      + 'b are the lower half\'s middle two and c and d the upper half\'s. Now replace the 9 by '
      + '90. The range goes from 9 − 2 = 7 to 90 − 2 = 88, up by exactly the 81 the value moved; '
      + 'all four of the inputs above are UNCHANGED, because the median of four numbers is the '
      + 'mean of its middle two and 90 is not one of them. Conventions for interpolating a '
      + 'quartile differ and a spreadsheet gives 1.5 here rather than your answer; what does not '
      + 'depend on the convention is that replacing the largest value leaves it alone.',
    given: '(c+d)/2 - (a+b)/2',
    variables: REAL_ABCD,
    // Q₁ = (4 + 4)/2 = 4, Q₃ = (5 + 7)/2 = 6, so the interquartile range is 2.
    // After 9 → 90 the upper half is 5, 5, 7, 90 and its median is still
    // (5 + 7)/2 = 6, so the four inputs and the answer are both unchanged —
    // which is the claim, and asserting it as "the inputs do not move" is
    // stronger than computing the same number twice.
    //
    // The convention is Tukey's: halves of four, each half's own median. Linear
    // interpolation between order statistics — `QUARTILE.INC` — puts Q₃ at
    // position 6.25 and gives 5.5, hence 1.5 rather than 2. Both are named in
    // the prompt because a convention nobody states is how a learner concludes
    // their arithmetic is broken, and under BOTH of them the figure survives
    // the swap: the robustness is a property of which order statistics a
    // quartile reads and the value is a property of the convention.
    reference: '2',
    at: { a: '4', b: '4', c: '5', d: '7' },
  },

  // ── statements-and-connectives, thirty-fifth promotion: propositional-logic
  //
  // Eight tasks — three on the first point, two on the second, three on the
  // third — every one `evaluate`, every one settled by exact rational
  // arithmetic with no worker. The seventh subject in the build to hold that
  // contract.
  //
  // THE ENCODING IS THE ONLY WAY THESE QUESTIONS BECOME NUMBERS, and it is
  // taught rather than used. `evaluate` asks for a value and a truth value is
  // not one, so true is written 1 and false 0, and each connective is the
  // polynomial that reproduces its table: ¬p is 1 − p, p ∧ q is pq, p ∨ q is
  // p + q − pq, and p → q is 1 − p + pq. Those hold on {0, 1} and nowhere
  // else. ontology-logic.ts spends a section on the hazard that creates — a
  // learner concluding the polynomial IS the connective — and the repair is
  // the third task below, which shows the arithmetic breaking at p = 1/2 on
  // purpose. A promotion that had quietly used the encoding to get gradable
  // numbers would have shipped the same eight answers and taught something
  // false.
  //
  // NO `transform_to_form` ANYWHERE, which is a fact about the subject. A
  // `NamedForm` is a claim about the SHAPE of an expression, and the only
  // demand of that kind available here — "write this column as a polynomial in
  // p and q" — would grade the shape of an encoding rather than anything
  // logical. The third point's whole content is that two expressions are
  // EQUAL, which is what an `evaluate` on their difference asks and what no
  // form check can say.
  //
  // NO `counterexample` EITHER, and the second point is exactly where it would
  // go. "Produce a number that ends in 6 and is odd" is the ask, and ruling it
  // needs a checker that can test a produced object against a claim; this file
  // declares the kind verifiable and ships none of it, as ontology-geometry.ts
  // records. It is asked as the two values it reduces to instead — the row
  // that refutes and the row that does not — which is less than the real ask
  // and is the honest amount less.
  //
  // THREE DIFFERENCES OF COLUMNS, AND TWO OF THEM ARE IDENTITIES. The
  // contrapositive task and the De Morgan task both have reference 0 because
  // their two expressions are the same polynomial, so the answer is 0 at every
  // row rather than at the row the task happens to substitute — which is why
  // each prompt says so and names a second row. The converse task is the one
  // where the difference survives, and it survives as exactly q − p, so its
  // answer is −1 rather than 0 and the SIGN is the reading. That asymmetry is
  // one expression at two inputs whose answers differ in sign, which is the
  // shape `geometric-proof` settled for scoring an asymmetry and the reason the
  // prompt gives both rows.
  //
  // NO `domainConditions` ON ANY OF THE EIGHT. Every expression is a
  // polynomial, every substitution is an integer, and nothing divides by
  // anything — so there is no value of any symbol at which a ruling would need
  // qualifying. The restriction that does exist, p ∈ {0, 1}, is not a domain
  // condition in this schema's sense and could not be written as one; see
  // `TRUTH_VALUES`.
  {
    id: 'a-table-over-n-letters-has-two-to-the-n-rows-1',
    knowledgePointId: 'a-connective-is-a-finite-table-and-a-row-is-a-computation',
    kind: 'evaluate',
    prompt:
      'A truth table has one row for every way its letters can come out true or false. Evaluate '
      + '2^n at n = 3 to get the number of rows for three letters. The base is 2 because each '
      + 'letter has two possibilities and the exponent is the number of letters, so every letter '
      + 'you add DOUBLES the table — each existing row splits into one where the new letter is '
      + 'true and one where it is false. Your answer is the reason exhausting the rows counts as '
      + 'a proof here: it is a number you can write out in full, and once you have, there is no '
      + 'further case hiding. Compare a claim about all triangles, where a hundred cases that '
      + 'fit establish nothing, because the triangles do not run out.',
    given: '2^n',
    variables: LETTER_COUNT,
    // 2³ = 8. Asked as 2^n at a stated n rather than as the literal 8, because
    // the content is that the count is a POWER of two and not that three
    // letters give eight: a task whose answer were 8 would be ruled correct by
    // a learner who had written the eight rows out and counted them, which is
    // the one thing this point does not need scored.
    reference: '8',
    at: { n: '3' },
  },
  {
    id: 'or-is-inclusive-so-both-true-makes-it-true-1',
    knowledgePointId: 'a-connective-is-a-finite-table-and-a-row-is-a-computation',
    kind: 'evaluate',
    prompt:
      'Write true as 1 and false as 0. Then "p or q" is p + q − pq, which is that connective\'s '
      + 'table rewritten as arithmetic. Evaluate p + q - p*q at p = 1, q = 1 — the row where '
      + 'BOTH statements are true. If a box is both red and heavy, your answer is what "the box '
      + 'is red or heavy" says about it. That row is the one worth being sure of: mathematics '
      + 'always means the INCLUSIVE or, where English usually means the exclusive one — "tea or '
      + 'coffee" offers you one of them. The exclusive connective is a different column and has '
      + 'to be said out loud when it is meant. Check the other three rows while you are here: '
      + '1 + 0 − 0 = 1, 0 + 1 − 0 = 1, and 0 + 0 − 0 = 0, so the only false row is the one where '
      + 'neither holds.',
    given: 'p + q - p*q',
    variables: TRUTH_VALUES,
    // 1 + 1 − 1·1 = 1. The both-true row specifically: the other three are
    // uncontroversial and are given in the prompt rather than asked, because
    // this is the single row on which the English reading and the mathematical
    // one disagree and it is the whole claim of the task.
    reference: '1',
    at: { p: '1', q: '1' },
  },
  {
    id: 'the-excluded-middle-is-a-tautology-only-on-the-two-values-1',
    knowledgePointId: 'a-connective-is-a-finite-table-and-a-row-is-a-computation',
    kind: 'evaluate',
    prompt:
      '"P or not P" puts p and 1 − p into the or-formula: p + (1 − p) − p(1 − p). Evaluate '
      + 'p + (1-p) - p*(1-p) at p = 1. Then do it at p = 0 and you get 1 again, so the column is '
      + 'all ones and the statement is true whatever P says — a TAUTOLOGY. Now the part that is '
      + 'the real lesson. That expression simplifies to 1 − p + p², which is NOT the constant 1: '
      + 'at p = 1/2 it is 1 − 1/2 + 1/4 = 3/4. It agrees with the table only because p² = p when '
      + 'p is 0 or 1, and for no other number. So this arithmetic is a way of computing a row '
      + 'and never a definition of what "or" and "not" mean — the table is the definition, and '
      + 'the encoding is a tool that works on exactly two inputs.',
    given: 'p + (1-p) - p*(1-p)',
    variables: TRUTH_VALUE,
    // 1 + 0 − 1·0 = 1, and at p = 0 it is 0 + 1 − 0 = 1.
    //
    // Declares `p` alone rather than reusing `TRUTH_VALUES`, because the
    // statement mentions one letter and a declared-but-unmentioned `q` would
    // say this compound has a four-row table when it has two.
    //
    // THE TASK EXISTS FOR ITS PROMPT'S SECOND HALF rather than for its answer,
    // which is the only one of the eight that is true of it. 1 is also the
    // answer at the other row, so the number alone scores nothing the previous
    // task has not already scored. What it buys is a learner who has computed
    // 1 − p + p² and has been shown it is 3/4 at a half, in the one place in
    // this subject where the encoding visibly stops being the mathematics.
    reference: '1',
    at: { p: '1' },
  },
  {
    id: 'a-false-hypothesis-makes-an-implication-true-1',
    knowledgePointId: 'an-implication-is-false-in-exactly-one-of-its-four-rows',
    kind: 'evaluate',
    prompt:
      'The column for "if p then q" is 1 − p + pq. Evaluate 1 - p + p*q at p = 0, q = 0 — the '
      + 'row where both statements are false. Your answer says that "if 2 + 2 = 5 then 7 is '
      + 'even" is a TRUE statement, which is the part of this table that feels wrong and is the '
      + 'part worth understanding: an implication claims nothing at all about what happens when '
      + 'its hypothesis fails, so there is nothing there for it to be wrong about — and a '
      + 'connective has to return a value for every row of its table rather than leave two of '
      + 'them blank. Do p = 0, q = 1 as well and you get the same answer, so BOTH '
      + 'false-hypothesis rows go this way and neither depends on the conclusion.',
    given: '1 - p + p*q',
    variables: TRUTH_VALUES,
    // 1 − 0 + 0·0 = 1.
    //
    // Paired with the task below: one expression at two inputs whose answers
    // differ, which is how the asymmetry gets scored rather than described.
    // This is the row a learner expects to be false and is not.
    reference: '1',
    at: { p: '0', q: '0' },
  },
  {
    id: 'the-one-row-that-refutes-an-implication-1',
    knowledgePointId: 'an-implication-is-false-in-exactly-one-of-its-four-rows',
    kind: 'evaluate',
    prompt:
      'The same expression, one row along. Evaluate 1 - p + p*q at p = 1, q = 0 — hypothesis '
      + 'true, conclusion false. This is the only one of the four rows whose answer is not 1, so '
      + 'an implication makes exactly ONE claim: that this combination does not occur. The '
      + 'consequence is a rule about refutation. To break "if a whole number ends in 6 then it '
      + 'is even" you must produce something sitting in THIS row — a number that ends in 6 and '
      + 'is odd — and nothing else will do. The number 15 is odd, so it has half of what is '
      + 'wanted, but it does not end in 6, so it sits in a row where the implication is true and '
      + 'refutes nothing. A proposed counterexample has to pass the hypothesis before anything '
      + 'else about it means anything.',
    given: '1 - p + p*q',
    variables: TRUTH_VALUES,
    // 1 − 1 + 1·0 = 0.
    //
    // Shares its `given` with the task above and differs only in `at`, which is
    // the point: the two rows are the same connective and the learner is
    // scored on knowing which one carries the claim.
    //
    // The prompt stops short of saying the number claim is TRUE, deliberately.
    // Four rows fix what a refutation would look like and decide nothing about
    // the digits; that argument is 10k + 6 = 2(5k + 3) and belongs to
    // `divisibility`. The worked example says the same thing at more length.
    reference: '0',
    at: { p: '1', q: '0' },
  },
  {
    id: 'an-implication-and-its-contrapositive-never-differ-1',
    knowledgePointId: 'the-contrapositive-is-the-same-column-and-the-converse-is-not',
    kind: 'evaluate',
    prompt:
      'The contrapositive of "if p then q" is "if not q then not p", which is the implication\'s '
      + 'own formula with the negated letters substituted into it: 1 − (1 − q) + (1 − q)(1 − p). '
      + 'Evaluate (1 - p + p*q) - (1 - (1-q) + (1-q)*(1-p)) at p = 1, q = 0 to get the '
      + 'difference between the original column and the contrapositive\'s. Then try any other '
      + 'row and you will get the same answer, because the second expression multiplies out to '
      + '1 − p + pq — the first one exactly. The two are the same polynomial, so they agree in '
      + 'all four rows at once rather than in four rows that were checked one at a time, and '
      + 'that is what makes a contrapositive the same claim and not a second one. Proving either '
      + 'has proved both, free of charge.',
    given: '(1 - p + p*q) - (1 - (1-q) + (1-q)*(1-p))',
    variables: TRUTH_VALUES,
    // 1 − (1 − q) is q, and (1 − q)(1 − p) is 1 − p − q + pq, so the
    // contrapositive is q + 1 − p − q + pq = 1 − p + pq. The difference is
    // identically zero, and at p = 1, q = 0 both sides are 0.
    //
    // A row is substituted because `evaluate` needs one, and the prompt says
    // the answer does not depend on which — the claim is the identity and the
    // single row is how this schema can ask about it.
    reference: '0',
    at: { p: '1', q: '0' },
  },
  {
    id: 'an-implication-and-its-converse-differ-by-q-minus-p-1',
    knowledgePointId: 'the-contrapositive-is-the-same-column-and-the-converse-is-not',
    kind: 'evaluate',
    prompt:
      'The converse of "if p then q" is "if q then p", whose column is 1 − q + qp. Evaluate '
      + '(1 - p + p*q) - (1 - q + q*p) at p = 1, q = 0. Unlike the contrapositive, this '
      + 'difference does NOT vanish: the 1s cancel and pq and qp are the same term, so what is '
      + 'left is exactly q − p. That is 0 in the two rows where the letters agree — where the '
      + 'converse happens to match by accident of those rows rather than by meaning the same '
      + 'thing — and ±1 in the other two, where the SIGN says which of the pair is the true one. '
      + 'Your answer is negative, so here the original is false and the converse is true. At '
      + 'p = 0, q = 1 it is +1 the other way. "If a quadrilateral is a square then it has four '
      + 'right angles" and its converse are that second row: a rectangle longer than it is wide '
      + 'has the angles without being a square.',
    given: '(1 - p + p*q) - (1 - q + q*p)',
    variables: TRUTH_VALUES,
    // (1 − p + pq) − (1 − q + qp) = q − p. At p = 1, q = 0 that is −1; at
    // p = 0, q = 1 it is +1; at both-true and both-false it is 0.
    //
    // The negative row is the one asked, and asked rather than the positive
    // one because a learner who subtracted in the wrong order gets +1 and the
    // task should catch that. The prompt gives the other row so the pair is
    // visible without a second task: the content is that the sign reads, which
    // needs both and is not a claim either value makes alone.
    reference: '-1',
    at: { p: '1', q: '0' },
  },
  {
    id: 'de-morgan-is-two-columns-that-coincide-1',
    knowledgePointId: 'the-contrapositive-is-the-same-column-and-the-converse-is-not',
    kind: 'evaluate',
    prompt:
      '"Not (p and q)" is 1 − pq. "Not p or not q" puts 1 − p and 1 − q into the or-formula: '
      + '(1 − p) + (1 − q) − (1 − p)(1 − q). Evaluate '
      + '(1 - p*q) - ((1-p) + (1-q) - (1-p)*(1-q)) at p = 1, q = 0 to get the difference between '
      + 'them. It is the same answer at every row, because the second expression is '
      + '(2 − p − q) − (1 − p − q + pq) = 1 − pq, which is the first. So the two statements are '
      + 'LOGICALLY EQUIVALENT — their columns agree everywhere — and "the box is not both red '
      + 'and heavy" says exactly what "the box is not red, or it is not heavy" says, which is '
      + 'worth knowing because the second is the one people doubt. Note this identity needs no '
      + 'appeal to p² = p, unlike the excluded middle: it is an identity in p and q outright.',
    given: '(1 - p*q) - ((1-p) + (1-q) - (1-p)*(1-q))',
    variables: TRUTH_VALUES,
    // (1 − p) + (1 − q) = 2 − p − q, and (1 − p)(1 − q) = 1 − p − q + pq, so
    // the right-hand side is 1 − pq, which is the left. Identically zero, and
    // at p = 1, q = 0 both sides are 1.
    //
    // THE SECOND ZERO IN THE POINT, AND THAT IS THE REASON IT IS HERE. The
    // contrapositive task establishes that a zero difference means one claim;
    // this one applies the same test to a pair whose equivalence a learner has
    // no intuition for, so the method is what transfers rather than the
    // particular rearrangement. It is also the file's one identity that holds
    // without the {0, 1} restriction, which the prompt points out — the
    // contrast with the excluded middle is what keeps that restriction a fact
    // a learner can check rather than a caveat they are asked to accept.
    reference: '0',
    at: { p: '1', q: '0' },
  },

  // ── predicates-and-quantifiers, thirty-sixth promotion: quantifiers
  //
  // Nine tasks, three on each point, every one `evaluate` and every one settled
  // by exact rational arithmetic with no worker. The eighth subject in the
  // build to hold that contract.
  //
  // THE ENCODING IS THE TWELFTH SUBJECT'S, EXTENDED BY EXACTLY ONE STEP, and
  // the step is the content rather than a convenience. There, true was 1 and
  // false 0 and each connective was the polynomial reproducing its table. Here
  // a quantifier over a finite domain is that connective REPEATED across the
  // domain: "for all" is the product of the values, "there exists" is 1 minus
  // the product of the opposites, and the witness count is their sum. So the
  // two quantifiers are not new connectives and the tasks say so by SHARING
  // their expressions — see the next paragraph.
  //
  // SIX DISTINCT `given`s ACROSS NINE TASKS, AND THE REUSE IS THE CLAIM.
  // `a*b*c*d` is asked twice and `1 - (1-a)*(1-b)*(1-c)*(1-d)` three times, at
  // different rows. That is the implication pair's shape from the twelfth
  // subject — one expression at two inputs — carried across a point boundary on
  // purpose: the universal over a predicate and the universal over four inner
  // existentials are the SAME product, and two different expressions would say
  // they were two facts. A learner who has computed the product once meets it
  // again in the quantifier-order point with the symbols meaning something else
  // and the arithmetic unchanged, which is what "a quantifier is a repeated
  // connective" amounts to.
  //
  // THE DOMAIN OF EVERY FINITE-DOMAIN TASK IS 1, 2, 3, 4, stated in each
  // prompt. The first worked example uses six members because it also changes
  // the domain mid-problem; the tasks use four because the extra two would be
  // bookkeeping. What the prompts must not do is leave the domain out, since
  // the subject's first point is that a quantified claim quoted without its
  // domain is not a statement.
  //
  // ONE IDENTITY, AND IT NEEDS NO RESTRICTION. The duality task's difference is
  // identically zero because 1 − (1 − a) is a outright, so "not every x
  // satisfies P" and "some x fails P" are one expression written twice. Its
  // prompt points out that this needs no appeal to a² = a, which is the
  // contrast the twelfth subject drew between De Morgan and the excluded middle
  // — and the contrast is what keeps the {0, 1} restriction a fact a learner
  // can check rather than a caveat they are asked to accept.
  //
  // NO `transform_to_form` AND NO `counterexample`, for the reasons
  // ontology-quantifiers.ts argues. The natural `counterexample` ask here is
  // "produce an n for which n² + n + 11 is composite"; ruling it needs a checker
  // that can test a produced object against a claim, which this file declares
  // verifiable and ships none of. It is asked as the VALUE at the refuting n
  // instead, with the prompt naming 121 = 11 × 11, which is less than the real
  // ask and is the honest amount less.
  //
  // NO `domainConditions` ON ANY OF THE NINE. Every expression is a polynomial,
  // every substitution an integer, and nothing divides by anything. The
  // restriction that does exist is membership of {0, 1} for eight of them, which
  // is not a domain condition in this schema's sense; see `FOUR_TRUTH_VALUES`.
  // The ninth substitutes n = 10, which is a member of a domain rather than a
  // truth value, and `WHOLE_NUMBER_INDEX` says why it is not declared positive.
  {
    id: 'the-witness-count-answers-both-quantifiers-1',
    knowledgePointId:
      'a-quantifier-closes-a-hole-and-over-a-finite-domain-it-is-a-repeated-connective',
    kind: 'evaluate',
    prompt:
      'Let P(x) be "x divides 6" and let the domain be the four numbers 1, 2, 3, 4. Fill the '
      + 'hole one value at a time, writing true as 1 and false as 0: 6 ÷ 1 = 6 so a = 1, '
      + '6 ÷ 2 = 3 so b = 1, 6 ÷ 3 = 2 so c = 1, and 6 ÷ 4 = 1.5 so d = 0. Now evaluate '
      + 'a + b + c + d at those values to get the WITNESS COUNT — how many members of the '
      + 'domain satisfy P. Your answer is what both quantifiers are about to be read off: "there '
      + 'exists x with P(x)" asks only whether this count is at least 1, and "for all x, P(x)" '
      + 'asks whether it is all four. One count, two questions, and the two quantifiers are two '
      + 'thresholds on it rather than two separate things to work out.',
    given: 'a + b + c + d',
    variables: FOUR_TRUTH_VALUES,
    // 1 + 1 + 1 + 0 = 3. Three of the four numbers divide 6; 4 does not.
    //
    // Asked FIRST of the three, because the count is what makes the two
    // quantifiers one fact. A task set that opened with the product would teach
    // "for all" as a trick with multiplication rather than as a threshold on
    // something a learner has already counted.
    reference: '3',
    at: { a: '1', b: '1', c: '1', d: '0' },
  },
  {
    id: 'for-all-is-and-repeated-so-one-zero-factor-kills-it-1',
    knowledgePointId:
      'a-quantifier-closes-a-hole-and-over-a-finite-domain-it-is-a-repeated-connective',
    kind: 'evaluate',
    prompt:
      'Same predicate and same domain: P(x) is "x divides 6" over 1, 2, 3, 4, with values a = 1, '
      + 'b = 1, c = 1, d = 0. "For all x, P(x)" claims every value is 1 at once, which is "and" '
      + 'repeated across the domain — and in this arithmetic "and" is multiplication. Evaluate '
      + 'a*b*c*d at those values. Your answer says the universal claim is FALSE, and the way it '
      + 'is false is the lesson: the product is 0 because of the SINGLE factor at x = 4, and the '
      + 'three 1s in front of it make no difference whatever. That is "one counterexample '
      + 'refutes a universal claim", written as arithmetic. Change d to 1 — which is what '
      + 'happens if you take the domain to be 1, 2, 3, 6 instead — and the product becomes 1, '
      + 'because the domain is part of the claim and not decoration.',
    given: 'a*b*c*d',
    variables: FOUR_TRUTH_VALUES,
    // 1 · 1 · 1 · 0 = 0.
    //
    // SHARES ITS EXPRESSION WITH THE QUANTIFIER-ORDER TASK three points down,
    // where the same product is taken over four inner existentials instead of
    // four predicate values and comes out 1. That is deliberate: a universal is
    // one product whatever its factors mean, and asserting the shared `given`
    // is what records the claim.
    reference: '0',
    at: { a: '1', b: '1', c: '1', d: '0' },
  },
  {
    id: 'there-exists-is-or-repeated-over-the-domain-1',
    knowledgePointId:
      'a-quantifier-closes-a-hole-and-over-a-finite-domain-it-is-a-repeated-connective',
    kind: 'evaluate',
    prompt:
      'Same predicate P(x) = "x divides 6", same domain 1, 2, 3, 4, same values a = 1, b = 1, '
      + 'c = 1, d = 0. "There exists x with '
      + 'P(x)" is "or" repeated across the domain, and the previous concept proved that an "or" '
      + 'is 1 minus the product of the opposites. Evaluate 1 - (1-a)*(1-b)*(1-c)*(1-d). The '
      + 'opposites here are 0, 0, 0, 1, their product is 0, and your answer is 1: the '
      + 'existential is TRUE. Note how little it takes — a single factor of 1 among the values '
      + 'makes one of the opposites 0 and kills their product, which is the mirror image of the '
      + 'universal being killed by a single 0. That is why refuting "for all" costs one object '
      + 'and refuting "there exists" costs every object in the domain.',
    given: '1 - (1-a)*(1-b)*(1-c)*(1-d)',
    variables: FOUR_TRUTH_VALUES,
    // 1 − (0 · 0 · 0 · 1) = 1 − 0 = 1.
    //
    // The third of three on one row, which is the point of the trio: the same
    // four values are summed, multiplied, and co-multiplied, and the learner
    // ends holding one count and two readings of it rather than three
    // unconnected answers.
    reference: '1',
    at: { a: '1', b: '1', c: '1', d: '0' },
  },
  {
    id: 'nine-cases-in-a-row-are-not-a-proof-1',
    knowledgePointId: 'negating-a-quantifier-swaps-it-and-one-object-refutes-a-universal',
    kind: 'evaluate',
    prompt:
      'Somebody claims that n² + n + 11 is prime for every whole number n. They have checked '
      + 'n = 0 through n = 9 and got 11, 13, 17, 23, 31, 41, 53, 67, 83 and 101 — all ten prime. '
      + 'Evaluate n^2 + n + 11 at n = 10. Your answer is 121, which is 11 × 11 and therefore not '
      + 'prime, so this single value refutes the universal claim; and because the search ran in '
      + 'order it is also the SMALLEST n that does. Ten supporting cases is real evidence and it '
      + 'is not a proof. What the ten do establish is the smaller claim "for every n with '
      + '0 ≤ n ≤ 9, n² + n + 11 is prime", which is true and is proved, because that domain is '
      + 'finite and the ten checks exhaust it.',
    given: 'n^2 + n + 11',
    variables: WHOLE_NUMBER_INDEX,
    // 100 + 10 + 11 = 121 = 11².
    //
    // THIS IS THE `counterexample` ASK REDUCED TO A VALUE, which is the honest
    // amount less than the real one. "Produce an n for which this is composite"
    // needs a checker that can test a produced object against a claim; the kind
    // is declared verifiable in this file and ships nothing. So the n is GIVEN
    // and the value asked, with the factorisation in the prompt rather than in
    // the ruling. A learner who answers 121 has not been scored on noticing
    // that 121 is composite, and the prompt says it instead of pretending
    // otherwise.
    reference: '121',
    at: { n: '10' },
  },
  {
    id: 'negating-a-universal-gives-an-existential-as-the-same-expression-1',
    knowledgePointId: 'negating-a-quantifier-swaps-it-and-one-object-refutes-a-universal',
    kind: 'evaluate',
    prompt:
      'Over a four-member domain with P\'s values a, b, c, d, "for all x, P(x)" is the product '
      + 'abcd, so "NOT every x satisfies P" is 1 − abcd. The other way of saying it is "SOME x '
      + 'fails P" — an existential over the opposite predicate, whose values are 1 − a, 1 − b, '
      + '1 − c, 1 − d — which is 1 − (1 − (1−a))(1 − (1−b))(1 − (1−c))(1 − (1−d)). Evaluate '
      + '(1 - a*b*c*d) - (1 - (1-(1-a))*(1-(1-b))*(1-(1-c))*(1-(1-d))) at a = 1, b = 1, c = 1, '
      + 'd = 0 to get the difference between those two readings. Try any other row and you get '
      + 'the same answer, because 1 − (1 − a) is a outright: the second expression IS 1 − abcd. '
      + 'So negating a universal gives an existential as one expression written twice rather '
      + 'than as a rule to memorise — and note that this collapse needs NO appeal to a² = a, '
      + 'unlike the excluded middle in the previous concept.',
    given: '(1 - a*b*c*d) - (1 - (1-(1-a))*(1-(1-b))*(1-(1-c))*(1-(1-d)))',
    variables: FOUR_TRUTH_VALUES,
    // 1 − (1 − a) is a, so the right-hand expression is 1 − abcd, which is the
    // left. Identically zero — checked at all sixteen rows in
    // tests/concepts-logic.mjs rather than only at the one substituted, because
    // a reference of 0 is the easiest thing in this file to produce by
    // accident.
    //
    // A row is substituted because `evaluate` needs one, and the prompt says
    // the answer does not depend on which: the claim is the identity, and a
    // single row is how this schema can ask about one.
    reference: '0',
    at: { a: '1', b: '1', c: '1', d: '0' },
  },
  {
    id: 'one-counterexample-is-enough-and-the-complements-count-them-1',
    knowledgePointId: 'negating-a-quantifier-swaps-it-and-one-object-refutes-a-universal',
    kind: 'evaluate',
    prompt:
      'Back to P(x) = "x divides 6" over 1, 2, 3, 4, with values a = 1, b = 1, c = 1, d = 0. A '
      + 'counterexample is a member where the value is 0, so the number of counterexamples is '
      + 'the sum of the opposites. Evaluate (1-a) + (1-b) + (1-c) + (1-d). Your answer is 1, and '
      + 'that is the whole reading of the universal claim: "for all x, P(x)" is false exactly '
      + 'when this count is at least 1, and ONE object out of four was enough. Compare the other '
      + 'quantifier. To refute "there exists x with P(x)" you would need this count to reach 4 — '
      + 'every member ruled out, with no shortcut — which is why "find a counterexample" is a '
      + 'reasonable instruction and "find no counterexample" reports a search rather than '
      + 'finishing a proof.',
    given: '(1-a) + (1-b) + (1-c) + (1-d)',
    variables: FOUR_TRUTH_VALUES,
    // 0 + 0 + 0 + 1 = 1. The witness count was 3 of 4; this is the other 1.
    //
    // Paired with the first task of the subject by arithmetic rather than by
    // cross-reference: the two answers sum to the size of the domain, which is
    // the duality as a count instead of as an identity. The identity task above
    // is the same fact as an expression, and having both is the point — one is
    // checkable at a row, the other at every row.
    reference: '1',
    at: { a: '1', b: '1', c: '1', d: '0' },
  },
  {
    id: 'for-every-x-there-is-a-y-chosen-afresh-each-time-1',
    knowledgePointId:
      'two-different-quantifiers-do-not-commute-and-one-order-is-the-stronger-claim',
    kind: 'evaluate',
    prompt:
      'Let the domain be 1, 2, 3, 4 and let R(x, y) mean x + y = 5. Take the claim "for every x '
      + 'there is a y with R(x, y)". Walk the four values of x and ask whether SOME y works for '
      + 'each: x = 1 takes y = 4, x = 2 takes y = 3, x = 3 takes y = 2, x = 4 takes y = 1. So '
      + 'the four inner existentials are a = 1, b = 1, c = 1, d = 1. The outer "for every x" is '
      + 'those four joined by "and", which is their product — the same product a universal '
      + 'always is, with inner quantified statements in place of a predicate\'s values. Evaluate '
      + 'a*b*c*d. Your answer says the claim is TRUE, and the four witnesses were four '
      + 'different numbers: nothing in the sentence asked them to be the same one.',
    given: 'a*b*c*d',
    variables: FOUR_TRUTH_VALUES,
    // 1 · 1 · 1 · 1 = 1.
    //
    // SHARES ITS EXPRESSION WITH THE SECOND TASK OF THE SUBJECT, which is the
    // claim rather than a saving: a universal is one product whatever its
    // factors stand for. There the four factors were a predicate's values and
    // the answer was 0; here they are four inner existentials and it is 1.
    reference: '1',
    at: { a: '1', b: '1', c: '1', d: '1' },
  },
  {
    id: 'swapping-to-there-is-one-y-for-every-x-makes-it-false-1',
    knowledgePointId:
      'two-different-quantifiers-do-not-commute-and-one-order-is-the-stronger-claim',
    kind: 'evaluate',
    prompt:
      'Same domain 1, 2, 3, 4 and same relation x + y = 5, with the two quantifiers swapped: '
      + '"there is a y such that for every x, R(x, y)". The choice of y now sits OUTSIDE the '
      + '"for every x", so one y must be fixed in advance and serve all four. Check each: y = 1 '
      + 'works only at x = 4, y = 2 only at x = 3, y = 3 only at x = 2, y = 4 only at x = 1. So '
      + 'the four inner universals are a = 0, b = 0, c = 0, d = 0. The outer "there is a y" is '
      + 'those four joined by "or". Evaluate 1 - (1-a)*(1-b)*(1-c)*(1-d). Your answer is 0 — the '
      + 'claim is FALSE, where the other order was true, and the only thing that changed was '
      + 'which quantifier came first. Subtract this from the previous answer and you get 1; that '
      + 'difference can be 0 or 1 and never −1, because one y serving everybody serves each in '
      + 'particular, so this order is the STRONGER claim.',
    given: '1 - (1-a)*(1-b)*(1-c)*(1-d)',
    variables: FOUR_TRUTH_VALUES,
    // 1 − (1 · 1 · 1 · 1) = 1 − 1 = 0.
    //
    // The all-zero row of the existential expression, which no task in the
    // first point reaches: there the question was whether anything satisfies a
    // predicate and something did. Here it is the row that carries the content,
    // because a mixed-order pair is only interesting when the stronger claim
    // fails.
    reference: '0',
    at: { a: '0', b: '0', c: '0', d: '0' },
  },
  {
    id: 'a-uniform-witness-closes-the-gap-between-the-two-orders-1',
    knowledgePointId:
      'two-different-quantifiers-do-not-commute-and-one-order-is-the-stronger-claim',
    kind: 'evaluate',
    prompt:
      'Same domain 1, 2, 3, 4, same quantifier order "there is a y such that for every x", and a '
      + 'new relation: R(x, y) means "xy is even". Fix each y and ask whether every x works. '
      + 'y = 1 fails at x = 1, since 1 · 1 = 1, so a = 0. y = 2 gives 2, 4, 6, 8 — all even — so '
      + 'b = 1. y = 3 fails at x = 1, so c = 0. y = 4 gives 4, 8, 12, 16, all even, so d = 1. '
      + 'Evaluate 1 - (1-a)*(1-b)*(1-c)*(1-d) at those values. Your answer is 1: the stronger '
      + 'order is TRUE here, which forces the weaker one true as well, so the difference between '
      + 'the two orders closes to 0. What closed it is a single UNIFORM witness — y = 2 works for '
      + 'all four x at once, where x + y = 5 had a different y for each. "One that works for all '
      + 'of them, or only one for each" is the entire question quantifier order asks.',
    given: '1 - (1-a)*(1-b)*(1-c)*(1-d)',
    variables: FOUR_TRUTH_VALUES,
    // 1 − (1 · 0 · 1 · 0) = 1 − 0 = 1. y = 2 and y = 4 both serve every x; the
    // claim needs only that one of them does.
    //
    // THE THIRD TASK ON ONE EXPRESSION, and the row is chosen so that two of
    // the four factors are 1 rather than one. A row with a single 1 would be
    // indistinguishable from the first point's existential and would leave "a
    // uniform witness need not be unique" unsaid; here the learner computes a
    // product containing two zeros and sees that either witness alone would
    // have done.
    reference: '1',
    at: { a: '0', b: '1', c: '0', d: '1' },
  },

  // ── methods-of-proof, thirty-seventh promotion: proof-techniques
  //
  // Nine tasks, three on each point: seven `evaluate` settled by exact rational
  // arithmetic with no worker, and two `transform_to_form` that need the worker
  // for equivalence. The concept therefore grades without one, which is what
  // the WORKERLESS_CONCEPTS assertion above requires, while still asking the
  // one demand of shape this material genuinely has.
  //
  // THE ENCODING IS NOT THE LOGIC SUBJECTS', AND THAT IS DELIBERATE. Nothing
  // here is a truth table, so nothing is a 0 or a 1 standing for a truth value.
  // What the arithmetic encodes is the proofs' own machinery:
  //
  //     a case, as a form      2*k, 2*k + 1, 3*k + 2
  //     "p divides n"          n - p*k, which is 0 exactly when it does
  //     a remainder            the same expression, read as what is left over
  //     "for an arbitrary n"   an expression whose value does not mention k
  //
  // THE LAST LINE IS THE CONCEPT AND IT IS WHY TWO OF THE NINE LOOK TRIVIAL.
  // `(2*k+1)^2 - 4*(k^2 + k)` and `(3*k+2)^2 - 3*(3*k^2 + 4*k + 1)` are both
  // identically 1, so the answer is 1 whichever k is substituted — the k has
  // CANCELLED rather than been chosen small. That is the whole difference
  // between a proof about every member of a case and a check at one member, and
  // it is the previous concept's lesson inverted: there, ten agreeable values of
  // n settled nothing because the value depended on n. Each of the two prompts
  // names two further values of k with the same answer, because one substitution
  // reads as a check until a second one agrees.
  //
  // ONE EXPRESSION SHARED ACROSS A POINT BOUNDARY, as the thirteenth subject
  // shares two. `n - p*k` is asked in the contradiction point at n = 30031,
  // p = 13 and in the cases point at n = 2027, p = 3. One move — read the
  // remainder — answering two different questions: whether anything on a list
  // divides a number, and which case a number falls in. Two differently-written
  // expressions would have said those were two moves.
  //
  // NO `counterexample` AND NO `justify`, and the refusals land in different
  // places than the thirteenth subject's. The natural `counterexample` ask is
  // "produce a prime that is not on the list"; ruling it needs a checker that
  // can test a produced object against a claim, which this file declares
  // verifiable and ships nowhere. So the factor 59 is GIVEN and the quotient
  // asked, with the prompt saying that finding 59 was the real question. The
  // `justify` ask is bigger and is the concept itself — "prove that if n² is
  // even then n is even" — and naming the kind in an objective would promise an
  // observation nothing in this build can make. The arguments are carried by the
  // worked examples, whose subgoals are all phrased as questions.
  //
  // `prime_factored` WAS CONSIDERED AND REFUSED. "Write 30031 as a product of
  // primes" is a lovely-looking task and it is the `counterexample` ask wearing
  // a form: finding the factors IS the whole of the question, so the form would
  // grade the thing the file has just said it cannot rule.
  //
  // NO `domainConditions` ON ANY OF THE NINE. The two divisions are by stated
  // constants — n/4 and n/59 — rather than by a symbol, so there is no value of
  // a declared variable at which anything is undefined.
  {
    id: 'the-contrapositive-hands-you-a-form-to-substitute-1',
    knowledgePointId: 'the-contrapositive-lets-you-choose-which-end-to-start-from',
    kind: 'transform_to_form',
    form: 'expanded',
    prompt:
      'You are proving "if n² is even then n is even", and you have chosen to prove the '
      + 'contrapositive instead because the original hands you n² = 2m with nothing to '
      + 'substitute for n. The contrapositive\'s hypothesis is "n is odd", which IS a form: '
      + 'n = 2k + 1. Multiply out (2*k+1)^2 completely, as a sum of terms with no bracket left '
      + 'unexpanded. The point of the demand is that the unexpanded power cannot be read for '
      + 'parity at all — you cannot look at (2k + 1)² and see a 2 to take out — and the '
      + 'multiplied-out form can: group the first two terms as 2(2k² + 2k) and the remaining 1 '
      + 'is the leftover that makes it odd.',
    given: '(2*k+1)^2',
    variables: CASE_INDEX,
    // 4k² + 4k + 1.
    //
    // THE ONLY FORM DEMAND THIS SUBJECT HAS, and it is the move rather than a
    // claim about an encoding — which is the thing the two logic subjects below
    // could not manage. `expanded` is exactly right: the checker refuses the
    // given as "an unexpanded power of a sum" and accepts the reference as "a
    // sum of 3 terms, fully multiplied out". Note it also refuses
    // `2*(2*k^2 + 2*k) + 1`, as an unexpanded bracket — so the prompt asks for
    // the fully multiplied-out form and mentions the grouping as a reading of
    // it rather than as the answer.
    reference: '4*k^2 + 4*k + 1',
  },
  {
    id: 'an-arbitrary-odd-square-leaves-remainder-one-1',
    knowledgePointId: 'the-contrapositive-lets-you-choose-which-end-to-start-from',
    kind: 'evaluate',
    prompt:
      'Same proof. You have (2k + 1)² = 4k² + 4k + 1 and want to say it is odd, which means '
      + 'showing that what is left after taking out every available 2 is exactly 1. The even '
      + 'part is 4k² + 4k, which is 4(k² + k). Evaluate (2*k+1)^2 - 4*(k^2 + k) at k = 7. Your '
      + 'answer is the remainder on division by 2 — and the reason this single computation '
      + 'proves something about EVERY odd number is that the k cancels: at k = 0 it reads '
      + '1 − 0 = 1, at k = 7 it reads 225 − 224 = 1, at k = 12 it reads 625 − 624 = 1. Compare '
      + 'the previous concept, where n² + n + 11 was prime at ten values of n and that settled '
      + 'nothing, because there the answer depended on n and here it does not.',
    given: '(2*k+1)^2 - 4*(k^2 + k)',
    variables: CASE_INDEX,
    // 4k² + 4k + 1 − 4k² − 4k = 1, identically.
    //
    // ASKED AT k = 7 AND IDENTICALLY 1, which is the one task shape this
    // concept needed and could not get from the kinds alone. "This holds for an
    // arbitrary member of the case" is not a value `evaluate` can ask for; what
    // it can ask for is a value that does not depend on the member, and the
    // prompt names two further k so that the independence is observed rather
    // than asserted.
    reference: '1',
    at: { k: '7' },
  },
  {
    id: 'the-converse-is-a-different-claim-and-this-one-is-false-1',
    knowledgePointId: 'the-contrapositive-lets-you-choose-which-end-to-start-from',
    kind: 'evaluate',
    prompt:
      'The converse is the rearrangement you may NOT prove instead, and the reason is not that '
      + 'it is always false. For "if n² is even then n is even" the converse is also true, which '
      + 'is why truth cannot tell you which sentence you proved. So take a statement where it '
      + 'fails: "if n is divisible by 4 then n is even" is true, and its converse claims every '
      + 'even number is divisible by 4. Test that at the smallest even number above zero by '
      + 'evaluating n/4 at n = 2. Your answer is not a whole number, so 2 is even and not '
      + 'divisible by 4: the converse is refuted while the original stands, and one object was '
      + 'enough to do it.',
    given: 'n/4',
    variables: NUMBER_UNDER_TEST,
    // 2/4 = 1/2, which is not a whole number.
    //
    // THE ONE PLACE A NON-INTEGER ANSWER IS THE POINT. Every other value in
    // this subject is a whole number, and here the answer being a fraction is
    // the refutation — "n is divisible by 4" says n/4 is a whole number, and
    // 1/2 is not one. `exactValue` settles it, so it grades with no worker like
    // the rest. Answering `2/4` is refused by `ruleEvaluate`'s default, which is
    // correct: the substituted-and-stopped form has not done the division the
    // question is about.
    reference: '1/2',
    at: { n: '2' },
  },
  {
    id: 'build-a-number-from-a-list-assumed-to-be-every-prime-1',
    knowledgePointId: 'a-contradiction-assumes-the-negation-and-reaches-something-impossible',
    kind: 'evaluate',
    prompt:
      'You are proving there is no largest prime by assuming there is one, which makes the '
      + 'primes a finite list you can write out. Suppose that list were a = 2, b = 3, c = 5, '
      + 'd = 7, e = 11, f = 13 — every prime there is. Evaluate a*b*c*d*e*f + 1 at those values. '
      + 'The product alone is divisible by every prime on the list, because each one is a factor '
      + 'of it; adding 1 is the smallest change that spoils all six of those divisions at once, '
      + 'and your answer is the number the rest of the argument is about.',
    given: 'a*b*c*d*e*f + 1',
    variables: SIX_PRIMES,
    // 2 · 3 · 5 · 7 · 11 · 13 = 30030, and 30030 + 1 = 30031.
    //
    // THE LIST IS GIVEN AS SIX SYMBOLS RATHER THAN AS THE NUMERAL 30031,
    // because the construction is the content: the number is the product of
    // whatever the list happened to be, plus one, and a task that handed over
    // 30031 would ask the learner to divide a number somebody else built.
    reference: '30031',
    at: { a: '2', b: '3', c: '5', d: '7', e: '11', f: '13' },
  },
  {
    id: 'a-remainder-of-one-means-nothing-on-the-list-divides-it-1',
    knowledgePointId: 'a-contradiction-assumes-the-negation-and-reaches-something-impossible',
    kind: 'evaluate',
    prompt:
      'N = 30031 and the list was 2, 3, 5, 7, 11, 13. Take the largest of them: 13 divides the '
      + 'product 30030 exactly, since 30030 = 13 × 2310. Evaluate n - p*k at n = 30031, p = 13, '
      + 'k = 2310. Your answer is the remainder when N is divided by 13, and because it is not 0 '
      + 'the prime 13 does not divide N. The same computation works for every other prime on the '
      + 'list — 30030 is also 2 × 15015, 3 × 10010, 5 × 6006, 7 × 4290 and 11 × 2730 — so each '
      + 'leaves the same remainder and NOTHING on the list divides N.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 30031 − 13 · 2310 = 30031 − 30030 = 1.
    //
    // SHARES ITS EXPRESSION WITH THE CASES POINT two tasks down, where the same
    // three symbols are a number, 3, and a candidate quotient, and the answer 2
    // means something else entirely. One move, two facts, and the shared `given`
    // is how that is recorded.
    reference: '1',
    at: { n: '30031', p: '13', k: '2310' },
  },
  {
    id: 'the-number-built-need-not-be-prime-1',
    knowledgePointId: 'a-contradiction-assumes-the-negation-and-reaches-something-impossible',
    kind: 'evaluate',
    prompt:
      'The argument is finished: N = 30031 has a prime factor, nothing on the list divides it, '
      + 'so there is a prime off a list that was assumed to hold them all. Now check the thing '
      + 'the argument never claimed. Almost everybody reads it as "the product of the primes '
      + 'plus one is prime", and with the shorter list 2, 3, 5, 7 it happens to be — '
      + '2 × 3 × 5 × 7 + 1 = 211, which is prime. With this list it is not: 59 divides 30031. '
      + 'Evaluate n/59 at n = 30031 to get the other factor. Both 59 and your answer are prime, '
      + 'so N is composite, and nothing breaks — 59 is exactly the prime off the list that the '
      + 'argument promised was there.',
    given: 'n/59',
    variables: NUMBER_UNDER_TEST,
    // 30031 ÷ 59 = 509. Both 59 and 509 are prime, and both exceed 13.
    //
    // THIS IS THE `counterexample` ASK REDUCED TO A DIVISION, which is the
    // honest amount less than the real one. The real question is "produce a
    // prime not on the list", and ruling it needs a checker that can test a
    // produced object against a claim; the kind is declared verifiable in this
    // file and ships nothing. So 59 is given, the quotient is asked, and the
    // prompt says that finding 59 was the question. A learner who answers 509
    // has not been scored on noticing that 30031 is composite.
    reference: '509',
    at: { n: '30031' },
  },
  {
    id: 'expand-the-case-a-split-left-out-1',
    knowledgePointId: 'a-proof-by-cases-works-only-if-the-cases-leave-nothing-out',
    kind: 'transform_to_form',
    form: 'expanded',
    prompt:
      'Somebody proves "n² leaves remainder 0 or 1 on division by 3, never 2" by checking '
      + 'n = 3k and n = 3k + 1, and stops. Dividing by 3 can leave 0, 1 or 2, so there is a '
      + 'third case they have said nothing about: n = 3k + 2. Multiply out (3*k+2)^2 completely, '
      + 'as a sum of terms with no bracket left unexpanded. As with the odd case earlier, the '
      + 'unexpanded square cannot be read for a remainder — you cannot look at (3k + 2)² and see '
      + 'what is left after the 3s come out — and the multiplied-out form can.',
    given: '(3*k+2)^2',
    variables: CASE_INDEX,
    // 9k² + 12k + 4.
    //
    // The second and last form demand, deliberately the same demand on the same
    // shape as the first point's: a case is a form, and reading a case for a
    // remainder means multiplying the form out. Two points, one technique, and
    // the parallel is the reason both are `expanded` rather than one of them
    // being something cleverer.
    reference: '9*k^2 + 12*k + 4',
  },
  {
    id: 'the-missing-case-leaves-remainder-one-for-every-k-1',
    knowledgePointId: 'a-proof-by-cases-works-only-if-the-cases-leave-nothing-out',
    kind: 'evaluate',
    prompt:
      'You have (3k + 2)² = 9k² + 12k + 4 and want its remainder on division by 3. Take off the '
      + 'largest multiple of 3 inside it, which is 3(3k² + 4k + 1) = 9k² + 12k + 3. Evaluate '
      + '(3*k+2)^2 - 3*(3*k^2 + 4*k + 1) at k = 5. Your answer is the remainder, and the k has '
      + 'cancelled out of it: at k = 0 it reads 4 − 3 = 1, at k = 5 it reads 289 − 288 = 1, at '
      + 'k = 9 it reads 841 − 840 = 1. So every number of the form 3k + 2 has a square leaving '
      + 'that remainder, the third case holds, and the proof is finally complete.',
    given: '(3*k+2)^2 - 3*(3*k^2 + 4*k + 1)',
    variables: CASE_INDEX,
    // 9k² + 12k + 4 − (9k² + 12k + 3) = 1, identically.
    //
    // The second identically-1 task, at k = 5 where the first is at k = 7, and
    // the pair is the subject's one structural claim: a case is settled when the
    // case letter has gone from the answer. Asked on a DIFFERENT split from the
    // first so that the independence does not read as a property of 2.
    reference: '1',
    at: { k: '5' },
  },
  {
    id: 'which-case-a-number-is-in-decides-whether-a-split-covers-it-1',
    knowledgePointId: 'a-proof-by-cases-works-only-if-the-cases-leave-nothing-out',
    kind: 'evaluate',
    prompt:
      'The two-case proof covered n = 3k and n = 3k + 1, so it covered 2025 = 3 × 675 and '
      + '2026 = 3 × 675 + 1. Evaluate n - p*k at n = 2027, p = 3, k = 675. Your answer is the '
      + 'remainder that says which case 2027 is in — and it is the case neither of their two '
      + 'covered, so their proof says nothing whatever about 2027². Note what this is NOT: the '
      + 'claim is true at 2027 as well, which the previous task established for every number of '
      + 'this form. An incomplete split can reach a true conclusion, so the truth of the answer '
      + 'is never the check. Counting the cases against the split is, and it is done before the '
      + 'computing rather than after it.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 2027 − 3 · 675 = 2027 − 2025 = 2.
    //
    // THE SHARED EXPRESSION'S SECOND USE. In the contradiction point `n - p*k`
    // answered "does anything on the list divide N" and a remainder of 1 meant
    // no; here it answers "which case is this number in" and a remainder of 2
    // names the case that was dropped. Reading a remainder is one move, and
    // asking it twice with the same expression is what says so.
    reference: '2',
    at: { n: '2027', p: '3', k: '675' },
  },

  // ── sets-and-membership, thirty-eighth promotion: sets
  //
  // Nine tasks, three on each point, and ALL NINE are `evaluate` settled by
  // exact rational arithmetic with no worker. That is the first subject since
  // the thirteenth where the kind list is a single entry, and it is a real
  // absence rather than a thin pass — see the refusal of `transform_to_form`
  // below.
  //
  // THE ENCODING IS SIZES, which is the only thing about a set that is a number:
  //
  //     a set                     its size: a, b, u
  //     an overlap                c, the size of the intersection
  //     "in A and not in B"       a - c, which is |A| - |A ∩ B|
  //     "in A or in B"            a + b - c, the sum with the double count repaired
  //     "in or out, each member"  2^n, the number of subsets
  //     "the membership cases"    2^n again, now of n SETS rather than n members
  //
  // ONE EXPRESSION SHARED ACROSS TWO POINT BOUNDARIES, which is further than any
  // previous subject has carried one. `a - c` is asked at (6, 6) in the first
  // point, at (6, 4) in the second and at (6, 2) in the third. The first of
  // those is what the sharing is for: A ⊆ B is the case where the overlap IS the
  // smaller set, so an inclusion is a difference that came out zero rather than
  // a different kind of fact. Three expressions would have hidden that, and the
  // lists' own comments carry the argument.
  //
  // `a + b - c` IS ASKED TWICE AND THE SECOND TIME IS THE POINT. At (6, 6, 4) it
  // counts a union of two divisor sets; at (2, 3, 1) it counts a union of two
  // DIFFERENCES, which is the right-hand side of the identity the third point
  // proves. Its answer 4 matches the left-hand side's 4 — and that prompt says
  // plainly that two counts agreeing is a CHECK and not a proof. That is the
  // thirty-seventh subject's lesson inverted one more turn: there a value that
  // still mentioned k settled nothing, and here two values that agree settle
  // nothing either, because equal sizes do not make equal sets. {1, 2} and
  // {3, 4} is the two-second refutation and the prompt gives it.
  //
  // THE DIAGRAM TASK IS THE ONE THAT CARRIES THE CONCEPT'S HARDEST CLAIM, and
  // both of its numbers are exact rather than illustrative. n sets have 2ⁿ
  // membership cases; n circles in general position cut the plane into at most
  // n² − n + 2 regions. Those agree at n = 1, 2 and 3 — 2 and 2, 4 and 4, 8 and
  // 8 — so the three-circle picture everybody is shown is genuinely complete,
  // which is why it misleads. At n = 4 it is 16 against 14 and the answer is the
  // shortfall, 2. Asked at 4 and not at 3 for that reason: at 3 the answer is 0
  // and says the opposite of the lesson.
  //
  // WHAT CANNOT BE ASKED FOR IS A SET. The engine grades an expression, so
  // "write down A ∩ B" has no form — the same wall ontology-matrices.ts hit with
  // "every question asks for one number" because there is no matrix type. The
  // cost is specific: a learner can be asked how big an intersection is and not
  // which members are in it, so no task here can catch somebody who has the
  // right count by the wrong route. The three worked examples list every member
  // of every set they use, which is the compensation and is the reason they are
  // long.
  //
  // NO `transform_to_form`, AND THIS SUBJECT IS WORSE OFF THAN THE FOURTEENTH
  // FOR IT. The forms this file ships are claims about an ALGEBRAIC shape —
  // expanded, factored, a completed square, a prime factorisation, a reduced
  // surd — and there is no demand of shape in this material. `2^n` is not asked
  // as a form because the question is how many subsets there are, not how to
  // write the count. The one place a shape genuinely IS the answer is the
  // membership condition itself — "x in A, and not (x in B and x in C)" — and
  // that is a sentence, not an expression. A form invented for it would grade
  // the shape of an encoding, which is what the two logic subjects refused.
  //
  // NO `counterexample` AND NO `justify`. The natural `counterexample` ask is
  // "produce a member of A that is not in B"; ruling it needs a checker that can
  // test a produced object against a claim, which this file declares verifiable
  // and ships nowhere. The `justify` ask is the concept itself — "prove
  // A \ (B ∩ C) = (A \ B) ∪ (A \ C)" — and naming the kind in an objective would
  // promise an observation nothing in this build can make.
  //
  // NO `domainConditions` ON ANY OF THE NINE. Every expression is a sum or
  // difference of counts, or 2 raised to one, so there is no value of a declared
  // variable at which anything is undefined — not even the empty case, where
  // 2^0 = 1 is the correct and meaningful answer that the empty set has exactly
  // one subset.
  {
    id: 'each-member-is-an-independent-in-or-out-choice-1',
    knowledgePointId: 'a-set-is-fixed-by-what-belongs-to-it-and-equality-is-two-inclusions',
    kind: 'evaluate',
    prompt:
      'A is the set of divisors of 12, so A = {1, 2, 3, 4, 6, 12} and it has 6 members. Count '
      + 'its subsets WITHOUT listing them: a subset is settled by going through the members one '
      + 'at a time and deciding in or out, so 6 members give 6 independent two-way choices. '
      + 'Evaluate 2^n at n = 6. Your answer counts the empty set, where every decision was '
      + '"out", and A itself, where every decision was "in" — both are subsets by the '
      + 'definition, and they are the two that are easiest to forget precisely because the '
      + 'definition makes them trivial.',
    given: '2^n',
    variables: MEMBER_COUNT,
    // 2⁶ = 64.
    //
    // ASKED ON SIX MEMBERS RATHER THAN FOUR, which matters only because the
    // diagram task in the third point evaluates `2^n` at 4. Two tasks with the
    // same expression, the same substitution and the same answer would read as
    // one task duplicated, and the two are about different things: here n counts
    // the MEMBERS of one set, there it counts the SETS a claim is about.
    reference: '64',
    at: { n: '6' },
  },
  {
    id: 'repetition-in-the-writing-adds-no-members-1',
    knowledgePointId: 'a-set-is-fixed-by-what-belongs-to-it-and-equality-is-two-inclusions',
    kind: 'evaluate',
    prompt:
      'Somebody writes down the common divisors of 12 and 18 and gets careless: "1, 2, 2, 3, 6, '
      + '6, 6" — seven entries. A set is fixed by WHICH objects belong to it, so an entry naming '
      + 'an object already named adds nothing: the second 2 is one such, and so are the second '
      + 'and third 6. Evaluate n - d at n = 7, d = 3. Your answer is how many members the set '
      + 'actually has. What you subtracted was writing and not objects — and for the same reason '
      + 'the order is irrelevant too, so "6, 3, 2, 1" is this same set written a fourth way.',
    given: 'n - d',
    variables: WRITTEN_ENTRIES,
    // 7 − 3 = 4, and the set is {1, 2, 3, 6}.
    //
    // THE NUMBERS ARE THE WORKED EXAMPLE'S, which is deliberate: {1, 2, 3, 6} is
    // the intersection the first point builds and the divisors of 6, so the
    // answer 4 is the same 4 that becomes the overlap in the second point's
    // tasks. A learner meets one set of numbers across the whole concept rather
    // than a fresh pair per question.
    reference: '4',
    at: { n: '7', d: '3' },
  },
  {
    id: 'a-difference-of-zero-closes-the-second-inclusion-1',
    knowledgePointId: 'a-set-is-fixed-by-what-belongs-to-it-and-equality-is-two-inclusions',
    kind: 'evaluate',
    prompt:
      'B is the set of divisors of 12, with 6 members, and A is some subset of it that also has '
      + '6 members. You already have A ⊆ B, which was given. To get B = A you need the other '
      + 'inclusion, B ⊆ A, and that holds exactly when no member of B is left out of A. The '
      + 'count of what is left out is |B| − |B ∩ A|, and since A ⊆ B the overlap is the whole of '
      + 'A. Evaluate a - c at a = 6, c = 6. Your answer of zero IS the second inclusion, so the '
      + 'two sets are equal. One warning the answer does not carry: this argument used B being '
      + 'FINITE. The even numbers are a subset of the whole numbers and are not all of them, '
      + 'however sizes are compared there — that is `cardinality`, three nodes further up.',
    given: 'a - c',
    variables: SET_SIZE_AND_OVERLAP,
    // 6 − 6 = 0.
    //
    // THE SHARED EXPRESSION'S FIRST USE, AND THE ONE IT EARNS ITS PLACE ON. The
    // same `a - c` counts a difference in the next point and a side of an
    // identity in the one after. Writing an inclusion as a difference that came
    // out zero is the claim: A ⊆ B is the case where the overlap IS the smaller
    // set, so the inclusion is not a second kind of fact.
    //
    // The prompt names the finite assumption rather than leaving it, because the
    // step is false without it and the concept where it fails is on the map
    // above this one. Naming the boundary is cheaper than a learner finding it.
    reference: '0',
    at: { a: '6', c: '6' },
  },
  {
    id: 'the-union-count-repairs-a-double-count-1',
    knowledgePointId: 'each-operation-is-a-condition-on-membership-and-the-sizes-need-one-repair',
    kind: 'evaluate',
    prompt:
      'A is the divisors of 12 and B the divisors of 18, six members each. Their common '
      + 'divisors are the divisors of gcd(12, 18) = 6, which is {1, 2, 3, 6}, so the overlap has '
      + '4 members. Evaluate a + b - c at a = 6, b = 6, c = 4. Your answer is the size of '
      + 'A ∪ B, and the subtraction is a REPAIR rather than a term of a formula: adding 6 and 6 '
      + 'counts each of 1, 2, 3 and 6 twice, once as a divisor of 12 and again as a divisor of '
      + '18, so one copy of the overlap has to come off. Writing the union out gives '
      + '{1, 2, 3, 4, 6, 9, 12, 18} and confirms it. Stopping at 6 + 6 = 12 is the commonest '
      + 'error here, and it claims a union with four members nobody can name.',
    given: 'a + b - c',
    variables: SET_SIZES_AND_OVERLAP,
    // 6 + 6 − 4 = 8, and the union listed out has 8 members.
    //
    // THE OVERLAP IS GIVEN AS A SIZE AND ITS MEMBERS ARE NAMED, which is the
    // compromise this whole subject runs on: the answer has to be a number, so
    // the prompt states the four members so that the 4 is a count of something
    // the learner can see rather than a figure handed over.
    //
    // Had the sets been disjoint the correction would be 0 and the addition
    // alone right — the special case, not the rule, and the prompt says so.
    reference: '8',
    at: { a: '6', b: '6', c: '4' },
  },
  {
    id: 'a-difference-drops-exactly-the-overlap-1',
    knowledgePointId: 'each-operation-is-a-condition-on-membership-and-the-sizes-need-one-repair',
    kind: 'evaluate',
    prompt:
      'Same two sets. A \\ B is "in A and not in B", so walk through A\'s six members and drop '
      + 'the ones that fail the second condition. The ones that fail are precisely the members '
      + 'of A that are also in B, which is A ∩ B = {1, 2, 3, 6}. Evaluate a - c at a = 6, '
      + 'c = 4. Your answer is the size of A \\ B — and writing it out gives {4, 12}, the '
      + 'divisors of 12 that do not divide 18. Notice what the count never needed: the members '
      + 'of the difference. It needed the size of A and the size of the overlap, both already in '
      + 'hand from the previous question.',
    given: 'a - c',
    variables: SET_SIZE_AND_OVERLAP,
    // 6 − 4 = 2, and A \ B = {4, 12}.
    //
    // THE SHARED EXPRESSION'S SECOND USE. In the first point `a - c` at (6, 6)
    // was the second half of a double inclusion; here at (6, 4) it is a
    // difference. Same move — all of the set less the part that is also in the
    // other — and the first case is just this one coming out zero.
    reference: '2',
    at: { a: '6', c: '4' },
  },
  {
    id: 'a-complement-has-no-size-until-the-universe-is-named-1',
    knowledgePointId: 'each-operation-is-a-condition-on-membership-and-the-sizes-need-one-repair',
    kind: 'evaluate',
    prompt:
      'Now the one operation that needs something stated first. A is still the divisors of 12, '
      + 'six members, and the question is how many things are NOT in A — which has no answer at '
      + 'all until you say not-in-A-among-what. Take the universe U = {1, 2, ..., 20}, which has '
      + '20 members and contains all six divisors of 12. Evaluate u - a at u = 20, a = 6. Your '
      + 'answer is the size of the complement inside THAT universe. Inside U\' = {1, 2, ..., 12} '
      + 'the same A has a complement of 12 − 6 = 6 members, and inside all the whole numbers it '
      + 'has infinitely many. One set, three answers, so a universe left unstated is not a small '
      + 'omission. The intersection and the difference needed no universe, because both of their '
      + 'conditions point at a set that was given.',
    given: 'u - a',
    variables: UNIVERSE_AND_SUBSET,
    // 20 − 6 = 14.
    //
    // THE SYMBOL IS THE CONTENT, which is why this is not `a - c` with a renamed
    // list. `u` exists to be named, and the prompt gives the other two answers
    // the other two universes produce so that "it depends on the universe" is a
    // computation the learner has watched rather than a caution.
    reference: '14',
    at: { u: '20', a: '6' },
  },
  {
    id: 'count-the-left-side-of-the-identity-1',
    knowledgePointId: 'an-identity-is-proved-by-double-inclusion-and-a-diagram-runs-out-at-four-sets',
    kind: 'evaluate',
    prompt:
      'The identity is A \\ (B ∩ C) = (A \\ B) ∪ (A \\ C), and this question counts the left '
      + 'side on particular sets. A is the divisors of 12 (six members), B the divisors of 18 '
      + 'and C the divisors of 20. B ∩ C is the divisors of gcd(18, 20) = 2, which is {1, 2}, '
      + 'and both of those are in A — so the part of A being taken away has 2 members. Evaluate '
      + 'a - c at a = 6, c = 2. Your answer is the size of A \\ (B ∩ C), and writing it out '
      + 'gives {3, 4, 6, 12}.',
    given: 'a - c',
    variables: SET_SIZE_AND_OVERLAP,
    // 6 − 2 = 4, and A \ (B ∩ C) = {3, 4, 6, 12}.
    //
    // THE SHARED EXPRESSION'S THIRD USE, and the point boundary it crosses is
    // the second one. A difference is a difference whether what is taken away
    // was given as a set or built as an intersection, which is the thing a third
    // expression would have obscured.
    reference: '4',
    at: { a: '6', c: '2' },
  },
  {
    id: 'count-the-right-side-and-weigh-what-the-agreement-proves-1',
    knowledgePointId: 'an-identity-is-proved-by-double-inclusion-and-a-diagram-runs-out-at-four-sets',
    kind: 'evaluate',
    prompt:
      'Now the right side, (A \\ B) ∪ (A \\ C), on the same three sets. A \\ B = {4, 12} has 2 '
      + 'members and A \\ C = {3, 6, 12} has 3, and they share 12, so the overlap has 1. That is '
      + 'a union, so it needs the same repair as before: evaluate a + b - c at a = 2, b = 3, '
      + 'c = 1. Your answer matches the left side\'s 4, and here is what that is worth — it is a '
      + 'CHECK at one triple of sets and not a proof. Two sets of the same size need not be the '
      + 'same set at all: {1, 2} and {3, 4} both have 2 members. The proof is the double '
      + 'inclusion in the worked example, which takes an arbitrary member of one side and '
      + 'rearranges its membership condition into the other, and which mentions no particular '
      + 'number anywhere.',
    given: 'a + b - c',
    variables: SET_SIZES_AND_OVERLAP,
    // 2 + 3 − 1 = 4, and the union listed out is {3, 4, 6, 12} — the same four
    // members the left side has.
    //
    // THE SECOND USE OF `a + b - c` AND THE REASON IT IS SHARED: the correction
    // does not care that the two sets being united are themselves differences.
    //
    // AND THE PROMPT REFUSES ITS OWN EVIDENCE, which is this subject's version of
    // the thirty-seventh's "a value that still mentions k settles nothing". There
    // one substitution looked like a proof until a second agreed; here two counts
    // agreeing looks like a proof and is strictly weaker, because equal sizes do
    // not make equal sets. The refutation is given in the prompt rather than left
    // for the learner to supply, since a learner who could supply it would not
    // have needed the warning.
    reference: '4',
    at: { a: '2', b: '3', c: '1' },
  },
  {
    id: 'four-circles-cannot-draw-four-sets-1',
    knowledgePointId: 'an-identity-is-proved-by-double-inclusion-and-a-diagram-runs-out-at-four-sets',
    kind: 'evaluate',
    prompt:
      'A Venn diagram settles an identity by giving every membership case its own region and '
      + 'shading both sides. So count both. n sets have 2^n membership cases — in or out of each '
      + 'one — and n circles in general position cut the plane into at most n² − n + 2 regions, '
      + 'which for n = 4 is 16 − 4 + 2 = 14. Evaluate 2^n - r at n = 4, r = 14. Your answer is '
      + 'how many of the four-set cases have nowhere to be drawn. Then notice the figure you '
      + 'were actually shown: at n = 3 the two counts are 8 and 3² − 3 + 2 = 8, so the '
      + 'three-circle picture is complete and really does settle a three-set identity. That is '
      + 'why it misleads — the method works for exactly the case everybody is taught and stops '
      + 'one set later. Venn\'s own four-set figure uses ellipses rather than circles. The '
      + 'membership argument never counted the sets, so it is untouched at four and at forty.',
    given: '2^n - r',
    variables: CASES_AND_REGIONS,
    // 2⁴ − 14 = 16 − 14 = 2.
    //
    // BOTH NUMBERS ARE EXACT AND NEITHER IS ILLUSTRATIVE. 2ⁿ is the count of
    // membership cases, including "in none of them"; n² − n + 2 is the maximum
    // number of regions n circles cut the plane into, attained when every pair
    // meets twice and no three are concurrent. They agree at n = 1 (2 and 2),
    // n = 2 (4 and 4) and n = 3 (8 and 8), and separate from n = 4.
    //
    // ASKED AT n = 4 BECAUSE THE ANSWER AT n = 3 IS 0 AND SAYS THE OPPOSITE.
    // That is the whole reason the prompt computes the n = 3 case out loud
    // instead of only the one being graded: a learner shown only the shortfall
    // would take "diagrams are not proofs" as a slogan, and the honest claim is
    // narrower and more useful — the diagram they have seen is complete, and the
    // method it belongs to has a last case.
    reference: '2',
    at: { n: '4', r: '14' },
  },

  // ── arithmetic-foundations, thirty-ninth promotion: division-algorithm
  //
  // Nine tasks, three on each point, and all nine are `evaluate` settled by
  // exact integer arithmetic with no worker — the same single-kind list `sets`
  // shipped one promotion ago, and for once without the apology that went with
  // it. That block had to record that a set cannot be asked for and that its
  // numbers were sizes standing in for members. Nothing stands in for anything
  // here. The theorem's own content IS two whole numbers.
  //
  // THE ENCODING IS THE THEOREM'S OWN FORMULA. a = bq + r rearranges to
  // r = a - bq, which is `n - p*k`, and six of the nine tasks are that one
  // expression at six substitutions:
  //
  //     ( 2026,  7,  289) ->  3   the remainder
  //     ( 2026,  7,  288) -> 10   a quotient one too small: 10 is not < 7
  //     (-2026,  7, -289) -> -3   the remainder the sign suggests: not >= 0
  //     (-2026,  7, -290) ->  4   the remainder a negative dividend really has
  //     ( 2026,  9,  225) ->  1   which of NINE forms 2026 has
  //     (   10,  9,    1) ->  1   its digit sum's form, which must agree
  //
  // The other three are the moves that formula cannot make: `p*k + r` puts the
  // dividend back together, `p - r` gets the remainder of -a from the remainder
  // of a, and `p - c` counts the forms an incomplete case split missed.
  //
  // SIX USES OF ONE EXPRESSION IS FURTHER THAN ANY SUBJECT HAS CARRIED ONE —
  // `sets` managed three — AND THE DEFENCE IS NOT "IT IS THE SAME MOVE". It is
  // that the expression is the concept. Asking it six times is asking what the
  // theorem claims six times, and each answer is a different fact about it: two
  // are admissible remainders, two are leftovers that FAIL the window from
  // opposite sides, and two are the same residue reached by two routes. A
  // learner who answers all six has evaluated r = a - bq at a negative dividend,
  // at a wrong quotient, at two divisors and at a digit sum.
  //
  // TWO TASKS EXIST TO PRODUCE A NUMBER THAT IS WRONG, which is this concept's
  // one piece of luck and the reason it does not need `counterexample`. That
  // kind would be the natural way to ask "show me a pair the theorem does not
  // name", and it needs a checker that tests a produced object against a claim,
  // which this build declares verifiable and ships nowhere. Here the refutation
  // is itself a number: 10 is a true leftover that is too big, -3 is a true
  // leftover that is negative, and both are `evaluate`-gradable. The prompts say
  // plainly that a correct answer to the task is an inadmissible answer to the
  // division, because a learner who is not told that will read a green tick as
  // "so 288 was the quotient after all".
  //
  // THE RESERVED SUBSTITUTION IS NAMED IN DIVIDEND_DIVISOR_QUOTIENT'S COMMENT
  // and is worth repeating at the call site: (2027, 3, 675) -> 2 already exists
  // in the `proof-techniques` block, which imported this concept's fact as a
  // single instance because the general form was unwritten. The general form is
  // written now and may not re-ask the instance.
  //
  // NO `domainConditions` ON ANY OF THE NINE. Every expression is a sum, a
  // difference or a product of integers; nothing divides by a symbol, so there
  // is no value of a declared variable at which anything is undefined. The
  // divisor appears only as a multiplicand.
  {
    id: 'the-remainder-is-what-the-whole-bs-leave-1',
    knowledgePointId: 'the-window-on-the-remainder-is-what-makes-the-pair-unique',
    kind: 'evaluate',
    prompt:
      '289 whole 7s fit inside 2026 and a 290th does not: 7·289 = 2023 and 7·290 = 2030, which '
      + 'is already past 2026. The remainder is whatever the 289 sevens left behind, which is '
      + 'a − bq. Evaluate n - p*k at n = 2026, p = 7, k = 289. Then check your answer against '
      + 'the condition the theorem attaches: it has to be at least 0 and strictly less than 7, '
      + 'and if it were not, the quotient would be the thing that was wrong.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 2026 − 2023 = 3, and 0 ≤ 3 < 7.
    //
    // THE DIVIDEND IS 2026 IN FIVE OF THE NINE TASKS, which is the discipline
    // the `sets` block states: a learner meets one number across the whole
    // concept rather than a fresh pair per question, so the three points are
    // visibly about the same object seen three ways. It is divided by 7 here and
    // in the next point, by 9 in the third, and negated in between.
    reference: '3',
    at: { n: '2026', p: '7', k: '289' },
  },
  {
    id: 'a-quotient-one-too-small-leaves-too-much-1',
    knowledgePointId: 'the-window-on-the-remainder-is-what-makes-the-pair-unique',
    kind: 'evaluate',
    prompt:
      'Now take the quotient to be 288 instead of 289. The equation a = bq + r can still be '
      + 'satisfied — some leftover will always make it true, which is exactly why the equation '
      + 'alone names nothing. Evaluate n - p*k at n = 2026, p = 7, k = 288. Your answer is '
      + 'CORRECT as an answer to this task and INADMISSIBLE as a remainder: it is not less than '
      + '7, so a whole 7 is still sitting inside it and 288 was not the quotient. Taking that 7 '
      + 'across moves the quotient up by one and the leftover down by seven, which is why your '
      + 'answer and the previous task\'s differ by exactly 7 and not by anything else.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 2026 − 2016 = 10, and 10 ≥ 7, so the pair (288, 10) fails the window.
    //
    // 10 − 3 = 7 IS THE WHOLE LESSON AND IS WHY 288 WAS CHOSEN OVER 280. A
    // quotient further out would make the leftover obviously absurd and teach
    // nothing; one step out makes the two pairs look like alternatives, and the
    // difference of exactly one divisor is what shows they are the same division
    // with one 7 on the wrong side of the plus sign.
    reference: '10',
    at: { n: '2026', p: '7', k: '288' },
  },
  {
    id: 'division-reassembles-the-dividend-1',
    knowledgePointId: 'the-window-on-the-remainder-is-what-makes-the-pair-unique',
    kind: 'evaluate',
    prompt:
      'A division is finished when the pair puts the original number back. You have q = 289 and '
      + 'r = 3 for dividing by 7. Evaluate p*k + r at p = 7, k = 289, r = 3 and confirm you get '
      + 'the number you started from. This is the check worth doing every time, and it catches '
      + 'the commonest clerical error in long division without needing to re-do any of it: a '
      + 'quotient and a remainder written the wrong way round give 7·3 + 289 = 310, which is not '
      + '2026 and says so immediately.',
    given: 'p*k + r',
    variables: DIVISOR_QUOTIENT_REMAINDER,
    // 7 · 289 + 3 = 2023 + 3 = 2026.
    //
    // THE ONE TASK IN THE CONCEPT THAT RUNS THE DIVISION BACKWARDS, and the
    // reason `division-algorithm => divisibility` is declined in
    // ontology-arithmetic.ts: answering this is a multiplication and an
    // addition, and no divisibility question is asked anywhere in it. An
    // `encompasses` edge that claimed otherwise would be measured against a task
    // that refutes it.
    reference: '2026',
    at: { p: '7', k: '289', r: '3' },
  },
  {
    id: 'the-negated-remainder-is-not-a-remainder-1',
    knowledgePointId: 'a-negative-dividend-still-leaves-a-non-negative-remainder',
    kind: 'evaluate',
    prompt:
      'Dividing 2026 by 7 gave 289 and 3. The instinct for −2026 is to negate both and answer '
      + '−289 remainder −3, so test it: evaluate n - p*k at n = -2026, p = 7, k = -289. Your '
      + 'answer is again correct as arithmetic — 7·(−289) = −2023 and −2023 plus your answer is '
      + '−2026 — and again inadmissible as a remainder, this time for failing the OTHER side of '
      + 'the window: a remainder is never negative. The condition is 0 ≤ r < 7, and both halves '
      + 'of it are conditions.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // −2026 − 7·(−289) = −2026 + 2023 = −3, which fails 0 ≤ r.
    //
    // THE SECOND OF THE TWO DELIBERATELY-WRONG ANSWERS, and the pair of them is
    // what the window being two inequalities buys: the first point's 10 fails on
    // the upper bound and this fails on the lower, so between them the two tasks
    // demonstrate that neither half is decoration. Asking only one would leave a
    // learner able to believe the window is "small enough".
    reference: '-3',
    at: { n: '-2026', p: '7', k: '-289' },
  },
  {
    id: 'the-quotient-steps-down-not-towards-zero-1',
    knowledgePointId: 'a-negative-dividend-still-leaves-a-non-negative-remainder',
    kind: 'evaluate',
    prompt:
      'The quotient is the largest integer q with 7q ≤ a, and for a = −2026 that is not −289: '
      + '7·(−289) = −2023, which is ABOVE −2026, so it is too big. The next one down is −290, '
      + 'and 7·(−290) = −2030, which is below. Evaluate n - p*k at n = -2026, p = 7, k = -290. '
      + 'Your answer is in 0 ≤ r < 7, so this is the division — and note the quotient moved away '
      + 'from zero rather than towards it, which is where "rounding" as an instinct goes wrong.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // −2026 − (−2030) = 4, and 0 ≤ 4 < 7.
    reference: '4',
    at: { n: '-2026', p: '7', k: '-290' },
  },
  {
    id: 'the-negated-remainder-is-the-complement-1',
    knowledgePointId: 'a-negative-dividend-still-leaves-a-non-negative-remainder',
    kind: 'evaluate',
    prompt:
      'The two remainders you have found, 3 and 4, are not independent. Whenever a positive '
      + 'number leaves r on division by b and r is not 0, its negative leaves b − r: one extra b '
      + 'is taken out and one extra b goes back, which is the whole of the adjustment. Evaluate '
      + 'p - r at p = 7, r = 3. You should get the remainder of −2026 without dividing anything. '
      + 'The one case this does not cover is r = 0, where nothing has to be repaired — 2023 '
      + 'leaves 0 and so does −2023.',
    given: 'p - r',
    variables: DIVISOR_AND_REMAINDER,
    // 7 − 3 = 4, which is the remainder the task above computed by dividing.
    //
    // THE SAME ANSWER AS THE TASK ABOVE AND THAT IS THE POINT, which is the one
    // place in this concept where two tasks agreeing is the content rather than
    // a duplication. There it was reached by finding the right quotient; here by
    // a subtraction that never mentions a quotient at all, because the fact does
    // not depend on one — see `DIVISOR_AND_REMAINDER`, which declares two
    // symbols for exactly that reason. Two routes to one number is a check a
    // learner can run on any pair afterwards.
    reference: '4',
    at: { p: '7', r: '3' },
  },
  {
    id: 'which-of-nine-forms-a-number-has-1',
    knowledgePointId: 'the-window-gives-exactly-b-forms-and-a-case-split-must-use-all-of-them',
    kind: 'evaluate',
    prompt:
      'Division by 9 sorts every integer into nine forms — 9k, 9k + 1, up to 9k + 8 — one for '
      + 'each whole number the condition 0 ≤ r < 9 allows, so the number of forms is the divisor '
      + 'itself. 9·225 = 2025. Evaluate n - p*k at n = 2026, p = 9, k = 225. Your answer says '
      + 'which of the nine forms 2026 has, and k = 225 says which member of that form it is. '
      + 'Deciding the case is a division and never a judgement.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 2026 − 2025 = 1, so 2026 = 9·225 + 1 and its form is 9k + 1.
    //
    // DIVISOR 9 AND NOT 3, for two reasons that point the same way. The
    // (2027, 3, 675) substitution is reserved — it is a `proof-techniques` task
    // — and a second divisor is what this point has to demonstrate anyway, since
    // the claim is that the case count is b. Using 3 again would have let a
    // reader carry away "there are three cases" from a concept whose content is
    // that there are b of them. 9 also sets up the digit-sum cross-check below,
    // which no other small divisor has.
    reference: '1',
    at: { n: '2026', p: '9', k: '225' },
  },
  {
    id: 'the-digit-sum-reaches-the-same-form-1',
    knowledgePointId: 'the-window-gives-exactly-b-forms-and-a-case-split-must-use-all-of-them',
    kind: 'evaluate',
    prompt:
      '`divisibility`, the concept below this one, shows that a number and its digit sum leave '
      + 'the SAME remainder on division by 9, because every power of ten is one more than a '
      + 'multiple of 9. The digit sum of 2026 is 2 + 0 + 2 + 6 = 10, and 9·1 = 9. Evaluate '
      + 'n - p*k at n = 10, p = 9, k = 1. Your answer should match the form you found for 2026 '
      + 'itself, and the match is guaranteed in advance rather than a coincidence worth noticing '
      + '— which is what makes the digit sum a way of reading a residue off at a glance.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 10 − 9 = 1, the same residue 2026 has.
    //
    // ONE EXPRESSION, TWO SUBSTITUTIONS, ONE ANSWER — AND IT IS A PROOF HERE
    // RATHER THAN A CHECK, which is the one place this concept parts company
    // with the `sets` block it otherwise follows. There, two counts agreeing was
    // explicitly NOT a proof, because equal sizes do not make equal sets. Here
    // the agreement is forced by a theorem one concept below: `divisibility`'s
    // second knowledge point establishes it for every number, not for this one.
    // So the prompt is entitled to say "guaranteed", and saying so is the
    // difference between a learner who has a trick and one who has a reason.
    reference: '1',
    at: { n: '10', p: '9', k: '1' },
  },
  {
    id: 'an-incomplete-split-leaves-b-minus-c-forms-1',
    knowledgePointId: 'the-window-gives-exactly-b-forms-and-a-case-split-must-use-all-of-them',
    kind: 'evaluate',
    prompt:
      'A claim about every integer is argued by splitting on the remainder on division by 12, '
      + 'and the argument checks the six even remainders: 0, 2, 4, 6, 8, 10. Division by 12 '
      + 'gives twelve forms, because 0 ≤ r < 12 allows twelve whole numbers. Evaluate p - c at '
      + 'p = 12, c = 6. Your answer is how many forms the argument has said NOTHING about — half '
      + 'the integers, 13 among them, since 13 = 12·1 + 1. The hard part is not the subtraction; '
      + 'it is that such an argument can still reach a conclusion that happens to be TRUE, so '
      + 'nothing about it looks wrong from the inside.',
    given: 'p - c',
    variables: DIVISOR_AND_CASES_CHECKED,
    // 12 − 6 = 6: six of the twelve residue classes unexamined.
    //
    // DIVISOR 12 AND NOT 9, so the learner has to recount the window instead of
    // reusing the nine from two tasks up — the count is b, and a task that let 9
    // be carried over would be testing recall of a number rather than of the
    // rule. 12 also makes the gap a half rather than a sliver, which is the
    // honest size of what an even-remainders-only argument misses.
    //
    // THE GENERALISATION OF `proof-techniques`' OWN TRAP. That concept's third
    // point splits on division by 3 and forgets 3k + 2: one case out of three.
    // This is six out of twelve. Neither is an argument and the difference in
    // scale is the reason to state the rule as "all b of them" rather than as
    // "do not forget the last one".
    reference: '6',
    at: { p: '12', c: '6' },
  },
  // ── arithmetic-foundations, fortieth promotion: euclidean-algorithm
  //
  // Nine tasks, three on each point, all `evaluate` and all settled by exact
  // integer arithmetic with no worker — the same shape `division-algorithm`
  // shipped one promotion ago, which is the concept directly below this one.
  //
  // FIVE OF THE NINE ARE THE PREREQUISITE'S OWN EXPRESSION, AND THAT IS THE
  // CONTENT RATHER THAN A REUSE. The Euclidean algorithm is the division
  // algorithm iterated, so `n - p*k` — r = a - bq — is what one step of it IS.
  // Five substitutions, in two separate runs of the algorithm:
  //
  //     ( 360, 84,  4) -> 24   step one of gcd(360, 84)
  //     (  84, 24,  3) -> 12   step two: the gcd, though nothing says so yet
  //     (  24, 12,  2) ->  0   step three: the signal to stop, not the answer
  //     (   7,  3,  2) ->  1   step two of gcd(2026, 7), picked up mid-run
  //     (  30, 12,  2) ->  6   not a step at all: the solvability test
  //
  // That takes `DIVIDEND_DIVISOR_QUOTIENT` to thirteen tasks across four
  // knowledge points of two subjects. Its own comment already argues that it
  // should be read as the theorem's formula rather than as a convenience, and
  // this concept is the strongest case for that reading available: a learner who
  // answers the first three has run an algorithm by evaluating one expression
  // three times, which is what an algorithm is.
  //
  // THE `integer`-NOT-`positive` DECISION IS LOAD-BEARING A SECOND TIME. That
  // list's comment records it being needed for `division-algorithm`'s negative
  // dividend. Here nothing is negative in `n - p*k` — but the THIRD task's
  // answer is 0, and the four `a*x + b*y` tasks need two negative coefficients
  // and one negative answer term, so a `positive` declaration anywhere in this
  // block would be undeclarable rather than merely tight.
  //
  // THE RESERVED SUBSTITUTION IS OBSERVED, AND THIS IS THE CONCEPT IT WAS
  // RESERVED AGAINST. `DIVIDEND_DIVISOR_QUOTIENT`'s comment names (2027, 3, 675)
  // as a `proof-techniques` task that may not be re-asked. A second one has to be
  // named now for the same reason and in the other direction: (2026, 7, 289) -> 3
  // is `the-remainder-is-what-the-whole-bs-leave-1`, in the `division-algorithm`
  // block above, and it is step ONE of gcd(2026, 7). This concept's third point
  // uses that run and must not re-ask its first step, so it picks the algorithm
  // up at step two with (7, 3, 2) -> 1. The worked example quotes the first step
  // by name and does not re-derive it, which is the point of continuing somebody
  // else's division rather than starting a new one.
  //
  // THE OTHER FOUR EVALUATE `a*x + b*y`, WHICH IS A PAIR ANSWERED AS A VALUE.
  // No `NamedForm` can demand a Bézout identity — the answer is two coefficients
  // and forms.ts speaks about the shape of one expression — so the coefficients
  // are produced in the worked example and the tasks evaluate what they build:
  //
  //     (360,  -3, 84,  13) ->   12   the identity, correct
  //     (360,   3, 84,  13) -> 2172   one sign dropped: true arithmetic, not 12
  //     (360,   4, 84, -17) ->   12   a different pair, the same gcd
  //     (360, -15, 84,  65) ->   60   the same pair scaled by 5
  //
  // TWO OF THOSE FOUR REACH 12 AND THAT IS THE LESSON, not a duplication. The
  // `division-algorithm` block makes the same defence for its two routes to 4,
  // and the shape here is stronger: the point being taught is that the
  // coefficients are NOT unique, so two tasks agreeing on the value while
  // disagreeing on every input is the only way to ask it. A third, between them,
  // has one sign wrong and lands on 2172 — the refutation arriving as a number,
  // which is how this subject gets a `counterexample`-shaped ask out of a kind it
  // ships no checker for.
  //
  // NO `domainConditions` ON ANY OF THE NINE. Every expression is a sum, a
  // difference or a product of integers. Nothing divides by a symbol, so no
  // declared value makes anything undefined; the divisor appears only as a
  // multiplicand.
  {
    id: 'one-step-of-the-algorithm-is-one-division-1',
    knowledgePointId: 'swapping-in-the-remainder-keeps-every-common-divisor',
    kind: 'evaluate',
    prompt:
      'To find gcd(360, 84), start by dividing: 84·4 = 336 and a fifth 84 would be 420, which is '
      + 'past 360, so the quotient is 4. The remainder is a − bq. Evaluate n - p*k at n = 360, '
      + 'p = 84, k = 4. Your answer is the second number of the next pair the algorithm asks '
      + 'about — it goes on to ask for the gcd of 84 and your answer, and the 360 is never '
      + 'mentioned again.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 360 − 336 = 24, and 0 ≤ 24 < 84.
    //
    // THE PAIR IS THE ONE `gcd-and-lcm` FACTORISES, which is the discipline the
    // two blocks above follow with 2026: a learner meets one object across a
    // concept rather than a fresh pair per question. Here it is also a
    // cross-concept check — that concept's worked example gets 12 from
    // 2³·3²·5 and 2²·3·7, and the three tasks below reach the same 12 by
    // division. Choosing a pair with an easy factorisation is deliberate: the
    // claim being taught is that the two routes agree, and a pair chosen to make
    // factoring look hard would be teaching the advantage instead, which a
    // worked example at this size cannot honestly show.
    reference: '24',
    at: { n: '360', p: '84', k: '4' },
  },
  {
    id: 'the-second-step-reaches-the-gcd-without-saying-so-1',
    knowledgePointId: 'swapping-in-the-remainder-keeps-every-common-divisor',
    kind: 'evaluate',
    prompt:
      'The pair is now 84 and 24. Divide again: 24·3 = 72, and a fourth 24 would be 96, which is '
      + 'past 84. Evaluate n - p*k at n = 84, p = 24, k = 3. Your answer is gcd(360, 84) — but '
      + 'nothing you have done so far entitles you to say that yet, because the rule is "the '
      + 'last NON-ZERO remainder" and you cannot know this one is the last until the next '
      + 'division comes out exact. That is the task below.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 84 − 72 = 12, and 0 ≤ 12 < 24. This is the gcd.
    //
    // THE PROMPT WITHHOLDS THE ENTITLEMENT RATHER THAN THE ANSWER, which is the
    // opposite of the usual ordering and is deliberate. Telling the learner the
    // answer is 12 and that they may not yet conclude it costs nothing — the
    // arithmetic is the same — and it is the only way to ask about a stopping
    // rule with one task. The alternative, asking for the gcd here, would mark a
    // learner correct for stopping one step early, which is the error the point
    // exists to prevent.
    reference: '12',
    at: { n: '84', p: '24', k: '3' },
  },
  {
    id: 'the-zero-remainder-is-the-signal-not-the-answer-1',
    knowledgePointId: 'swapping-in-the-remainder-keeps-every-common-divisor',
    kind: 'evaluate',
    prompt:
      'The pair is now 24 and 12, and 12 goes into 24 exactly twice. Evaluate n - p*k at '
      + 'n = 24, p = 12, k = 2. Your answer is what ENDS the algorithm and is not what the '
      + 'algorithm returns: the gcd is 12, the last non-zero remainder, and your answer is the '
      + 'remainder the process actually finished on. Reporting it as the gcd is the single '
      + 'commonest way to get this wrong, and it is worth knowing why 12 is right — your answer '
      + 'means the pair (24, 12) has the same common divisors as the pair (12, 0), and every '
      + 'number divides 0, so those are just the divisors of 12.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 24 − 24 = 0.
    //
    // THE ONE TASK IN THIS BUILD WHOSE REFERENCE IS 0 BY DESIGN RATHER THAN BY
    // ARITHMETIC. `percent`'s third task has a reference that is 0 at some
    // inputs and that is its content; this one is 0 at the only inputs it has,
    // and the content is that the 0 is a SIGNAL. The pairing with the task above
    // is what makes it evidence: that one produces the answer without the
    // entitlement to call it one, this one supplies the entitlement and produces
    // a number that must not be reported. Either alone would be weak; a learner
    // answering both has distinguished the two remainders that the stopping rule
    // is about.
    reference: '0',
    at: { n: '24', p: '12', k: '2' },
  },
  {
    id: 'the-unwound-combination-reaches-the-gcd-1',
    knowledgePointId: 'the-same-divisions-read-backwards-give-the-gcd-as-a-combination',
    kind: 'evaluate',
    prompt:
      'Reading the two useful divisions backwards gives 12 = 84 − 24·3 and 24 = 360 − 84·4, and '
      + 'substituting the second into the first and collecting gives the coefficients −3 for the '
      + '360 and 13 for the 84. Check them: evaluate a*x + b*y at a = 360, x = -3, b = 84, '
      + 'y = 13. You should get the gcd the three divisions above produced. Multiplying out is '
      + 'the only check available on a back-substitution, and it is worth running every time — '
      + 'nothing about a wrong coefficient looks wrong on the page.',
    given: 'a*x + b*y',
    variables: PAIR_AND_BEZOUT_COEFFICIENTS,
    // 360·(−3) + 84·13 = −1080 + 1092 = 12, which is gcd(360, 84).
    reference: '12',
    at: { a: '360', x: '-3', b: '84', y: '13' },
  },
  {
    id: 'one-dropped-sign-is-not-a-near-miss-1',
    knowledgePointId: 'the-same-divisions-read-backwards-give-the-gcd-as-a-combination',
    kind: 'evaluate',
    prompt:
      'Now make the commonest mistake on purpose: keep the 13 and lose the minus on the 3. '
      + 'Evaluate a*x + b*y at a = 360, x = 3, b = 84, y = 13. Your answer is CORRECT as an '
      + 'answer to this task and is not the gcd of anything — it is larger than both 360 and 84, '
      + 'where the gcd has to be no bigger than either. That is the general reason a sign has to '
      + 'be negative here: 12 is smaller than both numbers, and any whole multiple of 360 or of '
      + '84 that is not zero is already at least 84, so two coefficients that are both zero or '
      + 'more can never add to 12.',
    given: 'a*x + b*y',
    variables: PAIR_AND_BEZOUT_COEFFICIENTS,
    // 360·3 + 84·13 = 1080 + 1092 = 2172.
    //
    // THE DELIBERATELY-WRONG ANSWER, which is the trick `division-algorithm`
    // records getting for free from its window being an inequality. The same
    // trick is available here for a different reason: a Bézout identity is
    // checkable by multiplying out, so a broken one produces a number that is
    // gradable and visibly absurd. 2172 rather than a near miss is the whole
    // choice — a sign error on a coefficient moves the answer by twice that
    // term, so there is no version of this that lands close to 12 and could be
    // read as rounding.
    reference: '2172',
    at: { a: '360', x: '3', b: '84', y: '13' },
  },
  {
    id: 'a-second-pair-of-coefficients-reaches-the-same-gcd-1',
    knowledgePointId: 'the-same-divisions-read-backwards-give-the-gcd-as-a-combination',
    kind: 'evaluate',
    prompt:
      'The coefficients −3 and 13 are not the only pair. Add 84/12 = 7 to the first and subtract '
      + '360/12 = 30 from the second: evaluate a*x + b*y at a = 360, x = 4, b = 84, y = -17. You '
      + 'should get 12 again, because 7·360 and 30·84 are both 2520, so the two changes cancel '
      + 'exactly. Agreeing with the earlier task is the content here rather than a repetition — '
      + 'it is what shows the pair of coefficients was never "the" answer, and why a task can '
      + 'ask for the VALUE of a combination but not for the combination.',
    given: 'a*x + b*y',
    variables: PAIR_AND_BEZOUT_COEFFICIENTS,
    // 360·4 + 84·(−17) = 1440 − 1428 = 12, the same gcd by a different pair.
    reference: '12',
    at: { a: '360', x: '4', b: '84', y: '-17' },
  },
  {
    id: 'picking-the-algorithm-up-at-its-second-step-1',
    knowledgePointId: 'the-combination-decides-which-equations-have-whole-number-solutions',
    kind: 'evaluate',
    prompt:
      '`division-algorithm`, the concept below this one, divides 2026 by 7 in its own first '
      + 'worked example and gets 2026 = 7·289 + 3. That division is step one of this algorithm, '
      + 'so the pair is already 7 and 3 and you need not redo it. Take the next step: 3·2 = 6, '
      + 'and a third 3 would be 9, which is past 7. Evaluate n - p*k at n = 7, p = 3, k = 2. '
      + 'One more division finishes it — 3 = 1·3 + 0 — so your answer is the last non-zero '
      + 'remainder and therefore gcd(2026, 7). Two numbers whose gcd is that are called coprime.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 7 − 6 = 1, so gcd(2026, 7) = 1.
    //
    // STEP TWO AND NOT STEP ONE, WHICH IS A RESERVATION BEING HONOURED.
    // (2026, 7, 289) -> 3 is already a task of the concept below — see the block
    // comment at the top of this one — and two tasks with one expression, one
    // substitution and one answer are one task written twice. Starting at step
    // two is also the better ask: what this point needs is for the learner to
    // CONTINUE somebody else's division, since the whole claim of the concept is
    // that one step of the algorithm is a division with remainder and nothing
    // else.
    //
    // 2026 = 2 · 1013 WITH 1013 PRIME, which the prompt does not say and the
    // worked example does. It is the reason this pair is worth coprimality: the
    // factorisation route needs that fact about a four-digit number first, and
    // the two divisions here need nothing.
    reference: '1',
    at: { n: '7', p: '3', k: '2' },
  },
  {
    id: 'the-solvability-test-is-one-division-1',
    knowledgePointId: 'the-combination-decides-which-equations-have-whole-number-solutions',
    kind: 'evaluate',
    prompt:
      'Can 360x + 84y = 30 be met with whole numbers x and y? Every value the left-hand side '
      + 'can take is a multiple of 12, because 12 divides both 360 and 84 and so divides any '
      + 'whole-number combination of them. So the question is whether 30 is a multiple of 12, '
      + 'and 12·2 = 24. Evaluate n - p*k at n = 30, p = 12, k = 2. A non-zero answer means 30 is '
      + 'NOT a multiple of 12 and no pair of whole numbers can work — which is settled by this '
      + 'one division rather than by a search that keeps failing.',
    given: 'n - p*k',
    variables: DIVIDEND_DIVISOR_QUOTIENT,
    // 30 − 24 = 6, which is not 0, so 12 does not divide 30.
    //
    // AN IMPOSSIBILITY ASKED AS A NUMBER, which is the only honest `evaluate`
    // encoding of it. "Show there is no solution" needs a kind that tests a
    // produced object against a claim, and this build ships no checker for one.
    // What it has instead is that the TEST is arithmetic: the remainder decides,
    // so the learner computes the thing the conclusion rests on and the prompt
    // says which conclusion. That is the same move `division-algorithm` makes
    // with its two inadmissible leftovers, run the other way round — there a
    // correct answer was an inadmissible remainder, here a non-zero answer is a
    // proof that nothing is admissible.
    reference: '6',
    at: { n: '30', p: '12', k: '2' },
  },
  {
    id: 'scaling-the-combination-solves-the-solvable-one-1',
    knowledgePointId: 'the-combination-decides-which-equations-have-whole-number-solutions',
    kind: 'evaluate',
    prompt:
      'Change the 30 to 60 and the answer changes, because 60 = 12·5 IS a multiple of 12. No new '
      + 'algorithm is needed: multiply the identity 12 = (−3)·360 + 13·84 through by 5, which '
      + 'takes the coefficients to −15 and 65. Evaluate a*x + b*y at a = 360, x = -15, b = 84, '
      + 'y = 65 and confirm you get 60. Scaling a combination you already have is the practical '
      + 'payoff of having unwound the divisions at all — the alternative is solving the equation '
      + 'from scratch for every right-hand side.',
    given: 'a*x + b*y',
    variables: PAIR_AND_BEZOUT_COEFFICIENTS,
    // 360·(−15) + 84·65 = −5400 + 5460 = 60.
    //
    // THE PAIR OF TASKS IS THE POINT, which is why the two sit together and why
    // the solvable case is the second of the two. The test above says "no" by
    // producing 6; this says "yes" by producing the right-hand side itself. A
    // learner who answers only the first has met a rule that rejects, and the
    // rule is an equivalence.
    reference: '60',
    at: { a: '360', x: '-15', b: '84', y: '65' },
  },
  // ── counting-and-arrangements, forty-fourth promotion: counting-principles
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact INTEGER arithmetic with no worker. Not merely rational: every
  // reference below is a whole number, because every one of them counts
  // something, and a count that came out as a fraction would be a wrong answer
  // rather than an unusual one. That is a stronger property than the subjects
  // either side of it hold and it is worth stating, because it is also the
  // check: if an expression here produced 83.5, the expression is wrong.
  //
  // THE ENCODING IS THE DESCENDING PRODUCT, AND NOT BECAUSE A FACTORIAL WOULD
  // HAVE BEEN NICER. `exactValue` in numerals.ts switches on integer, rational,
  // decimal, negate, add, multiply, subtract, divide, power, sqrt and abs, with
  // no case for a function call, so `factorial(9)/factorial(6)` parses — expr.ts
  // does list `factorial` in `ALLOWED_FUNCTIONS` — and then returns null, which
  // drops the task to a worker this subject must not need. ontology.ts says the
  // same conclusion with a reason that has since stopped being true, and
  // ontology-counting.ts's header carries the correction:
  //
  //     a*b*c             an ordered count, the pool shrinking per factor
  //     p + q*r*s         two cases of a split, added
  //     (a*b*c)/d         an unordered count: the ordered one over its orderings
  //     n/d               the multiples of d up to n
  //     a-b+c             a net MULTIPLICITY, not a size
  //     a+b+c-d-e-f+g     a union of three, written with every sign showing
  //
  // ONE EXPRESSION IS ASKED AT TWO SUBSTITUTIONS ACROSS A POINT BOUNDARY, which
  // is the device ontology-sets.ts used and the reason the shared list has one
  // name. `a*b*c` is asked at (9, 9, 8) in the first point, where the pool holds
  // still at nine because the first digit was the only one barred from being
  // zero, and at (9, 8, 7) in the second, where the pool shrinks because a
  // person cannot hold two offices. Same rule, two pools, two answers — 648 and
  // 504 — so the pair cannot read as one task duplicated.
  //
  // THE SECOND POINT'S THIRD TASK REACHES THE SAME ANSWER AS ITS SECOND, AND
  // THAT IS THE TASK. 84 twice, once down a three-factor product over 3! and
  // once down a six-factor product over 6!, because choosing the 3 who are in
  // and the 6 who are out are one act. Two tasks with the same reference would
  // normally be a duplicate; here the agreement is the content, which is why the
  // prompts name each other and why the arities are different lists.
  //
  // THE MULTIPLICITY TASK IS THE ONE CARRYING THE CONCEPT'S HARDEST CLAIM, and
  // it is the substitute for a `justify` this build cannot rule. Asked at
  // (3, 3, 1): an element of all three sets is counted by three singles,
  // removed by three pairwise terms, restored by one triple term, and the answer
  // 1 IS the argument for why the last sign is positive. Asked that way rather
  // than as `a - b` at (3, 3) — which answers 0 and is the symptom — because the
  // task should produce the repair and not the fault.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine. The reasons are in
  // ontology-counting.ts's header; the one worth repeating here is that the
  // division in `(a*b*c)/d` needs no stated condition because a descending
  // product of r factors is always divisible by r!, the quotient being a count
  // of something, and `d` is never zero since 0! = 1.
  {
    id: 'multiply-the-option-counts-when-they-hold-still-1',
    knowledgePointId: 'multiply-choices-that-and-together-and-add-cases-that-do-not-overlap',
    kind: 'evaluate',
    prompt:
      'Count the three-digit numbers from 100 to 999 whose three digits are all different. Take '
      + 'the choices left to right: the first digit cannot be 0, so it has 9 options; the second '
      + 'may be any digit except the first, so 9; the third any except the two used, so 8. The '
      + 'product rule applies because the NUMBER of options at each step is the same whichever '
      + 'digits came earlier — after a first digit of 7 the second may be any of '
      + '{0,1,2,3,4,5,6,8,9}, and after a 3 any of {0,1,2,4,5,6,7,8,9}: different sets, both of '
      + 'size 9. That is the condition, and it is weaker than "the choices are unrelated". '
      + 'Evaluate a*b*c at a = 9, b = 9, c = 8.',
    given: 'a*b*c',
    variables: OPTION_COUNTS,
    // 9 × 9 × 8 = 648.
    //
    // THE MIDDLE FACTOR IS 9 AND NOT 8, which is the whole reason this instance
    // was chosen. A learner who reads "all different" as "subtract one each
    // time" writes 9 × 8 × 7 and gets 504 — the second point's answer, by
    // coincidence of the same three digits — and the error is that the first
    // digit's restriction was being barred from 0, not being used up. Ten digits
    // less one used is nine, and the pool only starts shrinking below nine at
    // the third choice.
    reference: '648',
    at: { a: '9', b: '9', c: '8' },
  },
  {
    id: 'count-one-case-in-which-the-product-rule-holds-1',
    knowledgePointId: 'multiply-choices-that-and-together-and-add-cases-that-do-not-overlap',
    kind: 'evaluate',
    prompt:
      'Now count only the EVEN ones. The product rule does not apply to this as posed: if the '
      + 'last digit is 2 the first digit must avoid 0 and 2 and has 8 options, but if the last '
      + 'digit is 0 the first must avoid 0 and 0 — the same digit twice — and has 9. The option '
      + 'count moved, so there is no single number to multiply by and the rule is inapplicable '
      + 'rather than inaccurate. Split on exactly the thing that moved and take the first case: '
      + 'last digit 0, first digit any of 1 to 9, middle digit anything except the first and 0. '
      + 'Evaluate a*b at a = 9, b = 8.',
    given: 'a*b',
    variables: OPTION_COUNTS,
    // 9 × 8 = 72, the last-digit-zero case.
    //
    // `a*b` OVER `OPTION_COUNTS`, WHICH DECLARES THREE LETTERS AND USES TWO.
    // That is deliberate and it is what the split looks like: this case has two
    // free choices because the third was pinned to 0 by the case itself, and the
    // other case has three. An expression naming all three letters would have
    // had to invent a factor of 1 for a choice that was never made.
    reference: '72',
    at: { a: '9', b: '8' },
  },
  {
    id: 'add-the-cases-once-nothing-is-in-two-of-them-1',
    knowledgePointId: 'multiply-choices-that-and-together-and-add-cases-that-do-not-overlap',
    kind: 'evaluate',
    prompt:
      'Finish the even count. The first case gave 72. The second is last digit one of 2, 4, 6, '
      + '8 — 4 options — with the first digit avoiding 0 and the last digit, which are two '
      + 'different digits, so 8 options, and the middle avoiding those two, so 8. Add the cases: '
      + 'a number\'s last digit is either 0 or one of 2, 4, 6, 8 and never both, so nothing was '
      + 'counted twice, and every even three-digit number with distinct digits ends in one of '
      + 'those five, so nothing was left out. Evaluate p + q*r*s at p = 72, q = 4, r = 8, s = 8. '
      + 'Compare your answer with the 5 × 8 × 8 = 320 the product rule offered: the gap is the '
      + 'one case where 9 options had been counted as 8.',
    given: 'p + q*r*s',
    variables: TWO_CASES_OF_A_SPLIT,
    // 72 + 4 × 8 × 8 = 72 + 256 = 328.
    //
    // THE COMPARISON IN THE PROMPT IS EXACT AND IS WHY THIS TASK ASKS FOR THE
    // TOTAL RATHER THAN FOR THE SECOND CASE. 328 − 320 = 8, and the whole of
    // that 8 is Case A: it really has 9 × 8 = 72 where the product rule had
    // allowed it 8 × 8 = 64. A learner who has produced both numbers can locate
    // the entire discrepancy in one case, which is a stronger lesson than "the
    // product rule was wrong" — the error was one option in one case, and that
    // is the size of mistake that does not announce itself.
    reference: '328',
    at: { p: '72', q: '4', r: '8', s: '8' },
  },
  {
    id: 'count-an-ordered-selection-as-a-descending-product-1',
    knowledgePointId:
      'ordered-selections-are-a-descending-product-and-unordered-ones-divide-by-the-orderings',
    kind: 'evaluate',
    prompt:
      'A club of 9 members fills three distinct offices — president, secretary, treasurer — with '
      + 'three different people. Order is information here, and that is a fact about the problem '
      + 'rather than about the arithmetic: Ann as president with Bob as secretary is a different '
      + 'outcome from Bob as president with Ann as secretary, because the two hold different '
      + 'jobs. Three choices with the pool shrinking by one each time, and the option count holds '
      + 'still at each step whoever was picked before — after any president there are exactly 8 '
      + 'people left. Evaluate a*b*c at a = 9, b = 8, c = 7.',
    given: 'a*b*c',
    variables: OPTION_COUNTS,
    // 9 × 8 × 7 = 504.
    //
    // THE SAME EXPRESSION AS THE FIRST POINT'S FIRST TASK, AT A DIFFERENT
    // SUBSTITUTION, and the contrast is the reason both exist. There the pool
    // held still at nine because only the first digit was barred from being
    // zero; here it shrinks because a person cannot hold two offices. One rule,
    // and whether the pool shrinks is read off the problem rather than assumed
    // from the words "all different".
    reference: '504',
    at: { a: '9', b: '8', c: '7' },
  },
  {
    id: 'divide-by-the-orderings-of-one-selection-1',
    knowledgePointId:
      'ordered-selections-are-a-descending-product-and-unordered-ones-divide-by-the-orderings',
    kind: 'evaluate',
    prompt:
      'The same club now chooses a committee of 3 with no offices. Order is NOT information: the '
      + 'committee of Ann, Bob and Cleo is the same committee however it was written or in '
      + 'whatever sequence they were picked. So the 504 above is an answer to a different '
      + 'question. Ask how many of those 504 office-fillings used exactly Ann, Bob and Cleo — it '
      + 'is the number of ways to put three particular people in three particular offices, '
      + '3 × 2 × 1 = 6 — and then notice that this 6 is the same for EVERY committee of three, '
      + 'since the count never mentioned which three. Evaluate (a*b*c)/d at a = 9, b = 8, c = 7, '
      + 'd = 6.',
    given: '(a*b*c)/d',
    variables: ORDERED_PRODUCT_AND_ORDERINGS,
    // 504 ÷ 6 = 84.
    //
    // THE UNIFORMITY OF THE OVERCOUNT IS THE HYPOTHESIS AND THE PROMPT STATES IT
    // RATHER THAN USING IT. If different committees had been reached different
    // numbers of times there would be no single divisor and the repair would
    // have to be a case split, which is exactly what the first point's problem
    // needed when ITS one-line rule lost its hypothesis. The two points carry
    // the same lesson about the same kind of condition, and this is the sentence
    // that joins them.
    reference: '84',
    at: { a: '9', b: '8', c: '7', d: '6' },
  },
  {
    id: 'count-the-ones-left-out-and-get-the-same-answer-1',
    knowledgePointId:
      'ordered-selections-are-a-descending-product-and-unordered-ones-divide-by-the-orderings',
    kind: 'evaluate',
    prompt:
      'Count the same committees a second way, by choosing which 6 members are left OUT instead '
      + 'of which 3 are in. Each choice determines the other, so the two counts must agree. '
      + 'Ordered, that is 9 × 8 × 7 × 6 × 5 × 4 = 60480 selections of six in order, and every '
      + 'group of six was reached once per ordering of those six, which is 6! = 720. Evaluate '
      + '(a*b*c*d*e*f)/g at a = 9, b = 8, c = 7, d = 6, e = 5, f = 4, g = 720. Your answer is '
      + 'the symmetry C(9, 3) = C(9, 6), which is why row 9 of Pascal\'s triangle reads the same '
      + 'forwards and backwards — and it is six factors where the previous task needed three, so '
      + 'the symmetry is worth using in whichever direction is shorter.',
    given: '(a*b*c*d*e*f)/g',
    variables: SIX_FACTOR_PRODUCT_AND_ORDERINGS,
    // 60480 ÷ 720 = 84, the same answer as the task above.
    //
    // TWO TASKS WITH ONE REFERENCE, WHICH IS NORMALLY A DUPLICATE AND HERE IS
    // THE POINT. The pair is the argument that naming who is in names who is
    // out, so the agreement has to be produced rather than asserted — a learner
    // told that C(9, 3) = C(9, 6) has been handed an identity, and one who
    // computes 84 down a three-factor product and again down a six-factor one
    // has watched two descriptions of a single decision land on one number.
    // Asked at 9 and not at a smaller n so that the two arities differ visibly:
    // at n = 4, r = 2 the two products would be the same length and the saving
    // would not exist.
    reference: '84',
    at: { a: '9', b: '8', c: '7', d: '6', e: '5', f: '4', g: '720' },
  },
  {
    id: 'a-pairwise-overlap-is-a-divisibility-too-1',
    knowledgePointId:
      'three-overlapping-sets-need-the-triple-added-back-after-the-pairs-remove-it-entirely',
    kind: 'evaluate',
    prompt:
      'Among the whole numbers 1 to 60, count those divisible by both 2 and 3. A number divisible '
      + 'by both is divisible by their least common multiple, which is 6 — the lcm and not the '
      + 'product in general, though 2 and 3 are coprime so the two agree here. So the overlap of '
      + 'two divisibility conditions is itself one divisibility condition, which is what the '
      + 'pairwise terms of the correction are counting. Evaluate n/d at n = 60, d = 6. The '
      + 'division is exact because 60 is a multiple of 6; the range was chosen so that every '
      + 'count in this point comes out whole.',
    given: 'n/d',
    variables: RANGE_AND_DIVISOR,
    // 60 ÷ 6 = 10.
    //
    // THE lcm CAVEAT IS IN THE PROMPT BECAUSE THIS INSTANCE CANNOT TEACH IT.
    // Every pair among 2, 3 and 5 is coprime, so lcm and product agree on all
    // three pairwise terms and a learner could leave with "multiply the two
    // divisors" intact. Naming the rule that actually holds costs one clause and
    // is the difference between an instance that happens to work and one a
    // learner can carry to 4 and 6, where the product is 24 and the lcm is 12.
    reference: '10',
    at: { n: '60', d: '6' },
  },
  {
    id: 'the-net-multiplicity-of-an-element-in-all-three-1',
    knowledgePointId:
      'three-overlapping-sets-need-the-triple-added-back-after-the-pairs-remove-it-entirely',
    kind: 'evaluate',
    prompt:
      'Follow the number 30 through the correction. It is divisible by 2, by 3 and by 5, so all '
      + 'three single counts included it: 3. It is also divisible by 6, by 10 AND by 15, so all '
      + 'three pairwise subtractions removed it: 3. After those two tiers it is counted zero '
      + 'times, and it is certainly in the union. It is divisible by 30, so the triple term '
      + 'restores it once: 1. Evaluate a - b + c at a = 3, b = 3, c = 1. Your answer is how many '
      + 'times 30 ends up counted, and since it must be counted once, that answer IS the reason '
      + 'the last sign is a plus — not evidence consistent with it.',
    given: 'a - b + c',
    variables: TIER_MULTIPLICITIES,
    // 3 − 3 + 1 = 1.
    //
    // THE ANSWER IS AN ARGUMENT, WHICH IS THIS BUILD'S NEAREST AVAILABLE THING
    // TO A `justify`. The ask "say why the triple overlap is added back exactly
    // once" has no kind that can rule it, so the question is rephrased until its
    // ANSWER is the justification: a multiplicity of 1 is what the union
    // requires, and an element reaching 1 only because of the final term is the
    // whole case for that term existing.
    //
    // ASKED AT (3, 3, 1) RATHER THAN `a - b` AT (3, 3). The second answers 0,
    // which is the fault rather than the repair, and a task whose reference is
    // the broken intermediate teaches the shape of the error with nothing
    // attached to fix it. The audit of the other two kinds — net 1 for an element
    // in one set, net 2 − 1 = 1 for an element in two — is in the worked example,
    // where all three kinds sit together and the completeness of the case split
    // is visible.
    reference: '1',
    at: { a: '3', b: '3', c: '1' },
  },
  {
    id: 'inclusion-exclusion-over-three-sets-1',
    knowledgePointId:
      'three-overlapping-sets-need-the-triple-added-back-after-the-pairs-remove-it-entirely',
    kind: 'evaluate',
    prompt:
      'Count the whole numbers from 1 to 60 divisible by at least one of 2, 3, 5. The singles are '
      + '60/2 = 30, 60/3 = 20, 60/5 = 12, which add to 62 — impossible among 60 numbers, so the '
      + 'cases overlap and the sum rule does not apply. The pairs are the multiples of 6, 10 and '
      + '15: 10, 6 and 4. The triple is the multiples of 30: 2, namely 30 and 60. Evaluate '
      + 'a+b+c-d-e-f+g at a = 30, b = 20, c = 12, d = 10, e = 6, f = 4, g = 2. Check it the other '
      + 'way round: your answer taken from 60 should be the count divisible by NONE of the three, '
      + 'and the numbers coprime to 30 in each block of thirty are 1, 7, 11, 13, 17, 19, 23, 29 '
      + '— eight of them, so sixteen across two blocks.',
    given: 'a+b+c-d-e-f+g',
    variables: THREE_SETS_AND_THEIR_OVERLAPS,
    // 30 + 20 + 12 − 10 − 6 − 4 + 2 = 62 − 20 + 2 = 44.
    //
    // THE SECOND CHECK IN THE PROMPT IS A GENUINELY INDEPENDENT COMPUTATION,
    // which is why it is given rather than left to the worked example. 60 − 44 =
    // 16, and counting the numbers coprime to 30 directly gives 8 per block of
    // thirty and 16 across two. That route never adds or subtracts an overlap,
    // so an error in the alternating expression could not have survived into it
    // — unlike a check that rearranges the same seven terms, which would confirm
    // arithmetic and nothing else.
    //
    // THE RANGE IS 60 BECAUSE IT IS THE lcm OF 2, 3 AND 5 DOUBLED, so all seven
    // divisions are exact and `exactValue` needs no floor it does not have. Two
    // blocks rather than one so that the triple overlap has 2 members instead of
    // 1: a triple term of 1 would be true and would read as a special case, and
    // the term has to look like a count.
    reference: '44',
    at: { a: '30', b: '20', c: '12', d: '10', e: '6', f: '4', g: '2' },
  },
  // ── chance-and-events, forty-fifth promotion: sample-spaces
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact arithmetic with no worker. The subject above holds the same
  // property and says why: a subject whose prerequisites are a set and a
  // fraction sits low enough that a worker outage must not wall it off.
  //
  // THE DIFFERENCE FROM THE SUBJECT ABOVE IS THAT THESE ARE NOT ALL INTEGERS,
  // and the check that replaces its "every reference is a whole number" is
  // tighter rather than looser. FIVE of the nine are probabilities and so are
  // rational — 1/8, 3/8, 1/2, 5/8, 7/8 — and every one of them lies in [0, 1]
  // AND is a count of outcomes over the size of the space: each is k/8 with k a
  // whole number, and 1/2 is 4/8 with the fraction reduced. A reference outside
  // [0, 1], or one that is not k/8, is an authoring fault in the same way 83.5
  // would have been one there. The four integers are the size of the space, a
  // subset size, the partition total and the multiplicity — exactly the set of
  // answers that are NOT probabilities.
  //
  //     a*b*c             two results per toss, three tosses — the space's size
  //     r + s             two cases of a partition, added
  //     p + q + r + s     the whole partition, which must return the space's size
  //     e/n               a count of outcomes over the size of the space
  //     e/n + f/n         two DISJOINT events, their probabilities added
  //     a/n + b/n - c/n   two OVERLAPPING events, the overlap taken off once
  //     p + q - r         how many times one outcome is counted — a MULTIPLICITY
  //     1 - c/n           a complement, from the whole space having probability 1
  //
  // TWO TASKS SHARE THE REFERENCE 8 AND THE AGREEMENT IS THE CONTENT, which is
  // the device ontology-sets.ts used and ontology-counting.ts repeated. 2 × 2 ×
  // 2 is the size of the space; 1 + 3 + 3 + 1 is the same space counted by how
  // many heads came up. A partition that did not add back to the whole would not
  // be a partition, so the second answer is the first answer or the audit has
  // failed. The two expressions are different lists with different arities, so
  // the pair cannot read as one task duplicated.
  //
  // ONE EXPRESSION IS ASKED AT TWO SUBSTITUTIONS INSIDE ONE POINT. `e/n` is
  // asked at (1, 8) and at (3, 8) — a one-outcome event and a three-outcome one
  // — because the derivation runs through the first to reach the second: eight
  // equal probabilities adding to 1 give 1/8, and the event is three of those
  // added. Two tasks rather than one so that the learner produces the 1/8 the
  // formula is built out of.
  //
  // THE MULTIPLICITY TASK CARRIES THE CONCEPT'S HARDEST CLAIM and is the
  // substitute for a `justify` this build cannot rule, the same role the
  // three-set multiplicity plays in the subject above. Asked at (1, 1, 1): an
  // outcome in both events is counted once by P(A), once by P(B) and removed
  // once by subtracting P(A and B), and the answer 1 IS the argument for why one
  // subtraction is the whole repair. Its reference is an integer sitting in a
  // run of probabilities, and the prompt says so, because `1` is also the value
  // of the uncorrected sum in this very worked example — the near-collision is
  // numerical only and the two are a count of times and a probability.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine. The reasons are in
  // ontology-chance.ts's header; the one worth repeating is that every
  // denominator is the size of the sample space, which is 8 in every task and
  // never a declared variable that could be zero. And no task asks for lowest
  // terms: `maxDenominatorDegree` bounds a DEGREE rather than a denominator, so
  // `4/8` cannot be refused in favour of `1/2`, and `exactValue` rules both
  // correct — which is the right ruling for an `evaluate`.
  {
    id: 'size-the-space-by-what-each-step-can-do-1',
    knowledgePointId:
      'an-outcome-is-a-complete-result-and-an-event-is-a-subset-of-the-listed-space',
    kind: 'evaluate',
    prompt:
      'A coin is tossed three times and the result of each toss is written down in order, so one '
      + 'outcome is a sequence of three letters and HHT, HTH and THH are three different '
      + 'outcomes. The sample space is {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}. How many '
      + 'outcomes is that? Each toss contributes one letter with two possible values, and the '
      + 'three contributions are independent of each other, so the number of three-letter '
      + 'sequences is the product. Evaluate a*b*c at a = 2, b = 2, c = 2.',
    given: 'a*b*c',
    variables: RESULTS_PER_TRIAL,
    // 2 × 2 × 2 = 8.
    //
    // THE ONLY MULTIPLICATION IN THIS CONCEPT, and the boundary is the reason.
    // Counting is `counting-principles`, an authored subject; combinatorics
    // meeting chance is `counting-probability`, directly above this concept and
    // authored into this same subject by the forty-sixth promotion. So the space
    // is sized once, here, and it is small enough that the prompt can print all
    // eight of its outcomes — every event in all three points is then READ off
    // that list rather than counted.
    //
    // "IN THE SUBJECT" IS WHAT THIS COMMENT USED TO SAY, and the two readings
    // were the same nine tasks until that promotion arrived with four that
    // multiply. The claim was always about the concept; the subject-wide wording
    // was a filter that happened to agree with it, and tests/concepts-logic.mjs
    // had to be narrowed for the same reason.
    reference: '8',
    at: { a: '2', b: '2', c: '2' },
  },
  {
    id: 'count-an-event-by-adding-the-cases-it-covers-1',
    knowledgePointId:
      'an-outcome-is-a-complete-result-and-an-event-is-a-subset-of-the-listed-space',
    kind: 'evaluate',
    prompt:
      'Group the eight sequences by how many heads they show: 0 heads is TTT alone, 1 head is '
      + 'HTT, THT and TTH, 2 heads is HHT, HTH and THH, and 3 heads is HHH alone — so the four '
      + 'groups hold 1, 3, 3 and 1 of the sequences. The event "at least two heads" is a subset '
      + 'of the eight, and it is exactly the sequences in the last two groups. No sequence is in '
      + 'both of those groups, since a sequence has one number of heads, so the sizes add. '
      + 'Evaluate r + s at r = 3, s = 1.',
    given: 'r + s',
    variables: OUTCOMES_BY_CASE,
    // 3 + 1 = 4: {HHT, HTH, THH} together with {HHH}.
    //
    // `r + s` OVER A LIST OF FOUR LETTERS, TWO OF THEM UNUSED, and that is what
    // a subset of a partition looks like. The four letters are the four groups
    // in order of how many heads, so `r` and `s` are "two heads" and "three
    // heads" in both tasks that use this list — an expression naming only two
    // letters would have lost which two groups they were.
    //
    // ADDING AND NOT COUNTING, which is the point rather than an economy. The
    // four sequences could be read straight off the printed list; adding the two
    // group sizes is the sum rule applied to parts of a partition, and it is the
    // move the next task audits over all four groups.
    reference: '4',
    at: { r: '3', s: '1' },
  },
  {
    id: 'audit-a-coarser-space-against-the-finer-one-1',
    knowledgePointId:
      'an-outcome-is-a-complete-result-and-an-event-is-a-subset-of-the-listed-space',
    kind: 'evaluate',
    prompt:
      'Recording only how many heads came up gives a DIFFERENT sample space for the same '
      + 'experiment: {0, 1, 2, 3}. It is a legal one — a run has exactly one number of heads, so '
      + 'no two records can both happen and one of them must — with four outcomes where the other '
      + 'had eight. Audit it against the finer space by adding up how many sequences each record '
      + 'stands for: 1 for the record 0, 3 for 1, 3 for 2, and 1 for 3. Evaluate p + q + r + s at '
      + 'p = 1, q = 3, r = 3, s = 1. Your answer has to come back to the size of the finer space, '
      + 'or the four groups were not a partition of it — and notice that the four numbers you '
      + 'added are not equal.',
    given: 'p + q + r + s',
    variables: OUTCOMES_BY_CASE,
    // 1 + 3 + 3 + 1 = 8, which is the first task's answer.
    //
    // THE SHARED REFERENCE IS THE CONTENT. Two tasks in one point answering 8 is
    // normally a duplicate; here the first answer is the size of the space and
    // the second is the same space counted a second way, so the agreement is
    // what makes the four groups a partition rather than a list of guesses.
    //
    // AND THE INEQUALITY OF THE ADDENDS IS WHAT THE NEXT POINT NEEDS. 1, 3, 3
    // and 1 are why the coarser space's four outcomes are not equally likely,
    // which is the entire reason dividing by 4 there gives a wrong answer. A
    // learner who has produced this 8 has produced the evidence before the
    // claim.
    reference: '8',
    at: { p: '1', q: '3', r: '3', s: '1' },
  },
  {
    id: 'pin-one-outcomes-probability-from-the-whole-space-1',
    knowledgePointId:
      'equal-likelihood-is-a-property-of-the-space-and-is-what-licenses-dividing',
    kind: 'evaluate',
    prompt:
      'The coin is fair, which says no toss favours heads over tails and the tosses do not '
      + 'influence one another — so no one of the eight sequences is favoured over another, and '
      + 'the eight one-outcome events all have the same probability. Two conditions pin that '
      + 'number. The whole sample space has probability 1, and events with no outcome in common '
      + 'have probabilities that ADD. The eight one-outcome events are pairwise disjoint and '
      + 'together they are the whole space, so eight equal numbers add to 1. The probability of '
      + 'one sequence is therefore a one-outcome event over the size of the space: evaluate e/n '
      + 'at e = 1, n = 8.',
    given: 'e/n',
    variables: EVENT_SIZES_AND_THE_SPACE,
    // 1/8.
    //
    // THE DERIVATION IS THE CONTENT AND THE ARITHMETIC IS ALMOST NOTHING, which
    // is deliberate and is why this task exists separately from the next one. A
    // learner who produces 1/8 having read the prompt has followed 8p = 1 to its
    // conclusion; the value of `n` is where the 8 came from, and `exactValue`
    // will accept 1/8 as the substituted form because the rendering and the
    // value coincide — the same situation `complete-odd-b-h-1` is in with `b/2`
    // at b = 3, and for the same honest reason: there is no further step.
    reference: '1/8',
    at: { e: '1', n: '8' },
  },
  {
    id: 'add-the-outcomes-of-one-event-in-a-single-division-1',
    knowledgePointId:
      'equal-likelihood-is-a-property-of-the-space-and-is-what-licenses-dividing',
    kind: 'evaluate',
    prompt:
      'The event "exactly two heads" is the subset {HHT, HTH, THH} of the eight sequences. Those '
      + 'are three one-outcome events with no outcome in common, so their probabilities add: 1/8 '
      + '+ 1/8 + 1/8. Doing that addition in one step is dividing the count of outcomes in the '
      + 'event by the count in the space, which is all the formula P(E) = |E| / |S| is. Evaluate '
      + 'e/n at e = 3, n = 8. Keep in mind what licensed it: the eight outcomes being equally '
      + 'likely is a fact about the SPACE, and the same division in the four-record space of the '
      + 'previous point would give 1/4 for this same event.',
    given: 'e/n',
    variables: EVENT_SIZES_AND_THE_SPACE,
    // 3/8.
    //
    // THE SAME EXPRESSION AS THE PREVIOUS TASK AT A DIFFERENT SUBSTITUTION, and
    // the pair is the derivation rather than a repetition: one outcome, then
    // three of them added. 3/8 is also the number the next point's wrong answer
    // of 1/4 is measured against — over a common denominator 2/8 against 3/8 —
    // so this is the task whose answer the concept's central argument turns on.
    reference: '3/8',
    at: { e: '3', n: '8' },
  },
  {
    id: 'add-two-events-with-no-outcome-in-common-1',
    knowledgePointId:
      'equal-likelihood-is-a-property-of-the-space-and-is-what-licenses-dividing',
    kind: 'evaluate',
    prompt:
      '"At least two heads" is "exactly two heads" or "exactly three heads", and no sequence is '
      + 'both — {HHT, HTH, THH} and {HHH} share no outcome. So the second condition applies '
      + 'directly and the two probabilities add, with no correction of any kind. Evaluate e/n + '
      + 'f/n at e = 3, f = 1, n = 8. Write the answer as a single number rather than leaving the '
      + 'sum unadded, and check it against counting the union directly: the union holds four of '
      + 'the eight sequences.',
    given: 'e/n + f/n',
    variables: EVENT_SIZES_AND_THE_SPACE,
    // 3/8 + 1/8 = 4/8 = 1/2.
    //
    // WRITTEN AS TWO FRACTIONS RATHER THAN `(e + f)/n`, because the sum of two
    // PROBABILITIES is what the condition on additivity is about. Collecting the
    // numerator would have shown a count being added, which is true and is the
    // previous point's move, and would have hidden the one being learned here.
    //
    // THE EVENT IS THE ONE THE THIRD POINT CALLS B, so this answer of 1/2 is
    // P(B) there. That is the only quantity shared across the two points and it
    // is shared on purpose: the third point's whole difficulty is that its two
    // events overlap, and it opens with one whose probability was computed here
    // by the rule that no longer applies.
    reference: '1/2',
    at: { e: '3', f: '1', n: '8' },
  },
  {
    id: 'repair-a-union-whose-events-overlap-1',
    knowledgePointId:
      'a-complement-subtracts-from-one-and-an-overlap-is-subtracted-exactly-once',
    kind: 'evaluate',
    prompt:
      'Let A be "the first toss is heads" — {HHH, HHT, HTH, HTT}, four outcomes — and B be "at '
      + 'least two heads" — {HHH, HHT, HTH, THH}, also four. They OVERLAP in {HHH, HHT, HTH}, '
      + 'three outcomes, so adding P(A) and P(B) is not licensed: that gives 1/2 + 1/2 = 1, which '
      + 'claims the union is certain when THT, TTH and TTT are in neither event. Each of the '
      + 'three shared outcomes was counted twice, so one copy of the overlap comes off. Evaluate '
      + 'a/n + b/n - c/n at a = 4, b = 4, c = 3, n = 8, and compare it with listing the union: '
      + '{HHH, HHT, HTH, HTT, THH} is five of the eight.',
    given: 'a/n + b/n - c/n',
    variables: TWO_EVENTS_THEIR_OVERLAP_AND_THE_SPACE,
    // 4/8 + 4/8 − 3/8 = 5/8, which is the listed union's 5 outcomes over 8.
    //
    // THE UNCORRECTED SUM IS EXACTLY 1 AND THAT IS WHY THIS PAIR OF EVENTS WAS
    // CHOSEN. A sum that is merely too large invites "the rule gives a slightly
    // different number"; a sum of 1 claims certainty, and three of the eight
    // sequences are visibly outside the union. The fault refutes itself against
    // the list, which is a stronger lesson than the correction agreeing with it.
    //
    // THE CHECK IN THE PROMPT IS INDEPENDENT. Listing the union and counting five
    // never adds or subtracts an overlap, so an error in the alternating
    // expression could not survive into it — unlike a check that rearranges the
    // same three terms, which would confirm arithmetic and nothing else.
    reference: '5/8',
    at: { a: '4', b: '4', c: '3', n: '8' },
  },
  {
    id: 'count-how-many-times-a-shared-outcome-is-counted-1',
    knowledgePointId:
      'a-complement-subtracts-from-one-and-an-overlap-is-subtracted-exactly-once',
    kind: 'evaluate',
    prompt:
      'Why exactly one subtraction, rather than a number to be remembered? Follow a single '
      + 'outcome through the three terms. HHH is in A, so P(A) counts it once. It is in B, so '
      + 'P(B) counts it once as well. It is in the overlap, so subtracting P(A and B) removes it '
      + 'once. Evaluate p + q - r at p = 1, q = 1, r = 1. Your answer is a NUMBER OF TIMES and '
      + 'not a probability, and it is the reason the rule is right: the union needs each of its '
      + 'outcomes counted once, and a second subtraction would take this one to zero.',
    given: 'p + q - r',
    variables: HOW_MANY_TIMES_AN_OUTCOME_IS_COUNTED,
    // 1 + 1 − 1 = 1, the net multiplicity of an outcome lying in both events.
    //
    // THE ANSWER IS THE JUSTIFICATION AND NOT MERELY CONSISTENT WITH IT, which is
    // the role `tier-multiplicity` plays in the subject above and the nearest
    // thing this build has to a `justify`. Asked at (1, 1, 1) because that is the
    // case the repair exists for; (1, 0, 0) and (0, 0, 0) are in the worked
    // example and would grade nothing.
    //
    // AN INTEGER REFERENCE IN A RUN OF PROBABILITIES, AND IT COLLIDES
    // NUMERICALLY WITH THE FAULT IN THE PREVIOUS TASK'S PROMPT — the uncorrected
    // sum there is also 1. The collision is numerical only: that 1 is a
    // probability claiming certainty and this one is a count of times, and the
    // prompt names the difference rather than relying on the reader to see it.
    reference: '1',
    at: { p: '1', q: '1', r: '1' },
  },
  {
    id: 'take-a-complement-when-the-event-is-nearly-everything-1',
    knowledgePointId:
      'a-complement-subtracts-from-one-and-an-overlap-is-subtracted-exactly-once',
    kind: 'evaluate',
    prompt:
      '"At least one head" holds for every one of the eight sequences except TTT, so listing its '
      + 'seven outcomes is work for nothing. Its complement — "no heads at all" — is the single '
      + 'outcome {TTT}. The two events have no outcome in common and together they are the whole '
      + 'space, so their probabilities add to 1, which is the same two conditions as the previous '
      + 'point used in the direction that saves effort. Evaluate 1 - c/n at c = 1, n = 8, where c '
      + 'is the size of the COMPLEMENT.',
    given: '1 - c/n',
    variables: THE_COMPLEMENT_AND_THE_SPACE,
    // 1 − 1/8 = 7/8.
    //
    // THE LITERAL 1 IS P(OF THE WHOLE SPACE) AND IS NOT A SUBSTITUTED SYMBOL,
    // which is what `THE_COMPLEMENT_AND_THE_SPACE` exists to say: it is a
    // condition rather than a quantity of this problem, and a symbol there would
    // have implied it could be something else.
    //
    // `c` IS THE COMPLEMENT'S SIZE RATHER THAN THE EVENT'S, which is the saving
    // itself. The expression is worth reaching for precisely when `c` is small
    // and `n - c` is not, so the task asks for the cheap half — and the saving
    // grows with the space, where an event of 99 outcomes out of 100 is one
    // subtraction away from an event of one.
    reference: '7/8',
    at: { c: '1', n: '8' },
  },
  // ── chance-and-events, forty-sixth promotion: counting-probability
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact arithmetic with no worker. Both neighbouring subjects hold that
  // property and the reason is the same: a subject whose prerequisites are a
  // list and a count sits low enough that a worker outage must not wall it off.
  //
  // THE REFERENCE CHECK IS THE CONCEPT ABOVE'S WITH A DIFFERENT DENOMINATOR, and
  // it is tighter than the integer check `counting-and-arrangements` could use.
  // SIX of the nine are probabilities and every one is k/220 in lowest terms with
  // k a whole number between 0 and 220 — 1/22 is 10/220, 21/44 is 105/220, 37/44
  // is 185/220, 5/11 is 100/220 — because every probability here is a count of
  // favourable committees over the 220 committees that exist. The THREE that are
  // not probabilities are the size of the space, one favourable count and the
  // partition total, which is exactly the set of answers that count something,
  // and it is the assertable form of this concept's boundary against the counting
  // subject: a fourth count-only task would mean a count was being asked for its
  // own sake.
  //
  //     (a*b*c)/d           an unordered count: the ordered one over its orderings
  //     e/n                 a favourable count over the size of the space
  //     (a*b*c)/(d*e*f)     the same probability with BOTH counts left ordered
  //     a*((b*c)/d)         one selection count per type, multiplied
  //     a + b + c + d       four cases of a partition, which must return the space
  //     1 - c/n             a complement taken AFTER dividing
  //     (a + b - c)/n       an overlap repaired on the COUNTS, divided once
  //     (n - c)/n           the same union by its complement, repaired BEFORE dividing
  //
  // THREE PAIRS AGREE ON PURPOSE, which is three more than usual and is why each
  // is commented where it sits rather than once here. A reference appearing twice
  // is normally a duplicate; each of these is the content of its point, and no
  // pair is two tasks of the same shape — 1/22 by an unordered route and an
  // ordered one, 220 as a space size and as a partition total, 5/11 by
  // inclusion–exclusion and by a complement that handles no overlap at all.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine. The reasons are in ontology-chance.ts;
  // the one worth repeating is that no denominator is ever a declared variable
  // that could be zero — it is the 220 of the space, or 2 or 6 orderings. And no
  // task asks for lowest terms: `maxDenominatorDegree` bounds a DEGREE rather
  // than a denominator, so `105/220` cannot be refused in favour of `21/44`, and
  // `exactValue` rules both correct, which is the right ruling for an `evaluate`.
  {
    id: 'size-the-space-of-committees-by-one-selection-count-1',
    knowledgePointId: 'one-convention-has-to-serve-both-counts-because-the-orderings-cancel',
    kind: 'evaluate',
    prompt:
      'A club has 12 members and three of them are drawn by lot to form a committee — all three '
      + 'at once, so nobody is drawn twice and the order they come out in is not recorded. One '
      + 'outcome is therefore a SET of three members: {Ann, Bob, Cleo} is one outcome and not '
      + 'six. How many outcomes are there? This is `counting-principles` and not new work: in '
      + 'order there are 12 × 11 × 10 ways to draw three members, every committee was reached '
      + 'once for each of its 3! = 6 orderings, and that 6 is the same for every committee. '
      + 'Evaluate (a*b*c)/d at a = 12, b = 11, c = 10, d = 6.',
    given: '(a*b*c)/d',
    variables: SELECTION_COUNT_FACTORS,
    // (12 × 11 × 10)/6 = 1320/6 = 220.
    //
    // THE SPACE IS COUNTED ONCE AND EVERY PROBABILITY IN THE CONCEPT DIVIDES BY
    // THIS NUMBER, which is the opposite of the concept above, where the space was
    // small enough to print and the first task's job was to confirm the length of a
    // list the prompt had already shown. Here the list cannot be shown, and that is
    // the whole reason this concept exists — 220 is cheap to compute and would take
    // a page to write out.
    //
    // 220 IS ALSO THE PARTITION TOTAL IN THE SECOND POINT, where `a + b + c + d`
    // at (35, 105, 70, 10) must come back to it. The agreement is that audit's
    // content. What keeps the pair from reading as one task duplicated is the
    // SHAPE and not the arity — both expressions take four letters, and one
    // divides a product by the orderings of a selection where the other only
    // adds.
    reference: '220',
    at: { a: '12', b: '11', c: '10', d: '6' },
  },
  {
    id: 'divide-a-counted-event-by-a-counted-space-1',
    knowledgePointId: 'one-convention-has-to-serve-both-counts-because-the-orderings-cancel',
    kind: 'evaluate',
    prompt:
      'Five of the 12 members joined this year. The event "all three drawn are new members" '
      + 'holds exactly the committees made up from those 5, and it is counted the SAME way the '
      + 'space was: 5 × 4 × 3 = 60 in order, each such committee reached 6 times, so 60/6 = 10 '
      + 'of them. Drawing by lot makes the 220 committees equally likely, which is a claim about '
      + 'the space and is what licenses dividing at all. Evaluate e/n at e = 10, n = 220.',
    given: 'e/n',
    variables: A_COUNTED_EVENT_AND_A_COUNTED_SPACE,
    // 10/220 = 1/22.
    //
    // P(E) = |E| / |S| UNCHANGED, WITH BOTH INPUTS PRODUCED RATHER THAN READ.
    // That is the only thing this point adds to the concept above, and it is why
    // the prompt restates the equal-likelihood hypothesis rather than citing it:
    // the formula still carries a condition that nothing in its notation shows,
    // and a bigger space does not make the condition weaker.
    //
    // THE ANSWER IS THE NEXT TASK'S ANSWER, by a different route, and that pair is
    // the point's claim rather than a repetition.
    reference: '1/22',
    at: { e: '10', n: '220' },
  },
  {
    id: 'reach-the-same-probability-with-both-counts-ordered-1',
    knowledgePointId: 'one-convention-has-to-serve-both-counts-because-the-orderings-cancel',
    kind: 'evaluate',
    prompt:
      'Now do the same probability without ever dividing out an ordering. The space is the '
      + '12 × 11 × 10 ordered draws and the event is the 5 × 4 × 3 ordered draws of three new '
      + 'members, so the probability is one of those over the other. Evaluate (a*b*c)/(d*e*f) at '
      + 'a = 5, b = 4, c = 3, d = 12, e = 11, f = 10. You should get the previous task\'s '
      + 'answer — and before simplifying, look for the factor the numerator and the denominator '
      + 'have in common and say where it came from.',
    given: '(a*b*c)/(d*e*f)',
    variables: ORDERED_EVENT_AND_ORDERED_SPACE,
    // 60/1320 = 1/22, the same as 10/220.
    //
    // TWO TASKS WITH ONE REFERENCE, WHICH IS NORMALLY A DUPLICATE AND HERE IS THE
    // POINT'S WHOLE CLAIM. The 3! = 6 orderings of one committee divide BOTH
    // counts — the same 6 in each, because every committee of three has exactly
    // six orderings — and a common factor in a ratio cancels. So the convention is
    // free, and a learner who has computed 1/22 twice has watched it be free
    // rather than been told.
    //
    // SIX FACTORS AND NO DIVISOR, which is what makes the cancellation findable.
    // Asked as `p/q` at (60, 1320) it would be one division of two numbers
    // somebody else produced, and the shared factor would be a fact about 60 and
    // 1320 rather than about orderings.
    //
    // THIS IS ALSO THE SUBSTITUTE FOR A `justify` THAT CANNOT BE RULED. The ask is
    // "say why the orderings divide out", and the answer to that is an argument;
    // what is rulable is the pair of numbers it predicts, so the agreement is set
    // as the task and the argument is in the worked example.
    reference: '1/22',
    at: { a: '5', b: '4', c: '3', d: '12', e: '11', f: '10' },
  },
  {
    id: 'multiply-one-selection-count-per-type-1',
    knowledgePointId: 'the-favourable-count-is-a-product-of-one-selection-count-per-type',
    kind: 'evaluate',
    prompt:
      'Same club: 12 members, 5 new and 7 who joined earlier, three drawn by lot. Count the '
      + 'committees holding exactly ONE new member. The phrase describes the whole committee — '
      + 'one of the 5 new AND two of the 7 older, since there are three places — so the count is '
      + 'a product of one selection count per type: 5 ways to pick the new member, and (7 × 6)/2 '
      + '= 21 ways to pick two older ones. The product rule is licensed because the 21 is the '
      + 'same whichever new member was picked; the two types are drawn from different people, so '
      + 'the second choice never sees the first. Evaluate a*((b*c)/d) at a = 5, b = 7, c = 6, '
      + 'd = 2.',
    given: 'a*((b*c)/d)',
    variables: ONE_SELECTION_COUNT_PER_TYPE,
    // 5 × ((7 × 6)/2) = 5 × 21 = 105.
    //
    // THE BRACKETS ARE THE STRUCTURE. `a` is C(5, 1), which is the bare pool
    // because a descending product of one factor has 1! to divide by, and
    // `(b*c)/d` is C(7, 2) with its own orderings taken out. Written flat as
    // `a*b*c/d` the same value arrives as one four-factor product, which is what a
    // learner who has not separated the types writes — and the separation is the
    // knowledge point.
    //
    // THE CONDITION IS IN THE PROMPT RATHER THAN USED SILENTLY, because this is
    // the instance where it holds for a reason stronger than the rule needs: the
    // SET of older members never changes either, where the rule would be satisfied
    // by the count holding still while the set moved. That distinction is
    // `counting-principles`' first point and the prompt names it so this task
    // cannot read as a formula being filled in.
    reference: '105',
    at: { a: '5', b: '7', c: '6', d: '2' },
  },
  {
    id: 'divide-the-two-type-count-by-the-space-1',
    knowledgePointId: 'the-favourable-count-is-a-product-of-one-selection-count-per-type',
    kind: 'evaluate',
    prompt:
      '105 of the committees hold exactly one new member, and there are 220 committees '
      + 'altogether. Both counts are unordered and the draw is by lot, so the division is '
      + 'licensed by the same hypothesis as before. Evaluate e/n at e = 105, n = 220. Notice '
      + 'what this point did and did not touch: the 220 was counted once, in the point above, '
      + 'and every probability in this concept divides by it.',
    given: 'e/n',
    variables: A_COUNTED_EVENT_AND_A_COUNTED_SPACE,
    // 105/220 = 21/44, a little under a half.
    //
    // THE SAME EXPRESSION AS THE FIRST POINT'S SECOND TASK AT A DIFFERENT
    // SUBSTITUTION, which is the device `OPTION_COUNTS` uses across a point
    // boundary in the counting subject. There the pair contrasts a pool that holds
    // still with one that shrinks; here it contrasts a numerator read off one
    // selection count with one built from two, and the denominator is identical
    // because the space is the same space. The references differ, so the pair
    // cannot read as one task twice.
    //
    // THIS IS ONE VALUE OF A HYPERGEOMETRIC PROBABILITY AND IS NOT CALLED ONE. A
    // distribution is a function of how many new members you ask for;
    // `discrete-distributions` is five nodes up this area and needs
    // `random-variables` first, because what it is about is the function rather
    // than any of its values.
    reference: '21/44',
    at: { e: '105', n: '220' },
  },
  {
    id: 'audit-the-four-cases-against-the-size-of-the-space-1',
    knowledgePointId: 'the-favourable-count-is-a-product-of-one-selection-count-per-type',
    kind: 'evaluate',
    prompt:
      'A committee holds 0, 1, 2 or 3 new members and exactly one of those, so the four cases '
      + 'are a partition of the 220. Count each the same way: no new members is (7 × 6 × 5)/6 = '
      + '35; one is the 105 above; two is (5 × 4)/2 = 10 pairs of new members times 7 older, so '
      + '70; three is (5 × 4 × 3)/6 = 10. Evaluate a + b + c + d at a = 35, b = 105, c = 70, '
      + 'd = 10. Your answer has to come back to the size of the space, or the four cases were '
      + 'not a partition of it — and this is the only check available when an event is too large '
      + 'to list.',
    given: 'a + b + c + d',
    variables: CASE_COUNTS_OF_A_PARTITION,
    // 35 + 105 + 70 + 10 = 220, which is the first point's first answer.
    //
    // THE SHARED REFERENCE IS THE CONTENT, the device ontology-sets.ts introduced
    // and both neighbouring subjects reused with 8 and with 84. The first answer
    // is the size of the space and this one is the same space counted by how many
    // new members a committee holds, so the agreement is what makes the four
    // numbers a partition rather than four separately plausible counts. A single
    // wrong factor in any one case breaks the total and nothing else would have
    // caught it.
    //
    // THE INEQUALITY OF THE FOUR ADDENDS MEANS NOTHING HERE, which is worth saying
    // because in `sample-spaces` the corresponding 1, 3, 3, 1 was the whole
    // argument: there the four numbers were the sizes of the OUTCOMES of a coarser
    // space, so their inequality made that space unequally likely. These four are
    // counts of equally likely committees in one space, and 35 ≠ 105 says only
    // that one case is commoner than another.
    reference: '220',
    at: { a: '35', b: '105', c: '70', d: '10' },
  },
  {
    id: 'take-the-complement-of-a-counted-event-after-dividing-1',
    knowledgePointId: 'a-complement-or-an-overlap-is-repaired-on-the-counts-then-divided-once',
    kind: 'evaluate',
    prompt:
      'Find the probability that the committee includes at least one new member. Counting that '
      + 'directly means adding three of the four cases; its complement is "no new members at '
      + 'all", which is one count — a committee drawn from the 7 older members alone, '
      + '(7 × 6 × 5)/6 = 35, the same 35 the audit above produced. The event and its complement '
      + 'share no outcome and together are the whole space, so their probabilities add to 1. '
      + 'Evaluate 1 - c/n at c = 35, n = 220, where c is the size of the COMPLEMENT.',
    given: '1 - c/n',
    variables: A_COMPLEMENT_COUNT_AND_THE_SPACE,
    // 1 − 35/220 = 1 − 7/44 = 37/44.
    //
    // THE CONCEPT ABOVE'S EXPRESSION RE-ASKED, DELIBERATELY. `1 - c/n` is also
    // `take-a-complement-when-the-event-is-nearly-everything-1`, at (1, 8) there
    // and (35, 220) here, and re-asking it is the honest move rather than a lazy
    // one: the rule really is unchanged and the only thing that moved is where the
    // complement's size came from. There it was the single outcome TTT, read off a
    // printed list of eight. Here it is C(7, 3) and had to be counted, which is
    // this whole concept in one substitution.
    //
    // THE SAVING IS IN THE COUNTING AND NOT IN THE DIVISION, which the next task
    // but one makes explicit by taking the same kind of complement BEFORE
    // dividing. One count instead of three is the whole of it.
    reference: '37/44',
    at: { c: '35', n: '220' },
  },
  {
    id: 'repair-an-overlapping-count-then-divide-once-1',
    knowledgePointId: 'a-complement-or-an-overlap-is-repaired-on-the-counts-then-divided-once',
    kind: 'evaluate',
    prompt:
      'Let A be "Ann is on the committee" and B be "Bob is on the committee", for two particular '
      + 'members. Fixing Ann in one place and choosing the other two from the remaining 11 gives '
      + '|A| = (11 × 10)/2 = 55, and |B| = 55 the same way. They OVERLAP: fixing both and '
      + 'choosing one more from the other 10 gives 10 committees holding each of them. Adding '
      + '55 + 55 would count those 10 twice, once as a committee with Ann and once as a '
      + 'committee with Bob, so one copy of the overlap comes off — and then there is exactly '
      + 'one division, at the end. Evaluate (a + b - c)/n at a = 55, b = 55, c = 10, n = 220.',
    given: '(a + b - c)/n',
    variables: OVERLAPPING_COUNTS_AND_THE_SPACE,
    // (55 + 55 − 10)/220 = 100/220 = 5/11.
    //
    // COLLECTED OVER ONE DENOMINATOR, AND THE CONCEPT ABOVE REFUSES EXACTLY THAT.
    // Its `a/n + b/n - c/n` shows three separate probabilities because its lesson
    // is that the two probabilities could not be ADDED in the first place. Here the
    // lesson is the opposite: inclusion–exclusion is `counting-principles`' repair
    // to the COUNTS and it is finished before any probability exists, so the
    // expression has to show one division rather than three. The two forms are the
    // two concepts' boundary written in a denominator.
    //
    // 55/220 = 1/4 IS A CHECK THE PROMPT LEAVES AVAILABLE. Three seats among twelve
    // members is exactly a quarter, so a learner who miscounts |A| has a cheap way
    // to notice. Not asked as its own task, because the answer would be the
    // division the first point already drilled.
    reference: '5/11',
    at: { a: '55', b: '55', c: '10', n: '220' },
  },
  {
    id: 'reach-the-same-union-by-the-count-that-handles-no-overlap-1',
    knowledgePointId: 'a-complement-or-an-overlap-is-repaired-on-the-counts-then-divided-once',
    kind: 'evaluate',
    prompt:
      'Check that answer by a route that never handles an overlap. A committee is in neither A '
      + 'nor B exactly when it excludes both Ann and Bob, so it is drawn from the other 10 '
      + 'members: (10 × 9 × 8)/6 = 120 of them. Take that from the space and divide. Evaluate '
      + '(n - c)/n at c = 120, n = 220. You should get the previous task\'s answer — and notice '
      + 'that this time the complement was subtracted BEFORE the division rather than after, '
      + 'which is the same thing because dividing is the last step either way.',
    given: '(n - c)/n',
    variables: A_COMPLEMENT_COUNT_AND_THE_SPACE,
    // (220 − 120)/220 = 100/220 = 5/11, the same as the task above.
    //
    // A GENUINELY INDEPENDENT CHECK, which is why it is a task rather than a line
    // in the prompt above. It adds nothing and subtracts no overlap, so a wrong
    // overlap in the alternating expression could not have survived into it —
    // unlike a check that rearranges the same three terms, which would confirm
    // arithmetic and nothing else. The concept above makes the same point about
    // listing a union, with the check inside a prompt because its space was small
    // enough to list; here the check is a second counting argument and so is worth
    // doing.
    //
    // IT ALSO PAIRS WITH `1 - c/n` TWO TASKS BACK, same list and same quantities,
    // complement taken on the other side of the division. Together they say that
    // may be done either way, which is a fact rather than a presentation choice.
    reference: '5/11',
    at: { c: '120', n: '220' },
  },

  // ── chance-and-events, forty-seventh promotion: conditional-probability
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact arithmetic with no worker — the property both concepts below hold
  // and for the same reason, which is that a subject sitting this low must not
  // be walled off by a worker outage.
  //
  // THE REFERENCE CHECK IS THE CONCEPT BELOW'S WITH THE DENOMINATOR TAKEN AWAY,
  // AND THAT IS THIS CONCEPT'S BOUNDARY MADE ARITHMETIC. There every one of the
  // nine answers was a count of committees or a count of committees over the
  // 220 there are, so `220 x reference` was a whole number for all six
  // probabilities and the other three were counts. Here:
  //
  //  - NOT ONE of the nine is a count. All nine references lie in [0, 1], where
  //    the concept below had exactly three outside it. Nothing in this concept
  //    asks how many of something there are, because every count it uses is
  //    supplied in the prompt as the concept below's work. A tenth task
  //    answering with a count would mean a count was being asked for its own
  //    sake, in a concept whose only move is choosing a denominator.
  //  - FOUR of the nine have `220 x reference` whole and FIVE do not, and the
  //    split is not arbitrary: the four are the ones still asked inside the
  //    220-committee space — 6/55, 6/55, 3/5 and the 1/22 the chain reproduces —
  //    and the five are asked in a space that is not the committee draw at all:
  //    an ordered run of three (1320), a pair (66), a draw WITH replacement
  //    (144), and two products of probabilities which are not event counts over
  //    anything (16, 968). That is "conditioning replaces the space" as a
  //    property of the answers.
  //
  //     k/m                 the overlap over the CONDITION, not over the space
  //     (k/n)/(m/n)         the same conditional as a ratio of two probabilities
  //     (a/p)*(b/q)*(c/r)   one conditional factor per draw, each over what is left
  //     (a/p)*(b/q) + (c/p)*(d/q)   two paths: multiply along, add across
  //     (a/n)*(b/n)         the independence test's right-hand side
  //     (a/p)*(a/p)         the same factor twice, which is what independence looks like
  //
  // THREE PAIRS SHARE AN EXPRESSION AT TWO SUBSTITUTIONS and no pair shares a
  // reference, which is the opposite of the concept below — there three pairs
  // AGREED on purpose and the agreement was the content. Here the content is
  // that moving one number changes the answer: `k/m` at (6, 55) and (6, 10) is
  // the asymmetry of conditioning, `(a/p)*(b/q)*(c/r)` at a third factor of
  // 3/10 and 7/10 is the conditioning tracking WHICH type left, and `(a/n)*(b/n)`
  // at (55, 55) and (10, 35) is the independence test failing in two different
  // ways. Each is commented where it sits.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine, for the reasons ontology-chance.ts
  // gives twice already. The one worth repeating here is that no denominator is
  // a declared variable that could be zero: every one is a pool size, an event
  // count given in the prompt, or the size of the space.
  {
    id: 'divide-the-overlap-by-the-condition-1',
    knowledgePointId: 'conditioning-replaces-the-space-so-the-denominator-is-the-condition',
    kind: 'evaluate',
    prompt:
      'The club again: 12 members, 5 of them new, three drawn by lot, so the 220 possible '
      + 'committees are equally likely. Ann is one of the 5 new members, and you are TOLD that '
      + 'she is on the committee. That rules out every committee without her and says nothing '
      + 'to separate the ones left, so the space to work in is the (11 × 10)/2 = 55 committees '
      + 'containing Ann, still equally likely among themselves. Of those, the all-new ones are '
      + 'the ones whose other two members come from the remaining 4 new members: (4 × 3)/2 = 6. '
      + 'Evaluate k/m at k = 6, m = 55, where k is the OVERLAP and m is the CONDITION.',
    given: 'k/m',
    variables: AN_OVERLAP_AND_A_CONDITION,
    // 6/55.
    //
    // THE DENOMINATOR IS NOT 220 AND THAT IS THE WHOLE TASK. `e/n` in the concept
    // below divides by the size of the space in every single one of its
    // probabilities; the first thing this concept does is divide by something
    // else. The letters were changed for that reason — see
    // `AN_OVERLAP_AND_A_CONDITION` — because reusing `e/n` would have said the
    // two denominators were the same kind of number.
    //
    // 6/55 AGAINST THE UNCONDITIONAL 1/22 is the comparison the prompt sets up
    // and the worked example makes: 12/110 against 5/110, so the information
    // more than doubled the probability. Not asked as its own task, because the
    // unconditional 1/22 is the concept below's second task already.
    reference: '6/55',
    at: { k: '6', m: '55' },
  },
  {
    id: 'reach-the-conditional-as-a-ratio-of-two-probabilities-1',
    knowledgePointId: 'conditioning-replaces-the-space-so-the-denominator-is-the-condition',
    kind: 'evaluate',
    prompt:
      'Now get that same conditional probability without ever restricting the space. Stay in '
      + 'the 220 committees: the probability of "all three new AND Ann on it" is 6/220, and the '
      + 'probability of "Ann on it" is 55/220. The definition says to divide the first by the '
      + 'second. Evaluate (k/n)/(m/n) at k = 6, m = 55, n = 220 — and before simplifying, say '
      + 'which number appears in both halves and what becomes of it.',
    given: '(k/n)/(m/n)',
    variables: AN_OVERLAP_A_CONDITION_AND_THE_OLD_SPACE,
    // (6/220)/(55/220) = 6/55, the previous task's answer.
    //
    // TWO TASKS, ONE ANSWER, AND HERE THAT IS NOT AN AGREEMENT BETWEEN TWO
    // METHODS BUT A DEMONSTRATION THAT THERE IS ONLY ONE. |A and B| / |B| and
    // P(A and B) / P(B) differ by dividing both counts by `n`, and a common
    // factor in a ratio cancels — so the two ways the definition gets written
    // are one statement, and a learner who has computed both has watched the old
    // space leave rather than been told it does.
    //
    // THE NESTED DIVISION IS THE POINT AND `p/q` AT (3/110, 1/4) WOULD NOT DO.
    // The content is that the SAME `n` is in both halves; two pre-divided
    // fractions would hide where it went. Same device as
    // `(a*b*c)/(d*e*f)` in the concept below, where what cancels is a factorial
    // instead of a space.
    //
    // AND THIS IS THE FORM THAT OUTLIVES THE SUBJECT. It never mentions
    // counting, so it still says something when the outcomes are not equally
    // likely and there is nothing to count — which is why the material gives it
    // rather than only the counts.
    reference: '6/55',
    at: { k: '6', m: '55', n: '220' },
  },
  {
    id: 'swap-the-condition-and-get-a-different-number-1',
    knowledgePointId: 'conditioning-replaces-the-space-so-the-denominator-is-the-condition',
    kind: 'evaluate',
    prompt:
      'Same club, same 6 committees that are both all-new and contain Ann, but ask the question '
      + 'the other way round: given that all three members are NEW, how likely is it that Ann '
      + 'is one of them? The condition is now "all three new", which holds (5 × 4 × 3)/6 = 10 '
      + 'committees. Evaluate k/m at k = 6, m = 10. Check it against the committee rather than '
      + 'the formula: if all three are new then three of the 5 new members are on it.',
    given: 'k/m',
    variables: AN_OVERLAP_AND_A_CONDITION,
    // 6/10 = 3/5, and 3 of the 5 new members being on the committee gives 3/5
    // directly, which is the check the prompt asks for.
    //
    // THE SAME EXPRESSION AND THE SAME NUMERATOR AS THE FIRST TASK, WITH ONLY
    // THE DENOMINATOR MOVED, which is the asymmetry of conditioning made
    // arithmetic. 3/5 against 6/55 is not a small discrepancy and the two are
    // not approximations of each other — and the reason is visible in the `at`:
    // `k` did not change.
    //
    // Reading P(A|B) for P(B|A) is the single most consequential confusion in
    // the subject, and `bayes-theorem` declares an `interferes_with` edge
    // against this concept saying so. That node is about getting one from the
    // other through the base rate when the overlap is NOT in hand; this task is
    // about the two being different numbers when it is, which is the fact the
    // formula is for.
    reference: '3/5',
    at: { k: '6', m: '10' },
  },
  {
    id: 'multiply-one-conditional-factor-per-draw-1',
    knowledgePointId: 'a-sequence-of-draws-multiplies-one-conditional-factor-per-step',
    kind: 'evaluate',
    prompt:
      'The same twelve members, 5 of them new, but now drawn ONE AT A TIME and kept out once '
      + 'drawn. Find the probability that all three drawn are new, as a product of one factor '
      + 'per draw. The first factor is unconditional: 5 of 12. After a new member is out, 11 '
      + 'remain and 4 of them are new; after two are out, 10 remain and 3 are new. Evaluate '
      + '(a/p)*(b/q)*(c/r) at a = 5, p = 12, b = 4, q = 11, c = 3, r = 10. You should get the '
      + 'answer the simultaneous draw gave.',
    given: '(a/p)*(b/q)*(c/r)',
    variables: A_POOL_AND_A_DRAW_PER_STEP,
    // (5/12) × (4/11) × (3/10) = 60/1320 = 1/22.
    //
    // THE FIRST TASK IN THE SUBJECT THAT MULTIPLIES TWO PROBABILITIES, and the
    // two concepts below draw everything simultaneously precisely so that they
    // never have to. Their every draw is "three members at once, by lot" for
    // this reason, which is stated in both files as a boundary rather than a
    // presentation choice.
    //
    // 1/22 IS THE CONCEPT BELOW'S ANSWER REACHED WITHOUT COUNTING ANYTHING, and
    // the agreement is a check rather than a repetition — it is the only task in
    // this concept whose reference is a count of committees over 220, and it got
    // there by a route with no committees in it. A disagreement would mean one of
    // the conditional factors was wrong. The two experiments record different
    // things, and they agree on this probability because the 3! orderings divide
    // both of that concept's counts, which is its own first knowledge point
    // arriving here as an audit.
    //
    // SIX LETTERS IN THREE PAIRS RATHER THAN `(a*b*c)/(d*e*f)` AT THE SAME SIX
    // NUMBERS. That expression has the same value and is in the concept below,
    // where it is ONE ratio of two ordered counts; this is THREE probabilities
    // multiplied. Same integers, two different claims, and the brackets carry
    // the difference — which is the boundary device `(a + b - c)/n` against
    // `a/n + b/n - c/n` already used one layer down.
    reference: '1/22',
    at: { a: '5', p: '12', b: '4', q: '11', c: '3', r: '10' },
  },
  {
    id: 'condition-on-which-type-left-not-just-that-one-did-1',
    knowledgePointId: 'a-sequence-of-draws-multiplies-one-conditional-factor-per-step',
    kind: 'evaluate',
    prompt:
      'Same three draws, one at a time, kept out. Now find the probability that the first two '
      + 'drawn are new and the third is NOT — in that order. The first two factors are exactly '
      + 'the ones you just used, 5/12 and 4/11. For the third, two new members are out, so 10 '
      + 'remain of whom 3 are new and 7 are not. Evaluate (a/p)*(b/q)*(c/r) at a = 5, p = 12, '
      + 'b = 4, q = 11, c = 7, r = 10, and notice which of the six numbers you had to change.',
    given: '(a/p)*(b/q)*(c/r)',
    variables: A_POOL_AND_A_DRAW_PER_STEP,
    // (5/12) × (4/11) × (7/10) = 140/1320 = 7/66.
    //
    // THE SAME EXPRESSION AT A SUBSTITUTION THAT MOVES EXACTLY ONE NUMBER, which
    // is what makes it worth asking next to the task above rather than instead
    // of it. Both denominators fall 12, 11, 10 either way, because the pool
    // shrinks whatever type came out; the NUMERATOR is where the conditioning
    // lives, and here it is a count of the other type entirely. A learner who
    // has learned "the numbers go down by one each time" gets the first task
    // right and this one wrong.
    //
    // NOT A COMMITTEE PROBABILITY, UNLIKE THE TASK ABOVE. This event is about
    // the ORDER the members came out in, so it is not an event of the
    // 220-committee space at all and 220 × 7/66 is not a whole number. That is
    // the concept's boundary showing up in an answer: the chain can ask
    // questions the simultaneous draw cannot express, and this is one of them.
    reference: '7/66',
    at: { a: '5', p: '12', b: '4', q: '11', c: '7', r: '10' },
  },
  {
    id: 'multiply-along-two-paths-and-add-across-them-1',
    knowledgePointId: 'a-sequence-of-draws-multiplies-one-conditional-factor-per-step',
    kind: 'evaluate',
    prompt:
      'Two members are now drawn one at a time and kept out. Find the probability that exactly '
      + 'one of the two is new. That happens two ways and no draw can be both: new then older, '
      + 'which is (5/12) × (7/11), or older then new, which is (7/12) × (5/11). The two paths '
      + 'are disjoint events, so their probabilities ADD while each path multiplies. Evaluate '
      + '(a/p)*(b/q) + (c/p)*(d/q) at a = 5, p = 12, b = 7, q = 11, c = 7, d = 5.',
    given: '(a/p)*(b/q) + (c/p)*(d/q)',
    variables: TWO_PATHS_THROUGH_TWO_DRAWS,
    // 35/132 + 35/132 = 70/132 = 35/66.
    //
    // THE PLUS IS THIS CONCEPT'S RULE AND `sample-spaces`' RULE IN ONE
    // EXPRESSION, which is why it is a task and not a line in a prompt.
    // Multiplication runs ALONG a path and addition runs ACROSS paths, and a
    // learner who cannot say which goes where has the one misunderstanding this
    // point exists to catch. The addition is licensed by the paths being
    // disjoint, which is additivity from two concepts down and not a new rule.
    //
    // THE TWO PATHS ARE EQUAL AS A FACT ABOUT THE SHAPE, not a coincidence of
    // these numbers: each is 5 × 7 over 12 × 11 with the factors taken in the
    // other order. The substitution puts (c, d) = (7, 5) against (a, b) = (5, 7)
    // so the swap is visible in the `at` rather than hidden inside two equal
    // values — and it is why the same event can be counted as 2 × 5 × 7 = 70
    // ordered draws out of 12 × 11 = 132.
    //
    // CHECKED THE SIMULTANEOUS WAY TOO: 5 × 7 = 35 of the (12 × 11)/2 = 66 pairs
    // hold one of each. Not asked as its own task, since that division is the
    // concept below's `e/n` and belongs to it.
    reference: '35/66',
    at: { a: '5', p: '12', b: '7', q: '11', c: '7', d: '5' },
  },
  {
    id: 'run-the-independence-test-on-two-events-that-fail-it-1',
    knowledgePointId: 'independence-is-a-product-test-that-has-to-be-computed',
    kind: 'evaluate',
    prompt:
      'Back to the 220 committees drawn by lot. Let A be "Ann is on the committee" and B be '
      + '"Bob is on the committee", and recall the counts: 55 committees hold Ann, 55 hold Bob, '
      + 'and 10 hold both. A and B are independent exactly when P(A and B) = P(A) × P(B), so '
      + 'work out the right-hand side. Evaluate (a/n)*(b/n) at a = 55, b = 55, n = 220. Then '
      + 'compare it with P(A and B) = 10/220 = 1/22 and say what the comparison settles.',
    given: '(a/n)*(b/n)',
    variables: TWO_EVENT_COUNTS_AND_THE_SPACE,
    // (55/220) × (55/220) = (1/4) × (1/4) = 1/16 = 0.0625, against
    // P(A and B) = 1/22 ≈ 0.0455. Not equal, so not independent.
    //
    // THE TEST IS THE TASK AND THE VERDICT IS IN THE PROMPT, which is the honest
    // shape here: "are these independent" is a claim and `evaluate` cannot rule
    // a claim, while P(A) × P(B) is a number. So the rulable half is asked and
    // the comparison is set up for the learner to make — the same move the
    // concept below uses for its partition audit, where the total is the task
    // and "so they partition the space" is the prompt's.
    //
    // 55, 55 AND 10 ARE THE CONCEPT BELOW'S UNION COUNTS, REUSED FOR A QUESTION
    // THAT HAS NOTHING TO DO WITH UNIONS. There they were repaired and divided
    // once to give 5/11; here two of them are divided and multiplied to give
    // 1/16. The same three counts answer a question about ADDING and a question
    // about MULTIPLYING, which is why the variable lists are kept apart.
    //
    // THE DEPENDENCE IS NEGATIVE AND THE MECHANISM IS PLAIN: the committee has
    // three places and Bob occupies one, so P(A given B) = 10/55 = 2/11, which
    // is two places among the other eleven members. That conditional is in the
    // worked example rather than in a task, because `k/m` at (10, 55) would have
    // been a third substitution of an expression already asked twice and the
    // direction of a dependence is not what this point is for.
    reference: '1/16',
    at: { a: '55', b: '55', n: '220' },
  },
  {
    id: 'put-the-member-back-and-watch-the-factors-become-equal-1',
    knowledgePointId: 'independence-is-a-product-test-that-has-to-be-computed',
    kind: 'evaluate',
    prompt:
      'A different mechanism on the same twelve members, 5 of them new. Two are drawn one at a '
      + 'time, but the first is PUT BACK before the second is drawn. So when the second draw '
      + 'happens the pool is the same 12 with the same 5 new, whatever the first draw was: '
      + 'P(second is new given the first was) = 5/12, which is exactly P(second is new). The '
      + 'test passes, so the probability that both are new is one factor times a copy of '
      + 'itself. Evaluate (a/p)*(a/p) at a = 5, p = 12.',
    given: '(a/p)*(a/p)',
    variables: ONE_POOL_DRAWN_TWICE,
    // (5/12) × (5/12) = 25/144.
    //
    // THE REPEATED LETTER IS THE KNOWLEDGE POINT. Two draws, and the expression
    // uses TWO letters where the chain two tasks back needed six — because
    // independence is exactly the case where the second factor is a copy of the
    // first, and a fresh pair of letters per draw is what says the space moved.
    // The count of symbols carries the claim, which is why this has its own
    // variable list rather than a substitution of `A_POOL_AND_A_DRAW_PER_STEP`.
    //
    // AND IT IS THE SAME TWELVE PEOPLE AS THE DEPENDENT CASE. 4/11 = 48/132
    // against 5/12 = 55/132 is the without-replacement version failing the test,
    // and it is in the worked example because the rulable content here is the
    // product that the passing test licenses. One sentence of the description —
    // whether the member goes back — decides which experiment this is, so
    // independence is a fact about the MECHANISM and never about the objects.
    reference: '25/144',
    at: { a: '5', p: '12' },
  },
  {
    id: 'test-two-events-that-cannot-both-happen-1',
    knowledgePointId: 'independence-is-a-product-test-that-has-to-be-computed',
    kind: 'evaluate',
    prompt:
      'The 220 committees again. Let A be "all three members are new", which holds 10 of them, '
      + 'and B be "no member is new", which holds 35. No committee is in both, so P(A and B) is '
      + '0. Work out the other side of the test: evaluate (a/n)*(b/n) at a = 10, b = 35, '
      + 'n = 220. Then say whether two events that cannot both happen are independent, and what '
      + 'knowing that one of them happened tells you about the other.',
    given: '(a/n)*(b/n)',
    variables: TWO_EVENT_COUNTS_AND_THE_SPACE,
    // (10/220) × (35/220) = (1/22) × (7/44) = 7/968 ≈ 0.0072, against
    // P(A and B) = 0. Not equal, so disjoint events are NOT independent.
    //
    // THE ANSWER MATTERS BECAUSE IT IS NOT ZERO, which is the only reason a
    // number this ungainly is worth asking for. Mutually exclusive and
    // independent are routinely treated as the same idea and they point close to
    // opposite ways: being told A happened tells you B is IMPOSSIBLE, which is
    // the most information one event can carry about another. So the test fails
    // as hard as it can, and it fails for every pair of disjoint events with
    // positive probabilities rather than for these two in particular.
    //
    // THE SAME EXPRESSION AS THE TASK TWO BACK, AT A SUBSTITUTION THAT FAILS THE
    // TEST DIFFERENTLY. There P(A and B) = 1/22 against a product of 1/16 —
    // close, and wrong. Here it is 0 against 7/968 — not close, and wrong for a
    // structural reason. One expression, two ways of failing, which is what
    // stops the pair reading as one task twice.
    //
    // THE CONCEPT BELOW USED DISJOINTNESS AS THE CONDITION FOR ADDING, and this
    // task is about multiplying. Its 10 and its 35 are two of the four case
    // counts from its own partition audit, so a learner meets them here having
    // already added them up to 220 — and adding them was licensed by exactly the
    // property that makes this test fail.
    reference: '7/968',
    at: { a: '10', b: '35', n: '220' },
  },

  // ── chance-and-events, forty-eighth promotion: bayes-theorem
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact arithmetic with no worker — the property all three concepts below
  // hold, for the reason they give: a subject sitting this low must not be
  // walled off by a worker outage.
  //
  // THE CLUB IS GONE, AND IT IS THE FIRST CONCEPT IN THE SUBJECT TO DROP IT.
  // Twenty-seven tasks across the three concepts below are all about twelve
  // members and 220 committees, deliberately, so that each new idea arrives on
  // a space the learner already knows. This concept cannot use it and the
  // reason is its boundary rather than a preference: every committee question
  // has a countable overlap, and a reversal is only needed when the overlap
  // CANNOT be counted. A Bayes task set on the club would be a division a
  // learner could do by counting instead, which teaches that the theorem is
  // optional. So the setting is a screening test, where the only data are two
  // rates and a base rate and nothing has been counted at all.
  //
  // THE REFERENCE CHECK IS THEREFORE THE CONCEPT BELOW'S WITH THE SPACE GONE
  // RATHER THAN MOVED. There `220 x reference` was whole four times of nine and
  // that split carried the claim "conditioning replaces the space". Here it is
  // whole for exactly ONE of the nine, and the one is the likelihood ratio 18,
  // which is whole because it is an integer and not because it is a count of
  // anything. So the figure that separated the two concepts below has gone to
  // its floor and stops discriminating, which is said here rather than left for
  // somebody to re-measure: this concept's answers are 2000ths and 13ths, and
  // the committee draw is not in any of them.
  //
  //  - EIGHT of the nine lie in [0, 1] and ONE does not. 18 is an odds ratio
  //    and odds ratios are not probabilities. That is the first reference in
  //    these three subjects outside the interval, it is deliberate, and
  //    tests/concepts-logic.mjs asserts the count is exactly one so that the
  //    exception cannot spread quietly to a task that has no business being
  //    outside it.
  //  - NOT ONE of the nine is a count, which is the one property this concept
  //    shares with the concept below. Every count in the material — 100, 9,900,
  //    90, 495, 585 — is in a worked example as a CHECK on an answer the tasks
  //    reach by dividing probabilities, so no task asks for one.
  //
  //     (s/t)*(a/n)                      an overlap built from a rate and a base rate
  //     (f/g)*((n-a)/n)                  the other overlap, which decides the answer
  //     ((s/t)*(a/n))/(p/q)              the reversal with its denominator supplied
  //     (s/t)*(a/n) + (f/g)*((n-a)/n)    the denominator built: one term per case
  //     ((s/t)*(a/n))/(same sum)         the whole theorem, numerator inside denominator
  //     (s/t)/(f/g)                      the likelihood ratio, with no population in it
  //     (w*a)/(w*a + (n-a))              prior odds times the ratio, converted back
  //     m/(r+m)                          posterior odds read as the COMPLEMENTARY case
  //
  // ONE EXPRESSION IS ASKED TWICE AND THE TWO ANSWERS DIFFER, where the concept
  // below had three such pairs. The whole theorem at a base rate of 1/100 gives
  // 2/13 and at 1/2 gives 18/19, with both test figures held — "a test has no
  // accuracy on its own" as a substitution. One pair rather than three because
  // this concept has one quantity to move and the concept below had three.
  //
  // AND THREE DIFFERENT EXPRESSIONS AGREE ON 2/13, WHICH IS THE MOST ANY
  // CONCEPT IN THESE SUBJECTS HAS AGREED. The concept below had exactly one
  // agreeing pair across two shapes and asserted it as the single exception.
  // Here the definition with the denominator given, the definition with the
  // denominator built, and the odds form all produce 2/13 — because they are
  // three forms of ONE statement, which is what a theorem is as opposed to a
  // method. Nine distinct references would have been this concept's fault, more
  // sharply than it was that one's.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine, for the reasons ontology-chance.ts
  // gives three times already. The one addition this concept makes: `(n-a)` is
  // the first SUBTRACTION inside a denominator in these subjects, and it cannot
  // be zero at any substitution used, because `a < n` in all of them — checked
  // per task rather than argued, since a base rate of 1 would make the second
  // term vanish legitimately but would make nothing undefined.
  {
    id: 'build-the-overlap-from-the-conditional-you-were-given-1',
    knowledgePointId: 'reversing-a-conditional-is-the-definition-written-twice-and-divided',
    kind: 'evaluate',
    prompt:
      'A condition occurs in 1 person in 100. A screening test is positive for 9 in 10 of the '
      + 'people who have it. Nobody has been counted and there is no overlap to look up, so the '
      + 'probability of having the condition AND testing positive has to be built from those two '
      + 'figures — which is the multiplication rule from the concept below, the definition of a '
      + 'conditional probability multiplied through by its condition. Evaluate (s/t)*(a/n) at '
      + 's = 9, t = 10, a = 1, n = 100, where s/t is the rate among people who have it and a/n '
      + 'is the rate at which they occur.',
    given: '(s/t)*(a/n)',
    variables: A_RATE_UNDER_THE_CONDITION_AND_A_BASE_RATE,
    // (9/10) × (1/100) = 9/1000.
    //
    // THE FIRST TASK IN THE SUBJECT WITH NO COUNT ANYWHERE IN IT, which is this
    // concept's boundary in its opening line. The three concepts below all begin
    // from a space somebody could in principle write out; this one begins from
    // two rates and a base rate, and that is exactly the situation in which a
    // reversal is the only route.
    //
    // 9/1000 IS 18/2000 AND THE NEXT TASK IS 99/2000, which is why the overlap
    // is asked for on its own rather than folded into the division. The answer
    // to the concept is that comparison, and a learner who only ever sees
    // 9/1000 inside a fraction never makes it.
    reference: '9/1000',
    at: { s: '9', t: '10', a: '1', n: '100' },
  },
  {
    id: 'build-the-overlap-of-the-case-you-were-not-asked-about-1',
    knowledgePointId: 'reversing-a-conditional-is-the-definition-written-twice-and-divided',
    kind: 'evaluate',
    prompt:
      'The same test is positive for 1 in 20 of the people who do NOT have the condition. Since '
      + '1 person in 100 has it, 99 in 100 do not — so the probability of not having the '
      + 'condition and testing positive anyway is that rate times that group. Evaluate '
      + '(f/g)*((n-a)/n) at f = 1, g = 20, n = 100, a = 1. Then put your answer beside the '
      + '9/1000 from the task before over a common denominator, and say which group supplies '
      + 'most of the positive results.',
    given: '(f/g)*((n-a)/n)',
    variables: A_RATE_UNDER_THE_COMPLEMENT_AND_THE_BASE_RATE,
    // (1/20) × (99/100) = 99/2000, against the previous task's 9/1000 = 18/2000.
    //
    // THIS IS THE TASK THAT ANSWERS THE CONCEPT, and the prompt asks for the
    // comparison because the arithmetic alone does not force anybody to make
    // it. 99/2000 against 18/2000: the false positives outnumber the true ones
    // by more than five to one, even though 1 in 20 is a far smaller rate than
    // 9 in 10, because 99 times as many people sit behind the smaller rate.
    // A learner who has made that comparison will not report 9/10 again.
    //
    // `(n-a)/n` RATHER THAN A SECOND PAIR OF LETTERS, so that the substitution
    // cannot describe two groups that fail to make up the population. The
    // partition is the hypothesis the next point's addition needs, and building
    // it into the expression is cheaper than asserting it in prose.
    reference: '99/2000',
    at: { f: '1', g: '20', n: '100', a: '1' },
  },
  {
    id: 'reverse-the-conditional-with-the-denominator-supplied-1',
    knowledgePointId: 'reversing-a-conditional-is-the-definition-written-twice-and-divided',
    kind: 'evaluate',
    prompt:
      'A positive result arrives by exactly two routes, and you have both: 18/2000 from people '
      + 'with the condition and 99/2000 from people without, so the probability of a positive '
      + 'result at all is 117/2000. Now reverse the conditional — somebody has tested positive, '
      + 'how likely is it they have the condition? Evaluate ((s/t)*(a/n))/(p/q) at s = 9, '
      + 't = 10, a = 1, n = 100, p = 117, q = 2000, and compare the answer with the 9/10 the '
      + 'test\'s own figure would have offered.',
    given: '((s/t)*(a/n))/(p/q)',
    variables: THE_REVERSAL_WITH_ITS_TOTAL_SUPPLIED,
    // (9/1000)/(117/2000) = 18/117 = 2/13 ≈ 0.154.
    //
    // THE DENOMINATOR IS GIVEN AWAY HERE ON PURPOSE and is earned in the second
    // point, which is the division of labour the concept below used for
    // `(k/n)/(m/n)`: perform the reversal first, then ask where the total came
    // from. The full expression with the numerator repeated inside the
    // denominator is four products long, and meeting it before ever having
    // reversed a conditional would make this a rearrangement exercise.
    //
    // 2/13 AGAINST 9/10 IS THE ERROR THE CONCEPT EXISTS FOR, and the prompt asks
    // for the comparison rather than the material asserting it. 9/10 is a true
    // statement about a question nobody asked; what the positive result did do
    // is raise the probability from 1/100 to 2/13, more than fifteenfold, so the
    // test is informative and the result is still far from a diagnosis.
    //
    // THE SAME 2/13 IS REACHED BY TWO OTHER EXPRESSIONS IN THIS CONCEPT and the
    // agreement is the content — see the block above. It is also checked in the
    // worked example by counting 10,000 people, where 90 true positives against
    // 495 false ones give 90/585 = 2/13 with no conditional probability written
    // down anywhere.
    reference: '2/13',
    at: { s: '9', t: '10', a: '1', n: '100', p: '117', q: '2000' },
  },
  {
    id: 'build-the-denominator-as-a-sum-over-the-cases-1',
    knowledgePointId: 'the-denominator-is-a-sum-over-the-cases-so-the-base-rate-enters-three-times',
    kind: 'evaluate',
    prompt:
      'The previous point was handed 117/2000. Earn it. Everybody either has the condition or '
      + 'does not, the two cases have no overlap and together they are everybody, so '
      + '`sample-spaces`\' addition rule applies with no correction term and each case '
      + 'contributes a rate times the size of its group. Evaluate '
      + '(s/t)*(a/n) + (f/g)*((n-a)/n) at s = 9, t = 10, f = 1, g = 20, a = 1, n = 100.',
    given: '(s/t)*(a/n) + (f/g)*((n-a)/n)',
    variables: BOTH_BRANCHES_OF_THE_SPLIT,
    // (9/10)(1/100) + (1/20)(99/100) = 18/2000 + 99/2000 = 117/2000 = 0.0585.
    //
    // THE LAW OF TOTAL PROBABILITY, AND IT IS THE ADDITION RULE AND THE
    // MULTIPLICATION RULE USED ONCE EACH. Both are concepts below — the first in
    // `sample-spaces`' third point and the second in `conditional-probability`'s
    // second — so nothing here is new except the combination, which is why the
    // prompt names the partition hypothesis instead of assuming it.
    //
    // IT IS THE SUM OF THE FIRST POINT'S TWO TASKS, which is the only reason
    // this task is worth asking after those two: the learner has both terms
    // already and the new content is that they are ADDED rather than compared.
    // The worked example checks the split against the complement — the negatives
    // must come to 1883/2000 and do — because a sum over badly chosen cases
    // looks exactly like a sum over good ones.
    reference: '117/2000',
    at: { s: '9', t: '10', f: '1', g: '20', a: '1', n: '100' },
  },
  {
    id: 'assemble-the-whole-theorem-in-one-expression-1',
    knowledgePointId: 'the-denominator-is-a-sum-over-the-cases-so-the-base-rate-enters-three-times',
    kind: 'evaluate',
    prompt:
      'Now the whole thing at once, with nothing supplied: the overlap you want on top, and '
      + 'underneath it the sum of that same overlap and the other one. Evaluate '
      + '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n)) at s = 9, t = 10, f = 1, g = 20, a = 1, '
      + 'n = 100. Before you simplify, count the places the base rate 1/100 appears — counting '
      + 'the 99/100 as one of them.',
    given: '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))',
    variables: BOTH_BRANCHES_OF_THE_SPLIT,
    // 18/117 = 2/13, the same answer as the third task by a route that builds
    // its own denominator.
    //
    // THE NUMERATOR IS ONE OF THE TWO TERMS IN THE DENOMINATOR, which is the
    // structural fact the expression is for and which the prompt's counting
    // question is about. The base rate appears three times — numerator, first
    // denominator term, and as the complement in the second — so it cannot be a
    // correction applied at the end. A quantity above and below a division line
    // does not scale what the division gives; it sets how the two terms below
    // compare, and the answer is nothing but that comparison.
    //
    // ALSO WHY THE ANSWER CANNOT EXCEED 1 AND IS NEAR 1 ONLY WHEN THE OTHER TERM
    // IS SMALL, which the next task demonstrates by making it small.
    reference: '2/13',
    at: { s: '9', t: '10', f: '1', g: '20', a: '1', n: '100' },
  },
  {
    id: 'move-the-base-rate-alone-and-keep-every-test-figure-1',
    knowledgePointId: 'the-denominator-is-a-sum-over-the-cases-so-the-base-rate-enters-three-times',
    kind: 'evaluate',
    prompt:
      'The same test — still positive for 9 in 10 who have the condition and 1 in 20 who do '
      + 'not — is now used on a group in which 1 person in 2 has it. Change nothing but the '
      + 'base rate. Evaluate ((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n)) at s = 9, t = 10, '
      + 'f = 1, g = 20, a = 1, n = 2. Then say what the two answers together mean for the '
      + 'sentence "this test is 90% accurate".',
    given: '((s/t)*(a/n))/((s/t)*(a/n) + (f/g)*((n-a)/n))',
    variables: BOTH_BRANCHES_OF_THE_SPLIT,
    // (9/20)/((9/20) + (1/40)) = (9/20)/(19/40) = 18/19 ≈ 0.947, against 2/13 ≈
    // 0.154 at a base rate of 1/100.
    //
    // ONE EXPRESSION, TWO SUBSTITUTIONS, AND ONLY `a` AND `n` MOVED — which is
    // the concept below's device for `k/m` applied to the one quantity this
    // concept has to move. Both test figures are identical in the two `at`
    // maps, so the difference cannot be attributed to the test, and the pair is
    // the assertion rather than the prose: a test has two rates and no accuracy,
    // and the probability a positive result carries depends on who was tested.
    // Screening everybody and testing people who already have symptoms are two
    // different experiments with one piece of equipment.
    //
    // 2/13 AND 18/19 ARE THE WIDEST SAME-EXPRESSION PAIR IN THIS SUBJECT, and
    // the comparison class is named because the superlative is false without
    // it: plenty of unrelated pairs of references sit further apart. Of the six
    // expressions asked at more than one substitution across the four
    // concepts, this one spans 0.79 and the runner-up is `k/m` at 0.49 — the
    // asymmetry of conditioning, one layer down. Wider here because a base
    // rate can be moved freely where an overlap cannot, and
    // tests/concepts-logic.mjs recomputes the ranking rather than restating it.
    reference: '18/19',
    at: { s: '9', t: '10', f: '1', g: '20', a: '1', n: '2' },
  },
  {
    id: 'compute-the-likelihood-ratio-on-its-own-1',
    knowledgePointId: 'in-odds-form-the-update-is-one-multiplication-by-the-likelihood-ratio',
    kind: 'evaluate',
    prompt:
      'Write the theorem for the condition and again for its complement, and divide one by the '
      + 'other: the probability of a positive result is the denominator of both, so it cancels '
      + 'and no sum over cases is left. What survives from the evidence is a single ratio — how '
      + 'much likelier a positive is under the condition than without it. Evaluate (s/t)/(f/g) '
      + 'at s = 9, t = 10, f = 1, g = 20, and say what it means that this answer is bigger '
      + 'than 1.',
    given: '(s/t)/(f/g)',
    variables: TWO_RATES_TO_COMPARE,
    // (9/10)/(1/20) = (9/10) × 20 = 18.
    //
    // THE ONLY REFERENCE IN THESE THREE SUBJECTS OUTSIDE [0, 1], and it is
    // deliberate rather than tolerated: an odds ratio is not a probability. The
    // prompt asks about it so that a learner reading 18 does not take it for a
    // mistake, and tests/concepts-logic.mjs asserts that exactly one of the nine
    // is outside the interval so the exception cannot spread.
    //
    // NO BASE RATE IN THE EXPRESSION, which is the claim of the whole point. The
    // evidence contributes one number and the population contributes another and
    // the two are MULTIPLIED, so neither rate means anything on its own —
    // 9 in 10 and 1 in 20 could both be different and give the same 18.
    reference: '18',
    at: { s: '9', t: '10', f: '1', g: '20' },
  },
  {
    id: 'multiply-prior-odds-by-the-ratio-and-convert-back-1',
    knowledgePointId: 'in-odds-form-the-update-is-one-multiplication-by-the-likelihood-ratio',
    kind: 'evaluate',
    prompt:
      'A base rate of 1 in 100 is prior odds of 1 to 99. Multiply the first of those by the '
      + 'likelihood ratio 18 and you have the posterior odds; odds of x to y mean a probability '
      + 'of x/(x+y). Evaluate (w*a)/(w*a + (n-a)) at w = 18, a = 1, n = 100 — and notice that '
      + 'the probability of a positive result, which the second point had to build, is nowhere '
      + 'in this calculation.',
    given: '(w*a)/(w*a + (n-a))',
    variables: A_LIKELIHOOD_RATIO_AND_PRIOR_ODDS,
    // 18/(18 + 99) = 18/117 = 2/13, the same answer as the third and fifth
    // tasks, by a route with no total probability in it at all.
    //
    // THE THIRD SHAPE TO GIVE 2/13, and the agreement is the content rather than
    // a duplicate: the definition with its denominator supplied, the definition
    // with its denominator built, and the odds form are three forms of ONE
    // statement. That is what distinguishes a theorem from a method, and it is
    // the concept below's two-routes-one-number device at the largest scale the
    // subject has used it.
    //
    // THE MULTIPLICATION IS LEFT VISIBLE, which is why the conversion is inside
    // the expression. `w*a` against `n-a` is 18 against 99: a large multiplier
    // on long odds is still long odds, because multiplying is not adding. Asking
    // for the odds and then the probability separately would have hidden the one
    // comparison the point is about — and it is the form in which the prior is
    // hardest to drop by accident, since it sits in plain sight as a factor
    // rather than buried in a denominator.
    reference: '2/13',
    at: { w: '18', a: '1', n: '100' },
  },
  {
    id: 'read-the-posterior-odds-as-the-probability-of-innocence-1',
    knowledgePointId: 'in-odds-form-the-update-is-one-multiplication-by-the-likelihood-ratio',
    kind: 'evaluate',
    prompt:
      'A trace matches whoever left it, and matches 1 person in 10,000 by chance, so the '
      + 'likelihood ratio is 10,000. Exactly one of 20,001 equally suspected people left it, so '
      + 'the prior odds against any particular one of them are 1 to 20,000 — and multiplying '
      + 'the first term by the ratio gives posterior odds of 10,000 to 20,000. Somebody '
      + 'matches. Evaluate m/(r+m) at r = 10000, m = 20000 to find the probability that they '
      + 'are INNOCENT, and compare it with the 1 in 10,000 that gets quoted.',
    given: 'm/(r+m)',
    variables: POSTERIOR_ODDS_OF_THE_TWO_CASES,
    // 20000/30000 = 2/3. Checked by counting: the one guilty person matches, and
    // about 20000 × 1/10000 = 2 of the innocents match, so a match picks out
    // about three people of whom one is guilty.
    //
    // THE ONLY TASK IN THE CONCEPT ANSWERING ABOUT THE COMPLEMENT, because the
    // number the prosecutor's fallacy misreports is the probability of
    // INNOCENCE. P(match given innocence) = 1/10,000 and P(innocence given a
    // match) = 2/3 come out of the same data, differ by more than six
    // thousandfold, and the second is what a verdict turns on while the first is
    // what gets quoted. That is the confusion `conditional-probability` declares
    // against this concept as the most consequential in the subject, at the
    // largest scale these subjects can produce — the first point made the same
    // swap with 9/10 against 2/13.
    //
    // AND IT DOES NOT SAY THE MATCH IS WORTHLESS. A likelihood ratio of 10,000
    // is enormous; it is the prior odds of 1:20,000 that leave the answer where
    // it is, which is the point's claim about multiplication arriving as a
    // number rather than as a warning.
    //
    // LAST OF THE NINE DELIBERATELY. Its two numbers were produced by reasoning
    // carried out in the prompt, which is only defensible once the reader has
    // done the odds-form arithmetic themselves in the task before it.
    reference: '2/3',
    at: { r: '10000', m: '20000' },
  },

  // ── chance-and-events, forty-ninth promotion: random-variables
  //
  // Nine tasks, three on each point, all nine `evaluate` and every one settled
  // by exact arithmetic with no worker — the property all four concepts below
  // hold, for the reason they give: a subject sitting this low must not be
  // walled off by a worker outage.
  //
  // THE COIN IS BACK, AND IT IS THE FIRST TIME A CONCEPT IN THIS SUBJECT HAS
  // REUSED AN EARLIER ONE'S SETTING. Nine tasks on three coin tosses below,
  // eighteen on twelve club members and 220 committees above those, nine on a
  // screening test above those, and these nine return to the eight sequences.
  // That is not nostalgia and it is not a shortage of settings:
  //
  //  - THE ARGUMENT THIS CONCEPT FINISHES WAS OPENED ON THAT SPACE.
  //    `sample-spaces` computes 3/8 for "exactly two heads" among the eight
  //    sequences and 1/4 in the space that records only the heads count, says
  //    the two cannot both be right, and declines to say which. Settling it
  //    needs the four preimage sizes 1, 3, 3, 1, which is this concept's table.
  //    Settling it anywhere else would be settling a different question.
  //  - THE CLUB WOULD HAVE MADE THE CONTENT INVISIBLE. On twelve members every
  //    preimage is a binomial coefficient and every task a count over 220, so
  //    the work would be `counting-probability`'s with a letter X in front of
  //    it — which is exactly the objection raised against promoting this node at
  //    all. Eight sequences printed in full means the preimage can be collected
  //    by eye, so the only thing a learner can be doing is the move this concept
  //    is about. The fourth concept dropped the club because its overlaps are
  //    countable; this one declines it because its preimages are.
  //
  // THE `220 x reference` MEASURE IS NOT REVIVED HERE. It ran nine of nine, four
  // of nine and then one of nine down the three concepts below and the fourth's
  // note declared it at its floor; these answers are eighths, quarters and
  // sevenths and the 220 has nothing to do with any of them. Said rather than
  // left out, so nobody recomputes it and reads the number as meaning something.
  //
  //  - EIGHT of the nine lie in [0, 1] and ONE does not. 3 is the ratio of the
  //    largest table entry to the smallest, and a ratio of probabilities is not
  //    a probability — the same category as the fourth concept's odds ratio 18,
  //    and the second such reference in these subjects.
  //    tests/concepts-logic.mjs asserts the count is exactly one.
  //  - NOT ONE of the nine is a count, which the two concepts above also manage.
  //    Every count in the material — the preimage sizes, the four sequences
  //    behind T = 1, the seven behind X at least 1 — is in a worked example, and
  //    every task divides.
  //  - ONE reference is exactly 1 and it is a PROBABILITY. It is the total of
  //    the table, which is the second point's whole content and the first time a
  //    reference in these subjects is 1 for a reason rather than by accident.
  //  - NO GIVEN IS REPEATED, within these nine or against the thirty-six below.
  //    The subject has six expressions asked at more than one substitution; this
  //    promotion adds none, deliberately, because the fourth concept's group
  //    asserts a span ranking over exactly those six and a seventh would have
  //    made that assertion this promotion's business for no teaching gain.
  //
  //     c/(u*v*w)              a preimage over the space, written as the three tosses
  //     c/(u*v*w) - 1/m        the gap between the licensed space and the unlicensed one
  //     (v*w)/(u*v*w)          a second rule, whose preimage is a sub-product of the space
  //     (p + q + r + s)/n      the whole table, totalled and divided once
  //     (q + r)/n              two entries together, with no correction term to subtract
  //     (r/n)/(p/n)            the largest entry over the smallest, which is not a probability
  //     q/n + r/n              the merge, adding probabilities already in hand
  //     (p + s)/n              the same merge on counts, dividing once
  //     (r/n)/(1 - p/n)        conditioning, where the rebuild needs a division
  //
  // TWO DIFFERENT SHAPES AGREE ON 3/4 AND THE AGREEMENT IS THE TEACHING RATHER
  // THAN A REPETITION. `(q + r)/n` in the second point and `q/n + r/n` in the
  // third are the same event under two descriptions — "X is 1 or 2" and "Y is
  // 1" — which is what it MEANS for Y to merge two values of X. The fourth
  // concept had three shapes agree because a theorem has forms; this is two
  // agreeing because a set has two names, and if they disagreed the merge would
  // not be a merge.
  //
  // NO `state` TASK, WHICH IS THE ONE REFUSAL IN THIS SET. "Write down the
  // random variable" is the natural first question about this concept and
  // `TaskKind` declares `state` unverifiable, so asking it would produce a chain
  // that cannot become evidence and would raise `chainsWithNoRuling`. The object
  // is taught in the worked examples, where telling is honest, and only its
  // values are graded.
  //
  // NO `transform_to_form`, NO `counterexample`, NO `justify`, and no
  // `domainConditions` on any of the nine, for the reasons ontology-chance.ts
  // gives four times already. The one addition: `1 - p/n` sits inside a
  // DENOMINATOR in the ninth task, the first complement to be divided by in
  // these subjects, and it is zero exactly when p = n — which is false at the
  // one substitution used and would be conditioning on an impossible event
  // rather than a division by zero in the ordinary sense.
  {
    id: 'read-a-probability-off-a-preimage-1',
    knowledgePointId:
      'a-value-of-the-variable-names-a-set-of-outcomes-so-its-probability-is-that-set-over-the-space',
    kind: 'evaluate',
    prompt:
      'A fair coin is tossed three times, so the sample space is the eight equally likely '
      + 'sequences HHH, HHT, HTH, HTT, THH, THT, TTH, TTT. Let X be the number of heads. The '
      + 'three characters "X = 2" are not a statement about a number: they name the SET of '
      + 'sequences that X sends to 2, which is HHT, HTH and THH — three of them. A probability '
      + 'belongs to that set, and it is divided by the space whose outcomes you were told are '
      + 'equally likely. Evaluate c/(u*v*w) at c = 3, u = 2, v = 2, w = 2, where c is the size '
      + 'of the set and the product is one factor per toss.',
    given: 'c/(u*v*w)',
    variables: A_PREIMAGE_OVER_THE_SPACE_AS_THREE_TOSSES,
    // 3/(2 × 2 × 2) = 3/8.
    //
    // THE FIRST TASK OF THE CONCEPT AND THE DENOMINATOR IS THE WHOLE OF ITS
    // CONTENT. There are two numbers a learner might divide by here — 8
    // sequences and 4 values of X — and `sample-spaces` reports both answers
    // without settling which is licensed. Writing the denominator as 2 × 2 × 2
    // puts the choice in the expression instead of in the prose: a product with
    // one factor per toss can only be the space of sequences.
    //
    // THE PROMPT NAMES THE THREE SEQUENCES AND THAT IS DELIBERATE. It gives
    // away the preimage, which is the move the concept is about, and the reason
    // to give it away in the FIRST task is that an `evaluate` cannot observe
    // collecting anyway — the collecting is taught in the worked example, where
    // telling is honest. What the task observes is whether a learner divides by
    // the space the set came from. The next two tasks stop naming the set.
    reference: '3/8',
    at: { c: '3', u: '2', v: '2', w: '2' },
  },
  {
    id: 'measure-the-gap-between-the-two-spaces-1',
    knowledgePointId:
      'a-value-of-the-variable-names-a-set-of-outcomes-so-its-probability-is-that-set-over-the-space',
    kind: 'evaluate',
    prompt:
      '`sample-spaces` records that "exactly two heads" comes out at 3/8 in the eight-sequence '
      + 'space and at 1/4 in the space whose four outcomes are the heads counts 0, 1, 2, 3 — and '
      + 'says the wrong answer is the one whose outcomes were never equally likely. It is the '
      + 'second: the four counts have 1, 3, 3 and 1 sequences behind them, and four groups of '
      + 'unequal size cannot be four equally likely outcomes, so dividing by 4 was never '
      + 'licensed. Find how far apart the two answers are. Evaluate c/(u*v*w) - 1/m at c = 3, '
      + 'u = 2, v = 2, w = 2, m = 4.',
    given: 'c/(u*v*w) - 1/m',
    variables: THE_TWO_SPACES_SIDE_BY_SIDE,
    // 3/8 − 1/4 = 3/8 − 2/8 = 1/8.
    //
    // THE REFERENCE IS A GAP AND NOT A WRONG ANSWER, which is the distinction
    // that makes this task askable. No reference in these subjects is a wrong
    // answer and this one is not either: how far apart two computed numbers are
    // is a true fact, and the prompt settles which of the two is licensed before
    // asking for it. "Which is right" would be a `state` task and unrulable;
    // "how far apart" is an `evaluate` that cannot be answered without having
    // computed both.
    //
    // 1/8 IS ALSO P(X = 0) AND THAT IS A COINCIDENCE. Three tosses of a fair
    // coin put the gap and the end entry at the same number, and nothing in the
    // material claims a connection — said here because the next point's table
    // makes 1/8 familiar and the resemblance is the kind of thing a reader
    // supplies a reason for.
    reference: '1/8',
    at: { c: '3', u: '2', v: '2', w: '2', m: '4' },
  },
  {
    id: 'a-second-rule-on-the-same-eight-sequences-1',
    knowledgePointId:
      'a-value-of-the-variable-names-a-set-of-outcomes-so-its-probability-is-that-set-over-the-space',
    kind: 'evaluate',
    prompt:
      'Keep the same eight sequences and record something else about them: let T be the number '
      + 'of the toss on which the first head appears, with T = 0 at TTT, since a rule has to '
      + 'give a value to every outcome or it is not a function on this space at all. T = 1 is '
      + 'the sequences that begin with H — the first toss is pinned and the other two are free, '
      + 'so the set is 2 x 2 sequences out of 2 x 2 x 2. Evaluate (v*w)/(u*v*w) at u = 2, '
      + 'v = 2, w = 2, and say what has changed from the task before and what has not.',
    given: '(v*w)/(u*v*w)',
    variables: A_SUB_PRODUCT_OF_THE_SAME_SPACE,
    // (2 × 2)/(2 × 2 × 2) = 4/8 = 1/2.
    //
    // ONE SPACE, TWO RULES, AND THE TASK IS THE SECOND HALF OF THAT CLAIM. The
    // two tasks above are about X and this one is about T, with not one outcome
    // different between them. So a random variable is a CHOICE made on top of
    // the space in the way the space was a choice made about the experiment, and
    // `sample-spaces`' four-outcome space was never a rival space so much as the
    // table of one particular rule.
    //
    // THE NUMERATOR IS A SUB-PRODUCT OF THE DENOMINATOR AND THE EXPRESSION
    // CANCELS BY ITSELF, which is why this shape was chosen over `c/(u*v*w)` at
    // c = 4. The answer is a half because one toss was pinned and two were not,
    // and `(v*w)/(u*v*w)` says that where a bare 4 would have hidden it.
    //
    // T'S VALUE AT TTT IS IN THE PROMPT AND IS NOT NEEDED FOR THE ARITHMETIC,
    // deliberately. It is where `function-concept` earns the `links` entry this
    // promotion filed: a function is defined everywhere on its domain, TTT has
    // no head, and the convention has to be chosen before T is a rule — which a
    // learner should meet while it costs nothing rather than later when a table
    // fails to total 1.
    reference: '1/2',
    at: { u: '2', v: '2', w: '2' },
  },
  {
    id: 'total-the-whole-table-and-check-it-against-one-1',
    knowledgePointId:
      'the-values-partition-the-space-so-the-table-adds-to-one-and-they-are-not-equally-likely',
    kind: 'evaluate',
    prompt:
      'Take the preimage of every value of X, the number of heads in three tosses: 0 comes from '
      + 'TTT alone, 1 from HTT, THT and TTH, 2 from HHT, HTH and THH, and 3 from HHH alone — '
      + 'sizes 1, 3, 3 and 1. Those four probabilities together are the DISTRIBUTION of X, and '
      + 'the first thing to do with a distribution is total it. Evaluate (p + q + r + s)/n at '
      + 'p = 1, q = 3, r = 3, s = 1, n = 8, and say what a total of 9/8 would have told you '
      + 'about your four preimages.',
    given: '(p + q + r + s)/n',
    variables: THE_FOUR_PREIMAGES_AND_THE_SPACE,
    // (1 + 3 + 3 + 1)/8 = 8/8 = 1.
    //
    // THE SUM IS INSIDE THE DIVISION, WHICH IS WHAT SEPARATES THIS FROM
    // `sample-spaces`' `p + q + r + s` AT THE SAME FOUR NUMBERS. There the
    // answer is 8 and the claim is that the four counts make up the space; here
    // the answer is 1 and the claim is that four PROBABILITIES do. The second
    // does not follow from the first by arithmetic — it follows from X being a
    // function, which sends each sequence to exactly one value, so the preimages
    // have nothing in common and leave nothing out.
    //
    // AND THAT IS WHY THE PROMPT ASKS WHAT 9/8 WOULD HAVE MEANT. The total is
    // not a sanity check with a vague failure mode: it is 1 or the four
    // preimages are not a partition, and the two ways to miss are putting a
    // sequence in two of them (too much) or in none (too little). A learner who
    // can say that has understood why the check is worth making every time.
    //
    // THE ONLY REFERENCE IN THE CONCEPT THAT IS AN INTEGER, and it is a
    // probability rather than a count — the probability of the whole space.
    // tests/concepts-logic.mjs pins it to this expression so that a 1 arriving
    // from anywhere else here goes red.
    reference: '1',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'add-two-entries-with-nothing-to-subtract-1',
    knowledgePointId:
      'the-values-partition-the-space-so-the-table-adds-to-one-and-they-are-not-equally-likely',
    kind: 'evaluate',
    prompt:
      'Find the probability that the three tosses give exactly one head or exactly two. '
      + '`sample-spaces` warns that two events in general need P(A) + P(B) - P(A and B), and the '
      + 'correction is forced rather than conventional. Decide first what "exactly one head AND '
      + 'exactly two heads" is as a set of sequences, and then evaluate (q + r)/n at q = 3, '
      + 'r = 3, n = 8 — an expression with no third term, because there is nothing to subtract '
      + 'rather than something that happens to come out at zero.',
    given: '(q + r)/n',
    variables: TWO_ENTRIES_TAKEN_TOGETHER,
    // (3 + 3)/8 = 6/8 = 3/4.
    //
    // THE ABSENT TERM IS THE CONTENT AND THE SHAPE OF THE EXPRESSION CARRIES IT.
    // X gives each sequence exactly one number, so no sequence has both one head
    // and two: the overlap event is EMPTY, which is a stronger statement than a
    // probability of zero and is the reason the third term does not appear at
    // all. The prompt asks for the set before the arithmetic for that reason —
    // a learner who answers "no sequences" has the claim, and one who answers
    // "probability 0" has only the arithmetic.
    //
    // THE SAME 3/4 IS REACHED BY `q/n + r/n` IN THE THIRD POINT AND THE TWO
    // TASKS ARE NOT DUPLICATES. "X is 1 or 2" and "Y is 1" are one subset of the
    // eight sequences under two descriptions, so the agreement is forced; what
    // differs is the route, counts-then-divide here and probabilities-then-add
    // there. tests/concepts-logic.mjs asserts the agreement and the distinctness
    // of the two givens together, because either alone would be satisfied by the
    // wrong thing.
    //
    // TWO LETTERS RATHER THAN `2*q`, because the two entries are both 3 by the
    // coin's symmetry and not by anything structural about merging.
    reference: '3/4',
    at: { q: '3', r: '3', n: '8' },
  },
  {
    id: 'the-largest-entry-over-the-smallest-1',
    knowledgePointId:
      'the-values-partition-the-space-so-the-table-adds-to-one-and-they-are-not-equally-likely',
    kind: 'evaluate',
    prompt:
      'The table of X is 1/8, 3/8, 3/8, 1/8 at 0, 1, 2 and 3 heads. Measure how far from '
      + 'equally likely those four values are by comparing the largest entry with the smallest. '
      + 'Evaluate (r/n)/(p/n) at r = 3, p = 1, n = 8. Then say two things about your answer: '
      + 'what it would have to be for the four values to be equally likely, and why it is not '
      + 'itself a probability.',
    given: '(r/n)/(p/n)',
    variables: THE_LARGEST_ENTRY_OVER_THE_SMALLEST,
    // (3/8)/(1/8) = 3.
    //
    // THE SPACE IS WRITTEN TWICE AND CANCELS, WHICH IS THE POINT OF THE SHAPE.
    // `r/p` gives the same 3 and is a ratio of two COUNTS; this is a ratio of
    // two PROBABILITIES, and letting the two 8s cancel is the demonstration that
    // the comparison does not depend on the size of the space. Same device as
    // `conditional-probability`'s `(k/n)/(m/n)` and for the same reason.
    //
    // 3 IS THE ONE REFERENCE IN THIS CONCEPT OUTSIDE [0, 1], and the prompt
    // makes the learner say why rather than leaving it as a curiosity: a
    // quotient of probabilities can exceed 1 where no entry in a table ever can,
    // so the answer is a comparison and not an answer to "how likely". It is the
    // second such reference in these subjects after the fourth concept's odds
    // ratio 18, it belongs to the same category, and the count is pinned at one
    // in tests/concepts-logic.mjs.
    //
    // AND IT IS THE EXACT SIZE OF THE ERROR THE SMALL SPACE WAS MAKING. Equally
    // likely would put this ratio at 1 and the table at 1/4 four times; it is 3,
    // and 1/8, 3/8, 3/8, 1/8 is what the eight sequences actually say. The
    // second task of the point below measures the same disagreement as a
    // difference; this measures it as a ratio.
    reference: '3',
    at: { r: '3', p: '1', n: '8' },
  },
  {
    id: 'merge-two-entries-by-adding-their-probabilities-1',
    knowledgePointId:
      'a-new-rule-over-the-same-outcomes-merges-values-and-the-probabilities-of-what-it-merges-add',
    kind: 'evaluate',
    prompt:
      'Let Y be the margin by which one side beat the other, |heads - tails|. Tails is 3 - X, '
      + 'so Y = |2X - 3|, which is 3, 1, 1, 3 as X runs 0, 1, 2, 3 — a function of a random '
      + 'variable is a random variable, and this one is not one-to-one. X = 1 and X = 2 are both '
      + 'sent to 1, so the sequences behind "Y = 1" are the union of two preimages that share '
      + 'nothing, and their probabilities add. Work from the table 1/8, 3/8, 3/8, 1/8 and not '
      + 'from the sequences: evaluate q/n + r/n at q = 3, r = 3, n = 8.',
    given: 'q/n + r/n',
    variables: TWO_ENTRIES_MERGED_AS_PROBABILITIES,
    // 3/8 + 3/8 = 6/8 = 3/4.
    //
    // THE ARITHMETIC IS ON PROBABILITIES ALREADY IN HAND AND THAT IS WHAT IS
    // NEW. Nothing is counted, no sequence is looked at, and the eight sequences
    // are never revisited — which is what building the table bought. No question
    // in the three concepts below can ask for this, because below there is no
    // table to merge entries of.
    //
    // THE PROMPT SAYS "NOT FROM THE SEQUENCES" BECAUSE THE WRONG ROUTE GETS THE
    // RIGHT ANSWER. Y = 1 is six of the eight sequences and 6/8 is 3/4, so a
    // learner who goes back and counts arrives at the same number having done
    // the concept below's work. The instruction is the only thing that
    // distinguishes them, which is a limit of what an `evaluate` can observe and
    // is said here rather than hidden.
    //
    // IT AGREES WITH `(q + r)/n` IN THE POINT ABOVE, NECESSARILY, since "X is 1
    // or 2" and "Y is 1" are one event under two descriptions. If the two ever
    // disagreed the merge would not be a merge, so the agreement is asserted.
    reference: '3/4',
    at: { q: '3', r: '3', n: '8' },
  },
  {
    id: 'merge-the-other-pair-on-their-counts-1',
    knowledgePointId:
      'a-new-rule-over-the-same-outcomes-merges-values-and-the-probabilities-of-what-it-merges-add',
    kind: 'evaluate',
    prompt:
      'The margin Y takes only two values, and the other one is 3: X = 0 and X = 3 are both sent '
      + 'to it, which is TTT and HHH — two of the eight sequences of three coin tosses. Get '
      + 'P(Y = 3) the other way round from the task before — '
      + 'add the two preimage SIZES and divide once, rather than dividing twice and adding. '
      + 'Evaluate (p + s)/n at p = 1, s = 1, n = 8. Then check the table of Y against 1, and say '
      + 'whether merging values could ever have broken that total.',
    given: '(p + s)/n',
    variables: THE_TWO_END_ENTRIES_MERGED_ON_COUNTS,
    // (1 + 1)/8 = 2/8 = 1/4, and 3/4 + 1/4 = 1.
    //
    // THE OTHER ROUTE, ON PURPOSE, so that the point shows both and says they
    // must agree. Dividing a sum by 8 and summing the quotients are the same
    // operation — one line of `fraction-arithmetic` — which is why no learner
    // has to be told that merging is safe and why the two tasks of this point
    // are not a repetition.
    //
    // THE TOTAL QUESTION IN THE PROMPT HAS A STRUCTURAL ANSWER AND NOT AN
    // ARITHMETIC ONE. 3/4 + 1/4 = 1, and it could not have come out otherwise:
    // every sequence still goes to exactly one value of Y, so the preimages of Y
    // are a COARSER partition of the same eight sequences, and a coarser
    // partition is still a partition. That is the contrast the ninth task is
    // for — merging keeps every outcome, conditioning does not.
    //
    // DIFFERENT LETTERS FROM THE TASK ABOVE, `p` and `s` for the two ENDS of the
    // table against `q` and `r` for the two MIDDLES. A shared list would let a
    // substitution claim the ends and the middles were the same two numbers,
    // which is the one thing the table says they are not.
    reference: '1/4',
    at: { p: '1', s: '1', n: '8' },
  },
  {
    id: 'rebuild-the-table-by-ruling-an-outcome-out-1',
    knowledgePointId:
      'a-new-rule-over-the-same-outcomes-merges-values-and-the-probabilities-of-what-it-merges-add',
    kind: 'evaluate',
    prompt:
      'Now rebuild the table the other way, by ruling an outcome out instead of merging values. '
      + 'Given that at least one head came up, TTT is gone and seven sequences remain, so the '
      + 'condition has probability 1 - 1/8 = 7/8 and `conditional-probability` replaces the '
      + 'space with it. Evaluate (r/n)/(1 - p/n) at r = 3, p = 1, n = 8 to get '
      + 'P(X = 2 given at least one head). Then note that the three surviving entries are 3/7, '
      + '3/7 and 1/7 while their numerators 3/8, 3/8 and 1/8 add to 7/8, and say what the '
      + 'division was for and why the merging in the two tasks before needed nothing like it.',
    given: '(r/n)/(1 - p/n)',
    variables: AN_ENTRY_OVER_A_COMPLEMENT,
    // (3/8)/(1 − 1/8) = (3/8)/(7/8) = 3/7.
    //
    // THE LAST TASK OF THE CONCEPT AND THE ONLY ONE THAT CONDITIONS ANYTHING,
    // which is also why `random-variables` declares no credit edge to
    // `conditional-probability`: one of nine tasks is not two of three points.
    // What the gate does buy is this contrast, and the contrast is the point's
    // answer rather than an extension of it.
    //
    // THE DENOMINATOR IS A COMPLEMENT RATHER THAN A SUPPLIED TOTAL, and it is
    // the first complement in these subjects to be divided BY. `sample-spaces`
    // asks `1 - c/n` at the same two numbers and answers 7/8 on its own; here
    // that 7/8 sits underneath an entry, so the complement rule is used as a
    // step. Giving the total away as `p/q` — the shape `bayes-theorem` uses —
    // would have removed the only part a learner has to construct.
    //
    // THE PROMPT ASKS WHAT THE DIVISION WAS FOR BECAUSE THAT IS THE WHOLE
    // DISTINCTION. 3/7 + 3/7 + 1/7 = 1 only because of it; the numerators add
    // to 7/8, not to 1. Merging keeps the total for free because nothing left
    // the space, and conditioning discards TTT and has to renormalise by the
    // probability of what it kept. Both rebuild a distribution and that single
    // fact decides which needs a division.
    //
    // IT CANNOT VANISH, CHECKED ON THE TASK. `1 - p/n` is zero exactly when
    // p = n, and here p = 1 and n = 8. No `domainConditions`, because the
    // expression is fine and only a substitution could break it — and what it
    // would break is not arithmetic: conditioning on an event of probability 0
    // is undefined because there is no space left to replace the old one with.
    reference: '3/7',
    at: { r: '3', p: '1', n: '8' },
  },
  //
  // ── expectation ─────────────────────────────────────────────────────────
  //
  // Nine `evaluate` tasks, three per point, on the same eight sequences the
  // concept below is set on. The shapes:
  //
  //     (0*p + 1*q + 2*r + 3*s)/n      the weighted total, for X
  //     (0*p + 1*q + 2*r + 3*s)/n      the same expression, for T
  //     (0 + 1 + 2 + 3)/m - …          the plain average's overshoot on T
  //     a*((0*p + 1*q + 2*r + 3*s)/n) + b   the linear rule pushed through
  //     (1*p + 3*q + 5*r + 7*s)/n      the same rule the long way, rebuilt
  //     (1*(q + r) + 3*(p + s))/n      a merged table, where the push-through fails
  //     (g + h)/n                      two totals over one space, added
  //     (0*p + 2*q + 3*r + 4*s)/n      the sum rule's own table
  //     k/n - (g/n)*(h/n)              the product, which is NOT free
  //
  // THE FIRST TWO ARE ONE EXPRESSION AT TWO SUBSTITUTIONS AND THAT IS THE
  // CONCEPT'S CENTRAL CLAIM, not a repetition. The values 0, 1, 2, 3 are
  // LITERALS in the expression, so the two tasks differ in nothing a learner can
  // see except the four preimage sizes — and they answer 3/2 and 11/8. X and T
  // take the same four values on the same eight sequences, so any method reading
  // only the value list must give them the same answer, and these two tasks are
  // the proof that no such method is right. The shared-expression pattern exists
  // in `plane-geometry` as "the same expression at two inputs, where agreeing is
  // what makes them a pair"; this is the first place where DISAGREEING is.
  //
  // SEVEN OF THE NINE REFERENCES LEAVE [0, 1], WHICH IS A NEW CATEGORY RATHER
  // THAN A DRIFT. Every reference in the five concepts below is a probability
  // except two — `bayes-theorem`'s odds ratio 18 and `random-variables`' ratio 3
  // — and each is pinned at exactly one so the exception cannot spread. Here the
  // interval is simply not the right one: an expectation is in the UNITS OF THE
  // VARIABLE, and a count of heads has no reason to be at most 1. The two that
  // stay inside are the two gaps, 1/8 and 1/16, which are differences of
  // quantities rather than quantities. So the assertion in
  // tests/concepts-logic.mjs is inverted for this concept — seven outside and
  // two in, named — which is the honest form of a rule that was never about [0,
  // 1] but about not claiming to be a probability.
  //
  // NO `state` TASK, and the refusal is sharper here than in the concept below.
  // "Say why the shortcut fails on the modulus" is the most valuable question
  // this concept raises and `TaskKind` declares `state` unverifiable, so asking
  // it would produce a chain that cannot become evidence. The argument is
  // carried in the worked examples and in the prompts, where telling is honest,
  // and what gets graded is the two numbers the argument is about: E[Y] = 3/2
  // against the 0 the prompt hands over.
  //
  // NO `counterexample` EITHER, WHICH IS THE ONE WORTH EXPLAINING. `TaskKind`
  // calls it "machine-rulable when the claim is an identity", and
  // E[g(X)] = g(E[X]) IS an identity, so "produce a g breaking it" looks
  // askable. It is not askable HERE: ruling it needs a distribution and a
  // function as inputs, and `PracticeTask` carries one expression, one
  // substitution and one reference. The kind would have to take a table. Said
  // out loud because this is the first concept in these subjects where the
  // refusal is about the task SCHEMA rather than about the kind being
  // unverifiable, and the two look identical from the coverage line.
  //
  // NO `transform_to_form`, NO `justify`, and no `domainConditions` on any of
  // the nine, for the reasons ontology-chance.ts gives five times already. The
  // one thing to check was the product task's denominators: `(g/n)*(h/n)` is
  // zero-divided only if n is, and n is the size of a sample space.
  {
    id: 'total-the-table-weighted-by-its-own-values-1',
    knowledgePointId:
      'the-expectation-weights-each-value-by-its-probability-so-two-rules-sharing-a-value-list-differ',
    kind: 'evaluate',
    prompt:
      'A fair coin is tossed three times, so the sample space is the eight equally likely '
      + 'sequences, and X is the number of heads. `random-variables` built its table by '
      + 'collecting preimages of sizes 1, 3, 3 and 1 at the values 0, 1, 2, 3. Collapse that '
      + 'table to one number: multiply each value by its own probability and total the lot. '
      + 'Evaluate (0*p + 1*q + 2*r + 3*s)/n at p = 1, q = 3, r = 3, s = 1, n = 8, where the '
      + 'literals 0, 1, 2, 3 are the values X takes and p, q, r, s are the preimage sizes behind '
      + 'them.',
    given: '(0*p + 1*q + 2*r + 3*s)/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (0 × 1 + 1 × 3 + 2 × 3 + 3 × 1)/8 = (0 + 3 + 6 + 3)/8 = 12/8 = 3/2.
    //
    // THE SAME FIVE NUMBERS AS `(p + q + r + s)/n` IN THE CONCEPT BELOW, AND THE
    // WEIGHTS ARE THE WHOLE DIFFERENCE. That task answers 1 and is the statement
    // that the values of a function partition the space; this one answers 3/2
    // and is the statement that the table has a centre. One division in each,
    // five identical inputs, and the only change is a coefficient per term — so
    // a reader can see that expectation adds nothing to the table except an
    // arithmetic on it.
    //
    // THE ZERO TERM IS WRITTEN OUT AND IT MATTERS. `(q + 2*r + 3*s)/n` gives the
    // same 12/8 and would be the shorter expression, and it would also lose the
    // thing `sigma-notation`'s first point is for: there are FOUR values and
    // therefore four terms, upper minus lower plus one, and X = 0 is a value X
    // takes rather than a row that is not there. Dropping it is the commonest
    // arithmetic slip available on this table, and an expression that drops it
    // teaches the slip.
    //
    // THE REFERENCE IS OUTSIDE [0, 1] AND IS NOT A RATIO OF PROBABILITIES,
    // which is the first of its kind in these subjects. 18 and 3 are both
    // quotients of two probabilities and so are dimensionless; 3/2 is in HEADS.
    // That is the whole reason the concept opens by saying what kind of number
    // came out.
    reference: '3/2',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'total-the-same-shape-for-a-second-rule-1',
    knowledgePointId:
      'the-expectation-weights-each-value-by-its-probability-so-two-rules-sharing-a-value-list-differ',
    kind: 'evaluate',
    prompt:
      'Keep the same eight sequences and take the other rule `random-variables` put on them: T '
      + 'is the toss on which the first head appears, with T = 0 at TTT, since a rule has to '
      + 'give every outcome a value or it is not a function on this space. Its preimages are TTT '
      + 'alone; the four sequences beginning with H; THH and THT; and TTH alone — so its table is '
      + '1, 4, 2, 1 over 8 at the values 0, 1, 2, 3. T takes the SAME four values as X. Evaluate '
      + 'the SAME expression (0*p + 1*q + 2*r + 3*s)/n at p = 1, q = 4, r = 2, s = 1, n = 8, and '
      + 'compare your answer with the task before.',
    given: '(0*p + 1*q + 2*r + 3*s)/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (0 × 1 + 1 × 4 + 2 × 2 + 3 × 1)/8 = (0 + 4 + 4 + 3)/8 = 11/8.
    //
    // ONE EXPRESSION, TWO SUBSTITUTIONS, TWO ANSWERS — AND THE DISAGREEMENT IS
    // THE TEACHING. Every other shared-expression pair in these subjects is a
    // pair because the two AGREE: the rhombus area twice, the two routes to
    // P(Y = 1), the three forms of one theorem. This is the first pair that
    // exists because the answers differ, and what the difference establishes is
    // a negative — the expectation is not a function of the value list, because
    // here is one list with two expectations.
    //
    // THE VALUES BEING LITERALS IS WHAT MAKES THAT READABLE. 0, 1, 2 and 3 are
    // in the expression and not in `at`, so the two tasks are character-for-
    // character the same question and differ only in four preimage sizes. Had
    // the values been letters, the two substitutions would have differed in nine
    // places and a reader would have no reason to think the value lists were
    // the same at all.
    //
    // AND IT IS A REAL SECOND VARIABLE RATHER THAN A FUNCTION OF THE FIRST,
    // which the third point needs and which nothing in the concept below
    // supplies. Y there is |2X - 3| and so carries no information X does not;
    // T is chosen on the space independently, and the ninth task multiplies the
    // two together.
    reference: '11/8',
    at: { p: '1', q: '4', r: '2', s: '1', n: '8' },
  },
  {
    id: 'measure-what-ignoring-the-weights-costs-1',
    knowledgePointId:
      'the-expectation-weights-each-value-by-its-probability-so-two-rules-sharing-a-value-list-differ',
    kind: 'evaluate',
    prompt:
      'A learner who ignores the table and averages the four values gets (0 + 1 + 2 + 3)/4 = '
      + '3/2, which is the right answer for X — by a route that is wrong, since X\'s table is '
      + 'symmetric and the pull towards the middle cancels. On T it is simply wrong: T has the '
      + 'same four values and the table 1, 4, 2, 1 over 8, so the weighted answer is 11/8. Find '
      + 'how far the plain average overshoots. Evaluate '
      + '(0 + 1 + 2 + 3)/m - (0*p + 1*q + 2*r + 3*s)/n at m = 4, p = 1, q = 4, r = 2, s = 1, '
      + 'n = 8.',
    given: '(0 + 1 + 2 + 3)/m - (0*p + 1*q + 2*r + 3*s)/n',
    variables: A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE,
    // 6/4 − 11/8 = 12/8 − 11/8 = 1/8.
    //
    // THE REFERENCE IS A GAP AND NOT A WRONG ANSWER, which is the same shape and
    // the same defence as `c/(u*v*w) - 1/m` in the concept below: how far apart
    // two computations are is a true fact, the prompt settles which one is
    // licensed before asking, and a learner who produces 1/8 has had to do both.
    // "Which route is right" would be a `state` task and unrulable.
    //
    // ASKED ON T BECAUSE ON X IT WOULD BE ZERO, which is the one decision in
    // this task. The same expression at X's substitution is a true statement
    // with reference 0, and it would teach that the weights do not matter — the
    // exact error the point exists to close. The table that makes the two routes
    // agree is the one the concept is introduced on, so the gap has to be asked
    // somewhere else or not at all.
    //
    // 1/8 IS ALSO THE GAP IN THE CONCEPT BELOW AND THAT IS A COINCIDENCE. There
    // it is 3/8 − 1/4, the distance between two SPACES; here it is the distance
    // between two METHODS on one table. Said because three tosses of a fair coin
    // put a great many of these quantities at an eighth, and the resemblance is
    // the kind of thing a reader supplies a reason for.
    reference: '1/8',
    at: { m: '4', p: '1', q: '4', r: '2', s: '1', n: '8' },
  },
  {
    id: 'push-a-linear-rule-through-the-expectation-1',
    knowledgePointId:
      'a-linear-rule-can-be-pushed-through-the-expectation-and-the-total-of-one-is-what-licenses-it',
    kind: 'evaluate',
    prompt:
      'Same three tosses, same X with preimages 1, 3, 3, 1 over 8 at the values 0, 1, 2, 3. Let '
      + 'W = 2X + 1. The rule E[aX + b] = aE[X] + b says you can reach E[W] without rebuilding '
      + 'W\'s table at all: total X\'s table once, then multiply by a and add b. Evaluate '
      + 'a*((0*p + 1*q + 2*r + 3*s)/n) + b at a = 2, b = 1, p = 1, q = 3, r = 3, s = 1, n = 8, '
      + 'and note how many of W\'s own probabilities you used.',
    given: 'a*((0*p + 1*q + 2*r + 3*s)/n) + b',
    variables: A_LINEAR_RULE_OUTSIDE_A_WHOLE_TABLE,
    // 2 × (12/8) + 1 = 3 + 1 = 4.
    //
    // THE TABLE IS INSIDE THE BRACKETS AND THE RULE IS OUTSIDE THEM, which is
    // the whole content of the expression. `a*e + b` at e = 3/2 gives the same 4
    // and asserts nothing: what the theorem says is that a and b reach the
    // answer without reaching the four probabilities, and only a shape with the
    // table nested inside shows what was skipped. The nesting is also why this
    // task and the one after it have different expressions for the same number.
    //
    // `a` AND `b` ARE LETTERS WHERE THE VALUES ARE LITERALS, which is the
    // reverse of the first three tasks and is deliberate. 0, 1, 2, 3 are fixed
    // by the experiment — X counts heads — while a and b are what makes a rule
    // LINEAR and are the two things the theorem is quantified over. A learner
    // substituting them is instantiating a rule rather than evaluating a
    // number.
    //
    // THE REFERENCE IS A WHOLE NUMBER AND THAT IS WORTH ONE LINE. 4 is the only
    // integer reference in this concept, and it is an expectation rather than a
    // count — W takes 1, 3, 5, 7 and averages to exactly 4, which is again not a
    // value W takes. An integer here is not the bare count the three concepts
    // below each assert they have none of.
    reference: '4',
    at: { a: '2', b: '1', p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'rebuild-the-relabelled-table-and-total-it-1',
    knowledgePointId:
      'a-linear-rule-can-be-pushed-through-the-expectation-and-the-total-of-one-is-what-licenses-it',
    kind: 'evaluate',
    prompt:
      'Now do the same thing the long way, so that the shortcut is checked rather than trusted. '
      + 'W = 2X + 1 is one-to-one, so nothing merges: W takes 1, 3, 5, 7 where X took 0, 1, 2, 3 '
      + 'and carries the same preimages 1, 3, 3, 1 over 8 — the relabelling case '
      + '`random-variables` said has no arithmetic in it. Total W\'s own table: evaluate '
      + '(1*p + 3*q + 5*r + 7*s)/n at p = 1, q = 3, r = 3, s = 1, n = 8.',
    given: '(1*p + 3*q + 5*r + 7*s)/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (1 × 1 + 3 × 3 + 5 × 3 + 7 × 1)/8 = (1 + 9 + 15 + 7)/8 = 32/8 = 4.
    //
    // IT AGREES WITH THE TASK BEFORE AND THE AGREEMENT IS WHAT MAKES THE RULE A
    // THEOREM. Two expressions, one answer: a*(table) + b and the relabelled
    // table totalled in full. This is the subject's established
    // two-routes-agreeing shape — `(q + r)/n` against `q/n + r/n` in the concept
    // below — used here on a claim rather than on a set, and if they disagreed
    // the shortcut would be false rather than the merge not being a merge.
    //
    // THE SAME FOUR PREIMAGE SIZES AS X, UNCHANGED, which is the structural fact
    // the one-to-one case contributes. The substitution is identical to the
    // first task's and only the four literal values have moved, 0, 1, 2, 3 to 1,
    // 3, 5, 7 — so a reader can see that a linear rule relocates the values and
    // leaves the probabilities exactly where they were. That is also why this
    // task cannot stand in for a merge: nothing was added.
    //
    // 32/8 RATHER THAN 4 IS WHAT A LEARNER WILL WRITE, and either is correct.
    // The reference is 4 and `ruleEvaluate` settles equivalence, so the eighths
    // are not required — worth noting because the denominator 8 surviving in the
    // intermediate arithmetic is the sign the table was totalled rather than the
    // shortcut re-run.
    reference: '4',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'total-a-merged-table-where-the-shortcut-fails-1',
    knowledgePointId:
      'a-linear-rule-can-be-pushed-through-the-expectation-and-the-total-of-one-is-what-licenses-it',
    kind: 'evaluate',
    prompt:
      'Now a rule that is NOT of the form aX + b. Let Y = |2X - 3| be the margin between heads '
      + 'and tails, which is 3, 1, 1, 3 as X runs 0 to 3 — so Y takes 1 and 3 only, and merges '
      + 'the two middle preimages under 1 and the two end ones under 3. Pushing the expectation '
      + 'through anyway gives |2(3/2) - 3| = 0, which is not even a value Y takes. Do it '
      + 'honestly: evaluate (1*(q + r) + 3*(p + s))/n at p = 1, q = 3, r = 3, s = 1, n = 8, '
      + 'where the bracketed sums are the merged preimages and 1 and 3 are the values of Y.',
    given: '(1*(q + r) + 3*(p + s))/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (1 × (3 + 3) + 3 × (1 + 1))/8 = (6 + 6)/8 = 12/8 = 3/2.
    //
    // THE MERGE IS IN THE BRACKETS, WHICH IS WHAT DISTINGUISHES THIS FROM THE
    // TASK ABOVE. There a one-to-one rule moved four values and left four
    // probabilities; here a two-to-one rule leaves two, and the expression
    // groups `q + r` and `p + s` to say which preimages were unioned — exactly
    // the pairing `random-variables`' third point computes as 3/4 and 1/4.
    // Writing Y's table as two bare letters would have hidden the fact that
    // these are X's four numbers rearranged.
    //
    // THE REFERENCE EQUALS THE FIRST TASK'S AND THAT IS A COINCIDENCE WORTH
    // NAMING, because it is the one place in this concept where a repeated
    // answer is not an agreement. E[X] = 3/2 and E[Y] = 3/2, on a fair coin,
    // for no reason the material uses — X and Y are different rules with
    // different tables and different units of nothing in common. The prompt
    // deliberately quotes the shortcut's 0 rather than E[X]'s 3/2 so that a
    // learner is not invited to read the equality as the point.
    //
    // THE ILLEGAL ANSWER IS IN THE PROMPT AND IS NOT THE REFERENCE, for the
    // reason the gap task gives: a wrong number is never a reference here. What
    // makes handing it over safe is that it refutes itself — Y is 1 or 3 on
    // every sequence, so 0 is outside the range of the quantity being averaged,
    // and a learner can see the shortcut has failed before computing 3/2.
    reference: '3/2',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'add-two-totals-over-one-space-1',
    knowledgePointId:
      'expectation-adds-across-two-rules-on-one-space-whether-or-not-they-are-independent',
    kind: 'evaluate',
    prompt:
      'Put the two rules side by side on the same eight sequences: X the heads-count and T the '
      + 'toss the first head falls on. Across the eight sequences X totals 12 and T totals 11 — '
      + 'which is where E[X] = 12/8 and E[T] = 11/8 came from. Now S = X + T, and totalling '
      + 'X + T over the eight sequences adds the same numbers in a different order, so its total '
      + 'is 12 + 11 before anything is divided. Evaluate (g + h)/n at g = 12, h = 11, n = 8, and '
      + 'note that this predicts E[S] without S having been worked out on a single sequence.',
    given: '(g + h)/n',
    variables: TWO_TOTALS_OVER_ONE_SPACE,
    // (12 + 11)/8 = 23/8.
    //
    // THE TOTALS ARRIVE AS COUNTS AND THE DIVISION HAPPENS ONCE, which is the
    // argument rather than a tidier arrangement of it. Two nested weighted sums
    // would give the same 23/8 and would hide the reason: expectations add
    // because a sum over the eight sequences can be reordered, so 23 = 12 + 11
    // holds before any probability is involved, and dividing one total by 8 is
    // the same as dividing two and adding.
    //
    // NOTHING IN THE EXPRESSION COULD CARRY AN INDEPENDENCE CONDITION, and that
    // is the honest shape for a fact that does not need one. X and T are
    // dependent — the next point's prompt runs the product test and gets 0
    // against 1/16 — and `(g + h)/n` is indifferent to it. A shape with the two
    // tables in it would at least have had somewhere for a condition to go.
    //
    // IT IS THE FIRST TASK IN THESE SUBJECTS WITH TWO VARIABLES SIDE BY SIDE
    // rather than one rule or a function of one. `random-variables` has Y built
    // FROM X, which carries no information X does not; here T is a second choice
    // on the space, which is why no table above could have stated this and why
    // the concept needed a second rule at all.
    reference: '23/8',
    at: { g: '12', h: '11', n: '8' },
  },
  {
    id: 'total-the-sum-rules-own-table-1',
    knowledgePointId:
      'expectation-adds-across-two-rules-on-one-space-whether-or-not-they-are-independent',
    kind: 'evaluate',
    prompt:
      'Check that prediction against S\'s own table. Working X + T out sequence by sequence gives '
      + '4, 3, 3, 2, 4, 3, 4, 0 across HHH, HHT, HTH, HTT, THH, THT, TTH, TTT — so S takes 0 '
      + 'once, 2 once, 3 three times and 4 three times, and never takes 1 at all. Total it: '
      + 'evaluate (0*p + 2*q + 3*r + 4*s)/n at p = 1, q = 1, r = 3, s = 3, n = 8, where the '
      + 'literals are the values S takes and p, q, r, s are the preimages behind them.',
    given: '(0*p + 2*q + 3*r + 4*s)/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (0 × 1 + 2 × 1 + 3 × 3 + 4 × 3)/8 = (0 + 2 + 9 + 12)/8 = 23/8.
    //
    // IT MEETS THE TASK BEFORE, WHICH IS THE WHOLE OF WHY BOTH ARE ASKED. The
    // prediction came from two totals and three letters; this comes from four
    // preimages collected off the eight sequences. Two routes, one answer, and
    // the agreement is what turns additivity from an assertion into something a
    // learner has checked — the same discipline as the two routes to P(Y = 1) in
    // the concept below.
    //
    // THE VALUE LITERALS ARE 0, 2, 3, 4 AND THE GAP IS VISIBLE IN THE
    // EXPRESSION. S skips 1 entirely, which the shape says without a word of
    // prose: a weighted total over four values that are not consecutive. S = 1
    // would need no heads with a first head on toss one, or one head with no
    // head anywhere, and both are empty. Worth having in the expression because
    // every other table in these subjects runs over consecutive values and a
    // reader would otherwise assume it is forced.
    //
    // THE FOUR PREIMAGES ARE 1, 1, 3, 3 AND NOT A PERMUTATION OF X'S 1, 3, 3, 1,
    // which is checked rather than eyeballed: they add to 8 as any partition of
    // this space must, but the sum rule's table is genuinely its own and is not
    // X's reordered. tests/concepts-logic.mjs derives it from the eight
    // sequences rather than reading it off this comment.
    reference: '23/8',
    at: { p: '1', q: '1', r: '3', s: '3', n: '8' },
  },
  {
    id: 'compare-the-product-total-with-the-product-of-totals-1',
    knowledgePointId:
      'expectation-adds-across-two-rules-on-one-space-whether-or-not-they-are-independent',
    kind: 'evaluate',
    prompt:
      'Adding turned out to be free, so ask whether multiplying is. Across the eight sequences '
      + 'XT is 3, 2, 2, 1, 4, 2, 3, 0, which totals 17, so E[XT] = 17/8. Against that, '
      + 'E[X]E[T] = (12/8)(11/8). Find the difference, and remember that X and T are NOT '
      + 'independent: P(X = 0) = 1/8 and P(T = 1) = 1/2 multiply to 1/16 while '
      + 'P(X = 0 and T = 1) = 0, since a sequence with no heads cannot have its first head on '
      + 'toss one. Evaluate k/n - (g/n)*(h/n) at k = 17, g = 12, h = 11, n = 8.',
    given: 'k/n - (g/n)*(h/n)',
    variables: A_PRODUCT_TOTAL_AGAINST_A_PRODUCT_OF_TOTALS,
    // 17/8 − (12/8)(11/8) = 17/8 − 132/64 = 34/16 − 33/16 = 1/16.
    //
    // `g`, `h` AND `n` MEAN WHAT THEY MEAN IN THE TASK TWO ABOVE, deliberately,
    // because the pair of tasks IS the comparison. Additivity is `(g + h)/n` and
    // comes out exactly; the multiplicative version is this and does not. Giving
    // this task its own letters would have made two unrelated-looking questions
    // out of one fact, and the fact is the asymmetry.
    //
    // THE SIZE OF THE MISS IS WHY THE TASK IS WORTH SETTING. 34/16 against
    // 33/16: an eyeballed or rounded comparison of 2.125 and 2.0625 passes, so a
    // learner who has computed 1/16 knows the identity is false in a way that
    // looking at two decimals cannot establish. A blow-up would have taught
    // less.
    //
    // IT IS A COVARIANCE AND THIS CONCEPT'S MATERIAL STILL DOES NOT SAY SO.
    // E[XY] − E[X]E[Y] is exactly the quantity `variance-and-covariance` is
    // about, and that was a node of `probability` when this task was written:
    // naming the number here would have promised an account of what it MEANS,
    // and this concept has independence as a product test and nothing more.
    //
    // THE FIFTY-FIRST PROMOTION AUTHORED THAT CONCEPT AND THE BOUNDARY IS WHY
    // THIS COMMENT IS UNCHANGED RATHER THAN DELETED. The account now exists one
    // concept up, where 1/16 doubled is the amount by which Var(X + T) exceeds
    // Var(X) + Var(T) — so the number acquired a job without this task acquiring
    // a word. Its tenth task is this same `given` at a second substitution, and
    // the pair is the comparison: 1/16 on a dependent pair here against 0 on a
    // pair one of whose members is a FUNCTION of the other there. Both prompts
    // hand the dependence over rather than computing it, and in both places the
    // product test belongs to `conditional-probability`.
    //
    // THE DEPENDENCE IS IN THE PROMPT AND IS NOT COMPUTED BY THE TASK, which is
    // the same decision as the illegal shortcut two tasks up. The product test
    // is `conditional-probability`'s and is asked there; what this task observes
    // is the consequence — that the identity needing independence fails on a
    // pair that lacks it, while the one needing nothing held.
    reference: '1/16',
    at: { k: '17', g: '12', h: '11', n: '8' },
  },
  // ── variance-and-covariance ─────────────────────────────────────────────
  //
  // TEN `evaluate` tasks, three on the first two points and FOUR on the third,
  // on the same eight sequences every concept of this subject since the fourth
  // is set on. The shapes:
  //
  //     (9*p + 1*q + 1*r + 9*s)/(4*n)            squared deviations, weighted
  //     (9 + 1 + 1 + 9)/(4*m) - …                what the plain list route costs
  //     (121*p + 9*q + 25*r + 169*s)/(64*n)      the same, for the second rule
  //     (0*p + 1*q + 4*r + 9*s)/n                the second total on its own
  //     (0*p + 1*q + 4*r + 9*s)/n - (…)*(…)      the two-total identity, at X
  //     (0*p + 1*q + 4*r + 9*s)/n - (…)*(…)      the same, at T
  //     (0*p + 4*q + 9*r + 16*s)/n - (…)*(…)     the sum's own spread
  //     (u - v - w)/d                            the shortfall, over sixty-fourths
  //     j*(a/n - (a/n)*(a/n))                    independent spreads, added
  //     k/n - (g/n)*(h/n)                        a covariance that VANISHES
  //
  // FOUR TASKS ON THE THIRD POINT RATHER THAN THREE, WHICH IS THE FIRST TIME A
  // CONCEPT IN THIS SUBJECT HAS BROKEN THE THREE-PER-POINT SHAPE. The point
  // makes three claims and not two: the spreads do not add, independence is what
  // makes them, and a vanishing joint term does not give independence back. The
  // node's own `is` promises the third one by name — "independence implying zero
  // but not conversely" — so dropping it to keep a ratio tidy would have shipped
  // a concept narrower than the map said it was. Asserted as the per-point counts
  // 3, 3, 4 in tests/concepts-logic.mjs rather than as a total over a ratio.
  //
  // THE FIFTH AND SIXTH ARE ONE EXPRESSION AT TWO SUBSTITUTIONS, AND THEY ARE A
  // PAIR FOR A THIRD REASON THIS SUBJECT HAS NOT USED. Every shared-expression
  // pair before the sixth concept was a pair because the two answers AGREE; that
  // concept's first pair is one because they DISAGREE and the disagreement is the
  // content. These two disagree — 3/4 and 47/64 — and the point is neither: each
  // half agrees with a DIFFERENT task, the first and the third, which computed
  // the same two spreads from deviations instead. So the pair is what makes the
  // identity a theorem rather than a feature of one table, and a reader can check
  // that by reading four references rather than by trusting a proof.
  //
  // THE TENTH REUSES THE NINTH TASK OF THE CONCEPT BELOW VERBATIM AS ITS `given`,
  // WHICH IS DELIBERATE AND IS THE CONVERSE DEMONSTRATION IN ITS SHARPEST FORM.
  // `k/n - (g/n)*(h/n)` is a covariance; there it is 1/16 on a pair that is
  // dependent, here it is 0 on a pair where one member is a FUNCTION of the other
  // and so is as dependent as a pair can be. Same expression, two substitutions,
  // and the one that returns ZERO is the more dependent pair — which is the whole
  // of why a vanishing covariance proves nothing. Writing a fresh expression for
  // it would have let a reader believe the two numbers came from two different
  // measurements.
  //
  // EIGHT OF THE TEN REFERENCES ARE INSIDE [0, 1], AND THE INTERVAL IS THE WRONG
  // QUESTION HERE FOR A DIFFERENT REASON FROM THE CONCEPT BELOW. That concept has
  // seven of nine OUTSIDE, because an expectation is in the units of the
  // VARIABLE. A variance is in those units SQUARED and has even less reason to be
  // at most 1 — so what puts eight of these inside is a fact about a FAIR COIN,
  // whose individual spreads are small, rather than a fact about variances.
  //
  // THE TWO OUTSIDE ARE THE TWO LARGEST QUANTITIES THE CONCEPT COMPUTES: the
  // fourth task's E[X^2] = 3, a second moment with nothing subtracted from it,
  // and the seventh task's Var(X + T) = 103/64, the spread of a SUM of two rules.
  // Everything else is one rule's spread or a difference of two things, and all
  // eight are below 1. Asserted in tests/concepts-logic.mjs by NAME in both
  // directions, and the first draft of that assertion said nine and one — the
  // check caught 103/64, which is the argument for computing a population rather
  // than counting one by eye.
  //
  // NO `state`, NO `justify`, NO `transform_to_form` and NO `counterexample`, for
  // the reasons ontology-chance.ts gives six times already — and the fourth
  // refusal is the SAME SCHEMA LIMIT the concept below recorded rather than a
  // fresh one, which is worth saying because this concept is where the kind looks
  // most askable of anywhere in the build. "Produce two variables with zero
  // covariance that are not independent" is a counterexample to a named claim and
  // the tenth task below IS that object; but ruling a learner's own answer would
  // need a space and two rules as inputs, where `PracticeTask` carries one
  // expression, one substitution and one reference. So the best question this
  // concept raises is asked in a worked example and graded as arithmetic, which
  // is the honest arrangement and not a gap to be engineered away.
  //
  // NO `domainConditions` on any of the ten. The denominators are 4n, 64n, n, d
  // and n: three are the size of a sample space, one is a literal 4 times it, and
  // `d` is a common denominator the prompt supplies as 64.
  {
    id: 'total-the-squared-deviations-weighted-by-their-own-probabilities-1',
    knowledgePointId:
      'the-spread-is-a-weighted-total-of-squared-deviations-so-the-table-decides-it-and-not-the-value-list',
    kind: 'evaluate',
    prompt:
      'A fair coin is tossed three times, so the sample space is the eight equally likely '
      + 'sequences, X is the number of heads with preimages 1, 3, 3, 1 at the values 0, 1, 2, 3, '
      + 'and `expectation` put E[X] at 3/2. The deviations of the four values from 3/2 are '
      + '-3/2, -1/2, 1/2 and 3/2, so their squares are 9/4, 1/4, 1/4 and 9/4 — four odd squares '
      + 'over a common 4. Total those squares weighted by their own probabilities, which is the '
      + 'variance. Evaluate (9*p + 1*q + 1*r + 9*s)/(4*n) at p = 1, q = 3, r = 3, s = 1, n = 8, '
      + 'where the literals 9, 1, 1, 9 are the squared deviations in quarters and p, q, r, s are '
      + 'the preimage sizes behind the values they belong to.',
    given: '(9*p + 1*q + 1*r + 9*s)/(4*n)',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (9 × 1 + 1 × 3 + 1 × 3 + 9 × 1)/(4 × 8) = 24/32 = 3/4.
    //
    // THE SAME FIVE INPUTS AS THE FIRST TWO TASKS OF THE CONCEPT BELOW, AND THE
    // COEFFICIENTS ARE THE WHOLE DIFFERENCE — which is the third time this
    // subject has made that comparison with one substitution. `(p+q+r+s)/n` is
    // 1 and says the values partition the space; `(0*p + 1*q + 2*r + 3*s)/n` is
    // 3/2 and says the table has a centre; this is 3/4 and says how far from it
    // the table sits. One division each, five identical inputs, and a reader can
    // see that each new question is a change of coefficient and nothing else.
    //
    // THE EXTRA 4 UNDERNEATH IS THE SQUARING AND IS NOT A TIDY-UP. The squared
    // deviations are quarters, so they are carried as integers over a common 4
    // rather than as 9/4 and 1/4 inside the brackets — which keeps the five
    // inputs the same shape as every other task on this table, and keeps the
    // whole calculation in integers until the single division at the end.
    //
    // THE ZERO TERM IS GONE, UNLIKE EVERY OTHER TASK ON THIS TABLE, AND THAT IS
    // NOT THE SAME SLIP. `sigma-notation`'s four-terms-not-three point is why
    // the concept below writes `0*p` out; here there is no zero coefficient to
    // write, because the value 0 is 3/2 away from the mean and contributes the
    // LARGEST square. So the four terms are visibly four, and the term a learner
    // might drop is the one carrying the most weight.
    reference: '3/4',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'measure-what-the-plain-list-route-costs-at-the-second-moment-1',
    knowledgePointId:
      'the-spread-is-a-weighted-total-of-squared-deviations-so-the-table-decides-it-and-not-the-value-list',
    kind: 'evaluate',
    prompt:
      'Read 0, 1, 2, 3 as a plain list of four numbers rather than as the values of a rule, the '
      + 'way `descriptive-statistics` does. Their mean is 6/4 = 3/2, the same centre, so the '
      + 'squared deviations are the same 9, 1, 1, 9 over 4 — but now each is counted once and '
      + 'the total is divided by how many there are. That route found the right ANSWER for E[X] '
      + 'one concept down, because this table is symmetric. Find how far it overshoots the '
      + 'variance. Evaluate (9 + 1 + 1 + 9)/(4*m) - (9*p + 1*q + 1*r + 9*s)/(4*n) at m = 4, '
      + 'p = 1, q = 3, r = 3, s = 1, n = 8.',
    given: '(9 + 1 + 1 + 9)/(4*m) - (9*p + 1*q + 1*r + 9*s)/(4*n)',
    variables: A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE,
    // 20/16 − 24/32 = 5/4 − 3/4 = 1/2.
    //
    // THE SAME SHAPE AS `A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE` ONE CONCEPT
    // DOWN, AT THE SAME SUBSTITUTION, AND THE ANSWER IS WHERE THEY PART. That
    // task had to be asked on T, because on X the two routes agree and the
    // reference would have been 0 — "a true statement that teaches the opposite
    // of the point", as its own note says. This one is asked ON X deliberately
    // and is NOT zero. Same table, same symmetry, same two routes, and the gap
    // is 0 at the first moment and 1/2 at the second: that is the whole claim of
    // this concept's first point, as two references rather than as a sentence.
    //
    // SO THE DECISION THE EARLIER TASK EXPLAINS IS REVERSED HERE FOR THE REASON
    // IT GAVE. It avoided X because a zero there would teach that the weights do
    // not matter; the zero was a fact about first moments, and asking the same
    // question at the second moment on the same table is what shows that.
    //
    // `m` IS DECLARED AND IS 4 BECAUSE THE LIST HAS FOUR ENTRIES, which is the
    // divisor `descriptive-statistics` argues about at length — n and not n − 1.
    // Here the comparison needs it visible: the right-hand term has no divisor
    // beyond the size of the space, and the contrast between the two halves is
    // exactly that one of them still has an averaging step to perform.
    //
    // THE NUMERATOR `9 + 1 + 1 + 9` IS LEFT UNEVALUATED rather than written as
    // 20, for the reason the earlier task leaves `0 + 1 + 2 + 3` standing: the
    // two halves have to be seen to be reading the same four squares.
    reference: '1/2',
    at: { m: '4', p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'total-the-squared-deviations-for-the-second-rule-1',
    knowledgePointId:
      'the-spread-is-a-weighted-total-of-squared-deviations-so-the-table-decides-it-and-not-the-value-list',
    kind: 'evaluate',
    prompt:
      'Keep the same eight sequences and take T, the toss the first head appears on with T = 0 '
      + 'at TTT. Its preimages are 1, 4, 2, 1 over 8 at the same values 0, 1, 2, 3, and '
      + '`expectation` put E[T] at 11/8. So T\'s deviations are -11/8, -3/8, 5/8 and 13/8, and '
      + 'the squares are 121, 9, 25 and 169 over a common 64. Total them weighted by T\'s own '
      + 'probabilities. Evaluate (121*p + 9*q + 25*r + 169*s)/(64*n) at p = 1, q = 4, r = 2, '
      + 's = 1, n = 8, and compare it with what the plain list route gave for X.',
    given: '(121*p + 9*q + 25*r + 169*s)/(64*n)',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (121 × 1 + 9 × 4 + 25 × 2 + 169 × 1)/(64 × 8) = (121 + 36 + 50 + 169)/512
    // = 376/512 = 47/64.
    //
    // NOT THE SAME EXPRESSION AS THE FIRST TASK, AND THE REASON IS THE CONTENT.
    // The pattern this subject reaches for is one expression at two
    // substitutions, and it is unavailable here: X and T have DIFFERENT means, so
    // their squared deviations are different numbers and the coefficients cannot
    // be shared. That is worth noticing rather than working around — the
    // coefficients being literals is what made the sixth concept's pair
    // readable, and the same choice makes this pair impossible. The identity in
    // the second point is what restores it, which is why the fifth and sixth
    // tasks ARE one expression twice.
    //
    // THE DENOMINATOR IS 64 AND NOT 4 FOR THE SAME REASON THE FIRST TASK'S IS 4:
    // the deviations are eighths here, so the squares are sixty-fourths. A reader
    // comparing the two tasks is meant to see that the common denominator is
    // decided by the mean and not by the rule.
    //
    // AND THE REFERENCE IS THE SECOND HALF OF THE POINT'S CLAIM. The plain list
    // variance of T's values is the same 5/4 it was for X, because T takes the
    // same four values — so 5/4 is wrong for both rules here, where the plain
    // AVERAGE was wrong only for T. The two tasks above and this one are the
    // three references that say so.
    reference: '47/64',
    at: { p: '1', q: '4', r: '2', s: '1', n: '8' },
  },
  {
    id: 'total-the-squared-rule-over-the-table-1',
    knowledgePointId:
      'the-spread-is-the-second-total-minus-the-square-of-the-first-and-that-gap-measures-a-forbidden-push-through',
    kind: 'evaluate',
    prompt:
      'Same three tosses, same X with preimages 1, 3, 3, 1 over 8 at 0, 1, 2, 3. X^2 is a '
      + 'function of X and so a random variable on the same space; squaring is one-to-one on 0, '
      + '1, 2, 3, so nothing merges and the probabilities travel unchanged to the values 0, 1, '
      + '4, 9. Total that table the ordinary way. Evaluate (0*p + 1*q + 4*r + 9*s)/n at p = 1, '
      + 'q = 3, r = 3, s = 1, n = 8, and then compare your answer with (E[X])^2 = 9/4.',
    given: '(0*p + 1*q + 4*r + 9*s)/n',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (0 × 1 + 1 × 3 + 4 × 3 + 9 × 1)/8 = (0 + 3 + 12 + 9)/8 = 24/8 = 3.
    //
    // THE CONCEPT BELOW'S FIRST EXPRESSION WITH THE VALUES SQUARED, which is the
    // cheapest possible statement of what a second moment is. `(0*p + 1*q + 2*r
    // + 3*s)/n` is 3/2; this is the same five inputs with 0, 1, 2, 3 replaced by
    // 0, 1, 4, 9 and it is 3. A reader can see that nothing about the WEIGHTING
    // changed, which is the half of the comparison the next task needs.
    //
    // IT IS ONE OF THE TWO REFERENCES IN THIS CONCEPT OUTSIDE [0, 1], AND THAT IS
    // THE RULE RATHER THAN AN EXCEPTION. A variance is in the units of the
    // variable SQUARED, so nothing here has a reason to be at most 1 — what keeps
    // the other eight inside is that a fair coin's spreads happen to be small.
    // This one is a second moment with nothing subtracted from it, and a second
    // moment of a count reaching 3 cannot be small. The other is the seventh
    // task, the spread of a SUM. Asserted both ways and by name in
    // tests/concepts-logic.mjs, since a rule true by accident on eight tasks
    // would otherwise look like a rule.
    //
    // THE ZERO TERM IS WRITTEN OUT, for the reason the concept below gives: there
    // are FOUR values and therefore four terms, and X = 0 is a value X takes
    // rather than a row that is not there. Here 0 squared is still 0, so dropping
    // it would give the same 3 — which is exactly the slip an expression that
    // drops it would teach.
    reference: '3',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'reach-the-spread-from-two-totals-1',
    knowledgePointId:
      'the-spread-is-the-second-total-minus-the-square-of-the-first-and-that-gap-measures-a-forbidden-push-through',
    kind: 'evaluate',
    prompt:
      'Now put the two totals together. Var(X) = E[X^2] - (E[X])^2 says the spread is the '
      + 'second total minus the square of the first, with no deviation computed and nothing '
      + 'subtracted from any value. Both totals read the same five inputs: the squared values '
      + '0, 1, 4, 9 give one and the values 0, 1, 2, 3 give the other. Evaluate '
      + '(0*p + 1*q + 4*r + 9*s)/n - ((0*p + 1*q + 2*r + 3*s)/n)*((0*p + 1*q + 2*r + 3*s)/n) '
      + 'at p = 1, q = 3, r = 3, s = 1, n = 8, and check it against the variance the first '
      + 'point produced from four squared deviations.',
    given:
      '(0*p + 1*q + 4*r + 9*s)/n - ((0*p + 1*q + 2*r + 3*s)/n)*((0*p + 1*q + 2*r + 3*s)/n)',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // 24/8 − (12/8)(12/8) = 3 − 9/4 = 12/4 − 9/4 = 3/4.
    //
    // THE TABLE APPEARS THREE TIMES AND IS NOT ABBREVIATED, which is the same
    // decision as `A_LINEAR_RULE_OUTSIDE_A_WHOLE_TABLE` one concept down and for
    // the same reason. An expression taking E[X] as a single letter would be
    // shorter and would assert nothing: the content is that TWO totals over one
    // table decide the spread, and only a shape with both totals written out says
    // which two. A learner looking at `e2 - e*e` cannot see that the second
    // factor is the first point's answer.
    //
    // AND THE SECOND FACTOR IS WRITTEN TWICE RATHER THAN SQUARED, deliberately.
    // `exactValue` would settle a `^2` perfectly well, so this is not a limit of
    // the evaluator; it is that the whole concept is about the difference between
    // squaring a total and totalling squares, and an expression using the same
    // notation for both would make that difference typographical. Written out,
    // the left term squares four VALUES and the right term squares one TOTAL, and
    // nothing has to be said about which is which.
    //
    // IT AGREES WITH THE FIRST TASK AND THAT IS THE POINT OF ASKING IT. 3/4 twice
    // by two routes with no step in common: four subtractions, four squarings and
    // a weighted total there, two weighted totals and one multiplication here.
    reference: '3/4',
    at: { p: '1', q: '3', r: '3', s: '1', n: '8' },
  },
  {
    id: 'reach-the-spread-from-two-totals-for-the-second-rule-1',
    knowledgePointId:
      'the-spread-is-the-second-total-minus-the-square-of-the-first-and-that-gap-measures-a-forbidden-push-through',
    kind: 'evaluate',
    prompt:
      'Run the SAME expression on T, whose preimages are 1, 4, 2, 1 over 8 at the same values '
      + '0, 1, 2, 3. Nothing about the expression changes — the values of T are the values of X '
      + 'and so are their squares, and only the four preimage sizes are different. Evaluate '
      + '(0*p + 1*q + 4*r + 9*s)/n - ((0*p + 1*q + 2*r + 3*s)/n)*((0*p + 1*q + 2*r + 3*s)/n) '
      + 'at p = 1, q = 4, r = 2, s = 1, n = 8, and check it against the 47/64 the third task '
      + 'produced from T\'s squared deviations.',
    given:
      '(0*p + 1*q + 4*r + 9*s)/n - ((0*p + 1*q + 2*r + 3*s)/n)*((0*p + 1*q + 2*r + 3*s)/n)',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // 21/8 − (11/8)(11/8) = 168/64 − 121/64 = 47/64.
    //
    // ONE EXPRESSION, TWO SUBSTITUTIONS, AND THE PAIR IS A PAIR FOR A THIRD
    // REASON. Every shared-expression pair before the sixth concept exists
    // because the two answers AGREE; that concept's exists because they DISAGREE
    // and the disagreement is the content. These two disagree too — 3/4 and 47/64
    // — but the disagreement is not what is being shown. Each half agrees with a
    // DIFFERENT earlier task on this concept, the first and the third, which
    // reached the same two numbers from deviations. So four references close two
    // loops, and the identity is a theorem rather than a feature of X's table.
    //
    // AND THE SUBSTITUTION IS WHY THE FIRST POINT COULD NOT HAVE A PAIR. T's
    // deviations are eighths where X's are halves, so the squared-deviation
    // expressions cannot share coefficients and the first and third tasks are
    // necessarily two expressions. This identity reads only the values and the
    // table, never the mean, so the mean moving costs it nothing — which is a
    // second thing the short route buys and is the reason to ask it twice.
    reference: '47/64',
    at: { p: '1', q: '4', r: '2', s: '1', n: '8' },
  },
  {
    id: 'find-the-spread-of-the-sum-from-its-own-table-1',
    knowledgePointId:
      'the-spreads-add-exactly-when-the-joint-term-vanishes-and-independence-is-enough-for-that-but-is-not-needed-by-it',
    kind: 'evaluate',
    prompt:
      'Let S = X + T on the same eight sequences. `expectation` built S\'s table by evaluating '
      + 'the sum on each sequence: S takes 0 once, 2 once, 3 three times and 4 three times, '
      + 'skipping the value 1 entirely, so its preimages are 1, 1, 3, 3 over 8 and E[S] = 23/8. '
      + 'Use the two-total identity from the point below on S itself — its squared values are 0, '
      + '4, 9, 16. Evaluate '
      + '(0*p + 4*q + 9*r + 16*s)/n - ((0*p + 2*q + 3*r + 4*s)/n)*((0*p + 2*q + 3*r + 4*s)/n) '
      + 'at p = 1, q = 1, r = 3, s = 3, n = 8.',
    given:
      '(0*p + 4*q + 9*r + 16*s)/n - ((0*p + 2*q + 3*r + 4*s)/n)*((0*p + 2*q + 3*r + 4*s)/n)',
    variables: A_TABLE_AND_THE_SPACE_IT_CAME_FROM,
    // (0 + 4 + 27 + 48)/8 − (23/8)(23/8) = 79/8 − 529/64 = 632/64 − 529/64
    // = 103/64.
    //
    // THE SAME SHAPE AS THE TWO TASKS ABOVE WITH S'S VALUE LIST IN IT, which is
    // what makes the identity's generality visible: the values 0, 2, 3, 4 and
    // their squares 0, 4, 9, 16 are different literals in the same frame. A
    // reader who has done the fifth and sixth tasks has nothing new to learn
    // here, and that is deliberate — the work of this task is the COMPARISON in
    // the task after it, and this one is the input to it.
    //
    // THE VALUE 1 IS ABSENT FROM THE LITERALS AND THAT IS THE TABLE BEING RIGHT,
    // not a term dropped. S skips 1 — a sequence cannot have no heads and a first
    // head on toss one — which the concept below names and which its eighth task
    // also shows. Four values, four terms, and the gap is in the value list
    // rather than in the expression.
    //
    // 103/64 IS THE SECOND OF THE TWO REFERENCES HERE ABOVE 1, which the fourth
    // task's comment names as well. It is above 1 for the dull reason — adding
    // two rules on one space adds their spreads and then some — and that is
    // exactly why the interval says nothing about this concept: eight of the ten
    // sit inside it because a fair coin's individual spreads are small, not
    // because a variance has any business being at most 1.
    reference: '103/64',
    at: { p: '1', q: '1', r: '3', s: '3', n: '8' },
  },
  {
    id: 'measure-the-shortfall-the-two-spreads-leave-1',
    knowledgePointId:
      'the-spreads-add-exactly-when-the-joint-term-vanishes-and-independence-is-enough-for-that-but-is-not-needed-by-it',
    kind: 'evaluate',
    prompt:
      'You now have three spreads on one space, each over sixty-fourths: Var(X + T) = 103/64 '
      + 'from the task before, Var(X) = 3/4 = 48/64 from the first point and '
      + 'Var(T) = 47/64 from the third task. Expectations added across these two rules with '
      + 'nothing checked first. Find out whether the spreads do. Evaluate (u - v - w)/d at '
      + 'u = 103, v = 48, w = 47, d = 64, and then recall that `expectation`\'s ninth task '
      + 'computed E[XT] - E[X]E[T] = 1/16 as the amount by which the MULTIPLICATIVE rule missed '
      + 'on this same pair.',
    given: '(u - v - w)/d',
    variables: THREE_SPREADS_OVER_A_COMMON_DENOMINATOR,
    // (103 − 48 − 47)/64 = 8/64 = 1/8, which is twice the 1/16 the concept below
    // computed and declined to name.
    //
    // THE THREE NUMERATORS ARE ANSWERS TO OTHER TASKS AND THAT IS THE DESIGN.
    // Rebuilding the three variances inside this expression would ask the fifth,
    // sixth and seventh tasks again and bury the only question this one has:
    // whether three numbers already in hand are consistent with the spreads
    // adding. Over a common denominator of 64 that is one subtraction, 103
    // against 95.
    //
    // AND THE REFERENCE IS TWICE A NUMBER FROM THE CONCEPT BELOW, WHICH IS WHY
    // THE TASK IS WORTH SETTING RATHER THAN STATING. That concept's ninth task
    // answers 1/16 and its notes say outright that the quantity is a covariance
    // and that naming it would promise an account the subject did not have. This
    // is the account, as a reference: 2 × 1/16 = 1/8 is exactly what the two
    // spreads are short by. A learner who has produced both numbers has closed
    // the loop themselves, and nothing in either prompt had to assert the
    // identity for them.
    //
    // `d` IS DECLARED RATHER THAN WRITTEN AS 64 so that the expression says what
    // it is doing: three quantities put over one denominator and subtracted,
    // which is the step `fraction-arithmetic` supplies and the same step the
    // concept below leans on for `(g + h)/n`.
    reference: '1/8',
    at: { u: '103', v: '48', w: '47', d: '64' },
  },
  {
    id: 'add-the-spreads-of-three-independent-rules-1',
    knowledgePointId:
      'the-spreads-add-exactly-when-the-joint-term-vanishes-and-independence-is-enough-for-that-but-is-not-needed-by-it',
    kind: 'evaluate',
    prompt:
      'Now take three rules that ARE independent. Let A be 1 if the first toss is heads and 0 if '
      + 'not, and let B and C say the same of the second and third tosses. A + B + C counts the '
      + 'heads on every one of the eight sequences, so it IS X. Each takes only 0 and 1, so each '
      + 'is its own square, so E[A^2] = E[A] and the two-total identity collapses to one '
      + 'subtraction. A is 1 on 4 of the 8 sequences, and the product test passes on every pair '
      + '— P(A = 1)P(B = 1) = 1/4 and P(A = 1 and B = 1) is HHH and HHT over eight, also 1/4 — '
      + 'so every covariance is 0 and the three spreads add. Evaluate j*(a/n - (a/n)*(a/n)) at '
      + 'j = 3, a = 4, n = 8, and compare it with Var(X) from the first point.',
    given: 'j*(a/n - (a/n)*(a/n))',
    variables: ONE_INDICATOR_SPREAD_TAKEN_SEVERAL_TIMES,
    // 3(4/8 − (4/8)(4/8)) = 3(1/2 − 1/4) = 3(1/4) = 3/4.
    //
    // A THIRD ROUTE TO 3/4, AND THE ONLY ONE THAT NEVER LOOKS AT THE TABLE. The
    // first task totals four squared deviations weighted by four probabilities;
    // the fifth totals the table twice; this multiplies one indicator's spread by
    // three. Three references all reading 3/4 with no step shared between the
    // first and the last, which is what a decomposition claim is worth asserting
    // as.
    //
    // THE INNER BRACKET IS THE POINT BELOW'S IDENTITY AT A VARIABLE EQUAL TO ITS
    // OWN SQUARE, written out rather than folded to 1/4. `a/n - (a/n)*(a/n)` is
    // E[A^2] − (E[A])^2 with E[A^2] replaced by E[A], which is legitimate only
    // because A takes 0 and 1 and nothing else — so the shape carries its own
    // hypothesis. A bare 1/4 would have asked a learner to multiply by three.
    //
    // THE INDEPENDENCE IS IN THE PROMPT AND IS NOT COMPUTED BY THE TASK, the same
    // decision the concept below makes about the dependence of X and T. The
    // product test is `conditional-probability`'s and is asked there; what this
    // task observes is the consequence — that the spreads add exactly where that
    // test passes, having fallen 1/8 short one task earlier where it failed.
    //
    // `j` IS A LETTER BECAUSE THE CLAIM IS QUANTIFIED OVER IT. What is being
    // asserted is that independent spreads add, so how many are being added is
    // the parameter; three is this experiment's answer, not the theorem's.
    reference: '3/4',
    at: { j: '3', a: '4', n: '8' },
  },
  {
    id: 'compute-a-covariance-that-vanishes-on-a-dependent-pair-1',
    knowledgePointId:
      'the-spreads-add-exactly-when-the-joint-term-vanishes-and-independence-is-enough-for-that-but-is-not-needed-by-it',
    kind: 'evaluate',
    prompt:
      'Independence makes the covariance 0. Ask whether it goes the other way. Take Y = |2X - 3|, '
      + 'the margin `random-variables` built from X, which is 3, 1, 1, 3 as X runs 0 to 3 — so Y '
      + 'is DETERMINED by X and there is no stronger dependence than that. '
      + '`conditional-probability`\'s product test agrees: P(X = 0) = 1/8 and P(Y = 3) = 1/4 '
      + 'multiply to 1/32, while P(X = 0 and Y = 3) is just P(X = 0) = 1/8, since X = 0 forces '
      + 'Y = 3. Across the eight sequences XY is 9, 2, 2, 1, 2, 1, 1, 0, which totals 18, X '
      + 'totals 12, and Y totals 12 since `expectation` put E[Y] at 3/2. Evaluate the SAME '
      + 'expression that concept\'s ninth task used, k/n - (g/n)*(h/n), at k = 18, g = 12, '
      + 'h = 12, n = 8.',
    given: 'k/n - (g/n)*(h/n)',
    variables: A_PRODUCT_TOTAL_AGAINST_A_PRODUCT_OF_TOTALS,
    // 18/8 − (12/8)(12/8) = 9/4 − 9/4 = 0.
    //
    // THE SAME `given` AS THE NINTH TASK OF THE CONCEPT BELOW, VERBATIM, AND THE
    // PAIR IS THE CONVERSE IN ITS SHARPEST FORM. There the substitution is
    // (17, 12, 11, 8) and the answer is 1/16 on a pair that is dependent; here it
    // is (18, 12, 12, 8) and the answer is 0 on a pair where one member is a
    // FUNCTION of the other. Same expression, two substitutions, and the one that
    // returns ZERO is the MORE dependent pair. A fresh expression would have let
    // a reader believe the two numbers came from two different measurements, and
    // the whole argument is that they come from one.
    //
    // THE LETTERS MEAN WHAT THEY MEAN THERE, which is why the declaration is
    // shared rather than copied: g is the total of X over the eight sequences and
    // is 12 in both tasks, n is the size of the space, and only k and h move.
    // That is also how a reader sees that Y and T are different rules with the
    // same total — E[Y] and E[X] are both 3/2, which the concept below flags as a
    // coincidence, and it is the reason h is 12 here and 11 there.
    //
    // THE REFERENCE IS 0 AND IS THE ANSWER RATHER THAN A FAILURE TO FIND ONE.
    // `descriptive-statistics` has the other zero of this kind — the signed
    // deviations of any list cancel — and the two are worth reading together:
    // there a zero shows a method measures nothing, and here it shows a method
    // measures something NARROWER than it is taken to measure. A covariance
    // detects joint movement that is on average and in a straight line, and Y
    // follows the DISTANCE of X from 3/2 rather than X, so on a table symmetric
    // about 3/2 the rises and falls cancel exactly.
    //
    // THE DEPENDENCE IS IN THE PROMPT AND IS NOT COMPUTED, as in the task below
    // and in the one two above. The product test is run in the worked example of
    // this point and in no task of this concept, which is the fact the credit
    // edge in ontology-chance.ts turns on: `conditional-probability` comes due as
    // though untouched.
    reference: '0',
    at: { k: '18', g: '12', h: '12', n: '8' },
  },

  // ── discrete-distributions ──────────────────────────────────────────────
  //
  // TEN `evaluate` tasks, three on the first point, FOUR on the second and
  // three on the third. The shapes:
  //
  //     b/m - (b/m)*(b/m)                        one trial's spread, at a weight
  //     b/m - (b/m)*(b/m)                        the same, at a second weight
  //     1/4 - (b/m - (b/m)*(b/m))                how far that is below the bound
  //     c*(b/m)*((m - b)/m)*((m - b)/m)          one binomial entry, at a half
  //     c*(b/m)*((m - b)/m)*((m - b)/m)          the same, at a third
  //     q^3 + 3pq^2 + 3p^2q + p^3 written out    the whole table, totalling 1
  //     (0 + 1 + 2 + 3)/v - j*(b/m)              the dead coincidence, measured
  //     1 - (p + qp + q^2 p) written out         the wait outlasting three trials
  //     (b/m)*((b - 1)/(m - 1))*((b - 2)/(m - 2))   drawn at once
  //     (b/m)*(b/m)*(b/m)                        put back
  //
  // FOUR TASKS ON THE SECOND POINT, WHICH IS THE SECOND TIME THIS SUBJECT HAS
  // BROKEN THREE-PER-POINT AND THE FIRST TIME IT WAS BROKEN TO MAKE A `links`
  // ENTRY LOAD-BEARING. The seventh concept took a fourth task because its
  // point made three claims and the map node promised the third by name. This
  // point makes four: the entry is a count times a price, both parameters move,
  // the table totals 1 by the binomial theorem, and the agreement two concepts
  // down was the fair coin. The THIRD of those is the one that would have been
  // dropped on a tidy ratio — and `binomial-theorem` is this promotion's one
  // stranded prerequisite, filed as `PROBABILITY.links`' sixth entry, so
  // dropping it would have left that gate standing over nothing graded. The
  // fifty-first's credit-edge note is where that test comes from: what decides
  // whether a prerequisite is real is whether anything GRADED rests on it.
  // Asserted as the per-point counts 3, 4, 3 rather than as a total over a
  // ratio.
  //
  // THE FIRST TWO AND THE FOURTH AND FIFTH ARE TWO EXPRESSIONS AT TWO
  // SUBSTITUTIONS EACH, AND THE REASON IS NEW TO THE SUBJECT. Every earlier pair
  // here is a pair because its two answers agree, or because they disagree and
  // the disagreement is the content. These two are pairs because THE
  // SUBSTITUTION IS THE SUBJECT MATTER: a family is what you get when a number
  // in the formula is allowed to move, so a concept about families has to ask at
  // least one question twice or it has only described one. 2/9 against 4/25 and
  // 3/8 against 4/9 are the smallest possible demonstration that the formula
  // outlives the member.
  //
  // AND THE NINTH AND TENTH ARE THE INVERSE SHAPE — ONE SUBSTITUTION, TWO
  // EXPRESSIONS — WHICH NOTHING IN THIS SUBJECT HAS DONE BEFORE. Both are asked
  // at b = 5, m = 12: five new members among twelve. The ninth multiplies three
  // factors with the pool shrinking, giving 1/22, and the tenth multiplies the
  // same factor three times, giving 125/1728. Same experiment in words, same two
  // inputs, two different answers — which is the third point's claim stated as
  // arithmetic rather than as prose, and which no one-expression pair could say.
  //
  // THE SIXTH IS THE ONLY TASK IN THE SUBJECT WHOSE REFERENCE IS 1, and that is
  // not a free mark. `random-variables`' first task is `(p+q+r+s)/n` and also
  // answers 1, by adding four preimage sizes and dividing by the size of the
  // space — a fact about ONE table. This one expands (q + p)^3 at a weight that
  // is not a half, so the four terms are 8/27, 12/27, 6/27 and 1/27 and the
  // total being 1 is the binomial theorem rather than a partition. A learner who
  // writes 1 without computing has guessed; the four terms are what the task is,
  // which is why the coefficients 1, 3, 3, 1 are left standing as literals
  // exactly as `(9 + 1 + 1 + 9)` is left standing two concepts down.
  //
  // ALL TEN REFERENCES ARE INSIDE [0, 1], WHICH NO OTHER CONCEPT OF THIS SUBJECT
  // MANAGES AND WHICH IS A FACT ABOUT KIND RATHER THAN SIZE. The sixth concept
  // has seven of nine OUTSIDE, because an expectation is in the units of the
  // variable; the seventh has two of ten outside, and its own note says what
  // keeps the other eight in is "a fact about a FAIR COIN, whose individual
  // spreads are small, rather than a fact about variances". Here the reason is
  // the opposite kind of reason: eight of the ten references ARE probabilities,
  // so the first concept's axioms put them in [0, 1] and no substitution could
  // take them out, and the other two are a Bernoulli variance and a distance
  // between two of them — p(1 - p) is a product of two probabilities and
  // 1/4 - p(1 - p) is a square. So this is the first concept in the subject
  // where the interval is settled by what the quantities ARE.
  //
  // NO `state`, NO `justify`, NO `transform_to_form` and NO `counterexample`,
  // for the reasons ontology-chance.ts gives seven times already — and the
  // `transform_to_form` refusal is sharper here than anywhere, because
  // `completed_square` EXISTS as a NamedForm and the first point completes a
  // square. "Write p - p^2 as a quarter minus a square" would be a real
  // `transform_to_form` task with a real checker. It is not asked, and the
  // reason is this subject's contract rather than the schema: every task here is
  // settled by exact rational arithmetic with no worker, and `ruleTransform`
  // needs an equivalence check that a CAS supplies. A subject whose
  // prerequisites are a set and a fraction must not be walled off by an outage,
  // which is the property the six concepts below are built on. So the completed
  // square is derived in a worked example and graded through the number it
  // produces — the third task is 1/36, which is (1/3 - 1/2)^2 — and that is the
  // honest arrangement rather than a gap to engineer away.
  //
  // NO `domainConditions` on any of the ten. The denominators are m, 4, v,
  // m - 1 and m - 2: three are the stated denominator of a weight, one is the
  // length of a value list, and the two descending ones are the pool after one
  // and after two draws, which the prompt fixes at 11 and 10.
  {
    id: 'spread-of-one-weighted-trial-1',
    knowledgePointId:
      'one-weighted-trial-is-the-smallest-member-and-the-parameter-is-what-makes-a-bound-statable',
    kind: 'evaluate',
    prompt:
      'A single trial succeeds with probability b/m and fails with probability (m - b)/m. Let A '
      + 'be 1 on a success and 0 on a failure. E[A] = b/m, and A takes only 0 and 1, so A^2 is '
      + 'the same rule as A and E[A^2] = b/m as well — which is why '
      + '`variance-and-covariance`\'s identity collapses to one subtraction here. Find Var(A) '
      + 'when the trial succeeds one time in three. Evaluate b/m - (b/m)*(b/m) at b = 1, m = 3.',
    given: 'b/m - (b/m)*(b/m)',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // 1/3 − (1/3)(1/3) = 3/9 − 1/9 = 2/9. Equivalently (1/3)(2/3).
    //
    // THE SEVENTH CONCEPT'S NINTH TASK WITH THE COUNT REMOVED AND THE WEIGHT
    // FREED. That one is `j*(a/n - (a/n)*(a/n))` at (3, 4, 8) and answers 3/4,
    // where `a/n` can only be 4/8 because it counts sequences of a fixed space.
    // This is the same bracket with `b/m` in place of `a/n` and no multiplier,
    // so the arithmetic is identical and the STATUS of the number is not: there
    // a weight is a fact about eight sequences, here it is an input.
    //
    // THE SUBTRACTION IS LEFT STANDING RATHER THAN WRITTEN AS `(b/m)*((m-b)/m)`,
    // which is the same decision that declaration makes and for the same
    // reason. The product is the tidier form and says nothing; the subtraction
    // is the two-total identity visible, and a reader can see that the reason it
    // is one subtraction rather than two tables is A^2 = A.
    reference: '2/9',
    at: { b: '1', m: '3' },
  },
  {
    id: 'spread-of-one-weighted-trial-at-a-second-weight-1',
    knowledgePointId:
      'one-weighted-trial-is-the-smallest-member-and-the-parameter-is-what-makes-a-bound-statable',
    kind: 'evaluate',
    prompt:
      'Same single trial and the same expression, with the weight moved: the trial now succeeds '
      + 'one time in five. Evaluate b/m - (b/m)*(b/m) at b = 1, m = 5, and say which of this and '
      + 'the previous answer is the larger and which weight sits further from a half.',
    given: 'b/m - (b/m)*(b/m)',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // 1/5 − (1/5)(1/5) = 5/25 − 1/25 = 4/25. Equivalently (1/5)(4/5).
    //
    // ONE EXPRESSION AT TWO SUBSTITUTIONS, AND FOR A REASON THE SUBJECT HAS NOT
    // USED. The earlier pairs here are pairs because their answers agree, or
    // because they disagree and the disagreement is the content. This pair is
    // one because the SUBSTITUTION is the subject matter: a family is a formula
    // with a number in it allowed to move, so a concept about families that
    // asked every question once would have described a member.
    //
    // 4/25 AGAINST 2/9 IS 144 AGAINST 200 OVER 900, both under 1/4's 225, so the
    // pair is also the evidence the sixth subgoal then turns into a proof. Two
    // points below 1/4 are consistent with any number of shapes; the completed
    // square is what settles it, and the third task is where that gets a number.
    reference: '4/25',
    at: { b: '1', m: '5' },
  },
  {
    id: 'distance-from-the-most-uncertain-single-trial-1',
    knowledgePointId:
      'one-weighted-trial-is-the-smallest-member-and-the-parameter-is-what-makes-a-bound-statable',
    kind: 'evaluate',
    prompt:
      'Completing the square turns b/m - (b/m)^2 into 1/4 - (b/m - 1/2)^2, so a single trial\'s '
      + 'spread can never be more than 1/4 and is 1/4 only for a fair trial. Find how far below '
      + 'that bound the one-in-three trial sits. Evaluate 1/4 - (b/m - (b/m)*(b/m)) at b = 1, '
      + 'm = 3, and check your answer against (1/3 - 1/2)^2.',
    given: '1/4 - (b/m - (b/m)*(b/m))',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // 1/4 − 2/9 = 9/36 − 8/36 = 1/36. And (1/3 − 1/2)² = (−1/6)² = 1/36, so the
    // completed square is checked by the answer rather than asserted beside it.
    //
    // THE REFERENCE IS A GAP, like four in the two concepts below and for a
    // fifth distinct reason. Those gaps are between two SPACES, between two
    // METHODS on one table, between two sides of a FALSE identity, and between
    // two sides of a TRUE identity with a term left out. This one is between a
    // member and the MAXIMUM OF ITS FAMILY — a quantity that does not exist
    // until a parameter does, which is the sharpest available statement of what
    // this concept adds to the seven below it.
    //
    // ASKED AS 1/4 MINUS THE VARIANCE RATHER THAN AS THE SQUARE DIRECTLY, which
    // is what makes it a check instead of a restatement. `(b/m - 1/2)^2` at
    // (1, 3) would also answer 1/36 and would have asked nothing: it is the
    // right-hand side of the identity evaluated at a point. Going round the
    // other way — compute the variance, subtract it from the bound — produces
    // the same 1/36 only if the identity holds, so one evaluation verifies it.
    reference: '1/36',
    at: { b: '1', m: '3' },
  },
  {
    id: 'one-binomial-entry-at-the-subjects-own-weight-1',
    knowledgePointId:
      'counting-several-trials-indexes-the-family-by-two-parameters-and-the-binomial-theorem-forces-the-total',
    kind: 'evaluate',
    prompt:
      'Three independent trials each succeed with probability b/m, and X counts the successes. '
      + 'One run with exactly one success costs (b/m) for the success and (m - b)/m for each of '
      + 'the two failures, and `counting-principles` puts the number of such runs at C(3, 1) = 3 '
      + '— which is the coefficient c below. Find P(X = 1) for a fair coin. Evaluate '
      + 'c*(b/m)*((m - b)/m)*((m - b)/m) at c = 3, b = 1, m = 2, and compare it with the entry at '
      + 'the value 1 in the table `random-variables` built by collecting preimages.',
    given: 'c*(b/m)*((m - b)/m)*((m - b)/m)',
    variables: A_COUNT_OF_RUNS_AND_THE_WEIGHT_THEY_COST,
    // 3 × (1/2) × (1/2) × (1/2) = 3/8, which is the second entry of the table
    // 1/8, 3/8, 3/8, 1/8 that the fifth concept obtained from the eight
    // sequences.
    //
    // A THIRD ROUTE TO A NUMBER TWO CONCEPTS ALREADY HAVE, which is this
    // subject's established move and is stronger here than usual. The fifth
    // concept got 3/8 by listing HHT, HTH and THH and dividing three by eight —
    // a fact about a written-out space. This gets it from a count and a product
    // with nothing listed, which is the step that lets the table exist for a
    // number of trials nobody would write the space of.
    //
    // THREE FACTORS RATHER THAN A POWER, so a reader can count the trials. At
    // n = 3 the exponents are 1 and 2, and `(b/m)*((m-b)/m)^2` would hide which
    // factor belongs to which trial behind an exponent the prompt would then
    // have to explain.
    reference: '3/8',
    at: { c: '3', b: '1', m: '2' },
  },
  {
    id: 'one-binomial-entry-at-a-second-weight-1',
    knowledgePointId:
      'counting-several-trials-indexes-the-family-by-two-parameters-and-the-binomial-theorem-forces-the-total',
    kind: 'evaluate',
    prompt:
      'Same three trials and the same expression, with the weight moved: each trial now succeeds '
      + 'one time in three. The coefficient does not move — there are still three runs with '
      + 'exactly one success — so only the prices change. Evaluate '
      + 'c*(b/m)*((m - b)/m)*((m - b)/m) at c = 3, b = 1, m = 3, and say whether making success '
      + 'rarer has made exactly one success more likely or less.',
    given: 'c*(b/m)*((m - b)/m)*((m - b)/m)',
    variables: A_COUNT_OF_RUNS_AND_THE_WEIGHT_THEY_COST,
    // 3 × (1/3) × (2/3) × (2/3) = 3 × 4/27 = 12/27 = 4/9.
    //
    // THE PAIR DISAGREES AND THE DIRECTION IS WORTH THE TASK: 3/8 is 27/72 and
    // 4/9 is 32/72, so making success RARER makes exactly one success MORE
    // likely. That is not obvious and it is not a rounding — a third of the way
    // up — and it is the kind of thing a formula can be asked and a member
    // cannot. The coefficient being identical in the two substitutions is what
    // isolates the effect to the weight.
    //
    // AND IT IS WHERE THE SECOND PARAMETER IS SEEN TO BE SEPARATE FROM THE
    // FIRST. `c` is `counting-principles`' number and `b/m` is the experiment's;
    // this pair moves the second and holds the first, and the sixth task below
    // holds the second and moves nothing, so between them the two inputs are
    // shown to index the family independently.
    reference: '4/9',
    at: { c: '3', b: '1', m: '3' },
  },
  {
    id: 'the-whole-binomial-table-totals-one-1',
    knowledgePointId:
      'counting-several-trials-indexes-the-family-by-two-parameters-and-the-binomial-theorem-forces-the-total',
    kind: 'evaluate',
    prompt:
      'Keep three trials at success probability b/m. The four entries of the table are '
      + '((m - b)/m)^3, then 3(b/m)((m - b)/m)^2, then 3(b/m)^2((m - b)/m), then (b/m)^3, with '
      + 'the coefficients 1, 3, 3, 1 coming from C(3, k). Total the whole table at b = 1, m = 3, '
      + 'where the four entries are eight, twelve, six and one twenty-sevenths. Evaluate '
      + '((m - b)/m)*((m - b)/m)*((m - b)/m) + 3*(b/m)*((m - b)/m)*((m - b)/m) '
      + '+ 3*(b/m)*(b/m)*((m - b)/m) + (b/m)*(b/m)*(b/m) at b = 1, m = 3, and name the theorem '
      + 'that makes the answer the same for every weight.',
    given:
      '((m - b)/m)*((m - b)/m)*((m - b)/m) + 3*(b/m)*((m - b)/m)*((m - b)/m) '
      + '+ 3*(b/m)*(b/m)*((m - b)/m) + (b/m)*(b/m)*(b/m)',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // 8/27 + 12/27 + 6/27 + 1/27 = 27/27 = 1. The expansion of (q + p)³ with
    // q = 2/3 and p = 1/3, which `binomial-theorem` says is (q + p)³ = 1³ = 1.
    //
    // THE ONLY REFERENCE IN THE SUBJECT THAT IS 1, AND IT IS NOT A FREE MARK.
    // `random-variables`' first task is `(p+q+r+s)/n` and also answers 1, by
    // adding four preimage sizes over the size of one space — so there the total
    // is a PARTITION and here it is a THEOREM. The difference is visible in the
    // substitution: at a weight that is not a half the four entries are four
    // different numbers, 8, 12, 6 and 1 over 27, and that they come to 27 is
    // (q + p)³ with q + p = 1 rather than anything about this table.
    //
    // THE COEFFICIENTS ARE LEFT AS LITERALS AND THE FOUR TERMS ARE LEFT
    // UNCOLLECTED, exactly as `(9 + 1 + 1 + 9)` is two concepts down. Writing
    // `1` would ask nothing and writing `(((m - b) + b)/m)^3` would ask
    // something else — the identity rather than the table. What is asked is the
    // table, so the table is what the expression holds.
    //
    // AND IT IS WHAT MAKES THIS PROMOTION'S ONE STRANDED PREREQUISITE
    // LOAD-BEARING. `binomial-theorem` is `PROBABILITY.links`' sixth entry, and
    // a gate over nothing graded is the fault the fifty-first's credit-edge
    // rationale was written to catch. This is the task that stops it being one.
    reference: '1',
    at: { b: '1', m: '3' },
  },
  {
    id: 'the-plain-average-stops-agreeing-once-the-weight-moves-1',
    knowledgePointId:
      'counting-several-trials-indexes-the-family-by-two-parameters-and-the-binomial-theorem-forces-the-total',
    kind: 'evaluate',
    prompt:
      '`expectation` found the plain average of the four values 0, 1, 2, 3 equal to E[X] at 3/2, '
      + 'and said the agreement was a fact about a symmetric table rather than about the method. '
      + 'The values do not depend on the weight, so the plain average is 3/2 at every weight — '
      + 'but E[X] = np does. Find how far apart the two routes are when three trials each succeed '
      + 'one time in three. Evaluate (0 + 1 + 2 + 3)/v - j*(b/m) at v = 4, j = 3, b = 1, m = 3.',
    given: '(0 + 1 + 2 + 3)/v - j*(b/m)',
    variables: A_PLAIN_AVERAGE_AGAINST_A_PARAMETERISED_MEAN,
    // 6/4 − 3(1/3) = 3/2 − 1 = 1/2.
    //
    // THE SIXTH CONCEPT'S COMPARISON ASKED ON X AT LAST, WHICH THAT CONCEPT
    // EXPLAINED IT COULD NOT DO. `A_PLAIN_AVERAGE_AGAINST_THE_WEIGHTED_ONE` had
    // to be asked on T, because on X the two routes agree and the reference
    // would have been a true 0 — "a true statement that teaches the opposite of
    // the point", as its own note says. The seventh concept got round that by
    // asking at the SECOND moment, where the gap is 1/2. This asks the FIRST
    // moment on X and still gets 1/2, by moving the parameter instead of the
    // rule or the moment — so the same 1/2 now has three different routes to it
    // and the coincidence is dead in all three directions.
    //
    // `j*(b/m)` AND NOT A TABLE, which is the whole difference from that earlier
    // task. There the right-hand term is four preimage sizes over the size of
    // the space, so the expectation cannot be had without reading a table. Here
    // it is np, two parameters and no table — which is what the second point is
    // for, and which is why the left-hand term is left identical.
    //
    // THE NUMERATOR `0 + 1 + 2 + 3` IS LEFT UNEVALUATED, for the reason the two
    // concepts below leave theirs standing: the two halves have to be seen to be
    // reading the same four values, and 6 hides that they are the values of X.
    reference: '1/2',
    at: { v: '4', j: '3', b: '1', m: '3' },
  },
  {
    id: 'a-wait-that-outlasts-three-trials-1',
    knowledgePointId:
      'waiting-rather-than-counting-is-a-different-mechanism-and-only-the-description-chooses-between-them',
    kind: 'evaluate',
    prompt:
      'Trials succeed independently with probability b/m and X is the trial the first success '
      + 'falls on, so P(X = 1) = b/m, P(X = 2) = ((m - b)/m)(b/m) and '
      + 'P(X = 3) = ((m - b)/m)^2(b/m). The table has no end, so total what there is of it and '
      + 'take a complement: find the chance the wait outlasts three trials on a fair coin. '
      + 'Evaluate 1 - ((b/m) + ((m - b)/m)*(b/m) + ((m - b)/m)*((m - b)/m)*(b/m)) at b = 1, '
      + 'm = 2, then check it against ((m - b)/m)^3 and say which entry of `random-variables`\' '
      + 'second table it is.',
    given:
      '1 - ((b/m) + ((m - b)/m)*(b/m) + ((m - b)/m)*((m - b)/m)*(b/m))',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // 1 − (1/2 + 1/4 + 1/8) = 1 − 7/8 = 1/8. And (1/2)³ = 1/8 by the complement
    // route, so the two agree — which is what identifies the tail with the mass
    // `random-variables` parked on the value it invented at TTT.
    //
    // ASKED AS 1 MINUS THREE TERMS RATHER THAN AS `((m - b)/m)^3`, WHICH IS THE
    // HARDER ROUTE ON PURPOSE. The complement is the point of the subgoal and is
    // one product; writing the task that way would ask for the product and never
    // show what it replaced. Going the long way round and arriving at the same
    // 1/8 is what makes "a complement settles a table with no end" a measurement
    // rather than a remark — and the prompt supplies the short route so a
    // learner can check their own answer without being told it.
    //
    // THREE TERMS AND NOT FOUR, WHICH IS THE OPPOSITE SLIP FROM THE ONE
    // `sigma-notation` GUARDS AGAINST. Everywhere else in this subject a table
    // has four entries and the error available is dropping one. Here the table
    // is endless and the error available is thinking three entries are all of
    // it: 1/2 + 1/4 + 1/8 is 7/8 and not 1, and the 1/8 missing is the answer.
    reference: '1/8',
    at: { b: '1', m: '2' },
  },
  {
    id: 'three-drawn-at-once-are-all-new-1',
    knowledgePointId:
      'waiting-rather-than-counting-is-a-different-mechanism-and-only-the-description-chooses-between-them',
    kind: 'evaluate',
    prompt:
      '`counting-probability`\'s twelve club members include b = 5 new ones, and three are drawn '
      + 'at once by lot. `conditional-probability` multiplies one factor per draw with each '
      + 'denominator counting what is LEFT, so the chance all three are new is '
      + '(5/12)(4/11)(3/10). That is a HYPERGEOMETRIC probability. Evaluate '
      + '(b/m)*((b - 1)/(m - 1))*((b - 2)/(m - 2)) at b = 5, m = 12.',
    given: '(b/m)*((b - 1)/(m - 1))*((b - 2)/(m - 2))',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // (5/12)(4/11)(3/10) = 60/1320 = 1/22, which is the number
    // `counting-probability` reaches as C(5,3)/C(12,3) = 10/220 and the subject's
    // `covers` reaches twice over.
    //
    // THE FIRST TASK IN THE BUILD TO NAME THE HYPERGEOMETRIC, and three files
    // have been deferring to this concept for it by name. The second concept's
    // boundary note says C(5,1)C(7,2)/C(12,3) "IS a hypergeometric probability"
    // and that the name is absent because a distribution is a FUNCTION of k
    // while the material wanted one number; the fifth concept's note repeats it.
    // The debt is paid by a shape rather than by a label: both numerators and
    // both denominators DESCEND, which is what "without replacement" looks like
    // in an expression.
    //
    // THE DESCENDING FACTORS ARE WRITTEN OUT AS `(b - 1)/(m - 1)` RATHER THAN
    // SUBSTITUTED AS 4/11. The pool shrinking is the mechanism, so it has to be
    // in the expression: a reader comparing this with the task below sees two
    // products of three factors whose only difference is whether the inputs move
    // between them, which is the entire content of the third point.
    reference: '1/22',
    at: { b: '5', m: '12' },
  },
  {
    id: 'three-drawn-with-each-put-back-are-all-new-1',
    knowledgePointId:
      'waiting-rather-than-counting-is-a-different-mechanism-and-only-the-description-chooses-between-them',
    kind: 'evaluate',
    prompt:
      'Same twelve members, same five new ones, same question — with one sentence changed: each '
      + 'member drawn is RETURNED before the next draw. Every factor is then the same and the '
      + 'three draws are independent, so this is the binomial at three trials and weight 5/12. '
      + 'Evaluate (b/m)*(b/m)*(b/m) at b = 5, m = 12, and put it beside the previous answer over '
      + 'a common denominator of 19008.',
    given: '(b/m)*(b/m)*(b/m)',
    variables: A_WEIGHT_AS_A_RATIO_OF_INTEGERS,
    // (5/12)³ = 125/1728. Against 1/22: over 19008 those are 1375 and 864, so
    // returning the members raises the chance by more than half again.
    //
    // ONE SUBSTITUTION AND TWO EXPRESSIONS, WHICH IS THE INVERSE OF THIS
    // SUBJECT'S FAVOURITE PAIR AND IS NEW. Nine expressions here are asked at
    // two substitutions, and the point of every one of those pairs is that the
    // formula outlives the numbers. This pair holds b = 5 and m = 12 fixed and
    // changes the FORMULA, because what the third point claims is that the
    // description picks the family: the same two inputs and the same words give
    // 1/22 or 125/1728 according to one sentence that no step of either
    // calculation contains.
    //
    // AND IT IS THE LARGER, WHICH IS WORTH THE COMPARISON. Returning a new
    // member keeps five of twelve available where drawing without replacement
    // leaves four of eleven and then three of ten, so the without-replacement
    // route falls away faster. 864 against 1375 over 19008 is not a rounding's
    // worth of difference, which is what makes choosing the wrong mechanism a
    // clean calculation of the wrong thing rather than a small error.
    reference: '125/1728',
    at: { b: '5', m: '12' },
  },
]

/**
 * An authored task, or a generated one rebuilt from its id.
 *
 * The verify route looks a submission up by id and has no other handle on it, so
 * a generated instance has to be reconstructible from its id alone — which is
 * exactly what `generatedTaskById` does. Authored ids are checked first and
 * cannot collide: a generated id contains an `@` and no authored one does.
 */
export function taskById(id: string): PracticeTask | null {
  const authored = TASKS.find(t => t.id === id)
  if (authored) return authored
  return generatedTaskById(id)
}

export function tasksForPoint(knowledgePointId: string): PracticeTask[] {
  return TASKS.filter(t => t.knowledgePointId === knowledgePointId)
}

/**
 * Whether a concept has an actual problem behind it, which is NOT `isTeachable`.
 *
 * ── The overstatement this exists to stop ─────────────────────────────────
 *
 * `isTeachable` means "has at least one knowledge point", and every surface in
 * the app reported it as the number of concepts that "have problems written
 * for them". For most concepts those coincide. For three they did not:
 * `logarithm-definition`, `logarithm-rules` and `solving-exponential-equations`
 * each carried knowledge points and ZERO tasks, so they were counted in the
 * figure while offering nothing to do.
 *
 * Found by authoring — the honest question "which concept should get problems
 * next" turned up three that already claimed to have them.
 *
 * ── The diagnosis was wrong in a way worth recording ──────────────────────
 *
 * This comment used to end: "the pattern is not random either: they are the
 * concepts whose natural task is *solving* or *stating*, and the engine has no
 * verifiable kind for either. So the gap will recur." The observation was
 * right and the cause was not. What actually blocked them was one line in
 * numerals.ts: `exactValue` returned null for every `log`, so `ruleEvaluate`
 * could not recompute an authored task's own answer and would have graded
 * learners against an unvouched reference. The fix was `exactLog`, not a new
 * task kind, and all three are practisable now.
 *
 * So this function currently excludes nothing — and stays, because the state
 * it names is reachable the moment anybody writes material before problems,
 * which is the normal order of authoring. A count that silently re-widened
 * would be the original defect returning.
 *
 * The *kind* gap is real and narrower than it looked: it costs
 * `log-argument-is-positive` its task, since "this expression is undefined" is
 * not a value `evaluate` can ask for. A knowledge point, not a concept.
 *
 * This is the same discipline as `atlasCoverage` printing how little is
 * written, `notLoadedNotice` saying the librarian knows nothing rather than
 * that there is nothing, and `unwrittenOnPath` counting the gaps a journey
 * crosses. One number per claim, and no claim wider than its evidence.
 *
 * `isTeachable` is NOT redefined. It gates introduction and must keep meaning
 * "there is material here", which is the right question for the scheduler —
 * a concept with knowledge points and no tasks still has something to read.
 * This is the question for a DISPLAY: can they go and do it.
 */
export function isPractisable(o: ConceptOntology, conceptId: string): boolean {
  const c = o.concepts.find(x => x.id === conceptId)
  if (!c) return false
  return c.knowledgePoints.some(p => TASKS.some(t => t.knowledgePointId === p.id))
}

/** Concepts with at least one real problem, for a coverage figure. */
export function practisableConcepts(o: ConceptOntology): string[] {
  return o.concepts.filter(c => isPractisable(o, c.id)).map(c => c.id)
}

/**
 * The variable a form check is about.
 *
 * The first declared variable, because the declaration order is the author's own
 * statement of which one the problem is in. Guessing it from the tree would pick
 * whichever symbol happened to be mentioned first by the learner.
 */
export function primaryVariable(task: PracticeTask): string {
  return task.variables[0]?.name ?? 'x'
}
