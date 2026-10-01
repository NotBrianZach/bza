'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Flag, Globe2, Loader2, Pause,
  Play, Shuffle, SignalZero, SkipBack,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { correlateQueries } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, getGame, retiredGameName, wantsPrediction } from '@/lib/correlate/games'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import type {
  CorrelationSession, CorrelationTurn, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { useOfferingPlayer, audioUrl, type OfferingPlayer } from './useOfferingPlayer'
import OfferingCard from './OfferingCard'
import OfferingPicker, { type MoveDraft } from './OfferingPicker'

/**
 * The board.
 *
 * One component serves every game: the registry supplies the rules text, which
 * world keys to show, which media and relations are in play, and whether the
 * player is asked to declare a relation. Nothing here branches on a game id except
 * through that data.
 */
export default function CorrelationBoard({
  session: initialSession,
  onBack,
  onSessionChange,
}: {
  session: CorrelationSession
  onBack: () => void
  onSessionChange?: (s: CorrelationSession) => void
}) {
  const [session, setSession] = useState(initialSession)
  const [turns, setTurns] = useState<CorrelationTurn[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [prediction, setPrediction] = useState('')

  const player = useOfferingPlayer()
  const game = getGame(session.mode)
  const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']

  useEffect(() => {
    let cancelled = false
    correlateQueries.getTurns(session.id)
      .then(t => { if (!cancelled) setTurns(t) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session.id])

  /**
   * The chain, in play order: each legal turn contributes the move and then the
   * reply it drew.
   *
   * Rejected turns are left out — a move that did not connect never joined the
   * chain, so it should not be in the thing you look back over.
   */
  const chain = useMemo(
    () => turns
      .filter(t => t.legal)
      .flatMap(t => [t.move_offering, t.reply_offering])
      .filter((o): o is Offering => !!o?.id),
    [turns],
  )

  /** Only the audible part can play itself; the rest is stepped through by eye. */
  const audible = useMemo(() => chain.filter(o => !!audioUrl(o)), [chain])
  const playingIndex = player.current ? audible.findIndex(o => o.id === player.current!.id) : -1

  const mediaVisited = useMemo(
    () => [...new Set(chain.map(o => o.medium))],
    [chain],
  )

  const relations: RelationId[] = useMemo(
    () => (Array.isArray(session.relations) && session.relations.length > 0
      ? session.relations
      : resolveRelations(game?.relations ?? 'all')),
    [session.relations, game],
  )

  const media: MediumId[] = useMemo(
    () => (Array.isArray(session.media) && session.media.length > 0 ? session.media : ['music']),
    [session.media],
  )

  const spent = useMemo(
    () => spentRelations(turns.map(t => ({ relation: t.relation, legal: t.legal })), 1),
    [turns],
  )

  const updateSession = useCallback((next: CorrelationSession) => {
    setSession(next)
    onSessionChange?.(next)
  }, [onSessionChange])

  const play = useCallback(async (draft: MoveDraft) => {
    setPending(true)
    setError('')
    setNotice('')
    setProblems([])
    try {
      const res = await authedFetch('/api/correlate/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          ...draft,
          prediction: prediction.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (Array.isArray(data.problems)) setProblems(data.problems)
        throw new Error(data.error ?? 'That turn did not go through')
      }
      setTurns(t => [...t, data.turn])
      if (data.session) updateSession(data.session)
      // Not an error any more: the pipeline guarantees a real reply, so the only
      // thing worth surfacing is that it took more than one attempt to get one.
      if (data.replySource && data.replySource !== 'interpreter') {
        setNotice(data.replySource === 'retry'
          ? 'The first answer could not be found, so it answered again.'
          : 'Two answers could not be found, so this one was searched out from your move.')
      }
      track('correlate_turn_played', {
        game: session.mode,
        medium: draft.medium,
        relation: data.turn?.relation,
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
    await correlateQueries.finishSession(session.id)
    updateSession({ ...session, status: 'finished' })
  }, [session, updateSession])

  const facts: string[] = useMemo(
    () => (Array.isArray(session.world_state?.facts) ? session.world_state.facts : []),
    [session.world_state],
  )

  // A session can outlive its game. Night Radio was retired along with the "dial"
  // concept it ran on, and telling someone their game no longer exists is better
  // than showing them a lookup failure — or worse, silently rehoming the session
  // into a game with different rules, which would rewrite a chain they played.
  if (!game) {
    const retired = retiredGameName(session.mode)
    const plural = session.turn_count === 1 ? '' : 's'
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4">
          <ArrowLeft size={14} /> All games
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{session.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {retired
            ? `${retired} has been retired, so this game cannot take another turn. Its ${session.turn_count} turn${plural} are still stored — nothing was deleted — but there is no interpreter left to read a new move.`
            : `This session names game "${session.mode}", which is not in the registry, so it cannot take another turn.`}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-3">
          Tag is the closest thing to it — the same exchange, judged by whoever is paying attention
          rather than by a radio operator.
        </p>
      </div>
    )
  }

  const isOver = session.status === 'finished'
  const lastTurn = turns[turns.length - 1]
  const onTheTable = lastTurn?.legal ? (lastTurn.reply_offering ?? lastTurn.move_offering) : null

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
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${accent.chip}`}>{game.name}</span>
            {isOver && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Finished</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            An offering here is {game.offeringIs.toLowerCase()}. {game.pieces.constraint}
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
              <Shuffle size={22} className={`${accent.text} mb-3`} />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.openingPrompt}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{game.pieces.goal}</p>
            </div>
          ) : (
            <>
              {/* Listen back to the audible part of the chain: one <audio> element
                  walks the queue, so it plays straight through without a click per
                  item. No account and no subscription. */}
              {audible.length > 1 && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                  <button
                    onClick={() => (playingIndex >= 0 ? player.toggle() : player.playQueue(audible))}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110 transition-all`}
                  >
                    {playingIndex >= 0 && !player.paused
                      ? <><Pause size={13} /> Pause</>
                      : <><Play size={13} /> Play what can be heard</>}
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 min-w-0 truncate">
                    {playingIndex >= 0
                      ? `${playingIndex + 1} of ${audible.length} Â· ${player.current?.title ?? ''}`
                      : `${audible.length} of ${chain.length} in the chain have audio Â· 30s previews`}
                  </p>
                  {playingIndex >= 0 && (
                    <button
                      onClick={() => player.playQueue(audible)}
                      title="Start again from the first"
                      className="ml-auto flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <SkipBack size={13} />
                    </button>
                  )}
                </div>
              )}

              {player.error && (
                <p className="mb-4 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {player.error}
                </p>
              )}

              <ol className="space-y-6 mb-6">
                {turns.map(turn => (
                  <li key={turn.id}>
                    <TurnBlock turn={turn} player={player} accentText={accent.text} />
                  </li>
                ))}
              </ol>
            </>
          )}

          {!isOver && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {turns.length === 0 ? 'Your opening offering' : `Your move — turn ${turns.length + 1}`}
                </p>
                {onTheTable && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[55%]">
                    answering <span className="font-medium">{onTheTable.title}</span>
                    {' '}<span className="text-gray-300 dark:text-gray-600">({getMedium(onTheTable.medium)?.plural})</span>
                  </p>
                )}
              </div>

              {wantsPrediction(game) && (
                <input
                  type="text"
                  value={prediction}
                  onChange={e => setPrediction(e.target.value)}
                  disabled={pending}
                  placeholder="Your prediction — what will come back?"
                  className="w-full mb-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                />
              )}

              <OfferingPicker
                media={media}
                relations={relations}
                declaredRelation={game.declaredRelation}
                spentRelations={spent}
                previousMedium={onTheTable?.medium ?? null}
                disabled={pending}
                onSubmit={play}
              />

              {problems.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {problems.map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {PROBLEM_TEXT[p] ?? p}
                    </li>
                  ))}
                </ul>
              )}
              {notice && (
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{notice}</p>
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
          {mediaVisited.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Media crossed Â· {mediaVisited.length} of {media.length}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {media.map(id => {
                  const visited = mediaVisited.includes(id)
                  return (
                    <span
                      key={id}
                      className={`text-[11px] px-2 py-0.5 rounded-full ${visited ? accent.chip : 'bg-gray-100 text-gray-400 dark:bg-gray-700/50 dark:text-gray-500'}`}
                    >
                      {getMedium(id)?.plural ?? id}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
              <Globe2 size={14} className={accent.text} />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">The world</p>
              <span className="ml-auto text-[11px] text-gray-400">{session.turn_count} turn{session.turn_count === 1 ? '' : 's'}</span>
            </div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-700">
              {game.worldKeys.map(({ key, description }) => (
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
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">Nothing yet. Offer something.</p>
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
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{game.pieces.interpreter}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-3 mb-2">What comes back</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{game.pieces.responseRule}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Mirrors PROBLEM_COPY in lib/offerings/composed.ts, which is server-side. */
const PROBLEM_TEXT: Record<string, string> = {
  'no-title': 'Give it a name, so it can be referred to later.',
  'no-steps': 'Break it into at least one concrete step.',
  'too-many-steps': 'Five steps is the most this can hold.',
  'vague-steps': 'At least one step is too short to act on. Say what actually moves, and where to.',
  'no-framing': 'Say which part matters.',
}

/** One exchange: the move, how it was read, the reply, and what carried across. */
function TurnBlock({ turn, player, accentText }: {
  turn: CorrelationTurn
  player: OfferingPlayer
  accentText: string
}) {
  if (!turn.legal) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 mb-3">
          <SignalZero size={13} /> Turn {turn.turn_index + 1} — turned away, the connection did not hold
        </p>
        <OfferingCard offering={turn.move_offering} player={player} label="you offered" compact />
        {turn.claimed_relation && (
          <p className="mt-2 text-[11px] text-red-500 dark:text-red-400">
            claimed <span className="font-medium">{RELATIONS[turn.claimed_relation]?.name ?? turn.claimed_relation}</span>
          </p>
        )}
        {turn.reading && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{turn.reading}</p>}
        {turn.narration && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{turn.narration}</p>}
      </div>
    )
  }

  const crossed = turn.reply_offering && turn.reply_offering.medium !== turn.move_offering.medium

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Turn {turn.turn_index + 1}</p>
        {turn.relation && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${accentText}`}>
            {RELATIONS[turn.relation]?.name ?? turn.relation}
          </span>
        )}
        {/* When a player claimed one relation and the interpreter saw another, show
            both. The disagreement is more interesting than either alone. */}
        {turn.claimed_relation && turn.claimed_relation !== turn.relation && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            claimed {RELATIONS[turn.claimed_relation]?.name ?? turn.claimed_relation}
          </span>
        )}
        {crossed && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
            {getMedium(turn.move_offering.medium)?.plural}
            <ArrowRight size={9} />
            {getMedium(turn.reply_offering!.medium)?.plural}
          </span>
        )}
      </div>

      <OfferingCard offering={turn.move_offering} player={player} label="you offered" />

      {turn.reading && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed pl-1 italic">{turn.reading}</p>
      )}

      {turn.reply_offering ? (
        <OfferingCard offering={turn.reply_offering} player={player} label="came back" />
      ) : (
        // Only reachable for turns recorded before the reply pipeline guaranteed
        // an answer: a legal turn is no longer persisted without one, so this is
        // history rather than a current outcome.
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
          <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SignalZero size={13} /> No answer was recorded for this turn
            {turn.reply_query ? ` — it reached for “${turn.reply_query}”` : ''}.
          </p>
        </div>
      )}

      {turn.narration && (
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pl-1">{turn.narration}</p>
      )}

      {/* The point of a cross-medium game: what survived, and what did not. */}
      {(turn.carried || turn.lost) && (
        <div className="pl-1 grid sm:grid-cols-2 gap-2">
          {turn.carried && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-500">carried Â· </span>{turn.carried}
            </p>
          )}
          {turn.lost && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-500">lost Â· </span>{turn.lost}
            </p>
          )}
        </div>
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

/** World values are game-defined JSON, so render whatever shape turns up. */
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
            <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">Â·</span>
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
