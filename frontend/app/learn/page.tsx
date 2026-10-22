'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { authedFetch } from '@/lib/authedFetch'
import { getOntology, RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { TRAVERSAL_GAME } from '@/lib/concepts/traversal'
import { MASTERY_FLOOR } from '@/lib/concepts/scheduling'
import ConceptBrowser from '@/components/concepts/ConceptBrowser'
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
    concepts: { conceptId: string; strength: number; introducible: boolean }[]
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
                subject={subject ?? state.subject?.id ?? RATIONAL_EXPRESSIONS.subject.id}
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
                <ul className='mt-1.5 space-y-0.5 text-gray-400'>
                  {state.blocked!.map(b => (
                    <li key={b.conceptId}>
                      {b.conceptName} — needs {b.missing.map(m => m.conceptName).join(', ') || 'nothing (already open)'}
                    </li>
                  ))}
                </ul>
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
          <ConceptBrowser
            ontology={getOntology(subject ?? state?.subject?.id ?? '') ?? RATIONAL_EXPRESSIONS}
          />
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
