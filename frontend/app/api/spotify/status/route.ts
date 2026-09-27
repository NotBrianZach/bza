import { NextRequest, NextResponse } from 'next/server'
import { getTokenRow, hasPlaybackScopes } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

export async function GET(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ connected: false })

  const row = await getTokenRow(userId)
  if (!row) return NextResponse.json({ connected: false })

  // Probed for every connected account, not just premium. The email probe stands
  // in for "this grant predates the current scope list" — user-read-email and
  // playlist-modify-private were added together, so a connection missing one is
  // missing both, and playlist export matters to free accounts most of all.
  const scopesOk = await hasPlaybackScopes(userId)

  return NextResponse.json({
    connected: true,
    isPremium: row.product === 'premium',
    displayName: row.display_name,
    product: row.product,
    // Strictly false means "asked Spotify, the grant is short". null means the
    // probe did not run or failed, which must not trigger a reconnect prompt.
    needsReconnect: scopesOk === false,
  })
}
