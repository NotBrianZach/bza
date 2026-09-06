import { supabase } from '../supabase'
import { ensureSession } from '../anonAuth'

const FUNCTIONS_BASE =
  (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) +
  '/functions/v1'

// ===========================================

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correct: number
  explanation: string
}

export type QuizFocusType = 'page' | 'book' | 'character' | 'custom'

export interface QuizFocus {
  type: QuizFocusType
  value?: string  // character name or custom topic
}

// SM-2 algorithm: computes new interval/ease given a quality score 0-5
function sm2(card: { interval_days: number; ease_factor: number; repetitions: number }, quality: number) {
  let { interval_days, ease_factor, repetitions } = card
  if (quality < 3) {
    repetitions = 0
    interval_days = 1
  } else {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)
    repetitions += 1
  }
  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const next_review_at = new Date(Date.now() + interval_days * 86400_000).toISOString()
  return { interval_days, ease_factor, repetitions, next_review_at }
}

export const quizQueries = {
  async generate(bookId: number, pageNum: number, focus: QuizFocus = { type: 'page' }): Promise<QuizQuestion[]> {
    await ensureSession()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Could not create session')

    const res = await fetch(`${FUNCTIONS_BASE}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ bookId, pageNum, focus }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to generate quiz')
    return json.questions as QuizQuestion[]
  },

  /** Save quiz questions as SRS flashcards for a book. */
  async saveCards(bookId: number, questions: QuizQuestion[]): Promise<void> {
    const userId = await ensureSession()
    if (!userId) return
    const rows = questions.map(q => ({
      user_id: userId,
      book_id: bookId,
      question: q.question,
      options: q.options,
      correct_index: q.correct,
      explanation: q.explanation ?? null,
    }))
    await supabase.from('quiz_cards').insert(rows)
  },

  /** Get all SRS cards due for review (optionally filtered by book). */
  async getDueCards(bookId?: number): Promise<import('@/types').QuizCard[]> {
    let q = supabase
      .from('quiz_cards')
      .select('*')
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(50)
    if (bookId) q = q.eq('book_id', bookId)
    const { data, error } = await q
    if (error) throw error
    return (data ?? []) as import('@/types').QuizCard[]
  },

  /** Count cards due today (for badge). */
  async countDueCards(): Promise<number> {
    const { count } = await supabase
      .from('quiz_cards')
      .select('*', { count: 'exact', head: true })
      .lte('next_review_at', new Date().toISOString())
    return count ?? 0
  },

  /** Submit a review result and apply SM-2 scheduling. quality: 0=wrong, 1=hard, 2=good, 3=easy */
  async reviewCard(cardId: number, card: { interval_days: number; ease_factor: number; repetitions: number }, quality: 0 | 1 | 2 | 3): Promise<void> {
    // Map 0-3 to SM-2 quality 0-5
    const q5 = quality === 0 ? 1 : quality === 1 ? 3 : quality === 2 ? 4 : 5
    const update = sm2(card, q5)
    await supabase
      .from('quiz_cards')
      .update({ ...update, last_reviewed_at: new Date().toISOString() })
      .eq('id', cardId)
  },

  /** Delete a card (user removes it from their deck). */
  async deleteCard(cardId: number): Promise<void> {
    await supabase.from('quiz_cards').delete().eq('id', cardId)
  },
}

// ===========================================
// Knowledge Graph Queries
