-- 59 — the partner may answer its own offering
--
-- Until now every turn had the same author: the player offered, the partner read
-- it and answered. A self-reply is a turn whose *move* is the partner's own
-- previous answer, taken while the player stands back. It is an ordinary row —
-- same parent edge, same relation, same world delta — because that is what makes
-- the existing rules cover it: the no-repeated-relation rule reads the relation
-- column, the exclusion set reads the offerings, and both apply unchanged.
--
-- One column is needed, and it has to be stored rather than derived: nothing else
-- in the row distinguishes a move the player made from one the partner made, and
-- the distinction is load-bearing in both directions.
--
--   * The engine caps consecutive self-replies by counting the trailing
--     partner-authored turns on a branch (lib/correlate/continuation.ts). A client
--     asking for a fourth is refused by arithmetic, not by trust.
--   * The board must never label a partner-authored move "you offered". A dropped
--     reply and a search that found nothing already had to look different from each
--     other; a move the player did not make and one they did are the same kind of
--     distinction, and it is worse to blur because the player would have no way to
--     notice.
--
-- RUN THIS BEFORE DEPLOYING THE CODE. Same hazard as migrations 52 and 53: the
-- turn route selects `move_by` by name, and PostgREST fails the whole select on an
-- unknown column, so the section stops being playable rather than degrading.
--
-- No new table, so no new policies: `listen_turns` already restricts every
-- operation to its owner, and a self-reply row is owned by the player whose game
-- it is — they asked for it.

alter table listen_turns
  add column if not exists move_by text not null default 'player';

-- Two values, and a default that is correct for every row written before today.
-- A check constraint rather than an enum: the set is closed in the application and
-- an enum would make adding a third author a migration with a type rewrite in it.
do $$
begin
  alter table listen_turns
    add constraint listen_turns_move_by_check check (move_by in ('player', 'partner'));
exception
  when duplicate_object then null;
end $$;

comment on column listen_turns.move_by is
  'Who played the move this turn answers: ''player'', or ''partner'' when the '
  'partner answered its own previous offering. Capped at 3 in a row, counted from '
  'the trailing run on the branch. See lib/correlate/continuation.ts.';

-- The cap is read from the tail of a branch, so every lookup walks parent edges
-- from one turn backwards. That walk is already served by the parent index from
-- migration 53; this one is for the other direction the board asks in — "which of
-- this session's turns were taken alone" — which it does on every render.
create index if not exists listen_turns_session_move_by_idx
  on listen_turns (session_id, move_by);

-- Continuation itself needs no column. How many turns the partner should take by
-- itself after each of yours is stored inside `listen_sessions.tuning`, which is
-- already jsonb and already canonicalised on the way in — the same free ride
-- scopes took in the tuning registry. It is deliberately never shown to the
-- interpreter: a model told a run of three is coming writes toward a monologue
-- instead of answering the thing in front of it.
