-- Make mastery take two passes in a row.
--
-- ── THE GATE WAS DEFEATABLE BY CLICKING ───────────────────────────────────
--
-- updateMastery sets `mastered = score >= 0.6`, and getNodeState in
-- KnowledgeGraph.tsx locks a node until EVERY prerequisite is mastered. So that
-- 0.6 is not a label, it is the mastery-learning gate that decides whether
-- downstream concepts open.
--
-- generate-quiz emits exactly 5 questions with exactly 4 options each, so the
-- gate is 3 correct out of 5 at one-in-four:
--
--   P(>= 3 of 5 | pure guessing, p = 0.25)
--     = C(5,3)(0.25^3)(0.75^2) + C(5,4)(0.25^4)(0.75) + 0.25^5
--     = 0.0879 + 0.0146 + 0.0010
--     ~ 10.4%
--
-- and nothing in NodeQuizView limits attempts or imposes a cooldown, so the
-- expected number of blind attempts to open any node is about ten. A learner who
-- reads nothing and clicks can unlock the whole graph.
--
-- What this is NOT a fix for, since the report that raised it got this wrong:
-- there is no assistance being collapsed in this path. NodeQuizView has no hint,
-- no reveal and no skip -- every answer is unaided by construction. The
-- assistance argument belongs to lib/concepts/scheduling.ts, where hints really
-- exist and an assisted success deliberately does not advance strength. It was
-- carried over to this path by mistake.
--
-- ── WHY TWO CONSECUTIVE PASSES RATHER THAN A HIGHER BAR ───────────────────
--
-- Raising the threshold to 0.8 would take a single attempt from 10.4% to about
-- 1.6%, which is a real improvement and still a single observation: one lucky
-- run still opens the gate, and retries are still unlimited. Requiring two
-- passes in a row instead takes two independent ~10% events, so about 1%, and it
-- buys something a threshold cannot -- it is evidence of retention rather than
-- evidence of one good moment. That is the same principle the concepts engine
-- already runs on, where strength accrues from repeated unaided successes rather
-- than from clearing a bar once.
--
-- It also needs no new question-generation and no new UI surface, only an honest
-- message on the result screen, which is why it is the cheaper of the two
-- defensible options.
--
-- `repetitions` cannot serve as this counter, which is why a new column is
-- needed. It is SM-2's own state and resets on quality < 3, where
-- quality = Math.round(score * 5) -- and Math.round(0.5 * 5) is 3 in JavaScript,
-- so a score of 0.5 is a FAILED quiz that still increments repetitions. Reusing
-- it would treat a near-miss as a pass.

alter table bza_public.knowledge_nodes
  add column if not exists consecutive_passes integer not null default 0;

-- Backfill so nobody is re-locked by this migration.
--
-- A node that is already mastered was opened under the old one-pass rule. Taking
-- that away retroactively would re-lock content a learner has been working past,
-- and would do it silently, which is worse than the loose gate this migration is
-- tightening. Seeding those at 2 grandfathers them in: already mastered stays
-- mastered, and the new rule governs everything from here.
--
-- Everything else starts at 0 rather than being inferred from mastery_score.
-- mastery_score holds only the most recent score, and under the old rule any
-- score >= 0.6 also set mastered -- so a non-mastered row cannot be carrying a
-- passing score, and there is no partial progress to reconstruct.
update bza_public.knowledge_nodes
   set consecutive_passes = 2
 where mastered
   and consecutive_passes = 0;

comment on column bza_public.knowledge_nodes.consecutive_passes is
  'Consecutive quizzes at score >= 0.6. Reset to 0 by any failure. mastered is '
  'derived from this reaching 2, so the gate is evidence of retention rather '
  'than of one passing attempt. Not SM-2 repetitions, which resets on '
  'quality < 3 and counts a 0.5 score as a pass.';
