/**
 * Strength, credit and assembly — the scheduler.
 *
 * ── WHOSE POLICY THIS IS ──────────────────────────────────────────────────
 *
 * Math Academy publishes its pedagogical *principles* and explicitly withholds
 * its spacing and credit-propagation algorithms. Every number and every rule in
 * this file is therefore this project's own: the half-life, the doubling, the
 * distance decay, the mastery floor, the cooldown. None of it should ever be
 * described as theirs, and none of it is tuned against anything — these are
 * defensible starting values whose only justification is the argument written
 * next to each one.
 *
 * ── WHY NOT bza's EXISTING SM-2 ───────────────────────────────────────────
 *
 * bza already has a spaced-repetition implementation: `lib/queries/quiz.ts` holds
 * SM-2 inline (`interval_days`, `ease_factor`, `repetitions`, `next_review_at`)
 * and `updateMastery` in `lib/queries/knowledge-graph.ts` calls it. That path is
 * deliberately left alone, and this is a second implementation by choice, for two
 * substantive reasons rather than stylistic ones:
 *
 *  1. SM-2 is graph-blind. It cannot know that practising an advanced concept
 *     exercised three prerequisites, so those prerequisites come due anyway and
 *     the learner re-drills exactly what they just demonstrated. In a domain that
 *     is mostly prerequisite structure that is the dominant inefficiency, and the
 *     `encompasses` edge exists to fix precisely it.
 *  2. `mastered = score >= 0.6` counts any success as mastery regardless of
 *     assistance. A hint-assisted correct answer and an independent one are
 *     different observations, and collapsing them is the one thing this whole
 *     evidence design is built to prevent.
 *
 * Generalising bza's scheduler to be graph-aware would couple a reading feature to
 * a mathematics curriculum for no gain — its graph is per-book and per-user, this
 * one is subject-wide. The cost of leaving both is two schedulers that never meet.
 *
 * ── THE DUE-NESS MODEL ────────────────────────────────────────────────────
 *
 * There are no due *dates*. Strength decays continuously and the most-decayed
 * eligible point is the one served, which is the same idea expressed as a
 * quantity rather than a timestamp. It is also the only version that composes with
 * credit propagation: propagating credit to a date means rewriting a date, and
 * rewriting dates is how a scheduler's state stops being derivable from its
 * observations.
 */

import {
  allKnowledgePoints, conceptById, conceptOfPoint, encompassedClosure, interferesWith,
  isVerifiableKind, prerequisitesOf,
} from './registry'
import { TASKS } from './tasks'
import { isScorable } from './verify'
import type { ConceptOntology, Observation, PracticeTask } from './types'

// ---------------------------------------------------------------------------
// Constants, each with its argument
// ---------------------------------------------------------------------------

/**
 * How long a single unaided success is worth before it has half decayed.
 *
 * One day, which is short. Short on purpose: the first demonstration of a skill
 * is the least reliable evidence you will ever have of it, and a generous initial
 * interval is how a learner ends up with a curriculum built on one lucky answer.
 */
const BASE_HALF_LIFE_DAYS = 1

/** Each further unaided success doubles the half-life. Capped so nothing becomes permanent. */
const MAX_HALF_LIFE_DAYS = 180

/**
 * The strength a concept's points must average before anything resting on it is
 * introduced. This is the mastery-learning gate, and it is a hard gate — see
 * `introducible`.
 *
 * 0.75 rather than something lower because the thing being decided is whether to
 * build on it. A floor that admits shaky prerequisites produces the failure the
 * whole ordering exists to prevent, and it produces it invisibly: the learner
 * fails the advanced concept and nobody can see that the cause was two levels down.
 */
export const MASTERY_FLOOR = 0.75

/** What one unaided success moves strength toward 1. */
const GAIN = 0.4

/** What one incorrect answer multiplies strength by. */
const LOSS = 0.5

/**
 * How far credit travels along `encompasses`, and how fast it decays.
 *
 * Two edges, halving per edge. Beyond two the claim gets thin — "doing partial
 * fractions exercised polynomial arithmetic" is true; "it exercised whatever that
 * encompasses, and whatever *that* encompasses" is an argument rather than an
 * observation, and the scheduler should not be making arguments.
 */
const MAX_CREDIT_DISTANCE = 2
const CREDIT_PER_EDGE = 0.5

/** How long after any attempt a point stays out of the assembly. */
const COOLDOWN_MS = 20 * 60 * 1000

const DAY_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface PointStrength {
  knowledgePointId: string
  /** 0 to 1, as of `lastDemonstratedAt`. Read it through `strengthNow`. */
  strength: number
  /** Consecutive unaided successes. Drives the half-life; reset by any failure. */
  streak: number
  unaidedSuccesses: number
  /**
   * Correct answers that had help. Counted and never allowed to advance strength.
   *
   * Kept because it is the most useful diagnostic in the table: a point with eight
   * assisted successes and no unaided one is not a point the learner is slowly
   * getting, it is a point the hint is answering.
   */
  assistedSuccesses: number
  failures: number
  /**
   * When strength was last *earned* — an unaided success, or credit propagated
   * from one. Decay is measured from here.
   */
  lastDemonstratedAt: string | null
  /**
   * When the point was last attempted at all, including assisted successes,
   * failures and inconclusive rulings.
   *
   * Separate from the above and doing a completely different job. It suppresses
   * re-serving the same point minutes later, and it must NOT affect decay: an
   * assisted success that reset the decay clock would push a point the learner has
   * not demonstrated further out of review, which is the collapse this design
   * exists to prevent, arriving by the back door.
   */
  lastAttemptAt: string | null
}

export type StrengthTable = Record<string, PointStrength>

export function emptyStrength(knowledgePointId: string): PointStrength {
  return {
    knowledgePointId,
    strength: 0,
    streak: 0,
    unaidedSuccesses: 0,
    assistedSuccesses: 0,
    failures: 0,
    lastDemonstratedAt: null,
    lastAttemptAt: null,
  }
}

const entryFor = (table: StrengthTable, id: string): PointStrength =>
  table[id] ?? emptyStrength(id)

// ---------------------------------------------------------------------------
// Decay
// ---------------------------------------------------------------------------

export function halfLifeDays(s: PointStrength): number {
  return Math.min(BASE_HALF_LIFE_DAYS * 2 ** s.streak, MAX_HALF_LIFE_DAYS)
}

/**
 * Strength as of `now`, after decay.
 *
 * `now` is a parameter rather than a clock read, so the whole scheduler is pure
 * and a test can assert what happens after ninety days without waiting.
 */
export function strengthNow(s: PointStrength, now: string | number | Date): number {
  if (!s.lastDemonstratedAt || s.strength <= 0) return 0
  const elapsed = new Date(now).getTime() - new Date(s.lastDemonstratedAt).getTime()
  if (!Number.isFinite(elapsed) || elapsed <= 0) return s.strength
  const halves = elapsed / (halfLifeDays(s) * DAY_MS)
  return s.strength * 2 ** -halves
}

/** Mean current strength over a concept's points. 0 when it has none. */
export function conceptStrength(
  o: ConceptOntology, table: StrengthTable, conceptId: string, now: string | number | Date,
): number {
  const concept = conceptById(o, conceptId)
  if (!concept || concept.knowledgePoints.length === 0) return 0
  const total = concept.knowledgePoints
    .reduce((sum, p) => sum + strengthNow(entryFor(table, p.id), now), 0)
  return total / concept.knowledgePoints.length
}

/**
 * May this concept be practised at all?
 *
 * Every prerequisite at or above the floor. This is the hard gate, and it does
 * not relax — not at a salvage stage, not to keep a session going, not because
 * the assembly came back empty. An empty assembly is a true and useful answer
 * ("go and shore up what this rests on"); a relaxed one serves a problem the
 * learner has not been prepared for, which is the exact failure mastery learning
 * is for. See the inversion note in traversal.ts.
 */
export function introducible(
  o: ConceptOntology, table: StrengthTable, conceptId: string, now: string | number | Date,
): boolean {
  return prerequisitesOf(o, conceptId).every(p => conceptStrength(o, table, p, now) >= MASTERY_FLOOR)
}

// ---------------------------------------------------------------------------
// Recording an observation
// ---------------------------------------------------------------------------

export interface ApplyResult {
  table: StrengthTable
  /** Whether the observation moved anything. False for inconclusive and abandoned. */
  scored: boolean
  /** Points that received propagated credit, and how much. For the UI and the log. */
  propagated: { knowledgePointId: string; conceptId: string; distance: number; credit: number }[]
}

/**
 * Fold one observation into the table.
 *
 * Returns a new table. The four cases, and the reason each is what it is:
 *
 *   inconclusive / abandoned   Nothing moves. Not strength, not the streak, not
 *                              even `lastDemonstratedAt`. The engine failing to
 *                              settle a question is a fact about the engine, and
 *                              scoring it either way would train the learner on
 *                              this build's limitations. `isScorable` in verify.ts
 *                              enforces the same rule independently, on purpose.
 *
 *   correct, unaided           Strength up, streak up, credit propagated. The only
 *                              case that advances anything.
 *
 *   correct, assisted          Counted, and that is all. A hint-assisted success
 *                              is a different observation from an independent one
 *                              and the two are never added together.
 *
 *   incorrect                  Strength down, streak to zero. `lastDemonstratedAt`
 *                              is left alone, so the point stays as decayed as the
 *                              last real demonstration left it.
 */
export function applyObservation(
  o: ConceptOntology,
  table: StrengthTable,
  obs: Observation,
): ApplyResult {
  const next: StrengthTable = { ...table }
  const current = entryFor(table, obs.knowledgePointId)

  if (!isScorable(obs.verdict)) {
    return { table, scored: false, propagated: [] }
  }

  if (obs.verdict.ruling === 'incorrect') {
    next[obs.knowledgePointId] = {
      ...current,
      strength: current.strength * LOSS,
      streak: 0,
      failures: current.failures + 1,
      lastAttemptAt: obs.at,
    }
    return { table: next, scored: true, propagated: [] }
  }

  if (obs.assistance !== 'none') {
    next[obs.knowledgePointId] = {
      ...current,
      assistedSuccesses: current.assistedSuccesses + 1,
      lastAttemptAt: obs.at,
    }
    return { table: next, scored: true, propagated: [] }
  }

  // Unaided success. Decay first, then gain, so a point demonstrated after a long
  // gap does not jump from its stale stored value.
  const decayed = strengthNow(current, obs.at)
  next[obs.knowledgePointId] = {
    ...current,
    strength: Math.min(1, decayed + GAIN * (1 - decayed)),
    streak: current.streak + 1,
    unaidedSuccesses: current.unaidedSuccesses + 1,
    lastDemonstratedAt: obs.at,
    lastAttemptAt: obs.at,
  }

  const propagated = propagateCredit(o, next, obs)
  return { table: next, scored: true, propagated }
}

/**
 * Credit along `encompasses` — the edge that makes this scheduler worth having.
 *
 * ONE GUARD THAT IS THE WHOLE DIFFERENCE BETWEEN THIS AND A CHEAT: propagation
 * only touches points the learner has already demonstrated at least once
 * (`unaidedSuccesses > 0`). Credit *reinforces*; it never *introduces*. Without
 * that check, decomposing one fraction would mark factoring as demonstrated for
 * a learner who has never factored anything, and the mastery floor — which reads
 * exactly these numbers — would then wave them through to everything that rests
 * on it. The inefficiency this edge fixes is real; the shortcut it would open if
 * unguarded is worse than the inefficiency.
 *
 * Mutates `table` in place because `applyObservation` has already copied it.
 */
function propagateCredit(
  o: ConceptOntology, table: StrengthTable, obs: Observation,
): ApplyResult['propagated'] {
  const concept = conceptOfPoint(o, obs.knowledgePointId)
  if (!concept) return []

  const out: ApplyResult['propagated'] = []
  for (const [conceptId, distance] of encompassedClosure(o, concept.id)) {
    if (distance > MAX_CREDIT_DISTANCE) continue
    const credit = GAIN * CREDIT_PER_EDGE ** distance
    const target = conceptById(o, conceptId)
    if (!target) continue

    for (const point of target.knowledgePoints) {
      const entry = entryFor(table, point.id)
      if (entry.unaidedSuccesses === 0) continue   // reinforce, never introduce

      const decayed = strengthNow(entry, obs.at)
      table[point.id] = {
        ...entry,
        strength: Math.min(1, decayed + credit * (1 - decayed)),
        // The decay clock restarts, because the concept genuinely was exercised.
        // This is the half of the fix that stops a just-used prerequisite coming
        // due as though untouched; the credit above is the other half.
        lastDemonstratedAt: obs.at,
        // NOT lastAttemptAt: the learner did not attempt this point, and
        // suppressing it from the next assembly on that basis would be a lie.
      }
      out.push({ knowledgePointId: point.id, conceptId, distance, credit })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export interface AssemblyOptions {
  ontology: ConceptOntology
  strengths: StrengthTable
  now: string | number | Date
  /** How many tasks to return. */
  size?: number
  /** Cap per concept, so a session is mixed rather than a block of one thing. */
  maxPerConcept?: number
  /**
   * Concepts the learner has reached, when a traversal is driving the session.
   *
   * Omit to let the mastery floor alone decide eligibility. Supplying it is
   * stricter, never looser: a concept must be both reached and introducible.
   */
  reached?: string[]
}

export interface Assembly {
  tasks: PracticeTask[]
  /**
   * Everything excluded, with its reason.
   *
   * Reported rather than dropped. A scheduler that silently returns four tasks
   * when it meant to return eight reads as "that is all there is", and the actual
   * cause — an interference, an unverifiable kind, a concept not yet introducible
   * — is the most useful thing it knows.
   */
  skipped: { taskId: string; reason: string }[]
  /** Concepts that would have contributed but are not yet introducible. */
  blocked: { conceptId: string; missing: string[] }[]
}

/**
 * Build one practice set.
 *
 * Order of operations matters and each step is a filter rather than a preference:
 *
 *  1. Eligibility — reached (if given) and introducible. Hard.
 *  2. Verifiable kinds only. A task the engine cannot rule would be served and
 *     never scored, which looks like practice and records nothing.
 *  3. Cooldown — not attempted in the last twenty minutes.
 *  4. Due-ness order — weakest current strength first.
 *  5. Interference — a hard constraint, applied as the set is built.
 *  6. Mix — at most `maxPerConcept` from any one concept.
 */
export function assemble(opts: AssemblyOptions): Assembly {
  const { ontology: o, strengths, now } = opts
  const size = opts.size ?? 8
  const maxPerConcept = opts.maxPerConcept ?? 3
  const nowMs = new Date(now).getTime()

  const skipped: Assembly['skipped'] = []
  const blocked: Assembly['blocked'] = []

  const reachedSet = opts.reached ? new Set(opts.reached) : null
  const eligibleConcepts = new Set<string>()
  for (const concept of o.concepts) {
    if (reachedSet && !reachedSet.has(concept.id)) continue
    if (!introducible(o, strengths, concept.id, now)) {
      blocked.push({
        conceptId: concept.id,
        missing: prerequisitesOf(o, concept.id)
          .filter(p => conceptStrength(o, strengths, p, now) < MASTERY_FLOOR),
      })
      continue
    }
    eligibleConcepts.add(concept.id)
  }

  const pointConcept = new Map(allKnowledgePoints(o).map(p => [p.id, p.conceptId]))

  const candidates: { task: PracticeTask; conceptId: string; due: number; position: number }[] = []
  for (const task of TASKS) {
    const conceptId = pointConcept.get(task.knowledgePointId)
    if (!conceptId) {
      skipped.push({ taskId: task.id, reason: `names an unknown knowledge point ${task.knowledgePointId}` })
      continue
    }
    if (!eligibleConcepts.has(conceptId)) continue    // already reported in `blocked`
    if (!isVerifiableKind(task.kind)) {
      skipped.push({ taskId: task.id, reason: `kind "${task.kind}" cannot be ruled mechanically` })
      continue
    }
    const entry = entryFor(strengths, task.knowledgePointId)
    if (entry.lastAttemptAt && nowMs - new Date(entry.lastAttemptAt).getTime() < COOLDOWN_MS) {
      skipped.push({ taskId: task.id, reason: 'attempted in the last twenty minutes' })
      continue
    }
    const point = conceptById(o, conceptId)?.knowledgePoints.find(p => p.id === task.knowledgePointId)
    candidates.push({
      task,
      conceptId,
      due: strengthNow(entry, now),
      position: point?.position ?? 0,
    })
  }

  // Weakest first; then the author's own order within a concept, so a learner
  // meets a concept's points in the sequence they were written to be met in.
  candidates.sort((a, b) => a.due - b.due || a.position - b.position || a.task.id.localeCompare(b.task.id))

  const tasks: PracticeTask[] = []
  const perConcept = new Map<string, number>()
  const chosenConcepts = new Set<string>()

  for (const candidate of candidates) {
    if (tasks.length >= size) {
      skipped.push({ taskId: candidate.task.id, reason: `the set was already full at ${size}` })
      continue
    }

    const clash = interferesWith(o, candidate.conceptId).find(id => chosenConcepts.has(id))
    if (clash) {
      skipped.push({
        taskId: candidate.task.id,
        reason: `${candidate.conceptId} must not be practised alongside ${clash} in one set`,
      })
      continue
    }

    const used = perConcept.get(candidate.conceptId) ?? 0
    if (used >= maxPerConcept) {
      skipped.push({
        taskId: candidate.task.id,
        reason: `already ${used} from ${candidate.conceptId}, which is the per-concept cap`,
      })
      continue
    }

    tasks.push(candidate.task)
    perConcept.set(candidate.conceptId, used + 1)
    chosenConcepts.add(candidate.conceptId)
  }

  return { tasks, skipped, blocked }
}

/**
 * Where the learner is, in one object, for a progress panel.
 *
 * `assisted` is surfaced next to `demonstrated` rather than folded into it,
 * because the gap between the two is the number worth looking at.
 */
export function summarise(
  o: ConceptOntology, table: StrengthTable, now: string | number | Date,
): {
  points: number
  demonstrated: number
  assistedOnly: number
  strongConcepts: number
  concepts: { conceptId: string; strength: number; introducible: boolean }[]
} {
  const points = allKnowledgePoints(o)
  const concepts = o.concepts.map(c => ({
    conceptId: c.id,
    strength: conceptStrength(o, table, c.id, now),
    introducible: introducible(o, table, c.id, now),
  }))
  return {
    points: points.length,
    demonstrated: points.filter(p => entryFor(table, p.id).unaidedSuccesses > 0).length,
    assistedOnly: points.filter(p => {
      const e = entryFor(table, p.id)
      return e.unaidedSuccesses === 0 && e.assistedSuccesses > 0
    }).length,
    strongConcepts: concepts.filter(c => c.strength >= MASTERY_FLOOR).length,
    concepts,
  }
}
