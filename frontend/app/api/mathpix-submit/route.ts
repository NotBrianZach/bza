import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const { storagePath, authToken } = await req.json()
    if (!storagePath || !authToken) {
      return NextResponse.json({ error: 'storagePath and authToken required' }, { status: 400 })
    }

    const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID
    const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY
    if (!MATHPIX_APP_ID || !MATHPIX_APP_KEY) {
      return NextResponse.json({ error: 'Mathpix not configured' }, { status: 503 })
    }

    // Verify user
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Pro tier
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: quotaRows } = await adminClient.rpc('get_user_quota', { user_uuid: user.id })
    const tier = quotaRows?.[0]?.tier ?? 'free'
    if (tier === 'free') {
      return NextResponse.json({ error: 'Mathpix OCR requires a Pro account' }, { status: 403 })
    }

    // Download PDF from storage
    const { data: fileData, error: dlErr } = await adminClient.storage
      .from('documents')
      .download(storagePath)
    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Could not retrieve PDF from storage' }, { status: 500 })
    }

    // Submit to Mathpix
    const formData = new FormData()
    formData.append('file', fileData, 'document.pdf')
    formData.append('options_json', JSON.stringify({
      math_inline_delimiters: ['$', '$'],
      math_display_delimiters: ['$$', '$$'],
      idiomatic_eqn_arrays: true,
      rm_spaces: true,
    }))

    const mpRes = await fetch('https://api.mathpix.com/v3/pdf', {
      method: 'POST',
      headers: { app_id: MATHPIX_APP_ID, app_key: MATHPIX_APP_KEY },
      body: formData,
    })
    const mpData = await mpRes.json() as { pdf_id?: string; error?: string }
    if (!mpData.pdf_id) {
      throw new Error(`Mathpix submission failed: ${mpData.error ?? 'unknown error'}`)
    }

    return NextResponse.json({ mathpixPdfId: mpData.pdf_id, storagePath, userId: user.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
