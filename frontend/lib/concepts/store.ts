/**
 * Persistence for the practice state. Server-side only.
 *
 * Three tables, created by supabase/setup/60_concept_practice.sql, in the
 * application schema (`DB_SCHEMA`) and all owner-only. This module is the only
 * place that names them, so the row shape and the TypeScript shape are reconciled
 * once rather than at every route.
 *
 * The schema is never spelled as a literal here, including in prose:
 * tests/supabase-schema.mjs refuses one anywhere outside lib/supabaseSchema.ts,
 * and it does not strip comments first. That is the right strictness — a literal
 * in a comment is how the next person learns to write one in code.
 *
 * A service-role client is used rather than the caller's token, because the
 * caller's user id is already established by `getUserFromToken` and every query
 * here filters on it explicitly. The alternative — a per-request client carrying
 * the user's JWT so RLS does the filtering — is the better pattern in general and
 * is what the reading side of the app uses; it is avoided here only because the
 * verify route writes a strength row and an observation row together and wants
 * them to come from one client. RLS is still on, and is still the backstop if an
 * explicit filter is ever dropped.
 */

import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'
import type { Observation } from './types'
import type { PointStrength, StrengthTable } from './scheduling'
import { emptyStrength } from './scheduling'
import type { TraversalWorld } from './traversal'
import { seedTraversal } from './traversal'
import { needsReview } from './verify'

/**
 * `serverData` rather than `dbSchema`, and the difference is not cosmetic: it
 * carries a no-store fetch, without which Next can serve a PostgREST read from
 * a response captured before a write. See `noStoreFetch` in
 * lib/supabaseSchema.ts for the full account and the bug that found it.
 *
 * Why it matters more here than it looks: the practice engine does
 * read-after-write constantly — `/api/learn/verify` loads strengths, folds in
 * an observation, saves, and the next session read must see it. A stale read
 * would silently serve a learner the same point at the same strength, and "the
 * scheduler is not advancing" is a much harder thing to diagnose than an error
 * would have been.
 */
function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      ...serverData,
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}

let client: ReturnType<typeof makeServiceClient> | null = null
const db = () => (client ??= makeServiceClient())

// ---------------------------------------------------------------------------
// Strength
// ---------------------------------------------------------------------------

interface StrengthRow {
  knowledge_point_id: string
  strength: number
  streak: number
  unaided_successes: number
  assisted_successes: number
  failures: number
  last_demonstrated_at: string | null
  last_attempt_at: string | null
}

const fromRow = (row: StrengthRow): PointStrength => ({
  knowledgePointId: row.knowledge_point_id,
  strength: row.strength ?? 0,
  streak: row.streak ?? 0,
  unaidedSuccesses: row.unaided_successes ?? 0,
  assistedSuccesses: row.assisted_successes ?? 0,
  failures: row.failures ?? 0,
  lastDemonstratedAt: row.last_demonstrated_at,
  lastAttemptAt: row.last_attempt_at,
})

const toRow = (userId: string, s: PointStrength) => ({
  user_id: userId,
  knowledge_point_id: s.knowledgePointId,
  strength: s.strength,
  streak: s.streak,
  unaided_successes: s.unaidedSuccesses,
  assisted_successes: s.assistedSuccesses,
  failures: s.failures,
  last_demonstrated_at: s.lastDemonstratedAt,
  last_attempt_at: s.lastAttemptAt,
  updated_at: new Date().toISOString(),
})

/**
 * Every strength row for one user, as the table the scheduler reads.
 *
 * A missing row is `emptyStrength`, not an error: a learner who has never
 * attempted a point has strength zero, and materialising a row for every point
 * in every ontology at signup would be a write for information that is the
 * default.
 */
export async function loadStrengths(userId: string): Promise<StrengthTable> {
  const { data, error } = await db()
    .from('concept_point_strength')
    .select('knowledge_point_id, strength, streak, unaided_successes, assisted_successes, failures, last_demonstrated_at, last_attempt_at')
    .eq('user_id', userId)
  if (error) throw new Error(`could not load strengths: ${error.message}`)

  const table: StrengthTable = {}
  for (const row of (data ?? []) as StrengthRow[]) table[row.knowledge_point_id] = fromRow(row)
  return table
}

export function strengthOr(table: StrengthTable, id: string): PointStrength {
  return table[id] ?? emptyStrength(id)
}

/**
 * Write back only the rows an observation actually changed.
 *
 * `applyObservation` returns a whole new table, and upserting all of it would
 * rewrite every row on every answer — which is slow, and worse, makes
 * `updated_at` useless as a record of when anything happened. The caller passes
 * the ids it knows moved: the answered point, plus whatever credit propagated to.
 */
export async function saveStrengths(
  userId: string, table: StrengthTable, ids: string[],
): Promise<void> {
  const rows = [...new Set(ids)].map(id => toRow(userId, strengthOr(table, id)))
  if (rows.length === 0) return
  const { error } = await db()
    .from('concept_point_strength')
    .upsert(rows, { onConflict: 'user_id,knowledge_point_id' })
  if (error) throw new Error(`could not save strengths: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------

/**
 * Record one attempt.
 *
 * `scored` is stored rather than derived on read, so a later change to the
 * scoring policy cannot silently rewrite the history of what was counted at the
 * time. The check constraint on the table refuses a scored row with an
 * unsettled ruling — the third independent enforcement of "inconclusive is never
 * scored wrong", the other two being `isScorable` and `applyObservation`.
 */
export async function recordObservation(
  userId: string, obs: Observation, scored: boolean, asRead: string | null,
): Promise<string | null> {
  const { data, error } = await db()
    .from('concept_observations')
    .insert({
      user_id: userId,
      knowledge_point_id: obs.knowledgePointId,
      task_id: obs.taskId,
      kind: obs.kind,
      ruling: obs.verdict.ruling,
      scored,
      method: obs.verdict.method,
      assistance: obs.assistance,
      broke_at: obs.verdict.brokeAt ?? null,
      conditions: obs.verdict.conditions,
      answer: obs.answer,
      answer_as_read: asRead,
      elapsed_ms: obs.elapsedMs ?? null,
      evidence: obs.verdict.evidence ?? null,
      needs_review: needsReview(obs.verdict),
      created_at: obs.at,
    })
    .select('id')
    .single()
  if (error) throw new Error(`could not record the observation: ${error.message}`)
  return (data as { id?: string } | null)?.id ?? null
}

export interface ReviewRow {
  id: string
  knowledge_point_id: string
  task_id: string
  ruling: string
  method: string | null
  answer: string | null
  answer_as_read: string | null
  conditions: string[] | null
  evidence: Record<string, unknown> | null
  assistance: string | null
  created_at: string
}

/**
 * The review queue: inconclusive rulings an engine actually attempted.
 *
 * Oldest first, which is the opposite of what a feed would do and is right
 * here. A review queue sorted newest-first lets the tail rot invisibly — the
 * rows nobody ever reaches are precisely the ones that have been waiting
 * longest, and those are the ones most likely to be a real gap in the engine
 * rather than a one-off.
 */
export async function pendingReview(userId: string, limit = 50): Promise<ReviewRow[]> {
  const { data, error } = await db()
    .from('concept_observations')
    .select('id, knowledge_point_id, task_id, ruling, method, answer, answer_as_read, conditions, evidence, assistance, created_at')
    .eq('user_id', userId)
    .eq('needs_review', true)
    .is('reviewed_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw new Error(`could not load the review queue: ${error.message}`)
  return (data ?? []) as ReviewRow[]
}

/** How many are waiting. Separate from the list so a badge costs no rows. */
export async function pendingReviewCount(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('concept_observations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('needs_review', true)
    .is('reviewed_at', null)
  if (error) throw new Error(`could not count the review queue: ${error.message}`)
  return count ?? 0
}

/**
 * Settle one reviewed observation.
 *
 * THE ORIGINAL RULING IS NOT OVERWRITTEN, and this is the whole design of the
 * function. `ruling` stays 'inconclusive' and `scored` stays false, because
 * that is what the engine did and when. `reviewed_ruling` records what a human
 * decided afterwards, and the strength change is applied from *that*.
 *
 * The alternative — flip `ruling` to the reviewed value and set `scored` — is
 * one line shorter and rewrites history: the row would then claim the engine
 * settled something it could not, and the count of "how often does this engine
 * fail to decide" (the single most useful number this table holds) would fall
 * every time somebody worked the queue.
 *
 * A human who looks and still cannot tell passes 'inconclusive'. That closes
 * the row without scoring it, which is the honest outcome and is enforced by
 * the CHECK constraint from migration 61 as well as here.
 *
 * Returns the row as it was, so the caller can build the Observation that the
 * scheduler folds in. The write is guarded on `reviewed_at is null` so two
 * concurrent resolutions cannot both score: the second matches no row and
 * returns null.
 */
export async function resolveReview(
  userId: string,
  observationId: string,
  reviewedRuling: 'correct' | 'incorrect' | 'inconclusive',
  note: string | null,
): Promise<ReviewRow | null> {
  const scored = reviewedRuling === 'correct' || reviewedRuling === 'incorrect'

  const { data, error } = await db()
    .from('concept_observations')
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_ruling: reviewedRuling,
      reviewed_note: note,
      review_scored: scored,
    })
    .eq('id', observationId)
    .eq('user_id', userId)
    .is('reviewed_at', null)
    .select('id, knowledge_point_id, task_id, ruling, method, answer, answer_as_read, conditions, evidence, assistance, created_at')
    .maybeSingle()

  if (error) throw new Error(`could not resolve the review: ${error.message}`)
  return (data as ReviewRow | null) ?? null
}

// ---------------------------------------------------------------------------
// Traversal
// ---------------------------------------------------------------------------

export async function loadTraversal(userId: string, subjectId: string): Promise<TraversalWorld> {
  const { data, error } = await db()
    .from('concept_traversals')
    .select('world')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .maybeSingle()
  if (error) throw new Error(`could not load the traversal: ${error.message}`)

  const world = (data as { world?: unknown } | null)?.world
  return coerceWorld(world)
}

export async function saveTraversal(
  userId: string, subjectId: string, world: TraversalWorld,
): Promise<void> {
  const { error } = await db()
    .from('concept_traversals')
    .upsert(
      { user_id: userId, subject_id: subjectId, world, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,subject_id' },
    )
  if (error) throw new Error(`could not save the traversal: ${error.message}`)
}

/**
 * Coerce whatever is in the column into a world.
 *
 * Same discipline as `normalizeScopes` and `normalizeTuning`: what comes out of a
 * jsonb column is `unknown`, and a world with a missing `route` would make
 * `hasReached` throw on the first call rather than report "nothing reached yet".
 */
export function coerceWorld(raw: unknown): TraversalWorld {
  if (!raw || typeof raw !== 'object') return seedTraversal()
  const value = raw as Record<string, unknown>
  const route = Array.isArray(value.route)
    ? value.route.filter((id): id is string => typeof id === 'string')
    : []
  const reached = Array.isArray(value.reached)
    ? value.reached
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r, i) => ({
          conceptId: String(r.conceptId ?? ''),
          detail: typeof r.detail === 'string' ? r.detail : '',
          at: typeof r.at === 'number' ? r.at : i,
        }))
        .filter(r => r.conceptId)
    : []
  return {
    here: typeof value.here === 'string' ? value.here : null,
    reached,
    // The route is authoritative for membership, so it is rebuilt from `reached`
    // when the two disagree — a route naming a concept with no atlas entry would
    // make the frontier advance past something the learner cannot see.
    route: route.length === reached.length ? route : reached.map(r => r.conceptId),
  }
}
