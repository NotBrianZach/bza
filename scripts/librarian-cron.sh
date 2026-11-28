#!/usr/bin/env bash
# librarian-cron.sh — fire every scheduled librarian task that is due.
#
# Calls POST /api/librarian/cron, which claims each due task, runs it through
# the model with the library and web tools, and records the result as a row in
# `librarian_task_runs` — including failures.
#
# ── Why a route and not a database job ────────────────────────────────────
#
# The run needs the embedding model, pgvector matching, the tool loop and the
# user's own instructions. All of that lives in frontend/lib/librarian. A job
# writing rows directly would be a second implementation of the run contract,
# and the two would drift — the same reasoning suggest-cron.sh gives for the
# same choice.
#
# ── How often to run it ───────────────────────────────────────────────────
#
# EVERY MINUTE is correct, and cheap. The route selects on an indexed
# `next_run_at <= now()` and returns `{"ran":0}` when nothing is due, so the
# common case is one index probe. Running it less often does not reduce work,
# it just makes a task scheduled for 07:00 fire at 07:14 — the cron expression
# can only be as precise as the tick that reads it.
#
# A tick that overlaps a previous one is safe: the route advances next_run_at
# BEFORE doing the work, so the second tick finds nothing due. See the header
# of the route for the trade that buys.
#
# Usage:
#   bash scripts/librarian-cron.sh
#   BZA_URL=http://localhost:3000 bash scripts/librarian-cron.sh
#
# Suggested systemd user timer (OnCalendar=*:0/1), or:
#   * * * * * bash /path/to/scripts/librarian-cron.sh >> /tmp/librarian-cron.log 2>&1

set -euo pipefail

URL="${BZA_URL:-https://aireadalong.com}"
TEMPLEDB="${TEMPLEDB:-$HOME/.nix-profile/bin/templedb}"

# Deliberately NOT exporting SOPS_AGE_KEY_FILE — the sops default identity
# reads every secret, and forcing ~/.age/key.txt fails on the newer ones.
unset SOPS_AGE_KEY_FILE || true

# `tail -1`, never a pipeline that exits early: piping templedb into something
# that closes the pipe gives it SIGPIPE and fails the script under pipefail.
SECRET="$(printf 'y\n' | "$TEMPLEDB" env var get bza LIBRARIAN_CRON_SECRET 2>/dev/null | tail -1)"
if [ -z "$SECRET" ]; then
  echo "could not read LIBRARIAN_CRON_SECRET from TempleDB — refusing to call the endpoint" >&2
  exit 1
fi

RESPONSE="$(curl -sS -X POST "$URL/api/librarian/cron" \
  -H "x-librarian-cron: $SECRET" \
  -H 'Content-Type: application/json' \
  --max-time 300 \
  -w '\n%{http_code}')"

CODE="$(printf '%s' "$RESPONSE" | tail -1)"
BODY="$(printf '%s' "$RESPONSE" | sed '$d')"

if [ "$CODE" != "200" ]; then
  echo "librarian cron failed: HTTP $CODE $BODY" >&2
  exit 1
fi

# Quiet when nothing was due, which is almost every minute. A timer that logs
# a line every tick buries the one that matters.
case "$BODY" in
  *'"ran":0'*) exit 0 ;;
  *) echo "$(date -Is) $BODY" ;;
esac
