import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { ingestFeed } from '@/lib/suggest/pipeline'
import { feedsDueForPoll, loadFeeds } from '@/lib/suggest/store'

/**
 * Poll the user's enabled feeds and store what is new.
 *
 * POST /api/suggest/poll          — poll the ones that are due
 * POST /api/suggest/poll {all:1}  — poll every enabled feed regardless of age
 *
 * ── Two things this route refuses to hide ─────────────────────────────────
 *
 * **Per-feed results, always.** The response carries one entry per feed with
 * its status, not a total. "Polled 12 feeds, 40 new items" is compatible with
 * three feeds having been dead for a month, and a feed that is quietly
 * contributing nothing is the single most likely reason a digest goes thin.
 *
 * **A minimum age between polls.** Not an optimisation — polling a publisher
 * every time somebody loads a page is how an IP gets blocked, and this app runs
 * on Cloudflare's shared egress (the same reason the music provider is Deezer
 * rather than iTunes). `all=1` overrides it for a deliberate manual refresh,
 * which is a different thing from a page load.
 *
 * Feeds are polled sequentially, not with Promise.all. Forty concurrent
 * outbound fetches from one Worker invocation is both a burst a small publisher
 * notices and a good way to hit the subrequest limit; the whole point of the
 * conditional-request headers is that the common case is forty cheap 304s.
 */

export const dynamic = 'force-dynamic'

/**
 * The per-invocation ceiling, derived from the Worker subrequest limit rather
 * than picked.
 *
 * It was a flat 25, which is not a budget — it is a feed count that happens to
 * be under a limit nobody had counted against. A Cloudflare Worker gets 50
 * subrequests per invocation, and each feed costs FOUR of them: the outbound
 * fetch, the duplicate-check SELECT and the upsert inside `insertItems`, and
 * the `recordPoll` write. So 25 feeds is 100 subrequests and cannot succeed;
 * it only ever looked fine because polling was gated on the 30-minute floor
 * and rarely had more than a feed or two to do. A manual refresh with `all=1`
 * reached every feed at once and failed with `Too many subrequests by single
 * Worker invocation` — on whichever query came next, which made it read as a
 * database fault rather than a budget one.
 *
 * The remainder of the 50 is left for this route's own reads and for the
 * row-by-row fallback in `insertItems`, which is unbounded by design and fires
 * on a duplicate race.
 *
 * `remaining` goes in the response so the caller can finish the job in another
 * call. It is a NUMBER and not only the sentence in `notes`: the client loops
 * on it, and a client that had to parse "3 more feeds are due" would break the
 * next time that sentence was reworded.
 */
const WORKER_SUBREQUEST_LIMIT = 50
const SUBREQUESTS_PER_FEED = 4
const RESERVED_SUBREQUESTS = 14
const MAX_FEEDS_PER_CALL = Math.floor(
  (WORKER_SUBREQUEST_LIMIT - RESERVED_SUBREQUESTS) / SUBREQUESTS_PER_FEED,
)

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { all?: boolean | number; minAgeMinutes?: number }
  const all = body.all === true || body.all === 1

  try {
    const subscribed = await loadFeeds(userId, true)
    if (subscribed.length === 0) {
      return NextResponse.json({
        polled: [],
        reason: 'no feeds are enabled — nothing to poll',
      })
    }

    const mine = new Set(subscribed.map(f => f.feedId))
    // Scoped to this user's own subscriptions even though the feed table is
    // shared. A route that polled every feed in the catalogue would let one
    // user's request do work on behalf of everybody, which is a quiet way to
    // turn a page load into a crawl of the whole subscriber base.
    const due = all
      ? subscribed.map(f => ({
          feedId: f.feedId, url: f.url, etag: null, lastModified: null, consecutiveFailures: 0,
        }))
      : (await feedsDueForPoll(body.minAgeMinutes ?? 30, 200)).filter(t => mine.has(t.feedId))

    const targets = due.slice(0, MAX_FEEDS_PER_CALL)
    const notes: string[] = []
    if (due.length > targets.length) {
      notes.push(`${due.length - targets.length} more feed${due.length - targets.length === 1 ? ' is' : 's are'} due — call again to continue`)
    }
    if (!all && due.length === 0) {
      notes.push(`all ${subscribed.length} feeds were polled recently; pass {"all":1} to force a refresh`)
    }

    const byId = new Map(subscribed.map(f => [f.feedId, f]))
    const polled = []
    for (const target of targets) {
      const feed = byId.get(target.feedId)
      // ingestFeed never throws for a network or parse problem — it records the
      // failure and returns a status — so one bad publisher cannot end the loop.
      // No feedTags: those are this user's annotation and the item rows are
      // shared. They are applied per user at scoring time instead.
      const result = await ingestFeed(target, { sourceType: feed?.sourceType })
      polled.push({ ...result, name: feed?.name ?? result.url })
    }

    const failing = subscribed.filter(f => {
      const t = due.find(d => d.feedId === f.feedId)
      return (t?.consecutiveFailures ?? 0) >= 3
    })
    for (const f of failing) {
      notes.push(`${f.name} has failed its last ${due.find(d => d.feedId === f.feedId)?.consecutiveFailures} polls`)
    }

    return NextResponse.json({
      polled,
      inserted: polled.reduce((n, p) => n + p.inserted, 0),
      // How many were due and did not fit, for a caller that wants to continue.
      // See the note on MAX_FEEDS_PER_CALL: this is the machine-readable half
      // of the sentence already in `notes`.
      remaining: due.length - targets.length,
      notes,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not poll the feeds' },
      { status: 500 },
    )
  }
}
