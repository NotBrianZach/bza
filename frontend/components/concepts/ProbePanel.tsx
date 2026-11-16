'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { HelpCircle, Loader2, Send, Shuffle, Target } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'
import { conceptById } from '@/lib/concepts/registry'
import { probesAcross, type ProbeKind, type ProbeTarget } from '@/lib/concepts/probe'
import type { ConceptOntology } from '@/lib/concepts/types'

/**
 * Probe mode — one question about where an understanding stops.
 *
 * The sibling of SocraticWalk, and separate from it on purpose. A walk is a
 * position in a chain: it has steps, a reveal, a self-check and a terminus that
 * hands over a problem. A probe has none of those — it is one question about a
 * pair of concepts, and the only thing that advances is the conversation. Those
 * are different state machines, and grafting the second onto the first would
 * have meant a `mode` branch in every one of the walk's handlers.
 *
 * ── Nothing here is evidence, and it says so in the header ────────────────
 *
 * Same line the walk draws, for the same reason. It matters slightly more here
 * because a probe has no terminus: a walk at least ends by pointing at a
 * rulable problem, whereas a probe ends when the learner stops. So there is no
 * self-check tally even as a local one — there is nothing to tally, and a
 * counter would imply the questions were being scored.
 *
 * ── Why a probe can fail where a walk cannot ──────────────────────────────
 *
 * The walk degrades to `unphrased` with no model, printing the step's own
 * words. A probe has no authored sentence to print, so /api/learn/probe
 * refuses with a 503 and a `reason`. This panel surfaces that refusal as
 * itself rather than as an error, and points at the walk, which still works.
 */

const Md = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)

/** What each kind is, in the learner's terms. Shown, never averaged away. */
const KIND_LABEL: Record<ProbeKind, string> = {
  boundary: 'telling two ideas apart',
  generalisation: 'pushing an idea wider',
  necessity: 'why one idea needs another',
}

type Asked = { question: string; kind: ProbeKind; anchorName: string; otherName: string }

export default function ProbePanel({
  ontology,
  concepts,
  masteryFloor,
  subjectName,
  onSelectConcept,
}: {
  ontology: ConceptOntology
  concepts: { conceptId: string; strength: number; introducible: boolean }[]
  masteryFloor: number
  subjectName?: string
  onSelectConcept?: (conceptId: string) => void
}) {
  const [target, setTarget] = useState<ProbeTarget | null>(null)
  const [asked, setAsked] = useState<Asked | null>(null)
  const [thread, setThread] = useState<{ said: string; reply: Asked }[]>([])
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState<'ask' | 'nudge' | null>(null)
  /** A refusal from the route, which is a state rather than a crash. */
  const [refusal, setRefusal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * The probes worth asking, nearest the learner's edge first.
   *
   * Same two tiers and the same reasoning as the Tutor autostart: `introducible`
   * already means every gating prerequisite is over the floor, so the frontier
   * is "what you know" seen from the other side. Falls back to mastered
   * concepts because early on most of an open set is mapped but unwritten, and
   * `probesFor` requires both ends teachable.
   */
  const available = useMemo(() => {
    const frontier = concepts.filter(c => c.introducible && c.strength < masteryFloor)
    const known = concepts.filter(c => c.strength >= masteryFloor)
    const fromFrontier = probesAcross(ontology, frontier.map(c => c.conceptId))
    if (fromFrontier.length) return { tier: 'frontier' as const, probes: fromFrontier }
    return { tier: 'review' as const, probes: probesAcross(ontology, known.map(c => c.conceptId)) }
  }, [ontology, concepts, masteryFloor])

  const ask = useCallback(async (t: ProbeTarget) => {
    setTarget(t)
    setAsked(null)
    setThread([])
    setAnswer('')
    setRefusal(null)
    setError(null)
    setBusy('ask')
    try {
      const res = await authedFetch('/api/learn/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: t.kind, anchorId: t.anchorId, otherId: t.otherId, subjectName }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 503 is a refusal with a reason; anything else is a real fault.
        if (res.status === 503) setRefusal(data?.error ?? 'No tutor is available.')
        else setError(data?.error ?? 'Could not get a question.')
        return
      }
      setAsked(data as Asked)
    } catch {
      setError('Could not reach the tutor.')
    } finally {
      setBusy(null)
    }
  }, [subjectName])

  /**
   * A random one of the candidates.
   *
   * Random rather than ordered because the three kinds are not a difficulty
   * ramp — a `necessity` probe is not an easier `boundary` probe — so walking
   * them in order would just mean every learner meets 64 prerequisite
   * questions before any of the 14 sharp ones.
   */
  const askAnother = useCallback(() => {
    const { probes } = available
    if (!probes.length) return
    // Everything except the one on screen, so "another" always moves. Falls
    // back to the whole list when that leaves nothing — with a single candidate
    // re-asking it is the only honest option, and the button is hidden then
    // anyway.
    const others = probes.filter(p => !target
      || p.kind !== target.kind
      || p.anchorId !== target.anchorId
      || p.otherId !== target.otherId)
    const pool = others.length ? others : probes
    void ask(pool[Math.floor(Math.random() * pool.length)])
  }, [available, target, ask])

  /** Opens on a question, like the Tutor tab does. Once per mount. */
  const opened = useRef(false)
  useEffect(() => {
    if (opened.current || !concepts.length || !available.probes.length) return
    opened.current = true
    askAnother()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts.length, available.probes.length])

  const send = useCallback(async (stuck: boolean) => {
    if (!target || !asked) return
    const said = stuck ? '' : answer.trim()
    if (!stuck && !said) return
    setBusy('nudge')
    setError(null)
    try {
      const res = await authedFetch('/api/learn/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: target.kind,
          anchorId: target.anchorId,
          otherId: target.otherId,
          mode: 'nudge',
          asked: asked.question,
          answer: said,
          subjectName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 503) setRefusal(data?.error ?? 'No tutor is available.')
        else setError(data?.error ?? 'Could not send that.')
        return
      }
      // The learner's words are kept beside the reply, not replaced by it: the
      // sent answer vanishing from the screen is what made the walk's first
      // version look like it had not sent anything.
      setThread(t => [...t, { said: stuck ? '' : said, reply: data as Asked }])
      setAnswer('')
    } catch {
      setError('Could not reach the tutor.')
    } finally {
      setBusy(null)
    }
  }, [target, asked, answer, subjectName])

  const header = (
    <div className='flex flex-wrap items-center gap-2 border-b border-gray-800 px-3 py-1.5'>
      <Target size={12} className='text-fuchsia-400' />
      <h3 className='text-xs font-medium text-gray-300'>Probe mode</h3>
      <span className='ml-auto text-[11px] text-amber-300/80'>
        asks — never marks. Nothing here is recorded, and there is no score.
      </span>
    </div>
  )

  const latest = thread.length ? thread[thread.length - 1].reply : asked

  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900'>
      {header}

      <div className='px-3 py-3 text-xs'>
        {available.probes.length === 0 && concepts.length > 0 && (
          <p className='text-gray-500'>
            Nothing to probe yet. A probe compares two concepts that both have material written,
            and not enough of your open set does. The derivation walk works on a single concept,
            so try that.
          </p>
        )}

        {concepts.length === 0 && (
          <p className='inline-flex items-center gap-1.5 text-gray-500'>
            <Loader2 size={11} className='animate-spin' /> finding something to ask you…
          </p>
        )}

        {refusal && (
          <p className='rounded border border-amber-900/60 bg-amber-950/30 px-2 py-1.5 text-[11px] text-amber-200/90'>
            {refusal}
          </p>
        )}
        {error && <p className='mb-2 text-[11px] text-red-400'>{error}</p>}

        {busy === 'ask' && (
          <p className='inline-flex items-center gap-1.5 text-gray-500'>
            <Loader2 size={11} className='animate-spin' /> writing a question…
          </p>
        )}

        {asked && busy !== 'ask' && (
          <>
            {/* Which pair, and which kind. Both, because "telling two ideas
                apart" is a different promise from naming the two ideas, and a
                learner is entitled to know which move is being asked of them. */}
            <div className='mb-2 flex flex-wrap items-baseline gap-2'>
              <span className='text-[10px] uppercase tracking-wide text-fuchsia-300/80'>
                {KIND_LABEL[asked.kind]}
              </span>
              <button
                onClick={() => onSelectConcept?.(target!.anchorId)}
                disabled={!onSelectConcept}
                title={onSelectConcept ? 'Show this concept on the map' : undefined}
                className={`text-[10px] text-gray-500 ${onSelectConcept ? 'hover:text-sky-300' : ''}`}
              >
                {conceptById(ontology, target!.anchorId)?.name ?? asked.anchorName}
                {' · '}
                {conceptById(ontology, target!.otherId)?.name ?? asked.otherName}
              </button>
              <span className='ml-auto'>
                {available.probes.length > 1 && (
                  <button
                    onClick={askAnother}
                    title='Ask about a different pair'
                    className='inline-flex items-center gap-1 rounded border border-gray-700 px-1.5 py-0.5 text-[10px] text-gray-400 hover:bg-gray-800'
                  >
                    <Shuffle size={9} /> another
                  </button>
                )}
              </span>
            </div>

            <div className='text-[13px] leading-snug text-gray-100'>
              <Md>{asked.question}</Md>
            </div>

            {thread.map((turn, i) => (
              <div key={i} className='mt-2 border-t border-gray-800 pt-2'>
                {turn.said && (
                  <p className='mb-1 whitespace-pre-wrap text-[11px] text-gray-400'>
                    <span className='text-gray-600'>you: </span>{turn.said}
                  </p>
                )}
                <div className='text-[13px] leading-snug text-gray-100'>
                  <Md>{turn.reply.question}</Md>
                </div>
                <p className='mt-0.5 text-[10px] text-gray-600'>
                  a question back, not a verdict. The tutor was never told where the line falls.
                </p>
              </div>
            ))}

            {latest && (
              <div className='mt-2'>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void send(false) }
                  }}
                  rows={2}
                  placeholder='Think out loud — what decides it?'
                  aria-label='Your answer'
                  className='w-full rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-[12px] text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500'
                />
                <div className='mt-1 flex items-center gap-2'>
                  <button
                    onClick={() => void send(false)}
                    disabled={busy !== null || !answer.trim()}
                    className='inline-flex items-center gap-1 rounded bg-fuchsia-900/60 px-2 py-1 text-[11px] text-fuchsia-100 hover:bg-fuchsia-900 disabled:opacity-40'
                  >
                    {busy === 'nudge'
                      ? <><Loader2 size={10} className='animate-spin' /> sending…</>
                      : <><Send size={10} /> send to tutor</>}
                  </button>
                  <button
                    onClick={() => void send(true)}
                    disabled={busy !== null}
                    className='inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-800 disabled:opacity-40'
                  >
                    <HelpCircle size={10} /> I&apos;m stuck
                  </button>
                  <span className='ml-auto text-[10px] text-gray-600'>⌘/Ctrl+Enter</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
