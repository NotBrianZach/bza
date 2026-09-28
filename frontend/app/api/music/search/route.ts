import { NextRequest, NextResponse } from 'next/server'
import { MusicError, SEARCH_LIMIT, searchTracks } from '@/lib/music/itunes'
import { getUserFromToken } from '@/lib/apiQuota'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * Search for a song to play as a move.
 *
 * Needs no Spotify connection and no subscription — this provider has no OAuth at
 * all. It still requires a session (an anonymous one is enough, and /listen
 * creates one on load) so the route is not an open proxy onto a rate-limited
 * upstream we share one IP with.
 */
async function requireUser(req: NextRequest): Promise<boolean> {
  const fromBearer = await getUserFromToken(req.headers.get('authorization'))
  if (fromBearer) return true

  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')
  if (!q?.trim()) return NextResponse.json({ tracks: [] })

  if (!await requireUser(req)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const limit = Number(url.searchParams.get('limit')) || SEARCH_LIMIT

  try {
    return NextResponse.json({ tracks: await searchTracks(q, limit) })
  } catch (e) {
    if (e instanceof MusicError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
