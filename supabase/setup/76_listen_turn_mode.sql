-- 76 — a turn records which game it was played under
--
-- One nullable column. Additive and idempotent.
--
-- ── Why this has to exist before a game can be switched ───────────────────
--
-- `listen_sessions.mode` is `not null` and session-level, and `listen_turns`
-- had no mode at all. So switching a session's mode retroactively relabelled
-- every turn already played: a chain of Tag moves would render, and be read
-- back by the interpreter, as though it had always been Embodiment. The record
-- of what was actually played would be gone — silently, with nothing in the
-- row to notice it by.
--
-- That is also the only way mid-game switching breaks the promise
-- lib/correlate/tuning.ts makes about `rules`: "a game does not change shape
-- underneath the person playing it." A switch the player makes, declares, and
-- sees recorded in the chain is a move. A switch that rewrites what earlier
-- turns were is the thing the promise forbids. The column is what makes it the
-- first one.
--
-- ── Why nullable ──────────────────────────────────────────────────────────
--
-- Every row written before this ran was played under its session's mode, and
-- nobody switched anything, so `null` already reads correctly as "the
-- session's mode" for 100% of existing data. Backfilling `session.mode` into
-- those rows would assert that each turn stated its own game when none of them
-- did — a lie about rows nobody switched, and one that would make the backfill
-- indistinguishable from a real switch to the session's starting game.
--
-- Rows written from here on always state their game, including the ones that
-- did not switch. See `modeAlong` in lib/correlate/switching.ts for the read
-- side, which is the only place that resolves null.
--
-- The exact precedent is one column over: `listen_turns.tuning` is per-turn
-- jsonb for the same reason, and is null on every row written before tuning
-- existed, meaning the same kind of thing.

alter table bza_public.listen_turns
  add column if not exists mode text;

comment on column bza_public.listen_turns.mode is
  'The game this turn was played under. Null means the session''s own mode — '
  'true of every row written before 2026-10-29 and of nothing written after. '
  'A value differing from the previous turn''s effective mode is a switch '
  'boundary: world replay restarts from it and spent relations clear at it.';

-- No index. Mode is only ever read as part of a session's full turn list,
-- which `listen_turns_session_idx` already covers, and a one-of-eleven text
-- column is not selective enough to earn one of its own.
