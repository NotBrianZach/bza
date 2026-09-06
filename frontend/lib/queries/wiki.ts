import { supabase } from '../supabase'

import type { WikiUpdate } from '../../types'

export const wikiNewsQueries = {
  async getUpdates(bookIds: number[]) {
    if (bookIds.length === 0) return []
    const { data } = await supabase
      .from('wiki_updates')
      .select('*, books(id, title, source_url)')
      .in('book_id', bookIds)
      .eq('dismissed', false)
      .order('checked_at', { ascending: false })
      .limit(100)
    return (data || []) as import('@/types').WikiUpdate[]
  },

  async store(bookId: number, fromRevid: string, toRevid: string, diffRows: { type: number; content: string }[], diffUrl: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    // Upsert on (book_id, to_revid) unique constraint — safe to call multiple times
    await supabase.from('wiki_updates').upsert(
      { book_id: bookId, user_id: user.id, from_revid: fromRevid, to_revid: toRevid, diff_rows: diffRows, diff_url: diffUrl },
      { onConflict: 'book_id,to_revid', ignoreDuplicates: true }
    )
    // Advance the news pointer so next poll starts from here
    await supabase.from('books').update({ wiki_news_revid: toRevid }).eq('id', bookId)
  },

  async dismiss(updateId: number) {
    await supabase.from('wiki_updates').update({ dismissed: true, dismissed_at: new Date().toISOString() }).eq('id', updateId)
  },

  async dismissAll(bookId: number) {
    await supabase.from('wiki_updates').update({ dismissed: true, dismissed_at: new Date().toISOString() }).eq('book_id', bookId).eq('dismissed', false)
  },

  async toggleFollow(bookId: number, followed: boolean) {
    await supabase.from('books').update({ wiki_followed: followed }).eq('id', bookId)
  },
}
