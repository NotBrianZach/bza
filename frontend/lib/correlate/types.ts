/**
 * Correlation games — shared types.
 *
 * A correlation game is one where a turn proposes a *connection* between two
 * things and makes that connection perceptible by offering a second thing. The
 * connection may be discovered or invented; what matters is that it is
 * explainable, and that the reply is real enough to be met.
 *
 * This generalises the music-only section that came before it. There the unit
 * was a track. Here it is an Offering, and the medium a player answers in is
 * itself a move: answering a frantic song with a stretch says "what I hear in
 * this is a need for release", and no single-medium game can say that.
 */

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export type MediumId =
  | 'music'
  | 'artwork'
  | 'passage'
  | 'gesture'
  | 'stretch'
  | 'exercise'
  | 'movement'
  | 'scene'

/**
 * How an offering comes into being, and therefore what stops it being a lie.
 *
 *  - 'catalogue'  It resolves to a record in an external collection. A miss is
 *                 possible, and a miss is the guard: the interpreter names a
 *                 query, the server searches, and nothing is asserted to exist
 *                 that does not.
 *  - 'library'    It resolves against the reader's own books. Same guard, no
 *                 network — and the only medium that connects this section to
 *                 the rest of the product.
 *  - 'composed'   It is authored on the spot. There is nothing to search, so
 *                 "the search found it" cannot be the guard. Performability is:
 *                 a composed offering must carry ordered, concrete steps and a
 *                 framing, because vague mush is the composed-medium equivalent
 *                 of an invented track.
 */
export type OfferingOrigin = 'catalogue' | 'library' | 'composed'

/** How an offering can actually be perceived in the page. */
export type Perceptible =
  | { kind: 'audio'; url: string }
  | { kind: 'image'; url: string; alt: string }
  | { kind: 'text'; body: string }
  | { kind: 'none' }

/**
 * Whether a physical offering is being depicted or requested.
 *
 * This is not a preference. 'shown' describes or depicts an action; 'invited'
 * asks someone to perform it. The engine additionally guarantees that a reply
 * may always be made in any medium the game has enabled, so participation never
 * depends on matching anyone's mobility, equipment, space or skill — which is
 * also precisely what makes translation and embodiment possible at all.
 */
export type ActionIntent = 'shown' | 'invited'

export interface Offering {
  medium: MediumId
  /**
   * Stable identity within the medium. A catalogue id for catalogued media, a
   * deterministic `composed:<medium>:<slug>` for authored ones. Used for
   * playback, the chain, and the exclusion set that stops a reply repeating
   * something already in play.
   */
  id: string
  title: string
  /** Artist, author, choreographer, director. Null when composed. */
  attribution: string | null
  /**
   * Which part of it is in play — the whole canvas, ten seconds of a scene, one
   * gesture, the sensation of a stretch. Required, and never defaulted to "all
   * of it": without it two players answer different things without noticing.
   */
  framing: string
  /** Composed media only: the ordered instructions that make it performable. */
  steps?: string[]
  /** Composed physical media only. */
  intent?: ActionIntent
  perceptible: Perceptible
  sourceUrl: string | null
  origin: OfferingOrigin
  /** Per-medium extras: genre, year, date_display, book title, hold time… */
  meta: Record<string, string | number | null>
}

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export type RelationId =
  | 'association'
  | 'translation'
  | 'transformation'
  | 'counterpoint'
  | 'embodiment'
  | 'continuation'
  | 'reinterpretation'

export interface Relation {
  id: RelationId
  name: string
  /** What a reply of this kind does, in one line. */
  does: string
  /** A worked example, shown in the picker. */
  example: string
  /**
   * True when the relation is only meaningful across a change of medium.
   * Translation and embodiment are; association is not. The engine uses this to
   * reject a declared relation that the chosen medium cannot support.
   */
  requiresMediumChange: boolean
  /** Appended to the interpreter prompt when this relation is in play. */
  guidance: string
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

/**
 * Who reads the offering.
 *
 *  - 'player'    social. You judge the connection; the interpreter argues but
 *                does not rule.
 *  - 'narrator'  story. An in-fiction interpreter turns the offering into an
 *                event, and the event sticks.
 */
export type Judge = 'player' | 'narrator'

/** The six pieces every game has to answer for. */
export interface GamePieces {
  /** What can I offer? */
  playerMove: string
  /** How is that offering read? */
  interpreter: string
  /** What comes back? */
  responseRule: string
  /** What persists between turns? */
  worldState: string
  /** What makes an offering interesting? */
  constraint: string
  /** Why keep playing? */
  goal: string
}

/**
 * Whether the player claims their relation or receives it.
 *
 * This changes play more than a label does. 'required' makes your reading a
 * claim you can be judged on. 'never' makes it a reading you are given.
 */
export type RelationDeclaration = 'required' | 'optional' | 'never'

export interface CorrelationGame {
  id: string
  name: string
  tagline: string
  /** What an offering *is* in this game — a move, an argument, a clue, a key… */
  offeringIs: string
  /** Media in play. 'all' means every medium the build supports. */
  media: MediumId[] | 'all'
  /** Relations a reply may use. 'all' means all seven. */
  relations: RelationId[] | 'all'
  judge: Judge
  declaredRelation: RelationDeclaration
  /**
   * Can the interpreter's judgement actually reject a move?
   *
   * Most games read a move and carry on — the reading *is* the outcome. A game
   * that sets this is one where a move can simply fail: an illegal move does not
   * advance the world or the offering on the table, and the turn is still logged
   * so the miss stays legible.
   */
  enforcesConstraint?: boolean
  pieces: GamePieces
  persona: string
  /** How the reply must be chosen, in the interpreter's own terms. */
  replyRule: string
  worldKeys: { key: string; description: string }[]
  seedWorld: Record<string, unknown>
  openingPrompt: string
  accent: AccentId
}

export type AccentId =
  | 'indigo' | 'emerald' | 'amber' | 'rose'
  | 'sky' | 'violet' | 'teal' | 'orange'
  | 'fuchsia' | 'lime' | 'cyan' | 'stone'

// ---------------------------------------------------------------------------
// Sessions and turns
// ---------------------------------------------------------------------------

export interface WorldFact {
  text: string
  /** Turn index that established it — later turns can contradict it. */
  turn: number
}

export interface CorrelationSession {
  id: string
  user_id: string
  /** Column is still named `mode` in the database. */
  mode: string
  title: string
  /** Snapshot of the rules at creation, so editing the registry cannot change
   *  how an in-progress game is read. */
  rules: {
    offeringIs: string
    judge: Judge
    pieces: GamePieces
    replyRule: string
    declaredRelation: RelationDeclaration
  }
  media: MediumId[]
  relations: RelationId[]
  world_state: Record<string, any>
  status: 'active' | 'finished'
  turn_count: number
  created_at: string
  updated_at: string
}

export interface CorrelationTurn {
  id: string
  session_id: string
  user_id: string
  turn_index: number
  move_offering: Offering
  reply_offering: Offering | null
  reply_query: string | null
  /** The relation the reply actually used, as ruled. */
  relation: RelationId | null
  /** What the player claimed, when they declared it. Kept alongside the ruling
   *  so a disagreement between the two is visible rather than silently lost. */
  claimed_relation: RelationId | null
  reading: string | null
  narration: string | null
  /**
   * What survived the change of representation, and what did not. The whole
   * point of a cross-medium game: rhythm becoming repetition in an image,
   * dissonance becoming conflict in a scene. The connection is rarely exact, so
   * naming what crossed and what was dropped is part of play.
   */
  carried: string | null
  lost: string | null
  facts: string[]
  /** False only in games that enforce their constraint, when the move was
   *  ruled not to connect. The row is still written. */
  legal: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// What the interpreter returns
// ---------------------------------------------------------------------------

/**
 * The reply, before it is real.
 *
 * A catalogued medium gets a `query` to search; a composed medium gets an
 * authored offering. Either way the server is what turns a plan into an
 * Offering, and either way the plan can fail to become one.
 */
export interface ReplyPlan {
  medium: MediumId
  /** Catalogued / library media: what to search for. */
  query?: string
  /** Composed media: the authored offering. */
  composed?: {
    title: string
    steps: string[]
    intent: ActionIntent
  }
  /** Which part of the reply is in play. Required either way. */
  framing: string
}

export interface Interpretation {
  /** How the move was read — the argument, not the story. */
  reading: string
  /** What the exchange did to the world. */
  narration: string
  reply: ReplyPlan | null
  /** Why that reply answers this move. */
  replyReason: string
  /** The relation the reply uses. */
  relation: RelationId | null
  carried: string
  lost: string
  facts: string[]
  /** Shallow merge into world_state. Never a wholesale rewrite. */
  worldDelta: Record<string, any>
  /** Games with `enforcesConstraint` only. Authoritative — nothing recomputes it. */
  verdict?: 'legal' | 'illegal'
}

export interface TurnResponse {
  turn: CorrelationTurn
  session: CorrelationSession
  replyReason?: string
  /** Set when the reply plan could not be made real. */
  missed?: boolean
}
