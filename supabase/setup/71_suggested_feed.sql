-- 71 — the suggested feed: sources, items, interests, digests, feedback
--
-- Six tables in `bza_public` (migration 57 set default privileges there, so the
-- grants are automatic — see the note at the foot of 60_concept_practice.sql).
-- Additive and idempotent: nothing existing is touched, no column is dropped
-- and no constraint is relaxed, so there is no deploy-ordering hazard. The code
-- that reads these tables is new, and until it ships nothing selects them.
--
-- ── WHY THIS IS NOT `pinnedFeeds` GROWN A BACKEND ──────────────────────────
--
-- frontend/lib/pinnedFeeds.ts already stores a feed list, in localStorage, and
-- the obvious move is to lift it into Postgres and add columns. That would be
-- wrong, and the reason is the whole shape of this migration.
--
-- A pinned feed is a BOOKMARK. It exists so the home page can render a source's
-- latest items; nothing is retained between renders, and the only state is
-- "which URLs, in what order". It is correctly in localStorage — it is a UI
-- preference, it needs no server, and it works signed out.
--
-- A suggested feed needs the opposite of all of that. Deduplication needs the
-- items it has already seen; novelty needs what was already SHOWN, weeks back;
-- the duplicate rate needs the story clusters of the previous window; feedback
-- needs to survive a browser; and the whole §6 measurement set is a query over
-- history. Every one of those is a cross-session fact about a person, which is
-- the definition of what belongs in a table and not in localStorage.
--
-- So the two coexist and `pinnedFeeds` is not migrated. A user can browse a
-- source without it entering their digest, which is a distinction worth keeping:
-- the feeds you read and the feeds you want curated are not the same list.
--
-- ── WHY ITEMS ARE SHARED AND EVERYTHING ELSE IS PER-USER ───────────────────
--
-- `suggest_feeds` and `suggest_items` have NO user_id. An RSS item is a public
-- document; storing one copy per subscriber would multiply the row count by the
-- user count, make the exact-duplicate check per-user (so two people could not
-- share a cluster id), and turn "has this been fetched" into a question with a
-- different answer for everybody.
--
-- The cost is that these two tables cannot be owner-RLS'd, and they are not:
-- they are readable by any authenticated user and writable only by the service
-- role. That is the honest trade. What stays private is every judgement — which
-- feeds a person enabled, what they are interested in, what they were shown and
-- what they thought of it — and those are the four per-user tables, all
-- owner-only. Nothing about a user is derivable from the shared half.

-- ── sources ────────────────────────────────────────────────────────────────
--
-- The feed catalogue. Shared, because a URL is a URL.

create table if not exists bza_public.suggest_feeds (
  id uuid primary key default gen_random_uuid(),
  -- The canonical feed URL. Unique, which is what makes two users subscribing
  -- to the same publication share its items rather than each fetching them.
  url text not null unique,
  -- The feed's own title when it declared one, else its hostname. A user's
  -- preferred label lives on their subscription row, not here: renaming a feed
  -- must not rename it for everybody.
  name text not null,
  language text,
  -- Polling bookkeeping, so a feed that is failing can be seen to be failing
  -- rather than silently contributing nothing.
  last_polled_at timestamptz,
  last_poll_status text,
  -- HTTP caching, per the spec's "use the feed's own update metadata where
  -- available". Both are sent back as conditional-request headers; a 304 then
  -- costs one request and no parsing.
  http_etag text,
  http_last_modified text,
  consecutive_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── subscriptions ──────────────────────────────────────────────────────────
--
-- One row per (user, feed): everything about a feed that is a judgement rather
-- than a fact. The spec is explicit that the user edits the tags and the type,
-- so they cannot live on the shared row.

create table if not exists bza_public.suggest_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  feed_id uuid not null references bza_public.suggest_feeds(id) on delete cascade,
  -- The user's own label, when they set one. Null means "use the feed's name".
  label text,
  -- Free text, e.g. 'Texas', 'Houston', 'EU'. Matched against the user's
  -- regions by score.ts `localFit`.
  region text,
  topic_tags text[] not null default '{}',
  -- One of local_reporting | specialist | wire | primary_source | research |
  -- commentary. NOT a check constraint: the set is a TypeScript union in
  -- lib/suggest/types.ts, and a constraint here would mean a migration every
  -- time the union gained a member — the same reasoning as
  -- concept_point_strength.knowledge_point_id not being a foreign key.
  --
  -- There is deliberately NO political-leaning column. The spec forbids
  -- inferring one as a quality score, and a column that existed would be used
  -- as one within a week.
  source_type text not null default 'specialist',
  enabled boolean not null default true,
  -- A feed the user vouched for by name. Its items bypass the quality floor —
  -- see `isEligible` in lib/suggest/score.ts. The floor exists to stop novelty
  -- and recency rescuing weak items, not to overrule somebody who said "I want
  -- this publication".
  user_designated boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, feed_id)
);

create index if not exists suggest_subscriptions_user_idx
  on bza_public.suggest_subscriptions (user_id) where enabled;

-- ── items ──────────────────────────────────────────────────────────────────
--
-- The collected documents. Shared, deduplicated at the database level by the
-- two keys the pipeline deduplicates on, so a race between two concurrent polls
-- cannot create a second copy.

create table if not exists bza_public.suggest_items (
  id uuid primary key default gen_random_uuid(),
  feed_id uuid not null references bza_public.suggest_feeds(id) on delete cascade,
  -- Normalized by lib/suggest/normalize.ts `canonicalUrl`. The dedup key.
  canonical_url text not null,
  -- Exactly what the feed gave. Kept because canonicalization is LOSSY and
  -- occasionally wrong — a publisher whose article id is a query parameter can
  -- have its URLs collapsed — and when that happens the original is the only
  -- recovery path.
  original_url text not null,
  title text not null,
  summary text,
  -- `published_at` is nullable ON PURPOSE and must stay so. Defaulting a
  -- missing date to the poll time makes every undated item maximally fresh,
  -- which is exactly backwards: an item with no date is one we know nothing
  -- about the timeliness of. score.ts reads null as the neutral mid-value and
  -- says so in its explanation.
  published_at timestamptz,
  author text,
  text_content text,
  -- Each entry is {value, reason, confidence}. The reason is NOT decoration:
  -- the spec asks for classifications to be correctable, and a label whose
  -- provenance was dropped can only be deleted, not argued with.
  topic_tags jsonb not null default '[]'::jsonb,
  entities jsonb not null default '[]'::jsonb,
  article_type jsonb not null default '{}'::jsonb,
  -- Optional, and the pipeline's default path does not use it. Present only
  -- once an embedding provider has run. `real[]` rather than `vector` because
  -- pgvector is not installed and the clustering does its own cosine — adding
  -- an extension dependency for a column nothing currently writes would be
  -- buying a migration risk for an unused feature.
  embedding real[],
  story_cluster_id text,
  -- FNV-1a over the normalized headline and body. A dedup key, not a security
  -- hash; see the note in normalize.ts on why it is not sha256.
  content_hash text not null,
  first_seen_at timestamptz not null default now()
);

-- The two dedup keys, enforced here as well as in dedupeExact(). Application
-- dedup cannot protect against two polls running at once, and a duplicate pair
-- in this table would show the same article twice in one digest.
create unique index if not exists suggest_items_canonical_url_idx
  on bza_public.suggest_items (canonical_url);
create unique index if not exists suggest_items_content_hash_idx
  on bza_public.suggest_items (content_hash);

-- Candidate selection reads one window of recent items across many feeds.
create index if not exists suggest_items_recent_idx
  on bza_public.suggest_items (first_seen_at desc);
create index if not exists suggest_items_feed_idx
  on bza_public.suggest_items (feed_id, first_seen_at desc);
create index if not exists suggest_items_cluster_idx
  on bza_public.suggest_items (story_cluster_id)
  where story_cluster_id is not null;

-- ── interests ──────────────────────────────────────────────────────────────
--
-- Kept apart from item metadata, which the spec asks for and which matters more
-- than it looks. As a tag on an item, a preference could only be expressed by
-- editing items, would be unavailable for items not yet fetched, and would make
-- "what the user asked for" inseparable from "what the publisher said".

create table if not exists bza_public.suggest_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- topic | entity | question. A question is a real kind: "What could replace
  -- petrochemical feedstocks?" is matched differently from a topic — see the
  -- `viaQuestion` branch in score.ts `relevance`.
  kind text not null default 'topic',
  weight double precision not null default 0.5,
  -- What makes adjacent discovery distinguishable from outside-the-map
  -- discovery. Without a hierarchy there is only "matches" and "doesn't", and
  -- every unfamiliar item looks equally far away — the exact failure the two
  -- discovery buckets exist to avoid.
  parent_interest_id uuid references bza_public.suggest_interests(id) on delete set null,
  -- Whether the user set this weight by hand. Learned weights decay toward the
  -- prior each week; an explicit one is a statement, not an estimate, and
  -- decaying it would quietly undo something the user typed.
  explicit_feedback boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists suggest_interests_user_name_idx
  on bza_public.suggest_interests (user_id, lower(name));

-- ── digests ────────────────────────────────────────────────────────────────
--
-- What was shown, when, and under what settings.
--
-- `weights`, `plan`, `gaps` and `notes` are stored rather than recomputed, and
-- that is the point of the table. A digest built last week under weights the
-- user has since changed cannot be reproduced from current settings, so a
-- recomputed "why did this appear" would describe a run that never happened.

create table if not exists bza_public.suggest_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  -- The ScoreWeights and BucketPlan this run used.
  weights jsonb not null,
  plan jsonb not null,
  -- DigestGap[] — a bucket that could not be filled, with what ran out. Stored
  -- because a digest of fourteen when twenty were asked for is not the same
  -- object as a digest of fourteen that wanted fourteen, and §6's measurements
  -- read the difference.
  gaps jsonb not null default '[]'::jsonb,
  -- Digest-level notices, e.g. a relaxed source cap. Separate from gaps because
  -- a gap names a bucket and these do not.
  notes jsonb not null default '[]'::jsonb,
  -- How many candidates were considered and how many were rejected, so a thin
  -- digest can be explained without re-running the pipeline.
  candidates_considered integer not null default 0,
  candidates_rejected integer not null default 0
);

create index if not exists suggest_digests_user_idx
  on bza_public.suggest_digests (user_id, generated_at desc);

-- ── digest items ───────────────────────────────────────────────────────────
--
-- One row per slot. The record of what was shown, in which role, and why.

create table if not exists bza_public.suggest_digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references bza_public.suggest_digests(id) on delete cascade,
  -- Denormalized from the digest so a feedback write and the §6 measurements
  -- can filter by user without a join. Worth the duplication: every query here
  -- is user-scoped and the RLS policy needs the column anyway.
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references bza_public.suggest_items(id) on delete cascade,
  -- core | adjacent | outside | context | local
  bucket text not null,
  position integer not null,
  -- The six parts, unblended. Stored separately from `base` because a single
  -- number cannot answer "was it the relevance or the quality" — which is the
  -- question this whole design exists to keep answerable.
  parts jsonb not null,
  base double precision not null,
  selection_score double precision not null,
  penalties jsonb not null default '{}'::jsonb,
  -- The per-part explanations, as generated at selection time. Stored rather
  -- than regenerated for the same reason the weights are.
  because jsonb not null default '{}'::jsonb,
  matched_interests text[] not null default '{}',
  bridge_from text,
  bridge_to text,
  also_qualified_for text[] not null default '{}',
  -- Whether this slot was filled by back-fill rather than by qualifying.
  --
  -- LOAD-BEARING FOR HONESTY. §6's discovery hit rate is computed over
  -- non-back-filled discovery items only. Without this column, a digest whose
  -- discovery buckets had no candidates and were filled from the leftover pool
  -- would report a discovery hit rate over items that were never discovery.
  backfilled boolean not null default false,
  -- The story cluster as of this digest. Snapshotted rather than read through
  -- to suggest_items, because clustering re-runs and a later poll can move an
  -- item into a different cluster — which would retroactively change what the
  -- previous window's duplicate rate was measured against.
  story_cluster_id text
);

create unique index if not exists suggest_digest_items_slot_idx
  on bza_public.suggest_digest_items (digest_id, item_id);
create index if not exists suggest_digest_items_user_idx
  on bza_public.suggest_digest_items (user_id, digest_id);

-- ── feedback ───────────────────────────────────────────────────────────────
--
-- Explicit judgements and weak signals, in ONE table with a kind column but
-- never summed together.
--
-- One table because they are both "something the user did to an item" and a
-- second table would mean every read doing a union. The separation that matters
-- is enforced where it is acted on, in lib/suggest/feedback.ts: an explicit
-- judgement moves a weight by EXPLICIT_STEP, a weak signal by WEAK_STEP, which
-- is an order of magnitude smaller, and there is no negative weak signal at all
-- because "did not click" is evidence about the fold and the week, not about
-- the topic.

create table if not exists bza_public.suggest_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references bza_public.suggest_items(id) on delete cascade,
  -- Which digest it was shown in. Nullable: a user can react to an item they
  -- found by browsing rather than through a digest.
  digest_id uuid references bza_public.suggest_digests(id) on delete set null,
  -- Explicit: more_like_this | less_like_this | interesting_not_useful |
  --           already_saw | worth_seeing
  -- Weak:     opened | dwell_ms
  kind text not null,
  -- Set only for weak signals that carry a magnitude (dwell_ms).
  value double precision,
  -- The bucket the item was shown in, needed for the discovery hit rate. Copied
  -- here rather than joined because the digest row may be gone.
  shown_as_bucket text,
  created_at timestamptz not null default now()
);

create index if not exists suggest_feedback_user_idx
  on bza_public.suggest_feedback (user_id, created_at desc);
create index if not exists suggest_feedback_item_idx
  on bza_public.suggest_feedback (user_id, item_id);

-- ── user settings ──────────────────────────────────────────────────────────
--
-- The weights, the bucket plan, the regions and the desired-topic list.
--
-- A single row per user holding jsonb rather than a column per weight. The
-- spec's §3 says the weights are "starting points, not facts about your
-- preferences" and must be visible and adjustable; a column per weight would
-- mean a migration to add a seventh scoring term, and the whole point of this
-- design is that the term list is expected to grow.

create table if not exists bza_public.suggest_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Null means "use DEFAULT_WEIGHTS from lib/suggest/score.ts". Storing the
  -- defaults would freeze them: a user who never touched the sliders would be
  -- pinned to whatever the defaults were on the day they signed up.
  weights jsonb,
  plan jsonb,
  regions text[] not null default '{}',
  -- Topics the user says they want covered. Read by §6's coverage-gap
  -- measurement, which reports the ones no enabled feed reached — a desired
  -- topic with no eligible items is a feed-list problem, not a ranking problem.
  desired_topics text[] not null default '{}',
  quality_floor double precision,
  updated_at timestamptz not null default now()
);

-- ── row level security ─────────────────────────────────────────────────────
--
-- Owner-only on the five per-user tables. The two shared tables are
-- read-for-everyone, write-for-nobody — see the header for why they have no
-- user_id, and note that nothing about a user is derivable from them: a row in
-- `suggest_items` says a feed published something, not that anybody read it.

alter table bza_public.suggest_feeds         enable row level security;
alter table bza_public.suggest_items         enable row level security;
alter table bza_public.suggest_subscriptions enable row level security;
alter table bza_public.suggest_interests     enable row level security;
alter table bza_public.suggest_digests       enable row level security;
alter table bza_public.suggest_digest_items  enable row level security;
alter table bza_public.suggest_feedback      enable row level security;
alter table bza_public.suggest_settings      enable row level security;

-- The shared half: any signed-in user may read the catalogue and the items.
-- Writes go through the service role, which bypasses RLS — polling is a server
-- job and a client that could insert items could poison every subscriber's
-- digest.
do $$ begin
  create policy "read feeds" on bza_public.suggest_feeds
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "read items" on bza_public.suggest_items
    for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- The private half.
do $$ begin
  create policy "own subscriptions" on bza_public.suggest_subscriptions
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own interests" on bza_public.suggest_interests
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own digests" on bza_public.suggest_digests
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own digest items" on bza_public.suggest_digest_items
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own feedback" on bza_public.suggest_feedback
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own suggest settings" on bza_public.suggest_settings
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Grants are automatic in this schema (migration 57 installed default
-- privileges), and are stated explicitly here for the one reader who checks.
-- The two shared tables get select only: insert/update/delete on them is the
-- service role's job.
grant select on bza_public.suggest_feeds to authenticated;
grant select on bza_public.suggest_items to authenticated;
grant select, insert, update, delete on bza_public.suggest_subscriptions to authenticated;
grant select, insert, update, delete on bza_public.suggest_interests     to authenticated;
grant select, insert, update, delete on bza_public.suggest_digests       to authenticated;
grant select, insert, update, delete on bza_public.suggest_digest_items  to authenticated;
grant select, insert, update, delete on bza_public.suggest_feedback      to authenticated;
grant select, insert, update, delete on bza_public.suggest_settings      to authenticated;

-- REMEMBER: `bza_public` must be in the project's PostgREST "Exposed schemas"
-- list, or every select here returns an empty result set with a 200 rather than
-- an error. It already is, from migration 57.
