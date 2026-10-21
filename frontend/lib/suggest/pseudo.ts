/**
 * Turning HN / Reddit / 4chan posts into things the digest can score.
 *
 * The pinned-feed list is mostly `feed://` URLs — three of the four defaults
 * are — so an integration that could only take http(s) RSS would import almost
 * nothing. These sources therefore have to reach the pipeline, and the only
 * question is what honestly maps onto a `RawEntry`.
 *
 * ── What maps, and what is deliberately dropped ───────────────────────────
 *
 * title, url, body and date map directly. Author maps. What does NOT map is
 * **score and comment count**, and dropping them is the point rather than an
 * omission: they are popularity, and popularity is precisely what this feed is
 * built not to rank by. Feeding `score` into relevance or quality would make
 * the digest an upvote-ordered list with extra steps — the single thing §6's
 * closing warning is about.
 *
 * They are not lost, either. The existing feed browser still shows them; this
 * is about what the SELECTOR is allowed to see.
 *
 * ── Categories ────────────────────────────────────────────────────────────
 *
 * A subreddit and a board are genuinely a declared category — somebody filed
 * the post there — so `r/programming` and `/g/` become declared tags, which is
 * the one `confidence: 'declared'` topic signal these sources offer. HN has no
 * such thing and gets none, rather than being given a fake "technology".
 */

import type { FeedPost } from '@/lib/feedSources'
import type { RawEntry } from './normalize'

/**
 * One post as a feed entry.
 *
 * `commentsUrl` is not used as the url even when the post is a link-out. The
 * digest's canonical URL has to be the DOCUMENT, because that is what dedup
 * compares and what the reader opens — two aggregators linking the same
 * article must collapse to one item, and they only do if both point at the
 * article rather than at their own discussion pages.
 */
export function postToEntry(post: FeedPost): RawEntry {
  const categories: string[] = []
  if (post.subreddit) categories.push(`r/${post.subreddit}`)
  if (post.board) categories.push(`/${post.board}/`)

  return {
    title: post.title,
    url: post.url,
    // `body` is the self-post text or the thread's opening comment. Passed as
    // `summary` rather than `content` because that is what it is — a lead, not
    // the article — and `summary` is what the classifier weights.
    summary: post.body ?? null,
    content: null,
    published: post.date ?? null,
    author: post.author ?? null,
    categories,
  }
}

/**
 * The source type a pseudo-feed should default to.
 *
 * All three are aggregators of other people's writing, which is closest to
 * `commentary` — and that carries the lowest quality prior, which is the right
 * default for a link aggregator where the item's own evidence is, structurally,
 * somewhere else. The user can change it per subscription; this is only the
 * starting point.
 *
 * NOT `wire`: a wire is an agency producing original copy that others
 * syndicate, which is the opposite relationship.
 */
export const PSEUDO_SOURCE_TYPE = 'commentary'

// ---------------------------------------------------------------------------
// Adopting the pinned list
// ---------------------------------------------------------------------------

import { canonicalFeedUrl, labelForFeedUrl, parseFeedUrl } from '@/lib/feedSources'
import { canonicalUrl, publisherFromUrl } from './normalize'

/**
 * The canonical key for any source, whichever shape it is, or null.
 *
 * One function, used by every caller that has to decide whether two spellings
 * are the same source. They would disagree otherwise — the first time one of
 * them forgot that `feed://hn/top` collapses onto `feed://hn`, an "is this
 * already subscribed?" check would answer no for a feed that was, and the
 * adopt would overwrite its label.
 *
 * Null means the string is neither a usable http(s) URL nor a recognised
 * `feed://` source. Callers surface that rather than dropping it: the pinned
 * list legitimately contains things the digest cannot score, and "it vanished"
 * is a worse answer than the reason.
 */
export function sourceKey(raw: string): string | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null
  if (parseFeedUrl(trimmed)) return canonicalFeedUrl(trimmed)
  const url = canonicalUrl(trimmed)
  return /^https?:\/\//i.test(url) ? url : null
}

/** A display name for a source, from whatever the caller knows. */
export function sourceName(key: string, label?: string | null): string {
  return label?.trim()
    || (parseFeedUrl(key) ? labelForFeedUrl(key) : null)
    || publisherFromUrl(key)
    || key
}

/** The default source type: aggregators are commentary, everything else specialist. */
export function defaultSourceType(key: string): string {
  return parseFeedUrl(key) ? PSEUDO_SOURCE_TYPE : 'specialist'
}
