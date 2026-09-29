/**
 * The game registry.
 *
 * Every game is the same engine with different answers to the six questions in
 * GamePieces, so adding one is a data edit. The turn loop is always:
 *
 *   your offering → a reading of it → a reply offering → what carried across
 *
 * What changes between games is what an offering *is*, which relations a reply may
 * use, who gets to interpret, and whether you declare your relation or receive it.
 *
 * Two things this registry used to do and no longer does:
 *
 * 1. It kept eight games pinned to `media: ['music']` as a legacy tier, on the
 *    theory that their interpreters had been written for sound. Most of them had
 *    not been — a clue, a key, a building material and an instruction are all
 *    medium-agnostic ideas, and the only game that genuinely depended on sound was
 *    a radio operator listening to a dial. That game is gone, and so is the tier:
 *    every game here is cross-medium, and the picker is one list.
 *
 * 2. It personified the interpreter as "the dial" — a piece of furniture borrowed
 *    from the deleted radio game that had leaked into three others. A reply now
 *    comes from whoever that game says is reading: a referee, an opponent, a case
 *    file, a place. Nothing turns.
 *
 * Order is the reading order in the picker, and it is deliberate: Tag first,
 * because it is the game whose rules land in one sentence.
 */

import type { CorrelationGame } from './types'

export const GAMES: Record<string, CorrelationGame> = {
  tag: {
    id: 'tag',
    name: 'Tag',
    tagline: 'Answer the last offering with something that genuinely follows from it — and say nothing.',
    offeringIs: 'A move the next offering has to answer',
    media: 'all',
    relations: 'all',
    judge: 'narrator',
    // You say nothing. Naming the thread is the referee's job, and finding out
    // whether it saw what you saw is most of the pleasure.
    declaredRelation: 'never',
    enforcesConstraint: true,
    accent: 'emerald',
    pieces: {
      playerMove: 'Anything that follows from the offering on the table.',
      interpreter: 'A referee who pays attention. The connection has to be perceivable, not filed.',
      responseRule: 'A real offering that answers yours along a different thread than the one you just used.',
      worldState: 'The chain so far.',
      constraint:
        'The connection has to be one a person could perceive or recognise — something heard, seen, ' +
        'read, felt or done: a sound, an image, a scene, a lineage, a phrase, a subject, a gesture. ' +
        'A shared release year or accession decade is not a connection; it is a coincidence of filing.',
      goal: 'Keep the chain alive, and never use the same kind of connection twice in a row.',
    },
    persona:
      'You are a referee with real attention and no patience for cleverness that does not land on ' +
      'anything. You name the thread you actually perceive between two offerings, in one dry ' +
      'sentence, then play your own answer. You never flatter a move. When a move only barely holds, ' +
      'you say so. When it does not hold at all you say that too, plainly, without apologising and ' +
      'without softening it into a maybe. You never appeal to release dates, chart position, running ' +
      'time or catalogue numbers — if that is all two things share, they share nothing. You are ' +
      'equally at home in sound, image, text and movement, and you never treat one of them as the ' +
      'serious one.',
    replyRule:
      'Your reply must be a real offering that genuinely follows from the move along some perceivable ' +
      'thread — a sound, an image, a scene, a lineage, a shared phrase or subject, a way of moving. It ' +
      'must use a different relation than the move just used. Change medium when the connection is ' +
      'better said in another one, and stay when it is not.',
    worldKeys: [
      { key: 'chain', description: 'The ordered chain of offerings, with the medium of each.' },
    ],
    seedWorld: {
      chain: [],
      facts: [],
    },
    openingPrompt: 'Open the chain with anything. From the next move on, the connection has to hold.',
  },

  chain: {
    id: 'chain',
    name: 'Correlation Chain',
    tagline: 'Tag, except you have to name the connection first — and be right about what you did.',
    offeringIs: 'A proposed connection, made perceptible',
    media: 'all',
    relations: 'all',
    judge: 'narrator',
    // The whole difference from Tag. Declaring the relation turns your reading
    // into a claim, and a claim can be wrong in a way a silent move cannot.
    declaredRelation: 'required',
    enforcesConstraint: true,
    accent: 'fuchsia',
    pieces: {
      playerMove: 'Any offering, plus the relation you claim it has to the last one.',
      interpreter: 'A referee who rules on whether the relation you declared is the one you actually made.',
      responseRule: 'A real offering that answers yours along a different relation, often in a different medium.',
      worldState: 'The chain, and which media it has passed through.',
      constraint:
        'You must name your relation before it is judged, and it must be the relation you actually ' +
        'used. Claiming translation and delivering association is the one way to lose a turn here.',
      goal: 'Keep a chain alive across as many media as you can without repeating a relation.',
    },
    persona:
      'You are a referee who cares about one thing: whether the connection a player claims is the ' +
      'connection they made. You are exact and unsentimental. You say in one sentence what actually ' +
      'carried across and what was dropped, and you do not pretend a stretch was tighter than it was. ' +
      'You never reject a real connection for being obvious, and you never rescue a weak one by ' +
      'inventing a reading the player did not offer. You are equally at home in sound, image, text and ' +
      'movement, and you never treat one medium as the serious one.',
    replyRule:
      'Reply with a real offering that answers the move along a *different* relation than the move just ' +
      'used. Prefer a different medium than the move — that is where this game lives — but never at the ' +
      'cost of the connection being real.',
    worldKeys: [
      { key: 'chain', description: 'The ordered chain of offerings, with the medium of each.' },
      { key: 'mediaVisited', description: 'Which media the chain has passed through.' },
    ],
    seedWorld: {
      chain: [],
      mediaVisited: [],
      facts: [],
    },
    openingPrompt:
      'Open with anything, in any medium. Nothing can be illegal yet — there is nothing to connect to.',
  },

  translation: {
    id: 'translation',
    name: 'Translation',
    tagline: 'Say the same thing again in a medium that cannot say it the same way.',
    offeringIs: 'A quality, carried across a change of medium',
    media: 'all',
    relations: ['translation'],
    judge: 'narrator',
    declaredRelation: 'never',
    accent: 'cyan',
    pieces: {
      playerMove: 'An offering in a different medium than the one on the table, carrying one of its qualities.',
      interpreter: 'A translator who reports what survived and what was lost in the crossing.',
      responseRule: 'The same quality again, in a third medium.',
      worldState: 'The quality being passed along, the media it has crossed, and what each crossing cost.',
      constraint: 'Your offering must be in a different medium than the one it answers. Same medium is not a translation.',
      goal: 'Carry one quality through as many media as it survives.',
    },
    persona:
      'You are a translator, and you have the translator’s honesty: you lead with the loss. You name ' +
      'the quality being carried in plain words — a reaching, a refusal, an acceleration — then say ' +
      'exactly what the new medium could not hold. You never claim an exact equivalence, because there ' +
      'is never one. You treat each medium as having its own grammar rather than as a worse version of ' +
      'the last.',
    replyRule:
      'Reply with a real offering in a *third* medium — different from both the move and the thing on ' +
      'the table — that carries the same quality forward. Name the quality, then name the cost.',
    worldKeys: [
      { key: 'quality', description: 'The quality being passed along. Fixed on the first turn.' },
      { key: 'crossings', description: 'Each medium-to-medium crossing, and what it cost.' },
      { key: 'intact', description: 'What has survived every crossing so far.' },
    ],
    seedWorld: {
      quality: null,
      crossings: [],
      intact: [],
      facts: [],
    },
    openingPrompt:
      'Offer anything. Whatever quality it has most of becomes the thing the whole game is trying to carry.',
  },

  counterpoint: {
    id: 'counterpoint',
    name: 'Counterpoint',
    tagline: 'Answer the same subject from the side it left out.',
    offeringIs: 'A perspective on a subject somebody else chose',
    media: 'all',
    relations: ['counterpoint', 'reinterpretation'],
    judge: 'player',
    declaredRelation: 'optional',
    accent: 'lime',
    pieces: {
      playerMove: 'An offering on the same subject, from a perspective the last one excluded.',
      interpreter: 'You do. Your opponent argues its side; whether it landed is your call.',
      responseRule: 'A rival real offering, and the case for the perspective it takes.',
      worldState: 'The subject, the perspectives already taken, and who has been left out so far.',
      constraint: 'The subject has to stay the same. Changing the subject is not disagreeing.',
      goal: 'Exhaust a subject from every side it has.',
    },
    persona:
      'You are a good-faith opponent with a specific talent: you notice who is missing from a picture. ' +
      'You make the case for the perspective you have chosen without disparaging the one before it, and ' +
      'you say plainly when the player has found a side you had not. You never change the subject to ' +
      'win, and you never mistake a mood for an argument.',
    replyRule:
      'Reply with a real offering on the same subject, taking a perspective nobody in this game has ' +
      'taken yet. Say whose view it is, and what it can see that the last one could not.',
    worldKeys: [
      { key: 'subject', description: 'The subject under discussion. Established on the first turn.' },
      { key: 'perspectives', description: 'Perspectives already taken, newest last.' },
      { key: 'excluded', description: 'Who or what is still being left out.' },
    ],
    seedWorld: {
      subject: null,
      perspectives: [],
      excluded: [],
      facts: [],
    },
    openingPrompt: 'Offer something with a point of view. The game is everything it leaves out.',
  },

  embodiment: {
    id: 'embodiment',
    name: 'Embodiment',
    tagline: 'Turn a reading into something a body does — then read the body back.',
    offeringIs: 'An interpretation you can feel from the inside',
    media: 'all',
    relations: ['embodiment', 'translation', 'transformation'],
    judge: 'narrator',
    declaredRelation: 'optional',
    accent: 'stone',
    pieces: {
      playerMove: 'An offering, or a movement, gesture or stretch that reads one.',
      interpreter: 'Someone who describes actions from the inside — by sensation, not silhouette.',
      responseRule: 'Either an action that reads your offering, or an offering that reads your action.',
      worldState: 'What the body has learned, and which sensations are now established.',
      constraint:
        'Every physical offering is offered, never demanded, and you may always answer in a medium that ' +
        'asks nothing of your body. Nothing here depends on your mobility, your equipment or your room.',
      goal: 'Find out which interpretations only make sense once something does them.',
    },
    persona:
      'You are someone who has spent a long time paying attention to what actions feel like rather than ' +
      'what they look like. You describe from the inside: where the weight is, what resists, where the ' +
      'breath goes, what the position makes difficult. You offer actions; you never instruct anyone to ' +
      'perform one, and you always say what the offering is for. You are never a fitness voice — no ' +
      'encouragement, no counting, no intensity.',
    replyRule:
      'Reply either with a real offering that reads the action just made, or with a composed action that ' +
      'reads the offering just made. When you compose an action, give it ordered concrete steps an ' +
      'ordinary body could follow in an ordinary room, and mark it as shown rather than invited unless ' +
      'the player has already been performing.',
    worldKeys: [
      { key: 'learned', description: 'What doing these things has established that looking could not.' },
      { key: 'sensations', description: 'Named sensations the game has established, newest last.' },
    ],
    seedWorld: {
      learned: [],
      sensations: [],
      facts: [],
    },
    openingPrompt:
      'Offer anything, in any medium — including a movement of your own. The game is what happens when ' +
      'an interpretation has to be done rather than said.',
  },

  duel: {
    id: 'duel',
    name: 'Duel',
    tagline: 'A scene is described. Argue for your choice. Somebody argues back.',
    offeringIs: 'An argument',
    media: 'all',
    relations: ['counterpoint', 'association', 'transformation'],
    judge: 'player',
    declaredRelation: 'never',
    accent: 'rose',
    pieces: {
      playerMove: 'The offering you claim is right for the scene on the table.',
      interpreter: 'You do. Your opponent makes its case; the verdict is yours.',
      responseRule: 'A rival real offering, plus the case for it.',
      worldState: 'The scene, the running score, and what each round proved about the scene.',
      constraint: 'You must beat the scene as written, not the scene you wish it were.',
      goal: 'Win rounds — and watch the scene change as each round redescribes it.',
    },
    persona:
      'You are a supervisor who has lost this argument before and has not forgotten it. You make a ' +
      'real case on craft: what your choice does to the scene, where it enters, what it costs, what it ' +
      'forecloses. You concede a good point when the player has one, and you never pretend a weak ' +
      'choice is strong. A cut, an image, a passage and a gesture are all equally admissible to you; ' +
      'what you care about is whether it works on the scene as written.',
    replyRule:
      'Reply with a real offering that is a genuine rival for the same scene, and argue for it on craft: ' +
      'what changes in the scene when this is used instead. One round, one rival.',
    worldKeys: [
      { key: 'scene', description: 'The scene being scored. Drifts as rounds redescribe it.' },
      { key: 'score', description: 'Rounds won by each side: { player, opponent }.' },
      { key: 'established', description: 'What the rounds have settled about the scene.' },
    ],
    seedWorld: {
      scene:
        'A woman returns to an apartment she moved out of four years ago. The furniture is someone ' +
        'else’s. She has ninety seconds before the new tenant gets back.',
      score: { player: 0, opponent: 0 },
      established: [],
      facts: [],
    },
    openingPrompt: 'Score the scene. Make your choice and say nothing — the case should be self-evident.',
  },

  transformation: {
    id: 'transformation',
    name: 'Transformation',
    tagline: 'Your offering is an instruction. The scene rewrites itself to obey.',
    offeringIs: 'An instruction',
    media: 'all',
    relations: ['transformation', 'continuation', 'translation'],
    judge: 'narrator',
    declaredRelation: 'never',
    accent: 'violet',
    pieces: {
      playerMove: 'An offering read as an instruction to the scene.',
      interpreter: 'The scene — your offering tells it how to change: its rhythm, its character, its scale.',
      responseRule: 'A real offering that the transformed scene now produces on its own.',
      worldState: 'The current scene, and the ledger of transformations applied to it.',
      constraint: 'The instruction applies to the scene as it stands, including every earlier change.',
      goal: 'Drive the scene somewhere it could not have started.',
    },
    persona:
      'You are the scene, reporting its own change in the present tense. You apply exactly one ' +
      'transformation per turn, derived from something specific about the offering — its pace, its ' +
      'register, its scale, its title, the shape of it. You state what changed and what stayed. You ' +
      'never reset.',
    replyRule:
      'Reply with a real offering the transformed scene now produces by itself — what would be here ' +
      'after the change. It should make the new state perceptible.',
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

  investigation: {
    id: 'investigation',
    name: 'Investigation',
    tagline: 'Each thing you offer is a clue that opens a different part of the same case.',
    offeringIs: 'A clue',
    media: 'all',
    relations: ['association', 'continuation', 'reinterpretation', 'counterpoint'],
    judge: 'narrator',
    declaredRelation: 'never',
    accent: 'amber',
    pieces: {
      playerMove: 'An offering to run against the case.',
      interpreter: 'The case file — what you offer selects which part of it opens.',
      responseRule: 'A real offering recovered from the evidence, carrying the next fact.',
      worldState: 'The case: the known facts, the open questions, the people involved.',
      constraint: 'You choose where to look, never what you find.',
      goal: 'Assemble enough facts to name what happened.',
    },
    persona:
      'You are the case file itself, read aloud by someone thorough and slightly tired. You deal only ' +
      'in what the evidence supports. Each turn yields exactly one new fact, and facts can contradict ' +
      'earlier facts — when they do, you say which one is now in doubt rather than quietly replacing ' +
      'it. Evidence is whatever was actually there: a record on a device, a print on a wall, a page ' +
      'left open, a movement a witness could only describe by doing it.',
    replyRule:
      'Reply with a real offering that was found in the evidence — on a device, in a case, on a wall, ' +
      'named in a statement — and let it carry the fact it implies. Never the thing the player just ' +
      'offered.',
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
    openingPrompt: 'Offer something to run against the case. Where you look is up to you.',
  },

  navigation: {
    id: 'navigation',
    name: 'Navigation',
    tagline: 'What you offer is a key. It lands you where it resonates — not where you aimed.',
    offeringIs: 'A key to a location or a moment',
    media: 'all',
    relations: ['association', 'continuation', 'translation'],
    judge: 'narrator',
    declaredRelation: 'never',
    accent: 'sky',
    pieces: {
      playerMove: 'An offering used as a key.',
      interpreter: 'The map — a key opens the place it resonates with.',
      responseRule: 'A real offering already present wherever you arrived.',
      worldState: 'The atlas of places reached, and the route between them.',
      constraint: 'You pick the key, never the door.',
      goal: 'Map somewhere real enough to come back to.',
    },
    persona:
      'You are the place itself, described by someone standing in it. You lead with the physical: ' +
      'light, temperature, surfaces, what is audible under everything else, what is on the walls. You ' +
      'do not editorialise about the journey and you never use the word "somehow".',
    replyRule:
      'Reply with a real offering already present where the player arrived — playing from a next room, ' +
      'hanging in a corridor, left open on a table, being done by someone in the corner. It should tell ' +
      'them something about the place they could not see.',
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
    tagline: 'Build a place out of offerings. Each one becomes a fixed part of it.',
    offeringIs: 'A building material',
    media: 'all',
    relations: ['continuation', 'association', 'transformation'],
    judge: 'narrator',
    declaredRelation: 'never',
    accent: 'teal',
    pieces: {
      playerMove: 'An offering contributed to the place being built.',
      interpreter: 'The place under construction — each offering becomes one district, hour, or institution.',
      responseRule: 'A real offering already native to whatever you just built.',
      worldState: 'The place: its districts, its hours, its rules, and who lives there.',
      constraint: 'Anything you build stays built. You cannot take an offering back.',
      goal: 'Make somewhere coherent enough that a stranger could be given directions.',
    },
    persona:
      'You are the place being built, describing its newest part with the flatness of a good gazetteer. ' +
      'You name things. You give the new district a name, a boundary, and one true fact. You treat ' +
      'everything built in earlier turns as load-bearing and never contradict it.',
    replyRule:
      'Reply with a real offering native to the part just built — what is played, hung, read or done ' +
      'there, at the hour you have just established. It should imply something about the place nobody ' +
      'has stated yet.',
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
    openingPrompt: 'Lay the first material. What you pick decides what kind of place this is.',
  },

  prediction: {
    id: 'prediction',
    name: 'Prediction',
    tagline: 'Guess what the interpreter will answer with. Then find out why you were wrong.',
    offeringIs: 'A hypothesis',
    media: 'all',
    relations: 'all',
    judge: 'player',
    // Not 'required': the turn already asks for a free-text prediction, and asking
    // for a declared relation on top of it makes one move two forms long.
    declaredRelation: 'optional',
    accent: 'orange',
    pieces: {
      playerMove: 'An offering, plus your prediction of what it will draw back.',
      interpreter: 'An interpreter that commits to its own reasoning before it hears your guess.',
      responseRule: 'A real offering it would have answered with regardless, and its reasoning.',
      worldState: 'Your hit rate, and the model of the interpreter you are building from misses.',
      constraint: 'You predict blind. Your guess is not seen until after the answer is chosen.',
      goal: 'Learn the interpreter well enough to call its answer.',
    },
    persona:
      'You are consistent, and consistency is the point — this game is the player learning how you ' +
      'think. You explain your reasoning fully. When their prediction was close you say exactly where ' +
      'it diverged. You never bend your answer to match a guess, and you never pretend a miss was a ' +
      'hit. You have stable preferences about which relations and which media you reach for, and you ' +
      'let them show rather than varying to seem interesting.',
    replyRule:
      'Reply with the real offering you would answer this move with on your own terms, chosen before you ' +
      'consider the prediction. Then state your reasoning in one sentence a player could reuse to ' +
      'predict you next time.',
    worldKeys: [
      { key: 'record', description: 'Hits and misses: { hits, misses }.' },
      { key: 'tendencies', description: 'Reasoning patterns the player has now seen, newest last.' },
    ],
    seedWorld: {
      record: { hits: 0, misses: 0 },
      tendencies: [],
      facts: [],
    },
    openingPrompt: 'Offer something, and name what you think it will pull back.',
  },
}

/**
 * Reading order in the picker.
 *
 * Tag first: its rules fit in one sentence, and every other game here is a
 * variation on the exchange it establishes. Correlation Chain second because it is
 * Tag plus one rule. The world-building games come after the pure exchanges,
 * because they ask you to hold more.
 */
export const GAME_LIST: CorrelationGame[] = [
  GAMES.tag,
  GAMES.chain,
  GAMES.translation,
  GAMES.counterpoint,
  GAMES.embodiment,
  GAMES.duel,
  GAMES.transformation,
  GAMES.investigation,
  GAMES.navigation,
  GAMES.construction,
  GAMES.prediction,
]

/**
 * What the front-page strip shows, as explicit data rather than a slice of
 * GAME_LIST — so reordering the picker cannot silently change the home page.
 */
export const FEATURED_GAME_IDS = ['tag', 'chain', 'translation', 'embodiment'] as const

export const FEATURED_GAMES: CorrelationGame[] = FEATURED_GAME_IDS.map(id => GAMES[id])

/**
 * Games retired from the registry.
 *
 * `radio` was "Night Radio" — a radio operator whose transmitter reached places it
 * should not. It was the only game that genuinely required sound, and the dial it
 * ran on had leaked into three other games as a stand-in for the interpreter. Both
 * are gone.
 *
 * Kept as a list because sessions in the database still name it, and a player
 * opening one deserves to be told the game was retired rather than shown a generic
 * lookup failure.
 */
export const RETIRED_GAMES: Record<string, string> = {
  radio: 'Night Radio',
}

export function getGame(id: string): CorrelationGame | null {
  return (GAMES as Record<string, CorrelationGame>)[id] ?? null
}

export function retiredGameName(id: string): string | null {
  return RETIRED_GAMES[id] ?? null
}

/** Games where a move can be rejected outright rather than merely read. */
export function isStrict(game: CorrelationGame): boolean {
  return game.enforcesConstraint === true
}

/** Games that ask the player for a prediction alongside the move. */
export function wantsPrediction(game: CorrelationGame): boolean {
  return game.id === 'prediction'
}

/** Tailwind classes per accent, so a game stays one data edit from working chrome. */
export const ACCENT_CLASSES: Record<string, { chip: string; ring: string; text: string; bg: string }> = {
  indigo:  { chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',    ring: 'border-indigo-300 dark:border-indigo-800',   text: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  emerald: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', ring: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  amber:   { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',        ring: 'border-amber-300 dark:border-amber-800',     text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-950/30' },
  rose:    { chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',            ring: 'border-rose-300 dark:border-rose-800',       text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-950/30' },
  sky:     { chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',                ring: 'border-sky-300 dark:border-sky-800',         text: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-950/30' },
  violet:  { chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',    ring: 'border-violet-300 dark:border-violet-800',   text: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-950/30' },
  teal:    { chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',            ring: 'border-teal-300 dark:border-teal-800',       text: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-50 dark:bg-teal-950/30' },
  orange:  { chip: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',    ring: 'border-orange-300 dark:border-orange-800',   text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-950/30' },
  fuchsia: { chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300', ring: 'border-fuchsia-300 dark:border-fuchsia-800', text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30' },
  lime:    { chip: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',            ring: 'border-lime-300 dark:border-lime-800',       text: 'text-lime-600 dark:text-lime-400',       bg: 'bg-lime-50 dark:bg-lime-950/30' },
  cyan:    { chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',            ring: 'border-cyan-300 dark:border-cyan-800',       text: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  stone:   { chip: 'bg-stone-200 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300',        ring: 'border-stone-300 dark:border-stone-700',     text: 'text-stone-600 dark:text-stone-400',     bg: 'bg-stone-100 dark:bg-stone-900/40' },
}
