'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { ACCENT_CLASSES, MODE_LIST } from '@/lib/listen/modes'
import type { ListenMode, ListenModeId } from '@/lib/listen/types'

const JUDGE_LABEL: Record<ListenMode['judge'], string> = {
  features: 'Strict — the link is checked against Spotify metadata',
  player: 'Social — you judge the connection',
  narrator: 'Story — an interpreter turns the choice into an event',
}

/**
 * Start a new game.
 *
 * Each card shows what a song *is* in that mode and who interprets it, because
 * that pairing is what actually changes play — the same songs produce very
 * different games depending on who gets to read them. The six pieces are one
 * click away rather than hidden.
 */
export default function ModePicker({ onStart, starting }: {
  onStart: (mode: ListenModeId) => void
  starting: ListenModeId | null
}) {
  const [open, setOpen] = useState<ListenModeId | null>(null)

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {MODE_LIST.map(mode => {
        const accent = ACCENT_CLASSES[mode.accent]
        const expanded = open === mode.id
        return (
          <div key={mode.id} className={`rounded-2xl border ${accent.ring} bg-white dark:bg-gray-800 overflow-hidden flex flex-col`}>
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{mode.name}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${accent.chip}`}>
                  {mode.judge}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{mode.tagline}</p>

              <dl className="mt-3 space-y-1.5">
                <div className="flex gap-2 text-xs">
                  <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">A song is</dt>
                  <dd className="text-gray-700 dark:text-gray-300">{mode.songIs}</dd>
                </div>
                <div className="flex gap-2 text-xs">
                  <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">Read by</dt>
                  <dd className="text-gray-700 dark:text-gray-300">{JUDGE_LABEL[mode.judge]}</dd>
                </div>
              </dl>

              <button
                onClick={() => setOpen(o => (o === mode.id ? null : mode.id))}
                className="mt-3 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-expanded={expanded}
              >
                <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Hide the rules' : 'The six pieces'}
              </button>

              {expanded && (
                <dl className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                  {([
                    ['Your move', mode.pieces.playerMove],
                    ['Interpreter', mode.pieces.interpreter],
                    ['Response', mode.pieces.responseRule],
                    ['Persists', mode.pieces.worldState],
                    ['Constraint', mode.pieces.constraint],
                    ['Goal', mode.pieces.goal],
                  ] as const).map(([label, text]) => (
                    <div key={label}>
                      <dt className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</dt>
                      <dd className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <button
              onClick={() => onStart(mode.id)}
              disabled={starting !== null}
              className={`flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-sm font-medium border-t ${accent.ring} ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110 transition-all disabled:opacity-50`}
            >
              {starting === mode.id
                ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
                : <><Plus size={14} /> Play {mode.name}</>}
            </button>
          </div>
        )
      })}
    </div>
  )
}
