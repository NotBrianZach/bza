import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromToken } from '@/lib/apiQuota'
import { serverData } from '@/lib/supabaseSchema'
import {
  EMBEDDING_MODEL, EmbeddingUnavailable, embed, embeddingSourceFor, sourceHash, toVectorLiteral,
} from '@/lib/librarian/embeddings'

/**
 * Embed the caller's library, so `search_library` has something to search.
 *
 * POST → { embedded, skipped, failed, total }
 *   body: { bookIds?: number[], force?: boolean, limit?: number }
 * GET  → { total, embedded, stale } — how much of the library is covered
 *
 * ── IT IS INCREMENTAL, AND THAT IS WHAT MAKES IT SAFE TO CALL OFTEN ───────
 *
 * Every row stores a digest of the text it was built from. A book whose title
 * and summary have not changed is skipped without an API call, so running
 * this nightly over a whole library costs nothing after the first pass, and
 * `force` exists for the one case the digest cannot see — a model change,
 * where the text is identical and the vector should not be.
 *
 * ── WHY A LIMIT, AND WHY IT DEFAULTS LOW ─────────────────────────────────
 *
 * A first run on a large library is the expensive one, and this is a request
 * handler with a wall clock. Batching a bounded number per call and reporting
 * what is left lets a caller drain it in several passes instead of discovering
 * the ceiling as a timeout. The GET tells you how many are outstanding.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_LIMIT = 40
/** Provider cap is larger, but a batch of texts this size is already one request. */
const BATCH = 16

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...serverData, auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * The opening of a book, for the summary-less case.
 *
 * Downloaded rather than stored: this is needed once per book per change, and
 * keeping a copy would duplicate the content that already lives in storage.
 * A failure is not fatal — `embeddingSourceFor` falls back to the title
 * alone, which is a weak embedding and still better than no row at all.
 */
async function openingOf(filePath: string | null): Promise<string | null> {
  if (!filePath || filePath === 'local') return null
  try {
    const { data } = await db().storage.from('books').download(filePath)
    if (!data) return null
    return (await data.text()).slice(0, 6000)
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const [books, rows] = await Promise.all([
    db().from('books').select('id').eq('user_id', userId).is('deleted_at', null),
    db().from('book_embeddings').select('book_id').eq('user_id', userId).eq('model', EMBEDDING_MODEL),
  ])
  const total = books.data?.length ?? 0
  const embedded = rows.data?.length ?? 0
  return NextResponse.json({ total, embedded, outstanding: Math.max(0, total - embedded), model: EMBEDDING_MODEL })
}

export async function POST(req: NextRequest) {
  const userId = await getUserFromToken(req.headers.get('authorization'))
  if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as
    { bookIds?: number[]; force?: boolean; limit?: number }
  const limit = Math.min(Math.max(body.limit ?? DEFAULT_LIMIT, 1), 200)

  let q = db().from('books')
    .select('id, title, summary, synopsis, content_type, file_path')
    .eq('user_id', userId)
    .is('deleted_at', null)
  if (body.bookIds?.length) q = q.in('id', body.bookIds)
  const { data: books, error } = await q.limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!books?.length) return NextResponse.json({ embedded: 0, skipped: 0, failed: 0, total: 0 })

  const { data: existing } = await db()
    .from('book_embeddings')
    .select('book_id, source_hash')
    .eq('user_id', userId)
    .eq('model', EMBEDDING_MODEL)
    .in('book_id', books.map(b => b.id))
  const known = new Map((existing ?? []).map(r => [r.book_id, r.source_hash]))

  const pending: { id: number; text: string; source: string; hash: string }[] = []
  let skipped = 0
  for (const book of books) {
    // The opening is only fetched when there is no blurb, so a library of
    // summarised books costs no downloads at all.
    const blurb = (book.summary ?? book.synopsis ?? '').trim()
    const opening = blurb ? null : await openingOf(book.file_path)
    const { text, source } = embeddingSourceFor(book, opening)
    const hash = sourceHash(text)
    if (!body.force && known.get(book.id) === hash) { skipped++; continue }
    pending.push({ id: book.id, text, source, hash })
  }

  let embedded = 0
  let failed = 0
  let unavailable: string | null = null
  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH)
    try {
      const vectors = await embed(chunk.map(c => c.text))
      const rows = chunk.map((c, j) => ({
        book_id: c.id,
        user_id: userId,
        model: EMBEDDING_MODEL,
        embedding: toVectorLiteral(vectors[j]),
        source: c.source,
        source_hash: c.hash,
        embedded_at: new Date().toISOString(),
      }))
      const { error: upErr } = await db()
        .from('book_embeddings').upsert(rows, { onConflict: 'book_id,model' })
      if (upErr) { failed += chunk.length; continue }
      embedded += chunk.length
    } catch (e) {
      failed += chunk.length
      /*
       * A missing key or a retired model is not a per-batch problem, so the
       * loop stops rather than making the same failing call for every
       * remaining chunk. Reported once, with the reason.
       */
      if (e instanceof EmbeddingUnavailable) { unavailable = e.message; break }
    }
  }

  return NextResponse.json({
    embedded, skipped, failed, total: books.length, model: EMBEDDING_MODEL,
    ...(unavailable ? { error: unavailable } : {}),
  })
}
