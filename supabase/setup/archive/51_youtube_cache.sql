-- YouTube resolution cache.
--
-- Full-length playback needs a YouTube video id, and the only legitimate way to
-- get one is Data API search: 100 quota units per call against a 10,000/day
-- budget, i.e. 100 lookups a day. So every lookup is cached here forever and
-- shared by all users — a song resolves once for everybody, not once per person
-- and not once per session. Without this table the daily budget would be gone in
-- a couple of games.
--
-- Not user data: rows are facts about the public catalogue, keyed by iTunes
-- trackId. There is deliberately no user_id.
--
-- Lives in schema `bza_public`, not `public`. Two reasons. This Supabase project is
-- shared with another app whose tables sit in `woofs`, so `public` is a commons
-- and a commons collides. And from 2026-10-30 Supabase stops granting the Data
-- API roles on newly created `public` objects, which makes `public` behave like
-- every other schema has always behaved — at which point there is no advantage
-- left in being there. See the grants below: they are now the thing that decides
-- reachability, in any schema.

create schema if not exists bza_public;

-- Usage on the schema is a door, not a key: it lets a role name objects inside
-- without granting anything on them. All three get it so later tables in here
-- can choose their own audience; this one grants table privileges to
-- service_role alone.
grant usage on schema bza_public to anon, authenticated, service_role;

create table if not exists bza_public.youtube_tracks (
  -- iTunes trackId (TrackRef.id). Text, not bigint: TrackRef.id is a string
  -- everywhere in the app and matching that avoids a cast on every lookup.
  track_id text primary key,

  -- null means "we asked YouTube and it had nothing". That is a negative cache
  -- entry and it matters as much as a positive one: without it, every unmatched
  -- song re-spends 100 units on every attempt, forever.
  video_id text,

  -- Whether the video can actually be embedded off-site. Search is already
  -- filtered to videoEmbeddable, but that misses region and rights restrictions,
  -- so this records what oEmbed said — which costs no quota to ask.
  embeddable boolean not null default false,

  -- The query that produced this, kept so a bad match is debuggable rather than
  -- just wrong.
  query text,

  resolved_at timestamptz not null default now()
);

-- Cheap sweep for re-resolving stale misses later: a song absent from YouTube
-- today may be there next month.
create index if not exists youtube_tracks_misses_idx
  on bza_public.youtube_tracks (resolved_at)
  where video_id is null;

-- Explicit grants, service_role only. Nothing was ever auto-granted in a custom
-- schema, and after 2026-10-30 nothing is auto-granted in `public` either, so
-- this is the whole access decision and it is reviewable in the diff.
--
-- anon and authenticated are deliberately absent rather than granted-then-denied:
-- clients never touch this table. Every read and write goes through
-- /api/music/youtube with the service role.
grant select, insert, update, delete on bza_public.youtube_tracks to service_role;

-- RLS on with no policies, as a second floor under the missing grants. The
-- service role bypasses RLS, so this costs the intended caller nothing and
-- costs an unintended one everything.
alter table bza_public.youtube_tracks enable row level security;
