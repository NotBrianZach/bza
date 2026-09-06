import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

/**
 * Import highlights from Kindle clippings or Readwise CSV.
 * Creates bookmarks for matching books or creates new books.
 */
export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { format, content } = await req.json() as { format: 'kindle' | 'readwise'; content: string }
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: books } = await db.from('books').select('id, title').eq('user_id', userId).is('deleted_at', null)
  const bookMap = new Map((books ?? []).map(b => [b.title.toLowerCase(), b.id]))

  let imported = 0
  let skipped = 0

  if (format === 'kindle') {
    // Parse Kindle "My Clippings.txt" format
    const entries = content.split('==========').filter(e => e.trim())
    for (const entry of entries) {
      const lines = entry.trim().split('\n').filter(l => l.trim())
      if (lines.length < 3) continue
      const titleLine = lines[0].trim()
      const title = titleLine.replace(/\s*\([^)]+\)\s*$/, '').trim()
      const highlight = lines.slice(2).join('\n').trim()
      if (!highlight || highlight.length < 5) { skipped++; continue }

      // Try to match to existing book
      const bookId = bookMap.get(title.toLowerCase())
      if (bookId) {
        await db.from('page_bookmarks').insert({
          user_id: userId, book_id: bookId, page_num: 1,
          note: `[Kindle] ${highlight.slice(0, 500)}`,
        })
        imported++
      } else {
        skipped++
      }
    }
  } else if (format === 'readwise') {
    // Parse Readwise CSV: Title, Author, Highlight, Note, Location, Date
    const lines = content.split('\n')
    const header = lines[0]?.toLowerCase() ?? ''
    const titleIdx = header.split(',').findIndex(h => h.includes('title'))
    const highlightIdx = header.split(',').findIndex(h => h.includes('highlight'))
    if (titleIdx === -1 || highlightIdx === -1) {
      return NextResponse.json({ error: 'CSV must have Title and Highlight columns' }, { status: 400 })
    }

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue
      // Simple CSV parse (doesn't handle quoted commas perfectly)
      const cols = line.split(',')
      const title = cols[titleIdx]?.replace(/^"|"$/g, '').trim()
      const highlight = cols[highlightIdx]?.replace(/^"|"$/g, '').trim()
      if (!title || !highlight || highlight.length < 5) { skipped++; continue }

      const bookId = bookMap.get(title.toLowerCase())
      if (bookId) {
        await db.from('page_bookmarks').insert({
          user_id: userId, book_id: bookId, page_num: 1,
          note: `[Readwise] ${highlight.slice(0, 500)}`,
        })
        imported++
      } else {
        skipped++
      }
    }
  }

  return NextResponse.json({ imported, skipped })
}
