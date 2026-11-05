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
 * ── It writes no turns, on purpose ───────────────────────────────────────
 *
 * A turn is a claimed connection with a reading, judged legal or not. A station
 * pick has no claim, no reading and nothing judged it, so recording one as a
 * turn would mean inventing both — and then the tree, the share link and the
 * duplicate-rate measurements would all be counting fabrications as exchanges.
 * The station feeds the player's queue and leaves the chain alone. The cost of
 * that choice is real and worth stating: station songs do not appear in the
 * tree and are not part of what a share link shows.
 */

import type { Offering } from './types'

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
 * How many picks to keep queued ahead of the one playing.
 *
 * Small on purpose. The station is cheap, so the temptation is to queue twenty
 * — but a long queue is a commitment: everything in it was chosen from a seed
 * that is now several songs old, so a listener who moves somewhere else is
 * stuck hearing where they used to be. Four is enough that the music never
 * gaps and short enough that the station follows.
 */
export const STATION_LOOKAHEAD = 4

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
