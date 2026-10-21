-- 72 — when maintenance last ran, so it can run on a page visit
--
-- One column. Additive and idempotent; nothing existing is touched.
--
-- ── Why this is needed at all ──────────────────────────────────────────────
--
-- The suggested feed's upkeep is two jobs: poll the sources, and decay the
-- learned interest weights toward the prior. Migration 71 shipped both as code
-- and neither had a trigger — every /api/suggest route authenticates with the
-- caller's bearer token, so nothing without a token could drive them.
--
-- The trigger is now a page visit, which is the right one for an app with no
-- scheduling infrastructure: the work happens only when somebody is there to
-- see the result, and a visitor who never comes back needs no fresh items.
--
-- Polling needed nothing new for that, because `suggest_feeds.last_polled_at`
-- already gates it — the age floor in `feedsDueForPoll` makes a poll on every
-- page load cost one query and no fetches.
--
-- DECAY DID NEED THIS COLUMN, and the reason is the whole point of the
-- migration. Decay is defined per unit of TIME: "shrink learned weights toward
-- the prior each week". Run once per invocation, with a page visit as the
-- invocation, it becomes per-VISIT instead — so a daily visitor decays seven
-- times a week and a weekly visitor once, and two people with identical
-- feedback end up with different weights because of their browsing habits
-- rather than their preferences. With a timestamp, the elapsed interval sets
-- the fraction (`decayByElapsed` in lib/suggest/feedback.ts) and the result is
-- independent of how often anybody opens the site.
--
-- `digest_built_at` comes along for a related reason: a digest should be
-- rebuilt when it is stale, and "stale" is also a question about elapsed time.
-- It is deliberately NOT derived from `max(suggest_digests.generated_at)`,
-- because a PREVIEW does not write a digest row and must not count as a build —
-- and because reading it would mean a join on every page visit to answer a
-- question one column answers.

alter table bza_public.suggest_settings
  add column if not exists decayed_at timestamptz;

alter table bza_public.suggest_settings
  add column if not exists digest_built_at timestamptz;

-- Null means "never", which `decayByElapsed` reads as one week rather than as
-- the beginning of time. A user whose account is a year old but whose
-- interests were added yesterday must not have them yanked to the prior on
-- their first visit — the elapsed time that matters is since the last DECAY,
-- and there has not been one.
comment on column bza_public.suggest_settings.decayed_at is
  'When the learned interest weights were last decayed. Null = never; treated as one week by decayByElapsed, not as unbounded elapsed time.';

comment on column bza_public.suggest_settings.digest_built_at is
  'When a digest was last BUILT and stored. Previews do not count, which is why this is not derived from suggest_digests.generated_at.';

-- ── a settings row for anyone who has subscriptions but no settings ────────
--
-- `loadSettings` tolerates a missing row and returns defaults, so nothing was
-- broken by its absence. But maintenance needs somewhere to WRITE the two
-- timestamps, and an upsert that has to invent the row on every first visit is
-- a race between two tabs. Backfilling once is simpler and makes the common
-- path a plain update.
insert into bza_public.suggest_settings (user_id)
select distinct s.user_id
from bza_public.suggest_subscriptions s
where not exists (
  select 1 from bza_public.suggest_settings t where t.user_id = s.user_id
)
on conflict (user_id) do nothing;
