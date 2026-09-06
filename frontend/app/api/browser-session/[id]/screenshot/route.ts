import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/**
 * POST /api/browser-session/[id]/screenshot
 * Server-side screenshot proxy for Neko sessions. Fetches PNG from neko-manager,
 * returns as base64. (Client can't reach neko-manager directly because bearer token
 * would be exposed.)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const quotaErr = await checkQuota(userId)
  if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })

  // Verify session belongs to user + get provider_session_id
  const { data: sess } = await (db().from('browser_sessions') as any)
    .select('provider, provider_session_id').eq('id', params.id).eq('user_id', userId).maybeSingle()
  if (!sess) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (sess.provider !== 'neko') {
    return NextResponse.json({ error: 'screenshot API only supports Neko sessions (Hyperbeam uses client-side capture)' }, { status: 400 })
  }

  const mgrUrl = process.env.NEKO_MGR_URL
  const mgrToken = process.env.NEKO_MGR_TOKEN
  if (!mgrUrl || !mgrToken) {
    return NextResponse.json({ error: 'neko-manager not configured' }, { status: 501 })
  }

  const res = await fetch(`${mgrUrl}/session/${encodeURIComponent(sess.provider_session_id)}/screenshot`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + mgrToken },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.json({ error: 'neko screenshot failed: ' + res.status, detail: text.slice(0, 200) }, { status: 502 })
  }
  const buf = Buffer.from(await res.arrayBuffer())
  return NextResponse.json({ imageBase64: 'data:image/png;base64,' + buf.toString('base64') })
}
