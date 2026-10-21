import { NextRequest, NextResponse } from 'next/server'
/**
 * The HN / Reddit / 4chan fetchers moved to lib/feedSources.ts so the
 * suggested feed's ingest can use the same ones. "Fetch HN's top stories as
 * posts" is one job with one right answer, unlike the RSS parsing, where the
 * two consumers genuinely want different things — see the header of
 * lib/suggest/parse.ts for why that one is duplicated on purpose.
 */
import {
  fetch4chan, fetchHN, fetchReddit, redditFetch, UA, type FeedPost,
} from '@/lib/feedSources'

export type { FeedPost }


// ─── 4chan thread ──────────────────────────────────────────────────────────────

async function fetch4chanThread(board: string, threadId: string): Promise<string> {
  const res = await fetch(`https://a.4cdn.org/${board}/thread/${threadId}.json`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json',
      'Referer': `https://boards.4chan.org/${board}/thread/${threadId}`,
    },
  })
  if (!res.ok) throw new Error(`4chan thread API error: ${res.status}`)
  const data = await res.json()
  const posts: any[] = data.posts ?? []
  if (!posts.length) throw new Error('Thread not found or empty')

  const op = posts[0]
  const threadTitle = op.sub
    ? op.sub.replace(/<[^>]+>/g, '')
    : (op.com ?? '').replace(/<[^>]+>/g, '').slice(0, 80) || `Thread #${op.no}`

  const threadUrl = `https://boards.4chan.org/${board}/thread/${op.no}`

  function decodePost(com: string): string {
    return com
      // Quote links >>12345 → simple fragment so BookReader can intercept them in-reader
      .replace(/<a[^>]*class="quotelink"[^>]*>&gt;&gt;(\d+)<\/a>/g, '[>>$1](#p$1)')
      // Greentext
      .replace(/<span[^>]*class="quote"[^>]*>([^<]*)<\/span>/g, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()
  }

  const lines: string[] = [
    `# ${threadTitle}`,
    '',
    `**/${board}/ · Thread #${op.no}** · [View on 4chan](${threadUrl})`,
    '',
  ]

  for (const post of posts) {
    const text = post.com ? decodePost(post.com) : ''
    const hasImage = post.tim && post.ext

    if (!text && !hasImage) continue

    // Plain text post number — no link needed since >>quotes navigate in-reader
    lines.push(`**${post.name ?? 'Anonymous'} No.${post.no}**`)
    lines.push('')

    if (hasImage) {
      const imgUrl = `https://i.4cdn.org/${board}/${post.tim}${post.ext}`
      const isVideo = ['.webm', '.mp4'].includes(post.ext)
      if (isVideo) {
        // Rendered as a clickable link since video can't embed in markdown
        lines.push(`[▶ Video: ${post.tim}${post.ext}](${imgUrl})`)
      } else {
        // Use only the numeric timestamp as alt text — filenames can contain ()
        // which breaks markdown image syntax
        lines.push(`![${post.tim}](${imgUrl})`)
      }
      lines.push('')
    }

    if (text) lines.push(text, '')
    lines.push('---', '')
  }

  return lines.join('\n')
}

// ─── Reddit comments ──────────────────────────────────────────────────────────

async function fetchRedditComments(subreddit: string, postId: string): Promise<string> {
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?raw_json=1&depth=2&limit=50`
  const res = await redditFetch(url)
  if (!res.ok) throw new Error(`Reddit comments API error: ${res.status}`)
  const data = await res.json()

  const postData = data[0]?.data?.children?.[0]?.data
  const comments: any[] = data[1]?.data?.children ?? []

  const title = postData?.title ?? ''
  const selftext = postData?.selftext ?? ''
  const postUrl = postData ? `https://www.reddit.com${postData.permalink}` : ''

  const lines: string[] = [
    `## Reddit Discussion`,
    '',
    postUrl ? `[View on Reddit](${postUrl})` : '',
    '',
  ]

  if (selftext && selftext !== '[deleted]' && selftext !== '[removed]') {
    lines.push(selftext, '')
  }

  lines.push('---', '')

  for (const child of comments) {
    if (child.kind !== 't1') continue
    const c = child.data
    if (!c.body || c.body === '[deleted]' || c.body === '[removed]') continue
    lines.push(`**u/${c.author}** · ↑${c.score ?? 0}`, '')
    lines.push(c.body, '')

    // One level of replies
    const replies: any[] = c.replies?.data?.children ?? []
    for (const r of replies.slice(0, 3)) {
      if (r.kind !== 't1') continue
      const rc = r.data
      if (!rc.body || rc.body === '[deleted]' || rc.body === '[removed]') continue
      lines.push(`> **u/${rc.author}** · ↑${rc.score ?? 0}`, '')
      lines.push(`> ${rc.body.replace(/\n/g, '\n> ')}`, '')
    }

    lines.push('---', '')
  }

  return lines.filter(l => l !== undefined).join('\n')
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? ''
  const sub = searchParams.get('sub') ?? ''
  const sort = searchParams.get('sort') ?? 'hot'
  const board = searchParams.get('board') ?? ''
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '30'))

  const thread = searchParams.get('thread') ?? ''

  try {
    if (type === 'hn') {
      return NextResponse.json({ posts: await fetchHN(limit) })
    }
    if (type === 'reddit' && sub) {
      return NextResponse.json({ posts: await fetchReddit(sub, sort, limit) })
    }
    if (type === '4chan' && board) {
      return NextResponse.json({ posts: await fetch4chan(board, limit) })
    }
    if (type === '4chan-thread' && board && thread) {
      // no-store: a truncated/failed thread body must not be cached at the edge
      return NextResponse.json(
        { markdown: await fetch4chanThread(board, thread) },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (type === 'reddit-comments' && sub && thread) {
      return NextResponse.json(
        { markdown: await fetchRedditComments(sub, thread) },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    return NextResponse.json({ error: 'Unknown feed type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to fetch feed' }, { status: 500 })
  }
}