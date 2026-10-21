/**
 * Persistence for the suggested feed. Server-side only.
 *
 * Eight tables, created by supabase/setup/71_suggested_feed.sql, in the
 * application schema (`DB_SCHEMA`). This module is the only place that names
 * them, so the row shape and the TypeScript shape are reconciled once rather
 * than at every route — the same discipline as lib/concepts/store.ts, and for
 * the same reason.
 *
 * The schema is never spelled as a literal here, including in prose:
 * tests/supabase-schema.mjs refuses one anywhere outside lib/supabaseSchema.ts,
 * and it does not strip comments first.
 *
 * A service-role client is used rather than the caller's token. Two of these
 * tables are shared across users and written only by the poller, which has no
 * caller; the rest are filtered on `user_id` explicitly at every call site, and
 * RLS is still on as the backstop if a filter is ever dropped.
 *
 * ── The one thing to be careful about in this file ─────────────────────────
 *
 * `recordDigest` writes the digest row, its items, and the snapshot of each
 * item's cluster id. Those three have to agree or §6's measurements read a
 * window that never existed. They are written from one client in one function
 * for that reason, and `backfilled` and `story_cluster_id` are copied in rather
 * than derived on read — clustering re-runs on every poll, so a later run can
 * move an item to a different cluster and retroactively change what last
 * week's duplicate rate was measured against.
 */

import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'
import type {
  ArticleType, Bucket, Digest, Feed, FeedItem, Feedback, FeedbackKind,
  Interest, Labelled, ScoreWeights, SourceType,
} from './types'
import type { ShownItem } from './metrics'
import { CLASSIFIER_VERSION } from './tags'

/**
 * A service-role client whose reads are never cached.
 *
 * `serverData` is `dbSchema` plus a no-store fetch, and the second half is
 * load-bearing: this module's reads followed its own writes and were served a
 * stale empty set with no error at any layer. The full account is on
 * `noStoreFetch` in lib/supabaseSchema.ts — it is written up there rather than
 * here because it applies to every server-side client in the app, and
 * tests/supabase-schema.mjs now enforces it.
 */
function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      ...serverData,
      // No session to persist — this client is constructed per server process
      // and authenticates with the service role key, not a user token.
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}

let client: ReturnType<typeof makeServiceClient> | null = null
const db = () => (client ??= makeServiceClient())

// ---------------------------------------------------------------------------
// Coercion
// ---------------------------------------------------------------------------

/**
 * Coerce a jsonb column into a label list.
 *
 * Same discipline as `coerceWorld` in lib/concepts/store.ts: what comes out of
 * a jsonb column is `unknown`, and a label array containing one malformed entry
 * would make `.map(t => t.value)` return undefined — which then flows into a
 * token set and silently widens every similarity comparison rather than
 * throwing anywhere a stack trace would help.
 */
function coerceLabels(raw: unknown): Labelled<string>[] {
  if (!Array.isArray(raw)) return []
  const out: Labelled<string>[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const value = typeof e.value === 'string' ? e.value : null
    if (!value) continue
    out.push({
      value,
      reason: typeof e.reason === 'string' ? e.reason : 'no reason was recorded',
      confidence: e.confidence === 'declared' || e.confidence === 'guessed' ? e.confidence : 'derived',
    })
  }
  return out
}

const ARTICLE_TYPES: ReadonlySet<string> = new Set<ArticleType>([
  'news', 'analysis', 'explainer', 'opinion', 'research',
  'official_release', 'investigation', 'data', 'unclassified',
])

/**
 * Coerce the article-type column.
 *
 * An unreadable value becomes `unclassified` with a reason that SAYS the row
 * was unreadable, rather than `news`. Defaulting to news would put the item in
 * the news decay rate and out of the context bucket on the strength of a
 * corrupt row, and nothing downstream would indicate why.
 */
function coerceArticleType(raw: unknown): Labelled<ArticleType> {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const value = typeof e.value === 'string' && ARTICLE_TYPES.has(e.value)
    ? (e.value as ArticleType)
    : 'unclassified'
  return {
    value,
    reason: typeof e.reason === 'string'
      ? e.reason
      : 'the stored classification could not be read',
    confidence: e.confidence === 'declared' || e.confidence === 'guessed' ? e.confidence : 'derived',
  }
}

// ---------------------------------------------------------------------------
// Feeds and subscriptions
// ---------------------------------------------------------------------------

interface SubscriptionRow {
  feed_id: string
  label: string | null
  region: string | null
  topic_tags: string[] | null
  source_type: string | null
  enabled: boolean
  user_designated: boolean
  suggest_feeds: { url: string; name: string; language: string | null } | null
}

const SOURCE_TYPES: ReadonlySet<string> = new Set<SourceType>([
  'local_reporting', 'specialist', 'wire', 'primary_source', 'research', 'commentary',
])

/**
 * Every feed a user subscribes to, as the pipeline's `Feed`.
 *
 * `enabledOnly` defaults to true because that is what a digest run wants, but
 * the settings page needs the disabled ones too — and silently hiding them
 * there would make a disabled feed look deleted.
 */
export async function loadFeeds(userId: string, enabledOnly = true): Promise<Feed[]> {
  let query = db()
    .from('suggest_subscriptions')
    .select('feed_id, label, region, topic_tags, source_type, enabled, user_designated, suggest_feeds(url, name, language)')
    .eq('user_id', userId)
  if (enabledOnly) query = query.eq('enabled', true)

  const { data, error } = await query
  if (error) throw new Error(`could not load the feeds: ${error.message}`)

  return ((data ?? []) as unknown as SubscriptionRow[])
    // A subscription whose feed row is gone is skipped rather than defaulted to
    // a blank feed: a Feed with no url cannot be polled and a Feed with no name
    // shows as an empty source label in every explanation.
    .filter(r => !!r.suggest_feeds)
    .map(r => ({
      feedId: r.feed_id,
      url: r.suggest_feeds!.url,
      name: r.label ?? r.suggest_feeds!.name,
      language: r.suggest_feeds!.language,
      region: r.region,
      topicTags: r.topic_tags ?? [],
      sourceType: (r.source_type && SOURCE_TYPES.has(r.source_type)
        ? r.source_type
        : 'specialist') as SourceType,
      enabled: r.enabled,
      userDesignated: r.user_designated,
    }))
}

/** Feeds due a poll, oldest first, with their conditional-request headers. */
export interface PollTarget {
  feedId: string
  url: string
  etag: string | null
  lastModified: string | null
  consecutiveFailures: number
}

/**
 * Feeds nobody has polled recently.
 *
 * `minAgeMinutes` is a politeness floor, not an optimisation: polling a feed
 * every time somebody loads a page is how an IP gets blocked, and the items
 * would not have changed anyway. Feeds with repeated failures are *not*
 * excluded here — they are returned with their failure count so the caller can
 * back them off deliberately and report it, rather than having them silently
 * vanish from the catalogue.
 */
export async function feedsDueForPoll(minAgeMinutes = 30, limit = 50): Promise<PollTarget[]> {
  const cutoff = new Date(Date.now() - minAgeMinutes * 60_000).toISOString()
  const { data, error } = await db()
    .from('suggest_feeds')
    .select('id, url, http_etag, http_last_modified, consecutive_failures, last_polled_at')
    .or(`last_polled_at.is.null,last_polled_at.lt.${cutoff}`)
    .order('last_polled_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  if (error) throw new Error(`could not list the feeds due for a poll: ${error.message}`)

  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    feedId: String(r.id),
    url: String(r.url),
    etag: typeof r.http_etag === 'string' ? r.http_etag : null,
    lastModified: typeof r.http_last_modified === 'string' ? r.http_last_modified : null,
    consecutiveFailures: typeof r.consecutive_failures === 'number' ? r.consecutive_failures : 0,
  }))
}

/**
 * Find or create the shared feed row for a URL, and subscribe the user to it.
 *
 * Two steps, in this order, and the order matters: the feed row is shared, so a
 * second subscriber must attach to the existing row rather than create a
 * duplicate. The unique index on `url` is what makes that safe under a race —
 * the upsert either inserts or returns the incumbent.
 */
export async function subscribe(
  userId: string,
  opts: {
    url: string; name: string; language?: string | null
    label?: string | null; region?: string | null
    topicTags?: string[]; sourceType?: SourceType; userDesignated?: boolean
  },
): Promise<string> {
  const { data: feedRow, error: feedErr } = await db()
    .from('suggest_feeds')
    .upsert(
      { url: opts.url, name: opts.name, language: opts.language ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'url' },
    )
    .select('id')
    .single()
  if (feedErr) throw new Error(`could not record the feed: ${feedErr.message}`)

  const feedId = (feedRow as { id: string }).id
  const { error: subErr } = await db()
    .from('suggest_subscriptions')
    .upsert(
      {
        user_id: userId,
        feed_id: feedId,
        label: opts.label ?? null,
        region: opts.region ?? null,
        topic_tags: opts.topicTags ?? [],
        source_type: opts.sourceType ?? 'specialist',
        enabled: true,
        user_designated: opts.userDesignated ?? false,
      },
      { onConflict: 'user_id,feed_id' },
    )
  if (subErr) throw new Error(`could not subscribe: ${subErr.message}`)
  return feedId
}

/**
 * Change one subscription's user-controlled fields.
 *
 * Takes a column-named patch because the caller has already validated the
 * values and this module owns the column names — the alternative, a
 * camelCase patch translated here, would mean maintaining the mapping twice
 * for a route that is already the only caller.
 */
export async function updateSubscription(
  userId: string, feedId: string, patch: Record<string, unknown>,
): Promise<void> {
  if (Object.keys(patch).length === 0) return
  const { error } = await db()
    .from('suggest_subscriptions')
    .update(patch)
    .eq('user_id', userId)
    .eq('feed_id', feedId)
  if (error) throw new Error(`could not change that source: ${error.message}`)
}

/**
 * Drop a subscription.
 *
 * The SUBSCRIPTION only — never the shared feed row and never its items. The
 * feed may have other subscribers, and the items are the shared corpus that
 * everybody's dedup and clustering read; removing them because one person lost
 * interest would silently re-admit articles others had already been shown.
 */
export async function unsubscribe(userId: string, feedId: string): Promise<void> {
  const { error } = await db()
    .from('suggest_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('feed_id', feedId)
  if (error) throw new Error(`could not unsubscribe: ${error.message}`)
}

/**
 * Turn a source off WITHOUT forgetting that it was turned off.
 *
 * This exists because the pinned feeds are opt-OUT: every feed on the home
 * page is considered by the digest unless the user says otherwise, and the
 * auto-adopt on each visit inserts a subscription for anything it has no row
 * for.
 *
 * Which makes `unsubscribe` — a plain DELETE — actively wrong as the "turn
 * this off" action. Deleting the row removes the only evidence that the user
 * made a decision, so the next page visit would see a pinned feed with no
 * subscription, conclude it was new, and add it back. The toggle would appear
 * not to work, intermittently, depending on when the user next loaded the
 * page: the single most confusing class of bug a settings screen can have.
 *
 * So off means `enabled = false`, and the row is the record. `loadFeeds` with
 * `enabledOnly` already excludes it from every digest, and auto-adopt skips
 * any feed it has a row for — on or off.
 *
 * `unsubscribe` is kept for genuinely forgetting a source that is NOT in the
 * pinned list, where there is nothing to come back from.
 */
export async function setSubscriptionEnabled(
  userId: string, feedId: string, enabled: boolean,
): Promise<void> {
  const { error } = await db()
    .from('suggest_subscriptions')
    .update({ enabled })
    .eq('user_id', userId)
    .eq('feed_id', feedId)
  if (error) {
    throw new Error(`could not ${enabled ? 'include' : 'exclude'} that source: ${error.message}`)
  }
}

/**
 * Subscriptions for a user keyed by canonical URL, including disabled ones.
 *
 * Auto-adopt needs to distinguish three states and only two of them are
 * visible from `loadFeeds(userId, true)`: never seen, on, and deliberately
 * off. The third is the one that matters — it is what stops an excluded feed
 * being re-added — so this returns them all.
 */
export async function subscriptionStateByUrl(
  userId: string,
): Promise<Map<string, { feedId: string; enabled: boolean }>> {
  const all = await loadFeeds(userId, false)
  return new Map(all.map(f => [f.url, { feedId: f.feedId, enabled: f.enabled }]))
}

/**
 * The source type each subscriber assigned to a feed, for a global poll.
 *
 * A scheduled poll has no user, so it cannot read "the" source type — several
 * subscribers may disagree, since it is a per-subscription judgement. This
 * returns the COMMONEST one per feed, which is the only defensible answer: it
 * is used solely as the article-type hint when nothing in the item's own text
 * fires, and a hint drawn from the majority of subscribers is better than
 * either picking arbitrarily or dropping the signal.
 *
 * Feeds with no subscriber at all are absent from the map, and the caller
 * falls back to 'specialist' — the neutral type that implies no article type.
 */
export async function majoritySourceTypes(): Promise<Map<string, string>> {
  const { data, error } = await db()
    .from('suggest_subscriptions')
    .select('feed_id, source_type')
    .eq('enabled', true)
  if (error) throw new Error(`could not read the source types: ${error.message}`)

  const tally = new Map<string, Map<string, number>>()
  for (const row of (data ?? []) as { feed_id: string; source_type: string | null }[]) {
    const type = row.source_type ?? 'specialist'
    const counts = tally.get(row.feed_id) ?? new Map<string, number>()
    counts.set(type, (counts.get(type) ?? 0) + 1)
    tally.set(row.feed_id, counts)
  }

  const out = new Map<string, string>()
  for (const [feedId, counts] of tally) {
    // Ties broken alphabetically rather than by iteration order, so the same
    // data gives the same answer on every run.
    const best = [...counts.entries()]
      .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))[0]
    if (best) out.set(feedId, best[0])
  }
  return out
}

/**
 * Every user with at least one enabled subscription.
 *
 * The scheduled run needs this for the weekly decay, which is per-user — unlike
 * polling, which is global because the feed and item tables are shared.
 */
export async function usersWithSubscriptions(): Promise<string[]> {
  const { data, error } = await db()
    .from('suggest_subscriptions')
    .select('user_id')
    .eq('enabled', true)
  if (error) throw new Error(`could not list the subscribers: ${error.message}`)
  return [...new Set(((data ?? []) as { user_id: string }[]).map(r => r.user_id))]
}

/** Record the outcome of a poll, successful or not. */
export async function recordPoll(
  feedId: string,
  outcome: { status: string; etag?: string | null; lastModified?: string | null; ok: boolean },
): Promise<void> {
  const patch: Record<string, unknown> = {
    last_polled_at: new Date().toISOString(),
    last_poll_status: outcome.status,
    updated_at: new Date().toISOString(),
  }
  if (outcome.etag !== undefined) patch.http_etag = outcome.etag
  if (outcome.lastModified !== undefined) patch.http_last_modified = outcome.lastModified
  // Reset on success, increment on failure. Read-modify-write rather than a
  // SQL expression because supabase-js cannot express `col = col + 1` without
  // an RPC, and a lost increment under concurrency costs nothing here — the
  // counter drives a back-off hint, not a decision.
  if (outcome.ok) patch.consecutive_failures = 0

  const { error } = await db().from('suggest_feeds').update(patch).eq('id', feedId)
  if (error) throw new Error(`could not record the poll: ${error.message}`)

  if (!outcome.ok) {
    const { data } = await db()
      .from('suggest_feeds').select('consecutive_failures').eq('id', feedId).maybeSingle()
    const n = (data as { consecutive_failures?: number } | null)?.consecutive_failures ?? 0
    await db().from('suggest_feeds').update({ consecutive_failures: n + 1 }).eq('id', feedId)
  }
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface NewItem {
  feedId: string
  canonicalUrl: string
  originalUrl: string
  title: string
  summary: string | null
  publishedAt: string | null
  author: string | null
  text: string | null
  topicTags: Labelled<string>[]
  entities: Labelled<string>[]
  articleType: Labelled<ArticleType>
  contentHash: string
}

/**
 * Insert items, ignoring the ones already stored.
 *
 * `ignoreDuplicates` on the canonical-url conflict rather than an upsert that
 * overwrites: the FIRST observation of an item is the one to keep. A later feed
 * picking up the same wire story would otherwise overwrite `published_at` with
 * its own syndication time, and every re-poll would make the piece look fresh
 * again — the exact behaviour `dedupeExact` keeping the first survivor exists
 * to prevent, undone at the database layer.
 *
 * Returns how many rows were new, which is the only honest thing to report: the
 * difference between "polled 40 feeds, 0 new items" and "polled 40 feeds" is
 * the difference between a working poller and a broken one.
 */
export async function insertItems(items: NewItem[]): Promise<{ inserted: number; skipped: number }> {
  if (items.length === 0) return { inserted: 0, skipped: 0 }

  const rows = items.map(i => ({
    feed_id: i.feedId,
    canonical_url: i.canonicalUrl,
    original_url: i.originalUrl,
    title: i.title,
    summary: i.summary,
    published_at: i.publishedAt,
    author: i.author,
    text_content: i.text,
    topic_tags: i.topicTags,
    entities: i.entities,
    article_type: i.articleType,
    content_hash: i.contentHash,
    // Stamped at insert, or every freshly-ingested item would be immediately
    // behind the current classifier and the re-classification backlog would
    // grow as fast as the corpus — a queue that can never drain.
    classifier_version: CLASSIFIER_VERSION,
  }))

  /**
   * TWO unique indexes guard this table, and `on conflict` can only name one.
   *
   * `suggest_items` is unique on `canonical_url` AND on `content_hash` — the
   * second is what catches the same article arriving from two feeds at
   * different URLs, which is the whole point of having it. But Postgres applies
   * `on conflict (canonical_url)` to that one constraint, so a row that
   * collides on the HASH raises 23505 and takes the entire batch with it.
   *
   * Observed as a poll failing outright with `duplicate key value violates
   * unique constraint "suggest_items_content_hash_idx"` the moment two
   * subscribed feeds carried the same story. That is not an edge case: it is
   * the normal condition for anyone following both an aggregator and the
   * publications it links.
   *
   * So the hash collisions are filtered out BEFORE the insert, in two steps —
   * within the batch, and against what is already stored.
   */
  const seen = new Set<string>()
  const deduped = rows.filter(r => {
    if (seen.has(r.content_hash)) return false
    seen.add(r.content_hash)
    return true
  })

  const hashes = [...seen]
  const { data: existing, error: existingErr } = await db()
    .from('suggest_items')
    .select('content_hash')
    .in('content_hash', hashes)
  if (existingErr) throw new Error(`could not check for duplicates: ${existingErr.message}`)
  const already = new Set(
    ((existing ?? []) as { content_hash: string }[]).map(r => r.content_hash),
  )
  const fresh = deduped.filter(r => !already.has(r.content_hash))

  if (fresh.length === 0) return { inserted: 0, skipped: items.length }

  const { data, error } = await db()
    .from('suggest_items')
    .upsert(fresh, { onConflict: 'canonical_url', ignoreDuplicates: true })
    .select('id')

  if (error) {
    /**
     * A hash collision can still land here, because the pre-filter is a check
     * and a write with a gap between them — two concurrent polls of feeds
     * carrying the same story will race through it.
     *
     * Falling back to row-by-row rather than failing: the batch is already
     * known to be mostly insertable, and losing a whole poll to one racing
     * duplicate is the behaviour being fixed. Slower, but only on the rare
     * path that actually hits the race.
     */
    if (error.code !== '23505') throw new Error(`could not store the items: ${error.message}`)

    let inserted = 0
    for (const row of fresh) {
      const { error: rowErr } = await db()
        .from('suggest_items')
        .upsert([row], { onConflict: 'canonical_url', ignoreDuplicates: true })
      // 23505 here is the hash constraint: this row is a duplicate of
      // something stored since the pre-filter ran. Skipping it IS the
      // deduplication working.
      if (!rowErr) inserted++
      else if (rowErr.code !== '23505') {
        throw new Error(`could not store an item: ${rowErr.message}`)
      }
    }
    return { inserted, skipped: items.length - inserted }
  }

  const inserted = (data ?? []).length
  return { inserted, skipped: items.length - inserted }
}

interface ItemRow {
  id: string
  feed_id: string
  canonical_url: string
  original_url: string
  title: string
  summary: string | null
  published_at: string | null
  author: string | null
  text_content: string | null
  topic_tags: unknown
  entities: unknown
  article_type: unknown
  embedding: number[] | null
  story_cluster_id: string | null
  content_hash: string
}

const fromItemRow = (r: ItemRow): FeedItem => ({
  itemId: r.id,
  feedId: r.feed_id,
  canonicalUrl: r.canonical_url,
  originalUrl: r.original_url,
  title: r.title,
  summary: r.summary,
  publishedAt: r.published_at,
  author: r.author,
  text: r.text_content,
  topicTags: coerceLabels(r.topic_tags),
  entities: coerceLabels(r.entities),
  articleType: coerceArticleType(r.article_type),
  embedding: Array.isArray(r.embedding) ? r.embedding : null,
  storyClusterId: r.story_cluster_id,
  contentHash: r.content_hash,
})

const ITEM_COLUMNS =
  'id, feed_id, canonical_url, original_url, title, summary, published_at, author, ' +
  'text_content, topic_tags, entities, article_type, embedding, story_cluster_id, content_hash'

/**
 * Candidate items for a digest: everything from the user's enabled feeds within
 * the window.
 *
 * Ordered by `published_at` ASCENDING, nulls last. That is not cosmetic — it is
 * what makes `dedupeExact` keep the earliest publication of a duplicated piece,
 * whose date is the correct one. Newest-first would make every syndicated story
 * carry the timestamp of whichever feed picked it up last.
 */
export async function loadCandidates(
  feedIds: string[], windowDays = 14, limit = 1000,
): Promise<FeedItem[]> {
  if (feedIds.length === 0) return []
  const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString()

  const { data, error } = await db()
    .from('suggest_items')
    .select(ITEM_COLUMNS)
    .in('feed_id', feedIds)
    .gte('first_seen_at', cutoff)
    .order('published_at', { ascending: true, nullsFirst: false })
    .limit(limit)
  if (error) throw new Error(`could not load the candidates: ${error.message}`)
  return ((data ?? []) as unknown as ItemRow[]).map(fromItemRow)
}

// ---------------------------------------------------------------------------
// Re-classification
// ---------------------------------------------------------------------------

/** An item whose labels are behind the current classifier. */
export interface StaleItem {
  itemId: string
  feedId: string
  title: string
  summary: string | null
  text: string | null
  /** The publisher's own categories, re-derived from the stored declared tags. */
  declaredTags: string[]
}

/**
 * Items classified by an older version of the classifier.
 *
 * Excludes anything a human has adjudicated — see migration 73. That exclusion
 * is the reason a re-classification pass is safe to run at all: without it, the
 * pass would overwrite corrections and defeat the whole reason classification
 * happens at ingest rather than at read time.
 *
 * Oldest version first, so a corpus spanning several classifier generations
 * converges from the back rather than leaving the oldest rows forever behind a
 * steady trickle of nearly-current ones.
 *
 * The declared tags are recovered from the stored labels rather than re-fetched
 * from the publisher: `confidence: 'declared'` is exactly the set that came
 * from the feed's own categories, and re-fetching the document to learn
 * something already on the row would turn a local pass into a crawl.
 */
export async function staleItems(version: number, limit = 50): Promise<StaleItem[]> {
  const { data, error } = await db()
    .from('suggest_items')
    .select('id, feed_id, title, summary, text_content, topic_tags')
    .lt('classifier_version', version)
    .is('labels_reviewed_at', null)
    .order('classifier_version', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`could not list items needing re-classification: ${error.message}`)

  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    itemId: String(r.id),
    feedId: String(r.feed_id),
    title: String(r.title ?? ''),
    summary: typeof r.summary === 'string' ? r.summary : null,
    text: typeof r.text_content === 'string' ? r.text_content : null,
    declaredTags: coerceLabels(r.topic_tags)
      .filter(t => t.confidence === 'declared')
      .map(t => t.value),
  }))
}

/** How many items are still behind, so a draining backlog is visible. */
export async function staleItemCount(version: number): Promise<number> {
  const { count, error } = await db()
    .from('suggest_items')
    .select('id', { count: 'exact', head: true })
    .lt('classifier_version', version)
    .is('labels_reviewed_at', null)
  if (error) throw new Error(`could not count stale items: ${error.message}`)
  return count ?? 0
}

/**
 * A one-line fingerprint of an item's current labels.
 *
 * Read before a re-classification writes, purely so the pass can report how
 * many rows it actually CHANGED rather than how many it examined. Those two
 * numbers differ a lot — most rows re-label identically — and reporting only
 * the second would make every pass look like it did a great deal of work.
 *
 * A fingerprint rather than the full labels: the comparison only needs to know
 * whether something moved, and holding two complete label sets per row for that
 * is memory spent on a log line.
 */
export async function loadItemLabelSummary(itemId: string): Promise<string | null> {
  const { data, error } = await db()
    .from('suggest_items')
    .select('article_type, entities, topic_tags')
    .eq('id', itemId)
    .maybeSingle()
  if (error || !data) return null
  const r = data as Record<string, unknown>
  const type = coerceArticleType(r.article_type).value
  const entities = coerceLabels(r.entities).length
  const tags = coerceLabels(r.topic_tags).length
  return `${type}/${entities}e/${tags}t`
}

/**
 * Write re-computed labels, and stamp the version that produced them.
 *
 * One row at a time rather than a bulk upsert, and that is deliberate: an
 * upsert over `suggest_items` would need every NOT NULL column in the payload
 * (canonical_url, original_url, content_hash), so a partial object would either
 * fail or, worse, blank them. An UPDATE touches only what it names.
 *
 * `labels_reviewed_at` is never written here. A pass cannot promote its own
 * output to human-reviewed.
 */
export async function saveLabels(
  itemId: string,
  labels: {
    topicTags: Labelled<string>[]
    entities: Labelled<string>[]
    articleType: Labelled<ArticleType>
  },
  version: number,
): Promise<void> {
  const { error } = await db()
    .from('suggest_items')
    .update({
      topic_tags: labels.topicTags,
      entities: labels.entities,
      article_type: labels.articleType,
      classifier_version: version,
    })
    .eq('id', itemId)
  if (error) throw new Error(`could not save the re-computed labels: ${error.message}`)
}

/** Write back the cluster ids a clustering run assigned. */
export async function saveClusterIds(assignment: Map<string, string>): Promise<void> {
  const entries = [...assignment.entries()]
  if (entries.length === 0) return
  // One update per distinct cluster rather than per item: a developing story of
  // twelve items is one statement instead of twelve.
  const byCluster = new Map<string, string[]>()
  for (const [itemId, clusterId] of entries) {
    const list = byCluster.get(clusterId) ?? []
    list.push(itemId)
    byCluster.set(clusterId, list)
  }
  for (const [clusterId, itemIds] of byCluster) {
    const { error } = await db()
      .from('suggest_items')
      .update({ story_cluster_id: clusterId })
      .in('id', itemIds)
    if (error) throw new Error(`could not save the story clusters: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// Interests and settings
// ---------------------------------------------------------------------------

export async function loadInterests(userId: string): Promise<Interest[]> {
  const { data, error } = await db()
    .from('suggest_interests')
    .select('id, name, kind, weight, parent_interest_id, explicit_feedback')
    .eq('user_id', userId)
  if (error) throw new Error(`could not load the interests: ${error.message}`)

  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    interestId: String(r.id),
    name: String(r.name),
    kind: r.kind === 'entity' || r.kind === 'question' ? r.kind : 'topic',
    weight: typeof r.weight === 'number' ? r.weight : 0.5,
    parentInterestId: typeof r.parent_interest_id === 'string' ? r.parent_interest_id : null,
    explicitFeedback: !!r.explicit_feedback,
  }))
}

/** Persist weights the feedback loop moved. Only the rows that changed. */
export async function saveInterestWeights(userId: string, interests: Interest[]): Promise<void> {
  if (interests.length === 0) return
  const rows = interests.map(i => ({
    id: i.interestId,
    user_id: userId,
    name: i.name,
    kind: i.kind,
    weight: i.weight,
    parent_interest_id: i.parentInterestId,
    explicit_feedback: i.explicitFeedback,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await db().from('suggest_interests').upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`could not save the interest weights: ${error.message}`)
}

export interface SuggestSettings {
  weights: ScoreWeights | null
  plan: { bucket: Bucket; slots: number }[] | null
  regions: string[]
  desiredTopics: string[]
  qualityFloor: number | null
  /** When learned weights were last decayed. Null = never. See migration 72. */
  decayedAt: string | null
  /** When a digest was last BUILT and stored. Previews do not count. */
  digestBuiltAt: string | null
}

/**
 * A user's settings, with nulls meaning "use the code's defaults".
 *
 * Null rather than a stored copy of the defaults, deliberately. Writing the
 * defaults at signup pins a user to whatever they were that day, and the whole
 * §3 claim is that they are "starting points, not facts about your
 * preferences" — which requires that improving them improves the feed for
 * everybody who never touched a slider.
 */
export async function loadSettings(userId: string): Promise<SuggestSettings> {
  const { data, error } = await db()
    .from('suggest_settings')
    .select('weights, plan, regions, desired_topics, quality_floor, decayed_at, digest_built_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`could not load the feed settings: ${error.message}`)

  const r = (data ?? {}) as Record<string, unknown>
  return {
    weights: (r.weights as ScoreWeights | null) ?? null,
    plan: (r.plan as { bucket: Bucket; slots: number }[] | null) ?? null,
    regions: Array.isArray(r.regions) ? (r.regions as string[]) : [],
    desiredTopics: Array.isArray(r.desired_topics) ? (r.desired_topics as string[]) : [],
    qualityFloor: typeof r.quality_floor === 'number' ? r.quality_floor : null,
    decayedAt: typeof r.decayed_at === 'string' ? r.decayed_at : null,
    digestBuiltAt: typeof r.digest_built_at === 'string' ? r.digest_built_at : null,
  }
}

/**
 * Stamp a maintenance step as done.
 *
 * Separate from `saveSettings` because it is written on a page visit and must
 * not be able to clobber a preference: a `saveSettings` call carrying a partial
 * patch is a user editing their settings, and this is housekeeping. Keeping
 * them apart means a bug in one cannot silently reset the other.
 */
export async function stampMaintenance(
  userId: string, patch: { decayedAt?: string; digestBuiltAt?: string },
): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId }
  if (patch.decayedAt) row.decayed_at = patch.decayedAt
  if (patch.digestBuiltAt) row.digest_built_at = patch.digestBuiltAt
  if (Object.keys(row).length === 1) return

  const { error } = await db()
    .from('suggest_settings')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`could not record the maintenance run: ${error.message}`)
}

export async function saveSettings(
  userId: string, patch: Partial<SuggestSettings>,
): Promise<void> {
  const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() }
  if ('weights' in patch) row.weights = patch.weights
  if ('plan' in patch) row.plan = patch.plan
  if ('regions' in patch) row.regions = patch.regions
  if ('desiredTopics' in patch) row.desired_topics = patch.desiredTopics
  if ('qualityFloor' in patch) row.quality_floor = patch.qualityFloor

  const { error } = await db()
    .from('suggest_settings')
    .upsert(row, { onConflict: 'user_id' })
  if (error) throw new Error(`could not save the feed settings: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Digests
// ---------------------------------------------------------------------------

/**
 * Store a digest and its slots.
 *
 * The digest row and its items are written together because §6 reads them
 * together: a digest row with no items reports a 0% relevance rate over zero
 * ratings, which `measure` would correctly return as null but which the
 * coverage-gap list would read as "nothing covered anything".
 *
 * `backfilled` comes off `SelectedItem` rather than being inferred. It cannot
 * be recovered at read time — a back-filled core item and a qualified one look
 * identical in a row — so the selector sets it and this copies it through.
 */
export async function recordDigest(
  userId: string,
  digest: Digest,
  opts: { clusterIds?: Map<string, string> } = {},
): Promise<string> {
  const { data, error } = await db()
    .from('suggest_digests')
    .insert({
      user_id: userId,
      weights: digest.weights,
      plan: digest.plan,
      gaps: digest.gaps,
      notes: digest.notes,
      candidates_considered: digest.items.length + digest.rejected.length,
      candidates_rejected: digest.rejected.length,
    })
    .select('id')
    .single()
  if (error) throw new Error(`could not record the digest: ${error.message}`)

  const digestId = (data as { id: string }).id
  if (digest.items.length === 0) return digestId

  const rows = digest.items.map((s, position) => ({
    digest_id: digestId,
    user_id: userId,
    item_id: s.scored.item.itemId,
    bucket: s.bucket,
    position,
    parts: s.scored.parts,
    base: s.scored.base,
    selection_score: s.selectionScore,
    penalties: s.penalties,
    because: s.scored.because,
    matched_interests: s.scored.matchedInterests,
    bridge_from: s.scored.bridgeFrom,
    bridge_to: s.scored.bridgeTo,
    also_qualified_for: s.alsoQualifiedFor,
    backfilled: s.backfilled,
    story_cluster_id:
      opts.clusterIds?.get(s.scored.item.itemId) ?? s.scored.item.storyClusterId ?? null,
  }))

  const { error: itemErr } = await db().from('suggest_digest_items').insert(rows)
  if (itemErr) throw new Error(`could not record the digest items: ${itemErr.message}`)
  return digestId
}

export interface StoredDigestItem extends ShownItem {
  title: string
  url: string
  summary: string | null
  feedName: string
  publishedAt: string | null
  articleType: string
  base: number
  parts: Record<string, number>
  because: Record<string, string>
  matchedInterests: string[]
  bridgeFrom: string | null
  bridgeTo: string | null
  alsoQualifiedFor: string[]
}

interface DigestItemRow {
  item_id: string
  bucket: string
  position: number
  parts: unknown
  base: number
  because: unknown
  matched_interests: string[] | null
  bridge_from: string | null
  bridge_to: string | null
  also_qualified_for: string[] | null
  backfilled: boolean
  story_cluster_id: string | null
  suggest_items: {
    title: string
    canonical_url: string
    summary: string | null
    published_at: string | null
    feed_id: string
    topic_tags: unknown
    article_type: unknown
    suggest_feeds: { name: string } | null
  } | null
}

/**
 * The most recent digest, fully hydrated.
 *
 * Returns null when the user has never had one, which the caller must handle as
 * "not generated yet" rather than as "empty feed". The two look identical in a
 * list of zero items and have completely different fixes.
 */
export async function loadLatestDigest(userId: string): Promise<{
  digestId: string
  generatedAt: string
  weights: ScoreWeights
  gaps: unknown[]
  notes: string[]
  items: StoredDigestItem[]
} | null> {
  const { data: head, error: headErr } = await db()
    .from('suggest_digests')
    .select('id, generated_at, weights, gaps, notes')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (headErr) throw new Error(`could not load the digest: ${headErr.message}`)
  if (!head) return null

  const h = head as Record<string, unknown>
  const digestId = String(h.id)

  const { data, error } = await db()
    .from('suggest_digest_items')
    .select(
      'item_id, bucket, position, parts, base, because, matched_interests, bridge_from, ' +
      'bridge_to, also_qualified_for, backfilled, story_cluster_id, ' +
      'suggest_items(title, canonical_url, summary, published_at, feed_id, topic_tags, article_type, suggest_feeds(name))',
    )
    .eq('digest_id', digestId)
    .order('position', { ascending: true })
  if (error) throw new Error(`could not load the digest items: ${error.message}`)

  const items: StoredDigestItem[] = ((data ?? []) as unknown as DigestItemRow[])
    .filter(r => !!r.suggest_items)
    .map(r => ({
      itemId: r.item_id,
      bucket: r.bucket as Bucket,
      feedId: r.suggest_items!.feed_id,
      topicTags: coerceLabels(r.suggest_items!.topic_tags).map(t => t.value),
      clusterId: r.story_cluster_id ?? r.item_id,
      backfilled: r.backfilled,
      title: r.suggest_items!.title,
      url: r.suggest_items!.canonical_url,
      summary: r.suggest_items!.summary,
      feedName: r.suggest_items!.suggest_feeds?.name ?? 'an unnamed feed',
      publishedAt: r.suggest_items!.published_at,
      articleType: coerceArticleType(r.suggest_items!.article_type).value,
      base: r.base,
      parts: (r.parts ?? {}) as Record<string, number>,
      because: (r.because ?? {}) as Record<string, string>,
      matchedInterests: r.matched_interests ?? [],
      bridgeFrom: r.bridge_from,
      bridgeTo: r.bridge_to,
      alsoQualifiedFor: r.also_qualified_for ?? [],
    }))

  return {
    digestId,
    generatedAt: String(h.generated_at),
    weights: h.weights as ScoreWeights,
    gaps: Array.isArray(h.gaps) ? (h.gaps as unknown[]) : [],
    notes: Array.isArray(h.notes) ? (h.notes as string[]) : [],
    items,
  }
}

/**
 * Token sets of recently-shown items, for novelty.
 *
 * Returns the TITLES and tags rather than token sets, because tokenizing is the
 * caller's job and importing `tags.ts` here would make this module depend on
 * the scoring half of the pipeline it exists to serve.
 */
export async function recentlyShown(
  userId: string, windowDays = 28, limit = 200,
): Promise<{ title: string; topicTags: string[] }[]> {
  const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const { data, error } = await db()
    .from('suggest_digest_items')
    .select('suggest_items(title, topic_tags), suggest_digests!inner(generated_at)')
    .eq('user_id', userId)
    .gte('suggest_digests.generated_at', cutoff)
    .limit(limit)
  if (error) throw new Error(`could not load what was recently shown: ${error.message}`)

  return ((data ?? []) as unknown as { suggest_items: { title: string; topic_tags: unknown } | null }[])
    .filter(r => !!r.suggest_items)
    .map(r => ({
      title: r.suggest_items!.title,
      topicTags: coerceLabels(r.suggest_items!.topic_tags).map(t => t.value),
    }))
}

/** Cluster ids shown in the window before this one, for the duplicate rate. */
export async function previousClusterIds(
  userId: string, beforeDigestId: string, windowDays = 14,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const { data, error } = await db()
    .from('suggest_digest_items')
    .select('story_cluster_id, suggest_digests!inner(generated_at)')
    .eq('user_id', userId)
    .neq('digest_id', beforeDigestId)
    .gte('suggest_digests.generated_at', cutoff)
  if (error) throw new Error(`could not load the previous clusters: ${error.message}`)

  return [...new Set(
    ((data ?? []) as Record<string, unknown>[])
      .map(r => r.story_cluster_id)
      .filter((c): c is string => typeof c === 'string'),
  )]
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

const EXPLICIT_KINDS: ReadonlySet<string> = new Set<FeedbackKind>([
  'more_like_this', 'less_like_this', 'interesting_not_useful', 'already_saw', 'worth_seeing',
])

export const isExplicitFeedback = (kind: string) => EXPLICIT_KINDS.has(kind)

export async function recordFeedback(
  userId: string,
  f: { itemId: string; kind: string; value?: number | null; digestId?: string | null; shownAsBucket?: string | null },
): Promise<void> {
  const { error } = await db().from('suggest_feedback').insert({
    user_id: userId,
    item_id: f.itemId,
    digest_id: f.digestId ?? null,
    kind: f.kind,
    value: f.value ?? null,
    shown_as_bucket: f.shownAsBucket ?? null,
  })
  if (error) throw new Error(`could not record the feedback: ${error.message}`)
}

/**
 * Explicit feedback within a window, as `measure` wants it.
 *
 * Weak signals are excluded, and that is not an omission. §6's relevance rate
 * is a share of *rated* items, and counting a click as a rating is precisely
 * the move that turns a usefulness measurement into an engagement measurement —
 * which the spec's closing warning is about.
 */
export async function loadFeedback(
  userId: string, windowDays = 14,
): Promise<Feedback[]> {
  const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const { data, error } = await db()
    .from('suggest_feedback')
    .select('item_id, kind, created_at, shown_as_bucket')
    .eq('user_id', userId)
    .gte('created_at', cutoff)
  if (error) throw new Error(`could not load the feedback: ${error.message}`)

  return ((data ?? []) as Record<string, unknown>[])
    .filter(r => isExplicitFeedback(String(r.kind)))
    .map(r => ({
      itemId: String(r.item_id),
      kind: String(r.kind) as FeedbackKind,
      at: String(r.created_at),
      shownAsBucket: (typeof r.shown_as_bucket === 'string' ? r.shown_as_bucket : 'core') as Bucket,
    }))
}
