/**
 * A sixth subject: the plane, vectors, spans, and when a description is
 * redundant.
 *
 * ── This one goes UNDERNEATH, so it tightens the gate ─────────────────────
 *
 * The last two subjects were authored above the algebra and gated only
 * mapped-only material. This one sits below `matrices-and-determinants`,
 * which is teachable — `matrices-and-maps` rests on `vectors-and-spans` by a
 * link written when matrices was authored. So making these concepts teachable
 * puts a real gate under a subject people can already practise, exactly as
 * arithmetic did to the algebra.
 *
 * That is correct and it is the design working (gating tightens, never
 * loosens, as material is authored), but it has a consequence worth stating:
 * ANYBODY MID-WAY THROUGH MATRICES IS NOW GATED BEHIND VECTORS THEY HAVE NOT
 * DONE. The claim path is the answer — these are four concepts, claimable in
 * one press from the graph — and the alternative, leaving the foundation
 * unwritten so nobody is inconvenienced, is how a map stays a map for ever.
 *
 * ── THE PLANE ARRIVED LATER, PROMOTED OUT OF THE MAP ──────────────────────
 *
 * `cartesian-plane` was a node of `coordinate-geometry` in atlas-foundations.ts
 * and is now the first concept below. It joined THIS subject rather than
 * becoming a subject of its own, and the reason is worth stating because the
 * alternative was tempting: a one-concept ontology would have been a smaller
 * edit, and it would have put the plane in a syllabus nobody arrives at. The
 * subject it belongs to is the one that reads coordinates off it.
 *
 * Joining here also moved an edge out of the map. `coordinate-geometry.links`
 * carried `cartesian-plane → plane-vectors`, because a `links` entry is for an
 * edge the area does not own both ends of, and before the promotion the
 * authored end was `plane-vectors`. Both ends are now concepts of this
 * ontology, so the edge is declared below as a plain prerequisite and the
 * `links` entry is gone — the one case where promoting a node makes the map
 * simpler rather than stranding something. The two edges INTO the plane went
 * the other way: `real-number-line` is still a map node and `negative-numbers`
 * is authored in a different subject, so neither can be named from here and
 * both had to become `links`. The note in atlas-foundations.ts says so.
 *
 * It tightened the gate one step further down, and this time on material
 * authored in this very file: `plane-vectors` used to gate on
 * `roots-and-irrationals` and `decimal-representation`, because
 * `gatingPrerequisitesOf` looked through the unwritten plane and the unwritten
 * real line to the nearest teachable ancestors. It now gates on the plane
 * itself, which is both nearer and the right answer.
 *
 * No `encompasses` edge from `plane-vectors` back down to it, and that is a
 * judgement rather than an omission. The claim such an edge makes is about what
 * PRACTISING exercises, and measured against the three vector tasks that exist
 * it does not hold: they are handed components as numbers and never locate a
 * point, decide a quadrant, or subtract the coordinates of two points. The
 * same test was applied to `gcd-and-lcm`'s `exercises` claim when arithmetic
 * was authored, and failed there too.
 *
 * ── Why these and not the dot product ─────────────────────────────────────
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
  name: 'The plane, vectors and independence',
  covers:
    'The plane as pairs of numbers, then vectors as displacements across it, linear ' +
    'combinations and span, and the condition that makes a set of them non-redundant. ' +
    'Components throughout — nothing about the dot product or angles, which need trigonometry ' +
    'this build cannot rule, and nothing in three dimensions.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'cartesian-plane',
    name: 'The Cartesian plane',
    subjectId: subject.id,
    scope: {
      id: 'cartesian-plane',
      label: 'The Cartesian plane',
      hint: 'cartesian coordinates axes quadrant ordered pair',
      // Carried over unchanged from the map node. It was written title-shaped
      // and already passes the over-broad check in tests/atlas.mjs, so the
      // promotion is not the moment to start editing it — `/coordinate/i`
      // would claim every coordinate-geometry article on the map.
      match: /\bcartesian coordinate|\bcoordinate system\b/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'read-a-point-from-its-pair',
        statement:
          'Name the point a pair of numbers refers to, say which quadrant it is in from the ' +
          'signs alone, and say why swapping the entries moves it.',
        taskKinds: ['evaluate', 'justify'],
      },
      {
        id: 'measure-with-coordinates',
        statement:
          'Find the horizontal and vertical separation of two points, and say what the sign of ' +
          'a difference records that its size does not.',
        taskKinds: ['evaluate', 'justify'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-point-is-an-ordered-pair',
        conceptId: 'cartesian-plane',
        statement:
          'Two number lines crossing at a shared zero turn a point into a pair of numbers: how ' +
          'far across, then how far up. The pair is ORDERED, so (3, 5) and (5, 3) are different ' +
          'points — and that convention is most of the content of the idea, because it is what ' +
          'makes "the point" and "the numbers" interchangeable.',
        position: 1,
        // No automaticity target. This point is the distinction between a pair
        // and a set, and answering it fast is not the skill.
        workedExample: {
          problem:
            'P = (3, 5) and Q = (5, 3). Show they are different points by evaluating the ' +
            'difference of their first coordinates.',
          subgoals: [
            {
              label: 'Read each pair in the agreed order',
              detail:
                'The first entry is the distance across, the second the distance up. So P is 3 ' +
                'across and 5 up, and Q is 5 across and 3 up.',
              socratic:
                'Both of these points are built from a 3 and a 5. What has to be agreed about ' +
                'those two numbers before either pair refers to anywhere at all?',
            },
            {
              label: 'Compare one coordinate',
              detail: 'The first coordinates are 3 and 5, and 3 − 5 = −2.',
              socratic:
                'There are four numbers in front of you and two points to tell apart. Which ' +
                'single comparison is already enough to decide it, and what does that ' +
                'comparison come to?',
            },
            {
              label: 'What one disagreement proves',
              detail:
                'Two points are equal only when BOTH coordinates agree, so one disagreement ' +
                'settles it: −2 ≠ 0, so P ≠ Q. P sits left of Q and higher up — the swap moved ' +
                'the point rather than renaming it.',
              socratic:
                'Your difference is not zero, and you have not looked at the second ' +
                'coordinates yet. How much of the comparison is still outstanding, and why?',
            },
          ],
          answer: '−2 — non-zero, so P and Q are different points',
        },
      },
      {
        id: 'the-signs-name-the-quadrant',
        conceptId: 'cartesian-plane',
        statement:
          'The axes cut the plane into four quadrants, and which one a point is in is decided by ' +
          'the signs of its coordinates and nothing else. This is the first time a question ' +
          'about where something IS gets answered by looking at an expression instead of at a ' +
          'picture.',
        position: 2,
        automaticityTarget: 15_000,
        workedExample: {
          problem: 'Which quadrant is P = (−4, 7) in? Start from the product of its coordinates.',
          subgoals: [
            {
              label: 'Multiply the coordinates to compare their signs',
              detail:
                '(−4)(7) = −28. A negative product means the two coordinates have opposite ' +
                'signs; a positive one would mean they agree.',
              socratic:
                'You want to know whether these two coordinates agree in sign. Which single ' +
                'operation on the pair answers that without telling you anything about their ' +
                'sizes, and what sign does it return here?',
            },
            {
              label: 'Opposite signs leaves two quadrants, not one',
              detail:
                'Opposite signs rule out quadrant I, which is (+, +), and quadrant III, which ' +
                'is (−, −). That leaves II at (−, +) and IV at (+, −). The product has halved ' +
                'the question and cannot finish it.',
              socratic:
                'The product says the signs differ. Of the four quadrants, how many are still ' +
                'possible — and what is it about a single product that stops it narrowing ' +
                'things any further?',
            },
            {
              label: 'Either coordinate alone decides between the two',
              detail:
                'The second coordinate is 7, which is positive, so P is above the horizontal ' +
                'axis: quadrant II. The first coordinate settles it the same way, being −4 and ' +
                'so left of the vertical axis.',
              socratic:
                'Quadrants II and IV sit on opposite sides of the horizontal axis. Which of ' +
                "P's two numbers tells you which side it is on, and what does it say?",
            },
            {
              label: 'Why nothing was plotted',
              detail:
                'The region was decided by the signs of a pair of numbers. That is the trade ' +
                'the plane offers in both directions — a geometric question becomes an ' +
                'arithmetic one, and the arithmetic does not care how large the numbers are.',
              socratic:
                'You named the region without drawing anything. What did you read instead — and ' +
                'what does that let you do with a point whose coordinates are far too large to ' +
                'fit on a page?',
            },
          ],
          answer: 'Quadrant II — the product −28 shows the signs differ, and the positive second coordinate picks II over IV',
        },
      },
      {
        id: 'separation-is-one-axis-at-a-time',
        conceptId: 'cartesian-plane',
        statement:
          'The horizontal gap between two points is the difference of their first coordinates, ' +
          'and the vertical gap is the difference of their seconds. The two axes never interfere, ' +
          'which is why a position in the plane can be handled as two independent numbers — and ' +
          'it is the same bookkeeping the next concept calls components.',
        position: 3,
        automaticityTarget: 15_000,
        workedExample: {
          problem:
            'P = (−4, 7) and Q = (2, 7). Find the horizontal separation of P and Q by evaluating ' +
            'the difference of the first coordinates.',
          subgoals: [
            {
              label: 'Subtract the first coordinates',
              detail: '2 − (−4) = 2 + 4 = 6, so the horizontal separation is 6.',
              socratic:
                'The two points sit at −4 and at 2 along the horizontal axis, so the gap ' +
                'between them crosses zero. What does subtracting a negative do to the ' +
                'arithmetic, and what gap does it leave you with?',
            },
            {
              label: 'Do the other axis separately',
              detail: '7 − 7 = 0. There is no vertical gap at all — both points are the same height.',
              socratic:
                'Now the second coordinates, which are both 7. What does their difference come ' +
                'to, and what does that tell you about how the two points sit relative to the ' +
                'horizontal axis?',
            },
            {
              label: 'Read the two numbers together',
              detail:
                'Six across and nothing up: P and Q lie on one horizontal line, 6 apart. The ' +
                'distance between the points is 6 only BECAUSE the vertical gap vanished; with ' +
                'both gaps non-zero the two numbers would not combine by addition, which is ' +
                'what the next concept needs Pythagoras for.',
              socratic:
                'You have two gaps now, one across and one up. What is the distance between the ' +
                'points themselves, and what would have gone wrong with reading it off a single ' +
                'one of those numbers if the vertical gap had come to 3 instead of 0?',
            },
            {
              label: 'The order of subtraction is a sign, not a mistake',
              detail:
                '−4 − 2 = −6 rather than 6. The size is the separation either way; the sign ' +
                'records which direction you travelled. Keeping it is what turns a gap into a ' +
                'displacement, and a displacement is exactly what the next concept calls a ' +
                'component.',
              socratic:
                'Subtracting the other way round gives −6, and both answers describe the same ' +
                'pair of points. What is the minus sign carrying that a bare distance does not?',
            },
          ],
          answer: '6',
        },
      },
    ],
  },

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
              socratic:
                'Sketch the trip — three across, then four up — and then the arrow straight ' +
                'from where you started to where you finished. What figure have those three ' +
                'segments made, and which one of them is v?',
            },
            {
              label: 'Pythagoras',
              detail: '|v| = (3² + 4²)^(1/2) = (9 + 16)^(1/2) = 25^(1/2) = 5.',
              socratic:
                'Two sides of that triangle are 3 and 4, and the one you want is the ' +
                'hypotenuse. What relation between the three sides gets you from the two you ' +
                'have to the one you want, and what length does it give?',
            },
            {
              label: 'What the number is about',
              detail:
                'It is the length of the arrow, not a location. The vector from (0,0) to (3,4) ' +
                'and the one from (7,1) to (10,5) are the SAME vector — same displacement — ' +
                'while the points at their tips are nothing alike.',
              socratic:
                'The arrow from (0,0) to (3,4) and the arrow from (7,1) to (10,5) describe the ' +
                'same three-across-four-up trip, but their tips are nowhere near each other. ' +
                'Which of those two things is the 5 a measurement of?',
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
 *
 * The first edge below used to live in `coordinate-geometry.links`, because
 * `cartesian-plane` was a map node and only one end was authored. Promoting
 * the plane into this subject put both ends here, so the edge is declared on
 * the concept that depends on it like any other — and the `links` entry was
 * removed rather than left in place, since two identical edges in the composed
 * graph is not a redundancy the loader would notice. Its rationale came with
 * it; it is the reason the plane is the first concept and not an aside.
 */
const EDGES: ConceptEdge[] = [
  {
    id: 'cartesian-plane->plane-vectors',
    from: 'cartesian-plane',
    to: 'plane-vectors',
    kind: 'prerequisite',
    promotedBy: 'author:vectors-and-independence',
    rationale:
      'Components are coordinates read as a displacement, so the plane and its axes have to ' +
      'mean something before a vector can be written as a pair.',
  },
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
