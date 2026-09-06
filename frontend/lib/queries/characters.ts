import { supabase } from '../supabase'
import type { Character } from './types'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

export const characterQueries = {
  /**
   * List characters for a book
   */
  async list(bookId: number): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*, character_mentions(id, page_num, evidence)')
      .eq('book_id', bookId)
      .order('first_page', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Analyze characters in a book (calls Edge Function)
   */
  async analyze(bookId: number, endPage?: number, currentPage?: number, forceRestart?: boolean): Promise<{ characters: any[]; charactersFound: number; hasMore: boolean; pagesAnalyzed: any }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${FUNCTIONS_BASE}/analyze-characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookId, currentPage: currentPage ?? endPage ?? 9999, forceRestart })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Failed to analyze characters')
    }

    return await response.json()
  },

  /**
   * Get character mentions
   */
  async getMentions(characterId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('character_mentions')
      .select('*')
      .eq('character_id', characterId)
      .order('page_num', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Merge two characters: move all mentions from secondary to primary, then delete secondary.
   * The primary character keeps its name/summary. Optionally update summary to combine info.
   */
  async merge(primaryId: number, secondaryId: number): Promise<void> {
    // Move mentions from secondary to primary
    await supabase
      .from('character_mentions')
      .update({ character_id: primaryId })
      .eq('character_id', secondaryId)

    // Move summary history
    await supabase
      .from('character_summary_history')
      .update({ character_id: primaryId })
      .eq('character_id', secondaryId)

    // Update primary's page range
    const { data: mentions } = await supabase
      .from('character_mentions')
      .select('page_num')
      .eq('character_id', primaryId)
    if (mentions?.length) {
      const pages = mentions.map(m => m.page_num)
      await supabase
        .from('characters')
        .update({ first_page: Math.min(...pages), last_page: Math.max(...pages) })
        .eq('id', primaryId)
    }

    // Delete secondary
    await supabase.from('characters').delete().eq('id', secondaryId)
  },

  /** Update character summary/name/type */
  async update(characterId: number, updates: { name?: string; summary?: string; type?: string }): Promise<void> {
    const { error } = await supabase.from('characters').update(updates).eq('id', characterId)
    if (error) throw error
  },

  /** Add a mention */
  async addMention(characterId: number, pageNum: number, evidence?: string): Promise<void> {
    const { error } = await supabase.from('character_mentions').insert({ character_id: characterId, page_num: pageNum, evidence: evidence || null })
    if (error) throw error
  },

  /** Update a mention's evidence */
  async updateMention(mentionId: number, evidence: string): Promise<void> {
    const { error } = await supabase.from('character_mentions').update({ evidence }).eq('id', mentionId)
    if (error) throw error
  },

  /** Delete a mention */
  async deleteMention(mentionId: number): Promise<void> {
    const { error } = await supabase.from('character_mentions').delete().eq('id', mentionId)
    if (error) throw error
  },

  /** Delete a character entirely */
  async deleteCharacter(characterId: number): Promise<void> {
    await supabase.from('character_mentions').delete().eq('character_id', characterId)
    await supabase.from('character_summary_history').delete().eq('character_id', characterId)
    const { error } = await supabase.from('characters').delete().eq('id', characterId)
    if (error) throw error
  },

  /** AI-powered merge suggestions — identifies likely duplicate characters */
  async suggestMerges(bookId: number): Promise<{ suggestions: MergeSuggestion[] }> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${FUNCTIONS_BASE}/suggest-character-merges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ bookId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.message || 'Failed to get merge suggestions')
    }

    return await response.json()
  },
}

export interface MergeSuggestion {
  primary_id: number
  primary_name: string
  merge_ids: number[]
  merge_names: string[]
  confidence: 'high' | 'medium'
  reason: string
}

// ===========================================
// Image Queries
