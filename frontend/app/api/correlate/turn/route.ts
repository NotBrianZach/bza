import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { availableMedia, getMedium, isComposed, replyMediaFor } from '@/lib/correlate/media'
import { relationPermitted, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  applyWorldDelta, buildRetryPrompt, buildSystemPrompt, buildUserPrompt, describeRejection,
  normalizeInterpretation, parseJsonObject, salvageQueries, sessionScope,
  type ElsewhereContext, type TurnContext,
} from '@/lib/correlate/prompt'
import {
  buildGraph, childrenOf, defaultParent, linkableTurns, offeringIdsAlong, offeringOnTable,
  pathTo, relationsAlong, replyMediaAlong, turnByIndex, worldFor,
} from '@/lib/correlate/graph'
import {
  dueMedium, mutedMedia, normalizeTuning, weightedReplyMedia,
} from '@/lib/correlate/tuning'
import type {
  ActionIntent, CorrelationTurn, Interpretation, MediumId, Offering, RelationId,
} from '@/lib/correlate/types'
import { OfferingError, composeOffering, lookupOffering, resolveReply } from '@/lib/offerings'

/**
 * Play one turn of a correlation game.
 *
 * The loop, in order:
 *   1. Make the move real. For a catalogued or library medium the server
 *      re-fetches it by id — the client sends an id, never an offering body,
 *      because the server is what decides which record a move is. For a composed
 *      medium there is nothing to fetch, so the move is performability-checked
 *      instead, which is the composed-medium equivalent of the same guard.
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
 * }
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const HISTORY_TURNS = 8
/** How many off-branch exchanges the interpreter is offered to point back at. */
const ELSEWHERE_TURNS = 12
/** Replies looked at when working out which medium the weighting is short of. */
const BALANCE_WINDOW = 8
/** A hard stop on how much of a session is loaded, not an expected size. */
const MAX_TURNS = 400

let _service: ReturnType<typeof createClient> | null = null
function serviceClient() {
  if (!_service) {
    _service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return _service
}

/** A catalogue refusing or rate-limiting us, as opposed to simply not matching. */
type ProviderFailure = { message: string; provider: string; upstreamStatus: number | null }

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return err('Not authenticated', 401)

  const quotaErr = await checkQuota(userId)
  if (quotaErr) return err(quotaErr, 429)

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return err('No API key configured', 501)

  const body = await req.json().catch(() => null) as {
    sessionId?: string
    medium?: MediumId
    offeringId?: string
    composed?: { title?: string; steps?: string[]; intent?: ActionIntent }
    framing?: string
    claimedRelation?: RelationId
    prediction?: string
    parentTurnId?: string | null
    tuning?: unknown
  } | null

  const sessionId = body?.sessionId
  const mediumId = body?.medium
  if (!sessionId || !mediumId) return err('sessionId and medium are required', 400)

  const medium = getMedium(mediumId)
  if (!medium) return err(`Unknown medium "${mediumId}"`, 400)

  const db = serviceClient()

  const { data: session } = await ((db.from('listen_sessions') as any)
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!session) return err('Session not found', 404)
  if (session.status !== 'active') return err('This game is finished', 409)

  const game = getGame(session.mode)
  if (!game) return err(`Unknown game "${session.mode}"`, 500)

  // The session snapshots its scope at creation, but fall back to recomputing it
  // so a session created before a medium was enabled is not stuck without it.
  const available = availableMedia(process.env as Record<string, string | undefined>)
  const fallback = sessionScope(game, available)
  const media: MediumId[] = Array.isArray(session.media) && session.media.length > 0
    ? (session.media as MediumId[]).filter(m => available.includes(m))
    : fallback.media
  const relations: RelationId[] = Array.isArray(session.relations) && session.relations.length > 0
    ? session.relations as RelationId[]
    : resolveRelations(game.relations)

  if (!media.includes(mediumId)) {
    return err(`${medium.plural} is not in play in this game`, 400)
  }

  // --- 1. Make the move real ------------------------------------------------
  let move: Offering | null = null

  if (isComposed(mediumId)) {
    const built = composeOffering({
      medium: mediumId,
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
    if (!body?.offeringId) return err('offeringId is required for that medium', 400)
    try {
      move = await lookupOffering(mediumId, body.offeringId, { userId })
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

  // --- 2. Where in the graph this turn goes --------------------------------
  //
  // The whole session is loaded rather than the last eight turns, because a branch
  // is not a suffix: the player may be answering turn 3 of a twenty-turn game, and
  // the history that binds is the path down to turn 3, not whatever happened most
  // recently. Sessions are small; the cap is a backstop, not a budget.
  const { data: turnRows } = await ((db.from('listen_turns') as any)
    .select(
      'id, turn_index, parent_turn_id, move_offering, reply_offering, relation, reading, ' +
      'narration, carried, facts, world_delta, link_turn_id, link_note, legal',
    )
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })
    .limit(MAX_TURNS) as any)

  const allTurns = (turnRows ?? []) as CorrelationTurn[]
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
  const previous: Offering | null = offeringOnTable(parent)

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
  const spent = spentRelations(relationsAlong(path), 1)

  const claimedRelation: RelationId | null =
    body?.claimedRelation && relations.includes(body.claimedRelation) ? body.claimedRelation : null

  if (game.declaredRelation === 'required' && !claimedRelation && previous !== null) {
    return err('This game asks you to name the relation you are claiming.', 400)
  }

  // --- 2b. The weighting ---------------------------------------------------
  //
  // The client sends what the controls currently say and the server saves it, so
  // the knob a player moved a second before taking a turn applies to that turn.
  // Reading it only from the session row would have made the save a race the player
  // could lose without ever being told.
  const tuning = normalizeTuning(
    body !== null && body.tuning !== undefined ? body.tuning : session.tuning,
    media,
  )
  const tuningChanged = body?.tuning !== undefined &&
    JSON.stringify(tuning) !== JSON.stringify(normalizeTuning(session.tuning, media))

  const muted = mutedMedia(tuning, media)
  // Weighted and muted-free, for the stages where the server picks the medium.
  const answerMedia = weightedReplyMedia(tuning, replyMediaFor(media))
  const due = dueMedium(tuning, replyMediaAlong(path).slice(-BALANCE_WINDOW), media)

  // --- 3. The mechanical half of legality ----------------------------------
  // Translation and embodiment only mean anything across a change of medium.
  // That is checkable, so check it here rather than spending a model call to be
  // told something arithmetic.
  if (
    game.enforcesConstraint && previous !== null && claimedRelation &&
    !relationPermitted(claimedRelation, previous.medium, mediumId)
  ) {
    const { data: rejected } = await ((db.from('listen_turns') as any)
      .insert({
        session_id: sessionId,
        user_id: userId,
        turn_index: turnIndex,
        parent_turn_id: parent?.id ?? null,
        tuning,
        move_offering: move,
        reply_offering: null,
        relation: null,
        claimed_relation: claimedRelation,
        reading: `A ${claimedRelation} has to cross media, and this stayed in ${medium.plural.toLowerCase()}.`,
        narration:
          `You claimed ${claimedRelation}, which only means something when the medium changes. ` +
          `The offering on the table was already ${medium.plural.toLowerCase()}. Answer in something else, ` +
          `or claim a relation that can live inside one medium.`,
        facts: [],
        legal: false,
      })
      .select()
      .single() as any)

    return NextResponse.json({ turn: rejected, session, missed: false })
  }

  // --- 4. The interpreter --------------------------------------------------
  //
  // The world is a property of the branch, not of the session: two branches that
  // both establish something about the same place are each coherent and are not
  // each other's. See worldFor() for what happens to sessions written before that
  // was true.
  const world = worldFor(
    game.seedWorld,
    (session.world_state ?? {}) as Record<string, any>,
    graph,
    path,
  )

  const history: TurnContext[] = path.slice(-HISTORY_TURNS).map(t => ({
    turn_index: t.turn_index,
    move_offering: t.move_offering,
    reply_offering: t.reply_offering,
    relation: t.relation,
    reading: t.reading,
    narration: t.narration,
    carried: t.carried,
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

  const systemPrompt = buildSystemPrompt(game, media, relations, tuning)
  const userPrompt = buildUserPrompt({
    game,
    media,
    relations,
    world,
    history,
    elsewhere,
    move,
    previous,
    // Said only when the player went back, because on a straight continuation it
    // would be a sentence of prompt that tells the interpreter nothing.
    parentIndex: parent && parent.turn_index !== turnIndex - 1 ? parent.turn_index : null,
    claimedRelation,
    spent,
    prediction: body?.prediction?.trim() || null,
    turnIndex,
    tuning,
    due,
  })

  // One place that talks to the model, because the reply pipeline below may need
  // to ask twice and the second ask must be identical in every respect but its
  // prompt. Returns raw content, or null when the provider itself failed.
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

  const callInterpreter = async (system: string, user: string): Promise<string | null> => {
    const res = await fetch(apiUrl, {
      method: 'POST',
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
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 1400,
        temperature: 0.9,
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.warn(`[correlate] interpreter HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
      return null
    }
    logUsage(userId, 0.005, { model: modelId, endpoint: 'correlate-turn' })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? ''
  }

  const firstRaw = await callInterpreter(systemPrompt, userPrompt)
  if (firstRaw === null) return err('Interpreter unavailable. Try that move again in a moment.', 502)

  const firstPass = normalizeInterpretation(
    parseJsonObject(firstRaw), media, relations, { muted, linkable },
  )
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
  const legal = game.enforcesConstraint && previous !== null
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
  //
  // If all three fail the catalogues are unreachable, and then the turn is NOT
  // recorded — better to ask the player to try again than to write a permanent
  // hole into their chain.
  let reply: Offering | null = null
  const failure: { current: ProviderFailure | null } = { current: null }
  let replySource: 'interpreter' | 'retry' | 'salvage' = 'interpreter'
  let interpretation = firstPass

  const tryResolve = async (plan: NonNullable<Interpretation['reply']>): Promise<Offering | null> => {
    try {
      return await resolveReply(plan, [...inPlay], { userId })
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
      const retryMedia = answerMedia
      const problem = interpretation.replyRejection
        ? describeRejection(interpretation.replyRejection as any)
        : failure.current
          ? `the catalogue could not be reached (${failure.current.provider})`
          : 'nothing real matched what you named'
      const attempted = interpretation.reply?.query
        ?? interpretation.reply?.composed?.title
        ?? null

      console.warn(`[correlate] retrying reply in ${game.id}: ${problem}`)

      const retryRaw = await callInterpreter(
        buildSystemPrompt(game, retryMedia, relations, tuning),
        buildRetryPrompt({
          game, media: retryMedia, relations, move, previous, problem, attempted,
          reading: interpretation.reading,
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
          interpretation = { ...retry, verdict: firstPass.verdict }
          failure.current = null
        }
      }
    }

    // Stage 3 — the server tries on its own terms.
    if (!reply) {
      // Weighted order, so a player who asked for mostly music gets music searched
      // first when the interpreter has already failed twice.
      for (const seed of salvageQueries(interpretation, move)) {
        for (const medium of answerMedia.filter(m => !isComposed(m))) {
          const found = await tryResolve({ medium, query: seed, framing: 'Found in answer to your move' })
          if (found) {
            reply = found
            replySource = 'salvage'
            failure.current = null
            break
          }
        }
        if (reply) break
      }
      if (reply) console.warn(`[correlate] salvaged a reply in ${game.id} after two interpreter attempts`)
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
  const replyNote =
    replySource === 'interpreter' ? reached
    : replySource === 'retry'     ? (reached ? `${reached} (second attempt)` : 'second attempt')
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
  const storedDelta: Record<string, any> | null = legal
    ? { ...interpretation.worldDelta, mediaVisited: visitedAfter(world, move, reply) }
    : null

  const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
      parent_turn_id: parent?.id ?? null,
      move_offering: move,
      reply_offering: reply,
      reply_query: replyNote,
      relation,
      claimed_relation: claimedRelation,
      reading: interpretation.reading,
      narration: interpretation.narration,
      carried: interpretation.carried || null,
      lost: interpretation.lost || null,
      facts: interpretation.facts,
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
    replyRejected: firstPass.replyRejection
      ? describeRejection(firstPass.replyRejection as any)
      : null,
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
