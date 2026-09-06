'use client'

/**
 * ReaderTextColorSection — dark-mode reader text color picker.
 *
 * Extracted from app/settings/page.tsx. Self-contained: bza-reader-text-color
 * localStorage key + sets CSS var --bza-reader-text on document.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'bza-reader-text-color'
const CSS_VAR = '--bza-reader-text'
const DEFAULT = '#f3f4f6'

const PRESETS = [
  { color: '#f3f4f6', label: 'Default' },
  { color: '#e5e7eb', label: 'Soft' },
  { color: '#d1d5db', label: 'Muted' },
  { color: '#fde68a', label: 'Warm' },
  { color: '#bfdbfe', label: 'Cool' },
  { color: '#bbf7d0', label: 'Mint' },
  { color: '#fecaca', label: 'Rose' },
  { color: '#e9d5ff', label: 'Lavender' },
  { color: '#fed7aa', label: 'Peach' },
]

export default function ReaderTextColorSection() {
  const [color, setColor] = useState(DEFAULT)

  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_KEY)
      if (c) setColor(c)
    } catch { /* ignore */ }
  }, [])

  const apply = (c: string) => {
    setColor(c)
    try { localStorage.setItem(STORAGE_KEY, c) } catch { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(CSS_VAR, c)
    }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        🎨 Dark Mode Text Color
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Customize the reading text color in dark mode. Pick a color that's easy on your eyes.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        {PRESETS.map(({ color: c, label }) => (
          <button
            key={c}
            onClick={() => apply(c)}
            title={label}
            className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-indigo-500 scale-110' : 'border-gray-300 dark:border-gray-600'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={e => apply(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
            title="Custom color"
          />
          <span className="text-xs text-gray-400">Custom</span>
        </div>
      </div>
      <div className="mt-3 p-3 rounded-lg bg-gray-900 dark:bg-gray-950">
        <p className="text-sm font-serif" style={{ color }}>
          Preview: The quick brown fox jumps over the lazy dog. This is how your reading text will look in dark mode.
        </p>
      </div>
    </section>
  )
}
