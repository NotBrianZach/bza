-- 75 — claiming to know something, and being checked on it
--
-- One table, in `bza_public`. Additive and idempotent.
--
-- ── The problem ────────────────────────────────────────────────────────────
--
-- The mastery gate is strict on purpose: a concept is only practised once
-- everything it rests on is at or above the floor. That is right for somebody
-- learning the subject in order, and wrong for everybody else. An adult who
-- already factors quadratics fluently is made to start at "adding and
-- multiplying polynomials" and cannot reach the material they came for — which
-- is why /learn looks like it has three concepts in it when it ships
-- twenty-four.
--
-- ── A claim is a REQUEST TO BE TESTED, not a grant ────────────────────────
--
-- This is the whole design and the reason it cannot corrupt anything.
--
-- Claiming a concept makes that concept introducible, so its tasks are served
-- immediately. It does NOT write strength, it does NOT count as demonstrated,
-- and it does NOT unblock anything downstream. Dependents open only when real
-- unaided successes have pushed the concept's actual strength over the floor,
-- exactly as before.
--
-- So the worst a false claim can do is serve somebody problems they cannot do.
-- The engine then rules them incorrect through the ordinary path, the claim is
-- revoked, and the concept returns to blocked. There is no state a bluff can
-- reach that a bluff should not be able to reach.
--
-- The alternative designs are both worse. Letting a claim set strength directly
-- would let anybody mark themselves fluent in everything and would poison the
-- one table whose meaning the whole engine rests on. Letting a claim unblock
-- DEPENDENTS would mean serving partial fractions to somebody who cannot
-- factor — the precise failure the ordering exists to prevent.
--
-- ── Why revocations are kept ──────────────────────────────────────────────
--
-- `revoked_at` and `revoked_reason` rather than deleting the row. A claim that
-- was made and withdrawn is a fact about what the learner believed, and it is
-- the most interesting signal in here: a concept somebody claims twice and
-- fails twice is a concept they think they know and do not, which is worth
-- surfacing to them and is invisible if the row is removed.
--
-- It also makes re-claiming honest. Nothing stops a second claim after a
-- revocation — the engine will simply test again — but the history says how
-- many times that has happened.

create table if not exists bza_public.concept_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Concept and subject ids from the authored ontology, NOT foreign keys: the
  -- ontology is code, not data. Same reasoning as
  -- `concept_point_strength.knowledge_point_id`.
  subject_id text not null,
  concept_id text not null,
  claimed_at timestamptz not null default now(),
  -- What the learner said when claiming, if anything. Free text, optional, and
  -- never parsed — it exists so a claim can carry its own justification
  -- ("did this at university") for the person reading their own history.
  note text,
  -- Set when an unaided success on this concept has carried its strength over
  -- the floor. The claim is then redundant and stops granting anything, which
  -- is correct: the strength table is now saying it.
  verified_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text
);

-- The scheduler asks one question per concept: is there a LIVE claim on it?
-- Live means claimed, not revoked, not yet verified.
create index if not exists concept_claims_live_idx
  on bza_public.concept_claims (user_id, subject_id, concept_id)
  where revoked_at is null and verified_at is null;

-- At most one live claim per concept. A second live row would make "is this
-- claimed" ambiguous and would let a revocation miss one.
create unique index if not exists concept_claims_one_live_idx
  on bza_public.concept_claims (user_id, concept_id)
  where revoked_at is null and verified_at is null;

alter table bza_public.concept_claims enable row level security;

do $$ begin
  create policy "own concept claims" on bza_public.concept_claims
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on bza_public.concept_claims to authenticated;
