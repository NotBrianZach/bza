'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { timeAgo } from '@/lib/timeAgo'
import DigestList, { DigestItem } from './DigestList'
import { getPinnedFeeds } from '@/lib/pinnedFeeds'

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
 * ── A visit is what keeps the feed current ────────────────────────────────
 *
 * There is no scheduler, deliberately. This mounts, reads the stored digest,
 * and then fires `/api/suggest/maintain` — which polls any feed due a poll,
 * decays the learned weights by the elapsed interval, and rebuilds the digest
 * if it has gone stale AND new items arrived. Every one of those is gated on
 * elapsed time, so calling it on every page load is cheap and calling it at any
 * frequency is correct.
 *
 * Doing the upkeep on arrival rather than on a clock is not a shortcut, and it
 * settles something a cron could not: a stored digest enters the novelty
 * history and the next window's duplicate rate, so building weekly regardless
 * of attendance would make next week's novelty measured against items nobody
 * ever saw. Building when somebody turns up cannot have that problem.
 *
 * The maintenance call is NOT awaited before rendering and its result is not
 * shown. The strip paints from the stored digest immediately; if maintenance
 * changed anything, the user sees it next time. A reading app's home page must
 * not wait on four RSS publishers.
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
    /** Null from a preview build, which stores nothing and so has no stamp. */
    generatedAt?: string | null
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
  /**
   * How much of the digest the triage has taken out, reported by the list.
   *
   * Held here because the summary line above the list is this component's, and
   * it must not keep counting items the list has stopped showing — "20 items"
   * over a strip of five that are all new, with twelve already marked seen, is
   * the kind of number that makes a user distrust the rest of the panel.
   */
  const [seen, setSeen] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const onTriage = useCallback((hidden: number, left: number) => {
    setSeen(hidden)
    setRemaining(left)
  }, [])
  /** Which half of the refresh is running, so the label can say which. */
  const [busy, setBusy] = useState<null | 'fetching' | 'building'>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setLoading(true)
    // No ?build=1 here: the strip renders the STORED digest so it paints at
    // once. Building, if it is needed, is maintenance's job below.
    authedFetch('/api/suggest/digest')
      .then(r => r.json())
      .then((d: DigestPeek) => { if (!cancelled) setPeek(d) })
      .catch(() => { if (!cancelled) setPeek({ error: 'unavailable' }) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  /**
   * Upkeep, fired after mount and deliberately ignored.
   *
   * Not awaited, not rendered, and its failure is swallowed — a separate effect
   * from the read above so that a slow publisher cannot delay the strip, and so
   * that `cancelled` on the read does not abort it. The route itself reports
   * per-job errors; nothing here needs them, because every job is idempotent
   * and the next visit retries.
   *
   * `.catch(() => {})` rather than no catch at all: an unhandled rejection in a
   * mount effect is a console error on a page that is working fine.
   */
  useEffect(() => {
    if (!isAuthenticated) return
    /**
     * The pinned list goes with it, because adoption is opt-OUT.
     *
     * Your feeds are in the digest without you doing anything; the server adds
     * a subscription for any pinned feed it has no row for, and leaves alone
     * every feed you have already decided about — including the ones you turned
     * off. The list has to be sent because it lives in localStorage and the
     * server has never seen it.
     */
    authedFetch('/api/suggest/maintain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pinned: getPinnedFeeds().map(f => ({ url: f.url, label: f.label })),
      }),
    }).catch(() => {})
  }, [isAuthenticated])

  // Derived above `refresh` and above the signed-out return, because `refresh`
  // closes over `items` to work out what the rebuild actually changed.
  const items = peek?.digest?.items ?? []
  const mix = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.bucket] = (acc[i.bucket] ?? 0) + 1
    return acc
  }, {})
  const standIns = items.filter(i => i.backfilled).length

  /**
   * Refresh on demand: fetch what the publishers have, then rebuild.
   *
   * ── Why both halves, in that order ───────────────────────────────────────
   *
   * Rebuilding alone re-ranks the same corpus, so a user who pressed a button
   * called "refresh" and got the same twenty items back would be right to call
   * it broken. Fetching alone changes nothing visible, because the strip paints
   * the STORED digest. The two steps are the operation; /suggest keeps them as
   * separate buttons because there you are tuning, but the home page is not the
   * place to learn the difference between an item store and a ranking.
   *
   * Two requests rather than one combined route, deliberately. Polling up to 25
   * feeds sequentially and then running the whole pipeline is comfortably more
   * than one Worker invocation should promise, and keeping them apart also
   * means a publisher timing out still gets you a rebuild.
   *
   * ── `all: 1` ─────────────────────────────────────────────────────────────
   *
   * Forced, past the 30-minute floor, which the poll route explicitly permits
   * for "a deliberate manual refresh, which is a different thing from a page
   * load". The floor exists so that page views do not hammer publishers from
   * Cloudflare's shared egress; a button somebody pressed is not a page view.
   * It is also why this is a button and not something the mount effect does.
   *
   * ── What it reports ──────────────────────────────────────────────────────
   *
   * The outcome, including the outcome "nothing changed". A refresh that found
   * no new items and re-ranked to the same list must SAY so — that is the one
   * result the user cannot distinguish from a broken button, and it is a
   * perfectly normal thing to happen twenty minutes after the last refresh.
   */
  async function refresh() {
    setBusy('fetching')
    setResult(null)
    const parts: string[] = []
    try {
      try {
        const res = await authedFetch('/api/suggest/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: 1 }),
        })
        const d = await res.json() as {
          polled?: { ok: boolean }[]; inserted?: number; reason?: string; error?: string
        }
        if (d.error) {
          parts.push(`could not fetch: ${d.error}`)
        } else if (d.reason) {
          // The only `reason` this route returns is "no feeds are enabled", and
          // the rebuild below reports that as a blocker in a form that names the
          // fix. Saying it twice in one line is worse than saying it once well,
          // so this branch deliberately adds nothing.
        } else {
          const inserted = d.inserted ?? 0
          parts.push(inserted === 0 ? 'no new items' : `${inserted} new item${inserted === 1 ? '' : 's'}`)
          // Per-feed failures counted, not averaged away. `ok` is a flag on the
          // result for exactly this — the status strings are prose.
          const failed = (d.polled ?? []).filter(p => !p.ok).length
          if (failed > 0) parts.push(`${failed} feed${failed === 1 ? '' : 's'} failed`)
        }
      } catch {
        parts.push('could not reach the feeds')
      }

      // The rebuild runs even when the fetch failed or found nothing: your
      // interests or weights may have moved since the stored digest was built,
      // and the ranking is the other half of what "refresh" means.
      setBusy('building')
      const before = new Set(items.map(i => i.itemId))
      const res = await authedFetch('/api/suggest/digest?build=1')
      const d = await res.json() as DigestPeek & { blockers?: string[] }
      if (d.error) {
        setResult(`${parts.join(' · ')}${parts.length ? ' · ' : ''}could not rebuild: ${d.error}`)
        return
      }
      setPeek(d)
      const after = d.digest?.items ?? []
      const fresh = after.filter(i => !before.has(i.itemId)).length
      parts.push(
        before.size === 0
          ? `${after.length} picked`
          : fresh > 0
            ? `${fresh} changed in the selection`
            // No new items AND the same count is the only case that is really
            // "nothing moved". A digest that came back shorter with nothing new
            // in it did change, and saying otherwise would hide a thinning feed
            // behind a reassuring sentence.
            : after.length === before.size
              ? 'the same selection came back'
              : `the selection is now ${after.length}, down from ${before.size}`,
      )
      // Blockers are the "you have not set this up" reasons, which are the ones
      // worth repeating here — an empty rebuild otherwise looks like a failure.
      if (d.blockers && d.blockers.length > 0) parts.push(d.blockers[0])
      setResult(parts.join(' · '))
    } catch {
      setResult(`${parts.join(' · ')}${parts.length ? ' · ' : ''}the rebuild failed`)
    } finally {
      setBusy(null)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="mb-8">
      <div className="mb-1 flex items-center gap-2">
        <Link href="/suggest" className="group flex items-center gap-2">
          <Sparkles size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
            Suggested
          </h2>
        </Link>
        {/* Refresh sits in the header, next to Open, because it acts on the
            whole section rather than on any row. Enabled even with no stored
            digest — "no digest yet" is one of the states it fixes. */}
        <button
          onClick={refresh}
          disabled={!!busy || loading}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-60 dark:text-gray-500 dark:hover:text-gray-300"
          title="Fetch what your feeds have published, then rebuild and save the digest"
        >
          {busy
            ? <Loader2 size={12} className="animate-spin" />
            : <RefreshCw size={12} />}
          {/* Named steps, not a generic spinner. Polling a dozen publishers
              takes seconds, and "fetching…" is the difference between a slow
              button and a stuck one. */}
          {busy === 'fetching' ? 'fetching…' : busy === 'building' ? 'rebuilding…' : 'Refresh'}
        </button>
        <Link
          href="/suggest"
          className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Open <ArrowRight size={12} />
        </Link>
      </div>

      {/* The tagline, then what it means. In that order on purpose: the
          distinctive thing about this feed is not that it is balanced, it is
          that the weights are yours and every item will tell you which one put
          it there. The second line is the proof of the first. */}
      <p className="mb-3 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-600 dark:text-gray-300">
          Tune your own recommendation algorithm.
        </span>{' '}
        Core interests, two kinds of discovery, background and local — in
        proportions you set. Every item can say why it is here.
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
          No digest yet — press Refresh to build one, or{' '}
          <Link href="/suggest" className="text-sky-600 hover:underline dark:text-sky-400">
            add some sources
          </Link>
          {' '}first.
        </p>
      )}

      {/* What the refresh did, including when the answer is "nothing changed".
          Below the controls and above the list, because it is about the list
          that follows. Kept until the next refresh rather than timed out: a
          message that erases itself is one the user has to catch. */}
      {result && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{result}</p>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {/* `seen > 0` picks the phrasing, and both numbers are set in the
                same callback — so this never shows "0 unread" while the list is
                still reporting. Falling back to `items.length` also keeps the
                line right for the case the triage never fires. */}
            {seen > 0 ? (
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{remaining}</span> unread
                {' of '}{items.length}
              </span>
            ) : (
              <span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{items.length}</span> items
              </span>
            )}
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
            {/* The age, so Refresh is a judgement and not a guess. Pushed to
                the end of the row: it is the least important number here until
                it is large, and then it is the only one that matters. */}
            {peek?.digest?.generatedAt && (
              <span className="ml-auto text-gray-400 dark:text-gray-500">
                built {timeAgo(new Date(peek.digest.generatedAt))}
              </span>
            )}
          </div>
          {/* Reactions ARE here, and that is a reversal of the original call.
              The old reasoning was that rating belongs next to the full item
              with its summary and its reasons. That holds for the judgements
              about a TOPIC — "more like this" wants the summary in front of
              you — but it does not hold for "already saw this", which is a
              judgement about the headline and needs nothing else to make.
              Requiring a trip to /suggest to say it meant the duplicate stayed
              in the strip, which is the one place it is actually in the way.

              So all five are offered, and the cheap one is the point. The
              distinction kept instead is `dismissSeen`: here the strip is a
              queue to work through and a seen item leaves, pulling the next of
              the twenty up into the slot. The full page keeps it, marked. */}
          <DigestList
            items={items}
            compact
            feedback
            dismissSeen
            limit={5}
            digestId={peek?.digest?.digestId ?? null}
            onTriage={onTriage}
          />
          {/* Counted off what is left, not off the digest. The link used to
              promise "15 more" over a queue of three. */}
          {(seen > 0 ? remaining : items.length) > 5 && (
            <Link
              href="/suggest"
              className="mt-2 inline-block text-xs text-sky-600 hover:underline dark:text-sky-400"
            >
              {(seen > 0 ? remaining : items.length) - 5} more →
            </Link>
          )}
        </>
      )}
    </div>
  )
}
