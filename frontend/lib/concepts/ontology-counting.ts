/**
 * Counting and arrangements — the sixteenth subject, and one concept.
 *
 * `counting-principles` was a node of `discrete-mathematics` and is the whole of
 * this subject. `atlasProblems` rejects a map node whose id collides with an
 * authored concept — the composed list would hold two entries for the id and the
 * shadowing copy has no knowledge points, so a fully authored concept would read
 * as unteachable — so promoting is a MOVE out of that array rather than a
 * fill-in, and the node had to go.
 *
 * ── WHY THIS CONCEPT, WHICH IS THE FIRST PICK THE THIRD FACTOR DECIDED ────
 *
 * The field was recomputed from the tree rather than read out of the previous
 * promotion's header, which is the habit the fortieth promotion onward have each
 * had to repeat. 211 map nodes, 88 authored, 19 areas, 15 subjects, ELEVEN
 * ready — a ready node being one whose every `needs` is `isTeachable` — and none
 * floor-blocked. All ten journeys read zero unwritten steps on route, as they
 * have since 2026-11-18, so route demand ranked nothing and the three factors
 * had to do the whole job.
 *
 * NINE OF THE ELEVEN ARE UNDER A REFUSAL, and the count is only reachable by
 * opening files no habit points at. Seven are the standing set that promotions 40
 * through 42 each restated: `graphs-of-functions`, `relations`,
 * `linear-inequalities`, `complex-numbers`, `supremum-and-completeness`,
 * `constructions`, `non-euclidean-geometry`. The eighth is `word-problems`, which
 * the forty-third promotion refused on rulability — its content IS the
 * translation from a description into an equation, and an `evaluate` on the final
 * number grades the arithmetic and calls it modelling. The ninth is `eigenvalues`,
 * and it is the one worth naming twice: it is refused BY ITS HOST,
 * `ontology-matrices.ts`, in two separate places, while the live measurement
 * header recommended it as the strongest candidate. A refusal can live in the
 * file a concept would be FILED INTO, which is a place the measurement habit does
 * not look.
 *
 * That leaves `counting-principles` and `sample-spaces`, and the ranking went:
 *
 *  - RULABILITY REJECTED NEITHER. A number of arrangements and a probability are
 *    each a value `exactValue` settles. This is the usual outcome of the first
 *    factor and it is still worth computing, because when it does reject it
 *    rejects absolutely.
 *  - STRANDED EDGES TIED AT TWO, which is the first time that factor has tied
 *    since it was corrected. Count it as `needs.length` minus the number of
 *    `needs` sitting in the BEST HOST subject, not as subjects spanned — the
 *    forty-third promotion's correction. This node names `sets` and
 *    `binomial-theorem`, authored in `sets-and-membership` and
 *    `rational-expressions`; `sample-spaces` names `sets` and
 *    `fraction-arithmetic`, authored in `sets-and-membership` and
 *    `arithmetic-foundations`. Either could have taken the cheap filing beside
 *    `sets` and brought its stranding down to one, and `sets-and-membership` has
 *    declined BOTH by name — "it does not claim COUNTING as a subject". So each
 *    costs a new subject plus two `links` entries, which is what
 *    ontology-arithmetic.ts predicted of this pair at the thirty-ninth promotion
 *    and what has not changed since.
 *
 *    ONE CORRECTION TO WHERE THAT DECLINE LIVES, because four files now cite it
 *    and three of them cite it loosely. The sentence "it does not claim COUNTING
 *    as a subject" is in ontology-sets.ts's FILE HEADER, at the top, in a
 *    comment. It is NOT in that subject's `covers`. ontology-arithmetic.ts and
 *    ontology-vectors.ts both say "into its own file", which is right; a reader
 *    who compresses that to "into its own covers" — as an earlier draft of this
 *    header did — has upgraded a maintainer's note into shipped prose. The
 *    distinction decides how binding it is. What `covers` DOES say, verbatim and
 *    to a reader, is that the product and sum rules, permutations and
 *    combinations and many-set inclusion–exclusion "are `counting-principles`,
 *    also directly above" — a deferral by name, which is user-visible and is the
 *    stronger of the two facts for the argument below. Only the `covers` half is
 *    assertable from data, and tests/concepts-logic.mjs asserts that half.
 *  - DEPENDENTS DECIDED IT, four to two: `combinatorial-identities`,
 *    `recurrence-relations`, `group-actions` and `counting-probability` name this
 *    node, where `counting-probability` and `sampling-and-bias` name the other.
 *
 * THE THIRD FACTOR IS THE WEAKEST AND IT HAS NEVER BEEN THE DECIDER BEFORE, so
 * the pick is worth one line of argument rather than a citation. ontology-sets.ts
 * separated its own two candidates on dependents and called it "the weakest of
 * the three factors"; the reason it is weak is that a low dependent count costs
 * nothing SILENTLY — it is visible in the map the day it is taken — where a
 * dropped `links` entry leaves every suite green and a concept resting on
 * nothing. Here the silent cost is identical on both sides, so the visible one is
 * all there is to go on, and it is not close.
 *
 * ONE THING OUTSIDE THE THREE FACTORS POINTED THE OTHER WAY and is recorded
 * because it lost rather than because it decided. This node is an `armature.ts`
 * ANCHOR of the hasspab region and `sample-spaces` is not, so taking it empties a
 * slot and forces a refill — the fifth time that has been paid, and
 * ontology-sets.ts notes that a factor which only ever adds work to one side of a
 * choice belongs after the real ones. The refill is `generating-functions` and
 * the reasoning is in armature.ts beside it.
 *
 * AND ONE ARGUMENT THAT IS NOT A FACTOR AT ALL, which is the strongest single
 * reason this was the right node. `sets-and-membership`'s `covers` is PRINTED
 * VERBATIM to a reader, and it defers "the product and sum rules, permutations
 * and combinations, and inclusion–exclusion as a counting method over many sets"
 * to `counting-principles` by name. `rational-expressions` does the same in
 * prose: its `binomial-theorem` block says "what is genuinely missing is the
 * counting argument for why the entry is a count of subsets, and that is
 * `counting-principles` on the map". Two shipped subjects were pointing a learner
 * at a concept with no material. That is a different kind of debt from an
 * unwritten node nobody mentions, and authoring is the only thing that pays it.
 *
 * ── WHY A SIXTEENTH SUBJECT, WHICH WAS NOT A JUDGEMENT ────────────────────
 *
 * The cheap filing is foreclosed in writing, in two places of different weight.
 * `sets-and-membership` holds `sets`, this concept's nearer prerequisite. Its
 * file header says it "does not claim COUNTING as a subject: the product and sum
 * rules, permutations and combinations are `counting-principles`, also directly
 * above" — a maintainer's note, binding on whoever reads the file. Its `covers`
 * says the same boundary to a LEARNER, naming this node as where counting lives.
 * Filing here anyway would have made the second false, which is the half that
 * matters, and both are right on the merits: that subject's claim is an object
 * fixed by what belongs to it, and the one counting fact it keeps — the two-set
 * correction — is there because the operations force it, not because it is doing
 * combinatorics.
 *
 * `rational-expressions` holds `binomial-theorem`, the other prerequisite, and is
 * the worse home rather than the second-best one. C(9, 3) and the fourth entry of
 * row 9 are the same number, which is the connection the second knowledge point
 * below is built on — but that subject starts at polynomial arithmetic and is
 * about the algebra of quotients, and a counting subject inside it would make its
 * `covers` a promise about arrangements of people. The concepts are adjacent; the
 * subjects are not.
 *
 * So the layer gets its own subject and joins the rest through the area's
 * `links`, which is the pattern ontology-arithmetic.ts established and the ninth
 * through fifteenth subjects repeated. One concept is not a reason to hesitate:
 * `solid-measure`, `statements-and-connectives`, `predicates-and-quantifiers`,
 * `methods-of-proof`, `sets-and-membership` and `data-summaries` each ship with
 * exactly one, and a subject is a boundary rather than a volume.
 *
 * ROOM TO GROW IS REAL AND IS THE SAME PROMOTION THAT WOULD FILL IT.
 * `combinatorial-identities` sits directly above this concept and needs
 * `mathematical-induction` as well, which is authored in `functions-and-inverses`
 * — so the moment this file ships, that node is READY, and it is the only node
 * this promotion makes ready. A future run filing it here would give this subject
 * a second concept and an internal edge, which is the growth path
 * `solid-measure` had to admit it did not have.
 *
 * ── THE SUBJECT IS NAMED FOR THE LAYER, NOT THE AREA AND NOT THE NODE ─────
 *
 * `counting-and-arrangements`, and both halves of that are a refusal the ninth
 * and tenth subjects each found the hard way.
 *
 * Not `discrete-mathematics`, which is the id of the AREA this concept was
 * promoted out of. `areaOf` answers with a subject id for an authored concept and
 * an area id for a map node, so a collision would put two different things behind
 * one string and `getOntology(id)` and `conceptById(M, id)` would answer about
 * different objects.
 *
 * Not `counting-principles` either, which is the id of the one concept this
 * subject contains — the same hazard by a worse route, because nothing looks
 * wrong: the concept would report itself as its own area.
 *
 * And `counting-and-arrangements` rather than `combinatorics` because the second
 * would make this subject's `covers` a promise about generating functions, graph
 * enumeration and the probabilistic method, none of which is here and most of
 * which is unwritten two areas away. Naming it for what the three points below
 * actually do is the same discipline `data-summaries` applied when it declined to
 * call itself `statistics`.
 *
 * ── FIDELITY IS `checked`, AND THE PATTERN HAS TWO KNOWN SHORTFALLS ───────
 *
 * The map node's pattern is carried verbatim, as every promotion since the fourth
 * has carried its own. Widening or narrowing one in the same change that adds
 * material moves the recognition figure in tests/atlas.mjs and the
 * written-concept count at once, and there is no way afterwards to say which edit
 * moved which. The node already declared `checked` — `expandNode` sets it from
 * the presence of a `match` — so recognition is unmoved by this promotion, which
 * is the correct reading and the reason the figure is trustworthy.
 *
 * BOTH SHORTFALLS ARE PRECISION RATHER THAN RECALL, which is the worse direction
 * and so is named rather than left to be discovered:
 *
 *  - "Linear combination" is a real article title and matches, because the
 *    alternation has no left boundary on `combination`. That page is about
 *    vectors. `conceptsInOffering` sorts the matched concepts by pattern SOURCE
 *    LENGTH descending, and ontology-vectors.ts's span pattern is 65 characters
 *    against this one's 61, so the vectors concept ranks first and this one
 *    trails it — the collision is ordered correctly, and by an accident of
 *    character count rather than by anything about meaning. It is also only
 *    ordered at all because the one caller, ConceptTrail.tsx, passes the composed
 *    `MATHEMATICS`; called per-ontology the two never meet in one sort.
 *  - "Pigeonhole principle" matches and is NOT taught below, for the reason in
 *    the boundary section. So the pattern claims a page whose content this
 *    concept does not hold.
 *
 * Narrowing is a separate change and neither shortfall has a one-line fix: a
 * left boundary on `combination` would still take "Convex combination", and
 * dropping `pigeonhole principle` would give that page to nothing at all, which
 * is worse than giving it to the concept nearest it.
 *
 * ── WHAT IS NOT HERE, WHICH IS A BOUNDARY RATHER THAN A BACKLOG ───────────
 *
 * THE PIGEONHOLE PRINCIPLE. Its conclusion is an EXISTENCE claim — some box holds
 * at least two — and no kind in this build can ask for one: `evaluate` wants a
 * value, and "there is a box with two in it" is not a value. What IS rulable in
 * the vicinity is the THRESHOLD, the least number of objects forcing a repeat,
 * and that is a real concept's worth of material rather than a subgoal: the
 * interesting cases are the ones where the boxes have to be constructed, and
 * constructing the boxes is the whole difficulty. Writing one threshold task here
 * would teach a learner to divide and round up, which is not the principle.
 *
 * COUNTING WITH REPETITION ALLOWED, and the omission is deliberate. n^r for
 * ordered-with-repetition is one line from the product rule and would have been
 * cheap; the unordered-with-repetition count is C(n + r − 1, r) and is the one
 * place in elementary counting where the standard argument is a re-encoding
 * rather than a choice, so it does not belong beside three points that are all
 * about choices. The first point's worked example does count with a pool that
 * shrinks and one that does not, which is the distinction that matters at this
 * layer.
 *
 * GENERAL INCLUSION–EXCLUSION, over n sets. The third point does three, which is
 * the smallest number where the alternating sign is forced rather than decorative
 * — at two sets there is one correction and nothing to alternate. The general
 * statement needs a sum over subsets of the index set, and `combinatorial-
 * identities` directly above is where a counting identity gets PROVED by counting
 * the same set two ways. This point establishes the three-set case and audits it
 * element by element, which is the argument the general case generalises.
 *
 * ── WHY EVERY TASK IS `evaluate`, AND THE FUNCTION THAT IS MISSING ────────
 *
 * Nine tasks, three on each point, all nine `evaluate` and every one settled by
 * exact integer arithmetic with no worker. That is the worker-free property
 * ontology-sets.ts and ontology-algebra.ts both hold, and it is load-bearing in
 * the same way: a subject whose prerequisites are a set and a Pascal row sits low
 * enough that a worker outage must not wall it off.
 *
 * NO FACTORIAL, AND THE REASON IN ontology.ts IS NOW INACCURATE. That file's
 * `binomial-theorem` block says the closed form cannot be written "because
 * `ALLOWED_FUNCTIONS` in expr.ts has none" — and expr.ts does list `factorial`,
 * so the parser accepts it. What it cannot do is RULE it: `exactValue` in
 * numerals.ts switches on integer, rational, decimal, negate, add, multiply,
 * subtract, divide, power, sqrt and abs, and has no case for a function call. So
 * `factorial(9)/factorial(6)` parses and then returns null, which drops the task
 * to the worker. The conclusion both files reach is right and the stated reason
 * has moved, which is worth correcting here rather than quietly relying on.
 *
 * THE ENCODING IS THEREFORE THE DESCENDING PRODUCT ITSELF, and that is better
 * than the closed form rather than a workaround:
 *
 *     ordered, r from n        a*b*c — the pool shrinking by one per factor
 *     unordered, r from n      (a*b*c)/d — the same, divided by the r! orderings
 *     a union of three         a+b+c-d-e-f+g — three singles, three pairs, one triple
 *     a net multiplicity       a-b+c — how many times one element is counted
 *
 * `9*8*7` IS WHAT THE PRODUCT RULE SAYS and `factorial(9)/factorial(6)` is a
 * rearrangement of it that cancels back to the same three factors. A learner who
 * writes the descending product has performed the rule; one who writes the
 * quotient of factorials has performed a substitution into a formula. The
 * absence costs this concept nothing at the sizes it asks about, and it would
 * cost something at general n — which is why no task asks for a general n, the
 * same boundary `binomial-theorem` drew for the same reason.
 *
 * NO `transform_to_form`. The forms this build ships are claims about an
 * ALGEBRAIC shape — expanded, factored, a completed square, a prime
 * factorisation, a reduced surd — and there is no demand of shape in this
 * material. `(a*b*c)/d` is not asked as a form because the question is how many
 * committees there are, not how to write the count.
 *
 * NO `counterexample` AND NO `justify`, and the second is the live loss. The
 * `justify` ask is the third point's audit — "say why the triple overlap is added
 * back exactly once" — and naming the kind in an objective would promise an
 * observation nothing in this build can make. What stands in for it is a task
 * whose ANSWER is the justification: the net multiplicity of an element in all
 * three sets comes out as 1, and that number is the reason the term is there.
 *
 * NO `domainConditions` ON ANY OF THE NINE. Every expression is a sum,
 * difference, product or quotient of counts, and the one division is by 6, so
 * there is no value of a declared variable at which anything is undefined.
 *
 * ── THE TWO STRANDED EDGES, AND THE THIRD THAT WAS CHECKED FOR ────────────
 *
 * The node declared two `needs` and BOTH are stranded, which is the first time a
 * promotion has stranded two since the thirty-fourth. An authored ontology may
 * only name concepts it contains, so neither edge can live in the `EDGES` below —
 * `sets` is a concept of `sets-and-membership` and `binomial-theorem` one of
 * `rational-expressions`. Both are entries in `DISCRETE_MATHEMATICS.links`, filed
 * with the area that OWNED the departing node rather than with either subject
 * holding a far end, and both ends of both are authored, so unlike a `links`
 * entry pointing at an unwritten node each GATES from the moment it exists.
 *
 * `confusedWith` ON THE DEPARTING NODE: NONE, checked before deleting it rather
 * than assumed. `expandEdges` in atlas.ts turns a node's `confusedWith` into an
 * `interferes_with` edge, so deleting the node would have deleted the edge with
 * no suite going red — interference constrains SELECTION rather than gating.
 * `exercises`: none either, which becomes an `encompasses` edge by the same route
 * and vanishes just as silently. Both absences are asserted in tests/atlas.mjs
 * rather than merely described, because an absence has to be looked for to be
 * known.
 *
 * AN `encompasses` EDGE POINTED INTO THIS CONCEPT AND WAS NEVER AT RISK FROM THIS
 * PROMOTION — AND THE FORTY-SIXTH THEN DESTROYED IT. Worth the paragraph twice
 * over, because the check that found it was looking the other way and the thing
 * that killed it was not a dropped edge at all.
 *
 * `counting-probability`, then a node of `probability`, declared
 * `exercises: ['counting-principles']` — probability as a ratio of counts really
 * does exercise the counting — and `expandEdges` made that
 * `counting-probability => counting-principles`. The edge was owned by the node
 * that DECLARED it, that node stayed, and `composeAtlas` resolved it untouched.
 *
 * The forty-sixth promotion authored that node into `chance-and-events`, which
 * deleted the edge with nothing going red, and the credit claim is now
 * INEXPRESSIBLE: `encompasses` may only be declared in an ontology containing
 * both ends, that subject does not contain this concept, and a `links` entry
 * carries no KIND. So a learner who has just computed C(12, 3) still has this
 * concept come due as though untouched. ontology-chance.ts argues why the subject
 * boundary was worth that and records the loss; what belongs here is that the
 * claim held on the merits and that this subject is the one paying for it. The
 * repair is a `kind` on `links`, not a different filing.
 *
 * AND THE ASSERTION WENT THROUGH TWO WRONG FORMS BEFORE THE EDGE OUTLIVED BOTH,
 * which is the more useful half of the story. The first draft in tests/atlas.mjs
 * said "no non-prerequisite edge touches this id", which passed on the day the
 * material was written and was wrong in the one direction that matters: it would
 * have been satisfied by DELETING a credit edge another area owns. So the check
 * became two claims —
 * nothing this node declared is missing, and the inbound edge is still there —
 * and that is the general shape. An absence assertion scoped to an id rather than
 * to a DIRECTION silently demands the loss it was written to prevent.
 *
 * THE SECOND FORM WAS RIGHT AND STILL ROTTED. Its positive half asserted an edge
 * whose OWNER WAS A MAP NODE, which is a claim about where something has not been
 * authored YET — and the forty-sixth promotion authored it, so the clause went red
 * while nothing it was defending had changed. A direction-scoped assertion is safe
 * against the loss it was written against and is not safe against its subject
 * being promoted. What stands in tests/atlas.mjs now is the only form that
 * survives both: every edge naming this concept is a `prerequisite`, and the loss
 * is asserted in the group of the promotion that caused it.
 *
 * AND NO CREDIT EDGE, WHICH IS A JUDGEMENT THAT COULD NOT HAVE BEEN RECORDED
 * EITHER WAY. The obvious claim is `counting-principles => binomial-theorem`: the
 * second knowledge point computes C(9, 3) = 84 and reads the same 84 off row 9,
 * so a learner exercising this has surely exercised that. Measured against the
 * tasks it does not hold. What the binomial theorem drills is the EXPANSION of
 * (a + b)ⁿ, and nothing below expands anything — the Pascal row is read as a
 * check on a count, which is the arrow pointing the other way. A review deferred
 * on this evidence would be deferred on work the learner did not do.
 *
 * The part worth writing down is that the merits were the only thing that could
 * have settled it, because the edge is INEXPRESSIBLE here whichever way the
 * argument went. `encompasses` may only be declared in an ontology containing
 * both ends, this subject does not contain `binomial-theorem`, and a `links`
 * entry carries `from`, `to` and `because` and no KIND — it hard-codes
 * `prerequisite`. So had the credit claim held, filing this concept in
 * `rational-expressions` would have become the only way to say so, and a boundary
 * refused above on the merits would have had to be re-argued against a structural
 * limit. That is the fourth time a cross-subject edge kind has had nowhere to
 * live, and ontology.ts's `binomial-theorem` block records the same trap from the
 * other side.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'counting-and-arrangements',
  name: 'Counting and arrangements',
  covers:
    'How big a set is, worked out from the structure of the choices that build it rather than '
    + 'by writing its members down. Everything here is two rules and one repair. First, THE '
    + 'PRODUCT AND SUM RULES, and which applies is decided by a word. A thing built by making '
    + 'one choice AND then another is counted by MULTIPLYING, and the condition is narrower than '
    + '"the choices are unrelated": the number of options for the second choice must be the same '
    + 'whichever option was taken first. The SET of available options may change and usually '
    + 'does — after a first digit is used the remaining nine are a different nine — and only the '
    + 'COUNT has to hold still. A thing that is of one kind OR another, with nothing of both '
    + 'kinds, is counted by ADDING. When the product rule\'s condition fails the repair is to '
    + 'split into cases where it holds and add those, which is why the two rules are one topic '
    + 'and not two. Second, ORDER IS THE WHOLE DIFFERENCE BETWEEN THE TWO SELECTION COUNTS. '
    + 'Choosing r things from n in order is the product rule with the pool shrinking by one each '
    + 'time: n(n − 1)...(n − r + 1), a descending product of r factors. Choosing r things with '
    + 'no order is the same count divided by r!, because every selection of r things was reached '
    + 'once for each of the r! ways of putting those same r things in order — and the division '
    + 'is exact because that overcount is the same for every selection, which is the condition '
    + 'rather than a convenience. The unordered count is the BINOMIAL COEFFICIENT: C(9, 3) = 84 '
    + 'is the fourth entry of row 9 of the triangle `binomial-theorem` builds by adding adjacent '
    + 'entries, and the counting argument for why that entry counts subsets is here rather than '
    + 'there. Row 9 sums to 512 = 2⁹, which is the subset count `sets` gets from each member '
    + 'being independently in or out — the same number reached by choosing a size first and by '
    + 'not. Third, OVERLAPPING CASES NEED INCLUSION–EXCLUSION, AND AT THREE SETS THE FIRST '
    + 'REPAIR OVERSHOOTS. Adding three sizes counts an element of two sets twice and an element '
    + 'of all three three times; subtracting the three pairwise overlaps fixes the first and '
    + 'takes the second down to ZERO, so an element in all three has been counted out of the '
    + 'union entirely and the triple overlap is added back once: |A ∪ B ∪ C| = |A| + |B| + |C| − '
    + '|A ∩ B| − |A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|. The way to read that is as an audit of one '
    + 'element at a time — exactly one, exactly two, all three — and each kind must end up '
    + 'counted once. What is NOT here is a boundary rather than a backlog. The PIGEONHOLE '
    + 'PRINCIPLE concludes that something EXISTS, which no task kind in this build can ask for, '
    + 'and the rulable question near it is a threshold whose difficulty is constructing the '
    + 'boxes. COUNTING WITH REPETITION allowed is left out: the ordered case is one line from '
    + 'the product rule and the unordered case is a re-encoding rather than a choice. '
    + 'INCLUSION–EXCLUSION over n sets, and proving a counting identity by counting one set two '
    + 'ways, are `combinatorial-identities` directly above. And no task below asks for a LIST: '
    + 'the engine grades an expression, so every question asks for a count, and the worked '
    + 'examples are where the arrangements get written out.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'counting-principles',
    name: 'Counting',
    subjectId: subject.id,
    scope: {
      id: 'counting-principles',
      label: 'Counting',
      hint: 'permutation combination factorial inclusion exclusion pigeonhole',
      /*
       * The map node's pattern and its `terms` as the hint, both carried across
       * unchanged. The two precision shortfalls — "Linear combination" and
       * "Pigeonhole principle" — are argued in this file's header, along with
       * why neither has a one-line narrowing and why the first is ranked
       * correctly anyway.
       */
      match: /\b(combination|permutation|pigeonhole principle|combinatoric)/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-from-the-structure-whether-counts-multiply-or-add',
        statement:
          'Produce the number of ways a sequence of choices can be made, and so treat a count '
          + 'as something built from the structure of the choices rather than read off a list. '
          + 'Produce the count for one case of a split in which the product rule holds, having '
          + 'identified that it fails across the whole problem — the test being whether the '
          + 'number of options for a later choice is the same whichever earlier option was '
          + 'taken, not whether the choices feel independent. Produce the total from the cases, '
          + 'and so use addition only where nothing belongs to two cases at once.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'count-ordered-and-unordered-selections-and-know-which-divides',
        statement:
          'Produce the number of ORDERED selections of r objects from n as a descending product '
          + 'of r factors, and so read it as the product rule applied to a pool that shrinks by '
          + 'one. Produce the number of UNORDERED selections by dividing that product by the '
          + 'orderings of a single selection, and so decide, from what the problem calls two '
          + 'different outcomes, which of the two counts is being asked for. Produce the same '
          + 'unordered count by choosing which objects are left OUT, and so read the symmetry of '
          + 'the binomial coefficient as two descriptions of one choice.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'repair-an-overlapping-count-and-audit-one-element-through-it',
        statement:
          'Produce the size of an overlap of two conditions when each condition is a '
          + 'divisibility, and so identify what the pairwise terms of the correction are '
          + 'counting. Produce the number of times a single element is counted by the whole '
          + 'alternating expression, and so settle why the triple overlap is ADDED rather than '
          + 'subtracted — the answer being the justification and not merely consistent with it. '
          + 'Produce the size of a union of three overlapping sets, and so distinguish a '
          + 'correction derived by auditing an element from a formula recalled by its shape.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'multiply-choices-that-and-together-and-add-cases-that-do-not-overlap',
        conceptId: 'counting-principles',
        statement:
          'A count is built from the structure of the choices that make the thing being counted, '
          + 'and two rules cover it. If the thing is made by one choice AND then another, the '
          + 'counts MULTIPLY. If the thing is of one kind OR another and nothing is of both '
          + 'kinds, the counts ADD. The product rule\'s condition is the one that gets dropped, '
          + 'and it is narrower than "the choices are unrelated": the NUMBER of options for the '
          + 'second choice has to be the same whichever option was taken first. The SET of '
          + 'options is allowed to change and usually does — once a first digit is used, the '
          + 'nine digits still available are a different nine depending on which it was — and '
          + 'the rule only needs the count to hold still. When it does not hold still the rule '
          + 'is not merely inaccurate, it is inapplicable, and the repair is to SPLIT the problem '
          + 'into cases inside which it does hold and then add those. That is why the two rules '
          + 'are one topic: the sum rule is what you reach for when the product rule has just '
          + 'failed, and the cases have to be chosen so that nothing is in two of them and '
          + 'nothing is left out of all of them.',
        position: 1,
        /*
         * No `automaticityTarget`. Multiplying three small numbers would time
         * beautifully, which is the trap: the skill here is deciding WHICH rule
         * applies and noticing when the product rule's condition has failed, and
         * a speed reward trains the multiplication a learner can already do.
         */
        workedExample: {
          problem:
            'Count the three-digit numbers — 100 to 999 — whose three digits are all different. '
            + 'Then count how many of those are EVEN. Do the second one by trying the product '
            + 'rule first and saying exactly where it breaks, rather than by splitting into '
            + 'cases from the start.',
          subgoals: [
            {
              label: 'Count position by position, and check the count does not depend on the choice',
              detail:
                'Three choices, made left to right. The first digit cannot be 0, so there are 9 '
                + 'options. The second may be anything except the first digit: 10 digits less the '
                + '1 used, so 9 options. The third may be anything except the two used: 8 '
                + 'options. The product rule applies because at each step the NUMBER of options '
                + 'is the same whichever earlier digits were chosen — if the first digit was 7 '
                + 'the second may be any of {0,1,2,3,4,5,6,8,9} and if it was 3 the second may be '
                + 'any of {0,1,2,4,5,6,7,8,9}, two different sets of the same size 9. So '
                + '9 × 9 × 8 = 648.',
              socratic:
                'You are choosing three digits in order and the second one must avoid the first. '
                + 'Pick two different values for the first digit and write out what the second '
                + 'digit may be in each case. What is different about those two lists, and what '
                + 'is the same — and which of those two things does multiplying require?',
            },
            {
              label: 'Try the product rule on the even count and get a definite number',
              detail:
                'Being even is a condition on the LAST digit, so count that one first: it must be '
                + 'one of 0, 2, 4, 6, 8, which is 5 options. Then the first digit avoids 0 and '
                + 'avoids the last digit, which looks like 10 − 2 = 8 options, and the middle '
                + 'digit avoids the other two, which looks like 8. That gives 5 × 8 × 8 = 320. '
                + 'The number is worth producing rather than skipping, because the next subgoal '
                + 'is about why it is wrong, and a wrong count you have not computed is easy to '
                + 'believe you would never have made.',
              socratic:
                'The last digit carries the condition, so count it first. How many options does '
                + 'it have, and then how many do you get for the first digit if you say it must '
                + 'avoid 0 and avoid the last digit?',
            },
            {
              label: 'Find the choice whose option count moved, which is where the rule breaks',
              detail:
                'Test the condition instead of assuming it. If the last digit is 2, the first '
                + 'digit must avoid 0 and avoid 2, leaving {1,3,4,5,6,7,8,9}: 8 options. If the '
                + 'last digit is 0, the first digit must avoid 0 and avoid 0 — the same digit '
                + 'twice — leaving {1,...,9}: 9 options. The count MOVED, from 8 to 9, so the '
                + 'product rule does not apply to this problem as posed. Notice what went wrong: '
                + 'the exclusions overlapped in one case and not the others, and the single '
                + 'number 8 cannot describe both.',
              socratic:
                'Work out how many first digits are available when the last digit is 2, and then '
                + 'when the last digit is 0. Why are those two answers different, and what does '
                + 'that tell you about the 8 you used a moment ago?',
            },
            {
              label: 'Split on exactly the thing that moved, so each case has one option count',
              detail:
                'The split has to be on whether the last digit is 0, because that is the only '
                + 'thing the first digit\'s count depended on. Case A, last digit 0: the first '
                + 'digit is any of 1 to 9, so 9 options, and the middle digit avoids the first '
                + 'and avoids 0, so 8. That is 9 × 8 = 72. Case B, last digit one of 2, 4, 6, 8: '
                + '4 options for it, the first digit avoids 0 and the last digit — two different '
                + 'digits — so 8 options, and the middle avoids both of those, so 8. That is '
                + '4 × 8 × 8 = 256. Inside each case every option count holds still, so the '
                + 'product rule applies to each.',
              socratic:
                'You have found that the first digit\'s count is 9 in one situation and 8 in the '
                + 'others. What should the two cases be, and how do you check that the product '
                + 'rule is safe inside each one before you use it?',
            },
            {
              label: 'Add the cases, having checked nothing is in both and nothing is outside',
              detail:
                '72 + 256 = 328. The addition is licensed because a number\'s last digit is '
                + 'either 0 or one of 2, 4, 6, 8 and never both, so no number was counted in both '
                + 'cases; and every even three-digit number with distinct digits ends in one of '
                + 'those five digits, so none was left out of both. Compare with the product '
                + 'rule\'s 320: the gap is 8, and it is accounted for exactly — Case A really has '
                + '9 × 8 = 72 and the product rule had allowed it 8 × 8 = 64. The error was one '
                + 'option in one case, which is the size of mistake that does not announce '
                + 'itself.',
              socratic:
                'You have 72 and 256. Before adding them, what two things do you have to be sure '
                + 'of about the cases? And once you have the total, what is its difference from '
                + 'the 320 the product rule gave, and which case does that difference come from?',
            },
          ],
          answer:
            'Three-digit numbers with all digits different: 9 × 9 × 8 = 648. Even ones: the '
            + 'product rule does not apply, because the first digit has 9 options when the last '
            + 'digit is 0 and 8 options when it is 2, 4, 6 or 8 — so the single count the rule '
            + 'needs does not exist. Splitting on exactly that: last digit 0 gives 9 × 8 = 72, '
            + 'and last digit in {2, 4, 6, 8} gives 4 × 8 × 8 = 256. The cases are disjoint and '
            + 'cover everything, so the total is 72 + 256 = 328. The product rule\'s 320 is short '
            + 'by 8, which is exactly Case A\'s 72 against the 64 it had been allowed.',
        },
      },
      {
        id: 'ordered-selections-are-a-descending-product-and-unordered-ones-divide-by-the-orderings',
        conceptId: 'counting-principles',
        statement:
          'When you select r objects from n, everything depends on whether two selections that '
          + 'take the SAME objects in a different order are one outcome or two. If order is '
          + 'information, it is the product rule with a shrinking pool: n choices, then n − 1, '
          + 'then n − 2, down to n − r + 1 — a DESCENDING PRODUCT of r factors. If order is not '
          + 'information, that same product has counted each selection once for every way of '
          + 'arranging the r objects it chose, and there are r! such ways, so divide by r!. The '
          + 'division is the only new idea in this point; the multiplication is the previous '
          + 'point. And the division is exact rather than approximately right because the '
          + 'overcount is the SAME for every selection — every group of r objects has exactly r! '
          + 'orderings, not "about" r! — which is the condition, and a count whose groups were '
          + 'overcounted by differing amounts could not be repaired by one division at all. The '
          + 'unordered count is written C(n, r) and is the BINOMIAL COEFFICIENT: it is the entry '
          + '`binomial-theorem` reaches by adding adjacent entries of the row above, and this is '
          + 'where the reason that entry counts subsets lives.',
        position: 2,
        workedExample: {
          problem:
            'A club has 9 members. Count the ways to fill three distinct offices — president, '
            + 'secretary, treasurer — with three different members. Then count the ways to choose '
            + 'a committee of 3 members with no offices. Then check the second answer twice: '
            + 'against row 9 of Pascal\'s triangle, and by counting which members are left OUT '
            + 'instead of which are in.',
          subgoals: [
            {
              label: 'Count the offices with the pool shrinking, which is the product rule again',
              detail:
                'Three choices in order: 9 members for president, then 8 remaining for '
                + 'secretary, then 7 for treasurer. The option count holds still at each step '
                + 'whoever was picked earlier — after any president there are exactly 8 people '
                + 'left — so the product rule applies: 9 × 8 × 7 = 504. Order is information '
                + 'here, and that is a fact about the PROBLEM rather than about the arithmetic: '
                + 'Ann as president with Bob as secretary is a different outcome from Bob as '
                + 'president with Ann as secretary, because the two of them hold different jobs.',
              socratic:
                'You are filling three different offices from 9 people. How many options does '
                + 'each office have in turn, and what makes "Ann president, Bob secretary" a '
                + 'different outcome from "Bob president, Ann secretary"?',
            },
            {
              label: 'Ask whether order is information, which is the only question that matters',
              detail:
                'For the committee it is not. A committee of Ann, Bob and Cleo is the same '
                + 'committee however it was written down or in whatever sequence the three were '
                + 'picked — there is no job to tell them apart. So the 504 is not the answer: it '
                + 'is an answer to a different question, and the two questions differ in nothing '
                + 'except whether the selected objects carry labels. This is the whole content of '
                + 'the point, and it is a reading of the problem rather than a step of '
                + 'calculation.',
              socratic:
                'A committee of Ann, Bob and Cleo has been chosen. Did the order they were picked '
                + 'in change anything about the committee — and how does your answer change which '
                + 'of the two counts you want?',
            },
            {
              label: 'Count how many times one committee was counted, and check it is the same for all',
              detail:
                'Take the committee {Ann, Bob, Cleo} and ask how many of the 504 office-fillings '
                + 'used exactly those three people. That is the number of ways to arrange three '
                + 'particular people in three particular offices: 3 × 2 × 1 = 3! = 6. Now the '
                + 'part the division depends on: this 6 is the same for EVERY committee of three. '
                + 'Any three people can be put in the three offices in 6 ways — the count never '
                + 'mentioned which three they were. So the 504 is 6 copies of each committee, '
                + 'uniformly.',
              socratic:
                'How many of the 504 office-fillings use exactly Ann, Bob and Cleo? Now answer '
                + 'the same question for three different members — and why does it matter that '
                + 'the two answers agree?',
            },
            {
              label: 'Divide, because every committee was overcounted by the same factor',
              detail:
                '504 ÷ 6 = 84. The division is exact and that is a consequence rather than a '
                + 'convenience: if different committees had been counted different numbers of '
                + 'times there would be no single number to divide by, and the repair would have '
                + 'to be a case split like the one in the first point. The condition "the '
                + 'overcount is the same for every selection" is doing the same job here that '
                + '"the option count is the same whichever was chosen first" did there — both are '
                + 'the hypothesis a one-line rule needs, and both are worth checking rather than '
                + 'assuming.',
              socratic:
                'The 504 counts each committee 6 times and you want each counted once. What do '
                + 'you do to 504 — and what would have gone wrong if some committees had been '
                + 'counted 6 times and others 4?',
            },
            {
              label: 'Check against the Pascal row, which is where the two concepts meet',
              detail:
                'Row 9 of the triangle, built by `binomial-theorem` from adding adjacent entries '
                + 'of row 8, reads 1, 9, 36, 84, 126, 126, 84, 36, 9, 1. Counting from the start '
                + 'at 0, entry 3 is 84 — the answer. So the binomial coefficient is not merely '
                + 'equal to a committee count by coincidence: C(9, 3) IS the number of 3-member '
                + 'subsets of a 9-member set, and that is the counting argument the other concept '
                + 'said was missing from it. One more check in the same place: the whole row sums '
                + 'to 1 + 9 + 36 + 84 + 126 + 126 + 84 + 36 + 9 + 1 = 512 = 2⁹, which is the '
                + 'number of subsets `sets` gets from each of the 9 members being independently '
                + 'in or out. Counting the subsets by size and adding, or ignoring size '
                + 'altogether, reach the same number.',
              socratic:
                'Row 9 of Pascal\'s triangle is 1, 9, 36, 84, 126, 126, 84, 36, 9, 1. Find your '
                + '84 in it, and then add the whole row up. Where have you seen that total '
                + 'before, and what were the 9 things being decided when you did?',
            },
            {
              label: 'Count the members left out instead, and read the symmetry off the answer',
              detail:
                'Choosing 3 members to be on the committee is the same act as choosing 6 members '
                + 'NOT to be — each choice determines the other, so the two counts must agree. '
                + 'Counting the 6 left out directly: 9 × 8 × 7 × 6 × 5 × 4 = 60480 ordered '
                + 'selections, divided by 6! = 720 orderings of each group of six, is '
                + '60480 ÷ 720 = 84. The same 84, which is the symmetry C(9, 3) = C(9, 6) that '
                + 'makes row 9 read the same forwards and backwards. The agreement is not a '
                + 'coincidence to be remembered but the two halves of one decision, and it is '
                + 'also the cheaper route in practice: C(9, 6) through the longer product is six '
                + 'factors where C(9, 3) is three, so the symmetry is worth using in the '
                + 'direction that shortens the work.',
              socratic:
                'Every committee of 3 leaves exactly 6 members off it. Why does that mean the '
                + 'number of committees of 3 and the number of ways to pick 6 to exclude have to '
                + 'be equal — and which of the two descending products would you rather compute?',
            },
          ],
          answer:
            'Offices: 9 × 8 × 7 = 504, because order is information when the three posts are '
            + 'different. Committee: each committee of 3 accounts for 3! = 6 of those 504, the '
            + 'same 6 for every committee, so 504 ÷ 6 = 84. Checks: row 9 of Pascal\'s triangle '
            + 'is 1, 9, 36, 84, 126, 126, 84, 36, 9, 1 and its entry 3 is 84, so C(9, 3) is the '
            + 'number of 3-member subsets of a 9-member set; the row sums to 512 = 2⁹, agreeing '
            + 'with each member being independently in or out. Counting the 6 excluded instead '
            + 'gives 9 × 8 × 7 × 6 × 5 × 4 = 60480 divided by 6! = 720, which is 84 again — the '
            + 'symmetry C(9, 3) = C(9, 6), because naming who is in names who is out.',
        },
      },
      {
        id: 'three-overlapping-sets-need-the-triple-added-back-after-the-pairs-remove-it-entirely',
        conceptId: 'counting-principles',
        statement:
          'The sum rule needs the cases to be disjoint, and when they are not, adding the sizes '
          + 'counts the shared elements more than once. With TWO sets the repair is one '
          + 'subtraction, which `sets` establishes. With THREE the first repair overshoots, and '
          + 'that is the whole content of this point. Add |A| + |B| + |C| and an element in '
          + 'exactly two of the sets has been counted twice, while an element in all three has '
          + 'been counted three times. Subtract the three pairwise overlaps: the element in '
          + 'exactly two sits in exactly ONE of those overlaps, so it loses one count and is now '
          + 'right; the element in all three sits in ALL THREE overlaps, so it loses three counts '
          + 'and is now counted zero times. It is in the union and it has been counted out of it. '
          + 'So the triple overlap goes back, once: |A ∪ B ∪ C| = |A| + |B| + |C| − |A ∩ B| − '
          + '|A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|. The way to read that expression is as an AUDIT of '
          + 'one element at a time. There are only three kinds of element in the union — in '
          + 'exactly one set, in exactly two, in all three — and the expression is correct '
          + 'exactly because each kind ends up counted once. Recalled as a pattern of '
          + 'alternating signs it is a formula to get wrong; derived by auditing the three kinds '
          + 'it is a thing you can rebuild.',
        position: 3,
        workedExample: {
          problem:
            'Of the whole numbers from 1 to 60, how many are divisible by 2, by 3 or by 5 — at '
            + 'least one of the three? Build the answer by adding the three counts, repairing it, '
            + 'and auditing one number of each kind through the arithmetic. Then check the total '
            + 'a second way by counting what is left out.',
          subgoals: [
            {
              label: 'Count each condition on its own, and notice the sum is already impossible',
              detail:
                'Among 1 to 60 there are 60 ÷ 2 = 30 multiples of 2, 60 ÷ 3 = 20 multiples of 3, '
                + 'and 60 ÷ 5 = 12 multiples of 5 — each division exact because 60 is a multiple '
                + 'of all three. Adding: 30 + 20 + 12 = 62. There are only 60 numbers in the '
                + 'range, so 62 is not merely suspect, it is impossible, and the sum rule has '
                + 'been used where its hypothesis fails: 6 is divisible by 2 and by 3, so it '
                + 'belongs to two of the three cases.',
              socratic:
                'Count the multiples of 2, of 3 and of 5 up to 60 and add the three counts. '
                + 'Compare your total with how many numbers there are altogether. What does that '
                + 'comparison prove on its own, before you know anything about the right answer?',
            },
            {
              label: 'Subtract the pairwise overlaps, each of which is a divisibility too',
              detail:
                'A number divisible by both 2 and 3 is divisible by 6 — by the lcm, not the '
                + 'product in general, though here 2 and 3 are coprime so they agree. So the '
                + 'overlaps are the multiples of 6, of 10 and of 15: 60 ÷ 6 = 10, 60 ÷ 10 = 6, '
                + '60 ÷ 15 = 4, totalling 20. That gives 62 − 20 = 42. This is the two-set repair '
                + 'applied three times, and the question the next subgoal asks is whether '
                + 'applying it three times was the right thing to do.',
              socratic:
                'A number divisible by both 2 and 3 — what single condition is that? Once you '
                + 'have written all three pairwise conditions the same way and counted each up '
                + 'to 60, what comes off your 62?',
            },
            {
              label: 'Audit a number in all three sets, and find it has been counted out entirely',
              detail:
                'Follow 30. It is divisible by 2, 3 and 5, so the three singles counted it three '
                + 'times. It is also divisible by 6, by 10 AND by 15, so all three pairwise '
                + 'subtractions removed it: three times counted, three times removed, net ZERO. '
                + 'And 30 is certainly in the union — it is divisible by 2. So 42 is wrong, and '
                + 'wrong in a specific and findable way rather than approximately: every number '
                + 'divisible by all three has been counted zero times.',
              socratic:
                'Track the number 30 through what you have done. How many of the three single '
                + 'counts included it, how many of the three subtractions removed it, and so how '
                + 'many times is it counted in your 42? Is it in the union?',
            },
            {
              label: 'Add the triple overlap back exactly once, and say why once is right',
              detail:
                'The numbers divisible by 2, 3 and 5 are the multiples of 30: 60 ÷ 30 = 2 of '
                + 'them, namely 30 and 60. Adding them back gives 42 + 2 = 44. Once is right '
                + 'because each such number is currently counted 0 times and needs to be counted '
                + '1 time, so each needs exactly one more — and the count of such numbers is '
                + 'exactly the size of the triple overlap. The sign alternates not as a pattern '
                + 'to remember but because each round of repair is applied to what the previous '
                + 'round left.',
              socratic:
                'The numbers divisible by all three are counted 0 times and should be counted '
                + 'once. How many such numbers are there up to 60, and so what exactly do you add '
                + 'to 42?',
            },
            {
              label: 'Audit the other two kinds, which is what makes the answer an argument',
              detail:
                'Two kinds are left and both must come out at 1. Take 4: divisible by 2 only, so '
                + 'counted once by the singles, removed by none of the pairwise terms — it is not '
                + 'a multiple of 6, 10 or 15 — and not in the triple. Net 1. Take 6: divisible by '
                + '2 and 3 and not 5, so counted twice by the singles, removed once as a multiple '
                + 'of 6 and not by the other two, and not in the triple. Net 2 − 1 = 1. With the '
                + 'all-three case at 3 − 3 + 1 = 1, every element of the union is counted exactly '
                + 'once, so 44 is proved rather than computed. Notice that this audit never used '
                + 'the number 60: the three kinds are the only kinds there are, so the argument '
                + 'holds for any three sets.',
              socratic:
                'Work out the net count for 4, which is in one set, and for 6, which is in two. '
                + 'With 30 already done, how many kinds of element in the union are left to '
                + 'check — and once all of them come out at 1, what have you established?',
            },
            {
              label: 'Check the total by counting what was left out instead',
              detail:
                'If 44 of the 60 are divisible by at least one of 2, 3, 5, then 60 − 44 = 16 are '
                + 'divisible by none. Count those directly to check: in any block of 30 '
                + 'consecutive numbers the ones sharing no factor with 30 are 1, 7, 11, 13, 17, '
                + '19, 23, 29 — eight of them — and 60 is two such blocks, so 16. The two routes '
                + 'agree. This is a genuine second computation rather than the first one '
                + 'rearranged, which is what makes it worth doing: it never adds or subtracts an '
                + 'overlap, so an error in the alternating expression could not have survived '
                + 'into it.',
              socratic:
                'Your answer says 44 numbers are divisible by at least one of 2, 3, 5. How many '
                + 'are divisible by none? Now count those directly by listing which of the first '
                + '30 qualify — and why is that a real check rather than the same sum written '
                + 'differently?',
            },
          ],
          answer:
            'Singles: 30 multiples of 2, 20 of 3, 12 of 5, adding to 62 — impossible among 60 '
            + 'numbers, so the cases overlap. Pairs: 10 multiples of 6, 6 of 10, 4 of 15, so '
            + '62 − 20 = 42. But 30 is divisible by all three, counted 3 times by the singles and '
            + 'removed 3 times by the pairs, so it is counted 0 times and 42 is wrong. The '
            + 'multiples of 30 up to 60 are 30 and 60, so add 2: the answer is '
            + '30 + 20 + 12 − 10 − 6 − 4 + 2 = 44. The audit completes it — 4 is in one set and '
            + 'nets 1, 6 is in two and nets 2 − 1 = 1, 30 is in three and nets 3 − 3 + 1 = 1 — so '
            + 'every element of the union is counted exactly once. Checking the other way, '
            + '60 − 44 = 16 should be divisible by none, and the numbers coprime to 30 in each '
            + 'block of 30 are 1, 7, 11, 13, 17, 19, 23, 29, which is 8 per block and 16 across '
            + 'two blocks. The two routes agree.',
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
 * concept, so there is no internal pair to join — and BOTH of that concept's
 * prerequisites are authored concepts of other subjects, `sets` in
 * `sets-and-membership` and `binomial-theorem` in `rational-expressions`. Being
 * authored elsewhere fails the containment test exactly as being an unwritten map
 * node does, so both stranded edges live in `DISCRETE_MATHEMATICS.links` in
 * atlas-structures.ts, which is the area that owned the departing node.
 *
 * THAT IS TWO ENTRIES FROM ONE PROMOTION, where the four before it added one
 * each. The rule ontology-proof.ts stated — an edge is owned by the node that
 * DECLARES it, so walking up a chain strands exactly one edge per step — is not
 * contradicted; its PRECONDITION has gone. "Walking up a chain" described the
 * four promotions out of this area because each departing node had one `needs`
 * into the subject below it. This node has two `needs` into two different
 * subjects, neither of which would take it, so there is no chain to walk and the
 * per-step count of one has nothing to be a count of. A future run should read
 * "one edge per step" as a fact about chains rather than about promotions.
 *
 * WHAT THIS SUBJECT WOULD GAIN A REAL EDGE FROM is the one node this promotion
 * makes ready. `combinatorial-identities` needs this concept and
 * `mathematical-induction`, which is authored in `functions-and-inverses` — so it
 * is ready now and was not before. Authored HERE it would make
 * `counting-principles → combinatorial-identities` an ordinary `needs` in the
 * array below, the first edge this file could hold, and would strand only the
 * induction edge. That is the cheapest shape available anywhere on the map after
 * this promotion, and it is recorded as a measurement rather than as a
 * recommendation: the next run should recompute the field, because this sentence
 * is exactly the kind the forty-second and forty-third promotions had to correct
 * in their predecessors.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between "there
 * are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const COUNTING_AND_ARRANGEMENTS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
