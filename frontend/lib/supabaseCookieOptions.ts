/**
 * Supabase auth-cookie options, shared by the browser client and every server
 * client (middleware + route handlers).
 *
 * This module exists because the two sides MUST agree on `domain`. They used to
 * disagree: `createBrowserClient` was constructed with no options, so it wrote
 * host-only cookies (`aireadalong.com`, or `www.aireadalong.com` for visitors
 * who landed on www), while the server wrote them on the shared `.aireadalong.com`
 * parent domain. A cookie's identity is (name, domain, path), so those are two
 * *different* cookies with the same name, and the browser sends both. Each side
 * then refreshed "its own" copy, rotating the refresh token out from under the
 * other, and `getUser()` would intermittently read the stale one and return null.
 *
 * The Spotify OAuth callback is where that surfaced as a user-visible bug: it is
 * the one route that hard-redirects to /auth/login when `getUser()` comes back
 * empty, so a connect attempt ended on the login page.
 *
 * Keep this file free of `next/server` and other server-only imports — it is
 * pulled into the browser bundle via lib/supabase.ts.
 */

export const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

/** The Supabase project ref, and the auth cookie name derived from it. */
export const SUPABASE_PROJECT_REF = 'xqttukoykhbiueskfvad'
export const AUTH_COOKIE = `sb-${SUPABASE_PROJECT_REF}-auth-token`

/**
 * The parent domain shared by the apex and `www` hosts. Both serve the app, so
 * the session has to be readable from either — that is why this is a shared
 * domain rather than host-only.
 */
export const COOKIE_DOMAIN = '.aireadalong.com'

export function isProdEnv(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'production'
}

/**
 * Cookie attributes for the Supabase session. `domain` is only set in
 * production — on localhost a dotted domain would be rejected outright.
 */
export function supabaseCookieOptions() {
  return {
    maxAge: YEAR_IN_SECONDS,
    sameSite: 'lax' as const,
    path: '/',
    ...(isProdEnv() ? { domain: COOKIE_DOMAIN } : {}),
  }
}
