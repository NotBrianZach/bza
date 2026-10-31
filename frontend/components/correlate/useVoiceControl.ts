'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { personaSpeak } from '@/lib/persona'
import { track } from '@/lib/analytics'
import {
  confirmationFor, parseBarge, parseVoice, spokenHelp,
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
 * "Heard you", as a tone rather than a sentence.
 *
 * The cheapest fix for the assistant feeling. A spoken confirmation costs one to
 * two seconds of closed microphone to convey one bit — *received* — and the
 * player already knows what they said. Two short sine blips do the same job in
 * 120ms, and because nothing is being spoken the mic never shuts, so the player
 * can keep talking straight through the acknowledgement.
 *
 * Built with Web Audio rather than an audio file: no asset to ship or cache, no
 * request on the critical path, and the context is created lazily so a page that
 * never turns voice on never creates one. Failures are swallowed — a missing
 * earcon is a cosmetic loss, and a thrown exception here would land inside the
 * recogniser's result handler and stop voice mode.
 */
function makeEarcon(): (kind: 'ok' | 'no') => void {
  let ctx: AudioContext | null = null
  return (kind) => {
    try {
      const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext
      if (!Ctor) return
      ctx ??= new Ctor()
      if (!ctx) return
      // Suspended is the norm on iOS until a gesture resumes it; the toggle that
      // turns voice on is one, but a resume here costs nothing if it already is.
      void ctx.resume?.()
      const now = ctx.currentTime
      // Rising for yes, falling for no. Direction is the part that reads without
      // being learned, which matters for a signal nobody is told about.
      const notes = kind === 'ok' ? [660, 880] : [440, 330]
      notes.forEach((hz, i) => {
        const osc = ctx!.createOscillator()
        const gain = ctx!.createGain()
        osc.type = 'sine'
        osc.frequency.value = hz
        // Ramped, not switched: a square-edged gate on a sine is a click, and a
        // click sounds like a fault rather than an acknowledgement.
        const at = now + i * 0.06
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(0.07, at + 0.01)
        gain.gain.linearRampToValueAtTime(0, at + 0.055)
        osc.connect(gain).connect(ctx!.destination)
        osc.start(at)
        osc.stop(at + 0.06)
      })
    } catch {}
  }
}

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
  /** The last answer in full, for "say that again". */
  lastReading: () => string
  /** The part of the last reading that was not spoken on landing, for "go on". */
  unreadRest: () => string
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
  /**
   * Exactly what is being spoken, for `parseBarge` to rule out echoes against.
   *
   * This string is the thing that makes interruption possible at all. The
   * general problem — "did that word come from the room or from the speaker?" —
   * has no answer. The problem we actually have does: a word absent from the
   * text being read cannot have been read, so it came from the player.
   */
  const spokenTextRef = useRef('')
  const earcon = useRef(makeEarcon())
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
    // Recognition keeps running, but `onresult` only honours the barge-in
    // vocabulary while this is set — see `spokenTextRef`. Stopping the
    // recogniser outright was the first version, and it made the partner
    // uninterruptible: a reading is twenty seconds you could not talk through,
    // which is most of what made this feel like a kiosk.
    speakingRef.current = true
    spokenTextRef.current = text
    setSpeaking(true)

    /**
     * Done talking. Idempotent, because four things race to call it.
     *
     * `personaSpeak` does not guarantee its `onEnd` fires: it returns a no-op
     * on a browser with no `speechSynthesis`, and again when the text strips to
     * nothing — and `speechSynthesis.speak` is independently known to drop
     * `onend` on long utterances. Every one of those would leave the full
     * grammar permanently narrowed to the two barge-in words, with no error
     * anywhere. Hence the two timers below.
     */
    const release = () => {
      if (speakWatchdog.current) { clearTimeout(speakWatchdog.current); speakWatchdog.current = null }
      if (startGrace.current) { clearTimeout(startGrace.current); startGrace.current = null }
      if (!speakingRef.current) return
      speakingRef.current = false
      spokenTextRef.current = ''
      setSpeaking(false)
      cancelSpeech.current = null
      releaseRef.current = null
      // Recognition was never stopped, but `onend` fires for its own reasons —
      // a long silence, a transient error — and restarting is what makes the
      // mode continuous. Both are guarded by `wantRef`, and a second `start()`
      // on a running recogniser throws and is swallowed.
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

    // While the partner is talking, only the barge-in words are heard, and only
    // when they do not appear in what is being said. The full grammar is not
    // available mid-speech on purpose: every other command would be matching
    // against a transcript that may be the speaker's own words coming back, and
    // there is no way to tell. Two words we can prove came from the room is a
    // real interruption; seventeen we cannot is a haunted interface.
    if (speakingRef.current) {
      const barge = parseBarge(utterance, spokenTextRef.current)
      if (!barge) return
      setLastResult(utterance)
      track('correlate_voice_command', { kind: barge.kind, barge: true })
      earcon.current('ok')
      // Silence first, always — whatever else the word meant, the player asked
      // for quiet, and acting before stopping would talk over the answer.
      cancelSpeech.current?.()
      releaseRef.current?.()
      if (barge.kind !== 'hush') {
        try { await handlersRef.current.onIntent(barge) } catch {}
      }
      return
    }

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

    // Before anything else, and before any speech. This is the whole
    // acknowledgement for most commands now, and its value is that it lands
    // immediately and costs the player no silence.
    earcon.current('ok')

    // Inlined rather than calling `hush`, which is declared below this callback:
    // naming it in the dependency array would read it in its temporal dead zone.
    if (intent.kind === 'hush') {
      cancelSpeech.current?.()
      releaseRef.current?.()
      return
    }
    if (intent.kind === 'more') {
      const rest = handlersRef.current.unreadRest()
      say(rest || 'That was all of it.')
      return
    }
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
      let finalText = ''
      let interim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }

      // Not while speaking: the mic is picking up the partner, so this would be
      // a live transcript of the thing the player is already listening to —
      // churning state on every syllable to display it back to them.
      if (interim && !speakingRef.current) setHeard(interim.trim())

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
