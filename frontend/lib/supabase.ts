/**
 * Supabase Client Configuration
 * Uses @supabase/ssr createBrowserClient so the session is stored in cookies
 * instead of localStorage — cookies survive tab closes and are refreshed by
 * the middleware on every request.
 */
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton browser client — cookies are used for session storage automatically.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // detectSessionInUrl:false prevents _initialize() from auto-detecting the
    // ?code= param and calling _getUser() (which hangs on mobile). The
    // /auth/exchange page calls exchangeCodeForSession(code) explicitly instead.
    detectSessionInUrl: false,
  },
})

/**
 * Storage helper functions
 */
export const storage = {
  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(`Failed to upload file: ${error.message}`)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  },

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw new Error(`Failed to delete file: ${error.message}`)
  },

  async listFiles(bucket: string, path: string = ''): Promise<any[]> {
    const { data, error } = await supabase.storage.from(bucket).list(path)
    if (error) throw new Error(`Failed to list files: ${error.message}`)
    return data || []
  },
}

/**
 * Auth helper functions
 */
export const auth = {
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signInWithGoogle(redirectTo?: string) {
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`
      : undefined
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) throw error
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  },
}

// Legacy named exports kept for compatibility
export function getSupabaseClient() { return supabase }
export function getSupabaseServerClient(_cookieStore: any) { return supabase }
