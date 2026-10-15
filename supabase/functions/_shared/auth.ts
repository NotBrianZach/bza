// Shared auth helper for edge functions.
//
// ── PRODUCTION RUNS TWO VERSIONS OF THIS FILE ─────────────────────────────
//
// This is the one WITH the blacklist check, embedded in cyoa, detect-concepts
// and library-ontology. generate-picturebook was last deployed before the check
// was added and still carries the older 40-line version, which authenticates
// the user and then proceeds — so a blacklisted user_id or IP is refused by
// three functions and admitted by the fourth.
//
// Each deployed bundle embeds whatever this file looked like when THAT function
// was last deployed, and there is no deploy path for edge functions in this
// repo (no supabase CLI on PATH, so both deploy entry points skip them). That is
// how the two drifted apart, and why nothing noticed.
//
// Recovered via scripts/edge-functions.mjs, which reports the divergence as a
// CONFLICT rather than silently keeping whichever copy it saw last. Redeploying
// generate-picturebook is what closes it; until then this file is the intended
// behaviour and not a description of all of production.
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/**
 * Creates a Supabase admin client (service-role, bypasses RLS) and resolves
 * the authenticated user from the Bearer token in the request headers.
 *
 * Throws if the token is missing or invalid.
 */
export async function requireAuth(req: Request): Promise<{
  db: SupabaseClient
  userId: string
}> {
  const db = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) throw new Error('Unauthorized')

  // Check blacklist (user_id and/or IP)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || null
  const { data: blocked } = await db.rpc('is_blacklisted', {
    check_user_id: user.id,
    check_ip: clientIp,
  })
  if (blocked) throw new Error('Access denied')

  return { db, userId: user.id }
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

export function corsError(message: string, status = 400): Response {
  return corsResponse({ error: message }, status)
}
