/**
 * An eleventh subject ontology: what can be said about a list of numbers you
 * already have, and nothing about one you do not.
 *
 * ── WHY THIS CONCEPT, AND WHY IT IS NOT A ROUTE PROMOTION ─────────────────
 *
 * Every one of the ten shipped journeys has read zero unwritten steps on route
 * since the fourteenth promotion, so route demand ranked nothing here and the
 * selection was made the way ontology-functions.ts's header describes:
 * rulability first, then whether the stranded edges can go in one ontology,
 * then dependents as a tie-break. Eleven map nodes were ready — every `needs`
 * already teachable — when this was written, and the field narrowed like this:
 *
 *  - SIX OF THE ELEVEN WERE OUT OF BOUNDS ON THE FLOOR, not on the content.
 *    `algebra-foundations` is at six nodes against a stub floor of five with
 *    FOUR ready candidates, and `linear-algebra` at six with two. Spending one
 *    of those strands the rest, and the answer atlas-foundations.ts argues for
 *    is to merge the remnant into a neighbour — a decision about the
 *    learner-facing map, which is a person's and not an authoring pass's.
 *  - THREE MORE ARE UNDER REFUSALS THAT STILL BIND. `graphs-of-functions` is a
 *    judgement about a drawing, which ontology-functions.ts argues at length;
 *    `constructions` is a procedure with a straightedge; `non-euclidean-geometry`
 *    is a choice of axioms. None of the three has an answer that is a number.
 *  - OF THE TWO LEFT, `supremum-and-completeness` and this one, this one is the
 *    more rulable by a wide margin and the other is an armature anchor. A mean,
 *    a median, a variance and an interquartile range are each one exact
 *    rational number computed from a list, so the whole subject grades locally
 *    with no worker — the sixth in the build to manage that. A least upper
 *    bound is a claim about a set, and the sets worth asking about are the ones
 *    whose bound is not attained.
 *
 * `statistics` is sixteen nodes against the floor, so the floor decided nothing
 * here. And `descriptive-statistics` is the FIRST authored concept anywhere in
 * the uncertainty half of the atlas: `probability` and `statistics` are
 * thirty-two nodes between them with nothing written, which is why this subject
 * exists at all rather than the concept joining one that already does.
 *
 * ── WHY AN ELEVENTH SUBJECT RATHER THAN A CONCEPT OF AN EXISTING ONE ──────
 *
 * The test ontology-solids.ts applied, run against every subject that now
 * exists: does each one's `covers` draw a boundary this concept falls outside?
 *
 *  - `arithmetic-foundations` says "nothing symbolic", and it is the nearest
 *    miss by a distance — a mean of five numbers really is arithmetic, and
 *    `percent` is one of its concepts and a prerequisite of this one. What rules
 *    it out is that nothing in that subject is a function of a LIST. Every one
 *    of its fifteen concepts is a claim about a number, or about two: a
 *    remainder, a reduced fraction, a percentage of a base. A median is not a
 *    property of any of the numbers it is computed from and cannot be stated
 *    without the whole list in hand, which is the move this subject is about.
 *  - `functions-and-inverses` owns `sigma-notation`, the other prerequisite, and
 *    is the second-nearest miss. A sum over a list is exactly what Σ is for. But
 *    that subject is about a RULE taking an input to an output, and the three
 *    points below are about a list of numbers with no rule behind it — which is
 *    the distinction that makes a sample different from a sequence, and the
 *    reason the data here is written out in full rather than generated.
 *  - `expressions-and-equations` is about what a letter standing for a number
 *    means. The letters below stand for members of a list.
 *  - `plane-geometry`, `solid-measure` and `triangle-trigonometry` are about
 *    figures and their measures; nothing here is a length or an angle.
 *  - `rational-expressions` and `exponents-and-logarithms` start at polynomial
 *    arithmetic and at powers, and both are above this concept rather than
 *    beside it.
 *  - `vectors-and-independence` is the one worth refusing out loud, because a
 *    list of eight numbers and a vector in eight dimensions are the same object
 *    written down. They are not the same claim. A vector's coordinates are
 *    ORDERED and its subject is about when a set of them is redundant; a sample
 *    is a multiset, every summary below is unchanged by shuffling it, and the
 *    one place order appears — the median's position — is order the computation
 *    IMPOSES rather than order the data carried. A subject that held both would
 *    have to stop making either claim.
 *  - `matrices-and-determinants` is above this concept, not beside it.
 *
 * So the layer gets its own subject and joins the rest through the area's
 * `links`, which is the pattern ontology-arithmetic.ts established and the
 * ninth and tenth subjects repeated. One concept is not a reason to hesitate:
 * `expressions-and-equations` shipped with exactly one for weeks and
 * `solid-measure` still has one, and a subject is a boundary rather than a
 * volume.
 *
 * ROOM TO GROW IS REAL HERE, which is the one thing this subject has that
 * `solid-measure` had to admit it did not. `sampling-and-bias` sits directly
 * above this concept and is reachable the moment it ships — but it needs
 * `sample-spaces` as well, which is a `probability` node with nothing written,
 * so it is one promotion away and not zero. What is NOT a growth path is
 * anything inferential: an estimator, an interval and a test are all claims
 * about a population from a sample, they all rest on `probability`, and the
 * whole of that area is unwritten. So this subject grows when somebody writes
 * probability, and the honest statement is that its second concept is behind a
 * different area rather than behind effort.
 *
 * ── THE SUBJECT IS NAMED FOR THE SUMMARY, AND NOT `statistics` ────────────
 *
 * `data-summaries`, which is a refusal twice over and for the two reasons the
 * ninth and tenth subjects each found the hard way.
 *
 * Not `statistics`, which is the id of the AREA this concept was promoted out
 * of. `areaOf` answers with a subject id for an authored concept and an area id
 * for a map node, so a collision would put two different things behind one
 * string and `getOntology(id)` and `conceptById(M, id)` would answer about
 * different objects. The ninth subject recorded that hazard and added the
 * assertion.
 *
 * Not `descriptive-statistics` either, which is the id of the one concept this
 * subject contains — the same hazard by a worse route, because nothing looks
 * wrong: the concept would report itself as its own area. The tenth subject
 * found that one and added the assertion for it.
 *
 * And `summaries` rather than `statistics` because a summary is what is
 * written. The area is named for a subject that argues from data back to a
 * mechanism, and not one step of that argument is here — naming this ontology
 * for the whole of statistics would make its `covers` a promise about fifteen
 * nodes nobody has touched, which is the mistake the ninth subject refused when
 * it declined to call itself `trigonometry`.
 *
 * ── THE DIVISOR IS n, AND SAYING SO IS NOT A DETAIL ───────────────────────
 *
 * The variance below is the mean of the squared deviations — divided by n, the
 * count of the list. That is the variance OF THE LIST, and it is a different
 * number from the n − 1 version a calculator's `s` button returns: for the
 * eight-value sample used throughout, 32/8 = 4 against 32/7 ≈ 4.571.
 *
 * It is stated in the `covers`, in the second knowledge point, and in that
 * point's worked example, because a learner who checks the answer against a
 * spreadsheet and finds 4.571 has been handed a contradiction rather than an
 * error. And the reason for the choice IS this subject's boundary: n − 1
 * corrects a bias in estimating the variance of a population you have not seen,
 * which is an inferential claim and belongs with `point-estimation`, still a map
 * node. Nothing below estimates anything. The list is the whole of what is
 * being described, so dividing by how many there are is not an approximation to
 * anything — it is the definition of a mean, applied to the squares.
 *
 * ── THE QUARTILE CONVENTION IS STATED, FOR THE SAME REASON ────────────────
 *
 * The third point splits an eight-value list into two halves of four and takes
 * each half's median. That gives Q₁ = 4 and Q₃ = 6 on the sample below, so an
 * interquartile range of 2. Linear interpolation between order statistics —
 * what `QUARTILE.INC` does — gives Q₃ = 5.5 and an interquartile range of 1.5
 * on the same eight numbers.
 *
 * Both are named in the point, because a convention nobody states is how a
 * learner concludes their arithmetic is broken. What is worth noticing is that
 * the CLAIM the point makes survives the disagreement and the number does not:
 * under either convention, replacing the largest value leaves both quartiles
 * exactly where they were. So the robustness is a property of which order
 * statistics a quartile reads, and the particular value is a property of the
 * convention — which is the right shape for a claim to have, and the reason
 * the task asserts the four inputs rather than the eight.
 *
 * ── WHAT IS PROVED HERE, AND WHAT IS MERELY COMPUTED ──────────────────────
 *
 * One fact below is proved and the rest are definitions applied carefully, and
 * the difference is worth marking because a subject that is mostly definitions
 * can look like it has no content.
 *
 *   PROVED: the deviations from the mean sum to exactly zero, for every list,
 *   with no assumption about its shape. Σ(xᵢ − x̄) = Σxᵢ − n·x̄, and n·x̄ IS Σxᵢ
 *   by the definition of the mean, so the difference is zero. That is one line
 *   and it is the whole reason the squares appear: the obvious measure of spread
 *   — average how far each value is from the centre, keeping the sign — is
 *   identically zero and therefore measures nothing. The worked example checks
 *   it on the most lopsided list in the file, where the cancellation is 150
 *   against 150 rather than a symmetry.
 *
 *   NOT PROVED, AND NOT PRETENDED TO BE: that squaring is the right repair. The
 *   mean ABSOLUTE deviation is not zero either and is a perfectly good measure
 *   of spread. What squaring buys is that the variance of a sum of independent
 *   quantities adds, which is `variance-and-covariance`'s claim in `probability`
 *   and is unwritten — so the second point says the squares are a choice with a
 *   reason elsewhere, rather than implying the absolute values would not work.
 *
 * ── NO FIGURE, WHICH IS A DECISION THE NODE'S OWN TERMS ARGUE AGAINST ─────
 *
 * The map node arrived with `histogram` and `boxplot` in its search terms, and
 * both are absent from the material. `visualRef` is omitted on all three
 * points, for the reason types.ts gives: no figure exists, and a placeholder
 * would be worse than the absence.
 *
 * But the deeper reason is the one this build has reached five times from other
 * directions. A histogram's shape is read off a drawing, and "is this
 * right-skewed" is a judgement about a picture, which is exactly what
 * ontology-functions.ts refuses for `graphs-of-functions`. The third point
 * therefore teaches the figure-free part: the SIGN of one subtraction says which
 * side the tail is on, and that is a number rather than an impression. What the
 * pictures would add is where the mass is rather than where the tail is, and
 * that is genuinely not here.
 *
 * ── EVERY TASK IS `evaluate`, AND EVERY OBJECTIVE NAMES ONLY THAT ─────────
 *
 * Eight `evaluate` tasks, settled by exact rational arithmetic with no worker,
 * and no `transform_to_form` anywhere — which is a fact about the subject rather
 * than a gap. A `NamedForm` is a claim about the SHAPE of an expression, and
 * nothing here asks for a shape: every question in the file is "which number
 * does this list give", and the one number that could have been a surd (a
 * standard deviation whose variance is not a perfect square) was avoided by
 * choosing a sample where it is exactly 2, because the point being made is that
 * the root returns the UNITS and a surd would make that step about radicals.
 *
 * Every objective names `evaluate` and nothing else. `justify` is named by
 * twenty-eight of `plane-geometry`'s objectives and no `justify` task exists
 * anywhere in this build, so naming it would promise an observation that cannot
 * be made — the rule ontology-solids.ts decided and the ninth subject first
 * asserted. The best unrulable question in this file is "why would anybody
 * square the deviations rather than take their absolute values", and it is the
 * fourth subgoal of the second point, where the tutor asks it and nothing
 * pretends to rule it.
 *
 * ── THE PATTERN IS CARRIED VERBATIM, AND LEAVES A RECORDED SHORTFALL ──────
 *
 * `/\b(descriptive statistics|median|quartile|histogram)\b/i`, off the map node
 * unchanged, for the reason every promotion since the fourth has kept: widening
 * a pattern in the same edit that adds material makes the recognition figure in
 * tests/atlas.mjs and the written-concept count move together, and there is no
 * way afterwards to say which half did it.
 *
 * The shortfall that leaves is named rather than fixed, and tests/atlas.mjs
 * asked for it to be named HERE. Its over-broad group records that the article
 * "Arithmetic mean" is claimed by nobody in the build and observes that it
 * belongs to this concept. It still does, and this pattern still does not take
 * it — nor "Mean", nor "Standard deviation", nor "Variance", nor "Interquartile
 * range", all of which are real titles and all of which are this concept's.
 * Adding them is a precise widening rather than a relaxation (the failure mode
 * is `/\bmean\b/i`, which takes the mean value theorem and most sentences about
 * meaning), and it is a separate change from this one.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'data-summaries',
  name: 'Summarising data',
  covers:
    'What can be computed from a list of numbers that is given IN FULL, and nothing that is a '
    + 'claim about numbers you do not have. Two centres, and the fact that they answer different '
    + 'questions rather than competing: the MEAN is the total shared out equally, so it is the '
    + 'number that could replace every value and leave the total alone, and the MEDIAN is the '
    + 'value at position (n + 1)/2 of the ordered list, so it is the number that leaves as many '
    + 'values below it as above. On a symmetric list they agree and the choice does not arise; on '
    + 'a list with a tail they come apart, and neither is wrong — "how much per person" wants the '
    + 'mean and "what did a typical one give" wants the median. An even-length list is where the '
    + 'median stops being one of the values at all, because (n + 1)/2 lands between two '
    + 'positions. Then spread, built on one proved fact: the deviations from the mean sum to '
    + 'EXACTLY zero for every list whatever its shape, since the mean is defined as the number '
    + 'that makes them, so averaging the signed distances from the centre measures nothing at all '
    + 'and the squares are what repair it. The VARIANCE is the mean of the squared deviations and '
    + 'the STANDARD DEVIATION is its square root, which is the step that puts the answer back in '
    + 'the units of the data; a value occurring three times contributes three times, which is the '
    + 'commonest way the arithmetic goes wrong. The divisor is n, the count of the list, NOT '
    + 'n − 1: this is the variance of the list itself, where n − 1 corrects a bias in estimating '
    + 'the variance of a population nobody has seen, and estimating is not here. Then shape, in '
    + 'the one form that needs no picture: the GAP between the mean and the median has a sign, '
    + 'and the sign says which side the long tail is on — positive means the tail runs to the '
    + 'high values and has pulled the mean up past the middle, negative means it runs to the low '
    + 'ones. A non-zero gap proves a tail; a zero gap does not prove symmetry. And the QUARTILES, '
    + 'which give a spread the tail cannot move: split the ordered list into two halves and take '
    + 'each half\'s median, and the interquartile range between them reads only the middle of the '
    + 'list, so replacing the largest value changes the range by exactly as much as that value '
    + 'moved and changes the interquartile range by nothing. Software disagrees about how to '
    + 'interpolate a quartile and the figure therefore depends on the convention, which is stated '
    + 'rather than hidden; the robustness does not depend on it. What is NOT here is every '
    + 'inferential claim, and that is the subject\'s boundary rather than a backlog: where the '
    + 'data came from is `sampling-and-bias`, what a statistic does over repeated samples is '
    + '`sampling-distributions`, and estimators, intervals and tests are all above those. All of '
    + 'them rest on `probability`, which is sixteen map nodes with nothing written, so none of '
    + 'them is one promotion away. The PICTURES are absent too and are named rather than quietly '
    + 'dropped: a histogram and a box plot are where the shape of a list is normally read, and '
    + 'reading a shape off a drawing is the judgement this build has declined to grade five '
    + 'times. What the pictures would add is where the mass of the list sits, where the sign of a '
    + 'subtraction only says where its tail does.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'descriptive-statistics',
    name: 'Describing data',
    subjectId: subject.id,
    scope: {
      id: 'descriptive-statistics',
      label: 'Describing data',
      hint: 'mean median mode quartile standard deviation histogram boxplot skew',
      /*
       * Carried verbatim from the map node, as every promotion since the fourth
       * has carried its own, and for their reason: widening a pattern in the
       * same change that adds material moves the recognition figure in
       * tests/atlas.mjs and the written-concept count at once, and there is no
       * way afterwards to say which edit moved which.
       *
       * Its shape is worth reading, because the four alternatives are doing
       * four different jobs. "Descriptive statistics" is where an encyclopaedia
       * files the concept itself. "Median", "Quartile" and "Histogram" are
       * titles of three of the things taught below, and they are the three
       * whose names belong to nothing else in mathematics — which is precisely
       * why they, and not the other candidates, are the ones a bare word may
       * safely claim.
       *
       * What it does NOT take is named in this file's header and recorded
       * rather than repaired: "Mean", "Arithmetic mean", "Variance",
       * "Standard deviation" and "Interquartile range" are all real articles,
       * all of them this concept's, and none of them matches. tests/atlas.mjs
       * already records the first of those as claimed by nobody and says it
       * belongs here. So this pattern selects precisely and recalls badly, and
       * `fidelity` is still `checked`: what `checked` claims is that the
       * pattern really decides membership for what it matches, not that it
       * matches everything the concept covers.
       */
      match: /\b(descriptive statistics|median|quartile|histogram)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'produce-both-centres-and-say-which-question-each-answers',
        statement:
          'Given a list of numbers in full, produce its mean as the total shared out by the '
          + 'count, and produce the position the median sits at as (n + 1)/2 — including for an '
          + 'even-length list, where that position falls between two values and the median is '
          + 'therefore not one of the numbers in the list. Say which of the two a stated question '
          + 'is asking for, on the grounds of whether it is about the total or about a typical '
          + 'member.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'measure-spread-about-the-mean-and-show-the-signed-distances-cannot',
        statement:
          'Given a list and its mean, produce the total of the signed deviations and recognise '
          + 'that it is zero for reasons that have nothing to do with this list — then produce '
          + 'the variance as the mean of the SQUARED deviations, counting a repeated value once '
          + 'per occurrence and dividing by n, and the standard deviation as its root.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'read-the-tail-off-a-sign-and-produce-a-spread-it-cannot-move',
        statement:
          'Given an ordered list, produce the difference between its mean and its median and '
          + 'read the SIGN of that one number as which side the long tail is on. Then produce an '
          + 'interquartile range from the two halves\' medians, and say why replacing the largest '
          + 'value changes the range and leaves this number alone.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-mean-keeps-the-total-and-the-median-keeps-the-position',
        conceptId: 'descriptive-statistics',
        statement:
          'A list of numbers has two centres and they answer two different questions, so neither '
          + 'is the right one in general. The MEAN is the total divided by how many there are: it '
          + 'is the number that could replace every value in the list and leave the TOTAL '
          + 'unchanged, which is why "how much per person" always wants it. The MEDIAN is the '
          + 'value at position (n + 1)/2 of the ORDERED list: it is the number that leaves as '
          + 'many values below it as above, which is why "what did a typical one give" always '
          + 'wants it. On a symmetric list the two agree and the choice never comes up. On a list '
          + 'with one very large value they come apart as far as you like, and the mean is the '
          + 'one that moves — because the total moves and the count does not. The median is a '
          + 'POSITION rather than a quantity, and the clearest sign of that is an even-length '
          + 'list: (n + 1)/2 is then a half, there is no value sitting at that position, and the '
          + 'median is taken as the mean of the two it falls between — so it need not be one of '
          + 'the numbers in the list at all.',
        position: 1,
        /*
         * No `automaticityTarget`. Adding five numbers and dividing is the whole
         * arithmetic and would time beautifully, which is exactly the trap: this
         * point is about WHICH of the two centres a question wants, and a speed
         * reward trains computing whichever is quicker. That is the error the
         * point exists to stop, which is the case types.ts names when it says
         * the field should usually be absent.
         */
        workedExample: {
          problem:
            'Five members of a club gave, in pounds: 200, 15, 5, 20, 10. Find the mean donation '
            + 'and the median donation, and say which of the two answers "how much did the club '
            + 'raise per member" and which answers "what did a typical member give". Then find '
            + 'the median of the eight-value list 5, 4, 4, 9, 2, 7, 4, 5.',
          subgoals: [
            {
              label: 'Total the list and share it out by the count — the mean',
              detail:
                '200 + 15 + 5 + 20 + 10 = 250, and 250 ÷ 5 = 50. So the mean is £50. Read it '
                + 'backwards and it is the claim worth having: if all five had given £50 the club '
                + 'would still hold £250, because the mean is defined as the number that '
                + 'preserves the total. Note that no addition needs the list in order — the mean '
                + 'is a function of the multiset and shuffling the five changes nothing.',
              socratic:
                'You have five donations and one total. If every member had given the same '
                + 'amount and the club had ended up with exactly the same money, what would that '
                + 'amount have been?',
            },
            {
              label: 'Order the list and count to the middle — the median',
              detail:
                'Ordering is not optional here and it is the one step the mean did not need: '
                + '5, 10, 15, 20, 200. There are five values, so the middle position is '
                + '(5 + 1)/2 = 3, and the third of those is 15. So the median is £15. Four of '
                + 'the five donations are below the mean of £50 and the fifth is four times it, '
                + 'which is the whole shape of this list in one sentence.',
              socratic:
                'The mean needed no particular arrangement of the five numbers. Before you can '
                + 'say which one is in the middle, what has to be true of the list — and is it '
                + 'true of the list as it was handed to you?',
            },
            {
              label: 'Check what each of the two preserves, which is what makes them different claims',
              detail:
                'Replace all five donations by the mean and the club still has 5 × 50 = £250, '
                + 'the real total. Replace all five by the median and it has 5 × 15 = £75, which '
                + 'is £175 short. So the median does NOT preserve the total and was never trying '
                + 'to: what it preserves is the count on each side — two donations below £15 and '
                + 'two above, which is still true however far the £200 moves.',
              socratic:
                'Swap every donation for the mean and the club\'s money is unchanged. Swap every '
                + 'donation for the median and it is not. Which of the two numbers was built to '
                + 'survive that swap, and what is the other one keeping instead?',
            },
            {
              label: 'Answer the two stated questions from what each centre preserves',
              detail:
                '"How much did the club raise per member" is a question about the total, so it '
                + 'is the mean: £50, and that figure is correct and useful — it is £250 of real '
                + 'money divided by five real members. "What did a typical member give" is a '
                + 'question about a member, so it is the median: £15, and four of the five gave '
                + 'within £10 of it. Neither number is a distortion of the list. Reporting the '
                + 'mean as what a typical member gave would be, and that is the error — not the '
                + 'mean itself.',
              socratic:
                'Both £50 and £15 are honest answers about this list. What would you have to '
                + 'have asked for £50 to be the answer, and what would you have to have asked '
                + 'for £15 to be?',
            },
            {
              label: 'Take an even-length list, where the position lands between two values',
              detail:
                'Ordered, 5, 4, 4, 9, 2, 7, 4, 5 is 2, 4, 4, 4, 5, 5, 7, 9. There are eight '
                + 'values, so the middle position is (8 + 1)/2 = 4.5 — and no value sits at '
                + 'position 4.5. The median is taken as the mean of the two it falls between, '
                + 'the 4th and the 5th: (4 + 5)/2 = 4.5. That the position and the median are '
                + 'both 4.5 here is a coincidence of these particular numbers and is worth not '
                + 'learning: in 2, 4, 4, 4, 6, 6, 7, 9 the position is still 4.5 and the median '
                + 'is (4 + 6)/2 = 5.',
              socratic:
                'Eight values, so the middle position works out at four and a half. There is no '
                + 'four-and-a-halfth number in the list — so what do the two numbers it sits '
                + 'between have to do with each other before one of them can be the answer?',
            },
          ],
          answer:
            'The mean donation is £50 and the median donation is £15. The mean is the total '
            + '250 shared out by the count 5, and it is the number that preserves the total: five '
            + 'donations of £50 still make £250. The median is the value at position '
            + '(5 + 1)/2 = 3 of the ordered list 5, 10, 15, 20, 200, and it preserves the count '
            + 'on each side rather than the total — five donations of £15 make only £75. So "how '
            + 'much per member" is the mean, £50, and "what did a typical member give" is the '
            + 'median, £15, and both are honest answers to their own question. The eight-value '
            + 'list has no middle value: position (8 + 1)/2 = 4.5 falls between the 4th and 5th '
            + 'of 2, 4, 4, 4, 5, 5, 7, 9, so its median is (4 + 5)/2 = 4.5 — a number that is '
            + 'not in the list.',
        },
      },
      {
        id: 'the-signed-deviations-cancel-which-is-why-the-squares-are-there',
        conceptId: 'descriptive-statistics',
        statement:
          'Spread is how far the values sit from the centre, and the obvious way to measure it '
          + 'does not work. Average the signed distances from the mean and the answer is EXACTLY '
          + 'zero — for every list, whatever its shape, however lopsided. That is not a property '
          + 'of well-behaved data: Σ(xᵢ − x̄) = Σxᵢ − n·x̄, and n·x̄ IS Σxᵢ by the definition of '
          + 'the mean, so the difference is zero by construction. A measure that returns zero for '
          + 'every input measures nothing. The repair is to remove the signs before averaging, and '
          + 'the one this subject uses is squaring: the VARIANCE is the mean of the squared '
          + 'deviations, and the STANDARD DEVIATION is its square root — which is the step that '
          + 'matters for reading the answer, because squaring a length gives an area and the root '
          + 'is what puts the number back in the units of the data. Two things go wrong in the '
          + 'arithmetic and both are silent. A value occurring three times contributes three '
          + 'times, so summarising the DISTINCT values gives a different and wrong answer. And the '
          + 'divisor is n, the count of the list — this is the variance of the list itself, where '
          + 'the n − 1 a calculator\'s `s` uses corrects a bias in estimating a population nobody '
          + 'has seen, which is a different question and is not this one.',
        position: 2,
        /*
         * No `automaticityTarget`. The arithmetic is eight subtractions, eight
         * squares and a division, which would time well — and the two errors
         * this point exists to stop are both produced by working fast: dropping
         * the multiplicity of a repeated value, and dividing by the count of
         * DISTINCT values. A speed reward trains the shortcut that causes both.
         */
        workedExample: {
          problem:
            'Find the variance and the standard deviation of 2, 4, 4, 4, 5, 5, 7, 9. Before '
            + 'that, check on the lopsided list 5, 10, 15, 20, 200 — whose mean is 50 — what the '
            + 'signed deviations from the mean add up to.',
          subgoals: [
            {
              label: 'Try the signed distances on the worst-behaved list available',
              detail:
                'The donations 5, 10, 15, 20, 200 have mean 50, so the deviations are −45, −40, '
                + '−35, −30 and +150. The four negatives total −150, the single positive is '
                + '+150, and the sum is 0. This is the list in the file least likely to cancel by '
                + 'accident — nothing about it is symmetric, and one value does all the '
                + 'balancing — so a total of zero here is not luck.',
              socratic:
                'These five deviations are −45, −40, −35, −30 and +150. Four of them pull one '
                + 'way and one pulls the other, and the list is nothing like symmetric. What do '
                + 'they come to, and does the answer look like an accident of these numbers?',
            },
            {
              label: 'See why it had to be zero, which is what rules the method out',
              detail:
                'Σ(xᵢ − x̄) = Σxᵢ − n·x̄. The mean is Σxᵢ / n, so n·x̄ = Σxᵢ, and the difference '
                + 'is zero. No assumption about the list was used. So the signed deviations sum '
                + 'to zero for every list there is, the average of them is zero too, and a '
                + 'measure of spread that is zero for every input is not a measure of spread. '
                + 'This is the one fact in the point that is proved rather than computed, and it '
                + 'is why everything after it squares first.',
              socratic:
                'You have the deviations summing to zero on one list. Write the sum as Σxᵢ '
                + 'minus n lots of the mean — what is n lots of the mean, in terms of the '
                + 'numbers you started with?',
            },
            {
              label: 'Square the deviations, keeping every repeat',
              detail:
                'The eight values 2, 4, 4, 4, 5, 5, 7, 9 total 40, so the mean is 40 ÷ 8 = 5. '
                + 'The deviations are −3, −1, −1, −1, 0, 0, 2, 4 and their squares are 9, 1, 1, '
                + '1, 0, 0, 4, 16, which total 32. The 4 appears three times and contributes 1 '
                + 'three times; the 5 appears twice and contributes 0 twice. Summarising the five '
                + 'DISTINCT values instead — 2, 4, 5, 7, 9 against the same mean — gives '
                + '9 + 1 + 0 + 4 + 16 = 30 over 5, which is 6 rather than 4. Both are tidy '
                + 'numbers and only one is the variance of this list.',
              socratic:
                'There are eight values here but only five different ones. How many terms should '
                + 'your total of squares have — and what is the list you would be describing if '
                + 'it had five?',
            },
            {
              label: 'Divide by n, and say which n',
              detail:
                '32 ÷ 8 = 4, so the variance is 4. The divisor is the count of the list, because '
                + 'the variance is a MEAN — of the squares — and a mean divides by how many there '
                + 'are. A calculator\'s `s` button divides by 7 and returns 32/7 ≈ 4.571, and '
                + 'that is not a different arithmetic but a different question: n − 1 corrects a '
                + 'bias in estimating the variance of a population this list was drawn from, and '
                + 'nothing here is estimating anything. The list is the whole of what is being '
                + 'described.',
              socratic:
                'You have eight squared deviations totalling 32 and you want their mean. What do '
                + 'you divide by — and if a calculator hands you 4.571 instead of 4, which of '
                + 'you has answered a different question?',
            },
            {
              label: 'Take the root, which is the step that restores the units',
              detail:
                '√4 = 2, so the standard deviation is 2. This is the number worth quoting: the '
                + 'values are in some unit, the squared deviations are in that unit squared, and '
                + 'the variance 4 is therefore not comparable with any value in the list. The '
                + 'standard deviation 2 is, and it reads correctly against the data — most of the '
                + 'eight values sit within 2 of the mean of 5. Whether squaring was the right way '
                + 'to remove the signs in the first place is a fair question and is not settled '
                + 'here: averaging the absolute deviations is not zero either and is a perfectly '
                + 'good measure. What the squares buy shows up when independent quantities are '
                + 'added together, and that is `variance-and-covariance`, which nobody has '
                + 'written.',
              socratic:
                'The variance of this list is 4 and no value in the list is anywhere near 4 of '
                + 'the mean in any meaningful sense. What happened to the units when you squared '
                + 'the deviations, and what undoes it?',
            },
          ],
          answer:
            'The variance is 4 and the standard deviation is 2. The signed deviations are a dead '
            + 'end first: on 5, 10, 15, 20, 200 with mean 50 they are −45, −40, −35, −30, +150 '
            + 'and sum to 0, and they had to — Σ(xᵢ − x̄) = Σxᵢ − n·x̄ and n·x̄ is Σxᵢ, so the '
            + 'total is zero for every list and measures nothing. Squaring first: 2, 4, 4, 4, 5, '
            + '5, 7, 9 totals 40 so the mean is 5, the deviations are −3, −1, −1, −1, 0, 0, 2, 4, '
            + 'and their squares total 9 + 1 + 1 + 1 + 0 + 0 + 4 + 16 = 32 — eight terms, because '
            + 'the repeated 4 contributes three times. The variance is 32 ÷ 8 = 4, dividing by '
            + 'the count of the list rather than by 7, since this describes the list and does not '
            + 'estimate a population. The standard deviation is √4 = 2, and the root is what puts '
            + 'the figure back in the units of the data.',
        },
      },
      {
        id: 'the-sign-of-the-gap-names-the-tail-and-the-quartiles-ignore-it',
        conceptId: 'descriptive-statistics',
        statement:
          'The shape of a list is normally read off a histogram, and one part of it needs no '
          + 'drawing at all. Subtract the median from the mean: the SIGN of that one number says '
          + 'which side the long tail is on. Positive means the tail runs to the high values and '
          + 'has dragged the mean up past the middle, because the mean responds to how far an '
          + 'extreme value is and the median only to which side of it that value falls. Negative '
          + 'means the tail runs to the low values. A non-zero gap therefore proves a tail; a zero '
          + 'gap does NOT prove symmetry, since two tails can cancel. The same asymmetry gives a '
          + 'spread the tail cannot move. Split the ordered list into two halves, take each '
          + 'half\'s median — those are the QUARTILES — and subtract: the INTERQUARTILE RANGE '
          + 'between them is read off the middle of the list and never off its ends. So replacing '
          + 'the largest value with something enormous changes the RANGE by exactly as much as '
          + 'that value moved, and changes the interquartile range by nothing. Conventions for '
          + 'interpolating a quartile differ and so therefore does the figure; the robustness does '
          + 'not, because every convention reads order statistics from the middle.',
        position: 3,
        /*
         * No `automaticityTarget`. Each of the three computations here is one
         * subtraction, and what the point is about is reading a SIGN and
         * noticing which inputs a formula does not contain — neither of which a
         * stopwatch can observe. Timing the subtraction would reward getting to
         * a number before asking which question it answered.
         */
        workedExample: {
          problem:
            'Two ordered lists. The donations 5, 10, 15, 20, 200 in pounds, and five marks out '
            + 'of 20: 5, 16, 17, 18, 19. For each, subtract the median from the mean and say '
            + 'which side its tail is on. Then take 2, 4, 4, 4, 5, 5, 7, 9, find its range and '
            + 'its interquartile range, replace the 9 by 90, and find both again.',
          subgoals: [
            {
              label: 'Take the gap on the donations and read its sign, not its size',
              detail:
                'The mean is 250 ÷ 5 = 50 and the median is the third value, 15, so the gap is '
                + '50 − 15 = +35. Positive, so the tail is on the HIGH side — and the list says '
                + 'so: 200 sits far above the other four and nothing sits far below them. The '
                + 'mechanism is worth stating. Push the 200 up to 400 and the mean goes to £90 '
                + 'while the median stays at £15, because the mean reads how far the value went '
                + 'and the median reads only that it stayed on the same side.',
              socratic:
                'The mean of these donations is £50 and the median is £15. Before you decide '
                + 'what 35 means — which of the two numbers would move if the largest donation '
                + 'were doubled, and which would not?',
            },
            {
              label: 'Take the same gap on the marks, where it comes out the other way',
              detail:
                'The marks total 5 + 16 + 17 + 18 + 19 = 75, so the mean is 15, and the median '
                + 'is the third value, 17. The gap is 15 − 17 = −2. Negative, so the tail is on '
                + 'the LOW side: one mark of 5 among four in the high teens. Same expression, '
                + 'same five slots, opposite sign — and the sign is the entire reading. Its size '
                + 'is not comparable between the two lists at all, since one is in pounds and '
                + 'the other in marks.',
              socratic:
                'This time the gap comes out negative. One mark is a long way from the others — '
                + 'which direction is it from them, and which of the two centres did it drag '
                + 'with it?',
            },
            {
              label: 'Measure the eight-value list both ways before disturbing it',
              detail:
                'The range is 9 − 2 = 7. For the quartiles, split 2, 4, 4, 4, 5, 5, 7, 9 into '
                + 'two halves of four: the lower half 2, 4, 4, 4 has median (4 + 4)/2 = 4, and '
                + 'the upper half 5, 5, 7, 9 has median (5 + 7)/2 = 6. So Q₁ = 4, Q₃ = 6, and '
                + 'the interquartile range is 6 − 4 = 2. The convention matters and is stated: '
                + 'interpolating between order statistics instead, as a spreadsheet does, gives '
                + 'Q₃ = 5.5 and an interquartile range of 1.5 on these same eight numbers.',
              socratic:
                'You have eight numbers in order. The range used two of them — which two? And '
                + 'if you now cut the list into halves and find each half\'s middle, which of '
                + 'the eight do those two answers depend on?',
            },
            {
              label: 'Replace the largest value and recompute both',
              detail:
                'The list becomes 2, 4, 4, 4, 5, 5, 7, 90. The range is 90 − 2 = 88, up by '
                + 'exactly the 81 the value moved. The lower half is still 2, 4, 4, 4 and the '
                + 'upper half is now 5, 5, 7, 90 — whose median is still (5 + 7)/2 = 6, because '
                + 'the median of four numbers is the mean of the middle TWO and 90 is not one of '
                + 'them. So Q₁ = 4, Q₃ = 6 and the interquartile range is still 2. Under the '
                + 'interpolating convention it is still 1.5. The number differs between the two '
                + 'conventions and the fact that it did not move does not.',
              socratic:
                'The 9 has become 90 and one of your two spreads has changed enormously while '
                + 'the other has not changed at all. Look at which of the eight numbers each one '
                + 'actually used — is there anything surprising left in that?',
            },
            {
              label: 'Say what each of the three numbers is now for',
              detail:
                'The sign of the mean-minus-median gap says there is a tail and which side it is '
                + 'on. The range says how far apart the two most extreme values are, which is a '
                + 'fact about exactly two members of the list and about nothing else in it. The '
                + 'interquartile range says how spread the middle half is, and survives anything '
                + 'done to the ends. None of the three replaces another, and the pair that is '
                + 'genuinely a choice is the range against the interquartile range: if what you '
                + 'want to know is how bad the worst case is, the robust one is the wrong answer.',
              socratic:
                'You now have three numbers describing the same eight values: a signed gap, a '
                + 'range, and an interquartile range. Name a question each one is the right '
                + 'answer to — and is there one of them you would NOT want if you were asking '
                + 'about the worst case?',
            },
          ],
          answer:
            'The donations give 50 − 15 = +35, so their tail is on the high side; the marks give '
            + '15 − 17 = −2, so theirs is on the low side. The sign is the reading and the size '
            + 'is not comparable across two lists in different units. For 2, 4, 4, 4, 5, 5, 7, 9 '
            + 'the range is 9 − 2 = 7, and splitting into halves of four gives Q₁ = (4 + 4)/2 = 4 '
            + 'and Q₃ = (5 + 7)/2 = 6, so the interquartile range is 2. Replacing the 9 by 90 '
            + 'takes the range to 90 − 2 = 88 — up by the 81 the value moved — and leaves the '
            + 'interquartile range at 2, because the upper half\'s median is the mean of its '
            + 'middle two and 90 is not one of them. An interpolating convention gives 1.5 '
            + 'instead of 2 both before and after: the figure depends on the convention and the '
            + 'immunity does not.',
        },
      },
    ],
  },
]

/**
 * No edges, and that is a fact about the boundary rather than an omission.
 *
 * An authored ontology's edges may only name concepts it contains, or
 * `ontologyProblems` reports an unknown endpoint for every one. This subject
 * holds a single concept, so there is no internal pair to join — and both of
 * that concept's prerequisites are authored in OTHER subjects: `percent` in
 * `arithmetic-foundations` and `sigma-notation` in `functions-and-inverses`.
 * Being authored elsewhere fails the containment test exactly as being unwritten
 * does, so both stranded edges live in `STATISTICS.links` in
 * atlas-uncertainty.ts, which is the area that owned the departing node.
 *
 * This is the first promotion whose stranded edges reach TWO different authored
 * subjects. `solid-measure` had one prerequisite and `triangle-trigonometry` had
 * two in the same subject; either could in principle have been argued into the
 * receiving ontology by moving the far concept. Here no single ontology contains
 * both ends, so the `links` entries are forced rather than chosen, and an edge
 * added below naming either concept would look right and would make
 * `ontologyProblems` report an unknown endpoint.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between
 * "there are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const DATA_SUMMARIES: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
