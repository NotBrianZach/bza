/**
 * Server-side Spotify helpers (API routes only — no browser APIs).
 *
 * The token plumbing here came from the pre-8d1529a5 reading-soundtrack
 * integration — that part is auth, not feature logic, so it transferred
 * unchanged. Everything playlist-shaped did not: Listen Along's moves are
 * individual tracks. `mapPlaylist` is the one exception, kept for a future mode
 * whose artifact is a real playlist rather than a single song.
 *
 * Extended for Listen Along: the 401-force-refresh retry is now a single generic
 * `spotifyFetch` instead of being open-coded per route, and track search /
 * resolution live here so the game engine can turn an interpreter's song *query*
 * into a real track.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CLIENT_ID    = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

export const SPOTIFY_REDIRECT_URI =
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://aireadalong.com'}/api/spotify/callback`

// Every scope here has a caller. Keep it that way — this list is the consent
// screen users actually read, so an unused scope is a real cost.
//   streaming                  Web Playback SDK, for premium in-page playback
//   user-read-private          reads `product`, which gates that playback
//   user-read-playback-state   reading the active device
//   user-modify-playback-state PUT /me/player/play
export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

interface SpotifyTokenRow {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  product: string | null
  display_name: string | null
}

/** A real Spotify track, flattened to the fields the game actually reasons over. */
export interface SpotifyTrackRef {
  id: string
  name: string
  artist: string
  artistIds: string[]
  album: string
  albumId: string | null
  releaseDate: string | null
  uri: string
  url: string | null
  image: string | null
  previewUrl: string | null
  durationMs: number
  popularity: number
  explicit: boolean
}

export interface SpotifyPlaylistRef {
  id: string
  name: string
  description: string
  uri: string
  url: string | null
  image: string | null
  tracks: number
  owner: string
}

async function dbFetch(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    },
  })
}

export async function getTokenRow(userId: string): Promise<SpotifyTokenRow | null> {
  const res = await dbFetch(`spotify_tokens?user_id=eq.${encodeURIComponent(userId)}`)
  const rows: SpotifyTokenRow[] = await res.json()
  return rows[0] ?? null
}

async function refreshToken(row: SpotifyTokenRow): Promise<{ token: string; product: string | null } | null> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: row.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  })
  const refreshRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!refreshRes.ok) return null

  const data = await refreshRes.json()
  const newExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString()

  await dbFetch(`spotify_tokens?user_id=eq.${encodeURIComponent(row.user_id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ access_token: data.access_token, expires_at: newExpiry }),
  })

  return { token: data.access_token, product: row.product }
}

export async function getValidToken(
  userId: string,
  opts?: { forceRefresh?: boolean },
): Promise<{ token: string; product: string | null; row: SpotifyTokenRow } | null> {
  const row = await getTokenRow(userId)
  if (!row) return null

  const expiresAt = new Date(row.expires_at).getTime()
  if (!opts?.forceRefresh && expiresAt > Date.now() + 60_000) {
    return { token: row.access_token, product: row.product, row }
  }

  const refreshed = await refreshToken(row)
  if (!refreshed) return null
  return { ...refreshed, row }
}

export async function upsertTokens(userId: string, tokens: {
  access_token: string; refresh_token: string; expires_in: number; product: string; display_name: string
}) {
  const expires_at = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  await dbFetch('spotify_tokens', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at,
      product: tokens.product,
      display_name: tokens.display_name,
    }),
  })
}

export async function deleteTokens(userId: string) {
  await dbFetch(`spotify_tokens?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export class SpotifyError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/**
 * Call the Spotify Web API as `userId`. Refreshes the token up front when it is
 * near expiry, and retries exactly once on a 401 with a forced refresh (Spotify
 * sometimes rejects a token our expiry arithmetic still considers live).
 *
 * Throws SpotifyError with a 403 when the user has no connection at all, so
 * callers can distinguish "not connected" from "request failed".
 */
export async function spotifyFetch(
  userId: string,
  path: string,
  init: RequestInit = {},
): Promise<{ data: any; product: string | null }> {
  let result = await getValidToken(userId)
  if (!result) throw new SpotifyError('Spotify not connected', 403)

  const url = `https://api.spotify.com/v1${path}`
  const call = (token: string) => fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    },
  })

  let res = await call(result.token)

  if (res.status === 401) {
    result = await getValidToken(userId, { forceRefresh: true })
    if (!result) {
      throw new SpotifyError('Spotify token expired — please reconnect Spotify', 403)
    }
    res = await call(result.token)
  }

  // 204/202 carry no body (playback control).
  if (res.status === 204 || res.status === 202) {
    return { data: null, product: result.product }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = (body as any)?.error?.message ?? 'Spotify request failed'
    throw new SpotifyError(`${msg} (HTTP ${res.status}, ${path})`, res.status)
  }

  return { data: await res.json(), product: result.product }
}

export function mapTrack(t: any): SpotifyTrackRef {
  return {
    id: t.id,
    name: t.name ?? '',
    artist: (t.artists ?? []).map((a: any) => a.name).filter(Boolean).join(', '),
    artistIds: (t.artists ?? []).map((a: any) => a.id).filter(Boolean),
    album: t.album?.name ?? '',
    albumId: t.album?.id ?? null,
    releaseDate: t.album?.release_date ?? null,
    uri: t.uri,
    url: t.external_urls?.spotify ?? null,
    image: t.album?.images?.[0]?.url ?? null,
    previewUrl: t.preview_url ?? null,
    durationMs: t.duration_ms ?? 0,
    popularity: t.popularity ?? 0,
    explicit: !!t.explicit,
  }
}

export function mapPlaylist(p: any): SpotifyPlaylistRef {
  return {
    id: p.id,
    name: p.name,
    description: p.description?.replace(/<[^>]+>/g, '') ?? '',
    uri: p.uri,
    url: p.external_urls?.spotify ?? null,
    image: p.images?.[0]?.url ?? null,
    tracks: p.tracks?.total ?? 0,
    owner: p.owner?.display_name ?? '',
  }
}

export async function searchTracks(userId: string, q: string, limit = 12): Promise<SpotifyTrackRef[]> {
  if (!q.trim()) return []
  const { data } = await spotifyFetch(
    userId,
    `/search?q=${encodeURIComponent(q.trim())}&type=track&limit=${limit}`,
  )
  return (data?.tracks?.items ?? []).filter(Boolean).map(mapTrack)
}

export async function getTrack(userId: string, id: string): Promise<SpotifyTrackRef | null> {
  try {
    const { data } = await spotifyFetch(userId, `/tracks/${encodeURIComponent(id)}`)
    return data ? mapTrack(data) : null
  } catch {
    return null
  }
}

/**
 * Turn an interpreter's song *query* ("artist — title", or a loose description)
 * into a real track. This is the constraint that makes the reply a firm
 * consequence rather than a claim: if Spotify has nothing, the dial missed.
 *
 * Tries the query as given, then a field-scoped variant when it parses as
 * "artist - title", then the bare title. `exclude` keeps the dial from
 * answering with a song already in play.
 */
export async function resolveTrack(
  userId: string,
  query: string,
  exclude: string[] = [],
): Promise<SpotifyTrackRef | null> {
  const raw = query.trim()
  if (!raw) return null

  const attempts: string[] = [raw]

  const dashSplit = raw.split(/\s+[-–—]\s+/)
  if (dashSplit.length === 2) {
    const [left, right] = dashSplit
    // Spotify's field filters are far more precise than a bare string when we
    // know which half is which. Try both assignments — interpreters write it
    // either way round.
    attempts.push(`track:"${right}" artist:"${left}"`)
    attempts.push(`track:"${left}" artist:"${right}"`)
    attempts.push(right)
  }

  const excluded = new Set(exclude)

  for (const attempt of attempts) {
    let tracks: SpotifyTrackRef[]
    try {
      tracks = await searchTracks(userId, attempt, 8)
    } catch (e) {
      if (e instanceof SpotifyError && e.status === 403) throw e
      continue
    }
    const hit = tracks.find(t => !excluded.has(t.id))
    if (hit) return hit
  }

  return null
}
