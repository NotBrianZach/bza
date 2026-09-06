import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { data } = await (db().from('browser_sessions') as any)
    .select('id, title, description, url_last_seen, started_at, ended_at, provider, chat_system_prompt, capture_prompt, capture_mode')
    .eq('id', params.id).eq('user_id', userId).maybeSingle()
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { title?: string; description?: string; chatSystemPrompt?: string | null; capturePrompt?: string | null; captureMode?: string | null }
  const patch: any = {}
  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200)
  if (typeof body.description === 'string') patch.description = body.description.slice(0, 2000)
  if (body.chatSystemPrompt === null) patch.chat_system_prompt = null
  else if (typeof body.chatSystemPrompt === 'string') patch.chat_system_prompt = body.chatSystemPrompt.slice(0, 10000)
  if (body.capturePrompt === null) patch.capture_prompt = null
  else if (typeof body.capturePrompt === 'string') patch.capture_prompt = body.capturePrompt.slice(0, 10000)
  if (body.captureMode === null) patch.capture_mode = null
  else if (typeof body.captureMode === 'string' && ['problem','text','diagram'].includes(body.captureMode)) patch.capture_mode = body.captureMode
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
  const { error } = await (db().from('browser_sessions') as any)
    .update(patch).eq('id', params.id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
