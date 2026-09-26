/**
 * AI Listen Along — the mode registry.
 *
 * Every mode is the same engine with different answers to the six questions in
 * GamePieces, so adding a kind of game is a data edit, not a new code path. The
 * turn loop is always:
 *
 *   your song → a reading of it → the dial's reply song → a new fact
 *
 * What changes between modes is what a song *is* (a move, an argument, a clue,
 * a key, a material, an instruction, a hypothesis) and who interprets it.
 */

import type { ListenMode, ListenModeId } from './types'

export const MODES: Record<ListenModeId, ListenMode> = {
  radio: {
    id: 'radio',
    name: 'Night Radio',
    tagline: 'Steer a transmitter you cannot aim. Find out what is on the other end.',
    songIs: 'A signal sent out, and a place it lands',
    judge: 'narrator',
    accent: 'indigo',
    pieces: {
      playerMove: 'An outgoing song, broadcast from the airfield.',
      interpreter: 'Mara and the dial — its sound, title, associations, and your shared reading of them.',
      responseRule: 'A different, real song comes back, suggested by wherever the dial landed.',
      worldState: 'The airfield, its callers, the log, and the time anomaly running through it.',
      constraint: 'You can steer the signal but never specify its destination.',
      goal: 'Work out what is happening at the airfield — or simply make a compelling chain.',
    },
    persona:
      'You are Mara, night operator at a small airfield whose radio reaches places it should not. ' +
      'You are practical, unsentimental, and you write like someone keeping a log at 3am: short ' +
      'declaratives, concrete detail, no purple prose. You never explain the anomaly directly; you ' +
      'report what came through. You are allowed to be unsettled. You are never whimsical.',
    replyRule:
      'The reply song is what came back down the same channel — a real, different song that belongs to ' +
      'wherever the transmission landed: its era, its room, its weather. It should feel answered, not ' +
      'matched. Never reply with the song the player just sent, or one already in the log.',
    worldKeys: [
      { key: 'place', description: 'Where the dial is currently pointed — a place and a moment.' },
      { key: 'callers', description: 'People the radio has reached, with one detail each.' },
      { key: 'anomaly', description: 'What is currently known to be wrong with time here.' },
      { key: 'log', description: 'Terse operator-log lines, newest last.' },
    ],
    seedWorld: {
      place: 'The airfield, present day, 03:00. Fog on the runway lights.',
      callers: [],
      anomaly: 'Unestablished. The log timestamps do not always agree with the clock.',
      log: ['03:00 — Transmitter warm. Nothing on any band yet.'],
      facts: [],
    },
    openingPrompt: 'Send the first song out. Anything. The dial will decide where it goes.',
  },

  tag: {
    id: 'tag',
    name: 'Tag',
    tagline: 'Answer the last song with one that is provably linked to it.',
    songIs: 'A move the next player must connect to',
    judge: 'features',
    accent: 'emerald',
    pieces: {
      playerMove: 'A song linked to the one on the table.',
      interpreter: 'Spotify metadata. The link is checked, not argued.',
      responseRule: 'A real song that is linked to yours in a different way than you linked to the last one.',
      worldState: 'The chain so far, and which kinds of link are used up.',
      constraint: 'The link must be verifiable — shared artist, album, title word, year, decade, or length. Your reading of the mood does not count.',
      goal: 'Keep the chain alive, and make each link a different kind from the last.',
    },
    persona:
      'You are a referee with a good ear. You state the link that was found, dryly and exactly, then ' +
      'play your own answer. You never flatter a move. When a move only barely qualifies, you say so.',
    replyRule:
      'Your reply must be a real song that shares at least one checkable property with the move — same ' +
      'artist, same album, a word in the title, the same year or decade, or near-identical length — and ' +
      'it must use a different kind of link than the move just used. Name the link you are using.',
    worldKeys: [
      { key: 'chain', description: 'The ordered chain of songs played.' },
      { key: 'linksUsed', description: 'Kinds of link already spent, newest last.' },
    ],
    seedWorld: {
      chain: [],
      linksUsed: [],
      facts: [],
    },
    openingPrompt: 'Open the chain with any song. From the next move on, every link gets checked.',
  },

  duel: {
    id: 'duel',
    name: 'Duel',
    tagline: 'A scene is described. Argue for your song. The dial argues back.',
    songIs: 'An argument',
    judge: 'player',
    accent: 'rose',
    pieces: {
      playerMove: 'The song you claim is right for the scene on the table.',
      interpreter: 'You do. The dial makes its case; the verdict is yours.',
      responseRule: 'A rival real song, plus the case for it.',
      worldState: 'The scene, the running score, and what each round proved about the scene.',
      constraint: 'You must beat the scene as written, not the scene you wish it were.',
      goal: 'Win rounds — and watch the scene change as each song redescribes it.',
    },
    persona:
      'You are a music supervisor who has lost this argument before and has not forgotten it. You make ' +
      'a real case: what the cut does to the scene, where it enters, what it costs. You concede a good ' +
      'point when the player has one, and you never pretend a weak choice is strong.',
    replyRule:
      'Reply with a real song that is a genuine rival for the same scene, and argue for it on craft: ' +
      'what changes in the scene when this cut plays instead. One round, one rival.',
    worldKeys: [
      { key: 'scene', description: 'The scene being scored. Drifts as rounds redescribe it.' },
      { key: 'score', description: 'Rounds won by each side: { player, dial }.' },
      { key: 'established', description: 'What the rounds have settled about the scene.' },
    ],
    seedWorld: {
      scene:
        'A woman returns to an apartment she moved out of four years ago. The furniture is someone ' +
        'else’s. She has ninety seconds before the new tenant gets back.',
      score: { player: 0, dial: 0 },
      established: [],
      facts: [],
    },
    openingPrompt: 'Score the scene. Pick your cut and say nothing — the case should be audible.',
  },

  investigation: {
    id: 'investigation',
    name: 'Investigation',
    tagline: 'Each song you play is a clue that reveals a different fact about the same mystery.',
    songIs: 'A clue',
    judge: 'narrator',
    accent: 'amber',
    pieces: {
      playerMove: 'A song to run against the case.',
      interpreter: 'The case file — your song selects which part of it opens.',
      responseRule: 'A real song recovered from the evidence, carrying the next fact.',
      worldState: 'The case: the known facts, the open questions, the people involved.',
      constraint: 'You choose where to look, never what you find.',
      goal: 'Assemble enough facts to name what happened.',
    },
    persona:
      'You are the case file itself, read aloud by someone thorough and slightly tired. You deal only ' +
      'in what the evidence supports. Each turn yields exactly one new fact, and facts can contradict ' +
      'earlier facts — when they do, you say which one is now in doubt rather than quietly replacing it.',
    replyRule:
      'Reply with a real song that was found in the evidence — on a device, in a case, named in a ' +
      'statement — and let that song carry the fact it implies. Never the song the player played.',
    worldKeys: [
      { key: 'case', description: 'One-line statement of what is being investigated.' },
      { key: 'people', description: 'Named people and what is known about each.' },
      { key: 'openQuestions', description: 'What is still unresolved.' },
      { key: 'inDoubt', description: 'Facts a later turn has called into question.' },
    ],
    seedWorld: {
      case:
        'A rented car was found in long-stay parking eleven days after it was due back. Full tank. ' +
        'No driver. The stereo was on when the lot attendant opened the door.',
      people: [],
      openQuestions: ['Whose car was it before the rental company owned it?', 'Who was the stereo playing for?'],
      inDoubt: [],
      facts: [],
    },
    openingPrompt: 'Play something to run against the case. Where you look is up to you.',
  },

  navigation: {
    id: 'navigation',
    name: 'Navigation',
    tagline: 'The song is a key. It lands you where it resonates — not where you aimed.',
    songIs: 'A key to a location or a moment',
    judge: 'narrator',
    accent: 'sky',
    pieces: {
      playerMove: 'A song used as a key.',
      interpreter: 'The map — a song opens the place it resonates with.',
      responseRule: 'A real song already playing wherever you arrived.',
      worldState: 'The atlas of places reached, and the route between them.',
      constraint: 'You pick the key, never the door.',
      goal: 'Map somewhere real enough to come back to.',
    },
    persona:
      'You are the place itself, described by someone standing in it. You lead with the physical: ' +
      'light, temperature, surfaces, what is audible under the music. You do not editorialise about ' +
      'the journey and you never use the word "somehow".',
    replyRule:
      'Reply with a real song that is already playing where the player arrived — from a speaker, a car, ' +
      'a next room. It should tell them something about the place they could not see.',
    worldKeys: [
      { key: 'here', description: 'Where the player is standing now.' },
      { key: 'atlas', description: 'Places reached so far, each with one fixed detail.' },
      { key: 'route', description: 'The order of arrival, newest last.' },
    ],
    seedWorld: {
      here: 'Nowhere yet. A door with no building attached to it.',
      atlas: [],
      route: [],
      facts: [],
    },
    openingPrompt: 'Choose a key. The door it fits is not your decision.',
  },

  construction: {
    id: 'construction',
    name: 'Construction',
    tagline: 'Build a place out of songs. Each one becomes a fixed part of it.',
    songIs: 'A building material',
    judge: 'narrator',
    accent: 'teal',
    pieces: {
      playerMove: 'A song contributed to the place being built.',
      interpreter: 'The place under construction — each song becomes one district, hour, or institution.',
      responseRule: 'A real song already native to whatever your song just built.',
      worldState: 'The place: its districts, its hours, its rules, and who lives there.',
      constraint: 'Anything you build stays built. You cannot take a song back.',
      goal: 'Make somewhere coherent enough that a stranger could be given directions.',
    },
    persona:
      'You are the place being built, describing its newest part with the flatness of a good gazetteer. ' +
      'You name things. You give the new district a name, a boundary, and one true fact. You treat ' +
      'everything built in earlier turns as load-bearing and never contradict it.',
    replyRule:
      'Reply with a real song that is native to the part just built — what they play there, at the hour ' +
      'you have just established. It should imply something about the place nobody has stated yet.',
    worldKeys: [
      { key: 'placeName', description: 'The name of the place. Established on the first turn and never changed.' },
      { key: 'districts', description: 'Named districts, each with a boundary and one true fact.' },
      { key: 'hours', description: 'What happens at which times of day.' },
      { key: 'rules', description: 'Local rules or customs established so far.' },
    ],
    seedWorld: {
      placeName: null,
      districts: [],
      hours: [],
      rules: [],
      facts: [],
    },
    openingPrompt: 'Lay the first material. The song you pick decides what kind of place this is.',
  },

  transformation: {
    id: 'transformation',
    name: 'Transformation',
    tagline: 'The song is an instruction. The scene rewrites itself to obey.',
    songIs: 'An instruction',
    judge: 'narrator',
    accent: 'violet',
    pieces: {
      playerMove: 'A song read as an instruction to the scene.',
      interpreter: 'The scene — your song tells it how to change: its rhythm, its character, its scale.',
      responseRule: 'A real song that the transformed scene now produces on its own.',
      worldState: 'The current scene, and the ledger of transformations applied to it.',
      constraint: 'The instruction applies to the scene as it stands, including every earlier change.',
      goal: 'Drive the scene somewhere it could not have started.',
    },
    persona:
      'You are the scene, reporting its own change in the present tense. You apply exactly one ' +
      'transformation per turn, derived from something specific about the song — its tempo, its ' +
      'register, its length, its title. You state what changed and what stayed. You never reset.',
    replyRule:
      'Reply with a real song the transformed scene now produces by itself — what would be playing here ' +
      'after the change. It should make the new state audible.',
    worldKeys: [
      { key: 'scene', description: 'The scene in its current, fully transformed state.' },
      { key: 'ledger', description: 'Each transformation applied, newest last, with its cause.' },
      { key: 'invariants', description: 'What has survived every transformation so far.' },
    ],
    seedWorld: {
      scene:
        'A bus shelter on a ring road, Tuesday, late afternoon. One man, one timetable, no bus. ' +
        'Rain that cannot commit.',
      ledger: [],
      invariants: ['There is still one man waiting.'],
      facts: [],
    },
    openingPrompt: 'Give the scene its first instruction.',
  },

  prediction: {
    id: 'prediction',
    name: 'Prediction',
    tagline: 'Guess what the dial will answer with. Then find out why you were wrong.',
    songIs: 'A hypothesis',
    judge: 'player',
    accent: 'orange',
    pieces: {
      playerMove: 'A song, plus your prediction of what it will draw back.',
      interpreter: 'The dial — which commits to its own reasoning before it hears your guess.',
      responseRule: 'A real song the dial would have answered with regardless, and its reasoning.',
      worldState: 'Your hit rate, and the model of the dial you are building from misses.',
      constraint: 'You predict blind. The dial does not see your guess until after it has answered.',
      goal: 'Learn the dial well enough to call its answer.',
    },
    persona:
      'You are the dial, and you are consistent. You explain your reasoning fully, because the game is ' +
      'the player learning it. When their prediction was close you say exactly where it diverged. You ' +
      'never bend your answer to match a guess, and you never pretend a miss was a hit.',
    replyRule:
      'Reply with the real song you would answer this move with on your own terms, chosen before you ' +
      'consider the prediction. Then state your reasoning in one sentence a player could reuse.',
    worldKeys: [
      { key: 'record', description: 'Hits and misses: { hits, misses }.' },
      { key: 'tendencies', description: 'Reasoning patterns the player has now seen, newest last.' },
    ],
    seedWorld: {
      record: { hits: 0, misses: 0 },
      tendencies: [],
      facts: [],
    },
    openingPrompt: 'Play a song, and name the one you think it will pull back.',
  },
}

export const MODE_LIST: ListenMode[] = [
  MODES.radio,
  MODES.tag,
  MODES.investigation,
  MODES.navigation,
  MODES.duel,
  MODES.construction,
  MODES.transformation,
  MODES.prediction,
]

export function getMode(id: string): ListenMode | null {
  return (MODES as Record<string, ListenMode>)[id] ?? null
}

/** Modes where a move can be rejected outright by a metadata check. */
export function isStrict(mode: ListenMode): boolean {
  return mode.judge === 'features'
}

/** Modes that ask the player for a prediction alongside the move. */
export function wantsPrediction(mode: ListenMode): boolean {
  return mode.id === 'prediction'
}

/** Tailwind classes per accent, so modes stay one data edit away from working chrome. */
export const ACCENT_CLASSES: Record<ListenMode['accent'], { chip: string; ring: string; text: string; bg: string }> = {
  indigo:  { chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',    ring: 'border-indigo-300 dark:border-indigo-800',   text: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  emerald: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', ring: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  amber:   { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',        ring: 'border-amber-300 dark:border-amber-800',     text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30' },
  rose:    { chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',            ring: 'border-rose-300 dark:border-rose-800',       text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30' },
  sky:     { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',                ring: 'border-sky-300 dark:border-sky-800',         text: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-950/30' },
  violet:  { chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',    ring: 'border-violet-300 dark:border-violet-800',   text: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-950/30' },
  teal:    { chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',            ring: 'border-teal-300 dark:border-teal-800',       text: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-50 dark:bg-teal-950/30' },
  orange:  { chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',    ring: 'border-orange-300 dark:border-orange-800',   text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-950/30' },
}
