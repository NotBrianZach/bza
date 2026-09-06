/**
 * Shared helper for creating Supabase server-side clients (middleware, route handlers).
 * Centralises cookie options so they stay in sync across all server contexts.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export function supabaseCookieOptions(): CookieOptions {
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production'
  return {
    maxAge: YEAR_IN_SECONDS,
    sameSite: 'lax',
    path: '/',
    ...(isProd ? { domain: '.aireadalong.com' } : {}),
  }
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
