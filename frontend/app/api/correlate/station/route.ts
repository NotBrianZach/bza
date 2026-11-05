import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'
import { buildGraph, defaultParent, offeringIdsAlong, pathTo } from '@/lib/correlate/graph'
import { activeBranch } from '@/lib/correlate/switching'
import { stationRefusal, stationSeed } from '@/lib/correlate/station'
import { normalizeTuning, stationOf } from '@/lib/correlate/tuning'
import { isSelfReply } from '@/lib/correlate/continuation'
import { similarMusic } from '@/lib/offerings/music'
import { OfferingError } from '@/lib/offerings'
import { serverData } from '@/lib/supabaseSchema'
import type { CorrelationTurn, Offering } from '@/lib/correlate/types'

/**
 * Take one station turn: pick the next track from listening data and record it.
 *
 * POST /api/correlate/station { sessionId, parentTurnId?, drift? }
 *
 * ── Why this is a route and not the client appending to its queue ─────────
 *
 * Because a station pick is a turn now, and a turn is a row. The first version
 * of this fed the audio queue directly and wrote nothing, which kept station
 * songs out of the tree, out of every share link, and unanswerable. Making them
 * turns is parity with "keep going", and writing a turn means the server does
 * it: the turn index, the parent, the limit and the count all have to be decided
 * against the same read, and a client that computed them would be racing its own
 * next pass.
 *
 * ── What it does NOT do, which is most of what makes it honest ────────────
 *
 * No model is called. There is no prompt, no interpretation, no judgement and
 * no quota consumed, because nothing here reads anything: Deezer's artist flow
 * paired these two records because listeners play them together, and that is
 * the whole of the claim. So the row goes in with `relation`,
 * `claimed_relation`, `reading`, `narration`, `world_delta` and `prediction` all
 * null and `facts` empty. The sentence a player sees is derived at render time
 * from `move_by = 'station'`. Migration 79 carries the full reasoning,
 * including why `legal` is true rather than false.
 *
 * `checkQuota` is deliberately NOT called, unlike every other route that writes
 * a turn. Quota is a spend limit on model usage and this spends none; refusing a
 * free song because a month of chat ran out would be charging for the one thing
 * in the section that costs nothing.
 *
 * ── The turn limit IS enforced ───────────────────────────────────────────
 *
 * A station turn is a turn, so it counts, and that is the arguable part written
 * down rather than glossed: a twenty-turn game with the station running spends
 * its allowance on songs. The alternative — a turn that does not count — would
 * make `turn_count` stop meaning the length of the chain, and the limit stop
 * bounding the game. An open-ended game is the default and is what a long
 * listen wants.
 */

export const dynamic = 'force-dynamic'

/** The same bound the turn route uses, for the same reason. */
const MAX_TURNS = 400

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
  if (!userId) return err('Not signed in', 401)

  const body = await req.json().catch(() => null) as {
    sessionId?: string; parentTurnId?: string | null; drift?: boolean
  } | null
  const sessionId = body?.sessionId?.trim()
  if (!sessionId) return err('sessionId is required', 400)

  const db = serviceClient()

  const [sessionResult, turnsResult] = await Promise.all([
    ((db.from('listen_sessions') as any)
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle() as any),
    ((db.from('listen_turns') as any)
      .select(
        'id, turn_index, parent_turn_id, move_by, move_offering, reply_offering, relation, ' +
        'reading, narration, carried, facts, world_delta, link_turn_id, link_note, legal, mode, ' +
        'prediction, prediction_called',
      )
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true })
      .limit(MAX_TURNS) as any),
  ])

  const session = sessionResult?.data
  if (!session) return err('Session not found', 404)
  if (session.status !== 'active') return err('This game is finished', 409)

  const tuning = normalizeTuning(session.tuning, session.media ?? [])
  /**
   * The flag is checked server-side, not merely read from the request.
   *
   * The station is stored in the tuning like everything else the player asks
   * for, so the switch being off and a request arriving anyway means a pass
   * that was in flight when they turned it off. Refusing is what stops a
   * switched-off station from writing one more turn into the chain.
   */
  if (!stationOf(tuning)) return err('The station is not on for this game', 409)

  const refusal = stationRefusal(session.media ?? [])
  if (refusal) return err(refusal, 409)

  if (typeof session.turn_limit === 'number' && (session.turn_count ?? 0) >= session.turn_limit) {
    return err(
      `This game was set to ${session.turn_limit} turns and has played them all. Close it to ` +
      `find out what it was.`,
      409,
    )
  }

  const turns = (turnsResult?.data ?? []) as CorrelationTurn[]
  const graph = buildGraph(turns)
  const parent = body?.parentTurnId
    ? graph.nodes.get(body.parentTurnId)?.turn ?? null
    : defaultParent(graph)
  if (!parent) {
    return err(
      'There is nothing on the table for the station to play on from. Open with something first.',
      409,
    )
  }
  if (!parent.legal || !parent.reply_offering) {
    return err('That exchange has no answer to carry on from.', 409)
  }

  const path = pathTo(graph, parent.id)
  // The branch's own game, not the session's. A station turn joins whatever
  // branch it is played on, and `mode` on the row is what keeps that knowable —
  // see the comment on the same field in the turn route.
  const branch = activeBranch(path, session.mode)

  /**
   * The seed, from the branch this turn joins rather than from the playhead.
   *
   * The queue version seeded from whatever was playing, which was right when
   * nothing was being recorded — a station follows the listener. A turn has a
   * parent, and the parent's answer is what it is played against, so the seed
   * has to be that. The two agree in the ordinary case, because the thing
   * playing during a station run IS the last turn's answer; they differ when the
   * player has scrolled back and clicked an older song, and then the chain is
   * the one that must stay coherent.
   */
  const chain = path
    .filter(t => t.legal)
    .flatMap(t => (isSelfReply(t) ? [t.reply_offering] : [t.move_offering, t.reply_offering]))
    .filter((o): o is Offering => !!o?.id)
  const seed = stationSeed(chain)
  if (!seed) {
    return err('Nothing on this branch is a song the station can start from.', 409)
  }

  try {
    const result = await similarMusic(
      { trackId: seed.trackId, artistId: seed.artistId ?? undefined },
      {
        // Everything already on this branch, so the station cannot answer with
        // something the chain has already played.
        exclude: offeringIdsAlong(path),
        limit: 8,
        drift: body?.drift === true,
      },
    )

    const pick = result.tracks[0]
    if (!pick) {
      /**
       * Empty is a real answer and the caller decides what to do about it.
       *
       * 200 rather than an error status: nothing failed, the neighbourhood is
       * just exhausted, and the fix is to ask again with `drift`. A 4xx here
       * would make the client's failure counter end a run that is working.
       */
      return NextResponse.json({
        turn: null,
        exhausted: true,
        reason: result.drifted
          ? 'even a neighbouring artist had nothing this chain has not already played'
          : 'nothing came back that this chain has not already played',
      })
    }

    const turnIndex = graph.order.length
    const { data: turn, error: turnErr } = await ((db.from('listen_turns') as any)
      .insert({
        session_id: sessionId,
        user_id: userId,
        turn_index: turnIndex,
        parent_turn_id: parent.id,
        move_by: 'station',
        mode: branch.mode,
        // The move is the song it played on from — the parent's answer, stored
        // as it stood. Not re-fetched: the row is the record of what was on the
        // table, and a fresh lookup could return a different framing.
        move_offering: parent.reply_offering,
        reply_offering: pick,
        // Everything an interpreter would have written, left empty. See the
        // module note and migration 79 — the player-facing line is derived from
        // `move_by`, so nothing here is prose nobody wrote.
        relation: null,
        claimed_relation: null,
        reading: null,
        narration: null,
        carried: null,
        lost: null,
        facts: [],
        world_delta: null,
        prediction: null,
        prediction_called: null,
        link_turn_id: null,
        link_note: null,
        tuning,
        legal: true,
      })
      .select()
      .single() as any)

    if (turnErr) return err(`Could not record that turn: ${turnErr.message}`, 500)

    /**
     * Separate from the insert, for the reason the turn route spells out: this
     * is a derived cache of the row above, so running them together would let a
     * failed insert still bump the count.
     *
     * `world_state` is deliberately untouched. Nothing was established — no
     * facts, no delta — so the world after a station turn is the world before
     * it, and writing the same value back would make `updated_at` on the world
     * mean "a song played".
     */
    const { data: updated } = await ((db.from('listen_sessions') as any)
      .update({
        turn_count: graph.order.length + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single() as any)

    return NextResponse.json({
      turn,
      session: updated ?? session,
      // Where the pairing came from, for the UI to attribute the run. Not stored
      // on the row: it is a property of the lookup, not of the pair.
      fromArtist: result.fromArtist,
      drifted: result.drifted,
    })
  } catch (e) {
    if (e instanceof OfferingError) {
      console.warn(`[station] ${e.provider} upstream=${e.upstreamStatus} -> ${e.message}`)
      return err(e.message, e.status)
    }
    return err(e instanceof Error ? e.message : 'The station could not take that turn', 500)
  }
}
