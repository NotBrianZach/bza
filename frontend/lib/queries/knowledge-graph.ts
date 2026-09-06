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
    node: { interval_days: number; ease_factor: number; repetitions: number },
    correctCount: number,
    totalCount: number
  ): Promise<void> {
    const score = totalCount > 0 ? correctCount / totalCount : 0
    const mastered = score >= 0.6

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
