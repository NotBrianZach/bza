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
 *  - **The player replaces its mount node.** The element handed to `new YT.Player`
 *    becomes the iframe, so the node must be owned by whoever renders it and must
 *    not be unmounted between tracks — same constraint, and the same reason, as the
 *    single `<audio>` element next door.
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

export interface YouTubeHandle {
  /** Load a video and start it. Rejects if the API or the player will not come up. */
  play: (videoId: string) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  /** How far through the loaded video, 0..1. */
  progress: number
  /** True while a video is loaded — what a caller shows the player panel on. */
  active: boolean
}

export function useYouTubePlayer({
  mount,
  onEnded,
}: {
  /** The node the player replaces. Must outlive the tracks played through it. */
  mount: React.RefObject<HTMLDivElement | null>
  onEnded: () => void
}): YouTubeHandle {
  const playerRef = useRef<YTPlayer | null>(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(false)

  // Held in a ref so the player's event handler, which is installed once at
  // construction and never rebound, always calls the current one.
  const endedRef = useRef(onEnded)
  endedRef.current = onEnded

  /** Built on first use rather than on mount, so a game that never plays a full track never loads the API. */
  const ensure = useCallback(async (): Promise<YTPlayer> => {
    if (playerRef.current) return playerRef.current
    const YT = await loadApi()
    const node = mount.current
    if (!node) throw new Error('The player has nowhere to go.')

    return await new Promise<YTPlayer>((resolve, reject) => {
      let settled = false
      const player = new YT.Player(node, {
        playerVars: {
          // `playsinline` matters on iOS, where the default is to take over the
          // screen — a queue that fullscreens itself every track is unusable.
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
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
  }, [mount])

  const play = useCallback(async (videoId: string) => {
    const player = await ensure()
    player.loadVideoById(videoId)
    player.playVideo()
    setActive(true)
    setProgress(0)
  }, [ensure])

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

  // Leaving the board must not leave a track playing behind it.
  useEffect(() => () => {
    try { playerRef.current?.destroy() } catch { /* already gone with the DOM */ }
    playerRef.current = null
  }, [])

  return { play, pause, resume, stop, progress, active }
}
