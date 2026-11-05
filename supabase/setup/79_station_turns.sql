-- 79_station_turns.sql — a third mover: the station.
--
-- `move_by` has carried two values since migration 59, 'player' and 'partner',
-- and they answered one question: which of the two readers in a conversation
-- took this turn. The station is neither. It is not a reader at all — it picks
-- the next track from Deezer's artist flow, which is co-listening data, and no
-- interpreter is involved in the turn at any point.
--
-- ── Why it is a turn rather than a queue entry ─────────────────────────────
--
-- It was a queue entry first, deliberately, on the reasoning that a turn is a
-- claimed connection with a reading and a station pick has neither. That is
-- still true of the pick, and it was the wrong conclusion: the cost of keeping
-- it out of the chain was that station songs appeared in no tree, were absent
-- from every share link, and could not be answered, branched from or clicked
-- like everything else in a chain. Parity with "keep going" is worth more than
-- the tidiness of a table where every row is a judgement.
--
-- So a station turn is a real row, and what makes it honest is what it leaves
-- EMPTY rather than anything it asserts:
--
--   relation          null — nothing was ruled
--   claimed_relation  null — nothing was claimed
--   reading           null — nobody read anything, and prose here would be the
--                     one fabrication this whole design has been avoiding. The
--                     client renders the basis sentence from `move_by` instead,
--                     so what a player sees is derived from the fact that this
--                     was a station pick and cannot drift from it.
--   facts             '[]' — nothing was established
--   world_delta       null — the world is unchanged by a song being played
--   prediction        null — there was nothing to guess at
--
-- `legal` stays true, and that deserves its own note because it is the one
-- field where the honest value is arguable. `legal = false` already means
-- something specific and loud — "this move was turned away, the connection did
-- not hold" — and it excludes the row from the chain, the audible list and the
-- path. A station pick was not refused, so false is simply wrong. True here
-- reads as "this row stands as part of the chain", which it does, and nothing
-- can mistake it for a passed judgement because `move_by = 'station'` is on the
-- same row.

alter table bza_public.listen_turns
  drop constraint if exists listen_turns_move_by_check;

alter table bza_public.listen_turns
  add constraint listen_turns_move_by_check
  check (move_by = any (array['player'::text, 'partner'::text, 'station'::text]));

comment on column bza_public.listen_turns.move_by is
  'Who took this turn. ''player'' is the person, ''partner'' is the interpreter '
  'answering its own previous reply (see lib/correlate/continuation.ts), and '
  '''station'' is a track picked from catalogue listening data with no '
  'interpreter involved — those rows carry no relation, no claim and no '
  'reading, and the client derives what it shows from this column.';
