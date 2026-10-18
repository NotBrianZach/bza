'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CornerDownRight, Flag, GitBranch,
  Globe2, Link2, Loader2, Pause, Play, Radio, Repeat, Shuffle, SignalZero, SkipBack,
  SkipForward,
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
import { continuationOf, normalizeTuning, radioOf, type Tuning } from '@/lib/correlate/tuning'
import {
  isSelfReply, radioRefusal, selfRepliesLeft, selfReplyRefusal, RADIO_HINT, RADIO_LABEL,
} from '@/lib/correlate/continuation'
import type {
  CorrelationSession, CorrelationTurn, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { useOfferingPlayer, audioUrl, type OfferingPlayer } from './useOfferingPlayer'
import { useYouTubePlayer } from './useYouTubePlayer'
import { useFullLengthResolver } from './useFullLengthResolver'
import BranchMap from './BranchMap'
import OfferingCard from './OfferingCard'
import OfferingPicker, { type MoveDraft } from './OfferingPicker'
import TuningPanel from './TuningPanel'

/**
 * How many answers radio keeps queued in front of the one playing.
 *
 * Two, counted in items rather than seconds because the two backends are an order of
 * magnitude apart: two 30-second previews is a minute of cover, two full records is
 * closer to eight. A minute is already comfortably longer than a turn takes, so the
 * smaller case sets the floor and the larger one is simply slack.
 *
 * The failure at one is audible — a gap whenever a turn is slow. The failure at five
 * is not audible at all, which is worse: the radio would be minutes ahead of the
 * player, every move they made would land into a chain they had not caught up with,
 * and on full tracks it would also mean resolving records nobody ever reaches.
 */
const RADIO_LOOKAHEAD = 2

/**
 * How many silent answers in a row end the run.
 *
 * Three, the same number and for a related reason as the cap radio lifts: one is a
 * medium change, two is a stretch, three with nothing audible in them means the
 * chain has gone somewhere radio cannot follow and asking a fourth time is just
 * spending a model call on the same answer.
 */
const RADIO_SILENT_LIMIT = 3

/**
 * How many turns must fail in a row before the run gives up.
 *
 * Three, because the two failure shapes need telling apart and this is what does
 * it. A transient one — interpreter 502, a timeout, a dropped connection — almost
 * never repeats three times, so it costs a gap in the audio and the run continues.
 * A genuine refusal fails identically every time, so it reaches three in a few
 * seconds and the run ends with the real reason attached.
 */
const RADIO_FAILURE_LIMIT = 3

/** Linear backoff between retries: 1.5s, then 3s. */
const RADIO_RETRY_MS = 1500

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
  /**
   * Where focus stands *now*, readable between two awaits in the same run.
   *
   * A run of self-replies chains several requests, and React state set by one
   * iteration is not visible to the next — so a loop that wants to know whether the
   * player has moved in the meantime cannot ask `focusId`. Written synchronously by
   * `focusOn` for exactly that reason, and mirrored from state below so the initial
   * load agrees with it.
   */
  const focusRef = useRef<string | null>(null)
  useEffect(() => { focusRef.current = focusId }, [focusId])

  /**
   * One self-reply in flight at a time, across every path that asks for one.
   *
   * Shared by the radio pump, the manual nudge and the continuation run rather than
   * owned by radio, because the thing being prevented is two of them answering the
   * *same* offering: that records two answers to one move, which the graph correctly
   * reads as a branch, and a radio that quietly forked the chain every time the
   * player pressed the button would be writing a tree nobody asked for.
   *
   * A ref and not state because two passes can run before React re-renders either.
   */
  const selfReplyBusy = useRef(false)

  /**
   * The radio pump, reachable from the player before it is defined.
   *
   * The queue running dry is one of the two things that should ask for another turn,
   * and the hook that notices it is created here while the function that answers it
   * needs most of the board. A ref is the join: the player calls whatever the latest
   * render installed, so neither has to be hoisted above the other.
   */
  const pumpRef = useRef<() => void>(() => {})

  /**
   * The two backends and the queue that drives them, joined here.
   *
   * None of the three can be built knowing the others: the video player reports
   * finishing to the queue, the queue plays through the video player, and the
   * resolver is consulted by the queue. Two refs break the cycle — `advanceRef` for
   * "a video ended" and the player's own options for the rest — and this component
   * is the only place that needs to know all three exist.
   */
  const advanceRef = useRef<() => void>(() => {})
  const ytMount = useRef<HTMLDivElement | null>(null)
  const yt = useYouTubePlayer({ mount: ytMount, onEnded: () => advanceRef.current() })
  const { resolve: resolveFull, quotaSpent } = useFullLengthResolver()

  const player = useOfferingPlayer({
    onExhausted: () => pumpRef.current(),
    resolveFull,
    full: yt,
  })
  useEffect(() => { advanceRef.current = player.advance }, [player.advance])
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
    focusRef.current = id
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

  /**
   * Fold a recorded turn into the board.
   *
   * `takeFocus` defaults to true because a turn the player just took is the turn
   * they want to be standing on. It is false when the turn arrived from a run the
   * player has already walked away from: a radio answer that lands two seconds after
   * they clicked a different branch must not drag them back out of it. Callers pass
   * the rule rather than this function guessing, since only the caller knows which
   * offering it asked from.
   */
  const absorb = useCallback((data: any, takeFocus = true) => {
    setTurns(t => [...t, data.turn])
    // Play continues from what just happened, whether or not the player had gone
    // back to take this turn. An illegal move established nothing, so the table
    // stays where it was.
    if (data.turn?.legal && takeFocus) focusOn(data.turn.id)
    if (data.session) updateSession(data.session)
    // Not an error any more: the pipeline guarantees a real reply, so the only
    // thing worth surfacing is that it took more than one attempt to get one.
    // The floor message names the broken mute on purpose. A muted medium appearing
    // unannounced in a game tuned to music reads as the shares not working, which
    // is a worse thing to believe than "the catalogues were down" — so the one
    // case where the engine overrides the tuning is the one case it says so.
    if (data.replySource && data.replySource !== 'interpreter') {
      setNotice(
        data.replySource === 'retry'
          ? 'The first answer could not be found, so it answered again.'
        : data.replySource === 'floor'
          ? (data.replyBrokeMute
              ? 'Nothing could be reached in the media you asked for, so it wrote one ' +
                'in a medium you had turned off rather than leave the turn unanswered.'
              : 'Nothing could be found to answer with, so it wrote this one instead.')
          : 'Two answers could not be found, so this one was searched out from the move.',
      )
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
    asked: 'manual' | 'run' | 'radio',
  ) => {
    const data = await postTurn({ parentTurnId: parentId, selfReply: true })
    // Focus follows this answer only if the player is still standing where it was
    // asked from. True by construction for a manual nudge and for each step of a
    // run; false when they moved while it was in flight, which radio makes ordinary
    // rather than rare because a radio run is long and unattended.
    absorb(data, focusRef.current === parentId)
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
    // Dropped rather than queued when a radio answer is already in flight: the
    // button means "answer what is on the table", and what is on the table is about
    // to change. Asking twice would fork the chain instead of extending it.
    if (selfReplyBusy.current) return
    selfReplyBusy.current = true
    setPending(true)
    setError('')
    setNotice('')
    setProblems([])
    try {
      await continueAlone(focusId, 'manual')
    } catch (e: any) {
      setError(e?.message ?? 'It could not take that turn')
    } finally {
      selfReplyBusy.current = false
      setPending(false)
    }
  }, [focusId, continueAlone])

  /**
   * Radio — the chain feeding itself for as long as it is left on.
   *
   * Three things make this different from the continuation run in `play` below, and
   * all three come from the run being open-ended rather than three turns long.
   *
   *  1. **It generates ahead of the playback, not after the player.** A preview is
   *     thirty seconds and a turn is a model call plus a catalogue lookup, so a run
   *     that waited for the audio to end before asking for the next answer would be
   *     silent between every track. The pump keeps `RADIO_LOOKAHEAD` answers queued
   *     in front of the one playing and is woken by the queue draining, which makes
   *     generation a buffer rather than a step.
   *  2. **It does not hold the composer.** `pending` stays false, so a player can
   *     play a move into a running radio. If they do it while an answer is in
   *     flight, both land, and they land as two answers to the same offering — which
   *     is a branch, which this board already models and draws. Nothing is lost and
   *     nothing has to be locked.
   *  3. **It asks from where the player is standing**, re-read on every pass rather
   *     than captured when radio was switched on. So moving to another branch
   *     mid-run moves the radio with you, which is the behaviour that matches what
   *     the control says: it carries on from whatever is on the table.
   *
   * One answer in flight at a time, and that guard is a ref rather than state
   * because two passes of this effect can run before React has re-rendered either.
   */
  const radio = radioOf(tuning)
  /** Why radio cannot run in this session at all, or null. */
  const radioBlocked = radioRefusal(media)
  /**
   * Consecutive answers that came back with nothing to hear.
   *
   * The runaway this exists to stop: the pump is woken by the audio buffer being
   * short, so an answer with no audio does not lengthen it, and in a session with
   * music *and* paintings in play a stretch of paintings would have the pump asking
   * for turn after turn with the queue never filling and nothing ever playing. A
   * model call per pass, in a loop, silently. Counted rather than forbidden, because
   * one painting mid-run is the chain doing its job — it is only a fault when it is
   * all that comes back.
   */
  const radioSilent = useRef(0)
  /**
   * Consecutive turns that failed outright, and why the last one did.
   *
   * The bug this fixes: radio used to stop on the *first* failure, on the
   * reasoning that leaving it on would retry the same refusal forever. That was
   * right about the refusals and wrong about everything else. A turn is a model call
   * plus two catalogue lookups, so the common failure is transient — a 502 from the
   * interpreter, a timeout, a dropped connection — and ending an open-ended run on
   * one of those is what made radio look like it only worked for a single song.
   *
   * So: retry, and stop only when it fails `RADIO_FAILURE_LIMIT` times in a row. A
   * genuine refusal still ends the run quickly, because a refusal fails every time,
   * while a hiccup costs one gap in the audio and nothing else.
   */
  const radioFailures = useRef(0)
  const [radioStopped, setRadioStopped] = useState('')
  /** Bumped to re-run the pump when nothing else would have. */
  const [radioNudge, setRadioNudge] = useState(0)

  /**
   * End the run and say so where it will actually be read.
   *
   * `notice` renders as small grey text under the composer, which is the right
   * weight for "the first answer could not be found, so it answered again" and the
   * wrong weight for "the thing you switched on has switched itself off". A player
   * who does not see this concludes radio works for one song.
   */
  const stopRadio = useCallback((why: string) => {
    changeTuning({ ...tuning, radio: false })
    radioFailures.current = 0
    radioSilent.current = 0
    setRadioStopped(why)
  }, [changeTuning, tuning])

  /**
   * One pass: take a turn if the buffer is short and there is something to answer.
   *
   * Every reason to do nothing is a quiet return rather than an error. Radio idles
   * before the player's first move because there is nothing on the table yet, and
   * saying so would be shouting about a state that fixes itself.
   */
  const pump = useCallback(async () => {
    if (!radio || radioBlocked) return
    if (session.status !== 'active') return
    if (selfReplyBusy.current) return
    if (player.lookahead >= RADIO_LOOKAHEAD) return

    const from = focusRef.current
    if (!from) return
    // The same refusal the server would send, so the pump stops asking for turns
    // that would come back 409 — and stops for the reasons that are about the
    // branch, which radio does not lift.
    if (selfReplyRefusal(focusTurn, path, { radio: true })) return

    selfReplyBusy.current = true
    try {
      const data = await continueAlone(from, 'radio')
      // Checked for existence first: `audioUrl` reads straight through
      // `perceptible`, so a turn that came back without an answer at all would throw
      // here rather than count as the silence it is.
      const answer: Offering | null = data?.turn?.reply_offering ?? null
      radioFailures.current = 0
      if (answer && audioUrl(answer)) {
        radioSilent.current = 0
      } else if (++radioSilent.current >= RADIO_SILENT_LIMIT) {
        stopRadio(
          `The last ${RADIO_SILENT_LIMIT} answers had nothing to hear, so the radio ` +
          `stopped rather than keep asking into silence. The chain is still here to ` +
          `carry on by hand.`,
        )
      }
    } catch (e: any) {
      const why = e?.message ?? 'that turn did not go through'
      if (++radioFailures.current >= RADIO_FAILURE_LIMIT) {
        stopRadio(
          `The radio stopped after ${RADIO_FAILURE_LIMIT} turns in a row failed. ` +
          `The last reason was: ${why}`,
        )
      } else {
        // Kept quiet and retried. One slow or dropped turn is a gap in the audio,
        // not the end of the run, and announcing each one would make a working
        // radio look broken.
        console.warn(`[radio] turn failed (${radioFailures.current}/${RADIO_FAILURE_LIMIT}): ${why}`)
        // Woken explicitly, because a failure changes none of the pump's inputs —
        // no turn landed and the playhead did not move — so nothing else would
        // ever re-run it and the retry would never happen. Backed off linearly so
        // a provider having a bad minute is not hammered.
        window.setTimeout(
          () => setRadioNudge(n => n + 1),
          RADIO_RETRY_MS * radioFailures.current,
        )
      }
    } finally {
      selfReplyBusy.current = false
    }
  }, [
    radio, radioBlocked, session.status, player.lookahead,
    focusTurn, path, continueAlone, stopRadio,
    // Not read in the body — it exists only to make a retry re-run this.
    radioNudge,
  ])

  useEffect(() => { pumpRef.current = () => { void pump() } }, [pump])

  // Woken by anything that could have changed the answer to "is the buffer short":
  // a turn landing, the playhead advancing, the control being switched on. The pass
  // itself is guarded, so running it more often than necessary costs nothing.
  useEffect(() => { void pump() }, [pump])

  /**
   * Feed the playback queue from the chain, without restarting it.
   *
   * Derived from `audible` rather than pushed from the pump, so a radio answer and a
   * move the player made reach the queue by the same route — and so the queue is
   * rebuilt correctly if the chain is reloaded. `append` ignores what it already
   * holds, which is what makes handing it the whole branch every time safe.
   */
  useEffect(() => {
    if (!radio || audible.length === 0) return
    player.append(audible)
  }, [radio, audible, player.append])

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
      // Skipped entirely while radio is on. Both answer "who takes the next turn"
      // and radio is the one in force, so running a fixed-length run here as well
      // would spend the stored stop *and* hand over to the pump — two runs racing
      // for the same offering, and the panel says the stop is not being applied.
      let from: string | null = data.turn?.legal && !radio ? data.turn.id : null
      const runs = continuationOf(tuning)
      if (from) selfReplyBusy.current = true
      for (let i = 0; i < runs && from; i++) {
        try {
          const next = await continueAlone(from, 'run')
          from = next.turn?.legal ? next.turn.id : null
        } catch (e: any) {
          setNotice(e?.message ?? 'It stopped there.')
          break
        }
      }
      selfReplyBusy.current = false
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
  const noContinuation = selfReplyRefusal(focusTurn, path, { radio })
  const runsLeft = selfRepliesLeft(path, { radio })

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
              {/* One audible item is enough once radio can grow the queue: the bar is
                  where the control lives, so gating it on a chain that is already
                  long would hide the thing that makes a chain long. */}
              {(audible.length > 1 || (audible.length > 0 && !radioBlocked)) && (
                <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                 <div className="flex items-center gap-3">
                  <button
                    onClick={() => (playingIndex >= 0 ? player.toggle() : player.playQueue(audible))}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110 transition-all`}
                  >
                    {playingIndex >= 0 && !player.paused
                      ? <><Pause size={13} /> Pause</>
                      : <><Play size={13} /> Play what can be heard</>}
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 min-w-0 truncate">
                    {/* Which backend got it is stated rather than left to be
                        inferred from how long the track lasts. A chain that
                        alternates between whole records and thirty-second
                        fragments reads as a broken player unless it says so. */}
                    {playingIndex >= 0
                      ? `${playingIndex + 1} of ${audible.length} · ${player.current?.title ?? ''}`
                        + (player.via === 'full' ? ' · in full' : player.via ? ' · 30s preview' : '')
                      : `${audible.length} of ${chain.length} on this branch have audio`}
                  </p>
                  {playingIndex >= 0 && (
                    <div className="ml-auto flex-shrink-0 flex items-center">
                      <button
                        onClick={player.previous}
                        title="The one before this"
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        <SkipBack size={13} />
                      </button>
                      {/* The missing half of the pair. At the end of the queue this
                          is also how you ask radio for the next one early, rather
                          than sitting through a record you are done with — skip
                          runs the same `advance` a track ending does, so the
                          exhausted callback wakes the pump exactly the same way. */}
                      <button
                        onClick={player.skip}
                        title={player.lookahead > 0
                          ? 'The next one'
                          : radio ? 'Find the next one now' : 'Nothing queued after this'}
                        disabled={player.lookahead === 0 && !radio}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <SkipForward size={13} />
                      </button>
                    </div>
                  )}
                  {/* The one control that turns a chain you are listening back to
                      into one that is still being written. Stored in the tuning, so
                      it survives a reload and the server sees it on every turn. */}
                  <button
                    onClick={() => {
                      const next = !radio
                      changeTuning({ ...tuning, radio: next })
                      // From the end of what is already here, not the top. Switching
                      // radio on is an ask for what comes next; replaying an hour of
                      // chain first would bury the new material behind the old.
                      if (next && playingIndex < 0 && audible.length > 0) {
                        player.playQueue(audible, audible.length - 1)
                      }
                      if (!next) setNotice('')
                      // Both counters and the last stop reason reset on a
                      // deliberate toggle: switching it back on is a fresh run,
                      // and carrying a stale failure into it would end the new run
                      // early on the strength of the old one's bad luck.
                      radioSilent.current = 0
                      radioFailures.current = 0
                      setRadioStopped('')
                      track('correlate_radio_toggled', { game: session.mode, on: next })
                    }}
                    disabled={!!radioBlocked}
                    title={radioBlocked ?? RADIO_HINT}
                    className={`${playingIndex >= 0 ? '' : 'ml-auto '}flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      radio
                        ? `${accent.bg} ${accent.text}`
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Radio size={13} className={radio && selfReplyBusy.current ? 'animate-pulse' : ''} />
                    {RADIO_LABEL}
                  </button>
                 </div>
                 {/* The video player's permanent home.
                     It cannot be mounted and unmounted per track: `new YT.Player`
                     consumes the node it is given, and a fresh node each time would
                     mean a fresh player, which loses both the queue's autoplay
                     permission and the ENDED event the queue advances on. So the
                     node always exists and the wrapper collapses instead — visible
                     at a usable size while a full track plays, which is also what
                     the embed terms ask for, and zero-height otherwise. */}
                 <div className={player.via === 'full'
                   ? 'mt-2 aspect-video rounded-lg overflow-hidden bg-black'
                   : 'h-0 overflow-hidden'}
                 >
                   <div ref={ytMount} className="w-full h-full" />
                 </div>
                 {/* Where a self-stopped run says so. Amber and in the bar, next to
                     the control that is now off, rather than as grey text under the
                     composer — a player who does not notice this concludes the
                     button only ever worked once. */}
                 {radioStopped && !radio && (
                   <p className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700 flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                     <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                     <span>{radioStopped} Press {RADIO_LABEL} to start it again.</span>
                   </p>
                 )}
                 {quotaSpent && (
                   <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                     Today&rsquo;s full-length lookups are used up, so the rest of this run
                     plays as 30-second previews. Anything looked up before is still played
                     in full.
                   </p>
                 )}
                 {/* Said under the bar rather than in a tooltip while it is running,
                     because the one thing a player needs to know mid-run is that
                     their move is still welcome — a radio that looks sealed gets
                     switched off instead of played into. */}
                 {radio && (
                   <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                     {/* Three states, and telling them apart is the difference
                         between a radio that looks idle and one that looks ready.
                         With full-length records a full buffer means several
                         minutes of nothing happening, which is correct and reads
                         as broken unless it says what it is waiting for. */}
                     {selfReplyRefusal(focusTurn, path, { radio: true })
                       ? 'Waiting for something to answer — play anything and it takes over.'
                       : player.lookahead >= RADIO_LOOKAHEAD
                         ? `${player.lookahead} queued ahead · the next one is found when this finishes, or skip ahead`
                         : selfReplyBusy.current || player.lookahead === 0
                           ? 'Finding the next one · your move whenever you want it back'
                           : `${player.lookahead} queued ahead · your move whenever you want it back`}
                   </p>
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
                        Take no turn — it answers its own offering.
                        {/* Radio makes `runsLeft` infinite, and "Infinity more in a
                            row" is not a sentence. The count is the thing the cap
                            exists to communicate, so with no cap there is nothing
                            to count and the button is simply still there. */}
                        {Number.isFinite(runsLeft) ? ` ${runsLeft} more in a row.` : ''}
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
