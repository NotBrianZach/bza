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

Verified 2026-11-20: nothing schedules it by any available route.
`systemctl --user list-timers --all` still shows the same six timers
(poincare-sync, templedb-{ingest,backup,reconcile,agent-tick},
systemd-tmpfiles-clean) and no overage timer; `select count(*) from
pg_extension where extname='pg_cron'` is 0, so no pg_cron job can exist
whatever anyone schedules; `frontend/wrangler.jsonc` declares no cron
triggers; and `graph who-uses reconcile-overages` turns up no caller — its
two non-script hits, `frontend/lib/supabaseSchema.ts` and migration 58, are
both prose references. Migration 58 sitting in `supabase/setup/archive/` is
not removal of the billing path: every applied migration 50–69 is filed
there, and the functions are live in `bza_public`.

Sized 2026-11-20, because the paragraphs above read more urgent than the
numbers support. The allowance is `app_config['billing.included_cents']` =
500, so $5 per customer-month, and the largest single user-month ever
recorded is 14.80¢ — 3% of one allowance. Lifetime `charged_cost` across all
customers is 39.98¢ over 1565 rows, the current month's heaviest user is at
1.26¢, and all three `billing_customers` rows sit at
`overage_reported_cents` = 0. So `reconcile_all_overages()` would return
zero rows today and the UNREPORTED path that can lose money has never
fired. The gap is real and worth closing before usage grows, but it has
never cost anything — decide this as a cadence question, not as a leak.

When re-checking those numbers: `api_usage`'s time column is `timestamp`,
not `created_at`, so a month filter on `created_at` errors rather than
returning nothing. There is no `included_cents` column anywhere; it is an
`app_config` key, and both functions take it as a parameter defaulting to
500.

## 2. Who takes authored mathematics the rest of the way — DECISION NEEDED

The concept tasks are policy=commit and forbidden to publish, which is right:
a model must not ship unreviewed mathematics. Nothing schedules a deploy
either, so every release is a human at a keyboard, and what reaches learners
is whatever that human's attention reaches. No cadence has ever been agreed.

What needs deciding is who reviews authored material and how often — not
whether the restriction stays. Do not resolve it by giving an autonomous task
publish rights.

Verified 2026-11-20: still no deploy timer, and `deployment_history` rows
422–438 are every one `triggered_by=manual`, `deployed_by=zach` — 17 deploys
across 2026-11-18 to 11-20, nine of them on the 20th alone and three inside
half an hour that evening. (Row 431 reads `in_progress`; that status is
written and never cleared, so it is cosmetic rather than a stuck deploy.)

The premise holds, but the shape is the opposite of a backlog, and the
earlier snapshot here — "3 commits and 13 hours behind head" on 11-16 —
has not described the situation for days. The by-hand path is actively
tended, so do not decide this as unshipped-work risk. What is actually
unwritten is the cadence, and the cost of leaving it unwritten is that
review depends entirely on one person's attention with nothing recording
what that person is expected to cover.

The reporting half of this item is closed: `bash scripts/verify-live-sha.sh`
now prints the gap as a count plus the missing subjects, so "how far behind is
production" is one command rather than a manual sha comparison.
