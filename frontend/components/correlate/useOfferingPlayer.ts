'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Offering } from '@/lib/correlate/types'

/**
 * Plays the audible offerings in a chain, and plays runs of them back to back.
 *
 * Generalised from the music-only player. A chain can now contain paintings,
 * passages and movements, none of which have audio, so the queue **filters to what
 * can be heard** rather than refusing to play a mixed chain. That is a deliberate
 * asymmetry: audio is the only medium with a timeline of its own, so it is the
 * only one that can advance by itself. A mixed chain is stepped through in the UI,
 * and its audible members play when reached.
 *
 * Why one <audio> element and not one per card: browsers grant autoplay permission
 * to a *media element* the user has interacted with. Advancing a queue means
 * calling play() with no click behind it, so the element that plays item 2 has to
 * be the same one the user started on item 1. A per-card element would be blocked
 * from the second item onward.
 */
export interface OfferingPlayer {
  /** The offering currently loaded, playing or paused. */
  current: Offering | null
  paused: boolean
  error: string
  /** How far through the current preview, 0..1 — previews are short enough that a
   *  progress hint is the difference between "stuck" and "playing". */
  progress: number
  /** Position in the active queue, or -1 when playing a one-off. */
  queueIndex: number
  queueLength: number
  playOne: (offering: Offering) => void
  playQueue: (offerings: Offering[], startIndex?: number) => void
  toggle: () => void
  stop: () => void
}

/** The audio URL for an offering, if it has one. */
export function audioUrl(o: Offering): string | null {
  return o.perceptible.kind === 'audio' ? o.perceptible.url : null
}

export function useOfferingPlayer(): OfferingPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Offering[]>([])
  const indexRef = useRef(-1)

  const [current, setCurrent] = useState<Offering | null>(null)
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
    const offering = queueRef.current[i]
    const url = offering ? audioUrl(offering) : null
    if (!url) return
    indexRef.current = i
    setQueueIndex(queueRef.current.length > 1 ? i : -1)
    setCurrent(offering)
    setError('')
    setProgress(0)

    const el = audio()
    el.src = url
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

  const playQueue = useCallback((offerings: Offering[], startIndex = 0) => {
    const playable = offerings.filter(o => !!audioUrl(o))
    queueRef.current = playable
    setQueueLength(playable.length)
    if (playable.length === 0) { setError('Nothing in this chain has audio to play.'); return }
    playAt(Math.max(0, Math.min(startIndex, playable.length - 1)))
  }, [playAt])

  const playOne = useCallback((offering: Offering) => {
    playQueue([offering])
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
    playOne, playQueue, toggle, stop,
  }
}
