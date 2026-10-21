import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { buildDigest, presentDigest } from '@/lib/suggest/pipeline'
import { loadLatestDigest } from '@/lib/suggest/store'

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
 */

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ digest: stored, stored: true })
    }

    const { digest, digestId, blockers } = await buildDigest(userId, { persist: !preview })
    return NextResponse.json({
      digest: { digestId, ...presentDigest(digest), weights: digest.weights, plan: digest.plan },
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
