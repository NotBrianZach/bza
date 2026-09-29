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
    provider: 'the iTunes catalogue — 30-second previews, no account needed',
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
    provider: 'the Art Institute of Chicago collection',
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
    provider: 'your own library — anything you have read here',
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
    provider: 'TMDB — the title resolves, the moment is yours to frame',
    framingHint: 'Name the moment. A scene is not a catalogue entry, so you have to describe it.',
    searchPlaceholder: 'Search films and series…',
    physical: false,
    requiresEnv: 'TMDB_API_KEY',
    icon: 'Clapperboard',
  },

  gesture: {
    id: 'gesture',
    name: 'gesture',
    plural: 'Gesture',
    origin: 'composed',
    provider: 'composed — you write it, and it has to be doable',
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
    provider: 'composed — you write it, and it has to be doable',
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
    provider: 'composed — you write it, and it has to be doable',
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
    provider: 'composed — you write it, and it has to be doable',
    framingHint: 'The effort and its shape: what resists, and what gives.',
    searchPlaceholder: 'Name the exercise…',
    physical: true,
    icon: 'Dumbbell',
  },
}

export const MEDIUM_LIST: Medium[] = [
  MEDIA.music,
  MEDIA.artwork,
  MEDIA.passage,
  MEDIA.scene,
  MEDIA.gesture,
  MEDIA.movement,
  MEDIA.stretch,
  MEDIA.exercise,
]

export const ALL_MEDIUM_IDS: MediumId[] = MEDIUM_LIST.map(m => m.id)

export function getMedium(id: string): Medium | null {
  return (MEDIA as Record<string, Medium>)[id] ?? null
}

export function isComposed(id: string): boolean {
  return getMedium(id)?.origin === 'composed'
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
