import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isSupadataUrl } from '@/lib/supadata'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function fetchViaSupadata(url: string): Promise<{
  title: string; channelName?: string; markdown: string; requestType: string
}> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('Supadata API not configured — contact support.')

  const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]

  if (videoId) {
    // oEmbed: title + channel
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    ).then(r => r.ok ? r.json() as Promise<{ title?: string; author_name?: string }> : {}).catch(() => ({}))
    const title = decodeEntities((oembed as any).title ?? 'YouTube Video')
    const channelName = decodeEntities((oembed as any).author_name ?? '')

    // Supadata transcript
    const res = await fetch(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      { headers: { 'x-api-key': apiKey } }
    )
    if (!res.ok) {
      // Fallback to direct timedtext
      const fallback = await fetchTimedText(videoId)
      if (fallback) {
        return { title, channelName, markdown: `# ${title}\n\n*${channelName}*\n\n${fallback}`, requestType: 'youtube_transcript' }
      }
      throw new Error(`Transcript not available for this video (${res.status})`)
    }
    const data = await res.json() as { content?: string }
    const transcript = data.content?.trim()
    if (!transcript) throw new Error('No transcript available for this video')
    return { title, channelName, markdown: `# ${title}\n\n*${channelName}*\n\n${transcript}`, requestType: 'youtube_transcript' }
  }

  // Other social media — Supadata web content
  const res = await fetch(
    `https://api.supadata.ai/v1/web/scrape?url=${encodeURIComponent(url)}`,
    { headers: { 'x-api-key': apiKey } }
  )
  if (!res.ok) throw new Error(`Could not fetch content from this URL (Supadata ${res.status})`)
  const data = await res.json() as { content?: string; title?: string }
  if (!data.content || data.content.length < 50) throw new Error('No readable content found at this URL')
  return { title: data.title ?? 'Post', markdown: data.content, requestType: 'social_transcript' }
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

function htmlToMarkdown(html: string): string {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
  h = h
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n#### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(h).replace(/\n{3,}/g, '\n\n').trim()
}

function extractMeta(html: string): { title: string; description: string } {
  const title = decodeEntities(
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    'Article'
  ).trim()
  const description = decodeEntities(
    html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i)?.[1] ||
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ||
    ''
  ).trim()
  return { title, description }
}

function extractArticleBody(html: string): string {
  return (
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<div[^>]*(?:class|id)="[^"]*(?:article|content|post|entry|story|body)[^"]*"[^>]*>([\s\S]{200,}?)<\/div>/i)?.[1] ||
    html
  )
}

// ─── Jina Reader fallback ─────────────────────────────────────────────────────
// r.jina.ai renders pages headlessly and returns clean markdown.
// Handles paywalls, JS-heavy sites, and bot-blocked domains.

async function fetchViaJina(url: string): Promise<{ title: string; markdown: string }> {
  const headers: Record<string, string> = {
    'User-Agent': UA,
    'Accept': 'text/plain',
    'X-Return-Format': 'markdown',
    'X-No-Cache': 'true',
  }
  if (process.env.JINA_API_KEY) headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`
  const res = await fetch(`https://r.jina.ai/${url}`, { headers })
  if (!res.ok) throw new Error(res.status === 429 || res.status === 503 ? `jina:${res.status}` : `Jina Reader failed (${res.status}) — site may be inaccessible`)
  const markdown = (await res.text()).trim()
  if (markdown.length < 100) throw new Error('Jina Reader returned no content for this URL')
  const title = markdown.match(/^#\s+(.+)/m)?.[1]?.trim() ?? 'Article'
  return { title, markdown }
}

async function fetchViaWayback(url: string): Promise<{ title: string; markdown: string }> {
  const checkRes = await fetch(
    `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    { headers: { 'User-Agent': UA } }
  )
  if (!checkRes.ok) throw new Error('Wayback Machine unavailable')
  const checkData = await checkRes.json() as { archived_snapshots?: { closest?: { url: string; available: boolean } } }
  const snapshotUrl = checkData?.archived_snapshots?.closest?.url
  if (!snapshotUrl || !checkData?.archived_snapshots?.closest?.available) {
    throw new Error('No Wayback Machine snapshot available for this URL')
  }
  const res = await fetch(snapshotUrl, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Wayback Machine fetch failed: ${res.status}`)
  const body = await res.text()
  const meta = extractMeta(body)
  const markdown = htmlToMarkdown(extractArticleBody(body))
  if (markdown.length < 100) throw new Error('Insufficient content from Wayback Machine snapshot')
  return { title: meta.title || 'Article', markdown }
}

// ─── RSS / Atom ───────────────────────────────────────────────────────────────

export interface FeedItem {
  title: string
  content: string
  url: string
  date: string
}

function cdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function parseRSSFeed(xml: string): { feedTitle: string; items: FeedItem[] } {
  const isAtom = /<feed/i.test(xml)
  if (isAtom) {
    const feedTitle = decodeEntities(cdata(xml.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? 'Feed'))
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)]
    return {
      feedTitle,
      items: entries.slice(0, 30).map(e => ({
        title: decodeEntities(cdata(e[1].match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '')),
        content: htmlToMarkdown(cdata(
          e[1].match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ??
          e[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? ''
        )),
        url: e[1].match(/<link[^>]+href="([^"]+)"/)?.[1] ?? cdata(e[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? ''),
        date: cdata(e[1].match(/<published>([\s\S]*?)<\/published>/)?.[1] ?? e[1].match(/<updated>([\s\S]*?)<\/updated>/)?.[1] ?? ''),
      }))
    }
  } else {
    const feedTitle = decodeEntities(cdata(xml.match(/<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1] ?? 'Feed'))
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    return {
      feedTitle,
      items: items.slice(0, 30).map(item => ({
        title: decodeEntities(cdata(item[1].match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')),
        content: htmlToMarkdown(cdata(
          item[1].match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] ??
          item[1].match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
        )),
        url: cdata(item[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? item[1].match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? ''),
        date: cdata(item[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ''),
      }))
    }
  }
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

async function fetchTimedText(videoId: string): Promise<string | null> {
  const endpoints = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&kind=asr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { headers: { 'User-Agent': UA } })
      if (!res.ok) continue
      const body = await res.text()
      if (!body || body.length < 50) continue

      let lines: string[]
      if (body.trimStart().startsWith('{')) {
        const json = JSON.parse(body) as { events?: { segs?: { utf8?: string }[] }[] }
        lines = (json.events ?? [])
          .flatMap(e => (e.segs ?? []).map(s => s.utf8 ?? ''))
          .map(s => s.replace(/\n/g, ' ').trim())
          .filter(Boolean)
      } else {
        lines = [...body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)]
          .map(m => decodeEntities(m[1].replace(/<[^>]+>/g, '')).trim())
          .filter(Boolean)
      }

      if (lines.length < 5) continue

      const paragraphs: string[] = []
      let current = ''
      for (const word of lines.join(' ').split(' ')) {
        current += (current ? ' ' : '') + word
        if (current.length >= 300 && /[.!?]$/.test(word)) {
          paragraphs.push(current)
          current = ''
        }
      }
      if (current) paragraphs.push(current)
      return paragraphs.join('\n\n')
    } catch { continue }
  }
  return null
}

async function fetchYouTubeTranscript(url: string): Promise<{ title: string; channelName: string; markdown: string }> {
  const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]
  if (!videoId) throw new Error('Invalid YouTube URL')

  // oEmbed: reliable public API for title/author
  const oembedRes = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  )
  if (!oembedRes.ok) throw new Error(`Could not fetch YouTube metadata (${oembedRes.status})`)
  const oembed = await oembedRes.json() as { title?: string; author_name?: string }
  const title = decodeEntities(oembed.title ?? 'YouTube Video')
  const channelName = decodeEntities(oembed.author_name ?? '')

  // Try direct timedtext first, fall back to Jina Reader
  let transcript = await fetchTimedText(videoId)
  if (!transcript) {
    try {
      const jina = await fetchViaJina(url)
      // Strip the Jina-generated title line since we have a better one from oEmbed
      transcript = jina.markdown.replace(/^#[^\n]+\n+/, '').trim()
    } catch { /* ignore */ }
  }

  if (!transcript) {
    throw new Error('No transcript or captions available for this video.')
  }

  const markdown = `# ${title}\n\n*${channelName}*\n\n${transcript}`
  return { title, channelName, markdown }
}

// ─── Wikipedia ────────────────────────────────────────────────────────────────

function wikiHtmlToMarkdown(html: string, headingLevel: number): string {
  // Pre-pass: collect ALL images from HTML before any stripping
  // Replace <img> tags in-place with markdown image syntax so they survive tag stripping
  let h = html
    .replace(/<img[^>]*\bsrc="([^"]+)"[^>]*>/gi, (full, src: string) => {
      const resolved = src.startsWith('//') ? `https:${src}` : src
      if (/\.(webm|ogv|ogg|mp4|mp3|wav|flac)(\?|$)/i.test(resolved)) return ''
      if (/^data:/.test(resolved)) return ''
      // Skip tiny icons/arrows (typically < 30px)
      const widthMatch = full.match(/\bwidth="(\d+)"/)
      if (widthMatch && parseInt(widthMatch[1]) < 30) return ''
      const alt = full.match(/\balt="([^"]*)"/)
      return `\n![${alt?.[1] || ''}](${resolved})\n`
    })

  h = h
    // Strip reference/citation markers like [1], [note 1], etc. (superscripts)
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '')
    // Strip edit section links — two-pass: inner bracket spans first, then outer mw-editsection span
    // Structure: <span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a>edit</a><span class="mw-editsection-bracket">]</span></span>
    .replace(/<span[^>]*class="[^"]*mw-editsection-bracket[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    // Keep math: prefer alttext attribute on <math> (already TeX), fall back to <annotation>
    // Respect display="block" → $$...$$ vs inline → $...$
    .replace(/<math([^>]*)>([\s\S]*?)<\/math>/gi, (_, attrs: string, inner: string) => {
      const alttext = attrs.match(/\balttext="([^"]*)"/)?.[1]
      const annotation = inner.match(/<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/i)?.[1]
      const raw = (alttext ?? annotation ?? '').trim()
      if (!raw) return ''
      // Decode HTML entities that Wikipedia puts in alttext
      const tex = raw
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      const isBlock = /\bdisplay="block"/.test(attrs)
      return isBlock ? `\n\n$$${tex}$$\n\n` : ` $${tex}$ `
    })
    // Strip any remaining MathML markup (mrow, msub, mn, etc.) that would leak as garbage
    .replace(/<\/?(math|mrow|msup|msub|mfrac|mn|mi|mo|mspace|mtext|munder|mover|mtable|mtr|mtd|msqrt|mroot|mpadded|merror|mstyle|mfenced|mmultiscripts)[^>]*>/gi, '')
    // Headings — offset by headingLevel
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, `\n\n${'#'.repeat(headingLevel + 1)} $1\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, `\n\n${'#'.repeat(headingLevel + 2)} $1\n\n`)
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, `\n\n${'#'.repeat(headingLevel + 3)} $1\n\n`)
    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    // Definition lists (common in Wikipedia infoboxes — skip them)
    .replace(/<d[lt][^>]*>[\s\S]*?<\/d[lt]>/gi, '')
    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
    // Bold / italic
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
    // Tables — strip (images already extracted in pre-pass)
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    // Figures — images become markdown, videos become <video> HTML
    .replace(/<figure[\s\S]*?<\/figure>/gi, (fig) => {
      const captionMatch = fig.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      const caption = captionMatch ? captionMatch[1].replace(/<[^>]+>/g, '').trim() : ''

      // Video figure: extract poster + sources
      if (/<video[\s\S]*?>/.test(fig)) {
        const posterMatch = fig.match(/\bposter="([^"]+)"/)
        const sources = [...fig.matchAll(/\bsrc="([^"]+\.(?:webm|ogv|ogg|mp4))"[^>]*type="([^"]+)"/gi)]
        if (sources.length === 0) return ''
        const poster = posterMatch ? (posterMatch[1].startsWith('//') ? `https:${posterMatch[1]}` : posterMatch[1]) : ''
        const srcTags = sources.map(m => {
          const src = m[1].startsWith('//') ? `https:${m[1]}` : m[1]
          return `<source src="${src}" type="${m[2]}">`
        }).join('')
        return `\n\n<video controls${poster ? ` poster="${poster}"` : ''} style="max-width:100%;border-radius:8px">${srcTags}</video>${caption ? `\n\n*${caption}*` : ''}\n\n`
      }

      // Image figure
      if (/<audio[\s\S]*?>/.test(fig)) return ''
      const srcMatch = fig.match(/\bsrc="([^"]+)"/)
      if (!srcMatch) return ''
      const src = srcMatch[1].startsWith('//') ? `https:${srcMatch[1]}` : srcMatch[1]
      if (/\.(webm|ogv|ogg|mp4|mp3|wav|flac)(\?|$)/i.test(src)) return ''
      return `\n\n![${caption}](${src})\n\n`
    })
    // All remaining tags
    .replace(/<[^>]+>/g, '')
  return decodeEntities(h).replace(/\n{3,}/g, '\n\n').trim()
}

async function fetchWikipediaArticle(url: string): Promise<{
  title: string; summary: string; revid: number; lang: string; articleKey: string; markdown: string
}> {
  const match = url.match(/(?:https?:\/\/)?([a-z]+)\.wikipedia\.org\/wiki\/(.+?)(?:\?.*)?$/)
  if (!match) throw new Error('Invalid Wikipedia URL')
  const lang = match[1]
  const articleKey = decodeURIComponent(match[2])

  const headers = { 'User-Agent': UA, 'Api-User-Agent': UA }

  // Summary endpoint: gives extract + revision ID
  const summaryRes = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleKey)}`,
    { headers }
  )
  if (!summaryRes.ok) throw new Error(`Wikipedia article not found (${summaryRes.status})`)
  const summaryData = await summaryRes.json() as {
    title: string; extract: string; revision?: number
  }

  // Action API parse endpoint — stable, returns full rendered HTML + revid
  const parseUrl = `https://${lang}.wikipedia.org/w/api.php?` +
    `action=parse&page=${encodeURIComponent(articleKey)}&prop=text&formatversion=2&format=json`
  const parseRes = await fetch(parseUrl, { headers })
  if (!parseRes.ok) throw new Error(`Wikipedia parse API error (${parseRes.status})`)
  const parseData = await parseRes.json() as {
    parse?: { title: string; pageid: number; revid: number; text: string }
    error?: { code: string; info: string }
  }
  if (parseData.error) throw new Error(`Wikipedia API error: ${parseData.error.info}`)
  if (!parseData.parse) throw new Error('Empty response from Wikipedia parse API')

  const revid = parseData.parse.revid ?? summaryData.revision ?? 0

  // Strip TOC div, navboxes, infoboxes, reference lists, hatnotes, inline styles before converting
  let html = parseData.parse.text
    // Inline <style> blocks emitted by templates (contain .mw-parser-output CSS)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Hatnotes: "X redirects here", "For other uses, see ..."
    .replace(/<div[^>]*\bclass="[^"]*hatnote[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    // Disambiguation/short-description banners
    .replace(/<div[^>]*\bclass="[^"]*(?:shortdescription|mw-empty-elt)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*\bid="toc"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '')
    // Tables: convert to markdown tables preserving images and text
    .replace(/<table[^>]*\bclass="[^"]*(?:infobox|navbox|wikitable)[^"]*"[^>]*>[\s\S]*?<\/table>/gi, (table) => {
      // Skip navboxes (navigation, not content)
      if (/\bnavbox\b/.test(table)) return ''
      // Extract rows
      const rows: string[][] = []
      const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
      let rm: RegExpExecArray | null
      while ((rm = rowRe.exec(table)) !== null) {
        const cells: string[] = []
        const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi
        let cm: RegExpExecArray | null
        while ((cm = cellRe.exec(rm[1])) !== null) {
          let cell = cm[1]
          // Convert images to markdown
          cell = cell.replace(/<img[^>]*\bsrc="([^"]+)"[^>]*>/gi, (imgTag, src: string) => {
            const resolved = src.startsWith('//') ? `https:${src}` : src
            if (/\.(webm|ogv|ogg|mp4|mp3|wav|flac)(\?|$)/i.test(resolved)) return ''
            if (/^data:/.test(resolved)) return ''
            const w = imgTag.match(/\bwidth="(\d+)"/)
            if (w && parseInt(w[1]) < 30) return ''
            const a = imgTag.match(/\balt="([^"]*)"/)
            return `![${a?.[1] || ''}](${resolved})`
          })
          // Strip remaining HTML tags, decode entities, clean up
          cell = cell.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\n+/g, ' ').trim()
          cells.push(cell)
        }
        if (cells.length > 0) rows.push(cells)
      }
      if (rows.length === 0) return ''
      // Build markdown table
      const maxCols = Math.max(...rows.map(r => r.length))
      const mdRows = rows.map(r => {
        while (r.length < maxCols) r.push('')
        return `| ${r.join(' | ')} |`
      })
      // Insert separator after first row (header)
      if (mdRows.length > 1) {
        mdRows.splice(1, 0, `|${' --- |'.repeat(maxCols)}`)
      }
      return `\n\n${mdRows.join('\n')}\n\n`
    })
    .replace(/<div[^>]*\bclass="[^"]*(?:reflist|references|mw-references)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

  let markdown = `# ${summaryData.title}\n\n${summaryData.extract}\n\n` +
    wikiHtmlToMarkdown(html, 1)

  // Trim back-matter sections
  const backMatterRe = /\n#{1,3}\s+(?:References|Notes|Citations?|External links?|Further reading|Bibliography|See also|Footnotes)\b/im
  const trimIdx = markdown.search(backMatterRe)
  if (trimIdx > 0) markdown = markdown.slice(0, trimIdx)

  markdown = markdown.replace(/\n{4,}/g, '\n\n\n').trim()
  return { title: summaryData.title, summary: summaryData.extract, revid, lang, articleKey, markdown }
}

// ─── Domains that require JS rendering — always use Jina, skip direct fetch ───

const JINA_FIRST_DOMAINS = [
  'lesswrong.com',
  'forum.effectivealtruism.org',
  'astralcodexten.com',
  'substack.com',
  'medium.com',
  'bloomberg.com',
  'ft.com',
  'wsj.com',
  'nytimes.com',
  'theatlantic.com',
  'wired.com',
]

function needsJina(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return JINA_FIRST_DOMAINS.some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

// Google News links redirect to the real article — resolve the final URL first
async function resolveGoogleNews(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  })
  // After following redirects, the final URL is the real article
  return res.url !== url ? res.url : url
}

// ─── Route ────────────────────────────────────────────────────────────────────

async function checkProTier(req: NextRequest): Promise<{ userId: string } | null> {
  let res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check tier via service role RPC
  const quotaRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_user_quota`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_uuid: user.id }),
    }
  )
  if (!quotaRes.ok) return null
  const quota = await quotaRes.json() as { tier?: string }[]
  if (!quota?.[0] || quota[0].tier === 'free') return null
  return { userId: user.id }
}

async function logSupadataUsage(userId: string, requestType: string, url: string) {
  await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/api_usage`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        api_provider: 'supadata',
        model: 'transcript',
        endpoint_type: 'transcript',
        request_type: requestType,
        input_tokens: 0,
        output_tokens: 0,
        base_cost: 0.01,
        markup_multiplier: 2.0,
        book_id: null,
        request_metadata: { url },
      }),
    }
  ).catch(() => {}) // non-fatal
}

export async function POST(req: NextRequest) {
  try {
    let { url, method } = await req.json() as { url: string; method?: string }
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'url required' }, { status: 400 })

    // Google News — resolve redirect to real article URL first
    if (/news\.google\.com/.test(url)) {
      try { url = await resolveGoogleNews(url) } catch { /* use original */ }
    }

    // Explicit Supadata method OR auto-detect social media URLs
    if (method === 'supadata' || isSupadataUrl(url)) {
      const pro = await checkProTier(req)
      const result = await fetchViaSupadata(url)
      if (pro) logSupadataUsage(pro.userId, result.requestType, url)
      if (result.requestType === 'youtube_transcript') {
        return NextResponse.json({ type: 'youtube', title: result.title, channelName: result.channelName ?? '', markdown: result.markdown })
      }
      return NextResponse.json({ type: 'webpage', title: result.title, description: '', markdown: result.markdown })
    }

    // Wikipedia (kept before Supadata path so it doesn't accidentally match)
    if (/\.wikipedia\.org\/wiki\//.test(url)) {
      const result = await fetchWikipediaArticle(url)
      return NextResponse.json({ type: 'wikipedia', ...result })
    }

    // Feed URLs: always try direct fetch first regardless of domain
    // (e.g. lesswrong.com/feed.xml is in JINA_FIRST_DOMAINS but is perfectly fetchable directly)
    const looksLikeFeed = /\/(feed|rss|atom)(\.xml)?(\/|$|\?)|\.xml(\?|$)|(feed|rss|atom)\.xml/i.test(url)

    // JS-heavy sites — go straight to Jina, no wasted direct fetch (unless it looks like a feed)
    if (needsJina(url) && !looksLikeFeed) {
      const jina = await fetchViaJina(url)
      return NextResponse.json({ type: 'webpage', title: jina.title, description: '', markdown: jina.markdown })
    }

    // Try direct fetch first
    let title = 'Article'
    let description = ''
    let markdown = ''
    let feedLinks: { url: string; title: string }[] = []

    try {
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Referer': 'https://www.google.com/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
        },
      }).finally(() => clearTimeout(fetchTimeout))

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get('content-type') ?? ''

      // PDF detection — handle before text() consumes the body
      const looksLikePdf = contentType.includes('application/pdf') || /\.pdf(\?|#|$)/i.test(url)
      if (looksLikePdf) {
        const buffer = await res.arrayBuffer()
        // Extract filename from Content-Disposition or URL path
        const cd = res.headers.get('content-disposition') ?? ''
        const cdName = cd.match(/filename[^;=\n]*=\s*((['"]).*?\2|[^;\n]*)/i)?.[1]?.replace(/^['"]|['"]$/g, '').trim()
        const urlName = url.split('/').pop()?.split('?')[0]?.replace(/%20/g, ' ') ?? 'document.pdf'
        const filename = cdName || (urlName.toLowerCase().endsWith('.pdf') ? urlName : urlName + '.pdf')
        const inferredTitle = filename.replace(/\.pdf$/i, '').replace(/[-_+]/g, ' ').trim() || 'Document'
        // Encode as base64 for client-side File construction
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        const base64 = btoa(binary)
        return NextResponse.json({ type: 'pdf', data: base64, filename, title: inferredTitle })
      }

      const body = await res.text()

      // RSS / Atom detection
      const looksXml = body.trimStart().startsWith('<?xml') || body.trimStart().startsWith('<rss') || body.trimStart().startsWith('<feed')
      const isRSS =
        contentType.includes('rss') || contentType.includes('atom') ||
        (contentType.includes('xml') && looksXml) ||
        (looksXml && /<rss|<feed/i.test(body.slice(0, 1000)))

      if (isRSS) {
        const { feedTitle, items } = parseRSSFeed(body)
        return NextResponse.json({ type: 'rss', feedTitle, items })
      }

      // Extract RSS/Atom autodiscovery links from HTML
      feedLinks = [...body.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/gi)]
        .map(m => {
          const href = m[0].match(/href="([^"]+)"/)?.[1]
          const linkTitle = m[0].match(/title="([^"]+)"/)?.[1]
          if (!href) return null
          // Resolve relative URLs
          let resolved = href
          try { resolved = new URL(href, url).href } catch {}
          return { url: resolved, title: linkTitle ? decodeEntities(linkTitle) : resolved }
        })
        .filter(Boolean) as { url: string; title: string }[]

      // If no autodiscovery tags, probe common feed paths
      if (feedLinks.length === 0) {
        const COMMON_FEED_PATHS = ['/rss', '/feed', '/rss.xml', '/feed.xml', '/atom.xml', '/index.xml', '/feed/rss', '/feeds/posts/default']
        let origin: string
        try { origin = new URL(url).origin } catch { origin = '' }
        if (origin) {
          const probes = await Promise.all(
            COMMON_FEED_PATHS.map(async (path) => {
              try {
                const probeUrl = origin + path
                const r = await fetch(probeUrl, {
                  headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml,application/atom+xml,application/xml,text/xml' },
                  redirect: 'follow',
                  signal: AbortSignal.timeout(5000),
                })
                if (!r.ok) return null
                const snippet = await r.text().then(t => t.slice(0, 500))
                if (/<rss|<feed|<\?xml/i.test(snippet)) {
                  return { url: probeUrl, title: path.slice(1) }
                }
              } catch {}
              return null
            })
          )
          feedLinks = probes.filter(Boolean) as { url: string; title: string }[]
        }
      }

      const meta = extractMeta(body)
      title = meta.title
      description = meta.description
      markdown = htmlToMarkdown(extractArticleBody(body))

      // If we got very little content, try Jina anyway
      if (markdown.length < 200) throw new Error('Insufficient content from direct fetch')
    } catch {
      // Fallback 1: Jina Reader — handles paywalls, JS rendering, bot blocks
      try {
        const jina = await fetchViaJina(url)
        title = jina.title
        markdown = jina.markdown
      } catch (jinaErr: any) {
        // Fallback 2: Wayback Machine — when Jina is rate-limited (429)
        if (jinaErr.message?.includes('jina:429') || jinaErr.message?.includes('jina:503')) {
          const wb = await fetchViaWayback(url)
          title = wb.title
          markdown = wb.markdown
        } else {
          throw jinaErr
        }
      }
    }

    return NextResponse.json({ type: 'webpage', title, description, markdown, ...(feedLinks.length ? { feedLinks } : {}) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
