-- bza_public, as of the cutover. The chain starts here.
--
-- GENERATED. Do not hand-edit; regenerate with the command at the bottom.
--
-- ── WHAT HAPPENED TO MIGRATIONS 1-67 ──────────────────────────────────────
--
-- They are in archive/ and db-migrate.sh no longer sees them: it globs
-- supabase/setup/*.sql, which does not recurse. Nothing was deleted; the files
-- and the reasoning in their headers are still readable, they are just out of
-- the chain.
--
-- They had to leave, because this file creates the same tables they do. With
-- both present, a fresh database would run 00 first and then collide on every
-- CREATE TABLE in 44-67. Only 24 of the 67 still existed on disk anyway -- 41
-- were recorded in public._applied_migrations with no file, pruned at some
-- earlier point -- so the chain was already a partial history rather than a
-- reproducible one.
--
-- ── WHY A BASELINE AT ALL ─────────────────────────────────────────────────
--
-- 62 of the 69 tables in bza_public had their DDL in no file anywhere in this
-- repo. books, api_usage, billing_customers, chat_messages -- the core of the
-- application -- existed only inside the running database. The schema could not
-- be reviewed, diffed, or rebuilt, and the only way to learn a table's shape was
-- to query production. Same failure the edge functions were in (25 deployed, 1
-- in the repo), invisible for the same reason: nothing compared the repo against
-- what was live, so the absence had no symptom.
--
-- ── THIS FILE IS ALREADY APPLIED IN PRODUCTION ────────────────────────────
--
-- Recorded in public._applied_migrations at cutover, so db-migrate.sh skips it
-- there. It is not idempotent -- pg_dump emits bare CREATE statements -- and it
-- is not meant to be: it runs once, against an empty database, and everything
-- after it is an ordinary forward migration numbered 70 and up.
--
-- ── WHAT IT CONTAINS ──────────────────────────────────────────────────────
--
-- 69 tables, 74 policies with RLS enabled on all 69, 211 indexes, 21 functions,
-- 51 sequences, 2 views, 1 materialized view, and the grants -- including the
-- ALTER DEFAULT PRIVILEGES that decide what a NEW table in this schema gets
-- (anon SELECT; authenticated SELECT/INSERT/UPDATE/DELETE). Privileges are
-- included here rather than left to a follow-up migration, because a baseline
-- that produced a schema PostgREST cannot read would not be a baseline.
--
-- Those ACLs are the corrected ones: no TRUNCATE and no MAINTAIN for anon or
-- authenticated, anon limited to SELECT on tables, and no PUBLIC EXECUTE on the
-- reporting and trigger functions. See archive/63, 67, 68 and 69 for why each of
-- those is the way it is -- the dump records the result, not the argument.
--
-- Still true and deliberately not fixed here: anon and authenticated hold ALL on
-- all 51 sequences, which includes setval. Not reachable through PostgREST.
--
-- 63 foreign keys reference the `auth` schema, which Supabase provides.
--
-- ── VERIFIED ──────────────────────────────────────────────────────────────
--
-- Replayed against production inside a transaction with every `bza_public`
-- rewritten to a throwaway schema name, then rolled back -- matching live
-- exactly on tables, policies, RLS-enabled count and indexes.
--
-- ── REGENERATE ────────────────────────────────────────────────────────────
--
--   export PGPASSWORD=$(templedb env secret get bza SUPABASE_DB_PASSWORD)
--   pg_dump -h "$(templedb env secret get bza SUPABASE_DB_HOST)" -p 5432 \
--           -U postgres.<project-ref> -d postgres \
--           --schema-only --schema=bza_public --no-owner --no-comments \
--     > supabase/setup/00_baseline_bza_public.sql
--
-- Then re-apply this header, which pg_dump does not preserve. Regenerating is
-- only correct when every migration after it has been applied in production;
-- otherwise the baseline would absorb a change that is still pending elsewhere.
--
-- ──────────────────────────────────────────────────────────────────────────

--
-- PostgreSQL database dump
--

\restrict PjuFgc1wr4LFm9OpkDzqq566xB6QqtXwMZGTQ3xUwcNOOyhqX8WKnEF7BNmfOLP

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bza_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA bza_public;


--
-- Name: calculate_page_count(text, integer); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.calculate_page_count(content_text text, chars_per_page integer DEFAULT 1800) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  RETURN GREATEST(1, CEIL(LENGTH(content_text)::DECIMAL / chars_per_page)::INTEGER);
END;
$$;


--
-- Name: check_quota_before_insert(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.check_quota_before_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  quota RECORD;
BEGIN
  -- Get current quota for user
  SELECT * INTO quota FROM bza_public.get_user_quota(NEW.user_id);

  -- Check books quota (for books table)
  IF TG_TABLE_NAME = 'books' THEN
    IF quota.books_used >= quota.books_limit THEN
      RAISE EXCEPTION 'Book quota exceeded. Free tier allows % books, you have %. Upgrade to Pro for unlimited books.',
        quota.books_limit, quota.books_used
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Spend quota is enforced in edge functions before calling the AI API

  RETURN NEW;
END;
$$;


--
-- Name: get_and_increment_overage(uuid, bigint); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_and_increment_overage(p_user_id uuid, p_included_cents bigint DEFAULT NULL::bigint) RETURNS TABLE(stripe_customer_id text, delta_cents bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'bza_public'
    AS $$
DECLARE
  v_customer_id    TEXT;
  v_reported       BIGINT;
  v_period_col     DATE;
  v_period_start   DATE;
  v_total_cents    BIGINT;
  v_overage        BIGINT;
  v_delta          BIGINT;
  v_included       BIGINT;
BEGIN
  v_included := COALESCE(
    p_included_cents,
    (SELECT (value #>> '{}')::BIGINT FROM bza_public.app_config
      WHERE key = 'billing.included_cents')
  );
  IF v_included IS NULL THEN
    RAISE EXCEPTION 'billing.included_cents is not set in app_config; refusing to meter overage';
  END IF;

  SELECT bc.stripe_customer_id, bc.overage_reported_cents, bc.overage_period_start
  INTO   v_customer_id, v_reported, v_period_col
  FROM   bza_public.billing_customers bc WHERE bc.user_id = p_user_id FOR UPDATE;

  IF v_customer_id IS NULL THEN RETURN; END IF;

  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  IF v_period_col IS DISTINCT FROM v_period_start THEN v_reported := 0; END IF;

  SELECT COALESCE(FLOOR(SUM(charged_cost) * 100)::BIGINT, 0)
  INTO v_total_cents
  FROM bza_public.api_usage
  WHERE user_id = p_user_id AND timestamp >= DATE_TRUNC('month', CURRENT_TIMESTAMP);

  v_overage := GREATEST(0, v_total_cents - v_included);
  v_delta   := GREATEST(0, v_overage - v_reported);

  UPDATE bza_public.billing_customers
  SET overage_reported_cents = v_reported + v_delta,
      overage_period_start   = v_period_start
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_customer_id, v_delta;
END;
$$;


--
-- Name: get_anonymous_usage_stats(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_anonymous_usage_stats() RETURNS TABLE(user_id uuid, api_calls bigint, total_spend numeric, books_count bigint, first_call timestamp with time zone, last_call timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id,
    COUNT(*)::BIGINT AS api_calls,
    COALESCE(SUM(u.charged_cost), 0)::NUMERIC(10,4) AS total_spend,
    (SELECT COUNT(*)::BIGINT FROM bza_public.books b WHERE b.user_id = u.user_id) AS books_count,
    MIN(u.timestamp) AS first_call,
    MAX(u.timestamp) AS last_call
  FROM bza_public.api_usage u
  INNER JOIN auth.users au ON au.id = u.user_id
  WHERE au.is_anonymous = true OR au.email IS NULL
  GROUP BY u.user_id
  ORDER BY total_spend DESC;
END;
$$;


--
-- Name: get_book_statistics(bigint); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_book_statistics(book_uuid bigint) RETURNS TABLE(character_count integer, bookmark_count integer, chat_count integer, image_count integer, note_count integer, quote_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM bza_public.characters WHERE book_id = book_uuid) AS character_count,
    (SELECT COUNT(*)::INTEGER FROM bza_public.page_bookmarks WHERE book_id = book_uuid) AS bookmark_count,
    (SELECT COUNT(*)::INTEGER FROM bza_public.conversations WHERE book_id = book_uuid) AS chat_count,
    (SELECT COUNT(*)::INTEGER FROM bza_public.page_images WHERE book_id = book_uuid) AS image_count,
    (SELECT COUNT(*)::INTEGER FROM bza_public.reading_notes WHERE book_id = book_uuid) AS note_count,
    (SELECT COUNT(*)::INTEGER FROM bza_public.quotes WHERE book_id = book_uuid) AS quote_count;
END;
$$;


--
-- Name: get_monthly_api_costs(uuid, timestamp with time zone); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_monthly_api_costs(user_uuid uuid, month_start timestamp with time zone DEFAULT date_trunc('month'::text, CURRENT_TIMESTAMP)) RETURNS TABLE(total_calls integer, total_tokens integer, total_images integer, total_base_cost numeric, total_charged_cost numeric, breakdown_by_model jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_calls,
    COALESCE(SUM(au.total_tokens), 0)::INTEGER AS total_tokens,
    COALESCE(SUM(CASE WHEN au.endpoint_type = 'image' THEN 1 ELSE 0 END), 0)::INTEGER AS total_images,
    COALESCE(SUM(au.base_cost), 0)::DECIMAL(10, 2) AS total_base_cost,
    COALESCE(SUM(au.charged_cost), 0)::DECIMAL(10, 2) AS total_charged_cost,

    -- Breakdown by model
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'model', model_stats.model,
          'calls', model_stats.calls,
          'tokens', model_stats.tokens,
          'cost', model_stats.cost
        )
        ORDER BY model_stats.cost DESC
      ) FILTER (WHERE model_stats.model IS NOT NULL),
      '[]'::jsonb
    ) AS breakdown_by_model

  FROM bza_public.api_usage au
  LEFT JOIN LATERAL (
    SELECT
      au2.model,
      COUNT(*)::INTEGER AS calls,
      SUM(au2.total_tokens)::INTEGER AS tokens,
      SUM(au2.charged_cost)::DECIMAL(10, 2) AS cost
    FROM bza_public.api_usage au2
    WHERE au2.user_id = user_uuid
      AND au2.timestamp >= month_start
      AND au2.timestamp < month_start + INTERVAL '1 month'
    GROUP BY au2.model
  ) model_stats ON true
  WHERE au.user_id = user_uuid
    AND au.timestamp >= month_start
    AND au.timestamp < month_start + INTERVAL '1 month';
END;
$$;


--
-- Name: get_reading_progress(bigint); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_reading_progress(book_uuid bigint) RETURNS TABLE(book_id bigint, total_pages integer, current_page integer, progress_percent numeric, time_spent_minutes integer, last_read_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS book_id,
    b.total_pages,
    COALESCE(MAX(rs.end_page), MAX(rs.start_page), 0)::INTEGER AS current_page,
    CASE
      WHEN b.total_pages > 0 THEN
        ROUND((COALESCE(MAX(rs.end_page), MAX(rs.start_page), 0)::DECIMAL / b.total_pages * 100), 2)
      ELSE 0
    END AS progress_percent,
    COALESCE(SUM(rs.duration_minutes), 0)::INTEGER AS time_spent_minutes,
    MAX(rs.end_time) AS last_read_at
  FROM bza_public.books b
  LEFT JOIN bza_public.reading_sessions rs ON rs.book_id = b.id
  WHERE b.id = book_uuid
  GROUP BY b.id, b.total_pages;
END;
$$;


--
-- Name: get_reading_stats(uuid, integer); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_reading_stats(p_user_id uuid, p_days integer DEFAULT 30) RETURNS json
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
  v_streak INT := 0;
  v_longest INT := 0;
  v_today DATE := CURRENT_DATE;
  v_daily JSON;
  v_total_pages INT;
  v_total_minutes INT;
  v_days_read INT;
  v_current_run INT := 0;
  v_max_run INT := 0;
  v_prev_date DATE;
  v_row RECORD;
BEGIN
  -- Daily pages read for the last p_days days
  SELECT json_agg(d ORDER BY d->>'date')
  INTO v_daily
  FROM (
    SELECT json_build_object(
      'date', read_date::TEXT,
      'pages', SUM(pages_in_session)
    ) AS d
    FROM (
      SELECT
        DATE(COALESCE(end_time, start_time)) AS read_date,
        GREATEST(1, COALESCE(end_page, start_page) - start_page) AS pages_in_session
      FROM bza_public.reading_sessions
      WHERE user_id = p_user_id
        AND DATE(COALESCE(end_time, start_time)) >= v_today - (p_days - 1)
    ) sub
    GROUP BY read_date
  ) agg;

  -- Total pages and minutes
  SELECT
    COALESCE(SUM(GREATEST(1, COALESCE(end_page, start_page) - start_page)), 0),
    COALESCE(SUM(duration_minutes), 0)
  INTO v_total_pages, v_total_minutes
  FROM bza_public.reading_sessions
  WHERE user_id = p_user_id;

  -- Count distinct days read (all time)
  SELECT COUNT(DISTINCT DATE(COALESCE(end_time, start_time)))
  INTO v_days_read
  FROM bza_public.reading_sessions
  WHERE user_id = p_user_id;

  -- Compute current streak (consecutive days up to today, counting backwards)
  FOR v_row IN
    SELECT DISTINCT DATE(COALESCE(end_time, start_time)) AS d
    FROM bza_public.reading_sessions
    WHERE user_id = p_user_id
    ORDER BY d DESC
  LOOP
    IF v_streak = 0 THEN
      -- First row: must be today or yesterday to count
      IF v_row.d >= v_today - 1 THEN
        v_streak := 1;
        v_prev_date := v_row.d;
      ELSE
        EXIT;
      END IF;
    ELSE
      IF v_row.d = v_prev_date - 1 THEN
        v_streak := v_streak + 1;
        v_prev_date := v_row.d;
      ELSE
        EXIT;
      END IF;
    END IF;
  END LOOP;

  -- Compute longest streak (all time)
  v_current_run := 0;
  v_prev_date := NULL;
  FOR v_row IN
    SELECT DISTINCT DATE(COALESCE(end_time, start_time)) AS d
    FROM bza_public.reading_sessions
    WHERE user_id = p_user_id
    ORDER BY d ASC
  LOOP
    IF v_prev_date IS NULL OR v_row.d = v_prev_date + 1 THEN
      v_current_run := v_current_run + 1;
    ELSE
      v_current_run := 1;
    END IF;
    IF v_current_run > v_max_run THEN v_max_run := v_current_run; END IF;
    v_prev_date := v_row.d;
  END LOOP;

  RETURN json_build_object(
    'current_streak', v_streak,
    'longest_streak', v_max_run,
    'total_pages_read', v_total_pages,
    'total_minutes_read', v_total_minutes,
    'days_read', v_days_read,
    'daily', COALESCE(v_daily, '[]'::json)
  );
END;
$$;


--
-- Name: get_storage_usage(uuid); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_storage_usage(user_uuid uuid) RETURNS bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'bza_public', 'storage'
    AS $$
  SELECT COALESCE(SUM((o.metadata->>'size')::bigint), 0)::bigint
  FROM (
    SELECT DISTINCT id, metadata
    FROM storage.objects
    WHERE bucket_id IN ('documents', 'books', 'page-images')
      AND (
        owner         = user_uuid
        OR name LIKE  user_uuid::text || '/%'
        OR name LIKE  'users/' || user_uuid::text || '/%'
      )
  ) o;
$$;


--
-- Name: get_user_quota(uuid); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_user_quota(user_uuid uuid) RETURNS TABLE(tier text, books_used integer, books_limit integer, spend_this_month numeric, spend_limit numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  user_tier TEXT;
  user_email TEXT;
  is_anonymous BOOLEAN;
BEGIN
  -- Get user tier from profiles
  SELECT p.tier INTO user_tier
  FROM bza_public.profiles p
  WHERE p.id = user_uuid;

  -- Check if user is anonymous (no email = anonymous session)
  SELECT u.email, u.is_anonymous INTO user_email, is_anonymous
  FROM auth.users u
  WHERE u.id = user_uuid;

  -- Default to free if not found
  user_tier := COALESCE(user_tier, 'free');

  RETURN QUERY
  SELECT
    CASE
      WHEN is_anonymous OR (user_email IS NULL AND user_tier = 'free') THEN 'anonymous'
      ELSE user_tier
    END AS tier,

    -- Books count
    (SELECT COUNT(*)::INTEGER FROM bza_public.books WHERE user_id = user_uuid) AS books_used,
    CASE
      WHEN is_anonymous OR (user_email IS NULL AND user_tier = 'free') THEN 10  -- generous for trying
      WHEN user_tier = 'free' THEN 3
      WHEN user_tier = 'pro' THEN 999999
      ELSE 999999
    END AS books_limit,

    -- AI spend this month (charged_cost = base_cost × 2 markup)
    (
      SELECT COALESCE(SUM(charged_cost), 0)::NUMERIC(10,4)
      FROM bza_public.api_usage
      WHERE user_id = user_uuid
        AND timestamp >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
    ) AS spend_this_month,
    CASE
      WHEN is_anonymous OR (user_email IS NULL AND user_tier = 'free') THEN 2.0000  -- $2 budget for anonymous
      WHEN user_tier = 'free' THEN 5.0000   -- $5/month limit for registered free users
      WHEN user_tier = 'pro' THEN 9999.0000  -- effectively unlimited (metered via Stripe)
      ELSE 9999.0000
    END AS spend_limit;
END;
$_$;


--
-- Name: get_weak_topics(uuid, bigint, integer); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.get_weak_topics(p_user_id uuid, p_book_id bigint, p_limit integer DEFAULT 5) RETURNS TABLE(topic text, correct integer, total integer, accuracy numeric)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT
    r->>'topic'                            AS topic,
    COUNT(*) FILTER (WHERE (r->>'correct')::boolean) ::INT AS correct,
    COUNT(*)                               ::INT AS total,
    ROUND(
      COUNT(*) FILTER (WHERE (r->>'correct')::boolean) * 100.0 / NULLIF(COUNT(*), 0),
      1
    )                                      AS accuracy
  FROM bza_public.quiz_attempts qa,
       jsonb_array_elements(qa.results) AS r
  WHERE qa.user_id = p_user_id
    AND qa.book_id = p_book_id
    AND r->>'topic' IS NOT NULL
    AND r->>'topic' != ''
  GROUP BY r->>'topic'
  HAVING COUNT(*) >= 2
  ORDER BY accuracy ASC, total DESC
  LIMIT p_limit;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
  BEGIN
    INSERT INTO bza_public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$;


--
-- Name: is_blacklisted(uuid, inet); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.is_blacklisted(check_user_id uuid DEFAULT NULL::uuid, check_ip inet DEFAULT NULL::inet) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bza_public.session_blacklist
    WHERE active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        (check_user_id IS NOT NULL AND user_id = check_user_id)
        OR (check_ip IS NOT NULL AND ip_address = check_ip)
      )
  );
END;
$$;


--
-- Name: reconcile_all_overages(bigint); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.reconcile_all_overages(p_included_cents bigint DEFAULT NULL::bigint) RETURNS TABLE(stripe_customer_id text, delta_cents bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'bza_public'
    AS $$
DECLARE
  rec            RECORD;
  v_period_start DATE;
  v_total_cents  BIGINT;
  v_reported     BIGINT;
  v_overage      BIGINT;
  v_delta        BIGINT;
  v_included     BIGINT;
BEGIN
  v_included := COALESCE(
    p_included_cents,
    (SELECT (value #>> '{}')::BIGINT FROM bza_public.app_config
      WHERE key = 'billing.included_cents')
  );
  IF v_included IS NULL THEN
    RAISE EXCEPTION 'billing.included_cents is not set in app_config; refusing to meter overage';
  END IF;

  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  FOR rec IN
    SELECT bc.user_id, bc.stripe_customer_id, bc.overage_reported_cents, bc.overage_period_start
    FROM   bza_public.billing_customers bc WHERE bc.stripe_customer_id IS NOT NULL FOR UPDATE OF bc
  LOOP
    v_reported := CASE WHEN rec.overage_period_start IS DISTINCT FROM v_period_start THEN 0
                       ELSE rec.overage_reported_cents END;
    SELECT COALESCE(FLOOR(SUM(au.charged_cost) * 100)::BIGINT, 0)
    INTO   v_total_cents FROM bza_public.api_usage au
    WHERE  au.user_id = rec.user_id AND au.timestamp >= DATE_TRUNC('month', CURRENT_TIMESTAMP);
    v_overage := GREATEST(0, v_total_cents - v_included);
    v_delta   := GREATEST(0, v_overage - v_reported);
    UPDATE bza_public.billing_customers
    SET  overage_reported_cents = v_reported + v_delta, overage_period_start = v_period_start
    WHERE user_id = rec.user_id;
    IF v_delta > 0 THEN
      stripe_customer_id := rec.stripe_customer_id; delta_cents := v_delta; RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;


--
-- Name: record_api_usage(uuid, text, text, text, text, integer, integer, numeric, bigint, integer, jsonb); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.record_api_usage(p_user_id uuid, p_provider text, p_model text, p_endpoint_type text, p_request_type text, p_input_tokens integer DEFAULT 0, p_output_tokens integer DEFAULT 0, p_base_cost numeric DEFAULT 0, p_book_id bigint DEFAULT NULL::bigint, p_page_num integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'bza_public'
    AS $$
  INSERT INTO bza_public.api_usage (
    user_id, api_provider, model, endpoint_type, request_type,
    input_tokens, output_tokens,
    base_cost, markup_multiplier,
    book_id, page_num, request_metadata
  ) VALUES (
    p_user_id, p_provider, p_model, p_endpoint_type, p_request_type,
    p_input_tokens, p_output_tokens,
    p_base_cost, 2.0,
    p_book_id, p_page_num, p_metadata
  );
$$;


--
-- Name: refresh_monthly_usage(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.refresh_monthly_usage() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'bza_public'
    AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY bza_public.monthly_usage_summary;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_app_config_updated_at(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.update_app_config_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


--
-- Name: update_pricing_config_updated_at(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.update_pricing_config_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: bza_public; Owner: -
--

CREATE FUNCTION bza_public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics_events; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.analytics_events (
    id bigint NOT NULL,
    user_id uuid,
    session_id text,
    event_name text NOT NULL,
    props jsonb DEFAULT '{}'::jsonb,
    url text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.analytics_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_events_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.analytics_events_id_seq OWNED BY bza_public.analytics_events.id;


--
-- Name: api_usage; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.api_usage (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    api_provider text NOT NULL,
    model text NOT NULL,
    endpoint_type text NOT NULL,
    request_type text,
    input_tokens integer DEFAULT 0,
    output_tokens integer DEFAULT 0,
    total_tokens integer GENERATED ALWAYS AS ((input_tokens + output_tokens)) STORED,
    base_cost numeric(10,6) NOT NULL,
    markup_multiplier numeric(3,2) DEFAULT 2.0,
    charged_cost numeric(10,6) GENERATED ALWAYS AS ((base_cost * markup_multiplier)) STORED,
    book_id bigint,
    page_num integer,
    request_metadata jsonb,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: api_usage_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.api_usage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.api_usage_id_seq OWNED BY bza_public.api_usage.id;


--
-- Name: app_config; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.app_config (
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: billing_customers; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.billing_customers (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text NOT NULL,
    payment_method_id text,
    billing_email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    overage_reported_cents bigint DEFAULT 0 NOT NULL,
    overage_period_start date
);


--
-- Name: billing_customers_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.billing_customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: billing_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.billing_customers_id_seq OWNED BY bza_public.billing_customers.id;


--
-- Name: book_structure; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.book_structure (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    title text NOT NULL,
    section_type text NOT NULL,
    level integer DEFAULT 1,
    parent_id bigint,
    page_num integer NOT NULL,
    last_page integer,
    summary text,
    last_analyzed_page integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: book_structure_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.book_structure_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: book_structure_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.book_structure_id_seq OWNED BY bza_public.book_structure.id;


--
-- Name: book_translations; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.book_translations (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    page_num integer NOT NULL,
    prompt text NOT NULL,
    translated_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: book_translations_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.book_translations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: book_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.book_translations_id_seq OWNED BY bza_public.book_translations.id;


--
-- Name: bookmarks; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.bookmarks (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    title text NOT NULL,
    page_num integer DEFAULT 0 NOT NULL,
    rolling_summary text DEFAULT ''::text NOT NULL,
    synopsis text DEFAULT ''::text NOT NULL,
    narrator text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.bookmarks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.bookmarks_id_seq OWNED BY bza_public.bookmarks.id;


--
-- Name: books; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.books (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    file_path text NOT NULL,
    title text DEFAULT ''::text NOT NULL,
    article_type text DEFAULT 'article'::text NOT NULL,
    summary text,
    synopsis text,
    narrator text,
    source_url text,
    total_pages integer DEFAULT 0,
    char_page_length integer DEFAULT 1800 NOT NULL,
    reader_exe text DEFAULT ''::text NOT NULL,
    reader_args text,
    reader_state_file text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    content_type text DEFAULT 'fiction'::text,
    pinned boolean DEFAULT false NOT NULL,
    pinned_at timestamp with time zone,
    last_read_at timestamp with time zone,
    wiki_revid text,
    wiki_followed boolean DEFAULT false NOT NULL,
    wiki_news_revid text,
    scores jsonb DEFAULT '{}'::jsonb,
    deleted_at timestamp with time zone,
    language text,
    search_text text,
    CONSTRAINT books_content_type_check CHECK ((content_type = ANY (ARRAY['fiction'::text, 'textbook'::text, 'academic_paper'::text, 'math_textbook'::text, 'wikipedia_article'::text, 'news_article'::text, 'forum_thread'::text, 'essay'::text, 'reference'::text, 'biography'::text, 'chat_book'::text, 'manga'::text])))
);


--
-- Name: books_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.books_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.books_id_seq OWNED BY bza_public.books.id;


--
-- Name: browser_extractions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.browser_extractions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    user_id uuid NOT NULL,
    image_sha256 text,
    region jsonb,
    mode text NOT NULL,
    extracted jsonb,
    model text,
    base_cost numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: browser_session_bookmarks; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.browser_session_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    url text NOT NULL,
    title text,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: browser_session_chats; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.browser_session_chats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    model text,
    base_cost numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT browser_session_chats_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: browser_sessions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.browser_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'hyperbeam'::text NOT NULL,
    provider_session_id text NOT NULL,
    embed_url text NOT NULL,
    admin_token text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    url_last_seen text,
    title text,
    description text,
    workspace_text text,
    chat_system_prompt text,
    capture_prompt text,
    capture_mode text
);


--
-- Name: character_identities; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.character_identities (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    canonical_name text NOT NULL,
    variant_names text,
    entity_type text,
    confidence real DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: character_identities_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.character_identities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: character_identities_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.character_identities_id_seq OWNED BY bza_public.character_identities.id;


--
-- Name: character_mentions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.character_mentions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    character_id bigint,
    page_num integer NOT NULL,
    context text,
    created_at timestamp with time zone DEFAULT now(),
    evidence text
);


--
-- Name: character_mentions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.character_mentions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: character_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.character_mentions_id_seq OWNED BY bza_public.character_mentions.id;


--
-- Name: character_names; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.character_names (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    name text NOT NULL,
    frequency integer DEFAULT 1,
    first_seen_page integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: character_names_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.character_names_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: character_names_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.character_names_id_seq OWNED BY bza_public.character_names.id;


--
-- Name: character_relationships; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.character_relationships (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    character_a_id bigint,
    character_b_id bigint,
    relationship_type text,
    description text,
    strength integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT character_relationships_strength_check CHECK (((strength >= 1) AND (strength <= 5))),
    CONSTRAINT no_self_relationship CHECK ((character_a_id <> character_b_id))
);


--
-- Name: character_relationships_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.character_relationships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: character_relationships_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.character_relationships_id_seq OWNED BY bza_public.character_relationships.id;


--
-- Name: characters; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.characters (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    name text NOT NULL,
    type text DEFAULT 'person'::text,
    description text,
    aliases text,
    first_page integer,
    last_page integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    summary text,
    reasoning text,
    last_analyzed_page integer DEFAULT 0,
    CONSTRAINT characters_type_check CHECK ((type = ANY (ARRAY['person'::text, 'animal'::text, 'entity'::text, 'group'::text])))
);


--
-- Name: characters_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.characters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: characters_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.characters_id_seq OWNED BY bza_public.characters.id;


--
-- Name: chat_messages; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.chat_messages (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    conversation_id bigint,
    role text NOT NULL,
    content text NOT NULL,
    page_num integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.chat_messages_id_seq OWNED BY bza_public.chat_messages.id;


--
-- Name: comprehension_checkpoints; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.comprehension_checkpoints (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    question text NOT NULL,
    user_answer text,
    is_correct boolean,
    explanation text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: comprehension_checkpoints_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.comprehension_checkpoints_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comprehension_checkpoints_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.comprehension_checkpoints_id_seq OWNED BY bza_public.comprehension_checkpoints.id;


--
-- Name: concept_observations; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.concept_observations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    knowledge_point_id text NOT NULL,
    task_id text NOT NULL,
    kind text NOT NULL,
    ruling text NOT NULL,
    scored boolean DEFAULT false NOT NULL,
    method text,
    assistance text DEFAULT 'none'::text NOT NULL,
    broke_at jsonb,
    conditions text[] DEFAULT '{}'::text[] NOT NULL,
    answer text,
    answer_as_read text,
    elapsed_ms integer,
    evidence jsonb,
    needs_review boolean DEFAULT false NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_ruling text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_note text,
    review_scored boolean DEFAULT false NOT NULL,
    CONSTRAINT concept_observations_assistance_check CHECK ((assistance = ANY (ARRAY['none'::text, 'hint'::text, 'worked_example'::text]))),
    CONSTRAINT concept_observations_review_is_complete CHECK ((((reviewed_at IS NULL) AND (reviewed_ruling IS NULL) AND (reviewed_note IS NULL) AND (review_scored = false)) OR ((reviewed_at IS NOT NULL) AND (reviewed_ruling IS NOT NULL)))),
    CONSTRAINT concept_observations_review_scored_is_settled CHECK (((NOT review_scored) OR (reviewed_ruling = ANY (ARRAY['correct'::text, 'incorrect'::text])))),
    CONSTRAINT concept_observations_reviewed_ruling_check CHECK ((reviewed_ruling = ANY (ARRAY['correct'::text, 'incorrect'::text, 'inconclusive'::text, 'abandoned'::text]))),
    CONSTRAINT concept_observations_ruling_check CHECK ((ruling = ANY (ARRAY['correct'::text, 'incorrect'::text, 'inconclusive'::text, 'abandoned'::text]))),
    CONSTRAINT concept_observations_scored_is_settled CHECK (((NOT scored) OR (ruling = ANY (ARRAY['correct'::text, 'incorrect'::text]))))
);


--
-- Name: concept_pins; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.concept_pins (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer,
    pin_type text DEFAULT 'concept'::text NOT NULL,
    title text NOT NULL,
    description text,
    source_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    external_url text,
    external_source text,
    cards_generated boolean DEFAULT false,
    card_count integer DEFAULT 0,
    pinned_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: concept_pins_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.concept_pins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: concept_pins_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.concept_pins_id_seq OWNED BY bza_public.concept_pins.id;


--
-- Name: concept_point_strength; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.concept_point_strength (
    user_id uuid NOT NULL,
    knowledge_point_id text NOT NULL,
    strength double precision DEFAULT 0 NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    unaided_successes integer DEFAULT 0 NOT NULL,
    assisted_successes integer DEFAULT 0 NOT NULL,
    failures integer DEFAULT 0 NOT NULL,
    last_demonstrated_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_attempt_at timestamp with time zone
);


--
-- Name: concept_traversals; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.concept_traversals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subject_id text NOT NULL,
    world jsonb DEFAULT '{"here": null, "route": [], "reached": []}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contexts; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.contexts (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    bookmark_id bigint,
    ordering integer NOT NULL,
    append text DEFAULT ''::text NOT NULL,
    prepend_summary text DEFAULT ''::text NOT NULL,
    append_summary text DEFAULT ''::text NOT NULL,
    embedding jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contexts_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.contexts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contexts_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.contexts_id_seq OWNED BY bza_public.contexts.id;


--
-- Name: conversation_prompts; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.conversation_prompts (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    prompt text NOT NULL,
    user_response text,
    llm_followup text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: conversation_prompts_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.conversation_prompts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.conversation_prompts_id_seq OWNED BY bza_public.conversation_prompts.id;


--
-- Name: conversations; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.conversations (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    title text,
    conversation_type text DEFAULT 'chat'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_conversation_type_check CHECK ((conversation_type = ANY (ARRAY['chat'::text, 'discussion'::text, 'reflection'::text])))
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.conversations_id_seq OWNED BY bza_public.conversations.id;


--
-- Name: convert_jobs; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.convert_jobs (
    id text NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    mode text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    result jsonb,
    error text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: correlate_presets; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.correlate_presets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    tuning jsonb DEFAULT '{}'::jsonb NOT NULL,
    media jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: current_month_usage; Type: VIEW; Schema: bza_public; Owner: -
--

CREATE VIEW bza_public.current_month_usage WITH (security_invoker='true') AS
 SELECT user_id,
    date_trunc('month'::text, CURRENT_TIMESTAMP) AS month_start,
    count(*) AS total_calls,
    sum(total_tokens) AS total_tokens,
    sum(
        CASE
            WHEN (endpoint_type = 'image'::text) THEN 1
            ELSE 0
        END) AS total_images,
    sum(base_cost) AS total_base_cost,
    sum(charged_cost) AS total_charged_cost
   FROM bza_public.api_usage
  WHERE ("timestamp" >= date_trunc('month'::text, CURRENT_TIMESTAMP))
  GROUP BY user_id;


--
-- Name: cyoa_nodes; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.cyoa_nodes (
    id bigint NOT NULL,
    story_id bigint NOT NULL,
    parent_id bigint,
    depth integer DEFAULT 0,
    choice_text text,
    content text NOT NULL,
    choices jsonb DEFAULT '[]'::jsonb,
    model text,
    is_ending boolean DEFAULT false,
    mood text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cyoa_nodes_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.cyoa_nodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cyoa_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.cyoa_nodes_id_seq OWNED BY bza_public.cyoa_nodes.id;


--
-- Name: cyoa_sessions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.cyoa_sessions (
    id bigint NOT NULL,
    story_id bigint NOT NULL,
    user_id uuid NOT NULL,
    current_node_id bigint,
    path bigint[] DEFAULT '{}'::bigint[],
    started_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cyoa_sessions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.cyoa_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cyoa_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.cyoa_sessions_id_seq OWNED BY bza_public.cyoa_sessions.id;


--
-- Name: cyoa_stories; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.cyoa_stories (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    title text NOT NULL,
    premise text,
    source_page integer,
    model text,
    status text DEFAULT 'active'::text,
    total_nodes integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cyoa_stories_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.cyoa_stories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cyoa_stories_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.cyoa_stories_id_seq OWNED BY bza_public.cyoa_stories.id;


--
-- Name: document_jobs; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.document_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile text DEFAULT 'default'::text NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    source_bucket text NOT NULL,
    source_path text NOT NULL,
    output_bucket text DEFAULT 'documents'::text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    raw_markdown_path text,
    readable_markdown_path text,
    chunks_json_path text,
    error text,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    task_name text,
    task_queue text,
    task_target_url text,
    enqueued_at timestamp with time zone,
    last_task_attempt_at timestamp with time zone,
    task_retry_count integer DEFAULT 0 NOT NULL,
    task_execution_count integer DEFAULT 0 NOT NULL,
    progress_pct integer DEFAULT 0 NOT NULL,
    processing_method text DEFAULT 'default'::text,
    billed_at timestamp with time zone,
    CONSTRAINT document_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'enqueued'::text, 'processing'::text, 'converted'::text, 'chunking'::text, 'retrying'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: extension_tokens; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.extension_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    label text DEFAULT 'Extension'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: extension_tokens_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.extension_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: extension_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.extension_tokens_id_seq OWNED BY bza_public.extension_tokens.id;


--
-- Name: flashcards; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.flashcards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    front text NOT NULL,
    back text NOT NULL,
    source_text text,
    page_num integer,
    topic_tag text,
    ease_factor numeric(4,2) DEFAULT 2.50 NOT NULL,
    interval_days integer DEFAULT 1 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    next_review_at timestamp with time zone DEFAULT now() NOT NULL,
    last_reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pin_id bigint,
    card_type text
);


--
-- Name: flashcards_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.flashcards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: flashcards_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.flashcards_id_seq OWNED BY bza_public.flashcards.id;


--
-- Name: identity_mentions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.identity_mentions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    identity_id bigint,
    page_num integer NOT NULL,
    name_used text NOT NULL,
    context text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: identity_mentions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.identity_mentions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: identity_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.identity_mentions_id_seq OWNED BY bza_public.identity_mentions.id;


--
-- Name: invoice_line_items; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.invoice_line_items (
    id bigint NOT NULL,
    invoice_id bigint,
    description text NOT NULL,
    item_type text NOT NULL,
    model text,
    quantity integer,
    unit_price numeric(10,6),
    base_cost numeric(10,2),
    charged_cost numeric(10,2),
    metadata jsonb
);


--
-- Name: invoice_line_items_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.invoice_line_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_line_items_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.invoice_line_items_id_seq OWNED BY bza_public.invoice_line_items.id;


--
-- Name: invoices; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.invoices (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    stripe_invoice_id text,
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    total_api_calls integer,
    total_tokens integer,
    total_images integer,
    total_base_cost numeric(10,2),
    total_charged_cost numeric(10,2),
    status text DEFAULT 'draft'::text,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'paid'::text, 'void'::text, 'uncollectible'::text]))),
    CONSTRAINT valid_period CHECK ((period_end > period_start))
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.invoices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.invoices_id_seq OWNED BY bza_public.invoices.id;


--
-- Name: key_concepts; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.key_concepts (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    term text NOT NULL,
    concept_type text DEFAULT 'concept'::text,
    explanation text,
    first_page integer,
    last_page integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT key_concepts_concept_type_check CHECK ((concept_type = ANY (ARRAY['concept'::text, 'definition'::text, 'theorem'::text, 'lemma'::text, 'equation'::text, 'algorithm'::text, 'figure'::text, 'table'::text, 'citation'::text, 'example'::text])))
);


--
-- Name: key_concepts_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.key_concepts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: key_concepts_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.key_concepts_id_seq OWNED BY bza_public.key_concepts.id;


--
-- Name: knowledge_edges; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.knowledge_edges (
    id bigint NOT NULL,
    book_id bigint NOT NULL,
    from_node bigint NOT NULL,
    to_node bigint NOT NULL,
    CONSTRAINT knowledge_edges_no_self_loop CHECK ((from_node <> to_node))
);


--
-- Name: knowledge_edges_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.knowledge_edges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_edges_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.knowledge_edges_id_seq OWNED BY bza_public.knowledge_edges.id;


--
-- Name: knowledge_nodes; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.knowledge_nodes (
    id bigint NOT NULL,
    book_id bigint NOT NULL,
    user_id uuid NOT NULL,
    label text NOT NULL,
    description text,
    page_refs integer[] DEFAULT '{}'::integer[] NOT NULL,
    mastered boolean DEFAULT false NOT NULL,
    mastery_score numeric(4,2) DEFAULT 0 NOT NULL,
    interval_days integer DEFAULT 1 NOT NULL,
    ease_factor numeric(4,2) DEFAULT 2.50 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    next_review_at timestamp with time zone DEFAULT now() NOT NULL,
    last_reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    consecutive_passes integer DEFAULT 0 NOT NULL
);


--
-- Name: knowledge_nodes_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.knowledge_nodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knowledge_nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.knowledge_nodes_id_seq OWNED BY bza_public.knowledge_nodes.id;


--
-- Name: listen_sessions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.listen_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mode text NOT NULL,
    title text NOT NULL,
    rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    world_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    turn_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    media jsonb DEFAULT '[]'::jsonb NOT NULL,
    relations jsonb DEFAULT '[]'::jsonb NOT NULL,
    tuning jsonb DEFAULT '{}'::jsonb NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: listen_turns; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.listen_turns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    turn_index integer NOT NULL,
    move_track jsonb,
    reply_track jsonb,
    reply_query text,
    reading text,
    narration text,
    facts jsonb DEFAULT '[]'::jsonb NOT NULL,
    links jsonb DEFAULT '[]'::jsonb NOT NULL,
    legal boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    move_offering jsonb,
    reply_offering jsonb,
    relation text,
    claimed_relation text,
    carried text,
    lost text,
    parent_turn_id uuid,
    world_delta jsonb,
    link_turn_id uuid,
    link_note text,
    tuning jsonb,
    move_by text DEFAULT 'player'::text NOT NULL,
    CONSTRAINT listen_turns_move_by_check CHECK ((move_by = ANY (ARRAY['player'::text, 'partner'::text])))
);


--
-- Name: location_mentions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.location_mentions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    location_id bigint,
    page_num integer NOT NULL,
    context text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: location_mentions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.location_mentions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: location_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.location_mentions_id_seq OWNED BY bza_public.location_mentions.id;


--
-- Name: locations; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.locations (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    name text NOT NULL,
    description text,
    location_type text DEFAULT 'place'::text,
    first_page integer,
    last_page integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT locations_location_type_check CHECK ((location_type = ANY (ARRAY['place'::text, 'building'::text, 'city'::text, 'country'::text, 'region'::text])))
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.locations_id_seq OWNED BY bza_public.locations.id;


--
-- Name: monthly_usage_summary; Type: MATERIALIZED VIEW; Schema: bza_public; Owner: -
--

CREATE MATERIALIZED VIEW bza_public.monthly_usage_summary AS
 SELECT user_id,
    date_trunc('month'::text, "timestamp") AS month,
    count(*) AS total_calls,
    sum(total_tokens) AS total_tokens,
    sum(
        CASE
            WHEN (endpoint_type = 'image'::text) THEN 1
            ELSE 0
        END) AS total_images,
    sum(base_cost) AS total_base_cost,
    sum(charged_cost) AS total_charged_cost,
    count(DISTINCT model) AS models_used,
    max("timestamp") AS last_activity
   FROM bza_public.api_usage
  GROUP BY user_id, (date_trunc('month'::text, "timestamp"))
  WITH NO DATA;


--
-- Name: newsletter_tokens; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.newsletter_tokens (
    user_id uuid NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_bookmarks; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.page_bookmarks (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    typst_content text,
    typst_title text,
    spotify_track jsonb
);


--
-- Name: page_bookmarks_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.page_bookmarks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.page_bookmarks_id_seq OWNED BY bza_public.page_bookmarks.id;


--
-- Name: page_discussions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.page_discussions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    discussion_text text NOT NULL,
    response text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_discussions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.page_discussions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_discussions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.page_discussions_id_seq OWNED BY bza_public.page_discussions.id;


--
-- Name: page_images; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.page_images (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    prompt text NOT NULL,
    image_url text NOT NULL,
    model text DEFAULT 'dall-e-3'::text,
    size text DEFAULT '1024x1024'::text,
    created_at timestamp with time zone DEFAULT now(),
    source text DEFAULT 'ai_generated'::text NOT NULL
);


--
-- Name: page_images_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.page_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_images_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.page_images_id_seq OWNED BY bza_public.page_images.id;


--
-- Name: picturebook_moments; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.picturebook_moments (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    settings_id bigint,
    page_num integer NOT NULL,
    after_text text NOT NULL,
    position_offset integer,
    scene_description text NOT NULL,
    caption text,
    mood text,
    image_prompt text,
    image_url text,
    image_model text,
    image_size text,
    generation_status text DEFAULT 'pending'::text,
    generation_error text,
    moment_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT picturebook_moments_generation_status_check CHECK ((generation_status = ANY (ARRAY['pending'::text, 'generating'::text, 'completed'::text, 'failed'::text, 'skipped'::text])))
);


--
-- Name: picturebook_moments_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.picturebook_moments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: picturebook_moments_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.picturebook_moments_id_seq OWNED BY bza_public.picturebook_moments.id;


--
-- Name: picturebook_runs; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.picturebook_runs (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    settings_id bigint,
    status text DEFAULT 'analyzing'::text,
    total_moments integer DEFAULT 0,
    completed_moments integer DEFAULT 0,
    total_cost numeric(10,4) DEFAULT 0,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    error text,
    CONSTRAINT picturebook_runs_status_check CHECK ((status = ANY (ARRAY['analyzing'::text, 'generating'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: picturebook_runs_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.picturebook_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: picturebook_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.picturebook_runs_id_seq OWNED BY bza_public.picturebook_runs.id;


--
-- Name: picturebook_settings; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.picturebook_settings (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    preset text DEFAULT 'literary'::text NOT NULL,
    image_style text,
    image_density text DEFAULT 'medium'::text,
    images_per_1000_words numeric(4,1) DEFAULT 3.0,
    image_size text DEFAULT '1024x1024'::text,
    content_filter text DEFAULT 'moderate'::text,
    analysis_guidance text,
    negative_prompt text,
    theme text DEFAULT 'light'::text,
    image_provider text DEFAULT 'openai'::text,
    custom_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT picturebook_settings_content_filter_check CHECK ((content_filter = ANY (ARRAY['strict'::text, 'moderate'::text, 'permissive'::text, 'none'::text]))),
    CONSTRAINT picturebook_settings_image_density_check CHECK ((image_density = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
    CONSTRAINT picturebook_settings_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'sepia'::text, 'midnight'::text])))
);


--
-- Name: picturebook_settings_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.picturebook_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: picturebook_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.picturebook_settings_id_seq OWNED BY bza_public.picturebook_settings.id;


--
-- Name: pricing_config; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.pricing_config (
    id bigint NOT NULL,
    model text NOT NULL,
    provider text NOT NULL,
    input_cost_per_1m numeric(10,6),
    output_cost_per_1m numeric(10,6),
    image_cost numeric(10,6),
    effective_date timestamp with time zone DEFAULT now(),
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    markup_multiplier numeric(5,2) DEFAULT 2.0,
    display_name text,
    model_type text DEFAULT 'chat'::text,
    use_cases text[] DEFAULT '{}'::text[],
    capabilities jsonb DEFAULT '{}'::jsonb,
    openrouter_id text,
    cost_display text,
    sort_order integer DEFAULT 100,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pricing_config_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.pricing_config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pricing_config_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.pricing_config_id_seq OWNED BY bza_public.pricing_config.id;


--
-- Name: problem_sets; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.problem_sets (
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    id bigint NOT NULL
);


--
-- Name: problem_sets_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.problem_sets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: problem_sets_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.problem_sets_id_seq OWNED BY bza_public.problem_sets.id;


--
-- Name: profiles; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    tier text DEFAULT 'free'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    storage_limit_bytes bigint DEFAULT 0 NOT NULL,
    prefs jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT profiles_tier_check CHECK ((tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])))
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.quiz_attempts (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    page_num integer,
    focus_type text,
    focus_value text,
    score integer NOT NULL,
    total integer NOT NULL,
    results jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.quiz_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.quiz_attempts_id_seq OWNED BY bza_public.quiz_attempts.id;


--
-- Name: quiz_cards; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.quiz_cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL,
    correct_index integer NOT NULL,
    explanation text,
    interval_days integer DEFAULT 1 NOT NULL,
    ease_factor numeric(4,2) DEFAULT 2.50 NOT NULL,
    repetitions integer DEFAULT 0 NOT NULL,
    next_review_at timestamp with time zone DEFAULT now() NOT NULL,
    last_reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_cards_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.quiz_cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.quiz_cards_id_seq OWNED BY bza_public.quiz_cards.id;


--
-- Name: quotes; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.quotes (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    quote_text text NOT NULL,
    context text,
    is_favorite boolean DEFAULT false,
    tags jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotes_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.quotes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.quotes_id_seq OWNED BY bza_public.quotes.id;


--
-- Name: reading_features; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.reading_features (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    feature_type text NOT NULL,
    enabled boolean DEFAULT true,
    config jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_features_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.reading_features_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reading_features_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.reading_features_id_seq OWNED BY bza_public.reading_features.id;


--
-- Name: reading_notes; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.reading_notes (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    page_num integer NOT NULL,
    content text NOT NULL,
    tags text,
    character_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reading_notes_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.reading_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reading_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.reading_notes_id_seq OWNED BY bza_public.reading_notes.id;


--
-- Name: reading_progress; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.reading_progress (
    user_id uuid NOT NULL,
    book_id bigint NOT NULL,
    current_page integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reading_sessions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.reading_sessions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    start_page integer NOT NULL,
    end_page integer,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    duration_minutes integer,
    CONSTRAINT valid_page_range CHECK (((end_page IS NULL) OR (end_page >= start_page)))
);


--
-- Name: reading_sessions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.reading_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reading_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.reading_sessions_id_seq OWNED BY bza_public.reading_sessions.id;


--
-- Name: session_blacklist; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.session_blacklist (
    id bigint NOT NULL,
    user_id uuid,
    ip_address inet,
    reason text,
    blocked_by text DEFAULT 'admin'::text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    active boolean DEFAULT true,
    CONSTRAINT at_least_one CHECK (((user_id IS NOT NULL) OR (ip_address IS NOT NULL)))
);


--
-- Name: session_blacklist_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.session_blacklist_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: session_blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.session_blacklist_id_seq OWNED BY bza_public.session_blacklist.id;


--
-- Name: theme_mentions; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.theme_mentions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    theme_id bigint,
    page_num integer NOT NULL,
    context text,
    strength integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT theme_mentions_strength_check CHECK (((strength >= 1) AND (strength <= 5)))
);


--
-- Name: theme_mentions_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.theme_mentions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: theme_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.theme_mentions_id_seq OWNED BY bza_public.theme_mentions.id;


--
-- Name: themes; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.themes (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    book_id bigint,
    theme_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: themes_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.themes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.themes_id_seq OWNED BY bza_public.themes.id;


--
-- Name: typst_scratchpad; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.typst_scratchpad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    book_id integer NOT NULL,
    page_num integer NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_usage_summary; Type: VIEW; Schema: bza_public; Owner: -
--

CREATE VIEW bza_public.user_usage_summary WITH (security_invoker='true') AS
 SELECT user_id,
    api_provider,
    date_trunc('week'::text, "timestamp") AS week_start,
    count(*) AS request_count,
    sum(input_tokens) AS input_tokens,
    sum(output_tokens) AS output_tokens,
    (sum(base_cost))::numeric(12,6) AS api_cost_usd,
    (sum(charged_cost))::numeric(12,6) AS billed_cost_usd
   FROM bza_public.api_usage
  GROUP BY user_id, api_provider, (date_trunc('week'::text, "timestamp"));


--
-- Name: webhook_deliveries; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.webhook_deliveries (
    id bigint NOT NULL,
    webhook_id bigint NOT NULL,
    event text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status_code integer,
    response_body text,
    error text,
    delivered_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_deliveries_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.webhook_deliveries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.webhook_deliveries_id_seq OWNED BY bza_public.webhook_deliveries.id;


--
-- Name: webhooks; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.webhooks (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    url text NOT NULL,
    secret text,
    events text[] DEFAULT '{}'::text[] NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhooks_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.webhooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.webhooks_id_seq OWNED BY bza_public.webhooks.id;


--
-- Name: wiki_updates; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.wiki_updates (
    id bigint NOT NULL,
    book_id bigint NOT NULL,
    user_id uuid NOT NULL,
    from_revid text NOT NULL,
    to_revid text NOT NULL,
    diff_rows jsonb DEFAULT '[]'::jsonb NOT NULL,
    diff_url text,
    checked_at timestamp with time zone DEFAULT now() NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    dismissed_at timestamp with time zone
);


--
-- Name: wiki_updates_id_seq; Type: SEQUENCE; Schema: bza_public; Owner: -
--

CREATE SEQUENCE bza_public.wiki_updates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wiki_updates_id_seq; Type: SEQUENCE OWNED BY; Schema: bza_public; Owner: -
--

ALTER SEQUENCE bza_public.wiki_updates_id_seq OWNED BY bza_public.wiki_updates.id;


--
-- Name: youtube_tracks; Type: TABLE; Schema: bza_public; Owner: -
--

CREATE TABLE bza_public.youtube_tracks (
    track_id text NOT NULL,
    video_id text,
    embeddable boolean DEFAULT false NOT NULL,
    query text,
    resolved_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_events id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.analytics_events ALTER COLUMN id SET DEFAULT nextval('bza_public.analytics_events_id_seq'::regclass);


--
-- Name: api_usage id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.api_usage ALTER COLUMN id SET DEFAULT nextval('bza_public.api_usage_id_seq'::regclass);


--
-- Name: billing_customers id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.billing_customers ALTER COLUMN id SET DEFAULT nextval('bza_public.billing_customers_id_seq'::regclass);


--
-- Name: book_structure id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_structure ALTER COLUMN id SET DEFAULT nextval('bza_public.book_structure_id_seq'::regclass);


--
-- Name: book_translations id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_translations ALTER COLUMN id SET DEFAULT nextval('bza_public.book_translations_id_seq'::regclass);


--
-- Name: bookmarks id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.bookmarks ALTER COLUMN id SET DEFAULT nextval('bza_public.bookmarks_id_seq'::regclass);


--
-- Name: books id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.books ALTER COLUMN id SET DEFAULT nextval('bza_public.books_id_seq'::regclass);


--
-- Name: character_identities id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_identities ALTER COLUMN id SET DEFAULT nextval('bza_public.character_identities_id_seq'::regclass);


--
-- Name: character_mentions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_mentions ALTER COLUMN id SET DEFAULT nextval('bza_public.character_mentions_id_seq'::regclass);


--
-- Name: character_names id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_names ALTER COLUMN id SET DEFAULT nextval('bza_public.character_names_id_seq'::regclass);


--
-- Name: character_relationships id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships ALTER COLUMN id SET DEFAULT nextval('bza_public.character_relationships_id_seq'::regclass);


--
-- Name: characters id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.characters ALTER COLUMN id SET DEFAULT nextval('bza_public.characters_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.chat_messages ALTER COLUMN id SET DEFAULT nextval('bza_public.chat_messages_id_seq'::regclass);


--
-- Name: comprehension_checkpoints id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.comprehension_checkpoints ALTER COLUMN id SET DEFAULT nextval('bza_public.comprehension_checkpoints_id_seq'::regclass);


--
-- Name: concept_pins id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_pins ALTER COLUMN id SET DEFAULT nextval('bza_public.concept_pins_id_seq'::regclass);


--
-- Name: contexts id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts ALTER COLUMN id SET DEFAULT nextval('bza_public.contexts_id_seq'::regclass);


--
-- Name: conversation_prompts id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversation_prompts ALTER COLUMN id SET DEFAULT nextval('bza_public.conversation_prompts_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversations ALTER COLUMN id SET DEFAULT nextval('bza_public.conversations_id_seq'::regclass);


--
-- Name: cyoa_nodes id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_nodes ALTER COLUMN id SET DEFAULT nextval('bza_public.cyoa_nodes_id_seq'::regclass);


--
-- Name: cyoa_sessions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions ALTER COLUMN id SET DEFAULT nextval('bza_public.cyoa_sessions_id_seq'::regclass);


--
-- Name: cyoa_stories id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_stories ALTER COLUMN id SET DEFAULT nextval('bza_public.cyoa_stories_id_seq'::regclass);


--
-- Name: extension_tokens id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.extension_tokens ALTER COLUMN id SET DEFAULT nextval('bza_public.extension_tokens_id_seq'::regclass);


--
-- Name: flashcards id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.flashcards ALTER COLUMN id SET DEFAULT nextval('bza_public.flashcards_id_seq'::regclass);


--
-- Name: identity_mentions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.identity_mentions ALTER COLUMN id SET DEFAULT nextval('bza_public.identity_mentions_id_seq'::regclass);


--
-- Name: invoice_line_items id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoice_line_items ALTER COLUMN id SET DEFAULT nextval('bza_public.invoice_line_items_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoices ALTER COLUMN id SET DEFAULT nextval('bza_public.invoices_id_seq'::regclass);


--
-- Name: key_concepts id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.key_concepts ALTER COLUMN id SET DEFAULT nextval('bza_public.key_concepts_id_seq'::regclass);


--
-- Name: knowledge_edges id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges ALTER COLUMN id SET DEFAULT nextval('bza_public.knowledge_edges_id_seq'::regclass);


--
-- Name: knowledge_nodes id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_nodes ALTER COLUMN id SET DEFAULT nextval('bza_public.knowledge_nodes_id_seq'::regclass);


--
-- Name: location_mentions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.location_mentions ALTER COLUMN id SET DEFAULT nextval('bza_public.location_mentions_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.locations ALTER COLUMN id SET DEFAULT nextval('bza_public.locations_id_seq'::regclass);


--
-- Name: page_bookmarks id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_bookmarks ALTER COLUMN id SET DEFAULT nextval('bza_public.page_bookmarks_id_seq'::regclass);


--
-- Name: page_discussions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_discussions ALTER COLUMN id SET DEFAULT nextval('bza_public.page_discussions_id_seq'::regclass);


--
-- Name: page_images id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_images ALTER COLUMN id SET DEFAULT nextval('bza_public.page_images_id_seq'::regclass);


--
-- Name: picturebook_moments id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_moments ALTER COLUMN id SET DEFAULT nextval('bza_public.picturebook_moments_id_seq'::regclass);


--
-- Name: picturebook_runs id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_runs ALTER COLUMN id SET DEFAULT nextval('bza_public.picturebook_runs_id_seq'::regclass);


--
-- Name: picturebook_settings id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_settings ALTER COLUMN id SET DEFAULT nextval('bza_public.picturebook_settings_id_seq'::regclass);


--
-- Name: pricing_config id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.pricing_config ALTER COLUMN id SET DEFAULT nextval('bza_public.pricing_config_id_seq'::regclass);


--
-- Name: problem_sets id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.problem_sets ALTER COLUMN id SET DEFAULT nextval('bza_public.problem_sets_id_seq'::regclass);


--
-- Name: quiz_attempts id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_attempts ALTER COLUMN id SET DEFAULT nextval('bza_public.quiz_attempts_id_seq'::regclass);


--
-- Name: quiz_cards id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_cards ALTER COLUMN id SET DEFAULT nextval('bza_public.quiz_cards_id_seq'::regclass);


--
-- Name: quotes id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quotes ALTER COLUMN id SET DEFAULT nextval('bza_public.quotes_id_seq'::regclass);


--
-- Name: reading_features id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_features ALTER COLUMN id SET DEFAULT nextval('bza_public.reading_features_id_seq'::regclass);


--
-- Name: reading_notes id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_notes ALTER COLUMN id SET DEFAULT nextval('bza_public.reading_notes_id_seq'::regclass);


--
-- Name: reading_sessions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_sessions ALTER COLUMN id SET DEFAULT nextval('bza_public.reading_sessions_id_seq'::regclass);


--
-- Name: session_blacklist id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.session_blacklist ALTER COLUMN id SET DEFAULT nextval('bza_public.session_blacklist_id_seq'::regclass);


--
-- Name: theme_mentions id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.theme_mentions ALTER COLUMN id SET DEFAULT nextval('bza_public.theme_mentions_id_seq'::regclass);


--
-- Name: themes id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.themes ALTER COLUMN id SET DEFAULT nextval('bza_public.themes_id_seq'::regclass);


--
-- Name: webhook_deliveries id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhook_deliveries ALTER COLUMN id SET DEFAULT nextval('bza_public.webhook_deliveries_id_seq'::regclass);


--
-- Name: webhooks id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhooks ALTER COLUMN id SET DEFAULT nextval('bza_public.webhooks_id_seq'::regclass);


--
-- Name: wiki_updates id; Type: DEFAULT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.wiki_updates ALTER COLUMN id SET DEFAULT nextval('bza_public.wiki_updates_id_seq'::regclass);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: api_usage api_usage_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.api_usage
    ADD CONSTRAINT api_usage_pkey PRIMARY KEY (id);


--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (key);


--
-- Name: billing_customers billing_customers_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.billing_customers
    ADD CONSTRAINT billing_customers_pkey PRIMARY KEY (id);


--
-- Name: billing_customers billing_customers_stripe_customer_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.billing_customers
    ADD CONSTRAINT billing_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: billing_customers billing_customers_user_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.billing_customers
    ADD CONSTRAINT billing_customers_user_id_key UNIQUE (user_id);


--
-- Name: book_structure book_structure_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_structure
    ADD CONSTRAINT book_structure_pkey PRIMARY KEY (id);


--
-- Name: book_translations book_translations_book_id_page_num_prompt_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_translations
    ADD CONSTRAINT book_translations_book_id_page_num_prompt_key UNIQUE (book_id, page_num, prompt);


--
-- Name: book_translations book_translations_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_translations
    ADD CONSTRAINT book_translations_pkey PRIMARY KEY (id);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: browser_extractions browser_extractions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_extractions
    ADD CONSTRAINT browser_extractions_pkey PRIMARY KEY (id);


--
-- Name: browser_session_bookmarks browser_session_bookmarks_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_bookmarks
    ADD CONSTRAINT browser_session_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: browser_session_chats browser_session_chats_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_chats
    ADD CONSTRAINT browser_session_chats_pkey PRIMARY KEY (id);


--
-- Name: browser_sessions browser_sessions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_sessions
    ADD CONSTRAINT browser_sessions_pkey PRIMARY KEY (id);


--
-- Name: browser_sessions browser_sessions_provider_provider_session_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_sessions
    ADD CONSTRAINT browser_sessions_provider_provider_session_id_key UNIQUE (provider, provider_session_id);


--
-- Name: character_identities character_identities_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_identities
    ADD CONSTRAINT character_identities_pkey PRIMARY KEY (id);


--
-- Name: character_identities character_identities_user_id_book_id_canonical_name_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_identities
    ADD CONSTRAINT character_identities_user_id_book_id_canonical_name_key UNIQUE (user_id, book_id, canonical_name);


--
-- Name: character_mentions character_mentions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_mentions
    ADD CONSTRAINT character_mentions_pkey PRIMARY KEY (id);


--
-- Name: character_names character_names_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_names
    ADD CONSTRAINT character_names_pkey PRIMARY KEY (id);


--
-- Name: character_names character_names_user_id_book_id_name_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_names
    ADD CONSTRAINT character_names_user_id_book_id_name_key UNIQUE (user_id, book_id, name);


--
-- Name: character_relationships character_relationships_character_a_id_character_b_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships
    ADD CONSTRAINT character_relationships_character_a_id_character_b_id_key UNIQUE (character_a_id, character_b_id);


--
-- Name: character_relationships character_relationships_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships
    ADD CONSTRAINT character_relationships_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: comprehension_checkpoints comprehension_checkpoints_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.comprehension_checkpoints
    ADD CONSTRAINT comprehension_checkpoints_pkey PRIMARY KEY (id);


--
-- Name: concept_observations concept_observations_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_observations
    ADD CONSTRAINT concept_observations_pkey PRIMARY KEY (id);


--
-- Name: concept_pins concept_pins_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_pins
    ADD CONSTRAINT concept_pins_pkey PRIMARY KEY (id);


--
-- Name: concept_point_strength concept_point_strength_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_point_strength
    ADD CONSTRAINT concept_point_strength_pkey PRIMARY KEY (user_id, knowledge_point_id);


--
-- Name: concept_traversals concept_traversals_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_traversals
    ADD CONSTRAINT concept_traversals_pkey PRIMARY KEY (id);


--
-- Name: contexts contexts_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts
    ADD CONSTRAINT contexts_pkey PRIMARY KEY (id);


--
-- Name: contexts contexts_user_id_book_id_bookmark_id_ordering_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts
    ADD CONSTRAINT contexts_user_id_book_id_bookmark_id_ordering_key UNIQUE (user_id, book_id, bookmark_id, ordering);


--
-- Name: conversation_prompts conversation_prompts_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversation_prompts
    ADD CONSTRAINT conversation_prompts_pkey PRIMARY KEY (id);


--
-- Name: conversation_prompts conversation_prompts_user_id_book_id_page_num_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversation_prompts
    ADD CONSTRAINT conversation_prompts_user_id_book_id_page_num_key UNIQUE (user_id, book_id, page_num);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: convert_jobs convert_jobs_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.convert_jobs
    ADD CONSTRAINT convert_jobs_pkey PRIMARY KEY (id);


--
-- Name: correlate_presets correlate_presets_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.correlate_presets
    ADD CONSTRAINT correlate_presets_pkey PRIMARY KEY (id);


--
-- Name: cyoa_nodes cyoa_nodes_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_nodes
    ADD CONSTRAINT cyoa_nodes_pkey PRIMARY KEY (id);


--
-- Name: cyoa_sessions cyoa_sessions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions
    ADD CONSTRAINT cyoa_sessions_pkey PRIMARY KEY (id);


--
-- Name: cyoa_sessions cyoa_sessions_story_id_user_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions
    ADD CONSTRAINT cyoa_sessions_story_id_user_id_key UNIQUE (story_id, user_id);


--
-- Name: cyoa_stories cyoa_stories_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_stories
    ADD CONSTRAINT cyoa_stories_pkey PRIMARY KEY (id);


--
-- Name: document_jobs document_jobs_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.document_jobs
    ADD CONSTRAINT document_jobs_pkey PRIMARY KEY (id);


--
-- Name: extension_tokens extension_tokens_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.extension_tokens
    ADD CONSTRAINT extension_tokens_pkey PRIMARY KEY (id);


--
-- Name: extension_tokens extension_tokens_token_hash_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.extension_tokens
    ADD CONSTRAINT extension_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: extension_tokens extension_tokens_user_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.extension_tokens
    ADD CONSTRAINT extension_tokens_user_id_key UNIQUE (user_id);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: identity_mentions identity_mentions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.identity_mentions
    ADD CONSTRAINT identity_mentions_pkey PRIMARY KEY (id);


--
-- Name: invoice_line_items invoice_line_items_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_stripe_invoice_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoices
    ADD CONSTRAINT invoices_stripe_invoice_id_key UNIQUE (stripe_invoice_id);


--
-- Name: key_concepts key_concepts_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.key_concepts
    ADD CONSTRAINT key_concepts_pkey PRIMARY KEY (id);


--
-- Name: knowledge_edges knowledge_edges_from_node_to_node_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges
    ADD CONSTRAINT knowledge_edges_from_node_to_node_key UNIQUE (from_node, to_node);


--
-- Name: knowledge_edges knowledge_edges_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges
    ADD CONSTRAINT knowledge_edges_pkey PRIMARY KEY (id);


--
-- Name: knowledge_nodes knowledge_nodes_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_nodes
    ADD CONSTRAINT knowledge_nodes_pkey PRIMARY KEY (id);


--
-- Name: listen_sessions listen_sessions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_sessions
    ADD CONSTRAINT listen_sessions_pkey PRIMARY KEY (id);


--
-- Name: listen_turns listen_turns_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_pkey PRIMARY KEY (id);


--
-- Name: listen_turns listen_turns_session_id_turn_index_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_session_id_turn_index_key UNIQUE (session_id, turn_index);


--
-- Name: location_mentions location_mentions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.location_mentions
    ADD CONSTRAINT location_mentions_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: newsletter_tokens newsletter_tokens_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.newsletter_tokens
    ADD CONSTRAINT newsletter_tokens_pkey PRIMARY KEY (user_id);


--
-- Name: newsletter_tokens newsletter_tokens_token_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.newsletter_tokens
    ADD CONSTRAINT newsletter_tokens_token_key UNIQUE (token);


--
-- Name: page_bookmarks page_bookmarks_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_bookmarks
    ADD CONSTRAINT page_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: page_bookmarks page_bookmarks_user_id_book_id_page_num_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_bookmarks
    ADD CONSTRAINT page_bookmarks_user_id_book_id_page_num_key UNIQUE (user_id, book_id, page_num);


--
-- Name: page_discussions page_discussions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_discussions
    ADD CONSTRAINT page_discussions_pkey PRIMARY KEY (id);


--
-- Name: page_discussions page_discussions_user_id_book_id_page_num_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_discussions
    ADD CONSTRAINT page_discussions_user_id_book_id_page_num_key UNIQUE (user_id, book_id, page_num);


--
-- Name: page_images page_images_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_images
    ADD CONSTRAINT page_images_pkey PRIMARY KEY (id);


--
-- Name: picturebook_moments picturebook_moments_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_moments
    ADD CONSTRAINT picturebook_moments_pkey PRIMARY KEY (id);


--
-- Name: picturebook_runs picturebook_runs_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_runs
    ADD CONSTRAINT picturebook_runs_pkey PRIMARY KEY (id);


--
-- Name: picturebook_settings picturebook_settings_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_settings
    ADD CONSTRAINT picturebook_settings_pkey PRIMARY KEY (id);


--
-- Name: picturebook_settings picturebook_settings_user_id_book_id_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_settings
    ADD CONSTRAINT picturebook_settings_user_id_book_id_key UNIQUE (user_id, book_id);


--
-- Name: pricing_config pricing_config_model_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.pricing_config
    ADD CONSTRAINT pricing_config_model_key UNIQUE (model);


--
-- Name: pricing_config pricing_config_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.pricing_config
    ADD CONSTRAINT pricing_config_pkey PRIMARY KEY (id);


--
-- Name: problem_sets problem_sets_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.problem_sets
    ADD CONSTRAINT problem_sets_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quiz_attempts quiz_attempts_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id);


--
-- Name: quiz_cards quiz_cards_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_cards
    ADD CONSTRAINT quiz_cards_pkey PRIMARY KEY (id);


--
-- Name: quotes quotes_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quotes
    ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);


--
-- Name: reading_features reading_features_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_features
    ADD CONSTRAINT reading_features_pkey PRIMARY KEY (id);


--
-- Name: reading_features reading_features_user_id_book_id_feature_type_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_features
    ADD CONSTRAINT reading_features_user_id_book_id_feature_type_key UNIQUE (user_id, book_id, feature_type);


--
-- Name: reading_notes reading_notes_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_notes
    ADD CONSTRAINT reading_notes_pkey PRIMARY KEY (id);


--
-- Name: reading_progress reading_progress_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_progress
    ADD CONSTRAINT reading_progress_pkey PRIMARY KEY (user_id, book_id);


--
-- Name: reading_sessions reading_sessions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_sessions
    ADD CONSTRAINT reading_sessions_pkey PRIMARY KEY (id);


--
-- Name: session_blacklist session_blacklist_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.session_blacklist
    ADD CONSTRAINT session_blacklist_pkey PRIMARY KEY (id);


--
-- Name: theme_mentions theme_mentions_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.theme_mentions
    ADD CONSTRAINT theme_mentions_pkey PRIMARY KEY (id);


--
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: typst_scratchpad typst_scratchpad_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.typst_scratchpad
    ADD CONSTRAINT typst_scratchpad_pkey PRIMARY KEY (id);


--
-- Name: typst_scratchpad typst_scratchpad_user_id_book_id_page_num_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.typst_scratchpad
    ADD CONSTRAINT typst_scratchpad_user_id_book_id_page_num_key UNIQUE (user_id, book_id, page_num);


--
-- Name: problem_sets uq_problem_sets_user_book; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.problem_sets
    ADD CONSTRAINT uq_problem_sets_user_book UNIQUE (user_id, book_id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: wiki_updates wiki_updates_book_id_to_revid_key; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.wiki_updates
    ADD CONSTRAINT wiki_updates_book_id_to_revid_key UNIQUE (book_id, to_revid);


--
-- Name: wiki_updates wiki_updates_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.wiki_updates
    ADD CONSTRAINT wiki_updates_pkey PRIMARY KEY (id);


--
-- Name: youtube_tracks youtube_tracks_pkey; Type: CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.youtube_tracks
    ADD CONSTRAINT youtube_tracks_pkey PRIMARY KEY (track_id);


--
-- Name: analytics_events_event_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX analytics_events_event_created_idx ON bza_public.analytics_events USING btree (event_name, created_at DESC);


--
-- Name: analytics_events_session_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX analytics_events_session_created_idx ON bza_public.analytics_events USING btree (session_id, created_at DESC) WHERE (session_id IS NOT NULL);


--
-- Name: analytics_events_user_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX analytics_events_user_created_idx ON bza_public.analytics_events USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL);


--
-- Name: book_translations_book_prompt_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX book_translations_book_prompt_idx ON bza_public.book_translations USING btree (book_id, prompt, page_num);


--
-- Name: books_deleted_at_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX books_deleted_at_idx ON bza_public.books USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: browser_extractions_user_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX browser_extractions_user_created_idx ON bza_public.browser_extractions USING btree (user_id, created_at DESC);


--
-- Name: browser_session_bookmarks_session_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX browser_session_bookmarks_session_created_idx ON bza_public.browser_session_bookmarks USING btree (session_id, created_at DESC);


--
-- Name: browser_session_chats_session_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX browser_session_chats_session_created_idx ON bza_public.browser_session_chats USING btree (session_id, created_at);


--
-- Name: browser_sessions_user_active_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX browser_sessions_user_active_idx ON bza_public.browser_sessions USING btree (user_id, ended_at) WHERE (ended_at IS NULL);


--
-- Name: concept_observations_review_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX concept_observations_review_idx ON bza_public.concept_observations USING btree (user_id, created_at DESC) WHERE (needs_review AND (reviewed_at IS NULL));


--
-- Name: concept_observations_user_point_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX concept_observations_user_point_idx ON bza_public.concept_observations USING btree (user_id, knowledge_point_id, created_at DESC);


--
-- Name: concept_point_strength_user_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX concept_point_strength_user_idx ON bza_public.concept_point_strength USING btree (user_id);


--
-- Name: concept_traversals_user_subject_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX concept_traversals_user_subject_idx ON bza_public.concept_traversals USING btree (user_id, subject_id);


--
-- Name: correlate_presets_user_name_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX correlate_presets_user_name_idx ON bza_public.correlate_presets USING btree (user_id, lower(name));


--
-- Name: correlate_presets_user_used_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX correlate_presets_user_used_idx ON bza_public.correlate_presets USING btree (user_id, used_at DESC NULLS LAST);


--
-- Name: document_jobs_status_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX document_jobs_status_created_idx ON bza_public.document_jobs USING btree (status, created_at);


--
-- Name: document_jobs_status_enqueued_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX document_jobs_status_enqueued_idx ON bza_public.document_jobs USING btree (status, enqueued_at DESC);


--
-- Name: document_jobs_task_name_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX document_jobs_task_name_idx ON bza_public.document_jobs USING btree (task_name);


--
-- Name: document_jobs_user_created_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX document_jobs_user_created_idx ON bza_public.document_jobs USING btree (user_id, created_at DESC);


--
-- Name: flashcards_due_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX flashcards_due_idx ON bza_public.flashcards USING btree (user_id, next_review_at);


--
-- Name: flashcards_topic_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX flashcards_topic_idx ON bza_public.flashcards USING btree (user_id, book_id, topic_tag);


--
-- Name: flashcards_user_book_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX flashcards_user_book_idx ON bza_public.flashcards USING btree (user_id, book_id);


--
-- Name: idx_api_usage_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_book ON bza_public.api_usage USING btree (book_id);


--
-- Name: idx_api_usage_model; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_model ON bza_public.api_usage USING btree (model);


--
-- Name: idx_api_usage_provider; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_provider ON bza_public.api_usage USING btree (api_provider);


--
-- Name: idx_api_usage_provider_timestamp; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_provider_timestamp ON bza_public.api_usage USING btree (api_provider, "timestamp" DESC);


--
-- Name: idx_api_usage_user_cost; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_user_cost ON bza_public.api_usage USING btree (user_id, charged_cost);


--
-- Name: idx_api_usage_user_timestamp; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_api_usage_user_timestamp ON bza_public.api_usage USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_billing_customers_stripe; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_billing_customers_stripe ON bza_public.billing_customers USING btree (stripe_customer_id);


--
-- Name: idx_billing_customers_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_billing_customers_user ON bza_public.billing_customers USING btree (user_id);


--
-- Name: idx_blacklist_ip; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_blacklist_ip ON bza_public.session_blacklist USING btree (ip_address) WHERE (active = true);


--
-- Name: idx_blacklist_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_blacklist_user ON bza_public.session_blacklist USING btree (user_id) WHERE (active = true);


--
-- Name: idx_book_structure_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_book_structure_book ON bza_public.book_structure USING btree (book_id);


--
-- Name: idx_book_structure_page; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_book_structure_page ON bza_public.book_structure USING btree (page_num);


--
-- Name: idx_book_structure_unique; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX idx_book_structure_unique ON bza_public.book_structure USING btree (user_id, book_id, title, page_num);


--
-- Name: idx_book_structure_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_book_structure_user ON bza_public.book_structure USING btree (user_id);


--
-- Name: idx_book_translations_lookup; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_book_translations_lookup ON bza_public.book_translations USING btree (book_id, prompt, page_num);


--
-- Name: idx_bookmarks_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_bookmarks_book ON bza_public.bookmarks USING btree (book_id);


--
-- Name: idx_bookmarks_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_bookmarks_user ON bza_public.bookmarks USING btree (user_id);


--
-- Name: idx_books_created; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_books_created ON bza_public.books USING btree (created_at DESC);


--
-- Name: idx_books_search; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_books_search ON bza_public.books USING gin (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(search_text, ''::text))));


--
-- Name: idx_books_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_books_user ON bza_public.books USING btree (user_id);


--
-- Name: idx_books_user_active; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_books_user_active ON bza_public.books USING btree (user_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_books_user_deleted; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_books_user_deleted ON bza_public.books USING btree (user_id, deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: idx_character_mentions_char; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_character_mentions_char ON bza_public.character_mentions USING btree (character_id);


--
-- Name: idx_character_mentions_page; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_character_mentions_page ON bza_public.character_mentions USING btree (page_num);


--
-- Name: idx_character_mentions_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_character_mentions_user ON bza_public.character_mentions USING btree (user_id);


--
-- Name: idx_character_names_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_character_names_user_book ON bza_public.character_names USING btree (user_id, book_id);


--
-- Name: idx_characters_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_characters_book ON bza_public.characters USING btree (book_id);


--
-- Name: idx_characters_name; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_characters_name ON bza_public.characters USING btree (name);


--
-- Name: idx_characters_unique_name; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX idx_characters_unique_name ON bza_public.characters USING btree (user_id, book_id, name);


--
-- Name: idx_characters_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_characters_user ON bza_public.characters USING btree (user_id);


--
-- Name: idx_chat_messages_conversation; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_chat_messages_conversation ON bza_public.chat_messages USING btree (conversation_id);


--
-- Name: idx_chat_messages_created; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_chat_messages_created ON bza_public.chat_messages USING btree (created_at);


--
-- Name: idx_chat_messages_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_chat_messages_user ON bza_public.chat_messages USING btree (user_id);


--
-- Name: idx_comprehension_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_comprehension_user_book ON bza_public.comprehension_checkpoints USING btree (user_id, book_id);


--
-- Name: idx_concept_pins_type; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_concept_pins_type ON bza_public.concept_pins USING btree (pin_type);


--
-- Name: idx_concept_pins_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_concept_pins_user_book ON bza_public.concept_pins USING btree (user_id, book_id);


--
-- Name: idx_contexts_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_contexts_user_book ON bza_public.contexts USING btree (user_id, book_id);


--
-- Name: idx_conversation_prompts_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_conversation_prompts_user_book ON bza_public.conversation_prompts USING btree (user_id, book_id);


--
-- Name: idx_conversations_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_conversations_book ON bza_public.conversations USING btree (book_id);


--
-- Name: idx_conversations_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_conversations_user ON bza_public.conversations USING btree (user_id);


--
-- Name: idx_cyoa_nodes_parent; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_cyoa_nodes_parent ON bza_public.cyoa_nodes USING btree (parent_id);


--
-- Name: idx_cyoa_nodes_story; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_cyoa_nodes_story ON bza_public.cyoa_nodes USING btree (story_id, depth);


--
-- Name: idx_cyoa_stories_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_cyoa_stories_user ON bza_public.cyoa_stories USING btree (user_id, book_id);


--
-- Name: idx_flashcards_due; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_flashcards_due ON bza_public.flashcards USING btree (user_id, next_review_at) WHERE (next_review_at IS NOT NULL);


--
-- Name: idx_identities_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_identities_user_book ON bza_public.character_identities USING btree (user_id, book_id);


--
-- Name: idx_identity_mentions_identity; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_identity_mentions_identity ON bza_public.identity_mentions USING btree (identity_id);


--
-- Name: idx_identity_mentions_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_identity_mentions_user ON bza_public.identity_mentions USING btree (user_id);


--
-- Name: idx_invoices_period; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_invoices_period ON bza_public.invoices USING btree (period_start, period_end);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_invoices_status ON bza_public.invoices USING btree (status);


--
-- Name: idx_invoices_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_invoices_user ON bza_public.invoices USING btree (user_id);


--
-- Name: idx_key_concepts_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_key_concepts_book ON bza_public.key_concepts USING btree (book_id);


--
-- Name: idx_key_concepts_unique; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX idx_key_concepts_unique ON bza_public.key_concepts USING btree (user_id, book_id, term);


--
-- Name: idx_key_concepts_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_key_concepts_user ON bza_public.key_concepts USING btree (user_id);


--
-- Name: idx_knowledge_edges_from_to; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_knowledge_edges_from_to ON bza_public.knowledge_edges USING btree (from_node, to_node);


--
-- Name: idx_line_items_invoice; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_line_items_invoice ON bza_public.invoice_line_items USING btree (invoice_id);


--
-- Name: idx_location_mentions_location; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_location_mentions_location ON bza_public.location_mentions USING btree (location_id);


--
-- Name: idx_locations_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_locations_user_book ON bza_public.locations USING btree (user_id, book_id);


--
-- Name: idx_monthly_usage_summary_pk; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE UNIQUE INDEX idx_monthly_usage_summary_pk ON bza_public.monthly_usage_summary USING btree (user_id, month);


--
-- Name: idx_page_bookmarks_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_page_bookmarks_user_book ON bza_public.page_bookmarks USING btree (user_id, book_id);


--
-- Name: idx_page_discussions_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_page_discussions_user_book ON bza_public.page_discussions USING btree (user_id, book_id);


--
-- Name: idx_page_images_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_page_images_user_book ON bza_public.page_images USING btree (user_id, book_id);


--
-- Name: idx_picturebook_moments_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_picturebook_moments_book ON bza_public.picturebook_moments USING btree (book_id, user_id);


--
-- Name: idx_picturebook_moments_page; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_picturebook_moments_page ON bza_public.picturebook_moments USING btree (book_id, page_num);


--
-- Name: idx_picturebook_runs_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_picturebook_runs_book ON bza_public.picturebook_runs USING btree (book_id, user_id);


--
-- Name: idx_pricing_config_type_active; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_pricing_config_type_active ON bza_public.pricing_config USING btree (model_type, active) WHERE (active = true);


--
-- Name: idx_pricing_config_use_cases; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_pricing_config_use_cases ON bza_public.pricing_config USING gin (use_cases) WHERE (active = true);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_profiles_email ON bza_public.profiles USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_quiz_attempts_recent; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_quiz_attempts_recent ON bza_public.quiz_attempts USING btree (user_id, book_id, created_at DESC);


--
-- Name: idx_quotes_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_quotes_user_book ON bza_public.quotes USING btree (user_id, book_id);


--
-- Name: idx_reading_features_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_features_user_book ON bza_public.reading_features USING btree (user_id, book_id);


--
-- Name: idx_reading_notes_page; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_notes_page ON bza_public.reading_notes USING btree (page_num);


--
-- Name: idx_reading_notes_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_notes_user_book ON bza_public.reading_notes USING btree (user_id, book_id);


--
-- Name: idx_reading_progress_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_progress_user ON bza_public.reading_progress USING btree (user_id);


--
-- Name: idx_reading_sessions_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_sessions_book ON bza_public.reading_sessions USING btree (book_id);


--
-- Name: idx_reading_sessions_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_reading_sessions_user ON bza_public.reading_sessions USING btree (user_id);


--
-- Name: idx_relationships_user; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_relationships_user ON bza_public.character_relationships USING btree (user_id);


--
-- Name: idx_theme_mentions_theme; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_theme_mentions_theme ON bza_public.theme_mentions USING btree (theme_id);


--
-- Name: idx_themes_user_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_themes_user_book ON bza_public.themes USING btree (user_id, book_id);


--
-- Name: idx_webhook_deliveries_webhook; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_webhook_deliveries_webhook ON bza_public.webhook_deliveries USING btree (webhook_id);


--
-- Name: idx_webhooks_user_active; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_webhooks_user_active ON bza_public.webhooks USING btree (user_id, active);


--
-- Name: idx_wiki_updates_book; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_wiki_updates_book ON bza_public.wiki_updates USING btree (book_id);


--
-- Name: idx_wiki_updates_feed; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX idx_wiki_updates_feed ON bza_public.wiki_updates USING btree (user_id, dismissed, checked_at DESC);


--
-- Name: knowledge_edges_book_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX knowledge_edges_book_idx ON bza_public.knowledge_edges USING btree (book_id);


--
-- Name: knowledge_edges_from_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX knowledge_edges_from_idx ON bza_public.knowledge_edges USING btree (from_node);


--
-- Name: knowledge_nodes_book_user_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX knowledge_nodes_book_user_idx ON bza_public.knowledge_nodes USING btree (book_id, user_id);


--
-- Name: knowledge_nodes_due_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX knowledge_nodes_due_idx ON bza_public.knowledge_nodes USING btree (user_id, next_review_at) WHERE (mastered = true);


--
-- Name: listen_sessions_user_live_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_sessions_user_live_idx ON bza_public.listen_sessions USING btree (user_id, updated_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: listen_sessions_user_updated_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_sessions_user_updated_idx ON bza_public.listen_sessions USING btree (user_id, updated_at DESC);


--
-- Name: listen_turns_parent_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_turns_parent_idx ON bza_public.listen_turns USING btree (session_id, parent_turn_id);


--
-- Name: listen_turns_relation_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_turns_relation_idx ON bza_public.listen_turns USING btree (session_id, relation) WHERE (relation IS NOT NULL);


--
-- Name: listen_turns_session_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_turns_session_idx ON bza_public.listen_turns USING btree (session_id, turn_index);


--
-- Name: listen_turns_session_move_by_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX listen_turns_session_move_by_idx ON bza_public.listen_turns USING btree (session_id, move_by);


--
-- Name: quiz_attempts_recent_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX quiz_attempts_recent_idx ON bza_public.quiz_attempts USING btree (user_id, book_id, created_at DESC);


--
-- Name: quiz_attempts_user_book_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX quiz_attempts_user_book_idx ON bza_public.quiz_attempts USING btree (user_id, book_id);


--
-- Name: quiz_cards_due_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX quiz_cards_due_idx ON bza_public.quiz_cards USING btree (user_id, next_review_at);


--
-- Name: youtube_tracks_misses_idx; Type: INDEX; Schema: bza_public; Owner: -
--

CREATE INDEX youtube_tracks_misses_idx ON bza_public.youtube_tracks USING btree (resolved_at) WHERE (video_id IS NULL);


--
-- Name: app_config app_config_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER app_config_updated_at BEFORE UPDATE ON bza_public.app_config FOR EACH ROW EXECUTE FUNCTION bza_public.update_app_config_updated_at();


--
-- Name: billing_customers billing_customers_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER billing_customers_updated_at BEFORE UPDATE ON bza_public.billing_customers FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: books books_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER books_updated_at BEFORE UPDATE ON bza_public.books FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: characters characters_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER characters_updated_at BEFORE UPDATE ON bza_public.characters FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: conversations conversations_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON bza_public.conversations FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: character_identities identities_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER identities_updated_at BEFORE UPDATE ON bza_public.character_identities FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: locations locations_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON bza_public.locations FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: pricing_config pricing_config_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER pricing_config_updated_at BEFORE UPDATE ON bza_public.pricing_config FOR EACH ROW EXECUTE FUNCTION bza_public.update_pricing_config_updated_at();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON bza_public.profiles FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: reading_notes reading_notes_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER reading_notes_updated_at BEFORE UPDATE ON bza_public.reading_notes FOR EACH ROW EXECUTE FUNCTION bza_public.update_updated_at();


--
-- Name: document_jobs set_document_jobs_updated_at; Type: TRIGGER; Schema: bza_public; Owner: -
--

CREATE TRIGGER set_document_jobs_updated_at BEFORE UPDATE ON bza_public.document_jobs FOR EACH ROW EXECUTE FUNCTION bza_public.set_updated_at();


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: api_usage api_usage_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.api_usage
    ADD CONSTRAINT api_usage_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE SET NULL;


--
-- Name: api_usage api_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.api_usage
    ADD CONSTRAINT api_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: billing_customers billing_customers_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.billing_customers
    ADD CONSTRAINT billing_customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: book_structure book_structure_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_structure
    ADD CONSTRAINT book_structure_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: book_structure book_structure_parent_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_structure
    ADD CONSTRAINT book_structure_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES bza_public.book_structure(id);


--
-- Name: book_structure book_structure_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_structure
    ADD CONSTRAINT book_structure_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: book_translations book_translations_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_translations
    ADD CONSTRAINT book_translations_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: book_translations book_translations_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.book_translations
    ADD CONSTRAINT book_translations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.bookmarks
    ADD CONSTRAINT bookmarks_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: bookmarks bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: books books_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.books
    ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: browser_extractions browser_extractions_session_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_extractions
    ADD CONSTRAINT browser_extractions_session_id_fkey FOREIGN KEY (session_id) REFERENCES bza_public.browser_sessions(id) ON DELETE CASCADE;


--
-- Name: browser_extractions browser_extractions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_extractions
    ADD CONSTRAINT browser_extractions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: browser_session_bookmarks browser_session_bookmarks_session_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_bookmarks
    ADD CONSTRAINT browser_session_bookmarks_session_id_fkey FOREIGN KEY (session_id) REFERENCES bza_public.browser_sessions(id) ON DELETE CASCADE;


--
-- Name: browser_session_bookmarks browser_session_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_bookmarks
    ADD CONSTRAINT browser_session_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: browser_session_chats browser_session_chats_session_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_chats
    ADD CONSTRAINT browser_session_chats_session_id_fkey FOREIGN KEY (session_id) REFERENCES bza_public.browser_sessions(id) ON DELETE CASCADE;


--
-- Name: browser_session_chats browser_session_chats_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_session_chats
    ADD CONSTRAINT browser_session_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: browser_sessions browser_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.browser_sessions
    ADD CONSTRAINT browser_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: character_identities character_identities_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_identities
    ADD CONSTRAINT character_identities_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: character_identities character_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_identities
    ADD CONSTRAINT character_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: character_mentions character_mentions_character_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_mentions
    ADD CONSTRAINT character_mentions_character_id_fkey FOREIGN KEY (character_id) REFERENCES bza_public.characters(id) ON DELETE CASCADE;


--
-- Name: character_mentions character_mentions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_mentions
    ADD CONSTRAINT character_mentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: character_names character_names_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_names
    ADD CONSTRAINT character_names_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: character_names character_names_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_names
    ADD CONSTRAINT character_names_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: character_relationships character_relationships_character_a_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships
    ADD CONSTRAINT character_relationships_character_a_id_fkey FOREIGN KEY (character_a_id) REFERENCES bza_public.characters(id) ON DELETE CASCADE;


--
-- Name: character_relationships character_relationships_character_b_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships
    ADD CONSTRAINT character_relationships_character_b_id_fkey FOREIGN KEY (character_b_id) REFERENCES bza_public.characters(id) ON DELETE CASCADE;


--
-- Name: character_relationships character_relationships_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.character_relationships
    ADD CONSTRAINT character_relationships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: characters characters_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.characters
    ADD CONSTRAINT characters_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES bza_public.conversations(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: comprehension_checkpoints comprehension_checkpoints_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.comprehension_checkpoints
    ADD CONSTRAINT comprehension_checkpoints_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: comprehension_checkpoints comprehension_checkpoints_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.comprehension_checkpoints
    ADD CONSTRAINT comprehension_checkpoints_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: concept_observations concept_observations_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_observations
    ADD CONSTRAINT concept_observations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: concept_pins concept_pins_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_pins
    ADD CONSTRAINT concept_pins_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: concept_pins concept_pins_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_pins
    ADD CONSTRAINT concept_pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: concept_point_strength concept_point_strength_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_point_strength
    ADD CONSTRAINT concept_point_strength_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: concept_traversals concept_traversals_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.concept_traversals
    ADD CONSTRAINT concept_traversals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contexts contexts_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts
    ADD CONSTRAINT contexts_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: contexts contexts_bookmark_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts
    ADD CONSTRAINT contexts_bookmark_id_fkey FOREIGN KEY (bookmark_id) REFERENCES bza_public.bookmarks(id) ON DELETE CASCADE;


--
-- Name: contexts contexts_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.contexts
    ADD CONSTRAINT contexts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: conversation_prompts conversation_prompts_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversation_prompts
    ADD CONSTRAINT conversation_prompts_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: conversation_prompts conversation_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversation_prompts
    ADD CONSTRAINT conversation_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: conversations conversations_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversations
    ADD CONSTRAINT conversations_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: convert_jobs convert_jobs_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.convert_jobs
    ADD CONSTRAINT convert_jobs_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: convert_jobs convert_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.convert_jobs
    ADD CONSTRAINT convert_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: correlate_presets correlate_presets_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.correlate_presets
    ADD CONSTRAINT correlate_presets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cyoa_nodes cyoa_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_nodes
    ADD CONSTRAINT cyoa_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES bza_public.cyoa_nodes(id) ON DELETE SET NULL;


--
-- Name: cyoa_nodes cyoa_nodes_story_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_nodes
    ADD CONSTRAINT cyoa_nodes_story_id_fkey FOREIGN KEY (story_id) REFERENCES bza_public.cyoa_stories(id) ON DELETE CASCADE;


--
-- Name: cyoa_sessions cyoa_sessions_current_node_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions
    ADD CONSTRAINT cyoa_sessions_current_node_id_fkey FOREIGN KEY (current_node_id) REFERENCES bza_public.cyoa_nodes(id) ON DELETE SET NULL;


--
-- Name: cyoa_sessions cyoa_sessions_story_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions
    ADD CONSTRAINT cyoa_sessions_story_id_fkey FOREIGN KEY (story_id) REFERENCES bza_public.cyoa_stories(id) ON DELETE CASCADE;


--
-- Name: cyoa_sessions cyoa_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_sessions
    ADD CONSTRAINT cyoa_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cyoa_stories cyoa_stories_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_stories
    ADD CONSTRAINT cyoa_stories_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE SET NULL;


--
-- Name: cyoa_stories cyoa_stories_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.cyoa_stories
    ADD CONSTRAINT cyoa_stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: document_jobs document_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.document_jobs
    ADD CONSTRAINT document_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: extension_tokens extension_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.extension_tokens
    ADD CONSTRAINT extension_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: api_usage fk_user; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.api_usage
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: flashcards flashcards_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.flashcards
    ADD CONSTRAINT flashcards_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: flashcards flashcards_pin_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.flashcards
    ADD CONSTRAINT flashcards_pin_id_fkey FOREIGN KEY (pin_id) REFERENCES bza_public.concept_pins(id) ON DELETE SET NULL;


--
-- Name: flashcards flashcards_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.flashcards
    ADD CONSTRAINT flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: identity_mentions identity_mentions_identity_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.identity_mentions
    ADD CONSTRAINT identity_mentions_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES bza_public.character_identities(id) ON DELETE CASCADE;


--
-- Name: identity_mentions identity_mentions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.identity_mentions
    ADD CONSTRAINT identity_mentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: invoice_line_items invoice_line_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES bza_public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: key_concepts key_concepts_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.key_concepts
    ADD CONSTRAINT key_concepts_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: key_concepts key_concepts_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.key_concepts
    ADD CONSTRAINT key_concepts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: knowledge_edges knowledge_edges_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges
    ADD CONSTRAINT knowledge_edges_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: knowledge_edges knowledge_edges_from_node_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges
    ADD CONSTRAINT knowledge_edges_from_node_fkey FOREIGN KEY (from_node) REFERENCES bza_public.knowledge_nodes(id) ON DELETE CASCADE;


--
-- Name: knowledge_edges knowledge_edges_to_node_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_edges
    ADD CONSTRAINT knowledge_edges_to_node_fkey FOREIGN KEY (to_node) REFERENCES bza_public.knowledge_nodes(id) ON DELETE CASCADE;


--
-- Name: knowledge_nodes knowledge_nodes_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_nodes
    ADD CONSTRAINT knowledge_nodes_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: knowledge_nodes knowledge_nodes_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.knowledge_nodes
    ADD CONSTRAINT knowledge_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: listen_sessions listen_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_sessions
    ADD CONSTRAINT listen_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: listen_turns listen_turns_link_turn_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_link_turn_id_fkey FOREIGN KEY (link_turn_id) REFERENCES bza_public.listen_turns(id) ON DELETE SET NULL;


--
-- Name: listen_turns listen_turns_parent_turn_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_parent_turn_id_fkey FOREIGN KEY (parent_turn_id) REFERENCES bza_public.listen_turns(id) ON DELETE CASCADE;


--
-- Name: listen_turns listen_turns_session_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_session_id_fkey FOREIGN KEY (session_id) REFERENCES bza_public.listen_sessions(id) ON DELETE CASCADE;


--
-- Name: listen_turns listen_turns_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.listen_turns
    ADD CONSTRAINT listen_turns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: location_mentions location_mentions_location_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.location_mentions
    ADD CONSTRAINT location_mentions_location_id_fkey FOREIGN KEY (location_id) REFERENCES bza_public.locations(id) ON DELETE CASCADE;


--
-- Name: location_mentions location_mentions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.location_mentions
    ADD CONSTRAINT location_mentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: locations locations_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.locations
    ADD CONSTRAINT locations_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: locations locations_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.locations
    ADD CONSTRAINT locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: newsletter_tokens newsletter_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.newsletter_tokens
    ADD CONSTRAINT newsletter_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: page_bookmarks page_bookmarks_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_bookmarks
    ADD CONSTRAINT page_bookmarks_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: page_bookmarks page_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_bookmarks
    ADD CONSTRAINT page_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: page_discussions page_discussions_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_discussions
    ADD CONSTRAINT page_discussions_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: page_discussions page_discussions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_discussions
    ADD CONSTRAINT page_discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: page_images page_images_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_images
    ADD CONSTRAINT page_images_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: page_images page_images_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.page_images
    ADD CONSTRAINT page_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: picturebook_moments picturebook_moments_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_moments
    ADD CONSTRAINT picturebook_moments_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: picturebook_moments picturebook_moments_settings_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_moments
    ADD CONSTRAINT picturebook_moments_settings_id_fkey FOREIGN KEY (settings_id) REFERENCES bza_public.picturebook_settings(id) ON DELETE CASCADE;


--
-- Name: picturebook_moments picturebook_moments_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_moments
    ADD CONSTRAINT picturebook_moments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: picturebook_runs picturebook_runs_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_runs
    ADD CONSTRAINT picturebook_runs_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: picturebook_runs picturebook_runs_settings_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_runs
    ADD CONSTRAINT picturebook_runs_settings_id_fkey FOREIGN KEY (settings_id) REFERENCES bza_public.picturebook_settings(id) ON DELETE SET NULL;


--
-- Name: picturebook_runs picturebook_runs_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_runs
    ADD CONSTRAINT picturebook_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: picturebook_settings picturebook_settings_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_settings
    ADD CONSTRAINT picturebook_settings_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: picturebook_settings picturebook_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.picturebook_settings
    ADD CONSTRAINT picturebook_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: problem_sets problem_sets_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.problem_sets
    ADD CONSTRAINT problem_sets_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: problem_sets problem_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.problem_sets
    ADD CONSTRAINT problem_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: quiz_attempts quiz_attempts_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts quiz_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_attempts
    ADD CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_cards quiz_cards_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_cards
    ADD CONSTRAINT quiz_cards_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: quiz_cards quiz_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quiz_cards
    ADD CONSTRAINT quiz_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quotes
    ADD CONSTRAINT quotes_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: quotes quotes_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.quotes
    ADD CONSTRAINT quotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: reading_features reading_features_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_features
    ADD CONSTRAINT reading_features_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: reading_features reading_features_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_features
    ADD CONSTRAINT reading_features_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: reading_notes reading_notes_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_notes
    ADD CONSTRAINT reading_notes_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: reading_notes reading_notes_character_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_notes
    ADD CONSTRAINT reading_notes_character_id_fkey FOREIGN KEY (character_id) REFERENCES bza_public.characters(id) ON DELETE SET NULL;


--
-- Name: reading_notes reading_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_notes
    ADD CONSTRAINT reading_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: reading_progress reading_progress_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_progress
    ADD CONSTRAINT reading_progress_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: reading_progress reading_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_progress
    ADD CONSTRAINT reading_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reading_sessions reading_sessions_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_sessions
    ADD CONSTRAINT reading_sessions_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: reading_sessions reading_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.reading_sessions
    ADD CONSTRAINT reading_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: session_blacklist session_blacklist_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.session_blacklist
    ADD CONSTRAINT session_blacklist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: theme_mentions theme_mentions_theme_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.theme_mentions
    ADD CONSTRAINT theme_mentions_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES bza_public.themes(id) ON DELETE CASCADE;


--
-- Name: theme_mentions theme_mentions_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.theme_mentions
    ADD CONSTRAINT theme_mentions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: themes themes_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.themes
    ADD CONSTRAINT themes_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: themes themes_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.themes
    ADD CONSTRAINT themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: typst_scratchpad typst_scratchpad_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.typst_scratchpad
    ADD CONSTRAINT typst_scratchpad_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: typst_scratchpad typst_scratchpad_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.typst_scratchpad
    ADD CONSTRAINT typst_scratchpad_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_webhook_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES bza_public.webhooks(id) ON DELETE CASCADE;


--
-- Name: webhooks webhooks_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.webhooks
    ADD CONSTRAINT webhooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wiki_updates wiki_updates_book_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.wiki_updates
    ADD CONSTRAINT wiki_updates_book_id_fkey FOREIGN KEY (book_id) REFERENCES bza_public.books(id) ON DELETE CASCADE;


--
-- Name: wiki_updates wiki_updates_user_id_fkey; Type: FK CONSTRAINT; Schema: bza_public; Owner: -
--

ALTER TABLE ONLY bza_public.wiki_updates
    ADD CONSTRAINT wiki_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pricing_config Anyone can view pricing; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Anyone can view pricing" ON bza_public.pricing_config FOR SELECT USING (true);


--
-- Name: book_structure Users access own book structure; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own book structure" ON bza_public.book_structure USING ((auth.uid() = user_id));


--
-- Name: character_names Users access own character names; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own character names" ON bza_public.character_names USING ((auth.uid() = user_id));


--
-- Name: characters Users access own characters; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own characters" ON bza_public.characters USING ((auth.uid() = user_id));


--
-- Name: comprehension_checkpoints Users access own checkpoints; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own checkpoints" ON bza_public.comprehension_checkpoints USING ((auth.uid() = user_id));


--
-- Name: contexts Users access own contexts; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own contexts" ON bza_public.contexts USING ((auth.uid() = user_id));


--
-- Name: conversations Users access own conversations; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own conversations" ON bza_public.conversations USING ((auth.uid() = user_id));


--
-- Name: page_discussions Users access own discussions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own discussions" ON bza_public.page_discussions USING ((auth.uid() = user_id));


--
-- Name: reading_features Users access own features; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own features" ON bza_public.reading_features USING ((auth.uid() = user_id));


--
-- Name: character_identities Users access own identities; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own identities" ON bza_public.character_identities USING ((auth.uid() = user_id));


--
-- Name: identity_mentions Users access own identity mentions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own identity mentions" ON bza_public.identity_mentions USING ((auth.uid() = user_id));


--
-- Name: page_images Users access own images; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own images" ON bza_public.page_images USING ((auth.uid() = user_id));


--
-- Name: key_concepts Users access own key concepts; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own key concepts" ON bza_public.key_concepts USING ((auth.uid() = user_id));


--
-- Name: location_mentions Users access own location mentions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own location mentions" ON bza_public.location_mentions USING ((auth.uid() = user_id));


--
-- Name: locations Users access own locations; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own locations" ON bza_public.locations USING ((auth.uid() = user_id));


--
-- Name: character_mentions Users access own mentions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own mentions" ON bza_public.character_mentions USING ((auth.uid() = user_id));


--
-- Name: chat_messages Users access own messages; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own messages" ON bza_public.chat_messages USING ((auth.uid() = user_id));


--
-- Name: reading_notes Users access own notes; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own notes" ON bza_public.reading_notes USING ((auth.uid() = user_id));


--
-- Name: conversation_prompts Users access own prompts; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own prompts" ON bza_public.conversation_prompts USING ((auth.uid() = user_id));


--
-- Name: quotes Users access own quotes; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own quotes" ON bza_public.quotes USING ((auth.uid() = user_id));


--
-- Name: character_relationships Users access own relationships; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own relationships" ON bza_public.character_relationships USING ((auth.uid() = user_id));


--
-- Name: theme_mentions Users access own theme mentions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own theme mentions" ON bza_public.theme_mentions USING ((auth.uid() = user_id));


--
-- Name: themes Users access own themes; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users access own themes" ON bza_public.themes USING ((auth.uid() = user_id));


--
-- Name: bookmarks Users can access own bookmarks; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can access own bookmarks" ON bza_public.bookmarks USING ((auth.uid() = user_id));


--
-- Name: page_bookmarks Users can access own page bookmarks; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can access own page bookmarks" ON bza_public.page_bookmarks USING ((auth.uid() = user_id));


--
-- Name: problem_sets Users can access own problem sets; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can access own problem sets" ON bza_public.problem_sets USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: reading_progress Users can access own reading progress; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can access own reading progress" ON bza_public.reading_progress USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: reading_sessions Users can access own sessions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can access own sessions" ON bza_public.reading_sessions USING ((auth.uid() = user_id));


--
-- Name: books Users can delete own books; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can delete own books" ON bza_public.books FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: books Users can insert own books; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can insert own books" ON bza_public.books FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: document_jobs Users can insert own document jobs; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can insert own document jobs" ON bza_public.document_jobs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON bza_public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: picturebook_moments Users can manage own picturebook moments; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can manage own picturebook moments" ON bza_public.picturebook_moments USING ((auth.uid() = user_id));


--
-- Name: picturebook_runs Users can manage own picturebook runs; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can manage own picturebook runs" ON bza_public.picturebook_runs USING ((auth.uid() = user_id));


--
-- Name: picturebook_settings Users can manage own picturebook settings; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can manage own picturebook settings" ON bza_public.picturebook_settings USING ((auth.uid() = user_id));


--
-- Name: document_jobs Users can select own document jobs; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can select own document jobs" ON bza_public.document_jobs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: books Users can update own books; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can update own books" ON bza_public.books FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can update own profile" ON bza_public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: books Users can view own books; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can view own books" ON bza_public.books FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users can view own profile" ON bza_public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: typst_scratchpad Users manage own scratchpad; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users manage own scratchpad" ON bza_public.typst_scratchpad TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: webhooks Users manage own webhooks; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users manage own webhooks" ON bza_public.webhooks USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: billing_customers Users view own billing; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own billing" ON bza_public.billing_customers USING ((auth.uid() = user_id));


--
-- Name: convert_jobs Users view own convert jobs; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own convert jobs" ON bza_public.convert_jobs USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: webhook_deliveries Users view own deliveries; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own deliveries" ON bza_public.webhook_deliveries FOR SELECT USING ((webhook_id IN ( SELECT webhooks.id
   FROM bza_public.webhooks
  WHERE (webhooks.user_id = auth.uid()))));


--
-- Name: invoices Users view own invoices; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own invoices" ON bza_public.invoices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: invoice_line_items Users view own line items; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own line items" ON bza_public.invoice_line_items FOR SELECT USING ((invoice_id IN ( SELECT invoices.id
   FROM bza_public.invoices
  WHERE (invoices.user_id = auth.uid()))));


--
-- Name: api_usage Users view own usage; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "Users view own usage" ON bza_public.api_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analytics_events; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: api_usage; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.api_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: app_config; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.app_config ENABLE ROW LEVEL SECURITY;

--
-- Name: app_config app_config_read_all; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY app_config_read_all ON bza_public.app_config FOR SELECT USING (true);


--
-- Name: billing_customers; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.billing_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: book_structure; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.book_structure ENABLE ROW LEVEL SECURITY;

--
-- Name: book_translations; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.book_translations ENABLE ROW LEVEL SECURITY;

--
-- Name: bookmarks; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: books; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.books ENABLE ROW LEVEL SECURITY;

--
-- Name: browser_extractions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.browser_extractions ENABLE ROW LEVEL SECURITY;

--
-- Name: browser_session_bookmarks; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.browser_session_bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: browser_session_chats; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.browser_session_chats ENABLE ROW LEVEL SECURITY;

--
-- Name: browser_sessions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.browser_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: character_identities; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.character_identities ENABLE ROW LEVEL SECURITY;

--
-- Name: character_mentions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.character_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: character_names; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.character_names ENABLE ROW LEVEL SECURITY;

--
-- Name: character_relationships; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.character_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: characters; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.characters ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: comprehension_checkpoints; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.comprehension_checkpoints ENABLE ROW LEVEL SECURITY;

--
-- Name: concept_observations; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.concept_observations ENABLE ROW LEVEL SECURITY;

--
-- Name: concept_pins; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.concept_pins ENABLE ROW LEVEL SECURITY;

--
-- Name: concept_pins concept_pins_user; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY concept_pins_user ON bza_public.concept_pins USING ((user_id = auth.uid()));


--
-- Name: concept_point_strength; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.concept_point_strength ENABLE ROW LEVEL SECURITY;

--
-- Name: concept_traversals; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.concept_traversals ENABLE ROW LEVEL SECURITY;

--
-- Name: contexts; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.contexts ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_prompts; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.conversation_prompts ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: convert_jobs; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.convert_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: correlate_presets; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.correlate_presets ENABLE ROW LEVEL SECURITY;

--
-- Name: cyoa_nodes; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.cyoa_nodes ENABLE ROW LEVEL SECURITY;

--
-- Name: cyoa_nodes cyoa_nodes_user; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY cyoa_nodes_user ON bza_public.cyoa_nodes USING ((story_id IN ( SELECT cyoa_stories.id
   FROM bza_public.cyoa_stories
  WHERE (cyoa_stories.user_id = auth.uid()))));


--
-- Name: cyoa_sessions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.cyoa_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: cyoa_sessions cyoa_sessions_user; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY cyoa_sessions_user ON bza_public.cyoa_sessions USING ((user_id = auth.uid()));


--
-- Name: cyoa_stories; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.cyoa_stories ENABLE ROW LEVEL SECURITY;

--
-- Name: cyoa_stories cyoa_stories_user; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY cyoa_stories_user ON bza_public.cyoa_stories USING ((user_id = auth.uid()));


--
-- Name: document_jobs; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.document_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: extension_tokens; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.extension_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: extension_tokens extension_tokens_user; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY extension_tokens_user ON bza_public.extension_tokens USING ((auth.uid() = user_id));


--
-- Name: flashcards; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.flashcards ENABLE ROW LEVEL SECURITY;

--
-- Name: flashcards flashcards_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY flashcards_owner ON bza_public.flashcards USING ((auth.uid() = user_id));


--
-- Name: identity_mentions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.identity_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_line_items; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.invoice_line_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: key_concepts; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.key_concepts ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_edges; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.knowledge_edges ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_edges knowledge_edges_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY knowledge_edges_owner ON bza_public.knowledge_edges USING ((EXISTS ( SELECT 1
   FROM bza_public.knowledge_nodes n
  WHERE ((n.id = knowledge_edges.from_node) AND (n.user_id = auth.uid())))));


--
-- Name: knowledge_nodes; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.knowledge_nodes ENABLE ROW LEVEL SECURITY;

--
-- Name: knowledge_nodes knowledge_nodes_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY knowledge_nodes_owner ON bza_public.knowledge_nodes USING ((auth.uid() = user_id));


--
-- Name: listen_sessions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.listen_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: listen_turns; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.listen_turns ENABLE ROW LEVEL SECURITY;

--
-- Name: location_mentions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.location_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: locations; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_tokens; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.newsletter_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: concept_observations own concept observations; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own concept observations" ON bza_public.concept_observations USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: concept_point_strength own concept strength; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own concept strength" ON bza_public.concept_point_strength USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: concept_traversals own concept traversals; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own concept traversals" ON bza_public.concept_traversals USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: correlate_presets own correlate presets; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own correlate presets" ON bza_public.correlate_presets USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: browser_extractions own extractions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own extractions" ON bza_public.browser_extractions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: listen_sessions own listen sessions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own listen sessions" ON bza_public.listen_sessions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: listen_turns own listen turns; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own listen turns" ON bza_public.listen_turns USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: browser_session_bookmarks own session bookmarks; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own session bookmarks" ON bza_public.browser_session_bookmarks USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: browser_session_chats own session chats; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own session chats" ON bza_public.browser_session_chats USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: browser_sessions own sessions; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "own sessions" ON bza_public.browser_sessions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: page_bookmarks; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.page_bookmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: page_discussions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.page_discussions ENABLE ROW LEVEL SECURITY;

--
-- Name: page_images; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.page_images ENABLE ROW LEVEL SECURITY;

--
-- Name: picturebook_moments; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.picturebook_moments ENABLE ROW LEVEL SECURITY;

--
-- Name: picturebook_runs; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.picturebook_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: picturebook_settings; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.picturebook_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_config; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.pricing_config ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_config pricing_config_read_all; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY pricing_config_read_all ON bza_public.pricing_config FOR SELECT USING (true);


--
-- Name: problem_sets; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.problem_sets ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.quiz_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_attempts quiz_attempts_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY quiz_attempts_owner ON bza_public.quiz_attempts USING ((auth.uid() = user_id));


--
-- Name: quiz_cards; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.quiz_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_cards quiz_cards_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY quiz_cards_owner ON bza_public.quiz_cards USING ((auth.uid() = user_id));


--
-- Name: quotes; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_features; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.reading_features ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_notes; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.reading_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_progress; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.reading_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: reading_sessions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.reading_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_tokens service_role_lookup; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY service_role_lookup ON bza_public.newsletter_tokens TO service_role USING (true);


--
-- Name: session_blacklist; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.session_blacklist ENABLE ROW LEVEL SECURITY;

--
-- Name: theme_mentions; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.theme_mentions ENABLE ROW LEVEL SECURITY;

--
-- Name: themes; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.themes ENABLE ROW LEVEL SECURITY;

--
-- Name: book_translations translations_owner; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY translations_owner ON bza_public.book_translations USING ((auth.uid() = user_id));


--
-- Name: typst_scratchpad; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.typst_scratchpad ENABLE ROW LEVEL SECURITY;

--
-- Name: wiki_updates users manage own wiki_updates; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY "users manage own wiki_updates" ON bza_public.wiki_updates USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: newsletter_tokens users_own_newsletter_token; Type: POLICY; Schema: bza_public; Owner: -
--

CREATE POLICY users_own_newsletter_token ON bza_public.newsletter_tokens USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: webhook_deliveries; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

--
-- Name: webhooks; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.webhooks ENABLE ROW LEVEL SECURITY;

--
-- Name: wiki_updates; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.wiki_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: youtube_tracks; Type: ROW SECURITY; Schema: bza_public; Owner: -
--

ALTER TABLE bza_public.youtube_tracks ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA bza_public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA bza_public TO anon;
GRANT USAGE ON SCHEMA bza_public TO authenticated;
GRANT USAGE ON SCHEMA bza_public TO service_role;


--
-- Name: FUNCTION calculate_page_count(content_text text, chars_per_page integer); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.calculate_page_count(content_text text, chars_per_page integer) TO anon;
GRANT ALL ON FUNCTION bza_public.calculate_page_count(content_text text, chars_per_page integer) TO authenticated;
GRANT ALL ON FUNCTION bza_public.calculate_page_count(content_text text, chars_per_page integer) TO service_role;


--
-- Name: FUNCTION check_quota_before_insert(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.check_quota_before_insert() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.check_quota_before_insert() TO service_role;


--
-- Name: FUNCTION get_and_increment_overage(p_user_id uuid, p_included_cents bigint); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.get_and_increment_overage(p_user_id uuid, p_included_cents bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.get_and_increment_overage(p_user_id uuid, p_included_cents bigint) TO service_role;
GRANT ALL ON FUNCTION bza_public.get_and_increment_overage(p_user_id uuid, p_included_cents bigint) TO authenticated;


--
-- Name: FUNCTION get_anonymous_usage_stats(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.get_anonymous_usage_stats() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.get_anonymous_usage_stats() TO service_role;


--
-- Name: FUNCTION get_book_statistics(book_uuid bigint); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_book_statistics(book_uuid bigint) TO anon;
GRANT ALL ON FUNCTION bza_public.get_book_statistics(book_uuid bigint) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_book_statistics(book_uuid bigint) TO service_role;


--
-- Name: FUNCTION get_monthly_api_costs(user_uuid uuid, month_start timestamp with time zone); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_monthly_api_costs(user_uuid uuid, month_start timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION bza_public.get_monthly_api_costs(user_uuid uuid, month_start timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_monthly_api_costs(user_uuid uuid, month_start timestamp with time zone) TO service_role;


--
-- Name: FUNCTION get_reading_progress(book_uuid bigint); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_reading_progress(book_uuid bigint) TO anon;
GRANT ALL ON FUNCTION bza_public.get_reading_progress(book_uuid bigint) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_reading_progress(book_uuid bigint) TO service_role;


--
-- Name: FUNCTION get_reading_stats(p_user_id uuid, p_days integer); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_reading_stats(p_user_id uuid, p_days integer) TO anon;
GRANT ALL ON FUNCTION bza_public.get_reading_stats(p_user_id uuid, p_days integer) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_reading_stats(p_user_id uuid, p_days integer) TO service_role;


--
-- Name: FUNCTION get_storage_usage(user_uuid uuid); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_storage_usage(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION bza_public.get_storage_usage(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_storage_usage(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_quota(user_uuid uuid); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_user_quota(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION bza_public.get_user_quota(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_user_quota(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_weak_topics(p_user_id uuid, p_book_id bigint, p_limit integer); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.get_weak_topics(p_user_id uuid, p_book_id bigint, p_limit integer) TO anon;
GRANT ALL ON FUNCTION bza_public.get_weak_topics(p_user_id uuid, p_book_id bigint, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION bza_public.get_weak_topics(p_user_id uuid, p_book_id bigint, p_limit integer) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.handle_new_user() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.handle_new_user() TO service_role;


--
-- Name: FUNCTION is_blacklisted(check_user_id uuid, check_ip inet); Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON FUNCTION bza_public.is_blacklisted(check_user_id uuid, check_ip inet) TO anon;
GRANT ALL ON FUNCTION bza_public.is_blacklisted(check_user_id uuid, check_ip inet) TO authenticated;
GRANT ALL ON FUNCTION bza_public.is_blacklisted(check_user_id uuid, check_ip inet) TO service_role;


--
-- Name: FUNCTION reconcile_all_overages(p_included_cents bigint); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.reconcile_all_overages(p_included_cents bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.reconcile_all_overages(p_included_cents bigint) TO service_role;
GRANT ALL ON FUNCTION bza_public.reconcile_all_overages(p_included_cents bigint) TO authenticated;


--
-- Name: FUNCTION record_api_usage(p_user_id uuid, p_provider text, p_model text, p_endpoint_type text, p_request_type text, p_input_tokens integer, p_output_tokens integer, p_base_cost numeric, p_book_id bigint, p_page_num integer, p_metadata jsonb); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.record_api_usage(p_user_id uuid, p_provider text, p_model text, p_endpoint_type text, p_request_type text, p_input_tokens integer, p_output_tokens integer, p_base_cost numeric, p_book_id bigint, p_page_num integer, p_metadata jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.record_api_usage(p_user_id uuid, p_provider text, p_model text, p_endpoint_type text, p_request_type text, p_input_tokens integer, p_output_tokens integer, p_base_cost numeric, p_book_id bigint, p_page_num integer, p_metadata jsonb) TO service_role;
GRANT ALL ON FUNCTION bza_public.record_api_usage(p_user_id uuid, p_provider text, p_model text, p_endpoint_type text, p_request_type text, p_input_tokens integer, p_output_tokens integer, p_base_cost numeric, p_book_id bigint, p_page_num integer, p_metadata jsonb) TO authenticated;


--
-- Name: FUNCTION refresh_monthly_usage(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.refresh_monthly_usage() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.refresh_monthly_usage() TO service_role;
GRANT ALL ON FUNCTION bza_public.refresh_monthly_usage() TO authenticated;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.set_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.set_updated_at() TO service_role;


--
-- Name: FUNCTION update_app_config_updated_at(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.update_app_config_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.update_app_config_updated_at() TO service_role;


--
-- Name: FUNCTION update_pricing_config_updated_at(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.update_pricing_config_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.update_pricing_config_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.update_updated_at() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.update_updated_at() TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: bza_public; Owner: -
--

REVOKE ALL ON FUNCTION bza_public.update_updated_at_column() FROM PUBLIC;
GRANT ALL ON FUNCTION bza_public.update_updated_at_column() TO service_role;


--
-- Name: TABLE analytics_events; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.analytics_events TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.analytics_events TO authenticated;
GRANT ALL ON TABLE bza_public.analytics_events TO service_role;


--
-- Name: SEQUENCE analytics_events_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.analytics_events_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.analytics_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.analytics_events_id_seq TO service_role;


--
-- Name: TABLE api_usage; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.api_usage TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.api_usage TO authenticated;
GRANT ALL ON TABLE bza_public.api_usage TO service_role;


--
-- Name: SEQUENCE api_usage_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.api_usage_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.api_usage_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.api_usage_id_seq TO service_role;


--
-- Name: TABLE app_config; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.app_config TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.app_config TO authenticated;
GRANT ALL ON TABLE bza_public.app_config TO service_role;


--
-- Name: TABLE billing_customers; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.billing_customers TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.billing_customers TO authenticated;
GRANT ALL ON TABLE bza_public.billing_customers TO service_role;


--
-- Name: SEQUENCE billing_customers_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.billing_customers_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.billing_customers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.billing_customers_id_seq TO service_role;


--
-- Name: TABLE book_structure; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.book_structure TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.book_structure TO authenticated;
GRANT ALL ON TABLE bza_public.book_structure TO service_role;


--
-- Name: SEQUENCE book_structure_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.book_structure_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.book_structure_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.book_structure_id_seq TO service_role;


--
-- Name: TABLE book_translations; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.book_translations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.book_translations TO authenticated;
GRANT ALL ON TABLE bza_public.book_translations TO service_role;


--
-- Name: SEQUENCE book_translations_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.book_translations_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.book_translations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.book_translations_id_seq TO service_role;


--
-- Name: TABLE bookmarks; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.bookmarks TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.bookmarks TO authenticated;
GRANT ALL ON TABLE bza_public.bookmarks TO service_role;


--
-- Name: SEQUENCE bookmarks_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.bookmarks_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.bookmarks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.bookmarks_id_seq TO service_role;


--
-- Name: TABLE books; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.books TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.books TO authenticated;
GRANT ALL ON TABLE bza_public.books TO service_role;


--
-- Name: SEQUENCE books_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.books_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.books_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.books_id_seq TO service_role;


--
-- Name: TABLE browser_extractions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.browser_extractions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.browser_extractions TO authenticated;
GRANT ALL ON TABLE bza_public.browser_extractions TO service_role;


--
-- Name: TABLE browser_session_bookmarks; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.browser_session_bookmarks TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.browser_session_bookmarks TO authenticated;
GRANT ALL ON TABLE bza_public.browser_session_bookmarks TO service_role;


--
-- Name: TABLE browser_session_chats; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.browser_session_chats TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.browser_session_chats TO authenticated;
GRANT ALL ON TABLE bza_public.browser_session_chats TO service_role;


--
-- Name: TABLE browser_sessions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.browser_sessions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.browser_sessions TO authenticated;
GRANT ALL ON TABLE bza_public.browser_sessions TO service_role;


--
-- Name: TABLE character_identities; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.character_identities TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.character_identities TO authenticated;
GRANT ALL ON TABLE bza_public.character_identities TO service_role;


--
-- Name: SEQUENCE character_identities_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.character_identities_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.character_identities_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.character_identities_id_seq TO service_role;


--
-- Name: TABLE character_mentions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.character_mentions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.character_mentions TO authenticated;
GRANT ALL ON TABLE bza_public.character_mentions TO service_role;


--
-- Name: SEQUENCE character_mentions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.character_mentions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.character_mentions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.character_mentions_id_seq TO service_role;


--
-- Name: TABLE character_names; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.character_names TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.character_names TO authenticated;
GRANT ALL ON TABLE bza_public.character_names TO service_role;


--
-- Name: SEQUENCE character_names_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.character_names_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.character_names_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.character_names_id_seq TO service_role;


--
-- Name: TABLE character_relationships; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.character_relationships TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.character_relationships TO authenticated;
GRANT ALL ON TABLE bza_public.character_relationships TO service_role;


--
-- Name: SEQUENCE character_relationships_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.character_relationships_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.character_relationships_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.character_relationships_id_seq TO service_role;


--
-- Name: TABLE characters; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.characters TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.characters TO authenticated;
GRANT ALL ON TABLE bza_public.characters TO service_role;


--
-- Name: SEQUENCE characters_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.characters_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.characters_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.characters_id_seq TO service_role;


--
-- Name: TABLE chat_messages; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.chat_messages TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.chat_messages TO authenticated;
GRANT ALL ON TABLE bza_public.chat_messages TO service_role;


--
-- Name: SEQUENCE chat_messages_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.chat_messages_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.chat_messages_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.chat_messages_id_seq TO service_role;


--
-- Name: TABLE comprehension_checkpoints; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.comprehension_checkpoints TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.comprehension_checkpoints TO authenticated;
GRANT ALL ON TABLE bza_public.comprehension_checkpoints TO service_role;


--
-- Name: SEQUENCE comprehension_checkpoints_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.comprehension_checkpoints_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.comprehension_checkpoints_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.comprehension_checkpoints_id_seq TO service_role;


--
-- Name: TABLE concept_observations; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.concept_observations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_observations TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_observations TO service_role;


--
-- Name: TABLE concept_pins; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.concept_pins TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_pins TO authenticated;
GRANT ALL ON TABLE bza_public.concept_pins TO service_role;


--
-- Name: SEQUENCE concept_pins_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.concept_pins_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.concept_pins_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.concept_pins_id_seq TO service_role;


--
-- Name: TABLE concept_point_strength; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.concept_point_strength TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_point_strength TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_point_strength TO service_role;


--
-- Name: TABLE concept_traversals; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.concept_traversals TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_traversals TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.concept_traversals TO service_role;


--
-- Name: TABLE contexts; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.contexts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.contexts TO authenticated;
GRANT ALL ON TABLE bza_public.contexts TO service_role;


--
-- Name: SEQUENCE contexts_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.contexts_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.contexts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.contexts_id_seq TO service_role;


--
-- Name: TABLE conversation_prompts; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.conversation_prompts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.conversation_prompts TO authenticated;
GRANT ALL ON TABLE bza_public.conversation_prompts TO service_role;


--
-- Name: SEQUENCE conversation_prompts_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.conversation_prompts_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.conversation_prompts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.conversation_prompts_id_seq TO service_role;


--
-- Name: TABLE conversations; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.conversations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.conversations TO authenticated;
GRANT ALL ON TABLE bza_public.conversations TO service_role;


--
-- Name: SEQUENCE conversations_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.conversations_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.conversations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.conversations_id_seq TO service_role;


--
-- Name: TABLE convert_jobs; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.convert_jobs TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.convert_jobs TO authenticated;
GRANT ALL ON TABLE bza_public.convert_jobs TO service_role;


--
-- Name: TABLE correlate_presets; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.correlate_presets TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.correlate_presets TO authenticated;
GRANT ALL ON TABLE bza_public.correlate_presets TO service_role;


--
-- Name: TABLE current_month_usage; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.current_month_usage TO anon;
GRANT SELECT ON TABLE bza_public.current_month_usage TO authenticated;
GRANT ALL ON TABLE bza_public.current_month_usage TO service_role;


--
-- Name: TABLE cyoa_nodes; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.cyoa_nodes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.cyoa_nodes TO authenticated;
GRANT ALL ON TABLE bza_public.cyoa_nodes TO service_role;


--
-- Name: SEQUENCE cyoa_nodes_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.cyoa_nodes_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.cyoa_nodes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.cyoa_nodes_id_seq TO service_role;


--
-- Name: TABLE cyoa_sessions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.cyoa_sessions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.cyoa_sessions TO authenticated;
GRANT ALL ON TABLE bza_public.cyoa_sessions TO service_role;


--
-- Name: SEQUENCE cyoa_sessions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.cyoa_sessions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.cyoa_sessions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.cyoa_sessions_id_seq TO service_role;


--
-- Name: TABLE cyoa_stories; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.cyoa_stories TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.cyoa_stories TO authenticated;
GRANT ALL ON TABLE bza_public.cyoa_stories TO service_role;


--
-- Name: SEQUENCE cyoa_stories_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.cyoa_stories_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.cyoa_stories_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.cyoa_stories_id_seq TO service_role;


--
-- Name: TABLE document_jobs; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.document_jobs TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.document_jobs TO authenticated;
GRANT ALL ON TABLE bza_public.document_jobs TO service_role;


--
-- Name: TABLE extension_tokens; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.extension_tokens TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.extension_tokens TO authenticated;
GRANT ALL ON TABLE bza_public.extension_tokens TO service_role;


--
-- Name: SEQUENCE extension_tokens_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.extension_tokens_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.extension_tokens_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.extension_tokens_id_seq TO service_role;


--
-- Name: TABLE flashcards; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.flashcards TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.flashcards TO authenticated;
GRANT ALL ON TABLE bza_public.flashcards TO service_role;


--
-- Name: SEQUENCE flashcards_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.flashcards_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.flashcards_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.flashcards_id_seq TO service_role;


--
-- Name: TABLE identity_mentions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.identity_mentions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.identity_mentions TO authenticated;
GRANT ALL ON TABLE bza_public.identity_mentions TO service_role;


--
-- Name: SEQUENCE identity_mentions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.identity_mentions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.identity_mentions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.identity_mentions_id_seq TO service_role;


--
-- Name: TABLE invoice_line_items; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.invoice_line_items TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.invoice_line_items TO authenticated;
GRANT ALL ON TABLE bza_public.invoice_line_items TO service_role;


--
-- Name: SEQUENCE invoice_line_items_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.invoice_line_items_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.invoice_line_items_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.invoice_line_items_id_seq TO service_role;


--
-- Name: TABLE invoices; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.invoices TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.invoices TO authenticated;
GRANT ALL ON TABLE bza_public.invoices TO service_role;


--
-- Name: SEQUENCE invoices_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.invoices_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.invoices_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.invoices_id_seq TO service_role;


--
-- Name: TABLE key_concepts; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.key_concepts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.key_concepts TO authenticated;
GRANT ALL ON TABLE bza_public.key_concepts TO service_role;


--
-- Name: SEQUENCE key_concepts_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.key_concepts_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.key_concepts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.key_concepts_id_seq TO service_role;


--
-- Name: TABLE knowledge_edges; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.knowledge_edges TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.knowledge_edges TO authenticated;
GRANT ALL ON TABLE bza_public.knowledge_edges TO service_role;


--
-- Name: SEQUENCE knowledge_edges_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.knowledge_edges_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.knowledge_edges_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.knowledge_edges_id_seq TO service_role;


--
-- Name: TABLE knowledge_nodes; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.knowledge_nodes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.knowledge_nodes TO authenticated;
GRANT ALL ON TABLE bza_public.knowledge_nodes TO service_role;


--
-- Name: SEQUENCE knowledge_nodes_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.knowledge_nodes_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.knowledge_nodes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.knowledge_nodes_id_seq TO service_role;


--
-- Name: TABLE listen_sessions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.listen_sessions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.listen_sessions TO authenticated;
GRANT ALL ON TABLE bza_public.listen_sessions TO service_role;


--
-- Name: TABLE listen_turns; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.listen_turns TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.listen_turns TO authenticated;
GRANT ALL ON TABLE bza_public.listen_turns TO service_role;


--
-- Name: TABLE location_mentions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.location_mentions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.location_mentions TO authenticated;
GRANT ALL ON TABLE bza_public.location_mentions TO service_role;


--
-- Name: SEQUENCE location_mentions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.location_mentions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.location_mentions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.location_mentions_id_seq TO service_role;


--
-- Name: TABLE locations; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.locations TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.locations TO authenticated;
GRANT ALL ON TABLE bza_public.locations TO service_role;


--
-- Name: SEQUENCE locations_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.locations_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.locations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.locations_id_seq TO service_role;


--
-- Name: TABLE monthly_usage_summary; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON TABLE bza_public.monthly_usage_summary TO service_role;


--
-- Name: TABLE newsletter_tokens; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.newsletter_tokens TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.newsletter_tokens TO authenticated;
GRANT ALL ON TABLE bza_public.newsletter_tokens TO service_role;


--
-- Name: TABLE page_bookmarks; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.page_bookmarks TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.page_bookmarks TO authenticated;
GRANT ALL ON TABLE bza_public.page_bookmarks TO service_role;


--
-- Name: SEQUENCE page_bookmarks_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.page_bookmarks_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.page_bookmarks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.page_bookmarks_id_seq TO service_role;


--
-- Name: TABLE page_discussions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.page_discussions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.page_discussions TO authenticated;
GRANT ALL ON TABLE bza_public.page_discussions TO service_role;


--
-- Name: SEQUENCE page_discussions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.page_discussions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.page_discussions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.page_discussions_id_seq TO service_role;


--
-- Name: TABLE page_images; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.page_images TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.page_images TO authenticated;
GRANT ALL ON TABLE bza_public.page_images TO service_role;


--
-- Name: SEQUENCE page_images_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.page_images_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.page_images_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.page_images_id_seq TO service_role;


--
-- Name: TABLE picturebook_moments; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.picturebook_moments TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.picturebook_moments TO authenticated;
GRANT ALL ON TABLE bza_public.picturebook_moments TO service_role;


--
-- Name: SEQUENCE picturebook_moments_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.picturebook_moments_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.picturebook_moments_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.picturebook_moments_id_seq TO service_role;


--
-- Name: TABLE picturebook_runs; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.picturebook_runs TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.picturebook_runs TO authenticated;
GRANT ALL ON TABLE bza_public.picturebook_runs TO service_role;


--
-- Name: SEQUENCE picturebook_runs_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.picturebook_runs_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.picturebook_runs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.picturebook_runs_id_seq TO service_role;


--
-- Name: TABLE picturebook_settings; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.picturebook_settings TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.picturebook_settings TO authenticated;
GRANT ALL ON TABLE bza_public.picturebook_settings TO service_role;


--
-- Name: SEQUENCE picturebook_settings_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.picturebook_settings_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.picturebook_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.picturebook_settings_id_seq TO service_role;


--
-- Name: TABLE pricing_config; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.pricing_config TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.pricing_config TO authenticated;
GRANT ALL ON TABLE bza_public.pricing_config TO service_role;


--
-- Name: SEQUENCE pricing_config_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.pricing_config_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.pricing_config_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.pricing_config_id_seq TO service_role;


--
-- Name: TABLE problem_sets; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.problem_sets TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.problem_sets TO authenticated;
GRANT ALL ON TABLE bza_public.problem_sets TO service_role;


--
-- Name: SEQUENCE problem_sets_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.problem_sets_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.problem_sets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.problem_sets_id_seq TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.profiles TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.profiles TO authenticated;
GRANT ALL ON TABLE bza_public.profiles TO service_role;


--
-- Name: TABLE quiz_attempts; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.quiz_attempts TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.quiz_attempts TO authenticated;
GRANT ALL ON TABLE bza_public.quiz_attempts TO service_role;


--
-- Name: SEQUENCE quiz_attempts_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.quiz_attempts_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.quiz_attempts_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.quiz_attempts_id_seq TO service_role;


--
-- Name: TABLE quiz_cards; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.quiz_cards TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.quiz_cards TO authenticated;
GRANT ALL ON TABLE bza_public.quiz_cards TO service_role;


--
-- Name: SEQUENCE quiz_cards_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.quiz_cards_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.quiz_cards_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.quiz_cards_id_seq TO service_role;


--
-- Name: TABLE quotes; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.quotes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.quotes TO authenticated;
GRANT ALL ON TABLE bza_public.quotes TO service_role;


--
-- Name: SEQUENCE quotes_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.quotes_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.quotes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.quotes_id_seq TO service_role;


--
-- Name: TABLE reading_features; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.reading_features TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.reading_features TO authenticated;
GRANT ALL ON TABLE bza_public.reading_features TO service_role;


--
-- Name: SEQUENCE reading_features_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.reading_features_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.reading_features_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.reading_features_id_seq TO service_role;


--
-- Name: TABLE reading_notes; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.reading_notes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.reading_notes TO authenticated;
GRANT ALL ON TABLE bza_public.reading_notes TO service_role;


--
-- Name: SEQUENCE reading_notes_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.reading_notes_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.reading_notes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.reading_notes_id_seq TO service_role;


--
-- Name: TABLE reading_progress; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.reading_progress TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.reading_progress TO authenticated;
GRANT ALL ON TABLE bza_public.reading_progress TO service_role;


--
-- Name: TABLE reading_sessions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.reading_sessions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.reading_sessions TO authenticated;
GRANT ALL ON TABLE bza_public.reading_sessions TO service_role;


--
-- Name: SEQUENCE reading_sessions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.reading_sessions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.reading_sessions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.reading_sessions_id_seq TO service_role;


--
-- Name: TABLE session_blacklist; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.session_blacklist TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.session_blacklist TO authenticated;
GRANT ALL ON TABLE bza_public.session_blacklist TO service_role;


--
-- Name: SEQUENCE session_blacklist_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.session_blacklist_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.session_blacklist_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.session_blacklist_id_seq TO service_role;


--
-- Name: TABLE theme_mentions; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.theme_mentions TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.theme_mentions TO authenticated;
GRANT ALL ON TABLE bza_public.theme_mentions TO service_role;


--
-- Name: SEQUENCE theme_mentions_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.theme_mentions_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.theme_mentions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.theme_mentions_id_seq TO service_role;


--
-- Name: TABLE themes; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.themes TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.themes TO authenticated;
GRANT ALL ON TABLE bza_public.themes TO service_role;


--
-- Name: SEQUENCE themes_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.themes_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.themes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.themes_id_seq TO service_role;


--
-- Name: TABLE typst_scratchpad; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.typst_scratchpad TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.typst_scratchpad TO authenticated;
GRANT ALL ON TABLE bza_public.typst_scratchpad TO service_role;


--
-- Name: TABLE user_usage_summary; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.user_usage_summary TO anon;
GRANT SELECT ON TABLE bza_public.user_usage_summary TO authenticated;
GRANT ALL ON TABLE bza_public.user_usage_summary TO service_role;


--
-- Name: TABLE webhook_deliveries; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.webhook_deliveries TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.webhook_deliveries TO authenticated;
GRANT ALL ON TABLE bza_public.webhook_deliveries TO service_role;


--
-- Name: SEQUENCE webhook_deliveries_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.webhook_deliveries_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.webhook_deliveries_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.webhook_deliveries_id_seq TO service_role;


--
-- Name: TABLE webhooks; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.webhooks TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.webhooks TO authenticated;
GRANT ALL ON TABLE bza_public.webhooks TO service_role;


--
-- Name: SEQUENCE webhooks_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.webhooks_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.webhooks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.webhooks_id_seq TO service_role;


--
-- Name: TABLE wiki_updates; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT ON TABLE bza_public.wiki_updates TO anon;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.wiki_updates TO authenticated;
GRANT ALL ON TABLE bza_public.wiki_updates TO service_role;


--
-- Name: SEQUENCE wiki_updates_id_seq; Type: ACL; Schema: bza_public; Owner: -
--

GRANT ALL ON SEQUENCE bza_public.wiki_updates_id_seq TO anon;
GRANT ALL ON SEQUENCE bza_public.wiki_updates_id_seq TO authenticated;
GRANT ALL ON SEQUENCE bza_public.wiki_updates_id_seq TO service_role;


--
-- Name: TABLE youtube_tracks; Type: ACL; Schema: bza_public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.youtube_tracks TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE bza_public.youtube_tracks TO authenticated;
GRANT SELECT ON TABLE bza_public.youtube_tracks TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: bza_public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bza_public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bza_public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA bza_public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict PjuFgc1wr4LFm9OpkDzqq566xB6QqtXwMZGTQ3xUwcNOOyhqX8WKnEF7BNmfOLP

