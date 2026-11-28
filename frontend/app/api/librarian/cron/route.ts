import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverData } from '@/lib/supabaseSchema'
import { nextRun } from '@/lib/librarian/cron'
import { runTask, type TaskRow } from '@/lib/librarian/run'

/**
 * Fire every librarian task that is due.
 *
 * POST /api/librarian/cron  with header `x-librarian-cron: <LIBRARIAN_CRON_SECRET>`
 *
 * ── THE SAME SHAPE AS /api/suggest/cron, ON PURPOSE ──────────────────────
 *
 * A shared secret in a header rather than a service-role key, invoked by a
 * host timer. That pattern already exists here and is already understood, and
 * a second scheduling mechanism would be a second thing to reason about when
 * something does not fire. There is no pg_cron on this project, so a timer
 * calling a route is not one option among several — it is the only one.
 *
 * ── next_run_at IS ADVANCED BEFORE THE WORK, NOT AFTER ───────────────────
 *
 * The claim is what makes this safe to call often and safe to call twice. A
 * run can take a minute; if the timer fires again inside that window and the
 * row still says "due", the task runs twice and the reader gets the same note
 * twice. Advancing first means the second tick sees nothing due.
 *
 * The cost is the honest one: a task whose run CRASHES the worker outright has
 * already moved its schedule and will not retry until tomorrow. That is the
 * right trade for a daily note — a duplicate is worse than a gap, because a
 * gap is invisible and a duplicate is wrong — and any failure the worker
 * survives is recorded as a `failed` run rather than lost.
 *
 * ── ONE AT A TIME, WITH A CEILING ────────────────────────────────────────
 *
 * Tasks run sequentially and `MAX_PER_TICK` bounds the batch. Each one is a
 * model call with tools, so a hundred due at midnight would otherwise be a
 * hundred concurrent agent loops inside one request. Whatever is left stays
 * due and goes on the next tick.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_PER_TICK = 5

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData, auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function authorised(req: NextRequest): boolean {
  const expected = process.env.LIBRARIAN_CRON_SECRET
  if (!expected) return false
  return (req.headers.get('x-librarian-cron') ?? '') === expected
}

export async function POST(req: NextRequest) {
  if (!process.env.LIBRARIAN_CRON_SECRET) {
    return NextResponse.json(
      { error: 'LIBRARIAN_CRON_SECRET is not set, so this endpoint is closed.' }, { status: 503 })
  }
  if (!authorised(req)) return NextResponse.json({ error: 'Not authorised' }, { status: 401 })

  const now = new Date()
  const { data: due, error } = await db()
    .from('librarian_tasks')
    .select('id, user_id, name, instructions, capabilities, cron, timezone')
    .eq('enabled', true)
    .lte('next_run_at', now.toISOString())
    .order('next_run_at', { ascending: true })
    .limit(MAX_PER_TICK)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due?.length) return NextResponse.json({ ran: 0, results: [] })

  const results: { id: string; name: string; status: string; error?: string }[] = []

  for (const task of due) {
    // Claim first. See the header on why this precedes the work.
    const next = nextRun(task.cron, now, task.timezone ?? 'UTC')
    await db().from('librarian_tasks').update({
      last_run_at: now.toISOString(),
      // A schedule that has stopped coming round disables itself rather than
      // being retried forever. `enabled: false` is visible in the UI; a null
      // next_run_at alone would just look like a task that never fires.
      next_run_at: next ? next.toISOString() : null,
      ...(next ? {} : { enabled: false }),
    }).eq('id', task.id)

    const { data: runRow } = await db().from('librarian_task_runs').insert({
      task_id: task.id, user_id: task.user_id, status: 'running',
    }).select('id').single()

    let outcome
    try {
      outcome = await runTask(task as TaskRow)
    } catch (e) {
      outcome = {
        status: 'failed' as const,
        citedBookIds: [] as number[],
        error: e instanceof Error ? e.message : 'unknown failure',
      }
    }

    if (runRow?.id) {
      await db().from('librarian_task_runs').update({
        finished_at: new Date().toISOString(),
        status: outcome.status,
        output: outcome.output ?? null,
        cited_book_ids: outcome.citedBookIds,
        error: outcome.error ?? null,
      }).eq('id', runRow.id)
    }

    results.push({ id: task.id, name: task.name, status: outcome.status, ...(outcome.error ? { error: outcome.error } : {}) })
  }

  return NextResponse.json({ ran: results.length, results })
}
