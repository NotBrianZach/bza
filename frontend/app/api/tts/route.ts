import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'

/** Thin proxy to Cloud Run TTS endpoint — adds worker secret server-side */
export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }

  const body = await req.json()

  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET

  if (!workerUrl || !workerSecret) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 501 })
  }

  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Worker-Secret': workerSecret,
    },
    body: JSON.stringify({
      text: body.text ?? body.input ?? '',
      persona_id: body.persona_id ?? body.personaId ?? null,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return NextResponse.json({ error: err || `TTS error (${res.status})` }, { status: res.status })
  }

  const audioBuffer = await res.arrayBuffer()
  if (userId) logUsage(userId, 0.015, { model: 'tts-1', endpoint: 'tts' })
  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.byteLength),
    },
  })
}
