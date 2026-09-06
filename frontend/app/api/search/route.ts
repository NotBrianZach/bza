import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

/** Search across all books using Postgres full-text search + fallback to search_text */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Full-text search on title + search_text
  const tsQuery = q.split(/\s+/).filter(w => w.length >= 2).map(w => w + ':*').join(' & ')

  const { data: ftsResults } = await supabase
    .from('books')
    .select('id, title, search_text, char_page_length')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .textSearch('search_text', tsQuery, { config: 'english' })
    .limit(20)

  // Also do a simple ILIKE fallback for exact substring matches
  const { data: ilikeResults } = await supabase
    .from('books')
    .select('id, title, search_text, char_page_length')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .ilike('search_text', `%${q}%`)
    .limit(20)

  // Merge and deduplicate
  const seen = new Set<number>()
  const allBooks = [...(ftsResults ?? []), ...(ilikeResults ?? [])].filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  const results: Array<{ bookId: number; bookTitle: string; page: number; snippet: string }> = []

  for (const book of allBooks.slice(0, 15)) {
    if (!book.search_text) continue
    const text = book.search_text
    const cpl = book.char_page_length ?? 420
    const qLower = q.toLowerCase()

    let idx = 0
    while (idx < text.length && results.length < 30) {
      const pos = text.toLowerCase().indexOf(qLower, idx)
      if (pos === -1) break
      const page = Math.floor(pos / cpl) + 1
      const snippetStart = Math.max(0, pos - 50)
      const snippetEnd = Math.min(text.length, pos + q.length + 50)
      const snippet = (snippetStart > 0 ? '…' : '') + text.substring(snippetStart, snippetEnd).replace(/\n/g, ' ') + (snippetEnd < text.length ? '…' : '')
      results.push({ bookId: book.id, bookTitle: book.title, page, snippet })
      idx = pos + q.length
    }
  }

  return NextResponse.json({ results: results.slice(0, 30) })
}
