import { NextRequest, NextResponse } from 'next/server'

// This route is kept for backwards compatibility but no longer used by the
// frontend — pdfToMarkdown.ts now calls the pdf-to-text Supabase edge function
// directly. This route proxies to that function so any direct calls still work.

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL not configured' }, { status: 500 })
  }

  const edgeFnUrl = `${supabaseUrl}/functions/v1/pdf-to-text`

  const formData = await request.formData()
  const authHeader = request.headers.get('Authorization') ?? ''

  const res = await fetch(edgeFnUrl, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData,
  })

  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}
