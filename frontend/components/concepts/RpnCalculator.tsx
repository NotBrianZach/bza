'use client'

import { useCallback, useMemo, useState } from 'react'
import { Clipboard, Loader2, Send } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { fuzzySearch } from '@/lib/fuzzy'
import {
  calcRecord, CONSTANT_WORDS, DEFAULT_SETTINGS, DOUBLE_DIGITS, evaluateRpn, formatValue,
  OPERATORS, precisionIsAdvisory, RpnError, sha256Hex, toOrgDrawer, toWorkerTree,
  type AngleMode, type RpnSettings, type Value,
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
  /**
   * The held stack and registers — the thing that makes this a calculator.
   *
   * The engine always had `dup`, `drop`, `swap` and `over`, and this component
   * discarded the stack after every entry, so none of them could do the one
   * thing they are for. Emacs calc's model: an entry is evaluated ON TOP of
   * what is already there, and what it leaves stays for the next one.
   */
  const [stack, setStack] = useState<Value[]>([])
  const [registers, setRegisters] = useState<Map<string, Value>>(new Map())
  const [finder, setFinder] = useState('')

  /**
   * The live preview of the entry being typed, against a COPY of both.
   *
   * The copy is not tidiness, it is required. `evaluateRpn` mutates the
   * register map by design — see its header — so previewing `7 sto radius`
   * on every keystroke against the real map would store a register while you
   * were still typing its name, leaving `r`, `ra`, `rad`… behind. The stack
   * is already copied by the engine; the registers have to be copied here.
   */
  const evaluated = useMemo(() => {
    if (!input.trim()) return null
    try {
      return {
        ok: true as const,
        result: evaluateRpn(input, settings, { stack, registers: new Map(registers) }),
      }
    } catch (e) {
      return { ok: false as const, message: e instanceof RpnError ? e.message : 'could not be evaluated' }
    }
  }, [input, settings, stack, registers])

  /**
   * Commit the entry: fold it into the held stack and clear the box.
   *
   * This is where the real register map is handed over, so a `sto` only
   * happens once and only when you meant it.
   */
  const commit = useCallback(() => {
    if (!input.trim()) return
    const next = new Map(registers)
    try {
      const result = evaluateRpn(input, settings, { stack, registers: next })
      setStack(result.stack)
      setRegisters(next)
      setInput('')
      setExact(null)
    } catch {
      /* The error is already on screen from the preview; leaving the text in
         the box is what lets it be corrected rather than retyped. */
    }
  }, [input, settings, stack, registers])

  /* The preview's stack when there is one, otherwise the held stack — so the
     readout and the send button act on what you can see. */
  const shown: Value[] = evaluated?.ok ? evaluated.result.stack : stack
  const top: Value | null = shown.length > 0 ? shown[shown.length - 1] : null

  /**
   * Everything you can type, for the finder.
   *
   * Built from the registries rather than listed: OPERATORS is the operator
   * and function table, CONSTANT_WORDS the constants, and the stack and
   * register words are the ones the engine handles inline. A function added
   * to the engine appears here without anybody remembering to add it, which
   * is the only reason a palette like this stays true.
   */
  const vocabulary = useMemo(() => [
    ...Object.keys(OPERATORS).map(name => ({ name, kind: 'operator' })),
    ...Object.keys(CONSTANT_WORDS).map(name => ({ name, kind: 'constant' })),
    ...['dup', 'drop', 'swap', 'over'].map(name => ({ name, kind: 'stack' })),
    ...['sto', 'rcl'].map(name => ({ name, kind: 'register' })),
  ], [])

  const found = useMemo(
    () => (finder.trim() ? fuzzySearch(vocabulary, finder, v => v.name).map(m => m.item) : []),
    [finder, vocabulary],
  )

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

      {/* The held stack, top first, numbered the way Calc numbers it.
          Shown above the entry box because that is where it is on a real
          calculator and where your eye already is after an entry.

          The PREVIEW stack while you are typing, the held one otherwise, so
          the rows move as you type rather than after you commit. */}
      {shown.length > 0 && (
        <ol className='rounded border border-gray-800 bg-gray-950 px-2 py-1.5 font-mono text-sm'>
          {[...shown].reverse().map((v, i) => (
            <li key={shown.length - i} className='flex gap-2'>
              <span className='w-6 shrink-0 text-right text-[11px] text-gray-600'>{i + 1}:</span>
              <span className={i === 0 ? 'text-emerald-200' : 'text-gray-400'}>
                {formatValue(v, settings)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
        }}
        placeholder='3 4 + 2 /'
        aria-label='RPN entry'
        className='w-full rounded border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-700 focus:outline-none'
      />

      <div className='flex flex-wrap items-center gap-2 text-[11px]'>
        <span className='text-gray-500'>
          Enter folds the entry into the stack · <code>dup drop swap over</code> ·{' '}
          <code>sto name</code> / <code>rcl name</code>
        </span>
        {(stack.length > 0 || registers.size > 0) && (
          <button
            type='button'
            onClick={() => { setStack([]); setRegisters(new Map()); setExact(null) }}
            className='ml-auto rounded border border-gray-700 px-1.5 py-0.5 text-gray-400 hover:text-gray-200'
          >
            clear stack and registers
          </button>
        )}
      </div>

      {/* Registers. Absent until there are some — an empty panel teaches
          nothing and the words are documented on the line above. */}
      {registers.size > 0 && (
        <div className='rounded border border-gray-800 bg-gray-950 px-2 py-1.5'>
          <p className='text-[10px] uppercase tracking-wide text-gray-600'>registers</p>
          <ul className='mt-0.5 space-y-0.5 font-mono text-xs'>
            {[...registers.entries()].map(([name, v]) => (
              <li key={name} className='flex items-baseline gap-2'>
                <button
                  type='button'
                  title={`append rcl ${name}`}
                  onClick={() => setInput(s => `${s}${s && !s.endsWith(' ') ? ' ' : ''}rcl ${name} `)}
                  className='text-sky-300 hover:underline'
                >
                  {name}
                </button>
                <span className='text-gray-400'>{formatValue(v, settings)}</span>
                <button
                  type='button'
                  aria-label={`forget ${name}`}
                  onClick={() => setRegisters(m => { const n = new Map(m); n.delete(name); return n })}
                  className='ml-auto text-[10px] text-gray-600 hover:text-red-400'
                >
                  forget
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The finder.
          Built from the registries, so it cannot fall behind the engine —
          see `vocabulary`. Clicking appends rather than replacing, because
          you are composing an entry and the thing you looked up is usually
          the next token rather than the whole of it. */}
      <div>
        <input
          value={finder}
          onChange={e => setFinder(e.target.value)}
          placeholder='find a function — sqrt, log, atan…'
          aria-label='Find a function'
          className='w-full rounded border border-gray-800 bg-gray-950 px-2 py-1 text-xs text-gray-200 placeholder:text-gray-600 focus:border-sky-700 focus:outline-none'
        />
        {found.length > 0 && (
          <ul className='mt-1 flex flex-wrap gap-1'>
            {found.slice(0, 24).map(v => (
              <li key={`${v.kind}-${v.name}`}>
                <button
                  type='button'
                  title={v.kind}
                  onClick={() => {
                    setInput(s => `${s}${s && !s.endsWith(' ') ? ' ' : ''}${v.name} `)
                    setFinder('')
                  }}
                  className='rounded border border-gray-700 px-1.5 py-0.5 font-mono text-[11px] text-gray-300 hover:border-sky-600 hover:text-sky-200'
                >
                  {v.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {finder.trim() && found.length === 0 && (
          <p className='mt-1 text-[11px] text-gray-500'>
            Nothing matches “{finder.trim()}”. The engine knows {vocabulary.length} words.
          </p>
        )}
      </div>

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
