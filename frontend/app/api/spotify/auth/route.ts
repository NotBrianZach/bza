import { NextRequest, NextResponse } from 'next/server'
import { SPOTIFY_REDIRECT_URI, SPOTIFY_SCOPES } from '@/lib/spotify-server'

/**
 * Start the Spotify OAuth flow.
 *
 * `?returnTo=` is remembered in a cookie so the callback can send the user back
 * to wherever they were — /listen for a music game, /settings otherwise. Only
 * same-site paths are accepted.
 */
export async function GET(req: NextRequest) {
  const requested = new URL(req.url).searchParams.get('returnTo')
  const returnTo = requested && requested.startsWith('/') && !requested.startsWith('//')
    ? requested
    : '/settings'

  const state = crypto.randomUUID()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SPOTIFY_SCOPES,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
  })
  const res = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`)
  const cookieOpts = { httpOnly: true, maxAge: 600, sameSite: 'lax' as const, path: '/' }
  res.cookies.set('spotify_state', state, cookieOpts)
  res.cookies.set('spotify_return_to', returnTo, cookieOpts)
  return res
}
