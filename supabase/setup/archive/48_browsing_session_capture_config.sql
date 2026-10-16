alter table public.browser_sessions
  add column if not exists capture_prompt text,
  add column if not exists capture_mode text;
