import { createClient } from '@supabase/supabase-js'
import { serverData } from './supabaseSchema'

// Built in its own function so the annotation below carries the schema. The
// schema is a type parameter on SupabaseClient, so the plain
// `ReturnType<typeof createClient>` this used to say meant "a public-schema
// client" and would not accept a bza_public one. Same shape as
// lib/music/youtube.ts, which hit this first.
function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData },
  )
}

let _supabase: ReturnType<typeof makeServiceClient> | null = null
function getServiceClient() {
  if (!_supabase) _supabase = makeServiceClient()
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

/**
 * Log API cost for quota tracking.
 *
 * `tokens` is optional and, when absent, the columns stay at the zeros they have
 * always held. That default is worth naming rather than inheriting: `api_usage`
 * has had `input_tokens` and `output_tokens` columns since it was created and
 * every caller wrote 0 to both, so the table recorded cost estimates and nothing
 * measurable. Any question of the form "is this prompt as expensive as we think",
 * "did prompt caching work", or "is max_tokens tight" was unanswerable from the
 * data we were already storing.
 *
 * Providers do not agree on the field names, so the caller normalizes and this
 * function takes numbers — see `providerUsage` in the correlate turn route.
 */
export async function logUsage(
  userId: string,
  baseCost: number,
  meta: { model: string; endpoint: string; provider?: string },
  tokens?: {
    input?: number
    output?: number
    /** Tokens served from a prompt cache. The whole point of measuring. */
    cacheRead?: number
    /** Tokens written to a prompt cache, billed at a premium. */
    cacheWrite?: number
    /** Thinking tokens, where the provider reports them separately. */
    reasoning?: number
  },
) {
  try {
    const db = getServiceClient()
    const provider = meta.provider ?? (meta.model.includes('/') ? 'openrouter' : 'openai')
    await (db.from('api_usage') as any).insert({
      user_id: userId,
      api_provider: provider,
      model: meta.model,
      endpoint_type: meta.endpoint,
      request_type: meta.endpoint,
      input_tokens: tokens?.input ?? 0,
      output_tokens: tokens?.output ?? 0,
      base_cost: baseCost,
      markup_multiplier: 2.0,
      // Into the existing `request_metadata` jsonb rather than new columns: cache
      // and reasoning counts are provider-specific and not every provider reports
      // them, so columns that are null for most rows would be worse than keys
      // that are simply absent. A migration can promote them once there is enough
      // data to know which are worth indexing.
      //
      // The column name matters more than it looks. This whole function is
      // wrapped in `catch {}` so that a logging failure can never fail a user's
      // turn — which means an insert naming a column that does not exist would
      // silently stop recording usage altogether, and the symptom would be an
      // empty table rather than an error. `request_metadata` is the column
      // `api_usage` actually has; `total_tokens` and `charged_cost` are generated
      // and must not be written.
      ...(tokens && (tokens.cacheRead || tokens.cacheWrite || tokens.reasoning)
        ? {
            request_metadata: {
              cache_read_tokens: tokens.cacheRead ?? 0,
              cache_write_tokens: tokens.cacheWrite ?? 0,
              reasoning_tokens: tokens.reasoning ?? 0,
            },
          }
        : {}),
    })
  } catch {}
}
