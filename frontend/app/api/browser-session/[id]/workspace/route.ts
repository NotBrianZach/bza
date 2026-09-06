import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { data } = await (db().from('browser_sessions') as any)
    .select('workspace_text').eq('id', params.id).eq('user_id', userId).maybeSingle()
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ workspaceText: data.workspace_text ?? '' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { workspaceText } = await req.json().catch(() => ({})) as { workspaceText?: string }
  if (typeof workspaceText !== 'string') return NextResponse.json({ error: 'workspaceText required' }, { status: 400 })
  const { error } = await (db().from('browser_sessions') as any)
    .update({ workspace_text: workspaceText.slice(0, 200_000) })
    .eq('id', params.id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'update failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST /workspace/translate — convert prose to well-formatted LaTeX-in-markdown
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const quotaErr = await checkQuota(userId)
  if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })

  const { text } = await req.json().catch(() => ({})) as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter ? process.env.OPENROUTER_API_KEY! : (process.env.OPENAI_API_KEY ?? '')
  const modelId = useOpenRouter ? 'anthropic/claude-haiku-4-5' : 'gpt-4o-mini'

  const system = `You are a LaTeX transcription assistant. Rewrite the user's text so that ALL mathematical expressions are proper LaTeX wrapped in dollar signs.

Rules:
- Inline math in \$...\$, display math in \$\$...\$\$ on its own line
- Preserve all non-math prose verbatim — don't add commentary, don't summarize
- Convert plain-English math ('integral of x squared from 0 to 1') to LaTeX (\$\\int_0^1 x^2 \\, dx\$)
- Use standard LaTeX (\\frac, \\sum, \\int, \\sqrt, \\alpha, \\vec, etc.)
- Keep line breaks and paragraph structure
- Return ONLY the rewritten text — no code fences, no preamble`

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      ...(useOpenRouter ? { 'HTTP-Referer': 'https://aireadalong.com', 'X-Title': 'AI Read Along' } : {}),
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'system', content: system }, { role: 'user', content: text }],
      max_tokens: 2000,
      temperature: 0,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    return NextResponse.json({ error: 'llm error ' + res.status, detail: t.slice(0, 200) }, { status: 502 })
  }
  const data = await res.json()
  let out = (data.choices?.[0]?.message?.content ?? '').trim()
  out = out.replace(/^\`\`\`[\w]*\n?/, '').replace(/\n?\`\`\`$/, '').trim()

  await logUsage(userId, 0.003, { model: modelId, endpoint: 'workspace-translate' })
  return NextResponse.json({ text: out, model: modelId })
}
