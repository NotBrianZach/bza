-- Make the prerequisite graph actually acyclic.
--
-- ── WHAT WAS GUARDING THIS BEFORE: a sentence in a prompt ─────────────────
--
-- knowledge_edges is a prerequisite relation -- from_node must be understood
-- before to_node. The only place that claim was ever written down is the
-- extractor prompt in supabase/functions/build-knowledge-graph/index.ts, which
-- ends its rules with:
--
--     - No cycles allowed
--
-- That is an instruction to a language model. The function additionally filters
-- self-loops in JavaScript (`e.from !== e.to`) before inserting, so the data is
-- clean today -- verified: 0 self-loops, 0 cycles at time of writing -- but
-- neither guard is a constraint. Any other writer reaches the table without
-- them: a direct PostgREST insert, a future importer, a manual fix-up.
--
-- This matters now rather than theoretically, because the scheduling work in
-- reports/2026-10-14-0804 wants to traverse these edges backwards to discharge
-- review pressure on prerequisites. A traversal that assumes a DAG over data
-- the schema permits to be cyclic does not return.
--
-- Two guards, because they catch different things and one of them cannot be
-- expressed declaratively.

-- ── 1. self-loops: a CHECK, because it needs only the row ─────────────────
--
-- "A is a prerequisite of A" is not a cycle so much as a contradiction, and it
-- is the only malformation visible from within a single row -- so it belongs in
-- a CHECK rather than in the trigger below, where it would cost a recursive
-- descent to discover something a comparison settles.
--
-- ADD CONSTRAINT has no IF NOT EXISTS, hence the guard.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'bza_public.knowledge_edges'::regclass
       and conname  = 'knowledge_edges_no_self_loop'
  ) then
    alter table bza_public.knowledge_edges
      add constraint knowledge_edges_no_self_loop check (from_node <> to_node);
  end if;
end $$;

-- ── 2. longer cycles: a trigger, because a CHECK cannot see other rows ────
--
-- A CHECK constraint is evaluated against one row and may not query the table,
-- so "would this edge close a loop" is out of its reach. The test is: adding
-- f -> t creates a cycle exactly when t can already reach f. So walk forward
-- from to_node and look for from_node.
--
-- BEFORE ... FOR EACH ROW is deliberate, and has a consequence worth stating:
-- the extractor deletes a book's edges and re-inserts them as one batch, and a
-- row trigger sees the rows already inserted by that same statement. So a
-- cyclic batch is rejected at the row that closes the loop, which aborts the
-- whole insert and fails the graph build for that book.
--
-- That is the intended behaviour, and it is a real change: today such a batch
-- would be stored and the cycle would sit there silently. Failing the build is
-- louder and better -- a cyclic prerequisite graph is not a worse graph, it is
-- a different kind of object, and every consumer downstream assumes it cannot
-- happen. The fix when it fires is to make the extractor drop the offending
-- edge, not to relax this.
--
-- The depth cap is belt-and-braces. Once this trigger is in place no cycle can
-- be created, so the recursion terminates on structure alone; the cap bounds
-- the damage if a cycle somehow predates the trigger, and 64 is far past any
-- plausible prerequisite chain for the 8-15 concepts the extractor emits.
--
-- SECURITY INVOKER (the default) is correct here rather than a weaker choice:
-- the traversal reads knowledge_edges under the caller's RLS, and since every
-- node in a book belongs to one user, a caller always sees the whole subgraph
-- their own edge could form a cycle within. A cross-user cycle is not
-- representable -- there is no edge whose endpoints have different owners -- so
-- RLS cannot hide a cycle that matters.
create or replace function bza_public.knowledge_edges_reject_cycle()
returns trigger
language plpgsql
as $fn$
begin
  if exists (
    with recursive reach(node, depth) as (
      select new.to_node, 0
      union all
      select e.to_node, r.depth + 1
        from bza_public.knowledge_edges e
        join reach r on e.from_node = r.node
       where r.depth < 64
    )
    select 1 from reach where node = new.from_node
  ) then
    raise exception
      'knowledge_edges: adding % -> % would create a prerequisite cycle',
      new.from_node, new.to_node
      using errcode = '23514',
            hint = 'from_node is a prerequisite of to_node; to_node already '
                   'reaches from_node, so this edge would make each require the other.';
  end if;
  return new;
end
$fn$;

drop trigger if exists knowledge_edges_no_cycle on bza_public.knowledge_edges;
create trigger knowledge_edges_no_cycle
  before insert or update of from_node, to_node
  on bza_public.knowledge_edges
  for each row
  execute function bza_public.knowledge_edges_reject_cycle();

-- ── what this does NOT do ─────────────────────────────────────────────────
--
-- It does not make the graph connected, rooted, or complete, and it does not
-- check that an edge's two nodes belong to the same book. That last one is a
-- real gap -- book_id is denormalised onto the edge while from_node/to_node are
-- global node ids, so a row claiming book A with endpoints in book B is
-- representable. The extractor never produces one because it inserts with ids
-- it just created for a single book. Left alone here because 64 is about
-- acyclicity, and a cross-book edge is a different invariant with a different
-- fix (probably a composite FK rather than a trigger).
