/**
 * The text pipeline: book text in, structure out.
 *
 * Everything here was a closure inside BookReader, and none of it ever needed
 * to be. These are functions of (text, config) only — no component state, no
 * refs, no React. Pulling them out is the one extraction on this component that
 * cannot change behaviour, because there was no behaviour to capture.
 *
 * The one that looks like an exception is `preprocessContent`, which read
 * `refsMapRef.current` from the enclosing scope. The references map is now a
 * parameter, so the caller decides what it is — which also means the citation
 * rewriting can be tested without mounting a reader.
 *
 * Ordering matters between two of these and is not obvious: `computePageBreaks`
 * must run before `parseToc` and `extractInlineImages`, since both report the
 * page a thing landed on and derive it from the break offsets.
 */

export interface TocEntry { title: string; level: number; page: number }
export interface InlineImage { url: string; alt: string; page: number }

/** Fallback page length when a book carries no `char_page_length`. */
export const DEFAULT_CHAR_PAGE_LENGTH = 420

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Char offsets of each page start, the first always 0.
 *
 * `len` is a target, not a rule. A hard cut every `len` characters would split
 * mid-sentence and, worse, orphan a heading at the foot of a page — so the
 * break is negotiated in descending order of preference: a heading inside a
 * ±20% window, then a paragraph break within 300 chars, then a sentence
 * boundary within 200, then the target itself.
 */
export function computePageBreaks(text: string, len: number): number[] {
  // Heading pattern — prefer breaking before headings
  const headingRe = /^(?:#{1,6}\s|\\(?:section|chapter)|(?:CHAPTER|Chapter|PART|Part)\s+[IVXLCDM\d])/gm
  const headingOffsets = new Set<number>()
  let hm: RegExpExecArray | null
  while ((hm = headingRe.exec(text)) !== null) headingOffsets.add(hm.index)

  /**
   * Spans that must never be split, because half of one is not text.
   *
   * A markdown image or link is a single token to a reader and a meaningless
   * pair of fragments when cut. The three negotiated breaks above cannot avoid
   * this on their own: a heading, a paragraph break and a sentence end are all
   * absent from the inside of a URL, so a long link is exactly the input that
   * falls through to "hard break at target" — and that lands wherever it lands.
   *
   * Found on the Borromean rings article from Wikipedia, where every formula
   * is served as an image (`![{\displaystyle n^{3}-n}](…/math/render/svg/…)`)
   * and the longest link is 281 characters against a 420-character page. Three
   * of its eighteen links were severed, so the reader showed
   * `…/250px-Borromean` at the foot of one page and
   * `Rings-Trinity.svg.png?utm_source=…` at the head of the next, with no
   * image on either.
   *
   * Matched here rather than guarded at the break sites so the cost is one
   * pass over the text instead of a search per page.
   */
  const unsplittable: { start: number; end: number }[] = []
  const linkRe = /!?\[[^\]\n]*\]\([^)\s]*(?:\s+"[^"]*")?\)/g
  let lm: RegExpExecArray | null
  while ((lm = linkRe.exec(text)) !== null) {
    unsplittable.push({ start: lm.index, end: lm.index + lm[0].length })
  }
  /** The span containing `i`, if `i` is strictly inside one. */
  const spanAt = (i: number) =>
    unsplittable.find(s => i > s.start && i < s.end) ?? null

  const breaks = [0]
  let pos = 0
  while (pos < text.length) {
    const target = pos + len
    if (target >= text.length) break

    // First: check if there's a heading in the ±20% window around target
    const minPos = pos + Math.floor(len * 0.8)
    const maxPos = Math.min(pos + Math.ceil(len * 1.2), text.length)
    let end = -1

    for (const ho of headingOffsets) {
      if (ho > minPos && ho <= maxPos) { end = ho; break }
    }

    // Second: look for paragraph break (\n\n) near target
    if (end === -1) {
      const look = Math.min(target + 300, text.length)
      for (let i = target; i < look; i++) {
        if (text[i] === '\n' && text[i + 1] === '\n') { end = i + 2; break }
      }
    }

    // Third: sentence boundary
    if (end === -1) {
      const look = Math.min(target + 200, text.length)
      for (let i = target; i < look; i++) {
        if (('.!?'.includes(text[i])) && /[\s"']/.test(text[i + 1] ?? '')) { end = i + 1; break }
      }
    }

    // Last resort: hard break at target
    if (end === -1) end = target

    /**
     * Never leave a break inside a link or image.
     *
     * Pushed FORWARD to the end of the span rather than pulled back to its
     * start, for two reasons. Forward always makes progress, so the loop
     * cannot stall on a span beginning at or before `pos` — a link longer than
     * a whole page is possible here and 281 characters against 420 is already
     * most of one. And it keeps the image with the paragraph that introduces
     * it, which is usually its caption.
     *
     * The cost is a page that overruns its target by up to the span's length.
     * That is the right trade: `len` is documented as a target rather than a
     * rule, and a slightly long page reads fine where a severed URL does not.
     */
    const span = spanAt(end)
    if (span) end = span.end

    breaks.push(end)
    pos = end
  }
  return breaks
}

/**
 * The text of one page.
 *
 * Falls back to fixed-stride arithmetic when `breaks` is empty, so a caller
 * that has content but has not paginated it yet still gets something reasonable
 * rather than an empty string.
 */
export function sliceForPage(text: string, pageNum: number, breaks: number[], charPageLength: number): string {
  const start = breaks[pageNum - 1] ?? (pageNum - 1) * charPageLength
  const end = breaks[pageNum] ?? text.length
  return text.substring(start, end)
}

// ---------------------------------------------------------------------------
// Structure extraction
// ---------------------------------------------------------------------------

export function extractInlineImages(text: string, breaks: number[]): InlineImage[] {
  const results: InlineImage[] = []
  const re = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const idx = m.index
    let page = 1
    if (breaks.length > 1) {
      const i = breaks.findIndex((b, j) => b <= idx && (breaks[j + 1] ?? Infinity) > idx)
      page = Math.max(1, i + 1)
    }
    results.push({ url: m[2], alt: m[1], page })
  }
  return results
}

/**
 * A table of contents, detected rather than declared.
 *
 * Six patterns are tried against the whole text — markdown ATX headings, three
 * LaTeX sectioning commands, and prose "Chapter N" / "Part N" lines — because
 * the corpus is imports from everywhere and no one source dominates. Titles
 * outside 2..100 chars are dropped as noise, and same-page same-title hits are
 * deduped, which is what happens when a markdown heading and a prose "Chapter"
 * line describe the same break.
 */
export function parseToc(text: string, breaks: number[]): TocEntry[] {
  const entries: TocEntry[] = []

  const patterns: Array<{ re: RegExp; level: (m: RegExpExecArray) => number; title: (m: RegExpExecArray) => string }> = [
    { re: /^(#{1,4})\s+(.+)$/gm, level: m => m[1].length, title: m => m[2].trim() },
    { re: /^\\chapter\*?\{(.+?)\}/gm, level: () => 1, title: m => m[1] },
    { re: /^\\section\*?\{(.+?)\}/gm, level: () => 2, title: m => m[1] },
    { re: /^\\subsection\*?\{(.+?)\}/gm, level: () => 3, title: m => m[1] },
    { re: /^(?:CHAPTER|Chapter)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Chapter ${m[1]}${m[2]?.trim() ? ': ' + m[2].trim() : ''}` },
    { re: /^(?:PART|Part)\s+([IVXLCDM\d]+)[\s.:—–-]*(.*)$/gm, level: () => 1, title: m => `Part ${m[1]}${m[2]?.trim() ? ': ' + m[2].trim() : ''}` },
  ]

  const findPage = (offset: number) => {
    let lo = 0, hi = breaks.length - 1
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (breaks[mid] <= offset) lo = mid; else hi = mid - 1 }
    return lo + 1
  }

  for (const pat of patterns) {
    pat.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pat.re.exec(text)) !== null) {
      const title = pat.title(m)
      if (title.length < 2 || title.length > 100) continue
      entries.push({ title, level: pat.level(m), page: findPage(m.index) })
    }
  }

  // Sort by page, deduplicate same-page same-title
  entries.sort((a, b) => a.page - b.page || a.level - b.level)
  const seen = new Set<string>()
  return entries.filter(e => { const k = `${e.page}-${e.title}`; if (seen.has(k)) return false; seen.add(k); return true })
}

/** Numbered bibliography entries from a references section near the end of the book. */
export function parseReferences(text: string): Record<number, string> {
  // Find a references/bibliography section near the end of the book
  const sectionMatch = text.match(/\n#{1,3}\s*(?:References|Bibliography|Works Cited|Further Reading|Notes)\s*\n([\s\S]{0,20000})$/i)
  if (!sectionMatch) return {}
  const section = sectionMatch[1]
  const refs: Record<number, string> = {}
  // Match [N] entry lines, possibly spanning multiple lines until the next [N] or blank line
  const entryRe = /\[(\d+)\]\s+([\s\S]+?)(?=\n\s*\[\d+\]|\n{2,}|$)/g
  for (const m of section.matchAll(entryRe)) {
    const num = parseInt(m[1])
    if (!isNaN(num)) refs[num] = m[2].replace(/\n\s*/g, ' ').trim()
  }
  return refs
}

/**
 * Parse `%%fn%%\nN|text\n%%/fn%%` blocks out of page content.
 * Returns cleaned text and a map of footnote number → text.
 */
export function parseFootnotes(content: string): { text: string; footnotes: Record<number, string> } {
  const match = content.match(/%%fn%%\n?([\s\S]*?)\n?%%\/fn%%/)
  if (!match) return { text: content, footnotes: {} }
  const text = content.replace(/\n*%%fn%%[\s\S]*?%%\/fn%%/, '').trim()
  const footnotes: Record<number, string> = {}
  for (const line of match[1].trim().split('\n')) {
    const pipe = line.indexOf('|')
    if (pipe > 0) {
      const num = parseInt(line.slice(0, pipe))
      const fnText = line.slice(pipe + 1).trim()
      if (!isNaN(num) && fnText) footnotes[num] = fnText
    }
  }
  return { text, footnotes }
}

/**
 * Which bibliography entries are cited on this page.
 *
 * Bare `[N]` only — `[[N]]` is the inline footnote marker and is excluded by
 * the lookarounds, since those carry their own text and must not be overwritten
 * by a bibliography entry that happens to share a number.
 */
export function citedReferences(text: string, refs: Record<number, string>): Set<number> {
  const cited = new Set<number>()
  if (Object.keys(refs).length === 0) return cited
  for (const m of text.matchAll(/(?<!\[)\[(\d+)\](?!\])/g)) {
    const n = parseInt(m[1])
    if (refs[n]) cited.add(n)
  }
  return cited
}

/** Render a footnote map as the markdown block appended below page content. */
export function footnoteBlock(footnotes: Record<number, string>): string {
  const entries = Object.entries(footnotes).sort(([a], [b]) => Number(a) - Number(b))
  if (entries.length === 0) return ''
  return entries.map(([num, text]) => `**${num}.** ${text}`).join('\n\n')
}

// ---------------------------------------------------------------------------
// Markdown preprocessing
// ---------------------------------------------------------------------------

const SUPERSCRIPT_CHARS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

const toSuperscript = (digits: string) =>
  digits.split('').map((d: string) => SUPERSCRIPT_CHARS[parseInt(d)] ?? d).join('')

/**
 * Convert `[[N]]` inline markers → markdown link `[ⁿ](fn:N)` for custom rendering.
 * Also normalize LaTeX delimiters: `\(...\)` → `$...$`, `\[...\]` → `$$...$$`.
 *
 * A bare `[N]` becomes a citation link only when `refs` actually has entry N —
 * otherwise it is left alone, because `[3]` in ordinary prose is far more often
 * a bracket than a reference nobody defined.
 */
export function preprocessContent(content: string, refs: Record<number, string> = {}): string {
  return content
    .replace(/\\\[([^]*?)\\\]/g, (_, m) => `$$${m}$$`)
    .replace(/\\\(([^]*?)\\\)/g, (_, m) => `$${m}$`)
    .replace(/\[\[(\d+)\]\]/g, (_, n: string) => `[${toSuperscript(n)}](fn:${n})`)
    // Convert bare [N] reference citations to clickable superscripts
    .replace(/(?<!\[)\[(\d+)\](?!\])/g, (match, n: string) =>
      refs[parseInt(n)] ? `[${toSuperscript(n)}](fn:${n})` : match)
    // Inject anchor spans for 4chan post numbers so reply links can scroll+highlight
    .replace(/\bNo\.(\d+)\b/g, '<span id="post-$1">No.$1</span>')
}

/** The post-anchor half of `preprocessContent`, for content that needs nothing else. */
export function addPostAnchors(content: string): string {
  return content.replace(/\bNo\.(\d+)\b/g, '<span id="post-$1">No.$1</span>')
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchHit { pageNum: number; snippet: string }

/**
 * Case-insensitive substring search across pages, capped at 20 hits.
 *
 * Falls back to fixed-stride pages when `breaks` is empty so search works on
 * content that has not been paginated yet — a hit on the wrong page number is
 * still a hit, where no results at all reads as "this book does not contain
 * the word".
 */
export function searchPages(
  text: string,
  query: string,
  breaks: number[],
  charPageLength: number = DEFAULT_CHAR_PAGE_LENGTH,
): SearchHit[] {
  if (!text || !query.trim()) return []
  const q = query.toLowerCase()
  const bounds = breaks.length > 0
    ? breaks
    : Array.from({ length: Math.ceil(text.length / charPageLength) }, (_, i) => i * charPageLength)
  const results: SearchHit[] = []
  for (let i = 0; i < bounds.length; i++) {
    const start = bounds[i]
    const end = bounds[i + 1] ?? text.length
    const pageText = text.substring(start, end)
    const idx = pageText.toLowerCase().indexOf(q)
    if (idx !== -1) {
      const snipStart = Math.max(0, idx - 40)
      const snipEnd = Math.min(pageText.length, idx + q.length + 80)
      const raw = pageText.substring(snipStart, snipEnd).replace(/\n+/g, ' ')
      const snippet = (snipStart > 0 ? '…' : '') + raw + (snipEnd < pageText.length ? '…' : '')
      results.push({ pageNum: i + 1, snippet })
      if (results.length >= 20) break
    }
  }
  return results
}
