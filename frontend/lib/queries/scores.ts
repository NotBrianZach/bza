import { supabase } from '../supabase'
import type { ScoreBar } from '@/types'

const SCORE_BARS_KEY = 'bza-score-bars'
const SCORE_MODEL_KEY = 'bza-score-model'

export const SCORE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (fast & cheap)' },
  { value: 'gpt-4o',      label: 'GPT-4o (more nuanced)' },
]

export const DEFAULT_SCORE_BARS: ScoreBar[] = [
  {
    id: 'default-political',
    label: 'Political Lean',
    prompt: 'On a scale of 0–100, what is the political lean of this text? 0 = communist/far-left, 50 = centrist/neutral, 100 = capitalist/far-right. Base this strictly on economic and political ideas expressed or implied in the text.',
    leftLabel: 'Communist',
    rightLabel: 'Capitalist',
    enabled: true,
  },
]

export function getScoreBars(): ScoreBar[] {
  try {
    const stored = localStorage.getItem(SCORE_BARS_KEY)
    // null = never configured → return defaults; '[]' = user cleared all bars → return []
    return stored === null ? DEFAULT_SCORE_BARS : JSON.parse(stored)
  } catch { return DEFAULT_SCORE_BARS }
}

export function saveScoreBars(bars: ScoreBar[]): void {
  localStorage.setItem(SCORE_BARS_KEY, JSON.stringify(bars))
}

export function getScoreModel(): string {
  return localStorage.getItem(SCORE_MODEL_KEY) ?? 'gpt-4o-mini'
}

export function saveScoreModel(model: string): void {
  localStorage.setItem(SCORE_MODEL_KEY, model)
}

export async function maybeAutoScore(bookId: number, content: string): Promise<void> {
  if (typeof window === 'undefined') return
  const bars = getScoreBars().filter(b => b.enabled)
  if (!bars.length) return
  const model = getScoreModel()

  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
  fetch('/api/score-book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ bookId, content: content.slice(0, 3000), bars, model }),
  }).catch(() => {})
}
