import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'

/**
 * Read a shared chain. No authentication, by design.
 *
 * "Do you see what I see" is what a correlation game is *for*, and three of the
 * eleven (`judge: 'player'`) are explicitly arguing with somebody — who, until
 * now, was a model, because there was no way to show a chain to a person. This
 * route is the whole social surface.
 *
 * **Why a route and not an RLS policy.** The obvious shape is a policy like
 * `using (share_token is not null)`, and it does not work: PostgREST would then
 * let anyone enumerate every shared game, because the policy can see the row but
 * not the token in the caller's URL. The token has to be matched server-side
 * against a single row, which means a service client, which means a route. The
 * same reasoning as the `.eq('user_id', userId)` predicates everywhere else —
 * RLS is the floor, not the filter.
 *
 * **What is withheld, and why each one.** A shared chain is the exchanges, not
 * the account:
 *
 *  - `user_id` — whose game it is, which is not part of the game.
 *  - `tuning` — what the player asked of their partner. Legible in the chain's
 *    behaviour, and nobody's business as a settings dump.
 *  - `share_token` — echoing the key back in the payload is how a token ends up
 *    in a screenshot.
 *
 * Turns are trimmed to what renders. `prediction` stays, because a guess and
 * whether it landed is one of the better things to show somebody; `world_delta`
 * and `tuning` go, because they are machinery.
 *
 * GET /api/correlate/shared/<token>
 */

/** Long enough that guessing is not a strategy. See `shareToken` in the client. */
const TOKEN_MIN = 16
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // Rejected on shape before touching the database, so a short or empty token
  // cannot become a query at all.
  if (!token || token.length < TOKEN_MIN || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const db = serviceClient()

  const { data: session } = await ((db.from('listen_sessions') as any)
    .select('id, mode, title, rules, media, relations, world_state, status, turn_count, ' +
      'turn_limit, closing_reading, created_at, updated_at, deleted_at')
    .eq('share_token', token)
    .maybeSingle() as any)

  // A trashed game stops being shared without the token having to be revoked.
  // The trash is "hidden from every list, intact, and restorable", and a public
  // link that outlived it would be the one list it stayed visible in.
  if (!session || session.deleted_at) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: turnRows } = await ((db.from('listen_turns') as any)
    .select(
      'id, turn_index, parent_turn_id, move_by, move_offering, reply_offering, relation, ' +
      'claimed_relation, reading, narration, carried, lost, facts, link_turn_id, link_note, ' +
      'legal, mode, prediction, prediction_called, created_at',
    )
    .eq('session_id', session.id)
    .order('turn_index', { ascending: true })
    .limit(MAX_TURNS) as any)

  const { deleted_at: _dropped, ...shared } = session

  return NextResponse.json(
    { session: shared, turns: turnRows ?? [] },
    {
      // A shared chain is immutable until its owner plays another turn, so a
      // short cache is free and makes a link that gets passed around cheap. Short
      // rather than long because "until its owner plays another turn" is not
      // something this route can know.
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    },
  )
}
