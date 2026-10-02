'use client'

import { useState } from 'react'
import {
  Accessibility, Atom, BookOpen, Clapperboard, Dumbbell, ExternalLink, Footprints, Frame,
  Hand, Leaf, Loader2, Mountain, Music2, Pause, Play, Sigma, Youtube,
} from 'lucide-react'
import Link from 'next/link'
import { authedFetch } from '@/lib/authedFetch'
import { getMedium } from '@/lib/correlate/media'
import type { Offering } from '@/lib/correlate/types'
import { audioUrl, type OfferingPlayer } from './useOfferingPlayer'

const ICONS: Record<string, any> = {
  Music2, Frame, BookOpen, Clapperboard, Sigma, Atom, Leaf, Mountain,
  Hand, Footprints, Accessibility, Dumbbell,
}

/**
 * One offering, rendered however its medium can be perceived.
 *
 * The three renderings are not stylistic variants — they are what each medium
 * actually is. Audio gets a play control and, on request, a full-length YouTube
 * embed. An image gets the image. Text gets the text, because an action nobody
 * filmed and a passage from a book are both only readable.
 *
 * Framing is shown on every card, always. It is the field that stops two players
 * answering different things without noticing, so hiding it behind a hover or a
 * toggle would quietly undo the reason it exists.
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

export default function OfferingCard({
  offering,
  player,
  label,
  compact,
}: {
  offering: Offering
  player?: OfferingPlayer
  label?: string
  compact?: boolean
}) {
  const [full, setFull] = useState<FullState>({ kind: 'idle' })

  const medium = getMedium(offering.medium)
  const Icon = ICONS[medium?.icon ?? 'Music2'] ?? Music2
  const url = audioUrl(offering)
  const playable = !!url && !!player
  const isCurrent = !!player?.current && player.current.id === offering.id
  const isPlaying = isCurrent && !player!.paused

  const thumb = typeof offering.meta.thumb === 'string'
    ? offering.meta.thumb
    : typeof offering.meta.coverImage === 'string' ? offering.meta.coverImage : null

  const context = [offering.meta.year, offering.meta.date, offering.meta.book, offering.meta.kind]
    .filter(v => v !== null && v !== undefined && v !== '')
    .join(' · ')

  const handlePlay = () => {
    if (!playable) return
    if (isCurrent) player!.toggle()
    else player!.playOne(offering)
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
        body: JSON.stringify({
          trackId: offering.id,
          artist: offering.attribution ?? '',
          title: offering.title,
        }),
      })
      const data = await res.json()
      if (data.videoId && data.embeddable) setFull({ kind: 'playing', videoId: data.videoId })
      else setFull({ kind: 'unavailable', reason: data.reason ?? 'no-match', videoId: data.videoId })
    } catch {
      setFull({ kind: 'unavailable', reason: 'no-match' })
    }
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${compact ? 'p-2.5' : 'p-3'}`}>
      {label && (
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          <Icon size={11} /> {label} · {medium?.plural ?? offering.medium}
        </p>
      )}

      <div className="flex items-start gap-3">
        {/* Audio and film get a thumbnail; a painting is shown at size below instead. */}
        {offering.medium !== 'artwork' && thumb && (
          <span className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded overflow-hidden bg-gray-100 dark:bg-gray-700`}>
            <img src={thumb} alt="" className="w-full h-full object-cover" />
          </span>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{offering.title}</p>
          {offering.attribution && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{offering.attribution}</p>
          )}
          {context && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{context}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {playable && (
            <button
              onClick={handlePlay}
              title={isPlaying ? 'Pause' : 'Play the preview'}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
          {offering.medium === 'music' && full.kind === 'idle' && (
            <button
              onClick={loadFull}
              title="Play the full version on YouTube"
              className="p-2 rounded-full text-gray-400 hover:text-red-500 transition-colors"
            >
              <Youtube size={14} />
            </button>
          )}
          {full.kind === 'loading' && <Loader2 size={14} className="animate-spin text-gray-400 m-2" />}
          {offering.sourceUrl && (
            offering.sourceUrl.startsWith('/')
              ? <Link href={offering.sourceUrl} title="Open in the reader" className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors"><ExternalLink size={13} /></Link>
              : <a href={offering.sourceUrl} target="_blank" rel="noreferrer" title="Open the source" className="p-2 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors"><ExternalLink size={13} /></a>
          )}
        </div>
      </div>

      {/* Progress under the row, so a 30-second preview does not look stuck. */}
      {isCurrent && player && player.progress > 0 && (
        <div className="mt-2 h-0.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full bg-gray-400 dark:bg-gray-500 transition-[width]" style={{ width: `${player.progress * 100}%` }} />
        </div>
      )}

      {offering.perceptible.kind === 'image' && (
        <img
          src={offering.perceptible.url}
          alt={offering.perceptible.alt}
          loading="lazy"
          className="mt-3 w-full rounded-lg bg-gray-100 dark:bg-gray-900 object-contain max-h-80"
        />
      )}

      {offering.perceptible.kind === 'text' && (
        <div className={`mt-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5 ${offering.origin === 'composed' ? '' : 'border-l-2 border-gray-200 dark:border-gray-700'}`}>
          {offering.origin === 'composed' && offering.steps
            ? (
              <ol className="space-y-1">
                {offering.steps.map((s, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex gap-2">
                    <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )
            : (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {offering.perceptible.body}
              </p>
            )}
        </div>
      )}

      {full.kind === 'playing' && (
        <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${full.videoId}?autoplay=1`}
            title={offering.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}
      {full.kind === 'unavailable' && (
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          {UNAVAILABLE_COPY[full.reason] ?? UNAVAILABLE_COPY['no-match']}
          {full.videoId && (
            <> <a href={`https://www.youtube.com/watch?v=${full.videoId}`} target="_blank" rel="noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-300">Open on YouTube</a></>
          )}
        </p>
      )}

      {/* Always visible, never behind a toggle: this is the field that keeps two
          players answering the same thing. */}
      {offering.framing && (
        <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="text-gray-400 dark:text-gray-500">framed as </span>{offering.framing}
        </p>
      )}

      {offering.intent && (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {offering.intent === 'invited'
            ? 'offered to try — entirely optional'
            : 'described, not asked of you'}
        </p>
      )}
    </div>
  )
}
