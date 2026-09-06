import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { markdown, prompt } = await req.json() as { markdown: string; prompt: string }

  if (!markdown || !prompt?.trim()) {
    return NextResponse.json({ markdown })
  }

  const systemPrompt = `You are a content editor. The user wants you to apply the following instruction to the document below. Keep all sections, headers, and the overall structure intact unless the instruction says otherwise. Return only the resulting markdown with no commentary.\n\nInstruction: ${prompt.trim()}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: markdown.slice(0, 60000) },
      ],
      max_tokens: 16000,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Transform failed', markdown }, { status: 500 })
  }

  const data = await res.json()
  const filtered = data.choices?.[0]?.message?.content ?? markdown
  return NextResponse.json({ markdown: filtered })
}
