import { supabase } from '../supabase'
import type { PageBookmark } from './types'

export const bookmarksQueries = {
  /**
   * List bookmarks for a book
   */
  async list(bookId: number): Promise<PageBookmark[]> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .select('*')
      .eq('book_id', bookId)
      .order('page_num', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Add a bookmark
   */
  async add(bookId: number, pageNum: number, note?: string): Promise<PageBookmark> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('page_bookmarks')
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum,
        note
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Add a bookmark with Typst content in one step
   */
  async addWithTypst(bookId: number, pageNum: number, typstContent: string, typstTitle?: string, note?: string): Promise<PageBookmark> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('page_bookmarks')
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_num: pageNum,
        note: note ?? null,
        typst_content: typstContent,
        typst_title: typstTitle ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Remove a bookmark
   */
  async remove(bookmarkId: number): Promise<void> {
    const { error } = await supabase
      .from('page_bookmarks')
      .delete()
      .eq('id', bookmarkId)

    if (error) throw error
  },

  /**
   * Update bookmark Typst problem set
   */
  async updateTypst(bookmarkId: number, typstContent: string, typstTitle?: string): Promise<PageBookmark> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .update({ typst_content: typstContent, typst_title: typstTitle ?? null })
      .eq('id', bookmarkId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * List all bookmarks that have a Typst problem set, across all books
   */
  async listWithTypst(): Promise<(PageBookmark & { book_title?: string })[]> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .select('*, books(title)')
      .not('typst_content', 'is', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map((row: any) => ({ ...row, book_title: row.books?.title }))
  },

  /**
   * Update bookmark note
   */
  async update(bookmarkId: number, note: string): Promise<PageBookmark> {
    const { data, error } = await supabase
      .from('page_bookmarks')
      .update({ note })
      .eq('id', bookmarkId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// ===========================================
