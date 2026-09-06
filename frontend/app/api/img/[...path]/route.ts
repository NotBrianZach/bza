import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client — bypasses RLS to read from private storage buckets
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// In-memory cache of recently signed URLs (edge function instance reuse)
const signedUrlCache = new Map<string, { url: string; expires: number }>()
const SIGN_TTL = 3500 // slightly under 1hr

/**
 * GET /api/img/<bucket>/<path...>
 *
 * CDN-cached image proxy for Supabase Storage.
 * - Fetches from private bucket using service role
 * - Returns with aggressive Cache-Control (1 year, immutable)
 * - Cloudflare CDN caches at the edge automatically
 * - Supports page-images and books buckets
 *
 * Example: /api/img/page-images/user123/cover.png
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  if (!pathSegments || pathSegments.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const bucket = pathSegments[0]
  const filePath = pathSegments.slice(1).join('/')

  // Only allow known buckets
  if (!['page-images', 'books'].includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Auth check: require a valid session token OR a shared HMAC token
  // For now, images are semi-public (URL is unguessable due to UUID paths)
  // but we require the referer to be our domain
  const referer = req.headers.get('referer') || ''
  const origin = req.headers.get('origin') || ''
  const isOurSite = referer.includes('aireadalong.com') || referer.includes('localhost') || origin.includes('aireadalong.com') || origin.includes('localhost')

  // Allow direct browser navigation (no referer) for downloaded images
  // but block hotlinking from other sites
  if (referer && !isOurSite) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const cacheKey = `${bucket}/${filePath}`

    // Check in-memory signed URL cache
    let downloadUrl: string
    const cached = signedUrlCache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      downloadUrl = cached.url
    } else {
      // Create signed URL
      const { data, error } = await db.storage.from(bucket).createSignedUrl(filePath, 3600)
      if (error || !data?.signedUrl) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      downloadUrl = data.signedUrl
      signedUrlCache.set(cacheKey, { url: downloadUrl, expires: Date.now() + SIGN_TTL * 1000 })
    }

    // Fetch the actual image from Supabase
    const imgRes = await fetch(downloadUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: imgRes.status })
    }

    const contentType = imgRes.headers.get('content-type') || 'image/png'
    const body = await imgRes.arrayBuffer()

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
