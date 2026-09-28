'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrackRef } from '@/lib/listen/types'

/**
 * Plays tracks, and plays runs of them back to back.
 *
 * Replaces the Spotify Web Playback SDK, which needed Premium, an OAuth grant
 * with exactly the right scopes, and an external script — and which had no
 * fallback, because Spotify stopped returning preview audio to this app
 * altogether. This is one <audio> element and thirty-second previews, which every
 * visitor gets with no account of any kind.
 *
 * Why one element and not one per card: browsers grant autoplay permission to a
 * *media element* the user has interacted with. Advancing a queue means calling
 * play() with no click behind it, so the element that plays track 2 has to be the
 * same one the user started on track 1. A per-card element would be blocked from
 * the second song onward.
 */
export interface PreviewPlayer {
  /** The track currently loaded, playing or paused. */
  current: TrackRef | null
  paused: boolean
  error: string
  /** How far through the current preview, 0..1 — previews are short enough that
   *  a progress hint is the difference between "stuck" and "playing". */
  progress: number
  /** Position in the active queue, or -1 when playing a one-off. */
  queueIndex: number
  queueLength: number
  playTrack: (track: TrackRef) => void
  playQueue: (tracks: TrackRef[], startIndex?: number) => void
  toggle: () => void
  stop: () => void
}

export function usePreviewPlayer(): PreviewPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<TrackRef[]>([])
  const indexRef = useRef(-1)

  const [current, setCurrent] = useState<TrackRef | null>(null)
  const [paused, setPaused] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [queueIndex, setQueueIndex] = useState(-1)
  const [queueLength, setQueueLength] = useState(0)

  /** Lazily built so nothing is constructed during SSR. */
  const audio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) audioRef.current = new Audio()
    return audioRef.current
  }, [])

  const playAt = useCallback((i: number) => {
    const track = queueRef.current[i]
    if (!track?.previewUrl) return
    indexRef.current = i
    setQueueIndex(queueRef.current.length > 1 ? i : -1)
    setCurrent(track)
    setError('')
    setProgress(0)

    const el = audio()
    el.src = track.previewUrl
    el.play().then(
      () => setPaused(false),
      // A rejected play() is nearly always the autoplay policy: the gesture that
      // started the queue did not reach this element. Say something actionable
      // rather than failing silently.
      () => { setPaused(true); setError('Playback was blocked — press play to start it.') },
    )
  }, [audio])

  // Wired once, not per play() call, so advancing never depends on re-binding.
  useEffect(() => {
    const el = audio()

    const onEnded = () => {
      const next = indexRef.current + 1
      if (next < queueRef.current.length) playAt(next)
      else { setPaused(true); setProgress(1) }
    }
    const onTime = () => {
      if (el.duration > 0) setProgress(el.currentTime / el.duration)
    }
    const onError = () => setError('That preview would not load.')

    el.addEventListener('ended', onEnded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('error', onError)
    }
  }, [audio, playAt])

  // Stop audio if the component goes away — otherwise leaving a game keeps playing.
  useEffect(() => () => {
    audioRef.current?.pause()
    audioRef.current = null
  }, [])

  const playQueue = useCallback((tracks: TrackRef[], startIndex = 0) => {
    const playable = tracks.filter(t => !!t.previewUrl)
    queueRef.current = playable
    setQueueLength(playable.length)
    if (playable.length === 0) { setError('None of these have a preview to play.'); return }
    playAt(Math.max(0, Math.min(startIndex, playable.length - 1)))
  }, [playAt])

  const playTrack = useCallback((track: TrackRef) => {
    playQueue([track])
  }, [playQueue])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !current) return
    if (el.paused) el.play().then(() => setPaused(false), () => setPaused(true))
    else { el.pause(); setPaused(true) }
  }, [current])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    queueRef.current = []
    indexRef.current = -1
    setPaused(true)
    setCurrent(null)
    setQueueIndex(-1)
    setQueueLength(0)
    setProgress(0)
  }, [])

  return {
    current, paused, error, progress, queueIndex, queueLength,
    playTrack, playQueue, toggle, stop,
  }
}
