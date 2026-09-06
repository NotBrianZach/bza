import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Write endpoint for the analytics_events table (see
 * supabase/setup/49_analytics_events.sql). Fire-and-forget from the
 * client; response body is ignored (sendBeacon).
 *
 * Auth is best-effort: we resolve the user from the Authorization header
 * if present, but anonymous events (session_id only) are accepted too so
 * we can measure pre-signup funnel.
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const name = typeof body?.name === 'string' ? body.name.slice(0, 64) : null
  if (!name) {
    return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 })
  }

  const props = body?.props && typeof body.props === 'object' ? body.props : {}
  const sessionId = typeof body?.session_id === 'string' ? body.session_id.slice(0, 128) : null
  const url = typeof body?.url === 'string' ? body.url.slice(0, 512) : null
  const userAgent = req.headers.get('user-agent')?.slice(0, 512) ?? null

  // Best-effort auth. Anonymous events are fine.
  let userId: string | null = null
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const auth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await auth.auth.getUser(token)
      userId = data?.user?.id ?? null
    } catch { /* ignore */ }
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  try {
    await db.from('analytics_events').insert({
      user_id: userId,
      session_id: sessionId,
      event_name: name,
      props,
      url,
      user_agent: userAgent,
    })
  } catch {
    // Swallow — analytics failure must never break the client
  }

  return NextResponse.json({ ok: true })
}
