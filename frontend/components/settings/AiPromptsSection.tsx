'use client'

/**
 * AiPromptsSection — per-feature custom AI prompt overrides.
 *
 * Extracted from app/settings/page.tsx. Self-contained: localStorage-only.
 * Owns draft + saved dicts and a transient "Saved" indicator per field.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'

const PROMPT_FIELDS = [
  { key: 'dive-in', label: 'Dive Back In', description: 'The re-engagement prompt shown on your home page', placeholder: 'e.g. be more sarcastic, use movie references, sound like a pirate…', default: 'Be encouraging and reference specific details from where I left off. Keep the tone warm and curious.' },
  { key: 'tutor', label: 'AI Tutor', description: 'Tutor chat in the sidebar while reading', placeholder: 'e.g. be a stern Socratic professor, use analogies from cooking…', default: 'Ask Socratic questions to guide my thinking rather than giving direct answers. Be concise and reference the current passage.' },
  { key: 'typst', label: 'Math / LaTeX AI', description: 'Problem set generator in the Math AI tab', placeholder: 'e.g. always include step-by-step derivations, prefer matrix notation…', default: 'Always show step-by-step derivations and explain the intuition behind each step. Include both easy and harder variants.' },
  { key: 'image', label: 'Cover Art', description: 'Style applied when generating book covers', placeholder: 'e.g. always use watercolour style, no text in images, dark moody tones…', default: 'Atmospheric illustration style, rich muted tones, no text or lettering in the image.' },
] as const

const STORAGE_KEY = 'bza-custom-prompts'

export default function AiPromptsSection() {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, string>>({})
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : {}
      setSaved(parsed)
      const nextDrafts: Record<string, string> = {}
      for (const f of PROMPT_FIELDS) nextDrafts[f.key] = parsed[f.key] ?? f.default
      setDrafts(nextDrafts)
    } catch { /* ignore */ }
  }, [])

  const savePrompt = (key: string) => {
    const value = drafts[key] ?? ''
    const next = { ...saved, [key]: value }
    setSaved(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setJustSaved(p => ({ ...p, [key]: true }))
    setTimeout(() => setJustSaved(p => ({ ...p, [key]: false })), 2000)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        <SlidersHorizontal size={15} className="text-indigo-500" />
        Custom AI Prompts
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Per-feature overrides — these are appended after the persona. Saved locally in your browser.
      </p>
      <div className="space-y-5">
        {PROMPT_FIELDS.map(({ key, label, description, placeholder }) => {
          const draft = drafts[key] ?? ''
          const savedValue = saved[key] ?? ''
          const isDirty = draft !== savedValue
          const savedRecently = justSaved[key]
          return (
            <div key={key}>
              <div className="flex items-start justify-between mb-1 gap-2">
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {savedValue.trim() && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 align-middle" />
                    )}
                  </span>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{description}</p>
                </div>
                <button
                  onClick={() => savePrompt(key)}
                  disabled={!isDirty && !savedRecently}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                    savedRecently
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : isDirty
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                      : 'text-gray-300 dark:text-gray-600 cursor-default'
                  }`}
                >
                  {savedRecently ? <><Check size={11} /> Saved</> : 'Save'}
                </button>
              </div>
              <textarea
                rows={2}
                value={draft}
                onChange={e => setDrafts(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
