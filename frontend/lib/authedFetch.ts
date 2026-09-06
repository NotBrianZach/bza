import { supabase } from './supabase'

/** Get auth headers to include with API requests */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { 'Authorization': `Bearer ${session.access_token}` }
    }
  } catch {}
  return {}
}

/** Fetch wrapper that adds the Supabase access token as Authorization header */
export async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  const headers = new Headers(init?.headers)
  for (const [k, v] of Object.entries(authHeaders)) headers.set(k, v)
  return fetch(url, { ...init, headers })
}
