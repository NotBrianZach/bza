import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { SPOTIFY_REDIRECT_URI, upsertTokens } from '@/lib/spotify-server'

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
  const me = await meRes.json()

  // Supabase user from the session cookie
  let response = NextResponse.redirect(back('connected'))
  response.cookies.delete('spotify_state')
  response.cookies.delete('spotify_return_to')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', origin))

  await upsertTokens(user.id, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    product: me.product ?? 'free',
    display_name: me.display_name ?? '',
  })

  return response
}
