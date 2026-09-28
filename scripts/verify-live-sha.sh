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

# node rather than python3: this is a Node project so node is always present,
# whereas python3 is not reliably on PATH — and the `|| echo unknown` below turns a
# missing interpreter into a MISMATCH that looks like a failed deploy.
actual=$(printf '%s' "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).sha||"unknown")}catch{console.log("unknown")}})' 2>/dev/null || echo unknown)

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
