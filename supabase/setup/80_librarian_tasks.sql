-- 80_librarian_tasks.sql — a user-schedulable librarian, and the retrieval it needs.
--
-- The ask was infrastructure rather than a feature: somewhere a reader can say
-- "every morning, show me something and tie it to my library", and have the
-- platform carry it. The worked example was a daily OEIS sequence, associated
-- every other time with something they have been reading, biased by frecency
-- and matched by similarity. Nothing here mentions OEIS — that example is one
-- row in `librarian_tasks` once this exists.
--
-- Four pieces, in dependency order: the extension, embeddings over the
-- library, a frecency view, and the task tables.
--
-- ── WHY EMBEDDINGS ARE PER-BOOK AND NOT PER-CHUNK ─────────────────────────
--
-- Chunked retrieval is the right answer for "quote the passage that says X"
-- and the wrong one for "which of my books does this relate to". The second is
-- what a librarian task asks, and it wants one vector per book so that a
-- ranking is over books rather than over fragments that then need collapsing.
-- Chunk-level can be added beside this later; it is a different table with a
-- different question, not a finer version of this one.
--
-- `source` records WHAT was embedded rather than assuming it, because the
-- honest input varies: a book with a summary should be embedded on title plus
-- summary, one without on title plus an opening slice. A ranking is not
-- interpretable unless you can see which of those produced it.
--
-- ── WHY THE DIMENSION IS PINNED IN THE COLUMN ─────────────────────────────
--
-- `vector(1536)` is text-embedding-3-small. Pinning it means a model change is
-- a migration rather than a silent corruption: mixing dimensions in one column
-- is rejected by Postgres, and mixing MODELS at the same dimension is not —
-- the second is the dangerous one, so `model` is stored per row and the API
-- filters on it. Rows from a retired model stay readable and stop being
-- compared.

-- ---------------------------------------------------------------------------
-- 1. pgvector
-- ---------------------------------------------------------------------------
-- In `extensions`, which is where Supabase puts them and where the role that
-- runs this migration is allowed to create one.
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- 2. Embeddings over the library
-- ---------------------------------------------------------------------------
create table if not exists bza_public.book_embeddings (
  book_id bigint not null references bza_public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Which model produced it. Compared only against rows of the same model;
  -- see the note above on why same-dimension mixing is the real hazard.
  model text not null,
  embedding extensions.vector(1536) not null,
  -- What text went in: 'title+summary', 'title+opening', etc. Descriptive, not
  -- an enum — a new recipe should not need a migration to be recorded.
  source text not null,
  -- Digest of the embedded text, so a re-embed can be skipped when nothing has
  -- changed. Cheaper than comparing the text and it keeps the text out of this
  -- table, which already lives beside the book that holds it.
  source_hash text not null,
  embedded_at timestamptz not null default now(),
  -- One row per book per model. Re-embedding the same book on the same model
  -- replaces rather than accumulates.
  primary key (book_id, model)
);

create index if not exists book_embeddings_user_idx
  on bza_public.book_embeddings (user_id, model);

-- HNSW rather than IVFFlat: it needs no training pass, so it is correct on an
-- empty table and on a library of twelve books, which is the state every new
-- account is in. IVFFlat's lists have to be tuned to a row count that does not
-- exist yet.
--
-- Cosine, because the embeddings are normalised and cosine is what the
-- provider's own similarity is defined in. Matching the provider matters more
-- than the marginal speed of inner product on normalised vectors.
create index if not exists book_embeddings_hnsw_idx
  on bza_public.book_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table bza_public.book_embeddings enable row level security;

do $$ begin
  create policy "own book embeddings" on bza_public.book_embeddings
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.book_embeddings to authenticated;

comment on table bza_public.book_embeddings is
  'One vector per book per model, for "which of my books relates to this". '
  'Per-book on purpose — chunk-level retrieval answers a different question '
  'and belongs in its own table.';

-- ---------------------------------------------------------------------------
-- 3. Frecency
-- ---------------------------------------------------------------------------
-- Frequency times recency, as one number a task can order by.
--
-- A VIEW rather than a stored column, because every input already lives
-- somewhere authoritative and a materialised copy would be a second truth that
-- goes stale the moment somebody reads a page. It is cheap: the inputs are
-- small per user and indexed by user_id.
--
-- THE DECAY IS HALF-LIFE, NOT A WINDOW. A thirty-day cutoff makes a book
-- vanish on day thirty-one and makes "recently read" a cliff; a half-life
-- makes it a slope, so a book read often long ago can still outrank one
-- skimmed once last week. Thirty days is the half-life, chosen so a month-old
-- habit still counts for half of what it did.
--
-- `sessions` is capped by `least(..., 10)` before the log so that one
-- obsessive week cannot permanently pin a book to the top — frequency should
-- distinguish "read repeatedly" from "read once", and past about ten sessions
-- it is no longer saying anything new.
create or replace view bza_public.book_frecency as
select
  b.id as book_id,
  b.user_id,
  b.title,
  b.content_type,
  b.last_read_at,
  coalesce(s.session_count, 0) as session_count,
  (
    (1 + ln(1 + least(coalesce(s.session_count, 0), 10)))
    * exp(
        -ln(2)
        * extract(epoch from (now() - coalesce(b.last_read_at, b.created_at)))
        / (30 * 24 * 3600)
      )
  )::double precision as frecency
from bza_public.books b
left join (
  select book_id, count(*) as session_count
  from bza_public.reading_sessions
  group by book_id
) s on s.book_id = b.id
where b.deleted_at is null;

comment on view bza_public.book_frecency is
  'Frequency x recency per book, as one orderable number. Recency decays on a '
  '30-day half-life rather than a cutoff, and session count is capped at 10 '
  'before the log so one heavy week cannot pin a book forever.';

grant select on bza_public.book_frecency to authenticated;

-- ---------------------------------------------------------------------------
-- 4. The tasks themselves
-- ---------------------------------------------------------------------------
-- ── WHY `next_run_at` IS STORED RATHER THAN DERIVED ───────────────────────
--
-- The runner asks one question — "which tasks are due?" — and that has to be
-- an indexed comparison, not a cron expression evaluated per row in the
-- application. Storing the next time also makes a task's schedule inspectable
-- and a misfire visible: a `next_run_at` in the distant past says the runner
-- has not been running, which a derived value would hide by always producing
-- "now".
--
-- The cron text is kept beside it as the SOURCE of that timestamp, so the two
-- can be checked against each other and a bad expression is caught when it is
-- saved rather than at 6am.
create table if not exists bza_public.librarian_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- What the librarian is asked to do, in the user's own words. Free text and
  -- never parsed: this is the prompt, and the whole point of the feature is
  -- that the platform does not have to know what an OEIS sequence is.
  instructions text not null,
  -- Standard 5-field cron, interpreted in `timezone`. Validated by the API on
  -- write; stored as text because a schedule is a human-edited thing and
  -- round-tripping it through a parsed form would lose the author's spelling.
  cron text not null,
  timezone text not null default 'UTC',
  enabled boolean not null default true,
  -- Capabilities this task may use. An allow-list rather than a free-for-all
  -- so a task that only wants the web cannot quietly read the library.
  capabilities text[] not null default array['library', 'similarity', 'web']::text[],
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint librarian_tasks_name_not_blank check (length(btrim(name)) > 0),
  constraint librarian_tasks_instructions_not_blank check (length(btrim(instructions)) > 0)
);

-- The runner's only query. Partial on `enabled` because a disabled task should
-- cost nothing to skip, and most tasks in a mature table will be disabled.
create index if not exists librarian_tasks_due_idx
  on bza_public.librarian_tasks (next_run_at)
  where enabled;

create index if not exists librarian_tasks_user_idx
  on bza_public.librarian_tasks (user_id, created_at desc);

alter table bza_public.librarian_tasks enable row level security;

do $$ begin
  create policy "own librarian tasks" on bza_public.librarian_tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.librarian_tasks to authenticated;

-- ── Runs ──────────────────────────────────────────────────────────────────
--
-- Every firing leaves a row, including the ones that fail. A scheduled thing
-- whose failures are invisible is worse than one that does not run: the user
-- concludes the feature is pointless rather than that it is broken, which is
-- the shape the Reddit feeds and the cover art both had.
create table if not exists bza_public.librarian_task_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references bza_public.librarian_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  -- What the librarian produced, as markdown. Null while running or on failure.
  output text,
  -- Which books it cited, so "associate it with my library" is auditable
  -- rather than a claim in prose. Ids, resolved by the reader.
  cited_book_ids bigint[] not null default array[]::bigint[],
  error text,
  constraint librarian_task_runs_status_check
    check (status = any (array['running'::text, 'ok'::text, 'failed'::text, 'skipped'::text]))
);

create index if not exists librarian_task_runs_task_idx
  on bza_public.librarian_task_runs (task_id, started_at desc);

create index if not exists librarian_task_runs_user_idx
  on bza_public.librarian_task_runs (user_id, started_at desc);

alter table bza_public.librarian_task_runs enable row level security;

do $$ begin
  create policy "own librarian task runs" on bza_public.librarian_task_runs
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.librarian_task_runs to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Similarity search, as a function
-- ---------------------------------------------------------------------------
-- In the database rather than the API, because the alternative is shipping
-- every embedding to the worker and ranking there — which is the one thing
-- pgvector exists to avoid, and which gets slower exactly as a library gets
-- interesting.
--
-- `security invoker` so RLS applies: the caller sees their own embeddings and
-- nobody else's, enforced by the same policy as a direct select rather than by
-- this function remembering to filter.
--
-- Frecency is blended rather than applied as a filter. `weight` at 0 is pure
-- similarity and at 1 is pure frecency; the default leans to similarity
-- because a task asking "what does this relate to" wants relevance first and
-- recency as a tiebreak. Both terms are in [0, 1] — cosine distance is
-- subtracted from 1, and frecency is divided by the user's own maximum — so
-- the weight means what it looks like.
create or replace function bza_public.match_books(
  query_embedding extensions.vector(1536),
  match_model text,
  match_count int default 5,
  frecency_weight double precision default 0.25
)
returns table (
  book_id bigint,
  title text,
  similarity double precision,
  frecency double precision,
  score double precision
)
language sql
stable
security invoker
set search_path = bza_public, extensions, public
as $$
  with scored as (
    select
      e.book_id,
      f.title,
      1 - (e.embedding <=> query_embedding) as similarity,
      coalesce(f.frecency, 0) as frecency,
      max(coalesce(f.frecency, 0)) over () as max_frecency
    from bza_public.book_embeddings e
    join bza_public.book_frecency f on f.book_id = e.book_id
    where e.model = match_model
  )
  select
    book_id,
    title,
    similarity,
    frecency,
    (1 - frecency_weight) * similarity
      + frecency_weight * (case when max_frecency > 0 then frecency / max_frecency else 0 end)
      as score
  from scored
  order by score desc
  limit match_count;
$$;

comment on function bza_public.match_books is
  'Rank the caller''s books against a query vector, blending cosine similarity '
  'with normalised frecency. security invoker, so RLS does the scoping.';

grant execute on function bza_public.match_books to authenticated;
