'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * The second audio backend: full-length tracks, played by YouTube.
 *
 * Why this exists at all, given there is already a working player. The music
 * provider hands out 30-second previews, because preview audio is all a keyless
 * catalogue gives — and thirty seconds is fine for *looking back* at a chain and
 * wrong for listening to one. A radio whose records change every thirty seconds is
 * not a radio, it is a reel of stingers.
 *
 * Why the IFrame API rather than the `<iframe src="...autoplay=1">` the offering
 * cards already use. A bare embed plays, but it says nothing when it finishes, and
 * "it finished" is the only event a queue runs on. The cards never needed it
 * because a card plays one record at a point someone clicked; a queue cannot be
 * built on that.
 *
 * Three things about the API that shape the code:
 *
 *  - **It is loaded once, globally, via a single window callback.** So the loader is
 *    a module-level promise rather than per-hook state, and it chains any
 *    `onYouTubeIframeAPIReady` that was already installed instead of overwriting it.
 *  - **We render the iframe; the API only attaches to it.** This is the whole reason
 *    the first version of this hook did not work. Handing `new YT.Player` a bare
 *    `<div>` lets the API build the iframe itself — and the iframe it builds has no
 *    `allow` attribute. A cross-origin embed without `allow="autoplay"` may not
 *    start playback it was not individually clicked for, so the *first* queued video
 *    silently refused to play and an unattended run stopped dead after one track.
 *    Permissions are evaluated when the frame loads, so setting the attribute after
 *    the fact does not help: the iframe has to exist, with the attribute, before
 *    anything is loaded into it. The offering cards had this right all along —
 *    their embed has carried `allow="… autoplay …"` since it was written.
 *  - **There is no progress event.** Position is polled, which is why `progress`
 *    ticks on an interval and only while something is loaded.
 *
 * Typed locally rather than with `@types/youtube`, because this is the whole surface
 * used and a dependency for six method signatures is not worth the lockfile churn.
 */

interface YTPlayer {
  loadVideoById(id: string): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

interface YTNamespace {
  Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
}

/**
 * How long a video gets to actually start before it is written off.
 *
 * Eight seconds: long enough for the API script, the attach handshake and a slow
 * buffer on a bad connection, short enough that a run which has silently failed
 * does not look like a run that is merely thinking. The cost of being wrong is one
 * record played as a preview instead of in full, which is the status quo anyway.
 */
const STALL_MS = 8000

/** Resolved once per document, however many players ask for it. */
let apiPromise: Promise<YTNamespace> | null = null

function loadApi(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('The YouTube player needs a browser.'))
  }
  const w = window as unknown as Record<string, any>
  if (w.YT?.Player) return Promise.resolve(w.YT as YTNamespace)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    // Chained, not replaced: another component may already be waiting on this and
    // the API only ever calls whatever is on the window at ready time.
    const prior = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prior === 'function') prior()
      resolve(w.YT as YTNamespace)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => {
      // Cleared so a later attempt can retry rather than await a promise that will
      // never settle — a blocked script is usually an extension, not a dead CDN.
      apiPromise = null
      reject(new Error('The YouTube player could not be loaded.'))
    }
    document.head.appendChild(tag)
  })
  return apiPromise
}

/**
 * The attributes the iframe must carry. Rendered by the caller, asserted here.
 *
 * `autoplay` is the load-bearing one — see the note above. Exported so the JSX and
 * this hook cannot drift apart on the one attribute the feature depends on.
 */
export const YT_ALLOW =
  'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'

/** The embed URL for a video, with the JS API enabled so the player can attach. */
export function ytEmbedSrc(videoId: string): string {
  // `playsinline` matters on iOS, where the default is to take over the screen —
  // a queue that fullscreens itself every track is unusable.
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
    + '?enablejsapi=1&autoplay=1&playsinline=1&rel=0&modestbranding=1'
}

export interface YouTubeHandle {
  /** Load a video and start it. Rejects if the API or the player will not come up. */
  play: (videoId: string) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  /**
   * Fetch the API script ahead of needing it.
   *
   * Called from the click that starts a run, so the first track does not also pay
   * for a script download — on a slow connection that showed up as a long silence
   * between pressing the button and hearing anything.
   */
  prime: () => void
  /** How far through the loaded video, 0..1. */
  progress: number
  /** True while a video is loaded — what a caller shows the player panel on. */
  active: boolean
}

export function useYouTubePlayer({
  frame,
  onEnded,
  onStalled,
}: {
  /**
   * The iframe the player attaches to. Rendered by the caller with `YT_ALLOW`, and
   * it must outlive the tracks played through it: re-creating it would drop both
   * the attached player and the permission that lets the next track start.
   */
  frame: React.RefObject<HTMLIFrameElement | null>
  onEnded: () => void
  /**
   * Called when a video was asked to play and never actually started.
   *
   * The safety net for everything about this backend that cannot be checked
   * without a real browser: the API failing to attach to our iframe, an embed
   * refusing on rights grounds, autoplay being denied anyway. All of them look the
   * same from here — `active` is true and the position never moves — and all of
   * them have the same remedy, which is to stop waiting and play the preview.
   *
   * Without this the failure is a silent stall, because the event that advances the
   * queue is the one event a non-attached player cannot send.
   */
  onStalled?: () => void
}): YouTubeHandle {
  const playerRef = useRef<YTPlayer | null>(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(false)

  // Held in a ref so the player's event handler, which is installed once at
  // construction and never rebound, always calls the current one.
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded
  const stalledRef = useRef(onStalled)
  stalledRef.current = onStalled

  /** Bumped on every `play`, so the watchdog below is per-track rather than global. */
  const [startedAt, setStartedAt] = useState(0)
  /** Read by the watchdog timer, which must not re-arm every time the poll ticks. */
  const progressRef = useRef(0)
  progressRef.current = progress

  /**
   * Attach the API to our iframe, which must already be showing a video.
   *
   * Built on first use rather than on mount, so a game that never plays a full
   * track never loads the API — and attached *after* the iframe has been pointed at
   * a real video, because the API attaches to a loaded embed rather than
   * navigating one.
   */
  const ensure = useCallback(async (): Promise<YTPlayer> => {
    if (playerRef.current) return playerRef.current
    const YT = await loadApi()
    const node = frame.current
    if (!node) throw new Error('The player has nowhere to go.')

    return await new Promise<YTPlayer>((resolve, reject) => {
      let settled = false
      const player = new YT.Player(node, {
        events: {
          onReady: () => {
            if (settled) return
            settled = true
            playerRef.current = player
            resolve(player)
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED) {
              setActive(false)
              endedRef.current()
            }
          },
          onError: () => {
            // A video that will not play is the queue's problem, not a crash: the
            // same signal as finishing, so the run moves on instead of stalling.
            setActive(false)
            endedRef.current()
            if (!settled) { settled = true; reject(new Error('That video would not play.')) }
          },
        },
      })
    })
  }, [frame])

  const play = useCallback(async (videoId: string) => {
    const node = frame.current
    if (!node) throw new Error('The player has nowhere to go.')

    // First track: point the iframe at the video and attach to it. The `src` carries
    // `autoplay=1`, which together with the `allow` attribute on the element is what
    // lets an unattended queue start a track nobody clicked.
    if (!playerRef.current) {
      node.src = ytEmbedSrc(videoId)
      setActive(true)
      setProgress(0)
      setStartedAt(n => n + 1)
      await ensure()
      return
    }

    // Afterwards the player is live and swaps videos in place, which keeps the
    // permission the frame was loaded with.
    playerRef.current.loadVideoById(videoId)
    playerRef.current.playVideo()
    setActive(true)
    setProgress(0)
    setStartedAt(n => n + 1)
  }, [ensure, frame])

  const prime = useCallback(() => { void loadApi().catch(() => {}) }, [])

  const pause = useCallback(() => { playerRef.current?.pauseVideo() }, [])
  const resume = useCallback(() => { playerRef.current?.playVideo() }, [])

  const stop = useCallback(() => {
    playerRef.current?.stopVideo()
    setActive(false)
    setProgress(0)
  }, [])

  // Polled, because the API has no timeupdate. Only while something is loaded, so
  // an idle board is not running a timer for nothing.
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      const p = playerRef.current
      if (!p) return
      try {
        const d = p.getDuration()
        if (d > 0) setProgress(Math.min(1, p.getCurrentTime() / d))
      } catch {
        // getCurrentTime throws while the iframe is swapping videos. Nothing to
        // report: the next tick is 500ms away.
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [active])

  /**
   * Did it actually start? If not, say so once rather than waiting forever.
   *
   * Keyed on `startedAt` so each track gets its own window, and armed only while a
   * video is loaded. `progress` moving at all is proof of life — the poll above
   * only reports a position when the player is attached and playing — so a still-
   * zero position after this long means it is not going to play.
   */
  useEffect(() => {
    if (!active || startedAt === 0) return
    const id = window.setTimeout(() => {
      if (progressRef.current === 0) stalledRef.current?.()
    }, STALL_MS)
    return () => window.clearTimeout(id)
  }, [active, startedAt])

  // Leaving the board must not leave a track playing behind it.
  useEffect(() => () => {
    try { playerRef.current?.destroy() } catch { /* already gone with the DOM */ }
    playerRef.current = null
  }, [])

  return { play, pause, resume, stop, prime, progress, active }
}
