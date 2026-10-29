-- 77 — a prediction becomes a fact about the log
--
-- Two nullable columns. Additive and idempotent.
--
-- ── What was wrong ────────────────────────────────────────────────────────
--
-- Prediction's entire world is `record: {hits, misses}`. That record was
-- maintained by the interpreter, in its own `world_delta`, scored from prose
-- it had just written itself — and the player's guess, the input that produced
-- the score, was never stored at all. It went into the prompt and vanished.
--
-- So the hit rate of the one game that is *about* a hit rate could not be
-- audited, recomputed, or disagreed with. A model that quietly rounded in its
-- own favour would be indistinguishable from one that did not.
--
-- The exact precedent is `relations.ts`, which says why this is the wrong
-- shape:
--
--   The music section asked the interpreter to maintain a `threadsUsed` array
--   itself, which meant the rule depended on a model remembering to append to
--   it; recording the relation on each turn makes what is spent a fact about
--   the log instead.
--
-- Prediction never got that treatment. It gets it here.
--
-- ── Why two columns and not one jsonb ─────────────────────────────────────
--
-- `prediction` is what the player wrote. `prediction_called` is the ruling on
-- it. They are separate because they have different authors and different
-- trust: the first is the player's own words, recorded verbatim and never
-- interpreted; the second is a judgement, and keeping it in its own typed
-- column is what lets `record` be recomputed with one aggregate instead of a
-- jsonb walk.
--
-- Both nullable, and the three states of `prediction_called` are all real:
--   true   — called it
--   false  — missed
--   null   — no prediction was made on this turn, or it was made before 77
--
-- `record` stays in the world, computed by the engine from these columns the
-- way `mediaVisited` already is, rather than asked for in the prompt.
-- `tendencies` stays the interpreter's, because it is prose about reasoning
-- and there is no arithmetic that could produce it.

alter table bza_public.listen_turns
  add column if not exists prediction text,
  add column if not exists prediction_called boolean;

comment on column bza_public.listen_turns.prediction is
  'The player''s guess at what their move would draw back, verbatim. Null when '
  'none was made. Never interpreted — it is stored so the ruling beside it can '
  'be checked against what was actually written.';

comment on column bza_public.listen_turns.prediction_called is
  'Whether the guess was right. Null means no guess, or a turn written before '
  'this column existed. The engine folds `record` in the world from this, so '
  'the hit rate is derived rather than self-reported.';

-- Partial, because predictions are a minority of turns and the only query that
-- wants them is "the ones on this branch that had one".
create index if not exists listen_turns_prediction_idx
  on bza_public.listen_turns (session_id)
  where prediction is not null;
