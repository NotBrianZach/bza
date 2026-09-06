import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

/** Export all user data as JSON: books, bookmarks, problem sets, flashcards */
export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [books, bookmarks, problemSets, flashcards, conversations] = await Promise.all([
    db.from('books').select('id, title, content_type, total_pages, summary, source_url, language, created_at').eq('user_id', userId).is('deleted_at', null).then(r => r.data ?? []),
    db.from('page_bookmarks').select('id, book_id, page_num, note, created_at').eq('user_id', userId).then(r => r.data ?? []),
    db.from('problem_sets').select('book_id, data, updated_at').eq('user_id', userId).then(r => r.data ?? []),
    db.from('flashcards').select('id, book_id, front, back, next_review_at, ease_factor, interval_days').eq('user_id', userId).then(r => r.data ?? []),
    db.from('conversations').select('id, book_id, title, created_at, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(50).then(r => r.data ?? []),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    books,
    bookmarks,
    problem_sets: problemSets,
    flashcards,
    conversations,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="aireadalong-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
