import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { adoptPinned, buildDigest, ingestFeed } from '@/lib/suggest/pipeline'
import { decayByElapsed, MIN_DECAY_INTERVAL_MS } from '@/lib/suggest/feedback'
import {
  feedsDueForPoll, loadFeeds, loadInterests, loadSettings,
  saveInterestWeights, stampMaintenance,
} from '@/lib/suggest/store'

/**
 * Keep the feed current, triggered by somebody looking at it.
 *
 * POST /api/suggest/maintain   (ordinary user auth — no shared secret)
 *
 * ── Why a page visit is the right trigger ─────────────────────────────────
 *
 * The upkeep is three jobs: poll the sources, decay the learned weights, and
 * rebuild the digest when it is stale. A scheduler would do all three on a
 * clock, which means doing them for people who are not there — polling feeds
 * nobody will read, and building digests nobody opens. A visit does the work
 * exactly when the result is about to be used, needs no infrastructure, and
 * needs no secret because there is a real user on the request.
 *
 * It also settles a question a cron could not. A built digest enters the
 * novelty history and the next window's duplicate rate, so building weekly
 * regardless of attendance would make next week's novelty measured against
 * items nobody ever saw. Building on arrival cannot have that problem.
 *
 * ── The three gates ───────────────────────────────────────────────────────
 *
 * Every job is gated on elapsed time, so this is cheap to call on every page
 * load and correct when called at any frequency:
 *
 *   poll   — `feedsDueForPoll`'s age floor. A feed polled in the last 30
 *            minutes is not polled again, so the common case is one query and
 *            zero fetches.
 *   decay  — `decayByElapsed`, which derives the fraction from the interval
 *            since `decayed_at`. THIS IS THE LOAD-BEARING ONE: decay is
 *            defined per unit of time, and applying a fixed fraction per call
 *            would make a daily visitor decay seven times faster than a weekly
 *            one. The elapsed-time form is independent of visit frequency.
 *   digest — rebuilt only when the stored one is older than STALE_AFTER_MS.
 *
 * ── It never throws a visitor's page away ─────────────────────────────────
 *
 * Each job is caught separately and reported in `errors`. This is called from
 * a component mount; a feed publisher's expired certificate must not surface
 * as a broken home page, and one failing job must not stop the other two.
 */

export const dynamic = 'force-dynamic'

/** A digest older than this is rebuilt on the next visit. */
const STALE_AFTER_MS = 12 * 3_600_000

/**
 * Feeds polled per visit.
 *
 * Small on purpose, unlike the cron route's 40. This runs while somebody is
 * waiting — not for the response, which the client does not await, but the
 * Worker invocation still has a budget. A backlog drains over successive
 * visits, and `pending` says how much is left rather than letting it look done.
 */
const MAX_FEEDS_PER_VISIT = 8

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const now = new Date().toISOString()
  const did: string[] = []
  const errors: string[] = []
  let pending = 0

  const body = await req.json().catch(() => ({})) as {
    /**
     * The caller's pinned feeds, so the digest can adopt them.
     *
     * Sent on every visit because the list lives in localStorage and the server
     * has never seen it. Adoption is opt-OUT: anything here with no
     * subscription row is added, and anything with a row — on OR deliberately
     * off — is left exactly as it is.
     */
    pinned?: { url?: string; label?: string }[]
  }

  // ── adopt ───────────────────────────────────────────────────────────────
  //
  // FIRST, before the poll, so a feed adopted on this visit is polled on this
  // visit rather than the next one. Otherwise somebody turning a feed on would
  // see nothing from it until they reloaded, which reads as the toggle not
  // working.
  if (body.pinned && body.pinned.length > 0) {
    try {
      const r = await adoptPinned(userId, body.pinned)
      if (r.added.length > 0) {
        did.push(`added ${r.added.length} feed(s) from your feed list: ${r.added.map(a => a.name).join(', ')}`)
      }
      // Skipped sources are reported, not swallowed. The pinned list
      // legitimately contains things the digest cannot score.
      for (const s of r.skipped) did.push(`cannot use ${s.url}: ${s.reason}`)
    } catch (e) {
      errors.push(`adopt: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  let settings
  try {
    settings = await loadSettings(userId)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the feed settings' },
      { status: 500 },
    )
  }

  // ── poll ────────────────────────────────────────────────────────────────
  let inserted = 0
  try {
    const subscribed = await loadFeeds(userId, true)
    if (subscribed.length > 0) {
      const mine = new Map(subscribed.map(f => [f.feedId, f]))
      // Scoped to this user's own subscriptions. A visit must not do work on
      // behalf of the whole subscriber base — that would turn one page load
      // into a crawl of every feed in the catalogue.
      const due = (await feedsDueForPoll(30, 200)).filter(t => mine.has(t.feedId))
      const targets = due.slice(0, MAX_FEEDS_PER_VISIT)
      pending = due.length - targets.length
      for (const target of targets) {
        const r = await ingestFeed(target, { sourceType: mine.get(target.feedId)?.sourceType })
        inserted += r.inserted
      }
      if (targets.length > 0) {
        did.push(`polled ${targets.length} feed(s), ${inserted} new item(s)`)
      }
    }
  } catch (e) {
    errors.push(`poll: ${e instanceof Error ? e.message : 'failed'}`)
  }

  // ── decay ───────────────────────────────────────────────────────────────
  try {
    const before = await loadInterests(userId)
    const { interests: after, ran, elapsedMs } = decayByElapsed(before, settings.decayedAt, now)
    if (ran) {
      const byId = new Map(before.map(i => [i.interestId, i]))
      const moved = after.filter(i => {
        const b = byId.get(i.interestId)
        return b && Math.abs(b.weight - i.weight) > 1e-9
      })
      if (moved.length > 0) await saveInterestWeights(userId, moved)
      // Stamped even when nothing moved — otherwise a user whose every weight
      // is explicit would re-run the whole calculation on every single visit
      // forever, because `decayed_at` would never advance.
      await stampMaintenance(userId, { decayedAt: now })
      did.push(
        `decayed ${moved.length} learned weight(s) over ${(elapsedMs / 86_400_000).toFixed(1)} day(s)`,
      )
    }
  } catch (e) {
    errors.push(`decay: ${e instanceof Error ? e.message : 'failed'}`)
  }

  // ── digest ──────────────────────────────────────────────────────────────
  try {
    const builtMs = settings.digestBuiltAt ? Date.parse(settings.digestBuiltAt) : NaN
    const stale = !Number.isFinite(builtMs) || Date.now() - builtMs > STALE_AFTER_MS
    // Rebuilt only if something could actually have changed it. A stale digest
    // with no new items and no moved weights would rebuild to the same thing,
    // and storing that would advance the novelty history for nothing.
    const worthIt = inserted > 0 || !Number.isFinite(builtMs)
    if (stale && worthIt) {
      const { digest, digestId } = await buildDigest(userId, { persist: true })
      if (digestId) {
        await stampMaintenance(userId, { digestBuiltAt: now })
        did.push(`rebuilt the digest — ${digest.items.length} item(s)`)
      }
    }
  } catch (e) {
    errors.push(`digest: ${e instanceof Error ? e.message : 'failed'}`)
  }

  return NextResponse.json({
    // Empty is the normal, expected answer: everything was recently done.
    did,
    pending,
    errors,
    nextDecayAfter: new Date(
      (settings.decayedAt ? Date.parse(settings.decayedAt) : Date.now()) + MIN_DECAY_INTERVAL_MS,
    ).toISOString(),
  })
}
