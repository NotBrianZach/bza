import { supabase } from '../supabase'
import { ensureSession } from '../anonAuth'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

export interface Flashcard {
  id: number
  user_id: string
  book_id: number
  front: string
  back: string
  source_text?: string
  page_num?: number
  topic_tag?: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_reviewed_at?: string
  created_at: string
}

// SM-2 algorithm: quality 0=again, 1=hard, 2=good, 3=easy
function sm2(
  card: Pick<Flashcard, 'interval_days' | 'ease_factor' | 'repetitions'>,
  quality: 0 | 1 | 2 | 3
) {
  const q5 = quality === 0 ? 1 : quality === 1 ? 3 : quality === 2 ? 4 : 5
  let { interval_days, ease_factor, repetitions } = card
  if (q5 < 3) {
    repetitions = 0
    interval_days = 1
  } else {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)
    repetitions += 1
  }
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - q5) * (0.08 + (5 - q5) * 0.02))
  const next_review_at = new Date(Date.now() + interval_days * 86_400_000).toISOString()
  return { interval_days, ease_factor: Math.round(ease_factor * 100) / 100, repetitions, next_review_at }
}

export const flashcardQueries = {
  /** Generate a flashcard from highlighted text via AI. */
  async generate(bookId: number, pageNum: number, sourceText: string, hint?: string): Promise<Flashcard> {
    await ensureSession()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Could not create session')

    const res = await fetch(`${FUNCTIONS_BASE}/generate-flashcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId, pageNum, sourceText, hint }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to generate flashcard')
    return json.card as Flashcard
  },

  /** Save a manually-written flashcard. */
  async create(bookId: number, front: string, back: string, topicTag?: string, pageNum?: number): Promise<Flashcard> {
    const userId = await ensureSession()
    if (!userId) throw new Error('Could not create session')
    const { data, error } = await supabase
      .from('flashcards')
      .insert({ user_id: userId, book_id: bookId, front, back, topic_tag: topicTag ?? null, page_num: pageNum ?? null })
      .select()
      .single()
    if (error) throw error
    return data as Flashcard
  },

  /** Get all flashcards for a book, ordered by topic then created_at. */
  async list(bookId: number): Promise<Flashcard[]> {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('book_id', bookId)
      .order('topic_tag', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Flashcard[]
  },

  /** Get cards due for review (next_review_at <= now), optionally for one book. */
  async getDue(bookId?: number): Promise<Flashcard[]> {
    let q = supabase
      .from('flashcards')
      .select('*')
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(50)
    if (bookId) q = q.eq('book_id', bookId)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as Flashcard[]
  },

  /** Count due flashcards (for badge on home page). */
  async countDue(): Promise<number> {
    const { count } = await supabase
      .from('flashcards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_at', new Date().toISOString())
    return count ?? 0
  },

  /** Submit a review result with SM-2 scheduling. quality: 0=again 1=hard 2=good 3=easy */
  async review(card: Flashcard, quality: 0 | 1 | 2 | 3): Promise<void> {
    const update = sm2(card, quality)
    const { error } = await supabase
      .from('flashcards')
      .update({ ...update, last_reviewed_at: new Date().toISOString() })
      .eq('id', card.id)
    if (error) throw error
  },

  /** Delete a flashcard. */
  async delete(id: number): Promise<void> {
    await supabase.from('flashcards').delete().eq('id', id)
  },

  /** Export all cards for a book as Anki-importable TSV (Front\tBack\tTags). */
  async exportTsv(bookId: number, bookTitle: string): Promise<void> {
    const cards = await flashcardQueries.list(bookId)
    if (cards.length === 0) return
    const tag = bookTitle.replace(/\s+/g, '_').replace(/[^\w-]/g, '').slice(0, 40)
    const rows = cards.map(c =>
      [c.front, c.back, c.topic_tag ? `${tag}::${c.topic_tag.replace(/\s+/g, '_')}` : tag]
        .map(s => s.replace(/\t/g, ' ').replace(/\n/g, '<br>'))
        .join('\t')
    )
    const tsv = '#separator:tab\n#html:true\n#notetype:Basic\n#deck:' + tag + '\n' + rows.join('\n')
    const blob = new Blob([tsv], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tag}_flashcards.txt`
    a.click()
    URL.revokeObjectURL(url)
  },
}

export interface QuizAttempt {
  book_id: number
  page_num?: number
  focus_type?: string
  focus_value?: string
  score: number
  total: number
  results: { question: string; topic: string; correct: boolean }[]
}

export const quizAttemptQueries = {
  /** Save a completed quiz attempt for tutor context. */
  async save(attempt: QuizAttempt): Promise<void> {
    const userId = await ensureSession()
    if (!userId) return
    await supabase.from('quiz_attempts').insert({ user_id: userId, ...attempt })
  },

  /** Get weak topics for this book (via RPC). */
  async getWeakTopics(bookId: number): Promise<{ topic: string; correct: number; total: number; accuracy: number }[]> {
    const userId = await ensureSession()
    if (!userId) return []
    const { data } = await supabase.rpc('get_weak_topics', {
      p_user_id: userId,
      p_book_id: bookId,
      p_limit: 5,
    })
    return (data ?? []) as any[]
  },
}
