'use client'

/**
 * ExportSection — download all user data (books, bookmarks, problem sets,
 * flashcards, conversations) as JSON.
 *
 * Self-contained. Parent gates on isAuthenticated.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { Download } from 'lucide-react'

export default function ExportSection() {
  const doExport = async () => {
    try {
      const { getAuthHeaders } = await import('@/lib/authedFetch')
      const headers = await getAuthHeaders()
      const res = await fetch('/api/export', { headers })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aireadalong-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed') }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        📦 Export Data
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Download all your books, bookmarks, problem sets, flashcards, and conversations as JSON.
      </p>
      <button onClick={doExport} className="btn btn-secondary text-sm flex items-center gap-2">
        <Download size={14} /> Export all data
      </button>
    </section>
  )
}
