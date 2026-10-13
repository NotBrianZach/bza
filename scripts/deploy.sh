#!/usr/bin/env bash
# Canonical deploy entrypoint for bza.
#
# What it does that raw `templedb deploy project bza` does not:
#   1. Reads head commit sha from templedb vcs log
#   2. Sets BUILD_SHA as a templedb var (inlined into the frontend build by
#      next.config.js and exposed at /api/version so
#      scripts/verify-live-sha.sh can prove the live deployment matches the
#      graph). BUILD_TIME is *unset* — next.config.js computes it at build
#      time, which is both correct and maintenance-free.
#   3. Runs templedb deploy project
#   4. Verifies live sha matches graph (exits non-zero on drift)
#
# This is the path to use. deploy_bza_web.sh is the inner script and now stamps
# BUILD_SHA itself, but only this one verifies the result afterwards.
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

# Drained into a variable before being parsed — see the long comment in
# verify-live-sha.sh. Piping straight into `awk … exit` makes awk close the pipe
# while templedb is still writing, and under `set -o pipefail` the resulting
# SIGPIPE fails this script before it has deployed anything. It is a race on how
# much log is left to write, so it looks like a flake rather than a bug.
LOG=$(templedb vcs log bza || true)
SHA=$(printf '%s\n' "$LOG" | awk '/^commit / {print $2; exit}')
if [ -z "$SHA" ]; then
  echo "ERROR: could not read head commit sha from templedb" >&2
  exit 1
fi

# BUILD_SHA has to be a var on this path: `templedb deploy project` builds in its
# own working dir with env injected from the DB, so exporting it in this shell
# would not reach the build. deploy_bza_web.sh takes the other route and exports it
# directly; both end up stamping the same value.
echo "→ Setting BUILD_SHA=$SHA"
templedb var set bza BUILD_SHA "$SHA" >/dev/null

# BUILD_TIME is not stamped, here or anywhere. next.config.js computes it with
# `new Date().toISOString()` at build time and no longer consults the environment,
# so there is nothing to set and nothing that could go stale. It used to be stamped
# here, which was accurate for this path and poison for the other: the var
# persisted and outranked the fallback, so any deploy not coming through this
# script served the previous deploy's builtAt.

echo "→ Deploying bza to $TARGET"
templedb deploy project bza --target "$TARGET"

if [ "$SKIP_VERIFY" = true ] || [ "$TARGET" != "production" ]; then
  echo "→ Skipping post-deploy verify (target=$TARGET, skip=$SKIP_VERIFY)"
  exit 0
fi

echo "→ Verifying live sha matches graph"
# Was `templedb reconcile deployment bza --url …`, which is not a subcommand —
# reconcile only has machine/history/schedule, so every production deploy ended in
# a red "Unknown command: deployment" *after* succeeding. verify-live-sha.sh is the
# thing that actually performs this check.
exec bash "$SCRIPT_DIR/verify-live-sha.sh" https://aireadalong.com/api/version
