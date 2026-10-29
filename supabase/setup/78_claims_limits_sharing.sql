-- 78 — three things a correlation game did not have: an end, a claim, a reader
--
-- Additive and idempotent. One table and four columns.
--
-- ── Why these three together ──────────────────────────────────────────────
--
-- They are one complaint with three faces: a chain had no stakes, no way for the
-- player to be *right* about anything, and nobody to show it to.
--
--  - `turn_limit` / `closing_reading` give a game an end it is driving towards,
--    and something at the end. Every game's `goal` in the registry describes an
--    arc ("exhaust a subject from every side it has", "map somewhere real enough
--    to come back to") and nothing in the engine ever measured one or closed one.
--    `status = 'finished'` was a flag a player set by hand, with no payoff.
--
--  - `listen_claims` makes the one genuinely novel observation in the engine —
--    that turn 9 is doing again, in another medium, what turn 2 did — available
--    to the *player* rather than only volunteered by the interpreter. It was
--    already recorded as `listen_turns.link_turn_id`, already validated against
--    the turns the interpreter was shown, and rendered as grey text. This is the
--    same edge, claimed from the other side and ruled on.
--
--  - `share_token` is the whole social surface. "Do you see what I see" is what a
--    correlation game is for, and three of the eleven (`judge: 'player'`) are
--    explicitly arguing with somebody — who, until now, was a model.
--
-- ── listen_claims is not a turn, and that is the design ───────────────────
--
-- A claim has no move, no reply, no relation and no place on the branch. It is an
-- assertion *about* two turns, so it is its own row rather than a column on
-- either of them: a column would have to pick one of the two turns to live on,
-- and the claim is symmetric.
--
-- The verdict is three-valued on purpose and `holds`/`thin`/`no` are its values.
-- A boolean would make every imperfect claim a failure, and "thin, but real" is
-- the most interesting ruling this engine produces anywhere — the whole section
-- is built on connections that are explainable rather than exact. Nullable while
-- a ruling is in flight; a row that keeps a null verdict is a claim whose
-- interpreter call failed, which is distinguishable from one that was refused.

alter table bza_public.listen_sessions
  -- Null means open-ended, which is every game played until now and the default
  -- for every game started without asking for a limit.
  add column if not exists turn_limit integer,
  -- Written once, when the limit is reached or the player finishes by hand.
  add column if not exists closing_reading text,
  -- Null means private. Unique so a token names at most one game.
  add column if not exists share_token text;

comment on column bza_public.listen_sessions.turn_limit is
  'How many turns this game is played to. Null is open-ended. Counted against '
  'turn_count, so a branch does not get its own allowance — the limit is on the '
  'game, which is what makes a branch cost something.';

comment on column bza_public.listen_sessions.closing_reading is
  'What the chain turned out to be about, written once at the end. Null until '
  'the game is closed, and null forever on a game abandoned rather than closed.';

comment on column bza_public.listen_sessions.share_token is
  'Opaque token for read-only public access. Null means private. Reads go '
  'through a service-client route rather than an RLS policy, because RLS cannot '
  'see a token in a URL — see app/api/correlate/shared/[token].';

create unique index if not exists listen_sessions_share_token_key
  on bza_public.listen_sessions (share_token)
  where share_token is not null;

create table if not exists bza_public.listen_claims (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references bza_public.listen_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The turn the player is standing on when they make the claim.
  from_turn_id uuid not null references bza_public.listen_turns(id) on delete cascade,
  -- The earlier turn they say it rhymes with.
  to_turn_id uuid not null references bza_public.listen_turns(id) on delete cascade,
  -- Their own words for what the two share. Required: a claim with no stated
  -- reason is not a claim, it is a pair of turns.
  note text not null,
  verdict text,
  -- The interpreter's sentence on it. The part the player is actually owed.
  ruling text,
  created_at timestamptz not null default now(),
  constraint listen_claims_verdict_check
    check (verdict is null or verdict = any (array['holds'::text, 'thin'::text, 'no'::text])),
  -- A turn cannot rhyme with itself, and the same pair cannot be claimed twice.
  constraint listen_claims_distinct check (from_turn_id <> to_turn_id),
  unique (from_turn_id, to_turn_id)
);

create index if not exists listen_claims_session_idx
  on bza_public.listen_claims (session_id, created_at);

alter table bza_public.listen_claims enable row level security;

do $$ begin
  create policy "own listen claims" on bza_public.listen_claims
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.listen_claims to authenticated;
