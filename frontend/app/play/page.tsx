'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Loader2, RotateCcw, Shuffle, Trash2 } from 'lucide-react'
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

/** The order listSessions() returns, so a restored game lands back in its place. */
const byRecency = (a: CorrelationSession, b: CorrelationSession) =>
  b.updated_at.localeCompare(a.updated_at)

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
  const [trashed, setTrashed] = useState<CorrelationSession[]>([])
  const [showTrash, setShowTrash] = useState(false)
  const [media, setMedia] = useState<MediumId[]>(['music'])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await ensureSession()
      try {
        const [list, binned, available] = await Promise.all([
          correlateQueries.listSessions().catch(() => [] as CorrelationSession[]),
          correlateQueries.listTrashedSessions().catch(() => [] as CorrelationSession[]),
          fetchAvailableMedia(),
        ])
        if (!cancelled) { setSessions(list); setTrashed(binned); setMedia(available) }
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

  /**
   * Move a game to the trash.
   *
   * This button used to hard-delete, which cascaded to every turn in the chain
   * with no confirmation and no way back. Now it is reversible, and the only
   * irreversible act in the section is Empty trash, which asks first.
   */
  const trashGame = useCallback(async (session: CorrelationSession) => {
    setSessions(s => s.filter(x => x.id !== session.id))
    setTrashed(t => [{ ...session, deleted_at: new Date().toISOString() }, ...t])
    setError('')
    try {
      await correlateQueries.trashSession(session.id)
      track('correlate_game_trashed', { game: session.mode, from: 'play' })
    } catch (e: any) {
      setTrashed(t => t.filter(x => x.id !== session.id))
      setSessions(s => [...s, session].sort(byRecency))
      setError(e?.message ?? 'Could not move that game to the trash')
    }
  }, [])

  const restoreGame = useCallback(async (session: CorrelationSession) => {
    setTrashed(t => t.filter(x => x.id !== session.id))
    setSessions(s => [...s, { ...session, deleted_at: null }].sort(byRecency))
    setError('')
    try {
      await correlateQueries.restoreSession(session.id)
    } catch (e: any) {
      setSessions(s => s.filter(x => x.id !== session.id))
      setTrashed(t => [...t, session].sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? '')))
      setError(e?.message ?? 'Could not restore that game')
    }
  }, [])

  const emptyTrash = useCallback(async () => {
    const n = trashed.length
    if (n === 0) return
    if (!confirm(
      `Permanently delete ${n} game${n === 1 ? '' : 's'}? Every turn in ` +
      `${n === 1 ? 'it' : 'them'} goes too, and this cannot be undone.`
    )) return
    const previous = trashed
    setTrashed([])
    setError('')
    try {
      await correlateQueries.emptyTrash()
    } catch (e: any) {
      setTrashed(previous)
      setError(e?.message ?? 'Could not empty the trash')
    }
  }, [trashed])

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
            understands every game in the section.

            This card was headed "What an offering can be", which collided with the
            "An offering is" row on all eleven game cards below — two labels
            defining the same noun, fifteen centimetres apart, answering different
            questions. They are not redundant: this one answers *what material*
            (and is the only place the providers are named), while a game card
            answers *what role* — a clue, an argument, a building material. The
            overlap was in the wording, so the wording is what changed: this card
            names the source, and the cards below say "Plays as". */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Where the offerings come from</p>
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
                          onClick={() => trashGame(s)}
                          title="Move this game to the trash"
                          aria-label={`Move “${s.title}” to the trash`}
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

            {/* Trash. Collapsed, and absent entirely when empty — it is a safety
                net, not a part of the section anyone should have to look at. The
                shape matches the library's trash on the home page deliberately. */}
            {trashed.length > 0 && (
              <section className="mb-10">
                <button
                  onClick={() => setShowTrash(v => !v)}
                  className="flex items-center gap-2 mb-3 group"
                >
                  <Trash2 size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    Trash
                  </h2>
                  <span className="text-xs text-gray-400">
                    · {trashed.length} game{trashed.length === 1 ? '' : 's'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTrash ? 'rotate-180' : ''}`} />
                </button>
                {showTrash && (
                  <div>
                    <ul className="space-y-2 mb-3">
                      {trashed.map(s => {
                        const game = getGame(s.mode)
                        return (
                          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-500 dark:text-gray-400 truncate">{s.title}</span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {game?.name ?? retiredGameName(s.mode) ?? s.mode} · {s.turn_count} turn{s.turn_count === 1 ? '' : 's'}
                                {s.deleted_at && ` · trashed ${timeAgo(new Date(s.deleted_at))}`}
                              </span>
                            </span>
                            <button
                              onClick={() => restoreGame(s)}
                              className="flex items-center gap-1 flex-shrink-0 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                            >
                              <RotateCcw size={12} /> Restore
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <button
                      onClick={emptyTrash}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={12} /> Empty trash
                    </button>
                  </div>
                )}
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
