import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * OAuth callback — receives the code from Google/Supabase, then passes it
 * to the client-side exchange handler which has access to the PKCE verifier
 * in browser cookie storage (Cloudflare Workers cannot reliably read the
 * verifier cookie set by the browser client on mobile).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(new URL(next, origin))
  }

  const clientUrl = new URL('/auth/exchange', origin)
  clientUrl.searchParams.set('code', code)
  clientUrl.searchParams.set('next', next)
  return NextResponse.redirect(clientUrl)
}
