/**
 * The atlas: a map of mathematics, most of which has no problems written for it.
 *
 * ── WHY THIS IS A SEPARATE THING FROM AN ONTOLOGY ─────────────────────────
 *
 * `ontology.ts` and `ontology-exponentials.ts` are *syllabi*. Every concept in
 * them carries objectives and knowledge points with hand-checked worked
 * examples, because every concept in them is meant to be practised. That is the
 * right standard for material a learner is assessed against and it is the wrong
 * standard for a map: at roughly forty lines of authored prose per knowledge
 * point, requiring one before a concept may be *named* means mathematics cannot
 * be drawn at all, and the thing a learner most wants from /learn — where am I,
 * and what is this subject shaped like — is exactly what cannot be built.
 *
 * So the atlas is the other half. It names concepts, places them in an area,
 * and records what rests on what. It deliberately carries no knowledge points.
 * `isTeachable` in registry.ts is false for every node here until somebody
 * writes material, and `gatingPrerequisitesOf` therefore looks *through* these
 * nodes rather than at them — which is the property that makes the map safe to
 * grow. See that function's header: a node with no material makes no claim
 * about mastery, so it cannot gate, so adding a hundred unwritten nodes cannot
 * block a single learner.
 *
 * ── THE ATLAS NEVER RE-DECLARES AN AUTHORED CONCEPT ───────────────────────
 *
 * Where the map meets the two authored subjects, it does NOT restate them. It
 * points at their real ids. `integration-partial-fractions` needs
 * `partial-fractions-linear`, the actual concept in the actual syllabus, so
 * mastering the authored material genuinely opens the mapped node behind it and
 * the two halves are one graph rather than two drawings of overlapping things.
 * `atlasProblems` enforces this: a node id that collides with an authored
 * concept is an error, not a merge.
 *
 * ── WHAT "COMPLETE" WOULD MEAN, AND WHAT THIS IS ──────────────────────────
 *
 * This is not a complete map of mathematics and should not be described as one.
 * It is a first atlas: the areas a mathematics education actually passes
 * through, at the granularity a course names topics, with the prerequisite
 * edges that matter. `atlasCoverage()` reports the real numbers — areas, nodes,
 * how many are teachable — so the gap between this and complete is a figure on
 * the page rather than an impression. Every edge here was authored by hand; none
 * was derived, and none is a candidate (the quarantine in derive.ts is for
 * *proposed* structure, and nothing here is proposed).
 *
 * The boundaries are chosen where a mathematician would put them rather than
 * where a syllabus would: `real-analysis` restates convergence because its
 * standard of proof is the content, not because it repeats calculus.
 */

import { ONTOLOGIES } from './ontology'
import type { Concept, ConceptEdge, ConceptOntology, Subject } from './types'

// ---------------------------------------------------------------------------
// The authoring form
// ---------------------------------------------------------------------------

/**
 * One concept on the map.
 *
 * Compact on purpose. A `Concept` needs a `scope` facet option and a fidelity
 * and a caveat, all of which are mechanical for a mapped node, and asking an
 * author to type them two hundred times would guarantee they stop being typed
 * carefully. `expandArea` derives them; `is` and `needs` are the only fields
 * that carry judgement, and they are the only ones required.
 */
export interface MapNode {
  id: string
  name: string
  /**
   * One line: what this concept is, and where its edge is.
   *
   * Required, and it is the field that makes a map node worth having. A node
   * with only a name is a word; the sentence is what tells a reader whether it
   * is the thing they are looking for.
   */
  is: string
  /**
   * Concepts that must be strong before this one is introduced. May name a node
   * in another area, or an authored concept in one of the syllabi.
   *
   * Omitted means a root of the map, which is a strong claim and should be rare.
   */
  needs?: string[]
  /**
   * Concepts this one exercises when practised, for credit propagation.
   *
   * Inert while the node is unteachable — there is nothing to earn credit from
   * — and authored now because the claim is about the mathematics rather than
   * about the material, so it is just as true before the problems exist.
   */
  exercises?: string[]
  /** Confusable with, and why. Symmetric; state it once. */
  confusedWith?: { id: string; because: string }[]
  /** Search terms for the scope hint. Defaults to the name. */
  terms?: string
}

export interface MapArea {
  id: string
  name: string
  /** What the area covers and what it does not. Shown as the subject blurb. */
  covers: string
  nodes: MapNode[]
  /**
   * Edges between concepts the area does not own.
   *
   * `needs` can only add an edge *into* one of this area's own nodes, which
   * leaves one real relation unsayable: that an AUTHORED concept rests on a
   * mapped one. Polynomial arithmetic genuinely rests on integer arithmetic,
   * and without this field the two authored syllabi would sit in the composed
   * graph as roots with nothing behind them — drawn as though they were where
   * mathematics begins.
   *
   * It stays a separate field rather than being folded into `needs` because an
   * edge whose endpoints are both outside the area is the one kind of edge
   * whose owner is not obvious, and burying it inside a node would hide it from
   * whoever maintains the subject on the other end.
   */
  links?: { from: string; to: string; because?: string }[]
}

/**
 * Why every mapped node is `guided` rather than `checked`.
 *
 * `fidelity` is about whether a *pattern* can decide that some offering is
 * really about this concept. An authored concept writes that pattern by hand
 * alongside its material. A mapped node has no material and no pattern, and
 * generating one from the name would be the worst of both: a regex nobody wrote
 * deliberately, presented as a check. So the node says plainly that nothing
 * checks it.
 */
const MAPPED_CAVEAT =
  'On the map only. This concept has a name, an area and a place in the prerequisite ' +
  'order, and nothing is written for it yet — so there are no problems to practise, ' +
  'nothing checks that a statement is really about it, and it gates nothing.'

function expandNode(area: MapArea, node: MapNode): Concept {
  return {
    id: node.id,
    name: node.name,
    subjectId: area.id,
    scope: {
      id: node.id,
      label: node.name,
      hint: node.terms ?? node.name.toLowerCase(),
      // No `match`: see MAPPED_CAVEAT.
    },
    fidelity: 'guided',
    caveat: MAPPED_CAVEAT,
    // No objectives. An objective names task kinds an observation could
    // satisfy, and there are no observations here — `ontologyProblems` reports
    // exactly this pairing, because it is a promise of practice that can never
    // be served.
    objectives: [],
    knowledgePoints: [],
  }
}

/** The edges an area's nodes declare, with ids derived from the pair they join. */
function expandEdges(area: MapArea): ConceptEdge[] {
  const out: ConceptEdge[] = []
  for (const node of area.nodes) {
    for (const need of node.needs ?? []) {
      out.push({
        id: `${need}->${node.id}`,
        from: need,
        to: node.id,
        kind: 'prerequisite',
        promotedBy: `atlas:${area.id}`,
      })
    }
    for (const sub of node.exercises ?? []) {
      out.push({
        id: `${node.id}=>${sub}`,
        from: node.id,
        to: sub,
        kind: 'encompasses',
        promotedBy: `atlas:${area.id}`,
      })
    }
    for (const other of node.confusedWith ?? []) {
      out.push({
        id: `${node.id}~${other.id}`,
        from: node.id,
        to: other.id,
        kind: 'interferes_with',
        promotedBy: `atlas:${area.id}`,
        rationale: other.because,
      })
    }
  }
  for (const link of area.links ?? []) {
    out.push({
      id: `${link.from}->${link.to}`,
      from: link.from,
      to: link.to,
      kind: 'prerequisite',
      promotedBy: `atlas:${area.id}`,
      rationale: link.because,
    })
  }
  return out
}

/**
 * An area as a standalone ontology — its own nodes, and only the edges that
 * stay inside it.
 *
 * The filter is the point. Most of an area's edges reach outside it (that is
 * what makes the atlas a graph rather than a shelf of lists), and an ontology
 * whose edges name concepts it does not contain fails `ontologyProblems` on
 * every one of them — so an unfiltered area view would report dozens of
 * "unknown concept" faults that are not faults. The cross-area edges are not
 * lost; `composeAtlas` is where they live, and it is the only view in which
 * both endpoints exist.
 */
export function areaOntology(area: MapArea): ConceptOntology {
  const subject: Subject = {
    id: area.id,
    name: area.name,
    covers: area.covers,
    medium: 'theorem',
    facetName: 'Concept',
    facetDoes: 'Which concept the statement has to be about.',
  }
  const own = new Set(area.nodes.map(n => n.id))
  return {
    subject,
    concepts: area.nodes.map(n => expandNode(area, n)),
    edges: expandEdges(area).filter(e => own.has(e.from) && own.has(e.to)),
  }
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

/**
 * Every area and every authored subject as ONE ontology.
 *
 * One graph rather than a list of graphs, because the edges that make a map
 * worth drawing are the ones that cross: integration by partial fractions rests
 * on partial fractions, and a per-area view is precisely the view in which that
 * fact is invisible. The authored subjects come in whole — their concepts keep
 * their own `subjectId`, which is how `areaOf` can still say where a concept
 * lives after the merge.
 *
 * `subjectId` deliberately disagrees with `subject.id` here. Nothing validates
 * that pair (see `ontologyProblems`), and the disagreement is load-bearing: it
 * is what preserves provenance through the union.
 */
export function composeAtlas(areas: MapArea[], authored: ConceptOntology[]): ConceptOntology {
  const subject: Subject = {
    id: 'mathematics',
    name: 'Mathematics',
    covers:
      'The whole map: every area below, plus the subjects that have problems written for ' +
      'them. Most of it is mapped only — named and ordered, with nothing to practise yet.',
    medium: 'theorem',
    facetName: 'Concept',
    facetDoes: 'Which concept the statement has to be about.',
  }
  return {
    subject,
    concepts: [...authored.flatMap(o => o.concepts), ...areas.flatMap(a => a.nodes.map(n => expandNode(a, n)))],
    // `expandEdges`, not `areaOntology(a).edges` — the whole reason to compose
    // is the edges that leave their area, and that is exactly what the area
    // view filters out.
    edges: [...authored.flatMap(o => o.edges), ...areas.flatMap(a => expandEdges(a))],
  }
}

// ---------------------------------------------------------------------------
// Checks the atlas needs and an ontology cannot give it
// ---------------------------------------------------------------------------

/**
 * Faults that only exist because the atlas spans files.
 *
 * `ontologyProblems` already catches unknown edge endpoints, cycles and
 * self-joins on the composed graph, and those checks are not repeated. What it
 * cannot see is the atlas's own two rules:
 *
 *  1. A map node must not collide with an authored concept. The intent of
 *     naming an authored concept in `needs` is to POINT at it; a node with the
 *     same id would instead shadow it in the composed concept list, and the
 *     shadowed copy has no knowledge points — so a subject that is fully
 *     authored would silently read as unteachable.
 *  2. Two areas must not declare the same node. Same failure, between map
 *     files, and easy to cause when an area's natural boundary overlaps a
 *     neighbour's.
 */
export function atlasProblems(areas: MapArea[], authored: ConceptOntology[]): string[] {
  const out: string[] = []
  const authoredIds = new Map<string, string>()
  for (const o of authored) {
    for (const c of o.concepts) authoredIds.set(c.id, o.subject.id)
  }

  const seen = new Map<string, string>()
  for (const area of areas) {
    for (const node of area.nodes) {
      const clash = authoredIds.get(node.id)
      if (clash) {
        out.push(
          `${area.id}/${node.id}: collides with the authored concept of the same id in ` +
          `${clash} — a map node must point at authored material through \`needs\`, not restate it`,
        )
      }
      const twin = seen.get(node.id)
      if (twin) out.push(`${node.id}: declared by both ${twin} and ${area.id}`)
      else seen.set(node.id, area.id)

      if (!node.is.trim()) out.push(`${area.id}/${node.id}: has no description`)
    }
  }
  return out
}

/**
 * What the map actually covers.
 *
 * Exists so "a map of mathematics" is a number rather than a claim. The ratio
 * that matters is `teachable / total`: it is currently small, and printing it
 * is the difference between an atlas that is honest about being mostly empty
 * and one that implies a curriculum it does not have.
 */
export interface AtlasCoverage {
  areas: number
  /** Every concept in the composed graph, mapped and authored alike. */
  concepts: number
  /** Those with at least one knowledge point. */
  teachable: number
  /** Prerequisite edges only — the ones that order the subject. */
  prerequisiteEdges: number
  /** Edges whose two endpoints have different `subjectId`s. */
  crossAreaEdges: number
  /** Per area: how much of it is written. */
  byArea: { id: string; name: string; concepts: number; teachable: number }[]
}

export function atlasCoverage(atlas: ConceptOntology): AtlasCoverage {
  const subjectOf = new Map<string, string>()
  const nameOf = new Map<string, string>()
  for (const c of atlas.concepts) {
    subjectOf.set(c.id, c.subjectId)
    nameOf.set(c.subjectId, c.subjectId)
  }

  const byArea = new Map<string, { concepts: number; teachable: number }>()
  for (const c of atlas.concepts) {
    const row = byArea.get(c.subjectId) ?? { concepts: 0, teachable: 0 }
    row.concepts += 1
    if (c.knowledgePoints.length > 0) row.teachable += 1
    byArea.set(c.subjectId, row)
  }

  const prereqs = atlas.edges.filter(e => e.kind === 'prerequisite')
  return {
    areas: byArea.size,
    concepts: atlas.concepts.length,
    teachable: atlas.concepts.filter(c => c.knowledgePoints.length > 0).length,
    prerequisiteEdges: prereqs.length,
    crossAreaEdges: prereqs.filter(e => subjectOf.get(e.from) !== subjectOf.get(e.to)).length,
    byArea: [...byArea.entries()].map(([id, row]) => ({ id, name: id, ...row })),
  }
}

/** Which area or authored subject a concept lives in. */
export function areaOf(atlas: ConceptOntology, conceptId: string): string | null {
  return atlas.concepts.find(c => c.id === conceptId)?.subjectId ?? null
}

// ---------------------------------------------------------------------------
// The shipped atlas
// ---------------------------------------------------------------------------

import { FOUNDATION_AREAS } from './atlas-foundations'
import { ANALYSIS_AREAS } from './atlas-analysis'
import { STRUCTURE_AREAS } from './atlas-structures'
import { UNCERTAINTY_AREAS } from './atlas-uncertainty'

/**
 * Areas in teaching order, which is also roughly dependency order.
 *
 * Grouped across four files by *kind of mathematics* rather than by size:
 * foundations (what a school course covers), analysis (the limit and what rests
 * on it), structures (algebra, discrete, the objects), uncertainty (probability
 * and inference). One file would be three thousand lines and nobody would read
 * the end of it.
 */
export const AREAS: MapArea[] = [
  ...FOUNDATION_AREAS,
  ...ANALYSIS_AREAS,
  ...STRUCTURE_AREAS,
  ...UNCERTAINTY_AREAS,
]

export const MATHEMATICS: ConceptOntology = composeAtlas(AREAS, ONTOLOGIES)

export function shippedAtlasProblems(): string[] {
  return atlasProblems(AREAS, ONTOLOGIES)
}
