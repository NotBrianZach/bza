import { NextRequest, NextResponse } from 'next/server'
import { getValidToken } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

/** Short-lived access token for the Web Playback SDK (premium accounts only). */
export async function GET(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const result = await getValidToken(userId)
  if (!result) return NextResponse.json({ error: 'Not connected' }, { status: 403 })

  return NextResponse.json({ token: result.token })
}
