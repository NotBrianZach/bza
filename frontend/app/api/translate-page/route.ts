import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { content, prevContent, prevTranslation, prompt } = await req.json()
  if (!content || !prompt) return NextResponse.json({ error: 'content and prompt required' }, { status: 400 })

  const contextBlock = (prevContent && prevTranslation)
    ? `\n\nFor continuity, here is how the immediately preceding passage was transformed:\n\nORIGINAL:\n${(prevContent as string).slice(0, 800)}\n\nTRANSFORMED:\n${(prevTranslation as string).slice(0, 800)}`
    : prevContent
    ? `\n\nFor context, the immediately preceding passage was:\n${(prevContent as string).slice(0, 800)}`
    : ''

  const systemPrompt = `You are a text transformation engine. The user provides a passage of text and a transformation instruction. Apply the transformation faithfully and output ONLY the transformed text — no preamble, no explanation, no meta-commentary.${contextBlock}`

  const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      max_tokens: 2048,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transformation instruction: ${prompt}\n\nText to transform:\n\n${content}` },
      ],
    }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.json().catch(() => ({}))
    return NextResponse.json({ error: (err as any)?.error?.message ?? `OpenRouter ${aiRes.status}` }, { status: 500 })
  }

  const data = await aiRes.json()
  const text = data?.choices?.[0]?.message?.content ?? ''
  if (!text) return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })

  return new NextResponse(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
