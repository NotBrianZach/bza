'use client'

import { ArrowDown, Frame, Hand, Loader2, Music2, Plus } from 'lucide-react'
import { ENTRY_GAME_ID } from '@/lib/correlate/switching'
import { getGame } from '@/lib/correlate/games'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS } from '@/lib/correlate/relations'
import { EXAMPLE_CHAIN, type ExampleMove } from '@/lib/correlate/exampleTurn'

/**
 * The worked example that opens /play for a player with no games.
 *
 * It replaces the intro prose rather than joining it. See
 * lib/correlate/exampleTurn.ts for what is being taught and why the content is
 * hard-coded; this file is only how it is laid out.
 *
 * ── The one thing this component must keep doing ──────────────────────────
 *
 * Saying it is an example. A reply rendered here did not come back from the
 * turn route, and the whole section rests on a player being able to trust that
 * what they are shown was really produced. So the heading says so in words, the
 * card is visually quieter than a real board, and nothing here is playable or
 * has a control that looks playable. If a later change makes this prettier at
 * the cost of that distinction, the change is wrong.
 */

/**
 * Icons for the three media the example uses, not all twelve.
 *
 * OfferingPicker has the full map because it renders every medium; copying it
 * here would be a second list to keep in step with the registry for no gain.
 * The fallback is the same one the picker uses.
 */
const ICONS: Record<string, any> = { Music2, Frame, Hand }

function MoveCard({ move, label }: { move: ExampleMove; label: string }) {
  const medium = getMedium(move.medium)
  const Icon = ICONS[medium?.icon ?? ''] ?? Music2
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={12} className="text-gray-400 flex-shrink-0" />
        <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
          {/* The medium is named here rather than in a legend. This is the
              second of a turn's two choices, and the place to learn that it is
              a choice at all is the moment it visibly changed. */}
          {medium && <span className="normal-case tracking-normal"> · a {medium.name}</span>}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {move.title}
        {move.attribution && (
          <span className="font-normal text-gray-500 dark:text-gray-400"> — {move.attribution}</span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{move.framing}</p>
      {/* Composed media carry their instructions. Shown because "offer it,
          never demand it" is unreadable as a rule and obvious as a list of
          three things you could actually do standing where you are. */}
      {move.steps && move.steps.length > 0 && (
        <ol className="mt-2 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
          {move.steps.map((s, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function ExampleChain({
  onStart,
  starting,
  onShowRules,
}: {
  onStart: (gameId: string) => void
  starting: string | null
  /** Opens the disclosure holding the media and relation registries. */
  onShowRules?: () => void
}) {
  const entry = getGame(ENTRY_GAME_ID)

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-8">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        An example game, written out
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-2xl leading-relaxed">
        Two turns of {entry?.name ?? 'Tag'}. Nobody played these — they are written here to be read,
        so the loop is something you have seen before you take a turn in it.
      </p>

      <ol className="space-y-4">
        {EXAMPLE_CHAIN.map((turn, i) => {
          const relation = RELATIONS[turn.relation]
          return (
            <li key={i} className="rounded-xl border border-gray-100 dark:border-gray-700/60 p-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Turn {i + 1}
              </p>

              {/* The four stages, in the order they happen. The old intro said
                  this as "your offering → a reading of it → a reply offering →
                  what carried across", which is the same sentence this layout
                  is, except that here each arrow has something under it. */}
              <MoveCard move={turn.move} label={i === 0 ? 'You offer' : 'On the table'} />

              <div className="flex items-start gap-2 my-2 pl-1">
                <ArrowDown size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  <span className="text-gray-400 dark:text-gray-500">read as </span>
                  {turn.reading}
                </p>
              </div>

              {/* The relation, where it was used. The seven of them were a card
                  at the top of the page listing all seven with nothing to
                  attach them to; one named at the point it did the work teaches
                  more than the list did. */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 my-2 pl-6">
                <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                  {relation.name}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{relation.does}</span>
              </div>

              <MoveCard move={turn.reply} label="The reply" />

              {/* Carried and lost, together and in that order. A reply that
                  only says what crossed is the half of the answer that flatters
                  itself; the section's own rule is that naming the loss is part
                  of playing. */}
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex gap-2">
                  <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-14">Carried</dt>
                  <dd className="text-gray-700 dark:text-gray-300 leading-relaxed">{turn.carried}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-gray-400 dark:text-gray-500 flex-shrink-0 w-14">Lost</dt>
                  <dd className="text-gray-600 dark:text-gray-400 leading-relaxed">{turn.lost}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ol>

      {/* The example's only purpose is to be left. The button starts a real
          game of the game it was an example of — not a sandbox, not a replay of
          these two turns, which would be a third thing to explain. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onStart(ENTRY_GAME_ID)}
          disabled={starting !== null}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-40 transition-colors"
        >
          {starting === ENTRY_GAME_ID
            ? <><Loader2 size={14} className="animate-spin" /> Starting…</>
            : <><Plus size={14} /> Take your first turn</>}
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Your offering, any medium — it reads yours the way it read this one.
        </span>
        {onShowRules && (
          <button
            onClick={onShowRules}
            className="ml-auto text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200"
          >
            the media and the seven relations
          </button>
        )}
      </div>
    </section>
  )
}
