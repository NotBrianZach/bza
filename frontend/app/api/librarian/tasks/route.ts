import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'
import { serverData } from '@/lib/supabaseSchema'
import { cronIsValid, nextRun } from '@/lib/librarian/cron'

/**
 * A reader's scheduled librarian tasks.
 *
 * GET    → their tasks, newest first, each with its last run
 * POST   → create one      { name, instructions, cron, timezone?, capabilities? }
 * PATCH  → update one      { id, ...fields }
 * DELETE → remove one      ?id=
 *
 * ── next_run_at IS COMPUTED HERE, NOT BY THE RUNNER ───────────────────────
 *
 * Whoever changes the schedule owns the consequence of the change. If the
 * runner derived it instead, a task edited at 3pm would keep its old firing
 * time until the next tick noticed, and an edit that fixes a schedule would
 * not take effect until the broken schedule fired once more. Computing it on
 * write also means an unsatisfiable expression is rejected at the moment
 * somebody is looking at the form.
 *
 * ── WHY THE CRON IS VALIDATED EVEN THOUGH THE COLUMN IS text ──────────────
 *
 * A bad expression is not a runtime error — it is a task that silently never
 * fires, which the user experiences as the feature being broken. The only
 * place to catch it is the write, so `cronIsValid` runs before the insert and
 * the message names the field that is wrong.
 */
export const dynamic = 'force-dynamic'

const CAPABILITIES = new Set(['library', 'similarity', 'web'])

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData, auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Every query filters on user_id explicitly.
 *
 * The service-role client bypasses RLS — see the note in
 * supabase/functions/generate-image and migration 81. The `.eq('user_id', …)`
 * on each statement IS the access control here, not a redundancy with the
 * policy, and removing one is a data leak rather than a tidy-up.
 */
function badTimezone(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-GB', { timeZone: tz }); return false } catch { return true }
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { data, error } = await db()
    .from('librarian_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data ?? []).map(t => t.id)
  let runs: any[] = []
  if (ids.length) {
    const r = await db()
      .from('librarian_task_runs')
      .select('id, task_id, started_at, finished_at, status, output, cited_book_ids, error')
      .eq('user_id', userId)
      .in('task_id', ids)
      .order('started_at', { ascending: false })
      .limit(50)
    runs = r.data ?? []
  }
  const latest = new Map<string, any>()
  for (const run of runs) if (!latest.has(run.task_id)) latest.set(run.task_id, run)

  return NextResponse.json({
    tasks: (data ?? []).map(t => ({ ...t, lastRun: latest.get(t.id) ?? null })),
  })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = String(body.name ?? '').trim()
  const instructions = String(body.instructions ?? '').trim()
  const cron = String(body.cron ?? '').trim()
  const timezone = String(body.timezone ?? 'UTC').trim() || 'UTC'
  const capabilities: string[] = Array.isArray(body.capabilities) && body.capabilities.length
    ? body.capabilities.map(String).filter((c: string) => CAPABILITIES.has(c))
    : ['library', 'similarity', 'web']

  if (!name) return NextResponse.json({ error: 'A name is needed' }, { status: 400 })
  if (!instructions) return NextResponse.json({ error: 'Instructions are needed' }, { status: 400 })
  const cronProblem = cronIsValid(cron)
  if (cronProblem) return NextResponse.json({ error: `Schedule: ${cronProblem}` }, { status: 400 })
  if (badTimezone(timezone)) return NextResponse.json({ error: `Unknown timezone "${timezone}"` }, { status: 400 })

  const next = nextRun(cron, new Date(), timezone)
  if (!next) {
    return NextResponse.json(
      { error: 'That schedule never comes round — check the day and month.' }, { status: 400 })
  }

  const { data, error } = await db()
    .from('librarian_tasks')
    .insert({
      user_id: userId, name, instructions, cron, timezone, capabilities,
      next_run_at: next.toISOString(),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return NextResponse.json({ error: 'A name is needed' }, { status: 400 })
    patch.name = n
  }
  if (body.instructions !== undefined) {
    const i = String(body.instructions).trim()
    if (!i) return NextResponse.json({ error: 'Instructions are needed' }, { status: 400 })
    patch.instructions = i
  }
  if (body.enabled !== undefined) patch.enabled = !!body.enabled
  if (body.capabilities !== undefined && Array.isArray(body.capabilities)) {
    patch.capabilities = body.capabilities.map(String).filter((c: string) => CAPABILITIES.has(c))
  }

  /*
   * The schedule is recomputed when EITHER the expression or the zone
   * changes, and when a task is re-enabled. The last one is easy to miss: a
   * task disabled for a month has a next_run_at a month in the past, so
   * without this it would fire immediately on being switched back on — which
   * reads as a bug rather than as a catch-up.
   */
  const cron = body.cron !== undefined ? String(body.cron).trim() : undefined
  const timezone = body.timezone !== undefined ? String(body.timezone).trim() : undefined
  if (cron !== undefined || timezone !== undefined || body.enabled === true) {
    const { data: current } = await db()
      .from('librarian_tasks').select('cron, timezone').eq('id', id).eq('user_id', userId).single()
    if (!current) return NextResponse.json({ error: 'No such task' }, { status: 404 })
    const useCron = cron ?? current.cron
    const useZone = timezone ?? current.timezone
    const problem = cronIsValid(useCron)
    if (problem) return NextResponse.json({ error: `Schedule: ${problem}` }, { status: 400 })
    if (badTimezone(useZone)) return NextResponse.json({ error: `Unknown timezone "${useZone}"` }, { status: 400 })
    const next = nextRun(useCron, new Date(), useZone)
    if (!next) return NextResponse.json({ error: 'That schedule never comes round.' }, { status: 400 })
    if (cron !== undefined) patch.cron = useCron
    if (timezone !== undefined) patch.timezone = useZone
    patch.next_run_at = next.toISOString()
  }

  const { data, error } = await db()
    .from('librarian_tasks').update(patch).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No such task' }, { status: 404 })
  return NextResponse.json({ task: data })
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await db()
    .from('librarian_tasks').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
