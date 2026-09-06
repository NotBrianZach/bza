'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/types'
import { quizQueries, QuizQuestion, QuizFocusType, QuizFocus } from '@/lib/queries'
import { BookmarkPlus } from 'lucide-react'
import { GraduationCap, RefreshCw, CheckCircle, XCircle, BookOpen, LayersIcon, ClipboardList } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { quizAttemptQueries, Flashcard } from '@/lib/queries/flashcards'
import FlashcardPanel from './FlashcardPanel'

interface QuizPanelProps {
  book: Book
  currentPage: number
  newFlashcard?: Flashcard | null
  onFlashcardConsumed?: () => void
  onOpenProblemSet?: (problem?: string) => void
}

type QuizState = 'idle' | 'loading' | 'active' | 'results'

const FOCUS_OPTIONS: { type: QuizFocusType; label: string }[] = [
  { type: 'page', label: 'This page' },
  { type: 'book', label: 'Whole book' },
  { type: 'character', label: 'Character' },
  { type: 'custom', label: 'Custom' },
]

export default function QuizPanel({ book, currentPage, newFlashcard, onFlashcardConsumed, onOpenProblemSet }: QuizPanelProps) {
  const [tab, setTab] = useState<'quiz' | 'flashcards'>('quiz')
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selected, setSelected] = useState<(number | null)[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [focusType, setFocusType] = useState<QuizFocusType>('page')
  const [focusValue, setFocusValue] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  const generate = async () => {
    if ((focusType === 'character' || focusType === 'custom') && !focusValue.trim()) return
    setError(null)
    setQuizState('loading')
    const focus: QuizFocus = { type: focusType, value: focusValue.trim() || undefined }
    try {
      const qs = await quizQueries.generate(book.id, currentPage, focus)
      setQuestions(qs)
      setSelected(new Array(qs.length).fill(null))
      setQuizState('active')
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
      setQuizState('idle')
    }
  }

  const submit = () => {
    setQuizState('results')
    // Save attempt for tutor context (fire-and-forget)
    const results = questions.map((q, i) => ({
      question: q.question,
      topic: (q as any).topic ?? '',
      correct: selected[i] === q.correct,
    }))
    quizAttemptQueries.save({
      book_id: book.id,
      page_num: currentPage,
      focus_type: focusType,
      focus_value: focusValue.trim() || undefined,
      score: results.filter(r => r.correct).length,
      total: questions.length,
      results,
    }).catch(() => {})
  }

  const [savedCards, setSavedCards] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveAsCards = async () => {
    setIsSaving(true)
    try {
      await quizQueries.saveCards(book.id, questions)
      setSavedCards(true)
    } catch { /* non-fatal */ }
    setIsSaving(false)
  }

  const reset = () => {
    setQuizState('idle')
    setQuestions([])
    setSelected([])
  }

  const score = selected.filter((s, i) => s === questions[i]?.correct).length

  const focusLabel = focusType === 'page'
    ? `page ${currentPage}`
    : focusType === 'book'
    ? 'the whole book'
    : focusValue.trim() || (focusType === 'character' ? 'a character' : 'a topic')

  const tabBar = (
    <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
      <button
        onClick={() => setTab('quiz')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
          tab === 'quiz'
            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <GraduationCap size={14} />Quiz
      </button>
      <button
        onClick={() => setTab('flashcards')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
          tab === 'flashcards'
            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
      >
        <LayersIcon size={14} />Flashcards
      </button>
    </div>
  )

  if (tab === 'flashcards') {
    return (
      <div className="flex flex-col h-full">
        {tabBar}
        <div className="flex-1 overflow-hidden">
          <FlashcardPanel book={book} currentPage={currentPage} newCard={newFlashcard} onNewCardConsumed={onFlashcardConsumed} />
        </div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    // Still show the quiz UI — quota system handles limits, not auth gates
  }

  if (quizState === 'idle' || quizState === 'loading') {
    const needsValue = focusType === 'character' || focusType === 'custom'
    const canGenerate = quizState !== 'loading' && (!needsValue || focusValue.trim())
    return (
      <div className="flex flex-col h-full">
        {tabBar}
      <div className="flex flex-col items-center justify-center flex-1 text-center px-6 gap-5">
        <GraduationCap size={48} className="text-gray-300 dark:text-gray-600" />
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">Quiz yourself</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            5 questions about {focusLabel}
          </p>
        </div>

        {/* Focus selector */}
        <div className="w-full max-w-xs space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {FOCUS_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setFocusType(opt.type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  focusType === opt.type
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {focusType === 'character' && (
            <input
              type="text"
              value={focusValue}
              onChange={e => setFocusValue(e.target.value)}
              placeholder="Character name…"
              className="input w-full text-sm"
              autoFocus
            />
          )}
          {focusType === 'custom' && (
            <input
              type="text"
              value={focusValue}
              onChange={e => setFocusValue(e.target.value)}
              placeholder="Topic or theme…"
              className="input w-full text-sm"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && canGenerate) generate() }}
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 max-w-xs">{error}</p>
        )}
        <button
          onClick={generate}
          disabled={!canGenerate}
          className="btn btn-primary flex items-center gap-2 disabled:opacity-40"
        >
          {quizState === 'loading' ? (
            <><div className="spinner" /> Generating…</>
          ) : (
            <><GraduationCap size={16} /> Generate Quiz</>
          )}
        </button>

        {onOpenProblemSet && (
          <button
            onClick={() => onOpenProblemSet()}
            className="flex items-center justify-center gap-2.5 w-full text-base font-semibold px-4 py-3 mt-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            <ClipboardList size={18} /> Do Problem Sets
          </button>
        )}
      </div>
      </div>
    )
  }

  if (quizState === 'results') {
    return (
      <div className="flex flex-col h-full">
        {tabBar}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {score}/{questions.length} correct
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {score === questions.length
                ? 'Perfect score!'
                : score >= questions.length / 2
                ? 'Good job!'
                : 'Keep reading!'}
            </p>
          </div>
          <div className="flex gap-2">
            {!savedCards && (
              <button
                onClick={saveAsCards}
                disabled={isSaving}
                title="Save questions to your study deck for spaced repetition review"
                className="btn btn-secondary flex items-center gap-1 text-sm"
              >
                <BookmarkPlus size={14} />
                {isSaving ? 'Saving…' : 'Save to deck'}
              </button>
            )}
            {savedCards && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 px-2">
                <CheckCircle size={13} /> Saved!
              </span>
            )}
            <button onClick={reset} className="btn btn-secondary flex items-center gap-1 text-sm">
              <RefreshCw size={14} /> New Quiz
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {questions.map((q, qi) => {
            const userAnswer = selected[qi]
            const isCorrect = userAnswer === q.correct
            return (
              <div key={qi} className="space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-1">
                  {q.options.map((opt, oi) => {
                    const isSelected = userAnswer === oi
                    const isCorrectOpt = q.correct === oi
                    let cls = 'flex items-start gap-2 px-3 py-2 rounded-lg text-sm border '
                    if (isCorrectOpt) {
                      cls += 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                    } else if (isSelected && !isCorrect) {
                      cls += 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                    } else {
                      cls += 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }
                    return (
                      <div key={oi} className={cls}>
                        <span className="flex-1">{opt}</span>
                        {isCorrectOpt && <CheckCircle size={14} className="flex-shrink-0 mt-0.5 text-green-600" />}
                        {isSelected && !isCorrect && <XCircle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-1 italic">
                  {q.explanation}
                </p>
              </div>
            )
          })}
        </div>
      </div>
      </div>
    )
  }

  // Active quiz
  const allAnswered = selected.every(s => s !== null)
  return (
    <div className="flex flex-col h-full">
      {tabBar}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {focusLabel.charAt(0).toUpperCase() + focusLabel.slice(1)} — {selected.filter(s => s !== null).length}/{questions.length} answered
        </p>
        <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          Cancel
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {questions.map((q, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-1">
              {q.options.map((opt, oi) => {
                const isSelected = selected[qi] === oi
                return (
                  <button
                    key={oi}
                    onClick={() => setSelected(prev => { const n = [...prev]; n[qi] = oi; return n })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-800 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={submit}
          disabled={!allAnswered}
          className="btn btn-primary w-full disabled:opacity-40"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  )
}
