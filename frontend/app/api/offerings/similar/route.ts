import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'
import { OfferingError } from '@/lib/offerings'
import { similarMusic } from '@/lib/offerings/music'

/**
 * Tracks that go with a given one, for a radio that selects by listening data.
 *
 * POST /api/offerings/similar
 *   { trackId?, artistId?, exclude?: string[], limit?: number, drift?: boolean }
 *   → { tracks, fromArtist, drifted, basis }
 *
 * ── Why a route at all, when Deezer is keyless ────────────────────────────
 *
 * Because it is not CORS-open. The API answers with
 * `access-control-allow-methods` and friends but no
 * `access-control-allow-origin`, so a browser fetch is blocked outright —
 * measured, not assumed. The proxy is also where the shared provider cache and
 * the iTunes-era id handling already live, so this is the same shape as
 * /api/offerings/search rather than a new one.
 *
 * A session is required for the same reason that route requires one: every
 * catalogue here is rate-limited per IP, that IP is Cloudflare's shared egress,
 * and an open proxy onto it would be drained by one script. An anonymous
 * session is enough — /play makes one on load.
 *
 * ── POST for a read ───────────────────────────────────────────────────────
 *
 * `exclude` is the list of everything already played, which on a long run is
 * hundreds of ids and past what belongs in a query string. The call is a read
 * and could have been a GET with a shorter exclude list; sending the whole list
 * is what keeps a radio from replaying a track forty minutes later, so the body
 * wins.
 *
 * ── `basis` is in the response on purpose ────────────────────────────────
 *
 * The UI has to be able to say where a song came from, and the honest sentence
 * is narrower than "similar": this is co-listening, from Deezer's own artist
 * flow. Nothing has examined any audio. Returning the basis as a field rather
 * than letting each caller write its own label is how that stays true in the
 * places that render it.
 */

export const dynamic = 'force-dynamic'

/** Enough to keep a queue fed without asking for a whole station at once. */
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 25
/** Past this the body is being used as storage, not as an exclude list. */
const MAX_EXCLUDE = 500

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const fromBearer = await getUserFromToken(req.headers.get('authorization'))
  if (fromBearer) return fromBearer

  let response = NextResponse.next()
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    trackId?: string; artistId?: string; exclude?: unknown; limit?: number; drift?: boolean
  } | null

  const trackId = typeof body?.trackId === 'string' ? body.trackId.trim() : undefined
  const artistId = typeof body?.artistId === 'string' ? body.artistId.trim() : undefined
  if (!trackId && !artistId) {
    return NextResponse.json(
      { error: 'trackId or artistId is required — a radio needs something to start from' },
      { status: 400 },
    )
  }

  const exclude = Array.isArray(body?.exclude)
    ? body!.exclude.filter((x): x is string => typeof x === 'string').slice(0, MAX_EXCLUDE)
    : []
  const limit = Math.max(1, Math.min(Math.trunc(Number(body?.limit)) || DEFAULT_LIMIT, MAX_LIMIT))

  try {
    const result = await similarMusic({ trackId, artistId }, {
      exclude, limit, drift: body?.drift === true,
    })

    if (result.tracks.length === 0) {
      /**
       * Empty is not an error, and the reason it is empty is the useful part.
       *
       * An iTunes-era seed has no Deezer artist to start from and never will;
       * a Deezer seed whose radio was entirely excluded means the listener has
       * heard this neighbourhood and wants `drift`. Those have different fixes,
       * so they are not collapsed into one empty array.
       */
      return NextResponse.json({
        tracks: [],
        fromArtist: null,
        drifted: result.drifted,
        basis: 'deezer-artist-radio',
        reason: trackId && !trackId.startsWith('dz:') && !artistId
          ? 'that track predates the current catalogue, so there is no station to start from it'
          : 'nothing came back that has not already been played — try drifting to a neighbouring artist',
      })
    }

    return NextResponse.json({
      tracks: result.tracks,
      fromArtist: result.fromArtist,
      drifted: result.drifted,
      // See the note above: the label travels with the data.
      basis: 'deezer-artist-radio',
    })
  } catch (e) {
    if (e instanceof OfferingError) {
      console.warn(`[offerings] similar ${e.provider} upstream=${e.upstreamStatus} -> ${e.message}`)
      return NextResponse.json(
        { error: e.message, provider: e.provider, upstreamStatus: e.upstreamStatus },
        { status: e.status },
      )
    }
    throw e
  }
}
