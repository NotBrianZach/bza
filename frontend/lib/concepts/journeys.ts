/**
 * Learning journeys — a path through the atlas with something to arrive at.
 *
 * ── The problem these solve ───────────────────────────────────────────────
 *
 * The map answers "where am I" and the scheduler answers "what next", and
 * between them they never answer "what am I DOING". A learner on the Concepts
 * tab sees 291 nodes, 34 of which have problems, and a queue that hands over
 * one task at a time with no horizon. Both are honest and neither is a goal.
 * A journey is the missing middle: a destination worth wanting, the steps that
 * reach it, and a sentence about why those steps are in that order.
 *
 * ── The path is DERIVED. This is the whole design. ────────────────────────
 *
 * A journey names a destination. It does NOT list its steps — they are the
 * destination's teachable prerequisite closure, in the atlas's own teaching
 * order. An authored step list was the obvious shape and it is a trap: the
 * moment anybody adds a prerequisite edge, the list is a second, stale opinion
 * about what the subject requires, and it is the one the learner is reading.
 * Deriving makes a journey structurally incapable of contradicting the graph.
 *
 * What is authored is the part the graph genuinely does not contain: the
 * premise, the arc, and which concepts along the way are worth naming as
 * landmarks. Narrative is editorial and cannot be computed. Order is
 * structural and must not be.
 *
 * ── Honesty, which is the same discipline as everywhere else here ─────────
 *
 * 34 of 291 concepts have anything written for them. A journey is therefore
 * very capable of looking like a fifteen-lesson course while containing three
 * things a learner can actually do, and `atlasCoverage` exists precisely
 * because that kind of overstatement is the failure mode of a map. So:
 *
 *  - `steps` are the TEACHABLE concepts only. A step you cannot practise is
 *    not a step, it is a gap, and listing it as one promises work that does
 *    not exist.
 *  - `unwrittenOnPath` counts the concepts the path crosses that have nothing
 *    written, and callers are expected to say the number. The route between
 *    two teachable concepts is often several unwritten ones, and a learner
 *    reading a tidy seven-step list deserves to know the real distance.
 *  - `done` is strength at or above the floor and NOTHING else. A claim opens
 *    problems; it is not evidence, and a journey that counted claims as
 *    progress would let somebody complete it by pressing buttons. `claimed` is
 *    reported alongside so the two can be shown apart, never merged.
 *
 * ── Why this is a separate module and not part of the ontology ────────────
 *
 * An ontology says what mathematics is. A journey says what somebody might
 * want this week. Those change for completely different reasons and on
 * different timescales, and the ontology must stay the thing with no opinion
 * about curriculum.
 */

import type { Concept, ConceptOntology } from './types'
import { areaOf } from './atlas'
import {
  claimableChainFor, conceptById, isTeachable, allPrerequisitesOf, teachingOrder,
} from './registry'

// ---------------------------------------------------------------------------
// The authored part
// ---------------------------------------------------------------------------

export interface JourneyMilestone {
  conceptId: string
  /** A short name for this stage of the arc. */
  label: string
  /** What the learner can do once they are here. Second person. */
  promise: string
}

export interface Journey {
  id: string
  title: string
  /** The hook. One sentence, concrete, no curriculum vocabulary. */
  premise: string
  /**
   * Why these things in this order, and what is different at the end.
   *
   * The part that makes a path a journey. It should explain the *shape* — that
   * one step is the trick the next one generalises, that two halves meet in
   * the middle — because that is what the graph cannot say.
   */
  arc: string
  /** Where it ends. Everything else about the route follows from this. */
  destination: string
  /**
   * Landmarks worth naming. Must lie on the derived path — `journeyProblems`
   * enforces it, because a milestone off the route promises a stage the
   * journey never passes through.
   */
  milestones: JourneyMilestone[]
}

/**
 * The shipped journeys.
 *
 * Deliberately a spread of lengths rather than a syllabus: the ask these
 * answer is "short and medium term goals", and a list where everything is a
 * fourteen-step commitment has no short term in it. Lengths below are the
 * teachable step counts at the time of writing; they move with the atlas,
 * which is the point of deriving them.
 *
 * Every destination is teachable. A journey ending on a mapped-only concept
 * would be a goal nobody can reach, and `journeyProblems` rejects it.
 */
export const JOURNEYS: Journey[] = [
  {
    id: 'spot-the-factors',
    title: 'Spot the factors',
    premise: 'Look at a number and see what divides it, without trial and error.',
    arc:
      'Three steps, and they are the three everything else in arithmetic rests on. '
      + 'Place value is why the digits of a number tell you anything about it at all; '
      + 'that is what makes the divisibility tests work rather than be magic. By the '
      + 'end, factoring a number is something you look at rather than something you '
      + 'search for — which is exactly the move factoring a polynomial will ask for later.',
    destination: 'divisibility',
    milestones: [
      { conceptId: 'place-value', label: 'The digits mean something', promise: 'You can say what the 7 in 4712 is worth, and why that is a choice.' },
      { conceptId: 'divisibility', label: 'Factors on sight', promise: 'You can tell what divides a number by looking at it.' },
    ],
  },
  {
    id: 'multiplication-into-addition',
    title: 'Turn multiplication into addition',
    premise: 'The trick that made astronomy possible before computers existed.',
    arc:
      'The exponent rules tell you what happens when powers multiply: you add the '
      + 'exponents. A logarithm asks that question backwards — given the answer, which '
      + 'exponent was it? Put the two together and every multiplication becomes an '
      + 'addition, which is why logarithm tables were worth three centuries of effort. '
      + 'The payoff is that you can then solve for an unknown sitting in an exponent, '
      + 'which no amount of algebra on the outside will reach.',
    destination: 'solving-exponential-equations',
    milestones: [
      { conceptId: 'exponent-rules', label: 'Powers multiply by adding', promise: 'You can combine and split powers without guessing.' },
      { conceptId: 'logarithm-definition', label: 'The question backwards', promise: 'You can read a logarithm as "what exponent was it".' },
      { conceptId: 'solving-exponential-equations', label: 'Reach into the exponent', promise: 'You can solve for an unknown that sits up in a power.' },
    ],
  },
  {
    id: 'solve-any-quadratic',
    title: 'Solve any quadratic',
    premise: 'Stop memorising the formula and derive it instead.',
    arc:
      'You start by factoring the friendly quadratics — the ones that come apart into '
      + 'whole numbers. Most do not. Completing the square is the move that turns an '
      + 'unfriendly one into a friendly one, and it always works. Then the last step is '
      + 'the one worth the whole journey: do completing the square once, on a quadratic '
      + 'with letters instead of numbers, and what falls out IS the quadratic formula. '
      + 'It stops being a thing you remember and becomes a thing you could rebuild.',
    destination: 'quadratic-formula',
    milestones: [
      { conceptId: 'factoring-quadratics', label: 'The friendly ones', promise: 'You can factor a quadratic that comes apart cleanly.' },
      { conceptId: 'completing-the-square', label: 'The move that always works', promise: 'You can force any quadratic into a square plus a number.' },
      { conceptId: 'quadratic-formula', label: 'Done once, for all of them', promise: 'You can derive the formula instead of recalling it.' },
    ],
  },
  {
    id: 'run-a-function-backwards',
    title: 'Run a function backwards',
    premise: 'When can you undo a function, and when is the question unanswerable?',
    arc:
      'A function is a rule with one answer per input, and that one-ness is the whole '
      + 'story here. Domain and range make you say exactly what goes in and what comes '
      + 'out; composition gives you a way to run two rules in sequence. An inverse is '
      + 'then the rule that composes with the original to give you back what you started '
      + 'with — and the reason some functions have none is that squaring sends two '
      + 'inputs to the same output, so running it backwards has no single answer.',
    destination: 'inverse-functions',
    milestones: [
      { conceptId: 'function-concept', label: 'One answer per input', promise: 'You can say whether a rule is a function and why it matters.' },
      { conceptId: 'function-composition', label: 'Rules in sequence', promise: 'You can feed one function into another and track the domain.' },
      { conceptId: 'inverse-functions', label: 'The undo', promise: 'You can find an inverse, and say when there is not one.' },
    ],
  },
  {
    id: 'break-a-fraction-apart',
    title: 'Break a hard fraction into easy ones',
    premise: 'Run the addition of fractions backwards — the step that makes calculus tractable.',
    arc:
      'This one is a there-and-back. First you learn to put rational expressions '
      + 'together: factor the pieces, find what the denominator forbids, simplify, add. '
      + 'Then the journey turns around. Partial fractions is that whole process run in '
      + 'reverse — given the combined fraction, recover the simple ones it came from. '
      + 'Going forwards is bookkeeping; going backwards is the thing that turns an '
      + 'impossible integral into three easy ones, which is why it is worth the climb.',
    destination: 'partial-fractions-linear',
    milestones: [
      { conceptId: 'factoring-quadratics', label: 'Take the pieces apart', promise: 'You can factor the denominators you are about to need.' },
      { conceptId: 'combining-rational', label: 'Forwards', promise: 'You can add rational expressions over a common denominator.' },
      { conceptId: 'partial-fractions-linear', label: 'Backwards', promise: 'You can split one hard fraction into a sum of simple ones.' },
    ],
  },
  {
    id: 'when-can-a-map-be-undone',
    title: 'When can a linear map be undone?',
    premise: 'One number tells you whether a matrix threw information away. Find out why.',
    /*
     * Independence is a beat again, and the history is worth keeping.
     *
     * The first draft of this arc ran vectors → span → independence →
     * matrices, because that is how the subject is usually told, and
     * `journeyProblems` rejected it: the atlas had no prerequisite path from
     * `linear-independence` to `matrix-inverse`. The prose was corrected
     * rather than the ontology, because adding an edge changes what gates what
     * for every learner and is not a thing to slip in so a paragraph reads
     * better.
     *
     * It was then raised as a content question and the edge was added
     * deliberately — see the `links` entry in atlas-structures.ts. So the
     * route now contains independence and the arc can say what it always
     * wanted to. The derived path caught a real gap in the map; it did not
     * get overruled to suit a story.
     */
    arc:
      'The longest of these, and it builds one idea. Vectors give you things to point '
      + 'with; span asks what you can reach by combining them; independence asks whether '
      + 'any of them was redundant. A matrix then turns out to be a linear map rather '
      + 'than a grid of numbers, matrix multiplication turns out to be doing two maps in '
      + 'a row, and the determinant turns out to be the number measuring how much the '
      + 'map squashes space. When it squashes space flat — determinant zero — the '
      + 'columns were dependent, two different inputs land on the same output, '
      + 'information is gone, and no inverse can exist. The last step is that sentence '
      + 'made precise.',
    destination: 'matrix-inverse',
    milestones: [
      { conceptId: 'vectors-and-spans', label: 'What you can reach', promise: 'You can say which vectors a set of vectors can build.' },
      { conceptId: 'linear-independence', label: 'Was any of it redundant?', promise: 'You can tell whether a set carries a repeated direction.' },
      { conceptId: 'determinant', label: 'The number that measures squashing', promise: 'You can compute a determinant and say what it means.' },
      { conceptId: 'matrix-inverse', label: 'Undo, or prove you cannot', promise: 'You can decide invertibility and say what zero means.' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/** Per-concept learner state, the shape `summarise` already returns. */
export interface ConceptStateIn {
  conceptId: string
  strength: number
  introducible: boolean
  claimed?: boolean
}

export interface JourneyStep {
  conceptId: string
  name: string
  /** Which area it belongs to — a journey usually crosses several. */
  area: string | null
  strength: number
  introducible: boolean
  claimed: boolean
  /** Strength at or above the floor. Earned only — never a claim. */
  done: boolean
  /** Present when this step is one of the authored landmarks. */
  milestone: JourneyMilestone | null
  /** True when this concept is outside the state we were given. */
  unknown: boolean
}

export interface ResolvedJourney {
  journey: Journey
  destinationName: string
  /** Teachable steps, in the atlas's teaching order. */
  steps: JourneyStep[]
  total: number
  done: number
  /**
   * The step to do next: the first not-done step that is open.
   *
   * Null either because the journey is finished or because nothing on it is
   * open yet — the caller must tell those apart, which is why `done`/`total`
   * sit beside it rather than being inferred from this being null.
   */
  next: JourneyStep | null
  /**
   * Concepts on the route with nothing written for them.
   *
   * Say this number. A seven-step list that silently crosses twenty unwritten
   * concepts is the overstatement this whole module is trying not to make.
   */
  unwrittenOnPath: number
  /** Distinct areas the route crosses, in first-encountered order. */
  areas: string[]
  /** True when the teaching order could not be computed (a cyclic graph). */
  orderUnreliable: boolean
}

/**
 * Resolve a journey against a learner's state.
 *
 * Pure, and takes the ontology rather than importing MATHEMATICS, so the same
 * function serves the composed atlas and a single authored subject — and so
 * the tests can run it over a four-node synthetic graph.
 */
export function resolveJourney(
  o: ConceptOntology,
  journey: Journey,
  states: readonly ConceptStateIn[],
  masteryFloor: number,
): ResolvedJourney {
  const stateOf = new Map(states.map(s => [s.conceptId, s]))
  const milestoneOf = new Map(journey.milestones.map(m => [m.conceptId, m]))

  /**
   * The teachable route, destination included.
   *
   * `claimableChainFor` is exactly this set already — a concept plus every
   * teachable concept beneath it — and reusing it keeps one definition of
   * "what this rests on" rather than a second walk that could disagree with
   * the chain-claim button the learner can see.
   */
  const chain = claimableChainFor(o, journey.destination)
  const inChain = new Set(chain)

  /**
   * Ordered by the atlas's own teaching order, filtered to the chain.
   *
   * Filtering a global topological order is still a valid order for any
   * subset, and it means a journey lists its steps in the same sequence the
   * scheduler would introduce them. Sorting by chain depth instead would be a
   * second ordering opinion, and the two would disagree on any concept with
   * two routes into it.
   */
  const order = teachingOrder(o)
  const ordered = order
    ? order.filter(id => inChain.has(id))
    // A cyclic graph has no teaching order. `claimableChainFor` is
    // nearest-first from the destination, so reversing it is roots-ish —
    // good enough to render, and flagged as unreliable rather than trusted.
    : [...chain].reverse()

  const steps: JourneyStep[] = ordered.map(id => {
    const c = conceptById(o, id)
    const st = stateOf.get(id)
    return {
      conceptId: id,
      name: c?.name ?? id,
      area: areaOf(o, id),
      strength: st?.strength ?? 0,
      introducible: st?.introducible ?? false,
      claimed: !!st?.claimed,
      // Earned only. See the honesty note at the top of this file.
      done: (st?.strength ?? 0) >= masteryFloor,
      milestone: milestoneOf.get(id) ?? null,
      /**
       * No state for this concept at all.
       *
       * Distinct from strength zero. A journey crossing into an area the
       * current session does not cover has steps nobody can act on yet, and
       * drawing them as "not started" would invite a learner to try.
       */
      unknown: !st,
    }
  })

  /**
   * Everything on the route, teachable or not, so the gaps can be counted.
   *
   * `allPrerequisitesOf` rather than the gating walk: the gating walk stops at
   * the nearest teachable ancestor and would therefore skip exactly the
   * unwritten concepts this number exists to report.
   */
  const everything = [journey.destination, ...allPrerequisitesOf(o, journey.destination)]
  const unwrittenOnPath = everything.filter(id => !isTeachable(o, id)).length

  const areas: string[] = []
  for (const s of steps) {
    if (s.area && !areas.includes(s.area)) areas.push(s.area)
  }

  return {
    journey,
    destinationName: conceptById(o, journey.destination)?.name ?? journey.destination,
    steps,
    total: steps.length,
    done: steps.filter(s => s.done).length,
    next: steps.find(s => !s.done && s.introducible) ?? null,
    unwrittenOnPath,
    areas,
    orderUnreliable: order === null,
  }
}

// ---------------------------------------------------------------------------
// How journeys relate to each other
// ---------------------------------------------------------------------------

/**
 * Journeys are not a flat list, and the relations between them are derivable.
 *
 * Two kinds, because they mean different things to a learner:
 *
 *  - `stage`: journey A's DESTINATION lies on journey B's route. Finishing A
 *    is then literal progress through B — not an analogy, the same steps. This
 *    is directed and is the strong relation.
 *  - `shares`: they have material in common but neither contains the other.
 *    Undirected, weaker, and worth drawing because it answers "will this help
 *    with that" when containment does not.
 *
 * ── Why `shares` has to discount the common base ──────────────────────────
 *
 * Every journey in a mathematics atlas rests on place value and whole-number
 * arithmetic. If shared concepts were counted naively, every pair would share
 * something and the map would be complete — a graph where everything connects
 * to everything says nothing. So concepts that most journeys depend on are
 * treated as common ground and excluded. What is left is overlap that is
 * actually characteristic of those two routes.
 *
 * The threshold is a ratio rather than a hand-listed set of "basics", because
 * a list would need maintaining every time a journey is added and would
 * silently rot. This way the common base is whatever the current set of
 * journeys makes common.
 */
export interface JourneyRelations {
  /** `from` is a stage of `to`: finishing `from` is progress through `to`. */
  stage: { from: string; to: string }[]
  /** Overlap with no containment. `a` and `b` are unordered. */
  shares: { a: string; b: string; concepts: string[] }[]
  /** Concepts so widely shared they were discounted, with the count. */
  common: { conceptId: string; journeys: number }[]
}

/**
 * A concept appearing on more than this fraction of journeys is common ground.
 *
 * Half. Lower and characteristic overlap starts being discarded; higher and
 * the arithmetic base creeps back in and reconnects everything.
 */
const COMMON_SHARE = 0.5

/** How much non-common overlap is worth drawing an edge for. */
const SHARES_MIN = 2

export function journeyRelations(
  o: ConceptOntology,
  journeys: readonly Journey[],
): JourneyRelations {
  const routeOf = new Map<string, Set<string>>()
  for (const j of journeys) routeOf.set(j.id, new Set(claimableChainFor(o, j.destination)))

  const appearances = new Map<string, number>()
  for (const route of routeOf.values()) {
    for (const id of route) appearances.set(id, (appearances.get(id) ?? 0) + 1)
  }
  const commonCut = journeys.length * COMMON_SHARE
  const common = [...appearances.entries()]
    .filter(([, n]) => n > commonCut)
    .map(([conceptId, journeys]) => ({ conceptId, journeys }))
    .sort((a, b) => b.journeys - a.journeys)
  const isCommon = new Set(common.map(c => c.conceptId))

  const stage: { from: string; to: string }[] = []
  for (const a of journeys) {
    for (const b of journeys) {
      if (a.id === b.id) continue
      /**
       * Containment is tested on the DESTINATION, not on the whole route.
       *
       * A route is a prerequisite closure, so two journeys in the same area
       * share most of their early steps without either being a stage of the
       * other. The destination is the only step that is the journey's own
       * point, so "your endpoint is on my path" is the claim that actually
       * means finishing you advances me.
       */
      if (routeOf.get(b.id)!.has(a.destination)) stage.push({ from: a.id, to: b.id })
    }
  }

  const containment = new Set(stage.map(s => `${s.from}>${s.to}`))
  const shares: { a: string; b: string; concepts: string[] }[] = []
  for (let i = 0; i < journeys.length; i++) {
    for (let k = i + 1; k < journeys.length; k++) {
      const a = journeys[i]
      const b = journeys[k]
      // Containment already says something stronger; a second edge between the
      // same pair would be two lines meaning one thing.
      if (containment.has(`${a.id}>${b.id}`) || containment.has(`${b.id}>${a.id}`)) continue
      const both = [...routeOf.get(a.id)!]
        .filter(id => routeOf.get(b.id)!.has(id) && !isCommon.has(id))
      if (both.length >= SHARES_MIN) shares.push({ a: a.id, b: b.id, concepts: both })
    }
  }

  return { stage, shares, common }
}

/**
 * Layer index per journey: how deep it sits in the `stage` relation.
 *
 * Longest path, for the same reason `ConceptGraph` layers by longest path — a
 * journey that contains both a short one and a long one belongs to the right
 * of both, and shortest-path would draw an edge leaping backwards over the
 * layer that the arrow is supposed to explain.
 *
 * Journeys in no `stage` relation at all land in layer 0, which is correct
 * rather than a fallback: an island has nothing before it.
 */
export function journeyLayers(
  journeys: readonly Journey[],
  stage: readonly { from: string; to: string }[],
): Map<string, number> {
  const into = new Map<string, string[]>()
  for (const j of journeys) into.set(j.id, [])
  for (const s of stage) into.get(s.to)?.push(s.from)

  const depth = new Map<string, number>()
  const walk = (id: string, seen: Set<string>): number => {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    // A cycle is impossible through destination-containment on a DAG, but the
    // guard costs nothing and a hang here would be a blank tab.
    if (seen.has(id)) return 0
    seen.add(id)
    const parents = into.get(id) ?? []
    const d = parents.length === 0 ? 0 : 1 + Math.max(...parents.map(p => walk(p, seen)))
    seen.delete(id)
    depth.set(id, d)
    return d
  }
  for (const j of journeys) walk(j.id, new Set())
  return depth
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Editorial faults in the journey list, as sentences.
 *
 * Same posture as `ontologyProblems` and `atlasProblems`: journeys are a
 * hand-authored document referring to ids by string, so the failure mode is a
 * typo, and the useful response is to name it rather than to render a journey
 * with a hole in it. Called by the test suite, so a bad id fails the build
 * rather than reaching a learner.
 */
export function journeyProblems(o: ConceptOntology, journeys: readonly Journey[]): string[] {
  const problems: string[] = []
  const seen = new Set<string>()

  for (const j of journeys) {
    if (seen.has(j.id)) problems.push(`journey "${j.id}" is defined twice`)
    seen.add(j.id)

    const dest: Concept | null = conceptById(o, j.destination)
    if (!dest) {
      // Everything below depends on the destination resolving, so stop here
      // rather than emit a cascade of consequences of the same typo.
      problems.push(`journey "${j.id}" ends at "${j.destination}", which is not in the graph`)
      continue
    }
    if (!isTeachable(o, j.destination)) {
      problems.push(
        `journey "${j.id}" ends at "${j.destination}", which has no knowledge points — `
        + 'a journey must end somewhere a learner can actually arrive',
      )
    }

    const chain = new Set(claimableChainFor(o, j.destination))
    for (const m of j.milestones) {
      if (!conceptById(o, m.conceptId)) {
        problems.push(`journey "${j.id}" names milestone "${m.conceptId}", which is not in the graph`)
        continue
      }
      if (!chain.has(m.conceptId)) {
        problems.push(
          `journey "${j.id}" names milestone "${m.conceptId}", which is not on its route to `
          + `"${j.destination}" — it would promise a stage the journey never passes through`,
        )
      }
    }
    if (j.milestones.length === 0) {
      problems.push(`journey "${j.id}" has no milestones, so it has no intermediate goals`)
    }
  }
  return problems
}
