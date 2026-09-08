#!/usr/bin/env bash
# Canonical deploy entrypoint for bza.
#
# What it does that raw `templedb deploy project bza` does not:
#   1. Reads head commit sha from templedb vcs log
#   2. Sets BUILD_SHA and BUILD_TIME as templedb vars (they're inlined
#      into the frontend build by next.config.js and exposed at
#      /api/version so scripts/verify-live-sha.sh can prove the live
#      deployment matches the graph)
#   3. Runs templedb deploy project
#   4. Verifies live sha matches graph (exits non-zero on drift)
#
# Usage:
#   bash scripts/deploy.sh                 # deploys to production
#   bash scripts/deploy.sh dev             # deploys to dev target
#   bash scripts/deploy.sh production --skip-verify  # skip post-deploy check

set -euo pipefail

TARGET="${1:-production}"
SKIP_VERIFY=false
[ "${2:-}" = "--skip-verify" ] && SKIP_VERIFY=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SHA=$(templedb vcs log bza | awk '/^commit / {print $2; exit}')
if [ -z "$SHA" ]; then
  echo "ERROR: could not read head commit sha from templedb" >&2
  exit 1
fi

TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "→ Setting BUILD_SHA=$SHA BUILD_TIME=$TIME"
templedb var set bza BUILD_SHA "$SHA" >/dev/null
templedb var set bza BUILD_TIME "$TIME" >/dev/null

echo "→ Deploying bza to $TARGET"
templedb deploy project bza --target "$TARGET"

if [ "$SKIP_VERIFY" = true ] || [ "$TARGET" != "production" ]; then
  echo "→ Skipping post-deploy verify (target=$TARGET, skip=$SKIP_VERIFY)"
  exit 0
fi

echo "→ Verifying live sha matches graph"
templedb reconcile deployment bza --url https://aireadalong.com/api/version
