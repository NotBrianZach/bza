'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CornerDownRight, Flag, GitBranch,
  Globe2, Link2, Loader2, Pause, Play, Repeat, Shuffle, SignalZero, SkipBack,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { correlateQueries } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, getGame, retiredGameName, wantsPrediction } from '@/lib/correlate/games'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  buildGraph, childrenOf, defaultParent, offeringOnTable, pathTo, relationsAlong,
  subtreeSize, worldFor, type TurnGraph,
} from '@/lib/correlate/graph'
import { continuationOf, normalizeTuning, type Tuning } from '@/lib/correlate/tuning'
import {
  isSelfReply, selfRepliesLeft, selfReplyRefusal,
} from '@/lib/correlate/continuation'
import type {
  CorrelationSession, CorrelationTurn, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { useOfferingPlayer, audioUrl, type OfferingPlayer } from './useOfferingPlayer'
import BranchMap from './BranchMap'
import OfferingCard from './OfferingCard'
import OfferingPicker, { type MoveDraft } from './OfferingPicker'
import TuningPanel from './TuningPanel'

/**
 * The board.
 *
 * One component serves every game: the registry supplies the rules text, which
 * world keys to show, which media and relations are in play, and whether the
 * player is asked to declare a relation. Nothing here branches on a game id except
 * through that data.
 *
 * The log shows one path, not the whole session. That is the consequence of the game
 * being a graph: a player standing on turn 3 of a twenty-turn game is in a
 * conversation that genuinely has three turns in it, and showing the other
 * seventeen underneath would be showing them someone else's. Everything off the path
 * is reachable from the map, one click, and clicking it is how you move.
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
  /**
   * The turn the next move answers. Null means a thread with nothing behind it —
   * either the game has not started, or the player asked for a fresh one.
   */
  const [focusId, setFocusId] = useState<string | null>(null)
  /** Set once the player has chosen, so loading turns stops overriding them. */
  const focusChosen = useRef(false)

  const player = useOfferingPlayer()
  const game = getGame(session.mode)
  const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']

  const media: MediumId[] = useMemo(
    () => (Array.isArray(session.media) && session.media.length > 0 ? session.media : ['music']),
    [session.media],
  )

  const [tuning, setTuning] = useState<Tuning>(() => normalizeTuning(session.tuning, media))

  useEffect(() => {
    let cancelled = false
    correlateQueries.getTurns(session.id)
      .then(t => {
        if (cancelled) return
        setTurns(t)
        if (!focusChosen.current) setFocusId(defaultParent(buildGraph(t))?.id ?? null)
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session.id])

  const graph: TurnGraph = useMemo(() => buildGraph(turns), [turns])

  /** The conversation you are in: root → the turn you are answering. */
  const path = useMemo(() => pathTo(graph, focusId), [graph, focusId])

  const focusTurn = focusId ? graph.nodes.get(focusId)?.turn ?? null : null
  const onTheTable = offeringOnTable(focusTurn)

  /** Turns that already answer the one in focus. Each is another branch. */
  const continuations = useMemo(() => childrenOf(graph, focusId), [graph, focusId])

  /**
   * The chain, in play order: each legal turn on this path contributes the move
   * and then the reply it drew.
   *
   * Rejected turns are left out — a move that did not connect never joined the
   * chain, so it should not be in the thing you look back over.
   */
  const chain = useMemo(
    () => path
      .filter(t => t.legal)
      // A self-reply's move *is* the previous turn's answer, so counting both
      // would put one record in the chain twice — audible as a stutter in the
      // playback queue and visible as a doubled entry in what was crossed.
      .flatMap(t => (isSelfReply(t) ? [t.reply_offering] : [t.move_offering, t.reply_offering]))
      .filter((o): o is Offering => !!o?.id),
    [path],
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

  const spent = useMemo(() => spentRelations(relationsAlong(path), 1), [path])

  /**
   * The world of this branch, not of the session.
   *
   * Two branches that both establish something about the same place are each
   * coherent and are not each other's, so the world is folded from the deltas along
   * the path. Sessions written before the graph existed have no deltas to fold and
   * fall back to the session row — see worldFor().
   */
  const world = useMemo(
    () => worldFor(game?.seedWorld ?? {}, session.world_state ?? {}, graph, path),
    [game, session.world_state, graph, path],
  )

  const facts: string[] = useMemo(
    () => (Array.isArray(world.facts) ? world.facts : []),
    [world],
  )

  const updateSession = useCallback((next: CorrelationSession) => {
    setSession(next)
    onSessionChange?.(next)
  }, [onSessionChange])

  const focusOn = useCallback((id: string | null) => {
    focusChosen.current = true
    setFocusId(id)
    setError('')
    setNotice('')
    setProblems([])
  }, [])

  const changeTuning = useCallback((next: Tuning) => {
    setTuning(next)
    // Fire-and-forget: the turn route is sent the current value too and persists
    // it, so losing this race costs nothing.
    correlateQueries.saveTuning(session.id, next, media).catch(() => {})
  }, [session.id, media])

  /**
   * One turn, whoever is taking it.
   *
   * A player's move and the partner answering itself are the same request to the
   * same route with one flag different, and keeping them one function here is what
   * guarantees they stay that way: a continuation is played under the tuning the
   * controls currently hold, lands in the graph the same way, and is subject to
   * the same server-side rules. Returns the new turn, or null when nothing was
   * recorded.
   */
  const postTurn = useCallback(async (payload: Record<string, unknown>) => {
    const res = await authedFetch('/api/correlate/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, tuning, ...payload })
    })
    const data = await res.json()
    if (!res.ok) {
      const failure: any = new Error(data.error ?? 'That turn did not go through')
      failure.problems = Array.isArray(data.problems) ? data.problems : []
      throw failure
    }
    return data
  }, [session.id, tuning])

  /** Fold a recorded turn into the board. */
  const absorb = useCallback((data: any) => {
    setTurns(t => [...t, data.turn])
    // Play continues from what just happened, whether or not the player had gone
    // back to take this turn. An illegal move established nothing, so the table
    // stays where it was.
    if (data.turn?.legal) focusOn(data.turn.id)
    if (data.session) updateSession(data.session)
    // Not an error any more: the pipeline guarantees a real reply, so the only
    // thing worth surfacing is that it took more than one attempt to get one.
    if (data.replySource && data.replySource !== 'interpreter') {
      setNotice(data.replySource === 'retry'
        ? 'The first answer could not be found, so it answered again.'
        : 'Two answers could not be found, so this one was searched out from the move.')
    }
  }, [focusOn, updateSession])

  /**
   * The partner answers its own offering, once.
   *
   * `parentId` is passed rather than read from state because a continuation run
   * chains several of these and each has to answer the one before it — state set
   * by the previous iteration is not visible yet.
   */
  const continueAlone = useCallback(async (
    parentId: string,
    asked: 'manual' | 'run',
  ) => {
    const data = await postTurn({ parentTurnId: parentId, selfReply: true })
    absorb(data)
    track('correlate_self_reply', {
      game: session.mode,
      medium: data.turn?.reply_offering?.medium,
      relation: data.turn?.relation,
      turn: data.turn?.turn_index,
      depth: data.selfReplyDepth,
      // Whether the player asked for this one turn or set it going. The two are
      // the same request, and the difference is worth keeping in the log: a
      // standing run and a deliberate nudge are not the same behaviour.
      asked,
    })
    return data
  }, [postTurn, absorb, session.mode])

  /** The one-click version, with its own error so a failed run reads as one. */
  const continueOnce = useCallback(async () => {
    if (!focusId) return
    setPending(true)
    setError('')
    setNotice('')
    setProblems([])
    try {
      await continueAlone(focusId, 'manual')
    } catch (e: any) {
      setError(e?.message ?? 'It could not take that turn')
    } finally {
      setPending(false)
    }
  }, [focusId, continueAlone])

  const play = useCallback(async (draft: MoveDraft) => {
    setPending(true)
    setError('')
    setNotice('')
    setProblems([])
    try {
      const data = await postTurn({
        // Always explicit, so the server never has to guess which turn a move
        // answers — "the newest one" is only right when nobody went back.
        parentTurnId: focusId,
        ...draft,
        prediction: prediction.trim() || undefined,
      })
      absorb(data)
      track('correlate_turn_played', {
        game: session.mode,
        medium: draft.medium,
        relation: data.turn?.relation,
        turn: data.turn?.turn_index,
        legal: data.turn?.legal,
        branched: focusId !== null && focusId !== defaultParent(graph)?.id,
        linked: !!data.turn?.link_turn_id,
        carriesOn: continuationOf(tuning),
      })
      setPrediction('')

      // The continuation run. Sequential rather than concurrent, because each
      // turn answers the one before it — and one at a time is also what makes it
      // worth watching rather than a block of text arriving at once.
      //
      // A failure here is deliberately a notice and not an error: the player's
      // move went through and is recorded, so painting the composer red would say
      // something untrue about the turn they actually took. The server's cap is
      // the real bound; this loop only asks.
      let from: string | null = data.turn?.legal ? data.turn.id : null
      const runs = continuationOf(tuning)
      for (let i = 0; i < runs && from; i++) {
        try {
          const next = await continueAlone(from, 'run')
          from = next.turn?.legal ? next.turn.id : null
        } catch (e: any) {
          setNotice(e?.message ?? 'It stopped there.')
          break
        }
      }
    } catch (e: any) {
      if (Array.isArray(e?.problems) && e.problems.length > 0) setProblems(e.problems)
      setError(e?.message ?? 'That turn did not go through')
    } finally {
      setPending(false)
    }
  }, [
    session.mode, prediction, focusId, tuning, graph, postTurn, absorb, continueAlone,
  ])

  const finish = useCallback(async () => {
    await correlateQueries.finishSession(session.id)
    updateSession({ ...session, status: 'finished' })
  }, [session, updateSession])

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
  const atHead = focusId === (defaultParent(graph)?.id ?? null)

  /**
   * Whether the partner can answer itself here, and why not when it cannot.
   *
   * The same function the route refuses with, so the control and the rule cannot
   * drift apart — and when it is refused, the player is shown the sentence the
   * server would have sent rather than a button that fails.
   */
  const noContinuation = selfReplyRefusal(focusTurn, path)
  const runsLeft = selfRepliesLeft(path)

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
          ) : path.length === 0 ? (
            <div className={`rounded-2xl border ${accent.ring} ${accent.bg} p-6 mb-6`}>
              <Shuffle size={22} className={`${accent.text} mb-3`} />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {turns.length === 0
                  ? game.openingPrompt
                  : 'A new thread, with nothing on the table. Offer anything.'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{game.pieces.goal}</p>
            </div>
          ) : (
            <>
              {/* Listen back to the audible part of this branch: one <audio> element
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
                      ? `${playingIndex + 1} of ${audible.length} · ${player.current?.title ?? ''}`
                      : `${audible.length} of ${chain.length} on this branch have audio · 30s previews`}
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
                {path.map(turn => (
                  <li key={turn.id} id={`turn-${turn.turn_index}`}>
                    <TurnBlock
                      turn={turn}
                      graph={graph}
                      player={player}
                      accentText={accent.text}
                      accentChip={accent.chip}
                      isFocus={turn.id === focusId}
                      onFocus={focusOn}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* What already answers the turn in focus. Taking another turn here makes
              one more of these rather than overwriting any of them. */}
          {continuations.length > 0 && (
            <div className="mb-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                <GitBranch size={12} />
                {continuations.length} {continuations.length === 1 ? 'answer' : 'answers'} already
                {' '}follow{continuations.length === 1 ? 's' : ''} from here
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {continuations.map(c => {
                  const beyond = subtreeSize(graph, c.id)
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => focusOn(c.id)}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        <CornerDownRight size={10} />
                        turn {c.turn_index + 1} · {c.move_offering?.title ?? 'a move'}
                        {beyond > 0 && <span className="text-gray-400 dark:text-gray-500">+{beyond}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!isOver && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {!focusTurn
                    ? turns.length === 0 ? 'Your opening offering' : 'A new thread, answering nothing'
                    : atHead
                      ? `Your move — turn ${turns.length + 1}`
                      : `Branching from turn ${focusTurn.turn_index + 1}`}
                </p>
                {onTheTable && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[55%]">
                    answering <span className="font-medium">{onTheTable.title}</span>
                    {' '}<span className="text-gray-300 dark:text-gray-600">({getMedium(onTheTable.medium)?.plural})</span>
                  </p>
                )}
              </div>

              {!atHead && turns.length > 0 && (
                <p className="mb-3 flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <GitBranch size={12} className="flex-shrink-0 mt-0.5" />
                  <span>
                    {focusTurn
                      ? `Your move starts a new branch here. Nothing played after turn ${focusTurn.turn_index + 1} is on it, and nothing already recorded changes.`
                      : 'Your move starts a thread with nothing behind it. The rest of the game is untouched.'}
                    {' '}
                    <button onClick={() => focusOn(defaultParent(graph)?.id ?? null)} className="underline hover:no-underline">
                      Back to where you were
                    </button>
                  </span>
                </p>
              )}

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

              {/* Standing back is a move too. The partner answers its own last
                  offering, and you see where it takes it when nobody redirects
                  it. Capped, and the cap is stated rather than discovered. */}
              {focusTurn && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {noContinuation ? (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      {noContinuation}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={continueOnce}
                        disabled={pending}
                        className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {pending ? <Loader2 size={11} className="animate-spin" /> : <Repeat size={11} />}
                        Let it answer itself
                      </button>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 min-w-0">
                        Take no turn — it answers its own offering. {runsLeft} more in a row.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
          {!isOver && (
            <TuningPanel
              media={media}
              tuning={tuning}
              onChange={changeTuning}
              accentText={accent.text}
              disabled={pending}
            />
          )}

          {turns.length > 0 && (
            <BranchMap
              graph={graph}
              focusId={focusId}
              onFocus={focusOn}
              accentChip={accent.chip}
              accentText={accent.text}
            />
          )}

          {mediaVisited.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Media crossed on this branch · {mediaVisited.length} of {media.length}
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
              <span className="ml-auto text-[11px] text-gray-400">
                {path.length} on this branch
              </span>
            </div>
            <dl className="divide-y divide-gray-100 dark:divide-gray-700">
              {game.worldKeys.map(({ key, description }) => (
                <div key={key} className="px-4 py-3">
                  <dt title={description} className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{key}</dt>
                  <dd className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <WorldValue value={world[key]} />
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
function TurnBlock({ turn, graph, player, accentText, accentChip, isFocus, onFocus }: {
  turn: CorrelationTurn
  graph: TurnGraph
  player: OfferingPlayer
  accentText: string
  accentChip: string
  /** True when the next move answers this turn. */
  isFocus: boolean
  onFocus: (id: string) => void
}) {
  /**
   * Whose move this was.
   *
   * Load-bearing, not decorative. A turn the partner took alone must never be
   * labelled "you offered": the player would be shown a chain they appear to have
   * built and did not, with no way to tell. It is the same rule the reply pipeline
   * follows about a dropped reply versus a search that found nothing — two
   * different things must not look alike.
   */
  const alone = isSelfReply(turn)
  const moveLabel = alone ? 'it offered, to itself' : 'you offered'

  if (!turn.legal) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 mb-3">
          <SignalZero size={13} /> Turn {turn.turn_index + 1} — turned away, the connection did not hold
        </p>
        <OfferingCard offering={turn.move_offering} player={player} label={moveLabel} compact />
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
  const linked = turn.link_turn_id ? graph.nodes.get(turn.link_turn_id)?.turn ?? null : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Turn {turn.turn_index + 1}</p>
        {alone && (
          <span
            title="You took no turn here — it answered its own last offering."
            className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <Repeat size={9} /> on its own
          </span>
        )}
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
        {isFocus ? (
          <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full ${accentChip}`}>
            answering this
          </span>
        ) : (
          <button
            onClick={() => onFocus(turn.id)}
            title="Take your next move from here instead, as a new branch"
            className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <GitBranch size={10} /> branch from here
          </button>
        )}
      </div>

      {/* Compact when the partner is answering itself: the record is the one
          directly above, already shown in full as the answer it was. What is new
          here is the label and the framing — it may have narrowed to one part of
          its own offering — and both of those survive the compact card. */}
      <OfferingCard
        offering={turn.move_offering}
        player={player}
        label={moveLabel}
        compact={alone}
      />

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

      {/* A correlation the player could not have seen from where they were standing:
          an earlier exchange, possibly on a branch they have not visited since, that
          this one rhymes with. */}
      {linked && turn.link_note && (
        <a
          href={`#turn-${linked.turn_index}`}
          className="flex items-start gap-1.5 pl-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <Link2 size={12} className="flex-shrink-0 mt-0.5" />
          <span>
            <span className="text-gray-400 dark:text-gray-500">rhymes with turn {linked.turn_index + 1} · </span>
            {turn.link_note}
          </span>
        </a>
      )}

      {/* The point of a cross-medium game: what survived, and what did not. */}
      {(turn.carried || turn.lost) && (
        <div className="pl-1 grid sm:grid-cols-2 gap-2">
          {turn.carried && (
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-500">carried · </span>{turn.carried}
            </p>
          )}
          {turn.lost && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-500">lost · </span>{turn.lost}
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
