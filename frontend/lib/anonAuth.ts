/**
 * Anonymous authentication helper.
 * Silently creates an anonymous Supabase session when a user first needs AI features.
 * When they later create a real account, Supabase links the anonymous session
 * and all their data (books, chat, flashcards) transfers automatically.
 */

import { supabase } from './supabase'

const ANON_SESSION_KEY = 'bza-anon-session-active'

/** Check if the current session is anonymous (no email) */
export function isAnonymousSession(): boolean {
  return localStorage.getItem(ANON_SESSION_KEY) === '1'
}

/** Check if user has a real (email-based) account */
export async function hasRealAccount(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session?.user?.email
}

/**
 * Ensure the user has some kind of session (real or anonymous).
 * If no session exists, silently creates an anonymous one.
 * Returns the session user ID, or null if creation failed.
 */
export async function ensureSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()

  // Already has a session (real or anonymous)
  if (session?.user) return session.user.id

  // Create anonymous session
  try {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Anonymous sign-in failed:', error.message)
      return null
    }
    if (data.user) {
      localStorage.setItem(ANON_SESSION_KEY, '1')
      return data.user.id
    }
    return null
  } catch (err) {
    console.error('Anonymous sign-in error:', err)
    return null
  }
}

/**
 * Called when user creates a real account.
 * Clears the anonymous session marker.
 */
export function clearAnonMarker() {
  localStorage.removeItem(ANON_SESSION_KEY)
}
