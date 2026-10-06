/**
 * Passage offerings — the reader's own library.
 *
 * The one medium here with no external provider and no rate limit, and the one
 * that makes this section part of the product rather than a toy bolted to it.
 * This is a reading companion; a highlight from the book you are actually in the
 * middle of is the most available offering any user has, and answering a painting
 * with a sentence you read this morning is the game working as intended.
 *
 * Pages are derived the same way the rest of the app derives them — character
 * offset over `books.char_page_length` — so a passage offering deep-links to the
 * page it came from and the reader can go stand in the original context.
 *
 * Server-only: it needs the service-role client and a user id, and a passage is
 * private to the person whose library it came from.
 */

import { createClient } from '@supabase/supabase-js'
import type { Offering } from '@/lib/correlate/types'
import { dbSchema } from '../supabaseSchema'

const DEFAULT_PAGE_CHARS = 420
/** Enough to be a real passage, short enough to read on a card. */
const EXCERPT_CHARS = 320

// In its own function so the annotation carries the schema — see the note in
// lib/apiQuota.ts. `ReturnType<typeof createClient>` would mean public.
function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { ...dbSchema },
  )
}

let _db: ReturnType<typeof makeDb> | null = null
function db() {
  if (!_db) _db = makeDb()
  return _db
}

/** `passage:<bookId>:<charOffset>` — stable, and enough to re-fetch the text. */
function passageId(bookId: number, offset: number): string {
  return `passage:${bookId}:${offset}`
}

function parsePassageId(id: string): { bookId: number; offset: number } | null {
  const m = /^passage:(\d+):(\d+)$/.exec(id)
  if (!m) return null
  return { bookId: Number(m[1]), offset: Number(m[2]) }
}

function excerptAround(text: string, offset: number): { body: string; start: number } {
  // Snap to a sentence boundary where one is close by, so a passage does not
  // start mid-word. Falls back to the raw offset rather than hunting far for a
  // full stop that may not exist in this kind of text.
  const windowStart = Math.max(0, offset - 40)
  const boundary = text.slice(windowStart, offset + 1).search(/[.!?]\s+\S/)
  const start = boundary === -1 ? offset : windowStart + boundary + 2

  const raw = text.slice(start, start + EXCERPT_CHARS).replace(/\s+/g, ' ').trim()
  const suffix = start + EXCERPT_CHARS < text.length ? '…' : ''
  return { body: (start > 0 ? '…' : '') + raw + suffix, start }
}

function toOffering(
  book: { id: number; title: string; char_page_length: number | null },
  text: string,
  offset: number,
): Offering {
  const { body, start } = excerptAround(text, offset)
  const cpl = book.char_page_length ?? DEFAULT_PAGE_CHARS
  const page = Math.floor(start / cpl) + 1
  return {
    medium: 'passage',
    id: passageId(book.id, start),
    title: book.title,
    attribution: null,
    framing: 'The whole passage',
    perceptible: { kind: 'text', body },
    sourceUrl: `/books/${book.id}?page=${page}`,
    origin: 'library',
    meta: { book: book.title, bookId: book.id, page },
  }
}

/**
 * Find passages in this reader's books.
 *
 * Mirrors /api/search: full-text over `search_text` with an ILIKE fallback,
 * because FTS misses substrings inside words and a reader searching for half a
 * remembered phrase expects it to hit anyway.
 */
export async function searchPassages(
  userId: string,
  q: string,
  limit = 20,
): Promise<Offering[]> {
  const term = q.trim()
  if (term.length < 2) return []

  const supabase = db()
  const tsQuery = term.split(/\s+/).filter(w => w.length >= 2).map(w => `${w}:*`).join(' & ')

  const select = 'id, title, search_text, char_page_length'
  const [fts, ilike] = await Promise.all([
    tsQuery
      ? (supabase.from('books').select(select) as any)
          .eq('user_id', userId).is('deleted_at', null)
          .textSearch('search_text', tsQuery, { config: 'english' }).limit(12)
      : Promise.resolve({ data: [] }),
    (supabase.from('books').select(select) as any)
      .eq('user_id', userId).is('deleted_at', null)
      .ilike('search_text', `%${term}%`).limit(12),
  ])

  const seen = new Set<number>()
  const books = [...((fts as any).data ?? []), ...((ilike as any).data ?? [])].filter((b: any) => {
    if (!b?.search_text || seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  const offerings: Offering[] = []
  const needle = term.toLowerCase()

  for (const book of books) {
    const text: string = book.search_text
    const haystack = text.toLowerCase()
    let from = 0
    // At most three hits per book, so one long book cannot fill the whole picker.
    let perBook = 0
    while (perBook < 3 && offerings.length < limit) {
      const pos = haystack.indexOf(needle, from)
      if (pos === -1) break
      offerings.push(toOffering(book, text, pos))
      from = pos + needle.length
      perBook++
    }
    if (offerings.length >= limit) break
  }

  return offerings
}

/** Re-fetch one passage by id, so the server never trusts a client-supplied body. */
export async function lookupPassage(userId: string, id: string): Promise<Offering | null> {
  const parsed = parsePassageId(id)
  if (!parsed) return null

  const { data } = await ((db().from('books') as any)
    .select('id, title, search_text, char_page_length')
    .eq('id', parsed.bookId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle() as any)

  if (!data?.search_text) return null
  return toOffering(data, data.search_text, parsed.offset)
}

/**
 * Resolve an interpreter's passage query against this reader's library.
 *
 * Note what this means: the interpreter cannot reply with a passage from a book
 * the player has never read. That is a feature — the reply has to come from
 * somewhere the player can actually go and stand.
 */
export async function resolvePassage(
  userId: string,
  query: string,
  exclude: string[] = [],
): Promise<Offering | null> {
  const results = await searchPassages(userId, query, 10)
  const excluded = new Set(exclude)
  return results.find(o => !excluded.has(o.id)) ?? null
}
