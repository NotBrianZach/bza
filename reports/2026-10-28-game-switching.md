# Switching games mid-session

**Date:** 2026-10-28
**Status:** built 2026-10-29. `docs/CORRELATION_GAMES.md` §19 covers tiers 1–2
and the UI; §20 covers tier 3, which this document left withheld. Two places the
analysis below is superseded:

- the tier table contradicts this document's own seeding rule — `construction`
  is empty-seeded, so switching into it is tier 2, not tier 3;
- "tier 3 … each needs a decision about the destination's standing premise" has
  an answer now (derive it from the carried scene), and the pair turns out to be
  asymmetric: `transformation → duel` needed no new mechanism at all.

The analysis is otherwise unchanged from the design pass.
**Code read:** `frontend/lib/correlate/{games,tuning,graph,prompt}.ts`,
`frontend/app/api/correlate/turn/route.ts`,
`supabase/setup/00_baseline_bza_public.sql`
**Summarised in:** `docs/CORRELATION_GAMES.md` §18

Asked for directly: *"it could be cool if during a game of tag you could
switch to embodiment or something… probably we would want to think through
all the game types and identify which ones are compatible first and how the
transitions would work."*

This is that analysis. The engine is closer to supporting it than it looks —
one turn loop, modes as pure data, and a world that is already a property of
the branch rather than the session — but there is one schema fact that blocks
it outright, and one compatibility axis that decides almost every pair.

## Mechanically, a game is eight fields

From `GAMES` in `lib/correlate/games.ts`, what actually varies:

| Field | What a switch changes |
|---|---|
| `media` | all eleven are `'all'` — never a source of incompatibility |
| `relations` | the legal relation set; narrow in eight of eleven |
| `judge` | `'narrator'` or `'player'` — *who rules* |
| `declaredRelation` | `never` / `optional` / `required` — what the composer demands |
| `enforcesConstraint` | whether a move can be turned away at all |
| `persona` + `pieces` + `replyRule` | prompt text; pure substitution |
| `worldKeys` + `seedWorld` | the shape of the world, and what it starts as |
| `openingPrompt` | only read on turn 1 |

Five of these are free. `media` never conflicts. The prompt text is
substitution. `openingPrompt` is irrelevant mid-chain. The three that
carry real weight are the relation set, the legality gate, and the world.

## The blocker: a turn does not record its game

`listen_sessions.mode` is `NOT NULL` and session-level. `listen_turns` has
**no `mode` column**. So switching the session's mode today would
retroactively relabel every turn already played: a chain of Tag moves
would render, and be read back by the interpreter, as though it had always
been Embodiment. The record of what you actually played would be gone.

The fix has an exact precedent one column over. `listen_turns.tuning` is
already per-turn jsonb, for precisely this reason — the tuning as of that
turn is a property of the turn, not of the session. `mode` wants the same
treatment:

```sql
alter table bza_public.listen_turns add column mode text;
```

Nullable, because every existing row was played under its session's mode
and backfilling is a lie about rows nobody switched. `null` reads as "the
session's mode", which is true for all 100% of current data.

**Nothing else can be designed until this exists.** Every model below
assumes a turn knows its own game.

## The promise this tensions with

`tuning.ts` states it plainly: *"`rules` already promises a game does not
change shape underneath the person playing it."* That is why
`startingTuning` is applied at creation only and never as a fallback for a
stored `{}` — an old session reads as unweighted because it genuinely was.

Mid-game switching looks like a direct violation. It is not, and the
distinction is worth being precise about: the promise is against the shape
changing **underneath** the player. A switch the player makes, declares,
and sees recorded in the chain is not the game changing under them — it is
a move. The promise is about silence, not about immutability.

This is also the second reason per-turn `mode` is not optional. Without
it, a switch *is* a silent retroactive change, and the promise really is
broken. With it, the chain carries its own history of what it was.

## The axis that predicts almost every pair

Reading `seedWorld` across all eleven splits them in two, and this
single distinction decides more than the other axes combined:

**Empty-seeded** — the world starts as blank collections, and the content
arrives from play:

- `tag` — `{chain: [], facts: []}`
- `chain` — `{chain: [], mediaVisited: [], facts: []}`
- `translation` — `{quality: null, crossings: [], intact: []}`
- `counterpoint` — `{subject: null, perspectives: [], excluded: []}`
- `embodiment` — `{learned: [], sensations: []}`
- `construction` — `{placeName: null, districts: [], hours: [], rules: []}`
- `prediction` — `{record: {hits: 0, misses: 0}, tendencies: []}`

**Premise-seeded** — the world ships with authored content the game is
*about*:

- `duel` — a woman returning to an apartment she left four years ago
- `transformation` — a bus shelter on a ring road, plus a standing
  invariant (`'There is still one man waiting.'`)
- `investigation` — a rented car found in long-stay parking, plus two
  open questions
- `navigation` — `here: 'Nowhere yet. A door with no building attached.'`

Switching **into an empty-seeded game is clean**: the world is supposed to
start empty, so a switch that starts it empty is not a degraded version of
anything. The last offering on the table supplies the content the way a
first move normally would.

Switching **into a premise-seeded game is incoherent**, and both available
options are bad. Inject the canned premise and an apartment in 2022
arrives from nowhere, mid-chain, contradicting whatever you were just
playing. Drop it and you have removed the thing the game is *for* —
Duel without a scene to score is not Duel.

So: **Tag → Embodiment, the example that prompted this, is in the clean
class.** Tag → Duel is in the broken one.

## World-shape families

Within the empty-seeded set, a second question is whether anything should
*carry*. Grouping by `worldKeys`:

| Family | Games | Keys |
|---|---|---|
| Chain-is-the-world | `tag`, `chain` | `chain`, `mediaVisited` |
| Carried quality | `translation` | `quality`, `crossings`, `intact` |
| Subject + perspectives | `counterpoint` | `subject`, `perspectives`, `excluded` |
| Body | `embodiment` | `learned`, `sensations` |
| Mutating scene | `duel`, `transformation` | `scene`, + `score` / `ledger`+`invariants` |
| Place | `navigation`, `construction` | `here`/`atlas`/`route`, `placeName`/`districts`/`hours`/`rules` |
| Case | `investigation` | `case`, `people`, `openQuestions`, `inDoubt` |
| Record of reasoning | `prediction` | `record`, `tendencies` |

`tag` ↔ `chain` is the only pair whose world carries **verbatim** — same
`chain` key, and `mediaVisited` is derivable from it. The two differ in
exactly one field (`declaredRelation`: `never` vs `required`), which makes
them the natural first implementation and a poor test of the general case.

`duel` ↔ `transformation` share `scene` and could carry it, but both are
premise-seeded, so the pair is only reachable *between* two already-running
games — not as an entry from a chain game.

## Two hazards that only show up in the code

**The spent-relation dead end.** `buildUserPrompt` emits `RELATIONS JUST
SPENT … A reply may not reuse these. Pick another.` `translation`'s
relation set is exactly `['translation']` — one element. So switching into
Translation on a turn whose parent used the `translation` relation leaves
the new game with zero legal relations, and the prompt simultaneously
demands a relation and forbids the only one available.

This generalises: any switch into a narrow-relation game can empty the
set. The honest rule is that **spent relations clear on a switch**, because
"do not reuse the connection you just used" is a rule belonging to a game
you have stopped playing. Worth stating in the prompt rather than silently
dropping, so the interpreter knows the constraint was lifted deliberately.

**Seed replay.** `worldFor(seed, sessionWorld, graph, path)` calls
`worldAlong(seed, path)` when every legal turn on the path has a
`world_delta` — it *replays* deltas from the game's seed rather than
trusting stored state. After a switch, replaying old deltas onto a new
game's seed produces a world that is neither game's: Embodiment's
`{learned, sensations}` seed with Tag's `chain` deltas applied over it.

This is the strongest argument for the branch model below. Replay has to
start at the switch, not at turn 1, which means the switch needs to be a
boundary the replay can see.

## Three transition models

**(a) Hard switch.** `session.mode` changes; the world re-seeds; the old
world is archived. Simplest, and wrong for the reason just given — the
path still runs back through turns played under the old game, so replay
either breaks or has to special-case the boundary anyway.

**(b) Branch-as-switch — recommended.** The graph already supports
branching (`parent_turn_id`, `hasBranches`, `pathTo`), and the design
already holds that *the world is a property of the branch, not the
session*. A switch becomes a new branch off the current turn, carrying a
new `mode`. Everything needed is already built:

- replay naturally starts at the branch point, because `pathTo` is what
  `worldFor` walks
- the old game's branch survives intact and playable — you can go back
- "two games in one session" stops being a special case and becomes the
  thing branches already are
- `session.mode` can stay as the session's *original* game, which keeps
  every existing read correct

**(c) Per-pair carry-over mapping.** Declaring, for each ordered pair,
what moves across — `investigation.case` → `counterpoint.subject`, and so
on. Eleven games is 110 ordered pairs; the premise-seeded analysis kills
most of them, and the survivors mostly carry nothing but the last
offering. Not worth building as a mapping. The one real carry
(`tag` ↔ `chain`) can be special-cased in a line.

Recommendation: **(b), with no carry beyond the offering on the table.**
The last offering is the new game's opening move. That is already how every
game starts, so it needs no new concept.

## Compatibility tiers

Derived from the three sections above — the seeding split, the world-shape
families, and the two hazards — not hand-assigned:

**Tier 1 — carries verbatim.** `tag` ↔ `chain`. Same world shape, one
field differs. The only switch where the chain genuinely continues rather
than restarting.

**Tier 2 — clean handoff, fresh world.** From `tag`/`chain`/`counterpoint`/
`translation`/`embodiment`/`prediction` into any *empty-seeded* game. The
last offering becomes the opening move; the new world starts as it was
designed to. This is the tier the request lives in, and the tier worth
building.

**Tier 3 — defensible but lossy.** `navigation` ↔ `construction` (both
place-shaped, partial key overlap); `duel` ↔ `transformation` (both
`scene`-shaped). Reachable only between running games, and each needs a
decision about the destination's standing premise.

**Tier 4 — do not offer.** Any switch *into* a premise-seeded game
(`duel`, `transformation`, `investigation`, `navigation`) from a chain
game. There is no honest answer to where the premise comes from.

Note what this implies: `prediction` is `relations: 'all'`,
`judge: 'player'`, empty-seeded, and its only distinguishing behaviour is
`wantsPrediction(game)` returning true for its id. It reads less like an
eleventh game than like a **modifier** that could apply to any of the
others — which, if true, means it does not want to be a switch target at
all. Flagged, not resolved.

## Phasing

1. **`listen_turns.mode`**, nullable, plus reading it per-turn wherever a
   turn is rendered or sent to the interpreter. Nothing user-visible.
   Blocks everything else.
2. **Tier 1 only** (`tag` ↔ `chain`). Proves the mechanism against the one
   pair with no world question, and `declaredRelation` flipping mid-chain
   is a real composer-level test.
3. **Tier 2**, which is the actual feature, including Tag → Embodiment.
   Needs the spent-relation clearing rule and the branch-boundary replay.
4. **Tier 3** if wanted, pair by pair, each with an explicit premise
   decision.

## What this does not resolve

- **Does a switch cost a turn?** Branch-as-switch implies the switch
  *is* a turn — you play a move under the new game. The alternative is a
  zero-turn boundary, which the graph has no representation for.
- **Does the interpreter see the old game's turns?** The path crosses the
  boundary, so it either reads Tag turns while playing Embodiment, or the
  history is truncated at the switch. Truncation loses the continuity that
  makes switching interesting; not truncating means the prompt has to say
  which turns were a different game. Leaning toward the latter, since
  per-turn `mode` makes it sayable.
- **`judge` flipping.** `tag`/`chain` are narrator-judged;
  `counterpoint`/`duel`/`prediction` are player-judged. Switching across
  that line changes who rules mid-session, and whether that needs
  surfacing in the UI is unexamined.
- **Interaction with `gatesLegality`.** Switching from `tag`
  (`enforcesConstraint: true`) to `embodiment` (false) removes the legality
  gate, which the Friction axis also now controls. Two independent reasons
  a move cannot be turned away, and no thought yet given to how the panel
  explains that.

Verified against the registry and schema as of 2026-10-28: eleven games,
`enforcesConstraint: true` on `tag` and `chain` only, `media: 'all'`
everywhere, no `mode` column on `listen_turns`.
