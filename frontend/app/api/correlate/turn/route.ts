import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { availableMedia, getMedium, isComposed, replyMediaFor } from '@/lib/correlate/media'
import { relationPermitted, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  applyWorldDelta, buildRetryPrompt, buildSalvageAccountPrompt, buildSeedPrompt,
  buildSeedSystemPrompt, buildSystemPrompt, buildUserPrompt, describeRejection,
  normalizeInterpretation, normalizeSeed, parseJsonObject, salvageQueries, sessionScope,
  systemPromptParts, type SystemPrompt,
  type ElsewhereContext, type TurnContext,
} from '@/lib/correlate/prompt'
import {
  buildGraph, childrenOf, defaultParent, linkableTurns, offeringIdsAlong, offeringOnTable,
  pathTo, relationsAlong, replyMediaAlong, turnByIndex, worldFor,
} from '@/lib/correlate/graph'
import {
  dueMedium, gatesLegality, mutedMedia, normalizeTuning, owedMedia, radioOf, readingLengths,
  weightedReplyMedia,
} from '@/lib/correlate/tuning'
import { selfRepliesSince, selfReplyRefusal } from '@/lib/correlate/continuation'
import {
  activeBranch, carriedSeedKeys, derivedSeedSpec, modeAlong, pathSinceSwitch, playedUnder,
  switchRefusal, switchSeed,
} from '@/lib/correlate/switching'
import type {
  ActionIntent, CorrelationTurn, Interpretation, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { OfferingError, composeOffering, lookupOffering, resolveReply } from '@/lib/offerings'
import { serverData } from '@/lib/supabaseSchema'

/**
 * Play one turn of a correlation game.
 *
 * Two kinds of turn come through here, and only step 1 differs between them. The
 * ordinary one: the player offers something and the partner answers it. The other
 * one — `selfReply` — is the partner answering its own previous offering, with the
 * player standing back. Everything from step 2 on is identical, deliberately: a
 * self-reply is a turn in the graph, with a relation, a world delta and a place on
 * the branch, not a second-class annotation hanging off one. That is what makes the
 * existing guards cover it without being re-implemented — the no-repeated-relation
 * rule, the exclusion set, and the reply guarantee all apply unchanged.
 *
 * The loop, in order:
 *   1. Make the move real. For a catalogued or library medium the server
 *      re-fetches it by id — the client sends an id, never an offering body,
 *      because the server is what decides which record a move is. For a composed
 *      medium there is nothing to fetch, so the move is performability-checked
 *      instead, which is the composed-medium equivalent of the same guard. On a
 *      self-reply there is nothing to make real: the move is a record this engine
 *      already resolved once, when it was played as an answer.
 *   2. Find where in the graph this turn goes. A turn answers its parent, which is
 *      whatever the player chose to go back to, defaulting to where they last were.
 *      Everything that used to mean "the last turn" now means "the parent", and
 *      everything that used to mean "the session" now means "this branch": the
 *      history shown, the world played in, the relations already spent.
 *   3. Rule the mechanical part of legality *before* spending a model call: a
 *      declared relation that requires a change of medium and did not get one is
 *      illegal on the face of it, and no interpreter needs to be consulted.
 *   4. Ask the interpreter to read the move, name the relation, plan a reply, and —
 *      optionally — point at an earlier exchange this one rhymes with. In a game
 *      that enforces its constraint the same call rules on whether the move
 *      connects at all, and that ruling is the only one there is.
 *   5. Make the reply real. A legal turn is never persisted without one.
 *   6. Persist the turn, its delta, and the weighting it was played under.
 *
 * POST {
 *   sessionId, medium, offeringId?, composed?, framing?, claimedRelation?, prediction?,
 *   parentTurnId?,   // present-and-null starts a new thread; absent continues
 *   tuning?,         // the weighting as of this turn; also saved to the session
 *   selfReply?,      // the partner answers its own last offering; no move is sent
 *   switchTo?,       // play this move under another game; see step 1b
 * }
 *
 * A third kind of turn joins the two above once `switchTo` is sent, and it is a
 * variation on the ordinary one rather than a fourth path: the move is made and
 * answered exactly as always, under a different game. What changes is which game
 * `step 1b` resolves, and the three things that hang off it — the relation set,
 * the world the deltas fold onto, and which relations count as spent. The switch
 * is a move, so it is a turn in the graph and nothing else; there is no
 * zero-turn boundary and no session-level mutation. See
 * lib/correlate/switching.ts.
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const HISTORY_TURNS = 8
/** How many off-branch exchanges the interpreter is offered to point back at. */
const ELSEWHERE_TURNS = 12
/** A hard stop on how much of a session is loaded, not an expected size. */
const MAX_TURNS = 400

// In its own function so the annotation carries the schema — see the note in
// lib/apiQuota.ts. `ReturnType<typeof createClient>` would mean public.
function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData },
  )
}

let _service: ReturnType<typeof makeServiceClient> | null = null
function serviceClient() {
  if (!_service) _service = makeServiceClient()
  return _service
}

/**
 * Appended to the user prompt on the one re-ask after an unreadable response.
 *
 * Says nothing about the failed attempt, deliberately — see the re-ask below.
 * What it does is name the one property the first response lacked and the one
 * behaviour most likely to have caused it, which is prose running long enough to
 * cost the object its closing brace.
 */
const STRICT_OUTPUT_NOTE =
  'OUTPUT DISCIPLINE FOR THIS TURN\n' +
  'The response must be one complete JSON object, closing brace included. An object that stops ' +
  'early is worth less than a short one: keep every prose field at the short end of the lengths ' +
  'given above, put nothing outside the braces, and do not restate the world — only the keys this ' +
  'exchange changed.'

/**
 * How long the interpreter gets before the turn gives up on it.
 *
 * Sixty seconds, chosen against the thing it must not interrupt rather than as a
 * round number: the slowest legitimate call is a first pass on the widest token
 * budget this engine sends, which is comfortably inside it. Before this there was
 * no deadline at all.
 */
const INTERPRETER_TIMEOUT_MS = 60_000

/** One image put in front of the interpreter, with what it is of. */
type InterpreterImage = { url: string; of: string; medium: MediumId }

/**
 * Token counts out of a provider response, whatever it calls them.
 *
 * Normalized here because the callers should not care: OpenRouter passes
 * Anthropic's cache fields through under their OpenAI-ish names
 * (`prompt_tokens_details.cached_tokens`) while Anthropic's own shape uses
 * `cache_read_input_tokens`, and `reasoning_tokens` appears in a third place
 * again. Every field is read defensively and defaults to zero, because a missing
 * count is a fact about the provider and not an error — and because a thrown
 * exception in a bookkeeping path would be the worst possible trade.
 *
 * A zero `cacheRead` across repeated turns of one game is the signal that
 * something is invalidating the prefix. That is the measurement this exists for.
 */
function providerUsage(data: any): {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  reasoning: number
} {
  const u = data?.usage ?? {}
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  return {
    input: n(u.prompt_tokens ?? u.input_tokens),
    output: n(u.completion_tokens ?? u.output_tokens),
    cacheRead: n(
      u.cache_read_input_tokens ??
      u.prompt_tokens_details?.cached_tokens ??
      u.cached_tokens,
    ),
    cacheWrite: n(u.cache_creation_input_tokens ?? u.cache_write_tokens),
    reasoning: n(
      u.completion_tokens_details?.reasoning_tokens ??
      u.reasoning_tokens,
    ),
  }
}

/**
 * The images in play this turn, so the interpreter can look at them.
 *
 * The deepest quality ceiling in this section, and the one no amount of prompt
 * work could raise. `buildSystemPrompt` has a long block — READING A RECORD YOU
 * CANNOT PERCEIVE — explaining that artwork and film arrive "as a name, an
 * attribution and at most a line of description", and asking the interpreter to
 * reason honestly about a record it cannot see. For anything with a picture, that
 * limit was never real: `Perceptible` has carried `{kind: 'image', url}` since
 * artwork existed, and two other routes in this app (manga-parse, site-extract)
 * have been sending `image_url` content blocks to the same provider all along.
 *
 * So a painting on the table stops being the string "Sunflowers — Van Gogh,
 * 1888" and becomes the painting. Every axis in tuning.ts is downstream of that:
 * Abstraction sits at Concrete by default, and "reach for what the move literally
 * contains" is an instruction nothing could follow while the contents were
 * withheld.
 *
 * Two images at most, and which two is not arbitrary — the move and the thing it
 * answers are the two records the reading is *about*. The path's history stays
 * textual: it is context, the exchange has already been read, and a dozen images
 * would cost more than the turn.
 *
 * Audio is not reachable the same way. A song cannot be put in a prompt at all,
 * which leaves its words as the equivalent unlock and Deezer does not carry them.
 */
function lookAt(move: Offering, previous: Offering | null): InterpreterImage[] {
  const images: InterpreterImage[] = []
  const add = (o: Offering | null, of: string) => {
    if (o?.perceptible?.kind === 'image' && o.perceptible.url) {
      images.push({ url: o.perceptible.url, of, medium: o.medium })
    }
  }
  add(move, 'the move')
  add(previous, 'the offering on the table')
  return images
}

/** A catalogue refusing or rate-limiting us, as opposed to simply not matching. */
type ProviderFailure = { message: string; provider: string; upstreamStatus: number | null }

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  /**
   * The one genuine serial dependency at the top of the turn.
   *
   * Everything else needs `userId`, so this hop cannot be overlapped with
   * anything — but it is also the *only* one that cannot. The body parse is
   * local work and the quota check is a round trip, so both go alongside it
   * rather than after it.
   *
   * Worth saying why this matters more here than it would elsewhere: the worker
   * runs in a Cloudflare datacenter and the database is in us-east-1, so each of
   * these is a cross-network hop on the critical path before any work starts.
   * There were four of them in a row — auth, quota, session, turns — and only
   * the first had to be.
   */
  const [userId, body] = await Promise.all([
    getUserFromToken(req.headers.get('authorization')),
    req.json().catch(() => null),
  ]) as [string | null, {
    sessionId?: string
    medium?: MediumId
    offeringId?: string
    composed?: { title?: string; steps?: string[]; intent?: ActionIntent }
    framing?: string
    claimedRelation?: RelationId
    prediction?: string
    parentTurnId?: string | null
    tuning?: unknown
    selfReply?: boolean
    switchTo?: string
  } | null]

  if (!userId) return err('Not authenticated', 401)

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return err('No API key configured', 501)

  const sessionId = body?.sessionId
  const mediumId = body?.medium
  /**
   * The partner answers its own last offering, and the player sends no move.
   *
   * No medium, no offering id and no composed body are accepted on this path, and
   * that is a rule rather than a convenience: the move is a record this engine
   * resolved itself when it played it as an answer. A client that could name one
   * would be able to put any offering on the table attributed to the partner, which
   * is the same class of lie as an invented track.
   */
  const selfReply = body?.selfReply === true

  if (!sessionId) return err('sessionId is required', 400)
  if (!selfReply && !mediumId) return err('sessionId and medium are required', 400)

  const db = serviceClient()

  /**
   * Quota, the session and the whole turn list — one round trip's worth of wall
   * clock instead of three.
   *
   * None of the three depends on the others: the quota row is keyed on the user,
   * the session on its id, and the turns on the session id the client sent. They
   * were sequential only because they were written in the order they are read.
   *
   * The turns query moving up here is the one worth checking twice, because it
   * fires before the session has been validated — so a request naming a session
   * that does not exist, or someone else's, now runs a `listen_turns` select that
   * used to be skipped. That is safe and stays safe for a specific reason: the
   * select is scoped to `session_id` alone, so the rows it could return are
   * exactly the rows the *session* check below decides whether to let anyone act
   * on, and the refusals still happen before a single row is read. The cost of
   * being wrong is one wasted query on a request that was going to be refused.
   */
  const [quotaErr, sessionResult, turnsResult] = await Promise.all([
    checkQuota(userId),
    ((db.from('listen_sessions') as any)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle() as any),
    ((db.from('listen_turns') as any)
      .select(
        // `mode` is what makes a branch's game knowable. Omitting it from this
        // list would not fail — every read of it goes through `modeOf`, which
        // treats absent and null alike as "the session's mode" — it would
        // silently un-switch every switched branch on the next turn.
        'id, turn_index, parent_turn_id, move_by, move_offering, reply_offering, relation, ' +
        'reading, narration, carried, facts, world_delta, link_turn_id, link_note, legal, mode, ' +
        'prediction, prediction_called',
      )
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true })
      .limit(MAX_TURNS) as any),
  ])

  if (quotaErr) return err(quotaErr, 429)

  const session = sessionResult?.data
  if (!session) return err('Session not found', 404)
  if (session.status !== 'active') return err('This game is finished', 409)

  /**
   * A limited game stops at its limit, here and not only in the board.
   *
   * Server-side because the board's countdown is a display of this number and not
   * the number itself — and because the limit is the only thing in the section
   * that makes a branch cost something. Counted against `turn_count`, which is
   * the whole session: going back and taking a different line spends the
   * allowance rather than getting a fresh one.
   */
  if (typeof session.turn_limit === 'number' && (session.turn_count ?? 0) >= session.turn_limit) {
    return err(
      `This game was set to ${session.turn_limit} turns and has played them all. Close it to find ` +
      `out what it was.`,
      409,
    )
  }

  // The game the session *started* as. Still the right thing to resolve the
  // session's own columns against — its media scope, its relation snapshot — and
  // still what `session.mode` means. Which game is being played *now* is a fact
  // about the branch and is resolved below, once the graph exists.
  const sessionGame = getGame(session.mode)
  if (!sessionGame) return err(`Unknown game "${session.mode}"`, 500)

  // The session snapshots its scope at creation, but fall back to recomputing it
  // so a session created before a medium was enabled is not stuck without it.
  const available = availableMedia(process.env as Record<string, string | undefined>)
  const fallback = sessionScope(sessionGame, available)
  //
  // Media are session-level even across a switch, and that is a fact about the
  // registry rather than a simplification: all eleven games are `media: 'all'`,
  // so a switch cannot narrow what is in play. The session's list is already
  // "what the game wanted at creation ∩ what this deployment can serve", and
  // re-deriving it per branch would produce the same list. A future game that
  // narrows its media would need this intersected with the branch's game — and
  // would need a decision about a session whose media list the switch empties,
  // which is why it is not pre-emptively written here.
  const media: MediumId[] = Array.isArray(session.media) && session.media.length > 0
    ? (session.media as MediumId[]).filter(m => available.includes(m))
    : fallback.media

  // The client sends what the controls currently say and the server saves it, so
  // the knob a player moved a second before taking a turn applies to that turn.
  // Reading it only from the session row would have made the save a race the player
  // could lose without ever being told.
  //
  // Resolved up here, before the graph and the move, because the self-reply refusal
  // below now depends on it: radio is the one tuning field that decides what the
  // engine refuses rather than what it reaches for.
  const tuning = normalizeTuning(
    body !== null && body.tuning !== undefined ? body.tuning : session.tuning,
    media,
  )

  // --- 1. Where in the graph this turn goes --------------------------------
  //
  // Resolved before the move rather than after, because on a self-reply the move
  // *is* the parent's answer and there is no way to know what it is until the
  // branch has been located.
  //
  // The whole session is loaded rather than the last eight turns, because a branch
  // is not a suffix: the player may be answering turn 3 of a twenty-turn game, and
  // the history that binds is the path down to turn 3, not whatever happened most
  // recently. Sessions are small; the cap is a backstop, not a budget.
  //
  // Fetched further up, alongside the session and the quota check — see the
  // `Promise.all` there. The rows arrive here rather than being queried here.
  const allTurns = (turnsResult?.data ?? []) as CorrelationTurn[]
  const graph = buildGraph(allTurns)

  // An explicit null means "start a new thread with nothing on the table", which is
  // a different request from saying nothing — hence the key-presence check rather
  // than a falsiness test.
  const chose = body !== null && Object.prototype.hasOwnProperty.call(body, 'parentTurnId')
  let parent: CorrelationTurn | null = null

  if (chose && body?.parentTurnId) {
    parent = graph.nodes.get(body.parentTurnId)?.turn ?? null
    if (!parent) return err('That exchange is not part of this game.', 404)
    // A move that was turned away established nothing and left nothing on the
    // table, so there is no sense in which it can be answered. Branch from its
    // parent instead — which is what the board offers.
    if (!parent.legal) {
      return err('That move was turned away, so there is nothing there to answer.', 400)
    }
  } else if (!chose) {
    parent = defaultParent(graph)
  }

  const path = pathTo(graph, parent?.id ?? null)

  /**
   * What the parent left on the table. Resolved here, before the move, because
   * the switch below needs it: the last offering is the whole of what a switch
   * carries, so with nothing on the table there is nothing to switch *into*.
   */
  const onTable = offeringOnTable(parent)

  // --- 1b. Which game this turn is played under ----------------------------
  //
  // Not `session.mode`. A branch may have been switched, and a turn's game is a
  // property of the turn — see lib/correlate/switching.ts and migration 76.
  // `session.mode` deliberately stays as the game the session started as, which
  // is what keeps every other read of that column correct.
  const switchTo = typeof body?.switchTo === 'string' ? body.switchTo.trim() : ''
  const currentMode = modeAlong(path, session.mode)

  if (switchTo && switchTo !== currentMode) {
    // Refused before the move is made real and before any model call, by the
    // same function the board's control is disabled by — so the player is shown
    // the sentence the server would have sent rather than a button that fails.
    const refusal = switchRefusal(currentMode, switchTo, {
      onTable: !!onTable,
      selfReply,
    })
    if (refusal) return err(refusal, 400)
  }

  const branch = activeBranch(path, session.mode, switchTo || null)
  const game = branch.game
  if (!game) return err(`Unknown game "${branch.mode}"`, 500)

  /**
   * The relations in play.
   *
   * The session's snapshot while the branch is playing the game it started as —
   * that snapshot is the "a game does not change shape underneath you" promise,
   * and a switched branch is not that case. Once switched, the relation set is
   * the new game's, because playing Translation with Tag's seven relations would
   * be playing neither.
   */
  const relations: RelationId[] = branch.mode === session.mode
    ? (Array.isArray(session.relations) && session.relations.length > 0
        ? session.relations as RelationId[]
        : resolveRelations(sessionGame.relations))
    : resolveRelations(game.relations)

  // --- 2. Make the move real ------------------------------------------------
  let move: Offering | null = null

  if (selfReply) {
    // Refused by one function shared with the board, so the control the player sees
    // and the rule the server applies cannot drift apart. The cap inside it is read
    // off the branch, not off the request.
    // Radio lifts the depth cap and nothing else — the refusals about there being
    // nothing on the table to answer still stand, because those are facts about the
    // branch rather than bounds on how long the partner may hold the floor.
    const refusal = selfReplyRefusal(parent, path, { radio: radioOf(tuning) })
    if (refusal) return err(refusal, 409)
    move = parent!.reply_offering!
  } else if (isComposed(mediumId!)) {
    const built = composeOffering({
      medium: mediumId!,
      title: body?.composed?.title ?? '',
      steps: body?.composed?.steps ?? [],
      framing: body?.framing ?? '',
      intent: body?.composed?.intent === 'invited' ? 'invited' : 'shown',
    })
    if (!built.ok) {
      return NextResponse.json(
        { error: 'That is not performable yet.', problems: built.problems },
        { status: 400 },
      )
    }
    move = built.offering
  } else {
    if (!getMedium(mediumId!)) return err(`Unknown medium "${mediumId}"`, 400)
    if (!body?.offeringId) return err('offeringId is required for that medium', 400)
    try {
      move = await lookupOffering(mediumId!, body.offeringId, { userId })
    } catch (e) {
      if (e instanceof OfferingError) {
        console.warn(`[correlate] move lookup ${e.provider} upstream=${e.upstreamStatus}: ${e.message}`)
        return err(e.message, e.status)
      }
      throw e
    }
    if (!move) return err('That offering could not be found', 404)
    // The player's framing is the part they actually chose, so it wins over the
    // provider's default — but an empty one must not erase a usable default.
    const framing = body.framing?.trim()
    if (framing) move = { ...move, framing }
  }

  // One check for both kinds of player move, after the fact: a composed offering
  // cannot exist in a medium that does not exist, and a looked-up one came back
  // in the medium it was asked for. A self-reply skips it — the move is a record
  // this engine already played, and a session whose media list has since narrowed
  // must not be told its own last answer is not in play.
  if (!selfReply && !media.includes(move.medium)) {
    return err(`${getMedium(move.medium)?.plural ?? move.medium} is not in play in this game`, 400)
  }

  /**
   * What the move answers.
   *
   * Null on a self-reply, and that is the whole structural difference. The move is
   * what the parent left on the table, so there is nothing *else* on the table: a
   * second copy of the same offering under a second heading would read as a
   * connection to be found between a thing and itself. Everything downstream that
   * keys off `previous !== null` — the ruling, the declared-relation requirement,
   * the medium-change check — is therefore skipped by arithmetic rather than by a
   * second condition that could be forgotten.
   */
  const previous: Offering | null = selfReply ? null : onTable

  /** This turn included. 1 means the partner has just started a run. */
  const selfReplyDepth = selfReply ? selfRepliesSince(path) + 1 : 0

  // Creation order, still. Once a game branches this stops being a position and
  // becomes only a name — which is what it is used as: the handle the interpreter
  // points at when it volunteers a link.
  const turnIndex = graph.order.length > 0
    ? graph.order[graph.order.length - 1].turn_index + 1
    : 0

  // Nothing already in play on this branch, and nothing a sibling already answered
  // with. The second half is what makes going back to a turn and answering it twice
  // worth doing: a second branch off the same offering should not come back with
  // the same record as the first.
  const inPlay = new Set<string>([move.id, ...offeringIdsAlong(path)])
  for (const sibling of childrenOf(graph, parent?.id ?? null)) {
    if (sibling.move_offering?.id) inPlay.add(sibling.move_offering.id)
    if (sibling.reply_offering?.id) inPlay.add(sibling.reply_offering.id)
  }

  // Derived from the rows, not from world state, and from *this branch's* rows: a
  // relation spent on a branch the player walked away from was never spent here.
  //
  // `branch.since` rather than `path`, which is what clears spent relations
  // across a switch. The motivating case is mechanical rather than aesthetic:
  // Translation's relation set is exactly `['translation']`, so switching into it
  // on a turn whose parent used `translation` would otherwise leave the new game
  // with zero legal relations while the prompt demanded one and forbade the only
  // one available. Unswitched, and across a tier-1 switch, `since` is the whole
  // path and nothing changes.
  const spent = spentRelations(relationsAlong(branch.since), 1)
  /** What the switch released, so the prompt can say it was deliberate. */
  const released = branch.switchedFrom ? spentRelations(relationsAlong(path), 1) : []

  // Nobody claimed anything on a self-reply, so there is nothing to judge a move
  // against. Ignored rather than refused: a client that keeps sending the field it
  // always sends should not have its turn rejected over it.
  const claimedRelation: RelationId | null =
    !selfReply && body?.claimedRelation && relations.includes(body.claimedRelation)
      ? body.claimedRelation
      : null

  if (game.declaredRelation === 'required' && !claimedRelation && previous !== null) {
    return err('This game asks you to name the relation you are claiming.', 400)
  }

  // --- 2b. The weighting ---------------------------------------------------
  //
  const tuningChanged = body?.tuning !== undefined &&
    JSON.stringify(tuning) !== JSON.stringify(normalizeTuning(session.tuning, media))

  const muted = mutedMedia(tuning, media)
  // Weighted and muted-free, for the stages where the server picks the medium.
  const answerMedia = weightedReplyMedia(tuning, replyMediaFor(media))

  /**
   * The proportions filter, and the whole reason a share means anything.
   *
   * Measured over the **entire branch**, not a trailing window. "More than half
   * the answers are stretches" is a claim about a game, and a window of eight
   * forgave anything older than that — so a long chain could sit permanently
   * off-target while every window inside it looked fine.
   *
   * The result is handed to the interpreter as its reply enum. A medium already
   * over its share is not in it and cannot be chosen; it returns on the turn the
   * arithmetic says it is owed again. Unrestricted when the player has set no
   * shares, and never empty — see owedMedia.
   */
  const replyHistory = replyMediaAlong(path)
  const answerIn = owedMedia(tuning, replyMediaFor(media), replyHistory)
  const due = dueMedium(tuning, replyHistory, media)

  // --- 3. The mechanical half of legality ----------------------------------
  // Translation and embodiment only mean anything across a change of medium.
  // That is checkable, so check it here rather than spending a model call to be
  // told something arithmetic.
  if (
    game.enforcesConstraint && previous !== null && claimedRelation &&
    !relationPermitted(claimedRelation, previous.medium, move.medium)
  ) {
    const moveMedium = (getMedium(move.medium)?.plural ?? move.medium).toLowerCase()
    const { data: rejected } = await ((db.from('listen_turns') as any)
      .insert({
        session_id: sessionId,
        user_id: userId,
        turn_index: turnIndex,
        parent_turn_id: parent?.id ?? null,
        move_by: 'player',
        tuning,
        // Written on a rejected turn too. The move was judged under this game's
        // rules and refused by them, so the row has to say which rules those
        // were — and the switch itself does not stick, because an illegal turn
        // is not on anybody's path. See `pathSinceSwitch`.
        mode: branch.mode,
        move_offering: move,
        reply_offering: null,
        relation: null,
        claimed_relation: claimedRelation,
        reading: `A ${claimedRelation} has to cross media, and this stayed in ${moveMedium}.`,
        narration:
          `You claimed ${claimedRelation}, which only means something when the medium changes. ` +
          `The offering on the table was already ${moveMedium}. Answer in something else, ` +
          `or claim a relation that can live inside one medium.`,
        facts: [],
        legal: false,
      })
      .select()
      .single() as any)

    return NextResponse.json({ turn: rejected, session, missed: false })
  }

  // One place that talks to the model, because the reply pipeline below may need
  // to ask twice and the second ask must be identical in every respect but its
  // prompt. Returns raw content, or null when the provider itself failed.
  //
  // Hoisted above the world because a tier-3 switch has to author part of the
  // new game's seed before there is a world to play in — see step 3b.
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

  // From the Breadth axis, because the whole response is one JSON object: a budget
  // that runs out truncates the *object*, not the prose, so the turn comes back
  // unparseable rather than merely short. A flat 1400 was already marginal for a
  // neutral turn on a model that writes long. See `ReadingLengths.maxTokens`.
  const { maxTokens } = readingLengths(tuning)

  const callInterpreter = async (
    /**
     * Two parts when the prefix is worth caching, one string when it is not.
     *
     * A plain string is the ordinary case and means "no breakpoint": the retry,
     * the seed call, the salvage account and the composed floor are one-offs
     * whose prefix nothing reuses, and a `cache_control` marker there would pay
     * the write premium for a read that never happens. Only the first pass — the
     * call that repeats every turn with the same prefix — hands over a split.
     */
    system: SystemPrompt | string,
    user: string,
    /**
     * Images to put in front of it, when the offerings in play have any.
     *
     * Omitted on every call but the first pass. The retry, the salvage account
     * and the composed floor are all about *finding an answer*, and none of them
     * re-reads the move — so paying for two images on each of them would buy
     * nothing. See `lookAt`.
     */
    images: InterpreterImage[] = [],
  ): Promise<string | null> => {
    const content = images.length > 0
      ? [
          { type: 'text', text: user },
          ...images.map(i => ({ type: 'image_url', image_url: { url: i.url } })),
        ]
      : user

    /**
     * A cache breakpoint on the stable half of the system prompt.
     *
     * Measured before writing this: the system prompt is **byte-identical**
     * between consecutive turns of the same game, 16kB of it, re-sent and
     * re-prefilled every turn. Prompt caching is a prefix match, so the one thing
     * it needs is for the stable part to come first and the per-turn part to come
     * after — which `systemPromptParts` is what guarantees. The breakpoint goes on
     * `stable`; `volatile` sits after it and is never cached.
     *
     * Sent as an array of content parts rather than a string, because that is the
     * only shape a `cache_control` marker can hang on. A provider that does not
     * understand the marker still reads the parts as text, so the worst case is
     * the behaviour we already had.
     */
    const systemContent = typeof system === 'string'
      ? system
      : [
          { type: 'text', text: system.stable, cache_control: { type: 'ephemeral' } },
          ...(system.volatile ? [{ type: 'text', text: system.volatile }] : []),
        ]

    /**
     * A deadline, because there was none.
     *
     * `fetch` here had no abort signal, so a provider request that hung rather
     * than failing held the turn open until the platform killed the worker — the
     * player sees an indefinite spinner instead of the "try that again" a clean
     * 502 produces, and none of the fallback ladder below ever runs. 60 seconds
     * is chosen against the thing it has to not interrupt: a long first pass on a
     * 2800-token budget, which is well inside it.
     */
    const abort = AbortSignal.timeout(INTERPRETER_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(apiUrl, {
        method: 'POST',
        signal: abort,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(useOpenRouter
            ? { 'HTTP-Referer': 'https://aireadalong.com', 'X-Title': 'AI Play Along' }
            : {}),
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content },
          ],
          max_tokens: maxTokens,
          // `temperature` is gone, and not as a tidy-up. Claude Sonnet 5 — which
          // `CORRELATE_MODEL` names — rejects a non-default `temperature`
          // outright. Since turns were landing, the value was being dropped or
          // normalized somewhere upstream, which means the 0.9 this used to send
          // had no effect and the comment-free `temperature: 0.9` was telling
          // every reader the engine had a variety knob it did not have. Variety
          // comes from the prompt now, which is where the rest of this engine
          // already puts it.
        }),
      })
    } catch (e) {
      // An abort looks like any other fetch rejection, so it is named: a timeout
      // and a dropped connection want different investigation.
      const why = (e as Error)?.name === 'TimeoutError'
        ? `no response in ${INTERPRETER_TIMEOUT_MS / 1000}s`
        : `${(e as Error)?.message ?? e}`
      console.warn(`[correlate] interpreter unreachable in ${game?.id ?? '?'}: ${why}`)
      return null
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.warn(`[correlate] interpreter HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
      return null
    }

    const data = await res.json()

    /**
     * What the call actually cost, which nothing has ever recorded.
     *
     * `logUsage` was called with a flat 0.005 estimate and explicit zeros for
     * both token columns, so `api_usage` held a guess and no measurement. Every
     * question worth asking about this route — is the prompt as expensive as we
     * think, did the cache work, is `max_tokens` tight, is the model thinking —
     * was unanswerable from data we were already storing.
     *
     * Still fire-and-forget: the player's turn must not wait on bookkeeping, and
     * a logging failure must not fail a turn that worked.
     */
    const u = providerUsage(data)
    logUsage(userId, 0.005, { model: modelId, endpoint: 'correlate-turn' }, u)
    if (u.cacheRead || u.cacheWrite) {
      console.log(
        `[correlate] tokens in=${u.input} out=${u.output} ` +
        `cache(read=${u.cacheRead} write=${u.cacheWrite})` +
        (u.reasoning ? ` reasoning=${u.reasoning}` : ''),
      )
    }

    return data?.choices?.[0]?.message?.content ?? ''
  }

  // --- 3b. A seed, for a switch between two games that both have a premise --
  //
  // Only tier 3 reaches this, which today is `duel` ↔ `transformation`: two games
  // that both turn on a `scene`. The scene the player built crosses over, and
  // whatever the destination declares *about* a scene has to be written for the
  // one that arrived — Transformation's `invariants` is "what has survived every
  // transformation so far", and its canned value is a true statement about a bus
  // shelter and a meaningless one about anywhere else.
  //
  // This is the engine's only call that produces seed rather than delta content,
  // and it fails closed. A premise that cannot be authored means the switch does
  // not happen, because the only alternative is the canned one — which is exactly
  // the dishonesty the tier existed to avoid. The move is not recorded, so the
  // player can simply take it again.
  //
  // Nothing durable is written here. The result goes into the switching turn's
  // `world_delta` further down, the way `mediaVisited` does, so every later fold
  // reproduces it from the row instead of needing this call repeated.
  let authoredSeed: Record<string, unknown> = {}
  const needsSeed = branch.switchedFrom ? derivedSeedSpec(branch.switchedFrom, branch.mode) : []

  /**
   * The world as it stood under the game being left.
   *
   * What there is to carry, and null when nothing is being left. Folded the old
   * way on purpose: this is the departing branch's own world, so the departing
   * game's seed and the departing game's sub-path are the right inputs — using
   * the new game's seed here would ask what Transformation's world was on turns
   * that were Duel.
   */
  const worldBefore = branch.switchedFrom
    ? worldFor(
        getGame(branch.switchedFrom)!.seedWorld,
        branch.boundaries.length > 0 ? {} : (session.world_state ?? {}) as Record<string, any>,
        graph,
        pathSinceSwitch(path, session.mode),
      )
    : null

  if (branch.switchedFrom && worldBefore && needsSeed.length > 0) {
    const leaving = getGame(branch.switchedFrom)!
    const carried: Record<string, any> = {}
    for (const key of carriedSeedKeys(branch.switchedFrom, branch.mode)) {
      if (worldBefore[key] !== undefined) carried[key] = worldBefore[key]
    }

    const seedRaw = await callInterpreter(
      buildSeedSystemPrompt(game),
      buildSeedPrompt({ from: leaving, to: game, carried, keys: needsSeed }),
    )
    const authored = seedRaw
      ? normalizeSeed(parseJsonObject(seedRaw), game, needsSeed.map(k => k.key))
      : null

    if (!authored) {
      console.warn(
        `[correlate] could not author ${needsSeed.map(k => k.key).join(', ')} for ` +
        `${leaving.id} → ${game.id}`,
      )
      return err(
        `${game.name} could not be set up on this scene. Your move was not recorded — try it again.`,
        502,
      )
    }
    authoredSeed = authored
  }

  /**
   * The seed this turn's world folds onto.
   *
   * Identical to `game.seedWorld` for every switch but tier 3, and for every turn
   * that is not a switch at all. Tier 3 is where it differs: the carried keys come
   * from the world as it stood and the authored ones from the call above.
   */
  const seed = branch.switchedFrom && worldBefore
    ? switchSeed(branch.switchedFrom, branch.mode, worldBefore, authoredSeed)
    : game.seedWorld

  // --- 4. The interpreter --------------------------------------------------
  //
  // The world is a property of the branch, not of the session: two branches that
  // both establish something about the same place are each coherent and are not
  // each other's. See worldFor() for what happens to sessions written before that
  // was true.
  // Folded along `branch.since`, not the whole path. `worldFor` replays deltas
  // from the game's seed, and replaying Tag's `chain` deltas onto Embodiment's
  // `{learned, sensations}` seed produces a world that is neither game's — so
  // after a switch the replay has to start at the switch. That is what
  // `pathSinceSwitch` computes, and it is also the strongest argument for the
  // switch being a branch: the boundary is a thing the replay can see.
  //
  // The session cache is passed only when this branch has never switched. For a
  // switched branch `session.world_state` is the *old* game's world, so the
  // legacy fallback inside `worldFor` would hand it over wholesale — the one
  // case where trusting that column is worse than folding from less.
  const world = worldFor(
    seed,
    branch.boundaries.length > 0 || branch.switchedFrom
      ? {}
      : (session.world_state ?? {}) as Record<string, any>,
    graph,
    branch.since,
  )

  // The whole path, not `branch.since`: an interpreter shown only the turns
  // played under its own rules loses the continuity that makes switching worth
  // doing. The ones from before the boundary are labelled rather than hidden —
  // which is a sentence per-turn `mode` is what makes sayable.
  const history: TurnContext[] = path.slice(-HISTORY_TURNS).map(t => ({
    turn_index: t.turn_index,
    move_offering: t.move_offering,
    reply_offering: t.reply_offering,
    relation: t.relation,
    reading: t.reading,
    narration: t.narration,
    carried: t.carried,
    // So the interpreter is not shown its own offerings attributed to the player.
    move_by: t.move_by,
    played_as: playedUnder(t, session.mode, branch.mode)?.name ?? null,
  }))

  // Everything the player can see but this branch did not live through. Offered so
  // a callback has somewhere to point, and kept deliberately thin so it cannot be
  // mistaken for context the exchange inherits.
  const onPath = new Set(path.map(t => t.id))
  const elsewhere: ElsewhereContext[] = graph.order
    .filter(t => t.legal && !onPath.has(t.id))
    .slice(-ELSEWHERE_TURNS)
    .map(t => ({
      turn_index: t.turn_index,
      move_offering: t.move_offering,
      reply_offering: t.reply_offering,
      carried: t.carried,
    }))

  const linkable = linkableTurns(graph, parent?.id ?? null).map(t => t.turn_index)

  /**
   * The player's guess at what their own move will draw back.
   *
   * Accepted from *any* game, not only Prediction, and that is not an oversight
   * being preserved — the field has always been ungated here while
   * `wantsPrediction` gated only whether the composer renders an input. Reading
   * the registry to decide would make the schema and the field disagree the
   * moment a client posts one.
   *
   * Null on a self-reply: there is no move of the player's, so there is nothing
   * of theirs to have predicted.
   */
  const prediction = selfReply ? null : body?.prediction?.trim() || null

  /**
   * The pictures in play, resolved once and used twice: the prompt has to claim
   * they are attached and the request has to attach them, and those two must come
   * from the same place or the prompt lies about what it is holding.
   */
  const seeing = lookAt(move, previous)
  const seenMedia = [...new Set(seeing.map(i => i.medium))]

  /**
   * Split rather than joined, because this is the one call whose prefix repeats.
   *
   * Every turn of a game at the same tuning produces the same `stable` half, so
   * it is the only place a cache breakpoint can pay for itself. `callInterpreter`
   * puts the marker on it; see `systemPromptParts` for what had to move below the
   * line to make the prefix hold.
   */
  const systemPrompt = systemPromptParts(
    game, media, relations, tuning, selfReply, answerIn, !!prediction, seenMedia,
  )
  const userPrompt = buildUserPrompt({
    game,
    media,
    relations,
    world,
    history,
    elsewhere,
    move,
    previous,
    selfReply,
    selfReplyFrom: selfReply ? parent!.turn_index : null,
    selfReplyDepth,
    // Said only when the player went back, because on a straight continuation it
    // would be a sentence of prompt that tells the interpreter nothing.
    parentIndex: parent && parent.turn_index !== turnIndex - 1 ? parent.turn_index : null,
    claimedRelation,
    spent,
    switchedFrom: branch.switchedFrom
      ? {
          name: getGame(branch.switchedFrom)?.name ?? branch.switchedFrom,
          // True only on a tier-1 switch, where the shapes match and nothing was
          // reset. `since` holding the whole path is what that looks like here.
          keptWorld: branch.since.length > 0,
          released,
        }
      : null,
    prediction,
    turnIndex,
    tuning,
    due,
  })


  // Coerced against the media it was actually offered, not every medium in play.
  // Otherwise a reply landing in a medium that is over its share would be accepted
  // here after having been excluded from the enum — which would make the filter a
  // suggestion again, the exact failure this pass exists to remove.
  const read = (raw: string) => normalizeInterpretation(
    parseJsonObject(raw), answerIn, relations, { muted, linkable },
  )

  /**
   * One pass with the pictures attached, and a text-only pass if that fails.
   *
   * The fallback is not defensive habit — it covers a failure mode that is real
   * and outside our control. The provider fetches these URLs itself, so a
   * catalogue that starts bot-walling hotlinked images takes the vision call down
   * with it while the rest of the turn is perfectly playable. (This app has been
   * there: artwork moved from Chicago to Cleveland for exactly that reason.) The
   * right behaviour then is a slightly worse reading, not a refused turn.
   *
   * The second pass drops `seeing` from the system prompt too, which matters —
   * `buildSystemPrompt` branches on it, and a prompt that claims a picture is
   * attached when the attempt to attach it just failed would be the one lie the
   * block exists to prevent.
   */
  let firstRaw = await callInterpreter(systemPrompt, userPrompt, seeing)

  if (firstRaw === null && seeing.length > 0) {
    console.warn(
      `[correlate] vision pass failed in ${game.id} (${seeing.length} image(s): ` +
      `${seeing.map(i => i.of).join(', ')}); retrying without them`,
    )
    firstRaw = await callInterpreter(
      buildSystemPrompt(game, media, relations, tuning, selfReply, answerIn, !!prediction),
      userPrompt,
    )
  }

  if (firstRaw === null) return err('Interpreter unavailable. Try that move again in a moment.', 502)

  let firstPass = read(firstRaw)

  /**
   * ONE RE-ASK ON AN UNREADABLE RESPONSE.
   *
   * The asymmetry this closes: the reply pipeline below has a four-stage ladder
   * for an answer that will not resolve, and a response that will not *parse* had
   * none at all — it returned 502 and told the player to take the move again.
   * Which is what they were doing, by hand, once or twice a session. The engine
   * was asking a person to perform the retry it already knew how to perform
   * everywhere else.
   *
   * Identical prompts but for one appended paragraph, which is the only honest
   * form: this is a fresh completion with no memory of the first, so "your last
   * response was malformed" would be a sentence about a conversation it was not
   * part of. What it gets instead is a stronger output discipline, which is
   * actionable without reference to anything it cannot see.
   *
   * Exactly one. Two re-asks would be most of a turn's latency spent on a
   * response that is probably failing for a reason a third sample will not fix,
   * and `parseJsonObject` now salvages the common cause before it gets here.
   */
  if (!firstPass) {
    console.warn(
      `[correlate] unreadable interpretation in ${game.id} ` +
      `(${firstRaw.length} chars, maxTokens ${maxTokens}); re-asking once. ` +
      `head: ${JSON.stringify(firstRaw.slice(0, 120))} tail: ${JSON.stringify(firstRaw.slice(-120))}`,
    )
    const secondRaw = await callInterpreter(systemPrompt, `${userPrompt}\n\n${STRICT_OUTPUT_NOTE}`)
    firstPass = secondRaw ? read(secondRaw) : null
    if (!firstPass) {
      console.warn(`[correlate] still unreadable in ${game.id} after a re-ask`)
    }
  }

  if (!firstPass) return err('The interpreter returned something unreadable. Try that move again.', 502)

  if (firstPass.replyRejection) {
    // Loud on purpose: this is the interpreter and our schema disagreeing, which
    // is a bug in the prompt or the alias table, not a normal game outcome.
    console.warn(`[correlate] reply rejected in ${game.id}: ${describeRejection(firstPass.replyRejection as any)}`)
  }

  // In a game that enforces its constraint the interpreter's verdict is the
  // ruling. An opening move has nothing to connect to, so it cannot be illegal,
  // and a game that never gatekeeps is always legal regardless of what the model
  // volunteers. Ruled once, on the first pass — a retry answers, it does not judge.
  // `gatesLegality` is the third condition, and it is the one that makes
  // "Agreeable means you cannot be turned away" true rather than requested. On
  // the agreeable side of Friction the prompt asks for no verdict, so there is
  // none to read, and reading `firstPass.verdict` here would be consulting a
  // field the interpreter was never given — a volunteered 'illegal' would then
  // reject a move at the exact setting that promises it will not be. Must stay
  // in step with the two `gatesLegality` calls in prompt.ts.
  const legal = game.enforcesConstraint && previous !== null && gatesLegality(tuning)
    ? firstPass.verdict !== 'illegal'
    : true

  // --- 5. Make the reply real. It is not allowed to come back empty. ------
  //
  // A turn with no reply is a dead end: in a chain game the next move has nothing
  // to answer, so the game simply stops. That used to be treated as an acceptable
  // outcome ("the reply missed") and it is not one. Three stages, each cheaper to
  // reach than the last is to need:
  //
  //   1. the interpreter's own plan
  //   2. one corrective re-ask, told what failed, restricted to media that cannot
  //      fail for reasons it cannot see (so never back into the player's library)
  //   3. a server-side salvage search seeded from what the interpreter said
  //      carried across, then from the move itself
  //   4. the floor: a composed reply, which is authored rather than searched and
  //      therefore cannot miss, even in a medium the player has muted
  //
  // Stages 1-3 all reach the same places. Every one of them is restricted to media
  // the player has left on, and under the weighted default that is two catalogues
  // (Deezer, Cleveland) — so a single bad minute at either provider took all three
  // down together and the guarantee in this comment was really a guarantee about
  // somebody else's uptime. Stage 4 is the floor that makes it ours: a composed
  // medium is authored in the reply itself, so it is reachable whenever the
  // interpreter is, and the interpreter has already answered twice by the time we
  // get here.
  //
  // If the floor fails too, the turn is NOT recorded — better to ask the player to
  // try again than to write a permanent hole into their chain.
  let reply: Offering | null = null
  const failure: { current: ProviderFailure | null } = { current: null }
  let replySource: 'interpreter' | 'retry' | 'salvage' | 'floor' = 'interpreter'
  let interpretation = firstPass

  /**
   * `scoped: false` drops the player's narrowing for this attempt.
   *
   * Only stage 3 passes it. The engine guarantees that a legal turn carries a
   * real reply, and a guarantee outranks a preference — the same trade
   * `weightedReplyMedia` makes when a player mutes every medium. A player who
   * has scoped themselves into a corner gets an answer rather than a dead chain,
   * and the salvage note already tells them the reply was not the interpreter's
   * own choice.
   */
  const scopeMiss: { current: string | null } = { current: null }

  const tryResolve = async (
    plan: NonNullable<Interpretation['reply']>,
    scoped = true,
  ): Promise<Offering | null> => {
    try {
      return await resolveReply(plan, [...inPlay], {
        userId,
        scopes: scoped ? tuning.scopes : {},
        onScopeMiss: why => { scopeMiss.current = why },
      })
    } catch (e) {
      if (e instanceof OfferingError) {
        console.warn(`[correlate] reply resolve ${e.provider} upstream=${e.upstreamStatus}: ${e.message}`)
        failure.current = { message: e.message, provider: e.provider, upstreamStatus: e.upstreamStatus }
        return null
      }
      throw e
    }
  }

  if (legal) {
    // Stage 1.
    if (interpretation.reply) reply = await tryResolve(interpretation.reply)

    // Stage 2 — one re-ask, only into media that cannot fail on the player's data
    // and that the player has not turned off.
    if (!reply) {
      // The proportions filter applies to the retry too. It used to use the full
      // weighted list, which is one of the ways a game set to mostly music filled
      // up with stretches: the first attempt failed to find a song, and the second
      // was free to go wherever it liked.
      const retryMedia = answerIn
      // Order matters: a scope miss is checked before the generic "nothing
      // matched", because what it named did exist — it was simply somewhere the
      // player has ruled out, and telling the interpreter otherwise invites it to
      // re-propose the same reply with a different query.
      const problem = interpretation.replyRejection
        ? describeRejection(interpretation.replyRejection as any)
        : scopeMiss.current
          ? `${scopeMiss.current} — the player has narrowed where you may reach`
          : failure.current
            ? `the catalogue could not be reached (${failure.current.provider})`
            : 'nothing real matched what you named'
      const attempted = interpretation.reply?.query
        ?? interpretation.reply?.composed?.title
        ?? null

      console.warn(`[correlate] retrying reply in ${game.id}: ${problem}`)

      const retryRaw = await callInterpreter(
        buildSystemPrompt(game, retryMedia, relations, tuning, selfReply, retryMedia),
        buildRetryPrompt({
          game, media: retryMedia, relations, move, previous, problem, attempted,
          reading: interpretation.reading, selfReply,
        }),
      )
      const retry = retryRaw
        ? normalizeInterpretation(parseJsonObject(retryRaw), retryMedia, relations, { linkable })
        : null

      if (retry?.reply) {
        const second = await tryResolve(retry.reply)
        if (second) {
          reply = second
          replySource = 'retry'
          // Adopt the retry's account of the exchange, not the first pass's: its
          // narration, carried and lost describe the reply that actually landed.
          // Legality is NOT revisited — that was ruled once, on the move.
          // `called` travels with `verdict` and for the same reason: both were
          // ruled on the first pass, and a retry is answering the move again
          // rather than re-judging it. A second completion seeing the guess for
          // the first time must not be able to overturn a ruling on it.
          interpretation = { ...retry, verdict: firstPass.verdict, called: firstPass.called }
          failure.current = null
          scopeMiss.current = null
        }
      }
    }

    // Stage 3 — the server tries on its own terms.
    if (!reply) {
      // Share-ordered and share-filtered. The server picking the medium is no
      // reason for the player's proportions to stop applying — scope is what gets
      // dropped at this stage (see tryResolve's `scoped: false`), not the weighting.
      for (const seed of salvageQueries(interpretation, move)) {
        for (const medium of answerIn.filter(m => !isComposed(m))) {
          const found = await tryResolve(
            { medium, query: seed, framing: 'Found in answer to your move' },
            false,
          )
          if (found) {
            reply = found
            replySource = 'salvage'
            failure.current = null
            break
          }
        }
        if (reply) break
      }

      // Stage 3b — make the prose agree with the record.
      //
      // The interpretation still held narration, carried and lost from the first
      // pass, and all three describe the answer that could not be found. Storing
      // them next to a salvaged record is the one place this engine asserted
      // something untrue about what is on the table: the player reads an account of
      // an exchange that did not happen. So the account is re-asked for, against
      // the record that actually landed.
      //
      // One extra call on a path that has already made two, and only on that path.
      // When it fails, the fields are cleared rather than kept — an empty `carried`
      // says nothing, and the first pass's `carried` says something false.
      if (reply) {
        console.warn(`[correlate] salvaged a reply in ${game.id} after two interpreter attempts`)

        const accountRaw = await callInterpreter(
          buildSystemPrompt(game, media, relations, tuning, selfReply, answerIn),
          buildSalvageAccountPrompt({ move, reply, reading: interpretation.reading, selfReply }),
        )
        const account = accountRaw ? parseJsonObject(accountRaw) : null
        const narration = typeof account?.narration === 'string' ? account.narration.trim() : ''

        interpretation = {
          ...interpretation,
          narration: narration ||
            'Two answers could not be found, so this record was searched for from the move ' +
            'itself. Nothing has been claimed about what connects them.',
          carried: typeof account?.carried === 'string' ? account.carried.trim() : '',
          lost: typeof account?.lost === 'string' ? account.lost.trim() : '',
        }
      }
    }

    // Stage 4 — the floor.
    //
    // Drawn from `media` (what the session can play) rather than `answerIn` (what
    // the player has asked for), because the mute is exactly what is being stepped
    // over. That is a stronger override than stage 3's: a scope is a preference
    // about where to reach, while tuning.ts calls a mute "the one share that is a
    // prohibition". It is justified by the alternative, not by the weighting — the
    // choice here is not "muted medium vs. chosen medium", it is "muted medium vs.
    // no turn at all", and a dead chain respects the player's mute by giving them
    // nothing. It is the same trade `weightedReplyMedia` already makes for a player
    // who mutes every medium, applied to the player who muted only the reachable
    // ones.
    //
    // The debt this incurs is honesty, and it is paid in three places: `replySource`
    // is 'floor' so the client can say a muted medium was used and why, `replyNote`
    // records it on the row, and the interpreter is told in the prompt that it is
    // answering where it was told not to. A silent floor would be worse than none —
    // the player would read a stretch in a game set to music and conclude the shares
    // do not work.
    //
    // Its own account is adopted wholesale, like stage 2 and unlike stage 3: the
    // floor authors the offering *and* describes it in one response, so there is no
    // gap between the record and the prose about it, and no third call to close one.
    if (!reply) {
      const floorMedia = media.filter(isComposed)

      if (floorMedia.length > 0) {
        console.warn(
          `[correlate] falling to the composed floor in ${game.id}: ` +
          `nothing reachable in ${answerIn.join(', ')}`,
        )

        const floorRaw = await callInterpreter(
          buildSystemPrompt(game, floorMedia, relations, tuning, selfReply, floorMedia),
          buildRetryPrompt({
            game, media: floorMedia, relations, move, previous, selfReply, floor: true,
            problem: failure.current
              ? `nothing could be reached in ${answerIn.join(', ')} — the catalogue was ` +
                `unreachable (${failure.current.provider})`
              : `two attempts and a search found nothing real in ${answerIn.join(', ')}`,
            attempted: interpretation.reply?.query
              ?? interpretation.reply?.composed?.title ?? null,
            reading: interpretation.reading,
          }),
        )
        const floored = floorRaw
          ? normalizeInterpretation(parseJsonObject(floorRaw), floorMedia, relations, { linkable })
          : null

        if (floored?.reply) {
          // `scoped: false` for the same reason stage 3 passes it: a guarantee that
          // has already overridden the mute cannot coherently stop at the scope.
          const last = await tryResolve(floored.reply, false)
          if (last) {
            reply = last
            replySource = 'floor'
            interpretation = { ...floored, verdict: firstPass.verdict, called: firstPass.called }
            failure.current = null
            scopeMiss.current = null
          }
        }
      }
    }

    if (!reply) {
      // Everything is down. Do not persist a turn that can never be answered.
      return err(
        failure.current
          ? `${failure.current.message} Your move was not recorded — try it again in a moment.`
          : 'Could not find anything real to answer with. Your move was not recorded — try again.',
        failure.current?.upstreamStatus === 429 ? 429 : 503,
      )
    }
  }

  // A relation that requires a change of medium and did not get one is not the
  // relation that was used, whatever the interpreter said. Downgrade rather than
  // reject: the reply is real and the reading may still be good.
  let relation = interpretation.relation
  if (reply && relation && !relationPermitted(relation, move.medium, reply.medium)) {
    relation = null
  }

  // The query is kept so a miss stays legible. When the interpreter's reply was
  // *rejected* rather than merely unmatched, record that instead — a turn with a
  // reading, a narration and a blank reply used to be indistinguishable from a
  // search that found nothing, and only one of those is our bug.
  // What it reached for, and — when the first reach failed — how the answer was
  // actually arrived at. A salvaged reply is real but it was not the interpreter's
  // choice, and the log should not pretend otherwise.
  const reached = interpretation.reply?.query ?? interpretation.reply?.composed?.title ?? null
  // A floored reply names the mute when it broke one, because that is the part a
  // player reading the row back will want explained — "composed floor" alone looks
  // like a medium they picked.
  const replyNote =
    replySource === 'interpreter' ? reached
    : replySource === 'retry'     ? (reached ? `${reached} (second attempt)` : 'second attempt')
    : replySource === 'floor'     ? `floor${reply && muted.includes(reply.medium) ? ', muted medium' : ''}: ${reached ?? 'composed from the move itself'}`
    : `salvaged: ${reached ?? 'searched from the move itself'}`

  // A callback is resolved to a real turn here, not trusted as an index. The
  // interpreter is given indexes because they read well in a prompt; the database
  // stores an edge.
  const linkedTurn = interpretation.link && legal
    ? turnByIndex(graph, interpretation.link.turnIndex)
    : null

  // --- 6. Persist ---------------------------------------------------------
  //
  // `world_delta` is written per turn because a branched game has no single world:
  // the world anywhere is the fold of the deltas along the path that reached it.
  // mediaVisited goes *into* the delta rather than being bolted onto the session
  // world afterwards, so the fold reproduces it instead of losing it.
  //
  // Three things the engine writes in rather than asks for, and all three are
  // here because the fold is what has to reproduce them:
  //
  //  - `mediaVisited`, bookkeeping a prompt does worse than arithmetic.
  //  - the carried and authored seed, on a tier-3 switch. Without it the seed
  //    this turn was played against would exist only in this request, and every
  //    later fold would start from the destination's canned premise — the exact
  //    content the switch was built to avoid. It goes *under* the interpreter's
  //    delta, so a scene it transformed on this very turn still wins.
  //  - `record`, the prediction tally, now derived from the ruling rather than
  //    kept by the interpreter. See migration 77.
  const seedIntoDelta = branch.switchedFrom ? seed : {}
  const storedDelta: Record<string, any> | null = legal
    ? {
        ...seedIntoDelta,
        ...interpretation.worldDelta,
        mediaVisited: visitedAfter(world, move, reply),
        ...(interpretation.called === true || interpretation.called === false
          ? { record: recordAfter(world, interpretation.called) }
          : {}),
      }
    : null

  /**
   * The move as stored, which on a self-reply may be re-framed.
   *
   * The partner is allowed to narrow what it is answering — the stopping rather
   * than the reach — and when it does, the row has to say so, or the board shows
   * the whole offering next to a reading of one part of it. The original record is
   * untouched: this changes which part is in play, never which record it is, and a
   * blank or missing `reframing` leaves the framing exactly as it was played.
   */
  const storedMove: Offering = selfReply && interpretation.reframing
    ? { ...move, framing: interpretation.reframing }
    : move

  const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
      parent_turn_id: parent?.id ?? null,
      move_by: selfReply ? 'partner' : 'player',
      // Always stated, switched or not. A row that names its own game needs no
      // resolution against a session that may since have been read differently,
      // and `null` keeps meaning exactly one thing — "written before migration
      // 76" — rather than two.
      mode: branch.mode,
      move_offering: storedMove,
      reply_offering: reply,
      reply_query: replyNote,
      relation,
      claimed_relation: claimedRelation,
      reading: interpretation.reading,
      narration: interpretation.narration,
      carried: interpretation.carried || null,
      lost: interpretation.lost || null,
      facts: interpretation.facts,
      // Stored verbatim and never interpreted. The ruling beside it is only
      // checkable if the thing it ruled on is still there — which it was not,
      // before migration 77.
      prediction,
      prediction_called: prediction ? interpretation.called ?? null : null,
      world_delta: storedDelta,
      link_turn_id: linkedTurn?.id ?? null,
      link_note: linkedTurn ? interpretation.link!.note : null,
      tuning,
      legal,
    })
    .select()
    .single() as any)

  if (turnErr) return err(`Could not record that turn: ${turnErr.message}`, 500)

  // An illegal move leaves the world untouched — nothing was established.
  const nextWorld = legal ? applyWorldDelta(world, { ...interpretation, worldDelta: storedDelta! }) : world

  /**
   * DELIBERATELY NOT PARALLELISED with the insert above, unlike the reads at the
   * top of this route.
   *
   * Nothing in this update reads the inserted row — `nextWorld` is folded from
   * `interpretation`, and `turn_count` from the graph — so a `Promise.all` would
   * work and would save a round trip. It is still wrong. The insert is the
   * authoritative record and this is a derived cache of it, so running them
   * together means a failed insert still bumps `turn_count` and still advances
   * `world_state`: the next turn would compute its `turnIndex` from a count that
   * includes a turn nobody can see, and the board would show a world no exchange
   * produced. One hop is the right price for that ordering.
   */
  const { data: updated } = await ((db.from('listen_sessions') as any)
    .update({
      // The world of the branch just played. Authoritative only while the game is
      // a line; after that it is the display value and the branch head's cache.
      world_state: nextWorld,
      turn_count: graph.order.length + 1,
      ...(tuningChanged ? { tuning } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single() as any)

  return NextResponse.json({
    turn,
    session: updated ?? session,
    replyReason: interpretation.replyReason,
    // A legal turn always carries a real reply now, so there is no "missed" to
    // report. What the client still wants to know is whether the answer was the
    // interpreter's first choice.
    replySource,
    // Whether the floor had to answer in a medium the player turned off. Computed
    // here rather than client-side because the server already holds both the
    // normalized tuning and the reply; re-deriving it from the row and the session
    // would be the same arithmetic done twice, and wrong the moment they disagree.
    replyBrokeMute: replySource === 'floor' && !!reply && muted.includes(reply.medium),
    replyRejected: firstPass.replyRejection
      ? describeRejection(firstPass.replyRejection as any)
      : null,
    // How many turns the partner has now taken in a row, so a client running a
    // continuation knows where it stands without re-deriving it from the rows it
    // has in memory. Zero on a player's turn — which is also what resets it.
    selfReplyDepth,
    // The game this turn was played under, and the one it left. Sent rather than
    // left to the client to re-derive, because the turn row already carries
    // `mode` and the board folds the row in — this is only here so an armed
    // switch can be cleared on confirmation rather than on optimism.
    mode: branch.mode,
    switchedFrom: branch.switchedFrom,
  })
}

/**
 * Which media this branch has now touched.
 *
 * Bookkeeping the engine does better than a prompt can, and it belongs in the
 * turn's delta rather than in the session world: a branch that has only ever played
 * music should say so even while a sibling branch has crossed four media.
 */
function visitedAfter(
  world: Record<string, any>,
  move: Offering,
  reply: Offering | null,
): string[] {
  const visited = new Set<string>(Array.isArray(world.mediaVisited) ? world.mediaVisited : [])
  visited.add(move.medium)
  if (reply) visited.add(reply.medium)
  return [...visited]
}

/**
 * The prediction tally after this turn.
 *
 * Same shape as `visitedAfter` and there for the same reason, one step further
 * along: this is bookkeeping the interpreter used to do about itself. Prediction's
 * whole world is `record: {hits, misses}`, and it was maintained by the model in
 * its own delta, scored from prose the model had just written — while the guess
 * that produced the score was not stored anywhere. So the hit rate of the game
 * that is about a hit rate could not be recomputed or disagreed with.
 *
 * It is the same move `relations.ts` describes making when the interpreter's
 * `threadsUsed` array became a real `relation` column: a rule that depended on a
 * model remembering to append became a fact about the log.
 *
 * Read off the folded world rather than counted over the rows, which is what
 * `mediaVisited` does and is correct for the same reason — the world *is* the
 * fold of the deltas along this path, so incrementing it is counting them.
 * `prediction_called` on the rows is the independent record that makes this
 * checkable.
 */
function recordAfter(world: Record<string, any>, called: boolean): { hits: number; misses: number } {
  const current = world.record
  const hits = typeof current?.hits === 'number' ? current.hits : 0
  const misses = typeof current?.misses === 'number' ? current.misses : 0
  return called ? { hits: hits + 1, misses } : { hits, misses: misses + 1 }
}
