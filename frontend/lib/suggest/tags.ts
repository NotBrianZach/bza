/**
 * What an item is about, and what kind of thing it is — without a model.
 *
 * The spec's order is "start with feed tags and keywords; add embeddings or a
 * language model if available", and that order is load-bearing rather than a
 * fallback plan. A pipeline whose classification step requires an LLM cannot be
 * tested, cannot be run over a backlog cheaply, and cannot explain itself
 * except by asking the model to explain itself. So the keyword path is the real
 * implementation, and a model's output enters later through the same
 * `Labelled<T>` shape with `confidence: 'derived'` — indistinguishable to
 * everything downstream, which is what makes it an upgrade and not a rewrite.
 *
 * Three things this file is honest about:
 *
 *  - **Entity extraction here is capitalisation, not knowledge.** A run of
 *    capitalised words is a *candidate* entity. "Energy Storage" in a headline
 *    written in Title Case is a false positive, and `confidence: 'guessed'` is
 *    the admission. Clustering uses entity overlap as one weak signal among
 *    three for exactly this reason.
 *  - **`unclassified` is a real outcome.** It is in the `ArticleType` union
 *    because the alternative — defaulting to 'news' — would silently fill the
 *    context-and-background bucket's complement with things nobody classified.
 *  - **Declared beats derived.** A tag the feed itself published is
 *    `confidence: 'declared'` and is never overwritten by a keyword hit, because
 *    the publisher knows what they filed it under and this code is guessing.
 */

import type { ArticleType, Labelled } from './types'

/**
 * Which generation of this file's logic produced a row's labels.
 *
 * BUMP THIS whenever the cue lists, the entity extraction, the stopwords or the
 * tagging change in a way that would label an existing item differently. Stored
 * on every item as `classifier_version`, and the re-classification pass picks
 * up anything behind the current value — so a bump is the whole mechanism by
 * which a fix reaches the corpus.
 *
 * Forgetting to bump it is the failure mode, and it is quiet: the fix works for
 * new items and silently never reaches old ones, which is exactly the situation
 * this was added to end.
 *
 * History:
 *   1 — first versioned classifier. Covers the two fixes made before versioning
 *       existed: taxonomy codes excluded from bridge material, and Title Case
 *       headlines no longer yielding an entity per capitalised run.
 */
export const CLASSIFIER_VERSION = 1

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

/**
 * Words carrying no topical information.
 *
 * Short on purpose. An aggressive stop list starts removing words that matter in
 * a specific domain — "will" is a stopword and also a legal instrument, "may" is
 * a stopword and also a month. The cost of keeping a few is a slightly noisier
 * Jaccard; the cost of dropping a meaningful one is a cluster that never forms.
 */
const STOPWORDS = new Set(`
a an the and or but if then than that this these those of in on at to for from by with
is are was were be been being has have had do does did not no nor so as it its
i you he she they we his her their our your my me him them us who whom which what
about after again all also am any because before between both each few how into
more most other out over own same some such only up down off once here there
when where why while during against above below under more very s t can just
new says said say will would could should may might one two three
`.trim().split(/\s+/))

/**
 * Words into lowercase tokens.
 *
 * Keeps intra-word hyphens and apostrophes (so "state-of-the-art" survives as
 * one token and "don't" does not become "don" + "t") and drops single
 * characters and pure numbers. A bare year is dropped deliberately: "2026"
 * appears in a third of all headlines and makes every pair of them look related.
 */
export function tokenize(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'’\-\s]/gu, ' ')
    .split(/\s+/)
    .map(t => t.replace(/^[-'’]+|[-'’]+$/g, ''))
    .filter(t => t.length > 1 && !/^\d+$/.test(t))
}

export function contentTokens(text: string): string[] {
  return tokenize(text).filter(t => !STOPWORDS.has(t))
}

/** |A ∩ B| / |A ∪ B| over token sets. 0 when either side is empty. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const t of a) if (b.has(t)) shared++
  return shared / (a.size + b.size - shared)
}

/**
 * Overlap relative to the SMALLER set.
 *
 * Used where one side is legitimately much shorter than the other — a two-word
 * interest name against a headline's worth of tokens. Jaccard punishes that
 * asymmetry: a perfect match of both words of "energy storage" inside a
 * twelve-token headline scores 2/12 ≈ 0.17, which reads as "barely related".
 * Containment scores it 1.0, which is what it is.
 */
export function containment(small: Set<string>, large: Set<string>): number {
  if (small.size === 0 || large.size === 0) return 0
  let shared = 0
  for (const t of small) if (large.has(t)) shared++
  return shared / small.size
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/** Capitalised words that start sentences or are too common to be names. */
const ENTITY_NOISE = new Set(`
the a an this that these those it he she they we i you his her their our my
new breaking exclusive opinion analysis report update live why how what when
where who which more also first last next why's today yesterday tomorrow
monday tuesday wednesday thursday friday saturday sunday
january february march april may june july august september october november december
announce type abstract subject category comments journal reference
read continue reading more appeared post share subscribe
`.trim().split(/\s+/))

/**
 * Candidate entities: runs of capitalised words, plus acronyms.
 *
 * This is a heuristic with a known failure mode in both directions — Title Case
 * headlines produce entities out of ordinary nouns, and lowercase-styled
 * publications produce none at all. Both are acceptable because of how the
 * output is used: entity overlap is a *weak* clustering signal and a secondary
 * relevance signal, never a sole basis for either. If it were load-bearing this
 * would need a real NER model.
 *
 * `reason` records which surface form fired, so a wrong entity can be traced
 * back to the text that produced it rather than merely deleted.
 */
export function extractEntities(title: string, summary: string | null): Labelled<string>[] {
  const text = `${title}. ${summary ?? ''}`
  const found = new Map<string, string>()

  /**
   * Whether capitalisation carries any information in this text.
   *
   * In Title Case — which arXiv, many journals and plenty of publications use
   * for every headline — nearly every word is capitalised, so a "run of
   * capitalised words" is just *the sentence*. Running the heuristic anyway
   * produced an entity equal to the entire paper title, and that then became
   * the bridge score's "unfamiliar material", inflating it on every arXiv item.
   *
   * So the capitalisation heuristics are SKIPPED when the text is Title Case.
   * Acronyms are still collected: an all-caps run of 2–6 is distinguishable
   * from Title Case and is the one signal that survives it.
   */
  const alphaWords = title.split(/\s+/).filter(w => /^[\p{L}]/u.test(w))
  const capitalised = alphaWords.filter(w => /^[A-Z]/.test(w)).length
  const isTitleCase = alphaWords.length >= 4 && capitalised / alphaWords.length >= 0.6

  // Runs of two-or-more capitalised words, allowing lowercase connectives
  // inside them ("Bank of England", "Department of Energy").
  const runs = isTitleCase
    ? [] as RegExpMatchArray[]
    : [...text.matchAll(/\b([A-Z][\p{L}'’-]+(?:\s+(?:of|the|for|and|de|van|al)\s+[A-Z][\p{L}'’-]+|\s+[A-Z][\p{L}'’-]+)+)\b/gu)]
  for (const m of runs) {
    const name = m[1].replace(/\s+/g, ' ').trim()
    const words = name.split(' ')
    if (words.every(w => ENTITY_NOISE.has(w.toLowerCase()))) continue
    // A name of six or more words is a clause, not an entity. The longest real
    // ones ("National Oceanic and Atmospheric Administration") reach five.
    // Without this cap a Title Case sentence that slipped the check above
    // becomes a single enormous "entity".
    if (words.length > 5) continue
    found.set(name.toLowerCase(), `multi-word capitalised run "${name}"`)
  }

  // Acronyms of 2–6 capitals. Length-bounded because longer all-caps spans are
  // shouted headlines, not organisations.
  for (const m of text.matchAll(/\b([A-Z]{2,6})\b/g)) {
    const acr = m[1]
    if (ENTITY_NOISE.has(acr.toLowerCase())) continue
    found.set(acr.toLowerCase(), `acronym "${acr}"`)
  }

  // Single capitalised words that are not sentence-initial. Checked against the
  // raw text rather than a token list because the *position* is the evidence.
  // Skipped in Title Case for the same reason as the runs above — there, every
  // word is mid-sentence and capitalised.
  if (!isTitleCase) {
    for (const m of text.matchAll(/(?<=[a-z,]\s)([A-Z][\p{L}'’-]{2,})\b/gu)) {
      const w = m[1]
      if (ENTITY_NOISE.has(w.toLowerCase())) continue
      if (found.has(w.toLowerCase())) continue
      found.set(w.toLowerCase(), `mid-sentence capitalised "${w}"`)
    }
  }

  return [...found.entries()]
    .slice(0, 24)
    .map(([value, reason]) => ({ value, reason, confidence: 'guessed' as const }))
}

// ---------------------------------------------------------------------------
// Topic tags
// ---------------------------------------------------------------------------

/**
 * Tags for an item: the feed's own, then the publisher's, then keywords.
 *
 * `feedTags` are the tags the *user* put on the feed; they are declared because
 * the user declared them. `declaredTags` are the item's own categories; also
 * declared, by the publisher. Keyword tags are the residue — the most frequent
 * content tokens that are not already covered — and they are capped tightly,
 * because a long tail of one-off keywords makes the topic-share penalty in
 * select.ts meaningless (every item becomes its own topic, so no two items ever
 * share one).
 */
export function assignTopicTags(
  opts: {
    title: string
    summary: string | null
    text: string | null
    declaredTags: string[]
    feedTags: string[]
    maxKeywords?: number
  },
): Labelled<string>[] {
  const out = new Map<string, Labelled<string>>()

  for (const t of opts.feedTags) {
    out.set(t, { value: t, reason: `tag on the feed, set by you`, confidence: 'declared' })
  }
  for (const t of opts.declaredTags) {
    if (out.has(t)) continue
    out.set(t, { value: t, reason: `category declared by the publisher`, confidence: 'declared' })
  }

  const counts = new Map<string, number>()
  // The title is weighted ×3. Not a tuned constant — a headline is the only part
  // of a feed entry written to say what the thing is about, and a summary that
  // happens to mention a word eleven times should not outrank it.
  for (const t of contentTokens(opts.title)) counts.set(t, (counts.get(t) ?? 0) + 3)
  for (const t of contentTokens(opts.summary ?? '')) counts.set(t, (counts.get(t) ?? 0) + 1)
  for (const t of contentTokens((opts.text ?? '').slice(0, 4000))) counts.set(t, (counts.get(t) ?? 0) + 1)

  const ranked = [...counts.entries()]
    .filter(([t]) => !out.has(t))
    .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
    .slice(0, opts.maxKeywords ?? 6)

  for (const [t, n] of ranked) {
    out.set(t, { value: t, reason: `keyword, ${n} weighted occurrence${n === 1 ? '' : 's'}`, confidence: 'derived' })
  }

  return [...out.values()]
}

// ---------------------------------------------------------------------------
// Article type
// ---------------------------------------------------------------------------

/**
 * Cues per article type, strongest first within each entry.
 *
 * These match on the *title and the leading summary* only. Matching the body
 * would be worse, not better: every long piece contains the word "analysis"
 * somewhere, and the signal being looked for is how the publisher framed the
 * piece — which is a headline-and-standfirst decision.
 */
const TYPE_CUES: { type: ArticleType; patterns: RegExp[]; why: string }[] = [
  { type: 'opinion', why: 'framed as argument', patterns: [
    /\bopinion\b/i, /\beditorial\b/i, /\bcommentary\b/i, /\bop-?ed\b/i,
    /\bletters?\s+to\s+the\s+editor\b/i, /^\s*why\s+(we|i|you)\b/i,
  ] },
  { type: 'research', why: 'reads as a paper or preprint', patterns: [
    /\bpreprint\b/i, /\barxiv\b/i, /\bdoi\b/i, /\bpeer[-\s]?review/i,
    /\b(we|this paper|this study)\s+(show|present|propose|find)/i,
    /\babstract:/i, /\bjournal\s+of\b/i,
  ] },
  { type: 'official_release', why: 'the party speaking for itself', patterns: [
    /\bpress\s+release\b/i, /\bannounce(s|d|ment)\b/i, /\bstatement\s+(on|from|by)\b/i,
    /\bfiling\b/i, /\b8-?K\b/, /\b10-?[QK]\b/, /\bconsultation\b/i,
  ] },
  { type: 'explainer', why: 'framed as explanation', patterns: [
    /\bexplain(ed|er)?\b/i, /^\s*what\s+(is|are|to\s+know)\b/i, /^\s*how\s+(does|do|to)\b/i,
    /\bprimer\b/i, /\bguide\s+to\b/i, /\bbackground(er)?\b/i, /\bFAQ\b/,
    /\bwhat\s+you\s+need\s+to\s+know\b/i,
  ] },
  { type: 'investigation', why: 'claims original digging', patterns: [
    /\binvestigation\b/i, /\bexclusive\b/i, /\brevealed?\b/i, /\bleaked?\b/i,
    /\bdocuments?\s+(show|reveal|obtained)\b/i, /\bfreedom\s+of\s+information\b/i,
    /\bFOIA\b/,
  ] },
  { type: 'data', why: 'presents figures as the subject', patterns: [
    /\bchart(s|ed)?\b/i, /\bdataset\b/i, /\bby\s+the\s+numbers\b/i, /\bin\s+charts\b/i,
    /\bsurvey\s+(finds|shows)\b/i, /\bindex\s+(rose|fell|shows)\b/i, /\bvisuali[sz]ed\b/i,
  ] },
  { type: 'analysis', why: 'framed as interpretation', patterns: [
    /\banalysis\b/i, /\bwhat\s+it\s+means\b/i, /\btakeaways?\b/i, /\bdeep\s+dive\b/i,
    /\bwhy\s+.*\s+matters\b/i, /\bassessment\b/i,
  ] },
  { type: 'news', why: 'reports an event', patterns: [
    /\bsaid\b/i, /\breported\b/i, /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(kills?|killed|wins?|won|resigns?|dies?|died|elected|arrested|charged|sues?|sued)\b/i,
    /\b(rose|fell|jumped|slumped|surged)\b/i, /\bbreaking\b/i,
  ] },
]

/**
 * The item's type, with the cue that decided it.
 *
 * `sourceTypeHint` resolves a tie rather than overriding a cue, and that
 * asymmetry is deliberate: a research feed can carry a news item about the
 * field, so letting the feed's type win outright would mislabel it. But when
 * nothing in the text fires, the feed's own kind is the best information
 * available and is better than 'unclassified' — so it is used, and the reason
 * says it came from the feed and not from the item.
 *
 * Cue order is priority order. 'opinion' is checked first on purpose: an opinion
 * piece about an event contains every news cue there is, and calling it news is
 * the costlier mistake — it would let argument fill a slot the reader allotted
 * to reporting.
 */
export function classifyArticleType(
  opts: { title: string; summary: string | null; sourceTypeHint?: ArticleType | null },
): Labelled<ArticleType> {
  const probe = `${opts.title}. ${(opts.summary ?? '').slice(0, 400)}`

  for (const cue of TYPE_CUES) {
    for (const re of cue.patterns) {
      const m = probe.match(re)
      if (m) {
        return {
          value: cue.type,
          reason: `${cue.why} — matched "${m[0].trim()}" in the title or opening`,
          confidence: 'derived',
        }
      }
    }
  }

  if (opts.sourceTypeHint) {
    return {
      value: opts.sourceTypeHint,
      reason: `no cue in the text; assumed from the feed's source type`,
      confidence: 'guessed',
    }
  }

  return {
    value: 'unclassified',
    reason: 'no cue fired in the title or opening, and the feed offers no hint',
    confidence: 'derived',
  }
}

/**
 * The article type a feed's `source_type` implies, if any.
 *
 * `wire`, `specialist` and `local_reporting` map to nothing — they say how the
 * publisher is positioned, not what any one piece is, and all three publish
 * across the whole range of types. Pretending otherwise would stamp a type onto
 * most of the corpus on no evidence at all.
 */
export function typeHintFromSource(sourceType: string): ArticleType | null {
  if (sourceType === 'research') return 'research'
  if (sourceType === 'primary_source') return 'official_release'
  if (sourceType === 'commentary') return 'opinion'
  return null
}

/**
 * Types that serve the "context and background" bucket.
 *
 * The spec names "explainers, investigations, data, history, or research".
 * `analysis` is in because a piece interpreting a long-running story does the
 * same job for a reader; `opinion` is out, because argument about events is not
 * background on them, and letting it in would make the bucket the easiest one to
 * fill and therefore the one that fills with the least work.
 */
export const CONTEXT_TYPES: ReadonlySet<ArticleType> = new Set<ArticleType>([
  'explainer', 'investigation', 'data', 'research', 'analysis',
])
