'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, HelpCircle, Loader2, X } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { FORM_LABELS } from '@/lib/concepts/forms'
import type { NamedForm } from '@/lib/concepts/types'

/**
 * Working the queue of rulings the engine could not settle.
 *
 * This panel is deliberately not a pair of thumbs. Three things it insists on,
 * each because the alternative turns adjudication into clicking:
 *
 *  1. **The reference answer is shown.** Unlike the practice panel, which
 *     withholds it. The turn is over and the engine has already failed; a
 *     reviewer without the author's answer is being asked to redo the algebra
 *     by hand rather than to adjudicate a disagreement.
 *  2. **Settling requires a note.** The rows in this queue are exactly the ones
 *     where no mechanical argument exists, so the human's argument *is* the
 *     evidence. Same discipline as `interferes_with` carrying a rationale.
 *  3. **"I can't tell either" is a first-class button.** Not a cop-out — the
 *     honest outcome when a person looks and still cannot decide. It closes the
 *     row and scores nothing, which is what an inconclusive ruling has always
 *     meant here.
 *
 * It also shows what the engine actually tried (`method`) and its run id,
 * because "simplify(difference) did not reduce to zero" tells the reviewer
 * where to look, and a verdict with no account of its own attempt is just an
 * assertion.
 */

interface PendingItem {
  id: string
  createdAt: string
  answer: string | null
  answerAsRead: string | null
  method: string | null
  conditions: string[]
  assistance: string
  evidence: { runId?: string | number; engineVersion?: string; evidenceKind?: string } | null
  prompt: string | null
  given: string | null
  form: NamedForm | null
  reference: string | null
  statement: string | null
  conceptName: string | null
  knowledgePointId: string
  taskId: string
}

type Ruling = 'correct' | 'incorrect' | 'inconclusive'

export default function ReviewQueue({ onResolved }: { onResolved?: () => void }) {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await authedFetch('/api/learn/review')
      const data = await response.json()
      if (data.error) setError(data.error)
      else setItems(data.pending ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'could not load the queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const resolve = useCallback(async (item: PendingItem, ruling: Ruling) => {
    const note = (notes[item.id] ?? '').trim()
    if (ruling !== 'inconclusive' && !note) {
      setDone(d => ({ ...d, [item.id]: 'A note is needed — your argument is the evidence here.' }))
      return
    }
    setBusy(item.id)
    try {
      const response = await authedFetch('/api/learn/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observationId: item.id, ruling, note: note || null }),
      })
      const data = await response.json()
      if (data.error) {
        setDone(d => ({ ...d, [item.id]: data.error }))
        return
      }
      const propagated: { conceptName: string }[] = data.propagated ?? []
      setDone(d => ({
        ...d,
        [item.id]:
          data.warning
            ? data.warning
            : ruling === 'inconclusive'
              ? 'Closed without scoring.'
              : `Settled as ${ruling}.`
                + (propagated.length > 0
                  ? ` Also credited ${[...new Set(propagated.map(p => p.conceptName))].join(', ')}.`
                  : ''),
      }))
      setItems(list => list.filter(i => i.id !== item.id))
      onResolved?.()
    } catch (e) {
      setDone(d => ({ ...d, [item.id]: e instanceof Error ? e.message : 'the request failed' }))
    } finally {
      setBusy(null)
    }
  }, [notes, onResolved])

  if (loading) {
    return (
      <p className='flex items-center gap-2 text-sm text-gray-400'>
        <Loader2 size={14} className='animate-spin' /> Loading the queue…
      </p>
    )
  }

  if (error) {
    return (
      <p className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200'>{error}</p>
    )
  }

  return (
    <div className='space-y-3'>
      <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
        <h2 className='text-sm font-semibold text-gray-100'>Unsettled rulings</h2>
        <p className='mt-1 text-xs text-gray-400'>
          Answers the engine could not decide about. Only rulings an engine actually attempted reach
          this queue — an inconclusive produced because no worker is configured is a fact about the
          deployment, not a question for you.
        </p>
        <p className='mt-1 text-xs text-gray-500'>
          Oldest first, on purpose: a queue sorted newest-first lets the tail rot, and the rows that
          have waited longest are the ones most likely to be a real gap in the engine.
        </p>
      </div>

      {Object.entries(done).map(([id, message]) => (
        <p key={id} className='rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300'>
          {message}
        </p>
      ))}

      {items.length === 0 ? (
        <div className='rounded-lg border border-gray-800 bg-gray-900 p-6 text-center'>
          <p className='text-sm text-gray-300'>Nothing is waiting.</p>
          <p className='mt-1 text-xs text-gray-500'>
            Either the engine has settled everything it was asked, or nothing has been attempted yet.
          </p>
        </div>
      ) : (
        <ul className='space-y-3'>
          {items.map(item => (
            <li key={item.id} className='space-y-2 rounded-lg border border-sky-900 bg-sky-950/20 p-3'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <span className='text-xs text-gray-400'>
                  {item.conceptName ?? item.knowledgePointId}
                  {item.form && <> · asked for {FORM_LABELS[item.form]}</>}
                </span>
                <span className='text-[11px] text-gray-600'>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {item.prompt && <p className='text-sm text-gray-200'>{item.prompt}</p>}

              {item.given && (
                <div>
                  <span className='text-[11px] uppercase tracking-wide text-gray-600'>Given</span>
                  <pre className='mt-0.5 overflow-x-auto rounded bg-gray-950 px-2 py-1.5 font-mono text-xs text-gray-300'>
                    {item.given}
                  </pre>
                </div>
              )}

              <div className='grid gap-2 sm:grid-cols-2'>
                <div>
                  <span className='text-[11px] uppercase tracking-wide text-gray-600'>Their answer</span>
                  <pre className='mt-0.5 overflow-x-auto rounded bg-gray-950 px-2 py-1.5 font-mono text-xs text-amber-200'>
                    {item.answer ?? '(nothing recorded)'}
                  </pre>
                  {item.answerAsRead && item.answerAsRead !== item.answer && (
                    <span className='mt-0.5 block text-[11px] text-gray-500'>
                      read as <code className='text-gray-400'>{item.answerAsRead}</code>
                    </span>
                  )}
                </div>
                <div>
                  <span className='text-[11px] uppercase tracking-wide text-gray-600'>
                    Reference answer
                  </span>
                  <pre className='mt-0.5 overflow-x-auto rounded bg-gray-950 px-2 py-1.5 font-mono text-xs text-emerald-300'>
                    {item.reference ?? '(none authored)'}
                  </pre>
                  <span className='mt-0.5 block text-[11px] text-gray-600'>
                    Any expression equivalent to this and in the demanded form is correct.
                  </span>
                </div>
              </div>

              {item.assistance !== 'none' && (
                <p className='text-[11px] text-amber-300'>
                  This answer had help ({item.assistance.replace('_', ' ')}). Settling it correct records
                  the evidence but will not advance strength — an assisted success never does.
                </p>
              )}

              {item.method && (
                <p className='text-[11px] text-gray-500'>What the engine tried: {item.method}</p>
              )}
              {item.conditions.length > 0 && (
                <p className='text-[11px] text-amber-200'>
                  Stated conditions: {item.conditions.join(', ')}
                </p>
              )}
              {item.evidence?.runId && (
                <p className='text-[10px] text-gray-600'>
                  run {String(item.evidence.runId)}
                  {item.evidence.engineVersion && ` · sympy ${item.evidence.engineVersion}`}
                  {item.evidence.evidenceKind && ` · ${item.evidence.evidenceKind}`}
                </p>
              )}

              <label className='block'>
                <span className='text-[11px] uppercase tracking-wide text-gray-600'>
                  Why — required to settle it either way
                </span>
                <textarea
                  value={notes[item.id] ?? ''}
                  onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                  rows={2}
                  placeholder='e.g. equivalent after rationalising; SymPy did not reduce the surd'
                  className='mt-0.5 w-full rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs text-gray-100 placeholder:text-gray-600 focus:border-sky-700 focus:outline-none'
                />
              </label>

              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={() => resolve(item, 'correct')}
                  disabled={busy === item.id}
                  className='inline-flex items-center gap-1.5 rounded bg-emerald-800 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50'
                >
                  {busy === item.id ? <Loader2 size={12} className='animate-spin' /> : <Check size={12} />} Correct
                </button>
                <button
                  onClick={() => resolve(item, 'incorrect')}
                  disabled={busy === item.id}
                  className='inline-flex items-center gap-1.5 rounded bg-rose-900 px-3 py-1.5 text-xs text-white hover:bg-rose-800 disabled:opacity-50'
                >
                  <X size={12} /> Incorrect
                </button>
                <button
                  onClick={() => resolve(item, 'inconclusive')}
                  disabled={busy === item.id}
                  title='Closes it without scoring. The honest outcome when you cannot tell either.'
                  className='inline-flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 disabled:opacity-50'
                >
                  <HelpCircle size={12} /> I can&apos;t tell either
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <p className='flex items-start gap-1.5 text-[11px] text-gray-500'>
          <AlertCircle size={12} className='mt-0.5 shrink-0' />
          Settling a row does not rewrite what the engine said. The observation keeps recording that
          it ruled inconclusive and scored nothing; your decision is stored beside it, and the
          strength change comes from yours.
        </p>
      )}
    </div>
  )
}
