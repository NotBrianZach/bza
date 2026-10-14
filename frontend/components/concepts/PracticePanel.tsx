'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle, CheckCircle2, HelpCircle, Loader2, RefreshCw, XCircle,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { FORM_LABELS } from '@/lib/concepts/forms'
import type { Assistance, NamedForm, Verdict } from '@/lib/concepts/types'

/**
 * The practice loop, and the verifier's rulings as the learner sees them.
 *
 * THREE THINGS THIS DELIBERATELY SHOWS. Each is something a tidier panel would
 * hide, and hiding any of them turns an honest engine into a dishonest interface:
 *
 *  1. "Not settled" is its own state, visually distinct from both right and
 *     wrong, and it never advances the set. An inconclusive ruling that looked
 *     like a soft failure would train the learner on this build's limitations,
 *     which is the one rule in the whole design most likely to be lost at the
 *     last layer.
 *  2. The retained conditions, on a *correct* answer. `(x²−1)/(x−1)` and `x+1`
 *     are different functions and the difference is exactly `x ≠ 1`. A panel that
 *     prints "Correct" and drops the condition has taught something false.
 *  3. How the answer was read. Seeing `(1/2)*x` when you typed `1/2x` is how you
 *     discover the parser disagreed with you, and discovering that next to the
 *     ruling is the difference between a confusing mark and a clear one.
 *
 * Asking for a hint is recorded before the answer is submitted, because
 * assistance has to be an input to the ruling rather than a confession
 * afterwards — a hint-assisted correct answer is counted and never advances
 * strength, and that only works if the panel cannot forget it asked.
 */

export interface PracticeTaskView {
  id: string
  knowledgePointId: string
  kind: string
  prompt: string
  given: string
  form: NamedForm | null
  variables: { name: string; assumptions?: Record<string, boolean> }[]
  domainConditions: string[]
  conceptId: string | null
}

interface Propagation { knowledgePointId: string; conceptName: string; distance: number; credit: number }

interface RulingResponse {
  status?: 'ruled' | 'unreadable'
  message?: string
  position?: number
  verdict?: Verdict
  asRead?: string
  headline?: string
  scored?: boolean
  propagated?: Propagation[]
  concept?: string | null
  warning?: string
  error?: string
}

export default function PracticePanel({
  tasks, verifierConfigured, onAdvance, onRefresh,
}: {
  tasks: PracticeTaskView[]
  verifierConfigured: boolean
  /** Called when a task is settled either way, so the parent can refresh progress. */
  onAdvance?: () => void
  onRefresh?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [assistance, setAssistance] = useState<Assistance>('none')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RulingResponse | null>(null)
  const shownAt = useRef<number>(Date.now())

  const task = tasks[index] ?? null

  useEffect(() => {
    setAnswer('')
    setAssistance('none')
    setResult(null)
    shownAt.current = Date.now()
  }, [task?.id])

  const submit = useCallback(async () => {
    if (!task || busy || !answer.trim()) return
    setBusy(true)
    try {
      const response = await authedFetch('/api/learn/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          answer,
          assistance,
          elapsedMs: Date.now() - shownAt.current,
        }),
      })
      const data = (await response.json()) as RulingResponse
      setResult(data)
      // An inconclusive ruling does not advance anything, so the parent is only
      // told when something was actually settled.
      if (data.status === 'ruled' && (data.verdict?.ruling === 'correct' || data.verdict?.ruling === 'incorrect')) {
        onAdvance?.()
      }
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'the request failed' })
    } finally {
      setBusy(false)
    }
  }, [task, busy, answer, assistance, onAdvance])

  if (!task) {
    return (
      <div className='rounded-lg border border-gray-800 bg-gray-900 p-6 text-center'>
        <p className='text-sm text-gray-300'>Nothing is due.</p>
        <p className='mt-1 text-xs text-gray-500'>
          An empty set is a real answer: either everything introducible is strong, or what is left
          rests on something that is not yet. The blocked list below says which.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className='mt-3 inline-flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700'
          >
            <RefreshCw size={12} /> Check again
          </button>
        )}
      </div>
    )
  }

  const verdict = result?.status === 'ruled' ? result.verdict : undefined

  return (
    <div className='space-y-3'>
      {!verifierConfigured && (
        <p className='rounded border-l-2 border-amber-600 bg-amber-950/30 px-3 py-2 text-xs text-amber-200'>
          No computation worker is configured, so equivalence cannot be checked and every
          submission will rule <strong>not settled</strong>. Form checks still work — they run here
          rather than on the worker. Set <code>MATH_WORKBENCH_URL</code> to get real rulings.
        </p>
      )}

      <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xs text-gray-500'>
              {index + 1} of {tasks.length}
              {task.form && <> · answer as {FORM_LABELS[task.form]}</>}
            </p>
            <p className='mt-1 text-sm text-gray-200'>{task.prompt}</p>
          </div>
        </div>

        <pre className='mt-3 overflow-x-auto rounded bg-gray-950 px-3 py-2 font-mono text-sm text-emerald-300'>
          {task.given}
        </pre>

        {task.domainConditions.length > 0 && (
          <p className='mt-2 text-[11px] text-gray-500'>
            Stated conditions: {task.domainConditions.join(', ')}
          </p>
        )}
        <p className='mt-1 text-[11px] text-gray-600'>
          Variables: {task.variables.map(v => {
            const flags = Object.entries(v.assumptions ?? {}).filter(([, on]) => on).map(([k]) => k)
            return flags.length > 0 ? `${v.name} (${flags.join(', ')})` : v.name
          }).join(', ')}
        </p>

        <label className='mt-3 block'>
          <span className='sr-only'>Your answer</span>
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            disabled={busy}
            placeholder='Type your answer, e.g. 1/(x + 3) + 2/(x - 5)'
            className='w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-700 focus:outline-none disabled:opacity-60'
          />
        </label>

        <div className='mt-2 flex flex-wrap items-center gap-2'>
          <button
            onClick={submit}
            disabled={busy || !answer.trim()}
            className='inline-flex items-center gap-1.5 rounded bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
          >
            {busy ? <Loader2 size={12} className='animate-spin' /> : null} Submit
          </button>

          {/* Recorded at the moment it is asked for, not confessed afterwards. */}
          {assistance === 'none' ? (
            <button
              onClick={() => setAssistance('hint')}
              className='inline-flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700'
              title='Recorded with your answer. An assisted success is counted and does not advance strength.'
            >
              <HelpCircle size={12} /> I need a hint
            </button>
          ) : (
            <span className='text-[11px] text-amber-300'>
              Hint taken — this answer will be counted as assisted, which does not advance strength.
            </span>
          )}

          <button
            onClick={() => setIndex(i => Math.min(i + 1, tasks.length - 1))}
            disabled={index >= tasks.length - 1}
            className='ml-auto rounded px-2 py-1.5 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-40'
          >
            Skip →
          </button>
        </div>

        {assistance === 'hint' && (
          <div className='mt-3 rounded border border-gray-800 bg-gray-950 p-3 text-xs text-gray-300'>
            {task.form === 'partial_fractions' && (
              <>Write the template first — one term per distinct factor, one term per power of a
              repeated factor, a linear numerator over an irreducible quadratic. Then clear the
              denominators and substitute the roots.</>
            )}
            {task.form === 'factored' && <>Find the pair that multiplies to a·c and adds to b.</>}
            {task.form === 'expanded' && <>Every term of the first bracket against every term of the second.</>}
            {task.form === 'single_fraction' && <>Find a denominator both divide, then add the numerators only.</>}
          </div>
        )}
      </div>

      {/* ── the ruling ───────────────────────────────────────────────── */}
      {result?.error && (
        <p className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200'>
          {result.error}
        </p>
      )}

      {result?.status === 'unreadable' && (
        <div className='rounded-lg border border-gray-700 bg-gray-900 p-3'>
          <p className='flex items-center gap-1.5 text-sm text-gray-200'>
            <AlertCircle size={14} className='text-gray-400' /> That could not be read
          </p>
          <p className='mt-1 text-xs text-gray-400'>{result.message}</p>
          <p className='mt-1 text-[11px] text-gray-600'>
            Nothing was recorded — an answer that is not an expression has made no claim to rule on.
            {typeof result.position === 'number' && <> It stopped making sense at character {result.position + 1}.</>}
          </p>
        </div>
      )}

      {verdict && <VerdictCard verdict={verdict} result={result!} />}
    </div>
  )
}

function VerdictCard({ verdict, result }: { verdict: Verdict; result: RulingResponse }) {
  const tone =
    verdict.ruling === 'correct' ? 'border-emerald-800 bg-emerald-950/30'
    : verdict.ruling === 'incorrect' ? 'border-rose-900 bg-rose-950/30'
    : 'border-sky-900 bg-sky-950/30'

  const Icon =
    verdict.ruling === 'correct' ? CheckCircle2
    : verdict.ruling === 'incorrect' ? XCircle
    : AlertCircle

  const iconTone =
    verdict.ruling === 'correct' ? 'text-emerald-400'
    : verdict.ruling === 'incorrect' ? 'text-rose-400'
    : 'text-sky-400'

  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <p className='flex items-center gap-1.5 text-sm font-medium text-gray-100'>
        <Icon size={15} className={iconTone} /> {result.headline}
      </p>

      {verdict.brokeAt && (
        <p className='mt-2 text-xs text-gray-200'>
          <span className='text-gray-500'>Step {verdict.brokeAt.step}: </span>
          {verdict.brokeAt.detail}
        </p>
      )}

      <p className='mt-2 text-[11px] text-gray-500'>How it was decided: {verdict.method}</p>

      {result.asRead && (
        <p className='mt-1 text-[11px] text-gray-500'>
          Read as <code className='text-gray-300'>{result.asRead}</code>
        </p>
      )}

      {/* Shown on a correct answer too. This is the point. */}
      {verdict.conditions.length > 0 && (
        <p className='mt-2 text-xs text-amber-200'>
          Holds on the common domain only: {verdict.conditions.join(', ')}
        </p>
      )}

      {verdict.ruling === 'inconclusive' && (
        <p className='mt-2 text-[11px] text-sky-200'>
          Not settled is not a mark against you, and nothing was scored.
          {result.verdict?.evidence?.runId
            ? ' This has gone to the review queue.'
            : ' Nothing was queued for review, because no engine attempted it.'}
        </p>
      )}

      {result.scored === false && verdict.ruling !== 'inconclusive' && result.warning && (
        <p className='mt-2 text-[11px] text-amber-300'>{result.warning}</p>
      )}

      {/* Named, not just counted — it is only reassuring if it says which. */}
      {result.propagated && result.propagated.length > 0 && (
        <div className='mt-2 text-[11px] text-emerald-200'>
          This also counted as practice of{' '}
          {[...new Set(result.propagated.map(p => p.conceptName))].join(', ')} — you used
          {' '}{result.propagated.length === 1 ? 'it' : 'them'} to get here, so{' '}
          {result.propagated.length === 1 ? 'it does' : 'they do'} not come due as though untouched.
        </div>
      )}

      {verdict.evidence?.runId && (
        <p className='mt-2 text-[10px] text-gray-600'>
          run {String(verdict.evidence.runId)}
          {verdict.evidence.engineVersion && ` · sympy ${verdict.evidence.engineVersion}`}
          {verdict.evidence.evidenceKind && ` · ${verdict.evidence.evidenceKind}`}
          {verdict.evidence.cached && ' · cached'}
        </p>
      )}
    </div>
  )
}
