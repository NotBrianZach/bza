import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'
import { classifyImport } from '@/lib/classifyImport'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const CHAR_PAGE_LENGTH  = 1800

// Mirrors books_content_type_check. Deliberately spelled out here rather than
// imported from components/upload/types.ts: that union is the *picker's*
// vocabulary and is missing 'chat_book', which the constraint allows. The
// database is the authority for what an insert will accept, so this list
// tracks the constraint.
const ALLOWED_CONTENT_TYPES = new Set([
  'fiction', 'textbook', 'academic_paper', 'math_textbook',
  'wikipedia_article', 'news_article', 'forum_thread', 'essay',
  'reference', 'biography', 'chat_book', 'manga',
])

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!jwt) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  // Create a per-request client scoped to this user's JWT
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ...serverData,
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

  /**
   * Derive content_type from the source, via the shared classifier.
   *
   * The rules used to live here as a chain of `includes()` tests, and a second
   * divergent copy lived in components/upload/UrlTab — so the same Hacker News
   * link became a `forum_thread` through the extension and a `fiction` through
   * the URL tab. lib/classifyImport is now the only place that decides, and it
   * matches hosts as suffixes of the parsed hostname rather than substrings of
   * the whole URL, so a page ABOUT Hacker News is no longer filed as a thread
   * on it.
   *
   * ALLOWED_CONTENT_TYPES is still checked below and still earns its place.
   * This route once wrote `'non-fiction'`, which is absent from
   * books_content_type_check, so three of its four branches produced an insert
   * Postgres rejected outright — YouTube captures, Hacker News captures and
   * the default — and only the wikipedia.org branch ever wrote a legal row.
   * That is why the capture extension looked like it did nothing for
   * everything else. The guard turns the next such typo into a named error
   * here instead of a 500 from the database.
   */
  const contentType = classifyImport({ sourceUrl: source_url, sourceType: source_type }) ?? 'essay'

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      {
        error:
          `Refusing to import: derived content_type '${contentType}' is not ` +
          `one of ${[...ALLOWED_CONTENT_TYPES].join(', ')}. The insert would ` +
          `violate books_content_type_check.`,
      },
      { status: 500 },
    )
  }

  const { data: book, error: dbErr } = await supabase
    .from('books')
    .insert({
      user_id: user.id,
      file_path: filePath,
      title: title.slice(0, 300),
      // Was `'non-fiction'`, which is the value the comment above describes as
      // never having been legal. It only survived because nothing reads this
      // column except as a fallback — but a legacy mirror that mirrors nothing
      // is just a second wrong answer waiting to be read.
      article_type: contentType,
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
