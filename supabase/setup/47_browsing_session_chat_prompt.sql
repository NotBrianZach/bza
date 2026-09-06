alter table public.browser_sessions
  add column if not exists chat_system_prompt text;
