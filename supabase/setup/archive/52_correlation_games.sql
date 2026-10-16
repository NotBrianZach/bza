-- Correlation games — generalise the music-only session tables.
--
-- The unit stops being a track and becomes an *offering*: (content or action,
-- medium, framing). A turn additionally records which relation the reply used, and
-- what carried across the change of representation.
--
-- Additive and idempotent. The tables keep their `listen_*` names on purpose:
-- renaming them would cost this migration plus four RLS policies and buy nothing a
-- reader of the application code can see.
--
-- ONE THING THAT IS NOT ADDITIVE, and it must run before any new code deploys:
-- `move_track` is `not null`, and the new turn route does not write it. Without the
-- `drop not null` below, every turn fails on insert.

-- ── listen_turns ───────────────────────────────────────────────────────────

alter table public.listen_turns
  -- The Offering shape. See frontend/lib/correlate/types.ts.
  add column if not exists move_offering    jsonb,
  add column if not exists reply_offering   jsonb,
  -- The relation the reply actually used, as ruled by the interpreter.
  add column if not exists relation         text,
  -- What the player claimed, in games that ask them to declare it. Kept alongside
  -- the ruling so a disagreement between the two stays visible instead of being
  -- silently overwritten by whichever was decided last.
  add column if not exists claimed_relation text,
  -- What survived the crossing, and what did not. The interesting half of a
  -- cross-medium game: rhythm becoming repetition in an image, dissonance becoming
  -- conflict in a scene.
  add column if not exists carried          text,
  add column if not exists lost             text;

-- The new route writes move_offering, not move_track. Drop the constraint before
-- the code that violates it ships.
alter table public.listen_turns
  alter column move_track drop not null;

-- Backfill: every historical move and reply was a music offering. The columns
-- move_track / reply_track are left in place for one release so a rollback has
-- something to read; nothing writes them from now on.
update public.listen_turns
   set move_offering = jsonb_build_object(
         'medium',      'music',
         'id',          coalesce(move_track->>'id', ''),
         'title',       coalesce(move_track->>'name', 'Unknown'),
         'attribution', move_track->>'artist',
         'framing',     'The whole track',
         'perceptible', case
                          when move_track->>'previewUrl' is not null
                          then jsonb_build_object('kind', 'audio', 'url', move_track->>'previewUrl')
                          else jsonb_build_object('kind', 'none')
                        end,
         'sourceUrl',   move_track->>'url',
         'origin',      'catalogue',
         'meta',        jsonb_build_object(
                          'album',      move_track->>'album',
                          'year',       left(coalesce(move_track->>'releaseDate', ''), 4),
                          'genre',      move_track->>'genre',
                          'coverImage', move_track->>'image'
                        )
       )
 where move_offering is null
   and move_track is not null;

update public.listen_turns
   set reply_offering = jsonb_build_object(
         'medium',      'music',
         'id',          coalesce(reply_track->>'id', ''),
         'title',       coalesce(reply_track->>'name', 'Unknown'),
         'attribution', reply_track->>'artist',
         'framing',     'The whole track',
         'perceptible', case
                          when reply_track->>'previewUrl' is not null
                          then jsonb_build_object('kind', 'audio', 'url', reply_track->>'previewUrl')
                          else jsonb_build_object('kind', 'none')
                        end,
         'sourceUrl',   reply_track->>'url',
         'origin',      'catalogue',
         'meta',        jsonb_build_object(
                          'album',      reply_track->>'album',
                          'year',       left(coalesce(reply_track->>'releaseDate', ''), 4),
                          'genre',      reply_track->>'genre',
                          'coverImage', reply_track->>'image'
                        )
       )
 where reply_offering is null
   and reply_track is not null;

-- `links` held the Spotify-metadata link checks that used to decide legality in
-- strict modes. Those were deleted in commit E24657DD — a shared release year is a
-- coincidence of filing, not something you can hear — and nothing has written the
-- column since.
--
-- It is deliberately NOT dropped here. Dropping a column is the one irreversible
-- statement this file could contain, nothing needs it gone for the new code to
-- work, and a forward migration run against production should not be the place a
-- column quietly disappears. Drop it by hand when you want to:
--
--   alter table public.listen_turns drop column links;

-- Relations are queried across a session to work out which are spent, so the log
-- order matters and this index is the one the turn route actually uses.
create index if not exists listen_turns_relation_idx
  on public.listen_turns (session_id, relation)
  where relation is not null;

-- ── listen_sessions ────────────────────────────────────────────────────────

alter table public.listen_sessions
  -- The scope, snapshotted at creation for the same reason `rules` is: a game in
  -- progress should not silently change shape when the build gains or loses a
  -- medium. Empty means "recompute from the registry", which is what a session
  -- created before this migration gets.
  add column if not exists media     jsonb not null default '[]'::jsonb,
  add column if not exists relations jsonb not null default '[]'::jsonb;

-- Every pre-existing session was music-only, whatever game it was playing.
update public.listen_sessions
   set media = '["music"]'::jsonb
 where media = '[]'::jsonb;

-- ── Notes, not statements ──────────────────────────────────────────────────
--
-- `public.spotify_tokens` is dead: Spotify was removed entirely (the extended
-- quota gate is 250k monthly active users, and below it there is no preview audio
-- at all, which a game built on listening cannot survive). It is deliberately NOT
-- dropped here — dropping a table that holds user grants is not something a
-- forward migration should do quietly. Drop it by hand once you are satisfied
-- nothing references it.
--
-- `move_track` / `reply_track` are likewise kept for one release. After that:
--   alter table public.listen_turns drop column move_track, drop column reply_track;
