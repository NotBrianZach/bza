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
  always carries a real reply.

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
- **The reply guarantee already applies.** Three stages, then the turn is
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
