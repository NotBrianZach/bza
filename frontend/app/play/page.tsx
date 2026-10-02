'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Shuffle, Trash2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { ensureSession } from '@/lib/anonAuth'
import { track } from '@/lib/analytics'
import { timeAgo } from '@/lib/timeAgo'
import { correlateQueries, fetchAvailableMedia } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, getGame, retiredGameName } from '@/lib/correlate/games'
import { MEDIUM_LIST, getMedium } from '@/lib/correlate/media'
import { RELATION_LIST } from '@/lib/correlate/relations'
import type { CorrelationSession, MediumId } from '@/lib/correlate/types'
import CorrelationBoard from '@/components/correlate/CorrelationBoard'
import GamePicker from '@/components/correlate/GamePicker'

export const dynamic = 'force-dynamic'

/**
 * AI Play Along — correlation games.
 *
 * There is no connect step and no account gate: the only session is the anonymous
 * one ensureSession() makes. That is a direct consequence of the provider choices —
 * every catalogue here is keyless, and the one that is not (film & TV) is hidden
 * rather than gated.
 */
function PlayPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const gameId = params.get('game')

  const [sessions, setSessions] = useState<CorrelationSession[]>([])
  const [media, setMedia] = useState<MediumId[]>(['music'])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await ensureSession()
      try {
        const [list, available] = await Promise.all([
          correlateQueries.listSessions().catch(() => [] as CorrelationSession[]),
          fetchAvailableMedia(),
        ])
        if (!cancelled) { setSessions(list); setMedia(available) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const startGame = useCallback(async (id: string) => {
    setStarting(id)
    setError('')
    try {
      const session = await correlateQueries.createSession(id, media)
      track('correlate_game_started', { game: id, from: 'play' })
      setSessions(s => [session, ...s])
      router.push(`/play?game=${session.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Could not start that game')
    } finally {
      setStarting(null)
    }
  }, [router, media])

  const removeGame = useCallback(async (id: string) => {
    await correlateQueries.deleteSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }, [])

  const activeSession = gameId ? sessions.find(s => s.id === gameId) : undefined

  // Deep link straight to a game: fetch the one session we need.
  const [deepLinked, setDeepLinked] = useState<CorrelationSession | null>(null)
  useEffect(() => {
    if (!gameId || activeSession || loading) { setDeepLinked(null); return }
    let cancelled = false
    correlateQueries.getSession(gameId)
      .then(s => { if (!cancelled) setDeepLinked(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [gameId, activeSession, loading])

  const current = activeSession ?? deepLinked ?? null

  if (current) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CorrelationBoard
          session={current}
          onBack={() => router.push('/play')}
          onSessionChange={next => setSessions(s => s.map(x => (x.id === next.id ? next : x)))}
        />
      </div>
    )
  }

  const hiddenMedia = MEDIUM_LIST.filter(m => !media.includes(m.id))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={15} /> Library
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 mb-2">
          <Shuffle size={28} className="text-fuchsia-500 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Play Along</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Correlation games — where a turn proposes a connection and makes it perceptible.
            </p>
          </div>
        </div>
        {/* How to take a turn, and nothing else.
            What was here before argued for the section rather than explaining it —
            that the reply is always real, that the medium is the interesting choice.
            Both are true and neither is a player's problem on arrival; the games
            make those points by being played.

            It also stated as universal two things that vary by game, which is why
            the third line points at the cards instead of qualifying here: every card
            already says who names the connection and whether a move can be turned
            away, and says it from `declaredRelation` and `enforcesConstraint` rather
            than from prose that could drift. "Which connection to follow" is kept
            deliberately — in most games you follow one without naming it, and
            following is not declaring. */}
        <ul className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mb-2 space-y-1">
          <li>
            Every game runs the same loop — <em>your offering → a reading of it → a reply
            offering → what carried across</em>.
          </li>
          <li>
            Every turn is two choices: which connection to follow, and <em>which medium can
            carry it</em>.
          </li>
        </ul>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-2xl mb-6">
          Each game below says who names the connection, and whether a move can be turned away.
        </p>

        {/* The two registries, stated once. A player who understands these two lists
            understands every game in the section. */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">What an offering can be</p>
            <ul className="space-y-1.5">
              {MEDIUM_LIST.filter(m => media.includes(m.id)).map(m => (
                <li key={m.id} className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{m.plural}</span>
                  <span className="text-gray-400 dark:text-gray-500"> — {m.provider}</span>
                </li>
              ))}
            </ul>
            {hiddenMedia.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                {hiddenMedia.map(m => m.plural).join(', ')} {hiddenMedia.length === 1 ? 'is' : 'are'} not
                enabled on this deployment.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">What a reply can do</p>
            <ul className="space-y-1.5">
              {RELATION_LIST.map(r => (
                <li key={r.id} className="text-xs text-gray-600 dark:text-gray-300" title={r.example}>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                  <span className="text-gray-400 dark:text-gray-500"> — {r.does}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            {sessions.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Your games</h2>
                <ul className="space-y-2">
                  {sessions.map(s => {
                    const game = getGame(s.mode)
                    const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']
                    const visited: string[] = Array.isArray(s.world_state?.mediaVisited) ? s.world_state.mediaVisited : []
                    return (
                      <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                        <Link href={`/play?game=${s.id}`} className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${accent.chip}`}>
                              {game?.name ?? retiredGameName(s.mode) ?? s.mode}
                            </span>
                            {s.status === 'finished' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">finished</span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {s.turn_count} turn{s.turn_count === 1 ? '' : 's'} · {timeAgo(new Date(s.updated_at))}
                            {visited.length > 1 && ` · ${visited.map(m => getMedium(m)?.plural ?? m).join(' → ')}`}
                          </span>
                        </Link>
                        <button
                          onClick={() => removeGame(s.id)}
                          title="Delete this game"
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {error && <p className="mb-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
            <GamePicker available={media} onStart={startGame} starting={starting} />
          </>
        )}
      </main>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    }>
      <PlayPageInner />
    </Suspense>
  )
}
