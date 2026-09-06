import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { data } = await (db().from('browser_session_chats') as any)
    .select('id, role, content, model, created_at')
    .eq('session_id', params.id).eq('user_id', userId)
    .order('created_at', { ascending: true }).limit(200)
  return NextResponse.json({ chats: data ?? [] })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const quotaErr = await checkQuota(userId)
  if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })

  const { content, model: reqModel } = await req.json().catch(() => ({})) as { content?: string; model?: string }
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const sup = db()
  // Session must belong to user
  const { data: sess } = await (sup.from('browser_sessions') as any)
    .select('id, url_last_seen, title, chat_system_prompt').eq('id', params.id).eq('user_id', userId).maybeSingle()
  if (!sess) return NextResponse.json({ error: 'session not found' }, { status: 404 })

  // Recent chat history for context (last 20)
  const { data: history } = await (sup.from('browser_session_chats') as any)
    .select('role, content').eq('session_id', params.id).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(20)
  const priorMsgs = (history ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content }))

  // Latest captures for context (last 5)
  const { data: caps } = await (sup.from('browser_extractions') as any)
    .select('extracted, created_at').eq('session_id', params.id).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(5)
  const capturesContext = (caps ?? [])
    .map((c: any) => c.extracted?.problems?.[0]?.text)
    .filter(Boolean)
    .slice(0, 3)
    .join('\n\n---\n\n')

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY! : (process.env.OPENAI_API_KEY ?? '')
  const modelId = reqModel || (useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini')

  const defaultPrompt = `You are a helpful assistant helping the user with a live cloud browser session${sess.url_last_seen ? ' at ' + sess.url_last_seen : ''}. Be concise. Use markdown + LaTeX for math (\$inline\$ / \$\$display\$\$).`
  const basePrompt = (sess.chat_system_prompt && sess.chat_system_prompt.trim()) || defaultPrompt
  const systemPrompt = basePrompt + (capturesContext ? '\n\nRecent captures from this session:\n' + capturesContext : '')

  const messages = [
    { role: 'system', content: systemPrompt },
    ...priorMsgs,
    { role: 'user', content: content.trim() },
  ]

  const lres = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      ...(useOpenRouter ? { 'HTTP-Referer': 'https://aireadalong.com', 'X-Title': 'AI Read Along' } : {}),
    },
    body: JSON.stringify({ model: modelId, messages, max_tokens: 800 }),
  })
  if (!lres.ok) {
    const text = await lres.text().catch(() => '')
    return NextResponse.json({ error: 'llm error ' + lres.status + ': ' + text.slice(0, 200) }, { status: 502 })
  }
  const ldata = await lres.json()
  const reply = (ldata.choices?.[0]?.message?.content ?? '').trim()

  const now = new Date().toISOString()
  // Save user + assistant messages
  await (sup.from('browser_session_chats') as any).insert([
    { session_id: params.id, user_id: userId, role: 'user', content: content.trim(), created_at: now },
    { session_id: params.id, user_id: userId, role: 'assistant', content: reply, model: modelId, base_cost: 0.002, created_at: now },
  ])
  await logUsage(userId, 0.002, { model: modelId, endpoint: 'browser-session-chat' })

  return NextResponse.json({ reply, model: modelId })
}
