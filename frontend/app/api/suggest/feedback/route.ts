import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { applyFeedback, applyWeakSignal } from '@/lib/suggest/feedback'
import { matchedInterestsFor } from '@/lib/suggest/pipeline'
import {
  isExplicitFeedback, loadInterests, recordFeedback, retractFeedback, saveInterestWeights,
} from '@/lib/suggest/store'
import type { Bucket, FeedbackKind } from '@/lib/suggest/types'

/**
 * Record a judgement, and move the interest weights it implies.
 *
 * POST   /api/suggest/feedback { itemId, kind, value?, digestId? }
 * DELETE /api/suggest/feedback { itemId, kind }   — withdraw it again
 *
 * `kind` is one of the five explicit controls — more_like_this,
 * less_like_this, interesting_not_useful, already_saw, worth_seeing — or one of
 * the two weak ones, opened and dwell_ms.
 *
 * ── Why DELETE only accepts the two zero-weight kinds ─────────────────────
 *
 * The controls are on the home-page strip now, five rows of small buttons, and
 * a mis-tap there needs to be undoable — a "already saw" that cannot be taken
 * back means an item you wanted is gone and the system believes a thing you
 * never said. But undo is only honest for the kinds that moved nothing:
 * deleting a `less_like_this` row would leave the 0.08 it already took off the
 * interest weight exactly where it was, so the button would claim to have
 * withdrawn a judgement whose entire effect remains. `already_saw` and
 * `interesting_not_useful` are `DIRECTION: 0` by design (see §5 rules 2 and 3
 * in lib/suggest/feedback.ts), which makes their retraction complete.
 *
 * The weight-moving kinds are therefore REFUSED with that reason, rather than
 * quietly accepted. Taking them back properly means re-applying the inverse
 * step, which is a different operation from a delete and would need to deal
 * with the weight having since been clamped, decayed, or typed over by hand.
 *
 * ── Why the response says what it changed ──────────────────────────────────
 *
 * It returns the weights that moved, with their before and after. A learning
 * system that adjusts itself invisibly cannot be argued with, and the whole
 * §5 design here is a set of brakes whose job is to be inspectable: a user who
 * can see that "less like this" moved *energy storage* from 0.62 to 0.54 can
 * tell us we moved the wrong interest. One that sees nothing can only notice,
 * months later, that the feed got narrow.
 *
 * ── Why the matched interests are looked up, not recomputed ───────────────
 *
 * `matchedInterestsFor` reads what the digest RECORDED as matched. Recomputing
 * from the item would use today's interest list to decide what last week's
 * digest matched — so feedback on an older item would move interests that did
 * not exist when it was shown.
 */

export const dynamic = 'force-dynamic'

const EXPLICIT: ReadonlySet<string> = new Set<FeedbackKind>([
  'more_like_this', 'less_like_this', 'interesting_not_useful', 'already_saw', 'worth_seeing',
])
const WEAK: ReadonlySet<string> = new Set(['opened', 'dwell_ms'])

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    itemId?: string; kind?: string; value?: number; digestId?: string
  } | null

  const itemId = body?.itemId?.trim()
  const kind = body?.kind?.trim()
  if (!itemId || !kind) {
    return NextResponse.json({ error: 'itemId and kind are required' }, { status: 400 })
  }
  if (!EXPLICIT.has(kind) && !WEAK.has(kind)) {
    // Named in the error rather than ignored. A typo'd kind that was accepted
    // and stored would sit in the feedback table affecting nothing, and the
    // user's judgement would have been silently discarded.
    return NextResponse.json({
      error: `unknown feedback kind "${kind}" — expected one of ${[...EXPLICIT, ...WEAK].join(', ')}`,
    }, { status: 400 })
  }

  try {
    const { names, bucket } = await matchedInterestsFor(userId, itemId)

    await recordFeedback(userId, {
      itemId,
      kind,
      value: body?.value ?? null,
      digestId: body?.digestId ?? null,
      shownAsBucket: bucket,
    })

    const before = await loadInterests(userId)
    const after = isExplicitFeedback(kind)
      ? applyFeedback(before, {
          matchedInterests: names,
          kind: kind as FeedbackKind,
          shownAsBucket: (bucket ?? 'core') as Bucket,
        })
      : applyWeakSignal(before, {
          matchedInterests: names,
          kind: kind as 'opened' | 'dwell_ms',
          value: body?.value ?? 1,
        })

    const beforeById = new Map(before.map(i => [i.interestId, i]))
    const moved = after.filter(i => {
      const b = beforeById.get(i.interestId)
      // Float comparison with a tolerance, not equality: a weak signal can
      // move a weight by 0.006 and a strict !== would also fire on a no-op
      // round-trip through the same arithmetic.
      return b && Math.abs(b.weight - i.weight) > 1e-9
    })

    if (moved.length > 0) await saveInterestWeights(userId, moved)

    return NextResponse.json({
      recorded: true,
      // Empty is a real and common answer: 'already_saw' and
      // 'interesting_not_useful' deliberately move nothing, and an item that
      // matched no interest has nothing to move either.
      moved: moved.map(i => ({
        name: i.name,
        from: beforeById.get(i.interestId)?.weight ?? null,
        to: i.weight,
      })),
      matchedInterests: names,
      explanation: moved.length === 0
        ? isExplicitFeedback(kind) && (kind === 'already_saw' || kind === 'interesting_not_useful')
          ? `"${kind.replace(/_/g, ' ')}" is recorded but deliberately moves no interest weight`
          : names.length === 0
            ? 'this item matched none of your interests, so there was no weight to move'
            : 'the weights were already at their limit'
        : null,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not record the feedback' },
      { status: 500 },
    )
  }
}

/** The kinds a delete can fully undo — the ones that never moved a weight. */
const RETRACTABLE: ReadonlySet<string> = new Set<FeedbackKind>([
  'already_saw', 'interesting_not_useful',
])

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    itemId?: string; kind?: string
  } | null

  const itemId = body?.itemId?.trim()
  const kind = body?.kind?.trim()
  if (!itemId || !kind) {
    return NextResponse.json({ error: 'itemId and kind are required' }, { status: 400 })
  }
  if (!RETRACTABLE.has(kind)) {
    return NextResponse.json({
      error: EXPLICIT.has(kind) || WEAK.has(kind)
        ? `"${kind.replace(/_/g, ' ')}" cannot be withdrawn — it already moved an interest ` +
          `weight, and deleting the record would not move it back. Only ` +
          `${[...RETRACTABLE].join(' and ')} are retractable.`
        : `unknown feedback kind "${kind}"`,
    }, { status: 400 })
  }

  try {
    const removed = await retractFeedback(userId, itemId, kind)
    return NextResponse.json({
      // The count, not a bare `true`. "Nothing to withdraw" is a different
      // answer from "withdrawn", and a client that hid a row on the strength of
      // a `true` would have hidden it on the strength of a no-op.
      withdrawn: removed,
      explanation: removed === 0
        ? `no "${kind.replace(/_/g, ' ')}" was recorded for this item`
        : null,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not withdraw the reaction' },
      { status: 500 },
    )
  }
}
