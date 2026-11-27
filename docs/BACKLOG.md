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

Verified 2026-11-26 23:30 UTC (all four checks re-run): nothing schedules
it by any available route. `systemctl --user list-timers --all` shows
**seven** timers and no overage timer; `select count(*) from pg_extension
where extname='pg_cron'` is 0, so no pg_cron job can exist whatever anyone
schedules; `frontend/wrangler.jsonc` declares no cron triggers; and `graph
who-uses reconcile-overages` turns up no caller.

The timer count is the one thing that has moved, and it is not this item
getting closer: the seventh is `templedb-deploy-verify-bza.timer`,
installed 2026-11-22 11:31 CST, which health-checks production hourly and
has nothing to do with billing. The other six are unchanged
(poincare-sync, templedb-{ingest,backup,reconcile,agent-tick},
systemd-tmpfiles-clean), and the count has held at those seven through
2026-11-26. Read a rising timer count as somebody scheduling something
*else* until you have read the unit, because this list is the natural place
to expect the fix to show up.

The pg_cron check is worth keeping first in that list because it is
structural rather than a snapshot: the installed extensions are plpgsql,
pg_stat_statements, uuid-ossp, pgcrypto, supabase_vault, pg_jsonschema and
plpgsql_check. Scheduling inside the database is not an option anyone can
take without installing an extension first, so this is a host-timer
decision whatever else changes.

That search returns five files, every one a prose mention: the script
itself, `frontend/lib/supabaseSchema.ts`, migrations 57 and 58, and this
backlog file. Expect it to include this item — naming the script here is
what puts `docs/BACKLOG.md` in the results, so the hit count rises when
this item gets edited and that is not a caller appearing. An earlier
version of this line promised "two non-script hits" and was wrong on both
counts the moment it was committed.

Migration 58 sitting in `supabase/setup/archive/` is not removal of the
billing path: every applied migration 50–69 is filed there, and the
functions are live in `bza_public`.

Sized 2026-11-20 and re-measured on each parked run since, latest
2026-11-26 23:30 UTC, because the paragraphs above read more urgent than
the numbers support. Every figure below is a fresh query, not a quotation
— the recorded peak was once 13× low because it was copied forward
instead of re-run. The allowance is
`app_config['billing.included_cents']` =
500, so $5 per customer-month, and the largest single user-month ever
recorded is 14.80¢, in 2026-08 — 3% of one allowance. Lifetime
`charged_cost` across all customers is 40.26¢ over 1610 rows, the current
month's heaviest user is at 1.53¢, and all three `billing_customers` rows
sit at `overage_reported_cents` = 0. So `reconcile_all_overages()` would
return zero rows today and the UNREPORTED path that can lose money has
never fired. The gap is real and worth closing before usage grows, but it
has never cost anything — decide this as a cadence question, not as a leak.

Through 2026-11-22 the row count was the only figure that moved: 1565 on
the morning of 2026-11-21, 1568 that evening, with the lifetime total still
39.98¢ at both, and on 2026-11-22 even the count came back byte-identical
across fourteen hours of a weekend. That was the sizing argument's
strongest form — not a leak slowly filling but a path barely used — and it
is also the reason not to treat a quiet re-measurement as a reason to stop
measuring, because on 2026-11-26 the sum moved for the first time. Four
days took it to 1610 rows and 40.26¢, with the current month's heaviest
user going 1.26¢ → 1.53¢: a quarter of a cent of use. So re-run the sum and
not just the count, and then read a moved sum the way you read a moved
count. The figure that would change the verdict is a user-month approaching
500¢, and nothing here is within two orders of magnitude of it.

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

Verified 2026-11-26 23:30 UTC: still no deploy timer, and
`deployment_history` rows 422–454 are every one `triggered_by=manual`,
`deployed_by=zach` — 33 deploys, nine of them inside a single day, all
`success` except row 431, which reads `in_progress` because that status is
written and never cleared rather than because a deploy is stuck, and rows
441, 442 and 450, which failed to build.

Row 440 is head and landed 2026-11-22 11:37 CST, 16 hours after 439, which
itself landed 28 hours after 438. The run before last recorded 438 as head
and added "nothing has deployed since", which was true when written at
09:00 and false by that evening. So a quiet day in this history is not the
practice stopping, and a re-check that turns up no new row should not be
written down as one.

**Production is serving the graph head exactly as of this check** —
`/api/version` answers `B5A0EC2C5462247E` and that is the head of
`vcs log bza --all-sessions`. No previous refresh of this item has been
able to say that; every earlier one measured production some commits
behind. The gap is zero because a human deployed six minutes after the
commit landed, not because anything automated closed it, so read this as
a snapshot of one attentive moment rather than as the item resolving.

Read `deployment_history.started_at` as UTC. Row 439 stores
`2026-11-22 01:12:55` for a deploy a human would place on Saturday
evening, so dates taken raw from that column run up to six hours ahead of
the day anyone would name — which is how "nine on the 20th" and "09:00
CST" came to sit in one paragraph on two different clocks.

The premise holds, but the shape is the opposite of a backlog, and the
earlier snapshot here — "3 commits and 13 hours behind head" on 11-16 —
has not described the situation for days. The by-hand path is actively
tended, so do not decide this as unshipped-work risk. What is actually
unwritten is the cadence, and the cost of leaving it unwritten is that
review depends entirely on one person's attention with nothing recording
what that person is expected to cover.

The reporting half of this item is closed, and as of 2026-11-22 it is also
scheduled. `bash scripts/verify-live-sha.sh` prints the gap as a count plus
the missing subjects, so "how far behind is production" is one command
rather than a manual sha comparison; and
`templedb-deploy-verify-bza.timer` now asks the same question hourly via
`templedb deploy health-check bza --target production`, going red when
production answers with something other than the graph head.

That timer narrows the item rather than closing it. It measures the gap;
it does not decide who looks at the answer, how often, or what they are
expected to have reviewed before a deploy — which is the whole of what is
unwritten here. Nothing deploys as a result of it firing, and nothing
should: the restriction on autonomous publishing is the correct part of
this arrangement. So the cost of leaving the cadence unwritten is now
narrower but unchanged in kind: review still depends entirely on one
person's attention, and the new timer tells that person they are behind
without recording what being caught up would mean. A defect in that
timer's signal — it could not say whether production was unreachable or
merely behind, both exiting 1 — was an earlier item 3 of this file and is
fixed in templedb as of 2026-11-23, taking effect at the next NixOS
rebuild. It was always independent of this decision, and closing it did
not move this one.

The "production is serving the graph head" line above lasted about eight
hours and should not be re-read as the current state. Measure it yourself;
it moves within hours either way. On 2026-11-24 05:26 UTC production was
eight commits behind, and for once that was NOT a cadence observation: the
human deployed twice on 2026-11-23 and both builds failed, which is item 3
below. So when refreshing this item, check `deployment_history.status`
before reading a gap as inattention — a run that measures the distance to
head and writes down "nobody deployed" will be wrong in exactly the way
that hides a broken build.

As of 2026-11-26 23:30 UTC the gap is one commit: `/api/version` answers
`DE70D482314717DF` built at 20:20 UTC, and head is `3A89C3EEC9CD2CAD`, the
random-variables promotion from 22:28. Six deploys landed between 19:23 and
20:20 that evening alone. Neither the width of the gap nor its narrowness
is the thing being decided here — a one-commit gap at 23:30 and an
eight-commit gap two days earlier are the same arrangement sampled twice,
which is precisely why the cadence is what needs writing down and the
distance does not.

## 3. The release path has no type-check gate — one config value

A type error anywhere in `frontend/` fails `next build` and therefore the whole
release, and until 2026-11-24 nothing anybody ran would notice. The three
concepts suites execute the emitted JavaScript, where the types are gone, so
they stay green with nothing to say — 1453, 681 and 27 passing throughout the
28 hours that an unannotated `COLUMNS_AND_NULLITY` in
`frontend/lib/concepts/tasks.ts`, from the rank-nullity promotion
(C1D3ED875476CA71, 2026-11-23 01:05 UTC), held `deployment_history` rows 441
and 442 at `Build failed (exit 1)`.

**The commit-time half is done.** `frontend/tests/typecheck.mjs` runs
`tsc --noEmit` over the real tsconfig and is first in the `npm test` chain as
`npm run test:types`. It resolves its dependencies from the release tree's own
install, so it works from a bare `templedb edit bza` workspace with no
`npm install` — the missing `node_modules` is what made this impossible before
and is the whole reason the check did not exist.

Verified 2026-11-24 14:16 UTC by reintroducing the exact defect in a
DB-current tree: annotation present → exit 0, annotation removed → exit 2
naming `tasks.ts(8554,5)` TS2322 down to
`Type 'undefined' is not assignable to type 'boolean'`. All three suites were
green in both runs, which is the point.

**What is left is one config value.** `projects.deployment_config` for bza
still has `app_deploy.pre_deploy_test: null`. `app_deploy_service.py` rsyncs
`working_dir` from the materialized checkout and *then* runs that command with
`shell=True, cwd=work_dir`, abandoning the run on a non-zero exit with
`Pre-deploy tests failed`. Setting it to `npm run test:types` turns this class
of defect from a failed build into a refused one. `work_dir` is
`/home/zach/.local/share/templedb/fhs-deployments/bza/working/frontend`, which
is where `build_cmd` runs too, so the gate reads the same packages the build
will.

Nothing needs provisioning there today, and that was checked by running the
gate in that tree rather than by reasoning about it: `cd <work_dir> && node
tests/typecheck.mjs` exits 0 against the rsynced sources, resolving every
dependency from the tree's own `node_modules` with no symlinking
(2026-11-26 04:20 UTC). But the earlier version of this paragraph explained
*why* with a mechanism that does not exist — "the one tree that always has
`node_modules`" — and the difference matters to whoever types the command.
Nothing in the pipeline installs there. `app_deploy_service.deploy()` has no
install step and its rsync passes `--exclude node_modules`, so the directory
is whatever was last built by hand: dated 2026-10-15, against a
`package-lock.json` last observed 2026-10-16. The `npm install
--prefer-offline` the old claim rested on is the **frontend group's**
`pre_deploy` hook, it names `/tmp/bza/frontend` rather than `work_dir`, and it
belongs to the group orchestrator — which has never deployed this project. No
row of `deployment_history` for bza carries `groups_deployed`, and the
`Build failed (exit 1)` on rows 441–442 is `app_deploy_service.py`'s own
wording, so the path this item gates is the path that runs.

So the value is still right to set and safe to set today. What it is not is
self-maintaining: the first commit that **adds** a dependency makes `tsc` fail
on an unresolvable import and refuse a deploy with nothing wrong with it,
which is a false red on the one check whose value is being trusted. The fix
then is `npm install` in `work_dir`, or `BZA_TYPECHECK_NODE_MODULES` pointed at
a maintained tree — not debugging the types. `frontend/tests/typecheck.mjs`
carries this where it is needed as of the same commit as this paragraph.

It is still open because the autonomous content tasks are denied every
`deploy` verb, read-only ones included, and the command that writes this value
is one of them. Someone with a wider policy has to type it.

Two things not to get wrong:

- `project-config --set` takes the **whole** `app_deploy` object and replaces
  it: `AppDeployConfig.from_dict` reads eleven keys and defaults every one you
  omit. A partial `--set '{"pre_deploy_test": "…"}'` fails safe — KeyError on
  `working_dir`, exit 1 — but one that supplies the three required keys and
  omits the rest silently empties `static_env` and `worker_name`, which is how
  you would lose every `NEXT_PUBLIC_*` and the wrangler target in the same
  breath as adding a safety check. So do not retype the object — derive it from
  what is already there:

      templedb deploy project-config bza \
        --set "$(templedb deploy project-config bza |
                 jq -c '.pre_deploy_test = "npm run test:types"')"

  That is safe by construction rather than by care: the no-`--set` form prints
  exactly `to_dict()` and nothing else, which is the shape `from_dict` reads
  back, and `set_config` replaces only the `app_deploy` subtree — `groups`,
  `blue_green` and `health_check` are loaded and rewritten untouched. Checked
  2026-11-25 against the live object: eleven keys in, eleven out, `worker_name`
  and all six `static_env` keys byte-identical, `pre_deploy_test` the only
  field that moves. (`jq` is on PATH on this host and `python3` is not, so the
  obvious load-set-dump one-liner is not available.) Do not replace this
  pipeline with the resulting JSON written out in full: that is a snapshot, and
  pasting it after anyone adds a worker secret reverts that edit silently,
  which is the same whole-object hazard the bullet opens with.
- `--skip-tests` bypasses it. So this gates the ordinary path, not a determined
  one, and a green release is not by itself proof the check ran.

Re-verified on every parked run between 2026-11-24 14:16 and 2026-11-26 23:30
UTC, latest at 23:30, each pass re-running the checks rather than quoting the
pass before it. All of it still holds: `pre_deploy_test` null, `app_deploy`
exactly the eleven keys `from_dict` reads, `test:types` first in the `npm test`
chain, `tests/typecheck.mjs` 176 lines in the DB, and the gate exiting 0 run
directly in `work_dir`. Nothing about the fix has moved in three days. The item
is one command wide and stays open only because that command is denied.

Read the null out of `projects.deployment_config` with a SELECT, not with
`deploy project-config bza`: the read-only print is itself a `deploy` verb and
is denied to the tasks that drain this file, which is why every refresh
measures the value by SQL and still cannot set it. The eleven keys count out of
the same SELECT.

Four figures in this item do move, and movement in none of them is this item
getting closer. Each has a load-bearing half that holds still, and that is the
half to read:

- `graph who-uses pre_deploy_test` was three files on 2026-11-25 and is four
  now. It grows because `who-uses` is a plain substring search over file
  contents, so every run that explains the key in prose becomes a hit — the
  fourth is `frontend/tests/typecheck.mjs`, added by the same 04:20 commit that
  re-asserted three, so that line was false the moment it landed, exactly as
  item 1's "two non-script hits" was. The half that decides whether setting the
  value is safe is *read by*, and that is still two files, `deploy_project.py`
  and `app_deploy_service.py`. Count readers by what consumes the value.
- `deployment_history` for bza was 366 rows, then 367, and is 373 — six more
  deploys landed between 19:23 and 20:20 UTC on 2026-11-26, head now row 454.
  The claim that matters is the zero and not the total: no row at any of those
  counts carries `groups_deployed`, so the group orchestrator has still never
  deployed this project and the path this item gates is the path that runs.
- **Which rows carry `Build failed (exit 1)` moves too, and the new one is not
  this item's defect.** It was rows 441 and 442; it is now 441, 442 and 450.
  Row 450 started 2026-11-26 19:56:04 UTC and row 451 started 35 seconds later
  on identical content — the last commit before either was 19:55:56 and the
  next was 20:02:50 — and 451 built and shipped. So the same sources that
  failed one deploy succeeded in the next, and `tsc` over them exits 0 today:
  a `pre_deploy_test` gate would have passed row 450, not refused it. The two
  runs overlapped (450 completed 19:56:53, after 451 began) and
  `app_deploy_service.py` takes no lock, so the mechanism is at hand:
  `_sync_from_checkout` rsyncs `-a --delete` into `work_dir` and the build runs
  with `cwd=work_dir`, so a second deploy starting mid-build deletes and
  rewrites the tree underneath the first. Read a new `Build failed` row as that
  until you have a log, not as the type error coming back. The load-bearing
  half is about wording rather than count and is unchanged: the string is
  `app_deploy_service.py`'s own, lines 443 and 449, which is what proves the
  gated path is the path that runs.

  Two cautions if you measure this yourself. `started_at`/`completed_at` and
  `duration_ms` disagree — row 450 spans 49s between the columns and records
  87866ms — so do not compute elapsed from the pair; the overlap holds under
  either reading. And if concurrency is what broke 450, the gate inherits it:
  `pre_deploy_test` runs in that same `work_dir` immediately before the build,
  so it can go red for the same reason, which is a second route to a false red
  on the one check being trusted alongside the dependency-addition one above.
- `work_dir`'s `package-lock.json` mtime advances on every deploy — 2026-11-25
  21:42 and 2026-11-26 14:19 as `ls` prints them, which is local time (CST,
  UTC−6) and so 03:42 and 20:19 UTC, each a minute before the `started_at` of
  the row that rewrote the file (447 and 454) — while its `node_modules` stays
  2026-10-15. A previous refresh recorded one of these as `14:59`, which is
  the UTC `started_at` of row 448 and not anything `ls` printed; the two
  clocks are six hours apart and this is the second place in this file where
  that has bitten, the other being item 2. So an `ls -l` there shows a lock that
  appears to have moved past its install, which is exactly the false-red state
  the warning above describes, and it will show that again after every deploy.
  The content has not moved: the rsync recopies the file each time and only the
  mtime changes, and the file is still 666475 bytes at the hash
  `source_snapshots` has carried since 2026-10-16. Compare the hash, not the
  timestamp, before concluding the tree needs an install.

One correction to the earlier version of this item, which claimed `next build`
is the only thing in the project that runs `tsc`. `npm run type-check` has been
in `frontend/package.json` all along. It needed a `node_modules` no authoring
workspace had, and nothing ran it — so the gap was never a missing command, and
looking for one is how it stayed open.

A trap that cost this run an hour, now refused by the harness rather than
written down: `tsconfig.json` excludes only `node_modules`, while its include
is a recursive `.ts` glob. Any *other* directory under `frontend/` holding
`.ts` files — a `node_modules.bak`, a half-renamed tree — is compiled as a
project source, and TypeScript's own `lib` `.d.ts` files coming in that way
produce a circular-inference error in an unrelated file that reads exactly like
a regression you just introduced.
