'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CornerDownRight, Flag, GitBranch,
  Globe2, Link2, Loader2, Pause, Play, Radio, Repeat, Shuffle, SignalZero, SkipBack,
  SkipForward, Target, Dices, Share2, Hourglass,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { correlateQueries } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, getGame, retiredGameName, wantsPrediction } from '@/lib/correlate/games'
import { getMedium, isComposed } from '@/lib/correlate/media'
import { RELATIONS, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  buildGraph, childrenOf, defaultParent, offeringOnTable, pathTo, relationsAlong, siblingsOf,
  subtreeSize, worldFor, type TurnGraph,
} from '@/lib/correlate/graph'
import {
  continuationOf, isStarting, normalizeTuning, radioOf, startingTuning, type Tuning,
} from '@/lib/correlate/tuning'
import {
  isSelfReply, radioRefusal, selfRepliesLeft, selfReplyRefusal, RADIO_HINT, RADIO_LABEL,
} from '@/lib/correlate/continuation'
import { activeBranch, playedUnder, switchTargets } from '@/lib/correlate/switching'
import {
  hintsFor, openingSentence, pickConfidently,
  type VoiceCommand, type VoiceIntent, type VoiceStage,
} from '@/lib/correlate/voice'
import type {
  CorrelationClaim, CorrelationSession, CorrelationTurn, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { useOfferingPlayer, audioUrl, type OfferingPlayer } from './useOfferingPlayer'
import { useYouTubePlayer, YT_ALLOW } from './useYouTubePlayer'
import { useFullLengthResolver } from './useFullLengthResolver'
import BranchMap from './BranchMap'
import OfferingCard from './OfferingCard'
import OfferingPicker, { type MoveDraft } from './OfferingPicker'
import GameSwitch from './GameSwitch'
import TuningPanel from './TuningPanel'
import VoiceBar, { VoiceHint } from './VoiceBar'
import { useVoiceControl } from './useVoiceControl'

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

/** How soon a second spoken "next" is taken seriously. See `lastVoiceSkip`. */
const VOICE_SKIP_GUARD_MS = 800

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
   * The last answer, spoken form, for "say that again".
   *
   * A ref and declared up here because `absorb` — which is where an answer
   * lands — is defined well above the voice section, and because the voice
   * handlers are themselves read through a ref: a state read inside them would
   * be a render behind, which for this value means reading back the turn before
   * last.
   */
  const lastReadingRef = useRef('')
  /**
   * The part of the last reading that landing did not speak, for "go on".
   *
   * Landing speaks the offering's name and the reading's first sentence. At the
   * widest breadth a reading is six sentences, which is twenty seconds with the
   * player unable to say anything — so the rest is held here and read on
   * request rather than imposed every move.
   */
  const unreadRestRef = useRef('')
  /**
   * Whether radio is running, for `absorb` — which is built above it.
   *
   * Load-bearing for voice and not just a convenience. Radio generates two
   * answers *ahead* of the audio, so a turn lands while an earlier one is still
   * playing: speaking on landing would talk over the music and describe
   * something that is not what you are hearing. In radio the audio is the
   * output and the board is the commentary, so voice says nothing.
   */
  const radioRef = useRef(false)
  /**
   * Whether a track is audibly playing, for the grammar's wake-word rule.
   *
   * The field whose absence broke voice play in use: with the microphone open
   * beside a playing speaker the recogniser transcribes the song, and the
   * grammar matched on it — so the game took commands from its own output. A
   * lyric heard as "next" skipped the track, the next track's lyrics skipped
   * again, and that is the start-stop cycling.
   */
  const audioPlayingRef = useRef(false)
  /**
   * When a voice skip was last honoured, to break a runaway.
   *
   * Defence in depth behind the wake word, and worth having because this
   * particular loop spends money: `player.skip()` at the tail of the queue asks
   * radio to generate, so a skip firing on repeat is a model call firing on
   * repeat. 800ms is longer than any feedback loop and shorter than the gap
   * between two things a person says on purpose.
   */
  const lastVoiceSkip = useRef(0)
  /**
   * The voice control, for the callbacks defined above it.
   *
   * `absorb` speaks the answer and is built before `useVoiceControl` runs, so it
   * cannot close over the result directly. Writing it into a ref is the smaller
   * of the two fixes — the other is hoisting the whole voice section above every
   * action it dispatches to, which it cannot be, because it dispatches to them.
   */
  const voiceRef = useRef<ReturnType<typeof useVoiceControl> | null>(null)
  /**
   * The game the next move will be played under, when the player has asked to
   * change it. Null means carry on with whatever this branch is.
   *
   * Armed rather than applied, because a switch *is* a turn: there is no
   * zero-turn boundary for the graph to hold, so the switch happens when the
   * move carrying it is played and not before. Nothing is posted here, and a
   * player who arms one and walks away has changed nothing.
   */
  const [armedSwitch, setArmedSwitch] = useState<string | null>(null)
  /**
   * The last move the player made, and what it answered.
   *
   * Kept so it can be played *again* against the same parent, which records a
   * second answer to the same move. Both the draft and the parent are needed and
   * the parent is the one that is easy to get wrong: focus has already moved to
   * the turn that just landed, so re-posting against `focusId` would answer the
   * answer rather than re-ask the question.
   *
   * Cleared whenever the player moves elsewhere, because "again" is only
   * meaningful where it was asked.
   */
  const [lastMove, setLastMove] = useState<{ draft: MoveDraft; parentId: string | null } | null>(null)
  const [closing, setClosing] = useState(false)
  const [sharing, setSharing] = useState(false)
  /** Rhymes the player has claimed, loaded with the turns and appended as they land. */
  const [claims, setClaims] = useState<CorrelationClaim[]>([])
  const [claiming, setClaiming] = useState(false)
  /** The claim being composed: which turn it is made from, which it points at, and why. */
  const [claimFrom, setClaimFrom] = useState<string | null>(null)
  const [claimTo, setClaimTo] = useState<string | null>(null)
  const [claimNote, setClaimNote] = useState('')
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
  const ytFrame = useRef<HTMLIFrameElement | null>(null)
  const stalledRef = useRef<() => void>(() => {})
  const yt = useYouTubePlayer({
    frame: ytFrame,
    onEnded: () => advanceRef.current(),
    onStalled: () => stalledRef.current(),
  })
  const { resolve: resolveFull, quotaSpent } = useFullLengthResolver()

  const player = useOfferingPlayer({
    onExhausted: () => pumpRef.current(),
    resolveFull,
    full: yt,
  })
  useEffect(() => { advanceRef.current = player.advance }, [player.advance])
  useEffect(() => {
    stalledRef.current = player.fallbackToPreview
  }, [player.fallbackToPreview])
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
    // Separately and tolerantly: claims are an ornament on the chain, so failing
    // to load them must not stop the game from opening. A deployment whose
    // migration 78 has not run yet lands here.
    correlateQueries.getClaims(session.id)
      .then(c => { if (!cancelled) setClaims(c) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [session.id])

  const graph: TurnGraph = useMemo(() => buildGraph(turns), [turns])

  /** The conversation you are in: root → the turn you are answering. */
  const path = useMemo(() => pathTo(graph, focusId), [graph, focusId])

  const focusTurn = focusId ? graph.nodes.get(focusId)?.turn ?? null : null
  const onTheTable = offeringOnTable(focusTurn)

  /**
   * Which game this branch is, and which game the next move will be.
   *
   * Two resolutions of the same arithmetic, and the split is the whole of what
   * arming a switch means to this component:
   *
   *  - `branch` is what has been *played*. It supplies the accent, the world and
   *    its keys, the header, and the per-turn labels — everything describing the
   *    record, which an armed switch has not touched.
   *  - `next` is what the composer is for. Arming Correlation Chain from Tag
   *    flips `declaredRelation` to 'required', so the move that carries the
   *    switch must name its relation — and the composer has to ask for it on
   *    that move, not the one after, or the server refuses a turn the player was
   *    never given a chance to form correctly.
   *
   * Neither reads `session.mode` for the game. That column stays as the game the
   * session started as; the branch's game is a fact about the branch. See
   * lib/correlate/switching.ts.
   */
  const branch = useMemo(() => activeBranch(path, session.mode, null), [path, session.mode])
  const nextBranch = useMemo(
    () => activeBranch(path, session.mode, armedSwitch),
    [path, session.mode, armedSwitch],
  )
  const game = branch.game
  const nextGame = nextBranch.game ?? game
  const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']

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
  // Mirrored for the voice grammar, which is evaluated outside React and needs
  // to know whether the speakers are making noise. See `audioPlayingRef`.
  audioPlayingRef.current = !!player.current && !player.paused

  const mediaVisited = useMemo(
    () => [...new Set(chain.map(o => o.medium))],
    [chain],
  )

  /**
   * The relations the composer may offer, which belong to the game the next move
   * is played under.
   *
   * The session's snapshot only while the branch is still the game the session
   * started as — that snapshot is the promise that a game does not change shape
   * underneath its player, and a switch the player armed themselves is not that
   * case. Mirrors the same decision in app/api/correlate/turn/route.ts, which is
   * the one that binds; a disagreement here would show a relation the server
   * then rejects.
   */
  const relations: RelationId[] = useMemo(
    () => (nextBranch.mode === session.mode && Array.isArray(session.relations) && session.relations.length > 0
      ? session.relations
      : resolveRelations(nextGame?.relations ?? 'all')),
    [session.relations, session.mode, nextBranch.mode, nextGame],
  )

  /**
   * Relations this branch has just spent, from `nextBranch.since` rather than the path.
   *
   * Which is what empties it across a switch — and the picker has to agree with
   * the server about that or it greys out the only relation Translation has.
   */
  const spent = useMemo(() => spentRelations(relationsAlong(nextBranch.since), 1), [nextBranch.since])

  /**
   * The world of this branch, not of the session.
   *
   * Two branches that both establish something about the same place are each
   * coherent and are not each other's, so the world is folded from the deltas along
   * the path. Sessions written before the graph existed have no deltas to fold and
   * fall back to the session row — see worldFor().
   */
  const world = useMemo(
    () => worldFor(
      game?.seedWorld ?? {},
      // The session cache is only offered when this branch has never switched.
      // On a switched branch that column holds the *old* game's world, so the
      // legacy fallback inside worldFor would hand it over whole — the one case
      // where folding from less is the honest answer. Same rule as the route.
      branch.boundaries.length > 0 ? {} : session.world_state ?? {},
      graph,
      branch.since,
    ),
    [game, session.world_state, graph, branch],
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
   * Arm or disarm a switch, and at turn zero hand it the game's own weighting.
   *
   * The second half exists because of what `startingTuning` does. It reads the
   * game's `coreMedia` — the media a game's `replyRule` cannot be followed
   * without — and a session created as Tag was weighted for Tag, which mutes all
   * four media Embodiment composes actions in. So switching to Embodiment before
   * playing anything would have produced a *worse* Embodiment than starting one:
   * the right rules, with the game's own media silenced. That is the §21b bug
   * arriving by a second route.
   *
   * Only at turn zero, and only while the weighting is still the one the game was
   * created with. Both conditions are the same promise `startingTuning` itself
   * makes — "a game in progress keeps whatever it has" — read precisely: a game
   * with no turns is not in progress, and a weighting the player has moved is
   * theirs and not ours to reset.
   */
  const armSwitch = useCallback((gameId: string | null) => {
    setArmedSwitch(gameId)
    if (turns.length > 0) return

    const current = getGame(session.mode)
    if (!current || !isStarting(tuning, media, current.coreMedia ?? [])) return

    const target = gameId ? getGame(gameId) : current
    if (target) changeTuning(startingTuning(media, target.coreMedia ?? []))
  }, [turns.length, session.mode, tuning, media, changeTuning])

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

    // The answer, out loud, for a player who is not looking at the screen.
    //
    // Named before read: the reading talks *about* the reply, so hearing it
    // without knowing what was answered with is hearing the second half of a
    // sentence.
    //
    // The name and the reading's first sentence, and no more. Speaking the whole
    // reading was twenty seconds of closed microphone on every move for
    // something the player had not asked to hear in full — and it arrived while
    // they were most likely to want to say the next thing. "go on" reads the
    // rest; "say that again" repeats all of it.
    //
    // Recorded even when voice is off, so turning it on mid-game and asking for
    // the last reading works.
    const reply = data.turn?.reply_offering
    if (data.turn?.legal && (reply || data.turn?.reading)) {
      const named = reply
        ? `${reply.title}${reply.attribution ? ` by ${reply.attribution}` : ''}.`
        : ''
      const { opening, rest } = openingSentence(data.turn.reading ?? '')
      lastReadingRef.current = `${named} ${data.turn.reading ?? ''}`.trim()
      unreadRestRef.current = rest
      if (voiceRef.current?.listening && !radioRef.current) {
        voiceRef.current.say(`${named} ${opening}`.trim())
      }
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
      // What the partner actually answered under. A self-reply never carries a
      // switch — it is not the player's turn to change the game in — but it can
      // happen on a branch that has already switched.
      game: data.mode ?? branch.mode,
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
  }, [postTurn, absorb, branch.mode])

  /**
   * Ask for a different answer to the move just made.
   *
   * Not a re-roll, and the difference is the whole point: it does not replace the
   * first answer, it records a second one. Two turns answering the same parent is
   * what a branch *is* in this graph, so this needed no new engine concept at all
   * — it is the same request with the same body, sent against the same parent.
   *
   * The engine was already built for it. `inPlay` excludes everything a sibling
   * already answered with, and the comment there says why: "a second branch off
   * the same offering should not come back with the same record as the first".
   * That rule existed for a feature nothing had yet asked for.
   *
   * What it buys is the decision the turn loop did not have. Before this the
   * player's only choice was which record to submit; the answer was handed to
   * them. Now the answer can be two, both kept, and walking one is a move.
   */
  const answerAgain = useCallback(async () => {
    if (!lastMove) return
    setPending(true)
    setError('')
    setNotice('')
    setProblems([])
    try {
      const data = await postTurn({
        parentTurnId: lastMove.parentId,
        ...lastMove.draft,
        // Deliberately not re-sent. A prediction is a guess about what one
        // particular ask will draw back, and this is a different ask — carrying
        // the old guess across would score it against an answer it was not made
        // about. The switch is dropped for the same reason: it already happened
        // on the first of these two turns.
      })
      absorb(data)
      track('correlate_answered_again', {
        game: data.mode ?? branch.mode,
        medium: data.turn?.reply_offering?.medium,
        relation: data.turn?.relation,
        turn: data.turn?.turn_index,
      })
    } catch (e: any) {
      setError(e?.message ?? 'It could not answer that again')
    } finally {
      setPending(false)
    }
  }, [lastMove, postTurn, absorb, branch.mode])

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
  radioRef.current = radio
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
    // Read for its effect on THIS callback's identity, not for its value. A
    // failed turn schedules `setRadioNudge` precisely because a failure changes
    // none of the pump's real inputs, so bumping the counter is the only thing
    // that rebuilds this callback and re-runs the pass.
    //
    // Stated as a read rather than carried as an unread dependency with a
    // `eslint-disable`: suppressing the rule on this hook would also hide any
    // dependency genuinely missing from it later, and this hook reads eleven
    // things. A `void` keeps the retry working and keeps the rule armed.
    void radioNudge
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
    // Not used for its value — it exists only to make a retry re-run this. See
    // the `void` at the top of the body.
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
  // Destructured because the dependency has to be `append` itself. The linter
  // asks for the whole `player` here — it cannot tell that a method it sees
  // called is stable — and giving it that would be wrong: `useOfferingPlayer`
  // returns a fresh object literal every render, so `player` changes identity
  // constantly and this effect would re-run on every render of the board.
  // `append` is a `useCallback` over a stable `playAt`, so this is the narrow
  // dependency the effect actually has, now stated in a form that can be
  // statically checked.
  const { append: appendAudible } = player
  /*
   * Voice counts as well as radio.
   *
   * Hands-free means the speakers are the output, so a player who says "play
   * the song Idioteque" has asked to hear something — and used to get a turn
   * that landed silently with a Play button they could not reach. `append`
   * starts a dry queue, so this is also what makes the answer play itself.
   *
   * The toggle that turned voice on is the gesture the autoplay policy wants,
   * and `useOfferingPlayer` keeps one element alive across the gap precisely so
   * that permission survives to here.
   */
  //
  // The effect itself lives below `useVoiceControl`, because it now reads
  // `voice.listening` and that does not exist until the hook has run.

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
        switchTo: armedSwitch ?? undefined,
      })
      absorb(data)
      // Remembered before focus moves, and only for a turn that landed: a move
      // that was turned away established nothing to re-ask.
      if (data.turn?.legal) setLastMove({ draft, parentId: focusId })
      // Disarmed on a legal turn only. A move turned away under the new rules
      // did not switch anything — an illegal turn is on nobody's path, so the
      // branch is still the old game — and making the player re-arm to try
      // again would be charging them for the engine's own rule.
      if (data.turn?.legal) setArmedSwitch(null)
      track('correlate_turn_played', {
        // The game actually played, which is the branch's and not the session's.
        // `startedAs` keeps the old field's meaning available rather than
        // redefining `game` under existing charts.
        game: data.mode ?? branch.mode,
        startedAs: session.mode,
        switchedFrom: data.switchedFrom ?? undefined,
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
    session.mode, branch.mode, armedSwitch,
    prediction, focusId, tuning, graph, postTurn, absorb, continueAlone,
    // `radio` IS read above, to decide whether the continuation run is skipped.
    // Leaving it out pinned this callback to radio's value at first memoisation:
    // switch the radio on and the next move still ran the fixed-length run,
    // because `radio` was false in here while true everywhere else. That is the
    // exact race the comment above says must not happen — the run and the pump
    // both answering the same offering, and the panel reporting a stop that is
    // not being applied.
    radio,
  ])

  /**
   * Close the game, and find out what it was.
   *
   * Goes through the close route rather than `finishSession`, which is what gives
   * finishing a payoff instead of a greyed-out board. The route is best-effort
   * about the reading and absolute about the close, so this always lands on a
   * finished game — see its own comment.
   */
  const finish = useCallback(async () => {
    setClosing(true)
    setError('')
    try {
      const res = await authedFetch('/api/correlate/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'It could not be closed')
      if (data.session) updateSession(data.session)
      else updateSession({ ...session, status: 'finished' })
      track('correlate_game_closed', {
        game: branch.mode,
        turns: session.turn_count,
        limit: session.turn_limit ?? null,
        reading: !!data.closing,
      })
    } catch (e: any) {
      setError(e?.message ?? 'It could not be closed')
    } finally {
      setClosing(false)
    }
  }, [session, updateSession, branch.mode])

  /**
   * Share, or stop sharing.
   *
   * A switch over the live row rather than a snapshot, so a game still being
   * played keeps updating for whoever holds the link. The clipboard write is
   * best-effort: it needs a user gesture and a permission that some browsers
   * decline, and the URL is shown either way so the button is never a dead end.
   */
  const toggleShare = useCallback(async () => {
    setSharing(true)
    setError('')
    try {
      const token = await correlateQueries.setShared(session.id, !session.share_token)
      updateSession({ ...session, share_token: token })
      if (token) {
        const url = `${window.location.origin}/play/shared/${token}`
        await navigator.clipboard?.writeText(url).catch(() => {})
        setNotice('Link copied. Anyone with it can read this chain — turn it off any time.')
      } else {
        setNotice('Sharing is off. Every link that was out there is now dead.')
      }
      track('correlate_share_toggled', { game: branch.mode, on: !!token })
    } catch (e: any) {
      setError(e?.message ?? 'That could not be shared')
    } finally {
      setSharing(false)
    }
  }, [session, updateSession, branch.mode])

  /**
   * Claim that two exchanges rhyme, and get ruled on.
   *
   * The one place the player can be *right* about something. Nine of the eleven
   * games cannot turn a move away, and the two that can do not at the default
   * Friction, so until this existed there was no way to be wrong — and therefore
   * none to be right. This reverses the direction: you reach for credit instead
   * of avoiding refusal.
   */
  /**
   * `over` lets a caller supply the claim directly instead of through the form.
   *
   * The voice path needs it and cannot work without it: it learns the two turns
   * and the reason across three separate utterances, and a `setState` followed
   * by a call in the same tick reads the *old* state. Passing the values is the
   * fix that does not involve an effect watching for a sentinel.
   *
   * The form still calls it with no argument and still reads the state, so the
   * typed path is unchanged.
   */
  const submitClaim = useCallback(async (
    over?: { fromTurnId: string; toTurnId: string; note: string },
  ) => {
    const fromId = over?.fromTurnId ?? claimFrom
    const toId = over?.toTurnId ?? claimTo
    const note = (over?.note ?? claimNote).trim()
    if (!fromId || !toId || !note) return
    setClaiming(true)
    setError('')
    try {
      const res = await authedFetch('/api/correlate/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          fromTurnId: fromId,
          toTurnId: toId,
          note,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'That could not be ruled on')
      setClaims(c => [...c, data.claim])
      setClaimFrom(null)
      setClaimTo(null)
      setClaimNote('')
      track('correlate_rhyme_claimed', { game: branch.mode, verdict: data.claim?.verdict })
      // Returned so the voice path can speak the ruling: a claim is the one
      // action whose whole point is the answer, and a hands-free player who
      // only hears "ruling on that" has been told nothing.
      return data.claim as CorrelationClaim
    } catch (e: any) {
      setError(e?.message ?? 'That could not be ruled on')
      return null
    } finally {
      setClaiming(false)
    }
  }, [claimFrom, claimTo, claimNote, session.id, branch.mode])

  // ─────────────────────────────── voice ───────────────────────────────────
  //
  // The grammar is in lib/correlate/voice.ts and the microphone in
  // useVoiceControl; what lives here is the part that needs the board's own
  // actions, which is the composer. Everything else is a one-line call into a
  // handler that already existed — which is the measure of whether the control
  // surface was factored well, and it mostly was: `again`, `you go`, `finish`,
  // `switch to X` and `go to turn N` are all existing callbacks.
  //
  // The move is the exception, and it is the whole reason hands-free is more
  // than a hotkey layer. An offering is not a command but a *selection*: a query
  // goes to a catalogue, a handful of records come back, and one has to be
  // picked. That is a conversation, so it is a small state machine — search,
  // read the results out, take an ordinal — rather than a function call.

  /** Results waiting to be chosen from, with the query that found them. */
  const [voiceResults, setVoiceResults] = useState<{ query: string; offerings: Offering[] }>(
    { query: '', offerings: [] },
  )
  /**
   * The medium voice searches in, which is a separate thing from the composer's.
   *
   * Separate because the typed picker's medium is a control the player can see
   * and this one is remembered across utterances they cannot. Defaults to the
   * session's first medium and is changed by "in art" / "play me a stretch".
   */
  const [voiceMedium, setVoiceMedium] = useState<MediumId | null>(null)
  /** Framing and relation gathered across utterances, applied to the next move. */
  const [voiceFraming, setVoiceFraming] = useState('')
  const [voiceRelation, setVoiceRelation] = useState<RelationId | null>(null)
  const [voiceExpanded, setVoiceExpanded] = useState(false)

  /**
   * The stage, mirrored into a ref.
   *
   * `voiceContext` is called from inside the recogniser's event handler, which
   * is outside React's render cycle — so it has to read the stage from
   * somewhere that is current rather than from a closure captured when the
   * callback was built. Getting this wrong makes "the second one" a search
   * query, which is the failure that is hardest to spot because it *works*.
   */
  const voiceStageRef = useRef<VoiceStage>('idle')
  /**
   * The results, mirrored for the same reason and one more.
   *
   * The grammar refuses an ordinal past `resultCount`, so a stale count of zero
   * makes "the second one" parse as nothing at all — the choice is dropped in
   * silence, which is the worst failure this interface has. The state copy still
   * exists because the count is also rendered.
   */
  const voiceResultsRef = useRef<Offering[]>([])

  /** What the grammar needs to resolve an utterance, rebuilt on every command. */
  const voiceContext = useCallback(() => ({
    stage: voiceStageRef.current,
    media,
    relations,
    switchTargets: switchTargets(branch.mode),
    resultCount: voiceResultsRef.current.length,
    options: voiceResultsRef.current,
    // Whether the speakers are making noise, which decides whether a command
    // has to be addressed. Read through the ref rather than the render value:
    // this is called from the recogniser's handler, outside React, and a render
    // behind here means the one utterance arriving as the track starts is
    // judged under the wrong rule.
    audioPlaying: audioPlayingRef.current,
  }), [media, relations, branch.mode])

  /**
   * Read a result set out, numbered, so an ordinal has something to refer to.
   *
   * Only reached when `pickConfidently` could not choose, which it usually can.
   * This was on the path of every single move and cost about ten seconds of
   * read-aloud each time, to settle a question the player had mostly already
   * answered by naming the thing.
   */
  const describeResults = useCallback((offerings: Offering[]) => {
    if (offerings.length === 0) return 'Nothing came back for that.'
    /*
     * No spoken numbering, and the question is "Which?" rather than "Which one?".
     *
     * Both for the same reason, and it is not cosmetic. The player answers by
     * position — "one", "two", "the second" — while this is still being read,
     * and a word the speaker has just said cannot be told apart from the
     * speaker saying it. Numbering the options aloud would have put every
     * possible answer into the speaker's own mouth, so the only safe way to
     * offer a numbered choice is not to read the numbers.
     *
     * The order is still what "one" and "two" refer to, and the written list in
     * the voice bar shows them numbered — which is where that affordance
     * belongs anyway.
     */
    const named = offerings.map(o => `${o.title}${o.attribution ? ` by ${o.attribution}` : ''}`)
    return `${named.join(', or ')}. Which?`
  }, [])

  const onVoiceIntent = useCallback(async (intent: VoiceIntent): Promise<string | null> => {
    // Through the ref, not the `voice` binding: this callback is built before
    // `useVoiceControl` returns, so naming `voice` in the dependency array
    // would read it in its temporal dead zone and throw on the first render.
    // The ref is the whole state of the mirror — `voiceStageRef` is what the
    // grammar reads, and the hook's copy only drives the display.
    const setStage = (s: VoiceStage) => {
      voiceStageRef.current = s
      voiceRef.current?.setStage(s)
    }
    const setResults = (query: string, offerings: Offering[]) => {
      voiceResultsRef.current = offerings
      setVoiceResults({ query, offerings })
    }

    switch (intent.kind) {
      case 'again':
        if (!canAnswerAgainRef.current) return 'There is nothing to ask again yet.'
        await answerAgain()
        return null

      case 'selfReply':
        if (!focusId) return 'There is nothing on the table for it to answer.'
        await continueOnce()
        return null

      case 'finish':
        await finish()
        return null

      case 'switch':
        armSwitch(intent.gameId)
        return null

      case 'medium':
        setVoiceMedium(intent.medium)
        return null

      case 'framing':
        setVoiceFraming(intent.framing)
        return null

      case 'relation':
        setVoiceRelation(intent.relation)
        return null

      case 'predict':
        setPrediction(intent.text)
        return null

      case 'offer': {
        const m = intent.medium ?? voiceMedium ?? media[0]
        setVoiceMedium(m)
        // A composed medium has nothing to search, so the same utterance is the
        // offering itself rather than a query for one. Submitted directly, with
        // the words as its title and the framing voice has gathered.
        if (isComposed(m)) {
          await play({
            medium: m,
            composed: { title: intent.query, steps: [intent.query], intent: 'shown' },
            framing: voiceFraming || 'all of it',
            ...(voiceRelation ? { claimedRelation: voiceRelation } : {}),
          })
          setVoiceFraming(''); setVoiceRelation(null)
          return null
        }
        const res = await authedFetch(
          `/api/offerings/search?medium=${m}&q=${encodeURIComponent(intent.query)}`,
        )
        const data = await res.json()
        if (data.error) return `${data.error}`
        const offerings = (data.offerings ?? []) as Offering[]

        // Take the obvious match rather than asking. Naming a song is not an
        // ambiguous act, and the question only earns its ten seconds when the
        // results genuinely do not settle it.
        const { pick, options } = pickConfidently(intent.query, offerings)
        if (pick) {
          setResults('', [])
          setStage('idle')
          await play({
            medium: pick.medium,
            offeringId: pick.id,
            framing: voiceFraming || pick.framing || 'all of it',
            ...(voiceRelation ? { claimedRelation: voiceRelation } : {}),
          })
          setVoiceFraming(''); setVoiceRelation(null)
          return null
        }

        setResults(intent.query, options)
        setStage(options.length > 0 ? 'choosing' : 'idle')
        return describeResults(options)
      }

      case 'choose': {
        const pick = voiceResultsRef.current[intent.index - 1]
        if (!pick) return 'There is nothing there to take.'
        setStage('idle')
        setResults('', [])
        await play({
          medium: pick.medium,
          offeringId: pick.id,
          framing: voiceFraming || pick.framing || 'all of it',
          ...(voiceRelation ? { claimedRelation: voiceRelation } : {}),
        })
        setVoiceFraming(''); setVoiceRelation(null)
        return null
      }

      case 'rhymes': {
        // Spoken turn numbers are what the board shows, which is one-based —
        // `turn_index` is zero-based. Off by one here would claim a rhyme with
        // the wrong exchange and be ruled on earnestly.
        const target = path.find(t => t.turn_index === intent.turn - 1)
        if (!target) return `There is no turn ${intent.turn} on this line.`
        if (!focusTurn) return 'Stand on an exchange first.'
        if (target.id === focusTurn.id) return 'That is the turn you are on.'
        setClaimFrom(focusTurn.id)
        setClaimTo(target.id)
        setStage('claiming')
        return null
      }

      case 'because': {
        if (!claimFrom || !claimTo) { setStage('idle'); return 'No claim is waiting.' }
        const claim = await submitClaim({
          fromTurnId: claimFrom, toTurnId: claimTo, note: intent.note,
        })
        setStage('idle')
        if (!claim) return null
        const verdict = claim.verdict === 'holds' ? 'It holds.'
          : claim.verdict === 'thin' ? 'Thin, but there.'
          : claim.verdict === 'no' ? 'It does not hold.'
          : ''
        return `${verdict} ${claim.ruling ?? ''}`.trim()
      }

      case 'goTo': {
        const target = path.find(t => t.turn_index === intent.turn - 1)
          ?? graph.order.find(t => t.turn_index === intent.turn - 1)
        if (!target) return `There is no turn ${intent.turn}.`
        if (!target.legal) return 'That move was turned away, so there is nothing there to answer.'
        focusOn(target.id)
        return null
      }

      case 'goBack':
        focusOn(defaultParent(graph)?.id ?? null)
        return null

      /*
       * Radio — the fast path, and the answer to voice play feeling slow.
       *
       * Everything else here is request/response: say a thing, wait ten to
       * fifteen seconds for a model call, hear the result. Radio inverts it. The
       * pump keeps two answers queued in front of the audio, so the model runs
       * while music is playing rather than while the player is waiting, and the
       * latency stops being something you sit through.
       *
       * Handing the state change to `changeTuning` rather than a local flag is
       * what makes the on-screen control and the spoken one the same switch.
       */
      case 'radio': {
        if (intent.on && radioBlocked) return radioBlocked
        if (radioOf(tuning) === intent.on) {
          return intent.on ? 'It is already running.' : 'It is already your turn.'
        }
        // A fresh run should not inherit the last one's bad luck — same reset the
        // button does.
        radioSilent.current = 0
        radioFailures.current = 0
        setRadioStopped('')
        changeTuning({ ...tuning, radio: intent.on })
        track('correlate_radio_toggled', { game: branch.mode, on: intent.on, via: 'voice' })
        return null
      }

      case 'skip': {
        const now = Date.now()
        if (now - lastVoiceSkip.current < VOICE_SKIP_GUARD_MS) return null
        lastVoiceSkip.current = now
        // `skip`, not `advance`: at the tail of the queue this means "find me
        // another" rather than "the track ended", and in radio that generates
        // instead of stopping — which is what a listener saying "next" means.
        player.skip()
        return null
      }

      case 'hush':
        // The speaker is already silenced by the hook. This is the other half:
        // "stop" said over a playing track means the track, and nothing else
        // here can pause it.
        if (!player.paused && player.current) player.toggle()
        return null

      // Spoken by the hook, which holds the text.
      case 'more':
        return null

      case 'cancel':
        setStage('idle')
        setResults('', [])
        setVoiceFraming(''); setVoiceRelation(null)
        setClaimFrom(null); setClaimTo(null); setClaimNote('')
        return null

      // Asking out loud opens the written list too. The spoken form is the whole
      // table and takes most of a minute; the screen is the version you can
      // skim, and a player who asked has shown they do not know what to say.
      case 'help':
        setVoiceExpanded(true)
        return null

      // Spoken by the hook, which holds the last reading.
      case 'repeat':
        return null
    }
  }, [
    answerAgain, continueOnce, finish, armSwitch, play, focusOn, submitClaim,
    focusId, focusTurn, path, graph, media, voiceMedium,
    voiceFraming, voiceRelation, claimFrom, claimTo, describeResults,
    tuning, changeTuning, radioBlocked, player, branch.mode, setRadioStopped,
  ])

  const voice = useVoiceControl(voiceContext, {
    onIntent: onVoiceIntent,
    lastReading: () => lastReadingRef.current,
    unreadRest: () => {
      // Consumed, not just read: "go on" twice should not read the same
      // paragraph twice, and the second time there genuinely is no more.
      const rest = unreadRestRef.current
      unreadRestRef.current = ''
      return rest
    },
  })
  voiceRef.current = voice

  // The queue feed, declared here because it needs `voice.listening`. See the
  // long comment on `appendAudible` above for why `append` is the dependency
  // rather than `player`.
  useEffect(() => {
    if ((!radio && !voice.listening) || audible.length === 0) return
    appendAudible(audible)
  }, [radio, voice.listening, audible, appendAudible])

  /**
   * Whether "again" is available, in a ref the voice handler can read.
   *
   * `canAnswerAgain` is computed below the early return for a retired game, so
   * it does not exist where `onVoiceIntent` is defined. Mirroring it is cheaper
   * than hoisting the computation above a guard it is downstream of.
   */
  const canAnswerAgainRef = useRef(false)

  /**
   * The phrase to print beside a control, or null when voice is off.
   *
   * A stage-specific command wins over a general one for the same control,
   * because that is what the player needs to say *next*: inside the claim panel
   * the useful phrase is "because …", not the "this rhymes with turn 4" that
   * opened it.
   */
  const voicePhrase = useCallback((control: VoiceCommand['control']): string | null => {
    if (!voice.listening) return null
    const live = hintsFor(control, voice.stage)
    return (live.find(c => c.stages) ?? live[0])?.say ?? null
  }, [voice.listening, voice.stage])

  // A session can outlive its game. Night Radio was retired along with the "dial"
  // concept it ran on, and telling someone their game no longer exists is better
  // than showing them a lookup failure — or worse, silently rehoming the session
  // into a game with different rules, which would rewrite a chain they played.
  // `branch.mode`, not `session.mode`: for an unswitched game they are the same
  // string, and for a switched one the branch's game is the one that cannot take
  // another turn. Naming the session's starting game here would explain the wrong
  // absence.
  if (!game) {
    const retired = retiredGameName(branch.mode)
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
   * The game the composer asks for, re-resolved past the guard above so it is
   * known not to be null.
   *
   * `nextGame` exists for the hooks, which must run before that guard and
   * therefore have to tolerate a null. Everything rendered below is downstream of
   * `game` being real, and a switch target always resolves — `switchTargets` is
   * built from the registry — so the fallback here is for the type, not for a
   * case that happens.
   */
  const composerGame = nextBranch.game ?? game

  /**
   * Whether the partner can answer itself here, and why not when it cannot.
   *
   * The same function the route refuses with, so the control and the rule cannot
   * drift apart — and when it is refused, the player is shown the sentence the
   * server would have sent rather than a button that fails.
   */
  const noContinuation = selfReplyRefusal(focusTurn, path, { radio })
  const runsLeft = selfRepliesLeft(path, { radio })

  /**
   * Whether "answer it again" is available, derived rather than cleared.
   *
   * True while the player is standing on one of the answers to the move they
   * just made — which is exactly when asking for another one means something.
   * Comparing parents instead of tracking focus changes is what makes this
   * survive `absorb`, which moves focus itself: the new sibling has the same
   * parent as the first answer, so the button stays, and wandering anywhere else
   * in the graph removes it with no bookkeeping.
   */
  const canAnswerAgain = !!lastMove && !!focusTurn &&
    (graph.nodes.get(focusTurn.id)?.parentId ?? null) === lastMove.parentId
  canAnswerAgainRef.current = canAnswerAgain

  /** The other answers to the same move. Each one is a line the player could walk. */
  const otherAnswers = focusTurn ? siblingsOf(graph, focusTurn.id) : []

  /**
   * How many turns are left, and whether there are none.
   *
   * Read off `turn_count` rather than counted from the rows, because that is the
   * number the server guards against — a board counting its own loaded turns
   * would disagree with the refusal the route gives, and the route is the one
   * that binds.
   */
  const turnsLeft = typeof session.turn_limit === 'number'
    ? Math.max(0, session.turn_limit - (session.turn_count ?? 0))
    : null
  const outOfTurns = turnsLeft === 0

  const shareUrl = session.share_token && typeof window !== 'undefined'
    ? `${window.location.origin}/play/shared/${session.share_token}`
    : null

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
            {/* The game this branch became, not the one the session is filed
                under. Saying where it started is what keeps the chip honest: a
                player looking at "Embodiment" on a session their library calls
                Tag should be able to see why from here rather than from the log. */}
            {branch.boundaries.length > 0 && (
              <span
                title={branch.boundaries
                  .map(b => `turn ${b.turn.turn_index + 1}: ${getGame(b.from)?.name ?? b.from} → ${getGame(b.to)?.name ?? b.to}`)
                  .join(' · ')}
                className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500"
              >
                <Shuffle size={10} />
                started as {getGame(session.mode)?.name ?? session.mode}
              </span>
            )}
            {isOver && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Finished</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            An offering here is {game.offeringIs.toLowerCase()}. {game.pieces.constraint}
          </p>
          {/* The countdown, as a sentence rather than a bare number: "4 left of
              12" is what a player needs to pace against, and the second clause is
              what makes a branch feel expensive — which is the point of a limit. */}
          {turnsLeft !== null && !isOver && (
            <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              <Hourglass size={12} className="flex-shrink-0" />
              {turnsLeft === 0
                ? `All ${session.turn_limit} turns played.`
                : `${turnsLeft} turn${turnsLeft === 1 ? '' : 's'} left of ${session.turn_limit} — a branch spends one too.`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sharing stays available on a finished game — a closed chain with its
              closing reading is the most shareable thing this section makes. */}
          {turns.length > 0 && (
            <button
              onClick={toggleShare}
              disabled={sharing}
              title={session.share_token
                ? 'Sharing is on. Click to turn it off and kill every link.'
                : 'Make a read-only link anyone can open'}
              className="btn btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {sharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {session.share_token ? 'Shared' : 'Share'}
            </button>
          )}
          {!isOver && turns.length > 0 && (
            <button
              onClick={finish}
              disabled={closing}
              title={outOfTurns
                ? 'Out of turns. Close it and find out what it was.'
                : 'End this game and find out what it was'}
              className={`text-sm flex items-center gap-1.5 disabled:opacity-50 ${
                // Emphasised only once the turns have run out, because that is
                // the one moment closing is the *only* thing left to do. Before
                // then it is one option among several and should not look like
                // the call to action.
                outOfTurns ? 'btn btn-primary' : 'btn btn-secondary'
              }`}
            >
              {closing ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
              {closing ? 'Closing…' : outOfTurns ? 'Close it' : 'Finish'}
            </button>
          )}
        </div>
      </div>

      {/* The share link, shown rather than only copied: the clipboard write needs
          a permission some browsers decline, and a button whose whole output went
          to a clipboard that refused it would be a silent failure. */}
      {session.share_token && (
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex items-center gap-2">
          <Share2 size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <code className="text-[11px] text-gray-600 dark:text-gray-300 truncate flex-1">
            {shareUrl}
          </code>
          <button
            onClick={() => { void navigator.clipboard?.writeText(shareUrl ?? '') }}
            className="text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            Copy
          </button>
        </div>
      )}

      {/* The closing reading. Top of the board on a finished game, because it is
          the answer to the thing the player just spent the whole game on. */}
      {session.closing_reading && (
        <div className={`mb-6 rounded-2xl border ${accent.ring} ${accent.bg} p-4`}>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
            <Globe2 size={12} /> What it turned out to be
          </p>
          {session.closing_reading.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed mb-2 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      )}

      {/* Out of turns, and nothing else to do. Said once, loudly, rather than as
          a count that quietly reaches zero. */}
      {outOfTurns && !isOver && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3">
          <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <Hourglass size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              That was turn {session.turn_limit} of {session.turn_limit}. The game is played out —
              close it to find out what the chain turned out to be about.
            </span>
          </p>
        </div>
      )}

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
              {/* `composerGame`, not `game`: with a switch armed before anything
                  is played, the opening prompt the player should read is the one
                  belonging to the game they are about to open. Showing Tag's
                  while they are about to play Embodiment would be the only
                  instruction on an empty board, and wrong. */}
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {turns.length === 0
                  ? composerGame.openingPrompt
                  : 'A new thread, with nothing on the table. Offer anything.'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{composerGame.pieces.goal}</p>
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
                    onClick={() => {
                      yt.prime()
                      if (playingIndex >= 0) player.toggle()
                      else player.playQueue(audible)
                    }}
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
                      // Fetched inside the gesture that starts the run, so the
                      // first track is not also waiting on a script download.
                      if (next) yt.prime()
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
                      track('correlate_radio_toggled', { game: branch.mode, on: next })
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
                     Rendered here, with `allow`, rather than left to the IFrame API
                     to create — a cross-origin embed without autoplay permission
                     will not start a track nobody clicked, which is what stopped an
                     unattended run after its first song. It also cannot be mounted
                     per track: re-creating the element drops the attached player,
                     the ENDED event the queue advances on, and that permission. So
                     it always exists and the wrapper collapses instead — visible at
                     a usable size while a full track plays, which is what the embed
                     terms ask for, and zero-height otherwise. */}
                 <div className={player.via === 'full'
                   ? 'mt-2 aspect-video rounded-lg overflow-hidden bg-black'
                   : 'h-0 overflow-hidden'}
                 >
                   <iframe
                     ref={ytFrame}
                     title="Full-length playback"
                     allow={YT_ALLOW}
                     className="w-full h-full border-0"
                   />
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
                      // Null — and therefore absent — on every turn played under
                      // the game being played now, which is every turn in a game
                      // nobody switched. A marker on all of them would make the
                      // real ones invisible.
                      playedAs={playedUnder(turn, session.mode, branch.mode)?.name ?? null}
                      claims={claims.filter(c => c.from_turn_id === turn.id || c.to_turn_id === turn.id)}
                      graphIndexOf={id => graph.nodes.get(id)?.turn.turn_index ?? null}
                      // Claimable against anything earlier on this path that is
                      // not itself — a rhyme needs two exchanges and the earlier
                      // one has to have happened before the claim.
                      onClaim={
                        isOver || path.indexOf(turn) < 1
                          ? undefined
                          : () => { setClaimFrom(turn.id); setClaimTo(null); setClaimNote('') }
                      }
                    />
                  </li>
                ))}
              </ol>

              {/*
                The claim form. Opened from a turn, which is what fixes one half
                of the pair — so the form only has to ask for the other half and
                the reason, and the reason is the claim.
              */}
              {claimFrom && (
                <div className={`mb-6 rounded-2xl border ${accent.ring} ${accent.bg} p-4`}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                    <Link2 size={13} className={accent.text} />
                    Turn {(graph.nodes.get(claimFrom)?.turn.turn_index ?? 0) + 1} rhymes with…
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    Point at an earlier exchange and say what runs through both. This is the one
                    thing here you can be straightforwardly right about — and it is ruled on
                    squarely rather than generously, so name the thread you actually see.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {path
                      .filter(t => t.legal && t.id !== claimFrom &&
                        t.turn_index < (graph.nodes.get(claimFrom)?.turn.turn_index ?? 0))
                      .map(t => (
                        <button
                          key={t.id}
                          onClick={() => setClaimTo(t.id)}
                          className={`text-[11px] px-2 py-1 rounded-full transition-colors ${
                            claimTo === t.id
                              ? `${accent.chip} font-medium`
                              : 'bg-white/70 text-gray-600 hover:bg-white dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          turn {t.turn_index + 1} · {t.reply_offering?.title ?? t.move_offering.title}
                        </button>
                      ))}
                  </div>
                  <input
                    type="text"
                    value={claimNote}
                    onChange={e => setClaimNote(e.target.value)}
                    disabled={claiming}
                    maxLength={400}
                    placeholder="What runs through both of them?"
                    className="w-full mb-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      // Wrapped rather than passed: `submitClaim` now takes an
                      // optional override for the voice path, and a click event
                      // handed straight in would arrive as that argument.
                      onClick={() => submitClaim()}
                      disabled={claiming || !claimTo || !claimNote.trim()}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 transition-colors disabled:opacity-40"
                    >
                      {claiming ? <Loader2 size={11} className="animate-spin" /> : <Link2 size={11} />}
                      Claim it
                    </button>
                    <button
                      onClick={() => { setClaimFrom(null); setClaimTo(null); setClaimNote('') }}
                      className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Never mind
                    </button>
                    {!claimTo && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">Pick an earlier turn.</p>
                    )}
                    <VoiceHint phrase={voicePhrase('claim')} />
                  </div>
                </div>
              )}
            </>
          )}

          {/*
            The other answers to the *same* move — the choice the turn loop did
            not have.
            Distinct from the block below it, and the distinction is the one the
            graph makes: `continuations` are answers to the turn in focus, which
            is where the chain goes *next*; these are rival answers to the move in
            focus, which is a decision about what just happened. Shown only when
            there is more than one, so an ordinary turn is unchanged.
          */}
          {otherAnswers.length > 0 && focusTurn && (
            <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                <Dices size={12} />
                {otherAnswers.length + 1} answers to this move — carry on from whichever you like
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {[focusTurn, ...otherAnswers]
                  .sort((a, b) => a.turn_index - b.turn_index)
                  .map(t => {
                    const here = t.id === focusTurn.id
                    const beyond = subtreeSize(graph, t.id)
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => focusOn(t.id)}
                          disabled={here}
                          className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-colors ${
                            here
                              ? `${accent.chip} font-medium`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {t.reply_offering?.title ?? 'no answer'}
                          <span className="text-gray-400 dark:text-gray-500">
                            ({getMedium(t.reply_offering?.medium ?? 'music')?.plural})
                          </span>
                          {beyond > 0 && <span className="text-gray-400 dark:text-gray-500">+{beyond}</span>}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
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
              {/* Above the composer, because it is an alternative to the whole
                  of it rather than one more field in it. */}
              <VoiceBar
                voice={voice}
                media={media}
                switchTargets={switchTargets(branch.mode)}
                audioPlaying={!!player.current && !player.paused}
                options={voiceResults.offerings}
                // Routed through the same intent the spoken form produces, so
                // tapping and saying "two" cannot drift apart.
                onChoose={i => { void onVoiceIntent({ kind: 'choose', index: i }) }}
                expanded={voiceExpanded}
                onToggleExpanded={() => setVoiceExpanded(v => !v)}
              />

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

              {/* `nextGame`, not `game`, for everything in the composer from
                  here down. The move being composed is played under the armed
                  game, so it is that game's demands the player has to be able to
                  meet: Prediction wants a guess typed, Correlation Chain wants
                  the relation named. Showing the current game's form and posting
                  it as the new game's move is how a player gets a 400 for a
                  field they were never shown. */}
              {wantsPrediction(composerGame) && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={prediction}
                    onChange={e => setPrediction(e.target.value)}
                    disabled={pending}
                    placeholder="Your prediction — what will come back?"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
                  />
                  {voice.listening && (
                    <p className="mt-1"><VoiceHint phrase="predict <anything>" /></p>
                  )}
                </div>
              )}

              <OfferingPicker
                media={media}
                relations={relations}
                declaredRelation={composerGame.declaredRelation}
                spentRelations={spent}
                previousMedium={onTheTable?.medium ?? null}
                disabled={pending}
                onSubmit={play}
              />
              {voice.listening && (
                <p className="mt-1.5 flex items-center gap-2">
                  <VoiceHint phrase={voicePhrase('compose')} />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    then say which result to take
                  </span>
                </p>
              )}

              {/* Under the composer rather than beside the game chip in the
                  header, because arming a switch is a decision about the move
                  you are about to make — it belongs next to the form it changes,
                  not next to the label it will eventually change. */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <GameSwitch
                  from={branch.mode}
                  armed={armedSwitch}
                  onArm={armSwitch}
                  disabled={pending}
                  onTable={!!onTheTable}
                />
                {voice.listening && (
                  <p className="mt-1.5"><VoiceHint phrase={voicePhrase('switch')} /></p>
                )}
              </div>

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
                      {/* Beside "let it answer itself" because the two are the
                          same family of move: both hand the next turn to the
                          partner. This one asks it to answer the same question
                          differently; that one asks it to answer its own answer. */}
                      {canAnswerAgain && (
                        <button
                          onClick={answerAgain}
                          disabled={pending}
                          title="Keep this answer and get a second one to the same move. Both stay; you choose which to carry on from."
                          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          {pending ? <Loader2 size={11} className="animate-spin" /> : <Dices size={11} />}
                          Answer it again
                        </button>
                      )}
                      {canAnswerAgain && <VoiceHint phrase={voicePhrase('again')} />}
                      <button
                        onClick={continueOnce}
                        disabled={pending}
                        className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {pending ? <Loader2 size={11} className="animate-spin" /> : <Repeat size={11} />}
                        Let it answer itself
                      </button>
                      <VoiceHint phrase={voicePhrase('selfReply')} />
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
              // The branch's game, not the session's: a switch into Embodiment
              // changes which media are load-bearing, so the reset target has to
              // follow it or "back to the default" means the wrong default.
              coreMedia={game.coreMedia ?? []}
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
function TurnBlock({
  turn, graph, player, accentText, accentChip, isFocus, onFocus, playedAs,
  claims = [], graphIndexOf, onClaim,
}: {
  turn: CorrelationTurn
  graph: TurnGraph
  player: OfferingPlayer
  accentText: string
  accentChip: string
  /** True when the next move answers this turn. */
  isFocus: boolean
  onFocus: (id: string) => void
  /**
   * The name of the game this turn was played under, when it was not the game
   * being played now. Null otherwise, and the marker is then not drawn.
   *
   * Load-bearing in the same way `move_by` is: a turn ruled by Tag's referee
   * must not read as a turn the current game ruled. The player would be looking
   * at a chain that appears to have been judged by rules it never met.
   */
  playedAs?: string | null
  /** Every rhyme claimed that touches this turn, either end. */
  claims?: CorrelationClaim[]
  /** Turn index for a claim's other end, so a claim can name it. */
  graphIndexOf?: (id: string) => number | null
  /** Open the claim form from this turn. Absent when a claim is not possible here. */
  onClaim?: () => void
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
        {playedAs && (
          <span
            title={`This exchange was played and ruled under ${playedAs}. The game was switched after it.`}
            className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
          >
            <Shuffle size={9} /> {playedAs}
          </span>
        )}
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

      {/* The guess, between the move and the reading.
          Position is the point: it goes *above* the answer, which is the order it
          happened in, so the player reads their own call before seeing what came
          back. Shown even when `prediction_called` is null — a guess with no
          ruling is a real state (the interpreter did not answer the field) and
          hiding the guess would make it look as though none was made. */}
      {turn.prediction && (
        <div className="flex items-start gap-2 pl-1">
          {turn.prediction_called === true ? (
            <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5 text-emerald-500 dark:text-emerald-400" />
          ) : turn.prediction_called === false ? (
            <Target size={13} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
          ) : (
            <Target size={13} className="flex-shrink-0 mt-0.5 text-gray-300 dark:text-gray-600" />
          )}
          <p className="text-xs leading-relaxed">
            <span className="text-gray-400 dark:text-gray-500">
              {turn.prediction_called === true ? 'you called it — ' : 'you predicted — '}
            </span>
            <span className="text-gray-600 dark:text-gray-300">{turn.prediction}</span>
          </p>
        </div>
      )}

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

      {/*
        The player's own claimed rhymes, beside the interpreter's volunteered one.
        Same edge, claimed from the other side — so they belong in the same place,
        visually distinguished by carrying a verdict. Three verdicts and three
        colours, with `thin` deliberately *not* red: "something is there and it is
        less than you said" is a real result and the one this engine produces
        best, and colouring it as failure would be the UI disagreeing with the
        ruling.
      */}
      {claims.map(claim => {
        const otherId = claim.from_turn_id === turn.id ? claim.to_turn_id : claim.from_turn_id
        const otherIndex = graphIndexOf?.(otherId) ?? null
        const mine = claim.from_turn_id === turn.id
        const tone = claim.verdict === 'holds'
          ? 'text-emerald-600 dark:text-emerald-400'
          : claim.verdict === 'thin'
            ? 'text-amber-600 dark:text-amber-400'
            : claim.verdict === 'no'
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-400 dark:text-gray-500'
        return (
          <div key={claim.id} className="flex items-start gap-1.5 pl-1 text-xs">
            <Link2 size={12} className={`flex-shrink-0 mt-0.5 ${tone}`} />
            <span className="min-w-0">
              <span className={`font-medium ${tone}`}>
                {claim.verdict === 'holds' ? 'holds'
                  : claim.verdict === 'thin' ? 'thin, but there'
                  : claim.verdict === 'no' ? 'does not hold'
                  : 'unruled'}
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                {' · '}{mine ? 'you claimed' : 'claimed from'} turn{' '}
                {otherIndex !== null ? otherIndex + 1 : '?'}
                {' · '}
              </span>
              <span className="text-gray-600 dark:text-gray-300">&ldquo;{claim.note}&rdquo;</span>
              {claim.ruling && (
                <span className="block text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {claim.ruling}
                </span>
              )}
            </span>
          </div>
        )
      })}

      {/* Offered quietly and only where a claim is possible, because most turns
          will never carry one and a button on all of them is noise. */}
      {onClaim && claims.length === 0 && (
        <button
          onClick={onClaim}
          className="flex items-center gap-1.5 pl-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Link2 size={11} /> this rhymes with an earlier turn
        </button>
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
