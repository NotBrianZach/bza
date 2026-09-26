import { NextRequest, NextResponse } from 'next/server'
import { SpotifyError, getValidToken, spotifyFetch } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

/**
 * Start playback on a device. Premium only — that is Spotify's rule, not ours;
 * free accounts fall back to the embed player in the UI.
 *
 * POST body: { uris: string[], deviceId?: string }
 */
export async function POST(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const token = await getValidToken(userId)
  if (!token) return NextResponse.json({ error: 'Spotify not connected' }, { status: 403 })
  if (token.product !== 'premium') {
    return NextResponse.json({ error: 'Spotify Premium required' }, { status: 403 })
  }

  const { uris, deviceId } = await req.json() as {
    uris?: string[]
    deviceId?: string
  }
  if (!uris?.length) {
    return NextResponse.json({ error: 'uris is required' }, { status: 400 })
  }

  try {
    await spotifyFetch(userId, `/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify({ uris }),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof SpotifyError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
