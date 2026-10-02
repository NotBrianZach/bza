-- Correlation games — the chain becomes a graph, and the partner becomes adjustable.
--
-- Two changes, both additive.
--
-- 1. A turn names the turn it answers. Several turns may name the same one, which
--    is what a branch is. The chain is then the path from a root to wherever the
--    player is standing: it is what the interpreter is shown, what the world is
--    folded from, and what the no-repeated-relation rule is derived from.
--
--    Because the world is now a property of a path rather than of a session, each
--    turn also records its own delta. `listen_sessions.world_state` keeps its
--    meaning for every session played before this migration — those are lines, and
--    a line has exactly one world — and becomes the branch-head cache after it.
--
-- 2. A session carries a `tuning`: how the player has weighted their partner's
--    media, and where they have set the interpreter's axes. Adjustable mid-game, so
--    it is also snapshotted per turn — a log that cannot say what the settings were
--    cannot explain why a turn went the way it did.
--
-- MUST RUN BEFORE THE CODE THAT USES IT. The turn route selects
-- `parent_turn_id, world_delta, link_turn_id, link_note` by name, and PostgREST
-- fails the whole select on an unknown column — so without this migration every
-- turn returns an error rather than degrading. Same stance as 52_correlation_games.

-- ── listen_turns ───────────────────────────────────────────────────────────

alter table public.listen_turns
  -- The structural edge: what this turn answers. Null is a thread with nothing
  -- behind it. `on delete cascade` is deliberate — deleting a turn that others
  -- answer would otherwise leave them pointing at nothing, and a branch whose root
  -- is gone is not a branch.
  add column if not exists parent_turn_id uuid
    references public.listen_turns(id) on delete cascade,

  -- The interpreter's merge into the world, kept per turn so a branch's world can
  -- be recomputed from the path that reached it.
  add column if not exists world_delta jsonb,

  -- A non-structural edge: an earlier exchange this one rhymes with, volunteered by
  -- the interpreter and validated against the turns it was actually shown. Allowed
  -- to point into another branch — that is most of its value. `on delete set null`
  -- rather than cascade: a callback disappearing must not take the turn with it.
  add column if not exists link_turn_id uuid
    references public.listen_turns(id) on delete set null,
  add column if not exists link_note text,

  -- The weighting in force when this turn was played.
  add column if not exists tuning jsonb;

-- Backfill: every existing session is a line, so every turn answers the most recent
-- *legal* turn before it. Legal matters — a move that was turned away established
-- nothing and left nothing on the table, so the turn after it was answering the same
-- offering the turned-away move was, not the rejection.
--
-- The first turn of a session, and any turn before that session's first legal one,
-- correctly ends up with a null parent.
update public.listen_turns t
   set parent_turn_id = (
         select p.id
           from public.listen_turns p
          where p.session_id = t.session_id
            and p.legal
            and p.turn_index < t.turn_index
          order by p.turn_index desc
          limit 1
       )
 where t.parent_turn_id is null;

-- `world_delta` is deliberately NOT backfilled. There is nothing to backfill it
-- from: the deltas were merged into the session world as they arrived and the
-- individual contributions were never stored. Code reads a null delta as "this
-- session's world lives on the session row", which is true for exactly these rows —
-- see worldFor() in frontend/lib/correlate/graph.ts.

-- The graph is walked per session, parent by parent, on every turn and every load.
create index if not exists listen_turns_parent_idx
  on public.listen_turns (session_id, parent_turn_id);

-- ── listen_sessions ────────────────────────────────────────────────────────

alter table public.listen_sessions
  -- Canonical form stores only what differs from the default, so '{}' is neutral
  -- and a session nobody has adjusted costs nothing to read or to prompt with.
  add column if not exists tuning jsonb not null default '{}'::jsonb;
