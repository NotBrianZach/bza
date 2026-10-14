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
import { dbSchema } from '@/lib/supabaseSchema'
import type { Observation } from './types'
import type { PointStrength, StrengthTable } from './scheduling'
import { emptyStrength } from './scheduling'
import type { TraversalWorld } from './traversal'
import { seedTraversal } from './traversal'
import { needsReview } from './verify'

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...dbSchema },
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

/** The review queue: inconclusive rulings an engine actually attempted. */
export async function pendingReview(userId: string, limit = 50) {
  const { data, error } = await db()
    .from('concept_observations')
    .select('id, knowledge_point_id, task_id, ruling, method, answer, answer_as_read, conditions, evidence, created_at')
    .eq('user_id', userId)
    .eq('needs_review', true)
    .is('reviewed_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`could not load the review queue: ${error.message}`)
  return data ?? []
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
