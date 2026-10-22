import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { getOntology, RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { conceptById } from '@/lib/concepts/registry'
import { allClaims, claimConcept, withdrawClaim } from '@/lib/concepts/store'

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
 * which is the actual reason /learn looked like it had three concepts when it
 * ships twenty-four.
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
  const id = (rawSubject ?? '').trim() || RATIONAL_EXPRESSIONS.subject.id
  const ontology = getOntology(id)
  return ontology ? { id, ontology } : null
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

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

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    subject?: string; conceptId?: string; note?: string
  } | null

  const resolved = resolve(body?.subject)
  if (!resolved) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })

  const conceptId = body?.conceptId?.trim()
  if (!conceptId) return NextResponse.json({ error: 'conceptId is required' }, { status: 400 })

  const concept = conceptById(resolved.ontology, conceptId)
  if (!concept) {
    return NextResponse.json(
      { error: `${resolved.ontology.subject.name} has no concept "${conceptId}"` },
      { status: 404 },
    )
  }

  const note = (body?.note ?? '').trim().slice(0, MAX_NOTE) || null

  try {
    const created = await claimConcept(userId, resolved.id, conceptId, note)
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
