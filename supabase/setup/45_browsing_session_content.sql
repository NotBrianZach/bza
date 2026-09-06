-- Browsing session content: chats + bookmarks per session, plus title/description.
-- Screenshots + AI extractions already live in browser_extractions (migration 44).

alter table public.browser_sessions
  add column if not exists title text,
  add column if not exists description text;

create table if not exists public.browser_session_chats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.browser_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  base_cost numeric,
  created_at timestamptz not null default now()
);

create index if not exists browser_session_chats_session_created_idx
  on public.browser_session_chats (session_id, created_at);

create table if not exists public.browser_session_bookmarks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.browser_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists browser_session_bookmarks_session_created_idx
  on public.browser_session_bookmarks (session_id, created_at desc);

alter table public.browser_session_chats enable row level security;
alter table public.browser_session_bookmarks enable row level security;

create policy "own session chats" on public.browser_session_chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own session bookmarks" on public.browser_session_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
