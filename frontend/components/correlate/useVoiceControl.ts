'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { personaSpeak } from '@/lib/persona'
import { track } from '@/lib/analytics'
import {
  confirmationFor, parseVoice, spokenHelp,
  type VoiceContext, type VoiceIntent, type VoiceStage,
} from '@/lib/correlate/voice'

/**
 * The microphone and the speaker. The grammar lives in lib/correlate/voice.ts.
 *
 * ── The feedback loop is the whole problem ────────────────────────────────
 *
 * Hands-free means the microphone is open while the speaker is talking, so the
 * recogniser hears the confirmation it just produced and tries to obey it. This
 * is not a rare edge: "Looking for Idioteque" transcribes cleanly and the word
 * "for" is a plausible start to something. Everything below about `speakingRef`
 * and the restart dance exists for that one reason, and it is the first thing to
 * suspect if commands start firing on their own.
 *
 * The fix is to stop *recognition* while speaking rather than to filter the
 * transcript. Filtering was the first attempt and it cannot work: the recogniser
 * does not tell you where a phrase came from, and a player legitimately saying
 * "again" while the partner is mid-sentence is indistinguishable from an echo.
 *
 * ── Why `SpeechRecognition` and not a server round trip ──────────────────
 *
 * It is free, needs no route, and resolves locally in the time it takes to stop
 * talking — which matters because the only thing voice has to beat is reaching
 * for the mouse, and a turn already costs ten seconds of model call. The price
 * is browser support: Chrome, Edge and Safari have it; Firefox does not. The
 * hook reports that rather than papering over it, because a control that quietly
 * does nothing is worse than one that says it cannot.
 */

/** Chrome and Safari ship it prefixed; the types are not in lib.dom for either. */
type Recognition = any

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

/**
 * How long to wait for the speaker to actually start before giving up on it.
 *
 * `personaSpeak` has two paths that return without ever calling back: no
 * `speechSynthesis` in the browser, and text that strips to nothing. Neither
 * calls `onStart` either, which is what makes this detectable — and it has to be
 * detected, because the microphone is closed until something releases it.
 *
 * Separate from the long watchdog on purpose. This one catches "nothing is going
 * to be said" in a couple of seconds; the long one catches `onend` being dropped
 * part-way through a real utterance, and cannot be short without reopening the
 * mic into the rest of the sentence.
 */
const START_GRACE_MS = 2_500

/**
 * How long a result may sit before it is treated as a complete utterance.
 *
 * `continuous` recognition fires `onresult` with `isFinal` when the speaker
 * pauses, which is usually enough — but Safari in particular sometimes never
 * finalises, so a short settle timer on interim text is the backstop. 900ms is
 * chosen against the gap inside "switch to … embodiment", which is longer than
 * people expect.
 */
const SETTLE_MS = 900

export interface VoiceHandlers {
  /** Act on a parsed command. Returns a line to speak, or null to say nothing. */
  onIntent: (intent: VoiceIntent) => string | null | Promise<string | null>
  /** The last reading, for "say that again". */
  lastReading: () => string
}

export interface VoiceControl {
  /** Whether this browser can do it at all. */
  supported: boolean
  listening: boolean
  /** True while the speaker is talking, which is also when the mic is closed. */
  speaking: boolean
  /** What it is hearing right now, for the live transcript. */
  heard: string
  /** The last thing it understood, or the reason it did not. */
  lastResult: string
  /** A problem worth showing: permission denied, no microphone. */
  error: string
  stage: VoiceStage
  setStage: (s: VoiceStage) => void
  start: () => void
  stop: () => void
  toggle: () => void
  /** Speak a line, pausing recognition for its duration. */
  say: (text: string) => void
  /** Stop talking and reopen the microphone, without leaving voice mode. */
  hush: () => void
}

export function useVoiceControl(
  context: () => VoiceContext,
  handlers: VoiceHandlers,
): VoiceControl {
  const [supported] = useState(() => recognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [heard, setHeard] = useState('')
  const [lastResult, setLastResult] = useState('')
  const [error, setError] = useState('')
  const [stage, setStage] = useState<VoiceStage>('idle')

  const recRef = useRef<Recognition | null>(null)
  /**
   * Whether the speaker is talking, readable synchronously.
   *
   * A ref and not the state, because `onresult` fires from outside React's
   * render cycle and would read a stale `speaking` — which is exactly the window
   * where an echo arrives.
   */
  const speakingRef = useRef(false)
  /** Set while deliberately stopping, so `onend` knows not to restart. */
  const stoppingRef = useRef(false)
  /** True while the player asked to listen, across the restarts below. */
  const wantRef = useRef(false)
  const cancelSpeech = useRef<(() => void) | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakWatchdog = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startGrace = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** The current utterance's "I am done talking" callback, so `hush` can run it. */
  const releaseRef = useRef<(() => void) | null>(null)

  // Handlers and context are read through refs so the recogniser is built once:
  // re-creating it on every render would drop the permission grant and restart
  // the stream mid-sentence.
  const ctxRef = useRef(context)
  ctxRef.current = context
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  const say = useCallback((text: string) => {
    if (!text) return
    // Close the microphone *before* the speaker opens, not after: the gap is
    // where the echo gets in.
    speakingRef.current = true
    setSpeaking(true)
    try { recRef.current?.stop() } catch {}

    /**
     * Reopen the microphone. Idempotent, because four things race to call it.
     *
     * `personaSpeak` does not guarantee its `onEnd` fires: it returns a no-op
     * on a browser with no `speechSynthesis`, and again when the text strips to
     * nothing — and `speechSynthesis.speak` is independently known to drop
     * `onend` on long utterances. Every one of those leaves `speakingRef` true
     * forever, and since the mic is closed while it is true, voice mode would
     * stop working with no error anywhere. Hence the two timers below.
     */
    const release = () => {
      if (speakWatchdog.current) { clearTimeout(speakWatchdog.current); speakWatchdog.current = null }
      if (startGrace.current) { clearTimeout(startGrace.current); startGrace.current = null }
      if (!speakingRef.current) return
      speakingRef.current = false
      setSpeaking(false)
      cancelSpeech.current = null
      releaseRef.current = null
      // `onend` also tries this; both are guarded by `wantRef`, and a second
      // `start()` on a running recogniser throws and is swallowed.
      if (wantRef.current && !stoppingRef.current) {
        try { recRef.current?.start() } catch {}
      }
    }

    cancelSpeech.current?.()
    releaseRef.current = release
    let started = false
    cancelSpeech.current = personaSpeak(text, () => { started = true }, release)

    // Nothing is going to be said at all — see START_GRACE_MS.
    if (startGrace.current) clearTimeout(startGrace.current)
    startGrace.current = setTimeout(() => { if (!started) release() }, START_GRACE_MS)

    // Roughly how long the line takes to read, plus slack. Overshooting only
    // costs a late reopen — and `hush` makes that a tap away — while
    // undershooting reopens the mic mid-sentence and the recogniser hears the
    // rest of it, which is the failure this file exists to prevent. So the
    // estimate is generous and the ceiling is well past the help, which runs
    // about 1,600 characters. A 30-second cap was the first version and it cut
    // the help off less than half way through.
    const estimate = Math.min(240_000, 2_000 + (text.length / 12) * 1_000)
    if (speakWatchdog.current) clearTimeout(speakWatchdog.current)
    speakWatchdog.current = setTimeout(release, estimate)
  }, [])

  /**
   * Stop talking, stay listening.
   *
   * Distinct from `stop`, which leaves voice mode. Needed because the only way
   * to interrupt the speaker otherwise is to turn the whole thing off: the mic
   * is closed while it talks, so "stop reading" is the one instruction that
   * cannot be spoken.
   */
  const hush = useCallback(() => {
    cancelSpeech.current?.()
    releaseRef.current?.()
  }, [])

  const handle = useCallback(async (utterance: string) => {
    const ctx = ctxRef.current()
    const intent = parseVoice(utterance, ctx)
    if (!intent) {
      // Deliberately quiet. The microphone is open while the player talks to the
      // room, so an unrecognised utterance is overwhelmingly *not* a failed
      // command — announcing "I didn't catch that" would make the room
      // unusable. It is shown, not spoken.
      setLastResult(`— ${utterance}`)
      return
    }

    setLastResult(`${utterance}`)
    track('correlate_voice_command', { kind: intent.kind })

    if (intent.kind === 'help') {
      say(spokenHelp(ctx))
      // Dispatched as well as spoken: the board opens the written list on it,
      // so a player who asked out loud gets both channels. Reading the whole
      // table takes most of a minute, and the screen is the version you can
      // skim.
      void handlersRef.current.onIntent(intent)
      return
    }
    if (intent.kind === 'repeat') {
      const r = handlersRef.current.lastReading()
      say(r || 'Nothing to read back yet.')
      return
    }

    const confirm = confirmationFor(intent)
    // Spoken before the action rather than after, because an action can take ten
    // seconds and silence in that gap reads as "it did not hear me".
    if (confirm) say(confirm)

    try {
      const extra = await handlersRef.current.onIntent(intent)
      if (extra) say(extra)
    } catch (e) {
      say(`That did not work. ${(e as Error)?.message ?? ''}`.trim())
    }
  }, [say])

  // One recogniser for the life of the component.
  useEffect(() => {
    const Ctor = recognitionCtor()
    if (!Ctor) return

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recRef.current = rec

    rec.onresult = (ev: any) => {
      // Dropped wholesale while speaking. See the module comment.
      if (speakingRef.current) return

      let finalText = ''
      let interim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }

      if (interim) setHeard(interim.trim())

      if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null }

      if (finalText.trim()) {
        setHeard('')
        void handle(finalText.trim())
        return
      }
      // The backstop for a recogniser that never finalises.
      if (interim.trim()) {
        const text = interim.trim()
        settleTimer.current = setTimeout(() => {
          setHeard('')
          void handle(text)
        }, SETTLE_MS)
      }
    }

    rec.onerror = (ev: any) => {
      // `no-speech` and `aborted` are ordinary in continuous mode — a pause is
      // not a problem and must not be surfaced as one.
      if (ev?.error === 'no-speech' || ev?.error === 'aborted') return
      if (ev?.error === 'not-allowed' || ev?.error === 'service-not-allowed') {
        wantRef.current = false
        setListening(false)
        setError('Microphone permission was declined. Allow it in the browser and try again.')
        return
      }
      setError(`Speech recognition stopped: ${ev?.error ?? 'unknown'}`)
    }

    rec.onend = () => {
      // Continuous mode ends by itself — on a long silence, on some errors, and
      // every time we stop it to speak. Restarting here is what makes the mode
      // actually continuous, and the two guards are what stop it fighting the
      // player's own stop.
      if (wantRef.current && !stoppingRef.current && !speakingRef.current) {
        try { rec.start() } catch {}
      }
    }

    return () => {
      wantRef.current = false
      stoppingRef.current = true
      try { rec.stop() } catch {}
      cancelSpeech.current?.()
      if (settleTimer.current) clearTimeout(settleTimer.current)
      if (speakWatchdog.current) clearTimeout(speakWatchdog.current)
      if (startGrace.current) clearTimeout(startGrace.current)
      recRef.current = null
    }
  }, [handle])

  const start = useCallback(() => {
    if (!recRef.current) return
    setError('')
    wantRef.current = true
    stoppingRef.current = false
    setListening(true)
    try { recRef.current.start() } catch {}
    track('correlate_voice_toggled', { on: true })
  }, [])

  const stop = useCallback(() => {
    wantRef.current = false
    stoppingRef.current = true
    setListening(false)
    setHeard('')
    try { recRef.current?.stop() } catch {}
    cancelSpeech.current?.()
    if (speakWatchdog.current) { clearTimeout(speakWatchdog.current); speakWatchdog.current = null }
    if (startGrace.current) { clearTimeout(startGrace.current); startGrace.current = null }
    if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null }
    speakingRef.current = false
    setSpeaking(false)
    track('correlate_voice_toggled', { on: false })
  }, [])

  const toggle = useCallback(() => {
    if (wantRef.current) stop()
    else start()
  }, [start, stop])

  return {
    supported, listening, speaking, heard, lastResult, error,
    stage, setStage, start, stop, toggle, say, hush,
  }
}
