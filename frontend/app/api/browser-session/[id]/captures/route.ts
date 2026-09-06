import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'auth required' }, { status: 401 })
  const { data } = await (db().from('browser_extractions') as any)
    .select('id, mode, extracted, model, base_cost, region, image_sha256, created_at')
    .eq('session_id', params.id).eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ captures: data ?? [] })
}
