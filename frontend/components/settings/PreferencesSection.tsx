'use client'

/**
 * PreferencesSection — user preferences (dashboard toggles, learning,
 * reader sidebar, per-content-type tabs, reading moments).
 *
 * Props-taking extraction: prefs and setPref live on the parent (they
 * come from Supabase via settingsQueries), so this section takes them
 * as props rather than owning them. Also gets autoCover/setAutoCover
 * for the "auto-generate cover art" toggle.
 *
 * The PrefSection/PrefToggle/CustomUrlList/TabsByTypeEditor helpers all
 * moved in with this section since nothing else uses them.
 *
 * See ScoreBarsSection for the zero-props extraction pattern (task #5).
 */

import { useRef, useState } from 'react'
import { Layers } from 'lucide-react'
import type { UserPrefs } from '@/lib/queries/types'
import { SERENDIPITY_SOURCES } from '@/lib/queries/types'
import { DEFAULT_TABS_BY_TYPE } from '@/components/PageSidebar'

interface PreferencesSectionProps {
  prefs: UserPrefs
  setPref: <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => void
  autoCover: boolean
  setAutoCover: (v: boolean) => void
  autoCoverStorageKey: string
}

const CONTENT_TYPES = [
  { id: 'fiction',           label: 'Fiction' },
  { id: 'biography',         label: 'Biography' },
  { id: 'textbook',          label: 'Textbook' },
  { id: 'math_textbook',     label: 'Math' },
  { id: 'academic_paper',    label: 'Academic' },
  { id: 'wikipedia_article', label: 'Wikipedia' },
  { id: 'news_article',      label: 'News' },
  { id: 'forum_thread',      label: 'Forum' },
  { id: 'essay',             label: 'Essay' },
  { id: 'reference',         label: 'Reference' },
] as const

const TAB_IDS = [
  { id: 'chat',       label: 'Chat' },
  { id: 'bookmarks',  label: 'Bookmarks' },
  { id: 'characters', label: 'Chars/Struct' },
  { id: 'images',     label: 'Images' },
  { id: 'quiz',       label: 'Quiz' },
] as const

function PrefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {children}
      </div>
    </div>
  )
}

function PrefToggle({
  label, description, checked, onChange,
}: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={e => { e.preventDefault(); onChange(!checked) }}
        className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </label>
  )
}

function CustomUrlList({ urls, onChange }: { urls: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const trimmed = input.trim()
    if (!trimmed || urls.includes(trimmed)) { setInput(''); return }
    onChange([...urls, trimmed])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom image URLs</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">Direct links to images mixed in with other sources.</p>
      {urls.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">{url}</span>
          <button onClick={() => onChange(urls.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 flex-shrink-0 text-xs">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
          placeholder="https://example.com/image.jpg"
          className="input text-xs py-1 flex-1 min-w-0"
        />
        <button onClick={add} className="btn btn-secondary text-xs py-1 px-3 flex-shrink-0">Add</button>
      </div>
    </div>
  )
}

function TabsByTypeEditor({ value, onChange }: { value: Record<string, string[]>; onChange: (v: Record<string, string[]>) => void }) {
  const toggle = (typeId: string, tabId: string) => {
    const current: string[] = value[typeId] ?? DEFAULT_TABS_BY_TYPE[typeId] ?? TAB_IDS.map(t => t.id)
    const next = current.includes(tabId) ? current.filter(t => t !== tabId) : [...current, tabId]
    const ordered = TAB_IDS.map(t => t.id).filter(t => next.includes(t))
    onChange({ ...value, [typeId]: ordered })
  }
  const resetType = (typeId: string) => {
    const next = { ...value }
    delete next[typeId]
    onChange(next)
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Layers size={11} />
        Sidebar Tabs by Content Type
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400 w-24">Type</th>
              {TAB_IDS.map(tab => (
                <th key={tab.id} className="px-2 py-2 font-medium text-gray-500 dark:text-gray-400 text-center whitespace-nowrap">{tab.label}</th>
              ))}
              <th className="px-2 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {CONTENT_TYPES.map(({ id: typeId, label }) => {
              const effectiveTabs: string[] = value[typeId] ?? DEFAULT_TABS_BY_TYPE[typeId] ?? TAB_IDS.map(t => t.id)
              const isCustom = !!value[typeId]
              return (
                <tr key={typeId} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {label}
                    {isCustom && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block align-middle" />}
                  </td>
                  {TAB_IDS.map(tab => (
                    <td key={tab.id} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={effectiveTabs.includes(tab.id)}
                        onChange={() => toggle(typeId, tab.id)}
                        className="rounded cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    {isCustom && (
                      <button onClick={() => resetType(typeId)} title="Reset to defaults" className="text-[10px] text-gray-400 hover:text-indigo-500">reset</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PreferencesSection({ prefs, setPref, autoCover, setAutoCover, autoCoverStorageKey }: PreferencesSectionProps) {
  return (
    <div className="space-y-6">
      <PrefSection title="Dashboard">
        <PrefToggle
          label="Classic Library"
          description="Show the public domain classics section at the bottom of your library."
          checked={prefs.show_classics_library}
          onChange={v => setPref('show_classics_library', v)}
        />
        <PrefToggle
          label="Daily Prompt"
          description="Show the 'Dive Back In' reading suggestion above your library."
          checked={prefs.show_daily_prompt ?? true}
          onChange={v => setPref('show_daily_prompt', v)}
        />
        <PrefToggle
          label="Per-device feeds"
          description="Keep your pinned feeds local to this device instead of syncing them across devices."
          checked={prefs.feeds_per_device ?? false}
          onChange={v => setPref('feeds_per_device', v)}
        />
        <PrefToggle
          label="Auto-generate cover art"
          description="Automatically generate an AI cover image when you add a new book."
          checked={autoCover}
          onChange={v => {
            setAutoCover(v)
            try { localStorage.setItem(autoCoverStorageKey, String(v)) } catch { /* ignore */ }
          }}
        />
      </PrefSection>

      <PrefSection title="Learning">
        <PrefToggle
          label="Knowledge Graph tab"
          description="Show the knowledge graph tab for textbooks and papers in the reader sidebar."
          checked={prefs.sidebar_graph ?? true}
          onChange={v => setPref('sidebar_graph', v)}
        />
        <PrefToggle
          label="Auto-build Knowledge Graph"
          description="Automatically extract the topic graph when you open a nonfiction book for the first time."
          checked={prefs.auto_build_graph ?? false}
          onChange={v => setPref('auto_build_graph', v)}
        />
      </PrefSection>

      <PrefSection title="Reader Sidebar">
        <PrefToggle
          label="Chat"
          description="AI chat panel for discussing the text."
          checked={prefs.sidebar_chat ?? true}
          onChange={v => setPref('sidebar_chat', v)}
        />
        <PrefToggle
          label="Bookmarks"
          description="Page bookmarks and notes panel."
          checked={prefs.sidebar_bookmarks ?? true}
          onChange={v => setPref('sidebar_bookmarks', v)}
        />
        <PrefToggle
          label="Images"
          description="AI image generation panel."
          checked={prefs.sidebar_images ?? true}
          onChange={v => setPref('sidebar_images', v)}
        />
        <PrefToggle
          label="Quizzes"
          description="AI-generated comprehension quiz panel."
          checked={prefs.sidebar_quiz ?? true}
          onChange={v => setPref('sidebar_quiz', v)}
        />
      </PrefSection>

      <TabsByTypeEditor
        value={prefs.sidebar_tabs_by_type ?? {}}
        onChange={(v: Record<string, string[]>) => setPref('sidebar_tabs_by_type', v as any)}
      />

      <PrefSection title="Reading Moments">
        <PrefToggle
          label="Serendipity images"
          description="Occasionally show a fun image between page flips — dogs, space photos, xkcd comics, and more."
          checked={prefs.serendipity_enabled ?? false}
          onChange={v => setPref('serendipity_enabled', v)}
        />
        {(prefs.serendipity_enabled ?? false) && (
          <div className="px-4 py-3 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sources</p>
              <div className="grid grid-cols-2 gap-2">
                {SERENDIPITY_SOURCES.map(src => {
                  const enabled = (prefs.serendipity_sources ?? []).includes(src.id)
                  return (
                    <label key={src.id} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={e => {
                          const current = prefs.serendipity_sources ?? []
                          const next = e.target.checked
                            ? [...current, src.id]
                            : current.filter(s => s !== src.id)
                          setPref('serendipity_sources', next as any)
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300" title={src.description}>{src.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Every</label>
              <select
                value={prefs.serendipity_frequency ?? 3}
                onChange={e => setPref('serendipity_frequency', parseInt(e.target.value) as any)}
                className="input text-sm py-1 w-28"
              >
                {[3, 5, 10, 15, 20, 30, 50].map(n => (
                  <option key={n} value={n}>{n} pages</option>
                ))}
              </select>
            </div>
            <CustomUrlList
              urls={prefs.serendipity_custom_urls ?? []}
              onChange={next => setPref('serendipity_custom_urls', next as any)}
            />
          </div>
        )}
      </PrefSection>
    </div>
  )
}
