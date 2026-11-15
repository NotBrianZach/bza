# bza backlog

The work queue `bza-dev-backlog` drains. One item per run, top of the list
first, unless an item says otherwise.

## How to use this file

An item is a heading plus enough context that someone can start without
rediscovering the problem. The rules that make the queue trustworthy:

- **Every item carries its evidence.** `Verified:` says how the claim was
  checked and when. `Unverified:` says what still needs confirming — and
  confirming it IS the first step of that item, not a reason to skip it.
  An item with neither is not ready to be worked.
- **Delete an item when it is done**, in the same commit as the fix, and say
  in the commit message that you closed it. A backlog that only grows stops
  being read.
- **If an item turns out to be wrong or already fixed, delete it and say so.**
  That is a successful run. Two of the first six candidates for this file were
  already resolved in the tree while memory still described them as open; the
  check is not a formality.
- **Do not add speculative work.** "We should probably refactor X" is not an
  item. A defect, a decision with a deadline, or a gap with a named consequence
  is an item.
- An item that needs a human decision stays here with **DECISION NEEDED** in
  its heading and must not be guessed at.

---

## 1. Nothing schedules the overage billing reconcile — DECISION NEEDED

`scripts/reconcile-overages.sh` is the one metering path to Stripe and nothing
runs it: no pg_cron job, no systemd timer. Overage usage accrues in
`api_usage` and is never billed. Migration
`58_overage_billing_is_the_one_path.sql` deliberately left scheduling out, so
this is a gap rather than a regression.

The script is safe to re-run (verified by rollback test: 314¢ delta on first
run, no row on immediate re-run), so a timer is low-risk. What needs deciding
is cadence and where it runs, because this host is a laptop and a missed
window silently defers revenue rather than erroring.

Two things not to get wrong when wiring it:

- `api_usage.charged_cost` is a GENERATED column (`base_cost ×
  markup_multiplier`). Never apply markup in a caller — doing both bills 4×.
- Both functions mark the delta reported BEFORE the caller reaches Stripe, so
  a Stripe failure loses that usage rather than risking a double charge. The
  script prints those as `UNREPORTED` and nothing retries them. Any scheduled
  wrapper must surface `UNREPORTED` somewhere a human sees it, or the one
  failure mode that loses money becomes invisible.

Verified 2026-11-15: `systemctl --user list-timers --all` has no overage
timer; the six timers present are poincare-sync, templedb-{ingest,backup,
reconcile,agent-tick} and systemd-tmpfiles-clean.

## 2. Authored material reaches git but never reaches the site

`/api/version` reported sha `1E37435688575ABE` built 2026-11-14T15:28Z while
three later authoring commits sat in git HEAD. The concept tasks are
policy=commit and forbidden to publish — correct, because a model must not
ship unreviewed mathematics — but no step ever takes reviewed work the rest of
the way, so output accumulates invisibly.

This is a process gap, not a bug, and the fix is a decision about who reviews
and when. Do not resolve it by giving an autonomous task publish rights.

What would help regardless of that decision: make the drift legible. The
number of commits between `/api/version`'s sha and HEAD is a one-line check
and nothing currently reports it.

Verified 2026-11-15: curl of `/api/version` against `vcs_commits` ordered by
`commit_timestamp`.

## 3. `right-triangle-trig` would open a one-concept subject — DECISION NEEDED

It is the 7th entry on the concept-promotion order and both its prerequisites
(`similarity`, `pythagoras`) are authored, so it is mechanically ready. But
Trigonometry has no authored syllabus, so promoting it creates a subject
holding exactly one concept — and it also gates `dot-product-geometry`, so
leaving it alone stalls the Coordinate-geometry branch of both remaining
journeys.

Either answer is defensible and the authoring loop should not pick for itself:
promote it and accept a one-concept subject that will grow, or promote several
trigonometry concepts together so the subject opens at a sensible size.

Verified 2026-11-15: area/prerequisite state read out of the composed atlas.

**Updated 2026-11-15, same day:** this is now the ONLY thing standing between
those two journeys and the end of their unwritten ground. It was not before.
The stub-floor deadlock sat behind it — `number-and-arithmetic` was frozen at
five nodes and `euclidean-geometry` held five route concepts against three
releases of room, so settling this item would have unblocked the branch for
three promotions and then stalled it again. Both areas have since been merged
into their neighbours (`algebra-foundations` and `euclidean-geometry`
respectively; see `frontend/lib/concepts/atlas-foundations.ts`), and
`tests/atlas.mjs` now asserts the promotion budget per area, so every route
concept is reachable with headroom. The one-concept-subject question is
untouched by that and still needs a human answer.

## 4. Confirm the lint baseline

Recorded baseline is 0 errors and 47 `react-hooks/exhaustive-deps` warnings,
with `typescript.ignoreBuildErrors: false` and `.eslintrc.json` both live, so
errors fail a build and warnings do not. That number has not been re-checked
recently and a drifting warning count hides a new one.

Re-running it needs a real `node_modules` (the authoring workspace carries
only a typescript symlink) and a placeholder `.env.local` with
`NEXT_PUBLIC_SUPABASE_{URL,ANON_KEY}` + `SUPABASE_SERVICE_ROLE_KEY`, else
`next build` dies collecting page data. Delete the `.env.local` afterwards.

First step is confirming the count, then recording it here as the new
baseline. Closing this item means writing down a number, not getting to zero.

Unverified: the 47 figure is from a recorded baseline, not from a run today.
