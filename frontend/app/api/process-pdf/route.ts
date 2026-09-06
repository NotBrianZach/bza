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

    // Verify user via their JWT
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service-role client for storage ops and billing
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create a signed URL (10 min expiry) so Jina can fetch the PDF
    const { data: signedData, error: signErr } = await adminClient.storage
      .from('documents')
      .createSignedUrl(storagePath, 600)
    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Could not create signed URL' }, { status: 500 })
    }

    // Call Jina Reader
    const jinaHeaders: Record<string, string> = {
      'Accept': 'text/plain',
      'X-Return-Format': 'markdown',
      'X-Md-Math-Style': 'latex',
      'X-No-Cache': 'true',
    }
    if (process.env.JINA_API_KEY) jinaHeaders['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`

    const jinaRes = await fetch(`https://r.jina.ai/${signedData.signedUrl}`, { headers: jinaHeaders })
    if (!jinaRes.ok) {
      throw new Error(`Jina failed (${jinaRes.status}) — PDF may be too large or inaccessible`)
    }
    const markdown = (await jinaRes.text()).trim()
    if (markdown.length < 100) {
      throw new Error('Jina returned no content for this PDF — it may be scanned/image-only')
    }

    // Delete the uploaded PDF now that we have the markdown (fire and forget)
    adminClient.storage.from('documents').remove([storagePath]).catch(() => {})

    // Record billing usage — estimate tokens from response size
    // Jina Reader API pricing: ~$0.02 per 1M tokens (4 chars ≈ 1 token)
    const estimatedTokens = Math.ceil(markdown.length / 4)
    const baseCost = (estimatedTokens / 1_000_000) * 0.02
    adminClient.from('api_usage').insert({
      user_id: user.id,
      api_provider: 'jina',
      model: 'jina-reader',
      endpoint_type: 'document',
      request_type: 'pdf_processing',
      input_tokens: estimatedTokens,
      output_tokens: 0,
      base_cost: baseCost,
      markup_multiplier: 2.0,
      request_metadata: { storage_path: storagePath, char_count: markdown.length },
    }).then(({ error }) => { if (error) console.error('Failed to record Jina usage:', error) })

    return NextResponse.json({ markdown })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
