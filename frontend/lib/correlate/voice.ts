/**
 * Playing by voice, hands-free.
 *
 * The grammar only — no microphone, no speaker, no React. Browser plumbing lives
 * in components/correlate/useVoiceControl.ts, and it lives there for the usual
 * reason this codebase splits that way: a parser is the part that can be wrong
 * in a way a test can catch, and `SpeechRecognition` is the part that can only
 * be tried.
 *
 * ── Why a closed grammar and not a model call ─────────────────────────────
 *
 * The obvious design is to hand the utterance to an interpreter and let it
 * decide. It is the wrong one here, and not on cost: a voice command has to
 * resolve in the time it takes to stop talking, and this game's turn already
 * costs ten seconds of model call. A command layer that added another one would
 * make "again" slower than reaching for the mouse — which is the only thing
 * voice has to beat.
 *
 * So: a closed set of verbs matched locally, in microseconds, against the
 * registries that already exist. Every game name, medium and relation is
 * already declarative data; the grammar reads them rather than restating them,
 * which is why switching into a twelfth game would be sayable the day it is
 * added.
 *
 * ── The noun is the hard part ─────────────────────────────────────────────
 *
 * Verbs are easy: there are nine and they are unambiguous. Making a *move* is
 * not, because an offering is a record selected out of a search — "play
 * Idioteque" is a query, a result set and a choice, not a command. That is what
 * `VoiceStage` exists for: the grammar is stage-aware, so "the second one"
 * means a result only while results are on the table, and the same utterance is
 * a search query the rest of the time.
 *
 * ── Why the first version felt like Siri ──────────────────────────────────
 *
 * It was shaped as request/response, and that shape is the problem rather than
 * any one delay in it. Counting the mic-closed time in a single move as it
 * originally shipped:
 *
 *   "Looking for Idioteque."                     ~1.5s
 *   "Four matches. One, … Which one?"            ~10s
 *   "Playing that one."                          ~1.2s
 *   (the model)                                  10–15s
 *   title, attribution, and the whole reading    ~18s
 *
 * Around 45 seconds, of which the model is a quarter. Three-quarters was the
 * interface talking to itself, and every second of it was time the player could
 * not speak — which is the actual definition of the assistant feeling.
 *
 * Four things follow from that, and they are why this file looks the way it
 * does now:
 *
 *  1. **Acknowledge with a tone, not a sentence.** `confirmationFor` returns ''
 *     for everything whose outcome is visible or self-evident. A 120ms tone says
 *     "heard you" in a thirteenth of the time and barely closes the mic. Speech
 *     is kept only where it carries information the player cannot otherwise get:
 *     which game it thinks you said, a ruling, a question.
 *  2. **Don't ask when you know.** `pickConfidently` takes the obvious match
 *     instead of reading four options out. Naming a song is not an ambiguous
 *     act; treating it as one cost ten seconds every single move.
 *  3. **Interruption has to work.** See `BARGE_WORDS` — filtering a transcript
 *     is impossible in general but trivial against the exact string being
 *     spoken, which is the one thing we always have.
 *  4. **Prefer radio to command-and-control.** The engine already generates two
 *     answers ahead of the audio, so in radio the model latency is behind the
 *     buffer rather than in front of the player. A continuous thing you talk
 *     over beats a request/response thing you wait for, and no amount of shaving
 *     milliseconds off the second shape turns it into the first.
 */

import { GAMES, GAME_LIST, getGame } from './games'
import { MEDIA, getMedium } from './media'
import { RELATIONS } from './relations'
import type { CorrelationGame, MediumId, RelationId } from './types'

/**
 * Where the composer is, which decides what an utterance can mean.
 *
 * Deliberately tiny. A richer state machine was the first instinct and it was
 * wrong: every extra stage is another thing the player has to know they are in,
 * and a hands-free interface cannot show them where they are without being
 * looked at. Three stages is what the task actually has — nothing pending,
 * results to choose from, a claim waiting for its reason.
 */
export type VoiceStage = 'idle' | 'choosing' | 'claiming'

export type VoiceIntent =
  /** Ask for a different answer to the move just made. */
  | { kind: 'again' }
  /** Stand back and let the partner answer its own offering. */
  | { kind: 'selfReply' }
  /** Close the game and hear what it turned out to be. */
  | { kind: 'finish' }
  /** Arm a switch into another game. */
  | { kind: 'switch'; gameId: string }
  /** Set the medium the next offering will be searched in. */
  | { kind: 'medium'; medium: MediumId }
  /** Search for something to offer. */
  | { kind: 'offer'; query: string; medium?: MediumId }
  /** Take the Nth result, one-based. */
  | { kind: 'choose'; index: number }
  /** Name the relation being claimed, in games that ask. */
  | { kind: 'relation'; relation: RelationId }
  /** Say which part of the offering is in play. */
  | { kind: 'framing'; framing: string }
  /** A guess at what the move will draw back. */
  | { kind: 'predict'; text: string }
  /** Claim this exchange rhymes with an earlier one. */
  | { kind: 'rhymes'; turn: number }
  /** The reason for a claim, once one is pending. */
  | { kind: 'because'; note: string }
  /** Stand on an earlier exchange and answer that instead. */
  | { kind: 'goTo'; turn: number }
  /** Back to where the chain actually is. */
  | { kind: 'goBack' }
  /** Say the last reading again. */
  | { kind: 'repeat' }
  /**
   * Read the rest of the last reading.
   *
   * Exists because landing a turn now speaks the offering's name and the first
   * sentence rather than the whole thing. Four to six sentences of reading is
   * twenty seconds of mic-closed speech per move, and a player who wants it can
   * ask — which is a better trade than one who does not having to sit through it
   * every time.
   */
  | { kind: 'more' }
  /** Hand the chain to the partner and let it run, or take it back. */
  | { kind: 'radio'; on: boolean }
  /** Skip the track that is playing. */
  | { kind: 'skip' }
  /** Stop talking, without stopping listening. */
  | { kind: 'hush' }
  /** Read the available commands aloud. */
  | { kind: 'help' }
  /** Abandon whatever is pending. */
  | { kind: 'cancel' }

/** What the grammar needs to know about the game to resolve an utterance. */
export interface VoiceContext {
  stage: VoiceStage
  /** Media this session plays, so "as a stretch" can be refused when it is not one. */
  media: MediumId[]
  /** Relations the current game permits. */
  relations: RelationId[]
  /** Games the branch may switch into. */
  switchTargets: CorrelationGame[]
  /** How many results are on the table, so "the fourth" can be refused when there are three. */
  resultCount: number
  /**
   * Whether the game's own audio is playing out of the speakers right now.
   *
   * The most important field here, and the one whose absence broke voice play
   * the first time it was used in anger. An open microphone next to a playing
   * speaker hears the song, the recogniser transcribes the lyrics as speech, and
   * the grammar matches on them — so the game was taking commands from the music
   * it was playing. The symptom was a track starting and stopping over and over:
   * a lyric transcribed as "next" skips, the next track starts, and its lyrics
   * skip again.
   *
   * It cannot be echo-checked the way the partner's own speech can. We know the
   * string being read out by the speech synthesiser and can refuse any match
   * against it; we do not know the words of a song. So the answer is `WAKE` —
   * while audio plays, a command must be addressed.
   */
  audioPlaying: boolean
}

// ---------------------------------------------------------------------------
// Numbers, because turn references are spoken
// ---------------------------------------------------------------------------

const ONES: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
}
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
}

/**
 * A spoken number, as digits or words.
 *
 * Handles the compound forms a person actually says for a turn index —
 * "twenty one", "twenty-one" — and stops there. Nothing above ninety-nine,
 * because `MAX_TURNS` is 400 but a chain nobody can see past about thirty is
 * not one anybody refers to by number out loud.
 *
 * Returns null rather than 0 for "no number here", because turn 0 is a real
 * turn and `0 || fallback` would quietly swallow it.
 */
export function spokenNumber(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/-/g, ' ')
  const digits = t.match(/\b(\d{1,3})\b/)
  if (digits) return parseInt(digits[1], 10)

  const words = t.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const tens = TENS[words[i]]
    if (tens !== undefined) {
      const ones = ONES[words[i + 1] ?? '']
      return tens + (ones !== undefined && ones < 10 ? ones : 0)
    }
    const ones = ONES[words[i]]
    if (ones !== undefined) return ones
  }
  return null
}

/**
 * An ordinal, for choosing a result. One-based, matching how they are read out.
 *
 * "the one" and "that one" resolve to 1 on purpose: with a single result on the
 * table they are the natural thing to say, and with several the player has
 * already heard them numbered, so an unqualified "that one" meaning the first
 * is the least surprising reading available.
 */
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  last: -1,
}

export function spokenOrdinal(text: string, count: number): number | null {
  const t = text.trim().toLowerCase().replace(/^(take |use |pick |choose |go with )/, '')
  const bare = t.replace(/^the /, '').replace(/ one$/, '').trim()

  if (/^(that|this|it|yes|yep|ok|okay)$/.test(bare)) return count > 0 ? 1 : null

  const ord = ORDINALS[bare]
  if (ord !== undefined) return ord === -1 ? count : ord

  // "number three", "three" — only when something is on the table, because a
  // bare number is a turn reference in every other stage.
  const n = spokenNumber(bare)
  if (n !== null && n >= 1 && n <= count) return n
  return null
}

// ---------------------------------------------------------------------------
// Media, by the names people say rather than the ids the engine uses
// ---------------------------------------------------------------------------

/**
 * Spoken synonyms per medium.
 *
 * Needed because every medium's id is a word nobody says. "Play me a passage"
 * is not how anyone asks for a book extract, and `scene` is the id for film and
 * television — a player saying "a scene" most likely means one, but a player
 * saying "a movie" certainly does.
 *
 * The id, singular and plural are added automatically below, so this table
 * holds only the words the registry does not already know.
 */
const MEDIUM_WORDS: Partial<Record<MediumId, string[]>> = {
  music: ['song', 'songs', 'track', 'tune', 'record', 'album'],
  artwork: ['art', 'painting', 'picture', 'image', 'canvas'],
  passage: ['reading', 'book', 'text', 'extract', 'quote', 'poem', 'novel'],
  scene: ['film', 'movie', 'tv', 'television', 'show', 'episode'],
  theorem: ['maths', 'math', 'mathematics', 'proof', 'equation'],
  phenomenon: ['science', 'physics', 'chemistry', 'effect'],
  organism: ['life', 'animal', 'plant', 'creature', 'species'],
  // First word first on purpose: `spokenMediaNames` reads it out, and a list
  // that mixes "song, art" with "stretches, exercises" sounds like two
  // different kinds of thing.
  place: ['place', 'places', 'location', 'somewhere', 'geography'],
  gesture: ['gesture', 'gestures', 'sign'],
  movement: ['dance', 'dancing', 'choreography'],
  stretch: ['stretch', 'stretches', 'stretching'],
  exercise: ['exercise', 'exercises', 'workout'],
}

/** Every spoken form of a medium, longest first so "television" beats "tv". */
function mediumVocabulary(media: MediumId[]): { word: string; medium: MediumId }[] {
  const out: { word: string; medium: MediumId }[] = []
  for (const id of media) {
    const m = getMedium(id)
    const words = new Set<string>([id, ...(MEDIUM_WORDS[id] ?? [])])
    if (m) {
      words.add(m.plural.toLowerCase())
      if ((m as any).singular) words.add(String((m as any).singular).toLowerCase())
    }
    for (const w of words) out.push({ word: w, medium: id })
  }
  return out.sort((a, b) => b.word.length - a.word.length)
}

/**
 * The medium an utterance names, if any, and the utterance with it removed.
 *
 * Returns both because "play the song Idioteque" is one sentence carrying two
 * things, and a caller that had to strip the medium itself would be
 * reimplementing half of this.
 */
export function extractMedium(
  text: string,
  media: MediumId[],
): { medium: MediumId | null; rest: string } {
  const t = ` ${text.toLowerCase().trim()} `
  for (const { word, medium } of mediumVocabulary(media)) {
    // Only as a *qualifier* — "a song", "the painting", "in music", "as a
    // stretch" — never as a bare content word, or "play Life On Mars" would
    // resolve its medium from the word "life".
    const m = t.match(new RegExp(`\\b(?:a|an|the|in|as|with)\\s+(?:a\\s+|an\\s+)?${word}\\b`))
    if (m) {
      return { medium, rest: (t.replace(m[0], ' ').trim().replace(/\s+/g, ' ')) }
    }
  }
  return { medium: null, rest: text.trim() }
}

// ---------------------------------------------------------------------------
// Games and relations, matched against the registries
// ---------------------------------------------------------------------------

/**
 * A game by spoken name, matched against the switch targets rather than the
 * whole registry.
 *
 * Scoped on purpose: "switch to duel" from a chain game is refused by
 * `switchRefusal` anyway, and a grammar that resolved it would turn a clear
 * "I cannot switch into that" into a command that silently did nothing.
 *
 * Matches on a normalized substring either way round, so "correlation chain",
 * "chain" and "the chain game" all land on the same entry.
 */
export function matchGame(text: string, targets: CorrelationGame[]): CorrelationGame | null {
  const t = text.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  if (!t) return null
  let best: CorrelationGame | null = null
  for (const g of targets) {
    const name = g.name.toLowerCase()
    if (t === name || t === g.id) return g
    if (t.includes(name) || name.includes(t) || t.includes(g.id)) {
      // Longest name wins, so "correlation chain" is not taken by "chain".
      if (!best || g.name.length > best.name.length) best = g
    }
  }
  return best
}

export function matchRelation(text: string, relations: RelationId[]): RelationId | null {
  const t = text.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  for (const id of relations) {
    if (t === id || t.includes(id)) return id
    // Looked up rather than indexed: an id the registry does not know is a bad
    // argument, and the right answer to one is "no match" and not a crash
    // inside the microphone's result handler — where a throw kills the
    // recogniser and voice mode simply stops working.
    const name = RELATIONS[id]?.name?.toLowerCase()
    if (name && (t === name || t.includes(name))) return id
  }
  return null
}

// ---------------------------------------------------------------------------
// Taking the obvious match instead of asking
// ---------------------------------------------------------------------------

/** Words too common to count as evidence that a title is the one meant. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'by',
  'me', 'us', 'it', 'is', 'song', 'track', 'by',
])

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w))
}

/**
 * How well an offering answers a spoken query, 0..1.
 *
 * The fraction of the query's content words that appear in the title or its
 * attribution. Deliberately not a fuzzy string distance: speech recognition
 * errors are *word* substitutions, not character ones, so a per-word measure is
 * both the right granularity and one you can reason about from a transcript.
 */
export function matchScore(query: string, offering: { title: string; attribution?: string | null }): number {
  const want = tokens(query)
  if (want.length === 0) return 0
  const have = new Set(tokens(`${offering.title} ${offering.attribution ?? ''}`))
  return want.filter(w => have.has(w)).length / want.length
}

/**
 * The result to take without asking, or the handful worth asking about.
 *
 * The single biggest thing wrong with the first version of voice play. Naming a
 * song is not an ambiguous act, and treating every search as a disambiguation
 * cost ten seconds of read-aloud plus a whole extra turn of speaking, on every
 * move, to confirm something the player had already said.
 *
 * Confident means two things at once, and it needs both:
 *
 *  - the best result accounts for most of what was asked for (`CONFIDENT_SCORE`)
 *  - and it is clearly better than the runner-up (`CONFIDENT_MARGIN`)
 *
 * The margin is what stops "play Jupiter" silently picking one of eight
 * recordings of the same movement. Without it a high score on several
 * near-identical titles would read as certainty, which is exactly when the
 * player does want to be asked.
 *
 * One result is a special case and goes through without a margin: there is
 * nothing to be ambiguous *with*, and "one match — do you want it?" is the
 * purest form of the question nobody needs asked.
 */
export const CONFIDENT_SCORE = 0.75
export const CONFIDENT_MARGIN = 0.25

export function pickConfidently<T extends { title: string; attribution?: string | null }>(
  query: string,
  offerings: T[],
): { pick: T | null; options: T[] } {
  if (offerings.length === 0) return { pick: null, options: [] }

  const scored = offerings
    .map(o => ({ o, score: matchScore(query, o) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (offerings.length === 1) {
    return best.score > 0 ? { pick: best.o, options: [] } : { pick: null, options: [best.o] }
  }

  const margin = best.score - scored[1].score
  if (best.score >= CONFIDENT_SCORE && margin >= CONFIDENT_MARGIN) {
    return { pick: best.o, options: [] }
  }
  // Two, not four. If the top two are not enough to choose between, a third and
  // fourth are not going to settle it — they just cost five more seconds.
  return { pick: null, options: scored.slice(0, 2).map(s => s.o) }
}

// ---------------------------------------------------------------------------
// Interrupting the speaker
// ---------------------------------------------------------------------------

/**
 * What the player may say *while* the partner is talking.
 *
 * Barge-in is most of what separates a conversation from a kiosk, and the
 * module comment in useVoiceControl is right that you cannot generally tell an
 * echo from a person — the recogniser does not say where a phrase came from.
 *
 * But the general problem is not the one we have. We know the exact string being
 * spoken. So a word that does **not** occur in it cannot have been echoed, and a
 * word that does is thrown away. That makes a small vocabulary safe without
 * making any claim about the acoustics, which is why it is a closed list of
 * short words rather than the whole grammar.
 */
const BARGE_WORDS: { say: RegExp; intent: VoiceIntent }[] = [
  { say: /^(stop|quiet|hush|enough|be quiet|shut up)$/, intent: { kind: 'hush' } },
  { say: /^(next|skip|skip it|move on)$/, intent: { kind: 'skip' } },
]

/**
 * An interruption, or null.
 *
 * `spoken` is the text currently being read out. A candidate whose words appear
 * in it is dropped as an echo — conservative on purpose: losing one genuine
 * "stop" costs a second of patience, while acting on an echo makes the interface
 * look possessed.
 */
export function parseBarge(utterance: string, spoken: string): VoiceIntent | null {
  const t = strip(utterance)
  if (!t) return null
  const said = new Set(tokens(spoken))
  for (const { say, intent } of BARGE_WORDS) {
    if (!say.test(t)) continue
    if (tokens(t).some(w => said.has(w))) return null
    return intent
  }
  return null
}

// ---------------------------------------------------------------------------
// The commands, which are also the hint layer
// ---------------------------------------------------------------------------

/**
 * One command, as the player hears about it.
 *
 * `say` is what the hint layer prints next to a control, which is the reason
 * this is a declarative table and not a chain of `if`s in the parser: a voice
 * interface nobody can see has exactly one discoverability surface, and it has
 * to be generated from the same thing that does the matching or the two drift
 * and the printed phrase stops working.
 *
 * `control` names the button a hint belongs beside. Null for commands with no
 * button — there is no "repeat that" control, and there should not be one.
 */
export interface VoiceCommand {
  kind: VoiceIntent['kind']
  /** The canonical phrasing, shown in the UI. */
  say: string
  /**
   * How to read `say` out, when the written form does not survive speech.
   *
   * `play <anything>` is clear on screen and becomes "play anything" aloud,
   * which sounds like a command in itself. Only the placeholder phrases need
   * one; the literal ones are already what you say.
   */
  aloud?: string
  /** One line on what it does, for the spoken help. */
  does: string
  /** Which on-screen control this is the voice form of. */
  control:
    | 'again' | 'selfReply' | 'finish' | 'switch' | 'claim' | 'compose' | 'branch'
    | 'radio' | 'playback'
    | null
  /** Stages where it means anything. Empty means every stage. */
  stages?: VoiceStage[]
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  // First in the table because it is the fast path and the one worth learning.
  // Radio generates two answers ahead of the audio, so the model's ten seconds
  // sit behind the music instead of in front of you — which is the whole
  // difference between playing this hands-free and operating it hands-free.
  { kind: 'radio', say: 'keep going', does: 'Hand the chain over and let it run — it keeps playing and you talk over it. The fast way to listen.', control: 'radio' },
  { kind: 'radio', say: 'my turn', does: 'Take the chain back off radio.', control: 'radio' },
  { kind: 'offer', say: 'play <anything>', aloud: 'play, then the name of something', does: 'Search for something to offer, and take the obvious match. For instance, play the song Idioteque.', control: 'compose' },
  { kind: 'skip', say: 'next', does: 'Skip what is playing. Works while it is talking, too.', control: 'playback' },
  { kind: 'hush', say: 'stop', does: 'Stop it reading, without stopping listening. Works mid-sentence.', control: 'playback' },
  { kind: 'more', say: 'go on', does: 'Read the rest of the last reading — landing a turn reads you the first line only.', control: null },
  { kind: 'choose', say: 'the second one', does: 'Take one of the results just read out.', control: 'compose', stages: ['choosing'] },
  { kind: 'medium', say: 'in art', does: 'Change the medium the next offering is searched in. Name any medium this session plays.', control: 'compose' },
  { kind: 'framing', say: 'framing <words>', aloud: 'framing, then the part you mean', does: 'Say which part of the offering is in play, like framing the last ten seconds.', control: 'compose' },
  { kind: 'relation', say: 'claiming translation', does: 'Name the relation you are claiming, in games that ask for one.', control: 'compose' },
  { kind: 'predict', say: 'predict <anything>', aloud: 'predict, then your guess', does: 'Guess what your move will draw back.', control: 'compose' },
  { kind: 'again', say: 'again', does: 'Get a second answer to the move you just made. Both are kept.', control: 'again' },
  { kind: 'selfReply', say: 'you go', does: 'Stand back and let it answer its own offering.', control: 'selfReply' },
  { kind: 'switch', say: 'switch to <game>', aloud: 'switch to, then a game name', does: 'Play the next move as a different game.', control: 'switch' },
  { kind: 'rhymes', say: 'this rhymes with turn 4', does: 'Claim that two exchanges rhyme. Then say why, and it is ruled on.', control: 'claim' },
  { kind: 'because', say: 'because <reason>', aloud: 'because, then your reason', does: 'The reason for the rhyme you just claimed.', control: 'claim', stages: ['claiming'] },
  { kind: 'goTo', say: 'go to turn 3', does: 'Stand on an earlier exchange and answer that one instead, which starts a branch.', control: 'branch' },
  { kind: 'goBack', say: 'go back', does: 'Return to where the chain actually is.', control: 'branch' },
  { kind: 'finish', say: 'finish', does: 'Close the game and hear what it turned out to be.', control: 'finish' },
  { kind: 'repeat', say: 'say that again', does: 'Re-read the last answer aloud.', control: null },
  { kind: 'cancel', say: 'never mind', does: 'Drop whatever is pending.', control: null },
  { kind: 'help', say: 'what can I say', does: 'Read this list out, and put it on screen.', control: null },
]

/** The commands worth printing beside a given control, in table order. */
export function hintsFor(control: VoiceCommand['control'], stage: VoiceStage): VoiceCommand[] {
  return VOICE_COMMANDS.filter(c =>
    c.control === control && (!c.stages || c.stages.includes(stage)))
}

/**
 * When a stage-gated command applies, in words.
 *
 * The help lists every command rather than only the live ones, so each gated
 * one has to say what it is waiting for — otherwise the list promises phrases
 * that do nothing, which is worse than omitting them.
 */
const STAGE_CONDITIONS: Record<VoiceStage, string> = {
  idle: '',
  choosing: 'once some results have been read out',
  claiming: 'after you have claimed a rhyme',
}

/** The condition on a command, or null when it always applies. */
export function whenAvailable(c: VoiceCommand): string | null {
  if (!c.stages || c.stages.length === 0) return null
  const conditions = c.stages.map(s => STAGE_CONDITIONS[s]).filter(Boolean)
  return conditions.length > 0 ? conditions.join(' or ') : null
}

// ---------------------------------------------------------------------------
// The parser
// ---------------------------------------------------------------------------

/** Filler a speech recogniser cheerfully transcribes and nothing should match on. */
const LEADERS = /^(?:ok(?:ay)?|hey|um+|uh+|so|now|please|could you|can you|let'?s|lets|i'?d like to|i want to)\b[\s,]*/i

/**
 * Addressing it, which is required only while its own audio is playing.
 *
 * A deliberate subset of `LEADERS` — "um" and "so" are things people say while
 * thinking, and requiring one of those as a wake word would be no filter at all.
 * These are the ones that mean "I am talking to you now".
 *
 * Why a wake word and not something cleverer: the recogniser gives us a
 * transcript with no indication of where the sound came from, and over a playing
 * speaker a large share of what it hears is the song. The partner's own speech
 * can be filtered because we know its exact text (see `parseBarge`); lyrics
 * cannot. Requiring the player to address the game is the only remaining signal,
 * and it costs one word — and only while something is playing, so the quiet
 * case stays conversational.
 */
const WAKE = /^(?:ok(?:ay)?|hey|yo|hi|listen|computer)\b[\s,]*/i

function strip(text: string): string {
  let t = text.trim().toLowerCase().replace(/[.!?]+$/, '')
  // Repeatedly, because "ok so now play…" is a real transcript.
  for (let i = 0; i < 4; i++) {
    const next = t.replace(LEADERS, '')
    if (next === t) break
    t = next
  }
  return t.trim()
}

/** Whether an utterance addresses the game, for the audio-playing case. */
export function isAddressed(utterance: string): boolean {
  return WAKE.test(utterance.trim())
}

/**
 * An utterance to an intent, or null when it is not a command.
 *
 * Null is the common case and the important one: hands-free means the
 * microphone is open while the player talks to the room, and a parser that
 * guessed would play turns nobody asked for. Everything here anchors on a verb
 * at the start of the utterance, so ambient speech falls through.
 *
 * Order matters where prefixes overlap, and the overlaps are commented. Tested
 * in tests/correlate-logic.mjs.
 */
export function parseVoice(utterance: string, ctx: VoiceContext): VoiceIntent | null {
  // While its own audio is playing, a command has to be addressed. Everything
  // the microphone picks up is then either the player or the song, and this is
  // the only thing that tells them apart — see `VoiceContext.audioPlaying`.
  // Without it the game takes instructions from the music it is playing.
  if (ctx.audioPlaying && !isAddressed(utterance)) return null

  const t = strip(utterance)
  if (!t) return null

  // ── Stage-specific first, because these utterances are ambiguous elsewhere ──
  //
  // "the second one" is a result choice while results are up and meaningless
  // otherwise; "because it ends the same way" is a claim's reason while a claim
  // is pending and ordinary conversation at any other moment. Matching them
  // globally would make the microphone dangerous.
  if (ctx.stage === 'choosing') {
    const idx = spokenOrdinal(t, ctx.resultCount)
    if (idx !== null && idx >= 1 && idx <= ctx.resultCount) return { kind: 'choose', index: idx }
  }
  if (ctx.stage === 'claiming') {
    const m = t.match(/^(?:because|since|they both|both of them|they)\s+(.{3,})$/)
    if (m) return { kind: 'because', note: m[1].trim() }
  }

  if (/^(never mind|nevermind|cancel|forget it|stop that|scratch that)$/.test(t)) {
    return { kind: 'cancel' }
  }
  // Broad, because this is the one command a player reaches for when nothing
  // else has worked — and it is the only one that cannot be discovered by
  // asking. Every phrasing here is one somebody would actually try.
  if (/^(?:(?:what|list|read|tell me)\s+)?(?:the\s+|my\s+|your\s+)?(?:voice\s+)?(?:commands?|options|help)$/.test(t)
    || /^(?:what can i say|what can you do|what are my options|what are the commands|how does this work|what do i say)$/.test(t)) {
    return { kind: 'help' }
  }
  if (/^(say that again|repeat( that)?|read that again|what was that)$/.test(t)) {
    return { kind: 'repeat' }
  }
  // "and" and "more" are gone. A one-word command that is also one of the
  // commonest words in English is not a command, it is a tripwire — and these
  // are matched against a transcript of whatever the room is doing.
  if (/^(go on|the rest|read the rest|tell me more|finish the thought)$/.test(t)) {
    return { kind: 'more' }
  }

  // ── Playback and radio, before the bare verbs ──
  //
  // These are the short utterances and they have to win. "stop" reaching
  // `finish` and ending the game because the player wanted the reading to stop
  // is the worst available misparse, so `finish` no longer answers to it at all.
  if (/^(stop|quiet|hush|enough|be quiet|shut up|stop talking|stop reading)$/.test(t)) {
    return { kind: 'hush' }
  }
  if (/^(next|skip|skip it|skip this|move on|next one)$/.test(t)) return { kind: 'skip' }
  /*
   * "keep going" and "carry on" mean radio, not one self-reply.
   *
   * They used to mean `selfReply`, which was the narrower reading of a phrase
   * that plainly asks for an open run rather than one more turn — and the
   * narrow reading is the slow one, since a single self-reply still makes you
   * wait for the model with nothing playing. "you go" stays as the one-turn
   * version for anyone who wants exactly that.
   */
  /*
   * "don't stop" and "let me" used to be here, for radio on and radio off.
   *
   * In a game whose output is music, with the microphone open while it plays.
   * They are two of the commonest lines in pop songs, so the radio toggled
   * itself off and on from its own audio — which, with "next" doing the same
   * thing to the queue, is what made a track start and stop over and over.
   *
   * Kept short but no longer things a song is likely to say in isolation.
   */
  if (/^(radio|radio on|keep going|keep playing|take it over|you drive|start radio)$/.test(t)) {
    return { kind: 'radio', on: true }
  }
  if (/^(radio off|my turn|stop radio|stop the radio|i'?ll take it|give it back)$/.test(t)) {
    return { kind: 'radio', on: false }
  }

  // ── Turn references ──
  // "go to turn 3" before the bare verbs, since "go back" shares a prefix.
  if (/^go back$|^back to (where|the head)/.test(t)) return { kind: 'goBack' }
  const goTo = t.match(/^(?:go to|jump to|take me to|branch from)\s+(?:turn\s+)?(.+)$/)
  if (goTo) {
    const n = spokenNumber(goTo[1])
    if (n !== null) return { kind: 'goTo', turn: n }
  }
  const rhymes = t.match(/^(?:this |that |it )?rhymes with\s+(?:turn\s+)?(.+)$/)
  if (rhymes) {
    const n = spokenNumber(rhymes[1])
    if (n !== null) return { kind: 'rhymes', turn: n }
  }

  // ── The bare verbs ──
  if (/^(again|answer it again|try again|another answer|one more)$/.test(t)) return { kind: 'again' }
  if (/^(you go|your turn|answer yourself|let it answer( itself)?|one more turn)$/.test(t)) {
    return { kind: 'selfReply' }
  }
  // "that's it" is gone along with "stop": both are things people say to mean
  // "be quiet", and closing the game is not an action to reach by near-miss.
  if (/^(finish|close it|close the game|end the game|i'?m done|we'?re done)$/.test(t)) {
    return { kind: 'finish' }
  }

  // ── Switching ──
  const sw = t.match(/^(?:switch to|play as|change to|make it)\s+(.+)$/)
  if (sw) {
    const g = matchGame(sw[1], ctx.switchTargets)
    if (g) return { kind: 'switch', gameId: g.id }
    return null
  }

  // ── Composer fields, before `offer` — "framing the last ten seconds" would
  //    otherwise be unreachable, since nothing stops a search for those words.
  const framing = t.match(/^(?:framing|the part that matters is|just)\s+(.{2,})$/)
  if (framing) return { kind: 'framing', framing: framing[1].trim() }

  const rel = t.match(/^(?:claiming|claim|the relation is|as a)\s+(.+)$/)
  if (rel) {
    const r = matchRelation(rel[1], ctx.relations)
    if (r) return { kind: 'relation', relation: r }
    // Deliberately falls through rather than returning null: "as a stretch" is
    // a medium, and it reaches the medium rule below.
  }

  const predict = t.match(/^(?:predict|i predict|i think it'?ll|my guess is|guessing)\s+(.{3,})$/)
  if (predict) return { kind: 'predict', text: predict[1].trim() }

  // ── Medium on its own ──
  const bareMedium = extractMedium(t, ctx.media)
  if (bareMedium.medium && bareMedium.rest.length <= 2) {
    return { kind: 'medium', medium: bareMedium.medium }
  }

  // ── Offering a move, which is everything left that starts with a verb ──
  const offer = t.match(/^(?:play|offer|try|put up|answer with|how about|give me)\s+(.{2,})$/)
  if (offer) {
    const { medium, rest } = extractMedium(offer[1], ctx.media)
    // `\b\s*` rather than `\s+`: "play me a song" leaves the bare word "me"
    // once the medium is removed, and a trailing-space requirement left it
    // standing as a two-character query — which searched the catalogue for
    // "me" instead of taking the medium change the sentence plainly is.
    const query = rest.replace(/^(?:me|us)\b\s*/, '').trim()
    if (query.length < 2) {
      // "play me a song" named a medium and no query — that is a medium change,
      // which is the useful reading rather than an empty search.
      return medium ? { kind: 'medium', medium } : null
    }
    return medium ? { kind: 'offer', query, medium } : { kind: 'offer', query }
  }

  return null
}

/**
 * What to say back after acting, or '' to answer with a tone instead.
 *
 * Mostly '' now, and that is the point. Every one of these used to be a
 * sentence, on the reasoning that acting silently is indistinguishable from not
 * having heard — which is true, and is an argument for *acknowledging*, not for
 * speaking. The microphone is closed while the partner talks, so a 1.5-second
 * "Asking again." is 1.5 seconds the player cannot talk, spent telling them
 * something they just said. A 120ms tone discharges the same duty.
 *
 * So speech survives in exactly three places, and each earns it:
 *
 *  - **Which value it heard.** "transformation" and "translation" are one
 *    phoneme apart and pick different games; a tone cannot tell you which it
 *    took. Same for a medium or a relation.
 *  - **A question.** Claiming a rhyme has to ask why, or the player is waiting
 *    for a prompt that never comes.
 *  - **An answer.** A ruling is the whole point of making a claim.
 *
 * Everything else is visible on screen the moment it happens, and the player
 * who is not looking does not need it narrated — they need the mic back.
 */
export function confirmationFor(intent: VoiceIntent): string {
  switch (intent.kind) {
    // Which value it heard, where mishearing it changes what happens.
    case 'switch': return `Next move as ${getGame(intent.gameId)?.name ?? intent.gameId}.`
    case 'medium': return `${getMedium(intent.medium)?.plural ?? intent.medium} it is.`
    case 'relation': return `Claiming ${RELATIONS[intent.relation]?.name ?? intent.relation}.`
    // A question, and the answer to one.
    //
    // `turn` is the number the player said, which is the one the board prints —
    // the zero-based `turn_index` conversion belongs at the lookup, not here.
    // Echoing `turn + 1` was the first version and it confirmed the wrong turn.
    case 'rhymes': return `Turn ${intent.turn}. Why do they rhyme?`
    case 'because': return 'Ruling on that.'
    // Radio changes who is driving for an open-ended stretch, which is worth one
    // short sentence — it is the one state you cannot infer from what you hear,
    // because in both cases what you hear is music.
    case 'radio': return intent.on ? 'Taking it from here.' : 'Back to you.'

    // Tone only. The action is immediate, visible, or both.
    case 'again':
    case 'selfReply':
    case 'finish':
    case 'offer':
    case 'choose':
    case 'framing':
    case 'predict':
    case 'goTo':
    case 'goBack':
    case 'skip':
    case 'hush':
    case 'cancel':
    // Spoken by the hook, which holds the text.
    case 'repeat':
    case 'more':
    case 'help':
      return ''
  }
}

/**
 * The opening of a reading, for speaking on landing.
 *
 * A reading runs one to six sentences depending on the breadth tuning, and six
 * is twenty seconds of speech with the microphone shut. The first sentence is
 * the claim and the rest is the argument for it, so the first sentence is what a
 * listener needs to decide whether to ask for the rest — which "go on" does.
 *
 * Takes a second sentence when the first is very short, because a four-word
 * opener followed by silence sounds like it was cut off.
 */
export function openingSentence(text: string): { opening: string; rest: string } {
  const trimmed = text.trim()
  if (!trimmed) return { opening: '', rest: '' }

  const parts = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)
  if (!parts || parts.length <= 1) return { opening: trimmed, rest: '' }

  // 30, not 60: "It answers the hurry with stillness." is 36 characters and a
  // complete thought that stands on its own. The case this exists for is "It
  // rhymes." — ten characters, where stopping sounds like being cut off.
  let take = 1
  if (parts[0].trim().length < 30 && parts.length > 2) take = 2
  return {
    opening: parts.slice(0, take).join('').trim(),
    rest: parts.slice(take).join('').trim(),
  }
}

/**
 * The spoken help: every command, each with what it does.
 *
 * All of them, not the ones live at this stage. The first version read only the
 * phrases and only the live ones, on the reasoning that a shorter list is a
 * kinder one — but a phrase with no explanation is not a command anybody can
 * use, and a list that silently drops two entries teaches a vocabulary that is
 * missing the parts a player would never guess. The gated ones carry their
 * condition instead, so nothing is promised that does not work yet.
 *
 * This takes most of a minute to read, which is why asking for it also opens the
 * written list and why the speaker can be stopped mid-sentence. The audio is the
 * channel that works when nobody is looking, not the only one.
 *
 * The two open vocabularies are appended because they are the part a player
 * cannot guess: which media this session plays and which games it can switch
 * into. Both come from the registries, so neither can go stale.
 */
export function spokenHelp(ctx: VoiceContext): string {
  const lines = VOICE_COMMANDS.map(c => {
    // `aloud` where the written phrase does not survive speech; the angle
    // brackets are a written convention and are noise read out.
    const phrase = c.aloud ?? c.say.replace(/[<>]/g, '')
    const when = whenAvailable(c)
    // No "Say …" lead-in: it makes "say that again" into "Say say that again".
    // The `aloud` forms all start with their verb, so the phrase stands alone.
    return `${phrase}. ${c.does}${when ? ` That one works ${when}.` : ''}`
  })

  const media = spokenMediaNames(ctx.media).map(m => m.say)
  const vocab: string[] = []
  if (media.length > 0) vocab.push(`The media you can ask for are: ${media.join(', ')}.`)
  if (ctx.switchTargets.length > 0) {
    vocab.push(`The games you can switch to are: ${ctx.switchTargets.map(g => g.name).join(', ')}.`)
  }

  return [
    `There are ${VOICE_COMMANDS.length} things you can say.`,
    ...lines,
    ...vocab,
    'They are all written on screen as well.',
  ].join(' ')
}

/** Every game name the switch grammar will currently answer to, for the hints. */
export function switchableNames(targets: CorrelationGame[] = GAME_LIST): string[] {
  return targets.map(g => g.name)
}

/** Media this session can be asked for by voice, with the word to say. */
export function spokenMediaNames(media: MediumId[]): { medium: MediumId; say: string }[] {
  return media.map(m => ({
    medium: m,
    say: (MEDIUM_WORDS[m]?.[0] ?? getMedium(m)?.plural ?? m).toLowerCase(),
  }))
}

/** Exported for the tests, which assert the table and the parser agree. */
export const VOICE_MEDIUM_WORDS = MEDIUM_WORDS
export const VOICE_GAMES = GAMES
export const VOICE_MEDIA = MEDIA
