'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, Music2, Pause, Play, Youtube } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import type { TrackRef } from '@/lib/listen/types'
import type { PreviewPlayer } from './usePreviewPlayer'

/**
 * One track, playable.
 *
 * Two layers, and the first always works: a 30-second preview, in page, for every
 * visitor with no account. "Full version" then resolves the track to a YouTube
 * video and embeds it — that costs a shared, limited quota, so it happens only
 * when someone actually asks for this specific song, never for a whole chain up
 * front. Anything that goes wrong degrades to the preview rather than breaking.
 */
type FullState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'playing'; videoId: string }
  | { kind: 'unavailable'; reason: string; videoId?: string }

const UNAVAILABLE_COPY: Record<string, string> = {
  'no-match': 'No full version found for this one.',
  'not-embeddable': 'The full version cannot be played here.',
  quota: 'Full versions are used up for today — previews still work.',
}

export default function TrackCard({
  track,
  player,
  label,
  compact,
}: {
  track: TrackRef
  player?: PreviewPlayer
  label?: string
  compact?: boolean
}) {
  const [full, setFull] = useState<FullState>({ kind: 'idle' })

  const year = track.releaseDate?.slice(0, 4)
  const playable = !!track.previewUrl && !!player
  const isCurrent = !!player?.current && player.current.id === track.id
  const isPlaying = isCurrent && !player!.paused

  const handlePlay = () => {
    if (!playable) return
    if (isCurrent) player!.toggle()
    else player!.playTrack(track)
  }

  const loadFull = async () => {
    if (full.kind === 'loading') return
    setFull({ kind: 'loading' })
    // Stop the preview — two things playing at once is the one outcome nobody wants.
    if (isCurrent) player?.stop()
    try {
      const res = await authedFetch('/api/music/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id, artist: track.artist, title: track.name }),
      })
      const data = await res.json()
      if (data.videoId && data.embeddable) setFull({ kind: 'playing', videoId: data.videoId })
      else setFull({ kind: 'unavailable', reason: data.reason ?? 'no-match', videoId: data.videoId ?? undefined })
    } catch {
      setFull({ kind: 'unavailable', reason: 'no-match' })
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'}`}>
        <button
          onClick={handlePlay}
          disabled={!playable}
          title={playable ? (isPlaying ? 'Pause' : 'Play the 30s preview') : 'No preview available'}
          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 group disabled:cursor-default"
          style={{ width: compact ? 40 : 56, height: compact ? 40 : 56 }}
        >
          {track.image
            ? <img src={track.image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music2 size={16} className="text-gray-400" /></div>}
          {playable && (
            <span className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isPlaying
                ? <Pause size={14} fill="white" className="text-white" />
                : <Play size={14} fill="white" className="text-white" />}
            </span>
          )}
          {/* Previews are 30s, so how far through matters more than it would for a
              full track — without it a playing card looks identical to a stalled one. */}
          {isCurrent && (
            <span
              className="absolute bottom-0 left-0 h-0.5 bg-white/90 transition-[width] duration-300"
              style={{ width: `${Math.round(player!.progress * 100)}%` }}
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
          )}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{track.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {track.artist}{year ? ` · ${year}` : ''}{track.genre ? ` · ${track.genre}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {full.kind !== 'playing' && (
            <button
              onClick={loadFull}
              disabled={full.kind === 'loading'}
              title="Play the full version from YouTube"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {full.kind === 'loading'
                ? <><Loader2 size={10} className="animate-spin" /> …</>
                : <><Youtube size={11} /> Full</>}
            </button>
          )}
          {track.url && (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open this track in Apple Music"
              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {full.kind === 'playing' && (
        <div className="border-t border-gray-200 dark:border-gray-700 aspect-video bg-black">
          <iframe
            title={`${track.name} — ${track.artist}`}
            src={`https://www.youtube-nocookie.com/embed/${full.videoId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="w-full h-full block"
          />
        </div>
      )}

      {full.kind === 'unavailable' && (
        <p className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
          {UNAVAILABLE_COPY[full.reason] ?? UNAVAILABLE_COPY['no-match']}
          {full.videoId && (
            <>
              {' '}
              <a
                href={`https://www.youtube.com/watch?v=${full.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                Open on YouTube
              </a>
            </>
          )}
        </p>
      )}
    </div>
  )
}
