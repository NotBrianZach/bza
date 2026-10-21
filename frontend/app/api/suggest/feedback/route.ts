import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { applyFeedback, applyWeakSignal } from '@/lib/suggest/feedback'
import { matchedInterestsFor } from '@/lib/suggest/pipeline'
import {
  isExplicitFeedback, loadInterests, recordFeedback, saveInterestWeights,
} from '@/lib/suggest/store'
import type { Bucket, FeedbackKind } from '@/lib/suggest/types'

/**
 * Record a judgement, and move the interest weights it implies.
 *
 * POST /api/suggest/feedback { itemId, kind, value?, digestId? }
 *
 * `kind` is one of the five explicit controls — more_like_this,
 * less_like_this, interesting_not_useful, already_saw, worth_seeing — or one of
 * the two weak ones, opened and dwell_ms.
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
