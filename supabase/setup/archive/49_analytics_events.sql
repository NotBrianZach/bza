-- Analytics events pipeline
-- 2026-08-29: instrumentation for retention/funnel analysis (task #3)
--
-- Client posts events to /api/analytics/event which inserts into this table
-- with the service-role key. RLS blocks direct client writes; only the
-- Worker route inserts.

CREATE TABLE IF NOT EXISTS analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  props      JSONB DEFAULT '{}'::jsonb,
  url        TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx
  ON analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_user_created_idx
  ON analytics_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_events_session_created_idx
  ON analytics_events (session_id, created_at DESC)
  WHERE session_id IS NOT NULL;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT policies for anon/authenticated → all client access blocked.
-- The service_role key (used only by the /api/analytics/event Worker route)
-- bypasses RLS.
