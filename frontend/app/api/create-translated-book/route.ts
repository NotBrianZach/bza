import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'

export async function POST(req: NextRequest) {
  let response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { ...serverData,
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { title, content, sourceBookId, prompt } = await req.json()
  if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ,
    { ...serverData },
  )

  const charPageLength = 420
  const totalPages = Math.ceil(content.length / charPageLength)
  const timestamp = Date.now()
  const slug = title.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 60)
  const filePath = `${user.id}/${timestamp}_${slug}.md`

  const { error: uploadError } = await admin.storage
    .from('books')
    .upload(filePath, new Blob([content], { type: 'text/markdown' }), { upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const summary = prompt
    ? `Transformed version of book #${sourceBookId}. Prompt: "${prompt}"`
    : `Translated version of book #${sourceBookId}.`

  /**
   * THIS ROUTE COULD NEVER INSERT A ROW.
   *
   * It wrote `content_type: 'translation'`, and 'translation' is not among the
   * twelve values `books_content_type_check` accepts. So every save of a
   * translated or transformed book was rejected by Postgres and came back as a
   * 500 — which is why the table contains zero of them, across 358 books.
   *
   * It is the same bug /api/extension/import had with `'non-fiction'`, where
   * three of four branches wrote a value the constraint forbids and the
   * feature "looked like it did nothing". Same cause, same shape, different
   * file.
   *
   * A translation is not a genre, so there was never a right value to hard-code
   * here: a translated Wikipedia article is still a Wikipedia article, and a
   * transformed textbook is still a textbook. The source book's own type is
   * the honest answer, and the route already receives `sourceBookId`.
   *
   * 'essay' when there is no source — the same neutral long-form default
   * lib/classifyImport uses, and legal, which is the property that matters.
   */
  let inheritedType = 'essay'
  if (sourceBookId) {
    const { data: source } = await admin
      .from('books')
      .select('content_type')
      .eq('id', sourceBookId)
      .maybeSingle()
    if (source?.content_type) inheritedType = source.content_type as string
  }

  const { data: book, error: insertError } = await admin
    .from('books')
    .insert({
      user_id: user.id,
      file_path: filePath,
      title,
      // Both columns, same value — `article_type` is a legacy mirror read only
      // as a fallback when `content_type` is null, and letting them disagree is
      // what left 70 rows saying two different things.
      article_type: inheritedType,
      content_type: inheritedType,
      char_page_length: charPageLength,
      total_pages: totalPages,
      summary,
      source_url: sourceBookId ? `/books/${sourceBookId}` : null,
    })
    .select()
    .single()

  if (insertError) {
    await admin.storage.from('books').remove([filePath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ bookId: book.id })
}
