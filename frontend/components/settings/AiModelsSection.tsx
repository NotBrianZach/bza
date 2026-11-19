'use client'

/**
 * AiModelsSection — model selector per AI feature (chat, problemSet, libraryChat).
 *
 * Extracted from app/settings/page.tsx. Self-contained: bza-model-choices
 * localStorage key. Owns the modelChoices dict.
 *
 * See ScoreBarsSection for the extraction pattern (task #5).
 */

import { useEffect, useState } from 'react'

/**
 * The models offered per feature.
 *
 * An id with a slash routes to OpenRouter and one without goes to OpenAI —
 * `getModelChoice` in lib/persona.ts infers the provider from exactly that, and
 * the API routes pass whatever arrives straight through. There is no allowlist
 * on the server, so an id that is wrong here is a 404 the user sees.
 *
 * Which makes these ids worth checking against the provider rather than
 * remembering. Every one below was confirmed with a live call on 2026-11-19;
 * `curl https://openrouter.ai/api/v1/models` lists the text catalogue, but note
 * it is NOT the whole truth in either direction — it omits image models that
 * work fine, and it lists canonical ids while accepting dashed aliases
 * (`anthropic/claude-haiku-4-5` is served as `claude-haiku-4.5`). A 404 from a
 * real request is the only reliable test.
 *
 * `anthropic/claude-sonnet-4` used to sit here as "Best quality" and had gone
 * 404 — "no longer available on OpenRouter: no provider serves this model".
 * Anyone who picked it got an error, so it is now Sonnet 5.
 */
const AI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', desc: 'Fast & cheap', tier: 'free' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', desc: 'Smarter, slower', tier: 'free' },
  { id: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'openrouter', desc: 'Fast, great at reading', tier: 'free' },
  { id: 'anthropic/claude-sonnet-5', label: 'Claude Sonnet 5', provider: 'openrouter', desc: 'Best quality', tier: 'free' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'openrouter', desc: 'Google, fast', tier: 'free' },
  /*
   * DeepSeek, via OpenRouter. Both carry a 1M context and cost a fraction of
   * the rest — Flash is $0.05/$0.20 per million against Haiku's $1/$5.
   *
   * One behaviour worth knowing before wiring either into a new call path:
   * they spend roughly 40 completion tokens of preamble before the answer, and
   * the upstream providers return `content: null` rather than partial text when
   * that runs into `max_tokens`. Below about 50 you get nothing at all. Every
   * route here budgets 600 or more, so this is safe as it stands, but a
   * low-max_tokens call added later would fail in a way that looks like an
   * empty reply rather than an error.
   */
  { id: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', provider: 'openrouter', desc: 'Cheapest, huge context', tier: 'free' },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro', provider: 'openrouter', desc: 'Strong reasoning, low cost', tier: 'free' },
] as const

const MODEL_FEATURES = [
  { key: 'chat', label: 'Book Chat', desc: 'Sidebar tutor / Q&A' },
  { key: 'problemSet', label: 'Problem Set', desc: 'Hints, solutions, format working' },
  { key: 'libraryChat', label: 'Library Chat', desc: 'Cross-book intelligence' },
] as const

const STORAGE_KEY = 'bza-model-choices'

const DEFAULTS: Record<string, string> = {
  chat: 'gpt-4o-mini',
  problemSet: 'gpt-4o-mini',
  libraryChat: 'anthropic/claude-haiku-4-5',
}

export default function AiModelsSection() {
  const [choices, setChoices] = useState<Record<string, string>>(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setChoices(prev => ({ ...prev, ...JSON.parse(raw) }))
    } catch { /* ignore */ }
  }, [])

  const save = (feature: string, modelId: string) => {
    const next = { ...choices, [feature]: modelId }
    setChoices(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        ⚡ AI Models
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Choose which model powers each feature. Pro models use more credits.
      </p>
      <div className="space-y-4">
        {MODEL_FEATURES.map(({ key, label, desc }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {AI_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => save(key, m.id)}
                  className={`px-2.5 py-2 rounded-lg border text-left text-xs transition-colors ${
                    choices[key] === m.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
