-- Move the application out of `public` and into `bza_public`.
--
-- NOT YET APPLIED. See the rollout note at the bottom — the database half of
-- this and the client half have to land together, and the order matters.
--
-- Why at all: `public` in this project is shared. Another app's tables live in
-- `woofs`/`_w`, its signup hook sits on the same `auth.users`, and one of its
-- functions is sitting in `public` right now. A commons collides. Separately,
-- from 2026-10-30 Supabase stops auto-granting the Data API roles on new
-- `public` objects, so `public` loses the one convenience it had.
--
-- Enumerated dynamically rather than by hand: 67 tables, 51 sequences, 2 views,
-- 1 materialized view and 22 functions is too many to list without missing one,
-- and a missed table is an empty result rather than an error.

-- ── What deliberately stays in public ────────────────────────────────────────
--
-- _applied_migrations, _schema_migrations — migration bookkeeping, not app data.
--   scripts/db-migrate.sh hardcodes `public._applied_migrations`; moving these
--   would break the thing running this file, mid-run.
--
-- rate_limit_woofs_clients_inserts — belongs to the other app. It reads
--   woofs.insert_log, woofs.role_definitions and woofs.user_role_assignments and
--   fires on woofs.clients. Moving it into bza_public would be filing another
--   app's logic under ours.

-- Explicitly one transaction. scripts/db-migrate.sh runs each file with
-- `psql -v ON_ERROR_STOP=1 -f`, without --single-transaction, so every
-- statement would otherwise commit on its own — and a failure in the function
-- block after the tables had already moved would leave the app pointed at a
-- schema its tables had left, with no way back but a hand-written reverse
-- migration. All of this or none of it.
begin;

create schema if not exists bza_public;
grant usage on schema bza_public to anon, authenticated, service_role;

-- ── Tables ───────────────────────────────────────────────────────────────────
-- Serial/identity sequences owned by a table follow it automatically, which is
-- why there is no separate sequence loop. Foreign keys, indexes, constraints and
-- RLS policies are all carried by the table and need no action: a policy is
-- attached to its table, not to a schema name.
do $$
declare r record;
begin
  for r in
    select tablename from pg_tables
     where schemaname = 'public'
       and tablename not in ('_applied_migrations', '_schema_migrations')
     order by tablename
  loop
    execute format('alter table public.%I set schema bza_public', r.tablename);
  end loop;
end $$;

-- ── Views and the materialized view ──────────────────────────────────────────
-- A view keeps pointing at the right table after a move because it stores
-- dependencies by oid, not by name. Moving the view itself is only about where
-- the Data API finds it.
do $$
declare r record;
begin
  for r in select viewname from pg_views where schemaname = 'public' order by viewname
  loop
    execute format('alter view public.%I set schema bza_public', r.viewname);
  end loop;
  for r in select matviewname from pg_matviews where schemaname = 'public' order by matviewname
  loop
    execute format('alter materialized view public.%I set schema bza_public', r.matviewname);
  end loop;
end $$;

-- ── Functions ────────────────────────────────────────────────────────────────
-- Two separate problems, and the second is the dangerous one.
--
-- Moving a function is easy. But 20 of these name `public.something` in their
-- bodies, and 6 carry a pinned `search_path=public`. A pinned search_path is
-- what makes `handle_new_user` resolve `profiles` — and once the tables are in
-- bza_public, `search_path=public` points at a schema where the table no longer
-- is. That failure is silent and it is on the signup path and the billing path:
-- handle_new_user inserts the row every new account depends on, and
-- record_api_usage / get_and_increment_overage / reconcile_all_overages are what
-- metering reads. So the body text and the pin are rewritten here, in the same
-- transaction as the table move, rather than left for a follow-up.
-- Move first, rewrite second, and never drop. `alter function set schema`
-- carries dependencies with it because they are held by oid, and
-- `create or replace` preserves them too — whereas create-new-then-drop-old
-- cannot work at all here: on_auth_user_created on auth.users depends on
-- handle_new_user, so the drop is refused, and CASCADE would delete the signup
-- trigger. Moving in place keeps that trigger pointed at the same function
-- through both steps.
do $$
declare
  r record;
  src text;
  args text;
begin
  for r in
    select p.oid, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname <> 'rate_limit_woofs_clients_inserts'
     order by p.proname
  loop
    args := pg_get_function_identity_arguments(r.oid);
    execute format('alter function public.%I(%s) set schema bza_public', r.proname, args);

    -- Re-read after the move so the definition names its new home.
    src := pg_get_functiondef(r.oid);

    -- Point the body at the new schema, and re-pin the search_path to match.
    --
    -- \m anchors to a word start, which is what keeps this from compounding:
    -- the definition read back after the move already says `bza_public.`, and a
    -- plain replace of `public.` would find the tail of that and produce
    -- `bza_bza_public.`. Underscore is a word character, so `public` inside
    -- `bza_public` is not at a word start and is left alone.
    src := regexp_replace(src, '\mpublic\.', 'bza_public.', 'g');

    -- pg_get_functiondef renders the pin as `SET search_path TO 'public'`, not
    -- `search_path=public`. Matching the wrong form is a silent miss: the
    -- function is created, the pin still says public, and it resolves nothing.
    -- The capture keeps any trailing entries, so 'public, storage' survives as
    -- 'bza_public, storage'.
    src := regexp_replace(
             src,
             '(SET\s+search_path\s+TO\s+)''public([^'']*)''',
             '\1''bza_public\2''',
             'gi');

    execute src;
  end loop;
end $$;

-- ── Grants ───────────────────────────────────────────────────────────────────
-- The whole access decision, explicit. Tables carried their old grants through
-- the move, but stating them here is what makes this file replayable onto a
-- fresh project — and after 2026-10-30 it is the only thing that works.
grant select, insert, update, delete on all tables in schema bza_public to authenticated, service_role;
grant select on all tables in schema bza_public to anon;
grant usage, select on all sequences in schema bza_public to authenticated, service_role;
grant execute on all functions in schema bza_public to authenticated, service_role;

alter default privileges in schema bza_public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema bza_public grant select on tables to anon;

-- RLS is unchanged and still decides rows; these grants only decide whether a
-- role may address the table at all. Every policy came along with its table.

commit;

-- ── Blocked on three stale functions ─────────────────────────────────────────
--
-- This file does not run yet, and the reason is worth keeping: get_weekly_usage,
-- get_and_increment_overage and reconcile_all_overages all join `profiles p` and
-- read `p.stripe_customer_id`, but that column lives on billing_customers now.
-- They are already broken in production — a LANGUAGE sql body is validated when
-- it is created, not when the column underneath it moves, so they have been
-- failing at call time instead. scripts/report-usage.sh reaches
-- get_weekly_usage over /rest/v1/rpc with `curl -sf`, which swallows the error.
--
-- `create or replace` revalidates, so this migration cannot help surfacing them:
-- it aborts on the first one. Fix the join to billing_customers (or drop the
-- functions, if the weekly report is no longer wanted) and this runs clean —
-- it was validated by transaction-and-rollback against production with exactly
-- those three excluded: 66 tables moved, 123 foreign keys intact, 51 sequences
-- and 71 policies carried, and on_auth_user_created re-bound to the moved
-- handle_new_user.

-- ── Rollout, which is not SQL ────────────────────────────────────────────────
--
-- 1. Add bza_public to Settings -> API -> Exposed schemas. Already done.
-- 2. Point all 35 client-construction sites at it:
--       createClient(url, key, { db: { schema: 'bza_public' } })
--    583 .from() and 19 .rpc() calls then need no edit, because they resolve
--    through the client's default schema. A site that gets missed returns
--    nothing rather than erroring, so this is the step to check twice.
-- 3. Apply this file and deploy the client change together. Between the two the
--    app is reading a schema its tables have left. For a cutover with no such
--    window, create security_invoker views in public named after each moved
--    table first, deploy, then drop them:
--       create view public.books with (security_invoker = true)
--         as select * from bza_public.books;
--    security_invoker is what keeps RLS evaluating as the caller instead of the
--    view owner; without it the views would quietly bypass every policy.
