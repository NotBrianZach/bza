'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, ArrowLeft, Loader2, Music2, RadioTower, Trash2,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { ensureSession } from '@/lib/anonAuth'
import { track } from '@/lib/analytics'
import { timeAgo } from '@/lib/timeAgo'
import { listenQueries } from '@/lib/queries/listen'
import { ACCENT_CLASSES, getMode } from '@/lib/listen/modes'
import type { ListenModeId, ListenSession } from '@/lib/listen/types'
import ListenAlongGame from '@/components/listen/ListenAlongGame'
import ModePicker from '@/components/listen/ModePicker'

export const dynamic = 'force-dynamic'

interface SpotifyStatus {
  connected: boolean
  isPremium?: boolean
  displayName?: string
}

function ListenPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const gameId = params.get('game')
  const connectResult = params.get('spotify')

  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [sessions, setSessions] = useState<ListenSession[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<ListenModeId | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await ensureSession()
      try {
        const [statusRes, list] = await Promise.all([
          fetch('/api/spotify/status').then(r => r.json()).catch(() => ({ connected: false })),
          listenQueries.listSessions().catch(() => [] as ListenSession[]),
        ])
        if (cancelled) return
        setStatus(statusRes)
        setSessions(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const startGame = useCallback(async (mode: ListenModeId) => {
    setStarting(mode)
    setError('')
    try {
      const session = await listenQueries.createSession(mode)
      track('listen_game_started', { mode })
      setSessions(s => [session, ...s])
      router.push(`/listen?game=${session.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Could not start that game')
    } finally {
      setStarting(null)
    }
  }, [router])

  const removeGame = useCallback(async (id: string) => {
    await listenQueries.deleteSession(id)
    setSessions(s => s.filter(x => x.id !== id))
  }, [])

  const activeSession = gameId ? sessions.find(s => s.id === gameId) : undefined

  // Deep link straight to a game: fetch the one session we need.
  const [deepLinked, setDeepLinked] = useState<ListenSession | null>(null)
  useEffect(() => {
    if (!gameId || activeSession || loading) { setDeepLinked(null); return }
    let cancelled = false
    listenQueries.getSession(gameId)
      .then(s => { if (!cancelled) setDeepLinked(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [gameId, activeSession, loading])

  const current = activeSession ?? deepLinked ?? null

  if (current) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ListenAlongGame
          session={current}
          isPremium={!!status?.isPremium}
          onBack={() => router.push('/listen')}
          onSessionChange={next => setSessions(s => s.map(x => (x.id === next.id ? next : x)))}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={15} /> Library
          </Link>
          <div className="flex items-center gap-3">
            {status?.connected && (
              <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500">
                Spotify · {status.displayName || 'connected'}{status.isPremium ? ' · Premium' : ''}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 mb-2">
          <RadioTower size={28} className="text-indigo-500 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Listen Along</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Games where the song does the work in the rules.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mb-8">
          Every game here runs the same loop — <em>your song → a reading of it → a reply song → a new
          fact about the world</em>. The reply is a real track, so each turn is a conversation between
          two pieces of music, and whatever it lands on becomes something you both have to reckon
          with. What changes between modes is what a song <em>is</em>, and who gets to interpret it.
        </p>

        {connectResult === 'error' && (
          <div className="mb-6 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">Spotify did not connect. Try again.</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : !status?.connected ? (
          <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
              <Music2 size={22} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Connect Spotify to play</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 max-w-md mx-auto">
              Moves are real songs, so the games run on Spotify search. A free account is enough —
              Premium adds full-length playback in the page instead of previews.
            </p>
            <a
              href="/api/spotify/auth?returnTo=/listen"
              className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-white text-sm font-semibold transition-colors"
            >
              <Music2 size={15} /> Connect Spotify
            </a>
          </div>
        ) : (
          <>
            {sessions.length > 0 && (
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Your games</h2>
                <ul className="space-y-2">
                  {sessions.map(s => {
                    const mode = getMode(s.mode)
                    const accent = ACCENT_CLASSES[mode?.accent ?? 'indigo']
                    return (
                      <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                        <Link href={`/listen?game=${s.id}`} className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.title}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${accent.chip}`}>
                              {mode?.name ?? s.mode}
                            </span>
                            {s.status === 'finished' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">finished</span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {s.turn_count} turn{s.turn_count === 1 ? '' : 's'} · {timeAgo(new Date(s.updated_at))}
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

            <section>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Start a game</h2>
              {error && <p className="mb-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
              <ModePicker onStart={startGame} starting={starting} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default function ListenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    }>
      <ListenPageInner />
    </Suspense>
  )
}
