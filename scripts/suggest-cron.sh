#!/usr/bin/env bash
# suggest-cron.sh — Poll the suggested feed's sources, and decay learned weights.
#
# Calls POST /api/suggest/cron, which does two things that nothing else can:
#
#   1. Polls every feed due a poll. This is GLOBAL rather than per-user because
#      `suggest_feeds` and `suggest_items` have no user_id — an RSS item is a
#      public document, so one poll serves every subscriber.
#   2. Decays each subscriber's LEARNED interest weights toward the prior.
#      Weights the user set by hand are exempt and are reported as held.
#
# ── Why a route and not a direct database job ─────────────────────────────
#
# Polling needs the normalizer, the classifier and the dedup keys, all of which
# live in frontend/lib/suggest. A shell job writing rows directly would be a
# second implementation of the ingest contract, and the two would drift.
#
# ── Why this exists at all ────────────────────────────────────────────────
#
# Every other /api/suggest route authenticates with the caller's bearer token,
# and a scheduler holds nobody's token. So `decayWeights` shipped as code that
# nothing could call on a timer: the §5 brake against the feed narrowing was
# implemented and never engaged, and every nudge from a click accumulated
# permanently. This is the thing that turns it on.
#
# ── Safe to re-run ───────────────────────────────────────────────────────
#
# Polling sends conditional-request headers, so an unchanged feed costs one 304
# and no parsing, and `insertItems` ignores duplicates on the canonical URL.
# Decay is idempotent in the sense that matters — it moves a weight a fraction
# of the way to the prior, so running it twice in a day is two small steps
# rather than a double application of one big one. Do not run it hourly: the
# step size assumes roughly weekly.
#
# Usage:
#   bash scripts/suggest-cron.sh                  # poll + decay, production
#   bash scripts/suggest-cron.sh --poll-only
#   bash scripts/suggest-cron.sh --decay-only
#   BZA_URL=http://localhost:3000 bash scripts/suggest-cron.sh
#
# NOTHING SCHEDULES THIS YET. It is a script, run by hand or by whatever
# scheduler is chosen — see the note at the foot of this file.

set -euo pipefail

URL="${BZA_URL:-https://aireadalong.com}"
TEMPLEDB="${TEMPLEDB:-$HOME/.nix-profile/bin/templedb}"

POLL=true
DECAY=true
for arg in "$@"; do
  case "$arg" in
    --poll-only)  DECAY=false ;;
    --decay-only) POLL=false ;;
    -h|--help)    sed -n '2,45p' "$0"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# Deliberately NOT exporting SOPS_AGE_KEY_FILE. The sops default identity reads
# every secret; forcing ~/.age/key.txt fails on the newer ones, which is the
# opposite of what an older note in this repo used to say.
unset SOPS_AGE_KEY_FILE || true

# `tail -1` and never a pipeline that exits early: piping templedb into
# something that closes the pipe (awk … exit) gives it SIGPIPE and fails the
# whole script under `set -o pipefail`.
SECRET="$(printf 'y\n' | "$TEMPLEDB" env var get bza SUGGEST_CRON_SECRET 2>/dev/null | tail -1)"
if [ -z "$SECRET" ]; then
  echo "could not read SUGGEST_CRON_SECRET from TempleDB — refusing to call the endpoint" >&2
  echo "set one with: templedb env secret set bza SUGGEST_CRON_SECRET <value> --keys age-key,templedb-primary" >&2
  exit 1
fi

echo "→ ${URL}/api/suggest/cron  (poll=${POLL} decay=${DECAY})"

# --fail-with-body so a 401 or 500 is a non-zero exit AND still prints what the
# route said. Plain --fail swallows the body, which is where the reason is.
RESPONSE="$(curl -sS --fail-with-body -m 300 \
  -X POST "${URL}/api/suggest/cron" \
  -H "x-suggest-cron: ${SECRET}" \
  -H 'Content-Type: application/json' \
  -d "{\"poll\":${POLL},\"decay\":${DECAY}}")" || {
    echo "the scheduled run failed:" >&2
    echo "$RESPONSE" >&2
    exit 1
  }

# node rather than jq: jq is not reliably installed on this host, and node is —
# the frontend build needs it.
printf '%s' "$RESPONSE" | node -e '
let s = ""
process.stdin.on("data", d => s += d).on("end", () => {
  let r
  try { r = JSON.parse(s) } catch { console.log(s); process.exit(0) }
  const polled = r.polled ?? []
  console.log(`  polled ${polled.length} feed(s), ${r.inserted ?? 0} new item(s)`)
  // Per-feed, always. A total of zero is compatible with three feeds having
  // been dead for a month, and that is the thing worth seeing.
  for (const p of polled) console.log(`    ${p.name} — ${p.status}`)
  const d = r.decayed ?? {}
  console.log(`  decayed ${d.weightsMoved ?? 0} weight(s) across ${d.users ?? 0} subscriber(s)`)
  for (const n of r.notes ?? []) console.log(`  note: ${n}`)
})
'

# ── Scheduling this ──────────────────────────────────────────────────────
#
# Not wired, deliberately — it is a platform choice rather than a code one, and
# the three options differ in ways worth deciding on purpose:
#
#   · A Cloudflare Cron Trigger is the most robust, since it runs where the app
#     runs. It needs a `scheduled` handler, and the worker entry is generated by
#     opennextjs-cloudflare, so it means either a wrapper around the generated
#     entry or a second small worker that just calls this endpoint.
#   · A systemd timer on this host is a five-line unit and works today, but the
#     feed stops updating whenever the host is off.
#   · Any external uptime-style scheduler can POST to the endpoint with the
#     header, since that is all the auth requires.
#
# Weekly is the right cadence for decay; polling wants to be hourly or so, which
# is why the two halves can be requested separately.
