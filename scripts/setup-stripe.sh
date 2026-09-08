#!/usr/bin/env bash
# setup-stripe.sh — Create and wire all Stripe billing objects for BZA.
#
# Billing model:
#   - Product:  "Pro AI Usage"
#   - Meter:    event_name=ai_usage_cents, aggregation=sum
#   - Price:    $0.01/unit (1 cent), usage-based/metered, daily interval
#   - Weekly:   sum OpenRouter cost × 2 → cents → report to meter
#
# Usage:
#   ./scripts/setup-stripe.sh                   # use SITE_URL from TempleDB
#   ./scripts/setup-stripe.sh --site https://bza.example.com
#
# Results are stored in TempleDB secrets so the deploy hook picks them up.
# Safe to re-run — skips steps that are already stored.

set -euo pipefail
cd "$(dirname "$0")/.."

# ── colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()     { echo -e "${GREEN}✓ $*${NC}"; }
info()   { echo -e "${YELLOW}→ $*${NC}"; }
header() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }
die()    { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

# ── args ──────────────────────────────────────────────────────────────────────
SITE_OVERRIDE=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --site) SITE_OVERRIDE="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

# ── prerequisites ─────────────────────────────────────────────────────────────
command -v curl >/dev/null || die "curl not found"
command -v jq   >/dev/null || die "jq not found"
command -v templedb >/dev/null || die "templedb not found"

# ── load secrets ──────────────────────────────────────────────────────────────
header "Loading secrets from TempleDB"

STRIPE_KEY=$(templedb secret get bza STRIPE_SECRET_KEY 2>/dev/null) \
    || die "STRIPE_SECRET_KEY not set. Run: templedb secret set bza STRIPE_SECRET_KEY sk_live_... --keys age-key"

[[ "$STRIPE_KEY" == sk_live_* || "$STRIPE_KEY" == sk_test_* ]] \
    || die "STRIPE_SECRET_KEY doesn't look right (expected sk_live_ or sk_test_)"

SITE_URL="${SITE_OVERRIDE:-$(templedb secret get bza SITE_URL 2>/dev/null)}"
[[ -n "$SITE_URL" ]] || die "SITE_URL not set. Run: templedb secret set bza SITE_URL https://... --keys age-key"

WEBHOOK_URL="${SITE_URL%/}/api/webhooks/stripe"

ok "Stripe key loaded (${STRIPE_KEY:0:14}...)"
ok "Site URL: $SITE_URL"
ok "Webhook URL: $WEBHOOK_URL"

# Store webhook URL as a TempleDB var (not secret — it's not sensitive)
templedb env set bza STRIPE_WEBHOOK_URL "$WEBHOOK_URL" 2>/dev/null || true

# ── Stripe API helper ─────────────────────────────────────────────────────────
stripe_get()  { curl -sf -u "${STRIPE_KEY}:" "https://api.stripe.com/v1/$1" "${@:2}"; }
stripe_post() {
    local path="$1"; shift
    curl -sf -u "${STRIPE_KEY}:" -X POST "https://api.stripe.com/v1/$path" "$@"
}

# Warn if SITE_URL is localhost — webhook won't be reachable by Stripe
if [[ "$SITE_URL" == *localhost* || "$SITE_URL" == *127.0.0.1* ]]; then
    echo -e "${YELLOW}⚠  SITE_URL is localhost — Stripe cannot reach this webhook URL.${NC}"
    echo -e "${YELLOW}   Set your production URL first:${NC}"
    echo -e "${YELLOW}   templedb secret set bza SITE_URL https://yourdomain.com --keys age-key${NC}"
    echo -e "${YELLOW}   Then re-run: ./scripts/setup-stripe.sh${NC}"
    echo
    read -r -p "Continue anyway? (y/N) " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
fi

# ── 1. Product ────────────────────────────────────────────────────────────────
header "Product"

# Use pattern match to validate — templedb errors go to stderr but some versions
# print to stdout; only accept values that look like real Stripe IDs (prod_...)
EXISTING_PRODUCT=$(templedb secret get bza STRIPE_PRODUCT_ID 2>/dev/null || true)

if [[ "$EXISTING_PRODUCT" == prod_* ]]; then
    PRODUCT_ID="$EXISTING_PRODUCT"
    ok "Product already set: $PRODUCT_ID"
else
    info "Creating product 'Pro AI Usage'..."
    PRODUCT=$(stripe_post products \
        --data-urlencode "name=Pro AI Usage" \
        --data-urlencode "description=AI usage billed at 2× OpenRouter cost")
    PRODUCT_ID=$(echo "$PRODUCT" | jq -r '.id')
    [[ "$PRODUCT_ID" == prod_* ]] || die "Product creation failed: $PRODUCT"
    ok "Created product: $PRODUCT_ID"
    templedb secret set bza STRIPE_PRODUCT_ID "$PRODUCT_ID" --keys age-key
fi

# ── 2. Meter ──────────────────────────────────────────────────────────────────
header "Billing Meter"

EXISTING_METER=$(templedb secret get bza STRIPE_METER_ID 2>/dev/null || true)

if [[ "$EXISTING_METER" == meter_* ]]; then
    METER_ID="$EXISTING_METER"
    ok "Meter already set: $METER_ID"
else
    info "Creating meter 'ai_usage_cents'..."
    METER=$(stripe_post billing/meters \
        --data-urlencode "event_name=ai_usage_cents" \
        --data-urlencode "display_name=AI Usage (cents)" \
        --data-urlencode "default_aggregation[formula]=sum" \
        --data-urlencode "customer_mapping[type]=by_id" \
        --data-urlencode "customer_mapping[event_payload_key]=stripe_customer_id")
    METER_ID=$(echo "$METER" | jq -r '.id')
    [[ "$METER_ID" == meter_* ]] || die "Meter creation failed: $METER"
    ok "Created meter: $METER_ID"
    templedb secret set bza STRIPE_METER_ID "$METER_ID" --keys age-key
fi

# ── 3. Price ──────────────────────────────────────────────────────────────────
header "Price"

EXISTING_PRICE=$(templedb secret get bza STRIPE_PRO_PRICE_ID 2>/dev/null || echo "")

if [[ -n "$EXISTING_PRICE" && "$EXISTING_PRICE" == price_* ]]; then
    PRICE_ID="$EXISTING_PRICE"
    ok "Price already set: $PRICE_ID"
else
    info "Creating metered price (\$0.01/unit, daily)..."
    PRICE=$(stripe_post prices \
        --data-urlencode "currency=usd" \
        --data-urlencode "product=$PRODUCT_ID" \
        --data-urlencode "unit_amount=1" \
        --data-urlencode "billing_scheme=per_unit" \
        --data-urlencode "recurring[interval]=day" \
        --data-urlencode "recurring[usage_type]=metered" \
        --data-urlencode "recurring[meter]=$METER_ID")
    PRICE_ID=$(echo "$PRICE" | jq -r '.id')
    [[ "$PRICE_ID" == price_* ]] || die "Price creation failed: $PRICE"
    ok "Created price: $PRICE_ID"
    templedb secret set bza STRIPE_PRO_PRICE_ID "$PRICE_ID" --keys age-key
fi

# ── 4. Webhook endpoint ───────────────────────────────────────────────────────
header "Webhook Endpoint"

EXISTING_WEBHOOK=$(templedb secret get bza STRIPE_WEBHOOK_ID 2>/dev/null || true)

if [[ -n "$EXISTING_WEBHOOK" && "$EXISTING_WEBHOOK" == we_* ]]; then
    WEBHOOK_ID="$EXISTING_WEBHOOK"
    ok "Webhook already set: $WEBHOOK_ID"
    info "If the URL changed, run: stripe webhook_endpoints update $WEBHOOK_ID --url $WEBHOOK_URL"
else
    info "Creating webhook endpoint at $WEBHOOK_URL..."
    WEBHOOK=$(stripe_post webhook_endpoints \
        --data-urlencode "url=$WEBHOOK_URL" \
        --data-urlencode "enabled_events[]=checkout.session.completed" \
        --data-urlencode "enabled_events[]=invoice.paid" \
        --data-urlencode "enabled_events[]=invoice.payment_failed" \
        --data-urlencode "enabled_events[]=customer.subscription.updated" \
        --data-urlencode "enabled_events[]=customer.subscription.deleted")
    WEBHOOK_ID=$(echo "$WEBHOOK" | jq -r '.id')
    WEBHOOK_SECRET=$(echo "$WEBHOOK" | jq -r '.secret')
    [[ "$WEBHOOK_ID" == we_* ]] || die "Webhook creation failed: $WEBHOOK"
    ok "Created webhook: $WEBHOOK_ID"
    templedb secret set bza STRIPE_WEBHOOK_ID     "$WEBHOOK_ID"     --keys age-key
    templedb secret set bza STRIPE_WEBHOOK_SECRET  "$WEBHOOK_SECRET" --keys age-key
    ok "Webhook signing secret stored"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
header "Done"
echo
echo "  Product:         $PRODUCT_ID"
echo "  Meter:           $METER_ID"
echo "  Price:           $PRICE_ID"
echo "  Webhook:         $WEBHOOK_ID"
echo "  Webhook URL:     $WEBHOOK_URL"
echo
echo "All IDs stored in TempleDB. Run 'templedb deploy run bza' to pick them up."
echo
info "Weekly billing job: scripts/report-usage.sh (run via cron each Sunday)"
