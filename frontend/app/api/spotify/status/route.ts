import { NextRequest, NextResponse } from 'next/server'
import { getTokenRow, hasPlaybackScopes } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

export async function GET(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ connected: false })

  const row = await getTokenRow(userId)
  if (!row) return NextResponse.json({ connected: false })

  const isPremium = row.product === 'premium'

  // Only premium accounts drive the Web Playback SDK, so only they can be held
  // back by the scope grant. Free accounts use the embed player, which needs no
  // auth at all — probing Spotify for them would be a round-trip for nothing.
  const scopesOk = isPremium ? await hasPlaybackScopes(userId) : null

  return NextResponse.json({
    connected: true,
    isPremium,
    displayName: row.display_name,
    product: row.product,
    // Strictly false means "asked Spotify, the grant is short". null means the
    // probe did not run or failed, which must not trigger a reconnect prompt.
    needsReconnect: scopesOk === false,
  })
}
