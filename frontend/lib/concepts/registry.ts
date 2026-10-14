/**
 * Reading the fifth registry.
 *
 * Every walk here ignores `candidate_prerequisite`, and that is the single most
 * important property of this file. A candidate is imported or guessed structure
 * that no human has reviewed; if it could gate introduction, then an unreviewed
 * edge would decide a learner's curriculum, which is the opposite of what
 * quarantining it was for. `candidates()` and `promotionRate()` are the only
 * functions that can see them, and both exist to be *counted* rather than walked.
 *
 * The functions are pure and take the ontology explicitly rather than reaching for
 * a module-level default, for the same reason the correlation registries do: a
 * test wants to assert against a three-concept graph with a deliberate cycle in
 * it, and a hard-wired global makes that impossible to write.
 */

import type { Facet, FacetOption } from '@/lib/correlate/scope'
import type {
  Concept, ConceptEdge, ConceptEdgeKind, ConceptOntology, KnowledgePoint, TaskKind, TaskKindSpec,
} from './types'

// ---------------------------------------------------------------------------
// Task kinds
// ---------------------------------------------------------------------------

export const TASK_KINDS: Record<TaskKind, TaskKindSpec> = {
  transform_to_form: {
    id: 'transform_to_form',
    name: 'Rewrite it',
    asks: 'Put this expression into a named form.',
    verifiable: true,
  },
  evaluate: {
    id: 'evaluate',
    name: 'Evaluate it',
    asks: 'Produce the value at the stated inputs.',
    verifiable: true,
  },
  state: {
    id: 'state',
    name: 'State it',
    asks: 'Say what this is, in your own words.',
    verifiable: false,
  },
  counterexample: {
    id: 'counterexample',
    name: 'Break it',
    asks: 'Produce something that makes this claim false.',
    verifiable: true,
  },
  justify: {
    id: 'justify',
    name: 'Justify it',
    asks: 'Say why this step follows.',
    verifiable: false,
  },
}

export const TASK_KIND_LIST: TaskKindSpec[] = Object.values(TASK_KINDS)

export function isVerifiableKind(kind: TaskKind): boolean {
  return TASK_KINDS[kind]?.verifiable === true
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function conceptById(o: ConceptOntology, id: string): Concept | null {
  return o.concepts.find(c => c.id === id) ?? null
}

export function allKnowledgePoints(o: ConceptOntology): KnowledgePoint[] {
  return o.concepts.flatMap(c => [...c.knowledgePoints].sort((a, b) => a.position - b.position))
}

export function knowledgePointById(o: ConceptOntology, id: string): KnowledgePoint | null {
  for (const concept of o.concepts) {
    const found = concept.knowledgePoints.find(k => k.id === id)
    if (found) return found
  }
  return null
}

/** The concept a knowledge point belongs to, by its own `conceptId`. */
export function conceptOfPoint(o: ConceptOntology, pointId: string): Concept | null {
  const point = knowledgePointById(o, pointId)
  return point ? conceptById(o, point.conceptId) : null
}

/** Edges of one kind. Never a mixed set, because the kinds are not interchangeable. */
export function edgesOfKind(o: ConceptOntology, kind: ConceptEdgeKind): ConceptEdge[] {
  return o.edges.filter(e => e.kind === kind)
}

// ---------------------------------------------------------------------------
// Prerequisites
// ---------------------------------------------------------------------------

/** The concepts that must be strong before `id` is introduced. Promoted edges only. */
export function prerequisitesOf(o: ConceptOntology, id: string): string[] {
  return edgesOfKind(o, 'prerequisite').filter(e => e.to === id).map(e => e.from)
}

/** The concepts `id` unlocks. Promoted edges only. */
export function dependentsOf(o: ConceptOntology, id: string): string[] {
  return edgesOfKind(o, 'prerequisite').filter(e => e.from === id).map(e => e.to)
}

/**
 * Every prerequisite, transitively, nearest first.
 *
 * Breadth-first so the returned order is by depth rather than by discovery, which
 * is what a "what do I need first" list wants. Cycle-safe by the `seen` set: a
 * cyclic ontology is a bug (see `cycles`) but it must not hang the browser that
 * would show it to you.
 */
export function allPrerequisitesOf(o: ConceptOntology, id: string): string[] {
  const seen = new Set<string>([id])
  const out: string[] = []
  let frontier = prerequisitesOf(o, id)

  while (frontier.length > 0) {
    const next: string[] = []
    for (const cid of frontier) {
      if (seen.has(cid)) continue
      seen.add(cid)
      out.push(cid)
      next.push(...prerequisitesOf(o, cid))
    }
    frontier = next
  }
  return out
}

/**
 * Concepts with no prerequisites — where a learner can start.
 *
 * In registry order, not alphabetical: the ontology's own order is an authoring
 * decision about what to meet first, and sorting it away discards that.
 */
export function roots(o: ConceptOntology): string[] {
  return o.concepts.filter(c => prerequisitesOf(o, c.id).length === 0).map(c => c.id)
}

/**
 * A prerequisite-respecting order over the whole ontology.
 *
 * Kahn's algorithm, with ties broken by registry order so the result is stable
 * across runs — an unstable curriculum order would make two identical sessions
 * introduce concepts in different sequences for no reason the learner could see.
 *
 * Returns null when the graph has a cycle, rather than a partial order: a partial
 * order looks usable and silently omits concepts, and "the curriculum is
 * circular" is information the caller needs, not a degraded mode.
 */
export function teachingOrder(o: ConceptOntology): string[] | null {
  const order = o.concepts.map(c => c.id)
  const remaining = new Map(order.map(id => [id, prerequisitesOf(o, id).filter(p => order.includes(p)).length]))
  const out: string[] = []

  while (remaining.size > 0) {
    const ready = order.filter(id => remaining.get(id) === 0)
    if (ready.length === 0) return null
    for (const id of ready) {
      remaining.delete(id)
      out.push(id)
      for (const dep of dependentsOf(o, id)) {
        const count = remaining.get(dep)
        if (count !== undefined) remaining.set(dep, count - 1)
      }
    }
  }
  return out
}

/**
 * Prerequisite cycles, as the concept ids involved.
 *
 * Exists so the browser can *show* a broken ontology rather than refuse to load.
 * An ontology is authored by hand and will occasionally be circular; the useful
 * response is to name the loop, not to blank the page.
 */
export function cycles(o: ConceptOntology): string[][] {
  const found: string[][] = []
  const stack: string[] = []
  const onStack = new Set<string>()
  const done = new Set<string>()

  const walk = (id: string) => {
    if (onStack.has(id)) {
      found.push(stack.slice(stack.indexOf(id)))
      return
    }
    if (done.has(id)) return
    onStack.add(id)
    stack.push(id)
    for (const dep of dependentsOf(o, id)) walk(dep)
    stack.pop()
    onStack.delete(id)
    done.add(id)
  }

  for (const concept of o.concepts) walk(concept.id)
  return found
}

// ---------------------------------------------------------------------------
// Encompassing — the edge that makes credit computable
// ---------------------------------------------------------------------------

/** Concepts directly exercised by exercising `id`. */
export function encompassedBy(o: ConceptOntology, id: string): string[] {
  return edgesOfKind(o, 'encompasses').filter(e => e.from === id).map(e => e.to)
}

/**
 * Every concept exercised by `id`, with its distance in edges.
 *
 * Distance is returned rather than a flat set because credit decays with it: a
 * concept you used directly has stronger evidence behind it than one used by the
 * thing you used. The scheduler turns distance into a factor; this function has
 * no opinion about the rate.
 *
 * Breadth-first, so the first distance recorded for a concept is the shortest —
 * which is the one that should decide its credit when two paths reach it.
 */
export function encompassedClosure(o: ConceptOntology, id: string): Map<string, number> {
  const out = new Map<string, number>()
  let frontier = [id]
  let distance = 0

  while (frontier.length > 0 && distance < 16) {
    distance += 1
    const next: string[] = []
    for (const cid of frontier) {
      for (const target of encompassedBy(o, cid)) {
        if (target === id || out.has(target)) continue
        out.set(target, distance)
        next.push(target)
      }
    }
    frontier = next
  }
  return out
}

// ---------------------------------------------------------------------------
// Interference
// ---------------------------------------------------------------------------

/**
 * Concepts that must never be introduced alongside `id`. Symmetric: the edge is
 * stored once and read in both directions, because an interference that only
 * applied one way would depend on which concept the author happened to type first.
 */
export function interferesWith(o: ConceptOntology, id: string): string[] {
  const out = new Set<string>()
  for (const edge of edgesOfKind(o, 'interferes_with')) {
    if (edge.from === id) out.add(edge.to)
    if (edge.to === id) out.add(edge.from)
  }
  return [...out]
}

/** The authored reason, for the UI. Null when the pair does not interfere. */
export function interferenceReason(o: ConceptOntology, a: string, b: string): string | null {
  const edge = edgesOfKind(o, 'interferes_with').find(
    e => (e.from === a && e.to === b) || (e.from === b && e.to === a),
  )
  return edge?.rationale ?? null
}

// ---------------------------------------------------------------------------
// Candidates, and the measurement step 1 exists to take
// ---------------------------------------------------------------------------

export function candidates(o: ConceptOntology): ConceptEdge[] {
  return edgesOfKind(o, 'candidate_prerequisite')
}

/**
 * What fraction of proposed prerequisite structure a human has promoted.
 *
 * This is the measurement that answers step 1's open question, and it is worth
 * being precise about what a low number means. It does not mean the ontology is
 * bad. It means the *structure* is not coming from wherever the candidates came
 * from — statements arrive, dependencies do not — which is still a useful finding
 * and a much smaller claim than "the concept graph can be imported".
 *
 * `null` when nothing has been proposed at all: a rate over an empty denominator
 * would read as 0% and mean "nobody tried", which is a different fact from
 * "nobody promoted".
 */
export function promotionRate(o: ConceptOntology): { promoted: number; proposed: number; rate: number } | null {
  const promoted = edgesOfKind(o, 'prerequisite').length
  const pending = candidates(o).length
  const proposed = promoted + pending
  if (proposed === 0) return null
  return { promoted, proposed, rate: promoted / proposed }
}

// ---------------------------------------------------------------------------
// Back to the fourth registry
// ---------------------------------------------------------------------------

/**
 * A subject's concepts, assembled into a real `Facet`.
 *
 * This is the claim in the header made executable: a concept tree is a scope
 * ontology over the theorem medium, so a subject *is* a facet and each concept
 * *is* one of its options. The returned value goes straight into
 * `facetAdmits(facet, chosen, offering)` from lib/correlate/scope.ts — the same
 * enforcement path the eleven correlation games use, with no second
 * implementation of it anywhere in here.
 *
 * `enforcement` is derived rather than configured: a facet is checked only when
 * every option it offers can decide membership. One guided concept makes the
 * whole facet guided, because a facet that rejected offerings for eight concepts
 * and waved them through for the ninth would be checked in name and arbitrary in
 * practice.
 */
export function conceptFacet(o: ConceptOntology): Facet {
  const options: FacetOption[] = o.concepts.map(c => c.scope)
  const guided = o.concepts.filter(c => c.fidelity === 'guided')
  const enforcement = guided.length === 0 ? 'checked' as const : 'guided' as const

  return {
    id: `concept:${o.subject.id}`,
    name: o.subject.facetName,
    does: o.subject.facetDoes,
    enforcement,
    caveat:
      enforcement === 'guided'
        ? `Not every concept in ${o.subject.name.toLowerCase()} can be checked against the ` +
          `provider's own text. ${guided.length} of ${o.concepts.length} ` +
          `(${guided.map(c => c.name.toLowerCase()).join(', ')}) steer the search and filter ` +
          `nothing, so this facet leans rather than obeys.`
        : undefined,
    options,
  }
}

/**
 * Whether a concept's declared fidelity matches what its option can actually do.
 *
 * Checked by the test suite rather than at import time. A mismatch is an authoring
 * bug — a concept claiming 'checked' with no pattern would promise enforcement the
 * mechanism cannot deliver, which is precisely the dishonesty the two-kind split
 * exists to prevent — but throwing on import would take down the browser that
 * would have shown you which concept was wrong.
 */
export function fidelityMismatches(o: ConceptOntology): string[] {
  const out: string[] = []
  for (const c of o.concepts) {
    const hasPattern = !!c.scope.match
    if (c.fidelity === 'checked' && !hasPattern) {
      out.push(`${c.id}: claims checked, but its scope option carries no pattern`)
    }
    if (c.fidelity === 'guided' && !c.caveat) {
      out.push(`${c.id}: is guided and carries no caveat`)
    }
  }
  return out
}

/**
 * Structural problems worth surfacing in the browser.
 *
 * Deliberately a list rather than a throw. An ontology is a hand-authored
 * document and these are editorial faults, not crashes: the useful behaviour is a
 * page that loads and names them.
 */
export function ontologyProblems(o: ConceptOntology): string[] {
  const out: string[] = [...fidelityMismatches(o)]
  const ids = new Set(o.concepts.map(c => c.id))

  for (const edge of o.edges) {
    if (!ids.has(edge.from)) out.push(`edge ${edge.id}: unknown concept ${edge.from}`)
    if (!ids.has(edge.to)) out.push(`edge ${edge.id}: unknown concept ${edge.to}`)
    if (edge.from === edge.to) out.push(`edge ${edge.id}: joins ${edge.from} to itself`)
    if (edge.kind === 'interferes_with' && !edge.rationale) {
      out.push(`edge ${edge.id}: an interference with no stated reason cannot be reviewed`)
    }
    if (edge.kind === 'candidate_prerequisite' && edge.promotedBy) {
      out.push(`edge ${edge.id}: a candidate naming a promoter is neither one thing nor the other`)
    }
  }

  for (const concept of o.concepts) {
    if (concept.knowledgePoints.length === 0) {
      out.push(`${concept.id}: has no knowledge points, so nothing can be practised`)
    }
    for (const objective of concept.objectives) {
      if (objective.taskKinds.length === 0) {
        out.push(`${concept.id}/${objective.id}: names no task kind, so no observation can satisfy it`)
      }
    }
    for (const point of concept.knowledgePoints) {
      if (point.conceptId !== concept.id) {
        out.push(`${point.id}: filed under ${concept.id} but names ${point.conceptId}`)
      }
      if (point.workedExample.subgoals.length === 0) {
        out.push(`${point.id}: its worked example has no labelled subgoals, which makes it a solution`)
      }
    }
  }

  for (const loop of cycles(o)) {
    out.push(`prerequisite cycle: ${loop.join(' → ')} → ${loop[0]}`)
  }

  return out
}
