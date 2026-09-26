-- AI Listen Along — music-game sessions.
--
-- A session is one running game: a mode (tag / duel / investigation /
-- navigation / construction / transformation / prediction / radio), a
-- persistent world state, and an ordered log of turns. Each turn pairs the
-- player's outgoing song with the interpreter's reply song; both are resolved
-- to real Spotify tracks before the turn is stored, so a turn can never
-- reference a song that does not exist.
--
-- LLM cost is tracked in the shared api_usage table via lib/apiQuota.ts::logUsage.

-- Spotify OAuth tokens. Originally created by supabase/setup/27 and left in
-- place when the old Spotify integration was deleted (commit 8d1529a5).
-- Recreated idempotently here so a fresh environment can run Listen Along
-- without replaying the historical setup files.
create table if not exists public.spotify_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  product text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.listen_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  title text not null,
  -- Snapshot of the mode's rules as they were at creation time. A later edit
  -- to the mode registry must not retroactively change how an in-progress
  -- game is read.
  rules jsonb not null default '{}'::jsonb,
  -- The persistent world: place, cast, open questions, accumulated facts.
  -- Shape is mode-defined; the interpreter returns deltas, never a rewrite.
  world_state jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  turn_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listen_sessions_user_updated_idx
  on public.listen_sessions (user_id, updated_at desc);

create table if not exists public.listen_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.listen_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  turn_index int not null,
  -- The player's move: a real Spotify track (SpotifyTrackRef shape).
  move_track jsonb not null,
  -- The interpreter's reply: a real Spotify track, or null if the dial failed
  -- to land anywhere (the query is kept so the miss is legible).
  reply_track jsonb,
  reply_query text,
  -- How the move was read, and what the exchange did to the world.
  reading text,
  narration text,
  facts jsonb not null default '[]'::jsonb,
  -- Verifiable links between the move and the previous reply, computed from
  -- Spotify metadata server-side (never claimed by the model).
  links jsonb not null default '[]'::jsonb,
  -- Strict modes reject illegal moves; the rejection is still logged.
  legal boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

create index if not exists listen_turns_session_idx
  on public.listen_turns (session_id, turn_index);

alter table public.spotify_tokens  enable row level security;
alter table public.listen_sessions enable row level security;
alter table public.listen_turns    enable row level security;

do $$ begin
  create policy "own spotify tokens" on public.spotify_tokens
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own listen sessions" on public.listen_sessions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own listen turns" on public.listen_turns
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
