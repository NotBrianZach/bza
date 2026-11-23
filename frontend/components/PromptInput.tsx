'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Loader2, Send } from 'lucide-react'

/**
 * The chat prompt box, in the shape people arrive already knowing.
 *
 * Both chat surfaces used `<input type="text">`, which is a single line that
 * cannot grow. Type a paragraph into one and it scrolls sideways: the text you
 * wrote is still there and you cannot see any of it, which is what "you can
 * easily overflow the prompt input" describes. Reported on the chat-book
 * creator and true of the reader's input too.
 *
 * A one-line input is the right control for a title. It is the wrong one for
 * the thing you are composing, and every chat interface anybody has used for
 * the last two years auto-grows. So this is a textarea that behaves the way
 * those do, in one component rather than two copies that drift.
 *
 * ── THE FOUR BEHAVIOURS THAT MAKE IT FEEL RIGHT ───────────────────────────
 *
 *  1. It grows with the content, to a cap, and then scrolls. Growing without
 *     a cap eats the transcript above it on a long paste; capping without
 *     scrolling loses the end of what you wrote.
 *  2. Enter sends, Shift+Enter makes a newline. This is the convention and
 *     getting it backwards is immediately infuriating. It is also why the
 *     `<form>` cannot be left to handle Enter by itself — a textarea inside a
 *     form does not submit on Enter, so the key handling has to be explicit.
 *  3. IME-safe. `isComposing` is checked before treating Enter as send,
 *     because a Japanese or Chinese keyboard uses Enter to accept a
 *     candidate, and a prompt box that fires mid-composition sends half a
 *     word. This costs one condition and it is the difference between the
 *     control working and being unusable for a large fraction of the world.
 *  4. The height resets when the value is cleared. Otherwise the box stays
 *     paragraph-tall after sending, which reads as though the send failed.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ──────────────────────────────────────
 *
 * No slash commands, no attachments, no markdown toolbar, no draft
 * persistence. "Approximately full featured as a ChatGPT or Claude input"
 * means the composing experience, which is the auto-grow and the key
 * handling; the rest of those boxes is product surface that this product does
 * not have yet. A toolbar for markdown nobody renders in the prompt would be
 * furniture.
 */
export function PromptInput({
  value,
  onChange,
  onSend,
  sending = false,
  disabled = false,
  placeholder = 'Type a message…',
  /** Rough cap, in rows, before the box scrolls instead of growing. */
  maxRows = 10,
  autoFocus = false,
  sendLabel,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  sending?: boolean
  disabled?: boolean
  placeholder?: string
  maxRows?: number
  autoFocus?: boolean
  /** Text instead of an icon, where the surrounding UI uses words. */
  sendLabel?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /**
   * Resize to fit, bounded.
   *
   * Measured from `scrollHeight` with the height cleared first — without the
   * reset the box can only ever grow, because `scrollHeight` of an element
   * already tall enough is its own height. That is the classic bug in this
   * pattern and it looks like "the input never shrinks again".
   */
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20
    const max = line * maxRows
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden'
  }, [maxRows])

  useEffect(resize, [value, resize])

  const submit = () => {
    if (sending || disabled || !value.trim()) return
    onSend()
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); submit() }}
      className="flex items-end gap-2"
    >
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          /* `nativeEvent.isComposing` rather than a keyCode check: an IME
             candidate is accepted with Enter and that Enter must not send. */
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        rows={1}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 resize-none text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={sending || disabled || !value.trim()}
        title="Enter to send · Shift+Enter for a new line"
        className="flex-shrink-0 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 text-sm flex items-center gap-1"
      >
        {sending
          ? <Loader2 size={14} className="animate-spin" />
          : (sendLabel ?? <Send size={14} />)}
      </button>
    </form>
  )
}
