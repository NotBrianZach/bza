/**
 * The conversation graph.
 *
 * A correlation game used to be a chain: turn N answered turn N-1, and the only
 * thing on the table was whatever came back last. That is a real constraint rather
 * than a neutral default — it means a move you regret is permanent, a reply you
 * loved can only be followed in one direction, and the shape of a long game is a
 * line through a space you were actually exploring.
 *
 * So a turn now names its parent, and several turns may name the same one. The
 * chain becomes the path from a root to wherever you are standing, which is the
 * thing the interpreter is shown and the thing the no-repeated-relation rule is
 * derived from. Everything else about a turn is unchanged.
 *
 * Two kinds of edge, and the distinction matters:
 *
 *   parent_turn_id   What this turn answers. Exactly one, or none for a root.
 *                    Structural: it decides the context, the world, and what is on
 *                    the table.
 *   link_turn_id     An earlier turn this exchange rhymes with, named by the
 *                    interpreter. Zero or one, never structural, and allowed to
 *                    point into another branch entirely — that is most of its
 *                    value, because a correlation between two branches is the
 *                    observation a chain could not make.
 *
 * Pure and dependency-free on purpose: the engine and the board both need exactly
 * this arithmetic, and neither should be the one that owns it.
 */

import type { CorrelationTurn, Offering, RelationId } from './types'

export interface GraphNode {
  turn: CorrelationTurn
  parentId: string | null
  /** Child ids in play order. */
  childIds: string[]
  /** Distance from the root, zero-based. */
  depth: number
}

export interface TurnGraph {
  nodes: Map<string, GraphNode>
  /** Every turn, in the order it was played. */
  order: CorrelationTurn[]
  /** Turns that answer nothing. Normally one; more than one means several threads. */
  rootIds: string[]
}

/** Depth is walked rather than recursed, and this is the cycle guard. */
const MAX_DEPTH = 500

/**
 * Build the graph from a session's turns.
 *
 * A parent id that names a turn outside this set is treated as absent. That covers
 * the only two ways it can happen — a row from another session, and a column this
 * deployment's database does not have yet — and in both cases a root is a better
 * failure than a dangling edge.
 */
export function buildGraph(turns: CorrelationTurn[]): TurnGraph {
  const order = [...turns].sort((a, b) => a.turn_index - b.turn_index)
  const present = new Set(order.map(t => t.id))
  const nodes = new Map<string, GraphNode>()

  for (const turn of order) {
    const parentId = turn.parent_turn_id && present.has(turn.parent_turn_id) && turn.parent_turn_id !== turn.id
      ? turn.parent_turn_id
      : null
    nodes.set(turn.id, { turn, parentId, childIds: [], depth: 0 })
  }

  const rootIds: string[] = []
  for (const turn of order) {
    const node = nodes.get(turn.id)!
    if (node.parentId) nodes.get(node.parentId)!.childIds.push(turn.id)
    else rootIds.push(turn.id)
  }

  for (const turn of order) {
    const node = nodes.get(turn.id)!
    let depth = 0
    let cursor = node.parentId
    while (cursor && depth < MAX_DEPTH) {
      depth++
      cursor = nodes.get(cursor)?.parentId ?? null
    }
    node.depth = depth
  }

  return { nodes, order, rootIds }
}

/** The turns from the root down to `id`, inclusive. Empty when `id` is unknown. */
export function pathTo(graph: TurnGraph, id: string | null): CorrelationTurn[] {
  if (!id) return []
  const path: CorrelationTurn[] = []
  let cursor: string | null = id
  const seen = new Set<string>()
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor)
    const node = graph.nodes.get(cursor)
    if (!node) break
    path.push(node.turn)
    cursor = node.parentId
  }
  return path.reverse()
}

export function childrenOf(graph: TurnGraph, id: string | null): CorrelationTurn[] {
  if (!id) return graph.rootIds.map(r => graph.nodes.get(r)!.turn)
  return (graph.nodes.get(id)?.childIds ?? []).map(c => graph.nodes.get(c)!.turn)
}

export function parentOf(graph: TurnGraph, id: string): CorrelationTurn | null {
  const parentId = graph.nodes.get(id)?.parentId
  return parentId ? graph.nodes.get(parentId)?.turn ?? null : null
}

/** The other turns that answer the same thing this one does. */
export function siblingsOf(graph: TurnGraph, id: string): CorrelationTurn[] {
  const node = graph.nodes.get(id)
  if (!node) return []
  return childrenOf(graph, node.parentId).filter(t => t.id !== id)
}

/** Turns nothing has answered yet — the live ends of the game. */
export function leavesOf(graph: TurnGraph): CorrelationTurn[] {
  return graph.order.filter(t => (graph.nodes.get(t.id)?.childIds.length ?? 0) === 0)
}

/** True once the game stops being a line. */
export function hasBranches(graph: TurnGraph): boolean {
  if (graph.rootIds.length > 1) return true
  for (const node of graph.nodes.values()) if (node.childIds.length > 1) return true
  return false
}

/** How many turns hang off this one, transitively. */
export function subtreeSize(graph: TurnGraph, id: string): number {
  let count = 0
  const stack = [...(graph.nodes.get(id)?.childIds ?? [])]
  while (stack.length > 0 && count < graph.order.length) {
    const next = stack.pop()!
    count++
    stack.push(...(graph.nodes.get(next)?.childIds ?? []))
  }
  return count
}

/**
 * Where a player who said nothing about parentage should be answering.
 *
 * The most recently played turn, walked up to the nearest legal one — which for a
 * game that has never branched is exactly "the last legal turn", the rule the chain
 * had. An illegal move established nothing, so it is never the thing on the table;
 * what is on the table is whatever its parent left there.
 */
export function defaultParent(graph: TurnGraph): CorrelationTurn | null {
  for (let i = graph.order.length - 1; i >= 0; i--) {
    const newest = graph.order[i]
    let cursor: CorrelationTurn | null = newest
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor.id)) {
      if (cursor.legal) return cursor
      seen.add(cursor.id)
      cursor = parentOf(graph, cursor.id)
    }
    // Everything above the newest turn is illegal too, so there is nothing on the
    // table anywhere on that branch. Keep looking at older turns rather than
    // concluding the game has no head.
  }
  return null
}

/**
 * What a turn leaves on the table: its reply, or its own move when no reply was
 * recorded. Nothing at all when the move was turned away.
 */
export function offeringOnTable(turn: CorrelationTurn | null): Offering | null {
  if (!turn || !turn.legal) return null
  return turn.reply_offering ?? turn.move_offering ?? null
}

/** Every offering id anywhere on a path, for the exclusion set. */
export function offeringIdsAlong(path: CorrelationTurn[]): string[] {
  const ids: string[] = []
  for (const t of path) {
    if (t.move_offering?.id) ids.push(t.move_offering.id)
    if (t.reply_offering?.id) ids.push(t.reply_offering.id)
  }
  return [...new Set(ids)]
}

/** The relation each legal turn on a path used, oldest first. */
export function relationsAlong(path: CorrelationTurn[]): { relation: RelationId | null; legal: boolean }[] {
  return path.map(t => ({ relation: t.relation, legal: t.legal }))
}

/** The media the replies on a path landed in, oldest first. */
export function replyMediaAlong(path: CorrelationTurn[]) {
  return path.filter(t => t.legal && t.reply_offering).map(t => t.reply_offering!.medium)
}

// ---------------------------------------------------------------------------
// The world, folded along a path
// ---------------------------------------------------------------------------

/**
 * Merge one delta into a world.
 *
 * The single merge rule, used both when a turn is written and when a branch's world
 * is recomputed from scratch — if those two ever disagreed, reopening a game would
 * show a different world than playing it did. Shallow by design: the interpreter
 * returns only changed keys. Facts accumulate rather than replace, so a later turn
 * cannot erase what play established.
 */
export function mergeWorld(
  world: Record<string, any>,
  delta: Record<string, any> | null | undefined,
  facts: string[] = [],
): Record<string, any> {
  const next: Record<string, any> = { ...world, ...(delta ?? {}) }

  const existing: string[] = Array.isArray(world.facts) ? world.facts : []
  const fromDelta: string[] = Array.isArray(delta?.facts)
    ? (delta!.facts as any[]).filter(f => typeof f === 'string')
    : []
  const merged = [...existing, ...fromDelta, ...facts]
  next.facts = merged.filter((f, i) => merged.indexOf(f) === i)

  return next
}

/**
 * The world as it stands at the end of a path.
 *
 * Branching is what forces this to exist. A session-wide `world_state` is coherent
 * only while the game is a line: the moment two branches both establish something
 * about the same place, one of them is reading the other's world and neither is
 * wrong. So the world becomes a property of a path, folded from the deltas the
 * turns on it recorded.
 */
export function worldAlong(
  seed: Record<string, any>,
  path: CorrelationTurn[],
): Record<string, any> {
  let world = mergeWorld({}, seed)
  for (const turn of path) {
    // An illegal move established nothing — that is what being turned away means.
    if (!turn.legal) continue
    world = mergeWorld(world, turn.world_delta, Array.isArray(turn.facts) ? turn.facts : [])
  }
  return world
}

/**
 * The world to play the next turn against.
 *
 * Turns written before the graph existed have no `world_delta`, so folding a path
 * through them loses every key except facts. Those sessions are lines, and a line
 * has exactly one world — the session's own `world_state`, which is complete. So:
 * fold when the fold is trustworthy, and trust the session cache when it is both
 * the only branch and the only complete record.
 *
 * A legacy session that someone now branches gets the fold, lossily and knowingly.
 * There is no branch-correct answer available from a single stored world, and
 * quietly handing both branches the same one would be worse than starting the new
 * branch from less.
 */
export function worldFor(
  seed: Record<string, any>,
  sessionWorld: Record<string, any>,
  graph: TurnGraph,
  path: CorrelationTurn[],
): Record<string, any> {
  const complete = path.every(t => !t.legal || t.world_delta != null)
  if (!complete && !hasBranches(graph)) return sessionWorld
  return worldAlong(seed, path)
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

/**
 * Turns the interpreter may point at as a callback, given where it is playing.
 *
 * Everything already on the path except the parent, plus everything on every other
 * branch. The parent is excluded because the structural edge already says "this
 * answers that", and a link saying it again carries no information.
 */
export function linkableTurns(
  graph: TurnGraph,
  parentId: string | null,
): CorrelationTurn[] {
  return graph.order.filter(t => t.legal && t.id !== parentId)
}

/** Resolve an interpreter's `turn` index to a real turn, or null. */
export function turnByIndex(graph: TurnGraph, index: number): CorrelationTurn | null {
  return graph.order.find(t => t.turn_index === index) ?? null
}
