import { supabase } from '../supabase'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

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
