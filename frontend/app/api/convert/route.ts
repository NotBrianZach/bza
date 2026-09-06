import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken, checkQuota } from '@/lib/apiQuota'

/**
 * Book conversion — proxies to Cloud Run background job.
 * POST: start conversion → returns { jobId }
 * GET: poll status → returns { status, progress, total, result, error }
 */
export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (userId) {
    const quotaErr = await checkQuota(userId)
    if (quotaErr) return NextResponse.json({ error: quotaErr }, { status: 429 })
  }

  const body = await req.json()
  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET
  if (!workerUrl || !workerSecret) return NextResponse.json({ error: 'Not configured' }, { status: 501 })

  // Forward to Cloud Run — starts background job
  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Worker-Secret': workerSecret },
    body: JSON.stringify({ ...body, user_id: userId ?? body.userId }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    return NextResponse.json({ error: err || `Worker error (${res.status})` }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const workerUrl = process.env.WORKER_URL
  const workerSecret = process.env.WORKER_SECRET
  if (!workerUrl || !workerSecret) return NextResponse.json({ error: 'Not configured' }, { status: 501 })

  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/convert/status/${jobId}`, {
    headers: { 'X-Worker-Secret': workerSecret },
  })

  if (!res.ok) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return NextResponse.json(await res.json())
}
