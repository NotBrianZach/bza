/**
 * Inbound email webhook — receives parsed email from Mailgun/SendGrid/Cloudflare
 * and creates a book in the recipient's library.
 *
 * Mailgun: POST with multipart form (recipient, subject, body-html, body-plain)
 * SendGrid: POST with JSON array of email objects
 * Generic: POST JSON { to, subject, html, text }
 *
 * Set NEWSLETTER_WEBHOOK_SECRET to verify requests (Mailgun signing key, etc.)
 */
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const WEBHOOK_SECRET = process.env.NEWSLETTER_WEBHOOK_SECRET ?? ''

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, '**$1**')
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, '*$1*')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractToken(to: string): string | null {
  // e.g. "abc-123-...@aireadalong.com" or "Name <abc-123...@aireadalong.com>"
  // UUID v4: 8-4-4-4-12 hex chars with dashes = 36 chars total
  const match = to.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i)
  return match?.[1] ?? null
}

async function getUserIdByToken(token: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/newsletter_tokens?token=eq.${encodeURIComponent(token)}&select=user_id`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const rows: { user_id: string }[] = await res.json()
  return rows[0]?.user_id ?? null
}

async function createBook(userId: string, title: string, markdown: string, sourceFrom: string) {
  // Upload markdown to Supabase Storage books bucket
  const filename = `users/${userId}/newsletters/${Date.now()}_${title.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}.md`
  const encoder = new TextEncoder()
  const bytes = encoder.encode(markdown)

  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/books/${filename}`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'text/markdown',
        'x-upsert': 'true',
      },
      body: bytes,
    }
  )
  if (!uploadRes.ok) throw new Error(`Storage upload failed: ${uploadRes.status}`)

  const totalPages = Math.max(1, Math.ceil(markdown.length / 2000))

  const bookRes = await fetch(`${SUPABASE_URL}/rest/v1/books`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      title: title.trim().slice(0, 200) || 'Newsletter',
      file_path: filename,
      total_pages: totalPages,
      content_type: 'fiction',
      source_url: sourceFrom || null,
    }),
  })
  if (!bookRes.ok) throw new Error(`Book insert failed: ${bookRes.status}`)
  return (await bookRes.json())[0]
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get('x-webhook-secret') ?? req.headers.get('authorization') ?? ''
      const tokenParam = new URL(req.url).searchParams.get('secret') ?? ''
      if (authHeader !== WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}` && tokenParam !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const contentType = req.headers.get('content-type') ?? ''
    let to = '', subject = '', html = '', text = '', from = ''

    if (contentType.includes('application/json')) {
      // Generic JSON or SendGrid
      const body = await req.json()
      // SendGrid sends an array
      const item = Array.isArray(body) ? body[0] : body
      to      = item.to ?? item.envelope?.to ?? ''
      subject = item.subject ?? ''
      html    = item.html ?? item.body ?? ''
      text    = item.text ?? ''
      from    = item.from ?? item.envelope?.from ?? ''
    } else {
      // Mailgun multipart form
      const form = await req.formData()
      to      = String(form.get('recipient') ?? form.get('To') ?? '')
      subject = String(form.get('subject') ?? form.get('Subject') ?? '')
      html    = String(form.get('body-html') ?? '')
      text    = String(form.get('body-plain') ?? form.get('stripped-text') ?? '')
      from    = String(form.get('sender') ?? form.get('From') ?? '')
    }

    const token = extractToken(to)
    if (!token) return NextResponse.json({ error: 'Invalid recipient token' }, { status: 400 })

    const userId = await getUserIdByToken(token)
    if (!userId) return NextResponse.json({ error: 'Unknown token' }, { status: 404 })

    const markdown = html.trim().length > 100
      ? `# ${subject}\n\n*From: ${from}*\n\n${htmlToMarkdown(html)}`
      : `# ${subject}\n\n*From: ${from}*\n\n${text.trim()}`

    if (markdown.length < 50) return NextResponse.json({ error: 'Empty email body' }, { status: 400 })

    const book = await createBook(userId, subject || 'Newsletter', markdown, from)
    return NextResponse.json({ ok: true, bookId: book?.id })
  } catch (err: any) {
    console.error('Newsletter inbound error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 })
  }
}
