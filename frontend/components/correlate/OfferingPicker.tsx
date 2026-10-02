'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Accessibility, AlertTriangle, Atom, BookOpen, Clapperboard, Dumbbell, Footprints, Frame,
  Hand, Leaf, Loader2, Mountain, Music2, Plus, RefreshCw, Search, Send, Sigma, Sparkles,
  Trash2, X,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS } from '@/lib/correlate/relations'
import type {
  ActionIntent, MediumId, Offering, RelationDeclaration, RelationId,
} from '@/lib/correlate/types'

const ICONS: Record<string, any> = {
  Music2, Frame, BookOpen, Clapperboard, Sigma, Atom, Leaf, Mountain,
  Hand, Footprints, Accessibility, Dumbbell,
}

/**
 * Search tuning.
 *
 * Every catalogued provider is rate-limited by IP, and server-side that IP is ours
 * and shared by every player, so each keystroke that escapes the debounce spends
 * from a common budget. Two characters at 350ms fires mid-word — typing "rainy day"
 * with ordinary pauses sent "ra", "rain", "rainy", "rainy d" before the player had
 * finished thinking. Three characters at 600ms fires on words rather than
 * fragments, which is both fewer calls and better queries.
 */
const SEARCH_MIN_CHARS = 3
const SEARCH_DEBOUNCE_MS = 600

export interface MoveDraft {
  medium: MediumId
  offeringId?: string
  composed?: { title: string; steps: string[]; intent: ActionIntent }
  framing: string
  claimedRelation?: RelationId
}

/**
 * Make a move.
 *
 * There are two choices in every turn here, not one: which connection to follow,
 * and which medium can express it. That second choice is the expressive one —
 * answering a frantic song with a stretch says "what I hear in this is a need for
 * release", and no single-medium game can say that. So the medium tabs come first
 * and are never collapsed into a dropdown.
 *
 * Catalogued media search; composed media compose. Same component, because the
 * difference should be visible in what the field asks for, not in where the player
 * has to go to find it.
 */
export default function OfferingPicker({
  media,
  relations,
  declaredRelation,
  spentRelations = [],
  previousMedium,
  disabled,
  onSubmit,
}: {
  media: MediumId[]
  relations: RelationId[]
  declaredRelation: RelationDeclaration
  spentRelations?: RelationId[]
  /** Medium of the offering on the table, so medium-change relations can be marked. */
  previousMedium?: MediumId | null
  disabled?: boolean
  onSubmit: (draft: MoveDraft) => void
}) {
  const [medium, setMedium] = useState<MediumId>(media[0] ?? 'music')
  const [framing, setFraming] = useState('')
  const [claimed, setClaimed] = useState<RelationId | ''>('')

  // Catalogue state
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Offering[]>([])
  const [picked, setPicked] = useState<Offering | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const seq = useRef(0)

  // Composed state
  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [intent, setIntent] = useState<ActionIntent>('shown')
  const [vocabulary, setVocabulary] = useState<{ title: string; steps: string[]; framing: string }[]>([])

  // Drafting state. `rejected` is the discard button's memory: every title thrown
  // away goes in, and the list is sent with the next ask so it reaches somewhere
  // else instead of resampling the same few answers.
  const [brief, setBrief] = useState('')
  const [rejected, setRejected] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState('')
  /** Set only while a drafted title is sitting in the fields untouched. */
  const [drafted, setDrafted] = useState<string | null>(null)

  const def = getMedium(medium)
  const isComposed = def?.origin === 'composed'

  // Reset the medium-specific half whenever the medium changes: a framing written
  // for a painting is not a framing for a stretch, and carrying it over silently
  // would be worse than making someone retype it.
  useEffect(() => {
    setQ(''); setResults([]); setPicked(null); setSearchError('')
    setTitle(''); setSteps(['']); setIntent('shown')
    setFraming('')
    // The discards go too. "Already discarded" is scoped to the medium it was
    // discarded in — a stretch the player rejected says nothing about which
    // movement they want.
    setBrief(''); setRejected([]); setSuggestError(''); setDrafted(null)
  }, [medium])

  // Composed media have nothing to search, so the same endpoint hands back their
  // vocabulary instead — starting points, not a closed list.
  useEffect(() => {
    if (!isComposed) { setVocabulary([]); return }
    let cancelled = false
    authedFetch(`/api/offerings/search?medium=${medium}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setVocabulary(d.vocabulary ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [medium, isComposed])

  useEffect(() => {
    if (isComposed) return
    const query = q.trim()
    if (query.length < SEARCH_MIN_CHARS) { setResults([]); setSearchError(''); setSearching(false); return }

    setSearching(true)
    const mine = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const res = await authedFetch(`/api/offerings/search?medium=${medium}&q=${encodeURIComponent(query)}`)
        const data = await res.json()
        // A slower earlier request must not overwrite a newer result set.
        if (mine !== seq.current) return
        if (data.error) {
          // Name the catalogue and its status. The previous version showed one
          // generic string for every failure, which is how a hard refusal from one
          // provider read as a rate limit on another.
          setSearchError(data.upstreamStatus
            ? `${data.error} (${data.provider}, HTTP ${data.upstreamStatus})`
            : data.error)
          setResults([])
        }
        else { setSearchError(''); setResults(data.offerings ?? []) }
      } catch {
        if (mine === seq.current) setSearchError('Search failed')
      } finally {
        if (mine === seq.current) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [q, medium, isComposed])

  const applyVocabulary = useCallback((v: { title: string; steps: string[]; framing: string }) => {
    setTitle(v.title)
    setSteps([...v.steps])
    setFraming(v.framing)
    setDrafted(null)
  }, [])

  /**
   * Ask for a draft, optionally discarding what is already in the fields.
   *
   * `discarding` is the current title rather than a flag, because the server needs
   * the title to avoid repeating it, and because a player who edited the draft
   * before pressing discard has thrown away *their* version — which is the one that
   * should not come back.
   */
  const suggestOne = useCallback(async (discarding: string | null) => {
    const nextRejected = discarding?.trim()
      ? [...rejected.filter(t => t !== discarding.trim()), discarding.trim()]
      : rejected

    setSuggesting(true)
    setSuggestError('')
    if (discarding) {
      // Clear immediately. Leaving the discarded draft on screen while the next one
      // loads makes a slow request look like a button that did nothing.
      setTitle(''); setSteps(['']); setFraming(''); setDrafted(null)
      setRejected(nextRejected)
    }

    try {
      const res = await authedFetch('/api/offerings/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medium, brief: brief.trim(), rejected: nextRejected }),
      })
      const data = await res.json()
      if (data.error || !data.draft) {
        setSuggestError(data.error || 'Could not draft one. Try again, or write one yourself.')
        return
      }
      setTitle(data.draft.title)
      setSteps(data.draft.steps.length > 0 ? [...data.draft.steps] : [''])
      setFraming(data.draft.framing)
      setIntent(data.draft.intent === 'invited' ? 'invited' : 'shown')
      setDrafted(data.draft.title)
    } catch {
      setSuggestError('Could not draft one. Try again, or write one yourself.')
    } finally {
      setSuggesting(false)
    }
  }, [medium, brief, rejected])

  const relationRequired = declaredRelation === 'required'
  const relationOffered = declaredRelation !== 'never'

  const cleanSteps = steps.map(s => s.trim()).filter(Boolean)
  const ready = !disabled
    && !!framing.trim()
    && (isComposed ? !!title.trim() && cleanSteps.length > 0 : !!picked)
    && (!relationRequired || !!claimed)

  const submit = () => {
    if (!ready) return
    onSubmit({
      medium,
      offeringId: picked?.id,
      composed: isComposed ? { title: title.trim(), steps: cleanSteps, intent } : undefined,
      framing: framing.trim(),
      claimedRelation: claimed || undefined,
    })
    setQ(''); setResults([]); setPicked(null)
    setTitle(''); setSteps(['']); setFraming(''); setClaimed('')
    // A played move is not a discarded one, so the rejections do not carry over:
    // the next turn starts from nothing rather than from a list of things the
    // player turned down before they found one they liked.
    setBrief(''); setRejected([]); setSuggestError(''); setDrafted(null)
  }

  return (
    <div className="space-y-3">
      {/* Medium tabs — the first of the turn's two choices. */}
      <div className="flex flex-wrap gap-1.5">
        {media.map(id => {
          const m = getMedium(id)
          if (!m) return null
          const Icon = ICONS[m.icon] ?? Music2
          const active = id === medium
          const changesMedium = !!previousMedium && id !== previousMedium
          return (
            <button
              key={id}
              onClick={() => setMedium(id)}
              disabled={disabled}
              title={m.provider}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                active
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Icon size={12} />
              {m.plural}
              {changesMedium && !active && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500" title="A different medium than the offering on the table">↗</span>
              )}
            </button>
          )
        })}
      </div>

      {def && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{def.provider}</p>
      )}

      {/* ── Catalogued: search and pick ─────────────────────────────────── */}
      {!isComposed && (
        picked ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/40 p-2.5">
            {typeof picked.meta.thumb === 'string' || typeof picked.meta.coverImage === 'string' ? (
              <img src={(picked.meta.thumb ?? picked.meta.coverImage) as string} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
            ) : null}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{picked.title}</span>
              {picked.attribution && <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{picked.attribution}</span>}
            </span>
            <button onClick={() => setPicked(null)} disabled={disabled} title="Choose something else" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                disabled={disabled}
                placeholder={def?.searchPlaceholder ?? 'Search…'}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              />
            </div>

            {searchError && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{searchError}</p>}

            {results.length > 0 && (
              <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {results.map(o => (
                  <li key={o.id}>
                    <button
                      onClick={() => { setPicked(o); setResults([]); setQ(''); if (!framing) setFraming(o.framing) }}
                      disabled={disabled}
                      className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                    >
                      <span className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {typeof o.meta.thumb === 'string' || typeof o.meta.coverImage === 'string'
                          ? <img src={(o.meta.thumb ?? o.meta.coverImage) as string} alt="" className="w-full h-full object-cover" />
                          : <Music2 size={14} className="text-gray-400" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{o.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {[o.attribution, o.meta.year, o.meta.date, o.meta.book].filter(Boolean).join(' · ')}
                        </span>
                        {o.perceptible.kind === 'text' && (
                          <span className="block text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 mt-0.5">{o.perceptible.body}</span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}

      {/* ── Composed: author something doable ──────────────────────────── */}
      {isComposed && (
        <div className="space-y-2">
          {/* Drafting. There is no catalogue of movements to search, so the way out
              of a blank form is to have one written for you and then keep editing
              it — every field below stays live, and a draft is worth exactly what a
              typed one is. Discarding costs nothing because nothing is recorded
              until the move is played. */}
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={brief}
                onChange={e => setBrief(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !suggesting && !disabled) suggestOne(null) }}
                disabled={disabled || suggesting}
                maxLength={240}
                placeholder={`Ask for a ${def?.name ?? 'move'} — "something off-balance", or leave blank`}
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              />
              <button
                onClick={() => suggestOne(null)}
                disabled={disabled || suggesting}
                className="flex items-center gap-1.5 flex-shrink-0 text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors disabled:opacity-50"
              >
                {suggesting
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                {title ? 'Draft again' : 'Draft one'}
              </button>
            </div>

            {/* Discard is only offered once something is there to discard, and it
                carries the title away with it so the next draft cannot repeat it. */}
            {drafted && !suggesting && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  Drafted — edit it freely, or throw it away.
                </span>
                <button
                  onClick={() => suggestOne(title)}
                  disabled={disabled}
                  className="flex items-center gap-1 flex-shrink-0 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={11} /> Discard, draft another
                </button>
              </div>
            )}

            {rejected.length > 0 && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {rejected.length} discarded — the next draft will not repeat {rejected.length === 1 ? 'it' : 'them'}.
              </p>
            )}

            {suggestError && (
              <p className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
                {suggestError}
              </p>
            )}
          </div>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={disabled}
            placeholder={def?.searchPlaceholder ?? 'Name it…'}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          />

          <div className="space-y-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-4 flex-shrink-0">{i + 1}.</span>
                <input
                  type="text"
                  value={s}
                  onChange={e => setSteps(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
                  disabled={disabled}
                  placeholder="One concrete thing to do — what moves, and where to"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                />
                {steps.length > 1 && (
                  <button onClick={() => setSteps(prev => prev.filter((_, j) => j !== i))} disabled={disabled} className="p-1 text-gray-300 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {steps.length < 5 && (
              <button onClick={() => setSteps(prev => [...prev, ''])} disabled={disabled} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-6">
                <Plus size={11} /> another step
              </button>
            )}
          </div>

          {/* Performability, stated rather than only enforced. */}
          <p className="flex items-start gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
            Concrete steps only — a second person has to be able to do this. “A movement expressing longing” is not a step.
          </p>

          {/* Shown vs invited. Not a preference: it is the difference between
              depicting an action and asking someone to perform one. */}
          <div className="flex gap-1.5">
            {(['shown', 'invited'] as ActionIntent[]).map(v => (
              <button
                key={v}
                onClick={() => setIntent(v)}
                disabled={disabled}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                  intent === v
                    ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {v === 'shown' ? 'I am describing it' : 'I am offering it to try'}
              </button>
            ))}
          </div>

          {vocabulary.length > 0 && !title && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Somewhere to start</p>
              <div className="flex flex-wrap gap-1.5">
                {vocabulary.map(v => (
                  <button
                    key={v.title}
                    onClick={() => applyVocabulary(v)}
                    disabled={disabled}
                    className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Framing: required for every medium ─────────────────────────── */}
      <div>
        <input
          type="text"
          value={framing}
          onChange={e => setFraming(e.target.value)}
          disabled={disabled}
          placeholder="Which part is in play?"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
        />
        {def && <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{def.framingHint}</p>}
      </div>

      {/* ── The relation: the turn's other choice ──────────────────────── */}
      {relationOffered && (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
            {relationRequired ? 'The relation you are claiming' : 'The relation, if you want to name it'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {relations.map(id => {
              const r = RELATIONS[id]
              const spent = spentRelations.includes(id)
              // Translation and embodiment only mean anything across a change of
              // medium. Marking that here saves a wasted turn.
              const needsChange = r.requiresMediumChange && !!previousMedium && medium === previousMedium
              return (
                <button
                  key={id}
                  onClick={() => setClaimed(c => (c === id ? '' : id))}
                  disabled={disabled || spent || needsChange}
                  title={spent ? 'Just used — pick another' : needsChange ? `${r.name} needs a change of medium` : `${r.does}. e.g. ${r.example}`}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-30 ${
                    claimed === id
                      ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {r.name}
                </button>
              )
            })}
          </div>
          {claimed && (
            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">{RELATIONS[claimed].does}. {RELATIONS[claimed].guidance}</p>
          )}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!ready}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:brightness-110 dark:hover:brightness-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {disabled ? <><Loader2 size={14} className="animate-spin" /> Reading it…</> : <><Send size={14} /> Offer it</>}
      </button>
    </div>
  )
}
