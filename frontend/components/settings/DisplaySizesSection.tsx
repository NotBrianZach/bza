'use client'

/**
 * DisplaySizesSection — card size preferences for library/feeds/flashcards.
 *
 * Extracted from app/settings/page.tsx (was an inline IIFE).
 * Self-contained: bza-card-sizes localStorage key.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useState } from 'react'
import { Layers } from 'lucide-react'

const STORAGE_KEY = 'bza-card-sizes'
type CardSize = 'small' | 'medium' | 'large'
const DEFAULTS: Record<string, CardSize> = { books: 'medium', feeds: 'medium', flashcards: 'medium' }

const OPTIONS: { value: CardSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

const ITEMS = [
  { key: 'books', label: 'Library cards', desc: 'Book title cards in your library' },
  { key: 'feeds', label: 'Feed items', desc: 'RSS feed article cards' },
  { key: 'flashcards', label: 'Flashcards', desc: 'Spaced repetition review cards' },
]

export default function DisplaySizesSection() {
  const [sizes, setSizes] = useState<Record<string, CardSize>>(() => {
    if (typeof window === 'undefined') return DEFAULTS
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } } catch { return DEFAULTS }
  })

  const update = (key: string, val: CardSize) => {
    const next = { ...sizes, [key]: val }
    setSizes(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        <Layers size={16} /> Card Sizes
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Control how large library cards, feed items, and flashcards appear.
      </p>
      <div className="space-y-3">
        {ITEMS.map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-[10px] text-gray-400">{item.desc}</p>
            </div>
            <div className="flex gap-1">
              {OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => update(item.key, o.value)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    sizes[item.key] === o.value
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
