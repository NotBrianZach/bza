import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const [booksRes, progressRes, usageRes, streaksRes] = await Promise.all([
    db.from('books').select('id, title, content_type, total_pages, created_at').eq('user_id', userId).is('deleted_at', null),
    db.from('reading_progress').select('book_id, current_page, updated_at').eq('user_id', userId),
    db.from('api_usage').select('created_at, base_cost').eq('user_id', userId).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    db.from('reading_streaks').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const books = booksRes.data ?? []
  const progress = progressRes.data ?? []
  const usage = usageRes.data ?? []

  // Genre breakdown
  const genres: Record<string, number> = {}
  for (const b of books) { genres[b.content_type ?? 'other'] = (genres[b.content_type ?? 'other'] ?? 0) + 1 }

  // Pages read per book
  const pagesRead = progress.reduce((sum, p) => sum + (p.current_page ?? 0), 0)
  const totalPages = books.reduce((sum, b) => sum + (b.total_pages ?? 0), 0)

  // Daily activity (last 30 days from reading_progress updates)
  const daily: Record<string, number> = {}
  for (const p of progress) {
    if (!p.updated_at) continue
    const day = p.updated_at.slice(0, 10)
    daily[day] = (daily[day] ?? 0) + 1
  }

  // Cost this month
  const costThisMonth = usage.reduce((sum, u) => sum + (u.base_cost ?? 0) * 2, 0)

  // Active days in last 30
  const activeDays = Object.keys(daily).length

  return NextResponse.json({
    totalBooks: books.length,
    pagesRead,
    totalPages,
    genres,
    activeDays,
    costThisMonth: Math.round(costThisMonth * 100) / 100,
    streak: streaksRes.data?.current_streak ?? 0,
    longestStreak: streaksRes.data?.longest_streak ?? 0,
    daily,
    booksInProgress: progress.filter(p => {
      const book = books.find(b => b.id === p.book_id)
      return book && p.current_page < book.total_pages
    }).length,
  })
}
