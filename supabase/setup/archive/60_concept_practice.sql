-- 60 — the fifth registry's state: strength, evidence, and a traversal
--
-- Three tables, in `bza_public` (migration 57 set default privileges there, so
-- the grants are automatic — see the refusal in scripts/db-migrate.sh).
--
-- WHY NONE OF THIS GOES IN `listen_turns`, which is the obvious place and the
-- wrong one. A correlation turn is a node in a graph: it has a parent edge, a
-- relation, a reply, and a world that is folded along the path that reached it.
-- A practice observation has none of those. It answers no earlier observation, it
-- carries no relation, and a review assignment that draws from four concepts is
-- not a branch of anything. Spaced practice is cross-session and strength-driven;
-- a turn graph is a branch within a session. Putting one in the other's table
-- would mean every query on either having to say which kind of row it meant.
--
-- So this is a sibling engine's state, and the only thing it shares with the
-- correlation games is the registries in frontend/lib/correlate/ — media,
-- relations, tuning and scope. See frontend/lib/concepts/.
--
-- Additive and idempotent. No existing table is touched, no column is dropped
-- and no constraint is relaxed, so unlike migrations 52, 53 and 59 this one has
-- no deploy-ordering hazard: the code that reads these tables is new, and until
-- it ships nothing selects them.

-- ── strength ───────────────────────────────────────────────────────────────
--
-- One row per (user, knowledge point). The authoritative state of the scheduler,
-- and every column here is read by frontend/lib/concepts/scheduling.ts.
--
-- The two timestamps are the subtle part and they are deliberately not one
-- column. See the comments on each.

create table if not exists bza_public.concept_point_strength (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The knowledge point id from the authored ontology (lib/concepts/ontology.ts),
  -- NOT a foreign key: the ontology is code, not data. A row whose point has been
  -- renamed or deleted is harmless — the scheduler reads the ontology for what
  -- exists and this table only for how strong it is — and a constraint here would
  -- mean every ontology edit needed a migration.
  knowledge_point_id text not null,
  -- 0..1 as of `last_demonstrated_at`. Decayed on read, never on write: a decayed
  -- value written back would compound, and the elapsed time is derivable.
  strength double precision not null default 0,
  -- Consecutive unaided successes. Drives the half-life. Reset by any failure.
  streak integer not null default 0,
  -- Counted apart, and never added together. A hint-assisted correct answer and
  -- an independent one are different observations; collapsing them is exactly
  -- what bza's own quiz path does (`mastered = score >= 0.6` in
  -- lib/queries/knowledge-graph.ts) and exactly what this design exists to avoid.
  unaided_successes integer not null default 0,
  assisted_successes integer not null default 0,
  failures integer not null default 0,
  -- When strength was last *earned*: an unaided success, or credit propagated
  -- along an `encompasses` edge from one. Decay is measured from here.
  last_demonstrated_at timestamptz,
  -- When the point was last attempted at all — including assisted successes,
  -- failures, and inconclusive rulings. A completely different job: it suppresses
  -- re-serving the same point twenty minutes later, and it must never affect
  -- decay. An assisted success that reset the decay clock would push a point the
  -- learner has not demonstrated further out of review.
  updated_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  primary key (user_id, knowledge_point_id)
);

-- The assembly query reads every row for one user and orders by strength in the
-- application (decay has to be applied first, so the database cannot order it).
-- A covering index on user_id is therefore the whole of what is needed.
create index if not exists concept_point_strength_user_idx
  on bza_public.concept_point_strength (user_id);

-- ── observations ───────────────────────────────────────────────────────────
--
-- The evidence record: every attempt, with the verdict as ruled and how much help
-- the learner had. Append-only in practice; nothing updates a row except the
-- review flag.

create table if not exists bza_public.concept_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  knowledge_point_id text not null,
  task_id text not null,
  kind text not null,
  -- 'correct' | 'incorrect' | 'inconclusive' | 'abandoned'.
  --
  -- `inconclusive` is a first-class ruling and is NEVER scored as wrong. The
  -- engine failing to settle a question is a statement about the engine, not
  -- about the learner. The check below makes that a schema fact rather than a
  -- convention: a row cannot claim an inconclusive ruling and a scored one.
  ruling text not null check (ruling in ('correct', 'incorrect', 'inconclusive', 'abandoned')),
  -- Whether this observation moved the learner's strength. Derived from `ruling`
  -- and `assistance` by the application, stored so a later change to the policy
  -- cannot silently rewrite the history of what was counted at the time.
  scored boolean not null default false,
  -- How it was decided. An inconclusive ruling names what it tried.
  method text,
  assistance text not null default 'none' check (assistance in ('none', 'hint', 'worked_example')),
  -- { step, detail } — the first step that does not follow. This is what replaces
  -- the correlation engine's reply guarantee: there, a failed turn gets a salvaged
  -- offering; here it gets a located error.
  broke_at jsonb,
  -- The domain the ruling holds on. Never dropped: (x^2-1)/(x-1) and x+1 are
  -- different functions and the difference is exactly x != 1.
  conditions text[] not null default '{}',
  -- What the learner submitted, verbatim, and how the parser read it. Both,
  -- because a disagreement between the two is the most common cause of a verdict
  -- the learner thinks is wrong.
  answer text,
  answer_as_read text,
  elapsed_ms integer,
  -- { runId, engineVersion, environmentHash, evidenceKind, cached } from the
  -- math-workbench worker's ledger. Null when nothing was run — an unconfigured
  -- worker, or a form check that settled the question locally.
  evidence jsonb,
  -- Set for an inconclusive ruling that an engine actually attempted. An
  -- inconclusive produced because no worker is configured is an operational fact
  -- about the deployment, not a question for a human, and queueing those would
  -- bury the real ones. See `needsReview` in lib/concepts/verify.ts.
  needs_review boolean not null default false,
  reviewed_at timestamptz,
  reviewed_ruling text check (reviewed_ruling in ('correct', 'incorrect', 'inconclusive', 'abandoned')),
  created_at timestamptz not null default now(),
  -- A scored observation is one the policy counted. An inconclusive or abandoned
  -- one never is, and this is the independent enforcement of that rule — the
  -- other two being `isScorable` in verify.ts and `applyObservation` in
  -- scheduling.ts. Three places, on purpose: it is the rule most likely to be
  -- violated by a later convenience, and a convenience that has to defeat a
  -- check constraint is a convenience somebody notices.
  constraint concept_observations_scored_is_settled
    check (not scored or ruling in ('correct', 'incorrect'))
);

create index if not exists concept_observations_user_point_idx
  on bza_public.concept_observations (user_id, knowledge_point_id, created_at desc);

-- The review queue. Partial, because the rows that need review are a small
-- fraction and a full index would mostly store the answer 'false'.
create index if not exists concept_observations_review_idx
  on bza_public.concept_observations (user_id, created_at desc)
  where needs_review and reviewed_at is null;

-- ── traversal ──────────────────────────────────────────────────────────────
--
-- One walk through one subject. The `navigation` game's world, relabelled: `here`
-- is the concept you are standing in, `reached` is the atlas (each entry carrying
-- the one point that fixed it), `route` is the order of arrival.
--
-- The frontier is NOT stored. It is derived from the ontology and the route every
-- time (`frontier()` in lib/concepts/traversal.ts), because a stored frontier is
-- a cache of a walk over a graph the author edits — and the first time the
-- ontology gains an edge, every stored frontier becomes a lie that nothing
-- recomputes.

create table if not exists bza_public.concept_traversals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  -- { here, reached: [{ conceptId, detail, at }], route: [conceptId] }
  world jsonb not null default '{"here": null, "reached": [], "route": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One live traversal per subject per person. A second walk through the same
-- subject is the same walk continued — the route is the thing being built, and
-- two of them would make "what have you reached" ambiguous.
create unique index if not exists concept_traversals_user_subject_idx
  on bza_public.concept_traversals (user_id, subject_id);

-- ── row level security ─────────────────────────────────────────────────────
--
-- Owner-only on all three, which is the whole of the policy: none of this is
-- shared, none of it is public, and a practice record is as private as a reading
-- history. Same shape as `listen_sessions`.

alter table bza_public.concept_point_strength enable row level security;
alter table bza_public.concept_observations   enable row level security;
alter table bza_public.concept_traversals     enable row level security;

do $$ begin
  create policy "own concept strength" on bza_public.concept_point_strength
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own concept observations" on bza_public.concept_observations
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own concept traversals" on bza_public.concept_traversals
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Grants are automatic in this schema — migration 57 installed
--     alter default privileges in schema bza_public grant ... on tables
-- so every table created here is granted to anon/authenticated as it is created.
-- Stated explicitly for the one reader who checks: that is also why
-- scripts/db-migrate.sh's GRANT refusal does not fire on this file, since it
-- only inspects `create table` landing in `public`.
--
-- REMEMBER: `bza_public` must be in the project's PostgREST "Exposed schemas"
-- list, or every select here returns an empty result set with a 200 rather than
-- an error. It already is, from migration 57 — this is a note for whoever adds
-- the next schema.
grant select, insert, update, delete on bza_public.concept_point_strength to authenticated;
grant select, insert, update, delete on bza_public.concept_observations   to authenticated;
grant select, insert, update, delete on bza_public.concept_traversals     to authenticated;
