'use client'

import { useMemo } from 'react'
import { Antenna, CornerDownRight, GitBranch, Link2, Pause, Play, SignalZero } from 'lucide-react'
import { getMedium } from '@/lib/correlate/media'
import { childrenOf, pathTo, type TurnGraph } from '@/lib/correlate/graph'
import type { CorrelationTurn, Offering } from '@/lib/correlate/types'
import { audioUrl } from './useOfferingPlayer'

/**
 * The shape of the game, as a thing you can click.
 *
 * A branched game needs an answer to "where am I, and what else is there" that the
 * turn log cannot give — the log shows one path, and the point of the graph is that
 * there are others. So: every turn, indented by depth, the current path highlighted,
 * and any turn selectable as the one your next move answers.
 *
 * Deliberately a tree of text rather than a drawn graph. The thing a player needs is
 * to recognise a turn and get back to it; a canvas would make that a navigation
 * problem instead of a reading one, and the callbacks the interpreter volunteers are
 * the only non-tree edges — one marker each is enough to say so.
 *
 * ── Playing from here is a SECOND control, not the row click ──────────────
 *
 * A row click focuses the turn: it says "my next move answers this one", which is
 * the whole reason a branched game needs this panel. Skipping the music to a turn
 * is a different intention that happens to want the same target, and overloading
 * one click with both would make every attempt to hear a track again silently
 * move where the game continues from.
 *
 * So audible rows get their own small play button. It is the only thing in here
 * that touches the player, and rows with nothing to hear do not grow one — under
 * "keep going" most rows have audio, but a chain through paintings and passages
 * would otherwise sprout a column of dead buttons.
 */
export default function BranchMap({
  graph,
  focusId,
  onFocus,
  accentChip,
  accentText,
  onPlay,
  playingOfferingId,
  playingPaused,
}: {
  graph: TurnGraph
  /** The turn the next move will answer. Null is a thread with nothing behind it. */
  focusId: string | null
  onFocus: (id: string | null) => void
  accentChip: string
  accentText: string
  /**
   * Skip the player to a turn's offering. Omitted means no play controls at all,
   * which is the right rendering for a read-only view of somebody else's chain.
   */
  onPlay?: (offering: Offering) => void
  /** The offering playing now, so its row shows a pause rather than a play. */
  playingOfferingId?: string | null
  playingPaused?: boolean
}) {
  const onPath = useMemo(
    () => new Set(pathTo(graph, focusId).map(t => t.id)),
    [graph, focusId],
  );

  const rows = useMemo(() => flatten(graph), [graph])

  if (rows.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <GitBranch size={14} className={accentText} />
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">The shape of it</p>
        <span className="ml-auto text-[11px] text-gray-400">
          {rows.length} turn{rows.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="px-2 py-2 max-h-72 overflow-y-auto">
        {rows.map(({ turn, depth }) => {
          const focused = turn.id === focusId
          const onCurrentPath = onPath.has(turn.id)
          const medium = turn.reply_offering?.medium ?? turn.move_offering?.medium
          /**
           * The reply first, because the reply is what the turn produced.
           *
           * A turn is "this move → that answer", and on a radio run the answer is
           * the track that played. Offering the move instead would make the button
           * play the thing the row is a response TO, which is the previous row.
           */
          const hearable = audible(turn)
          const isPlayingRow = !!hearable && hearable.id === playingOfferingId
          return (
            <li key={turn.id} className="flex items-center">
              <button
                onClick={() => turn.legal && onFocus(turn.id)}
                disabled={!turn.legal}
                title={turn.legal
                  ? `Answer turn ${turn.turn_index + 1}: ${label(turn)}`
                  : 'This move was turned away — there is nothing there to answer'}
                style={{ paddingLeft: `${0.25 + depth * 0.75}rem` }}
                className={`min-w-0 flex-1 flex items-center gap-1.5 pr-2 py-1 rounded-lg text-left transition-colors ${
                  focused
                    ? accentChip
                    : onCurrentPath
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      : 'opacity-60 hover:opacity-100 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                } ${turn.legal ? '' : 'cursor-default'}`}
              >
                {depth > 0 && (
                  <CornerDownRight size={10} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
                )}
                <span className={`text-[10px] font-medium flex-shrink-0 ${focused ? '' : 'text-gray-400 dark:text-gray-500'}`}>
                  {turn.turn_index + 1}
                </span>
                {!turn.legal && <SignalZero size={10} className="flex-shrink-0 text-red-400" />}
                {isStation(turn) && (
                  <Antenna
                    size={10}
                    className="flex-shrink-0 text-gray-300 dark:text-gray-600"
                    // Titled, because an unexplained icon in a tree of fifty
                    // rows is noise. The sentence is the narrow one: paired by
                    // listeners, not read by anything.
                    aria-label="played by the station"
                  />
                )}
                <span className="text-[11px] truncate text-gray-600 dark:text-gray-300">{label(turn)}</span>
                {turn.link_turn_id && (
                  <Link2 size={10} className="flex-shrink-0 ml-auto text-gray-400 dark:text-gray-500" />
                )}
                {medium && (
                  <span className="text-[9px] uppercase tracking-wide text-gray-300 dark:text-gray-600 flex-shrink-0 ml-auto">
                    {getMedium(medium)?.plural ?? medium}
                  </span>
                )}
              </button>

              {/* Outside the focus button, not inside it — a button cannot
                  nest in a button, and the whole point is that these are two
                  different intentions. */}
              {onPlay && hearable && (
                <button
                  onClick={() => onPlay(hearable)}
                  title={isPlayingRow
                    ? (playingPaused ? `Resume ${hearable.title}` : `Pause ${hearable.title}`)
                    : `Skip to ${hearable.title}`}
                  className={`flex-shrink-0 mr-1 p-1 rounded-full transition-colors ${
                    isPlayingRow
                      ? accentText
                      : 'text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {isPlayingRow && !playingPaused ? <Pause size={11} /> : <Play size={11} />}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Pick any turn to answer it instead. Answering one twice makes two branches; both are kept.
          {onPlay && ' The play button skips the music to that turn without moving where the game continues from.'}
        </p>
        <button
          onClick={() => onFocus(null)}
          className={`mt-1.5 text-[11px] transition-colors ${
            focusId === null
              ? accentText
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          {focusId === null ? 'starting a new thread' : 'or start a new thread, answering nothing'}
        </button>
      </div>
    </div>
  )
}

interface Row {
  turn: CorrelationTurn
  depth: number
}

/**
 * Depth-first, so a branch and everything under it stay together.
 *
 * Iterative rather than recursive, and bounded by the node count, because this
 * renders whatever is in the database — including, if a bad write ever happened, a
 * cycle.
 */
function flatten(graph: TurnGraph): Row[] {
  const rows: Row[] = []
  const seen = new Set<string>()
  const stack: { id: string; depth: number }[] =
    [...graph.rootIds].reverse().map(id => ({ id, depth: 0 }))

  while (stack.length > 0 && rows.length <= graph.order.length) {
    const { id, depth } = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    const node = graph.nodes.get(id)
    if (!node) continue
    rows.push({ turn: node.turn, depth })
    const kids = childrenOf(graph, id)
    for (let i = kids.length - 1; i >= 0; i--) {
      stack.push({ id: kids[i].id, depth: depth + 1 })
    }
  }

  return rows
}

/**
 * The offering on this turn that can be heard, if either can.
 *
 * Reply before move: the reply is what the turn produced, and on a run it is the
 * track that played. `audioUrl` is the same test the queue uses to decide what
 * goes into it, so a row offers a play button exactly when the player would
 * accept the thing behind it.
 */
function audible(turn: CorrelationTurn): Offering | null {
  const reply = turn.reply_offering
  if (reply && audioUrl(reply)) return reply
  const move = turn.move_offering
  if (move && audioUrl(move)) return move
  return null
}

function label(turn: CorrelationTurn): string {
  const move = turn.move_offering?.title ?? 'an offering'
  const reply = turn.reply_offering?.title
  return reply ? `${move} → ${reply}` : move
}

/**
 * The marker that says a row was the station's rather than an exchange.
 *
 * Needed the moment station picks became turns: a tree where a song the
 * catalogue chose looks identical to a connection somebody made is a tree that
 * has stopped telling you what the game was. One small icon, like the `Link2`
 * marker for a volunteered callback, on the same reasoning — the shape of the
 * game is what this panel is for, and these rows have a different shape.
 */
function isStation(turn: CorrelationTurn): boolean {
  return turn.move_by === 'station'
}
