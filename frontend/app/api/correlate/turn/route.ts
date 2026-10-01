import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { availableMedia, getMedium, isComposed, replyMediaFor } from '@/lib/correlate/media'
import { relationPermitted, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  applyWorldDelta, buildRetryPrompt, buildSystemPrompt, buildUserPrompt, describeRejection,
  normalizeInterpretation, parseJsonObject, salvageQueries, sessionScope, type TurnContext,
} from '@/lib/correlate/prompt'
import type { ActionIntent, Interpretation, MediumId, Offering, RelationId } from '@/lib/correlate/types'
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
 *   2. Rule the mechanical part of legality *before* spending a model call: a
 *      declared relation that requires a change of medium and did not get one is
 *      illegal on the face of it, and no interpreter needs to be consulted.
 *   3. Ask the interpreter to read the move, name the relation, and plan a reply.
 *      In a game that enforces its constraint the same call rules on whether the
 *      move connects at all, and that ruling is the only one there is.
 *   4. Make the reply real, or record a miss. A search that found nothing and a
 *      composed reply that is not performable are the same outcome.
 *   5. Persist the turn and the world delta.
 *
 * POST { sessionId, medium, offeringId?, composed?, framing?, claimedRelation?, prediction? }
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const HISTORY_TURNS = 8

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

  // --- 2. Context -----------------------------------------------------------
  const { data: historyRows } = await ((db.from('listen_turns') as any)
    .select('turn_index, move_offering, reply_offering, relation, reading, narration, carried, legal')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: false })
    .limit(HISTORY_TURNS) as any)

  const history: (TurnContext & { legal: boolean })[] = ((historyRows ?? []) as any[]).reverse()

  // The offering on the table is the last *legal* exchange's reply, falling back
  // to that turn's move when the reply missed. An illegal move does not advance it.
  const lastLegal = [...history].reverse().find(t => t.legal)
  const previous: Offering | null =
    (lastLegal?.reply_offering as Offering | null) ?? (lastLegal?.move_offering as Offering | undefined) ?? null

  const turnIndex = history.length > 0 ? history[history.length - 1].turn_index + 1 : 0

  const inPlay = new Set<string>([move.id])
  for (const t of history) {
    if (t.move_offering?.id) inPlay.add(t.move_offering.id)
    if (t.reply_offering?.id) inPlay.add(t.reply_offering.id)
  }

  // Derived from the rows, not from world state. The music section asked the model
  // to maintain a `threadsUsed` array itself, which made the no-repeats rule
  // depend on it remembering to append — recording the relation per turn makes
  // what is spent a fact about the log.
  const spent = spentRelations(history.map(t => ({ relation: t.relation, legal: t.legal })), 1)

  const claimedRelation: RelationId | null =
    body?.claimedRelation && relations.includes(body.claimedRelation) ? body.claimedRelation : null

  if (game.declaredRelation === 'required' && !claimedRelation && previous !== null) {
    return err('This game asks you to name the relation you are claiming.', 400)
  }

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
  const world = (session.world_state ?? {}) as Record<string, any>
  const systemPrompt = buildSystemPrompt(game, media, relations)
  const userPrompt = buildUserPrompt({
    game,
    media,
    relations,
    world,
    history: history.map(({ legal, ...t }) => t),
    move,
    previous,
    claimedRelation,
    spent,
    prediction: body?.prediction?.trim() || null,
    turnIndex,
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

  const firstPass = normalizeInterpretation(parseJsonObject(firstRaw), media, relations)
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

    // Stage 2 — one re-ask, only into media that cannot fail on the player's data.
    if (!reply) {
      const retryMedia = replyMediaFor(media)
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
        buildSystemPrompt(game, retryMedia, relations),
        buildRetryPrompt({
          game, media: retryMedia, relations, move, previous, problem, attempted,
          reading: interpretation.reading,
        }),
      )
      const retry = retryRaw
        ? normalizeInterpretation(parseJsonObject(retryRaw), retryMedia, relations)
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
      for (const seed of salvageQueries(interpretation, move)) {
        for (const medium of replyMediaFor(media).filter(m => !isComposed(m))) {
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

  // --- 6. Persist ---------------------------------------------------------
  const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
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
      legal,
    })
    .select()
    .single() as any)

  if (turnErr) return err(`Could not record that turn: ${turnErr.message}`, 500)

  // An illegal move leaves the world untouched — nothing was established.
  const nextWorld = legal ? applyWorldDelta(world, interpretation) : world

  // mediaVisited is bookkeeping the engine can do better than a prompt can.
  if (legal) {
    const visited = new Set<string>(Array.isArray(nextWorld.mediaVisited) ? nextWorld.mediaVisited : [])
    visited.add(move.medium)
    if (reply) visited.add(reply.medium)
    nextWorld.mediaVisited = [...visited]
  }

  const { data: updated } = await ((db.from('listen_sessions') as any)
    .update({
      world_state: nextWorld,
      turn_count: turnIndex + 1,
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
