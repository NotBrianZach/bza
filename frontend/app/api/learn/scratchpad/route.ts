import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/apiQuota'
import { getOntology, RATIONAL_EXPRESSIONS } from '@/lib/concepts/ontology'
import { loadScratchpad, saveScratchpad } from '@/lib/concepts/store'

/**
 * The practice scratchpad: one working buffer per subject.
 *
 * GET  /api/learn/scratchpad?subject=<id>
 * PUT  /api/learn/scratchpad { subject, content }
 *
 * ── Why the subject is validated rather than trusted ──────────────────────
 *
 * `subject_id` is a text column and not a foreign key — the ontology is code,
 * not data — so nothing in the database stops a client writing a buffer under
 * a subject that does not exist. That would be a row nobody could ever read
 * back through the UI, which is the quiet kind of data loss: the write
 * succeeds, the user's work is gone, and no error is raised anywhere. So an
 * unknown subject is a 404 here, the same as on /api/learn/session.
 *
 * ── Why PUT and not PATCH ─────────────────────────────────────────────────
 *
 * The client holds the whole buffer in a textarea and sends the whole buffer.
 * There is no partial update to express, and offering one would invite a
 * concurrent-edit story this does not have — two tabs editing one scratchpad
 * is last-write-wins, which is what a scratch buffer should be.
 */

export const dynamic = 'force-dynamic'

/**
 * A ceiling on the buffer.
 *
 * Not a silent truncation: over the limit is a 413 and the client keeps its
 * text. Truncating somebody's working notes to fit a column would be worse
 * than refusing, and refusing is recoverable.
 */
const MAX_CHARS = 200_000

function resolveSubject(raw: string | null | undefined) {
  const id = (raw ?? '').trim()
  if (!id) return RATIONAL_EXPRESSIONS.subject.id
  return getOntology(id) ? id : null
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const subject = resolveSubject(req.nextUrl.searchParams.get('subject'))
  if (!subject) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })

  try {
    return NextResponse.json({ subject, content: await loadScratchpad(userId, subject) })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not load the scratchpad' },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => null) as { subject?: string; content?: string } | null
  if (typeof body?.content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }
  const subject = resolveSubject(body.subject)
  if (!subject) return NextResponse.json({ error: 'Unknown subject' }, { status: 404 })

  if (body.content.length > MAX_CHARS) {
    return NextResponse.json({
      error: `the scratchpad is limited to ${MAX_CHARS.toLocaleString()} characters and nothing was saved — your text is still in the editor`,
    }, { status: 413 })
  }

  try {
    await saveScratchpad(userId, subject, body.content)
    return NextResponse.json({ saved: true, length: body.content.length })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'could not save the scratchpad' },
      { status: 500 },
    )
  }
}
