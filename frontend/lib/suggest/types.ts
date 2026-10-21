/**
 * A suggested feed: what was collected, what it was scored on, and which part of
 * the mix each selection is serving.
 *
 * The design constraint the spec states and this module enforces in the type
 * system is that **relevance, quality and discovery are separate numbers**. They
 * are separate fields of `ScoreParts`, never collapsed before `base` is computed,
 * and `base` is stored alongside its parts rather than instead of them. A single
 * blended score is the thing that makes a feed impossible to debug: when an item
 * you did not want shows up, "it scored 0.71" tells you nothing, and
 * "R=0.9 Q=0.2 — it matched your interests and the source cites nothing" tells
 * you what to change.
 *
 * Three more rules live in the types rather than in prose:
 *
 *  - Every label carries a `reason`. `Labelled<T>` exists so a classification can
 *    never be stored without the evidence that produced it, because the spec asks
 *    for classifications to be *correctable* and you cannot correct what you
 *    cannot see the basis of.
 *  - A `Bucket` is an enum, not a number. An item's slot in the mix is a
 *    categorical fact about what role it plays, and bucket assignment is the one
 *    decision the greedy selector makes that a user would want to argue with.
 *  - `DigestGap` is a first-class part of a digest, not an error. The spec is
 *    explicit: "Don't manufacture discovery content when the feed list doesn't
 *    contain it" — so a short bucket must be *reportable*, which means the type
 *    that carries the selection also carries the shortfall.
 *
 * Nothing in this directory reaches the network, a database, or a model. The
 * whole pipeline is a pure function from stored rows to a digest, which is what
 * makes tests/suggest-logic.mjs able to assert on it. Embeddings and an LLM enter
 * only as *optional inputs* — `FeedItem.embedding` and the `Labelled.reason`
 * strings — so that the no-LLM path is the default rather than a degraded mode.
 */

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/**
 * What kind of thing publishes this feed.
 *
 * This is a claim about the *relationship between the publisher and the events
 * it reports* — whether it was there, whether it is the party involved, whether
 * it is summarising others — and nothing else. It is deliberately not a quality
 * ranking and deliberately not a politics axis. The spec says it outright:
 * "don't infer a source's political leaning as a quality score." A leaning field
 * would be used as one within a week of existing, so there isn't one.
 *
 * `source_type` feeds the quality prior in score.ts, and that is a *prior* — one
 * term among several, overridable by what an individual item actually contains.
 */
export type SourceType =
  /** Reporters covering a place they are in. Carries the local-fit prior. */
  | 'local_reporting'
  /** Deep coverage of one domain, by people who work in it. */
  | 'specialist'
  /** Agency copy: broad, fast, thin, and widely syndicated — the duplicate engine. */
  | 'wire'
  /** The party itself: filings, press releases, standards bodies, court documents. */
  | 'primary_source'
  /** Papers, preprints, datasets, technical reports. */
  | 'research'
  /** Argument about events reported elsewhere. */
  | 'commentary'

export interface Feed {
  feedId: string
  url: string
  name: string
  /** BCP-47-ish, as the feed declares it. Not inferred from the text. */
  language: string | null
  /** Free text the user controls, e.g. 'Texas', 'Houston', 'EU'. */
  region: string | null
  /** User-editable. Seeded from the feed's own categories, never locked. */
  topicTags: string[]
  sourceType: SourceType
  enabled: boolean
  /**
   * A feed the user vouched for by name.
   *
   * Its items bypass the quality floor (score.ts `isEligible`). This is the
   * spec's stated exception and it is the right one: the floor exists to stop
   * novelty and recency from rescuing weak items, not to overrule somebody who
   * said "I want this publication."
   */
  userDesignated: boolean
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

/**
 * A classification together with why it was made.
 *
 * `reason` is not decoration. Topic tags, entities and article type are all
 * guesses — from feed metadata, then keywords, then optionally a model — and the
 * spec asks for the original text and the basis of each label to be kept "so
 * classifications can be corrected". A label whose provenance was dropped can
 * only be deleted, not argued with.
 *
 * `confidence` is honest about its own coarseness: 'declared' means the feed or
 * the publisher said so, 'derived' means this code worked it out, 'guessed'
 * means a heuristic fired with weak evidence. Three values, because a float here
 * would imply a calibration nothing in this pipeline has.
 */
export interface Labelled<T> {
  value: T
  reason: string
  confidence: 'declared' | 'derived' | 'guessed'
}

/**
 * What an item *is*, as opposed to what it is about.
 *
 * Kept apart from topic tags because the two answer different questions and the
 * bucket planner needs this one: the "context and background" bucket is defined
 * by article type, not by subject. An explainer about energy storage and a news
 * flash about energy storage are the same topic and different roles in a week's
 * reading.
 */
export type ArticleType =
  | 'news'
  | 'analysis'
  | 'explainer'
  | 'opinion'
  | 'research'
  | 'official_release'
  | 'investigation'
  | 'data'
  /** Nothing fired. Not a category — an admission, and it is scored as one. */
  | 'unclassified'

export interface FeedItem {
  itemId: string
  feedId: string
  /** Normalized per normalize.ts. The dedup key, and the link the user follows. */
  canonicalUrl: string
  /**
   * Exactly what the feed gave, before normalization.
   *
   * Kept because canonicalization is lossy and occasionally wrong: a publisher
   * that routes through a tracking host can have its real URL destroyed by
   * parameter stripping, and when that happens the only recovery is the original.
   */
  originalUrl: string
  title: string
  summary: string | null
  publishedAt: string | null
  author: string | null
  /** Full text when the feed carries it. Often absent; absence is not an error. */
  text: string | null
  topicTags: Labelled<string>[]
  entities: Labelled<string>[]
  articleType: Labelled<ArticleType>
  /** Optional. Present only once an embedding provider has run over the item. */
  embedding: number[] | null
  /** Set by cluster.ts. Null until clustering has run. */
  storyClusterId: string | null
  /**
   * Stable hash of the normalized title + body, for exact-duplicate detection
   * when two feeds publish the same piece at different URLs.
   */
  contentHash: string
}

// ---------------------------------------------------------------------------
// Interests
// ---------------------------------------------------------------------------

/**
 * One thing the user cares about.
 *
 * Stored apart from item metadata — the spec is explicit about this and it
 * matters more than it looks. If "interest" were a tag on an item, then the only
 * way to express a preference would be to edit the items, the preference would
 * be unavailable for items not yet fetched, and the record of *what the user
 * asked for* would be inseparable from the record of *what the publisher said*.
 *
 * `parentInterestId` is what makes adjacent discovery distinguishable from
 * outside-the-map discovery. Without a hierarchy there is only "matches" and
 * "doesn't match", and every unfamiliar item looks equally far away — which is
 * exactly the failure the discovery buckets exist to avoid.
 */
export interface Interest {
  interestId: string
  /** A topic ('energy storage'), an entity ('Iran'), or a question. */
  name: string
  kind: 'topic' | 'entity' | 'question'
  /** 0..1. Relative, not a probability. */
  weight: number
  parentInterestId: string | null
  /**
   * Whether the user set this weight by hand.
   *
   * Learned weights decay toward their prior each week (feedback.ts); an
   * explicitly-set weight is a statement, not an estimate, and decaying it would
   * quietly undo something the user typed.
   */
  explicitFeedback: boolean
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * The six numbers, each 0..1, never blended before they are stored.
 *
 * `relevance` and `quality` being separate is the single most load-bearing
 * decision in the spec. An interesting topic does not make a weak article a good
 * one, and a pipeline that multiplies them cannot tell you which half it was
 * reacting to.
 *
 * `novelty` is explicitly not usable alone, and the weights reflect that: an
 * item about nothing you have ever read is maximally novel and may be useless.
 * It is a tie-breaker among things that already cleared relevance and quality.
 */
export interface ScoreParts {
  relevance: number
  quality: number
  freshness: number
  bridge: number
  novelty: number
  localFit: number
}

/** The tunable half of scoring. Surfaced to the user, per the spec's §3. */
export interface ScoreWeights extends ScoreParts {}

/**
 * A scored candidate: the parts, the blend, and the prose.
 *
 * `explanation` is generated from the parts rather than written alongside them,
 * so it cannot drift out of agreement with the numbers it describes.
 */
export interface ScoredItem {
  item: FeedItem
  feed: Feed
  parts: ScoreParts
  base: number
  /** Why each part came out where it did. Keyed by `ScoreParts` field name. */
  because: Record<keyof ScoreParts, string>
  /** The interests that drove `relevance`, strongest first. */
  matchedInterests: string[]
  /**
   * For a bridge: the known interest, and the unfamiliar thing it reaches.
   * Null when `bridge` is low enough that there is no connection worth naming.
   */
  bridgeFrom: string | null
  bridgeTo: string | null
  /** False when the quality floor rejected it. Carries the reason. */
  eligible: boolean
  ineligibleReason: string | null
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Which part of the feed's mix a slot serves.
 *
 * An item can qualify for several of these; the selector assigns it to whichever
 * is currently shortest, which is what makes the mix hold when the candidate
 * pool is lopsided.
 */
export type Bucket =
  | 'core'
  | 'adjacent'
  | 'outside'
  | 'context'
  | 'local'

export interface BucketPlan {
  bucket: Bucket
  slots: number
}

/** The spec's table, for a 20-item weekly digest. User-adjustable. */
export const DEFAULT_BUCKET_PLAN: BucketPlan[] = [
  { bucket: 'core', slots: 8 },
  { bucket: 'adjacent', slots: 4 },
  { bucket: 'outside', slots: 3 },
  { bucket: 'context', slots: 3 },
  { bucket: 'local', slots: 2 },
]

export interface SelectedItem {
  scored: ScoredItem
  bucket: Bucket
  /** `base` after the three diversity penalties. What the ordering used. */
  selectionScore: number
  penalties: {
    repeat: number
    source: number
    topic: number
  }
  /** Which other buckets this item also qualified for. For the "why" answer. */
  alsoQualifiedFor: Bucket[]
  /**
   * Whether this slot was filled by back-fill rather than by qualifying.
   *
   * LOAD-BEARING FOR HONESTY, and on the item rather than only in the gap
   * counts because that is where every consumer needs it. §6's discovery hit
   * rate is computed over non-back-filled discovery items only; without a
   * per-item flag, a digest whose discovery buckets had no candidates and were
   * filled from the leftover pool would report a discovery hit rate over items
   * that were never discovery.
   */
  backfilled: boolean
}

/**
 * A bucket that could not be filled.
 *
 * Reported, never papered over. The spec: "If a bucket has too few eligible
 * items, fill from the remaining candidates and label the gap." A digest that
 * silently returns 14 items when 20 were asked for reads as "that is all there
 * is", and the real cause — too few feeds, every candidate from one source, a
 * quality floor nothing cleared — is the most useful thing the selector knows.
 *
 * This is the same discipline as `assembly.skipped` / `assembly.blocked` in the
 * practice scheduler: no silent caps.
 */
export interface DigestGap {
  bucket: Bucket
  wanted: number
  filled: number
  /** What ran out, in plain words. */
  reason: string
  /** How many of the shortfall were back-filled from outside the bucket's rule. */
  backfilled: number
}

export interface Digest {
  items: SelectedItem[]
  gaps: DigestGap[]
  /** Candidates that cleared nothing. Counted so the UI can say why it is thin. */
  rejected: { itemId: string; reason: string }[]
  /**
   * Digest-level notices that are not about one bucket.
   *
   * Separate from `gaps` because a gap names a bucket, and the things worth
   * saying here — "the source cap was relaxed", "only four feeds are enabled" —
   * are about the whole run. Stuffing one into a `DigestGap` would require
   * inventing a bucket for it, and an invented field is how a report starts
   * being read as data.
   */
  notes: string[]
  /** The weights and plan this digest was built with, for reproducibility. */
  weights: ScoreWeights
  plan: BucketPlan[]
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

/**
 * The five controls from the spec, plus the two weak signals kept apart from them.
 *
 * 'interesting_not_useful' is the one that earns its place: without it, the only
 * way to say "good find, wrong moment" is "less like this", which teaches the
 * system to stop finding that kind of thing. Keeping it distinct is how the
 * discovery buckets survive contact with a busy week.
 */
export type FeedbackKind =
  | 'more_like_this'
  | 'less_like_this'
  | 'interesting_not_useful'
  | 'already_saw'
  | 'worth_seeing'

/**
 * Clicks and dwell time. Named `weak` in the type so no call site can forget.
 *
 * The spec's reasoning, which is correct: a click can mean curiosity, confusion,
 * or a mis-tap, and a long article takes longer to read than a short one for
 * reasons that have nothing to do with whether it was worth reading.
 */
export interface WeakSignal {
  itemId: string
  kind: 'opened' | 'dwell_ms'
  value: number
}

export interface Feedback {
  itemId: string
  kind: FeedbackKind
  at: string
  /** The bucket the item was shown in. Needed for discovery-hit-rate. */
  shownAsBucket: Bucket
}
