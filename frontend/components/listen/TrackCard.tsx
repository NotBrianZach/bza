'use client'

import { useState } from 'react'
import { ExternalLink, Music2, Pause, Play } from 'lucide-react'
import type { TrackRef } from '@/lib/listen/types'
import type { SpotifyPlayer } from './useSpotifyPlayer'

/**
 * One track, playable.
 *
 * Premium users with the Web Playback SDK connected hear the full track in
 * place. Everyone else gets Spotify's embed iframe, which needs neither auth
 * nor a subscription — so a free account can still play the whole game.
 */
export default function TrackCard({
  track,
  player,
  label,
  compact,
}: {
  track: TrackRef
  player?: SpotifyPlayer
  label?: string
  compact?: boolean
}) {
  const [embedOpen, setEmbedOpen] = useState(false)
  const year = track.releaseDate?.slice(0, 4)
  const canPlayInPage = !!player?.ready
  const isCurrent = player?.state?.uri === track.uri
  const isPlaying = isCurrent && player?.state && !player.state.paused

  const handlePlay = () => {
    if (!canPlayInPage) { setEmbedOpen(o => !o); return }
    if (isCurrent) player!.toggle()
    else player!.playTrack(track.uri)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'}`}>
        <button
          onClick={handlePlay}
          title={canPlayInPage ? (isPlaying ? 'Pause' : 'Play in page') : 'Open the player'}
          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 group"
          style={{ width: compact ? 40 : 56, height: compact ? 40 : 56 }}
        >
          {track.image
            ? <img src={track.image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Music2 size={16} className="text-gray-400" /></div>}
          <span className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPlaying
              ? <Pause size={14} fill="white" className="text-white" />
              : <Play size={14} fill="white" className="text-white" />}
          </span>
        </button>

        <div className="flex-1 min-w-0">
          {label && (
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
          )}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{track.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {track.artist}{year ? ` · ${year}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!canPlayInPage && (
            <button
              onClick={() => setEmbedOpen(o => !o)}
              className="text-[10px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {embedOpen ? 'Hide' : 'Listen'}
            </button>
          )}
          {track.url && (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Spotify"
              className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {embedOpen && !canPlayInPage && (
        <iframe
          title={`${track.name} — ${track.artist}`}
          src={`https://open.spotify.com/embed/track/${track.id}`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block border-t border-gray-200 dark:border-gray-700"
        />
      )}
    </div>
  )
}
