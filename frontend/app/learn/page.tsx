'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { authedFetch } from '@/lib/authedFetch'
import { getOntology, ONTOLOGIES } from '@/lib/concepts/ontology'
import { AREAS, MATHEMATICS, atlasCoverage } from '@/lib/concepts/atlas'
import { TRAVERSAL_GAME } from '@/lib/concepts/traversal'
import { MASTERY_FLOOR } from '@/lib/concepts/scheduling'
import ConceptBrowser from '@/components/concepts/ConceptBrowser'
import ConceptGraph from '@/components/concepts/ConceptGraph'
import ImportReview from '@/components/concepts/ImportReview'
import PracticeChat from '@/components/concepts/PracticeChat'
import PracticePanel, { type PracticeTaskView } from '@/components/concepts/PracticePanel'
import ReviewQueue from '@/components/concepts/ReviewQueue'
import RpnCalculator from '@/components/concepts/RpnCalculator'
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

type Tab = 'practice' | 'concepts' | 'review' | 'tools' | 'import'

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

const COVERAGE = atlasCoverage(MATHEMATICS)

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
   * Whether the Concepts tab draws the practised subject or the whole atlas.
   *
   * Not persisted and not in the URL. It is a way of looking at one page rather
   * than a place, and a remembered value would mean a learner who once glanced
   * at the map comes back next week to three hundred nodes instead of their
   * fifteen.
   */
  const [scope, setScope] = useState<'subject' | 'atlas'>('subject')

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

  const [claiming, setClaiming] = useState<string | null>(null)
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
      if (!d.error) await load()
    } catch {
      setClaimNote(`could not claim ${conceptName}`)
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

  return (
    <main className='min-h-screen bg-gray-950 text-gray-100'>
      <header className='border-b border-gray-800 bg-gray-900'>
        <div className='mx-auto flex max-w-4xl items-center gap-3 px-4 py-3'>
          <Link href='/dashboard' className='text-gray-400 hover:text-gray-200'>
            <ArrowLeft size={18} />
          </Link>
          <div className='min-w-0 flex-1'>
            <h1 className='text-base font-semibold'>{TRAVERSAL_GAME.name}</h1>
            <p className='truncate text-xs text-gray-500'>{TRAVERSAL_GAME.tagline}</p>
          </div>
          <div className='flex items-center gap-2'>
            {/*
              Only rendered once the route has told us there is a choice. A picker
              with one option is noise, and hardcoding the list here would mean
              adding a subject in two places.
            */}
            {(state?.subjects?.length ?? 0) > 1 && (
              <label className='flex items-center gap-1.5 text-xs text-gray-400'>
                <span className='sr-only'>Subject</span>
                <select
                  value={subject ?? state?.subject?.id ?? ''}
                  onChange={e => setSubject(e.target.value)}
                  className='rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 focus:border-emerald-700 focus:outline-none'
                >
                  {state?.subjects?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}
            <ThemeToggle />
          </div>
        </div>
        <nav className='mx-auto flex max-w-4xl gap-1 px-4'>
          {([
            ['practice', 'Practice'],
            ['concepts', 'Concepts'],
            ['review', 'Review'],
            ['tools', 'Scratchpad'],
            ['import', 'Import'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
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

        {state?.error && (
          <p className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200'>
            {state.error}
          </p>
        )}

        {tab === 'practice' && state && !state.error && (
          <>
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
            />

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
              {([['subject', 'the subject I am practising'], ['atlas', 'the whole map']] as const)
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
              {scope === 'atlas' && (
                <span className='text-gray-600'>
                  {COVERAGE.concepts} concepts across {COVERAGE.areas} areas,{' '}
                  {COVERAGE.prerequisiteEdges} prerequisite edges — {COVERAGE.teachable} have
                  problems written for them ({Math.round(100 * COVERAGE.teachable / COVERAGE.concepts)}%).
                  The rest are named and ordered only, and gate nothing.
                </span>
              )}
            </div>
            {/* The graph first, the list below. They answer different
                questions — the graph answers "what is the shape of this
                subject and where am I", which is what people arrive with; the
                list answers "what exactly does this one concept say", which is
                what they want next. Neither replaces the other. */}
            <ConceptGraph
              ontology={scope === 'atlas' ? MATHEMATICS : subjectOntology}
              concepts={state?.progress?.concepts ?? []}
              masteryFloor={MASTERY_FLOOR}
              onClaim={claim}
              // The area filter only appears on the map. A nine-concept subject
              // has one area, and a filter with one option is furniture.
              areaNames={scope === 'atlas' ? AREA_NAMES : undefined}
              initialArea={scope === 'atlas' ? subjectOntology.subject.id : undefined}
            />
            {!state?.progress && (
              <p className='text-[11px] text-gray-500'>
                Every node reads as blocked until the session loads — the colours come
                from your strengths, not from the ontology.
              </p>
            )}
            {/* The browser stays on the subject in both scopes. It prints every
                concept's full text, which is right for nine and unreadable for
                291 — and the 276 mapped ones have a one-line description and
                nothing else, so there would be nothing to read. */}
            <ConceptBrowser ontology={subjectOntology} />
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

        {/* Not wired to `load`: an import writes nothing, so there is no state it
            could invalidate. A refresh here would imply otherwise. */}
        {tab === 'import' && <ImportReview />}
      </div>
    </main>
  )
}
