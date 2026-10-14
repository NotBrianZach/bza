import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { conceptOfPoint, knowledgePointById } from '@/lib/concepts/registry'
import { applyObservation } from '@/lib/concepts/scheduling'
import { loadStrengths, pendingReview, resolveReview, saveStrengths } from '@/lib/concepts/store'
import { taskById } from '@/lib/concepts/tasks'
import type { Assistance, Observation } from '@/lib/concepts/types'

/**
 * The review queue — where an inconclusive ruling goes to be settled by a person.
 *
 * WHY THIS ROUTE HAD TO EXIST. The verifier flags an inconclusive ruling
 * `needs_review` and the panel tells the learner it has gone to a queue. That
 * was true — the row is flagged — and there was no reader, which made the
 * sentence technically honest and practically a dead end. A queue nothing works
 * is a way of discarding the engine's own failures while appearing to record
 * them, and those failures are the most informative rows in the table.
 *
 * Only rulings an engine actually attempted appear here. An inconclusive
 * produced because no worker is configured is an operational fact about the
 * deployment, not a question for a human — see `needsReview` in verify.ts. That
 * filter is what keeps the queue from being buried under a missing env var.
 *
 * GET  → { pending: [...], count }
 * POST { observationId, ruling, note? }
 *   ruling 'correct' | 'incorrect'   settles it and moves strength
 *   ruling 'inconclusive'            closes it without scoring, which is the
 *                                    honest outcome when a human cannot tell
 *                                    either
 */

export const dynamic = 'force-dynamic'

const ONTOLOGY = RATIONAL_EXPRESSIONS

const RULINGS = ['correct', 'incorrect', 'inconclusive'] as const
type ReviewRuling = (typeof RULINGS)[number]

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  try {
    const rows = await pendingReview(userId)
    return NextResponse.json({
      count: rows.length,
      pending: rows.map(row => {
        const point = knowledgePointById(ONTOLOGY, row.knowledge_point_id)
        const task = taskById(row.task_id)
        return {
          id: row.id,
          createdAt: row.created_at,
          answer: row.answer,
          answerAsRead: row.answer_as_read,
          method: row.method,
          conditions: row.conditions ?? [],
          assistance: row.assistance ?? 'none',
          evidence: row.evidence,
          // The question has to be shown next to the answer, or the reviewer is
          // adjudicating an expression with no idea what was asked of it.
          prompt: task?.prompt ?? null,
          given: task?.given ?? null,
          form: task?.form ?? null,
          // The reference IS shown here, unlike in the practice panel. The turn
          // is over, the engine has already failed to settle it, and a reviewer
          // without the author's answer is being asked to redo the algebra by
          // hand rather than to adjudicate a disagreement.
          reference: task?.reference ?? null,
          statement: point?.statement ?? null,
          conceptName: conceptOfPoint(ONTOLOGY, row.knowledge_point_id)?.name ?? null,
          knowledgePointId: row.knowledge_point_id,
          taskId: row.task_id,
        }
      }),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the review queue' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const observationId = typeof body.observationId === 'string' ? body.observationId : ''
  const ruling = RULINGS.includes(body.ruling as ReviewRuling) ? (body.ruling as ReviewRuling) : null
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null

  if (!observationId || !ruling) {
    return NextResponse.json(
      { error: `Send { observationId, ruling } where ruling is one of ${RULINGS.join(', ')}` },
      { status: 400 },
    )
  }

  // A settled review needs its reason. Same discipline as `interferes_with` in
  // the ontology: an adjudication with no stated argument cannot itself be
  // reviewed, and the rows in this queue are exactly the ones where the
  // argument is the evidence. Closing one as still-inconclusive needs no note,
  // because "I could not tell either" is the whole of it.
  if (ruling !== 'inconclusive' && !note) {
    return NextResponse.json(
      { error: 'Settling a review needs a note saying why — the engine could not decide, so your argument is the evidence.' },
      { status: 400 },
    )
  }

  let row
  try {
    row = await resolveReview(userId, observationId, ruling, note)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not resolve the review' },
      { status: 500 },
    )
  }

  // No row matched: either it is not this user's, or somebody already settled
  // it. The guard is `reviewed_at is null` in the update, so two concurrent
  // resolutions cannot both score.
  if (!row) {
    return NextResponse.json(
      { error: 'That observation is already reviewed, or does not exist.' },
      { status: 409 },
    )
  }

  if (ruling === 'inconclusive') {
    return NextResponse.json({
      resolved: true,
      ruling,
      scored: false,
      propagated: [],
      message: 'Closed without scoring. Nobody could settle it, so nothing moved.',
    })
  }

  // Fold the human's ruling into strength. Built as an ordinary Observation so
  // it goes through exactly the same policy as a machine ruling — including the
  // assistance rule, which is read off the original row rather than reset: a
  // hint-assisted answer that a human later confirms is still an assisted
  // answer, and must still not advance strength.
  const task = taskById(row.task_id)
  const observation: Observation = {
    knowledgePointId: row.knowledge_point_id,
    taskId: row.task_id,
    kind: task?.kind ?? 'transform_to_form',
    verdict: {
      ruling,
      method: `settled by review: ${note}`,
      conditions: row.conditions ?? [],
    },
    assistance: (row.assistance as Assistance) ?? 'none',
    answer: row.answer ?? '',
    // The time of the *review*, not of the original attempt. Decay runs from
    // when the evidence became evidence, and it did not become evidence until
    // somebody settled it.
    at: new Date().toISOString(),
  }

  try {
    const strengths = await loadStrengths(userId)
    const applied = applyObservation(ONTOLOGY, strengths, observation)
    await saveStrengths(userId, applied.table, [
      row.knowledge_point_id,
      ...applied.propagated.map(p => p.knowledgePointId),
    ])
    return NextResponse.json({
      resolved: true,
      ruling,
      scored: applied.scored,
      propagated: applied.propagated.map(p => ({
        ...p,
        conceptName: ONTOLOGY.concepts.find(c => c.id === p.conceptId)?.name ?? p.conceptId,
      })),
    })
  } catch (e) {
    // The review is recorded either way — `resolveReview` already committed. A
    // strength write that fails leaves the adjudication intact and the table
    // rebuildable from it, which is the right way round.
    return NextResponse.json({
      resolved: true,
      ruling,
      scored: false,
      propagated: [],
      warning: `the review was recorded but strength was not updated: ${e instanceof Error ? e.message : 'unknown error'}`,
    })
  }
}
