import { supabase } from './supabase'

/**
 * Fire webhooks for the current user's event.
 * Non-blocking — errors are silently ignored.
 */
export function dispatchWebhook(event: string, payload: Record<string, any>) {
  ;(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      await fetch('/api/webhooks/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, event, payload }),
      })
    } catch {}
  })()
}
