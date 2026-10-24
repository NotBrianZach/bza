/**
 * A sixth subject: vectors, spans, and when a description is redundant.
 *
 * ── This one goes UNDERNEATH, so it tightens the gate ─────────────────────
 *
 * The last two subjects were authored above the algebra and gated only
 * mapped-only material. This one sits below `matrices-and-determinants`,
 * which is teachable — `matrices-and-maps` rests on `vectors-and-spans` by a
 * link written when matrices was authored. So making these three teachable
 * puts a real gate under a subject people can already practise, exactly as
 * arithmetic did to the algebra.
 *
 * That is correct and it is the design working (gating tightens, never
 * loosens, as material is authored), but it has a consequence worth stating:
 * ANYBODY MID-WAY THROUGH MATRICES IS NOW GATED BEHIND VECTORS THEY HAVE NOT
 * DONE. The claim path is the answer — these are three concepts, claimable in
 * one press from the graph — and the alternative, leaving the foundation
 * unwritten so nobody is inconvenienced, is how a map stays a map for ever.
 *
 * ── Why these three and not the dot product ───────────────────────────────
 *
 * `dot-product-geometry` is the obvious fourth and it is left mapped, because
 * the half of it worth teaching is `a·b = |a||b|cos θ` — the claim that a
 * product of components measures an ANGLE. The components half is checkable
 * arithmetic; the cosine half needs trigonometry this build cannot rule, and
 * authoring only the arithmetic would teach the formula while silently
 * dropping the reason anybody cares about it.
 *
 * `three-dimensional-coordinates` is left mapped for the same reason one step
 * on: it rests on the dot product.
 *
 * ── The determinant appears here, as a check, without an edge ─────────────
 *
 * Two vectors in the plane are dependent exactly when a₁b₂ − a₂b₁ = 0, which
 * is the determinant of the matrix with them as columns. It is taught here —
 * it is the only practical independence test at this size — but NO
 * prerequisite edge is drawn to `determinant`, and the omission is deliberate
 * rather than an oversight.
 *
 * Drawing one would make a cycle: `vectors-and-spans` gates
 * `matrices-and-maps`, which gates `matrix-multiplication`, which gates
 * `determinant`. An edge back from `determinant` to `linear-independence`
 * closes the loop, and `teachingOrder` returns null on a cyclic ontology
 * rather than a partial order — the whole curriculum would stop having an
 * order, to record a connection that is really just foreshadowing.
 *
 * So the worked example says plainly that this is the determinant and that it
 * is met properly later. A cross-reference in prose costs nothing; a cycle in
 * the graph costs the ordering of every subject.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'vectors-and-independence',
  name: 'Vectors and independence',
  covers:
    'Vectors as displacements, linear combinations and span, and the condition that makes a ' +
    'set of them non-redundant. Components throughout — nothing about the dot product or ' +
    'angles, which need trigonometry this build cannot rule, and nothing in three dimensions.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'plane-vectors',
    name: 'Vectors in the plane',
    subjectId: subject.id,
    scope: {
      id: 'plane-vectors',
      label: 'Vectors in the plane',
      hint: 'vector displacement components magnitude tip to tail scalar multiple',
      match: /\b(vector|displacement|tip[- ]to[- ]tail|magnitude|components?|scalar multiple)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'compute-with-components',
        statement:
          'Add and scale vectors by components, find a magnitude, and say why a vector is not a ' +
          'point.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-vector-is-a-displacement',
        conceptId: 'plane-vectors',
        statement:
          'A vector has a length and a direction and no position. (3, 4) is "three right, four ' +
          'up" from wherever you are — which is why the same vector can be drawn anywhere on the ' +
          'page, and why a vector and a point are different objects that happen to share a ' +
          'notation.',
        position: 1,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Find the magnitude of v = (3, 4).',
          subgoals: [
            {
              label: 'The components are two legs of a right triangle',
              detail: 'Going 3 across and 4 up, the displacement itself is the hypotenuse.',
            },
            {
              label: 'Pythagoras',
              detail: '|v| = (3² + 4²)^(1/2) = (9 + 16)^(1/2) = 25^(1/2) = 5.',
            },
            {
              label: 'What the number is about',
              detail:
                'It is the length of the arrow, not a location. The vector from (0,0) to (3,4) ' +
                'and the one from (7,1) to (10,5) are the SAME vector — same displacement — ' +
                'while the points at their tips are nothing alike.',
            },
          ],
          answer: '5',
        },
      },
      {
        id: 'adding-is-tip-to-tail',
        conceptId: 'plane-vectors',
        statement:
          'Adding two vectors means doing one displacement then the other, which in components ' +
          'is just adding them separately. The geometry and the arithmetic are the same ' +
          'statement, and that agreement is the reason components are worth using.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'u = (3, 4) and v = (−1, 2). Find the first component of u + v.',
          subgoals: [
            {
              label: 'Add component by component',
              detail: 'First: 3 + (−1) = 2. Second: 4 + 2 = 6. So u + v = (2, 6).',
            },
            {
              label: 'Why that matches the picture',
              detail:
                'Walk 3 right and 4 up, then 1 LEFT and 2 up. Net horizontal travel is 2 and ' +
                'vertical is 6 — the components never interact, because going across does not ' +
                'change how far up you are.',
            },
            {
              label: 'And why order does not matter here',
              detail:
                'v + u gives the same (2, 6). Vector addition is commutative because number ' +
                'addition is, component by component — unlike the matrix products these build ' +
                'toward, where it is not.',
            },
          ],
          answer: '2',
        },
      },
      {
        id: 'scaling-stretches-and-flips',
        conceptId: 'plane-vectors',
        statement:
          'Multiplying by a number stretches a vector by that factor and reverses it if the ' +
          'number is negative. The direction is otherwise untouched, which is what makes "scalar ' +
          'multiple" and "same line through the origin" the same condition.',
        position: 3,
        workedExample: {
          problem: 'u = (2, −1). Find the first component of 3u, and say what 3u looks like.',
          subgoals: [
            {
              label: 'Scale each component',
              detail: '3·2 = 6 and 3·(−1) = −3, so 3u = (6, −3).',
            },
            {
              label: 'Read the geometry',
              detail:
                'Three times as long, pointing the same way. Had the factor been −3 the length ' +
                'would be the same and the arrow would point the other way.',
            },
            {
              label: 'The fact this sets up',
              detail:
                'Every scalar multiple of u lies on one line through the origin. That line is ' +
                'everything u alone can reach — which is the span, and the next concept.',
            },
          ],
          answer: '6',
        },
      },
    ],
  },

  {
    id: 'vectors-and-spans',
    name: 'Linear combinations and span',
    subjectId: subject.id,
    scope: {
      id: 'vectors-and-spans',
      label: 'Linear combinations and span',
      hint: 'linear combination span reachable set of vectors',
      match: /\b(linear combination|span|spanning set|reachable|generated by)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'form-and-test-combinations',
        statement:
          'Form a linear combination, and decide whether a given vector is reachable from a set.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-linear-combination',
        conceptId: 'vectors-and-spans',
        statement:
          'A linear combination is a scaled sum: c₁u + c₂v. Those two operations — scale and ' +
          'add — are the only ones vectors have, so a combination is everything you are ever ' +
          'allowed to build.',
        position: 1,
        automaticityTarget: 20_000,
        workedExample: {
          problem: 'u = (2, −1) and v = (1, 3). Find the first component of 2u + 3v.',
          subgoals: [
            {
              label: 'Scale each one',
              detail: '2u = (4, −2) and 3v = (3, 9).',
            },
            {
              label: 'Add',
              detail: 'First component: 4 + 3 = 7. (The second is −2 + 9 = 7 as well, by accident.)',
            },
            {
              label: 'What the weights mean',
              detail:
                'They are the recipe. Changing them to 2 and −1 reaches somewhere else entirely; ' +
                'the set of everywhere you can reach by varying them is the span.',
            },
          ],
          answer: '7',
        },
      },
      {
        id: 'one-vector-spans-a-line',
        conceptId: 'vectors-and-spans',
        statement:
          'The span of a single non-zero vector is the line through the origin along it. So ' +
          'asking "is w in the span of u" means asking whether w is a multiple of u — and the ' +
          'way to check is whether the components are in the same ratio.',
        position: 2,
        workedExample: {
          problem: 'Is w = (6, −3) in the span of u = (2, −1)? Compare the ratios.',
          subgoals: [
            {
              label: 'Ask what multiple it would have to be',
              detail:
                'The first components force c = 6/2 = 3. If w is a multiple of u at all, it is 3u.',
            },
            {
              label: 'Check the other component agrees',
              detail: '−3/−1 = 3 as well. Subtracting: 3 − 3 = 0.',
            },
            {
              label: 'Read the answer',
              detail:
                'The ratios match, so w = 3u and w IS in the span. A non-zero difference would ' +
                'have meant the two components demanded different multiples, which no single ' +
                'scaling can satisfy.',
            },
          ],
          answer: '0 — the ratios agree, so w = 3u is on the line',
        },
      },
      {
        id: 'two-vectors-usually-span-the-plane',
        conceptId: 'vectors-and-spans',
        statement:
          'Two vectors that do not lie on one line reach every point of the plane: given any ' +
          'target there are weights that build it. Finding them is solving two equations in two ' +
          'unknowns, which is why spanning questions turn into systems.',
        position: 3,
        workedExample: {
          problem:
            'u = (2, −1), v = (1, 3). Show that 3u + 1v reaches (7, 0) by evaluating its second ' +
            'component.',
          subgoals: [
            {
              label: 'Apply the weights to the second components',
              detail: '3·(−1) + 1·3 = −3 + 3 = 0.',
            },
            {
              label: 'And the first, for completeness',
              detail: '3·2 + 1·1 = 7. So 3u + v = (7, 0), as claimed.',
            },
            {
              label: 'What had to be true for weights to exist',
              detail:
                'u and v point in genuinely different directions. Had v been a multiple of u, ' +
                'every combination would have stayed on one line and almost no target would be ' +
                'reachable — which is the next concept.',
            },
          ],
          answer: '0',
        },
      },
    ],
  },

  {
    id: 'linear-independence',
    name: 'Linear independence',
    subjectId: subject.id,
    scope: {
      id: 'linear-independence',
      label: 'Linear independence',
      hint: 'linear independence dependence redundant nontrivial combination',
      match: /\b(linear(ly)? (in)?dependen\w+|redundant|nontrivial combination|spanning set)\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'decide-independence',
        statement:
          'Decide whether two vectors are independent, and say what a dependence costs a ' +
          'description.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'dependent-means-redundant',
        conceptId: 'linear-independence',
        statement:
          'A set is dependent when one of its vectors is already reachable from the others — so ' +
          'it adds nothing. Independence is the condition that every vector in the set is ' +
          'pulling its weight.',
        position: 1,
        workedExample: {
          problem: 'u = (2, −1) and w = (6, −3). Is {u, w} independent? Evaluate w − 3u.',
          subgoals: [
            {
              label: 'Test the obvious candidate',
              detail: 'The first components suggest w might be 3u. 3u = (6, −3).',
            },
            {
              label: 'Subtract',
              detail: 'First component of w − 3u: 6 − 6 = 0. The second gives −3 + 3 = 0 too.',
            },
            {
              label: 'What vanishing proves',
              detail:
                'w − 3u = 0 is a combination of u and w, with weights 1 and −3, that comes out ' +
                'at the origin — and the weights are not both zero. That is a DEPENDENCE. The ' +
                'span of {u, w} is just the line through u, so w was redundant.',
            },
          ],
          answer: '0 — w = 3u, so the set is dependent',
        },
      },
      {
        id: 'the-cross-check',
        conceptId: 'linear-independence',
        statement:
          'For two vectors in the plane the test is a₁b₂ − a₂b₁. Zero means dependent, anything ' +
          'else means independent. This is the determinant of the matrix with them as columns, ' +
          'met properly later — here it is simply the one arithmetic check that settles the ' +
          'question without hunting for weights.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Apply the cross-check to u = (2, −1) and v = (1, 3).',
          subgoals: [
            {
              label: 'Multiply crosswise and subtract',
              detail: '2·3 − (−1)·1 = 6 + 1 = 7.',
            },
            {
              label: 'Read it',
              detail:
                'Not zero, so u and v are independent — neither is a multiple of the other, and ' +
                'together they span the whole plane.',
            },
            {
              label: 'Why it works',
              detail:
                'If v were cu then the expression would be a₁(ca₂) − a₂(ca₁) = 0 identically. ' +
                'The cross-check is exactly a test for "same ratio", written so that no division ' +
                'is needed — which matters, since a zero component would make the ratio ' +
                'undefined.',
            },
            {
              label: 'Where you will meet it again',
              detail:
                'This is the 2×2 determinant. That it is zero precisely when the columns are ' +
                'dependent, and that this means the map collapses the plane onto a line, is the ' +
                'same fact arriving with more machinery.',
            },
          ],
          answer: '7 — non-zero, so independent',
        },
      },
      {
        id: 'dependence-costs-a-dimension',
        conceptId: 'linear-independence',
        statement:
          'A dependent pair spans a line rather than a plane. So dependence is not a technical ' +
          'blemish — it is the difference between a description that can reach everything and ' +
          'one that cannot, and it is why "how many independent vectors" is the useful count ' +
          'rather than "how many vectors".',
        position: 3,
        workedExample: {
          problem:
            'Apply the cross-check to u = (2, −1) and w = (6, −3), and say what the answer costs.',
          subgoals: [
            {
              label: 'Compute',
              detail: '2·(−3) − (−1)·6 = −6 + 6 = 0.',
            },
            {
              label: 'So the pair is dependent',
              detail: 'Which the first point already showed directly: w = 3u.',
            },
            {
              label: 'The cost, stated plainly',
              detail:
                'Two vectors and still only a line. The target (7, 0) is unreachable from {u, w} ' +
                'however the weights are chosen, while {u, v} reached it with weights 3 and 1. ' +
                'Adding more copies of the same direction never helps.',
            },
          ],
          answer: '0 — dependent, so the pair spans a line and not the plane',
        },
      },
    ],
  },
]

/**
 * The edges. A chain, plus the credit that flows back down it.
 *
 * No edge to `determinant`, deliberately — see the header. `the-cross-check`
 * IS a determinant and says so in prose, but an edge would close a cycle
 * through `matrices-and-maps` and cost `teachingOrder` its answer for every
 * subject.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'plane-vectors->vectors-and-spans',
    from: 'plane-vectors',
    to: 'vectors-and-spans',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
  },
  {
    id: 'vectors-and-spans->linear-independence',
    from: 'vectors-and-spans',
    to: 'linear-independence',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
  },

  {
    id: 'vectors-and-spans=>plane-vectors',
    from: 'vectors-and-spans',
    to: 'plane-vectors',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Forming a linear combination scales and adds vectors, so every span task performs the ' +
      'component arithmetic the previous concept is about.',
  },
  {
    id: 'linear-independence=>vectors-and-spans',
    from: 'linear-independence',
    to: 'vectors-and-spans',
    kind: 'encompasses',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Deciding independence is deciding whether one vector lies in the span of the others, so ' +
      'an independence question is a span question with a yes/no answer.',
  },
]

export const VECTORS_AND_INDEPENDENCE: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
