-- Browser sessions (Hyperbeam-first, provider-agnostic) and extractions.
-- Session + extraction cost tracked in the shared api_usage table via lib/apiQuota.ts::logUsage.

create table if not exists public.browser_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'hyperbeam',
  provider_session_id text not null,
  embed_url text not null,
  admin_token text,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ended_at timestamptz,
  url_last_seen text,
  unique (provider, provider_session_id)
);

create index if not exists browser_sessions_user_active_idx
  on public.browser_sessions (user_id, ended_at)
  where ended_at is null;

create table if not exists public.browser_extractions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.browser_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_sha256 text,
  region jsonb,
  mode text not null,
  extracted jsonb,
  model text,
  base_cost numeric,
  created_at timestamptz not null default now()
);

create index if not exists browser_extractions_user_created_idx
  on public.browser_extractions (user_id, created_at desc);

alter table public.browser_sessions enable row level security;
alter table public.browser_extractions enable row level security;

create policy "own sessions" on public.browser_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own extractions" on public.browser_extractions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
