import { NextRequest, NextResponse } from 'next/server'

// Reddit requires a descriptive bot UA — browser UAs get 403'd server-side
const REDDIT_UA = 'bza-reader/1.0 (read-along app; +https://aireadalong.com)'
// Generic UA for non-Reddit fetches
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function redditFetch(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': REDDIT_UA, 'Accept': 'application/json' },
    cache: 'no-store',
  })
  // Retry once on 429/5xx/403
  if (!res.ok && attempt === 0 && (res.status === 429 || res.status >= 500 || res.status === 403)) {
    await new Promise(r => setTimeout(r, 800))
    return redditFetch(url, 1)
  }
  return res
}

export interface FeedPost {
  id: string
  title: string
  url: string          // link to the actual article/thread
  commentsUrl?: string // link to discussion thread
  score?: number
  numComments?: number
  author?: string
  date?: string
  body?: string        // OP body text (for 4chan/reddit self-posts)
  source: string       // 'hn' | 'reddit' | '4chan' | 'rss'
  subreddit?: string
  board?: string
  thumbnail?: string
}

// ─── Hacker News ─────────────────────────────────────────────────────────────

async function fetchHN(limit = 30): Promise<FeedPost[]> {
  const ids: number[] = await fetch(
    'https://hacker-news.firebaseio.com/v0/topstories.json'
  ).then(r => r.json())

  const top = ids.slice(0, limit)
  const stories = await Promise.all(
    top.map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
        .catch(() => null)
    )
  )

  return stories
    .filter(Boolean)
    .filter(s => s.type === 'story' && s.title)
    .map(s => ({
      id: String(s.id),
      title: s.title,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      commentsUrl: `https://news.ycombinator.com/item?id=${s.id}`,
      score: s.score,
      numComments: s.descendants,
      author: s.by,
      date: s.time ? new Date(s.time * 1000).toISOString() : undefined,
      body: s.text ?? undefined,
      source: 'hn',
    }))
}

// ─── Reddit ───────────────────────────────────────────────────────────────────

async function fetchReddit(subreddit: string, sort: string, limit = 30): Promise<FeedPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`
  const res = await redditFetch(url)
  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`)
  const json = await res.json()
  const posts = json?.data?.children ?? []

  return posts
    .filter((c: any) => c.kind === 't3')
    .map((c: any) => {
      const p = c.data
      const isExternal = !p.is_self && p.url && !p.url.includes('reddit.com')
      return {
        id: p.id,
        title: p.title,
        url: isExternal ? p.url : `https://www.reddit.com${p.permalink}`,
        commentsUrl: `https://www.reddit.com${p.permalink}`,
        score: p.score,
        numComments: p.num_comments,
        author: p.author,
        date: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : undefined,
        body: p.selftext || undefined,
        source: 'reddit',
        subreddit: p.subreddit,
        thumbnail: p.thumbnail && !['self', 'default', 'nsfw', 'spoiler', ''].includes(p.thumbnail) ? p.thumbnail : undefined,
      }
    })
}

// ─── 4chan ─────────────────────────────────────────────────────────────────────

async function fetch4chan(board: string, limit = 30): Promise<FeedPost[]> {
  const res = await fetch(`https://a.4cdn.org/${board}/catalog.json`, {
    headers: {
      'User-Agent': UA,
      'Accept': 'application/json',
      'Referer': `https://boards.4chan.org/${board}/`,
    },
  })
  if (!res.ok) throw new Error(`4chan API error: ${res.status}`)
  const pages: any[] = await res.json()

  const threads: any[] = pages.flatMap(p => p.threads ?? [])
  return threads
    .filter(t => t.replies > 0)
    .sort((a, b) => b.replies - a.replies)
    .slice(0, limit)
    .map(t => ({
      id: String(t.no),
      title: t.sub
        ? t.sub.replace(/<[^>]+>/g, '').slice(0, 120)
        : (t.com ?? '').replace(/<[^>]+>/g, '').slice(0, 80) || `Thread #${t.no}`,
      url: `https://boards.4chan.org/${board}/thread/${t.no}`,
      commentsUrl: `https://boards.4chan.org/${board}/thread/${t.no}`,
      score: undefined,
      numComments: t.replies,
      author: t.name ?? 'Anonymous',
      date: t.time ? new Date(t.time * 1000).toISOString() : undefined,
      body: t.com ? t.com.replace(/<[^>]+>/g, '').slice(0, 300) : undefined,
      source: '4chan',
      board,
      thumbnail: t.tim && t.ext ? `https://i.4cdn.org/${board}/${t.tim}s.jpg` : undefined,
    }))
}

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