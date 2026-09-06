import { NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function pickTrack(tracks: any[]) {
  return tracks.find((t: any) => t.languageCode === 'en' && t.kind === 'asr')
      || tracks.find((t: any) => t.languageCode === 'en')
      || tracks[0]
}

function extractJsonArray(html: string, marker: string): any[] | null {
  const mi = html.indexOf(marker)
  if (mi === -1) return null
  const arrStart = html.indexOf('[', mi)
  if (arrStart === -1) return null
  let depth = 0, inStr = false, esc = false, arrEnd = -1
  for (let i = arrStart; i < html.length; i++) {
    const ch = html[i]
    if (esc) { esc = false; continue }
    if (ch === '\\' && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '[' || ch === '{') depth++
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { arrEnd = i; break } }
  }
  if (arrEnd === -1) return null
  try { return JSON.parse(html.slice(arrStart, arrEnd + 1)) } catch { return null }
}

function json3ToMarkdown(data: any, title: string): string | null {
  const events: any[] = data?.events ?? []
  const paras: string[] = []
  const buf: string[] = []
  let lastEnd = 0
  for (const evt of events) {
    if (!evt.segs) continue
    const line: string = evt.segs.map((s: any) => s.utf8 ?? '').join('').replace(/\n/g, ' ').trim()
    if (!line) continue
    const tStart: number = evt.tStartMs ?? 0
    if (tStart - lastEnd > 2000 && buf.length) { paras.push(buf.join(' ')); buf.length = 0 }
    buf.push(line)
    lastEnd = tStart + (evt.dDurationMs ?? 0)
  }
  if (buf.length) paras.push(buf.join(' '))
  if (!paras.length) return null
  return `# ${title}\n\n` + paras.join('\n\n')
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get('videoId')
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId' }, { status: 400 })
  }

  // ── 1. Fetch YouTube page to get captionTracks ──────────────────────────────
  let captionUrl: string | null = null
  let videoTitle = ''

  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    })
    if (!pageResp.ok) throw new Error(`YouTube page fetch failed: ${pageResp.status}`)
    const html = await pageResp.text()

    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    videoTitle = (titleMatch?.[1] ?? '').replace(/ - YouTube$/, '').trim()

    const tracks = extractJsonArray(html, '"captionTracks":')
    if (tracks?.length) {
      captionUrl = pickTrack(tracks)?.baseUrl ?? null
    }

    if (!captionUrl) {
      return NextResponse.json({ error: 'No captions available for this video.' }, { status: 404 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to load video page: ' + err.message }, { status: 502 })
  }

  // ── 2. Fetch captions (json3 then xml fallback) ─────────────────────────────
  const base = captionUrl.replace(/[&?]fmt=[^&]*/g, '')
  const sep  = base.includes('?') ? '&' : '?'

  for (const url of [base + sep + 'fmt=json3', base]) {
    try {
      const resp = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!resp.ok) continue
      const text = await resp.text()
      if (!text || text.length < 10) continue

      if (text.trimStart().startsWith('{')) {
        const md = json3ToMarkdown(JSON.parse(text), videoTitle)
        if (md) return NextResponse.json({ markdown: md, title: videoTitle })
        continue
      }

      if (text.includes('<text ')) {
        const lines: string[] = []
        const re = /<text[^>]*>([\s\S]*?)<\/text>/g
        let m: RegExpExecArray | null
        while ((m = re.exec(text)) !== null) {
          const t = m[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/<[^>]+>/g,'').trim()
          if (t) lines.push(t)
        }
        if (lines.length) {
          const paras: string[] = []
          for (let i = 0; i < lines.length; i += 5) paras.push(lines.slice(i, i + 5).join(' '))
          return NextResponse.json({ markdown: `# ${videoTitle}\n\n` + paras.join('\n\n'), title: videoTitle })
        }
      }
    } catch {}
  }

  return NextResponse.json({ error: 'Could not fetch caption data for this video.' }, { status: 502 })
}
