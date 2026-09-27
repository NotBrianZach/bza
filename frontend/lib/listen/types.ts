/**
 * AI Listen Along — shared types.
 *
 * A music game is one where choosing, identifying, arranging or performing
 * music changes what can happen next: the song has to do work in the rules,
 * otherwise it is just a soundtrack. Every mode in this section is assembled
 * from the same six pieces (see GamePieces) and differs only in what a song
 * *is* and who gets to interpret it.
 */

export type ListenModeId =
  | 'radio'
  | 'tag'
  | 'duel'
  | 'investigation'
  | 'navigation'
  | 'construction'
  | 'transformation'
  | 'prediction'

/**
 * Who reads the music. This is the distinction that actually changes play,
 * more than the mode label does:
 *
 *  - 'player'    social. You judge the connection; the interpreter argues but
 *                does not rule.
 *  - 'narrator'  story. An in-fiction interpreter turns the choice into an
 *                event, and the event sticks.
 *
 * There used to be a third kind, 'features', where legality was computed from
 * Spotify metadata — shared artist, same decade, near-identical length. It was
 * removed: those are facts *about* a release, not things you hear, and a game
 * that runs on them is a metadata quiz wearing a music game's clothes. Judging
 * a connection is now always something somebody does, and `enforcesConstraint`
 * is what decides whether that judgement can actually stop a move.
 */
export type Judge = 'player' | 'narrator'

/** The six pieces every mode has to answer for. */
export interface GamePieces {
  /** What can I choose? */
  playerMove: string
  /** How is that choice read? */
  interpreter: string
  /** What comes back? */
  responseRule: string
  /** What persists between turns? */
  worldState: string
  /** What makes a choice interesting? */
  constraint: string
  /** Why keep playing? */
  goal: string
}

export interface ListenMode {
  id: ListenModeId
  name: string
  tagline: string
  /** What a song *is* in this game — a move, an argument, a clue, a key… */
  songIs: string
  judge: Judge
  /**
   * Can the interpreter's judgement actually reject a move?
   *
   * Most modes read a move and carry on regardless — the reading *is* the
   * outcome. A mode that sets this is one where the move can simply fail: the
   * interpreter rules on whether the constraint was met, an illegal move does
   * not advance the world or the song on the table, and the turn is kept in the
   * log so the miss stays legible.
   */
  enforcesConstraint?: boolean
  pieces: GamePieces
  /** Persona and voice for the interpreter. */
  persona: string
  /** How the reply song must be chosen, in the interpreter's own terms. */
  replyRule: string
  /** Mode-specific world-state keys the interpreter is responsible for. */
  worldKeys: { key: string; description: string }[]
  /** Seed world state for a fresh session. */
  seedWorld: Record<string, unknown>
  /** Prompt shown above the first move. */
  openingPrompt: string
  /** Tailwind accent, used for the mode's chrome. */
  accent: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'teal' | 'orange'
}

/** A real Spotify track, as stored on a turn. Mirrors lib/spotify-server.ts. */
export interface TrackRef {
  id: string
  name: string
  artist: string
  artistIds: string[]
  album: string
  albumId: string | null
  releaseDate: string | null
  uri: string
  url: string | null
  image: string | null
  previewUrl: string | null
  durationMs: number
  popularity: number
  explicit: boolean
}

export interface WorldFact {
  text: string
  /** Turn index that established it — later turns can contradict it. */
  turn: number
}

export interface ListenSession {
  id: string
  user_id: string
  mode: ListenModeId
  title: string
  rules: {
    songIs: string
    judge: Judge
    pieces: GamePieces
    replyRule: string
  }
  world_state: Record<string, any>
  status: 'active' | 'finished'
  turn_count: number
  created_at: string
  updated_at: string
}

export interface ListenTurn {
  id: string
  session_id: string
  user_id: string
  turn_index: number
  move_track: TrackRef
  reply_track: TrackRef | null
  reply_query: string | null
  reading: string | null
  narration: string | null
  facts: string[]
  /**
   * False only in modes that set `enforcesConstraint`, when the interpreter
   * ruled the move did not connect. The row is still written so the miss shows
   * in the log.
   */
  legal: boolean
  created_at: string
}

/** What the interpreter is required to return. Validated server-side. */
export interface Interpretation {
  /** How the move was read — the argument, not the story. */
  reading: string
  /** What the exchange did to the world. */
  narration: string
  /** The reply song, as a query to resolve against Spotify. */
  replyQuery: string
  /** Why that reply answers this move. */
  replyReason: string
  /** New durable facts. Appended to world_state.facts. */
  facts: string[]
  /** Shallow merge into world_state. Never a wholesale rewrite. */
  worldDelta: Record<string, any>
  /**
   * Modes with `enforcesConstraint` only: did the move satisfy the constraint?
   * Authoritative there — this is the interpreter's ruling, and nothing
   * recomputes it.
   */
  verdict?: 'legal' | 'illegal'
}

export interface TurnResponse {
  turn: ListenTurn
  session: ListenSession
  /** Set when the dial found nothing — the reply query is kept for legibility. */
  missed?: boolean
}
