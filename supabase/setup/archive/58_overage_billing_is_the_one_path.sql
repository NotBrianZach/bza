-- Make monthly overage reconciliation the only metering path, and give the
-- included allowance a home.
--
-- There were two. get_weekly_usage summed base_cost over a rolling seven days
-- and scripts/report-usage.sh applied the 2x markup and posted a Stripe meter
-- event; reconcile_all_overages sums charged_cost over the calendar month,
-- subtracts an included allowance, and reports only the delta it has not
-- reported before. They agreed on the amount — charged_cost is base_cost x
-- pricing_config.markup_multiplier, which is 2.00 on every row — and disagreed
-- on everything else: period, allowance, and whether running twice bills twice.
--
-- The weekly path was the one that could double-bill, and it had been broken
-- since stripe_customer_id moved from profiles to billing_customers: it still
-- joined `profiles p` and read `p.stripe_customer_id`, a column that is not
-- there. It failed at call time rather than at creation, because a LANGUAGE sql
-- body is validated when it is written and not when the column underneath it
-- moves, and report-usage.sh fetched it with `curl -sf`, which swallows the
-- error. So it has reported nothing for as long as the column has been gone.
--
-- Neither path has ever billed anything: all three billing_customers rows read
-- overage_reported_cents = 0 with overage_period_start null.

begin;

-- ── The weekly path goes away ────────────────────────────────────────────────
-- Dropped rather than repaired. Repairing it would have meant choosing to keep
-- the model with no allowance and no idempotency, and then maintaining two
-- things that bill the same usage.
drop function if exists public.get_weekly_usage(timestamp with time zone);

-- ── The allowance stops being a magic number ─────────────────────────────────
-- Both overage functions declared `p_included_cents bigint DEFAULT 500`. That
-- asserts $5/month of included usage, and nothing anywhere else in the schema
-- agreed or disagreed — there is no included/allowance column on pricing_config
-- or anywhere else. A pricing fact living in a function's default argument is
-- one nobody can review, and the failure mode is quiet: get the number wrong
-- and every customer is undercharged by that much every month, which looks
-- exactly like working software.
--
-- app_config already is the place for this shape of fact: key, jsonb value,
-- and a description column that gets read by whoever finds it next.
insert into public.app_config (key, value, description)
values (
  'billing.included_cents',
  '500'::jsonb,
  'Usage included in a subscription before overage is metered, in cents of '
  || 'charged_cost (markup already applied). Read by '
  || 'reconcile_all_overages and get_and_increment_overage; they raise rather '
  || 'than guess if it is missing.'
)
on conflict (key) do nothing;

-- ── Both overage functions read it, and refuse to guess ──────────────────────
-- The argument stays, so a caller can still override for a one-off, but the
-- default is now null and null means "ask config". If config has no row, these
-- raise instead of falling back to a number.
--
-- Failing closed is the point. The two ways to be wrong here are not
-- symmetrical: billing a customer for usage their plan includes is money taken
-- that should not have been, while not billing is money not yet collected. So
-- an absent allowance stops the run rather than picking either end.

create or replace function public.get_and_increment_overage(
  p_user_id uuid,
  p_included_cents bigint default null
)
returns table(stripe_customer_id text, delta_cents bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    (SELECT (value #>> '{}')::BIGINT FROM public.app_config
      WHERE key = 'billing.included_cents')
  );
  IF v_included IS NULL THEN
    RAISE EXCEPTION 'billing.included_cents is not set in app_config; refusing to meter overage';
  END IF;

  SELECT bc.stripe_customer_id, bc.overage_reported_cents, bc.overage_period_start
  INTO   v_customer_id, v_reported, v_period_col
  FROM   public.billing_customers bc WHERE bc.user_id = p_user_id FOR UPDATE;

  IF v_customer_id IS NULL THEN RETURN; END IF;

  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  IF v_period_col IS DISTINCT FROM v_period_start THEN v_reported := 0; END IF;

  SELECT COALESCE(FLOOR(SUM(charged_cost) * 100)::BIGINT, 0)
  INTO v_total_cents
  FROM public.api_usage
  WHERE user_id = p_user_id AND timestamp >= DATE_TRUNC('month', CURRENT_TIMESTAMP);

  v_overage := GREATEST(0, v_total_cents - v_included);
  v_delta   := GREATEST(0, v_overage - v_reported);

  UPDATE public.billing_customers
  SET overage_reported_cents = v_reported + v_delta,
      overage_period_start   = v_period_start
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_customer_id, v_delta;
END;
$function$;

create or replace function public.reconcile_all_overages(
  p_included_cents bigint default null
)
returns table(stripe_customer_id text, delta_cents bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
    (SELECT (value #>> '{}')::BIGINT FROM public.app_config
      WHERE key = 'billing.included_cents')
  );
  IF v_included IS NULL THEN
    RAISE EXCEPTION 'billing.included_cents is not set in app_config; refusing to meter overage';
  END IF;

  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  FOR rec IN
    SELECT bc.user_id, bc.stripe_customer_id, bc.overage_reported_cents, bc.overage_period_start
    FROM   public.billing_customers bc WHERE bc.stripe_customer_id IS NOT NULL FOR UPDATE OF bc
  LOOP
    v_reported := CASE WHEN rec.overage_period_start IS DISTINCT FROM v_period_start THEN 0
                       ELSE rec.overage_reported_cents END;
    SELECT COALESCE(FLOOR(SUM(au.charged_cost) * 100)::BIGINT, 0)
    INTO   v_total_cents FROM public.api_usage au
    WHERE  au.user_id = rec.user_id AND au.timestamp >= DATE_TRUNC('month', CURRENT_TIMESTAMP);
    v_overage := GREATEST(0, v_total_cents - v_included);
    v_delta   := GREATEST(0, v_overage - v_reported);
    UPDATE public.billing_customers
    SET  overage_reported_cents = v_reported + v_delta, overage_period_start = v_period_start
    WHERE user_id = rec.user_id;
    IF v_delta > 0 THEN
      stripe_customer_id := rec.stripe_customer_id; delta_cents := v_delta; RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;

commit;

-- Note on the increment-then-report order, which is deliberate and is a
-- trade: both functions write overage_reported_cents before their caller has
-- posted anything to Stripe. If the Stripe call then fails, that delta is
-- recorded as reported and is never billed — usage is lost, not
-- double-charged. The opposite order risks billing twice for one period, and
-- of the two, silently charging a customer twice is the worse failure. The
-- caller logs any delta it could not post so the gap is visible rather than
-- merely absent; see scripts/reconcile-overages.sh.
