'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { getMedium } from '@/lib/correlate/media'
import {
  AXIS_LIST, DEFAULT_WEIGHT, WEIGHT_HINTS, WEIGHT_LABELS, axisValue, isNeutral,
  tuningSummary, weightOf, type MediumWeight, type Tuning, type TuningAxisId,
} from '@/lib/correlate/tuning'
import type { MediumId } from '@/lib/correlate/types'

const WEIGHTS: MediumWeight[] = [0, 1, 2, 3]

/**
 * What the player asks of their partner, changeable between any two turns.
 *
 * This is the control for the one thing the two registries could not express:
 * proportion. "Mostly music, with an occasional stretch or art piece" was
 * previously only sayable by picking a different game, and the music-only tier that
 * would have made it sayable is exactly what this section deleted. So it becomes a
 * weighting instead of a game — which also makes it adjustable mid-game, and
 * adjustable mid-game is the better version: what you want from a partner changes
 * over twenty turns.
 *
 * Collapsed by default and summarised in one line, because a panel of controls open
 * above the composer would make the game look like a settings screen.
 */
export default function TuningPanel({
  media,
  tuning,
  onChange,
  accentText,
  disabled,
}: {
  media: MediumId[]
  tuning: Tuning
  onChange: (next: Tuning) => void
  accentText: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const summary = useMemo(() => tuningSummary(tuning, media), [tuning, media])
  const neutral = isNeutral(tuning)

  const setWeight = (medium: MediumId, weight: MediumWeight) => {
    const weights = { ...tuning.weights }
    if (weight === DEFAULT_WEIGHT) delete weights[medium]
    else weights[medium] = weight
    onChange({ ...tuning, weights })
  }

  const setAxis = (id: TuningAxisId, value: number) => {
    const axes = { ...tuning.axes }
    const axis = AXIS_LIST.find(a => a.id === id)!
    if (value === axis.neutral) delete axes[id]
    else axes[id] = value
    onChange({ ...tuning, axes })
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
      >
        <SlidersHorizontal size={14} className={accentText} />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Your partner</span>
        <span className="ml-auto flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[11rem]">
            {neutral ? 'unweighted' : summary}
          </span>
          <ChevronDown
            size={13}
            className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-4">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            This changes what your partner reaches <em>for</em>. It never changes what makes a
            connection hold, and it takes effect on your next move.
          </p>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              What it answers in
            </p>
            <ul className="space-y-1.5">
              {media.map(id => {
                const medium = getMedium(id)
                const current = weightOf(tuning, id)
                return (
                  <li key={id} className="flex items-center gap-2">
                    <span
                      title={medium?.provider}
                      className={`text-xs w-[5.5rem] flex-shrink-0 truncate ${
                        current === 0
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {medium?.plural ?? id}
                    </span>
                    <span className="flex gap-0.5 flex-wrap">
                      {WEIGHTS.map(w => (
                        <button
                          key={w}
                          disabled={disabled}
                          onClick={() => setWeight(id, w)}
                          title={WEIGHT_HINTS[w]}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors disabled:opacity-50 ${
                            current === w
                              ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                          }`}
                        >
                          {WEIGHT_LABELS[w]}
                        </button>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
              Turning one off only stops your partner answering there. It stays yours to play.
            </p>
          </div>

          <div className="space-y-3">
            {AXIS_LIST.map(axis => {
              const value = axisValue(tuning, axis.id)
              return (
                <div key={axis.id}>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{axis.name}</p>
                    <p className={`text-[11px] ml-auto ${value === axis.neutral ? 'text-gray-400 dark:text-gray-500' : accentText}`}>
                      {axis.labels[value]}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mb-1">{axis.does}</p>
                  <input
                    type="range"
                    min={0}
                    max={axis.labels.length - 1}
                    step={1}
                    value={value}
                    disabled={disabled}
                    onChange={e => setAxis(axis.id, Number(e.target.value))}
                    aria-label={axis.name}
                    className="w-full accent-gray-700 dark:accent-gray-300 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                    <span>{axis.low}</span>
                    <span>{axis.high}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {!neutral && (
            <button
              onClick={() => onChange({ weights: {}, axes: {} })}
              disabled={disabled}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw size={11} /> Back to unweighted
            </button>
          )}
        </div>
      )}
    </div>
  )
}
