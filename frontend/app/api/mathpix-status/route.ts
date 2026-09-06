import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mathpixPdfId = searchParams.get('pdfId')
    const storagePath = searchParams.get('storagePath')
    const userId = searchParams.get('userId')

    if (!mathpixPdfId) {
      return NextResponse.json({ error: 'pdfId required' }, { status: 400 })
    }

    const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID
    const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY
    if (!MATHPIX_APP_ID || !MATHPIX_APP_KEY) {
      return NextResponse.json({ error: 'Mathpix not configured' }, { status: 503 })
    }

    // Check conversion status
    const statusRes = await fetch(`https://api.mathpix.com/v3/pdf/${mathpixPdfId}`, {
      headers: { app_id: MATHPIX_APP_ID, app_key: MATHPIX_APP_KEY },
    })
    const statusData = await statusRes.json() as {
      status?: string
      num_pages?: number
      num_pages_completed?: number
      error?: string
    }

    if (statusData.error) {
      throw new Error(`Mathpix error: ${statusData.error}`)
    }

    const status = statusData.status ?? 'loading'
    const pagesTotal = statusData.num_pages ?? 0
    const pagesDone = statusData.num_pages_completed ?? 0
    const progressPct = pagesTotal > 0 ? Math.round((pagesDone / pagesTotal) * 100) : 0

    if (status !== 'completed') {
      return NextResponse.json({ status, progressPct, pagesTotal, pagesDone })
    }

    // Fetch the .mmd markdown output
    const mmdRes = await fetch(`https://api.mathpix.com/v3/pdf/${mathpixPdfId}.mmd`, {
      headers: { app_id: MATHPIX_APP_ID, app_key: MATHPIX_APP_KEY },
    })
    if (!mmdRes.ok) {
      throw new Error(`Failed to fetch Mathpix result (${mmdRes.status})`)
    }
    const markdown = await mmdRes.text()
    if (markdown.length < 100) {
      throw new Error('Mathpix returned no content for this PDF')
    }

    // Clean up uploaded PDF + record billing (fire and forget)
    if (storagePath || userId) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      if (storagePath) {
        adminClient.storage.from('documents').remove([storagePath]).catch(() => {})
      }
      if (userId) {
        // Mathpix pricing: ~$0.004 per page
        const baseCost = pagesTotal * 0.004
        adminClient.from('api_usage').insert({
          user_id: userId,
          api_provider: 'mathpix',
          model: 'mathpix-pdf',
          endpoint_type: 'document',
          request_type: 'pdf_processing',
          input_tokens: pagesTotal,  // pages, not tokens
          output_tokens: 0,
          base_cost: baseCost,
          markup_multiplier: 2.0,
          request_metadata: { mathpix_pdf_id: mathpixPdfId, num_pages: pagesTotal },
        }).then(({ error }) => { if (error) console.error('Failed to record Mathpix usage:', error) })
      }
    }

    return NextResponse.json({ status: 'completed', markdown, pagesTotal })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
