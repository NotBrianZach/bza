import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'

const SUPABASE_PROJECT_REF = 'xqttukoykhbiueskfvad'
const AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`

/**
 * Detect a broken/partial Supabase session cookie — one that parsed as JSON
 * but is missing access_token (e.g. from a failed PKCE exchange that stored
 * only token_type/expires_in/expires_at). Such cookies cause the Cloudflare
 * Worker SSR to crash on auth initialization, returning an empty response body.
 */
function isBrokenSessionCookie(value: string): boolean {
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('base64-')) return false // valid base64url session
    const parsed = JSON.parse(decoded)
    return typeof parsed === 'object' && parsed !== null && !parsed.access_token
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Clear any broken Supabase session cookies that would crash SSR.
  const authCookieValue = request.cookies.get(AUTH_COOKIE)?.value
  if (authCookieValue && isBrokenSessionCookie(authCookieValue)) {
    const response = NextResponse.next()
    const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production'
    const cookieOpts = isProd
      ? { maxAge: 0, path: '/', domain: '.aireadalong.com' }
      : { maxAge: 0, path: '/' }
    response.cookies.set(AUTH_COOKIE, '', cookieOpts)
    // Also clear chunks in case any are present
    for (let i = 0; i < 5; i++) {
      response.cookies.set(`${AUTH_COOKIE}.${i}`, '', cookieOpts)
    }
    return response
  }

  // Skip session refresh for auth flow routes — getUser() can trigger
  // _removeSession() which clears the PKCE code verifier cookie before
  // the exchange page has a chance to use it.
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/auth/exchange') || pathname.startsWith('/auth/clear')) {
    return NextResponse.next({ request })
  }

  // Refresh the Supabase session on every request so cookies stay valid
  // across tabs and after token expiry. This is the key piece that makes
  // "open a new tab → still logged in" work.
  let response = NextResponse.next({ request })
  const supabase = createSupabaseServerClient(
    request,
    () => response,
    (r) => { response = r },
  )
  await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/pricing',
    '/features',
    '/privacy',
    '/terms',
    // Allow dashboard for free tier (localStorage-based)
    '/dashboard',
    '/books', // Allow book reading for free tier
  ]

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return response
  }

  // For protected routes (billing, account settings, etc.), check authentication
  const protectedRoutes = ['/billing', '/account', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
