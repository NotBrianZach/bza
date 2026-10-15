/**
 * Centralized defaults from app_config table.
 * Edge functions call getDefaults(db) to get all configurable model defaults.
 * Falls back to hardcoded values if the DB query fails.
 */

const HARDCODED_DEFAULTS: Record<string, string> = {
  'defaults.chat_model': 'openai/gpt-4o-mini',
  'defaults.chat_provider': 'openrouter',
  'defaults.problem_set_model': 'openai/gpt-4o-mini',
  'defaults.library_chat_model': 'anthropic/claude-haiku-4-5',
  'defaults.translate_model': 'deepseek/deepseek-chat-v3',
  'defaults.analysis_model': 'deepseek/deepseek-chat-v3',
  'defaults.analysis_model_uncensored': 'nousresearch/hermes-3-llama-3.1-405b',
  'defaults.analysis_model_permissive': 'nousresearch/hermes-3-llama-3.1-405b',
  'defaults.image_model': 'openai/gpt-image-1',
  'defaults.picturebook_image_model': 'fal-ai/flux-dev',
  'defaults.tts_model': 'tts-1',
  'defaults.tts_voice': 'nova',
  'defaults.knowledge_graph_model': 'gpt-4o-mini',
  'defaults.image_prompt_model': 'gpt-4o-mini',
}

// In-memory cache (edge function instances are short-lived but may handle multiple requests)
let _cache: Record<string, string> | null = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

/**
 * Fetch all defaults from app_config. Returns a flat object like:
 * { chat_model: 'openai/gpt-4o-mini', image_model: 'openai/gpt-image-1', ... }
 */
export async function getDefaults(db: any): Promise<Record<string, string>> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache

  try {
    const { data, error } = await db
      .from('app_config')
      .select('key, value')
      .like('key', 'defaults.%')

    if (error || !data?.length) throw new Error('No config')

    const result: Record<string, string> = {}
    for (const row of data) {
      const shortKey = row.key.replace('defaults.', '')
      // value is stored as JSONB — may be a quoted string
      result[shortKey] = typeof row.value === 'string' ? row.value : JSON.stringify(row.value)
    }
    _cache = result
    _cacheTime = Date.now()
    return result
  } catch {
    // Fallback to hardcoded
    const result: Record<string, string> = {}
    for (const [k, v] of Object.entries(HARDCODED_DEFAULTS)) {
      result[k.replace('defaults.', '')] = v
    }
    return result
  }
}

/**
 * Get a single default value. Shorthand for getDefaults(db)[key].
 */
export async function getDefault(db: any, key: string): Promise<string> {
  const defs = await getDefaults(db)
  return defs[key] || HARDCODED_DEFAULTS[`defaults.${key}`] || ''
}

/**
 * Quota exceeded error message — context-aware for anonymous vs registered users.
 */
export function quotaExceededMessage(tier: string): string {
  if (tier === 'anonymous') {
    return 'AI budget used up. Create a free account to get more — your books and chat history will transfer.'
  }
  return 'Monthly AI quota reached. Upgrade to Pro for $5/mo included plus pay-as-you-go.'
}

/**
 * Fetch picturebook presets from app_config.
 * Returns the full presets object, or null if not found.
 */
export async function getPicturebookPresets(db: any): Promise<Record<string, any> | null> {
  try {
    const { data } = await db
      .from('app_config')
      .select('value')
      .eq('key', 'picturebook.presets')
      .single()
    return data?.value || null
  } catch {
    return null
  }
}

/**
 * Fetch content filter descriptions from app_config.
 */
export async function getContentFilters(db: any): Promise<Record<string, string>> {
  try {
    const { data } = await db
      .from('app_config')
      .select('value')
      .eq('key', 'picturebook.content_filters')
      .single()
    return data?.value || {}
  } catch {
    return {}
  }
}
