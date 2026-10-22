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
import { normalizeEntry, splitTitlePublisher, type RawEntry } from './normalize'
import { parseFeed } from './parse'
import { fetchPseudoFeed, parseFeedUrl } from '@/lib/feedSources'
import { defaultSourceType, postToEntry, sourceKey, sourceName } from './pseudo'
import {
  assignTopicTags, classifyArticleType, CLASSIFIER_VERSION, contentTokens,
  extractEntities, typeHintFromSource,
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
  /**
   * No `feedTags` here, deliberately, and it used to be a parameter.
   *
   * A user's tags on a feed are THEIR annotation, and `suggest_items` rows are
   * SHARED across every subscriber. Passing them in meant whoever polled first
   * imprinted their private vocabulary onto a row everyone else reads — so one
   * user tagging a feed "energy" would make every other subscriber's relevance
   * score for those items react to a word they never typed.
   *
   * It showed up the moment a global scheduled poll was designed, because then
   * the question "whose tags?" has no answer at all. The tags now enter at
   * SCORING time, per user, in `buildDigest`.
   */
  opts: { sourceType?: string; maxEntries?: number } = {},
): Promise<IngestResult> {
  const base: IngestResult = {
    feedId: target.feedId, url: target.url, status: 'unknown',
    parsed: 0, normalized: 0, inserted: 0, skipped: 0, notes: [],
  }

  const now = new Date().toISOString()

  /**
   * Two kinds of source reach this function, and only the fetch differs.
   *
   * An http(s) URL is RSS or Atom: conditional-request headers, one GET, one
   * parse. A `feed://` URL is Hacker News, a subreddit or a 4chan board,
   * fetched through lib/feedSources and mapped to the same `RawEntry` shape by
   * lib/suggest/pseudo — which is what lets everything downstream of here, the
   * normalizing, classifying, dedup and scoring, stay completely unaware of
   * which kind it was.
   *
   * The pseudo sources support NO conditional requests: they are JSON APIs
   * with no ETag, so every poll is a full fetch. That is the cost of having
   * them, and it is why the age floor in `feedsDueForPoll` matters more for
   * them than for RSS.
   */
  let entries: RawEntry[]
  let etag: string | null = null
  let lastModified: string | null = null

  const pseudo = parseFeedUrl(target.url)
  if (pseudo) {
    try {
      const posts = await fetchPseudoFeed(target.url, opts.maxEntries ?? 60)
      entries = posts.map(postToEntry)
    } catch (e) {
      const status = `fetch failed: ${e instanceof Error ? e.message : 'unknown'}`
      await store.recordPoll(target.feedId, { status, ok: false })
      return { ...base, status }
    }
  } else {
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

    const doc = parseFeed(await res.text())
    entries = doc.entries
    etag = res.headers.get('etag')
    lastModified = res.headers.get('last-modified')
  }

  if (entries.length === 0) {
    // An empty document is a successful poll of a source with nothing in it,
    // and it is also what an unparseable one looks like from here. Said in the
    // status rather than guessed at.
    await store.recordPoll(target.feedId, { status: 'parsed, no entries', etag, lastModified, ok: true })
    return { ...base, status: 'parsed, no entries' }
  }

  /**
   * No article-type hint for an aggregator, because it did not write the item.
   *
   * `typeHintFromSource` exists to fill in the article type when nothing in the
   * item's own text fires a cue, on the reasoning that a research feed's
   * unclassifiable item is probably research. That reasoning fails completely
   * for HN, Reddit and 4chan: the default source type for those is
   * `commentary`, which hints `opinion`, and the thing being linked was written
   * by somebody else entirely.
   *
   * Observed on the first real ingest: a Hacker News link to a Quanta magazine
   * article came out classified `opinion`, which is both wrong about the piece
   * and consequential — `opinion` carries a four-day freshness half-life, so a
   * durable article would have decayed like a column.
   *
   * So a pseudo-feed's items fall through to `unclassified`, which is the
   * honest answer: nobody has said what this is. The cue list still applies
   * and still catches the ones it can.
   */
  const hint = pseudo ? null : typeHintFromSource(opts.sourceType ?? 'specialist')
  const cap = opts.maxEntries ?? 200
  const kept = entries.slice(0, cap)
  const notes: string[] = []
  if (entries.length > cap) {
    // No silent caps: a feed whose archive exceeds the limit must say so, or a
    // first poll of a long archive looks like a complete one.
    notes.push(`kept the newest ${cap} of ${entries.length} entries`)
  }

  const items: store.NewItem[] = []
  let dropped = 0
  for (const raw of kept) {
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
        // Empty: only the PUBLISHER's categories and the item's own keywords
        // belong on a shared row. See the note on this function's options.
        feedTags: [],
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
    parsed: entries.length, normalized: items.length, inserted, skipped, notes,
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
  /**
   * The candidate window, with its cap reported.
   *
   * `loadCandidates` has always had a 1000-row limit and never said when it hit
   * it — a silent cap, which is the one thing the rest of this pipeline refuses
   * to do. It did not matter while the corpus was small; at 698 items and
   * growing it is about to, and a digest quietly drawn from the newest 1000 of
   * 3000 items would look like a ranking problem rather than a window problem.
   *
   * Asking for `CANDIDATE_LIMIT + 1` is how the cap becomes detectable: if the
   * extra row comes back, there was more.
   */
  const CANDIDATE_LIMIT = 1000
  const fetched = await store.loadCandidates(
    feeds.map(f => f.feedId), windowDays, CANDIDATE_LIMIT + 1,
  )
  const capped = fetched.length > CANDIDATE_LIMIT
  const raw = capped ? fetched.slice(0, CANDIDATE_LIMIT) : fetched
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
  // Only what changed, and never a singleton. Writing the whole assignment was
  // one HTTP round trip per cluster — ~690 of them on a 698-item corpus, which
  // is what made a digest build take 16.7 seconds against 79ms of actual
  // computation. See `changedClusterIds`.
  await store.saveClusterIds(store.changedClusterIds(unique, assignment))

  const shown = await store.recentlyShown(userId)
  const recentlyShown = shown.map(s => new Set([...contentTokens(s.title), ...s.topicTags]))

  const feedById = new Map(feeds.map(f => [f.feedId, f]))
  const pairs = unique
    // An item whose feed the user has since disabled is dropped here rather
    // than filtered in the query, because loadCandidates is keyed on the
    // enabled set already — this catches the race where a feed is disabled
    // between the two reads.
    .filter((i): i is FeedItem => feedById.has(i.feedId))
    .map(item => {
      const feed = feedById.get(item.feedId) as Feed
      /**
       * The user's own tags on this feed, applied HERE rather than at ingest.
       *
       * They are a per-user annotation and `suggest_items` is shared, so
       * storing them would let one subscriber's vocabulary shape everybody
       * else's relevance scores. Merged into a COPY of the item, never
       * persisted, and marked `declared` with a reason that says the user is
       * the source — which is what the disclosure panel then shows.
       */
      if (feed.topicTags.length === 0) return { item, feed }
      const existing = new Set(item.topicTags.map(t => t.value))
      const mine = feed.topicTags
        .filter(t => !existing.has(t))
        .map(t => ({
          value: t,
          reason: `your own tag on ${feed.name}`,
          confidence: 'declared' as const,
        }))
      if (mine.length === 0) return { item, feed }
      return { item: { ...item, topicTags: [...mine, ...item.topicTags] }, feed }
    })

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
  if (capped) {
    digest.notes.push(
      `only the newest ${CANDIDATE_LIMIT} items from the last ${windowDays} days were considered — there are more, so narrow the window or disable a very busy feed if you want the rest in scope`,
    )
  }

  const persist = opts.persist ?? true
  const digestId = persist && digest.items.length > 0
    ? await store.recordDigest(userId, digest, { clusterIds: assignment })
    : null

  return { digest, digestId, blockers }
}

// ---------------------------------------------------------------------------
// Re-classification
// ---------------------------------------------------------------------------

export interface ReclassifyResult {
  examined: number
  changed: number
  /** Still behind after this batch. Reported so a backlog cannot look drained. */
  remaining: number
  /** A sample of what moved, for the caller to show rather than assert. */
  examples: { title: string; from: string; to: string }[]
}

/**
 * Re-run the classifier over stored items that are behind it.
 *
 * Incremental and bounded: one batch per call, oldest classifier version first,
 * skipping anything a human has adjudicated. Safe to call repeatedly — a corpus
 * converges over successive calls rather than needing one long run — which is
 * what lets it hang off a page visit like the rest of the upkeep.
 *
 * ── Why this cannot re-derive everything ──────────────────────────────────
 *
 * It recomputes from what is STORED: the title, summary, text and the
 * publisher's declared categories. It does not re-fetch the document, so a
 * classifier improvement that needed a field never captured at ingest is out of
 * reach and would need a re-poll. That is a real limit and the honest one to
 * have — the alternative is a pass that crawls every publisher again.
 *
 * Entities and the article type ARE fully recoverable this way, which is where
 * both of the fixes that motivated this landed.
 *
 * ── It writes even when nothing changed ───────────────────────────────────
 *
 * The version stamp advances regardless, or an item the current classifier
 * labels identically would be re-examined on every pass forever and the backlog
 * would never drain.
 */
export async function reclassifyBatch(
  opts: { limit?: number; sourceTypeByFeed?: Map<string, string> } = {},
): Promise<ReclassifyResult> {
  const limit = opts.limit ?? 50
  const stale = await store.staleItems(CLASSIFIER_VERSION, limit)
  const result: ReclassifyResult = {
    examined: stale.length, changed: 0, remaining: 0, examples: [],
  }
  if (stale.length === 0) return result

  for (const item of stale) {
    const { headline } = splitTitlePublisher(item.title)
    /**
     * No source-type hint, for every item rather than only aggregators.
     *
     * At ingest the hint is available because the caller knows which
     * subscription it is polling. Here there is no user and no subscription —
     * source type is a PER-SUBSCRIBER judgement, so a shared row has no single
     * one to consult. Using the majority would make a row's article type
     * change when somebody else re-tagged their copy of the feed, which is the
     * shared-row hazard again.
     *
     * So the pass labels from the item's own text alone. That can only move a
     * row from a hinted type to `unclassified`, never to a wrong type — and
     * `unclassified` is the honest value for "nobody has said what this is".
     */
    const articleType = classifyArticleType({ title: headline, summary: item.summary })
    const topicTags = assignTopicTags({
      title: headline,
      summary: item.summary,
      text: item.text,
      declaredTags: item.declaredTags,
      // Never the user's feed tags: this is a shared row. See ingestFeed.
      feedTags: [],
    })
    const entities = extractEntities(headline, item.summary)

    await store.saveLabels(item.itemId, { topicTags, entities, articleType }, CLASSIFIER_VERSION)

    // The "before" came back with the row, so this costs no extra round trip.
    const before = item.labelFingerprint
    const after = store.fingerprint(articleType.value, entities.length, topicTags.length)
    if (before !== after) {
      result.changed++
      if (result.examples.length < 5) {
        result.examples.push({ title: headline.slice(0, 60), from: before, to: after })
      }
    }
  }

  result.remaining = await store.staleItemCount(CLASSIFIER_VERSION)
  return result
}

// ---------------------------------------------------------------------------
// Adopting the pinned feeds
// ---------------------------------------------------------------------------

export interface AdoptResult {
  added: { url: string; name: string }[]
  /** Already known — on or deliberately off. Either way, left alone. */
  known: string[]
  skipped: { url: string; reason: string }[]
}

/**
 * Bring any pinned feed the user has no row for into the digest.
 *
 * This is the opt-OUT half of the integration: a feed on the home page is
 * considered by the digest unless the user has said otherwise, so there is no
 * setup step at all. The alternative — a checkbox per feed, defaulting off —
 * still makes somebody do the work of re-declaring a list they already have,
 * which was the whole thing to avoid.
 *
 * ── The rule that makes opt-out safe ──────────────────────────────────────
 *
 * A feed is added only when there is NO subscription row for it. A row with
 * `enabled = false` is a decision the user made and is left strictly alone.
 *
 * That is why turning a source off sets `enabled = false` rather than deleting
 * the row (see `setSubscriptionEnabled`). Delete it and this function sees a
 * pinned feed with no subscription, concludes it is new, and adds it back on
 * the next page load — a toggle that un-toggles itself whenever you happen to
 * reload, which is the worst kind of settings bug because it is intermittent.
 *
 * ── The pinned list has to be passed in ───────────────────────────────────
 *
 * It lives in localStorage and the server has never seen it. That is the right
 * home for it — a UI preference, works signed out, needs no server — so the
 * only way this can know what somebody has pinned is to be told, on each call.
 * Nothing is migrated: the pinned list stays where it is and keeps working as a
 * bookmark list.
 */
export async function adoptPinned(
  userId: string, pinned: { url?: string; label?: string }[],
): Promise<AdoptResult> {
  const result: AdoptResult = { added: [], known: [], skipped: [] }
  if (pinned.length === 0) return result

  const state = await store.subscriptionStateByUrl(userId)

  for (const entry of pinned) {
    const key = sourceKey(entry.url ?? '')
    if (!key) {
      result.skipped.push({
        url: entry.url ?? '',
        reason: 'not an http(s) feed URL or a recognised feed:// source',
      })
      continue
    }
    // On OR off: both mean the user has a relationship with this feed already.
    if (state.has(key)) { result.known.push(key); continue }

    const name = sourceName(key, entry.label)
    // No validating fetch. These are feeds the user already reads, so they are
    // known-good by use, and fetching twenty inline would make a page load take
    // a minute. A dead one surfaces at the next poll with its own status.
    await store.subscribe(userId, {
      url: key,
      name,
      language: null,
      label: entry.label?.trim() || null,
      topicTags: [],
      sourceType: defaultSourceType(key) as Feed['sourceType'],
    })
    // Recorded as we go, so two spellings of one source in the same list — and
    // `feed://hn` plus `feed://hn/top` really do both ship in this codebase —
    // do not adopt twice and overwrite each other's label.
    state.set(key, { feedId: '', enabled: true })
    result.added.push({ url: key, name })
  }

  return result
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
