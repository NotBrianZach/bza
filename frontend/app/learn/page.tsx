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

type Tab = 'practice' | 'concepts' | 'review' | 'tutor' | 'tools'
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
    if (wanted === 'practice' || wanted === 'concepts' || wanted === 'review'
      || wanted === 'tutor' || wanted === 'tools') {
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
  }, [])

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
                  onChange={e => setSubject(e.target.value)}
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

            <PracticePanel
              tasks={state.tasks ?? []}
              verifierConfigured={state.verifier?.configured ?? false}
              onAdvance={load}
              onRefresh={load}
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
