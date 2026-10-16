'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Sigma } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * Maths practice, on the front page.
 *
 * ── WHY THIS EXISTS AT ALL ────────────────────────────────────────────────
 *
 * /learn worked and nothing linked to it. Not "was hard to find" — there was no
 * href="/learn" and no router.push('/learn') anywhere in app/ or components/, so
 * the only way to reach a working verifier, review queue and five-tab practice
 * page was to type the URL. /play has three entry points; this had none.
 *
 * Same lesson CorrelationGamesSection's own header records about being a pill in
 * the nav: a feature nobody can navigate to is a feature nobody has.
 *
 * ── SIGNED OUT, IT RENDERS NOTHING ────────────────────────────────────────
 *
 * Deliberately unlike the games strip, which shows to anonymous visitors because
 * /play makes an anonymous session on load. /learn does not: every route under
 * /api/learn answers 401 without a user, and the page turns that into an error
 * banner. Advertising it to someone who would land on an error is worse than not
 * advertising it, so this returns null until there is a session. If /learn ever
 * grows an anonymous mode, drop the guard.
 *
 * ── WHAT IT SHOWS ─────────────────────────────────────────────────────────
 *
 * The subject, how many points are ready now, and the review badge. Not a task
 * preview: the first question would be answerable from the strip, and answering
 * it anywhere other than the practice panel bypasses the assistance record and
 * the timing that every ruling is stored with.
 */
interface SessionPeek {
  subject?: { name: string; covers: string }
  verifier?: { configured: boolean }
  awaitingReview?: number
  tasks?: unknown[]
  blocked?: unknown[]
  error?: string
}

export default function MathPracticeSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean | null
}) {
  const [peek, setPeek] = useState<SessionPeek | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setLoading(true)
    // size=1 rather than the page's 8. This strip reports counts, and assembling
    // eight tasks costs the scheduler work whose result is then thrown away.
    authedFetch('/api/learn/session?size=1')
      .then(r => r.json())
      .then((d: SessionPeek) => { if (!cancelled) setPeek(d) })
      .catch(() => { if (!cancelled) setPeek({ error: 'unavailable' }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  const ready = peek?.tasks?.length ?? 0
  const blocked = peek?.blocked?.length ?? 0
  const review = peek?.awaitingReview ?? 0
  const broken = peek?.error || (peek?.verifier && !peek.verifier.configured)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        {/* Icon and words are one Link, so the hover is a single target and the
            heading is the thing people aim at — the same fix the correlation
            games heading needed. */}
        <Link href="/learn" className="group flex items-center gap-2">
          <Sigma size={16} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
            Maths practice
          </h2>
        </Link>
        {review > 0 && (
          <Link
            href="/learn"
            className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
            title="Rulings the engine could not settle, waiting for you to adjudicate"
          >
            {review} to review
          </Link>
        )}
        <Link href="/learn" className="ml-auto flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          Practice <ArrowRight size={12} />
        </Link>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-2xl leading-relaxed">
        {peek?.subject
          ? peek.subject.covers
          : 'Work problems and have the answer checked symbolically rather than compared to a string.'}
      </p>

      {loading && (
        <p className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={12} className="animate-spin" /> checking what is due…
        </p>
      )}

      {/* An engine that cannot settle anything should say so here rather than let
          someone discover it mid-problem. The practice page makes the same
          distinction between "no worker" and "wrong answer". */}
      {!loading && broken && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Practice is unavailable right now — answers cannot be checked, so nothing
          would be recorded.
        </p>
      )}

      {!loading && !broken && peek && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
          <span>
            <span className="font-medium">{ready}</span> ready now
          </span>
          {blocked > 0 && (
            <span
              className="text-gray-400 dark:text-gray-500"
              title="Resting on something not yet strong enough — mastery-learning gate, not a lock you can skip"
            >
              {blocked} waiting on prerequisites
            </span>
          )}
          {peek.subject && (
            <span className="text-gray-400 dark:text-gray-500">{peek.subject.name}</span>
          )}
        </div>
      )}
    </div>
  )
}
