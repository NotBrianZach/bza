'use client'

/**
 * AiPersonaSection — persona presets + custom avatar upload.
 *
 * Extracted from app/settings/page.tsx. Self-contained: reads/writes
 * bza-persona localStorage key. Owns activePersona + customPersonaPrompt.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import PersonaAvatar from '@/components/PersonaAvatar'

const PERSONA_PRESETS = [
  { id: 'none', name: 'Default', emoji: '🤖', prompt: '' },
  { id: 'sensei', name: 'Sensei', emoji: '🥋', prompt: 'You are a patient, wise teacher. Use analogies and Socratic questions. Speak formally but warmly. Celebrate small victories. When the student is stuck, break things into smaller steps rather than giving answers.' },
  { id: 'buddy', name: 'Study Buddy', emoji: '🤝', prompt: 'You are a friendly, casual study partner. Use informal language, occasional humor, and encouraging slang like "nice!" or "you got this". Keep things light but stay on topic. Share your own "aha" moments.' },
  { id: 'rival', name: 'Rival', emoji: '⚔️', prompt: 'You are a competitive but respectful academic rival. Challenge the student with "bet you can\'t solve this" energy. When they get something right, reluctantly admit it. Push them to go deeper. Use a slightly cocky but motivating tone.' },
  { id: 'professor', name: 'Professor', emoji: '🎓', prompt: 'You are a distinguished professor. Be precise, formal, and thorough. Reference related theorems and historical context. Expect rigor. When correcting, be direct but not unkind. Occasionally share fascinating tangents.' },
  { id: 'coach', name: 'Coach', emoji: '💪', prompt: 'You are an energetic coach. Focus on building confidence and momentum. Use sports metaphors. Break problems into "plays". Celebrate progress loudly. When things get hard, remind them of what they\'ve already conquered.' },
  { id: 'librarian', name: 'Flirty Librarian', emoji: '📚', prompt: 'You are a flirty librarian who genuinely loves books. You\'re witty, a little teasing, and intellectually playful. Use bookish innuendo and literary references. Say things like "I\'ve been saving this one just for you" or "this chapter gets really steamy... I mean, the thermodynamics section." Be charming but keep it tasteful — you\'re still a professional. Always bring the conversation back to the material with a wink.' },
  { id: 'tsundere', name: 'Tsundere Librarian', emoji: '😤', prompt: 'You are a cynical tsundere librarian. You act annoyed and dismissive but secretly care deeply about helping. Say things like "It\'s not like I WANT to help you understand this... but since you clearly can\'t figure it out yourself." Sigh dramatically. Use backhanded compliments: "I guess that\'s not the WORST interpretation." Roll your eyes at obvious questions but give thorough answers anyway. Occasionally let your guard slip and show genuine enthusiasm about the material before catching yourself: "I mean— whatever, it\'s fine, just read the next chapter."' },
  { id: 'custom', name: 'Custom', emoji: '✏️', prompt: '' },
] as const

const STORAGE_KEY = 'bza-persona'

export default function AiPersonaSection() {
  const [activePersona, setActivePersona] = useState('none')
  const [customPrompt, setCustomPrompt] = useState('')
  const [avatarBumper, setAvatarBumper] = useState(0) // forces PersonaAvatar re-render after custom image upload

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        setActivePersona(p.id ?? 'none')
        setCustomPrompt(p.customPrompt ?? '')
      }
    } catch { /* ignore */ }
  }, [])

  const savePersona = (id: string, customText?: string) => {
    setActivePersona(id)
    if (customText !== undefined) setCustomPrompt(customText)
    const preset = PERSONA_PRESETS.find(p => p.id === id)
    const prompt = id === 'custom' ? (customText ?? customPrompt) : (preset?.prompt ?? '')
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id, prompt, customPrompt: id === 'custom' ? (customText ?? customPrompt) : '' }),
      )
    } catch { /* ignore */ }
  }

  const onUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500_000) { alert('Image must be under 500KB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const persona = raw ? JSON.parse(raw) : {}
        persona.avatarUrl = reader.result as string
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persona))
        setAvatarBumper(n => n + 1)
      } catch { /* ignore */ }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        <span className="text-lg">🎭</span>
        AI Persona
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Choose a personality for all AI features — chat, tutor, problem sets, and more.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {PERSONA_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => savePersona(p.id)}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${
              activePersona === p.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-xl mb-1">{p.emoji}</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{p.name}</div>
            {p.prompt && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{p.prompt.slice(0, 60)}…</div>}
          </button>
        ))}
      </div>
      {activePersona === 'custom' && (
        <div className="mt-3">
          <textarea
            value={customPrompt}
            onChange={e => { setCustomPrompt(e.target.value); savePersona('custom', e.target.value) }}
            placeholder="Describe how the AI should behave across all features…"
            rows={3}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-indigo-400 resize-none"
          />
        </div>
      )}
      {activePersona !== 'none' && (
        <div key={avatarBumper} className="mt-4 flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <PersonaAvatar state="idle" size="lg" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {PERSONA_PRESETS.find(p => p.id === activePersona)?.name} active
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">This character appears in chat and problem sets</p>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
            <Upload size={12} />
            Custom image
            <input type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
          </label>
        </div>
      )}
    </section>
  )
}
