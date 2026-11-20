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

/**
 * The core species, with the tags the setting gives each of them.
 *
 * Taken from the rulebook's own "Core X Tags" sections, tiers included,
 * because they are real tags in that system and a player who has read it
 * should find the same ones here. A curated subset: the lists are longer, and
 * the omissions are the entries the content pass removed from the book's own
 * mechanical sections, which have no place in a maths app either.
 *
 * ── Racial tags are mechanical, and that is NOT the thing the earlier note
 *    forbids ───────────────────────────────────────────────────────────────
 *
 * `BACKGROUNDS` says a background must carry no mechanical weight, and the
 * reason given is that it would be a way to buy past a prerequisite from a
 * dropdown. These tags DO have weight, and the two positions are consistent
 * because of what they weigh: a tag can be offered to the game master for a
 * roll about climbing a wall or talking a guard round, and no tag, tier or
 * die anywhere in this file touches the traversal. Dice settle fiction; what
 * you know is settled by the verifier, on work. `rollFor` reads no concept
 * graph and writes to none, which is the whole guarantee.
 */
export const RACES = [
  {
    id: 'human', name: 'Human',
    is: 'The most numerous, and the most adaptable. Durel, Rusi and Velmond between them hold most of the city states.',
    tags: [
      { name: 'Fatalist', tier: '~' as Tier, is: 'Human psychology steadies them in the face of certain death.' },
      { name: 'Coping', tier: '~' as Tier, is: 'Better at handling extreme stress than the other core species.' },
    ],
  },
  {
    id: 'elf', name: 'Elf',
    is: 'Aether runs closer to the surface in them, at a cost they pay quietly.',
    tags: [
      { name: 'Aether metabolization', tier: '~' as Tier, is: 'A minor metabolization granting strength, at a price.' },
      { name: 'Supple flesh', tier: '~' as Tier, is: 'Elastic tissue, capable of far finer articulation.' },
    ],
  },
  {
    id: 'dwarf', name: 'Dwarf',
    is: 'Stout, dense and difficult to move, in body and in opinion.',
    tags: [
      { name: 'Dwarf strength', tier: '' as Tier, is: 'Strength out of all proportion to their size.' },
      { name: 'Blunt', tier: '#' as Tier, is: 'Subtlety does not come naturally.' },
      { name: 'Respect for authority', tier: '~' as Tier, is: 'They rarely break rank with an authority they recognise.' },
    ],
  },
  {
    id: 'goblin', name: 'Goblin',
    is: 'Forest, mountain and outland — small, rearrangeable, and harder to frighten than is sensible.',
    tags: [
      { name: 'Yielding anatomy', tier: '' as Tier, is: 'Joints that rearrange, which makes them adept in tight spaces.' },
      { name: 'Fearless', tier: '~' as Tier, is: 'They refuse to acknowledge danger until it is made plain.' },
      { name: 'Simple speech', tier: '' as Tier, is: 'A disdain for long sentences, endearing or maddening.' },
    ],
  },
] as const

export type RaceId = typeof RACES[number]['id']

export function raceOf(id: string) {
  return RACES.find(r => r.id === id) ?? RACES[0]
}

export interface Character {
  name: string
  background: BackgroundId
  race: RaceId
  /**
   * One thing true about them that nobody else chose.
   *
   * Free text, and it is the field that makes the sheet theirs rather than a
   * selection from four menus. Offered to the game master as a tag like any
   * other, which is what keeps it from being decoration — "afraid of water"
   * should be able to go wrong in a scene.
   */
  trait: string
}

export const MAX_TRAIT = 48

/**
 * Whether this character has been made, as opposed to defaulted into.
 *
 * A name is the test, because it is the one field with no sensible default: a
 * race and a background can be first-in-the-list and mean nothing, and a
 * nameless character is how you can tell nobody has been through the door
 * yet. Used to decide whether to open on creation or on the table.
 */
export function isMade(c: Character): boolean {
  return c.name.trim().length > 0
}

export const DEFAULT_CHARACTER: Character = {
  name: '', background: 'scribe', race: 'human', trait: '',
}

/**
 * Any object shaped roughly like a character, made into one.
 *
 * Two callers need this and neither can be trusted to have all the fields.
 * `/api/learn/table` does `(body?.character ?? {}) as Character` — a cast over
 * a request body, so a client that omits the field hands `sheetFor` an empty
 * object. And localStorage holds sheets written by older builds: a character
 * was a name and a background before it was a name, a race, a trade and a
 * trait, and `trait.trim()` on one of those throws.
 *
 * Both were live. The second was caught by a test that constructed the old
 * shape; the first would have been a 500 on a malformed request.
 */
export function normalizeCharacter(input: unknown): Character {
  const c = (input ?? {}) as Partial<Record<keyof Character, unknown>>
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' ? v : fallback
  return {
    name: str(c.name, ''),
    background: (BACKGROUNDS.some(b => b.id === c.background)
      ? c.background : DEFAULT_CHARACTER.background) as BackgroundId,
    race: (RACES.some(r => r.id === c.race) ? c.race : DEFAULT_CHARACTER.race) as RaceId,
    trait: str(c.trait, '').slice(0, MAX_TRAIT),
  }
}

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
  character: Character | unknown, held: string[], here: string, maxTags = 12,
): string {
  /* Normalised first: this is reached from a request body and from storage
     written by older builds, and neither guarantees the fields exist. */
  const c = normalizeCharacter(character)
  const bg = backgroundOf(c.background)
  const race = raceOf(c.race)
  const recent = held.slice(-maxTags)
  const lines = [
    `NAME: ${c.name.trim() || 'a traveller'}`,
    `RACE: ${race.name} — ${race.is}`,
    `BACKGROUND: ${bg.name} — ${bg.is}`,
    `STANDING IN: ${here}`,
  ]

  /*
   * The inherent tags, written as the setting writes them — marker inside the
   * name, so the game master can lift one straight into a ROLL line without
   * having to work out a tier. Their meanings ride along because a tag the
   * model cannot interpret is a tag it will not reach for.
   */
  const inherent = race.tags.map(t => `${t.name}${t.tier}`)
  if (c.trait.trim()) inherent.push(c.trait.trim())
  lines.push(`INHERENT TAGS: ${inherent.join(', ')}`)
  for (const t of race.tags) lines.push(`  ${t.name}${t.tier} — ${t.is}`)
  if (c.trait.trim()) {
    lines.push(`  ${c.trait.trim()} — their own, chosen by the player. Treat it as true of them, `
      + 'and let it cost them something as readily as it helps.')
  }

  if (recent.length > 0) {
    lines.push(`TAGS EARNED (${held.length} in all, most recent last): ${recent.join(', ')}`)
  } else {
    lines.push('TAGS EARNED: none yet. They carry nothing but what they have learned on the way.')
  }
  return lines.join('\n')
}
