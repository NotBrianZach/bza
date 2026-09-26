'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Music2, Search } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import type { TrackRef } from '@/lib/listen/types'

/**
 * Pick a move.
 *
 * A move has to be a real, specific song, so this searches Spotify rather than
 * taking free text — the player chooses from what exists. Debounced, and it
 * keeps the last good result set while a new query is in flight so the list
 * does not flicker empty between keystrokes.
 */
export default function TrackSearch({
  onPick,
  disabled,
  placeholder = 'Search Spotify for your song…',
}: {
  onPick: (track: TrackRef) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<TrackRef[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const seq = useRef(0)

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) {
      setTracks([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    const mine = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const res = await authedFetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=12`)
        const data = await res.json()
        // A slower earlier request must not overwrite a newer result set.
        if (mine !== seq.current) return
        if (data.error) { setError(data.error); setTracks([]) }
        else { setError(''); setTracks(data.tracks ?? []) }
      } catch {
        if (mine === seq.current) setError('Search failed')
      } finally {
        if (mine === seq.current) setLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [q])

  return (
    <div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}

      {tracks.length > 0 && (
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {tracks.map(t => (
            <li key={t.id}>
              <button
                onClick={() => { onPick(t); setQ(''); setTracks([]) }}
                disabled={disabled}
                className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              >
                <span className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {t.image
                    ? <img src={t.image} alt="" className="w-full h-full object-cover" />
                    : <Music2 size={14} className="text-gray-400" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.name}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t.artist}{t.releaseDate ? ` · ${t.releaseDate.slice(0, 4)}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
