'use client'

/**
 * LibrarianSection — cover the library with embeddings, once a day.
 *
 * Embeddings are what `search_library` searches, so until this has run a
 * scheduled task asking "tie this to something I've read" finds nothing and
 * says so. That is the single most confusing state this feature can be in —
 * everything works and the answer is always "nothing in your library fits" —
 * so the coverage figure is shown whether or not there is anything to do.
 *
 * ── THE LIMIT IS THE SERVER'S, AND THIS READS IT ──────────────────────────
 *
 * The once-a-day rule lives in /api/librarian/embed, which answers 429 with
 * the time it next allows one. This component asks GET for `canRun` and
 * `nextAllowedAt` rather than remembering a local timestamp: a disabled
 * button is a hint, and a hint that disagrees with the endpoint is worse than
 * no hint. It also means a second browser, or a reload, sees the same truth.
 *
 * ── WHY IT STILL HANDLES 429 ──────────────────────────────────────────────
 *
 * `canRun` is true at render and the limit is checked at the click, which are
 * different moments. Two tabs, or a tab left open past midnight, can both
 * produce a press the server refuses — so the refusal is rendered as the
 * normal outcome it is, with the time, rather than as an error.
 */

import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface Coverage {
  total: number
  embedded: number
  outstanding: number
  canRun: boolean
  nextAllowedAt: string | null
  lastEmbeddedAt: string | null
}

export default function LibrarianSection() {
  const [coverage, setCoverage] = useState<Coverage | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { getAuthHeaders } = await import('@/lib/authedFetch')
      const res = await fetch('/api/librarian/embed', { headers: await getAuthHeaders() })
      if (!res.ok) return
      setCoverage(await res.json())
    } catch { /* a missing coverage figure is not worth an error banner */ }
  }, [])

  useEffect(() => { load() }, [load])

  const run = async () => {
    if (busy) return
    setBusy(true)
    setNote(null)
    try {
      const { getAuthHeaders } = await import('@/lib/authedFetch')
      const res = await fetch('/api/librarian/embed', {
        method: 'POST',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 200 }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setNote(`Already done today — next available ${when(data.nextAllowedAt)}.`)
      } else if (!res.ok) {
        setNote(data.error || 'That did not work.')
      } else {
        // Named counts rather than "done": skipped is the common outcome on a
        // second run and reads as a failure unless it is spelled out.
        const bits = [`${data.embedded} embedded`]
        if (data.skipped) bits.push(`${data.skipped} already current`)
        if (data.failed) bits.push(`${data.failed} failed`)
        setNote(bits.join(', ') + '.')
      }
    } catch {
      setNote('Could not reach the server.')
    } finally {
      setBusy(false)
      load()
    }
  }

  const when = (iso: string | null) => {
    if (!iso) return 'later'
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) }
    catch { return 'later' }
  }

  const blocked = coverage ? !coverage.canRun : false

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        🧭 Librarian
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Scheduled librarian tasks can look through your library by meaning — "find something
        related to this" — but only for books that have been read into an index first. This builds
        that index. It runs once a day and skips anything unchanged.
      </p>

      {coverage && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          <strong>{coverage.embedded}</strong> of <strong>{coverage.total}</strong> books indexed
          {coverage.outstanding > 0 && (
            <span className="text-amber-600 dark:text-amber-400"> · {coverage.outstanding} to go</span>
          )}
          {coverage.lastEmbeddedAt && (
            <span className="text-gray-400 dark:text-gray-500"> · last {when(coverage.lastEmbeddedAt)}</span>
          )}
        </p>
      )}

      <button
        onClick={run}
        disabled={busy || blocked}
        title={blocked ? `Next available ${when(coverage?.nextAllowedAt ?? null)}` : undefined}
        className="btn btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {busy ? 'Indexing…' : 'Index my library'}
      </button>

      {blocked && !note && (
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Already done today — next available {when(coverage?.nextAllowedAt ?? null)}.
        </p>
      )}
      {note && <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{note}</p>}
    </section>
  )
}
