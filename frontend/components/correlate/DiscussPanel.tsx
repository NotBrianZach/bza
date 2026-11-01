'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageSquare, Send, X } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { track } from '@/lib/analytics'
import { getMedium } from '@/lib/correlate/media'
import type { Offering } from '@/lib/correlate/types'

/**
 * Talking about a highlighted span of something in play.
 *
 * ── Why this is not part of the chain ────────────────────────────────────
 *
 * Nothing said here is recorded, and that is the design rather than a corner
 * cut. The chain's value is that every turn in it was answered under rules, by
 * an interpreter that ruled on the relation and refused illegal moves. A
 * conversation has none of that, so writing it into the same structure would
 * put unruled text beside ruled text with no way to tell them apart later.
 *
 * The prompt is explicit with the model about the same boundary — it is told not
 * to offer a move or describe what the game "would" answer — because a chat that
 * proposed the next turn would have the player believing they had played one.
 *
 * It is therefore deliberately ephemeral: closing the panel discards it. If that
 * turns out to be the wrong call, the fix is a table of its own rather than a
 * column on `listen_turns`, for the reason above.
 */

interface Msg { role: 'user' | 'assistant'; content: string }

/** One side of the exchange, as the conversation should see it. */
const describe = (o: Offering) =>
  `${o.title}${o.attribution ? ` by ${o.attribution}` : ''} ` +
  `(${getMedium(o.medium)?.plural ?? o.medium})`

/** The text an offering carries, if any. Most media carry none. */
const bodyOf = (o: Offering): string | null =>
  o.perceptible?.kind === 'text' ? o.perceptible.body : null

export default function DiscussPanel({
  move,
  reply,
  gameName,
  reading,
  selection,
  onClose,
}: {
  /**
   * The whole exchange, not just the offering the selection sits in.
   *
   * The selection says what the subject is; the exchange says what it is *for*.
   * A player highlighting a line of a theorem that answered a song is asking
   * about the connection as often as about the line, and a panel that had been
   * handed only the theorem could not discuss the half of that question the
   * game exists for.
   */
  move: Offering
  reply: Offering | null
  gameName?: string
  /** The partner's reading of the exchange, when there is one. */
  reading?: string | null
  /** The highlighted span. The subject of the conversation. */
  selection: string
  onClose: () => void
}) {
  const offering = reply ?? move
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const scroller = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    // Pinned to the bottom as the reply streams in.
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, streaming])

  const send = useCallback(async (text: string) => {
    const question = text.trim()
    if (!question || streaming) return
    setInput('')
    setError('')
    const next: Msg[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setStreaming(true)
    track('correlate_discuss_asked', {
      medium: offering.medium,
      game: gameName,
      selectionChars: selection.length,
      turn: next.filter(m => m.role === 'user').length,
    })

    try {
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          about: {
            game: gameName,
            what: reply
              ? `${describe(move)}, answered with ${describe(reply)}`
              : describe(move),
            // Only a text offering has a body to send. For a song or a painting
            // the title and attribution are all there is, which is a real limit
            // and not a gap to paper over — see the note on unperceived media.
            text: [
              bodyOf(move) && `What was offered — ${describe(move)}:\n${bodyOf(move)}`,
              reply && bodyOf(reply) && `What came back — ${describe(reply)}:\n${bodyOf(reply)}`,
            ].filter(Boolean).join('\n\n') || undefined,
            reading: reading ?? undefined,
            selection,
          },
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `That did not go through (${res.status})`)
      }

      // The route answers with its own SSE stream: `data: {"content":"…"}` per
      // chunk and a bare `data: [DONE]` at the end. The payload is JSON, not the
      // text — appending the line verbatim was the first version of this loop and
      // it rendered the object literals into the bubble.
      //
      // Read incrementally so the reply appears as it is written rather than
      // arriving whole after a silent wait.
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reply stream')
      const decoder = new TextDecoder()
      let buffer = ''
      let answer = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // The last element may be a partial line; keep it for the next chunk.
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === '[DONE]') continue
          let delta = ''
          try {
            delta = JSON.parse(payload)?.content ?? ''
          } catch {
            // A malformed chunk is dropped rather than shown. The route already
            // skips upstream junk; this is the same posture one layer down.
            continue
          }
          if (!delta) continue
          answer += delta
          setMessages(m => {
            const copy = [...m]
            copy[copy.length - 1] = { role: 'assistant', content: answer }
            return copy
          })
        }
      }

      if (!answer.trim()) throw new Error('It had nothing to say about that')
    } catch (e: any) {
      setError(e?.message ?? 'That did not go through')
      // The empty assistant turn is removed rather than left blank: a bubble
      // with nothing in it reads as an answer that said nothing, which is a
      // different and worse claim than an error.
      setMessages(m => (m[m.length - 1]?.role === 'assistant' && !m[m.length - 1].content
        ? m.slice(0, -1)
        : m))
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming, move, reply, offering.medium, gameName, reading, selection])

  return (
    <div className="mt-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 min-w-0">
          <MessageSquare size={12} className="flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
          {/* The selection is quoted back, and clipped rather than summarised:
              it is the subject, and a player who highlighted the wrong span
              should be able to see that immediately. */}
          <span className="min-w-0">
            <span className="text-gray-400 dark:text-gray-500">about </span>
            <span className="italic text-gray-700 dark:text-gray-200">
              &ldquo;{selection.length > 160 ? `${selection.slice(0, 160)}…` : selection}&rdquo;
            </span>
          </span>
        </p>
        <button
          onClick={onClose}
          title="Close — this conversation is not kept"
          className="flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {messages.length > 0 && (
        <div ref={scroller} className="max-h-72 overflow-y-auto space-y-2 mb-2 pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-xs leading-relaxed rounded-lg px-2.5 py-1.5 ${
                m.role === 'user'
                  ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {m.content || (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Loader2 size={11} className="animate-spin" /> thinking
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={e => { e.preventDefault(); void send(input) }}
        className="flex items-center gap-1.5"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={streaming}
          placeholder={messages.length === 0 ? 'What do you want to know about it?' : 'Ask something else'}
          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="flex-shrink-0 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          {streaming ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </form>

      {/* Three openers, because a blank box next to a highlighted sentence is a
          question nobody knows how to start. Each one is a thing this game is
          actually about, rather than generic chat prompts. */}
      {messages.length === 0 && !streaming && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {[
            'What does this mean?',
            'Why would this answer the last one?',
            'What is it doing that I might have missed?',
          ].map(q => (
            <button
              key={q}
              onClick={() => void send(q)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-gray-500 hover:bg-white dark:bg-gray-800/70 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">{error}</p>
      )}
      <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        Not part of your chain — nothing here is recorded or ruled on.
      </p>
    </div>
  )
}
