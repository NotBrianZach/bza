import { supabase } from '../supabase'

export const scratchpadQueries = {
  async get(bookId: number, pageNum: number): Promise<string> {
    const { data } = await supabase
      .from('typst_scratchpad')
      .select('content')
      .eq('book_id', bookId)
      .eq('page_num', pageNum)
      .single()
    return data?.content ?? ''
  },

  async upsert(bookId: number, pageNum: number, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('typst_scratchpad')
      .upsert(
        { user_id: user.id, book_id: bookId, page_num: pageNum, content, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,book_id,page_num' }
      )
  },
}
