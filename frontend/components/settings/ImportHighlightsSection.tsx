'use client'

/**
 * ImportHighlightsSection — upload Kindle clippings or Readwise CSV,
 * match highlights against books in library.
 *
 * Self-contained. Parent gates on isAuthenticated.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { Upload } from 'lucide-react'

type Format = 'kindle' | 'readwise'
const FORMATS: Format[] = ['kindle', 'readwise']

export default function ImportHighlightsSection() {
  const onUpload = async (fmt: Format, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const { getAuthHeaders } = await import('@/lib/authedFetch')
      const headers = await getAuthHeaders()
      const res = await fetch('/api/import-highlights', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: fmt, content: text }),
      })
      const data = await res.json()
      alert(`Imported ${data.imported} highlights (${data.skipped} skipped — no matching book)`)
    } catch { alert('Import failed') }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        📥 Import Highlights
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Import from Kindle (My Clippings.txt) or Readwise (CSV export). Highlights are matched to books in your library by title.
      </p>
      <div className="flex gap-2">
        {FORMATS.map(fmt => (
          <label key={fmt} className="btn btn-secondary text-sm flex items-center gap-2 cursor-pointer">
            <Upload size={14} /> {fmt === 'kindle' ? 'Kindle Clippings' : 'Readwise CSV'}
            <input
              type="file"
              accept={fmt === 'kindle' ? '.txt' : '.csv'}
              className="hidden"
              onChange={e => onUpload(fmt, e)}
            />
          </label>
        ))}
      </div>
    </section>
  )
}
