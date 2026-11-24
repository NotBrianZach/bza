/**
 * A fourteenth subject ontology: what you do when the cases do not run out.
 *
 * ── WHY THIS CONCEPT ──────────────────────────────────────────────────────
 *
 * All ten shipped journeys have read zero unwritten steps on route since the
 * fourteenth promotion, so route demand ranked nothing and the selection ran
 * the way ontology-functions.ts's header describes: rulability first, then
 * whether the stranded edges fit in one ontology, then dependents. Eleven map
 * nodes were ready — every `needs` already teachable — and for the first time
 * the field narrowed to ONE:
 *
 *  - SIX OF THE ELEVEN ARE FLOOR-BLOCKED RATHER THAN CONTENT-BLOCKED, which is
 *    the third promotion running where that is the largest group.
 *    `algebra-foundations` holds six nodes against a stub floor of five with
 *    four of them ready, and `linear-algebra` six with two. The next departure
 *    from either empties its headroom, and the answer atlas-foundations.ts
 *    argues for is merging the remnant into a neighbour — a decision about the
 *    learner-facing map, which is a person's and not an authoring pass's.
 *  - FOUR MORE ARE UNDER REFUSALS THAT STILL BIND, and ontology-quantifiers.ts
 *    states all four by name. `graphs-of-functions` is a judgement about a
 *    drawing; `constructions` is a procedure with a straightedge;
 *    `non-euclidean-geometry` is a choice of axioms; and
 *    `supremum-and-completeness` is the second-place candidate of the last two
 *    promotions, refused both times because a least upper bound is a claim
 *    about a set and the sets worth asking about are the ones whose bound is
 *    not attained.
 *  - THIS NODE IS THE ELEVENTH, and it became available one promotion ago. Its
 *    sole prerequisite is `quantifiers`, which was a skeleton until
 *    ontology-quantifiers.ts existed. So the field did not narrow to one by
 *    exhaustion; the thirty-sixth promotion opened the only entry left.
 *
 * It also carries the most of any candidate. `sets`, `graph-colouring-planarity`
 * and `division-algorithm` all name it, and every remaining node of
 * `discrete-mathematics` except the two formal-systems ones stands on it through
 * `sets`.
 *
 * ── WHY A FOURTEENTH SUBJECT, WHICH WAS NOT A JUDGEMENT THIS TIME ─────────
 *
 * The two previous promotions each had to argue their way out of a cheap filing.
 * This one does not, because BOTH candidate subjects have already written this
 * concept out of themselves by name, and a subject may not be handed a concept
 * its own file has declined — the rule ontology-logic.ts stated and
 * ontology-quantifiers.ts applied.
 *
 *   `statements-and-connectives` holds the concept two steps down and says:
 *   "The four shapes of argument — direct, contrapositive, contradiction,
 *   cases — are `proof-techniques` above that, and this subject supplies only
 *   the one fact they rest on."
 *
 *   `predicates-and-quantifiers` holds the sole prerequisite — the cheapest
 *   filing on offer, no `links` entry and no new subject — and says: "What
 *   replaces exhausting a domain is an argument about an arbitrary member of
 *   it, and the four shapes such an argument takes — direct, contrapositive,
 *   contradiction, cases — are `proof-techniques`, the node directly above this
 *   one."
 *
 * Every other shipped subject was tested the way ontology-solids.ts set out and
 * each draws a boundary this concept falls outside. `arithmetic-foundations`
 * says "nothing symbolic", and it RUNS one of these arguments without being
 * about any of them — see the division of labour below.
 * `expressions-and-equations` is about a letter standing for a number with
 * something to solve for; there is nothing to solve here.
 * `functions-and-inverses` owns `mathematical-induction`, which is one technique
 * for one shape of domain rather than an account of what the techniques are,
 * and it is also the subject the consolidation question below would move things
 * out of. `plane-geometry` owns `geometric-proof` and is bounded by its id: a
 * claim about every whole number is not a figure in the plane.
 * `triangle-trigonometry` and `solid-measure` are about figures and measures.
 * `rational-expressions` and `exponents-and-logarithms` start at polynomial
 * arithmetic and at powers. `data-summaries` is a function of a list of numbers.
 * `vectors-and-independence` and `matrices-and-determinants` are above this
 * concept rather than beside it.
 *
 * ── THE CONSOLIDATION QUESTION, WHICH THIS MAKES EASIER AND NOT HARDER ────
 *
 * ontology-functions.ts, then ontology-logic.ts, then ontology-quantifiers.ts
 * each left open whether this build wants one REASONING subject:
 * `mathematical-induction` moved out of the functions, `geometric-proof` out of
 * the geometry, and the two logic layers joining them. This is a fourth
 * candidate to move into such a subject and the most natural nucleus of one,
 * since it is the only concept of the four whose subject IS the argument rather
 * than a field the argument is used in.
 *
 * Founding a subject rather than widening a neighbour is what keeps that
 * question open, which is worth saying because it looks like the opposite. The
 * asymmetry ontology-logic.ts and ontology-quantifiers.ts both relied on:
 * merging subjects later is an easy change, and un-merging a subject whose
 * `covers` had been rewritten to claim a neighbour is not. Four cleanly bounded
 * subjects can be collapsed into one by somebody who decides they are one
 * syllabus; one subject that has absorbed its neighbours cannot be taken back
 * apart, because the sentence recording where the boundary was has been
 * deleted. So the cheap filing was not merely refused — it was unavailable, and
 * the expensive one is also the reversible one.
 *
 * What this subject claims is the layer where an argument is the object. It does
 * not claim induction, which is `mathematical-induction` in the functions and is
 * a fifth technique for one shape of domain. It does not claim axioms,
 * derivation, models or the incompleteness theorems, which are
 * `formal-logic-and-incompleteness` four nodes up — and "what follows from what
 * in a formal system" is that node's, not this one's, which is also why the
 * armature's refill went there. It does not claim sets as objects with
 * operations, which is `sets` directly above.
 *
 * ── THE SUBJECT IS NAMED FOR THE LAYER, AND NOT FOR THE NODE OR THE AREA ──
 *
 * Four refusals, three of which earlier subjects paid for.
 *
 * Not `discrete-mathematics`, the id of the AREA this concept left. `areaOf`
 * answers with a subject id for an authored concept and an area id for a map
 * node, so a collision would put two different things behind one string and
 * `getOntology(id)` and `conceptById(M, id)` would answer about different
 * objects. The ninth subject recorded that hazard.
 *
 * Not `proof-techniques`, the id of the one concept this subject contains — the
 * same hazard by a worse route, because nothing looks wrong: the concept would
 * report itself as its own area. The tenth subject found that one.
 *
 * Not `proof-theory`, which is the refusal this subject adds, and the name a
 * textbook index would reach for first. Proof theory is the study of proofs as
 * formal objects — derivations in a stated calculus, cut elimination,
 * consistency strength — and all of that is
 * `formal-logic-and-incompleteness` and all of it is unwritten, so the name
 * would make this `covers` a promise about nodes nobody has touched. Same
 * mistake the ninth subject refused when it declined `trigonometry`, the
 * eleventh when it declined `statistics`, the twelfth when it declined `logic`
 * and the thirteenth when it declined `predicate-logic`.
 *
 * And `methods-of-proof` is a near-synonym of the concept id, which is worth
 * separating from the collision hazard rather than treating as a milder version
 * of it. What breaks when a subject id equals a concept id is `areaOf`, which
 * returns one string for two different questions; two DIFFERENT strings that
 * happen to mean the same thing in English break nothing and read correctly at
 * every call site — `areaOf(M, 'proof-techniques')` is `'methods-of-proof'`,
 * which is a sentence about a concept's home rather than a tautology. The
 * alternative was a name for the layer that does not use the word proof, and
 * every candidate ("shapes of argument", "argument structure") describes this
 * material less accurately than the plainest available phrase.
 *
 * ── WHAT IS NEW HERE, GIVEN THAT THREE SUBJECTS ALREADY MENTION PROOF ─────
 *
 * This is the part worth arguing at length, because the concept could easily
 * have been a fourth restatement of converse-versus-contrapositive and that
 * would have been worse than leaving it unwritten.
 *
 *   `propositional-logic` PROVES that the contrapositive is the same claim and
 *   the converse is not, as an identity: the implication's polynomial and the
 *   contrapositive's multiply out to the same thing, and the converse differs by
 *   q − p. That is the FACT, and this concept cites it rather than re-deriving
 *   it. What this concept adds is the DECISION the fact licenses — if the two
 *   sentences are one claim you may start at either end, and which end you
 *   start at is decided by which hypothesis is a form you can substitute. The
 *   first knowledge point is about a choice, not about an equivalence, and its
 *   worked example spends a subgoal on the end that does NOT work.
 *
 *   `geometric-proof` teaches a chain of cited facts about a figure, the same
 *   converse-contrapositive distinction on one proved statement about
 *   triangles, and that one case refutes a universal claim while no number of
 *   cases establishes one. All three are about geometry statements, and the
 *   third is the asymmetry rather than the remedy.
 *
 *   `quantifiers` supplies the remedy's shape without any of the techniques: a
 *   product over a domain needs a LAST factor, so a domain that does not run
 *   out cannot be settled by multiplying, and what replaces exhaustion is an
 *   argument about an arbitrary member. This concept is what that argument
 *   looks like. The second knowledge point's negation step is that concept's
 *   rule being USED — "there is no largest prime" negates to a finite list —
 *   and the finite list is what makes the previous subject's product available
 *   again, which is the join between the two.
 *
 *   `roots-and-irrationals` RUNS a proof by contradiction — suppose √2 = a/b,
 *   count the 2s, reach a number with both an even and an odd count — and never
 *   names the technique, because the subject is which roots are rational. That
 *   is the same division of labour ontology-arithmetic.ts itself draws between
 *   `prime-factorisation` and `roots-and-irrationals`: there, the parity
 *   argument was a preview offered as the pay-off of a technique and then the
 *   content of the concept above. Here the argument is the pay-off and the
 *   technique is the content. The worked examples share no numbers with that
 *   concept's, so neither reads as a recall of the other, and the second point
 *   says plainly that the reader has already run one of these.
 *
 * Contradiction and proof by cases appear in no authored material anywhere in
 * this build — checked across all thirteen shipped subjects — so two of the
 * three knowledge points are new content rather than a second pass.
 *
 * ── THE RULABLE CORE, AND THE ONE THING IT CANNOT ASK FOR ─────────────────
 *
 * Nine tasks, three on each point, seven `evaluate` and two
 * `transform_to_form`, every one settled by exact rational arithmetic with no
 * worker for the `evaluate` half. The encoding is not the 0-and-1 truth values
 * of the two subjects below — nothing here is a truth table — and it is not an
 * invention either. It is the arithmetic the proofs are made of:
 *
 *     a case, as a form      n = 2k, n = 2k + 1, n = 3k + 2
 *     "divisible by p"       n − p·k, which is 0 exactly when it divides
 *     a remainder            the same expression, read as what is left
 *     "for an arbitrary n"   an expression whose value does not involve k
 *
 * THE LAST LINE IS THE WHOLE CONCEPT AND IT IS ASKABLE. Two of the nine tasks
 * evaluate an expression that is identically 1 — (2k + 1)² − 4(k² + k) and
 * (3k + 2)² − 3(3k² + 4k + 1) — so the answer is the same whichever k is
 * substituted, and the k has cancelled rather than been chosen small. That is
 * exactly the difference between a proof about every odd number and the ten
 * prime checks the previous concept ran: there the value depended on n and ten
 * agreeable values settled nothing, and here it does not depend on k at all.
 * The two tasks are at k = 7 and k = 5 and their prompts name two further
 * values each, because one substitution looks like a check until a second one
 * gives the same answer.
 *
 * WHAT CANNOT BE ASKED FOR IS THE ARGUMENT ITSELF, and that is a real ceiling
 * rather than a gap to be engineered away. "Prove that if n² is even then n is
 * even" is a `justify`, which tasks.ts declares unverifiable and no subject
 * ships; naming it in an objective would promise an observation that cannot be
 * made, which is the rule the tenth subject decided and the eleventh, twelfth
 * and thirteenth carried. So each point's tasks ask for the one computation its
 * argument turns on, and the argument is carried by the worked example, whose
 * subgoals are all phrased as questions for the tutor to ask. That is the
 * compromise tasks.ts describes for proxy tasks, held to its own rule: ask a
 * checkable question in the vicinity and name what it stands in for.
 *
 * `counterexample` is refused for ontology-quantifiers.ts's reason, and the
 * refusal lands in a different place here. The natural ask is "produce a prime
 * not on the list", and ruling it needs a checker that can test a produced
 * object against a claim; the kind is declared verifiable in tasks.ts and ships
 * nowhere. So the factor is GIVEN — divide 30031 by 59 — and the prompt says
 * that the real ask was to find it. Less than the real question, and the honest
 * amount less.
 *
 * `transform_to_form` IS available here, which is the one place this subject is
 * better off than the two logic subjects. There, the only demand of that kind
 * would have graded the shape of an encoding. Here the demand is the move:
 * "write (2k + 1)² multiplied out" is what the contrapositive bought and
 * `expanded` is exactly the claim, since the unexpanded power is what cannot be
 * read for parity. `prime_factored` was the other candidate and is refused:
 * 30031 = 59 × 509 would be a lovely task and it is the `counterexample` ask
 * wearing a form, since finding the factors is the whole of it.
 *
 * ── NO FIGURE, AND NOTHING IS LOST BY IT ──────────────────────────────────
 *
 * `visualRef` is omitted on all three points and here the absence costs nothing,
 * unlike the thirteenth subject's missing quantifier grid. Every object in this
 * concept is a whole number written in a form, every move is a substitution or
 * an expansion, and the one thing a drawing could add — the three residue
 * classes as three rows of dots — would illustrate the case split rather than
 * decide it. No such figure exists in this build, so the field is absent rather
 * than pointed at a placeholder.
 *
 * ── TWO FACTS ARE IMPORTED AND BOTH ARE NAMED ─────────────────────────────
 *
 * Neither is a prerequisite the map declares, and both are arithmetic, which
 * sits beneath the whole atlas rather than beside this concept:
 *
 *   Every whole number above 1 has a prime factor. That is
 *   `prime-factorisation`'s, it is what the second point's contradiction closes
 *   on, and it is used rather than restated.
 *
 *   Dividing by 3 leaves exactly one of three remainders. The general statement
 *   is `division-algorithm`, which is a node ABOVE this concept and names it as
 *   a prerequisite, so the general form may not be leaned on. What the third
 *   point uses is the single instance for 3, which a reader checks by writing
 *   the three forms out — and the fact that there are three of them is the
 *   thing being taught there rather than assumed, since the whole lesson is a
 *   split that forgot the third.
 *
 * ── THE PATTERN IS CARRIED VERBATIM, AND THE SHORTFALL IS NAMED ───────────
 *
 * `/\b(mathematical proof|proof by contradiction|contraposition)\b/i`, off the
 * map node unchanged, for the reason every promotion since the fourth has kept:
 * widening a pattern in the same edit that adds material moves the recognition
 * figure in tests/atlas.mjs and the written-concept count together, and there
 * is no way afterwards to say which half did it.
 *
 * Three real titles match and several do not. "Mathematical proof", "Proof by
 * contradiction" and "Contraposition" are in; "Proof by cases",
 * "Proof by exhaustion", "Direct proof", "Reductio ad absurdum" and "Euclid's
 * theorem" are out, and the third knowledge point is entirely about the first
 * of those. The failure mode to avoid when widening is `/\bproof\b/i`, which
 * would claim every page whose title contains the word — "Proof of Fermat's
 * Last Theorem", "Proof theory", "Burden of proof" — and hand this concept the
 * whole shelf. `fidelity` is still `checked`: what `checked` claims is that the
 * pattern really decides membership for what it matches, not that it matches
 * everything the concept covers.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'methods-of-proof',
  name: 'Methods of proof',
  covers:
    'What you do when the cases do not run out. Two subjects below this one, a claim about '
    + 'every case could be settled by writing all the cases down: n letters give 2ⁿ rows of a '
    + 'truth table, and a predicate over a four-member domain gives four values to multiply. '
    + 'The moment the domain does not run out that licence is gone — a product needs a LAST '
    + 'factor — and what replaces exhausting the cases is an argument about an ARBITRARY '
    + 'member. This subject is the shape of such an argument. Four shapes are here — direct, '
    + 'contrapositive, contradiction, cases — across three knowledge points, because the first '
    + 'two are the same argument run from opposite ends and separating them would hide what '
    + 'they have in common. First, then, WHICH END TO START FROM. That "if not Q then not P" '
    + 'is the same claim as "if P '
    + 'then Q", while "if Q then P" is a different claim, is proved in '
    + '`statements-and-connectives` by subtracting columns and is taken as given here. What is '
    + 'new is the decision it licenses: if the two sentences are one claim you may prove either, '
    + 'so pick the end whose hypothesis is a FORM you can substitute. "If n² is even then n is '
    + 'even" starting from n² = 2m hands you nothing to put in place of n; starting from the '
    + 'contrapositive hands you n = 2k + 1, and one expansion to 2(2k² + 2k) + 1 finishes it. '
    + 'The converse is the rearrangement you may not prove instead, and the reason is not that '
    + 'it is false — for that statement it is true — which is why the truth of a sentence can '
    + 'never tell you which sentence you proved. Second, CONTRADICTION: assume the claim is '
    + 'false, which the previous concept says how to write down, compute until something '
    + 'impossible appears, and drop the only assumption you added. Suppose 2, 3, 5, 7, 11, 13 '
    + 'were every prime; their product plus one is 30031, dividing it by any one of them leaves '
    + 'remainder 1, so none of them divides it, so its prime factor is a prime missing from a '
    + 'list that claimed to be complete. The thing that argument does NOT claim, and that '
    + 'almost everybody takes from it, is that the number built is prime: with the shorter list '
    + '2, 3, 5, 7 it is, since 211 is prime, and with this one it is not, since 30031 is '
    + '59 × 509. Both factors are primes off the list, which is all the argument ever needed. '
    + 'Third, CASES, where the split carries the whole weight. Every whole number is 2k or '
    + '2k + 1 and there is no third form, so two cases settle a claim about all of them: n² + n '
    + 'is 2(2k² + k) in one and 2(2k² + 3k + 1) in the other, hence even either way. Cases that '
    + 'leave something out prove nothing about what was left out, and the failure is hard to see '
    + 'because an incomplete split can still reach a TRUE conclusion — "n² never leaves '
    + 'remainder 2 on division by 3" is true, and somebody who checks n = 3k and n = 3k + 1 and '
    + 'stops has said nothing whatever about 2027, which is 3 × 675 + 2. Running through all of '
    + 'it is one test of whether a computation is a proof: an expression whose value still '
    + 'mentions the case letter has settled one number, and an expression the letter has '
    + 'cancelled out of has settled the case. What is NOT here is a boundary rather than a '
    + 'backlog. INDUCTION is a fifth technique and is `mathematical-induction`, filed with the '
    + 'functions, because it is one method for one shape of domain rather than an account of '
    + 'what the methods are. Sets as objects in their own right, with operations and identities, '
    + 'are `sets` directly above. Axioms, derivation inside a stated calculus, models and the '
    + 'incompleteness theorems are `formal-logic-and-incompleteness`, four nodes up — so "what '
    + 'follows from what" as a formal relation belongs there, and what is here is what a person '
    + 'writes down to convince another person. And no task below asks for an argument: '
    + '"prove that if n² is even then n is even" is a `justify`, which nothing in this build can '
    + 'rule, so the arguments live in the worked examples and the tasks ask for the one '
    + 'computation each argument turns on.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'proof-techniques',
    name: 'Proof techniques',
    subjectId: subject.id,
    scope: {
      id: 'proof-techniques',
      label: 'Proof techniques',
      hint: 'direct proof contrapositive proof by contradiction proof by cases exhaustive counterexample',
      /*
       * Carried verbatim from the map node, as every promotion since the fourth
       * has carried its own. Widening a pattern in the same change that adds
       * material moves the recognition figure in tests/atlas.mjs and the
       * written-concept count at once, and there is no way afterwards to say
       * which edit moved which.
       *
       * The shortfall is named in this file's header. "Proof by cases" and
       * "Proof by exhaustion" are real titles and neither matches, which is
       * the third knowledge point's entire subject; "Direct proof" and
       * "Reductio ad absurdum" miss as well. The widening is a separate
       * change, and `/\bproof\b/i` is not it — that would claim "Proof of
       * Fermat's Last Theorem" and "Burden of proof" alike.
       */
      match: /\b(mathematical proof|proof by contradiction|contraposition)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'pick-the-end-to-start-from-and-produce-what-that-end-hands-you',
        statement:
          'Produce the multiplied-out form of (2k + 1)², which is what the contrapositive '
          + 'hypothesis hands you and the direct one does not, and so choose a starting end by '
          + 'which hypothesis is a form rather than by which sentence reads more naturally. '
          + 'Produce the remainder that an arbitrary odd number\'s square leaves on division by '
          + '2 and observe that the case letter has cancelled out of it. Produce the value that '
          + 'refutes the converse of a true implication, and so distinguish a rearrangement that '
          + 'was proved from one that merely happens to be true.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
      {
        id: 'assume-the-negation-and-produce-the-numbers-that-make-it-impossible',
        statement:
          'Produce the number built from a list of primes assumed to be complete, then produce '
          + 'the remainder it leaves on division by one of them and read a remainder that is not '
          + 'zero as "nothing on the list divides it". Produce the second factor of that number '
          + 'given the first, and so see that the number is composite and that the argument never '
          + 'needed it to be prime.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'split-into-cases-and-produce-the-value-of-the-one-that-was-left-out',
        statement:
          'Produce the multiplied-out square of the case a two-case split over division by three '
          + 'leaves out, and then the remainder it leaves, observing again that the case letter '
          + 'has cancelled. Produce the remainder that places a given whole number in a case, and '
          + 'so decide whether a stated split covers it.',
        taskKinds: ['transform_to_form', 'evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-contrapositive-lets-you-choose-which-end-to-start-from',
        conceptId: 'proof-techniques',
        statement:
          'Three sentences can be made out of "if P then Q". The CONTRAPOSITIVE "if not Q then '
          + 'not P" is the same claim — proved two concepts down by subtracting columns, and '
          + 'taken as given here. The CONVERSE "if Q then P" is a different claim. What the '
          + 'technique adds to that fact is the DECISION it licenses: since the contrapositive '
          + 'says the same thing, you may prove it instead, and which end you start at is '
          + 'decided by which hypothesis is a FORM you can substitute. Take "if n² is even then '
          + 'n is even". Starting at the front, "n² is even" means n² = 2m, and there is nothing '
          + 'there to put in place of n — everything you have been handed is about the square. '
          + 'Starting at the other end, the hypothesis is "n is odd", which IS a form: '
          + 'n = 2k + 1. Substitute it and expand: (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, '
          + 'odd. One substitution and one expansion, and because the k cancels out of the '
          + 'remainder it holds for every odd n rather than for one. The converse is the '
          + 'rearrangement you may NOT prove instead, and the reason is not that it is false: '
          + 'for this statement it is true, since an even n has an even square. That is the trap '
          + '— the truth of a sentence tells you nothing about which sentence you proved. Where '
          + 'it shows is a statement whose converse fails: "if n is divisible by 4 then n is '
          + 'even" is true, and its converse breaks at n = 2, because 2 ÷ 4 is 1/2 and not a '
          + 'whole number.',
        position: 1,
        /*
         * No `automaticityTarget`. Expanding (2k + 1)² would time beautifully,
         * which is the trap: this point is about choosing a starting end, and a
         * speed reward trains the expansion — the step that is only worth doing
         * once the choice is made.
         */
        workedExample: {
          problem:
            'Prove that for every whole number n, if n² is even then n is even. Start at the '
            + 'front first and say what stops you. Then prove the contrapositive and say why '
            + 'that settles the original. Finally decide whether the converse has been proved '
            + 'as well.',
          subgoals: [
            {
              label: 'Write all three rearrangements down before choosing one',
              detail:
                'P is "n² is even" and Q is "n is even". The original is "if P then Q". The '
                + 'contrapositive is "if n is odd then n² is odd" — both parts negated and the '
                + 'order swapped. The converse is "if n is even then n² is even" — the order '
                + 'swapped and nothing negated. Three sentences, and the first two are one '
                + 'claim while the third is a separate one. Nothing has been computed yet; this '
                + 'is the move that makes a choice available.',
              socratic:
                'Before computing anything: what are the three sentences you can make out of '
                + '"if n² is even then n is even", and which two of them are the same claim?',
            },
            {
              label: 'Try the front end and find what it hands you',
              detail:
                '"n² is even" says n² = 2m for some whole number m. Everything given is about '
                + 'the square, and the thing to be established is about n. There is no form for '
                + 'n to be substituted with — a square being even does not, on the face of it, '
                + 'name what its root looks like. This is not a proof that the front end is '
                + 'impossible; people do finish it, using more than arithmetic. It is the '
                + 'observation that it has no first move here, and that observation is the '
                + 'entire reason to look at the other end.',
              socratic:
                'You are given n² = 2m and asked to say something about n. What would you '
                + 'substitute, and what have you been given to substitute it into?',
            },
            {
              label: 'Start at the other end, where the hypothesis is a form',
              detail:
                'The contrapositive\'s hypothesis is "n is odd", and that is a form: every odd '
                + 'whole number is 2k + 1 for some whole k. Substitute and expand: '
                + '(2k + 1)² = 4k² + 4k + 1. Group the first two terms: 2(2k² + 2k) + 1. That is '
                + 'twice a whole number plus one, which is what "odd" asks for. So n odd forces '
                + 'n² odd, in one substitution and one expansion.',
              socratic:
                'The contrapositive gives you "n is odd" instead of "n² is even". What can you '
                + 'write n as, and what does that let you do that the other hypothesis did not?',
            },
            {
              label: 'Check the k cancelled, which is what makes it a proof and not a check',
              detail:
                'Subtract the even part from the square and see what is left: '
                + '(2k + 1)² − 4(k² + k) = 4k² + 4k + 1 − 4k² − 4k = 1. The answer is 1 and no k '
                + 'appears in it. At k = 0 that reads 1 − 0 = 1; at k = 7, 225 − 224 = 1; at '
                + 'k = 12, 625 − 624 = 1. The remainder is 1 whichever odd number was taken, '
                + 'because the k cancelled rather than being chosen conveniently. That is the '
                + 'difference between this and the previous concept\'s ten prime values: there '
                + 'the answer depended on n and ten agreeable ones settled nothing.',
              socratic:
                'You got a remainder of 1 at k = 7. What would you have to see about the other '
                + 'values of k for that single computation to be a proof rather than a check?',
            },
            {
              label: 'Say what has been proved, and what has not',
              detail:
                'The contrapositive is proved, and because it is the same claim the original is '
                + 'proved with it: if n² is even then n is even. The converse, "if n is even '
                + 'then n² is even", has NOT been proved by any of the above — and it is also '
                + 'true, which is exactly why it is dangerous. A sentence being true is no '
                + 'evidence that it is the sentence you established. The statement where that '
                + 'shows is one whose converse fails: "if n is divisible by 4 then n is even" is '
                + 'true, its converse says every even number is divisible by 4, and n = 2 '
                + 'refutes it because 2 ÷ 4 is 1/2.',
              socratic:
                '"If n is even then n² is even" is true. Did the work above prove it, and how '
                + 'would you tell apart a rearrangement you proved from one that merely happens '
                + 'to be true?',
            },
          ],
          answer:
            'Proved by contrapositive. If n is odd then n = 2k + 1, so '
            + 'n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, which is odd; the remainder '
            + '(2k + 1)² − 4(k² + k) is 1 with no k in it, so this holds for every odd n. Since '
            + '"if n is odd then n² is odd" is the contrapositive of "if n² is even then n is '
            + 'even", the original is proved. The front end was abandoned because n² = 2m offers '
            + 'no form for n. The converse "if n is even then n² is even" was not proved, though '
            + 'it is true — and for "if n is divisible by 4 then n is even" the converse is false '
            + 'at n = 2, where 2 ÷ 4 = 1/2.',
        },
      },
      {
        id: 'a-contradiction-assumes-the-negation-and-reaches-something-impossible',
        conceptId: 'proof-techniques',
        statement:
          'Sometimes neither end of a claim gives a first move, and the way in is to assume the '
          + 'claim is FALSE. That is a proof by CONTRADICTION, and it is the one technique here '
          + 'that starts by writing down something you intend to destroy. The previous concept '
          + 'says how to write it down: the negation of '
          + '"for every prime there is a larger one" is "there is a prime with none larger" — the '
          + 'primes stop, so they are a finite LIST, and a finite list is something you can '
          + 'multiply. Then compute until a statement appears that cannot be true, and drop the '
          + 'only assumption you added. Suppose 2, 3, 5, 7, 11, 13 were every prime there is. '
          + 'Their product is 30030, which every one of them divides. Add 1: N = 30031, and now '
          + 'dividing by any of them leaves remainder 1 — 30031 − 13 × 2310 = 1, and the same for '
          + 'the rest — so none of them divides N. But N is bigger than 1, so N has a prime '
          + 'factor, and that prime is not on a list that was assumed to hold all of them. '
          + 'Nothing in the arithmetic is in doubt, so the assumption is what goes. The thing '
          + 'this argument does NOT claim is that N is prime. With the shorter list 2, 3, 5, 7 '
          + 'it happens to be: 211 is prime. With this list it is not: 30031 = 59 × 509, and 59 '
          + 'and 509 are both primes missing from the list, which is all the argument ever '
          + 'needed. You have already run one of these: the proof two subjects down that √2 is '
          + 'not a ratio supposes it is one and reaches a number with both an even and an odd '
          + 'count of 2s.',
        position: 2,
        workedExample: {
          problem:
            'Prove that there is no largest prime, by assuming there is one. Take 2, 3, 5, 7, '
            + '11, 13 as if it were every prime. Build a number out of the list, show nothing on '
            + 'the list divides it, and say what that forces. Then factor the number and say why '
            + 'the answer does not matter.',
          subgoals: [
            {
              label: 'Negate the claim, which turns "no largest" into a finite list',
              detail:
                '"There is no largest prime" is a claim about every prime: for each one there is '
                + 'a larger. Negating it, by the rule the previous concept established, swaps the '
                + 'quantifier — there EXISTS a prime with none larger. If the primes have a '
                + 'biggest member then they stop, so they are a finite list that can be written '
                + 'out in full. That is the whole value of the assumption: a finite list is '
                + 'something you can multiply together, and an endless one is not.',
              socratic:
                '"There is no largest prime" is a claim about every prime. What exactly are you '
                + 'assuming when you assume it is false, and what does that assumption let you '
                + 'do that the original claim does not?',
            },
            {
              label: 'Build one number out of the whole list, then spoil the divisibility',
              detail:
                'Multiply the list: 2 × 3 × 5 × 7 × 11 × 13 = 30030. Every prime on the list '
                + 'divides that, by construction — it is one of the factors. Now add 1: '
                + 'N = 30031. Adding 1 is the smallest change that spoils every one of those '
                + 'divisions at once, and spoiling them is the point.',
              socratic:
                'The product of the list is divisible by everything on the list. What is the '
                + 'smallest change you can make to it so that nothing on the list divides it any '
                + 'more?',
            },
            {
              label: 'Divide by a listed prime and read the remainder',
              detail:
                '30030 = 13 × 2310, so 30031 − 13 × 2310 = 1: dividing N by 13 leaves remainder '
                + '1, not 0, so 13 does not divide N. The same computation works for every other '
                + 'prime on the list, because each of them divides 30030 exactly — 30030 is '
                + '2 × 15015, 3 × 10010, 5 × 6006, 7 × 4290 and 11 × 2730 — so each leaves the '
                + 'same remainder 1 after the added unit. No prime on the list divides N.',
              socratic:
                'You know 13 divides 30030 exactly. What does that tell you about dividing 30031 '
                + 'by 13, and why is the answer the same for every other prime on the list?',
            },
            {
              label: 'Reach the impossibility, and drop the only assumption you added',
              detail:
                'N is bigger than 1, so it has at least one prime factor — that is unique '
                + 'factorisation, from the arithmetic. That factor divides N, and nothing on the '
                + 'list does, so the factor is a prime that is not on the list. The list was '
                + 'assumed to contain every prime. Both of those cannot hold. Every step after '
                + 'the assumption was arithmetic and none of it is in doubt, so the assumption '
                + 'is the thing that is allowed to go: the primes do not stop.',
              socratic:
                'You now have a prime factor of N that is not on the list. Of everything you '
                + 'have written down, which is the one you are allowed to take back?',
            },
            {
              label: 'Factor N, and see that the argument never needed it to be prime',
              detail:
                '30031 ÷ 59 = 509, and both 59 and 509 are prime, so N is composite. The '
                + 'misreading to avoid is "the product of the primes plus one is prime". With '
                + 'the shorter list 2, 3, 5, 7 it is — 2 × 3 × 5 × 7 + 1 = 211, which is prime — '
                + 'and with this list it is not. Nothing breaks, because the argument never '
                + 'claimed N was prime. It claimed N has a prime factor off the list, and 59 is '
                + 'one: it is prime, it divides 30031, and it is nowhere on 2, 3, 5, 7, 11, 13.',
              socratic:
                '30031 is 59 × 509, so it is not prime. Which step of the argument did that '
                + 'break, and what did the argument actually need N to be?',
            },
          ],
          answer:
            'There is no largest prime. Suppose there were, so that 2, 3, 5, 7, 11, 13 is every '
            + 'prime. Then N = 2 × 3 × 5 × 7 × 11 × 13 + 1 = 30031, and dividing N by any member '
            + 'of the list leaves remainder 1 — 30031 − 13 × 2310 = 1, and likewise for the '
            + 'others — so none of them divides N. N is bigger than 1, so it has a prime factor, '
            + 'which is therefore a prime off the list, contradicting the assumption that the '
            + 'list was complete. N itself is composite: 30031 = 59 × 509, both prime and both '
            + 'off the list. The argument never needed N to be prime, which is what the shorter '
            + 'list shows from the other side — there 2 × 3 × 5 × 7 + 1 = 211 is prime.',
        },
      },
      {
        id: 'a-proof-by-cases-works-only-if-the-cases-leave-nothing-out',
        conceptId: 'proof-techniques',
        statement:
          'When no single argument covers every object, split the objects into cases and prove '
          + 'each one. The split carries the whole weight: cases that between them leave '
          + 'something out prove nothing about what was left out, however many of them there '
          + 'are. Every whole number is 2k or 2k + 1 and there is no third form, so two cases '
          + 'settle a claim about all of them. For "n² + n is even": if n = 2k then '
          + 'n² + n = 4k² + 2k = 2(2k² + k), and if n = 2k + 1 then '
          + 'n² + n = 4k² + 6k + 2 = 2(2k² + 3k + 1). Twice a whole number in both, so even '
          + 'either way. The failure mode is hard to see because an incomplete split can still '
          + 'reach a TRUE conclusion. "n² leaves remainder 0 or 1 on division by 3, never 2" is '
          + 'true. Somebody who proves it for n = 3k and for n = 3k + 1 and stops has covered '
          + '2025 and 2026 and said nothing whatever about 2027, which is 3 × 675 + 2. The '
          + 'missing case finishes it: (3k + 2)² = 9k² + 12k + 4 = 3(3k² + 4k + 1) + 1, so the '
          + 'remainder is 1 there too. The conclusion survives — and that it survives is the '
          + 'reason exhaustiveness has to be CHECKED against the split rather than felt from the '
          + 'answer.',
        position: 3,
        workedExample: {
          problem:
            'Prove that n² + n is even for every whole number n, by cases on whether n is even '
            + 'or odd. Then take the claim "n² never leaves remainder 2 on division by 3", '
            + 'proved for n = 3k and n = 3k + 1 only, decide whether that proof is finished, and '
            + 'finish it.',
          subgoals: [
            {
              label: 'Choose a split, and check that nothing falls outside it',
              detail:
                'Every whole number is either 2k for some whole k, or 2k + 1 for some whole k. '
                + 'No number is both and none is neither. That check comes FIRST, before either '
                + 'case is computed, because it is what makes two cases enough — not that two '
                + 'feels like a reasonable number of them.',
              socratic:
                'You are about to prove something about every whole number using two cases. '
                + 'What do you have to be sure of about those two cases before either '
                + 'computation is worth doing?',
            },
            {
              label: 'Do each case in terms of that case\'s own letter',
              detail:
                'Even case, n = 2k: n² + n = 4k² + 2k = 2(2k² + k). Odd case, n = 2k + 1: '
                + 'n² + n = (4k² + 4k + 1) + (2k + 1) = 4k² + 6k + 2 = 2(2k² + 3k + 1). Each '
                + 'line ends as 2 times a whole number, which is the definition of even, and in '
                + 'each the k has been kept general rather than given a value. Both cases hold, '
                + 'the two cases cover everything, so the claim holds for every whole number.',
              socratic:
                'In the odd case you reach 4k² + 6k + 2. What do you have to be able to pull out '
                + 'of it, and what has to be left behind for the claim to hold?',
            },
            {
              label: 'Count the cases the second claim\'s split actually needs',
              detail:
                'Now the claim "n² leaves remainder 0 or 1 on division by 3". Dividing by 3 can '
                + 'leave 0, 1 or 2, so the split is n = 3k, n = 3k + 1, n = 3k + 2 — three '
                + 'cases, not two. (That dividing by 3 leaves exactly one of three remainders is '
                + 'the general fact `division-algorithm` establishes, a concept above this one; '
                + 'what is used here is the single instance, which you can check by writing the '
                + 'three forms out.) A proof of the first two covers 2025 = 3 × 675 and '
                + '2026 = 3 × 675 + 1. Subtract: 2027 − 3 × 675 = 2, so 2027 is in the third '
                + 'case, and the two-case proof has said nothing about it at all.',
              socratic:
                'A proof covers n = 3k and n = 3k + 1. Subtract 3 × 675 from 2027 and look at '
                + 'what is left. Does either case cover it?',
            },
            {
              label: 'Finish the missing case, in terms of its own letter',
              detail:
                'Expand the third case: (3k + 2)² = 9k² + 12k + 4. Take off the largest multiple '
                + 'of 3 inside it, which is 3(3k² + 4k + 1) = 9k² + 12k + 3, and what remains is '
                + '(3k + 2)² − 3(3k² + 4k + 1) = 1. No k appears in the answer — at k = 0 it is '
                + '4 − 3 = 1, at k = 5 it is 289 − 288 = 1, at k = 9 it is 841 − 840 = 1 — so '
                + 'every number of the form 3k + 2 has a square leaving remainder 1. All three '
                + 'cases now hold and the three cases cover everything, so the claim is proved.',
              socratic:
                'The missing case squares to 9k² + 12k + 4. What multiple of 3 do you take off '
                + 'it, and what is left over?',
            },
            {
              label: 'Notice that the incomplete proof reached a true statement anyway',
              detail:
                'The claim was true all along, so nothing the two-case version concluded was '
                + 'false. It still was not a proof of it. That is the lesson worth keeping: a '
                + 'conclusion being true is no evidence that the argument reaching it covered '
                + 'the ground, so the truth of the answer can never be the check. The only check '
                + 'is counting the cases against the split, and it is done before the computing '
                + 'rather than after it. Had the claim been "n² never leaves remainder 1 on '
                + 'division by 3", the same two cases would have proved the first of them and '
                + 'been refuted by the second — and the gap would have been found by accident.',
              socratic:
                'The two-case proof reached a true conclusion. Why is that not a reason to '
                + 'accept it, and what is the only check that would have caught the gap?',
            },
          ],
          answer:
            'n² + n is even for every whole number n. If n = 2k it is 4k² + 2k = 2(2k² + k); if '
            + 'n = 2k + 1 it is 4k² + 6k + 2 = 2(2k² + 3k + 1). Two cases, and every whole '
            + 'number is one or the other, so the claim is proved. The second proof is NOT '
            + 'finished: dividing by 3 leaves three possible remainders, so n = 3k + 2 is a '
            + 'third case, and 2027 = 3 × 675 + 2 lies in it. Finishing it: '
            + '(3k + 2)² = 9k² + 12k + 4 = 3(3k² + 4k + 1) + 1, remainder 1, with no k left in '
            + 'the answer. All three cases hold, so "n² never leaves remainder 2 on division by '
            + '3" is proved — and the two-case version had already reached that true conclusion '
            + 'without establishing it.',
        },
      },
    ],
  },
]

/**
 * No edges, and the reason is containment rather than a judgement about which
 * edges are worth declaring.
 *
 * An authored ontology's edges may only name concepts it contains, or
 * `ontologyProblems` reports an unknown endpoint. This subject holds a single
 * concept, so there is no internal pair to join — and that concept's one
 * prerequisite, `quantifiers`, is an authored concept of
 * `predicates-and-quantifiers`. Being authored in ANOTHER subject fails the
 * containment test exactly as being an unwritten map node does, so the stranded
 * edge lives in `DISCRETE_MATHEMATICS.links` in atlas-structures.ts, which is
 * the area that owned the departing node.
 *
 * That is now the third entry in that one area's `links`, and the three of them
 * are one chain: `geometric-proof → propositional-logic → quantifiers →
 * proof-techniques`. Each was stranded by promoting its declaring end, each
 * time one promotion after the previous one had correctly left it alone, and
 * the pattern is general rather than a coincidence of these three: an edge is
 * owned by the node that DECLARES it, so walking up a chain strands exactly one
 * edge per step. A promotion up a chain should expect to add a `links` entry
 * and to invalidate the previous promotion's assertion that none was needed.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between
 * "there are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const METHODS_OF_PROOF: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
