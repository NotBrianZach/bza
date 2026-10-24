import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { getOntology, ONTOLOGIES, RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { claimableChainFor, conceptById, isTeachable } from '@/lib/concepts/registry'
import { MATHEMATICS } from '@/lib/concepts/atlas'
import { allClaims, claimConcept, claimsEverywhere, withdrawClaim } from '@/lib/concepts/store'

/**
 * Claiming to already know a concept.
 *
 * GET    /api/learn/claims?subject=<id>
 * POST   /api/learn/claims { subject, conceptId, note? }
 * DELETE /api/learn/claims?conceptId=<id>          — withdraw your own claim
 *
 * ── What a claim is, in one sentence ──────────────────────────────────────
 *
 * A request to be tested. It makes the concept's own tasks available now; it
 * writes no strength, counts as no demonstration, and unblocks nothing
 * downstream. The engine then rules your answers the usual way, and an unaided
 * wrong answer revokes it — see the settle block in /api/learn/verify.
 *
 * So the mastery gate is not weakened. What changes is that somebody who
 * already knows half a subject stops being made to start at the bottom of it,
 * which is the actual reason /learn looked like it had three concepts when the
 * two authored subjects ship fifteen.
 *
 * ── Why the concept is validated ──────────────────────────────────────────
 *
 * `concept_id` is text, not a foreign key, because the ontology is code. So
 * nothing in the database stops a claim on a concept that does not exist —
 * which would be a row that grants nothing, can never be settled, and shows up
 * nowhere. A 404 here rather than a write nobody can see.
 */

export const dynamic = 'force-dynamic'

const MAX_NOTE = 500

function resolve(rawSubject: string | null | undefined) {
  // `ONTOLOGIES[0]`, matching /api/learn/session, the /learn page and the
  // scratchpad route. This site was missed when the default moved off
  // RATIONAL_EXPRESSIONS and it broke claiming outright — see the note on the
  // concept lookup below for what the mismatch actually produced.
  const id = (rawSubject ?? '').trim() || (ONTOLOGIES[0] ?? RATIONAL_EXPRESSIONS).subject.id
  const ontology = getOntology(id)
  return ontology ? { id, ontology } : null
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  /**
   * `?subject=all` — every claim, in every subject.
   *
   * The default stays per-subject so nothing that already calls this changes.
   * But a chain claim writes rows under several subjects at once, each filed
   * under the concept's own, so a review screen asking for one subject would
   * show a fraction of what the learner just asserted and offer no route to
   * the rest. Names are resolved against the composed map here rather than a
   * single ontology, for the same reason.
   */
  if ((req.nextUrl.searchParams.get('subject') ?? '').trim() === 'all') {
    try {
      const claims = await claimsEverywhere(userId)
      return NextResponse.json({
        subject: 'all',
        claims: claims.map(c => ({
          ...c,
          conceptName: conceptById(MATHEMATICS, c.conceptId)?.name ?? c.conceptId,
          live: !c.revokedAt && !c.verifiedAt,
        })),
      })
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'could not load the claims' },
        { status: 500 },
      )
    }
  }

  const resolved = resolve(req.nextUrl.searchParams.get('subject'))
  if (!resolved) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })

  try {
    const claims = await allClaims(userId, resolved.id)
    return NextResponse.json({
      subject: resolved.id,
      claims: claims.map(c => ({
        ...c,
        conceptName: conceptById(resolved.ontology, c.conceptId)?.name ?? c.conceptId,
        /** Derived rather than stored, so the two cannot disagree. */
        live: !c.revokedAt && !c.verifiedAt,
      })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the claims' },
      { status: 500 },
    )
  }
}

/**
 * Claim a concept and every teachable concept it rests on.
 *
 * ── THE WALK IS OVER THE COMPOSED MAP, NOT THE REQUESTED SUBJECT ──────────
 *
 * Deliberate, and it is the whole value of the feature. The prerequisite chain
 * under an authored concept leaves its subject almost immediately —
 * `combining-rational` rests on `fraction-arithmetic`, `exponent-rules` on
 * `integer-arithmetic`, both by way of `algebra-foundations.links`. A walk
 * confined to the requested subject would stop at the boundary and claim none
 * of the arithmetic, which is precisely the chain somebody says they already
 * know.
 *
 * ── EACH ROW IS FILED UNDER THE CONCEPT'S OWN SUBJECT, NOT THE REQUEST'S ──
 *
 * `allClaims` and `liveClaims` both filter on `subject_id`, and the session
 * route loads only the subject being practised. So a claim on
 * `integer-arithmetic` filed under `rational-expressions` — the subject the
 * learner happened to be looking at — would be invisible for ever: never
 * loaded while practising arithmetic, and useless while practising rational
 * expressions, because a claim only ever opens its own concept.
 *
 * `composeAtlas` preserves each concept's `subjectId` through the union
 * expressly so this is answerable; the atlas header calls that disagreement
 * with `subject.id` load-bearing, and this is what it is load-bearing for.
 *
 * ── Sequential, and partial success is reported rather than rolled back ───
 *
 * `claimConcept` already returns false on a duplicate, so re-claiming a chain
 * that overlaps an earlier one is a no-op per concept rather than an error.
 * There is no transaction: a chain is at most a few dozen inserts, and if the
 * eleventh fails the right answer is to say ten were claimed — rolling back
 * work the learner correctly asserted, because a later unrelated insert failed,
 * would be worse than reporting it.
 */
async function claimTheChain(
  userId: string, conceptId: string, conceptName: string, note: string | null,
) {
  const chain = claimableChainFor(MATHEMATICS, conceptId)

  const claimed: string[] = []
  const already: string[] = []
  const failed: { conceptId: string; reason: string }[] = []

  for (const id of chain) {
    const c = conceptById(MATHEMATICS, id)
    // Cannot happen — `claimableChainFor` draws from this ontology's own
    // concepts — but a claim filed under the wrong subject is invisible rather
    // than loud, so the impossible case is skipped instead of guessed at.
    if (!c) {
      failed.push({ conceptId: id, reason: 'not in the composed map' })
      continue
    }
    try {
      const created = await claimConcept(userId, c.subjectId, id, note)
      if (created) claimed.push(id); else already.push(id)
    } catch (e) {
      failed.push({ conceptId: id, reason: e instanceof Error ? e.message : 'insert failed' })
    }
  }

  const name = (id: string) => conceptById(MATHEMATICS, id)?.name ?? id
  const bySubject = new Map<string, number>()
  for (const id of claimed) {
    const s = conceptById(MATHEMATICS, id)?.subjectId ?? 'unknown'
    bySubject.set(s, (bySubject.get(s) ?? 0) + 1)
  }

  return NextResponse.json({
    claimed: claimed.length > 0,
    conceptName,
    scope: 'chain',
    /** Named, not just counted — a learner should be able to see what they just asserted. */
    chain: chain.map(id => ({
      conceptId: id,
      conceptName: name(id),
      subjectId: conceptById(MATHEMATICS, id)?.subjectId ?? null,
      outcome: claimed.includes(id) ? 'claimed'
        : already.includes(id) ? 'already claimed'
        : 'failed',
    })),
    counts: {
      claimed: claimed.length,
      alreadyClaimed: already.length,
      failed: failed.length,
      subjects: [...bySubject].map(([subjectId, n]) => ({ subjectId, claimed: n })),
    },
    failed,
    effect: claimed.length === 0 && already.length > 0
      ? `you already had live claims on all ${already.length} concepts under ${conceptName}`
      : `${claimed.length} concept(s) under and including ${conceptName} are open to practise now`
        + `${already.length > 0 ? `, ${already.length} were already claimed` : ''}`
        + `. None of them counts for anything until you answer its problems unaided, and one`
        + ` unaided wrong answer withdraws that concept's claim — each is settled on its own.`,
  })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    subject?: string; conceptId?: string; note?: string; scope?: string
  } | null

  /**
   * `'chain'` claims the concept AND every teachable concept it rests on.
   *
   * Default is `'concept'`, so every existing caller keeps its exact behaviour
   * — this is an added affordance and not a change to what a plain claim means.
   */
  const chain = (body?.scope ?? 'concept') === 'chain'

  const resolved = resolve(body?.subject)
  if (!resolved) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })

  const conceptId = body?.conceptId?.trim()
  if (!conceptId) return NextResponse.json({ error: 'conceptId is required' }, { status: 400 })

  /**
   * THE CONCEPT IS LOOKED UP ON THE MAP, NOT IN THE REQUESTED SUBJECT.
   *
   * It used to be looked up in `resolved.ontology`, and that coupling produced
   * a bug which said the opposite of the truth. The learner was practising
   * arithmetic-foundations and claimed `order-of-operations`, which has three
   * knowledge points and is plainly authored. But `resolve()` was still
   * defaulting to rational-expressions, so the lookup missed, fell through to
   * the atlas branch, and answered 409 "is on the map but has no problems
   * written for it" about a concept whose problems the page was displaying.
   *
   * Fixing the default alone would have left the coupling: a claim would still
   * fail whenever the subject sent and the concept's own subject disagreed,
   * which is routine on the whole-map scope where a learner can select any node
   * in the graph regardless of what they are practising.
   *
   * So the concept is resolved against the composed map and the row is filed
   * under `concept.subjectId` — exactly the rule `claimTheChain` already
   * follows, and for the same reason: a claim only ever opens its own concept,
   * so it has to be stored where the subject that owns it will load it.
   * `subject` in the body now only decides which subject a 404 is reported
   * against.
   *
   * What remains a 409 is the one case that was always meant to be one: a
   * concept with no material. The atlas names ~271 of those, a learner
   * browsing the map will reach for one, and "has no concept" would be false
   * since it is visible on the page they clicked from. `isTeachable` is the
   * authority — the same predicate the gate uses — rather than membership of
   * any particular ontology.
   */
  const concept = conceptById(MATHEMATICS, conceptId)
  if (!concept) {
    return NextResponse.json(
      { error: `No concept "${conceptId}" anywhere on the map` },
      { status: 404 },
    )
  }
  if (!isTeachable(MATHEMATICS, conceptId)) {
    return NextResponse.json(
      {
        error:
          `"${concept.name}" is on the map but has no problems written for it, so there is ` +
          `nothing a claim could open. It also gates nothing, so claiming it would not ` +
          `unblock anything either.`,
      },
      { status: 409 },
    )
  }

  const note = (body?.note ?? '').trim().slice(0, MAX_NOTE) || null

  try {
    if (chain) return await claimTheChain(userId, conceptId, concept.name, note)

    // `concept.subjectId`, not `resolved.id` — the concept's own subject, for
    // the reason in `claimTheChain`'s header: `liveClaims` filters on
    // subject_id and the session loads only the subject being practised, so a
    // row filed under the subject the learner happened to be looking at would
    // never be loaded by anything.
    const created = await claimConcept(userId, concept.subjectId, conceptId, note)
    return NextResponse.json({
      claimed: created,
      conceptName: concept.name,
      // Said on every claim, because the thing somebody most needs to know is
      // that this is not a shortcut — it has opened the work, not skipped it.
      effect: created
        ? `${concept.name} is open to practise now. It counts for nothing until you answer its problems unaided, and one unaided wrong answer withdraws the claim.`
        : `you already have a live claim on ${concept.name}`,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not record the claim' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const conceptId = req.nextUrl.searchParams.get('conceptId')
  if (!conceptId) return NextResponse.json({ error: 'conceptId is required' }, { status: 400 })

  try {
    await withdrawClaim(userId, conceptId)
    return NextResponse.json({ withdrawn: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not withdraw the claim' },
      { status: 500 },
    )
  }
}
