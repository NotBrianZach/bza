# Filling out the three maps

**Date:** 2026-11-10
**Status:** design pass. Nothing built from this document yet. The journey
engine and the journey map it describes as existing *were* built on
2026-11-10 (`0EAEE4F6184A240A`, `5196802ECDE83C13`); the content proposals
below are unbuilt.
**Code read:** `frontend/lib/concepts/{registry,types,forms,tasks,journeys,
atlas,atlas-foundations,atlas-structures,ontology-arithmetic,ontology-functions,
ontology-matrices}.ts`, `frontend/tests/{atlas,journeys}.mjs`
**Summarised in:** nothing yet
**Figures measured against:** `~/.config/templedb/checkouts/bza` — the
published tree, which is what production was built from. Not the edit
workspace, which has uncommitted content authoring in it that moves several
of these counts; see the note under `fraction-arithmetic` below.

Asked for directly: *"can u fill out the concept map and practice map and
narratives map some more"*

Three things were named and they are three different artifacts with costs
that differ by roughly two orders of magnitude. Two of them are an
afternoon of writing. The third is bounded by the verifier rather than by
how much anybody wants to type, and it carries a decision that cannot be
made by whoever happens to be authoring.

## Where the three maps actually stand

| | Count | Of which practisable |
|---|---|---|
| Concept map (`AREAS`, mapped nodes) | 257 nodes in 21 areas | **0** |
| Practice map (authored ontologies) | 34 concepts in 6 subjects | 34 |
| Narratives map (`JOURNEYS`) | 6 journeys | — |

291 concepts total, 34 of them teachable. The two numbers are not a
coincidence of counting: **every teachable concept lives in an authored
ontology and every one of the 21 atlas areas is 0/N.** The atlas is a map
of a subject; the practice engine is a syllabus of what has been written
up; and right now they do not overlap at all.

That is the honest shape of the thing, and it is why "fill out the map"
splits into three jobs rather than one.

## Map 1 — the concept map. Cheap, and it gates nothing.

A mapped node is five fields:

```ts
{
  id: 'fraction-arithmetic',
  match: /^fractions?\b|\b(common fraction|rational number)s?\b/i,
  name: 'Fraction arithmetic',
  is: 'Rational numbers as parts of a whole, with the four operations and the
       common-denominator step that drives them.',
  needs: ['gcd-and-lcm', 'negative-numbers'],
  terms: 'fraction numerator denominator common denominator',
}
```

No knowledge points, so `isTeachable` is false, so `gatingPrerequisitesOf`
looks straight through it and it gates nothing. That is what makes this the
safe map to extend: a wrong node is a wrong label on a diagram, not a wall
in front of a learner.

The guards are already in place and will catch the realistic mistakes —
`atlasProblems` rejects a dangling `needs`, a node colliding with an
authored concept, and a cycle; `tests/atlas.mjs` additionally asserts no
title matches more than four concepts, which is the failure mode of the
`match` regexes.

**Verdict: extend freely.** The thinnest areas against what a reader
actually arrives with are `coordinate-geometry` (7 nodes) and
`limits-and-continuity` (9). Neither is a bottleneck for anything, which is
also the point — this map is for orientation, and orientation is what it
already does well.

## Map 2 — the practice map. The verifier is the boundary.

This is the one that matters and the one that cannot be bulk-authored.
Making a concept practisable is two pieces of work, and the second is the
hard one:

1. a `Concept` with `knowledgePoints`, each carrying a `statement` and a
   `workedExample` of `{problem, subgoals[], answer}`;
2. entries in `TASKS` in `tasks.ts`, each naming a `knowledgePointId`, a
   `kind`, a `given`, a `form` and a `reference` answer.

`ontology-functions.ts` states the constraint on (2) in its own header and
it is the governing rule for everything proposed here:

> It stops at `graphs-of-functions` deliberately, and the boundary is the
> verifier rather than the curriculum. […] `ruleEvaluate` settles exact
> rational arithmetic; it cannot rule "the graph is increasing here", and a
> task that asked it and then graded by keyword would be the proxy failure
> `tasks.ts` warns about dressed as a feature.

So the question for any candidate concept is not "is this worth teaching"
but "can an answer to it be settled exactly". Of the five task kinds, three
can:

| Kind | Verifiable | Settled by |
|---|---|---|
| `transform_to_form` | yes | the CAS worker (equivalence) |
| `evaluate` | yes | **locally**, exact rational arithmetic |
| `counterexample` | yes | substitution |
| `state` | no | — |
| `justify` | no | — |

The `evaluate` / `transform_to_form` split is a live operational concern,
not a technicality. `tasks.ts` already records what happened the last time
it was ignored: `rational-expressions` was authored almost entirely as
`transform_to_form`, `factoring-quadratics` and `polynomial-division` are
gated *solely* behind `polynomial-arithmetic`, and so whenever the maths
worker is unreachable a learner who picked that subject meets a wall at its
first concept with nothing behind it reachable by doing problems.

**Any new subject must carry enough `evaluate` tasks to be walkable with
the worker down.** That is a constraint on authoring, not a nice-to-have.

### The hazard in authoring over a mapped node

Both candidates below already exist as mapped nodes, and `atlasProblems`
rejects an authored concept colliding with one. So authoring means *moving*
the node, and `atlas-structures.ts` records what that costs in a comment
written after it went wrong:

> Removing a node removes every edge declared on its OWN `needs`, and that
> is the whole reason this block exists. It was learned the hard way one
> subject ago: authoring `function-concept` silently deleted
> `variables-and-expressions → function-concept` and made that syllabus a
> root of the entire map, practisable from a cold account by somebody who
> had never met a letter standing for a number.

The procedure is therefore fixed, and it is three steps rather than one:

1. delete the mapped node from its area;
2. add the authored concept, with knowledge points and tasks;
3. **restate every incoming edge** — each `needs` entry on *other* nodes
   that named the departing node — in the area's `links`.

Step 3 is the one that gets forgotten, and the symptom is not an error. It
is a syllabus quietly becoming a root of the map.

For `fraction-arithmetic` specifically there are **five** incoming edges to
restate, and one of them changes the whole analysis — see the next section.
The five: `combining-rational`, `decimal-representation`, `ratio-and-rate`,
`roots-and-irrationals`, `sample-spaces`.

## Map 3 — the narratives map. Cheap, but bounded by Map 2.

A journey is a destination plus prose; the steps are derived
(`claimableChainFor` ordered by `teachingOrder`). Authoring one is twenty
lines and no new mechanism.

The bound is that **a journey must end on a teachable concept** —
`journeyProblems` rejects anything else, because a destination with no
knowledge points is a goal nobody can reach. So the narratives map cannot
outgrow the practice map, and there are 34 teachable concepts of which 6 are
currently used as destinations.

That leaves real headroom without touching anything else. Unused
destinations that carry a genuine arc:

| Destination | Teachable chain | The arc |
|---|---|---|
| `polynomial-roots` | 11 | the factor theorem as a search strategy rather than a fact |
| `partial-fractions-quadratic` | 13 | the case the first partial-fractions method cannot do |
| `rational-exponents` | 6 | why `x^(1/2)` has to mean a root if the rules are to survive |
| `matrix-multiplication` | 12 | a product that does not commute, and what that costs |
| `function-composition` | 7 | two rules in sequence, and where the domain goes |
| `simplifying-rational` | 8 | cancelling, and the domain you lose when you do |

**Verdict: extend freely, up to six more.** This is the best value per hour
of the three and needs no decision from anybody.

## The decision this document cannot make

Both practice-map candidates sit **beneath** material that is already
authored, and that direction is not symmetric with authoring above it.

`ontology-functions.ts` was authored above the algebra and could assert the
safe version of the consequence: it created ~170 new gates, but *"NO CONCEPT
ANYBODY CAN PRACTISE GAINED A GATE"* — everything that acquired one was
mapped-only with no task to serve, so no learner's session changed.

Authoring beneath does the opposite. `ontology-arithmetic.ts` is the
precedent: it *tightened* the gate, the entry point moved down, and
`polynomial-arithmetic` stopped being introducible on a cold account.

And for `fraction-arithmetic` the usual middle course **is not available**,
which is the single most important finding in this document.

`combining-rational` — a teachable concept in `rational-expressions`, and a
step on the existing "Break a hard fraction into easy ones" journey —
*already* declares `needs: ['fraction-arithmetic', …]`. The edge is in the
atlas today. It does nothing only because `fraction-arithmetic` is
mapped-only, so `gatingPrerequisitesOf` looks straight through it to
whatever is teachable beyond.

**The instant that concept acquires a single knowledge point, it gates
`combining-rational`.** No new edge, no decision point, no opt-out. The
author does not get to add the material now and the gate later, because the
gate is already written and is being held open solely by the absence of the
material.

So the sequencing I would have recommended — concept first, edge second as
its own reversible act — is not on the table here. The options are:

1. **Author it and accept the gate.** Anyone part-way through rational
   expressions finds `combining-rational` gated behind fractions they have
   not practised. Pedagogically right; a real interruption for anyone
   mid-subject.
2. **Author it and remove `combining-rational`'s `needs` entry first**, so
   the gate arrives as a separate later change. This is the sequencing above,
   recovered — but it means *deleting a true prerequisite edge* for the
   duration, and an atlas that briefly asserts something false about the
   subject is a worse artifact than a gate that briefly inconveniences
   somebody.
3. **Leave it mapped.** Which is the status quo and is at least honest: the
   route is drawn, nothing is written, and every surface says so.

I would take (1), because the gate is correct and the atlas should not be
made to lie to soften a transition. But it is a decision with a visible cost
for current learners, and it is not an authoring detail to be absorbed into
a content commit.

`linear-equations` should be checked for the same property before anyone
starts on it. It is in a different position — nothing teachable declares a
need on it — so there the concept-then-edge sequencing probably *is*
available.

## The two gaps worth closing first

Chosen because each is a hole a reader would notice, and each is exactly
rulable rather than merely desirable.

**`fraction-arithmetic`** (currently mapped in `number-and-arithmetic`).
`arithmetic-foundations` has place value, whole-number arithmetic, order of
operations, negative numbers and divisibility — and no fractions at all,
while `rational-expressions` sits above it. Exactly rulable: exact rational
arithmetic is precisely what `exactValue` does, so this can be authored
mostly as `evaluate` tasks and is therefore walkable with the worker down —
which also partly answers the all-`transform_to_form` problem recorded
above. Carries the unavoidable gate described above.

> **In flight as of writing.** The edit workspace
> `edit-workspaces/bza/agent-librarian-scope` contains an unfinished
> authoring of this concept — `ontology-arithmetic.ts`, `tasks.ts` and
> `atlas-foundations.ts` all modified, 35 teachable instead of 34 — which
> currently fails two pre-existing atlas invariants: *"and they carry their
> own subject, not the area they left"* and *"combining rational expressions
> reaches arithmetic through the fractions link"*. The first is step 3 of the
> move procedure above (the authored concept must carry
> `subjectId: 'arithmetic-foundations'`, not the area it departed). The
> second is the gate this document is about, arriving as predicted.
>
> None of it is committed and none of it is in the database, so the published
> atlas and production are unaffected — the checkout measures 291/34 with
> 163/163 passing. Whoever picks this up should treat the workspace copy as a
> draft to finish, not as a regression to revert.

**`linear-equations`** (currently mapped in `algebra-foundations`). You can
reach the quadratic formula without ever having solved `ax + b = c`. Needs a
check I have not done: whether a "solve for x" answer has a `NamedForm` the
verifier can check, or whether it has to be posed as an `evaluate` on the
root. **That check gates the estimate** — if there is no form for a
solution, this concept is a larger job than it looks.

## What I would not do

- **Bulk-author mapped nodes to make the atlas look fuller.** 257 nodes
  already outrun the 34 practisable ones by 7:1, and every honest surface in
  the app has to say so — `atlasCoverage` prints it, the Concepts tab prints
  it, and each journey row prints how much of its own route is unwritten.
  Widening that ratio makes every one of those sentences worse.
- **Author a concept whose tasks cannot be settled exactly.** The place that
  tempts is reading a graph, and `ontology-functions.ts` already declined it
  for the right reason.
- **Add the gating edges in the same change as the concepts.** See above.
  Two acts, two decisions, and the second one is reversible on its own.
