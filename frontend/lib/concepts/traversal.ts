/**
 * Navigation, reframed: the concept graph as somewhere you walk.
 *
 * Two of the eleven correlation games are already the right shape for a practice
 * loop if you read their constraints sideways, and `navigation` is the better of
 * the two. Its constraint is "You pick the key, never the door." Its world is
 * `here` (where you are standing), `atlas` (places reached, each with one fixed
 * detail) and `route` (the order of arrival).
 *
 * Relabel those three as the current concept, the concepts reached with what
 * fixed them, and the order of introduction, and the structure is a prerequisite
 * traversal with no change to its shape. That is the whole idea, and it is the
 * part that makes this feel like bza rather than like a learning app stapled to a
 * game: you offer something you already know, and where it lands is the graph's
 * decision, not yours.
 *
 * ── The one inversion, and it is not negotiable ───────────────────────────
 *
 * In the correlation engine a checked scope is **relaxed at salvage**, because
 * "the engine guarantees that a legal turn carries a real reply, and a guarantee
 * outranks a preference" (lib/correlate/scope.ts). A player who scoped themselves
 * into a corner gets an answer rather than a dead chain, which is humane and
 * correct for a game.
 *
 * Prerequisite scope is the opposite: it is the one thing that must never relax.
 * Arriving at a concept whose prerequisites are unmet is precisely the failure
 * mastery learning exists to prevent — it is the mechanism, not a
 * quality-of-service degradation. So `offerKey` refuses, by name, and the refusal
 * is the reply. Same machinery as the fourth registry, opposite priority, and the
 * reason is that what is being guaranteed is different: there, that a turn is
 * answered; here, that a learner is never asked something they have not been
 * prepared for.
 *
 * Nothing here touches `listen_turns`, the turn route or the reply guarantee. A
 * traversal is not a branch of a correlation session — it has no parent edge, no
 * relation and no reply — so it gets its own table (supabase/setup/60).
 */

import {
  conceptById, dependentsOf, interferenceReason, interferesWith, prerequisitesOf, roots,
} from './registry'
import type { ConceptOntology } from './types'

// ---------------------------------------------------------------------------
// The world
// ---------------------------------------------------------------------------

/** One concept reached, with the single fact that fixed it. `atlas`, relabelled. */
export interface Reached {
  conceptId: string
  /**
   * What fixed it — the knowledge point that was demonstrated, in one line.
   *
   * One detail, not a history, for exactly the reason navigation's atlas holds
   * one: a place you have been is remembered by the thing about it you can still
   * see, and a complete transcript of the visit is not a memory of the place.
   */
  detail: string
  /** Order of arrival, from 0. */
  at: number
}

export interface TraversalWorld {
  /** Where the learner is standing. Null before the first arrival. */
  here: string | null
  /** Concepts reached, newest last. */
  reached: Reached[]
  /** The order of introduction, which is `reached` keyed for cheap lookup. */
  route: string[]
}

export function seedTraversal(): TraversalWorld {
  return { here: null, reached: [], route: [] }
}

export function hasReached(world: TraversalWorld, conceptId: string): boolean {
  return world.route.includes(conceptId)
}

/**
 * The concepts reachable right now: not yet reached, every prerequisite reached.
 *
 * This is the frontier, and it is derived rather than stored. A stored frontier is
 * a cache of a graph walk over a graph the author edits, and the first time the
 * ontology gains an edge every stored frontier becomes a lie that nothing
 * recomputes.
 */
export function frontier(o: ConceptOntology, world: TraversalWorld): string[] {
  return o.concepts
    .filter(c => !hasReached(world, c.id))
    .filter(c => prerequisitesOf(o, c.id).every(p => hasReached(world, p)))
    .map(c => c.id)
}

/** Prerequisites of `conceptId` not yet reached. Empty means the door is open. */
export function unmetPrerequisites(o: ConceptOntology, world: TraversalWorld, conceptId: string): string[] {
  return prerequisitesOf(o, conceptId).filter(p => !hasReached(world, p))
}

/**
 * Where a learner may start.
 *
 * The roots, and only the roots. An empty route has no keys in it, so the opening
 * move is a choice of starting point rather than an offering — which is what
 * navigation's own opening does ("Nowhere yet. A door with no building attached
 * to it.").
 */
export function openingDoors(o: ConceptOntology, world: TraversalWorld): string[] {
  return world.route.length === 0 ? roots(o) : frontier(o, world)
}

// ---------------------------------------------------------------------------
// Offering a key
// ---------------------------------------------------------------------------

export type KeyOutcome =
  /** The key fits. `door` is where it lands, chosen by the graph. */
  | { kind: 'opens'; door: string; because: string }
  /** The key is real and opens nothing yet. Names what is still missing. */
  | { kind: 'blocked'; nearest: string; missing: string[]; because: string }
  /** The key is not a key: the learner has not reached that concept. */
  | { kind: 'not-yours'; because: string }
  /** The key opens something that must not be introduced next to what is open. */
  | { kind: 'interferes'; door: string; with: string; because: string }
  /** Everything this key leads to has already been reached. */
  | { kind: 'spent'; because: string }

/**
 * Offer a concept you know. The door is not your decision.
 *
 * Determinism matters more than it looks. Two learners with identical histories
 * offering the same key must arrive at the same concept, or the curriculum is not
 * a thing either of them can reason about — so the choice among open doors is by
 * fewest remaining dependents and then by registry order, never by anything
 * random. (It also could not be random: these functions run on both sides of the
 * wire and `Math.random` in a graph walk makes the traversal unreplayable.)
 *
 * Why fewest dependents first: a door that unlocks little is a leaf of the
 * subject, and taking leaves before trunks is what keeps the frontier wide and
 * the learner's options open. The opposite rule — most dependents first — races
 * to the end of the subject through the narrowest possible corridor.
 */
export function offerKey(
  o: ConceptOntology,
  world: TraversalWorld,
  offered: string,
): KeyOutcome {
  const concept = conceptById(o, offered)
  if (!concept) return { kind: 'not-yours', because: `${offered} is not a concept in this subject.` }

  if (!hasReached(world, offered)) {
    return {
      kind: 'not-yours',
      because: `You have not reached ${concept.name.toLowerCase()} yet, so it is not a key you are holding.`,
    }
  }

  const leadsTo = dependentsOf(o, offered).filter(id => !hasReached(world, id))
  if (leadsTo.length === 0) {
    return {
      kind: 'spent',
      because: `${concept.name} unlocks nothing you have not already reached. Offer a different key.`,
    }
  }

  const open = leadsTo.filter(id => unmetPrerequisites(o, world, id).length === 0)

  if (open.length === 0) {
    // Honest refusal rather than a relaxed arrival. The nearest door is the one
    // with the fewest things still missing, because that is the actionable answer
    // to "then what do I do".
    const ranked = [...leadsTo].sort((a, b) =>
      unmetPrerequisites(o, world, a).length - unmetPrerequisites(o, world, b).length
      || o.concepts.findIndex(c => c.id === a) - o.concepts.findIndex(c => c.id === b))
    const nearest = ranked[0]
    const missing = unmetPrerequisites(o, world, nearest)
    return {
      kind: 'blocked',
      nearest,
      missing,
      because:
        `${concept.name} is part of what opens ${conceptById(o, nearest)?.name.toLowerCase()}, but ` +
        `${missing.map(m => conceptById(o, m)?.name.toLowerCase() ?? m).join(' and ')} ` +
        `${missing.length === 1 ? 'is' : 'are'} still missing. The door does not open early.`,
    }
  }

  const order = (id: string) => o.concepts.findIndex(c => c.id === id)
  const ranked = [...open].sort((a, b) =>
    dependentsOf(o, a).length - dependentsOf(o, b).length || order(a) - order(b))

  // Interference is checked against where the learner is standing, not against
  // everything they have ever reached: the claim the edge makes is about two
  // concepts being met *together*, and two concepts met a month apart were not.
  for (const door of ranked) {
    const clash = world.here && interferesWith(o, door).includes(world.here) ? world.here : null
    if (!clash) {
      return {
        kind: 'opens',
        door,
        because:
          `${concept.name} is one of what ${conceptById(o, door)?.name.toLowerCase()} rests on, ` +
          `and nothing else it rests on is missing.`,
      }
    }
  }

  const door = ranked[0]
  const clash = world.here as string
  return {
    kind: 'interferes',
    door,
    with: clash,
    because:
      interferenceReason(o, door, clash)
      ?? `${conceptById(o, door)?.name} and ${conceptById(o, clash)?.name} must not be introduced together.`,
  }
}

/**
 * Arrive. Returns a new world; the old one is untouched.
 *
 * Immutable because a traversal is replayed — from the stored world, from a
 * sequence of offerings, by a test — and a function that mutated its argument
 * would make the replay depend on how many times it had been run.
 *
 * `detail` is the one fixed fact about the concept, and it is required. A
 * traversal whose atlas entries say nothing is a list of ids, and the reason
 * navigation's atlas holds a detail is that a list of ids is not a map.
 */
export function arrive(world: TraversalWorld, conceptId: string, detail: string): TraversalWorld {
  if (hasReached(world, conceptId)) return { ...world, here: conceptId }
  return {
    here: conceptId,
    reached: [...world.reached, { conceptId, detail, at: world.route.length }],
    route: [...world.route, conceptId],
  }
}

/**
 * How much of the subject has been walked.
 *
 * Concepts rather than knowledge points, because the traversal is over concepts —
 * reporting it in points would mix two units and make the number move when
 * somebody adds a worked example.
 */
export function traversalProgress(o: ConceptOntology, world: TraversalWorld): {
  reached: number; total: number; frontier: number
} {
  return {
    reached: world.route.length,
    total: o.concepts.length,
    frontier: frontier(o, world).length,
  }
}

// ---------------------------------------------------------------------------
// The practice game, as data
// ---------------------------------------------------------------------------

/**
 * Games are pure data in the correlation engine and stay pure data here — the
 * six pieces, a persona, a constraint. What this registry cannot borrow is the
 * route: `judge: 'verifier'` is a different ruling path, which is the whole
 * reason this is a sibling engine. See the header of verify.ts.
 *
 * Deliberately not added to `GAMES` in lib/correlate/games.ts. A twelfth entry
 * there would appear in the game picker, be startable, and then fail at the turn
 * route, which branches on none of this.
 */
export interface PracticeGame {
  id: string
  name: string
  tagline: string
  /** What an offering *is* in this game. */
  offeringIs: string
  judge: 'verifier'
  pieces: {
    playerMove: string
    interpreter: string
    responseRule: string
    worldState: string
    constraint: string
    goal: string
  }
  persona: string
  worldKeys: { key: string; description: string }[]
  openingPrompt: string
}

export const TRAVERSAL_GAME: PracticeGame = {
  id: 'traversal',
  name: 'Traversal',
  tagline: 'Offer something you know. Where it takes you is the graph\'s decision.',
  offeringIs: 'A concept you have already reached, used as a key',
  judge: 'verifier',
  pieces: {
    playerMove: 'A concept you hold, offered as a key.',
    interpreter: 'The graph — a key opens what it is a prerequisite of.',
    responseRule: 'A problem from wherever you arrived, ruled mechanically.',
    worldState: 'The concepts reached, what fixed each one, and the order of arrival.',
    // navigation's constraint, verbatim. It needed no rewriting, which is the
    // evidence that the reframing is real rather than a coat of paint.
    constraint: 'You pick the key, never the door.',
    goal: 'Reach the far side of a subject by a route you can retrace.',
  },
  persona:
    'You are the concept itself, described by someone who has just understood it. You lead with ' +
    'what it lets you do that you could not do before, then with the one thing people get wrong ' +
    'about it. You never say a step is easy and you never say "simply".',
  worldKeys: [
    { key: 'here', description: 'The concept you are standing in.' },
    { key: 'reached', description: 'Concepts reached so far, each with the one point that fixed it.' },
    { key: 'route', description: 'The order of introduction, newest last.' },
  ],
  openingPrompt: 'Pick somewhere to start. After that, the door is not your decision.',
}
