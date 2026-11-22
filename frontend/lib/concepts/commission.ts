/**
 * The seam between RPG mode and the practice engine.
 *
 * docs/RPG_AND_THE_GRAPH.md §4 and §12: the refused road is the best prompt
 * this system ever generates and it is currently a dead end with a name in it.
 * "That road needs long division" is a next move the player cannot take
 * without leaving the fiction, opening another tab, and finding the concept
 * themselves. This module is what turns the refusal into the work.
 *
 * ── WHAT A COMMISSION IS, AND WHAT IT DELIBERATELY IS NOT ─────────────────
 *
 * It is a resolution: given a concept the traversal named as missing, which
 * shipped subject owns work on it, and is there any work to own. That is all.
 *
 * It is NOT a stored row with a state machine. §9 of the design argues for one
 * and it is right eventually, but none of §4 needs it: the refusal already
 * names the concept, the Practice tab already serves tasks for a named
 * concept's subject, the verifier already rules, and the strength gate already
 * opens the road when the work is done. Adding a table before any of that is
 * exercised would be building the bookkeeping for a loop nobody has played.
 *
 * ── NO NEW GATE. THIS IS THE LOAD-BEARING SENTENCE ────────────────────────
 *
 * Nothing here opens a road, and nothing here can. A road opens when
 * `conceptStrength >= MASTERY_FLOOR`, which is the gate that was always there
 * and is evaluated by `offerKey` in traversal.ts against the strength table.
 * A commission is a way of ARRIVING at the work, not a second key — so this
 * module reads no strengths, writes nothing, and returns no permission. If a
 * future change has it returning something a caller could treat as "the road
 * may now open", that change is the failure mode the design names.
 *
 * ── WHY IT REFUSES TO OFFER WORK THAT CANNOT BE DONE ──────────────────────
 *
 * §10: "a commission that cannot be completed" is on the list of what must not
 * happen. Sixteen of the twenty-one regions hold mapped areas with no material
 * — a map node carries no knowledge points — so a refusal can perfectly well
 * name a concept that has nothing authored behind it. Handing somebody a
 * button that leads to an empty practice set is worse than the dead end it
 * replaced, because the dead end at least did not promise.
 *
 * So `offerFor` returns a tagged result and the UI says which one it got. The
 * one thing it must never do is return `workable` for a concept with no
 * problems.
 *
 * ── WHAT IT CANNOT KNOW, AND SAYS SO ──────────────────────────────────────
 *
 * Whether the concept is *introducible* — whether ITS prerequisites are met —
 * is a strength question, and strengths live on the server behind
 * /api/learn/session for one subject at a time. A missing concept is routinely
 * in a different subject from the one being practised, so the answer is not in
 * the client's hands when the button is drawn.
 *
 * This is handled by being honest rather than by guessing: the offer says work
 * exists, the handoff lands the learner in that subject, and from there the
 * session either serves a task for the concept or reports it under `blocked`
 * with its own prerequisites and the claim escape hatch. Both are useful and
 * neither is a lie. What the handoff must not do is land somebody on an
 * unrelated problem and let them assume it was the one they asked for —
 * see `app/learn/page.tsx`, which reports a miss rather than swallowing it.
 */

import type { ConceptOntology } from './types'
import { ONTOLOGIES } from './ontology'
import { isPractisable } from './tasks'

export type WorkOffer =
  /**
   * A shipped subject owns this concept and has at least one problem for it.
   * `subjectId` is what the Practice tab's own picker would be set to.
   */
  | { kind: 'workable'; conceptId: string; conceptName: string; subjectId: string; subjectName: string }
  /**
   * The concept is on the map and nothing is authored for it. Named rather
   * than hidden: "the work here is not yet recorded" is true, is the state of
   * most of the atlas, and is the most specific authoring request the system
   * can produce (§8, option 3).
   */
  | { kind: 'unwritten'; conceptId: string; conceptName: string }

/**
 * Which subject to practise for a given concept, if any.
 *
 * Searches `ONTOLOGIES` — the ten shipped subjects — rather than the composed
 * atlas, because the answer has to be a subject the session route will accept
 * as `?subject=`. A concept that exists only in the composed map belongs to no
 * shipped ontology and is `unwritten` by construction.
 *
 * The first ontology that both declares the concept and has a problem for it
 * wins. A concept declared in two shipped subjects would be a different bug
 * (one concept, two owners) and is not this function's to detect; taking the
 * first is the same thing `getOntology`-based lookups elsewhere do.
 */
export function offerFor(conceptId: string, conceptName: string): WorkOffer {
  for (const o of ONTOLOGIES) {
    if (!o.concepts.some(c => c.id === conceptId)) continue
    if (!isPractisable(o, conceptId)) continue
    return {
      kind: 'workable',
      conceptId,
      conceptName,
      subjectId: o.subject.id,
      subjectName: o.subject.name,
    }
  }
  return { kind: 'unwritten', conceptId, conceptName }
}

/** Convenience for the refusal UI, which has a list of missing concepts. */
export function offersFor(missing: { conceptId: string; conceptName: string }[]): WorkOffer[] {
  return missing.map(m => offerFor(m.conceptId, m.conceptName))
}

/**
 * Whether anything in a refusal can actually be worked.
 *
 * Used to decide whether the refusal gets the "take the work" half at all. A
 * refusal naming three concepts none of which has material gets the honest
 * sentence and no buttons, rather than three disabled ones.
 */
export function anyWorkable(offers: WorkOffer[]): boolean {
  return offers.some(o => o.kind === 'workable')
}

/**
 * The subject that owns a knowledge point, among the shipped ten.
 *
 * `ontology.ts` has `subjectOfPoint` for the same question; this is the
 * concept-level sibling and exists so a caller resolving a TASK back to a
 * subject does not have to reach through two modules. Returns the ontology so
 * the caller can read both the id and the display name.
 */
export function ontologyOwning(conceptId: string): ConceptOntology | null {
  return ONTOLOGIES.find(o => o.concepts.some(c => c.id === conceptId)) ?? null
}
