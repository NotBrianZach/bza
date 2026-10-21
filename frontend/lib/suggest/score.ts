/**
 * Six numbers, computed separately and kept separately.
 *
 * The thing to protect in this file is that **relevance never contaminates
 * quality**. They are computed by two functions that share no input: `relevance`
 * sees the user's interests and not the feed's source type; `quality` sees the
 * source type and the item's own evidence and not the interests. That separation
 * is the whole point of the spec, and it is enforceable only by keeping the
 * arguments disjoint — a single `score(item, user, feed)` would blend them the
 * first time somebody added "and boost quality for topics they like."
 *
 * Every part returns a value AND a sentence. The sentence is not for the model
 * and not for the logs; it is what the UI shows when the user asks why an item
 * is there, and it is produced from the same arithmetic that produced the number
 * so the two cannot disagree. The spec's closing line — "The algorithm should
 * make it possible to see why an item appeared" — is a type-level requirement
 * here, not an aspiration.
 *
 * ── On the weights ─────────────────────────────────────────────────────────
 *
 * DEFAULT_WEIGHTS are the spec's starting values and are explicitly not claims
 * about anybody's preferences. They are exported, overridable per digest, and
 * stored on every digest that was built with them, so a feed that drifted can be
 * compared against the settings that produced it.
 *
 * ── On the floor ───────────────────────────────────────────────────────────
 *
 * `isEligible` runs BEFORE ranking, which is the difference between a floor and
 * a penalty. A quality term inside the weighted sum can always be outvoted —
 * a maximally fresh, novel, locally-relevant item with Q=0.1 still beats a
 * careful one with a mediocre blend. The floor cannot be outvoted, which is what
 * the spec asks for: "This prevents novelty or recency from rescuing items that
 * look low quality."
 */

import type { Feed, FeedItem, Interest, ScoreParts, ScoreWeights, ScoredItem } from './types'
import { containment, contentTokens, jaccard } from './tags'

/** The spec's §3 starting weights. They sum to 1; nothing requires that. */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  relevance: 0.32,
  quality: 0.18,
  freshness: 0.12,
  bridge: 0.18,
  novelty: 0.10,
  localFit: 0.10,
}

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0)

/** A part's value together with the sentence explaining it. */
interface Part {
  value: number
  why: string
}

// ---------------------------------------------------------------------------
// R — relevance
// ---------------------------------------------------------------------------

/** An interest's tokens, cached per call since every item re-uses them. */
function interestTokens(interests: Interest[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>()
  for (const i of interests) m.set(i.interestId, new Set(contentTokens(i.name)))
  return m
}

export interface RelevanceDetail extends Part {
  /** Interest names, strongest first. */
  matched: string[]
  /** Per-interest match strength, for the bridge calculation to reuse. */
  perInterest: Map<string, number>
}

/**
 * How well the item matches the user's weighted interests.
 *
 * Match strength per interest is the best of three measures, not their average:
 * containment of the interest's words in the item's text, containment in the
 * entity list, and a question-interest's token overlap. Best-of rather than
 * average because these are *alternative ways of being about something* — an
 * item that names "Iran" as an entity is about Iran whether or not the word
 * appears in its keyword tags, and averaging would dilute a definite hit with
 * the silence of the other two channels.
 *
 * The aggregate over interests is a weighted max blended with a weighted mean
 * (70/30). A pure max ignores that matching four of your interests is better
 * than matching one; a pure mean punishes an item for the interests it does not
 * touch, which would make every item score low once the interest list grows.
 */
export function relevance(
  item: FeedItem, interests: Interest[], cache?: Map<string, Set<string>>,
): RelevanceDetail {
  if (interests.length === 0) {
    return {
      value: 0,
      why: 'no interests defined yet, so nothing can be matched against',
      matched: [],
      perInterest: new Map(),
    }
  }

  const toks = cache ?? interestTokens(interests)
  const itemText = new Set([
    ...contentTokens(item.title),
    ...contentTokens(item.summary ?? ''),
    ...item.topicTags.flatMap(t => contentTokens(t.value)),
  ])
  const itemEntities = new Set(item.entities.flatMap(e => contentTokens(e.value)))

  const perInterest = new Map<string, number>()
  const scored: { name: string; weight: number; strength: number; via: string }[] = []

  for (const interest of interests) {
    const it = toks.get(interest.interestId) ?? new Set<string>()
    if (it.size === 0) continue

    const viaText = containment(it, itemText)
    const viaEntity = containment(it, itemEntities)
    // A question interest ("What could replace petrochemical feedstocks?") has
    // many words, most of them scaffolding. Jaccard against the item's text is
    // the right measure there: containment would demand the item use nearly
    // every word of the question, which no article does.
    const viaQuestion = interest.kind === 'question' ? jaccard(it, itemText) * 2 : 0

    const best = Math.max(viaText, viaEntity, clamp01(viaQuestion))
    if (best <= 0) continue

    const via = best === viaEntity && viaEntity >= viaText
      ? 'named as an entity'
      : interest.kind === 'question' && clamp01(viaQuestion) === best
        ? 'shares vocabulary with your question'
        : 'matches the text'

    perInterest.set(interest.interestId, best)
    scored.push({ name: interest.name, weight: clamp01(interest.weight), strength: best, via })
  }

  if (scored.length === 0) {
    return {
      value: 0,
      why: `matches none of your ${interests.length} interests`,
      matched: [],
      perInterest,
    }
  }

  scored.sort((a, b) => b.strength * b.weight - a.strength * a.weight)
  const weighted = scored.map(s => s.strength * s.weight)
  const max = Math.max(...weighted)
  // The mean is over the interests that MATCHED, not over all of them. Dividing
  // by the full interest list would make relevance fall as the user adds
  // interests, so a well-curated long list would score every item lower than a
  // sparse one — the opposite of what more information should do.
  const meanOfMatched = weighted.reduce((a, b) => a + b, 0) / weighted.length
  const value = clamp01(0.7 * max + 0.3 * meanOfMatched)

  const top = scored.slice(0, 3)
  return {
    value,
    why: `matches ${scored.length} of your ${interests.length} interests — ` +
      top.map(s => `${s.name} (${s.via}, ${s.strength.toFixed(2)})`).join('; '),
    matched: scored.map(s => s.name),
    perInterest,
  }
}

// ---------------------------------------------------------------------------
// Q — quality
// ---------------------------------------------------------------------------

/**
 * The prior each source type carries, before the item is looked at.
 *
 * These encode one claim and one claim only: **how close the publisher is to the
 * thing being reported.** A primary source and a research paper are the party
 * itself; local reporting and specialists were there or know the field; a wire
 * is fast and thin; commentary is about something somebody else reported.
 *
 * `commentary` sitting lowest is not a judgement of opinion writing. It is that
 * an opinion piece's evidence is, structurally, elsewhere — and `quality` here
 * means "how much does this item itself stand on". An excellent column can still
 * clear the floor and outrank a weak wire brief once its own signals are added;
 * what it cannot do is enter on the strength of its publisher alone.
 */
const SOURCE_PRIOR: Record<Feed['sourceType'], number> = {
  primary_source: 0.72,
  research: 0.72,
  local_reporting: 0.62,
  specialist: 0.62,
  wire: 0.48,
  commentary: 0.38,
}

/** Phrases that mark an item as resting on something checkable. */
const EVIDENCE_CUES: { re: RegExp; bump: number; why: string }[] = [
  { re: /\b(according to|cited? in|as reported by)\b/i, bump: 0.04, why: 'attributes its claims' },
  { re: /\b(study|paper|report|dataset|filing|transcript|court\s+records?)\b/i, bump: 0.05, why: 'points at a document' },
  { re: /\b(doi|arxiv|https?:\/\/\S*(gov|edu|\.org))/i, bump: 0.05, why: 'links a primary or institutional source' },
  { re: /\b(interview(ed|s)?|spoke (to|with)|told\s+\w+)\b/i, bump: 0.05, why: 'original interviewing' },
  { re: /\b(we (found|obtained|analy[sz]ed|reviewed))\b/i, bump: 0.06, why: 'claims original work' },
  { re: /\b(correction|updated?\s+(on|at)|editor'?s?\s+note)\b/i, bump: 0.04, why: 'editorial transparency' },
]

/** Phrases that mark an item as content rather than reporting. */
const THINNESS_CUES: { re: RegExp; drop: number; why: string }[] = [
  { re: /\b(sponsored|paid\s+(post|content)|advertorial|partner\s+content)\b/i, drop: 0.45, why: 'sponsored content' },
  { re: /\b(\d+\s+(things|ways|reasons|tips)|you\s+won'?t\s+believe|shocking)\b/i, drop: 0.18, why: 'listicle or curiosity-gap framing' },
  { re: /\b(rumou?r|reportedly\s+may|could\s+possibly|sources?\s+say)\b/i, drop: 0.10, why: 'hedged, unsourced claim' },
  { re: /\b(live\s+(blog|updates?)|as\s+it\s+happened)\b/i, drop: 0.08, why: 'rolling coverage, no settled account' },
]

/**
 * A provisional quality estimate. Emphasis on provisional.
 *
 * What this can see is the source type, the presence of evidence-shaped
 * language, the absence of content-farm language, and how much text there is.
 * What it cannot see is whether any of the cited evidence is real, whether the
 * reporting is accurate, or whether the argument holds. So it is a *filter for
 * obvious thinness*, not a ranking of journalistic merit, and the floor is set
 * low (0.3) because that is all it is entitled to decide.
 *
 * Deliberately NOT inputs: the user's interests, engagement, popularity, and the
 * publisher's politics. The first would make this relevance again; the second
 * would make it a clickability score, which the spec's §6 warns about by name;
 * the third is the one inference the spec forbids outright.
 */
export function quality(item: FeedItem, feed: Feed): Part {
  const prior = SOURCE_PRIOR[feed.sourceType] ?? 0.5
  const probe = `${item.title}. ${item.summary ?? ''} ${(item.text ?? '').slice(0, 3000)}`

  const hits: string[] = []
  let value = prior
  for (const cue of EVIDENCE_CUES) {
    if (cue.re.test(probe)) {
      value += cue.bump
      hits.push(cue.why)
    }
  }
  const drops: string[] = []
  for (const cue of THINNESS_CUES) {
    if (cue.re.test(probe)) {
      value -= cue.drop
      drops.push(cue.why)
    }
  }

  // Length as a weak positive, capped early. 1200 characters is roughly where a
  // feed entry stops being a teaser; beyond that, more text is not more quality
  // and treating it as such would rank the longest item top every time.
  const chars = (item.text ?? item.summary ?? '').length
  const lengthBump = Math.min(0.06, chars / 1200 * 0.06)
  value += lengthBump

  const why = [
    `${feed.sourceType.replace(/_/g, ' ')} source (prior ${prior.toFixed(2)})`,
    ...hits,
    ...drops.map(d => `penalised: ${d}`),
    chars < 200 ? 'very little text in the feed entry' : null,
  ].filter(Boolean).join('; ')

  return { value: clamp01(value), why }
}

/** The quality floor. The spec's figure; a user-designated feed bypasses it. */
export const QUALITY_FLOOR = 0.3

// ---------------------------------------------------------------------------
// F — freshness
// ---------------------------------------------------------------------------

/**
 * Half-lives in hours, per article type.
 *
 * The spec asks for "different decay rates for breaking news, explainers, and
 * evergreen material", and the types already carry that distinction: a news item
 * is stale in a day and a half, an explainer is as useful in three weeks as it
 * was on publication, and research barely decays at all within a weekly digest's
 * horizon.
 *
 * `unclassified` decays at the news rate. That is the conservative choice in the
 * direction that matters: treating an unknown item as evergreen would let
 * undated, unclassifiable items accumulate at the top of the freshness ranking
 * indefinitely.
 */
const HALF_LIFE_HOURS: Record<string, number> = {
  news: 36,
  official_release: 72,
  investigation: 24 * 10,
  analysis: 24 * 7,
  data: 24 * 14,
  explainer: 24 * 21,
  research: 24 * 30,
  opinion: 24 * 4,
  unclassified: 36,
}

export function freshness(item: FeedItem, now: string): Part {
  if (!item.publishedAt) {
    return {
      value: 0.5,
      why: 'the feed gave no date, so timeliness is unknown rather than high',
    }
  }
  const type = item.articleType.value
  const half = HALF_LIFE_HOURS[type] ?? 36
  const hours = Math.max(0, (Date.parse(now) - Date.parse(item.publishedAt)) / 3_600_000)
  if (!Number.isFinite(hours)) {
    return { value: 0.5, why: 'the date could not be compared to now' }
  }
  const value = clamp01(Math.pow(0.5, hours / half))
  const days = (hours / 24).toFixed(1)
  return {
    value,
    why: `${days} day${days === '1.0' ? '' : 's'} old; a ${type.replace(/_/g, ' ')} halves in value every ${(half / 24).toFixed(0)} day${half === 24 ? '' : 's'}`,
  }
}

// ---------------------------------------------------------------------------
// B — bridge
// ---------------------------------------------------------------------------

export interface BridgeDetail extends Part {
  from: string | null
  to: string | null
}

/**
 * Whether a tag is a taxonomy identifier rather than subject matter.
 *
 * Found by running the pipeline over a real arXiv feed. Every arXiv item
 * carries its category codes as declared tags — `cs.lg`, `cs.cr`, `stat.ml` —
 * and the unfamiliarity test read all of them as unfamiliar material, because
 * "cs.lg" shares no token with the interest "machine learning" *even though it
 * is the same thing*. The result: `bridge` scored 1.00 on papers squarely
 * inside a declared interest, and with a weight of 0.18 that inflated one
 * source's items across the whole digest.
 *
 * The check is shape-based, not a list of known taxonomies. A dotted
 * lowercase token with no spaces (`cs.lg`, `q-bio.nc`) and a short all-caps
 * run with digits (`H.3.3`, `62M20`) are identifiers in every scheme that
 * emits them, and nothing a human would call a topic looks like that.
 *
 * Deliberately NOT applied to `topicTags` generally — only to the bridge's
 * unfamiliarity judgement. The codes are still perfectly good *relevance* and
 * *clustering* signals: two papers sharing `cs.lg` genuinely are related, and
 * that is what the topic-share penalty should see.
 */
function isTaxonomyCode(tag: string): boolean {
  const t = tag.trim()
  if (!t || /\s/.test(t)) return false
  // Dotted identifier: cs.lg, stat.ml, q-bio.nc, math.ap
  if (/^[a-z][a-z-]{0,9}\.[a-z]{2,4}$/i.test(t)) return true
  // Classification number: 62M20, H.3.3, I.2.6
  if (/^[A-Z]?[\d.]{3,}[A-Z]?\d*$/.test(t) && /\d/.test(t)) return true
  return false
}

/**
 * How well the item connects something known to something new.
 *
 * A bridge needs BOTH ends, and that conjunction is the definition: an item
 * entirely inside your interests is not a bridge (it is core), and an item
 * entirely outside them is not a bridge either (it is outside-the-map). The
 * score peaks when one interest matches moderately and the item also carries
 * substantial material that no interest covers.
 *
 * The "new end" is measured as the share of the item's topic tags and entities
 * that no interest matches — unfamiliar *material*, not merely unfamiliar words.
 * The parent hierarchy is what makes the two discovery kinds distinguishable: a
 * match on a *sibling* of a known interest is adjacency, which is why
 * `anchorDepth` is reported. An item reached through a child of something you
 * follow is nearer than one reached through an unrelated root.
 */
export function bridge(
  item: FeedItem, interests: Interest[], rel: RelevanceDetail,
): BridgeDetail {
  if (interests.length === 0 || rel.perInterest.size === 0) {
    return {
      value: 0,
      why: 'nothing known is mentioned, so there is no near end to bridge from',
      from: null,
      to: null,
    }
  }

  const byId = new Map(interests.map(i => [i.interestId, i]))
  const covered = new Set<string>()
  for (const [id] of rel.perInterest) {
    for (const t of contentTokens(byId.get(id)?.name ?? '')) covered.add(t)
  }

  /**
   * What counts as "material" for judging unfamiliarity.
   *
   * DECLARED tags and entities only — never derived keyword tags, and this is
   * the correction that made bridge behave on real data.
   *
   * `assignTopicTags` appends up to six keyword tags taken from the item's own
   * title and summary: words like "reliable", "estimation", "bias". Those are
   * not subject areas, they are headline residue. Counting them as material
   * made "unfamiliar" mean "any word that is not in your interest's name",
   * which is almost every word — so newShare ran at 60–96% for ordinary items
   * and bridge fired on everything, including papers squarely inside a declared
   * interest.
   *
   * A declared tag is somebody's claim about subject area (the publisher's, or
   * the user's own tag on the feed). An entity is a named thing. Both are
   * assertions about what the item concerns. A keyword is a word that occurred
   * often. Only the first two can support "this reaches somewhere new".
   */
  const material = [
    ...item.topicTags.filter(t => t.confidence === 'declared').map(t => t.value),
    ...item.entities.map(e => e.value),
  ]
  if (material.length === 0) {
    return {
      value: 0,
      // The reason says it cannot be JUDGED, not that the item is familiar: an
      // untagged item with no recognised entities is one we cannot assess, and
      // conflating that with "nothing new here" would be a claim we have no
      // basis for.
      why: 'no declared tags or named entities, so there is nothing to judge unfamiliarity against',
      from: null,
      to: null,
    }
  }

  const unfamiliar = material.filter(m => {
    if (isTaxonomyCode(m)) return false
    const toks = contentTokens(m)
    return toks.length > 0 && toks.every(t => !covered.has(t))
  })
  // Denominator excludes codes too, or an item tagged only with codes would
  // have a newShare of 0/0.
  const judgeable = material.filter(m => !isTaxonomyCode(m))
  const newShare = judgeable.length > 0 ? unfamiliar.length / judgeable.length : 0

  // The near end: the strongest matching interest, by match × weight.
  let nearId: string | null = null
  let nearScore = 0
  for (const [id, strength] of rel.perInterest) {
    const w = clamp01(byId.get(id)?.weight ?? 0)
    if (strength * w >= nearScore) {
      nearScore = strength * w
      nearId = id
    }
  }
  const near = nearId ? byId.get(nearId) ?? null : null

  // A product, so both ends are required. Scaled by 4 because the maximum of
  // x·(1−x)-shaped terms is 0.25 and an un-scaled bridge could never compete
  // with relevance at its own weight.
  const anchorStrength = clamp01(nearScore)

  /**
   * The falloff that makes the doc comment above actually true.
   *
   * The comment has always said "an item entirely inside your interests is not
   * a bridge (it is core)", but nothing enforced it: the formula rewarded a
   * high anchor and a high new-share, and an arXiv paper squarely inside
   * "machine learning" scored relevance 0.90 AND bridge 1.00 — counted twice,
   * once in each of two terms that are supposed to describe different things.
   *
   * So the bridge is damped by how thoroughly the item is already covered.
   * Squared rather than linear because moderate relevance is exactly what a
   * genuine bridge HAS — it must mention something you know — so the damp has
   * to stay mild in the middle of the range and bite only at the top.
   *
   * The 0.6 coefficient makes the damp PARTIAL, and that is not a fudge: it is
   * because `relevance` saturates. `containment` returns 1.00 as soon as every
   * token of an interest name appears, which for a two-word interest like
   * "energy storage" is easy — so a full `1 - rel²` damp sent every bridge to
   * exactly zero the moment an interest was mentioned by name, including the
   * lithium-supply-chain item that is the textbook example of a real bridge.
   * At 0.6 the worst case keeps 40% rather than 0%, which ranks a saturated
   * item below a genuinely moderate one without deleting the signal.
   *
   * The deeper issue is that relevance is coarse at the top of its range. That
   * is a known limitation and the right fix is embeddings (the spec's step 5),
   * not a sharper damp here.
   */
  const alreadyCovered = rel.value * rel.value
  const value = clamp01(4 * anchorStrength * newShare * (1 - newShare * 0.5) * (1 - 0.6 * alreadyCovered))

  const depth = near?.parentInterestId ? 'a sub-interest of something you follow' : 'a top-level interest'
  const to = unfamiliar.slice(0, 3).join(', ') || null

  return {
    value,
    why: near
      ? `reaches ${(newShare * 100).toFixed(0)}% unfamiliar material from ${near.name} (${depth})${to ? `, specifically ${to}` : ''}` +
        (alreadyCovered > 0.5
          ? `, but damped because relevance ${rel.value.toFixed(2)} means this is mostly inside what you already follow`
          : '')
      : 'no anchoring interest could be identified',
    from: near?.name ?? null,
    to,
  }
}

// ---------------------------------------------------------------------------
// N — novelty
// ---------------------------------------------------------------------------

/**
 * How little like this the user has recently been shown.
 *
 * `recentlyShown` is a list of token sets from items already served (the store
 * supplies the last few weeks). Novelty is 1 minus the *maximum* similarity to
 * any of them: being unlike the average of your history is easy, and being
 * unlike every single thing in it is the property worth having.
 *
 * Never used alone, and the weight (0.10) says so. The spec's warning is exact:
 * "a totally unrelated item is novel but may not be useful." Novelty's job is to
 * break ties inside a bucket, and in the outside-the-map bucket to be the
 * primary ordering *among items that already cleared the quality floor*.
 */
export function novelty(item: FeedItem, recentlyShown: Set<string>[]): Part {
  if (recentlyShown.length === 0) {
    return { value: 1, why: 'nothing has been shown yet, so everything is new to the feed' }
  }
  const mine = new Set([...contentTokens(item.title), ...item.topicTags.map(t => t.value)])
  let worst = 0
  for (const prev of recentlyShown) worst = Math.max(worst, jaccard(mine, prev))
  const value = clamp01(1 - worst)
  return {
    value,
    why: worst < 0.1
      ? `nothing in your last ${recentlyShown.length} items resembles this`
      : `closest of your last ${recentlyShown.length} items overlaps ${(worst * 100).toFixed(0)}%`,
  }
}

// ---------------------------------------------------------------------------
// L — local fit
// ---------------------------------------------------------------------------

/**
 * Whether the item covers the user's region.
 *
 * Three channels, best-of: the feed's declared region, the user's region names
 * appearing in the item, and the feed being local reporting at all. The feed's
 * region is the strongest because it is a fact about the publisher rather than a
 * string match — "Austin" in a national story about Austin, Texas is a mention;
 * a feed whose region is Texas is reporting from there.
 *
 * Returns 0 with an explanation when the user set no region, rather than a
 * neutral 0.5. A neutral value would give every item a tenth of a point for a
 * preference the user never expressed, and the local bucket would then fill with
 * whatever happened to rank next.
 */
export function localFit(item: FeedItem, feed: Feed, regions: string[]): Part {
  if (regions.length === 0) {
    return { value: 0, why: 'you have not named a region, so nothing counts as local' }
  }
  const wanted = regions.map(r => r.toLowerCase().trim()).filter(Boolean)

  const feedRegion = (feed.region ?? '').toLowerCase()
  if (feedRegion && wanted.some(w => feedRegion.includes(w) || w.includes(feedRegion))) {
    return { value: 1, why: `the feed itself covers ${feed.region}` }
  }

  const probe = `${item.title} ${item.summary ?? ''} ${item.entities.map(e => e.value).join(' ')}`.toLowerCase()
  const mentioned = wanted.filter(w => probe.includes(w))
  if (mentioned.length > 0) {
    return {
      value: feed.sourceType === 'local_reporting' ? 0.85 : 0.6,
      why: `mentions ${mentioned.join(', ')}${feed.sourceType === 'local_reporting' ? ', from a local newsroom' : ''}`,
    }
  }

  if (feed.sourceType === 'local_reporting') {
    return { value: 0.25, why: 'a local newsroom, but this item does not name your region' }
  }
  return { value: 0, why: `does not mention ${wanted.join(' or ')}` }
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export interface ScoreContext {
  interests: Interest[]
  regions: string[]
  /** Token sets of items already shown, for novelty. */
  recentlyShown: Set<string>[]
  now: string
  weights?: ScoreWeights
  qualityFloor?: number
}

/** `base` from the parts. Exported so the UI can recompute under new weights. */
export function blend(parts: ScoreParts, weights: ScoreWeights = DEFAULT_WEIGHTS): number {
  return clamp01(
    weights.relevance * parts.relevance +
    weights.quality * parts.quality +
    weights.freshness * parts.freshness +
    weights.bridge * parts.bridge +
    weights.novelty * parts.novelty +
    weights.localFit * parts.localFit,
  )
}

/**
 * The eligibility floor, applied before ranking.
 *
 * Only quality gates. Not relevance — an item can be eligible and simply never
 * selected, and conflating "too weak to show" with "not for you" would make the
 * outside-the-map bucket impossible to fill by construction.
 */
export function isEligible(
  parts: ScoreParts, feed: Feed, floor = QUALITY_FLOOR,
): { eligible: boolean; reason: string | null } {
  if (parts.quality >= floor) return { eligible: true, reason: null }
  if (feed.userDesignated) {
    return { eligible: true, reason: null }
  }
  return {
    eligible: false,
    reason: `quality ${parts.quality.toFixed(2)} is below the floor of ${floor.toFixed(2)}, and ${feed.name} is not a feed you designated`,
  }
}

/** Score one item. Pure; the context carries everything it is allowed to see. */
export function scoreItem(
  item: FeedItem, feed: Feed, ctx: ScoreContext,
  interestCache?: Map<string, Set<string>>,
): ScoredItem {
  const weights = ctx.weights ?? DEFAULT_WEIGHTS
  const rel = relevance(item, ctx.interests, interestCache)
  const qual = quality(item, feed)
  const fresh = freshness(item, ctx.now)
  const br = bridge(item, ctx.interests, rel)
  const nov = novelty(item, ctx.recentlyShown)
  const loc = localFit(item, feed, ctx.regions)

  const parts: ScoreParts = {
    relevance: rel.value,
    quality: qual.value,
    freshness: fresh.value,
    bridge: br.value,
    novelty: nov.value,
    localFit: loc.value,
  }

  const { eligible, reason } = isEligible(parts, feed, ctx.qualityFloor)

  return {
    item,
    feed,
    parts,
    base: blend(parts, weights),
    because: {
      relevance: rel.why,
      quality: qual.why,
      freshness: fresh.why,
      bridge: br.why,
      novelty: nov.why,
      localFit: loc.why,
    },
    matchedInterests: rel.matched,
    // Below 0.15 there is a number but no connection worth naming, and
    // offering one anyway is how an explanation becomes a confabulation.
    bridgeFrom: br.value >= 0.15 ? br.from : null,
    bridgeTo: br.value >= 0.15 ? br.to : null,
    eligible,
    ineligibleReason: reason,
  }
}

/**
 * Score many.
 *
 * Tokenizes each interest name once for the whole batch rather than once per
 * item. With 40 interests and 600 candidates that is 24,000 tokenizations saved,
 * and tokenize() is the hottest function in the pipeline.
 */
export function scoreAll(
  pairs: { item: FeedItem; feed: Feed }[], ctx: ScoreContext,
): ScoredItem[] {
  const cache = interestTokens(ctx.interests)
  return pairs.map(({ item, feed }) => scoreItem(item, feed, ctx, cache))
}
