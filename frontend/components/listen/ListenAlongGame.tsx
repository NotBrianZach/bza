'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Flag, Globe2, Link2, Loader2, RadioTower, SignalZero,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { listenQueries } from '@/lib/queries/listen'
import { ACCENT_CLASSES, getMode, wantsPrediction } from '@/lib/listen/modes'
import type { ListenSession, ListenTurn, TrackRef } from '@/lib/listen/types'
import { useSpotifyPlayer } from './useSpotifyPlayer'
import TrackCard from './TrackCard'
import TrackSearch from './TrackSearch'

/**
 * The game board.
 *
 * One component serves all eight modes: the mode registry supplies the rules
 * text, which world keys to show, and whether the player is asked for a
 * prediction. Nothing here branches on the mode id except through that data.
 */
export default function ListenAlongGame({
  session: initialSession,
  isPremium,
  onBack,
  onSessionChange,
}: {
  session: ListenSession
  isPremium: boolean
  onBack: () => void
  onSessionChange?: (s: ListenSession) => void
}) {
  const [session, setSession] = useState(initialSession)
  const [turns, setTurns] = useState<ListenTurn[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState('')

  const player = useSpotifyPlayer(isPremium)
  const mode = getMode(session.mode)
  const accent = ACCENT_CLASSES[mode?.accent ?? 'indigo']

  useEffect(() => {
    let cancelled = false
    listenQueries.getTurns(session.id)
      .then(t => { if (!cancelled) setTurns(t) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session.id])

  const updateSession = useCallback((next: ListenSession) => {
    setSession(next)
    onSessionChange?.(next)
  }, [onSessionChange])

  const playMove = useCallback(async (chosen: TrackRef) => {
    setPending(true)
    setError('')
    try {
      const res = await authedFetch('/api/listen/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          trackId: chosen.id,
          prediction: prediction.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'That turn did not go through')
      setTurns(t => [...t, data.turn])
      if (data.session) updateSession(data.session)
      track('listen_turn_played', {
        mode: session.mode,
        turn: data.turn?.turn_index,
        legal: data.turn?.legal,
        missed: !!data.missed,
      })
      setPrediction('')
    } catch (e: any) {
      setError(e?.message ?? 'That turn did not go through')
    } finally {
      setPending(false)
    }
  }, [session.id, session.mode, prediction, updateSession])

  const finish = useCallback(async () => {
    await listenQueries.finishSession(session.id)
    updateSession({ ...session, status: 'finished' })
  }, [session, updateSession])

  const facts: string[] = useMemo(
    () => (Array.isArray(session.world_state?.facts) ? session.world_state.facts : []),
    [session.world_state],
  )

  if (!mode) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">This game uses mode “{session.mode}”, which is no longer in the registry.</p>
        <button onClick={onBack} className="btn btn-secondary text-sm mt-4">Back</button>
      </div>
    )
  }

  const isOver = session.status === 'finished'
  const lastTurn = turns[turns.length - 1]
  const onTheTable = lastTurn?.legal ? (lastTurn.reply_track ?? lastTurn.move_track) : null

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2">
            <ArrowLeft size={14} /> All games
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{session.title}</h1>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${accent.chip}`}>{mode.name}</span>
            {isOver && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Finished</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A song here is {mode.songIs.toLowerCase()}. {mode.pieces.constraint}
          </p>
        </div>
        {!isOver && turns.length > 0 && (
          <button onClick={finish} title="End this game" className="btn btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0">
            <Flag size={14} /> Finish
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        {/* Turn log + composer */}
        <div className="min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : turns.length === 0 ? (
            <div className={`rounded-2xl border ${accent.ring} ${accent.bg} p-6 mb-6`}>
              <RadioTower size={22} className={`${accent.text} mb-3`} />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{mode.openingPrompt}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{mode.pieces.goal}</p>
            </div>
          ) : (
            <ol className="space-y-6 mb-6">
              {turns.map(turn => (
                <li key={turn.id}>
                  <TurnBlock turn={turn} player={player} accentText={accent.text} />
                </li>
              ))}
            </ol>
          )}

          {!isOver && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {turns.length === 0 ? 'Your opening move' : `Your move — turn ${turns.length + 1}`}
                </p>
                {onTheTable && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[55%]">
                    answering <span className="font-medium">{onTheTable.name}</span>
                  </p>
                )}
              </div>

              {wantsPrediction(mode) && (
                <input
                  type="text"
                  value={prediction}
                  onChange={e => setPrediction(e.target.value)}
                  disabled={pending}
                  placeholder="Your prediction — what will the dial answer with?"
                  className="w-full mb-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                />
              )}

              <TrackSearch onPick={playMove} disabled={pending} />

              {pending && (
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Loader2 size={13} className="animate-spin" /> The dial is turning…
                </p>
              )}
              {error && (
                <p className="mt-3 flex items-start gap-2 text-xs text-red-500 dark:text-red-400">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* World state */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <Globe2 size={14} className={accent.text} />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">The world</p>
              <span className="ml-auto text-[11px] text-gray-400">{session.turn_count} turn{session.turn_count === 1 ? '' : 's'}</span>
            </div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-700">
              {mode.worldKeys.map(({ key, description }) => (
                <div key={key} className="px-4 py-3">
                  <dt title={description} className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{key}</dt>
                  <dd className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <WorldValue value={session.world_state?.[key]} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <CheckCircle2 size={14} className={accent.text} />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Established</p>
              <span className="ml-auto text-[11px] text-gray-400">{facts.length}</span>
            </div>
            {facts.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Nothing yet. Play a song.</p>
            ) : (
              <ul className="px-4 py-3 space-y-2">
                {facts.map((f, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex gap-2">
                    <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">{i + 1}.</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Who interprets</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{mode.pieces.interpreter}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-3 mb-2">What comes back</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{mode.pieces.responseRule}</p>
          </div>

          {isPremium && player.error && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{player.error}</p>
          )}
        </aside>
      </div>
    </div>
  )
}

/** One exchange: the move, how it was read, the reply, and what it established. */
function TurnBlock({ turn, player, accentText }: {
  turn: ListenTurn
  player: ReturnType<typeof useSpotifyPlayer>
  accentText: string
}) {
  if (!turn.legal) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 mb-3">
          <SignalZero size={13} /> Turn {turn.turn_index + 1} — move rejected, nothing links
        </p>
        <TrackCard track={turn.move_track} player={player} label="you played" compact />
        {turn.reading && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{turn.reading}</p>}
        {turn.narration && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{turn.narration}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Turn {turn.turn_index + 1}</p>

      <TrackCard track={turn.move_track} player={player} label="you sent" />

      {turn.links.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-1">
          {turn.links.map(l => (
            <span
              key={l.id}
              title={l.detail}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <Link2 size={9} /> {l.label}
            </span>
          ))}
        </div>
      )}

      {turn.reading && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-1 italic">{turn.reading}</p>
      )}

      {turn.reply_track ? (
        <TrackCard track={turn.reply_track} player={player} label="came back" />
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SignalZero size={13} /> The dial reached for{turn.reply_query ? ` “${turn.reply_query}”` : ' something'} and found nothing real.
          </p>
        </div>
      )}

      {turn.narration && (
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pl-1">{turn.narration}</p>
      )}

      {turn.facts.length > 0 && (
        <ul className="pl-1 space-y-1">
          {turn.facts.map((f, i) => (
            <li key={i} className={`text-xs ${accentText} leading-relaxed flex gap-1.5`}>
              <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" /> <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** World values are mode-defined JSON, so render whatever shape turns up. */
function WorldValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 dark:text-gray-500">—</span>
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400 dark:text-gray-500">—</span>
    return (
      <ul className="space-y-1">
        {value.slice(-6).map((v, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">·</span>
            <span><WorldValue value={v} /></span>
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-gray-400 dark:text-gray-500">—</span>
    return (
      <span className="space-y-0.5 block">
        {entries.map(([k, v]) => (
          <span key={k} className="block">
            <span className="text-gray-400 dark:text-gray-500">{k}: </span>
            <WorldValue value={v} />
          </span>
        ))}
      </span>
    )
  }
  return <span>{String(value)}</span>
}
