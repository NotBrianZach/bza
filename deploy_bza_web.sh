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
# Goes to stderr: a warning that scrolls past in a 200-line deploy log has not
# warned anyone, and this script's output is routinely tailed.
warn() { echo -e "${YELLOW}⚠ $1${NC}" >&2; }
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

# ── The build stamp ───────────────────────────────────────────────────────────
#
# Derived here rather than trusted from the DB, because this script is reachable
# two ways and only one of them stamps. `scripts/deploy.sh` sets BUILD_SHA as a
# TempleDB var and then goes through `templedb deploy project`, which injects the
# env from the DB — correct. Running *this* script directly skips that, so the
# BUILD_SHA that `_source_vars bza` just exported is whatever the last stamped
# deploy left behind. The code ships correctly either way; it is the stamp that
# goes stale, which is worse than it sounds: /api/version is the only
# machine-readable claim about what is running, and verify-live-sha.sh compares it
# against the graph head. A stale stamp fails that check on a perfectly good
# deploy, indistinguishably from a broken one. Happened 2026-10-03 and again
# 2026-10-12.
#
# So: compute from the graph head, export for the build, and write the var back so
# the two entry points cannot disagree about what was deployed.
#
# Drained into a variable before parsing rather than piped. `templedb vcs log |
# grep -m1` makes the reader close the pipe mid-write, templedb takes SIGPIPE, and
# how much log was left to write decides whether that happened — so it presents as
# a flake. In scripts/deploy.sh, which sets `pipefail`, that aborts the deploy
# outright; here it is quieter and worse, because this script sets only `set -e`,
# so the pipeline's status is grep's and the failure arrives as an *empty* sha that
# looks like "templedb has no commits". Draining first means the producer always
# runs to EOF. Same note in verify-live-sha.sh.
_TDB_LOG=$(templedb vcs log bza 2>/dev/null || true)
BUILD_SHA=$(printf '%s\n' "$_TDB_LOG" | grep -m1 '^commit ' | cut -d' ' -f2)
if [ -z "$BUILD_SHA" ]; then
    error "Could not read head commit sha from templedb — refusing to deploy an unstamped build"
    exit 1
fi
export BUILD_SHA
templedb var set bza BUILD_SHA "$BUILD_SHA" >/dev/null 2>&1 || \
    warn "Could not write BUILD_SHA back to TempleDB; this build is stamped correctly regardless"
info "Build stamp: BUILD_SHA=$BUILD_SHA"

# BUILD_TIME is not stamped here, and cannot be. next.config.js computes it with
# `new Date().toISOString()` and no longer reads the environment at all, precisely
# so a leftover var cannot outrank the real build time the way it did until
# 2026-10-12. Nothing to set; nothing to unset.

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

# ── Does the tree match the database? ─────────────────────────────────────────
#
# This script builds whatever is sitting in $SCRIPT_DIR. `scripts/deploy.sh` goes
# through `templedb deploy project`, which materialises the checkout from the DB
# first and builds in its own working dir — so that path cannot ship a stale tree
# and this one silently can. That asymmetry is the actual hazard in having two
# entry points; the read-only/EACCES difference was only its most visible symptom.
#
# It has nearly bitten before: the canonical checkout sat a day behind the DB while
# `vcs status` called 38 DB-newer files "modified", and building from it would have
# shipped the tree *without* the schema cutover while reporting success.
#
# checkout-diff is the authority, and it is read-only. Three things about it:
#   - it exits 0 whether or not there are differences, so the exit status is
#     useless and the output has to be read instead
#   - the verdict is the LAST non-empty line: "No differences between checkout and
#     the database." or "N files differ from the database." Match it there and
#     nowhere else. Grepping the whole output for the clean sentinel is a trap
#     this guard fell into on its first draft: when the drift includes this file,
#     the diff *quotes this very line*, the grep matches its own source and the
#     tree is pronounced clean. Self-defeating exactly when it matters most.
#   - `checkout-pull` is NOT the fix. On a tree checkout-diff calls identical it
#     reports "Conflicts: 111" and updates nothing, so it cannot be used to
#     reconcile automatically. `templedb publish run bza` is what materialises.
#
# Anything unrecognised counts as drift: this gate is only worth having if an
# unparsed answer fails closed.
if [ "$PROFILE_BEHAVIOR" = "production" ]; then
    info "Checking the tree matches the database..."
    _TREE_DIFF=$(templedb project checkout-diff bza "$SCRIPT_DIR" 2>&1 || true)
    _TREE_VERDICT=$(printf '%s\n' "$_TREE_DIFF" | grep -v '^[[:space:]]*$' | tail -1)
    if [ "$_TREE_VERDICT" = "No differences between checkout and the database." ]; then
        success "Tree matches the database"
    else
        error "$SCRIPT_DIR differs from the database — refusing to deploy it."
        echo "  Building from a stale tree ships something other than what the graph" >&2
        echo "  says is released, and verify-live-sha.sh cannot detect that: it only" >&2
        echo "  compares the stamp, and this script now stamps correctly either way." >&2
        echo >&2
        echo "  Reconcile, then retry:   templedb publish run bza" >&2
        echo "  Or use the verified path: bash scripts/deploy.sh production" >&2
        echo "  Deliberately shipping uncommitted code: ALLOW_TREE_DRIFT=1 $0 …" >&2
        echo >&2
        printf '%s\n' "$_TREE_DIFF" | head -40 >&2
        if [ "${ALLOW_TREE_DRIFT:-}" != "1" ]; then
            exit 1
        fi
        warn "ALLOW_TREE_DRIFT=1 — deploying a tree that does not match the database"
    fi
    echo
fi

cd "$SCRIPT_DIR/frontend"

info "Installing npm dependencies..."
# --no-save, because $SCRIPT_DIR is normally the canonical TempleDB checkout and
# its files are 0444 — publish made canonical checkouts read-only (templedb
# 7cdbaaa8). npm opens package-lock.json for write even when the tree is already
# in sync, so without this the deploy dies on EACCES before building anything.
#
# Nothing is lost by refusing to write it: the lock is a tracked source file, so a
# deploy is the wrong place to regenerate one. If npm *wants* to change it, that is
# a drift between package.json and the lock that should be fixed and committed in a
# workspace — not silently absorbed into a release and then reverted by the next
# materialise. (That drift was real once: the committed lock was missing a declared
# puppeteer-core and still carrying @opennextjs/aws, fixed in EBF34E5A.)
npm install --prefer-offline --no-audit --no-save
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

    # Ask the live worker what it thinks it is running.
    #
    # The other half of the two-entry-point asymmetry: scripts/deploy.sh ended in
    # this check and running this script by hand ended in "✓ Deployment complete"
    # and nothing else — so the one path a human reaches for was the one that never
    # confirmed anything. The deploy log saying success is not evidence; wrangler
    # can upload happily while the stamp, the bundle or the route is wrong.
    #
    # Non-fatal on purpose. The deploy has already happened by this point, so
    # exiting non-zero here would report a *deployment* failure for what is really
    # a post-deploy discrepancy — and the fix for a genuine mismatch is to look, not
    # to assume the push failed. It is loud enough to not be missed.
    if [ -x "$SCRIPT_DIR/scripts/verify-live-sha.sh" ] || [ -f "$SCRIPT_DIR/scripts/verify-live-sha.sh" ]; then
        info "Verifying the live sha matches the graph..."
        if bash "$SCRIPT_DIR/scripts/verify-live-sha.sh" https://aireadalong.com/api/version; then
            success "Live deployment matches the graph"
        else
            warn "Live sha does NOT match the graph — the deploy landed but is not what the graph says is released. Investigate before assuming this is released."
        fi
    else
        warn "scripts/verify-live-sha.sh not found — deployed without verifying"
    fi
else
    npm run dev &
    NEXT_PID=$!
    success "Next.js dev server started (PID: $NEXT_PID) → http://localhost:3000"
fi
echo
fi # --only-frontend

success "Deployment complete."
