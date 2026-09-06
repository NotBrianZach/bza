/**
 * GET  — returns the user's unique newsletter email address
 * POST — regenerates the token (in case of spam)
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const EMAIL_DOMAIN = process.env.NEWSLETTER_EMAIL_DOMAIN ?? 'aireadalong.com'

async function getOrCreateToken(userId: string): Promise<string> {
  // Try to fetch existing
  const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_tokens?user_id=eq.${userId}&select=token`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  const rows: { token: string }[] = await res.json()
  if (rows[0]?.token) return rows[0].token

  // Create new
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_tokens`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ user_id: userId }),
  })
  const created: { token: string }[] = await ins.json()
  return created[0].token
}

async function getUser(req: NextRequest) {
  let response = NextResponse.next()
  const supabase = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll(cs) { cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const token = await getOrCreateToken(user.id)
  return NextResponse.json({ email: `${token}@${EMAIL_DOMAIN}`, token })
}

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Delete existing and let getOrCreateToken make a fresh one
  await fetch(`${SUPABASE_URL}/rest/v1/newsletter_tokens?user_id=eq.${user.id}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  const token = await getOrCreateToken(user.id)
  return NextResponse.json({ email: `${token}@${EMAIL_DOMAIN}`, token })
}
