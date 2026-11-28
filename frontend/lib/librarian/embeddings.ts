import { createHash } from 'crypto'

/**
 * Embeddings over the library, for "which of my books relates to this".
 *
 * One vector per book, which is a decision about the question rather than
 * about granularity — see the header of supabase/setup/80_librarian_tasks.sql.
 *
 * ── THE MODEL IS A CONSTANT HERE AND A COLUMN THERE ───────────────────────
 *
 * `EMBEDDING_MODEL` is what new rows are written with; `book_embeddings.model`
 * is what each existing row WAS written with, and `match_books` compares only
 * within one model. That split is what makes a model change survivable: the
 * constant moves, new rows use it, old rows stop being compared, and nothing
 * silently ranks 3-small against 3-large as though the numbers meant the same
 * thing. Changing this also needs a migration, because the column pins 1536.
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMS = 1536

/**
 * What a book is embedded ON, and why it is not the whole text.
 *
 * A librarian task asks what a book is ABOUT. Title and summary say that in
 * the author's own words; forty thousand words of body text says it too,
 * diluted by every aside in the book, and costs a hundred times more to
 * encode. Where there is no summary the opening is the best available
 * substitute, because an opening is the one part of a text reliably about the
 * whole of it.
 *
 * The returned `source` is recorded on the row so a later ranking can be read
 * back — "this matched on title+opening" is a different claim from "this
 * matched on title+summary", and without the label they are indistinguishable.
 */
export function embeddingSourceFor(book: {
  title: string
  summary?: string | null
  synopsis?: string | null
  content_type?: string | null
}, opening?: string | null): { text: string; source: string } {
  const blurb = (book.summary ?? book.synopsis ?? '').trim()
  const kind = (book.content_type ?? '').trim()
  if (blurb) {
    return {
      text: [book.title, kind, blurb].filter(Boolean).join('\n\n').slice(0, 8000),
      source: book.summary ? 'title+summary' : 'title+synopsis',
    }
  }
  const head = (opening ?? '').trim().slice(0, 4000)
  return {
    text: [book.title, kind, head].filter(Boolean).join('\n\n'),
    source: head ? 'title+opening' : 'title',
  }
}

/** Stable digest of the embedded text, so an unchanged book is not re-embedded. */
export function sourceHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 32)
}

export class EmbeddingUnavailable extends Error {
  constructor(detail: string) {
    super(`Embeddings are not available: ${detail}`)
    this.name = 'EmbeddingUnavailable'
  }
}

/**
 * Embed one or more strings.
 *
 * Batched, because the provider charges per token and not per request, and a
 * library backfill is the main caller — one request per book would turn a
 * hundred-book library into a hundred round trips for no saving.
 *
 * The dimension is CHECKED rather than trusted. A provider that quietly
 * returns a different width would otherwise fail at the insert with a
 * Postgres type error naming neither the model nor the book, and the whole
 * reason the column pins 1536 is to make that mismatch loud.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new EmbeddingUnavailable('OPENAI_API_KEY is not set')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new EmbeddingUnavailable(`${EMBEDDING_MODEL} returned ${res.status} ${body.slice(0, 200)}`)
  }
  const data = await res.json() as { data?: { embedding: number[]; index: number }[] }
  const rows = data.data ?? []
  if (rows.length !== texts.length) {
    throw new EmbeddingUnavailable(`asked for ${texts.length} vectors and got ${rows.length}`)
  }
  // Sorted by `index`, because the API does not promise input order.
  const ordered = [...rows].sort((a, b) => a.index - b.index).map(r => r.embedding)
  for (const v of ordered) {
    if (v.length !== EMBEDDING_DIMS) {
      throw new EmbeddingUnavailable(
        `${EMBEDDING_MODEL} returned ${v.length} dimensions, and book_embeddings pins ${EMBEDDING_DIMS}`)
    }
  }
  return ordered
}

/** pgvector's text input form. supabase-js sends it as a string. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}
