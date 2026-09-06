import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  let response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { data: book, error: insertError } = await admin
    .from('books')
    .insert({
      user_id: user.id,
      file_path: filePath,
      title,
      article_type: 'translation',
      content_type: 'translation',
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
