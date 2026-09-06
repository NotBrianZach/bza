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

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?select=*&order=model.asc`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  )
  const data = await r.json()
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const email = await getAuthUser(req)
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, input_cost_per_1m, output_cost_per_1m, image_cost, markup_multiplier, active } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body: any = {}
  if (input_cost_per_1m !== undefined) body.input_cost_per_1m = input_cost_per_1m
  if (output_cost_per_1m !== undefined) body.output_cost_per_1m = output_cost_per_1m
  if (image_cost !== undefined) body.image_cost = image_cost
  if (markup_multiplier !== undefined) body.markup_multiplier = markup_multiplier
  if (active !== undefined) body.active = active

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await r.json()
  if (!r.ok) return NextResponse.json({ error: data }, { status: r.status })
  return NextResponse.json(data[0])
}

export async function POST(req: NextRequest) {
  const email = await getAuthUser(req)
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.model || !body.provider) return NextResponse.json({ error: 'model and provider required' }, { status: 400 })

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pricing_config`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await r.json()
  if (!r.ok) return NextResponse.json({ error: data }, { status: r.status })
  return NextResponse.json(data[0])
}
