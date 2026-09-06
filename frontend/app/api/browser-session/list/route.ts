import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })

  const { data: sessions } = await (db().from('browser_sessions') as any)
    .select('id, title, url_last_seen, started_at, ended_at, provider')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  const ids = (sessions ?? []).map((s: any) => s.id)
  if (!ids.length) return NextResponse.json({ sessions: [] })

  const [captureCounts, bookmarkCounts] = await Promise.all([
    (db().from('browser_extractions') as any).select('session_id').in('session_id', ids),
    (db().from('browser_session_bookmarks') as any).select('session_id').in('session_id', ids),
  ])

  const capMap = new Map<string, number>()
  for (const r of (captureCounts.data ?? [])) capMap.set(r.session_id, (capMap.get(r.session_id) ?? 0) + 1)
  const bmMap = new Map<string, number>()
  for (const r of (bookmarkCounts.data ?? [])) bmMap.set(r.session_id, (bmMap.get(r.session_id) ?? 0) + 1)

  return NextResponse.json({
    sessions: (sessions ?? []).map((s: any) => ({
      ...s,
      captureCount: capMap.get(s.id) ?? 0,
      bookmarkCount: bmMap.get(s.id) ?? 0,
    })),
  })
}
