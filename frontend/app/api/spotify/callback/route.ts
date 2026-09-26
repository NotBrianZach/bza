import { NextRequest, NextResponse } from 'next/server'
import { SPOTIFY_REDIRECT_URI, upsertTokens } from '@/lib/spotify-server'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'

/**
 * Finish the Spotify OAuth flow.
 *
 * The Supabase user is resolved through `createSupabaseServerClient` rather than
 * an ad-hoc `createServerClient`. That matters: a client built without
 * `cookieOptions` writes host-only session cookies that shadow the
 * `.aireadalong.com` ones the middleware maintains, and this route is where the
 * resulting stale-token read became visible — `getUser()` returned null and the
 * user landed on /auth/login instead of connecting. See lib/supabaseCookieOptions.ts.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const origin = new URL(req.url).origin

  const storedState = req.cookies.get('spotify_state')?.value
  const storedReturn = req.cookies.get('spotify_return_to')?.value
  const returnTo = storedReturn && storedReturn.startsWith('/') && !storedReturn.startsWith('//')
    ? storedReturn
    : '/settings'
  const back = (status: string) =>
    new URL(`${returnTo}${returnTo.includes('?') ? '&' : '?'}spotify=${status}`, origin)

  if (error || !code || state !== storedState) {
    return NextResponse.redirect(back('error'))
  }

  let response = NextResponse.redirect(back('connected'))
  response.cookies.delete('spotify_state')
  response.cookies.delete('spotify_return_to')

  // Resolve the Supabase user *before* spending the authorization code: the code
  // is single-use, so exchanging it and only then discovering there is no session
  // would force the user through the whole Spotify consent flow again.
  const supabase = createSupabaseServerClient(
    req,
    () => response,
    (r) => { response = r },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Keep the destination so logging in resumes where they were, instead of
    // dropping them on a bare login page with no explanation.
    const login = new URL('/auth/login', origin)
    login.searchParams.set('next', returnTo)
    login.searchParams.set('reason', 'spotify-session')
    return NextResponse.redirect(login)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  })
  if (!tokenRes.ok) {
    return NextResponse.redirect(back('error'))
  }
  const tokens = await tokenRes.json()

  // Spotify user info — `product` decides whether in-browser playback is possible
  const meRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const me = meRes.ok ? await meRes.json() : {}

  // upsertTokens throws when the write fails. Without that the route would
  // redirect with ?spotify=connected while nothing had been persisted, and the
  // page would render the "Connect Spotify" button again with no error shown.
  try {
    await upsertTokens(user.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      product: me.product ?? 'free',
      display_name: me.display_name ?? '',
    })
  } catch (e) {
    console.error('[spotify/callback] failed to persist tokens:', e)
    return NextResponse.redirect(back('error'))
  }

  return response
}
