'use client'

import { useMemo, useState } from 'react'
import { Check, Lock, MapPin } from 'lucide-react'
import type { ConceptOntology } from '@/lib/concepts/types'
import {
  JOURNEYS, journeyLayers, journeyRelations, resolveJourney, type ResolvedJourney,
} from '@/lib/concepts/journeys'

/**
 * The journeys, drawn as a map — a third thing the Concepts tab can show.
 *
 * ── Why a map and not the list it replaces ────────────────────────────────
 *
 * The list was six rows in an order ("least remaining first") that was a
 * sorting decision rather than a fact about the material. But journeys DO have
 * structure: finishing "Spot the factors" is literal progress through three of
 * the others, because its destination sits on their routes. A list cannot show
 * that. Drawn, it is one arrow.
 *
 * ── Disconnected on purpose ───────────────────────────────────────────────
 *
 * Unlike the concept map, this graph is not expected to be connected, and that
 * is information rather than an unfinished layout. "Turn multiplication into
 * addition" shares nothing with any other journey beyond the arithmetic every
 * route rests on, so it stands alone — and a learner should be able to see
 * that picking it up commits them to a thread of its own.
 *
 * This is also why the layering is honest about islands: anything with nothing
 * before it is in layer 0, which for an island is the truth and not a default.
 *
 * ── It decides nothing ────────────────────────────────────────────────────
 *
 * Same rule as `JourneyPanel` before it. Every edge, layer, step and count
 * comes from `lib/concepts/journeys.ts`, which is pure and tested. The one
 * thing this file owns is pixels.
 */

const LAYER_W = 248
const NODE_W = 208
const NODE_H = 58
const ROW_H = 86
const PAD = 16

export default function JourneyMap({
  ontology,
  concepts,
  masteryFloor,
  areaNames,
  queuedTasks,
  onPractise,
  onSelectConcept,
}: {
  ontology: ConceptOntology
  concepts: { conceptId: string; strength: number; introducible: boolean; claimed?: boolean }[]
  masteryFloor: number
  areaNames?: Record<string, string>
  queuedTasks?: { id: string; conceptId: string | null }[]
  onPractise?: (taskId: string) => void
  /** Show a concept on the concept map. Switches the tab's scope — see /learn. */
  onSelectConcept?: (conceptId: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const resolved = useMemo(
    () => JOURNEYS.map(j => resolveJourney(ontology, j, concepts, masteryFloor)),
    [ontology, concepts, masteryFloor],
  )
  const byId = useMemo(
    () => new Map(resolved.map(r => [r.journey.id, r])),
    [resolved],
  )
  const relations = useMemo(() => journeyRelations(ontology, JOURNEYS), [ontology])

  /**
   * Positions, layered left-to-right by containment depth.
   *
   * Rows are assigned per layer in `JOURNEYS` order, which is an authoring
   * decision and therefore stable — the map not moving between renders matters
   * for something people are trying to learn the shape of, the same argument
   * `ConceptGraph` makes against a force layout.
   */
  const { positions, width, height } = useMemo(() => {
    const layers = journeyLayers(JOURNEYS, relations.stage)
    const rowAt = new Map<number, number>()
    const pos = new Map<string, { x: number; y: number }>()
    let maxRows = 0
    for (const j of JOURNEYS) {
      const layer = layers.get(j.id) ?? 0
      const row = rowAt.get(layer) ?? 0
      rowAt.set(layer, row + 1)
      maxRows = Math.max(maxRows, row + 1)
      pos.set(j.id, { x: PAD + layer * LAYER_W, y: PAD + row * ROW_H })
    }
    const usedLayers = Math.max(1, ...[...rowAt.keys()].map(k => k + 1))
    return {
      positions: pos,
      width: PAD * 2 + (usedLayers - 1) * LAYER_W + NODE_W,
      height: PAD * 2 + maxRows * ROW_H,
    }
  }, [relations.stage])

  const sel = selected ? byId.get(selected) ?? null : null

  const taskFor = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of queuedTasks ?? []) {
      if (t.conceptId && !m.has(t.conceptId)) m.set(t.conceptId, t.id)
    }
    return m
  }, [queuedTasks])

  const edge = (from: string, to: string) => {
    const a = positions.get(from)
    const b = positions.get(to)
    if (!a || !b) return null
    return {
      x1: a.x + NODE_W, y1: a.y + NODE_H / 2,
      x2: b.x, y2: b.y + NODE_H / 2,
    }
  }

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <p className='px-3 pt-2 text-[11px] text-gray-500'>
        Six journeys. An arrow means finishing one is progress through the other — its
        destination is on that route. Dashed means shared ground with neither containing
        the other. Nothing joining a journey to the rest is not a gap: it is a thread of
        its own.
      </p>

      <div className='max-h-[70vh] overflow-auto px-1 py-1'>
        <svg width={width} height={height} className='min-w-full'>
          <defs>
            <marker id='jm-arrow' viewBox='0 0 10 10' refX='9' refY='5'
              markerWidth='5' markerHeight='5' orient='auto-start-reverse'>
              <path d='M 0 0 L 10 5 L 0 10 z' fill='#6b7280' />
            </marker>
          </defs>

          {/* Shared ground first, so a solid containment arrow is never
              crossed out by a dashed line drawn over it. */}
          {relations.shares.map(s => {
            const e = edge(s.a, s.b)
            if (!e) return null
            return (
              <line
                key={`sh-${s.a}-${s.b}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke='#0e7490' strokeWidth={1} strokeDasharray='2 3' opacity={0.75}
              />
            )
          })}
          {relations.stage.map(s => {
            const e = edge(s.from, s.to)
            if (!e) return null
            return (
              <line
                key={`st-${s.from}-${s.to}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke='#6b7280' strokeWidth={1.25} markerEnd='url(#jm-arrow)'
              />
            )
          })}

          {JOURNEYS.map(j => {
            const p = positions.get(j.id)!
            const r = byId.get(j.id)!
            const isSel = selected === j.id
            const finished = r.total > 0 && r.done === r.total
            const frac = r.total === 0 ? 0 : r.done / r.total
            return (
              <g
                key={j.id}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => setSelected(isSel ? null : j.id)}
                className='cursor-pointer'
              >
                <rect
                  width={NODE_W} height={NODE_H} rx={7}
                  fill={finished ? '#052e23' : '#111827'}
                  stroke={isSel ? '#e5e7eb' : finished ? '#047857' : '#374151'}
                  strokeWidth={isSel ? 2 : 1.25}
                />
                <text x={10} y={19} fontSize={11} fill='#e5e7eb'>
                  {j.title.length > 28 ? `${j.title.slice(0, 27)}…` : j.title}
                </text>
                {/* The progress bar, drawn from `done` — earned strength only,
                    never a claim. See the rule in journeys.ts. */}
                <rect x={10} y={28} width={NODE_W - 20} height={4} rx={2} fill='#1f2937' />
                <rect
                  x={10} y={28} width={Math.round((NODE_W - 20) * frac)} height={4} rx={2}
                  fill={finished ? '#10b981' : '#0ea5e9'}
                />
                <text x={10} y={48} fontSize={9} fill='#9ca3af'>
                  {r.done} of {r.total} step{r.total === 1 ? '' : 's'}
                  {r.unwrittenOnPath > 0 && ` · +${r.unwrittenOnPath} unwritten`}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className='flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-800 px-3 py-1.5 text-[10px] text-gray-500'>
        <span>── finishing this is progress through that</span>
        <span className='text-cyan-400/70'>– – shared ground</span>
        <span>
          common to most routes, so discounted:{' '}
          {relations.common.length === 0
            ? 'none'
            : relations.common.slice(0, 3).map(c => c.conceptId).join(', ')}
        </span>
      </div>

      {/* Same pinned inspector as the concept map, for the same reason: the
          verbs live down here and the map above can be taller than the screen. */}
      {sel && (
        <div className='sticky bottom-0 z-10 max-h-[45vh] overflow-auto border-t border-gray-800 bg-gray-900 px-3 py-2'>
          <h4 className='text-xs font-medium text-gray-100'>{sel.journey.title}</h4>
          <p className='mt-0.5 text-[11px] leading-snug text-gray-400'>{sel.journey.premise}</p>
          <p className='mt-1.5 text-[11px] leading-relaxed text-gray-300'>{sel.journey.arc}</p>

          <p className='mt-2 text-[10px] uppercase tracking-wide text-gray-600'>
            The route — {sel.areas.length} area{sel.areas.length === 1 ? '' : 's'}
            {sel.areas.length > 0 && (
              <span className='normal-case tracking-normal text-gray-500'>
                {' '}· {sel.areas.map(a => areaNames?.[a] ?? a).join(' → ')}
              </span>
            )}
            {sel.unwrittenOnPath > 0 && (
              <span className='normal-case tracking-normal text-gray-500'>
                {' '}· crosses {sel.unwrittenOnPath} concept
                {sel.unwrittenOnPath === 1 ? '' : 's'} with nothing written yet
              </span>
            )}
          </p>
          {sel.orderUnreliable && (
            <p className='mt-1 text-[10px] text-amber-300/80'>
              The graph has a prerequisite cycle, so this order is approximate.
            </p>
          )}

          <ol className='mt-1.5 space-y-1'>
            {sel.steps.map(s => {
              const taskId = taskFor.get(s.conceptId)
              const isNext = sel.next?.conceptId === s.conceptId
              return (
                <li
                  key={s.conceptId}
                  className={`flex items-start gap-2 rounded px-1.5 py-1 ${
                    isNext ? 'bg-sky-950/40 ring-1 ring-sky-800/60' : ''
                  }`}
                >
                  <span className='mt-0.5 flex-shrink-0'>
                    {s.done
                      ? <Check size={12} className='text-emerald-400' />
                      : s.introducible
                        ? <MapPin size={12} className={isNext ? 'text-sky-400' : 'text-gray-500'} />
                        : <Lock size={12} className='text-gray-600' />}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <button
                      onClick={() => onSelectConcept?.(s.conceptId)}
                      disabled={!onSelectConcept}
                      title={onSelectConcept ? 'Show this on the concept map' : undefined}
                      className={`text-left text-[11px] ${s.done ? 'text-gray-400' : 'text-gray-200'} ${
                        onSelectConcept ? 'hover:text-sky-200 hover:underline' : ''
                      }`}
                    >
                      {s.name}
                    </button>
                    {s.milestone && (
                      <>
                        <span className='ml-1.5 text-[10px] text-sky-300/80'>— {s.milestone.label}</span>
                        <span className='mt-0.5 block text-[10px] leading-snug text-gray-500'>
                          {s.milestone.promise}
                        </span>
                      </>
                    )}
                    {s.claimed && !s.done && (
                      <span className='mt-0.5 block text-[10px] text-amber-200/70'>
                        open because you claimed it — not yet demonstrated
                      </span>
                    )}
                    {s.unknown && (
                      <span className='mt-0.5 block text-[10px] text-gray-600'>
                        in another subject — switch the practice subject to work on it
                      </span>
                    )}
                  </span>
                  {taskId && onPractise && (
                    <button
                      onClick={() => onPractise(taskId)}
                      className='flex-shrink-0 rounded-full border border-emerald-700/60 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-900/40'
                    >
                      practise
                    </button>
                  )}
                </li>
              )
            })}
          </ol>

          <p className='mt-2 text-[11px]'>
            {sel.total > 0 && sel.done === sel.total
              ? <span className='text-emerald-200'>Every written step on this route is above the floor.</span>
              : sel.next
                ? <span className='text-sky-200'>Next: {sel.next.name}</span>
                : <span className='text-gray-400'>
                    Nothing on this route is open yet — the earlier steps have to come up in
                    practice first, or be claimed on the concept map.
                  </span>}
          </p>
        </div>
      )}
    </div>
  )
}
