import { NextRequest, NextResponse } from 'next/server'

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
    provider: 'iTunes',
    url: 'https://itunes.apple.com/search?term=rain&media=music&entity=song&limit=25',
  },
  {
    // Candidate replacement for iTunes: keyless, and its search response carries a
    // 30-second preview mp3 per track, which is the one thing a game built on
    // listening cannot do without.
    provider: 'Deezer',
    url: 'https://api.deezer.com/search?q=rain&limit=25',
  },
  {
    // A different operator again, so a single fallback is not a single point of
    // failure. The client_id here is Jamendo's public demo one.
    provider: 'Jamendo',
    url: 'https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=5&search=rain',
  },
  {
    provider: 'AIC',
    url: 'https://api.artic.edu/api/v1/artworks/search?q=rain&limit=48'
      + '&fields=id,title,artist_title,date_display,image_id,is_public_domain',
  },
  {
    // Nothing server-side fetches this; the probe exists so the claim that the
    // image host refuses the Worker stays testable rather than remembered.
    provider: 'AIC-IIIF-image',
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
          if (res.ok && ['iTunes', 'Deezer', 'Jamendo'].includes(probe.provider)) {
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

  return NextResponse.json({
    // Which colo answered. A refusal is often specific to one, and without this a
    // retry that happens to land elsewhere looks like the bug fixing itself.
    colo: req.headers.get('cf-ray')?.split('-')[1] ?? null,
    results,
  })
}
