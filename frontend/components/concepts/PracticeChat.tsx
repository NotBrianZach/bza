'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ArrowDownToLine, Loader2, Send, Sigma } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import type { ScratchpadHandle } from './Scratchpad'

/**
 * A tutor beside the problem, which can write into the scratchpad.
 *
 * ── It does not grade, and says so ────────────────────────────────────────
 *
 * This is the one thing that must not blur. The verifier rules; a model does
 * not. "Check my working" asks a language model to read what you wrote and
 * comment, and a model saying "that looks right" is not a ruling — the whole
 * practice engine exists because string-comparing or eyeballing an answer is
 * not verification. So the panel states it, once, where it cannot be missed.
 *
 * Mixing them would be the worst available outcome: a learner who trusts a
 * chat's approval has the experience of being marked correct with none of the
 * evidence, and `concept_observations` would never hear about it.
 *
 * ── Why intents rather than an open prompt ────────────────────────────────
 *
 * /api/problem-set-chat is mode-driven — hint, check, step, solution — and the
 * modes are pedagogically different: a hint deliberately stops before the
 * answer, a solution deliberately does not. Exposing them as buttons means the
 * learner chooses how much to be told, which is the choice that matters in
 * practice and the one an open prompt makes by accident. The free-text box
 * rides along as extra instruction rather than replacing them.
 *
 * ── Why the reply is not auto-inserted ────────────────────────────────────
 *
 * Each reply has an explicit "to scratchpad" button. The scratchpad is the
 * learner's own working and the thing their answer comes from; silently
 * appending a model's solution to it would mean submitting an answer they did
 * not write, and the assistance record would not know. Pressing the button is
 * a decision, and `assistance` on the observation is what it informs.
 */

type Mode = 'hint' | 'check' | 'step' | 'solution'

const INTENTS: { mode: Mode; label: string; title: string }[] = [
  { mode: 'hint', label: 'Hint', title: 'Point at the first step without giving the answer' },
  { mode: 'check', label: 'Check my working', title: 'Read the scratchpad and comment on it — this is NOT a ruling' },
  { mode: 'step', label: 'Next step', title: 'Reveal one more step than you have' },
  { mode: 'solution', label: 'Full solution', title: 'Show the whole thing worked out' },
]

interface Turn {
  mode: Mode
  question: string | null
  content: string
}

export default function PracticeChat({
  problem,
  hasWorking,
  pad,
  subjectName,
}: {
  /** The task's prompt and given, as the tutor should see them. */
  problem: string
  /**
   * Whether there is anything to check.
   *
   * A boolean, not the text. Disabling the button is a render-time question so
   * it cannot use `pad.read()`, but the text itself is pulled at call time —
   * passing the whole buffer down as a prop would re-render /learn on every
   * keystroke in the scratchpad.
   */
  hasWorking: boolean
  /** Handle onto the scratchpad: reads the working, and inserts a reply. */
  pad: ScratchpadHandle | null
  subjectName?: string
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState<Mode | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function ask(mode: Mode) {
    if (busy) return
    setBusy(mode)
    setError(null)
    const asked = question.trim() || null
    try {
      const res = await authedFetch('/api/problem-set-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem,
          mode,
          scratchpad: pad?.read() ?? '',
          instruction: asked ?? undefined,
          bookTitle: subjectName,
        }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      const content = typeof d.content === 'string' ? d.content : ''
      if (!content.trim()) {
        setError('the tutor returned nothing — try again, or a different kind of help')
        return
      }
      setTurns(t => [...t, { mode, question: asked, content }])
      setQuestion('')
    } catch {
      setError('could not reach the tutor')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <div className='flex items-center gap-2 border-b border-gray-800 px-3 py-1.5'>
        <Sigma size={12} className='text-sky-400' />
        <h3 className='text-xs font-medium text-gray-300'>Tutor</h3>
        {/* The disclaimer is in the header, not a footnote. See the module note. */}
        <span className='ml-auto text-[11px] text-amber-300/80'>
          explains — does not mark. Submitting is what gets ruled.
        </span>
      </div>

      <div className='flex flex-wrap gap-1 border-b border-gray-800 px-3 py-2'>
        {INTENTS.map(i => (
          <button
            key={i.mode}
            onClick={() => ask(i.mode)}
            disabled={!!busy || (i.mode === 'check' && !hasWorking)}
            title={i.mode === 'check' && !hasWorking
              ? 'Write something in the scratchpad first'
              : i.title}
            className='inline-flex items-center gap-1 rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-40'
          >
            {busy === i.mode && <Loader2 size={10} className='animate-spin' />}
            {i.label}
          </button>
        ))}
      </div>

      <div className='flex gap-1 border-b border-gray-800 px-3 py-2'>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !busy) ask('hint') }}
          placeholder='Ask something specific (optional) — then pick how much help you want'
          className='min-w-0 flex-1 rounded border border-gray-700 bg-transparent px-2 py-1 text-xs text-gray-200 outline-none placeholder:text-gray-600'
        />
        <button
          onClick={() => ask('hint')}
          disabled={!!busy}
          title='Ask as a hint'
          className='rounded border border-gray-700 px-2 text-gray-400 hover:bg-gray-800 disabled:opacity-40'
        >
          <Send size={12} />
        </button>
      </div>

      {error && (
        <p className='border-b border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-[11px] text-rose-200'>
          {error}
        </p>
      )}

      {turns.length === 0 ? (
        <p className='px-3 py-4 text-[11px] text-gray-600'>
          Nothing asked yet. “Check my working” reads your scratchpad.
        </p>
      ) : (
        <ul className='divide-y divide-gray-800'>
          {turns.map((t, i) => (
            <li key={i} className='px-3 py-2'>
              <div className='mb-1 flex items-center gap-2'>
                <span className='rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400'>
                  {INTENTS.find(x => x.mode === t.mode)?.label ?? t.mode}
                </span>
                {t.question && (
                  <span className='truncate text-[11px] italic text-gray-500'>“{t.question}”</span>
                )}
                <button
                  onClick={() => pad?.append(t.content)}
                  disabled={!pad}
                  title={pad
                    ? 'Append this to the scratchpad. Note that working you did not write is assistance.'
                    : 'The scratchpad is not ready'}
                  className='ml-auto inline-flex items-center gap-1 rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400 hover:bg-gray-800 disabled:opacity-40'
                >
                  <ArrowDownToLine size={10} /> to scratchpad
                </button>
              </div>
              <div className='prose prose-invert prose-sm max-w-none text-xs prose-p:my-1 prose-headings:my-1.5 prose-headings:text-xs'>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {t.content}
                </ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
