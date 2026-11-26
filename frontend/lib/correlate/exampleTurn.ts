/**
 * One worked exchange, written out, for a player who has never taken a turn.
 *
 * This exists because /play used to open on an argument. Two bullets explained
 * the loop, a third pointed at the cards, and two registry cards listed the
 * twelve media and the seven relations — sixty lines of prose above the first
 * thing anybody could click. Every sentence was true and none of it was
 * learnable in that form: "a turn proposes a connection and makes it
 * perceptible" means nothing until you have seen one turn.
 *
 * So the explanation is now an example. The registries are still reachable (the
 * disclosure on /play holds them), but what greets a new player is two turns of
 * a real-shaped game with the relation named where it was actually used.
 *
 * ── Why the WRITING is hard-coded, and must stay hard-coded ───────────────
 *
 * The reading, the relation, the carried and the lost are authored here and
 * must never come from a session. The works they are about are fetched; see
 * the `resolve` section below for where that line falls and why.
 *
 * It would be tempting to seed a real session and show that instead. Three
 * reasons not to:
 *
 *  1. The honesty guards. A reply on this page did not come back from the turn
 *     route, so it must never be rendered as though it had. Labelling it an
 *     example in the UI is the only defensible presentation, and once it is
 *     labelled an example there is nothing for a database row to add.
 *  2. Every catalogue here is a live third-party search. A seeded session would
 *     go stale the first time Deezer re-ids a track, and the failure would be
 *     silent — a tutorial with a dead player and no error.
 *  3. A new player has no library, so `passage` cannot appear in an example
 *     that is supposed to be reproducible by the person reading it. The two
 *     media below are the two keyless catalogues, plus one composed medium that
 *     needs no provider at all.
 *
 * The works named are real and uncontroversially so, because a fabricated
 * painting in a teaching example is the kind of small lie that this section's
 * whole design is against.
 *
 * ── `resolve`: the works are FETCHED now, and reason 2 is why it is a search ──
 *
 * This file used to end "Nothing fetches them: they are here to be read", and
 * an example of a game about making a connection PERCEPTIBLE was the one place
 * on the page where nothing could be perceived. You read that Clair de Lune is
 * unresolved and that Monet's surface stops being readable as sky, and saw
 * neither. So the two catalogued works now carry a `resolve` and `ExampleChain`
 * renders them through `OfferingCard` — the same component the board uses.
 *
 * Reason 2 above is not waived by that, it is what dictates the mechanism. A
 * hard-coded Deezer id is exactly the dead player it warns about, so there is
 * no id here: `q` is a SEARCH, run at render against the same
 * /api/offerings/search the picker uses, and a miss falls back to the written
 * card this file already supported. The staleness mode that worried reason 2
 * therefore degrades to the previous behaviour instead of breaking.
 *
 * `expect` is the guard that makes the search safe to trust. A catalogue search
 * always returns SOMETHING, so without it a re-indexed provider would hand the
 * tutorial a confident, beautifully rendered, completely unrelated track — a
 * worse failure than the dead player, because it looks like it worked. A result
 * whose title does not contain `expect` is discarded and the written card
 * stands.
 *
 * `expectBy` CHECKS THE ATTRIBUTION, and it exists because matching the title
 * alone was not enough and shipped wrong. Deezer's first hit for "Clair de Lune
 * Debussy" is a compilation whose artist field reads **Frédéric Chopin** — the
 * title guard passed it, and /play spent a deploy telling visitors that Chopin
 * wrote Clair de Lune. That is precisely the "small lie" this file's own note
 * says the section is designed against, arriving through the mechanism added to
 * avoid it.
 *
 * The lesson generalises past this one track: a catalogue's metadata is a claim
 * by a third party, and the half of it you did not check is the half that will
 * be wrong. Both fields are authored here, so both are verified. Searching with
 * the composer's name in `q` is NOT a substitute — that is what ranked the
 * Chopin row first.
 *
 * The recording will not be the same one twice and that is fine: `title` and
 * `attribution` below are what the example CLAIMS, and any real performance of
 * the piece satisfies the claim. `framing` is different — it names the part in
 * play ("before the left hand arrives"), it is what the reading is about, and
 * the catalogue has no opinion on it. ExampleChain keeps the authored one.
 *
 * ── Why the types come from the registries ────────────────────────────────
 *
 * `medium` and `relation` are the registry ids, not strings. A relation renamed
 * or retired in lib/correlate/relations.ts is a compile error here rather than
 * a tutorial quietly teaching a move the engine no longer has — which is the
 * exact way the old intro prose rotted, stating as universal two things that
 * had become per-game.
 */

import type { MediumId, RelationId } from './types'

export interface ExampleMove {
  medium: MediumId
  title: string
  /** Null for a composed move, which has no author but the player. */
  attribution: string | null
  /** Which part of it is in play. Never "all of it" — see `Offering.framing`. */
  framing: string
  /** Composed media only: what the player would actually be asked to do. */
  steps?: string[]
  /**
   * How to find the real work, for the catalogued media. Absent for composed
   * ones — a gesture has no catalogue and nothing to fetch.
   *
   * `q` is handed to /api/offerings/search as typed. `expect` and `expectBy`
   * are matched case-insensitively against the returned title and attribution,
   * and a result failing either is dropped rather than shown. See the
   * `resolve` section in the file header for why this is a query and not an
   * id, and for the wrong-composer bug that `expectBy` exists to stop.
   */
  resolve?: { q: string; expect: string; expectBy: string }
}

export interface ExampleTurn {
  move: ExampleMove
  /** What the interpreter made of the move, in its voice. */
  reading: string
  /** The relation the reply used, as it would have been ruled. */
  relation: RelationId
  reply: ExampleMove
  /** What survived the change of medium. */
  carried: string
  /** What did not. Naming this is half of playing well. */
  lost: string
}

/**
 * Two turns, because one turn cannot show the thing that makes this a game:
 * the reply becomes the next move. The first is a change of medium between two
 * catalogues; the second leaves the catalogues entirely for something the
 * player does with their own body, which is the move nobody guesses is
 * available.
 */
export const EXAMPLE_CHAIN: ExampleTurn[] = [
  {
    move: {
      medium: 'music',
      title: 'Clair de Lune',
      attribution: 'Claude Debussy',
      framing: 'The opening, before the left hand arrives — about twenty seconds.',
      resolve: { q: 'Clair de Lune Debussy', expect: 'clair de lune', expectBy: 'debussy' },
    },
    reading:
      'Held, unhurried, and deliberately unresolved: the phrase keeps declining to land on ' +
      'the note you expect, so the attention stays suspended rather than satisfied.',
    relation: 'translation',
    reply: {
      medium: 'artwork',
      title: 'Water Lilies (Agapanthus)',
      attribution: 'Claude Monet',
      framing: 'The surface at the centre, where the reflections stop being readable as sky.',
      resolve: { q: 'Water Lilies Agapanthus Monet', expect: 'water lilies', expectBy: 'monet' },
    },
    carried:
      'The suspension. Neither one resolves — the eye finds no edge to settle on, the way ' +
      'the phrase finds no note.',
    lost:
      'The order. The music arrives in a sequence you cannot skip; the painting hands you ' +
      'everything at once and lets you choose where to begin.',
  },
  {
    move: {
      medium: 'artwork',
      title: 'Water Lilies (Agapanthus)',
      attribution: 'Claude Monet',
      /* The same work, deliberately with a different framing: it is the answer
         in turn 1 and the thing being answered in turn 2, which is the whole
         point of showing two turns. Same `resolve`, so it is the same fetch and
         the same picture — `ExampleChain` caches by `q`. */
      framing: 'The same centre — now as the thing being answered rather than the answer.',
      resolve: { q: 'Water Lilies Agapanthus Monet', expect: 'water lilies', expectBy: 'monet' },
    },
    reading:
      'A surface with no fixed footing. Read as an instruction rather than an image, it asks ' +
      'for weight that is never quite committed.',
    relation: 'embodiment',
    reply: {
      medium: 'gesture',
      title: 'Standing on an unmade decision',
      attribution: null,
      framing: 'Thirty seconds, standing, eyes open.',
      steps: [
        'Stand with your weight evenly on both feet.',
        'Shift about a tenth of it onto the left foot — far less than a step.',
        'Hold there without correcting, and notice that nothing has settled.',
      ],
    },
    carried: 'The refusal to settle, now as something you are doing rather than something you perceive.',
    lost:
      'The beauty. The painting is lovely and the posture is mildly uncomfortable, which is ' +
      'the honest cost of carrying a quality into a body.',
  },
]
