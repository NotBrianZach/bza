/**
 * Deriving the concept graph from the shape of the practice tasks.
 *
 * ── The question this answers, and the one it does not ────────────────────
 *
 * ontology.ts carries 10 `prerequisite` edges and 6 `encompasses` edges, every
 * one hand-authored. The open question from SPEC-LEARNING §13 is whether that
 * structure can come from somewhere other than a person's judgement. The Math
 * Academy scrape was one answer and a weak one — its edges were CSS-class
 * guesses. This is a different answer: derive the structure from the tasks,
 * which exist for another reason entirely.
 *
 * **What makes this non-circular.** Nothing here declares an edge. The inputs
 * are the tasks (authored and generated) and the four form checkers in forms.ts,
 * all of which exist to serve and rule practice. The only authored thing added
 * is the *matching rule* below — one predicate over shape signatures — which is
 * far smaller and more reviewable than sixteen edges, and which cannot encode a
 * specific edge even if someone wanted it to.
 *
 * If this derivation instead took a per-concept list of "operations required",
 * it would be authoring the edges in a different file and calling the result
 * derived. That was the first design and it was abandoned for exactly that
 * reason.
 *
 * ── The mechanism: structural containment ─────────────────────────────────
 *
 * A task's given and reference are expression trees. If a *proper subtree* of
 * one of B's trees has the same shape as one of A's whole trees, then doing B
 * involves handling an A-shaped object. Two directions, and they mean different
 * things:
 *
 *   consumes  B's GIVEN contains something shaped like A's GIVEN.
 *             To solve B you must first do an A on that part.
 *             (`(x²−2x−15)/(x²−25)` contains two factorable quadratics.)
 *
 *   produces  B's given or reference contains something shaped like A's
 *             REFERENCE — an A-answer appears inside B.
 *             (`(3x+1)/((x+3)(x−5))` contains `(x+3)(x−5)`, a factoring answer.)
 *
 * ── The blind spot, stated before the results ─────────────────────────────
 *
 * Structure cannot tell you *how* a sub-expression got there. `(x+3)(x−5)`
 * inside a combining-fractions answer was produced by **multiplying** two
 * denominators together; the identical subtree inside a decomposition problem is
 * recognised by **factoring**. Same tree, different skill. So this method will
 * propose some edges that name the wrong concept, and it has no way to tell
 * which.
 *
 * That is why everything here is emitted as a candidate and why
 * `compareWithAuthored` is the actual deliverable rather than the edge list. The
 * interesting output is the three-way split — confirmed, derived-only,
 * authored-only — and specifically the third bucket, which says where structure
 * is silent about something a person thought mattered.
 */

import { degreeIn, parsedTree, tryParse, type ExprNode } from './expr'
import { checkForm } from './forms'
import { generatorsForPoint, generateFrom } from './generators'
import { allKnowledgePoints, conceptOfPoint, edgesOfKind } from './registry'
import { TASKS } from './tasks'
import type { ConceptEdge, ConceptOntology, NamedForm, PracticeTask } from './types'

const ALL_FORMS: NamedForm[] = ['expanded', 'factored', 'single_fraction', 'partial_fractions']

// ---------------------------------------------------------------------------
// Shape signatures
// ---------------------------------------------------------------------------

export interface ShapeSignature {
  /** Every named form the tree is actually in. More than one is possible. */
  forms: NamedForm[]
  isQuotient: boolean
  /** Null when `degreeIn` cannot say — a sum of quotients, for instance. */
  numeratorDegree: number | null
  denominatorDegree: number | null
  /**
   * How many terms the top-level sum has, and how many factors the top-level
   * product has.
   *
   * Carried because degree alone does not distinguish a *polynomial* from a
   * *monomial*: `x^2` and `x^2 - 2x - 15` are both degree 2 and both satisfy
   * `expanded`, so without these counts a bare `x^2` appearing anywhere matched
   * every quadratic-arithmetic task and manufactured edges out of nothing. A
   * skill instance needs structural richness, not just degree.
   */
  topLevelTerms: number
  topLevelFactors: number
}

export function signatureOf(tree: ExprNode, variable = 'x'): ShapeSignature {
  const forms = ALL_FORMS.filter(f => checkForm(tree, f, variable).held === true)
  const isQuotient = tree.kind === 'divide'
  return {
    forms,
    isQuotient,
    numeratorDegree: isQuotient ? degreeIn(tree.numerator, variable) : degreeIn(tree, variable),
    denominatorDegree: isQuotient ? degreeIn(tree.denominator, variable) : 0,
    topLevelTerms: countTerms(tree),
    topLevelFactors: countFactors(tree),
  }
}

/** Terms of a top-level sum. A non-sum is one term, which is the useful reading. */
function countTerms(tree: ExprNode): number {
  if (tree.kind === 'add') return tree.args.length
  if (tree.kind === 'subtract') return 2
  if (tree.kind === 'negate') return countTerms(tree.operand)
  return 1
}

/** Non-constant factors of a top-level product. A power counts as its exponent. */
function countFactors(tree: ExprNode): number {
  if (tree.kind === 'negate') return countFactors(tree.operand)
  if (tree.kind === 'multiply') {
    return tree.args.filter(a => (degreeIn(a, 'x') ?? 0) > 0).length
  }
  if (tree.kind === 'power') {
    const exponent = tree.exponent
    if (exponent.kind === 'integer') return Number(exponent.value)
  }
  return 1
}

export const describeShape = (s: ShapeSignature) =>
  `${s.forms.join('+') || 'no named form'}` +
  `${s.isQuotient ? `, quotient deg ${s.numeratorDegree}/${s.denominatorDegree}` : `, deg ${s.numeratorDegree}`}`

const sameForms = (a: NamedForm[], b: NamedForm[]) =>
  a.length === b.length && a.every(f => b.includes(f))

export function sameShape(a: ShapeSignature, b: ShapeSignature): boolean {
  return (
    sameForms(a.forms, b.forms) &&
    a.isQuotient === b.isQuotient &&
    a.numeratorDegree === b.numeratorDegree &&
    a.denominatorDegree === b.denominatorDegree &&
    a.topLevelTerms === b.topLevelTerms &&
    a.topLevelFactors === b.topLevelFactors
  )
}

/**
 * Shape as a *learner* sees it: the named forms and whether it is a quotient,
 * with every degree and count dropped.
 *
 * Used only by `deriveInterference`, and the coarseness is the point there. Exact
 * equality is right for containment — an instance of a skill has a definite size
 * — and wrong for confusability, which is about what two problems look like at a
 * glance. `(x+4)/(x+1)²` and `(2x+1)/((x−1)(x²+1))` have different denominator
 * degrees and are the same thing to someone deciding which template to write.
 */
export function sameCoarseShape(a: ShapeSignature, b: ShapeSignature): boolean {
  return sameForms(a.forms, b.forms) && a.isQuotient === b.isQuotient
}

/**
 * Is this shape specific enough to identify a skill?
 *
 * The guard that makes the whole derivation usable rather than a noise
 * generator. A bare linear like `x + 3` satisfies **both** `expanded` and
 * `factored` — it is trivially a sum of monomials and trivially a product of one
 * factor — so a rule matching on forms alone would decide that every linear
 * subexpression anywhere is an instance of a factoring answer, and every concept
 * would encompass every other.
 *
 * So: a shape carrying no named form says nothing, and a polynomial shape below
 * degree 2 says nothing either. Degree 2 is where `expanded` and `factored`
 * start to be different claims about the same expression.
 */
export function isDiscriminating(s: ShapeSignature): boolean {
  if (s.forms.length === 0) return false
  if (s.isQuotient) {
    // A quotient is already a strong shape; require a denominator that does something.
    return (s.denominatorDegree ?? 0) >= 1
  }
  if ((s.numeratorDegree ?? 0) < 2) return false
  // Structural richness, not just degree. A sum needs at least two terms and a
  // product at least two factors — otherwise `x^2` qualifies as an instance of
  // quadratic arithmetic and every concept ends up encompassing every other.
  if (s.forms.includes('factored') && !s.forms.includes('expanded')) return s.topLevelFactors >= 2
  return s.topLevelTerms >= 2
}

/**
 * Every subtree except the root.
 *
 * Proper on purpose: a tree always has its own shape, so including the root
 * would make every concept contain itself and, worse, make two concepts whose
 * tasks happen to share a shape look mutually encompassing.
 */
export function properSubtrees(tree: ExprNode): ExprNode[] {
  const out: ExprNode[] = []
  const walk = (node: ExprNode, isRoot: boolean) => {
    if (!isRoot) out.push(node)
    switch (node.kind) {
      case 'add': case 'multiply': case 'function':
        node.args.forEach(a => walk(a, false)); break
      case 'subtract': case 'equation':
        walk(node.left, false); walk(node.right, false); break
      case 'divide':
        walk(node.numerator, false); walk(node.denominator, false); break
      case 'power':
        walk(node.base, false); walk(node.exponent, false); break
      case 'negate':
        walk(node.operand, false); break
      default: break
    }
  }
  walk(tree, true)
  return out
}

// ---------------------------------------------------------------------------
// Gathering the evidence
// ---------------------------------------------------------------------------

export interface ShapedTask {
  taskId: string
  conceptId: string
  knowledgePointId: string
  givenTree: ExprNode
  referenceTree: ExprNode
  given: ShapeSignature
  reference: ShapeSignature
}

/**
 * Every task that can be shaped, as trees plus signatures.
 *
 * `variants` asks for generated instances as well as authored ones, and it
 * matters more than it sounds: with 22 authored tasks an edge can rest on a
 * single expression, and a single expression is an anecdote. Drawing 20
 * instances per generator turns the support count into something worth reading —
 * an edge supported by 60 instances across 3 concepts is a different claim from
 * one supported by one.
 */
export function shapedTasks(o: ConceptOntology, variantsPerGenerator = 0): ShapedTask[] {
  const pool: PracticeTask[] = [...TASKS]
  if (variantsPerGenerator > 0) {
    for (const point of allKnowledgePoints(o)) {
      for (const generator of generatorsForPoint(point.id)) {
        for (let i = 0; i < variantsPerGenerator; i += 1) {
          // Spread the seeds so consecutive draws do not correlate.
          const task = generateFrom(generator.id, (i + 1) * 7919)
          if (task) pool.push(task)
        }
      }
    }
  }

  const out: ShapedTask[] = []
  for (const task of pool) {
    const concept = conceptOfPoint(o, task.knowledgePointId)
    if (!concept) continue
    const variable = task.variables[0]?.name ?? 'x'
    // `evaluate` tasks are excluded: their reference is a bare number, so the
    // shape delta carries no information about what skill was exercised.
    if (task.kind !== 'transform_to_form') continue
    const givenTree = safeParse(task.given, task.variables.map(v => v.name))
    const referenceTree = safeParse(task.reference, task.variables.map(v => v.name))
    if (!givenTree || !referenceTree) continue
    out.push({
      taskId: task.id,
      conceptId: concept.id,
      knowledgePointId: task.knowledgePointId,
      givenTree,
      referenceTree,
      given: signatureOf(givenTree, variable),
      reference: signatureOf(referenceTree, variable),
    })
  }
  return out
}

/**
 * Parse or give up. Uses `parsedTree` rather than `tryParse`'s `.ok` for the
 * narrowing reason documented in expr.ts.
 */
function safeParse(source: string, symbols: string[]): ExprNode | null {
  return parsedTree(tryParse(source, symbols))
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

export type DerivedKind = 'encompasses' | 'candidate_prerequisite' | 'interferes_with'

export interface DerivedEdge {
  from: string
  to: string
  kind: DerivedKind
  /** 'consumes' or 'produces', or the interference criterion. */
  via: string
  /** How many (task, subtree) observations supported it. */
  support: number
  /** One example, so a reviewer can see what the rule saw. */
  example: string
}

/**
 * The derived graph.
 *
 * `encompasses` and `candidate_prerequisite` come out of the *same* containment
 * observation, which is not laziness: "doing B handles an A-shaped object" is
 * directly a claim that B exercises A, and only indirectly a claim that A must
 * come first. SPEC-LEARNING's own table makes this distinction — a dependency
 * edge is not a pedagogical prerequisite — so the containment is reported as
 * `encompasses` (the claim it actually supports) and additionally as a
 * *candidate* prerequisite (the weaker, unreviewed reading).
 */
export function deriveEdges(o: ConceptOntology, variantsPerGenerator = 20): DerivedEdge[] {
  const tasks = shapedTasks(o, variantsPerGenerator)

  // Characteristic shapes per concept, deduplicated.
  const givensOf = new Map<string, ShapeSignature[]>()
  const referencesOf = new Map<string, ShapeSignature[]>()
  for (const task of tasks) {
    push(givensOf, task.conceptId, task.given)
    push(referencesOf, task.conceptId, task.reference)
  }

  const found = new Map<string, DerivedEdge>()
  const note = (from: string, to: string, via: string, example: string) => {
    const key = `${from}→${to}:${via}`
    const existing = found.get(key)
    if (existing) { existing.support += 1; return }
    found.set(key, { from, to, kind: 'encompasses', via, support: 1, example })
  }

  for (const task of tasks) {
    const subtrees = [
      ...properSubtrees(task.givenTree).map(t => ({ tree: t, where: 'given' })),
      ...properSubtrees(task.referenceTree).map(t => ({ tree: t, where: 'reference' })),
    ]
    for (const { tree, where } of subtrees) {
      const sub = signatureOf(tree)
      if (!isDiscriminating(sub)) continue

      for (const [otherId, shapes] of givensOf) {
        if (otherId === task.conceptId) continue
        // `consumes` is only meaningful from the given side: it says the learner
        // must do an A before they can proceed.
        if (where !== 'given') continue
        if (shapes.some(s => isDiscriminating(s) && sameShape(sub, s))) {
          note(task.conceptId, otherId, 'consumes', `${task.taskId}: ${describeShape(sub)} inside the given`)
        }
      }
      for (const [otherId, shapes] of referencesOf) {
        if (otherId === task.conceptId) continue
        if (shapes.some(s => isDiscriminating(s) && sameShape(sub, s))) {
          note(task.conceptId, otherId, 'produces', `${task.taskId}: ${describeShape(sub)} inside the ${where}`)
        }
      }
    }
  }

  const encompasses = [...found.values()].sort((a, b) => b.support - a.support)
  // The same observation, read as the weaker claim. Deduplicated by pair, since
  // two vias supporting one pair is one prerequisite proposal, not two.
  const pairs = new Map<string, DerivedEdge>()
  for (const edge of encompasses) {
    const key = `${edge.from}→${edge.to}`
    const existing = pairs.get(key)
    if (existing) existing.support += edge.support
    else pairs.set(key, { ...edge, kind: 'candidate_prerequisite', via: `containment (${edge.via})` })
  }
  return [...encompasses, ...pairs.values()]
}

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key) ?? []
  list.push(value)
  map.set(key, list)
}

/**
 * Concepts a learner cannot tell apart from the shape of the problem.
 *
 * The ontology insists `interferes_with` be "authored, never inferred, because
 * similarity of *name* is a poor proxy" — and it is right about names. This is
 * not a name comparison.
 *
 * ── Getting the criterion right took two attempts ─────────────────────────
 *
 * The first was "same given, *different* answer shape", on the reasoning that
 * interference is looking alike and needing different work. It found nothing, and
 * the authored edges say why. `i2` pairs the repeated-factor and
 * irreducible-quadratic decompositions, whose rationale is that "the two
 * templates differ only in the numerator… learners pick the template by which
 * one they saw last". Those two have the same given shape *and* the same answer
 * shape — a sum of partial fractions either way. The difference is in the
 * template, which is a fact about the procedure and not visible in either tree.
 *
 * So the real condition is the opposite: two concepts interfere when a learner
 * has **no structural cue at all** — the problems look alike and so do the
 * answers, leaving nothing but memory of which procedure came last. Coarse
 * shapes on both sides, because a denominator degree is not a cue anyone uses
 * when choosing a template.
 *
 * This necessarily over-generates: every pair of partial-fraction concepts looks
 * alike on both sides, and only some of those pairs are worth separating in
 * teaching. That is what the precision figure is for.
 */
export function deriveInterference(o: ConceptOntology, variantsPerGenerator = 20): DerivedEdge[] {
  const tasks = shapedTasks(o, variantsPerGenerator)
  const byConcept = new Map<string, ShapedTask[]>()
  for (const task of tasks) push(byConcept, task.conceptId, task)

  const out: DerivedEdge[] = []
  const ids = [...byConcept.keys()]
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = byConcept.get(ids[i]) ?? []
      const b = byConcept.get(ids[j]) ?? []
      const pair = a.flatMap(x => b.map(y => ({ x, y })))
        .find(({ x, y }) =>
          sameCoarseShape(x.given, y.given) && sameCoarseShape(x.reference, y.reference))
      if (!pair) continue
      out.push({
        from: ids[i],
        to: ids[j],
        kind: 'interferes_with',
        via: 'indistinguishable on both sides — no structural cue to tell them apart',
        support: a.length + b.length,
        example:
          `both are handed ${describeShape(pair.x.given)} and both want ` +
          `${describeShape(pair.x.reference)}, so nothing in either tree says which to apply`,
      })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// The deliverable: how the derived graph compares to the authored one
// ---------------------------------------------------------------------------

export interface Comparison {
  kind: DerivedKind
  /** Derived and authored agree. */
  confirmed: { from: string; to: string; support: number }[]
  /** Derived, and nobody authored it. Candidates for review. */
  derivedOnly: DerivedEdge[]
  /** Authored, and structure is silent. The most interesting bucket. */
  authoredOnly: { from: string; to: string; rationale?: string }[]
  /** Of the authored edges of this kind, what fraction did structure recover? */
  recall: number | null
  /** Of the derived edges, what fraction was already authored? */
  precision: number | null
}

/**
 * Compare one kind, in both directions.
 *
 * Both numbers are reported because they answer different questions and either
 * alone would flatter the method. Recall says how much of a person's judgement
 * structure reproduces. Precision says how much of what structure proposes a
 * person would accept. A method with high recall and low precision is a
 * suggestion engine; the reverse is a confirmation tool. Printing one and not
 * the other would let the derivation look like whichever is better.
 *
 * `null` on an empty denominator, for the reason `promotionRate` gives: a rate
 * over nothing reads as 0% and means "nothing to compare".
 */
export function compareWithAuthored(
  o: ConceptOntology,
  derived: DerivedEdge[],
  kind: DerivedKind,
): Comparison {
  const authoredKind = kind === 'candidate_prerequisite' ? 'prerequisite' : kind
  const authored = edgesOfKind(o, authoredKind as ConceptEdge['kind'])
  const mine = dedupePairs(derived.filter(e => e.kind === kind))

  // `interferes_with` is symmetric and stored once, so it has to be compared
  // without regard to direction or the comparison is arbitrary.
  const symmetric = kind === 'interferes_with'
  const key = (from: string, to: string) =>
    symmetric ? [from, to].sort().join('|') : `${from}|${to}`

  const authoredKeys = new Map(authored.map(e => [key(e.from, e.to), e]))
  const mineKeys = new Map(mine.map(e => [key(e.from, e.to), e]))

  const confirmed: Comparison['confirmed'] = []
  const derivedOnly: DerivedEdge[] = []
  for (const [k, edge] of mineKeys) {
    if (authoredKeys.has(k)) confirmed.push({ from: edge.from, to: edge.to, support: edge.support })
    else derivedOnly.push(edge)
  }
  const authoredOnly: Comparison['authoredOnly'] = []
  for (const [k, edge] of authoredKeys) {
    if (!mineKeys.has(k)) authoredOnly.push({ from: edge.from, to: edge.to, rationale: edge.rationale })
  }

  return {
    kind,
    confirmed,
    derivedOnly,
    authoredOnly,
    recall: authoredKeys.size === 0 ? null : confirmed.length / authoredKeys.size,
    precision: mineKeys.size === 0 ? null : confirmed.length / mineKeys.size,
  }
}

/** One edge per (from, to) of a kind, keeping the best-supported. */
function dedupePairs(edges: DerivedEdge[]): DerivedEdge[] {
  const best = new Map<string, DerivedEdge>()
  for (const edge of edges) {
    const k = `${edge.from}|${edge.to}`
    const existing = best.get(k)
    if (!existing || edge.support > existing.support) best.set(k, edge)
  }
  return [...best.values()]
}

/**
 * The derived edges, as real `ConceptEdge`s ready to sit in an ontology.
 *
 * Every one is a `candidate_prerequisite` with **no** `promotedBy`, whatever kind
 * it was derived as. A derivation is not a promoter: the whole value of the
 * quarantine is that a human decided, and a mechanism that promoted its own
 * output would be the scraper's mistake with better arithmetic. The rationale
 * names the criterion and the support count so a reviewer can weigh it.
 */
export function asCandidateEdges(derived: DerivedEdge[]): ConceptEdge[] {
  return dedupePairs(derived.filter(e => e.kind === 'candidate_prerequisite')).map(edge => ({
    id: `derived-${edge.from}--${edge.to}`,
    from: edge.from,
    to: edge.to,
    kind: 'candidate_prerequisite' as const,
    rationale:
      `Derived from task structure by ${edge.via}, supported by ${edge.support} observation(s). ` +
      `Example — ${edge.example}. Structure cannot tell how a subexpression got there, so this ` +
      `may name the wrong concept. Unreviewed.`,
  }))
}

/** A short report, in the register `summariseImport` uses. */
export function summariseDerivation(comparisons: Comparison[]): string[] {
  const lines: string[] = []
  for (const c of comparisons) {
    const pct = (v: number | null) => (v === null ? 'n/a' : `${Math.round(v * 100)}%`)
    lines.push(
      `${c.kind}: ${c.confirmed.length} confirmed, ${c.derivedOnly.length} derived-only, ` +
        `${c.authoredOnly.length} authored-only — recall ${pct(c.recall)}, precision ${pct(c.precision)}.`,
    )
  }
  lines.push(
    'Nothing here is promoted. Structure cannot see whether a subexpression was produced by ' +
      'multiplying or recognised by factoring, so a derived edge may name the wrong concept.',
  )
  return lines
}
