import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { availableMedia, getMedium, isComposed } from '@/lib/correlate/media'
import { relationPermitted, resolveRelations, spentRelations } from '@/lib/correlate/relations'
import {
  applyWorldDelta, buildSystemPrompt, buildUserPrompt, normalizeInterpretation,
  parseJsonObject, sessionScope, type TurnContext,
} from '@/lib/correlate/prompt'
import type { ActionIntent, MediumId, Offering, RelationId } from '@/lib/correlate/types'
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

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

  const aiRes = await fetch(apiUrl, {
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1400,
      temperature: 0.9,
    }),
  })

  if (!aiRes.ok) {
    const detail = await aiRes.text().catch(() => '')
    return err(`Interpreter unavailable (HTTP ${aiRes.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`, 502)
  }

  const aiData = await aiRes.json()
  const interpretation = normalizeInterpretation(
    parseJsonObject(aiData?.choices?.[0]?.message?.content ?? ''),
    media,
    relations,
  )
  if (!interpretation) return err('The interpreter returned something unreadable. Try that move again.', 502)

  logUsage(userId, 0.005, { model: modelId, endpoint: 'correlate-turn' })

  // In a game that enforces its constraint the interpreter's verdict is the
  // ruling. An opening move has nothing to connect to, so it cannot be illegal,
  // and a game that never gatekeeps is always legal regardless of what the model
  // volunteers.
  const legal = game.enforcesConstraint && previous !== null
    ? interpretation.verdict !== 'illegal'
    : true

  // --- 5. Make the reply real ---------------------------------------------
  let reply: Offering | null = null
  let replyError: { message: string; provider: string; upstreamStatus: number | null } | null = null
  if (legal && interpretation.reply) {
    try {
      reply = await resolveReply(interpretation.reply, [...inPlay], { userId })
    } catch (e) {
      if (e instanceof OfferingError) {
        // Distinguish "nothing matched" from "the catalogue refused us". Both leave
        // reply null, but only the first is the game working as designed; the
        // second is an outage, and calling it a miss blames the interpreter for it.
        console.warn(`[correlate] reply resolve ${e.provider} upstream=${e.upstreamStatus}: ${e.message}`)
        replyError = { message: e.message, provider: e.provider, upstreamStatus: e.upstreamStatus }
      } else {
        throw e
      }
    }
  }

  // A relation that requires a change of medium and did not get one is not the
  // relation that was used, whatever the interpreter said. Downgrade rather than
  // reject: the reply is real and the reading may still be good.
  let relation = interpretation.relation
  if (reply && relation && !relationPermitted(relation, move.medium, reply.medium)) {
    relation = null
  }

  // --- 6. Persist ---------------------------------------------------------
  const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
      move_offering: move,
      reply_offering: reply,
      reply_query: interpretation.reply?.query
        ?? interpretation.reply?.composed?.title
        ?? null,
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
    missed: legal && !!interpretation.reply && !reply && !replyError,
    replyError,
  })
}
