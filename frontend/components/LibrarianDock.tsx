'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2, Send, X } from 'lucide-react'
import PersonaAvatar, { type AvatarState } from './PersonaAvatar'
import { getModelChoice, getPersonaInfo, getPersonaPrompt } from '@/lib/persona'
import { pageContext } from '@/lib/librarian/page'
import { authedFetch } from '@/lib/authedFetch'
import { supabase } from '@/lib/supabase'

/**
 * The librarian, following you around.
 *
 * ── What this changes, which is less than it looks ───────────────────────
 *
 * Nearly all of this existed already: the persona, its eight faces and the
 * custom-image upload (`PersonaAvatar`), the settings that choose it
 * (`AiPersonaSection`), the chat itself (`/api/library-chat`) and the context
 * discipline behind it (`lib/librarian/context.ts`). What did not exist was a
 * way to reach any of it from anywhere but one tab of one drawer on the home
 * page. So on /play, /suggest, /learn or a book, there was nothing to talk to.
 *
 * This is that missing piece and deliberately nothing else: a button in the
 * corner of every page, and the same chat behind it.
 *
 * ── It knows WHERE you are, and says what it cannot see ──────────────────
 *
 * The pathname goes to the route, which resolves it through
 * `lib/librarian/page.ts` into both the sections to load and — the part that
 * matters — a written statement of what is NOT loaded. A model told "they are
 * looking at a correlation game" and given no chain will discuss the chain
 * anyway, fluently, naming songs that were never played. The engines under this
 * app all refuse to fabricate; the chat layer is where that discipline is
 * easiest to lose and the only layer anybody reads.
 *
 * The client sends the PATH and never a description. A path is a fact. A
 * description would be a claim, and claims are the server's to make.
 *
 * ── Signed out it renders nothing ────────────────────────────────────────
 *
 * The chat needs a library to be about. Same reasoning as the suggested-feed
 * strip: advertising a thing that answers 401 is worse than not advertising it.
 */

interface Msg { role: 'user' | 'assistant'; content: string }

/** Where the dock keeps its open/closed state, so it survives a navigation. */
const OPEN_KEY = 'bza-librarian-open'

/**
 * "Does this page already have a librarian? Then you take it."
 *
 * ── The problem this solves ──────────────────────────────────────────────
 *
 * The home page mounts `MetaDrawer`, whose `chat` tab is this same librarian —
 * same route, same persona, same context. So on `/` there were two of them, a
 * centimetre apart, which is the exact arrangement this component suppresses
 * itself on `/books/` to avoid. The reader got a scope switch; the home page
 * needed the opposite move, because the better chat was already there.
 *
 * ── Why an event and not a pathname ──────────────────────────────────────
 *
 * The honest answer to "which pages have their own librarian" is "the ones that
 * mount a component that says so", and a hardcoded list in this file is a copy
 * of that fact that goes stale silently — the drawer moves, the list does not,
 * and the corner button opens a second chat again with nothing to notice it.
 *
 * `cancelable` is what makes this safe rather than clever. `dispatchEvent`
 * returns false only if a listener called `preventDefault`, so "somebody took
 * it" is the DOM's own answer and not a convention. Nothing listening — any
 * other page, or the home page before it has mounted — returns true and the
 * dock opens its own panel exactly as before. There is no arrangement in which
 * the button does nothing.
 */
const HANDOFF_EVENT = 'bza:open-librarian'

/** True when some page took the request, so this dock should stay shut. */
function handoff(): boolean {
  if (typeof window === 'undefined') return false
  return !window.dispatchEvent(new CustomEvent(HANDOFF_EVENT, { cancelable: true }))
}

export default function LibrarianDock() {
  const pathname = usePathname() || '/'
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser()
      .then(({ data }) => { if (!cancelled) setSignedIn(!!data.user) })
      .catch(() => { if (!cancelled) setSignedIn(false) })
    /**
     * A remembered-open dock offers the handoff too, or arriving at a page
     * that owns the librarian would restore the duplicate this avoids.
     *
     * The listener is already attached by the time this runs: the page is a
     * child of the layout that renders this, and React runs child effects
     * first. If that ever stops holding, the handoff simply declines and the
     * dock opens its own panel — the behaviour from before any of this, not a
     * new failure.
     */
    try {
      if (localStorage.getItem(OPEN_KEY) === '1') setOpen(!handoff())
    } catch {}
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(OPEN_KEY, open ? '1' : '0') } catch {}
  }, [open])

  // Pinned to the newest message, which is where a chat is read from.
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, open])

  /**
   * The reader's own panel owns the reading pages.
   *
   * Hidden inside a book rather than shown and made to explain itself: the
   * reader already has a chat with the page text in front of it, and a second
   * floating one that can see none of it would be the worse of two assistants
   * sitting a centimetre apart. `pageContext` says the same thing in words for
   * anyone who gets there another way.
   *
   * That used to leave a hole where this button would have been: inside a book
   * there was no way to reach the librarian at all. It is now a redirect rather
   * than an absence — the reader's chat tab carries the librarian on the fifth
   * position of its scope switch, with the whole book list, the feed and the
   * practice state behind it. See `Scope` in components/PageSidebar.tsx, and
   * the `reader` surface in lib/librarian/page.ts for the sentence that keeps
   * the two from pointing at each other in a circle.
   */
  const suppressed = pathname.startsWith('/books/')

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setError('')
    setBusy(true)
    try {
      const choice = getModelChoice('libraryChat')
      const res = await authedFetch('/api/library-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          // The dock carries no book list of its own, and that is not an
          // oversight to fix later: the home drawer passes one because it has
          // already loaded the library to render it. Making every page fetch
          // the whole library so a closed button could be opened would be a
          // read per page view for a feature most of them never use. The
          // route's own context — feed, practice — is loaded server-side from
          // the user id, which is the part that matters most anyway.
          books: [],
          concepts: [],
          personaPrompt: getPersonaPrompt(),
          model: choice.model,
          provider: choice.provider,
          pathname,
          // Stated rather than left to the route's default, because the two
          // surfaces now get different blind notices for the same path and a
          // silent default is the wrong place for that distinction to live.
          surface: 'dock',
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setMessages(m => [...m, { role: 'assistant', content: data.content ?? '' }])
    } catch {
      setError('That did not go through. Try again.')
    } finally {
      setBusy(false)
    }
  }, [input, busy, messages, pathname])

  if (!signedIn || suppressed) return null

  const persona = getPersonaInfo()
  const here = pageContext(pathname)
  const state: AvatarState = busy ? 'thinking' : 'idle'

  if (!open) {
    return (
      <button
        // Offer the page the request first; open here only if it declines.
        onClick={() => { if (!handoff()) setOpen(true) }}
        title={`Ask ${persona?.name ?? 'the librarian'} about ${here.label}`}
        aria-label={`Open ${persona?.name ?? 'the librarian'}`}
        /* Bottom-left, because bottom-right is where this app already puts
           things and a dock that covered them would be a tax on every page to
           pay for one feature. `pb-safe` via the inset keeps it off the iOS
           home indicator. */
        className="fixed bottom-4 left-4 z-40 rounded-full shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 p-1.5 hover:scale-105 transition-transform"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <PersonaAvatar state="idle" size="md" inline />
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
      style={{ marginBottom: 'env(safe-area-inset-bottom)', maxHeight: 'min(28rem, 70vh)' }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <PersonaAvatar state={state} size="sm" inline />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
            {persona?.name ?? 'Librarian'}
          </p>
          {/* Where it thinks it is, shown rather than left implicit. If this
              says the wrong place the answers will be wrong too, and a user who
              can see the mismatch can discount them. */}
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">on {here.label}</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
            Ask about {here.label}, your library, your feed or your practice.
            {/* The limitation stated to the person as well as to the model. The
                prompt stops it inventing; this stops them asking a question it
                is going to have to refuse. */}
            {here.blind && ' It can see where you are but not what is on the page here.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'flex items-start gap-1.5'}>
            {m.role === 'assistant' && <PersonaAvatar state="idle" size="sm" inline />}
            <p className={`inline-block text-xs leading-relaxed whitespace-pre-wrap rounded-xl px-2.5 py-1.5 ${
              m.role === 'user'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-left'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {m.content}
            </p>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-1.5">
            <PersonaAvatar state="thinking" size="sm" inline />
            <Loader2 size={12} className="animate-spin text-gray-400" />
          </div>
        )}
        {error && <p className="text-[11px] text-amber-600 dark:text-amber-400">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-1.5 px-2 py-2 border-t border-gray-100 dark:border-gray-700">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
          placeholder={`Ask about ${here.label}…`}
          className="flex-1 min-w-0 text-xs bg-transparent px-1.5 py-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={() => void send()}
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}
