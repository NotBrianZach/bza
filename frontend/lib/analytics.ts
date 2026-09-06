/**
 * Client-side analytics — thin wrapper around POST /api/analytics/event.
 *
 * Fire-and-forget. Never throws. Never blocks user actions.
 *
 * See supabase/setup/49_analytics_events.sql for the DB schema and
 * frontend/app/api/analytics/event/route.ts for the server side.
 */

const SESSION_KEY = 'bza-analytics-session'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let sid = localStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return `session-${Date.now()}`
  }
}

export type AnalyticsEvent =
  | 'book_upload'
  | 'book_open'
  | 'chat_message_sent'
  | 'problem_workspace_opened'
  | 'flashcard_reviewed'
  | 'translate_page'
  | 'tts_played'
  | 'signup_completed'
  | 'upgrade_clicked'

export function track(name: AnalyticsEvent | string, props?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({
    name,
    props: props ?? {},
    session_id: getOrCreateSessionId(),
    url: window.location.pathname + window.location.search,
  })
  try {
    // Prefer sendBeacon so navigation-triggered events survive page unload.
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/event', blob)
      return
    }
  } catch { /* fall through */ }
  // Fallback: keepalive fetch.
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch { /* silent */ }
}
