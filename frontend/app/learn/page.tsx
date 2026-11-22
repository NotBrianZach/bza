'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { authedFetch } from '@/lib/authedFetch'
import { getOntology, ONTOLOGIES } from '@/lib/concepts/ontology'
import { AREAS, MATHEMATICS, atlasCoverage } from '@/lib/concepts/atlas'
import { conceptById } from '@/lib/concepts/registry'
import { TRAVERSAL_GAME } from '@/lib/concepts/traversal'
import { MASTERY_FLOOR } from '@/lib/concepts/scheduling'
import { practisableConcepts } from '@/lib/concepts/tasks'
import { openingForPoint } from '@/lib/concepts/socratic'
import { offerFor } from '@/lib/concepts/commission'
import {
  INITIAL, transition, type ChartEvent, type ErrandState,
} from '@/lib/concepts/commissionChart'
import ArmatureMap, { type TakeWork } from '@/components/concepts/ArmatureMap'
import ConceptBrowser from '@/components/concepts/ConceptBrowser'
import ClaimsList from '@/components/concepts/ClaimsList'
import ConceptGraph from '@/components/concepts/ConceptGraph'
import JourneyMap from '@/components/concepts/JourneyMap'
import PracticeChat from '@/components/concepts/PracticeChat'
import PracticePanel, { type PracticeTaskView } from '@/components/concepts/PracticePanel'
import ReviewQueue from '@/components/concepts/ReviewQueue'
import RpnCalculator from '@/components/concepts/RpnCalculator'
import SocraticWalk from '@/components/concepts/SocraticWalk'
import ProbePanel from '@/components/concepts/ProbePanel'
import Scratchpad, { type ScratchpadHandle } from '@/components/concepts/Scratchpad'
import TraversalMap, { type TraversalView } from '@/components/concepts/TraversalMap'

export const dynamic = 'force-dynamic'

/**
 * The practice surface — the sibling engine, next to /play rather than inside it.
 *
 * Nothing on this page touches app/api/correlate/turn/route.ts, `listen_turns` or
 * `listen_sessions`. That separation is the architecture, not an accident of
 * layout: the turn route guarantees that a legal turn carries a real reply through
 * four stages, and that guarantee would be a lie under a verifier judge. What the
 * two share is the four registries in lib/correlate/ — media, relations, tuning
 * and scope — and the honesty discipline. See lib/concepts/types.ts.
 *
 * The tabs are the five steps, which is also the order they were built in: the
 * ontology browser is the cheap probe, the practice loop is the verifier end to
 * end, the traversal is the reframing that makes it feel like bza, and the
 * scratchpad is the surface feature with no CAS behind it.
 */

type Tab = 'practice' | 'concepts' | 'world' | 'review' | 'tutor' | 'tools'
/** Which question the Tutor tab asks. See the toggle for why both exist. */
type TutorMode = 'walk' | 'probe'

/**
 * Display names for every subject in the composed atlas — the mapped areas and
 * the two with problems written for them.
 *
 * Computed once at module scope because the atlas is a static document; nothing
 * about it depends on the session, and recomputing it per render would be work
 * done for no possible change in the answer.
 */
const AREA_NAMES: Record<string, string> = {
  ...Object.fromEntries(ONTOLOGIES.map(o => [o.subject.id, `${o.subject.name} — has problems`])),
  ...Object.fromEntries(AREAS.map(a => [a.id, a.name])),
}

/**
 * The same ids without the "— has problems" suffix.
 *
 * That suffix earns its place in the subject PICKER, where the question is
 * which of twenty-four things is worth selecting and most of them have nothing
 * to practise. It is noise anywhere the answer is already known: a row in the
 * claims list is a concept you have claimed, so it necessarily has problems,
 * and "Arithmetic foundations — has problems" reads as a label nobody wrote on
 * purpose.
 */
const SUBJECT_NAMES: Record<string, string> = {
  ...Object.fromEntries(ONTOLOGIES.map(o => [o.subject.id, o.subject.name])),
  ...Object.fromEntries(AREAS.map(a => [a.id, a.name])),
}

const COVERAGE = atlasCoverage(MATHEMATICS)
/**
 * How many concepts have a problem behind them, which is fewer than have
 * material. Module scope: the atlas and the task list are both static.
 */
const PRACTISABLE = practisableConcepts(MATHEMATICS).length

/**
 * The subject shown before the session response names one.
 *
 * `ONTOLOGIES[0]`, which is the same expression /api/learn/session uses for its
 * own default, because these two defaults have to be the SAME subject: this one
 * decides which graph the Concepts tab draws on a first paint, and a mismatch
 * would show one subject's map above another's tasks for as long as the request
 * is in flight.
 *
 * It was `RATIONAL_EXPRESSIONS`, hard-coded in three places. That stopped being
 * right when arithmetic was authored underneath it — see the route's own note.
 */
const DEFAULT_SUBJECT = ONTOLOGIES[0]

interface Named { conceptId: string; conceptName: string }

interface SessionResponse {
  subject?: { id: string; name: string; covers: string }
  /** Every shipped subject, so the picker does not have to hardcode the list. */
  subjects?: { id: string; name: string }[]
  verifier?: { configured: boolean }
  /** How many rulings the engine could not settle and nobody has adjudicated. */
  awaitingReview?: number
  tasks?: PracticeTaskView[]
  skipped?: { taskId: string; reason: string }[]
  blocked?: { conceptId: string; conceptName: string; missing: Named[] }[]
  progress?: {
    points: number
    demonstrated: number
    assistedOnly: number
    strongConcepts: number
    concepts: {
      conceptId: string
      strength: number
      introducible: boolean
      /**
       * Open because you SAID so, rather than because you earned it.
       *
       * Declared here even though it is only read by the graph: the route
       * started sending it and an interface that omits a field the server
       * sends is how it gets silently dropped by the next person who maps over
       * this array.
       */
      claimed?: boolean
    }[]
  }
  // `openings` as its own field rather than intersecting `frontier` with
  // Named[]. That intersection resolved to `never`, which is assignable to the
  // `number` TraversalView declares — so tsc accepted passing an array of
  // objects where a count was expected, and the practice tab crashed with React
  // error #31 instead. The type now says what the route sends.
  traversal?: TraversalView & { openings: Named[] }
  error?: string
}

export default function LearnPage() {
  const [tab, setTab] = useState<Tab>('practice')
  /**
   * A concept named in the URL, so /play can link straight at one.
   *
   * Read from `window.location.search` in an effect rather than through
   * `useSearchParams`. Two reasons, and the second is the one that bites: this
   * page is statically prerendered, and `useSearchParams` in a prerendered
   * client component has to sit inside a Suspense boundary or the build
   * complains — and the failure mode for getting that wrong in this codebase is
   * a route that builds clean, passes every test, and 500s on every request.
   * An effect runs only in the browser, where the query string is simply there.
   *
   * Nothing is pushed back into the URL as the learner clicks around. The link
   * is an entry point, not a synchronised view: writing the tab back would make
   * the back button walk tabs, which is not what anyone means by it here.
   */
  const [linkedConcept, setLinkedConcept] = useState<string | null>(null)
  const [state, setState] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  /**
   * Which subject to practise. Null means "whatever the route defaults to", so
   * the first load does not have to know the subject list before asking for it.
   *
   * The build ships two subjects and without this the second was authored,
   * tested, and reachable only by hand-editing a URL.
   */
  const [subject, setSubject] = useState<string | null>(null)
  /**
   * Which map the Concepts tab draws.
   *
   * Three, and they are three views of one thing rather than three features:
   * the practised subject, the whole atlas, and the journeys across it. The
   * journeys began as a list below the graph and became a scope because they
   * are a map too — one whose nodes are destinations rather than concepts, and
   * which is not expected to be connected. A second permanent panel would have
   * been a separate element competing with the graph for the same screen.
   *
   * Not persisted, and in the URL only when something asks for it explicitly.
   *
   * The distinction matters and the original note conflated them. A REMEMBERED
   * value is the hazard: a learner who glanced at the whole atlas once comes
   * back next week to three hundred nodes instead of their fifteen, having
   * asked for nothing. A link that says "Concept map" and lands on the map is
   * not that — it is the caller naming which of the three views it meant, which
   * is why the home page can offer the atlas directly while the default here
   * stays the practised subject.
   */
  const [scope, setScope] = useState<'subject' | 'atlas' | 'journeys'>('subject')

  /**
   * What the scratchpad and the tutor need from the practice panel.
   *
   * `currentTask` is reported up by PracticePanel rather than tracked here —
   * the index lives there, and a second copy would drift. `pad` is the handle
   * the tutor writes through. `padEmpty` is the only piece of scratchpad state
   * the page holds, because disabling "check my working" is a render-time
   * question while the text itself is pulled at call time.
   */
  const [currentTask, setCurrentTask] = useState<PracticeTaskView | null>(null)
  const [pad, setPad] = useState<ScratchpadHandle | null>(null)
  const [padEmpty, setPadEmpty] = useState(true)

  /**
   * A task the concept map asked us to open, by id.
   *
   * Lives here rather than in `PracticePanel` because the jump crosses a tab
   * boundary: the map is on Concepts and the problem is on Practice, so
   * something above both has to hold the request while the tab changes.
   */
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  /**
   * What tutor mode should lead the learner through.
   *
   * Here for the same reason `focusTaskId` is: the request crosses a tab
   * boundary, so something above both tabs has to hold it while the tab
   * changes. Two shapes because the two callers know different things — a map
   * knows a concept and offers its worked examples, a queued problem knows the
   * knowledge point it was generated from and starts that one walk.
   *
   * Cleared by nothing. A learner who walks back to the concept map and
   * returns should find the walk where they left it, and the walk holds no
   * record anyway — see SocraticWalk's header.
   */
  const [walkTarget, setWalkTarget] = useState<{ conceptId?: string; pointId?: string } | null>(null)
  const [tutorMode, setTutorMode] = useState<TutorMode>('walk')

  /** A map asked to be led through a concept. Offers its examples. */
  const leadThroughConcept = useCallback((conceptId: string) => {
    setWalkTarget({ conceptId })
    setTab('tutor')
  }, [])

  /**
   * Work taken from a refused road — docs/RPG_AND_THE_GRAPH.md §4.
   *
   * The state it is IN lives in `errand` and belongs to the statechart in
   * lib/concepts/commissionChart.ts; everything else in this object is data
   * hanging off that state — the task that was chosen, the prose the game
   * master wrote, the ruling the verifier returned.
   *
   * It crosses a tab boundary exactly as `focusTaskId` and `walkTarget` do —
   * taken on the RPG tab, resolved on the Practice tab — so it lives above
   * both for the same reason.
   */
  const [commission, setCommission] = useState<null | (TakeWork & {
    /**
     * The subject whose session can satisfy this commission.
     *
     * Load-bearing, and not merely informational. Taking work usually CHANGES
     * the practised subject, and the session for the new one is fetched
     * asynchronously — so for a moment `state` still holds the previous
     * subject's tasks. Without this, the effect below reads that stale
     * response, finds no task for the concept, and sets `miss`, which
     * short-circuits it forever. The learner would be told "no problem for
     * Long division right now" by a response that was never asked about long
     * division.
     */
    subjectId: string
    /**
     * Where the errand is, as the statechart says.
     *
     * This replaced three booleans-by-implication — `taskId === null` meaning
     * pending, `miss` meaning unavailable, `framing === null` meaning
     * un-narrated — which between them could represent states the errand
     * cannot actually be in, and did: the bug this file carried was a
     * `miss` set while the session for the right subject had not arrived.
     *
     * Every change to this value goes through `transition` in
     * lib/concepts/commissionChart.ts. Nothing here assigns a state
     * literal, which is the property that makes the chart the authority
     * rather than documentation of what the component happens to do.
     */
    errand: ErrandState
    taskId: string | null
    framing: string | null
    source: string | null
    note: string | null
    /** The verifier's word, once there is one. Narrated, never judged here. */
    ruling: string | null
    /** Whether help was used, for the scene. A circumstance, not a fault. */
    assisted?: boolean
  })>(null)

  /**
   * Send an event to the errand region.
   *
   * The context the guards read is only meaningful for the ROAD region, and
   * the road is not modelled in this component at all — `offerKey` and the
   * strength table own it on the server, and the whole point of the two
   * regions being orthogonal is that this component cannot move it. So the
   * context here is a constant that no errand transition consults, and the
   * errand transitions carry no guards. If one ever does, this is where the
   * real numbers have to start arriving.
   */
  const fire = useCallback((event: ChartEvent) => {
    setCommission(c => c && ({
      ...c,
      errand: transition('errand', c.errand, event, { strength: 0, floor: 1, standingThere: false }),
    }))
  }, [])

  /**
   * Take the work a road wanted.
   *
   * Sets the subject the way the Practice tab's own picker would — the same
   * move `onPractise` makes for a region — and then leaves the rest to the
   * effect below, because the task cannot be chosen until the session for that
   * subject has been fetched.
   *
   * `offerFor` decides whether there is work at all, and the button that calls
   * this has already asked the same question; asking twice is deliberate. The
   * button is drawn from the atlas and this runs on a click, and the one thing
   * neither should do is set a commission for a concept with no problems.
   */
  const takeWork = useCallback((work: TakeWork) => {
    const offer = offerFor(work.conceptId, work.conceptName)
    if (offer.kind !== 'workable') return
    setSubject(offer.subjectId)
    setScope('subject')
    /* The two events the chart says this click is, run from the initial state
       rather than assigning `working.pending` directly. Longer by one line
       and it means the component cannot disagree with the chart about where
       taking work lands — `take-work` targets the compound state and the
       initial child is what decides. */
    const NO_GUARD = { strength: 0, floor: 1, standingThere: false }
    const errand = transition('errand',
      transition('errand', INITIAL.errand, 'refused', NO_GUARD), 'take-work', NO_GUARD)
    setCommission({
      ...work,
      subjectId: offer.subjectId,
      errand,
      taskId: null, framing: null, source: null, note: null, ruling: null,
    })
    setFocusTaskId(null)
    setTab('practice')
  }, [])
  /**
   * Which concept the map is looking at.
   *
   * Lifted out of `ConceptGraph` so the journey list can drive it — the two
   * are the same path seen as prose and as topology, and they have to agree
   * about which node that is.
   */
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)

  const [claiming, setClaiming] = useState<string | null>(null)
  /** Bumped after any successful claim, so ClaimsList re-reads. See its prop note. */
  const [claimsVersion, setClaimsVersion] = useState(0)
  const [claimNote, setClaimNote] = useState<string | null>(null)

  /**
   * Claim a concept, then reload so its tasks appear immediately.
   *
   * The reload is the point: a claim that did not visibly open anything would
   * look like it had failed. The note returned by the route is shown verbatim
   * rather than reworded here, so the one explanation of what a claim does and
   * does not do lives in exactly one place.
   */
  /**
   * The subject whose graph and browser are shown.
   *
   * Follows the practice picker, or the Concepts tab would show one subject's
   * graph while the practice tab served another's tasks. Falls back to the
   * session's own subject before the hard-coded default, so a first load that
   * has not chosen anything still agrees with what it is about to serve.
   */
  const subjectOntology =
    getOntology(subject ?? state?.subject?.id ?? '') ?? DEFAULT_SUBJECT

  const claim = useCallback(async (conceptId: string, conceptName: string) => {
    setClaiming(conceptId)
    setClaimNote(null)
    try {
      const res = await authedFetch('/api/learn/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject ?? undefined, conceptId }),
      })
      const d = await res.json()
      setClaimNote(d.error ? `could not claim ${conceptName}: ${d.error}` : d.effect)
      if (!d.error) { setClaimsVersion(v => v + 1); await load() }
    } catch {
      setClaimNote(`could not claim ${conceptName}`)
    } finally {
      setClaiming(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  /**
   * Claim a concept and everything teachable it rests on.
   *
   * Confirmed before posting, which the single claim is not. The difference is
   * that this writes a row per concept across subjects the learner is not
   * looking at, and the honest moment to say how many is before rather than
   * after. The graph's own disclosure list names them; this names the count and
   * the one consequence that matters.
   *
   * `subject` is still sent, but only so an unknown-subject request 404s the
   * same way. The route files each row under the concept's OWN subject — see
   * its note on why anything else would be invisible.
   */
  const claimChain = useCallback(async (
    conceptId: string, conceptName: string, chain: string[],
  ) => {
    const ok = window.confirm(
      `Claim ${chain.length} concepts — ${conceptName} and the ${chain.length - 1} it rests on?\n\n`
      + `Each becomes available to practise now. None of them is marked as known: a claim `
      + `counts for nothing until you answer that concept's problems unaided, and the first `
      + `unaided wrong answer withdraws that one concept's claim.`,
    )
    if (!ok) return

    setClaiming(conceptId)
    setClaimNote(null)
    try {
      const res = await authedFetch('/api/learn/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject ?? undefined, conceptId, scope: 'chain' }),
      })
      const d = await res.json()
      setClaimNote(d.error ? `could not claim the chain under ${conceptName}: ${d.error}` : d.effect)
      if (!d.error) { setClaimsVersion(v => v + 1); await load() }
    } catch {
      setClaimNote(`could not claim the chain under ${conceptName}`)
    } finally {
      setClaiming(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = subject ? `?size=8&subject=${encodeURIComponent(subject)}` : '?size=8'
      const response = await authedFetch(`/api/learn/session${query}`)
      setState((await response.json()) as SessionResponse)
    } catch (e) {
      setState({ error: e instanceof Error ? e.message : 'could not load the session' })
    } finally {
      setLoading(false)
    }
  }, [subject])

  useEffect(() => { load() }, [load])

  /**
   * Resolve a commission once the session that can satisfy it has arrived.
   *
   * `takeWork` sets the subject and cannot do more: the task has to come from
   * `assemble()`, and `assemble()` runs on the server behind the session
   * request that the subject change has only just triggered. So this waits for
   * the response and then does the two things that need it — focus the task,
   * and ask the game master to frame it.
   *
   * ── A MISS IS REPORTED, NEVER SWALLOWED ───────────────────────────────────
   *
   * The session can perfectly well come back with no task for the concept: it
   * is served eight tasks across whatever is introducible, and the concept the
   * road wanted may not be introducible yet — its OWN prerequisites may be
   * short. `offerFor` cannot know that (it reads no strengths; see its header),
   * so the honest handling is here.
   *
   * The failure this avoids is the quiet one. Focus nothing, say nothing, and
   * the learner lands on the Practice tab looking at some other concept's
   * problem, having just been told they were being handed long division. They
   * would do that problem believing it was the work the road wanted. So a miss
   * sets `miss` and the banner says the concept was not in this set and points
   * at the blocked list, which is where its own prerequisites are named.
   *
   * ── THE FRAMING CANNOT FAIL THE WORK ──────────────────────────────────────
   *
   * The commission route is asked for prose and nothing else. Every failure
   * path — no key, no quota, a dead model — returns the bare errand from
   * `unframedCommission`, and this does not even check: `framing` is whatever
   * came back, and a thrown request leaves it null, which the banner renders as
   * the concept name alone. The work below it is unaffected either way.
   */
  useEffect(() => {
    /* One state, not three flags: this resolves exactly once, out of the one
       state that means "taken on, task not here yet". */
    if (!commission || commission.errand !== 'working.pending') return
    if (!state || state.error || loading) return
    /* The response has to be the one for the commission's own subject. See the
       note on `subjectId` for the misreport this prevents — it is the whole
       reason that field exists, and `working.pending` is the chart's name for
       the window in which the mistake was possible. */
    if (state.subject?.id !== commission.subjectId) return

    const task = (state.tasks ?? []).find(t => t.conceptId === commission.conceptId)
    if (!task) {
      fire('no-task')
      return
    }

    setFocusTaskId(task.id)
    setCommission(c => c && ({
      ...c,
      taskId: task.id,
      errand: transition('errand', c.errand, 'task-shown',
        { strength: 0, floor: 1, standingThere: false }),
    }))

    /* No cleanup flag. The worst a late response can do is set a framing for a
       commission the learner has moved on from, and the setter is guarded on
       the task id still matching — which is cheaper than an abort and says the
       same thing. */
    if (!commission.regionId) return
    authedFetch('/api/learn/commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regionId: commission.regionId,
        taskId: task.id,
        blockedRoad: commission.blockedRoad,
      }),
    })
      .then(r => r.json())
      .then((d: { framing?: string; source?: string; note?: string }) => {
        setCommission(c => (c && c.taskId === task.id
          ? { ...c, framing: d.framing ?? null, source: d.source ?? null, note: d.note ?? null }
          : c))
      })
      .catch(() => { /* the work stands; only the telling of it is missing */ })
  }, [commission, state, loading, fire])

  /**
   * The verifier ruled, so the game master says what the room did about it.
   *
   * This is the step that closes §3's loop. Up to here a commission was a
   * framing and then silence: you did the work on the Practice tab and the
   * fiction never heard the answer. Now the ruling goes back to the GM as
   * settled fact and comes back as a scene.
   *
   * ── WHAT THIS MUST NOT BECOME ─────────────────────────────────────────────
   *
   * A judgement. Nothing here forms, softens or interprets the ruling — the
   * word is passed through, the route validates it against the four the
   * verifier can produce, and the prompt is told to narrate THAT. In
   * particular `inconclusive` is forwarded exactly like the other three: §6
   * calls it a scene rather than a failure, the chart gives it no edge to
   * `correct` or `incorrect`, and this is the third place that has to agree.
   *
   * It fires for a ruling on THIS commission's task and no other. Practising
   * something else while an errand is open is allowed and common, and a scene
   * about the wrong problem would be a lie the fiction told itself.
   */
  const onRuled = useCallback((taskId: string, verdict: { ruling: string }, assisted: boolean) => {
    setCommission(c => {
      if (!c || c.taskId !== taskId) return c
      const event = `ruled-${verdict.ruling}` as ChartEvent
      const next = transition('errand', c.errand, event,
        { strength: 0, floor: 1, standingThere: false })
      /* An event the chart does not handle leaves the state alone, and that
         is the signal to do nothing rather than narrate: a ruling word the
         chart has no state for is one this code has never seen, and inventing
         a scene for it is how an unknown ruling becomes a confident one. */
      if (next === c.errand) return c
      return {
        ...c,
        errand: next,
        ruling: verdict.ruling,
        assisted,
        /* The framing is cleared so the ruling effect below has something to
           fill. The hand-over has done its job by this point — the work is
           done — and keeping both would put two paragraphs of game master in
           one card. */
        framing: null, source: null, note: null,
      }
    })
  }, [])

  /**
   * Fetch the scene for a ruling once the chart has recorded one.
   *
   * Separate from `onRuled` because that runs inside a state updater and must
   * stay pure. Keyed on the errand being a `ruled.*` state with no prose yet,
   * which is the same "one state, not three flags" shape as the resolve effect
   * above.
   */
  useEffect(() => {
    if (!commission || !commission.ruling || commission.framing) return
    if (!commission.errand.startsWith('ruled.')) return
    if (!commission.regionId || !commission.taskId) return
    const forTask = commission.taskId
    authedFetch('/api/learn/commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regionId: commission.regionId,
        taskId: forTask,
        ruling: commission.ruling,
        assisted: commission.assisted === true,
      }),
    })
      .then(r => r.json())
      .then((d: { framing?: string; source?: string; note?: string }) => {
        setCommission(c => (c && c.taskId === forTask
          ? { ...c, framing: d.framing ?? null, source: d.source ?? null, note: d.note ?? null }
          : c))
      })
      .catch(() => { /* the ruling stands; only the telling of it is missing */ })
  }, [commission])

  /*
   * The links in: ?tab=concepts&concept=<id> from /play, and
   * ?tab=concepts&scope=atlas from the home page's Learn band.
   *
   * Once, on mount. Each parameter is honoured only when it names something
   * real — a tab that exists, a scope that exists, a concept the atlas knows —
   * and ignored otherwise. A stale link from an old chain should land on a
   * working page rather than an empty panel, since the mathematics in a
   * recorded game outlives any particular shape of this registry.
   *
   * Absent means default, which is what keeps `scope` honest: nothing is
   * remembered, so /learn with no query is the practised subject every time.
   */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const wanted = q.get('tab')
    if (wanted === 'practice' || wanted === 'concepts' || wanted === 'world'
      || wanted === 'review' || wanted === 'tutor' || wanted === 'tools') {
      setTab(wanted)
    }
    const wantedScope = q.get('scope')
    if (wantedScope === 'subject' || wantedScope === 'atlas' || wantedScope === 'journeys') {
      setScope(wantedScope)
    }
    const concept = q.get('concept')
    if (concept && conceptById(MATHEMATICS, concept)) {
      setLinkedConcept(concept)
      // ?tab=tutor&concept=<id> is the same link shape /play already uses, and
      // on the tutor tab a named concept means "offer me its derivations".
      if (wanted === 'tutor') setWalkTarget({ conceptId: concept })
    }
    /*
     * The practised subject, and it is the one parameter here that is also
     * WRITTEN back — see the effect below for why that is a different
     * decision from the tab and not an inconsistency.
     *
     * Validated against ONTOLOGIES rather than `state.subjects`, because
     * this runs on mount and the session response has not arrived yet. That
     * is the right list anyway: ONTOLOGIES is what /api/learn/session can
     * actually serve problems from, so a subject outside it would set the
     * picker to something the route then silently replaces with its own
     * default — the mismatch DEFAULT_SUBJECT exists to prevent.
     */
    const wantedSubject = q.get('subject')
    if (wantedSubject && ONTOLOGIES.some(o => o.subject.id === wantedSubject)) {
      setSubject(wantedSubject)
    }
  }, [])

  /*
   * Keep ?subject= in the URL so the choice survives a reload.
   *
   * The note on `linkedConcept` says nothing is pushed back into the URL
   * because "the link is an entry point, not a synchronised view", and that
   * is still right for the tab and the scope — a remembered scope is the
   * hazard it describes, where a learner who glanced at the whole atlas
   * comes back to three hundred nodes having asked for nothing.
   *
   * The subject is the exception and the asymmetry is deliberate. It is not
   * a view of the same material, it decides WHICH material the session
   * serves, and losing it on reload sent the learner back to
   * ONTOLOGIES[0] — which is how six of the seven authored subjects were
   * reachable only by hand-editing a URL. A chosen subject is a decision;
   * a glanced-at map is not.
   *
   * `replaceState`, not `push`: the back button should leave this page
   * rather than walk the subjects visited on it, which is the same
   * reasoning the tab note gives for not writing itself back at all.
   *
   * Skipped while null, because null means "whatever the route defaults
   * to" and there is no id to write. The consequence worth knowing: once a
   * subject has been chosen the parameter stays, since nothing in the UI
   * returns the picker to "default" — every control sets a concrete id.
   */
  useEffect(() => {
    if (!subject) return
    const q = new URLSearchParams(window.location.search)
    if (q.get('subject') === subject) return
    q.set('subject', subject)
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`)
  }, [subject])

  return (
    <main className='min-h-screen bg-gray-950 text-gray-100'>
      <header className='border-b border-gray-800 bg-gray-900'>
        <div className='mx-auto flex max-w-4xl items-center gap-3 px-4 py-3'>
          <Link href='/' className='text-gray-400 hover:text-gray-200'>
            <ArrowLeft size={18} />
          </Link>
          <div className='min-w-0 flex-1'>
            <h1 className='text-base font-semibold'>{TRAVERSAL_GAME.name}</h1>
            <p className='truncate text-xs text-gray-500'>{TRAVERSAL_GAME.tagline}</p>
          </div>
          {/* The subject picker used to sit here, unlabelled, beside the theme
              toggle — a bare dropdown in the corner with an `sr-only` label,
              which gave a sighted learner no way to tell what it changed. It
              decides which problems the session serves, so it now sits at the
              top of the Practice tab with a visible label. Only the theme
              toggle is global enough to belong in the header. */}
          <ThemeToggle />
        </div>
        <nav className='mx-auto flex max-w-4xl gap-1 px-4'>
          {([
            ['practice', 'Practice'],
            ['concepts', 'Concepts'],
            // Beside Concepts because it answers the same question from the
            // other end. Concepts draws what rests on what, which is the truth
            // and is also a hairball to anyone who does not yet know the names;
            // the world map gives twenty-one named places with one idea each,
            // navigable before you know any of them. It is second rather than
            // first because the graph is the authority and this is the way in.
            /*
             * "RPG mode" and not "The Armature", which is what this was called
             * and still is in the code (lib/concepts/armature.ts). The two
             * names answer different questions and only one of them is the
             * reader's: "Armature" says what the thing IS to somebody who
             * already knows the feature exists, and "RPG mode" says what you
             * get from clicking it. A tab label only ever gets to do the
             * second.
             *
             * The `world` param is unchanged on purpose — it is in the home
             * page's link and in anything anyone has already saved, and a URL
             * is not a label.
             */
            ['world', 'RPG mode'],
            // Between the maps and the review queue on purpose: a walk is
            // entered from a map and leaves for a problem, so it sits on the
            // road between them rather than at the end of the row.
            ['tutor', 'Tutor'],
            ['review', 'Review'],
            ['tools', 'Scratchpad'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              /*
               * Clicking the Tutor tab clears any target first, so it means
               * "tutor me" every time.
               *
               * `walkTarget` is sticky — nothing resets it — so after one jump
               * from the concept map this tab would keep re-offering that
               * concept's derivations forever, and the autostart below would
               * stay suppressed by a choice the learner made once. Only the
               * manual click clears it: the programmatic entries set the target
               * and then call `setTab` directly, so they never come through
               * here and keep working.
               */
              onClick={() => { if (id === 'tutor') setWalkTarget(null); setTab(id) }}
              className={`-mb-px border-b-2 px-3 py-2 text-sm ${
                tab === id
                  ? 'border-emerald-500 text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {label}
              {/* The badge is the whole point of surfacing the count: an
                  unsettled ruling that nobody can see is one nobody adjudicates. */}
              {id === 'review' && (state?.awaitingReview ?? 0) > 0 && (
                <span className='ml-1.5 rounded-full bg-sky-900 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200'>
                  {state!.awaitingReview}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className='mx-auto max-w-4xl space-y-4 px-4 py-5'>
        {loading && !state && (
          <p className='flex items-center gap-2 text-sm text-gray-400'>
            <Loader2 size={14} className='animate-spin' /> Loading…
          </p>
        )}

        {/* Arriving from a theorem in /play.
            Stated rather than silently acted on, because what the learner wants
            here and what the scheduler wants are not the same thing: the
            practice set is whatever is introducible now, and a concept named in
            a link is usually behind a prerequisite. Claiming is the one honest
            way through — it asserts you already know the thing — and it is the
            learner's assertion to make, not a side effect of following a link.

            `claim` is the same callback the graph uses, so this adds an entry
            point and no new mechanism. */}
        {linkedConcept && (() => {
          const c = conceptById(MATHEMATICS, linkedConcept)
          if (!c) return null
          const teachable = c.knowledgePoints.length > 0
          return (
            <div className='rounded-lg border border-sky-900/50 bg-sky-950/30 px-3 py-2 text-[12px] text-sky-100'>
              <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                <span className='text-sky-300'>from a theorem in play:</span>
                <strong>{c.name}</strong>
                {teachable ? (
                  <>
                    <button
                      onClick={() => claim(c.id, c.name)}
                      disabled={claiming === c.id}
                      className='rounded-full border border-sky-700 px-2 py-0.5 text-[11px] hover:bg-sky-900/50 disabled:opacity-50'
                    >
                      {claiming === c.id ? 'opening…' : 'open it for practice'}
                    </button>
                    <span className='text-sky-400/70'>
                      — if it is already open, it is in the set below
                    </span>
                  </>
                ) : (
                  <span className='text-sky-400/70'>
                    is on the map but nothing is authored for it, so there are no problems to
                    do. The Concepts tab shows where it sits.
                  </span>
                )}
              </p>
              <button
                onClick={() => setLinkedConcept(null)}
                className='mt-1 text-[11px] text-sky-400/70 underline hover:text-sky-200'
              >
                dismiss
              </button>
            </div>
          )
        })()}

        {state?.error && (
          <p className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200'>
            {state.error}
          </p>
        )}

        {tab === 'practice' && state && !state.error && (
          <>
            {/* Which subject the session serves.

                Here rather than in the header, where it was an unlabelled
                dropdown next to the theme toggle. It belongs with the problems
                it governs, and the label has to be visible: "Practising" is the
                whole explanation of what the control does.

                Still gated on there being a choice — a picker with one option
                is noise — and the options still come from the route, because
                hardcoding them here would mean adding a subject in two places.
                Without this control the route falls back to ONTOLOGIES[0] for
                everybody and the other six authored subjects are served to
                nobody, which is the regression its own route comment records
                having already been fixed once. */}
            {(state.subjects?.length ?? 0) > 1 && (
              <label className='flex flex-wrap items-center gap-2 text-xs text-gray-400'>
                Practising
                <select
                  value={subject ?? state.subject?.id ?? ''}
                  /* Scope follows the subject here too, for the reason
                     spelled out at ArmatureMap's `onPractise`: choosing what
                     to practise and then opening Concepts should draw the
                     thing just chosen, not whichever of the three views was
                     last looked at. Both doors into `setSubject` now agree. */
                  onChange={e => { setSubject(e.target.value); setScope('subject') }}
                  className='rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-emerald-700 focus:outline-none'
                >
                  {state.subjects?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}

            {state.traversal && (
              <TraversalMap
                traversal={state.traversal}
                openings={state.traversal.openings ?? []}
                onChanged={load}
              />
            )}

            {/* The commission: the game master's hand-over, above the engine's
                problem — docs/RPG_AND_THE_GRAPH.md §3.

                The layout IS the safety argument, so it is worth saying what
                each part is. The italic prose is the GM's and contains no
                mathematics, because the route never showed it any: it is told
                the concept and the task's KIND and nothing else, so it cannot
                restate a problem it has not seen. The problem itself is
                rendered by PracticePanel below, verbatim from assemble(),
                exactly as it is on any other visit to this tab. Two visibly
                different kinds of text, one of which a verifier stands behind.

                A learner reads the reason to care from the first and the
                mathematics from the second. If a later change has the GM
                paraphrasing the task, that is the failure §10 names first. */}
            {commission && (
              <div className='rounded-lg border border-amber-900/50 bg-amber-950/20 p-3'>
                <p className='flex flex-wrap items-center gap-x-2 text-[10px] uppercase tracking-wide text-amber-400/70'>
                  <span>Commissioned work</span>
                  <span className='normal-case tracking-normal text-amber-300/60'>
                    · {commission.conceptName}
                    {commission.blockedRoad && <> · the road to {commission.blockedRoad} wanted it</>}
                  </span>
                  <button
                    onClick={() => { setCommission(null); setFocusTaskId(null) }}
                    className='ml-auto normal-case tracking-normal text-amber-400/60 underline hover:text-amber-200'
                  >
                    put it down
                  </button>
                </p>
                {/* One branch per state the errand can be in, which is the
                    point of having a chart: there is no combination of flags
                    to get wrong, and a state with no branch here is a visible
                    omission rather than a blank card. */}
                {commission.errand === 'unavailable' ? (
                  <p className='mt-1.5 text-[12px] leading-relaxed text-amber-200/80'>
                    This set has no problem for {commission.conceptName} right now — it is probably
                    not introducible yet, which means something it rests on is short. Look for it
                    under &ldquo;Not yet introducible&rdquo; below.
                  </p>
                ) : commission.framing ? (
                  <p className='mt-1.5 text-[12px] italic leading-relaxed text-amber-100'>
                    {commission.framing}
                  </p>
                ) : (
                  <p className='mt-1.5 flex items-center gap-1.5 text-[12px] text-amber-200/70'>
                    <Loader2 size={12} className='animate-spin' />
                    {commission.errand.startsWith('ruled.')
                      ? 'Word is getting around…'
                      : `There is work here on ${commission.conceptName}.`}
                  </p>
                )}
                {/* The ruling, named next to the scene about it.
                    `inconclusive` says what it means in the interface too, and
                    not only in the prompt and the chart: the engine declining
                    to settle something is the one ruling a learner will read as
                    a failure unless told otherwise, and §6 says it is not one. */}
                {commission.errand === 'ruled.inconclusive' && (
                  <p className='mt-1.5 text-[11px] leading-relaxed text-amber-300/70'>
                    The engine could not settle this one. That is a statement about the engine, not
                    about you — it is not counted as wrong, and it has gone for review.
                  </p>
                )}
                {/* Another problem on the same concept, from any ruling. The
                    chart's `try-again` edge hangs off the `ruled` superstate
                    for exactly this: it is the same offer whichever of the four
                    came back, and it is what makes an inconclusive liveable. */}
                {commission.errand.startsWith('ruled.') && (
                  <button
                    onClick={() => { fire('try-again'); setCommission(c => c && ({ ...c, taskId: null, ruling: null, framing: null })) }}
                    className='mt-1.5 rounded-full border border-amber-700/60 px-2 py-0.5 text-[11px] text-amber-100 hover:bg-amber-900/40'
                  >
                    another problem on {commission.conceptName}
                  </button>
                )}
                {commission.note && (
                  <p className='mt-1.5 text-[11px] text-amber-400/60'>{commission.note}</p>
                )}
                {/* The one thing the fiction must not be allowed to imply.
                    Stated in the interface and not only in the prompt, because
                    the prompt governs what the GM writes and this governs what
                    the learner concludes — and "I did the errand, so the road
                    opens" is the conclusion the whole §4 design is one careless
                    sentence away from. */}
                {/* Keyed on the chart rather than on `taskId`, and shown
                    through the ruling as well as before it. After a CORRECT
                    ruling is the moment a player is most likely to conclude
                    the errand was a key, and the GM is forbidden from saying
                    anything either way — so the interface is the only thing
                    that can answer it. */}
                {(commission.errand.startsWith('working.') || commission.errand.startsWith('ruled.')) && (
                  <p className='mt-1.5 text-[11px] text-amber-400/50'>
                    Doing this does not open the road. The road opens when this concept is at or
                    above {Math.round(MASTERY_FLOOR * 100)}% strength, which is the same gate as
                    before — this is only how you get to the work.
                  </p>
                )}
              </div>
            )}

            {/* A learner who has never demonstrated anything is led through a
                worked example BEFORE the graded problem, not after it.

                Same mechanism as the offer below the panel — the stepped walk
                over the worked example on the knowledge point — in a different
                place, for a different reader. Below the problem it is a way out
                of being stuck, which is the right shape for somebody who has
                been here before. On a first visit it is the whole answer to
                "what is this and what do I do", and a first visit currently
                opens on a marked problem with the example mentioned underneath
                it, which is the wrong way round: you cannot be stuck on
                something you have not understood the shape of yet.

                Keyed to the FIRST task rather than to `currentTask`, so it is
                there on the first paint. `currentTask` is reported upward by
                the panel after it mounts, so a card gated on it appears a beat
                late — tolerable for a hint, not for the thing a new learner is
                supposed to read first.

                Nothing dismisses it and nothing has to: `demonstrated` passes 0
                the first time a point is answered unaided, which retires the
                card at exactly the moment it stops being true that the learner
                has never done this. */}
            {(() => {
              const first = state.tasks?.[0]
              if (!first) return null
              if ((state.progress?.demonstrated ?? 0) > 0) return null
              const opening = openingForPoint(MATHEMATICS, first.knowledgePointId)
              if (!opening) return null
              return (
                <div className='rounded-lg border border-sky-900/50 bg-sky-950/30 p-3'>
                  <p className='text-sm font-medium text-sky-100'>New here? Start with the example.</p>
                  <p className='mt-1 text-[12px] leading-relaxed text-sky-200/80'>
                    There is a worked example on the same knowledge point as the first problem below —
                    {' '}{opening.steps} step{opening.steps === 1 ? '' : 's'}, asked one at a time, in
                    different numbers. Nothing in it is marked, so there is nothing to get wrong.
                  </p>
                  <button
                    onClick={() => {
                      setWalkTarget({ pointId: opening.knowledgePointId })
                      setTab('tutor')
                    }}
                    className='mt-2 rounded-full border border-sky-700 px-3 py-1 text-[12px] text-sky-100 hover:bg-sky-900/50'
                  >
                    lead me through it
                  </button>
                  {/* The problems are still right there, and saying so is what
                      keeps this an offer rather than a gate. The practice set
                      below is unchanged and unblocked by this card. */}
                  <p className='mt-2 text-[11px] text-sky-400/70'>
                    Or ignore this and answer the problem below — that is the one that counts.
                  </p>
                </div>
              )
            })()}

            <PracticePanel
              tasks={state.tasks ?? []}
              verifierConfigured={state.verifier?.configured ?? false}
              onAdvance={load}
              onRefresh={load}
              onRuled={onRuled}
              onTaskChange={setCurrentTask}
              focusTaskId={focusTaskId}
            />

            {/* The walk, offered from the problem — the direction `convertsTo`
                does not cover.

                A generated task has no derivation of its own: tasks.ts makes
                numbers, not steps. So "the example behind this" means the
                worked example on the same knowledge point, which is the same
                move in different numbers. Offered only when that example
                exists, because most of the atlas has none and a button that
                explains it cannot help is worse than no button. */}
            {(() => {
              if (!currentTask) return null
              const opening = openingForPoint(MATHEMATICS, currentTask.knowledgePointId)
              if (!opening) return null
              /* Not twice on one screen. The first-visit card above offers the
                 same walk over the same point, and two controls that do the
                 same thing read as two different things. Its own condition,
                 repeated rather than hoisted into a variable, because hoisting
                 would put the knowledge of when that card renders in a third
                 place — this reads as "whatever that card decided, stay out of
                 its way". */
              const firstVisitCardShowing =
                (state.progress?.demonstrated ?? 0) === 0 &&
                !!state.tasks?.[0] &&
                !!openingForPoint(MATHEMATICS, state.tasks[0].knowledgePointId)
              if (firstVisitCardShowing) return null
              return (
                <div className='flex flex-wrap items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-[11px]'>
                  <span className='text-gray-400'>
                    Stuck before you start? There is a worked example on this knowledge point —
                    {' '}{opening.steps} step{opening.steps === 1 ? '' : 's'}, asked one at a time.
                  </span>
                  <button
                    onClick={() => {
                      setWalkTarget({ pointId: opening.knowledgePointId })
                      setTab('tutor')
                    }}
                    title='Be led through the example in different numbers. Nothing there is marked — this problem is what gets ruled.'
                    className='ml-auto rounded-full border border-sky-700/60 px-2 py-0.5 text-sky-200 hover:bg-sky-900/40'
                  >
                    lead me through the example
                  </button>
                </div>
              )
            })()}

            {/* The scratchpad and the tutor sit WITH the problem rather than on
                a separate tab. Working something out is part of answering, and
                a scratchpad you have to navigate away to reach is a scratchpad
                nobody uses — which is what the old `tools` tab was. */}
            <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
              <Scratchpad
                // Keyed on the subject so switching subjects remounts rather
                // than showing one subject's working under another's heading.
                key={subject ?? state.subject?.id ?? 'default'}
                subject={subject ?? state.subject?.id ?? DEFAULT_SUBJECT.subject.id}
                onHandle={setPad}
                onEmptyChange={setPadEmpty}
              />
              <PracticeChat
                // The tutor is given the prompt, the given and the demanded
                // form — the same three things the learner can see. Not the
                // reference answer: the panel withholds it from the client on
                // purpose, and a tutor that had it would hand it over.
                problem={currentTask
                  ? [
                      currentTask.prompt,
                      currentTask.given ? `Given: ${currentTask.given}` : null,
                      currentTask.form ? `The answer must be in the form: ${currentTask.form}` : null,
                    ].filter(Boolean).join('\n')
                  : 'No task is on screen.'}
                hasWorking={!padEmpty}
                pad={pad}
                subjectName={state.subject?.name}
              />
            </div>

            {/* Nothing is dropped silently. A short set has a reason, and the
                reason is the most useful thing the scheduler knows. */}
            {(state.blocked?.length ?? 0) > 0 && (
              <div className='rounded-lg border border-gray-800 bg-gray-900 p-3 text-xs'>
                <p className='font-medium text-gray-200'>Not yet introducible</p>
                <p className='mt-0.5 text-gray-500'>
                  A concept is only practised once everything it rests on is at or above{' '}
                  {Math.round(MASTERY_FLOOR * 100)}% strength. This gate does not relax — serving a
                  problem whose prerequisites are unmet is the failure the ordering exists to prevent.
                </p>
                {/* Each blocked concept can be CLAIMED. That is the escape
                    hatch for somebody who already knows this material and is
                    otherwise made to start at the bottom of the subject — the
                    real reason /learn looked like it had three concepts in it.
                    A claim opens the concept and nothing below it, and one
                    unaided wrong answer withdraws it. */}
                <ul className='mt-1.5 space-y-1 text-gray-400'>
                  {state.blocked!.map(b => (
                    <li key={b.conceptId} className='flex flex-wrap items-center gap-2'>
                      <span>
                        {b.conceptName} — needs {b.missing.map(m => m.conceptName).join(', ') || 'nothing (already open)'}
                      </span>
                      <button
                        onClick={() => claim(b.conceptId, b.conceptName)}
                        disabled={claiming === b.conceptId}
                        title='Say you already know this. It opens the problems now — it does not mark you as knowing it, and getting one wrong unaided withdraws the claim.'
                        className='rounded-full border border-gray-600 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-40'
                      >
                        {claiming === b.conceptId ? 'claiming…' : 'I already know this'}
                      </button>
                    </li>
                  ))}
                </ul>
                {claimNote && (
                  <p className='mt-2 rounded border border-sky-900/50 bg-sky-950/30 px-2 py-1.5 text-[11px] text-sky-200'>
                    {claimNote}
                  </p>
                )}
              </div>
            )}

            {(state.skipped?.length ?? 0) > 0 && (
              <details className='rounded-lg border border-gray-800 bg-gray-900 p-3 text-xs'>
                <summary className='cursor-pointer text-gray-300'>
                  {state.skipped!.length} task{state.skipped!.length === 1 ? '' : 's'} left out of this set
                </summary>
                <ul className='mt-1.5 space-y-0.5 text-gray-500'>
                  {state.skipped!.map(s => <li key={s.taskId}>{s.taskId} — {s.reason}</li>)}
                </ul>
              </details>
            )}

            {state.progress && (
              <div className='rounded-lg border border-gray-800 bg-gray-900 p-3 text-xs'>
                <p className='font-medium text-gray-200'>Where you are</p>
                <p className='mt-0.5 text-gray-400'>
                  {state.progress.demonstrated} of {state.progress.points} points demonstrated
                  unaided · {state.progress.strongConcepts} concept
                  {state.progress.strongConcepts === 1 ? '' : 's'} strong
                </p>
                {state.progress.assistedOnly > 0 && (
                  // The gap between these two is the number worth looking at, which
                  // is why it is surfaced rather than folded into the first figure.
                  <p className='mt-0.5 text-amber-300'>
                    {state.progress.assistedOnly} point
                    {state.progress.assistedOnly === 1 ? ' has' : 's have'} only ever been answered
                    with help. Those are not counted as demonstrated.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Follows the picker, or the browser would show one subject's graph
            while the practice tab served another's tasks. */}
        {tab === 'concepts' && (
          <>
            {/* The scope switch, and the honest figure beside it.
                Default is the subject being practised rather than the whole
                map: the map is 95% unwritten, and opening on it would answer
                "what can I do now" with three hundred things the learner
                cannot do. The map is one click away and says what it is. */}
            <div className='flex flex-wrap items-center gap-2 text-[11px]'>
              <span className='text-gray-500'>showing</span>
              {([
                ['subject', 'the subject I am practising'],
                ['atlas', 'the whole map'],
                ['journeys', 'journeys across it'],
              ] as const)
                .map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setScope(id)}
                    className={`rounded-full border px-2 py-0.5 ${
                      scope === id
                        ? 'border-gray-500 bg-gray-800 text-gray-100'
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              {/* Two figures, because they are two different claims and one of
                  them was standing in for the other.

                  `teachable` is "has knowledge points" — material you can
                  read. `PRACTISABLE` is "has at least one problem". They
                  differed by three concepts — the logarithm ones, which had
                  worked examples and nothing to do — and reporting only the
                  first counted those three as practisable when nothing in them
                  could come up. They agree today, which is why the sentence is
                  written two ways: a comparison that is computed cannot
                  quietly become an assertion. See `isPractisable` in tasks.ts. */}
              {scope === 'atlas' && (
                <span className='text-gray-600'>
                  {COVERAGE.concepts} concepts across {COVERAGE.areas} areas,{' '}
                  {COVERAGE.prerequisiteEdges} prerequisite edges — {COVERAGE.teachable} have
                  material written for them ({Math.round(100 * COVERAGE.teachable / COVERAGE.concepts)}%),
                  and {PRACTISABLE === COVERAGE.teachable
                    ? 'every one of those has problems you can actually be set'
                    : `${PRACTISABLE} of those have problems you can actually be set`}.
                  The rest are named and ordered only, and gate nothing.
                </span>
              )}
            </div>
            {/* One map slot, three things it can be.

                The journeys used to sit in a permanent panel under the graph,
                which made them a second element competing for the same screen.
                They are a map in their own right — nodes are destinations, and
                unlike the concept graph it is not expected to be connected —
                so they belong in the switch rather than beside it. */}
            {scope === 'journeys' ? (
              <JourneyMap
                /* Always the composed atlas, never the practised subject.

                   A journey crosses areas by nature — "solve any quadratic"
                   starts in arithmetic and ends in rational expressions.
                   Handed a single-subject ontology it would find its
                   destination missing, resolve to an empty chain and render as
                   "0 of 0 steps". */
                ontology={MATHEMATICS}
                concepts={state?.progress?.concepts ?? []}
                masteryFloor={MASTERY_FLOOR}
                areaNames={AREA_NAMES}
                queuedTasks={state?.tasks ?? []}
                onPractise={id => { setFocusTaskId(id); setTab('practice') }}
                /* The other half of a step: be set its problem, or be led
                   through its worked example first. Offered per step because
                   that is where a learner is deciding what to do about one. */
                onLeadThrough={leadThroughConcept}
                /* Showing a step means showing it on a graph that contains
                   it, so the scope follows the click — this leaves the journey
                   map for the atlas with that concept selected. */
                onSelectConcept={id => { setScope('atlas'); setSelectedConcept(id) }}
              />
            ) : (
              <ConceptGraph
                ontology={scope === 'atlas' ? MATHEMATICS : subjectOntology}
                concepts={state?.progress?.concepts ?? []}
                masteryFloor={MASTERY_FLOOR}
                onClaim={claim}
                onClaimChain={claimChain}
                // The area filter only appears on the map. A nine-concept subject
                // has one area, and a filter with one option is furniture.
                areaNames={scope === 'atlas' ? AREA_NAMES : undefined}
                initialArea={scope === 'atlas' ? subjectOntology.subject.id : undefined}
                // The real queue, so a node can show what is actually waiting on
                // it. Not a per-concept generator — see the prop note.
                queuedTasks={state?.tasks ?? []}
                onPractise={id => { setFocusTaskId(id); setTab('practice') }}
                onLeadThrough={leadThroughConcept}
                selectedId={selectedConcept}
                onSelectedChange={setSelectedConcept}
              />
            )}
            {!state?.progress && (
              <p className='text-[11px] text-gray-500'>
                Every node reads as blocked until the session loads — the colours come
                from your strengths, not from the ontology.
              </p>
            )}
            {/* Directly under the graph, because the graph is where a claim is
                MADE and this is the only place one can be taken back. Keeping
                them apart would mean the affordance for asserting fifteen
                concepts at once lived on a different screen from the only list
                that shows what was asserted.

                `AREA_NAMES` unconditionally, not gated on scope: a claim chain
                reaches across subjects whichever scope the graph is in, so the
                rows need names for subjects the current view does not show. */}
            <div className='rounded-lg border border-gray-800 bg-gray-900 px-3 py-2'>
              <ClaimsList subjectNames={SUBJECT_NAMES} refreshKey={claimsVersion} onChanged={load} />
            </div>
            {/* The browser stays on the subject in both scopes. It prints every
                concept's full text, which is right for nine and unreadable for
                291 — and the 276 mapped ones have a one-line description and
                nothing else, so there would be nothing to read. */}
            {/* The browser shows one subject, and a link from /play can name a
                concept from anywhere in the atlas — most of which no subject
                contains. So the linked concept is only handed over when this
                subject actually holds it; otherwise the atlas graph above is
                what the learner came to see, and claiming to have opened
                something that is not in the list would be a lie. */}
            <ConceptBrowser
              ontology={subjectOntology}
              initialOpen={
                linkedConcept && conceptById(subjectOntology, linkedConcept)
                  ? linkedConcept
                  : null
              }
            />
            {claimNote && (
              <p className='rounded border border-sky-900/50 bg-sky-950/30 px-2 py-1.5 text-[11px] text-sky-200'>
                {claimNote}
              </p>
            )}
          </>
        )}

        {/* Reloading the session on resolve keeps the badge and the practice set
            honest: settling a review can move strength, which changes what is
            introducible and therefore what the next set contains. */}
        {/* Always the composed atlas, for JourneyMap's reason: a walk is looked
            up by knowledge point across every subject, and the practised
            subject would resolve a concept from the other one to nothing. */}
        {tab === 'tutor' && (
          <>
            {/*
              * Two modes, because they are two different questions and neither
              * subsumes the other.
              *
              * A walk takes one worked example apart and asks its moves back,
              * so every question's scope is one step — which is the right thing
              * for being led through something and is also a ceiling, since a
              * step is all the context a step question has. A probe asks about
              * the edges between concepts, which is where an understanding
              * stops. Reported from use: the walk alone "just restates
              * problems", and that is the ceiling rather than a defect.
              *
              * A toggle rather than a replacement. The walk is still the only
              * mode that ends at a rulable problem, so it is the one that feeds
              * the mastery floor; a probe records nothing and never can, since
              * a boundary question has no exact answer to rule against.
              *
              * Walk stays the default: arriving from a map with a concept in
              * hand means "lead me through this", and flipping that would make
              * every map link land somewhere the learner did not ask for.
              */}
            <div className='mb-2 flex items-center gap-1'>
              {([
                ['walk', 'Lead me through something'],
                ['probe', 'Test my understanding'],
              ] as [TutorMode, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTutorMode(id)}
                  className={`rounded px-2 py-1 text-[11px] ${
                    tutorMode === id
                      ? 'bg-gray-800 text-gray-100'
                      : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tutorMode === 'walk' ? (
              <SocraticWalk
                ontology={MATHEMATICS}
                target={walkTarget}
                concepts={state?.progress?.concepts ?? []}
                masteryFloor={MASTERY_FLOOR}
                queuedTasks={state?.tasks ?? []}
                /* Open on a question when nobody named one. The maps and the
                   practice tab all arrive here holding a concept or a point, and
                   for them the offer list is the answer; `/learn?tab=tutor` from
                   the home page arrives with nothing, and that link means "tutor
                   me" rather than "show me what could be tutored". */
                autostart={!walkTarget}
                onPractise={id => { setFocusTaskId(id); setTab('practice') }}
                onSelectConcept={id => { setScope('atlas'); setSelectedConcept(id); setTab('concepts') }}
              />
            ) : (
              <ProbePanel
                ontology={MATHEMATICS}
                concepts={state?.progress?.concepts ?? []}
                masteryFloor={MASTERY_FLOOR}
                subjectName={state?.subject?.name}
                onSelectConcept={id => { setScope('atlas'); setSelectedConcept(id); setTab('concepts') }}
              />
            )}
          </>
        )}

        {/*
          * The map's way out.
          *
          * It lands on Concepts at `atlas` scope rather than setting the
          * practised subject, and the distinction matters. The subject picker
          * decides which problems the session SERVES, and nineteen of the
          * twenty-one regions hold mapped areas with nothing written — pointing
          * the practice set at `topology` would answer "give me problems" with
          * nothing and look broken. Scope is a view, so it can show an unwritten
          * area honestly, which is exactly what the map is for.
          *
          * The concept is only carried when the area has one to carry. A named
          * anchor opens that node; the plain "Open <area>" button falls back to
          * the area's first concept, which is better than nothing selected and
          * is still a real node rather than a guess.
          */}
        {tab === 'world' && (
          <ArmatureMap
            onBrowse={(areaId, conceptId) => {
              const target = conceptId
                ?? MATHEMATICS.concepts.find(c => c.subjectId === areaId)?.id
                ?? null
              setScope('atlas')
              setLinkedConcept(target)
              setTab('concepts')
            }}
            /* The other door, and the one with problems behind it. Setting the
               practised subject is exactly what the Practice tab's own picker
               does, so a region with authored material behaves as though the
               learner had chosen it there — which is the point: the map becomes
               a way of choosing what to work on, not only what to look at.

               Scope comes back to 'subject' with it. Without that, choosing a
               region here and then opening Concepts drew whatever scope was
               last set — and `onBrowse` directly above sets 'atlas' — so the
               map showed three hundred nodes for a learner who had just
               narrowed to one region. The two doors now disagree on purpose:
               browsing widens the view, practising narrows it. */
            onPractise={subjectId => {
              setSubject(subjectId)
              setScope('subject')
              setTab('practice')
            }}
            /* The third door, and the only one a REFUSAL opens. onBrowse
               widens the view and onPractise narrows it to a region's subject;
               this one goes to a single concept, because a refused road names
               a single concept and anything wider would be answering a
               narrower question than the player asked. */
            onTakeWork={takeWork}
            /* The same traversal the Practice tab's panel shows, from the same
               response. One world, two views of it — the board and the map —
               rather than two worlds that have to be kept in step. */
            journey={state?.traversal ?? null}
            openings={state?.traversal?.openings ?? []}
            onTravelled={load}
          />
        )}

        {tab === 'review' && <ReviewQueue onResolved={load} />}

        {tab === 'tools' && (
          <>
            <RpnCalculator />
            {/* Reworded: this used to call ITSELF the scratchpad, which is no
                longer true now that there is a real one beside the problem.
                Leaving that would have sent somebody here looking for their
                working. */}
            <p className='text-xs text-gray-500'>
              An RPN calculator, for arithmetic you want exact rather than typed into a
              problem. Your working belongs in the scratchpad on the Practice tab — it is
              saved, it renders LaTeX, and the tutor there can read it.
            </p>
          </>
        )}

      </div>
    </main>
  )
}
