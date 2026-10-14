'use client'

import { useCallback, useMemo, useState } from 'react'
import { Clipboard, Loader2, Send } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import {
  calcRecord, DEFAULT_SETTINGS, DOUBLE_DIGITS, evaluateRpn, formatValue, precisionIsAdvisory,
  RpnError, sha256Hex, toOrgDrawer, toWorkerTree, type AngleMode, type RpnSettings, type Value,
} from '@/lib/concepts/rpn'

/**
 * The RPN scratchpad.
 *
 * This is the only one of the four surface features with nothing already in the
 * project, and the thing that keeps it from being a throwaway widget is the record
 * it emits. The Emacs side already captures expression text, calculation mode,
 * precision, angle convention and engine version with every snapshot
 * (`math-workbench-calc`). This emits the same fields, so a calculation is one
 * object on both sides and can cross between them — hence the "copy as Org
 * drawer" button, which is not a novelty but the whole justification for the
 * shape.
 *
 * Two honesty affordances that are not decoration:
 *
 *  - The exactness badge. Integers and quotients of integers are computed in
 *    BigInt and say `symbolic_result`. Anything touching a decimal or a
 *    transcendental went through a double and says `numerical_observation`. A
 *    calculator that showed sixteen digits without saying which of those it was
 *    doing is the kind of thing this codebase spends its comments arguing against.
 *  - The precision warning. Above about fifteen digits a JS double cannot honour
 *    the setting, so the setting becomes a display preference. Emacs Calc is
 *    arbitrary-precision and this is not; saying so beats rounding quietly.
 */
export default function RpnCalculator() {
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<RpnSettings>(DEFAULT_SETTINGS)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [exact, setExact] = useState<{ display: string | null; latex: string | null; conditions: string[]; note: string } | null>(null)

  const evaluated = useMemo(() => {
    if (!input.trim()) return null
    try {
      return { ok: true as const, result: evaluateRpn(input, settings) }
    } catch (e) {
      return { ok: false as const, message: e instanceof RpnError ? e.message : 'could not be evaluated' }
    }
  }, [input, settings])

  const top: Value | null = evaluated?.ok && evaluated.result.stack.length > 0
    ? evaluated.result.stack[evaluated.result.stack.length - 1]
    : null

  const copyDrawer = useCallback(async () => {
    if (!evaluated?.ok) return
    const revision = await sha256Hex(input)
    const record = calcRecord(input, evaluated.result, settings, revision)
    await navigator.clipboard.writeText(toOrgDrawer(record))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [evaluated, input, settings])

  /**
   * Hand the top of the stack to the worker.
   *
   * The seam that makes "no CAS in the browser" survivable: the scratchpad is for
   * speed, the worker is for exactness, and the value crosses as a tree rather
   * than as a string — the same rule everything else here obeys.
   */
  const sendToWorker = useCallback(async () => {
    if (!top || sending) return
    setSending(true)
    setExact(null)
    try {
      const tree = toWorkerTree(top, settings)
      const response = await authedFetch('/api/learn/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The route parses text, so the tree is rendered back to the infix it
        // round-trips through. One parser, one grammar, no second path in.
        body: JSON.stringify({
          operation: 'simplify',
          expression: tree.kind === 'rational'
            ? `${tree.numerator}/${tree.denominator}`
            : formatValue(top, settings).replace(':', '/'),
          variables: [],
        }),
      })
      const data = await response.json()
      setExact({
        display: data.display ?? null,
        latex: data.latex ?? null,
        conditions: data.conditions ?? [],
        note: data.configured === false
          ? (data.error ?? 'no worker is configured')
          : (data.error ?? `${data.evidenceKind ?? 'result'}${data.provenance?.runId ? ` · run ${data.provenance.runId}` : ''}`),
      })
    } catch (e) {
      setExact({ display: null, latex: null, conditions: [], note: e instanceof Error ? e.message : 'the request failed' })
    } finally {
      setSending(false)
    }
  }, [top, sending, settings])

  return (
    <div className='space-y-3 rounded-lg border border-gray-800 bg-gray-900 p-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='text-sm font-semibold text-gray-100'>RPN</h3>
        <span className='text-[11px] text-gray-500'>
          numbers and operators, separated by spaces · <code>3 4 +</code> · <code>1:3</code> is an exact third
        </span>
      </div>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder='3 4 + 2 /'
        className='w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-700 focus:outline-none'
      />

      <div className='flex flex-wrap items-center gap-3 text-xs'>
        <label className='flex items-center gap-1.5 text-gray-400'>
          precision
          <input
            type='number'
            min={1}
            max={40}
            value={settings.precision}
            onChange={e => setSettings(s => ({ ...s, precision: Math.max(1, Math.min(40, Number(e.target.value) || 12)) }))}
            className='w-16 rounded border border-gray-700 bg-gray-950 px-1.5 py-0.5 text-gray-100'
          />
        </label>
        <label className='flex items-center gap-1.5 text-gray-400'>
          angle
          <select
            value={settings.angle}
            onChange={e => setSettings(s => ({ ...s, angle: e.target.value as AngleMode }))}
            className='rounded border border-gray-700 bg-gray-950 px-1.5 py-0.5 text-gray-100'
          >
            <option value='deg'>deg</option>
            <option value='rad'>rad</option>
          </select>
        </label>
        <span className='text-gray-600'>mode rpn</span>
      </div>

      {precisionIsAdvisory(settings) && (
        <p className='text-[11px] text-amber-300'>
          Above {DOUBLE_DIGITS} digits this is a display setting, not a computation one — a
          JavaScript double cannot carry more. Emacs Calc can; send a value to the worker for an
          exact answer.
        </p>
      )}

      {evaluated && !evaluated.ok && (
        <p className='rounded border border-rose-900 bg-rose-950/40 px-3 py-2 text-xs text-rose-200'>
          {evaluated.message}
        </p>
      )}

      {evaluated?.ok && (
        <>
          <div className='rounded border border-gray-800 bg-gray-950 p-3'>
            <div className='flex items-baseline justify-between gap-2'>
              <code className='font-mono text-lg text-emerald-300'>{evaluated.result.display || '—'}</code>
              <span
                title={evaluated.result.isExact
                  ? 'Computed in exact rational arithmetic.'
                  : 'A decimal numeral or a transcendental function was involved, so this went through a double.'}
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  evaluated.result.isExact
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-amber-950 text-amber-300'}`}
              >
                {evaluated.result.isExact ? 'symbolic_result' : 'numerical_observation'}
              </span>
            </div>
            {evaluated.result.stack.length > 1 && (
              <p className='mt-1.5 font-mono text-[11px] text-gray-500'>
                stack: {evaluated.result.stack.map(v => formatValue(v, settings)).join(' ')}
              </p>
            )}
          </div>

          <div className='flex flex-wrap gap-2'>
            <button
              onClick={copyDrawer}
              className='inline-flex items-center gap-1.5 rounded bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700'
              title='The same drawer math-workbench-calc writes, so this pastes straight into an Org entry.'
            >
              <Clipboard size={12} /> {copied ? 'Copied' : 'Copy as Org drawer'}
            </button>
            <button
              onClick={sendToWorker}
              disabled={!top || sending}
              className='inline-flex items-center gap-1.5 rounded bg-emerald-800 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50'
              title='Ask the math-workbench worker for an exact answer, and for its LaTeX.'
            >
              {sending ? <Loader2 size={12} className='animate-spin' /> : <Send size={12} />} Exact, via the worker
            </button>
          </div>
        </>
      )}

      {exact && (
        <div className='rounded border border-gray-800 bg-gray-950 p-3 text-xs'>
          {exact.display
            ? <p className='font-mono text-emerald-300'>{exact.display}</p>
            : <p className='text-gray-400'>Nothing came back.</p>}
          {exact.latex && (
            <p className='mt-1 font-mono text-[11px] text-sky-300'>{exact.latex}</p>
          )}
          {exact.conditions.length > 0 && (
            <p className='mt-1 text-amber-200'>Holds given: {exact.conditions.join(', ')}</p>
          )}
          <p className='mt-1 text-[10px] text-gray-600'>{exact.note}</p>
        </div>
      )}
    </div>
  )
}
