import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { canonicalUrl, publisherFromUrl } from '@/lib/suggest/normalize'
import { parseFeed } from '@/lib/suggest/parse'
import { canonicalFeedUrl, labelForFeedUrl, parseFeedUrl } from '@/lib/feedSources'
import { PSEUDO_SOURCE_TYPE } from '@/lib/suggest/pseudo'
import {
  loadFeeds, loadInterests, loadSettings, saveSettings, subscribe,
  unsubscribe, updateSubscription,
} from '@/lib/suggest/store'
import { DEFAULT_BUCKET_PLAN } from '@/lib/suggest/types'
import { DEFAULT_WEIGHTS } from '@/lib/suggest/score'
import { planWithDiscoveryFloor } from '@/lib/suggest/feedback'
import type { SourceType } from '@/lib/suggest/types'

/**
 * The feed list, the interests, and the settings behind a digest.
 *
 * GET  /api/suggest/sources  — everything the settings page needs
 * POST /api/suggest/sources  — add a feed, or change the weights and plan
 *
 * ── Why the defaults are returned rather than stored ──────────────────────
 *
 * `weights` and `plan` come back as the effective values with a flag saying
 * whether the user set them. Writing the defaults into the row at signup would
 * pin that user to whatever the defaults were on the day they joined, and §3's
 * whole claim is that they are "starting points, not facts about your
 * preferences" — which requires improving them to improve the feed for
 * everybody who never touched a slider.
 *
 * ── Why adding a feed fetches it ──────────────────────────────────────────
 *
 * To get its real title and confirm it parses. A feed list full of hostnames is
 * the thing `onMeta` was added to lib/feedFetcher for, and a URL that turns out
 * not to be a feed should fail when it is added — not silently contribute
 * nothing to every digest afterwards.
 */

export const dynamic = 'force-dynamic'

const SOURCE_TYPES: ReadonlySet<string> = new Set<SourceType>([
  'local_reporting', 'specialist', 'wire', 'primary_source', 'research', 'commentary',
])

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  try {
    const [feeds, interests, settings] = await Promise.all([
      // false: the settings page needs the disabled feeds too. Hiding them
      // there would make a disabled feed look deleted.
      loadFeeds(userId, false),
      loadInterests(userId),
      loadSettings(userId),
    ])

    const plan = planWithDiscoveryFloor(settings.plan ?? DEFAULT_BUCKET_PLAN)
    const requestedPlan = settings.plan ?? DEFAULT_BUCKET_PLAN
    const floorApplied = JSON.stringify(plan) !== JSON.stringify(requestedPlan)

    return NextResponse.json({
      feeds,
      interests,
      weights: settings.weights ?? DEFAULT_WEIGHTS,
      weightsAreDefault: settings.weights === null,
      plan,
      planIsDefault: settings.plan === null,
      /**
       * Whether the discovery floor overrode the requested plan.
       *
       * Told to the client, because it is a case of the system overruling the
       * user. A plan that silently differs from what was set is the kind of
       * thing that erodes trust in every other setting on the page.
       */
      discoveryFloorApplied: floorApplied,
      regions: settings.regions,
      desiredTopics: settings.desiredTopics,
      qualityFloor: settings.qualityFloor,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the sources' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    url?: string
    label?: string; region?: string; topicTags?: string[]
    sourceType?: string; userDesignated?: boolean
    weights?: Record<string, number>; plan?: { bucket: string; slots: number }[]
    regions?: string[]; desiredTopics?: string[]; qualityFloor?: number
  } | null
  if (!body) return NextResponse.json({ error: 'a JSON body is required' }, { status: 400 })

  try {
    // ── settings ──────────────────────────────────────────────────────────
    if (!body.url) {
      const patch: Parameters<typeof saveSettings>[1] = {}
      if (body.weights) patch.weights = body.weights as never
      if (body.plan) patch.plan = body.plan as never
      if (body.regions) patch.regions = body.regions
      if (body.desiredTopics) patch.desiredTopics = body.desiredTopics
      if (typeof body.qualityFloor === 'number') patch.qualityFloor = body.qualityFloor
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'nothing to change — pass a url, or a setting' }, { status: 400 })
      }
      await saveSettings(userId, patch)
      return NextResponse.json({ saved: true })
    }

    // ── a new feed ────────────────────────────────────────────────────────
    //
    // Two shapes. A `feed://` URL names Hacker News, a subreddit or a 4chan
    // board — most of the pinned-feed list is these, so refusing them would
    // make "use my existing feeds" import almost nothing. They need no
    // validating fetch: the grammar either parses or it does not, and
    // `fetchPseudoFeed` is the only thing that could fail, at poll time, where
    // the failure is already recorded on the feed row.
    const pseudo = parseFeedUrl(body.url)
    if (pseudo) {
      const url = canonicalFeedUrl(body.url)
      const feedId = await subscribe(userId, {
        url,
        name: body.label?.trim() || labelForFeedUrl(url) || url,
        language: null,
        label: body.label?.trim() || null,
        region: body.region?.trim() || null,
        topicTags: body.topicTags ?? [],
        // `commentary` by default: all three are aggregators of other people's
        // writing, so an item's own evidence is structurally elsewhere. The
        // user can change it, and an explicit sourceType in the request wins.
        sourceType: (body.sourceType as SourceType) ?? PSEUDO_SOURCE_TYPE,
        userDesignated: body.userDesignated ?? false,
      })
      return NextResponse.json({
        feedId, name: labelForFeedUrl(url), language: null, entryCount: null,
        warnings: [
          'this source has no conditional-request support, so every poll is a full fetch',
        ],
      })
    }

    const url = canonicalUrl(body.url)
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({
        error: 'a source must be an http(s) feed URL, or a feed:// source (feed://hn, feed://reddit/<sub>, feed://4chan/<board>)',
      }, { status: 400 })
    }
    if (body.sourceType && !SOURCE_TYPES.has(body.sourceType)) {
      return NextResponse.json({
        error: `unknown source type "${body.sourceType}" — expected one of ${[...SOURCE_TYPES].join(', ')}`,
      }, { status: 400 })
    }

    let name = body.label?.trim() || ''
    let language: string | null = null
    let entryCount = 0
    const warnings: string[] = []

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'bza-suggest/1.0 (reading companion; +https://aireadalong.com)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`the feed returned HTTP ${res.status}`)
      const doc = parseFeed(await res.text())
      entryCount = doc.entries.length
      // Not a feed at all: REJECTED. An HTML page subscribes happily and then
      // contributes nothing to every digest forever, which is what happened on
      // the first live run when example.com was accepted with a warning.
      if (!doc.isFeedDocument) {
        throw new Error('that URL returned a document with no RSS or Atom root element — it looks like a web page rather than a feed')
      }
      if (entryCount === 0) {
        // A feed that declares itself and is empty is a WARNING, not a
        // rejection: a legitimately empty feed exists, and so does one whose
        // item shape this regex-based reader cannot parse. Both are worth
        // keeping and both are worth saying out loud.
        warnings.push('this is a feed, but it currently contains no entries — it may be empty, or use an item shape this reader does not parse')
      }
      if (!name) name = doc.feedTitle ?? ''
      language = doc.language
    } catch (e) {
      clearTimeout(timer)
      return NextResponse.json({
        error: e instanceof Error && e.name === 'AbortError'
          ? 'the feed did not respond within 10 seconds'
          : `could not read that feed: ${e instanceof Error ? e.message : 'unknown error'}`,
      }, { status: 400 })
    } finally {
      clearTimeout(timer)
    }

    // Hostname last. A feed list of hostnames is unreadable once it has four
    // YouTube channels in it.
    if (!name) name = publisherFromUrl(url) || url

    const feedId = await subscribe(userId, {
      url,
      name,
      language,
      label: body.label?.trim() || null,
      region: body.region?.trim() || null,
      topicTags: body.topicTags ?? [],
      sourceType: (body.sourceType as SourceType) ?? 'specialist',
      userDesignated: body.userDesignated ?? false,
    })

    return NextResponse.json({ feedId, name, language, entryCount, warnings })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not save that source' },
      { status: 500 },
    )
  }
}

/**
 * Change a subscription: enable, disable, retag, or designate it.
 *
 * PATCH /api/suggest/sources { feedId, enabled?, label?, region?, topicTags?, sourceType?, userDesignated? }
 *
 * This route existed in the schema before it existed in the API. `enabled`,
 * `source_type` and `user_designated` are all columns the pipeline reads and
 * nothing could write — so a feed could be added and never turned off, and the
 * source type guessed at creation time was permanent. Found by walking the
 * live surface rather than the code.
 */
export async function PATCH(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    feedId?: string; enabled?: boolean; label?: string | null; region?: string | null
    topicTags?: string[]; sourceType?: string; userDesignated?: boolean
  } | null

  const feedId = body?.feedId?.trim()
  if (!feedId) return NextResponse.json({ error: 'feedId is required' }, { status: 400 })
  if (body?.sourceType && !SOURCE_TYPES.has(body.sourceType)) {
    return NextResponse.json({
      error: `unknown source type "${body.sourceType}" — expected one of ${[...SOURCE_TYPES].join(', ')}`,
    }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body?.enabled === 'boolean') patch.enabled = body.enabled
  if ('label' in (body ?? {})) patch.label = body?.label?.trim() || null
  if ('region' in (body ?? {})) patch.region = body?.region?.trim() || null
  if (body?.topicTags) patch.topic_tags = body.topicTags
  if (body?.sourceType) patch.source_type = body.sourceType
  if (typeof body?.userDesignated === 'boolean') patch.user_designated = body.userDesignated
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing to change' }, { status: 400 })
  }

  try {
    await updateSubscription(userId, feedId, patch)
    return NextResponse.json({ saved: true, changed: Object.keys(patch) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not change that source' },
      { status: 500 },
    )
  }
}

/**
 * Unsubscribe.
 *
 * DELETE /api/suggest/sources?feedId=…
 *
 * Deletes the SUBSCRIPTION, never the shared feed row and never the items. The
 * feed may have other subscribers, and the items are the shared corpus that
 * other people's dedup and clustering depend on — deleting them because one
 * user lost interest would silently re-admit articles everybody else had
 * already been shown.
 *
 * Previously-shown digest items survive too, by the same logic: the digest is a
 * record of what was shown, and editing history to match current subscriptions
 * would make the §6 measurements describe a past that did not happen.
 */
export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const feedId = req.nextUrl.searchParams.get('feedId')
  if (!feedId) return NextResponse.json({ error: 'feedId is required' }, { status: 400 })

  try {
    await unsubscribe(userId, feedId)
    return NextResponse.json({
      unsubscribed: true,
      note: 'the feed and its collected items are kept — they are shared, and other subscribers depend on them for duplicate detection',
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not unsubscribe' },
      { status: 500 },
    )
  }
}
