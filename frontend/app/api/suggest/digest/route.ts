import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { buildDigest, presentDigest } from '@/lib/suggest/pipeline'
import { loadItemReactions, loadLatestDigest } from '@/lib/suggest/store'

/**
 * The digest: read the current one, or build a new one.
 *
 * GET  /api/suggest/digest           — the most recent stored digest
 * GET  /api/suggest/digest?build=1   — build and store a fresh one
 * GET  /api/suggest/digest?preview=1 — build WITHOUT storing
 *
 * `preview` exists because building is not free of consequence. A stored digest
 * enters the novelty history and the next window's duplicate rate, so a user
 * dragging a weight slider to see what changes would poison both. Previewing is
 * the read-only version of the same computation.
 *
 * `blockers` and `gaps` are both returned and are NOT the same thing. A gap is
 * a bucket the ranking could not fill and is answered by enabling more feeds; a
 * blocker is the setup not being done at all — no feeds, no interests, nothing
 * polled. Collapsing them would make "you have no interests yet" read as
 * "nothing matched your interests", which sends the user to fix the wrong
 * thing.
 *
 * Every item carries the reaction already recorded for it, if any. That exists
 * for the home-page strip: the controls are there now, and a reaction that
 * vanished on reload would make them look decorative — worse, it would invite
 * the user to mark the same duplicate "already saw" every single visit.
 */

export const dynamic = 'force-dynamic'

/**
 * Attach each item's recorded reaction.
 *
 * Done here rather than inside `loadLatestDigest` so that the build path gets
 * it too. A freshly built digest can perfectly well contain an item you reacted
 * to in a previous one — that is what a reappearing story IS — and a build that
 * forgot the reaction would be the one case where the mark disappears.
 */
async function withReactions<T extends { itemId: string }>(
  userId: string, items: T[],
): Promise<(T & { reaction: string | null; reactedAt: string | null })[]> {
  const reactions = await loadItemReactions(userId, items.map(i => i.itemId))
  return items.map(i => {
    const r = reactions.get(i.itemId)
    return { ...i, reaction: r?.kind ?? null, reactedAt: r?.at ?? null }
  })
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const params = req.nextUrl.searchParams
  const preview = params.get('preview') === '1'
  const build = preview || params.get('build') === '1'

  try {
    if (!build) {
      const stored = await loadLatestDigest(userId)
      if (!stored) {
        // Null, not an empty item list. "Never generated" and "generated and
        // empty" look identical in a list of zero and have different fixes.
        return NextResponse.json({
          digest: null,
          reason: 'no digest has been generated yet — call with ?build=1',
        })
      }
      return NextResponse.json({
        digest: { ...stored, items: await withReactions(userId, stored.items) },
        stored: true,
      })
    }

    const { digest, digestId, generatedAt, blockers } = await buildDigest(userId, { persist: !preview })
    const presented = presentDigest(digest)
    return NextResponse.json({
      digest: {
        digestId,
        // From the database's clock, and null for a preview. The clients used to
        // stamp `new Date()` themselves after a build, which is the browser's
        // clock disagreeing with what the next read returns.
        generatedAt,
        ...presented,
        items: await withReactions(userId, presented.items),
        weights: digest.weights,
        plan: digest.plan,
      },
      stored: !preview && !!digestId,
      // Said explicitly rather than inferred from `stored` being false, which
      // could also mean the digest was empty.
      preview,
      blockers,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not build the digest' },
      { status: 500 },
    )
  }
}
