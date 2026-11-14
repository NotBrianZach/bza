'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  ArrowRight, Compass, Eye, HelpCircle, Loader2, Lock, MapPin, RotateCcw,
} from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { conceptById } from '@/lib/concepts/registry'
import {
  chainForPoint, openingsForConcept, revealOf, unmetBefore, walkTerminus,
  type Phrasing, type WalkOpening,
} from '@/lib/concepts/socratic'
import type { ConceptOntology } from '@/lib/concepts/types'

/**
 * Tutor mode — one derivation, one question at a time.
 *
 * ── What is on screen and what it is for ──────────────────────────────────
 *
 * A walk is a worked example taken apart: the problem, then its moves asked
 * one at a time instead of printed. The learner answers in prose, reveals what
 * the step actually establishes, and says for themselves whether they had it.
 * At the end the walk hands over a PROBLEM on the same knowledge point, and
 * that is where anything gets recorded.
 *
 * ── Nothing here is evidence, and the panel says so where it cannot be missed ──
 *
 * Same line PracticeChat draws, and for the same reason, but it has to be
 * drawn again because this surface is more tempting: a learner who has just
 * answered eight questions in a row feels like they have done work, and if the
 * panel let that feel like progress it would be competing with the mastery
 * floor rather than feeding it.
 *
 * So: the answer box posts nowhere, the self-check is a local tally that is
 * discarded on reload, and both say as much. The one button that writes
 * anything is "be set a problem on this", which leaves for the practice tab.
 *
 * ── Why the self-check is the learner's own ───────────────────────────────
 *
 * The obvious feature here is "mark my answer", and it is the one thing this
 * cannot do. Prose is unverifiable, and the asking model is never given the
 * step's answer — structurally, see lib/concepts/socratic.ts — so it is not
 * merely forbidden from marking, it is incapable of it. What is left is the
 * honest version: show the authored detail, and let the learner say. A tally
 * they wrote about themselves is worth something to them and nothing to the
 * scheduler, which is exactly how it is presented.
 *
 * ── It decides nothing ────────────────────────────────────────────────────
 *
 * Chains, contexts, reveals, termini and the unmet-prerequisite list all come
 * from lib/concepts/, which is pure and tested. This file owns pixels and one
 * fetch.
 */

const SOURCE_LABEL: Record<Phrasing, string> = {
  authored: 'written by the author of this example',
  tutor: 'phrased by the tutor just now',
  unphrased: 'the step in its own words — not phrased as a question',
}

interface Asked {
  question: string
  source: Phrasing
  remaining: number
  note?: string
}

export default function SocraticWalk({
  ontology,
  target,
  concepts,
  masteryFloor,
  queuedTasks,
  onPractise,
  onSelectConcept,
}: {
  /** The composed atlas. A walk is looked up by point id across every subject. */
  ontology: ConceptOntology
  /**
   * What a map asked for, or null.
   *
   * A concept means "offer me its worked examples"; a point means "start this
   * one". Two shapes rather than one because the two callers know different
   * things: the concept map knows a concept, and a queued problem knows the
   * knowledge point it was generated from.
   */
  target: { conceptId?: string; pointId?: string } | null
  concepts: { conceptId: string; strength: number; introducible: boolean }[]
  masteryFloor: number
  /**
   * The real queue — which answers two different questions here.
   *
   * With no target it is what to OFFER, because the concepts a learner is
   * being set problems on are the ones they are working through. At the end of
   * a walk it is whether the problem it converts to is already waiting, which
   * decides whether "be set this problem" is a jump or a request that the
   * practice tab may still refuse.
   */
  queuedTasks?: { id: string; conceptId: string | null }[]
  onPractise?: (taskId: string) => void
  onSelectConcept?: (conceptId: string) => void
}) {
  const [pointId, setPointId] = useState<string | null>(null)
  const [position, setPosition] = useState(0)
  const [asked, setAsked] = useState<Asked | null>(null)
  const [busy, setBusy] = useState<'ask' | 'nudge' | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Extra questions on the current step, oldest first. Cleared on advance. */
  const [nudges, setNudges] = useState<Asked[]>([])
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  /** The learner's own verdict per step. Local, discarded, and labelled as such. */
  const [had, setHad] = useState<Record<number, boolean>>({})
  /**
   * Bumped by `start`, and a dependency of the asking effect.
   *
   * Without it, restarting a walk from its first step changes neither
   * `pointId` nor `position`, so the effect does not re-run — and `start` has
   * just cleared the question, leaving the panel on "phrasing the question…"
   * with nothing on the way. The nonce is what makes "restart" a real event
   * rather than a state assignment that happens to be identical.
   */
  const [run, setRun] = useState(0)

  const chain = useMemo(
    () => (pointId ? chainForPoint(ontology, pointId) : null),
    [ontology, pointId],
  )

  const ask = useCallback(async (at: number, mode: 'ask' | 'nudge', said: string) => {
    if (!pointId) return
    setBusy(mode)
    setError(null)
    try {
      const res = await authedFetch('/api/learn/socratic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointId, position: at, mode, answer: said }),
      })
      const d = await res.json() as Asked & { error?: string }
      if (d.error) { setError(d.error); return }
      if (mode === 'nudge') setNudges(n => [...n, d])
      else setAsked(d)
    } catch {
      setError('could not reach the tutor')
    } finally {
      setBusy(null)
    }
  }, [pointId])

  /*
   * Ask whenever the step changes, including the first.
   *
   * Keyed on `pointId` and `position` rather than called from each button, so
   * there is one place a question is fetched and no way to advance the step
   * without asking about it.
   */
  useEffect(() => {
    if (!pointId || !chain) return
    if (position >= chain.questions.length) { setAsked(null); return }
    ask(position, 'ask', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointId, position, run])

  const start = (id: string) => {
    setPointId(id)
    setPosition(0)
    setAsked(null)
    setNudges([])
    setAnswer('')
    setRevealed(false)
    setHad({})
    setError(null)
    setRun(r => r + 1)
  }

  /* A map handed us a target. A point starts immediately; a concept offers. */
  useEffect(() => {
    if (target?.pointId && target.pointId !== pointId) start(target.pointId)
    else if (target?.conceptId) setPointId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.pointId, target?.conceptId])

  const advance = () => {
    setPosition(p => p + 1)
    setNudges([])
    setAnswer('')
    setRevealed(false)
  }

  // -------------------------------------------------------------------------
  // Picking a walk
  // -------------------------------------------------------------------------

  /**
   * What to offer when nothing is chosen: the asked-for concept, else the
   * concepts the current practice set is already about.
   *
   * Not the whole map. There are 105 chains and a list of all of them answers
   * "what could I be led through" with a catalogue, while the two maps answer
   * it in place — which is why both of them link here with a concept in hand.
   */
  const offered = useMemo<WalkOpening[]>(() => {
    if (target?.conceptId) return openingsForConcept(ontology, target.conceptId)
    const fromQueue = [...new Set((queuedTasks ?? []).map(t => t.conceptId).filter(Boolean))]
    return (fromQueue as string[]).flatMap(id => openingsForConcept(ontology, id))
  }, [ontology, target?.conceptId, queuedTasks])

  const unmet = useMemo(
    () => (chain ? unmetBefore(ontology, chain.conceptId, concepts, masteryFloor) : []),
    [ontology, chain, concepts, masteryFloor],
  )

  const header = (
    <div className='flex flex-wrap items-center gap-2 border-b border-gray-800 px-3 py-1.5'>
      <Compass size={12} className='text-sky-400' />
      <h3 className='text-xs font-medium text-gray-300'>Tutor mode</h3>
      {/* In the header, not a footnote. See the module note. */}
      <span className='ml-auto text-[11px] text-amber-300/80'>
        asks — never marks. Nothing here is recorded; the problem at the end is.
      </span>
    </div>
  )

  if (!chain) {
    return (
      <div className='rounded-lg border border-gray-800 bg-gray-900'>
        {header}
        <div className='px-3 py-3 text-xs'>
          {target?.conceptId && (
            <p className='mb-2 text-gray-400'>
              {conceptById(ontology, target.conceptId)?.name ?? target.conceptId}
              {offered.length === 0 && (
                <span className='text-gray-500'>
                  {' '}— nothing is written for this one yet, so there is no derivation to be led
                  through. It is on the map and ordered; that is all.
                </span>
              )}
            </p>
          )}
          {offered.length === 0 && !target?.conceptId && (
            <p className='text-gray-500'>
              Pick a concept on the concept map or a journey and choose “lead me through this”, or
              open a problem on the practice tab and ask for the example behind it.
            </p>
          )}
          <ul className='space-y-1.5'>
            {offered.map(o => (
              <li
                key={o.knowledgePointId}
                className='rounded border border-gray-800 bg-gray-950/40 px-2 py-1.5'
              >
                <div className='flex flex-wrap items-baseline gap-2'>
                  <button
                    onClick={() => start(o.knowledgePointId)}
                    className='text-left text-[12px] text-gray-100 hover:text-sky-200 hover:underline'
                  >
                    {o.problem}
                  </button>
                  <span className='text-[10px] text-gray-500'>{o.conceptName}</span>
                </div>
                {/* Both figures, because they are two claims. See WalkOpening. */}
                <p className='mt-0.5 text-[10px] text-gray-500'>
                  {o.steps} step{o.steps === 1 ? '' : 's'} — {o.authored} written as
                  {o.authored === 1 ? ' a question' : ' questions'}, the rest phrased as you go
                  {o.convertsTo.length === 0
                    ? '. Ends with no problem to be set, so talking it through records nothing.'
                    : `. Ends at ${o.convertsTo.length} problem${o.convertsTo.length === 1 ? '' : 's'}.`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const done = position >= chain.questions.length
  const terminus = walkTerminus(chain)
  const reveal = revealOf(chain, position)
  const tally = Object.values(had)

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      {header}

      {/* The problem, present on every step. A question about a derivation the
          learner cannot see is a riddle. */}
      <div className='border-b border-gray-800 px-3 py-2'>
        <div className='flex flex-wrap items-baseline gap-2'>
          <button
            onClick={() => onSelectConcept?.(chain.conceptId)}
            disabled={!onSelectConcept}
            title={onSelectConcept ? 'Show this concept on the map' : undefined}
            className={`text-[10px] uppercase tracking-wide text-gray-500 ${
              onSelectConcept ? 'hover:text-sky-300' : ''
            }`}
          >
            {conceptById(ontology, chain.conceptId)?.name ?? chain.conceptId}
          </button>
          <span className='ml-auto text-[10px] text-gray-500'>
            {done ? `${chain.questions.length} of ${chain.questions.length}` : `step ${position + 1} of ${chain.questions.length}`}
          </span>
          <button
            onClick={() => start(chain.knowledgePointId)}
            title='Start this derivation again from the first question'
            className='inline-flex items-center gap-1 rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400 hover:bg-gray-800'
          >
            <RotateCcw size={9} /> restart
          </button>
        </div>
        <div className='mt-1 text-[13px] leading-snug text-gray-100'>
          <Md>{chain.problem}</Md>
        </div>
        {/* Said, not enforced. A walk records nothing, so it cannot be a way
            around the floor — and being led through something whose
            groundwork is missing is a choice a learner is allowed to make. */}
        {unmet.length > 0 && (
          <p className='mt-1 text-[10px] text-amber-200/70'>
            This derivation leans on {unmet.map(u => u.name).join(', ')}, which you have not
            demonstrated. You can still be led through it — nothing here is marked — but the
            problem at the end stays shut until those are above the floor.
          </p>
        )}
      </div>

      {error && (
        <p className='border-b border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-[11px] text-rose-200'>
          {error}
        </p>
      )}

      {done ? (
        <div className='px-3 py-3 text-xs'>
          <p className='text-gray-300'>That is the whole derivation.</p>
          <div className='mt-1.5 rounded border border-emerald-900/50 bg-emerald-950/20 px-2 py-1.5 text-[12px] text-emerald-100'>
            <Md>{terminus.answer}</Md>
          </div>

          {/* The learner's own count, named as theirs. Not a score, and the
              sentence says what it is not. */}
          {tally.length > 0 && (
            <p className='mt-2 text-[11px] text-gray-500'>
              You said you had {tally.filter(Boolean).length} of {tally.length} steps you checked.
              That is your own note to yourself — it is not recorded and moves nothing.
            </p>
          )}

          <div className='mt-2'>
            {terminus.convertsTo.length === 0 ? (
              <p className='text-[11px] text-gray-500'>
                There is no problem on this knowledge point, so nothing can come of this walk on
                the record. That is a gap in what has been authored, not something you did.
              </p>
            ) : (
              <>
                <p className='text-[11px] text-gray-400'>
                  Now the same move in different numbers — this is the part that counts.
                </p>
                <div className='mt-1 flex flex-wrap gap-1'>
                  {terminus.convertsTo.map(id => {
                    const queued = (queuedTasks ?? []).some(t => t.id === id)
                    return (
                      <button
                        key={id}
                        onClick={() => onPractise?.(id)}
                        disabled={!onPractise}
                        title={queued
                          ? 'Open this problem on the practice tab'
                          : 'Not in your current set — the practice tab will say whether it is open to you yet'}
                        className='inline-flex items-center gap-1 rounded-full border border-emerald-700/60 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-40'
                      >
                        {queued ? <ArrowRight size={10} /> : <Lock size={10} className='opacity-60' />}
                        be set this problem
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className='px-3 py-3 text-xs'>
          {/* The question. */}
          {busy === 'ask' || !asked ? (
            <p className='inline-flex items-center gap-1.5 text-[11px] text-gray-500'>
              <Loader2 size={11} className='animate-spin' /> phrasing the question…
            </p>
          ) : (
            <>
              <div className='text-[13px] leading-snug text-sky-100'>
                <Md>{asked.question}</Md>
              </div>
              <p className='mt-0.5 text-[10px] text-gray-600'>{SOURCE_LABEL[asked.source]}</p>
              {asked.note && (
                <p className='mt-1 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-200/80'>
                  {asked.note}
                </p>
              )}
            </>
          )}

          {nudges.map((n, i) => (
            <div key={i} className='mt-2 border-l-2 border-sky-900/60 pl-2'>
              <div className='text-[12px] leading-snug text-sky-100/90'>
                <Md>{n.question}</Md>
              </div>
              <p className='mt-0.5 text-[10px] text-gray-600'>{SOURCE_LABEL[n.source]}</p>
            </div>
          ))}

          {/* The answer box posts nowhere. Said plainly in the placeholder,
              because an input that looks like it submits and does not is the
              one thing worse than no input at all. */}
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={2}
            placeholder='Answer it in your own words — this is for you, and is not sent anywhere or marked'
            className='mt-2 w-full resize-y rounded border border-gray-700 bg-transparent px-2 py-1 text-xs text-gray-200 outline-none placeholder:text-gray-600'
          />

          <div className='mt-1.5 flex flex-wrap items-center gap-1'>
            <button
              onClick={() => ask(position, 'nudge', answer)}
              disabled={!!busy}
              title='A smaller question about the same step. The tutor still does not have the answer, so it cannot tell you whether yours is right.'
              className='inline-flex items-center gap-1 rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800 disabled:opacity-40'
            >
              {busy === 'nudge' ? <Loader2 size={10} className='animate-spin' /> : <HelpCircle size={10} />}
              smaller question
            </button>
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className='inline-flex items-center gap-1 rounded-full border border-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-800'
              >
                <Eye size={10} /> what this step establishes
              </button>
            ) : (
              <button
                onClick={advance}
                className='inline-flex items-center gap-1 rounded-full border border-sky-700/60 px-2 py-0.5 text-[11px] text-sky-200 hover:bg-sky-900/40'
              >
                <ArrowRight size={10} />
                {position + 1 === chain.questions.length ? 'finish' : 'next step'}
              </button>
            )}
            <span className='ml-auto text-[10px] text-gray-600'>
              {asked ? `${asked.remaining} step${asked.remaining === 1 ? '' : 's'} after this` : ''}
            </span>
          </div>

          {/* The authored detail, revealed by the app rather than the model —
              which is the only reason the model can be kept blind to it. */}
          {revealed && reveal && (
            <div className='mt-2 rounded border border-gray-700 bg-gray-950/50 px-2 py-1.5'>
              <p className='text-[10px] uppercase tracking-wide text-gray-500'>
                what the step establishes
              </p>
              <div className='mt-0.5 text-[12px] leading-snug text-gray-200'>
                <Md>{reveal}</Md>
              </div>
              <div className='mt-1.5 flex flex-wrap items-center gap-1'>
                <span className='text-[10px] text-gray-500'>Did you have that?</span>
                {([['yes', true], ['no', false]] as const).map(([label, value]) => (
                  <button
                    key={label}
                    onClick={() => setHad(h => ({ ...h, [position]: value }))}
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      had[position] === value
                        ? 'border-gray-500 bg-gray-800 text-gray-100'
                        : 'border-gray-700 text-gray-400 hover:bg-gray-800/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className='text-[10px] text-gray-600'>
                  — your own note. Not recorded, and it moves nothing.
                </span>
              </div>
            </div>
          )}

          {/* Where the derivation has got to. The prior steps' details are
              exactly what the tutor is allowed to know, so showing them here
              keeps the two in step. */}
          {position > 0 && (
            <details className='mt-2'>
              <summary className='cursor-pointer text-[10px] text-gray-500 hover:text-gray-300'>
                established so far ({position})
              </summary>
              <ol className='mt-1 space-y-0.5 pl-3 text-[11px] leading-snug text-gray-400'>
                {chain.questions.slice(0, position).map(q => (
                  <li key={q.id}>
                    <span className='text-gray-500'>{q.move}</span> — {q.establishes}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}

      <div className='flex items-center gap-1.5 border-t border-gray-800 px-3 py-1.5 text-[10px] text-gray-600'>
        <MapPin size={9} />
        Derived from the worked example on {chain.knowledgePointId} — the questions cannot
        contradict it, because they are made of it.
      </div>
    </div>
  )
}

/**
 * Markdown and KaTeX, in one place.
 *
 * Needed because the two sources of text on this panel are written
 * differently: the ontology uses Unicode superscripts (2³) and a model is
 * asked for LaTeX ($2^3$). Plain text passes through untouched, so one
 * renderer handles both without either being converted.
 */
function Md({ children }: { children: string }) {
  return (
    <div className='prose prose-invert prose-sm max-w-none prose-p:my-0.5'>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
