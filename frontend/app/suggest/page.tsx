'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Plus, RefreshCw, Sparkles, Trash2, X,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { supabase } from '@/lib/supabase'
import DigestList, { DigestGap, DigestItem } from '@/components/suggest/DigestList'
import { getPinnedFeeds, type PinnedFeed } from '@/lib/pinnedFeeds'

/**
 * The suggested feed: the digest, its sources, your interests, the weights, and
 * whether it is working.
 *
 * Five tabs because the spec has five concerns and collapsing any two of them
 * loses the distinction that concern exists to make. In particular Sources and
 * Interests are NOT one tab: a feed is where material comes from, an interest
 * is what you want from it, and the whole design keeps "what the publisher
 * said" apart from "what the user asked for". A combined tab would invite the
 * obvious next step of tagging feeds with interests, which is exactly the
 * conflation the schema refuses.
 *
 * ── Build vs preview ──────────────────────────────────────────────────────
 *
 * Build stores; preview does not. Dragging a weight slider previews, because a
 * stored digest enters the novelty history and the next window's duplicate
 * rate — so exploring the settings would otherwise poison both. The button
 * says which it is doing.
 *
 * ── What this page refuses to smooth over ─────────────────────────────────
 *
 * Blockers, gaps and notes all render. A thin digest has a cause, the cause is
 * usually "four feeds and no interests", and a page that showed six items with
 * no explanation would send the user looking at the ranking instead of at their
 * setup.
 */

type Tab = 'feed' | 'sources' | 'interests' | 'tuning' | 'health'

interface Feed {
  feedId: string
  url: string
  name: string
  region: string | null
  topicTags: string[]
  sourceType: string
  enabled: boolean
  userDesignated: boolean
}

interface Interest {
  interestId: string
  name: string
  kind: string
  weight: number
  explicitFeedback: boolean
}

interface Sources {
  feeds: Feed[]
  interests: Interest[]
  weights: Record<string, number>
  weightsAreDefault: boolean
  plan: { bucket: string; slots: number }[]
  planIsDefault: boolean
  discoveryFloorApplied: boolean
  regions: string[]
  desiredTopics: string[]
  qualityFloor: number | null
}

const SOURCE_TYPES = [
  'local_reporting', 'specialist', 'wire', 'primary_source', 'research', 'commentary',
]

const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'Digest' },
  { id: 'sources', label: 'Sources' },
  { id: 'interests', label: 'Interests' },
  { id: 'tuning', label: 'Tuning' },
  { id: 'health', label: 'Is it working?' },
]

export default function SuggestPage() {
  const [tab, setTab] = useState<Tab>('feed')
  const [authed, setAuthed] = useState<boolean | null>(null)

  const [items, setItems] = useState<DigestItem[]>([])
  const [gaps, setGaps] = useState<DigestGap[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [blockers, setBlockers] = useState<string[]>([])
  const [digestId, setDigestId] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  const [sources, setSources] = useState<Sources | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollResult, setPollResult] = useState<{ name: string; status: string; notes?: string[] }[] | null>(null)
  const [health, setHealth] = useState<{ prose?: string[]; reason?: string } | null>(null)

  /**
   * The pinned feeds, read from localStorage, and what the server knows of them.
   *
   * `adoptState` is keyed on the RAW pinned url rather than the canonical key,
   * because that is what the UI has in hand. The canonicalisation —
   * `feed://hn` and `feed://hn/top` being one source — stays on the server, so
   * the client never has to know the rule and the two cannot disagree about it.
   */
  const [pinned, setPinned] = useState<PinnedFeed[]>([])
  const [adoptState, setAdoptState] = useState<Record<string, {
    usable: boolean; subscribed: boolean; enabled: boolean; feedId: string | null
  }>>({})

  const [newUrl, setNewUrl] = useState('')
  const [newType, setNewType] = useState('specialist')
  const [newRegion, setNewRegion] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const [newInterestKind, setNewInterestKind] = useState('topic')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user))
  }, [])

  const loadSources = useCallback(async () => {
    const res = await authedFetch('/api/suggest/sources')
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    setSources(d)
  }, [])

  const loadStored = useCallback(async () => {
    const res = await authedFetch('/api/suggest/digest')
    const d = await res.json()
    if (d.error) { setError(d.error); return }
    if (!d.digest) {
      setItems([])
      setGeneratedAt(null)
      return
    }
    setItems(d.digest.items ?? [])
    setGaps(d.digest.gaps ?? [])
    setNotes(d.digest.notes ?? [])
    setDigestId(d.digest.digestId ?? null)
    setGeneratedAt(d.digest.generatedAt ?? null)
    setIsPreview(false)
  }, [])

  /** Which of the pinned feeds the digest already uses. One request. */
  const loadAdoptState = useCallback(async (feeds: PinnedFeed[]) => {
    if (feeds.length === 0) return
    const urls = feeds.map(f => f.url).join(',')
    const res = await authedFetch(`/api/suggest/adopt?urls=${encodeURIComponent(urls)}`)
    const d = await res.json()
    if (d.error || !Array.isArray(d.state)) return
    const next: typeof adoptState = {}
    for (const s of d.state) {
      next[s.url] = {
        usable: !!s.usable, subscribed: !!s.subscribed, enabled: !!s.enabled, feedId: s.feedId,
      }
    }
    setAdoptState(next)
  }, [])

  useEffect(() => {
    if (!authed) return
    const feeds = getPinnedFeeds()
    setPinned(feeds)
    loadSources()
    loadStored()
    loadAdoptState(feeds)
  }, [authed, loadSources, loadStored, loadAdoptState])

  async function toggleAdopt(url: string, label: string, currentlyOn: boolean) {
    // Optimistic, because a checkbox that waits on a round trip feels broken.
    setAdoptState(s => ({ ...s, [url]: { ...s[url], enabled: !currentlyOn } }))
    try {
      /**
       * Three shapes, because a pinned feed can be in three states.
       *
       * Off → on is `include` when a row already exists and `feeds` when it
       * does not; on → off is always `remove`, which sets enabled=false rather
       * than deleting, so the auto-adopt on the next page visit does not undo
       * it. Sending `feeds` for a feed that already has a disabled row would
       * do nothing at all — adopt deliberately leaves known feeds alone — which
       * is exactly why the include branch has to exist.
       */
      const body = currentlyOn
        ? { remove: [url] }
        : adoptState[url]?.subscribed
          ? { include: [url] }
          : { feeds: [{ url, label }] }
      await authedFetch('/api/suggest/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } finally {
      // Re-read rather than trusting the optimistic flip: the server owns the
      // canonicalisation, so it is the only thing that knows whether this URL
      // collapsed onto a subscription that already existed.
      await Promise.all([loadAdoptState(pinned), loadSources()])
    }
  }

  async function adoptAll() {
    setBusy('adopt')
    setError(null)
    try {
      // `include` as well as `feeds`: adopt leaves a known feed alone, on
      // purpose, so a feed the user previously excluded would not come back
      // from `feeds` alone — and coming back is exactly what this button is for.
      const res = await authedFetch('/api/suggest/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeds: pinned.map(p => ({ url: p.url, label: p.label })),
          include: pinned.map(p => p.url),
        }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      // Skipped feeds are surfaced, not swallowed. The pinned list legitimately
      // contains things the digest cannot score, and "it vanished" is a worse
      // answer than the reason.
      if (Array.isArray(d.skipped) && d.skipped.length > 0) {
        setNotes(n => [
          ...d.skipped.map((s: { url: string; reason: string }) => `${s.url}: ${s.reason}`),
          ...n,
        ])
      }
      await Promise.all([loadAdoptState(pinned), loadSources()])
    } finally {
      setBusy(null)
    }
  }

  async function build(preview: boolean) {
    setBusy(preview ? 'preview' : 'build')
    setError(null)
    try {
      const res = await authedFetch(`/api/suggest/digest?${preview ? 'preview=1' : 'build=1'}`)
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      setItems(d.digest?.items ?? [])
      setGaps(d.digest?.gaps ?? [])
      setNotes(d.digest?.notes ?? [])
      setDigestId(d.digest?.digestId ?? null)
      setBlockers(d.blockers ?? [])
      setIsPreview(!!d.preview)
      if (!preview) setGeneratedAt(new Date().toISOString())
      setTab('feed')
    } finally {
      setBusy(null)
    }
  }

  async function poll() {
    setBusy('poll')
    setError(null)
    setPollResult(null)
    try {
      const res = await authedFetch('/api/suggest/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: 1 }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      // Per-feed, never a total. A feed that has been dead for a month is the
      // likeliest reason a digest goes thin, and a summary count hides it.
      setPollResult(d.polled ?? [])
      if (d.notes?.length) setNotes(n => [...d.notes, ...n])
    } finally {
      setBusy(null)
    }
  }

  async function addFeed() {
    if (!newUrl.trim()) return
    setBusy('addFeed')
    setError(null)
    try {
      const res = await authedFetch('/api/suggest/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim(),
          sourceType: newType,
          region: newRegion.trim() || undefined,
        }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      setNewUrl('')
      setNewRegion('')
      if (d.warnings?.length) setNotes(n => [...d.warnings, ...n])
      await loadSources()
    } finally {
      setBusy(null)
    }
  }

  async function patchFeed(feedId: string, patch: Record<string, unknown>) {
    await authedFetch('/api/suggest/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedId, ...patch }),
    })
    await loadSources()
  }

  /**
   * Turn a source off — by excluding it if it is pinned, deleting it if not.
   *
   * The branch is necessary and the client is the only place that can make it,
   * because it is the only side that knows the pinned list.
   *
   * A PINNED feed must not be deleted: the auto-adopt on the next page visit
   * adds any pinned feed with no subscription row, so deleting would re-add it
   * — a remove button that undoes itself whenever you next load the page.
   * Setting `enabled = false` keeps the row as the record of the decision.
   *
   * A feed that is NOT pinned has nothing to come back from, so deleting it is
   * right and leaves no permanently-disabled row cluttering the list.
   */
  async function removeFeed(feedId: string, url: string) {
    const isPinned = pinned.some(p => p.url === url)
      // Also match canonicalised equivalents, since `feed://hn/top` in the
      // pinned list is the same source as the stored `feed://hn`.
      || Object.entries(adoptState).some(([raw, st]) =>
        st.feedId === feedId && pinned.some(p => p.url === raw))

    if (isPinned) {
      await authedFetch('/api/suggest/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove: [url] }),
      })
    } else {
      await authedFetch(`/api/suggest/sources?feedId=${encodeURIComponent(feedId)}`, { method: 'DELETE' })
    }
    await Promise.all([loadSources(), loadAdoptState(pinned)])
  }

  async function addInterest() {
    if (!newInterest.trim()) return
    setBusy('addInterest')
    setError(null)
    try {
      const res = await authedFetch('/api/suggest/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newInterest.trim(), kind: newInterestKind }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); return }
      setNewInterest('')
      await loadSources()
    } finally {
      setBusy(null)
    }
  }

  async function setInterestWeight(interestId: string, weight: number) {
    await authedFetch('/api/suggest/interests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interestId, weight }),
    })
    await loadSources()
  }

  async function removeInterest(interestId: string) {
    await authedFetch(`/api/suggest/interests?interestId=${encodeURIComponent(interestId)}`, { method: 'DELETE' })
    await loadSources()
  }

  async function saveWeights(weights: Record<string, number>) {
    await authedFetch('/api/suggest/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights }),
    })
    await loadSources()
  }

  async function loadHealth() {
    setBusy('health')
    try {
      const res = await authedFetch('/api/suggest/metrics')
      const d = await res.json()
      setHealth(d.measurements ? { prose: d.prose } : { reason: d.reason ?? d.error })
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    if (tab === 'health' && authed && !health) loadHealth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authed])

  if (authed === false) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <Link href="/auth/login" className="text-sky-600 hover:underline dark:text-sky-400">Sign in</Link>
          {' '}to use the suggested feed — it needs somewhere to keep your sources and what you have been shown.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft size={12} /> Home
          </Link>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Suggested</h1>
            </span>
            {/* The tagline sits with the title rather than buried in the body
                copy below, because it is the one line that says what makes this
                different from any other feed reader. */}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              — tune your own recommendation algorithm
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Relevance, quality and discovery are kept separate on purpose, so you can
            see which one put an item in front of you — and change your mind about any
            of them. This does not replace your pinned feeds; those are bookmarks, this
            is a balanced selection out of everything they published.
          </p>

          <nav className="mt-3 flex flex-wrap gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-5">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={12} /></button>
          </div>
        )}

        {/* ── Digest ───────────────────────────────────────────────────── */}
        {tab === 'feed' && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => build(false)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
              >
                {busy === 'build' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Build and save
              </button>
              <button
                onClick={() => build(true)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                title="Run the pipeline without storing the result — nothing enters your novelty history or the duplicate rate"
              >
                {busy === 'preview' ? <Loader2 size={12} className="animate-spin" /> : null}
                Preview only
              </button>
              <button
                onClick={poll}
                disabled={!!busy}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                {busy === 'poll' ? <Loader2 size={12} className="animate-spin" /> : null}
                Fetch new items
              </button>
              <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">
                {isPreview
                  ? 'preview — not saved'
                  : generatedAt
                    ? `saved ${new Date(generatedAt).toLocaleString()}`
                    : 'no saved digest'}
              </span>
            </div>

            {/* Blockers are separate from gaps and come first. A gap is answered
                by enabling more feeds; a blocker is the setup not being done. */}
            {blockers.length > 0 && (
              <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/50 dark:bg-sky-900/20">
                <h3 className="mb-1 text-xs font-semibold text-sky-900 dark:text-sky-200">
                  Before this can do its job
                </h3>
                <ul className="space-y-1">
                  {blockers.map((b, i) => (
                    <li key={i} className="text-[11px] leading-snug text-sky-800 dark:text-sky-300">· {b}</li>
                  ))}
                </ul>
              </div>
            )}

            {pollResult && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Poll results</h3>
                <ul className="space-y-0.5">
                  {pollResult.map((p, i) => (
                    <li key={i} className="text-[11px] text-gray-500 dark:text-gray-400">
                      {p.name} — {p.status}
                      {p.notes && p.notes.length > 0 && ` (${p.notes.join('; ')})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DigestList items={items} gaps={gaps} notes={notes} digestId={digestId} />
          </div>
        )}

        {/* ── Sources ──────────────────────────────────────────────────── */}
        {tab === 'sources' && sources && (
          <div>
            {/* Your existing feeds, adoptable with a toggle rather than retyped.
                The pinned list lives in localStorage and the server has never
                seen it, so the client has to tell it — which is also why this
                is not a migration: nothing moves, the pinned list keeps working
                as a bookmark list, and this records the separate fact "also
                consider this when building my digest". */}
            {pinned.length > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <h3 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Your feeds
                </h3>
                <p className="mb-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                  Everything on your home page is already in the digest. Untick one
                  to leave it out — it stays in your feed list either way, and
                  staying out sticks.
                </p>
                <ul className="space-y-1">
                  {pinned.map(p => {
                    const st = adoptState[p.url]
                    /**
                     * Ticked means INCLUDED, which is `enabled` and not merely
                     * `subscribed`.
                     *
                     * Those came apart when adoption became opt-out: every
                     * pinned feed gets a subscription row on the first visit, so
                     * `subscribed` is true for all of them and would show every
                     * box ticked whatever the user had chosen. `enabled` is the
                     * decision.
                     */
                    const on = !!st?.enabled
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={st ? !st.usable : true}
                          onChange={() => toggleAdopt(p.url, p.label, on)}
                        />
                        <span className={st?.usable === false
                          ? 'text-gray-400 line-through dark:text-gray-600'
                          : 'text-gray-800 dark:text-gray-200'}>
                          {p.label}
                        </span>
                        {/* A pinned feed the digest genuinely cannot score says
                            so, rather than just not appearing. */}
                        {st?.usable === false && (
                          <span
                            className="text-[11px] text-gray-400"
                            title="Not an http(s) feed URL or a recognised feed:// source, so there is nothing to ingest"
                          >
                            can’t be scored
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                <button
                  onClick={adoptAll}
                  disabled={!!busy}
                  className="mt-2 inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                >
                  {busy === 'adopt' ? <Loader2 size={12} className="animate-spin" /> : null}
                  Include all of them again
                </button>
              </div>
            )}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Add a feed</h3>
              <div className="flex flex-wrap gap-2">
                <input
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  title="How close this publisher is to what it reports. Not a quality ranking."
                >
                  {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <input
                  value={newRegion}
                  onChange={e => setNewRegion(e.target.value)}
                  placeholder="region (optional)"
                  className="w-32 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={addFeed}
                  disabled={!!busy || !newUrl.trim()}
                  className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
                >
                  {busy === 'addFeed' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                The source type says how close the publisher is to the events it
                reports — whether it was there, whether it is the party involved, or
                whether it is summarising others. It is not a quality score and there
                is deliberately no political-leaning field.
              </p>
            </div>

            {sources.feeds.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">No sources yet.</p>
            ) : (
              <ul className="space-y-2">
                {sources.feeds.map(f => (
                  <li key={f.feedId} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${f.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                          {f.name}
                        </p>
                        <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">{f.url}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <select
                            value={f.sourceType}
                            onChange={e => patchFeed(f.feedId, { sourceType: e.target.value })}
                            className="rounded border border-gray-200 px-1 py-0.5 text-[11px] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                          >
                            {SOURCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                          </select>
                          {f.region && <span className="text-gray-400">{f.region}</span>}
                          <label className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={f.enabled}
                              onChange={e => patchFeed(f.feedId, { enabled: e.target.checked })}
                            />
                            enabled
                          </label>
                          <label
                            className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400"
                            title="Vouched for by name — its items skip the quality floor"
                          >
                            <input
                              type="checkbox"
                              checked={f.userDesignated}
                              onChange={e => patchFeed(f.feedId, { userDesignated: e.target.checked })}
                            />
                            trusted
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFeed(f.feedId, f.url)}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                        title="Leave this out of the digest. A feed from your home-page list stays there and stays remembered as excluded; one added here is removed outright. Collected items are kept either way — they are shared with other subscribers for duplicate detection."
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Interests ────────────────────────────────────────────────── */}
        {tab === 'interests' && sources && (
          <div>
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap gap-2">
                <input
                  value={newInterest}
                  onChange={e => setNewInterest(e.target.value)}
                  placeholder="energy storage — or a question, like “what could replace petrochemical feedstocks?”"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                />
                <select
                  value={newInterestKind}
                  onChange={e => setNewInterestKind(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="topic">topic</option>
                  <option value="entity">entity</option>
                  <option value="question">question</option>
                </select>
                <button
                  onClick={addInterest}
                  disabled={!!busy || !newInterest.trim()}
                  className="inline-flex items-center gap-1 rounded bg-gray-900 px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
                >
                  {busy === 'addInterest' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                A question is matched differently from a topic — it shares vocabulary
                with an article rather than naming it. A weight you set by hand is
                treated as a statement and is never decayed back toward the default.
              </p>
            </div>

            {sources.interests.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No interests yet. Without them, relevance and bridge both score zero and
                the digest is ordered by quality, freshness and novelty alone.
              </p>
            ) : (
              <ul className="space-y-1">
                {sources.interests.map(i => (
                  <li key={i.interestId} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{i.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500">
                        {i.kind}
                        {i.explicitFeedback && ' · weight set by you, never decayed'}
                      </p>
                    </div>
                    <input
                      type="range"
                      min={0.05} max={1} step={0.05}
                      value={i.weight}
                      onChange={e => setInterestWeight(i.interestId, Number(e.target.value))}
                      className="w-28"
                    />
                    <span className="w-8 text-right text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                      {i.weight.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeInterest(i.interestId)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                      title="Delete. Sub-interests become top-level rather than being deleted with it."
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Tuning ───────────────────────────────────────────────────── */}
        {tab === 'tuning' && sources && (
          <div>
            <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Scoring weights</h3>
              <p className="mb-3 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                These are starting points, not facts about your preferences.
                {sources.weightsAreDefault
                  ? ' You are on the defaults, so improvements to them reach you automatically.'
                  : ' You have set your own — they will not change when the defaults do.'}
                {' '}Raise novelty for more exploration, relevance to stay nearer what you already follow.
              </p>
              {Object.entries(sources.weights).map(([name, value]) => (
                <div key={name} className="mb-2 flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] text-gray-500 dark:text-gray-400">{name}</span>
                  <input
                    type="range"
                    min={0} max={0.6} step={0.01}
                    value={value}
                    onChange={e => {
                      const next = { ...sources.weights, [name]: Number(e.target.value) }
                      setSources({ ...sources, weights: next, weightsAreDefault: false })
                    }}
                    onMouseUp={() => saveWeights(sources.weights)}
                    onTouchEnd={() => saveWeights(sources.weights)}
                    className="flex-1"
                  />
                  <span className="w-10 text-right text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
              <button
                onClick={() => build(true)}
                disabled={!!busy}
                className="mt-2 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
              >
                Preview with these weights
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">The mix</h3>
              <p className="mb-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
                How many of the twenty slots each part of the feed gets.
                {sources.discoveryFloorApplied && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {' '}The discovery minimum has raised your adjacent and outside slots —
                    unfamiliar items get fewer clicks by definition, so allocating purely
                    by engagement would remove discovery within a month.
                  </span>
                )}
              </p>
              <ul className="space-y-0.5">
                {sources.plan.map(p => (
                  <li key={p.bucket} className="text-[11px] text-gray-600 dark:text-gray-300">
                    {p.bucket} — {p.slots} slot{p.slots === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Is it working? ───────────────────────────────────────────── */}
        {tab === 'health' && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Six measurements, kept separate
            </h3>
            <p className="mb-3 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
              There is no overall score here on purpose. A single engagement number can
              make a feed more clickable while making it less useful, so these stay apart
              and each states what it was measured over.
            </p>
            {busy === 'health' && (
              <p className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" /> measuring…
              </p>
            )}
            {health?.reason && <p className="text-xs text-gray-500 dark:text-gray-400">{health.reason}</p>}
            {health?.prose && (
              <ul className="space-y-1">
                {health.prose.map((l, i) => (
                  <li key={i} className="text-[11px] leading-snug text-gray-600 dark:text-gray-300">· {l}</li>
                ))}
              </ul>
            )}
            <button
              onClick={loadHealth}
              disabled={!!busy}
              className="mt-3 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
            >
              Re-measure
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
