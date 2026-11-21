# RPG mode and the concept graph

The design for joining the two halves of `/learn` that currently share a
database and nothing else: the journey across Armat, and the practice engine
that rules on work.

Status: design. Nothing here is built. It supersedes no existing behaviour —
every mechanism it proposes sits *between* parts that already exist and
already work, which is the reason it is tractable.

---

## 1. Where the seam actually is

RPG mode today is a real loop and a closed one:

- a journey over `composeAtlas([], ONTOLOGIES)` — 63 concepts, 10 authored
  subjects, reaching 5 of the 21 regions
- travel by offering a concept you hold; `offerKey` picks the door, and two
  gates decide whether it opens: the structure (`offerKey`) and the strength
  table (`conceptStrength >= MASTERY_FLOOR`, 0.75)
- a table where a game master narrates, calls for tag rolls, and the server
  rolls them

The practice engine is also a real loop and also a closed one: `assemble()`
picks tasks, the learner works them, the verifier rules `correct`,
`incorrect`, `inconclusive` or `abandoned`, and `strength` moves.

They touch in exactly one place, invisibly. Practising moves strength;
strength is the second gate; so practice silently changes which roads open.
Nothing tells the learner that, and nothing in the fiction knows it happened.

Everything below follows from treating that one invisible connection as the
thing to make visible, rather than as a feature to add alongside.

### What this keeps

- **The traversal rules and the GM narrates.** Established in
  `lib/concepts/narrate.ts` and non-negotiable: a model that could decide
  whether a prerequisite was met would be a learning system gated on a
  language model's opinion.
- **The server rolls, not the model and not the browser.** Established in
  `/api/learn/table`.
- **The refusal is the reply.** `lib/concepts/traversal.ts` says prerequisite
  scope is the one thing that must never relax. Nothing here relaxes it.

### What changes

Mathematics becomes something that happens *inside* the fiction. Today the GM
is forbidden from posing any, for a good reason — maths inside fiction is
maths nobody ruled on. That prohibition stays exactly as written. What changes
is that the GM stops being the only thing in the room.

---

## 2. The keystone: a third instance of a pattern already used twice

This codebase has settled the same argument twice, the same way:

| who decides | who describes |
|---|---|
| `offerKey` + the strength gate | the GM narrates the arrival or refusal |
| the server's dice | the GM narrates the result |

The proposal is the third row:

| `assemble()` picks the task, the verifier rules it | the GM frames it and narrates the ruling |

**The GM never authors a problem and never judges an answer.** It receives a
task the scheduler chose and a ruling the verifier made, and writes the scene
around both. That is the entire safety argument, and it is the same one that
already governs dice and doors.

If that one rule holds, mathematics in the fiction is as trustworthy as
mathematics on the Practice tab, because it *is* mathematics on the Practice
tab — differently framed.

---

## 3. The commission

The unit that joins the two halves. A commission is a piece of work a place
needs doing, whose resolution is a real task from that region's subject.

```
commission {
  id
  region            where it was taken
  conceptId         what it is work on
  taskId            the instance assemble() chose
  framing           the GM's in-world description of the work
  state             offered | accepted | ruled | abandoned
  ruling            from the verifier, once there is one
}
```

The loop:

1. The player is in a region. The GM, as now, narrates the place.
2. Something in the scene needs doing, and doing it is mathematics. The
   **engine** picks the concept and the task; the **GM** is handed both and
   writes the ask in the world's terms — a runeforger needs an array checked,
   a factor needs a consignment reconciled.
3. The player works it. The surface is the Practice tab's, unchanged, because
   that surface is where the verifier already lives.
4. The verifier rules. The GM is handed the ruling and narrates what the room
   does about it.
5. Strength moves, exactly as it does today, because step 3 *was* practice.

Nothing in that loop is new machinery except the commission row and the two
hand-offs. The mathematics, the ruling and the strength update are the
existing engine, reached through a door with scenery on it.

### Why the framing must be the GM's and the choice must not

A model asked to invent a task will invent one that sounds good, and the
engine's task selection is doing real work — introducibility, interference,
cooldown, the mastery floor. Letting the fiction choose the concept would
replace a scheduler with a storyteller's sense of pacing.

Letting the fiction *describe* the chosen task costs nothing and is the whole
value: "evaluate `(3² − 1) + (4² − 1)`" and "the quartermaster needs the four
crates reconciled before the gate shuts" are the same task, and only one of
them is a reason to care.

---

## 4. Blocked roads become the reason to practise

Today a refused road says what is missing and then the player is on their own
in another tab. That refusal is the single best prompt the system ever
generates, and it is currently a dead end with a name in it.

```
blocked → missing: [Long division]
        → a commission for long-division, taken here, in this scene
        → work it, verifier rules, strength moves
        → the road opens because the gate is satisfied, not because
          anything was unlocked
```

The last line is the important one. **No new gate, and nothing new that can
open a road.** The road opens because `conceptStrength >= MASTERY_FLOOR`
became true, which is the gate that was always there. The commission is a way
of arriving at the work, not a second key.

This also answers a question the current design dodges: what a player should
*do* about a refusal. At present the honest answer is "go to the Practice tab
and find it yourself".

---

## 5. What the dice do when mathematics is in the room

They must not decide whether an answer is right. The verifier decides that,
and a d10 that could overrule it would undo the engine.

So dice decide the **circumstances**, and the verifier decides the **work**:

| the roll | what it changes |
|---|---|
| fails | the work must still be done, and the room is now against you — less time, a hostile audience, a second party checking |
| barely | you get to it, but under pressure the scene will mention |
| works | ordinary conditions |
| better | something is thrown in: a colleague's notes, a worked precedent, more time |

A bad roll never makes a correct answer wrong, and a good roll never makes an
incorrect one right. What a roll buys is the kind of thing the Practice tab
already models — a hint, in effect — which suggests the concrete mapping:
**`better` may offer assistance, and `assistedOnly` already means something
precise in `summarise()`.** A commission completed with help moves strength
less, as it already does. The fiction and the engine agree without either
being bent.

---

## 6. Inconclusive is a scene, not a failure

The verifier's default ruling is `inconclusive`, deliberately — it refuses
rather than guesses. In fiction that is not a disappointment, it is a
situation: nobody in the room could say whether the figure was right.

It must never be narrated as success, and it must never be narrated as being
wrong. Both are claims the engine explicitly declined to make, and a GM given
a ruling it does not understand will round it to one of them. This needs a
prohibition as plainly worded as the existing four, and a test over the prompt
text like the ones already in `tests/atlas.mjs`.

A good inconclusive scene is one where the question stays open and somebody
has to decide what to do anyway — which is both true to the ruling and more
interesting than either alternative.

---

## 7. Decay, and roads that close

`strength` decays toward its prior. A road that opened can therefore close
again, and today that would read as a bug.

In fiction it is the best thing the mechanic has to offer: a pass you walked
in the spring is washed out, and the reason is that you have not done this in
a while. The system already knows the number; it has simply never had a way to
say so that was not a progress bar.

Two rules make it honest rather than punitive:

- **Say it before it bites.** The map can shade a road that is near the floor,
  which is a thing `conceptStrength` can answer today.
- **Never re-close a road behind the party.** Decay changes what you can
  *reach next*, not where you are standing. Being teleported backwards because
  a timer elapsed is the version of this that makes people stop playing.

---

## 8. The sixteen regions with nothing in them

Only 5 of 21 regions hold authored subjects. The other 16 hold mapped areas
with no material — by construction, since a map node carries no knowledge
points.

Commissions cannot exist there, and pretending otherwise is the failure mode
this whole document is trying to avoid. Three honest options, and they are not
exclusive:

1. **Say so.** A region with nothing written is a place where the work is not
   yet recorded. The map already shades by coverage; the table can say it.
2. **Let them be travelled through.** Scenes, NPCs, weather, no commissions.
   This is what the table does today and it is not nothing.
3. **Make them the reason to author.** The frontier at Nadda-zalan is already
   defined as the place the atlas runs out. A region a player wants a
   commission in and cannot have one is the most specific authoring request
   the system could produce.

Option 3 is the interesting one and costs nothing to collect: a counter of
which empty regions players tried to work in is a ranked list of what to write
next, derived from demand rather than from the promotion heuristics that
`bza_promotion_line_ran_out` says have been spent.

---

## 9. Persistence

The table log lives in `localStorage`, keyed per region, and that was right
for a transcript. A commission is not a transcript: it has a state machine, it
outlives a tab, and a verifier ruling has to find its way back to it.

Commissions belong where the traversal lives — a table beside
`concept_traversals`, keyed by user. That also makes the demand counter in §8
a query rather than a feature.

The scene log can stay in the browser. The two are different kinds of thing
and the split is the existing one: **the journey is state, the story is a
transcript.**

---

## 10. What must not happen

A list, because every item is a specific way this could go wrong and each one
is cheap to test for:

- **Mathematics the verifier never saw.** If a scene contains a sum, the sum
  came from `assemble()` and the answer went to the verifier. No exceptions,
  including "the NPC does the arithmetic out loud".
- **A GM that judges.** It receives rulings. It does not form them, soften
  them, or hint at them before they exist.
- **Dice that open roads.** `rollFor` reads no concept graph and writes to
  none. That property is currently true and is worth asserting.
- **A commission that cannot be completed.** Offered only where a subject has
  material and the concept is introducible — the same question `assemble()`
  already answers.
- **Congratulation.** The existing prohibition stands and gets harder here: a
  scene that follows a `correct` ruling is the most tempting place in the
  product to tell somebody they have mastered something, and mastery is a
  number with a floor, not a feeling.
- **A second progress system.** No XP, no levels. The strength table is the
  progression and a parallel one would immediately disagree with it.

---

## 11. Open questions

Genuinely open, in rough order of how much they block:

1. **Does the player choose the commission, or the region?** Choosing the
   concept is the Practice tab with a costume on. Choosing nothing is a
   railroad. The middle — the region offers two or three and you pick — is
   probably right and is untested.
2. **How does a commission end if the player walks away?** `abandoned` is
   already a ruling the verifier can produce, which suggests the answer, but
   abandoning in fiction should probably cost something the fiction remembers.
3. **Is the Practice tab still a separate tab?** If every task can be reached
   through a scene, the flat list is either redundant or the thing serious
   users actually want. My instinct is that it stays and the two are different
   moods, but that is an instinct.
4. **What happens to a commission when the concept's material changes?** The
   authoring cron edits subjects daily. A stored `taskId` can go stale, which
   is the same class of problem as the stale model ids in
   `scripts/check-models.mjs` — and wants the same treatment: a check that
   fails loudly rather than a row that quietly points at nothing.
5. **Does any of this want multiplayer?** Almost certainly not, and it is
   worth writing down that it was considered and declined, because "a party"
   is a word this design uses throughout and somebody will read it literally.

---

## 12. The smallest version worth building

If only one thing is built from this document, it should be §4 — the blocked
road that hands you the work.

It needs no commission table, no new state machine and no change to the GM's
prohibitions. The refusal already names the missing concept; the Practice tab
already serves tasks for a named concept; the strength gate already opens the
road when the work is done. The whole of it is a button on a refusal and a
sentence from the GM when you come back.

It is also the one that tests the premise. If a player, told a road is closed
and handed the thing that closes it, goes and does the work — then mathematics
inside the fiction is worth building. If they do not, the rest of this
document is scenery.
