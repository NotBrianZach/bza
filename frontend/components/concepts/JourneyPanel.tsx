'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, Flag, Lock, MapPin } from 'lucide-react'
import type { ConceptOntology } from '@/lib/concepts/types'
import {
  byRemaining, JOURNEYS, resolveJourney, type ResolvedJourney,
} from '@/lib/concepts/journeys'

/**
 * Learning journeys, as something to be partway through.
 *
 * The map says where you are and the queue says what is next; neither says
 * what you are working towards. This is that, and the reason it is a panel
 * rather than a page is that it is only useful next to the graph it describes
 * — clicking a step selects that concept on the map, so the narrative and the
 * topology are the same object seen twice.
 *
 * ── What this component is NOT allowed to do ──────────────────────────────
 *
 * Decide anything. Every figure here comes from `resolveJourney`, which is
 * pure and tested; the steps are the graph's own prerequisite closure in the
 * graph's own teaching order. If this file ever computes an order, a count or
 * a completion, those become a second opinion about the curriculum and the
 * learner is reading the wrong one. See the header of lib/concepts/journeys.ts.
 *
 * ── Two numbers, deliberately both shown ──────────────────────────────────
 *
 * `done/total` is progress through the written steps. `unwrittenOnPath` is how
 * many concepts the route crosses that have nothing written at all. A journey
 * reading "3 of 14" while quietly spanning twenty-six unwritten concepts would
 * be the same overstatement `atlasCoverage` exists to prevent, so the second
 * number is printed next to the first rather than kept for a tooltip.
 */
export default function JourneyPanel({
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
  /** Select this concept on the graph above. */
  onSelectConcept?: (conceptId: string) => void
}) {
  const [open, setOpen] = useState<string | null>(null)

  /**
   * Resolved against the live state, re-ordered so the nearly-finished float up.
   *
   * Keyed on the concepts array rather than memoised once: the whole point is
   * that a journey's progress moves as the session does, and a stale
   * resolution would show somebody a step they had just completed.
   */
  const resolved = useMemo(
    () => byRemaining(JOURNEYS.map(j => resolveJourney(ontology, j, concepts, masteryFloor))),
    [ontology, concepts, masteryFloor],
  )

  const taskFor = useMemo(() => {
    const m = new Map<string, string>()
    // First task per concept. A node with three queued problems needs one
    // entry point, not three identical buttons in a narrative list.
    for (const t of queuedTasks ?? []) {
      if (t.conceptId && !m.has(t.conceptId)) m.set(t.conceptId, t.id)
    }
    return m
  }, [queuedTasks])

  return (
    <div className='space-y-2 rounded-lg border border-gray-800 bg-gray-900 p-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h3 className='flex items-center gap-1.5 text-sm font-semibold text-gray-100'>
          <Flag size={13} className='text-sky-400' /> Journeys
        </h3>
        <span className='text-[11px] text-gray-500'>
          somewhere to be going — the steps are the map&apos;s own, not a second syllabus
        </span>
      </div>

      <ul className='space-y-1.5'>
        {resolved.map(r => (
          <JourneyRow
            key={r.journey.id}
            r={r}
            expanded={open === r.journey.id}
            onToggle={() => setOpen(open === r.journey.id ? null : r.journey.id)}
            areaNames={areaNames}
            taskFor={taskFor}
            onPractise={onPractise}
            onSelectConcept={onSelectConcept}
          />
        ))}
      </ul>
    </div>
  )
}

function JourneyRow({
  r, expanded, onToggle, areaNames, taskFor, onPractise, onSelectConcept,
}: {
  r: ResolvedJourney
  expanded: boolean
  onToggle: () => void
  areaNames?: Record<string, string>
  taskFor: Map<string, string>
  onPractise?: (taskId: string) => void
  onSelectConcept?: (conceptId: string) => void
}) {
  const left = r.total - r.done
  const finished = left === 0

  return (
    <li className='rounded border border-gray-800 bg-gray-950/60'>
      <button
        onClick={onToggle}
        className='flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-gray-900/60'
      >
        {expanded
          ? <ChevronDown size={13} className='mt-0.5 flex-shrink-0 text-gray-500' />
          : <ChevronRight size={13} className='mt-0.5 flex-shrink-0 text-gray-500' />}
        <span className='min-w-0 flex-1'>
          <span className='flex flex-wrap items-baseline gap-x-2'>
            <span className={`text-xs font-medium ${finished ? 'text-emerald-200' : 'text-gray-100'}`}>
              {r.journey.title}
            </span>
            {finished && <span className='text-[10px] text-emerald-400'>done</span>}
          </span>
          <span className='mt-0.5 block text-[11px] leading-snug text-gray-400'>{r.journey.premise}</span>
          {/* The bar is the only decoration here, and it is drawn from `done`
              — which is earned strength, never a claim. */}
          <span className='mt-1.5 flex items-center gap-2'>
            <span className='h-1 w-24 overflow-hidden rounded-full bg-gray-800'>
              <span
                className={`block h-full ${finished ? 'bg-emerald-500' : 'bg-sky-500'}`}
                style={{ width: `${r.total === 0 ? 0 : Math.round(100 * r.done / r.total)}%` }}
              />
            </span>
            <span className='text-[10px] text-gray-500'>
              {r.done} of {r.total} written step{r.total === 1 ? '' : 's'}
              {/* Said on the collapsed row, not hidden behind the fold. This
                  is the number that stops "3 of 14" reading as "a fifth of
                  the way through this subject". */}
              {r.unwrittenOnPath > 0 && ` · route crosses ${r.unwrittenOnPath} with nothing written yet`}
            </span>
          </span>
        </span>
      </button>

      {expanded && (
        <div className='border-t border-gray-800 px-2.5 py-2'>
          <p className='text-[11px] leading-relaxed text-gray-300'>{r.journey.arc}</p>

          <p className='mt-2 text-[10px] uppercase tracking-wide text-gray-600'>
            The route — {r.areas.length} area{r.areas.length === 1 ? '' : 's'}
            {r.areas.length > 0 && (
              <span className='normal-case tracking-normal text-gray-500'>
                {' '}· {r.areas.map(a => areaNames?.[a] ?? a).join(' → ')}
              </span>
            )}
          </p>
          {/* A cyclic graph has no teaching order, so the sequence below is a
              fallback. Said rather than silently shown as authoritative. */}
          {r.orderUnreliable && (
            <p className='mt-1 text-[10px] text-amber-300/80'>
              The graph has a prerequisite cycle, so this order is approximate.
            </p>
          )}

          <ol className='mt-1.5 space-y-1'>
            {r.steps.map(s => {
              const taskId = taskFor.get(s.conceptId)
              const isNext = r.next?.conceptId === s.conceptId
              return (
                <li
                  key={s.conceptId}
                  className={`flex items-start gap-2 rounded px-1.5 py-1 ${
                    isNext ? 'bg-sky-950/40 ring-1 ring-sky-800/60' : ''
                  }`}
                >
                  {/* Three states and three marks: earned, open, gated. A
                      claimed-but-unearned step shows as open with a note, not
                      as a tick — see the `done` rule in journeys.ts. */}
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
                      title={onSelectConcept ? 'Show this on the map' : undefined}
                      className={`text-left text-[11px] ${
                        s.done ? 'text-gray-400' : 'text-gray-200'
                      } ${onSelectConcept ? 'hover:text-sky-200 hover:underline' : ''}`}
                    >
                      {s.name}
                    </button>
                    {s.milestone && (
                      <span className='ml-1.5 text-[10px] text-sky-300/80'>— {s.milestone.label}</span>
                    )}
                    {s.milestone && (
                      <span className='mt-0.5 block text-[10px] leading-snug text-gray-500'>
                        {s.milestone.promise}
                      </span>
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

          {/* The one actionable sentence, at the bottom where the eye lands
              after the list. `next` is null for two different reasons and they
              are told apart here rather than collapsed into one message. */}
          <p className='mt-2 text-[11px]'>
            {finished
              ? <span className='text-emerald-200'>Every written step on this route is above the floor.</span>
              : r.next
                ? <span className='text-sky-200'>Next: {r.next.name}</span>
                : <span className='text-gray-400'>
                    Nothing on this route is open yet — the earlier steps have to come up in
                    practice first, or be claimed on the map.
                  </span>}
          </p>
        </div>
      )}
    </li>
  )
}
