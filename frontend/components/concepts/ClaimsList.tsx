'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Undo2 } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * What you have claimed to know, and the way to take it back.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * Claiming had a button and withdrawing had none. `GET /api/learn/claims` and
 * `DELETE /api/learn/claims?conceptId=` were both written, tested and reachable,
 * and nothing in the app called either — so a claim could only ever end one
 * way, by getting a problem wrong. A learner could assert something and then
 * neither see that they had nor change their mind.
 *
 * That was survivable while a claim was one press for one concept. It stopped
 * being survivable when the chain claim landed: one press now files a row for
 * every teachable concept beneath the one you picked — thirteen for
 * `partial-fractions-quadratic`, fifteen for `integration-partial-fractions`.
 * Asserting fifteen things at once with no list and no undo is the asymmetry
 * this closes.
 *
 * ── ACROSS SUBJECTS, NOT THE ONE BEING PRACTISED ──────────────────────────
 *
 * `?subject=all`, deliberately. A chain claim files each row under the
 * concept's OWN subject, because a claim only opens its own concept and has to
 * be loaded by whichever subject is being practised. So the rows from one press
 * are spread over two or three subjects, and a list scoped to the current one
 * would show a third of them with no route to the rest — under-reporting the
 * very thing it exists to show. The subject is therefore printed per row rather
 * than assumed.
 *
 * ── A withdrawal is not a failure, and the three states are not ranked ────
 *
 * `live` is an open assertion: the concept's problems are available and nothing
 * has settled it yet. `verified` means it was backed up by unaided correct
 * answers. `revoked` covers both an unaided wrong answer and a withdrawal by
 * hand, and the row prints the stored reason rather than inventing one, because
 * "you withdrew this" and "you got one wrong" are different facts about the
 * learner and flattening them would lose the more useful half.
 *
 * Only a live claim can be withdrawn. Withdrawing a verified one would be
 * asking to un-know something, and withdrawing an already-revoked one is a
 * no-op the route would accept and the list would then misreport.
 */

export interface ClaimRow {
  id: string
  subjectId: string
  conceptId: string
  conceptName: string
  claimedAt: string
  note: string | null
  verifiedAt: string | null
  revokedAt: string | null
  revokedReason: string | null
  live: boolean
}

export default function ClaimsList({
  subjectNames,
  onChanged,
}: {
  /** Display names per subject id, so a row can say where its concept lives. */
  subjectNames?: Record<string, string>
  /**
   * Called after a successful withdrawal.
   *
   * Withdrawing closes a concept that was open, which changes what the practice
   * set may contain — so the session has to be reloaded or the next set would
   * be assembled against a claim that no longer exists.
   */
  onChanged?: () => void
}) {
  const [claims, setClaims] = useState<ClaimRow[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await authedFetch('/api/learn/claims?subject=all')
      const d = await res.json()
      if (d.error) { setError(d.error); setClaims([]); return }
      setClaims((d.claims ?? []) as ClaimRow[])
      setError('')
    } catch {
      setError('could not load your claims')
      setClaims([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const withdraw = useCallback(async (row: ClaimRow) => {
    setBusy(row.conceptId)
    setError('')
    try {
      const res = await authedFetch(
        `/api/learn/claims?conceptId=${encodeURIComponent(row.conceptId)}`,
        { method: 'DELETE' },
      )
      const d = await res.json().catch(() => ({}))
      if (d.error) { setError(d.error); return }
      // Re-read rather than patching in place: the withdrawal writes a reason
      // and a timestamp the server owns, and guessing them here would show the
      // learner a row that does not match what was stored.
      await load()
      onChanged?.()
    } catch {
      setError(`could not withdraw ${row.conceptName}`)
    } finally {
      setBusy(null)
    }
  }, [load, onChanged])

  if (claims === null) {
    return (
      <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <Loader2 size={11} className="animate-spin" /> Loading your claims…
      </p>
    )
  }

  const live = claims.filter(c => c.live)
  const settled = claims.filter(c => !c.live)

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
          What you have claimed to know
        </h3>
        {claims.length > 0 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {live.length} open{settled.length > 0 && `, ${settled.length} settled`}
          </span>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}

      {claims.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          Nothing claimed. Selecting a concept in the graph above offers “I already know this”,
          which opens its problems straight away — it does not mark you as knowing it.
        </p>
      ) : (
        <ul className="space-y-1">
          {[...live, ...settled].map(row => (
            <li
              key={row.id}
              className="flex items-start gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700/40"
            >
              <div className="min-w-0 flex-1">
                <span className={`block truncate text-xs ${
                  row.live
                    ? 'font-medium text-gray-800 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 line-through'
                }`}>
                  {row.conceptName}
                </span>
                <span className="block text-[10px] leading-snug text-gray-400 dark:text-gray-500">
                  {subjectNames?.[row.subjectId] ?? row.subjectId}
                  {row.verifiedAt && ' · backed up by your answers'}
                  {/* The stored reason, never a summary of it — a withdrawal and
                      a wrong answer are different facts and the row says which. */}
                  {row.revokedAt && ` · ${row.revokedReason ?? 'withdrawn'}`}
                </span>
              </div>
              {row.live && (
                <button
                  onClick={() => withdraw(row)}
                  disabled={busy === row.conceptId}
                  title={`Withdraw your claim on ${row.conceptName}. Its problems close again unless something else opens them.`}
                  className="flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-300 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  {busy === row.conceptId
                    ? <Loader2 size={10} className="animate-spin" />
                    : <Undo2 size={10} />}
                  Withdraw
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
