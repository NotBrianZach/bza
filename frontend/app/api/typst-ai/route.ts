import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a Typst markup expert. Convert plain English descriptions into valid Typst snippets.

Key Typst syntax:
- Display math: $ expression $ (spaces inside the dollar signs)
- Inline math: $expression$ (no spaces)
- Headings: = H1, == H2, === H3
- Bold: *text*, Italic: _text_
- Bullet list: - item
- Numbered list: + item
- Fraction: $a/b$
- Summation: $ sum_(i=0)^n i $
- Integral: $ integral_a^b f(x) dif x $
- Matrix: $ mat(1, 0; 0, 1) $
- Limit: $ lim_(x -> 0) sin(x)/x = 1 $
- Implies: $ A => B $

Return ONLY valid Typst code — no markdown fences, no explanation. Make it self-contained and ready to render.`

export async function POST(req: NextRequest) {
  const { prompt, pageContext, customSystemPrompt } = await req.json() as { prompt: string; pageContext?: string; customSystemPrompt?: string }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 })
  }

  const userMessage = pageContext?.trim()
    ? `Page context:\n${pageContext.slice(0, 1500)}\n\nCreate: ${prompt}`
    : prompt

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: customSystemPrompt ? `${SYSTEM_PROMPT}\n\nAdditional style: ${customSystemPrompt}` : SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1500,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }

  const data = await res.json()
  let typst = data.choices?.[0]?.message?.content?.trim() ?? ''

  // Strip markdown fences the model might have added
  typst = typst.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim()

  return NextResponse.json({ typst })
}
