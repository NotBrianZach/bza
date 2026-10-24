'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, Check, Loader2, Search, Trash2, X } from 'lucide-react'
import { fuzzySearch } from '@/lib/fuzzy'
import { presetQueries, type CorrelationPreset } from '@/lib/queries/correlate'
import { normalizeTuning, tuningSummary, isNeutral, type Tuning } from '@/lib/correlate/tuning'
import {
  PARTNER_PRESETS, presetMissingMedia, presetTuning, type PartnerPreset,
} from '@/lib/correlate/presets'
import { getMedium } from '@/lib/correlate/media'
import type { MediumId } from '@/lib/correlate/types'

/**
 * Save the current partner settings under a name, and recall one.
 *
 * Fuzzy rather than exact, because the list is named by the person searching it:
 * they will type "jz" for "Jazz night" and an exact filter would show them
 * nothing. See lib/fuzzy.ts for why neither a substring match nor edit distance
 * was the right tool at this size.
 *
 * Recalling writes the preset's values onto the session. It is deliberately a
 * copy — a preset that kept editing games you applied it to weeks ago would
 * change a game in progress, which is the one thing `rules` already promises not
 * to do.
 */
export default function PresetPicker({
  tuning,
  media,
  onRecall,
  accentText,
  disabled,
}: {
  tuning: Tuning
  media: MediumId[]
  onRecall: (tuning: Tuning) => void
  accentText: string
  disabled?: boolean
}) {
  const [presets, setPresets] = useState<CorrelationPreset[] | null>(null)
  const [query, setQuery] = useState('')
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    presetQueries.list()
      .then(list => { if (!cancelled) setPresets(list) })
      .catch(() => { if (!cancelled) setPresets([]) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (naming) nameRef.current?.focus()
  }, [naming])

  const matches = useMemo(
    () => fuzzySearch(presets ?? [], query, p => p.name),
    [presets, query],
  )

  const neutral = isNeutral(tuning)
  // Overwriting is the expected reading of "save" on a name already in the list,
  // but it should not be a surprise — so the button says which it is doing.
  const clash = useMemo(
    () => (presets ?? []).find(p => p.name.toLowerCase() === name.trim().toLowerCase()) ?? null,
    [presets, name],
  )

  const save = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const saved = await presetQueries.save(name, tuning, media)
      setPresets(list => {
        const rest = (list ?? []).filter(p => p.id !== saved.id)
        return [saved, ...rest]
      })
      setJustSaved(saved.name)
      setName('')
      setNaming(false)
    } catch (e: any) {
      setError(e?.message ?? 'Could not save that preset')
    } finally {
      setBusy(false)
    }
  }

  /**
   * Recall a shipped starter.
   *
   * Through `normalizeTuning` like everything else, even though `presetTuning`
   * already returns a well-formed object. It is the single coercion point every
   * path goes through, and a starter that skipped it would be the one tuning in
   * the build that had not been canonicalised — so a value equal to the default
   * would survive and `isNeutral` would start answering wrongly.
   *
   * `tuning` is passed as the base so the player's own notes, and their choice
   * about who takes the next turn, survive a change of partner. See the header
   * in lib/correlate/presets.ts for why a preset is not allowed to touch those.
   */
  const recallStarter = (preset: PartnerPreset) => {
    onRecall(normalizeTuning(presetTuning(preset, media, tuning), media))
    setQuery('')
    setJustSaved('')
  }

  const starterMatches = useMemo(
    () => fuzzySearch(PARTNER_PRESETS, query, p => `${p.name} ${p.is}`),
    [query],
  )

  const recall = (preset: CorrelationPreset) => {
    // Normalized against *this* session's media, not the ones it was saved
    // under: a preset built in a twelve-medium game carries weights a four-medium
    // game has no use for, and normalizeTuning is what drops them.
    onRecall(normalizeTuning(preset.tuning, media))
    presetQueries.touch(preset.id).catch(() => {})
    setQuery('')
    setJustSaved('')
  }

  const remove = async (preset: CorrelationPreset) => {
    setPresets(list => (list ?? []).filter(p => p.id !== preset.id))
    try {
      await presetQueries.remove(preset.id)
    } catch (e: any) {
      setPresets(list => [...(list ?? []), preset])
      setError(e?.message ?? 'Could not delete that preset')
    }
  }

  /** Media a preset mentions that this game does not play. Said, never silently dropped. */
  const missingMedia = (preset: CorrelationPreset): string[] => {
    const saved = Array.isArray(preset.media) ? preset.media : []
    return saved
      .filter(m => !media.includes(m))
      .map(m => getMedium(m)?.plural ?? m)
  }

  return (
    <div className="space-y-2">
      {/* The starters come FIRST, and that ordering is the whole fix.
          Everything below this block already worked; the list it renders just
          starts empty, so on a first game the only visible affordance was
          "Save current" — which needs settings you have not built yet. Putting
          eight pickable partners above it means "select from presets" is
          reachable before you have made one. */}
      <div>
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Partners
        </p>
        {starterMatches.length === 0 ? (
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            No partner matches “{query}”.
          </p>
        ) : (
          <ul className="mt-1 space-y-1 max-h-44 overflow-y-auto">
            {starterMatches.map(({ item: preset }) => {
              const absent = presetMissingMedia(preset, media)
              return (
                <li key={preset.id}>
                  <button
                    onClick={() => recallStarter(preset)}
                    disabled={disabled}
                    title={preset.is}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                  >
                    <span className={`block text-xs font-medium truncate ${accentText}`}>
                      {preset.name}
                    </span>
                    {/* The sentence, not a tuning summary. A starter is picked by
                        what it is like to play against; "obliquity 0, register 0"
                        is the thing it was written to save somebody reading. */}
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500 leading-snug">
                      {preset.is}
                      {absent.length > 0 && (
                        <span className="text-amber-600/80 dark:text-amber-500/80">
                          {' '}· {absent.join(', ')} not in this game
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/50">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Saved settings
        </p>
        {!naming && (
          <button
            onClick={() => { setNaming(true); setName('') }}
            disabled={disabled || neutral}
            title={neutral ? 'Adjust something first — there is nothing to save yet' : 'Save these settings under a name'}
            className="ml-auto flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-40 disabled:hover:text-gray-500"
          >
            <Bookmark size={11} /> Save current
          </button>
        )}
      </div>

      {naming && (
        <div className="flex items-center gap-1.5">
          <input
            ref={nameRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); save() }
              if (e.key === 'Escape') { setNaming(false); setName('') }
            }}
            placeholder="Name these settings…"
            maxLength={60}
            className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button
            onClick={save}
            disabled={!name.trim() || busy}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 disabled:opacity-40"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            {clash ? 'Replace' : 'Save'}
          </button>
          <button
            onClick={() => { setNaming(false); setName('') }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Cancel"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {naming && !neutral && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
          Saving: {tuningSummary(tuning, media)}
        </p>
      )}

      {justSaved && !naming && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Saved as “{justSaved}”.
        </p>
      )}

      {/* The search field appears only once there is enough to search. Below that
          the list IS the interface and a filter above three rows is furniture.

          Counted across BOTH lists now, and the eight starters clear the
          threshold on their own — so the field is present from the first game,
          which is correct: it filters the partners too. Keyed off the total
          rather than hard-coded to true so that if the starter list is ever
          trimmed, the furniture rule still applies. */}
      {(presets?.length ?? 0) + PARTNER_PRESETS.length > 4 && (
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Find a preset…"
            className="w-full pl-6 pr-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      )}

      {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}

      {presets === null ? (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <Loader2 size={11} className="animate-spin" /> Loading…
        </p>
      ) : presets.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Nothing saved yet. Pick a partner above, adjust it below, then save it under your
          own name — a starter is a copy, so changing it changes nothing for next time.
        </p>
      ) : matches.length === 0 ? (
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          No preset matches “{query}”.
        </p>
      ) : (
        <ul className="space-y-1 max-h-44 overflow-y-auto">
          {matches.map(({ item: preset }) => {
            const absent = missingMedia(preset)
            return (
              <li key={preset.id} className="group flex items-center gap-2">
                <button
                  onClick={() => recall(preset)}
                  disabled={disabled}
                  className="flex-1 min-w-0 text-left px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                >
                  <span className={`block text-xs font-medium truncate ${accentText}`}>{preset.name}</span>
                  <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    {tuningSummary(normalizeTuning(preset.tuning, media), media) || 'unweighted'}
                    {absent.length > 0 && ` · ${absent.join(', ')} not in this game`}
                  </span>
                </button>
                <button
                  onClick={() => remove(preset)}
                  title={`Delete “${preset.name}”`}
                  aria-label={`Delete preset ${preset.name}`}
                  className="p-1 flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
