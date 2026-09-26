import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import {
  SpotifyError,
  getTrack,
  resolveTrack,
  type SpotifyTrackRef,
} from '@/lib/spotify-server'
import { getMode } from '@/lib/listen/modes'
import { computeLinks } from '@/lib/listen/links'
import {
  applyWorldDelta,
  buildSystemPrompt,
  buildUserPrompt,
  normalizeInterpretation,
  parseJsonObject,
  type TurnContext,
} from '@/lib/listen/prompt'

/**
 * Play one turn of a Listen Along music game.
 *
 * The turn loop, in order:
 *   1. Re-fetch the move from Spotify by id. The client sends an id, never a
 *      track body — a move has to be a real song and the server is the one that
 *      decides what that song is.
 *   2. Compute the verifiable links against the song on the table. Strict modes
 *      reject a move here, before any model call.
 *   3. Ask the interpreter to read the move and name a reply song.
 *   4. Resolve that reply against Spotify. If nothing matches, the dial missed —
 *      the turn is still recorded, with the query kept so the miss is legible.
 *   5. Persist the turn and the world delta.
 *
 * POST body: { sessionId, trackId, prediction? }
 */

const MODEL = process.env.LISTEN_MODEL || 'anthropic/claude-haiku-4-5'
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

  const { sessionId, trackId, prediction } = await req.json() as {
    sessionId?: string
    trackId?: string
    prediction?: string
  }
  if (!sessionId || !trackId) return err('sessionId and trackId are required', 400)

  const db = serviceClient()

  const { data: session } = await ((db.from('listen_sessions') as any)
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!session) return err('Session not found', 404)
  if (session.status !== 'active') return err('This game is finished', 409)

  // --- 1. The move, as Spotify has it -------------------------------------
  let move: SpotifyTrackRef | null
  try {
    move = await getTrack(userId, trackId)
  } catch (e) {
    if (e instanceof SpotifyError) return err(e.message, e.status)
    throw e
  }
  if (!move) return err('That track could not be found on Spotify', 404)

  const mode = getMode(session.mode)
  if (!mode) return err(`Unknown game mode "${session.mode}"`, 500)

  // --- 2. Context and verifiable links ------------------------------------
  const { data: historyRows } = await ((db.from('listen_turns') as any)
    .select('turn_index, move_track, reply_track, reading, narration, legal')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: false })
    .limit(HISTORY_TURNS) as any)

  const history: (TurnContext & { legal: boolean })[] = ((historyRows ?? []) as any[]).reverse()

  // The song on the table is the last *legal* exchange's reply, falling back to
  // that turn's move when the dial missed. An illegal move does not advance it.
  const lastLegal = [...history].reverse().find(t => t.legal)
  const previous: SpotifyTrackRef | null =
    (lastLegal?.reply_track as SpotifyTrackRef | null) ?? (lastLegal?.move_track as SpotifyTrackRef | undefined) ?? null

  const links = computeLinks(move, previous)
  const turnIndex = history.length > 0 ? history[history.length - 1].turn_index + 1 : 0

  const inPlay = new Set<string>([move.id])
  for (const t of history) {
    if (t.move_track?.id) inPlay.add(t.move_track.id)
    if (t.reply_track?.id) inPlay.add(t.reply_track.id)
  }

  const strictReject = mode.judge === 'features' && previous !== null && links.length === 0

  // --- 3. The interpreter --------------------------------------------------
  const world = (session.world_state ?? {}) as Record<string, any>
  const systemPrompt = buildSystemPrompt(mode)
  const userPrompt = buildUserPrompt({
    mode,
    world,
    history: history.map(({ legal, ...t }) => t),
    move,
    links,
    previous,
    prediction: prediction?.trim() || null,
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
        ? { 'HTTP-Referer': 'https://aireadalong.com', 'X-Title': 'AI Listen Along' }
        : {}),
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1200,
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
  )
  if (!interpretation) return err('The interpreter returned something unreadable. Try that move again.', 502)

  logUsage(userId, 0.004, { model: modelId, endpoint: 'listen-turn' })

  // The metadata check is authoritative in strict modes — the model does not get
  // to overrule it in either direction.
  const legal = strictReject ? false : true

  // --- 4. Resolve the reply to a real song --------------------------------
  let reply: SpotifyTrackRef | null = null
  if (legal && interpretation.replyQuery) {
    try {
      reply = await resolveTrack(userId, interpretation.replyQuery, [...inPlay])
    } catch (e) {
      if (e instanceof SpotifyError && e.status === 403) return err(e.message, 403)
    }
  }

  // --- 5. Persist ---------------------------------------------------------
  const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
      move_track: move,
      reply_track: reply,
      reply_query: interpretation.replyQuery || null,
      reading: interpretation.reading,
      narration: interpretation.narration,
      facts: interpretation.facts,
      links,
      legal,
    })
    .select()
    .single() as any)

  if (turnErr) return err(`Could not record that turn: ${turnErr.message}`, 500)

  // An illegal move leaves the world untouched — nothing was established.
  const nextWorld = legal ? applyWorldDelta(world, interpretation) : world

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
    missed: legal && !!interpretation.replyQuery && !reply,
  })
}
