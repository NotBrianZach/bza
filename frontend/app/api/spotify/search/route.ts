import { NextRequest, NextResponse } from 'next/server'
import { SpotifyError, mapPlaylist, mapTrack, spotifyFetch } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

/**
 * Search Spotify on the user's behalf.
 *
 * `?type=track` (default) is what Listen Along uses to pick a move — a move has
 * to be a real, specific song, and nothing currently asks for anything else.
 * `?type=playlist` has no caller yet; it is here for the one case where a
 * playlist is the natural artifact rather than a move (a mode that assembles a
 * soundtrack for a place). Delete it if that mode never happens.
 *
 * Goes through spotifyFetch so the 401-refresh-retry and the user's `product`
 * come along for free.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')
  const type = url.searchParams.get('type') === 'playlist' ? 'playlist' : 'track'
  const limit = Math.min(Number(url.searchParams.get('limit')) || 12, 50)

  if (!q?.trim()) return NextResponse.json(type === 'playlist' ? { playlists: [] } : { tracks: [] })

  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { data, product } = await spotifyFetch(
      userId,
      `/search?q=${encodeURIComponent(q.trim())}&type=${type}&limit=${limit}`,
    )
    const isPremium = product === 'premium'

    if (type === 'playlist') {
      const playlists = (data?.playlists?.items ?? []).filter(Boolean).map(mapPlaylist)
      return NextResponse.json({ playlists, isPremium })
    }
    const tracks = (data?.tracks?.items ?? []).filter(Boolean).map(mapTrack)
    return NextResponse.json({ tracks, isPremium })
  } catch (e) {
    if (e instanceof SpotifyError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}
