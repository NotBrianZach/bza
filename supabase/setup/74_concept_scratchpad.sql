-- 74 — a working scratchpad for practice
--
-- One table, in `bza_public`. Additive and idempotent.
--
-- ── Why not reuse `typst_scratchpad` ──────────────────────────────────────
--
-- There is already a scratchpad table, keyed on `(user_id, book_id, page_num)`.
-- It belongs to the reader: a note attached to a page of a text. Practice has
-- no book and no page, so using it would mean inventing a fake book id for
-- every subject — a foreign key pointing at nothing, and a table whose key no
-- longer means what its name says.
--
-- ── Why one buffer per SUBJECT, not per task ──────────────────────────────
--
-- Per-task was the first instinct and it is wrong. The scratchpad is where you
-- work something out, and working something out spans problems: you derive a
-- rule on one task and use it on the next three. A buffer that emptied with
-- each task would throw away the thing it exists to hold, and would make the
-- chat's ability to write into it nearly useless — whatever it wrote would
-- vanish on the next answer.
--
-- One buffer per subject is the org-mode scratch model: a single file you keep
-- adding to, which you can scroll back through. Per-task notes can still live
-- in it; they are just not the unit of storage.
--
-- ── What is in it ─────────────────────────────────────────────────────────
--
-- Markdown with LaTeX, rendered with remark-math and rehype-katex — the same
-- pipeline the reader and the flashcards already use, so `$x^2$` and `$$...$$`
-- behave the way they do everywhere else in the app and the way they do in org
-- mode. Stored as plain text: the rendering is a view, and keeping the source
-- means a block that fails to render can still be read and fixed.

create table if not exists bza_public.concept_scratchpads (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The subject id from the authored ontology, NOT a foreign key — the
  -- ontology is code, not data. Same reasoning as
  -- `concept_point_strength.knowledge_point_id`: a renamed subject would
  -- otherwise need a migration, and an orphaned buffer is harmless.
  subject_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

alter table bza_public.concept_scratchpads enable row level security;

-- Owner-only. A scratchpad is as private as a practice record, and more so —
-- it is unfinished thinking.
do $$ begin
  create policy "own concept scratchpads" on bza_public.concept_scratchpads
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.concept_scratchpads to authenticated;
