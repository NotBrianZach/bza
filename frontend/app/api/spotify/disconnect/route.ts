import { NextRequest, NextResponse } from 'next/server'
import { deleteTokens } from '@/lib/spotify-server'
import { getRouteUser } from '@/lib/spotify-route-auth'

export async function POST(req: NextRequest) {
  const userId = await getRouteUser(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await deleteTokens(userId)
  return NextResponse.json({ ok: true })
}
