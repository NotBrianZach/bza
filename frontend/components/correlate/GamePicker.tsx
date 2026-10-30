'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Plus, Shuffle } from 'lucide-react'
import { ACCENT_CLASSES } from '@/lib/correlate/games'
import { ENTRY_GAME_ID, openingGames, variantGames } from '@/lib/correlate/switching'
import { getMedium, resolveMedia } from '@/lib/correlate/media'
import { RELATIONS, resolveRelations } from '@/lib/correlate/relations'
import type { CorrelationGame, MediumId } from '@/lib/correlate/types'

/**
 * Kept exhaustive rather than `Partial`, which is why `verifier` is spelled here
 * despite being unreachable from this picker.
 *
 * No game in `GAMES` sets `verifier` and none can: the practice engine is a
 * sibling that does not use the turn route (see lib/concepts/verify.ts), so it
 * never appears in `GAME_LIST`. The exhaustive `Record` is still the right type,
 * because it makes adding a judge a compile error here instead of a blank line in
 * the UI — which is exactly how this entry came to be written.
 */
const JUDGE_LABEL: Record<CorrelationGame['judge'], string> = {
  player: 'Social — you judge the connection',
  narrator: 'Story — an interpreter turns the offering into an event',
  verifier: 'Mechanical — a worker rules, and may rule it unsettled',
}

const DECLARATION_LABEL: Record<CorrelationGame['declaredRelation'], string> = {
  required: 'You name your relation before it is judged',
  optional: 'You may name your relation, or let it be read',
  never: 'The relation is named for you',
}

/** Games that can actually turn a move away get a line saying so. */
const ENFORCED_LABEL = 'Strict — a move that does not connect is turned away'

const PIECE_ROWS = [
  ['Your move', 'playerMove'],
  ['Interpreter', 'interpreter'],
  ['Response', 'responseRule'],
  ['Persists', 'worldState'],
  ['Constraint', 'constraint'],
  ['Goal', 'goal'],
] as const

/**
 * How long a game runs for.
 *
 * Three options and open-ended first, because open-ended is what every game
 * played before limits existed was and the default must not quietly change under
 * anyone. The two lengths are chosen to be different *kinds* of game rather than
 * two points on a scale: eight is one sitting with no room to wander, and
 * sixteen is long enough that the chain develops a shape the closing reading can
 * find — which is the thing a limit exists to produce.
 */
const LENGTHS: { label: string; limit?: number; hint: string }[] = [
  { label: 'Open-ended', hint: 'Play until you stop. Close it whenever you like.' },
  { label: '8 turns', limit: 8, hint: 'One sitting. Every move counts and a branch costs you one.' },
  { label: '16 turns', limit: 16, hint: 'Long enough to develop a shape worth naming at the end.' },
]

/**
 * Start a game. All eleven are startable; five get a card.
 *
 * The split is `openingGames()` / `variantGames()`, and it is about what the
 * games *are* rather than about what may be created: five open on a scene of
 * their own, and six are the same exchange as Tag under different rules. So the
 * six live inside Tag's card, which is the only place that says so.
 *
 * This is the fourth shape the list has had and each change fixed the last one's
 * overcorrection, which is worth having written down:
 *
 *  1. Two groups, "Across media" and "Music only" — a quarantine for the games
 *     the section grew out of, implying a lesser tier and making a reader scroll
 *     past a heading to learn most of them were medium-agnostic anyway.
 *  2. One flat list of eleven, which read as eleven unrelated games and asked
 *     the player to commit up front to a distinction they could not yet see.
 *  3. Five cards and a dashed box reading "6 more are inside a game of Tag".
 *     That described the relationship correctly and then trapped it: the only
 *     route in was a mid-chain switch, and a switch needed something on the
 *     table, so a variant could not be played until a move of something else had
 *     been played. Reported as exactly that.
 *  4. Five cards, with the six inside the one they are variants of, startable.
 *
 * Each card shows its media and its relations, because that pairing is what
 * actually changes play — the same offerings produce very different games
 * depending on which connections are legal and who gets to rule on them.
 */
export default function GamePicker({
  available,
  onStart,
  starting,
}: {
  available: MediumId[]
  onStart: (gameId: string, turnLimit?: number) => void
  starting: string | null
}) {
  const opening = openingGames()
  const variants = variantGames()
  /**
   * One control above the grid rather than one per card.
   *
   * The length is orthogonal to the game — any of the five can be played to a
   * limit — so five copies of the same three buttons would be five chances to
   * read it as a property of the game it sits on.
   */
  const [length, setLength] = useState(0)

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Start a game</h2>
      {/* The clause that used to open this ("every one of these accepts an
          offering in any medium, and a reply may change medium…") was the third
          telling of that point on the page — the intro bullets make it, and the
          media card makes it by listing them. Dropped. What is left is the only
          thing this paragraph knew that nothing else did. */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3 max-w-2xl leading-relaxed">
        Tag is the place to start, and its variants are inside its card. The other four each open
        on a scene of their own, which is why they are separate games rather than variations.
      </p>
      <div className="mb-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          How long
        </p>
        <div className="flex flex-wrap gap-1.5">
          {LENGTHS.map((l, i) => (
            <button
              key={l.label}
              onClick={() => setLength(i)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                i === length
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          {LENGTHS[length].hint}
          {LENGTHS[length].limit !== undefined &&
            ' At the end it tells you what the chain turned out to be about.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {opening.map(game => (
          <GameCard
            key={game.id}
            game={game}
            available={available}
            onStart={id => onStart(id, LENGTHS[length].limit)}
            starting={starting}
            // The entry card carries the variants, because they are variants *of
            // the exchange it sets up* and nowhere else would say so.
            variants={game.id === ENTRY_GAME_ID ? variants : undefined}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * The variants, inside the card for the game they are variants of.
 *
 * They were a dashed box underneath the grid saying "6 more are inside a game of
 * Tag", which told the player where they were and then would not let them go: the
 * only route in was a mid-chain switch, and a switch needed something on the
 * table, so a variant could not be played until a move of something else had
 * been played first. Reported as exactly that.
 *
 * Starting one directly is also the *better* route when you already know which
 * one you want, and not only by a click. `createSession` snapshots the game's own
 * rules and relation set and computes its starting tuning from its own
 * `coreMedia` — so a session created as Embodiment opens with the four physical
 * media unmuted, and one created as Tag and switched does not.
 */
function Variants({ games, onStart, starting }: {
  games: CorrelationGame[]
  onStart: (gameId: string) => void
  starting: string | null
}) {
  return (
    <div className="px-4 pb-4">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
        <Shuffle size={11} /> or open as a variant
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {games.map(g => {
          const accent = ACCENT_CLASSES[g.accent]
          return (
            <li key={g.id}>
              <button
                onClick={() => onStart(g.id)}
                disabled={starting !== null}
                title={g.tagline}
                className={`text-[11px] font-medium px-2 py-1 rounded-full border transition-all disabled:opacity-40 ${accent.ring} ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110`}
              >
                {starting === g.id ? <Loader2 size={10} className="inline animate-spin" /> : g.name}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
        The same exchange under different rules — who names the connection, who rules on it, what
        the world keeps. You can also switch between any of them mid-chain, and switch back.
      </p>
    </div>
  )
}

function GameCard({ game, available, onStart, starting, variants }: {
  game: CorrelationGame
  available: MediumId[]
  onStart: (gameId: string) => void
  starting: string | null
  /** Variants of this game's exchange, offered under its own start button. */
  variants?: CorrelationGame[]
}) {
  const [expanded, setExpanded] = useState(false)
  const accent = ACCENT_CLASSES[game.accent]

  const media = resolveMedia(game.media).filter(m => available.includes(m))
  const relations = resolveRelations(game.relations)
  const playable = media.length > 0

  /**
   * Whether this game's media are worth stating at all.
   *
   * Every game is `media: 'all'`, so the media row was the same seven or eight
   * chips on all eleven cards — directly under a heading that had just said every
   * game accepts any medium. A row identical across the whole list tells a reader
   * nothing about the game they are reading about, and eleven copies of it make the
   * cards harder to compare on the things that do differ.
   *
   * Derived rather than deleted: if a game is ever added that does not take
   * everything, the row comes back for exactly that game. Nothing has to remember
   * to turn it on.
   */
  const narrowed = media.length < available.length

  return (
    <div className={`rounded-2xl border ${accent.ring} bg-white dark:bg-gray-800 overflow-hidden flex flex-col`}>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{game.name}</h3>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${accent.chip}`}>
            {game.judge}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{game.tagline}</p>

        <dl className="mt-3 space-y-1.5">
          <div className="flex gap-2 text-xs">
            {/* "Plays as", not "An offering is".
                `offeringIs` is a *role* — a clue, an argument, a building
                material — never a list of media. Labelling it as the definition
                of an offering put it in competition with the media card at the
                top of /play, which defines the same noun by its material and is
                the only place the providers appear. "Plays as" states the actual
                relationship: the material is constant across the section, and
                what it plays as is what the game changes. */}
            <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">Plays as</dt>
            <dd className="text-gray-700 dark:text-gray-300">{game.offeringIs}</dd>
          </div>
          {/* Labelled rather than a bare row of chips: on a card where the others
              say nothing about media, unlabelled chips read as decoration. */}
          {narrowed && (
            <div className="flex gap-2 text-xs">
              <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">Media</dt>
              <dd className="text-gray-700 dark:text-gray-300">
                {media.map(id => getMedium(id)?.plural ?? id).join(', ')} only
              </dd>
            </div>
          )}
          <div className="flex gap-2 text-xs">
            <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">Relations</dt>
            <dd className="text-gray-700 dark:text-gray-300">
              {relations.length === 7 ? 'All seven' : relations.map(r => RELATIONS[r].name).join(', ')}
            </dd>
          </div>
          <div className="flex gap-2 text-xs">
            <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">Read by</dt>
            <dd className="text-gray-700 dark:text-gray-300">
              {JUDGE_LABEL[game.judge]}
              <span className="block text-gray-500 dark:text-gray-400 mt-0.5">{DECLARATION_LABEL[game.declaredRelation]}</span>
              {game.enforcesConstraint && (
                <span className="block text-gray-500 dark:text-gray-400 mt-0.5">{ENFORCED_LABEL}</span>
              )}
            </dd>
          </div>
        </dl>

        {expanded && (
          <dl className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
            {PIECE_ROWS.map(([label, key]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</dt>
                <dd className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{game.pieces[key]}</dd>
              </div>
            ))}
          </dl>
        )}

        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-expanded={expanded}
        >
          <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Hide the rules' : 'The six pieces'}
        </button>
      </div>

      <button
        onClick={() => onStart(game.id)}
        disabled={starting !== null || !playable}
        title={playable ? undefined : 'None of this game’s media are available on this deployment'}
        className={`flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-sm font-medium border-t ${accent.ring} ${accent.bg} ${accent.text} hover:brightness-95 dark:hover:brightness-110 transition-all disabled:opacity-40`}
      >
        {starting === game.id
          ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
          : <><Plus size={14} /> Play {game.name}</>}
      </button>

      {/* Below the start button rather than above it: the headline game is the
          default and the variants are the qualification, so the primary action
          should not be the thing a reader scrolls past. */}
      {variants && variants.length > 0 && (
        <Variants games={variants} onStart={onStart} starting={starting} />
      )}
    </div>
  )
}
