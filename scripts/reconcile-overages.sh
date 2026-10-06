#!/usr/bin/env bash
# reconcile-overages.sh — Meter monthly usage overage to Stripe.
#
# Replaces report-usage.sh, which billed a rolling seven days with no included
# allowance and no record of what it had already billed. Re-running it inside
# one week charged the same usage twice.
#
# Billing model, all of which lives in the database:
#   1. reconcile_all_overages() sums each customer's charged_cost for the
#      calendar month. charged_cost already carries the 2x markup — it is
#      base_cost x pricing_config.markup_multiplier — so nothing is multiplied
#      here. report-usage.sh applied the markup in the shell; doing both would
#      bill 4x.
#   2. It subtracts the included allowance, read from
#      app_config['billing.included_cents'], and raises if that key is absent
#      rather than assuming a number.
#   3. It returns only the delta it has not reported before, recording the new
#      total in billing_customers.overage_reported_cents against the period.
#      A customer under their allowance returns no row at all.
#   4. Each returned delta is posted to the Stripe meter as ai_usage_cents.
#
# Safe to re-run. The delta accounting is in the database and the function
# takes FOR UPDATE on the rows it reports, so a second run in the same month
# finds nothing new and two concurrent runs cannot both claim one delta. That
# is the property report-usage.sh did not have.
#
# One real trade, and it is deliberate: the delta is marked reported before
# this script posts it. A Stripe failure therefore loses that usage rather than
# risking billing it twice. Those deltas are printed as UNREPORTED below and
# are the thing to look for in the log — they will not appear on an invoice and
# nothing will retry them.
#
# Schedule: monthly is enough for correctness, but more often is harmless and
# smooths the meter. Weekly:
#   0 0 * * 0 /path/to/scripts/reconcile-overages.sh >> logs/overage.log 2>&1
#
# Usage:
#   ./scripts/reconcile-overages.sh             # reconcile and post to Stripe
#   ./scripts/reconcile-overages.sh --dry-run   # show deltas, post nothing
#
# --dry-run still calls the function, which still writes
# overage_reported_cents. It is a dry run of the Stripe call, not of the
# accounting. To see what would bill without recording anything, run
# `select * from reconcile_all_overages()` inside a transaction and roll back.

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()     { echo -e "${GREEN}✓ $*${NC}"; }
info()   { echo -e "${YELLOW}→ $*${NC}"; }
warn()   { echo -e "${RED}! $*${NC}"; }
header() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }
die()    { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

DRY_RUN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        *) die "Unknown argument: $1" ;;
    esac
done

command -v curl >/dev/null || die "curl not found"
command -v jq   >/dev/null || die "jq not found"

header "Loading credentials"
SUPABASE_URL=$(templedb env secret get bza SUPABASE_URL 2>/dev/null) \
    || die "SUPABASE_URL not set"
SERVICE_KEY=$(templedb env secret get bza SUPABASE_SERVICE_ROLE_KEY 2>/dev/null) \
    || die "SUPABASE_SERVICE_ROLE_KEY not set"
STRIPE_KEY=$(templedb env secret get bza STRIPE_SECRET_KEY 2>/dev/null) \
    || die "STRIPE_SECRET_KEY not set"
ok "Project: $(echo "$SUPABASE_URL" | sed 's|https://\([^.]*\)\..*|\1|')"
[ "$DRY_RUN" = true ] && info "Mode: DRY RUN (no Stripe calls)"

header "Reconciling overage"

# No -f here, deliberately. report-usage.sh used `curl -sf`, which turns an
# error response into an empty body and a nonzero exit, and under `set -e` the
# script died with nothing said about why — which is how a broken function went
# unnoticed. Read the body, then decide.
# Content-Profile names the schema. reconcile_all_overages moved to bza_public
# with everything else (setup/57), and a raw curl has no supabase-js client to
# carry `db.schema` for it — the header is the only way to say so. Without it
# PostgREST looks for the function in `public`, does not find it, and answers
# 404/PGRST202: caught by the HTTP check below rather than silently, but the
# billing run still meters nothing.
RESPONSE=$(curl -sS -w '\n%{http_code}' \
    "${SUPABASE_URL}/rest/v1/rpc/reconcile_all_overages" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Profile: bza_public" \
    -H "Content-Type: application/json" \
    -d '{}') || die "could not reach Supabase"

HTTP_CODE=$(printf '%s' "$RESPONSE" | tail -n1)
BODY=$(printf '%s' "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    warn "reconcile_all_overages failed (HTTP $HTTP_CODE)"
    echo "$BODY" | jq -r '.message // .hint // .' 2>/dev/null || echo "$BODY"
    die "nothing was metered"
fi

COUNT=$(echo "$BODY" | jq 'length')
ok "$COUNT customer(s) owe a new delta"

if [[ "$COUNT" -eq 0 ]]; then
    info "Everyone is inside their allowance, or already reported. Nothing to do."
    exit 0
fi

header "Posting to Stripe meter (ai_usage_cents)"

TIMESTAMP=$(date +%s)
SUCCESS=0
FAILED=0

while IFS= read -r row; do
    CUSTOMER_ID=$(echo "$row" | jq -r '.stripe_customer_id')
    CENTS=$(echo "$row"       | jq -r '.delta_cents')

    [[ -z "$CUSTOMER_ID" || "$CUSTOMER_ID" == "null" ]] && continue
    [[ "$CENTS" -le 0 ]] && continue

    info "  $CUSTOMER_ID → ${CENTS} cents"

    if [ "$DRY_RUN" = true ]; then
        SUCCESS=$((SUCCESS + 1))
        continue
    fi

    if RESPONSE=$(curl -sS --fail-with-body \
            -u "${STRIPE_KEY}:" \
            -X POST "https://api.stripe.com/v1/billing/meter_events" \
            --data-urlencode "event_name=ai_usage_cents" \
            --data-urlencode "timestamp=${TIMESTAMP}" \
            --data-urlencode "payload[stripe_customer_id]=${CUSTOMER_ID}" \
            --data-urlencode "payload[value]=${CENTS}" 2>&1); then
        EVENT_ID=$(echo "$RESPONSE" | jq -r '.identifier // .id // "?"' 2>/dev/null || echo "?")
        ok "    reported → $EVENT_ID"
        SUCCESS=$((SUCCESS + 1))
    else
        # Already counted as reported in the database. It will not be retried
        # and it will not appear on an invoice. Say so loudly.
        warn "    UNREPORTED $CUSTOMER_ID ${CENTS} cents — recorded as billed but Stripe refused"
        echo "$RESPONSE" | jq -r '.error.message // .' 2>/dev/null || echo "$RESPONSE"
        FAILED=$((FAILED + 1))
    fi
done < <(echo "$BODY" | jq -c '.[]')

header "Done"
ok "$SUCCESS posted"
if [[ "$FAILED" -gt 0 ]]; then
    warn "$FAILED delta(s) lost — recorded as reported but never billed"
    exit 1
fi
