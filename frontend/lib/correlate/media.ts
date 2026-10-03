/**
 * The medium registry — what an offering can be made of.
 *
 * Two classes of medium, and the distinction is first-class because the honesty
 * invariant differs between them:
 *
 *   catalogued / library  The offering resolves to a real record. A miss is
 *                         possible, and the miss is the guard.
 *   composed              The offering is authored on the spot. Nothing to
 *                         search, so performability is the guard instead: ordered
 *                         concrete steps plus a framing.
 *
 * Adding a medium is a data edit here plus one resolver in lib/offerings/.
 */

import type { MediumId, OfferingOrigin } from './types'

export interface Medium {
  id: MediumId
  /** Singular noun for one offering in this medium. */
  name: string
  /** Plural, for headings. */
  plural: string
  origin: OfferingOrigin
  /** Where the offerings come from, said plainly in the UI. */
  provider: string
  /**
   * The framing hint shown next to the framing field. Every medium has a
   * different default answer to "which part of this matters", and leaving the
   * player to guess is how two people end up answering different things.
   */
  framingHint: string
  /** Placeholder for the picker's search or compose field. */
  searchPlaceholder: string
  /** True when an offering in this medium describes something a body does. */
  physical: boolean
  /**
   * True when resolving an offering in this medium depends on the player's own
   * data rather than a public catalogue. Only `passage` does: it searches the
   * reader's books, so a reader with a small library has nothing for an
   * interpreter to reach for, and a reply in this medium can fail through nobody's
   * fault. The reply pipeline therefore never *retries* into it.
   */
  dependsOnUserLibrary?: boolean
  /**
   * True when an offering in this medium is a *proposition* — something that can be
   * true or false — rather than a thing that can only be good or bad.
   *
   * This is the one property that changes what honesty means. Inventing a track
   * produces a search miss, which is visible to everyone. Inventing the statement
   * of a theorem produces fluent, specific, confident text that nothing downstream
   * can catch. So these media get an extra sentence in the prompt: name it, never
   * write out what it says.
   */
  propositional?: boolean
  /**
   * Set when the medium needs a credential this deployment may not have. The
   * medium is hidden rather than offered-and-broken when the key is absent.
   */
  requiresEnv?: string
  /** lucide-react icon name, resolved in the UI layer. */
  icon: string
}

export const MEDIA: Record<MediumId, Medium> = {
  music: {
    id: 'music',
    name: 'song',
    plural: 'Music',
    origin: 'catalogue',
    provider: 'the Deezer catalogue (30-second previews, no account needed)',
    framingHint: 'The whole track, or the part that matters — the opening, the drop, one line.',
    searchPlaceholder: 'Search for a song…',
    physical: false,
    icon: 'Music2',
  },

  artwork: {
    id: 'artwork',
    name: 'artwork',
    plural: 'Art',
    origin: 'catalogue',
    provider: 'the Cleveland Museum of Art open-access collection',
    framingHint: 'The whole picture, or one region — the composition, a colour, a single figure.',
    searchPlaceholder: 'Search paintings, prints, sculpture…',
    physical: false,
    icon: 'Frame',
  },

  passage: {
    id: 'passage',
    name: 'passage',
    plural: 'Reading',
    origin: 'library',
    provider: 'your own library (anything you have read here)',
    dependsOnUserLibrary: true,
    framingHint: 'The sentence that does the work, or the whole paragraph.',
    searchPlaceholder: 'Search your books for a passage…',
    physical: false,
    icon: 'BookOpen',
  },

  scene: {
    id: 'scene',
    name: 'scene',
    plural: 'Film & TV',
    origin: 'catalogue',
    provider: 'TMDB (the title resolves, the moment is yours to frame)',
    framingHint: 'Name the moment. A scene is not a catalogue entry, so you have to describe it.',
    searchPlaceholder: 'Search films and series…',
    physical: false,
    requiresEnv: 'TMDB_API_KEY',
    icon: 'Clapperboard',
  },

  // ── The knowledge media ──────────────────────────────────────────────────
  //
  // Catalogued, not composed, and that is the design rather than a convenience.
  // These are the first media here whose content can be *confidently wrong*: a
  // theorem is a proposition, and an authored statement of one is sometimes not a
  // statement of it. Performability — the guard that makes a composed medium
  // honest — catches vague mush, not fluent error. So the interpreter names a
  // search and the server quotes the record, exactly as `passage` does.

  theorem: {
    id: 'theorem',
    name: 'theorem',
    plural: 'Mathematics',
    origin: 'catalogue',
    provider: 'Wikipedia (the statement as written, never paraphrased)',
    framingHint: 'The statement, the condition it needs, or the shape of the proof.',
    searchPlaceholder: 'Search theorems, identities, paradoxes…',
    physical: false,
    propositional: true,
    icon: 'Sigma',
  },

  phenomenon: {
    id: 'phenomenon',
    name: 'phenomenon',
    plural: 'Science',
    origin: 'catalogue',
    provider: 'Wikipedia (the statement as written, never paraphrased)',
    framingHint: 'What happens, or the condition that makes it happen.',
    searchPlaceholder: 'Search phenomena, effects, laws…',
    physical: false,
    propositional: true,
    icon: 'Atom',
  },

  organism: {
    id: 'organism',
    name: 'living thing',
    plural: 'Life',
    origin: 'catalogue',
    provider: 'Wikipedia (the statement as written, never paraphrased)',
    framingHint: 'The whole creature, or one behaviour, or one part of its body.',
    searchPlaceholder: 'Search creatures, plants, fungi…',
    physical: false,
    propositional: true,
    icon: 'Leaf',
  },

  place: {
    id: 'place',
    name: 'place',
    plural: 'Places',
    origin: 'catalogue',
    provider: 'Wikipedia (the statement as written, never paraphrased)',
    framingHint: 'The place as a whole, or one feature — the light, the scale, the silence.',
    searchPlaceholder: 'Search places, landforms, ruins…',
    physical: false,
    propositional: true,
    icon: 'Mountain',
  },

  gesture: {
    id: 'gesture',
    name: 'gesture',
    plural: 'Gesture',
    origin: 'composed',
    provider: 'composed (you write it, and it has to be doable)',
    framingHint: 'Which part carries the meaning: the reach, the pause, the way it ends.',
    searchPlaceholder: 'Name the gesture…',
    physical: true,
    icon: 'Hand',
  },

  movement: {
    id: 'movement',
    name: 'movement',
    plural: 'Dance',
    origin: 'composed',
    provider: 'composed (you write it, and it has to be doable)',
    framingHint: 'The shape, the rhythm, or the transition between two shapes.',
    searchPlaceholder: 'Name the movement…',
    physical: true,
    icon: 'Footprints',
  },

  stretch: {
    id: 'stretch',
    name: 'stretch',
    plural: 'Stretch',
    origin: 'composed',
    provider: 'composed (you write it, and it has to be doable)',
    framingHint: 'The sensation, not the silhouette. Where it is felt, and for how long.',
    searchPlaceholder: 'Name the stretch or pose…',
    physical: true,
    icon: 'Accessibility',
  },

  exercise: {
    id: 'exercise',
    name: 'exercise',
    plural: 'Exercise',
    origin: 'composed',
    provider: 'composed (you write it, and it has to be doable)',
    framingHint: 'The effort and its shape: what resists, and what gives.',
    searchPlaceholder: 'Name the exercise…',
    physical: true,
    icon: 'Dumbbell',
  },
}

/**
 * Picker order, and it is grouped rather than arbitrary: the things you look up
 * first, then the things you know, then the things you do. A player scanning the
 * tabs should not have to cross a composed medium to get from one catalogue to
 * another.
 */
export const MEDIUM_LIST: Medium[] = [
  MEDIA.music,
  MEDIA.artwork,
  MEDIA.passage,
  MEDIA.scene,
  MEDIA.theorem,
  MEDIA.phenomenon,
  MEDIA.organism,
  MEDIA.place,
  MEDIA.gesture,
  MEDIA.movement,
  MEDIA.stretch,
  MEDIA.exercise,
]

export const ALL_MEDIUM_IDS: MediumId[] = MEDIUM_LIST.map(m => m.id)

export function getMedium(id: string): Medium | null {
  return (MEDIA as Record<string, Medium>)[id] ?? null
}

/**
 * Media grouped by the provider they share, in MEDIUM_LIST order of first
 * appearance.
 *
 * Exists because listing one medium per row made the list mostly its own echo:
 * eight of eleven rows read either "Wikipedia (the statement as written, never
 * paraphrased)" or "composed (you write it, and it has to be doable)", four times
 * each. A reader scanning that cannot see the shape of the thing — which is that
 * there are only a handful of sources, and the three *origins* are what actually
 * differ.
 *
 * Grouped on the provider string itself rather than on a hand-written grouping,
 * so a fifth Wikipedia medium joins that line by existing and nothing has to
 * remember to add it.
 */
export function mediaByProvider(media: MediumId[]): { provider: string; media: Medium[] }[] {
  const groups: { provider: string; media: Medium[] }[] = []
  for (const m of MEDIUM_LIST) {
    if (!media.includes(m.id)) continue
    const existing = groups.find(g => g.provider === m.provider)
    if (existing) existing.media.push(m)
    else groups.push({ provider: m.provider, media: [m] })
  }
  return groups
}

export function isComposed(id: string): boolean {
  return getMedium(id)?.origin === 'composed'
}

/** Media whose content is a claim, and therefore can be confidently wrong. */
export function isPropositional(id: string): boolean {
  return getMedium(id)?.propositional === true
}

/** Resolve a game's `media` field to concrete ids. */
export function resolveMedia(spec: MediumId[] | 'all'): MediumId[] {
  return spec === 'all' ? [...ALL_MEDIUM_IDS] : spec
}

/**
 * Media this deployment can actually serve.
 *
 * A medium gated on a credential is hidden when the credential is absent, rather
 * than being offered and then failing at the first search. Client code passes the
 * set it was given by the server; server code can call this directly.
 */
export function availableMedia(env: Record<string, string | undefined> = {}): MediumId[] {
  return MEDIUM_LIST
    .filter(m => !m.requiresEnv || !!env[m.requiresEnv])
    .map(m => m.id)
}

/**
 * The media a session should offer: what the game wants, narrowed to what the
 * deployment can serve, with the hard floor that a game is unplayable with none.
 */
export function playableMedia(
  spec: MediumId[] | 'all',
  available: MediumId[],
): MediumId[] {
  const wanted = resolveMedia(spec)
  const usable = wanted.filter(m => available.includes(m))
  return usable.length > 0 ? usable : ['music']
}

/**
 * Media an interpreter may be *retried* into.
 *
 * Drops anything that depends on the player's own data. A reply pipeline whose
 * job is to guarantee a real answer must not retry into a medium that can come
 * back empty for reasons the interpreter cannot see or fix.
 */
export function replyMediaFor(media: MediumId[]): MediumId[] {
  const reliable = media.filter(id => !MEDIA[id]?.dependsOnUserLibrary)
  return reliable.length > 0 ? reliable : media
}
