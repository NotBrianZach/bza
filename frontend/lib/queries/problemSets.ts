import { supabase } from '../supabase'

export interface ProblemSetData {
  problems: Array<{ id: string; title: string; text: string; pageNum: number; isMarkdown?: boolean }>
  labels: Array<{ id: string; name: string; parentId: string | null; collapsed: boolean }>
  labelMap: Record<string, string>
  spaces: Record<string, Array<{ id: string; title: string; content: string; type: string; selected: boolean; collapsed: boolean }>>
  scratchpads: Record<string, string>
}

export const problemSetQueries = {
  async get(bookId: number): Promise<ProblemSetData | null> {
    const { data, error } = await supabase
      .from('problem_sets')
      .select('data')
      .eq('book_id', bookId)
      .maybeSingle()
    if (error) { console.error('Failed to load problem set:', error); return null }
    return data?.data as ProblemSetData | null
  },

  async save(bookId: number, psData: ProblemSetData): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase
      .from('problem_sets')
      .upsert({
        user_id: session.user.id,
        book_id: bookId,
        data: psData,
        updated_at: new Date().toISOString(),
      })
  },
}
