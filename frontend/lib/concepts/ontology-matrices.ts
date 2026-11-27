/**
 * A fifth subject: matrices as maps, and the four things you compute about one.
 *
 * ── Why linear algebra and not limits ─────────────────────────────────────
 *
 * The two obvious candidates above the existing syllabi were
 * `limits-and-continuity` and this. Limits lost on the same ground that
 * stopped `graphs-of-functions`: what makes a limit worth teaching is what a
 * function APPROACHES, and "approaches 3" is not a claim exact rational
 * arithmetic can settle. A task asking for the value of an indeterminate form
 * would be asking the engine the one question it cannot answer.
 *
 * Matrices have the opposite shape. Every quantity here — an entry of a
 * product, a determinant, an entry of an inverse — is a number computed from
 * other numbers by addition and multiplication, which is exactly what
 * `ruleEvaluate` settles exactly and locally. So this subject is gradable with
 * no worker configured, like arithmetic and functions.
 *
 * ── THE ENGINE HAS NO MATRIX TYPE, AND THAT SHAPED EVERY TASK ─────────────
 *
 * `parseExpression` knows numbers, symbols and the five operators. There is no
 * way to write a matrix, so there is no way to ask "compute AB" and have the
 * answer be a grid.
 *
 * Every task therefore asks for ONE ENTRY, with the matrices given in the
 * prompt and the entries named as symbols. That is not a reduction of the
 * subject — it is how the subject is actually performed. Nobody multiplies two
 * matrices in one step; they compute entry (1,1), then (1,2), and the rule
 * being drilled is "row i against column j". Asking for one entry asks for
 * exactly that rule, and asking for the whole grid would just be asking for it
 * four times.
 *
 * The honest limit of this: a learner can get every entry right and still not
 * be able to lay out a product, and nothing here tests the layout. That is a
 * real gap and it is the verifier's, not the curriculum's.
 *
 * ── Where it stops ────────────────────────────────────────────────────────
 *
 * This heading used to say "four concepts" and then refuse the fifth in one
 * sentence. The refusal is reproduced rather than deleted, because it names a
 * real hazard and the material below is shaped by it:
 *
 *   Four concepts: what a matrix IS, multiplication, the determinant, and the
 *   inverse. `eigenvalues` is left mapped because its honest task is "solve
 *   the characteristic polynomial", which is `factoring-quadratics` wearing a
 *   hat, and faking it as arithmetic would teach neither.
 *
 * Five concepts now. What the sentence got right is that ONE step of this
 * concept is a quadratic solve and that dressing that step up as though it
 * were the concept would teach neither topic. What does not follow is that the
 * concept IS that step — see the fifth-concept heading below, which measures
 * how much of the material the step accounts for and what the rest of it is.
 *
 * ── THE FIFTH CONCEPT THIS FILE RESERVED, AND WHY IT WENT ELSEWHERE ───────
 *
 * This heading used to refuse `gaussian-elimination` in one sentence, and the
 * refusal is reproduced rather than deleted because both halves of it are
 * still true and neither was ever a block:
 *
 *   `gaussian-elimination` is deliberately left mapped even though it sits
 *   inside this range — row reduction's answer is a matrix in a normal form,
 *   and checking "is this in reduced row echelon form" is a `form` check over
 *   a structure the engine has no type for.
 *
 * There is no matrix type and no `NamedForm` for echelon shape. What does not
 * follow is "therefore it cannot be authored" — only "therefore it cannot be
 * authored as a matrix task", and the heading two above this one had already
 * settled what to do about that: ask for ONE ENTRY, with the grid in the
 * prompt. The refusal argued from the answer's shape while the rest of the
 * file argues that the answer's shape is never what gets asked for here.
 *
 * It is a concept of `expressions-and-equations` now rather than a fifth
 * concept here, and the deciding reason is not taste. Row reduction on three
 * equations IS three equations: with no grid to display, every worked example
 * is written as rows of letters, every task asks for a number the elimination
 * produces, and filing it beside the matrices would have shipped a matrix
 * concept whose material never shows a matrix. The structural half is sharper
 * still — the map node declared `exercises: ['systems-of-linear-equations']`,
 * an `encompasses` edge, and an area's `links` carries `prerequisite` edges
 * only. Had it come here, that credit edge would have joined two concepts in
 * two different ontologies, which neither may declare and no `links` entry can
 * express, so it would have been dropped in silence.
 *
 * What this subject keeps is the edge: `gaussian-elimination → determinant`,
 * in `LINEAR_ALGEBRA.links`, because row reduction is how a determinant is
 * computed past 3×3. So `determinant` now waits on row reduction in earnest
 * rather than through an unwritten node — its gating set went from three
 * concepts to two, and the two are `matrix-multiplication` and
 * `gaussian-elimination`.
 *
 * ── THE FIFTH CONCEPT, AND THE TWO REFUSALS OF IT THIS FILE WROTE ─────────
 *
 * `eigenvalues` is the fifty-third promotion and this file refused it twice —
 * in `── Where it stops ──` above and by name in the subject `covers`. Both
 * are overturned here rather than quietly dropped, because the next run has to
 * be able to tell an expired refusal from a careless one.
 *
 * WHY THIS RUN HAD TO OVERTURN SOMETHING AT ALL. The fifty-second promotion
 * left the ready field EMPTY in a specific and checkable sense: eleven map
 * nodes had every prerequisite written, and all eleven were under a refusal
 * somebody had recorded in prose. tests/atlas.mjs asserts that the ready set is
 * exactly the recorded refusal list, so there was no unrefused node to author
 * and the only remaining moves were to overturn a refusal or to stop. Four
 * ontology-chance.ts sections in a row predicted this and all four named
 * `eigenvalues` as where to start, on the measurement rather than on taste:
 * FOUR dependents — `diagonalisation`, `cayley-hamilton`, `systems-of-odes`
 * and `markov-chains` — which is the most of anything on the map, refused or
 * not.
 *
 * THE FIRST REFUSAL IS NOT ABOUT RULABILITY, which is what made it worth
 * attacking first. "Its honest task is solve the characteristic polynomial,
 * which is `factoring-quadratics` wearing a hat" says the concept DUPLICATES
 * an authored one — a boundary claim, not a claim that nothing here can be
 * graded. Boundary claims are settled by counting, so: of the eleven subgoals
 * written below, ONE is a quadratic solve. The other ten are the test Av = λv
 * run forwards on a candidate and backwards on a non-candidate, the
 * rearrangement to (A − λI)v = 0, the determinant of a matrix with a letter
 * down its diagonal, the two coefficients read off the grid, the sum-and-
 * product check against the diagonal sum and ad − bc, the substitution of λ
 * back in, the two rows that collapse into one equation, and the ratio that
 * equation fixes. And NOT ONE of the four tasks is a quadratic solve — they ask
 * for an eigenvalue as a ratio, for the characteristic determinant's value at
 * an eigenvalue, for the second eigenvalue from the diagonal sum, and for a
 * component of a direction. So the sentence
 * was true of one eleventh of the concept and was stated as though it were
 * true of the whole, and the material is deliberately arranged so that the
 * quadratic is the step handed BACK to the prerequisite that owns it — the
 * example says so in the subgoal itself rather than pretending the factoring
 * is the lesson.
 *
 * THE SECOND REFUSAL IS A SHAPE REFUSAL AND THIS FILE HAS ALREADY OVERTURNED
 * ONE. `covers` declined the eigenvalue and every decomposition together, as
 * each needing "an answer that is itself a matrix, or a polynomial solved" —
 * and the heading two above this one is the record of the same file making the
 * same kind of claim about `gaussian-elimination` ("row reduction's answer is a
 * matrix in a normal form") and then finding that the answer's shape is never
 * what gets asked for here. An eigenvalue is a number and a component of an
 * eigenvector is a number, so the first disjunct is simply false of this
 * concept; the second describes the one step named above. The decomposition
 * half of that sentence was NOT overturned and is still in `covers`, because
 * there it is correct: a diagonalisation, a Jordan form and an SVD each answer
 * with matrices, and no task here can ask for one.
 *
 * ONE HONEST COST, AND IT IS THE RUNNING MATRIX. Every other concept of this
 * subject works on A = [[2, −1], [3, 4]], so a learner meets the same numbers
 * four times and sees det(A) = 11 come back as the inverse's denominator. That
 * matrix cannot be used here: its characteristic polynomial is λ² − 6λ + 11,
 * whose discriminant is 36 − 44 = −8, so it has no real eigenvalue at all and
 * `complex-numbers` is itself a refused node — `exactValue` has no complex
 * case. The material therefore introduces A = [[3, 1], [2, 2]] and keeps it
 * across all three points and all four tasks, which is the same discipline one
 * matrix lower down. Worth knowing that the subject's own exemplar is a
 * rotation-like map and that this is not a coincidence: a matrix picked to show
 * a clean determinant and a clean inverse has no reason to have real
 * eigenvalues, and the two choices pull in different directions.
 *
 * ── THE READY FIELD THIS PROMOTION LEAVES, MEASURED RATHER THAN QUOTED ────
 *
 * 212 map nodes, 98 authored, 19 areas, 17 subjects. THIRTEEN ready where
 * there were eleven, and the number is the smaller half of what moved: this
 * promotion spent `eigenvalues` and made THREE nodes ready — `diagonalisation`
 * (needs `rank-nullity`, written), `cayley-hamilton` (needs nothing else at
 * all) and `markov-chains` (needs `conditional-probability`, written). No
 * earlier promotion has made three; the record was two, at the forty-fifth.
 *
 * AND NONE OF THE THREE IS UNDER A RECORDED REFUSAL, which is the fact that
 * matters more than the count. The field was EMPTY — every ready node refused —
 * and it now holds three unrefused candidates, so the next run does not owe an
 * overturning argument at all. The eleven refusals are untouched and still
 * bind: `graphs-of-functions`, `relations`, `linear-inequalities`,
 * `complex-numbers`, `supremum-and-completeness`, `constructions`,
 * `non-euclidean-geometry`, `word-problems`, `combinatorial-identities`,
 * `sampling-and-bias` — ten, `eigenvalues` having been the eleventh and having
 * left the list by being written rather than by being re-refused.
 *
 * WHERE TO START, AND IT IS A JUDGEMENT THIS RUN DELIBERATELY DOES NOT MAKE.
 * `cayley-hamilton` is the cheapest filing on the map: its only `needs` is this
 * concept, so filed here it strands ZERO edges and is an ordinary `EDGES` entry
 * — the shape nothing has managed since the fifty-first. `diagonalisation`
 * strands one (`rank-nullity`, in `vectors-and-independence`) and unlocks three
 * further nodes. `markov-chains` strands one and would be a third concept of
 * `chance-and-events`. What a run picking between them owes is a rulability
 * read FIRST, before any authoring: `cayley-hamilton`'s content is that a
 * matrix satisfies its own characteristic polynomial, and "verify that
 * A² − 5A + 4I is the zero matrix" asks for an answer that IS a matrix, which
 * is the disjunct of the old `covers` refusal that this promotion did NOT
 * overturn. Asking instead for one ENTRY of A² − 5A + 4I is the move this whole
 * subject is built on and it does appear to settle it — but that is an argument
 * for the next run to make in its own words rather than inherit from this
 * paragraph.
 *
 * `linear-algebra` is at EIGHT nodes with twelve departures, so fifteen of
 * headroom against a floor of five — unchanged by this promotion, since a
 * departure moves a node from `nodes` into `departed` and the floor reads the
 * two together. Its area root set SPLIT from the sole root {`eigenvalues`} to
 * {`diagonalisation`, `cayley-hamilton`}, the second time that area has had a
 * sole root promoted out from under it.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'matrices-and-determinants',
  name: 'Matrices and determinants',
  covers:
    'A matrix as a linear map, multiplication as composition, the determinant, when a map can ' +
    'be undone, and which directions it leaves alone. Entries are the unit of work throughout — ' +
    'the engine has no matrix type, so every question asks for one number. THE EIGENVALUE IS ' +
    'WRITTEN, which is the sentence this subject has had to withdraw: it used to decline both ' +
    'the eigenvalue and every decomposition together, as each needing "an answer that is itself ' +
    'a matrix, or a polynomial solved". The decomposition half stands and is still what this ' +
    'subject does not reach — a diagonalisation, a Jordan form and an SVD each answer with ' +
    'matrices, and nothing here can ask for one. The eigenvalue half does not: an eigenvalue is ' +
    'a NUMBER, the quadratic it solves has its two coefficients read straight off the grid, and ' +
    'the direction belonging to it is fixed by one equation in two unknowns. Row reduction is ' +
    'written, but not here — with no grid to display it is three equations, so it is authored ' +
    'as `gaussian-elimination` in `expressions-and-equations` and reaches this subject as the ' +
    'prerequisite of the determinant rather than as a concept of it.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'matrices-and-maps',
    name: 'Matrices as linear maps',
    subjectId: subject.id,
    scope: {
      id: 'matrices-and-maps',
      label: 'Matrices as linear maps',
      hint: 'matrix linear transformation columns image basis vectors',
      match: /\b(matri(x|ces)|linear (map|transformation)|column space|image of a map|basis vector)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'apply-a-matrix',
        statement:
          'Apply a matrix to a vector, read its columns as the images of the basis vectors, and ' +
          'say what linearity buys.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'the-columns-are-where-the-basis-goes',
        conceptId: 'matrices-and-maps',
        statement:
          'The columns of a matrix are not an arbitrary arrangement: column j is exactly where ' +
          'the jth basis vector lands. Once you know that, you can read a matrix off a picture ' +
          'of the map and write one down without computing anything.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'A = [[2, −1], [3, 4]]. Find the first component of A·e₁, where e₁ = (1, 0).',
          subgoals: [
            {
              label: 'Apply the rule',
              detail: 'The first component is 2·1 + (−1)·0 = 2.',
              socratic:
                'The first component of the output is built out of the first row of A — that is ' +
                '(2, −1) — and the two entries of e₁. Which two products go into it, and what ' +
                'does each one come to?',
            },
            {
              label: 'Notice what came back',
              detail:
                'A·e₁ = (2, 3), which is the first COLUMN of A. Nothing was computed that was ' +
                'not already written down — multiplying by e₁ selects a column.',
              socratic:
                'The second row gives 3·1 + 4·0 = 3 by the same route, so A·e₁ = (2, 3). Look ' +
                'back at how A was written down — where has that pair of numbers already ' +
                'appeared, and what does that tell you about what the multiplication did?',
            },
            {
              label: 'Why this is the useful fact',
              detail:
                'It runs backwards. If you know a map sends (1,0) to (2,3) and (0,1) to (−1,4), ' +
                'the matrix is [[2,−1],[3,4]] with no further work. Every matrix you will ever ' +
                'write down is built this way.',
              socratic:
                'A·e₁ handed back column 1, and the same argument makes A·e₂ hand back column 2. ' +
                'So suppose nobody gives you A — only that the map sends (1, 0) to (2, 3) and ' +
                '(0, 1) to (−1, 4). How much of A can you write down, and how much arithmetic ' +
                'does it take?',
            },
          ],
          answer: '2 — the first entry of the first column',
        },
      },
      {
        id: 'a-matrix-respects-addition-and-scaling',
        conceptId: 'matrices-and-maps',
        statement:
          'A(u + v) = Au + Av, and A(cu) = c·Au. That is the whole definition of linear, and it ' +
          'is what makes the columns enough — every vector is a combination of basis vectors, so ' +
          'knowing where those go determines everything.',
        position: 2,
        workedExample: {
          problem:
            'A = [[2, −1], [3, 4]], u = (1, 2), v = (3, −1). Find the first component of A(u + v).',
          subgoals: [
            {
              label: 'Add the vectors first',
              detail: 'u + v = (4, 1).',
              socratic:
                'A(u + v) feeds one vector into A, and you have been handed two. What is the ' +
                'single vector that goes in, and what do you have to do to u and v to get it?',
            },
            {
              label: 'Apply A to the sum',
              detail: 'First component: 2·4 + (−1)·1 = 8 − 1 = 7.',
              socratic:
                'So (4, 1) is what goes in, and only the first component of the output was ' +
                'asked for. Which part of A does that one component depend on, and what does ' +
                'it come to?',
            },
            {
              label: 'Check it the other way',
              detail:
                'Au has first component 2·1 − 2 = 0; Av has 2·3 + 1 = 7. Their sum is 7 — the ' +
                'same answer. That it agrees is linearity; that it was cheaper the first way is ' +
                'why linearity is worth having.',
              socratic:
                'There was a second route: push u and v through A separately and add afterwards. ' +
                'Its first components are 0 and 7, so it lands on 7 as well. Was that agreement ' +
                'a coincidence of these particular numbers, or something you could have counted ' +
                'on before working out either side?',
            },
          ],
          answer: '7',
        },
      },
      {
        id: 'the-image-is-the-span-of-the-columns',
        conceptId: 'matrices-and-maps',
        statement:
          'Everything a matrix can reach is a combination of its columns. So the image is their ' +
          'span, and a matrix whose columns are dependent reaches less than its size suggests.',
        position: 3,
        workedExample: {
          problem:
            'With A = [[2, −1], [3, 4]], find the first component of 2·(column 1) + 3·(column 2).',
          subgoals: [
            {
              label: 'Take the combination',
              detail: 'First components of the columns are 2 and −1, so 2·2 + 3·(−1) = 4 − 3 = 1.',
              socratic:
                'Only the first component of the combination was asked for, so most of A plays ' +
                'no part in it. Which two entries does it depend on, and what does weighting ' +
                'those two by 2 and 3 come to?',
            },
            {
              label: 'What vector produced it',
              detail:
                'This is A applied to (2, 3) — combining the columns with weights 2 and 3 is the ' +
                'same as feeding in the vector (2, 3). Those are two descriptions of one ' +
                'operation.',
              socratic:
                'Column 1 is A·e₁ and column 2 is A·e₂, so what you just formed is 2·A·e₁ + ' +
                '3·A·e₂ — two outputs of A, scaled and then added. The previous point established ' +
                'that A respects exactly those two operations. What single vector, fed in once, ' +
                'would have produced the same result?',
            },
            {
              label: 'And when the image is smaller',
              detail:
                'Here the columns point in different directions, so together they reach the whole ' +
                'plane. Had column 2 been a multiple of column 1, every output would lie on a ' +
                'single line however the weights were chosen — which is what a zero determinant ' +
                'will turn out to mean.',
              socratic:
                'Nothing in that argument used the particular weights 2 and 3 — any pair of ' +
                'weights is some input vector, so every output of A whatsoever is a combination ' +
                'of these two columns. Now suppose column 2 had instead been (−4, −6), which is ' +
                '−2 times column 1. What can A still reach, and what decides how much that is?',
            },
          ],
          answer: '1',
        },
      },
    ],
  },

  {
    id: 'matrix-multiplication',
    name: 'Matrix multiplication',
    subjectId: subject.id,
    scope: {
      id: 'matrix-multiplication',
      label: 'Matrix multiplication',
      hint: 'matrix multiplication composition associative noncommutative row by column',
      match: /\b(matrix multiplication|row by column|noncommutativ\w+|associativ\w+|product of matrices|composition of maps)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'multiply-matrices',
        statement:
          'Compute an entry of a product, and say why the order matters and the grouping does ' +
          'not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'row-against-column',
        conceptId: 'matrix-multiplication',
        statement:
          'Entry (i, j) of AB is row i of A against column j of B, multiplied term by term and ' +
          'added. The rule looks arbitrary until you see it is composition: it is A applied to ' +
          'the jth column of B.',
        position: 1,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'A = [[2, −1], [3, 4]], B = [[5, 0], [3, 1]]. Find entry (1,1) of AB.',
          subgoals: [
            {
              label: 'Take row 1 of A and column 1 of B',
              detail: 'Row 1 of A is (2, −1). Column 1 of B is (5, 3).',
              socratic:
                'The entry asked for is (1,1), and its two indices do not do the same job — one ' +
                'of them points into A and the other into B. Which part of A does the first ' +
                'index pick out, which part of B does the second, and which four of these eight ' +
                'entries are therefore the only ones in play?',
            },
            {
              label: 'Multiply term by term and add',
              detail: '2·5 + (−1)·3 = 10 − 3 = 7.',
              socratic:
                'Row 1 of A gave (2, −1) and column 1 of B gave (5, 3), and what has to come out ' +
                'of those four numbers is one entry. There is more than one way to pair them off ' +
                '— which pairing is the right one, what happens to each pair, and what does the ' +
                'entry come to?',
            },
            {
              label: 'Why that is composition',
              detail:
                'Column 1 of B is where B sends e₁. Applying A to it gives where AB sends e₁ — ' +
                'which, by the columns rule, is column 1 of AB. The row-by-column recipe is a ' +
                'consequence of "do B, then do A", not a separate definition to memorise.',
              socratic:
                'By the columns rule, the (5, 3) you took out of B is where B sends e₁ — and ' +
                '2·5 + (−1)·3 is exactly how you would have found the first component of ' +
                'A·(5, 3). So follow e₁ through B and then through A: where does it land, which ' +
                'column of AB is that, and what does it say about where the row-against-column ' +
                'recipe comes from?',
            },
          ],
          answer: '7',
        },
      },
      {
        /**
         * `matrix-order-matters`, not `the-order-matters`.
         *
         * The functions subject already owns that id, on the point about
         * f(g(x)) against g(f(x)) — which is the same mathematical fact, since
         * matrix multiplication IS composition. Reusing the id would have been
         * tempting for exactly that reason and is a bug: point ids are global,
         * so `tasksForPoint` would have returned both subjects' tasks and
         * `ontologyForPoint` would have answered with whichever came first.
         * Caught by `pointIdCollisions`.
         */
        id: 'matrix-order-matters',
        conceptId: 'matrix-multiplication',
        statement:
          'AB and BA are different matrices, usually. Composition is not commutative — doing B ' +
          'then A is not doing A then B — and matrices inherit that exactly.',
        position: 2,
        automaticityTarget: 25_000,
        workedExample: {
          problem: 'Same A and B. Find entry (1,1) of BA, and compare with AB.',
          subgoals: [
            {
              label: 'Now B supplies the row',
              detail: 'Row 1 of B is (5, 0). Column 1 of A is (2, 3).',
              socratic:
                'Entry (1,1) of AB came from row 1 of A against column 1 of B. Nothing about the ' +
                'rule changes for BA — what changes is which matrix is standing where. Which of A ' +
                'and B supplies the row this time, which supplies the column, and what are the ' +
                'four numbers that end up in play?',
            },
            {
              label: 'Multiply and add',
              detail: '5·2 + 0·3 = 10.',
              socratic:
                'The row is (5, 0) and the column is (2, 3). One of those four numbers makes half ' +
                'of the arithmetic vanish before you do it — which pairing does the rule call for, ' +
                'which product drops out, and what does entry (1,1) of BA come to?',
            },
            {
              label: 'Compare',
              detail:
                'Entry (1,1) is 7 in AB and 10 in BA. One entry differing is enough to prove the ' +
                'two products are different matrices — no need to compute the rest.',
              socratic:
                'So AB has 7 in position (1,1) and BA has 10, and between the two products that ' +
                'is one entry each — six of the eight are still uncomputed. What has that single ' +
                'disagreement already settled about AB and BA, and is there any arithmetic still ' +
                'outstanding that could unsettle it?',
            },
          ],
          answer: '10, against 7 the other way round',
        },
      },
      {
        id: 'grouping-does-not-matter',
        conceptId: 'matrix-multiplication',
        statement:
          '(AB)C = A(BC), always. Associativity is free: both sides mean "do C, then B, then A", ' +
          'and composition of functions never cared how you bracketed it.',
        position: 3,
        workedExample: {
          problem:
            'A = [[2, −1], [3, 4]], B = [[5, 0], [3, 1]], C = column (1, 2). Find the first ' +
            'component of A(BC).',
          subgoals: [
            {
              label: 'Innermost first',
              detail: 'BC = (5·1 + 0·2, 3·1 + 1·2) = (5, 5).',
              socratic:
                'A(BC) brackets B with C and leaves A outside, and C is a single column rather ' +
                'than a second square matrix. Which of the two available products does that ' +
                'bracketing put first, what shape does it return, and what are its components?',
            },
            {
              label: 'Then apply A',
              detail: 'First component: 2·5 + (−1)·5 = 10 − 5 = 5.',
              socratic:
                'BC came out as the column (5, 5), so what is left is A against a single ' +
                'column — the same row-against-column move as before, with A now supplying the ' +
                'row. The problem asks for the first component only: which row of A is therefore ' +
                'the only one in play, and what does that component come to?',
            },
            {
              label: 'And the other grouping',
              detail:
                'AB has first row (7, −1), so (AB)C gives 7·1 + (−1)·2 = 5. The same, as it must ' +
                'be — and note the arithmetic was genuinely different, which is why associativity ' +
                'is a theorem rather than an observation.',
              socratic:
                'Regroup it as (AB)C instead. You already found 7 in position (1,1) of AB, and ' +
                'its first row is (7, −1), so this route multiplies two matrices first and meets ' +
                'C only at the end — genuinely different arithmetic from the route you just took. ' +
                'What does the first component come to this time, and given that one disagreeing ' +
                'entry was enough to separate AB from BA, what would it take to settle that the ' +
                'two groupings agree every time rather than merely here — one matching component, ' +
                'or something that is not arithmetic at all?',
            },
            {
              label: 'Why it is worth knowing',
              detail:
                'It is what lets you choose the cheap order. A(BC) here multiplied a matrix by a ' +
                'vector twice; (AB)C multiplied two matrices and then hit a vector. For large ' +
                'matrices that choice is the difference between feasible and not.',
              socratic:
                'Both routes landed on the same number, so the bracketing is yours to choose — ' +
                'and the two were not equally cheap. Count what each one actually did: A(BC) hit ' +
                'a column with a matrix twice, while (AB)C built a full 2×2 product first and hit ' +
                'a column once. At this size the difference is nothing. What happens to it when A ' +
                'and B are 1000×1000 and C is still one column, and what does that make ' +
                'associativity worth having?',
            },
          ],
          answer: '5',
        },
      },
    ],
  },

  {
    id: 'determinant',
    name: 'The determinant',
    subjectId: subject.id,
    scope: {
      id: 'determinant',
      label: 'The determinant',
      hint: 'determinant volume scaling singular cofactor expansion',
      match: /\b(determinant|det\b|singular matrix|volume scaling|cofactor)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-and-read-a-determinant',
        statement:
          'Compute a 2×2 determinant and say what its value, and particularly its vanishing, ' +
          'tells you about the map.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'ad-minus-bc',
        conceptId: 'determinant',
        statement:
          'For [[a, b], [c, d]] the determinant is ad − bc. The minus sign is not decoration: it ' +
          'is what makes the result SIGNED, so the determinant records whether the map flipped ' +
          'orientation as well as how much it stretched.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Find the determinant of [[2, −1], [3, 4]].',
          subgoals: [
            {
              label: 'Apply the rule',
              detail: 'ad − bc = 2·4 − (−1)·3 = 8 + 3 = 11.',
              socratic:
                'In ad − bc, a and d are the pair sitting on the diagonal and b and c are the ' +
                'two off it — here that is 2 and 4 against −1 and 3. One of those four entries ' +
                'is already negative, so the minus sign in the rule will not do to it what it ' +
                'looks like it does. Which two products does the rule call for, what does ' +
                'subtracting the second one actually do to the first, and what does the ' +
                'determinant come to?',
            },
            {
              label: 'Read the size',
              detail:
                'A unit square has area 1; its image under this map has area 11. The determinant ' +
                'is the factor every area is multiplied by, anywhere in the plane.',
              socratic:
                '11 on its own is just a number, so put it next to something with units. The ' +
                'columns rule says e₁ lands on (2, 3) and e₂ on (−1, 4), so the unit square ' +
                'those two basis vectors span — area 1 — is sent to the parallelogram built on ' +
                'the two columns, and that parallelogram\'s area comes out as 11. A linear map ' +
                'treats no part of the plane differently from any other. What does that make ' +
                'the determinant a measure of, and is what you have just read off a fact about ' +
                'that one square or about every region at once?',
            },
            {
              label: 'Read the sign',
              detail:
                'Positive, so orientation is preserved — anticlockwise stays anticlockwise. A ' +
                'negative determinant would mean the map reflects, and |det| would still be the ' +
                'area factor.',
              socratic:
                '11 came out positive, but nothing in ad − bc forces that: write the same two ' +
                'columns down in the other order, as [[−1, 2], [4, 3]], and the rule returns ' +
                '−11. That map sends the unit square to the same parallelogram, so it stretches ' +
                'area by exactly as much, and no area is negative — so size cannot be all the ' +
                'determinant is recording. Take a pair of vectors that turn anticlockwise and ' +
                'push them through each of the two maps in turn: what happens to that turning ' +
                'in the second case that does not happen in the first, and when a determinant ' +
                'does come out negative, what is left of it that still gives you the area ' +
                'factor?',
            },
          ],
          answer: '11',
        },
      },
      {
        id: 'zero-means-collapse',
        conceptId: 'determinant',
        statement:
          'det = 0 exactly when the map crushes the plane onto a line or a point. That is the ' +
          'single most useful thing the determinant says, and every other "is it invertible" ' +
          'test is equivalent to it.',
        position: 2,
        workedExample: {
          problem: 'Find the determinant of [[2, 4], [1, 2]], and say what it means.',
          subgoals: [
            {
              label: 'Compute',
              detail: '2·2 − 4·1 = 4 − 4 = 0.',
              socratic:
                'The rule has not changed: ad − bc, with a and d the pair on the diagonal and b ' +
                'and c the two off it — here 2 and 2 against 4 and 1. Nothing is negative this ' +
                'time, so the subtraction does exactly what it looks like it does. What are the ' +
                'two products, and what is left when you take the second away from the first?',
            },
            {
              label: 'Look at the columns',
              detail:
                'They are (2, 1) and (4, 2), and the second is twice the first. The columns are ' +
                'dependent, so their span is a line rather than the plane.',
              socratic:
                'Set the determinant aside for a moment and read the matrix the way the columns ' +
                'rule reads it: e₁ lands on (2, 1), e₂ lands on (4, 2), and everything the map ' +
                'reaches is what those two columns span between them. Two vectors span the whole ' +
                'plane only when neither one is a multiple of the other. Hold (2, 1) and (4, 2) ' +
                'side by side and compare them entry by entry — then say how much of the plane ' +
                'the pair can reach: all of it, or something smaller, and if smaller, what shape ' +
                'is that?',
            },
            {
              label: 'Connect the two',
              detail:
                'Everything this matrix reaches lies on the line through (2, 1). Area is scaled ' +
                'by 0 because the image has no area at all. The determinant vanishing and the ' +
                'columns being dependent are the same fact.',
              socratic:
                'You now have two readings of the same matrix, arrived at independently: the ' +
                'rule returned 0, and the columns reach no further than the line through (2, 1). ' +
                'The last point established what a determinant measures — the factor every area ' +
                'is multiplied by — and a line, however long, encloses no area whatever. Put ' +
                'those together and the two readings stop being a coincidence: given where this ' +
                'map sends the unit square, what value was the rule never going to be able to ' +
                'return, and is the vanishing determinant a separate piece of evidence for the ' +
                'collapse or another way of stating it?',
            },
          ],
          answer: '0 — the map collapses the plane onto a line',
        },
      },
      {
        id: 'the-determinant-multiplies',
        conceptId: 'determinant',
        statement:
          'det(AB) = det(A)·det(B). Obvious once you read the determinant as a scale factor: ' +
          'doing one map then another scales area by one factor and then the other.',
        position: 3,
        workedExample: {
          problem:
            'A = [[2, −1], [3, 4]] and B = [[5, 0], [3, 1]]. Find det(A)·det(B), and say what it ' +
            'tells you about AB.',
          subgoals: [
            {
              label: 'Each determinant',
              detail: 'det(A) = 8 + 3 = 11. det(B) = 5·1 − 0·3 = 5.',
              socratic:
                'A is the matrix the first point in this concept already took apart, so one of ' +
                'these two determinants you can recall rather than recompute — though it costs ' +
                'nothing to check it. B is the new one, and it carries a 0 in the top-right ' +
                'corner, which means one of the two products ad − bc calls for is zero before ' +
                'you subtract anything. Which of the two products does that 0 kill, and what ' +
                'does each of det(A) and det(B) come to?',
            },
            {
              label: 'Multiply',
              detail: '11 · 5 = 55, so det(AB) = 55 without computing a single entry of AB.',
              socratic:
                'Earlier in this subject you worked out a single entry of AB — 7, in position ' +
                '(1,1) — and a determinant needs all four of them. So resist forming the matrix ' +
                'and use the reading instead: the first point in this concept settled that a ' +
                'determinant is the factor by which a map multiplies every area, anywhere in ' +
                'the plane, and AB is the one map that does B\'s work and then A\'s. Send the ' +
                'unit square through it in two stages, B scaling its area by one of your two ' +
                'numbers and A scaling whatever comes out by the other. What is the ' +
                'composite\'s area factor, what does that make det(AB), and how many entries ' +
                'of AB did you need in order to say so?',
            },
            {
              label: 'The consequence worth keeping',
              detail:
                'A product is singular exactly when one of its factors is. If either map ' +
                'collapses a dimension, the composite cannot recover it — which is why a chain ' +
                'of invertible maps is invertible and one bad link ruins it.',
              socratic:
                'Now stop using det(AB) = det(A)·det(B) to produce numbers and read it as a ' +
                'statement about zero. A product of two numbers vanishes exactly when one of ' +
                'the factors does — nothing else makes a product zero — and the previous point ' +
                'established what a vanishing determinant says about a map. So suppose B ' +
                'crushes the plane onto a line while A is as well behaved as you like: what ' +
                'does the equation force det(AB) to be, and what has become of the composite? ' +
                'Then push it along a longer chain of maps in which exactly one link collapses ' +
                'a dimension — what is true of the whole chain, and what does that say about a ' +
                'later map\'s prospects of undoing an earlier one\'s damage?',
            },
          ],
          answer: '55',
        },
      },
    ],
  },

  {
    id: 'matrix-inverse',
    name: 'Invertibility',
    subjectId: subject.id,
    scope: {
      id: 'matrix-inverse',
      label: 'Invertibility',
      hint: 'inverse matrix invertible nonsingular identity',
      match: /\b(inverse matrix|invertib\w+|nonsingular|identity matrix|A\^?-1)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'invert-a-matrix',
        statement:
          'Compute an entry of a 2×2 inverse, verify it against the identity, and say why a ' +
          'singular matrix has none.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'swap-negate-divide',
        conceptId: 'matrix-inverse',
        statement:
          'For [[a, b], [c, d]] the inverse is (1/det)·[[d, −b], [−c, a]] — swap the diagonal, ' +
          'negate the other two, divide by the determinant. The division is where invertibility ' +
          'lives: everything else works for any matrix at all.',
        position: 1,
        workedExample: {
          problem: 'A = [[2, −1], [3, 4]]. Find entry (1,1) of A⁻¹.',
          subgoals: [
            {
              label: 'Get the determinant',
              detail: 'det = 2·4 − (−1)·3 = 11.',
              socratic:
                'The inverse of [[a, b], [c, d]] is (1/det)·[[d, −b], [−c, a]], so the whole ' +
                'bracket is about to be scaled by a single number and nothing can be scaled ' +
                'until you have it. You have met this A already — it is the matrix the ' +
                'determinant concept opened with — so this is a check rather than fresh work, ' +
                'and the trap it carried is still here: b is −1, so subtracting bc takes ' +
                'nothing away. What are the two products ad − bc calls for, and what does the ' +
                'determinant come to?',
            },
            {
              label: 'Build the adjugate',
              detail:
                'Swap the diagonal and negate the off-diagonal: [[4, 1], [−3, 2]]. Entry (1,1) ' +
                'is 4, which was d.',
              socratic:
                'Set the 11 aside and read only the bracket, [[d, −b], [−c, a]], slot against ' +
                'slot with [[a, b], [c, d]]. Not one entry has stayed where it was: the two on ' +
                'the diagonal have traded places with each other, and the two off it have kept ' +
                'their slots but changed sign. A has b = −1, so one of those sign changes will ' +
                'not look like a sign change once you write it down. Fill the bracket in with ' +
                'A\'s own four numbers, then answer what the problem actually asked about ' +
                'position (1,1) — which of A\'s entries has landed there, and what number is it?',
            },
            {
              label: 'Divide',
              detail: '4/11.',
              socratic:
                'The 1/det sits outside the bracket, which means it multiplies every entry ' +
                'rather than picking one out — so apply it to the entry you have just found. ' +
                'Then look at the fraction before you commit to it: 11 is prime and 4 is no ' +
                'multiple of it, so nothing cancels and the only thing left to get wrong is ' +
                'which of the two numbers ends up on top. Which of 4/11 and 11/4 is entry ' +
                '(1,1) of A⁻¹, and what in the formula settles that rather than which of them ' +
                'looks tidier?',
            },
            {
              label: 'What the formula is really saying',
              detail:
                'Every step but the last is arithmetic on the entries and would work on any ' +
                'matrix. Only the division can fail, and it fails exactly when det = 0 — so ' +
                '"not invertible" and "determinant zero" are the same condition, not two tests.',
              socratic:
                'Now run the recipe in your head on any four numbers you like, including a ' +
                'matrix you suspect has no inverse at all. Swapping two of them and negating ' +
                'the other two is something you can always do — that part of the procedure has ' +
                'no way of refusing, whatever it is handed. Division is not like that: ' +
                'arithmetic refuses exactly one divisor and no others. So walk back over the ' +
                'three steps you have just done and say which single one of them is the only ' +
                'one that can ever fail, what that forces to be true of the matrix on the ' +
                'occasions when it does, and whether "A has no inverse" and "det A = 0" are ' +
                'therefore two things a learner should check or one condition going under two ' +
                'names?',
            },
          ],
          answer: '4/11',
        },
      },
      {
        id: 'it-composes-to-the-identity',
        conceptId: 'matrix-inverse',
        statement:
          'What makes A⁻¹ the inverse is A⁻¹A = I. That is the definition and the only check ' +
          'worth doing — the same standard as an inverse function, which this is a case of.',
        position: 2,
        workedExample: {
          problem: 'With A = [[2, −1], [3, 4]] and A⁻¹ = (1/11)[[4, 1], [−3, 2]], verify entry (1,1) of A⁻¹A.',
          subgoals: [
            {
              label: 'Row 1 of A⁻¹ against column 1 of A',
              detail:
                'Row 1 of the adjugate is (4, 1); column 1 of A is (2, 3). So (4·2 + 1·3)/11.',
              socratic:
                'The product being checked is A⁻¹A, in that order, and this subject has already ' +
                'shown that swapping the two factors generally changes the answer — so which ' +
                'matrix stands where is part of the question rather than a detail. A⁻¹ also ' +
                'arrives with its 1/11 outside the bracket, multiplying every entry rather than ' +
                'picking one out, so it need not join the pairing at all. Which of A⁻¹ and A ' +
                'supplies row 1, which supplies column 1, which four numbers does that leave in ' +
                'play, and where does the 1/11 wait meanwhile?',
            },
            {
              label: 'Compute',
              detail: '(8 + 3)/11 = 11/11 = 1.',
              socratic:
                'Row 1 of the adjugate is (4, 1) and column 1 of A is (2, 3). The 1 there is the ' +
                'entry the inverse formula negated, and because A\'s b was already −1 that ' +
                'negation handed back a positive number; the one visibly negative entry, −3, ' +
                'sits in the bracket\'s second row and never meets row 1. So all four numbers in ' +
                'front of you are positive and no sign is lying in wait. The 1/11 is still ' +
                'outside. Which pairing does the rule call for, what do the two products come to ' +
                'when added, and what is entry (1,1) of A⁻¹A once the 1/11 is applied?',
            },
            {
              label: 'Why 1 is the right answer',
              detail:
                'Entry (1,1) of the identity is 1. The numerator came out as exactly the ' +
                'determinant, which is not a coincidence — that cancellation is the whole reason ' +
                'the formula is divided by det.',
              socratic:
                'Entry (1,1) of the identity is 1, so this entry of A⁻¹A is exactly what the ' +
                'definition demands of it. The part worth stopping on is the numerator: before ' +
                'the division it was 8 + 3 = 11, and 11 is not a new number in this subject — it ' +
                'is what ad − bc returned for this same A in the previous concept, and what you ' +
                'divided by in the previous point. So the sum the row-against-column rule ' +
                'produced and the determinant sitting under the formula turned out to be the ' +
                'same number, which is the only reason the fraction reduced at all. Test whether ' +
                'that was luck about these four entries: take any [[a, b], [c, d]] with a ' +
                'nonzero determinant, write down row 1 of its adjugate against column 1 of the ' +
                'matrix itself, and multiply them out in the letters rather than in numbers. ' +
                'What is the numerator in general, and what does that make the 1/det in the ' +
                'inverse formula — a tidying step applied afterwards, or the one thing that was ' +
                'always going to turn this product into the identity?',
            },
          ],
          answer: '1',
        },
      },
      {
        id: 'singular-means-no-inverse',
        conceptId: 'matrix-inverse',
        statement:
          'A matrix with determinant zero has no inverse, and the reason is not that the formula ' +
          'divides by zero — it is that the map destroyed information. Two different inputs were ' +
          'sent to the same output, so nothing could send it back.',
        position: 3,
        workedExample: {
          problem: 'Find the determinant of [[6, 3], [4, 2]] and say why no inverse exists.',
          subgoals: [
            {
              label: 'Compute it',
              detail: '6·2 − 3·4 = 12 − 12 = 0.',
              socratic:
                'Every determinant you have taken in this subject has been ad − bc on a matrix ' +
                'whose b was −1, so the subtraction kept handing something back rather than ' +
                'taking anything away. [[6, 3], [4, 2]] has no negative entry anywhere in it, ' +
                'which means for the first time the second product is a genuine deduction from ' +
                'the first. Which two pairs of entries does ad − bc single out here, what does ' +
                'each of those two products come to, and what is left once you have subtracted?',
            },
            {
              label: 'The formula fails — but that is a symptom',
              detail:
                'Dividing the adjugate by 0 is undefined. On its own that only says this ' +
                'particular recipe does not apply.',
              socratic:
                'Carry that number back to the formula from two points ago. The bracket it asks ' +
                'for, [[d, −b], [−c, a]], is [[2, −3], [−4, 6]] here, and writing it down gave ' +
                'you no trouble at all — swapping and negating four numbers never does. Then the ' +
                'whole bracket is to be divided by what you have just computed, and division is ' +
                'the one step you already identified as capable of refusing. Be careful how much ' +
                'that settles, though: a recipe breaking down is a fact about the recipe, and ' +
                'plenty of quantities are reachable by some other route when one method stalls. ' +
                'So what exactly has the breakdown established, and what has it not yet ' +
                'established about whether any matrix at all can undo this one?',
            },
            {
              label: 'The real reason',
              detail:
                'The columns are dependent — (6,4) and (3,2) with the first twice the second — so ' +
                'the whole plane is crushed onto a line. The vectors (1, −2) and (0, 0) both map ' +
                'to the origin. An inverse would have to send the origin back to both, and a map ' +
                'returns one output.',
              socratic:
                'Argue it from the map instead of from the recipe. The determinant concept ' +
                'settled that this number is the factor by which the matrix multiplies every ' +
                'area, and you have just found the factor for this one; separately, a matrix\'s ' +
                'two columns are where the two basis vectors land, so hold (6, 4) against ' +
                '(3, 2) and say what has become of the plane. That comparison gives you ' +
                'something sharper than a shape, too. This matrix sends (x, y) to ' +
                'x·(6, 4) + y·(3, 2), so the relation between the columns is itself a recipe for ' +
                'a combination that cancels: produce a nonzero (x, y) that lands on the origin. ' +
                'The origin was already going there. An inverse is a map, and a map returns one ' +
                'output per input — so what would an inverse of this matrix be obliged to do ' +
                'with the origin, and which of those two requirements does that break?',
            },
            {
              label: 'The same argument you have seen before',
              detail:
                'This is `it-has-to-be-one-to-one` from inverse functions, in two dimensions. A ' +
                'matrix is a function; the condition for undoing one has not changed.',
              socratic:
                'Say back what you have just shown with every piece of matrix vocabulary taken ' +
                'out of it: two different inputs arrived at the same output, so no rule could ' +
                'send that output back. Nothing in that sentence mentions determinants, columns ' +
                'or 2×2 anything — and the first point of this concept had already warned you ' +
                'that every step of the inverse formula except the division works on any four ' +
                'numbers whatever, which was a hint that the real obstruction was never going to ' +
                'be arithmetic. You have met this argument in another subject, about an ' +
                'operation on plain numbers that sent two of them to one, and a matrix is after ' +
                'all a function from the plane to the plane. Where have you seen it, what ' +
                'condition on a function did it name as the price of being undoable, and what ' +
                'does moving from one variable to two change about that condition?',
            },
          ],
          answer: '0 — the map is not one-to-one, so nothing can undo it',
        },
      },
    ],
  },

  {
    id: 'eigenvalues',
    name: 'Eigenvalues and eigenvectors',
    subjectId: subject.id,
    scope: {
      id: 'eigenvalues',
      label: 'Eigenvalues and eigenvectors',
      hint: 'eigenvalue eigenvector characteristic polynomial invariant direction spectrum',
      match: /\beigen(value|vector|decomposition)s?\b|\bcharacteristic polynomial\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'test-a-direction-for-being-fixed',
        statement:
          'Decide whether a given vector is an eigenvector of a given matrix, and read off its ' +
          'eigenvalue when it is.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'find-the-eigenvalues-and-a-direction',
        statement:
          'Build a 2×2 characteristic polynomial from the entries, find the eigenvalues it ' +
          'vanishes at, and recover the direction belonging to one of them.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-direction-the-map-only-scales',
        conceptId: 'eigenvalues',
        statement:
          'Almost every vector comes out of a matrix pointing somewhere else. An eigenvector is ' +
          'one that does not: Av is v itself, scaled, and the scale factor λ is the eigenvalue. ' +
          'Testing a candidate needs nothing new at all — apply the matrix and ask whether what ' +
          'came out is a multiple of what went in.',
        position: 1,
        workedExample: {
          problem: 'A = [[3, 1], [2, 2]]. Is (1, 1) an eigenvector of A? Is (1, 0)?',
          subgoals: [
            {
              label: 'Apply the matrix to the first candidate',
              detail:
                'Row 1 against the vector gives 3·1 + 1·1 = 4, row 2 gives 2·1 + 2·1 = 4. So ' +
                'A(1, 1) = (4, 4).',
              socratic:
                'Nothing in this point is new machinery: applying a 2×2 to a vector is the row ' +
                'rule this subject opened with, one row at a time against the same two ' +
                'components. The vector is (1, 1), which makes each row\'s arithmetic a plain ' +
                'sum of its two entries rather than a weighted one. Take row 1 of A, then row 2, ' +
                'against (1, 1) — what two numbers come out, and what vector have you built?',
            },
            {
              label: 'Compare the output with the input',
              detail:
                '(4, 4) = 4·(1, 1). Same direction, four times as long, nothing turned — so ' +
                '(1, 1) is an eigenvector of A and its eigenvalue is 4.',
              socratic:
                'You have (1, 1) in and (4, 4) out, and the whole question this concept asks is ' +
                'whether those two point the same way. Two vectors point the same way exactly ' +
                'when one is a number times the other, so try to write (4, 4) as a multiple of ' +
                '(1, 1) and see whether a single number does it for BOTH components at once — ' +
                'that "both at once" is the condition doing the work, because one component can ' +
                'always be matched by some factor. If one number does serve, what is it, and ' +
                'which of the two names in this concept\'s title does the vector get and which ' +
                'does the number?',
            },
            {
              label: 'Try a vector that is not one',
              detail:
                'A(1, 0) = (3, 2), which is just column 1. (3, 2) is not a multiple of (1, 0) — ' +
                'it has a second component where (1, 0) has none — so (1, 0) is not an ' +
                'eigenvector. Nothing is wrong with it; being an eigenvector is the rare case, ' +
                'which is why the previous step is a test and not a formality.',
              socratic:
                'Now run the same test on a vector you can predict the answer for without ' +
                'arithmetic. The columns rule from the first concept of this subject says where ' +
                'A sends (1, 0): it is column 1, read straight off the grid. Hold that output ' +
                'next to (1, 0) and ask the multiple question again — (1, 0) has a zero second ' +
                'component, and scaling a zero by any factor whatever leaves it zero. So what ' +
                'would the output\'s second component have to be for a multiple to exist, what ' +
                'is it actually, and does the test fail here because the matrix is defective or ' +
                'because most directions simply get turned?',
            },
          ],
          answer: '(1, 1) is an eigenvector with eigenvalue 4; (1, 0) is not an eigenvector',
        },
      },
      {
        id: 'det-of-a-minus-lambda-i-vanishes',
        conceptId: 'eigenvalues',
        statement:
          'Av = λv rearranges to (A − λI)v = 0, so λ is an eigenvalue exactly when some non-zero ' +
          'vector is sent to the origin by A − λI — which is the collapse the determinant ' +
          'already tests for. The eigenvalues are therefore the λ with det(A − λI) = 0, and for ' +
          'a 2×2 that determinant is λ² − (a + d)λ + (ad − bc): both coefficients are read ' +
          'straight off the grid.',
        position: 2,
        workedExample: {
          problem: 'Find both eigenvalues of A = [[3, 1], [2, 2]].',
          subgoals: [
            {
              label: 'Subtract λ down the diagonal',
              detail:
                'A − λI = [[3 − λ, 1], [2, 2 − λ]]. Only the diagonal moves: I has nothing off ' +
                'its own diagonal to subtract.',
              socratic:
                'The equation to be satisfied is Av = λv, and as it stands the two sides are ' +
                'unlike things — a matrix acting on v against a number times v. Write λv as λI ' +
                'applied to v so that both sides are matrices acting on the same vector, bring ' +
                'them together, and you have a single matrix sending v to the origin. Now build ' +
                'that matrix for this A: where does λI put its entries, so which of A\'s four ' +
                'entries change and which are untouched?',
            },
            {
              label: 'Take its determinant',
              detail:
                '(3 − λ)(2 − λ) − 1·2 = (6 − 5λ + λ²) − 2 = λ² − 5λ + 4. The λ² comes from the ' +
                'two diagonal brackets, the −5λ from 3 + 2, and the 4 is 6 − 2, which is ad − bc.',
              socratic:
                'You are after the λ for which A − λI sends some non-zero vector to the origin, ' +
                'and the second point of the determinant concept settled exactly which matrices ' +
                'do that. So apply ad − bc to the matrix you have just built, with λ carried ' +
                'along as a letter rather than evaluated — the diagonal pair are both brackets ' +
                'now and the off-diagonal pair are the untouched 1 and 2. Expand it and collect: ' +
                'what degree does λ reach and why can it reach no higher, where did the ' +
                'coefficient of λ come from on the grid, and where did the constant?',
            },
            {
              label: 'Set it to zero and solve',
              detail:
                'λ² − 5λ + 4 = (λ − 1)(λ − 4), so the eigenvalues are λ = 1 and λ = 4. This last ' +
                'step is the factoring a prerequisite of this concept already owns; everything ' +
                'before it is the part that is about eigenvalues.',
              socratic:
                'The collapse condition is that this determinant be zero, so you now have a ' +
                'quadratic set to 0 and a move you have already learned elsewhere for exactly ' +
                'that. Two numbers multiplying to 4 and adding to 5 are not hard to find. Factor ' +
                'it, read off the two λ, and then notice what the division of labour has been: ' +
                'which steps of this example could only have been done by somebody who knows ' +
                'what an eigenvalue IS, and which one could have been handed to anybody who can ' +
                'factor a quadratic?',
            },
            {
              label: 'Check against the two invariants',
              detail:
                '1 + 4 = 5, which is 3 + 2, the diagonal sum; and 1·4 = 4, which is det A. Both ' +
                'coefficients came off the grid, so both checks were available before any ' +
                'solving — and 4 is the eigenvalue the previous point found by hand with no ' +
                'polynomial at all.',
              socratic:
                'Look at the polynomial you expanded rather than at the roots: its λ coefficient ' +
                'was −(3 + 2) and its constant was ad − bc, and a factored quadratic ' +
                '(λ − p)(λ − q) has −(p + q) and pq in those two places. Match them up and you ' +
                'get two statements relating your two answers to two numbers you could compute ' +
                'from A before you solved anything. What are those two statements, do your 1 and ' +
                '4 satisfy both, and what would you do if you were handed only ONE eigenvalue of ' +
                'this matrix and asked for the other?',
            },
          ],
          answer: 'λ = 1 and λ = 4',
        },
      },
      {
        id: 'the-direction-comes-from-the-collapse',
        conceptId: 'eigenvalues',
        statement:
          'An eigenvalue on its own is a number; the direction belonging to it is what the map ' +
          'actually leaves alone. Substitute λ back into A − λI and that matrix is singular by ' +
          'construction, so its two rows say the same thing once — and one equation in two ' +
          'unknowns fixes a ratio rather than a vector. The eigenvector is a DIRECTION: every ' +
          'non-zero multiple of it does the same job.',
        position: 3,
        workedExample: {
          problem:
            'A = [[3, 1], [2, 2]] has eigenvalue λ = 1. Find a direction A leaves unmoved.',
          subgoals: [
            {
              label: 'Substitute the eigenvalue',
              detail:
                'A − 1·I = [[2, 1], [2, 1]]. Its determinant is 2·1 − 1·2 = 0, and it had to be: ' +
                'that vanishing is what made 1 an eigenvalue in the first place.',
              socratic:
                'The previous point built A − λI with λ as a letter and then solved for the ' +
                'values that make its determinant vanish. Now run that backwards: put λ = 1 into ' +
                'the same matrix so every entry is a number again. Then compute ad − bc on the ' +
                'result — but before you do, what is it obliged to come to, and why should ' +
                'hearing that answer be a confirmation rather than news?',
            },
            {
              label: 'Read the one equation the rows give',
              detail:
                'Row 1 says 2x + y = 0 and row 2 says the same. The second row is no new ' +
                'information — which is precisely what a zero determinant means, and why there ' +
                'is a non-zero solution at all.',
              socratic:
                'You want the vectors (x, y) this matrix sends to the origin, so write out what ' +
                'each row demands of x and y. Two rows, two equations — except look at them side ' +
                'by side. If they had been genuinely different equations, the only pair ' +
                'satisfying both would be (0, 0), and the zero vector is no direction at all. ' +
                'What do these two rows turn out to say, how many independent conditions do you ' +
                'actually have, and which earlier fact about this matrix guaranteed that in ' +
                'advance?',
            },
            {
              label: 'Take any solution of it',
              detail:
                'y = −2x, so x = 1 gives (1, −2). Check it: A(1, −2) = (3 − 2, 2 − 4) = (1, −2), ' +
                'returned unchanged — which is exactly the claim an eigenvalue of 1 makes.',
              socratic:
                'One equation in two unknowns, so pick one of them and the other follows. ' +
                'Rearrange 2x + y = 0 for y, choose the easiest x you can that is not zero, and ' +
                'write the vector down. Then verify it the way the FIRST point of this concept ' +
                'tested a candidate, by applying A and comparing — and what does the output have ' +
                'to be here specifically, given which eigenvalue you were handed?',
            },
            {
              label: 'And the answer is the direction, not the vector',
              detail:
                '(2, −4) and (−1, 2) satisfy 2x + y = 0 just as well and are eigenvectors just ' +
                'as much. What A fixes is the whole line through (1, −2), so "the" eigenvector ' +
                'is a direction with a representative chosen for convenience.',
              socratic:
                'You chose x = 1 because it was easy; somebody else would have chosen x = 2 or ' +
                'x = −1 and written a different vector down. Work out what those two give, check ' +
                'whether each still satisfies the row equation, and apply A to one of them to ' +
                'see whether it too comes back unchanged. So what is the real answer to this ' +
                'problem — a single vector, or something larger that all of these are samples ' +
                'of — and what does that mean for two learners comparing answers?',
            },
          ],
          answer: '(1, −2), or any non-zero multiple of it',
        },
      },
    ],
  },
]

/**
 * The edges.
 *
 * One chain, each link a real dependency. Multiplication needs the map reading
 * because the row-by-column rule is *derived* from composition rather than
 * stated. The determinant needs multiplication because `det(AB) = det(A)det(B)`
 * is a third of the concept. And the inverse needs the determinant outright —
 * the formula divides by it.
 *
 * The cross-subject edges this subject rests on — `function-concept` under
 * `matrices-and-maps`, `function-composition` under `matrix-multiplication`,
 * `vectors-and-spans` under `matrices-and-maps`, and `gaussian-elimination`
 * under `determinant` — are NOT here. They cannot be: an edge naming a concept
 * this ontology does not contain fails `ontologyProblems` on the subject
 * viewed alone. They live in the linear-algebra area's `links`, which is the
 * field for an edge whose endpoints are both outside the area declaring it.
 *
 * Three of those four now name an AUTHORED concept rather than a map node, and
 * `gaussian-elimination` is the one that changed most recently: the edge is
 * the same edge and the entry was not touched, but the far end acquired
 * material, so a prerequisite that gated nothing now gates. `links` never
 * cared whether an end was a node or a concept, which is exactly why that kind
 * of change is invisible from the entry.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'matrices-and-maps->matrix-multiplication',
    from: 'matrices-and-maps',
    to: 'matrix-multiplication',
    kind: 'prerequisite',
    promotedBy: 'author:matrices-and-determinants',
  },
  {
    id: 'matrix-multiplication->determinant',
    from: 'matrix-multiplication',
    to: 'determinant',
    kind: 'prerequisite',
    promotedBy: 'author:matrices-and-determinants',
  },
  {
    id: 'determinant->matrix-inverse',
    from: 'determinant',
    to: 'matrix-inverse',
    kind: 'prerequisite',
    promotedBy: 'author:matrices-and-determinants',
  },

  {
    id: 'matrix-multiplication=>matrices-and-maps',
    from: 'matrix-multiplication',
    to: 'matrices-and-maps',
    kind: 'encompasses',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'An entry of a product is A applied to a column of B, so every multiplication task also ' +
      'applies a matrix to a vector.',
  },
  {
    id: 'matrix-inverse=>determinant',
    from: 'matrix-inverse',
    to: 'determinant',
    kind: 'encompasses',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'The inverse formula divides by the determinant, so computing one computes the other — ' +
      'and the singular case is a determinant question with no division at all.',
  },
  {
    id: 'matrix-inverse=>matrix-multiplication',
    from: 'matrix-inverse',
    to: 'matrix-multiplication',
    kind: 'encompasses',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'Verifying an inverse IS multiplying it by the original and checking the identity, so an ' +
      'inverse task performs a product with its answer known in advance.',
  },

  /**
   * The one real interference in this subject, and it is the error that makes
   * matrix algebra feel arbitrary: AB and BA are different, so every scalar
   * habit — cancelling, reordering a product, expanding (A+B)² — is wrong here
   * in a way that still produces a confident answer.
   *
   * Introduced alongside the determinant it is worse, not better, because
   * det(AB) = det(A)det(B) DOES commute, being a product of numbers. A learner
   * meeting both in one set has every reason to conclude the matrices commute
   * too.
   */
  {
    id: 'matrix-multiplication~determinant',
    from: 'matrix-multiplication',
    to: 'determinant',
    kind: 'interferes_with',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'det(AB) = det(A)det(B) is commutative because determinants are numbers, while AB and BA ' +
      'are not. Practised together, the determinant rule supplies exactly the false reassurance ' +
      'that matrix products can be reordered — which is the error multiplication exists to ' +
      'prevent.',
  },

  /*
   * THE FIFTH CONCEPT'S EDGES, AND THE ONE OF ITS THREE `needs` THAT COULD COME
   * HERE.
   *
   * The map node declared three prerequisites — `determinant`,
   * `basis-and-dimension` and `polynomial-roots` — and exactly one of them is a
   * concept of this subject, so exactly one can be an edge in this file. An
   * authored ontology may only name concepts it contains; the other two join
   * two concepts in two different ontologies and are `links` entries of
   * `linear-algebra`, the area that owned the departing node. See
   * atlas-structures.ts, where the twelfth departure records both.
   *
   * THE CHAIN FORKS HERE RATHER THAN LENGTHENING, which is worth stating
   * because four promotions into this subject had made it a straight line. The
   * node named `determinant` and not `matrix-inverse`, and that is right: the
   * characteristic equation needs a determinant to vanish and never needs
   * anything inverted. So `determinant` now gates two concepts — the inverse
   * and this — and neither waits on the other.
   */
  {
    id: 'determinant->eigenvalues',
    from: 'determinant',
    to: 'eigenvalues',
    kind: 'prerequisite',
    promotedBy: 'author:matrices-and-determinants',
  },

  /*
   * TWO CREDIT EDGES, AND BOTH ARE THE SAME CLAIM THE OTHER TWO `encompasses`
   * ENTRIES ABOVE MAKE: the work this concept asks for IS the earlier concept's
   * work, so a learner who has just done it should not be handed the earlier
   * one as though untouched.
   */
  {
    id: 'eigenvalues=>determinant',
    from: 'eigenvalues',
    to: 'determinant',
    kind: 'encompasses',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'The characteristic polynomial IS a 2×2 determinant with a letter down the diagonal, so ' +
      'forming one computes ad − bc; and the reason the equation is the right one to solve is ' +
      'the determinant concept\'s own reading of a vanishing determinant as a collapse.',
  },
  {
    id: 'eigenvalues=>matrices-and-maps',
    from: 'eigenvalues',
    to: 'matrices-and-maps',
    kind: 'encompasses',
    promotedBy: 'author:matrices-and-determinants',
    rationale:
      'Testing a candidate direction is applying the matrix to a vector and comparing, so the ' +
      'first knowledge point and its task are the row rule performed with the answer\'s shape ' +
      'known in advance.',
  },
]

export const MATRICES_AND_DETERMINANTS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
