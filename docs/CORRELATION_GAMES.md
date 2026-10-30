# Correlation Games

The design for generalising `/listen` (AI Listen Along, music only) into a
section where a turn can be a painting, a scene, a gesture, a stretch, or a
passage from a book you are reading — and where **a change of medium can itself be
a move**.

Status: design. Supersedes the single-medium assumption in
`lib/listen/types.ts`, not the engine architecture, which already anticipated
this (one turn loop, modes as pure data).

---

## 1. What changes and what does not

What the music section got right and this keeps:

- **One engine, modes as data.** `ListenAlongGame.tsx` and the turn route never
  branch on mode id. Adding a kind of game is a data edit. That property is what
  makes a seven-relation × eight-medium space tractable at all.
- **The reply must be real.** The interpreter returns a *query*; the server
  resolves it against a catalogue and records a miss if nothing matches. The
  model never asserts a thing exists.
- **No metadata-derived rules.** A shared release year is a coincidence of
  filing, not something you can hear. Generalises directly: a shared accession
  decade is not something you can see.

What changes: the atomic unit stops being a track.

---

## 2. The unit: an Offering

```
Offering = (content or action, medium, framing)
```

The **framing** is the load-bearing new field. Without it two players respond to
different things without noticing: you meant the composition of the painting,
they answered its subject. Framing says which part is in play — the whole
canvas, ten seconds of a scene, one gesture, the sensation of a stretch.

```ts
interface Offering {
  medium: MediumId
  /** Stable id within its medium. Catalogue id, or a content hash for composed. */
  id: string
  title: string
  /** Author, artist, choreographer, director — whoever made it. Null if composed. */
  attribution: string | null
  /** What part of it is in play. Required. Never defaulted to "all of it". */
  framing: string
  /** Where it can be perceived: audio preview, image, video, or nothing. */
  perceptible: { kind: 'audio' | 'image' | 'text' | 'none'; url?: string; body?: string }
  /** Link out to the source record. */
  sourceUrl: string | null
  /** Provenance, so a turn can be audited. */
  origin: 'catalogue' | 'composed' | 'library'
  /** Free-form per-medium extras (genre, year, date_display, reps, hold time…). */
  meta: Record<string, string | number | null>
}
```

`TrackRef` becomes one projection of this, and existing rows migrate by wrapping:
`{medium:'music', id, title:name, attribution:artist, framing:'the whole track',
perceptible:{kind:'audio',url:previewUrl}, origin:'catalogue', meta:{...}}`.

---

## 3. Two registries, not one

The seven kinds in the proposal are a **relation** taxonomy, not a mode
taxonomy. Keeping them separate from media is what lets "the medium change is
the move" be expressible rather than accidental.

### 3a. Media

| Medium | Kind | Provider | Perceptible as |
|---|---|---|---|
| `music` | catalogued | iTunes Search (shipped) | 30s audio |
| `artwork` | catalogued | Art Institute of Chicago — **keyless, verified** | IIIF image |
| `passage` | library | **the reader's own books** | text |
| `scene` | catalogued | TMDB (needs a free key) — resolves the *film*, the moment is framed in words | text + poster |
| `gesture` | composed | — | text |
| `stretch` | composed | — | text |
| `exercise` | composed | — | text |
| `movement` | composed | — | text |

Two classes, and the distinction has to be first-class because the honesty
invariant differs:

- **Catalogued** — resolves to a real external record. A miss is possible. This
  is today's rule, unchanged.
- **Composed** — authored on the spot. Nothing to resolve, so "the search found
  it" cannot be the guard. The guard becomes **performability**: a composed
  offering must be specific enough that a second person could actually do it,
  and it must state its framing. Vague mush is the composed-medium analogue of
  an invented track, and it gets rejected the same way.
- **Library** — resolves against the player's own highlights and pages. No
  network, no provider, and the one medium that ties this section to the rest of
  the product.

### 3b. Relations

Straight from the proposal, as data:

| Relation | What a reply does |
|---|---|
| `association` | Follows any explainable connection |
| `translation` | Expresses something similar through another medium |
| `transformation` | Preserves one quality, changes another |
| `counterpoint` | Offers a different perspective on the same subject |
| `embodiment` | Turns an interpretation into an action |
| `continuation` | Shows what could happen next |
| `reinterpretation` | Makes an earlier item newly intelligible |

Each carries a `requiresMediumChange: boolean` (`translation` and `embodiment`
do; `association` does not) and a `demandsExplanation` prompt fragment.

### 3c. Games compose them

A game declares: which media are in play, which relations are legal, who
judges, what persists, and whether the player must *declare* their relation.

```ts
interface CorrelationGame {
  id: string
  name: string
  media: MediumId[] | 'all'
  relations: RelationId[] | 'all'
  judge: 'player' | 'narrator'
  /** Can the interpreter reject a move outright? (today's `enforcesConstraint`) */
  enforcesConstraint?: boolean
  /** Does the player claim the relation, or does the interpreter name it? */
  declaredRelation: 'required' | 'optional' | 'never'
  pieces: GamePieces   // the same six questions
  persona, replyRule, worldKeys, seedWorld, openingPrompt, accent
}
```

`declaredRelation` is a genuinely new axis and it changes play more than a
label does. `required` makes your reading a **claim you can be judged on**
(strict games). `never` makes it a **reading you receive** (story games).

---

## 4. Two choices per turn

The composer becomes: pick a medium → pick or compose an offering → state the
framing → optionally declare the relation. That second choice is where the
expressive weight is: answering a frantic song with a stretch says "what I hear
in this is a need for release," and nothing in a single-medium game can say that.

Mechanically this simplifies one thing. Today `tag` asks the model to remember
to append to `world_state.threadsUsed`, and the "don't reuse the last thread"
rule depends on the model's bookkeeping. With `relation` recorded as a column on
the turn, what is spent is **derived from turn rows**, not maintained by the
interpreter. One less thing a model can forget.

---

## 5. Shown vs invited

Physical offerings need one flag, and it is not a preference:

```ts
intent: 'shown' | 'invited'
```

`shown` describes or depicts an action. `invited` asks someone to perform it.
Plus one hard rule, enforced in the engine rather than left to each game: **a
reply may always be made in any enabled medium.** Participation never depends on
matching someone's mobility, equipment, space, or skill. This is also exactly
what makes translation and embodiment possible, so the accessibility rule and
the game design point the same way.

---

## 6. Turn shape

```ts
interface CorrelationTurn {
  turn_index: number
  move: Offering
  reply: Offering | null
  reply_query: string | null
  /** Which relation the reply used. Declared by the player or named by the
   *  interpreter, per the game's declaredRelation. */
  relation: RelationId | null
  /** What the player claimed, when they declared it — kept alongside the
   *  interpreter's ruling so a disagreement is legible. */
  claimed_relation: RelationId | null
  reading: string
  narration: string
  /** What carried across the change of representation, and what did not. This
   *  is the philosophically interesting field and the one worth surfacing. */
  carried: string | null
  lost: string | null
  facts: string[]
  legal: boolean
}
```

`carried` / `lost` are new and they are the point: players are exploring what
survives a change of representation. Rhythm becoming repetition in an image,
dissonance becoming conflict in a scene. The connection is rarely exact, so
naming what crossed and what was dropped is part of the game rather than
commentary on it.

---

## 7. Front page

Add `'games'` to `SectionId` in `app/page.tsx`, default-visible, placed after
`revisit` and before `feeds`. It joins the existing show/hide/reorder machinery
for free (`LAYOUT_KEY`, `moveSectionDir`) and `getHomeLayout()` already tolerates
an unknown-to-stored-config id by falling back to the default entry — so no
migration of anyone's saved layout is needed.

The section is a horizontal strip, matching how `revisit` presents: in-progress
games first, then three or four "start a game" cards. The full picker stays on
the section page, which is what it is for.

Remove the desktop header pill (this *is* the move off the header). Keep the
mobile hamburger entry, since a strip mid-page is easier to miss on a phone.

---

## 8. Naming

Recommendation: **AI Play Along** at `/play`, with "correlation games" as the
descriptive subtitle. It keeps the `___ Along` family the product name
establishes, covers every medium, and does not require anyone to already know
what a correlation game is. `/listen` becomes a redirect — sessions deep-link
via `?game=<uuid>`, so the redirect must preserve the query string.

Keep the DB table names `listen_sessions` / `listen_turns`. Renaming them costs
a migration plus four RLS policies and buys nothing a reader of the code sees.

---

## 9. Migration

`supabase/setup/52_correlation_games.sql`, additive:

```sql
alter table public.listen_turns
  add column if not exists move_offering     jsonb,
  add column if not exists reply_offering    jsonb,
  add column if not exists relation          text,
  add column if not exists claimed_relation  text,
  add column if not exists carried           text,
  add column if not exists lost              text;

alter table public.listen_sessions
  add column if not exists media     jsonb not null default '[]'::jsonb,
  add column if not exists relations jsonb not null default '[]'::jsonb;

-- Backfill: every existing move/reply is a music offering.
update public.listen_turns set move_offering = jsonb_build_object(...) where move_offering is null;
```

`links jsonb` on `listen_turns` is dead — the metadata link checks were deleted
in E24657DD and nothing writes it. Drop it here.

---

## 10. File plan

| File | Action |
|---|---|
| `lib/correlate/types.ts` | new — Offering, CorrelationGame, CorrelationTurn, Interpretation |
| `lib/correlate/media.ts` | new — medium registry |
| `lib/correlate/relations.ts` | new — the seven relations as data |
| `lib/correlate/games.ts` | new — game registry, rebuilt from `lib/listen/modes.ts` |
| `lib/correlate/prompt.ts` | from `lib/listen/prompt.ts` — medium- and relation-aware |
| `lib/offerings/music.ts` | from `lib/music/itunes.ts` — returns Offering |
| `lib/offerings/artwork.ts` | new — AIC search + IIIF |
| `lib/offerings/passage.ts` | new — the reader's own books |
| `lib/offerings/composed.ts` | new — vocabularies + performability check |
| `lib/offerings/index.ts` | new — `searchOfferings` / `resolveOffering` dispatch |
| `app/api/offerings/search/route.ts` | new — replaces `api/music/search` |
| `app/api/correlate/turn/route.ts` | from `api/listen/turn/route.ts` |
| `components/correlate/*` | OfferingCard, OfferingPicker, MediumTabs, GamePicker, CorrelationGame |
| `app/play/page.tsx` | from `app/listen/page.tsx` |
| `app/listen/page.tsx` | redirect, preserving `?game=` |
| `app/page.tsx` | `'games'` section; drop the desktop header pill |
| `tests/correlate-logic.mjs` | from `tests/listen-logic.mjs`, extended |

---

## 11. Verified provider facts

Probed 2026-09-29, not taken from docs:

- **Art Institute of Chicago** `api.artic.edu/api/v1/artworks/search` — keyless,
  133k hits for "rain", returns `image_id`, `is_public_domain`, `date_display`,
  `artist_title` in one call. No N+1.
- The IIIF image host `www.artic.edu/iiif/2/{image_id}/full/{w},/0/default.jpg`
  returns **403 without a `User-Agent` header** and 200 with one. This is the
  kind of thing that looks like a broken integration; set the UA in the fetch.
- **Met Museum** `collectionapi.metmuseum.org` search is keyless but returns bare
  objectIDs, so rendering a result list costs one request per object. Usable as a
  fallback, not as the primary.
- **wger** `/api/v2/exercise/search/` 404s on the documented path. Moot —
  exercises are better as a composed medium anyway: the interesting content is
  the described movement, not a database row.
- **TMDB** needs a free API key. The only medium here that is blocked on a
  credential.

---

## 12. As built (2026-09-29, commit `8F1F8962`)

Shipped on the recommendations above. Differences from the plan in §10,
so this document does not misdescribe the code:

- `lib/offerings/shared.ts` was added — `OfferingError`, a TTL cache, and
  an identified `getJson`. Every catalogued provider had the same three
  problems (shared per-IP rate limit, lying content-types, needing a
  User-Agent), so they are solved once.
- `app/api/offerings/media/route.ts` was added. The client cannot see
  whether `TMDB_API_KEY` exists, so the server tells it which media are
  real and `createSession` snapshots the intersection into
  `listen_sessions.media`.
- `lib/music/itunes.ts` was **deleted**, not adapted — its logic moved
  into `lib/offerings/music.ts` returning Offerings.
  `lib/music/youtube.ts` stayed as-is (it never imported a track type,
  only artist and title strings), and so did
  `app/api/music/youtube/route.ts`.
- `app/api/music/search/route.ts` was deleted in favour of
  `app/api/offerings/search/route.ts`.
- `lib/correlate/types.ts` gained `ReplyPlan`. A reply is a plan before it
  is an Offering, and a composed plan and a catalogued query are different
  enough that one `replyQuery` string could not carry both.
- `steps: string[]` sits on `Offering` rather than in `meta`, because
  performability depends on it and `meta` is the bag for things nothing
  branches on.
- Composed media ship with vocabularies (three entries each) as starting
  points. Not a closed list — a test asserts every entry itself passes
  performability, which is the only claim being made about them.
- `Prediction` does **not** get `relations: 'all'`. It is music-only, and
  translation and embodiment require a change of medium, so those two
  would have been unplayable relations sitting on the board. The
  registry-consistency test in `tests/correlate-logic.mjs` caught this
  while it was being written; that check is now permanent.
- `scene` ships wired and gated rather than deferred. With no
  `TMDB_API_KEY` the medium is simply absent from every picker.

Not built: nothing from §1–§11 was dropped.

Verified: `npm run test:correlate` 126/126 · `tsc --noEmit` adds no new
errors (9 pre-existing, all unrelated) · `next build` compiles, `/play`
at 15.8 kB, `/listen` a dynamic redirect.

One ordering hazard worth repeating: migration 51 drops `NOT NULL` on
`listen_turns.move_track`, and the new turn route does not write that
column. The migration has to land before the code does.

---

## 13. Second pass (2026-09-29): the games themselves

Three things about the games were wrong, and §12 shipped all three.

**The two-tier picker was a quarantine, not a design.** §3c kept eight
games pinned to `media: ['music']` on the theory that their interpreters
had been written for sound. Reading them again, most had not been: a
clue, a key, a building material and an instruction are medium-agnostic
ideas, and a case file that yields "a record found on a device" yields "a
page left open" just as readily. The split was doing two bad things at
once — implying the older games were a lesser tier, and making a reader
scroll past a *Music only* heading to discover that they were not. Every
game is now `media: 'all'`, and the picker is one list.

**"The dial" was furniture from a deleted game.** It began as Night
Radio's transmitter and leaked into Duel (`score: {player, dial}`),
Prediction (`You are the dial`) and the turn spinner. It personified the
interpreter as a *thing that turns*, which is exactly wrong for a section
where the interpreter is a referee, an opponent, a case file, or a place.
Gone everywhere. `tests/correlate-logic.mjs` now asserts no game's
player-visible copy mentions a dial, so it cannot creep back in.

**Night Radio is retired.** It was the one game that genuinely required
sound — a radio operator listening to a signal — and it was the source of
the dial. `RETIRED_GAMES` keeps its display name so a player opening an
old session is told the game was retired, with its turn count intact,
rather than shown a lookup failure. Deliberately *not* rehomed into
another game: silently changing the rules of a chain somebody actually
played is worse than ending it.

**Order.** Tag is first, in the picker and on the front-page strip.
Its rules fit in one sentence and every other game is a variation on the
exchange it establishes. Correlation Chain is second because it is Tag
plus exactly one rule — you must declare your relation, which turns your
reading into a claim that can be wrong. That pair is the clearest
illustration of the `declaredRelation` axis in the whole registry, so
they sit next to each other.

Eleven games, in reading order: Tag, Correlation Chain, Translation,
Counterpoint, Embodiment, Duel, Transformation, Investigation,
Navigation, Construction, Prediction. Pure exchanges first, then the ones
that build a world, because those ask you to hold more.

Two smaller consequences:

- `FEATURED_GAME_IDS` is explicit data rather than `GAME_LIST.slice(0, 4)`,
  so reordering the picker cannot silently change what the home page
  promotes.
- Prediction can have `relations: 'all'` again. It was narrowed in §12
  only because it was music-only, which made translation and embodiment
  unplayable there; now that it is cross-medium the restriction is
  unnecessary. Its `declaredRelation` is `optional`, not `required` — the
  turn already asks for a free-text prediction, and asking for a declared
  relation on top of that makes one move two forms long.

Verified: 135 checks, 0 failed · `tsc --noEmit` 9 pre-existing errors,
none in new code · `next build` compiles.

---

## 14. Third pass (2026-10-01): a graph, and an adjustable partner

Two requests, and they turn out to be the same request twice: *the games
should be more adjustable.* One about the shape of a game, one about the
character of the partner playing it.

### 14a. The chain becomes a conversation graph

The chain was an unexamined default rather than a rule anyone chose. Its
cost is specific: a move you regret is permanent, a reply you loved can
only be followed one way, and the shape of a long game is a line through
a space you were actually exploring.

So `listen_turns` gains **`parent_turn_id`** — what this turn answers —
and several turns may name the same one. Everything that used to mean
"the last turn" now means "the parent", and everything that used to mean
"the session" now means "this branch":

| Was | Is |
|---|---|
| the last legal turn's reply is on the table | the **parent's** reply is on the table |
| the last 8 turns are the history | the **path** root→parent is the history |
| `spentRelations` over the session | `spentRelations` along the **path** |
| nothing already in play in the session | nothing on the path, **and nothing a sibling already answered with** |
| `world_state` on the session | the world **folded from the deltas along the path** |

The last two rows are the ones that carry design, not bookkeeping.

**Siblings are excluded from a reply.** Going back to a turn and
answering it a second time is the whole feature; if both branches came
back with the same record it would be a re-render, not a branch.

**The world is a property of a path.** A session-wide world is coherent
only while the game is a line — the moment two branches both establish
something about the same place, one of them is reading the other's world
and neither is wrong. So each turn records its own `world_delta` and the
world anywhere is `mergeWorld` folded along the path. `mergeWorld` lives
in `graph.ts` and is used by *both* the per-turn write and the per-path
fold, because if those ever disagreed, reopening a game would show a
different world than playing it did.

Sessions written before this have no deltas to fold. They are lines, and
a line has exactly one world, so `worldFor()` uses the session row for
them — and folds, lossily and knowingly, the moment someone branches one.
There is no branch-correct answer available from a single stored world,
and handing both branches the same one would be worse than starting the
new branch from less.

**`turn_index` stops being a position and becomes a name.** Turn 7 may
answer turn 3. It is kept as the handle the interpreter points at.

### 14b. The AI can point at an earlier turn

A second, non-structural edge: **`link_turn_id` + `link_note`**. The
interpreter may volunteer that this exchange rhymes with an earlier one —
the same quality surfacing again, something answered now that was left
open then. It changes nothing about what was answered; it is an
observation.

It is also the thing the graph makes possible and a chain could not: the
prompt asks for a turn **on another branch** by preference, because a
correlation the player cannot see from where they are standing is the one
worth volunteering.

Validated against the turns the interpreter was actually shown, for
exactly the reason a reply is searched rather than asserted: a link to
turn 12 of a nine-turn game is an invented record, and being cheap to
invent is why it has to be checked. A link with no note is dropped too —
"this rhymes with turn 3" with nothing said about how is not an
observation.

The interpreter is therefore shown two things, and the separation is
load-bearing: **THE PATH** (binding — what this branch established) and
**EXCHANGES ELSEWHERE** (available to point at, *not* to reason from, and
deliberately thinner so it cannot be mistaken for inherited context).

### 14c. The partner is weighted: `lib/correlate/tuning.ts`

> "maybe i want to explore music more but with an occasional stretch or
> art piece"

Media say what an offering can be made of; relations say what a reply can
do to one. Neither says anything about **proportion**, and the only way
to ask for mostly-music was previously to pick a music-only game — which
is the tier §13 deleted on purpose. So proportion becomes a weighting
rather than a game, which also makes it adjustable *mid-game*, which is
the better version anyway: what you want from a partner changes over
twenty turns.

A third registry, in the same style as the other two — declarative data,
prompt text derived from it, adding an axis is an edit there and nowhere
else.

**Medium weights**, four stops: `never · rarely · freely · mostly`.
Zero is **arithmetic, not a hint**: a muted medium is dropped from the
reply enum the interpreter is handed, removed from the retry and salvage
media, and refused by `normalizeReply` with its own rejection reason —
`muted-medium`, distinct from `unknown-medium` because the player did this
deliberately and reading it as a prompt bug would send someone hunting a
defect that is not there. Muting only stops the *partner* answering
there; the medium stays yours to play.

**Axes**, five stops each, resting in the middle: `nostalgia`
(the unencountered ↔ the remembered), `obliquity` (plainly ↔ obliquely),
`friction` (goes with you ↔ argues), `abstraction` (the thing itself ↔
the idea underneath). The neutral stop says **nothing** —
empty string — so an untouched tuning contributes no prompt and costs no
tokens, and a test asserts the prompt with a neutral tuning is byte-identical
to the prompt without one.

**Why `abstraction` is not more stops on `obliquity`.** They look like the
same axis and are not. Obliquity is *distance* — how many steps a reply may
stand from the move. Abstraction is *which layer the connection lives in* —
what both works depict, or what both works are doing. Four pairs exist, not
two: a painting of rain answered by a song about rain is concrete and close;
the same painting answered by a work sharing only its held breath is abstract
and close, the quality right there in one clause; a reply three removes away
through an object nobody else would spot is concrete and far. Fold either
axis into the other and two of the four stop being askable. It is also the
request players make first and previously could not phrase — "stop answering
the subject" is not mutable media, not distance, and not disagreement.

**The hazard, and it is two axes, failing in opposite directions.** "Lean
older" is one careless sentence away from "a shared decade is a connection",
which is exactly the metadata-derived reasoning this section removed. "Answer
the idea" is one careless sentence away from "a shared mood is a connection" —
the same collapse arriving from the far end, one admitting a fact nobody felt
and the other a feeling nobody can state. So the weighting block states that
it governs what you reach *for* and never what makes a connection hold,
repeats that a shared decade is a coincidence of filing, and the far abstract
stop says outright that an unnamed resemblance is vagueness rather than
abstraction and has to survive being said in plain words. Tests assert all
three sentences are present.

**Proportion cannot be instructed, so it is computed.** A model told
"mostly music, occasionally art" will answer in music every turn and never
notice, because each turn is locally correct. `dueMedium()` compares the
expected share from the weights against the actual replies along the
branch and names the medium owed a turn, once a whole reply is owed.
Advisory on purpose: a weaker art answer played to satisfy a ratio is
worse than a strong one anywhere else, and the prompt says so.

Canonical form stores only what differs from the default, so `{}` is
neutral, `isNeutral` is a key count, and dragging a control back where it
started leaves no trace.

The client sends the current tuning with the move *and* saves it
separately, so a knob moved a second before a turn applies to that turn —
reading it only from the session row would have made the save a race the
player can lose without being told. Each turn also snapshots the tuning it
was played under: a log that cannot say what the settings were cannot
explain why a turn went the way it did.

### 14d. What the board shows

The log shows **one path**, not the session. A player standing on turn 3
of a twenty-turn game is in a conversation that genuinely has three turns
in it, and showing the other seventeen underneath would be showing them
someone else's.

Everything off the path is one click away in `BranchMap` — a tree of text,
not a drawn graph, because what a player needs is to recognise a turn and
get back to it, and a canvas would make that a navigation problem instead
of a reading one. Each turn also carries *branch from here*, each focused
turn lists the answers that already follow from it, and a link renders as
*rhymes with turn N* that jumps.

### 14e. Migration ordering, again

`supabase/setup/53_conversation_graph.sql` adds five columns and
backfills `parent_turn_id` by linking each turn to the most recent
**legal** turn before it — legal matters, because a turned-away move left
nothing on the table, so the turn after it was answering what the rejected
move was answering, not the rejection.

It **must run before the code**. The turn route selects `parent_turn_id,
world_delta, link_turn_id, link_note` by name and PostgREST fails the whole
select on an unknown column, so without the migration every turn errors
rather than degrading. Same hazard as 52, same stance.

Verified: 291 checks, 0 failed (was 172) · `tsc --noEmit` 9 pre-existing
errors, none in new code · `next build` compiles.

### 14f. Four knowledge media, and the guard that did not transfer

> "would be nice to have a broader tag variety, like math theorems or
> science facts"

Eight media become twelve: **Mathematics** (`theorem`), **Science**
(`phenomenon`), **Life** (`organism`), **Places** (`place`).

**The design problem, which is the whole of this change.** A theorem is a
*proposition*. It is the first thing offered here that can be
**confidently wrong** rather than merely bad, and that breaks the obvious
implementation. Composing one is the natural reach — nothing to search,
author it on the spot, like a gesture — and it is exactly wrong, because
the composed guard is **performability**, and performability catches
*vague mush*. A fluent, specific, incorrect statement of Noether's
theorem is not mush. It is the invented-track failure wearing better
clothes, and unlike an invented track nothing downstream can catch it: a
song that does not exist produces a search miss, and a statement that is
not true produces prose.

So these are `catalogue`, and the guard is the one `passage` already uses,
stated strictly: **the interpreter never writes the content, only names
the search.** The server fetches the record and quotes its text verbatim.
A query matching nothing is an ordinary miss. No fourth honesty guard was
needed — only the discipline of not reaching for the wrong existing one.

`Medium.propositional` marks them, and it earns its own field because it
changes what honesty means rather than how something renders. It drives an
extra paragraph in the system prompt ("…do NOT write out what it says… a
statement you compose yourself is a guess wearing the clothes of a fact"),
and a test asserts both that the paragraph appears when one of these media
is in play and that it is *absent* when none is. A second test asserts no
composed medium is ever marked propositional — that combination would be
licensing exactly what the flag exists to forbid.

**One resolver, four scopes.** `lib/offerings/knowledge.ts`. They differ
by *scope*, not mechanism: a search hint that biases a bare query
("symmetry" → "symmetry mathematics theorem") plus a pattern matched
against the page's categories, title and extract. Wikipedia because it is
keyless and returns extract, thumbnail and categories in one call — the
same one-request-per-search trade artwork.ts was chosen for.

Scope is **curation, not honesty**, and the distinction is load-bearing:
a page the pattern rejects is still a real page, it is simply not a
theorem. So the pattern is generous (a strict one makes a medium feel
broken) and it is *not* re-applied on lookup — a category edit on
Wikipedia must not invalidate a move a player already picked from a list
this server handed them.

**A member of the medium, not the article about the medium** (2026-10-03).
The generous pattern had one failure mode that generosity cannot see. A
Life-only game of Tag answered a common grackle with the Wikipedia article
*Species* — a real page, in scope by every test that asks whether biology
is being discussed, and the dullest sentence the medium can produce.
Nothing was broken: Life is the only kind of medium whose catalogue holds
articles **about the category** alongside articles about **members** of
it, and `pattern` is built out of exactly the words — "species",
"taxonomy", "organism" — that the category articles are about. It admits
them more easily than it admits any actual creature.

So `inScope` is now three gates rather than one, and they refuse different
things:

| gate | asks | set for |
|---|---|---|
| `pattern` | is this the right *subject*? | all four, still generous |
| `rejects` | is this the medium's own *vocabulary*? | all four |
| `member` | is this a *member* or the *class*? | organism, place |

`rejects` is matched against the title alone and lists the pages that name
the vocabulary rather than offer anything in it — *Species*, *Organism*,
*Taxonomy*, *Geography*, *Mathematics*, *Physics* — plus a shared refusal
of indexes, outlines and disambiguation pages.

`member` is set only for the two scopes whose members are concrete things.
A theorem and a phenomenon *are* abstractions, so there is no member test
to run on them and `rejects` is the whole of their guard; that asymmetry
is asserted by a test, because it looks like an omission. The organism test
reads the title and the **first sentence only** — an essay about camouflage
reaches its animals by sentence three, so "is a bird" has to be what the
page is *about* rather than something it gets around to.

The word that makes the member test work is **"of"**. *Crypsis* opens "is
the ability of an animal to avoid detection" and *Convergent evolution*
opens "is the independent evolution of similar features in species of
different periods" — both name a creature within a few words of a copula,
and both are essays. So the window between "is a" and the creature word is
a tempered match that cannot cross "of", except through the collective
nouns a real taxon page genuinely uses ("a species of birdwing butterfly",
"a large group of swimming sea slugs", "a clonal colony of a single
quaking aspen"). Scored 96/96 against a hand-labelled set of real pages
(29 creatures, 36 biology essays, 15 places, 16 geography essays).

A rejected page is an ordinary miss, which is the point: a miss is retried
and told what went wrong, while a dull hit is served.

**And the upstream half.** The resolver guard closes the hole; it does not
explain why the interpreter was reaching for a category in the first
place. Two prompt defects did that:

- The output schema offered `"query": "Attribution — Title"` for every
  catalogued medium, but these four set `attribution: null` on purpose —
  nobody is the author of a theorem. They had a strong *honesty*
  instruction and no *shape* instruction, so in a game whose readings are
  abstract by design the query came out in the register of the reading.
  They now get their own paragraph: the query is a proper name and nothing
  else, "Anglerfish" and not "a fish that lures prey with light", and a
  query containing "that", "which" or "a kind of" is a description that
  needs rewriting. The attribution form is withheld from the schema line
  for exactly these media.
- `buildRetryPrompt` listed the available media correctly and then advised
  naming "a famous recording, a famous painting" and composing a gesture —
  *unconditionally*. In a session narrowed to Life that is advice to answer
  in three media that are not on the table, so the corrective retry
  answered off-list, was refused for an unknown medium, and the turn fell
  through to the server's salvage search. Every bullet is now conditional
  on the media actually passed in, and a one-medium session is told so in
  as many words.

**Salvage told the truth about the record but not about the prose.** Two
further fixes to the last-resort path:

- `salvageQueries` seeded its first attempt from `carried`, the quality the
  interpreter said crossed. In a game of abstract readings that is four
  abstract nouns — the real seed "principle survival requires both", which
  resolves to an article about viral quasispecies. Names now go first: the
  interpreter's own query stripped of any gloss, then the move's title,
  then its attribution, and the quality words only as a last resort with
  function words filtered out.
- A salvaged turn was stored wearing the **first pass's** narration,
  `carried` and `lost`, all three of which describe the reply the
  interpreter planned rather than the one that landed. That was the one
  place the engine asserted something untrue about what is on the table: a
  player read genuinely good prose about an anglerfish underneath a record
  that was never played. Stage 3b re-asks for an account of the record that
  actually arrived — keeping the reading, which is about the move and so
  still stands, and explicitly permitting "nothing connects these" as an
  answer. If that call fails the three fields are cleared rather than kept,
  because an empty `carried` says nothing and a stale one says something
  false.

Two smaller consequences:

- `offeringLine()` now inlines the body for **any** non-composed
  text-perceptible medium, not just `passage`. An interpreter given only
  "Noether's theorem" reasons about a title and guesses the content, which
  is the failure these media exist to prevent. Composed media stay
  excluded because their steps already print.
- These are safe retry and salvage targets (nothing user-specific can make
  them come back empty), which strengthens the guarantee that a legal turn
  always carries a real reply. They are not *floor* targets, though —
  "cannot come back empty for reasons the interpreter cannot see" is a
  weaker property than "cannot miss", and only the composed media have the
  latter. See §17b.

**A `User-Agent` is sent here**, which looks like a contradiction of the
warning in shared.ts and is not. That warning is about a *crawler-shaped*
UA being refused by an edge WAF (Apple's); Wikimedia's own policy asks for
precisely this format. It is why "a provider that genuinely needs a header
can ask for one per call" exists.

**Known limit:** `listen_sessions.media` is snapshotted at creation, so
games already in progress do not gain these four. That is the existing and
correct rule — a game in progress should not silently change shape — but
it does mean the new media appear only in new games.

Candidates considered and not built: `poem` (PoetryDB, keyless, real full
texts), `word` (Wiktionary etymologies), `recipe`, `chess position`,
`birdsong` (xeno-canto). Each is a second provider rather than a fourth
scope, which is why they are listed rather than shipped.

The organism `pattern` was widened at the same time, to let the
invertebrates in: a man o' war, a sea angel and a slime mould were all out
of scope because none of their pages happens to use one of the original
words. (An earlier revision of this section claimed the `phenomenon`
pattern had the same gap and that *Bioluminescence* was out of scope. That
was inferred from a synthetic test page and is wrong — the real article's
categories include biological ones, and it resolves. The gap, if any, is
not that one.)

### The other three scopes had it worse

Asked whether the same bug lived elsewhere, the honest answer was yes, and
in a different and nastier form. Probed against the live API with
description-shaped queries of the kind a correlation reading produces:

| scope | query | returned |
|---|---|---|
| theorem | "something about symmetry giving you conservation" | **Emmy Noether** |
| theorem | "a theorem about things that must coincide somewhere" | **Ted Kaczynski** |
| phenomenon | "light produced by a living thing" | **The Thing (1982 film)** |
| place | "a place whose silence is its subject" | **Jeff Bezos** |
| place | "a landscape that looks like another planet" | **Geonosis** |
| place | "somewhere people left and never came back to" | **Goths** |

This is worse than the dull-category failure, because a reader cannot even
tell what went wrong — the chain simply contains a person where a theorem
should be. The cause is the same generosity seen from the other side: each
scope's `pattern` is tested against the whole extract *and every category*,
and Wikipedia is an encyclopedia. A mathematician's biography is in the
theorem scope because it says "mathematician". A businessman's is in the
place scope because it says where he is from. A Star Wars planet is in it
because it says "desert planet".

All three are the same shape — a person, a made-up thing, a nation — so one
`NOT_AN_OFFERING` gate in front of all four scopes catches them, before any
scope question is asked. It tests the title and first sentence together,
because a page sometimes states its kind in only one of them (*Sea Peoples*
says "peoples" in its title and "a purported seafaring confederation" in
its opening). Two of these classes have a medium of their own already — a
film is a `scene`, a song is `music` — which is the second reason they do
not belong here.

The person test leans on the parenthetical of birth and death dates rather
than on categories, because categories do not always arrive: under the
API's continuation limits a page can come back with none at all, which is
how two biographies reached a live game. A test asserts the gate still
holds with the category list empty.

A shared `FIELD_TITLE` list refuses the name of a field or a practice in
every scope — *Science*, *Photography*, *Zoology*, *Cartography*,
*Scientific method*. Per-scope `rejects` could not have covered these,
because the scopes overlap and neither list thought to mention the other's
subject.

**And the place member test had a hole**, shipped in the commit above and
found by this probe an hour later. It accepted "names its kind of place" OR
"opens by siting itself somewhere" — `is a … in …` — on the theory that
only a real place does that. Almost everything does that; both Bezos and
the Goths match it. The alternative is gone and the place word is now
required. The lesson is about the sample, not the regex: the first labelled
set was creatures and biology essays, so it could not have caught a guard
that admits people.

**What the non-Wikipedia media do instead.** Nothing, because they cannot
have this bug. Probed with the same description-shaped queries, Deezer and
the Cleveland collection simply **miss** — a catalogue of songs contains no
article about the category of songs, and no biography of Deezer. The
category-versus-member confusion is structurally confined to the media
whose provider is an encyclopedia, which is also where `propositional`
already pointed. A miss is the designed outcome and gets retried; the
knowledge media were the only four that could turn a description into a
confident wrong hit.

Residual, and deliberately left: *Proof of work* still answers a
mathematics query and *Goethean science* a phenomenon one. Both are real,
specific, in-medium records — mediocre answers rather than category
articles — and the prompt half of this fix is what addresses an interpreter
writing descriptions in the first place.

Verified: 394 checks, 0 failed · the scope gates scored 196/196 against
real Wikipedia pages across all four scopes, including a never-list of 22
people, works, fictions and nations asked of every scope · `tsc --noEmit`
9 pre-existing errors, none in touched files.

## 15. Fourth pass (2026-10-04): the partner may answer itself

One request: *there should be an option to have the conversational partner
reply to its own response.* In Tag and in every other game here, the player
was the only thing that could advance a chain. That was never a rule
anybody chose — it was the shape the turn loop happened to have — and its
cost is the same shape of cost the chain had before it became a graph. A
chain is a conversation between two readers. Sometimes the interesting move
is to stand back and find out where the other one's own answer takes it.

### 15a. A self-reply is a turn, not an annotation

The decision everything else follows from. A self-reply gets a row in
`listen_turns` with a parent edge, a relation, a world delta, a tuning
snapshot and a place on the branch — identical in every respect to a turn
the player took except for who played the move.

That is what makes the existing guards cover it without being rewritten:

- **The no-repeated-relation rule already applies.** `relation` is a column
  on the turn and `spentRelations` reads the log, so the partner cannot
  answer itself twice the same way. This is the load-bearing one: a partner
  agreeing with itself in a slowly narrowing circle is the self-reply
  equivalent of an invented track, and the guard against it was already
  built for another reason.
- **The exclusion set already applies.** The move's id is in `inPlay`, so
  the answer cannot be the offering it is answering, and nothing else on
  the branch can come back either.
- **The reply guarantee already applies.** Four stages, then the turn is
  not persisted. A self-reply with no answer would be a dead end for the
  same reason a player's would.

The move needs no resolution. It is a record this engine resolved itself
when it played it as an answer — which is also why **the client may not
name it**. `selfReply: true` accepts no medium, no offering id and no
composed body. A client that could name one would be able to put any
offering on the table attributed to the partner, which is the same class of
lie as asserting a track exists.

### 15b. `previous` is null, and that is the whole structural difference

On a player's turn the move answers what the parent left on the table. On a
self-reply the move **is** what the parent left on the table, so there is
nothing else on it. Printing a second copy of the same offering under a
second heading would ask the interpreter to find a connection between a
thing and itself.

Setting `previous = null` then disposes of three things by arithmetic
rather than by three new conditions that could each be forgotten: the
ruling in a strict game, the declared-relation requirement, and the
medium-change check. `legal` is `true` because `game.enforcesConstraint &&
previous !== null` is false.

**Nothing is ruled on a self-reply, and this is a claim about judging, not
a shortcut.** Nobody asserted anything, so there is no claim to rule on —
and an interpreter invited to judge its own offering is not a judge. The
prompt says so in as many words, and the `verdict` field is withheld from
the schema on that turn. A player's illegal move in Tag is still refused
exactly as before.

### 15c. The cap is read off the branch

Three in a row, `MAX_SELF_REPLIES`, enforced by counting the trailing
partner-authored turns on the path — `selfRepliesSince`, the same style of
derivation as `spentRelations`. A client asking for a fourth is refused by
arithmetic, not by trust.

Three because the thing being bounded is drift, not cost. By the fourth
consecutive turn the partner is answering its own answer to its own answer,
every step locally reasonable, and the chain has stopped being about
anything the player put into it. The player re-entering is not an
interruption of the run; it is what makes the run worth having happened.

Two details that are deliberate:

- **A player move anywhere resets it.** The cap bounds a run, not a game,
  and the run is a property of the *branch* — a run down one branch is not
  a run down a sibling.
- **An illegal self-reply still counts.** A move that was turned away is
  still a turn the partner spent. Skipping it would let a rejected
  self-reply buy an extra one.

`selfReplyRefusal` is one function shared by the route and the board, so
the control the player sees and the rule the server applies cannot drift
apart — and when it refuses, the player reads the sentence the server would
have sent. The cap is *stated* in the composer ("N more in a row") rather
than discovered by a button that fails.

### 15d. Continuation is stored in `Tuning` and told to nobody

How many turns the partner takes by itself after each of yours lives in
`listen_sessions.tuning` as `continuation`, so it needed no migration, it
rides the existing save plumbing, and a preset carries it like everything
else. The *rules* live in a fourth module, `lib/correlate/continuation.ts`,
because they answer a different question from the other three registries:
media say what an offering can be made of, relations what a reply can do to
one, tuning what the partner reaches for — and this one says **who takes
the next turn**.

**It never reaches the interpreter, and that is the non-obvious part.** A
model told that a run of three is under way writes toward a monologue: it
holds material back, it sets things up, it stops answering the thing in
front of it. So `describeTuning` omits it, the self-reply guidance never
names a count, and four tests assert the prompt for a game set to carry on
three times is byte-identical to the prompt for an untouched one. Each
self-reply is asked for on its own, as a turn, with no knowledge of whether
another is coming.

Consequence worth naming because it reads like a bug: `isNeutral` ignores
`continuation`. `isNeutral` means "says nothing to the interpreter" and is
what the prompt builders gate on. `isUntouched` means "the player changed
nothing" and is what the panel's summary and reset button use — a reset
button that hid itself while continuation was on would be lying about
there being nothing to reset.

The run itself is a client-side loop, one request per turn, sequential
because each turn answers the one before it. A failure mid-run is a
**notice, not an error**: the player's move went through and is recorded,
so painting the composer red would say something untrue about the turn they
actually took.

### 15e. `reframing`, and why a self-reply is not a restatement

The partner may narrow what it is answering — the stopping rather than the
reach — by returning `reframing`, which replaces the framing on the stored
move. It never changes which record the move is. This is the same move
choosing a framing was in the first place, which is why `framing` was never
defaulted to "all of it", and it is the field that makes answering your own
offering a thing you can do rather than a thing you repeat.

### 15f. The display guard

`move_by` is a column, not a derivation, and the board must never label a
partner-authored move "you offered" — it reads "it offered, to itself",
with an "on its own" chip on the turn. Same reasoning as *a dropped reply
is our bug, a search that found nothing is the game working*: two different
things must not look alike. This one is worse to blur, because a player
shown a chain they appear to have built and did not has no way to notice.

Two smaller consequences of the same fact:

- The interpreter's `THE PATH` block says `you yourself offered` for those
  turns. An interpreter shown its own offerings attributed to the player
  reads a conversation it was not having.
- The playback queue counts a self-reply's answer only. Its move is the
  previous turn's answer, already in the chain, and counting both would be
  audible as a stutter and visible as a doubled entry in what was crossed.

### 15g. Migration ordering

`supabase/setup/59_partner_self_reply.sql` **must run before the code** —
same hazard as 52 and 53. The turn route selects `move_by` by name and
PostgREST fails the whole select on an unknown column, so the section stops
being playable rather than degrading. `default 'player'` is correct for
every row written before today, and `moverOf` reads a null as a player move
so the helpers do not care either way.

Verified 2026-10-04: 454 checks, 0 failed (was 394) · `tsc --noEmit` 9
pre-existing errors, none in touched files · `next build` compiles · no
mojibake in any touched file.

## 16. Fifth pass (2026-10-04): the weighting did not work

A report: *dances set to rare, music set to mostly, and more than half the
replies are dances or stretches.* It was right, and the turn log could
prove it — every turn stores the tuning it was played under, so the
question "was the weighting followed?" is a query rather than an opinion.

```
weights {music:3, stretch:1, exercise:1, movement:1, rest 0}
  → stretch 4, music 2, movement 1       29% music, 57% stretch
```

Three causes, compounding. The fix needed all three, which is why the
0–100 slider that was asked for is necessary but was not sufficient.

### 16a. The share maths drowned the setting

Expected share was `weight / sum(weights)` over every non-muted medium. A
player who raises music to 3 and leaves the other eleven media at the
default 2 is asking, arithmetically, for **3/25 — twelve per cent.** The
control said "mostly". The maths said "a minority". Nothing in the product
reconciled those, and the player had no way to see the gap.

So the stored value is now a 0–100 weight per medium, and **the resulting
percentage is displayed beside each slider.** That display is not
decoration; it is the fix for this cause. "Music 100" next to eleven media
at 50 now reads *15%* on screen, which is an honest answer to a question
the four-stop version could not even ask. Muting the others moves it to
69% and the number says so as you drag.

The four stops are gone. Their original justification — that a continuous
slider would be false precision — was wrong in an interesting way: the
precision was never the problem, the *hiding of the denominator* was.
`shareLabel()` still derives never/rarely/freely/mostly from a number for
the places that want a word, which is the inversion: the number is the
truth and the word is a summary of it.

### 16b. Nothing enforced it

Only a weight of **zero** was arithmetic. Everything between 1 and 3
reached the model as a sentence of prompt plus one advisory nudge —
`dueMedium` — whose own closing words were *"Do not force it."* A model
takes that up. Each individual reply is locally defensible, no single turn
looks wrong, and the aggregate drifts, which is precisely the failure the
nudge was written to prevent and did not.

Proportion is now a **filter on the reply enum**, not a request:

- target share per medium, from the weights, muted media out of the
  denominator;
- actual share over the **whole branch** — not a trailing window of eight,
  which forgave anything older and let a long chain sit permanently
  off-target while every window inside it looked fine;
- a medium is **owed** when `actual < target × (n + 1)` — *if it answered
  now, would it still be within its share?* — and only owed media are in
  the enum the interpreter chooses from.

A medium over its share is therefore not discouraged, it is unnameable,
and it returns on the turn the arithmetic says it is owed again. This is
also applied at the retry and salvage stages and used to coerce the reply,
so a medium excluded from the enum cannot be accepted after the fact.

Two escapes, both the trade this file makes elsewhere: enforcement is
**opt-in** (an untouched game is unrestricted and produces the prompt it
always did), and the owed set is **never empty** (the guarantee that a
legal turn carries a real reply outranks a proportion, exactly as it
outranks a scope).

### 16c. The pipeline was biased toward the composed media

The retry prompt ended a bullet with *"That is the safest way to answer
this turn"* about composing a gesture or stretch. It was measurably too
persuasive — **four of five retries in real games landed in a composed
medium** — and retries are common because catalogue searches miss. A
composed reply genuinely cannot miss, which is worth telling the model;
"cannot miss" is not "should be chosen", which is what it heard.

That bullet now says to use one when it answers the move rather than as an
escape from searching, and names the player's heaviest medium as the thing
to try first.

### 16d. What it does now

Asked for 69% music against three composed media at 10% each, simulated
over 24 turns:

| model behaviour | music | the rest |
|---|---|---|
| worst case — always picks the lightest medium it is allowed | 63% | 13% each |
| greedy — always picks the heaviest | 71% | 13 / 13 / 4% |

The worst case matters more than the average: it is a stand-in for exactly
the bias in 16c, and the ratio survives it because exclusion is absolute
rather than persuasive. A test asserts both ends, plus that no low-share
medium exceeds 25% and that none is starved to zero — a filter that
silenced the small shares would be a different bug with the same shape.

### 16e. Migration: none, but the key changed

Shares live in `listen_sessions.tuning`, already jsonb, under a **new
`shares` key**. The old `weights` key is still read, but only when `shares`
is absent, and it is upgraded on the way in (`0→0, 1→15, 2→50, 3→100`).

Reusing the key was not an option: a stored `2` means "freely" on the old
scale and "all but muted" on the new one, so the key is what decides which
scale a value is on. Sharing it would have silently muted every medium a
player had left at its default. Old session rows, old presets, and the
`tuning` snapshot on every turn ever played all come out on the new scale,
and nothing writes `weights` any more.

Verified 2026-10-04: 489 checks, 0 failed (was 454) · `tsc --noEmit` 9
pre-existing errors, none in touched files · `next build` compiles · no
mojibake in any touched file.

## 17. Sixth pass (2026-10-12): the default was nobody's preference

Neutral and *default* had been the same object since the registry existed,
and the equation was never examined. It should have been. An unweighted
game spreads the partner's answering evenly across twelve media, and
"evenly across twelve media" is not a preference anyone holds — it is the
absence of one. A player who wanted music with the occasional painting had
to open the panel and say so at the start of every game, which is a
default asking to be changed rather than a default.

A new session is now created holding a real tuning:

```
shares  music 90 · artwork 5 · passage 5 · every other medium 0
axes    friction 0 (Agreeable) · abstraction 1 (Concrete)
```

The weights sum to 100, so they read as their own percentages. Not a
requirement — `targetShares` normalises anything — but a default is the
one tuning nobody opens the panel to inspect, and these are the numbers it
gets described by.

### 17a. Neutral still means neutral

`DEFAULT_TUNING`, `isNeutral` and the canonicalising in `normalizeTuning`
are untouched. The empty object remains the identity element the prompt
builders branch on, the prompt for an empty tuning is still byte-identical
to the prompt without one, and the test asserting it did not need editing.
What changed is one line in `createSession` and nothing about what a
tuning *means*.

That separation is the whole design. `startingTuning(media)` produces a
tuning; it does not become a second kind of tuning the rest of the code has
to know about. The default reaches the interpreter through `describeTuning`
and is enforced by `owedMedia` exactly as a player's own setting is —
which also means it is enforced from the first turn, because enforcement is
opt-in by setting a share and the default sets shares.

### 17b. Muting the other nine is the only way to say 90%

A share is a raw weight over the non-muted media. Leaving nine media at the
default 50 would hand music `90/540` — seventeen per cent. That is §16a
again, and it is the reason the shares are written as a mute rather than as
a lean. Muting stops the *partner* answering there; all twelve media stay
playable, and a move in one is read normally and answered in something
else.

**`passage` is not a safety net, and must not be mistaken for one.** It is
the single medium `replyMediaFor` refuses on a retry, because it searches
the reader's own books and can come back empty through nobody's fault. It
is in the default because answering a reader with their own library is the
best connection this section can make, and 5% of turns is worth the
occasional extra interpreter call on an empty shelf — not because it
cannot miss. A test asserts it is still absent from the retry media.

So the cost is real and worth stating: the media that genuinely cannot miss
are the composed four, and this default mutes them. Nothing in it can
answer without reaching a catalogue.

An earlier version of this section closed that gap by saying *"salvage
still ignores the mute if both are down, so the guarantee holds"*. That was
wrong, and worth recording as wrong, because it is the sentence that made
the gap look handled. Salvage drops the player's **scope** — the
`scoped: false` on its `tryResolve` — and nothing else. Its medium loop is
`answerIn.filter(m => !isComposed(m))`: mute-filtered like every other
stage, and then explicitly stripped of exactly the media that cannot miss,
because salvage is a query-seeded *search* and a composed offering is not
searched for. So all three stages reached the same two providers, and one
bad minute at either took the whole pipeline down together. The guarantee
was really a guarantee about somebody else's uptime.

**Stage 4 — the floor.** The fix is a fourth stage that runs only when the
first three have all failed: one interpreter call restricted to the
composed media, drawn from the session's `media` rather than from the
tuning, so it reaches *through* the mute. A composed reply is authored in
the response itself, so it is reachable whenever the interpreter is — and
the interpreter has already answered twice by the time we get there.

Overriding a mute is a stronger step than overriding a scope, and the docs
should not pretend otherwise: §16 calls a mute "the one share that is a
prohibition", while a scope is a preference about where to reach. What
justifies it is the alternative, not the weighting. The choice at stage 4
is not *muted medium vs. chosen medium* — stages 1-3 already tried that and
lost — it is *muted medium vs. no turn at all*, and a dead chain respects
the mute by handing the player nothing. It is the same trade
`weightedReplyMedia` already makes for a player who mutes every medium,
applied to the player who muted only the reachable ones.

The debt it incurs is honesty, paid in three places. `replySource` comes
back as `'floor'` alongside `replyBrokeMute`, so the board can say a muted
medium was used *and why*; `reply_query` records it on the row as
`floor, muted medium: …`; and the prompt tells the interpreter outright
that it is answering where it was told not to, rather than handing it a
medium list described — falsely, at this stage — as "what the player has
left on". A silent floor would be worse than no floor: a stretch appearing
unannounced in a game tuned to 90% music teaches the player that the shares
do not work, which is a worse thing to come away believing than "the
catalogues were down".

This leaves the default and the floor as one design written in two files.
If the floor is ever removed, §17b has to be reconsidered with it; a test
asserts the composed floor is non-empty and that the default mutes all of
it, which is the pair of facts that makes it load-bearing.

### 17c. Concrete, but the leaning stop

`abstraction: 1`, not `0`. The two stops differ in one clause: stop 0 ends
*"if your reading can only name a quality and never a thing, find another
reply"*, which instructs the interpreter to discard its own answer. A
default must not spend a retry, and a partner whose opening disposition is
to reject things contradicts the `friction: 0` sitting next to it. Lean, do
not refuse. A test asserts the default prompt contains no instruction to
find another reply.

### 17d. Two resets, because "unweighted" moved

"Back to unweighted" would now *discard* the default rather than restore
it, which is the one thing a reset must not do. So the panel has two
controls, and only ever one of them at a time:

- **Back to the default** — shown whenever the tuning is not the default,
  restores it.
- **Clear it — answer in anything** — shown only *at* the default, because
  unweighted is now somewhere a game has to be taken, and a player who
  wants it would otherwise have no control at all.

`isStarting()` decides which, comparing through `shareOf`/`axisValue`
rather than by key, so a player who drags a control back to where it
started stops seeing the button. Canonical form is an implementation detail
and must not be visible in the UI.

`tuningSummary` also collapses a long mute list to "nothing else" past
three media. Naming them is the shorter statement only while there are few:
the default would otherwise spend its entire summary line enumerating the
ten things the partner will not do.

### 17e. Games in progress keep what they have

Applied at creation, never as a fallback for a stored `{}`. `rules`
already promises a game does not change shape underneath the person
playing it, and the weighting is covered by that promise. An old session
reads as unweighted because it genuinely was one.

Computed per session rather than stored as a constant, because `media` is
already an intersection with what the deployment can serve. A constant
would mute media that are not there — harmless — and leave a medium the
list *gained* sitting at 50, quietly taking a third of the answers nobody
asked it for. If none of the weighted media are available the game starts
unweighted: muting nine media in favour of three that are not there is a
contradiction `weightedReplyMedia` would ignore anyway to keep its
guarantee, so storing it would only mislead whoever read the row.

Migration: none. `listen_sessions.tuning` is jsonb and already
canonicalised; this writes a value it could always have held.

Verified 2026-10-12: 528 checks, 0 failed (was 489) · `tsc --noEmit` 9
pre-existing errors, none in touched files · `next build` compiles · no
mojibake in any touched file.

---

## 18. Seventh pass (2026-10-28): switching games mid-session — design

Switching the game mid-session — Tag handing off to Embodiment partway
through a chain. **Built in §19**; this section is the design that preceded it.

Written up in full as **`reports/2026-10-28-game-switching.md`** rather than
inline, and deliberately not summarised here: the analysis turns on specific
`seedWorld` values and two hazards that only appear in the code, and a
paraphrase of those is the kind of second copy this document spends §16 and
§17b warning about. One copy, in the report.

The three results worth carrying in your head:

- **It is blocked on a schema change.** `listen_turns` has no `mode` column,
  so changing a session's mode retroactively relabels every turn already
  played. `listen_turns.tuning` is the precedent for the fix.
- **`seedWorld` decides compatibility.** Seven games start empty and are
  clean switch targets; four ship an authored premise and are not. Tag →
  Embodiment is in the clean class, Tag → Duel is not.
- **The switch should be a branch**, which the graph already supports and
  which makes `worldFor`'s delta replay start in the right place for free.

## 19. Eighth pass (2026-10-29): switching, as built

All three phases the report named, plus the UI it left unexamined. Tag hands
off to Embodiment mid-chain; the chain's last offering is the new game's
opening move; both halves stay on the record as what they were.

New: `supabase/setup/76_listen_turn_mode.sql`,
`lib/correlate/switching.ts`, `components/correlate/GameSwitch.tsx`.
Changed: the turn route, `prompt.ts`, `types.ts`, `CorrelationBoard.tsx`.

### 19a. The tiers are derived, not listed

`switching.ts` computes the seeding split from `seedWorld` rather than holding
a table of it. A seed key is *authored* when it is a non-empty string or a
non-empty array; numbers are counters, not premises, which is what puts
Prediction's `{hits: 0, misses: 0}` in the empty class. So a twelfth game with
an authored premise lands in tier 4 by existing, and no table has to be
remembered.

Deriving it caught one thing the report got wrong about its own rule:
`navigation ↔ construction` was listed as tier 3 on the strength of both being
place-shaped, but `construction` starts empty (`placeName: null`, three empty
arrays), so switching *into* it is an ordinary clean handoff. The pair is
asymmetric — navigation → construction is tier 2, the reverse is tier 4 — and
a test now asserts that so it cannot drift back.

Tiers 1 and 2 are offered. Tier 3 is computed and withheld: both members ship a
premise, so each direction needs a decision about whose scene survives, and
that decision still has not been made.

### 19b. One boundary, two consequences

The report treated the replay restart and the spent-relation clearing as two
rules. They are one, and tying them together is what makes the tier-1 case
correct: `pathSinceSwitch` returns the suffix from the last switch *that
changed the world's shape*, and both the world fold and `spentRelations` read
it.

So Tag → Chain keeps the whole chain and keeps the no-repeat rule, because both
games have the same shape and the same rule. Tag → Translation restarts the fold
and releases the spent relation, because Translation's relation set is exactly
`['translation']` and not releasing it would hand the new game a prompt that
demands a relation and forbids the only one available. Two tests cover both
directions of that.

The prompt *states* the release rather than letting it vanish. A prompt that
silently stops forbidding what it forbade last turn is indistinguishable from
one that forgot, and an interpreter with no way to tell will avoid the released
relation out of caution — which is the opposite of releasing it.

### 19c. A switch is armed, not applied

There is no zero-turn boundary in the graph, so the switch happens when the move
carrying it is played. `GameSwitch` therefore sets what the composer *sends*; it
posts nothing, and a player who arms one and walks away has changed nothing.

The consequence worth knowing: arming changes the composer, not just the label.
Tag → Chain flips `declaredRelation` from `never` to `required`, so the move
that carries the switch is the first one that has to name its relation. The
board resolves two branches for this — `branch` for what has been played (the
accent, the world, the per-turn labels) and `nextBranch` for what the composer
asks (the relations, the declaration, the prediction field). Showing the current
game's form and posting it as the new game's move is how a player would
otherwise get a 400 for a field they were never shown.

An illegal switching turn does not stick, and that falls out of the graph rather
than being special-cased: a move that was turned away is on nobody's path, so
`pathTo` never contains it and the branch is still the game it was. The control
stays armed in that case — the switch did not happen, and making the player
re-arm would be charging them for the engine's own rule.

### 19d. Both questions the report left open

**The judge flip** is surfaced. `switchChanges` is computed from the two
registry entries and names everything a switch changes that a player would
otherwise discover by playing into it: the world, who rules, whether the
relation is theirs to name, whether a move can be turned away at all, and which
relations are left. It is shown before arming and again while armed.

**`gatesLegality` vs `enforcesConstraint`** needed no new copy. The two reasons a
move cannot be turned away are already distinct in the UI — the Friction axis
lives in the tuning panel and says so there — so the switch control says only
what the switch itself changes: that `enforcesConstraint` is going from true to
false, or the reverse. Stating both in one sentence would have put the tuning
panel's explanation in a second place, which §16 and §17b are about.

### 19e. What `session.mode` still means

Unchanged: the game the session *started* as. Nothing writes it on a switch.
That is what keeps every existing read of it correct — the home-page strip, the
session list, `createSession`'s rules snapshot — and it is why the board shows
"started as Tag" beside a branch playing Embodiment rather than silently
relabelling the session.

`listen_turns.mode` is written on every new row, switched or not, so `null`
keeps meaning exactly one thing: written before migration 76.

### 19f. Still open

`prediction` reads less like an eleventh game than like a modifier — empty-
seeded, `relations: 'all'`, `judge: 'player'`, and distinguished only by
`wantsPrediction(game)` returning true for its id. It is a switch target here
because it is mechanically clean, and the modifier question is untouched. If it
is ever answered the right way, it stops being a target and becomes something
that can apply to any of the others.

**Followed up in §20**, which found the modifier already half-built and the
persona arguing with the player.

## 20. Ninth pass (2026-10-29): tier 3, and the prediction's own record

Two of the three things §19f and §19 left open. New:
`supabase/setup/77_prediction_is_a_fact.sql`,
`buildSeedSystemPrompt` / `buildSeedPrompt` / `normalizeSeed` in `prompt.ts`,
`carriedSeedKeys` / `derivedSeedKeys` / `switchSeed` in `switching.ts`.

### 20a. Consistency is with yourself, not against the player

Prediction's persona said *"You never bend your answer to match a guess, and you
never pretend a miss was a hit."* Both clauses read as an interpreter guarding
itself against the person it is playing with, and the first licenses the exact
failure it was written to prevent: an interpreter told not to be led will swerve
off an answer the player correctly predicted. That punishes a good read, and it
makes the one thing the game exists for — learning how the interpreter thinks —
impossible. It is also invisible from inside a turn, because a swerved answer
looks exactly like an independent one.

The persona now says consistency is *with itself*, that being predicted is the
game working, and that the interpreter is on the player's side. The shared prompt
block says the same, and says why: *"Reaching for something else because they saw
it coming is the one move that makes you impossible to learn, and it is a worse
outcome than being obvious."*

The ordering rule survives unchanged — choose your reply, then read the guess —
because that one is not about resisting the player. A guess read first becomes a
suggestion, and then there was nothing to have predicted.

### 20b. The modifier was already there; only the input was gated

`wantsPrediction(game)` has exactly one caller outside its own definition, and it
is in `CorrelationBoard.tsx`, deciding whether to render a text input. The turn
route has always accepted the field from any game, and `buildUserPrompt` has
always emitted the block. So a prediction posted into a game of Tag was already
honoured end to end.

That changes what the registry entry is *for*. The ordering rule and the
reporting rule were already universal; what Prediction owns is the consistency
persona and the `record` / `tendencies` world. Only the second half is
game-shaped.

The schema field follows the field rather than the registry — `buildSystemPrompt`
takes a `predicted` flag, not `game.id === 'prediction'` — because keying it on
the game would make the schema and the accepted field disagree the moment a
client posted one.

**Not flipped on in the UI.** The argument for universality was that it could be
*measured* — and the thing that makes it measurable is 77, which only just
landed. There is no data yet.

### 20c. The hit rate was the model's own homework

Prediction's entire world is `record: {hits, misses}`. That record was maintained
by the interpreter, in its own `world_delta`, scored from prose it had written
itself — and the guess that produced the score was never stored at all. So the
hit rate of the game that is *about* a hit rate could not be recomputed or
disagreed with.

`relations.ts` already says why that is the wrong shape:

> The music section asked the interpreter to maintain a `threadsUsed` array
> itself, which meant the rule depended on a model remembering to append to it;
> recording the relation on each turn makes what is spent a fact about the log
> instead.

So: `listen_turns.prediction` holds the guess verbatim, `prediction_called` holds
the ruling, the interpreter returns a bare `called` boolean and is told the
running score is not its to keep, and `recordAfter` folds the tally in beside
`visitedAfter`. `tendencies` stays the interpreter's — it is prose about
reasoning and no arithmetic could produce it.

### 20d. Tier 3 opens, and the problem was never the scene

`duel ↔ transformation` is now switchable. Reading the two seeds is what made it
answerable:

| | authored | starts empty |
|---|---|---|
| `duel` | `scene` | `score {0,0}`, `established []` |
| `transformation` | `scene`, `invariants ['There is still one man waiting.']` | `ledger []` |

A drifted scene is still a scene and crosses fine. The problem is `invariants` —
authored content *about* the canned premise, true of a bus shelter and
meaningless about an apartment. Keep it and the world asserts something false;
drop it and Transformation has lost the thing it tracks, since `invariants` is
"what has survived every transformation so far" and an empty one gives the first
transformation nothing to preserve against.

The third option is to author it for the scene that actually arrived, which is a
model call producing **seed** content — the only one in the engine. Every other
seed is written by hand and `worldFor` only ever folds deltas onto one.

Three things keep it honest:

- **It is narrow.** `buildSeedSystemPrompt` hands over the destination's persona
  and nothing else: no move, no history, no reply to plan, no turn schema. The
  scene is an input it is forbidden to improve, extend or replace.
- **It fails closed.** `normalizeSeed` checks the returned shape against the
  destination's own `seedWorld` value for that key, and a failure refuses the
  turn. The only alternative to a usable premise is the canned one, which is the
  dishonesty the tier was closed over.
- **It is durable without being recomputed.** The carried and authored seed goes
  into the switching turn's `world_delta`, under the interpreter's own delta, the
  way `mediaVisited` does. Every later fold reproduces it from the row.

And the asymmetry is real: `transformation → duel` needs **nothing** authored.
Duel's only authored key is `scene`, which carries, and its other two are
supposed to start empty. One direction of the only tier-3 pair never needed a new
mechanism at all — which the first pass missed because it reasoned about the pair
rather than about the ordered pair.

Tier 4 stays closed. There the destination's premise is about a scene that has
nothing to do with what you were playing, so there is nothing to derive it *from*
— the input this whole mechanism depends on does not exist.

## 21. Tenth pass (2026-10-29): why the eleven games felt the same

Reported, in one sentence: the game types are all same-y, the
transformation/content rules do not seem respected, possibly conflicting with the
narrator settings. All three halves of that turned out to be right, and the
third one was the cause.

### 21a. The measurement

The system prompt is 14.6–16.3k characters depending on the game, and **93% of
its lines are identical between any two games**. Tag's own content is 3.1k of
16.3k, and almost all of it sits in the first 11% — after which come eleven
thousand characters that every game shares.

The user prompt, which the model reads last, was **576–1,361 characters and said
nothing about which game it was**: the world, the move, the offering on the
table, the medium-dependent relations, a tuning sentence, "respond with the JSON
object only". At the moment of answering, the nearest thing in context
distinguishing Transformation from Tag was fifteen thousand characters back,
behind everything true of all eleven.

### 21b. The default weighting muted the media some games are made of

This is the one that was doing the most damage, and it is the "conflict with the
narrator settings" the report guessed at.

`startingTuning` applied one 90/5/5 default across all eleven games, and 90/5/5
**mutes nine of twelve media**. So every game's reply enum was music, art and
reading — which is most of why eleven games produced the same kind of answer.

For Embodiment it was not a flavour problem but a broken game. Its `replyRule`
is "either a real offering that reads the action just made, or a composed action
that reads the offering just made", and a composed action is a gesture, a
movement, a stretch or an exercise. All four started muted. The game whose whole
subject is doing rather than saying could not answer with a body.

Nothing reported it, and that is the interesting part: a muted medium does not
error, it produces a perfectly good song instead. The symptom is a complaint
about sameness rather than a bug report.

`coreMedia` on `CorrelationGame` is the fix — the media a game's own `replyRule`
cannot be followed without, as opposed to the ones it will accept. `media: 'all'`
could never say this, which is why the gap existed. A core medium gets a floor
(`CORE_MEDIUM_SHARE`, 15) instead of the mute, so Embodiment opens at roughly
56% music and 9% each across the four physical media. It is a floor, not a new
default: the music-first shape survives, and a player may still mute them
themselves.

Only Embodiment declares any today, and the test is deliberately strict — not a
medium a game *suits*, but one without which `replyRule` is impossible.
Transformation's world is a scene; its reply can be anything.

**Sessions already in progress keep what they have**, per §17e and the promise
`rules` makes. The route to fixing an existing Embodiment game is the panel's
"Back to the default" button, which now resets to the core-media-aware default —
one click, and visible, rather than a silent rewrite of a stored tuning.

### 21c. Friction's default told eight games to prefer relations they forbid

Friction stop 0 — the stop every game *opens* on — used to end "prefer
continuation and association over anything that contradicts them". Eight of
eleven games narrow their relation set: Counterpoint has `[counterpoint,
reinterpretation]`, Translation has `[translation]` alone.

The model cannot emit an illegal relation, because the schema enum is the game's
own list. So it resolves the contradiction the only way left — by reaching for
whichever legal relation reads most like association. Which is a mechanism for
making every game sound like Tag, running at the default setting, in eight games
out of eleven.

The stop now states the same disposition without naming a relation, so it
composes with any game's set instead of arguing with most of them. A test
asserts it names no relation id.

### 21d. `restateGame`

The game's four binding rules, restated last in the user prompt: what an offering
is here, how it is read, what must come back, what makes a turn hold, and which
world keys it may move. ~980 characters, and it takes Transformation's user
prompt from 730 to 1,716 — from saying nothing about the game to being mostly
about it.

Not a new idea in `prompt.ts`. It is the move `restateTuning` already made, whose
comment says why: *"Position is the whole point: this lands next to the decision
it is trying to change, not four hundred lines above it."* The same was never
done for the game itself, which is the stranger of the two omissions.
Suppressed on a self-reply, where `SELF_REPLY_GUIDANCE` already holds that slot.

### 21e. The retries were a missing retry

Also reported: the interpreter often fails and the move has to be retaken once or
twice. The cause is an asymmetry — the reply pipeline has a **four-stage** ladder
for an answer that will not resolve, and a response that would not *parse* had
**none**. It returned 502 and told the player to take the move again, which is
what they were doing by hand. The engine was asking a person to perform the
retry it already knew how to perform everywhere else.

Three changes, all wanted:

- **`parseJsonObject` salvages a truncation.** A completion that hits
  `max_tokens` mid-object is cut at the last completed top-level member and
  closed. Deliberately lossy in one direction: a partially-written value is
  *discarded*, never closed. Closing the string would be easier and is wrong —
  `"worldDelta": {"scene": "A bus sh` would become a world whose scene is the
  string "A bus sh", folded into every later turn on the branch. A missing key is
  recoverable; a truncated one is a lie that persists. What is usually lost is
  `worldDelta`, because it is last, so the exchange is recorded and the world
  simply does not advance that turn.
- **One re-ask**, with an output-discipline paragraph appended. It says nothing
  about the failed attempt, because this is a fresh completion with no memory of
  it — "your last response was malformed" would be a sentence about a
  conversation it was not part of.
- **The budget ladder rose** (1000/1200/1800/2600/4000 →
  1600/2000/2800/4000/6000). The arithmetic is one-sided: a cap is not a spend,
  you pay for tokens generated, whereas a truncation costs a full generation
  *and* the retry after it. The schema had also grown `called` since the comment
  that already called 1400 marginal.

And the unparseable path now **logs** — length, budget, head and tail of the raw.
Before this, the two 502s were indistinguishable in production, which is why the
rate was only ever known from someone noticing.

### 21f. Five cards, not eleven

The picker offered all eleven. Six of them are reachable from a game of Tag by
switching, and switching into one is strictly better than starting it — the last
offering on the table becomes its opening move instead of the player supplying
one cold.

So `startableGames()` is Tag plus the games a game of Tag *cannot* become, which
derives to Tag and the four premise-seeded ones. Derived from `canSwitch` rather
than listed, so the two lists cannot disagree and a twelfth game files itself.

The six held back are **named** in the picker, with one line saying they are
inside Tag. Dropping them silently would be worse than the eleven cards: a player
who knows Embodiment exists and cannot find it has been told nothing.

`FEATURED_GAME_IDS` changed too — it was `['tag', 'chain', 'translation',
'embodiment']` and three of those are now switch-only, so the home strip would
have offered a cold start to games /play had just explained you enter from
inside Tag. A test asserts the subset.

## 22. Eleventh pass (2026-10-29): stakes, an ending, and a reader

Asked for directly, after a round of "what would make this funner". Five of the
answers plus one. Migration 78: one table, four columns.

### 22a. It can see the pictures

The deepest quality ceiling in the section, and the one no prompt work could
raise. §21a measured the prompt; this is about what the prompt was *about*.

`buildSystemPrompt` has carried a block called READING A RECORD YOU CANNOT
PERCEIVE since the knowledge media landed, explaining that artwork and film
arrive "as a name, an attribution and at most a line of description" and asking
for honesty about a record the interpreter cannot see. For anything with a
picture that limit was never real:

- `Perceptible` has carried `{kind: 'image', url}` since artwork existed
  (`lib/offerings/artwork.ts`), and film carries a poster.
- Two other routes in this app — `manga-parse` and `site-extract` — have been
  sending `image_url` content blocks to the same provider all along.

So `lookAt` attaches the move and the offering on the table when they have
pictures. Two at most, and which two is not arbitrary: they are the records the
reading is *about*. The path stays textual — it is context, each exchange has
already been read, and a dozen images would cost more than the turn.

**The prompt had to be told**, or it would hold a canvas while asserting it
could not see one. That is the lie that matters, because an interpreter told it
cannot see writes the reading-of-a-mood it writes when it has nothing, with the
picture unread in the same message. `seen` subtracts those media from the
unperceived list for that turn — *subtracts*, not suppresses: with a painting
attached and a song on the table, the warning is still true of the song.

A text-only fallback covers the failure outside our control. The provider
fetches these URLs itself, so a catalogue that starts bot-walling hotlinked
images takes the vision call down with it — this app has been there, which is
why artwork is Cleveland and not Chicago. The fallback rebuilds the system
prompt *without* `seen`, because a prompt claiming an attachment that just
failed is the same lie from the other direction.

Audio stays out of reach. A song cannot go in a prompt, which leaves its words
as the equivalent unlock and Deezer does not carry them.

### 22b. Now you can be right

Nine of eleven games cannot turn a move away, and the two that can do not at the
default Friction (§21c). So there was no way to be wrong, and therefore none to
be right — which is most of what "no stakes" meant.

`listen_claims` reverses the direction: instead of avoiding refusal, you reach
for credit. The player points at an earlier exchange, says what runs through
both, and is ruled on. It is the same edge as `listen_turns.link_turn_id` — the
best observation this engine makes, that turn 9 is doing again in another medium
what turn 2 did — claimed from the other side rather than volunteered and
rendered as grey text.

Three verdicts: `holds` / `thin` / `no`. Not a boolean, because "thin, but real"
is the ruling this engine produces best and the whole section is built on
connections that are explainable rather than exact. The UI colours `thin` amber
and not red for the same reason — red would be the interface disagreeing with
the ruling.

`buildClaimPrompt` is **the one ruling in the engine that is deliberately not
generous**, and it says why in the prompt rather than simply being strict: the
player is reaching for credit here rather than committing to a move, and credit
given for nothing is worth nothing. It still cannot punish, and a stronger rhyme
it can see gets volunteered without changing the verdict on the claim actually
made.

A claim is its own row and not a column, because it is symmetric — a column
would have to pick one of the two turns to live on. Unique on `(from, to)`, so a
ruling cannot be re-rolled.

### 22c. A game can end, and the ending says something

Every registry entry has carried a `goal` from the beginning — "exhaust a
subject from every side it has", "map somewhere real enough to come back to" —
and nothing in this engine had ever read one. `status = 'finished'` was a flag
the player set by hand with nothing on the other side of it.

`turn_limit` gives the arc: three lengths at the picker, a countdown that says
"a branch spends one too" because that is what makes a branch cost something,
and a server-side refusal at the limit — the board's count is a display of the
server's number, not the number itself.

`closing_reading` gives the payoff. `/api/correlate/close` reads the whole line
at once and asks two questions in a deliberate order. What the chain *became*
first, because the player chose every move and therefore cannot see the shape
from outside — that is the entire value of the paragraph. The verdict against
the goal second, in the register everything else rules in, where a thin success
is a success. "It went everywhere and settled nowhere" is offered as a real
finding, because an invented theme is worse than none.

Its own route rather than a branch in the turn loop: it is not a turn, and it
reads the *arc* where the turn loop reads an eight-turn window. Idempotent, and
best-effort about the reading while absolute about the close — pressing Finish
lands on a finished game whatever the interpreter does, and a null
`closing_reading` then means exactly what it says. The quota check sits inside
that block for the same reason: being out of quota must not block closing a game.

### 22d. Two answers to the same move

The turn loop had no decision in it. You chose which record to submit; the
answer was handed to you.

"Answer it again" re-posts the same move against the same parent, which records
a second answer. Not a re-roll — the first is kept, both are playable, and a
chooser appears on any turn with siblings.

It needed no new engine concept, because two turns answering the same parent
*is* a branch here, and `inPlay` already excludes everything a sibling answered
with. The comment there says why: "a second branch off the same offering should
not come back with the same record as the first" — a rule written for a feature
nothing had yet asked for.

Availability is derived, not tracked: the button shows while the player stands on
one of the answers to the move they just made, compared by parent. That survives
`absorb` moving focus itself, and needs no clearing anywhere.

### 22e. Somebody can read it

"Do you see what I see" is what a correlation game is for, and three of the
eleven (`judge: 'player'`) are explicitly arguing with somebody — who, until
now, was a model, because there was no way to show a chain to a person.

`share_token`, a service-client route, a read-only page. **Not an RLS policy**,
and the reason is worth keeping: `using (share_token is not null)` would let
anyone enumerate every shared game, because a policy can see the row but not the
token in the caller's URL. The token has to be matched server-side against one
row, which means a service client, which means a route.

**Not `CorrelationBoard` in a disabled state**, either, and that is not about
code size. That component is fourteen hundred lines of things a reader of
somebody else's game must not have — composer, tuning panel, radio, self-reply,
the switch control, branch focus — and rendering it inert would mean carrying
every one and trusting a flag, with the failure mode being a stranger playing a
turn into your game.

A switch over the live row, not a snapshot: a game still being played keeps
updating for whoever holds the link, and turning sharing off kills every link
rather than leaving stale copies behind. A trashed game stops being shared
without the token needing revocation, because the trash is the one list a public
link would otherwise have kept it visible in. The payload withholds `user_id`,
`tuning` and the token itself, and the closing reading goes at the *top* for a
reader — the opposite of the owner's order, who lived through it.

### 22f. Deliberately not here

- **The cross-session view.** "Which relations you reach for, which media you
  avoid, how well you read your partner" wants its own page, and the material
  for the last of those (`prediction_called`, §20c) is two days old. Nothing to
  show yet.
- **The shared view's branch map**, and full-length playback in it. A shared
  chain is a line, and full playback is quota'd against an account that a reader
  does not have.

## 23. Twelfth pass (2026-10-29): a variant from the first move

Reported in one line: *"you should be able to play tag variants from the first
move instead of after the first move."* Correct, and it was §19/§22's
overcorrection. Two separate things were in the way.

### 23a. The picker told you where they were and would not let you go

§21f took the six variants out of the card grid on the reasoning that switching
into one mid-chain is better than starting it — the offering on the table becomes
its opening move instead of being supplied cold. That reasoning is sound and it
described a *preference* as though it were the only route. The dashed box saying
"6 more are inside a game of Tag" was accurate and useless: the only way in was a
switch, and a switch needed a table.

They are startable again, but inside Tag's card rather than as five more cards —
which is the only place that says what they are. `switchOnlyGames()` became
`variantGames()`, because the old name had been true for about a day and then
became a lie.

Starting one directly is also genuinely better when you already know which you
want, and not just by a click. `createSession` snapshots the game's own `rules`
and relation set and computes its starting tuning from its own `coreMedia` — so a
session created as Embodiment opens with the four physical media unmuted, and one
created as Tag does not. See 23c.

`openingGames()` is now about presentation and not about what may be created:
five games open on a scene of their own, six are the same exchange under
different rules.

### 23b. The switch refused an empty table, and only tier 3 should

`switchRefusal` refused *every* switch with nothing on the table, reasoning that
"the last offering becomes the new game's opening move" and there was no last
offering. Sound reasoning, wrong conclusion — it ignored what the destination is.
An empty-seeded game **starts** from nothing. Switching into Embodiment before
anything is played is not a degraded Embodiment; it is Embodiment, in the same
state as one that had just been created.

Tier 3 still needs a table, for a reason that survives the correction: there the
carry *is* a scene, and with nothing played the only scene available is the
source game's own canned premise — which the player never played, and which
arriving in another game is exactly what tier 4 is refused for. A test asserts
that every switch still requiring a table is a tier-3 one.

The control now filters its list through `switchRefusal` rather than through a
condition of its own, so it can only offer what the server would accept, and its
copy changes: with something on the table a switch is a handoff, and with nothing
there it is simply which game you are about to open.

### 23c. Two things that would have been wrong about a turn-zero switch

Both are cases where the feature would have "worked" and produced something
worse than starting the game.

**The weighting.** `startingTuning` reads `coreMedia`, and a session created as
Tag is weighted for Tag — which mutes all four media Embodiment composes actions
in (§21b). So switching to Embodiment on move one would have given the right
rules with the game's own media silenced: the §21b bug arriving by a second
route. `armSwitch` now hands the armed game its own starting weighting, but only
at turn zero and only while the weighting is still the one the game was created
with. Both conditions are `startingTuning`'s own promise read precisely — a game
with no turns is not in progress, and a weighting the player has moved is theirs.

**The prompt.** The switch block is two statements about history: "the exchanges
in THE PATH TO HERE happened under X" and "the offering on the table is the
opening move". With no turns there is neither. Saying them anyway would be worse
than saying nothing, because the interpreter would go looking for the inherited
context it had been promised. A turn-zero switch gets its own short block that
says what actually happened — the player changed their mind before playing
anything — and that nothing is inherited.

The opening prompt on the board reads from the armed game too. Showing Tag's
instruction on an empty board while the player is about to play Embodiment would
be the only instruction there, and wrong.

### 23d. What is still only a switch

Nothing, for the variants. Tier 3 (`duel` ↔ `transformation`) remains
switch-only-after-a-move, which is not a restriction on starting either of them —
both have cards — only on carrying a scene you have not got yet.

## 24. Thirteenth pass (2026-10-30): making the turn faster

Asked directly: can the server respond quicker. Four changes and one measurement
that reframed the fifth. No schema change.

### 24a. 16,346 characters, byte-identical, re-prefilled every turn

The measurement first, because it is the whole argument. Rendering the system
prompt for turn 1 and turn 6 of the same game and diffing them: **identical, all
16,346 characters** — about 4,000 tokens re-sent and re-processed on every move,
against a cacheable minimum of 1,024 on Claude Sonnet 5.

Prompt caching is a prefix match, so the only requirement is that nothing
per-turn sits above anything stable. The prompt was already *nearly* in that
shape — the world, the move and the offering on the table were in the user
prompt — but four things in the system prompt varied per turn, and one of them
was fatal:

| Varies | Was at | Why |
|---|---|---|
| the reply-medium enum | end (OUTPUT) | `owedMedia` recomputes it from the branch's reply history |
| the prediction rule + schema field | end + world rules | only when the player guessed |
| the self-reply guidance | ~45% | only on a self-reply |
| **the vision exception** | **~30%** | **`seen` subtracted from `unperceived`** |

The last one was the problem, and it was mine — §22a shipped it the day before.
Subtracting the attached media from the unperceived warning moved the first byte
of divergence from the *end* of the prompt to 30% through it, which is the
difference between a cacheable prefix and none.

`systemPromptParts` now returns `{ stable, volatile }` and the breakpoint is a
thing the type system carries. 13,278 characters stable, 2,263–3,572 volatile —
**86% of the prompt cacheable**, and the stable half is byte-identical across
every per-turn case: narrow enum, wide enum, vision, two images, self-reply,
prediction, and all of them at once. Twelve assertions lock that down, because
the failure is silent: one per-turn byte added above the line costs the whole
prefix, the turn still works, and the only symptom is a zero in a column nobody
reads.

**Both blocks that had to move read better where they landed.** The vision
exception is now "artwork is attached on *this* turn, so the warning above does
not apply to it" — a standing limit with a named exception, instead of a limit
that quietly changes shape. That is the same move `restateGame` and
`restateTuning` already make.

`buildSystemPrompt` still exists and joins the halves, which is what the retry,
the composed floor, the salvage account and the seed call all use: those are
one-offs whose prefix nothing reuses, and a breakpoint there would pay the
cache-write premium for a read that never comes.

**Unverified end-to-end.** Whether OpenRouter passes `cache_control` through for
`anthropic/claude-sonnet-5` rather than stripping it is a question only a real
turn answers — which is what 24b is for. The change is additive either way: a
provider that ignores the marker reads the parts as text.

### 24b. `api_usage` recorded a guess and no measurement

`logUsage` was called with a flat `0.005` estimate and explicit zeros for both
token columns, which have existed since the table did. So every question worth
asking about this route — is the prompt as expensive as we think, did the cache
work, is `max_tokens` tight, is the model thinking — was unanswerable from data
we were already storing. 24a in particular is unfalsifiable without it.

`providerUsage` normalizes the counts, because providers disagree: OpenRouter
passes Anthropic's cache fields through as `prompt_tokens_details.cached_tokens`
while Anthropic's own shape says `cache_read_input_tokens`, and reasoning tokens
appear in a third place again. Cache and reasoning counts go into the existing
`request_metadata` jsonb rather than new columns.

**The column name was nearly a silent disaster.** `logUsage` is wrapped in
`catch {}` so that a logging failure can never fail a player's turn — which
means an insert naming a column that does not exist would have stopped recording
usage altogether, with an empty table as the only symptom. The first draft wrote
`meta`; the column is `request_metadata`.

### 24c. Four serial database round trips before any work started

Auth → quota → session → turns, sequential, from a Cloudflare worker to a
database in us-east-1. Only the first is a real dependency. The body parse joins
the auth hop, and quota, session and turns now go in one `Promise.all` — roughly
three cross-network hops off the critical path before the model is even called.

The turns query moving up is the one worth a second look, because it now fires
before the session has been validated: a request naming a nonexistent or
someone-else's session runs a `listen_turns` select that used to be skipped.
That is safe for a specific reason — the select is scoped to `session_id` alone,
so the rows it could return are exactly the rows the session check decides
whether to let anyone act on, and every refusal still happens before a row is
read. The cost of being wrong is one wasted query on a request that was going to
be refused.

**The two writes at the end are deliberately NOT parallelised**, and the comment
says so, because the saving is real and the trade is bad: nothing in the session
update reads the inserted row, so a `Promise.all` would work — and would mean a
failed insert still bumped `turn_count` and still advanced `world_state`. The
next turn would compute its index from a count including a turn nobody can see.

### 24d. No deadline on the interpreter call

There was no abort signal, so a provider request that hung rather than failing
held the turn open until the platform killed the worker: an indefinite spinner
instead of the "try that again" a clean 502 produces, and none of the fallback
ladder ran. Sixty seconds, chosen against the thing it must not interrupt — the
slowest legitimate first pass is well inside it — and a timeout is logged
differently from a dropped connection, because the two want different
investigation.

### 24e. `temperature: 0.9` was doing nothing

Claude Sonnet 5 — which `CORRELATE_MODEL` names — **rejects a non-default
`temperature` outright**. Since turns were landing, the value was being dropped
or normalized upstream, which means the 0.9 had no effect and an uncommented
`temperature: 0.9` was telling every reader the engine had a variety knob it did
not have. Removed. Variety comes from the prompt, which is where the rest of
this engine already puts it.

Worth noting what this does *not* explain: it is not the cause of the §21e
retries, because a parameter the provider rejected would fail every request
identically rather than intermittently.

### 24f. Compression — and why the target moved

Asked for alongside the rest. Two trims that were genuine duplication:

- **Provider brand names** out of the media list. `from Deezer` / `from
  Cleveland Museum of Art` was eight lines the interpreter can do nothing with —
  it never names a provider or chooses one, and the only thing it needs from
  that line (catalogued vs composed) is said once below and enforced by the
  schema.
- **`does` out of the relation list.** Each line was `does. guidance`, and `does`
  is a one-clause summary of the sentence immediately after it — "Follows any
  explainable connection" ahead of "Any connection is admissible so long as you
  can say what it is." It is written for the *picker*, where it appears without
  the guidance beside it, and it still does that job there.

14,068 → 13,278 characters. 790, which is modest, and the honest reason it is
modest is that **the remaining bulk is not padding.** The three longest blocks —
reading a record you cannot perceive, the propositional naming rule, the
weighting — are each several paragraphs documenting a specific observed failure
with its reason. §16 and §17b of this document are about what happens when that
prose is paraphrased or duplicated; cutting it for length would be the same
mistake from the other direction.

**And caching moved the target.** The 13.3kB prefix now bills at roughly a tenth
and prefills from cache, so compressing it further is the low-value
optimisation. What is paid in full every turn is the 2.3–3.6kB volatile half —
which is mostly the OUTPUT schema, the one part that cannot be cut. If prompt
size is worth another pass, that is where it is now, and it is a much smaller
target than the number at the top of this section suggested.
