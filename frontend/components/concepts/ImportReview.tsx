'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Check, Copy, FileUp, Loader2 } from 'lucide-react'
import { authedFetch } from '@/lib/authedFetch'

/**
 * Review a Math Academy scrape before any of it becomes ontology.
 *
 * ── Why this panel has no promote button ──────────────────────────────────
 *
 * The ontology is `lib/concepts/ontology.ts`, a module in version control, so
 * there is nothing a button could write. Promotion means authoring a concept by
 * hand — a membership pattern, an objective naming real task kinds, knowledge
 * points with subgoal-labelled worked examples — and none of those three can be
 * scraped. A button marked "Promote" would therefore have to either lie about
 * what it did or write a concept with holes in it, and a concept with holes gates
 * a learner on nothing.
 *
 * So the output is the emitted module, with a copy button. That is the real
 * affordance: paste it into a file, read the blockers, author what survives.
 *
 * ── What this screen is arranged to make hard to miss ─────────────────────
 *
 * Three numbers, in descending order of how easy they are to misread:
 *
 *  1. The draft counts, which are NOT counts of usable material. Every draft is
 *     blocked, and the panel says so next to the number rather than in a footnote.
 *  2. The parse rate, which is a *ceiling* on mechanisation and not a count of
 *     tasks that could be generated.
 *  3. The refusals, which are shown as prominently as the acceptances. An importer
 *     that hides what it dropped reads as having imported everything.
 */

interface DraftKnowledgePoint {
  id: string
  statement: string
  unlabelledExample?: { problem: string; solution: string }
  latex: string[]
  blocking: string[]
}

interface DraftTask {
  id: string
  prompt: string
  latex: string[]
  parsable: { latex: string; infix: string }[]
  scrapedAnswer?: string
  blocking: string[]
}

interface DraftConcept {
  id: string
  name: string
  fidelity: string
  caveat: string
  source: {
    topicId: string
    origin: string
    url?: string
    stepCounts: { tutorial: number; example: number; question: number; unknown: number }
  }
  draftKnowledgePoints: DraftKnowledgePoint[]
  draftTasks: DraftTask[]
  suggestedTaskKinds: string[]
  blocking: string[]
}

interface ImportResponse {
  applied?: boolean
  appliedNote?: string
  subjectId?: string
  counts?: {
    topicsScraped: number
    conceptsDrafted: number
    conceptsFromEdgeLabelsOnly: number
    edgesAccepted: number
    edgesRejected: number
    stepsRead: number
    draftKnowledgePoints: number
    draftTasks: number
  }
  summary?: string[]
  parseRate?: { parsable: number; total: number; rate: number } | null
  promotion?: { authored: number; drafted: number; rate: number } | null
  edges?: { id: string; from: string; to: string; kind: string; rationale?: string }[]
  concepts?: DraftConcept[]
  rejected?: {
    edges: { from: string; to: string; type: string; reason: string }[]
    steps: { id: string; reason: string }[]
  }
  cycles?: string[][]
  problems?: string[]
  module?: string
  error?: string
}

const MAX_BYTES = 32 * 1024 * 1024

export default function ImportReview() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (file.size > MAX_BYTES) {
      setResult({ error: `That archive is ${(file.size / 1_048_576).toFixed(1)} MB; the limit is 32 MB.` })
      return
    }
    setBusy(true)
    setResult(null)
    setFileName(file.name)
    try {
      const response = await authedFetch('/api/learn/import', {
        method: 'POST',
        // Raw bytes, matching the route. No multipart — there is one file and no
        // fields, and a boundary would only be something else to get wrong.
        headers: { 'Content-Type': 'application/zip' },
        body: await file.arrayBuffer(),
      })
      setResult((await response.json()) as ImportResponse)
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : 'the upload failed' })
    } finally {
      setBusy(false)
    }
  }

  const copyModule = async () => {
    if (!result?.module) return
    try {
      await navigator.clipboard.writeText(result.module)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // A clipboard refusal is not worth an error banner — the textarea below is
      // selectable, which is the fallback every browser still allows.
    }
  }

  const counts = result?.counts

  return (
    <div className='space-y-3'>
      <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
        <h2 className='text-sm font-medium text-gray-200'>Import a Math Academy scrape</h2>
        <p className='mt-1 text-xs text-gray-500'>
          Capture one with the <code>math-academy-scraper</code> extension and use its
          &quot;Export to BZA&quot; button, which downloads a <code>.bza</code> archive. Nothing
          you upload here is written anywhere — this reads the archive and shows you what it
          would propose.
        </p>

        <input
          ref={input}
          type='file'
          accept='.bza,.zip,application/zip'
          className='hidden'
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) upload(file)
            // Cleared so re-picking the same file fires onChange again.
            e.target.value = ''
          }}
        />
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className='mt-3 inline-flex items-center gap-1.5 rounded bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
        >
          {busy ? <Loader2 size={12} className='animate-spin' /> : <FileUp size={12} />}
          {busy ? 'Reading…' : 'Choose a .bza archive'}
        </button>
        {fileName && !busy && <span className='ml-2 text-xs text-gray-500'>{fileName}</span>}
      </div>

      {result?.error && (
        <p className='flex items-start gap-2 rounded border-l-2 border-red-700 bg-red-950/30 px-3 py-2 text-xs text-red-200'>
          <AlertCircle size={14} className='mt-0.5 shrink-0' /> {result.error}
        </p>
      )}

      {result?.problems && result.problems.length > 0 && (
        <div className='rounded border-l-2 border-amber-600 bg-amber-950/30 px-3 py-2 text-xs text-amber-200'>
          <p className='font-medium'>Problems with the archive itself</p>
          <ul className='mt-1 list-disc space-y-0.5 pl-4'>
            {result.problems.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      {counts && (
        <>
          {/* Said first and said plainly, because every other number here is easy
              to read as a count of things that got imported. */}
          <p className='rounded border-l-2 border-sky-700 bg-sky-950/30 px-3 py-2 text-xs text-sky-200'>
            <strong>Nothing was written.</strong> {result?.appliedNote}
          </p>

          <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            <Stat label='Topics scraped' value={counts.topicsScraped} />
            <Stat label='Concepts drafted' value={counts.conceptsDrafted} note='all blocked' />
            <Stat label='Candidate edges' value={counts.edgesAccepted} note='none promoted' />
            <Stat label='Edges refused' value={counts.edgesRejected} note='see below' />
          </div>

          <div className='rounded-lg border border-gray-800 bg-gray-900 p-4 text-xs text-gray-300'>
            <ul className='space-y-1'>
              {result?.summary?.map(line => <li key={line}>{line}</li>)}
            </ul>
            {result?.promotion && (
              <p className='mt-2 border-t border-gray-800 pt-2 text-gray-500'>
                Concept promotion: {result.promotion.authored} of {result.promotion.drafted} drafted
                concepts have been authored into the ontology
                ({Math.round(result.promotion.rate * 100)}%).
              </p>
            )}
          </div>

          {result?.cycles && result.cycles.length > 0 && (
            <div className='rounded border-l-2 border-amber-600 bg-amber-950/30 px-3 py-2 text-xs text-amber-200'>
              <p className='font-medium'>
                {result.cycles.length} prerequisite cycle(s) among the candidates
              </p>
              <p className='mt-0.5 text-amber-300/80'>
                Evidence the scraper&apos;s link heuristics misfired on some page. Candidates
                participate in no walk, so nothing is broken by these — but neither edge in a
                loop should be promoted without deciding which direction is real.
              </p>
              <ul className='mt-1 space-y-0.5 font-mono'>
                {result.cycles.map(loop => (
                  <li key={loop.join()}>{loop.join(' → ')} → {loop[0]}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── the drafts ──────────────────────────────────────────── */}
          <div className='space-y-2'>
            {result?.concepts?.map(concept => (
              <div key={concept.id} className='rounded-lg border border-gray-800 bg-gray-900'>
                <button
                  onClick={() => setOpen(open === concept.id ? null : concept.id)}
                  className='flex w-full items-start justify-between gap-3 px-4 py-3 text-left'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm text-gray-200'>{concept.name}</p>
                    <p className='mt-0.5 font-mono text-[11px] text-gray-500'>{concept.id}</p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1.5'>
                    <Pill tone={concept.source.origin === 'edge-label' ? 'red' : 'gray'}>
                      {concept.source.origin === 'edge-label' ? 'link label only' : 'scraped'}
                    </Pill>
                    <Pill tone='amber'>{concept.fidelity}</Pill>
                    <Pill tone='red'>{concept.blocking.length} blocked</Pill>
                  </div>
                </button>

                {open === concept.id && (
                  <div className='space-y-3 border-t border-gray-800 px-4 py-3 text-xs'>
                    <p className='text-amber-200/90'>{concept.caveat}</p>

                    <Section title='What must be authored before this is a concept'>
                      <ul className='list-disc space-y-0.5 pl-4 text-gray-400'>
                        {concept.blocking.map(b => <li key={b}>{b}</li>)}
                      </ul>
                    </Section>

                    {concept.source.url && (
                      <p className='text-gray-500'>
                        Source:{' '}
                        <a href={concept.source.url} target='_blank' rel='noreferrer' className='text-sky-400 hover:underline'>
                          {concept.source.url}
                        </a>
                      </p>
                    )}
                    <p className='text-gray-500'>
                      Steps: {concept.source.stepCounts.tutorial} tutorial,{' '}
                      {concept.source.stepCounts.example} example,{' '}
                      {concept.source.stepCounts.question} question
                      {concept.source.stepCounts.unknown > 0 && <>, {concept.source.stepCounts.unknown} unread</>}
                      {concept.suggestedTaskKinds.length > 0 && (
                        <> · suggests {concept.suggestedTaskKinds.join(', ')} (a hint, not an objective)</>
                      )}
                    </p>

                    {concept.draftKnowledgePoints.length > 0 && (
                      <Section title={`${concept.draftKnowledgePoints.length} draft knowledge point(s)`}>
                        <div className='space-y-2'>
                          {concept.draftKnowledgePoints.map(point => (
                            <div key={point.id} className='rounded border border-gray-800 bg-gray-950 p-2'>
                              <p className='text-gray-300'>{point.statement}</p>
                              {point.unlabelledExample && (
                                <div className='mt-1.5 space-y-1'>
                                  <p className='text-[11px] text-gray-500'>
                                    Problem: <span className='text-gray-400'>{point.unlabelledExample.problem}</span>
                                  </p>
                                  {/* Shown as one block, which is what it is. The
                                      subgoal labels are the authoring step. */}
                                  <p className='text-[11px] text-gray-500'>
                                    Explanation, unsplit:{' '}
                                    <span className='text-gray-400'>{point.unlabelledExample.solution}</span>
                                  </p>
                                </div>
                              )}
                              {point.latex.length > 0 && (
                                <p className='mt-1 font-mono text-[11px] text-emerald-300/70'>
                                  {point.latex.join('  ·  ')}
                                </p>
                              )}
                              <ul className='mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-red-300/80'>
                                {point.blocking.map(b => <li key={b}>{b}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}

                    {concept.draftTasks.length > 0 && (
                      <Section title={`${concept.draftTasks.length} draft task(s) — none is a practice task`}>
                        <div className='space-y-2'>
                          {concept.draftTasks.map(task => (
                            <div key={task.id} className='rounded border border-gray-800 bg-gray-950 p-2'>
                              <p className='text-gray-300'>{task.prompt}</p>
                              {task.parsable.length > 0 && (
                                <p className='mt-1 font-mono text-[11px] text-emerald-300/70'>
                                  {task.parsable.length}/{task.latex.length} parse:{' '}
                                  {task.parsable.map(f => f.infix).join('  ·  ')}
                                </p>
                              )}
                              {task.scrapedAnswer && (
                                <p className='mt-1 text-[11px] text-amber-300/80'>
                                  Scraped answer (the learner&apos;s, possibly wrong):{' '}
                                  <span className='font-mono'>{task.scrapedAnswer}</span>
                                </p>
                              )}
                              <ul className='mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-red-300/80'>
                                {task.blocking.map(b => <li key={b}>{b}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── edges, accepted and refused, at equal weight ─────────── */}
          {result?.edges && result.edges.length > 0 && (
            <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
              <h3 className='text-xs font-medium text-gray-300'>
                {result.edges.length} candidate prerequisite(s) — none gates anything
              </h3>
              <ul className='mt-2 space-y-1.5 text-[11px]'>
                {result.edges.map(edge => (
                  <li key={edge.id}>
                    <span className='font-mono text-gray-300'>{edge.from} → {edge.to}</span>
                    {edge.rationale && <p className='text-gray-500'>{edge.rationale}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result?.rejected && (result.rejected.edges.length > 0 || result.rejected.steps.length > 0) && (
            <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
              <h3 className='text-xs font-medium text-gray-300'>
                Refused — shown so the refusals are reviewable, not hidden
              </h3>
              {result.rejected.edges.length > 0 && (
                <ul className='mt-2 space-y-1.5 text-[11px]'>
                  {result.rejected.edges.map((edge, i) => (
                    <li key={`${edge.from}-${edge.to}-${i}`}>
                      <span className='font-mono text-gray-400'>
                        {edge.from} → {edge.to} [{edge.type}]
                      </span>
                      <p className='text-gray-500'>{edge.reason}</p>
                    </li>
                  ))}
                </ul>
              )}
              {result.rejected.steps.length > 0 && (
                <ul className='mt-2 space-y-1 text-[11px] text-gray-500'>
                  {result.rejected.steps.map((step, i) => (
                    <li key={`${step.id}-${i}`}>
                      <span className='font-mono text-gray-400'>{step.id}</span> — {step.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── the output that matters ──────────────────────────────── */}
          {result?.module && (
            <div className='rounded-lg border border-gray-800 bg-gray-900 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h3 className='text-xs font-medium text-gray-300'>The draft, as TypeScript</h3>
                  <p className='mt-0.5 text-[11px] text-gray-500'>
                    This is the output to act on. Save it under <code>lib/concepts/</code>, read the
                    blockers next to each draft, and author what survives into{' '}
                    <code>ontology.ts</code> by hand. It will not typecheck as an ontology, on
                    purpose.
                  </p>
                </div>
                <button
                  onClick={copyModule}
                  className='inline-flex shrink-0 items-center gap-1.5 rounded bg-gray-800 px-2.5 py-1.5 text-[11px] text-gray-200 hover:bg-gray-700'
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                readOnly
                value={result.module}
                spellCheck={false}
                className='mt-2 h-64 w-full resize-y rounded bg-gray-950 p-2 font-mono text-[11px] text-gray-300 focus:outline-none'
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className='rounded-lg border border-gray-800 bg-gray-900 px-3 py-2'>
      <p className='text-lg font-semibold text-gray-100'>{value}</p>
      <p className='text-[11px] text-gray-400'>{label}</p>
      {note && <p className='text-[10px] text-gray-600'>{note}</p>}
    </div>
  )
}

function Pill({ tone, children }: { tone: 'gray' | 'amber' | 'red'; children: React.ReactNode }) {
  const tones = {
    gray: 'bg-gray-800 text-gray-300',
    amber: 'bg-amber-950 text-amber-300',
    red: 'bg-red-950 text-red-300',
  }
  return <span className={`rounded px-1.5 py-0.5 text-[10px] ${tones[tone]}`}>{children}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className='mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500'>{title}</p>
      {children}
    </div>
  )
}
