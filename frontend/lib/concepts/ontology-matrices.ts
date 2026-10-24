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
 * Four concepts: what a matrix IS, multiplication, the determinant, and the
 * inverse. `gaussian-elimination` is deliberately left mapped even though it
 * sits inside this range — row reduction's answer is a matrix in a normal
 * form, and checking "is this in reduced row echelon form" is a `form` check
 * over a structure the engine has no type for. `eigenvalues` is left mapped
 * because its honest task is "solve the characteristic polynomial", which is
 * `factoring-quadratics` wearing a hat, and faking it as arithmetic would
 * teach neither.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'matrices-and-determinants',
  name: 'Matrices and determinants',
  covers:
    'A matrix as a linear map, multiplication as composition, the determinant, and when a map ' +
    'can be undone. Entries are the unit of work throughout — the engine has no matrix type, so ' +
    'every question asks for one number. Nothing about row reduction, eigenvalues or any ' +
    'decomposition: each needs an answer that is itself a matrix.',
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
            },
            {
              label: 'Notice what came back',
              detail:
                'A·e₁ = (2, 3), which is the first COLUMN of A. Nothing was computed that was ' +
                'not already written down — multiplying by e₁ selects a column.',
            },
            {
              label: 'Why this is the useful fact',
              detail:
                'It runs backwards. If you know a map sends (1,0) to (2,3) and (0,1) to (−1,4), ' +
                'the matrix is [[2,−1],[3,4]] with no further work. Every matrix you will ever ' +
                'write down is built this way.',
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
            },
            {
              label: 'Apply A to the sum',
              detail: 'First component: 2·4 + (−1)·1 = 8 − 1 = 7.',
            },
            {
              label: 'Check it the other way',
              detail:
                'Au has first component 2·1 − 2 = 0; Av has 2·3 + 1 = 7. Their sum is 7 — the ' +
                'same answer. That it agrees is linearity; that it was cheaper the first way is ' +
                'why linearity is worth having.',
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
            },
            {
              label: 'What vector produced it',
              detail:
                'This is A applied to (2, 3) — combining the columns with weights 2 and 3 is the ' +
                'same as feeding in the vector (2, 3). Those are two descriptions of one ' +
                'operation.',
            },
            {
              label: 'And when the image is smaller',
              detail:
                'Here the columns point in different directions, so together they reach the whole ' +
                'plane. Had column 2 been a multiple of column 1, every output would lie on a ' +
                'single line however the weights were chosen — which is what a zero determinant ' +
                'will turn out to mean.',
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
            },
            {
              label: 'Multiply term by term and add',
              detail: '2·5 + (−1)·3 = 10 − 3 = 7.',
            },
            {
              label: 'Why that is composition',
              detail:
                'Column 1 of B is where B sends e₁. Applying A to it gives where AB sends e₁ — ' +
                'which, by the columns rule, is column 1 of AB. The row-by-column recipe is a ' +
                'consequence of "do B, then do A", not a separate definition to memorise.',
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
            },
            {
              label: 'Multiply and add',
              detail: '5·2 + 0·3 = 10.',
            },
            {
              label: 'Compare',
              detail:
                'Entry (1,1) is 7 in AB and 10 in BA. One entry differing is enough to prove the ' +
                'two products are different matrices — no need to compute the rest.',
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
            },
            {
              label: 'Then apply A',
              detail: 'First component: 2·5 + (−1)·5 = 10 − 5 = 5.',
            },
            {
              label: 'And the other grouping',
              detail:
                'AB has first row (7, −1), so (AB)C gives 7·1 + (−1)·2 = 5. The same, as it must ' +
                'be — and note the arithmetic was genuinely different, which is why associativity ' +
                'is a theorem rather than an observation.',
            },
            {
              label: 'Why it is worth knowing',
              detail:
                'It is what lets you choose the cheap order. A(BC) here multiplied a matrix by a ' +
                'vector twice; (AB)C multiplied two matrices and then hit a vector. For large ' +
                'matrices that choice is the difference between feasible and not.',
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
            },
            {
              label: 'Read the size',
              detail:
                'A unit square has area 1; its image under this map has area 11. The determinant ' +
                'is the factor every area is multiplied by, anywhere in the plane.',
            },
            {
              label: 'Read the sign',
              detail:
                'Positive, so orientation is preserved — anticlockwise stays anticlockwise. A ' +
                'negative determinant would mean the map reflects, and |det| would still be the ' +
                'area factor.',
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
            },
            {
              label: 'Look at the columns',
              detail:
                'They are (2, 1) and (4, 2), and the second is twice the first. The columns are ' +
                'dependent, so their span is a line rather than the plane.',
            },
            {
              label: 'Connect the two',
              detail:
                'Everything this matrix reaches lies on the line through (2, 1). Area is scaled ' +
                'by 0 because the image has no area at all. The determinant vanishing and the ' +
                'columns being dependent are the same fact.',
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
            },
            {
              label: 'Multiply',
              detail: '11 · 5 = 55, so det(AB) = 55 without computing a single entry of AB.',
            },
            {
              label: 'The consequence worth keeping',
              detail:
                'A product is singular exactly when one of its factors is. If either map ' +
                'collapses a dimension, the composite cannot recover it — which is why a chain ' +
                'of invertible maps is invertible and one bad link ruins it.',
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
            },
            {
              label: 'Build the adjugate',
              detail:
                'Swap the diagonal and negate the off-diagonal: [[4, 1], [−3, 2]]. Entry (1,1) ' +
                'is 4, which was d.',
            },
            {
              label: 'Divide',
              detail: '4/11.',
            },
            {
              label: 'What the formula is really saying',
              detail:
                'Every step but the last is arithmetic on the entries and would work on any ' +
                'matrix. Only the division can fail, and it fails exactly when det = 0 — so ' +
                '"not invertible" and "determinant zero" are the same condition, not two tests.',
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
            },
            {
              label: 'Compute',
              detail: '(8 + 3)/11 = 11/11 = 1.',
            },
            {
              label: 'Why 1 is the right answer',
              detail:
                'Entry (1,1) of the identity is 1. The numerator came out as exactly the ' +
                'determinant, which is not a coincidence — that cancellation is the whole reason ' +
                'the formula is divided by det.',
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
            },
            {
              label: 'The formula fails — but that is a symptom',
              detail:
                'Dividing the adjugate by 0 is undefined. On its own that only says this ' +
                'particular recipe does not apply.',
            },
            {
              label: 'The real reason',
              detail:
                'The columns are dependent — (6,4) and (3,2) with the first twice the second — so ' +
                'the whole plane is crushed onto a line. The vectors (1, −2) and (0, 0) both map ' +
                'to the origin. An inverse would have to send the origin back to both, and a map ' +
                'returns one output.',
            },
            {
              label: 'The same argument you have seen before',
              detail:
                'This is `it-has-to-be-one-to-one` from inverse functions, in two dimensions. A ' +
                'matrix is a function; the condition for undoing one has not changed.',
            },
          ],
          answer: '0 — the map is not one-to-one, so nothing can undo it',
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
 * and the mapped `vectors-and-spans` and `gaussian-elimination` — are NOT
 * here. They cannot be: an edge naming a concept this ontology does not
 * contain fails `ontologyProblems` on the subject viewed alone. They live in
 * the linear-algebra area's `links`, which is the field for an edge whose
 * endpoints are both outside the area declaring it.
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
]

export const MATRICES_AND_DETERMINANTS: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
