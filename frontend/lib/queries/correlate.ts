import { supabase } from '../supabase'
import { getGame } from '../correlate/games'
import { resolveMedia } from '../correlate/media'
import { resolveRelations } from '../correlate/relations'
import type {
  CorrelationSession, CorrelationTurn, MediumId,
} from '../correlate/types'

/**
 * Correlation-game session storage.
 *
 * Reads and writes go straight to Supabase under RLS, like the rest of the query
 * layer — the only server routes the section needs are the one that plays a turn
 * (it holds an API key) and the ones that search a catalogue (they hold a shared
 * rate limit).
 *
 * The tables are still named `listen_sessions` / `listen_turns`. Renaming them
 * would cost a migration plus four RLS policies and buy nothing a reader of this
 * file can see.
 */
export const correlateQueries = {
  async listSessions(limit = 30): Promise<CorrelationSession[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as CorrelationSession[]
  },

  /**
   * Start a game.
   *
   * `available` is the media list from /api/offerings/media — the client cannot
   * know whether the film & TV credential is present, so the server tells it and
   * the session records the intersection. The scope is snapshotted for the same
   * reason the rules are: a game in progress should not silently change shape
   * when the build does.
   */
  async createSession(
    gameId: string,
    available: MediumId[],
    title?: string,
  ): Promise<CorrelationSession> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sign in to start a game')

    const def = getGame(gameId)
    if (!def) throw new Error(`Unknown game "${gameId}"`)

    const wanted = resolveMedia(def.media)
    const media = wanted.filter(m => available.includes(m))
    if (media.length === 0) throw new Error('None of this game’s media are available right now')

    const { data, error } = await supabase
      .from('listen_sessions')
      .insert({
        user_id: user.id,
        mode: gameId,
        title: title?.trim() || def.name,
        rules: {
          offeringIs: def.offeringIs,
          judge: def.judge,
          pieces: def.pieces,
          replyRule: def.replyRule,
          declaredRelation: def.declaredRelation,
        },
        media,
        relations: resolveRelations(def.relations),
        world_state: def.seedWorld,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as unknown as CorrelationSession
  },

  async getSession(id: string): Promise<CorrelationSession | null> {
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as unknown as CorrelationSession) ?? null
  },

  async getTurns(sessionId: string): Promise<CorrelationTurn[]> {
    const { data, error } = await supabase
      .from('listen_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as CorrelationTurn[]
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

/** Media this deployment can serve. Cached per page load; it cannot change under us. */
let _mediaPromise: Promise<MediumId[]> | null = null
export function fetchAvailableMedia(): Promise<MediumId[]> {
  if (!_mediaPromise) {
    _mediaPromise = fetch('/api/offerings/media')
      .then(r => r.json())
      .then(d => (Array.isArray(d?.media) ? d.media as MediumId[] : ['music' as MediumId]))
      .catch(() => ['music' as MediumId])
  }
  return _mediaPromise
}
