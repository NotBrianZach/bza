import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null
function getServiceClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _supabase
}

/** Verify a Supabase access token and return the user ID, or null */
export async function getUserFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return null
  try {
    const db = getServiceClient()
    const { data: { user } } = await db.auth.getUser(token)
    return user?.id ?? null
  } catch { return null }
}

/** Check if a user can make an API call. Returns null if allowed, error string if blocked. */
export async function checkQuota(userId: string): Promise<string | null> {
  try {
    const db = getServiceClient()
    const { data } = await (db.rpc as any)('get_user_quota', { user_uuid: userId })
    const row = data?.[0] as { tier?: string; spend_this_month?: number; spend_limit?: number } | undefined
    if (!row) return null // no quota row = allow
    if (row.tier !== 'free') return null // pro users always pass
    if ((row.spend_this_month ?? 0) >= (row.spend_limit ?? 2)) {
      return 'Monthly AI quota reached. Upgrade to Pro for more usage.'
    }
    return null
  } catch { return null } // fail open
}

/** Log API cost for quota tracking */
export async function logUsage(userId: string, baseCost: number, meta: { model: string; endpoint: string; provider?: string }) {
  try {
    const db = getServiceClient()
    const provider = meta.provider ?? (meta.model.includes('/') ? 'openrouter' : 'openai')
    await (db.from('api_usage') as any).insert({
      user_id: userId,
      api_provider: provider,
      model: meta.model,
      endpoint_type: meta.endpoint,
      request_type: meta.endpoint,
      input_tokens: 0,
      output_tokens: 0,
      base_cost: baseCost,
      markup_multiplier: 2.0,
    })
  } catch {}
}
