-- The usage leak had a second door: an RPC.
--
-- ── WHAT 63 AND 67 MISSED ─────────────────────────────────────────────────
--
-- Closing bza_public.monthly_usage_summary stopped anon reading cross-user spend
-- through a materialized view. The same data walks out of
-- get_anonymous_usage_stats(), which PostgREST exposes at
-- /rest/v1/rpc/get_anonymous_usage_stats and anon may EXECUTE:
--
--   POST /rest/v1/rpc/get_anonymous_usage_stats
--   apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>
--
--   -> 200 [{"user_id":"d2a3bf2e-...","api_calls":305,"total_spend":2.0380,
--            "books_count":21,"first_call":...,"last_call":...}, ...]
--
-- It is SECURITY DEFINER, so RLS is bypassed by design and the EXECUTE grant is
-- the only thing standing in front of it. The "anonymous" in the name is about
-- its SUBJECTS -- it reports on auth users where is_anonymous or email is null --
-- not about who may call it. Nothing in the frontend or any edge function
-- references it; it is an operator report.
--
-- Earlier migrations missed this because they revoked privileges on TABLES. A
-- function is a different object class with its own ACL, and SECURITY DEFINER
-- functions are the ones where that ACL is load-bearing.
--
-- AND THE REVOKE MUST NAME public. PostgreSQL grants EXECUTE on a new function
-- to PUBLIC by default, so the ACL reads `=X/postgres` with an empty grantee.
-- Every role is implicitly a member of PUBLIC, so revoking from anon and
-- authenticated alone removes their explicit entries and changes nothing a
-- caller can do. The first version of this migration did exactly that: the
-- revokes succeeded, the ACL lost `anon=X`, and the endpoint kept returning
-- every user_id and total_spend to the anon key. Verifying with
-- has_function_privilege rather than reading the ACL is what caught it.

revoke execute on function bza_public.get_anonymous_usage_stats() from public, anon, authenticated;

-- ── Trigger functions: nothing legitimate calls these directly ────────────
--
-- PostgreSQL does not check EXECUTE on a trigger function when the trigger
-- fires -- the privilege is only consulted for a direct call, which is exactly
-- the call nobody should be making. So revoking costs nothing and removes a
-- surface. check_quota_before_insert and handle_new_user are both SECURITY
-- DEFINER, which is what makes them worth naming rather than leaving.
revoke execute on function bza_public.check_quota_before_insert() from public, anon, authenticated;
revoke execute on function bza_public.handle_new_user() from public, anon, authenticated;
revoke execute on function bza_public.set_updated_at() from public, anon, authenticated;
revoke execute on function bza_public.update_updated_at() from public, anon, authenticated;
revoke execute on function bza_public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function bza_public.update_app_config_updated_at() from public, anon, authenticated;
revoke execute on function bza_public.update_pricing_config_updated_at() from public, anon, authenticated;

-- ── DELIBERATELY LEFT ALONE, and why ──────────────────────────────────────
--
-- get_user_quota, get_reading_progress, get_reading_stats, get_weak_topics,
-- get_monthly_api_costs and is_blacklisted are all called by the application or
-- by edge functions. Several are SECURITY DEFINER and anon-executable, which
-- deserves an audit -- whether each one filters by auth.uid() internally, and
-- whether anon needs it at all when the app calls them as a signed-in user.
-- That is a per-function review of live endpoints, not something to guess at
-- inside a migration that is already about something else. Recorded as
-- follow-up rather than swept in.
--
-- Likewise untouched: anon and authenticated hold ALL on all 51 sequences in
-- this schema, which includes UPDATE and therefore setval. Not reachable through
-- PostgREST, same latent class as TRUNCATE and MAINTAIN, and a separate change.
--
-- ── AFTER ─────────────────────────────────────────────────────────────────
--
--   POST /rest/v1/rpc/get_anonymous_usage_stats with the anon key
--   -> 404 PGRST202 (PostgREST reports an unexecutable function as not found)
--
-- Verify privileges with has_function_privilege, not information_schema.
