'use client'

import { Volume2, VolumeX, BookDown, Loader2 } from 'lucide-react'

// Header bar for the "translated" pane in BookReader — shows the source
// language label, narration play/stop toggle, and save-as-book action.
export function TranslatedPaneHeader({ label, narrating, onNarrate, saving, savedId, onSave }: {
  label: string; narrating: boolean; onNarrate: () => void
  saving: boolean; savedId: number | null; onSave: () => void
}) {
  return (
    <div className="flex items-center gap-2 mb-4 not-prose">
      <span className="text-xs font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide flex-1 truncate">{label || 'Translated'}</span>
      <button onClick={onNarrate} title={narrating ? 'Stop reading' : 'Read aloud'} className={`btn btn-secondary p-1 ${narrating ? 'bg-green-50 dark:bg-green-900/30 border-green-300 text-green-600' : ''}`}>
        {narrating ? <VolumeX size={13} /> : <Volume2 size={13} />}
      </button>
      {savedId ? (
        <a href={`/books/${savedId}`} className="btn btn-secondary text-xs px-2 py-1 whitespace-nowrap text-blue-600 dark:text-blue-400 border-blue-300">Open book →</a>
      ) : (
        <button onClick={onSave} disabled={saving} className="btn btn-secondary text-xs px-2 py-1 whitespace-nowrap flex items-center gap-1 disabled:opacity-40">
          {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : <><BookDown size={11} /> Save</>}
        </button>
      )}
    </div>
  )
}
