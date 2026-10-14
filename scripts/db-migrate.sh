#!/usr/bin/env bash
# db-migrate.sh — Run SQL migrations against the production Supabase database.
# Connection credentials are pulled from TempleDB secrets.
# Applied migrations are tracked in public._applied_migrations to avoid re-runs.
#
# Usage:
#   ./scripts/db-migrate.sh                        # run all pending migrations
#   ./scripts/db-migrate.sh 08_billing_usage_rpc   # run a specific migration
#   ./scripts/db-migrate.sh --dry-run              # print SQL without executing
#   ./scripts/db-migrate.sh --list                 # list migration files

set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
ok()     { echo -e "${GREEN}✓ $*${NC}"; }
info()   { echo -e "${YELLOW}→ $*${NC}"; }
header() { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }
die()    { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

MIGRATION_DIR="supabase/setup"
DRY_RUN=false
LIST_ONLY=false
TARGET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --list)    LIST_ONLY=true; shift ;;
        --*)       die "Unknown option: $1" ;;
        *)         TARGET="$1"; shift ;;
    esac
done

# ── List mode ─────────────────────────────────────────────────────────────────
if [ "$LIST_ONLY" = true ]; then
    echo "Migrations in ${MIGRATION_DIR}/:"
    ls "$MIGRATION_DIR"/*.sql | while read -r f; do
        echo "  $(basename "$f")"
    done
    exit 0
fi

# ── Load connection string from TempleDB ──────────────────────────────────────
header "Loading connection credentials"

command -v templedb >/dev/null || die "templedb not found"
command -v psql     >/dev/null || die "psql not found"

DB_PASSWORD=$(templedb env secret get bza SUPABASE_DB_PASSWORD 2>/dev/null) \
    || die "SUPABASE_DB_PASSWORD not set. Run: templedb env secret set bza SUPABASE_DB_PASSWORD '...' --keys age-key"

DB_HOST=$(templedb env secret get bza SUPABASE_DB_HOST 2>/dev/null) \
    || die "SUPABASE_DB_HOST not set. Run: templedb env secret set bza SUPABASE_DB_HOST 'aws-1-us-east-1.pooler.supabase.com' --keys age-key"

SUPABASE_URL=$(templedb env secret get bza SUPABASE_URL 2>/dev/null) \
    || die "SUPABASE_URL not set"

# Extract project ref from URL: https://<ref>.supabase.co
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://\([^.]*\)\..*|\1|')

DSN="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@${DB_HOST}:5432/postgres"

ok "Host: $DB_HOST"
ok "Project: $PROJECT_REF"

# ── Ensure migration tracking table exists ────────────────────────────────────
if [ "$DRY_RUN" = false ]; then
    psql "$DSN" -q -c "
        CREATE TABLE IF NOT EXISTS public._applied_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        );
    " 2>/dev/null || true

    # If the tracking table is empty but the profiles table already exists,
    # the migrations ran before tracking was introduced — mark all as applied.
    TRACKING_EMPTY=$(psql "$DSN" -tA -c \
        "SELECT COUNT(*) FROM public._applied_migrations;" 2>/dev/null || echo "0")
    PROFILES_EXISTS=$(psql "$DSN" -tA -c \
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles' LIMIT 1;" \
        2>/dev/null || echo "")

    if [[ "$TRACKING_EMPTY" == "0" && "$PROFILES_EXISTS" == "1" ]]; then
        info "Bootstrapping migration tracking — marking existing migrations as applied..."
        for f in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
            n=$(basename "$f")
            psql "$DSN" -q -c \
                "INSERT INTO public._applied_migrations (name) VALUES ('$n') ON CONFLICT DO NOTHING;" \
                2>/dev/null || true
        done
        ok "Migration tracking bootstrapped"
    fi
fi

# ── Resolve migration files ───────────────────────────────────────────────────
header "Resolving migrations"

if [[ -n "$TARGET" ]]; then
    # Accept partial name: "08" or "08_billing" or full filename
    MATCH=$(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | grep "$TARGET" | head -1)
    [[ -n "$MATCH" ]] || die "No migration file matching '$TARGET' in $MIGRATION_DIR/"
    FILES=("$MATCH")
else
    mapfile -t FILES < <(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort)
    [[ ${#FILES[@]} -gt 0 ]] || die "No .sql files found in $MIGRATION_DIR/"
fi

echo "Will run ${#FILES[@]} file(s):"
for f in "${FILES[@]}"; do
    echo "  $(basename "$f")"
done

[ "$DRY_RUN" = true ] && info "DRY RUN — SQL will be printed, not executed"

# ── Run migrations ────────────────────────────────────────────────────────────
header "Running migrations"

PASSED=0
SKIPPED=0
FAILED=0

for file in "${FILES[@]}"; do
    name=$(basename "$file")
    info "→ $name"

    if [ "$DRY_RUN" = true ]; then
        echo "--- $name ---"
        cat "$file"
        echo
        continue
    fi

    # Check if already applied
    ALREADY_APPLIED=$(psql "$DSN" -tA -c \
        "SELECT 1 FROM public._applied_migrations WHERE name = '$name' LIMIT 1;" 2>/dev/null || echo "")

    if [[ "$ALREADY_APPLIED" == "1" ]]; then
        info "→ $name (already applied, skipping)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    # ── Refuse a new table in `public` without explicit GRANTs ────────────
    #
    # Supabase auto-grants anon/authenticated on the public schema, and that
    # ends 2026-10-30. Existing tables are grandfathered, so this only bites
    # NEW ones -- and it bites as empty 200s rather than errors, which is the
    # worst possible shape: the app looks healthy and returns nothing.
    #
    # bza is already safe by construction: migration 57 moved the app into
    # bza_public and installed
    #     alter default privileges in schema bza_public grant ... on tables
    # as `postgres`, which is the role this script connects as, so every new
    # table there is granted automatically. Nothing needs adding per-file.
    #
    # The exposure that remains is habit -- a migration written against
    # `public` out of muscle memory, which rides the auto-grant and breaks
    # after the cutoff. The convention is already documented; this makes it
    # enforced, because a silent empty result is not something review
    # reliably catches.
    #
    # Deliberately narrow: only CREATE TABLE landing in public, only when the
    # same file has no GRANT. Comments are stripped first so that prose about
    # public.foo (every one of these files discusses the old schema) cannot
    # trip it.
    #
    # Both spellings count. An unqualified `create table foo (...)` resolves
    # through search_path, which for this connection's role is public -- so it
    # is the same hazard wearing different clothes, and the easier one to
    # write by accident. 49_analytics_events.sql is exactly that shape.
    SQL_CODE=$(sed -e 's/--.*$//' "$file")
    HAS_PUBLIC_TARGET=$(printf '%s' "$SQL_CODE" \
        | grep -icE 'create[[:space:]]+table([[:space:]]+if[[:space:]]+not[[:space:]]+exists)?[[:space:]]+(public\.|[a-z_][a-z0-9_]*[[:space:]]*\()' \
        || true)
    HAS_GRANT=$(printf '%s' "$SQL_CODE" | grep -icE '^[[:space:]]*grant[[:space:]]' || true)
    if [[ "$HAS_PUBLIC_TARGET" -gt 0 && "$HAS_GRANT" -eq 0 ]]; then
        echo -e "${RED}✗  $name creates a table in public with no GRANT${NC}" >&2
        echo "   Supabase's automatic grants on public end 2026-10-30. A new" >&2
        echo "   table without explicit GRANTs will return empty results, not" >&2
        echo "   errors, so nothing will look broken." >&2
        echo "   Put it in bza_public instead: migration 57 set default" >&2
        echo "   privileges there, so grants are automatic. Remember to add the" >&2
        echo "   schema to Settings->API->Exposed schemas, or queries get" >&2
        echo "   PGRST106." >&2
        echo "   To apply as written anyway: ALLOW_PUBLIC_SCHEMA=1" >&2
        if [[ "${ALLOW_PUBLIC_SCHEMA:-0}" != "1" ]]; then
            FAILED=$((FAILED + 1))
            die "Refusing to apply $name."
        fi
        info "ALLOW_PUBLIC_SCHEMA=1 set — applying anyway."
    fi

    if psql "$DSN" -v ON_ERROR_STOP=1 -f "$file" 2>&1; then
        # Record successful application
        psql "$DSN" -q -c \
            "INSERT INTO public._applied_migrations (name) VALUES ('$name') ON CONFLICT DO NOTHING;" 2>/dev/null || true
        ok "  $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗  $name failed${NC}" >&2
        FAILED=$((FAILED + 1))
        # Stop on first failure — migrations often depend on each other
        die "Migration failed. Fix the error and re-run."
    fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
header "Done"
echo
echo "  Passed:  $PASSED"
echo "  Skipped: $SKIPPED"
if [ "$FAILED" -gt 0 ]; then echo -e "  ${RED}Failed: $FAILED${NC}"; fi
