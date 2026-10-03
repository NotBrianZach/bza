import { supabase } from '../supabase'
import { getGame } from '../correlate/games'
import { resolveMedia } from '../correlate/media'
import { resolveRelations } from '../correlate/relations'
import { normalizeTuning, type Tuning } from '../correlate/tuning'
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
  /** Live games, most recently played first. Trashed ones are excluded here
   *  rather than by every caller, so forgetting the filter is not possible. */
  async listSessions(limit = 30): Promise<CorrelationSession[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as CorrelationSession[]
  },

  /** What is in the trash, most recently trashed first. */
  async listTrashedSessions(limit = 30): Promise<CorrelationSession[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('listen_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
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
        // Neutral. A game starts weighted the way the game describes itself, and
        // the empty object is what "nobody has touched this" is stored as.
        tuning: {},
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

  /**
   * Move a game to the trash.
   *
   * `updated_at` is deliberately left alone: the trash is ordered by
   * `deleted_at`, and bumping updated_at would mean a restored game jumped to
   * the top of "your games" as if it had just been played.
   */
  async trashSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('listen_sessions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  /** Take a game back out of the trash, exactly where it was. */
  async restoreSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('listen_sessions')
      .update({ deleted_at: null })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  /**
   * Permanently delete one game. Cascades to its turns, so the chain is gone —
   * this is the only destructive call in the file, and the trash exists so that
   * nothing reaches it by accident.
   */
  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from('listen_sessions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  /**
   * Permanently delete everything in the trash.
   *
   * Scoped by user_id as well as by deleted_at. RLS would stop a cross-user
   * delete anyway, but a `delete` whose only predicate is "trashed" is the kind
   * of statement that becomes wrong the moment a policy is loosened.
   */
  async emptyTrash(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('listen_sessions')
      .delete()
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
    if (error) throw new Error(error.message)
  },

  /**
   * Save the weighting. Fire-and-forget from the controls, because the turn route
   * is also sent the current value and persists it — so a save that loses a race
   * with a move costs nothing, and the move still plays under what the controls
   * said when it was taken.
   *
   * `media` is needed to canonicalise: a weight for a medium this session does not
   * play would mute nothing and should not be stored.
   */
  async saveTuning(id: string, tuning: Tuning, media: MediumId[]): Promise<void> {
    const { error } = await supabase
      .from('listen_sessions')
      .update({ tuning: normalizeTuning(tuning, media) as any })
      .eq('id', id)
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
