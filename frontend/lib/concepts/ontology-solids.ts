/**
 * A tenth subject ontology: the measure of a solid, and nothing about its
 * incidence structure.
 *
 * ── Why this concept, and why it was the only one left that moves anything ──
 *
 * `solid-geometry` was a map node in `euclidean-geometry`, and it was the only
 * remaining promotion on either unfinished journey that UNBLOCKS something.
 * Eight of the ten shipped journeys have no unwritten step left; the two that
 * do — "See what a matrix does to space" and "When can a linear map be
 * undone?" — both cross `three-dimensional-coordinates`, and after the eleventh
 * promotion wrote the dot product this node was the single remaining half of
 * that node's gate:
 *
 *     circle-measure -> solid-geometry      -> three-dimensional-coordinates
 *                       dot-product-geometry ->
 *
 * The three other candidates were `linear-equations`,
 * `systems-of-linear-equations` and `gaussian-elimination`, and they are
 * blocked on a missing task kind rather than on effort, for the reason
 * ontology-algebra.ts's header gives: "solve for x" asks for a solution SET,
 * and no `NamedForm` and no `evaluate` target expresses one. That is a decision
 * about what counts as evidence and it belongs to a person, not to an authoring
 * pass.
 *
 * ALL THREE OF THOSE ARE AUTHORED NOW, in `expressions-and-equations`, and the
 * sentence above is the one to distrust rather than the choice it justified:
 * `evaluate` cannot take a set as an ANSWER and rules the number that DECIDES
 * one perfectly, so none of the three ever needed a new task kind. Left as
 * written because it records what this promotion was chosen on. See
 * ontology-algebra.ts's header for the pattern and how to recognise it next
 * time.
 *
 * So the readiness test that chose the eleven promotions before this one
 * — all prerequisites written, and preferably something waiting above — again
 * had exactly one answer. This node's only prerequisite, `circle-measure`, is
 * an authored concept of `plane-geometry`.
 *
 * `euclidean-geometry` was twelve nodes against a stub floor of five, so the
 * floor that dominated the earlier promotions decided nothing here either. It
 * stopped being the constraint on these routes at the merge.
 *
 * ── WHY A TENTH SUBJECT RATHER THAN A CONCEPT OF AN EXISTING ONE ───────────
 *
 * The test ontology-arithmetic.ts, ontology-algebra.ts and
 * ontology-trigonometry.ts each applied, run against every subject that now
 * exists. `plane-geometry` is not a near miss that needed arguing about: its id
 * is the refusal, and its `covers` closed with the sentence "The solids are the
 * rest and are still mapped only" — a boundary drawn by the subject itself,
 * naming this exact material as outside it. A prism is not a figure in the
 * plane, and the one move this concept is about is the move OUT of the plane.
 *
 *  - `triangle-trigonometry` is about a quotient of two lengths being a
 *    function of an angle. Nothing here is a quotient of two lengths, and no
 *    angle is named anywhere in the file.
 *  - `arithmetic-foundations` says "nothing symbolic", and every formula here
 *    is a relation between named lengths.
 *  - `expressions-and-equations` is about what a letter standing for a number
 *    means. The letters here stand for lengths, as they do in every subject
 *    above it; filing this there would make that subject mean nothing.
 *  - `rational-expressions` starts at polynomial arithmetic, and
 *    `polynomial-arithmetic` is the ROOT of its own view. Filing this below it
 *    would gate that root behind a cone.
 *  - `vectors-and-independence` is where `dot-product-geometry` went, and it is
 *    the near miss on POSITION rather than on content — it is the other half of
 *    `three-dimensional-coordinates`'s gate, so the two concepts are siblings
 *    in the map. But that subject is about a pair of numbers being one object
 *    and about when a set of them is redundant. A volume is not a vector
 *    operation, and the eleventh promotion's own argument for widening that
 *    subject's `covers` was that the dot product IS one.
 *  - `functions-and-inverses` and `matrices-and-determinants` are above this
 *    concept, not beside it.
 *
 * So the layer gets its own subject and joins the rest through the area's
 * `links` — the pattern ontology-arithmetic.ts established and the ninth
 * subject repeated. Each subject keeps a standalone view that is a valid,
 * walkable ontology, and the gates between subjects exist only in the composed
 * map.
 *
 * ── THE SUBJECT IS NAMED FOR THE MEASURE, AND NOT `solid-geometry` ─────────
 *
 * `solid-measure`, which is a refusal twice over.
 *
 * Not `solid-geometry`, which is the id of the one concept this subject
 * contains. That looks harmless and is not: `areaOf` returns a SUBJECT id for
 * an authored concept and an AREA id for a map node, so the concept would
 * report itself as its own area, and `getOntology('solid-geometry')` and
 * `conceptById(M, 'solid-geometry')` would answer about two different things
 * behind one string. The ninth subject recorded the area-id version of this
 * hazard and added the assertion for it; the concept-id version had never come
 * up, because no earlier subject shipped with its own name on a concept. There
 * is now an assertion for that half too.
 *
 * Not `euclidean-geometry` either, for the reason that assertion exists.
 *
 * And `measure` rather than `geometry` because the measure is what is written.
 * A solid has an incidence structure — faces meeting at dihedral angles, nets,
 * Euler's formula on the vertices, the five regular polyhedra — and none of it
 * is here. Naming the subject for the whole of solid geometry would have made
 * the `covers` sentence a promise about material nobody has written, which is
 * the mistake the ninth subject refused when it declined to call itself
 * `trigonometry`.
 *
 * ROOM TO GROW IS THE THINNEST OF ANY SUBJECT IN THE BUILD, and that is said
 * here rather than left for somebody to discover. The ninth subject could
 * point at `law-of-sines-cosines` as a reachable second member; this one has no
 * second member reachable today. What WOULD join is a judgement a later author
 * has to make rather than a gap to fill:
 *
 *   `three-dimensional-coordinates` sits directly above this concept and is
 *   reachable the moment this ships. It is analytic — coordinates, lines and
 *   planes in space, and the cross product — so it is a better fit for
 *   `vectors-and-independence`, which already owns the plane and the dot
 *   product. If a later author decides the boundary here is three-dimensional
 *   SPACE rather than the measure of a solid, this subject is where it goes and
 *   the `covers` below has to be rewritten rather than extended.
 *
 *   `volumes-of-revolution` and `arc-length-surface-area` are the natural
 *   continuations of the measure itself, and both are in the calculus areas
 *   behind `area-between-curves`. They want a calculus subject, which does not
 *   exist.
 *
 * One concept is not a reason to hesitate — `expressions-and-equations` has
 * shipped with exactly one since it was written, and a subject is a boundary
 * rather than a volume — but a subject with nowhere to grow would be, so the
 * honest statement is that this one's growth depends on a decision rather than
 * on effort.
 *
 * ── WHAT IS PROVED HERE, AND WHAT IS BORROWED ─────────────────────────────
 *
 * ontology-geometry.ts has overturned its own "needs a drawing" refusals seven
 * times, and the figure test took only HALF of `circle-measure` — the half that
 * says why π is forced, with πr² used and not derived. This concept is the
 * other shape again: one of its three central facts is provable in sentences,
 * and the rest are borrowed and named.
 *
 *   PROVED: the factor of a third, for the square pyramid, by dissecting a
 *   cube. Take the cube [0, s]³ and one of its vertices, and join that vertex
 *   to each of the three faces not containing it. A point of the cube lies in
 *   the pyramid over the face its LARGEST coordinate faces, so the three
 *   pyramids fill the cube and meet only where two coordinates are equal; and
 *   permuting the coordinates carries any one of them onto any other, so they
 *   are congruent. Each therefore has a third of s³, and each has base s² and
 *   height s, so (1/3) × base × height is exact for them. That is an argument
 *   about which of three numbers is biggest. It needs no figure, and it is why
 *   the third is a fact rather than a formula to accept.
 *
 *   PROVED: the exponents. A volume is three lengths multiplied, so scaling by
 *   k multiplies it by k³ where an area takes k² and a length takes k. This is
 *   `circle-measure`'s third point with the third dimension's factor added, and
 *   it is the one part of the concept that follows from counting rather than
 *   from any solid in particular.
 *
 *   BORROWED, and named in the `covers` rather than glossed: Cavalieri's
 *   principle, which is what carries the third from those three pyramids to
 *   every pyramid and to the cone. It says two solids of equal height whose
 *   cross-sections have equal area at every level have equal volume, and it is
 *   a claim about a sequence of slices — the same shape as the inscribed
 *   polygons `circle-measure` left on the map, and absent for the same reason.
 *
 *   BORROWED: the sphere's surface area, 4πr². The four is Archimedes' and the
 *   proof compares the sphere with a cylinder slice by slice. What is NOT
 *   borrowed is the volume: V = (1/3) × S × r ties the two, because a ball is a
 *   union of thin cones with their apexes at the centre and their heights equal
 *   to the radius, so the third proved above applies with the surface as the
 *   base. So the sphere costs exactly ONE borrowed fact rather than two, and
 *   the third point below checks the two formulas against each other instead of
 *   presenting them as a pair to memorise.
 *
 * ── WHY EVERY TASK IS EXACT, AND THE π WALL THAT SHAPED THEM ──────────────
 *
 * Six `evaluate` and one `transform_to_form`, every one settled by exact
 * arithmetic with no worker, like the four subjects before it.
 *
 * `circle-measure` is upstream of this concept and so is its constraint. `pi`
 * is a real constant of the expression language but `exactValue` returns null
 * on it, deliberately, so a task whose reference is a multiple of π cannot be
 * ruled locally at all. Every task here that reaches a circular cross-section
 * therefore asks for the MULTIPLE of π and says so in the prompt, which is the
 * shape `circle-measure` settled and the reason its header is worth reading
 * before touching this one.
 *
 * What that costs is the same cost and is named the same way: no task here
 * scores the step from `288` to `288π cm³`. It is in the worked examples and in
 * none of the rulings.
 *
 * EVERY OBJECTIVE NAMES ONLY KINDS THAT SHIP, which is a departure from
 * `plane-geometry` and is deliberate. Twenty-eight of its objectives name
 * `justify`, and NO `justify` task exists anywhere in this build — so those
 * objectives name an observation that cannot be made. That is types.ts's rule
 * about an objective naming no kind, one level down: naming a kind nothing
 * ships leaves the objective looking evidenced while nothing can reach it. The
 * cube dissection is the best `justify` question in the file and is not an
 * objective here for that reason; it is the third subgoal of the second point,
 * where the tutor asks it and nothing pretends to rule it.
 *
 * THE FIGURES STATE LENGTHS AND NEVER ANGLES. A right triangle cannot have
 * three whole-number sides AND whole-number acute angles, the figure would not
 * exist, and nothing in this build would catch it — the ninth subject's header
 * records the constraint. Here it is cheap to obey, because a solid's measure
 * never needs an angle: the 8-15-17 cross-section, the 9-12-15 slant height and
 * the 4-6 cone are all described by their lengths, and no prompt or worked
 * example states a degree measure anywhere.
 */

import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

const subject: Subject = {
  id: 'solid-measure',
  name: 'Solids and their measure',
  covers:
    'The measure of a solid, built out of plane measure by two moves and one borrowed principle. ' +
    'A RIGHT solid with the same cross-section all the way along is the first move: its volume ' +
    'is the ' +
    'cross-section\'s AREA carried through the length, and its side is the cross-section\'s ' +
    'PERIMETER carried through the same length — so one prism needs both of the two plane ' +
    'measures `area-and-perimeter` showed determine each other in neither direction, and which ' +
    'of the two a question wants is decided by whether the answer is a volume or a surface ' +
    'rather than by which number is to hand. A cylinder is that same move with a circular ' +
    'cross-section, so its two measures are exact multiples of π and are left that way. The ' +
    'tapering solids are the second move: a pyramid or a cone on the same base and of the same ' +
    'height has exactly a THIRD of the volume, and the third is proved here rather than ' +
    'asserted — a cube splits into three congruent square pyramids, each with one face as its ' +
    'base and the opposite vertex as its apex, because a point of the cube belongs to the ' +
    'pyramid over the face its largest coordinate faces and permuting the coordinates carries ' +
    'any one of the three onto any other. The third is a claim about VOLUME and about nothing ' +
    'else: a pyramid\'s surface is not a third of the prism\'s, because the slanted faces rise ' +
    'along the slant height and not along the height, and that length is a separate Pythagoras ' +
    'on the height and half the base edge — normally irrational and left as a reduced surd. Then ' +
    'the third dimension\'s effect on scaling: a length takes a scale factor once, an area twice ' +
    'and a volume three times, so trebling a radius multiplies a surface by nine and a volume by ' +
    'twenty-seven, which is `circle-measure`\'s two exponents with the third added and is the one ' +
    'fact here that follows from counting rather than from any solid. And the sphere, as the one ' +
    'solid neither move reaches: its surface area 4πr² is taken as given, Archimedes\' comparison ' +
    'with a cylinder being a claim about matching slices, but its volume is NOT a second ' +
    'borrowing — V = (1/3) × S × r, because a ball is a union of thin cones with their apexes at ' +
    'the centre and their heights equal to the radius, so the third proved above does the work ' +
    'and the two formulas can be checked against each other. Cavalieri\'s principle is the ' +
    'borrowed part of the second move and is named rather than hidden: it is what carries the ' +
    'third from the cube\'s three pyramids to every pyramid and to the cone, and it is a claim ' +
    'about a sequence of slices with no figure-free part to take, exactly like the inscribed ' +
    'polygons behind πr². A solid\'s incidence structure is absent and is a different subject: ' +
    'dihedral angles, nets, Euler\'s formula on the vertices and the five regular polyhedra are ' +
    'all still mapped only, which is why this subject is named for the measure. The OBLIQUE ' +
    'prism is absent and is named rather than quietly excluded: leaning a prism over leaves the ' +
    'volume alone and breaks the perimeter half of the first move, since the side becomes ' +
    'parallelograms rising along an edge longer than the height, so everything here is square to ' +
    'its cross-section and says so. Coordinates in ' +
    'space are absent too — they are `three-dimensional-coordinates`, which rests on this ' +
    'concept and on the dot product, and are analytic where everything here is synthetic.',
  medium: 'theorem',
  facetName: 'Concept',
  facetDoes: 'Which concept the statement has to be about.',
}

const CONCEPTS: Concept[] = [
  {
    id: 'solid-geometry',
    name: 'Solids, volume and surface area',
    subjectId: subject.id,
    scope: {
      id: 'solid-geometry',
      label: 'Solids, volume and surface area',
      hint: 'volume surface area prism pyramid cylinder cone sphere',
      /*
       * Carried verbatim from the map node this concept was promoted out of,
       * for the reason ontology-algebra.ts gives and the eight anchored
       * patterns before it kept: the pattern decides against an article title,
       * and widening it during an authoring pass would move the recognition
       * figure in tests/atlas.mjs at the same time as the material appeared,
       * leaving no way to say which edit moved it.
       *
       * Its gap is the same shape as `circle-measure`'s and is worth naming for
       * the same reason. The `^` anchor takes "Solid geometry", "Polyhedron",
       * "Sphere", "Cylinder" and "Cone (geometry)" — and it does not take
       * "Volume", "Surface area", "Prism (geometry)" or "Pyramid (geometry)",
       * which are the titles of four of the things taught below. The
       * disambiguator on the cone branch is what keeps it off the traffic cone
       * and the ice cream. So the pattern selects precisely and recalls badly,
       * and `fidelity` is still `checked`: what `checked` claims is that the
       * pattern really decides membership for what it matches, not that it
       * matches everything the concept covers.
       */
      match: /^(solid geometry|polyhedron|sphere|cylinder|cone \(geometry\))/i,
    },
    fidelity: 'checked',
    objectives: [
      {
        id: 'carry-a-plane-measure-along-a-length-and-read-the-right-one',
        statement:
          'Given a solid with a constant cross-section, produce its volume from the '
          + 'cross-section\'s AREA and the area of its side from the cross-section\'s PERIMETER, '
          + 'choosing between the two plane measures by whether the answer wanted is a volume or '
          + 'a surface. Do it for a circular cross-section as well, leaving both answers as exact '
          + 'multiples of π.',
        taskKinds: ['evaluate'],
      },
      {
        id: 'take-the-third-on-the-volume-and-refuse-it-on-the-surface',
        statement:
          'Given a pyramid or a cone and the prism or cylinder on the same base with the same '
          + 'height, produce the tapering solid\'s volume as a third of the other\'s, and produce '
          + 'its slanted surface WITHOUT taking a third of anything — which means producing the '
          + 'slant height first, as a reduced surd when it is irrational.',
        taskKinds: ['evaluate', 'transform_to_form'],
      },
      {
        id: 'put-the-scale-factor-on-the-exponent-the-measure-carries',
        statement:
          'Given a scale factor between two similar solids, produce the factor by which a length, '
          + 'an area and a volume each grow, and say why the three exponents are 1, 2 and 3 rather '
          + 'than all the same. Recover a sphere\'s volume from its surface area and its radius, '
          + 'and say which of the two formulas was borrowed and which followed.',
        taskKinds: ['evaluate'],
      },
    ],
    knowledgePoints: [
      {
        id: 'a-constant-cross-section-carries-its-area-along-and-its-perimeter-round',
        conceptId: 'solid-geometry',
        statement:
          'A solid with the same cross-section all the way along, standing square to it — a '
          + 'RIGHT prism, or a cylinder — has '
          + 'volume equal to the cross-section\'s AREA times the length. The plane work is already '
          + 'done and the third dimension contributes one multiplication. Its SURFACE is not that '
          + 'same number again: the side is the cross-section\'s PERIMETER times the length, and '
          + 'the two ends are two more copies of the cross-section. So one solid needs both of '
          + 'the plane measures `area-and-perimeter` showed do not determine each other, and '
          + 'which one a question wants is settled by whether the answer is a volume or a '
          + 'surface, never by which number is easier to reach. A cylinder is the identical move '
          + 'with a circular cross-section, so both of its measures come out as exact multiples '
          + 'of π and are left that way. Square to the cross-section is an assumption and not a '
          + 'detail: lean the prism over and the volume is unchanged, but the side becomes '
          + 'parallelograms rising along a longer edge than the height, so the perimeter rule is '
          + 'the half of this that the lean breaks.',
        position: 1,
        /*
         * No `automaticityTarget`. Both answers are one multiplication after
         * the plane measure, so this would time beautifully, which is the trap
         * `circle-measure`'s first point names: the content is WHICH plane
         * measure the question wants, and a speed reward trains multiplying
         * whichever number was printed by the length. That is the error the
         * point exists to stop.
         */
        workedExample: {
          problem:
            'A prism is 11 cm long and its cross-section is a right triangle with legs of 8 cm '
            + 'and 15 cm. Find its volume, and find its total surface area. Then do the same for '
            + 'a cylinder of radius 7 cm and length 11 cm, leaving those two answers as exact '
            + 'multiples of π.',
          subgoals: [
            {
              label: 'Measure the cross-section in the plane first, both ways, before leaving it',
              detail:
                'The cross-section is a right triangle, so its area is half the product of the '
                + 'legs: ½ × 8 × 15 = 60 cm². Its perimeter needs the third side, which '
                + 'Pythagoras supplies — 8² + 15² = 64 + 225 = 289, and 289 = 17² — so the '
                + 'perimeter is 8 + 15 + 17 = 40 cm. Two numbers, 60 and 40, and neither can be '
                + 'got from the other: that is `area-and-perimeter`\'s claim, and this solid is '
                + 'about to need both of them.',
              socratic:
                'You are going to leave the plane in a moment. While you are still in it, how '
                + 'many different measurements of this triangle can you take — and do you know '
                + 'yet which one the question wants?',
            },
            {
              label: 'Carry the AREA along the length to get the volume',
              detail:
                'Volume = 60 × 11 = 660 cm³. The picture is a stack: every slice across the prism '
                + 'is that same 60 cm² triangle, and there are 11 cm of them, so the length '
                + 'multiplies the area once. The units say the same thing — cm² times cm is cm³ — '
                + 'which is the check that an area and not a perimeter went into it.',
              socratic:
                'Every slice across this prism is the same triangle. What is the one number you '
                + 'have to multiply by to turn one slice into the whole solid?',
            },
            {
              label: 'Carry the PERIMETER along the same length to get the side',
              detail:
                'The side of the prism is the three rectangles running its length, and their '
                + 'widths are the three sides of the triangle: 40 × 11 = 440 cm². Unroll it and it '
                + 'is one rectangle 40 cm by 11 cm. The length is the same 11 that produced the '
                + 'volume, and the only thing that changed is which plane measure it multiplied — '
                + 'so answering 660 here is not an arithmetic slip, it is a volume offered where '
                + 'an area was asked for, and the units are the only thing that says so.',
              socratic:
                'The side of the prism unrolls into one flat rectangle. One of its two sides is '
                + 'the 11 cm length — what is the other, and is it a measurement you have already '
                + 'taken?',
            },
            {
              label: 'Close the solid, which the side does not do',
              detail:
                'The two triangular ends are not part of the side, so the total surface is '
                + '440 + 2 × 60 = 560 cm². This is the same shape of omission as the sector\'s '
                + 'perimeter in `circle-measure`: the rule covers the part that runs along the '
                + 'length, and the caps have to be added by hand because nothing about the length '
                + 'produced them. Stopping at 440 silently leaves the prism open at both ends.',
              socratic:
                'Walk a fly over the whole outside of this prism. Which parts of its journey did '
                + 'the unrolled rectangle already count, and which parts did it never touch?',
            },
            {
              label: 'Run the identical two moves on a circular cross-section',
              detail:
                'The cross-section is a circle of radius 7, so its area is 49π cm² and its '
                + 'perimeter is its circumference, 14π cm. Nothing about the moves changes: the '
                + 'volume is 49π × 11 = 539π cm³ and the side is 14π × 11 = 154π cm², so the total '
                + 'surface is 154π + 2 × 49π = 252π cm². Both answers are left as multiples of π '
                + 'because π is irrational — 1693.3 cm³ is a rounding of 539π cm³ rather than the '
                + 'volume — and keeping them exact is what lets one be divided back into another '
                + 'with nothing lost.',
              socratic:
                'Swap the triangle for a circle of radius 7 and nothing about the two moves '
                + 'changes. What are this cross-section\'s area and perimeter — and which of them '
                + 'is the one you call a circumference?',
            },
          ],
          answer:
            'The prism is 660 cm³ with a total surface of 560 cm², and the cylinder is 539π cm³ '
            + 'with a total surface of 252π cm². The cross-section is measured twice before '
            + 'leaving the plane: area 60 cm² and perimeter 40 cm for the triangle, 49π cm² and '
            + '14π cm for the circle. The AREA times the length is the volume — 60 × 11 and '
            + '49π × 11 — and the PERIMETER times the same length is the side — 40 × 11 and '
            + '14π × 11 — so the two ends have to be added on top: 440 + 120 = 560 and '
            + '154π + 98π = 252π. One length, two plane measures, and which of them a question '
            + 'wants is decided by whether a volume or a surface was asked for.',
        },
      },
      {
        id: 'the-tapering-solid-takes-a-third-of-the-volume-and-none-of-the-surface',
        conceptId: 'solid-geometry',
        statement:
          'A pyramid or a cone on the same base as a prism or cylinder, and of the same height, '
          + 'has exactly a THIRD of its volume. The third is not an approximation and is not a '
          + 'guess from how the shape narrows: a cube splits into three congruent square '
          + 'pyramids, each with one face of the cube as its base and the opposite vertex as its '
          + 'apex, so each has a third of the cube — and each has base s² and height s, which '
          + 'makes (1/3) × base × height exact for them. It is a claim about VOLUME and about '
          + 'nothing else. A pyramid\'s surface is not a third of the prism\'s, because its '
          + 'slanted faces rise along the SLANT HEIGHT and not along the height, and that is a '
          + 'different length: it is Pythagoras on the height and half the base edge, and it is '
          + 'normally irrational. Taking a third of a surface is the error this point exists to '
          + 'stop, and it never announces itself, because a third of the right number is still a '
          + 'number.',
        position: 2,
        /*
         * No `automaticityTarget`, and this is the point where one would be
         * least defensible. Dividing by 3 is the whole arithmetic, and the
         * error the point exists to stop — taking the third where it does not
         * apply — is a learner who divided FAST and once. A speed target would
         * reward exactly the reflex being corrected, which is the argument
         * `circle-measure`'s third point makes about squaring.
         */
        workedExample: {
          problem:
            'A square-based pyramid has base edges of 18 cm and a height of 12 cm. Find its '
            + 'volume, and find the volume of the prism on the same base with the same height. '
            + 'Then find the area of the pyramid\'s four slanted faces, and say why that one is '
            + 'not a third of the prism\'s side.',
          subgoals: [
            {
              label: 'Build the solid the third is a fraction OF, before taking any fraction',
              detail:
                'The base is an 18 cm square, so its area is 324 cm², and the prism on it with '
                + 'height 12 cm has volume 324 × 12 = 3888 cm³ by the first point\'s move. That is '
                + 'the whole the third is taken of. Computing the pyramid directly from '
                + '(1/3) × 324 × 12 reaches the same 1296 and hides what the 1/3 is a fraction of, '
                + 'which is the thing worth seeing here.',
              socratic:
                'Before you divide anything by three — three of what? Which solid is the pyramid '
                + 'going to turn out to be a third of, and what is its volume?',
            },
            {
              label: 'Take the third of the VOLUME, not of a length',
              detail:
                '3888 ÷ 3 = 1296 cm³. The third lands on the volume as a whole, so no length in '
                + 'the problem is divided by anything: the base edge is still 18 and the height is '
                + 'still 12. Dividing the height by 3 and then multiplying always gives the same '
                + 'number — (1/3) × B × h and B × (h/3) are one product — so the arithmetic will '
                + 'never catch the difference. The difference is in what is being claimed: a '
                + 'pyramid is not a prism of a third the height, and that prism is a different '
                + 'solid which merely happens to hold the same volume.',
              socratic:
                'The pyramid has a third of the prism\'s volume. Is there anything in the pyramid '
                + 'that is a third of the prism\'s — its height, its base, its edges?',
            },
            {
              label: 'Dissect a cube to see where the third comes from',
              detail:
                'Take a cube of edge s and one of its vertices, and join that vertex to each of '
                + 'the three faces that do not contain it. Every point of the cube belongs to the '
                + 'pyramid over the face its LARGEST coordinate faces, so the three pyramids fill '
                + 'the cube and overlap only where two coordinates are equal; and swapping two '
                + 'coordinates carries any one of them onto any other, so the three are '
                + 'congruent. Three congruent pieces filling s³ is s³/3 each — and each piece has '
                + 'base s² and height s, so (1/3) × base × height comes out exactly. The third is '
                + 'therefore a consequence of which of three numbers is biggest, not a measured '
                + 'constant.',
              socratic:
                'Three congruent pyramids fill a cube exactly. You do not need to compute any of '
                + 'them — what does that fact alone already tell you about how much of the cube '
                + 'one of them holds?',
            },
            {
              label: 'Find the slant height, which is the length the surface needs and the volume did not',
              detail:
                'Each slanted face is a triangle with base 18 cm, and its height within that face '
                + 'runs from the apex down to the midpoint of a base edge — the SLANT height, not '
                + 'the pyramid\'s height. It is a right triangle on the height 12 and half the '
                + 'base edge 9, so the slant height is √(12² + 9²) = √225 = 15 cm. That 15 appears '
                + 'nowhere in the volume, which used only 18 and 12, and this is where a fifth '
                + 'length entering the problem is the signal that the surface is a separate '
                + 'calculation rather than a fraction of one already done.',
              socratic:
                'The slanted faces are triangles. Their height is measured up the face itself, '
                + 'not up the middle of the pyramid — which right triangle do you already have '
                + 'that has that length as its hypotenuse?',
            },
            {
              label: 'Compute the slanted surface and refuse the third',
              detail:
                'Four triangles, each ½ × 18 × 15 = 135 cm², so the slanted surface is 540 cm². '
                + 'The prism\'s side is its base perimeter times its height, 72 × 12 = 864 cm², '
                + 'and a third of that is 288 — nowhere near 540. So the third is a claim about '
                + 'volume only. The reason is the length that just appeared: the prism\'s side '
                + 'rises along the height 12 and the pyramid\'s faces rise along the slant 15, and '
                + 'no single fraction can relate two surfaces built on different lengths.',
              socratic:
                'A third of the prism\'s side is 288 cm² and your four triangles total 540 cm². '
                + 'The arithmetic in both is right — so which of the two surfaces is built on a '
                + 'length the other one never used?',
            },
          ],
          answer:
            'The pyramid is 1296 cm³, the prism on the same base is 3888 cm³, and the pyramid\'s '
            + 'four slanted faces total 540 cm². The base is 324 cm², so the prism is '
            + '324 × 12 = 3888 cm³ and the pyramid is exactly a third of it. The third is '
            + 'provable: a cube of edge s splits into three congruent square pyramids, each with '
            + 'base s² and height s, so each holds s³/3 and (1/3) × base × height is exact. The '
            + 'surface takes no third. The slanted faces rise along the slant height '
            + '√(12² + 9²) = 15 cm, so they total 4 × ½ × 18 × 15 = 540 cm², where a third of the '
            + 'prism\'s 864 cm² side would have been 288 — two surfaces built on two different '
            + 'lengths, which no one fraction relates.',
        },
      },
      {
        id: 'the-third-dimension-adds-a-third-exponent-and-ties-the-sphere-s-measures',
        conceptId: 'solid-geometry',
        statement:
          'Scaling a solid by a factor k multiplies every length by k, every area by k² and '
          + 'every volume by k³, because a volume is three lengths multiplied where an area is '
          + 'two. `circle-measure` established the first two exponents in the plane; the third '
          + 'dimension supplies the third, so trebling a radius multiplies a surface by nine and '
          + 'a volume by twenty-seven, and "k times as wide, k times as big" is now wrong by a '
          + 'factor of k² rather than of k. The sphere is the one solid neither of the two moves '
          + 'reaches, and it costs exactly ONE borrowed fact rather than two: S = 4πr² is taken '
          + 'as given, but V = (1/3) × S × r follows from it, because a ball is a union of thin '
          + 'cones with their apexes at the centre and their heights equal to the radius — so the '
          + 'third proved for the pyramid does the work, with the surface as the base. The two '
          + 'formulas can therefore be checked against each other rather than memorised as a '
          + 'pair.',
        position: 3,
        /*
         * No `automaticityTarget`. Cubing 3 is the whole arithmetic, and the
         * error the point exists to stop — answering k, or answering the area's
         * k², where k³ was wanted — is a learner who computed fast and once.
         * The two wrong answers here are both correct answers to one of the
         * other two questions, which is what makes a speed reward actively
         * harmful rather than merely uninformative.
         */
        workedExample: {
          problem:
            'A sphere has radius 6 cm. Give its surface area and its volume as exact multiples '
            + 'of π. A second sphere has three times the radius: by what factor is its surface '
            + 'area larger, and by what factor its volume? Then check the two formulas against '
            + 'each other, and say which of them was borrowed.',
          subgoals: [
            {
              label: 'Take each formula at the radius and stop at the multiple of π',
              detail:
                'S = 4πr² = 4π × 36 = 144π cm², and V = (4/3)πr³ = (4/3)π × 216 = 288π cm³, since '
                + '216 ÷ 3 = 72 and 72 × 4 = 288. Both are exact and both stop there: π is '
                + 'irrational, so 452.4 cm² and 904.8 cm³ are roundings of these two numbers '
                + 'rather than the measures themselves, and the roundings would be inside every '
                + 'later step. Note that the two multiples differ here — at radius 3 they would '
                + 'both have come out 36π, which is a coincidence of that one radius and not a '
                + 'relation.',
              socratic:
                'You have 4π × 36 for the surface and (4/3)π × 216 for the volume. Is there a '
                + 'calculation still to do in either of those, or are they already the two '
                + 'measures?',
            },
            {
              label: 'Put the scale factor on the exponent each measure carries',
              detail:
                'The second sphere is the first scaled by k = 3. A surface is an area, so it takes '
                + 'the factor twice: 3² = 9, and 9 × 144π = 1296π cm². A volume is three lengths '
                + 'multiplied, so it takes it three times: 3³ = 27, and 27 × 288π = 7776π cm³. The '
                + 'two wrong answers worth naming are 3 and 9 — the first is the factor on a '
                + 'LENGTH and the second is the factor on the SURFACE, so each is a correct answer '
                + 'to one of the other two questions rather than an arithmetic slip.',
              socratic:
                'Trebling the radius trebles every length of the sphere. How many of those '
                + 'lengths does a volume multiply together — and so how many times does the 3 get '
                + 'used?',
            },
            {
              label: 'Check the volume against the surface using the third',
              detail:
                'V = (1/3) × S × r should hold: (1/3) × 144π × 6 = 144π × 2 = 288π cm³, which is '
                + 'the volume already found. The reason is the second point\'s third, used with '
                + 'the surface as a base. Cut the ball into very thin cones with their apexes at '
                + 'the centre; each has height r, so each contributes (1/3) × (its patch of '
                + 'surface) × r, and the patches add up to S. So the two formulas are not '
                + 'independent facts, and either one can be used to check the other.',
              socratic:
                'Imagine the ball cut into very thin cones, all with their points at the centre. '
                + 'How tall is each one — and what do all their bases add up to?',
            },
            {
              label: 'Say which fact was borrowed, now that only one of them can be',
              detail:
                'S = 4πr² is the borrowed one. The four is Archimedes\' and the proof compares the '
                + 'sphere with a cylinder slice by slice, which is a claim about matching slices '
                + 'and has no figure-free part to take — the same reason πr² is used and not '
                + 'derived in `circle-measure`. The volume is NOT a second borrowing, because the '
                + 'step above produced it from the surface. And the exponents 1, 2 and 3 are '
                + 'borrowed from nowhere at all: they follow from how many lengths each measure '
                + 'multiplies together.',
              socratic:
                'Three facts were used here: the 4 in the surface area, the volume formula, and '
                + 'the exponents 1, 2 and 3. Which of the three did you have to be told, and '
                + 'which two could you now reconstruct?',
            },
          ],
          answer:
            'The sphere is 144π cm² and 288π cm³. Scaling by 3 multiplies the surface by '
            + '3² = 9 to 1296π cm² and the volume by 3³ = 27 to 7776π cm³ — a surface takes the '
            + 'factor twice and a volume three times, which is `circle-measure`\'s two exponents '
            + 'with the third dimension\'s added. The two formulas check against each other '
            + 'through the factor of a third: (1/3) × 144π × 6 = 288π, because a ball is a union '
            + 'of thin cones of height r whose bases total the surface. So only S = 4πr² is '
            + 'borrowed here, Archimedes\' comparison with a cylinder being a slice-by-slice '
            + 'argument; the volume follows from it, and the exponents follow from counting '
            + 'lengths.',
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
 * holds a single concept, so there is no internal pair to join — and that
 * concept's one prerequisite, `circle-measure`, is a concept of
 * `plane-geometry`. Being authored in another subject fails the containment
 * test exactly as being unwritten does, so the edge lives in
 * `EUCLIDEAN_GEOMETRY.links` in atlas-foundations.ts, which is the area that
 * owned the departing node.
 *
 * Declared as an empty array rather than left off, because `ConceptOntology`
 * requires it and because an explicit empty list is the difference between
 * "there are none" and "somebody forgot".
 */
const EDGES: ConceptEdge[] = []

export const SOLID_MEASURE: ConceptOntology = {
  subject,
  concepts: CONCEPTS,
  edges: EDGES,
}
