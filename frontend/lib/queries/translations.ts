import { supabase } from '../supabase'

export interface BookTranslation {
  id: number
  book_id: number
  page_num: number
  prompt: string
  translated_text: string
  created_at: string
}

export const translationQueries = {
  /** Fetch all stored translations for a book+prompt, keyed by page_num. */
  async listByPrompt(bookId: number, prompt: string): Promise<Record<number, string>> {
    const { data, error } = await supabase
      .from('book_translations')
      .select('page_num, translated_text')
      .eq('book_id', bookId)
      .eq('prompt', prompt)
    if (error) throw error
    const map: Record<number, string> = {}
    for (const row of data ?? []) map[row.page_num] = row.translated_text
    return map
  },

  /** Upsert a single translated page. */
  async upsert(bookId: number, pageNum: number, prompt: string, translatedText: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('book_translations').upsert(
      { user_id: user.id, book_id: bookId, page_num: pageNum, prompt, translated_text: translatedText },
      { onConflict: 'book_id,page_num,prompt' }
    )
  },

  /** Get all distinct prompts that have been used on a book. */
  async listPrompts(bookId: number): Promise<string[]> {
    const { data } = await supabase
      .from('book_translations')
      .select('prompt')
      .eq('book_id', bookId)
    const prompts = [...new Set((data ?? []).map(r => r.prompt))]
    return prompts
  },

  /** Count translated pages for a given book+prompt. */
  async countPages(bookId: number, prompt: string): Promise<number> {
    const { count } = await supabase
      .from('book_translations')
      .select('*', { count: 'exact', head: true })
      .eq('book_id', bookId)
      .eq('prompt', prompt)
    return count ?? 0
  },
}
