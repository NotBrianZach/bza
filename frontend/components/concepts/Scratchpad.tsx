'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Check, Columns2, Eye, Loader2, Pencil } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * A working buffer beside the problem, with LaTeX rendered the way org mode
 * renders it.
 *
 * ── Why the source is always kept ─────────────────────────────────────────
 *
 * The rendered view is a VIEW. What is stored and what is edited is the plain
 * text, so a block with a LaTeX mistake in it can still be read and fixed —
 * rather than becoming an unselectable red error box over the top of the only
 * copy of your working. That is the org-mode bargain too: the buffer is the
 * document, the preview is a convenience.
 *
 * Three modes rather than a single live-preview pane: `write` for when the
 * rendering would get in the way, `read` for when the maths is the point, and
 * `split` for working. Split is the default because that is the state somebody
 * doing a problem is actually in.
 *
 * ── Saving ────────────────────────────────────────────────────────────────
 *
 * Debounced, and the indicator distinguishes "saving" from "saved" from
 * "unsaved" — because this holds work nobody retyped, and an autosave that
 * looks identical whether or not it succeeded is worse than no autosave. A
 * failed save says so and leaves the text alone.
 *
 * It flushes on unmount too. Switching tabs inside /learn unmounts this, and a
 * pending debounce would otherwise discard the last few seconds of typing —
 * exactly the keystrokes somebody just made.
 */

const SAVE_DEBOUNCE_MS = 900

export type ScratchpadHandle = {
  /** Append text, with a blank line before it if the buffer is not empty. */
  append: (text: string) => void
  /**
   * The buffer right now.
   *
   * A function rather than a prop on purpose. The tutor needs the CURRENT text
   * when it asks, and lifting the content into the page as state would
   * re-render /learn — task list, traversal map and all — on every keystroke
   * in here. Pulling it at call time is both fresher and cheaper.
   */
  read: () => string
}

export default function Scratchpad({
  subject,
  onHandle,
  onEmptyChange,
}: {
  subject: string
  /** Lets the chat panel write into this buffer. See `ScratchpadHandle`. */
  onHandle?: (handle: ScratchpadHandle) => void
  /**
   * Fires only on the empty ↔ non-empty transition.
   *
   * The tutor's "check my working" button has to be disabled when there is
   * nothing to check, and that is a render-time question — so it cannot use
   * `read()`. Publishing just the boolean keeps the parent re-rendering on a
   * transition that happens about twice a session, rather than per keystroke.
   */
  onEmptyChange?: (empty: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [mode, setMode] = useState<'write' | 'split' | 'read'>('split')
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * The latest content, for the unmount flush.
   *
   * A ref rather than the state value: the cleanup closure captures whatever
   * `content` was when the effect last ran, which on unmount is stale by
   * however much was typed since. This is the difference between flushing the
   * user's last sentence and flushing the one before it.
   */
  const latest = useRef('')
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authedFetch(`/api/learn/scratchpad?subject=${encodeURIComponent(subject)}`)
      .then(r => r.json())
      .then((d: { content?: string; error?: string }) => {
        if (cancelled) return
        if (d.error) { setError(d.error); return }
        setContent(d.content ?? '')
        latest.current = d.content ?? ''
        loaded.current = true
      })
      .catch(() => { if (!cancelled) setError('could not load the scratchpad') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [subject])

  const save = useCallback(async (text: string) => {
    setStatus('saving')
    try {
      const res = await authedFetch('/api/learn/scratchpad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: text }),
      })
      const d = await res.json()
      if (d.error) { setStatus('error'); setError(d.error); return }
      setStatus('saved')
      setError(null)
    } catch {
      setStatus('error')
      setError('the save failed — your text is still here, and the next edit will retry')
    }
  }, [subject])

  const emptyRef = useRef(true)
  const change = useCallback((text: string) => {
    setContent(text)
    latest.current = text
    setStatus('dirty')
    const empty = text.trim().length === 0
    if (empty !== emptyRef.current) {
      emptyRef.current = empty
      onEmptyChange?.(empty)
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(text), SAVE_DEBOUNCE_MS)
  }, [save, onEmptyChange])

  // Flush on unmount. Switching tabs in /learn unmounts this component.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    // `loaded` guards against writing an empty buffer over a real one when the
    // component unmounts before the initial GET came back.
    if (loaded.current && status === 'dirty') void save(latest.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Published upward so the chat can append to this buffer. */
  useEffect(() => {
    if (!onHandle) return
    onHandle({
      append: (text: string) => {
        const base = latest.current
        const next = base.trim().length === 0 ? text : `${base.replace(/\s*$/, '')}\n\n${text}`
        change(next)
      },
      read: () => latest.current,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHandle, change])

  const label: Record<typeof status, string> = {
    idle: '',
    dirty: 'unsaved',
    saving: 'saving…',
    saved: 'saved',
    error: 'not saved',
  }

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <div className='flex items-center gap-2 border-b border-gray-800 px-3 py-1.5'>
        <h3 className='text-xs font-medium text-gray-300'>Scratchpad</h3>
        <span className='text-[11px] text-gray-500'>
          {/* Said plainly, because somebody has to know the syntax to use it. */}
          $inline$ and $$display$$ render as maths
        </span>
        <span className={`ml-auto text-[11px] ${
          status === 'error' ? 'text-rose-300'
            : status === 'saved' ? 'text-emerald-300'
            : 'text-gray-500'
        }`}>
          {status === 'saving' && <Loader2 size={10} className='mr-1 inline animate-spin' />}
          {status === 'saved' && <Check size={10} className='mr-1 inline' />}
          {label[status]}
        </span>
        <div className='flex gap-0.5'>
          {([
            ['write', Pencil, 'Edit only'],
            ['split', Columns2, 'Edit and preview'],
            ['read', Eye, 'Preview only'],
          ] as const).map(([m, Icon, title]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={title}
              className={`rounded p-1 ${
                mode === m ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={12} />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className='border-b border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-[11px] text-rose-200'>
          {error}
        </p>
      )}

      {loading ? (
        <p className='flex items-center gap-2 px-3 py-6 text-xs text-gray-500'>
          <Loader2 size={12} className='animate-spin' /> loading…
        </p>
      ) : (
        <div className={mode === 'split' ? 'grid grid-cols-1 md:grid-cols-2' : ''}>
          {mode !== 'read' && (
            <textarea
              value={content}
              onChange={e => change(e.target.value)}
              spellCheck={false}
              placeholder={'Work it out here.\n\n$$\\frac{x+3}{x-5} = \\dots$$'}
              className='min-h-[16rem] w-full resize-y bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-gray-200 outline-none'
            />
          )}
          {mode !== 'write' && (
            <div className={`min-h-[16rem] overflow-x-auto px-3 py-2 text-xs text-gray-200 ${
              mode === 'split' ? 'border-t border-gray-800 md:border-l md:border-t-0' : ''
            }`}>
              {content.trim().length === 0 ? (
                <p className='text-gray-600'>nothing to preview yet</p>
              ) : (
                <div className='prose prose-invert prose-sm max-w-none prose-p:my-1.5'>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
