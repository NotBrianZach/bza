/**
 * Turning what a feed emitted into something comparable.
 *
 * Every function here is total and pure: given junk it returns a defensible
 * value rather than throwing, because the input is other people's XML and a
 * single malformed `<pubDate>` must not take down a poll of forty feeds.
 *
 * The one thing to understand before changing anything in this file:
 * **canonicalization is lossy and occasionally wrong.** Stripping query
 * parameters is how the same article arriving from four feeds becomes one row,
 * and it is also how a publisher whose article id *is* a query parameter gets
 * its URLs collapsed into one. That is why `FeedItem` keeps `originalUrl`
 * alongside `canonicalUrl` — the canonical form is the dedup key, the original
 * is the recovery path, and the link offered to the user comes from the
 * canonical one only because that is the form that was deduplicated against.
 */

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

/**
 * Parameters that identify a *referral*, not a document.
 *
 * Deliberately a allow-list-shaped deny-list: an unknown parameter is KEPT.
 * The opposite default — keep only a known-good set — would silently destroy
 * every site whose article id is `?p=1234` or `?story_fbid=…`, and the failure
 * would look like two different articles merging rather than like a bug in a
 * URL cleaner.
 */
const TRACKING_PARAMS = [
  /^utm_/,
  /^ga_/,
  /^mc_(cid|eid)$/,
  /^_hs(enc|mi)$/,
  /^(fbclid|gclid|dclid|msclkid|twclid|igshid|yclid|wbraid|gbraid)$/,
  /^(ref|ref_src|ref_url|referrer|source|src)$/,
  /^(cmpid|campaign_id|at_medium|at_campaign|at_custom\d)$/,
  /^(sh|share|shared|smid|smtyp)$/,
  /^(spm|scm)$/,
  /^__twitter_impression$/,
  /^guccounter$/,
  /^outputType$/,
]

const isTracking = (key: string) => TRACKING_PARAMS.some(re => re.test(key))

/**
 * The comparable form of a URL.
 *
 * Returns the input unchanged when it cannot be parsed. A feed that emits
 * `javascript:` or a bare path gets no special handling beyond that: this is a
 * normalizer, and refusing a scheme is the fetcher's job, not this function's.
 *
 * What it does, in order, and why each step is safe:
 *  - lowercases scheme and host only (paths are case-sensitive on most servers,
 *    and lowercasing one is how you 404 a Wikipedia article)
 *  - upgrades a bare `http` host to nothing — the scheme is *kept*, because
 *    rewriting it to https is a guess about the server, and a wrong guess here
 *    silently splits one article into two rows the day a publisher's redirect
 *    changes
 *  - drops `www.` and a default port
 *  - drops tracking parameters and sorts what remains, so parameter order
 *    stops being a distinction
 *  - drops the fragment, except a `#!` path, which is the one case where the
 *    fragment names the document
 *  - strips one trailing slash, and an `/amp` or `/amp/` suffix
 */
export function canonicalUrl(raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    return trimmed
  }

  u.protocol = u.protocol.toLowerCase()
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '')
  if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
    u.port = ''
  }

  const kept: [string, string][] = []
  for (const [k, v] of u.searchParams) {
    if (!isTracking(k)) kept.push([k, v])
  }
  kept.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])))
  // Rebuilt rather than mutated: deleting from a live URLSearchParams while
  // iterating it skips entries, which is the kind of bug that shows up as "some
  // utm params survive" and not as a crash.
  const search = new URLSearchParams(kept).toString()
  u.search = search ? `?${search}` : ''

  // `#!` was Google's crawlable-AJAX convention and some archives still serve it;
  // in that one case the fragment is the document id, so it stays.
  const hashBang = u.hash.startsWith('#!') ? u.hash : ''
  u.hash = ''

  // Trailing slash first, then `/amp`, then the slash the amp segment left
  // behind. Order matters: `/article/amp/` needs all three passes, and a single
  // combined pattern that tried to do it at once was unreadable and wrong.
  const out = u.toString()
    .replace(/\/+$/, '')
    .replace(/\/amp$/i, '')
    .replace(/\/+$/, '')
  return out + hashBang
}

/**
 * Whether two URLs are the same document as far as this pipeline is concerned.
 * Thin, but named, because `canonicalUrl(a) === canonicalUrl(b)` at a call site
 * reads like an optimisation and this reads like a decision.
 */
export const sameDocument = (a: string, b: string) => canonicalUrl(a) === canonicalUrl(b)

/** The display name of a source, when the feed did not supply one. */
export function publisherFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** Collapse the whitespace zoo that CDATA sections arrive full of. */
export function normalizeWhitespace(raw: string | null | undefined): string {
  return (raw ?? '')
    .replace(/ /g, ' ')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&#39;': "'", '&#039;': "'", '&#x27;': "'", '&#x2F;': '/', '&nbsp;': ' ',
  '&mdash;': '—', '&ndash;': '–', '&hellip;': '…', '&rsquo;': '’',
  '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”',
}

/**
 * Strip tags and decode the entities that actually appear in feeds.
 *
 * Not an HTML parser and not trying to be. Feed summaries are the only input,
 * the output is never rendered as HTML (it is scored, clustered and shown as
 * text), so the failure mode of an incomplete decode is a stray `&#8212;` in a
 * summary — not an injection. A real parser here would be a dependency bought
 * for a cosmetic gain.
 */
export function stripHtml(raw: string | null | undefined): string {
  let s = (raw ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
  for (const [ent, ch] of Object.entries(ENTITIES)) s = s.split(ent).join(ch)
  s = s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  return normalizeWhitespace(s)
}

/**
 * Split "Headline - The Publisher" into its two halves.
 *
 * Aggregators — Google News above all — append the publisher to every title.
 * Left in place, the suffix is a *similarity signal that points the wrong way*:
 * two reports of the same event from different outlets look less alike than
 * two unrelated stories from the same outlet. Clustering compares the headline
 * half only.
 *
 * Conservative on purpose. The separator must be a spaced dash and the tail must
 * look like a name — short, few words, no sentence punctuation — because
 * headlines contain dashes for their own reasons ("Inflation cools - for now").
 */
export function splitTitlePublisher(title: string): { headline: string; publisher: string | null } {
  const t = normalizeWhitespace(title)
  const m = t.match(/^(.*\S)\s+[-–—]\s+([^-–—]{2,40})$/)
  if (!m) return { headline: t, publisher: null }
  const tail = m[2].trim()
  const words = tail.split(/\s+/)
  const looksLikeName =
    words.length <= 5 &&
    !/[.!?,;:]$/.test(tail) &&
    // A name starts with a capital or a digit-free word; "for now" does not.
    /^[A-Z0-9]/.test(tail)
  return looksLikeName ? { headline: m[1].trim(), publisher: tail } : { headline: t, publisher: null }
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Parse a feed date to an ISO string, or null.
 *
 * Null rather than "now" when it cannot be read, and this matters: defaulting a
 * missing date to the poll time makes every undated item maximally fresh, which
 * is precisely backwards — an item with no date is an item we know nothing about
 * the timeliness of. score.ts treats null freshness as the neutral mid-value and
 * says so in its `because` string.
 *
 * A future date is clamped to the parse moment the caller passes in. Feeds get
 * timezones wrong often enough that "published in six hours" is common, and an
 * unclamped future date is the top of every freshness ranking forever.
 */
export function parseFeedDate(raw: string | null | undefined, now: string): string | null {
  const s = normalizeWhitespace(raw)
  if (!s) return null
  const ms = Date.parse(s)
  if (!Number.isFinite(ms)) return null
  const nowMs = Date.parse(now)
  const clamped = Number.isFinite(nowMs) && ms > nowMs ? nowMs : ms
  return new Date(clamped).toISOString()
}

/** Whole hours between two ISO instants. Negative is clamped to 0. */
export function hoursBetween(earlier: string | null, later: string): number {
  if (!earlier) return Number.POSITIVE_INFINITY
  const a = Date.parse(earlier)
  const b = Date.parse(later)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY
  return Math.max(0, (b - a) / 3_600_000)
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/**
 * FNV-1a over the normalized text, as 16 hex digits.
 *
 * A dedup key, NOT a security hash, and the distinction is the reason this is
 * not `crypto.subtle.digest`: that API is async, it would make every function
 * downstream of it async, and the property actually needed here is "two equal
 * strings hash equally, cheaply, synchronously, on Workers and in Node". A
 * deliberate collision is not a threat model — an attacker who can choose your
 * feed items can already choose your feed items.
 */
export function contentHash(...parts: (string | null | undefined)[]) {
  const text = parts.map(p => normalizeWhitespace(p).toLowerCase()).join(' ')
  let h = 0xcbf29ce484222325n
  const prime = 0x100000001b3n
  const mask = 0xffffffffffffffffn
  for (let i = 0; i < text.length; i++) {
    h = (h ^ BigInt(text.charCodeAt(i) & 0xff)) * prime & mask
    // Characters above U+00FF contribute their high byte too, so that two
    // strings differing only outside Latin-1 do not hash alike.
    const hi = text.charCodeAt(i) >> 8
    if (hi) h = (h ^ BigInt(hi)) * prime & mask
  }
  return h.toString(16).padStart(16, '0')
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/** What a fetched feed entry looks like before this module has touched it. */
export interface RawEntry {
  title?: string | null
  url?: string | null
  summary?: string | null
  content?: string | null
  published?: string | null
  author?: string | null
  categories?: string[] | null
}

export interface NormalizedEntry {
  canonicalUrl: string
  originalUrl: string
  title: string
  /** The headline with an aggregator's publisher suffix removed. */
  headline: string
  /** The publisher the suffix named, when there was one. */
  titlePublisher: string | null
  summary: string | null
  text: string | null
  publishedAt: string | null
  author: string | null
  /** The feed's own categories, lowercased and de-duplicated. */
  declaredTags: string[]
  contentHash: string
}

/**
 * One raw entry, normalized. `null` when there is nothing to key on.
 *
 * A missing URL *and* a missing title is the only rejection: with neither there
 * is no identity and no content, so the row could never be deduplicated against
 * or shown. Everything else degrades to a nullable field, because the
 * alternative — refusing entries with no date, or no summary — discards real
 * articles from feeds that are merely sparse.
 */
export function normalizeEntry(raw: RawEntry, now: string): NormalizedEntry | null {
  const original = (raw.url ?? '').trim()
  const title = normalizeWhitespace(stripHtml(raw.title))
  if (!original && !title) return null

  const summary = stripHtml(raw.summary) || null
  const text = stripHtml(raw.content) || null
  const { headline, publisher } = splitTitlePublisher(title)

  const declaredTags = [...new Set(
    (raw.categories ?? [])
      .map(c => normalizeWhitespace(c).toLowerCase())
      .filter(c => c.length > 1 && c.length <= 60),
  )]

  return {
    canonicalUrl: canonicalUrl(original),
    originalUrl: original,
    title,
    headline,
    titlePublisher: publisher,
    summary,
    text,
    publishedAt: parseFeedDate(raw.published, now),
    author: normalizeWhitespace(raw.author) || null,
    declaredTags,
    // Hashed over the HEADLINE, not the full title: an aggregator that appends
    // its own publisher name would otherwise defeat exact-duplicate detection
    // for the one case it is most needed, the same wire story on four feeds.
    contentHash: contentHash(headline, summary ?? text ?? ''),
  }
}
