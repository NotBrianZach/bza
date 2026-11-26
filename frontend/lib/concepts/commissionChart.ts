/**
 * The commission, as a statechart rather than a list of four words.
 *
 * docs/RPG_AND_THE_GRAPH.md §9 sketches `offered | accepted | ruled |
 * abandoned` and that flat list is already lying twice over. `ruled` is not
 * one state, it is four, and they are substates of HAVING BEEN RULED rather
 * than peers of being accepted. And the thing a commission interacts with —
 * whether the refused road is open — is not a fifth state at all, it is a
 * second, independent region that the errand must never be able to move.
 *
 * So: two orthogonal regions, hierarchy inside one of them, and named guards.
 * Each of those three features is carrying a specific sentence of the design.
 *
 * ── WHY TWO REGIONS, AND WHY THAT IS THE SAFETY ARGUMENT ──────────────────
 *
 * Flattened, `errand` × `road` is a cross product nobody wants to enumerate
 * and — much worse — a shape in which "finishing the work opens the road" is
 * a single edge somebody could add without noticing what they had done.
 *
 * Kept orthogonal, the property becomes structural and checkable: NO
 * transition in the errand region names a target in the road region. The
 * errand cannot move the road, at all, by construction. The road moves on one
 * event, `strength-recomputed`, carrying one guard. That is §4's load-bearing
 * sentence — "no new gate, and nothing new that can open a road" — expressed
 * as a thing tests/atlas.mjs can read off the data rather than as a sentence
 * in a comment that three successive commits quoted at each other.
 *
 * ── WHY HIERARCHY ─────────────────────────────────────────────────────────
 *
 * Two jobs. The small one is that `put-down` leaves the errand from any
 * substate of `working`, which is one transition out of a superstate rather
 * than one per child — the thing flat machines get wrong by omission.
 *
 * The real one is §6. "Inconclusive is a scene, not a failure. It must never
 * be narrated as success, and it must never be narrated as being wrong."
 * With `inconclusive` as a sibling of `correct` and `incorrect` under
 * `ruled`, that stops being a prohibition in a prompt and becomes the absence
 * of an edge: there is no transition from `ruled.inconclusive` to either, and
 * the suite asserts there never will be. A ruling the engine declined to make
 * cannot be rounded to one it did.
 *
 * ── WHY GUARDS ARE NAMES AND NOT FUNCTIONS ────────────────────────────────
 *
 * A transition carries a guard NAME, resolved through `GUARDS`. Inline
 * predicates would be more direct and would make the chart unreadable to the
 * thing that most needs to read it: an assertion asking "is the only edge into
 * `road.open` guarded on the mastery floor" has to be able to see the guard,
 * not call it.
 *
 * ── NO LIBRARY ────────────────────────────────────────────────────────────
 *
 * This is plain data plus a pure `transition`, deliberately. XState would give
 * hierarchy, regions and guards for free and would also be a runtime in a
 * codebase whose whole discipline is pure functions with invariants asserted
 * over real content. A chart as a DOCUMENT — tested the way the ontology is
 * tested, exhaustively, for unreachable states and missing edges — is most of
 * the value and none of the dependency. If this ever needs history states,
 * delayed transitions or spawned actors, that trade changes and the honest
 * move then is the library rather than a hand-rolled half of it.
 */

/** Every state in the errand region. Dots are hierarchy. */
export type ErrandState =
  /** No commission. The resting state, and where `put-down` returns to. */
  | 'none'
  /** A refusal named at least one workable concept; the offer is on screen. */
  | 'offered'
  /** Taken on, not yet settled. Compound — see the three children. */
  | 'working'
  /**
   * Taken on, and the task has not arrived yet.
   *
   * This state is in the chart because leaving it out is where the bug was.
   * Taking work usually changes the practised subject, the session for it is
   * fetched asynchronously, and for that moment there is no task — a flat
   * machine with no name for the gap invites the code to treat the PREVIOUS
   * subject's task list as the answer, which is exactly what it did: it
   * reported "no problem for Long division right now" from a response that was
   * never asked about long division. A state for the gap makes the mistake
   * unspellable.
   */
  | 'working.pending'
  /** The task is on screen and nothing has been sent to the verifier. */
  | 'working.awaiting'
  /** Sent. Nobody knows the answer yet, including the game master. */
  | 'working.submitted'
  /**
   * The concept's own session held no problem for it.
   *
   * Not a ruling and deliberately not a child of `ruled`: nothing was judged.
   * Usually it means the concept is not introducible yet — its own
   * prerequisites are short — which the practice tab already names.
   */
  | 'unavailable'
  /** The verifier has spoken. Compound, and the four children are its words. */
  | 'ruled'
  | 'ruled.correct'
  | 'ruled.incorrect'
  /**
   * The engine declined to settle it. NOT a failure and not a success — see
   * the hierarchy note above, and §6.
   */
  | 'ruled.inconclusive'
  /** Given up on the problem itself, which the verifier can rule. */
  | 'ruled.abandoned'

/** Every state in the road region. */
export type RoadState =
  /** The gate is not satisfied. Where a refusal leaves you. */
  | 'shut'
  /** `conceptStrength >= MASTERY_FLOOR`. The only way in is the guard. */
  | 'open'

export type Region = 'errand' | 'road'

export type ChartEvent =
  /** A road was refused, naming concepts. */
  | 'refused'
  /** The player took the work on one of them. */
  | 'take-work'
  /** A task for that concept arrived and is on screen. */
  | 'task-shown'
  /** The session arrived and had nothing for the concept. */
  | 'no-task'
  | 'submitted'
  | 'ruled-correct'
  | 'ruled-incorrect'
  | 'ruled-inconclusive'
  | 'ruled-abandoned'
  /** Another problem on the same concept. */
  | 'try-again'
  /** The player dismissed the commission. */
  | 'put-down'
  /**
   * Strength was recomputed — by practice, or by decay, or by a reload.
   *
   * The ONLY event the road region listens to. Deliberately not called
   * `worked` or `practised`: naming it after the thing that moved the number
   * would invite an edge from the errand, and the road does not care which of
   * the three it was.
   */
  | 'strength-recomputed'

/** What a guard may read. Nothing here is an opinion. */
export interface ChartContext {
  /** The concept's strength, as the strength table holds it. */
  strength: number
  /** `MASTERY_FLOOR`, passed in rather than imported so the chart stays data. */
  floor: number
  /**
   * Whether the party is standing on the far side of this road already.
   *
   * §7: decay changes what you can reach NEXT, never where you are standing.
   * "Being teleported backwards because a timer elapsed is the version of this
   * that makes people stop playing."
   */
  standingThere: boolean
}

export type GuardName = 'atOrAboveFloor' | 'belowFloorAndNotStandingThere'

export const GUARDS: Record<GuardName, (c: ChartContext) => boolean> = {
  atOrAboveFloor: c => c.strength >= c.floor,
  /* Both halves matter and the second is the whole of §7's second rule. */
  belowFloorAndNotStandingThere: c => c.strength < c.floor && !c.standingThere,
}

export interface ChartTransition {
  region: Region
  /**
   * The source. A compound id means "from this state or any of its
   * substates", which is what makes `put-down` one edge instead of two.
   */
  from: ErrandState | RoadState
  event: ChartEvent
  to: ErrandState | RoadState
  guard?: GuardName
  /** Why this edge exists, for whoever reads the chart instead of the prose. */
  note: string
}

export const TRANSITIONS: ChartTransition[] = [
  // ── the errand ───────────────────────────────────────────────────────────
  {
    region: 'errand', from: 'none', event: 'refused', to: 'offered',
    note: 'A refusal that named workable concepts is an offer. One that named only '
      + 'unwritten ones is not, and `offerFor` is what tells them apart.',
  },
  {
    region: 'errand', from: 'offered', event: 'take-work', to: 'working',
    note: 'Taken on. Targets the COMPOUND state, so the initial child decides where it '
      + 'lands — which is `pending`, because at this instant the task does not exist yet.',
  },
  {
    region: 'errand', from: 'working.pending', event: 'task-shown', to: 'working.awaiting',
    note: 'The session for the concept\'s own subject arrived and had a problem for it.',
  },
  {
    region: 'errand', from: 'working.pending', event: 'no-task', to: 'unavailable',
    note: 'It arrived with nothing for the concept. Said out loud, never swallowed — '
      + 'the alternative is a learner doing some other concept\'s problem believing it '
      + 'was the work the road wanted.',
  },
  {
    region: 'errand', from: 'unavailable', event: 'put-down', to: 'none',
    note: 'The only way out. There is nothing to try again with.',
  },
  {
    region: 'errand', from: 'working.awaiting', event: 'submitted', to: 'working.submitted',
    note: 'Sent to the verifier. The game master is not told, because nobody knows yet.',
  },
  {
    region: 'errand', from: 'working.submitted', event: 'ruled-correct', to: 'ruled.correct',
    note: 'The verifier settled it.',
  },
  {
    region: 'errand', from: 'working.submitted', event: 'ruled-incorrect', to: 'ruled.incorrect',
    note: 'The verifier settled it the other way.',
  },
  {
    region: 'errand', from: 'working.submitted', event: 'ruled-inconclusive', to: 'ruled.inconclusive',
    note: 'The engine refused rather than guessed. A situation, not a verdict on the learner.',
  },
  {
    region: 'errand', from: 'working.submitted', event: 'ruled-abandoned', to: 'ruled.abandoned',
    note: 'Given up on. Already a ruling the verifier can produce.',
  },
  {
    region: 'errand', from: 'ruled', event: 'try-again', to: 'working.pending',
    note: 'From the superstate: another problem on the same concept, whichever of the four '
      + 'rulings came back. This is the edge that makes `inconclusive` liveable — the '
      + 'question stays open and there is something to do about it. Targets `pending` and '
      + 'NOT `awaiting`, because continuing releases the task and the next one has to be '
      + 'fetched: `awaiting` means a task is on screen, which at this instant is false.',
  },
  {
    region: 'errand', from: 'working', event: 'put-down', to: 'none',
    note: 'From the superstate, so it covers both children without two edges.',
  },
  {
    region: 'errand', from: 'ruled', event: 'put-down', to: 'none',
    note: 'And from the other superstate. Reading a ruling and walking away is normal.',
  },
  {
    region: 'errand', from: 'offered', event: 'put-down', to: 'none',
    note: 'Declining the offer. A refusal is still a refusal.',
  },

  // ── the road ─────────────────────────────────────────────────────────────
  {
    region: 'road', from: 'shut', event: 'strength-recomputed', to: 'open',
    guard: 'atOrAboveFloor',
    note: 'THE ONLY EDGE INTO `open`, and it is the gate that was always there. '
      + 'tests/atlas.mjs asserts both halves of that sentence.',
  },
  {
    region: 'road', from: 'open', event: 'strength-recomputed', to: 'shut',
    guard: 'belowFloorAndNotStandingThere',
    note: 'Decay closes a road — §7 — but never one the party is standing on.',
  },
]

/** Compound states and the child entering them lands on. */
export const INITIAL_CHILD: Partial<Record<ErrandState, ErrandState>> = {
  /* `pending` and not `awaiting`: taking work is a click, and the task it
     lands on arrives from the server afterwards. The initial child is where
     the asynchrony is admitted. */
  working: 'working.pending',
  /* `ruled` has no initial child on purpose: you never enter it generically,
     only as one of the four rulings, and inventing a default would be
     inventing a ruling. Asserted. */
}

export const INITIAL: { errand: ErrandState; road: RoadState } = { errand: 'none', road: 'shut' }

/** `'working.awaiting'` → `['working.awaiting', 'working']`, nearest first. */
export function selfAndAncestors(state: string): string[] {
  const parts = state.split('.')
  const out: string[] = []
  for (let i = parts.length; i > 0; i--) out.push(parts.slice(0, i).join('.'))
  return out
}

/**
 * Take one event in one region.
 *
 * Returns the new state, or the SAME state when nothing applies — an
 * unhandled event is not an error here. The road region is sent
 * `strength-recomputed` on every reload and most of the time the answer is
 * "nothing changes", which a throwing machine would turn into a crash on the
 * happy path.
 *
 * A transition from an ancestor applies to its descendants, nearest source
 * first: a `put-down` sitting on `working` fires from `working.submitted`, and
 * a more specific edge on the child would win if one existed.
 */
export function transition<S extends string>(
  region: Region,
  state: S,
  event: ChartEvent,
  ctx: ChartContext,
): S {
  for (const source of selfAndAncestors(state)) {
    for (const t of TRANSITIONS) {
      if (t.region !== region || t.from !== source || t.event !== event) continue
      if (t.guard && !GUARDS[t.guard](ctx)) continue
      return (INITIAL_CHILD[t.to as ErrandState] ?? t.to) as S
    }
  }
  return state
}

/** Every state named anywhere in the chart, by region. */
export function statesOf(region: Region): string[] {
  const out = new Set<string>()
  if (region === 'errand') out.add(INITIAL.errand)
  else out.add(INITIAL.road)
  for (const t of TRANSITIONS) {
    if (t.region !== region) continue
    for (const s of [t.from, t.to]) for (const a of selfAndAncestors(s)) out.add(a)
  }
  return [...out].sort()
}

/**
 * Which errand states are terminal for the purpose of telling a story.
 *
 * Not a chart concept — every `ruled.*` has a `try-again` edge out, so nothing
 * here is a dead end. This is the set the game master may narrate a RULING
 * for, which is exactly the four children of `ruled` and nothing else.
 * Exported so the narration path cannot drift from the chart.
 */
export function isRuled(state: string): boolean {
  return selfAndAncestors(state).includes('ruled') && state !== 'ruled'
}
