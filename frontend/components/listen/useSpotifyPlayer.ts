'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Spotify Web Playback SDK, wrapped.
 *
 * Premium accounts get real in-page playback of a full track. Everything else
 * falls back to the embed iframe in TrackCard, which needs no auth and no
 * subscription — so the game is playable either way and only the fidelity of
 * the listening changes.
 */

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: any
  }
}

export interface PlayerState {
  paused: boolean
  trackName: string
  artistName: string
  albumArt: string | null
  uri: string
}

export interface SpotifyPlayer {
  ready: boolean
  deviceId: string | null
  state: PlayerState | null
  error: string
  playTrack: (uri: string) => Promise<void>
  toggle: () => void
}

export function useSpotifyPlayer(enabled: boolean): SpotifyPlayer {
  const [ready, setReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [state, setState] = useState<PlayerState | null>(null)
  const [error, setError] = useState('')
  const playerRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled) return

    const init = () => {
      if (playerRef.current) return
      const player = new window.Spotify.Player({
        name: 'AI Listen Along',
        getOAuthToken: (cb: (t: string) => void) => {
          fetch('/api/spotify/token')
            .then(r => r.json())
            .then(d => cb(d.token ?? ''))
            .catch(() => cb(''))
        },
        volume: 0.6,
      })
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setDeviceId(device_id)
        setReady(true)
      })
      player.addListener('not_ready', () => { setDeviceId(null); setReady(false) })
      player.addListener('player_state_changed', (s: any) => {
        if (!s) { setState(null); return }
        const track = s.track_window?.current_track
        setState({
          paused: s.paused,
          trackName: track?.name ?? '',
          artistName: (track?.artists ?? []).map((a: any) => a.name).join(', '),
          albumArt: track?.album?.images?.[0]?.url ?? null,
          uri: track?.uri ?? '',
        })
      })
      player.addListener('initialization_error', ({ message }: any) => setError(message))
      player.addListener('authentication_error', ({ message }: any) => setError(message))
      player.addListener('account_error', () => setError('Spotify Premium is required for in-page playback'))
      player.connect()
      playerRef.current = player
    }

    if (window.Spotify) {
      init()
    } else {
      window.onSpotifyWebPlaybackSDKReady = init
      if (!document.getElementById('spotify-playback-sdk')) {
        const script = document.createElement('script')
        script.id = 'spotify-playback-sdk'
        script.src = 'https://sdk.scdn.co/spotify-player.js'
        script.async = true
        document.body.appendChild(script)
      }
    }

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
      setReady(false)
      setDeviceId(null)
    }
  }, [enabled])

  const playTrack = useCallback(async (uri: string) => {
    if (!ready) return
    const res = await fetch('/api/spotify/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [uri], deviceId }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Playback failed')
    }
  }, [ready, deviceId])

  const toggle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    setState(s => {
      if (s?.paused) p.resume()
      else p.pause()
      return s
    })
  }, [])

  return { ready, deviceId, state, error, playTrack, toggle }
}
