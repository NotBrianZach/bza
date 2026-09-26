/**
 * Shared helper for creating Supabase server-side clients (middleware, route handlers).
 * Centralises cookie options so they stay in sync across all server contexts.
 *
 * The cookie attributes themselves live in lib/supabaseCookieOptions.ts, which is
 * also imported by the *browser* client — both sides have to write the session on
 * the same domain scope. Route handlers should reach for this (or getRouteUser)
 * rather than calling `createServerClient` directly; an ad-hoc client constructed
 * without `cookieOptions` silently writes host-only cookies that shadow these.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import { YEAR_IN_SECONDS, supabaseCookieOptions as sharedCookieOptions } from './supabaseCookieOptions'

export { YEAR_IN_SECONDS }

export function supabaseCookieOptions(): CookieOptions {
  return sharedCookieOptions()
}

/**
 * Creates a server Supabase client that reads cookies from the incoming request
 * and writes updated cookies to the provided mutable response.
 *
 * `getResponse` is called lazily inside `setAll` so callers can swap out
 * the response object (e.g. after creating a redirect mid-handler).
 */
export function createSupabaseServerClient(
  request: NextRequest,
  getResponse: () => NextResponse,
  setResponse: (r: NextResponse) => void,
) {
  const cookieOptions = supabaseCookieOptions()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          const response = getResponse()
          setResponse(response)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, maxAge: YEAR_IN_SECONDS }),
          )
        },
      },
    },
  )
}
