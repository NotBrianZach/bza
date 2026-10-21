import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { canonicalFeedUrl, labelForFeedUrl, parseFeedUrl } from '@/lib/feedSources'
import { canonicalUrl, publisherFromUrl } from '@/lib/suggest/normalize'
import { PSEUDO_SOURCE_TYPE } from '@/lib/suggest/pseudo'
import { loadFeeds, setSubscriptionEnabled, subscribe } from '@/lib/suggest/store'
import type { SourceType } from '@/lib/suggest/types'

/**
 * Adopt the pinned-feed list into the suggested feed, without re-adding anything.
 *
 * POST /api/suggest/adopt { feeds: [{ url, label? }], enable?: string[] }
 * GET  /api/suggest/adopt?urls=<comma-separated>
 *
 * ── Why this takes the list from the CLIENT ───────────────────────────────
 *
 * The pinned feeds live in `localStorage` (lib/pinnedFeeds.ts) and the server
 * has never seen them. That is the right home for them — they are a UI
 * preference, they work signed out, and they need no server — so the only way
 * the server can learn what somebody has pinned is to be told.
 *
 * Which is also why this is not a migration. Nothing is moved: the pinned list
 * stays exactly where it was and keeps working as a bookmark list. This records
 * a SUBSCRIPTION, which is a different fact — "also consider this source when
 * building my digest".
 *
 * ── GET answers "which of these am I already using?" ──────────────────────
 *
 * So the settings page can render a toggle per pinned feed with the right
 * initial state, in one request, without the client having to replicate the
 * canonicalisation rules. `feed://hn` and `feed://hn/top` are the same source
 * and the client must not have to know that.
 */

export const dynamic = 'force-dynamic'

/**
 * The canonical key for any source, whichever shape it is.
 *
 * One function so the GET's "already subscribed?" answer and the POST's write
 * cannot disagree — they would, the first time one of them forgot that
 * `feed://hn/top` collapses.
 */
function keyFor(raw: string): string | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  if (parseFeedUrl(trimmed)) return canonicalFeedUrl(trimmed)
  const url = canonicalUrl(trimmed)
  return /^https?:\/\//i.test(url) ? url : null
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const raw = (req.nextUrl.searchParams.get('urls') ?? '').split(',').filter(Boolean)
  try {
    const subscribed = await loadFeeds(userId, false)
    const byKey = new Map(subscribed.map(f => [f.url, f]))
    return NextResponse.json({
      state: raw.map(r => {
        const key = keyFor(r)
        const hit = key ? byKey.get(key) : undefined
        return {
          url: r,
          key,
          // Null key means this is neither a usable http(s) URL nor a known
          // feed:// source. Reported rather than silently omitted, so the UI
          // can show it greyed with a reason instead of just not listing it.
          usable: !!key,
          subscribed: !!hit,
          enabled: hit?.enabled ?? false,
          feedId: hit?.feedId ?? null,
        }
      }),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not read the subscriptions' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    feeds?: { url?: string; label?: string }[]
    /** Urls to EXCLUDE from the digest. Sets enabled=false and keeps the row. */
    remove?: string[]
    /** Urls to re-include after an exclusion. */
    include?: string[]
  } | null
  if (!body?.feeds && !body?.remove && !body?.include) {
    return NextResponse.json({ error: 'pass feeds to adopt, to remove, or to include' }, { status: 400 })
  }

  const adopted: { url: string; feedId: string; name: string }[] = []
  const already: string[] = []
  const skipped: { url: string; reason: string }[] = []
  const removed: string[] = []
  const included: string[] = []

  try {
    const existing = await loadFeeds(userId, false)
    /**
     * Updated as the loop adopts, not just seeded from the database.
     *
     * Two spellings of one source inside a single request is the normal case,
     * not an edge one: lib/pinnedFeeds ships `feed://hn` and FeedBrowser's
     * presets ship `feed://hn/top`, so anyone who has pinned from both has
     * both in the list they send. Seeding this map once and never adding to it
     * meant the second spelling was reported as newly adopted and its label
     * overwrote the first's — observed live, where "Hacker News" became "HN
     * again".
     *
     * The row itself was never duplicated, because `suggest_feeds.url` is
     * unique and both spellings canonicalise to the same key. That is what
     * made the bug quiet: the data was right and the response and the label
     * were wrong.
     */
    const byKey = new Map(existing.map(f => [f.url, f]))

    for (const entry of body.feeds ?? []) {
      const key = keyFor(entry.url ?? '')
      if (!key) {
        skipped.push({
          url: entry.url ?? '',
          // Named, because the pinned list legitimately contains things the
          // digest cannot score, and "it vanished" is a worse answer than why.
          reason: 'not an http(s) feed URL or a recognised feed:// source',
        })
        continue
      }
      if (byKey.has(key)) { already.push(key); continue }

      const pseudo = parseFeedUrl(key)
      const name = entry.label?.trim()
        || (pseudo ? labelForFeedUrl(key) : null)
        || publisherFromUrl(key)
        || key
      // No validating fetch, for either shape. This is a bulk adopt of feeds
      // the user already reads, so they are known-good by use; and fetching
      // twenty of them inline would make the button take a minute. A dead one
      // surfaces at the next poll, on its own feed row, with its own status.
      const feedId = await subscribe(userId, {
        url: key,
        name,
        language: null,
        label: entry.label?.trim() || null,
        topicTags: [],
        sourceType: (pseudo ? PSEUDO_SOURCE_TYPE : 'specialist') as SourceType,
      })
      adopted.push({ url: key, feedId, name })
      // So a second spelling of this same source later in the list is reported
      // as already-present rather than adopted again — and, more importantly,
      // does not overwrite the label just written.
      byKey.set(key, {
        feedId, url: key, name, language: null, region: null,
        topicTags: [], sourceType: 'specialist', enabled: true, userDesignated: false,
      })
    }

    /**
     * "Remove" sets enabled = false; it does NOT delete the row.
     *
     * Adoption is opt-out, so the auto-adopt on each page visit adds any pinned
     * feed it has no row for. Deleting the row would therefore make this
     * un-toggle itself on the next page load — intermittently, depending on
     * when the user next reloads, which is the worst kind of settings bug.
     *
     * The row IS the record of the decision. `loadFeeds(userId, true)` already
     * excludes a disabled feed from every digest, so nothing it was keeping out
     * gets back in.
     */
    for (const r of body.remove ?? []) {
      const key = keyFor(r)
      const hit = key ? byKey.get(key) : undefined
      if (hit) { await setSubscriptionEnabled(userId, hit.feedId, false); removed.push(key!) }
    }

    for (const r of body.include ?? []) {
      const key = keyFor(r)
      const hit = key ? byKey.get(key) : undefined
      if (hit) { await setSubscriptionEnabled(userId, hit.feedId, true); included.push(key!) }
    }

    return NextResponse.json({ adopted, already, skipped, removed, included })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not adopt those feeds' },
      { status: 500 },
    )
  }
}
