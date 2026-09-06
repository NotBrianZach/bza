import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

function db() {
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

  const body = await req.json() as {
    sessionId?: string
    imageBase64: string
    mode?: 'problem' | 'text' | 'diagram'
    region?: { x: number; y: number; w: number; h: number }
    customPrompt?: string
  }
  const { sessionId, imageBase64, region } = body
  if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })

  // Merge session config (per-session custom prompt/mode) with per-request overrides.
  let mode: 'problem' | 'text' | 'diagram' = body.mode ?? 'problem'
  let customPrompt: string | null = body.customPrompt ?? null
  if (sessionId) {
    try {
      const { data: s } = await (db().from('browser_sessions') as any)
        .select('capture_mode, capture_prompt').eq('id', sessionId).eq('user_id', userId).maybeSingle()
      if (s) {
        if (!body.mode && s.capture_mode) mode = s.capture_mode
        if (!body.customPrompt && s.capture_prompt) customPrompt = s.capture_prompt
      }
    } catch {}
  }

  const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

  let extracted: { problems: { title: string; text: string }[] } | null = null
  let modelUsed = ''
  let costUsd = 0

  if (mode === 'problem' && process.env.MATHPIX_APP_ID && process.env.MATHPIX_APP_KEY) {
    try {
      const mpRes = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': process.env.MATHPIX_APP_ID,
          'app_key': process.env.MATHPIX_APP_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: 'data:image/png;base64,' + b64,
          formats: ['text'],
          math_inline_delimiters: ['$', '$'],
          math_display_delimiters: ['$$', '$$'],
        }),
      })
      if (mpRes.ok) {
        const mpData = await mpRes.json() as { text?: string }
        const text = (mpData.text ?? '').trim()
        if (text) {
          extracted = { problems: [{ title: 'Captured', text }] }
          modelUsed = 'mathpix'
          costUsd = 0.004
        }
      }
    } catch {}
  }

  if (!extracted) {
    const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (process.env.OPENAI_API_KEY ?? ''),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: customPrompt || (
                mode === 'problem'
                ? 'Extract the math/science problem(s) visible in this image. Preserve LaTeX exactly, wrapping inline math in $...$ and display math in $$...$$. Return ONLY the extracted problem text — no commentary, no preamble.'
                : mode === 'diagram'
                ? 'Describe the diagram in this image in enough detail that someone could recreate it. Include labels, arrows, coordinates, and any equations shown.'
                : 'Extract all visible text from this image, preserving structure. Return only the text.'
              ),
            },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,' + b64 } },
          ],
        }],
        max_tokens: 1500,
      }),
    })
    if (!visionRes.ok) return NextResponse.json({ error: 'vision extract failed' }, { status: 502 })
    const visionData = await visionRes.json()
    const text = (visionData.choices?.[0]?.message?.content ?? '').trim()
    extracted = { problems: [{ title: 'Captured', text }] }
    modelUsed = 'gpt-4o-mini'
    costUsd = 0.005
  }

  await logUsage(userId, costUsd, {
    model: modelUsed,
    endpoint: 'site-extract',
    provider: modelUsed === 'mathpix' ? 'mathpix' : undefined,
  })

  if (sessionId) {
    try {
      const { data: sess } = await (db().from('browser_sessions') as any)
        .select('id').eq('id', sessionId).eq('user_id', userId).single()
      if (sess) {
        await (db().from('browser_extractions') as any).insert({
          session_id: sessionId,
          user_id: userId,
          region: region ?? null,
          mode,
          extracted,
          model: modelUsed,
          base_cost: costUsd,
        })
      }
    } catch {}
  }

  return NextResponse.json(extracted)
}
