-- knowledge_nodes / knowledge_edges: the DDL that was never tracked.
--
-- ── WHY THIS FILE IS DATED AFTER THE TABLES IT CREATES ────────────────────
--
-- These two tables have been live in bza_public for some time and are read and
-- written by frontend/lib/queries/knowledge-graph.ts and by the
-- build-knowledge-graph edge function. Their DDL appeared in no .sql under
-- supabase/setup/, so the schema existed only in the running database: the
-- authority for "what shape is this table" was a psql session, and a rebuild
-- from this directory would have produced a database the application could not
-- use.
--
-- Everything below was read back out of production with information_schema and
-- pg_catalog and is written to match it, not to improve on it. That is the
-- point: this file is a transcription, so replaying setup/ converges on the
-- database that already exists. Two things it transcribes are wrong; both are
-- called out where they appear rather than quietly corrected, because changing
-- a grant or adding a constraint is a behaviour change and belongs in its own
-- migration with its own reasoning.
--
-- Idempotent throughout, since the tables are already there in every
-- environment that matters.

-- ── nodes ─────────────────────────────────────────────────────────────────
--
-- The SM-2 columns live HERE, on a graph node, rather than in a separate cards
-- table. Worth noticing before building any scheduler: the spaced-repetition
-- state and the prerequisite structure are already in the same place, so a
-- graph-aware scheduler needs no new storage — only a traversal that
-- lib/queries/knowledge-graph.ts does not currently perform (updateMastery
-- writes a single row, `.eq('id', nodeId)`, and never reads an edge).
--
-- Scope is (book_id, user_id): a node is one user's understanding of one
-- concept in one book. The same concept in two books is two unrelated rows
-- with independent review state and nothing linking them, which bounds how far
-- any propagation can reach.
create table if not exists bza_public.knowledge_nodes (
  id               bigserial primary key,
  book_id          bigint      not null references bza_public.books (id) on delete cascade,
  user_id          uuid        not null references auth.users (id)       on delete cascade,
  label            text        not null,
  description      text,
  page_refs        integer[]   not null default '{}'::integer[],

  -- Mastery, as currently defined by updateMastery: `mastered = score >= 0.6`,
  -- with no record of whether the answer was assisted. A hint-assisted success
  -- and an independent one are stored identically and are indistinguishable
  -- afterwards.
  mastered         boolean     not null default false,
  mastery_score    numeric     not null default 0,

  -- SM-2.
  interval_days    integer     not null default 1,
  ease_factor      numeric     not null default 2.50,
  repetitions      integer     not null default 0,
  next_review_at   timestamptz not null default now(),
  last_reviewed_at timestamptz,

  created_at       timestamptz not null default now()
);

-- ── edges ─────────────────────────────────────────────────────────────────
--
-- DIRECTED AND PREREQUISITE. from_node is a prerequisite of to_node: you must
-- understand from_node before to_node. That claim is not recorded anywhere in
-- this schema -- there is no relationship/kind column, because prerequisite is
-- the only kind these rows have ever held -- and it originates in the
-- extractor prompt in supabase/functions/build-knowledge-graph/index.ts.
--
-- So the direction of any credit propagation is BACKWARDS along these edges: a
-- successful observation at to_node is evidence about from_node, not the other
-- way round. Easy to invert, and nothing in the schema would catch it.
--
-- WRONG #1, transcribed deliberately: there is no CHECK (from_node <> to_node)
-- and no cycle prevention of any kind. The edge function filters self-loops in
-- JavaScript before inserting, so the data is clean today, but the constraint
-- does not exist and any other writer -- a direct insert, a future importer --
-- can create one. Longer cycles are prevented by nothing at all, in any layer:
-- "No cycles allowed" is a line in an LLM prompt. A traversal that assumes a
-- DAG here will loop.
create table if not exists bza_public.knowledge_edges (
  id        bigserial primary key,
  book_id   bigint not null references bza_public.books (id)            on delete cascade,
  from_node bigint not null references bza_public.knowledge_nodes (id)   on delete cascade,
  to_node   bigint not null references bza_public.knowledge_nodes (id)   on delete cascade,
  unique (from_node, to_node)
);

-- ── indexes ───────────────────────────────────────────────────────────────
--
-- knowledge_edges carries both knowledge_edges_from_node_to_node_key (the
-- UNIQUE above) and a separate idx_knowledge_edges_from_to over the same two
-- columns in the same order. The second is redundant -- the unique constraint's
-- index already serves any lookup it would -- and is transcribed only because
-- it is really there. Dropping it is safe but is not this file's job.
create index if not exists knowledge_nodes_book_user_idx
  on bza_public.knowledge_nodes (book_id, user_id);

-- Partial, matching countDueNodes()'s exact predicate: mastered rows due now
-- for one user.
create index if not exists knowledge_nodes_due_idx
  on bza_public.knowledge_nodes (user_id, next_review_at)
  where mastered = true;

create index if not exists knowledge_edges_from_idx
  on bza_public.knowledge_edges (from_node);
create index if not exists knowledge_edges_book_idx
  on bza_public.knowledge_edges (book_id);
create index if not exists idx_knowledge_edges_from_to
  on bza_public.knowledge_edges (from_node, to_node);

-- ── RLS ───────────────────────────────────────────────────────────────────
--
-- Enabled on both, one ALL policy each. The edges policy reaches through
-- from_node to the owning node, so an edge is visible exactly when its
-- prerequisite endpoint is -- note it does NOT also check to_node.
alter table bza_public.knowledge_nodes enable row level security;
alter table bza_public.knowledge_edges enable row level security;

drop policy if exists knowledge_nodes_owner on bza_public.knowledge_nodes;
create policy knowledge_nodes_owner on bza_public.knowledge_nodes
  for all using (auth.uid() = user_id);

drop policy if exists knowledge_edges_owner on bza_public.knowledge_edges;
create policy knowledge_edges_owner on bza_public.knowledge_edges
  for all using (
    exists (
      select 1 from bza_public.knowledge_nodes n
       where n.id = bza_public.knowledge_edges.from_node
         and n.user_id = auth.uid()
    )
  );

-- ── grants ────────────────────────────────────────────────────────────────
--
-- WRONG #2, and the reason this block is split out and loud. Production grants
-- `anon` the full write set on both tables -- INSERT, UPDATE, DELETE and
-- TRUNCATE -- almost certainly a GRANT ALL that was never narrowed.
--
-- RLS covers most of it: an anonymous request has a null auth.uid(), so the
-- owner policies above match no rows and INSERT/UPDATE/DELETE do nothing.
-- TRUNCATE is the exception and it is not a small one: PostgreSQL does not
-- apply row-level security to TRUNCATE at all. It is gated by table privilege
-- only, which `anon` has. Nothing is exploitable through PostgREST today
-- because PostgREST exposes no TRUNCATE verb, so this is a latent hole rather
-- than an open one -- it becomes real the moment anything else can reach the
-- database with the anon role.
--
-- Transcribed as-is so this file still describes production. The revoke
-- belongs in its own migration; see the TODO raised alongside this one.
grant select, insert, update, delete on bza_public.knowledge_nodes to authenticated;
grant select, insert, update, delete on bza_public.knowledge_edges to authenticated;
grant all on bza_public.knowledge_nodes to service_role;
grant all on bza_public.knowledge_edges to service_role;

-- Observed in production and deliberately NOT reproduced: the anon write
-- grants described above. Replaying this file on a fresh database therefore
-- produces a *safer* schema than production, and the two will differ until the
-- revoke migration lands. That divergence is intentional and is the one place
-- this transcription knowingly departs from what is deployed:
--
--   -- production also has, and should not:
--   -- grant insert, update, delete, truncate on bza_public.knowledge_nodes to anon;
--   -- grant insert, update, delete, truncate on bza_public.knowledge_edges to anon;
grant select on bza_public.knowledge_nodes to anon;
grant select on bza_public.knowledge_edges to anon;

grant usage, select on sequence bza_public.knowledge_nodes_id_seq to authenticated, service_role;
grant usage, select on sequence bza_public.knowledge_edges_id_seq to authenticated, service_role;
