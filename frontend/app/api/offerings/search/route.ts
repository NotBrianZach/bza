import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'
import { getMedium } from '@/lib/correlate/media'
import { OfferingError, searchOfferings, vocabularyFor } from '@/lib/offerings'
import type { MediumId } from '@/lib/correlate/types'

/**
 * Search one medium for offerings a player can choose from.
 *
 * Replaces /api/music/search, which knew only about songs. A session is required
 * (an anonymous one is enough, and the play page creates one on load) because
 * every catalogued provider here is rate-limited per IP and that IP is ours,
 * shared by everyone — an open proxy onto it would be exhausted by one script.
 *
 * Composed media have nothing to search, so they return their vocabulary instead:
 * starting points a player can take or ignore. That keeps the client's picker one
 * code path across every medium.
 */
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const fromBearer = await getUserFromToken(req.headers.get('authorization'))
  if (fromBearer) return fromBearer

  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const mediumId = (url.searchParams.get('medium') ?? 'music') as MediumId
  const q = url.searchParams.get('q')?.trim() ?? ''

  const medium = getMedium(mediumId)
  if (!medium) return NextResponse.json({ error: `Unknown medium "${mediumId}"` }, { status: 400 })

  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  if (medium.origin === 'composed') {
    return NextResponse.json({ offerings: [], vocabulary: vocabularyFor(mediumId) })
  }

  if (!q) return NextResponse.json({ offerings: [] })

  const limit = Number(url.searchParams.get('limit')) || undefined

  try {
    const offerings = await searchOfferings(mediumId, q, { userId }, limit)
    return NextResponse.json({ offerings })
  } catch (e) {
    if (e instanceof OfferingError) {
      // provider + upstreamStatus travel with the message. Without them a 403 from
      // one catalogue is indistinguishable from a 429 from another in the UI, which
      // is precisely how "too many searches" got shown for a hard refusal.
      console.warn(`[offerings] ${e.provider} ${mediumId} q=${JSON.stringify(q)} upstream=${e.upstreamStatus} -> ${e.message}`)
      return NextResponse.json(
        { error: e.message, provider: e.provider, upstreamStatus: e.upstreamStatus },
        { status: e.status },
      )
    }
    throw e
  }
}
