'use client'

import { ExternalLink, Music2, Pause, Play } from 'lucide-react'
import type { TrackRef } from '@/lib/listen/types'
import type { PreviewPlayer } from './usePreviewPlayer'

/**
 * One track, playable.
 *
 * Every visitor gets the same thing now: a thirty-second preview, played in page,
 * no account and no subscription. The previous version had two paths — the
 * Spotify Web Playback SDK for Premium and an embed iframe for everyone else —
 * because full-length playback was subscription-gated and the embed was the only
 * fallback. Both are gone with Spotify.
 */
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
  const year = track.releaseDate?.slice(0, 4)
  const playable = !!track.previewUrl && !!player
  const isCurrent = !!player?.current && player.current.id === track.id
  const isPlaying = isCurrent && !player!.paused

  const handlePlay = () => {
    if (!playable) return
    if (isCurrent) player!.toggle()
    else player!.playTrack(track)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'}`}>
        <button
          onClick={handlePlay}
          disabled={!playable}
          title={playable ? (isPlaying ? 'Pause' : 'Play the preview') : 'No preview available'}
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

        {track.url && (
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open this track in Apple Music"
            className="flex-shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </div>
  )
}
