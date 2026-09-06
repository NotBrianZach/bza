alter table public.browser_sessions
  add column if not exists workspace_text text;
