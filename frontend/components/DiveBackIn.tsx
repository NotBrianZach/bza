'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * "Dive back in" — a line about the book you were last reading, and a way back
 * into it at the page you stopped on.
 *
 * ── There used to be a second mode, and it was not worth having ───────────
 *
 * `{ type: 'discover' }` rendered a "Something to explore" card: a topic and a
 * blurb from a hard-coded array of seven in the edge function, rotated by day
 * of the month, over a button reading "Upload a book to start exploring".
 *
 * It was removed rather than improved. Nothing in it was personal — the array
 * is the same seven topics for every user — and the condition it fired on was
 * not the one it described: the function keys on having no reading SESSION, so
 * anyone who had uploaded books but not yet turned a page was told to upload a
 * book, immediately above their own library. Uploading is the home page's
 * empty state and is handled there.
 *
 * So this component now renders exactly one thing, and nothing at all when
 * there is nothing to return to. `mb-8` lives on its own root for that reason:
 * the margin used to be on the wrapper in app/page.tsx, which would have left
 * a gap of empty page behind whenever this returns null.
 */
interface DiveInData {
  type: 'dive_in'
  prompt: string
  book?: { id: number; title: string; currentPage: number; totalPages: number }
}

const FUNCTIONS_BASE = (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) + '/functions/v1'

export default function DiveBackIn({ customPrompt }: { customPrompt?: string }) {
  const router = useRouter()
  const [data, setData] = useState<DiveInData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = customPrompt ? `?customPrompt=${encodeURIComponent(customPrompt)}` : ''
      const res = await fetch(`${FUNCTIONS_BASE}/dive-in-prompt${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      // 204 is "no reading history", and it is a normal answer rather than a
      // failure. Checked before `res.ok`, which is true for a 204 — calling
      // .json() on an empty body would throw into the catch below and look
      // like an outage in the console.
      if (res.status === 204) return
      if (res.ok) {
        const d = await res.json()
        // Only the one shape is rendered. A deployment where this bundle is
        // live but the function still answers `discover` shows nothing, which
        // is the intended outcome and not a blank card.
        if (d?.type === 'dive_in') setData(d)
      }
    } catch {
      // fail silently — feature is non-critical
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    )
  }

  if (!data) return null

  const { book } = data
  const progress = book ? Math.round((book.currentPage / book.totalPages) * 100) : 0

  return (
    <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
          <BookOpen size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Dive back in
            </p>
            {book && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                · {book.title} · {progress}% through
              </span>
            )}
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium leading-snug">{data.prompt}</p>
          {book && (
            <button
              onClick={() => router.push(`/books/${book.id}?page=${book.currentPage}`)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Open book
              <ArrowRight size={14} />
            </button>
          )}
        </div>
        {book && (
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">p.{book.currentPage} / {book.totalPages}</span>
          </div>
        )}
      </div>
    </div>
  )
}
