/**
 * The two end-to-end runs: ingest a feed, and build a digest.
 *
 * This is the only module in lib/suggest that is both impure and
 * subject-specific — it does the network for ingest and the database for both,
 * and it exists so the routes are thin. A route that assembled this itself
 * would be the place the ordering got subtly wrong, and the ordering is the
 * part that matters:
 *
 *   normalize → classify → store → load window → cluster → score → select
 *
 * **Classification happens at ingest, not at digest time.** Tags, entities and
 * the article type are computed once when the item is first seen and stored.
 * That is not a cache: it is what makes the labels *correctable*. A label
 * recomputed on every digest cannot be edited, because the edit would be
 * overwritten by the next run — and the spec asks for the reason behind each
 * label to be kept "so classifications can be corrected".
 *
 * **Clustering happens at digest time, over the window.** The opposite choice,
 * for the opposite reason: a cluster is a relationship between items, so an
 * item's cluster cannot be known when it arrives alone. The assignment is
 * written back, and `suggest_digest_items` snapshots it, because re-clustering
 * can move an item and last week's duplicate rate must not change retroactively.
 */

import type { Digest, Feed, FeedItem, Interest, ScoreWeights } from './types'
import { DEFAULT_BUCKET_PLAN } from './types'
import { normalizeEntry } from './normalize'
import { parseFeed } from './parse'
import {
  assignTopicTags, classifyArticleType, contentTokens, extractEntities, typeHintFromSource,
} from './tags'
import { clusterStories, dedupeExact } from './cluster'
import { DEFAULT_WEIGHTS, scoreAll } from './score'
import { selectDigest } from './select'
import { planWithDiscoveryFloor } from './feedback'
import * as store from './store'

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export interface IngestResult {
  feedId: string
  url: string
  status: string
  /** How many entries the document contained. */
  parsed: number
  /** How many survived normalization. */
  normalized: number
  inserted: number
  /** Already present. Not a failure — the expected outcome of a routine poll. */
  skipped: number
  /** Why entries were dropped, if any were. */
  notes: string[]
}

const POLL_TIMEOUT_MS = 12_000
const UA = 'bza-suggest/1.0 (reading companion; +https://aireadalong.com)'

/**
 * Fetch and store one feed.
 *
 * Conditional-request headers are sent when the feed gave them last time, so a
 * feed that has not changed costs one 304 and no parsing. Both are kept per the
 * spec's "use the feed's own update metadata where available".
 *
 * Never throws for a network or parse problem. A poll of forty feeds must not
 * be taken down by one publisher's expired certificate, so the failure is
 * recorded on the feed row and returned as a `status` — which is also what
 * makes a feed that has been failing for a month *visible* rather than quietly
 * contributing nothing.
 */
export async function ingestFeed(
  target: store.PollTarget,
  opts: { sourceType?: string; feedTags?: string[]; maxEntries?: number } = {},
): Promise<IngestResult> {
  const base: IngestResult = {
    feedId: target.feedId, url: target.url, status: 'unknown',
    parsed: 0, normalized: 0, inserted: 0, skipped: 0, notes: [],
  }

  let res: Response
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), POLL_TIMEOUT_MS)
  try {
    const headers: Record<string, string> = { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }
    if (target.etag) headers['If-None-Match'] = target.etag
    if (target.lastModified) headers['If-Modified-Since'] = target.lastModified
    res = await fetch(target.url, { headers, signal: controller.signal, cache: 'no-store' })
  } catch (e) {
    const status = e instanceof Error && e.name === 'AbortError'
      ? `timed out after ${POLL_TIMEOUT_MS / 1000}s`
      : `fetch failed: ${e instanceof Error ? e.message : 'unknown'}`
    await store.recordPoll(target.feedId, { status, ok: false })
    return { ...base, status }
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 304) {
    await store.recordPoll(target.feedId, { status: 'not modified', ok: true })
    return { ...base, status: 'not modified' }
  }
  if (!res.ok) {
    const status = `HTTP ${res.status}`
    await store.recordPoll(target.feedId, { status, ok: false })
    return { ...base, status }
  }

  const xml = await res.text()
  const doc = parseFeed(xml)
  const now = new Date().toISOString()

  const etag = res.headers.get('etag')
  const lastModified = res.headers.get('last-modified')

  if (doc.entries.length === 0) {
    // An empty document is a successful poll of a feed with nothing in it, and
    // it is also what an unparseable document looks like from here. Said in
    // the status rather than guessed at.
    await store.recordPoll(target.feedId, { status: 'parsed, no entries', etag, lastModified, ok: true })
    return { ...base, status: 'parsed, no entries' }
  }

  const hint = typeHintFromSource(opts.sourceType ?? 'specialist')
  const cap = opts.maxEntries ?? 200
  const entries = doc.entries.slice(0, cap)
  const notes: string[] = []
  if (doc.entries.length > cap) {
    // No silent caps: a feed whose archive exceeds the limit must say so, or a
    // first poll of a long archive looks like a complete one.
    notes.push(`kept the newest ${cap} of ${doc.entries.length} entries`)
  }

  const items: store.NewItem[] = []
  let dropped = 0
  for (const raw of entries) {
    const n = normalizeEntry(raw, now)
    if (!n) { dropped++; continue }
    items.push({
      feedId: target.feedId,
      canonicalUrl: n.canonicalUrl,
      originalUrl: n.originalUrl,
      title: n.title,
      summary: n.summary,
      publishedAt: n.publishedAt,
      author: n.author,
      text: n.text,
      topicTags: assignTopicTags({
        // The HEADLINE, not the title: an aggregator's publisher suffix would
        // otherwise become a keyword tag on every item from that feed, and the
        // topic-share penalty would then treat "reuters" as a topic.
        title: n.headline,
        summary: n.summary,
        text: n.text,
        declaredTags: n.declaredTags,
        feedTags: opts.feedTags ?? [],
      }),
      entities: extractEntities(n.headline, n.summary),
      articleType: classifyArticleType({ title: n.headline, summary: n.summary, sourceTypeHint: hint }),
      contentHash: n.contentHash,
    })
  }
  if (dropped > 0) notes.push(`${dropped} entr${dropped === 1 ? 'y had' : 'ies had'} neither a URL nor a title`)

  const { inserted, skipped } = await store.insertItems(items)
  const status = `${inserted} new, ${skipped} already stored`
  await store.recordPoll(target.feedId, { status, etag, lastModified, ok: true })

  return {
    ...base, status,
    parsed: doc.entries.length, normalized: items.length, inserted, skipped, notes,
  }
}

// ---------------------------------------------------------------------------
// Digest
// ---------------------------------------------------------------------------

export interface BuildDigestResult {
  digest: Digest
  digestId: string | null
  /** Said out loud when there is nothing to build from, instead of an empty list. */
  blockers: string[]
}

/**
 * Score and select a digest for one user, and record it.
 *
 * `persist` defaults to true. A preview run — the user dragging a weight slider
 * to see what changes — must NOT record, because a recorded digest enters the
 * novelty history and the duplicate rate, and a user exploring the settings
 * would poison both.
 *
 * `blockers` carries the reasons a digest is empty or thin that are not about
 * ranking at all: no enabled feeds, no interests, no items in the window. These
 * are returned separately from `digest.gaps` because they have different fixes
 * — a gap is answered by enabling more feeds, a blocker by doing the setup at
 * all — and collapsing them would make "you have no interests yet" read as
 * "nothing matched your interests".
 */
export async function buildDigest(
  userId: string,
  opts: { persist?: boolean; weights?: ScoreWeights; windowDays?: number } = {},
): Promise<BuildDigestResult> {
  const blockers: string[] = []

  const [feeds, interests, settings] = await Promise.all([
    store.loadFeeds(userId, true),
    store.loadInterests(userId),
    store.loadSettings(userId),
  ])

  if (feeds.length === 0) {
    blockers.push('no feeds are enabled — add some sources before a digest can be built')
  }
  if (interests.length === 0) {
    // Not fatal. Relevance and bridge both read zero, so the digest becomes
    // quality-and-novelty ordered — which is a reasonable cold start and is
    // better than refusing to show anything. But it is said, because a feed
    // that looks random is otherwise indistinguishable from a broken one.
    blockers.push('no interests are defined — relevance and bridge both score zero, so this digest is ordered by quality, freshness and novelty only')
  }

  const emptyPlan = settings.plan ?? DEFAULT_BUCKET_PLAN
  const plan = planWithDiscoveryFloor(emptyPlan)
  const weights = opts.weights ?? settings.weights ?? DEFAULT_WEIGHTS

  if (feeds.length === 0) {
    return {
      digest: { items: [], gaps: [], rejected: [], notes: [], weights, plan },
      digestId: null,
      blockers,
    }
  }

  const windowDays = opts.windowDays ?? 14
  const raw = await store.loadCandidates(feeds.map(f => f.feedId), windowDays)
  if (raw.length === 0) {
    blockers.push(`no items were collected in the last ${windowDays} days — poll the feeds first`)
    return {
      digest: { items: [], gaps: [], rejected: [], notes: [], weights, plan },
      digestId: null,
      blockers,
    }
  }

  // Exact duplicates first, so clustering is not comparing an item to itself
  // arriving from a second feed — which would be a perfect similarity and would
  // pull two genuinely distinct stories into one cluster through it.
  const { unique, duplicates } = dedupeExact(raw)
  const { assignment } = clusterStories(unique)
  await store.saveClusterIds(assignment)

  const shown = await store.recentlyShown(userId)
  const recentlyShown = shown.map(s => new Set([...contentTokens(s.title), ...s.topicTags]))

  const feedById = new Map(feeds.map(f => [f.feedId, f]))
  const pairs = unique
    // An item whose feed the user has since disabled is dropped here rather
    // than filtered in the query, because loadCandidates is keyed on the
    // enabled set already — this catches the race where a feed is disabled
    // between the two reads.
    .filter((i): i is FeedItem => feedById.has(i.feedId))
    .map(item => ({ item, feed: feedById.get(item.feedId) as Feed }))

  const scored = scoreAll(pairs, {
    interests,
    regions: settings.regions,
    recentlyShown,
    now: new Date().toISOString(),
    weights,
    qualityFloor: settings.qualityFloor ?? undefined,
  })

  const digest = selectDigest(scored, assignment, {
    plan, weights, enabledFeeds: feeds.length,
  })

  if (duplicates.length > 0) {
    digest.notes.push(
      `${duplicates.length} item${duplicates.length === 1 ? '' : 's'} were the same article arriving from more than one feed, and were collapsed`,
    )
  }

  const persist = opts.persist ?? true
  const digestId = persist && digest.items.length > 0
    ? await store.recordDigest(userId, digest, { clusterIds: assignment })
    : null

  return { digest, digestId, blockers }
}

/**
 * The interests a feedback event should move, given an item id.
 *
 * Looked up from what the digest RECORDED as matched, not recomputed from the
 * item. Recomputing would use today's interest weights and today's interest
 * list to decide what last week's digest matched, so feedback on an older item
 * would move whichever interests happen to match now — including ones that did
 * not exist when the item was shown.
 */
export async function matchedInterestsFor(
  userId: string, itemId: string,
): Promise<{ names: string[]; bucket: string | null }> {
  const latest = await store.loadLatestDigest(userId)
  const hit = latest?.items.find(i => i.itemId === itemId)
  return { names: hit?.matchedInterests ?? [], bucket: hit?.bucket ?? null }
}

/** Shape the digest for a client, with the explanation each item carries. */
export function presentDigest(digest: Digest): {
  items: Record<string, unknown>[]
  gaps: Digest['gaps']
  notes: string[]
} {
  return {
    items: digest.items.map((s, position) => ({
      position,
      itemId: s.scored.item.itemId,
      title: s.scored.item.title,
      url: s.scored.item.canonicalUrl,
      summary: s.scored.item.summary,
      publishedAt: s.scored.item.publishedAt,
      source: s.scored.feed.name,
      sourceType: s.scored.feed.sourceType,
      articleType: s.scored.item.articleType.value,
      articleTypeReason: s.scored.item.articleType.reason,
      bucket: s.bucket,
      backfilled: s.backfilled,
      alsoQualifiedFor: s.alsoQualifiedFor,
      // Parts and base, never only base. The client is asked to show why, and
      // it cannot do that from a single number.
      parts: s.scored.parts,
      base: s.scored.base,
      selectionScore: s.selectionScore,
      penalties: s.penalties,
      because: s.scored.because,
      matchedInterests: s.scored.matchedInterests,
      bridgeFrom: s.scored.bridgeFrom,
      bridgeTo: s.scored.bridgeTo,
      topicTags: s.scored.item.topicTags.map(t => ({ value: t.value, reason: t.reason, confidence: t.confidence })),
    })),
    gaps: digest.gaps,
    notes: digest.notes,
  }
}
