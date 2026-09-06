import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { data } = await (db().from('browser_session_bookmarks') as any)
    .select('id, url, title, note, created_at').eq('session_id', params.id).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(200)
  return NextResponse.json({ bookmarks: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { url, title, note } = await req.json().catch(() => ({})) as { url: string; title?: string; note?: string }
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  // Verify session belongs to user
  const { data: sess } = await (db().from('browser_sessions') as any)
    .select('id').eq('id', params.id).eq('user_id', userId).maybeSingle()
  if (!sess) return NextResponse.json({ error: 'session not found' }, { status: 404 })
  const { data, error } = await (db().from('browser_session_bookmarks') as any)
    .insert({ session_id: params.id, user_id: userId, url, title: title?.slice(0, 200) ?? null, note: note?.slice(0, 2000) ?? null })
    .select('id').single()
  if (error) return NextResponse.json({ error: 'insert failed' }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const bookmarkId = new URL(req.url).searchParams.get('bookmark')
  if (!bookmarkId) return NextResponse.json({ error: 'bookmark id required' }, { status: 400 })
  await (db().from('browser_session_bookmarks') as any).delete()
    .eq('id', bookmarkId).eq('session_id', params.id).eq('user_id', userId)
  return NextResponse.json({ ok: true })
}
