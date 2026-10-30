import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken, checkQuota, logUsage } from '@/lib/apiQuota'
import { getGame } from '@/lib/correlate/games'
import { buildClaimPrompt, parseJsonObject } from '@/lib/correlate/prompt'
import { buildGraph } from '@/lib/correlate/graph'
import { activeBranch } from '@/lib/correlate/switching'
import type { CorrelationTurn } from '@/lib/correlate/types'
import { serverData } from '@/lib/supabaseSchema'

/**
 * The player claims two exchanges rhyme, and is ruled on.
 *
 * The other half of `listen_turns.link_turn_id`. That column holds the single
 * most interesting observation this engine makes — that turn 9 is doing again, in
 * another medium, what turn 2 did, possibly on a branch nobody has visited since
 * — and it was only ever *volunteered* by the interpreter, rendered as grey text
 * under the exchange. The player could not make the observation, so they could
 * not be right about one.
 *
 * Which is the thing a chain was missing. Nine of the eleven games cannot turn a
 * move away at all, and the two that can do not at the default Friction setting,
 * so there was no way to be wrong — and therefore no way to be right. A claim
 * reverses the direction: instead of avoiding refusal, you reach for credit.
 *
 * Three verdicts, not two. `holds` / `thin` / `no`, because "thin, but real" is
 * the ruling this engine produces best and a boolean would file it as failure —
 * the whole section is built on connections that are explainable rather than
 * exact. See migration 78.
 *
 * POST { sessionId, fromTurnId, toTurnId, note }
 */

const MODEL = process.env.LISTEN_MODEL || process.env.CORRELATE_MODEL || 'anthropic/claude-haiku-4-5'
const MAX_TURNS = 400
/** A claim is one sentence. Longer than this is an essay, and not a claim. */
const NOTE_MAX = 400

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

  const quotaErr = await checkQuota(userId)
  if (quotaErr) return err(quotaErr, 429)

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return err('No API key configured', 501)

  const body = await req.json().catch(() => null) as {
    sessionId?: string
    fromTurnId?: string
    toTurnId?: string
    note?: string
  } | null

  const sessionId = body?.sessionId
  const fromTurnId = body?.fromTurnId
  const toTurnId = body?.toTurnId
  const note = (body?.note ?? '').trim().slice(0, NOTE_MAX)

  if (!sessionId || !fromTurnId || !toTurnId) {
    return err('sessionId, fromTurnId and toTurnId are required', 400)
  }
  // Required, and this is the rule rather than a validation nicety: a claim with
  // no stated reason is not a claim, it is a pair of turns. The interpreter would
  // have nothing to rule on and would end up inventing the claim it then judged.
  if (!note) return err('Say what the two share — that is the claim.', 400)
  if (fromTurnId === toTurnId) return err('A turn cannot rhyme with itself.', 400)

  const db = serviceClient()

  const { data: session } = await ((db.from('listen_sessions') as any)
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle() as any)

  if (!session) return err('Session not found', 404)

  const { data: turnRows } = await ((db.from('listen_turns') as any)
    .select(
      'id, turn_index, parent_turn_id, move_by, move_offering, reply_offering, relation, ' +
      'reading, narration, carried, facts, world_delta, link_turn_id, link_note, legal, mode',
    )
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true })
    .limit(MAX_TURNS) as any)

  const allTurns = (turnRows ?? []) as CorrelationTurn[]
  const from = allTurns.find(t => t.id === fromTurnId) ?? null
  const to = allTurns.find(t => t.id === toTurnId) ?? null

  if (!from || !to) return err('Those exchanges are not both part of this game.', 404)
  /**
   * A turned-away move established nothing, so it is not available to rhyme with.
   *
   * The same rule `offeringOnTable` and `defaultParent` apply, for the same
   * reason: an illegal turn is not part of the chain, and a claim about one would
   * be a claim about something that did not happen.
   */
  if (!from.legal || !to.legal) {
    return err('One of those moves was turned away, so there is nothing there to rhyme with.', 400)
  }

  const graph = buildGraph(allTurns)
  // Ruled by the game the *claiming* turn was played under. A claim can span a
  // switch — that is one of the more interesting things it can do — and the
  // interpreter asked to rule is the one whose rules the player is standing in.
  const branch = activeBranch([from], session.mode, null)
  const game = branch.game ?? getGame(session.mode)
  if (!game) return err(`Unknown game "${branch.mode}"`, 500)

  const useOpenRouter = !!process.env.OPENROUTER_API_KEY
  const apiUrl = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const modelId = useOpenRouter ? MODEL : 'gpt-4o-mini'

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
        { role: 'user', content: buildClaimPrompt({ game, from, to, note }) },
      ],
      max_tokens: 700,
      // No `temperature`. Claude Sonnet 5 rejects a non-default value, so
      // this was being dropped or normalized upstream and had no effect —
      // see the turn route, where the same dead parameter was removed.
    }),
  })

  if (!res.ok) {
    console.warn(`[correlate] claim ruling HTTP ${res.status} in ${game.id}`)
    return err('That could not be ruled on just now. Try it again in a moment.', 502)
  }

  logUsage(userId, 0.002, { model: modelId, endpoint: 'correlate-claim' })
  const data = await res.json()
  const parsed = parseJsonObject(data?.choices?.[0]?.message?.content ?? '')

  const verdict = parsed?.verdict === 'holds' ? 'holds'
    : parsed?.verdict === 'thin' ? 'thin'
    : parsed?.verdict === 'no' ? 'no'
    : null
  const ruling = typeof parsed?.ruling === 'string' ? parsed.ruling.trim() : ''

  // No verdict and no sentence is a failed ruling, not a rejected claim, and the
  // two must not look alike — a stored row with a null verdict says "nobody
  // ruled", which is exactly what happened.
  if (!verdict && !ruling) {
    return err('That could not be ruled on just now. Try it again in a moment.', 502)
  }

  const { data: claim, error: claimErr } = await ((db.from('listen_claims') as any)
    .insert({
      session_id: sessionId,
      user_id: userId,
      from_turn_id: fromTurnId,
      to_turn_id: toTurnId,
      note,
      verdict,
      ruling: ruling || null,
    })
    .select()
    .single() as any)

  if (claimErr) {
    // The unique (from, to) index. A second claim about the same pair is the
    // player having another go at a ruling they did not like, which is exactly
    // what the index is there to stop.
    if (/duplicate|unique/i.test(claimErr.message ?? '')) {
      return err('You have already claimed those two rhyme. The first ruling stands.', 409)
    }
    return err(`Could not record that claim: ${claimErr.message}`, 500)
  }

  return NextResponse.json({ claim, turns: { from: from.turn_index, to: to.turn_index } })
}
