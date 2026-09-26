import { supabase } from '../supabase'
import { getMode } from '../listen/modes'
import type { ListenModeId, ListenSession, ListenTurn } from '../listen/types'

/**
 * Listen Along session storage.
 *
 * Reads and writes go straight to Supabase under RLS, like the rest of the
 * query layer — the only server route the section needs is the one that plays a
 * turn, because that is the only part that has to hold an API key.
 */
export const listenQueries = {
  async listSessions(limit = 30): Promise<ListenSession[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ListenSession[]
  },

  async createSession(mode: ListenModeId, title?: string): Promise<ListenSession> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sign in to start a game')

    const def = getMode(mode)
    if (!def) throw new Error(`Unknown game mode "${mode}"`)

    const { data, error } = await supabase
      .from('listen_sessions')
      .insert({
        user_id: user.id,
        mode,
        title: title?.trim() || def.name,
        // Snapshot the rules so editing the registry later cannot change how an
        // in-progress game is read.
        rules: {
          songIs: def.songIs,
          judge: def.judge,
          pieces: def.pieces,
          replyRule: def.replyRule,
        },
        world_state: def.seedWorld,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as unknown as ListenSession
  },

  async getSession(id: string): Promise<ListenSession | null> {
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as unknown as ListenSession) ?? null
  },

  async getTurns(sessionId: string): Promise<ListenTurn[]> {
    const { data, error } = await supabase
      .from('listen_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as ListenTurn[]
  },

  async finishSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('listen_sessions')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from('listen_sessions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async renameSession(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('listen_sessions')
      .update({ title: title.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
