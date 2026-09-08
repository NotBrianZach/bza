#!/usr/bin/env bash
# report-usage.sh — Report weekly AI usage to Stripe meter.
#
# Billing model:
#   1. Sum each customer's OpenRouter cost for the past week (from Supabase).
#   2. Multiply by 2 (our 2× markup).
#   3. Convert to cents (× 100).
#   4. Send to Stripe meter event: ai_usage_cents.
#
# Schedule: run weekly, e.g. Sunday 00:00 UTC.
# Add to cron: 0 0 * * 0 /tmp/bza/scripts/report-usage.sh >> /tmp/bza/logs/usage.log 2>&1
#
# Usage:
#   ./scripts/report-usage.sh              # bill last 7 days
#   ./scripts/report-usage.sh --dry-run    # print without sending to Stripe

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()     { echo -e "${GREEN}✓ $*${NC}"; }
info()   { echo -e "${YELLOW}→ $*${NC}"; }
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
command -v templedb >/dev/null || die "templedb not found"

header "Loading secrets"

STRIPE_KEY=$(templedb secret get bza STRIPE_SECRET_KEY)   || die "STRIPE_SECRET_KEY not set"
SUPABASE_URL=$(templedb secret get bza SUPABASE_URL)       || die "SUPABASE_URL not set"
SERVICE_KEY=$(templedb secret get bza SUPABASE_SERVICE_ROLE_KEY) || die "SUPABASE_SERVICE_ROLE_KEY not set"

ok "Secrets loaded"
[ "$DRY_RUN" = true ] && info "DRY RUN — nothing will be sent to Stripe"

# ── Query Supabase for weekly usage per customer ──────────────────────────────
header "Querying usage (last 7 days)"

# Expected table: usage_events (or similar)
#   columns: user_id, stripe_customer_id, openrouter_cost_usd, created_at
#
# Returns: [{ stripe_customer_id, total_cost_usd }]
WEEK_AGO=$(date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null \
    || date -u -v-7d +"%Y-%m-%dT%H:%M:%SZ")  # macOS fallback

USAGE_JSON=$(curl -sf \
    "${SUPABASE_URL}/rest/v1/rpc/get_weekly_usage" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"since\": \"${WEEK_AGO}\"}")

CUSTOMER_COUNT=$(echo "$USAGE_JSON" | jq 'length')
ok "Found $CUSTOMER_COUNT customers with usage"

if [[ "$CUSTOMER_COUNT" -eq 0 ]]; then
    info "No usage to report. Exiting."
    exit 0
fi

# ── Send meter events to Stripe ───────────────────────────────────────────────
header "Reporting to Stripe meter (ai_usage_cents)"

TIMESTAMP=$(date +%s)
SUCCESS=0
SKIP=0

while IFS= read -r row; do
    CUSTOMER_ID=$(echo "$row" | jq -r '.stripe_customer_id')
    COST_USD=$(echo "$row"    | jq -r '.total_cost_usd')

    # Skip rows without a Stripe customer
    if [[ -z "$CUSTOMER_ID" || "$CUSTOMER_ID" == "null" ]]; then
        SKIP=$((SKIP + 1))
        continue
    fi

    # 2× markup, convert to cents, round to nearest integer
    CENTS=$(echo "$COST_USD * 2 * 100" | awk '{printf "%d\n", $1 + 0.5}')

    if [[ "$CENTS" -eq 0 ]]; then
        SKIP=$((SKIP + 1))
        continue
    fi

    info "  $CUSTOMER_ID → \$${COST_USD} × 2 = ${CENTS} cents"

    if [ "$DRY_RUN" = false ]; then
        RESPONSE=$(curl -sf \
            -u "${STRIPE_KEY}:" \
            -X POST "https://api.stripe.com/v1/billing/meter_events" \
            --data-urlencode "event_name=ai_usage_cents" \
            --data-urlencode "timestamp=${TIMESTAMP}" \
            --data-urlencode "payload[stripe_customer_id]=${CUSTOMER_ID}" \
            --data-urlencode "payload[value]=${CENTS}")
        EVENT_ID=$(echo "$RESPONSE" | jq -r '.identifier // .id // "?"')
        ok "    reported → $EVENT_ID"
    fi

    SUCCESS=$((SUCCESS + 1))
done < <(echo "$USAGE_JSON" | jq -c '.[]')

header "Done"
echo
echo "  Reported: $SUCCESS customers"
echo "  Skipped:  $SKIP (no Stripe customer or zero usage)"
[ "$DRY_RUN" = true ] && echo -e "${YELLOW}  DRY RUN — nothing was sent to Stripe${NC}"
