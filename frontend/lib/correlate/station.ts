/**
 * The station — a radio that picks by listening data instead of by reading.
 *
 * ── What it is, and why it is not a second "keep going" ───────────────────
 *
 * "Keep going" is the partner answering itself: every song is a reading of the
 * one before it, chosen by the interpreter, costing a model call and carrying a
 * claim about why the two belong together. That is the game.
 *
 * This is the other thing a radio can mean, and the older one. A station plays
 * something, then plays something that goes with it, and nobody is arguing.
 * The picks come from Deezer's own artist flow — what people who listen to this
 * listen to next — so a song costs one HTTP request, no tokens, and makes no
 * claim at all.
 *
 * ── The label has to be honest, and the obvious label is not ─────────────
 *
 * It is tempting to call this "songs that sound like this one". Nothing here
 * has heard anything. No waveform is examined, no key or tempo is read; the
 * signal is **co-listening**, which is a fact about audiences rather than about
 * audio. Two records that sound nothing alike sit next to each other in this
 * data all the time, and that is not a defect — it is what the data is.
 *
 * So `STATION_BASIS` is the sentence shown to a player, and it says where the
 * pairing came from rather than implying an ear. This matters more here than it
 * would in most apps: the whole engine next door is built to keep a *claimed*
 * connection separable from a real one, and a feature that quietly claimed to
 * hear similarity would be the first thing in it that lied.
 *
 * ── Its picks ARE turns, and that was a reversal ──────────────────────────
 *
 * They were queue entries first, on the reasoning that a turn is a claimed
 * connection with a reading and a station pick has neither. The first half of
 * that is still true and the conclusion was wrong: the cost of keeping these
 * out of the chain was that they appeared in no tree, were absent from every
 * share link, and could not be answered or branched from like everything else
 * a chain contains. Parity with "keep going" is worth more than a table in
 * which every row happens to be a judgement.
 *
 * What makes a station turn honest is what it leaves EMPTY, not anything it
 * asserts: no relation, no claim, no reading, no facts, no world delta. The
 * sentence a player sees is DERIVED from `move_by === 'station'` — see
 * `STATION_BASIS` — rather than stored as prose, so it cannot drift from the
 * thing it describes, and nothing anywhere writes a reading nobody read.
 *
 * Full reasoning, including why `legal` stays true, is in migration 79.
 */

import type { CorrelationTurn, Offering } from './types'

export const STATION_LABEL = 'Station'

export const STATION_HINT =
  'Keeps playing. Each song is one that goes with the last, taken from the ' +
  'catalogue rather than chosen by your partner — so it costs nothing and makes ' +
  'no claim. Nothing it plays enters the chain.'

/**
 * Where the pairings come from, in one sentence a player can check.
 *
 * Rendered next to the control and next to the queue. See the module comment
 * for why it says "listen to" and not "sounds like".
 */
export const STATION_BASIS =
  'Picked from what Deezer’s listeners play alongside this artist — audience ' +
  'data, not a judgement about the sound.'

/**
 * What the station needs before it can play anything.
 *
 * Music specifically, and not merely "something audible": the flow it draws on
 * is a music catalogue keyed on a music artist, so a chain of film scenes has
 * nothing to seed it with even though those have sound. A sentence rather than
 * a boolean, like `radioRefusal`, because the fix is a thing the player has to
 * go and do.
 */
export function stationRefusal(media: readonly string[]): string | null {
  return media.includes('music')
    ? null
    : 'The station is a music catalogue, so this game needs music in play before ' +
      'it has anywhere to start.'
}

/**
 * How many songs to keep ahead of the one playing before taking another turn.
 *
 * Two, which is `RADIO_LOOKAHEAD`, and matching it is the point rather than a
 * coincidence. Each pick is now a TURN, so queueing far ahead means writing
 * chain the listener has not reached — and a chain that runs four songs ahead
 * of the playhead is four turns a player has to scroll back through to find
 * where they actually are. Two keeps the audio from gapping and nothing more.
 *
 * It was 4 while picks were queue entries and nothing was recorded, where the
 * only cost of a long queue was staleness.
 */
export const STATION_LOOKAHEAD = 2

/**
 * The track a station should start from, and its artist if the row carries one.
 *
 * The most recent audible music offering, which is the honest seed: a station
 * plays on from what you just heard. Walked from the end backwards rather than
 * taking the chain's last item, because the last item may be a painting or a
 * passage and those cannot seed a music flow.
 *
 * `artistId` is read from `meta` when it is there and left null when it is not —
 * rows written before that field existed simply cost the provider one extra
 * lookup. Returning it rather than resolving it here keeps this function pure.
 */
/**
 * Whether this turn was taken by the station.
 *
 * Its own function rather than `turn.move_by === 'station'` at nine call sites,
 * for the same reason `isSelfReply` exists: rows written before migration 79
 * have no idea this value is possible, and every reader of the column should go
 * through one place that knows what a missing value means.
 */
export function isStationTurn(turn: Pick<CorrelationTurn, 'move_by'> | null): boolean {
  return turn?.move_by === 'station'
}

/**
 * The line shown in place of a reading on a station turn.
 *
 * There is no reading, and this is not one — it states what happened and makes
 * no claim about the pairing. Kept here beside `STATION_BASIS` so the two
 * cannot disagree, and derived at render time from `move_by` rather than stored
 * on the row: a sentence in the database would be prose nobody wrote, and the
 * first thing to go stale if the source ever changes.
 */
export const STATION_TURN_LINE =
  'The station played this one next. Nothing read the pair — they are paired by ' +
  'what listeners play together.'

export function stationSeed(
  chain: readonly Offering[],
): { trackId: string; artistId: string | null } | null {
  for (let i = chain.length - 1; i >= 0; i--) {
    const o = chain[i]
    if (o.medium !== 'music') continue
    if (o.perceptible.kind !== 'audio') continue
    const artistId = typeof o.meta?.artistId === 'string' ? o.meta.artistId : null
    return { trackId: o.id, artistId }
  }
  return null
}
