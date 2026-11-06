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
  /**
   * The queue itself, so a caller can show what is coming and let it be clicked.
   *
   * The length alone was enough while the only queue was the visible chain — the
   * list was already on the page. A station queues tracks that appear nowhere
   * else on screen, where "4 more" would be the only evidence they exist.
   */
  queue: Offering[]
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
  /**
   * Play an item the queue already holds, keeping everything after it.
   *
   * What "click a track in the list to skip to it" needs, and what `playOne`
   * could not give it. `playOne` is `playQueue([one])`, which REPLACES the
   * queue — so clicking a song during a radio run threw the run away: the
   * queue became that single track, `lookahead` collapsed to 0, the radio pump
   * read that as about to run dry and generated, and the rest of the chain was
   * no longer queued to play.
   *
   * Returns false when the offering is not in the queue, so a caller can fall
   * back to playing it as a one-off. That is a real case — an item on another
   * branch was never queued — and it is the caller's decision rather than this
   * hook's, because only the caller knows whether the surrounding run matters.
   */
  jumpTo: (offering: Offering) => boolean
  /**
   * Load a queue and point at one item WITHOUT playing it.
   *
   * What a URL can ask for and `playQueue` cannot give it. A link that names a
   * track arrives with no user gesture behind it, and every browser blocks
   * autoplay in that situation — so a page that called `playQueue` on load
   * would show "Playback was blocked" to someone who had done nothing wrong.
   *
   * Cueing is the honest version: the track is named, shown as current, and
   * paused, and the first press of play starts it. `toggle` knows to treat a
   * cued item as a first play rather than a resume, because there is no loaded
   * media to unpause.
   *
   * Does nothing when the index is out of range, so a stale or hand-edited URL
   * leaves the player alone rather than cueing whatever happens to be at 0.
   */
  cue: (offerings: Offering[], startIndex: number) => void
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
  /**
   * The queue itself, not only its length.
   *
   * Exposed so a caller can SHOW what is coming and let it be clicked. The
   * length alone was enough while the only queue was the visible chain — the
   * list was already on the page. A station queues things that are nowhere else
   * on screen, so "4 more" would be the only evidence they existed.
   *
   * Mirrors `queueRef` rather than replacing it: the ref is what the media
   * listeners and the async `playAt` read, and those must not depend on a
   * render having happened.
   */
  const [queue, setQueue] = useState<Offering[]>([])
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

    /**
     * Hidden tab: take the preview and do not even ask for the video.
     *
     * A YouTube embed will not play while the page is not visible — that is
     * enforced by YouTube, not by anything here, and no attribute or API call
     * changes it. So resolving one for a track that is starting *now*, while
     * backgrounded, buys a silent player: the queue advances, the iframe
     * refuses, and the run has stopped making noise while looking like it is
     * running.
     *
     * The `<audio>` element has no such restriction. It keeps playing with the
     * tab backgrounded and the screen locked, which is what makes a run survive
     * being switched away from at all.
     *
     * This is a per-TRACK decision taken at its start, which is why it is not
     * the dishonest version of itself. Nothing swaps mid-record: a full track
     * already playing is left alone to be stopped by the browser, and the next
     * one picks whichever backend can actually be heard. Come back to the tab
     * and the track after that resolves in full again.
     */
    if (typeof document !== 'undefined' && document.hidden) { preview(); return }

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

  /**
   * Tell the operating system what is playing, and let it drive.
   *
   * ── This is most of the answer to "audio stops when I switch tabs" ───────
   *
   * A page with audio and no Media Session is, to a phone, a background tab
   * that happens to be making noise — and a background tab is the first thing
   * an OS suspends when it wants the memory or the battery. Registering
   * metadata and action handlers is what moves the page into the category the
   * platform keeps alive: it becomes the thing in the notification shade, the
   * thing on the lock screen, the thing the headphone button talks to.
   *
   * The handlers are not decoration either. Without `nexttrack` the OS controls
   * show a dead skip button, and on Android the absence of handlers is part of
   * what makes a session look abandonable.
   *
   * Artwork is passed at the sizes the catalogue gives rather than one "best"
   * URL, because the shade, the lock screen and a car head unit all ask for
   * different ones and a single size gets scaled badly by whichever asked for
   * something else.
   *
   * ── What this does NOT fix, and cannot ──────────────────────────────────
   *
   * A track playing in full through the YouTube embed still stops when the page
   * is hidden. That is YouTube's restriction on embedded playback, applied in
   * their iframe, and no metadata here reaches it. What the hidden-tab branch in
   * `playAt` does is make sure the NEXT track takes the backend that works.
   *
   * Guarded on the API existing: Safari below 15 and a few others have no
   * `mediaSession`, where every line here would throw on a page that is
   * otherwise fine.
   */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession

    if (!current) {
      // Cleared rather than left behind. A lock screen still offering the last
      // track of a run that has been stopped is a control that does nothing.
      ms.metadata = null
      ms.playbackState = 'none'
      return
    }

    const art = typeof current.meta?.coverImage === 'string'
      ? current.meta.coverImage
      : typeof current.meta?.thumb === 'string' ? current.meta.thumb : null

    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.attribution ?? '',
      album: typeof current.meta?.album === 'string' ? current.meta.album : '',
      artwork: art
        ? [
            { src: art, sizes: '96x96', type: 'image/jpeg' },
            { src: art, sizes: '256x256', type: 'image/jpeg' },
            { src: art, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    })
    ms.playbackState = paused ? 'paused' : 'playing'
  }, [current, paused])

  /**
   * The OS controls, bound once.
   *
   * Separate from the metadata effect and with an empty dependency list, so the
   * handlers are registered on mount and never churn. They read through refs,
   * which is why they can be bound once at all — rebinding them on every track
   * would be four `setActionHandler` calls per song for no gain, and on some
   * platforms a brief window with no handler at all.
   */
  const controlsRef = useRef({ toggle: () => {}, skip: () => {}, previous: () => {}, stop: () => {} })
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    const bind = (action: MediaSessionAction, fn: () => void) => {
      try { ms.setActionHandler(action, fn) } catch {
        // An unsupported action throws rather than being ignored on some
        // browsers. One missing control is not a reason to lose the rest.
      }
    }
    bind('play', () => controlsRef.current.toggle())
    bind('pause', () => controlsRef.current.toggle())
    bind('nexttrack', () => controlsRef.current.skip())
    bind('previoustrack', () => controlsRef.current.previous())
    bind('stop', () => controlsRef.current.stop())
    return () => {
      for (const a of ['play', 'pause', 'nexttrack', 'previoustrack', 'stop'] as MediaSessionAction[]) {
        try { ms.setActionHandler(a, null) } catch { /* see above */ }
      }
    }
  }, [])

  const playQueue = useCallback((offerings: Offering[], startIndex = 0) => {
    const playable = offerings.filter(o => !!audioUrl(o))
    queueRef.current = playable
    setQueueLength(playable.length)
    setQueue(playable)
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
    setQueue(queueRef.current)

    // Nothing has played yet, or the queue ran dry while we were fetching: either
    // way the appended item is the one to play. Otherwise it just waits its turn,
    // and all that changed is how much is in front of it.
    if (indexRef.current < 0 || driedRef.current) playAt(startAt)
    else setLookahead(queueRef.current.length - 1 - indexRef.current)
  }, [playAt])

  const playOne = useCallback((offering: Offering) => {
    playQueue([offering])
  }, [playQueue])

  /**
   * Jump to a queued item. See the note on the interface.
   *
   * Matched on `id` rather than by reference: the chain is re-derived from the
   * turns on every render, so the object a card is holding is never the one in
   * `queueRef`. Identity comparison here would silently always miss and the
   * jump would degrade into `playOne` — the exact bug being fixed, still
   * present and now harder to see.
   *
   * `playAt` bumps the generation stamp, so an in-flight resolve for the track
   * this replaces abandons itself rather than starting over the top of it.
   */
  const jumpTo = useCallback((offering: Offering) => {
    const i = queueRef.current.findIndex(o => o.id === offering.id)
    if (i < 0) return false
    playAt(i)
    return true
  }, [playAt])

  /** Cue without playing. See the note on the interface. */
  const cue = useCallback((offerings: Offering[], startIndex: number) => {
    const playable = offerings.filter(o => !!audioUrl(o))
    const offering = playable[startIndex]
    // Out of range is the stale-URL case and must be a no-op, not a fallback to
    // item 0 — cueing a track nobody asked for is worse than cueing none.
    if (!offering) return
    // Bumped like any other move, so a resolve still in flight for a previously
    // cued item cannot come back and start playing over this one.
    genRef.current++
    queueRef.current = playable
    indexRef.current = startIndex
    driedRef.current = false
    setQueueLength(playable.length)
    setQueue(playable)
    setQueueIndex(playable.length > 1 ? startIndex : -1)
    setLookahead(playable.length - 1 - startIndex)
    setCurrent(offering)
    setPaused(true)
    setProgress(0)
    setError('')
    // Stays null: `via` is how `toggle` tells a cued item from a paused one.
    setVia(null)
  }, [])

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
    /**
     * Cued but never started: this press is the first play, not a resume.
     *
     * `via` is null only before anything has been loaded, which is exactly the
     * state `cue` leaves behind. Without this branch the control below would
     * call play() on an element with no src and report a failure — and the
     * press is the gesture the autoplay policy was waiting for, so this is the
     * one moment starting the track is guaranteed to be allowed.
     */
    if (via === null) { playAt(indexRef.current); return }
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
  }, [current, via, paused, playAt])

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
    setQueue([])
    setLookahead(0)
    setProgress(0)
    setVia(null)
  }, [])

  /**
   * Kept current for the OS handlers, which are bound once and read through
   * here. Assigned during render like `viaRef` above, for the same reason: the
   * thing reading it runs outside React — a lock-screen button press — long
   * after the render that produced these closures.
   */
  controlsRef.current = { toggle, skip, previous, stop }

  return {
    current, paused, error, progress, queueIndex, queueLength, queue, lookahead, via,
    playOne, playQueue, append, jumpTo, cue, toggle, stop, advance, skip, previous,
    fallbackToPreview,
  }
}
