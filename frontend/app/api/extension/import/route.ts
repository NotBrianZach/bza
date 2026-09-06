import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const CHAR_PAGE_LENGTH  = 1800

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!jwt) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  // Create a per-request client scoped to this user's JWT
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { title?: string; content?: string; source_type?: string; source_url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, content, source_type, source_url } = body
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }
  if (content.length < 50) {
    return NextResponse.json({ error: 'Content too short' }, { status: 422 })
  }

  // ── Upload markdown to books bucket ───────────────────────────────────────
  const timestamp = Date.now()
  const safeName  = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
  const filePath  = `${user.id}/${timestamp}_${safeName}.md`

  const { error: uploadErr } = await supabase.storage
    .from('books')
    .upload(filePath, new Blob([content], { type: 'text/markdown' }))

  if (uploadErr) {
    return NextResponse.json({ error: 'Storage upload failed: ' + uploadErr.message }, { status: 500 })
  }

  // ── Create books record ───────────────────────────────────────────────────
  const totalPages = Math.ceil(content.length / CHAR_PAGE_LENGTH)

  // Derive content_type from source
  let contentType = 'non-fiction'
  if (source_type === 'youtube') contentType = 'non-fiction'
  else if (source_url?.includes('wikipedia.org')) contentType = 'wikipedia_article'
  else if (source_url?.includes('news.ycombinator.com')) contentType = 'non-fiction'

  const { data: book, error: dbErr } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      file_path: filePath,
      title: title.slice(0, 300),
      article_type: 'non-fiction',
      content_type: contentType,
      source_url: source_url ?? null,
      char_page_length: CHAR_PAGE_LENGTH,
      total_pages: totalPages,
    })
    .select()
    .single()

  if (dbErr) {
    // Clean up orphaned storage file
    await supabase.storage.from('books').remove([filePath])
    return NextResponse.json({ error: 'Database insert failed: ' + dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, bookId: book.id })
}
