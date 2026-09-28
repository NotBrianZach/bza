import { NextRequest, NextResponse } from 'next/server'
import { QuotaExhausted, cached, resolveVideo } from '@/lib/music/youtube'
import { getUserFromToken } from '@/lib/apiQuota'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * Resolve one track to a YouTube video for full-length playback.
 *
 * One track per call, on demand. Resolving a whole chain up front would spend the
 * day's 100 lookups on songs nobody asked to hear in full — most tracks in a game
 * never get clicked.
 *
 * A session is required (anonymous is fine) so this is not an open proxy onto a
 * quota we all share.
 *
 * POST { trackId, artist, title } -> { videoId, embeddable } | { videoId: null, reason }
 */
async function hasSession(req: NextRequest): Promise<boolean> {
  if (await getUserFromToken(req.headers.get('authorization'))) return true
  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

export async function POST(req: NextRequest) {
  if (!await hasSession(req)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as {
    trackId?: string; artist?: string; title?: string
  } | null

  const trackId = typeof body?.trackId === 'string' ? body.trackId.trim() : ''
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!trackId || !title) {
    return NextResponse.json({ error: 'trackId and title are required' }, { status: 400 })
  }

  try {
    const match = await resolveVideo(trackId, body?.artist ?? '', title)
    if (!match) {
      return NextResponse.json({ videoId: null, reason: 'no-match' })
    }
    if (!match.embeddable) {
      // Resolved, but the uploader or a rights holder blocks off-site playback.
      // Distinct from no-match so the UI can offer a link out instead of silence.
      return NextResponse.json({ videoId: match.videoId, embeddable: false, reason: 'not-embeddable' })
    }
    return NextResponse.json({ videoId: match.videoId, embeddable: true })
  } catch (e) {
    if (e instanceof QuotaExhausted) {
      // 200, not an error status: nothing is broken, today's lookups are simply
      // spent. The caller keeps playing previews.
      return NextResponse.json({ videoId: null, reason: 'quota' })
    }
    throw e
  }
}

/** Cache-only check, so the UI can show what is already resolved without spending quota. */
export async function GET(req: NextRequest) {
  const trackId = new URL(req.url).searchParams.get('trackId')
  if (!trackId) return NextResponse.json({ error: 'trackId is required' }, { status: 400 })
  if (!await hasSession(req)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const hit = await cached(trackId)
  if (hit === undefined) return NextResponse.json({ known: false })
  if (hit === null) return NextResponse.json({ known: true, videoId: null })
  return NextResponse.json({ known: true, ...hit })
}
