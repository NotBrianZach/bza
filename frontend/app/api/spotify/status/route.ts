import { NextRequest, NextResponse } from 'next/server'
import { getTokenRow } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

export async function GET(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ connected: false })

  const row = await getTokenRow(userId)
  if (!row) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected: true,
    isPremium: row.product === 'premium',
    displayName: row.display_name,
    product: row.product,
  })
}
