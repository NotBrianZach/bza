-- Correlation games — a trash, instead of a hard delete.
--
-- Deleting a game used to be `delete from listen_sessions`, which cascades to
-- every turn in it. A correlation game is a chain built one turn at a time and
-- there is no way to reconstruct one, so the irreversible version of that button
-- was the wrong default — especially now that it also appears on the front page,
-- where the click is incidental rather than deliberate.
--
-- Books already solve this with a `deleted_at` column (see
-- frontend/lib/queries/books.ts). Same column, same semantics, so the two
-- trashes behave identically and a reader only has to learn the pattern once.
--
-- Additive and idempotent. Nothing is dropped. A session that predates this
-- migration gets `deleted_at` null, which is exactly "not trashed".

alter table public.listen_sessions
  -- Null means live. Non-null means in the trash: hidden from every list, still
  -- fully intact, and removed for real only by an explicit empty-trash.
  add column if not exists deleted_at timestamptz;

-- The list query is now (user_id, deleted_at is null) ordered by updated_at,
-- which listen_sessions_user_updated_idx can no longer satisfy on its own.
-- Partial index for the common case; the old index still covers the trash view.
create index if not exists listen_sessions_user_live_idx
  on public.listen_sessions (user_id, updated_at desc)
  where deleted_at is null;

-- No policy changes. "own listen sessions" is `for all using (auth.uid() =
-- user_id)`, so trashing, restoring and emptying are all already covered — the
-- trash is a column, not a new table, precisely so this stays true.
