'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Shuffle, Trash2 } from 'lucide-react'
import { track } from '@/lib/analytics'
import { timeAgo } from '@/lib/timeAgo'
import { correlateQueries, fetchAvailableMedia } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, FEATURED_GAMES, getGame } from '@/lib/correlate/games'
import { getMedium, resolveMedia } from '@/lib/correlate/media'
import type { CorrelationSession, MediumId } from '@/lib/correlate/types'

/**
 * Correlation games, on the front page.
 *
 * This used to be a pill in the header, which is where features go to be ignored.
 * It is a strip here, matching how "Due for revisit" presents, and it participates
 * in the home layout machinery so anyone who does not want it can hide or reorder
 * it like any other section.
 *
 * Games in progress come first, because a half-finished chain is a stronger
 * invitation than an empty one. Four featured games follow — named explicitly in
 * FEATURED_GAME_IDS, so reordering the picker cannot silently change what the home
 * page promotes. All eleven live on /play.
 */
/** The order listSessions() returns, so a restored card lands back in its place. */
const byRecency = (a: CorrelationSession, b: CorrelationSession) =>
  b.updated_at.localeCompare(a.updated_at)

export default function CorrelationGamesSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean | null
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<CorrelationSession[]>([])
  const [media, setMedia] = useState<MediumId[]>(['music'])
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')
  // The last game sent to the trash, kept only to offer an undo. Nothing on the
  // front page lists the trash itself — that is /play's job.
  const [trashed, setTrashed] = useState<CorrelationSession | null>(null)

  useEffect(() => {
    fetchAvailableMedia().then(setMedia).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    correlateQueries.listSessions(6)
      // Retired games are filtered out here but NOT on /play. This strip is an
      // invitation — a card for a game that cannot take another turn reads as
      // "Night Radio still exists", which is exactly the wrong thing to say on the
      // front page. /play keeps them, labelled, because there the list is a record
      // of what you have played rather than a prompt to play it.
      .then(s => {
        if (!cancelled) setSessions(s.filter(x => x.status === 'active' && !!getGame(x.mode)))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isAuthenticated])

  const start = useCallback(async (gameId: string) => {
    // Without an account there is nowhere to keep a session, so hand off to /play
    // rather than failing here — it creates an anonymous one on load.
    if (!isAuthenticated) { router.push('/play'); return }
    setStarting(gameId)
    setError('')
    try {
      const session = await correlateQueries.createSession(gameId, media)
      track('correlate_game_started', { game: gameId, from: 'home' })
      router.push(`/play?game=${session.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Could not start that game')
      setStarting(null)
    }
  }, [isAuthenticated, media, router])

  /**
   * Move a game to the trash.
   *
   * Optimistic, and reversible twice over: the card goes immediately, an Undo
   * appears, and a failed write puts the card back where it was rather than at
   * the front of the strip. Nothing here deletes — see /play for the trash and
   * the one button that does.
   */
  const trash = useCallback(async (session: CorrelationSession) => {
    setSessions(list => list.filter(x => x.id !== session.id))
    setTrashed(session)
    setError('')
    try {
      await correlateQueries.trashSession(session.id)
      track('correlate_game_trashed', { game: session.mode, from: 'home' })
    } catch (e: any) {
      setSessions(list => [...list, session].sort(byRecency))
      setTrashed(null)
      setError(e?.message ?? 'Could not move that game to the trash')
    }
  }, [])

  const undoTrash = useCallback(async () => {
    const session = trashed
    if (!session) return
    setTrashed(null)
    try {
      await correlateQueries.restoreSession(session.id)
      setSessions(list => [...list, session].sort(byRecency))
    } catch (e: any) {
      setError(e?.message ?? 'Could not restore that game')
    }
  }, [trashed])

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Shuffle size={16} className="text-fuchsia-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Correlation games</h2>
        <Link href="/play" className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          All eleven <ArrowRight size={12} />
        </Link>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-2xl leading-relaxed">
        Answer a song with a painting, a painting with a stretch, a stretch with a passage from
        something you are reading — or stay where you are. Each turn proposes a connection and
        makes it perceptible, and a change of medium can be the move itself.
      </p>

      {error && <p className="mb-2 text-xs text-red-500 dark:text-red-400">{error}</p>}

      {trashed && (
        <p className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">Moved “{trashed.title}” to the trash.</span>
          <button
            onClick={undoTrash}
            className="flex-shrink-0 font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
          >
            Undo
          </button>
          <Link href="/play" className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:underline">
            Trash
          </Link>
        </p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map(s => {
          const game = getGame(s.mode)
          const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']
          return (
            // The delete button is a sibling of the Link, not a child of it: a
            // button inside an anchor is invalid markup and navigates on click.
            <div key={s.id} className={`group relative flex-shrink-0 w-44 rounded-xl border ${accent.ring} ${accent.bg}`}>
              <Link
                href={`/play?game=${s.id}`}
                className="flex h-full flex-col justify-between p-3 hover:brightness-95 dark:hover:brightness-110 transition-all"
              >
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent.text} mb-1 pr-5`}>
                    {game?.name ?? s.mode}
                  </p>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">{s.title}</p>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                  {s.turn_count} turn{s.turn_count === 1 ? '' : 's'} · {timeAgo(new Date(s.updated_at))}
                </p>
              </Link>
              <button
                onClick={() => trash(s)}
                title="Move this game to the trash"
                aria-label={`Move “${s.title}” to the trash`}
                className="absolute top-1.5 right-1.5 p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-white/70 dark:hover:bg-gray-900/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}

        {FEATURED_GAMES.map(game => {
          const accent = ACCENT_CLASSES[game.accent]
          const playable = resolveMedia(game.media).filter(m => media.includes(m))
          return (
            <button
              key={game.id}
              onClick={() => start(game.id)}
              disabled={starting !== null}
              className="flex-shrink-0 flex flex-col justify-between w-44 text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50"
            >
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1">{game.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 leading-snug">{game.tagline}</p>
              </div>
              <div className="mt-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {playable.slice(0, 3).map(id => (
                    <span key={id} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {getMedium(id)?.plural ?? id}
                    </span>
                  ))}
                  {playable.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 text-gray-400 dark:text-gray-500">+{playable.length - 3}</span>
                  )}
                </div>
                <span className={`flex items-center gap-1 text-[11px] font-medium ${accent.text}`}>
                  {starting === game.id ? <><Loader2 size={11} className="animate-spin" /> Starting…</> : <>Play <ArrowRight size={11} /></>}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
