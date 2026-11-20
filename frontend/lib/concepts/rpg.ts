/**
 * The table: a character, tags, dice, and a turn.
 *
 * RPG mode had a game master but not a game you could sit down at. You could
 * travel and be told what the city looked like; you could not say "I ask the
 * runeforger to show me the shield array" and find out what happens. This is
 * the half that makes it Armat Sur rather than a narrated map — the same
 * mechanics the tabletop setting runs on, which is deliberate: that system is
 * already written, already playtested, and already in the rulebook that ships
 * with the game.
 *
 * ── THE TAG SYSTEM, VERBATIM FROM THE SETTING ─────────────────────────────
 *
 * An action is resolved by agreeing which tags bear on it, marking each with a
 * tier, and rolling. The markers are the setting's own and are not negotiable
 * here, because a player who has read the rulebook must not find different
 * dice on this side:
 *
 *   #  flat 1   a thing that is simply true and adds a little
 *   ~  d3       a minor factor
 *   (none) d6   the ordinary case
 *   +  d10      a major factor
 *
 * Subtract what opposes. The bands are the "Everyday rolls" bands, which are
 * themselves the aether bands: at or below 0 it fails and costs something,
 * 1-3 it barely works, 4-7 it works, 8+ it works better than asked.
 *
 * ── WHAT YOUR TAGS ARE ────────────────────────────────────────────────────
 *
 * In Armat Sur a character sheet is written by a player. Here, half of it is
 * EARNED: every concept you have reached in the traversal is a tag you carry,
 * because that is the thing this app actually knows about you. Nobody types
 * "Long division" onto their sheet; you get it by arriving at it, and the
 * traversal is what decides that.
 *
 * The other half is flavour you choose, and it is flavour only — `BACKGROUNDS`
 * carry no mechanical weight the mathematics does not. A background that gave
 * +d10 to anything would be a way to buy your way past a prerequisite with a
 * dropdown.
 *
 * ── WHAT THE DICE MAY NOT DECIDE ──────────────────────────────────────────
 *
 * Dice resolve ACTIONS IN THE FICTION. They never decide whether you know
 * something, whether a road opens, or whether an answer is right. Those belong
 * to the traversal and the verifier, and a d10 that could open a prerequisite
 * would undo the one guarantee this whole engine is built on. So `rollFor`
 * takes a tag expression and returns numbers; nothing here reads the concept
 * graph and nothing here writes to it.
 */

/** The four tiers, as the rulebook's markers. */
export type Tier = '#' | '~' | '' | '+'

export const SIDES: Record<Tier, number> = { '#': 1, '~': 3, '': 6, '+': 10 }

export interface Tag {
  name: string
  tier: Tier
  /** Subtracted rather than added — difficulty, opposition, your own state. */
  against?: boolean
}

export interface RollResult {
  /** "d6 + d3 - d10", in the order the tags were given. */
  dice: string
  /** The individual draws, same order, so each die maps to its tag. */
  results: number[]
  total: number
  band: 'fails' | 'barely' | 'works' | 'better'
  /** The sentence the band means, from the rulebook. */
  reading: string
}

const BANDS: { at: number; band: RollResult['band']; reading: string }[] = [
  { at: 8, band: 'better', reading: 'It works better than intended, or turns up something extra.' },
  { at: 4, band: 'works', reading: 'It works as intended.' },
  { at: 1, band: 'barely', reading: 'It works, barely — slower, louder, costlier, or partial.' },
  { at: -Infinity, band: 'fails', reading: 'It fails, and the situation is worse for having tried.' },
]

export function readBand(total: number): { band: RollResult['band']; reading: string } {
  const hit = BANDS.find(b => total >= b.at) ?? BANDS[BANDS.length - 1]
  return { band: hit.band, reading: hit.reading }
}

/**
 * Roll a set of tags.
 *
 * `draw` is injected so the dice are testable and so the SERVER can own them.
 * A roll decided in the browser is a roll the player can re-roll by editing a
 * variable, which is fine in a single-player game and is still not what this
 * should be: the point of a table is that the dice are not yours to adjust.
 */
export function rollFor(tags: Tag[], draw: (sides: number) => number): RollResult {
  const parts: string[] = []
  const results: number[] = []
  let total = 0

  tags.forEach((tag, i) => {
    const sides = SIDES[tag.tier]
    const value = sides === 1 ? 1 : draw(sides)
    const sign = tag.against ? -1 : 1
    const lead = i === 0 ? (tag.against ? '-' : '') : (tag.against ? ' - ' : ' + ')
    parts.push(lead + (sides === 1 ? '1' : `d${sides}`))
    results.push(sign * value)
    total += sign * value
  })

  return { dice: parts.join(''), results, total, ...readBand(total) }
}

/** A fair d-sides, for the server. */
export const fairDraw = (sides: number) => 1 + Math.floor(Math.random() * sides)

/**
 * Who you are, beyond what you know.
 *
 * Flavour with no mechanical weight, which is the whole design — see the
 * header. It gives the game master somebody to write about and gives the
 * player a reason to be in the room, and it must never be a way to roll
 * better at mathematics you have not done.
 */
export const BACKGROUNDS = [
  { id: 'scribe', name: 'Scribe', is: 'Trained to copy, check and argue over a figure. You read fast and trust ink.' },
  { id: 'surveyor', name: 'Surveyor', is: 'You have measured real ground in bad weather and know what a wrong number costs.' },
  { id: 'factor', name: 'Factor', is: 'You buy and sell on other people\'s behalf, and you have been cheated exactly once.' },
  { id: 'runewright', name: 'Runewright', is: 'An apprentice of the conducting trades. Your hands are burned and your notes are immaculate.' },
  { id: 'navigator', name: 'Navigator', is: 'You have brought a ship in by angle and argument, and you distrust landmarks.' },
] as const

export type BackgroundId = typeof BACKGROUNDS[number]['id']

export interface Character {
  name: string
  background: BackgroundId
}

export const DEFAULT_CHARACTER: Character = { name: '', background: 'scribe' }

export function backgroundOf(id: string) {
  return BACKGROUNDS.find(b => b.id === id) ?? BACKGROUNDS[0]
}

/**
 * The sheet, as the game master is shown it.
 *
 * Concepts are listed as tags because that is what they are at this table.
 * Capped: a sheet of sixty tags is a context window spent on a list, and the
 * most recently earned are the ones a scene is likely to be about.
 */
export function sheetFor(
  character: Character, held: string[], here: string, maxTags = 12,
): string {
  const bg = backgroundOf(character.background)
  const recent = held.slice(-maxTags)
  const lines = [
    `NAME: ${character.name.trim() || 'a traveller'}`,
    `BACKGROUND: ${bg.name} — ${bg.is}`,
    `STANDING IN: ${here}`,
  ]
  if (recent.length > 0) {
    lines.push(`TAGS EARNED (${held.length} in all, most recent last): ${recent.join(', ')}`)
  } else {
    lines.push('TAGS EARNED: none yet. They carry nothing but what they have learned on the way.')
  }
  return lines.join('\n')
}
