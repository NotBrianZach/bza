import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBrowserProvider } from '@/lib/browser/provider'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

// Hyperbeam standard-tier hourly rate. Update if it changes; markup applied by logUsage.
const HOURLY_COST_USD = 0.15

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })

  const quotaErr = await checkQuota(userId)
  if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })

  const db = getDb()
  const { startUrl } = await req.json().catch(() => ({})) as { startUrl?: string }
  const provider = getBrowserProvider()

  // If we're on the Neko path, check the tunnel is reachable before doing anything else.
  // On failure, surface a specific error the SitePanel can render nicely.
  if ((process.env.BROWSER_PROVIDER || '').toLowerCase() === 'neko') {
    const anyProv = provider as any
    if (typeof anyProv.health === 'function') {
      const h = await anyProv.health()
      if (!h.ok) {
        return NextResponse.json(
          { error: 'Cloud browser is offline. It typically comes back within a few minutes.', code: 'ZHOST_UNREACHABLE', detail: h.error },
          { status: 503 },
        )
      }
    }
  }

  // Silently reap any stale active rows for this user (leftover from crashed/abandoned sessions).
  // Best-effort end at the provider side; always mark ended in DB.
  const { data: stales } = await (db.from('browser_sessions') as any)
    .select('id, provider_session_id')
    .eq('user_id', userId).is('ended_at', null)
  if (stales && stales.length > 0) {
    for (const s of stales) {
      await provider.endSession(s.provider_session_id).catch(() => {})
      await (db.from('browser_sessions') as any)
        .update({ ended_at: new Date().toISOString(), admin_token: null })
        .eq('id', s.id)
    }
  }

  // Persistent Hyperbeam profiles (avoids MA re-login each session) require a paid
  // feature — email founders@hyperbeam.com and set HYPERBEAM_PROFILES_ENABLED=1 to
  // opt in. Without it, Hyperbeam returns err_api_restricted on create.
  let profile: any = undefined
  if (process.env.HYPERBEAM_PROFILES_ENABLED === '1') {
    const { data: prior } = await (db.from('browser_sessions') as any)
      .select('provider_session_id')
      .eq('user_id', userId).eq('provider', 'hyperbeam')
      .not('provider_session_id', 'is', null)
      .order('started_at', { ascending: false })
      .limit(1).maybeSingle()
    profile = prior?.provider_session_id
      ? { load: prior.provider_session_id, save: true }
      : true
  }
  let session
  try { session = await provider.createSession(profile !== undefined ? { startUrl, profile } : { startUrl }) }
  catch (e: any) { return NextResponse.json({ error: 'provider create failed: ' + e.message }, { status: 502 }) }

  const { data, error } = await (db.from('browser_sessions') as any).insert({
    user_id: userId,
    provider: 'hyperbeam',
    provider_session_id: session.sessionId,
    embed_url: session.embedUrl,
    admin_token: session.adminToken,
    url_last_seen: startUrl ?? null,
  }).select('id').single()

  if (error) {
    await provider.endSession(session.sessionId).catch(() => {})
    return NextResponse.json({ error: 'db insert failed' }, { status: 500 })
  }

  return NextResponse.json({
    sessionRowId: data.id,
    embedUrl: session.embedUrl,
    adminToken: session.adminToken,
    provider: (process.env.BROWSER_PROVIDER || 'hyperbeam').toLowerCase(),
  })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const db = getDb()
  const { data: row } = await (db.from('browser_sessions') as any)
    .select('provider_session_id, started_at')
    .eq('id', id).eq('user_id', userId).is('ended_at', null).single()
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const provider = getBrowserProvider()
  await provider.endSession(row.provider_session_id).catch(() => {})

  const endedAt = new Date()
  const elapsedMs = endedAt.getTime() - new Date(row.started_at).getTime()
  const costUsd = (elapsedMs / 1000 / 3600) * HOURLY_COST_USD

  await (db.from('browser_sessions') as any)
    .update({ ended_at: endedAt.toISOString(), admin_token: null })
    .eq('id', id)

  await logUsage(userId, costUsd, {
    model: 'hyperbeam-vm', endpoint: 'browser-session', provider: 'hyperbeam',
  })

  return NextResponse.json({ ended: true, elapsedSeconds: Math.round(elapsedMs / 1000), costUsd })
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { urlLastSeen?: string }

  const db = getDb()
  const { error } = await (db.from('browser_sessions') as any)
    .update({
      last_active_at: new Date().toISOString(),
      ...(body.urlLastSeen ? { url_last_seen: body.urlLastSeen } : {}),
    })
    .eq('id', id).eq('user_id', userId).is('ended_at', null)
  if (error) return NextResponse.json({ error: 'update failed' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
