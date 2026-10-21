import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { decayWeights, PRIOR_WEIGHT } from '@/lib/suggest/feedback'
import { loadInterests, saveInterestWeights } from '@/lib/suggest/store'
import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'

/**
 * The interest list: what the user says they care about.
 *
 * GET    /api/suggest/interests
 * POST   /api/suggest/interests { name, kind?, weight?, parentInterestId? }
 * PATCH  /api/suggest/interests { interestId, weight?, name? }
 * PATCH  /api/suggest/interests { decay: 1 }   — run the weekly shrink
 * DELETE /api/suggest/interests?interestId=…
 *
 * ── A weight set here is a statement ──────────────────────────────────────
 *
 * PATCH with a weight sets `explicit_feedback`, which exempts the row from
 * decay for good. That is the correct reading: the user typed a number, and
 * quietly walking it back toward the prior each week is the single most
 * irritating thing a learning system can do. A weight the user never touched
 * stays learned and stays subject to decay.
 *
 * ── Deleting an interest does not delete its children ─────────────────────
 *
 * The foreign key is `on delete set null`, so a child becomes a root rather
 * than disappearing. Cascading would mean removing "energy" silently removes
 * "grid storage" and "lithium supply" — which the user never asked for and
 * would only discover from a digest that stopped covering them.
 */

export const dynamic = 'force-dynamic'

const KINDS = new Set(['topic', 'entity', 'question'])

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData },
  )
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    return NextResponse.json({ interests: await loadInterests(userId) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the interests' },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    name?: string; kind?: string; weight?: number; parentInterestId?: string
  } | null
  const name = body?.name?.trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (body?.kind && !KINDS.has(body.kind)) {
    return NextResponse.json({
      error: `unknown interest kind "${body.kind}" — expected topic, entity or question`,
    }, { status: 400 })
  }

  try {
    const { data, error } = await db()
      .from('suggest_interests')
      .insert({
        user_id: userId,
        name,
        kind: body?.kind ?? 'topic',
        // A new interest starts at the PRIOR, not at 1. Starting at the top
        // would make the first interest added dominate relevance until enough
        // feedback had pulled it down, so the order interests were typed in
        // would shape the feed for weeks.
        weight: typeof body?.weight === 'number' ? body.weight : PRIOR_WEIGHT,
        parent_interest_id: body?.parentInterestId ?? null,
        explicit_feedback: typeof body?.weight === 'number',
      })
      .select('id')
      .single()
    if (error) {
      // 23505 is the unique violation on (user_id, lower(name)). Reported as a
      // conflict with the existing name rather than as a server error, because
      // "you already have that interest" is a useful answer.
      if (error.code === '23505') {
        return NextResponse.json({ error: `you already have an interest called "${name}"` }, { status: 409 })
      }
      throw new Error(error.message)
    }
    return NextResponse.json({ interestId: (data as { id: string }).id, name })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not add the interest' },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    interestId?: string; weight?: number; name?: string; decay?: boolean | number
  } | null

  try {
    if (body?.decay === true || body?.decay === 1) {
      const before = await loadInterests(userId)
      const after = decayWeights(before)
      const beforeById = new Map(before.map(i => [i.interestId, i]))
      const moved = after.filter(i => {
        const b = beforeById.get(i.interestId)
        return b && Math.abs(b.weight - i.weight) > 1e-9
      })
      if (moved.length > 0) await saveInterestWeights(userId, moved)
      return NextResponse.json({
        decayed: moved.length,
        // The ones that did NOT move, and why. Otherwise a decay run that
        // changed nothing looks like it failed.
        heldExplicit: after.filter(i => i.explicitFeedback).length,
        moved: moved.map(i => ({ name: i.name, from: beforeById.get(i.interestId)!.weight, to: i.weight })),
      })
    }

    const interestId = body?.interestId?.trim()
    if (!interestId) return NextResponse.json({ error: 'interestId is required' }, { status: 400 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body?.weight === 'number') {
      patch.weight = Math.min(1, Math.max(0, body.weight))
      // See the header: a weight typed by hand is a statement, not an estimate.
      patch.explicit_feedback = true
    }
    if (body?.name?.trim()) patch.name = body.name.trim()
    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: 'nothing to change — pass a weight or a name' }, { status: 400 })
    }

    const { error } = await db()
      .from('suggest_interests')
      .update(patch)
      .eq('id', interestId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ saved: true, explicit: 'weight' in patch })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not change the interest' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const interestId = req.nextUrl.searchParams.get('interestId')
  if (!interestId) return NextResponse.json({ error: 'interestId is required' }, { status: 400 })

  try {
    const { error } = await db()
      .from('suggest_interests')
      .delete()
      .eq('id', interestId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ deleted: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not delete the interest' },
      { status: 500 },
    )
  }
}
