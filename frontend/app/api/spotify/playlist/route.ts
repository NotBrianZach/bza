import { NextRequest, NextResponse } from 'next/server'
import { SpotifyError, createPlaylist } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

/** A playlist Spotify will accept: real track URIs, in order, no duplicates. */
const TRACK_URI = /^spotify:track:[A-Za-z0-9]+$/

/**
 * Export a run of tracks to a real Spotify playlist.
 *
 * Deliberately not premium-gated. This is the only way a free account gets
 * continuous playback — the Web Playback SDK needs Premium and Spotify no longer
 * exposes preview clips to this app, but a real playlist plays straight through
 * in Spotify's own client on any tier.
 *
 * POST body: { name, description?, uris: string[] }
 */
export async function POST(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    name?: string
    description?: string
    uris?: unknown
  } | null

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  // Validate the shape here rather than letting Spotify reject the whole batch:
  // one malformed uri would otherwise lose the entire playlist after it had
  // already been created, leaving an empty one behind in the account.
  const raw = Array.isArray(body?.uris) ? body!.uris : []
  const seen = new Set<string>()
  const uris = raw
    .filter((u): u is string => typeof u === 'string' && TRACK_URI.test(u))
    .filter(u => !seen.has(u) && (seen.add(u), true))

  if (uris.length === 0) {
    return NextResponse.json({ error: 'No playable tracks to export' }, { status: 400 })
  }

  try {
    const playlist = await createPlaylist(userId, {
      name,
      description: typeof body?.description === 'string' ? body.description : undefined,
      uris,
    })
    // `skipped` is reported rather than swallowed — an export that quietly drops
    // tracks looks like a complete one.
    return NextResponse.json({ playlist, exported: uris.length, skipped: raw.length - uris.length })
  } catch (e) {
    if (e instanceof SpotifyError) {
      // 403 here is almost always a grant made before playlist-modify-private
      // joined the scope list. Refreshing cannot widen a grant, so say what to do.
      const error = e.status === 403
        ? 'Spotify has not granted permission to create playlists. Reconnect Spotify and try again.'
        : e.message
      return NextResponse.json({ error }, { status: e.status })
    }
    throw e
  }
}
