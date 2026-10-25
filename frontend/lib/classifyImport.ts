/**
 * One place that decides what an imported page is.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * The decision was being made twice, differently, and the two had drifted:
 *
 *   /api/extension/import  checked the URL — wikipedia.org, then
 *                          news.ycombinator.com — and defaulted to 'essay'.
 *   components/upload/UrlTab  checked the FETCH TYPE — pdf, wikipedia,
 *                          youtube — and defaulted to whatever the picker
 *                          happened to hold, which is 'fiction'.
 *
 * So the same Hacker News link became a `forum_thread` through the extension
 * and a `fiction` through the URL tab, and neither knew about the other. 61 of
 * the library's 79 'fiction' books had a source_url, which is to say they were
 * web pages filed as novels — 30 of them Hacker News threads.
 *
 * Both callers now ask this. A rule added here applies to every import path at
 * once, which is the property the two copies could not have.
 *
 * ── Ordered most specific first, and the order is the rule ────────────────
 *
 * A Wikipedia article reached through a Hacker News link is still a Wikipedia
 * article, so the host of the *content* wins over the host of the referrer.
 * Below that, a forum thread is a forum thread whatever it links to — the
 * fetched text is the discussion, not the linked article, which is exactly why
 * those 30 books carry the linked article's title and the thread's URL.
 *
 * ── 'essay' is the default, and it is a real choice ───────────────────────
 *
 * Of the twelve values `books_content_type_check` allows, 'essay' is the
 * neutral long-form-prose bucket. It is what an unknown web page most often
 * is, it is reachable from the picker so a reader can correct it, and it does
 * not assert anything false — unlike 'fiction', which claims a news wire is a
 * novel, or 'news_article', which would be wrong for every blog post and
 * documentation page.
 */

export type ImportContentType =
  | 'fiction' | 'textbook' | 'academic_paper' | 'math_textbook' | 'wikipedia_article'
  | 'news_article' | 'forum_thread' | 'essay' | 'reference' | 'biography'
  | 'chat_book' | 'manga'

/**
 * Hosts whose pages are a discussion rather than the thing discussed.
 *
 * Matched as a suffix on the hostname rather than a substring of the whole
 * URL, so a link to an article ABOUT Hacker News is not itself filed as a
 * thread. `includes('news.ycombinator.com')` — which is what the extension
 * route did — matches any URL with that string anywhere in it, query string
 * included.
 */
const FORUM_HOSTS = [
  'news.ycombinator.com', 'lobste.rs', 'reddit.com', '4chan.org', 'slashdot.org',
]

const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com']

const hostOf = (url: string | null | undefined): string | null => {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase() } catch { return null }
}

const hostMatches = (host: string | null, list: string[]) =>
  !!host && list.some(h => host === h || host.endsWith(`.${h}`))

export interface ImportSignals {
  /** What /api/fetch-url said: pdf | rss | transcript | webpage | wikipedia | youtube. */
  fetchType?: string | null
  /** The page's own URL. */
  sourceUrl?: string | null
  /** The capture extension's own hint, where it has one. */
  sourceType?: string | null
}

/**
 * The content type for an import, or null to leave the caller's choice alone.
 *
 * Null rather than a default is returned ONLY when there is no signal at all —
 * no fetch type and no URL — which is the file-upload case, where the picker's
 * value is the reader's own answer and must not be overwritten.
 */
export function classifyImport(signals: ImportSignals): ImportContentType | null {
  const { fetchType, sourceUrl, sourceType } = signals
  const host = hostOf(sourceUrl)
  if (!fetchType && !host && !sourceType) return null

  // Content host beats referrer: a Wikipedia article is one however it was found.
  if (fetchType === 'wikipedia' || hostMatches(host, ['wikipedia.org'])) return 'wikipedia_article'

  // A thread is the discussion, not the link it carries.
  if (hostMatches(host, FORUM_HOSTS)) return 'forum_thread'

  // Spoken long-form prose. Same reasoning as any other transcript.
  if (fetchType === 'youtube' || fetchType === 'transcript'
    || sourceType === 'youtube' || hostMatches(host, VIDEO_HOSTS)) return 'essay'

  if (fetchType === 'pdf') return 'academic_paper'

  // A feed item is a news article far more often than it is anything else.
  if (fetchType === 'rss') return 'news_article'

  return 'essay'
}
