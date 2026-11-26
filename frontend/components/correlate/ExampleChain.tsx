'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, Frame, Hand, Loader2, Music2, Plus } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { ENTRY_GAME_ID } from '@/lib/correlate/switching'
import { getGame } from '@/lib/correlate/games'
import { getMedium } from '@/lib/correlate/media'
import { RELATIONS } from '@/lib/correlate/relations'
import { EXAMPLE_CHAIN, type ExampleMove } from '@/lib/correlate/exampleTurn'
import type { Offering } from '@/lib/correlate/types'
import OfferingCard from './OfferingCard'
import { useOfferingPlayer } from './useOfferingPlayer'

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
 * what they are shown was really produced. So the heading says so in words.
 *
 * THAT RULE USED TO END "and nothing here is playable or has a control that
 * looks playable", which was the wrong place to draw the line and is why the
 * example of a game about making a connection PERCEPTIBLE was the one thing on
 * the page you could not perceive. The works are real; what is authored is the
 * READING of them. Hearing Clair de Lune and seeing the Monet does not fake
 * engine output, because the engine never produced either — it produced the
 * reading, the relation, and the carried/lost, and every one of those is still
 * presented as written-out text under a heading that says nobody played this.
 *
 * So the line falls between the OFFERINGS, which may be as real and as playable
 * as the board's, and the JUDGEMENT about them, which must stay labelled. A
 * change that lets a visitor believe the reading came back from a turn is still
 * wrong; a change that lets them hear the song is what this section is for.
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

/**
 * The authored move, as an `Offering`, once its real counterpart is found.
 *
 * `framing` is the authored one and overwrites whatever the catalogue thinks,
 * because framing names the part in play and the reading is about that part —
 * see the `resolve` note in exampleTurn.ts. Everything else is the real record:
 * a different performance of the piece is still the piece, and claiming
 * otherwise by overwriting the title would be the lie.
 */
function withAuthoredFraming(found: Offering, move: ExampleMove): Offering {
  return { ...found, framing: move.framing }
}

/**
 * Resolve every distinct `resolve` in the chain, once.
 *
 * Keyed by `q` rather than by position, which is not a micro-optimisation: the
 * Monet is BOTH turn 1's reply and turn 2's move, and two searches for it could
 * return two different accession numbers and show the example two different
 * paintings across the arrow that says it is the same one.
 *
 * Failure is not reported anywhere on purpose. There is nothing a visitor can
 * do about a provider being down, and an error banner on a tutorial teaches
 * them the product is broken when the lesson still reads perfectly — so a miss
 * leaves `MoveCard`, which is exactly what this section shipped before.
 */
function useResolvedWorks(): Record<string, Offering> {
  const [found, setFound] = useState<Record<string, Offering>>({})

  useEffect(() => {
    let cancelled = false
    const wanted = new Map<string, { medium: string; expect: string; expectBy: string }>()
    for (const turn of EXAMPLE_CHAIN) {
      for (const move of [turn.move, turn.reply]) {
        if (move.resolve) {
          wanted.set(move.resolve.q, { medium: move.medium, ...move.resolve })
        }
      }
    }

    Promise.all([...wanted].map(async ([q, { medium, expect, expectBy }]) => {
      try {
        /**
         * Twelve, not five, and the number is load-bearing.
         *
         * Both fields have to match, and a classical search is full of rows
         * that satisfy one — compilations carrying the piece's name under
         * whichever composer the album was filed under. At five, the first
         * correctly-attributed Clair de Lune was out of range and the example
         * fell back to the written card for a track that is definitely in the
         * catalogue. A window this small costs nothing and is read once per
         * page load.
         */
        const res = await authedFetch(
          `/api/offerings/search?medium=${medium}&q=${encodeURIComponent(q)}&limit=12`)
        if (!res.ok) return null
        const data = await res.json()
        /**
         * Title AND attribution. Checking the title alone shipped Clair de
         * Lune under FRÉDÉRIC CHOPIN, because that is what Deezer's top row
         * claims — see the `resolve` note in exampleTurn.ts. A result that
         * matches one field and not the other is not a near miss, it is a
         * confidently wrong credit, and the written card is better than that.
         */
        const hit = (data.offerings as Offering[] | undefined)?.find(o =>
          o.title.toLowerCase().includes(expect)
          && (o.attribution ?? '').toLowerCase().includes(expectBy))
        return hit ? ([q, hit] as const) : null
      } catch {
        // Swallowed deliberately — see the note above.
        return null
      }
    })).then(pairs => {
      if (cancelled) return
      const next: Record<string, Offering> = {}
      for (const p of pairs) if (p) next[p[0]] = p[1]
      setFound(next)
    })

    return () => { cancelled = true }
  }, [])

  return found
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
  const resolved = useResolvedWorks()
  /**
   * Preview-only, by passing no options at all.
   *
   * A 30-second preview is more than the twenty seconds the first move's
   * framing asks for, so the full-length path buys the tutorial nothing and
   * costs a shared daily quota on every first visit.
   *
   * OMITTING THE OPTIONS IS NOT ENOUGH TO GET THAT, which is worth knowing
   * before trusting it: `resolveFull`/`full` are the QUEUE's route to a full
   * version, and `OfferingCard` has its own button that calls
   * /api/music/youtube whether a resolver was passed or not. Hence
   * `allowFullLength={false}` below — the two together are what makes this
   * preview-only, and either alone looks like it.
   */
  const player = useOfferingPlayer()

  /** The real card when the work was found, the written one when it was not. */
  const renderMove = (move: ExampleMove, label: string) => {
    const hit = move.resolve ? resolved[move.resolve.q] : undefined
    return hit
      ? (
        <OfferingCard
          offering={withAuthoredFraming(hit, move)}
          player={player}
          label={label}
          compact
          allowFullLength={false}
        />
      )
      : <MoveCard move={move} label={label} />
  }

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 mb-8">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        An example game, written out
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4 max-w-2xl leading-relaxed">
        {/* "Nobody played these" is the claim that has to survive the works
            being real, and it still does: the offerings are genuinely Debussy
            and Monet, and the reading of them is written. Naming both halves is
            more honest than the old sentence, which let a visitor assume the
            works were invented too. */}
        Two turns of {entry?.name ?? 'Tag'}. The song and the painting are real and you can play
        them; the readings between them are written here rather than produced by a turn, so the
        loop is something you have seen before you take one.
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
              {renderMove(turn.move, i === 0 ? 'You offer' : 'On the table')}

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

              {renderMove(turn.reply, 'The reply')}

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
