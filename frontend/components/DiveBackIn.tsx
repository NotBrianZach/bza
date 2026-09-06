'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Sparkles, ArrowRight, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DiveInData {
  type: 'dive_in' | 'discover'
  prompt: string
  topic?: string
  book?: { id: number; title: string; currentPage: number; totalPages: number }
}

const FUNCTIONS_BASE = (process.env.NEXT_PUBLIC_FUNCTIONS_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) + '/functions/v1'

export default function DiveBackIn({ hasBooks, onUpload, customPrompt }: { hasBooks: boolean; onUpload: () => void; customPrompt?: string }) {
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
      if (res.ok) setData(await res.json())
    } catch {
      // fail silently — feature is non-critical
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    )
  }

  if (!data) return null

  if (data.type === 'discover') {
    return (
      <div className="rounded-xl border border-primary-200 dark:border-primary-900 bg-primary-50 dark:bg-primary-950 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 bg-primary-100 dark:bg-primary-900 rounded-lg text-primary-600 dark:text-primary-400">
            <Sparkles size={18} />
          </div>
          <div className="flex-1 min-w-0">
            {data.topic && (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400 mb-1">
                Something to explore
              </p>
            )}
            <p className="text-gray-900 dark:text-gray-100 font-medium leading-snug">{data.prompt}</p>
            <button
              onClick={onUpload}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Upload size={14} />
              Upload a book to start exploring
            </button>
          </div>
        </div>
      </div>
    )
  }

  // dive_in
  const { book } = data
  const progress = book ? Math.round((book.currentPage / book.totalPages) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
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
