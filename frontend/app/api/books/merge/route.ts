import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServerClient'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  let response = NextResponse.json({})
  const supabase = createSupabaseServerClient(req, () => response, (r) => { response = r })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bookIds, title } = await req.json()
  if (!Array.isArray(bookIds) || bookIds.length < 2) {
    return NextResponse.json({ error: 'Select at least 2 books to merge' }, { status: 400 })
  }

  // Fetch books in order
  const { data: books, error: fetchErr } = await adminSupabase
    .from('books')
    .select('*')
    .in('id', bookIds)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (fetchErr || !books?.length) {
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 })
  }

  // Download and concatenate content
  const contentParts: string[] = []
  for (const book of books) {
    const { data, error } = await adminSupabase.storage.from('books').download(book.file_path)
    if (error || !data) continue
    const text = await data.text()
    contentParts.push(text)
  }

  if (contentParts.length === 0) {
    return NextResponse.json({ error: 'No content found in selected books' }, { status: 400 })
  }

  const mergedContent = contentParts.join('\n\n---\n\n')
  const charPageLength = books[0].char_page_length || 420
  const totalPages = Math.ceil(mergedContent.length / charPageLength)
  const mergedTitle = title || books.map(b => b.title).join(' + ')

  // Upload merged content
  const timestamp = Date.now()
  const slug = mergedTitle.replace(/[^a-z0-9]+/gi, '_').toLowerCase().slice(0, 40)
  const filePath = `${user.id}/${timestamp}_${slug}.md`

  const { error: uploadErr } = await adminSupabase.storage
    .from('books')
    .upload(filePath, new Blob([mergedContent], { type: 'text/markdown' }), { contentType: 'text/markdown' })
  if (uploadErr) {
    return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 500 })
  }

  // Create merged book record
  const { data: newBook, error: bookErr } = await adminSupabase.from('books').insert({
    user_id: user.id,
    file_path: filePath,
    title: mergedTitle,
    content_type: books[0].content_type || 'reference',
    char_page_length: charPageLength,
    total_pages: totalPages,
  }).select().single()

  if (bookErr) {
    return NextResponse.json({ error: 'Failed to create book: ' + bookErr.message }, { status: 500 })
  }

  // Merge problem sets if any exist
  const { data: problemSets } = await adminSupabase
    .from('problem_sets')
    .select('data')
    .in('book_id', bookIds)
  if (problemSets?.length) {
    const mergedProblems = problemSets.flatMap((ps: any) => ps.data?.problems || [])
    const mergedEdges = problemSets.flatMap((ps: any) => ps.data?.edges || [])
    if (mergedProblems.length > 0) {
      await adminSupabase.from('problem_sets').upsert({
        user_id: user.id,
        book_id: newBook.id,
        data: { problems: mergedProblems, labels: [], labelMap: {}, spaces: {}, scratchpads: {}, edges: mergedEdges },
        updated_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ bookId: newBook.id, title: mergedTitle, totalPages, sourceBooks: books.length })
}