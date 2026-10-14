'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, Lock, Search } from 'lucide-react'
import {
  allPrerequisitesOf, candidates, conceptById, dependentsOf, encompassedBy, interferenceReason,
  interferesWith, ontologyProblems, prerequisitesOf, promotionRate, teachingOrder,
} from '@/lib/concepts/registry'
import type { ConceptOntology } from '@/lib/concepts/types'

/**
 * The concept browser. Read-only, and that is step 1's whole proposition.
 *
 * It exists to answer one question before anything is built on top of it: *is the
 * ontology authorable at all?* The thing to look at is the promotion rate in the
 * header. A low rate means the structure is not coming from wherever the
 * candidates came from — statements arrive, dependencies do not — which is still
 * a useful finding and a much smaller claim than "the concept graph can be
 * imported".
 *
 * Four things are shown that a prettier browser would hide, and each one is here
 * because hiding it is how an ontology rots:
 *
 *  - Unpromoted candidate edges, listed separately and marked as gating nothing.
 *  - The `guided` fidelity caveat, verbatim, on every concept that carries one.
 *  - Interference pairs with their authored reason. An interference nobody can
 *    read the reason for is one somebody eventually deletes.
 *  - `ontologyProblems()`, in a banner. The page loads and names its own faults
 *    rather than refusing to render, because an ontology is a hand-authored
 *    document and these are editorial faults, not crashes.
 */
export default function ConceptBrowser({ ontology }: { ontology: ConceptOntology }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [showCandidates, setShowCandidates] = useState(false)

  const problems = useMemo(() => ontologyProblems(ontology), [ontology])
  const order = useMemo(() => teachingOrder(ontology), [ontology])
  const rate = useMemo(() => promotionRate(ontology), [ontology])
  const pending = useMemo(() => candidates(ontology), [ontology])

  const name = (id: string) => conceptById(ontology, id)?.name ?? id

  // Teaching order when the graph is acyclic, registry order otherwise. A cycle
  // makes `teachingOrder` return null rather than a partial order, so the
  // fallback is what keeps every concept visible while the banner says why the
  // order is missing.
  const listed = useMemo(() => {
    const ids = order ?? ontology.concepts.map(c => c.id)
    const needle = query.trim().toLowerCase()
    if (!needle) return ids
    return ids.filter(id => {
      const concept = conceptById(ontology, id)
      if (!concept) return false
      return (
        concept.name.toLowerCase().includes(needle)
        || concept.id.includes(needle)
        || concept.knowledgePoints.some(p => p.statement.toLowerCase().includes(needle))
      )
    })
  }, [order, ontology, query])

  return (
    <div className='space-y-4'>
      {/* ── header ───────────────────────────────────────────────────── */}
      <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
        <h2 className='text-lg font-semibold text-gray-100'>{ontology.subject.name}</h2>
        <p className='mt-1 text-sm text-gray-400'>{ontology.subject.covers}</p>

        <dl className='mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4'>
          <Stat label='Concepts' value={String(ontology.concepts.length)} />
          <Stat
            label='Knowledge points'
            value={String(ontology.concepts.reduce((n, c) => n + c.knowledgePoints.length, 0))}
          />
          <Stat
            label='Checked / guided'
            value={`${ontology.concepts.filter(c => c.fidelity === 'checked').length} / ${
              ontology.concepts.filter(c => c.fidelity === 'guided').length}`}
          />
          <Stat
            label='Prerequisites promoted'
            value={rate ? `${Math.round(rate.rate * 100)}%` : '—'}
            hint={rate ? `${rate.promoted} of ${rate.proposed} proposed` : 'nothing proposed'}
          />
        </dl>
      </div>

      {problems.length > 0 && (
        <div className='rounded-lg border border-amber-800/60 bg-amber-950/40 p-3 text-xs text-amber-200'>
          <div className='mb-1 flex items-center gap-1.5 font-semibold'>
            <AlertTriangle size={13} /> {problems.length} problem{problems.length === 1 ? '' : 's'} in this ontology
          </div>
          <ul className='list-disc space-y-0.5 pl-4'>
            {problems.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* ── search ───────────────────────────────────────────────────── */}
      <label className='flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2'>
        <Search size={14} className='shrink-0 text-gray-500' />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Search concepts and knowledge points'
          className='w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none'
        />
      </label>

      {!order && (
        <p className='text-xs text-amber-300'>
          No teaching order is shown because the prerequisite graph has a cycle — see the banner above.
          Concepts are listed in registry order instead.
        </p>
      )}

      {/* ── concepts ─────────────────────────────────────────────────── */}
      <ul className='space-y-2'>
        {listed.map((id, index) => {
          const concept = conceptById(ontology, id)
          if (!concept) return null
          const isOpen = open === id
          const prereqs = prerequisitesOf(ontology, id)
          const unlocks = dependentsOf(ontology, id)
          const exercises = encompassedBy(ontology, id)
          const clashes = interferesWith(ontology, id)

          return (
            <li key={id} className='overflow-hidden rounded-lg border border-gray-800 bg-gray-900'>
              <button
                onClick={() => setOpen(isOpen ? null : id)}
                className='flex w-full items-start gap-2 p-3 text-left hover:bg-gray-800/60'
              >
                {isOpen
                  ? <ChevronDown size={15} className='mt-0.5 shrink-0 text-gray-500' />
                  : <ChevronRight size={15} className='mt-0.5 shrink-0 text-gray-500' />}
                <span className='min-w-0 flex-1'>
                  <span className='flex flex-wrap items-center gap-2'>
                    {order && <span className='text-xs text-gray-600'>{index + 1}</span>}
                    <span className='text-sm font-medium text-gray-100'>{concept.name}</span>
                    <Fidelity kind={concept.fidelity} />
                  </span>
                  <span className='mt-1 block text-xs text-gray-500'>
                    {concept.knowledgePoints.length} point{concept.knowledgePoints.length === 1 ? '' : 's'}
                    {prereqs.length > 0 && <> · rests on {prereqs.map(name).join(', ')}</>}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className='space-y-3 border-t border-gray-800 p-3 text-sm'>
                  {concept.fidelity === 'guided' && concept.caveat && (
                    <p className='rounded border-l-2 border-amber-600 bg-amber-950/30 px-3 py-2 text-xs text-amber-200'>
                      {concept.caveat}
                    </p>
                  )}

                  <Row label='Search hint'>
                    <code className='rounded bg-gray-950 px-1.5 py-0.5 text-xs text-emerald-300'>
                      {concept.scope.hint}
                    </code>
                  </Row>
                  {concept.scope.match && (
                    <Row label='Membership pattern'>
                      <code className='break-all rounded bg-gray-950 px-1.5 py-0.5 text-xs text-emerald-300'>
                        {String(concept.scope.match)}
                      </code>
                    </Row>
                  )}

                  {prereqs.length > 0 && (
                    <Row label='Prerequisites'>
                      <span className='text-xs text-gray-300'>{prereqs.map(name).join(' · ')}</span>
                      <span className='mt-0.5 block text-[11px] text-gray-600'>
                        transitively: {allPrerequisitesOf(ontology, id).map(name).join(' · ') || 'none'}
                      </span>
                    </Row>
                  )}
                  {unlocks.length > 0 && (
                    <Row label='Unlocks'>
                      <span className='text-xs text-gray-300'>{unlocks.map(name).join(' · ')}</span>
                    </Row>
                  )}
                  {exercises.length > 0 && (
                    <Row label='Exercising this also exercises'>
                      <span className='text-xs text-gray-300'>{exercises.map(name).join(' · ')}</span>
                      <span className='mt-0.5 block text-[11px] text-gray-600'>
                        Credit propagates along these, which is why a prerequisite you just used does
                        not come due as though untouched.
                      </span>
                    </Row>
                  )}
                  {clashes.length > 0 && (
                    <Row label='Never introduced alongside'>
                      {clashes.map(other => (
                        <div key={other} className='text-xs text-rose-300'>
                          {name(other)}
                          <span className='mt-0.5 block text-[11px] text-gray-500'>
                            {interferenceReason(ontology, id, other) ?? 'no reason recorded'}
                          </span>
                        </div>
                      ))}
                    </Row>
                  )}

                  <Row label='Objectives'>
                    <ul className='space-y-1'>
                      {concept.objectives.map(o => (
                        <li key={o.id} className='text-xs text-gray-300'>
                          {o.statement}
                          <span className='ml-1 text-[11px] text-gray-600'>({o.taskKinds.join(', ')})</span>
                        </li>
                      ))}
                    </ul>
                  </Row>

                  <div className='space-y-2'>
                    {[...concept.knowledgePoints].sort((a, b) => a.position - b.position).map(point => (
                      <details key={point.id} className='rounded border border-gray-800 bg-gray-950 p-2'>
                        <summary className='cursor-pointer text-xs text-gray-200'>
                          {point.statement}
                          {point.automaticityTarget && (
                            <span className='ml-1 text-[11px] text-gray-600'>
                              · target {Math.round(point.automaticityTarget / 1000)}s
                            </span>
                          )}
                        </summary>
                        <div className='mt-2 space-y-1.5 text-xs'>
                          <p className='font-medium text-gray-300'>{point.workedExample.problem}</p>
                          <ol className='space-y-1'>
                            {point.workedExample.subgoals.map((s, i) => (
                              <li key={i}>
                                <span className='text-emerald-300'>{s.label}</span>
                                <span className='block text-gray-400'>{s.detail}</span>
                              </li>
                            ))}
                          </ol>
                          <p className='text-gray-200'>
                            <span className='text-gray-500'>Answer: </span>{point.workedExample.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* ── candidates ───────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className='rounded-lg border border-gray-800 bg-gray-900 p-3'>
          <button
            onClick={() => setShowCandidates(v => !v)}
            className='flex w-full items-center gap-2 text-left text-sm text-gray-200'
          >
            <Lock size={13} className='text-gray-500' />
            {pending.length} unpromoted candidate prerequisite{pending.length === 1 ? '' : 's'}
            {showCandidates ? <ChevronDown size={14} className='ml-auto' /> : <ChevronRight size={14} className='ml-auto' />}
          </button>
          {showCandidates && (
            <>
              <p className='mt-2 text-xs text-gray-500'>
                These gate nothing and appear in no walk. They are here to be counted: the promotion
                rate above is only a measurement if the unpromoted edges are still in the file.
              </p>
              <ul className='mt-2 space-y-1.5'>
                {pending.map(edge => (
                  <li key={edge.id} className='text-xs'>
                    <span className='text-gray-300'>{name(edge.from)} → {name(edge.to)}</span>
                    {edge.rationale && <span className='mt-0.5 block text-[11px] text-gray-500'>{edge.rationale}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className='text-gray-500'>{label}</dt>
      <dd className='text-base font-semibold text-gray-100'>{value}</dd>
      {hint && <dd className='text-[11px] text-gray-600'>{hint}</dd>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className='text-[11px] uppercase tracking-wide text-gray-600'>{label}</div>
      <div className='mt-0.5'>{children}</div>
    </div>
  )
}

/**
 * The fidelity badge, and it says the thing out loud.
 *
 * 'checked' here means the pattern decides against the provider's own text — not
 * that a formal library backs it. That distinction is in the tooltip rather than
 * implied, because "checked" reads like a stronger promise than it is and the
 * whole two-kind split exists to stop exactly that overreading.
 */
function Fidelity({ kind }: { kind: 'checked' | 'guided' }) {
  return kind === 'checked'
    ? (
      <span
        title='A pattern decides membership against the page title, extract and categories. Not mathlib-backed.'
        className='rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300'
      >
        checked
      </span>
    )
    : (
      <span
        title='Nothing can decide membership, so this steers the search and filters nothing.'
        className='rounded bg-amber-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300'
      >
        guided
      </span>
    )
}
