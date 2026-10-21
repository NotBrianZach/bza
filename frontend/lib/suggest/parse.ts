/**
 * Reading RSS and Atom, for the suggested feed.
 *
 * ── Why this is not app/api/fetch-url's parseRSSFeed ───────────────────────
 *
 * That function exists and reads the same two formats, and reusing it was the
 * first thing tried. It does not fit, on four counts, and all four are about
 * its contract rather than its quality:
 *
 *  1. It converts item bodies to **markdown**, because its consumer renders a
 *     browsable preview. This pipeline tokenizes the body; markdown syntax is
 *     noise in a token stream, and `**bold**` becomes the token `bold` either
 *     way, so the conversion is pure loss here.
 *  2. It **caps at 30 items**, which is right for a preview pane and wrong for
 *     a weekly poll: a busy feed publishes more than 30 in a week and the
 *     surplus would be silently invisible.
 *  3. It drops **categories**. The spec's classification step is "start with
 *     feed tags and keywords", and the feed's own categories are the only
 *     `confidence: 'declared'` topic signal there is.
 *  4. It drops **author**.
 *
 * Changing it to suit this caller would change the feed browser's behaviour on
 * all four counts. So there are two parsers for one format, which is a real
 * duplication and is the cheaper of the two mistakes available.
 *
 * ── What this is honest about ─────────────────────────────────────────────
 *
 * It is regex over XML, which is not a parser. It handles the shapes feeds
 * actually ship — including the ones that are malformed in the usual ways — and
 * it will mis-read a feed that nests `<item>` inside `<item>` or that puts an
 * unescaped `</item>` in a CDATA section. The mitigation is not a better regex,
 * it is that every field is optional downstream: a mis-read entry produces a
 * row with a missing summary or a missing date, both of which the pipeline
 * already treats as information rather than as an error. Nothing here can
 * produce a *wrong* date or a *wrong* URL, only an absent one.
 *
 * A real XML parser is the right upgrade and is a dependency decision, not a
 * code decision — it would have to run on Workers and in Node.
 */

import type { RawEntry } from './normalize'

/** Strip CDATA wrappers and trim. */
const cdata = (s: string): string =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()

/**
 * Decode the named and numeric entities feeds carry.
 *
 * Deliberately NOT exhaustive and deliberately not a dependency. `stripHtml` in
 * normalize.ts runs over everything this returns and decodes the same set, so
 * the two together cover the common cases twice — which is why an entity missed
 * here shows up as a literal `&mdash;` in a summary rather than as a parse
 * failure.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16)
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ''
    })
    // LAST, not first. `&amp;lt;` must decode to the literal text "&lt;" and
    // not to "<" — doing ampersand first turns it into `&lt;` and the pass
    // above then turns that into a tag delimiter.
    .replace(/&amp;/g, '&')
}

const first = (block: string, ...patterns: RegExp[]): string | null => {
  for (const re of patterns) {
    const m = block.match(re)
    if (m && m[1] !== undefined) {
      const v = decodeEntities(cdata(m[1]))
      if (v) return v
    }
  }
  return null
}

/**
 * Categories on one entry.
 *
 * Both spellings: RSS puts the value in the element text, Atom puts it in a
 * `term` attribute. Feeds in the wild do both, sometimes in the same document,
 * so both are collected and de-duplicated rather than one being chosen by
 * format — a feed that declares `<feed>` and then uses RSS-style categories is
 * common enough that format-switching here loses real tags.
 */
function categoriesIn(block: string): string[] {
  const out: string[] = []
  for (const m of block.matchAll(/<category[^>]*\bterm="([^"]*)"/gi)) {
    const v = decodeEntities(m[1]).trim()
    if (v) out.push(v)
  }
  for (const m of block.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)) {
    const v = decodeEntities(cdata(m[1])).trim()
    if (v) out.push(v)
  }
  return [...new Set(out)]
}

/**
 * The link on an Atom entry.
 *
 * `rel="alternate"` or no rel at all is the document. A bare "first href wins"
 * reads `rel="enclosure"` on a podcast feed and returns the audio file, and
 * `rel="replies"` on a comment-enabled feed and returns the comment thread —
 * both of which look like working links and point at the wrong thing.
 */
function atomLink(block: string): string | null {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map(m => m[1])
  for (const attrs of links) {
    const rel = attrs.match(/\brel="([^"]*)"/i)?.[1]
    if (rel && rel !== 'alternate') continue
    const href = attrs.match(/\bhref="([^"]*)"/i)?.[1]
    if (href) return decodeEntities(href)
  }
  return null
}

export interface ParsedFeed {
  feedTitle: string | null
  /** The feed's self-declared language, when it has one. */
  language: string | null
  entries: RawEntry[]
  /**
   * Whether the document is a feed at all.
   *
   * This distinction cost a junk subscription on the first live run: pointing
   * the "add a source" route at `https://example.com/` parsed an HTML page to
   * zero entries, and zero entries was treated as "an empty feed" — which is a
   * legitimate thing — so the page was subscribed and then contributed nothing
   * to every digest forever.
   *
   * An empty feed and a document that is not a feed are genuinely different
   * and genuinely distinguishable: a feed declares itself with an `<rss>`,
   * `<feed>` or `<channel>` root. So `isFeedDocument` is false for the HTML
   * page and true for the empty feed, and the caller can reject one while
   * accepting the other with a warning.
   */
  isFeedDocument: boolean
}

/** Does this document declare itself a feed, regardless of how many items it has? */
function looksLikeFeed(xml: string): boolean {
  // Only the first 4KB: a feed's root element is at the top, and an HTML page
  // that happens to quote "<channel>" in its body should not pass.
  const head = xml.slice(0, 4096)
  return /<rss[\s>]/i.test(head) || /<feed[\s>]/i.test(head) || /<channel[\s>]/i.test(head)
}

/**
 * Parse a feed document into raw entries.
 *
 * No cap: the caller decides how much to keep, because only the caller knows
 * whether this is a first poll of an archive or a routine check. Returns an
 * empty `entries` array for a document with no items rather than throwing — an
 * empty feed and an unparseable one look the same from here, and the poller
 * records the HTTP status separately so the distinction is not lost.
 */
export function parseFeed(xml: string): ParsedFeed {
  const isAtom = /<feed[\s>]/i.test(xml)
  const isFeedDocument = looksLikeFeed(xml)

  if (isAtom) {
    // The feed's own title is the first <title> OUTSIDE any entry. Taking the
    // document's first <title> outright returns the first entry's title on
    // feeds that put their own title after the entries, which several do.
    const head = xml.split(/<entry[\s>]/i)[0]
    return {
      isFeedDocument,
      feedTitle: first(head, /<title[^>]*>([\s\S]*?)<\/title>/i),
      language: xml.match(/<feed[^>]*\bxml:lang="([^"]*)"/i)?.[1] ?? null,
      entries: [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map(m => {
        const e = m[1]
        return {
          title: first(e, /<title[^>]*>([\s\S]*?)<\/title>/i),
          url: atomLink(e),
          // <summary> before <content>: on an Atom feed carrying both, the
          // summary is what the publisher wrote to describe the piece and the
          // content is the piece. The summary is the better classification
          // signal and the content is kept separately below.
          summary: first(e,
            /<summary[^>]*>([\s\S]*?)<\/summary>/i,
            /<media:description[^>]*>([\s\S]*?)<\/media:description>/i),
          content: first(e, /<content[^>]*>([\s\S]*?)<\/content>/i),
          published: first(e,
            /<published>([\s\S]*?)<\/published>/i,
            /<updated>([\s\S]*?)<\/updated>/i),
          author: first(e,
            /<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/i,
            /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i),
          categories: categoriesIn(e),
        }
      }),
    }
  }

  const channelHead = xml.split(/<item[\s>]/i)[0]
  return {
    isFeedDocument,
    feedTitle: first(channelHead, /<channel[^>]*>[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i),
    language: first(channelHead, /<language>([\s\S]*?)<\/language>/i),
    entries: [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(m => {
      const e = m[1]
      return {
        title: first(e, /<title[^>]*>([\s\S]*?)<\/title>/i),
        // <link> before <guid>. A guid is often a URL and often is not — some
        // feeds use a bare id, and `isPermaLink="false"` says so explicitly.
        // Falling back to it is still better than nothing, because
        // `normalizeEntry` keeps an entry with a title and no URL.
        url: first(e, /<link>([\s\S]*?)<\/link>/i, /<guid[^>]*>([\s\S]*?)<\/guid>/i),
        summary: first(e, /<description>([\s\S]*?)<\/description>/i),
        content: first(e, /<content:encoded>([\s\S]*?)<\/content:encoded>/i),
        published: first(e,
          /<pubDate>([\s\S]*?)<\/pubDate>/i,
          /<dc:date>([\s\S]*?)<\/dc:date>/i),
        author: first(e,
          /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i,
          /<author>([\s\S]*?)<\/author>/i),
        categories: categoriesIn(e),
      }
    }),
  }
}
