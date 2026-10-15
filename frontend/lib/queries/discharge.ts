/**
 * Prerequisite discharge — the decision, with no database in it.
 *
 * ── WHY THIS IS ITS OWN FILE ──────────────────────────────────────────────
 *
 * `knowledge-graph.ts` imports the Supabase client at runtime, which puts it out
 * of reach of the test harness in tests/: that harness transpiles modules to
 * CommonJS and requires them directly, and works only because the modules it
 * covers import nothing but types. A traversal with a visited-set over a graph
 * that may contain cycles is exactly the code that should be under test, so it
 * lives here, importing nothing, and `knowledge-graph.ts` keeps the queries.
 *
 * ── WHAT DISCHARGE IS FOR ─────────────────────────────────────────────────
 *
 * SM-2 schedules each node from its own history alone. Pass an advanced concept
 * and its prerequisites still come due on their own clocks, so the learner is
 * asked to re-drill precisely what they just demonstrated. In a graph that is
 * mostly prerequisite structure, that is the dominant inefficiency.
 *
 * ── THE COST, STATED RATHER THAN DODGED ───────────────────────────────────
 *
 * This moves `next_review_at` on rows the learner did not answer, and
 * `lib/concepts/scheduling.ts` warns against exactly that: "propagating credit to
 * a date means rewriting a date, and rewriting dates is how a scheduler's state
 * stops being derivable from its observations." That engine has no due dates at
 * all — strength decays continuously and the most-decayed point is served —
 * specifically so credit could propagate without rewriting anything.
 *
 * bza's scheduler is date-based and is not being rebuilt to match, so the warning
 * holds. Three bounds are what make it tolerable, and each is asserted in
 * tests/discharge-logic.mjs rather than merely intended:
 *
 *   1. EXTEND ONLY. A review can be pushed later, never pulled earlier, so this
 *      can never hide a node that was already due.
 *   2. NEVER PAST THE DEPENDENT. If the advanced concept is due Friday, nothing
 *      underneath it is due later than Friday. The thing resting on a
 *      prerequisite is the upper bound on how stale that prerequisite may get.
 *   3. MASTERED DEPENDENTS ONLY — enforced by the caller, which invokes this only
 *      when `mastered` is true. Since migration 66 that means two consecutive
 *      passes, so a single ~10%-guessable pass discharges nothing. Discharge and
 *      unlocking then rest on the same evidence, which is the point.
 *
 * ── CYCLES ────────────────────────────────────────────────────────────────
 *
 * `knowledge_edges` is deliberately allowed to contain them (migration 65):
 * co-requisite pairs and spiral structure are ordinary in a prerequisite graph
 * whose nodes are one row per concept. The visited-set is therefore load-bearing
 * rather than defensive — a two-cycle would otherwise walk forever.
 *
 * Breadth-first, so a node reached by several paths is credited once at its
 * SHORTEST distance, which is also the most generous reading and the right
 * answer for a mutual pair: each member discharges the other, once.
 */

export interface DischargeEdge {
  /** The prerequisite. Discharge walks from `to_node` back to here. */
  from_node: number
  to_node: number
}

export interface DischargeCandidate {
  id: number
  next_review_at: string
  /** Only mastered nodes are in the review rotation; others are skipped. */
  mastered: boolean
}

export interface DischargeWrite {
  nodeId: number
  distance: number
  newNextReviewAt: string
}

/**
 * How far back a demonstration carries, and how fast it fades.
 *
 * Each step halves: a direct prerequisite is credited with half the dependent's
 * new interval, its own prerequisite a quarter, and by the fourth step a
 * sixteenth — small enough that the depth cap is a formality rather than a
 * cliff. Both numbers are this project's own, tuned against nothing; the
 * argument beside them is all they have.
 */
export const DISCHARGE_DECAY = 0.5
export const DISCHARGE_MAX_DEPTH = 4

export function planDischarge(args: {
  startId: number
  edges: DischargeEdge[]
  candidates: DischargeCandidate[]
  /** The dependent's NEW interval, post-SM-2. Credit is a fraction of this. */
  intervalDays: number
  /** Bound 2: nothing underneath may be scheduled later than this. */
  dependentNextReviewAt: string
  now: number
  decay?: number
  maxDepth?: number
}): DischargeWrite[] {
  const {
    startId, edges, candidates, intervalDays, dependentNextReviewAt, now,
    decay = DISCHARGE_DECAY, maxDepth = DISCHARGE_MAX_DEPTH,
  } = args

  const ceiling = new Date(dependentNextReviewAt).getTime()
  if (!Number.isFinite(ceiling)) return []

  // Reverse adjacency: for a node, who are its prerequisites.
  const prereqsOf = new Map<number, number[]>()
  for (const e of edges) {
    const list = prereqsOf.get(e.to_node)
    if (list) list.push(e.from_node)
    else prereqsOf.set(e.to_node, [e.from_node])
  }

  const byId = new Map(candidates.map(c => [c.id, c]))
  const writes: DischargeWrite[] = []

  // The start node is pre-visited so a cycle through it cannot credit the very
  // node that was just answered — it already has its own fresh SM-2 schedule,
  // and extending that here would be this function marking its own homework.
  const visited = new Set<number>([startId])
  let frontier = [startId]

  for (let distance = 1; distance <= maxDepth && frontier.length > 0; distance++) {
    const next: number[] = []
    for (const id of frontier) {
      for (const p of prereqsOf.get(id) ?? []) {
        if (visited.has(p)) continue
        visited.add(p)
        next.push(p)
      }
    }
    if (next.length === 0) break

    const creditMs = intervalDays * Math.pow(decay, distance) * 86400_000

    for (const id of next) {
      const node = byId.get(id)
      // Unmastered prerequisites are not in the rotation at all — countDueNodes
      // filters on mastered — so moving the date would write a field nothing
      // reads, and would silently delay the first real review once it did get
      // mastered. They still propagate onward: an unmastered middle node does
      // not sever the chain, it just takes no credit itself.
      if (!node || !node.mastered) continue

      const current = new Date(node.next_review_at).getTime()
      if (!Number.isFinite(current)) continue

      // Bound 1 (max: extend only) then bound 2 (min: not past the dependent).
      // Order matters — swapping them would let a prerequisite already scheduled
      // beyond the ceiling get pulled back to it, which is a shortening.
      const candidate = Math.min(Math.max(current, now + creditMs), ceiling)
      if (candidate <= current) continue

      writes.push({ nodeId: id, distance, newNextReviewAt: new Date(candidate).toISOString() })
    }

    frontier = next
  }

  return writes
}
