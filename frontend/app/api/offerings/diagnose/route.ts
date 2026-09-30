import { NextRequest, NextResponse } from 'next/server'

/**
 * Probe each catalogue from inside the Worker and report exactly what it answers.
 *
 * This exists because a catalogue can be perfectly healthy from a laptop and
 * refuse the Cloudflare edge — Apple's search API in particular sits behind a WAF
 * that judges the requesting IP, and every request this app makes shares one
 * datacenter IP with everyone else on that colo. `curl` from a developer machine
 * proves nothing about what production sees, so this asks production.
 *
 * It also probes each provider with and without a `User-Agent`, because a
 * crawler-shaped UA sent from a datacenter IP is a plausible reason for a hard
 * refusal and that is a one-variable experiment worth being able to run.
 *
 * Gated on a key so it is not an open proxy onto rate-limited upstreams. No
 * secrets are returned — statuses, timings and a short body prefix only.
 *
 *   curl "https://aireadalong.com/api/offerings/diagnose?key=$KEY"
 */

const PROBES = [
  {
    provider: 'iTunes',
    url: 'https://itunes.apple.com/search?term=rain&media=music&entity=song&limit=25',
  },
  {
    provider: 'AIC',
    url: 'https://api.artic.edu/api/v1/artworks/search?q=rain&limit=48'
      + '&fields=id,title,artist_title,date_display,image_id,is_public_domain',
  },
  {
    provider: 'AIC-IIIF-image',
    // The one URL that genuinely needed a UA. Included so the claim stays testable.
    url: 'https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/200,/0/default.jpg',
  },
]

const UA_VARIANTS: { label: string; headers: Record<string, string> }[] = [
  { label: 'no-ua', headers: {} },
  { label: 'crawler-shaped-ua', headers: { 'User-Agent': 'AIReadAlong/1.0 (+https://aireadalong.com)' } },
  { label: 'browser-shaped-ua', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIReadAlong)' } },
]

export async function GET(req: NextRequest) {
  const key = process.env.OFFERINGS_DIAGNOSE_KEY
  if (!key) return NextResponse.json({ error: 'Diagnostics are not enabled here.' }, { status: 404 })
  if (req.nextUrl.searchParams.get('key') !== key) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  const results: any[] = []

  for (const probe of PROBES) {
    for (const variant of UA_VARIANTS) {
      const started = Date.now()
      try {
        const res = await fetch(probe.url, { headers: { Accept: '*/*', ...variant.headers } })
        const body = await res.text()
        results.push({
          provider: probe.provider,
          variant: variant.label,
          status: res.status,
          ms: Date.now() - started,
          contentType: res.headers.get('content-type'),
          bytes: body.length,
          // Enough to tell a WAF interstitial from real data, not enough to be a proxy.
          bodyPrefix: body.slice(0, 120).replace(/\s+/g, ' '),
        })
      } catch (e: any) {
        results.push({
          provider: probe.provider,
          variant: variant.label,
          status: null,
          ms: Date.now() - started,
          threw: String(e?.message ?? e).slice(0, 200),
        })
      }
    }
  }

  return NextResponse.json({
    // Which colo answered. A refusal is often specific to one, and without this
    // a retry that happens to land elsewhere looks like the bug fixing itself.
    colo: req.headers.get('cf-ray')?.split('-')[1] ?? null,
    results,
  })
}
