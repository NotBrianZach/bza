import { NextRequest, NextResponse } from 'next/server'
import type { ScoreBar } from '@/types'

const MAX_BARS = 5
const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o']

export async function POST(req: NextRequest) {
  try {
    const { bookId, content, bars, model = 'gpt-4o-mini' } = await req.json()

    if (!bookId || !content || !Array.isArray(bars)) {
      return NextResponse.json({ error: 'bookId, content, and bars required' }, { status: 400 })
    }

    const safeModel = ALLOWED_MODELS.includes(model) ? model : 'gpt-4o-mini'
    const enabledBars = (bars as ScoreBar[])
      .filter(b => b.enabled && b.label?.trim() && b.prompt?.trim())
      .slice(0, MAX_BARS)

    if (!enabledBars.length) return NextResponse.json({ scores: {} })

    const excerpt = String(content).slice(0, 3000)
    const scores: Record<string, number> = {}

    // Score bars in parallel — each is a tiny max_tokens=5 call
    await Promise.all(enabledBars.map(async bar => {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: safeModel,
            messages: [
              {
                role: 'system',
                content: 'You are a content analysis assistant. Respond with ONLY a single integer from 0 to 100. No explanation, no punctuation, just the number.',
              },
              {
                role: 'user',
                content: `${bar.prompt.trim()}\n\nText:\n${excerpt}`,
              },
            ],
            max_tokens: 5,
            temperature: 0,
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        const raw = (data.choices?.[0]?.message?.content ?? '').trim()
        const num = parseInt(raw, 10)
        if (!isNaN(num) && num >= 0 && num <= 100) scores[bar.label] = num
      } catch { /* skip this bar */ }
    }))

    // Persist to DB using service role key
    if (Object.keys(scores).length) {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/books?id=eq.${encodeURIComponent(bookId)}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ scores }),
        }
      )
    }

    return NextResponse.json({ scores })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to score' }, { status: 500 })
  }
}
