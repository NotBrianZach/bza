import { track } from '@/lib/analytics'

// Per-persona voice settings for Web Speech API
const PERSONA_VOICES: Record<string, { rate: number; pitch: number }> = {
  sensei:    { rate: 0.85, pitch: 0.9 },
  buddy:     { rate: 1.1,  pitch: 1.1 },
  rival:     { rate: 1.0,  pitch: 0.85 },
  professor: { rate: 0.8,  pitch: 0.8 },
  coach:     { rate: 1.15, pitch: 1.05 },
  librarian: { rate: 0.95, pitch: 1.15 },
  tsundere:  { rate: 1.05, pitch: 1.2 },
  custom:    { rate: 1.0,  pitch: 1.0 },
}

/** Check if auto-read is enabled */
export function isAutoReadEnabled(): boolean {
  try { return localStorage.getItem('bza-persona-autoread') === 'true' } catch { return false }
}

export function setAutoRead(v: boolean) {
  try { localStorage.setItem('bza-persona-autoread', v ? 'true' : 'false') } catch {}
}

/** Get the user's TTS engine preference */
export function getTtsEngine(): 'browser' | 'elevenlabs' {
  try { return (localStorage.getItem('bza-tts-engine') as any) || 'browser' } catch { return 'browser' }
}

export function setTtsEngine(v: 'browser' | 'elevenlabs') {
  try { localStorage.setItem('bza-tts-engine', v) } catch {}
}

/** Speak text using the configured TTS engine.
 *  Routes to AI voice (via Cloud Run) or browser voice based on settings. */
export function personaSpeak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {}

  const engine = getTtsEngine()
  const persona = getPersonaInfo()

  track('tts_played', { engine, persona_id: persona?.id, len: text.length })

  if (engine === 'elevenlabs') {
    return speakElevenLabs(text, persona?.id, onStart, onEnd)
  }
  return speakBrowser(text, persona?.id, onStart, onEnd)
}

function speakBrowser(text: string, personaId: string | undefined, onStart?: () => void, onEnd?: () => void): () => void {
  if (!window.speechSynthesis) return () => {}

  const clean = stripMarkdown(text)
  if (!clean) return () => {}

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(clean)
  const voiceConfig = personaId ? (PERSONA_VOICES[personaId] ?? PERSONA_VOICES.custom) : PERSONA_VOICES.custom

  utterance.rate = voiceConfig.rate
  utterance.pitch = voiceConfig.pitch
  utterance.onstart = () => onStart?.()
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()

  const voices = window.speechSynthesis.getVoices()
  const english = voices.filter(v => v.lang.startsWith('en'))
  if (english.length > 0) utterance.voice = english[0]

  window.speechSynthesis.speak(utterance)

  return () => { window.speechSynthesis.cancel() }
}

// Simple audio cache — pre-generated audio for upcoming pages
const audioCache = new Map<string, Blob>()

/** Pre-fetch TTS audio for a text (call for next page while current plays) */
export function prefetchTts(text: string, personaId?: string) {
  const key = text.slice(0, 80)
  if (audioCache.has(key)) return
  getAuthHeaders().then(authHeaders =>
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ text, personaId }),
  }))
    .then(r => r.ok ? r.blob() : null)
    .then(blob => { if (blob) audioCache.set(key, blob) })
    .catch(() => {})
}

function speakElevenLabs(text: string, personaId: string | undefined, onStart?: () => void, onEnd?: () => void): () => void {
  let cancelled = false
  let audio: HTMLAudioElement | null = null

  onStart?.() // immediate UI feedback

  const cacheKey = text.slice(0, 80)
  const cached = audioCache.get(cacheKey)

  const playBlob = (blob: Blob) => {
    if (cancelled) return
    audio = new Audio(URL.createObjectURL(blob))
    audio.onended = () => onEnd?.()
    audio.onerror = () => onEnd?.()
    audio.play().catch(() => { if (!cancelled) onEnd?.() })
  }

  if (cached) {
    audioCache.delete(cacheKey)
    playBlob(cached)
  } else {
    ;(async () => {
      try {
        const authHeaders = await getAuthHeaders()
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ text, persona_id: personaId }),
        })
        if (!res.ok || cancelled) { if (!cancelled) onEnd?.(); return }
        const blob = await res.blob()
        playBlob(blob)
      } catch {
        if (!cancelled) onEnd?.()
      }
    })()
  }

  return () => { cancelled = true; audio?.pause() }
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ' math expression ')
    .replace(/\$[^$]+\$/g, ' math ')
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/[#*_~`>|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim()
}

import { getAuthHeaders } from './authedFetch'

/** Get the user's model choice for a feature */
export function getModelChoice(feature: 'chat' | 'problemSet' | 'libraryChat'): { model: string; provider: 'openai' | 'openrouter' } {
  const defaults: Record<string, { model: string; provider: 'openai' | 'openrouter' }> = {
    chat: { model: 'gpt-4o-mini', provider: 'openai' },
    problemSet: { model: 'gpt-4o-mini', provider: 'openai' },
    libraryChat: { model: 'anthropic/claude-haiku-4-5', provider: 'openrouter' },
  }
  try {
    const raw = localStorage.getItem('bza-model-choices')
    if (!raw) return defaults[feature]
    const choices = JSON.parse(raw) as Record<string, string>
    const modelId = choices[feature]
    if (!modelId) return defaults[feature]
    const provider = modelId.includes('/') ? 'openrouter' as const : 'openai' as const
    return { model: modelId, provider }
  } catch {
    return defaults[feature]
  }
}

/** Get the active persona prompt to prepend to LLM system prompts */
export function getPersonaPrompt(): string {
  try {
    const raw = localStorage.getItem('bza-persona')
    if (!raw) return ''
    const { id, prompt } = JSON.parse(raw) as { id: string; prompt: string }
    if (id === 'none' || !prompt?.trim()) return ''
    return prompt.trim()
  } catch {
    return ''
  }
}

/** Get persona display info (for showing avatar/name in chat) */
export function getPersonaInfo(): { id: string; name: string; emoji: string } | null {
  try {
    const raw = localStorage.getItem('bza-persona')
    if (!raw) return null
    const { id } = JSON.parse(raw) as { id: string }
    if (id === 'none') return null
    const presets: Record<string, { id: string; name: string; emoji: string }> = {
      sensei: { id: 'sensei', name: 'Sensei', emoji: '🥋' },
      buddy: { id: 'buddy', name: 'Study Buddy', emoji: '🤝' },
      rival: { id: 'rival', name: 'Rival', emoji: '⚔️' },
      professor: { id: 'professor', name: 'Professor', emoji: '🎓' },
      coach: { id: 'coach', name: 'Coach', emoji: '💪' },
      librarian: { id: 'librarian', name: 'Flirty Librarian', emoji: '📚' },
      tsundere: { id: 'tsundere', name: 'Tsundere Librarian', emoji: '😤' },
      custom: { id: 'custom', name: 'Custom', emoji: '✏️' },
    }
    return presets[id] ?? null
  } catch {
    return null
  }
}
