/**
 * User resolution for the Spotify route handlers.
 *
 * The old integration open-coded a `createServerClient` block in every one of
 * its seven routes. This does it once, and accepts either auth style: a bearer
 * token (client components using authedFetch) or the session cookie (plain
 * fetch, and the OAuth redirect flow).
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from './supabaseServerClient'
import { getUserFromToken } from './apiQuota'

export async function getRouteUser(req: NextRequest): Promise<string | null> {
  const fromBearer = await getUserFromToken(req.headers.get('authorization'))
  if (fromBearer) return fromBearer

  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(
    req,
    () => response,
    (r) => { response = r },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
