-- Make RLS the gate everywhere, and withdraw browser-reachable access from the
-- one place RLS cannot reach.
--
-- ── WHAT IS ACTUALLY WRONG, WHICH IS NOT WHAT IT LOOKS LIKE ───────────────
--
-- 67 relations in bza_public grant anon and authenticated the full write set,
-- including TRUNCATE. That reads like a blanket GRANT ALL somebody forgot to
-- narrow. It is not. bza_public's default privileges are already correct:
--
--   pg_default_acl, schema bza_public, relkind r:
--     anon=r/postgres  authenticated=arwd/postgres  service_role=arwd/postgres
--
-- `anon=r` is SELECT only, and `authenticated=arwd` has no `D`, the TRUNCATE
-- bit. A relation created fresh in this schema today gets the right ACL.
-- Compare the `public` schema's defaults, which are stock Supabase:
--
--   pg_default_acl, schema public, relkind r:
--     anon=arwdDxtm/postgres  authenticated=arwdDxtm/postgres
--
-- Those carry `D`. Migration 57 moved the application's tables from public to
-- bza_public, and ALTER TABLE ... SET SCHEMA preserves a relation's ACL -- it
-- does not re-derive it from the destination schema's defaults, which apply
-- only at CREATE. So the moved relations kept public's wide ACL and only ones
-- born in bza_public afterwards got the narrow one.
--
-- This migration is therefore mostly not a policy change. It applies
-- retroactively what the schema already declares, to the relations that predate
-- the declaration. The exception is the materialized view, below, which is a
-- genuine fix.
--
-- ── WHY TRUNCATE IS THE BIT THAT MATTERS FOR TABLES ───────────────────────
--
-- RLS is enabled on every table in this schema and the owner policies are
-- sound, which is what makes the anon INSERT/UPDATE/DELETE grants inert: an
-- anonymous request has a null auth.uid(), so the policies match no rows.
--
-- TRUNCATE is the exception: PostgreSQL does not apply row-level security to
-- TRUNCATE at all, it is checked against table privilege only. A role holding
-- it empties the table regardless of any policy, and `authenticated` -- which
-- every signed-in user holds -- had it on 67 relations.
--
-- Not reachable today, because PostgREST exposes no TRUNCATE verb and these
-- roles cannot open a raw SQL session. So for tables this closes a latent hole.
-- Worth closing anyway: the thing standing between a signed-in user and
-- `truncate books` should be a database permission, not a property of the HTTP
-- layer in front of it.
--
-- ── THE MATERIALIZED VIEW WAS NOT LATENT ──────────────────────────────────
--
-- bza_public.monthly_usage_summary is a materialized view over api_usage,
-- holding 11 rows across 9 distinct users. Materialized views do not support
-- `security_invoker`, and row-level security does not apply to them at all --
-- they are populated as the owner and read as a plain relation. anon held the
-- full ACL on it.
--
-- That was an open cross-user data leak, reachable with nothing but the
-- publishable anon key that ships inside the frontend bundle:
--
--   GET /rest/v1/monthly_usage_summary?select=*
--   Accept-Profile: bza_public
--   apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>
--
--   → 200 [{"user_id":"…","total_calls":5,"total_tokens":8348,
--            "total_charged_cost":0.003720,"last_activity":"…"}, …]
--
-- Every user's id, request volume, token consumption, cost and last activity
-- time, to anyone who viewed the site. It is referenced nowhere in any project,
-- so nothing depended on it. The revoke was applied to production ahead of this
-- migration rather than waiting for a deploy, and the same endpoint now answers
-- 401 `permission denied for materialized view`. This file records it so a
-- replay does not reintroduce it.
--
-- The two ordinary views in this schema, current_month_usage and
-- user_usage_summary, are NOT affected: both carry `security_invoker=true`, so
-- they run under the caller's RLS and already return [] for anon. Verified.
--
-- The rule this migration encodes: RLS is the gate, so any relation RLS cannot
-- gate must not be reachable by a role a browser can assume.
--
-- ── SCOPE ─────────────────────────────────────────────────────────────────
--
-- Schema-wide, not just the two knowledge-graph tables that surfaced it.
-- Revoking on 2 of 67 would leave those two inconsistent with the rest for no
-- security gain -- the hole is the schema's, so the fix is the schema's.
--
-- service_role is deliberately left alone. Its declared default is also `arwd`
-- and it currently holds more, so it is drifted too, but it is the trusted
-- backend role and is not assumable from a browser; narrowing it risks breaking
-- an edge function for no gain. Noted, not acted on.

-- ── tables: anon to SELECT, authenticated to arwd ─────────────────────────
--
-- relkind 'r' and 'p' (ordinary and partitioned). An earlier draft of this
-- migration looped on 'r' alone and silently left the views and the
-- materialized view untouched -- which is exactly where the real problem was.
do $$
declare r record;
begin
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'bza_public' and c.relkind in ('r','p')
     order by c.relname
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on bza_public.%I from anon',
      r.relname);
    execute format('grant select on bza_public.%I to anon', r.relname);

    execute format(
      'revoke truncate, references, trigger on bza_public.%I from authenticated',
      r.relname);
    execute format(
      'grant select, insert, update, delete on bza_public.%I to authenticated',
      r.relname);
  end loop;
end $$;

-- ── ordinary views: read-only, and only because they are security_invoker ─
--
-- These are aggregates and not updatable, so the write bits were meaningless
-- rather than dangerous; removed for tidiness. SELECT is safe to keep ONLY
-- while security_invoker=true, which is asserted below rather than assumed.
do $$
declare r record;
begin
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'bza_public' and c.relkind = 'v'
     order by c.relname
  loop
    execute format(
      'revoke insert, update, delete, truncate, references, trigger on bza_public.%I from anon, authenticated',
      r.relname);
    execute format('grant select on bza_public.%I to anon, authenticated', r.relname);
  end loop;
end $$;

-- A view without security_invoker runs as its owner and bypasses the RLS on
-- its base tables, so granting SELECT above would be handing out exactly the
-- leak this migration exists to close. Fail the migration rather than silently
-- publish one.
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into bad
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'bza_public' and c.relkind = 'v'
     and not coalesce(c.reloptions::text like '%security_invoker=true%', false);
  if bad is not null then
    raise exception
      'refusing to grant SELECT: view(s) % lack security_invoker=true and would bypass RLS on their base tables', bad;
  end if;
end $$;

-- ── materialized views: no browser-reachable access, ever ─────────────────
--
-- RLS cannot apply here (see the header). There is no setting that makes a
-- matview respect the caller's policies, so the only correct ACL for a role a
-- browser can assume is none at all. If one of these ever needs to be exposed,
-- the answer is a security_invoker view over it with its own filter, not a
-- grant.
do $$
declare r record;
begin
  for r in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'bza_public' and c.relkind = 'm'
     order by c.relname
  loop
    execute format('revoke all on bza_public.%I from anon, authenticated', r.relname);
  end loop;
end $$;

-- Re-assert the schema defaults explicitly. Already in this shape, so a no-op
-- against the current database -- but it is the line that stops a future
-- relation from re-acquiring TRUNCATE if anyone runs a stock Supabase
-- `grant all on all tables in schema` helper against bza_public, which is how
-- this drift arrived the first time.
alter default privileges in schema bza_public grant select on tables to anon;
alter default privileges in schema bza_public
  grant select, insert, update, delete on tables to authenticated;

-- ── AFTER ─────────────────────────────────────────────────────────────────
--
-- Expected, and asserted by the test harness rather than left to inspection:
--
--   select count(*) from information_schema.role_table_grants
--    where table_schema='bza_public' and privilege_type='TRUNCATE'
--      and grantee in ('anon','authenticated');
--   → 0
--
--   select has_table_privilege('anon','bza_public.monthly_usage_summary','SELECT');
--   → false
--
-- NOT ADDRESSED HERE: the `public` schema still has two relations with the wide
-- ACL and still has stock defaults carrying `D`. Nothing of the application
-- lives there any more (see 57), so it is out of scope -- but it is the same
-- hole in a schema nobody is watching.
