'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QuizCard } from '@/types'
import { quizQueries } from '@/lib/queries'
import { ensureSession } from '@/lib/anonAuth'
import { track } from '@/lib/analytics'
import { GraduationCap, CheckCircle, XCircle, Trash2, ArrowLeft, BookOpen } from 'lucide-react'

type ReviewQuality = 0 | 1 | 2 | 3

const QUALITY_LABELS: { q: ReviewQuality; label: string; color: string }[] = [
  { q: 0, label: 'Again',  color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-200' },
  { q: 1, label: 'Hard',   color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-200' },
  { q: 2, label: 'Good',   color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200' },
  { q: 3, label: 'Easy',   color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200' },
]

export default function QuizPage() {
  const router = useRouter()
  const [cards, setCards] = useState<QuizCard[]>([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [reviewed, setReviewed] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      await ensureSession()
      try {
        const due = await quizQueries.getDueCards()
        setCards(due)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [router])

  const card = cards[idx]

  const handleAnswer = (optIdx: number) => {
    if (revealed) return
    setSelected(optIdx)
    setRevealed(true)
  }

  const handleRating = useCallback(async (quality: ReviewQuality) => {
    if (!card) return
    const wasCorrect = selected === card.correct_index
    if (wasCorrect) setCorrect(c => c + 1)
    setReviewed(r => r + 1)
    track('flashcard_reviewed', { quality, was_correct: wasCorrect })
    await quizQueries.reviewCard(card.id, {
      interval_days: card.interval_days,
      ease_factor: card.ease_factor,
      repetitions: card.repetitions,
    }, quality)
    if (idx + 1 >= cards.length) {
      setDone(true)
    } else {
      setIdx(i => i + 1)
      setRevealed(false)
      setSelected(null)
    }
  }, [card, idx, cards.length, selected])

  const handleDelete = async () => {
    if (!card) return
    await quizQueries.deleteCard(card.id)
    const next = cards.filter((_, i) => i !== idx)
    if (next.length === 0) { setDone(true); return }
    setCards(next)
    setIdx(Math.min(idx, next.length - 1))
    setRevealed(false)
    setSelected(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="spinner" />
      </div>
    )
  }

  if (done || cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/40 mb-5">
            <GraduationCap size={32} className="text-green-600 dark:text-green-400" />
          </div>
          {done ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session complete!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {correct}/{reviewed} correct · {cards.length} cards reviewed
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Your next review is scheduled automatically.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">All caught up!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                No cards due for review right now. Generate a quiz inside a book and save the questions to build your deck.
              </p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Link href='/' className="btn btn-secondary flex items-center gap-2">
              <ArrowLeft size={16} /> Library
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = selected === card.correct_index

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href='/' className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <ArrowLeft size={14} /> Library
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {idx + 1} / {cards.length}
          </span>
          <button
            onClick={handleDelete}
            title="Remove from deck"
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-8 overflow-hidden">
          <div
            className="h-1.5 bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${(idx / cards.length) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-sm">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5 leading-relaxed">
            {card.question}
          </p>

          <div className="space-y-2">
            {card.options.map((opt, oi) => {
              let cls = 'w-full text-left px-4 py-3 rounded-xl text-sm border transition-colors '
              if (!revealed) {
                cls += 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
              } else if (oi === card.correct_index) {
                cls += 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'
              } else if (oi === selected) {
                cls += 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200'
              } else {
                cls += 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-50'
              }

              return (
                <button key={oi} className={cls} onClick={() => handleAnswer(oi)}>
                  <div className="flex items-start gap-3">
                    <span className="flex-1">{opt}</span>
                    {revealed && oi === card.correct_index && <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />}
                    {revealed && oi === selected && oi !== card.correct_index && <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              )
            })}
          </div>

          {revealed && card.explanation && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
              {card.explanation}
            </p>
          )}
        </div>

        {/* Rating buttons — shown after answer */}
        {revealed && (
          <div>
            <p className="text-xs text-center text-gray-400 mb-3">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              {QUALITY_LABELS.map(({ q, label, color }) => (
                <button
                  key={q}
                  onClick={() => handleRating(q)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt to answer if not yet revealed */}
        {!revealed && (
          <p className="text-xs text-center text-gray-400">Select an answer to continue</p>
        )}

        {/* Book link */}
        <div className="mt-6 text-center">
          <Link
            href={`/books/${card.book_id}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <BookOpen size={12} /> Open source book
          </Link>
        </div>

      </div>
    </div>
  )
}
