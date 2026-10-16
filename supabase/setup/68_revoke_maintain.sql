-- Finish 63: take MAINTAIN away too, and record why it was missed.
--
-- ── THE PRIVILEGE 63 LEFT BEHIND ──────────────────────────────────────────
--
-- 63 set out to leave anon with SELECT and nothing else. It revoked INSERT,
-- UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER, and then asserted success
-- against information_schema.role_table_grants, which reported anon holding
-- SELECT alone. It was wrong, and the assertion agreed with it:
--
--   bza_public.books relacl -> anon=rm, authenticated=arwdm
--
-- `m` is MAINTAIN, added in PostgreSQL 17. It permits VACUUM, ANALYZE, REINDEX,
-- CLUSTER, REFRESH MATERIALIZED VIEW and LOCK TABLE. 65 tables granted it to
-- anon; every table granted it to authenticated, whose declared default in this
-- schema is `arwd` and therefore excludes it.
--
-- ── WHY THE CHECK DID NOT CATCH IT, which is the part worth keeping ───────
--
-- information_schema is the SQL standard's view of privileges, and MAINTAIN is
-- a PostgreSQL extension to the standard, so it simply does not appear there.
-- Querying information_schema for "what can this role do" therefore returns a
-- truthful-looking answer that omits any privilege Postgres added on its own.
--
-- The authoritative sources are pg_class.relacl and has_table_privilege(), and
-- this file verifies with the latter. 63's own verification notes should be read
-- with that in mind: its TRUNCATE finding was correct because TRUNCATE IS in the
-- standard, and its "anon is SELECT-only" conclusion was not.
--
-- Also why the ACL letters are worth reading directly: `arwdDxtm` was quoted
-- repeatedly while 63 was written, and the `m` was in it the whole time.
--
-- ── WHAT MAINTAIN ACTUALLY RISKS ──────────────────────────────────────────
--
-- Not data disclosure -- RLS still governs reads. LOCK TABLE is the pointed one:
-- it is privilege-checked rather than policy-checked, same as TRUNCATE, so a
-- role holding MAINTAIN can take a lock regardless of any policy. REFRESH
-- MATERIALIZED VIEW and REINDEX are expensive operations on someone else's
-- hardware. Not reachable through PostgREST, which exposes none of these verbs,
-- so this is the same class of latent hole 63 closed for TRUNCATE.

do $$
declare r record;
begin
  for r in
    select n.nspname, c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname in ('bza_public', 'public')
       and c.relkind in ('r','p','v','m')
     order by 1, 2
  loop
    execute format('revoke maintain on %I.%I from anon, authenticated', r.nspname, r.relname);
  end loop;
end $$;

-- Keep the declared defaults honest about it as well. bza_public's were already
-- correct (anon=r, authenticated=arwd -- neither carries `m`); re-asserting is a
-- no-op that documents the intent next to the revoke.
alter default privileges in schema bza_public grant select on tables to anon;
alter default privileges in schema bza_public
  grant select, insert, update, delete on tables to authenticated;

-- ── ONE THING THIS CANNOT FIX ─────────────────────────────────────────────
--
-- The `public` schema carries TWO sets of default privileges: one granted by
-- postgres, which 67 narrowed, and one granted by supabase_admin, which still
-- reads anon=arwdDxtm. A table created in public by supabase_admin will
-- therefore still arrive with the full grant.
--
--   ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--     REVOKE ALL ON TABLES FROM anon;
--   -> ERROR: permission denied to change default privileges
--
-- postgres cannot alter another role's defaults, so this is out of reach from a
-- migration and is recorded rather than solved. It matters only if something
-- starts creating tables in public again, which migration 57 moved the
-- application out of precisely to avoid.
--
-- ── AFTER ─────────────────────────────────────────────────────────────────
--
-- Verify with has_table_privilege, NOT information_schema:
--
--   select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
--    where n.nspname='bza_public' and c.relkind='r'
--      and (has_table_privilege('anon', c.oid, 'MAINTAIN')
--        or has_table_privilege('authenticated', c.oid, 'MAINTAIN'));
--   → 0
