'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConceptOntology } from '@/lib/concepts/types'
import {
  claimableChainFor, conceptById, dependentsOf, edgesOfKind, gatingPrerequisitesOf, interferesWith,
  isTeachable, prerequisitesOf,
} from '@/lib/concepts/registry'
import { MATHEMATICS } from '@/lib/concepts/atlas'
import { isPractisable } from '@/lib/concepts/tasks'

/**
 * The concept graph, drawn as a graph.
 *
 * ConceptBrowser already lists the concepts with their prerequisites named in
 * prose, which is the right surface for reading one concept carefully. It is
 * the wrong surface for the question people actually arrive with — "what is
 * the shape of this subject, and where am I in it" — because a reader has to
 * reconstruct the topology in their head from one sentence per concept. That
 * was already true of fifteen; it is hopeless for the atlas, which is 291.
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

/** The filter's "no filter" value. A sentinel rather than '' so it can be read. */
const ALL_AREAS = '__all__'

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
  onClaimChain,
  areaNames,
  initialArea,
  queuedTasks,
  onPractise,
  selectedId,
  onSelectedChange,
}: {
  ontology: ConceptOntology
  /** Per-concept state from the session's `progress.concepts`. */
  concepts: ConceptState[]
  masteryFloor: number
  /** Offered on a blocked node. Omit to render read-only. */
  onClaim?: (conceptId: string, conceptName: string) => void
  /**
   * Claim the concept and everything teachable it rests on.
   *
   * Separate from `onClaim` rather than a flag on it, because the two have
   * different preconditions: a plain claim is only useful on a node this
   * session could serve, while a chain claim is useful on any teachable node
   * and deliberately writes rows into OTHER subjects. Folding them into one
   * callback would mean one visibility rule for two different offers.
   */
  onClaimChain?: (conceptId: string, conceptName: string, chain: string[]) => void
  /**
   * Display names for the `subjectId`s present in the ontology. Supplying this
   * turns on the area filter, which a single-subject graph does not want and a
   * 291-node atlas cannot do without.
   */
  areaNames?: Record<string, string>
  /** Which area to open on. Ignored without `areaNames`. */
  initialArea?: string
  /**
   * The tasks already in the practice queue, so a node can show its own.
   *
   * Only the queue, and deliberately not "generate me a problem for this
   * concept". The scheduler decides what is served and when; a button here
   * that conjured a task for any node the learner clicked would route around
   * mastery-gated introduction, which is the thing the whole engine is for.
   * Claiming is the sanctioned way to open something early, and it is already
   * offered above.
   *
   * So this answers a narrower and honest question — "is there anything
   * waiting for me on this node right now" — and the answer is often no.
   */
  queuedTasks?: { id: string; conceptId: string | null; prompt: string; kind: string }[]
  /**
   * Drive the selection from outside, so the journey list and the map agree.
   *
   * Optional, and the component keeps its own state when it is absent — the
   * standard controlled/uncontrolled split. Supplying it makes the parent the
   * single source of "which concept is being looked at", which is what lets
   * clicking a journey step land on the node without two components holding
   * separate answers.
   */
  selectedId?: string | null
  onSelectedChange?: (conceptId: string | null) => void
  /**
   * Take me to that task. Omit and the problems are listed without a jump.
   *
   * The parent owns the tab and the queue index, so neither can be moved from
   * in here without two components disagreeing about which task is current.
   */
  onPractise?: (taskId: string) => void
}) {
  const [ownSelected, setOwnSelected] = useState<string | null>(null)
  /** Controlled when `selectedId` is supplied, self-managed otherwise. */
  const controlled = selectedId !== undefined
  const selected = controlled ? selectedId : ownSelected
  const setSelected = (id: string | null) => {
    if (!controlled) setOwnSelected(id)
    onSelectedChange?.(id)
  }
  const [area, setArea] = useState<string>(initialArea ?? ALL_AREAS)

  /**
   * Which nodes are drawn.
   *
   * One area at a time plus ONE HOP of context in both directions, and the
   * context is the part worth arguing for. An area drawn strictly alone loses
   * every edge that leaves it — which in this atlas is 192 of 498 prerequisite
   * edges, including the ones that are the whole reason for a map rather than a
   * shelf of syllabi. Showing the immediate neighbours keeps "this area rests
   * on that one" visible while still cutting the drawing down to something a
   * reader can hold.
   *
   * Two hops was tried mentally and rejected: on this graph it pulls in most of
   * the map, which is the thing the filter exists to avoid.
   */
  const visible = useMemo(() => {
    if (area === ALL_AREAS || !areaNames) return null
    const own = ontology.concepts.filter(c => c.subjectId === area).map(c => c.id)
    const out = new Set(own)
    for (const id of own) {
      for (const n of prerequisitesOf(ontology, id)) out.add(n)
      for (const n of dependentsOf(ontology, id)) out.add(n)
    }
    return out
  }, [ontology, area, areaNames])

  const isContext = (id: string) =>
    visible !== null && ontology.concepts.find(c => c.id === id)?.subjectId !== area

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

    // Depth is computed over the WHOLE graph even when a filter is on, so a
    // concept does not slide left when its prerequisites are hidden. Left is
    // earlier has to mean the same thing in every view or the layout is
    // actively misleading.
    const shown = ontology.concepts.filter(c => visible === null || visible.has(c.id))

    // Group by layer, preserving the ontology's own order within a layer —
    // which is the author's teaching order, and more meaningful than anything
    // this could compute.
    const byLayer = new Map<number, string[]>()
    for (const c of shown) {
      const d = depth.get(c.id) ?? 0
      const list = byLayer.get(d) ?? []
      list.push(c.id)
      byLayer.set(d, list)
    }

    /**
     * Columns are compacted to the layers actually in use.
     *
     * A filtered view typically occupies six or seven of the thirty-two layers,
     * scattered. Drawing them at their true layer index leaves twenty empty
     * columns of whitespace between the nodes, and the reader has to scroll
     * past nothing to find the next thing. Order is preserved, so the left-is-
     * earlier promise survives the compaction; only the gaps go.
     */
    const usedLayers = [...byLayer.keys()].sort((a, b) => a - b)
    const column = new Map(usedLayers.map((layer, i) => [layer, i]))

    const pos = new Map<string, { x: number; y: number }>()
    let maxRows = 0
    for (const [layer, ids] of byLayer) {
      maxRows = Math.max(maxRows, ids.length)
      ids.forEach((id, row) => {
        pos.set(id, { x: PAD + (column.get(layer) ?? 0) * LAYER_W, y: PAD + row * ROW_H })
      })
    }

    return {
      positions: pos,
      width: PAD * 2 + (usedLayers.length === 0 ? 0 : ((usedLayers.length - 1) * LAYER_W + NODE_W)),
      height: PAD * 2 + Math.max(1, maxRows) * ROW_H,
      cyclic: sawCycle,
    }
  }, [ontology, visible])

  const stateOf = useMemo(() => {
    const m = new Map<string, ConceptState>()
    for (const c of concepts) m.set(c.conceptId, c)
    return m
  }, [concepts])

  /**
   * Five states, and the order of these checks matters.
   *
   * `mapped` is tested FIRST because it is the one state that is about the
   * material rather than about the learner. A concept nobody has written
   * problems for is not blocked — there is nothing to be blocked from — and
   * drawing it in the blocked grey would say the learner is missing a
   * prerequisite when what is actually missing is the content. It is also why
   * it must not carry a claim button: claiming opens problems, and there are
   * none to open.
   *
   * After that, `strong` is tested before `claimed` because a concept that has
   * been earned should read as earned even if a stale claim row still exists;
   * and `claimed` before `open` because "open because you said so" is the more
   * important fact of the two to show.
   */
  function appearance(id: string) {
    const s = stateOf.get(id)
    // `short` is what fits inside the node at 9px in 160px; `label` is what
    // the detail panel and the tooltip say. Kept as two fields rather than one
    // truncated string because an ellipsed "on the map — no problems writ…" is
    // worse than either.
    if (!isTeachable(ontology, id)) {
      return {
        fill: '#111827', stroke: '#3f3f46', text: '#71717a',
        short: 'mapped only',
        label: 'on the map — no problems written for it yet',
      }
    }
    if (!s) return { fill: '#1f2937', stroke: '#374151', text: '#9ca3af', short: 'unknown', label: 'unknown' }
    if (s.strength >= masteryFloor) {
      return { fill: '#064e3b', stroke: '#10b981', text: '#d1fae5', short: 'strong', label: 'strong' }
    }
    if (s.claimed) {
      return {
        fill: '#422006', stroke: '#f59e0b', text: '#fde68a',
        short: 'claimed', label: 'claimed — not yet shown',
      }
    }
    if (s.introducible) {
      return {
        fill: '#1e3a5f', stroke: '#3b82f6', text: '#dbeafe',
        short: 'open', label: 'open to practise',
      }
    }
    return { fill: '#1f2937', stroke: '#4b5563', text: '#9ca3af', short: 'blocked', label: 'blocked' }
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

  /**
   * What a chain claim on the selected node would cover.
   *
   * Over `MATHEMATICS`, not `ontology` — the same walk the route performs, so
   * the count on the button is the number of rows that will actually be
   * written. Taking it from a single-subject `ontology` would stop at the
   * subject boundary and promise fewer concepts than it claims.
   *
   * Memoised on the id alone: the atlas is a static document, so for a given
   * selection this is a constant.
   */
  const selChain = useMemo(
    () => (sel ? claimableChainFor(MATHEMATICS, sel.id) : []),
    [sel?.id], // eslint-disable-line react-hooks/exhaustive-deps
  )

  /**
   * The queued problems belonging to the selected node.
   *
   * `conceptId` is nullable on a task, so the filter must compare against a
   * real id rather than trusting both sides to be set — a null on each side
   * would otherwise match and attach every unattributed task to whatever node
   * happened to be open.
   */
  const selTasks = useMemo(
    () => (sel ? (queuedTasks ?? []).filter(t => t.conceptId === sel.id) : []),
    [sel?.id, queuedTasks], // eslint-disable-line react-hooks/exhaustive-deps
  )

  /**
   * Bring an externally-selected node into view.
   *
   * Without this, "show me this on the map" is a no-op most of the time: the
   * window is capped at 70vh over an SVG up to 1200px tall, and the area
   * filter hides whole subjects. A journey crosses several areas, so the
   * commonest case is selecting a concept that is neither scrolled to NOR
   * currently drawn.
   *
   * Two steps, in that order. First the filter — a node that is filtered out
   * has no position to scroll to, so switching areas has to happen before the
   * scroll, and it lands on the next pass once `positions` includes it.
   */
  useEffect(() => {
    if (!selected || !areaNames) return
    if (positions.has(selected)) return
    const home = conceptById(ontology, selected)?.subjectId
    if (home && home !== area) setArea(home)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, positions])

  const winRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const win = winRef.current
    if (!selected || !win) return
    const p = positions.get(selected)
    if (!p) return
    /**
     * `scrollTo` on the container, NOT `scrollIntoView` on the node.
     *
     * `scrollIntoView` walks up and scrolls every scrollable ancestor
     * including the page, which yanks the whole view when all that was asked
     * for was to look at a node. Centring by arithmetic — the positions are
     * already computed above — moves exactly one box.
     */
    win.scrollTo({
      left: Math.max(0, p.x + NODE_W / 2 - win.clientWidth / 2),
      top: Math.max(0, p.y + NODE_H / 2 - win.clientHeight / 2),
      behavior: 'smooth',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, positions])

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-gray-800 px-3 py-2'>
        <h3 className='text-xs font-medium text-gray-300'>The graph</h3>
        {areaNames && (
          <select
            value={area}
            onChange={e => { setArea(e.target.value); setSelected(null) }}
            className='rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-200'
          >
            <option value={ALL_AREAS}>
              every area ({ontology.concepts.length} concepts)
            </option>
            {Object.entries(areaNames)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name} ({ontology.concepts.filter(c => c.subjectId === id).length})
                </option>
              ))}
          </select>
        )}
        <span className='text-[11px] text-gray-500'>
          left to right — a prerequisite is always left of what needs it
        </span>
        {visible !== null && (
          // Said out loud, because a filtered graph that does not announce
          // itself is a graph the reader believes is the whole thing.
          <span className='text-[11px] text-gray-600'>
            showing {ontology.concepts.filter(c => c.subjectId === area).length} in this area,
            plus {visible.size - ontology.concepts.filter(c => c.subjectId === area).length} neighbours
            — of {ontology.concepts.length}
          </span>
        )}
        <span className='ml-auto flex flex-wrap items-center gap-2 text-[10px]'>
          {[
            ['strong', '#10b981'],
            ['open', '#3b82f6'],
            ['claimed', '#f59e0b'],
            ['blocked', '#4b5563'],
            ['mapped only', '#3f3f46'],
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

      {/* A window onto the graph, not the whole graph laid out down the page.

          `height` is `maxRows * ROW_H`, so a broad area of the atlas draws an
          SVG around 2700px tall. Only the horizontal axis was contained, which
          meant the panel underneath — the one place a node can be claimed or
          practised — sat that far below whatever node you had just clicked.
          Selecting something and then scrolling past the entire map to act on
          it is the whole interaction, so the buttons read as missing.

          Capping the viewport is the fix rather than moving the panel up,
          because "top" and "bottom" are both wrong for a graph taller than the
          screen: from a node in the middle, either end is a long scroll. With
          the window capped, the filter, the map, the legend and the panel are
          one screen, and the controls are a few hundred pixels from any node
          regardless of where it sits.

          `max-h` only ever caps, so the nine-concept subject graph is
          unaffected and still draws at its natural height. */}
      <div ref={winRef} className='max-h-[70vh] overflow-auto px-1 py-1'>
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
            const context = isContext(c.id)
            return (
              <g
                key={c.id}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => setSelected(isSel ? null : c.id)}
                style={{ cursor: 'pointer' }}
                // Dimmed, not hidden: these are the neighbours that make the
                // cross-area edges visible, and they are not what you asked for.
                opacity={context ? 0.45 : 1}
              >
                <title>
                  {`${c.name} — ${a.label}${context ? ` (in ${areaNames?.[c.subjectId] ?? c.subjectId})` : ''}`}
                </title>
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
                  {a.short}
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

      {/* Pinned to the bottom of the screen while a node is selected.

          The capped window above means the panel is never thousands of pixels
          away, but "a shorter scroll" is still a scroll, and the panel is
          where every verb lives — claim, claim-the-chain, practise. `sticky
          bottom-0` makes it reachable from any scroll position inside the card
          instead of merely a closer one.

          Needs the card's own background: sticky content is transparent by
          default and the graph would show through the buttons. Height is
          capped and scrolled in turn, because with the knowledge points
          expanded this panel is taller than the screen and would otherwise
          pin the entire viewport. */}
      {sel && (
        <div className='sticky bottom-0 z-10 max-h-[45vh] overflow-auto border-t border-gray-800 bg-gray-900 px-3 py-2 text-xs'>
          <div className='flex flex-wrap items-center gap-2'>
            <h4 className='font-medium text-gray-200'>{sel.name}</h4>
            <span className='text-[11px] text-gray-500'>{appearance(sel.id).label}</span>
            {/* Three conditions, and the middle one is the atlas-scope guard.
                `stateOf` is the session progress, which covers only the
                subject being practised — so a concept absent from it is one
                this session cannot claim, whether because it is mapped-only
                or because it belongs to the other authored subject.
                Offering the button there posts a claim the route is right to
                refuse. */}
            {onClaim && isTeachable(ontology, sel.id) && stateOf.has(sel.id)
              && !stateOf.get(sel.id)?.introducible && (
              <button
                onClick={() => onClaim(sel.id, sel.name)}
                title='Say you already know this. It opens the problems now — it does not mark you as knowing it, and one unaided wrong answer withdraws the claim.'
                className='ml-auto rounded-full border border-gray-600 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800'
              >
                I already know this
              </button>
            )}
            {/* The chain offer, and its conditions are deliberately NOT the
                plain claim's.

                No `stateOf` guard: the whole point is to write claims into
                other subjects, so requiring the concept to be in THIS
                session's progress would disable the button exactly where it is
                most useful. No `introducible` guard either — a concept you can
                already practise can still have twenty unclaimed prerequisites
                beneath it.

                `selChain` is computed over MATHEMATICS rather than `ontology`,
                because the route walks the composed map and a count taken from
                a single subject would stop at the boundary and under-report.
                Offered only when the chain reaches past the concept itself;
                with a chain of one it would be the button above, relabelled. */}
            {onClaimChain && selChain.length > 1 && (
              <button
                onClick={() => onClaimChain(sel.id, sel.name, selChain)}
                title={
                  `Claims ${selChain.length} concepts: ${sel.name} and the ${selChain.length - 1} `
                  + `it rests on, across every subject they belong to. Each is a separate claim — `
                  + `each opens its own problems, and each is withdrawn on its own first unaided `
                  + `wrong answer. It does not mark you as knowing any of them.`
                }
                className='rounded-full border border-sky-700/60 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-900/40'
              >
                I know this and the {selChain.length - 1} under it
              </button>
            )}
          </div>
          {/* Named, not just counted. A button that writes twenty rows should
              say which twenty before it is pressed, and the subject labels are
              the part a learner cannot infer — these concepts are mostly not
              in the subject they are looking at. */}
          {onClaimChain && selChain.length > 1 && (
            <details className='mt-1'>
              <summary className='cursor-pointer text-[11px] text-sky-300/70 hover:text-sky-200'>
                what that would claim
              </summary>
              <ul className='mt-1 space-y-0.5 pl-3 text-[11px] leading-snug text-gray-400'>
                {selChain.map(id => {
                  const c = conceptById(MATHEMATICS, id)
                  return (
                    <li key={id}>
                      {c?.name ?? id}
                      {c && c.subjectId !== sel.subjectId && (
                        <span className='text-gray-600'>
                          {' '}— {areaNames?.[c.subjectId] ?? c.subjectId}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </details>
          )}
          {/* The concept's own scope hint, not a `covers` field — that is on the
              SUBJECT. A concept describes itself through its facet option. */}
          {/* Said rather than left as a missing button. A node drawn in the
              earned green with no way to act on it reads as a bug. */}
          {isTeachable(ontology, sel.id) && !stateOf.has(sel.id) && (
            <p className='mt-1 text-[11px] text-amber-200/80'>
              This has problems written for it, but in another subject — switch the practice
              subject to {areaNames?.[sel.subjectId] ?? sel.subjectId} to work on it.
            </p>
          )}
          {/* The fourth state, which was the silent one.

              A concept that is teachable, in this session, and already
              introducible gets no claim button — correctly, because there is
              nothing to unlock. But it got no sentence either, so the one node
              a learner is most able to act on was the node that offered them
              least: topology, and no verb. The other three states each said
              their piece already; this completes the set. */}
          {isTeachable(ontology, sel.id) && stateOf.get(sel.id)?.introducible && (
            <p className='mt-1 text-[11px] text-emerald-200/80'>
              Open to practise now — nothing is gating it.
              {selTasks.length === 0 && ' Nothing is queued for it this session, though; the scheduler picks what comes next.'}
            </p>
          )}
          {sel.scope?.hint && (
            <p className='mt-1 text-[11px] leading-snug text-gray-400'>{sel.scope.hint}</p>
          )}
          {/* Two different absences, said differently.

              "No knowledge points" means nothing has been written at all.
              "Knowledge points but no problems" is a concept you can READ and
              cannot practise — which the count alone reported as though it
              were practisable. Three concepts were in that state — the
              logarithm ones — and `exactLog` closed it, so no shipped concept
              is in it today. The branch stays because the state is reachable
              by authoring: material is written before problems are, and the
              honest thing to show in the gap is this sentence rather than a
              node that looks ready. See `isPractisable`. */}
          <p className='mt-0.5 text-[10px] text-gray-500'>
            {sel.knowledgePoints.length === 0
              ? 'no knowledge points yet — on the map, but nothing to practise, and it gates nothing'
              : `${sel.knowledgePoints.length} knowledge point${sel.knowledgePoints.length === 1 ? '' : 's'}`}
          </p>
          {sel.knowledgePoints.length > 0 && !isPractisable(ontology, sel.id) && (
            <p className='mt-0.5 text-[10px] text-amber-200/80'>
              Readable but not practisable — it has material above and no problems written yet, so
              nothing here can come up in practice.
            </p>
          )}
          <dl className='mt-1.5 space-y-0.5 text-[11px] text-gray-400'>
            <div>
              <dt className='inline text-gray-500'>rests on: </dt>
              <dd className='inline'>
                {prerequisitesOf(ontology, sel.id).map(p => conceptById(ontology, p)?.name ?? p).join(', ') || 'nothing'}
              </dd>
            </div>
            {/* Only shown when it DIFFERS from the drawn edges. The two agree
                for most concepts, and printing the same list twice would
                suggest a distinction where there is none. When they disagree
                it is because an edge runs through a mapped-only concept, and
                then the gating list is the one that decides what opens. */}
            {gatingPrerequisitesOf(ontology, sel.id).join() !== prerequisitesOf(ontology, sel.id).join() && (
              <div>
                <dt className='inline text-gray-500'>gated by: </dt>
                <dd className='inline'>
                  {gatingPrerequisitesOf(ontology, sel.id).map(g => conceptById(ontology, g)?.name ?? g).join(', ') || 'nothing'}
                  <span className='text-gray-600'> — looking through concepts with no problems written</span>
                </dd>
              </div>
            )}
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
            {isTeachable(ontology, sel.id) && (
              <div>
                <dt className='inline text-gray-500'>strength: </dt>
                <dd className='inline'>
                  {Math.round((stateOf.get(sel.id)?.strength ?? 0) * 100)}% — the floor is {Math.round(masteryFloor * 100)}%
                </dd>
              </div>
            )}
          </dl>

          {/* ── What the concept actually SAYS ─────────────────────────────

              The panel above counted the knowledge points and never showed
              one, so the map could tell you a concept rested on four others
              and had three knowledge points without telling you what any of
              it meant. Clicking a node asked "what is this?" and got
              topology back.

              It is all authored and already in the registry — statement,
              subgoals and answer per point — so this needs no request. Which
              is also why it was the wrong thing to be missing.

              Collapsed, because the topology above is the thing the map is
              for and three worked examples would push it off the screen. */}
          {sel.knowledgePoints.length > 0 && (
            <details className='mt-2 border-t border-gray-800 pt-1.5'>
              <summary className='cursor-pointer text-[11px] text-gray-300 hover:text-gray-100'>
                what this teaches — {sel.knowledgePoints.length} knowledge point
                {sel.knowledgePoints.length === 1 ? '' : 's'}
              </summary>
              <ol className='mt-1.5 space-y-2'>
                {[...sel.knowledgePoints]
                  // Authored order. `position` is the field that carries it;
                  // array order has no promise attached to it.
                  .sort((a, b) => a.position - b.position)
                  .map(kp => (
                    <li key={kp.id} className='rounded border border-gray-800 bg-gray-950/60 px-2 py-1.5'>
                      <p className='text-[11px] leading-snug text-gray-200'>{kp.statement}</p>
                      <details className='mt-1'>
                        <summary className='cursor-pointer text-[10px] text-gray-500 hover:text-gray-300'>
                          worked example
                        </summary>
                        <div className='mt-1 space-y-1 text-[10px] leading-snug'>
                          <p className='text-gray-300'>{kp.workedExample.problem}</p>
                          {/* Subgoal labels shown, not flattened into prose.
                              The labelling IS the pedagogy here — the point of
                              a worked example in this engine is that the steps
                              are named, so a learner can see which step they
                              lost rather than only that the answer was wrong. */}
                          <ol className='space-y-0.5 pl-3'>
                            {kp.workedExample.subgoals.map((s, i) => (
                              <li key={i} className='text-gray-400'>
                                <span className='text-gray-500'>{s.label}: </span>{s.detail}
                              </li>
                            ))}
                          </ol>
                          <p className='text-emerald-200/80'>
                            <span className='text-gray-500'>answer: </span>{kp.workedExample.answer}
                          </p>
                        </div>
                      </details>
                    </li>
                  ))}
              </ol>
            </details>
          )}

          {/* ── Anything waiting on this node right now ────────────────────

              Shown only when the queue genuinely holds something for this
              concept. The absence is not reported as "no problems": a
              concept can be perfectly teachable and simply not be what the
              scheduler chose this session, and "none" would read as "none
              exist" — the same distinction `notLoadedNotice` draws for the
              librarian. The lines above already say the two cases that ARE
              actionable (not introducible → claim it; authored in another
              subject → switch subject). */}
          {selTasks.length > 0 && (
            <div className='mt-2 border-t border-gray-800 pt-1.5'>
              <p className='text-[11px] text-gray-300'>
                {selTasks.length} problem{selTasks.length === 1 ? '' : 's'} queued for this
              </p>
              <ul className='mt-1 space-y-1'>
                {selTasks.map(t => (
                  <li key={t.id} className='flex items-start gap-2'>
                    <span className='min-w-0 flex-1 text-[10px] leading-snug text-gray-400'>
                      <span className='text-gray-600'>{t.kind} · </span>
                      {t.prompt.length > 120 ? `${t.prompt.slice(0, 119)}…` : t.prompt}
                    </span>
                    {onPractise && (
                      <button
                        onClick={() => onPractise(t.id)}
                        className='flex-shrink-0 rounded-full border border-emerald-700/60 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-900/40'
                      >
                        practise
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
