-- Saved partner settings — a named tuning you can recall into any game.
--
-- Tuning (weights + axes + scopes, see frontend/lib/correlate/tuning.ts and
-- ./scope.ts) is per-session by design: what you want from a partner changes over
-- twenty turns, so it is adjustable mid-game and stored on the session row. The
-- cost of that is it does not survive into the next game, and the settings worth
-- having are exactly the ones worth having again — "jazz, 1970s, mostly music,
-- argue with me" is a mood, not a one-off.
--
-- So a preset is a *copy* of a tuning under a name, deliberately not a reference:
-- recalling one writes its values onto the session and the two then diverge. A
-- preset that kept editing games you applied it to weeks ago would be a surprise,
-- and a game in progress should not silently change shape — the same rule
-- `listen_sessions.rules` already follows.
--
-- Additive and idempotent.

create table if not exists public.correlate_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- What the player typed. Shown verbatim and fuzzy-matched against.
  name text not null,
  -- The whole canonical Tuning: { weights, axes, scopes }. Stored as one blob
  -- rather than three columns because it is read and written as one value, and
  -- because normalizeTuning() is already the thing that decides its shape.
  tuning jsonb not null default '{}'::jsonb,
  -- The media the preset was saved under. A tuning is canonicalised against the
  -- session's media, so a preset saved in a twelve-medium game carries weights a
  -- four-medium game has no use for; recording the scope it was built for lets
  -- the client say so instead of silently dropping half of it.
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Last recalled. Drives the default ordering, because the preset you reached
  -- for yesterday is the one you are most likely to reach for now — and because
  -- fuzzy search over a list you never scroll is a worse experience than a good
  -- order with search available.
  used_at timestamptz
);

-- One name per person, case-insensitively: "Jazz night" and "jazz night" are the
-- same preset to anyone reading the list, so saving the second must update the
-- first rather than produce a pair nobody can tell apart. A unique *index* rather
-- than a constraint, because the expression form is what allows lower().
create unique index if not exists correlate_presets_user_name_idx
  on public.correlate_presets (user_id, lower(name));

-- The list query: this user's presets, most recently used first, nulls last.
create index if not exists correlate_presets_user_used_idx
  on public.correlate_presets (user_id, used_at desc nulls last);

alter table public.correlate_presets enable row level security;

do $$ begin
  create policy "own correlate presets" on public.correlate_presets
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Fuzzy matching is deliberately NOT done here, and no pg_trgm index is created.
-- A person accumulates tens of presets, not thousands; shipping the whole list to
-- the client once and scoring it there is one request instead of one per
-- keystroke, works offline, and keeps the ranking in the same language as the UI
-- that renders it. See frontend/lib/fuzzy.ts.
