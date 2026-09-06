'use client'

import { useState, useEffect, useCallback } from 'react'
import { Book } from '@/types'
import { flashcardQueries, Flashcard } from '@/lib/queries/flashcards'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  LayersIcon, RotateCcw, Trash2, Download, Plus, ChevronLeft,
  BookOpen, Check, Loader2,
} from 'lucide-react'

interface FlashcardPanelProps {
  book: Book
  currentPage: number
  /** When the user creates a card from the reader selection, it can be pre-seeded here. */
  newCard?: Flashcard | null
  onNewCardConsumed?: () => void
}

type View = 'list' | 'review'

function CardFace({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-center">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

export default function FlashcardPanel({ book, currentPage, newCard, onNewCardConsumed }: FlashcardPanelProps) {
  const [view, setView] = useState<View>('list')
  const [cards, setCards] = useState<Flashcard[]>([])
  const [dueCards, setDueCards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Review state
  const [reviewIdx, setReviewIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewDone, setReviewDone] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [all, due] = await Promise.all([
        flashcardQueries.list(book.id),
        flashcardQueries.getDue(book.id),
      ])
      setCards(all)
      setDueCards(due)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [book.id])

  useEffect(() => { load() }, [load])

  // Prepend a card created externally (from reader selection toolbar)
  useEffect(() => {
    if (newCard) {
      setCards(prev => [newCard, ...prev.filter(c => c.id !== newCard.id)])
      if (new Date(newCard.next_review_at) <= new Date()) {
        setDueCards(prev => [newCard, ...prev.filter(c => c.id !== newCard.id)])
      }
      onNewCardConsumed?.()
    }
  }, [newCard])

  const startReview = () => {
    setReviewIdx(0)
    setFlipped(false)
    setReviewDone(false)
    setSessionCorrect(0)
    setView('review')
  }

  const handleRate = async (quality: 0 | 1 | 2 | 3) => {
    const card = dueCards[reviewIdx]
    if (!card) return
    if (quality >= 2) setSessionCorrect(n => n + 1)
    await flashcardQueries.review(card, quality).catch(() => {})
    const next = reviewIdx + 1
    if (next >= dueCards.length) {
      setReviewDone(true)
      load()
    } else {
      setReviewIdx(next)
      setFlipped(false)
    }
  }

  const handleDelete = async (id: number) => {
    await flashcardQueries.delete(id).catch(() => {})
    setCards(prev => prev.filter(c => c.id !== id))
    setDueCards(prev => prev.filter(c => c.id !== id))
  }

  const handleExport = async () => {
    setExporting(true)
    await flashcardQueries.exportTsv(book.id, book.title).catch(() => {})
    setExporting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    )
  }

  // ── Review mode ──────────────────────────────────────────────────────────────
  if (view === 'review') {
    if (reviewDone || dueCards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
          <Check size={40} className="text-green-500" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Session complete!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sessionCorrect}/{dueCards.length} rated Good or Easy
            </p>
          </div>
          <button onClick={() => setView('list')} className="btn btn-secondary flex items-center gap-2">
            <ChevronLeft size={15} /> Back to cards
          </button>
        </div>
      )
    }

    const card = dueCards[reviewIdx]
    const progress = reviewIdx / dueCards.length

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
            {reviewIdx + 1} / {dueCards.length} due
          </span>
          {card.topic_tag && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
              {card.topic_tag}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
          <div className="h-1 bg-violet-500 transition-all" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Card */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          {/* Front */}
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-5 min-h-[100px] flex items-center justify-center">
            <CardFace text={card.front} />
          </div>

          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="btn btn-primary w-full"
            >
              Show answer
            </button>
          ) : (
            <>
              {/* Back */}
              <div className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-violet-200 dark:border-violet-700 p-5 min-h-[80px] flex items-center justify-center">
                <CardFace text={card.back} />
              </div>

              {/* Rating buttons */}
              <div className="grid grid-cols-4 gap-2 w-full">
                {(
                  [
                    { label: 'Again', q: 0 as const, cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60' },
                    { label: 'Hard', q: 1 as const, cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200' },
                    { label: 'Good', q: 2 as const, cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200' },
                    { label: 'Easy', q: 3 as const, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200' },
                  ] as const
                ).map(({ label, q, cls }) => (
                  <button
                    key={label}
                    onClick={() => handleRate(q)}
                    className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${cls}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-3">
                Next review: Again=1d · Hard=~{Math.max(1, Math.round(card.interval_days * 1.2))}d · Good=~{Math.max(1, Math.round(card.interval_days * card.ease_factor))}d · Easy=longer
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── List mode ────────────────────────────────────────────────────────────────
  const grouped: Record<string, Flashcard[]> = {}
  for (const c of cards) {
    const key = c.topic_tag || '(untagged)'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        <LayersIcon size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex-1">
          {cards.length} card{cards.length !== 1 ? 's' : ''}
          {dueCards.length > 0 && (
            <span className="ml-1 text-violet-600 dark:text-violet-400">· {dueCards.length} due</span>
          )}
        </span>
        <button
          onClick={handleExport}
          disabled={cards.length === 0 || exporting}
          title="Export for Anki (.txt)"
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        </button>
      </div>

      {/* Start review CTA */}
      {dueCards.length > 0 && (
        <div className="px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-800 flex items-center gap-2 flex-shrink-0">
          <RotateCcw size={13} className="text-violet-600 dark:text-violet-400 flex-shrink-0" />
          <span className="text-xs text-violet-700 dark:text-violet-300 flex-1">
            {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} ready for review
          </span>
          <button onClick={startReview} className="btn btn-sm text-xs bg-violet-600 text-white hover:bg-violet-700 px-3 py-1">
            Review
          </button>
        </div>
      )}

      {error && (
        <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400 border-b border-red-100">{error}</div>
      )}

      {/* Card list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center text-gray-500 dark:text-gray-400">
            <LayersIcon size={36} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No flashcards yet</p>
            <p className="text-xs">
              Highlight any text in the reader and tap <strong>Create card</strong> to generate one with AI, or add one manually below.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Object.entries(grouped).map(([topic, group]) => (
              <div key={topic}>
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{topic}</span>
                </div>
                {group.map(card => (
                  <CardRow key={card.id} card={card} onDelete={handleDelete} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CardRow({ card, onDelete }: { card: Flashcard; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isDue = new Date(card.next_review_at) <= new Date()

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start gap-2 transition-colors"
      >
        {isDue && (
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" title="Due for review" />
        )}
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 line-clamp-2 text-left">{card.front}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <div className="prose prose-xs dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
                {card.back}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {card.page_num && (
              <span className="text-xs text-gray-400 dark:text-gray-500">p.{card.page_num}</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-1">
              interval: {card.interval_days}d
            </span>
            <button
              onClick={() => onDelete(card.id)}
              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
              title="Delete card"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
