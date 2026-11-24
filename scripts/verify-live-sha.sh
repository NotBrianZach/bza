#!/usr/bin/env bash
# Compare the live-deployed commit sha at aireadalong.com/api/version
# against the last bza commit in the templedb graph. Exits 0 if they
# match, 1 if they diverge, 2 if the endpoint is unreachable. On
# divergence it also says how far behind production is and what it is
# missing.
#
# Runs the "verify fact" step that the deploy pipeline itself doesn't:
# the deploy log says "success", but this actually asks the live worker
# what it thinks it's running.
#
# Worth running on its own, not only from deploy.sh. Deploys here are manual,
# so drift between releases is the normal state rather than a fault, and this
# is the only thing that measures it:
#
#   bash scripts/verify-live-sha.sh

set -euo pipefail

URL="${1:-https://aireadalong.com/api/version}"

# How far back to look when measuring the gap. Reading the head needs one
# commit; measuring a distance needs enough of them to find the live sha, and
# templedb's default of 10 is a window the gap can fall out of — past 10 behind,
# the walk below could not tell "production is ahead of the graph" from
# "production is further behind than I can see". 200 covers bza's whole recorded
# history today (437 commits, and the gap has never exceeded single digits), and
# costs nothing: the read is process-startup bound, 200 and 10 both take ~1s.
WINDOW=200

# Two steps rather than one pipeline, and not a style preference.
#
# `templedb vcs log bza | awk '/^commit/ {print; exit}'` makes awk close the pipe
# after the first match while templedb is still writing the rest of the log.
# templedb gets SIGPIPE, prints "Error: [Errno 32] Broken pipe", and exits
# non-zero — which `set -o pipefail` promotes to a failure of the whole script.
# It is a race, so it depends on how much log there is left to write: it passed
# for months and then started failing the day a commit arrived with a long
# message. Draining the output into a variable first means the first command
# always runs to EOF and there is no early reader to close anything.
# `--all-sessions` is what makes this check mean anything.
#
# A bare `vcs log` shows published commits plus only the CURRENT session's
# unpublished ones. This script runs from deploy.sh, in a session that owns none
# of the autonomous authoring tasks' commits, so without the flag the "expected"
# head silently excludes them.
#
# That is not merely a weaker check, it is a check that confirms its own error:
# deploy.sh stamped BUILD_SHA from the same session-scoped log, so on 2026-11-15
# this compared a two-commits-stale stamp against a two-commits-stale expectation
# and reported "OK: live sha matches graph". A verifier that derives its
# expectation the same way the thing it verifies does cannot detect that class of
# fault at all. Keep both call sites on --all-sessions.
#
# Draining into a variable moved the early-reader problem rather than removing
# it, and widening the window to $WINDOW is what made that visible: 200 commits
# of these commit messages is ~580KB, far past the 64KB a pipe buffers, so
# `printf | awk … exit` now blocks printf, awk exits on the first match, and
# printf dies of SIGPIPE — the same 141 the comment above describes, one process
# to the left. It survived at the default of 10 only because that log fits in the
# buffer entire. So neither awk below may `exit` early; both read to EOF and
# guard with a flag instead. It costs a pass over a string already in memory.
log=$(templedb vcs log bza --all-sessions -n "$WINDOW" 2>/dev/null || true)
# The expected sha: an explicit one if the caller has it, otherwise graph head.
#
# These are two different questions and conflating them made a successful
# deploy report as a failure. A DEPLOY asks "did the thing I just built
# arrive?", and the only right answer is its own BUILD_SHA. Graph head is a
# moving target: on 2026-11-24 the loop landed a commit during the twenty
# minutes of `next build`, so deploy.sh shipped 9B54B6FB, verified against a
# head that had become E8C3B4F4, and exited 1 having done nothing wrong.
#
# Run standalone — which is how the hourly timer runs it — the question IS
# "is production current", and head is the right comparison. So the default
# is unchanged and only deploy.sh passes an argument.
expected="${2:-}"
if [ -z "$expected" ]; then
  expected=$(printf '%s\n' "$log" | awk '/^commit / && !seen {print $2; seen = 1}')
fi
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

# How far behind, and what production is missing.
#
# Two opaque shas say "not head" and stop there. They cannot distinguish one
# commit of UI polish from nine commits of unreviewed mathematics, and that
# difference is the whole reason to read this output: nothing deploys bza
# automatically, so the question after a divergence is never "did something
# break" but "how much has piled up and does it need a human first". Nothing
# reported it before — /api/version knows one sha, deployment_history knows when
# a deploy last ran, and no step subtracts the two.
#
# Reporting only, deliberately after the MISMATCH block and off the exit path:
# the gap walk must not be able to change the status deploy.sh gates on.
#
# `$log` is reused rather than re-read, which also removes a race: two reads a
# second apart can straddle a commit from one of the autonomous authoring
# sessions, and the count would then be measured against a head the lines above
# never printed.
#
# awk's first output line is the number of commits ahead of the live sha, or -1
# when the live sha is not in the window at all. The remaining lines are one per
# missing commit, newest first. A subject is the first indented line of a commit
# block: `vcs log` indents the subject by four spaces and leaves the body
# unindented, so "first indented line after the header" identifies it exactly.
#
# The list stops at ten and says how many it dropped. A gap that large is a
# process problem rather than something to read commit by commit, and a deploy
# failure that scrolls a hundred subjects teaches people to skip the whole block.
drift=$(printf '%s\n' "$log" | awk -v live="$actual" '
  BEGIN { live = toupper(live); found = 0; n = 0 }
  /^commit / {
    if (found) next
    if (toupper($2) == live) { found = 1; next }
    n++; sha = $2; want = 1; next
  }
  !found && want && /^    / {
    if (n <= 10) out = out sprintf("                        %s  %s\n", substr(sha, 1, 10), substr($0, 5))
    want = 0
  }
  END {
    print (found ? n : -1)
    printf "%s", out
    if (found && n > 10) printf "                        … and %d older\n", n - 10
  }
')

# Split with parameter expansion, not `head -1`/`tail -n +2`. $drift is small
# enough today that piping it would work, which is exactly how the SIGPIPE above
# stayed hidden for months; there is no reason to plant a third copy of it.
behind="${drift%%$'\n'*}"
missing=""
case "$drift" in *$'\n'*) missing="${drift#*$'\n'}" ;; esac

if [ "$behind" = "-1" ]; then
  echo "  gap:                  cannot measure — the live sha is not among the last" >&2
  echo "                        $WINDOW commits. Production is either running a commit" >&2
  echo "                        the graph never recorded, or further behind than that." >&2
else
  echo "  gap:                  production is $behind commit(s) behind graph head" >&2
  if [ -n "$missing" ]; then
    printf '%s\n' "$missing" >&2
  fi
fi

exit 1
