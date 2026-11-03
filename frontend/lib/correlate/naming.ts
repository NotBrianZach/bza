/**
 * What a game is called.
 *
 * Every session was titled after its own game type, so a player with four games
 * of Tag had four rows all reading "Tag" — which names the rules rather than the
 * game, and the rules are the one thing already shown by the chip beside the
 * title. A chain is much closer to a playlist: what it is *about* is whatever it
 * started from.
 *
 * Pure and here rather than inline in the turn route, because the interesting
 * part is a rule about when NOT to act, and a rule about restraint is exactly
 * the kind that gets quietly dropped during a refactor unless something asserts
 * it.
 */

/**
 * Whether a title is still the one `createSession` assigns by default.
 *
 * The whole safety of auto-naming rests on this. `createSession` falls back to
 * the game definition's own name when the player types nothing, so a title equal
 * to that name means nobody has chosen one — and any other value was either
 * typed at creation or set by a rename, in which case it belongs to the player
 * and the engine must not touch it.
 *
 * Comparing against the game name rather than against an empty string is what
 * makes those two cases distinguishable at all. A blank-title convention would
 * have been simpler and would have thrown away the distinction, leaving no way
 * to tell "unnamed" from "named, coincidentally, after the game".
 *
 * Trimmed and case-insensitive: the comparison is about provenance, and
 * "tag" with a trailing space did not come from a person who meant something
 * different by it.
 */
export function isDefaultTitle(title: string | null | undefined, gameName: string): boolean {
  return (title ?? '').trim().toLowerCase() === gameName.trim().toLowerCase()
}

/** The longest a generated title may be. Long enough for a real work's name. */
export const MAX_AUTO_TITLE = 120

/**
 * What to say as a track starts, in radio with narration on.
 *
 * ── Why the name comes first and the reading second ──────────────────────
 *
 * The reading talks *about* the track, so hearing it without knowing what is
 * playing is hearing the second half of a sentence — the same ordering `absorb`
 * uses when it speaks a landed turn. A listener who recognises the record from
 * its name stops needing the rest.
 *
 * ── Why only the first sentence of the reading ───────────────────────────
 *
 * This is spoken into a gap the music has been paused to make, so every word
 * costs silence in the thing the player actually came for. A preview is thirty
 * seconds; a six-sentence reading is twenty. The first sentence is the claim and
 * the rest is the argument for it, and the board is still there for the
 * argument.
 *
 * Returns null when there is nothing worth stopping the music for — which is
 * most composed offerings, where the title IS the content and announcing it
 * would read the player their own words back.
 */
export function announcementFor(
  offering: { title?: string | null; attribution?: string | null; origin?: string },
  reading: string | null,
  opening: (text: string) => { opening: string } = (t) => ({ opening: t }),
): string | null {
  const title = (offering.title ?? '').trim()
  if (!title) return null
  const named = offering.attribution?.trim()
    ? `${title}, ${offering.attribution.trim()}.`
    : `${title}.`
  const rest = (reading ?? '').trim()
  if (!rest) return named
  return `${named} ${opening(rest).opening}`.trim()
}

/**
 * The title to give a game whose first move has just landed, or null to leave it.
 *
 * Null in every case where there is any doubt, which is most of them:
 *
 *  - not the first turn. A later turn renaming the game would change a label
 *    while the player was looking at it, and once a game branches "the first
 *    turn" stops being well defined anyway.
 *  - the player has already named it. See `isDefaultTitle`.
 *  - the offering has no usable title, which no catalogue should produce but a
 *    composed offering with a blank field could.
 *
 * Named after the MOVE rather than the reply. The move is what the player chose,
 * and a playlist is named after what you put in it, not after what came back. On
 * a first turn that is a self-reply the move is the partner's own offering, which
 * is still the thing the game opened on.
 */
export function autoTitleFor(opts: {
  turnIndex: number
  currentTitle: string | null | undefined
  gameName: string
  moveTitle: string | null | undefined
}): string | null {
  if (opts.turnIndex !== 0) return null
  if (!isDefaultTitle(opts.currentTitle, opts.gameName)) return null
  const name = (opts.moveTitle ?? '').trim()
  if (!name) return null
  return name.slice(0, MAX_AUTO_TITLE)
}
