import { NextRequest, NextResponse } from 'next/server'
import { ingestFeed } from '@/lib/suggest/pipeline'
import { decayWeights } from '@/lib/suggest/feedback'
import {
  feedsDueForPoll, loadInterests, majoritySourceTypes, saveInterestWeights,
  usersWithSubscriptions,
} from '@/lib/suggest/store'

/**
 * The scheduled half of the suggested feed: poll the sources, decay the weights.
 *
 * POST /api/suggest/cron   with header `x-suggest-cron: <SUGGEST_CRON_SECRET>`
 *
 * ── Why this route has to exist at all ────────────────────────────────────
 *
 * Every other /api/suggest route is user-scoped and authenticates with the
 * caller's bearer token. A scheduler holds nobody's token, so it cannot drive
 * any of them — which is why `decayWeights` and the poller shipped as code
 * that nothing could ever call on a timer. The §5 brake existed and was not
 * engaged: learned interest weights never shrank back toward the prior,
 * so every nudge from a click accumulated permanently.
 *
 * ── The asymmetry that shapes it ──────────────────────────────────────────
 *
 * Polling is GLOBAL and decay is PER-USER, and that is not an arbitrary split:
 * `suggest_feeds` and `suggest_items` have no `user_id` because an RSS item is
 * a public document, so polling a feed once serves every subscriber. Interest
 * weights are the private half. So this route polls the catalogue once and
 * then walks the subscriber list.
 *
 * It is also what forced a real bug out into the open. `ingestFeed` used to
 * take the subscriber's own feed tags and write them onto the shared item row,
 * which meant whoever polled first imprinted their private vocabulary on
 * everybody. A global poll has no answer to "whose tags?", which is how the
 * problem became visible; the tags now apply per user at scoring time.
 *
 * ── Auth ──────────────────────────────────────────────────────────────────
 *
 * A shared secret in a header, NOT the service-role key — a scheduler that
 * held the service role key could do anything to any table, and this needs to
 * do two specific things. The comparison is length-then-content so a wrong
 * secret cannot be distinguished by timing in any useful way; the real
 * protection is that the secret is 32 random bytes and the route does nothing
 * an attacker would want.
 *
 * Returns 404 rather than 500 when no secret is configured. A deployment that
 * has not set one has no cron endpoint, and saying "misconfigured" would
 * confirm the path exists to anyone probing.
 */

export const dynamic = 'force-dynamic'

/** Per invocation, so one call cannot run past the request budget. */
const MAX_FEEDS = 40

function authorised(req: NextRequest): boolean {
  const expected = process.env.SUGGEST_CRON_SECRET
  if (!expected) return false
  const given = req.headers.get('x-suggest-cron') ?? ''
  if (given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(req: NextRequest) {
  if (!process.env.SUGGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (!authorised(req)) {
    return NextResponse.json({ error: 'not authorised' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    poll?: boolean; decay?: boolean; minAgeMinutes?: number
  }
  // Both default ON. A cron that silently did half its job because a flag was
  // omitted is worse than one that does more than asked.
  const doPoll = body.poll !== false
  const doDecay = body.decay !== false

  const result: {
    polled: { name: string; status: string; inserted: number }[]
    inserted: number
    decayed: { users: number; weightsMoved: number }
    notes: string[]
  } = { polled: [], inserted: 0, decayed: { users: 0, weightsMoved: 0 }, notes: [] }

  try {
    if (doPoll) {
      const [due, sourceTypes] = await Promise.all([
        feedsDueForPoll(body.minAgeMinutes ?? 30, 200),
        majoritySourceTypes(),
      ])
      /**
       * Only feeds somebody actually subscribes to.
       *
       * `suggest_feeds` rows outlive subscriptions on purpose — they are shared,
       * so unsubscribing never deletes the feed or its items, because other
       * subscribers' dedup depends on them. The consequence, seen on the first
       * global run: a feed whose last subscriber left was still being polled
       * every cycle. That is wasted work and, more to the point, repeatedly
       * fetching a publisher nobody reads is impolite.
       *
       * `majoritySourceTypes` is keyed on ENABLED subscriptions, so its key set
       * is exactly "feeds someone wants", and reusing it avoids a second query.
       */
      const subscribed = due.filter(t => sourceTypes.has(t.feedId))
      const orphans = due.length - subscribed.length
      if (orphans > 0) {
        result.notes.push(
          `skipped ${orphans} feed(s) with no enabled subscriber — kept in the catalogue for shared dedup, but not polled`,
        )
      }

      const targets = subscribed.slice(0, MAX_FEEDS)
      if (subscribed.length > targets.length) {
        // No silent caps. A backlog that never drains is a feed list quietly
        // going stale, and the only way to notice is for it to be reported.
        result.notes.push(
          `${subscribed.length - targets.length} more feed(s) were due — schedule this more often, or raise the per-run cap`,
        )
      }
      // Sequential. Forty concurrent outbound fetches from one Worker is a
      // burst a small publisher notices, and this app shares Cloudflare's
      // egress IPs with everyone else on it.
      for (const target of targets) {
        const r = await ingestFeed(target, { sourceType: sourceTypes.get(target.feedId) })
        result.polled.push({ name: r.url, status: r.status, inserted: r.inserted })
        result.inserted += r.inserted
        for (const n of r.notes) result.notes.push(`${r.url}: ${n}`)
      }
      if (targets.length === 0) result.notes.push('no feed was due a poll')
    }

    if (doDecay) {
      const users = await usersWithSubscriptions()
      for (const userId of users) {
        // Per user, and failures are isolated: one unreadable interest row must
        // not stop every other subscriber's decay.
        try {
          const before = await loadInterests(userId)
          const after = decayWeights(before)
          const byId = new Map(before.map(i => [i.interestId, i]))
          const moved = after.filter(i => {
            const b = byId.get(i.interestId)
            return b && Math.abs(b.weight - i.weight) > 1e-9
          })
          if (moved.length > 0) {
            await saveInterestWeights(userId, moved)
            result.decayed.weightsMoved += moved.length
          }
          result.decayed.users += 1
        } catch (e) {
          result.notes.push(
            `decay failed for one user: ${e instanceof Error ? e.message : 'unknown'}`,
          )
        }
      }
    }

    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'the scheduled run failed', partial: result },
      { status: 500 },
    )
  }
}
