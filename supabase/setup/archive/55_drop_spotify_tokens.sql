-- Drop public.spotify_tokens.
--
-- The Spotify integration was hard-deleted in commit 8D1529A5 — the extended
-- quota gate is 250k monthly active users and below it there is no preview
-- audio at all, which a game built on listening cannot survive. See
-- frontend/lib/offerings/music.ts for what replaced it (Deezer).
--
-- `50_listen_along.sql` recreated the table idempotently so a fresh environment
-- could be bootstrapped without replaying the historical setup files, and
-- `52_correlation_games.sql` declined to drop it, on the grounds that a forward
-- migration should not quietly remove a table holding user OAuth grants. That
-- was the right call then and the condition it named has now been checked:
--
--   select count(*) from public.spotify_tokens;             -- 0
--   select conname from pg_constraint
--    where confrelid = 'public.spotify_tokens'::regclass;   -- none
--   -- no view or function in `public` mentions spotify either
--
-- Zero rows, so there are no grants to lose. The create-table block has been
-- removed from 50_listen_along.sql in the same commit, so a fresh environment
-- never makes it in the first place and this file is a no-op there.

drop table if exists public.spotify_tokens;

-- The policy and the RLS toggle go with the table; nothing else to clean up.
