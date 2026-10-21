'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import DigestList, { DigestItem } from './DigestList'

/**
 * The suggested feed, on the front page.
 *
 * ── It sits BESIDE "My Feeds" rather than replacing it ────────────────────
 *
 * Deliberate, and the distinction is worth keeping: a pinned feed is a
 * BOOKMARK — a source you want to glance at, stored in localStorage, working
 * signed out. The digest is CURATION — a balanced twenty picked out of
 * everything collected, which needs history, dedup and feedback and therefore
 * a database. The feeds you browse and the feeds you want curated are not the
 * same list, so both exist and neither was migrated into the other.
 *
 * ── It never builds a digest on page load ─────────────────────────────────
 *
 * Reads the stored one only. Building has consequences — a stored digest enters
 * the novelty history and the next window's duplicate rate — so a page view
 * must not trigger one, or simply visiting the home page twice would make the
 * second digest look stale to itself. Building is an action on /suggest.
 *
 * ── Signed out it renders nothing ─────────────────────────────────────────
 *
 * Same reasoning as MathPracticeSection: every /api/suggest route answers 401
 * without a user, so advertising this to someone who would land on an error is
 * worse than not advertising it.
 */
interface DigestPeek {
  digest?: {
    digestId?: string
    generatedAt?: string
    items?: DigestItem[]
  } | null
  reason?: string
  error?: string
}

export default function SuggestedFeedSection({
  isAuthenticated,
}: {
  isAuthenticated: boolean | null
}) {
  const [peek, setPeek] = useState<DigestPeek | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setLoading(true)
    // No ?build=1. See the header — a page view must not create a digest.
    authedFetch('/api/suggest/digest')
      .then(r => r.json())
      .then((d: DigestPeek) => { if (!cancelled) setPeek(d) })
      .catch(() => { if (!cancelled) setPeek({ error: 'unavailable' }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  const items = peek?.digest?.items ?? []
  const mix = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.bucket] = (acc[i.bucket] ?? 0) + 1
    return acc
  }, {})
  const standIns = items.filter(i => i.backfilled).length

  return (
    <div className="mb-8">
      <div className="mb-1 flex items-center gap-2">
        <Link href="/suggest" className="group flex items-center gap-2">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
            Suggested
          </h2>
        </Link>
        <Link
          href="/suggest"
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Open <ArrowRight size={12} />
        </Link>
      </div>

      <p className="mb-3 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        A balanced set from your sources — core interests, two kinds of discovery,
        background, and local. Every item can say why it is here.
      </p>

      {loading && (
        <p className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={12} className="animate-spin" /> loading your digest…
        </p>
      )}

      {!loading && peek?.error && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          The suggested feed is unavailable right now.
        </p>
      )}

      {/* "Never generated" is distinguished from "generated and empty". The two
          look identical in a list of zero items and have different fixes. */}
      {!loading && !peek?.error && !peek?.digest && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No digest yet.{' '}
          <Link href="/suggest" className="text-sky-600 hover:underline dark:text-sky-400">
            Add some sources and build one
          </Link>
          .
        </p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{items.length}</span> items
            </span>
            {Object.entries(mix).map(([bucket, n]) => (
              <span key={bucket} className="text-gray-400 dark:text-gray-500">
                {n} {bucket}
              </span>
            ))}
            {/* Surfaced on the strip, not just in the detail view: a mix that
                looks balanced but is a third stand-ins is not balanced. */}
            {standIns > 0 && (
              <span
                className="text-gray-400 dark:text-gray-500"
                title="Slots with no qualifying candidate, filled from the leftover pool"
              >
                {standIns} stand-in{standIns === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {/* compact: no feedback controls here. Rating belongs next to the
              full item with its summary and its reasons, not in a strip where
              the only visible thing is a headline. */}
          <DigestList items={items} compact limit={5} />
          {items.length > 5 && (
            <Link
              href="/suggest"
              className="mt-2 inline-block text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              {items.length - 5} more →
            </Link>
          )}
        </>
      )}
    </div>
  )
}
