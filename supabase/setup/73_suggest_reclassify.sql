-- 73 — let a classifier fix reach items that are already stored
--
-- Two columns. Additive and idempotent; nothing existing is touched.
--
-- ── The problem ────────────────────────────────────────────────────────────
--
-- Classification happens at INGEST, not at digest time, and that is deliberate:
-- a label recomputed on every digest cannot be corrected, because the next run
-- would overwrite the correction. The spec asks for the reason behind each
-- label to be kept "so classifications can be corrected", and storing them once
-- is what makes that possible.
--
-- The cost is that improving the classifier does nothing for rows already
-- stored. That cost was paid twice in one session: the fix for arXiv taxonomy
-- codes being read as unfamiliar material, and the fix for aggregator items
-- being mislabelled `opinion`, both required DELETING the stored items and
-- re-polling before they took effect. On a real corpus that is not an option —
-- re-polling throws away everything the feeds no longer carry.
--
-- ── Why a blind re-run would be worse than the problem ────────────────────
--
-- A pass that simply recomputed every row would foreclose the correctability
-- that justified classifying at ingest in the first place. The moment a review
-- UI exists, the next pass silently destroys every correction. So the guard has
-- to exist BEFORE the pass, not after somebody notices.
--
-- `labels_reviewed_at` is that guard: a row a human has adjudicated is never
-- recomputed. `classifier_version` makes the pass incremental, so it touches
-- only rows behind the current classifier rather than rewriting the table on
-- every run.
--
-- ── Why these live on the SHARED row, unlike feed tags ────────────────────
--
-- `suggest_items` has no user_id, and migration 71's header explains why a
-- user's feed tags must NOT be written here: they are that person's private
-- vocabulary, so storing them lets one subscriber shape everybody's relevance.
--
-- A label correction is a different kind of claim. "This is an explainer, not
-- news" and "this entity is not a real entity" are assertions about the
-- DOCUMENT, true or false independently of who is reading — so one person
-- fixing them is a correction for everyone, which is exactly what should
-- happen. The distinction is personal preference versus a fact about the item,
-- and it is the reason one belongs on the shared row and the other does not.

alter table bza_public.suggest_items
  add column if not exists classifier_version integer not null default 0;

alter table bza_public.suggest_items
  add column if not exists labels_reviewed_at timestamptz;

comment on column bza_public.suggest_items.classifier_version is
  'Which CLASSIFIER_VERSION (lib/suggest/tags.ts) produced this row''s labels. Rows below the current value are re-classified incrementally; bump the constant when the cue lists or entity extraction change.';

comment on column bza_public.suggest_items.labels_reviewed_at is
  'Set when a human adjudicated this item''s labels. Re-classification SKIPS these rows — without it, a pass would destroy every correction and defeat the reason classification happens at ingest.';

-- The re-classification pass asks exactly one question: which rows are behind
-- the current classifier and not human-reviewed? A partial index answers it
-- without scanning the table, and excludes the reviewed rows at the index
-- level so they cost nothing to skip.
create index if not exists suggest_items_stale_labels_idx
  on bza_public.suggest_items (classifier_version)
  where labels_reviewed_at is null;

-- Existing rows keep version 0, which is correct rather than a migration gap:
-- they were classified before the version existed, so they ARE behind, and the
-- first pass should pick them up. Deliberately not backfilled to the current
-- version — that would declare them up to date when the whole point is that
-- they are not.
