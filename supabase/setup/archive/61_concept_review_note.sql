-- 61 — a human adjudicating an inconclusive ruling has to be able to say why
--
-- Migration 60 gave `concept_observations` a `reviewed_at` and a
-- `reviewed_ruling`, which is enough to record *that* somebody settled an
-- inconclusive ruling and *what* they decided. It has nowhere to put the
-- reason, and the reason is the valuable part.
--
-- The argument is the same one `interferes_with` makes in the concept ontology:
-- an authored claim with no stated reason cannot be reviewed, and will
-- eventually be deleted by somebody who cannot see what it was for. A review
-- queue is exactly where that matters most — the rows in it are the ones the
-- engine could not settle, so the human's argument *is* the evidence, and a
-- bare 'correct' with no note is indistinguishable from a click.
--
-- WHY NOT REUSE `evidence`. That column holds the worker's own provenance —
-- run id, engine version, environment hash, evidence kind. Putting a human's
-- prose in it would conflate "what the engine did" with "what a person decided
-- the engine should have done", which is the one distinction this whole table
-- exists to keep.
--
-- WHY THE ORIGINAL RULING IS NOT OVERWRITTEN. Resolving a review does NOT set
-- `ruling` to the reviewed value and does not flip `scored`. The row keeps
-- saying the engine ruled it inconclusive and that nothing was scored at the
-- time, because that is what happened; `reviewed_ruling` says what a human
-- decided afterwards. The CHECK constraint from migration 60
-- (`scored` implies a settled `ruling`) therefore still holds untouched, and
-- the strength change is applied from the reviewed ruling rather than by
-- rewriting history. See resolveReview() in frontend/lib/concepts/store.ts.
--
-- Additive and idempotent. No existing column changes meaning, and the code
-- that reads this column is new, so there is no deploy-ordering hazard.

alter table bza_public.concept_observations
  -- The adjudicator's argument, in their own words. Null on a row nobody has
  -- reviewed, which is every row until somebody does.
  add column if not exists reviewed_note text,
  -- Whether the human's ruling was applied to strength. Stored rather than
  -- derived for the same reason `scored` is: a later change to the policy must
  -- not silently rewrite the history of what was counted at the time.
  add column if not exists review_scored boolean not null default false;

-- A reviewed row must say who decided what and why, as one fact rather than
-- three columns that can disagree. Enforced here rather than in the route
-- because this is the second table-level guard on the same discipline, and a
-- convenience that has to defeat a constraint is a convenience somebody
-- notices.
do $$ begin
  alter table bza_public.concept_observations
    add constraint concept_observations_review_is_complete
      check (
        (reviewed_at is null and reviewed_ruling is null and reviewed_note is null
         and review_scored = false)
        or
        (reviewed_at is not null and reviewed_ruling is not null)
      );
exception when duplicate_object then null; end $$;

-- A review may only be *scored* when the human actually settled it. Same shape
-- as `concept_observations_scored_is_settled` from migration 60, and for the
-- same reason: a human who looks at a row and still cannot tell has produced
-- another inconclusive, and that must not move anything either.
do $$ begin
  alter table bza_public.concept_observations
    add constraint concept_observations_review_scored_is_settled
      check (not review_scored or reviewed_ruling in ('correct', 'incorrect'));
exception when duplicate_object then null; end $$;

-- Grants are inherited from the table, which already has them from migration 60
-- via the default privileges installed by 57. Nothing to add — `add column`
-- does not reset column-level grants, and none are in use here.
