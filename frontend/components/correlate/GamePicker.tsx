'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Plus } from 'lucide-react'
import { ACCENT_CLASSES, GAME_LIST } from '@/lib/correlate/games'
import { getMedium, resolveMedia } from '@/lib/correlate/media'
import { RELATIONS, resolveRelations } from '@/lib/correlate/relations'
import type { CorrelationGame, MediumId } from '@/lib/correlate/types'

const JUDGE_LABEL: Record<CorrelationGame['judge'], string> = {
  player: 'Social — you judge the connection',
  narrator: 'Story — an interpreter turns the offering into an event',
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
 * Start a game.
 *
 * One list, in GAME_LIST order, with Tag first — its rules fit in a sentence and
 * every other game is a variation on the exchange it sets up.
 *
 * This used to be two groups, "Across media" and "Music only". That split was a
 * quarantine for the games this section grew out of, and it was doing two bad
 * things at once: implying the music games were a lesser tier, and making a reader
 * scroll past a heading to find out that most of them were medium-agnostic all
 * along. Every game is cross-medium now, so there is nothing to separate.
 *
 * Each card shows its media and its relations, because that pairing is what
 * actually changes play — the same offerings produce very different games depending
 * on which connections are legal and who gets to rule on them.
 */
export default function GamePicker({
  available,
  onStart,
  starting,
}: {
  available: MediumId[]
  onStart: (gameId: string) => void
  starting: string | null
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Start a game</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3 max-w-2xl leading-relaxed">
        Every one of these accepts an offering in any medium, and a reply may change medium whenever
        the connection is better said in another one. Tag is the place to start; the rest are
        variations on the exchange it sets up.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {GAME_LIST.map(game => (
          <GameCard key={game.id} game={game} available={available} onStart={onStart} starting={starting} />
        ))}
      </div>
    </section>
  )
}

function GameCard({ game, available, onStart, starting }: {
  game: CorrelationGame
  available: MediumId[]
  onStart: (gameId: string) => void
  starting: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const accent = ACCENT_CLASSES[game.accent]

  const media = resolveMedia(game.media).filter(m => available.includes(m))
  const relations = resolveRelations(game.relations)
  const playable = media.length > 0

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

        <div className="mt-3 flex flex-wrap gap-1">
          {media.map(id => (
            <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {getMedium(id)?.plural ?? id}
            </span>
          ))}
        </div>

        <dl className="mt-3 space-y-1.5">
          <div className="flex gap-2 text-xs">
            <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-20">An offering is</dt>
            <dd className="text-gray-700 dark:text-gray-300">{game.offeringIs}</dd>
          </div>
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
    </div>
  )
}
