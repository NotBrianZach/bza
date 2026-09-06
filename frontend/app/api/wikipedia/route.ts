import { NextRequest, NextResponse } from 'next/server'

const UA = 'Mozilla/5.0 (compatible; bza/1.0; +https://aireadalong.com)'
const HEADERS = { 'User-Agent': UA, 'Api-User-Agent': UA }

// GET /api/wikipedia?title=Article_Title&lang=en&from_revid=12345
// Returns the latest revision ID and, if different from from_revid, the HTML diff.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const articleKey = searchParams.get('title')
    const lang = searchParams.get('lang') ?? 'en'
    const fromRevid = searchParams.get('from_revid')

    if (!articleKey) return NextResponse.json({ error: 'title required' }, { status: 400 })

    // Fetch latest revision ID
    const summaryRes = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleKey)}`,
      { headers: HEADERS }
    )
    if (!summaryRes.ok) return NextResponse.json({ error: `Wikipedia API error (${summaryRes.status})` }, { status: 502 })

    const summary = await summaryRes.json() as {
      title: string; revision?: number; timestamp?: string; extract?: string
    }
    const latestRevid = summary.revision

    const hasUpdate = fromRevid ? String(latestRevid) !== String(fromRevid) : false

    if (!hasUpdate || !fromRevid || !latestRevid) {
      return NextResponse.json({ hasUpdate: false, latestRevid, title: summary.title })
    }

    // Fetch diff between stored and latest revision
    const diffRes = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/revision/${fromRevid}/compare/${latestRevid}`,
      { headers: HEADERS }
    )

    if (!diffRes.ok) {
      // diff API failed — still report hasUpdate, just no diff content
      return NextResponse.json({ hasUpdate: true, latestRevid, title: summary.title, diffRows: [] })
    }

    const diffData = await diffRes.json() as {
      fromRevId?: number; toRevId?: number
      diff: { type: number; lineNumber?: number | null; items?: { type: number; text: string; offset: { to: number; from: number } }[] }[]
    }

    // Transform diff rows into something UI-friendly
    // type 0 = context, 1 = added, 2 = deleted, 3 = new section heading
    const rows = (diffData.diff ?? []).map(row => ({
      type: row.type,
      content: (row.items ?? []).map(i => i.text).join(''),
    }))

    return NextResponse.json({
      hasUpdate: true,
      latestRevid,
      fromRevid: Number(fromRevid),
      title: summary.title,
      diffRows: rows,
      diffUrl: `https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(articleKey)}&diff=${latestRevid}&oldid=${fromRevid}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
