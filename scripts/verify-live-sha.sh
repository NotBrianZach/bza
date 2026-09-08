#!/usr/bin/env bash
# Compare the live-deployed commit sha at aireadalong.com/api/version
# against the last bza commit in the templedb graph. Exits 0 if they
# match, 1 if they diverge, 2 if the endpoint is unreachable.
#
# Runs the "verify fact" step that the deploy pipeline itself doesn't:
# the deploy log says "success", but this actually asks the live worker
# what it thinks it's running.

set -euo pipefail

URL="${1:-https://aireadalong.com/api/version}"

expected=$(templedb vcs log bza 2>/dev/null | awk '/^commit / {print $2; exit}')
if [ -z "$expected" ]; then
  echo "ERROR: could not read last bza commit sha from templedb" >&2
  exit 2
fi

resp=$(curl -sS --max-time 15 "$URL" || true)
if [ -z "$resp" ]; then
  echo "ERROR: could not reach $URL" >&2
  exit 2
fi

actual=$(printf '%s' "$resp" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("sha", "unknown"))' 2>/dev/null || echo unknown)

if [ "$actual" = "unknown" ]; then
  echo "MISMATCH: endpoint returned sha=unknown (BUILD_SHA not injected at build)" >&2
  echo "  expected: $expected"
  exit 1
fi

# Compare case-insensitively; the graph stores uppercase, api may return lower
if [ "$(printf '%s' "$actual" | tr '[:upper:]' '[:lower:]')" = "$(printf '%s' "$expected" | tr '[:upper:]' '[:lower:]')" ]; then
  echo "OK: live sha matches graph ($expected)"
  exit 0
fi

echo "MISMATCH:" >&2
echo "  expected (graph):     $expected" >&2
echo "  actual   (live):      $actual" >&2
echo "  URL:                  $URL" >&2
exit 1
