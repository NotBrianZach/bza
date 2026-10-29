import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { buildClosingPrompt, parseJsonObject, type TurnContext } from '@/lib/correlate/prompt'
import {
  buildGraph, defaultParent, pathTo, worldFor,
} from '@/lib/correlate/graph'
import { activeBranch, playedUnder } from '@/lib/correlate/switching'
import type { CorrelationTurn, MediumId } from '@/lib/correlate/types'
import { serverData } from '@/lib/supabaseSchema'

/**
 * Close a game, and say what it was.
 *
 * The other end of the arc `listen_sessions.turn_limit` creates. Until now
 * finishing a game was a status flag with nothing behind it: the player pressed a
 * button, the board greyed out, and the chain they had spent twenty turns
 * building said nothing about itself.
 *
 * Its own route rather than a branch in the turn route, because it is not a turn
 * — no move, no reply, no relation, nothing added to the graph. It reads the
 * whole line at once, which is the opposite of what the turn loop does (eight
 * turns of window, because the exchange is the subject). Here the *arc* is the
 * subject.
 *
 * Idempotent and one-way. A game that already has a `closing_reading` returns it
 * rather than paying for a second one — the reading is a statement about a
 * finished thing, so a second one would either agree, wasting a call, or
 * disagree, which would mean the first was wrong about a game that has not
 * changed.
 *
 * POST { sessionId }
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const MAX_TURNS = 400
/** How much of the line the closing reading is shown. Generous: the arc is the point. */
const MAX_LINE = 40

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

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return err('Not authenticated', 401)

  const body = await req.json().catch(() => null) as { sessionId?: string } | null
  const sessionId = body?.sessionId
  if (!sessionId) return err('sessionId is required', 400)

  const db = serviceClient()

  const { data: session } = await ((db.from('listen_sessions') as any)
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!session) return err('Session not found', 404)

  // Already closed. Return what it says rather than writing a second opinion.
  if (session.closing_reading) {
    return NextResponse.json({ session, closing: session.closing_reading, already: true })
  }

  const { data: turnRows } = await ((db.from('listen_turns') as any)
    .select(
      'id, turn_index, parent_turn_id, move_by, move_offering, reply_offering, relation, ' +
      'reading, narration, carried, facts, world_delta, link_turn_id, link_note, legal, mode',
    )
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })
    .limit(MAX_TURNS) as any)

  const allTurns = (turnRows ?? []) as CorrelationTurn[]

  /**
   * A game with nothing in it is closed without a reading, not refused.
   *
   * There is no arc to describe and nothing to rule on, and spending a model call
   * to be told so would be worse than the empty string. The player still gets a
   * finished game, which is what they asked for.
   */
  if (allTurns.filter(t => t.legal).length === 0) {
    const { data: updated } = await ((db.from('listen_sessions') as any)
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single() as any)
    return NextResponse.json({ session: updated ?? session, closing: null })
  }

  const graph = buildGraph(allTurns)

  /**
   * The line the game took: the path down to wherever the player ended up.
   *
   * Not the whole tree. A game that branched has several lines and no single one
   * is "the game", but the one the player was standing on when they stopped is
   * the one they played to the end — and a reading of a tree would be a reading
   * of something nobody experienced in order. The other branches are counted and
   * named as having happened, which is the honest treatment.
   */
  const head = defaultParent(graph)
  const line = pathTo(graph, head?.id ?? null).filter(t => t.legal)
  const onLine = new Set(line.map(t => t.id))
  const elsewhereCount = allTurns.filter(t => t.legal && !onLine.has(t.id)).length

  // The branch's game, not the session's — a switched game is closed as what it
  // became, and its own `goal` is the one worth ruling against.
  const branch = activeBranch(line, session.mode, null)
  const game = branch.game ?? getGame(session.mode)
  if (!game) return err(`Unknown game "${branch.mode}"`, 500)

  const media: MediumId[] = Array.isArray(session.media) && session.media.length > 0
    ? session.media as MediumId[]
    : ['music']

  const world = worldFor(
    game.seedWorld,
    branch.boundaries.length > 0 ? {} : (session.world_state ?? {}) as Record<string, any>,
    graph,
    branch.since,
  )

  const context: TurnContext[] = line.slice(-MAX_LINE).map(t => ({
    turn_index: t.turn_index,
    move_offering: t.move_offering,
    reply_offering: t.reply_offering,
    relation: t.relation,
    reading: t.reading,
    narration: t.narration,
    carried: t.carried,
    move_by: t.move_by,
    played_as: playedUnder(t, session.mode, branch.mode)?.name ?? null,
  }))

  const reachedLimit = typeof session.turn_limit === 'number' &&
    (session.turn_count ?? 0) >= session.turn_limit

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

  let closing: string | null = null

  /**
   * The reading is best-effort and the close is not.
   *
   * A player who presses Finish has to end up with a finished game whatever the
   * interpreter does, so every failure below leaves `closing_reading` null and
   * still marks the session finished. Null then means what it says — the game was
   * closed and nothing was written — which the board distinguishes from a reading
   * it simply has not loaded. The quota check is inside this block for the same
   * reason: being out of quota must not block closing a game.
   */
  const quotaErr = apiKey ? await checkQuota(userId) : 'No API key configured'
  if (!quotaErr) {
    try {
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
            { role: 'system', content: game.persona },
            {
              role: 'user',
              content: buildClosingPrompt({ game, world, line: context, elsewhereCount, reachedLimit }),
            },
          ],
          // Fixed rather than from the Breadth axis. Breadth governs how much is
          // said *per turn*, and this is one piece of writing per game — a player
          // who asked for terse turns did not ask for a terse ending.
          max_tokens: 1200,
          temperature: 0.8,
        }),
      })
      if (res.ok) {
        logUsage(userId, 0.004, { model: modelId, endpoint: 'correlate-close' })
        const data = await res.json()
        const parsed = parseJsonObject(data?.choices?.[0]?.message?.content ?? '')
        const text = typeof parsed?.closing === 'string' ? parsed.closing.trim() : ''
        if (text) closing = text
      } else {
        console.warn(`[correlate] closing reading HTTP ${res.status} for ${sessionId}`)
      }
    } catch (e) {
      console.warn(`[correlate] closing reading failed for ${sessionId}: ${e}`)
    }
  }

  const { data: updated } = await ((db.from('listen_sessions') as any)
    .update({
      status: 'finished',
      ...(closing ? { closing_reading: closing } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single() as any)

  return NextResponse.json({ session: updated ?? session, closing })
}
