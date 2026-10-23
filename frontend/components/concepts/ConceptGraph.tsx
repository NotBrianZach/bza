'use client'

import { useMemo, useState } from 'react'
import type { ConceptOntology } from '@/lib/concepts/types'
import {
  conceptById, dependentsOf, edgesOfKind, interferesWith, prerequisitesOf,
} from '@/lib/concepts/registry'

/**
 * The concept graph, drawn as a graph.
 *
 * ConceptBrowser already lists the concepts with their prerequisites named in
 * prose, which is the right surface for reading one concept carefully. It is
 * the wrong surface for the question people actually arrive with — "what is
 * the shape of this subject, and where am I in it" — because a reader has to
 * reconstruct the topology in their head from twenty-four separate sentences.
 *
 * ── Layered by longest prerequisite path ──────────────────────────────────
 *
 * Column = the longest chain of prerequisites behind a concept, so a
 * prerequisite is ALWAYS strictly left of the thing that needs it. Shortest
 * path would be wrong: a concept resting on both a root and a deep chain would
 * sit next to the root, drawing an edge that leaps backwards over several
 * columns, and the one promise this layout makes — left is earlier — would be
 * broken by exactly the concepts where it matters most.
 *
 * No layout library. A DAG this size (tens of nodes, known depth) needs
 * longest-path layering and a row assignment, which is the twenty lines below;
 * a force simulation would be less readable and non-deterministic, and the
 * graph moving between renders is actively bad for something people are trying
 * to learn the shape of.
 *
 * ── Cycles are reported, not hidden ───────────────────────────────────────
 *
 * The depth walk carries a visited set, so a cyclic graph produces a finite
 * layout rather than hanging — and `cyclic` is returned so the caller can say
 * the drawing is unreliable. `ontologyProblems` and `cycles` already catch this
 * properly; this just must not spin.
 *
 * ── Three edge kinds, drawn differently on purpose ────────────────────────
 *
 * They mean completely different things and a single arrow style would merge
 * them: a prerequisite GATES, an encompasses edge PROPAGATES CREDIT, and an
 * interference is a warning that two things get confused for each other. The
 * last is also the only undirected one.
 */

interface ConceptState {
  conceptId: string
  strength: number
  introducible: boolean
  claimed?: boolean
}

const LAYER_W = 196
const NODE_W = 160
const NODE_H = 44
const ROW_H = 68
const PAD = 16

export default function ConceptGraph({
  ontology,
  concepts,
  masteryFloor,
  onClaim,
}: {
  ontology: ConceptOntology
  /** Per-concept state from the session's `progress.concepts`. */
  concepts: ConceptState[]
  masteryFloor: number
  /** Offered on a blocked node. Omit to render read-only. */
  onClaim?: (conceptId: string, conceptName: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const { positions, width, height, cyclic } = useMemo(() => {
    /**
     * Longest prerequisite path to each concept, with a guard.
     *
     * Memoised across the whole pass, so the walk is linear rather than
     * exponential on a graph where several concepts share deep ancestors.
     */
    const depth = new Map<string, number>()
    let sawCycle = false

    const depthOf = (id: string, onPath: Set<string>): number => {
      const cached = depth.get(id)
      if (cached !== undefined) return cached
      if (onPath.has(id)) { sawCycle = true; return 0 }
      onPath.add(id)
      const prereqs = prerequisitesOf(ontology, id)
      const d = prereqs.length === 0
        ? 0
        : 1 + Math.max(...prereqs.map(p => depthOf(p, onPath)))
      onPath.delete(id)
      depth.set(id, d)
      return d
    }
    for (const c of ontology.concepts) depthOf(c.id, new Set())

    // Group by layer, preserving the ontology's own order within a layer —
    // which is the author's teaching order, and more meaningful than anything
    // this could compute.
    const byLayer = new Map<number, string[]>()
    for (const c of ontology.concepts) {
      const d = depth.get(c.id) ?? 0
      const list = byLayer.get(d) ?? []
      list.push(c.id)
      byLayer.set(d, list)
    }

    const pos = new Map<string, { x: number; y: number }>()
    let maxRows = 0
    for (const [layer, ids] of byLayer) {
      maxRows = Math.max(maxRows, ids.length)
      ids.forEach((id, row) => {
        pos.set(id, { x: PAD + layer * LAYER_W, y: PAD + row * ROW_H })
      })
    }

    return {
      positions: pos,
      width: PAD * 2 + (byLayer.size === 0 ? 0 : (Math.max(...byLayer.keys()) * LAYER_W + NODE_W)),
      height: PAD * 2 + Math.max(1, maxRows) * ROW_H,
      cyclic: sawCycle,
    }
  }, [ontology])

  const stateOf = useMemo(() => {
    const m = new Map<string, ConceptState>()
    for (const c of concepts) m.set(c.conceptId, c)
    return m
  }, [concepts])

  /**
   * Four states, and the order of these checks matters.
   *
   * `strong` is tested before `claimed` because a concept that has been earned
   * should read as earned even if a stale claim row still exists; and `claimed`
   * before `open` because "open because you said so" is the more important fact
   * of the two to show.
   */
  function appearance(id: string) {
    const s = stateOf.get(id)
    if (!s) return { fill: '#1f2937', stroke: '#374151', text: '#9ca3af', label: 'unknown' }
    if (s.strength >= masteryFloor) {
      return { fill: '#064e3b', stroke: '#10b981', text: '#d1fae5', label: 'strong' }
    }
    if (s.claimed) {
      return { fill: '#422006', stroke: '#f59e0b', text: '#fde68a', label: 'claimed — not yet shown' }
    }
    if (s.introducible) {
      return { fill: '#1e3a5f', stroke: '#3b82f6', text: '#dbeafe', label: 'open to practise' }
    }
    return { fill: '#1f2937', stroke: '#4b5563', text: '#9ca3af', label: 'blocked' }
  }

  const prereqEdges = useMemo(() => edgesOfKind(ontology, 'prerequisite'), [ontology])
  const encompassEdges = useMemo(() => edgesOfKind(ontology, 'encompasses'), [ontology])
  const interfereEdges = useMemo(() => edgesOfKind(ontology, 'interferes_with'), [ontology])

  const centre = (id: string) => {
    const p = positions.get(id)
    return p ? { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 } : null
  }
  const rightEdge = (id: string) => {
    const p = positions.get(id)
    return p ? { x: p.x + NODE_W, y: p.y + NODE_H / 2 } : null
  }
  const leftEdge = (id: string) => {
    const p = positions.get(id)
    return p ? { x: p.x, y: p.y + NODE_H / 2 } : null
  }

  const sel = selected ? conceptById(ontology, selected) : null

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-800 px-3 py-2'>
        <h3 className='text-xs font-medium text-gray-300'>The graph</h3>
        <span className='text-[11px] text-gray-500'>left to right — a prerequisite is always left of what needs it</span>
        <span className='ml-auto flex flex-wrap items-center gap-2 text-[10px]'>
          {[
            ['strong', '#10b981'],
            ['open', '#3b82f6'],
            ['claimed', '#f59e0b'],
            ['blocked', '#4b5563'],
          ].map(([label, colour]) => (
            <span key={label} className='inline-flex items-center gap-1 text-gray-400'>
              <span className='inline-block h-2 w-2 rounded-full' style={{ background: colour as string }} />
              {label}
            </span>
          ))}
        </span>
      </div>

      {cyclic && (
        <p className='border-b border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-[11px] text-rose-200'>
          The prerequisite graph has a cycle, so this drawing is not a reliable
          ordering — the layering had to break the loop somewhere arbitrary. The
          Concepts list reports the cycle itself.
        </p>
      )}

      <div className='overflow-x-auto px-1 py-1'>
        <svg width={width} height={height} className='min-w-full'>
          <defs>
            <marker id='cg-arrow' viewBox='0 0 10 10' refX='9' refY='5'
              markerWidth='5' markerHeight='5' orient='auto-start-reverse'>
              <path d='M 0 0 L 10 5 L 0 10 z' fill='#6b7280' />
            </marker>
          </defs>

          {/* Edges under nodes, so a line never crosses a label. */}
          {prereqEdges.map((e, i) => {
            const from = rightEdge(e.from), to = leftEdge(e.to)
            if (!from || !to) return null
            // A cubic with horizontal control points: the curve leaves and
            // arrives horizontally, which reads as "flows rightward" even when
            // the two nodes are on very different rows.
            const dx = Math.max(24, (to.x - from.x) / 2)
            return (
              <path
                key={`p${i}`}
                d={`M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`}
                fill='none' stroke='#6b7280' strokeWidth={1.25} markerEnd='url(#cg-arrow)'
              />
            )
          })}

          {encompassEdges.map((e, i) => {
            const from = centre(e.from), to = centre(e.to)
            if (!from || !to) return null
            return (
              <line
                key={`e${i}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke='#34d399' strokeWidth={1} strokeDasharray='5 3' opacity={0.5}
              />
            )
          })}

          {interfereEdges.map((e, i) => {
            const from = centre(e.from), to = centre(e.to)
            if (!from || !to) return null
            return (
              <line
                key={`i${i}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke='#f87171' strokeWidth={1} strokeDasharray='1 4' opacity={0.6}
              />
            )
          })}

          {ontology.concepts.map(c => {
            const p = positions.get(c.id)
            if (!p) return null
            const a = appearance(c.id)
            const isSel = selected === c.id
            return (
              <g
                key={c.id}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => setSelected(isSel ? null : c.id)}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${c.name} — ${a.label}`}</title>
                <rect
                  width={NODE_W} height={NODE_H} rx={6}
                  fill={a.fill} stroke={isSel ? '#e5e7eb' : a.stroke} strokeWidth={isSel ? 2 : 1.25}
                />
                {/* Two lines, clipped by hand: SVG has no text wrapping, and a
                    long concept name would otherwise run across its neighbours. */}
                <text x={8} y={18} fontSize={11} fill={a.text}>
                  {c.name.length > 24 ? `${c.name.slice(0, 23)}…` : c.name}
                </text>
                <text x={8} y={33} fontSize={9} fill={a.text} opacity={0.75}>
                  {a.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className='flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-800 px-3 py-1.5 text-[10px] text-gray-500'>
        <span>── prerequisite (gates)</span>
        <span className='text-emerald-300/70'>– – encompasses (propagates credit)</span>
        <span className='text-rose-300/70'>· · · interferes with (confusable)</span>
      </div>

      {sel && (
        <div className='border-t border-gray-800 px-3 py-2 text-xs'>
          <div className='flex flex-wrap items-center gap-2'>
            <h4 className='font-medium text-gray-200'>{sel.name}</h4>
            <span className='text-[11px] text-gray-500'>{appearance(sel.id).label}</span>
            {onClaim && !stateOf.get(sel.id)?.introducible && (
              <button
                onClick={() => onClaim(sel.id, sel.name)}
                title='Say you already know this. It opens the problems now — it does not mark you as knowing it, and one unaided wrong answer withdraws the claim.'
                className='ml-auto rounded-full border border-gray-600 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800'
              >
                I already know this
              </button>
            )}
          </div>
          {/* The concept's own scope hint, not a `covers` field — that is on the
              SUBJECT. A concept describes itself through its facet option. */}
          {sel.scope?.hint && (
            <p className='mt-1 text-[11px] leading-snug text-gray-400'>{sel.scope.hint}</p>
          )}
          <p className='mt-0.5 text-[10px] text-gray-500'>
            {sel.knowledgePoints.length} knowledge point
            {sel.knowledgePoints.length === 1 ? '' : 's'}
          </p>
          <dl className='mt-1.5 space-y-0.5 text-[11px] text-gray-400'>
            <div>
              <dt className='inline text-gray-500'>rests on: </dt>
              <dd className='inline'>
                {prerequisitesOf(ontology, sel.id).map(p => conceptById(ontology, p)?.name ?? p).join(', ') || 'nothing'}
              </dd>
            </div>
            <div>
              <dt className='inline text-gray-500'>opens: </dt>
              <dd className='inline'>
                {dependentsOf(ontology, sel.id).map(d => conceptById(ontology, d)?.name ?? d).join(', ') || 'nothing yet'}
              </dd>
            </div>
            {interferesWith(ontology, sel.id).length > 0 && (
              <div>
                <dt className='inline text-gray-500'>confusable with: </dt>
                <dd className='inline text-rose-200/80'>
                  {interferesWith(ontology, sel.id).map(x => conceptById(ontology, x)?.name ?? x).join(', ')}
                </dd>
              </div>
            )}
            <div>
              <dt className='inline text-gray-500'>strength: </dt>
              <dd className='inline'>
                {Math.round((stateOf.get(sel.id)?.strength ?? 0) * 100)}% — the floor is {Math.round(masteryFloor * 100)}%
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}
