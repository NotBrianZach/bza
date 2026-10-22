import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { ontologyForPoint, RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { conceptOfPoint, knowledgePointById } from '@/lib/concepts/registry'
import { applyObservation, conceptStrength, MASTERY_FLOOR } from '@/lib/concepts/scheduling'
import { loadStrengths, recordObservation, saveStrengths, settleClaim } from '@/lib/concepts/store'
import { taskById } from '@/lib/concepts/tasks'
import type { Assistance, Observation } from '@/lib/concepts/types'
import { isScorable, rule, rulingHeadline, verifierConfig } from '@/lib/concepts/verify'

/**
 * Rule one practice submission.
 *
 * The whole of the verifier judge's path, and it is short on purpose — the ruling
 * itself is in lib/concepts/verify.ts, the strength policy is in scheduling.ts,
 * and this route is the part that decides what gets written down.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO, in contrast to
 * app/api/correlate/turn/route.ts, which it is otherwise shaped like:
 *
 *  - No reply guarantee. The turn route has four stages — interpreter plan,
 *    corrective retry, server salvage search, composed floor — and guarantees a
 *    legal turn never persists without a real reply. That guarantee is humane in
 *    a game and would be a lie here. When the learner is wrong, the correct
 *    response is *wrong, and here is the step that broke*, and there is no
 *    parameter value that turns one into the other, because the guarantee is the
 *    point of the thing it belongs to.
 *  - No salvage. An inconclusive ruling is returned as inconclusive. It is never
 *    rounded to a ruling in either direction, and it never moves strength.
 *  - No model call. Nothing here asks an interpreter anything. The two rulings
 *    are a syntactic check and an exact-computation call, and a language model is
 *    not an authority on either.
 *
 * POST { taskId, answer, assistance?, elapsedMs? }
 *   → 200 { status: 'unreadable', message, position }        nothing recorded
 *   → 200 { status: 'ruled', verdict, headline, scored, propagated[] }
 */

export const dynamic = 'force-dynamic'

const FALLBACK_ONTOLOGY = RATIONAL_EXPRESSIONS

const ASSISTANCES: Assistance[] = ['none', 'hint', 'worked_example']

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }

  const taskId = typeof body.taskId === 'string' ? body.taskId : ''
  const answer = typeof body.answer === 'string' ? body.answer : ''
  const assistance: Assistance = ASSISTANCES.includes(body.assistance as Assistance)
    ? (body.assistance as Assistance)
    : 'none'
  const elapsedMs = typeof body.elapsedMs === 'number' && body.elapsedMs >= 0
    ? Math.round(body.elapsedMs)
    : undefined

  const task = taskById(taskId)
  if (!task) return NextResponse.json({ error: `No task ${taskId}` }, { status: 404 })

  // The task names its knowledge point and the ontology has to agree, or the
  // observation would be filed against nothing and the scheduler would never
  // read it back.
  // Resolved from the task rather than assumed. TASKS is one pool across every
  // shipped subject, so hardcoding a single ontology here made any submission
  // against the second subject fail with "names a knowledge point that is not in
  // the ontology" — a latent single-subject assumption, found by authoring one.
  const ONTOLOGY = ontologyForPoint(task.knowledgePointId) ?? FALLBACK_ONTOLOGY
  const point = knowledgePointById(ONTOLOGY, task.knowledgePointId)
  if (!point) {
    return NextResponse.json(
      { error: `task ${task.id} names knowledge point ${task.knowledgePointId}, which is not in the ontology` },
      { status: 500 },
    )
  }

  // Dispatched by kind in verify.ts rather than branched here, so one place knows
  // which kinds have an implementation. A kind without one is refused rather than
  // attempted: serving it and then not scoring it would look like practice and
  // record nothing. See the note at the top of tasks.ts.
  const ruling = await rule(task, answer, verifierConfig())
  if (ruling.status === 'unruled') {
    return NextResponse.json({ error: ruling.reason }, { status: 400 })
  }

  // An answer that does not parse has made no mathematical claim. Nothing is
  // ruled, nothing is recorded, and the learner is shown where it stopped making
  // sense — rather than having a typo sit in the evidence record as though an
  // engine had failed to settle something.
  if (ruling.status === 'unreadable') {
    return NextResponse.json({
      status: 'unreadable',
      message: ruling.message,
      position: ruling.position,
    })
  }

  const { verdict, asRead } = ruling
  const at = new Date().toISOString()
  const observation: Observation = {
    knowledgePointId: task.knowledgePointId,
    taskId: task.id,
    kind: task.kind,
    verdict,
    assistance,
    answer,
    elapsedMs,
    at,
  }

  const scored = isScorable(verdict)
  let propagated: { knowledgePointId: string; conceptId: string; distance: number; credit: number }[] = []
  /** Whether a claim on this concept was settled by this ruling, and how. */
  let claimOutcome: 'revoked' | 'verified' | null = null

  try {
    // The observation first. If the strength write fails afterwards, the evidence
    // still exists and the table can be rebuilt from it; the other order loses
    // the record of what happened and keeps a number nobody can account for.
    await recordObservation(userId, observation, scored, asRead)

    if (scored) {
      const strengths = await loadStrengths(userId)
      const applied = applyObservation(ONTOLOGY, strengths, observation)
      propagated = applied.propagated
      await saveStrengths(userId, applied.table, [
        task.knowledgePointId,
        ...applied.propagated.map(p => p.knowledgePointId),
      ])

      /**
       * Settle any claim on this concept. This is where a bluff is called.
       *
       * A claim opens a concept for practice without writing strength, so the
       * only thing that can settle it is an actual ruling — which is what this
       * is. Three cases:
       *
       *  - incorrect, unaided: the claim is REVOKED. The concept returns to
       *    blocked, and the reason records what happened rather than just
       *    deleting the row.
       *  - correct, unaided, strength now over the floor: VERIFIED. The claim
       *    stops granting anything because the strength table is now saying it.
       *  - anything else: left alone. An assisted success is not evidence of
       *    prior knowledge — it is evidence of being helped — and one unaided
       *    success below the floor is not yet a demonstration of fluency.
       *
       * Deliberately only on an UNAIDED observation. Revoking on an assisted
       * failure would punish somebody for taking a hint, and verifying on an
       * assisted success would let the hint do the claiming.
       */
      const conceptId = conceptOfPoint(ONTOLOGY, task.knowledgePointId)?.id
      if (conceptId && assistance === 'none') {
        if (verdict.ruling === 'incorrect') {
          claimOutcome = (await settleClaim(userId, conceptId, {
            verified: false,
            reason: `an unaided answer to ${task.id} was ruled incorrect`,
          })) ? 'revoked' : null
        } else if (verdict.ruling === 'correct') {
          const strengthNow = conceptStrength(ONTOLOGY, applied.table, conceptId, at)
          if (strengthNow >= MASTERY_FLOOR) {
            claimOutcome = (await settleClaim(userId, conceptId, { verified: true }))
              ? 'verified'
              : null
          }
        }
      }
    }
  } catch (e) {
    // The ruling is still returned. It was correctly computed, and withholding it
    // because a write failed would make a storage fault look like a verifier fault.
    return NextResponse.json({
      status: 'ruled',
      verdict,
      asRead,
      headline: rulingHeadline(verdict),
      scored: false,
      propagated: [],
      warning: `the ruling stands but was not recorded: ${e instanceof Error ? e.message : 'unknown error'}`,
    })
  }

  return NextResponse.json({
    status: 'ruled',
    verdict,
    asRead,
    headline: rulingHeadline(verdict),
    scored,
    /**
     * Whether this ruling settled a claim, and which way.
     *
     * Returned so a revocation is never silent. Somebody who claimed a concept
     * and then got one wrong has just had it closed again, and discovering that
     * from a shorter task list next time would be baffling — the ruling is the
     * moment to say it.
     */
    claim: claimOutcome,
    // Named, not just counted. "This also counted as practice of factoring
    // quadratics" is the single most reassuring thing this scheduler can say, and
    // it is only credible if it says which.
    propagated: propagated.map(p => ({
      ...p,
      conceptName: ONTOLOGY.concepts.find(c => c.id === p.conceptId)?.name ?? p.conceptId,
    })),
    concept: conceptOfPoint(ONTOLOGY, task.knowledgePointId)?.name ?? null,
  })
}
