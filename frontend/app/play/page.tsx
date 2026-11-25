'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ChevronDown, Loader2, Plus, RotateCcw, Search, Shuffle, Trash2, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeProvider'
import { ensureSession } from '@/lib/anonAuth'
import { track } from '@/lib/analytics'
import { timeAgo } from '@/lib/timeAgo'
import { fuzzySearch } from '@/lib/fuzzy'
import { correlateQueries, fetchAvailableMedia } from '@/lib/queries/correlate'
import { ACCENT_CLASSES, FEATURED_GAMES, GAME_LIST, getGame, retiredGameName } from '@/lib/correlate/games'
import { MEDIUM_LIST, getMedium, mediaByProvider } from '@/lib/correlate/media'
import { RELATION_LIST } from '@/lib/correlate/relations'
import type { CorrelationSession, MediumId } from '@/lib/correlate/types'
import CorrelationBoard from '@/components/correlate/CorrelationBoard'
import ExampleChain from '@/components/correlate/ExampleChain'
import GamePicker from '@/components/correlate/GamePicker'

export const dynamic = 'force-dynamic'

/** The order listSessions() returns, so a restored game lands back in its place. */
const byRecency = (a: CorrelationSession, b: CorrelationSession) =>
  b.updated_at.localeCompare(a.updated_at)

/**
 * How many games to list before collapsing the rest.
 *
 * "Start a game" sits BELOW your games, which is the right order — a returning
 * player wants to get back into one, and making them scroll past five cards of
 * games they are not playing to reach the one they are would be worse. But the
 * list had no bound while `listSessions` returns thirty, so the cost of starting
 * a new game grew with every game you had ever started: thirty rows of scroll
 * to reach a control that had not moved.
 *
 * Capping the list fixes it in the direction that keeps both reachable, where
 * reordering the page would only have swapped which one was buried. Six because
 * it covers the handful anybody is actually mid-way through and keeps the picker
 * inside the first scroll on a laptop.
 */
const VISIBLE_GAMES = 6

/**
 * AI Play Along — correlation games.
 *
 * There is no connect step and no account gate: the only session is the anonymous
 * one ensureSession() makes. That is a direct consequence of the provider choices —
 * every catalogue here is keyless, and the one that is not (film & TV) is hidden
 * rather than gated.
 */
function PlayPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const gameId = params.get('game')

  const [sessions, setSessions] = useState<CorrelationSession[]>([])
  const [trashed, setTrashed] = useState<CorrelationSession[]>([])
  const [showTrash, setShowTrash] = useState(false)
  /** Whether the games list is showing everything past `VISIBLE_GAMES`. */
  const [showAllGames, setShowAllGames] = useState(false)
  /** Fuzzy filter over your games. See `shownGames` for what it searches. */
  const [gameQuery, setGameQuery] = useState('')
  const [media, setMedia] = useState<MediumId[]>(['music'])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [error, setError] = useState('')
  /**
   * Whether the two registry cards are showing.
   *
   * They used to be unconditional and above everything — the media and the
   * seven relations, twelve rows and seven rows, before the first control on
   * the page. Neither is wrong and neither is readable on arrival: a list of
   * seven relations means nothing to somebody who has not seen one used, which
   * is exactly what the example below now does instead. Closed by default,
   * one click away forever, and `ExampleChain` links straight at it.
   */
  const [showRules, setShowRules] = useState(false)
  /**
   * Whether the worked example is showing — `null` means "whatever suits".
   *
   * The default is a question about the player, not about the page: somebody
   * with no games has never seen a turn, and somebody with six does not need
   * two of them written out above their own. So the default follows
   * `sessions.length`, and this override exists only to let either kind of
   * player disagree. It is deliberately NOT persisted: a returning player who
   * opened it once wants it that session, not as a new permanent fixture at the
   * top of the page.
   */
  const [exampleOverride, setExampleOverride] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      await ensureSession()
      try {
        const [list, binned, available] = await Promise.all([
          correlateQueries.listSessions().catch(() => [] as CorrelationSession[]),
          correlateQueries.listTrashedSessions().catch(() => [] as CorrelationSession[]),
          fetchAvailableMedia(),
        ])
        if (!cancelled) { setSessions(list); setTrashed(binned); setMedia(available) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const startGame = useCallback(async (id: string, turnLimit?: number) => {
    setStarting(id)
    setError('')
    try {
      const session = await correlateQueries.createSession(id, media, undefined, turnLimit)
      track('correlate_game_started', { game: id, from: 'play', turnLimit: turnLimit ?? null })
      setSessions(s => [session, ...s])
      router.push(`/play?game=${session.id}`)
    } catch (e: any) {
      setError(e?.message ?? 'Could not start that game')
    } finally {
      setStarting(null)
    }
  }, [router, media])

  /**
   * Move a game to the trash.
   *
   * This button used to hard-delete, which cascaded to every turn in the chain
   * with no confirmation and no way back. Now it is reversible, and the only
   * irreversible act in the section is Empty trash, which asks first.
   */
  const trashGame = useCallback(async (session: CorrelationSession) => {
    setSessions(s => s.filter(x => x.id !== session.id))
    setTrashed(t => [{ ...session, deleted_at: new Date().toISOString() }, ...t])
    setError('')
    try {
      await correlateQueries.trashSession(session.id)
      track('correlate_game_trashed', { game: session.mode, from: 'play' })
    } catch (e: any) {
      setTrashed(t => t.filter(x => x.id !== session.id))
      setSessions(s => [...s, session].sort(byRecency))
      setError(e?.message ?? 'Could not move that game to the trash')
    }
  }, [])

  const restoreGame = useCallback(async (session: CorrelationSession) => {
    setTrashed(t => t.filter(x => x.id !== session.id))
    setSessions(s => [...s, { ...session, deleted_at: null }].sort(byRecency))
    setError('')
    try {
      await correlateQueries.restoreSession(session.id)
    } catch (e: any) {
      setSessions(s => s.filter(x => x.id !== session.id))
      setTrashed(t => [...t, session].sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? '')))
      setError(e?.message ?? 'Could not restore that game')
    }
  }, [])

  const emptyTrash = useCallback(async () => {
    const n = trashed.length
    if (n === 0) return
    if (!confirm(
      `Permanently delete ${n} game${n === 1 ? '' : 's'}? Every turn in ` +
      `${n === 1 ? 'it' : 'them'} goes too, and this cannot be undone.`
    )) return
    const previous = trashed
    setTrashed([])
    setError('')
    try {
      await correlateQueries.emptyTrash()
    } catch (e: any) {
      setTrashed(previous)
      setError(e?.message ?? 'Could not empty the trash')
    }
  }, [trashed])

  /**
   * Your games, filtered by the search box.
   *
   * ── What a query is allowed to match ──────────────────────────────────
   *
   * The title and the game's name, joined — the same composed-key shape the
   * preset picker uses. Both are needed and for different reasons: titles are
   * named after a whole track rather than after the game type, so "tag" finds
   * nothing without the second half, and a player who remembers the song but
   * not which game it was finds nothing without the first.
   *
   * The media a game visited are deliberately NOT in the key. They are on the
   * row and it was tempting, but there are a dozen media and they recur in
   * nearly every game, so adding them lengthens every haystack with words that
   * barely discriminate — which costs the density bonus in `fuzzyScore` on
   * every search to make one rare search possible. One line to add if that
   * trade turns out to be wrong.
   *
   * `retiredGameName` is in the fallback chain so a game of a retired type
   * stays findable by the name it was played under, rather than only by its
   * raw mode id.
   *
   * ── The cap does not apply to a search ────────────────────────────────
   *
   * `VISIBLE_GAMES` exists so a long list does not bury the picker below it,
   * which is a browsing problem. A player who has typed something is not
   * browsing: they have told us what they want, and hiding the seventh match
   * behind "6 older games" would be the collapse working against the search.
   * So a query shows every match, and the toggle disappears while one is live.
   */
  const searching = gameQuery.trim().length > 0
  const matchedGames = useMemo(
    () => fuzzySearch(sessions, gameQuery, s => {
      const game = getGame(s.mode)
      return `${s.title} ${game?.name ?? retiredGameName(s.mode) ?? s.mode}`
    }).map(m => m.item),
    [sessions, gameQuery],
  )
  const shownGames = searching
    ? matchedGames
    : (showAllGames ? sessions : sessions.slice(0, VISIBLE_GAMES))

  const activeSession = gameId ? sessions.find(s => s.id === gameId) : undefined

  // Deep link straight to a game: fetch the one session we need.
  const [deepLinked, setDeepLinked] = useState<CorrelationSession | null>(null)
  useEffect(() => {
    if (!gameId || activeSession || loading) { setDeepLinked(null); return }
    let cancelled = false
    correlateQueries.getSession(gameId)
      .then(s => { if (!cancelled) setDeepLinked(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [gameId, activeSession, loading])

  const current = activeSession ?? deepLinked ?? null

  if (current) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CorrelationBoard
          session={current}
          onBack={() => router.push('/play')}
          onSessionChange={next => setSessions(s => s.map(x => (x.id === next.id ? next : x)))}
        />
      </div>
    )
  }

  const hiddenMedia = MEDIUM_LIST.filter(m => !media.includes(m.id))
  /**
   * Whether the worked example shows: the player's choice if they made one,
   * otherwise "only if you have never played".
   *
   * Written as `?? ` rather than seeding the state from `sessions.length` in an
   * effect, so there is one source of truth for the default and it cannot get
   * out of step with the list it is derived from.
   */
  const showExample = exampleOverride ?? sessions.length === 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft size={15} /> Library
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 mb-2">
          <Shuffle size={28} className="text-fuchsia-500 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Play Along</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Correlation games — where a turn proposes a connection and makes it perceptible.
            </p>
          </div>
        </div>
        {/* What used to be here: two bullets stating the loop, a line pointing at
            the game cards, and the two registry cards below — sixty lines of prose
            above the first thing on the page anybody could click.

            Every sentence of it was true. None of it was learnable in that form.
            "Your offering → a reading of it → a reply offering → what carried
            across" is a correct description of the loop and an unreadable one,
            because all four nouns are terms of art that the sentence introduces at
            the same time. So the loop is now shown instead of stated, by
            `ExampleChain` below, which is the same four stages with something
            under each arrow — and the relations are named where one was used
            rather than listed seven-at-once before any of them has a referent.

            The line about who names the connection is dropped rather than moved:
            every game card already says it, from `declaredRelation` and
            `enforcesConstraint` rather than from prose that could drift, which was
            the reason the old line only pointed at the cards. */}

        {/* ── ONE TAP TO A GAME, ABOVE EVERYTHING ────────────────────────────
            `GamePicker` is the last thing on this page, and it is correct that it
            is: the comment on `VISIBLE_GAMES` works out why a returning player's
            own games belong above it, and capping that list was the right fix for
            the scroll it caused. What neither addressed is the FIRST visit from a
            phone, where the picker sits below a header, a title, an example chain
            and up to six game rows — so the cheapest possible action, "start the
            default game", cost a scroll past everything on the page.

            This is the cheap action hoisted, and nothing else moves. The picker
            keeps every option it had; this row is the subset that needs no
            options at all.

            DRIVEN BY `FEATURED_GAMES`, NOT BY A LIST WRITTEN HERE. The registry
            already names which games lead — `FEATURED_GAME_IDS` in
            lib/correlate/games.ts — and `tag` is first in it. A literal 'tag'
            here would be a second copy of that decision, going stale the day the
            registry is reordered and silently promoting the wrong game.

            WHY ONE TAP IS HONEST RATHER THAN A SHORTCUT THAT HIDES A CHOICE:
            `startGame(id)` takes an id and nothing else. `turnLimit` is optional
            and the media come from this page's `media` state, so there was never
            a required decision between arriving and playing.

            THIS ROW DELIBERATELY SAYS NOTHING ABOUT MEDIA, and the first draft
            did — "with {media…}" under the heading, on the reasoning that a tap
            whose consequences are invisible is worse than a tap that is slow.
            Both halves of that were wrong and a phone-width screenshot is what
            showed it. `media` is seeded `['music']` and then REPLACED by
            `fetchAvailableMedia`, so by paint it is all eleven and the line
            wrapped to two, crushing the heading beside it. Worse than ugly, it
            was a false claim: that list is what the BUILD supports, not what the
            game will use — every game is `media: 'all'` and it is `coreMedia`
            plus the starting tuning that decide what is actually in play. A
            correct version of the line would have to explain the tuning, which
            is the game card's job and is one tap away below. */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Start playing
          </h2>
          <div className="flex flex-wrap gap-2">
            {FEATURED_GAMES.map(g => {
              const accent = ACCENT_CLASSES[g.accent] ?? ACCENT_CLASSES.indigo
              return (
                <button
                  key={g.id}
                  onClick={() => startGame(g.id)}
                  disabled={!!starting || media.length === 0}
                  title={g.tagline}
                  /* `min-h-11` is a tap target and not a style preference: this
                     row exists for phones, and the picker's own chips are sized
                     for a pointer. */
                  className={`min-h-11 px-4 inline-flex items-center gap-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${accent.ring} ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110`}
                >
                  {starting === g.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Plus size={15} />}
                  {g.name}
                </button>
              )
            })}
          </div>
          {/* The way to everything this row leaves out. It points at the picker
              that was always there rather than replacing it, so the full set of
              games, lengths and variants is one tap away and not gone. */}
          <a
            href="#start-a-game"
            className="inline-block mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            All {GAME_LIST.length} games, lengths and variants ↓
          </a>
        </div>

        {/* The registries, one click away rather than unconditional. Both cards are
            unchanged; what changed is that a player meets them when they want them.

            Kept in the disclosure and NOT folded into the example: they are the
            only place the providers are named, and "which catalogues is this
            searching" is a fair question to be able to answer without starting a
            game. */}
        <button
          onClick={() => setShowRules(v => !v)}
          aria-expanded={showRules}
          className="flex items-center gap-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <BookOpen size={13} />
          Where the offerings come from, and what a reply can do
          <ChevronDown size={13} className={`transition-transform ${showRules ? 'rotate-180' : ''}`} />
        </button>

        {showRules && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Where the offerings come from</p>
            {/* Grouped by provider, not one row per medium. Eleven rows of which
                eight repeated one of two strings four times each read as filler,
                and buried the only thing the list is for: there are a handful of
                sources, and they come in three kinds. Five rows now say it. */}
            <ul className="space-y-1.5">
              {mediaByProvider(media).map(group => (
                <li key={group.provider} className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {group.media.map(m => m.plural).join(', ')}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500"> — {group.provider}</span>
                </li>
              ))}
            </ul>
            {hiddenMedia.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                {hiddenMedia.map(m => m.plural).join(', ')} {hiddenMedia.length === 1 ? 'is' : 'are'} not
                enabled on this deployment.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">What a reply can do</p>
            <ul className="space-y-1.5">
              {RELATION_LIST.map(r => (
                <li key={r.id} className="text-xs text-gray-600 dark:text-gray-300" title={r.example}>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{r.name}</span>
                  <span className="text-gray-400 dark:text-gray-500"> — {r.does}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            {/* The example, above the player's own games and above the picker.

                Gated on `loading` by sitting inside this branch, which matters
                more than it looks: the default is "show it when you have no
                games", and before the request lands everybody has no games. An
                example that appears for half a second and vanishes under a
                returning player's list would be worse than never showing it. */}
            {showExample && (
              <ExampleChain
                onStart={startGame}
                starting={starting}
                onShowRules={() => setShowRules(true)}
              />
            )}
            {/* The way back to it for a player who has games, and the way out of
                it for one who does not. One control, because the override is one
                piece of state and a second button would imply a second.

                Unconditional, and that is the whole of the bug it is written to
                avoid: gated on `sessions.length > 0 || showExample`, a
                first-time player who hid the example removed the only control
                that could bring it back — no games to satisfy the first clause,
                and hiding it had just falsified the second. A toggle must not be
                reachable only in one of the two states it toggles between. */}
            <button
              onClick={() => setExampleOverride(!showExample)}
              className="flex items-center gap-1.5 mb-8 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronDown size={13} className={`transition-transform ${showExample ? 'rotate-180' : ''}`} />
              {showExample ? 'Hide the example' : 'Show the example game again'}
            </button>

            {sessions.length > 0 && (
              <section className="mb-10">
                <div className="flex items-baseline gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Your games
                    {/* The count, so a collapsed list says what it is holding
                        back rather than looking like the whole of it. */}
                    {sessions.length > VISIBLE_GAMES && (
                      <span className="ml-1.5 font-normal text-gray-400 dark:text-gray-500">
                        {sessions.length}
                      </span>
                    )}
                  </h2>
                  {/* A way down to the picker that does not depend on how long
                      this list is. Capping the list bounds the scroll; this
                      removes it, which is the other half of the complaint — the
                      picker was always below your games, and with any number of
                      them that is still a scroll.

                      A scroll rather than a jump, and rather than moving the
                      picker up here: the picker is where it belongs on the page,
                      and landing on it with the list still above means a player
                      can see where they came from. `scrollIntoView` and not an
                      `#anchor` href, because the href would put a fragment in
                      the URL that survives a reload and a share. */}
                  <button
                    onClick={() => document.getElementById('start-a-game')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="ml-auto flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Plus size={13} /> New game
                  </button>
                </div>

                {/* The search field appears only once there is enough to search,
                    the same furniture rule the preset picker follows: below that
                    the list IS the interface and a filter above four rows is
                    clutter. Keyed to VISIBLE_GAMES because that is already the
                    number which decides this list is long enough to need help —
                    one number governing one idea, rather than a second
                    threshold to keep in step with the first. */}
                {sessions.length > VISIBLE_GAMES && (
                  <div className="relative mb-3">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      value={gameQuery}
                      onChange={e => setGameQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') setGameQuery('') }}
                      placeholder="Find a game by name or type…"
                      aria-label="Find one of your games"
                      className="w-full pl-7 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    {searching && (
                      <button
                        onClick={() => setGameQuery('')}
                        aria-label="Clear the search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                <ul className="space-y-2">
                  {shownGames.map(s => {
                    const game = getGame(s.mode)
                    const accent = ACCENT_CLASSES[game?.accent ?? 'indigo']
                    const visited: string[] = Array.isArray(s.world_state?.mediaVisited) ? s.world_state.mediaVisited : []
                    return (
                      <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                        <Link href={`/play?game=${s.id}`} className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 flex-wrap min-w-0">
                            {/* `title` so a cut name is still readable on
                                hover, now that these are named after whole
                                tracks rather than after the game type. */}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={s.title}>{s.title}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${accent.chip}`}>
                              {game?.name ?? retiredGameName(s.mode) ?? s.mode}
                            </span>
                            {s.status === 'finished' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex-shrink-0">finished</span>
                            )}
                          </span>
                          <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {s.turn_count} turn{s.turn_count === 1 ? '' : 's'} · {timeAgo(new Date(s.updated_at))}
                            {visited.length > 1 && ` · ${visited.map(m => getMedium(m)?.plural ?? m).join(' → ')}`}
                          </span>
                        </Link>
                        <button
                          onClick={() => trashGame(s)}
                          title="Move this game to the trash"
                          aria-label={`Move “${s.title}” to the trash`}
                          className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {/* The expander, naming what it is hiding. "Show more" would
                    make a player guess whether the game they are looking for is
                    behind it; "17 older games" answers that without a click. */}
                {/* A search that matched nothing says so, rather than leaving an
                    empty space where the list was. Without this the page reads
                    as though the games had been deleted — and the trash button
                    is right there on every row, so that is a reading a player
                    could genuinely reach. */}
                {searching && shownGames.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No game matches “{gameQuery.trim()}”.{' '}
                    <button onClick={() => setGameQuery('')} className="underline hover:text-gray-700 dark:hover:text-gray-200">
                      Show all {sessions.length}
                    </button>
                  </p>
                )}

                {/* Hidden while a search is live: the cap is not applied then, so
                    the count it quotes would be wrong and the control would do
                    nothing a player could see. */}
                {!searching && sessions.length > VISIBLE_GAMES && (
                  <button
                    onClick={() => setShowAllGames(v => !v)}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <ChevronDown size={13} className={`transition-transform ${showAllGames ? 'rotate-180' : ''}`} />
                    {showAllGames
                      ? 'Show fewer'
                      : `${sessions.length - VISIBLE_GAMES} older game${sessions.length - VISIBLE_GAMES === 1 ? '' : 's'}`}
                  </button>
                )}
                {/* How many of how many, while filtering. The list alone cannot
                    say whether three rows is "three matches" or "all your
                    games", and those are different facts. */}
                {searching && shownGames.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {shownGames.length} of {sessions.length} games
                  </p>
                )}
              </section>
            )}

            {/* Trash. Collapsed, and absent entirely when empty — it is a safety
                net, not a part of the section anyone should have to look at. The
                shape matches the library's trash on the home page deliberately. */}
            {trashed.length > 0 && (
              <section className="mb-10">
                <button
                  onClick={() => setShowTrash(v => !v)}
                  className="flex items-center gap-2 mb-3 group"
                >
                  <Trash2 size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    Trash
                  </h2>
                  <span className="text-xs text-gray-400">
                    · {trashed.length} game{trashed.length === 1 ? '' : 's'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${showTrash ? 'rotate-180' : ''}`} />
                </button>
                {showTrash && (
                  <div>
                    <ul className="space-y-2 mb-3">
                      {trashed.map(s => {
                        const game = getGame(s.mode)
                        return (
                          <li key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-500 dark:text-gray-400 truncate">{s.title}</span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {game?.name ?? retiredGameName(s.mode) ?? s.mode} · {s.turn_count} turn{s.turn_count === 1 ? '' : 's'}
                                {s.deleted_at && ` · trashed ${timeAgo(new Date(s.deleted_at))}`}
                              </span>
                            </span>
                            <button
                              onClick={() => restoreGame(s)}
                              className="flex items-center gap-1 flex-shrink-0 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                            >
                              <RotateCcw size={12} /> Restore
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <button
                      onClick={emptyTrash}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={12} /> Empty trash
                    </button>
                  </div>
                )}
              </section>
            )}

            {error && <p className="mb-3 text-xs text-red-500 dark:text-red-400">{error}</p>}
            {/* The scroll target for "New game" above. On the wrapper rather
                than inside GamePicker, so the picker stays a component that
                knows nothing about the page it sits on. */}
            <div id="start-a-game" className="scroll-mt-4">
              <GamePicker available={media} onStart={startGame} starting={starting} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    }>
      <PlayPageInner />
    </Suspense>
  )
}
