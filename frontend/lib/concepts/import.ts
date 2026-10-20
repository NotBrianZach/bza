/**
 * Importing a scraped curriculum — and what an import is forbidden to produce.
 *
 * `candidate_prerequisite` and `promotionRate` were built for imported structure
 * and until now nothing fed them. The `math-academy-scraper` project is the
 * intended feed: a Chrome extension that walks mathacademy.com and writes a
 * `.bza` ZIP whose `graph/` directory holds a prerequisite graph and whose
 * `content/steps.json` holds the lesson material. This module is the path from
 * that archive to something a human can review.
 *
 * ── What an import cannot be, here ────────────────────────────────────────
 *
 * The ontology is a TypeScript module under version control (ontology.ts), not a
 * table. So "import" cannot mean "write the ontology" — there is nothing to
 * write to. It means *emit a draft a human reviews and commits*, which is a
 * better fit for the thing being imported than a database write would have been:
 * a curriculum graph scraped by CSS-class heuristics is a proposal, and a
 * proposal belongs in review, not in production behind a migration.
 *
 * `emitDraftModule` is therefore the real output. The report is what you read
 * before deciding whether to paste it.
 *
 * ── The quarantine is at the type level, not just the value level ──────────
 *
 * `candidate_prerequisite` quarantines an edge by *value*: the walks in
 * registry.ts filter it out. A concept cannot be quarantined that way, because
 * every walk takes concept ids and an id carries no marker.
 *
 * So a draft concept is a **different type**. `DraftConcept` is not a `Concept`
 * with empty fields — it has no `knowledgePoints` and no `objectives` at all, so
 * `assemble`, `conceptFacet` and `teachingOrder` will not accept one. The
 * compiler enforces what a filter would otherwise have to remember to do. This is
 * the same reason `Objective.taskKinds` is non-empty rather than optional: make
 * the unusable state unrepresentable instead of detectable.
 *
 * The consequence is deliberate and worth stating because it looks like a defect:
 * **the edges this module emits reference concepts that do not exist yet.** Merge
 * them into a real ontology without authoring the concepts and `ontologyProblems`
 * reports `unknown concept` for every one. That is correct. You cannot have the
 * structure without the content, and a build that let you would gate a learner on
 * concepts with nothing in them.
 *
 * ── What gets dropped, and why dropping is the honest move ─────────────────
 *
 * The scraper classifies every in-page link to another topic into one of three
 * types (`extractPrerequisiteGraph` in content.js). Two are claims and one is a
 * fallback:
 *
 *   prerequisite  the link sat in a container whose class matched /prereq|require/,
 *                 or whose parent text said "prereq"/"require"/"before"
 *   leads_to      the parent text said "next"/"after"/"unlock"
 *   related       **everything else** — the else-branch, with no positive evidence
 *
 * `related` is where navigation chrome lands: breadcrumbs, sidebars, "all topics"
 * indexes. Importing it as a candidate prerequisite would be the one thing the
 * quarantine cannot survive, because `promotionRate` is a *ratio* — padding its
 * denominator with links nobody claimed were prerequisites would drive the rate
 * toward zero and the number would then measure the scraper's sidebar rather than
 * whether a curriculum graph is importable. So `related` edges are refused and
 * counted in `rejected.edges`, which keeps them visible without letting them vote.
 *
 * `leads_to` is kept. It needs no reversal: the scraper emits it as
 * `from: current, to: linked`, and "current unlocks linked" is already "current
 * must be strong before linked is introduced". It is a weaker claim than an
 * explicit prerequisites section, so its provenance is recorded per edge and a
 * reviewer can promote the two classes at different rates.
 *
 * ── Two measurements, which are the point of the module ───────────────────
 *
 * `promotionRate` in registry.ts answers "is the *structure* importable". This
 * module adds the second half:
 *
 *  - `parseRate` — what fraction of the scraped mathematics the expression parser
 *    can read at all. Scraped questions arrive as prose plus LaTeX; tasks need the
 *    restricted infix `parseExpression` accepts. The conversion is lossy and
 *    `latexToInfix` is advisory, so this number is a *ceiling* on how much of a
 *    practice set could ever be mechanised from a scrape. It is reported and never
 *    used to build a task.
 *  - `importPromotionRate` — what fraction of drafted concepts a human has since
 *    authored into real ones. The concept-level twin of the edge-level rate.
 *
 * ── One honest limitation ─────────────────────────────────────────────────
 *
 * **This has never run against real Math Academy output.** No captured archive is
 * checked into `math-academy-scraper` and none is checked in here; the test
 * fixture is synthetic, written from `content.js` and `background.js` by reading
 * what they emit. So the wire types below are what the scraper's code *writes*,
 * not what a live scrape *was observed to write*, and every field is optional for
 * that reason. The first real archive should be expected to need changes here,
 * and nothing in this module may assume a field is present.
 */

import { symbolsIn, tryParse } from './expr'
import type { ConceptEdge, ConceptOntology, Objective, TaskKind } from './types'
import type { FacetOption } from '@/lib/correlate/scope'

// ---------------------------------------------------------------------------
// The wire format
// ---------------------------------------------------------------------------

/**
 * One entry of `graph/topics.json`, keyed by Math Academy's topic id.
 *
 * Written by `handleGraphScraped` in the extension's background.js, which records
 * a topic only when its *overview* page was visited. A topic that was merely
 * linked to has no entry here, which is why `conceptsFromEdgeLabels` exists.
 */
export interface ScrapedTopic {
  title?: string
  url?: string
  scrapedAt?: string
}

/** One entry of `graph/edges.json`. `type` is the scraper's three-way guess. */
export interface ScrapedEdge {
  from?: string
  to?: string
  /** The link text that produced this edge — the only title a never-visited topic has. */
  fromLabel?: string
  toLabel?: string
  type?: string
}

export interface ScrapedGraph {
  topics?: Record<string, ScrapedTopic>
  edges?: ScrapedEdge[]
}

/**
 * One entry of `content/steps.json`.
 *
 * Three step types share one record shape in the archive, and the fields that
 * matter differ per type: a `tutorial` carries `text`, an `example` splits into
 * `question`/`explanation`, and a `question` carries `answerChoices` plus the
 * learner's own `userAnswer`. Modelled as one wide optional record rather than a
 * discriminated union because that is what is actually in the file, and a union
 * would require trusting `type` to narrow a record the scraper may have written
 * with `type: 'unknown'`.
 */
export interface ScrapedStep {
  id?: string
  topicId?: string
  type?: string
  typeLabel?: string
  title?: string
  text?: string
  latex?: string[]
  graphics?: string[]
  question?: { text?: string; latex?: string[] }
  explanation?: { text?: string; latex?: string[] }
  answerChoices?: unknown
  feedback?: unknown
  /** The learner's answer, which may be wrong. Never a reference answer. See `DraftTask`. */
  userAnswer?: string | null
}

/** What `parseArchive` is handed: the three archive members this module reads. */
export interface ScrapedArchive {
  graph?: ScrapedGraph
  steps?: ScrapedStep[]
  /** `manifest.json`, for provenance only. */
  manifest?: { generatedAt?: string; version?: string | number; source?: string }
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

/**
 * How a draft concept came to exist.
 *
 * The distinction is load-bearing for review: a `scraped-topic` draft has lesson
 * material behind it and can plausibly be authored, while an `edge-label` draft
 * is a title and nothing else — the fix for one of those is to go and scrape that
 * topic, not to write knowledge points from the title.
 */
export type DraftOrigin = 'scraped-topic' | 'edge-label'

export interface DraftSource {
  /** Math Academy's own topic id, unslugged. */
  topicId: string
  origin: DraftOrigin
  url?: string
  scrapedAt?: string
  /** How many steps of each type backed this draft. Zero everywhere for `edge-label`. */
  stepCounts: { tutorial: number; example: number; question: number; unknown: number }
}

/**
 * Lesson material that is not yet a `KnowledgePoint`.
 *
 * The gap is `workedExample.subgoals`, and it is not a formatting gap. types.ts:
 * "An unlabelled worked example is a solution, not an example" — the labels are
 * what make it transfer, and a scraped `example` step has a question and a block
 * of explanation with nothing saying which move answered which question. Splitting
 * that block on sentence boundaries and calling the pieces subgoals would produce
 * something with the shape of a labelled example and none of its value, which is
 * worse than producing nothing: a reviewer would skim it and promote it.
 *
 * So the explanation is carried across **whole and unsplit**, in a field whose name
 * says what it is, and `blocking` names the authoring that has to happen.
 */
export interface DraftKnowledgePoint {
  id: string
  conceptId: string
  position: number
  /** Scraped tutorial prose, verbatim. Not a statement in the learner's language yet. */
  statement: string
  /** An example step's two halves, unsplit. Deliberately not a `WorkedExample`. */
  unlabelledExample?: { problem: string; solution: string }
  /** Every LaTeX fragment the step carried, in document order. */
  latex: string[]
  /** First graphic, if any — the candidate for `visualRef`. */
  visualRef?: string
  /** Which scraper step this came from. */
  stepId?: string
  /** What must be authored before this can become a `KnowledgePoint`. Never empty. */
  blocking: string[]
}

/**
 * A scraped question, which is not a `PracticeTask` and cannot be made into one
 * mechanically. Three independent reasons, each sufficient:
 *
 *  1. `given` must be restricted infix. A scrape yields prose plus LaTeX, and
 *     `latexToInfix` below is lossy and advisory.
 *  2. `reference` must be the *author's* answer. The scrape has `userAnswer` — the
 *     learner's, which is frequently the wrong answer, and a task seeded with it
 *     would mark the right answer incorrect.
 *  3. `form`, `variables`, `domainConditions` and `maxDenominatorDegree` are all
 *     authorial claims about what the task is asking. None is in the DOM.
 */
export interface DraftTask {
  id: string
  draftKnowledgePointId: string
  /** The question text as scraped. */
  prompt: string
  latex: string[]
  /** Advisory: LaTeX fragments that `parseExpression` could read. See `parseRate`. */
  parsable: { latex: string; infix: string; symbols: string[] }[]
  /** The learner's scraped answer, carried for review and never as a reference. */
  scrapedAnswer?: string
  stepId?: string
  blocking: string[]
}

/**
 * A concept a scrape proposes.
 *
 * Note what is absent: `knowledgePoints` and `objectives`. Their absence is the
 * type-level quarantine described in the header — this cannot be passed anywhere a
 * `Concept` is wanted. `suggestedTaskKinds` is a hint for the author and is
 * explicitly not an `Objective`, because an objective names the kinds that
 * *evidence* it and nothing in a scrape makes that claim.
 */
export interface DraftConcept {
  id: string
  name: string
  subjectId: string
  /** Hint only, never a `match`: nothing scraped decides membership. */
  scope: FacetOption
  /** Always guided. A scrape cannot produce a membership pattern. */
  fidelity: 'guided'
  /** Always present, and specific to this draft rather than boilerplate. */
  caveat: string
  source: DraftSource
  draftKnowledgePoints: DraftKnowledgePoint[]
  draftTasks: DraftTask[]
  /** Task kinds the scraped step types suggest. A hint for the author, not an objective. */
  suggestedTaskKinds: TaskKind[]
  /** What must be authored before this can become a `Concept`. Never empty. */
  blocking: string[]
}

export interface RejectedEdge {
  from: string
  to: string
  type: string
  reason: string
}

export interface ImportCounts {
  topicsScraped: number
  conceptsDrafted: number
  conceptsFromEdgeLabelsOnly: number
  edgesAccepted: number
  edgesRejected: number
  stepsRead: number
  draftKnowledgePoints: number
  draftTasks: number
}

/**
 * The whole result of reading one archive.
 *
 * `edges` is typed `ConceptEdge[]` and every member is a `candidate_prerequisite`
 * with no `promotedBy` — `importedEdges` asserts both. Typing it as the real edge
 * type is what lets a reviewer concatenate it onto an ontology's `edges` once the
 * concepts exist, with no conversion step that could lose the quarantine.
 */
export interface ConceptImport {
  subjectId: string
  concepts: DraftConcept[]
  edges: ConceptEdge[]
  rejected: { edges: RejectedEdge[]; steps: { id: string; reason: string }[] }
  counts: ImportCounts
  /**
   * Prerequisite cycles among the candidates.
   *
   * Cannot hang anything — candidates participate in no walk — but a cycle is
   * direct evidence the scraper's heuristics misfired on some page, so it is
   * surfaced rather than silently tolerated.
   */
  cycles: string[][]
  /** Advisory ceiling on mechanisation. See the header. */
  parseRate: { parsable: number; total: number; rate: number } | null
  provenance: { importer: string; generatedAt?: string; source?: string }
}

/** Stamped into every draft so a reviewer can tell authored material from imported. */
export const IMPORTER_ID = 'math-academy-scraper'

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

/**
 * Math Academy's topic ids are URL path segments and may be numeric, so they are
 * both unsuitable as concept ids and capable of colliding with an authored one.
 * The `ma-` prefix guarantees neither happens and makes provenance visible in the
 * id itself, which matters in a file where authored and imported concepts will
 * eventually sit side by side.
 */
export function conceptIdFor(topicId: string): string {
  return `ma-${slug(topicId)}`
}

export function slug(input: string): string {
  const out = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return out || 'untitled'
}

// ---------------------------------------------------------------------------
// LaTeX, advisorily
// ---------------------------------------------------------------------------

/**
 * A lossy LaTeX → restricted-infix conversion, for measurement only.
 *
 * It handles the handful of constructs that actually appear in scraped algebra —
 * `\frac`, `\cdot`, `\times`, braces after `^`, the delimiter noise — and nothing
 * else. It is **not** a LaTeX parser and must never feed a `PracticeTask.given`:
 * a conversion that drops a construct it does not know silently changes the
 * mathematics, which is the one failure a practice set cannot absorb.
 *
 * Its only job is to make `parseRate` a real number rather than an assertion.
 */
export function latexToInfix(latex: string): string {
  let s = latex.trim()

  // Delimiters and display noise.
  s = s.replace(/^\$+|\$+$/g, '')
  s = s.replace(/\\[()[\]]/g, '')
  s = s.replace(/\\left|\\right/g, '')
  s = s.replace(/\\displaystyle|\\,|\\;|\\!|\\quad|\\qquad/g, ' ')

  // \frac{a}{b} → (a)/(b). Innermost first, so nesting unwinds.
  for (let i = 0; i < 8; i += 1) {
    const next = s.replace(/\\(?:d?frac|tfrac)\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    if (next === s) break
    s = next
  }

  // Operators with an infix spelling.
  s = s.replace(/\\cdot|\\times/g, '*')
  s = s.replace(/\\div/g, '/')

  // Braced groups after ^ become parenthesised; bare \sqrt{a} becomes sqrt(a).
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
  s = s.replace(/\^\{([^{}]*)\}/g, '^($1)')

  // Anything still carrying a backslash is a construct this does not know. Leave
  // it in place so the parse fails loudly rather than succeeding on a truncation.
  return s.replace(/\s+/g, ' ').trim()
}

/**
 * The single-letter symbols a fragment appears to use.
 *
 * `parseExpression` requires its symbols declared up front — an undeclared letter
 * is a parse error, by design, so that `Symbol('x')` versus `Symbol('x',
 * positive=True)` stays an authorial decision. A scrape declares nothing, so for
 * the purposes of the measurement the letters present are taken as the
 * declarations. That is exactly the assumption a real task may not make, which is
 * why this is confined to `parseRate`.
 */
export function apparentSymbols(infix: string): string[] {
  const out = new Set<string>()
  for (const match of infix.matchAll(/[A-Za-z]+/g)) {
    const word = match[0]
    if (word.length === 1) out.add(word)
  }
  return [...out].sort()
}

/** One fragment's advisory verdict. `null` when the parser could not read it. */
export function parseFragment(
  latex: string,
): { latex: string; infix: string; symbols: string[] } | null {
  const infix = latexToInfix(latex)
  if (!infix || /\\/.test(infix)) return null
  const symbols = apparentSymbols(infix)
  const result = tryParse(infix, symbols)
  if (!result.ok) return null
  return { latex, infix, symbols: symbolsIn(result.tree).sort() }
}

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/** The scraper's edge types this module will consider, and how strong each claim is. */
const EDGE_CLAIMS: Record<string, string> = {
  prerequisite: 'the link sat in a prerequisites section, or its surrounding text said so',
  leads_to: 'the surrounding text said this topic unlocks the other — a weaker claim',
}

/**
 * Every imported edge, as quarantined candidates.
 *
 * Three refusals, each counted rather than silent:
 *
 *  - `related`, for the reason in the header: it is the scraper's else-branch and
 *    would corrupt `promotionRate`.
 *  - self-edges, which `ontologyProblems` would flag anyway and which mean the
 *    scraper matched a link to the page it was on.
 *  - duplicates. background.js dedups on `from→to:type`, so the same pair can
 *    still arrive twice under two different types — a topic listed as a
 *    prerequisite on one page and as "next" on another. The stronger claim wins,
 *    and the weaker is recorded as rejected so the disagreement stays visible.
 *
 * `promotedBy` is never set. `ontologyProblems` reports "a candidate naming a
 * promoter is neither one thing nor the other", and an importer is not a promoter:
 * the entire value of the quarantine is that a human, not a scraper, decided.
 */
export function importedEdges(
  graph: ScrapedGraph,
): { edges: ConceptEdge[]; rejected: RejectedEdge[]; endpoints: Map<string, string> } {
  const edges: ConceptEdge[] = []
  const rejected: RejectedEdge[] = []
  const byPair = new Map<string, { index: number; type: string }>()
  /**
   * Topic id → best known link text, for *accepted* edges only.
   *
   * Collected here rather than by a second walk over `graph.edges`, because a
   * second walk would see the refused ones too — and a `related` edge pointing at
   * a navigation page would then mint a draft concept for it. The refusal has to
   * cover the endpoints as well as the edge, or dropping the edge buys nothing.
   */
  const endpoints = new Map<string, string>()

  for (const raw of graph.edges ?? []) {
    const from = (raw.from ?? '').trim()
    const to = (raw.to ?? '').trim()
    const type = (raw.type ?? 'prerequisite').trim()

    if (!from || !to) {
      rejected.push({ from, to, type, reason: 'the edge names no endpoint on one side' })
      continue
    }
    if (!(type in EDGE_CLAIMS)) {
      rejected.push({
        from,
        to,
        type,
        reason:
          type === 'related'
            ? 'the scraper\'s fallback type carries no positive evidence of a prerequisite, ' +
              'and counting it would make the promotion rate measure page navigation'
            : `unrecognised edge type, so what it claims is unknown`,
      })
      continue
    }
    if (from === to) {
      rejected.push({ from, to, type, reason: 'joins a topic to itself' })
      continue
    }

    const key = `${conceptIdFor(from)}→${conceptIdFor(to)}`
    const seen = byPair.get(key)
    if (seen) {
      const incumbentIsStronger = seen.type === 'prerequisite' || type !== 'prerequisite'
      if (incumbentIsStronger) {
        rejected.push({ from, to, type, reason: `the same pair already arrived as ${seen.type}` })
      } else {
        // An explicit prerequisite outranks a leads_to for the same pair.
        rejected.push({ from, to, type: seen.type, reason: 'superseded by an explicit prerequisite for the same pair' })
        edges[seen.index] = candidateEdge(from, to, type)
        byPair.set(key, { index: seen.index, type })
      }
      continue
    }

    byPair.set(key, { index: edges.length, type })
    edges.push(candidateEdge(from, to, type))
    noteEndpoint(endpoints, from, raw.fromLabel)
    noteEndpoint(endpoints, to, raw.toLabel)
  }

  return { edges, rejected, endpoints }
}

/** Keep the first non-empty label seen for a topic; fall back to its id. */
function noteEndpoint(into: Map<string, string>, topicId: string, label: string | undefined) {
  const name = tidy(label)
  const existing = into.get(topicId)
  if (existing && existing !== topicId) return
  into.set(topicId, name || topicId)
}

function candidateEdge(from: string, to: string, type: string): ConceptEdge {
  return {
    id: `ma-cand-${slug(from)}--${slug(to)}`,
    from: conceptIdFor(from),
    to: conceptIdFor(to),
    kind: 'candidate_prerequisite',
    // No promotedBy. See the note on importedEdges.
    rationale: `Imported from ${IMPORTER_ID} as '${type}': ${EDGE_CLAIMS[type]}. Unreviewed.`,
  }
}

/**
 * Cycles among candidate edges.
 *
 * `cycles` in registry.ts walks promoted edges only, which is right for an
 * ontology and useless here, so this is a separate walk over the candidate set.
 * Iterative rather than recursive, because an imported graph's size is not bounded
 * by an author's patience.
 */
export function candidateCycles(edges: ConceptEdge[]): string[][] {
  const out = new Map<string, string[]>()
  const successors = new Map<string, string[]>()
  for (const edge of edges) {
    const list = successors.get(edge.from) ?? []
    list.push(edge.to)
    successors.set(edge.from, list)
  }

  const done = new Set<string>()
  for (const start of successors.keys()) {
    if (done.has(start)) continue
    const stack: { id: string; next: number }[] = [{ id: start, next: 0 }]
    const onStack = new Map<string, number>([[start, 0]])

    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      const children = successors.get(top.id) ?? []
      if (top.next >= children.length) {
        stack.pop()
        onStack.delete(top.id)
        done.add(top.id)
        continue
      }
      const child = children[top.next]
      top.next += 1
      const at = onStack.get(child)
      if (at !== undefined) {
        const loop = stack.slice(at).map(f => f.id)
        // Canonical rotation, so one cycle found from two entry points is one cycle.
        const pivot = loop.indexOf([...loop].sort()[0])
        const rotated = [...loop.slice(pivot), ...loop.slice(0, pivot)]
        out.set(rotated.join('→'), rotated)
        continue
      }
      if (done.has(child)) continue
      onStack.set(child, stack.length)
      stack.push({ id: child, next: 0 })
    }
  }

  return [...out.values()]
}

// ---------------------------------------------------------------------------
// Steps → draft material
// ---------------------------------------------------------------------------

/** Collapse scraped whitespace without touching the words. */
function tidy(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

const MIN_STATEMENT = 12

/**
 * One topic's steps, as draft knowledge points and draft tasks.
 *
 * `position` follows the archive's own step order rather than being re-derived.
 * The scraper reads `div.step[id^="step-"]` in document order, which is Math
 * Academy's teaching order for that lesson, and that is a real authoring signal —
 * sorting it by step id would break on the `t1`/`e2`/`q10` numbering, and sorting
 * it alphabetically would discard it for nothing.
 */
export function draftMaterialFor(
  conceptId: string,
  steps: ScrapedStep[],
): {
  points: DraftKnowledgePoint[]
  tasks: DraftTask[]
  rejected: { id: string; reason: string }[]
  stepCounts: DraftSource['stepCounts']
} {
  const points: DraftKnowledgePoint[] = []
  const tasks: DraftTask[] = []
  const rejected: { id: string; reason: string }[] = []
  const stepCounts = { tutorial: 0, example: 0, question: 0, unknown: 0 }

  let position = 0

  for (const step of steps) {
    const type = step.type ?? 'unknown'
    const stepId = step.id ?? `${conceptId}-step-${position}`
    const latex = (step.latex ?? []).map(tidy).filter(Boolean)

    if (type === 'tutorial') {
      stepCounts.tutorial += 1
      const statement = tidy(step.text)
      if (statement.length < MIN_STATEMENT) {
        rejected.push({ id: stepId, reason: 'tutorial step carried no prose worth drafting' })
        continue
      }
      position += 1
      points.push({
        id: `${conceptId}-kp-${position}`,
        conceptId,
        position,
        statement,
        latex,
        visualRef: (step.graphics ?? [])[0],
        stepId,
        blocking: [
          'statement is scraped exposition, not one or two sentences in the learner\'s language',
          'no worked example: a tutorial step has no problem and no answer, so one must be authored',
        ],
      })
      continue
    }

    if (type === 'example') {
      stepCounts.example += 1
      const problem = tidy(step.question?.text)
      const solution = tidy(step.explanation?.text)
      if (!problem && !solution) {
        rejected.push({ id: stepId, reason: 'example step had neither a question nor an explanation' })
        continue
      }
      position += 1
      points.push({
        id: `${conceptId}-kp-${position}`,
        conceptId,
        position,
        statement: tidy(step.title) || problem,
        unlabelledExample: { problem, solution },
        latex: [...latex, ...(step.question?.latex ?? []).map(tidy), ...(step.explanation?.latex ?? []).map(tidy)]
          .filter(Boolean),
        visualRef: (step.graphics ?? [])[0],
        stepId,
        blocking: [
          'the explanation is one unlabelled block; subgoal labels must be authored, and ' +
            'splitting it on sentence boundaries would produce the shape of a labelled ' +
            'example with none of its value',
          'statement is a step title, not a claim the learner can hold',
        ],
      })
      continue
    }

    if (type === 'question') {
      stepCounts.question += 1
      const prompt = tidy(step.text)
      if (!prompt) {
        rejected.push({ id: stepId, reason: 'question step carried no prompt text' })
        continue
      }
      const parsable = latex.map(parseFragment).filter((f): f is NonNullable<typeof f> => f !== null)
      tasks.push({
        id: `${conceptId}-task-${tasks.length + 1}`,
        // Attached to whichever point is latest at this point in the lesson, which
        // is the step the question follows. Null-safe: a lesson may open with a
        // question, and an unattached task is still reviewable.
        draftKnowledgePointId: points[points.length - 1]?.id ?? '',
        prompt,
        latex,
        parsable,
        scrapedAnswer: step.userAnswer ?? undefined,
        stepId,
        blocking: [
          parsable.length > 0
            ? `${parsable.length} of ${latex.length} LaTeX fragments parse as infix, advisorily; ` +
              '`given` must still be authored because the conversion is lossy'
            : 'no LaTeX fragment converts to infix the parser accepts, so `given` must be authored',
          'the scraped answer is the learner\'s, not a reference — seeding `reference` with it ' +
            'would mark correct answers wrong',
          '`form`, `variables` and any domain conditions are authorial claims and are not in the DOM',
        ],
      })
      continue
    }

    stepCounts.unknown += 1
    rejected.push({ id: stepId, reason: `step type '${type}' is not one this importer reads` })
  }

  return { points, tasks, rejected, stepCounts }
}

/**
 * The task kinds a topic's step types suggest.
 *
 * A hint, and emphatically not an `Objective`. An objective claims that these
 * kinds *evidence* it, and a step type cannot make that claim — `example` steps
 * suggest `transform_to_form` because that is what most Math Academy worked
 * examples are, which is a statement about the median page and not about this one.
 */
export function suggestedTaskKinds(stepCounts: DraftSource['stepCounts']): TaskKind[] {
  const out: TaskKind[] = []
  if (stepCounts.example > 0 || stepCounts.question > 0) out.push('transform_to_form')
  if (stepCounts.tutorial > 0) out.push('state')
  return out
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

function caveatFor(name: string, source: DraftSource): string {
  const where =
    source.origin === 'edge-label'
      ? 'It was never scraped — the only thing known about it is the text of a link that ' +
        'pointed at it, so there is no lesson material behind this draft at all.'
      : `Drafted from ${source.stepCounts.tutorial} tutorial, ${source.stepCounts.example} ` +
        `example and ${source.stepCounts.question} question steps.`
  return (
    `Imported from ${IMPORTER_ID} and unreviewed. No membership pattern was scraped, so this ` +
    `concept steers a search and filters nothing. ${where} Nothing here may gate a learner ` +
    `until "${name}" has been authored into a real concept.`
  )
}

function draftFrom(
  topicId: string,
  name: string,
  subjectId: string,
  origin: DraftOrigin,
  topic: ScrapedTopic | undefined,
  steps: ScrapedStep[],
): { draft: DraftConcept; rejectedSteps: { id: string; reason: string }[] } {
  const conceptId = conceptIdFor(topicId)
  const { points, tasks, rejected, stepCounts } = draftMaterialFor(conceptId, steps)
  const source: DraftSource = {
    topicId,
    origin,
    url: topic?.url,
    scrapedAt: topic?.scrapedAt,
    stepCounts,
  }

  const blocking: string[] = []
  if (points.length === 0) {
    blocking.push('no knowledge points: nothing scraped for this topic can be practised')
  } else {
    blocking.push(
      `${points.length} draft knowledge point(s), none of which has a subgoal-labelled worked example`,
    )
  }
  blocking.push(
    'no objectives: nothing in a scrape names the task kinds that would evidence one, and an ' +
      'objective with no kind is unreachable',
  )
  blocking.push('fidelity is guided because no membership pattern was scraped; a `match` must be authored')
  if (origin === 'edge-label') {
    blocking.push('the topic page was never visited, so this draft has a title and nothing else')
  }

  return {
    draft: {
      id: conceptId,
      name,
      subjectId,
      scope: {
        id: conceptId,
        label: name,
        hint: name.toLowerCase(),
        // No `match`. See `fidelity`.
      },
      fidelity: 'guided',
      caveat: caveatFor(name, source),
      source,
      draftKnowledgePoints: points,
      draftTasks: tasks,
      suggestedTaskKinds: suggestedTaskKinds(stepCounts),
      blocking,
    },
    rejectedSteps: rejected,
  }
}

// ---------------------------------------------------------------------------
// The import
// ---------------------------------------------------------------------------

/**
 * Read one archive into a reviewable draft.
 *
 * Two sources of concepts, and the second is the one that keeps the graph intact.
 * `graph/topics.json` holds only topics whose overview page was visited, but an
 * edge routinely points at a topic nobody opened. Dropping those edges would
 * discard real structure for an accident of browsing order; inventing a concept
 * with an id and no name would produce something unreviewable. The scraper's
 * `fromLabel`/`toLabel` is the link text, which is the topic's own title — enough
 * to draft a named concept marked `edge-label`, carrying no material and saying so.
 */
export function importArchive(archive: ScrapedArchive, subjectId: string): ConceptImport {
  const graph = archive.graph ?? {}
  const topics = graph.topics ?? {}
  const steps = archive.steps ?? []

  const { edges, rejected: rejectedEdges, endpoints } = importedEdges(graph)

  const stepsByTopic = new Map<string, ScrapedStep[]>()
  for (const step of steps) {
    const topicId = (step.topicId ?? '').trim()
    if (!topicId) continue
    const list = stepsByTopic.get(topicId) ?? []
    list.push(step)
    stepsByTopic.set(topicId, list)
  }

  const concepts: DraftConcept[] = []
  const seen = new Set<string>()
  const rejectedSteps: { id: string; reason: string }[] = []

  // Visited topics first, in the archive's own key order.
  for (const [topicId, topic] of Object.entries(topics)) {
    const conceptId = conceptIdFor(topicId)
    if (seen.has(conceptId)) continue
    seen.add(conceptId)
    const topicSteps = stepsByTopic.get(topicId) ?? []
    const built = draftFrom(topicId, tidy(topic.title) || topicId, subjectId, 'scraped-topic', topic, topicSteps)
    concepts.push(built.draft)
    rejectedSteps.push(...built.rejectedSteps)
  }

  // Then the topics only an accepted edge's label knows about.
  for (const label of unvisitedEndpoints(endpoints, topics)) {
    const conceptId = conceptIdFor(label.topicId)
    if (seen.has(conceptId)) continue
    seen.add(conceptId)
    concepts.push(draftFrom(label.topicId, label.name, subjectId, 'edge-label', undefined, []).draft)
  }

  // Steps whose topic never made it into the graph at all. Reachable whenever a
  // lesson was scraped but its overview page — the only page carrying the
  // prerequisite links — never was, which is the common case for a single lesson.
  for (const [topicId, topicSteps] of stepsByTopic) {
    if (seen.has(conceptIdFor(topicId))) continue
    seen.add(conceptIdFor(topicId))
    const name = tidy(topicSteps[0]?.title) || topicId
    const built = draftFrom(topicId, name, subjectId, 'scraped-topic', undefined, topicSteps)
    concepts.push(built.draft)
    rejectedSteps.push(...built.rejectedSteps)
  }

  const fromEdgeLabels = concepts.filter(c => c.source.origin === 'edge-label').length
  const allFragments = concepts.flatMap(c => c.draftTasks).flatMap(t => t.latex)
  const parsableCount = concepts.flatMap(c => c.draftTasks).reduce((n, t) => n + t.parsable.length, 0)

  return {
    subjectId,
    concepts,
    edges,
    rejected: { edges: rejectedEdges, steps: rejectedSteps },
    counts: {
      topicsScraped: Object.keys(topics).length,
      conceptsDrafted: concepts.length,
      conceptsFromEdgeLabelsOnly: fromEdgeLabels,
      edgesAccepted: edges.length,
      edgesRejected: rejectedEdges.length,
      stepsRead: steps.length,
      draftKnowledgePoints: concepts.reduce((n, c) => n + c.draftKnowledgePoints.length, 0),
      draftTasks: concepts.reduce((n, c) => n + c.draftTasks.length, 0),
    },
    cycles: candidateCycles(edges),
    parseRate:
      allFragments.length === 0
        ? null
        : { parsable: parsableCount, total: allFragments.length, rate: parsableCount / allFragments.length },
    provenance: {
      importer: IMPORTER_ID,
      generatedAt: archive.manifest?.generatedAt,
      source: archive.manifest?.source,
    },
  }
}

/**
 * Endpoints of accepted edges that the scrape never actually visited, paired with
 * the link text that named them. The label is preferred over the id because a
 * reviewer can act on "Multiplying Binomials" and cannot act on `4821`.
 */
function unvisitedEndpoints(
  endpoints: Map<string, string>,
  topics: Record<string, ScrapedTopic>,
): { topicId: string; name: string }[] {
  const out: { topicId: string; name: string }[] = []
  for (const [topicId, name] of endpoints) {
    if (topicId in topics) continue
    out.push({ topicId, name })
  }
  return out
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

/**
 * What fraction of drafted concepts a human has since authored.
 *
 * The concept-level twin of `promotionRate`, and the number that answers the half
 * of step 1's question edges cannot: statements and dependencies import at
 * different rates, and conflating them would hide whichever is doing worse.
 *
 * `null` on an empty denominator, for the reason `promotionRate` gives: a rate
 * over nothing reads as 0% and means "nobody tried", which is a different fact
 * from "nobody promoted".
 */
export function importPromotionRate(
  imp: ConceptImport,
  ontology: ConceptOntology,
): { authored: number; drafted: number; rate: number } | null {
  const drafted = imp.concepts.length
  if (drafted === 0) return null
  const live = new Set(ontology.concepts.map(c => c.id))
  const authored = imp.concepts.filter(c => live.has(c.id)).length
  return { authored, drafted, rate: authored / drafted }
}

/**
 * Everything standing between a draft and a `Concept`, as one flat list.
 *
 * Deliberately never empty: there is no state in which a scraped draft is ready,
 * because `workedExample.subgoals` and `Objective.taskKinds` cannot be scraped at
 * all. A function that could return `[]` would invite a caller to loop until it
 * did, and no amount of better scraping gets there — the missing thing is an
 * authoring decision, not more data.
 */
export function draftBlockers(draft: DraftConcept): string[] {
  return [
    ...draft.blocking,
    ...draft.draftKnowledgePoints.flatMap(p => p.blocking.map(b => `${p.id}: ${b}`)),
    ...draft.draftTasks.flatMap(t => t.blocking.map(b => `${t.id}: ${b}`)),
  ]
}

/** A short review summary, in the register `summarise` uses in scheduling.ts. */
export function summariseImport(imp: ConceptImport): string[] {
  const lines: string[] = []
  const c = imp.counts
  lines.push(
    `${c.conceptsDrafted} concept(s) drafted from ${c.topicsScraped} scraped topic(s) and ` +
      `${c.stepsRead} step(s).`,
  )
  if (c.conceptsFromEdgeLabelsOnly > 0) {
    lines.push(
      `${c.conceptsFromEdgeLabelsOnly} of them is a link label and nothing else — those topics ` +
        `were never visited.`,
    )
  }
  lines.push(
    `${c.edgesAccepted} candidate prerequisite(s) accepted, ${c.edgesRejected} refused. None is ` +
      `promoted, so none gates anything.`,
  )
  lines.push(
    `${c.draftKnowledgePoints} draft knowledge point(s) and ${c.draftTasks} draft task(s). ` +
      `Neither count is a count of usable material: every one is blocked on authoring.`,
  )
  if (imp.parseRate) {
    const pct = Math.round(imp.parseRate.rate * 100)
    lines.push(
      `${imp.parseRate.parsable}/${imp.parseRate.total} LaTeX fragments (${pct}%) convert to infix ` +
        `the parser accepts. Advisory ceiling on mechanisation, not a count of tasks.`,
    )
  } else {
    lines.push('No LaTeX fragments were scraped, so there is no parse rate to report.')
  }
  if (imp.cycles.length > 0) {
    lines.push(
      `${imp.cycles.length} cycle(s) among the candidates — evidence the scraper's heuristics ` +
        `misfired, though candidates gate nothing so nothing is broken by them.`,
    )
  }
  return lines
}

// ---------------------------------------------------------------------------
// Emitting a draft module
// ---------------------------------------------------------------------------

function literal(value: string): string {
  return JSON.stringify(value)
}

function wrap(text: string, indent: string, width = 92): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (line && `${line} ${word}`.length + indent.length > width) {
      lines.push(`${indent}${line}`)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(`${indent}${line}`)
  return lines
}

/**
 * The module a reviewer actually reads: the draft as TypeScript source.
 *
 * This is the output that matters, because the ontology is code. What it emits is
 * **not** a `ConceptOntology` — it cannot be, since drafts are not concepts — but a
 * `DraftConcept[]` plus the candidate edges, so the file compiles, can be imported
 * by a review page, and will not typecheck if somebody tries to pass it where an
 * ontology belongs.
 *
 * Every blocker is emitted as a comment next to the thing it blocks, rather than
 * collected at the top. A list of forty blockers at the head of a file is read
 * once; a blocker on the line above the draft it concerns is read every time
 * somebody edits that draft.
 */
export function emitDraftModule(imp: ConceptImport): string {
  const out: string[] = []
  const p = (line = '') => out.push(line)

  p('/**')
  p(` * DRAFT — imported by ${IMPORTER_ID}, reviewed by nobody.`)
  p(' *')
  for (const line of wrap(
    'Generated by lib/concepts/import.ts from a .bza archive. Nothing in this file is part of ' +
      'the ontology: the concepts are DraftConcept, not Concept, so the compiler will refuse ' +
      'to let them reach a walk, and every edge is a candidate_prerequisite with no promoter, ' +
      'so no walk would take it even if it could.',
    ' * ',
  )) p(line)
  p(' *')
  for (const line of wrap(
    'To promote any of this, author it by hand into ontology.ts: a concept needs a membership ' +
      'pattern, at least one objective naming real task kinds, and knowledge points with ' +
      'subgoal-labelled worked examples. None of those three can be scraped. The edges may be ' +
      'moved across as promoted prerequisite edges once both endpoints exist, each naming ' +
      'whoever promoted it.',
    ' * ',
  )) p(line)
  p(' *')
  for (const line of summariseImport(imp)) {
    for (const l of wrap(line, ' * ')) p(l)
  }
  p(' */')
  p()
  p("import type { ConceptEdge } from './types'")
  p("import type { DraftConcept } from './import'")
  p()
  p(`export const SUBJECT_ID = ${literal(imp.subjectId)}`)
  p()
  p('export const DRAFT_CONCEPTS: DraftConcept[] = [')

  for (const concept of imp.concepts) {
    p('  {')
    p(`    id: ${literal(concept.id)},`)
    p(`    name: ${literal(concept.name)},`)
    p(`    subjectId: ${literal(concept.subjectId)},`)
    p(`    scope: { id: ${literal(concept.scope.id)}, label: ${literal(concept.scope.label)}, hint: ${literal(concept.scope.hint)} },`)
    p("    fidelity: 'guided',")
    p(`    caveat: ${literal(concept.caveat)},`)
    p(`    source: ${JSON.stringify(concept.source)},`)
    p(`    suggestedTaskKinds: ${JSON.stringify(concept.suggestedTaskKinds)},`)
    p('    // Blocked on:')
    for (const blocker of concept.blocking) {
      for (const line of wrap(`- ${blocker}`, '    // ')) p(line)
    }
    p(`    blocking: ${JSON.stringify(concept.blocking)},`)
    p('    draftKnowledgePoints: [')
    for (const point of concept.draftKnowledgePoints) {
      p('      {')
      p(`        id: ${literal(point.id)},`)
      p(`        conceptId: ${literal(point.conceptId)},`)
      p(`        position: ${point.position},`)
      p(`        statement: ${literal(point.statement)},`)
      if (point.unlabelledExample) {
        p('        // Unsplit on purpose. Subgoal labels are the authoring step.')
        p(`        unlabelledExample: ${JSON.stringify(point.unlabelledExample)},`)
      }
      p(`        latex: ${JSON.stringify(point.latex)},`)
      if (point.visualRef) p(`        visualRef: ${literal(point.visualRef)},`)
      if (point.stepId) p(`        stepId: ${literal(point.stepId)},`)
      p(`        blocking: ${JSON.stringify(point.blocking)},`)
      p('      },')
    }
    p('    ],')
    p('    draftTasks: [')
    for (const task of concept.draftTasks) {
      p('      {')
      p(`        id: ${literal(task.id)},`)
      p(`        draftKnowledgePointId: ${literal(task.draftKnowledgePointId)},`)
      p(`        prompt: ${literal(task.prompt)},`)
      p(`        latex: ${JSON.stringify(task.latex)},`)
      p(`        parsable: ${JSON.stringify(task.parsable)},`)
      if (task.scrapedAnswer !== undefined) {
        p('        // The learner\'s answer, which may be wrong. Never a reference.')
        p(`        scrapedAnswer: ${literal(task.scrapedAnswer)},`)
      }
      if (task.stepId) p(`        stepId: ${literal(task.stepId)},`)
      p(`        blocking: ${JSON.stringify(task.blocking)},`)
      p('      },')
    }
    p('    ],')
    p('  },')
  }

  p(']')
  p()
  p('/** Every one a candidate. No promoter, because an importer is not one. */')
  p('export const CANDIDATE_EDGES: ConceptEdge[] = [')
  for (const edge of imp.edges) {
    p(`  { id: ${literal(edge.id)}, from: ${literal(edge.from)}, to: ${literal(edge.to)}, kind: 'candidate_prerequisite', rationale: ${literal(edge.rationale ?? '')} },`)
  }
  p(']')
  p()

  if (imp.rejected.edges.length > 0) {
    p('/**')
    p(' * Refused, and kept here so the refusals are reviewable rather than invisible.')
    p(' * These are NOT exported as edges — they are a record of what was not imported.')
    p(' */')
    p('export const REFUSED_EDGES = [')
    for (const edge of imp.rejected.edges) {
      p(`  { from: ${literal(edge.from)}, to: ${literal(edge.to)}, type: ${literal(edge.type)}, reason: ${literal(edge.reason)} },`)
    }
    p(']')
    p()
  }

  return out.join('\n')
}
