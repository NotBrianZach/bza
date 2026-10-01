'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Shuffle } from 'lucide-react'
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

      <div className="flex gap-3 overflow-x-auto pb-1">
        {sessions.map(s => {
          const game = getGame(s.mode)
          const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']
          return (
            <Link
              key={s.id}
              href={`/play?game=${s.id}`}
              className={`flex-shrink-0 flex flex-col justify-between w-44 rounded-xl border ${accent.ring} ${accent.bg} p-3 hover:brightness-95 dark:hover:brightness-110 transition-all`}
            >
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent.text} mb-1`}>
                  {game?.name ?? s.mode}
                </p>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">{s.title}</p>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                {s.turn_count} turn{s.turn_count === 1 ? '' : 's'} · {timeAgo(new Date(s.updated_at))}
              </p>
            </Link>
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
