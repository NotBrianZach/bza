'use client'

/**
 * ScoreBarsSection — Book Score Bars settings section.
 *
 * Extracted from app/settings/page.tsx (was ~113 lines inline + ~40 lines of
 * state and handlers scattered elsewhere in the parent). Self-contained:
 * localStorage-only, no cross-section dependencies.
 *
 * First step of the god-component refactor pattern for settings/page.tsx
 * (task #5). Model: each section owns its state, mounts on load, persists
 * via imported helpers. Parent renders `<ScoreBarsSection />` with no props.
 */

import { useEffect, useState } from 'react'
import { BarChart2, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import type { ScoreBar } from '@/types'
import { getScoreBars, saveScoreBars, getScoreModel, saveScoreModel, SCORE_MODELS } from '@/lib/queries/scores'

const EMPTY_BAR: Omit<ScoreBar, 'id'> = { label: '', prompt: '', leftLabel: '', rightLabel: '', enabled: true }

export default function ScoreBarsSection() {
  const [scoreBars, setScoreBars] = useState<ScoreBar[]>([])
  const [scoreModel, setScoreModel] = useState('gpt-4o-mini')
  const [newBar, setNewBar] = useState<Omit<ScoreBar, 'id'>>(EMPTY_BAR)
  const [editingBarId, setEditingBarId] = useState<string | null>(null)

  useEffect(() => {
    setScoreBars(getScoreBars())
    setScoreModel(getScoreModel())
  }, [])

  const updateScoreBars = (next: ScoreBar[]) => {
    setScoreBars(next)
    saveScoreBars(next)
  }

  const addScoreBar = () => {
    if (!newBar.label.trim() || !newBar.prompt.trim()) return
    if (editingBarId) {
      updateScoreBars(scoreBars.map(b => b.id === editingBarId ? { ...newBar, id: editingBarId } : b))
      setEditingBarId(null)
    } else {
      updateScoreBars([...scoreBars, { ...newBar, id: Date.now().toString() }])
    }
    setNewBar(EMPTY_BAR)
  }

  const startEditBar = (bar: ScoreBar) => {
    setEditingBarId(bar.id)
    setNewBar({ label: bar.label, prompt: bar.prompt, leftLabel: bar.leftLabel ?? '', rightLabel: bar.rightLabel ?? '', enabled: bar.enabled })
  }

  const cancelEditBar = () => {
    setEditingBarId(null)
    setNewBar(EMPTY_BAR)
  }

  const updateScoreModel = (model: string) => {
    setScoreModel(model)
    saveScoreModel(model)
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
        <BarChart2 size={15} className="text-indigo-500" />
        Book Score Bars
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        AI-generated rating bars shown under each book. Scored automatically when you add a book.
        Each bar costs ~1 AI call. Saved locally in your browser.
      </p>

      {/* Model selector */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Model</label>
        <select
          value={scoreModel}
          onChange={e => updateScoreModel(e.target.value)}
          className="input text-xs py-1 flex-1"
        >
          {SCORE_MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Existing bars */}
      {scoreBars.length > 0 && (
        <div className="space-y-2 mb-4">
          {scoreBars.map(bar => (
            <div key={bar.id} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{bar.label}</span>
                  {bar.leftLabel && bar.rightLabel && (
                    <span className="text-[10px] text-gray-400">{bar.leftLabel} → {bar.rightLabel}</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{bar.prompt}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => updateScoreBars(scoreBars.map(b => b.id === bar.id ? { ...b, enabled: !b.enabled } : b))}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                    bar.enabled
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                  }`}
                >
                  {bar.enabled ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => startEditBar(bar)}
                  className="text-gray-300 hover:text-indigo-500 dark:text-gray-600 dark:hover:text-indigo-400 transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => updateScoreBars(scoreBars.filter(b => b.id !== bar.id))}
                  className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit bar form */}
      <div className={`space-y-2 border rounded-lg p-3 ${editingBarId ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-900/10' : 'border-dashed border-gray-300 dark:border-gray-600'}`}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{editingBarId ? 'Edit score bar' : 'Add a score bar'}</p>
          {editingBarId && (
            <button onClick={cancelEditBar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={13} /></button>
          )}
        </div>
        <input
          value={newBar.label}
          onChange={e => setNewBar(b => ({ ...b, label: e.target.value }))}
          placeholder="Label (e.g. Worth reading?)"
          className="w-full input text-xs py-1"
        />
        <textarea
          value={newBar.prompt}
          onChange={e => setNewBar(b => ({ ...b, prompt: e.target.value }))}
          placeholder="Prompt (e.g. On a scale of 0–100, how worth reading is this? 0 = skip, 100 = must read)"
          rows={2}
          className="w-full text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <div className="flex gap-2">
          <input
            value={newBar.leftLabel}
            onChange={e => setNewBar(b => ({ ...b, leftLabel: e.target.value }))}
            placeholder="Left label (e.g. Left)"
            className="flex-1 input text-xs py-1 min-w-0"
          />
          <input
            value={newBar.rightLabel}
            onChange={e => setNewBar(b => ({ ...b, rightLabel: e.target.value }))}
            placeholder="Right label (e.g. Right)"
            className="flex-1 input text-xs py-1 min-w-0"
          />
        </div>
        <button
          onClick={addScoreBar}
          disabled={!newBar.label.trim() || !newBar.prompt.trim()}
          className="flex items-center gap-1 btn btn-secondary text-xs py-1.5 disabled:opacity-40"
        >
          {editingBarId ? <><Check size={12} /> Save Changes</> : <><Plus size={12} /> Add Bar</>}
        </button>
      </div>
    </section>
  )
}
