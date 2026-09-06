import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'poinkcompany@gmail.com'

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => res.cookies.set(name, value, options)) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

export async function GET(req: NextRequest) {
  const email = await getAuthUser(req)
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  // Total usage this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [usageRes, usersRes, booksRes] = await Promise.all([
    fetch(`${base}/rest/v1/api_usage?select=base_cost,charged_cost,model,timestamp&timestamp=gte.${monthStart}`, { headers }),
    fetch(`${base}/rest/v1/profiles?select=id,email,tier,created_at`, { headers }),
    fetch(`${base}/rest/v1/books?select=id,user_id,created_at&is.deleted_at=null&created_at=gte.${monthStart}`, { headers }),
  ])

  const [usage, users, books] = await Promise.all([
    usageRes.json(),
    usersRes.json(),
    booksRes.json(),
  ])

  // Aggregate usage by model
  const byModel: Record<string, { calls: number; base_cost: number; charged_cost: number }> = {}
  let totalBase = 0, totalCharged = 0
  if (Array.isArray(usage)) {
    for (const u of usage) {
      const m = u.model || 'unknown'
      if (!byModel[m]) byModel[m] = { calls: 0, base_cost: 0, charged_cost: 0 }
      byModel[m].calls++
      byModel[m].base_cost += Number(u.base_cost) || 0
      byModel[m].charged_cost += Number(u.charged_cost) || 0
      totalBase += Number(u.base_cost) || 0
      totalCharged += Number(u.charged_cost) || 0
    }
  }

  return NextResponse.json({
    month: monthStart,
    total_api_calls: Array.isArray(usage) ? usage.length : 0,
    total_base_cost: totalBase,
    total_charged_cost: totalCharged,
    margin: totalBase > 0 ? ((totalCharged - totalBase) / totalBase * 100).toFixed(1) : null,
    by_model: Object.entries(byModel).map(([model, v]) => ({ model, ...v })),
    total_users: Array.isArray(users) ? users.length : 0,
    users_by_tier: Array.isArray(users) ? users.reduce((acc: any, u: any) => {
      acc[u.tier || 'free'] = (acc[u.tier || 'free'] || 0) + 1; return acc
    }, {}) : {},
    books_added_this_month: Array.isArray(books) ? books.length : 0,
  })
}
