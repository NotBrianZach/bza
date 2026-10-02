'use client'

import { useMemo } from 'react'
import { CornerDownRight, GitBranch, Link2, SignalZero } from 'lucide-react'
import { getMedium } from '@/lib/correlate/media'
import { childrenOf, pathTo, type TurnGraph } from '@/lib/correlate/graph'
import type { CorrelationTurn } from '@/lib/correlate/types'

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
 */
export default function BranchMap({
  graph,
  focusId,
  onFocus,
  accentChip,
  accentText,
}: {
  graph: TurnGraph
  /** The turn the next move will answer. Null is a thread with nothing behind it. */
  focusId: string | null
  onFocus: (id: string | null) => void
  accentChip: string
  accentText: string
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
          return (
            <li key={turn.id}>
              <button
                onClick={() => turn.legal && onFocus(turn.id)}
                disabled={!turn.legal}
                title={turn.legal
                  ? `Answer turn ${turn.turn_index + 1}: ${label(turn)}`
                  : 'This move was turned away — there is nothing there to answer'}
                style={{ paddingLeft: `${0.25 + depth * 0.75}rem` }}
                className={`w-full flex items-center gap-1.5 pr-2 py-1 rounded-lg text-left transition-colors ${
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
            </li>
          )
        })}
      </ul>

      <div className="px-4 pb-3">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Pick any turn to answer it instead. Answering one twice makes two branches; both are kept.
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

function label(turn: CorrelationTurn): string {
  const move = turn.move_offering?.title ?? 'an offering'
  const reply = turn.reply_offering?.title
  return reply ? `${move} → ${reply}` : move
}
