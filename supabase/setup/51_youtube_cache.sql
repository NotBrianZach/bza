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

create table if not exists public.youtube_tracks (
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
  on public.youtube_tracks (resolved_at)
  where video_id is null;

-- RLS on with no policies: clients never touch this table directly. Every read
-- and write goes through /api/music/youtube using the service role, which
-- bypasses RLS. Locked by default rather than by a policy someone has to get
-- right.
alter table public.youtube_tracks enable row level security;
