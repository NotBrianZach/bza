'use client'

import { useState } from 'react'
import { ChevronDown, Shuffle, X } from 'lucide-react'
import { ACCENT_CLASSES, getGame } from '@/lib/correlate/games'
import { carriedSeedKeys, switchChanges, switchTargets, switchTier } from '@/lib/correlate/switching'
import type { CorrelationGame } from '@/lib/correlate/types'

/**
 * Change the game, from inside one.
 *
 * Three things about this control are consequences of the design rather than
 * choices about chrome, and all three are the reason it is not a dropdown that
 * acts immediately:
 *
 * 1. **A switch is a move, so it is armed rather than performed.** The switch
 *    *is* the next turn — you play a move under the new rules, and the last
 *    offering on the table is what it answers. There is no zero-turn boundary
 *    for the graph to represent, so there is nothing for this control to post.
 *    It sets what the composer sends with the player's next move, and if they
 *    never take one, nothing happened.
 *
 * 2. **Arming it changes the composer.** Tag → Correlation Chain flips
 *    `declaredRelation` from `never` to `required`, which means the very move
 *    that carries the switch has to name its relation. So the board reads the
 *    *armed* game, not the current one, for everything the composer shows —
 *    otherwise the player is asked for a move under rules that are one turn out
 *    of date and the server refuses it.
 *
 * 3. **What changes is stated before it changes.** `switchChanges` is the list,
 *    computed from the two registry entries rather than written per pair. The
 *    judge flipping is the entry a player is most likely to be surprised by —
 *    switching from Tag to Counterpoint moves the ruling from an interpreter to
 *    them — and it was the one the design left unexamined.
 *
 * Which games are in the list is `switchTargets`' business and not this
 * component's. What that means in practice is that the list is usually short and
 * occasionally has one entry nothing else does: from Duel, Transformation is
 * offered because the two share a scene, and from a chain game neither is. There
 * is nothing here to explain an absence — a player who wants Duel starts Duel.
 */
export default function GameSwitch({
  from,
  armed,
  onArm,
  disabled,
  onTable,
}: {
  /** The game this branch is currently being played as. */
  from: string
  /** The game the next move will be played under, when one is armed. */
  armed: string | null
  onArm: (gameId: string | null) => void
  disabled: boolean
  /**
   * Whether there is an offering on the table. The last offering is the whole of
   * what a switch carries, so with nothing there the control has nothing to
   * offer and says why instead of presenting a list that would be refused.
   */
  onTable: boolean
}) {
  const [open, setOpen] = useState(false)
  const targets = switchTargets(from)

  if (targets.length === 0) return null

  const armedGame = armed ? targets.find(g => g.id === armed) ?? null : null

  if (armedGame) {
    const accent = ACCENT_CLASSES[armedGame.accent]
    return (
      <div className={`rounded-xl border ${accent.ring} ${accent.bg} p-3`}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
            <Shuffle size={12} className={`inline mb-0.5 mr-1.5 ${accent.text}`} />
            Your next move is played as <span className="font-semibold">{armedGame.name}</span>.
          </p>
          <button
            onClick={() => onArm(null)}
            disabled={disabled}
            className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <X size={11} /> Stay in {currentName(from)}
          </button>
        </div>
        <Changes from={from} to={armedGame.id} />
        {/* Said here rather than in the list, because it is the thing that makes
            the switch harmless and a player is most likely to want it at the
            moment of committing: nothing already played is touched, and the old
            branch stays where it is. */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200/70 dark:border-gray-700/70 leading-relaxed">
          The turns above stay what they were — this move starts a branch under the new rules, and
          the branch you are on now remains playable from the map.
        </p>
      </div>
    )
  }

  if (!onTable) {
    return (
      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
        A switch answers the offering on the table under new rules, so there needs to be one. Play
        a move first.
      </p>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
      >
        <Shuffle size={11} />
        Play this move as another game
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {/* Deliberately says what is true of every entry and leaves the rest to
              the per-game line. "Your last offering becomes the opening move" is
              true of a fresh world and misleading where a scene crosses over, and
              one blurb cannot be both. */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            The game changes from your next move on. Nothing already played changes, and the branch
            you are on stays playable.
          </p>
          <ul className="space-y-1.5">
            {targets.map(game => (
              <li key={game.id}>
                <Target game={game} from={from} disabled={disabled} onArm={onArm} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * One candidate, expandable into what it changes.
 *
 * The tier is shown as a sentence about the world rather than as a number,
 * because "tier 1" is a fact about our analysis and "the chain carries over" is
 * a fact about the player's game. The two cases are genuinely different to play:
 * Tag → Chain continues the chain you built, and Tag → Embodiment starts a world
 * from your last offering.
 */
function Target({ game, from, disabled, onArm }: {
  game: CorrelationGame
  from: string
  disabled: boolean
  onArm: (gameId: string | null) => void
}) {
  const [shown, setShown] = useState(false)
  const accent = ACCENT_CLASSES[game.accent]
  const tier = switchTier(from, game.id)
  /**
   * Three states, as a phrase about the player's game rather than a tier number.
   * "Tier 1" is a fact about our analysis; "the chain carries over" is a fact
   * about what they are about to play.
   */
  const label =
    tier === 1 ? 'chain carries over'
    : tier === 3 ? `${carriedSeedKeys(from, game.id).join(' and ')} carries over`
    : 'fresh world'

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
            {game.name}
            <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${accent.chip}`}>
              {label}
            </span>
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{game.tagline}</p>
        </div>
        <button
          onClick={() => onArm(game.id)}
          disabled={disabled}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${accent.bg} ${accent.text} border ${accent.ring} hover:brightness-95 dark:hover:brightness-110 transition-all disabled:opacity-50`}
        >
          Switch
        </button>
      </div>
      <button
        onClick={() => setShown(s => !s)}
        aria-expanded={shown}
        className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronDown size={10} className={`transition-transform ${shown ? 'rotate-180' : ''}`} />
        {shown ? 'Hide' : 'What changes'}
      </button>
      {shown && <Changes from={from} to={game.id} />}
    </div>
  )
}

/** What a switch changes, from the registries. Shared by the list and the banner. */
function Changes({ from, to }: { from: string; to: string }) {
  const changes = switchChanges(from, to)
  if (changes.length === 0) return null
  return (
    <dl className="mt-2 space-y-1.5">
      {changes.map(c => (
        <div key={c.what} className="flex gap-2 text-[11px]">
          <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-28">{c.what}</dt>
          <dd className="text-gray-600 dark:text-gray-300 leading-relaxed min-w-0">{c.detail}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The name of the game being played now, for the "stay here" affordance.
 *
 * Falls back to not naming it rather than asserting a lookup: a branch can in
 * principle name a game the registry no longer has, and the board has a
 * dedicated explanation for that case — this control should not be the thing
 * that throws on the way there.
 */
function currentName(id: string): string {
  return getGame(id)?.name ?? 'this game'
}
