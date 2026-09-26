import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'
import { AUTH_COOKIE, COOKIE_DOMAIN, isProdEnv } from '@/lib/supabaseCookieOptions'

/** Session cookie chunk suffixes @supabase/ssr may split a large token across. */
const MAX_COOKIE_CHUNKS = 5

/** `sb-<ref>-auth-token` plus every chunk name it can be split into. */
function authCookieNames(): string[] {
  const names = [AUTH_COOKIE]
  for (let i = 0; i < MAX_COOKIE_CHUNKS; i++) names.push(`${AUTH_COOKIE}.${i}`)
  return names
}

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

/**
 * Names of auth cookies that arrived more than once in the raw Cookie header.
 *
 * A duplicate name means the same cookie exists at two different domain scopes —
 * host-only (`aireadalong.com` / `www.aireadalong.com`) *and* the shared
 * `.aireadalong.com`. That used to happen constantly, because the browser client
 * wrote host-only cookies while the server wrote domain-scoped ones; each side
 * refreshed its own copy and rotated the other's refresh token into invalidity.
 * `getUser()` then returned null whenever it happened to read the stale copy.
 *
 * `request.cookies.getAll()` is keyed by name and collapses duplicates, so the
 * raw header is the only place this is visible.
 */
function duplicatedAuthCookies(request: NextRequest): string[] {
  const raw = request.headers.get('cookie')
  if (!raw) return []

  const counts = new Map<string, number>()
  for (const pair of raw.split(';')) {
    const name = pair.slice(0, pair.indexOf('=')).trim()
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  return authCookieNames().filter(name => (counts.get(name) ?? 0) > 1)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProd = isProdEnv()

  // Drop leftover host-only duplicates from before the browser and server agreed
  // on a cookie domain. Omitting `domain` scopes the deletion to the host-only
  // cookie, so the `.aireadalong.com` copy the server maintains survives.
  //
  // Return immediately rather than also refreshing the session on this response:
  // the point is to let the browser apply the deletions so the *next* request
  // carries exactly one copy of each cookie.
  if (isProd) {
    const duplicates = duplicatedAuthCookies(request)
    if (duplicates.length > 0) {
      const response = NextResponse.next({ request })
      for (const name of duplicates) {
        response.cookies.set(name, '', { maxAge: 0, path: '/' })
      }
      return response
    }
  }

  // Clear any broken Supabase session cookies that would crash SSR.
  const authCookieValue = request.cookies.get(AUTH_COOKIE)?.value
  if (authCookieValue && isBrokenSessionCookie(authCookieValue)) {
    const response = NextResponse.next()
    const cookieOpts = isProd
      ? { maxAge: 0, path: '/', domain: COOKIE_DOMAIN }
      : { maxAge: 0, path: '/' }
    for (const name of authCookieNames()) {
      response.cookies.set(name, '', cookieOpts)
      // Also clear any host-only twin, which predates the shared cookie domain.
      if (isProd) response.cookies.set(name, '', { maxAge: 0, path: '/' })
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
    '/listen', // AI Listen Along — playable on an anonymous session
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
