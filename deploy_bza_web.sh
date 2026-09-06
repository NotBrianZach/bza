#!/usr/bin/env bash
# BZA Multi-User Web Frontend Deployment Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

error() { echo -e "${RED}❌ $1${NC}" >&2; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
header() { echo -e "${BLUE}━━━ $1 ━━━${NC}"; }

# Parse arguments
PROFILE=""
DRY_RUN=false
DEPLOY_WORKER=false
ONLY_FRONTEND=false
ONLY_FUNCTIONS=false
ONLY_MIGRATIONS=false
ONLY_SECRETS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --target) PROFILE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --deploy-worker) DEPLOY_WORKER=true; shift ;;
        --only-frontend) ONLY_FRONTEND=true; shift ;;
        --only-functions) ONLY_FUNCTIONS=true; shift ;;
        --only-migrations) ONLY_MIGRATIONS=true; shift ;;
        --only-secrets) ONLY_SECRETS=true; shift ;;
        local|production|default) PROFILE="$1"; shift ;;
        *) shift ;;
    esac
done

# If any --only-* flag is set, disable everything else by default
ANY_ONLY=false
$ONLY_FRONTEND || $ONLY_FUNCTIONS || $ONLY_MIGRATIONS || $ONLY_SECRETS && ANY_ONLY=true

PROFILE="${PROFILE:-local}"
PROFILE_BEHAVIOR="$PROFILE"
[ "$PROFILE" = "default" ] && PROFILE_BEHAVIOR="local"

header "BZA Multi-User Web Frontend Deployment"
echo
info "Profile: $PROFILE"
[ "$DRY_RUN" = true ] && info "Mode: DRY RUN"
[ "$DEPLOY_WORKER" = true ] && info "Cloud Run worker: will deploy"
echo

# Check BZA exists
[ ! -d "$SCRIPT_DIR" ] && { error "BZA not found at $SCRIPT_DIR"; exit 1; }

header "Deployment Configuration"
echo

info "Profile:  $PROFILE"

if [ "$DRY_RUN" = true ]; then
    success "DRY RUN: Would deploy with:"
    echo "  Profile: $PROFILE"
    echo "  Working Dir: $SCRIPT_DIR"
    echo
    [ "$PROFILE_BEHAVIOR" = "production" ] && echo "  Frontend: Cloudflare Workers (npm run deploy:cf)" || echo "  Frontend: Next.js dev server"
    [ "$DEPLOY_WORKER" = true ] && echo "  Cloud Run: ./scripts/deploy_worker.sh"
    exit 0
fi

header "Injecting Secrets"
echo

info "Exporting secrets from TempleDB..."

_source_vars() {
    local project="$1"
    local blob
    # Export plain (non-encrypted) runtime vars; skip scoped keys like dev:KEY
    blob=$(templedb var export "$project" --format dotenv 2>/dev/null) || return 0
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
        [[ "$key" =~ : ]] && continue  # skip dev:/production: scoped keys
        [[ "$key" =~ \. ]] && continue  # skip dotted keys (e.g. git_server.url)
        if [ -z "${!key}" ]; then export "$key=$value"; fi
    done <<< "$blob"
}

_source_secrets() {
    local project="$1"
    local blob
    blob=$(templedb env secret export "$project" --format dotenv 2>/dev/null) || return 0
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
        [[ "$key" =~ : ]] && continue  # skip dev:/staging:/production: scoped keys
        # Secrets override plain vars (project secrets take precedence over sibling projects)
        export "$key=$value"
    done <<< "$blob"
}

# bza runtime vars first, then encrypted secrets override
_source_vars bza    || { error "Failed to export bza vars from TempleDB"; exit 1; }
_source_secrets bza || { error "Failed to export bza secrets from TempleDB"; exit 1; }

# Deploy credentials stored in sibling projects
_source_vars    system_config    # provides SUPABASE_ACCESS_TOKEN (plain)
_source_secrets system_config    # provides SUPABASE_ACCESS_TOKEN (encrypted)
_source_vars    woofs_projects   # provides CLOUDFLARE_PAGES_API_TOKEN (plain)
_source_secrets woofs_projects   # provides CLOUDFLARE_PAGES_API_TOKEN (encrypted)

# wrangler reads CLOUDFLARE_API_TOKEN; alias from the Pages token if needed
[ -z "${CLOUDFLARE_API_TOKEN}" ] && export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_PAGES_API_TOKEN}"

# Determine APP_ENV from target
APP_ENV="development"
[ "$PROFILE_BEHAVIOR" = "production" ] && APP_ENV="production"

# All vars are already in the shell environment from TempleDB export above.
# Next.js build inherits process.env — no .env.local needed.
export NEXT_PUBLIC_APP_ENV="${APP_ENV}"
export NEXT_PUBLIC_ENABLE_CHAT=true
export NEXT_PUBLIC_ENABLE_IMAGES=true
export NEXT_PUBLIC_ENABLE_CHARACTERS=true
info "TempleDB vars injected into process env (no .env file written)"

# supabase CLI reads secrets from process env — no .env file needed.
success "Supabase env sourced from TempleDB process env"
echo

# ── Cloud Run Worker ───────────────────────────────────────────────────────────
if [ "$DEPLOY_WORKER" = true ]; then
    header "Deploying Cloud Run Worker"
    echo

    if [ -z "${GCP_PROJECT_ID:-}" ]; then
        error "GCP_PROJECT_ID not set — add it to TempleDB bza secrets before deploying the worker"
        exit 1
    fi

    # Add gcloud from Nix store if not already on PATH
    if ! command -v gcloud &>/dev/null; then
        NIX_GCLOUD="$(ls /nix/store/*google-cloud-sdk*/bin/gcloud 2>/dev/null | head -1)"
        [ -n "$NIX_GCLOUD" ] && export PATH="$(dirname "$NIX_GCLOUD"):$PATH"
    fi

    cd "$SCRIPT_DIR"
    bash scripts/deploy_worker.sh

    # Re-read WORKER_URL in case it was just set by deploy_worker.sh
    WORKER_URL="${WORKER_URL:-$(templedb var get bza WORKER_URL 2>/dev/null || true)}"
    success "Cloud Run worker deployed → $WORKER_URL"
    echo
fi

# ── Supabase Migrations (production only) ──────────────────────────────────────
if [ "$PROFILE_BEHAVIOR" = "production" ] && command -v supabase &> /dev/null && \
   { ! $ANY_ONLY || $ONLY_MIGRATIONS; }; then
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://\([^.]*\)\..*|\1|')

    header "Applying Supabase Migrations"
    echo
    info "Running migrations against $PROJECT_REF..."
    cd "$SCRIPT_DIR"
    bash scripts/db-migrate.sh
    success "Migrations applied"
    echo
fi

# ── Supabase Edge Function Secrets (production only) ───────────────────────────
if [ "$PROFILE_BEHAVIOR" = "production" ] && command -v supabase &> /dev/null && \
   { ! $ANY_ONLY || $ONLY_SECRETS; }; then
    header "Setting Supabase Edge Function Secrets"
    echo
    info "Setting WORKER_URL, WORKER_SECRET, DEFAULT_OUTPUT_BUCKET, STRIPE_STORAGE_PRICE_ID..."
    # Fallback: read WORKER_URL/WORKER_SECRET from TempleDB if not in env (they may not be in var export)
    WORKER_URL="${WORKER_URL:-$(templedb var get bza WORKER_URL 2>/dev/null || true)}"
    WORKER_SECRET="${WORKER_SECRET:-$(templedb secret export bza --format dotenv 2>/dev/null | grep ^WORKER_SECRET= | cut -d= -f2-)}"
    [ -z "$WORKER_URL" ] && { error "WORKER_URL is empty — cannot set Supabase secret"; exit 1; }
    [ -z "$WORKER_SECRET" ] && { error "WORKER_SECRET is empty — cannot set Supabase secret"; exit 1; }
    supabase secrets set \
        WORKER_URL="${WORKER_URL}" \
        WORKER_SECRET="${WORKER_SECRET}" \
        DEFAULT_OUTPUT_BUCKET="${DEFAULT_OUTPUT_BUCKET:-documents}" \
        STRIPE_STORAGE_PRICE_ID="${STRIPE_STORAGE_PRICE_ID:-}"
    success "Supabase secrets set"
    echo
fi

# ── Supabase Edge Functions ────────────────────────────────────────────────────
if ! $ANY_ONLY || $ONLY_FUNCTIONS; then
header "Deploying Supabase Edge Functions"
echo

if command -v supabase &> /dev/null; then
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://\([^.]*\)\..*|\1|')
    info "Deploying edge functions to $PROJECT_REF..."
    cd "$SCRIPT_DIR"
    for fn_dir in supabase/functions/*/; do
        fn_name=$(basename "$fn_dir")
        # skip _shared — it is not a deployable function
        [[ "$fn_name" == _* ]] && continue
        info "  → $fn_name"
        supabase functions deploy "$fn_name" --project-ref "$PROJECT_REF" 2>&1 | tail -1
    done
    success "Edge functions deployed"
else
    info "supabase CLI not found — skipping edge function deploy"
fi
echo
fi # --only-functions

# ── Next.js Frontend ───────────────────────────────────────────────────────────
if ! $ANY_ONLY || $ONLY_FRONTEND; then
header "Deploying Next.js Frontend"
echo

cd "$SCRIPT_DIR/frontend"

info "Installing npm dependencies..."
npm install --prefer-offline --no-audit
success "Dependencies installed"

if [ "$PROFILE_BEHAVIOR" = "production" ]; then
    info "Building and deploying to Cloudflare Workers..."
    # NEXT_PUBLIC_* vars are already exported from the TempleDB secret export above.
    # opennextjs-cloudflare build inlines them, then wrangler deploy pushes the worker.
    npm run deploy:cf
    success "Frontend deployed → https://aireadalong.com"

    # Push server-side secrets to Cloudflare Workers (encrypted at rest, not in any file).
    # Auto-synced from TempleDB: iterates every bza secret except NEXT_PUBLIC_* (bundled at build)
    # and scoped keys (dev:/production:). Adding a new secret in TempleDB is enough; no edit here.
    info "Pushing Worker secrets to Cloudflare (auto-synced from TempleDB)..."
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
        [[ "$key" =~ : ]] && continue
        [[ "$key" =~ ^NEXT_PUBLIC_ ]] && continue
        [ -z "$value" ] && continue
        echo "  → $key"
        echo "$value" | npx wrangler secret put "$key" --name aireadalong 2>&1 | grep -v "^$" | tail -1
    done < <(templedb env secret export bza --format dotenv 2>/dev/null)
    success "Worker secrets pushed"
else
    npm run dev &
    NEXT_PID=$!
    success "Next.js dev server started (PID: $NEXT_PID) → http://localhost:3000"
fi
echo
fi # --only-frontend

success "Deployment complete."
