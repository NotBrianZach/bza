import { NextRequest, NextResponse } from 'next/server'
import { searchOfferings } from '@/lib/offerings'

/**
 * Probe each catalogue from inside the Worker and report exactly what it answers.
 *
 * This exists because a catalogue can be perfectly healthy from a laptop and
 * refuse the Cloudflare edge, and the difference is not guessable. It has already
 * paid for itself twice:
 *
 *  - iTunes answers 429 here with `Rate limit has been exceeded for:
 *    itunes-apple-com|general|<ipv6>` — Apple keys its limit on the requesting IP,
 *    and that IP is a shared Cloudflare egress address we do not control. No
 *    header changes it.
 *  - AIC answers 403 to a request with *no* User-Agent and 200 with any. A laptop
 *    probe cannot see this because curl sends a UA of its own, which is how the
 *    header briefly got removed as useless.
 *
 * Gated on a key so it is not an open proxy onto rate-limited upstreams. Returns
 * statuses, timings and a short body prefix — no secrets.
 *
 *   curl "https://aireadalong.com/api/offerings/diagnose?key=$KEY&repeat=3"
 */

interface Probe { provider: string; url: string }

const PROBES: Probe[] = [
  {
    // Kept as the cautionary case: 429 to everything, keyed on a shared Cloudflare
    // egress IP. See lib/offerings/music.ts.
    provider: 'iTunes',
    url: 'https://itunes.apple.com/search?term=rain&media=music&entity=song&limit=25',
  },
  {
    provider: 'Deezer',
    url: 'https://api.deezer.com/search?q=rain&limit=25',
  },
  {
    provider: 'CMA-api',
    url: 'https://openaccess-api.clevelandart.org/api/artworks/?q=rain&limit=24&has_image=1'
      + '&fields=id,title,creators,creation_date,images,url,type,technique,culture',
  },
  {
    // THE probe that should have been run before adopting an image provider. An API
    // being reachable says nothing about whether its images can be displayed.
    provider: 'CMA-image',
    url: 'https://openaccess-cdn.clevelandart.org/1969.52/1969.52_web.jpg',
  },
  {
    // The previous artwork provider, kept to document why it was dropped: the API
    // needs a UA and the image host challenges everyone, including real browsers
    // hotlinking an <img>, which showed up as empty frames in a game.
    provider: 'AIC-api',
    url: 'https://api.artic.edu/api/v1/artworks/search?q=rain&limit=10&fields=id,title,image_id',
  },
  {
    provider: 'AIC-image',
    url: 'https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/200,/0/default.jpg',
  },
]

const UA_VARIANTS: { label: string; headers: Record<string, string> }[] = [
  { label: 'no-ua', headers: {} },
  { label: 'app-ua', headers: { 'User-Agent': 'AIReadAlong/1.0 aireadalong.com' } },
]

export async function GET(req: NextRequest) {
  const key = process.env.OFFERINGS_DIAGNOSE_KEY
  if (!key) return NextResponse.json({ error: 'Diagnostics are not enabled here.' }, { status: 404 })
  if (req.nextUrl.searchParams.get('key') !== key) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  // Apple's limit is keyed on a shared egress IP, so it is a moving target. One
  // sample cannot tell a permanent block from an unlucky second.
  const repeat = Math.min(Math.max(Number(req.nextUrl.searchParams.get('repeat')) || 1, 1), 5)
  const only = req.nextUrl.searchParams.get('provider')
  const probes = only ? PROBES.filter(p => p.provider === only) : PROBES

  const results: any[] = []

  for (let attempt = 1; attempt <= repeat; attempt++) {
    for (const probe of probes) {
      for (const variant of UA_VARIANTS) {
        const started = Date.now()
        const row: any = { provider: probe.provider, variant: variant.label, attempt }
        try {
          const res = await fetch(probe.url, { headers: { Accept: '*/*', ...variant.headers } })
          const body = await res.text()
          row.status = res.status
          row.ms = Date.now() - started
          row.contentType = res.headers.get('content-type')
          row.bytes = body.length
          // Enough to tell a WAF interstitial from real data, not enough to be a proxy.
          row.bodyPrefix = body.slice(0, 140).replace(/\s+/g, ' ')
          // For the music candidates, the only question that matters is whether a
          // playable preview came back. Answer it here rather than by eye.
          if (res.ok && ['iTunes', 'Deezer'].includes(probe.provider)) {
            row.previewCount = (body.match(/"(previewUrl|preview|audio)"\s*:\s*"http/g) ?? []).length
          }
        } catch (e: any) {
          row.status = null
          row.ms = Date.now() - started
          row.threw = String(e?.message ?? e).slice(0, 200)
        }
        results.push(row)
      }
    }
  }

  // ── Live path ────────────────────────────────────────────────────────────
  // `?live=1` exercises the real resolver rather than a hand-written URL, so a
  // green raw probe and a broken provider module cannot be confused for each
  // other. Only the media that need no user: `passage` reads a private library.
  if (req.nextUrl.searchParams.get('live') === '1') {
    for (const medium of ['music', 'artwork'] as const) {
      const started = Date.now()
      try {
        const offerings = await searchOfferings(medium, 'rain', {}, 5)
        results.push({
          provider: `live:${medium}`,
          variant: 'searchOfferings',
          attempt: 1,
          status: 200,
          ms: Date.now() - started,
          count: offerings.length,
          first: offerings[0]
            ? `${offerings[0].id} | ${offerings[0].title} | ${offerings[0].attribution ?? '-'} | ${offerings[0].perceptible.kind}`
            : null,
        })
      } catch (e: any) {
        results.push({
          provider: `live:${medium}`,
          variant: 'searchOfferings',
          attempt: 1,
          status: e?.status ?? null,
          ms: Date.now() - started,
          threw: String(e?.message ?? e).slice(0, 200),
          upstream: e?.upstreamStatus ?? null,
        })
      }
    }
  }

  return NextResponse.json({
    // Which colo answered. A refusal is often specific to one, and without this a
    // retry that happens to land elsewhere looks like the bug fixing itself.
    colo: req.headers.get('cf-ray')?.split('-')[1] ?? null,
    results,
  })
}
