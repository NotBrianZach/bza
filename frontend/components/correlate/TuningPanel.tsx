'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Info, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { getMedium } from '@/lib/correlate/media'
import {
  AXIS_LIST, DEFAULT_SHARE, MUTED_SHARE, SHARE_MAX, allShares, axisValue, continuationOf,
  isProportioned, isUntouched, shareLabel, tuningSummary, type Tuning, type TuningAxisId,
} from '@/lib/correlate/tuning'
import {
  CONTINUATION_HINTS, CONTINUATION_LABELS, CONTINUATION_OFF, CONTINUATION_STOPS,
} from '@/lib/correlate/continuation'
import { facetsFor, scopableMedia, selectedOptions, type Scopes } from '@/lib/correlate/scope'
import type { MediumId } from '@/lib/correlate/types'
import PresetPicker from './PresetPicker'

/** Snap points on the share slider. Fine-grained values are allowed; these are
 *  just where a drag settles, so a one-pixel wobble does not change a number. */
const SHARE_STEP = 5

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
  /** Which medium's facets are expanded. One at a time — twelve open at once is a wall. */
  const [openScope, setOpenScope] = useState<MediumId | null>(null)
  const summary = useMemo(() => tuningSummary(tuning, media), [tuning, media])
  // `isUntouched`, not `isNeutral`: continuation never reaches the interpreter, so
  // it is not part of the weighting — but it is something the player set, and a
  // reset button that hid itself while it was on would be lying.
  const neutral = isUntouched(tuning)
  const scopes: Scopes = tuning.scopes ?? {}
  const carry = continuationOf(tuning)
  const narrowable = useMemo(() => scopableMedia(media), [media])

  /** Every medium's raw share plus the proportion it works out to. */
  const shares = useMemo(() => allShares(tuning, media), [tuning, media])
  const proportioned = isProportioned(tuning)

  const setShare = (medium: MediumId, share: number) => {
    const next = { ...tuning.shares }
    // Dropping a value equal to the default keeps the stored object canonical, so
    // "nobody has touched this" stays a key count rather than a comparison.
    if (share === DEFAULT_SHARE) delete next[medium]
    else next[medium] = share
    onChange({ ...tuning, shares: next })
  }

  const setAxis = (id: TuningAxisId, value: number) => {
    const axes = { ...tuning.axes }
    const axis = AXIS_LIST.find(a => a.id === id)!
    if (value === axis.neutral) delete axes[id]
    else axes[id] = value
    onChange({ ...tuning, axes })
  }

  /**
   * Toggle one option of one facet.
   *
   * Pruning empty facets and empty media as it goes keeps the stored value in the
   * shape `normalizeScopes` would produce, so what the controls hold and what the
   * database holds never differ — and `isNeutral` stays a key count.
   */
  const toggleOption = (medium: MediumId, facetId: string, optionId: string) => {
    const next: Scopes = { ...scopes }
    const forMedium = { ...(next[medium] ?? {}) }
    const current = forMedium[facetId] ?? []

    const chosen = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId]

    if (chosen.length === 0) delete forMedium[facetId]
    else forMedium[facetId] = chosen

    if (Object.keys(forMedium).length === 0) delete next[medium]
    else next[medium] = forMedium

    onChange({ ...tuning, scopes: next })
  }

  const clearMedium = (medium: MediumId) => {
    const next: Scopes = { ...scopes }
    delete next[medium]
    onChange({ ...tuning, scopes: next })
  }

  /** How many options are chosen across a medium's facets, for the collapsed row. */
  const narrowedCount = (medium: MediumId) =>
    Object.values(scopes[medium] ?? {}).reduce((n, ids) => n + ids.length, 0)

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

          <PresetPicker
            tuning={tuning}
            media={media}
            onRecall={onChange}
            accentText={accentText}
            disabled={disabled}
          />

          {/* How much of the answering each medium gets.
              The percentage on the right is the point of this control. The raw
              slider is a weight, and a weight on its own hides the thing the
              player actually set: 100 on music next to eleven media left at 50
              is fifteen per cent music, which reads as "mostly" and plays as a
              minority. The old four-stop version could not show that, and that
              is how a game set to mostly music filled up with stretches. */}
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                How much of its answering
              </p>
              <p className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                share of replies
              </p>
            </div>
            <ul className="space-y-2">
              {shares.map(({ medium: id, share, target }) => {
                const medium = getMedium(id)
                const off = share === MUTED_SHARE
                return (
                  <li key={id}>
                    <div className="flex items-center gap-2">
                      <span
                        title={medium?.provider}
                        className={`text-xs w-[5.5rem] flex-shrink-0 truncate ${
                          off
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {medium?.plural ?? id}
                      </span>
                      <input
                        type="range"
                        min={MUTED_SHARE}
                        max={SHARE_MAX}
                        step={SHARE_STEP}
                        value={share}
                        disabled={disabled}
                        onChange={e => setShare(id, Number(e.target.value))}
                        aria-label={`${medium?.plural ?? id} share`}
                        className="flex-1 min-w-0 accent-gray-700 dark:accent-gray-300 disabled:opacity-50"
                      />
                      <span
                        title={off
                          ? 'Never answers here. Still yours to play.'
                          : `weight ${share} of ${SHARE_MAX} — ${shareLabel(share)}`}
                        className={`text-[11px] w-10 text-right flex-shrink-0 tabular-nums ${
                          off ? 'text-gray-400 dark:text-gray-500' : accentText
                        }`}
                      >
                        {off ? 'off' : `${Math.round(target * 100)}%`}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              {proportioned
                ? 'Those percentages are enforced: a medium that has had more than its share ' +
                  'is removed from what your partner may answer in until the chain catches up. ' +
                  'Turning one to zero only stops it answering there — it stays yours to play.'
                : 'Drag one and the rest rebalance around it. Until you do, every medium is ' +
                  'equally available and nothing is enforced.'}
            </p>
          </div>

          {/* Where in each medium it may reach. One medium expanded at a time —
              twelve media times two or three facets is a wall of chips, and the
              player is looking for one of them. */}
          {narrowable.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Where in each one
              </p>
              <ul className="space-y-1">
                {narrowable.map(id => {
                  const medium = getMedium(id)
                  const facets = facetsFor(id)
                  const count = narrowedCount(id)
                  const expanded = openScope === id
                  return (
                    <li key={id} className="rounded-lg border border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setOpenScope(expanded ? null : id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors rounded-lg"
                      >
                        <span className="text-xs text-gray-700 dark:text-gray-200">
                          {medium?.plural ?? id}
                        </span>
                        <span className={`ml-auto text-[10px] ${count > 0 ? accentText : 'text-gray-400 dark:text-gray-500'}`}>
                          {count > 0 ? `${count} chosen` : 'anything'}
                        </span>
                        <ChevronDown
                          size={12}
                          className={`text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {expanded && (
                        <div className="px-2 pb-2 space-y-2.5">
                          {facets.map(facet => {
                            const chosen = selectedOptions(scopes, id, facet.id)
                            return (
                              <div key={facet.id}>
                                <div className="flex items-baseline gap-1.5">
                                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                                    {facet.name}
                                  </p>
                                  {facet.enforcement === 'guided' && (
                                    <span
                                      title={facet.caveat}
                                      className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-500 cursor-help"
                                    >
                                      <Info size={9} /> steers only
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 leading-relaxed">
                                  {facet.does}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {facet.options.map(option => {
                                    const on = chosen.includes(option.id)
                                    return (
                                      <button
                                        key={option.id}
                                        disabled={disabled}
                                        onClick={() => toggleOption(id, facet.id, option.id)}
                                        aria-pressed={on}
                                        className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors disabled:opacity-50 ${
                                          on
                                            ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                        }`}
                                      >
                                        {option.label}
                                      </button>
                                    )
                                  })}
                                </div>
                                {facet.enforcement === 'guided' && chosen.length > 0 && (
                                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
                                    {facet.caveat}
                                  </p>
                                )}
                              </div>
                            )
                          })}

                          {count > 0 && (
                            <button
                              onClick={() => clearMedium(id)}
                              disabled={disabled}
                              className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                            >
                              Anything in {(medium?.plural ?? id).toLowerCase()}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                Picking several in one row means any of them. Narrowing only binds your
                partner — you may still play whatever you like.
              </p>
            </div>
          )}

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

          {/* How far it carries on by itself. Last, and separated, because it is
              not part of the weighting: the three blocks above say what your
              partner reaches for, and this one says who takes the next turn. The
              interpreter is never told about it — it answers one turn at a time
              and does not know whether another is coming. */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-baseline gap-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">On its own</p>
              <p className={`text-[11px] ml-auto ${carry === CONTINUATION_OFF ? 'text-gray-400 dark:text-gray-500' : accentText}`}>
                {CONTINUATION_LABELS[carry]}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed mb-1.5">
              How many turns it takes after yours, answering its own offering.
            </p>
            <div className="flex gap-0.5 flex-wrap">
              {CONTINUATION_STOPS.map(stop => (
                <button
                  key={stop}
                  disabled={disabled}
                  onClick={() => onChange({ ...tuning, continuation: stop })}
                  title={CONTINUATION_HINTS[stop]}
                  aria-pressed={carry === stop}
                  className={`text-[10px] px-1.5 py-0.5 rounded-md transition-colors disabled:opacity-50 ${
                    carry === stop
                      ? 'bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  {CONTINUATION_LABELS[stop]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              {CONTINUATION_HINTS[carry]}
            </p>
          </div>

          {!neutral && (
            <button
              onClick={() => onChange({
                shares: {}, axes: {}, scopes: {}, continuation: CONTINUATION_OFF,
              })}
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
