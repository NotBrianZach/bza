/**
 * The bridge between a theorem in play and the concept graph it belongs to.
 *
 * ── Why this needed no new matching mechanism ─────────────────────────────
 *
 * A `Concept` already carries a `scope: FacetOption`, and a FacetOption already
 * carries a `match` pattern that decides whether a resolved offering belongs to
 * it. That is not a coincidence to be exploited — it is the fourth registry's
 * stated design: lib/concepts is "a scope ontology over the theorem medium"
 * (see `facetAdmits`), assembled per subject instead of registered per medium.
 *
 * So "which concepts is this theorem about" is the membership question the
 * patterns were written to answer, asked in the other direction. Nothing here
 * invents a similarity measure, and that matters: a hand-rolled one would drift
 * from the patterns that actually gate the scope picker, and the two would
 * disagree about what a concept covers.
 *
 * ── The honesty rule this file is mostly about ────────────────────────────
 *
 * Two different things can be offered about a concept, and conflating them is
 * the mistake available here:
 *
 *  - **Seeing** it — its position in the graph, what it rests on, what rests on
 *    it. True of every concept in the atlas, including the ~95% that are mapped
 *    and unwritten.
 *  - **Doing problems** on it — which requires knowledge points, and most of the
 *    map has none.
 *
 * `relatedConcepts` therefore reports `teachable` per concept and never guesses.
 * A link that promised problems and delivered an empty panel would be worse than
 * no link, because the learner would conclude the practice engine is broken
 * rather than that the curriculum is unwritten there.
 *
 * Guided concepts are excluded from *matching* for the same reason: a guided
 * scope "steers the search and filters nothing", so it has no pattern and cannot
 * establish that this offering is about it. It can still appear as a neighbour,
 * because the graph edge is authored and does not depend on any pattern.
 */

import type { Offering } from '../correlate/types'
import {
  conceptById, dependentsOf, encompassedBy, isTeachable, prerequisitesOf,
} from './registry'
import type { Concept, ConceptOntology } from './types'

/**
 * The concepts this offering is demonstrably about.
 *
 * ── Why the title and not the whole text ─────────────────────────────────
 *
 * The scope patterns are generous by design — knowledge.ts says so outright: "a
 * strict pattern produces a scope that feels broken, a loose one produces a
 * result the player can see and play past". That is the right trade for
 * *filtering a search*, where the cost of a false positive is one result you
 * skip. It is the wrong trade for *labelling a theorem*, where a false positive
 * is a confident claim that this theorem is about something it merely mentions.
 *
 * Measured against the patterns as they actually are, matching the full
 * haystack:
 *
 *   Logarithm    → "what a logarithm is" (right) plus exponent rules, what a
 *                  function is, inverse functions (all merely mentioned)
 *   Derivative   → "what a function is", on the word "function" in the extract
 *   Eigenvalues  → divisibility and factors, factoring a quadratic, on "factor"
 *
 * Matching the title alone keeps every correct match in those cases and drops
 * every wrong one. That is not a coincidence: an encyclopaedia entry's title
 * *is* its subject, while its extract is prose about the subject and will name
 * every neighbouring idea in passing.
 *
 * The cost is that Derivative and Eigenvalues now match nothing at all, and
 * that is the correct answer — the atlas has no checked concept for either, and
 * `relatedConcepts` returning nothing shows nothing. An empty trail is a
 * smaller failure than a wrong one, because a wrong one teaches the learner
 * that the graph does not mean anything.
 *
 * Ordered by pattern specificity, on the crude but reliable proxy of source
 * length: when "quadratic formula" and "equation" both match, the first is the
 * better label.
 */
export function conceptsInOffering(o: ConceptOntology, offering: Offering): Concept[] {
  if (offering.medium !== 'theorem') return []
  const subject = offering.title
  if (!subject) return []
  return o.concepts
    .filter(c => c.fidelity === 'checked' && c.scope.match?.test(subject))
    .sort((a, b) => (b.scope.match?.source.length ?? 0) - (a.scope.match?.source.length ?? 0))
}

/** Why a concept is being shown next to an offering. */
export type ConceptRelation =
  /** Its own scope pattern matches this offering. */
  | 'about'
  /** It gates one of the matched concepts. */
  | 'rests on'
  /** One of the matched concepts gates it. */
  | 'leads to'
  /** Exercising a matched concept exercises this one. */
  | 'contained in'

export interface RelatedConcept {
  id: string
  name: string
  relation: ConceptRelation
  /**
   * Whether problems can actually be served for it.
   *
   * The field the UI must not ignore. Most of the atlas is mapped and unwritten,
   * and a concept with no knowledge points can be read about but not practised.
   */
  teachable: boolean
  /** Present on a guided concept, printed verbatim. Never summarised away. */
  caveat?: string
}

/**
 * The concepts worth showing beside a theorem, and how each one is related.
 *
 * One hop, not a closure. `allPrerequisitesOf` would pull in the transitive
 * chain, which for anything in analysis is most of arithmetic — true, and
 * useless as a list beside a card. The point is to show where this sits so the
 * learner can step one square in any direction; the graph itself is one click
 * away and is the right surface for depth.
 *
 * Ordered matched-first, because those are the ones the offering establishes.
 * Everything after is the neighbourhood, and a neighbour reached from two
 * matched concepts is listed once under its first relation.
 */
export function relatedConcepts(
  o: ConceptOntology,
  offering: Offering,
  limit = 8,
): RelatedConcept[] {
  const matched = conceptsInOffering(o, offering)
  if (matched.length === 0) return []

  const seen = new Set<string>()
  const out: RelatedConcept[] = []

  const add = (id: string, relation: ConceptRelation) => {
    if (seen.has(id)) return
    const c = conceptById(o, id)
    if (!c) return
    seen.add(id)
    out.push({
      id,
      name: c.name,
      relation,
      teachable: isTeachable(o, id),
      ...(c.caveat ? { caveat: c.caveat } : {}),
    })
  }

  for (const c of matched) add(c.id, 'about')
  // Breadth before depth across the three edge kinds, so a short list is a
  // spread of directions rather than every prerequisite of the first match.
  for (const c of matched) prerequisitesOf(o, c.id).forEach(id => add(id, 'rests on'))
  for (const c of matched) dependentsOf(o, c.id).forEach(id => add(id, 'leads to'))
  for (const c of matched) encompassedBy(o, c.id).forEach(id => add(id, 'contained in'))

  return out.slice(0, limit)
}

/**
 * Where a concept is practised, or read about when it cannot be practised.
 *
 * Built here rather than in the component so the two cases cannot be mixed up at
 * a call site, and so the shape of the link is stated once. `tab` is explicit
 * because /learn opens on practice by default, and sending a learner to the
 * practice tab for a concept with no problems is the broken promise this file
 * exists to avoid.
 */
export function conceptHref(c: Pick<RelatedConcept, 'id' | 'teachable'>): string {
  const tab = c.teachable ? 'practice' : 'concepts'
  return `/learn?tab=${tab}&concept=${encodeURIComponent(c.id)}`
}
