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
 *
 * **Two backends, one queue.** A preview is thirty seconds, which is the whole of
 * what a keyless catalogue gives and the wrong length to listen to — so an item is
 * played in full through YouTube when it can be resolved to a video, and through the
 * preview element when it cannot. The queue does not care which: both report
 * finishing the same way and `advance` is the only thing that moves the index.
 *
 * Resolution is asynchronous and the player is not, which is the one sharp edge in
 * here. `playAt` awaits a lookup, so by the time it returns the player may have been
 * stopped, or asked for a different item, or unmounted. Every pass therefore carries
 * a generation stamp and abandons itself if the stamp moved — the alternative is a
 * track that starts playing after you pressed stop.
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
  /**
   * Add to the queue that is already playing, without restarting it.
   *
   * What radio needs and `playQueue` cannot give it. Re-handing the whole chain to
   * `playQueue` on every new turn would reset the index and start the run again from
   * the top — so a growing queue has to be a different call from a new one. Items
   * already queued are ignored, which makes this safe to call with the whole chain
   * rather than only the tail.
   *
   * If the queue had already run dry, the appended item starts playing. That is the
   * autoplay subtlety the single-element design exists for: the element has already
   * played under a real gesture, so it keeps its permission across the gap.
   */
  append: (offerings: Offering[]) => void
  /** How many queued items sit after the one playing. 0 means it is about to run dry. */
  lookahead: number
  toggle: () => void
  stop: () => void
  /**
   * Move to the next item, or park at the end.
   *
   * Exposed because the full-length backend lives in its own hook and has to report
   * finishing to the queue that owns the index — the two cannot both be constructed
   * knowing the other, so the caller joins them.
   */
  advance: () => void
  /**
   * Skip to the next item, as a deliberate act rather than a track ending.
   *
   * The same move as `advance` and a different thing to the listener, which is why
   * it is its own name: at the end of the queue this is "I am done with this one,
   * find me another" and the exhausted callback is what answers that. Radio
   * therefore makes skip-at-the-tail generate, rather than stop.
   */
  skip: () => void
  /** Give up on the full-length attempt for the current item and play its preview. */
  fallbackToPreview: () => void
  /**
   * Back to the previous item, or restart this one when there is nothing behind it.
   *
   * What a listener means by a back button, and what the bar's control did not do —
   * it restarted the whole queue from the first item, which on a long chain is not
   * "back", it is "start over".
   */
  previous: () => void
  /**
   * How the thing playing right now is being played.
   *
   * 'full' means a resolved YouTube video and the whole record; 'preview' means the
   * 30-second catalogue clip. Surfaced because the difference is the player's to
   * state and the listener's to know — a chain that silently alternates between a
   * whole track and a fragment of one reads as a broken player.
   */
  via: 'full' | 'preview' | null
}

/** The audio URL for an offering, if it has one. */
export function audioUrl(o: Offering): string | null {
  return o.perceptible.kind === 'audio' ? o.perceptible.url : null
}

export interface OfferingPlayerOptions {
  /**
   * Called when the queue ends because there was nothing after the last item.
   *
   * The hook's job stops at "there is no next track"; deciding whether that means
   * the run is over or that more should be generated belongs to whoever owns the
   * chain. Held in a ref, so a caller may pass a fresh closure every render without
   * rebinding the media listeners.
   */
  onExhausted?: () => void
  /**
   * The full-length backend, if the caller has one.
   *
   * Injected rather than imported so the queue stays a queue: this hook knows that
   * an item may be playable in full and nothing about YouTube, quotas or caches.
   * Returning null means "play the preview", which is also what every failure
   * means, so a resolver is free to swallow its own errors.
   */
  resolveFull?: (offering: Offering) => Promise<string | null>
  /** Plays a resolved video. Required for `resolveFull` to be of any use. */
  full?: {
    play: (videoId: string) => Promise<void>
    pause: () => void
    resume: () => void
    stop: () => void
  }
}

export function useOfferingPlayer(opts: OfferingPlayerOptions = {}): OfferingPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Offering[]>([])
  const indexRef = useRef(-1)
  /** True while the queue is parked at the end, so an append knows to start it. */
  const driedRef = useRef(false)

  const exhaustedRef = useRef(opts.onExhausted)
  exhaustedRef.current = opts.onExhausted

  const resolveRef = useRef(opts.resolveFull)
  resolveRef.current = opts.resolveFull
  const fullRef = useRef(opts.full)
  fullRef.current = opts.full

  /**
   * Bumped by everything that invalidates an in-flight `playAt`.
   *
   * Stop, a new queue, a jump to another item. A pass that comes back from its
   * resolve to find the stamp moved has been superseded and must not touch the
   * player — see the module comment.
   */
  const genRef = useRef(0)

  const [current, setCurrent] = useState<Offering | null>(null)
  const [paused, setPaused] = useState(true)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [queueIndex, setQueueIndex] = useState(-1)
  const [queueLength, setQueueLength] = useState(0)
  const [lookahead, setLookahead] = useState(0)
  const [via, setVia] = useState<'full' | 'preview' | null>(null)
  /** Readable from the media listeners, which are bound once and never rebound. */
  const viaRef = useRef<'full' | 'preview' | null>(null)
  viaRef.current = via

  /** Lazily built so nothing is constructed during SSR. */
  const audio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) audioRef.current = new Audio()
    return audioRef.current
  }, [])

  const playAt = useCallback((i: number) => {
    const offering = queueRef.current[i]
    if (!offering || !audioUrl(offering)) return
    const gen = ++genRef.current
    indexRef.current = i
    driedRef.current = false
    setQueueIndex(queueRef.current.length > 1 ? i : -1)
    setLookahead(queueRef.current.length - 1 - i)
    setCurrent(offering)
    setError('')
    setProgress(0)

    /** The preview, which is always available — it is why the item is in the queue. */
    const preview = () => {
      fullRef.current?.stop()
      setVia('preview')
      const el = audio()
      el.src = audioUrl(offering)!
      el.play().then(
        () => setPaused(false),
        // A rejected play() is nearly always the autoplay policy: the gesture that
        // started the queue did not reach this element. Say something actionable
        // rather than failing silently.
        () => { setPaused(true); setError('Playback was blocked — press play to start it.') },
      )
    }

    const resolve = resolveRef.current
    const full = fullRef.current
    if (!resolve || !full) { preview(); return }

    void (async () => {
      let videoId: string | null = null
      try {
        videoId = await resolve(offering)
      } catch {
        // Resolution failing is not playback failing. The preview below is the
        // answer to every reason a lookup can come back empty.
      }
      // Superseded while we were asking. Touching the player now would start a
      // track the listener has already skipped past or stopped.
      if (gen !== genRef.current) return
      if (!videoId) { preview(); return }

      try {
        // Paused first, or the preview and the video play over each other for as
        // long as the iframe takes to come up.
        audioRef.current?.pause()
        await full.play(videoId)
        if (gen !== genRef.current) { full.stop(); return }
        setVia('full')
        setPaused(false)
      } catch {
        if (gen === genRef.current) preview()
      }
    })()
  }, [audio])

  /**
   * One item finished — move on, or park at the end.
   *
   * Shared by both backends, and the reason the queue does not care which one is
   * playing: a preview ending and a video ending arrive here identically, and this
   * is the only thing that moves the index.
   */
  const advance = useCallback(() => {
    const next = indexRef.current + 1
    if (next < queueRef.current.length) { playAt(next); return }
    // Parked at the end rather than stopped: the queue may still grow under us,
    // and `append` reads this to know whether to start what it just added.
    driedRef.current = true
    setPaused(true)
    setProgress(1)
    exhaustedRef.current?.()
  }, [playAt])

  // Wired once, not per play() call, so advancing never depends on re-binding.
  useEffect(() => {
    const el = audio()

    const onEnded = () => {
      // Ignored while a full track is playing: the preview element fires `ended`
      // when it is paused mid-load in some browsers, and acting on it would skip
      // the video that just took over.
      if (viaRef.current === 'full') return
      advance()
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
  }, [audio, advance])

  // Stop audio if the component goes away — otherwise leaving a game keeps playing.
  // The video backend tears itself down in its own hook.
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

  const append = useCallback((offerings: Offering[]) => {
    const have = new Set(queueRef.current.map(o => o.id))
    const fresh = offerings.filter(o => !!audioUrl(o) && !have.has(o.id))
    if (fresh.length === 0) return

    const startAt = queueRef.current.length
    queueRef.current = [...queueRef.current, ...fresh]
    setQueueLength(queueRef.current.length)

    // Nothing has played yet, or the queue ran dry while we were fetching: either
    // way the appended item is the one to play. Otherwise it just waits its turn,
    // and all that changed is how much is in front of it.
    if (indexRef.current < 0 || driedRef.current) playAt(startAt)
    else setLookahead(queueRef.current.length - 1 - indexRef.current)
  }, [playAt])

  const playOne = useCallback((offering: Offering) => {
    playQueue([offering])
  }, [playQueue])

  const skip = useCallback(() => {
    if (indexRef.current < 0) return
    advance()
  }, [advance])

  /**
   * Play the current item as a preview after the full-length attempt came to
   * nothing.
   *
   * Called by the video backend's watchdog. Guarded on `via` so it cannot interrupt
   * a preview that is already playing happily — the watchdog is keyed on a video
   * having been *asked* to start, and by the time it fires the queue may have moved
   * on by itself.
   */
  const fallbackToPreview = useCallback(() => {
    if (viaRef.current !== 'full' || indexRef.current < 0) return
    const offering = queueRef.current[indexRef.current]
    if (!offering) return
    fullRef.current?.stop()
    setVia('preview')
    setError('')
    const el = audio()
    el.src = audioUrl(offering)!
    el.play().then(
      () => setPaused(false),
      () => { setPaused(true); setError('Playback was blocked — press play to start it.') },
    )
  }, [audio])

  const previous = useCallback(() => {
    if (indexRef.current < 0) return
    // Restarting the current item when there is nothing behind it is what every
    // media player does, and it keeps the control from being a no-op at the top.
    playAt(Math.max(0, indexRef.current - 1))
  }, [playAt])

  const toggle = useCallback(() => {
    if (!current) return
    // Routed by what is actually playing. Pausing the <audio> element while a video
    // is running would change nothing and report that it had.
    if (via === 'full') {
      const full = fullRef.current
      if (!full) return
      if (paused) { full.resume(); setPaused(false) } else { full.pause(); setPaused(true) }
      return
    }
    const el = audioRef.current
    if (!el) return
    if (el.paused) el.play().then(() => setPaused(false), () => setPaused(true))
    else { el.pause(); setPaused(true) }
  }, [current, via, paused])

  const stop = useCallback(() => {
    genRef.current++
    audioRef.current?.pause()
    fullRef.current?.stop()
    queueRef.current = []
    indexRef.current = -1
    driedRef.current = false
    setPaused(true)
    setCurrent(null)
    setQueueIndex(-1)
    setQueueLength(0)
    setLookahead(0)
    setProgress(0)
    setVia(null)
  }, [])

  return {
    current, paused, error, progress, queueIndex, queueLength, lookahead, via,
    playOne, playQueue, append, toggle, stop, advance, skip, previous, fallbackToPreview,
  }
}
