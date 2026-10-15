import { supabase } from '../supabase'
import { planDischarge } from './discharge'
import type { DischargeCandidate, DischargeEdge, DischargeWrite } from './discharge'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// ─────────────────────────────────────────────────────────────────────────────
// Prerequisite discharge — the IO half. The decision is in ./discharge.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply `planDischarge` to the prerequisites of a node just mastered.
 *
 * The whole book's edges and nodes are loaded in two queries rather than walked
 * level by level. A book's graph is 8–15 nodes by construction — the extractor
 * prompt asks for that many — so a breadth-first walk over the database would be
 * several round trips to avoid reading a few dozen rows, and it would put the
 * traversal somewhere a test cannot reach it.
 *
 * RLS does the scoping. Both tables are owner-policied, so these selects return
 * only this user's rows and the discharge cannot cross into another learner's
 * graph even though node ids are global.
 */
async function dischargePrerequisites(
  nodeId: number,
  bookId: number,
  intervalDays: number,
  dependentNextReviewAt: string,
): Promise<DischargeWrite[]> {
  const [{ data: edges }, { data: nodes }] = await Promise.all([
    supabase.from('knowledge_edges').select('from_node, to_node').eq('book_id', bookId),
    supabase.from('knowledge_nodes').select('id, next_review_at, mastered').eq('book_id', bookId),
  ])
  if (!edges || !nodes) return []

  const writes = planDischarge({
    startId: nodeId,
    edges: edges as DischargeEdge[],
    candidates: nodes as DischargeCandidate[],
    intervalDays,
    dependentNextReviewAt,
    now: Date.now(),
  })

  for (const w of writes) {
    await supabase
      .from('knowledge_nodes')
      .update({ next_review_at: w.newNextReviewAt })
      .eq('id', w.nodeId)
  }

  return writes
}

// ===========================================

export const knowledgeGraphQueries = {
  /** Build (or rebuild) the knowledge graph for a book via edge function. */
  async build(bookId: number): Promise<{
    nodes: import('@/types').KnowledgeNode[]
    edges: import('@/types').KnowledgeEdge[]
  }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const res = await fetch(`${FUNCTIONS_BASE}/build-knowledge-graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to build knowledge graph')
    return json
  },

  /** Fetch existing graph for a book (returns empty arrays if none built yet). */
  async get(bookId: number): Promise<{
    nodes: import('@/types').KnowledgeNode[]
    edges: import('@/types').KnowledgeEdge[]
  }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { nodes: [], edges: [] }

    const { data: nodes } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!nodes || nodes.length === 0) return { nodes: [], edges: [] }

    const nodeIds = nodes.map((n: any) => n.id)
    const { data: edges } = await supabase
      .from('knowledge_edges')
      .select('*')
      .in('from_node', nodeIds)

    return {
      nodes: (nodes ?? []) as import('@/types').KnowledgeNode[],
      edges: (edges ?? []) as import('@/types').KnowledgeEdge[],
    }
  },

  /** Update mastery for a node after a quiz session. Applies SM-2. */
  async updateMastery(
    nodeId: number,
    node: {
      book_id: number
      interval_days: number
      ease_factor: number
      repetitions: number
      consecutive_passes?: number
    },
    correctCount: number,
    totalCount: number
  ): Promise<void> {
    const score = totalCount > 0 ? correctCount / totalCount : 0
    const passed = score >= 0.6

    // Two passes in a row, not one.
    //
    // getNodeState locks a node until every prerequisite is mastered, so this
    // boolean is the mastery-learning gate rather than a label. generate-quiz
    // emits 5 questions of 4 options, which makes one 0.6 pass ~10.4% reachable
    // by pure guessing, and nothing limits attempts — so a single-observation
    // gate opens after about ten blind tries. Two independent passes is ~1%, and
    // more to the point it is evidence of retention instead of evidence of one
    // good moment.
    //
    // `consecutive_passes` is optional above only so a caller holding a node
    // fetched before migration 66 still type-checks; `?? 0` then treats it as no
    // progress, which is the safe direction — it delays mastery by one quiz
    // rather than granting it early.
    const consecutive_passes = passed ? (node.consecutive_passes ?? 0) + 1 : 0
    const mastered = consecutive_passes >= 2

    // SM-2 quality: map 0.0-1.0 score to 0-5 quality scale
    const quality = Math.round(score * 5)
    let { interval_days, ease_factor, repetitions } = node

    if (quality < 3) {
      repetitions = 0
      interval_days = 1
    } else {
      if (repetitions === 0) interval_days = 1
      else if (repetitions === 1) interval_days = 6
      else interval_days = Math.round(interval_days * ease_factor)
      repetitions += 1
    }
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    const next_review_at = new Date(Date.now() + interval_days * 86400_000).toISOString()

    await supabase
      .from('knowledge_nodes')
      .update({
        mastery_score: score,
        mastered,
        consecutive_passes,
        interval_days,
        ease_factor,
        repetitions,
        next_review_at,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', nodeId)

    // Demonstrating a concept exercised its prerequisites. Say so.
    //
    // Gated on `mastered` rather than on `passed`: since migration 66 that means
    // two consecutive passes, so discharge rests on the same evidence as
    // unlocking. A single pass — ~10% reachable by guessing on a 5-question,
    // 4-option quiz — moves nothing underneath it.
    if (mastered) {
      await dischargePrerequisites(nodeId, node.book_id, interval_days, next_review_at)
    }
  },

  /** Count mastered nodes due for review across all books. */
  async countDueNodes(): Promise<number> {
    const { count } = await supabase
      .from('knowledge_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('mastered', true)
      .lte('next_review_at', new Date().toISOString())
    return count ?? 0
  },
}
