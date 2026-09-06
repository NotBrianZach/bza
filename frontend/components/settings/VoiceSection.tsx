'use client'

/**
 * VoiceSection — TTS engine selection (browser vs ElevenLabs).
 *
 * Extracted from app/settings/page.tsx. Self-contained via lib/persona
 * helpers (bza-tts-engine localStorage key).
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'
import { getTtsEngine, setTtsEngine } from '@/lib/persona'

type Engine = 'browser' | 'elevenlabs'

export default function VoiceSection() {
  const [engine, setEngine] = useState<Engine>('browser')

  useEffect(() => {
    try {
      // getTtsEngine reads the same key from localStorage; safe on mount
      setEngine(getTtsEngine())
    } catch { /* ignore */ }
  }, [])

  const pick = (e: Engine) => { setEngine(e); setTtsEngine(e) }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        🔊 Librarian Voice
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Choose how the AI reads responses aloud. Each persona has a unique voice.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => pick('browser')}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            engine === 'browser'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Browser Voice</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Free · Built-in Web Speech API</div>
          <div className="text-[10px] text-gray-400">Robotic but instant, works offline</div>
        </button>
        <button
          onClick={() => pick('elevenlabs')}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            engine === 'elevenlabs'
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">AI Voice</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Natural, human-like voices</div>
          <div className="text-[10px] text-gray-400">Unique voice per persona</div>
        </button>
      </div>
      {engine === 'elevenlabs' && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Voice per persona:</strong></p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
            <span>🥋 Sensei → Onyx (deep, calm)</span>
            <span>🤝 Buddy → Nova (friendly)</span>
            <span>⚔️ Rival → Echo (sharp)</span>
            <span>🎓 Professor → Fable (British)</span>
            <span>💪 Coach → Alloy (energetic)</span>
            <span>📚 Librarian → Shimmer (warm)</span>
            <span>😤 Tsundere → Nova (sharp)</span>
          </div>
        </div>
      )}
    </section>
  )
}
